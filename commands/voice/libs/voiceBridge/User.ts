import { User } from "discord.js";
import UserStream from "./UserStream";
import { AudioReceiveStream, VoiceConnection } from "@discordjs/voice";
import Logger from "../../../../core/Logger";
const log = new Logger("VoiceBridge:User");

export default class roomUser {
  volume: number;
  id: string;
  private stream: UserStream;

  constructor(user: string, inputstream: AudioReceiveStream) {
    this.id = user;
    this.volume = 100;
    this.stream = new UserStream();
    this.handleStream(inputstream);
  }

  private handleStream(stream: AudioReceiveStream) {
    stream.pipe(this.stream);
    log.info("Listening to user:", this.id);
  }

  setVolume(volume: number) {
    this.volume = volume;
  }
}
