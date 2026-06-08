'use strict';

const fs = require('fs');
const path = require('path');

const CLOCK_URLS_PATH = path.join(__dirname, '..', 'config', 'clock-urls.json');

function loadClockUrls() {
  return JSON.parse(fs.readFileSync(CLOCK_URLS_PATH, 'utf-8'));
}

function toGoogleCalUtc(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Google Calendar TEMPLATE 深連結 */
function buildCalendarTemplateUrl(title, startDate, endDate) {
  const cfg = loadClockUrls();
  const tpl = cfg.googleCalendarTemplate
    || 'https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={start}/{end}';
  const titleEnc = encodeURIComponent(String(title || '').trim());
  const start = toGoogleCalUtc(startDate);
  const end = toGoogleCalUtc(endDate);
  return tpl.replace('{title}', titleEnc).replace('{start}', start).replace('{end}', end);
}

module.exports = { buildCalendarTemplateUrl, loadClockUrls, toGoogleCalUtc };
