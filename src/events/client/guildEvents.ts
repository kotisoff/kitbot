import { ActivityType, Events } from "discord.js";
import CustomClient from "../../core/CustomClient";
import Event from "../../core/Event";

export default class GuildEvents extends Event {
  constructor() {
    super("GuildEvents");
  }

  async createListener(client: CustomClient): Promise<any> {
    const log = this.logger;

    client.on(Events.GuildCreate, (guild) => {
      log.info(`Joined new guild: "${guild.name}" (${guild.id})`.gray);
      client.user.setActivity(
        "за " + client.guilds.cache.size + " серверами.",
        {
          type: ActivityType.Watching
        }
      );
    });

    client.on(Events.GuildDelete, (guild) => {
      log.info(`Left from guild: "${guild.name}" (${guild.id})`.gray);
      client.user.setActivity(
        "за " + client.guilds.cache.size + " серверами.",
        {
          type: ActivityType.Watching
        }
      );
    });
  }
}
