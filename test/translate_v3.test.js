/**
 * translate_v3.test.js — Phase 4 真實翻譯
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');
const { resolveTranslateInput } = require('../lib/translate-resolve');

(async () => {
  const parsed = resolveTranslateInput(
    { payload: 'en 你好' },
    { attachment: { hasAttachment: false, payload: '' } },
    { locale: 'zh-TW' }
  );
  assert.strictEqual(parsed.targetLang, 'en');
  assert.strictEqual(parsed.text, '你好');

  clearAllSessions();
  const r = await handleMessage('=翻 en 你好', 'tv1');
  assert.ok(!r.reply.includes('Mock'));
  const okReply =
    r.reply.includes('譯文') ||
    r.reply.includes('Translation') ||
    r.reply.includes('連線') ||
    r.reply.includes('unavailable');
  assert.ok(okReply);
  assert.strictEqual(getSession('tv1').osState, 'IDLE');

  clearAllSessions();
  const quoted = await handleMessage('=翻', 'tv2', {
    attachment: { hasAttachment: true, type: 'TEXT', payload: '早晨' },
  });
  assert.ok(!quoted.reply.includes('Mock'));
  assert.ok(quoted.reply.length > 5);
  assert.strictEqual(getSession('tv2').osState, 'IDLE');

  clearAllSessions();
  const prompt = await handleMessage('=翻', 'tv3');
  assert.ok(prompt.reply.includes('引用') || prompt.reply.includes('Quote'));

  console.log('translate_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
