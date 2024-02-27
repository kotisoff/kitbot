const Command = require("../../core/Command");

const Buttons = new Command("buttons", "Buttons");
Buttons.setSlashAction(async (interact, bot) => {});

module.exports = Buttons;
