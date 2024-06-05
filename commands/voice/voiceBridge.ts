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
import { Rooms } from "./libs/voiceBridge/Rooms";
import { randomBytes } from "crypto";
import RebootCommand from "../owner/reboot";
import CommandEmbed from "../../core/Command/CommandEmbed";
import { Channel } from "./libs/voiceBridge/Channel";

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
            { name: "Join room", value: "join" },
            { name: "Leave", value: "leave" }
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
      | "create"
      | "leave";
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
        break;
      case "join":
        this.handleConnection(channel, code, interaction);
        break;
      case "leave":
        this.handleLeave(channel, interaction);
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
    code = code ?? this.generateCode(6);
    if (this.rooms.find((r) => r.code == code))
      return interaction.reply({
        embeds: [CommandEmbed.error("Комната с таким кодом уже существует.")]
      });

    const room = this.rooms.addRoom(code ?? this.generateCode(6));
    room.addChannel(channel);

    interaction.reply({
      embeds: [
        CommandEmbed.info({
          title: "Комната создана",
          content: `Код: \`${code}\``
        })
      ]
    });
  }

  // Присоединение к комнате
  handleConnection(
    channel: VoiceChannel,
    code: string | undefined,
    interaction: CommandInteraction
  ) {
    if (!code)
      return interaction.reply({
        embeds: [CommandEmbed.error("Для подключения необходим код.")]
      });

    const room = this.rooms.get(code);
    if (!room)
      return interaction.reply({
        embeds: [
          CommandEmbed.error({
            title: "Не найдено",
            content: `Комната с кодом \`${code}\` не найдена.`
          })
        ]
      });
    room.addChannel(channel);

    const totalUsersCount = [...room.channels.values()]
      .map((c) => c.getUsersCount())
      .reduce((a, b) => a + b, 0);

    interaction.reply({
      embeds: [
        CommandEmbed.success({
          title: "Подключено",
          content:
            `Комната \`${code}\`\n` +
            `Подключено каналов: ${room.channels.size}\n` +
            `Подключено пользователей: ${totalUsersCount}`
        })
      ]
    });
  }

  async handleLeave(channel: VoiceChannel, interaction: CommandInteraction) {
    const room = this.rooms.findChannelRoom(channel);
    if (!room)
      return interaction.reply({
        embeds: [CommandEmbed.error("Канал не подключен к какой либо комнате.")]
      });

    const roomChannel = room.channels.get(channel.id) as Channel;
    roomChannel.connection.destroy();
    room.channels.delete(channel.id);

    await interaction.reply({ embeds: [CommandEmbed.error("Отключено.")] });
  }
}
