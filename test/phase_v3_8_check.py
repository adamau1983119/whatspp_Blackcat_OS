#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 8 Checklist 驗證（WhatsApp Transport + 送訊佇列）"""

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

WRITER = "phase_v3_8_check.py"


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"(?<!:)//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase V3-8 Checklist 驗證")
    print("=" * 50)

    for rel in ["lib/send-queue.js", "lib/whatsapp-adapter.js", "index.js"]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())
        if p.is_file():
            check(f"{rel} <= {MAX_LINES} lines", count_lines(p) <= MAX_LINES)

    index_raw = (ROOT / "index.js").read_text(encoding="utf-8")
    index_code = strip_comments(index_raw)
    check("index.js Phase 8 comment", "Phase 8" in index_raw or "入口" in index_raw)
    check("index.js message_create", "message_create" in index_code)
    check("index.js fromMe filter", "if (!msg.fromMe) return" in index_code)
    check("index.js buildCtxFromWhatsApp", "buildCtxFromWhatsApp" in index_code)
    check("index.js enqueueSend", "enqueueSend" in index_code)
    check("index.js deliverReply", "deliverReply" in index_code)
    check("index.js no message event", "client.on('message'" not in index_code)

    adapter = (ROOT / "lib/whatsapp-adapter.js").read_text(encoding="utf-8")
    check("adapter getQuotedMessage", "getQuotedMessage" in adapter)
    check("adapter downloadMedia", "downloadMedia" in adapter)

    queue = strip_comments((ROOT / "lib/send-queue.js").read_text(encoding="utf-8"))
    check("send-queue enqueueSend", "function enqueueSend" in queue)

    ok, out = run_node_script(ROOT / "test" / "transport_v3.test.js")
    check("node test/transport_v3.test.js passes", ok, out[:200] if out else "")

    cases = [
        (
            "fromMe false no reply path",
            "const {EventEmitter}=require('events');"
            "const {setupMessageCreate}=require('./index');"
            "const c=new EventEmitter();let n=0;"
            "c.sendMessage=async()=>{n++;};"
            "setupMessageCreate(c);"
            "c.emit('message_create',{fromMe:false,to:'x',body:'=開始'});"
            "setImmediate(()=>{if(n!==0)process.exit(1);});",
        ),
        (
            "quoted text in ctx",
            "const {buildCtxFromWhatsApp}=require('./lib/whatsapp-adapter');"
            "buildCtxFromWhatsApp({to:'q',body:'=記',hasQuotedMsg:true,"
            "getQuotedMessage:async()=>({body:'AI歌詞',type:'chat'})})"
            ".then(c=>{if(c.attachment.payload!=='AI歌詞')process.exit(1);});",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(f"EVIDENCE {name}", ok, err[:120] if not ok and err else "")

    r8 = subprocess.run([sys.executable, str(ROOT / "test" / "phase8_check.py")], cwd=ROOT)
    check("phase8_check.py PASS", r8.returncode == 0)

    r = subprocess.run([sys.executable, str(ROOT / "test" / "audit_hardcode.py")], cwd=ROOT)
    check("audit_hardcode.py PASS", r.returncode == 0)

    r2 = subprocess.run([sys.executable, str(ROOT / "test" / "verify.py")], cwd=ROOT)
    check("verify.py PASS", r2.returncode == 0)

    all_ok = summarize(8)
    exit_phase(8, all_ok, WRITER)


if __name__ == "__main__":
    main()
