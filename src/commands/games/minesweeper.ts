import {
  Message,
  CommandInteraction,
  CacheType,
  AttachmentBuilder
} from "discord.js";
import Command from "../../core/Command";
import CommandOptions from "../../core/Command/CommandOptions";
import CustomClient from "../../core/CustomClient";
import Minesweeper from "./libs/MineSweeper";

export default class MinesweeperCommand extends Command {
  constructor() {
    super(
      new CommandOptions("minesweeper")
        .setName("Minesweeper")
        .setType({ prefix: true })
    );

    this.slashCommandInfo
      .setDescription("Generates minesweeper game board.")
      .addNumberOption((o) =>
        o.setName("rows").setDescription("Board rows count.").setRequired(true)
      )
      .addNumberOption((o) =>
        o
          .setName("columns")
          .setDescription("Board columns count.")
          .setRequired(true)
      )
      .addNumberOption((o) =>
        o.setName("bombs").setDescription("Bombs count.").setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("seed").setDescription("Board seed.").setRequired(true)
      );

    this.prefixCommandInfo.addAlias("ms");
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const ms = new Minesweeper();
    try {
      ms.generateGame({
        rows: Number(args.shift() as string) ?? 10,
        columns: Number(args.shift() as string) ?? 10,
        bombs: Number(args.shift() as string) ?? 20,
        seed: args.join(" ")
      });
    } catch (e) {
      this.logger.error(e);
    }

    const boardInfo = Object.entries(ms.getBoardInfo())
      .map((v) => v.join(": "))
      .join("\n");
    const board = ms.getBoard();

    const msg = boardInfo + "\n" + board;
    if (msg.length > 2000)
      message.reply({
        content: boardInfo,
        files: [
          new AttachmentBuilder(Buffer.from(board, "utf-8"), {
            name: "ms.txt"
          })
        ]
      });
    else message.reply(msg);
  }
}
