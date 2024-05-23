import {
  CommandInteraction,
  CacheType,
  Attachment,
  TextChannel,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import CommandEmbed from "../../core/Command/CommandEmbed";

type CommandConfig = { requestChannel: string };

export default class RequestCommandCommand extends Command {
  constructor() {
    super(new CommandOptions("requestcommand"));

    this.slashCommandInfo
      .setDescription(
        "Создай команду и отправь её мне на проверку!\n" +
          'Директория: "~/commands/userscripts/ваш_username/"'
      )
      .addStringOption((o) =>
        o
          .setName("description")
          .setDescription(
            "Описание команды. Почему я должен её добавить? Что она делает?"
          )
          .setRequired(true)
      )
      .addAttachmentOption((o) =>
        o
          .setName("commandscript")
          .setDescription(
            "Скрипт написанный при помощи TMKSpace/KitBotCmdDevKit (github)"
          )
          .setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("directory").setDescription("Подкаталог для команды.")
      );
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const description = interaction.options.get("description")?.value as string;
    const file = interaction.options.get("commandscript")
      ?.attachment as Attachment;

    if (!file.name.endsWith(".ts"))
      return interaction.reply({
        embeds: [CommandEmbed.error("Скрипт должен оканчиваться на .ts!")],
        ephemeral: true
      });

    const data = await fetch(file.url);
    if (!data.ok) {
      return interaction.reply({
        embeds: [
          CommandEmbed.error("Ошибка при загрузке команды. Попробуйте ещё раз.")
        ],
        ephemeral: true
      });
    }

    const requestChannel =
      this.readConfig<CommandConfig>()?.requestChannel ??
      this.writeConfig<CommandConfig>({
        requestChannel: "1240768951009542286"
      }).requestChannel;

    const accept = new ButtonBuilder()
      .setCustomId("accept")
      .setLabel("Принять")
      .setStyle(ButtonStyle.Success);

    const decline = new ButtonBuilder()
      .setCustomId("decline")
      .setLabel("Отклонить")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(accept, decline);

    const channel = (await interaction.client.channels.fetch(
      requestChannel
    )) as TextChannel;
    channel
      .send({
        embeds: [
          CommandEmbed.info({
            title: "New command request",
            color: "Blurple",
            content: `Author: ${interaction.user.username}\nDescription:\n${description}`
          })
        ]
      })
      .then((m) => m.reply({ files: [file] }));

    interaction.reply({
      embeds: [CommandEmbed.success("Command request sent!")],
      ephemeral: true
    });
  }
}
