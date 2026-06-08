'use strict';

/**
 * game_hub.js — 遊戲大廳入口（Phase 7：子選單由 game-menu.json 驅動）
 */

const gameMenu = require('../../config/game-menu.json');
const { t } = require('../messages');

function buildHubMenu(locale) {
  const lines = [t(locale, 'GAME_HUB_MENU_HEADER')];
  lines.push('----------------');
  for (const item of gameMenu.items || []) {
    if (item.enabled === false) continue;
    lines.push(`${item.index}️⃣ ${item.emoji || ''} ${item.name}`.trim());
  }
  lines.push('----------------');
  lines.push(t(locale, 'GAME_HUB_MENU_FOOTER'));
  return lines.join('\n');
}

function execute(cmd, session, ctx) {
  void cmd;
  void ctx;
  session.osState = 'GAME_HUB';
  session.currentApp = 'GAME_HUB';
  session.currentGame = null;
  session.meta.lockReason = null;
  return buildHubMenu(session.locale);
}

module.exports = { execute, buildHubMenu };
