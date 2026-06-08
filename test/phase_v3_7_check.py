#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 7 Checklist 驗證（泡泡龍合流 + WhatsApp 連線層）"""

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

WRITER = "phase_v3_7_check.py"


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"(?<!:)//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase V3-7 Checklist 驗證")
    print("=" * 50)

    for rel in [
        "lib/plugins/bubble_shooter.js",
        "lib/games/bubble-bridge.js",
        "lib/client.js",
        "lib/login.js",
        "index.js",
        "config/game-menu.json",
        "config/bubble/game.json",
    ]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())
        if p.is_file() and rel.endswith(".js"):
            check(f"{rel} <= {MAX_LINES} lines", count_lines(p) <= MAX_LINES)

    handler = (ROOT / "lib/handler.js").read_text(encoding="utf-8")
    check("handler GAME_PLAYING before parse", handler.find("GAME_PLAYING") < handler.find("parseCommand"))

    route = (ROOT / "lib/handler-route.js").read_text(encoding="utf-8")
    check("handler-route handleGameHub", "handleGameHub" in route)
    check("handler-route bubble-bridge", "bubble-bridge" in route)

    hub = strip_comments((ROOT / "lib/plugins/game_hub.js").read_text(encoding="utf-8"))
    check("game_hub uses game-menu.json", "game-menu.json" in hub)

    game_menu = json.loads((ROOT / "config/game-menu.json").read_text(encoding="utf-8"))
    bubble_items = [i for i in game_menu.get("items", []) if i.get("type") == "BUBBLE"]
    check("game-menu BUBBLE enabled", any(i.get("enabled", True) for i in bubble_items))

    index_raw = (ROOT / "index.js").read_text(encoding="utf-8")
    check("index.js fromMe filter", "if (!msg.fromMe) return" in index_raw)
    check("index.js buildCtxFromWhatsApp", "buildCtxFromWhatsApp" in index_raw)
    check("index.js sendMessage", "sendMessage" in index_raw)

    client_code = strip_comments((ROOT / "lib/client.js").read_text(encoding="utf-8"))
    check("client.js LocalAuth", "LocalAuth" in client_code)
    check("client.js createClient", "function createClient" in client_code)

    login_path = ROOT / "lib/login.js"
    if login_path.is_file():
        login_code = strip_comments(login_path.read_text(encoding="utf-8"))
        for fn in ["promptLoginMethod", "setupQREvents", "setupPairingEvents", "setupReadyEvent"]:
            check(f"login.js exports {fn}", f"function {fn}" in login_code)

    ok, out = run_node_script(ROOT / "test" / "phase7_v3.test.js")
    check("node test/phase7_v3.test.js passes", ok, out[:200] if out else "")

    cases = [
        (
            "GAME_HUB select 1 => GAME_PLAYING",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','g7a').then(()=>handleMessage('4','g7a'))"
            ".then(()=>handleMessage('1','g7a')).then(()=>{"
            "if(getSession('g7a').osState!=='GAME_PLAYING')process.exit(1);"
            "if(getSession('g7a').currentGame!=='BUBBLE')process.exit(2);});",
        ),
        (
            "GAME_PLAYING +500 blind pass no calc",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','g7b').then(()=>handleMessage('4','g7b'))"
            ".then(()=>handleMessage('1','g7b')).then(()=>handleMessage('+500','g7b'))"
            ".then(()=>{"
            "if(getSession('g7b').osState!=='GAME_PLAYING')process.exit(1);"
            "if(getSession('g7b').appData.calc.total!==0)process.exit(2);});",
        ),
        (
            "GAME_PLAYING L passthrough",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','g7c').then(()=>handleMessage('4','g7c'))"
            ".then(()=>handleMessage('1','g7c')).then(()=>handleMessage('L','g7c'))"
            ".then(r=>{"
            "if(!r.reply)process.exit(1);"
            "if(getSession('g7c').osState!=='GAME_PLAYING')process.exit(2);});",
        ),
        (
            "GAME_PLAYING =開始 => GAME_HUB",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=開始','g7d').then(()=>handleMessage('4','g7d'))"
            ".then(()=>handleMessage('1','g7d')).then(()=>handleMessage('=開始','g7d'))"
            ".then(()=>{if(getSession('g7d').osState!=='GAME_HUB')process.exit(1);});",
        ),
        (
            "createClient instantiates",
            "const {createClient}=require('./lib/client');"
            "const c=createClient();"
            "if(!c||typeof c.initialize!=='function')process.exit(1);",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(f"EVIDENCE {name}", ok, err[:120] if not ok and err else "")

    r = subprocess.run([sys.executable, str(ROOT / "test" / "audit_hardcode.py")], cwd=ROOT)
    check("audit_hardcode.py PASS", r.returncode == 0)

    r2 = subprocess.run([sys.executable, str(ROOT / "test" / "verify.py")], cwd=ROOT)
    check("verify.py PASS", r2.returncode == 0)

    all_ok = summarize(7)
    exit_phase(7, all_ok, WRITER)


if __name__ == "__main__":
    main()
