const Command = require("../../core/Command");

const Assemble = new Command("assemble", "TextAssemble");
Assemble.setSlashAction(async (interact, bot) => {
  const amount = interact.options.getNumber("amount");
  if (amount > 100)
    return interact.reply(
      "Количество охватываемых сообщений не должно превышать 100!"
    ); // "А хуй за воротник? Дохуя хочешь мудила."
  const messages = (
    await interact.channel.messages.fetch({ limit: amount })
  ).reverse();
  const text = messages.map((msg) => msg.content).join(" ");
  if (text.length > 2000)
    return interact.reply(text.substring(0, 1997) + "...");
  interact.reply(text);
})
  .slashCommandInfo.setDescription("Concats messages in one.")
  .addNumberOption((o) =>
    o
      .setName("amount")
      .setDescription("Amount to concat")
      .setMaxValue(100)
      .setMinValue(1)
      .setRequired(true)
  );

module.exports = Assemble;
