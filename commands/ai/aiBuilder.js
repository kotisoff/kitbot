const Command = require("../../utils/Command");
const aiBuilder = require("./ai.lib/aiBuilderLib");

const ai = new Command("aibuild", "AIBuilder");
ai.slashCommandInfo
  .setDescription("Build new ai profile.")
  .addStringOption((o) =>
    o.setName("id").setDescription("ai mod id").setRequired(true)
  )
  .addStringOption((o) => o.setName("name").setDescription("ai profile name"))
  .addStringOption((o) =>
    o.setName("avatarurl").setDescription("URL to avatar")
  );

ai.setSlashAction(async (i, b) => {
  const id = await i.options.getString("id");
  const name = await i.options.getString("name");
  const avatarurl = await i.options.getString("avatarurl");
  const builder = new aiBuilder(id, i.user.username);
  builder.setName(name).setAvatarUrl(avatarurl);
  await i.reply(`\`\`\`json\n${JSON.stringify(builder.build())}\`\`\``);
});

ai.setGlobal(false);

module.exports = ai;
