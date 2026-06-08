#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 1 第三方驗證（獨立於 lib/format.js 實作者）"""

from pathlib import Path
import sys

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

PHASE = 1


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 1 Checklist (third-party Python)")
    print("=" * 50)

    fmt_path = ROOT / "lib" / "format.js"
    msg_js_path = ROOT / "lib" / "messages.js"
    msg_cfg_path = ROOT / "config" / "messages.json"
    test_path = ROOT / "test" / "format.test.js"

    # 檔案存在與行數
    check("lib/format.js exists", fmt_path.is_file())
    if fmt_path.is_file():
        lines = count_lines(fmt_path)
        check("lib/format.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        content = fmt_path.read_text(encoding="utf-8")
        check("lib/format.js has Chinese comments", "格式化" in content or "純" in content)
        for fn in ["formatNumber", "formatTrajectory", "formatResult", "formatFinal"]:
            check(f"lib/format.js exports {fn}", f"function {fn}" in content)

    check("lib/messages.js exists", msg_js_path.is_file())
    if msg_js_path.is_file():
        mlines = count_lines(msg_js_path)
        check("lib/messages.js <= 150 lines", mlines <= MAX_LINES, f"{mlines} lines")
        mcontent = msg_js_path.read_text(encoding="utf-8")
        check("lib/messages.js has Chinese comments", "文案" in mcontent or "語系" in mcontent)

    check("config/messages.json exists", msg_cfg_path.is_file())
    if msg_cfg_path.is_file():
        import json

        mcfg = json.loads(msg_cfg_path.read_text(encoding="utf-8"))
        check("messages.json has defaultLocale", bool(mcfg.get("defaultLocale")))
        check("messages.json has zh-TW", "zh-TW" in mcfg)
        check("messages.json has en", "en" in mcfg)

    check("test/format.test.js exists", test_path.is_file())
    if test_path.is_file():
        tlines = count_lines(test_path)
        check("test/format.test.js <= 150 lines", tlines <= MAX_LINES, f"{tlines} lines")

    # 執行 Node 單元測試（第三方觸發，非實作者自評）
    ok, out = run_node_script(test_path)
    check("node test/format.test.js passes", ok, out[:120] if out else "")

    # 行為驗證（透過 node -e 實際呼叫模組）
    cases = [
        (
            "formatNumber() integer no decimal",
            "const {formatNumber}=require('./lib/format');"
            "if(formatNumber(500)!=='500') process.exit(1);",
        ),
        (
            "formatTrajectory() => 0 + 500 + 1200",
            "const {formatTrajectory}=require('./lib/format');"
            "const e=[{op:'+',value:500},{op:'+',value:1200}];"
            "if(formatTrajectory(e)!=='0 + 500 + 1200') process.exit(1);",
        ),
        (
            "formatResult() zh-TW labels",
            "const {formatResult}=require('./lib/format');"
            "const r=formatResult({total:1700,entries:[{op:'+',value:500},{op:'+',value:1200}]},'zh-TW');"
            "if(r!=='目前總計：1700\\n計算軌跡：0 + 500 + 1200') process.exit(1);",
        ),
        (
            "formatResult() en labels",
            "const {formatResult}=require('./lib/format');"
            "const r=formatResult({total:100,entries:[{op:'+',value:100}]},'en');"
            "if(!r.startsWith('Current total')) process.exit(1);",
        ),
        (
            "formatFinal() => 最終結果：425",
            "const {formatFinal}=require('./lib/format');"
            "if(formatFinal(425)!=='最終結果：425') process.exit(1);",
        ),
        (
            "getLocaleMessages() locale fallback",
            "const {getLocaleMessages}=require('./lib/messages');"
            "if(getLocaleMessages('xx').totalLabel!=='目前總計') process.exit(1);",
        ),
        (
            "t() single key fallback to defaultLocale",
            "const m=require('./lib/messages');"
            "const cfg=m.loadMessagesConfig();"
            "const saved=cfg.en.totalLabel;"
            "delete cfg.en.totalLabel;"
            "const r=m.t('en','totalLabel');"
            "cfg.en.totalLabel=saved;"
            "if(r!=='目前總計') process.exit(1);",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(name, ok, err[:80] if not ok and err else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
