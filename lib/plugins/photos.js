'use strict';

/**
 * photos.js — 收據 OCR → 擷取 TOTAL → 自動入帳 appData.calc
 */

const { t, withQuickFooter } = require('../messages');
const { releaseToIdle } = require('../session');
const { addEntry } = require('../calc');
const { extractTotalFromCtx } = require('../ocr-run');

async function execute(cmd, session, ctx) {
  void cmd;
  const loc = session.locale;

  if (!ctx.attachment?.hasAttachment || ctx.attachment.type !== 'IMAGE') {
    releaseToIdle(session.principalId);
    return t(loc, 'photosPrompt');
  }

  const amount = await extractTotalFromCtx(ctx);
  if (amount == null || Number.isNaN(amount)) {
    releaseToIdle(session.principalId);
    return t(loc, 'photosNoTotal');
  }

  const raw = `+${amount}`;
  const next = addEntry(session.appData.calc.entries, { op: '+', value: amount, raw });
  session.appData.calc.entries = next.entries;
  session.appData.calc.total = next.total;

  releaseToIdle(session.principalId);
  return withQuickFooter(
    loc,
    t(loc, 'photosAdded', { amount: String(amount), total: String(next.total) })
  );
}

module.exports = { execute };
