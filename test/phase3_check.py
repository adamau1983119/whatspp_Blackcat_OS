#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 3 第三方驗證 — 帳本計算核心"""

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

PHASE = 3


def strip_comments(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def main():
    reset_checks()
    print("=" * 50)
    print("Phase 3 Checklist (third-party Python)")
    print("=" * 50)

    calc_path = ROOT / "lib" / "calc.js"
    test_path = ROOT / "test" / "calc.test.js"

    check("lib/calc.js exists", calc_path.is_file())
    if calc_path.is_file():
        lines = count_lines(calc_path)
        check("lib/calc.js <= 150 lines", lines <= MAX_LINES, f"{lines} lines")
        content = strip_comments(calc_path.read_text(encoding="utf-8"))
        raw = calc_path.read_text(encoding="utf-8")
        check("lib/calc.js has Chinese comments", "帳本" in raw or "計算" in raw)
        check("recalculate() uses switch", "switch" in content and "function recalculate" in content)
        check("calc.js no eval()", "eval(" not in content)
        check("calc.js no Function()", "Function(" not in content)
        for fn in ["recalculate", "addEntry", "undoEntry", "modifyEntry"]:
            check(f"lib/calc.js exports {fn}", f"function {fn}" in raw)

    check("test/calc.test.js exists", test_path.is_file())
    if test_path.is_file():
        tlines = count_lines(test_path)
        check("test/calc.test.js <= 150 lines", tlines <= MAX_LINES, f"{tlines} lines")

    ok, out = run_node_script(test_path)
    check("node test/calc.test.js passes", ok, out[:120] if out else "")

    cases = [
        (
            "+500 => total 500",
            "const {addEntry}=require('./lib/calc');"
            "const r=addEntry([],{op:'+',value:500,raw:'+500'});"
            "if(r.total!==500)process.exit(1);",
        ),
        (
            "+1200 => total 1700",
            "const {addEntry}=require('./lib/calc');"
            "let e=[{op:'+',value:500,raw:'+500'}];"
            "const r=addEntry(e,{op:'+',value:1200,raw:'+1200'});"
            "if(r.total!==1700)process.exit(1);",
        ),
        (
            "modify +1200 +1300 => 1800",
            "const {modifyEntry}=require('./lib/calc');"
            "const es=[{op:'+',value:500,raw:'+500'},{op:'+',value:1200,raw:'+1200'}];"
            "const r=modifyEntry(es,'+1200',{op:'+',value:1300,raw:'+1300'});"
            "if(r.total!==1800)process.exit(1);",
        ),
        (
            "undo => total 500",
            "const {undoEntry}=require('./lib/calc');"
            "const es=[{op:'+',value:500,raw:'+500'},{op:'+',value:1300,raw:'+1300'}];"
            "const r=undoEntry(es);"
            "if(r.total!==500)process.exit(1);",
        ),
        (
            "/0 throws DIV_BY_ZERO",
            "const {recalculate,DIV_BY_ZERO}=require('./lib/calc');"
            "try{recalculate([{op:'/',value:0,raw:'/0'}]);process.exit(1);}"
            "catch(e){if(e.message!==DIV_BY_ZERO)process.exit(1);}",
        ),
    ]
    for name, code in cases:
        ok, err = run_node_eval(code)
        check(name, ok, err[:80] if not ok and err else "")

    all_ok = summarize(PHASE)
    exit_phase(PHASE, all_ok)


if __name__ == "__main__":
    main()
