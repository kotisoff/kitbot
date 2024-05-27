import { CacheType, CommandInteraction, Message } from "discord.js";
import Command from "../core/Command";
import CommandOptions from "../core/Command/CommandOptions";
import CustomClient from "../core/CustomClient";

export default class PingCommand extends Command {
  constructor() {
    super(new CommandOptions("ping").setName("Ping").setType({ prefix: true }));

    this.slashCommandInfo.setDescription("Replies with pong!");
  }

  async run(
    message: Message<boolean> | CommandInteraction<CacheType>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const ping = Math.round(client.ws.ping);
    message.reply(`Понг сука! Задержка API: ${ping}мс`);
  }
}
