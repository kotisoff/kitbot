const seedrandom = require('seedrandom');

const debug = process.argv.slice(2).includes("--debug");

const bombRng = [":stop_button:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:"];
const bomb = ":o2:";

const multiplier = 2 ** 64
const rndSeed = () => Math.floor(Math.random() * multiplier);

const Settings = () => ({ rows: 10, columns: 10, bombs: 20, seed: rndSeed() || "" });

module.exports = class {
    constructor(settings = Settings()) {
        this.updSettings(settings);
        this.generator = seedrandom(this.seed);
        this.board = this.newBoard();
        this.generateGame(settings); // could be commented.
    }
    updSettings = (settings = Settings()) => {
        const defaultSettings = Settings();
        this.rows = settings.rows || defaultSettings.rows;
        this.cols = settings.columns || defaultSettings.cols;
        this.bombs = settings.bombs || defaultSettings.bombs;
        this.seed = settings.seed || rndSeed();
    }
    random = (max) => Math.floor(this.generator.quick() * max);
    hide = (symbol = "☺") => `||${symbol}||`;
    show = (symbol = "||☺||") => symbol.replace(/\|\|/g, "");
    newBoard = () => Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => bombRng[0]));
    genBombs = () => {
        if (this.bombs > this.rows * this.cols) throw Error('bombs > rows*columns\nSet less bombs count?');
        let placed = 0;
        while (placed < this.bombs) {
            const row = this.random(this.rows);
            const col = this.random(this.cols);
            if (this.board[row][col] === bombRng[0]) {
                this.board[row][col] = bomb;
                placed += 1;
            }
        }
    }
    genCellBombRange = () => {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === bombRng[0]) {
                    let count = 0;
                    for (let i = Math.max(0, row - 1); i < Math.min(row + 2, this.rows); i++) {
                        for (let j = Math.max(0, col - 1); j < Math.min(col + 2, this.cols); j++) {
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
    }
    hideAllCells = () => this.board = this.board.map(r => r.map(i => this.hide(i)));
    randomZeroCell = () => {
        let row = this.random(this.rows);
        let col = this.random(this.cols);
        const timestamp = Date.now();
        let broken = false;
        while (this.board[row][col] != this.hide(bombRng[0])) {
            row = this.random(this.rows);
            col = this.random(this.cols);
            // Sometimes it could stuck in this while function. Usually it works less than 1 sec, so waiting for 3 should be fine.
            // Maybe I should change it to scanning, not random forcing.
            if ((Date.now() - timestamp) > 3000) {
                broken = true;
                break;
            }
        }
        return [row, col, broken];
    }
    exploreCells = (row, col) => {
        const cells = [];
        const explore = (row, col) => {
            if (this.board[row][col] === this.hide(bombRng[0]) && !cells.some(cell => cell[0] === row && cell[1] === col)) {
                cells.push([row, col]);
                const directions = [
                    [-1, 0], [1, 0], [0, -1], [0, 1],
                    [-1, -1], [-1, 1], [1, -1], [1, 1]
                ];
                for (const [dx, dy] of directions) {
                    const newRow = row + dx;
                    const newCol = col + dy;
                    if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                        explore(newRow, newCol);
                    }
                }
            }
        }
        explore(row, col);
        for (const [row, col] of cells) {
            for (let i = Math.max(0, row - 1); i < Math.min(row + 2, this.rows); i++) {
                for (let j = Math.max(0, col - 1); j < Math.min(col + 2, this.cols); j++) {
                    this.board[i][j] = this.show(this.board[i][j]);
                }
            }
        }
    }
    generateGame = (settings = Settings(), openFirstCells = true) => {
        this.updSettings(settings);
        if (debug) {
            console.log(`[MS] New Minesweeper game:\n - Columns: ${this.cols}\n - Rows: ${this.rows}\n - Bombs count: ${this.bombs}\n - Seed: ${this.seed}`)
        }
        this.board = this.newBoard();
        this.genBombs();
        this.genCellBombRange();
        this.hideAllCells();
        if (openFirstCells) {
            const [row, col, broken] = this.randomZeroCell();
            if (broken) console.warn("First cells opening timeout. Try again or using other parameters.");
            this.exploreCells(row, col);
        }
    }
    getBoard = () => this.board.map(r => r.join("")).join("\n");
    getBoardInfo = () => ({ rows: this.rows, cols: this.cols, bombs: this.bombs, seed: this.seed })
    reset = () => { this.generateGame() }
}