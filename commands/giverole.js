const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const color = require("colors");

module.exports = {
  idata: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Управление ролями у пользователей.")
    .addStringOption((options) =>
      options
        .setName("parameter")
        .setDescription("Параметр для команды.")
        .addChoices(
          { name: "Выдать", value: "give" },
          { name: "Изъять", value: "take" },
        )
        .setRequired(true),
    )
    .addRoleOption((options) =>
      options
        .setName("role")
        .setDescription(`Роль для выдачи/изъятия.`)
        .setRequired(true),
    )
    .addUserOption((options) =>
      options.setName("user").setDescription("Кому выдать/изъять роль."),
    ),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    let parameter = await interact.options.getString("parameter");
    let role = await interact.options.getRole("role");
    let id = role.id;
    let user = await interact.options.getUser("user");
    let uid;
    if (user) uid = user.id;
    if (!interact.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      if (interact.user.id != "536257878429007873")
        return interact.reply({
          content: `У вас нет прав для выполнения данной команды!`,
          ephemeral: true,
        });
    }
    if (parameter === "give") {
      try {
        if (user) {
          console.log(
            `${("@" + interact.user.username).magenta}: requested a role ${
              ("@" + role.name).cyan
            }: for user ${("@" + user.username).magenta}.`,
          );
          await interact.guild.members.cache.get(uid).roles.add(`${id}`);
          return await interact.reply({
            content: `Успешно выдана роль ${role} пользователю ${user}!`,
            ephemeral: true,
          });
        } else {
          console.log(
            `${
              ("@" + interact.user.username).magenta
            }: requested themselves a role ${("@" + role.name).cyan}`,
          );
          await interact.member.roles.add(`${id}`);
          return await interact.reply({
            content: `Успешно выдана роль ${role}!`,
            ephemeral: true,
          });
        }
      } catch (err) {
        await interact.reply({
          content:
            "Неудача! Эта роль выше роли бота или эта роль другого бота!",
          ephemeral: true,
        });
        //if(interact.user.id==='536257878429007873') await interact.editReply({ content: (`${err}`), ephemeral: true })
        console.log(`Failed. ${err}`.red);
        return;
      }
    } else if (parameter === "take") {
      try {
        if (user) {
          console.log(
            `${
              ("@" + interact.user.username).magenta
            }: requested to take a role ${("@" + role.name).cyan}: from user ${
              ("@" + user.username).magenta
            }`,
          );
          await interact.guild.members.cache.get(uid).roles.remove(`${id}`);
          return await interact.reply({
            content: `Успешно удалена роль ${role} с пользователя ${user}!`,
            ephemeral: true,
          });
        } else {
          console.log(
            `${
              ("@" + interact.user.username).magenta
            }: requested to take themselves a role ${("@" + role.name).cyan}`,
          );
          await interact.member.roles.remove(`${id}`);
          return await interact.reply({
            content: `Успешно удалена роль ${role}!`,
            ephemeral: true,
          });
        }
      } catch (err) {
        await interact.reply({
          content: "Неудача! Нельзя забрать роль бота или роль, что выше бота!",
          ephemeral: true,
        });
        //if(interact.user.id==='536257878429007873') await interact.editReply({ content: (`${err}`), ephemeral: true })
        console.log(`Failed. ${err}`.red);
        return;
      }
    }
  },
};
