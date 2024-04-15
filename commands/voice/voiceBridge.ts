import {
  CommandInteraction,
  CacheType,
  ChannelType,
  VoiceChannel,
  EmbedBuilder
} from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import owner from "../owner/owner";
import { Room, Rooms } from "./libs/voiceBridge/Rooms";
import { randomBytes } from "crypto";
import { joinVoiceChannel } from "@discordjs/voice";

export default class VoiceBridgeCommand extends Command {
  rooms: Rooms;

  constructor() {
    super(new CommandOptions("voicebridge").setName("VoiceBridge"));

    this.slashCommandInfo
      .setDescription('Creates "room" and connects few voice channels.')
      .addStringOption((o) =>
        o
          .setName("option")
          .setDescription("Option.")
          .addChoices(
            {
              name: "Create room",
              value: "create"
            },
            { name: "Join room", value: "join" }
          )
          .setRequired(true)
      )
      .addChannelOption((o) =>
        o
          .setName("channel")
          .setDescription("Voice channel.")
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
          .setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("code").setDescription("Code of room.")
      );

    this.rooms = new Rooms();
  }

  async runSlash(
    interaction: CommandInteraction<CacheType>,
    client: CustomClient
  ): Promise<any> {
    const option = interaction.options.get("option")?.value as
      | "join"
      | "create";
    const channel = interaction.options.get("channel")?.channel as VoiceChannel;
    const code = interaction.options.get("code")?.value as string | undefined;

    const ErrEmbed = new EmbedBuilder()
      .setTitle("Ошибка: Пошёл нахуй")
      .setDescription("Команда в данный момент в разработке")
      .setColor(0xff0000);
    if (!owner.ownerIds.includes(interaction.user.id))
      interaction.reply({ embeds: [ErrEmbed] });

    switch (option) {
      case "create":
        this.handleCreation(channel, code, interaction);
        interaction.reply("Вродё чё то мутное насоздавалось");
        break;
      case "join":
        if (!code) {
          interaction.reply("Code is not provided.");
          break;
        }
        this.handleConnection(channel, code, interaction);
        interaction.reply("Вродё чё то мутное наподключалось");
        break;
    }
  }

  private generateCode(length: number) {
    let code = randomBytes((length / 2) | 0).toString("hex");
    while (code.length < length) code += Math.floor(Math.random() * 10);
    return code;
  }

  handleCreation(
    channel: VoiceChannel,
    code: string | undefined,
    interaction: CommandInteraction
  ) {
    const room = this.rooms.addRoom(code ?? this.generateCode(6));
    const roomChannel = room.addChannel(channel);
  }

  handleConnection(
    channel: VoiceChannel,
    code: string,
    interaction: CommandInteraction
  ) {
    const room = this.rooms.get(code) as Room;
    const roomChannel = room.addChannel(channel);
  }
}
