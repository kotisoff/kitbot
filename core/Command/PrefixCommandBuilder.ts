export default class PrefixCommandBuilder {
  names: {
    name: string;
    aliases: string[];
  };
  description: string | undefined;

  constructor() {
    this.names = {
      name: "",
      aliases: []
    };
  }

  setName(name: string) {
    this.names.name = name;
    return this;
  }
  setDescription(description: string) {
    this.description = description;
    return this;
  }

  addAlias(alias: string) {
    this.names.aliases.push(alias);
  }
  removeAlias(alias: string) {
    if (!this.names.aliases.find((v) => v == alias)) return;
    this.names.aliases.splice(this.names.aliases.indexOf(alias), 1);
  }
}
