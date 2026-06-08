'use strict';

/**
 * calendar.js — L0 開啟原生行事曆；BYOK ICS 今明快照（≤3 筆）
 */

const { t } = require('../messages');
const { releaseToIdle } = require('../session');
const { fetchIcsEventLines } = require('../calendar-ics');

const CALENDAR_OPEN_URL = 'https://calendar.google.com/calendar/r';

async function execute(cmd, session, ctx) {
  void cmd;
  void ctx;
  const loc = session.locale;
  const icsUrl = process.env.GOOGLE_CALENDAR_ICS_URL;
  const lines = icsUrl ? await fetchIcsEventLines(icsUrl, 3) : null;

  releaseToIdle(session.principalId);

  if (lines && lines.length) {
    return t(loc, 'calendarSnapshot', {
      lines: lines.join('\n'),
      url: CALENDAR_OPEN_URL,
      disclaimer: t(loc, 'calendarHandoff'),
    });
  }

  return t(loc, 'calendarOpenNative', {
    url: CALENDAR_OPEN_URL,
    disclaimer: t(loc, 'calendarHandoff'),
  });
}

module.exports = { execute };
