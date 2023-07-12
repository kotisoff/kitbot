const discord = require('discord.js'), openai = require('openai'), fs = require('node:fs'), path = require("node:path"), colors = require('colors')

const configpath = path.join(__dirname, "../configs/kot.chatgpt")

if (!fs.existsSync('./configs/kot.chatgpt')) { fs.mkdirSync('./configs/kot.chatgpt') }
const config = fileimport(path.join(configpath, "./config.json"), { token: "placeyourtokenhere", prefix: "-", options: { ai_stream: true, logdetails: false } }, true)
let profiles = fileimport(path.join(configpath, "./data/profiles.json"), {}, true)
let aitoken = config.token, mainprefix = config.mainprefix

/** @param {String} filepath @param {Boolean} hide*/
function fileimport(filepath, replacedata, hide) {
    filename = path.basename(filepath)
    if (!hide) console.log("[AI]", ('Importing ' + filename + '...').gray)
    try { require(filepath) } catch { fs.writeFileSync(filepath, JSON.stringify(replacedata)) }
    return require(filepath)
}

// OpenAI config

const aiconfig = new openai.Configuration({
    apiKey: aitoken
})
const ai = new openai.OpenAIApi(aiconfig)

// Additional functions

/**@param {discord.Message} msg @param {String} data @param {String} target @param {discord.Webhook} inst*/
const editmsg = async (msg, data, inst, target) => {
    if (target == "main") return await msg.edit(data)
    await inst.editMessage(msg, { content: data })
}

/**@param {Boolean} showlog*/
function saveAll(showlog) {
    if (showlog) console.log("[AI] Saving data...")
    for (let mod in memories) {
        if (mod) {
            fs.writeFileSync(path.join(configpath, `/memories/${mods[mod].filename}_memory.json`), JSON.stringify(memories[mod]), err => { })
        }
    }
    if (showlog) console.log("[AI] Data saved!")
}

// Personalities

const mainTemplate = {
    modid: "kotisoff:main",
    prefix: mainprefix,
    name: "main",
    avatar_url: "",
    personality: "Ты бот помощник пользователя. Всегда отвечай на вопросы максимально точно и подробно.",
    ai_settings: {
        model: "gpt-3.5-turbo",
        temperature: 1.2
    },
    filename: "main" // It's not necessary in mod file, if you want to create one. filename parameter is creating in code every reload, because file can be renamed.
}

if (!fs.existsSync(path.join(configpath, "./mods"))) fs.mkdirSync(path.join(configpath, "./mods"))
let mods = {}

const refreshMods = () => {
    mods = {}
    let files = fs.readdirSync(path.join(configpath, "./mods"))
    files = files.filter(f => f.endsWith(".json"))
    console.log("Found", files.length, "personalities.")

    mods["main"] = mainTemplate
    files.forEach(f => {
        let tmp = require(path.join(configpath, `./mods/${f}`))
        mods[tmp.modid] = tmp
        mods[tmp.modid].filename = f.split('.json')[0]
    })
}

// Ai mem (working on)

if (!fs.existsSync(path.join(configpath, "./memories"))) fs.mkdirSync(path.join(configpath, "./memories"))
let memories = {}

const refreshMemory = () => {
    memories = {}
    for (let mod in mods) {
        memories[mod] = fileimport(path.join(configpath, `./memories/${mods[mod].filename}_memory.json`),
            {
                ai_system: [{ role: "system", content: mods[mod].personality }],
                ai_messages: []
            }, true)
    }
}

// Main work

/**@param {discord.Client} client*/
const shareThread = async (client) => {
    refreshMods()
    refreshMemory()
    if (config.options.ai_stream) console.log("[AI]", "Stream mode is ACTIVATED! It is pretty laggy and causes a bunch of crashes. Use it for your own risk.".bgRed.white)
    try { client.on(discord.Events.MessageCreate, async msg => onMsg(msg)) }
    catch (e) { console.log("[AI]", e) }
}

