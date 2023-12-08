const { OpenAI } = require("openai");
const { getConfig, getMods, getMemory, saveAll, writeProfiles, setLogger, getMod } = require("./aiDataMgr");

const { config, profiles } = getConfig;

const ai = new OpenAI({
    apiKey: config.api.key,
    baseURL: config.api.url
});

const splitByLength = (string = "", len = 1) => {
    const a = string.length / len;
    if (a > a | 0) a++;
    const temp = [];
    let tmpstr = string;
    for (let i = 0; i < a; i++) {
        temp.push(tmpstr.slice(0, len));
        tmpstr = tmpstr.substring(len);
    }
    return temp;
}

const getChatResponse = async (modid) => {
    const mod = getMod(modid);
    const memory = getMemory(modid);
    const Response = ai.chat.completions.create({
        model: mod.ai_settings.model,
        messages: memory.ai_system.concat(memory.ai_messages),
        temperature: target.ai_settings.temperature,
        n: 1,
        user: msg.author.id,
        stream: config.options.ai_stream,
        stop: ["стой", "стоп", "остановись", "stop"]
    })
}

const chatSendMessage = async (message = "", modid = "kotisoff:main") => {
}

module.exports = {
    chat: {
    }
}