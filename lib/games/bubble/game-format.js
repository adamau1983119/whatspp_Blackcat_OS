/**
 * game-format.js — Emoji 棋盤文字渲染（含瞄準盤與角度線）
 */

const { loadGameConfig } = require('./game-config');
const { t } = require('./game-messages');
const { traceAimPath } = require('./game-physics');
const { isEmpty } = require('./game-board');

function formatRow(cells) {
  return cells.join(' ');
}

function overlayAimLine(board, pointer, angleIndex) {
  const cfg = loadGameConfig();
  const line = cfg.aimLine || '·';
  const path = traceAimPath(board, pointer, angleIndex);
  const marks = new Set(path.map((p) => `${p.row},${p.col}`));
  return board.map((row, r) => row.map((cell, c) => {
    if (marks.has(`${r},${c}`) && isEmpty(cell)) return line;
    return cell;
  }));
}

function formatAimDial(angleIndex) {
  const angles = loadGameConfig().angles || [];
  const dial = angles.map((a, i) => (i === angleIndex ? `[${a.dial || '·'}]` : ` ${a.dial || '·'} `));
  return `瞄準盤：${dial.join('')}`;
}

function formatLauncher(pointer, cols, angleIndex) {
  const angles = loadGameConfig().angles || [];
  const dial = angles[angleIndex]?.dial || '│';
  const parts = [];
  for (let c = 0; c < cols; c++) {
    if (c === pointer) parts.push(`🐱${dial}`);
    else parts.push('   ');
  }
  return formatRow(parts);
}

function formatGameBoard(state, locale, lastPlayer) {
  const cfg = loadGameConfig();
  const cols = cfg.cols || 7;
  const lines = [];
  const view = overlayAimLine(state.board, state.pointer, state.angleIndex);
  lines.push(t(locale, 'gameTitle') + ` (Lv${state.level})`);
  lines.push('Score: ' + state.score);
  lines.push('--------------------');
  for (const row of view) lines.push(formatRow(row));
  lines.push('--------------------');
  lines.push(formatLauncher(state.pointer, cols, state.angleIndex));
  lines.push(formatAimDial(state.angleIndex));
  lines.push(`準備：${state.currentBall}  下一顆：${state.nextBall}`);
  if (lastPlayer) lines.push(t(locale, 'lastPlayer', { name: lastPlayer }));
  lines.push(t(locale, 'controls'));
  return lines.join('\n');
}

module.exports = { formatGameBoard, formatRow, formatLauncher, overlayAimLine, formatAimDial };
