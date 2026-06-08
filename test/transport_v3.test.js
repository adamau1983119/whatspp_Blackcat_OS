/**
 * transport_v3.test.js — Phase 8 WhatsApp Transport 冒煙測試
 */

const assert = require('assert');
const EventEmitter = require('events');
const { setupMessageCreate, deliverReply } = require('../index');
const { buildCtxFromWhatsApp } = require('../lib/whatsapp-adapter');
const { enqueueSend, resetSendQueues } = require('../lib/send-queue');
const { clearAllSessions } = require('../lib/session');

function waitTick() {
  return new Promise((resolve) => setImmediate(resolve));
}

(async () => {
  clearAllSessions();
  resetSendQueues();

  const ctx = await buildCtxFromWhatsApp({
    to: 't1',
    body: '=記',
    hasQuotedMsg: true,
    async getQuotedMessage() {
      return { body: '引用內容', type: 'chat' };
    },
  });
  assert.strictEqual(ctx.attachment.payload, '引用內容');
  assert.strictEqual(ctx.attachment.type, 'TEXT');

  const client = new EventEmitter();
  const sent = [];
  client.sendMessage = async (chatId, text) => {
    sent.push({ chatId, text });
  };
  setupMessageCreate(client);

  client.emit('message_create', { fromMe: false, to: 't2', body: '=開始' });
  await waitTick();
  assert.strictEqual(sent.length, 0);

  client.emit('message_create', {
    fromMe: true,
    to: 't2',
    body: '=開始',
    hasQuotedMsg: false,
  });
  await waitTick();
  await waitTick();
  assert.ok(sent.length >= 1);
  assert.ok(sent[0].text.includes('黑貓 OS') || sent[0].text.includes('Blackcat'));

  resetSendQueues();
  const order = [];
  const mockClient = { sendMessage: async () => { order.push('done'); } };
  const p1 = deliverReply(mockClient, 'q1', 'a');
  const p2 = deliverReply(mockClient, 'q1', 'b');
  await Promise.all([p1, p2]);
  assert.strictEqual(order.length, 2);

  console.log('transport_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
