const discord = require("discord.js");

module.exports = {
  idata: new discord.SlashCommandBuilder()
    .setName("spaceplacer")
    .setDescription('Places more "space"')
    .addNumberOption((o) =>
      o.setName("count").setDescription("кол-во пробелов").setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("query")
        .setDescription("что будет опробеливаться хд")
        .setRequired(true)
    ),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    const count = interact.options.getNumber("count");
    const query = interact.options.getString("query");
    await interact.reply({
      content: query.split("").join(" ".repeat(count)),
      ephemeral: true,
    });
  },
};
