import { AudioReceiveStream } from "@discordjs/voice";
import Logger from "../../../../core/Logger";
const log = new Logger("VoiceBridge:User");

export default class roomUser {
  volume: number;
  id: string;
  stream: AudioReceiveStream;

  constructor(user: string, inputstream: AudioReceiveStream) {
    this.id = user;
    this.volume = 100;
    this.stream = inputstream;
    log.info("Listening to user:", this.id);
  }

  setVolume(volume: number) {
    this.volume = volume;
  }
}
