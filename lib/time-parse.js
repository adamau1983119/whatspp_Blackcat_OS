'use strict';

/** 從中文／英文口語解析提醒時間（Phase 5） */
function parseReminderText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const relMin = raw.match(/^(\d+)\s*分鐘後\s*(.+)$/);
  if (relMin) {
    const mins = parseInt(relMin[1], 10);
    const start = new Date(Date.now() + mins * 60000);
    return { event: relMin[2].trim(), start, end: new Date(start.getTime() + 3600000) };
  }

  const relEn = raw.match(/^in\s+(\d+)\s*minutes?\s+(.+)$/i);
  if (relEn) {
    const mins = parseInt(relEn[1], 10);
    const start = new Date(Date.now() + mins * 60000);
    return { event: relEn[2].trim(), start, end: new Date(start.getTime() + 3600000) };
  }

  const tonight = raw.match(/^(今晚|晚上)(\d{1,2})點\s*(.+)$/);
  if (tonight) {
    const hour = parseInt(tonight[2], 10);
    const start = new Date();
    start.setHours(hour, 0, 0, 0);
    if (start.getTime() <= Date.now()) start.setDate(start.getDate() + 1);
    return { event: tonight[3].trim(), start, end: new Date(start.getTime() + 3600000) };
  }

  const plain = raw.match(/^(.+?)(\d{1,2})點(.+)$/);
  if (plain) {
    const hour = parseInt(plain[2], 10);
    const start = new Date();
    start.setHours(hour, 0, 0, 0);
    if (start.getTime() <= Date.now()) start.setDate(start.getDate() + 1);
    return { event: `${plain[1].trim()}${plain[3].trim()}`.trim(), start, end: new Date(start.getTime() + 3600000) };
  }

  return null;
}

/** 待辦文字是否含時間語意 */
function hasTimeHint(text) {
  const s = String(text || '');
  return /分鐘後|點|今晚|晚上|明天|in\s+\d+\s*minute/i.test(s);
}

module.exports = { parseReminderText, hasTimeHint };
