import Logger from "../Logger";
import CustomClient from "../CustomClient";

export default abstract class Event {
  /** Event name */
  name: string;
  // Logger
  logger: Logger;

  /** Path to event file */
  path?: string;

  constructor(name: string) {
    this.name = name;
    this.logger = new Logger(name);
  }

  abstract createListener(client: CustomClient): Promise<any>;

  async onInit(client: CustomClient): Promise<void> {}

  async shutdown(): Promise<void> {}
}
