/**
 * handler.test.js — V3 路由 + 計算機驗證
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');

const CHAT = 'test-chat';

async function reply(text, chat = CHAT) {
  return (await handleMessage(text, chat)).reply;
}

function reset() {
  clearAllSessions();
}

(async () => {
  reset();

  assert.ok((await reply('=開始')).includes('主選單'));
  assert.strictEqual(getSession(CHAT).osState, 'MENU');

  assert.ok((await reply('1')).includes('計算機已啟動'));
  assert.strictEqual(getSession(CHAT).osState, 'APP_ACTIVE');

  let r = await reply('+500');
  assert.ok(r.includes('目前總計'));
  assert.ok(r.includes('500'));

  r = await reply('+1200');
  assert.ok(r.includes('1700'));

  r = await reply('修改 +1200 +1300');
  assert.ok(r.includes('1800'));

  r = await reply('退回');
  assert.ok(r.includes('500'));

  r = await reply('=結算');
  assert.ok(r.includes('最終結果'));
  assert.ok(r.includes('500'));
  assert.strictEqual(getSession(CHAT).appData.calc.entries.length, 0);

  r = await reply('=結束');
  assert.ok(r.includes('已關閉'));

  reset();
  await reply('=開始');
  r = await reply('+500');
  assert.ok(r.includes('請先選擇'));

  reset();
  assert.strictEqual(await reply('你好'), null);

  reset();
  await reply('=start', 'en-chat');
  r = await reply('1', 'en-chat');
  assert.ok(r.includes('Calculator started'));
  r = await reply('+500', 'en-chat');
  assert.ok(r.startsWith('Current total'));

  reset();
  await reply('=開始');
  await reply('1');
  await reply('+500');
  r = await reply('=結束');
  assert.ok(r.includes('尚未結算'));
  r = await reply('1');
  assert.ok(r.includes('最終結果'));

  console.log('handler.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
