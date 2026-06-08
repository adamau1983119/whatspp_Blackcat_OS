/**
 * calc.test.js — Phase 3 驗證腳本
 */

const assert = require('assert');
const {
  DIV_BY_ZERO,
  NOT_FOUND,
  recalculate,
  addEntry,
  undoEntry,
  modifyEntry,
} = require('../lib/calc');

const e500 = { op: '+', value: 500, raw: '+500' };
const e1200 = { op: '+', value: 1200, raw: '+1200' };
const e1300 = { op: '+', value: 1300, raw: '+1300' };

// +500 → 500
let r = addEntry([], e500);
assert.strictEqual(r.total, 500);
assert.strictEqual(r.entries.length, 1);

// +1200 → 1700
r = addEntry(r.entries, e1200);
assert.strictEqual(r.total, 1700);

// 修改 +1200 +1300 → 1800
r = modifyEntry(r.entries, '+1200', e1300);
assert.strictEqual(r.total, 1800);
assert.strictEqual(recalculate(r.entries), 1800);

// 退回 → 500
r = undoEntry(r.entries);
assert.strictEqual(r.total, 500);
assert.strictEqual(r.entries.length, 1);

// recalculate 空陣列
assert.strictEqual(recalculate([]), 0);

// 除以零
assert.throws(
  () => recalculate([{ op: '/', value: 0, raw: '/0' }]),
  (err) => err.message === DIV_BY_ZERO
);

// 找不到舊步驟
assert.throws(
  () => modifyEntry([e500], '+999', e1300),
  (err) => err.message === NOT_FOUND
);

console.log('calc.test.js: all tests passed');
