import { Listener } from "@sapphire/framework";
import { ActivityType, Events } from "discord.js";

export class GuildJoinEventListener extends Listener {
  constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: Events.GuildCreate
    });
  }

  public override async run(...args: any) {
    const client = this.container.client;

    client.user?.setActivity("Следит за " + client.guilds.cache.size + " серверами.", {
      type: ActivityType.Watching
    });

    console.log("Connected to the new guild", args);
  }
}
