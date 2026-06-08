'use strict';

/**
 * clock.js — L0 行事曆深連結；同步、禁止 setTimeout 代響
 */

const { t } = require('../messages');
const { releaseToIdle } = require('../session');
const { parseReminderText } = require('../time-parse');
const { buildCalendarTemplateUrl } = require('../calendar-url');

function execute(cmd, session, ctx) {
  void ctx;
  const loc = session.locale;
  const parsed = parseReminderText(cmd.payload);
  if (!parsed) {
    releaseToIdle(session.principalId);
    return t(loc, 'clockEmpty');
  }

  const url = buildCalendarTemplateUrl(parsed.event, parsed.start, parsed.end);
  releaseToIdle(session.principalId);
  return t(loc, 'clockResult', {
    url,
    event: parsed.event,
    disclaimer: t(loc, 'clockHandoffDisclaimer'),
  });
}

module.exports = { execute };
