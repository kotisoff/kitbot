import { User, VoiceChannel } from "discord.js";
import roomUser from "./User";
import {
  AudioReceiveStream,
  VoiceConnection,
  VoiceConnectionStatus,
  joinVoiceChannel
} from "@discordjs/voice";
import OpusScript from "opusscript";
import Logger from "../../../../core/Logger";
import { Mixer } from "audio-mixer";
import { Room } from "./Rooms";
import fs from "fs";

const log = new Logger("VoiceBridge:Channel");

const mixerOptions = {
  bitDepth: 16,
  channels: 1,
  sampleRate: 48000
};

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

    this.inputStream = new Mixer(mixerOptions); // Other channel users speech => this channel
    this.outputStream = new Mixer(mixerOptions); // This channel users speech => other channels

    this.listenConnection();

    this.connection.on("stateChange", (_, ns) => {
      if (
        ns.status == VoiceConnectionStatus.Destroyed ||
        ns.status == VoiceConnectionStatus.Disconnected
      ) {
        room.channels.delete(channel.id);
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
    const frameSize = (mixerOptions.sampleRate * 20) / 1000;
    const opus = new OpusScript(48000, 1, OpusScript.Application.VOIP);
    this.inputStream.on("data", (buffer) => {
      try {
        const encoded = opus.encode(buffer, frameSize);
        this.connection.playOpusPacket(encoded);
      } catch (e) {}
    });
  }

  public reconfigureInputChannels(channels: Map<string, Channel>) {
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
    this.users.set(user, new roomUser(user, stream));

    const userStream = this.outputStream.input(mixerOptions);
    const opus = new OpusScript(48000, 1, OpusScript.Application.VOIP);
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
