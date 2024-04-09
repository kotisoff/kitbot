process.chdir(__dirname);
import Logger from "./core/Logger";
const log = new Logger("Main");

log.info("\x1b[90mImporting modules...\x1b[0m");

const timer = Date.now();

import fs from "fs";
import "colors";

import { Events } from "discord.js";
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
const { token, prefix, intents } = config.bot;

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

// Ready

client.once(Events.ClientReady, () => {
  log.info(`${client.user.tag} is online.`.yellow);

  if (config.settings.autoDeploy) deployCommands(client);

  commands.forEach((command) => {
    command.onInit();
  });
});
