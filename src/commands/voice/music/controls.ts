import { CommandInteraction, CacheType, GuildMember } from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { useMainPlayer, useQueue, Util } from "discord-player";
import CommandEmbed from "../../../core/Command/CommandEmbed";

export default class MusicControlsCommand extends Command {
  constructor() {
    super(new CommandOptions("musiccontrols").setName("MusicControls"));

    this.slashCommandInfo
      .setDescription("Music controls.")
      .addStringOption((o) =>
        o
          .setName("parameter")
          .setDescription("Parameter")
          .addChoices(
            { name: "Пропустить", value: "skip" },
            { name: "Пауза", value: "pause" },
            { name: "Список воспроизведения", value: "list" },
            { name: "Перемешать", value: "shuffle" },
            { name: "Остановить", value: "stop" },
            { name: "Перезагрузить треки", value: "reloadtracks" }
          )
          .setRequired(true)
      );
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const param = interaction.options.get("parameter")?.value as string;

    const queue = useQueue(interaction.guildId as string);
    if (!queue)
      return interaction.reply({
        embeds: [CommandEmbed.error("В данный момент ничего воспроизводится.")]
      });

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

    if (param == "skip") {
      const track = queue.currentTrack;
      queue.node.skip();
      return interaction.reply({
        embeds: [
          CommandEmbed.success(
            `Трек \`${track?.title} - ${track?.author}\` пропущен.`
          )
        ]
      });
    } else if (param == "pause") {
      const paused = queue.node.isPaused();
      queue.node.setPaused(!paused);
      return interaction.reply({
        embeds: [
          CommandEmbed.success(
            paused
              ? "Воспроизведение продолжено."
              : "Воспроизведение приостановлено."
          )
        ]
      });
    } else if (param == "list") {
      const tracks = [queue.currentTrack, ...queue.tracks.data];

      const embed = CommandEmbed.info({
        title: `Список воспроизведения (Всего: ${tracks.length})`,
        content: `Длительность: ${Util.formatDuration(
          queue.estimatedDuration + (queue.currentTrack?.durationMS ?? 0)
        )}`
      }).addFields(
        ...tracks.slice(0, 25).map((track) => ({
          name: `${track?.title} - ${track?.author}`,
          value: `Добавлено ${track?.requestedBy?.username ?? "Неизвестно"}`
        }))
      );

      return interaction.reply({ embeds: [embed] });
    } else if (param == "shuffle") {
      queue.tracks.shuffle();
      await interaction.reply({
        embeds: [CommandEmbed.success("Треки перемешаны.")]
      });
    } else if (param == "stop") {
      queue.delete();
      await interaction.reply({
        embeds: [CommandEmbed.success("Плейлист остановлен.")]
      });
    } else if (param == "reloadtracks") {
      const tracks: string[] = [];
      tracks.push(queue.currentTrack?.url as string);
      tracks.push(...queue.tracks.map((track) => track.url));

      queue.delete();

      const player = useMainPlayer();

      setTimeout(async () => {
        for (const url of tracks) {
          await player
            .play(channel, url, { requestedBy: interaction.user })
            .catch((v) => {
              if (!interaction.channel?.isSendable()) return v;
              interaction.channel?.send(
                `Error while loading [song](<${url}>)!`
              );
              return v;
            });
        }
      }, 5000);
    }
  }
}
