'use strict';

/** Protocol-agnostic ctx 常量（Phase 0 契約；Phase 1 起 handler 使用） */

const SOURCE = Object.freeze({
  WHATSAPP: 'WHATSAPP',
  SHORTCUTS: 'SHORTCUTS',
  GLASS_BLE: 'GLASS_BLE',
  PWA_APP: 'PWA_APP',
  GLASS_AUDIO: 'GLASS_AUDIO',
});

const ATTACHMENT_TYPE = Object.freeze({
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  AUDIO: 'AUDIO',
});

module.exports = { SOURCE, ATTACHMENT_TYPE };
