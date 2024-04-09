import { Collection } from "discord.js";
import Command from ".";
import CustomClient from "../CustomClient";
import Config from "../Config";
import Logger from "../Logger";

const log = new Logger("CommandRegistry");

export default class CommandRegistry {
  interaction: Collection<string, Command>;
  prefix: Collection<string, Command>;
  config: Config;
  length: number;

  constructor(client: CustomClient) {
    // Command registries
    this.interaction = client.interCmd;
    this.prefix = client.prefCmd;
    this.config = client.config;
    this.length = 0;
  }

  register(command: Command) {
    if (command.type.slash)
      this.interaction.set(command.slashCommandInfo.name, command);

    if (command.type.prefix) {
      const configEntries = Object.entries(
        this.config.settings.allowPrefixCommands
      );
      configEntries.push(["name", true]);
      configEntries.forEach((entry) => {
        const commandEntry = command.prefixCommandInfo.names[entry[0]];
        if (commandEntry && entry[1]) this.prefix.set(commandEntry, command);
      });
    }

    this.length++;
  }
}