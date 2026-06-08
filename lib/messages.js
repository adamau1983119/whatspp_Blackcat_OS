/**
 * messages.js — 依語系 locale 載入回覆文案（config/messages.json）
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_PATH = path.join(__dirname, '..', 'config', 'messages.json');
let messagesCache = null;

function loadMessagesConfig() {
  if (!messagesCache) {
    messagesCache = JSON.parse(fs.readFileSync(MESSAGES_PATH, 'utf-8'));
  }
  return messagesCache;
}

function resetMessagesCache() {
  messagesCache = null;
}

function getDefaultLocale() {
  return loadMessagesConfig().defaultLocale || 'zh-TW';
}

/** 取得某語系的文案表，找不到則 fallback 至 defaultLocale */
function getLocaleMessages(locale) {
  const cfg = loadMessagesConfig();
  const key = locale || cfg.defaultLocale;
  return cfg[key] || cfg[cfg.defaultLocale] || {};
}

/** 取文案並替換 {key} 變數；單 key 缺失時 fallback 至 defaultLocale */
function t(locale, key, vars = {}) {
  const cfg = loadMessagesConfig();
  const def = cfg[cfg.defaultLocale] || {};
  const msgs = getLocaleMessages(locale);
  let text = msgs[key] ?? def[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

module.exports = {
  loadMessagesConfig,
  resetMessagesCache,
  getDefaultLocale,
  getLocaleMessages,
  t,
};
