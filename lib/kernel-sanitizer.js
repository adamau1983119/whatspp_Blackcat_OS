'use strict';

/**
 * kernel-sanitizer.js — 多模態原料標準化（插件只吃 string payload）
 */

const { SOURCE, ATTACHMENT_TYPE } = require('./ctx-contract');

const MAX_TEXT_LEN = 8192;

function stripControlChars(s) {
  return String(s || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function clampText(s) {
  const t = stripControlChars(s).trim();
  return t.length > MAX_TEXT_LEN ? t.slice(0, MAX_TEXT_LEN) : t;
}

/** 物件／陣列／字串 → 純文字 */
function payloadToString(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') return clampText(raw);
  if (typeof raw === 'object') {
    if (typeof raw.text === 'string') return clampText(raw.text);
    if (Array.isArray(raw.tokens)) {
      return clampText(raw.tokens.map((x) => (typeof x === 'string' ? x : x?.text || '')).join(''));
    }
    try {
      return clampText(JSON.stringify(raw));
    } catch (_) {
      return '';
    }
  }
  return clampText(String(raw));
}

function normalizeAttachment(att) {
  const a = att && typeof att === 'object' ? att : {};
  const hasAttachment = Boolean(a.hasAttachment && payloadToString(a.payload));
  const type = a.type && ATTACHMENT_TYPE[a.type] ? a.type : ATTACHMENT_TYPE.TEXT;
  return {
    hasAttachment,
    type,
    payload: hasAttachment ? payloadToString(a.payload) : '',
  };
}

/** 組裝並清洗中立 ctx */
function normalizeCtx(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const principalId = String(r.principalId || r.chatId || '');
  const source = SOURCE[r.source] ? r.source : SOURCE.WHATSAPP;
  return {
    source,
    principalId,
    text: clampText(r.text),
    attachment: normalizeAttachment(r.attachment),
  };
}

module.exports = { normalizeCtx, payloadToString, MAX_TEXT_LEN };
