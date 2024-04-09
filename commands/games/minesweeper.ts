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
  }

  async run(
    message: CommandInteraction<CacheType> | Message<boolean>,
    args: string[],
    client: CustomClient
  ): Promise<any> {
    const ms = new Minesweeper();
    ms.generateGame({
      rows: parseInt(args[0]) ?? 10,
      columns: parseInt(args[1]) ?? 10,
      bombs: parseInt(args[2]) ?? 20,
      seed: args[3]
    });

    const msg = JSON.stringify(ms.getBoardInfo()) + "\n" + ms.getBoard();
    if (msg.length > 2000)
      message.reply({
        content: JSON.stringify(ms.getBoardInfo()),
        files: [
          new AttachmentBuilder(Buffer.from(ms.getBoard(), "utf-8"), {
            name: "ms.txt"
          })
        ]
      });
    else message.reply(msg);
  }
}
