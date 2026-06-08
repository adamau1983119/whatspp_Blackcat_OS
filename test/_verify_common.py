# -*- coding: utf-8 -*-
"""V3 第三方驗證共用工具（防偽寫入 + Node 執行）"""

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_LINES = 150
NODE_CANDIDATES = [
    Path(r"C:\Program Files\nodejs\node.exe"),
    Path("/usr/bin/node"),
    Path("/usr/local/bin/node"),
]

CHECKS = []


def reset_checks():
    CHECKS.clear()


def check(name: str, passed: bool, detail: str = ""):
    status = "[PASS]" if passed else "[FAIL]"
    CHECKS.append({"name": name, "pass": passed, "detail": detail})
    line = f"{status} {name}"
    if detail:
        line += f" | {detail}"
    print(line)
    return passed


def count_lines(path: Path) -> int:
    return len(path.read_text(encoding="utf-8").splitlines())


def find_node() -> Path | None:
    for p in NODE_CANDIDATES:
        if p.exists():
            return p
    return None


def run_node_script(script: Path) -> tuple[bool, str]:
    node = find_node()
    if not node:
        return False, "node.exe not found"
    result = subprocess.run(
        [str(node), str(script)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    output = (result.stdout or "") + (result.stderr or "")
    return result.returncode == 0, output.strip()


def run_node_eval(code: str) -> tuple[bool, str]:
    node = find_node()
    if not node:
        return False, "node.exe not found"
    result = subprocess.run(
        [str(node), "-e", code],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    output = (result.stdout or "").strip()
    if result.returncode != 0:
        return False, (result.stderr or output or "eval failed").strip()
    return True, output


def git_commit_short() -> str | None:
    try:
        r = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if r.returncode == 0:
            return r.stdout.strip() or None
    except OSError:
        pass
    return None


def summarize(phase: int) -> bool:
    passed = sum(1 for c in CHECKS if c["pass"])
    total = len(CHECKS)
    all_ok = passed == total and total > 0
    print("=" * 50)
    print(f"Phase {phase}: {passed}/{total} passed")
    print(f"Phase {phase} RESULT: {'[PASS]' if all_ok else '[FAIL]'}")
    print("=" * 50)
    return all_ok


def write_status(phase: int, all_ok: bool, writer: str):
    status_file = ROOT / "test" / "verification_status.json"
    data = {}
    if status_file.exists():
        data = json.loads(status_file.read_text(encoding="utf-8"))
    data[f"phase{phase}"] = {
        "pass": all_ok,
        "writtenAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "gitCommit": git_commit_short(),
        "writer": writer,
        "checks": CHECKS.copy(),
    }
    status_file.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def exit_phase(phase: int, all_ok: bool, writer: str | None = None):
    """writer 可選：v1 移植的 phaseN_check.py 僅傳兩參數"""
    write_status(phase, all_ok, writer or f"phase{phase}_check.py")
    sys.exit(0 if all_ok else 1)
