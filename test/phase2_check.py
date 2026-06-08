#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 2 第三方驗證 — 語系感知指令解析"""

import json
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

PHASE = 2


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def all_aliases(data: dict) -> list[str]:
    out = []
    for g in ("exact", "prefix"):
        for rule in data.get(g, []):
            out.extend(rule.get("aliases", []))
    return out


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 2 Checklist (third-party Python)")
    print("=" * 50)

    cfg_path = ROOT / "config" / "commands.json"
    msg_path = ROOT / "config" / "messages.json"
    parse_path = ROOT / "lib" / "parse.js"
    test_path = ROOT / "test" / "parse.test.js"

    check("config/commands.json exists", cfg_path.is_file())
    check("config/messages.json exists", msg_path.is_file())

    if cfg_path.is_file():
        data = json.loads(cfg_path.read_text(encoding="utf-8"))
        check("commands.json has exact rules", isinstance(data.get("exact"), list))
        check("commands.json has prefix rules", isinstance(data.get("prefix"), list))
        check("commands.json has defaultLocale", bool(data.get("defaultLocale")))
        types = {r["type"] for r in data.get("exact", [])}
        check("commands.json covers START/END/UNDO", {"START", "END", "UNDO"}.issubset(types))

    if parse_path.is_file():
        content = strip_comments(parse_path.read_text(encoding="utf-8"))
        check("lib/parse.js <= 150 lines", count_lines(parse_path) <= MAX_LINES)
        check("parse.js returns locale", "locale" in content)
        check("parse.js reads commands.json", "commands.json" in content)
        check("parse.js has normalizeInput", "function normalizeInput" in content)
        if cfg_path.is_file():
            data = json.loads(cfg_path.read_text(encoding="utf-8"))
            hard = [a for a in all_aliases(data) if f"'{a}'" in content or f'"{a}"' in content]
            check("parse.js no hardcoded aliases", len(hard) == 0, ", ".join(hard) or "ok")

    ok, out = run_node_script(test_path)
    check("node test/parse.test.js passes", ok, out[:120] if out else "")

    cases = [
        ("=開始 => START zh-TW", "const {parseCommand}=require('./lib/parse');"
         "const r=parseCommand('=開始');"
         "if(r.type!=='START'||r.locale!=='zh-TW')process.exit(1);"),
        ("=start => START en", "const {parseCommand}=require('./lib/parse');"
         "const r=parseCommand('=start');"
         "if(r.type!=='START'||r.locale!=='en')process.exit(1);"),
        ("=end => END en", "const {parseCommand}=require('./lib/parse');"
         "if(parseCommand('=end').locale!=='en')process.exit(1);"),
        ("+500 en session locale", "const {parseCommand}=require('./lib/parse');"
         "if(parseCommand('+500','en').locale!=='en')process.exit(1);"),
        ("modify => MODIFY en", "const {parseCommand}=require('./lib/parse');"
         "if(parseCommand('modify +1 +2').locale!=='en')process.exit(1);"),
        ("getAliasHint per locale", "const {getAliasHint}=require('./lib/parse');"
         "if(getAliasHint('START','en')!=='=start')process.exit(1);"),
        ("normalizeInput fullwidth trim", "const {normalizeInput}=require('./lib/parse');"
         "if(normalizeInput('  ＝開始  ')!=='=開始')process.exit(1);"),
        ("＝開始 => START zh-TW", "const {parseCommand}=require('./lib/parse');"
         "const r=parseCommand('＝開始');"
         "if(r.type!=='START'||r.locale!=='zh-TW')process.exit(1);"),
        ("＋500 => OPERATION", "const {parseCommand}=require('./lib/parse');"
         "const r=parseCommand('＋500');"
         "if(r.type!=='OPERATION'||r.op!=='+')process.exit(1);"),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(name, ok, err[:80] if not ok and err else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
