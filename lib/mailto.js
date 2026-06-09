'use strict';

/** 組裝 mailto: 深連結（L0 移交原生 Mail） */
function buildMailtoUrl(to, subject, body) {
  const addr = encodeURIComponent(String(to || '').trim());
  const parts = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${addr}${parts.length ? `?${parts.join('&')}` : ''}`;
}

function resolveBaseUrl(target) {
  if (target === 'phone') {
    const custom = (process.env.MAIL_PUBLIC_BASE_URL || '').trim().replace(/\/$/, '');
    if (custom) return custom;
    const domain = (process.env.RAILWAY_PUBLIC_DOMAIN || '').trim();
    if (domain) return `https://${domain}`;
    return null;
  }
  const port = Number(process.env.PORT) || 3000;
  return `http://localhost:${port}`;
}

/** WhatsApp 可點擊的 http(s) 中轉連結（開啟後跳轉 mailto） */
function buildPublicMailUrl(subject, body, options = {}) {
  const target = options.target === 'phone' ? 'phone' : 'local';
  const base = resolveBaseUrl(target);
  if (!base) return null;
  const q = new URLSearchParams();
  if (subject) q.set('subject', String(subject));
  if (body) q.set('body', String(body));
  const qs = q.toString();
  return `${base}/mail${qs ? `?${qs}` : ''}`;
}

function buildMailOpenHtml(mailtoUrl) {
  const safe = String(mailtoUrl)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<meta http-equiv="refresh" content="0;url=${safe}">`,
    '<title>開啟 Mail</title></head>',
    '<body style="font-family:sans-serif;text-align:center;padding:2rem">',
    '<h2>📧 黑貓郵件</h2>',
    `<p><a href="${safe}" style="font-size:1.2rem">點此開啟 Mail App</a></p>`,
    '<p style="color:#666;font-size:0.9rem">若未自動跳轉，請點上方連結</p>',
    '</body></html>',
  ].join('');
}

module.exports = {
  buildMailtoUrl,
  resolveBaseUrl,
  buildPublicMailUrl,
  buildMailOpenHtml,
};
