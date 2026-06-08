'use strict';

/**
 * bubble-bridge.js — 泡泡龍核心橋接（自 whatapp_cat_game 合流）
 */

const { handleGameMessage } = require('./bubble/game-handler');
const { endGame } = require('./bubble/game-session');
const { loadCommandConfig } = require('./bubble/game-config');
const { t } = require('./bubble/game-messages');

function startBubbleGame(principalId, locale) {
  const cfg = loadCommandConfig();
  const rule = (cfg.exact || []).find((r) => r.type === 'GAME_START' && r.locale === locale)
    || (cfg.exact || []).find((r) => r.type === 'GAME_START');
  const alias = rule?.aliases?.[0] || '=泡泡龍';
  return handleGameMessage(alias, principalId) || t(locale, 'gameStarted');
}

function handleBubbleInput(text, principalId, locale) {
  const reply = handleGameMessage(text, principalId);
  if (reply) return reply;
  return t(locale, 'controls');
}

function stopBubbleGame(principalId, locale) {
  const score = endGame(principalId);
  return t(locale, 'gameEnded', { score });
}

module.exports = { startBubbleGame, handleBubbleInput, stopBubbleGame };
