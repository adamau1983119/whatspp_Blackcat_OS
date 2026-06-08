'use strict';

/**
 * send-queue.js — 每 principalId 序列化 sendMessage（防併發亂序）
 */

/** @type {Map<string, Promise<void>>} */
const chains = new Map();

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
}

module.exports = { enqueueSend, resetSendQueues };
