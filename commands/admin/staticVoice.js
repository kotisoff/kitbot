const { ChannelType, PermissionFlagsBits } = require("discord.js");
const Command = require("../../core/Command");

const voice = new Command("staticvoice", "SV");

voice.slashCommandInfo
  .setDescription("Даёт по еблищу папареду")
  .addUserOption((o) =>
    o.setName("target").setDescription("Target user").setRequired(true)
  )
  .addChannelOption((o) =>
    o
      .setName("targetchannel")
      .addChannelTypes(ChannelType.GuildVoice)
      .setDescription("Target channel")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

voice.setSlashAction(async (i, b) => {
  const user = i.options.getUser("target");
  const channel = i.options.getChannel("targetchannel");

  channel.send(`Пиздец, ${user.displayName} был прикреплён к этому каналу.`);
});

module.exports = voice;
