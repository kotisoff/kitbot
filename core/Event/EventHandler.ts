import Event from ".";
import CustomClient from "../CustomClient";
import Logger from "../Logger";

const log = new Logger("EventHandler");

export default class EventHandler {
  client: CustomClient;

  get length(): number {
    return this.client.events.size;
  }

  constructor(client: CustomClient) {
    this.client = client;
  }

  async registerEvent(event: Event) {
    try {
      event.createListener(this.client);
      this.client.events.set(event.name, event);
    } catch (e) {
      log.error("Could not register event!", e);
    }
  }

  registerEvents(events: Event[]) {
    for (let event of events) {
      this.registerEvent(event);
    }
  }
}
