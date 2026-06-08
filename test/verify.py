#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""執行所有已就緒的 Phase 第三方驗證

每完成一階實作，須同步：
  1. 新增 test/phaseN_check.py
  2. 將路徑加入下方 PHASE_SCRIPTS
詳見 PHASES.md「驗證協議」。
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 每完成一階，在此追加 phaseN_check.py
PHASE_SCRIPTS = [
    ROOT / "test" / "phase0_check.py",
    ROOT / "test" / "phase1_check.py",
    ROOT / "test" / "phase2_check.py",
    ROOT / "test" / "phase3_check.py",
    ROOT / "test" / "phase4_check.py",
    ROOT / "test" / "phase5_check.py",
    ROOT / "test" / "phase6_check.py",
    ROOT / "test" / "phase7_check.py",
    ROOT / "test" / "phase8_check.py",
    ROOT / "test" / "phase9_check.py",
]


def main():
    print("WhatsApp Calculator - Third-party Verification")
    print("=" * 50)
    results = {}
    for script in PHASE_SCRIPTS:
        if not script.exists():
            continue
        phase = script.stem.replace("phase", "").replace("_check", "")
        print(f"\n>>> Running {script.name}\n")
        r = subprocess.run([sys.executable, str(script)], cwd=ROOT)
        results[phase] = r.returncode == 0

    print("\n" + "=" * 50)
    print("SUMMARY")
    for phase, ok in results.items():
        print(f"  Phase {phase}: {'[PASS]' if ok else '[FAIL]'}")
    print("=" * 50)
    all_ok = all(results.values()) if results else False
    print(f"OVERALL: {'[PASS]' if all_ok else '[FAIL]'}")
    print(f"Status file: test/verification_status.json")
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
