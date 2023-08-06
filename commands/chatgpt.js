const discord = require("discord.js"),
  openai = require("openai"),
  fs = require("node:fs"),
  path = require("node:path");
require("colors");

const configpath = path.join(__dirname, "../configs/kot.chatgpt");

if (!fs.existsSync("./configs/kot.chatgpt")) {
  fs.mkdirSync("./configs/kot.chatgpt");
}
const config = fileimport(
  path.join(configpath, "./config.json"),
  {
    token: "placeyourtokenhere",
    prefix: "-",
    options: { ai_stream: true, logdetails: false },
  },
  true
);
let profiles = fileimport(
  path.join(configpath, "./data/profiles.json"),
  { channels: [] },
  true
);
let aitoken = config.token,
  mainprefix = config.mainprefix;

/** @param {String} filepath @param {Boolean} hide*/
function fileimport(filepath, replacedata, hide) {
  const filename = path.basename(filepath);
  if (!hide) console.log("[AI]", ("Importing " + filename + "...").gray);
  try {
    require(filepath);
  } catch {
    fs.writeFileSync(filepath, JSON.stringify(replacedata));
  }
  return require(filepath);
}

// OpenAI config

const aiconfig = new openai.Configuration({
  apiKey: aitoken,
});
const ai = new openai.OpenAIApi(aiconfig);

// Additional functions

/**@param {discord.Message} msg @param {String} data @param {String} target @param {discord.Webhook} inst*/
const editmsg = async (msg, data, target) => {
  if (data.length === 0) return;
  if (target.modid === "kotisoff:main") return await msg.edit(data);
  await target.inst.editMessage(msg, { content: data });
};

/**@param {Boolean} showlog*/
function saveAll(showlog) {
  if (showlog) console.log("[AI] Saving data...");
  for (let i in memories) {
    fs.writeFileSync(
      path.join(configpath, `/memories/${mods[i].filename}_memory.json`),
      JSON.stringify(memories[i]),
      () => {}
    );
  }
  if (showlog) console.log("[AI] Data saved!");
}

const jsonParser = (data) => {
  try {
    const parsed = JSON.parse(data);
    return parsed;
  } catch {
    return { choices: [{ delta: { content: "?" }, finish_reason: null }] };
  }
};

// Personalities

const modTemplate = {
  modid: "kotisoff:main",
  prefix: mainprefix,
  name: "main",
  avatar_url: "",
  personality:
    "Ты бот помощник пользователя. Всегда отвечай на вопросы максимально точно и подробно.",
  ai_settings: {
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 1.2,
  },
  filename: "main", // It's not necessary in mod file, if you want to create one. filename parameter is creating in code every reload, because file can be renamed.
};
let mods = [modTemplate];

if (!fs.existsSync(path.join(configpath, "./mods")))
  fs.mkdirSync(path.join(configpath, "./mods"));

const refreshMods = () => {
  let files = fs.readdirSync(path.join(configpath, "./mods"));
  files = files.filter((f) => f.endsWith(".json"));
  console.log("[AI] " + "Found".gray, files.length, "personalities.".gray);
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
};

// Ai mem

if (!fs.existsSync(path.join(configpath, "./memories")))
  fs.mkdirSync(path.join(configpath, "./memories"));

const memories = [];

const refreshMemory = () => {
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
};

// Main work

/**@param {discord.Client} client*/
const shareThread = async (client) => {
  refreshMods();
  refreshMemory();
  if (config.options.ai_stream)
    console.log(
      "[AI]",
      "Stream mode is ACTIVATED! It is pretty laggy and causes a bunch of crashes. Use it for your own risk.\nFor some reason, stream mode works more stable than regular mode. paradox?"
        .bgRed.white
    );
  try {
    client.on(discord.Events.MessageCreate, async (msg) => onMsg(msg));
  } catch (e) {
    console.log("[AI]", e);
  }
};

