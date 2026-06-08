#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 6 第三方驗證 — Client 工廠"""

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
    run_node_eval,
    summarize,
    exit_phase,
)

PHASE = 6


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 6 Checklist (third-party Python)")
    print("=" * 50)

    client_path = ROOT / "lib" / "client.js"

    check("lib/client.js exists", client_path.is_file())
    if client_path.is_file():
        lines = count_lines(client_path)
        check("lib/client.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        raw = client_path.read_text(encoding="utf-8")
        code = strip_comments(raw)
        check("lib/client.js has Chinese comments", "建立" in raw or "實例" in raw)
        check("createClient() exists", "function createClient" in code)
        check("client.js uses LocalAuth", "LocalAuth" in code)
        check(
            "client.js has puppeteer headless config",
            "headless: true" in code or "resolveHeadless" in code,
        )
        check("client.js supports pairWithPhoneNumber", "pairWithPhoneNumber" in code)

    cases = [
        (
            "createClient() returns client object",
            "const {createClient}=require('./lib/client');"
            "const c=createClient();"
            "if(!c||typeof c!=='object')process.exit(1);"
            "if(typeof c.initialize!=='function')process.exit(1);"
            "if(c.pupBrowser||c.pupPage)process.exit(1);",
        ),
        (
            "createClient() accepts pairWithPhoneNumber option",
            "const {createClient}=require('./lib/client');"
            "const c=createClient({pairWithPhoneNumber:'85298765432'});"
            "if(!c||typeof c.initialize!=='function')process.exit(1);",
        ),
    ]

    for name, code in cases:
        ok, err = run_node_eval(code)
        check(name, ok, err[:80] if not ok and err else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
