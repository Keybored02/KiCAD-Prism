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
    """Pythons that might have the agent's dependencies, most likely first.

    Deliberately NOT sys.executable: inside KiCad that's KiCad's own interpreter,
    which has no pystray. Launching it would fail every time.

    Searching PATH alone isn't enough. KiCad runs the plugin with *KiCad's*
    environment, not a developer shell's, and a GUI app started from the Start menu
    can have a PATH with no Python on it at all — at which point every name here
    fails and the user gets "couldn't find a Python", while a perfectly good
    interpreter sits at a well-known location. So look in real places too.
    """
    names: list[str] = []
    paths: list[str] = []

    if sys.platform == "win32":
        # The py launcher lives in System32, so it resolves even when PATH is bare.
        names += ["py", "python", "python3"]

        # A venv in the repo is the likeliest place the deps were installed —
        # it's what `pip install -r requirements.txt` hits in a dev checkout.
        repo = agent_root().parent
        paths += [
            str(repo / ".venv" / "Scripts" / "python.exe"),
            str(repo / "venv" / "Scripts" / "python.exe"),
        ]
        # Standard per-user and system installs, newest first.
        local = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Python"
        if local.is_dir():
            for d in sorted(local.iterdir(), reverse=True):
                paths.append(str(d / "python.exe"))
        for base in (r"C:\Program Files", r"C:\Program Files (x86)"):
            root = Path(base)
            if root.is_dir():
                paths += [
                    str(p / "python.exe")
                    for p in sorted(root.glob("Python*"), reverse=True)
                ]
    else:
        names += ["python3", "python"]
        repo = agent_root().parent
        paths += [
            str(repo / ".venv" / "bin" / "python"),
            str(repo / "venv" / "bin" / "python"),
            "/usr/bin/python3",
            "/usr/local/bin/python3",
            "/opt/homebrew/bin/python3",
        ]

    # Names first (respects whatever the user has configured), then real paths.
    return names + [p for p in paths if Path(p).is_file()]


def _can_run_agent(exe: str, root: Path) -> tuple[bool, str]:
    """Does this interpreter have what the agent needs? Returns (ok, why-not).

    The reason matters: without it the dialog can only say "couldn't find a
    Python", which tells the user nothing about whether Python is missing, the
    dependencies aren't installed, or the interpreter won't even start.
    """
    try:
        proc = subprocess.run(
            [exe, "-c", "import pystray, PIL"],
            capture_output=True,
            text=True,
            timeout=20,
            cwd=str(root),
            **_no_window(),
        )
    except FileNotFoundError:
        return False, "not found"
    except (OSError, subprocess.SubprocessError) as exc:
        return False, type(exc).__name__

    if proc.returncode == 0:
        return True, ""

    err = (proc.stderr or "").strip().splitlines()
    last = err[-1] if err else "exit %d" % proc.returncode
    if "No module named" in last:
        return False, last.split("ModuleNotFoundError: ")[-1]
    return False, last[:80]


def _no_window() -> dict:
    """Don't flash a console window on Windows."""
    if sys.platform == "win32":
        return {"creationflags": subprocess.CREATE_NO_WINDOW}
    return {}


def find_python(report: list | None = None) -> str | None:
    """A Python that can actually run the agent, or None.

    Pass `report` to collect (exe, reason) for everything that didn't work, so a
    failure can say *why* rather than just "couldn't find one".
    """
    root = agent_root()
    for exe in _candidate_pythons():
        ok, why = _can_run_agent(exe, root)
        if ok:
            return exe
        if report is not None:
            report.append((exe, why))
    return None


def start_agent() -> str:
    """Launch the agent detached. Returns the interpreter used.

    Detached matters: the agent must outlive KiCad. If it were a normal child, it
    would be killed (or orphaned into a zombie) when KiCad exits — and the whole
    premise is that the agent runs whether or not KiCad is open.
    """
    root = agent_root()
    tried: list[tuple[str, str]] = []
    exe = find_python(report=tried)
    if not exe:
        # Say what was tried and why each one failed. "Couldn't find a Python" on
        # its own is useless: it doesn't distinguish "no Python here" from "Python
        # is fine, the dependencies aren't installed" — which need different fixes.
        lines = [
            "Couldn't find a Python with the agent's dependencies (pystray, Pillow).",
            "",
            "Install them into a Python, then try again:",
            "    pip install -r %s" % (root / "prism_agent" / "requirements.txt"),
        ]
        if tried:
            lines += ["", "Tried:"]
            lines += ["    %s — %s" % (exe, why) for exe, why in tried[:8]]
        raise LaunchError("\n".join(lines))

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
