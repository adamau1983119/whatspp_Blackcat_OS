'use strict';

/** Google 搜尋 L0 深連結 */
function buildGoogleSearchUrl(query) {
  const q = encodeURIComponent(String(query || '').trim());
  return `https://www.google.com/search?q=${q}`;
}

module.exports = { buildGoogleSearchUrl };
