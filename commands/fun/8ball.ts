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
import CommandEmbed from "../../core/Command/CommandEmbed";

const replyMessages = [
  "Думаю да.",
  "Конечно!",
  "Обязательно!",
  "Да.",
  "ДА, ДА, ДА, ДА.",
  "Давай попробуем!",
  "Звучит неплохо",

  "Попробуй ещё раз...",
  "Тут я тебе не помощник...",
  "А зачем?",
  "Поживём - увидим.",
  "Звёзды говорят... А ничё они не говорят.",
  "Может да... А может нет...",

  "Конечно же нет!",
  "Ни в коем разе!",
  "Даже не думай...",
  "Нет.",
  "НЕ-НЕ-НЕ-НЕ-НЕ!",
  "Вряд-ли.",
  "Звучит не очень..."
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
      const errEmbed = CommandEmbed.error("You have not defined question.");

      if (!args[0]) return message.reply({ embeds: [errEmbed] });
      user = message.author;
    } else {
      user = message.user;
    }

    const Embed = CommandEmbed.blankEmbed()
      .setColor(0x4287f5)
      .setDescription(
        `${user.username} спросил: ${args.join(" ")}\n\n**${
          replyMessages[Math.round(Math.random() * replyMessages.length)]
        }**`
      );
    message.reply({ embeds: [Embed] });
  }
}
