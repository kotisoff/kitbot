import { Message, CommandInteraction, CacheType } from "discord.js";
import Command from "../../../../core/Command";
import CommandOptions from "../../../../core/Command/CommandOptions";
import CustomClient from "../../../../core/CustomClient";
import CommandEmbed from "../../../../core/Command/CommandEmbed";
import GMULib from "./getMusicUrl.lib";
import { GMUProviders } from "./getMusicUrl.lib/providers";

export class YMConfig {
  access_token: string;
  uid: number;
  constructor() {
    (this.access_token = "your_auth_token"), (this.uid = 0);
  }
}

export default class GetMusicUrlCommand extends Command {
  gmulib: GMULib;

  constructor() {
    super(new CommandOptions("getmusicurl", { prefix: true }).setName("GMU"));

    this.prefixCommandInfo
      .addAlias("gmu")
      .addAlias("ссылканапесню")
      .addAlias("снп");
    this.slashCommandInfo
      .setDescription("Returns direct track url.")
      .addStringOption((o) =>
        o
          .setName("query")
          .setDescription("Query. Could be url or something else.")
          .setRequired(true)
      );

    this.gmulib = new GMULib();

    const ymconfig =
      this.readConfig<YMConfig>("ymconfig.json") ??
      this.writeConfig(new YMConfig(), "ymconfig.json");
    this.gmulib.addProviders(new GMUProviders.YMProvider(ymconfig));
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    if (!args.length)
      return message.reply({
        embeds: [
          CommandEmbed.error({
            title: "Недостаточно аргументов!",
            content: "Использование:\n'gmu <query>"
          })
        ]
      });

    const result = await this.gmulib.getDirectLink(args.join(" "));

    message.reply({
      embeds: [
        CommandEmbed.info(
          result
            ? `Ваша ссылка: [**Ссылка**](<${result}>)`
            : "Ссылка не найдена."
        )
      ]
    });
  }
}
