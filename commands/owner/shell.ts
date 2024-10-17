import { Message, CommandInteraction, CacheType } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import ChildProcess from "child_process";
import textCompress from "./util/textCompress";
import RebootCommand from "./reboot";

export default class ShellCommand extends Command {
  constructor() {
    super(
      new CommandOptions("shell").setName("Shell").setType({ prefix: true })
    );

    this.slashCommandInfo
      .setDescription("Runs shell commands.")
      .addStringOption((o) =>
        o.setName("command").setDescription("Command to run.").setRequired(true)
      );
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const Reboot = Command.getCommandByClass<RebootCommand>(
      client,
      RebootCommand.prototype
    );

    let uid: string;
    if (message instanceof Message) uid = message.author.id;
    else uid = message.user.id;

    if (!Reboot.ownerIds.includes(uid))
      return message.reply("You are not owner of this bot.");

    ChildProcess.exec(args.join(" ") ?? "help", (e, out, err) => {
      message.reply(
        textCompress("Error: " + e, "output.txt", out + "\n" + err)
      );
    });
  }
}
