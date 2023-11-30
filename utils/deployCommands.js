const discord = require('discord.js');
const { devGuildId, token } = require('../config.json').bot;
let Logger = require("./logger")
const log = new Logger("Deploy")

module.exports = (bot = discord.Client.prototype) => {
    const clientId = bot.application.id;
    const interactionCommands = bot.interCmd;

    const globalCommands = [];
    const devCommands = [];

    interactionCommands.forEach(v => {
        if (v.isSlashCommand) {
            const data = v.slashCommandInfo.toJSON()
            if (v.isGlobal) globalCommands.push(data);
            else devCommands.push(data);
        }
    })

    const rest = new discord.REST().setToken(token);

    (async () => {
        try {
            log.info(`Started refreshing ${interactionCommands.length} application (/) commands.`);

            const globalData = await rest.put(
                discord.Routes.applicationCommands(clientId),
                { body: globalCommands },
            );
            const devData = await rest.put(
                discord.Routes.applicationGuildCommands(clientId, devGuildId),
                { body: devCommands },
            )

            log.info(`Reloaded: ${globalData.length} Global, ${devData.length} Dev commands.`.gray);
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            log.error(error);
        }
    })();
}