#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 2 Checklist 驗證（地圖 + 翻譯 Mock + 遊戲大廳）"""

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

WRITER = "phase_v3_2_check.py"


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def grep_no_whatsapp_in_plugins() -> bool:
    plug_dir = ROOT / "lib" / "plugins"
    if not plug_dir.is_dir():
        return False
    for f in plug_dir.glob("*.js"):
        code = strip_comments(f.read_text(encoding="utf-8"))
        if "msg." in code or "client." in code or "sendMessage" in code:
            return False
    return True


def main():
    reset_checks()
    print("=" * 50)
    print("Phase V3-2 Checklist 驗證")
    print("=" * 50)

    for rel in [
        "lib/plugin-dispatch.js",
        "lib/plugins/maps.js",
        "lib/plugins/translate.js",
        "lib/plugins/game_hub.js",
    ]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())
        if p.is_file():
            n = count_lines(p)
            check(f"{rel} <= {MAX_LINES} lines", n <= MAX_LINES, f"{n} lines")

    maps_raw = (ROOT / "lib" / "plugins" / "maps.js").read_text(encoding="utf-8")
    check("maps.js uses encodeURIComponent", "encodeURIComponent" in maps_raw)
    check("maps.js no await external API", "await " not in strip_comments(maps_raw))

    msgs = (ROOT / "config" / "messages.json").read_text(encoding="utf-8")
    for key in ("mapsPrompt", "mapsResult", "translatePrompt", "GAME_HUB_MENU"):
        check(f"messages.json has {key}", f'"{key}"' in msgs)

    cmds = (ROOT / "config" / "commands.json").read_text(encoding="utf-8")
    check("commands.json plugins SYS_MAPS", '"SYS_MAPS"' in cmds and '"plugins"' in cmds)

    parse_raw = (ROOT / "lib" / "parse.js").read_text(encoding="utf-8")
    check("parse.js parsePluginPrefix implemented", "commandsCache.plugins" in parse_raw)

    ok, out = run_node_script(ROOT / "test" / "handler_v3_smoke.test.js")
    check("node test/handler_v3_smoke.test.js passes", ok, out[:200] if out else "")

    cases = [
        (
            "=開始 => MENU + OS_MENU",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','p2a').then(r=>{"
            "if(getSession('p2a').osState!=='MENU')process.exit(1);"
            "if(!r.reply||!r.reply.includes('黑貓 OS'))process.exit(2);});",
        ),
        (
            "MENU 2 tools maps 3-click",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','p2b').then(()=>handleMessage('2','p2b'))"
            ".then(()=>handleMessage('1','p2b'))"
            ".then(()=>handleMessage('時代廣場','p2b')).then(r=>{"
            "if(!r.reply.includes('maps.apple.com'))process.exit(1);"
            "if(!r.reply.includes('google.com/maps'))process.exit(2);"
            "if(getSession('p2b').osState!=='IDLE')process.exit(3);});",
        ),
        (
            "IDLE =地圖 銅鑼灣 fast-track",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=地圖 銅鑼灣','p2c').then(r=>{"
            "if(!r.reply.includes('maps.apple.com'))process.exit(1);"
            "if(getSession('p2c').osState!=='IDLE')process.exit(2);});",
        ),
        (
            "URL encoding 銅鑼灣時代廣場",
            "const {buildUrls}=require('./lib/plugins/maps');"
            "const u=buildUrls('銅鑼灣時代廣場');"
            "if(!u.appleMapsUrl.includes('%'))process.exit(1);",
        ),
        (
            "MENU 3 translate => IDLE",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','p2d').then(()=>handleMessage('3','p2d')).then(r=>{"
            "if(!r.reply.includes('翻譯')&&!r.reply.includes('Translate'))process.exit(1);"
            "if(getSession('p2d').osState!=='IDLE')process.exit(2);});",
        ),
        (
            "MENU 4 GAME_HUB +500 blocked",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','p2e').then(()=>handleMessage('4','p2e'))"
            ".then(()=>{if(getSession('p2e').osState!=='GAME_HUB')process.exit(1);"
            "return handleMessage('+500','p2e');}).then(r=>{"
            "if(!r.reply||!r.reply.includes('請先選擇'))process.exit(2);"
            "if(getSession('p2e').osState!=='GAME_HUB')process.exit(3);});",
        ),
        (
            "parsePluginPrefix =地圖",
            "const {parsePluginPrefix}=require('./lib/parse');"
            "const p=parsePluginPrefix('=地圖 測試');"
            "if(!p||p.type!=='SYS_MAPS'||p.payload!=='測試')process.exit(1);",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(f"EVIDENCE {name}", ok, err[:120] if not ok and err else "")

    check("plugins no WhatsApp API", grep_no_whatsapp_in_plugins())

    dispatch_raw = (ROOT / "lib" / "plugin-dispatch.js").read_text(encoding="utf-8")
    check("plugin-dispatch try/catch isolation", "try {" in dispatch_raw and "catch" in dispatch_raw)

    r = subprocess.run([sys.executable, str(ROOT / "test" / "audit_hardcode.py")], cwd=ROOT)
    check("audit_hardcode.py PASS", r.returncode == 0)

    r2 = subprocess.run([sys.executable, str(ROOT / "test" / "verify.py")], cwd=ROOT)
    check("verify.py PASS", r2.returncode == 0)

    all_ok = summarize(2)
    exit_phase(2, all_ok, WRITER)


if __name__ == "__main__":
    main()
