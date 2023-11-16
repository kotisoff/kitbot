const Command = require("../../utils").Command;
const { AttachmentBuilder } = require("discord.js");
const msclass = require("./libs/Minesweeper");

const ms = new msclass();

const MS = new Command("minesweeper", "MS");
MS.setCommandType({ prefix: true, slash: true });
MS.setPrefixAction(async (msg, bot) => {
    msg.channel.sendTyping();
    msg.delete().catch();
    let args = msg.content.split(" ").slice(1);
    if (args.includes("?")) {
        args = args.map(i => {
            if (i == "?") return Math.floor(Math.random() * 99);
            return i
        })
    }
    try {
        ms.generateGame({ rows: parseInt(`${args[0]}`) || 10, columns: parseInt(`${args[1]}`) || 10, bombs: parseInt(`${args[2]}`) || 20, seed: args[3] });
    }
    catch (e) {
        return msg.channel.send("Caught " + e);
    }
    const message = JSON.stringify(ms.getBoardInfo()) + "\n" + ms.getBoard();
    if (message.length > 2000) msg.channel.send({ content: JSON.stringify(ms.getBoardInfo()), files: [new AttachmentBuilder(Buffer.from(ms.getBoard(), "utf-8"), { name: "ms.txt" })] });
    else msg.channel.send(message);
});

module.exports = MS;