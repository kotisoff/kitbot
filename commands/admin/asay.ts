import {
  CacheType,
  CommandInteraction,
  Message,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";

export default class Asay extends Command {
  constructor() {
    super(new CommandOptions("asay").setName("Asay").setType({ prefix: true }));

    this.slashCommandInfo
      .setDescription("Sends your message from bot.")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption((o) =>
        o.setName("message").setDescription("Your message").setRequired(true)
      );
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    if (message instanceof Message) {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator))
        return message.channel.send(
          "You haven't permissions to use that command!"
        );
      message.delete().catch();
    } else {
      message
        .reply({ content: "_ _", ephemeral: true })
        .then(() => message.deleteReply());
    }
    if (args.length) message.channel?.send(args.join(" "));
    else message.channel?.send("* Треск сверчков *");
  }
}
