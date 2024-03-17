import discord from "discord.js";
import Logger from "./Logger";
import Command from "./Command";
const log = new Logger("Deploy");

export default (bot: discord.Client<true>) => {
  const { devGuildId, token } = require("../config.json").bot;
  const clientId = bot.application.id;
  // @ts-ignore
  const interactionCommands: Command[] = bot.interCmd;

  const globalCommands: any[] = [];
  const devCommands: any[] = [];

  interactionCommands.forEach((v: Command) => {
    if (v.type.slash) {
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

      const globalData: any | { length: number } = await rest.put(
        discord.Routes.applicationCommands(clientId),
        { body: globalCommands }
      );
      const devData: any | { length: number } = await rest
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
