/**
 * format.js — 格式化模組（文案依 locale 從 messages.json 讀取）
 */

const { t, getDefaultLocale } = require('./messages');

function formatNumber(num) {
  if (!Number.isFinite(num)) return String(num);
  if (Number.isInteger(num)) return String(num);
  return parseFloat(num.toFixed(6)).toString();
}

function formatTrajectory(entries) {
  if (!entries || entries.length === 0) return '0';
  const steps = entries.map(({ op, value }) => `${op} ${formatNumber(value)}`).join(' ');
  return `0 ${steps}`;
}

function formatResult(session, locale) {
  const loc = locale || session.locale || getDefaultLocale();
  const total = formatNumber(session.total);
  const trajectory = formatTrajectory(session.entries);
  const totalLabel = t(loc, 'totalLabel');
  const trajectoryLabel = t(loc, 'trajectoryLabel');
  return `${totalLabel}：${total}\n${trajectoryLabel}：${trajectory}`;
}

function formatFinal(total, locale) {
  const loc = locale || getDefaultLocale();
  const label = t(loc, 'finalLabel');
  return `${label}：${formatNumber(total)}`;
}

function formatStarted(locale) {
  return t(locale || getDefaultLocale(), 'started');
}

module.exports = {
  formatNumber,
  formatTrajectory,
  formatResult,
  formatFinal,
  formatStarted,
};
