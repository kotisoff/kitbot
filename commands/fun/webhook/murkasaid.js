const discord = require("discord.js");

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("murka")
    .setDescription("Murka said...")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription(`Сообщение, которое будет отображено ботом`)
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment")
        .setDescription("Вложение (фото, файл, видева).")
    )
    .addBooleanOption((option) =>
      option
        .setName("tts")
        .setDescription(`Будет ли сообщение преобразовано в речь?`)
    ),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async exec(interact, bot) {
    if (
      interact.user.id != "429307451825717250" &&
      interact.user.id != "536257878429007873"
    )
      return await interact.reply({
        content: "Ты не мурка >:|",
        ephemeral: true,
      });
    const whook = new discord.WebhookClient({
      url: "https://discord.com/api/webhooks/1123710153552838758/JXQZmnpMKUTK8Vs_mwpjz9LHB-_1mCrhxw2JVAt26AhS0KdVAkj37ja-Phlg0eaqaXSG",
    });
    let msg = interact.options.getString("message");
    let tts = interact.options.getBoolean("tts") ?? false;
    let attachment;
    try {
      attachment = new discord.Attachment(
        interact.options.getAttachment("attachment")
      );
    } catch { }
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
