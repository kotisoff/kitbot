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
const YaWrapper = new ym.WrappedYMApi(YaMusicApi);

const checkVoice = (interact) => {
    let tmp = discordv.getVoiceConnection(interact.guildId)
    if (tmp) {
        return tmp
    } else
        return discordv.joinVoiceChannel({ adapterCreator: interact.guild.voiceAdapterCreator, guildId: interact.guildId, channelId: interact.member.voice.channelId })
}

const playsound = async (interact, title, debug) => {
    await interact.reply("Думоет...")
    const connection = checkVoice(interact)
    const player = discordv.createAudioPlayer();
    let resource = discordv.AudioResource.prototype
    let out = ""
    await YaMusicApi.init({access_token:config.user.token,uid:config.user.uid})
    interact.editReply("Поиск по: `" + title + "`")
    const result = await YaMusicApi.searchTracks(title)
    const titles = []
    result.tracks.results.forEach(res => {
        const artists = []
        res.artists.forEach(artist => artists.push(artist.name))
        titles.push(res.title + " - " + artists.join(", "))
    })
    interact.editReply("Результат:\n" + titles.join("\n"))
    const track = result.tracks.results[0]
    const stream = await YaWrapper.getMp3DownloadUrl(track.id, "low")
    resource = discordv.createAudioResource(stream, { inlineVolume: true })
    const artists = []
    track.artists.forEach(a => artists.push(a.name))
    out = `Запущено: \`${track.title} - ${artists.join(", ")}\``
    if(debug) {
        const data = await YaWrapper.getMp3DownloadInfo(track.id, "low")
        out = (`${out}\nPreview: \`${data.preview}\`\nTrackID: \`${track.id}\``)
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
                    { name: "Проиграть с отладкой", value: "playdebug"},
                    { name: "Покинуть", value: "leave" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("songtitle")
                .setDescription("Название песни.")
        ),
    async iexec(interact, bot) {
        const param = await interact.options.getString("param")
        const title = await interact.options.getString("songtitle")
        if (!param) return interact.reply("А если подумать?")
        if (param === "play") return playsound(interact, title)
        if (param === "playdebug") return playsound(interact, title, true)
        if (param === "leave") { await interact.reply("Отключаемся."); const voice = await discordv.getVoiceConnection(interact.guildId); await voice.disconnect(); return await voice.destroy(); }
    }
}