/**
 * parse.test.js — Phase 2 驗證腳本（語系感知）
 */

const assert = require('assert');
const {
  loadCommands,
  resetCommandsCache,
  normalizeInput,
  parseCommand,
  getAliasHint,
} = require('../lib/parse');

resetCommandsCache();

const cmds = loadCommands();
assert.ok(Array.isArray(cmds.exact) && cmds.exact.length >= 4);
assert.ok(Array.isArray(cmds.prefix) && cmds.prefix.length >= 1);

// START + locale
assert.strictEqual(parseCommand('=開始').type, 'START');
assert.strictEqual(parseCommand('=開始').locale, 'zh-TW');
assert.strictEqual(parseCommand('=start').type, 'START');
assert.strictEqual(parseCommand('=start').locale, 'en');
assert.strictEqual(parseCommand('=시작').type, 'START');
assert.strictEqual(parseCommand('=시작').locale, 'ko');
assert.strictEqual(parseCommand('=demarrer').type, 'START');
assert.strictEqual(parseCommand('=demarrer').locale, 'fr');
assert.strictEqual(parseCommand('=inizia').type, 'START');
assert.strictEqual(parseCommand('=inizia').locale, 'it');
assert.strictEqual(parseCommand('=starten').type, 'START');
assert.strictEqual(parseCommand('=starten').locale, 'de');
assert.strictEqual(parseCommand('=iniciar').type, 'START');
assert.strictEqual(parseCommand('=iniciar').locale, 'pt');
assert.strictEqual(parseCommand('=始める').type, 'START');
assert.strictEqual(parseCommand('=始める').locale, 'ja');

// END + locale
assert.strictEqual(parseCommand('=結束').locale, 'zh-TW');
assert.strictEqual(parseCommand('=end').locale, 'en');
assert.strictEqual(parseCommand('=끝').locale, 'ko');
assert.strictEqual(parseCommand('=fin').locale, 'fr');
assert.strictEqual(parseCommand('=fine').locale, 'it');
assert.strictEqual(parseCommand('=ende').locale, 'de');
assert.strictEqual(parseCommand('=fim').locale, 'pt');
assert.strictEqual(parseCommand('=終了').locale, 'ja');

// OPERATION 沿用 session 語系
assert.strictEqual(parseCommand('+500', 'en').type, 'OPERATION');
assert.strictEqual(parseCommand('+500', 'en').locale, 'en');
assert.strictEqual(parseCommand('+500', 'zh-TW').locale, 'zh-TW');

// UNDO + locale
assert.strictEqual(parseCommand('退回').locale, 'zh-TW');
assert.strictEqual(parseCommand('undo').locale, 'en');
assert.strictEqual(parseCommand('되돌리기').type, 'UNDO');
assert.strictEqual(parseCommand('되돌리기').locale, 'ko');
assert.strictEqual(parseCommand('annuler').type, 'UNDO');
assert.strictEqual(parseCommand('annuler').locale, 'fr');
assert.strictEqual(parseCommand('annulla').type, 'UNDO');
assert.strictEqual(parseCommand('annulla').locale, 'it');
assert.strictEqual(parseCommand('rueckgaengig').type, 'UNDO');
assert.strictEqual(parseCommand('rueckgaengig').locale, 'de');
assert.strictEqual(parseCommand('desfazer').type, 'UNDO');
assert.strictEqual(parseCommand('desfazer').locale, 'pt');
assert.strictEqual(parseCommand('戻る').type, 'UNDO');
assert.strictEqual(parseCommand('戻る').locale, 'ja');

// MODIFY + locale
const m1 = parseCommand('修改 +1200 +1300');
assert.strictEqual(m1.type, 'MODIFY');
assert.strictEqual(m1.locale, 'zh-TW');
const m2 = parseCommand('modify +1200 +1300');
assert.strictEqual(m2.locale, 'en');
const m3 = parseCommand('修正 +1200 +1300');
assert.strictEqual(m3.type, 'MODIFY');
assert.strictEqual(m3.locale, 'ja');

// 別名提示依語系
assert.strictEqual(getAliasHint('START', 'zh-TW'), '=開始');
assert.strictEqual(getAliasHint('START', 'en'), '=start');

// UNKNOWN
assert.strictEqual(parseCommand('你好').type, 'UNKNOWN');

// Normalize：全形輸入
assert.strictEqual(normalizeInput('  ＝開始  '), '=開始');
assert.strictEqual(parseCommand('＝開始').type, 'START');
assert.strictEqual(parseCommand('＝開始').locale, 'zh-TW');
assert.strictEqual(parseCommand('＋500').type, 'OPERATION');
assert.strictEqual(parseCommand('＋500').op, '+');

console.log('parse.test.js: all tests passed');
