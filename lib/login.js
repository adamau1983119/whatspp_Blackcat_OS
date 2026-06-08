/**
 * login.js — 登入流程與終端機互動（readline + QR / 配對碼）
 */

const readline = require('readline');
const qrcode = require('qrcode-terminal');

const LOGIN_MENU = [
  '請選擇登入方式：',
  '  1. 掃描 QR Code（需電腦螢幕）',
  '  2. 電話號碼配對碼（只需 iPhone）',
  '請輸入 1 或 2：',
].join('\n');

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve((answer || '').trim()));
  });
}

/** 雲端部署：LOGIN_METHOD=qr|pairing|1|2 */
function loginMethodFromEnv() {
  const v = (process.env.LOGIN_METHOD || '').trim().toLowerCase();
  if (v === '2' || v === 'pairing') return 'pairing';
  if (v === '1' || v === 'qr') return 'qr';
  return null;
}

/** 雲端部署：PHONE_NUMBER=國際格式數字（不含 + 或空格） */
function phoneFromEnv() {
  const v = (process.env.PHONE_NUMBER || '').trim();
  return v ? v.replace(/\D/g, '') : null;
}

/** 非互動環境（Railway）缺變數時自動 QR 或提示 */
function failIfNonInteractiveWithoutConfig(hasRl) {
  if (process.stdin.isTTY || hasRl) return;
  if (phoneFromEnv()) {
    console.log('[auto] 非互動環境 + PHONE_NUMBER → 配對碼登入');
    return 'pairing';
  }
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('[auto] Railway 環境 → QR 登入（瀏覽器掃描）');
    return 'qr';
  }
  console.error('[error] 雲端部署請在 Railway Variables 設定：');
  console.error('  LOGIN_METHOD=qr（建議，瀏覽器掃碼）');
  console.error('  或 LOGIN_METHOD=pairing + PHONE_NUMBER=852xxxxxxxx');
  process.exit(1);
}

/** readline 選單：1 = QR、2 = 配對碼；有環境變數則跳過互動 */
async function promptLoginMethod(rl) {
  const fromEnv = loginMethodFromEnv();
  if (fromEnv) {
    console.log(`[env] 登入方式：${fromEnv === 'pairing' ? '配對碼' : 'QR'}`);
    return fromEnv;
  }
  const auto = failIfNonInteractiveWithoutConfig(rl);
  if (auto) return auto;
  const iface = rl || readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ownsRl = !rl;
  const answer = await ask(iface, LOGIN_MENU);
  if (ownsRl) iface.close();
  return answer === '2' ? 'pairing' : 'qr';
}

/** 選 2 時提示輸入國際格式電話號碼；有 PHONE_NUMBER 則跳過互動 */
async function promptPhoneNumber(rl) {
  const fromEnv = phoneFromEnv();
  if (fromEnv) {
    console.log(`[env] 電話號碼：${fromEnv}`);
    return fromEnv;
  }
  const iface = rl || readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ownsRl = !rl;
  const raw = await ask(iface, '請輸入電話號碼（國際格式，不含 + 或空格）：');
  if (ownsRl) iface.close();
  return raw.replace(/\D/g, '');
}

/** QR 模式：終端機 ASCII + 可選 onQr（網頁 QR） */
function setupQREvents(client, opts = {}) {
  const normalized = typeof opts === 'function' ? { qrRender: opts } : opts;
  const { qrRender = qrcode.generate, onQr } = normalized;
  client.on('qr', (qr) => {
    qrRender(qr, { small: true });
    if (onQr) onQr(qr);
  });
}

/** 配對碼模式：監聽 code，輸出 8 位配對碼 */
function setupPairingEvents(client, phone) {
  client.on('code', (code) => {
    console.log('========================================');
    console.log(`【配對碼】${code}`);
    console.log('⚠️  手機要輸入上面呢串英文字母，唔係電話號碼！');
    console.log(`    （帳號電話：${phone}，只供對照，唔好輸入）`);
    console.log('    手機路徑：設定 → 已連結的裝置 → 以電話號碼連結');
    console.log('========================================');
  });
}

/** 登入成功：輸出「機器人已就緒」 */
function setupReadyEvent(client, onReady) {
  client.on('ready', () => {
    console.log('機器人已就緒');
    if (onReady) onReady();
  });
}

/** 雲端除錯：輸出 auth / 斷線 / 載入進度 */
function setupClientDiagnostics(client, hooks = {}) {
  const { onLoading, onAuthFailure } = hooks;
  client.on('auth_failure', (msg) => {
    console.error('[auth_failure]', msg);
    if (onAuthFailure) onAuthFailure(msg);
  });
  client.on('disconnected', (reason) => console.error('[disconnected]', reason));
  client.on('loading_screen', (pct, msg) => {
    console.log(`[loading] ${pct}% ${msg || ''}`);
    if (onLoading) onLoading(pct, msg);
  });
}

module.exports = {
  promptLoginMethod,
  promptPhoneNumber,
  setupQREvents,
  setupPairingEvents,
  setupReadyEvent,
  setupClientDiagnostics,
};
