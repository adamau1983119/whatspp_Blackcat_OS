/**
 * handler-calc.js — 計算機本體（讀寫 session.appData.calc）
 */

const { addEntry, undoEntry, modifyEntry, DIV_BY_ZERO, NOT_FOUND } = require('./calc');
const { formatResult, formatFinal, formatStarted } = require('./format');
const { t, getDefaultLocale } = require('./messages');
const { getAliasHint } = require('./parse');
const { activateApp, isCalcActive, hasCalcEntries } = require('./session');

function needStartMessage(locale) {
  const loc = locale || getDefaultLocale();
  const hint = getAliasHint('START', loc) || getAliasHint('START', getDefaultLocale());
  return t(loc, 'needStart', { startHint: hint });
}

function applyOperation(session, cmd) {
  const calc = session.appData.calc;
  const entry = { op: cmd.op, value: cmd.value, raw: cmd.raw };
  const result = addEntry(calc.entries, entry);
  calc.entries = result.entries;
  calc.total = result.total;
  return formatResult({ entries: calc.entries, total: calc.total, locale: session.locale }, session.locale);
}

function enterCalcFromMenu(session, principalId, locale) {
  activateApp(principalId, 'CALC', locale);
  if (hasCalcEntries(session)) {
    return t(session.locale, 'calcResume', { total: session.appData.calc.total });
  }
  session.appData.calc = { entries: [], total: 0 };
  return formatStarted(locale);
}

function handleCalcCommand(session, principalId, cmd) {
  const calc = session.appData.calc;
  switch (cmd.type) {
    case 'OPERATION':
      if (!isCalcActive(session)) return needStartMessage(session.locale || cmd.locale);
      return applyOperation(session, cmd);
    case 'UNDO':
      if (!isCalcActive(session)) return needStartMessage(session.locale);
      if (calc.entries.length === 0) return t(session.locale, 'undoEmpty');
      {
        const undone = undoEntry(calc.entries);
        calc.entries = undone.entries;
        calc.total = undone.total;
        return formatResult({ entries: calc.entries, total: calc.total, locale: session.locale }, session.locale);
      }
    case 'MODIFY':
      if (!isCalcActive(session)) return needStartMessage(session.locale);
      try {
        const modified = modifyEntry(calc.entries, cmd.oldRaw, cmd.newEntry);
        calc.entries = modified.entries;
        calc.total = modified.total;
        return formatResult({ entries: calc.entries, total: calc.total, locale: session.locale }, session.locale);
      } catch (e) {
        if (e.message === NOT_FOUND) return t(session.locale, 'modifyNotFound', { oldRaw: cmd.oldRaw });
        throw e;
      }
    case 'SETTLE': {
      if (!hasCalcEntries(session)) return t(session.locale, 'settleEmpty');
      const total = calc.total;
      const loc = session.locale;
      session.appData.calc = { entries: [], total: 0 };
      return formatFinal(total, loc);
    }
    default:
      return null;
  }
}

module.exports = {
  needStartMessage,
  enterCalcFromMenu,
  handleCalcCommand,
  formatFinal,
};
