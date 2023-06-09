const discord = require('discord.js'), openai = require('openai'), fs = require('node:fs'), path = require("node:path"), colors = require('colors')

const configpath = path.join(__dirname, "../configs/kot.chatgpt")

if (!fs.existsSync('./configs/kot.chatgpt')) { fs.mkdirSync('./configs/kot.chatgpt') }
const config = fileimport(path.join(configpath, "./config.json"), { token: "placeyourtokenhere", prefix: "-", options: { ai_stream: true, savelog: false } })
let profiles = fileimport(path.join(configpath, "./data/profiles.json"), {})
let aitoken = config.token, mainprefix = config.mainprefix

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

// Personalities

if (!fs.existsSync(path.join(configpath, "./mods"))) fs.mkdirSync(path.join(configpath, "./mods"))

let files = fs.readdirSync(path.join(configpath, "./mods"))
files = files.filter(f => f.endsWith(".json"))
console.log("Found", files.length, "personalities.")

let mods = {}

mods["main"] = { modid: "kotisoff:main", name: "main", prefix: mainprefix, ai_settings: { model: "gpt-3.5-turbo", temperature: 1.2 } }

files.forEach(f => {
    let tmp = require(path.join(configpath, `./mods/${f}`))
    let name = f.split('.json')[0]
    mods[name] = tmp
})

// Ai mem (working on)

if (!fs.existsSync(path.join(configpath, "./memories"))) fs.mkdirSync(path.join(configpath, "./memories"))

let memories = {}

memories["main"] = fileimport(path.join(configpath, `./memories/main_memory.json`), { ai_system: [{ role: "system", content: "Ты - тот кем ты хочешь быть." }], ai_messages: [] }, true)

for (let mod in mods) {
    memories[mod] = fileimport(path.join(configpath, `./memories/${mod}_memory.json`),
        {
            ai_system: [{ role: "system", content: mods[mod].personality }],
            ai_messages: []
        }, true)
}

// Main work

if (config.options.ai_stream) console.log("[AI]", "Stream mode is ACTIVATED! It is in very early testing! Use it for your own risk!".bgRed.white)

const editmsg = async (msg, data, inst, target) => {
    if (target == "main") return await msg.edit(data)
    await inst.editMessage(msg, { content: data })
}

const shareThread = async (client) => {
    try { await client.on(discord.Events.MessageCreate, async msg => onMsg(msg)) }
    catch (e) { console.log("[AI]", e) }
}

const onMsg = async (msg) => {
    if (!profiles.channels.includes(msg.channelId)) return
    if (msg.author.bot) return

    let target
    for (let mod in mods) {
        if (msg.content.startsWith(mods[mod].prefix)) target = mod
    }
    if (!target) return

    console.log('[AI]', (`New message to ${target}: ` + msg.content.slice(mods[target].prefix.length).gray))

    memories[target].ai_messages.push({
        role: 'user',
        content: msg.content.slice(mods[target].prefix.length),
        name: msg.author.id
    })

    if (memories[target].ai_messages.length > 50) {
        memories[target].ai_messages.splice(0, 2)
    }

    let instance = msg.channel
    if (target != "main") {
        instance = await msg.channel.createWebhook({ name: mods[target].name, avatar: mods[target].avatar_url })
    }

    let responseType = "text", streaming = await instance.send("*Думает...*")

    if (config.options.ai_stream) responseType = "stream"

    const msgStream = await ai.createChatCompletion({
        model: mods[target].ai_settings.model,
        messages: memories[target].ai_system.concat(memories[target].ai_messages),
        temperature: mods[target].ai_settings.temperature,
        n: 1,
        user: msg.author.id,
        stream: config.options.ai_stream
    }, { responseType: responseType })

    if (config.options.ai_stream) {
        let resultmsg = { content: "", role: "assistant" }, output = { content: "", stop: false }

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
                } catch(e) { output.content = "Произошла ошибка: \n"+e+"\nПопробуйте ещё раз...";output.stop=true }
            })
        })

        let msginterval = setInterval(async () => {
            if (output.content.length > 2000) {
                streaming = await instance.send("↓")
                output.content = "↓\n"+output.content.substring(2000)
                try { editmsg(streaming, output.content, instance, target) } catch { }
            }else{
                try { editmsg(streaming, output.content, instance, target) } catch { }
            }
            if (output.stop) {
                clearInterval(msginterval)
                console.log("[AI]", "Printing done.".gray)
                if (target != "main") {
                    setTimeout(()=>{instance.delete()},1500)
                }
                return
            }
        }, 1500)

    } else {

        let resultmsg = msgStream.data.choices[0].message
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
        if (target != "main") {
            instance.delete()
        }
    }
}

setInterval(() => {
    if (config.options.savelog) console.log("[AI] Saving data...")
    for (let mod in memories) {
        fs.writeFileSync(path.join(configpath, `/memories/${mod}_memory.json`), JSON.stringify(memories[mod]), err => { })
    }
    if (config.options.savelog) console.log("[AI] Data saved!")
}, 180000)

module.exports = {
    type: 'i',
    idata: new discord.SlashCommandBuilder()
        .setName('ai')
        .setDescription('Выводит список ИИ.')
        .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),
    async iexec(interaction, bot) {
        new Promise(res => {
            let prefixes = "Prefixes to call AI's\n```"
            for (let mod in mods) {
                if (mods[mod].name) {
                }
                prefixes += `${mods[mod].prefix} ← ${mods[mod].name}(${mods[mod].modid})\n`
            }
            prefixes += "```"
            res(prefixes)
        }).then(prefixes => {
            interaction.reply({ content: prefixes })
        })
    },
    shareThread,
    shutdown() {
        console.log("[AI] Saving data...")
        for (let mod in memories) {
            fs.writeFileSync(path.join(configpath, `/memories/${mod}_memory.json`), JSON.stringify(memories[mod]), e => { })
        }
        console.log("[AI] Data saved!")
    }
}
