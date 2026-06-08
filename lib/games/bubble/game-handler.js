/**
 * game-handler.js — 遊戲訊息路由（不接 WhatsApp）
 */

const { parseGameCommand } = require('./game-parse');
const { getGameSession, startGame, endGame, setLastPlayer } = require('./game-session');
const { formatGameBoard } = require('./game-format');
const { aim, fire, isGameOver } = require('./game');
const { t } = require('./game-messages');
const { loadCommandConfig } = require('./game-config');

function getLocale(cmd) {
  return cmd.locale || loadCommandConfig().defaultLocale || 'zh-TW';
}

function handleGameMessage(text, chatId, playerName) {
  const cmd = parseGameCommand(text);
  if (cmd.type === 'UNKNOWN') return null;
  const locale = getLocale(cmd);
  const session = getGameSession(chatId);
  if (playerName) setLastPlayer(chatId, playerName);

  switch (cmd.type) {
    case 'GAME_START': {
      const game = startGame(chatId);
      const header = t(locale, 'gameStarted') + '\n\n';
      return header + formatGameBoard(game, locale, playerName);
    }
    case 'GAME_END': {
      if (!session.active || !session.game) return null;
      const score = endGame(chatId);
      return t(locale, 'gameEnded', { score });
    }
    case 'GAME_AIM_LEFT': {
      if (!session.active || !session.game) return null;
      aim(session.game, 'left');
      return formatGameBoard(session.game, locale, playerName);
    }
    case 'GAME_AIM_RIGHT': {
      if (!session.active || !session.game) return null;
      aim(session.game, 'right');
      return formatGameBoard(session.game, locale, playerName);
    }
    case 'GAME_FIRE': {
      if (!session.active || !session.game) return null;
      const g = session.game;
      fire(g);
      const view = formatGameBoard(g, locale, playerName);
      if (isGameOver(g)) {
        const score = g.score;
        endGame(chatId);
        return view + '\n' + t(locale, 'gameOver', { score });
      }
      return view;
    }
    default:
      return null;
  }
}

module.exports = { handleGameMessage };
