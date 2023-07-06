const discord = require("discord.js"), discordv = require('@discordjs/voice'), ym = require("ym-api"), fs = require("fs"), path = require("path")

function fileimport(filepath, replacedata, hide) {
    filename = path.basename(filepath)
    if (!hide) console.log("[Music]", ('Importing ' + filename + '...').gray)
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

const checkVoice = (interact) => {
    let tmp = discordv.getVoiceConnection(interact.guildId)
    if (tmp) {
        return tmp
    } else
        return discordv.joinVoiceChannel({ adapterCreator: interact.guild.voiceAdapterCreator, guildId: interact.guildId, channelId: interact.member.voice.channelId })
}

const playsound = async (interact, title, debug, searchbyTrackId) => {
    await interact.reply("*Думоет...*")
    const connection = checkVoice(interact)
    const player = discordv.createAudioPlayer();
    let resource = discordv.AudioResource.prototype
    let out = ""
    interact.editReply("Поиск по: `" + title + "`")
    console.log("Поиск по: " + title)
    let track
    if (!searchbyTrackId) {
        const result = await YaMusicApi.searchTracks(title, { page: 0 })
        const titles = []
        result.tracks.results.forEach(res => {
            const artists = []
            res.artists.forEach(artist => artists.push(artist.name))
            titles.push(res.title + " - " + artists.join(", "))
        })
        interact.editReply("Результат:\n" + titles.join("\n"))
        track = result.tracks.results[0]
    } else {
        track = (await YaMusicApi.getTrack(parseInt(title)))[0]
    }
    const stream = await YaWrapper.getMp3DownloadUrl(parseInt(track.id), "low")
    resource = discordv.createAudioResource(stream, { inlineVolume: true })
    const artists = []
    track.artists.forEach(a => artists.push(a.name))
    out = `Запущено: \`${track.title} - ${artists.join(", ")}\``
    if (debug) {
        const data = await YaWrapper.getMp3DownloadInfo(parseInt(track.id), "low")
        out+=(`\nPreview: \`${data.preview}\`\nTrackID: \`${track.id}\``)
        if(data.preview) out+="\nУ вас нет Yandex Plus или использован некорректный токен!"
    }
    console.log(out)
    player.play(resource);
    connection.subscribe(player);
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
                    { name: "Проиграть с отладкой", value: "playdebug" },
                    { name: "Покинуть", value: "leave" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("songtitle")
                .setDescription("Название песни.")
        )
        .addNumberOption(o =>
            o.setName("trackid")
                .setDescription("Или ID песни. (Последнее число в ссылке. Пример: /album/0/track/АЙДИ)")),
    async iexec(interact, bot) {
        const param = await interact.options.getString("param")
        const title = await interact.options.getString("songtitle")
        const trackid = await interact.options.getNumber("trackid")
        if (trackid) {
            if (param === "play") return playsound(interact, trackid, false, true)
            if (param === "playdebug") return playsound(interact, trackid, true, true)
        } else if (title) {
            if (param === "play") return playsound(interact, title, false, false)
            if (param === "playdebug") return playsound(interact, title, true, false)
        }
        if (param === "leave") {
            await interact.reply("Отключаемся.");
            const voice = await discordv.getVoiceConnection(interact.guildId);
            await voice.disconnect();
            return await voice.destroy();
        } else {
            return interact.reply("А если подумать?")
        }
    }
}