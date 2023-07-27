const discord = require("discord.js");
const discordp = require("discord-player");
const extractor = require("@discord-player/extractor"),
  { YandexMusicExtractor } = require("discord-player-yandexmusic");
const fs = require("fs"),
  path = require("path");
const ymext = `ext:${YandexMusicExtractor.identifier}`;

console.log("[Music]", "Importing yaconfig...".gray);
const cfgpath = path.join(__dirname, "../../configs/kot.music/yaconfig.json");
if (!fs.existsSync(cfgpath))
  fs.writeFileSync(
    cfgpath,
    JSON.stringify({
      user: {
        access_token: "yourAuthToken",
        uid: "yourUid_ItShouldBeANumber",
      },
    })
  );
const config = require(cfgpath);

/*Как получить token и uid?
    Инструкция по токену: https://github.com/MarshalX/yandex-music-api/discussions/513

    Переходим по https://mail.yandex.ru/ спустя несколько секунд в строке поиска будет ваш uid.

    Вставляем данные в configs/kot.music/yaconfig.json

    Я хз скольно оно будет работать, но когда будет кидать ошибку тогда и проделывайте эти фокусы заново.
*/

module.exports = {
  idata: new discord.SlashCommandBuilder()
    .setName("play")
    .setDescription("Plays music from Any Platforms")
    .addStringOption((o) =>
      o
        .setName("query")
        .setDescription("Песня/Плейлист/Альбом ссылка или название.")
        .setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("source")
        .setDescription(
          "Источник воспроизведения, можно не указывать при указании ссылок."
        )
        .setChoices(
          { name: "Youtube", value: "youtube" },
          { name: "Yandex Music", value: ymext }
        )
    ),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    discordp.Playlist.prototype.url;
    const source =
      (await interact.options.getString("source")) ??
      discordp.QueryType.AUTO_SEARCH;
    const query = await interact.options.getString("query");
    if (!query)
      return await interact.reply({
        content: "А если подумать?",
        ephemeral: true,
      });
    try {
      await interact.reply("*Думоет...*");
    } catch {
      return console.log("Unavalible for now");
    }
    const channel = interact.member?.voice?.channel;
    if (!channel)
      return await interact.editReply(
        "Сначала подключитесь к голосовому каналу!"
      );
    const queue = discordp.useQueue(interact.guildId);
    if (queue && queue.channel.id !== channel.id)
      return await interact.editReply(
        "Музыка уже проигрывается в другом канале."
      );
    const player = discordp.useMainPlayer();
    const search = await player
      .search(query, { searchEngine: source, requestedBy: interact.member.id })
      .catch(() => {});
    if (!search?.hasTracks())
      return await interact.editReply("Не найдено треков по этому запросу.");
    if (search.hasPlaylist()) {
      await player
        .play(channel, search.playlist, { searchEngine: source })
        .then(() => {
          console.log(
            "[Music] " +
              `Added ${search.tracks.length} tracks to queue with "${search.playlist.title} - ${search.playlist.author.name}" in ${interact.guildId} with "${source}"`
                .gray
          );
          interact.editReply(
            `Добавлен плейлист: \`${search.playlist.title} - ${search.playlist.author.name}\` с ${search.tracks.length} песнями.`
          );
        })
        .catch((e) => {
          console.log("[Music] " + `Something went wrong! ${e.message}`.gray);
          interact.editReply(
            `Упс, что-то пошло не так! \n\`\`\`${e.message}\`\`\``
          );
        });
    } else
      await player
        .play(channel, search.tracks[0], { searchEngine: source })
        .then(() => {
          console.log(
            "[Music] " +
              `Added to queue: "${search.tracks[0].title} - ${search.tracks[0].author}" in ${interact.guildId} with "${source}"`
                .gray
          );
          interact.editReply(
            `Добавлено в очередь: \`${search.tracks[0].title} - ${search.tracks[0].author}\` (${search.tracks[0].duration})`
          );
        })
        .catch((e) => {
          console.log("[Music] " + `Something went wrong! ${e.message}`.gray);
          interact.editReply(
            `Упс, что-то пошло не так! \n\`\`\`${e.message}\`\`\``
          );
        });
  },
  async shareThread(client) {
    const player = discordp.Player.singleton(client);
    await player.extractors.register(extractor.AttachmentExtractor);
    await player.extractors.register(YandexMusicExtractor, config.user);
    await player.extractors.register(extractor.YouTubeExtractor);
  },
};
