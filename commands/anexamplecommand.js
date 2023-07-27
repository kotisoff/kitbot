const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  idata: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    let APIping = Math.round(bot.ws.ping);
    interact.reply(`Понг сука! Задержка API: ${APIping}мс`);
    if (APIping >= 400) {
      interact.followup(
        `Задержка слегка выше ожидаемой суммы... А точнее ${APIping} наъуй.`,
      );
    }
  },
};
