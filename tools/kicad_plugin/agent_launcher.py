"""Start the tray agent from the plugin.

Why the plugin can't just *be* the agent: the agent needs pystray and Pillow, and
KiCad's embedded Python doesn't have them (and installing into it is exactly the
fragility the plugin avoids). So we launch the agent on a *system* Python instead.

Why this isn't a security hole: the plugin already runs arbitrary Python inside
KiCad with the user's full rights — anything it could do by spawning the agent, it
could do inline. What would be a concern is launching an arbitrary path from
config, or auto-starting something behind the user's back. So this only ever
launches our own module, resolved from this file's location, and only when the
user clicks the button.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


class LaunchError(Exception):
    """We couldn't start the agent, with a reason worth showing the user."""


def agent_root() -> Path:
    """The `tools/` dir — the parent of the prism_agent package."""
    return Path(__file__).resolve().parent.parent


def _candidate_pythons() -> list[str]:
    """Pythons that might have pystray, most likely first.

    Deliberately NOT sys.executable: inside KiCad that's KiCad's own interpreter,
    which lacks pystray. Launching it would fail every time.
    """
    names = []
    if sys.platform == "win32":
        # `py -3` is the launcher installed with python.org builds; it resolves a
        # real system Python even when PATH is a mess.
        names += ["py", "python", "python3"]
    else:
        names += ["python3", "python"]
    return names


def _can_run_agent(exe: str, root: Path) -> bool:
    """Does this interpreter have what the agent needs?"""
    try:
        proc = subprocess.run(
            [exe, "-c", "import pystray, PIL"],
            capture_output=True,
            timeout=20,
            cwd=str(root),
            **_no_window(),
        )
    except (OSError, subprocess.SubprocessError):
        return False
    return proc.returncode == 0


def _no_window() -> dict:
    """Don't flash a console window on Windows."""
    if sys.platform == "win32":
        return {"creationflags": subprocess.CREATE_NO_WINDOW}
    return {}


def find_python() -> str | None:
    """A system Python that can actually run the agent, or None."""
    root = agent_root()
    for exe in _candidate_pythons():
        if _can_run_agent(exe, root):
            return exe
    return None


def start_agent() -> str:
    """Launch the agent detached. Returns the interpreter used.

    Detached matters: the agent must outlive KiCad. If it were a normal child, it
    would be killed (or orphaned into a zombie) when KiCad exits — and the whole
    premise is that the agent runs whether or not KiCad is open.
    """
    root = agent_root()
    exe = find_python()
    if not exe:
        raise LaunchError(
            "Couldn't find a Python with the agent's dependencies.\n\n"
            "Install them, then try again:\n"
            "    pip install -r %s" % (root / "prism_agent" / "requirements.txt")
        )

    kwargs = {}
    if sys.platform == "win32":
        # DETACHED_PROCESS + no window: survives KiCad closing, shows no console.
        kwargs["creationflags"] = (
            subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
        )
    else:
        kwargs["start_new_session"] = True  # setsid: escape KiCad's process group

    try:
        subprocess.Popen(
            [exe, "-m", "prism_agent"],
            cwd=str(root),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env={**os.environ, "PYTHONPATH": str(root)},
            **kwargs,
        )
    except OSError as exc:
        raise LaunchError("Couldn't start the agent: %s" % exc) from exc

    return exe


def manual_command() -> str:
    """The command to start the agent by hand — shown so it can be copied."""
    return "cd %s && python -m prism_agent" % agent_root()
