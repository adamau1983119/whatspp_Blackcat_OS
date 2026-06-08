'use strict';

/**
 * translate.js — 真實譯文（@vitalets/google-translate-api）
 */

const { translate } = require('@vitalets/google-translate-api');
const { t } = require('../messages');
const { releaseToIdle } = require('../session');
const { resolveTranslateInput } = require('../translate-resolve');

async function execute(cmd, session, ctx) {
  const loc = session.locale;
  const input = resolveTranslateInput(cmd, ctx, session);
  if (!input || !input.text) {
    releaseToIdle(session.principalId);
    return t(loc, 'translatePrompt');
  }

  try {
    const { text: translated } = await translate(input.text, { to: input.targetLang });
    releaseToIdle(session.principalId);
    return t(loc, 'translateResult', {
      translated: String(translated || '').trim(),
      targetLang: input.targetLang,
    });
  } catch (_) {
    releaseToIdle(session.principalId);
    return t(loc, 'translateSetup');
  }
}

module.exports = { execute };
