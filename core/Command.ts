import { SlashCommandBuilder } from "discord.js";

class CommandOptions {
  id: string;
  name: string;
  type: { slash: boolean; prefix: boolean; global: boolean };

  constructor(id: string) {
    this.id = id;
    this.name = id;
    this.type = { slash: true, prefix: false, global: true };
  }
  setName(name: string) {
    this.name = name;
    return this;
  }
  setType(type = this.type) {
    this.type = type;
    return this;
  }
}

export default abstract class Command {
  id: string;
  name: string;
  type: { slash: boolean; prefix: boolean; global: boolean };

  /** @deprecated use type.global instead */
  isGlobal: boolean;
  /** @deprecated use type.slash instead */
  isSlashCommand: boolean;
  /** @deprecated use type.prefix instead */
  isPrefixCommand: boolean;

  slashCommandInfo: SlashCommandBuilder;

  constructor(options: CommandOptions) {
    this.id = options.id;
    this.name = options.name;
    this.type = options.type;

    this.isGlobal = this.type.global;
    this.isSlashCommand = this.type.slash;
    this.isPrefixCommand = this.type.prefix;

    this.slashCommandInfo = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription("");
  }

  async runSlash(): Promise<any> {}

  async runPrefix(): Promise<any> {}

  async runCombined(): Promise<any> {}

  async shutdown(): Promise<any> {}
}
