import { CommandInteraction, CacheType } from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { useQueue } from "discord-player";
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
            { name: "Текущий трек", value: "current" },
            { name: "Список воспроизведения", value: "list" },
            { name: "Перемешать", value: "shuffle" },
            { name: "Остановить", value: "stop" }
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
    } else if (param == "current") {
      const track = queue.currentTrack;
      return await interaction.reply(
        `Текущий трек: \`${track?.title} - ${
          track?.author
        }\` ${queue.node.createProgressBar()}`
      );
    } else if (param == "list") {
      const tracks = [queue.currentTrack, ...queue.tracks.data];

      const embed = CommandEmbed.info({
        title: `Список воспроизведения (Всего: ${tracks.length})`
      }).addFields(
        ...tracks.slice(0, 25).map((track) => ({
          name: `${track?.title} - ${track?.author}`,
          value: `Добавлено ${track?.requestedBy?.username}`
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
    }
  }
}
