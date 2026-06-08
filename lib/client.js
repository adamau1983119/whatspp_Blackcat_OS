/**
 * client.js — 建立 WhatsApp Client 實例（LocalAuth + headless）
 */

const path = require('path');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');

/** 固定於專案根目錄（本機與 Railway /app 一致） */
const AUTH_DATA_PATH = path.resolve(process.cwd(), '.wwebjs_auth');

const STEALTH_USER_AGENT = process.env.PUPPETEER_USER_AGENT
  || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const WEBGL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader'];

function getStealthArgs(extra = []) {
  return [`--user-agent=${STEALTH_USER_AGENT}`, ...WEBGL_ARGS, ...extra];
}

function getContainerPuppeteerDefaults() {
  const inContainer = !!(
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.PUPPETEER_NO_SANDBOX ||
    process.env.DOCKER
  );
  if (!inContainer) return { args: getStealthArgs() };
  return {
    timeout: 180000,
    args: getStealthArgs([
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
    ]),
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      || puppeteer.executablePath(),
  };
}

/** PUPPETEER_HEADLESS=false 本機掃碼；雲端預設 true */
function resolveHeadless() {
  const v = (process.env.PUPPETEER_HEADLESS || 'true').trim().toLowerCase();
  if (v === 'false' || v === '0') return false;
  if (v === 'new') return 'new';
  return true;
}

/** WEB_VERSION / WEB_VERSION_CACHE_TYPE 鎖定 WA Web 版本（專家特效藥） */
function getWebVersionOptions() {
  const webVersion = (process.env.WEB_VERSION || '').trim();
  if (!webVersion) return {};
  const cacheType = (process.env.WEB_VERSION_CACHE_TYPE || 'none').trim().toLowerCase();
  const opts = { webVersion };
  if (cacheType === 'remote' && process.env.WEB_VERSION_CACHE_REMOTE) {
    opts.webVersionCache = {
      type: 'remote',
      remotePath: process.env.WEB_VERSION_CACHE_REMOTE,
    };
  } else if (cacheType === 'local') {
    opts.webVersionCache = { type: 'local' };
  } else {
    opts.webVersionCache = { type: 'none' };
  }
  return opts;
}

/** Volume／本機是否已有 LocalAuth session */
function hasStoredSession() {
  try {
    if (!fs.existsSync(AUTH_DATA_PATH)) return false;
    return fs.readdirSync(AUTH_DATA_PATH).length > 0;
  } catch (_) {
    return false;
  }
}

function createClient(options = {}) {
  const {
    clientId = 'default',
    pairWithPhoneNumber,
    puppeteer: puppeteerOverrides = {},
    ...rest
  } = options;

  const containerDefaults = getContainerPuppeteerDefaults();
  const clientOptions = {
    authStrategy: new LocalAuth({ clientId, dataPath: AUTH_DATA_PATH }),
    authTimeoutMs: 120000,
    ...getWebVersionOptions(),
    puppeteer: {
      ...containerDefaults,
      ...puppeteerOverrides,
      args: [
        ...new Set([
          ...(containerDefaults.args || []),
          ...(puppeteerOverrides.args || []),
        ]),
      ],
      headless: puppeteerOverrides.headless ?? resolveHeadless(),
    },
    ...rest,
  };

  if (pairWithPhoneNumber) {
    clientOptions.pairWithPhoneNumber = typeof pairWithPhoneNumber === 'string'
      ? { phoneNumber: pairWithPhoneNumber }
      : pairWithPhoneNumber;
  }

  return new Client(clientOptions);
}

function logBootEnv() {
  console.log(`[env] PUPPETEER_HEADLESS=${resolveHeadless()}`);
  console.log(`[env] auth path: ${AUTH_DATA_PATH}`);
  if (process.env.WEB_VERSION) console.log(`[env] WEB_VERSION=${process.env.WEB_VERSION}`);
  if (hasStoredSession()) {
    console.log('[auth] 偵測到已存 session → 沿用憑證，跳過新 QR');
  }
}

module.exports = {
  createClient,
  AUTH_DATA_PATH,
  STEALTH_USER_AGENT,
  resolveHeadless,
  hasStoredSession,
  logBootEnv,
};
