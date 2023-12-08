const discord = require("discord.js"),
  fs = require("node:fs"),
  path = require("node:path");

require("colors");

const { configDeepScan, dirDeepScan } = require("./utils/scanTools");
const deployCommands = require("./core/deployCommands");
const Logger = require("./utils/logger");

const args = (() => {
  const args = process.argv.slice(2);
  return { debug: args.includes("debug") };
})();

const log = new Logger("Main");

const configVersion = "0.0.1";

const loadtimer = Date.now();

// Loading configuration

log.info(`Importing config...`.gray);

const idealConfig = {
  bot: {
    token: "bot's token",
    prefix: "'",
    devGuildId: "guild id"
  },
  settings: {
    commandsPath: "commands",
    allowShortCommands: true,
    allowRussianCommands: true,
    autoDeploy: true,
    ignoredCommandDirs: [".lib", ".i", "libs"],
  },
  latestVersion: configVersion,
};

if (!fs.existsSync("./config.json")) {
  log.warn("Isn't it a first run of the bot?".gray);
  fs.writeFileSync("./config.json", JSON.stringify(idealConfig));
  log.info("Created new config file!".green);
  process.exit(0);
}

const config = require("./config.json");

if (config.latestVersion != configVersion) {
  configDeepScan(config, idealConfig);
  config.latestVersion = idealConfig.latestVersion;
  fs.writeFileSync("./config.json", JSON.stringify(config));
}

const { token, prefix } = config.bot;

if (!fs.existsSync(config.settings.commandsPath))
  fs.mkdirSync(config.settings.commandsPath);

if (!fs.existsSync("configs")) fs.mkdirSync("configs");

// Bot login

const bot = new discord.Client({ intents: [3276799] });
bot.login(token);

bot.interCmd = new discord.Collection();
bot.prefCmd = new discord.Collection();
bot.data = {};
bot.config = config;

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

let collected = 0;
commands.forEach((command, index) => {
  const commandname = path.basename(commandFiles[index]);
  if (command.id) {
    if (command.isPrefixCommand) {
      const settings = config.settings;
      bot.prefCmd.set(command.prefixCommandInfo.name, command);
      if (settings.allowShortCommands)
        bot.prefCmd.set(command.prefixCommandInfo.shortName, command);
      if (settings.allowRussianCommands)
        bot.prefCmd.set(command.prefixCommandInfo.ruName, command);
      if (settings.allowRussianCommands && settings.allowShortCommands) {
        bot.prefCmd.set(command.prefixCommandInfo.shortRuName, command);
      }
    }
    if (command.isSlashCommand) {
      bot.interCmd.set(command.slashCommandInfo.name, command);
    }
    collected++;
  }
  if (!command.id) {
    log.warn(
      `The command (${commandname}) is missing required properties.`.yellow
    );
  }
});
log.info(collected, `commands collected... (${Date.now() - loadtimer}ms)`.gray);

// Interactions

bot.on(discord.Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = bot.interCmd.get(interaction.commandName);
  if (!command) {
    interaction.reply({
      content: `Команда ${interaction.commandName} не существует!\nОна была либо удалена, либо перенесена.\nСвяжитесь с @kotisoff для подробностей!`,
      ephemeral: true,
    });
    log.error(`No command matching ${interaction.commandName} was found.`.gray);
    return;
  }
  try {
    if (command.name) await command.slashRun(interaction, bot);
    else await command.exec(interaction, bot);
  } catch (error) {
    log.error(error);
    let errcontent = {
      content: "Бот съехал с катушек, звоните в дурку бля.",
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

// Prefix

bot.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  let commandBody = msg.content.split(" ");
  let command = commandBody[0].toLowerCase();
  let name = bot.prefCmd.get(command.slice(prefix.length));
  if (name) {
    name.prefixRun(msg, bot);
  }
});

log.info(`Prefix commands function loaded. (${Date.now() - loadtimer}ms)`.gray);

// On ready

bot.once(discord.Events.ClientReady, (bot) => {
  let initialized = 0;
  log.info(`${bot.user.tag} is online.`.yellow);

  if (config.settings.autoDeploy) deployCommands(bot);

  commands.forEach((command) => {
    try {
      command.shareThread(bot);
      log.info(
        `${path.basename(
          commandFiles[commands.indexOf(command)]
        )} initialized... (${Date.now() - loadtimer}ms)`.gray
      );
      initialized++;
    } catch (e) {
      args.debug ? log.warn("Debug caught", e) : undefined;
    }
  });

  bot.user.setStatus("idle");
  bot.user.setActivity("за " + bot.guilds.cache.size + " серверами ._.", {
    type: discord.ActivityType.Watching,
  });

  log.info(initialized, "commands initialized.".green);
  log.info(collected, "commands total.".green);
  log.info(`Bot took ${Date.now() - loadtimer}ms to launch.`.gray);
  log.info("Bot invite link: ".gray + `https://discord.com/oauth2/authorize?client_id=${bot.application.id}&permissions=8&scope=bot`.blue);
});

process.on("unhandledRejection", (error) => {
  log.error("Unhandled promise rejection:", error);
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