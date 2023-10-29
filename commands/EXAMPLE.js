const discord = require("discord.js");
const { Command } = require("../assets/utils").Command;

//СТАЛО

const Example = new Command("ping");

Example.slashCommandInfo.setDescription("Replies with Pong!");

Example.setSlashAction(
  async (interact, bot) => {
    let APIping = Math.round(bot.ws.ping);
    await interact.reply(`Понг сука! Задержка API: ${APIping}мс`);
    if (APIping >= 400) {
      interact.followup(
        `Задержка слегка выше ожидаемой суммы... А точнее ${APIping} наъуй.`
      );
    };
  }
);

module.exports = Example;

//БЫЛО

// module.exports = {
//   data: new discord.SlashCommandBuilder()
//     .setName("ping")
//     .setDescription("Replies with Pong!"),
//   /**@param {discord.Interaction} interact @param {discord.Client} bot*/
//   async exec(interact, bot) {
//     let APIping = Math.round(bot.ws.ping);
//     await interact.reply(`Понг сука! Задержка API: ${APIping}мс`);
//     if (APIping >= 400) {
//       interact.followup(
//         `Задержка слегка выше ожидаемой суммы... А точнее ${APIping} наъуй.`
//       );
//     }
//   },
// };
