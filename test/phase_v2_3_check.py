#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2 Phase 3 第三方驗證 — scripts/setup-windows.ps1"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _verify_v2_common import (  # noqa: E402
    ROOT,
    MAX_SCRIPT_LINES,
    reset_checks,
    check,
    count_lines,
    summarize,
    exit_v2_phase,
)

PHASE = 3


def main():
    reset_checks()
    print("=" * 50)
    print("V2 Phase 3 Checklist (third-party Python)")
    print("=" * 50)

    script = ROOT / "scripts" / "setup-windows.ps1"
    check("scripts/setup-windows.ps1 exists", script.is_file())
    if not script.is_file():
        all_ok = summarize("V2 Phase 3")
        exit_v2_phase(PHASE, all_ok)
        return

    text = script.read_text(encoding="utf-8")
    lines = count_lines(script)
    check(f"setup-windows.ps1 <= {MAX_SCRIPT_LINES} lines", lines <= MAX_SCRIPT_LINES, f"{lines} lines")
    check("script checks Node.js", "node" in text.lower())
    check("script mentions npm install", "npm install" in text)
    check("script mentions PUPPETEER_HEADLESS", "PUPPETEER_HEADLESS" in text)
    check("script mentions node index.js", "index.js" in text)

    all_ok = summarize("V2 Phase 3")
    exit_v2_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
