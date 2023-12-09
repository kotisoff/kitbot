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
        messages: memory.messages,
        temperature: mod.ai_settings.temperature,
        n: 1,
        user: msg.author.id,
        stream: config.options.ai_stream,
        stop: mod.ai_settings.stop,
        tools: mod.ai_settings.tools
    })
    return Response;
}

const chatSendMessage = async (message = "", modid = "kotisoff:main") => {
    const message = {
        role: "user",
        content: message
    }
    getMemory(modid).messages.push()
}

module.exports = {
    chat: {
    }
}