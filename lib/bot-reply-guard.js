'use strict';

/**
 * bot-reply-guard.js — 忽略 bot 自身回覆被當成使用者輸入（Transport 回音的第二道防線）
 */

const { t } = require('./messages');

const MARKER_KEYS = [
  'OS_MENU',
  'TOOLS_HUB_MENU',
  'GAME_HUB_MENU_HEADER',
  'mapsPrompt',
  'translatePrompt',
  'helpList',
  'mapsResult',
  'translateResult',
  'searchL0Result',
  'searchL1Result',
  'searchL2Result',
  'notesSaved',
  'todoSaved',
  'todoList',
  'mailDevicePrompt',
  'mailDeviceInvalid',
  'mailL0ResultLocal',
  'mailL0ResultPhone',
  'mailPhoneUnavailable',
  'clockResult',
  'calendarOpenNative',
  'photosAdded',
  'quickGatewayFooter',
];

/** @param {string} trimmed @param {string} locale */
function isBotOwnReply(trimmed, locale) {
  const text = String(trimmed || '').trim();
  if (!text) return false;
  for (const key of MARKER_KEYS) {
    const full = String(t(locale, key) || '').trim();
    if (!full) continue;
    if (text === full) return true;
    const first = full.split('\n')[0].trim();
    if (first.length >= 4 && text.startsWith(first)) return true;
  }
  if (text.includes('maps.apple.com') || text.includes('google.com/maps')) return true;
  if (text.includes('/mail?')) return true;
  return false;
}

module.exports = { isBotOwnReply, MARKER_KEYS };
