const discord = require("discord.js");
let Logger = require("../utils/logger");
const log = new Logger("Deploy");

module.exports = (bot = discord.Client.prototype) => {
  const { devGuildId, token } = require("../config.json").bot;
  const clientId = bot.application.id;
  const interactionCommands = bot.interCmd;

  const globalCommands = [];
  const devCommands = [];

  interactionCommands.forEach((v) => {
    if (v.isSlashCommand) {
      const data = v.slashCommandInfo.toJSON();
      if (v.isGlobal) globalCommands.push(data);
      else devCommands.push(data);
    }
  });

  const len = globalCommands.length + devCommands.length;

  const rest = new discord.REST().setToken(token);

  (async () => {
    try {
      log.info(`Started refreshing ${len} application (/) commands.`.gray);

      const globalData = await rest.put(
        discord.Routes.applicationCommands(clientId),
        { body: globalCommands }
      );
      const devData = await rest
        .put(discord.Routes.applicationGuildCommands(clientId, devGuildId), {
          body: devCommands
        })
        .catch(() =>
          log.warn("Dev guild id is not set, commands are not loaded.")
        );

      log.info(
        `Reloaded: ${globalData.length ?? 0} Global, ${
          devData.length ?? 0
        } Dev commands.`.gray
      );
    } catch (error) {
      log.error(error);
    }
  })();
};
