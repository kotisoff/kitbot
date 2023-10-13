const discord = require("discord.js");

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("buttons")
    .setDescription("Test command!"),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async exec(interact, bot) {
  },
};
