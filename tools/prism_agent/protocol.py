"""`prism://` deep links.

Two separable halves:

  * **Dispatch**, parsing a prism:// URL and acting on it. Portable, pure Python.
  * **Registration**, telling the OS that *we* handle the scheme. NOT portable:
    every platform does it differently, and one of them can't do it at all from a
    plain script.

Registration, per platform. All three are per-user, and all three work:

  Windows   a registry key under HKCU\\Software\\Classes\\prism. No admin needed.
  Linux     a .desktop file declaring MimeType=x-scheme-handler/prism, then
            update-desktop-database.
  macOS     an .app bundle in ~/Applications whose Info.plist declares
            CFBundleURLTypes. LaunchServices genuinely will not read the scheme from
            anywhere else, so a bare `python -m prism_agent` cannot claim it.

            But an .app is just a DIRECTORY with a plist and an executable. Nothing
            about it is privileged: no Apple account, no signing, no notarisation.
            So we build one at opt-in time, containing a shell script that hands the
            URL back to the agent. No .app needs to be shipped.

Nothing here runs unless the user opts in (settings.protocol_handler). Claiming a
URL scheme behind someone's back is exactly the sort of thing people resent.

The URL grammar:

    prism://open/<project_id>            open a project in the web app
    prism://auth/callback?code=...       OIDC redirect lands back here
"""

from __future__ import annotations

import logging
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import parse_qs, urlparse

SCHEME = "prism"

log = logging.getLogger(__name__)


class RegistrationError(Exception):
    """Couldn't register (or unregister) the scheme, with a reason to show."""


@dataclass
class Link:
    """A parsed prism:// URL."""

    action: str  # "open" | "auth" | ...
    path: str  # whatever followed the action
    params: dict  # query string, flattened

    @property
    def project_id(self) -> str:
        return self.path.strip("/")


def parse(url: str) -> Link | None:
    """Parse a prism:// URL. None if it isn't one."""
    try:
        u = urlparse(url)
    except ValueError:
        return None
    if u.scheme != SCHEME:
        return None
    # In prism://open/xyz the host is "open" and the path is "/xyz".
    params = {k: v[0] if len(v) == 1 else v for k, v in parse_qs(u.query).items()}
    return Link(action=(u.netloc or "").lower(), path=u.path or "", params=params)


# -- registration ---------------------------------------------------------


def _launch_command() -> list[str]:
    """How the OS should invoke us to handle a link.

    Frozen, this is just the binary, the simple, robust case, and the reason we
    ship one.

    From a source checkout it's messier: the browser launches us from *its* working
    directory, not ours, so `-m prism_agent` alone can't import. Bootstrap sys.path
    explicitly rather than relying on cwd or PYTHONPATH, neither of which we
    control at the moment the OS invokes us.
    """
    if getattr(sys, "frozen", False):
        return [sys.executable, "--open-url"]

    root = Path(__file__).resolve().parent.parent  # tools/
    bootstrap = (
        f"import sys; sys.path.insert(0, r'{root}'); "
        "from prism_agent.__main__ import main; sys.exit(main())"
    )
    return [sys.executable, "-c", bootstrap, "--open-url"]


def is_registered() -> bool:
    """Does this machine currently route prism:// to us?"""
    if sys.platform == "win32":
        import winreg

        try:
            with winreg.OpenKey(
                winreg.HKEY_CURRENT_USER, rf"Software\Classes\{SCHEME}"
            ):
                return True
        except OSError:
            return False
    if sys.platform == "darwin":
        return _mac_app_bundle().is_dir()
    return _linux_desktop_file().is_file()


def register() -> None:
    """Claim prism:// for this user. Called only on explicit opt-in."""
    if sys.platform == "win32":
        _register_windows()
    elif sys.platform == "darwin":
        _register_macos()
    else:
        _register_linux()


def unregister() -> None:
    if sys.platform == "win32":
        _unregister_windows()
    elif sys.platform == "darwin":
        _unregister_macos()
    else:
        _unregister_linux()


# -- Windows --------------------------------------------------------------


def _register_windows() -> None:
    import winreg

    cmd = _launch_command()
    # "%1" is the URL the browser hands us. Quote the exe and the placeholder;
    # paths contain spaces (C:\Program Files\...) and an unquoted %1 would split.
    command = " ".join(f'"{part}"' for part in cmd) + ' "%1"'

    try:
        # HKCU, not HKLM: per-user, so no admin prompt, and it can't affect anyone
        # else on the machine.
        with winreg.CreateKey(
            winreg.HKEY_CURRENT_USER, rf"Software\Classes\{SCHEME}"
        ) as key:
            winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "URL:Prism Protocol")
            # This exact value name is what tells Windows the key is a URL scheme.
            winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")
        with winreg.CreateKey(
            winreg.HKEY_CURRENT_USER, rf"Software\Classes\{SCHEME}\shell\open\command"
        ) as key:
            winreg.SetValueEx(key, "", 0, winreg.REG_SZ, command)
    except OSError as exc:
        raise RegistrationError("Couldn't write the registry key: %s" % exc) from exc