/**@param {discord.Message} msg*/
const onMsg = async (msg) => {
  if (!profiles.channels.includes(msg.channelId)) return;
  if (msg.author.bot) return;

  const target = mods.find((mod) => msg.content.startsWith(mod.prefix));
  if (!target) return;
  target.memory = memories.find((mem) => mem.modid === target.modid);
  if (!target.memory) return;

  function isMain() {
    if (target.modid === "kotisoff:main") return true;
    return false;
  }

  console.log(
    "[AI]",
    `New message to ${target.name}: ` +
      msg.content.slice(target.prefix.length).gray
  );

  target.memory.ai_messages.push({
    role: "user",
    content: msg.content.slice(target.prefix.length),
    name: msg.author.id,
  });

  target.inst = msg.channel;
  if (!isMain()) {
    target.inst = await msg.channel.createWebhook({
      name: target.name,
      avatar: target.avatar_url,
    });
  }

  let responseType = "text",
    streaming = await target.inst.send("*Думоет...*");

  if (config.options.ai_stream) responseType = "stream";
  const msgStream = await ai
    .createChatCompletion(
      {
        model: target.ai_settings.model,
        messages: target.memory.ai_system.concat(target.memory.ai_messages),
        temperature: target.ai_settings.temperature,
        n: 1,
        user: msg.author.id,
        stream: config.options.ai_stream,
      },
      { responseType: responseType }
    )
    .catch(() => {
      target.memory.ai_messages = [];
      return editmsg(
        streaming,
        "*Память переполнена и в последствии сброшена. Повторите попытку!*",
        target
      );
    });

  if (config.options.ai_stream) {
    let resultmsg = { content: "", role: "assistant" },
      output = { content: "", stop: false };

    try {
      await msgStream?.data?.on("data", (event = Buffer) => {
        const data = event.toString().split("\n\n");
        data.forEach((chunk) => {
          if (chunk.includes("[DONE]") || chunk === "") return false;
          const parseddata = jsonParser(chunk.replace("data: ", ""));
          const message = parseddata.choices[0];
          if (message.finish_reason == null) {
            if (message.delta.content) {
              resultmsg.content += message.delta.content;
              output.content += message.delta.content;
            }
          } else {
            target.memory.ai_messages.push(resultmsg);
            output.stop = true;
          }
        });
      });
    } catch (e) {
      clearInterval(msginterval);
      console.log(e);
      return target.inst.send(
        "Произошла ошибка: \n" + e + "\nПопробуйте ещё раз..."
      );
    }

    let msginterval = setInterval(async () => {
      if (output.content.length > 2000) {
        output.content = "↓\n..." + output.content.substring(1900);
        console.log(`[AI]`, `Выполнен перенос строки.`.gray);
        streaming = await target.inst.send(output.content);
        try {
          editmsg(streaming, output.content, target);
        } catch {}
      } else {
        try {
          editmsg(streaming, output.content, target);
        } catch {}
      }
      if (output.stop) {
        clearInterval(msginterval);
        console.log("[AI]", "Printing done.".gray);
        if (!isMain()) {
          setTimeout(() => {
            target.inst.delete();
          }, 1500);
        }
        return;
      }
    }, 1500);
  } else {
    let resultmsg = await msgStream.data.choices[0].message;
    if (resultmsg.content.length > 2000) {
      const size = Math.ceil(resultmsg.content.length / 2000);
      const parts = Array(size);
      let offset = 0;
      for (let i = 0; i < size; i++) {
        parts[i] = resultmsg.content.substring(offset, 2000);
        offset += 2000;
      }
      await editmsg(streaming, parts[0], target);
      for (let part = 1; part < parts.length; part++) {
        if (parts[part] != "") {
          await target.inst.send(parts[part]);
        }
      }
    } else {
      await editmsg(streaming, resultmsg, target);
    }
    target.memory.ai_messages.push(resultmsg);
    if (!isMain()) {
      target.inst.delete();
    }
  }
};

setInterval(() => {
  saveAll(config.options.logdetails);
}, 180000);

module.exports = {
  idata: new discord.SlashCommandBuilder()
    .setName("ai")
    .setDescription("Выводит список ИИ.")
    .addStringOption((o) =>
      o
        .setName("parameter")
        .setDescription("Параметр для управления ИИ.")
        .addChoices(
          { name: "Очистить память одному", value: "clmem" },
          { name: "Перезагрузить всю память", value: "rsmem" },
          { name: "Перезагрузить все моды", value: "rsmods" },
          { name: "Добавить данный канал в разрешённые", value: "addchannel" },
          { name: "Удалить данный канал из разрешённых", value: "rmchannel" }
        )
    )
    .addStringOption((o) =>
      o.setName("modid").setDescription("Идентификатор мода.")
    ),
  //.setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async iexec(interact, bot) {
    let parameter = interact.options.getString("parameter");
    let modid = interact.options.getString("modid");
    if (!parameter) {
      new Promise((res) => {
        let prefixes = "Prefixes to call AI's\n```";
        for (let mod in mods) {
          if (mods[mod].name) {
          }
          prefixes += `${mods[mod].prefix} ← ${mods[mod].name}(${mods[mod].modid})\n`;
        }
        prefixes += "```";
        let channels = "Also, they are avalible in:\n",
          i = 1;
        profiles.channels.forEach((ch) => {
          channels += `${i}. <#${ch}>\n`;
          i++;
        });
        res(`${prefixes}\n${channels}`);
      }).then((res) => {
        interact.reply({ content: res });
      });
    }
    if (parameter === "clmem") {
      if (!modid)
        return interact.reply({
          content: "Ну укажи ты, ёбаный насрал, идентификатор мода.",
          ephemeral: true,
        });
      const memory = memories.find((mem) => mem.modid === modid)[0];
      if (memory) {
        memory.ai_messages = [];
        return await interact.reply({ content: "Очищена память " + modid });
      }
      interact.reply({
        content: "Ну и хуета твой идентификатор...\n",
        ephemeral: true,
      });
    }
    if (parameter === "rsmem") {
      refreshMemory();
      interact.reply({ content: "Вся память перезагружена." });
    }
    if (parameter === "rsmods") {
      refreshMods();
      interact.reply({ content: "Все моды перезагружены." });
    }
    if (parameter === "addchannel") {
      profiles.channels.push(interact.channelId);
      fs.writeFileSync(
        path.join(configpath, "./data/profiles.json"),
        JSON.stringify(profiles),
        () => {}
      );
      interact.reply({ content: "Данный канал успешно добавлен в каналы ИИ!" });
    }
    if (parameter === "rmchannel") {
      profiles.channels.splice(
        profiles.channels.indexOf(interact.channelId),
        1
      );
      fs.writeFileSync(
        path.join(configpath, "./data/profiles.json"),
        JSON.stringify(profiles),
        () => {}
      );
      interact.reply({ content: "Данный канал успешно убран из каналов ИИ!" });
    }
  },
  shareThread,
  shutdown() {
    saveAll(true);
  },
};
