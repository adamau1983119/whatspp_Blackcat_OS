#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2 Phase 5 第三方驗證 — 總驗證整合與 v1 回歸"""

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _verify_v2_common import (  # noqa: E402
    ROOT,
    STATUS_FILE,
    reset_checks,
    check,
    summarize,
    exit_v2_phase,
)

PHASE = 5


def main():
    reset_checks()
    print("=" * 50)
    print("V2 Phase 5 Checklist (third-party Python)")
    print("=" * 50)

    verify_v2 = ROOT / "test" / "verify_v2.py"
    check("test/verify_v2.py exists", verify_v2.is_file())

    if verify_v2.is_file():
        text = verify_v2.read_text(encoding="utf-8")
        for n in range(5):
            check(f"verify_v2 lists phase_v2_{n}_check.py", f"phase_v2_{n}_check.py" in text)

    index_js = ROOT / "index.js"
    if index_js.is_file():
        idx = index_js.read_text(encoding="utf-8")
        check("index.js uses client.sendMessage", "client.sendMessage" in idx)
        check("index.js avoids msg.getChat for reply", "msg.getChat()" not in idx)

    print("\n>>> Running python test/verify_v2.py\n")
    r_v2 = subprocess.run([sys.executable, str(verify_v2)], cwd=ROOT)
    check("verify_v2.py OVERALL PASS", r_v2.returncode == 0)

    print("\n>>> Running python test/verify.py (v1 regression)\n")
    verify_v1 = ROOT / "test" / "verify.py"
    r_v1 = subprocess.run([sys.executable, str(verify_v1)], cwd=ROOT)
    check("verify.py v1 OVERALL PASS", r_v1.returncode == 0)

    check("verification_status_v2.json exists", STATUS_FILE.is_file())

    all_ok = summarize("V2 Phase 5")
    exit_v2_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
