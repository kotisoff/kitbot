const fs = require("fs")
const path = require("path")

const cfgpath = path.join(__dirname,"../configs/kot.music")
if(!fs.existsSync(cfgpath)) fs.mkdirSync(cfgpath)

const files = fs.readdirSync(path.join(__dirname,"music")).filter(f=>f.endsWith(".js"))

module.exports = {
    package: files,
    path: "music"
}