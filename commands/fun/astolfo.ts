import {
  Message,
  CommandInteraction,
  CacheType,
  TextChannel
} from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import { Axios } from "axios";
import CommandEmbed from "../../core/Command/CommandEmbed";

const replyMessages = [
  "~~А, вы любите пидоров?~~",
  "Вот вам ваш сладенький трапик",
  "А вы знали, что у него есть __**сюрприз**__ в штанах?",
  "Ну... Я такого от тебя не ожидал...",
  "...*пхпхпхпхх*... Прости, не могу сдержать смех... **АХАХАХХАХАХ**",
  "Вот больно сука он похож на тян...",
  "**харе наяривать на мужиков**",
  "_Смотрит ~~не~~ осуждающе..._",
  "_Вы чувствуете тяжесть своих грехов_",
  "_Кто-то злобно за вами наблюдает_",
  "Я же всё вижу, сын мой...",
  "Кароче: мама сказала, что если ещё раз увидит трапиков на моём мониторе то размажет моё лицо по клавиырпыпдлрцщуыфпщрщшмирлРЩШрщшпрщшшОЫРОПЩЫОРПЩШЛЫРПШЩЫРЩШПЦУЦПЫЦУ54П65У65)",
  "Ну это пиздец какой то, ну сколько можно?!"
];

type AstolfoRocksResponse = {
  id: number;
  rating: "explicit" | "safe" | "unknown" | "questionable";
  created_at: string;
  updated_at: string;
  views: number;
  source: null | "string";
  file_extension: "jpg" | "png" | "jpeg";
  mimetype: "image/jpeg" | "image/png";
  file_size: number;
  width: number;
  height: number;
};

export default class AstolfoCommand extends Command {
  wrapper: Axios;
  constructor() {
    super(
      new CommandOptions("astolfo").setName("Astolfo").setType({ prefix: true })
    );

    this.slashCommandInfo
      .setDescription("Replies with random Astolfo image!")
      .addStringOption((o) =>
        o
          .setName("rating")
          .setDescription("Rating of picture")
          .addChoices(
            { name: "Safe", value: "safe" },
            { name: "Questionable", value: "questionable" },
            { name: "Explicit", value: "explicit" }
          )
      );
    this.wrapper = new Axios({ headers: { Accept: "application/json" } });
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const rating = args[0] ?? null;
    const channel = message.channel as TextChannel;
    const data: AstolfoRocksResponse = JSON.parse(
      (
        await this.wrapper.get("https://astolfo.rocks/api/images/random", {
          params: { rating }
        })
      ).data
    );

    if (!data.id) {
      this.logger.error("No picture source found.");
      message.reply({
        embeds: [
          CommandEmbed.error("No picture source found. Please try again later")
        ]
      });
    }
    if (!channel.nsfw && data.rating != "safe")
      return message.reply({
        embeds: [
          CommandEmbed.error("This picture is not allowed in sfw channels.")
        ]
      });

    const Embed = CommandEmbed.embed({
      color: 0xf7bfd7,
      content: `${
        replyMessages[Math.floor(Math.random() * replyMessages.length)]
      }`,
      image: `https://astolfo.rocks/astolfo/${data.id}.${data.file_extension}`
    }).setAuthor({ name: `Views: ${data.views}` });
    message.reply({ embeds: [Embed] });
  }
}
