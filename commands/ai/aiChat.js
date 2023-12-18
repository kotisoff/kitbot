const aiChat = require("./ai.lib/aiChatLib");
const config = aiChat.aiDataMgr.get.config;

const Command = require("../../utils/Command");

const chatgpt = new Command("ai", "AI");

chatgpt.slashCommandInfo.setDescription("Show ai profile list.");

chatgpt.setSharedThread(async (bot) => {
  bot.on("messageCreate", async (message) => {
    const mod = aiChat.getModFromPrefixMsg(message.content);
    if (!mod) return;
    if (message.author.username != "kotisoff")
      message.channel.send(
        "Команда в данный момент находится в разработке.\n`[Пойти нахуй]` `[Упорно ждать]`"
      );
    message.content = message.content.substring(mod.prefix.length);
    chatgpt.logger.info(`New message to ${mod.modid}: ${message.content}`.gray);
    if (aiChat.isMain(mod.modid)) {
      const msg = await message.channel.send("_Думоет_");
      const response = await aiChat.getChatResponse(message.content, mod.modid);
      if (config.options.ai_stream) {
        const cycle = aiChat.handleStreamResponse(response, mod.modid);
        for await (let part of cycle) {
          console.log(part);
          aiChat.appendMessage(msg, part.content);
        }
      } else {
        const data = await aiChat.handleStaticResponse(response, mod.modid);
        console.log(data);
        msg.edit(data.content.shift());
        data.content.forEach(async (data) => await msg.channel.send(data));
      }
    }
  });
});

module.exports = chatgpt;
