import {
  CommandInteraction,
  CacheType,
  GuildMember,
  AttachmentBuilder
} from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { YandexMusicExtractor } from "discord-player-yandexmusic";
import { Player, useMainPlayer, usePlayer, useQueue } from "discord-player";
import {
  AttachmentExtractor,
  YoutubeExtractor
} from "@discord-player/extractor";
import CommandEmbed from "../../../core/Command/CommandEmbed";

class YMConfig {
  access_token: string;
  uid: number;
  constructor() {
    (this.access_token = "your_auth_token"), (this.uid = 0);
  }
}

export default class PlayCommand extends Command {
  constructor() {
    super(new CommandOptions("play", { prefix: true }).setName("MusicPlay"));

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
    player.extractors.register(AttachmentExtractor, {});
    player.extractors.register(YandexMusicExtractor, config);
    player.extractors.register(YoutubeExtractor, {});
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

    interaction.deferReply();

    const player = useMainPlayer();
    const search = await player.search(query, {
      requestedBy: interaction.user.id
    });

    if (!search?.hasTracks()) {
      return interaction.followUp({
        embeds: [CommandEmbed.error("Не найдено треков.")]
      });
    }

    const reply = search.playlist
      ? `Добавлен плейлист: \`${search.playlist.title} - ${search.playlist.author.name}\` с ${search.tracks.length} песнями.`
      : `Добавлено в очередь: \`${search.tracks[0].title} - ${search.tracks[0].author}\` (${search.tracks[0].duration})`;

    player
      .play(channel, search.playlist ? search.playlist : search.tracks[0], {
        nodeOptions: { metadata: interaction }
      })
      .then(() => {
        interaction.followUp({ embeds: [CommandEmbed.info(reply)] });
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
}
