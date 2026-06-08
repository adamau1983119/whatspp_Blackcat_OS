'use strict';

const fs = require('fs');
const path = require('path');
const { t } = require('./messages');

const COMMANDS_PATH = path.join(__dirname, '..', 'config', 'commands.json');

function loadCommands() {
  return JSON.parse(fs.readFileSync(COMMANDS_PATH, 'utf-8'));
}

/** 由 commands.json 產生指令表（=說明／0） */
function buildHelpText(locale) {
  const cmds = loadCommands();
  const loc = locale || cmds.defaultLocale || 'zh-TW';
  const lines = [];
  const pushGroup = (rules) => {
    for (const rule of rules || []) {
      if (rule.locale !== loc && rule.locale !== 'zh-TW') continue;
      const alias = (rule.aliases || [])[0];
      if (alias) lines.push(`${alias} → ${rule.type}`);
    }
  };
  pushGroup(cmds.exact);
  pushGroup(cmds.plugins);
  const body = lines.slice(0, 24).join('\n');
  return t(loc, 'helpList', { commands: body });
}

module.exports = { buildHelpText };
