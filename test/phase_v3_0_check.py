#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 0 Checklist 驗證（V3 骨架 + 硬編碼閘門）"""

import json
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
    summarize,
)

WRITER = "phase_v3_0_check.py"
MAX_MENU_ITEMS = 7


def run_audit() -> bool:
    r = subprocess.run(
        [sys.executable, str(ROOT / "test" / "audit_hardcode.py")],
        cwd=ROOT,
    )
    passed = r.returncode == 0
    check("audit_hardcode.py RESULT [PASS]", passed, f"exit={r.returncode}")
    return passed


def main():
    reset_checks()
    print("=" * 50)
    print("Phase V3-0 Checklist 驗證")
    print("=" * 50)

    check("ROOT is whatspp_Blackcat_OS", ROOT.name == "whatspp_Blackcat_OS", str(ROOT))

    pkg = ROOT / "package.json"
    check("package.json exists", pkg.is_file())
    if pkg.is_file():
        data = json.loads(pkg.read_text(encoding="utf-8"))
        deps = data.get("dependencies", {})
        check("whatsapp-web.js in dependencies", "whatsapp-web.js" in deps)
        check("qrcode-terminal in dependencies", "qrcode-terminal" in deps)

    for rel in [
        "lib/calc.js",
        "lib/handler.js",
        "lib/parse.js",
        "lib/session.js",
        "lib/ctx-contract.js",
    ]:
        p = ROOT / rel
        check(f"{rel} exists", p.is_file())

    ctx = ROOT / "lib" / "ctx-contract.js"
    if ctx.is_file():
        text = ctx.read_text(encoding="utf-8")
        check("ctx-contract SOURCE enum", "WHATSAPP" in text and "SHORTCUTS" in text)
        check("ctx-contract ATTACHMENT_TYPE enum", "TEXT" in text and "IMAGE" in text)

    menu_path = ROOT / "config" / "menu.json"
    check("config/menu.json exists", menu_path.is_file())
    if menu_path.is_file():
        menu = json.loads(menu_path.read_text(encoding="utf-8"))
        items = menu.get("items", [])
        check(f"menu items <= {MAX_MENU_ITEMS}", len(items) <= MAX_MENU_ITEMS, str(len(items)))
        types = {i.get("type") for i in items}
        tools_path = ROOT / "config" / "tools-menu.json"
        maps_ok = "SYS_MAPS" in types
        if not maps_ok and "TOOLS_HUB" in types and tools_path.is_file():
            tool_types = {i.get("type") for i in json.loads(tools_path.read_text(encoding="utf-8")).get("items", [])}
            maps_ok = "SYS_MAPS" in tool_types
        check("menu maps reachable (SYS_MAPS or TOOLS_HUB)", maps_ok)
        check("menu has GAME_HUB", "GAME_HUB" in types)

    plugins_path = ROOT / "config" / "plugins.json"
    check("config/plugins.json exists", plugins_path.is_file())
    if plugins_path.is_file():
        plug = json.loads(plugins_path.read_text(encoding="utf-8"))
        plugins = plug.get("plugins", {})
        check("plugins.json non-empty", len(plugins) > 0)
        for key, meta in plugins.items():
            if not meta.get("enabled", True):
                continue
            ok = isinstance(meta.get("supported_sources"), list) and len(meta["supported_sources"]) > 0
            check(f"plugin {key} supported_sources", ok, str(meta.get("supported_sources")))

    plugins_dir = ROOT / "lib" / "plugins"
    check("lib/plugins/ directory exists", plugins_dir.is_dir())

    for rel in ["lib/calc.js", "lib/handler.js", "lib/parse.js", "lib/session.js", "lib/ctx-contract.js"]:
        p = ROOT / rel
        if p.is_file():
            n = count_lines(p)
            check(f"{rel} <= {MAX_LINES} lines", n <= MAX_LINES, f"{n} lines")

    check("test/verify_v3.py exists", (ROOT / "test" / "verify_v3.py").is_file())

    nm = ROOT / "node_modules"
    check("node_modules exists (npm install)", nm.is_dir())

    run_audit()

    all_ok = summarize(0)
    exit_phase(0, all_ok, WRITER)


if __name__ == "__main__":
    main()
