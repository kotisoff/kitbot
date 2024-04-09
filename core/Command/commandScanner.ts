import Command from ".";
import { scanDirectory } from "../Utils/scannerUtils";

export default function scanCommandFiles(
  directory: string,
  ignoredCommandDirs: string[]
): Command[] {
  const files = scanDirectory(directory, {
    ignoreFilters: ignoredCommandDirs,
    extensionFilters: [".js"]
  });
  const commands = files
    .map((file) => {
      try {
        return new (require(file).default)();
      } catch (e) {
        console.log(e, file);
      }
    })
    .filter((v) => v);
  return commands;
}
