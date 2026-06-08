/**
 * game-session.js — 每個群組 chatId 共用一盤棋
 */

const { initGame } = require('./game');

/** @type {Map<string, object>} */
const sessions = new Map();

function getGameSession(chatId) {
  const id = String(chatId);
  if (!sessions.has(id)) {
    sessions.set(id, { active: false, game: null, lastPlayer: '' });
  }
  return sessions.get(id);
}

function startGame(chatId) {
  const s = getGameSession(chatId);
  s.game = initGame(1);
  s.active = true;
  s.lastPlayer = '';
  return s.game;
}

function endGame(chatId) {
  const s = getGameSession(chatId);
  const score = s.game ? s.game.score : 0;
  s.active = false;
  s.game = null;
  return score;
}

function setLastPlayer(chatId, name) {
  const s = getGameSession(chatId);
  s.lastPlayer = name || '';
}

module.exports = { getGameSession, startGame, endGame, setLastPlayer };
