/**
 * game-match.js — 同色消除與重力下落
 */

const { loadGameConfig } = require('./game-config');
const { isEmpty, getEmpty } = require('./game-board');

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

function findCluster(board, row, col) {
  const color = board[row][col];
  if (isEmpty(color)) return [];
  const seen = new Set();
  const stack = [[row, col]];
  const cells = [];
  while (stack.length) {
    const [r, c] = stack.pop();
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!board[r] || board[r][c] !== color) continue;
    cells.push([r, c]);
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (board[nr] && board[nr][nc] === color) stack.push([nr, nc]);
    }
  }
  return cells;
}

function removeAndScore(board, minCluster) {
  const cfg = loadGameConfig();
  const min = minCluster || cfg.minCluster || 3;
  const per = cfg.scorePerBall || 10;
  const marked = new Set();
  let score = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const key = `${r},${c}`;
      if (marked.has(key) || isEmpty(board[r][c])) continue;
      const cluster = findCluster(board, r, c);
      if (cluster.length >= min) {
        for (const [cr, cc] of cluster) {
          marked.add(`${cr},${cc}`);
          board[cr][cc] = getEmpty();
          score += per;
        }
      }
    }
  }
  return score;
}

function applyGravity(board) {
  const empty = getEmpty();
  const rows = board.length;
  const cols = board[0].length;
  for (let c = 0; c < cols; c++) {
    const balls = [];
    for (let r = 0; r < rows; r++) {
      if (!isEmpty(board[r][c])) balls.push(board[r][c]);
    }
    for (let r = 0; r < rows; r++) {
      board[r][c] = r < rows - balls.length ? empty : balls[r - (rows - balls.length)];
    }
  }
}

module.exports = { removeAndScore, applyGravity, findCluster };
