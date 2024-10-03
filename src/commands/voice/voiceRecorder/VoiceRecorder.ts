import {
  ChannelType,
  CommandInteraction,
  User,
  VoiceChannel
} from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import fs from "fs";
import path from "path";
import {
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus
} from "@discordjs/voice";
import CommandEmbed from "../../../core/Command/CommandEmbed";
import { normalizeFilepath } from "../../../core/Utils/reusedUtils";
import { Decoder } from "@evan/opus";

class MapLikeArray<Type = any> extends Array {
  /** Removes element and returns new length */
  remove(element: Type) {
    if (!this.includes(element)) return this.length;
    this.splice(this.indexOf(element), 1);
    return this.length;
  }

  /** Sets element in array if it's not found */
  set(element: Type) {
    if (!this.includes(element)) this.push(element);
    return this.length;
  }

  /** If array has element - removes, else - appends */
  toggle(element: Type) {
    if (this.includes(element)) this.remove(element);
    else this.push(element);
  }
}

export default class VoiceRecorderCommand extends Command {
  mutedUsers = new Map<string, MapLikeArray<string>>();
  writeStreams = new Map<string, fs.WriteStream[]>();

  constructor() {
    super(new CommandOptions("voicerecorder").setName("VoiceRecorder"));

    this.slashCommandInfo
      .setDescription("Records Voice Channel.")
      .addChannelOption((o) =>
        o
          .setName("channel")
          .setDescription("Voice channel.")
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
          .setRequired(true)
      )
      .addStringOption((o) =>
        o
          .setName("option")
          .setDescription("Additional option.")
          .setChoices(
            { name: "Leave", value: "leave" },
            { name: "Toggle recording of yourself", value: "toggleuser" }
          )
      );
  }

  private async getUser(channel: VoiceChannel, username_or_id: string) {
    return channel
      .fetch()
      .then(
        (channel) =>
          channel.members.get(username_or_id)?.user ??
          channel.members.find((u) => u.user.username == username_or_id)?.user
      );
  }

  private getUserWriteStream(channel: VoiceChannel, user: User) {
    const date = new Date();
    const localeDate = date.toLocaleDateString();
    const localeTime = date.toLocaleTimeString().replaceAll(":", ".");
    const saveAs = [localeDate, localeTime];

    const userPath = this.getUserPath(channel, user);
    if (!fs.existsSync(userPath)) fs.mkdirSync(userPath, { recursive: true });

    const writeStream = fs.createWriteStream(
      path.join(userPath, `${saveAs.join("-")}.pcm`)
    );

    const streams = this.writeStreams.get(channel.id) ?? [];
    streams.push(writeStream);
    this.writeStreams.set(channel.id, streams);

    return writeStream;
  }

  private getUserPath(channel: VoiceChannel, user: User) {
    const pathnames = [
      channel.guild,
      channel,
      { name: user.username, id: user.id }
    ].map((n) => `${n.id} (${normalizeFilepath(n.name)})`);

    return path.join(this.getDataDir(), ...pathnames); // dist/data/%guild%/%channel%/%user%/
  }

  private getMutedUsers(channel: VoiceChannel) {
    return this.mutedUsers.get(channel.id) ?? [];
  }

  private setMuteUser(
    channel: VoiceChannel,
    user: User,
    muteState: boolean = true
  ) {
    const mutedUsers = this.mutedUsers.get(channel.id) ?? new MapLikeArray();
    if (muteState) mutedUsers.set(user.id);
    else mutedUsers.remove(user.id);
    this.mutedUsers.set(channel.id, mutedUsers);
  }

  private toggleMuteUser(channel: VoiceChannel, user: User) {
    const mutedUsers = this.mutedUsers.get(channel.id) ?? new MapLikeArray();
    mutedUsers.toggle(user.id);
    this.mutedUsers.set(channel.id, mutedUsers);
  }

  private isMutedUser(channel: VoiceChannel, user: User) {
    const mutedUsers = this.mutedUsers.get(channel.id) ?? new MapLikeArray();
    return mutedUsers.includes(user.id);
  }

  async runSlash(
    interaction: CommandInteraction,
    client: CustomClient
  ): Promise<any> {
    const channel = interaction.options.get("channel")?.channel as VoiceChannel;
    const option = interaction.options.get("option")?.value as
      | "leave"
      | "toggleuser"
      | undefined;

    let connection = getVoiceConnection(channel.guildId);
    if (option && !connection)
      return interaction.reply({
        embeds: [CommandEmbed.error("Бот не в голосовом канале!")]
      });

    if (option == "leave") {
      connection?.destroy();
      interaction.reply({
        embeds: [CommandEmbed.success("Бот отключен от голосового канала.")]
      });

      return this.logger.info(
        "Канал",
        `"${channel.name}"(${channel.id})`,
        "в",
        `"${channel.guild.name}"(${channel.guildId}) не записывается.`
      );
    } else if (option == "toggleuser") {
      const uid = interaction.user.id;
      if (!(await this.getUser(channel, uid)))
        return interaction.reply({
          embeds: [CommandEmbed.error("Вы не подключены к голосовому каналу!")]
        });

      this.toggleMuteUser(channel, interaction.user);
      return interaction.reply({
        embeds: [
          CommandEmbed.info(
            `Бот ${
              this.isMutedUser(channel, interaction.user) && "не "
            } записывает вас.`
          )
        ]
      });
    }

    if (!channel.members.size)
      return interaction.reply({ embeds: [CommandEmbed.info("Канал пуст.")] });

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      selfDeaf: false,
      selfMute: false,
      // @ts-ignore
      adapterCreator: channel.guild.voiceAdapterCreator
    });

    connection.receiver.speaking.on("start", async (uid) => {
      if (connection.receiver.subscriptions.has(uid)) return;

      const user = await this.getUser(channel, uid);
      if (!user) return;

      if (this.isMutedUser(channel, user)) return;

      const writeStream = this.getUserWriteStream(channel, user);
      const stream = connection.receiver.subscribe(uid);

      const decoder = new Decoder({ channels: 1, sample_rate: 48000 });

      stream.on("data", (chunk) => {
        if (this.isMutedUser(channel, user)) {
          return connection.receiver.subscriptions.delete(uid);
        }

        writeStream.write(decoder.decode(chunk));
      });
    });

    connection.on("stateChange", (_oldstate, statenew) => {
      if (
        statenew.status == VoiceConnectionStatus.Destroyed ||
        statenew.status == VoiceConnectionStatus.Disconnected
      ) {
        this.writeStreams.get(channel.id)?.forEach((stream) => stream.close());
        this.writeStreams.delete(channel.id);

        this.mutedUsers.delete(channel.id);
      }
    });

    this.logger.info(
      "Канал",
      `"${channel.name}"(${channel.id})`,
      "в",
      `"${channel.guild.name}"(${channel.guildId}) записывается.`
    );
    interaction.reply({
      embeds: [CommandEmbed.info(`Канал <#${channel.id}> записывается.`)]
    });
  }
}
