import {
  ActionRowBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  RestOrArray
} from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { useMainPlayer, useQueue } from "discord-player";
import CommandEmbed from "../../../core/Command/CommandEmbed";
import LyricsCommand from "./lyrics";

export default class TrackInfoCommand extends Command {
  constructor() {
    super(new CommandOptions("trackinfo"));

    this.setDescription("Получите данные о треке и распишитесь.");

    this.slashCommandInfo.addStringOption((o) =>
      o.setName("query").setDescription("Название трека/ссылка на него")
    );
  }

  async runSlash(
    interaction: CommandInteraction,
    client: CustomClient
  ): Promise<any> {
    const query = interaction.options.get("query")?.value as string | undefined;

    const queue = useQueue(interaction.guildId as string);

    const track = query
      ? (
          await useMainPlayer()
            .search(query)
            .catch(() => null)
        )?.tracks[0]
      : queue?.currentTrack;

    if (!track)
      return interaction.reply({
        embeds: [
          CommandEmbed.error(
            query
              ? "Треков не найдено"
              : "В данный момент ничего не воспроизводится."
          )
        ]
      });

    const fields: RestOrArray<APIEmbedField> = [
      {
        name: "Длительность",
        value: query
          ? track.duration
          : queue?.node.createProgressBar() ?? track.duration
      }
    ];
    if (!query)
      fields.push({
        name: "Добавлено",
        value: queue?.currentTrack?.requestedBy?.username ?? "Неизвестно"
      });

    const trackembed = CommandEmbed.blankEmbed()
      .setTitle(track.title)
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .setAuthor({ name: track.author })
      .addFields(fields)
      .setColor("Random");

    const stream = await track.extractor?.stream(track);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(typeof stream == "string" ? "Скачать" : "Ссылка на трек")
        .setStyle(ButtonStyle.Link)
        .setURL(typeof stream == "string" ? stream : track.url),
      new ButtonBuilder()
        .setCustomId("lyrics")
        .setLabel("Текст")
        .setStyle(ButtonStyle.Secondary)
    );

    const reply = await interaction.reply({
      embeds: [trackembed],
      components: [buttonRow]
    });

    try {
      const button = await reply.awaitMessageComponent({
        time: 60_000
      });

      if (button.customId == "lyrics") {
        const lyricsCommand = client.getCommandByClass<LyricsCommand>(
          LyricsCommand.prototype
        );
        const trackName = track.title + " - " + track.author;
        lyricsCommand.run(await reply.fetch(), [trackName], client);
        button.update({});
      }
    } catch {}
  }
}
