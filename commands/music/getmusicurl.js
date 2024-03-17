const Command = require("../../core/Command");
const getMusicUrl = require("./getMusicUrl.lib")
const providers = require("./getMusicUrl.lib/providers/index")

const api = new getMusicUrl();

const getmusicurl = new Command("getmusicurl", "GMU", {
  prefix: true,
  slash: true
});

getmusicurl.prefixCommandInfo
  .setShortName("gmu")
  .setRuName("ссылканапесню")
  .setShortRuName("снп");

getmusicurl.slashCommandInfo
  .setDescription("Gets direct track url from yandex music.")
  .addStringOption((o) =>
    o.setName("argument").setDescription("Track id or Url").setRequired(true)
  );

const config = getmusicurl
  .setCustomConfigName("yaconfig.json")
  .getConfig("kot.music").config;
if (!config.user) {
  config.user = {
    access_token: "example",
    uid: 0
  };
  getmusicurl.writeConfig(config);
  getmusicurl.logger.error(
    "Enter data in config (configs/kot.music/yaconfig.json)"
  );
}
const user = config.user;
api.addProviders(new providers.YMProvider(user));

const action = async (msg, argument) => {
  msg.channel.sendTyping();
  if (!argument)
    return msg.reply(
      "Введите название айди/ссылку на неё!\nПример: 'gmu https://music.yandex.ru/album/xxxxxx/track/xxxxxxx"
    );
  else {
    let url;
    try{
      url = await api.getDirectLink(argument);
    }
    catch(e){
      return msg.reply(e);
    }
    msg.reply(`Вот ваша ссылка: [**_Тык_**](<${url}>)`);
    getmusicurl.logger.info(`Query: "${argument}";, URL: ${url}`.gray);
  }
};

getmusicurl.setPrefixAction(async (m, b) => {
  const args = m.content.split(" ").slice(1);
  action(m, args[0]);
});

getmusicurl.setSlashAction(async (i, b) => {
  const args = i.options.getString("argument");
  action(i, args);
});

module.exports = getmusicurl;
