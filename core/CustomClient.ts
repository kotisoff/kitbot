import { Client, ClientOptions, Collection } from "discord.js";
import Command from "./Command";
import Config from "./Config";

export default class CustomClient extends Client<true> {
  interCmd: Collection<string, Command>;
  prefCmd: Collection<string, Command>;
  data: any[];
  config: Config;

  constructor(options: ClientOptions, config: Config) {
    super(options);
    this.interCmd = new Collection();
    this.prefCmd = new Collection();
    this.data = new Array();
    this.config = config;
  }

  getCommandByClass<CommandType>(Class: Command): CommandType {
    const commands = this.prefCmd.concat(this.interCmd);
    return commands.find(
      (v) => v.constructor.name == Class.constructor.name
    ) as CommandType;
  }
}
