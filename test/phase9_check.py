#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 9 第三方驗證 — 整合測試（mock e2e）"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _verify_common import (  # noqa: E402
    ROOT,
    MAX_LINES,
    reset_checks,
    check,
    count_lines,
    run_node_script,
    summarize,
    exit_phase,
)

PHASE = 9


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 9 Checklist (third-party Python)")
    print("=" * 50)

    index_path = ROOT / "index.js"
    check("index.js exists", index_path.is_file())

    if index_path.is_file():
        lines = count_lines(index_path)
        check("index.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        raw = index_path.read_text(encoding="utf-8")
        code = strip_comments(raw)
        check("index.js uses message_create", "message_create" in code)
        check("index.js filters fromMe", "if (!msg.fromMe) return" in code or "if(!msg.fromMe)return" in code)

    login_path = ROOT / "lib" / "login.js"
    check("lib/login.js exists", login_path.is_file())
    if login_path.is_file():
        lraw = login_path.read_text(encoding="utf-8")
        lcode = strip_comments(lraw)
        check("login.js listens qr", "client.on('qr'" in lcode)
        check("login.js listens code", "client.on('code'" in lcode)

    e2e_path = ROOT / "test" / "phase9_mock_e2e.test.js"
    check("phase9_mock_e2e.test.js exists", e2e_path.is_file())
    if e2e_path.is_file():
        check("phase9_mock_e2e.test.js <= 200 lines", count_lines(e2e_path) <= 200)

    ok, out = run_node_script(e2e_path)
    check("mock e2e passes", ok, out[:120] if out else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()

