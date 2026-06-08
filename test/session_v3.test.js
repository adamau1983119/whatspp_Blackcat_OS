/**
 * session_v3.test.js — Phase 1 狀態機專項
 */

const assert = require('assert');
const { normalizeCtx, payloadToString } = require('../lib/kernel-sanitizer');
const { parseCommand } = require('../lib/parse');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions, releaseToIdle } = require('../lib/session');
const { executeWithTimeout, DISPATCH_TIMEOUT_MS } = require('../lib/plugin-dispatch');

clearAllSessions();

// sanitizer：髒 JSON → 純字串
const dirty = normalizeCtx({
  text: '=記',
  principalId: 'p1',
  attachment: { hasAttachment: true, payload: { text: 'AI歌詞' } },
});
assert.strictEqual(dirty.attachment.payload, 'AI歌詞');
assert.strictEqual(typeof dirty.attachment.payload, 'string');
assert.strictEqual(payloadToString({ tokens: ['a', 'b'] }), 'ab');

// parse SETTLE
const settle = parseCommand('=結算', 'zh-TW');
assert.strictEqual(settle.type, 'SETTLE');

// GLASS_AUDIO 單鍵 L 丟棄
const audioL = parseCommand('L', 'zh-TW', 'GLASS_AUDIO');
assert.strictEqual(audioL.type, 'UNKNOWN');

clearAllSessions();
handleMessage('=開始', 'v3-1');
assert.strictEqual(getSession('v3-1').osState, 'MENU');
const blocked = handleMessage('+500', 'v3-1').reply;
assert.ok(blocked.includes('請先選擇'));

// plugin-dispatch 8 秒超時
releaseToIdle('timeout-chat');
(async () => {
  const slow = () => new Promise((resolve) => setTimeout(() => resolve({ reply: 'late' }), DISPATCH_TIMEOUT_MS + 200));
  const out = await executeWithTimeout('timeout-chat', 'zh-TW', slow);
  assert.ok(out.reply.includes('逾時'));
  assert.strictEqual(getSession('timeout-chat').osState, 'IDLE');
  console.log('session_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
