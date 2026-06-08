/**
 * phase5_v3.test.js — Phase 5 郵件／待辦／提醒
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');
const { buildMailtoUrl } = require('../lib/mailto');
const { parseReminderText } = require('../lib/time-parse');
const { buildCalendarTemplateUrl } = require('../lib/calendar-url');

(async () => {
  const mailto = buildMailtoUrl('test@example.com', 'Hi', 'Body');
  assert.ok(mailto.startsWith('mailto:'));
  assert.ok(mailto.includes('subject='));

  const parsed = parseReminderText('15分鐘後開會');
  assert.ok(parsed);
  assert.strictEqual(parsed.event, '開會');

  const cal = buildCalendarTemplateUrl('開會', parsed.start, parsed.end);
  assert.ok(cal.includes('calendar.google.com'));

  clearAllSessions();
  const mail = await handleMessage('=email 寄給小明：週報已附上', 'p5-mail');
  assert.ok(mail.reply.includes('mailto:'));
  assert.strictEqual(getSession('p5-mail').osState, 'IDLE');
  assert.ok(!mail.reply.includes('保證送達') || mail.reply.includes('不保證'));

  clearAllSessions();
  const todo = await handleMessage('=待辦 晚上8點洗衣服', 'p5-todo');
  assert.ok(todo.reply.includes('待辦'));
  assert.ok(todo.reply.includes('calendar.google.com') || todo.reply.includes('行事曆'));
  assert.strictEqual(getSession('p5-todo').appData.todos.length, 1);
  assert.strictEqual(getSession('p5-todo').osState, 'IDLE');

  clearAllSessions();
  await handleMessage('=待辦 買牛奶', 'p5-todo2');
  const list = await handleMessage('=看待辦', 'p5-todo2');
  assert.ok(list.reply.includes('買牛奶'));

  clearAllSessions();
  const clock = await handleMessage('=提醒我 15分鐘後開會', 'p5-clock');
  assert.ok(clock.reply.includes('calendar.google.com'));
  assert.ok(clock.reply.includes('iPhone') || clock.reply.includes('iOS'));
  assert.ok(!clock.reply.includes('已為你設定提醒'));
  assert.strictEqual(getSession('p5-clock').osState, 'IDLE');

  const clockRaw = require('fs').readFileSync(
    require('path').join(__dirname, '../lib/plugins/clock.js'),
    'utf-8'
  );
  const clockCode = clockRaw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  assert.ok(!clockCode.includes('setTimeout'));

  console.log('phase5_v3.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
