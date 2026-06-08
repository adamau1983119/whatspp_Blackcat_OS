'use strict';

/**
 * plugin-dispatch.js — 插件執行 + 8 秒超時斷路器（Phase 1 骨架）
 */

const { t } = require('./messages');
const { releaseToIdle } = require('./session');

const DISPATCH_TIMEOUT_MS = 8000;

function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('PLUGIN_TIMEOUT')), ms);
  });
}

/** Promise.race 執行插件；超時強制 releaseToIdle */
async function executeWithTimeout(principalId, locale, runPlugin) {
  try {
    const result = await Promise.race([runPlugin(), timeoutPromise(DISPATCH_TIMEOUT_MS)]);
    return result;
  } catch (e) {
    if (e.message === 'PLUGIN_TIMEOUT') {
      releaseToIdle(principalId);
      return { reply: t(locale, 'pluginTimeout') };
    }
    releaseToIdle(principalId);
    return { reply: t(locale, 'pluginError') };
  }
}

/** Phase 2 起實作：依 cmd.type 載入 lib/plugins */
async function dispatchPlugin(cmd, session, ctx) {
  void cmd;
  void session;
  void ctx;
  return { reply: null };
}

module.exports = { DISPATCH_TIMEOUT_MS, executeWithTimeout, dispatchPlugin };
