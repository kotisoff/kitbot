const Command = require("../../utils/Command");
const { AttachmentBuilder } = require("discord.js");

const urigen = new Command("urigen", "URIGen");

urigen.slashCommandInfo
  .setDescription("Generates URI component for you")
  .addStringOption((o) =>
    o.setName("query").setDescription("text to encode").setRequired(true)
  );

urigen.setSlashAction(async (i, b) => {
  const query = i.options.getString("query");
  i.reply({
    content: "Вот собсна ваш текст:",
    files: [
      new AttachmentBuilder(Buffer.from(encodeURIComponent(query), "utf-8"), {
        name: "uri.txt"
      })
    ]
  });
});

module.exports = urigen;
