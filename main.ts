import Logger from "./core/Logger";
const log = new Logger("Main");

log.info("\x1b[90mImporting modules...\x1b[0m");

const timer = Date.now();

import fs from "fs";
import path from "path";
import "colors";

import deployCommands from "./core/deployCommands";
log.info("All modules loaded".gray);

if (!fs.existsSync("./config.json")) {
  log.warn("Config is not found.".gray);
  fs.writeFileSync("../config.json", "");
  log.info("Created a new config!".green);
  process.exit(0);
}

import config from "./config.json";

console.log(config.bot);
