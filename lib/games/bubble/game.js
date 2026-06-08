/**
 * game.js — 遊戲狀態 API（純邏輯）
 */

const { loadGameConfig } = require('./game-config');
const { initBoard, randomBall, isEmpty } = require('./game-board');
const { findLandingCell } = require('./game-physics');
const { removeAndScore, applyGravity } = require('./game-match');

function initGame(level) {
  const cfg = loadGameConfig();
  const cols = cfg.cols || 7;
  return {
    active: true,
    level: level || 1,
    score: 0,
    pointer: Math.floor(cols / 2),
    angleIndex: Math.floor(((loadGameConfig().angles || []).length - 1) / 2) || 1,
    currentBall: randomBall(),
    nextBall: randomBall(),
    board: initBoard(level || 1),
    gameOver: false,
  };
}

function aim(state, direction) {
  const angles = loadGameConfig().angles || [{ dx: 0, dy: -1 }];
  const max = angles.length - 1;
  if (direction === 'left') {
    state.angleIndex = Math.max(0, state.angleIndex - 1);
  } else if (direction === 'right') {
    state.angleIndex = Math.min(max, state.angleIndex + 1);
  }
  return state;
}

function fire(state) {
  if (!state.active || state.gameOver) return { state, placed: false };
  const land = findLandingCell(state.board, state.pointer, state.angleIndex);
  if (!land) {
    state.gameOver = true;
    state.active = false;
    return { state, placed: false };
  }
  state.board[land.row][land.col] = state.currentBall;
  state.score += removeAndScore(state.board);
  applyGravity(state.board);
  state.currentBall = state.nextBall;
  state.nextBall = randomBall();
  if (isBottomRowFull(state.board)) {
    state.gameOver = true;
    state.active = false;
  }
  return { state, placed: true, land };
}

function isBottomRowFull(board) {
  const last = board[board.length - 1];
  return last.every((c) => !isEmpty(c));
}

function isGameOver(state) {
  return !!state.gameOver || !state.active;
}

module.exports = { initGame, aim, fire, isGameOver };
