'use strict';

/**
 * todo.js — 黑貓待辦速記；含時間語意時附加行事曆連結
 */

const { t } = require('../messages');
const { releaseToIdle } = require('../session');
const { hasTimeHint, parseReminderText } = require('../time-parse');
const { buildCalendarTemplateUrl } = require('../calendar-url');

function ensureTodos(session) {
  if (!Array.isArray(session.appData.todos)) session.appData.todos = [];
  return session.appData.todos;
}

function listTodos(session, loc) {
  const todos = ensureTodos(session);
  if (!todos.length) return t(loc, 'todoListEmpty');
  const lines = todos
    .slice(-3)
    .map((item, i) => `${i + 1}. ${item.text}`)
    .join('\n');
  return t(loc, 'todoList', { lines });
}

function execute(cmd, session, ctx) {
  void ctx;
  const loc = session.locale;

  if (cmd.type === 'SYS_TODO_LIST') {
    releaseToIdle(session.principalId);
    return listTodos(session, loc);
  }

  const text = String(cmd.payload || '').trim();
  if (!text) {
    releaseToIdle(session.principalId);
    return t(loc, 'todoEmpty');
  }

  let calendarUrl = '';
  if (hasTimeHint(text)) {
    const parsed = parseReminderText(text);
    if (parsed) {
      calendarUrl = buildCalendarTemplateUrl(parsed.event, parsed.start, parsed.end);
    }
  }

  ensureTodos(session).push({
    text,
    createdAt: new Date().toISOString(),
    calendarUrl: calendarUrl || null,
  });

  releaseToIdle(session.principalId);
  if (calendarUrl) {
    return t(loc, 'todoSavedWithCalendar', { text, calendarUrl });
  }
  return t(loc, 'todoSaved', { text });
}

module.exports = { execute };
