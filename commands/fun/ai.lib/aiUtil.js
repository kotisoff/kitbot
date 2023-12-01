const { OpenAI } = require("openai");
const { getConfig, getMods, getMemory, saveAll, writeProfiles, setLogger } = require("./datamgr");

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

const getStaticAnswer = async (Completion = { choices: [{ message: { content: "", role: "" } }] }) => {
    const resultmsg = await Completion.choices[0].message;
    let content = resultmsg.content;
    const role = resultmsg.role;
    return { content: splitByLength(content, 2000), role };
};

const sendMessage = async (message = "") => {

}

module.exports = {
    chat: {
        sendMessage
    }
}