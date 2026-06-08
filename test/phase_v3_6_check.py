#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 6 Checklist 驗證（行事曆 + OCR + Tools Hub + 滿編選單）"""

import json
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

WRITER = "phase_v3_6_check.py"


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
    print("Phase V3-6 Checklist 驗證")
    print("=" * 50)

    for rel in [
        "lib/plugins/calendar.js",
        "lib/plugins/photos.js",
        "config/tools-menu.json",
        "config/bookmarks.json",
        "lib/handler-tools.js",
    ]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())
        if p.is_file() and rel.endswith(".js"):
            check(f"{rel} <= {MAX_LINES} lines", count_lines(p) <= MAX_LINES)

    adapter = (ROOT / "lib" / "whatsapp-adapter.js").read_text(encoding="utf-8")
    check("whatsapp-adapter downloadMedia IMAGE", "downloadMedia" in adapter)

    clock_code = strip_comments((ROOT / "lib/plugins/clock.js").read_text(encoding="utf-8"))
    check("clock.js no setTimeout", "setTimeout" not in clock_code)

    photos_code = strip_comments((ROOT / "lib/plugins/photos.js").read_text(encoding="utf-8"))
    check("photos.js uses addEntry", "addEntry" in photos_code)

    cal_raw = (ROOT / "lib/plugins/calendar.js").read_text(encoding="utf-8")
    check("calendar.js calendar.google.com", "calendar.google.com" in cal_raw)

    menu = json.loads((ROOT / "config" / "menu.json").read_text(encoding="utf-8"))
    check("menu.json items <= 7", len(menu.get("items", [])) <= 7)
    types = [i.get("type") for i in menu.get("items", [])]
    check("menu has GAME_HUB", "GAME_HUB" in types)
    check("menu has TOOLS_HUB", "TOOLS_HUB" in types)

    tools = json.loads((ROOT / "config" / "tools-menu.json").read_text(encoding="utf-8"))
    tool_types = [i.get("type") for i in tools.get("items", [])]
    check("tools-menu has SYS_MAPS", "SYS_MAPS" in tool_types)
    check("tools-menu has SYS_MAIL", "SYS_MAIL" in tool_types)

    msgs = (ROOT / "config" / "messages.json").read_text(encoding="utf-8")
    check("messages calendarOpenNative", '"calendarOpenNative"' in msgs)
    check("messages forbid 已為你設定提醒", "已為你設定提醒" not in msgs)

    cmds = (ROOT / "config" / "commands.json").read_text(encoding="utf-8")
    check("commands HELP =說明", '"HELP"' in cmds and "=說明" in cmds)

    ok, out = run_node_script(ROOT / "test" / "phase6_v3.test.js")
    check("node test/phase6_v3.test.js passes", ok, out[:200] if out else "")

    cases = [
        (
            "Tools Hub maps 2-click",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','p6a').then(()=>handleMessage('2','p6a'))"
            ".then(()=>handleMessage('1','p6a'))"
            ".then(()=>handleMessage('時代廣場','p6a')).then(r=>{"
            "if(!r.reply.includes('maps.apple.com'))process.exit(1);"
            "if(getSession('p6a').osState!=='IDLE')process.exit(2);});",
        ),
        (
            "IMAGE OCR + calc",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('','p6b',{attachment:{hasAttachment:true,type:'IMAGE',"
            "payload:'TOTAL 50.00'}}).then(()=>{"
            "if(getSession('p6b').appData.calc.total!==50)process.exit(1);});",
        ),
        (
            "=說明 command list",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=說明','p6c').then(r=>{"
            "if(!r.reply.includes('=開始')&&!r.reply.includes('=start'))process.exit(1);});",
        ),
        (
            "=行程 calendar link",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=行程','p6d').then(r=>{"
            "if(!r.reply.includes('calendar.google.com'))process.exit(1);});",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(f"EVIDENCE {name}", ok, err[:120] if not ok and err else "")

    check("kernel/plugins no WhatsApp API", grep_no_whatsapp_in_kernel())

    r = subprocess.run([sys.executable, str(ROOT / "test" / "audit_hardcode.py")], cwd=ROOT)
    check("audit_hardcode.py PASS", r.returncode == 0)

    r2 = subprocess.run([sys.executable, str(ROOT / "test" / "verify.py")], cwd=ROOT)
    check("verify.py PASS", r2.returncode == 0)

    all_ok = summarize(6)
    exit_phase(6, all_ok, WRITER)


if __name__ == "__main__":
    main()
