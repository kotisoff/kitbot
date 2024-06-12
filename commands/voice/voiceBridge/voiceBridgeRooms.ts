import { CommandInteraction, CacheType } from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import VoiceBridgeCommand from "./voiceBridge";
import CommandEmbed from "../../../core/Command/CommandEmbed";

export default class VoiceBridgeRoomsCommand extends Command {
  constructor() {
    super(new CommandOptions("vbrooms"));

    this.slashCommandInfo.setDescription("Get list of rooms");
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const VoiceBridge = client.getCommandByClass<VoiceBridgeCommand>(
      VoiceBridgeCommand.prototype
    );

    const embed = CommandEmbed.info({ title: "Комнаты" }).addFields(
      [...VoiceBridge.rooms.values()].map((r) => ({
        name: r.code,
        value:
          `Подключено каналов: ${r.channels.size}\n` +
          `Подключено пользователей: ${[...r.channels.values()]
            .map((c) => c.getUsersCount())
            .reduce((a, b) => a + b, 0)}\n`,
        inline: true
      }))
    );

    if (!embed.data.fields?.length)
      embed.addFields({
        name: "Не найдено комнат",
        value: "Никто ещё не создавал комнату"
      });

    interaction.reply({
      embeds: [embed]
    });
  }
}
