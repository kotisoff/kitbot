import { CommandInteraction, GuildMember } from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import CommandEmbed from "../../../core/Command/CommandEmbed";
import { useMainPlayer, useQueue } from "discord-player";
import { randomBytes } from "crypto";

export default class PlaylistSaveloadCommand extends Command {
  playlists: Playlists = {};

  constructor() {
    super(new CommandOptions("playlist-sl").setName("PlaylistSL"));

    this.slashCommandInfo
      .setDescription("Playlist save-load utility command")
      .addStringOption((o) =>
        o
          .setName("parameter")
          .setDescription("Parameter")
          .addChoices(
            { name: "Save", value: "save" },
            { name: "Load", value: "load" }
          )
          .setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("code").setDescription("Code of playlist")
      );
  }

  async onInit(client: CustomClient): Promise<void> {
    this.playlists = this.readData() ?? this.writeData({});
    this.removeExpiredOnes();
  }

  async shutdown(): Promise<void> {
    this.writeData(this.playlists);
  }

  async runSlash(
    interaction: CommandInteraction,
    client: CustomClient
  ): Promise<any> {
    const parameter = interaction.options.get("parameter")?.value as
      | "save"
      | "load";
    const code = interaction.options.get("code")?.value as string | undefined;

    const channel =
      interaction.member instanceof GuildMember
        ? interaction.member.voice.channel
        : undefined;

    if (!channel)
      return interaction.reply({
        embeds: [
          CommandEmbed.error("Сначала подключитесь к голосовому каналу!")
        ]
      });

    if (parameter == "save") {
      const queue = useQueue(interaction.guildId as string);
      if (!queue) {
        return interaction.reply({
          embeds: [
            CommandEmbed.error("В данный момент ничего воспроизводится.")
          ]
        });
      }

      const tracks = queue.tracks.map((track) => track.url);
      const newcode = randomBytes(6).toString("hex");

      const expireTime = 259200000; // 3 days

      this.playlists[newcode] = { tracks, expires: Date.now() + expireTime };

      interaction.reply({
        embeds: [
          CommandEmbed.info({
            title: "Плейлист сохранён",
            content: `Код плейлиста: \`${newcode}\``
          })
        ]
      });

      this.removeExpiredOnes();
      this.writeData(this.playlists);
    } else if (parameter == "load") {
      if (!code || !this.playlists[code])
        return interaction.reply({
          embeds: [CommandEmbed.error("Не найдено плейлистов с таким кодом!")]
        });

      const playlist = this.playlists[code];
      const player = useMainPlayer();
      const queue = useQueue(interaction.guildId as string);

      const embed = CommandEmbed.blankEmbed()
        .setTitle("Плейлист загружается")
        .addFields(
          {
            name: "Количество песен",
            value: `${playlist.tracks.length} песен`,
            inline: true
          },
          { name: "Добавлено", value: interaction.user.username, inline: true }
        )
        .setColor("Random");

      interaction.reply({ embeds: [embed] });

      for (const url of playlist.tracks) {
        await player.play(channel, url);
      }

      delete this.playlists[code];
      this.removeExpiredOnes();
      this.writeData(this.playlists);
    }
  }

  removeExpiredOnes() {
    for (const [key, value] of Object.entries(this.playlists)) {
      if (value.expires < Date.now()) delete this.playlists[key];
    }
  }
}

class Playlists {
  [index: string]: { tracks: string[]; expires: number };
}
