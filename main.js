const discord = require("discord.js"),
  fs = require("node:fs"),
  path = require("node:path");

require("colors");

const { configDeepScan, dirDeepScan } = require("./assets/utils").Scan;

const package = require("./package.json");

const loadtimer = Date.now();

// Loading configuration

console.log("[Main]", `Importing config...`.gray);

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
    autodeploy: true,
    ignoredCommandDirs: [".lib", ".i"],
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
console.log(
  "[Main]",
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
  } else if (command.data) {
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
    console.log(
      "[Main]",
      "[WARNING]".red +
      ` The command (${commandname}) is missing required properties.`.yellow
    );
  }
});
console.log(
  "[Main]",
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
    console.error(
      "[Main]",
      `No command matching ${interaction.commandName} was found.`.gray
    );
    return;
  }
  try {
    if (command.name) await command.run(interaction, bot)
    else await command.exec(interaction, bot);
  } catch (error) {
    console.error(error);
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

console.log(
  "[Main]",
  `Interactive commands function loaded. (${Date.now() - loadtimer}ms)`.gray
);

// Префикс команды

bot.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  let commandBody = msg.content.split(" ");
  let command = commandBody[0].toLowerCase();
  let name = bot.prefCmd.get(command.slice(prefix.length));
  if (name) {
    name.pexec(msg, bot);
  }
});

console.log(
  "[Main]",
  `Prefix commands function loaded. (${Date.now() - loadtimer}ms)`.gray
);

// По завершении инициализации

bot.once(discord.Events.ClientReady, (bot) => {
  console.log("[Main] " + `${bot.user.tag} is online.`.yellow);
  commands
    .filter((cmd) => cmd.shareThread)
    .forEach((command) => {
      try {
        command.shareThread(bot);
        console.log(
          "[Main]",
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
  console.log("[Main]", commands.length, "commands initialized.".green);
  console.log("[Main]", `Bot took ${Date.now() - loadtimer}ms to launch.`.gray);
});

process.on("unhandledRejection", (error) => {
  console.log("Unhandled promise rejection:", error);
});

process.on("SIGINT", () => {
  console.log("[Main] Shutting down...");
  commands.forEach((command) => {
    try {
      command.shutdown();
    } catch { }
  });
  console.log("[Main] Bye!");
  bot.destroy();
  process.exit();
});

let cycle = 0;
setInterval(() => {
  if (process.argv.slice(2)[0] === "debug")
    console.log("Still alive. Cycle:", cycle);
  cycle++;
}, 1000);