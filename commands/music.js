const fs = require("fs")
const path = require("path")
const discordp = require("discord-player")
const extractor = require("@discord-player/extractor")
const ymext = require("discord-player-yandexmusic")

const cfgpath = path.join(__dirname,"../configs/kot.music")
if(!fs.existsSync(cfgpath)) fs.mkdirSync(cfgpath)

//  Configs

/** @param {String} filepath @param {Boolean} hide*/
function fileimport(filepath, replacedata, hide) {
    filename = path.basename(filepath)
    if (!hide) console.log("[YaMusic2]", ('Importing ' + filename + '...').gray)
    try { require(filepath) } catch { fs.writeFileSync(filepath, JSON.stringify(replacedata)) }
    return require(filepath)
}
const config = fileimport(path.join(__dirname, "../configs/kot.music/yaconfig.json"),
    {
        user: {
            access_token: "yourAuthToken",
            uid: "yourUid_ItShouldBeANumber"
        }
    }
)

const files = fs.readdirSync(path.join(__dirname,"music")).filter(f=>f.endsWith(".js"))

module.exports = {
    package: files,
    path: "music",
    async shareThread(client) {
        const player = discordp.Player.singleton(client)
        await player.extractors.register(extractor.AttachmentExtractor);
        await player.extractors.register(ymext.YandexMusicExtractor,config.user);
        // await player.extractors.register(extractor.SoundCloudExtractor);
        await player.extractors.register(extractor.YouTubeExtractor);
    }
}