/**
 * handler-route.js — OS 全域、選單、防呆、遊戲透傳路由
 */

const menuConfig = require('../config/menu.json');
const { t } = require('./messages');
const { enterMenu, releaseToIdle, hasCalcEntries } = require('./session');
const { enterCalcFromMenu, formatFinal } = require('./handler-calc');
const { dispatchPluginAsync } = require('./plugin-dispatch');
const { enterToolsHub } = require('./handler-tools');

function handlePromptGuard(session, principalId, cmd, text) {
  void cmd;
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

function handleGamePlaying(session, principalId, rawText, ctx) {
  const trimmed = String(rawText || '').trim();
  const { parseCommand } = require('./parse');
  const cmd = parseCommand(trimmed, session.locale, ctx?.source || 'WHATSAPP');
  if (cmd.type === 'START') {
    const wasBubble = session.currentGame === 'BUBBLE';
    session.osState = 'GAME_HUB';
    session.currentApp = 'GAME_HUB';
    session.currentGame = null;
    session.meta.lockReason = null;
    if (wasBubble) {
      const { stopBubbleGame } = require('./games/bubble-bridge');
      stopBubbleGame(principalId, session.locale);
    }
    const { buildHubMenu } = require('./plugins/game_hub');
    return buildHubMenu(session.locale);
  }
  const { handleBubbleInput } = require('./games/bubble-bridge');
  return handleBubbleInput(trimmed, principalId, session.locale);
}

function handleGameHub(session, principalId, digit) {
  const gameMenu = require('../config/game-menu.json');
  const item = (gameMenu.items || []).find(
    (i) => i.index === String(digit) && i.enabled !== false
  );
  if (!item) return t(session.locale, 'menuInvalid');
  if (item.type === 'BUBBLE') {
    session.osState = 'GAME_PLAYING';
    session.currentApp = 'GAME';
    session.currentGame = 'BUBBLE';
    session.meta.lockReason = 'GAME_PLAYING';
    const { startBubbleGame } = require('./games/bubble-bridge');
    return startBubbleGame(principalId, session.locale);
  }
  return t(session.locale, 'menuInvalid');
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

function menuItemType(digit) {
  const item = (menuConfig.items || []).find((i) => i.index === String(digit));
  return item ? item.type : null;
}

async function handleMenuDigit(session, principalId, text, cmd) {
  if (cmd.type === 'OPERATION' || cmd.type === 'UNDO' || cmd.type === 'MODIFY') {
    return t(session.locale, 'menuBlocked');
  }
  const digit = String(text).trim();
  const appType = menuItemType(digit);
  if (appType === 'SYS_CALC') {
    return enterCalcFromMenu(session, principalId, session.locale || 'zh-TW');
  }
  if (appType === 'TOOLS_HUB') {
    enterToolsHub(session);
    return t(session.locale, 'TOOLS_HUB_MENU');
  }
  if (appType === 'SYS_TRANSLATE') {
    return dispatchPluginAsync(
      { type: 'SYS_TRANSLATE', locale: session.locale, payload: '' },
      session,
      { text: '', principalId }
    );
  }
  if (appType === 'GAME_HUB') {
    return dispatchPluginAsync(
      { type: 'GAME_HUB', locale: session.locale, payload: '' },
      session,
      { text: '', principalId }
    );
  }
  return t(session.locale, 'menuInvalid');
}

module.exports = {
  handlePromptGuard,
  handleGamePlaying,
  handleGameHub,
  handleOsGlobal,
  handleMenuDigit,
};
