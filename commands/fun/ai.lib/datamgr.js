const fs = require("node:fs"),
  path = require("node:path");
const Logger = require("../../../utils/logger");
require("colors");

// Init

const configpath = path.join(process.cwd(), "/configs/kot.chatgpt");
const modsdir = path.join(configpath, "./mods");
const memdir = path.join(configpath, "./memories")
try {
  fs.mkdirSync(configpath);
  fs.mkdirSync(modsdir);
  fs.mkdirSync(memdir);
} catch { }

// Utils
const importJson = (dir = "./") => (fs.existsSync(dir)) ? JSON.parse(fs.readFileSync(dir)) : undefined;
const writeJson = (dir = "./test.json", json = {}) => fs.writeFileSync(dir, JSON.stringify(json));

const fileimport = (dir = "./", data = {}, hide = true) => {
  const filename = path.basename(dir);
  if (!hide) logger.info(("Importing " + filename + "...").gray);
  if (fs.existsSync(dir)) return importJson(dir);
  else {
    writeJson(dir, data);
    return data;
  }
}

let logger = new Logger("AInit");
const setLogger = (log = Logger.prototype) => {
  logger = log;
};

// Configs
let config = {
  api: {
    url: "https://api.openai.com",
    key: "placeyourtokenhere",
  },
  prefix: "-",
  options: { ai_stream: true, logdetails: false },
};
config = fileimport(path.join(configpath, "./config.json"), config);
let profiles = { channels: [] };
profiles = fileimport(path.join(configpath, "./data/profiles.json"), profiles);

// Mods
const main = {
  modid: "kotisoff:main",
  prefix: config.prefix,
  name: "main",
  avatar_url: "",
  personality:
    "Ты бот помощник пользователя. Всегда отвечай на вопросы максимально точно и подробно.",
  ai_settings: {
    model: "gpt-3.5-turbo-16k-0613", // "gpt-4-1106-preview", // "gpt-3.5-turbo-16k-0613",
    temperature: 1.2,
  },
};

const mods = new Map();
const files = fs.readdirSync(modsdir).filter(i => i.endsWith(".json"));
files.map(f => {
  const modid = JSON.parse(fs.readFileSync(path.join(modsdir, f)).toString()).modid
  if (mods.has(modid)) logger.warn(`Modification conflict found: Identical "${modid}" in "${f}" and "${mods.get(modid)}". The last one will be ignored.`.gray);
  mods.set(modid, f);
});
mods.set(main.modid, main.name);

const getMod = (id = "kotisoff:cold") => (id == main.modid) ? main : (mods.has(id)) ? importJson(path.join(modsdir, mods.get(id))) : undefined;

const getMods = () => {
  const tmp = [main];
  mods.forEach((_, modid) => {
    tmp.push(getMod(modid));
  });
  logger.info("Found".gray, tmp.length, "personalities.".gray);
  return tmp;
};

// Ai memory
const getMemory = (modid) => {
  const filename = mods.get(modid).split(".json")[0];
  const mod = getMod(modid);
  const dir = path.join(memdir, `${filename}_memory.json`);
  return fileimport(dir, {
    modid,
    ai_system: [{ role: "system", content: mod.personality }],
    ai_messages: [],
  },
    true
  )
}

const getMemories = () => {
  let memories = [
    {
      modid: "",
      ai_system: [{ role: "", content: "" }],
      ai_messages: [{ role: "", content: "" }],
    },
  ];
  memories = []
  mods.forEach((_, modid) => {
    memories.push(getMemory(modid));
  })
  return memories;
};

// save data
const saveMemory = (modid = "kotisoff:main", memory = {}) => {
  if (!mods.has(modid)) return
  const filename = mods.get(modid).split(".json")[0];
  writeJson(path.join(memdir, filename + "_memory.json"), memory);
}

const saveAll = (memories, showlog) => {
  if (showlog) logger.info("Saving data...");
  mods.forEach((_, modid) => {
    saveMemory(modid, memories.filter(i => i.modid == modid)[0]);
  })
  if (showlog) logger.info("Data saved!");
}

const writeProfiles = (profiles, showlog) => {
  fs.writeFileSync(
    path.join(configpath, "./data/profiles.json"),
    JSON.stringify(profiles),
    () => { }
  );
  if (showlog) logger.info("Profiles are rewritten successfully.")
}

module.exports = {
  getConfig: {
    config, profiles
  },
  getMods,
  getMod,
  getMemories,
  getMemory,
  saveMemory,
  saveAll,
  writeProfiles,
  setLogger
};
