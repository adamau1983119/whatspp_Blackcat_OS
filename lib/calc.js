/**
 * calc.js — 帳本式計算核心（禁止 eval，switch 逐步運算）
 */

const DIV_BY_ZERO = 'DIV_BY_ZERO';
const NOT_FOUND = 'NOT_FOUND';

/** 套用單步運算 */
function applyOp(total, op, value) {
  switch (op) {
    case '+':
      return total + value;
    case '-':
      return total - value;
    case '*':
      return total * value;
    case '/':
      if (value === 0) throw new Error(DIV_BY_ZERO);
      return total / value;
    default:
      throw new Error('INVALID_OP');
  }
}

/** 從 0 依序重算總額 */
function recalculate(entries) {
  let total = 0;
  for (const { op, value } of entries || []) {
    total = applyOp(total, op, value);
  }
  return total;
}

/** 新增一步並重算 */
function addEntry(entries, entry) {
  const next = [...(entries || []), entry];
  return { entries: next, total: recalculate(next) };
}

/** 刪除最後一步並重算 */
function undoEntry(entries) {
  const list = entries || [];
  const next = list.slice(0, -1);
  return { entries: next, total: recalculate(next) };
}

/** 從尾端找 oldRaw 對應步驟，替換為 newEntry 後重算 */
function modifyEntry(entries, oldRaw, newEntry) {
  const next = [...(entries || [])];
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].raw !== oldRaw) continue;
    next[i] = {
      ...newEntry,
      raw: newEntry.raw || `${newEntry.op}${newEntry.value}`,
    };
    return { entries: next, total: recalculate(next) };
  }
  throw new Error(NOT_FOUND);
}

module.exports = {
  DIV_BY_ZERO,
  NOT_FOUND,
  recalculate,
  addEntry,
  undoEntry,
  modifyEntry,
};
