const { WebhookClient, Message } = require("discord.js");

const isMain = (modid) => modid == "kotisoff:main";

const modExample = {
  modid: "kotisoff:main",
  prefix: "",
  name: "main",
  avatar_url: "",
  ai_settings: {
    model: "gpt-3.5-turbo-16k-0613", // "gpt-4-1106-preview", // "gpt-3.5-turbo-16k-0613",
    temperature: 1.2,
    stop: ["стой", "стоп", "остановись", "stop"],
    tools: []
  },
  messages: [{ content: "", role: "" }]
};
modExample.messages = [];

module.exports = class {
  constructor(modData = modExample, webhook = WebhookClient.prototype) {
    this.modid = modData.modid;
    this.prefix = modData.prefix;
    this.name = modData.name;
    this.avatar_url = modData.avatar_url;
    this.ai_settings = modData.ai_settings;
    this.messages = modData.messages;
    this.webhook = webhook;
  }

  setWebhook = (webhook = this.webhook) => {
    this.webhook = webhook;
    return this;
  };

  setPrefix = (prefix = "-") => {
    this.prefix = prefix;
    return this;
  };

  send = async (
    message = Message.prototype,
    content = "Hello world!"
    // tts = false
  ) => {
    const channel = isMain(this.modid) ? message.channel : this.webhook;
    return channel.send({
      content,
      // tts: tts,
      avatarURL: this.avatar_url,
      username: this.name,
      threadId: message.thread?.id
    });
  };

  webhookEditMsg = async (
    message = Message.prototype,
    content = "Hello world!"
  ) =>
    this.webhook.editMessage(message, {
      content,
      avatarURL: this.avatar_url,
      username: this.name,
      threadId: message.thread?.id
    });

  editMsg = async (
    message = Message.prototype,
    content = "Hello world!",
    { embeds = [], files = [] }
  ) => message.edit({ content, embeds, files });

  getWebhookData = () => ({ token: this.webhook.token, url: this.webhook.url });

  destroy = () => {
    delete this;
  };

  getModData = () => ({
    modid: this.modid,
    prefix: this.prefix,
    name: this.name,
    avatar_url: this.avatar_url,
    ai_settings: this.ai_settings,
    messages: this.messages
  });
};
