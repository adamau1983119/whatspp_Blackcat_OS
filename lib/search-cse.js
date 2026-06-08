'use strict';

const https = require('https');

/** L1：Google Custom Search JSON API → 最多 3 行 */
function fetchCseLines(query, maxResults = 3) {
  const key = process.env.GOOGLE_CSE_KEY || process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) return Promise.resolve(null);

  const q = encodeURIComponent(String(query || '').trim());
  const path = `/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&num=${maxResults}&q=${q}`;

  return new Promise((resolve, reject) => {
    https
      .get({ hostname: 'www.googleapis.com', path, method: 'GET' }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const items = Array.isArray(json.items) ? json.items : [];
            const lines = items.slice(0, maxResults).map((it) => {
              const title = String(it.title || '').trim();
              const snippet = String(it.snippet || '').replace(/\s+/g, ' ').trim();
              const link = String(it.link || '').trim();
              return `${title}-${snippet}-${link}`;
            });
            resolve(lines.length ? lines : null);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

module.exports = { fetchCseLines };
