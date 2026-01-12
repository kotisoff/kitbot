import { PredictionResult } from "@lmstudio/sdk";

export default class AIUtils {
  static cutOffPart(text: string, max_len: number, symbol: string) {
    const uncut_part = text.slice(0, max_len).split(symbol);
    const part_end = uncut_part.pop();
    const part = uncut_part.join("\n");

    text = part_end + text.slice(max_len);

    return part;
  }

  static cutMessage(message: PredictionResult) {
    if (message.content.length <= 2000) {
      return [message];
    }

    let text = message.content;
    const parts = [];

    while (text.length > 2000) {
      if (text.includes("\n")) {
        parts.push(this.cutOffPart(text, 2000, "\n"));
      } else if (text.includes(".")) {
        parts.push(this.cutOffPart(text, 2000, "."));
      } else {
        const part = text.slice(0, 2000);
        text = text.slice(2000);
        parts.push(part);
      }
    }
    parts.push(text);

    return parts.map((v) => ({ content: v }));
  }

  static async toBase64ImageUrl(imgUrl: string): Promise<string> {
    const fetchImageUrl = await fetch(imgUrl);
    const responseArrBuffer = await fetchImageUrl.arrayBuffer();
    return Buffer.from(responseArrBuffer).toString("base64");
  }
}
