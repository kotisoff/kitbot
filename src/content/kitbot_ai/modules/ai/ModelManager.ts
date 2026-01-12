import { LLM, LLMActionOpts, LLMRespondOpts, LMStudioClient, LMStudioClientConstructorOpts } from "@lmstudio/sdk";
import ContentHandler, { ContentPack } from "../../../../core/ContentHandler";
import { promisify } from "node:util";
import { stat } from "node:fs";

export enum AIState {
  "not_loaded",
  "loading",
  "idle",
  "thinking"
}

const pack = ContentHandler.contentPacks.get("kitbot_ai") as ContentPack;
const config = { baseUrl: "ws://127.0.0.1:1234" };
// const config = pack.loadConfig("config.json", { baseUrl: "ws://127.0.0.1:1234" });

export default class AIModelManager {
  static client: LMStudioClient = new LMStudioClient(config);
  static model: LLM;
  static controller: AbortController = new AbortController();

  static state: AIState = AIState.not_loaded;

  static settings = {
    model: "",
    options: {
      maxTokens: 1000,
      signal: this.controller.signal,
      allowParallelToolExecution: true
    } as LLMRespondOpts & LLMActionOpts
  };

  static stop(reason: string) {
    this.controller.abort(reason);

    this.controller = new AbortController();
    this.settings.options.signal = this.controller.signal;
  }

  static async loadModel(model: string = this.settings.model) {
    if (!model) {
      console.log("Model is not defined. Canceled.");
      return false;
    }
    const promise = this.client.llm.model(model);
    this.state = AIState.loading;

    this.model = await promise;
    this.state = AIState.idle;

    return true;
  }

  static async unloadAllModels(except?: string) {
    const llms = await this.client.llm.listLoaded();
    for (const llm of llms) {
      if (llm.modelKey == except) continue;
      await llm.unload();
    }
    this.state = AIState.not_loaded;
  }

  static async listModels() {
    const list = await this.client.system.listDownloadedModels();
    return list;
  }

  static async connectClient(options: LMStudioClientConstructorOpts = config, unload_on_connection: boolean = true) {
    try {
      const client = new LMStudioClient(options);
      return client.system
        .getLMStudioVersion()
        .then(() => {
          if (unload_on_connection) this.unloadAllModels();
          this.client = client;
          return true;
        })
        .catch(() => {
          console.log("Connection to LM Studio server failed.");
          return false;
        });
    } catch (e: any) {
      console.log(e?.message);
      return false;
    }
  }
}
