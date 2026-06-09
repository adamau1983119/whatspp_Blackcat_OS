/**
 * index.js — WhatsApp 入口（Transport Adapter，Phase 8）
 * message_create + fromMe 過濾 + Quoted Pipeline + sendQueue
 */

require('./lib/wweb-goto-patch').patchWhatsAppGoto();
const { buildCtxFromWhatsApp } = require('./lib/whatsapp-adapter');
const { createClient, hasStoredSession, logBootEnv } = require('./lib/client');
const {
  promptLoginMethod,
  promptPhoneNumber,
  setupQREvents,
  setupPairingEvents,
  setupReadyEvent,
  setupClientDiagnostics,
} = require('./lib/login');
const { handleMessage } = require('./lib/handler');
const { getSession } = require('./lib/session');
const { t } = require('./lib/messages');
const QRCode = require('qrcode');
const {
  startHealthServer,
  setBootStatus,
  setBootError,
  setLatestQr,
  setReady,
  publicQrUrl,
} = require('./lib/health');
const { verifyChromiumLaunch } = require('./lib/preflight');
const { deliverReply, consumeEcho } = require('./lib/send-queue');

function setupMessageCreate(client) {
  client.on('message_create', async (msg) => {
    if (!msg.fromMe) return;
    if (consumeEcho(msg)) return;
    try {
      const ctx = await buildCtxFromWhatsApp(msg);
      console.log('[msg]', ctx.principalId, ctx.text);
      const result = await handleMessage(ctx.text, ctx.principalId, ctx);
      await deliverReply(client, ctx.principalId, result && result.reply);
    } catch (e) {
      console.error('[msg] error:', e);
      try {
        const chatId = String(msg.to || '');
        const locale = getSession(chatId).locale;
        await deliverReply(client, chatId, t(locale, 'calcError'));
      } catch (_) {}
    }
  });
}

async function start() {
  startHealthServer();
  logBootEnv();
  const method = await promptLoginMethod();
  const storedSession = hasStoredSession();

  let pairWithPhoneNumber;
  if (method === 'pairing') {
    pairWithPhoneNumber = await promptPhoneNumber();
  }

  const client = createClient({ pairWithPhoneNumber });
  const needQr = method === 'qr' && !storedSession;

  if (needQr) {
    setupQREvents(client, {
      onQr: async (qr) => {
        try {
          setLatestQr(await QRCode.toDataURL(qr));
          console.log(`[qr] 已更新，請用手機瀏覽器開啟：${publicQrUrl()}`);
        } catch (e) {
          console.error('[qr] 產生失敗：', e);
        }
      },
    });
  } else if (storedSession) {
    setBootStatus('沿用已存 session，正在恢復連線…');
  }
  if (method === 'pairing') setupPairingEvents(client, pairWithPhoneNumber);
  setupReadyEvent(client, () => setReady());
  setupClientDiagnostics(client, {
    onLoading: (pct, msg) => setBootStatus(`WhatsApp 載入中 ${pct}% ${msg || ''}`),
    onAuthFailure: (msg) => setBootError(`auth_failure: ${msg}`),
  });

  setupMessageCreate(client);
  const heartbeat = setInterval(() => {
    console.log('[heartbeat] 仍等待 Chromium 啟動 / 連線…');
  }, 30000);
  const stopHeartbeat = () => clearInterval(heartbeat);
  let initPoll = null;
  const stopInitPoll = () => { if (initPoll) clearInterval(initPoll); };

  if (needQr) {
    client.once('qr', () => { stopHeartbeat(); stopInitPoll(); });
  }
  client.once('ready', () => { stopHeartbeat(); stopInitPoll(); });

  setBootStatus('測試 Chromium 啟動…');
  try {
    await verifyChromiumLaunch();
  } catch (e) {
    stopHeartbeat();
    console.error('[preflight] 失敗：', e);
    setBootError(`Chromium 啟動失敗：${e}`);
    return;
  }
  console.log('[boot] 正在初始化 WhatsApp client…');
  setBootStatus(storedSession ? '沿用 session，正在初始化…' : '正在初始化 WhatsApp client…');
  initPoll = setInterval(() => {
    if (client.pupPage) {
      try {
        console.log('[poll] pupPage url:', client.pupPage.url());
      } catch (_) {
        console.log('[poll] pupPage 存在，讀取 url 失敗');
      }
    } else if (client.pupBrowser) {
      console.log('[poll] pupBrowser 已啟動，等待 pupPage…');
    } else {
      console.log('[poll] 等待 whatsapp-web.js launch browser…');
    }
  }, 20000);
  client.initialize().catch((e) => {
    stopInitPoll();
    stopHeartbeat();
    console.error('[boot] initialize 失敗：', e);
    setBootError(e);
  });
}

if (require.main === module) {
  start();
}

module.exports = {
  setupMessageCreate,
  start,
  buildCtxFromWhatsApp,
  deliverReply,
};
