'use strict';

const fs = require('fs');
const path = require('path');

const ROUTES_PATH = path.join(__dirname, '..', 'config', 'email-routes.json');

function loadEmailRoutes() {
  return JSON.parse(fs.readFileSync(ROUTES_PATH, 'utf-8'));
}

/** 解析 =email 寄給暱稱：內文 */
function parseMailPayload(payload) {
  const text = String(payload || '').trim();
  if (!text) return null;
  const zh = text.match(/^寄給([^：:]+)[：:]([\s\S]+)$/);
  if (zh) return { nickname: zh[1].trim(), body: zh[2].trim() };
  const en = text.match(/^to\s+([^:]+):\s*([\s\S]+)$/i);
  if (en) return { nickname: en[1].trim(), body: en[2].trim() };
  return { nickname: null, body: text };
}

function resolveRecipient(nickname, routesCfg) {
  const routes = routesCfg?.routes || {};
  if (nickname && routes[nickname]) return routes[nickname];
  if (!nickname && routesCfg?.defaultRecipient) return routesCfg.defaultRecipient;
  return null;
}

module.exports = { loadEmailRoutes, parseMailPayload, resolveRecipient };
