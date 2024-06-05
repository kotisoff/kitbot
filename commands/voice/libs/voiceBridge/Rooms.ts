import { VoiceChannel } from "discord.js";
import { Channel } from "./Channel";
import Logger from "../../../../core/Logger";
const log = new Logger("VoiceBridge:Rooms");

export class Room {
  code: string;
  channels: Map<string, Channel>;
  private rooms: Rooms;

  constructor(code: string, rooms: Rooms) {
    this.code = code;
    this.channels = new Map();

    this.rooms = rooms;
  }

  // Добавляем канал в комнату
  addChannel(voiceChannel: VoiceChannel) {
    const newChannel = new Channel(voiceChannel, this);
    this.channels.set(voiceChannel.id, newChannel);
    log.info("Added channel:", voiceChannel.id, "to room:", this.code);
    this.reconfigureChannels();
    return this.channels.get(voiceChannel.id) as Channel;
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
