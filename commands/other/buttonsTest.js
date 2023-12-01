const Command = require("../../utils/Command");

const Buttons = new Command("buttons", "Buttons")
Buttons.setSlashAction(async (interact, bot) => {
})

module.exports = Buttons;
// module.exports = {
//   data: new discord.SlashCommandBuilder()
//     .setName("buttons")
//     .setDescription("Test command!"),
//   /**@param {discord.Interaction} interact @param {discord.Client} bot*/
//   async exec(interact, bot) {
//   },
// };
