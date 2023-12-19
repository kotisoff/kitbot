const Command = require("../../utils/Command");
const aiBuilder = require("./ai.lib/aiBuilderLib");
const discord = require("discord.js");

const command = new Command("aicopyuser", "AiCU");

command.slashCommandInfo
  .setDescription(
    "Copies last N user messages to create ai profile based on his messages."
  )
  .addUserOption((u) =>
    u.setName("target").setDescription("Target user to copy.").setRequired(true)
  )
  .addNumberOption((n) =>
    n
      .setName("n")
      .setDescription("Number of all messages to scan")
      .setMaxValue(100)
      .setMinValue(1)
  )
  .addStringOption((o) =>
    o.setName("prefix").setDescription("Prefix of profile")
  )
  .addStringOption((o) =>
    o
      .setName("system")
      .setDescription(
        "Message from system to ai. System message is more valueable for ai than other."
      )
  );

command.setSlashAction(async (i, b) => {
  const devGuild = await (await b.guilds.fetch())
    .get(b.config.bot.devGuildId)
    .fetch();
  const allowedUsers = await devGuild.members.fetch();
  if (!allowedUsers.has(i.user.id))
    return i.reply(
      `А ты не ахуел?\nЭта команда доступна только людям с ${devGuild.name}!`
    );
  const user = i.options.getUser("target");
  const number = i.options.getNumber("n");
  const prefix = i.options.getString("prefix");
  const system = i.options.getString("system");

  if (user.id == b.user.id)
    return await i.reply("Вы не можете скопировать меня!");

  const ai = new aiBuilder(user.username, i.user.username);
  ai.setName(user.displayName).setAvatarUrl(
    user.avatarURL({ extension: "png" })
  );

  if (system) ai.addSystemMessage(system);
  if (prefix) ai.setCallPrefix(prefix);

  let messages = (await i.channel.messages.fetch({ limit: number }))
    .filter((m) => !m.author.bot)
    .reverse()
    .map((m) => ({
      content: m.content,
      user: { id: m.author.id, username: m.author.username }
    }));

  messages = messages.reduce((acc, current) => {
    const lastEntry = acc[acc.length - 1];
    if (lastEntry && lastEntry.user.id === current.user.id) {
      lastEntry.content += "\n" + current.content;
    } else {
      acc.push(current);
    }
    return acc;
  }, []);

  messages.forEach((m) => {
    if (m.user.id == user.id) ai.addAssistantMessage(m.content);
    else ai.addUserMessage(m.content);
  });
  const content = ai.build(true);
  const files = [
    new discord.AttachmentBuilder(
      Buffer.from(JSON.stringify(content), "utf-8"),
      { name: `${ai.id}.json` }
    )
  ];
  i.reply({
    content: `New profile (\`${ai.modid}\`) was saved.\nContent:`,
    files
  });
  command.logger.info("Copied user:".gray, `@${user.username}`.blue);
  b.data["ai.refresh"] = true;
});

module.exports = command;
