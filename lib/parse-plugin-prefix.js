'use strict';

/** 插件直呼（Fast-track）：=地圖 [地點] */
function parsePluginPrefix(text, plugins) {
  for (const rule of plugins || []) {
    for (const alias of rule.aliases || []) {
      if (text === alias) return { type: rule.type, locale: rule.locale, payload: '' };
      if (text.startsWith(alias + ' ')) {
        return { type: rule.type, locale: rule.locale, payload: text.slice(alias.length).trim() };
      }
    }
  }
  return null;
}

module.exports = { parsePluginPrefix };