def _unregister_windows() -> None:
    import winreg

    for sub in (
        rf"Software\Classes\{SCHEME}\shell\open\command",
        rf"Software\Classes\{SCHEME}\shell\open",
        rf"Software\Classes\{SCHEME}\shell",
        rf"Software\Classes\{SCHEME}",
    ):
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, sub)
        except OSError:
            pass  # already gone, or never there


# -- macOS ----------------------------------------------------------------
#
# LaunchServices only reads CFBundleURLTypes from an app bundle's Info.plist, so a bare
# `python -m prism_agent` genuinely cannot claim a scheme. That is a real OS rule.
#
# But an .app is just a DIRECTORY with a plist and an executable in it. Nothing about it
# is privileged: no Apple account, no signing, no notarisation, no App Store. So we build
# one, in the user's own ~/Applications, at the moment they opt in. It is a shim: a shell
# script that hands the URL back to the agent.
#
# (This is separate from Gatekeeper. Gatekeeper only inspects files carrying
# com.apple.quarantine, which is set by the app that DOWNLOADS a file. Nothing here is
# downloaded, we write it locally, so the flag is never set and never checked.)


def _mac_app_bundle() -> Path:
    return Path.home() / "Applications" / "KiCad-Prism Agent.app"


def _register_macos() -> None:
    bundle = _mac_app_bundle()
    macos_dir = bundle / "Contents" / "MacOS"
    launcher = macos_dir / "prism-url-handler"

    # The shim. LaunchServices passes the URL as an argument, and we hand it straight
    # to the agent, whatever the agent happens to be (a frozen binary or a checkout).
    command = " ".join('"%s"' % part for part in _launch_command())

    try:
        macos_dir.mkdir(parents=True, exist_ok=True)
        launcher.write_text(
            '#!/bin/sh\nexec %s "$@"\n' % command,
            encoding="utf-8",
        )
        launcher.chmod(0o755)

        (bundle / "Contents" / "Info.plist").write_text(
            _MAC_INFO_PLIST.format(scheme=SCHEME, executable=launcher.name),
            encoding="utf-8",
        )
    except OSError as exc:
        raise RegistrationError("Couldn't write %s: %s" % (bundle, exc)) from exc

    # Tell LaunchServices the bundle exists. Without this it may not notice until the
    # next login, which would make the opt-in look like it silently failed.
    for tool in (
        "/System/Library/Frameworks/CoreServices.framework/Frameworks"
        "/LaunchServices.framework/Support/lsregister",
    ):
        try:
            subprocess.run(
                [tool, "-f", str(bundle)], capture_output=True, timeout=20, check=False
            )
        except (OSError, subprocess.SubprocessError):
            log.debug("lsregister unavailable while registering the scheme")


def _unregister_macos() -> None:
    import shutil

    try:
        shutil.rmtree(_mac_app_bundle())
    except OSError:
        pass


_MAC_INFO_PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>              <string>KiCad-Prism Agent</string>
  <key>CFBundleIdentifier</key>        <string>com.kicad-prism.agent</string>
  <key>CFBundleVersion</key>           <string>1.0</string>
  <key>CFBundlePackageType</key>       <string>APPL</string>
  <key>CFBundleExecutable</key>        <string>{executable}</string>
  <!-- A handler, not something to show in the Dock. -->
  <key>LSBackgroundOnly</key>          <true/>
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLName</key>       <string>Prism</string>
      <key>CFBundleURLSchemes</key>
      <array><string>{scheme}</string></array>
    </dict>
  </array>
</dict>
</plist>
"""


# -- Linux ----------------------------------------------------------------


def _linux_desktop_file() -> Path:
    base = os.environ.get("XDG_DATA_HOME") or os.path.expanduser("~/.local/share")
    return Path(base) / "applications" / "kicad-prism-agent.desktop"


def _register_linux() -> None:
    cmd = " ".join(_launch_command())
    desktop = _linux_desktop_file()
    try:
        desktop.parent.mkdir(parents=True, exist_ok=True)
        desktop.write_text(
            "[Desktop Entry]\n"
            "Type=Application\n"
            "Name=KiCad-Prism Agent\n"
            f"Exec={cmd} %u\n"  # %u = the URL
            "NoDisplay=true\n"  # a handler, not something to show in a menu
            f"MimeType=x-scheme-handler/{SCHEME};\n",
            encoding="utf-8",
        )
    except OSError as exc:
        raise RegistrationError("Couldn't write %s: %s" % (desktop, exc)) from exc

    # Without this the desktop environment won't notice the new handler.
    for tool, args in (
        ("update-desktop-database", [str(desktop.parent)]),
        ("xdg-mime", ["default", desktop.name, f"x-scheme-handler/{SCHEME}"]),
    ):
        try:
            subprocess.run([tool, *args], capture_output=True, timeout=15, check=False)
        except (OSError, subprocess.SubprocessError):
            # Not fatal: the .desktop file is written, and many environments pick
            # it up anyway. Don't fail the opt-in over a missing helper.
            log.debug("%s unavailable while registering the scheme", tool)


def _unregister_linux() -> None:
    try:
        _linux_desktop_file().unlink()
    except OSError:
        pass
