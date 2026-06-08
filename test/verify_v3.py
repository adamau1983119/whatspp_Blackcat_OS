#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V3 累加驗證：audit + 各 phase_v3_N_check.py"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PHASE_SCRIPTS = [
    ROOT / "test" / "audit_hardcode.py",
    ROOT / "test" / "phase_v3_0_check.py",
    ROOT / "test" / "phase_v3_1_check.py",
]


def main():
    print("Blackcat OS V3 - Third-party Verification")
    print("=" * 50)
    results = {}
    for script in PHASE_SCRIPTS:
        if not script.exists():
            print(f"[SKIP] {script.name} (not yet created)")
            continue
        label = script.stem
        print(f"\n>>> Running {script.name}\n")
        r = subprocess.run([sys.executable, str(script)], cwd=ROOT)
        results[label] = r.returncode == 0

    print("\n" + "=" * 50)
    print("V3 SUMMARY")
    for label, ok in results.items():
        print(f"  {label}: {'[PASS]' if ok else '[FAIL]'}")
    print("=" * 50)
    all_ok = all(results.values()) if results else False
    print(f"V3 OVERALL: {'[PASS]' if all_ok else '[FAIL]'}")
    print("Status file: test/verification_status.json")
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
