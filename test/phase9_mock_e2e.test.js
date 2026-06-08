/**
 * phase9_mock_e2e.test.js — V3 整合測試（mock WhatsApp）
 */

const assert = require('assert');
const EventEmitter = require('events');

const { setupMessageCreate } = require('../index');
const { clearAllSessions } = require('../lib/session');

function waitTick() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function run() {
  clearAllSessions();

  const client = new EventEmitter();
  const sendByChat = new Map();

  client.sendMessage = async (chatId, text) => {
    const id = String(chatId);
    if (!sendByChat.has(id)) sendByChat.set(id, []);
    sendByChat.get(id).push(text);
  };

  setupMessageCreate(client);

  async function send(chatId, body, fromMe = true) {
    client.emit('message_create', { fromMe, from: 'self@c.us', to: String(chatId), body });
    await waitTick();
  }

  await send('U1', '你好');
  assert.strictEqual((sendByChat.get('U1') || []).length, 0);

  await send('A', '=開始');
  await send('A', '1');
  await send('A', '+500');

  await send('B', '=start');
  await send('B', '1');
  await send('B', '+500');
  await send('B', '+1200');
  await send('B', '=結算');
  await send('B', '=end');

  const lastB = sendByChat.get('B').at(-1) || '';
  assert.ok(lastB.includes('closed') || lastB.includes('關閉'));

  await send('A', '+1200');
  await send('A', '修改 +1200 +1300');
  await send('A', '退回');
  await send('A', '=結算');
  await send('A', '=結束');

  const lastA = sendByChat.get('A').at(-1) || '';
  assert.ok(lastA.includes('關閉'));

  await send('A', '+500');
  const afterEndA = sendByChat.get('A').at(-1) || '';
  assert.ok(afterEndA.includes('請先輸入'));

  await send('C', '=開始');
  await send('C', '1');
  await send('C', '/0');
  const lastC = sendByChat.get('C').at(-1) || '';
  assert.ok(lastC.includes('算式錯誤'));

  console.log('phase9_mock_e2e.test.js: all tests passed');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
