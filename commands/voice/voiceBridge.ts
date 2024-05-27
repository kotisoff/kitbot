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
import { Room, Rooms } from "./libs/voiceBridge/Rooms";
import { randomBytes } from "crypto";
import RebootCommand from "../owner/reboot";

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
    // Получение команды из клиента.
    const Reboot = Command.getCommandByClass<RebootCommand>(
      client,
      RebootCommand.prototype
    );

    // Обработка ввода
    const option = interaction.options.get("option")?.value as
      | "join"
      | "create";
    const channel = interaction.options.get("channel")?.channel as VoiceChannel;
    const code = interaction.options.get("code")?.value as string | undefined;

    // WIP ошибка
    const ErrEmbed = new EmbedBuilder()
      .setTitle("Ошибка: Пошёл нахуй")
      .setDescription("Команда в данный момент в разработке")
      .setColor(0xff0000);

    if (!Reboot.ownerIds.includes(interaction.user.id))
      interaction.reply({ embeds: [ErrEmbed] });

    // Свитч между вариантами
    switch (option) {
      case "create":
        // Создаём новую комнату
        this.handleCreation(channel, code, interaction);
        interaction.reply("Вродё чё то мутное насоздавалось");
        break;
      case "join":
        // Присоединяемся к существующей комнате
        if (!code) {
          interaction.reply("Code is not provided.");
          break;
        }
        this.handleConnection(channel, code, interaction);
        interaction.reply("Вродё чё то мутное наподключалось");
        break;
    }
  }

  // Генерируем код
  private generateCode(length: number) {
    let code = randomBytes((length / 2) | 0).toString("hex");
    while (code.length < length) code += Math.floor(Math.random() * 10);
    return code;
  }

  // Создание комнаты
  handleCreation(
    channel: VoiceChannel,
    code: string | undefined,
    interaction: CommandInteraction
  ) {
    const room = this.rooms.addRoom(code ?? this.generateCode(6));
    const roomChannel = room.addChannel(channel);
  }

  // Присоединение к комнате
  handleConnection(
    channel: VoiceChannel,
    code: string,
    interaction: CommandInteraction
  ) {
    const room = this.rooms.get(code) as Room;
    const roomChannel = room.addChannel(channel);
  }
}
