#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""稽核：lib/ + lib/plugins/ 硬編碼、WhatsApp 滲透、URL 編碼、eval 禁令"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIB_DIR = ROOT / "lib"
PLUGINS_DIR = LIB_DIR / "plugins"
COMMANDS_PATH = ROOT / "config" / "commands.json"
MESSAGES_PATH = ROOT / "config" / "messages.json"

# handler + plugins 禁止 WhatsApp / 動態執行（Phase 0 契約）
FORBIDDEN_PATTERNS = [
    (re.compile(r"\bmsg\."), "WhatsApp msg API in kernel/plugins"),
    (re.compile(r"\bclient\."), "WhatsApp client API in kernel/plugins"),
    (re.compile(r"\beval\s*\("), "eval() forbidden"),
    (re.compile(r"\bFunction\s*\("), "Function() forbidden"),
]

KERNEL_GUARD_FILES = [
    LIB_DIR / "handler.js",
]


def strip_comments_js(content: str) -> str:
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    content = re.sub(r"//.*", "", content)
    return content


def collect_command_aliases(data: dict) -> list[str]:
    aliases = []
    for group in ("exact", "prefix"):
        for rule in data.get(group, []):
            if isinstance(rule, dict):
                aliases.extend(rule.get("aliases", []))
    return aliases


def collect_message_strings(data: dict) -> list[str]:
    texts = []
    for key, val in data.items():
        if key in ("defaultLocale",) or not isinstance(val, dict):
            continue
        texts.extend(v for v in val.values() if isinstance(v, str) and len(v) > 3)
    return texts


def find_quoted(content: str, text: str) -> bool:
    for quote in ("'", '"', "`"):
        if quote + text + quote in content:
            return True
    return False


def iter_js_files():
    for pattern in ("*.js",):
        for d in (LIB_DIR, PLUGINS_DIR):
            if not d.is_dir():
                continue
            for f in sorted(d.glob(pattern)):
                if f.name == "ctx-contract.js":
                    continue
                yield f


def audit_forbidden_api(js_file: Path, code: str) -> list[str]:
    hits = []
    rel = str(js_file.relative_to(ROOT)).replace("\\", "/")
    guard = rel in {str(p.relative_to(ROOT)).replace("\\", "/") for p in KERNEL_GUARD_FILES}
    in_plugins = "lib/plugins/" in rel.replace("\\", "/")
    if not guard and not in_plugins:
        return hits
    for pat, msg in FORBIDDEN_PATTERNS:
        if pat.search(code):
            hits.append(msg)
    return hits


def audit_url_encoding(js_file: Path, code: str) -> list[str]:
    """插件拼接 http URL 且含變數時，同檔須有 encodeURIComponent"""
    rel = str(js_file.relative_to(ROOT)).replace("\\", "/")
    if "lib/plugins/" not in rel.replace("\\", "/"):
        return []
    if "http" not in code:
        return []
    has_var_url = bool(re.search(r"http[`'\"].*\+|`.*http.*\$\{|['\"].*http.*['\"]\s*\+", code))
    if has_var_url and "encodeURIComponent" not in code:
        return ["dynamic http URL without encodeURIComponent"]
    return []


def main():
    print("=" * 50)
    print("Hardcode Audit — lib/ + lib/plugins/ vs config/")
    print("=" * 50)

    cmd_data = json.loads(COMMANDS_PATH.read_text(encoding="utf-8"))
    msg_data = json.loads(MESSAGES_PATH.read_text(encoding="utf-8"))
    aliases = collect_command_aliases(cmd_data)
    msg_strings = collect_message_strings(msg_data)

    print(f"Command aliases ({len(aliases)}): configurable in commands.json")
    print(f"Message strings ({len(msg_strings)}): configurable in messages.json\n")

    all_ok = True
    scanned = list(iter_js_files())
    if not scanned:
        print("[WARN] no lib/*.js to scan (except ctx-contract)")

    for js_file in scanned:
        code = strip_comments_js(js_file.read_text(encoding="utf-8"))
        hits = []
        for alias in aliases:
            if find_quoted(code, alias):
                hits.append(f"alias:{alias}")
        for text in msg_strings:
            if find_quoted(code, text):
                hits.append(f"msg:{text[:20]}...")
        hits.extend(audit_forbidden_api(js_file, code))
        hits.extend(audit_url_encoding(js_file, code))
        if hits:
            all_ok = False
            print(f"[FAIL] {js_file.relative_to(ROOT)}")
            for h in hits:
                print(f"       {h}")
        else:
            print(f"[PASS] {js_file.relative_to(ROOT)}")

    print("=" * 50)
    print("RESULT: [PASS]" if all_ok else "RESULT: [FAIL]")
    print("=" * 50)
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
