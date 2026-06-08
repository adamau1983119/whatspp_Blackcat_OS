#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 4 Checklist 驗證（真實翻譯 API + 搜尋 L0/L1/L2）"""

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

WRITER = "phase_v3_4_check.py"


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
    print("Phase V3-4 Checklist 驗證")
    print("=" * 50)

    for rel in [
        "lib/plugins/translate.js",
        "lib/plugins/search.js",
        "lib/search-url.js",
        "lib/search-cse.js",
        "lib/search-llm.js",
        "config/search-prompts.json",
    ]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())
        if p.is_file() and rel.endswith(".js"):
            n = count_lines(p)
            check(f"{rel} <= {MAX_LINES} lines", n <= MAX_LINES, f"{n} lines")

    tr_raw = (ROOT / "lib" / "plugins" / "translate.js").read_text(encoding="utf-8")
    check("translate.js uses google-translate-api", "@vitalets/google-translate-api" in tr_raw)
    check("translate.js no translateMock", "translateMock" not in tr_raw)

    sr_raw = (ROOT / "lib" / "plugins" / "search.js").read_text(encoding="utf-8")
    check("search.js uses encodeURIComponent via search-url", "search-url" in sr_raw)
    check("search.js no await mock API", "translateMock" not in sr_raw)

    msgs = (ROOT / "config" / "messages.json").read_text(encoding="utf-8")
    for key in ("translateResult", "translateSetup", "searchL0Result", "searchSetupHint"):
        check(f"messages.json has {key}", f'"{key}"' in msgs)
    check("messages no translateMock user key", '"translateMock"' not in msgs)

    cmds = (ROOT / "config" / "commands.json").read_text(encoding="utf-8")
    check("commands SYS_SEARCH =查", '"SYS_SEARCH"' in cmds and "=查" in cmds)

    dispatch_raw = (ROOT / "lib" / "plugin-dispatch.js").read_text(encoding="utf-8")
    check("plugin-dispatch dispatchPluginAsync", "dispatchPluginAsync" in dispatch_raw)

    ok, out = run_node_script(ROOT / "test" / "translate_v3.test.js")
    check("node test/translate_v3.test.js passes", ok, out[:200] if out else "")

    ok, out = run_node_script(ROOT / "test" / "search_v3.test.js")
    check("node test/search_v3.test.js passes", ok, out[:200] if out else "")

    cases = [
        (
            "=查 灣仔中菜 L0 URL + IDLE",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=查 灣仔中菜','p4a').then(r=>{"
            "if(!r.reply.includes('google.com/search'))process.exit(1);"
            "if(getSession('p4a').osState!=='IDLE')process.exit(2);"
            "});",
        ),
        (
            "search URL encoding",
            "const {buildGoogleSearchUrl}=require('./lib/search-url');"
            "const u=buildGoogleSearchUrl('灣仔中菜');"
            "if(!u.includes('%'))process.exit(1);",
        ),
        (
            "=翻 en 你好 real translate",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=翻 en 你好','p4b').then(r=>{"
            "if(!r.reply||r.reply.includes('Mock'))process.exit(1);"
            "if(getSession('p4b').osState!=='IDLE')process.exit(2);"
            "});",
        ),
        (
            "translate prompt when empty",
            "const {handleMessage}=require('./lib/handler');"
            "const {clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=翻','p4c').then(r=>{"
            "if(!r.reply.includes('引用')&&!r.reply.includes('Quote'))process.exit(1);"
            "});",
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

    all_ok = summarize(4)
    exit_phase(4, all_ok, WRITER)


if __name__ == "__main__":
    main()
