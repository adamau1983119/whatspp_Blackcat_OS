/**
 * phase7_v3.test.js — Phase 7 遊戲合流 + WhatsApp 連線層冒煙測試
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');
const { createClient } = require('../lib/client');

function replyOf(r) {
  return r && r.reply != null ? String(r.reply) : '';
}

(async () => {
  clearAllSessions();
  await handleMessage('=開始', 'p7a');
  await handleMessage('4', 'p7a');
  assert.strictEqual(getSession('p7a').osState, 'GAME_HUB');

  const start = replyOf(await handleMessage('1', 'p7a'));
  assert.ok(start.includes('泡泡龍') || start.includes('Bubble'));
  assert.strictEqual(getSession('p7a').osState, 'GAME_PLAYING');
  assert.strictEqual(getSession('p7a').currentGame, 'BUBBLE');

  const calcBlocked = replyOf(await handleMessage('+500', 'p7a'));
  assert.ok(calcBlocked.includes('L') || calcBlocked.includes('F'));
  assert.strictEqual(getSession('p7a').osState, 'GAME_PLAYING');
  assert.strictEqual(getSession('p7a').appData.calc.total, 0);

  const afterL = replyOf(await handleMessage('L', 'p7a'));
  assert.ok(afterL.includes('Score') || afterL.includes('分數') || afterL.includes('🐱'));
  assert.strictEqual(getSession('p7a').osState, 'GAME_PLAYING');

  await handleMessage('=開始', 'p7a');
  assert.strictEqual(getSession('p7a').osState, 'GAME_HUB');

  const client = createClient();
  assert.ok(client && typeof client.initialize === 'function');

  console.log('phase7_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
