'use strict';

/**
 * bubble_shooter.js — 泡泡龍插件薄包裝（GAME_PLAYING 盲傳入口）
 */

const { handleBubbleInput, startBubbleGame } = require('../games/bubble-bridge');

function execute(cmd, session, ctx) {
  void cmd;
  const text = String(ctx?.text || '').trim();
  if (!text) return startBubbleGame(session.principalId, session.locale);
  return handleBubbleInput(text, session.principalId, session.locale);
}

module.exports = { execute, startBubbleGame, handleBubbleInput };
