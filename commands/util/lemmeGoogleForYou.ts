import { Message, CommandInteraction, CacheType } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import CommandEmbed from "../../core/Command/CommandEmbed";

export default class LetMeGoogleForYouCommand extends Command {
  constructor() {
    super(new CommandOptions("letmegoogleforyou", { prefix: true }));

    this.slashCommandInfo
      .setDescription("For people, who are lazy to google.")
      .addStringOption((o) =>
        o
          .setName("prompt")
          .setDescription("What do you want to search in google?")
          .setRequired(true)
      );

    this.prefixCommandInfo
      .addAlias("lmgfy")
      .addAlias("давайзагуглю")
      .addAlias("letmegoogle");
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    if (!args[0])
      return message.reply({
        embeds: [
          CommandEmbed.error(
            "Введите запрос.\nПример: " +
              client.config.bot.prefix +
              "lmgfy kotisoff"
          )
        ]
      });
    const prompt = args.join(" ");

    message.reply(
      `[Let me google for you](https://www.google.com/search?q=${encodeURIComponent(
        prompt
      )})`
    );
  }
}
