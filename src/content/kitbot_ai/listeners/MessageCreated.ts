import { Events, Listener } from "@sapphire/framework";
import { Message } from "discord.js";
import Orchestrator from "../modules/Orchestrator";

export class KitBotAI_MessageCreatedListener extends Listener {
  constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.MessageCreate
    });
  }

  async run(msg: Message) {
    Orchestrator.input(msg);
  }
}
