"""Discovering installed KiCad versions, so the tray can offer a definite choice.

The filesystem scan itself is platform-specific and hard to pin in a unit test,
so what is tested here is the logic that does not depend on a real install: the
version sort, de-duplication, the label, and how a chosen command is launched.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import kicad_versions, open_project  # noqa: E402
from prism_agent.kicad_versions import KiCadInstall  # noqa: E402


def test_installs_sort_newest_first(monkeypatch):
    monkeypatch.setattr(
        kicad_versions,
        "_discover_windows",
        lambda: [
            KiCadInstall("8.0", r"C:\KiCad\8.0\kicad.exe"),
            KiCadInstall("10.0", r"C:\KiCad\10.0\kicad.exe"),
            KiCadInstall("9.0", r"C:\KiCad\9.0\kicad.exe"),
        ],
    )
    monkeypatch.setattr(sys, "platform", "win32")
    versions = [i.version for i in kicad_versions.discover()]
    # 10.0 beats 9.0: numeric, not string ("10.0" < "9.0" as strings).
    assert versions == ["10.0", "9.0", "8.0"]


def test_duplicate_paths_are_collapsed(monkeypatch):
    monkeypatch.setattr(
        kicad_versions,
        "_discover_linux",
        lambda: [
            KiCadInstall("9.0", "/usr/bin/kicad"),
            KiCadInstall("9.0", "/usr/bin/kicad"),
        ],
    )
    monkeypatch.setattr(sys, "platform", "linux")
    assert len(kicad_versions.discover()) == 1


def test_label_prefers_the_version():
    assert KiCadInstall("9.0", "/x/kicad").label == "KiCad 9.0"


def test_label_falls_back_to_the_executable_name():
    assert KiCadInstall("", "/opt/kicad-nightly/kicad").label == "kicad"


def test_version_key_orders_numerically():
    assert kicad_versions._version_key("10.0") > kicad_versions._version_key("9.0")


# -- launching with a chosen command --------------------------------------


class FakeSettings:
    def __init__(self, command):
        self.kicad_command = command


def _project_with_pro(tmp_path):
    (tmp_path / "board.kicad_pro").write_text("{}")
    return tmp_path


def test_a_pinned_executable_is_run_directly(tmp_path, monkeypatch):
    monkeypatch.setattr(
        open_project.settings_store,
        "load",
        lambda: FakeSettings(r"C:\Program Files\KiCad\9.0\bin\kicad.exe"),
    )
    launched = []
    monkeypatch.setattr(
        open_project.subprocess, "Popen", lambda args, **k: launched.append(args)
    )
    monkeypatch.setattr(sys, "platform", "win32")

    open_project.launch_kicad(_project_with_pro(tmp_path))

    assert launched and launched[0][0] == r"C:\Program Files\KiCad\9.0\bin\kicad.exe"
    assert launched[0][1].endswith("board.kicad_pro")


def test_a_flatpak_command_is_expanded(tmp_path, monkeypatch):
    monkeypatch.setattr(
        open_project.settings_store,
        "load",
        lambda: FakeSettings("flatpak run org.kicad.KiCad"),
    )
    launched = []
    monkeypatch.setattr(
        open_project.subprocess, "Popen", lambda args, **k: launched.append(args)
    )
    monkeypatch.setattr(sys, "platform", "linux")

    open_project.launch_kicad(_project_with_pro(tmp_path))

    assert launched[0][:3] == ["flatpak", "run", "org.kicad.KiCad"]
    assert launched[0][3].endswith("board.kicad_pro")


def test_a_mac_app_is_opened_with_open_dash_a(tmp_path, monkeypatch):
    monkeypatch.setattr(
        open_project.settings_store,
        "load",
        lambda: FakeSettings("/Applications/KiCad 9.0.app"),
    )
    launched = []
    monkeypatch.setattr(
        open_project.subprocess, "Popen", lambda args, **k: launched.append(args)
    )
    monkeypatch.setattr(sys, "platform", "darwin")

    open_project.launch_kicad(_project_with_pro(tmp_path))

    assert launched[0][:3] == ["open", "-a", "/Applications/KiCad 9.0.app"]


def test_no_pinned_command_uses_the_os_default(tmp_path, monkeypatch):
    monkeypatch.setattr(
        open_project.settings_store, "load", lambda: FakeSettings("")
    )
    launched = []
    monkeypatch.setattr(
        open_project.subprocess, "Popen", lambda args, **k: launched.append(args)
    )
    monkeypatch.setattr(sys, "platform", "linux")

    open_project.launch_kicad(_project_with_pro(tmp_path))

    # The historical behaviour: hand it to the desktop's opener.
    assert launched[0][0] == "xdg-open"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
