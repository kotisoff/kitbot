const discord = require("discord.js");

module.exports = {
  idata: new discord.SlashCommandBuilder()
    .setName("buttons")
    .setDescription("Test command!"),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
  },
};
