process.chdir(__dirname);
import Logger from "./core/Logger";
const log = new Logger("Main");

log.info("\x1b[90mImporting modules...\x1b[0m");

import fs from "fs";
import "colors";

import CommandScanner from "./core/Command/CommandScanner";
import Client from "./core/CustomClient";
import CommandRuntime from "./core/Command/CommandRuntime";
import CommandRegistry from "./core/Command/CommandRegistry";
import Config from "./core/Config";
import EventScanner from "./core/Event/EventScanner";
import EventHandler from "./core/Event/EventHandler";
import { timer } from "./core/Utils/reusedUtils";

log.info("All modules loaded".gray);

if (!fs.existsSync("../config.json")) {
  log.warn("Config not found.".gray);
  fs.writeFileSync("../config.json", JSON.stringify(new Config()));
  log.info("Created a new config!".green);
  process.exit(0);
}

const config = JSON.parse(
  fs.readFileSync("../config.json").toString()
) as Config;
const { token, intents } = config.bot;

if (!fs.existsSync(config.settings.commandPath))
  fs.mkdirSync(config.settings.commandPath);

if (!fs.existsSync("configs")) fs.mkdirSync("configs");

// Bot

const client = new Client({ intents }, config);
client.login(token);

// Importing commands.

log.info(`Importing commands. (${timer.now}ms)`.gray);

const commandScanner = new CommandScanner(config);
const commands = commandScanner.importCommands();

log.info(commands.length, `commands imported... (${timer.now}ms)`.gray);

// Registering commands

const commandRegistry = new CommandRegistry(client);
commandRegistry.registerCommands(commands);

log.info(commandRegistry.length, `commands collected... (${timer.now}ms)`.gray);

// Init command runtime

const commandRuntime = new CommandRuntime(client, config);
commandRuntime.listenPrefixCommands();
commandRuntime.listenSlashCommands();

log.info("Command runtime started.".gray);

// Registering events

const eventScanner = new EventScanner(config);
const events = eventScanner.importEvents();

log.info(events.length, `events imported... (${timer.now}ms)`.gray);

const eventHandler = new EventHandler(client);
eventHandler.registerEvents(events);

log.info(eventHandler.length, `events collected... (${timer.now}ms)`.gray);
