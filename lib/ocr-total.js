'use strict';

/** 從 OCR／收據文字擷取 TOTAL 金額 */
function extractTotalFromText(text) {
  const raw = String(text || '');
  const patterns = [
    /TOTAL[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/i,
    /總計[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/,
    /合計[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/,
    /應付[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/,
    /AMOUNT[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/i,
  ];
  for (const pat of patterns) {
    const m = raw.match(pat);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

module.exports = { extractTotalFromText };
