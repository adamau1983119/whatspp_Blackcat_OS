/**
 * handler.test.js — V3 路由 + 計算機驗證
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');

const CHAT = 'test-chat';

function reply(text, chat = CHAT) {
  return handleMessage(text, chat).reply;
}

function reset() {
  clearAllSessions();
}

reset();

// =開始 → 主選單（非直接開計算機）
assert.ok(reply('=開始').includes('主選單'));
assert.strictEqual(getSession(CHAT).osState, 'MENU');

// 選 1 進計算機
assert.ok(reply('1').includes('計算機已啟動'));
assert.strictEqual(getSession(CHAT).osState, 'APP_ACTIVE');

let r = reply('+500');
assert.ok(r.includes('目前總計'));
assert.ok(r.includes('500'));

r = reply('+1200');
assert.ok(r.includes('1700'));

r = reply('修改 +1200 +1300');
assert.ok(r.includes('1800'));

r = reply('退回');
assert.ok(r.includes('500'));

// =結算
r = reply('=結算');
assert.ok(r.includes('最終結果'));
assert.ok(r.includes('500'));
assert.strictEqual(getSession(CHAT).appData.calc.entries.length, 0);

// =結束（無帳本）
r = reply('=結束');
assert.ok(r.includes('已關閉'));

// 未進計算機運算
reset();
reply('=開始');
r = reply('+500');
assert.ok(r.includes('請先選擇'));

// 未知指令
reset();
assert.strictEqual(reply('你好'), null);

// 英文
reset();
reply('=start', 'en-chat');
r = reply('1', 'en-chat');
assert.ok(r.includes('Calculator started'));
r = reply('+500', 'en-chat');
assert.ok(r.startsWith('Current total'));

// PROMPT_GUARD
reset();
reply('=開始');
reply('1');
reply('+500');
r = reply('=結束');
assert.ok(r.includes('尚未結算'));
r = reply('1');
assert.ok(r.includes('最終結果'));

reset();
console.log('handler.test.js: all tests passed');
