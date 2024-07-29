import { ActivityType, Events, OAuth2Scopes } from "discord.js";
import CustomClient from "../../core/CustomClient";
import Event from "../../core/Event";
import deployCommands from "../../core/Utils/deployCommands";
import { timer } from "../../core/Utils/reusedUtils";

export default class ClientReadyEvent extends Event {
  constructor() {
    super("ClientReadyEvent");
  }

  async createListener(client: CustomClient): Promise<any> {
    const log = this.logger;
    const config = client.config;
    const commands = client.allCmd;

    client.once(Events.ClientReady, () => {
      log.info(`${client.user.tag} is online.`.yellow);

      process.title = client.user.username;

      if (config.settings.autoDeploy) deployCommands(client);

      commands.forEach((command) => {
        command.onInit(client);
      });

      client.user.setStatus("idle");
      client.user.setActivity(
        "за " + client.guilds.cache.size + " серверами.",
        {
          type: ActivityType.Watching
        }
      );

      log.info(`Bot took ${timer.now}ms to launch.`.gray);
      const link = client.generateInvite({
        permissions: ["Administrator"],
        scopes: [OAuth2Scopes.Bot]
      });
      log.info("Bot invite link:".gray, link.blue);
    });
  }
}
