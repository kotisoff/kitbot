import { VoiceChannel } from "discord.js";
import Channel from "./Channel";
import Logger from "../../../../core/Logger";
import VoiceBridgeCommand from "../voiceBridge";
const log = new Logger("VoiceBridge:Rooms");

export class Room {
  code: string;

  channels: Map<string, Channel>;
  guilds: string[];
  private rooms: Rooms;

  owners: string[];

  constructor(code: string, rooms: Rooms) {
    this.code = code;

    this.channels = new Map();
    this.guilds = [];
    this.rooms = rooms;

    this.owners = [];
  }

  /** Добавляем канал в комнату */
  addChannel(voiceChannel: VoiceChannel, command: VoiceBridgeCommand) {
    const newChannel = new Channel(voiceChannel, this, command);
    this.channels.set(voiceChannel.id, newChannel);
    if (!this.guilds.includes(voiceChannel.guildId))
      this.guilds.push(voiceChannel.guildId);
    log.info("Added channel:", voiceChannel.id, "to room:", this.code);
    this.reconfigureChannels();
    return this.channels.get(voiceChannel.id) as Channel;
  }

  /** Удаляем канал из комнаты */
  removeChannel(voiceChannel: VoiceChannel) {
    if (!this.channels.delete(voiceChannel.id)) return;
    this.guilds.splice(this.guilds.indexOf(voiceChannel.guildId), 1);
  }

  /** Добавляем владельца комнаты */
  addOwners(...uid: string[]) {
    this.owners.push(...uid);
  }

  reconfigureChannels() {
    this.channels.forEach((channel) =>
      channel.reconfigureInputChannels(this.channels)
    );
  }

  destroy() {
    return this.rooms.delete(this.code);
  }
}

export class Rooms extends Map<string, Room> {
  constructor() {
    super();
  }

  // Добавляем комнату в мап комнат
  addRoom(code: string) {
    if (this.has(code)) throw Error("Room already exists");
    this.set(code, new Room(code, this));
    log.info("Added room:", code);
    return this.get(code) as Room;
  }

  find(predicate: (value: Room) => boolean) {
    return [...this.values()].find((room) => predicate(room));
  }

  findChannelRoom(channel: VoiceChannel) {
    return [...this.values()].find((r) => r.channels.has(channel.id));
  }
}
