'use strict';

const { extractTotalFromText } = require('./ocr-total');

/** 執行 OCR：IMAGE base64 用 tesseract；純文字 payload 直接解析 */
async function recognizeReceiptText(ctx) {
  const att = ctx.attachment || {};
  const payload = String(att.payload || '').trim();
  const caption = String(ctx.text || '').trim();

  if (att.type === 'IMAGE' && payload) {
    if (payload.length < 800 && /TOTAL|總計|合計|AMOUNT/i.test(payload)) {
      return payload;
    }
    try {
      const Tesseract = require('tesseract.js');
      const buf = Buffer.from(payload, 'base64');
      const { data } = await Tesseract.recognize(buf, 'eng+chi_tra', { logger: () => {} });
      if (data?.text) return data.text;
    } catch (_) {
      /* fallback caption */
    }
  }

  if (caption) return caption;
  return payload;
}

async function extractTotalFromCtx(ctx) {
  const text = await recognizeReceiptText(ctx);
  return extractTotalFromText(text);
}

module.exports = { recognizeReceiptText, extractTotalFromCtx };
