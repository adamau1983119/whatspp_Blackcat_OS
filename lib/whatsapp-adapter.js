'use strict';

/**
 * whatsapp-adapter.js — WhatsApp Transport：msg → 中立 ctx
 * getQuotedMessage / downloadMedia 僅在此 await
 */

const { SOURCE, ATTACHMENT_TYPE } = require('./ctx-contract');

/** @param {object} msg whatsapp-web.js Message */
async function buildCtxFromWhatsApp(msg) {
  const principalId = String(msg.to || '');
  const text = String(msg.body || '').trim();
  const attachment = { hasAttachment: false, type: ATTACHMENT_TYPE.TEXT, payload: '' };

  if (msg.hasQuotedMsg && typeof msg.getQuotedMessage === 'function') {
    try {
      const quoted = await msg.getQuotedMessage();
      const quotedBody = String(quoted?.body || '').trim();
      if (quotedBody) {
        attachment.hasAttachment = true;
        attachment.type = quoted?.type === 'image' ? ATTACHMENT_TYPE.IMAGE : ATTACHMENT_TYPE.TEXT;
        attachment.payload = quotedBody;
      }
    } catch (_) {
      /* 引用讀取失敗 */
    }
  }

  if (!attachment.hasAttachment && msg.hasMedia && msg.type === 'image') {
    try {
      if (typeof msg.downloadMedia === 'function') {
        const media = await msg.downloadMedia();
        if (media?.data) {
          attachment.hasAttachment = true;
          attachment.type = ATTACHMENT_TYPE.IMAGE;
          attachment.payload = String(media.data);
        }
      }
    } catch (_) {
      /* 圖片下載失敗 */
    }
  }

  return {
    source: SOURCE.WHATSAPP,
    principalId,
    text,
    attachment,
  };
}

module.exports = { buildCtxFromWhatsApp };