/**@param {discord.Message} msg*/
const onMsg = async (msg) => {
    if (!profiles.channels.includes(msg.channelId)) return
    if (msg.author.bot) return

    let target
    for (let mod in mods) {
        if (msg.content.startsWith(mods[mod].prefix)) target = mod
    }
    if (!target) return

    function isMain() {
        if (target == "main") return true
        return false
    }

    console.log('[AI]', (`New message to ${mods[target].name}: ` + msg.content.slice(mods[target].prefix.length).gray))

    memories[target].ai_messages.push({
        role: 'user',
        content: msg.content.slice(mods[target].prefix.length),
        name: msg.author.id
    })

    if (memories[target].ai_messages.length > 50) {
        memories[target].ai_messages.splice(0, 2)
    }

    let instance = msg.channel
    if (!isMain()) {
        instance = await msg.channel.createWebhook({ name: mods[target].name, avatar: mods[target].avatar_url })
    }

    let responseType = "text", streaming = await instance.send("*Думоет...*")

    if (config.options.ai_stream) responseType = "stream"
    const msgStream = await ai.createChatCompletion({
        model: mods[target].ai_settings.model,
        messages: memories[target].ai_system.concat(memories[target].ai_messages),
        temperature: mods[target].ai_settings.temperature,
        n: 1,
        user: msg.author.id,
        stream: config.options.ai_stream
    }, { responseType: responseType }).catch(err => {
        return memories[target].ai_messages = []
    })

    if (config.options.ai_stream) {
        let resultmsg = { content: "", role: "assistant" }, output = { content: "", stop: false }

        try {
            msgStream.data.on("data", event => {
                let data = event.toString().split("data: ");
                for (let i in data) {
                    if (data[i].length < 12) data.splice(i, 1)
                }
                data.forEach(dat => {
                    if (dat == "[DONE]" || dat.startsWith("[DONE]")) return
                    try {
                        const message = JSON.parse(dat).choices[0]
                        if (message.finish_reason == null) {
                            if (message.delta.content) {
                                resultmsg.content += message.delta.content
                                output.content += message.delta.content
                            }
                        } else {
                            memories[target].ai_messages.push(resultmsg)
                            output.stop = true
                        }
                    } catch (e) { clearInterval(msginterval);return instance.send("Произошла ошибка: \n" + e + "\nПопробуйте ещё раз...")}
                })
            })
        } catch (e) { console.log(e);return instance.send("Произошла ошибка: \n" + e + "\nПопробуйте ещё раз...")}

        let msginterval = setInterval(async () => {
            if (output.content.length > 2000) {
                streaming = await instance.send("↓")
                output.content = "↓\n" + output.content.substring(2000)
                try { editmsg(streaming, output.content, instance, target) } catch { }
            } else {
                try { editmsg(streaming, output.content, instance, target) } catch { }
            }
            if (output.stop) {
                clearInterval(msginterval)
                console.log("[AI]", "Printing done.".gray)
                if (!isMain()) {
                    setTimeout(() => { instance.delete() }, 1500)
                }
                return
            }
        }, 1500)

    } else {
        let resultmsg = await msgStream.data.choices[0].message
        if (resultmsg.content.length > 2000) {
            const size = Math.ceil(resultmsg.content.length / 2000)
            const parts = Array(size)
            let offset = 0
            for (let i = 0; i < size; i++) {
                parts[i] = resultmsg.content.substring(offset, 2000)
                offset += 2000
            }
            await editmsg(streaming, parts[0], instance, target)
            for (let part = 1; part < parts.length; part++) {
                if (parts[part] != "") {
                    await instance.send(parts[part])
                }
            }
        } else {
            await editmsg(streaming, resultmsg, instance, target)
        }
        memories[target].ai_messages.push(resultmsg)
        if (!isMain()) {
            instance.delete()
        }
    }
}

setInterval(() => {
    saveAll(config.options.logdetails)
}, 180000)

module.exports = {
    idata: new discord.SlashCommandBuilder()
        .setName('ai')
        .setDescription('Выводит список ИИ.')
        .addStringOption(o =>
            o.setName("parameter")
                .setDescription("Параметр для управления ИИ.")
                .addChoices(
                    { name: "Отчистить память одному", value: "clmem" },
                    { name: "Перезагрузить всю память", value: "rsmem" },
                    { name: "Перезагрузить все моды", value: "rsmods" }
                )
        )
        .addStringOption(o =>
            o.setName("modid")
                .setDescription("Идентификатор мода.")
        ),
    //.setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),
    /**@param {discord.Interaction} interact @param {discord.Client} bot*/
    async iexec(interaction, bot) {
        let parameter = interaction.options.getString('parameter')
        let modid = interaction.options.getString('modid')
        if (!parameter) {
            new Promise(res => {
                let prefixes = "Prefixes to call AI's\n```"
                for (let mod in mods) {
                    if (mods[mod].name) {
                    }
                    prefixes += `${mods[mod].prefix} ← ${mods[mod].name}(${mods[mod].modid})\n`
                }
                prefixes += "```"
                let channels = "Also, they are avalible in:\n", i = 1
                profiles.channels.forEach(ch => {
                    channels += `${i}. <#${ch}>\n`
                    i++
                })
                res(`${prefixes}\n${channels}`)
            }).then(res => {
                interaction.reply({ content: res })
            })
        } else {
            if (parameter == "clmem") {
                if (!modid) return interaction.reply({ content: "Ну укажи ты, ёбаный насрал, идентификатор мода.", ephemeral: true })
                try {
                    fs.rmSync(path.join(configpath, `/memories/${mods[modid].filename}_memory.json`))
                    refreshMemory()
                    interaction.reply({ content: "Очищена память " + mods[modid].name })
                }
                catch (e) {
                    interaction.reply({ content: "Ну и хуета твой идентификатор...\n" + e, ephemeral: true })
                }
            } else if (parameter == "rsmem") {
                refreshMemory()
                interaction.reply({ content: "Вся память перезагружена." })
            } else if (parameter == "rsmods") {
                refreshMods()
                interaction.reply({ content: "Все моды перезагружены." })
            }
        }
    },
    shareThread,
    shutdown() {
        saveAll(true)
    }
}
