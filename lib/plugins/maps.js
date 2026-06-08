'use strict';

/**
 * maps.js — L0 深連結導航（同步、無 API）
 */

const { t } = require('../messages');
const { releaseToIdle } = require('../session');

function buildUrls(query) {
  const q = encodeURIComponent(String(query || '').trim());
  return {
    appleMapsUrl: `https://maps.apple.com/?q=${q}`,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${q}`,
  };
}

/** @returns {string} WhatsApp 回覆文案 */
function execute(cmd, session, ctx) {
  const loc = session.locale;
  const fromApp = session.osState === 'APP_ACTIVE' && session.currentApp === 'MAPS';
  const query = String(cmd.payload || (fromApp ? ctx.text : '') || '').trim();

  if (fromApp || cmd.payload) {
    if (!query) return t(loc, 'mapsPrompt');
    const urls = buildUrls(query);
    releaseToIdle(session.principalId);
    return t(loc, 'mapsResult', urls);
  }

  session.osState = 'APP_ACTIVE';
  session.currentApp = 'MAPS';
  return t(loc, 'mapsPrompt');
}

module.exports = { execute, buildUrls };
