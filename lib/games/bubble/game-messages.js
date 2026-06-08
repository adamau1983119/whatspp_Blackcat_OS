/**
 * game-messages.js — 遊戲文案（config 驅動）
 */

const { loadMessageConfig } = require('./game-config');

function t(locale, key, vars = {}) {
  const cfg = loadMessageConfig();
  const loc = locale || cfg.defaultLocale || 'zh-TW';
  const pack = cfg[loc] || cfg[cfg.defaultLocale] || {};
  let text = pack[key] || cfg[cfg.defaultLocale]?.[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
}

module.exports = { t };
