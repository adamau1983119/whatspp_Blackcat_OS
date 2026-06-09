'use strict';

/**
 * plugin-dispatch.js — 插件路由 + 8 秒超時（支援 sync / async execute）
 */

const path = require('path');
const { t, withQuickFooter } = require('./messages');
const { releaseToIdle } = require('./session');

const pluginsConfig = require('../config/plugins.json');
const DISPATCH_TIMEOUT_MS = 8000;

const PLUGIN_TYPES = new Set([
  'SYS_MAPS',
  'SYS_TRANSLATE',
  'SYS_SEARCH',
  'SYS_SEARCH_ASK',
  'GAME_HUB',
  'SAVE_NOTE',
  'SYS_MAIL',
  'SYS_TODO',
  'SYS_TODO_LIST',
  'SYS_CLOCK',
  'SYS_CALENDAR',
  'SYS_PHOTOS',
]);

function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('PLUGIN_TIMEOUT')), ms);
  });
}

function loadPlugin(file) {
  const base = String(file).replace(/\.js$/, '');
  return require(path.join(__dirname, 'plugins', base));
}

async function runPluginExecute(mod, cmd, session, ctx) {
  const raw = mod.execute(cmd, session, ctx);
  if (raw && typeof raw.then === 'function') {
    return Promise.race([raw, timeoutPromise(DISPATCH_TIMEOUT_MS)]);
  }
  return raw;
}

/** 執行插件（async）；錯誤隔離 */
async function dispatchPluginAsync(cmd, session, ctx) {
  if (!PLUGIN_TYPES.has(cmd.type)) return null;
  const cfg = pluginsConfig.plugins[cmd.type];
  if (!cfg?.enabled || !cfg.file) return null;
  try {
    const mod = loadPlugin(cfg.file);
    return await runPluginExecute(mod, cmd, session, ctx);
  } catch (e) {
    releaseToIdle(session.principalId);
    if (e.message === 'PLUGIN_TIMEOUT') {
      return withQuickFooter(session.locale, t(session.locale, 'pluginTimeout'));
    }
    return withQuickFooter(session.locale, t(session.locale, 'pluginError'));
  }
}

/** @deprecated 請用 dispatchPluginAsync；保留給同步單元測試 */
function dispatchPlugin(cmd, session, ctx) {
  if (!PLUGIN_TYPES.has(cmd.type)) return null;
  const cfg = pluginsConfig.plugins[cmd.type];
  if (!cfg?.enabled || !cfg.file) return null;
  try {
    const mod = loadPlugin(cfg.file);
    const raw = mod.execute(cmd, session, ctx);
    if (raw && typeof raw.then === 'function') {
      throw new Error('ASYNC_PLUGIN_USE_DISPATCH_ASYNC');
    }
    return raw;
  } catch (_) {
    releaseToIdle(session.principalId);
    return withQuickFooter(session.locale, t(session.locale, 'pluginError'));
  }
}

async function executeWithTimeout(principalId, locale, runPlugin) {
  try {
    const result = await Promise.race([runPlugin(), timeoutPromise(DISPATCH_TIMEOUT_MS)]);
    return result;
  } catch (e) {
    releaseToIdle(principalId);
    const key = e.message === 'PLUGIN_TIMEOUT' ? 'pluginTimeout' : 'pluginError';
    return { reply: withQuickFooter(locale, t(locale, key)) };
  }
}

module.exports = {
  DISPATCH_TIMEOUT_MS,
  executeWithTimeout,
  dispatchPlugin,
  dispatchPluginAsync,
  PLUGIN_TYPES,
};
