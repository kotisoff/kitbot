const fs = require("node:fs"),
  path = require("node:path");
const Logger = require("../../../utils/logger");
const Mod = require("./aiMod");
require("colors");

// Init

const configdir = path.join(process.cwd(), "/configs/kot.chatgpt");
const modsdir = path.join(configdir, "./mods");
const memdir = path.join(configdir, "./memories");
try {
  fs.mkdirSync(configdir);
  fs.mkdirSync(modsdir);
  fs.mkdirSync(memdir);
} catch {}

// Utils
const importJson = (dir = "./") =>
  fs.existsSync(dir) ? JSON.parse(fs.readFileSync(dir)) : undefined;
const writeJson = (dir = "./test.json", json = {}) =>
  fs.writeFileSync(dir, JSON.stringify(json));

const fileimport = (dir = "./", data = {}, hide = true) => {
  const filename = path.basename(dir);
  if (!hide) logger.info(("Importing " + filename + "...").gray);
  if (fs.existsSync(dir)) return importJson(dir);
  else {
    writeJson(dir, data);
    return data;
  }
};

let logger = new Logger("AInit");
const setLogger = (log = Logger.prototype) => {
  logger = log;
};

// Configs
let config = {
  api: {
    url: "https://api.openai.com",
    key: "placeyourtokenhere"
  },
  prefix: "-",
  options: { ai_stream: true, logdetails: false }
};
config = fileimport(path.join(configdir, "./config.json"), config);

// Profiles

let profiles = { channels: [] };
profiles = fileimport(path.join(configdir, "./profiles.json"), profiles);

const pushToProfiles = (channelid = "") => {
  profiles.channels.push(channelid);
};

const writeProfiles = (showlog = false) => {
  fs.writeFileSync(
    path.join(configdir, "./profiles.json"),
    JSON.stringify(profile),
    () => {}
  );
  if (showlog) logger.info("Profiles are rewritten successfully.");
};

// Mods
const main = new Mod().setPrefix(config.prefix);

const mods = new Map();

const refreshMods = () => {
  mods.clear();
  const files = fs.readdirSync(modsdir).filter((i) => i.endsWith(".json"));
  files.map((f) => {
    const modid = JSON.parse(
      fs.readFileSync(path.join(modsdir, f)).toString()
    ).modid;
    if (mods.has(modid))
      logger.warn(
        `Modification conflict found: Identical "${modid}" in "${f}" and "${mods.get(
          modid
        )}". The last one will be ignored.`.gray
      );
    mods.set(modid, f);
  });
  mods.set(main.modid, main.name);
  logger.info("Found".gray, mods.size, "personalities.".gray);
};

refreshMods();

const getMod = (id = "kotisoff:cold") => {
  if (main.modid == id) return main;
  if (mods.has(id)) {
    const moddata = importJson(path.join(modsdir, mods.get(id)));
    return new Mod(moddata);
  }
};

const getMods = () => {
  const tmp = [main];
  tmp.pop(); // Без этого в выходном массиве будет 2 main. На этой функции держится МИР хд
  mods.forEach((_, modid) => {
    tmp.push(getMod(modid));
  });
  return tmp;
};

const isMain = (modid = "kotisoff:main") => modid == "kotisoff:main";

// Ai memory
const getMemory = (modid = "kotisoff:main") => {
  const filename = mods.get(modid).split(".json")[0];
  const mod = getMod(modid);
  const dir = path.join(memdir, `${filename}_memory.json`);
  let memory = {
    modid,
    messages: mod.messages
  };
  memory = fileimport(dir, memory, true);
  return memory;
};

const getMemories = () => {
  let memories = [
    {
      modid: "",
      messages: [{ role: "", content: "" }]
    }
  ];
  memories = [];
  mods.forEach((_, modid) => {
    memories.push(getMemory(modid));
  });
  return memories;
};

const resetMemory = (modid = "kotisoff:main") => {};

// save data
const saveMemory = (modid = "kotisoff:main", memory = {}) => {
  if (!mods.has(modid)) return;
  const filename = mods.get(modid).split(".json")[0];
  writeJson(path.join(memdir, filename + "_memory.json"), memory);
};

const saveAll = (memories, showlog) => {
  if (showlog) logger.info("Saving data...");
  mods.forEach((_, modid) => {
    saveMemory(modid, memories.filter((i) => i.modid == modid)[0]);
  });
  if (showlog) logger.info("Data saved!");
};

module.exports = {
  paths: {
    configdir,
    modsdir,
    memdir
  },
  get: {
    config,
    profiles,
    mods: getMods,
    mod: getMod,
    memories: getMemories,
    memory: getMemory,
    isMain
  },
  save: {
    saveMemory,
    saveAll
  },
  profile: {
    push: pushToProfiles,
    write: writeProfiles
  },
  setLogger,
  refreshMods
};
