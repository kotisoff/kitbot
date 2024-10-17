import { User, VoiceChannel } from "discord.js";
import roomUser from "./User";
import {
  AudioReceiveStream,
  VoiceConnection,
  VoiceConnectionStatus,
  joinVoiceChannel
} from "@discordjs/voice";
import { Encoder, Decoder } from "@evan/opus";
import Logger from "../../../../core/Logger";
import { Mixer } from "audio-mixer";
import { Room } from "./Rooms";
import VoiceBridgeCommand from "../voiceBridge";

const log = new Logger("VoiceBridge:Channel");

export const mixerOptions = {
  bitDepth: 16,
  channels: 1,
  sampleRate: 48000
};

export default class Channel {
  channel: VoiceChannel;
  room: Room;
  private users: Map<string, roomUser>;
  connection: VoiceConnection;

  inputStream: Mixer;
  outputStream: Mixer;

  command: VoiceBridgeCommand;

  constructor(channel: VoiceChannel, room: Room, command: VoiceBridgeCommand) {
    this.channel = channel;
    this.room = room;
    this.users = new Map();
    this.connection = this.connect();

    this.inputStream = new Mixer(mixerOptions); // Other channel users speech => this channel
    this.outputStream = new Mixer(mixerOptions); // This channel users speech => other channels

    this.command = command;

    this.listenConnection();

    this.connection.on("stateChange", (_, ns) => {
      if (
        ns.status == VoiceConnectionStatus.Destroyed ||
        ns.status == VoiceConnectionStatus.Disconnected
      ) {
        room.removeChannel(channel);
        if (!this.room.channels.size) room.destroy();
      }
    });

    this.listenOutputStream();
  }

  // Присоединяемся к каналу
  private connect() {
    return joinVoiceChannel({
      selfDeaf: false,
      selfMute: false,
      guildId: this.channel.guildId,
      channelId: this.channel.id,
      // @ts-ignore
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

  // Прослушивает другие каналы в комнате
  private listenOutputStream() {
    const opus = new Encoder({
      channels: 1,
      sample_rate: 48000
    });
    this.inputStream.on("data", (buffer) => {
      try {
        const encoded = opus.encode(buffer);
        this.connection.playOpusPacket(Buffer.from(encoded));
      } catch (e) {}
    });
  }

  reconfigureInputChannels(channels: Map<string, Channel>) {
    const filteredChannels = [...channels.entries()].filter(
      ([chid, _]) => chid != this.channel.id
    );

    filteredChannels.forEach(([_, ch]) => {
      ch.inputStream.removeAllListeners();
      ch.outputStream.pipe(this.inputStream.input(mixerOptions));
      ch.listenOutputStream();
    });
  }

  // Добавляем пользователя в канал
  private addUser(user: string, stream: AudioReceiveStream) {
    this.users.set(user, new roomUser(user, stream, this));

    const userStream = this.outputStream.input(mixerOptions);
    const opus = new Decoder({ channels: 1, sample_rate: 48000 });
    stream.on("data", (buffer) => userStream.write(opus.decode(buffer)));

    log.info("Added user to channel:", this.channel.id, "user:", user);
  }

  // Удаляем пользователя из канала
  removeUser(user: User | string) {
    let uid: string;
    if (user instanceof User) uid = user.id;
    else uid = user;
    this.users.delete(uid);
  }

  getUsersCount() {
    return this.users.size;
  }
}
