import { Command } from "@sapphire/framework";
import AIModelManager from "../modules/ModelManager";

export class ConnectLMStudioCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("reconnect").setDescription("Reconnect to LMStudio.")
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
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
}
