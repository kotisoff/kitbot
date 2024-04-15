import {
  CommandInteraction,
  CacheType,
  PermissionFlagsBits,
  Message,
  AttachmentBuilder
} from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";

export default class DumpGuildsCommand extends Command {
  constructor() {
    super(new CommandOptions("dumpguilds").setType({ prefix: true }));

    this.slashCommandInfo
      .setDescription("Dumps guild list")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  }

  async run(
    message: Message<boolean> | CommandInteraction<CacheType>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    if (
      message instanceof Message &&
      !message.member?.permissions.has(PermissionFlagsBits.Administrator)
    )
      return message.reply({
        content: "You have no permissions to use that command"
      });

    const guilds = (await client.guilds.fetch())
      .map((guild) => `"${guild.name}" (${guild.id})`)
      .join("\n");

    message.reply({
      files: [
        new AttachmentBuilder(Buffer.from(guilds), { name: "guilds.txt" })
      ],
      ephemeral: true
    });
  }
}
