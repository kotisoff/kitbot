const { SlashCommandBuilder, Message, CommandInteraction, Client } = require("discord.js");
require("colors");

class PrefixCommandBuilder {
    constructor(CommandConstructor = Command.prototype) {
        this.name = "thisHappensIfYouDoNotSetCommandName";
        this.ruName;
        this.shortName;
        this.description;
        this.back = CommandConstructor;
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
    constructor(id = "example", name = "Example") {
        this.id = id;
        this.name = name;

        this.isSlashCommand = true;
        this.isPrefixCommand = false;
        this.isGlobal = true;

        this.slashCommandInfo = new SlashCommandBuilder().setName(this.id).setDescription("ExampleDescription")
        this.prefixCommandInfo = new PrefixCommandBuilder(this).setName(this.id).setDescription("ExampleDescription")
        this.logger = new (require("./logger"))(this.name);

        this.slashRun = (interact = CommandInteraction.prototype, bot = Client.prototype) => { interact.channel.send("Example Action!") };
        this.prefixRun = (message = Message.prototype, bot = Client.prototype) => { message.channel.send("Example Action!") };
        this.shutdown = () => { };
        this.shareThread = (bot = Client.prototype) => { throw Error() };
    }
    setSlashAction = (callback = this.slashRun) => {
        this.slashRun = callback;
        return this;
    }
    setPrefixAction = (callback = this.prefixRun) => {
        this.prefixRun = callback;
        return this;
    }
    setCommandType = (settings = CommandTypes) => {
        this.isPrefixCommand = settings.prefix ?? this.isPrefixCommand;
        this.isSlashCommand = settings.slash ?? this.isSlashCommand;
        return this;
    }
    setShutdownAction = (callback = this.shutdown) => {
        this.shutdown = callback;
        return this;
    }
    setSharedThread = (callback = this.shareThread) => {
        this.shareThread = callback;
        return this;
    }
    setGlobal = (boolean = true) => {
        this.isGlobal = boolean;
        return this;
    }
}

module.exports = Command