/**
 * parse.js — 指令解析：依設定檔別名比對，並回傳使用者語系 locale
 */

const fs = require('fs');
const path = require('path');

const COMMANDS_PATH = path.join(__dirname, '..', 'config', 'commands.json');

let commandsCache = null;
/** @type {Map<string, { type: string, locale: string }> | null} */
let exactAliasMap = null;
/** @type {Array<{ type: string, locale: string, aliases: string[] }> | null} */
let prefixRules = null;

function loadCommands() {
  if (!commandsCache) {
    const raw = fs.readFileSync(COMMANDS_PATH, 'utf-8');
    commandsCache = JSON.parse(raw);
    exactAliasMap = new Map();
    prefixRules = [];
    for (const rule of commandsCache.exact || []) {
      for (const alias of rule.aliases || []) {
        exactAliasMap.set(alias, { type: rule.type, locale: rule.locale });
      }
    }
    for (const rule of commandsCache.prefix || []) {
      prefixRules.push({
        type: rule.type,
        locale: rule.locale,
        aliases: rule.aliases || [],
      });
    }
  }
  return commandsCache;
}

function resetCommandsCache() {
  commandsCache = null;
  exactAliasMap = null;
  prefixRules = null;
}

function getDefaultLocale() {
  return loadCommands().defaultLocale || 'zh-TW';
}

/** 全形→半形、去除首尾空白（比對別名與運算前套用） */
function normalizeInput(text) {
  return String(text || '')
    .trim()
    .replace(/\u3000/g, ' ')
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

/** 取得某語系、某類型的第一個別名（供提示訊息使用） */
function getAliasHint(type, locale) {
  const cmds = loadCommands();
  for (const rule of cmds.exact || []) {
    if (rule.type === type && rule.locale === locale && rule.aliases?.[0]) {
      return rule.aliases[0];
    }
  }
  return '';
}

function parseOperation(text) {
  const match = text.match(/^([+\-*/])(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return {
    type: 'OPERATION',
    raw: text,
    op: match[1],
    value: parseFloat(match[2]),
  };
}

function parseModifyWithPrefixes(text, rules) {
  for (const rule of rules) {
    for (const prefix of rule.aliases) {
      if (!text.startsWith(prefix + ' ')) continue;
      const rest = text.slice(prefix.length).trim();
      const parts = rest.split(/\s+/);
      if (parts.length < 2) return null;
      const oldRaw = parts[0];
      const newRaw = parts[1];
      const newEntry = parseOperation(newRaw);
      if (!parseOperation(oldRaw) || !newEntry) return null;
      return {
        type: rule.type,
        locale: rule.locale,
        oldRaw,
        newEntry,
      };
    }
  }
  return null;
}

/** GLASS_AUDIO 語音遊戲鍵須 [CMD] 前綴（Phase 1 stub） */
function acousticTokenGuard(trimmed, source) {
  if (source !== 'GLASS_AUDIO') return trimmed;
  if (/^[LRF]$/i.test(trimmed)) return '';
  if (trimmed.startsWith('[CMD]')) return trimmed.slice(5).trim();
  return trimmed;
}

/** Phase 2 起讀 SYS_* prefix；Phase 1 回 null */
function parsePluginPrefix(text) {
  void text;
  return null;
}

function parseCommand(text, sessionLocale, ctxSource) {
  let trimmed = normalizeInput(text);
  const fallbackLocale = sessionLocale || getDefaultLocale();
  trimmed = acousticTokenGuard(trimmed, ctxSource || 'WHATSAPP');
  if (!trimmed) return { type: 'UNKNOWN', locale: fallbackLocale };

  loadCommands();

  const modifyResult = parseModifyWithPrefixes(trimmed, prefixRules);
  if (modifyResult) return modifyResult;

  const exact = exactAliasMap.get(trimmed);
  if (exact) return { type: exact.type, locale: exact.locale };

  const operation = parseOperation(trimmed);
  if (operation) {
    return { ...operation, locale: fallbackLocale };
  }

  return { type: 'UNKNOWN', locale: fallbackLocale };
}

module.exports = {
  loadCommands,
  resetCommandsCache,
  getDefaultLocale,
  normalizeInput,
  getAliasHint,
  parseOperation,
  parsePluginPrefix,
  parseCommand,
};
