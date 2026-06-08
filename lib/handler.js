/**
 * handler.js — V3 交通警察（protocol-neutral，回 { reply }）
 * 路由：PROMPT_GUARD → GAME_PLAYING盲傳 → Fast-track → OS全域 → MENU → CALC
 */

const { parseCommand } = require('./parse');
const {
  getSession,
  enterMenu,
  releaseToIdle,
  hasCalcEntries,
  isCalcActive,
} = require('./session');
const { normalizeCtx } = require('./kernel-sanitizer');
const { DIV_BY_ZERO } = require('./calc');
const { t } = require('./messages');
const { handleCalcCommand, needStartMessage } = require('./handler-calc');
const { handlePromptGuard, handleOsGlobal, handleMenuDigit, handleGamePlaying } = require('./handler-route');

function ok(reply) {
  return { reply: reply == null ? null : String(reply) };
}

/** @param {string} text @param {string} principalId @param {object} [rawCtx] */
function handleMessage(text, principalId, rawCtx) {
  const ctx = normalizeCtx({ ...(rawCtx || {}), text, principalId });
  const session = getSession(ctx.principalId);
  const trimmed = ctx.text.trim();

  try {
    if (session.osState === 'PROMPT_GUARD') {
      return ok(handlePromptGuard(session, ctx.principalId, { type: 'GUARD' }, trimmed));
    }
    if (session.osState === 'MENU' && /^[1-4]$/.test(trimmed)) {
      return ok(handleMenuDigit(session, ctx.principalId, trimmed, { type: 'MENU_SELECT' }));
    }

    const cmd = parseCommand(ctx.text, session.locale, ctx.source);
    if (cmd.type === 'UNKNOWN') return ok(null);
    if (session.osState === 'GAME_PLAYING') {
      return ok(handleGamePlaying(session, cmd));
    }
    // Fast-track：Phase 2 由 plugin-dispatch 接管
    const osReply = handleOsGlobal(session, ctx.principalId, cmd);
    if (osReply != null) return ok(osReply);
    if (session.osState === 'MENU') {
      const menuReply = handleMenuDigit(session, ctx.principalId, ctx.text, cmd);
      if (menuReply != null) return ok(menuReply);
      return ok(t(session.locale, 'menuBlocked'));
    }
    if (isCalcActive(session)) {
      const calcReply = handleCalcCommand(session, ctx.principalId, cmd);
      if (calcReply != null) return ok(calcReply);
    }
    if (['OPERATION', 'UNDO', 'MODIFY'].includes(cmd.type)) {
      if (session.osState === 'MENU') return ok(t(session.locale, 'menuBlocked'));
      return ok(needStartMessage(session.locale));
    }
    return ok(null);
  } catch (e) {
    if (e.message === DIV_BY_ZERO || e.message === 'INVALID_OP') {
      return ok(t(session.locale, 'calcError'));
    }
    throw e;
  }
}

module.exports = { handleMessage };
