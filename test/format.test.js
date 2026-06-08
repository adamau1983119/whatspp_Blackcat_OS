/**
 * format.test.js — Phase 1 驗證腳本（含多語系）
 */

const assert = require('assert');
const {
  formatNumber,
  formatTrajectory,
  formatResult,
  formatFinal,
  formatStarted,
} = require('../lib/format');

assert.strictEqual(formatNumber(500), '500');
assert.strictEqual(formatNumber(1.5), '1.5');

assert.strictEqual(formatTrajectory([]), '0');
assert.strictEqual(
  formatTrajectory([{ op: '+', value: 500 }, { op: '+', value: 1200 }]),
  '0 + 500 + 1200'
);

// 預設語系 zh-TW
assert.strictEqual(
  formatResult({ total: 1700, entries: [{ op: '+', value: 500 }, { op: '+', value: 1200 }] }),
  '目前總計：1700\n計算軌跡：0 + 500 + 1200'
);

// 英文語系
assert.strictEqual(
  formatResult(
    { total: 1700, entries: [{ op: '+', value: 500 }, { op: '+', value: 1200 }] },
    'en'
  ),
  'Current total：1700\nHistory：0 + 500 + 1200'
);

assert.strictEqual(formatFinal(425), '最終結果：425');
assert.strictEqual(formatFinal(425, 'en'), 'Final result：425');
assert.ok(formatStarted('zh-TW').includes('計算機'));
assert.ok(formatStarted('en').includes('Calculator'));

console.log('format.test.js: all tests passed');
