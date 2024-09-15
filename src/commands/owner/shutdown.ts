import { CommandInteraction, CacheType } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import RebootCommand from "./reboot";

export default class ShutdownCommand extends Command {
  constructor() {
    super(new CommandOptions("shutdown").setName("Shutdown"));

    this.slashCommandInfo.setDescription("Shutdown bot.");
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const Reboot = Command.getCommandByClass<RebootCommand>(
      client,
      RebootCommand.prototype
    );

    if (!Reboot.ownerIds.includes(interaction.user.id))
      return interaction.reply({
        content: "This command is only avalible for bot owner.",
        ephemeral: true
      });

    await interaction.reply("Bot is shutting down...");
    process.emit("SIGINT");
  }
}
