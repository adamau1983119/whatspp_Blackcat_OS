/**
 * notes_v3.test.js — Phase 3 黑貓備忘錄
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');
const { buildCtxFromWhatsApp } = require('../lib/whatsapp-adapter');

(async () => {
  clearAllSessions();

  const r1 = await handleMessage('=記', 'n1', {
    source: 'WHATSAPP',
    attachment: { hasAttachment: true, type: 'TEXT', payload: 'AI歌詞' },
  });
  assert.ok(r1.reply.includes('黑貓備忘錄'));
  assert.strictEqual(getSession('n1').appData.notes.length, 1);
  assert.strictEqual(getSession('n1').appData.notes[0].text, 'AI歌詞');
  assert.strictEqual(getSession('n1').osState, 'IDLE');
  assert.ok(!r1.reply.includes('iOS'));

  clearAllSessions();
  const r2 = await handleMessage('=記', 'n2');
  assert.ok(r2.reply.includes('引用') || r2.reply.includes('Quote'));
  assert.strictEqual(getSession('n2').appData.notes.length, 0);

  clearAllSessions();
  const r3 = await handleMessage('=筆記 買鮮奶', 'n3');
  assert.ok(r3.reply.includes('黑貓備忘錄'));
  assert.strictEqual(getSession('n3').appData.notes[0].text, '買鮮奶');
  assert.strictEqual(getSession('n3').osState, 'IDLE');

  const ctx = await buildCtxFromWhatsApp({
    to: 'n4',
    body: '=記',
    hasQuotedMsg: true,
    getQuotedMessage: async () => ({ body: '引用內容', type: 'chat' }),
  });
  assert.strictEqual(ctx.attachment.payload, '引用內容');
  assert.strictEqual(ctx.attachment.type, 'TEXT');
  assert.strictEqual(ctx.attachment.hasAttachment, true);

  clearAllSessions();
  await handleMessage(ctx.text, ctx.principalId, ctx);
  assert.strictEqual(getSession('n4').appData.notes.length, 1);
  assert.strictEqual(getSession('n4').appData.notes[0].text, '引用內容');

  console.log('notes_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
