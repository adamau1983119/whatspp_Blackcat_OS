#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 4 第三方驗證 — Session 管理 + locale"""

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

PHASE = 4


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 4 Checklist (third-party Python)")
    print("=" * 50)

    session_path = ROOT / "lib" / "session.js"
    test_path = ROOT / "test" / "session.test.js"

    check("lib/session.js exists", session_path.is_file())
    if session_path.is_file():
        lines = count_lines(session_path)
        check("lib/session.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        content = session_path.read_text(encoding="utf-8")
        check("lib/session.js has Chinese comments", "Session" in content or "語系" in content)
        for fn in ["getSession", "startSession", "endSession"]:
            check(f"lib/session.js exports {fn}", f"function {fn}" in content)
        check("session structure has locale", "locale" in content and "osState" in content)

    check("test/session.test.js exists", test_path.is_file())
    if test_path.is_file():
        tlines = count_lines(test_path)
        check("test/session.test.js <= 150 lines", tlines <= MAX_LINES, f"{tlines} lines")

    ok, out = run_node_script(test_path)
    check("node test/session.test.js passes", ok, out[:120] if out else "")

    cases = [
        (
            "getSession auto-creates",
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "const s=getSession('x');"
            "if(!s||s.osState!=='IDLE'||s.appData.calc.total!==0)process.exit(1);",
        ),
        (
            "chatId A and B isolated",
            "const {getSession,startSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "startSession('A','zh-TW');startSession('B','en');"
            "if(getSession('A').locale!=='zh-TW'||getSession('B').locale!=='en')process.exit(1);",
        ),
        (
            "startSession resets calc entries",
            "const {getSession,startSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();startSession('c','zh-TW');"
            "const s=getSession('c');"
            "s.appData.calc.entries.push({op:'+',value:1,raw:'+1'});s.appData.calc.total=1;"
            "startSession('c','zh-TW');"
            "const r=getSession('c');"
            "if(r.osState!=='APP_ACTIVE'||r.appData.calc.total!==0||r.appData.calc.entries.length!==0)process.exit(1);",
        ),
        (
            "endSession returns total and clears",
            "const {getSession,startSession,endSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();startSession('d','en');"
            "getSession('d').appData.calc.total=425;"
            "const e=endSession('d');"
            "if(e.total!==425||e.locale!=='en')process.exit(1);"
            "const a=getSession('d');"
            "if(a.osState!=='IDLE'||a.appData.calc.total!==0||a.appData.calc.entries.length!==0)process.exit(1);",
        ),
        (
            "startSession locks locale for ops",
            "const {getSession,startSession,clearAllSessions}=require('./lib/session');"
            "const {addEntry}=require('./lib/calc');"
            "clearAllSessions();startSession('e','en');"
            "const s=getSession('e');"
            "const r=addEntry(s.appData.calc.entries,{op:'+',value:500,raw:'+500'});"
            "s.appData.calc.entries=r.entries;s.appData.calc.total=r.total;"
            "if(s.locale!=='en'||s.appData.calc.total!==500)process.exit(1);",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(name, ok, err[:80] if not ok and err else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
