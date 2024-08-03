import Config from "../Config";
import { scanDirectory } from "../Utils/scannerUtils";
import Logger from "../Logger";
import { basename } from "discord.js";
import Event from ".";

const args = process.argv.slice(2);

export default class EventScanner {
  config: Config;
  events: Event[] = [];
  logger = new Logger("EventScanner");

  constructor(config: Config) {
    this.config = config;
  }

  importEvents(extensionFilters = ["js"]) {
    const files = scanDirectory("events", {
      ignoreFilters: this.config.settings.ignoredCommandDirs,
      extensionFilters
    });
    this.events = files
      .map((file) => {
        try {
          const event = new (require(file).default)() as Event;
          if (!event) return;
          event.path = file;
          return event;
        } catch (error) {
          this.logger.error(
            `Error loading ${basename(file)}`.red,
            args.includes("--errdetails")
              ? error
              : "--errdetails to get detailed error".gray
          );
          this.logger.info("Skipping...".magenta);
        }
      })
      .filter((v) => v) as Event[];
    return this.events;
  }
}
