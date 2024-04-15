import { VoiceChannel } from "discord.js";
import { Channel } from "./Channel";
import Logger from "../../../../core/Logger";
import UserStream from "./UserStream";
const log = new Logger("VoiceBridge:Rooms");

export class Room {
  code: string;
  channels: Map<string, Channel>;

  constructor(code: string) {
    this.code = code;
    this.channels = new Map();
  }

  addChannel(channel: VoiceChannel) {
    if (this.channels.has(channel.id)) return;
    this.channels.set(channel.id, new Channel(channel));
    log.info("Added channel:", channel.id, "to room:", this.code);
    return this.channels.get(channel.id) as Channel;
  }
}

export class Rooms extends Map<string, Room> {
  constructor() {
    super();
  }

  addRoom(code: string) {
    if (this.has(code)) throw Error("Room already exists");
    this.set(code, new Room(code));
    log.info("Added room:", code);
    return this.get(code) as Room;
  }
}
