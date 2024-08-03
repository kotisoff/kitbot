export default class PrefixCommandBuilder {
  names: string[] = [];
  permission: bigint | undefined;

  addAlias(alias: string) {
    this.names.push(alias);
    return this;
  }
  removeAlias(alias: string) {
    if (!this.names.find((v) => v == alias)) return this;
    this.names.splice(this.names.indexOf(alias), 1);
    return this;
  }

  /** Use PermissionFlagsBits from discord.js */
  setDefaultMemberPermissions(permission: bigint) {
    this.permission = permission;
    return this;
  }
}
