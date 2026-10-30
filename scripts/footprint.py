"""Derive the installed-file footprint model from a pinned AI-KIT checkout.

Runs read-only installer previews against an empty temporary folder and writes
src/data/footprint.json. The site combines base, per-agent and per-extra sets;
tests/upstream.test.ts verifies that model against real installer previews.

Usage: python -I scripts/footprint.py tmp/upstream-ai-kit > src/data/footprint.json
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

AGENTS = ["aider", "claude", "cline", "codex", "copilot", "cursor", "gemini", "kimi", "manus", "roo", "windsurf"]
EXTRAS = ["session-start", "guards", "data-guards", "native-settings", "scoped-rules", "ci",
          "security-audit", "strix", "context7", "web-design", "orchestration"]
MODES = ["private", "team"]


def preview(installer: Path, target: Path, args: list[str]) -> set[str]:
    result = subprocess.run([sys.executable, "-I", str(installer), str(target), *args],
                            capture_output=True, text=True, check=False)
    if result.returncode not in (0, 2):
        raise SystemExit(f"Installer failed for {args}: {result.stderr}")
    return set(json.loads(result.stdout)["writes"])


def main() -> int:
    upstream = Path(sys.argv[1]).resolve()
    installer = upstream / "scripts" / "install.py"
    version = (upstream / "VERSION").read_text(encoding="utf-8").strip()
    model: dict = {"version": version, "modes": {}}
    with tempfile.TemporaryDirectory() as work:
        target = Path(work) / "app"
        for mode in MODES:
            single = {agent: preview(installer, target, ["--mode", mode, "--agent", agent]) for agent in AGENTS}
            base = set.intersection(*single.values())
            extras = {}
            for extra in EXTRAS:
                added = {agent: preview(installer, target, ["--mode", mode, "--agent", agent, f"--with-{extra}"])
                         - single[agent] for agent in AGENTS}
                common = set.intersection(*added.values())
                extras[extra] = {"common": sorted(common),
                                 "byAgent": {agent: sorted(files - common)
                                             for agent, files in added.items() if files - common}}
            model["modes"][mode] = {"base": sorted(base),
                                    "agents": {agent: sorted(files - base) for agent, files in single.items()},
                                    "extras": extras}
    json.dump(model, sys.stdout, indent=1, sort_keys=True)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
