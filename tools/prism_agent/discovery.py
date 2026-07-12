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
import urllib.request
from pathlib import Path

APP_NAME = "kicad-prism"
ENDPOINT_FILE = "agent.json"

# Namespace everything the agent owns — discovery file, settings, single-instance
# guard. Set PRISM_PROFILE to run a second, isolated agent.
#
# This exists for a specific and otherwise painful problem: a developer needs BOTH a
# symlinked working copy (to iterate) and a real installed package (to verify what
# users get) — but they'd share one discovery file and one settings file, so the
# single-instance guard makes the second agent refuse to start, and whichever one IS
# running silently serves both plugins. You then edit agent code, restart, and see
# nothing change, because you're still talking to the installed binary.
#
#     PRISM_PROFILE=dev python -m prism_agent
PROFILE = os.environ.get("PRISM_PROFILE", "").strip()


def config_dir() -> Path:
    """Per-user config dir, following each OS's convention."""
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or (Path.home() / "AppData" / "Roaming")
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = os.environ.get("XDG_CONFIG_HOME") or (Path.home() / ".config")
    name = f"{APP_NAME}-{PROFILE}" if PROFILE else APP_NAME
    return Path(base) / name


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
    """Called by the agent on shutdown so clients don't chase a dead port.

    Only removes the file if it still describes *us*. Otherwise a second agent
    that has since taken over would have its endpoint deleted by our exit, leaving
    it running but undiscoverable — see running_agent().
    """
    try:
        data = read_endpoint()
        if data and data.get("pid") not in (None, os.getpid()):
            return  # someone else owns it now; not ours to delete
        endpoint_path().unlink()
    except OSError:
        pass


def running_agent() -> dict | None:
    """The already-running agent, if there is one.

    A second agent would bind a different port, overwrite the discovery file, and
    leave two processes racing — with whichever exits last deleting the file and
    orphaning the other. Since the plugin offers a "Start agent" button, hitting
    that is easy, so the agent checks for a live predecessor before starting.

    A stale file (agent killed without cleanup) reads as "not running", which is
    the answer we want: it means go ahead and start.
    """
    data = read_endpoint()
    if not data:
        return None

    pid = data.get("pid")
    if pid and not _pid_alive(pid):
        return None

    # The pid may have been recycled by an unrelated process, so confirm something
    # is actually listening and answering as us.
    try:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{data['port']}/health", timeout=2
        ) as resp:
            if json.loads(resp.read()).get("ok"):
                return data
    except (OSError, ValueError):
        pass
    return None


def _pid_alive(pid: int) -> bool:
    if sys.platform == "win32":
        # No signal 0 on Windows; ask the OS whether the handle opens.
        import ctypes

        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        handle = ctypes.windll.kernel32.OpenProcess(
            PROCESS_QUERY_LIMITED_INFORMATION, False, pid
        )
        if handle:
            ctypes.windll.kernel32.CloseHandle(handle)
            return True
        return False
    try:
        os.kill(pid, 0)  # signal 0 tests existence without touching the process
    except ProcessLookupError:
        return False
    except PermissionError:
        return True  # exists, just not ours
    return True


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
