/**
 * session.js — V3 per-principalId 狀態（osState + appData.calc）
 */

const { getDefaultLocale } = require('./messages');

/** @type {Map<string, object>} */
const sessions = new Map();

function createEmptySession(principalId) {
  return {
    principalId: String(principalId),
    locale: getDefaultLocale(),
    osState: 'IDLE',
    currentApp: null,
    currentGame: null,
    guard: null,
    appData: {
      calc: { entries: [], total: 0 },
      notes: [],
      todos: [],
    },
    meta: {
      activeSource: 'WHATSAPP',
      lockReason: null,
    },
  };
}

function getSession(principalId) {
  const id = String(principalId);
  if (!sessions.has(id)) sessions.set(id, createEmptySession(id));
  return sessions.get(id);
}

function releaseToIdle(principalId) {
  const s = getSession(principalId);
  s.osState = 'IDLE';
  s.currentApp = null;
  s.currentGame = null;
  s.guard = null;
  s.meta.lockReason = null;
}

/** =開始 回主選單：掛起帳本，不清空 appData.calc */
function enterMenu(principalId) {
  const s = getSession(principalId);
  s.osState = 'MENU';
  s.currentApp = null;
  s.currentGame = null;
  s.guard = null;
}

function activateApp(principalId, app, locale) {
  const s = getSession(principalId);
  s.osState = 'APP_ACTIVE';
  s.currentApp = app;
  if (locale) s.locale = locale;
  s.meta.lockReason = app === 'CALC' ? 'CALC' : null;
}

function hasCalcEntries(session) {
  return session.appData.calc.entries.length > 0;
}

function isCalcActive(session) {
  return session.osState === 'APP_ACTIVE' && session.currentApp === 'CALC';
}

/** v1 測試相容：直接開計算機並清空帳本 */
function startSession(principalId, locale) {
  const s = getSession(principalId);
  s.locale = locale || getDefaultLocale();
  s.appData.calc = { entries: [], total: 0 };
  activateApp(principalId, 'CALC', s.locale);
  return s;
}

/** v1 測試相容：結算並重置整個 session */
function endSession(principalId) {
  const s = getSession(principalId);
  const result = {
    total: s.appData.calc.total,
    locale: s.locale,
    wasActive: isCalcActive(s),
  };
  sessions.set(String(principalId), createEmptySession(principalId));
  return result;
}

function clearAllSessions() {
  sessions.clear();
}

module.exports = {
  getSession,
  releaseToIdle,
  enterMenu,
  activateApp,
  hasCalcEntries,
  isCalcActive,
  startSession,
  endSession,
  clearAllSessions,
};
