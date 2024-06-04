import {
  Message,
  CommandInteraction,
  CacheType,
  ApplicationCommand,
  Routes
} from "discord.js";
import Command from "../core/Command";
import CommandOptions from "../core/Command/CommandOptions";
import CustomClient from "../core/CustomClient";
import CommandEmbed from "../core/Command/CommandEmbed";

// Options
const color = "#d18400";

type commandHelp = {
  aliases: {
    prefix?: string[];
    slash?: string;
  };
  description: string;
};

export default class HelpCommand extends Command {
  help: Map<string, commandHelp>;

  constructor() {
    super(new CommandOptions("help").setType({ prefix: true }));

    this.slashCommandInfo
      .setDescription("Shows help.")
      .addStringOption((o) =>
        o.setName("commandname").setDescription("Command name")
      );
    this.prefixCommandInfo.addAlias("хелп");

    this.help = new Map();
  }

  async onInit(client: CustomClient): Promise<void> {
    client.prefCmd.concat(client.interCmd).forEach((command, key) => {
      const commandHelp: commandHelp = {
        aliases: {},
        description: command.slashCommandInfo.description
      };
      if (command.type.prefix) {
        const names = command.prefixCommandInfo.names;
        commandHelp.aliases.prefix = names;
      }
      if (command.type.slash) {
        commandHelp.aliases.slash = command.slashCommandInfo.name;
      }
      this.help.set(key, commandHelp);
    });
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    // Получение команды из аргументов
    const commandName = args[0];
    const command = commandName
      ? [...this.help.values()].find(
          (v) =>
            v.aliases.prefix?.includes(commandName) ||
            v.aliases.slash == commandName
        )
      : undefined;

    // Получение всех команд бота
    const commands = (await client.rest.get(
      Routes.applicationCommands(client.user.id)
    )) as ApplicationCommand[];

    // Если есть аргумент
    if (command) {
      return message.reply({
        embeds: [
          CommandEmbed.info({
            color,
            title: command.aliases.slash ?? command.aliases.prefix?.[0],
            content: this.generateCommandDescription(command, message, commands)
          })
        ]
      });
    } else if (commandName) {
      return message.reply({
        embeds: [CommandEmbed.error("Command not found.")]
      });
    }

    // Иначе показываем все команды
    // В перспективе добавить menus action и перелистывать категории. Но их ещё как то нужно добавить
    return message.reply({
      embeds: [
        CommandEmbed.info({
          color,
          title: "Help - All commands"
        }).addFields(
          [...this.help.entries()].map(([key, cmd]) => ({
            name: key,
            value: this.generateCommandDescription(cmd, message, commands),
            inline: true
          }))
        )
      ]
    });
  }

  // Генерируем описание команды с использованиями
  private generateCommandDescription(
    cmd: commandHelp,
    message: Message | CommandInteraction,
    commands: ApplicationCommand[]
  ) {
    return (
      // Описание
      cmd.description +
      "\n" +
      // Если есть, префиксы
      (cmd.aliases.prefix
        ? "Prefix: `" +
          cmd.aliases.prefix
            .map((v) => (message.client as CustomClient).config.bot.prefix + v)
            .join(", ") +
          "`\n"
        : "") +
      // Если есть, слеш
      (cmd.aliases.slash
        ? `Slash: </${cmd.aliases.slash}:${
            commands.find((v) => v.name == cmd.aliases.slash)?.id
          }>`
        : "")
    );
  }
}
