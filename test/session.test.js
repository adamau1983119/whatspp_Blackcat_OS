/**
 * session.test.js — V3 session 結構驗證
 */

const assert = require('assert');
const { addEntry } = require('../lib/calc');
const {
  getSession,
  startSession,
  endSession,
  enterMenu,
  clearAllSessions,
  hasCalcEntries,
} = require('../lib/session');

clearAllSessions();

const s0 = getSession('chat-1');
assert.strictEqual(s0.osState, 'IDLE');
assert.strictEqual(s0.appData.calc.total, 0);
assert.deepStrictEqual(s0.appData.calc.entries, []);
assert.strictEqual(s0.meta.activeSource, 'WHATSAPP');

startSession('A', 'zh-TW');
startSession('B', 'en');
const a = getSession('A');
const b = getSession('B');
assert.strictEqual(a.locale, 'zh-TW');
assert.strictEqual(b.locale, 'en');
assert.notStrictEqual(a, b);

a.appData.calc.entries.push({ op: '+', value: 99, raw: '+99' });
a.appData.calc.total = 99;
startSession('A', 'zh-TW');
assert.strictEqual(getSession('A').osState, 'APP_ACTIVE');
assert.strictEqual(getSession('A').appData.calc.total, 0);

startSession('en-chat', 'en');
const en = getSession('en-chat');
const added = addEntry(en.appData.calc.entries, { op: '+', value: 500, raw: '+500' });
en.appData.calc.entries = added.entries;
en.appData.calc.total = added.total;
assert.strictEqual(en.locale, 'en');
assert.strictEqual(en.appData.calc.total, 500);

const ended = endSession('en-chat');
assert.strictEqual(ended.total, 500);
assert.strictEqual(ended.locale, 'en');
assert.strictEqual(ended.wasActive, true);
const after = getSession('en-chat');
assert.strictEqual(after.osState, 'IDLE');
assert.strictEqual(after.appData.calc.total, 0);

// enterMenu 保留帳本
clearAllSessions();
const hang = getSession('hang-1');
hang.appData.calc.entries.push({ op: '+', value: 10, raw: '+10' });
hang.appData.calc.total = 10;
enterMenu('hang-1');
assert.strictEqual(getSession('hang-1').osState, 'MENU');
assert.ok(hasCalcEntries(getSession('hang-1')));

clearAllSessions();
console.log('session.test.js: all tests passed');
