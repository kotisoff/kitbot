const path = require("path"), fs = require("fs");

const configDeepScan = (target, ideal) => {
    for (let p in ideal) {
        if (!target.hasOwnProperty(p)) target[p] = ideal[p];
        else if (typeof (target[p]) === "object" && !Array.isArray(target[p])) configDeepScan(target[p], ideal[p]);
    }
    for (let p in target) {
        if (!ideal.hasOwnProperty(p) && p !== "old") {
            target.old = {};
            target.old[p] = target[p];
            delete target[p];
        }
    }
}

const dirDeepScan = (dir = "./", commandFiles = [], config = {}) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stat = fs.lstatSync(filepath);
        if (stat.isFile() && file.endsWith(".js"))
            return commandFiles.push(filepath);
        else if (stat.isDirectory()) {
            for (let item of config.settings.ignoredCommandDirs) {
                if (file.endsWith(item)) return;
            }
            return dirDeepScan(filepath, commandFiles, config);
        }
    });
};

module.exports = {
    configDeepScan,
    dirDeepScan
}