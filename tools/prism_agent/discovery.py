"""How the KiCad plugin finds the running tray agent.

The agent binds an ephemeral port on 127.0.0.1 and writes {port, token, pid} to a
well-known file in the user's config dir. The plugin reads that file to know where
to connect and how to authenticate.

Why a token at all, on loopback: any local process (including a web page's
JavaScript, via a stray fetch to 127.0.0.1) can reach a loopback port. The agent
can run git and touch the filesystem, so it must not be drivable by anything that
merely guesses the port. The token is a shared secret readable only by the user
who owns the file.

This module is deliberately stdlib-only and importable from BOTH sides — the
plugin runs inside KiCad's embedded Python, where installing packages is painful.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

APP_NAME = "kicad-prism"
ENDPOINT_FILE = "agent.json"


def config_dir() -> Path:
    """Per-user config dir, following each OS's convention."""
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or (Path.home() / "AppData" / "Roaming")
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = os.environ.get("XDG_CONFIG_HOME") or (Path.home() / ".config")
    return Path(base) / APP_NAME


def endpoint_path() -> Path:
    return config_dir() / ENDPOINT_FILE


def write_endpoint(port: int, token: str) -> Path:
    """Publish where we're listening. Called by the agent on startup."""
    path = endpoint_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"port": port, "token": token, "pid": os.getpid()}
    # Write-then-replace so a reader never sees a half-written file.
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload), encoding="utf-8")
    tmp.replace(path)
    _restrict_permissions(path)
    return path


def read_endpoint() -> dict | None:
    """Where is the agent? None if it isn't running / hasn't published."""
    path = endpoint_path()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if not isinstance(data, dict) or "port" not in data or "token" not in data:
        return None
    return data


def clear_endpoint() -> None:
    """Called by the agent on shutdown so clients don't chase a dead port."""
    try:
        endpoint_path().unlink()
    except OSError:
        pass


def _restrict_permissions(path: Path) -> None:
    """Best-effort: keep the token out of other users' reach.

    On POSIX this is chmod 600. On Windows the file already lands in the user's
    roaming profile, which other non-admin users cannot read, and setting an ACL
    would need pywin32 — not worth a dependency for the same outcome.
    """
    if sys.platform != "win32":
        try:
            path.chmod(0o600)
        except OSError:
            pass
