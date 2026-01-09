import { SapphireClient } from "@sapphire/framework";
import { getRootData } from "@sapphire/pieces";
import { ClientOptions } from "discord.js";
import { lstatSync, readdirSync } from "fs";
import { join } from "path";

export default class CustomBotClient extends SapphireClient {
  private rootData = getRootData();

  constructor(options: ClientOptions) {
    super(options);

    const contentdir = join(this.rootData.root, "content");

    const ContentPacks = readdirSync(contentdir)
      .map((f) => join(contentdir, f))
      .filter((f) => lstatSync(f).isDirectory());

    ContentPacks.forEach((path) => {
      this.stores.registerPath(path);
    });

    console.log(ContentPacks);
  }
}
