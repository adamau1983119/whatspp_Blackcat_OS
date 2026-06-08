#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 7 第三方驗證 — 登入流程 login.js"""

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

PHASE = 7


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 7 Checklist (third-party Python)")
    print("=" * 50)

    login_path = ROOT / "lib" / "login.js"

    check("lib/login.js exists", login_path.is_file())
    if login_path.is_file():
        lines = count_lines(login_path)
        check("lib/login.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        raw = login_path.read_text(encoding="utf-8")
        code = strip_comments(raw)
        check("lib/login.js has Chinese comments", "登入" in raw or "互動" in raw)
        check("login.js uses readline", "readline" in code)
        check("login.js uses qrcode-terminal", "qrcode-terminal" in code)
        for fn in [
            "promptLoginMethod",
            "promptPhoneNumber",
            "setupQREvents",
            "setupPairingEvents",
            "setupReadyEvent",
        ]:
            check(f"lib/login.js exports {fn}", f"function {fn}" in code)
        check("setupQREvents listens qr", "client.on('qr'" in code)
        check("setupPairingEvents listens code", "client.on('code'" in code)
        check("setupReadyEvent listens ready", "client.on('ready'" in code)
        check("ready message 機器人已就緒", "機器人已就緒" in raw)

    cases = [
        (
            "promptLoginMethod returns qr for 1",
            "const {promptLoginMethod}=require('./lib/login');"
            "const rl={question:(q,cb)=>cb('1'),close:()=>{}};"
            "promptLoginMethod(rl).then(m=>{if(m!=='qr')process.exit(1);});",
        ),
        (
            "promptLoginMethod returns pairing for 2",
            "const {promptLoginMethod}=require('./lib/login');"
            "const rl={question:(q,cb)=>cb('2'),close:()=>{}};"
            "promptLoginMethod(rl).then(m=>{if(m!=='pairing')process.exit(1);});",
        ),
        (
            "promptPhoneNumber strips non-digits",
            "const {promptPhoneNumber}=require('./lib/login');"
            "const rl={question:(q,cb)=>cb('852 9876-5432'),close:()=>{}};"
            "promptPhoneNumber(rl).then(p=>{if(p!=='85298765432')process.exit(1);});",
        ),
        (
            "setupQREvents calls qr renderer",
            "const {EventEmitter}=require('events');"
            "const {setupQREvents}=require('./lib/login');"
            "const c=new EventEmitter();let ok=false;"
            "setupQREvents(c,(qr)=>{if(qr==='qrdata')ok=true;});"
            "c.emit('qr','qrdata');"
            "if(!ok)process.exit(1);",
        ),
        (
            "setupPairingEvents handles code event",
            "const {EventEmitter}=require('events');"
            "const {setupPairingEvents}=require('./lib/login');"
            "const c=new EventEmitter();"
            "setupPairingEvents(c,'85298765432');"
            "c.emit('code','12345678');",
        ),
        (
            "setupReadyEvent handles ready event",
            "const {EventEmitter}=require('events');"
            "const {setupReadyEvent}=require('./lib/login');"
            "const c=new EventEmitter();"
            "setupReadyEvent(c);"
            "c.emit('ready');",
        ),
    ]

    for name, code in cases:
        ok, err = run_node_eval(code)
        check(name, ok, err[:80] if not ok and err else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
