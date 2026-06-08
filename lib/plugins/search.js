'use strict';

/**
 * search.js — 語意搜尋：L0 連結 → L1 CSE → L2 BYOK LLM
 */

const { t } = require('../messages');
const { releaseToIdle } = require('../session');
const { buildGoogleSearchUrl } = require('../search-url');
const { fetchCseLines } = require('../search-cse');
const { fetchLlmAnswer } = require('../search-llm');

async function execute(cmd, session, ctx) {
  void ctx;
  const loc = session.locale;
  const query = String(cmd.payload || '').trim();
  if (!query) {
    releaseToIdle(session.principalId);
    return t(loc, 'searchEmpty');
  }

  const finish = (reply) => {
    releaseToIdle(session.principalId);
    return reply;
  };

  try {
    if (cmd.type === 'SYS_SEARCH_ASK') {
      const llm = await fetchLlmAnswer(query, loc);
      if (llm) {
        return finish(
          t(loc, 'searchL2Result', { answer: llm, disclaimer: t(loc, 'searchDisclaimer') })
        );
      }
    }

    const lines = await fetchCseLines(query, 3);
    if (lines && lines.length) {
      return finish(
        t(loc, 'searchL1Result', {
          lines: lines.join('\n'),
          disclaimer: t(loc, 'searchDisclaimer'),
        })
      );
    }

    const url = buildGoogleSearchUrl(query);
    return finish(t(loc, 'searchL0Result', { url, hint: t(loc, 'searchSetupHint') }));
  } catch (_) {
    return finish(t(loc, 'searchError'));
  }
}

module.exports = { execute };
