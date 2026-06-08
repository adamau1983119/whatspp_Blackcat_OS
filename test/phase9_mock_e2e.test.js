/**
 * phase9_mock_e2e.test.js — Phase 9 整合測試（mock WhatsApp，v1 計算機 + V3 OS）
 */

const assert = require('assert');
const EventEmitter = require('events');

const { setupMessageCreate } = require('../index');
const { clearAllSessions, getSession } = require('../lib/session');
const { resetSendQueues } = require('../lib/send-queue');

function waitTick() {
  return new Promise((resolve) => setImmediate(resolve));
}

function lastReply(sendByChat, chatId) {
  const list = sendByChat.get(String(chatId)) || [];
  return list.at(-1) || '';
}

async function run() {
  clearAllSessions();
  resetSendQueues();

  const client = new EventEmitter();
  const sendByChat = new Map();

  client.sendMessage = async (chatId, text) => {
    const id = String(chatId);
    if (!sendByChat.has(id)) sendByChat.set(id, []);
    sendByChat.get(id).push(text);
  };

  setupMessageCreate(client);

  async function send(chatId, body, fromMe = true, extra = {}) {
    const hasQuoted = !!extra.hasQuotedMsg;
    client.emit('message_create', {
      fromMe,
      from: 'self@c.us',
      to: String(chatId),
      body,
      hasQuotedMsg: hasQuoted,
      hasMedia: false,
      type: 'chat',
      ...extra,
    });
    await waitTick();
    await waitTick();
    if (hasQuoted || extra.awaitAdapter) {
      await waitTick();
      await waitTick();
    }
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
  assert.ok(lastReply(sendByChat, 'C').includes('算式錯誤'));

  await send('D', '＝開始');
  assert.ok(lastReply(sendByChat, 'D').includes('黑貓 OS'));
  assert.strictEqual(getSession('D').osState, 'MENU');

  await send('E', '=說明');
  const help = lastReply(sendByChat, 'E');
  assert.ok(help.includes('=開始') || help.includes('=start'));

  await send('F', '=地圖 銅鑼灣');
  const maps = lastReply(sendByChat, 'F');
  assert.ok(maps.includes('maps.apple.com'));
  assert.strictEqual(getSession('F').osState, 'IDLE');

  await send('G', '=開始');
  await send('G', '4');
  assert.strictEqual(getSession('G').osState, 'GAME_HUB');
  await send('G', '+500');
  const hubBlock = lastReply(sendByChat, 'G');
  assert.ok(hubBlock.includes('請先選擇') || hubBlock.includes('Pick a menu'));
  assert.strictEqual(getSession('G').osState, 'GAME_HUB');

  await send('H', '=記', true, {
    hasQuotedMsg: true,
    async getQuotedMessage() {
      return { body: 'AI歌詞', type: 'chat' };
    },
  });
  const note = lastReply(sendByChat, 'H');
  assert.ok(note.includes('黑貓備忘錄') || note.includes('Blackcat'));
  assert.strictEqual(getSession('H').appData.notes.length, 1);

  console.log('phase9_mock_e2e.test.js: all tests passed');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
