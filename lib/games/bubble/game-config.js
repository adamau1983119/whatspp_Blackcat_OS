/**
 * game-config.js — 讀取 config/game.json 與 game-commands.json
 */

const fs = require('fs');
const path = require('path');

const BUBBLE_CFG = path.join(__dirname, '..', '..', '..', 'config', 'bubble');
const GAME_PATH = path.join(BUBBLE_CFG, 'game.json');
const CMD_PATH = path.join(BUBBLE_CFG, 'game-commands.json');
const MSG_PATH = path.join(BUBBLE_CFG, 'game-messages.json');

let gameCfg = null;
let cmdCfg = null;
let msgCfg = null;

function loadGameConfig() {
  if (!gameCfg) gameCfg = JSON.parse(fs.readFileSync(GAME_PATH, 'utf-8'));
  return gameCfg;
}

function loadCommandConfig() {
  if (!cmdCfg) cmdCfg = JSON.parse(fs.readFileSync(CMD_PATH, 'utf-8'));
  return cmdCfg;
}

function loadMessageConfig() {
  if (!msgCfg) msgCfg = JSON.parse(fs.readFileSync(MSG_PATH, 'utf-8'));
  return msgCfg;
}

function resetConfigCache() {
  gameCfg = null;
  cmdCfg = null;
  msgCfg = null;
}

module.exports = {
  loadGameConfig,
  loadCommandConfig,
  loadMessageConfig,
  resetConfigCache,
};
