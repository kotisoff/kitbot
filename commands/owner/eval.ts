import { CommandInteraction, CacheType, Message } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import textCompress from "./util/textCompress";
import RebootCommand from "./reboot";

export default class EvalCommand extends Command {
  constructor() {
    super(new CommandOptions("eval").setName("Eval").setType({ prefix: true }));
    this.slashCommandInfo
      .setDescription("Evaluates your command")
      .addStringOption((o) =>
        o.setName("command").setDescription("Command to evaluate")
      )
      .addAttachmentOption((o) =>
        o.setName("scriptfile").setDescription("Script file to evaluate")
      );
  }

  private async evalTry(
    command: string,
    message: Message | CommandInteraction
  ) {
    if (command.startsWith("```js"))
      command = command.substring("```js".length, command.length);
    if (command.endsWith("```"))
      command = command.substring(0, command.length - "```".length);

    try {
      const data = eval(command);
      message.reply(textCompress("Done:", "output.txt", data?.toString()));
    } catch (err: any) {
      message.reply(
        textCompress(
          "Error while running command:",
          "error.txt",
          err?.toString()
        )
      );
      this.logger.error(err);
    }
  }

  async runPrefix(
    message: Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const Reboot = Command.getCommandByClass<RebootCommand>(
      client,
      RebootCommand.prototype
    );

    if (!Reboot.ownerIds.includes(message.author.id))
      return message.reply("Хуй ты чё сделаешь, моя команда.");

    let command = args.join(" ");
    const url = message.attachments.first()?.url;
    if (url) {
      const file = await fetch(url);
      if (file.ok) command = await file.text();
    }
    this.evalTry(command, message);
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const Reboot = Command.getCommandByClass<RebootCommand>(
      client,
      RebootCommand.prototype
    );

    if (!Reboot.ownerIds.includes(interaction.user.id))
      return interaction.reply({
        content: "Хуй ты чё сделаешь, моя команда.",
        ephemeral: true
      });

    const command = interaction.options.get("command")?.value?.toString();
    const file = interaction.options.get("scriptfile")?.attachment;

    if (command) {
      return this.evalTry(command, interaction);
    }
    if (file) {
      const data = await fetch(file.url);
      if (!data.ok) {
        return interaction.reply({
          content: "Error fetching file, try again!",
          ephemeral: true
        });
      }
      return this.evalTry(await data.text(), interaction);
    }
  }
}
