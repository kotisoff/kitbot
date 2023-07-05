const discord = require("discord.js"), discordv = require('@discordjs/voice'), ytdl = require("ytdl-core"), ytsr = require("ytsr"), path = require("node:path"), fs = require("node:fs")

const checkVoice = (interact) => {
    let tmp = discordv.getVoiceConnection(interact.guildId)
    if (tmp) {
        return tmp
    } else
    return discordv.joinVoiceChannel({ adapterCreator: interact.guild.voiceAdapterCreator, guildId: interact.guildId, channelId: interact.member.voice.channelId })
}

const soundpath = "D:/Папки/Music/"
const localSounds = async (interact) => {
    await interact.reply("Думоет...")
    let files = fs.readdirSync(soundpath).filter(f => f.endsWith(".mp3"))
    let newfiles = []
    const text = "Список песен\n`" + files.join("\n")
    let out = []
    if(text.length>2000){
        out.push(text.slice(0,1999)+"`")
        out.push("`"+text.substring(2000)+"`")
        await interact.editReply(out[0])
        await interact.followUp(out[1])
    }else
    interact.editReply(text+"`")
}

const playsound = async (interact, url, local) => {
    await interact.reply("Думоет...")
    const connection = checkVoice(interact)
    const player = discordv.createAudioPlayer();
    let resource = discordv.AudioResource.prototype
    let out = ""
    if (local) {
        const fpath = path.join(soundpath, url)
        if (fs.existsSync(fpath)) {
            resource = discordv.createAudioResource(fpath, { inlineVolume: true });
            out = "Запущено: `"+url+"`"
        } else {
            return interact.editReply("Введите правильный путь!")
        }
    } else {
        if (ytdl.validateURL(url)) {
            resource = discordv.createAudioResource(ytdl(url, { filter: "audioonly" }), { inlineVolume: true })
            out = "Запущено: `" + (await ytdl.getInfo(url)).videoDetails.title + "`"
        } else {
            return interact.editReply("ссылка хуита, давай по новой")
        }
    }
    player.play(resource);
    connection.subscribe(player);
    interact.editReply(out)
}

module.exports = {
    idata: new discord.SlashCommandBuilder()
        .setName("music")
        .setDescription("Plays music")
        .addStringOption(o =>
            o.setName("param")
                .setDescription("Parameter")
                .addChoices(
                    { name: "Локальный список", value: "locallist" },
                    { name: "Проиграть из локального списка", value: "playlocal" },
                    { name: "Проиграть из YouTube (ОЧЕНЬ часто крашается)", value: "playyoutube" },
                    { name: "Покинуть", value: "leave"}
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("url_or_filename")
                .setDescription("Ссылка или название файла.")
        ),
    async iexec(interact, bot) {
        const param = await interact.options.getString("param")
        const url = await interact.options.getString("url_or_filename")
        if (!param) return interact.reply("А если подумать?")
        if (param === "locallist") return localSounds(interact)
        if (param === "playlocal") return playsound(interact, url, true)
        if (param === "playyoutube") return playsound(interact, url)
        if (param === "leave"){ await interact.reply("Отключаемся.");const voice = await discordv.getVoiceConnection(interact.guildId); await voice.disconnect(); return await voice.destroy(); }
    }
}