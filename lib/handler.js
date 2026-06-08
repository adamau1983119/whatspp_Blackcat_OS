/**
 * handler.js — V3 交通警察（protocol-neutral，回 { reply }）
 * 路由：PROMPT_GUARD → GAME_PLAYING → Fast-track → OS全域 → 插件 → MENU → CALC
 */

const { parseCommand } = require('./parse');
const { getSession, isCalcActive } = require('./session');
const { normalizeCtx } = require('./kernel-sanitizer');
const { DIV_BY_ZERO } = require('./calc');
const { t } = require('./messages');
const { handleCalcCommand, needStartMessage } = require('./handler-calc');
const {
  handlePromptGuard,
  handleOsGlobal,
  handleMenuDigit,
  handleGamePlaying,
  handleGameHub,
} = require('./handler-route');
const { tryFastPlugins, routeImageReceipt, routeToolsHub } = require('./handler-tools');
const { buildHelpText } = require('./help-list');
const { dispatchPluginAsync, PLUGIN_TYPES } = require('./plugin-dispatch');

function ok(reply) {
  return { reply: reply == null ? null : String(reply) };
}

async function tryPlugin(cmd, session, ctx) {
  if (!PLUGIN_TYPES.has(cmd.type)) return null;
  return dispatchPluginAsync(cmd, session, ctx);
}

/** @param {string} text @param {string} principalId @param {object} [rawCtx] */
async function handleMessage(text, principalId, rawCtx) {
  const ctx = normalizeCtx({ ...(rawCtx || {}), text, principalId });
  const session = getSession(ctx.principalId);
  const trimmed = ctx.text.trim();

  try {
    if (session.osState === 'PROMPT_GUARD') {
      return ok(handlePromptGuard(session, ctx.principalId, { type: 'GUARD' }, trimmed));
    }

    if (session.osState === 'GAME_PLAYING') {
      return ok(handleGamePlaying(session, ctx.principalId, trimmed, ctx));
    }

    const cmd = parseCommand(ctx.text, session.locale, ctx.source);

    if (cmd.type === 'HELP') return ok(buildHelpText(session.locale));
    if (session.osState === 'MENU' && trimmed === '0') return ok(buildHelpText(session.locale));
    if (session.osState === 'MENU' && /^[1-4]$/.test(trimmed)) {
      return ok(await handleMenuDigit(session, ctx.principalId, trimmed, { type: 'MENU_SELECT' }));
    }

    const fast = await tryFastPlugins(cmd, session, ctx);
    if (fast !== undefined) return ok(fast);

    const img = await routeImageReceipt(session, ctx, cmd);
    if (img !== undefined) return ok(img);

    const tools = await routeToolsHub(session, ctx.principalId, trimmed, cmd, ctx);
    if (tools !== undefined) return ok(tools);

    if (session.osState === 'GAME_HUB') {
      if (cmd.type === 'START') return ok(handleOsGlobal(session, ctx.principalId, cmd));
      if (/^[1-9]$/.test(trimmed)) return ok(handleGameHub(session, ctx.principalId, trimmed));
      if (['OPERATION', 'UNDO', 'MODIFY'].includes(cmd.type)) return ok(t(session.locale, 'menuBlocked'));
      return ok(t(session.locale, 'menuBlocked'));
    }

    if (session.osState === 'APP_ACTIVE' && session.currentApp === 'MAPS') {
      const reply = await dispatchPluginAsync(
        { type: 'SYS_MAPS', locale: session.locale, payload: ctx.text },
        session,
        ctx
      );
      return ok(reply);
    }

    if (session.osState === 'IDLE' && PLUGIN_TYPES.has(cmd.type)) {
      const reply = await tryPlugin(cmd, session, ctx);
      if (reply != null) return ok(reply);
    }

    const osReply = handleOsGlobal(session, ctx.principalId, cmd);
    if (osReply != null) return ok(osReply);

    if (session.osState === 'MENU') {
      if (cmd.type === 'UNKNOWN') return ok(t(session.locale, 'menuBlocked'));
      const menuReply = await handleMenuDigit(session, ctx.principalId, ctx.text, cmd);
      if (menuReply != null) return ok(menuReply);
      return ok(t(session.locale, 'menuBlocked'));
    }

    if (isCalcActive(session)) {
      const calcReply = handleCalcCommand(session, ctx.principalId, cmd);
      if (calcReply != null) return ok(calcReply);
    }

    if (['OPERATION', 'UNDO', 'MODIFY'].includes(cmd.type)) {
      if (['MENU', 'GAME_HUB', 'TOOLS_HUB'].includes(session.osState)) {
        return ok(t(session.locale, 'menuBlocked'));
      }
      return ok(needStartMessage(session.locale));
    }

    if (cmd.type === 'UNKNOWN') return ok(null);
    return ok(null);
  } catch (e) {
    if (e.message === DIV_BY_ZERO || e.message === 'INVALID_OP') {
      return ok(t(session.locale, 'calcError'));
    }
    throw e;
  }
}

module.exports = { handleMessage };
