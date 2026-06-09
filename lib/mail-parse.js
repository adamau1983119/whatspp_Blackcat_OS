'use strict';

const fs = require('fs');
const path = require('path');
const { t } = require('./messages');

const ROUTES_PATH = path.join(__dirname, '..', 'config', 'email-routes.json');

function loadEmailRoutes() {
  return JSON.parse(fs.readFileSync(ROUTES_PATH, 'utf-8'));
}

function enterMailMode(session) {
  session.osState = 'APP_ACTIVE';
  session.currentApp = 'MAIL';
  session.appData.mail = { step: 'device' };
}

function isMailWaitingDevice(session) {
  return session.osState === 'APP_ACTIVE'
    && session.currentApp === 'MAIL'
    && session.appData?.mail?.step === 'device';
}

/** @returns {'local'|'phone'|null} */
function parseDeviceChoice(text) {
  const trimmed = String(text || '').trim();
  if (trimmed === '1') return 'local';
  if (trimmed === '2') return 'phone';
  return null;
}

function listContactHints(routesCfg) {
  const routes = routesCfg?.routes || {};
  return Object.entries(routes)
    .map(([name, email]) => `• ${name} → ${email}`)
    .join('\n');
}

function buildMailDevicePrompt(locale, routesCfg) {
  const hints = listContactHints(routesCfg);
  return t(locale, 'mailDevicePrompt', {
    hints: hints || t(locale, 'mailNoHints'),
  });
}

function clearMailDraft(session) {
  if (session.appData) delete session.appData.mail;
}

module.exports = {
  loadEmailRoutes,
  enterMailMode,
  isMailWaitingDevice,
  parseDeviceChoice,
  buildMailDevicePrompt,
  listContactHints,
  clearMailDraft,
};
