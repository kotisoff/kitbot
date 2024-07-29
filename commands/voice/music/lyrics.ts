import { CommandInteraction, CacheType, Message } from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { lyricsExtractor } from "@discord-player/extractor";
import { useQueue } from "discord-player";
import CommandEmbed from "../../../core/Command/CommandEmbed";

export default class LyricsCommand extends Command {
  lyricsApi;

  constructor() {
    super(new CommandOptions("lyrics").setName("MusicLyrics"));

    this.slashCommandInfo
      .setDescription("Returns lyrics of provided or current song.")
      .addStringOption((o) =>
        o.setName("query").setDescription("Song url or name.")
      );

    this.lyricsApi = lyricsExtractor();
  }

  async run(
    message: Message | CommandInteraction,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const query = args[0] as string | undefined;

    const trackName = query
      ? query
      : (() => {
          const currentTrack = useQueue(
            message.guildId as string
          )?.currentTrack;
          if (!currentTrack) return;
          return currentTrack.title + " - " + currentTrack.author;
        })();

    if (!trackName)
      return message.reply({
        embeds: [
          CommandEmbed.error("В данный момент ничего не воспроизводится.")
        ]
      });

    const lyrics = await this.lyricsApi.search(trackName).catch(() => null);
    if (!lyrics)
      return message.reply({
        embeds: [CommandEmbed.error("Текст не найден.")]
      });

    const trimmedLyrics = lyrics.lyrics.substring(0, 1997);

    const embed = CommandEmbed.embed({
      content:
        trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics
    })
      .setTitle(lyrics.title)
      .setURL(lyrics.url)
      .setThumbnail(lyrics.thumbnail)
      .setAuthor({
        name: lyrics.artist.name,
        iconURL: lyrics.artist.image,
        url: lyrics.artist.url
      })
      .setColor("Random");

    return message.reply({ embeds: [embed] });
  }
}
