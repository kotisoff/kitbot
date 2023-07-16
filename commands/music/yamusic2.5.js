const discord = require("discord.js"), discordp = require('discord-player'), { YandexMusicExtractor } = require("discord-player-yandexmusic");
const ymext = `ext:${YandexMusicExtractor.identifier}`

/*Как получить token и uid?
    Инструкция по токену: https://github.com/MarshalX/yandex-music-api/discussions/513

    Переходим по https://mail.yandex.ru/ спустя несколько секунд в строке поиска будет ваш uid.

    Вставляем данные в configs/kot.music/yaconfig.json

    Я хз скольно оно будет работать, но когда будет кидать ошибку тогда и проделывайте эти фокусы заново.
*/

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
                    { name: "Пауза", value: "pause" },
                    { name: "Текущий трек", value: "current" },
                    { name: "Список воспроизведения", value: "list" },
                    { name: "Остановить", value: "stop" }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("query")
                .setDescription("Песня/Плейлист/Альбом с Yandex Music.")
        ),
    /**@param {discord.Interaction} interact @param {discord.Client} bot*/
    async iexec(interact, bot) {
        discordp.Playlist.prototype.url
        const param = await interact.options.getString("param")
        const query = await interact.options.getString("query")
        if (!param) return interact.reply("А если подумать?")
        if (param === "play") {
            if (!query) return await interact.reply({ content: "А если подумать?", ephemeral: true });
            try { await interact.reply("*Думоет...*") } catch { return console.log("Unavalible for now") };
            const channel = interact.member?.voice?.channel
            if (!channel) return await interact.editReply("Сначала подключитесь к голосовому каналу!")
            const queue = discordp.useQueue(interact.guildId)
            if (queue && queue.channel.id !== channel.id) return await interact.editReply("Музыка уже проигрывается в другом канале.");
            const player = discordp.useMainPlayer();
            const search = await player.search(query, { searchEngine: ymext, requestedBy: interact.member.id }).catch(() => { });
            if (!search?.hasTracks()) return await interact.editReply("Не найдено треков по этому запросу.");
            if (search.hasPlaylist()) {
                await player.play(channel, search.playlist, { searchEngine: ymext })
                    .then(() => {
                        console.log("[YaMusic] " + `Added ${search.tracks.length} tracks to queue with "${search.playlist.title} - ${search.playlist.author.name}"`.gray)
                        interact.editReply(`Добавлен плейлист: \`${search.playlist.title} - ${search.playlist.author.name}\` с ${search.tracks.length} песнями.`);
                    })
                    .catch(e => {
                        console.log("[YaMusic] " + `Something went wrong! ${e.message}`.gray)
                        interact.editReply(`Упс, что-то пошло не так! \n\`\`\`${e.message}\`\`\``)
                    });
            } else
                await player.play(channel, search.tracks[0], { searchEngine: ymext })
                    .then(() => {
                        console.log("[YaMusic] " + `Added to queue: "${search.tracks[0].title} - ${search.tracks[0].author}" in ${interact.guildId}`.gray);
                        interact.editReply(`Добавлено в очередь: \`${search.tracks[0].title} - ${search.tracks[0].author}\` (${search.tracks[0].duration})`);
                    })
                    .catch(e => {
                        console.log("[YaMusic] " + `Something went wrong! ${e.message}`.gray)
                        interact.editReply(`Упс, что-то пошло не так! \n\`\`\`${e.message}\`\`\``)
                    });
        } else if (param === "skip") {
            await interact.reply("*Думоет...*")
            const queue = discordp.useQueue(interact.guildId);
            queue.node.skip();
            const track = queue.currentTrack
            return await interact.editReply(`Трек \`${track.title} - ${track.author}\` пропущен.`);
        } else if (param === "pause") {
            await interact.reply("*Думоет...*")
            const queue = discordp.useQueue(interact.guildId);
            if (queue.node.isPaused()) {
                queue.node.setPaused(false);
                interact.editReply("Воспроизведение продолжено.");
            } else {
                queue.node.setPaused(true);
                interact.editReply("Воспроизведение приостановлено.");
            }
        } else if (param === "current"){
            await interact.reply("*Думоет...*");
            const queue = discordp.useQueue(interact.guildId)
            if(!queue) return await interact.editReply("Сейчас ничего не проигрывается!")
            const track = queue.currentTrack
            return await interact.editReply(`Текущий трек: \`${track.title} - ${track.author}\` ${queue.node.createProgressBar()}`);
        } else if (param === "list") {
            await interact.reply("*Думоет...*");
            const queue = discordp.useQueue(interact.guildId);
            const tracks = queue.tracks.data
            let out = `Список воспроизведения:\n${tracks.map(track=>`${tracks.indexOf(track) + 1}. ${track.title} - by ${track.requestedBy.toString()}`)}`
            if (out.length > 2000) return interact.editReply(out.substring(0, 1980) + `\nAnd more...`);
            interact.editReply(out);
        } else if (param === "stop") {
            await interact.reply("*Думоет...*");
            const queue = discordp.useQueue(interact.guildId);
            queue.delete();
            await interact.editReply("Плейлист остановлен.");
        }
    }
}