"""Start the tray agent from the plugin.

The agent ships as a **self-contained binary** next to this plugin, so starting it
is just running a file. That is the whole point: the plugin lives inside KiCad's
embedded Python, which has no pystray/Pillow, and we cannot assume the user has any
*other* Python, they installed a zip from the Plugin Manager and may never have run
pip. Hunting the machine for a suitable interpreter is what this used to do, and it
failed for exactly that person.

The Python path survives only as a **development fallback**, for running out of a
source checkout before a binary has been built.

Why launching it isn't a security escalation: the plugin already runs arbitrary
Python inside KiCad with the user's full rights, anything it could do by spawning
the agent, it could do inline. What *would* be a concern is launching an arbitrary
path from config, or auto-starting behind the user's back. So this only ever runs
our own binary, resolved relative to this file, and only when the user asks.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


class LaunchError(Exception):
    """We couldn't start the agent, with a reason worth showing the user."""


def agent_root() -> Path:
    """The `tools/` dir, the parent of the prism_agent package (dev checkouts)."""
    return Path(__file__).resolve().parent.parent


def _binary_name() -> str:
    return "prism-agent.exe" if sys.platform == "win32" else "prism-agent"


def find_binary() -> Path | None:
    """The bundled agent executable, if it's here.

    Checked in the order a real install is laid out: beside the plugin (which is how
    the Plugin Manager zip ships it), then the dev build output.
    """
    here = Path(__file__).resolve().parent
    name = _binary_name()
    candidates = [
        here / name,  # shipped: sits in the plugin dir
        here / "bin" / name,  # shipped: tidier layout
        agent_root() / "dist" / name,  # dev: tools/build_agent.py output
    ]
    for path in candidates:
        if path.is_file():
            return path
    return None


def _prefer_source() -> bool:
    """Should we run the agent from source rather than the built binary?

    Yes in a dev checkout, and this matters more than it sounds. The dev profile exists
    so you can edit the agent, restart it, and see the change. But a stale
    tools/dist/prism-agent.exe left over from an earlier `build_agent.py` would be found
    first and launched instead, freezing your "dev" agent at whatever you last built.
    The symptom is baffling: you add a route, the plugin calls it, and the agent 404s
    with your new code sitting right there on disk.

    An install has no source to run, so it always uses the binary.
    """
    from .agent_client import profile

    if profile() != "dev":
        return False
    # Only if the source is actually importable from here.
    return (agent_root() / "prism_agent" / "__main__.py").is_file()


# -- development fallback --------------------------------------------------


def _candidate_pythons() -> list[str]:
    """Interpreters that might have the agent's deps. DEV ONLY.

    Never used once a binary is present. Kept because running from a checkout
    without building is the normal development loop.
    """
    names: list[str] = []
    paths: list[str] = []
    repo = agent_root().parent

    if sys.platform == "win32":
        names += ["pyw", "pythonw", "pythonw3", "py", "python", "python3"]
        paths += [
            str(repo / ".venv" / "Scripts" / "pythonw.exe"),
            str(repo / ".venv" / "Scripts" / "python.exe"),
            str(repo / "venv" / "Scripts" / "pythonw.exe"),
            str(repo / "venv" / "Scripts" / "python.exe"),
        ]
        local = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Python"
        if local.is_dir():
            paths += [
                str(d / exe)
                for d in sorted(local.iterdir(), reverse=True)
                for exe in ("pythonw.exe", "python.exe")
            ]
    else:
        names += ["python3", "python"]
        paths += [
            str(repo / ".venv" / "bin" / "python"),
            str(repo / "venv" / "bin" / "python"),
        ]

    return names + [p for p in paths if Path(p).is_file()]


def _can_run_agent(exe: str, root: Path) -> tuple[bool, str]:
    """Does this interpreter have what the agent needs? Returns (ok, why-not)."""
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


def find_python(report: list | None = None) -> str | None:
    """A Python that can run the agent from source. DEV ONLY."""
    root = agent_root()
    for exe in _candidate_pythons():
        ok, why = _can_run_agent(exe, root)
        if ok:
            return exe
        if report is not None:
            report.append((exe, why))
    return None


