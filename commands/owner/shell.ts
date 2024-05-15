import { Message, CommandInteraction, CacheType } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import ChildProcess from "child_process";
import owner from "./owner";
import textCompress from "./textCompress";

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
    let uid: string;
    if (message instanceof Message) uid = message.author.id;
    else uid = message.user.id;
    if (!owner.ownerIds.includes(uid))
      return message.reply("You are not owner of this bot.");

    ChildProcess.exec(args.join(" ") ?? "help", (e, out, err) => {
      message.reply(
        textCompress("Error: " + e ?? 0, "output.txt", out + "\n" + err)
      );
    });
  }
}
