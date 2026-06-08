#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 0 Checklist 驗證腳本"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_LINES = 150

CHECKS = []


def check(name: str, passed: bool, detail: str = ""):
    status = "[PASS]" if passed else "[FAIL]"
    CHECKS.append((name, passed, detail))
    msg = f"{status} {name}"
    if detail:
        msg += f" | {detail}"
    print(msg)


def count_lines(path: Path) -> int:
    return len(path.read_text(encoding="utf-8").splitlines())


def main():
    print("=" * 50)
    print("Phase 0 Checklist 驗證")
    print("=" * 50)

    pkg_path = ROOT / "package.json"
    gitignore_path = ROOT / ".gitignore"

    # 1. package.json 存在且含依賴
    if not pkg_path.exists():
        check("package.json 存在", False, "檔案不存在")
    else:
        with open(pkg_path, encoding="utf-8") as f:
            pkg = json.load(f)
        deps = pkg.get("dependencies", {})
        has_wweb = "whatsapp-web.js" in deps
        has_qr = "qrcode-terminal" in deps
        check(
            "package.json 含 whatsapp-web.js",
            has_wweb,
            deps.get("whatsapp-web.js", "缺少"),
        )
        check(
            "package.json 含 qrcode-terminal",
            has_qr,
            deps.get("qrcode-terminal", "缺少"),
        )

    # 2. .gitignore 內容
    if not gitignore_path.exists():
        check(".gitignore 存在", False, "檔案不存在")
    else:
        gitignore = gitignore_path.read_text(encoding="utf-8")
        check(
            ".gitignore 含 node_modules",
            "node_modules" in gitignore,
        )
        check(
            ".gitignore 含 .wwebjs_auth",
            ".wwebjs_auth" in gitignore,
        )

    # 3. npm install 結果（node_modules 與 lock 檔）
    node_modules = ROOT / "node_modules"
    wweb_dir = node_modules / "whatsapp-web.js"
    qr_dir = node_modules / "qrcode-terminal"
    check("node_modules 存在", node_modules.is_dir())
    check("whatsapp-web.js 已安裝", wweb_dir.is_dir())
    check("qrcode-terminal 已安裝", qr_dir.is_dir())
    lock_exists = (ROOT / "package-lock.json").exists()
    check("package-lock.json 存在（npm install 已執行）", lock_exists)

    # 4. 單檔 ≤ 150 行
    for rel in ["package.json", ".gitignore"]:
        p = ROOT / rel
        if p.exists():
            lines = count_lines(p)
            check(f"{rel} <= {MAX_LINES} lines", lines <= MAX_LINES, f"{lines} lines")

    passed = sum(1 for _, ok, _ in CHECKS if ok)
    total = len(CHECKS)
    all_ok = passed == total and total > 0
    print("=" * 50)
    print(f"Phase 0: {passed}/{total} passed")
    print("Phase 0 RESULT: [PASS]" if all_ok else "Phase 0 RESULT: [FAIL]")
    print("=" * 50)

    # 寫入第三方驗證狀態（供監察，非實作者手動勾選）
    status_file = ROOT / "test" / "verification_status.json"
    data = {}
    if status_file.exists():
        data = json.loads(status_file.read_text(encoding="utf-8"))
    data["phase0"] = {
        "pass": all_ok,
        "checks": [{"name": n, "pass": p, "detail": d} for n, p, d in CHECKS],
    }
    status_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
