'use strict';

/**
 * notes.js — 黑貓備忘錄（L2 速記，僅存於 appData.notes）
 */

const { t, withQuickFooter } = require('../messages');
const { releaseToIdle } = require('../session');

function resolveNoteBody(cmd, ctx) {
  if (ctx.attachment?.hasAttachment && ctx.attachment.payload) {
    return String(ctx.attachment.payload).trim();
  }
  if (cmd.payload) return String(cmd.payload).trim();
  return '';
}

function execute(cmd, session, ctx) {
  const loc = session.locale;
  const body = resolveNoteBody(cmd, ctx);
  if (!body) return t(loc, 'notesEmpty');

  if (!Array.isArray(session.appData.notes)) session.appData.notes = [];
  session.appData.notes.push({
    text: body,
    savedAt: new Date().toISOString(),
  });
  releaseToIdle(session.principalId);
  const preview = body.length > 40 ? `${body.slice(0, 40)}…` : body;
  return withQuickFooter(loc, t(loc, 'notesSaved', { preview }));
}

module.exports = { execute, resolveNoteBody };
