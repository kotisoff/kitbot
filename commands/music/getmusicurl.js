const Command = require("../../utils/Command");
const ymapi = require("ym-api-meowed");

const Api = new ymapi.YMApi();
const wrapper = new ymapi.WrappedYMApi(Api);

const getmusicurl = new Command("getmusicurl", "GMU", { prefix: true, slash: true });

getmusicurl.prefixCommandInfo.setShortName("gmu").setRuName("ссылканапесню").setShortRuName("снп");

getmusicurl.slashCommandInfo.setDescription("Gets direct track url from yandex music.").addStringOption(o =>
    o.setName("argument")
        .setDescription("Track id or Url")
        .setRequired(true)
);

const config = getmusicurl.setCustomConfigName("yaconfig.json").getConfig("kot.music").config;
if (!config.user) {
    config.user = {
        access_token: "example",
        uid: 0
    }
    getmusicurl.writeConfig(config);
    getmusicurl.logger.error("Enter data in config (configs/kot.music/yaconfig.json)");
}
const user = config.user
Api.init(user);

const action = async (msg, argument) => {
    msg.channel.sendTyping();
    if (!argument) return msg.reply("Введите название айди/ссылку на неё!\nПример: 'gmu https://music.yandex.ru/album/xxxxxx/track/xxxxxxx");
    else {
        let trackid = parseInt(argument.split("/track/")[1]);
        if (!trackid) trackid = (parseInt(argument).toString() == argument) ? parseInt(argument) : undefined;
        if (!trackid) return msg.reply("Входные данные не соответствуют ссылке/айди песни.");
        const track = await wrapper.getMp3DownloadUrl(trackid, true);
        msg.reply(`Вот ваша ссылка: [**_Тык_**](${track})`);
        getmusicurl.logger.info(`TrackID: ${trackid}; Link: ${track}`.gray);
    }
}

getmusicurl.setPrefixAction(async (m, b) => {
    const args = m.content.split(" ").slice(1);
    action(m, args[0]);
});

getmusicurl.setSlashAction(async (i, b) => {
    const args = i.options.getString("argument");
    action(i, args);
})

module.exports = getmusicurl