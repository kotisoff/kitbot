const fs = require("fs")
const path = require("path")

const files = fs.readdirSync(path.join(__dirname,"music")).filter(f=>f.endsWith(".js"))

module.exports = {
    package: files,
    path: "music"
}