import { Listener } from "@sapphire/framework";
import { Events } from "discord.js";

export class ClientReadyListener extends Listener {
  constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: Events.ClientReady
    });
  }

  public override async run() {
    console.log("Client ready");

    const channel = await this.container.client.channels.cache.get("1060578637117657151")?.fetch();
  }
}
