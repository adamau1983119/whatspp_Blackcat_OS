/**
 * handler_v3_smoke.test.js — Phase 2+ 插件冒煙測試
 */

const assert = require('assert');
const { handleMessage } = require('../lib/handler');
const { getSession, clearAllSessions } = require('../lib/session');
const { parsePluginPrefix } = require('../lib/parse');
const { buildUrls } = require('../lib/plugins/maps');

function replyOf(r) {
  return r && r.reply != null ? String(r.reply) : '';
}

(async () => {
  clearAllSessions();

  const ft = parsePluginPrefix('=地圖 銅鑼灣');
  assert.strictEqual(ft.type, 'SYS_MAPS');
  assert.strictEqual(ft.payload, '銅鑼灣');

  const urls = buildUrls('銅鑼灣時代廣場');
  assert.ok(urls.appleMapsUrl.includes('maps.apple.com'));
  assert.ok(urls.googleMapsUrl.includes('google.com/maps'));
  assert.ok(urls.appleMapsUrl.includes('%'));

  clearAllSessions();
  const menuReply = replyOf(await handleMessage('=開始', 'smoke-1'));
  assert.ok(menuReply.includes('黑貓 OS'));
  assert.strictEqual(getSession('smoke-1').osState, 'MENU');

  const toolsHub = replyOf(await handleMessage('2', 'smoke-1'));
  assert.ok(toolsHub.includes('工具箱') || toolsHub.includes('Tools'));
  assert.strictEqual(getSession('smoke-1').osState, 'TOOLS_HUB');

  await handleMessage('1', 'smoke-1');
  assert.strictEqual(getSession('smoke-1').osState, 'APP_ACTIVE');

  const mapsResult = replyOf(await handleMessage('時代廣場', 'smoke-1'));
  assert.ok(mapsResult.includes('maps.apple.com'));
  assert.ok(mapsResult.includes('google.com/maps'));
  assert.strictEqual(getSession('smoke-1').osState, 'IDLE');

  clearAllSessions();
  const fast = replyOf(await handleMessage('=地圖 銅鑼灣', 'smoke-2'));
  assert.ok(fast.includes('maps.apple.com'));
  assert.ok(fast.includes('google.com/maps'));
  assert.strictEqual(getSession('smoke-2').osState, 'IDLE');

  clearAllSessions();
  await handleMessage('=開始', 'smoke-3');
  const tr = replyOf(await handleMessage('3', 'smoke-3'));
  assert.ok(tr.includes('翻譯') || tr.includes('Translate'));
  assert.ok(!tr.includes('Mock'));
  assert.strictEqual(getSession('smoke-3').osState, 'IDLE');

  clearAllSessions();
  await handleMessage('=開始', 'smoke-4');
  const hub = replyOf(await handleMessage('4', 'smoke-4'));
  assert.ok(hub.includes('遊戲') || hub.includes('Game'));
  assert.strictEqual(getSession('smoke-4').osState, 'GAME_HUB');

  const blocked = replyOf(await handleMessage('+500', 'smoke-4'));
  assert.ok(blocked.includes('請先選擇') || blocked.includes('Pick a menu'));
  assert.strictEqual(getSession('smoke-4').osState, 'GAME_HUB');

  console.log('handler_v3_smoke.test.js: all tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
