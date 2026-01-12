import { Command } from "@sapphire/framework";
import AIMemory from "../modules/Memory";
import { Chat } from "@lmstudio/sdk";

export class EraseAIMemoryCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => builder.setName("erasememory").setDescription("Erase AI memory."));
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const system_prompt = AIMemory.chat.getMessagesArray().shift();
    AIMemory.chat = Chat.empty();

    if (system_prompt) {
      AIMemory.chat.append(system_prompt);
    }

    interaction.reply("Память очищена.");
  }
}
