const Command = require("../../utils/Command");

const discord = require("discord.js"), axios = require("axios").default;

const replyMessages = [
  "~~А, вы любите пидоров?~~",
  "Вот вам ваш сладенький трапик",
  "А вы знали, что у него есть __**сюрприз**__ в штанах?",
  "Ну... Я такого от тебя не ожидал...",
  "...*пхпхпхпхх*... Прости, не могу сдержать смех... **АХАХАХХАХАХ**",
  "Вот больно сука он похож на тян...",
  "**харе наяривать на мужиков**",
  "_Смотрит ~~не~~ осуждающе..._",
  "_Вы чувствуете тяжесть своих грехов_",
  "_Кто-то злобно за вами наблюдает_",
  "Я же всё вижу, сын мой...",
  "Кароче: мама сказала, что если ещё раз увидит трапиков на моём мониторе то размажет моё лицо по клавиырпыпдлрцщуыфпщрщшмирлРЩШрщшпрщшшОЫРОПЩЫОРПЩШЛЫРПШЩЫРЩШПЦУЦПЫЦУ54П65У65)"
]

const Astolfo = new Command("astolfo", "Astolfo")
Astolfo.setSlashAction(async (interact, bot) => {
  const data = (await axios.get("https://astolfo.rocks/")).data;
  const url = /https:\/\/astolfo\.rocks\/astolfo\/[0-9]+\.[A-Za-z]+/i.exec(data)[0];
  const Embed = new discord.EmbedBuilder()
    .setColor(0xf7bfd7)
    .setImage(url)
    .setDescription(`${replyMessages[Math.floor(Math.random() * replyMessages.length)]}`)
    .setTimestamp()
    .setFooter({ text: "Все права обмяуканы 2023-2023" });
  interact.reply({ embeds: [Embed] });
}).slashCommandInfo.setDescription("Replies random Astolfo image!")
module.exports = Astolfo;