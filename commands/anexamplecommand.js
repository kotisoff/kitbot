const discord = require("discord.js");

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async exec(interact, bot) {
    let APIping = Math.round(bot.ws.ping);
    await interact.reply(`Понг сука! Задержка API: ${APIping}мс`);
    if (APIping >= 400) {
      interact.followup(
        `Задержка слегка выше ожидаемой суммы... А точнее ${APIping} наъуй.`
      );
    }
  },
};
