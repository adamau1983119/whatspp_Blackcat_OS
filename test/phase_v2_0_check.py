#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2 Phase 0 第三方驗證 — 凍結保護與規格骨架"""

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

PHASE = 0


def main():
    reset_checks()
    print("=" * 50)
    print("V2 Phase 0 Checklist (third-party Python)")
    print("=" * 50)

    freeze = ROOT / ".cursor" / "rules" / "v1-freeze-protection.mdc"
    phases_v2 = ROOT / "docs" / "PHASES_v2.md"
    arch_v2 = ROOT / "docs" / "專案整體架構表_v2.md"
    version_md = ROOT / "VERSION.md"
    phases_md = ROOT / "PHASES.md"

    check("v1-freeze-protection.mdc exists", freeze.is_file())
    if freeze.is_file():
        text = freeze.read_text(encoding="utf-8")
        check("freeze rule mentions v1.0.0", "v1.0.0" in text)
        check("freeze rule mentions version-1", "version-1" in text)

    check("docs/PHASES_v2.md exists", phases_v2.is_file())
    if phases_v2.is_file():
        pv2 = phases_v2.read_text(encoding="utf-8")
        check("PHASES_v2 has verification protocol", "驗證協議" in pv2)
        check("PHASES_v2 has phase_v2 scripts table", "phase_v2_0_check.py" in pv2)

    check("docs/專案整體架構表_v2.md exists", arch_v2.is_file())
    if arch_v2.is_file():
        av2 = arch_v2.read_text(encoding="utf-8")
        check("arch v2 mentions self-host", "開源自架" in av2 or "自架" in av2)

    check("VERSION.md exists", version_md.is_file())
    if version_md.is_file():
        vm = version_md.read_text(encoding="utf-8")
        check("VERSION.md has Version 2 section", "Version 2" in vm)

    check("PHASES.md exists", phases_md.is_file())
    if phases_md.is_file():
        pm = phases_md.read_text(encoding="utf-8")
        check("PHASES.md links PHASES_v2.md", "PHASES_v2.md" in pm)

    all_ok = summarize("V2 Phase 0")
    exit_v2_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
