const discord = require("discord.js"),
  { OpenAI } = require("openai")
require("colors");
const { getConfigs, getMods, getMemory, saveAll, writeProfiles } = require("./ai.lib/datamgr");
const { Command } = require("../../assets/utils").Command;

// Additional functions

/**@param {discord.Message} msg @param {String} data @param {String} target @param {discord.Webhook} inst*/
const editmsg = async (msg, data, target) => {
  if (data.length === 0) return;
  if (target.modid === "kotisoff:main") return await msg.edit(data);
  await target.inst.editMessage(msg, { content: data });
};

let lostdata = "";
const jsonParser = (data) => {
  try {
    return JSON.parse(data);
  } catch {
    const blankdata = {
      choices: [{ delta: { content: "" }, finish_reason: null }],
    };
    if (lostdata.length > 0) {
      const parsed = JSON.parse(lostdata + data);
      lostdata = "";
      return parsed;
    } else {
      lostdata += data;
      return blankdata;
    }
  }
};

// Load data

let { config, profiles } = getConfigs();
let mods = getMods(config);
let memories = getMemory(mods);
// console.log({ mods, memories })


// OpenAI

const ai = new OpenAI({
  apiKey: config.api.key,
  baseURL: config.api.url
})

// Main work

/**@param {discord.Client} client*/
const shareThread = async (client) => {
  if (!config.options.ai_stream)
    console.log(
      "[AI]",
      // "Stream mode is ACTIVATED! It is pretty laggy and causes a bunch of crashes. Use it for your own risk.\nFor some reason, stream mode works more stable than regular mode. paradox?"
      "Static mode is activated! Use stream mode from now. Static is less optimized."
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

  streaming = await target.inst.send("*Думоет...*");

  const msgStream = await ai
    .chat.completions.create(
      {
        model: target.ai_settings.model,
        messages: target.memory.ai_system.concat(target.memory.ai_messages),
        temperature: target.ai_settings.temperature,
        n: 1,
        user: msg.author.id,
        stream: config.options.ai_stream,
      }
    ).catch((err) => {
      target.memory.ai_messages = [];
      console.log(err);
      return editmsg(
        streaming,
        "*Память переполнена и в последствии сброшена. Повторите попытку!*" + `\nCaught ${err}`,
        target
      );
    });

  const interval = 10;
  let i = 0;

  if (config.options.ai_stream) {
    let resultmsg = { content: "", role: "assistant" },
      output = { content: "", stop: false };
    for await (const part of msgStream) {
      const message = part.choices[0];
      if (message.finish_reason == null) {
        if (message?.delta?.content) {
          resultmsg.content += message.delta.content;
          output.content += message.delta.content;
          i++;
          if (i % interval === 0) {
            if (output.content.length > 2000) {
              output.content = "↓\n..." + output.content.substring(1900);
              console.log(`[AI]`, `Выполнен перенос строки.`.gray);
              streaming = await target.inst.send(output.content);
            }
            try {
              editmsg(streaming, output.content, target);
            } catch { }
          }
        }
      } else {
        try {
          editmsg(streaming, output.content, target);
        } catch { }
        target.memory.ai_messages.push(resultmsg);
        console.log("[AI]", "Printing done.".gray);
        if (process.argv.slice(2).includes("--printresponse")) console.log("[AI]", resultmsg.content.gray);
        if (!isMain()) {
          setTimeout(() => {
            target.inst.delete();
          }, 1500);
        }
      }
    }

  } else {
    let resultmsg = await msgStream.choices[0].message;
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
  saveAll(mods, memories, config.options.logdetails);
}, 180000);

const AI = new Command("ai");
AI.setSlashAction(async (interact, bot) => {
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
    writeProfiles(profiles, config.options.logdetails);
    interact.reply({ content: "Данный канал успешно добавлен в каналы ИИ!" });
  }
  if (parameter === "rmchannel") {
    profiles.channels.splice(
      profiles.channels.indexOf(interact.channelId),
      1
    );
    writeProfiles(profiles, config.options.logdetails);
    interact.reply({ content: "Данный канал успешно убран из каналов ИИ!" });
  }
})
  .slashCommandInfo
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
  )
AI.setShutdownAction(() => {
  saveAll(mods, memories, true);
})
AI.setSharedThread(shareThread)

module.exports = AI;

// module.exports = {
//   data: new discord.SlashCommandBuilder()
//     .setName("ai")
//     .setDescription("Выводит список ИИ.")
//     .addStringOption((o) =>
//       o
//         .setName("parameter")
//         .setDescription("Параметр для управления ИИ.")
//         .addChoices(
//           { name: "Очистить память одному", value: "clmem" },
//           { name: "Перезагрузить всю память", value: "rsmem" },
//           { name: "Перезагрузить все моды", value: "rsmods" },
//           { name: "Добавить данный канал в разрешённые", value: "addchannel" },
//           { name: "Удалить данный канал из разрешённых", value: "rmchannel" }
//         )
//     )
//     .addStringOption((o) =>
//       o.setName("modid").setDescription("Идентификатор мода.")
//     ),
//   //.setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),
//   /**@param {discord.Interaction} interact @param {discord.Client} bot*/
//   async exec(interact, bot) {
//     let parameter = interact.options.getString("parameter");
//     let modid = interact.options.getString("modid");
//     if (!parameter) {
//       new Promise((res) => {
//         let prefixes = "Prefixes to call AI's\n```";
//         for (let mod in mods) {
//           if (mods[mod].name) {
//           }
//           prefixes += `${mods[mod].prefix} ← ${mods[mod].name}(${mods[mod].modid})\n`;
//         }
//         prefixes += "```";
//         let channels = "Also, they are avalible in:\n",
//           i = 1;
//         profiles.channels.forEach((ch) => {
//           channels += `${i}. <#${ch}>\n`;
//           i++;
//         });
//         res(`${prefixes}\n${channels}`);
//       }).then((res) => {
//         interact.reply({ content: res });
//       });
//     }
//     if (parameter === "clmem") {
//       if (!modid)
//         return interact.reply({
//           content: "Ну укажи ты, ёбаный насрал, идентификатор мода.",
//           ephemeral: true,
//         });
//       const memory = memories.find((mem) => mem.modid === modid)[0];
//       if (memory) {
//         memory.ai_messages = [];
//         return await interact.reply({ content: "Очищена память " + modid });
//       }
//       interact.reply({
//         content: "Ну и хуета твой идентификатор...\n",
//         ephemeral: true,
//       });
//     }
//     if (parameter === "rsmem") {
//       refreshMemory();
//       interact.reply({ content: "Вся память перезагружена." });
//     }
//     if (parameter === "rsmods") {
//       refreshMods();
//       interact.reply({ content: "Все моды перезагружены." });
//     }
//     if (parameter === "addchannel") {
//       profiles.channels.push(interact.channelId);
//       writeProfiles(profiles, config.options.logdetails);
//       interact.reply({ content: "Данный канал успешно добавлен в каналы ИИ!" });
//     }
//     if (parameter === "rmchannel") {
//       profiles.channels.splice(
//         profiles.channels.indexOf(interact.channelId),
//         1
//       );
//       writeProfiles(profiles, config.options.logdetails);
//       interact.reply({ content: "Данный канал успешно убран из каналов ИИ!" });
//     }
//   },
//   shareThread,
//   shutdown() {
//     saveAll(mods, memories, true);
//   },
// };
