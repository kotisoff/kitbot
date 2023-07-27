const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  idata: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Provides information about the user."),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    // interaction.user is the object representing the User who ran the command
    // interaction.member is the GuildMember object, which represents the user in the specific guild
    interact.reply(
      `This command was run by ${interact.user.username}, who joined on ${interact.member.joinedAt}.`,
    );
  },
};
