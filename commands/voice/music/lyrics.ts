import { CommandInteraction, CacheType, Message } from "discord.js";
import Command from "../../../core/Command";
import CommandOptions from "../../../core/Command/CommandOptions";
import CustomClient from "../../../core/CustomClient";
import { useQueue, useMainPlayer, Player, LrcLib } from "discord-player";
import CommandEmbed from "../../../core/Command/CommandEmbed";

export default class LyricsCommand extends Command {
  dependencies: string[] = ["play"];

  player: Player | undefined;
  lyricsApi: LrcLib | undefined;

  constructor() {
    super(new CommandOptions("lyrics").setName("MusicLyrics"));

    this.slashCommandInfo
      .setDescription("Returns lyrics of provided or current song.")
      .addStringOption((o) => o.setName("query").setDescription("Song url or name."));
  }

  async onInit(client: CustomClient): Promise<void> {
    this.player = useMainPlayer();
    this.lyricsApi = this.player.lyrics;
  }

  async run(message: Message | CommandInteraction, args: string[], client: CustomClient): Promise<any> {
    const player = this.player as Player;
    const lyricsApi = this.lyricsApi as LrcLib;

    const query = args[0] as string | undefined;

    const trackName = query
      ? query
      : (() => {
          const currentTrack = useQueue(message.guildId as string)?.currentTrack;
          if (!currentTrack) return;
          return currentTrack.title + " - " + currentTrack.author;
        })();

    if (!trackName)
      return message.reply({
        embeds: [CommandEmbed.error("В данный момент ничего не воспроизводится.")]
      });

    const track = await player.search(trackName).then((v) => v.tracks.shift());

    if (!track) {
      return message.reply({
        embeds: [CommandEmbed.error("Трек не найден.")]
      });
    }

    const response = await lyricsApi.search({ trackName: track.title, artistName: track.author });
    const lyrics = response.shift();

    if (!lyrics) {
      return message.reply({
        embeds: [CommandEmbed.error("Текст не найден.")]
      });
    }

    const trimmedLyrics = lyrics.plainLyrics.substring(0, 1997);

    const embed = CommandEmbed.embed({
      content: trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics
    })
      .setTitle(lyrics.name)
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .setAuthor({
        name: lyrics.artistName
      })
      .setColor("Random");

    return message.reply({ embeds: [embed] });
  }
}
