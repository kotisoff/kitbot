const discord = require("discord.js");
const { Command } = require("../../utils");

const VoiceMove = new Command("voicemove", "VoiceMove");

VoiceMove.setSlashAction(async (interact, bot) => {
  await interact.reply("*Думоет...*");
  const voice = interact.options.getChannel("voicechannel");
  const channel = interact.member.voice.channel;
  if (voice.id === channel.id)
    return await interact.editReply(
      "Вы не можете перенестись в канал в котором вы уже находитесь!"
    );
  channel.members.forEach((u) => {
    u.voice.setChannel(voice).catch((e) => {
      return interact.editReply(`Не удалось перенести! ${e.message}`);
    });
  });
  await interact.editReply(
    `Перенесено ${channel.members.size} пользователей в <#${voice.id}>`
  );
}).slashCommandInfo
  .setDescription("Move you and your friends to other voice channel.")
  .addChannelOption((o) =>
    o
      .setName("voicechannel")
      .setDescription("Voice channel where you want to be.")
      .addChannelTypes(discord.ChannelType.GuildVoice)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(discord.PermissionFlagsBits.MoveMembers)

module.exports = VoiceMove;

// module.exports = {
//   data: new discord.SlashCommandBuilder()
//     .setName("voicemove")
//     .setDescription("Move you and your friends to other voice channel.")
//     .addChannelOption((o) =>
//       o
//         .setName("voicechannel")
//         .setDescription("Voice channel where you want to be.")
//         .addChannelTypes(discord.ChannelType.GuildVoice)
//         .setRequired(true)
//     )
//     .setDefaultMemberPermissions(discord.PermissionFlagsBits.MoveMembers),
//   /**@param {discord.Interaction} interact @param {discord.Client} bot*/
//   async exec(interact, bot) {
//     await interact.reply("*Думоет...*");
//     const voice = interact.options.getChannel("voicechannel");
//     const channel = interact.member.voice.channel;
//     if (voice.id === channel.id)
//       return await interact.editReply(
//         "Вы не можете перенестись в канал в котором вы уже находитесь!"
//       );
//     channel.members.forEach((u) => {
//       u.voice.setChannel(voice).catch((e) => {
//         return interact.editReply(`Не удалось перенести! ${e.message}`);
//       });
//     });
//     await interact.editReply(
//       `Перенесено ${channel.members.size} пользователей в <#${voice.id}>`
//     );
//   },
// };
