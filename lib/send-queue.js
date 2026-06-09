'use strict';

/**
 * send-queue.js — 每 principalId 序列化 sendMessage（防併發亂序）
 */

/** @type {Map<string, Promise<void>>} */
const chains = new Map();

const MAX_OUTBOUND = 8;
const ECHO_TTL_MS = 15000;

/** @type {Map<string, Array<{ body: string, ts: number, msgId: string|null }>>} */
const recentOutbound = new Map();

function recordOutbound(chatId, body, msgId) {
  const id = String(chatId);
  const list = recentOutbound.get(id) || [];
  list.push({
    body: String(body),
    ts: Date.now(),
    msgId: msgId ? String(msgId) : null,
  });
  while (list.length > MAX_OUTBOUND) list.shift();
  recentOutbound.set(id, list);
}

function patchLastOutbound(chatId, msgId) {
  const list = recentOutbound.get(String(chatId));
  if (!list?.length) return;
  list[list.length - 1].msgId = msgId ? String(msgId) : null;
}

/** @param {object} msg whatsapp-web.js message_create */
function shouldIgnoreEcho(msg) {
  const chatId = String(msg.to || '');
  const list = recentOutbound.get(chatId);
  if (!list?.length) return false;
  const body = String(msg.body || '').trim();
  const now = Date.now();
  for (let i = list.length - 1; i >= 0; i--) {
    const rec = list[i];
    if (now - rec.ts > ECHO_TTL_MS) continue;
    if (body !== rec.body.trim()) continue;
    return true;
  }
  return false;
}

/** @returns {boolean} true = 已消耗 echo，呼叫端應略過 */
function consumeEcho(msg) {
  if (!shouldIgnoreEcho(msg)) return false;
  const chatId = String(msg.to || '');
  const body = String(msg.body || '').trim();
  const list = recentOutbound.get(chatId);
  if (list) {
    const idx = list.findIndex(
      (rec) => body === rec.body.trim() && Date.now() - rec.ts <= ECHO_TTL_MS
    );
    if (idx >= 0) list.splice(idx, 1);
  }
  return true;
}

async function deliverReply(client, principalId, text) {
  if (!text) return;
  const id = String(principalId);
  await enqueueSend(id, async () => {
    recordOutbound(id, text, null);
    const sent = await client.sendMessage(id, text);
    patchLastOutbound(id, sent?.id?._serialized);
  });
}

/** @param {string} principalId @param {() => Promise<void>} task */
function enqueueSend(principalId, task) {
  const id = String(principalId);
  const prev = chains.get(id) || Promise.resolve();
  const next = prev
    .then(() => task())
    .catch(() => {})
    .finally(() => {
      if (chains.get(id) === next) chains.delete(id);
    });
  chains.set(id, next);
  return next;
}

function resetSendQueues() {
  chains.clear();
  recentOutbound.clear();
}

module.exports = {
  enqueueSend,
  resetSendQueues,
  recordOutbound,
  shouldIgnoreEcho,
  consumeEcho,
  deliverReply,
};
