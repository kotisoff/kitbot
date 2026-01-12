import { Command } from "@sapphire/framework";
import ModelManager from "../modules/ModelManager";

export class LoadAIModelCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("modelinfo").setDescription("Get information about current AI model.")
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const model = ModelManager.model;
    const client = ModelManager.client;

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
}
