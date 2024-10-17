import {
  AutocompleteInteraction,
  CommandInteraction,
  GuildMember
} from "discord.js";
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
            { name: "Load", value: "load" },
            { name: "List", value: "list" }
          )
          .setRequired(true)
      )
      .addStringOption((o) =>
        o
          .setName("code")
          .setDescription("Code of playlist")
          .setAutocomplete(true)
      );
  }

  async autocomplete(
    interaction: AutocompleteInteraction,
    client: CustomClient
  ): Promise<void> {
    const focusedValue = interaction.options.getFocused();

    const usertracks = Object.entries(this.playlists)
      .filter(([_k, v]) => v.author == interaction.user.id)
      .map(([k, _v]) => k);
    const filtered = usertracks.filter((choice) =>
      choice.startsWith(focusedValue)
    );

    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice }))
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

      const tracks: string[] = [];
      tracks.push(queue.currentTrack?.url as string);
      tracks.push(...queue.tracks.map((track) => track.url));

      let newcode = code ?? this.generateCode();
      while (this.playlists[newcode]) {
        newcode = this.generateCode();
      }

      const expireTime = 259200000; // 3 days

      this.playlists[newcode] = {
        tracks,
        expires: Date.now() + expireTime,
        author: interaction.user.id
      };

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

      const queue = useQueue(interaction.guildId as string);

      if (queue && queue.channel?.id != channel.id) {
        return interaction.reply({
          embeds: [
            CommandEmbed.error("Музыка уже проигрывается в другом канале.")
          ]
        });
      }

      const playlist = this.playlists[code];
      const player = useMainPlayer();

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
        await player.play(channel, url, { requestedBy: interaction.user });
      }

      delete this.playlists[code];
      this.removeExpiredOnes();
      this.writeData(this.playlists);
    } else if (parameter == "list") {
      const playlists = Object.entries(this.playlists).filter(
        ([_k, v]) => v.author == interaction.user.id
      );
      const embed = CommandEmbed.info({ title: "Ваши плейлисты" }).addFields(
        playlists.map(([key, playlist]) => ({
          name: key,
          value: `Количество треков: ${
            playlist.tracks.length
          }\nИсчезает: ${new Date(playlist.expires).toLocaleDateString()}`
        }))
      );

      if (!embed.data.fields?.length) {
        embed.addFields({
          name: "Нет плейлистов.",
          value: "Добавьте с помощью данной команды!"
        });
      }

      interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  removeExpiredOnes() {
    for (const [key, value] of Object.entries(this.playlists)) {
      if (value.expires < Date.now()) delete this.playlists[key];
    }
  }

  private generateCode() {
    return randomBytes(6).toString("hex");
  }
}

class Playlists {
  [index: string]: { tracks: string[]; expires: number; author: string };
}
