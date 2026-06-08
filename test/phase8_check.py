#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 8 第三方驗證 — index.js"""

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
    summarize,
    exit_phase,
)

PHASE = 8


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 8 Checklist (third-party Python)")
    print("=" * 50)

    index_path = ROOT / "index.js"
    check("index.js exists", index_path.is_file())
    if index_path.is_file():
        lines = count_lines(index_path)
        check("index.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        raw = index_path.read_text(encoding="utf-8")
        code = strip_comments(raw)

        check("index.js has Chinese comments", "Phase 8" in raw or "入口" in raw)
        check("index.js uses message_create", "message_create" in code)
        check(
            "index.js filters fromMe first line",
            "if (!msg.fromMe) return" in code or "if(!msg.fromMe)return" in code,
        )
        check("index.js calls handleMessage", "handleMessage" in code)
        check("index.js sends via chat.sendMessage", "sendMessage" in code)
        check("index.js uses try-catch", "try" in code and "catch" in code)
        check("index.js catches calcError via t(locale,'calcError')", "calcError" in code and "t(" in code)
        check("index.js does not use message event", "client.on('message'" not in code)

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()

