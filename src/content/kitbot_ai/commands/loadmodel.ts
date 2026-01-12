import { Command } from "@sapphire/framework";
import ModelManager, { AIState } from "../modules/ai/ModelManager";

export class LoadAIModelCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("loadmodel")
        .setDescription("Load other model from list")
        .addStringOption((o) =>
          o.setName("model").setDescription("Name of model to be loaded").setRequired(true).setAutocomplete(true)
        )
        .addStringOption((o) => o.setName("quantization").setDescription("Subversion of model").setRequired(false))
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const model = interaction.options.getString("model", true);
    const quantization = interaction.options.getString("quantization");

    if (ModelManager.state == AIState.loading || ModelManager.state == AIState.thinking) {
      return interaction.reply("В данный момент нельзя загрузить новую модель.");
    }

    let model_to_load = model;
    if (quantization) {
      model_to_load += `@${quantization.toLowerCase()}`;
    }

    await ModelManager.unloadAllModels(model_to_load);
    const promise = ModelManager.loadModel(model_to_load);

    await interaction.reply(`Loading model: ${model_to_load}...`);

    // let interval: NodeJS.Timeout = setInterval(() => {
    //   if (interaction.channel?.isSendable()) {
    //     interaction.channel.sendTyping();
    //   }
    // }, 9000);

    promise.then((v) => {
      const info = ModelManager.model;
      // interval.close();
      interaction.editReply(`Model ${info.displayName}(${info.modelKey}) loaded successfully!`);
    });

    promise.catch((v) => {
      // interval.close();
      interaction.editReply(`Failed loading model: ${model_to_load}`);
    });
  }
}
