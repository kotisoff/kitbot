const fs = require("fs")
const path = require("path")
const discordp = require("discord-player")
const extractor = require("@discord-player/extractor")

const cfgpath = path.join(__dirname,"../configs/kot.music")
if(!fs.existsSync(cfgpath)) fs.mkdirSync(cfgpath)

const files = fs.readdirSync(path.join(__dirname,"music")).filter(f=>f.endsWith(".js"))

module.exports = {
    package: files,
    path: "music",
    async shareThread(client) {
        const player = discordp.Player.singleton(client)
        await player.extractors.register(extractor.AttachmentExtractor);
        // await player.extractors.register(extractor.SoundCloudExtractor);
        await player.extractors.register(extractor.YouTubeExtractor);
    }
}