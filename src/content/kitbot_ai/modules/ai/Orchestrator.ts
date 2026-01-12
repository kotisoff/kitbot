import { ClientUser, Message } from "discord.js";
import ModelManager, { AIState } from "./ModelManager";
import { container } from "@sapphire/pieces";
import Conversation from "./Conversation";
import Utils from "./Utils";

const triggers = ["kitbot", "китбот", "757645999006285844"];

export default class AIOrchestrator {
  static async input(message: Message) {
    const text = message.content;

    let gate = triggers.map((v) => text.toLowerCase().includes(v)).reduce((a, b) => a || b);

    const bot_user = container.client.user as ClientUser;

    if (message.reference) {
      try {
        const refer = await message.fetchReference();
        if (refer.author.id == bot_user.id) {
          gate = true;
        }
      } catch {}
    }

    if (message.author.id == bot_user.id) {
      gate = false;
    }

    if (gate && message.channel.isSendable()) {
      console.log("gate passed");

      if (message.content.toLowerCase().includes("стоп!")) {
        ModelManager.stop("стоп команда");
        return;
      }

      if (ModelManager.state == AIState.not_loaded) {
        const loaded = await ModelManager.loadModel();
        if (!loaded) {
          return message.reply("Модель не загружена, значение по умолчанию не указано.");
        }
      }

      if (ModelManager.state != AIState.idle) {
        return message.reply(`ИИ бота не доступен. Состояние: ${Object.values(AIState)[ModelManager.state]}`);
      }

      let interval: NodeJS.Timeout;
      const response = Conversation.send(message);

      response.catch(() => {
        ModelManager.state = AIState.idle;
      });

      (message as Message<true>).channel.sendTyping();

      interval = setInterval(() => {
        if (ModelManager.state == AIState.thinking) {
          (message as Message<true>).channel.sendTyping();
        }
      }, 9_000);

      response.then((ai_msg) => {
        if (!ai_msg) {
          return;
        }

        const messages = Utils.cutMessage(ai_msg);

        message.reply(messages.shift() as { content: string });
        messages.forEach((msg) => {
          (message as Message<true>).channel.send(msg);
        });

        console.log("reply sent");
        interval?.close();
      });
    }
  }
}
