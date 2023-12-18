const openai = require("openai");
const { Stream } = require("openai/streaming");
const { get, save, profile } = require("./aiDataMgr");
const discord = require("discord.js");

const config = get.config;

const ai = new openai.OpenAI({
  apiKey: config.api.key,
  baseURL: config.api.url
});

const isMain = (modid = "kotisoff:main") => {
  if (modid == "kotisoff:main") return true;
  return false;
};

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

const getWebHook = async (
  message = discord.Message.prototype,
  mod = get.mod()
) => {
  const webhooks = (await message.guild.fetchWebhooks()).map((i) => i);
  let webhook = webhooks.find((i) => i.name == mod.name);
  if (webhook) {
    webhook.edit({
      avatar: mod.avatar_url,
      name: mod.name,
      channel: message.channel
    });
    return webhook;
  }
  webhook = await message.channel.createWebhook({
    avatar: mod.avatar_url,
    name: mod.name
  });
  return webhook;
};

const getChatResponse = async (message = "", modid = "kotisoff:main") => {
  const mod = get.mod(modid);
  const memory = get.memory(modid);

  const messageTmp = {
    role: "user",
    content: message
  };
  memory.messages.push(messageTmp);

  save.saveMemory(modid, memory);

  const Response = ai.chat.completions.create({
    model: mod.ai_settings.model,
    messages: memory.messages,
    temperature: mod.ai_settings.temperature,
    n: 1,
    stream: config.options.ai_stream,
    stop: mod.ai_settings.stop,
    tools: mod.ai_settings.tools
  });
  return await Response;
};

/**
 * @param { Stream<openai.default.ChatCompletionChunk> } response
 */
const handleStreamResponse = async function* (
  response,
  modid = "kotisoff:main"
) {
  const data = response;
  let full;
  let myId;
  for await (let part of data) {
    myId ??= part.id;
    if (myId != part.id) continue;
    const temp = part.choices[0].delta;
    full ??= temp;
    if (temp.content) full.content += temp.content;
    console.log(temp);
    yield temp;
  }
  const memory = get.memory(modid);
  memory.messages.push(full);
  save.saveMemory(modid, memory);
  return true;
};

/**
 * @param { openai.default.ChatCompletion } response
 * @returns { Promise<Record<"content", Array<string>> & Omit<openai.default.ChatCompletionMessage, "content">> }
 */
const handleStaticResponse = async (response, modid = "kotisoff:main") => {
  console.log("waiting for response...");
  const data = response.choices[0].message;
  console.log(data.content);
  const memory = get.memory(modid);
  memory.messages.push(data);
  data.content = splitByLength(data.content, 2000);
  save.saveMemory(modid, memory);
  console.log("done.");
  return data;
};

const getModFromPrefixMsg = (message = "") => {
  const mods = get.mods();
  const prefixes = mods.map((i) => i.prefix);
  const prefix = prefixes.find((prefix) => {
    const messageCut = message.substring(0, prefix.length);
    return messageCut == prefix;
  });
  return mods.find((mod) => mod.prefix == prefix);
};

const appendMessage = async (
  message = discord.Message.prototype,
  appendString = ""
) => {
  if ((message.content + appendString).length > 2000)
    return await message.channel.send(appendString);
  else return await message.edit(message.content + appendString);
};

module.exports = {
  getModFromPrefixMsg,
  getChatResponse,
  getWebHook,
  handleStaticResponse,
  handleStreamResponse,
  isMain,
  appendMessage,
  aiDataMgr: {
    get,
    save,
    profile
  }
};
