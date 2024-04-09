import { Message, SlashCommandBuilder } from "discord.js";
import Command from "../core/Command";
import CommandOptions from "../core/Command/CommandOptions";
import CustomClient from "../core/CustomClient";

export default class Ping extends Command {
  constructor() {
    super(new CommandOptions("ping").setName("Ping").setType({ prefix: true }));

    this.slashCommandInfo.setDescription("Replies with pong!");
  }

  async run(
    message: Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const ping = Math.round(client.ws.ping);
    await message.reply(`Понг сука! Задержка API: ${ping}мс\n${args.join()}`);
  }

  async onInit(): Promise<void> {
    this.logger.info("Сука блять экзампле ебануца");
  }
  async shutdown(): Promise<any> {
    return true;
  }
}
