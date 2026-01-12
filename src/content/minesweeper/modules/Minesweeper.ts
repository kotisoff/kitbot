import seedrandom from "seedrandom";
import crypto from "crypto";

function generate_seed() {
  return crypto.randomBytes(10).toString("hex");
}

export class Settings {
  get rows() {
    return this.size[1];
  }

  get columns() {
    return this.size[0];
  }

  constructor(
    public bombs: number = 20,
    public size: [number, number] = [10, 10],
    public seed: string = generate_seed()
  ) {}

  static import(settings?: Partial<Settings>) {
    if (settings) {
      return new Settings(settings.bombs, settings.size, settings.seed);
    }

    return new Settings();
  }
}

export class Board {
  map: string[][];

  constructor(public settings: Settings) {
    this.map = Array.from({ length: settings.rows }, () =>
      Array.from({ length: settings.columns }, () => Minesweeper.bomb_range[0])
    ) as string[][];
  }

  get(row: number, col: number) {
    return this.map[row]?.[col] as string;
  }

  set(row: number, col: number, sym?: string) {
    if (!this.map[row]) {
      this.map[row] = [];
    }

    this.map[row][col] = sym ?? (Minesweeper.bomb_range[0] as string);
  }

  private hide(symbol = "☺") {
    return `||${symbol}||`;
  }

  private show(symbol = "||☺||") {
    return symbol.replace(/\|\|/g, "");
  }

  hideAt(row: number, col: number) {
    this.set(row, col, this.hide(this.get(row, col)));
  }

  showAt(row: number, col: number) {
    this.set(row, col, this.show(this.get(row, col)));
  }

  hideAllCells() {
    this.map = this.map.map((r) => r.map((i) => this.hide(i)));
  }

  toString() {
    return this.map.map((r) => r.join("")).join("\n");
  }
}

export default class Minesweeper {
  private static generator: seedrandom.PRNG = seedrandom();

  static bomb = ":o2:";
  static bomb_range = [":stop_button:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:"];

  private static random = (max: number) => Math.floor(this.generator.quick() * max);

  private static hide(symbol = "☺") {
    return `||${symbol}||`;
  }

  private static genBombs = (settings: Settings, board: Board) => {
    if (settings.bombs > settings.size.reduce((a, b) => a * b)) {
      throw Error("bombs > rows*columns\nSet less bombs count?");
    }

    this.generator = seedrandom(settings.seed);

    let placed = 0;
    while (placed < settings.bombs) {
      const col = this.random(settings.columns);
      const row = this.random(settings.rows);

      if (board.get(row, col) === this.bomb_range[0]) {
        board.set(row, col, this.bomb);
        placed += 1;
      }
    }
  };

  private static genCellBombRange(settings: Settings, board: Board) {
    for (let row = 0; row < settings.rows; row++) {
      for (let col = 0; col < settings.columns; col++) {
        if (board.get(row, col) === this.bomb_range[0]) {
          let count = 0;

          for (let i = Math.max(0, row - 1); i < Math.min(row + 2, settings.rows); i++) {
            for (let j = Math.max(0, col - 1); j < Math.min(col + 2, settings.columns); j++) {
              if (board.get(i, j) === this.bomb) {
                count += 1;
              }
            }
          }

          if (count > 0) {
            board.set(row, col, this.bomb_range[count]);
          }
        }
      }
    }
  }

  private static randomZeroCell(settings: Settings, board: Board): [number, number, boolean] {
    let row = this.random(settings.rows);
    let col = this.random(settings.columns);
    const timestamp = Date.now();
    let broken = false;
    while (board.get(row, col) != this.hide(this.bomb_range[0])) {
      row = this.random(settings.rows);
      col = this.random(settings.columns);
      // Sometimes it could stuck in this while function. Usually it works less than 1 sec, so waiting for 3 should be fine.
      // Maybe I should change it to scanning, not random forcing.
      if (Date.now() - timestamp > 3000) {
        broken = true;
        break;
      }
    }
    return [row, col, broken];
  }

  private static exploreCells = (row: number, col: number, settings: Settings, board: Board) => {
    const cells: [number, number][] = [];
    const explore = (row: number, col: number) => {
      if (
        board.get(row, col) === this.hide(this.bomb_range[0]) &&
        !cells.some((cell) => cell[0] === row && cell[1] === col)
      ) {
        cells.push([row, col]);
        const directions: [number, number][] = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1]
        ];
        for (const [dx, dy] of directions) {
          const newRow = row + dx;
          const newCol = col + dy;
          if (newRow >= 0 && newRow < settings.rows && newCol >= 0 && newCol < settings.columns) {
            explore(newRow, newCol);
          }
        }
      }
    };

    explore(row, col);

    for (const [row, col] of cells) {
      for (let i = Math.max(0, row - 1); i < Math.min(row + 2, settings.rows); i++) {
        for (let j = Math.max(0, col - 1); j < Math.min(col + 2, settings.columns); j++) {
          board.showAt(i, j);
        }
      }
    }
  };

  static generateGame(input_settings?: Partial<Settings>, openFirstCells = true) {
    const settings = Settings.import(input_settings);

    // if (debug) {
    //   console.log(
    //     `[MS] New Minesweeper game:\n`,
    //     ` - Columns: ${this.settings.columns}\n`,
    //     ` - Rows: ${this.settings.rows}\n`,
    //     ` - Bombs count: ${this.settings.bombs}\n`,
    //     ` - Seed: ${this.settings.seed}`
    //   );
    // }

    this.generator = seedrandom(settings.seed);

    const board = new Board(settings);
    this.genBombs(settings, board);
    this.genCellBombRange(settings, board);
    board.hideAllCells();

    if (openFirstCells) {
      const [row, col, broken] = this.randomZeroCell(settings, board);
      if (broken) console.warn("First cells opening timeout. Try again or using other parameters.");

      this.exploreCells(row, col, settings, board);
    }

    return board;
  }
}
