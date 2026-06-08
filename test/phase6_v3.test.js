/**
 * phase6_v3.test.js — Phase 6 行事曆／相片 OCR／Tools Hub
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');
const { extractTotalFromText } = require('../lib/ocr-total');
const { buildHelpText } = require('../lib/help-list');

(async () => {
  assert.strictEqual(extractTotalFromText('TOTAL 128.50'), 128.5);

  clearAllSessions();
  const help = await handleMessage('=說明', 'p6-help');
  assert.ok(help.reply.includes('指令表') || help.reply.includes('Command'));
  assert.ok(help.reply.includes('=開始') || help.reply.includes('=start'));

  clearAllSessions();
  await handleMessage('=開始', 'p6-menu');
  const zero = await handleMessage('0', 'p6-menu');
  assert.ok(zero.reply.includes('指令') || zero.reply.includes('Command'));

  clearAllSessions();
  await handleMessage('=開始', 'p6-tools');
  const hub = await handleMessage('2', 'p6-tools');
  assert.ok(hub.reply.includes('工具箱') || hub.reply.includes('Tools'));
  assert.strictEqual(getSession('p6-tools').osState, 'TOOLS_HUB');

  await handleMessage('1', 'p6-tools');
  assert.strictEqual(getSession('p6-tools').osState, 'APP_ACTIVE');
  const maps = await handleMessage('銅鑼灣', 'p6-tools');
  assert.ok(maps.reply.includes('maps.apple.com'));
  assert.strictEqual(getSession('p6-tools').osState, 'IDLE');

  clearAllSessions();
  const cal = await handleMessage('=行程', 'p6-cal');
  assert.ok(cal.reply.includes('calendar.google.com'));
  assert.ok(cal.reply.includes('iOS') || cal.reply.includes('行事曆'));
  assert.strictEqual(getSession('p6-cal').osState, 'IDLE');

  clearAllSessions();
  const photo = await handleMessage('', 'p6-photo', {
    attachment: {
      hasAttachment: true,
      type: 'IMAGE',
      payload: 'STORE RECEIPT\nTOTAL 88.00\nTHANK YOU',
    },
  });
  assert.ok(photo.reply.includes('88'));
  assert.strictEqual(getSession('p6-photo').appData.calc.total, 88);
  assert.strictEqual(getSession('p6-photo').osState, 'IDLE');

  const menu = require('../config/menu.json');
  assert.ok(menu.items.length <= 7);
  assert.ok(menu.items.some((i) => i.type === 'GAME_HUB'));

  console.log('phase6_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
