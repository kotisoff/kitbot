const aiChat = require("./ai.lib/aiChatLib");
const config = aiChat.aiDataMgr.get.config;

const printresponse = process.argv.splice(2).includes("--printresponse");

const Command = require("../../utils/Command");
const { FsReadStream } = require("openai/_shims/auto/types");

const chatgpt = new Command("ai", "AI");

chatgpt.slashCommandInfo.setDescription("Show ai profile list.");

chatgpt.setSharedThread(async (bot) => {
  bot.on("messageCreate", async (message) => {
    const mod = aiChat.getModFromPrefixMsg(message.content);
    if (!mod) return;
    mod.setWebhook(await aiChat.getAiWebHook(message));

    message.content = message.content.substring(mod.prefix.length);
    chatgpt.logger.info(`New message to ${mod.modid}: ${message.content}`.gray);

    const msg = await mod.send(message, "_Думоет..._", {
      threadId: message.thread?.id
    });
    const response = await aiChat.getChatResponse(message.content, mod.modid);
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
      data.content.forEach(
        async (data) => await aiChat.editMessageContent(msg, data, mod)
      );
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
