import { AttachmentBuilder } from "discord.js";

export default function (text: string, filename: string, evalOutput: string) {
  const tempText = text + "\n```" + evalOutput + "```";
  if (tempText.length > 2000)
    return {
      content: text,
      files: [
        new AttachmentBuilder(Buffer.from(evalOutput), { name: filename })
      ],
      ephemeral: true
    };
  else {
    return {
      content: tempText,
      ephemeral: true
    };
  }
}
