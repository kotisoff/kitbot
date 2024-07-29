import { Collection } from "discord.js";
import Command from ".";
import CustomClient from "../CustomClient";
import Config from "../Config";
import Logger from "../Logger";

const log = new Logger("CommandRegistry");

export default class CommandRegistry {
  interaction: Collection<string, Command>;
  prefix: Collection<string, Command>;
  all: Collection<string, Command>;
  config: Config;

  get length(): number {
    return this.interaction.concat(this.prefix).size;
  }

  constructor(client: CustomClient) {
    // Command registries
    this.interaction = client.interCmd;
    this.prefix = client.prefCmd;
    this.all = client.allCmd;
    this.config = client.config;
  }

  registerCommand(command: Command) {
    this.all.set(
      command.slashCommandInfo.name ?? command.prefixCommandInfo.names[0],
      command
    );

    if (command.type.slash)
      this.interaction.set(command.slashCommandInfo.name, command);

    if (command.type.prefix) {
      this.prefix.set(command.prefixCommandInfo.names[0], command);
    }
  }

  registerCommands(commands: Command[]) {
    for (let command of commands) {
      this.registerCommand(command);
    }
  }
}
