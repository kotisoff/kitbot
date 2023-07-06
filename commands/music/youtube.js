const discord = require("discord.js"), discordv = require('@discordjs/voice'), ytdl = require("ytdl-core"), ytsr = require("ytsr");

const checkVoice = (interact) => {
    let tmp = discordv.getVoiceConnection(interact.guildId)
    if (tmp) {
        return tmp
    } else
        return discordv.joinVoiceChannel({ adapterCreator: interact.guild.voiceAdapterCreator, guildId: interact.guildId, channelId: interact.member.voice.channelId })
}

const playsound = async (interact, url) => {
    await interact.reply("Думоет...")
    if (!url) return interact.editReply("ГДЕ ССЫЛКА МАТЬ ТВОЮ")
    const connection = checkVoice(interact)
    const player = discordv.createAudioPlayer();
    let resource = discordv.AudioResource.prototype
    let out = ""
    if (ytdl.validateURL(url)) {
        resource = discordv.createAudioResource(ytdl(url, { filter: "audioonly" }), { inlineVolume: true })
        out = "Запущено: `" + (await ytdl.getInfo(url)).videoDetails.title + "`"
    } else {
        return interact.editReply("ссылка хуита, давай по новой")
    }
    player.play(resource);
    connection.subscribe(player);
    interact.editReply(out)
}

module.exports = {
    idata: new discord.SlashCommandBuilder()
        .setName("youtube")
        .setDescription("Plays music from Youtube")
        .addStringOption(o =>
            o.setName("param")
                .setDescription("Parameter")
                .addChoices(
                    { name: "Проиграть (ОЧЕНЬ часто крашается)", value: "play" },
                    { name: "Покинуть", value: "leave" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("url")
                .setDescription("Ссылка на видео.")
        ),
    async iexec(interact, bot) {
        const param = await interact.options.getString("param")
        const url = await interact.options.getString("url")
        if (!param) return interact.reply("А если подумать?")
        if (param === "play") return playsound(interact, url)
        if (param === "leave") { await interact.reply("Отключаемся."); const voice = await discordv.getVoiceConnection(interact.guildId); await voice.disconnect(); return await voice.destroy(); }
    }
}