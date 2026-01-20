import { ApplicationCommandRegistry } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import AIModelManager, { AIState } from "../modules/ai/ModelManager";
import AIMemory from "../modules/ai/Memory";
import { Chat } from "@lmstudio/sdk";

export default class AICommand extends Subcommand {
  constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: "ai",
      subcommands: [
        {
          name: "connect_lms",
          chatInputRun: "chatInputConnectLMS"
        },
        {
          name: "reconnect_lms",
          chatInputRun: "chatInputReconnectLMS"
        },
        {
          name: "erase_memory",
          chatInputRun: "chatInputEraseMemory"
        },
        {
          name: "model_info",
          chatInputRun: "chatInputModelInfo"
        },
        {
          name: "model_load",
          chatInputRun: "chatInputModelLoad"
        },
        {
          name: "models_unload",
          chatInputRun: "chatInputModelsUnload"
        }
      ]
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("ai")
        .setDescription("Ai commands")
        .addSubcommand((cmd) =>
          cmd
            .setName("connect_lms")
            .setDescription("Connect to LMStudio.")
            .addStringOption((o) =>
              o.setName("baseurl").setDescription("LM Studio Base URL").setRequired(true).setAutocomplete(true)
            )
        )
        .addSubcommand((cmd) => cmd.setName("reconnect_lms").setDescription("Reconnect to LMStudio."))
        .addSubcommand((cmd) => cmd.setName("erase_memory").setDescription("Erase AI memory."))
        .addSubcommand((cmd) => cmd.setName("model_info").setDescription("Get information about current AI model."))
        .addSubcommand((cmd) =>
          cmd
            .setName("model_load")
            .setDescription("Load other model from list")
            .addStringOption((o) =>
              o.setName("model").setDescription("Name of model to be loaded").setRequired(true).setAutocomplete(true)
            )
            .addStringOption((o) => o.setName("quantization").setDescription("Subversion of model").setRequired(false))
        )
        .addSubcommand((cmd) => cmd.setName("models_unload").setDescription("Unload all loaded models."))
    );
  }

  async chatInputConnectLMS(interaction: Subcommand.ChatInputCommandInteraction) {
    let baseUrl = interaction.options.getString("baseurl", true);

    if (baseUrl.startsWith("saved:")) {
      const server = AIModelManager.config.servers[baseUrl.slice("saved:".length)] as string;
      if (!server) {
        return interaction.reply({ content: "Такого сервера нет в сохранённых вариантах.", flags: ["Ephemeral"] });
      }

      baseUrl = server;
    }

    await interaction.reply({
      content: "Идёт попытка подключения...",
      flags: ["Ephemeral"]
    });

    const status = await AIModelManager.connectClient({ baseUrl });

    if (status) {
      const version = await AIModelManager.client.system.getLMStudioVersion();
      interaction.editReply({ content: `Подключено к LM Studio v${version.version}` });
    } else {
      interaction.editReply({ content: "Не удалось подключиться к указанному хосту." });
    }
  }

  async chatInputReconnectLMS(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.reply({
      content: "Идёт попытка переподключения.."
    });

    const status = await AIModelManager.connectClient(undefined, false);

    if (status) {
      const version = await AIModelManager.client.system.getLMStudioVersion();
      interaction.editReply({ content: `Переподключено к LM Studio v${version.version}` });
    } else {
      interaction.editReply({ content: "Не удалось переподключиться к указанному хосту." });
    }
  }

  async chatInputEraseMemory(interaction: Subcommand.ChatInputCommandInteraction) {
    const system_prompt = AIMemory.chat.getMessagesArray().shift();
    AIMemory.chat = Chat.empty();

    if (system_prompt) {
      AIMemory.chat.append(system_prompt);
    }

    interaction.reply("Память очищена.");
  }

  async chatInputModelInfo(interaction: Subcommand.ChatInputCommandInteraction) {
    const model = AIModelManager.model;
    const client = AIModelManager.client;

    if (model) {
      const info = await model.getModelInfo();

      interaction.reply(
        [
          "Текущая модель:",
          `${info.displayName} (${info.modelKey})`,
          `Архитектура: ${info.architecture ?? "неизвестно"}`,
          `Квантизация: ${info.quantization?.name ?? "неизвестно"}`,
          `Размер: ${info.sizeBytes} байт`,
          `Возможности: ${info.vision ? "👁️ " : ""}${info.trainedForToolUse ? "⚙️" : ""}`,
          `Размер контекста: ${info.contextLength}/${info.maxContextLength} токенов`,
          `LM Studio v${(await client.system.getLMStudioVersion()).version}`
        ].join("\n")
      );
    } else {
      interaction.reply("В данный момент никакая модель не загружена.");
    }
  }

  async chatInputModelLoad(interaction: Subcommand.ChatInputCommandInteraction) {
    const model = interaction.options.getString("model", true);
    const quantization = interaction.options.getString("quantization");

    if (AIModelManager.state == AIState.loading || AIModelManager.state == AIState.thinking) {
      return interaction.reply("В данный момент нельзя загрузить новую модель.");
    }

    let model_to_load = model;
    if (quantization) {
      model_to_load += `@${quantization.toLowerCase()}`;
    }

    await AIModelManager.unloadAllModels(model_to_load);
    const promise = AIModelManager.loadModel(model_to_load);

    await interaction.reply(`Loading model: ${model_to_load}...`);

    // let interval: NodeJS.Timeout = setInterval(() => {
    //   if (interaction.channel?.isSendable()) {
    //     interaction.channel.sendTyping();
    //   }
    // }, 9000);

    promise.then((v) => {
      const info = AIModelManager.model;
      // interval.close();
      interaction.editReply(`Model ${info.displayName}(${info.modelKey}) loaded successfully!`);
    });

    promise.catch((v) => {
      // interval.close();
      interaction.editReply(`Failed loading model: ${model_to_load}`);
    });
  }

  async chatInputModelsUnload(interaction: Subcommand.ChatInputCommandInteraction) {
    const models = await AIModelManager.client.llm.listLoaded();

    if (models.length > 0) {
      AIModelManager.unloadAllModels();
      interaction.reply("Все модели выгружены.");
    } else {
      interaction.reply("В данный момент никакая модель не загружена.");
    }
  }
}
