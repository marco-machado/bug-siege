import { GRID } from '../config/GameConfig.js';

export class Grid {
  constructor() {
    this.cols = GRID.cols;
    this.rows = GRID.rows;
    this.tileSize = GRID.tileSize;
    this.offsetX = GRID.offsetX;
    this.offsetY = GRID.offsetY;

    this.cells = [];
    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c] = 'empty';
      }
    }

    this.cells[GRID.coreRow][GRID.coreCol] = 'core';

    for (const s of GRID.starterTurrets) {
      this.cells[s.row][s.col] = 'turret';
    }
  }

  gridToWorld(col, row) {
    return {
      x: this.offsetX + col * this.tileSize + this.tileSize / 2,
      y: this.offsetY + row * this.tileSize + this.tileSize / 2,
    };
  }

  worldToGrid(wx, wy) {
    const col = Math.floor((wx - this.offsetX) / this.tileSize);
    const row = Math.floor((wy - this.offsetY) / this.tileSize);
    return { col, row };
  }

  isInBounds(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  getCell(col, row) {
    if (!this.isInBounds(col, row)) return null;
    return this.cells[row][col];
  }

  setCell(col, row, state) {
    if (!this.isInBounds(col, row)) return;
    this.cells[row][col] = state;
  }

  canPlace(col, row) {
    return this.isInBounds(col, row) && this.cells[row][col] === 'empty';
  }

  getCoreWorldPos() {
    return this.gridToWorld(GRID.coreCol, GRID.coreRow);
  }
}
