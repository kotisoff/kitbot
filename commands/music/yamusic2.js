const discord = require("discord.js"), discordp = require('discord-player'), discordv = require("@discordjs/voice"), ym = require("ym-api"), fs = require("fs"), path = require("path")
/** @param {String} filepath @param {Boolean} hide*/
function fileimport(filepath, replacedata, hide) {
    filename = path.basename(filepath)
    if (!hide) console.log("[YaMusic2]", ('Importing ' + filename + '...').gray)
    try { require(filepath) } catch { fs.writeFileSync(filepath, JSON.stringify(replacedata)) }
    return require(filepath)
}

/*Как получить token и uid?
    Инструкция по токену: https://github.com/MarshalX/yandex-music-api/discussions/513

    Переходим по https://mail.yandex.ru/ спустя несколько секунд в строке поиска будет ваш uid.

    Вставляем данные в configs/kot.music/yaconfig.json

    Я хз скольно оно будет работать, но когда будет кидать ошибку тогда и проделывайте эти фокусы заново.
*/

const config = fileimport(path.join(__dirname, "../../configs/kot.music/yaconfig.json"),
    {
        user: {
            token: "yourAuthToken",
            uid: "yourUid"
        }
    }
)

const YaMusicApi = new ym.YMApi();
YaMusicApi.init({ access_token: config.user.token, uid: config.user.uid });
const YaWrapper = new ym.WrappedYMApi(YaMusicApi);


/** @param {discord.Interaction} interact*/
const play = async (interact, query) => {
    const channel = interact.member.voice.channel;
    const player = discordp.useMainPlayer();
    const queue = player.nodes.create(interact.guild);
    queue.connect(channel)
    console.log("Поиск по: " + query);
    let track;
    if (typeof (query) === "number") {
        track = await YaWrapper.getTrack(parseInt(query));
    } else {
        const result = await YaMusicApi.searchTracks(query)
        track = result.tracks.results[0]
    }
    const trackurl = await YaWrapper.getMp3DownloadUrl(parseInt(track.id + ""), "low");
    console.log(trackurl);
    const artists = []
    track.artists.forEach(a => artists.push(a.name))
    out = `Добавлено в очередь: \`${track.title} - ${artists.join(", ")} (${track.id})\``
    if ((await YaWrapper.getMp3DownloadInfo(parseInt(track.id + ''))).preview) out += "\nУ вас нет Yandex Plus или использован некорректный токен!"
    console.log(out);
    queue.node.playRaw(discordv.createAudioResource(trackurl, { inlineVolume: true }))
    interact.editReply(out);
}

module.exports = {
    idata: new discord.SlashCommandBuilder()
        .setName("yamusic")
        .setDescription("Plays music from YaMusic")
        .addStringOption(o =>
            o.setName("param")
                .setDescription("Parameter")
                .addChoices(
                    { name: "Проиграть", value: "play" },
                    { name: "Пропустить", value: "skip" },
                    { name: "Остановить все песни", value: "stop" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("songtitle")
                .setDescription("Название песни.")
        )
        .addNumberOption(o =>
            o.setName("trackid")
                .setDescription("ID песни. (Последнее число в ссылке. Пример: /album/0/track/АЙДИ)")
        )
        .addStringOption(o =>
            o.setName("trackurl")
                .setDescription("Ссылка на песню.")
        )
        .addStringOption(o =>
            o.setName("playlisturl")
                .setDescription("Ссылка на плейлист")
        ),

    /** @param {discord.Interaction} interact @param {discord.Client} bot*/
    async iexec(interact, bot) {
        await interact.reply("*Думоет...*")
        const param = await interact.options.getString("param")
        const title = await interact.options.getString("songtitle")
        const trackurl = await interact.options.getString("trackurl") ?? ""
        const playlisturl = await interact.options.getString("playlisturl") ?? ""
        let trackid = await interact.options.getNumber("trackid")
        if (trackurl.startsWith("https://")) { trackid = parseInt(trackurl.split("/track/")[1] ?? "96614360") };
        if (trackid) {
            return play(interact, trackid)
        } else if (title) {
            return play(interact, title)
        }
        if (param === "stop") {
            await interact.editReply("Останавливаем.");
            return discordp.useQueue(interact.guildId).delete();
        } else {
            return interact.editReply("А если подумать?")
        }
    }
}