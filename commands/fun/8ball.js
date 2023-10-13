const discord = require("discord.js"), axios = require("axios").default;

const replyMessages = [
    "Думаю да.",
    "Конечно же нет!",
    "Ни в коем разе!",
    "Конечно!",
    "Даже не думай...",
    "Обязательно!",
    "Попробуй ещё раз...",
    "Тут я тебе не помощник...",
    "А зачем?",
    "Да.",
    "Не.",
    "Нет.",
    "НЕТ",
    "ДА, ДА, ДА, ДА.",
    "НЕ-НЕ-НЕ-НЕ-НЕ!",
    "Давай попробуем!",
    "Не-а."
]

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("8ball")
        .setDescription("Replies with random answer!")
        .addStringOption(o =>
            o.setName("question")
                .setDescription("Только вопросы, на которые можно ответить да или нет.")
                .setRequired(true)
                .setMinLength(1)
        ),
    /**@param {discord.Interaction} interact @param {discord.Client} bot*/
    async exec(interact, bot) {
        const question = interact.options.getString("question")
        const Embed = new discord.EmbedBuilder()
            .setColor(0x4287f5)
            .setDescription(`${interact.user.username} спросил: ${question}\n\n**${replyMessages[Math.round(Math.random() * replyMessages.length)]}**`)
            .setTimestamp()
            .setFooter({ text: "Все права обмяуканы 2023-2023." });
        interact.reply({ embeds: [Embed] });
    },
};