# -- launching -------------------------------------------------------------


def _no_window() -> dict:
    """Don't flash a console window on Windows."""
    if sys.platform == "win32":
        return {"creationflags": subprocess.CREATE_NO_WINDOW}
    return {}


def _detached() -> dict:
    """The agent must OUTLIVE KiCad, that's the whole premise. A plain child would
    be killed (or orphaned) when KiCad exits.

    CREATE_NO_WINDOW is included so the detached agent runs with no console at all.
    Without it, launching a console-subsystem python (the source path especially)
    flashes or leaves a console window on every start/restart, which is exactly the
    thing a background agent must not do. DETACHED_PROCESS alone frees it from
    KiCad's console but does not stop it opening its own."""
    if sys.platform == "win32":
        return {
            "creationflags": (
                subprocess.CREATE_NEW_PROCESS_GROUP
                | subprocess.DETACHED_PROCESS
                | subprocess.CREATE_NO_WINDOW
            )
        }
    return {"start_new_session": True}  # setsid


def _clear_quarantine(binary: Path) -> None:
    """Let macOS run our own binary.

    Gatekeeper only inspects files carrying com.apple.quarantine, and that flag is
    set by the *downloading* app, KiCad's Plugin Manager fetches and extracts the
    zip itself, so in the normal path the binary arrives without it. But a user who
    downloads the zip in a browser and extracts it with Finder would get a flagged
    file and a "cannot be opened" dialog.

    So strip the flag from our own bundled binary, which the user deliberately
    installed. Best-effort: if xattr isn't there or the flag isn't set, fine.
    """
    if sys.platform != "darwin":
        return
    try:
        subprocess.run(
            ["xattr", "-d", "com.apple.quarantine", str(binary)],
            capture_output=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        pass


def _env() -> dict:
    """The environment the agent runs in.

    Carries the profile, so an agent started by the dev plugin writes its discovery
    and settings under the dev namespace rather than fighting the installed one over
    the same files. See agent_client.profile().
    """
    from .agent_client import profile

    env = {**os.environ}
    p = profile()
    if p:
        env["PRISM_PROFILE"] = p
    return env


def _start_binary(binary: Path) -> str:
    _clear_quarantine(binary)
    try:
        subprocess.Popen(
            [str(binary)],
            cwd=str(binary.parent),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=_env(),
            **_detached(),
        )
    except OSError as exc:
        raise LaunchError("Couldn't start %s: %s" % (binary.name, exc)) from exc
    return str(binary)


def start_agent() -> str:
    """Launch the agent, detached. Returns what was started.

    An install runs the binary. A dev checkout runs from SOURCE, even when a binary
    happens to exist, otherwise a stale tools/dist build silently shadows the code you
    are editing (see _prefer_source).
    """
    binary = find_binary()

    if binary is not None and not _prefer_source():
        return _start_binary(binary)

    # From source: a dev checkout, or an install with no binary to run.
    root = agent_root()
    tried: list[tuple[str, str]] = []
    exe = find_python(report=tried)

    if not exe and binary is not None:
        # Dev, but no usable interpreter. A stale binary beats no agent at all, just
        # don't pretend it's running your latest code.
        return _start_binary(binary)

    if not exe:
        lines = [
            "The Prism agent isn't installed, and no Python here can run it from "
            "source.",
            "",
            "Normally the agent ships as a binary alongside the plugin. If you're "
            "running from a checkout, build it:",
            "    python tools/build_agent.py",
            "",
            "Or install its dependencies:",
            "    pip install -r %s" % (root / "prism_agent" / "requirements.txt"),
        ]
        if tried:
            lines += ["", "Tried:"] + [
                "    %s, %s" % (exe, why) for exe, why in tried[:6]
            ]
        raise LaunchError("\n".join(lines))

    try:
        subprocess.Popen(
            [exe, "-m", "prism_agent"],
            cwd=str(root),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env={**_env(), "PYTHONPATH": str(root)},
            **_detached(),
        )
    except OSError as exc:
        raise LaunchError("Couldn't start the agent: %s" % exc) from exc

    return exe
