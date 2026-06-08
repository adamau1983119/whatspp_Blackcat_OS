/**
 * game-physics.js — 射線步進、牆壁反彈、黏附落點、瞄準線
 */

const { loadGameConfig } = require('./game-config');
const { isEmpty, isInBounds } = require('./game-board');

/** 模擬射擊路徑與落點 */
function simulateShot(board, pointer, angleIndex) {
  const cfg = loadGameConfig();
  const cols = board[0].length;
  const angles = cfg.angles || [{ dx: 0, dy: -1 }];
  const a = angles[angleIndex] || angles[Math.floor(angles.length / 2)] || angles[0];
  let dx = a.dx;
  let dy = a.dy;
  let col = Math.max(0, Math.min(cols - 1, pointer));
  let row = board.length;
  let prevR = row;
  let prevC = col;
  const path = [];
  const maxSteps = cols * board.length * 4;

  for (let step = 0; step < maxSteps; step++) {
    prevR = row;
    prevC = col;
    row += dy;
    col += dx;
    if (col < 0) {
      col = 0;
      dx = -dx;
    } else if (col >= cols) {
      col = cols - 1;
      dx = -dx;
    }
    if (row < 0) {
      if (isEmpty(board[0][col])) return { path, landing: { row: 0, col } };
      return { path, landing: findNeighborEmpty(board, 0, col, dy, dx) };
    }
    if (!isInBounds(board, row, col)) return { path, landing: null };
    if (isEmpty(board[row][col])) path.push({ row, col });
    if (!isEmpty(board[row][col])) {
      return { path, landing: findAttachFrom(board, prevR, prevC, row, col) };
    }
  }
  return { path, landing: null };
}

function findLandingCell(board, pointer, angleIndex) {
  return simulateShot(board, pointer, angleIndex).landing;
}

function traceAimPath(board, pointer, angleIndex) {
  return simulateShot(board, pointer, angleIndex).path;
}

function findNeighborEmpty(board, row, col, fromDy, fromDx) {
  const candidates = [
    { r: row, c: col },
    { r: row - fromDy, c: col - fromDx },
    { r: row, c: col - 1 },
    { r: row, c: col + 1 },
    { r: row - 1, c: col },
  ];
  for (const p of candidates) {
    if (isInBounds(board, p.r, p.c) && isEmpty(board[p.r][p.c])) return { row: p.r, col: p.c };
  }
  return null;
}

function findAttachFrom(board, prevR, prevC, hitR, hitC) {
  if (isInBounds(board, prevR, prevC) && isEmpty(board[prevR][prevC])) {
    return { row: prevR, col: prevC };
  }
  return findNeighborEmpty(board, hitR, hitC, -1, 0);
}

module.exports = { findLandingCell, traceAimPath, simulateShot };
