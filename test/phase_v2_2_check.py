#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2 Phase 2 第三方驗證 — README 公開分享章節"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _verify_v2_common import (  # noqa: E402
    ROOT,
    reset_checks,
    check,
    summarize,
    exit_v2_phase,
)

PHASE = 2


def main():
    reset_checks()
    print("=" * 50)
    print("V2 Phase 2 Checklist (third-party Python)")
    print("=" * 50)

    readme = ROOT / "README.md"
    check("README.md exists", readme.is_file())
    if not readme.is_file():
        all_ok = summarize("V2 Phase 2")
        exit_v2_phase(PHASE, all_ok)
        return

    text = readme.read_text(encoding="utf-8")
    has_v2_title = "Version 2" in text or "公開分享" in text
    check("README has Version 2 or 公開分享 section", has_v2_title)
    check("README links docs/SHARING.md", "SHARING.md" in text)
    check("README has git clone", "git clone" in text)
    check("README has npm install", "npm install" in text)
    check("README mentions verify_v2.py", "verify_v2.py" in text)
    check("README keeps v1 PHASES.md protection", "PHASES.md" in text and "嚴重失誤" in text)

    all_ok = summarize("V2 Phase 2")
    exit_v2_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
