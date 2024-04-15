process.chdir(__dirname);
import Logger from "./core/Logger";
const log = new Logger("Main");

log.info("\x1b[90mImporting modules...\x1b[0m");

const timer = Date.now();

import fs from "fs";
import "colors";

import { ActivityType, Events } from "discord.js";
import scanCommandFiles from "./core/Command/commandScanner";
import Client from "./core/CustomClient";
import CommandRuntime from "./core/Command/CommandRuntime";
import deployCommands from "./core/Utils/deployCommands";
import CommandRegistry from "./core/Command/CommandRegistry";

log.info("All modules loaded".gray);

if (!fs.existsSync("./config.json")) {
  log.warn("Config is not found.".gray);
  fs.writeFileSync("../config.json", "");
  log.info("Created a new config!".green);
  process.exit(0);
}

import config from "./config.json";
const { token, intents } = config.bot;

if (!fs.existsSync(config.settings.commandPath))
  fs.mkdirSync(config.settings.commandPath);

if (!fs.existsSync("configs")) fs.mkdirSync("configs");

// Bot

const client = new Client({ intents }, config);
client.login(token);

// Importing commands.

log.info(`Importing commands. (${Date.now() - timer}ms)`.gray);

const commands = scanCommandFiles(
  config.settings.commandPath,
  config.settings.ignoredCommandDirs
);

log.info(
  commands.length,
  `commands imported... (${Date.now() - timer}ms)`.gray
);

// Registering commands

const commandRegistry = new CommandRegistry(client);
for (let command of commands) {
  commandRegistry.register(command);
}

log.info(
  commandRegistry.length,
  `commands collected... (${Date.now() - timer}ms)`.gray
);

// Init command runtime

const commandRuntime = new CommandRuntime(client, config);
commandRuntime.listenPrefixCommands();
commandRuntime.listenSlashCommands();

log.info("Command runtime started.".gray);

// Ready

client.once(Events.ClientReady, () => {
  log.info(`${client.user.tag} is online.`.yellow);

  if (config.settings.autoDeploy) deployCommands(client);

  commands.forEach((command) => {
    command.onInit(client);
  });

  client.user.setStatus("idle");
  client.user.setActivity("за " + client.guilds.cache.size + " серверами.", {
    type: ActivityType.Watching
  });

  log.info(`Bot took ${Date.now() - timer}ms to launch.`.gray);
  log.info(
    "Bot invite link:".gray,
    `https://discord.com/oauth2/authorize?client_id=${client.application.id}&permissions=8&scope=bot`
      .blue
  );
});

client.on(Events.GuildCreate, (guild) => {
  log.info(`Joined new guild: "${guild.name}" (${guild.id})`.gray);
  client.user.setActivity("за " + client.guilds.cache.size + " серверами.", {
    type: ActivityType.Watching
  });
});
client.on(Events.GuildDelete, (guild) => {
  log.info(`Left from guild: "${guild.name}" (${guild.id})`.gray);
  client.user.setActivity("за " + client.guilds.cache.size + " серверами.", {
    type: ActivityType.Watching
  });
});

process
  .on("unhandledRejection", (error) => {
    log.error("Unhandled rejection:", error);
  })
  .on("uncaughtException", (error) => {
    log.error("Uncaught exception:", error);
  })
  .on("SIGINT", () => {
    log.info("Shutting down...");
    commands.forEach((command) => command.shutdown());
    log.info("Bye!");
    client.destroy();
  });
