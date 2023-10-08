const discord = require("discord.js"), axios = require("axios").default;

const replyMessages = [
  "~~А, вы любите пидоров?~~",
  "Вот вам ваш сладенький трапик",
  "А вы знали, что у него есть __**сюрприз**__ в штанах?",
  "Ну... Я такого от тебя не ожидал...",
  "...*пхпхпхпхх*... Прости, не могу сдержать смех... **АХАХАХХАХАХ**",
  "Вот больно сука он похож на тян...",
  "**харе наяривать на мужиков**"
]

module.exports = {
  idata: new discord.SlashCommandBuilder()
    .setName("astolfo")
    .setDescription("Replies random Astolfo image!"),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    const data = (await axios.get("https://astolfo.rocks/")).data;
    const url = /https:\/\/astolfo\.rocks\/astolfo\/[0-9]+\.[A-Za-z]+/i.exec(data)[0];
    const Embed = new discord.EmbedBuilder()
      .setColor(0xf7bfd7)
      .setImage(url)
      .setDescription(`${replyMessages[Math.round(Math.random() * replyMessages.length)]}`)
      .setTimestamp()
      .setFooter({ text: "Все права обмяуканы 2023-2023" });
    interact.reply({ embeds: [Embed] });
  },
};
