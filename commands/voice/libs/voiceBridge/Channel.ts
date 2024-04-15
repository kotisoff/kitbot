import { User, VoiceChannel } from "discord.js";
import roomUser from "./User";
import {
  AudioReceiveStream,
  VoiceConnection,
  joinVoiceChannel
} from "@discordjs/voice";
import UserStream from "./UserStream";
import Logger from "../../../../core/Logger";
const log = new Logger("VoiceBridge:Channel");

export class Channel {
  private users: Map<string, roomUser>;
  channel: VoiceChannel;
  connection: VoiceConnection;
  private stream: UserStream;

  constructor(channel: VoiceChannel) {
    this.channel = channel;
    this.users = new Map();
    this.connection = this.connect();
    this.stream = new UserStream();
    this.listenConnection();
  }

  private connect() {
    return joinVoiceChannel({
      selfDeaf: false,
      selfMute: false,
      guildId: this.channel.guildId,
      channelId: this.channel.id,
      adapterCreator: this.channel.guild.voiceAdapterCreator
    });
  }

  private listenConnection() {
    const receiver = this.connection.receiver;
    receiver.speaking.on("start", (userid) => {
      if (receiver.subscriptions.has(userid)) return;
      const stream = receiver.subscribe(userid);
      this.addUser(userid, stream);
    });
  }

  private addUser(user: string, stream: AudioReceiveStream) {
    this.users.set(user, new roomUser(user, stream));
    log.info("Added user to channel:", this.channel.id, "user:", user);
  }

  removeUser(user: User | string) {
    let uid: string;
    if (user instanceof User) uid = user.id;
    else uid = user;
    this.users.delete(uid);
  }
}
