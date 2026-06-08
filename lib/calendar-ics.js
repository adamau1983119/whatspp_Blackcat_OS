'use strict';

const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (c) => {
          data += c;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/** 簡易 ICS 解析：取前 N 個 VEVENT SUMMARY */
function parseIcsSummaries(ics, max = 3) {
  const out = [];
  const blocks = String(ics || '').split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length && out.length < max; i += 1) {
    const m = blocks[i].match(/SUMMARY:([^\r\n]+)/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

async function fetchIcsEventLines(icsUrl, max = 3) {
  if (!icsUrl) return null;
  try {
    const ics = await fetchText(icsUrl);
    const lines = parseIcsSummaries(ics, max);
    return lines.length ? lines : null;
  } catch (_) {
    return null;
  }
}

module.exports = { fetchIcsEventLines, parseIcsSummaries };
