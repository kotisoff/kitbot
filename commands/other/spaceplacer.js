const Command = require("../../core/Command");

const SpacePlacer = new Command("spaceplacer", "SpacePlacer");
SpacePlacer.setSlashAction(async (interact, bot) => {
  const count = interact.options.getNumber("count");
  const query = interact.options.getString("query");
  await interact.reply({
    content: query.split("").join(" ".repeat(count)),
    ephemeral: true
  });
})
  .slashCommandInfo.setDescription('Places more "space"')
  .addNumberOption((o) =>
    o.setName("count").setDescription("кол-во пробелов").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("query")
      .setDescription("что будет опробеливаться хд")
      .setRequired(true)
  );

module.exports = SpacePlacer;
