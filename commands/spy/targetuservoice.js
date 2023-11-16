const discord = require("discord.js");
const Command = require("../../utils").Command;

const targetVoice = new Command("targetvoice", "TargetVoice")
targetVoice.setSlashAction(
    async (interact, bot) => {
        await interact.reply("WIP")
    }
).slashCommandInfo
    .setDescription("Targets user in Voice Channel.")
    .addUserOption(o =>
        o.setName("target")
            .setDescription("Target")
            .setRequired(true)
    )
    .addChannelOption(o =>
        o.setName("targetchannel")
            .setDescription("Unnecessary, but why not.")
    )

module.exports = targetVoice

// module.exports = {
//     data: new discord.SlashCommandBuilder()
//         .setName("targetvoice")
//         .setDescription("Targets user in Voice Channel.")
//         .addUserOption(o =>
//             o.setName("target")
//                 .setDescription("Target")
//                 .setRequired(true)
//         )
//         .addChannelOption(o =>
//             o.setName("targetchannel")
//                 .setDescription("Unnecessary, but why not.")
//         ),
//     /**@param {discord.Interaction} interact @param {discord.Client} bot*/
//     async exec(interact, bot) {

//     },
// };
