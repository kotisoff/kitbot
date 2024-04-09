export default class CommandOptions {
  id: string;
  name: string;
  type: { slash: boolean; prefix: boolean; global: boolean };

  constructor(id: string) {
    this.id = id;
    this.name = id;
    this.type = { slash: true, prefix: false, global: true };
  }
  setName(name: string) {
    this.name = name;
    return this;
  }
  setType(type: Partial<typeof this.type> = this.type) {
    if (type.slash) this.type.slash = type.slash;
    if (type.prefix) this.type.prefix = type.prefix;
    if (type.global) this.type.global = type.global;
    return this;
  }
}
