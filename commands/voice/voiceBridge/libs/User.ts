import { AudioReceiveStream } from "@discordjs/voice";
import Logger from "../../../../core/Logger";
import fs from "fs";
import Channel, { mixerOptions } from "./Channel";
import { Mixer } from "audio-mixer";
const log = new Logger("VoiceBridge:User");

export default class roomUser {
  volume: number;
  id: string;

  stream: Mixer;
  channel: Channel;

  constructor(user: string, inputstream: AudioReceiveStream, channel: Channel) {
    this.id = user;
    this.volume = 100;

    this.channel = channel;

    this.stream = new Mixer(mixerOptions);
    //this.playConnectionSound();
    inputstream.pipe(this.stream.input(mixerOptions));

    log.info("Listening to user:", this.id);
  }

  // listenDisconnection() {
  //   const disconnectEvents = ["close", "end"];

  //   disconnectEvents.forEach((event) => {
  //     this.stream.once(event, () => {
  //       const sound = this.pickRandom(this.channel.command.sounds.disconnected);
  //       if (sound)
  //         fs.createReadStream(sound).pipe(this.stream.input(mixerOptions));

  //       console.log("User disconnected");
  //     });
  //   });
  // }

  // playConnectionSound() {
  //   const sound = this.pickRandom(this.channel.command.sounds.connected);
  //   if (sound) fs.createReadStream(sound).pipe(this.stream.input(mixerOptions));
  //   console.log(sound);
  // }

  setVolume(volume: number) {
    this.volume = volume;
  }

  private pickRandom<T = string>(array: T[]): T {
    return array[Math.round(Math.random() * array.length)];
  }
}
