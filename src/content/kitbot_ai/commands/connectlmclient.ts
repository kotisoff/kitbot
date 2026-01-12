import { Command } from "@sapphire/framework";
import AIModelManager from "../modules/ai/ModelManager";

export class ConnectLMStudioCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("connectlmstudio")
        .setDescription("Connect to LMStudio.")
        .addStringOption((o) => o.setName("baseurl").setDescription("LM Studio Base URL").setRequired(true))
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const baseUrl = interaction.options.getString("baseurl", true);

    await interaction.reply({
      content: "Идёт попытка подключения...\n-# Если это сообщение не изменилось, то хост недоступен.",
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
}
