import { Command } from "@sapphire/framework";
import ModelManager from "../modules/ModelManager";

export class UnloadAIModelCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("unloadmodels").setDescription("Unload all loaded models.")
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const models = await ModelManager.client.llm.listLoaded();

    if (models.length > 0) {
      ModelManager.unloadAllModels();
      interaction.reply("Все модели выгружены.");
    } else {
      interaction.reply("В данный момент никакая модель не загружена.");
    }
  }
}
