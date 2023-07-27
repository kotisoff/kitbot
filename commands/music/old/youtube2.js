const discord = require("discord.js"), discordp = require('discord-player'), colors = require("colors")
module.exports = {
    idata: new discord.SlashCommandBuilder()
        .setName("yt")
        .setDescription("Plays music from Youtube OUTDATED, USE /PLAY")
        .addStringOption(o =>
            o.setName("param")
                .setDescription("Parameter")
                .addChoices(
                    { name: "Проиграть", value: "play" },
                    { name: "Пропустить", value: "skip" },
                    { name: "Пауза", value: "pause" },
                    { name: "Список воспроизведения", value: "list" },
                    { name: "Остановить", value: "stop" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("query")
                .setDescription("Видео.")
        ),

    /**@param {discord.Interaction} interact @param {discord.Client} bot*/
    async iexec(interact, bot) {
        const param = await interact.options.getString("param")
        const query = await interact.options.getString("query")
        if (!param) return interact.reply("А если подумать?")
        if (param === "play") {
            if(!query) return await interact.reply({ content:"А если подумать?", ephemeral: true });
            try{await interact.reply("*Думоет...*")}catch{return console.log("Unavalible for now")};
            const channel = interact.member?.voice?.channel
            if (!channel) return await interact.editReply("Сначала подключитесь к голосовому каналу!")
            const queue = discordp.useQueue(interact.guildId)
            if (queue && queue.channel.id !== channel.id) return await interact.editReply("Музыка уже проигрывается в другом канале.");
            const player = discordp.useMainPlayer();
            const search = await player.search(query,{searchEngine:`youtube`,requestedBy:interact.member.id}).catch(()=>{});
            if(!search?.hasTracks()) return await interact.editReply("Не найдено треков по этому запросу.");
            await player.play(channel,search.tracks[0])
                .then(()=>{
                    console.log("[YTMusic] "+`Added to queue: "${search.tracks[0].title}" in ${interact.guildId}`.gray);
                    let out = `Добавлено в очередь: \`${search.tracks[0].title}\``
                    interact.editReply(out);

                })
                .catch(e=>{
                    console.log("[YTMusic] "+`Something went wrong! ${e.message}`.gray)
                    interact.editReply(`Упс, что-то пошло не так! \n\`\`\`${e.message}\`\`\``)
                });
        }else
        if(param === "skip") {
            await interact.reply("*Думоет...*");
            const queue = discordp.useQueue(interact.guildId);
            queue.node.skip();
            return await interact.editReply("Трек пропущен.")
        }else
        if(param === "pause"){
            await interact.reply("*Думоет...*")
            const queue = discordp.useQueue(interact.guildId)
            if(queue.node.isPaused()){
                queue.node.setPaused(false);
                interact.editReply("Воспроизведение продолжено.");
            }else{
                queue.node.setPaused(true);
                interact.editReply("Воспроизведение приостановлено.");
            }
        }else
        if(param === "list"){
            await interact.reply("*Думоет...*");
            const queue = discordp.useQueue(interact.guildId);
            const tracks = queue.tracks.toArray()
            let out = "Список воспроизведения:\n"
            tracks.forEach(track=>out+=`${tracks.indexOf(track)+1}. ${track.title} - by ${track.requestedBy.toString()}`)
            if(out.length>2000) return interact.editReply(out.substring(0,1980)+`\nAnd more...`);
            interact.editReply(out);
        }else
        if(param === "stop"){
            await interact.reply("*Думоет...*");
            const queue = discordp.useQueue(interact.guildId);
            queue.delete();
            await interact.editReply("Плейлист остановлен.");
        }
    }
}