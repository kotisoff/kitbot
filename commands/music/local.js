const discord = require("discord.js"), discordv = require('@discordjs/voice'), path = require("node:path"), fs = require("node:fs");

const checkVoice = (interact) => {
    let tmp = discordv.getVoiceConnection(interact.guildId)
    if (tmp) {
        return tmp
    } else
        return discordv.joinVoiceChannel({ adapterCreator: interact.guild.voiceAdapterCreator, guildId: interact.guildId, channelId: interact.member.voice.channelId })
}
/** @param {discord.Interaction} interact*/
const soundpath = "D:/Папки/Music/"
const localSounds = async (interact) => {
    await interact.reply("Думоет...")
    let files = fs.readdirSync(soundpath).filter(f => f.endsWith(".mp3"))
    const text = "Список песен\n`" + files.join("\n")
    if(text.length>2000){
        
    }else{
        interact.editReply
    }
}
/** @param {discord.Interaction} interact @param {String} url*/
const playsound = async (interact, url) => {
    await interact.reply("*Думоет...*")
    if (!url) return interact.editReply("ГДЕ НАЗВАНИЕ ФАЙЛА МАТЬ ТВОЮ")
    const connection = checkVoice(interact)
    const player = discordv.createAudioPlayer();
    let resource = discordv.AudioResource.prototype
    let out = ""
    const fpath = path.join(soundpath, url)
    if (fs.existsSync(fpath)) {
        resource = discordv.createAudioResource(fpath, { inlineVolume: true });
        out = "Запущено: `" + url + "`"
    } else {
        return interact.editReply("Введите правильный путь!")
    }
    player.play(resource);
    connection.subscribe(player);
    interact.editReply(out)
}

module.exports = {
    idata: new discord.SlashCommandBuilder()
        .setName("localmusic")
        .setDescription("Plays music from Local Storage")
        .addStringOption(o =>
            o.setName("param")
                .setDescription("Parameter")
                .addChoices(
                    { name: "Локальный список", value: "locallist" },
                    { name: "Проиграть", value: "play" },
                    { name: "Покинуть", value: "leave" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("filename")
                .setDescription("Название файла.")
        ),
    /**@param {discord.Interaction} interact @param {discord.Client} bot*/
    async iexec(interact, bot) {
        const param = await interact.options.getString("param")
        const url = await interact.options.getString("filename")
        if (!param) return interact.reply("А если подумать?")
        if (param === "locallist") return localSounds(interact)
        if (param === "play") return playsound(interact, url)
        if (param === "leave") { await interact.reply("Отключаемся."); const voice = await discordv.getVoiceConnection(interact.guildId); await voice.disconnect(); return await voice.destroy(); }
    }
}