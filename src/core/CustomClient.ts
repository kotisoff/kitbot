import { Client, ClientOptions, Collection } from "discord.js";
import Command from "./Command";
import Config from "./Config";
import Event from "./Event";

export default class CustomClient extends Client<true> {
  /** Interaction/Slash commands */
  interCmd: Collection<string, Command>;
  /** Prefix commands */
  prefCmd: Collection<string, Command>;
  /** All commands (use instead of concating interCmd and prefCmd) */
  allCmd: Collection<string, Command>;

  /** Reigstered events */
  events: Collection<string, Event>;

  /** Any your data */
  data: any[];
  /** Configuration of bot */
  config: Config;

  constructor(options: ClientOptions, config: Config) {
    super(options);

    this.interCmd = new Collection();
    this.prefCmd = new Collection();
    this.allCmd = new Collection();

    this.events = new Collection();

    this.data = new Array();
    this.config = config;
  }

  getCommandByClass<CommandType = Command>(Class: Command): CommandType {
    const commands = this.prefCmd.concat(this.interCmd);
    return commands.find(
      (v) => v.constructor.name == Class.constructor.name
    ) as CommandType;
  }
}
