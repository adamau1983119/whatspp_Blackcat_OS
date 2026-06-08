/**
 * health.js — Railway 健康檢查 + 網頁 QR（用手機瀏覽器掃描）
 */

const http = require('http');

let latestQrDataUrl = null;
let botReady = false;
let bootStatus = '正在啟動 Chromium（首次約 1–2 分鐘）…';
let bootError = null;
const startedAt = Date.now();

/** 更新啟動狀態（顯示喺等待頁） */
function setBootStatus(msg) {
  bootStatus = msg;
  bootError = null;
}

/** 啟動失敗訊息 */
function setBootError(msg) {
  bootError = String(msg);
}

/** 更新網頁顯示的 QR 圖 */
function setLatestQr(dataUrl) {
  latestQrDataUrl = dataUrl;
  botReady = false;
  bootError = null;
}

/** 登入完成後顯示就緒頁 */
function setReady() {
  botReady = true;
  latestQrDataUrl = null;
}

/** 公開掃碼網址 */
function publicQrUrl() {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/`;
  const port = Number(process.env.PORT) || 3000;
  return `http://localhost:${port}/`;
}

function buildHtml() {
  if (botReady) {
    return '<!DOCTYPE html><html><body><h2>WhatsApp 機器人已就緒 ✅</h2></body></html>';
  }
  if (bootError) {
    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8">',
      '<meta http-equiv="refresh" content="10"></head><body>',
      '<h2>啟動失敗 ❌</h2>',
      `<pre>${bootError}</pre>`,
      '<p>請查看 Railway Deploy Logs</p>',
      '</body></html>',
    ].join('');
  }
  if (!latestQrDataUrl) {
    const sec = Math.floor((Date.now() - startedAt) / 1000);
    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8">',
      '<meta http-equiv="refresh" content="3">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
      '</head><body style="font-family:sans-serif;padding:1rem">',
      '<h2>等待 QR Code…</h2>',
      `<p>${bootStatus}</p>`,
      `<p>已等待 ${sec} 秒（頁面每 3 秒自動重新整理）</p>`,
      '<p>首次啟動 Chromium 可能需要 1–2 分鐘</p>',
      '</body></html>',
    ].join('');
  }
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<meta http-equiv="refresh" content="15">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>WhatsApp QR</title></head>',
    '<body style="text-align:center;font-family:sans-serif">',
    '<h2>用手機 WhatsApp 掃描</h2>',
    `<img src="${latestQrDataUrl}" alt="QR" style="max-width:90vw">`,
    '<p>設定 → 已連結的裝置 → 連結裝置</p>',
    '<p>QR 約 20 秒更新，頁面會自動重新整理</p>',
    '</body></html>',
  ].join('');
}

/** 啟動 HTTP 伺服器（健康檢查 + QR 頁） */
function startHealthServer() {
  const port = Number(process.env.PORT) || 3000;
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildHtml());
  });
  server.listen(port, () => {
    console.log(`[health] listening on ${port}`);
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      console.log(`[qr] 用手機瀏覽器開啟掃描：${publicQrUrl()}`);
    } else {
      console.log('[qr] 請在 Railway Settings → Networking 產生 Public Domain');
    }
  });
  return server;
}

module.exports = {
  startHealthServer,
  setBootStatus,
  setBootError,
  setLatestQr,
  setReady,
  publicQrUrl,
};
