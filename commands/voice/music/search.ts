import { CommandInteraction, GuildMember } from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { useMainPlayer } from "discord-player";

export default class SearchSongCommand extends Command {
  constructor() {
    super(new CommandOptions("search").setName("SearchSong"));

    this.setDescription("Ищите песни и воспроизводите их!");

    this.slashCommandInfo.addStringOption((o) =>
      o.setName("query").setDescription("Название песни").setRequired(true)
    );
  }

  async runSlash(
    interaction: CommandInteraction,
    client: CustomClient
  ): Promise<any> {
    const query = interaction.options.get("query")?.value as string;
    await interaction.deferReply();

    const player = useMainPlayer();
  }

  private isUserInVoice(interaction: CommandInteraction): boolean {
    return interaction.member instanceof GuildMember
      ? interaction.member.voice.channel != null
      : false;
  }
}
