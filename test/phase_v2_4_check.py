#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2 Phase 4 第三方驗證 — VERSION.md v2 發布區塊"""

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

PHASE = 4


def main():
    reset_checks()
    print("=" * 50)
    print("V2 Phase 4 Checklist (third-party Python)")
    print("=" * 50)

    version_md = ROOT / "VERSION.md"
    check("VERSION.md exists", version_md.is_file())
    if not version_md.is_file():
        all_ok = summarize("V2 Phase 4")
        exit_v2_phase(PHASE, all_ok)
        return

    text = version_md.read_text(encoding="utf-8")
    check("VERSION.md keeps v1.0.0 block", "v1.0.0" in text)
    check("VERSION.md has v2.0.0 or release note", "v2.0.0" in text or "Version 2 發布" in text)
    check("VERSION.md links PHASES_v2.md", "PHASES_v2.md" in text)
    check("VERSION.md links SHARING.md", "SHARING.md" in text)
    check("VERSION.md mentions v2-sharing branch", "v2-sharing" in text)

    all_ok = summarize("V2 Phase 4")
    exit_v2_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
