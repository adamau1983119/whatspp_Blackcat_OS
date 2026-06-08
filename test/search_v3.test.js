/**
 * search_v3.test.js — Phase 4 搜尋 L0/L1/L2
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');
const { buildGoogleSearchUrl } = require('../lib/search-url');

(async () => {
  const url = buildGoogleSearchUrl('灣仔中菜');
  assert.ok(url.includes('google.com/search'));
  assert.ok(url.includes('%'));

  clearAllSessions();
  const r = await handleMessage('=查 灣仔中菜', 'sv1');
  assert.ok(r.reply.includes('google.com/search'));
  assert.ok(r.reply.includes('GOOGLE_CSE') || r.reply.includes('CSE'));
  assert.strictEqual(getSession('sv1').osState, 'IDLE');
  assert.ok(!r.reply.includes('Mock'));

  clearAllSessions();
  const empty = await handleMessage('=查', 'sv2');
  assert.ok(empty.reply.includes('關鍵字') || empty.reply.includes('keyword'));

  console.log('search_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
