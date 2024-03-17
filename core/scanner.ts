import path from "path";
import fs from "fs";

type dirScannerOptions = {
  collected: string[];
  ignoreFilters: string[];
  filter: string;
};

export function scanDirectory(directory: string, options: dirScannerOptions) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const filepath = path.join(directory, file);
    const stat = fs.lstatSync(filepath);
    if (stat.isDirectory()) {
      for (let filter of options.ignoreFilters) {
        if (file.endsWith(filter)) return;
      }
      return scanDirectory(filepath, options);
    }
    if (!file.endsWith(options.filter)) return;
    return options.collected.push(filepath);
  });
}
