import { ApplicationCommandRegistry, Awaitable, ChatInputCommand, Command } from "@sapphire/framework";
import { ActionRowBuilder, AttachmentBuilder, ChatInputCommandInteraction } from "discord.js";
import Minesweeper, { Settings } from "../modules/Minesweeper";

export class MinesweeperCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, aliases: ["ms"], description: "Generates minesweeper game board." });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("minesweeper")
        .setDescription("Generates minesweeper game board.")
        .addNumberOption((o) => o.setName("rows").setDescription("Board rows count.").setRequired(true))
        .addNumberOption((o) => o.setName("columns").setDescription("Board columns count.").setRequired(true))
        .addNumberOption((o) => o.setName("bombs").setDescription("Bombs count.").setRequired(true))
        .addStringOption((o) => o.setName("seed").setDescription("Board seed.").setRequired(true))
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction, context: ChatInputCommand.RunContext) {
    const opts = interaction.options;

    const settings: {
      size: [number, number];
      bombs: number;
      seed?: string;
    } = {
      size: [opts.getNumber("rows", true), opts.getNumber("columns", true)],
      bombs: opts.getNumber("bombs", true)
    };

    const seed = interaction.options.getString("seed");

    if (seed) {
      settings.seed = seed;
    }

    const board = Minesweeper.generateGame(settings);

    const boardInfo = `Minesweeper (kitbot_minesweeper)\nrequested: ${interaction.user.username}`;
    Object.entries(board.settings)
      .map((v) => v.join(": "))
      .join("\n");

    const msg = boardInfo + "\n" + board.toString();

    if (msg.length > 2000) {
      interaction.reply({
        content: boardInfo,
        files: [
          new AttachmentBuilder(Buffer.from(board.toString(), "utf-8"), {
            name: "board.txt"
          })
        ]
      });
    } else {
      interaction.reply(msg);
    }
  }
}
