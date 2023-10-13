const discord = require("discord.js");

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("fy")
    .setDescription("Послать нахуй")
    .addUserOption((option) =>
      option.setName("user").setDescription(`Кого послать?`)
    ),
  pdata: {
    name: "fuckyou",
    shortname: "fy",
    runame: "идинахуй",
  },
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async exec(interact, bot) {
    let args = interact.options.getUser("user");
    if (!args) await interact.channel.send("Пошёл нахуй!");
    if (args) await interact.channel.send(`Пошёл нахуй, ${args}!`);
    interact.reply("_ _");
    interact.deleteReply();
  },
  /**@param {discord.Client} bot @param {discord.Message} msg @param {Array} args*/
  async pexec(bot, msg, args) {
    msg.delete().catch();
    if (!args[0]) return msg.channel.send("Пошёл нахуй!");
    if (args[0]) return msg.channel.send(`Пошёл нахуй, ${args.join(" ")}!`);
  },
};
