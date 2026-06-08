#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2 Phase 1 第三方驗證 — docs/SHARING.md"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _verify_v2_common import (  # noqa: E402
    ROOT,
    MAX_DOC_LINES,
    reset_checks,
    check,
    count_lines,
    summarize,
    exit_v2_phase,
)

PHASE = 1


def main():
    reset_checks()
    print("=" * 50)
    print("V2 Phase 1 Checklist (third-party Python)")
    print("=" * 50)

    sharing = ROOT / "docs" / "SHARING.md"
    check("docs/SHARING.md exists", sharing.is_file())
    if not sharing.is_file():
        all_ok = summarize("V2 Phase 1")
        exit_v2_phase(PHASE, all_ok)
        return

    text = sharing.read_text(encoding="utf-8")
    lines = count_lines(sharing)
    check(f"docs/SHARING.md <= {MAX_DOC_LINES} lines", lines <= MAX_DOC_LINES, f"{lines} lines")

    check("SHARING: per-user QR (no public QR)", "各自" in text or "每人" in text)
    check("SHARING: warns no single public QR", "公眾" in text or "單一" in text)
    check("SHARING: git clone path", "git clone" in text)
    check("SHARING: npm install", "npm install" in text)
    check("SHARING: PUPPETEER_HEADLESS=false", "PUPPETEER_HEADLESS" in text)
    check("SHARING: =開始 command", "=開始" in text)
    check("SHARING: +500 format", "+500" in text)
    check("SHARING: /5 format", "/5" in text or "／5" in text)
    check("SHARING: =結束 command", "=結束" in text)
    check("SHARING: no 500/5 style note", "500/5" in text or "不支援" in text or "須" in text)
    check("SHARING: .wwebjs_auth security", ".wwebjs_auth" in text)
    check("SHARING: test roles", "測試" in text or "技術" in text)
    check("SHARING: Railway optional", "Railway" in text)

    all_ok = summarize("V2 Phase 1")
    exit_v2_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
