import {
  CommandInteraction,
  CacheType,
  GuildMember,
  AttachmentBuilder,
  User,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import {
  Player,
  Playlist,
  Track,
  useMainPlayer,
  useQueue
} from "discord-player";
import {
  YoutubeExtractor,
  SoundCloudExtractor,
  AttachmentExtractor
} from "@discord-player/extractor";
import CommandEmbed from "../../../core/Command/CommandEmbed";
import { YandexMusicExtractor } from "discord-player-yandexmusic";
import LyricsCommand from "./lyrics";

export class YMConfig {
  access_token: string;
  uid: number;
  constructor() {
    (this.access_token = "your_auth_token"), (this.uid = 0);
  }
}

export default class PlayCommand extends Command {
  constructor() {
    super(new CommandOptions("play").setName("MusicPlay"));

    this.slashCommandInfo
      .setDescription("Play music")
      .addStringOption((o) =>
        o
          .setName("query")
          .setDescription("Ссылка/название песни")
          .setRequired(true)
      )
      .addBooleanOption((o) =>
        o
          .setName("shuffle")
          .setDescription(
            "Перемешать если плейлист/альбом. По умолчанию: false"
          )
      );
  }

  async onInit(client: CustomClient): Promise<void> {
    const ymconfig =
      this.readConfig<YMConfig>() ?? this.writeConfig(new YMConfig());

    const player = new Player(client);
    player.extractors.register(YoutubeExtractor, {});
    player.extractors.register(SoundCloudExtractor, {});
    player.extractors.register(AttachmentExtractor, {});
    player.extractors.register(YandexMusicExtractor, ymconfig);
    this.logger.info(
      "Player created.".gray,
      player.extractors.size,
      "extractor registered.".gray
    );
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const query = interaction.options.get("query")?.value as string;

    const shuffle =
      (interaction.options.get("shuffle")?.value as boolean) ?? false;

    const channel =
      interaction.member instanceof GuildMember
        ? interaction.member.voice.channel
        : undefined;

    if (!channel)
      return interaction.reply({
        embeds: [
          CommandEmbed.error("Сначала подключитесь к голосовому каналу!")
        ]
      });

    const queue = useQueue(interaction.guildId as string);

    if (queue && queue.channel?.id != channel.id) {
      return interaction.reply({
        embeds: [
          CommandEmbed.error("Музыка уже проигрывается в другом канале.")
        ]
      });
    }

    await interaction.deferReply();

    const player = useMainPlayer();
    const search = await player.search(query, {
      requestedBy: interaction.user.id
    });

    if (!search?.hasTracks()) {
      return interaction.followUp({
        embeds: [CommandEmbed.error("Не найдено треков.")]
      });
    }

    if (search.playlist && shuffle) this.sufflePlaylist(search.playlist);

    const embed = search.playlist
      ? this.buildEmbedPlaylist(search.playlist, search.requestedBy)
      : this.buildEmbedTrack(search.tracks[0], search.requestedBy);

    const track = search.tracks[0];
    const stream = track.extractor?.stream(track);

    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    if (search.playlist) {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("shuffle")
          .setLabel("Перемешать")
          .setEmoji("🔀")
          .setStyle(ButtonStyle.Primary)
      );
    } else {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("lyrics")
          .setLabel("Текст")
          .setEmoji("📜")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel(typeof stream == "string" ? "Скачать" : "Ссылка на трек")
          .setStyle(ButtonStyle.Link)
          .setURL(typeof stream == "string" ? stream : track.url)
      );
    }

    const tracks = search.playlist ? search.playlist : search.tracks[0];
    player
      .play(channel, tracks, {
        nodeOptions: { metadata: interaction }
      })
      .then(async () => {
        const reply = await interaction.followUp({
          embeds: [embed],
          components: [actionRow]
        });

        try {
          const button = await reply.awaitMessageComponent({
            time: 60_000,
            filter: (i) => i.user.id == interaction.user.id
          });

          if (button.customId == "lyrics") {
            const lyricsCommand = client.getCommandByClass<LyricsCommand>(
              LyricsCommand.prototype
            );
            const trackName = track.title + " - " + track.author;
            lyricsCommand.run(await reply.fetch(), [trackName], client);
            button.update({});
          } else if (button.customId == "shuffle") {
            queue?.tracks.shuffle();
            button.reply({
              embeds: [CommandEmbed.success("Перемешано успешно (вроде)")]
            });
          }
        } catch {}
      })
      .catch((e) => {
        interaction.followUp({
          embeds: [CommandEmbed.error("Что-то пошло не так...")],
          files: [
            new AttachmentBuilder(Buffer.from(e.message as string), {
              name: "error.txt"
            })
          ]
        });
      });
  }

  private buildEmbedPlaylist(playlist: Playlist, requested_by?: User | null) {
    return CommandEmbed.blankEmbed()
      .setTitle(playlist.title)
      .setURL(playlist.url)
      .setThumbnail(playlist.thumbnail)
      .setAuthor({
        name: playlist.author.name,
        url: playlist.author.url
      })
      .addFields(
        {
          name: "Количество треков",
          value: `${playlist.tracks.length} треков`,
          inline: true
        },
        {
          name: "Длительность",
          value: playlist.durationFormatted,
          inline: true
        },
        {
          name: "Добавлено",
          value: requested_by?.username ?? "Неизвестно",
          inline: true
        },
        { name: "Описание", value: playlist.description }
      )
      .setColor("Random");
  }

  private buildEmbedTrack(track: Track, requested_by?: User | null) {
    return CommandEmbed.blankEmbed()
      .setTitle(track.title)
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .setAuthor({
        name: track.author
      })
      .addFields(
        {
          name: "Длительность",
          value: track.duration,
          inline: true
        },
        {
          name: "Добавлено",
          value: requested_by?.username ?? "Неизвестно",
          inline: true
        }
      )
      .setColor("Random");
  }

  private sufflePlaylist(playlist: Playlist) {
    playlist.tracks = playlist.tracks
      .map((track) => ({ track, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ track }) => track);
  }
}
