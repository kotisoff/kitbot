import { CommandInteraction, CacheType } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";

export default class VoiceBridgeOwnerPanelCommand extends Command {
  constructor() {
    super(new CommandOptions("vbownerpanel"));
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    interaction.reply("Потом доделаю, а пока ну его в пизду.");
  }
}
