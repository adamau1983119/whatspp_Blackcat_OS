'use strict';

/** 解析 =翻 [語言] [文字] 或引用＋語言 */
function defaultTargetLang(session) {
  const loc = session.locale || 'zh-TW';
  return loc.startsWith('zh') ? 'en' : 'zh-TW';
}

function parseLangToken(token) {
  return /^[a-z]{2}(-[a-z]{2})?$/i.test(String(token || ''));
}

function resolveTranslateInput(cmd, ctx, session) {
  const payload = String(cmd.payload || '').trim();
  if (ctx.attachment?.hasAttachment && ctx.attachment.payload) {
    const text = String(ctx.attachment.payload).trim();
    if (!text) return null;
    const parts = payload.split(/\s+/).filter(Boolean);
    const targetLang = parts[0] && parseLangToken(parts[0]) ? parts[0].toLowerCase() : defaultTargetLang(session);
    return { text, targetLang };
  }
  if (!payload) return null;
  const parts = payload.split(/\s+/);
  if (parts.length >= 2 && parseLangToken(parts[0])) {
    return { targetLang: parts[0].toLowerCase(), text: parts.slice(1).join(' ').trim() };
  }
  return { targetLang: defaultTargetLang(session), text: payload };
}

module.exports = { resolveTranslateInput, defaultTargetLang };
