const aiChat = require("./ai.lib/aiChatLib");
const config = aiChat.aiDataMgr.get.config;

const printresponse = process.argv.includes("--printresponse");

const Command = require("../../utils/Command");

const chatgpt = new Command("ai", "AI");

chatgpt.slashCommandInfo.setDescription("Show ai profile list.");

chatgpt.setSharedThread(async (bot) => {
  bot.on("messageCreate", async (message) => {
    if (!aiChat.aiDataMgr.get.profiles.channels.includes(message.channelId))
      return;
    const mod = aiChat.getModFromPrefixMsg(message.content);
    if (!mod) return;
    mod.setWebhook(await aiChat.getAiWebHook(message));

    message.content = message.content.substring(mod.prefix.length);
    chatgpt.logger.info(`New message to ${mod.modid}: ${message.content}`.gray);

    const msg = await mod.send(message, "_Думоет..._", {
      threadId: message.thread?.id
    });
    const response = await aiChat
      .getChatResponse(message.content, mod.modid)
      .catch(chatgpt.logger.error);
    if (config.options.ai_stream) {
      const cycle = aiChat.handleStreamResponse(response, mod.modid, 15);
      for await (let part of cycle) {
        await aiChat.editMessageContent(msg, part.content, mod);
        if (printresponse && part.done)
          chatgpt.logger.info(`Answer from ${mod.modid}:`, part.content);
      }
    } else {
      const data = await aiChat.handleStaticResponse(response, mod.modid);
      chatgpt.logger.info(`Answer from ${mod.modid}:`, data.content.join(""));
      msg.edit(data.content.shift());
      data.content.forEach(async (data) => await mod.send(message, data));
    }
    mod.destroy();
  });
});

chatgpt.setSlashAction(async (i, b) => {
  if (b.data["ai.refresh"]) {
    aiChat.aiDataMgr.refreshMods();
    b.data["ai.refresh"] = false;
  }
  const files = aiChat.aiDataMgr.get.mods().map((mod) => mod.getModData());
  const data = files.map(
    (mod, index) => `${index + 1}. ${mod.prefix} ← ${mod.name}(${mod.modid})`
  );
  i.reply("Prefixes:\n```" + data.join("\n") + "```");
});

module.exports = chatgpt;
