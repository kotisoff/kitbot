const { SlashCommandBuilder, Message, CommandInteraction, Client } = require("discord.js");

class PrefixCommandBuilder {
    constructor() {
        this.name = "thisHappensIfYouDoNotSetCommandName";
        this.ruName = "";
        this.shortName = "";
        this.description = "Example Description...";
    }
    setName = (name = this.name) => {
        this.name = name;
        return this;
    }
    setRuName = (name = this.ruName) => {
        this.ruName = name;
        return this;
    }
    setShortName = (name = this.shortName) => {
        this.shortName = name;
        return this;
    }
    setDescription = (description = this.description) => {
        this.description = description;
        return this;
    }
}

const CommandTypes = { slash: true, prefix: false };

class Command {
    constructor(name) {
        this.name = name;

        this.isSlashCommand = true;
        this.isPrefixCommand = false;
        this.isGlobal = true;

        this.slashCommandInfo = new SlashCommandBuilder().setName(this.name).setDescription("ExampleDescription")
        this.prefixCommandInfo = new PrefixCommandBuilder().setName(this.name)

        this.slashRun = (interact = CommandInteraction.prototype, bot = Client.prototype) => { interact.channel.send("Example Action!") };
        this.prefixRun = (message = Message.prototype, bot = Client.prototype) => { message.channel.send("Example Action!") }
    }
    setSlashCommandInfo = (SlashCommand = this.slashCommand) => {
        this.slashCommandInfo = SlashCommand;
        return this;
    }
    setPrefixCommandInfo = (PrefixCommand = this.prefixCommandInfo) => {
        this.prefixCommandInfo = PrefixCommand
    }
    setSlashAction = (callback = this.slashRun) => {
        this.run = callback;
        return this;
    }
    setPrefixAction = (callback = this.prefixRun) => {
        this.prefixRun = callback;
        return this;
    }
    setCommandType = (settings = CommandTypes) => {
        if (settings.prefix) this.isPrefixCommand = true;
        else this.isPrefixCommand = false;
        if (settings.slash) this.isSlashCommand = true;
        else this.isSlashCommand = false;
        return this;
    }
    setGlobal = (boolean = true) => {
        this.isGlobal = boolean;
        return this;
    }
}

module.exports = {
    PrefixCommandBuilder,
    Command
}