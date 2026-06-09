#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 5 Checklist 驗證（郵件 + 待辦 + Clock L0）"""

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

WRITER = "phase_v3_5_check.py"


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
    print("Phase V3-5 Checklist 驗證")
    print("=" * 50)

    for rel in [
        "lib/plugins/mail.js",
        "lib/plugins/todo.js",
        "lib/plugins/clock.js",
        "config/email-routes.json",
        "config/clock-urls.json",
    ]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())
        if p.is_file() and rel.endswith(".js"):
            check(f"{rel} <= {MAX_LINES} lines", count_lines(p) <= MAX_LINES)

    clock_code = strip_comments((ROOT / "lib/plugins/clock.js").read_text(encoding="utf-8"))
    check("clock.js no setTimeout", "setTimeout" not in clock_code)

    mail_code = strip_comments((ROOT / "lib/plugins/mail.js").read_text(encoding="utf-8"))
    check("mail.js uses mailto", "mailto" in mail_code or "buildMailtoUrl" in mail_code)
    check("mail.js uses buildMailtoUrl", "buildMailtoUrl" in mail_code)

    msgs = (ROOT / "config/messages.json").read_text(encoding="utf-8")
    check("messages clockHandoffDisclaimer", '"clockHandoffDisclaimer"' in msgs)
    check("messages mailL0Result", '"mailL0Result"' in msgs)
    check("messages forbid 已為你設定提醒", "已為你設定提醒" not in msgs)
    check("messages forbid 保證送達 alone", "保證送達" not in msgs or "不保證送達" in msgs)

    cmds = (ROOT / "config/commands.json").read_text(encoding="utf-8")
    check("commands SYS_MAIL", '"SYS_MAIL"' in cmds)
    check("commands SYS_TODO", '"SYS_TODO"' in cmds)
    check("commands SYS_CLOCK =提醒我", "=提醒我" in cmds)

    ok, out = run_node_script(ROOT / "test" / "phase5_v3.test.js")
    check("node test/phase5_v3.test.js passes", ok, out[:200] if out else "")

    cases = [
        (
            "mail L0 mailto",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=email','p5a').then(r=>handleMessage('1','p5a')).then(r=>{"
            "if(!r.reply.includes('/mail?'))process.exit(1);"
            "if(getSession('p5a').osState!=='IDLE')process.exit(2);});",
        ),
        (
            "todo append + IDLE",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=待辦 買鮮奶','p5b').then(()=>{"
            "if(getSession('p5b').appData.todos.length!==1)process.exit(1);"
            "if(getSession('p5b').osState!=='IDLE')process.exit(2);});",
        ),
        (
            "clock 15min link",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=提醒我 15分鐘後開會','p5c').then(r=>{"
            "if(!r.reply.includes('calendar.google.com'))process.exit(1);"
            "if(!r.reply.includes('iPhone')&&!r.reply.includes('iOS'))process.exit(2);});",
        ),
        (
            "buildMailtoUrl encode",
            "const {buildMailtoUrl}=require('./lib/mailto');"
            "const u=buildMailtoUrl('a@b.com','主題','內文');"
            "if(!u.includes('mailto:'))process.exit(1);",
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

    all_ok = summarize(5)
    exit_phase(5, all_ok, WRITER)


if __name__ == "__main__":
    main()
