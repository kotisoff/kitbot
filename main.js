const discord = require("discord.js"),
  fs = require("node:fs"),
  path = require("node:path");
require("colors");

const loadtimer = Date.now();

// Loading configuration

console.log("[Main]", "Importing config...".gray);
if (!fs.existsSync(""))
  fs.writeFileSync(
    "./config.json",
    JSON.stringify({
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
      },
    }),
  );
const config = require("./config.json");
const { token, prefix } = config.bot;

if (!fs.existsSync(config.settings.commandsPath))
  fs.mkdirSync(config.settings.commandsPath);
if (!fs.existsSync("configs")) fs.mkdirSync("configs");

const bot = new discord.Client({ intents: [3276799] });

bot.icommands = new discord.Collection();
bot.pcommands = new discord.Collection();
const commands = [];

const commandsPath = path.join(__dirname, config.settings.commandsPath);
const commandFiles = []; // fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
fs.readdirSync(commandsPath).forEach((obj) => {
  const objdir = path.join(commandsPath, obj);
  const stat = fs.lstatSync(objdir);
  if (stat.isFile()) return commandFiles.push(objdir);
  commandFiles.push(
    ...fs
      .readdirSync(objdir)
      .filter((f) => f.endsWith(".js"))
      .map((file) => path.join(objdir, file)),
  );
});
console.log(commandFiles);
for (const file of commandFiles) {
  const command = require(file);
  try {
    command.load();
  } catch {}
  commands.push(command);
}

// Find packages

// const packages = commands.filter(command => command.package)

// packages.forEach(file => {
// 	commands.splice(commands.indexOf(file), 1)
// 	file.package.forEach(subfile => {
// 		commands.push(require(path.join(commandsPath, file.path, subfile)));
// 	})
// })

// Init commands

commands.forEach((command) => {
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  const commandname = commandFiles[commands.indexOf(command)];
  if (command.idata) {
    bot.icommands.set(command.idata.name, command);
  }
  if (command.pdata) {
    bot.pcommands.set(command.pdata.name, command);
    if (config.settings.allowShortCommands)
      bot.pcommands.set(command.pdata.shortname, command);
    if (config.settings.allowRussianCommands)
      bot.pcommands.set(command.pdata.runame, command);
  }
  if (!command.pdata & !command.idata) {
    console.log(
      "[WARNING]".red +
        ` The command (${commandname}) is missing required properties.`.yellow,
    );
  }
});

// Интерактивные команды

bot.on(discord.Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = bot.icommands.get(interaction.commandName);
  if (!command) {
    interaction.reply({
      content: `Команда ${interaction.commandName} не существует!\nОна была либо удалена, либо перенесена.\nСвяжитесь с @kotisoff для подробностей!`,
      ephemeral: true,
    });
    console.error(
      "[Main]",
      `No command matching ${interaction.commandName} was found.`.gray,
    );
    return;
  }
  try {
    await command.iexec(interaction, bot);
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

// Префикс команды

bot.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  let commandBody = msg.content.split(" ");
  let command = commandBody[0].toLowerCase();
  let args = commandBody.slice(1);
  let name = bot.pcommands.get(command.slice(prefix.length));
  if (name) {
    name.pexec(bot, msg, args);
  }
});

// По завершении инициализации

bot.once(discord.Events.ClientReady, (bot) => {
  console.log("[Main] " + `${bot.user.tag} is online.`.yellow);
  bot.user.setStatus("idle");
  bot.user.setActivity("за " + bot.guilds.cache.size + " серверами ._.", {
    type: discord.ActivityType.Watching,
  });
  commands.concat(packages).forEach((command) => {
    try {
      command.shareThread(bot);
    } catch {}
  });
  console.log("[Main]", commands.length, "commands initialized.".green);
  console.log("[Main]", `Bot took ${Date.now() - loadtimer}ms to launch.`.gray);
  delete loadtimer;
});

// Логин бота

bot.login(token);

process.on("unhandledRejection", (error) => {
  console.log("Unhandled promise rejection:", error);
});

process.on("SIGINT", () => {
  console.log("[Main] Shutting down...");
  commands.forEach((command) => {
    try {
      command.shutdown();
    } catch {}
  });
  console.log("[Main] Bye!");
  bot.destroy();
  process.exit();
});
