"""Run the agent at login.

The agent's whole premise is that it works whether or not KiCad is open — but
without this it only exists once you've opened KiCad at least once since logging
in, because the plugin is what starts it.

Like the prism:// scheme, this is three separate mechanisms wearing one interface,
and it is never enabled unless the user asks:

  Windows   a value under HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.
            Per-user, no admin, and trivially undone.
  macOS     a LaunchAgent plist in ~/Library/LaunchAgents. launchd starts it at
            login and (with KeepAlive) restarts it if it dies.
  Linux     an XDG autostart .desktop in ~/.config/autostart. Honoured by GNOME,
            KDE, XFCE — i.e. the desktops that have a tray in the first place.

Only Windows is verified by the author; the other two are written to spec and want
a real test on their platform.
"""

from __future__ import annotations

import logging
import os
import plistlib
import subprocess
import sys
from pathlib import Path

APP_ID = "com.kicad-prism.agent"
APP_NAME = "KiCad-Prism Agent"
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
RUN_VALUE = "KiCadPrismAgent"

log = logging.getLogger(__name__)


class AutostartError(Exception):
    """Couldn't change the autostart setting, with a reason worth showing."""


def _agent_command() -> list[str]:
    """How the OS should launch the agent at login.

    Frozen, that's just the binary. From a checkout it needs the interpreter and
    the module — and an absolute cwd, since login has no useful working directory.
    """
    if getattr(sys, "frozen", False):
        return [sys.executable]
    root = Path(__file__).resolve().parent.parent  # tools/
    bootstrap = (
        f"import sys; sys.path.insert(0, r'{root}'); "
        "from prism_agent.__main__ import main; sys.exit(main())"
    )
    return [sys.executable, "-c", bootstrap]


# -- Windows --------------------------------------------------------------


def _win_is_enabled() -> bool:
    import winreg

    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as key:
            winreg.QueryValueEx(key, RUN_VALUE)
            return True
    except OSError:
        return False


def _win_enable() -> None:
    import winreg

    # Quote each part: paths contain spaces (C:\Program Files\...), and an unquoted
    # command would be split at the first one.
    command = " ".join(f'"{p}"' for p in _agent_command())
    try:
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as key:
            winreg.SetValueEx(key, RUN_VALUE, 0, winreg.REG_SZ, command)
    except OSError as exc:
        raise AutostartError(f"Couldn't write the registry key: {exc}") from exc


def _win_disable() -> None:
    import winreg

    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE
        ) as key:
            winreg.DeleteValue(key, RUN_VALUE)
    except OSError:
        pass  # already gone


# -- macOS ----------------------------------------------------------------


def _mac_plist_path() -> Path:
    return Path.home() / "Library" / "LaunchAgents" / f"{APP_ID}.plist"


def _mac_is_enabled() -> bool:
    return _mac_plist_path().is_file()


def _mac_enable() -> None:
    plist = {
        "Label": APP_ID,
        "ProgramArguments": _agent_command(),
        "RunAtLoad": True,
        # Bring it back if it crashes, but don't fight a deliberate quit: the
        # agent exits 0 on /quit, and SuccessfulExit=False means "only restart on
        # a *failure*". Without this, quitting from the tray would just respawn it.
        "KeepAlive": {"SuccessfulExit": False},
        "ProcessType": "Interactive",
    }
    path = _mac_plist_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as fh:
            plistlib.dump(plist, fh)
    except OSError as exc:
        raise AutostartError(f"Couldn't write {path}: {exc}") from exc

    # Load it now so it doesn't only take effect at the next login.
    _run(["launchctl", "load", "-w", str(path)])


def _mac_disable() -> None:
    path = _mac_plist_path()
    if path.is_file():
        _run(["launchctl", "unload", "-w", str(path)])
        try:
            path.unlink()
        except OSError:
            pass


# -- Linux ----------------------------------------------------------------


def _linux_desktop_path() -> Path:
    base = os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config")
    return Path(base) / "autostart" / "kicad-prism-agent.desktop"


def _linux_is_enabled() -> bool:
    return _linux_desktop_path().is_file()


def _linux_enable() -> None:
    path = _linux_desktop_path()
    command = " ".join(_agent_command())
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            "[Desktop Entry]\n"
            "Type=Application\n"
            f"Name={APP_NAME}\n"
            f"Exec={command}\n"
            "Terminal=false\n"
            "NoDisplay=true\n"
            "X-GNOME-Autostart-enabled=true\n",
            encoding="utf-8",
        )
    except OSError as exc:
        raise AutostartError(f"Couldn't write {path}: {exc}") from exc


def _linux_disable() -> None:
    try:
        _linux_desktop_path().unlink()
    except OSError:
        pass


# -- interface ------------------------------------------------------------


def _run(cmd: list[str]) -> None:
    """Best-effort helper: a missing launchctl shouldn't fail the whole toggle."""
    try:
        subprocess.run(cmd, capture_output=True, timeout=20, check=False)
    except (OSError, subprocess.SubprocessError):
        log.debug("autostart helper failed: %s", cmd)


def is_enabled() -> bool:
    if sys.platform == "win32":
        return _win_is_enabled()
    if sys.platform == "darwin":
        return _mac_is_enabled()
    return _linux_is_enabled()


def enable() -> None:
    if sys.platform == "win32":
        _win_enable()
    elif sys.platform == "darwin":
        _mac_enable()
    else:
        _linux_enable()


def disable() -> None:
    if sys.platform == "win32":
        _win_disable()
    elif sys.platform == "darwin":
        _mac_disable()
    else:
        _linux_disable()


def set_enabled(want: bool) -> None:
    if want == is_enabled():
        return
    enable() if want else disable()
