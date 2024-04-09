import {
  Message,
  CommandInteraction,
  CacheType,
  SlashCommandBuilder
} from "discord.js";
import Command from "../core/Command";
import CommandOptions from "../core/Command/CommandOptions";
import CustomClient from "../core/CustomClient";

export default class test extends Command {
  async onInit(): Promise<void> {
    return;
  }
  async shutdown(): Promise<void> {
    return;
  }
  constructor() {
    super(
      new CommandOptions("test")
        .setName("Test")
        .setType({ slash: true, prefix: true, global: true })
    );
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    message.reply(args.join(" "));
  }

  async runPrefix(
    message: Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {}
}
