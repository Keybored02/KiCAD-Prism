"""Find the KiCad installations on this machine, so the user can pick one.

The agent opens a project by handing its ``.kicad_pro`` to the OS, which then
picks whatever it has associated with the extension. On a machine with 8.0, 9.0
and 10.0 side by side that is a coin toss, and a link that opens the wrong KiCad
is exactly the confusion this module exists to remove: it lists the versions it
can find so the tray can offer a definite choice, and ``launch_kicad`` runs the
chosen executable directly instead of deferring to the association.

Discovery is best-effort and platform-specific. What it does NOT do is guess: an
executable that is not where these well-known locations say it should be is simply
not listed, and the user keeps the OS default (or points the setting at it by
hand). A wrong path that launches nothing would be worse than an honest gap.
"""

from __future__ import annotations

import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class KiCadInstall:
    """One KiCad the user could open projects with."""

    version: str  # "9.0", "8.0", or "" when the version can't be read
    path: str  # the executable to run

    @property
    def label(self) -> str:
        """What the tray shows. The version if we have it, else the path's stem."""
        if self.version:
            return f"KiCad {self.version}"
        return Path(self.path).stem or self.path


def _version_key(version: str) -> tuple:
    """Numeric sort key, so 10.0 beats 9.0 (a string sort gets that backwards)."""
    return tuple(int(p) if p.isdigit() else 0 for p in version.split("."))


def discover() -> list[KiCadInstall]:
    """Every KiCad we can find, newest first, de-duplicated by executable path."""
    if sys.platform == "win32":
        found = _discover_windows()
    elif sys.platform == "darwin":
        found = _discover_macos()
    else:
        found = _discover_linux()

    seen: set[str] = set()
    unique: list[KiCadInstall] = []
    for install in found:
        key = os.path.normcase(os.path.normpath(install.path))
        if key in seen:
            continue
        seen.add(key)
        unique.append(install)

    unique.sort(key=lambda i: _version_key(i.version), reverse=True)
    return unique


# -- Windows --------------------------------------------------------------


def _discover_windows() -> list[KiCadInstall]:
    """KiCad installs from the standard ``Program Files\\KiCad\\<ver>\\bin`` layout.

    KiCad's Windows installer lays each major version out under its own version
    folder, so the version is right there in the path, no registry needed.
    """
    installs: list[KiCadInstall] = []
    bases = [
        os.environ.get("ProgramFiles", r"C:\Program Files"),
        os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
    ]
    for base in bases:
        kicad_root = Path(base) / "KiCad"
        if not kicad_root.is_dir():
            continue
        for version_dir in kicad_root.iterdir():
            exe = version_dir / "bin" / "kicad.exe"
            if exe.is_file():
                installs.append(
                    KiCadInstall(version=version_dir.name, path=str(exe))
                )
    return installs


# -- macOS ----------------------------------------------------------------


def _discover_macos() -> list[KiCadInstall]:
    """KiCad ``.app`` bundles in the usual Applications folders.

    A versioned bundle (``KiCad 9.0.app``) carries its version in the name; the
    unversioned ``KiCad.app`` does not, so its version is read from the bundle's
    Info.plist when possible and left blank otherwise.
    """
    installs: list[KiCadInstall] = []
    roots = [Path("/Applications"), Path.home() / "Applications"]
    for root in roots:
        if not root.is_dir():
            continue
        for app in root.glob("KiCad*.app"):
            exe = app / "Contents" / "MacOS" / "kicad"
            if not exe.is_file():
                continue
            version = _mac_version(app)
            installs.append(KiCadInstall(version=version, path=str(app)))
    return installs


def _mac_version(app: Path) -> str:
    """Read a version from the app name, then the Info.plist. "" if neither says."""
    # "KiCad 9.0.app" -> "9.0"
    stem = app.stem  # drops .app
    tail = stem.replace("KiCad", "").strip()
    if tail and tail[0].isdigit():
        return tail

    plist = app / "Contents" / "Info.plist"
    try:
        import plistlib

        with plist.open("rb") as handle:
            data = plistlib.load(handle)
        raw = str(data.get("CFBundleShortVersionString", "")).strip()
        # Keep just major.minor, matching how the rest of the agent talks versions.
        parts = raw.split(".")
        return ".".join(parts[:2]) if parts and parts[0].isdigit() else ""
    except Exception:
        return ""


# -- Linux ----------------------------------------------------------------


def _discover_linux() -> list[KiCadInstall]:
    """`kicad` on PATH, plus a Flatpak install if one is present.

    Linux has no single install layout, so this leans on PATH (what a native
    package or an AppImage on PATH provides) and Flatpak's well-known app id. The
    version comes from ``kicad --version`` when it answers.
    """
    installs: list[KiCadInstall] = []

    from shutil import which

    on_path = which("kicad")
    if on_path:
        installs.append(KiCadInstall(version=_cli_version([on_path]), path=on_path))

    flatpak = which("flatpak")
    if flatpak and _flatpak_has_kicad(flatpak):
        # Stored as a runnable command line; launch_kicad understands the flatpak form.
        installs.append(
            KiCadInstall(
                version=_cli_version([flatpak, "run", "org.kicad.KiCad"]),
                path="flatpak run org.kicad.KiCad",
            )
        )
    return installs


def _flatpak_has_kicad(flatpak: str) -> bool:
    try:
        result = subprocess.run(
            [flatpak, "info", "org.kicad.KiCad"],
            capture_output=True,
            timeout=10,
            check=False,
        )
        return result.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def _cli_version(command: list[str]) -> str:
    """Best-effort ``<kicad> --version`` -> "9.0". "" if it does not answer cleanly."""
    try:
        result = subprocess.run(
            [*command, "--version"],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    text = (result.stdout or result.stderr or "").strip()
    # KiCad prints something like "9.0.1" or "KiCad 9.0.1"; take the first x.y.
    for token in text.replace("KiCad", "").split():
        parts = token.split(".")
        if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
            return f"{parts[0]}.{parts[1]}"
    return ""
