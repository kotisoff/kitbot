const discord = require("discord.js"), discordv = require('@discordjs/voice'), path = require("node:path"), fs = require("node:fs");

const checkVoice = (interact) => {
    let tmp = discordv.getVoiceConnection(interact.guildId)
    if (tmp) return tmp
    return discordv.joinVoiceChannel({ adapterCreator: interact.guild.voiceAdapterCreator, guildId: interact.guildId, channelId: interact.member.voice.channelId })
}
/** @param {discord.Interaction} interact @param {String} url*/
const playsound = async (interact, url) => {
    await interact.reply("*Думоет...*");
    if (!url) return interact.editReply("ГДЕ ССЫЛКА МАТЬ ТВОЮ");
    const connection = checkVoice(interact);
    const player = discordv.createAudioPlayer();
    const resource = discordv.createAudioResource(url, { inlineVolume: true });
    const out = `Пытаемся запустить: \`${url}\``
    player.play(resource);
    connection.subscribe(player);
    interact.editReply(out);
}

module.exports = {
    idata: new discord.SlashCommandBuilder()
        .setName("rawmusic")
        .setDescription("Plays music from Raw Url")
        .addStringOption(o =>
            o.setName("param")
                .setDescription("Parameter")
                .addChoices(
                    { name: "Проиграть", value: "play" },
                    { name: "Покинуть", value: "leave" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("url")
                .setDescription("Ссылка к сырому mp3 файлу.")
        ),
    /**@param {discord.Interaction} interact @param {discord.Client} bot*/
    async iexec(interact, bot) {
        const param = await interact.options.getString("param")
        const url = await interact.options.getString("url")
        if (!param) return interact.reply("А если подумать?")
        if (param === "play") return playsound(interact, url)
        if (param === "leave") { await interact.reply("Отключаемся."); const voice = discordv.getVoiceConnection(interact.guildId); voice.disconnect(); return voice.destroy(); }
    }
}