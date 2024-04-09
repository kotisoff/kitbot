import Config from "../Config";
import CustomClient from "../CustomClient";
import Logger from "../Logger";
const log = new Logger("CommandRuntime");

export default class CommandRuntime {
  client: CustomClient;
  config: Config;

  constructor(client: CustomClient, config: Config) {
    this.client = client;
    this.config = config;
  }

  async listenSlashCommands() {
    return this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;
      const command = this.client.interCmd.get(interaction.commandName);
      if (!command) {
        interaction.reply({
          content: `Command ${interaction.commandName} doesn't exist!`,
          ephemeral: true
        });
        log.error(
          `No command matching "${interaction.commandName}" was found.`.gray
        );
        return;
      }
      try {
        if (command.runSlash) command.runSlash(interaction, this.client);
        if (command.run) {
          const args = interaction.options.data.map((v) =>
            v.value?.toString()
          ) as string[];
          command.run(interaction, args, this.client);
        }
      } catch (err) {
        log.error(interaction.commandName.red, "throwed exception".red, err);

        const errorMessage = {
          content: "This command is not working...",
          ephemeral: true
        };

        if (interaction.replied) interaction.followUp(errorMessage);
        else interaction.reply(errorMessage);
      }
    });
  }

  async listenPrefixCommands() {
    const prefix = this.config.bot.prefix;

    this.client.on("messageCreate", async (msg) => {
      if (msg.author.bot || !msg.content.startsWith(prefix)) return;

      const args = msg.content.split(" ");
      const commandName = args[0].toLowerCase().slice(prefix.length);
      const command = this.client.prefCmd.get(commandName);
      if (!command) return;
      args.shift();

      try {
        if (command.runPrefix) command.runPrefix(msg, args, this.client);
        if (command.run) command.run(msg, args, this.client);
      } catch (err) {
        log.error(commandName.red, "throwed exception".red, err);
        msg.reply("This command is not working...");
      }
    });
  }
}
