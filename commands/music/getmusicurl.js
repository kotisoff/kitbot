const { Command } = require("../../utils");
const ymapi = require("ym-api-meowed");

const Api = new ymapi.YMApi();
const wrapper = new ymapi.WrappedYMApi(Api);

const getmusicurl = new Command("getmusicurl", "GMU", { prefix: true });

getmusicurl.prefixCommandInfo.setShortName("gmu").setRuName("ссылканапесню").setShortRuName("снп");

const { user } = getmusicurl.setCustomConfigName("yaconfig.json").getConfig("kot.music").config;
Api.init(user);

getmusicurl.setPrefixAction(async (m, b) => {
    const args = m.content.split(" ").slice(1);
    if (!args[0]) return m.channel.send("Введите название айди/ссылку на неё!\nПример: 'gmu https://music.yandex.ru/album/xxxxxx/track/xxxxxxx");
    else {
        let trackid = parseInt(args[0].split("/track/")[1]);
        if (!trackid) trackid = (parseInt(args[0]).toString() == args[0]) ? parseInt(args[0]) : undefined;
        if (!trackid) return m.channel.send("Входные данные не соответствуют ссылке/айди песни.");
        const track = await wrapper.getMp3DownloadUrl(trackid, true);
        m.channel.send(`Вот ваша ссылка: [**_Тык_**](${track})`);
        getmusicurl.logger.info(`TrackID: ${trackid}; Link: ${track}`.gray);
    }
});

module.exports = getmusicurl