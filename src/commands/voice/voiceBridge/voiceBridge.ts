import {
  CommandInteraction,
  CacheType,
  ChannelType,
  VoiceChannel
} from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { Rooms } from "./libs/Rooms";
import { randomBytes } from "crypto";
import RebootCommand from "../../owner/reboot";
import CommandEmbed from "../../../core/Command/CommandEmbed";
import Channel from "./libs/Channel";

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
    //this.sounds = { connected: [], disconnected: [] };

    //this.preloadSounds();
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

    const guildRoom = this.rooms.find((room) =>
      room.guilds.includes(channel.guildId)
    );
    if (guildRoom)
      return interaction.reply({
        embeds: [
          CommandEmbed.error(
            "Этот сервер уже подключён к комнате.\n" +
              "Покиньте комнату или отключите бота от канала.\n" +
              `Код комнаты: ${guildRoom.code}`
          )
        ]
      });

    const room = this.rooms.addRoom(code ?? this.generateCode(6));
    room.addOwners(interaction.user.id);
    room.addChannel(channel, this);

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

    const guildRoom = this.rooms.find((room) =>
      room.guilds.includes(channel.guildId)
    );
    if (guildRoom)
      return interaction.reply({
        embeds: [
          CommandEmbed.error(
            "На этом сервере уже создана комната.\n" +
              "Покиньте комнату или отключите бота от канала.\n" +
              `Код комнаты: ${guildRoom.code}`
          )
        ]
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
    room.addChannel(channel, this);

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

  // Покидание комнаты
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

  // // Reading sounds
  // preloadSounds() {
  //   const dataDir = this.getDataDir();
  //   const soundsPath = path.join(dataDir, "sounds");

  //   if (!fs.existsSync(soundsPath)) fs.mkdirSync(soundsPath);

  //   fs.readdirSync(soundsPath, { recursive: true }).forEach((file) => {
  //     const splitPath = file.toString().split(path.sep);
  //     if (splitPath[0] == "user_connected" && splitPath[1])
  //       this.sounds.connected.push(path.join(soundsPath, file.toString()));
  //     else if (splitPath[0] == "user_disconnected" && splitPath[1])
  //       this.sounds.disconnected.push(path.join(soundsPath, file.toString()));
  //   });
  // }
}
