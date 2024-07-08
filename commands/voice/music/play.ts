import {
  CommandInteraction,
  CacheType,
  GuildMember,
  AttachmentBuilder,
  User
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
        o.setName("query").setDescription("query").setRequired(true)
      );
  }

  async onInit(client: CustomClient): Promise<void> {
    const config =
      this.readConfig<YMConfig>() ?? this.writeConfig(new YMConfig());

    const player = new Player(client);
    player.extractors.register(YoutubeExtractor, {});
    player.extractors.register(SoundCloudExtractor, {});
    player.extractors.register(AttachmentExtractor, {});
    player.extractors.register(YandexMusicExtractor, config);
    this.logger.info("Player created.".gray);
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const query = interaction.options.get("query")?.value as string;
    if (!query) {
      return interaction.reply({
        embeds: [CommandEmbed.error("Введите промпт.")]
      });
    }

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

    const embed = search.playlist
      ? this.buildEmbedPlaylist(search.playlist, search.requestedBy)
      : this.buildEmbedTrack(search.tracks[0], search.requestedBy);

    player
      .play(channel, search.playlist ? search.playlist : search.tracks[0], {
        nodeOptions: { metadata: interaction }
      })
      .then(() => {
        interaction.followUp({ embeds: [embed] });
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

    if (search.playlist) {
      queue?.tracks.shuffle();
      interaction.followUp({
        embeds: [CommandEmbed.info("Плейлист автоматически перемешан.")]
      });
    }
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
}
