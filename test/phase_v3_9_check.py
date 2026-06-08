#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 9 Checklist 驗證（mock 整合測試 + V3 OS 全鏈）"""

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

WRITER = "phase_v3_9_check.py"
E2E_MAX_LINES = 200


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"(?<!:)//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase V3-9 Checklist 驗證")
    print("=" * 50)

    e2e_path = ROOT / "test" / "phase9_mock_e2e.test.js"
    check("phase9_mock_e2e.test.js exists", e2e_path.is_file())
    if e2e_path.is_file():
        n = count_lines(e2e_path)
        check(f"phase9_mock_e2e.test.js <= {E2E_MAX_LINES} lines", n <= E2E_MAX_LINES, f"{n} lines")
        e2e_raw = e2e_path.read_text(encoding="utf-8")
        check("e2e uses setupMessageCreate", "setupMessageCreate" in e2e_raw)
        check("e2e V3 fullwidth start", "＝開始" in e2e_raw)
        check("e2e V3 maps fast-track", "=地圖" in e2e_raw)
        check("e2e V3 GAME_HUB block", "'4'" in e2e_raw or '"4"' in e2e_raw)
        check("e2e quoted note", "getQuotedMessage" in e2e_raw)

    ok, out = run_node_script(e2e_path)
    check("node test/phase9_mock_e2e.test.js passes", ok, out[:200] if out else "")

    login_path = ROOT / "lib" / "login.js"
    check("lib/login.js exists", login_path.is_file())
    if login_path.is_file():
        lcode = strip_comments(login_path.read_text(encoding="utf-8"))
        check("login.js QR event", "client.on('qr'" in lcode)
        check("login.js pairing code event", "client.on('code'" in lcode)
        check("login.js ready event", "client.on('ready'" in lcode)

    cases = [
        (
            "unknown cmd no reply via transport",
            "const {EventEmitter}=require('events');"
            "const {setupMessageCreate}=require('./index');"
            "const {clearAllSessions}=require('./lib/session');"
            "const {resetSendQueues}=require('./lib/send-queue');"
            "clearAllSessions();resetSendQueues();"
            "const c=new EventEmitter();let n=0;"
            "c.sendMessage=async()=>{n++;};"
            "setupMessageCreate(c);"
            "c.emit('message_create',{fromMe:true,to:'z',body:'隨便聊',hasQuotedMsg:false});"
            "setImmediate(()=>setImmediate(()=>{if(n!==0)process.exit(1);}));",
        ),
        (
            "session A/B isolated",
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "getSession('isoA').appData.calc.total=100;"
            "if(getSession('isoB').appData.calc.total!==0)process.exit(1);",
        ),
        (
            "fullwidth =開始 parse",
            "const {parseCommand}=require('./lib/parse');"
            "if(parseCommand('＝開始','zh-TW').type!=='START')process.exit(1);",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(f"EVIDENCE {name}", ok, err[:120] if not ok and err else "")

    r9 = subprocess.run([sys.executable, str(ROOT / "test" / "phase9_check.py")], cwd=ROOT)
    check("phase9_check.py PASS", r9.returncode == 0)

    r = subprocess.run([sys.executable, str(ROOT / "test" / "audit_hardcode.py")], cwd=ROOT)
    check("audit_hardcode.py PASS", r.returncode == 0)

    r2 = subprocess.run([sys.executable, str(ROOT / "test" / "verify.py")], cwd=ROOT)
    check("verify.py PASS", r2.returncode == 0)

    all_ok = summarize(9)
    exit_phase(9, all_ok, WRITER)


if __name__ == "__main__":
    main()
