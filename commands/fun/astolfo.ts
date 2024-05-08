import { Message, CommandInteraction, CacheType } from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import axios from "axios";
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

export default class AstolfoCommand extends Command {
  constructor() {
    super(
      new CommandOptions("astolfo").setName("Astolfo").setType({ prefix: true })
    );

    this.slashCommandInfo.setDescription("Replies with random Astolfo image!");
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const data = (await axios.get("https://astolfo.rocks/")).data;
    const regexData =
      /https:\/\/astolfo\.rocks\/astolfo\/[0-9]+\.[A-Za-z]+/i.exec(
        data
      ) as RegExpExecArray;

    if (!regexData) {
      this.logger.error("No picture source found.");
      message.reply("No picture source found. Please try again later");
    }

    const Embed = CommandEmbed.embed({
      color: 0xf7bfd7,
      content: `${
        replyMessages[Math.floor(Math.random() * replyMessages.length)]
      }`,
      image: regexData[0]
    });
    message.reply({ embeds: [Embed] });
  }
}
