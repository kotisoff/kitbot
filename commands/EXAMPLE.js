const discord = require("discord.js");
const Command = require("../utils/Command");

const Example = new Command("ping", "PING");

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