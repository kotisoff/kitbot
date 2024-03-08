const openai = require("openai");
const { Stream } = require("openai/streaming");
const aiDataMgr = require("./aiDataMgr");
const Mod = require("./aiMod");
const discord = require("discord.js");

const config = aiDataMgr.get.config;
const isMain = aiDataMgr.get.isMain;

const ai = new openai.OpenAI({
  apiKey: config.api.key,
  baseURL: config.api.url
});

// Functions

const splitByLength = (string = "", len = 1) => {
  const a = string.length / len;
  if ((a > a) | 0) a++;
  const temp = [];
  let tmpstr = string;
  for (let i = 0; i < a; i++) {
    temp.push(tmpstr.slice(0, len));
    tmpstr = tmpstr.substring(len);
  }
  return temp;
};

/** @param { discord.Message } message */
const getAiWebHook = async (message) => {
  const webhooks = await message.guild.fetchWebhooks();
  let webhook = webhooks.find((i) => i.name == "ai");
  if (webhook) {
    if (webhook.channelId != message.channelId)
      webhook.edit({ channel: message.channel, reason: "Ai response." });
    return webhook;
  }
  webhook = message.channel.createWebhook({
    name: "ai"
  });
  return webhook;
};

const getChatResponse = async (message = "", modid = "kotisoff:main") => {
  const mod = aiDataMgr.get.mod(modid);
  const memory = aiDataMgr.get.memory(modid);

  const messageTmp = {
    role: "user",
    content: message
  };
  memory.messages.push(messageTmp);

  aiDataMgr.save.saveMemory(modid, memory);

  const requestBody = {
    model: mod.ai_settings.model,
    messages: memory.messages,
    temperature: mod.ai_settings.temperature,
    n: 1,
    stream: config.options.ai_stream,
    tools: mod.ai_settings.tools,
    max_tokens: mod.ai_settings.max_tokens
  };
  if (!requestBody.tools?.length) delete requestBody.tools;

  const Response = ai.chat.completions.create(requestBody);
  return Response;
};

/**
 * @param { Stream<openai.default.ChatCompletionChunk> } response
 */
const handleStreamResponse = async function* (
  response,
  modid = "kotisoff:main",
  skipRate = 10
) {
  if (!response.controller) return;
  let full,
    myId,
    cycle = skipRate - 1;
  for await (let part of response) {
    myId ??= part.id;
    if (myId != part.id) continue;
    const temp = part.choices[0].delta;
    full ??= temp;
    if (temp.content) full.content += temp.content;
    if (cycle % skipRate == 0) {
      yield full;
    }
    cycle++;
  }
  const memory = aiDataMgr.get.memory(modid);
  memory.messages.push(full);
  aiDataMgr.save.saveMemory(modid, memory);
  full.done = true;
  yield full;
  return true;
};

/**
 * @param { openai.default.ChatCompletion } response
 * @returns { Promise<Record<"content", Array<string>> & Omit<openai.default.ChatCompletionMessage, "content">> }
 */
const handleStaticResponse = async (response, modid = "kotisoff:main") => {
  const data = response.choices[0].message;
  const memory = aiDataMgr.get.memory(modid);
  memory.messages.push(data);
  data.content = splitByLength(data.content, 2000);
  save.saveMemory(modid, memory);
  return data;
};

const getModFromPrefixMsg = (message = "") => {
  const mods = aiDataMgr.get.mods();
  const prefixes = mods.map((i) => i.prefix);
  const prefix = prefixes.find((prefix) => {
    const messageCut = message.substring(0, prefix.length);
    return messageCut == prefix;
  });
  return mods.find((mod) => mod.prefix == prefix);
};

const editMessageContent = async (
  message = discord.Message.prototype,
  content = "",
  mod = Mod.prototype
) => {
  if (!content.length) return message;
  if (content.length > 2000) {
    const message = await mod.send(message, splitByLength(content, 2000).pop());
    content = splitByLength(content, 2000).splice(0, 1).join("");
    return message;
  } else {
    return isMain(mod.modid)
      ? await message.edit(content)
      : await mod.webhookEditMsg(message, content);
  }
};

module.exports = {
  getModFromPrefixMsg,
  getChatResponse,
  getAiWebHook,
  handleStaticResponse,
  handleStreamResponse,
  editMessageContent,
  aiDataMgr
};
