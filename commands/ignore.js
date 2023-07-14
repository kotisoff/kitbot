const fs = require("fs")
const path = require("path")
const discordp = require("discord-player")
const extractor = require("@discord-player/extractor")

const files = fs.readdirSync(path.join(__dirname,"ignore")).filter(f=>f.endsWith(".js"))

module.exports = {
    package: files,
    path: "ignore",
    async shareThread(client) {}
}