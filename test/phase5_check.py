#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 5 第三方驗證 — 訊息路由 handler"""

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
    run_node_eval,
    summarize,
    exit_phase,
)

PHASE = 5


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 5 Checklist (third-party Python)")
    print("=" * 50)

    handler_path = ROOT / "lib" / "handler.js"
    test_path = ROOT / "test" / "handler.test.js"

    check("lib/handler.js exists", handler_path.is_file())
    if handler_path.is_file():
        lines = count_lines(handler_path)
        check("lib/handler.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        raw = handler_path.read_text(encoding="utf-8")
        code = strip_comments(raw)
        check("lib/handler.js has Chinese comments", "路由" in raw or "訊息" in raw)
        check("handler exports handleMessage", "function handleMessage" in raw)
        check("handler no whatsapp-web.js", "whatsapp-web" not in code)
        check("handler no fromMe filter", "fromMe" not in code)
        check("handler uses t() for messages", "t(" in code or "t (" in code)

    check("test/handler.test.js exists", test_path.is_file())
    if test_path.is_file():
        tlines = count_lines(test_path)
        check("test/handler.test.js <= 150 lines", tlines <= MAX_LINES, f"{tlines} lines")

    ok, out = run_node_script(test_path)
    check("node test/handler.test.js passes", ok, out[:120] if out else "")

    cases = [
        (
            "=開始 => OS_MENU",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','h1').then(r=>{"
            "if(!r||!r.reply||!r.reply.includes('主選單'))process.exit(1);"
            "if(getSession('h1').osState!=='MENU')process.exit(1);});",
        ),
        (
            "operation => total + trajectory",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','h2').then(()=>handleMessage('1','h2'))"
            ".then(()=>handleMessage('+500','h2')).then(r=>{"
            "if(!r.reply.includes('目前總計')||!r.reply.includes('計算軌跡'))process.exit(1);});",
        ),
        (
            "=結算 => final result",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','h3').then(()=>handleMessage('1','h3'))"
            ".then(()=>handleMessage('+500','h3'))"
            ".then(()=>handleMessage('=結算','h3')).then(r=>{"
            "if(!r.reply.includes('最終結果')||!r.reply.includes('500'))process.exit(1);});",
        ),
        (
            "needStart when not active",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('+500','h4').then(r=>{"
            "if(!r.reply.includes('請先輸入'))process.exit(1);});",
        ),
        (
            "unknown => null reply",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('你好','h5').then(r=>{if(r.reply!==null)process.exit(1);});",
        ),
        (
            "=start => en menu",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=start','h6').then(r=>{"
            "if(!r.reply.includes('Menu'))process.exit(1);});",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(name, ok, err[:80] if not ok and err else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
