const fs = require("fs")
const path = require("path")

const objectFromArray = (keys, values) => {
    if (keys.length != values.length) { throw new Error("keys != values") };
    const Object = {}
    keys.forEach((v, i) => {
        Object[v] = values[i];
    })
    return Object
}

const keys = fs.readdirSync(path.join(__dirname, "../lang")).filter(f => f.endsWith(".lang"));
const values = keys.map(f => fs.readFileSync(path.join(__dirname, "../lang", f)).toString("utf-8").split("\r\n"));
const lang = objectFromArray(keys.map(f => f.slice(0, f.indexOf(".lang"))), values);
console.log(lang)