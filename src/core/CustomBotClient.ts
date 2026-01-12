import { SapphireClient } from "@sapphire/framework";
import { getRootData } from "@sapphire/pieces";
import { ClientOptions } from "discord.js";
import ContentHandler from "./ContentHandler";

export default class CustomBotClient extends SapphireClient {
  private rootData = getRootData();

  constructor(options: ClientOptions) {
    super(options);

    ContentHandler.loadContent(this.rootData);

    ContentHandler.contentPacks.forEach((pack) => {
      this.stores.registerPath(pack.path);
      pack.init();
    });

    console.log("Loaded content:", ContentHandler.contentPacks.keys().toArray().join(", "));
  }
}
