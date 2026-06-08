'use strict';

/** 組裝 mailto: 深連結（L0 移交原生 Mail） */
function buildMailtoUrl(to, subject, body) {
  const addr = encodeURIComponent(String(to || '').trim());
  const parts = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${addr}${parts.length ? `?${parts.join('&')}` : ''}`;
}

module.exports = { buildMailtoUrl };
