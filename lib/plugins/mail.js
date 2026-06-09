'use strict';

/**
 * mail.js — L0：先選 Web／手機，再給可點連結開啟原生 Mail（自行填收件人與內文）
 */

const { t, withQuickFooter } = require('../messages');
const { releaseToIdle } = require('../session');
const { buildPublicMailUrl } = require('../mailto');
const {
  loadEmailRoutes,
  enterMailMode,
  isMailWaitingDevice,
  parseDeviceChoice,
  buildMailDevicePrompt,
  clearMailDraft,
} = require('../mail-parse');

async function execute(cmd, session, ctx) {
  void ctx;
  const loc = session.locale;
  const routesCfg = loadEmailRoutes();
  const subject = routesCfg.defaultSubject || '黑貓 OS 郵件';
  const choice = parseDeviceChoice(cmd.payload);

  if (choice) {
    const url = buildPublicMailUrl(subject, '', { target: choice });
    if (!url) {
      enterMailMode(session);
      return t(loc, 'mailPhoneUnavailable');
    }
    releaseToIdle(session.principalId);
    clearMailDraft(session);
    const resultKey = choice === 'local' ? 'mailL0ResultLocal' : 'mailL0ResultPhone';
    return withQuickFooter(loc, t(loc, resultKey, { url }));
  }

  if (isMailWaitingDevice(session) && String(cmd.payload || '').trim()) {
    return t(loc, 'mailDeviceInvalid');
  }

  enterMailMode(session);
  return buildMailDevicePrompt(loc, routesCfg);
}

module.exports = { execute };
