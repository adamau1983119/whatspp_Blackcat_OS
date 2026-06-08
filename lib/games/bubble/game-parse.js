/**
 * game-parse.js — 遊戲指令解析（設定驅動）
 */

const { loadCommandConfig } = require('./game-config');

let aliasMap = null;

function buildAliasMap() {
  aliasMap = new Map();
  const cfg = loadCommandConfig();
  for (const rule of cfg.exact || []) {
    for (const alias of rule.aliases || []) {
      aliasMap.set(alias, { type: rule.type, locale: rule.locale });
    }
  }
}

function normalizeInput(text) {
  return String(text || '')
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .trim();
}

/** @returns {{ type: string, locale?: string }} */
function parseGameCommand(text) {
  if (!aliasMap) buildAliasMap();
  const norm = normalizeInput(text);
  if (!norm) return { type: 'UNKNOWN' };
  const hit = aliasMap.get(norm);
  if (hit) return { type: hit.type, locale: hit.locale };
  return { type: 'UNKNOWN' };
}

function resetParseCache() {
  aliasMap = null;
}

module.exports = { parseGameCommand, normalizeInput, resetParseCache };
