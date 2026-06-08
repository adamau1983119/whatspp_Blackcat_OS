/**
 * handler-tools.js — Tools Hub 子選單與快速路徑插件
 */

const toolsConfig = require('../config/tools-menu.json');
const { t } = require('./messages');
const { dispatchPluginAsync, PLUGIN_TYPES } = require('./plugin-dispatch');
const { enterMenu } = require('./session');

const FAST_PLUGINS = new Set([
  'SAVE_NOTE',
  'SYS_MAIL',
  'SYS_TODO',
  'SYS_TODO_LIST',
  'SYS_CLOCK',
  'SYS_CALENDAR',
  'SYS_PHOTOS',
]);

function toolsItemType(digit) {
  const item = (toolsConfig.items || []).find((i) => i.index === String(digit));
  return item ? item.type : null;
}

function enterToolsHub(session) {
  session.osState = 'TOOLS_HUB';
  session.currentApp = 'TOOLS_HUB';
}

async function handleToolsHubDigit(session, principalId, text, ctx) {
  const digit = String(text).trim();
  const toolType = toolsItemType(digit);
  if (!toolType) return t(session.locale, 'toolsInvalid');

  if (toolType === 'SYS_PHOTOS') {
    return t(session.locale, 'photosPrompt');
  }

  return dispatchPluginAsync(
    { type: toolType, locale: session.locale, payload: '' },
    session,
    { ...ctx, text: '', principalId }
  );
}

async function tryFastPlugins(cmd, session, ctx) {
  if (!FAST_PLUGINS.has(cmd.type)) return undefined;
  if (session.osState === 'PROMPT_GUARD' || session.osState === 'GAME_PLAYING') return undefined;
  if (!PLUGIN_TYPES.has(cmd.type)) return undefined;
  return dispatchPluginAsync(cmd, session, ctx);
}

async function routeImageReceipt(session, ctx, cmd) {
  if (session.osState !== 'IDLE') return undefined;
  if (!ctx.attachment?.hasAttachment || ctx.attachment.type !== 'IMAGE') return undefined;
  if (cmd.type !== 'UNKNOWN' && cmd.type !== 'SYS_PHOTOS') return undefined;
  return dispatchPluginAsync({ type: 'SYS_PHOTOS', locale: session.locale, payload: '' }, session, ctx);
}

async function routeToolsHub(session, principalId, trimmed, cmd, ctx) {
  if (session.osState !== 'TOOLS_HUB') return undefined;
  if (cmd.type === 'START') {
    session.locale = cmd.locale || session.locale;
    enterMenu(principalId);
    return t(cmd.locale, 'OS_MENU');
  }
  if (/^[1-7]$/.test(trimmed)) return handleToolsHubDigit(session, principalId, trimmed, ctx);
  return t(session.locale, 'toolsBlocked');
}

module.exports = {
  enterToolsHub,
  handleToolsHubDigit,
  toolsItemType,
  tryFastPlugins,
  routeImageReceipt,
  routeToolsHub,
};
