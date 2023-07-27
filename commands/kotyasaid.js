const discord = require("discord.js");

module.exports = {
  idata: new discord.SlashCommandBuilder()
    .setName("kotya")
    .setDescription("Kotya said...")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription(`Сообщение, которое будет отображено ботом`)
        .setRequired(true),
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment")
        .setDescription("Вложение (фото, файл, видева)."),
    )
    .addBooleanOption((option) =>
      option
        .setName("tts")
        .setDescription(`Будет ли сообщение преобразовано в речь?`),
    ),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    if (interact.user.id != "429307451825717250")
      return await interact.reply({
        content: "Ты не мурка >:|",
        ephemeral: true,
      });
    const whook = new discord.WebhookClient({
      url: "https://discord.com/api/webhooks/1123650500542333038/3zqHEtbx5Gw8ALsNRnUbzWtxVqmzO3hCZTSLfZwKeybFlFdBU-3lznlES6UMMRzJqX4M",
    });
    let msg = interact.options.getString("message");
    let tts = interact.options.getBoolean("tts") ?? false;
    let attachment;
    try {
      attachment = new discord.Attachment(
        interact.options.getAttachment("attachment"),
      );
    } catch {}
    await interact.reply({
      content: "Сообщение отправляется...",
      ephemeral: true,
    });
    if (attachment) {
      if (msg)
        await whook.send({ content: msg, tts: tts, files: [attachment] });
    } else {
      if (msg) await whook.send({ content: msg, tts: tts });
    }
    interact.deleteReply();
  },
};
