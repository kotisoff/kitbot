const discord = require("discord.js");
const Command = require("../../utils").Command;

const asay = new Command("asay", "ASay");
asay.setCommandType({ prefix: true })
  .setPrefixAction(
    (mess, bot) => {
      const args = mess.content.split(" ").slice(1);
      if (!mess.member.permissions.has(discord.PermissionFlagsBits.Administrator))
        return mess.channel.send("У вас нет прав!");
      mess.delete().catch();
      if (!args[0]) return mess.channel.send("* Звук сверчков *");
      if (args[0]) return mess.channel.send(`${args.join(" ")}`);
    }
  )
  .setSlashAction(
    async (interact, bot) => {
      let args = interact.options.getString("message");
      let tts = interact.options.getBoolean("tts") ?? false;
      let attachment;
      try {
        attachment = new discord.Attachment(
          interact.options.getAttachment("attachment")
        );
      } catch { }
      interact.deferReply();
      if (attachment) {
        if (args)
          await interact.channel.send({
            content: args,
            tts: tts,
            files: [attachment],
          });
      } else {
        if (args) await interact.channel.send({ content: args, tts: tts });
      }
      interact.deleteReply();
    }
  )
  .prefixCommandInfo.setShortName("as").setDescription("Преобразует ваше сообщение в сообщение бота.")
  .back
  .slashCommandInfo.setDescription("Преобразует ваше сообщение в сообщение бота.");

module.exports = asay;