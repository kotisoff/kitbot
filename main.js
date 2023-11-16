const discord = require("discord.js"),
  fs = require("node:fs"),
  path = require("node:path");

require("colors");

const { configDeepScan, dirDeepScan } = require("./utils").Scan;

const log = new (require("./utils").Logger)("Main");

const package = require("./package.json");

const loadtimer = Date.now();

// Loading configuration

log.info(`Importing config...`.gray);

const idealConfig = {
  bot: {
    token: "bots_token",
    clientId: "bot_client_id",
    guildId: "guild_id",
    prefix: "'",
  },
  settings: {
    commandsPath: "commands",
    allowShortCommands: true,
    allowRussianCommands: true,
    autoDeploy: true,
    ignoredCommandDirs: [".lib", ".i", "libs"],
  },
  latestVersion: package.version,
};

if (!fs.existsSync("./config.json"))
  fs.writeFileSync("./config.json", JSON.stringify(idealConfig));

const config = require("./config.json");

if (config.latestVersion != package.version) {
  configDeepScan(config, idealConfig);
  config.latestVersion = idealConfig.latestVersion;
  fs.writeFileSync("./config.json", JSON.stringify(config));
}

const { token, prefix } = config.bot;

if (!fs.existsSync(config.settings.commandsPath))
  fs.mkdirSync(config.settings.commandsPath);

if (!fs.existsSync("configs")) fs.mkdirSync("configs");

// Логин бота

const bot = new discord.Client({ intents: [3276799] });
bot.login(token);

bot.interCmd = new discord.Collection();
bot.prefCmd = new discord.Collection();

const commands = [];

const commandsPath = path.join(__dirname, config.settings.commandsPath);
const commandFiles = [];
dirDeepScan(commandsPath, commandFiles, config);

for (const file of commandFiles) {
  commands.push(require(file));
}
log.info(
  commands.length,
  `commands loaded... (${Date.now() - loadtimer}ms)`.gray
);

// Init commands

commands.forEach((command) => {
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  const commandname = path.basename(commandFiles[commands.indexOf(command)]);
  if (command.name) {
    if (command.isPrefixCommand) {
      bot.prefCmd.set(command.prefixCommandInfo.name, command);
      if (config.settings.allowShortCommands)
        bot.prefCmd.set(command.prefixCommandInfo.shortName, command);
      if (config.settings.allowRussianCommands)
        bot.prefCmd.set(command.prefixCommandInfo.ruName, command);
    }
    if (command.isSlashCommand) {
      bot.interCmd.set(command.slashCommandInfo.name, command)
    }
  }
  if (command.data) {
    bot.interCmd.set(command.data.name, command);
  }
  if (command.pdata) {
    bot.prefCmd.set(command.pdata.name, command);
    if (config.settings.allowShortCommands)
      bot.prefCmd.set(command.pdata.shortname, command);
    if (config.settings.allowRussianCommands)
      bot.prefCmd.set(command.pdata.runame, command);
  }
  if (!command.pdata & !command.data & !command.name) {
    log.warn(
      `The command (${commandname}) is missing required properties.`.yellow
    );
  }
});
log.info(
  commands.length,
  `commands collected... (${Date.now() - loadtimer}ms)`.gray
);

// Интерактивные команды

bot.on(discord.Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = bot.interCmd.get(interaction.commandName);
  if (!command) {
    interaction.reply({
      content: `Команда ${interaction.commandName} не существует!\nОна была либо удалена, либо перенесена.\nСвяжитесь с @kotisoff для подробностей!`,
      ephemeral: true,
    });
    log.error(
      `No command matching ${interaction.commandName} was found.`.gray
    );
    return;
  }
  try {
    if (command.name) await command.slashRun(interaction, bot)
    else await command.exec(interaction, bot);
  } catch (error) {
    log.error(error);
    let errcontent = {
      content:
        "Произошёл пиздец при обработке функции! Сходите к врачу, а лучше к санитару!",
      ephemeral: true,
    };
    if (!interaction.replied) {
      await interaction.reply(errcontent);
    } else {
      await interaction.followUp(errcontent);
    }
  }
});

log.info(
  `Interactive commands function loaded. (${Date.now() - loadtimer}ms)`.gray
);

// Префикс команды

bot.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  let commandBody = msg.content.split(" ");
  let command = commandBody[0].toLowerCase();
  let name = bot.prefCmd.get(command.slice(prefix.length));
  log.info("[Debug]", bot.prefCmd, command.slice(prefix.length))
  if (name) {
    if (name.name) name.prefixRun(msg, bot);
    else name.pexec(msg, bot);
  }
});

log.info(
  `Prefix commands function loaded. (${Date.now() - loadtimer}ms)`.gray
);

// По завершении инициализации

bot.once(discord.Events.ClientReady, (bot) => {
  log.info(`${bot.user.tag} is online.`.yellow);
  commands
    .filter((cmd) => cmd.shareThread)
    .forEach((command) => {
      try {
        command.shareThread(bot);
        log.info(
          `${path.basename(
            commandFiles[commands.indexOf(command)]
          )} initialized... (${Date.now() - loadtimer}ms)`.gray
        );
      } catch { }
    });
  bot.user.setStatus("idle");
  bot.user.setActivity("за " + bot.guilds.cache.size + " серверами ._.", {
    type: discord.ActivityType.Watching,
  });
  log.info(commands.length, "commands initialized.".green);
  log.info(`Bot took ${Date.now() - loadtimer}ms to launch.`.gray);
});

process.on("unhandledRejection", (error) => {
  log.info("Unhandled promise rejection:", error);
});

process.on("SIGINT", () => {
  log.info("Shutting down...");
  commands.forEach((command) => {
    try {
      command.shutdown();
    } catch { }
  });
  log.info("Bye!");
  bot.destroy();
  process.exit();
});

let cycle = 0;
setInterval(() => {
  cycle++;
}, 1000);