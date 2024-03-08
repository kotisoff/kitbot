const path = require("path"),
  fs = require("fs");

const configDeepScan = (target, ideal) => {
  for (let p in ideal) {
    if (!target.hasOwnProperty(p)) target[p] = ideal[p];
    else if (typeof target[p] === "object" && !Array.isArray(target[p]))
      configDeepScan(target[p], ideal[p]);
  }
  for (let p in target) {
    if (!ideal.hasOwnProperty(p) && p !== "old") {
      target.old = {};
      target.old[p] = target[p];
      delete target[p];
    }
  }
};

const dirDeepScan = (
  dir = "./",
  { collected = [], ignoredDirs = [], fileExtension = "" }
) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.lstatSync(filepath);
    if (stat.isFile()) {
      if (!file.endsWith(fileExtension)) return;
      return collected.push(filepath);
    } else {
      for (let item of ignoredDirs) {
        if (file.endsWith(item)) return;
      }
      return dirDeepScan(filepath, { collected, ignoredDirs, fileExtension });
    }
  });
};

module.exports = {
  configDeepScan,
  dirDeepScan
};
