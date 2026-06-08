/**
 * preflight.js — 啟動前測試 Chromium 能否正常 launch
 */

const puppeteer = require('puppeteer');

const { STEALTH_USER_AGENT } = require('./client');

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  `--user-agent=${STEALTH_USER_AGENT}`,
  '--use-gl=angle',
  '--use-angle=swiftshader',
];

/** 90 秒內測試 Chrome；失敗則拋錯 */
async function verifyChromiumLaunch() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    || puppeteer.executablePath();
  console.log('[preflight] chrome:', executablePath);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: LAUNCH_ARGS,
    timeout: 90000,
  });
  try {
    const page = await browser.newPage();
    await page.goto('about:blank', { timeout: 30000 });
    console.log('[preflight] Chromium 啟動成功');
  } finally {
    await browser.close();
  }
}

module.exports = {
  verifyChromiumLaunch,
};
