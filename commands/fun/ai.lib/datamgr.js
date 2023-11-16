const fs = require("node:fs"),
  path = require("node:path");
const { Logger } = require("../../../utils");
require("colors");

const configpath = path.join(process.cwd(), "/configs/kot.chatgpt");

if (!fs.existsSync(configpath)) {
  fs.mkdirSync(configpath);
}
let logger = Logger.prototype;

const setLogger = (log = Logger.prototype) => {
  logger = log;
};

const fileimport = (filepath = "", replacedata, hide = false) => {
  const filename = path.basename(filepath);
  if (!hide) logger.info(("Importing " + filename + "...").gray);
  try {
    require(filepath);
  } catch {
    fs.writeFileSync(filepath, JSON.stringify(replacedata));
  }
  return require(filepath);
};

const getConfigs = () => {
  let config = {
    api: {
      url: "https://api.openai.com",
      key: "placeyourtokenhere",
    },
    prefix: "-",
    options: { ai_stream: true, logdetails: false, ai_type: "openai" }, // openai | gpt4all
  };
  config = fileimport(path.join(configpath, "./config.json"), config, true);
  let profiles = { channels: [] };
  profiles = fileimport(
    path.join(configpath, "./data/profiles.json"),
    profiles,
    true
  );
  return { config, profiles };
};

// Personalities

const getMods = (config) => {
  const modTemplate = {
    modid: "kotisoff:main",
    prefix: config.prefix,
    name: "main",
    avatar_url: "",
    personality:
      "Ты бот помощник пользователя. Всегда отвечай на вопросы максимально точно и подробно.",
    ai_settings: {
      model: "gpt-3.5-turbo-16k-0613", // -16k-0613
      temperature: 1.2,
    },
    filename: "main", // It's not necessary in mod file, if you want to create one. filename parameter is creating in object every reload.
  };

  let mods = [modTemplate];

  if (!fs.existsSync(path.join(configpath, "./mods")))
    fs.mkdirSync(path.join(configpath, "./mods"));

  let files = fs.readdirSync(path.join(configpath, "./mods"));
  files = files.filter((f) => f.endsWith(".json"));
  logger.info("Found".gray, files.length, "personalities.".gray);
  files.forEach((f) => {
    const tmp = require(path.join(configpath, `./mods/${f}`));
    tmp.filename = f.replace(".json", "");
    if (mods.find((mod) => mod.modid === tmp.modid))
      throw console.error(
        `Mods with the same modid's found! Please edit one of them.\nThere they are: ${mods
          .map((mod) => mod.filename)
          .join(", ")}, ${tmp.filename}`
      );
    mods.push(tmp);
  });
  return mods;
};

// Ai mem
const getMemory = (mods) => {
  if (!fs.existsSync(path.join(configpath, "./memories")))
    fs.mkdirSync(path.join(configpath, "./memories"));

  let memories = [
    {
      modid: "",
      ai_system: [{ role: "", content: "" }],
      ai_messages: [{ role: "", content: "" }],
    },
  ];
  memories = []

  mods.forEach((mod) => {
    memories.push(
      fileimport(
        path.join(configpath, `./memories/${mod.filename}_memory.json`),
        {
          modid: mod.modid,
          ai_system: [{ role: "system", content: mod.personality }],
          ai_messages: [],
        },
        true
      )
    );
  });
  return memories;
};

/**@param {Boolean} showlog*/
const saveAll = (mods, memories, showlog) => {
  if (showlog) logger.info("Saving data...");
  for (let i in memories) {
    fs.writeFileSync(
      path.join(configpath, `/memories/${mods[i].filename}_memory.json`),
      JSON.stringify(memories[i]),
      () => { }
    );
  }
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
  getConfigs,
  getMods,
  getMemory,
  saveAll,
  writeProfiles,
  setLogger
};
