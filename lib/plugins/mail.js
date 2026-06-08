'use strict';

/**
 * mail.js — L0 mailto: 移交原生 Mail；L1 nodemailer BYOK（GMAIL_*）
 */

const { t } = require('../messages');
const { releaseToIdle } = require('../session');
const { buildMailtoUrl } = require('../mailto');
const { loadEmailRoutes, parseMailPayload, resolveRecipient } = require('../mail-parse');

async function sendViaGmail(to, subject, body) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  await transporter.sendMail({ from: user, to, subject, text: body });
  return true;
}

async function execute(cmd, session, ctx) {
  const loc = session.locale;
  const routesCfg = loadEmailRoutes();
  const bodyFromQuote = ctx.attachment?.hasAttachment ? String(ctx.attachment.payload || '').trim() : '';
  const parsed = parseMailPayload(cmd.payload);
  if (!parsed && !bodyFromQuote) {
    releaseToIdle(session.principalId);
    return t(loc, 'mailEmpty');
  }

  const mailBody = parsed?.body || bodyFromQuote;
  const nickname = parsed?.nickname || null;
  const recipient = resolveRecipient(nickname, routesCfg);
  if (!recipient) {
    releaseToIdle(session.principalId);
    return t(loc, 'mailUnknownRecipient', { nickname: nickname || '?' });
  }

  const subject = routesCfg.defaultSubject || 'Blackcat OS';
  const sent = await sendViaGmail(recipient, subject, mailBody);
  releaseToIdle(session.principalId);

  if (sent) {
    return `${t(loc, 'mailL1Result', { recipient })}\n${t(loc, 'mailSendDisclaimer')}`;
  }

  const url = buildMailtoUrl(recipient, subject, mailBody);
  return t(loc, 'mailL0Result', { url, recipient });
}

module.exports = { execute };
