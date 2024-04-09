export default class PrefixCommandBuilder {
  names: {
    [index: string]: string | undefined;
    name: string;
    shortName: string;
    ruName: string;
    shortRuName: string;
  };
  description: string | undefined;

  constructor() {
    this.names = {
      name: "",
      shortName: "",
      ruName: "",
      shortRuName: ""
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

  setShortName(name: string) {
    this.names.shortName = name;
    return this;
  }
  setRuName(name: string) {
    this.names.ruName = name;
    return this;
  }
  setShortRuName(name: string) {
    this.names.shortRuName = name;
    return this;
  }
}
