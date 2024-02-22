const {
  SlashCommandBuilder,
  Message,
  CommandInteraction,
  Client
} = require("discord.js");
const path = require("path"),
  fs = require("fs");
require("colors");

const Command = this;

class PrefixCommandBuilder {
  constructor(CommandConstructor = Command.prototype) {
    this.name = "thisHappensIfYouDoNotSetCommandName";
    this.shortName;
    this.ruName;
    this.shortRuName;
    this.description;
    this.back = CommandConstructor;
  }
  setName = (name = this.name) => {
    this.name = name;
    return this;
  };
  setShortName = (name = this.shortName) => {
    this.shortName = name;
    return this;
  };
  setRuName = (name = this.ruName) => {
    this.ruName = name;
    return this;
  };
  setShortRuName = (name = this.shortRuName) => {
    this.shortRuName = name;
    return this;
  };
  setDescription = (description = this.description) => {
    this.description = description;
    return this;
  };
}

module.exports = class {
  getCfgDirFromFldrname = (configFolderName = "kot.test") =>
    path.join(process.cwd(), "configs", configFolderName);

  getDataDir = (folderName = "kot.test") =>
    path.join(process.cwd(), "data", folderName);

  CommandTypes = { slash: true, prefix: false };

  constructor(
    id = "example",
    name = "Example",
    { slash, prefix } = this.CommandTypes
  ) {
    this.id = id;
    this.name = name;

    this.isSlashCommand = slash ?? true;
    this.isPrefixCommand = prefix ?? false;
    this.isGlobal = true;

    this.slashCommandInfo = new SlashCommandBuilder(this)
      .setName(this.id)
      .setDescription("ExampleDescription");
    this.prefixCommandInfo = new PrefixCommandBuilder(this)
      .setName(this.id)
      .setDescription("ExampleDescription");
    this.logger = new (require("./logger"))(this.name);
    this.configFolderName = "kot.test";
    this.configName = "config.json";

    this.slashRun = (
      interact = CommandInteraction.prototype,
      bot = Client.prototype
    ) => {
      interact.reply("Example Action!");
    };
    this.prefixRun = (message = Message.prototype, bot = Client.prototype) => {
      message.reply("Example Action!");
    };
    this.shutdown = () => {};
    this.shareThread = (bot = Client.prototype) => {
      throw Error();
    };
    this.tempData = {};
  }
  setSlashAction = (callback = this.slashRun) => {
    this.slashRun = callback;
    return this;
  };
  setPrefixAction = (callback = this.prefixRun) => {
    this.prefixRun = callback;
    return this;
  };
  setCommandType = (settings = this.CommandTypes) => {
    this.isPrefixCommand = settings.prefix ?? this.isPrefixCommand;
    this.isSlashCommand = settings.slash ?? this.isSlashCommand;
    return this;
  };
  setShutdownAction = (callback = this.shutdown) => {
    this.shutdown = callback;
    return this;
  };
  setSharedThread = (callback = this.shareThread) => {
    this.shareThread = callback;
    return this;
  };
  setGlobal = (boolean = true) => {
    this.isGlobal = boolean;
    return this;
  };
  setCustomConfigName = (configName = this.configName) => {
    this.configName = configName;
    return this;
  };
  getConfig = (configFolderName = this.configFolderName) => {
    this.configFolderName = configFolderName;
    const dir = this.getCfgDirFromFldrname(configFolderName);
    const configfile = path.join(dir, this.configName);
    if (!fs.existsSync(configfile)) {
      try {
        fs.mkdirSync(dir);
      } catch {}
      fs.writeFileSync(configfile, "{}");
    }
    return { dir, config: JSON.parse(fs.readFileSync(configfile)) };
  };
  writeConfig = (config = {}, configFolderName = this.configFolderName) => {
    this.configFolderName = configFolderName;
    const dir = this.getCfgDirFromFldrname(configFolderName);
    const configfile = path.join(dir, this.configName);
    fs.writeFileSync(configfile, JSON.stringify(config));
    return this;
  };
};
