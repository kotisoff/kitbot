import { Message, CommandInteraction, CacheType } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import CommandEmbed from "../../core/Command/CommandEmbed";

export default class LetMeGoogleThatForYouCommand extends Command {
  constructor() {
    super(new CommandOptions("letmegooglethatforyou", { prefix: true }));

    this.slashCommandInfo
      .setDescription("For people, who are lazy to google.")
      .addStringOption((o) =>
        o
          .setName("prompt")
          .setDescription("What do you want to search in google?")
          .setRequired(true)
      )
      .addBooleanOption((o) =>
        o.setName("use_lmgtfy").setDescription("Use lmgtfy?")
      );

    this.prefixCommandInfo
      .addAlias("lmgfy")
      .addAlias("давайзагуглю")
      .addAlias("letmegoogle")
      .addAlias("letmegoogleforyou");
  }

  async runSlash(
    interaction: CommandInteraction,
    client: CustomClient
  ): Promise<any> {
    this.run(
      interaction,
      [
        interaction.options.get("prompt")?.value as string,
        interaction.options.get("use_lmgtfy")?.value?.toString() ?? ""
      ],
      client
    );
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const bool = args.at(-1) == "false" ? Boolean(args.pop()) : true;

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

    const links = {
      google: (prompt: string) =>
        "https://www.google.com/search?q=" + encodeURIComponent(prompt),
      lmgtfy: (prompt: string) =>
        `https://natoboram.github.io/lmgtfy/search?q=${encodeURIComponent(
          prompt
        )}&btnK=Google+Search`
    };

    message.reply(
      `[Let me google that for you](<${
        bool ? links.lmgtfy(prompt) : links.google(prompt)
      }>)`
    );
  }
}
