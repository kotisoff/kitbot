const fs = require("fs"), path = require("path");
// const { getConfig, paths } = require("./aiDataMgr");
const getConfig = { config: { prefix: "-" } }
const configdir = path.join(process.cwd(), "/configs/kot.chatgpt");
const modsdir = path.join(configdir, "./mods");
const memdir = path.join(configdir, "./memories")
const paths = {
  configdir,
  modsdir,
  memdir
}
const config = getConfig.config;

const modauthor = require("node:os").userInfo().username.split(" ").join("_").toLowerCase();

const roles = {
  system: "system",
  assistant: "assistant",
  user: "user"
}
const msgObj = [
  { role: roles.user, content: "" }
];

const oldAi = {
  "modid": "kotisoff:nekochan",
  "prefix": "'neko-",
  "name": "Неко-тян",
  "avatar_url": "https://preview.redd.it/anime-cat-girls-v0-l3g1myw120ka1.jpg?width=640&crop=smart&auto=webp&s=aa96ec766066bf89e804d56885de0db15df8e7e4",
  "personality": "Ты маленькая и наивная аниме девочка-кошка. Любишь аниме и мангу, подражаешь их героям. Пишешь ня в конце каждого сообщения. Когда тебя спрашивают кто ты, отвечай что ты - она.",
  "ai_settings": {
    "model": "gpt-3.5-turbo",
    "temperature": 1.2
  }
}

class Personality {
  constructor(id = "test", author = modauthor) {
    this.author = author;
    this.id = id;
    this.modid = `${author}:${id}`;
    this.prefix = `'${id}${config.prefix}`;
    this.name = id;
    this.avatar_url = "";
    this.systemMessages = [];
    this.presetMessages = [];
    this.ai_settings = {
      model: "gpt-3.5-turbo",
      temperature: 1,
      stop: ["стой", "стоп", "остановись", "stop"],
      tools: []
    }
  }
  setName = (name = this.name) => {
    this.name = name;
    return this;
  }
  setCallPrefix = (prefix = this.prefix, withoutConfigPrefix = false) => {
    if (withoutConfigPrefix) this.prefix = prefix;
    else this.prefix = `'${prefix}${config.prefix}`;
    return this;
  }
  setAvatarUrl = (url = this.avatar_url) => {
    this.avatar_url = url;
    return this;
  }

  // Add messages

  addSystemMessage = (content = "") => {
    const role = roles.system;
    const message = {
      role: role,
      content
    }
    this.systemMessages.push(message);
    return this;
  }
  addUserMessage = (content = "") => {
    const role = roles.user;
    const message = {
      role: role,
      content
    }
    this.presetMessages.push(message);
    return this;
  }
  addAssistantMessage = (content = "") => {
    const role = roles.assistant;
    const message = {
      role: role,
      content
    }
    this.presetMessages.push(message);
    return this;
  }
  addMessages = (messagesObject = msgObj) => {
    messagesObject.forEach(i => {
      if (i.role == roles.system) return this.systemMessages.push(i);
      this.presetMessages.push(i);
    })
    return this;
  }
  removeMessage = (content = "") => {
    const message = this.presetMessages.indexOf(this.presetMessages.filter(i => i.content == content)[0])
    if (message < 0) return "fail"
    this.presetMessages.splice(message, 1);
    return this;
  }

  // AI Settings

  /**
   * Use carefully!!! 
   * If you want your profile to work, set only models that exist at the moment
   * @param set Leave blank, if just you want to get ai model.
   */
  aiModel = (set = this.ai_settings.model) => {
    this.ai_settings.model = set;
    return this.ai_settings.model;
  }
  aiTemperature = (set = this.ai_settings.temperature) => {
    this.ai_settings.temperature = set;
    return this.ai_settings.temperature;
  }
  stopWords = () => {
    return this.ai_settings.stop;
  }
  addStopWord = (word = this.ai_settings.stop) => {
    this.ai_settings.stop.push(word);
    return this;
  }
  removeStopWord = (word = this.ai_settings.stop) => {
    const id = this.ai_settings.stop.indexOf(word);
    if (message < 0) return "fail"
    this.ai_settings.stop.splice(id, 1);
    return this;
  }

  // Build profile

  build = (write = false, filename = "") => {
    const ai = {
      modid: this.modid,
      prefix: this.prefix,
      name: this.name,
      avatar_url: this.avatar_url,
      ai_settings: this.ai_settings,
      messages: [...this.systemMessages, ...this.presetMessages]
    }
    if (!write) return ai;
    const i = fs.readdirSync(paths.modsdir).filter(file => file.startsWith(this.id)).length;
    if (!filename) filename = `${this.id}${(i > 0) ? i : ""}.json`
    fs.writeFileSync(path.join(paths.modsdir, filename), JSON.stringify(ai));
    return ai;
  }

  // ETC

  portOld = (ai = oldAi) => {
    this.author = ai.modid.split(":")[0]
    this.id = ai.modid.split(":")[1]
    this.modid = ai.modid;
    this.ai_settings = ai.ai_settings;
    this.setName(ai.name).setAvatarUrl(ai.avatar_url).setCallPrefix(ai.prefix, true).addSystemMessage(ai.personality);
  }
}

module.exports = Personality;