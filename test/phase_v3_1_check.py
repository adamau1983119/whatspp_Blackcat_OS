#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 1 Checklist 驗證（V3 狀態機 + 中立 ctx）"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "test"))
from _verify_common import (  # noqa: E402
    MAX_LINES,
    check,
    count_lines,
    exit_phase,
    reset_checks,
    run_node_eval,
    run_node_script,
    summarize,
)

WRITER = "phase_v3_1_check.py"


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def grep_no_whatsapp_in_kernel() -> bool:
    ok = True
    for rel in ["lib/handler.js", "lib/handler-calc.js", "lib/handler-route.js"]:
        code = strip_comments((ROOT / rel).read_text(encoding="utf-8"))
        if "msg." in code or "client." in code or "sendMessage" in code:
            ok = False
    plug_dir = ROOT / "lib" / "plugins"
    if plug_dir.is_dir():
        for f in plug_dir.glob("*.js"):
            code = strip_comments(f.read_text(encoding="utf-8"))
            if "msg." in code or "client." in code:
                ok = False
    return ok


def main():
    reset_checks()
    print("=" * 50)
    print("Phase V3-1 Checklist 驗證")
    print("=" * 50)

    for rel in [
        "lib/kernel-sanitizer.js",
        "lib/plugin-dispatch.js",
        "lib/handler-route.js",
        "lib/handler-calc.js",
    ]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())
        if p.is_file():
            n = count_lines(p)
            check(f"{rel} <= {MAX_LINES} lines", n <= MAX_LINES, f"{n} lines")

    session_raw = (ROOT / "lib" / "session.js").read_text(encoding="utf-8")
    check("session.js has osState", "osState" in session_raw)
    check("session.js has appData.calc", "appData.calc" in session_raw)
    check("session.js has releaseToIdle", "releaseToIdle" in session_raw)
    check("session.js has meta.activeSource", "activeSource" in session_raw)
    check("session.js has enterMenu", "enterMenu" in session_raw)

    handler_raw = (ROOT / "lib" / "handler.js").read_text(encoding="utf-8")
    check("handler returns { reply }", "{ reply" in handler_raw)
    check("handler uses normalizeCtx", "normalizeCtx" in handler_raw)
    check("handler routing comment PROMPT_GUARD", "PROMPT_GUARD" in handler_raw)
    check("handler routing comment GAME_PLAYING", "GAME_PLAYING" in handler_raw)

    parse_raw = (ROOT / "lib" / "session.js").read_text(encoding="utf-8")
    check("getSession(principalId) pattern", "getSession" in parse_raw)

    cmds = (ROOT / "config" / "commands.json").read_text(encoding="utf-8")
    check("commands.json SETTLE", '"SETTLE"' in cmds)

    ok, out = run_node_script(ROOT / "test" / "session_v3.test.js")
    check("node test/session_v3.test.js passes", ok, out[:120] if out else "")

    ok, out = run_node_script(ROOT / "test" / "session.test.js")
    check("node test/session.test.js passes", ok, out[:120] if out else "")

    ok, out = run_node_script(ROOT / "test" / "handler.test.js")
    check("node test/handler.test.js passes", ok, out[:120] if out else "")

    cases = [
        (
            "getSession default IDLE",
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "if(getSession('x').osState!=='IDLE')process.exit(1);",
        ),
        (
            "=開始 => MENU",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','m1');"
            "if(getSession('m1').osState!=='MENU')process.exit(1);",
        ),
        (
            "MENU +500 blocked",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','m2');"
            "const r=handleMessage('+500','m2');"
            "if(!r.reply||!r.reply.includes('請先選擇'))process.exit(1);",
        ),
        (
            "enterMenu keeps calc entries",
            "const {getSession,enterMenu,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "const s=getSession('m3');"
            "s.appData.calc.entries.push({op:'+',value:1,raw:'+1'});"
            "s.appData.calc.total=1;"
            "enterMenu('m3');"
            "if(getSession('m3').appData.calc.entries.length!==1)process.exit(1);",
        ),
        (
            "sanitizer dirty JSON",
            "const {normalizeCtx}=require('./lib/kernel-sanitizer');"
            "const c=normalizeCtx({attachment:{hasAttachment:true,payload:{text:'x'}}});"
            "if(c.attachment.payload!=='x')process.exit(1);",
        ),
        (
            "parse SETTLE",
            "const {parseCommand}=require('./lib/parse');"
            "if(parseCommand('=結算','zh-TW').type!=='SETTLE')process.exit(1);",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(f"EVIDENCE {name}", ok, err[:80] if not ok and err else "")

    check("kernel/plugins no WhatsApp API", grep_no_whatsapp_in_kernel())

    r = subprocess.run([sys.executable, str(ROOT / "test" / "audit_hardcode.py")], cwd=ROOT)
    check("audit_hardcode.py PASS", r.returncode == 0)

    all_ok = summarize(1)
    exit_phase(1, all_ok, WRITER)


if __name__ == "__main__":
    main()
