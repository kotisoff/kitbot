import { PredictionResult } from "@lmstudio/sdk";
import { Message } from "discord.js";
import Memory from "./Memory";
import ModelManager, { AIState } from "./ModelManager";
import tools from "./Tools";

export default class AIConversation {
  static async send(message: Message) {
    await Memory.addDiscordMessage(message);

    ModelManager.state = AIState.thinking;

    let response: PredictionResult | undefined;

    if (ModelManager.model.trainedForToolUse) {
      await ModelManager.model
        .act(Memory.chat, tools, {
          ...ModelManager.settings.options,

          onPredictionCompleted(predictionResult) {
            response = predictionResult;
            Memory.addMessage(response);
          },
          onToolCallRequestFailure(roundIndex, callId, error) {
            console.log(error);
          },
          onToolCallRequestNameReceived(roundIndex, callId, name) {
            console.log("Calling tool", name);
          }
        })
        .catch((e) => {
          console.log("generation stoped:", e);
          // console.log("generation stoped by user");
        });
    } else {
      response = await ModelManager.model
        .respond(Memory.chat, {
          ...ModelManager.settings.options
        })
        .catch((e) => {
          console.log("generation stoped:", e);
          // console.log("generation stoped by user");
          return e;
        });
    }

    ModelManager.state = AIState.idle;

    if (response?.content) {
      return response;
    }
  }
}
