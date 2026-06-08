/**
 * handler-route.js — OS 全域、選單、防呆、遊戲透傳路由
 */

const { t } = require('./messages');
const {
  enterMenu,
  releaseToIdle,
  hasCalcEntries,
  activateApp,
} = require('./session');
const { enterCalcFromMenu, formatFinal } = require('./handler-calc');

function handlePromptGuard(session, principalId, cmd, text) {
  const digit = String(text).trim();
  if (!['1', '2', '3'].includes(digit)) return t(session.locale, 'promptGuardInvalid');
  const calc = session.appData.calc;
  if (digit === '1') {
    const total = calc.total;
    const loc = session.locale;
    session.appData.calc = { entries: [], total: 0 };
    releaseToIdle(principalId);
    return formatFinal(total, loc);
  }
  if (digit === '2') {
    session.appData.calc = { entries: [], total: 0 };
    releaseToIdle(principalId);
    return t(session.locale, 'guardAbandonAndClose');
  }
  session.osState = session.guard?.resumeOsState || 'APP_ACTIVE';
  session.currentApp = session.guard?.resumeCurrentApp || 'CALC';
  session.guard = null;
  return t(session.locale, 'guardCancel');
}

function handleGamePlaying(session, cmd) {
  if (cmd.type === 'START') {
    session.osState = 'GAME_HUB';
    return t(session.locale, 'GAME_HUB_MENU');
  }
  return t(session.locale, 'gamePassthrough');
}

function handleOsGlobal(session, principalId, cmd) {
  if (cmd.type === 'START') {
    session.locale = cmd.locale || session.locale;
    enterMenu(principalId);
    return t(cmd.locale, 'OS_MENU');
  }
  if (cmd.type === 'END') {
    if (hasCalcEntries(session)) {
      const resumeOs = session.osState;
      const resumeApp = session.currentApp;
      session.osState = 'PROMPT_GUARD';
      session.guard = {
        type: 'END_WITH_CALC',
        resumeOsState: resumeOs,
        resumeCurrentApp: resumeApp,
      };
      return t(session.locale, 'promptGuardEnd');
    }
    releaseToIdle(principalId);
    return t(session.locale, 'osClosed');
  }
  if (cmd.type === 'SETTLE') {
    const { handleCalcCommand } = require('./handler-calc');
    return handleCalcCommand(session, principalId, cmd);
  }
  return null;
}

function handleMenuDigit(session, principalId, text, cmd) {
  if (cmd.type === 'OPERATION' || cmd.type === 'UNDO' || cmd.type === 'MODIFY') {
    return t(session.locale, 'menuBlocked');
  }
  const digit = String(text).trim();
  if (digit === '1') return enterCalcFromMenu(session, principalId, session.locale || 'zh-TW');
  if (['2', '3', '4'].includes(digit)) {
    activateApp(principalId, 'PENDING_PLUGIN', session.locale);
    return t(session.locale, 'menuPluginSoon', { digit });
  }
  return t(session.locale, 'menuInvalid');
}

module.exports = {
  handlePromptGuard,
  handleGamePlaying,
  handleOsGlobal,
  handleMenuDigit,
};
