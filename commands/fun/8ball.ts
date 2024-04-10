import {
  Message,
  CommandInteraction,
  CacheType,
  EmbedBuilder,
  User
} from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";

const replyMessages = [
  "Думаю да.",
  "Конечно же нет!",
  "Ни в коем разе!",
  "Конечно!",
  "Даже не думай...",
  "Обязательно!",
  "Попробуй ещё раз...",
  "Тут я тебе не помощник...",
  "А зачем?",
  "Да.",
  "Не.",
  "Нет.",
  "НЕТ",
  "ДА, ДА, ДА, ДА.",
  "НЕ-НЕ-НЕ-НЕ-НЕ!",
  "Давай попробуем!",
  "Не-а."
];

export default class EightBallCommand extends Command {
  constructor() {
    super(
      new CommandOptions("8ball").setName("8Ball").setType({ prefix: true })
    );

    this.slashCommandInfo
      .setDescription("Replies with random answer!")
      .addStringOption((o) =>
        o
          .setName("question")
          .setDescription("Only questions with yes or no answers.")
          .setRequired(true)
          .setMinLength(1)
      );
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    let user: User;
    if (message instanceof Message) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You have not defined question.")
        .setTimestamp()
        .setFooter({ text: "Все права обмяуканы 2023-2024" });

      if (!args[0]) return message.reply({ embeds: [errEmbed] });
      user = message.author;
    } else {
      user = message.user;
    }

    const Embed = new EmbedBuilder()
      .setColor(0x4287f5)
      .setDescription(
        `${user.username} спросил: ${args.join(" ")}\n\n**${
          replyMessages[Math.round(Math.random() * replyMessages.length)]
        }**`
      )
      .setTimestamp()
      .setFooter({ text: "Все права обмяуканы 2023-2024" });
    message.reply({ embeds: [Embed] });
  }
}
