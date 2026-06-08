#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 3 Checklist 驗證（WhatsApp Adapter + 黑貓備忘錄）"""

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

WRITER = "phase_v3_3_check.py"


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
    print("Phase V3-3 Checklist 驗證")
    print("=" * 50)

    index_raw = (ROOT / "index.js").read_text(encoding="utf-8")
    index_code = strip_comments(index_raw)
    check("index.js has buildCtxFromWhatsApp", "buildCtxFromWhatsApp" in index_raw)
    check("index.js calls handleMessage", "handleMessage" in index_code)
    check("index.js sendMessage adapter", "sendMessage" in index_code)
    n_index = count_lines(ROOT / "index.js")
    check("index.js <= 150 lines", n_index <= MAX_LINES, f"{n_index} lines")

    adapter_path = ROOT / "lib" / "whatsapp-adapter.js"
    check("lib/whatsapp-adapter.js exists", adapter_path.is_file())
    if adapter_path.is_file():
        adapter_code = strip_comments(adapter_path.read_text(encoding="utf-8"))
        check("adapter has getQuotedMessage", "getQuotedMessage" in adapter_code)
        check("adapter <= 150 lines", count_lines(adapter_path) <= MAX_LINES)

    notes_path = ROOT / "lib" / "plugins" / "notes.js"
    check("lib/plugins/notes.js exists", notes_path.is_file())
    if notes_path.is_file():
        notes_raw = notes_path.read_text(encoding="utf-8")
        check("notes.js <= 150 lines", count_lines(notes_path) <= MAX_LINES)
        check("notes mentions 黑貓備忘錄", "黑貓備忘錄" in notes_raw or "notesSaved" in notes_raw)
        check("notes no iOS sync claim", "iOS Notes" not in notes_raw and "已同步" not in notes_raw)

    msgs = (ROOT / "config" / "messages.json").read_text(encoding="utf-8")
    check("messages.json notesSaved", '"notesSaved"' in msgs)
    check("messages.json notesEmpty", '"notesEmpty"' in msgs)
    check("messages 黑貓備忘錄 wording", "黑貓備忘錄" in msgs)

    cmds = (ROOT / "config" / "commands.json").read_text(encoding="utf-8")
    check("commands SAVE_NOTE =記", '"SAVE_NOTE"' in cmds and "=記" in cmds)

    handler_raw = (ROOT / "lib" / "handler.js").read_text(encoding="utf-8")
    check("handler returns { reply }", "{ reply" in handler_raw)

    ok, out = run_node_script(ROOT / "test" / "notes_v3.test.js")
    check("node test/notes_v3.test.js passes", ok, out[:200] if out else "")

    cases = [
        (
            "=記 + attachment => notes[1] IDLE",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=記','p3a',{attachment:{hasAttachment:true,type:'TEXT',payload:'AI歌詞'}})"
            ".then(()=>{if(getSession('p3a').appData.notes.length!==1)process.exit(1);"
            "if(getSession('p3a').osState!=='IDLE')process.exit(2);});",
        ),
        (
            "=記 empty => notesEmpty",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=記','p3b').then(r=>{"
            "if(!r.reply||!r.reply.includes('引用'))process.exit(1);"
            "if(getSession('p3b').appData.notes.length!==0)process.exit(2);});",
        ),
        (
            "=筆記 買鮮奶 append",
            "const {handleMessage}=require('./lib/handler');"
            "const {getSession,clearAllSessions}=require('./lib/session');"
            "clearAllSessions();"
            "handleMessage('=筆記 買鮮奶','p3c').then(()=>{"
            "if(getSession('p3c').appData.notes[0].text!=='買鮮奶')process.exit(1);});",
        ),
        (
            "buildCtxFromWhatsApp quoted TEXT",
            "const {buildCtxFromWhatsApp}=require('./lib/whatsapp-adapter');"
            "buildCtxFromWhatsApp({to:'p3d',body:'=記',hasQuotedMsg:true,"
            "getQuotedMessage:async()=>({body:'AI歌詞',type:'chat'})})"
            ".then(c=>{if(c.attachment.payload!=='AI歌詞')process.exit(1);"
            "if(c.attachment.type!=='TEXT')process.exit(2);})"
            ".catch(()=>process.exit(3));",
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

    all_ok = summarize(3)
    exit_phase(3, all_ok, WRITER)


if __name__ == "__main__":
    main()
