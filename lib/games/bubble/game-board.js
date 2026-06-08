/**
 * game-board.js — 棋盤初始化與格位存取
 */

const { loadGameConfig } = require('./game-config');

function getEmpty() {
  return loadGameConfig().empty || '⬛';
}

function isEmpty(cell) {
  return cell === getEmpty() || !cell;
}

function isInBounds(board, row, col) {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

function getCell(board, row, col) {
  if (!isInBounds(board, row, col)) return null;
  return board[row][col];
}

function setCell(board, row, col, value) {
  if (!isInBounds(board, row, col)) return false;
  board[row][col] = value;
  return true;
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

/** 依關卡建立二維棋盤 */
function initBoard(level) {
  const cfg = loadGameConfig();
  const lv = (cfg.levels || []).find((l) => l.level === level) || cfg.levels[0];
  const empty = getEmpty();
  const rows = cfg.rows || 8;
  const cols = cfg.cols || 7;
  const board = Array.from({ length: rows }, () => Array(cols).fill(empty));
  if (lv && lv.grid) {
    for (let r = 0; r < Math.min(rows, lv.grid.length); r++) {
      for (let c = 0; c < Math.min(cols, (lv.grid[r] || []).length); c++) {
        board[r][c] = lv.grid[r][c] || empty;
      }
    }
  }
  return board;
}

function randomBall() {
  const balls = loadGameConfig().balls || ['🔵'];
  return balls[Math.floor(Math.random() * balls.length)];
}

module.exports = {
  initBoard,
  isEmpty,
  isInBounds,
  getCell,
  setCell,
  cloneBoard,
  randomBall,
  getEmpty,
};
