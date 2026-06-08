/**
 * wweb-goto-patch.js — 修正 whatsapp-web.js page.goto 無限等待 load 事件
 */

const { Page } = require('puppeteer');

/** 將 web.whatsapp.com 導向改為 domcontentloaded + 120s 逾時 */
function patchWhatsAppGoto() {
  if (Page.prototype.__wwebGotoPatched) return;
  const origGoto = Page.prototype.goto;
  Page.prototype.goto = async function patchedGoto(url, options = {}) {
    if (typeof url === 'string' && url.includes('web.whatsapp.com')) {
      return origGoto.call(this, url, {
        ...options,
        waitUntil: 'domcontentloaded',
        timeout: options.timeout === 0 ? 120000 : (options.timeout || 120000),
      });
    }
    return origGoto.call(this, url, options);
  };
  Page.prototype.__wwebGotoPatched = true;
}

module.exports = {
  patchWhatsAppGoto,
};
