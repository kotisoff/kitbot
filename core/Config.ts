export default interface Config {
  bot: {
    token: string;
    prefix: string;
    devGuildId: string;
    intents: number[];
  };
  settings: {
    autoDeploy: boolean;
    commandPath: string;
    allowPrefixCommands: {
      shortName: boolean;
      ruName: boolean;
      shortRuName: boolean;
    };
    ignoredCommandDirs: string[];
  };
}

export default class Config {
  constructor() {
    this.bot = {
      token: "PlaceYourTokenHere",
      prefix: "'",
      devGuildId: "",
      intents: [3276799]
    };
    this.settings = {
      autoDeploy: true,
      commandPath: "commands",
      allowPrefixCommands: {
        shortName: true,
        ruName: true,
        shortRuName: true
      },
      ignoredCommandDirs: [".lib", ".i", ".libs"]
    };
  }
}
