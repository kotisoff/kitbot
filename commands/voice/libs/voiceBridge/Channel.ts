import { User, VoiceChannel } from "discord.js";
import roomUser from "./User";
import {
  AudioReceiveStream,
  VoiceConnection,
  joinVoiceChannel
} from "@discordjs/voice";
import opus from "opusscript";
import Logger from "../../../../core/Logger";
import { Mixer } from "audio-mixer";
import { Room } from "./Rooms";
const log = new Logger("VoiceBridge:Channel");

export class Channel {
  private users: Map<string, roomUser>;
  channel: VoiceChannel;
  connection: VoiceConnection;
  inputStream: Mixer;
  outputStream: Mixer;
  room: Room;

  constructor(channel: VoiceChannel, room: Room) {
    this.channel = channel;
    this.room = room;
    this.users = new Map();
    this.connection = this.connect();
    this.inputStream = new Mixer({
      bitDepth: 16,
      channels: 1,
      sampleRate: 48000
    });
    this.outputStream = new Mixer({
      bitDepth: 16,
      channels: 1,
      sampleRate: 48000
    });
    this.listenConnection();
  }

  // Присоединяемся к каналу
  private connect() {
    return joinVoiceChannel({
      selfDeaf: false,
      selfMute: false,
      guildId: this.channel.guildId,
      channelId: this.channel.id,
      adapterCreator: this.channel.guild.voiceAdapterCreator
    });
  }

  // Прослушиваем пользователей.
  private listenConnection() {
    const receiver = this.connection.receiver;
    receiver.speaking.on("start", (userid) => {
      if (receiver.subscriptions.has(userid)) return;
      const stream = receiver.subscribe(userid);
      this.addUser(userid, stream);
    });
  }

  public newChannelConnected(channel: Channel) {
    // this.outputStream
  }

  // Добавляем пользователя в канал
  private addUser(user: string, stream: AudioReceiveStream) {
    this.users.set(user, new roomUser(user, stream));

    const userStream = this.inputStream.input(
      {
        bitDepth: 16,
        sampleRate: 48000
      },
      1
    );
    const Opus = new opus(48000, 1);
    stream.on("data", (buffer) => {
      userStream.write(Opus.decode(buffer));
    });

    log.info("Added user to channel:", this.channel.id, "user:", user);
  }

  // Удаляем пользователя из канала
  removeUser(user: User | string) {
    let uid: string;
    if (user instanceof User) uid = user.id;
    else uid = user;
    this.users.delete(uid);
  }
}
