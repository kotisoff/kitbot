import seedrandom from "seedrandom";
import crypto from "crypto";

const debug = process.argv.slice(2).includes("--msdebug");

const bombRng = [
  ":stop_button:",
  ":one:",
  ":two:",
  ":three:",
  ":four:",
  ":five:",
  ":six:",
  ":seven:",
  ":eight:"
];
const bomb = ":o2:";

type Settings = {
  rows: number;
  columns: number;
  bombs: number;
  seed: string;
};

export default class Minesweeper {
  generator: seedrandom.PRNG;
  settings: Settings;
  board: string[][];

  private resetSettings() {
    return {
      rows: 10,
      columns: 10,
      bombs: 20,
      seed: crypto.randomBytes(10).toString("hex")
    };
  }

  constructor(settings?: Settings) {
    this.settings = settings || this.resetSettings();

    this.generator = seedrandom(this.settings.seed.toString());
    this.board = this.newBoard();
  }

  private random = (max: number) => Math.floor(this.generator.quick() * max);

  private hide = (symbol = "☺") => `||${symbol}||`;
  private show = (symbol = "||☺||") => symbol.replace(/\|\|/g, "");

  private newBoard = () =>
    Array.from({ length: this.settings.rows }, () =>
      Array.from({ length: this.settings.columns }, () => bombRng[0])
    );

  private genBombs = () => {
    if (this.settings.bombs > this.settings.rows * this.settings.columns)
      throw Error("bombs > rows*columns\nSet less bombs count?");
    let placed = 0;
    while (placed < this.settings.bombs) {
      const row = this.random(this.settings.rows);
      const col = this.random(this.settings.columns);
      if (this.board[row][col] === bombRng[0]) {
        this.board[row][col] = bomb;
        placed += 1;
      }
    }
  };

  private genCellBombRange = () => {
    for (let row = 0; row < this.settings.rows; row++) {
      for (let col = 0; col < this.settings.columns; col++) {
        if (this.board[row][col] === bombRng[0]) {
          let count = 0;
          for (
            let i = Math.max(0, row - 1);
            i < Math.min(row + 2, this.settings.rows);
            i++
          ) {
            for (
              let j = Math.max(0, col - 1);
              j < Math.min(col + 2, this.settings.columns);
              j++
            ) {
              if (this.board[i][j] === bomb) {
                count += 1;
              }
            }
          }
          if (count > 0) {
            this.board[row][col] = bombRng[count];
          }
        }
      }
    }
  };

  private hideAllCells = () =>
    (this.board = this.board.map((r) => r.map((i) => this.hide(i))));

  private randomZeroCell(): [number, number, boolean] {
    let row = this.random(this.settings.rows);
    let col = this.random(this.settings.columns);
    const timestamp = Date.now();
    let broken = false;
    while (this.board[row][col] != this.hide(bombRng[0])) {
      row = this.random(this.settings.rows);
      col = this.random(this.settings.columns);
      // Sometimes it could stuck in this while function. Usually it works less than 1 sec, so waiting for 3 should be fine.
      // Maybe I should change it to scanning, not random forcing.
      if (Date.now() - timestamp > 3000) {
        broken = true;
        break;
      }
    }
    return [row, col, broken];
  }

  private exploreCells = (row: number, col: number) => {
    const cells: number[][] = [];
    const explore = (row: number, col: number) => {
      if (
        this.board[row][col] === this.hide(bombRng[0]) &&
        !cells.some((cell) => cell[0] === row && cell[1] === col)
      ) {
        cells.push([row, col]);
        const directions = [
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
          if (
            newRow >= 0 &&
            newRow < this.settings.rows &&
            newCol >= 0 &&
            newCol < this.settings.columns
          ) {
            explore(newRow, newCol);
          }
        }
      }
    };

    explore(row, col);

    for (const [row, col] of cells) {
      for (
        let i = Math.max(0, row - 1);
        i < Math.min(row + 2, this.settings.rows);
        i++
      ) {
        for (
          let j = Math.max(0, col - 1);
          j < Math.min(col + 2, this.settings.columns);
          j++
        ) {
          this.board[i][j] = this.show(this.board[i][j]);
        }
      }
    }
  };

  generateGame = (settings?: Partial<Settings>, openFirstCells = true) => {
    this.settings = this.resetSettings();
    if (settings?.rows && settings.rows > 0) this.settings.rows = settings.rows;
    if (settings?.columns && settings.columns > 0)
      this.settings.columns = settings.columns;
    if (settings?.bombs && settings?.bombs > 0)
      this.settings.bombs = settings.bombs;
    if (settings?.seed) this.settings.seed = settings.seed;

    if (debug) {
      console.log(
        `[MS] New Minesweeper game:\n`,
        ` - Columns: ${this.settings.columns}\n`,
        ` - Rows: ${this.settings.rows}\n`,
        ` - Bombs count: ${this.settings.bombs}\n`,
        ` - Seed: ${this.settings.seed}`
      );
    }

    this.generator = seedrandom(this.settings.seed);

    this.board = this.newBoard();
    this.genBombs();
    this.genCellBombRange();
    this.hideAllCells();
    if (openFirstCells) {
      const [row, col, broken] = this.randomZeroCell();
      if (broken)
        console.warn(
          "First cells opening timeout. Try again or using other parameters."
        );
      this.exploreCells(row, col);
    }
  };

  getBoard = () => this.board.map((r) => r.join("")).join("\n");

  getBoardInfo = () => this.settings;

  reset() {
    this.generateGame();
  }
}
