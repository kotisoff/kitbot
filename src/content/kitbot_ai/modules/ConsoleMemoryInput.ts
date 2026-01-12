import { createInterface } from "readline";
import AIMemory from "./Memory";

const rl = createInterface(process.stdin, process.stdout);
rl.setPrompt("");
rl.resume();

rl.on("line", function (input) {
  process.stdout.moveCursor(0, -1);
  process.stdout.cursorTo(0);
  process.stdout.clearLine(0);
  if (input) {
    AIMemory.chat.append("system", input);
    console.log(`Добавлено сообщение: "${input}" в память от роли system`);
  }
});
