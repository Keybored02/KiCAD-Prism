"""Discovering installed KiCad versions, so the tray can offer a definite choice.

The filesystem scan itself is platform-specific and hard to pin in a unit test,
so what is tested here is the logic that does not depend on a real install: the
version sort, de-duplication, the label, and how a chosen command is launched.
"""

import subprocess
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


# -- _cli_version: caching and not trusting an uncooperative binary -----------
#
# Found live: an AppImage-mounted KiCad, reached via PATH the way discover() inherits
# it from a plugin-launched agent, didn't recognise --version at all and appeared to
# launch its GUI instead of erroring. kicad_config_dir() (remote_library.py) calls
# discover() -> _cli_version on every single /project request the plugin dialog makes,
# so a 15s timeout there was 15+ seconds added to every dialog load, and GNOME's own
# "not responding" watchdog fired because the plugin's ShowModal() blocks on it.


@pytest.fixture(autouse=True)
def _clear_cli_version_cache():
    """The cache is process-lifetime by design (see _cli_version's docstring); tests
    need a clean one each time or an earlier test's fake result would leak into a
    later one calling the same command."""
    kicad_versions._cli_version_cache.clear()
    kicad_versions._flatpak_has_kicad_cache.clear()
    yield
    kicad_versions._cli_version_cache.clear()
    kicad_versions._flatpak_has_kicad_cache.clear()


def test_the_subprocess_only_runs_once_per_command(monkeypatch):
    calls = []

    def fake_run(args, **kwargs):
        calls.append(args)
        return subprocess.CompletedProcess(args, 0, stdout="KiCad 9.0.1\n", stderr="")

    monkeypatch.setattr(kicad_versions.subprocess, "run", fake_run)

    first = kicad_versions._cli_version(["/usr/bin/kicad"])
    second = kicad_versions._cli_version(["/usr/bin/kicad"])

    assert first == second == "9.0"
    assert len(calls) == 1  # the second call was answered from the cache


def test_a_different_command_is_not_served_from_the_first_ones_cache(monkeypatch):
    def fake_run(args, **kwargs):
        version = "9.0.1" if "kicad-9" in args[0] else "10.0.1"
        return subprocess.CompletedProcess(args, 0, stdout=f"KiCad {version}\n", stderr="")

    monkeypatch.setattr(kicad_versions.subprocess, "run", fake_run)

    assert kicad_versions._cli_version(["/opt/kicad-9/kicad"]) == "9.0"
    assert kicad_versions._cli_version(["/opt/kicad-10/kicad"]) == "10.0"


def test_a_process_that_never_answers_is_not_worth_waiting_15_seconds_for(monkeypatch):
    """The actual bug, reproduced without a real 15-second wait in the test itself:
    a command that times out is treated as "no version", not retried or awaited
    longer, and the timeout passed to subprocess is short (see the docstring: a real
    KiCad answers in well under a second)."""
    seen_timeout = {}

    def fake_run(args, **kwargs):
        seen_timeout["value"] = kwargs.get("timeout")
        raise subprocess.TimeoutExpired(cmd=args, timeout=kwargs.get("timeout"))

    monkeypatch.setattr(kicad_versions.subprocess, "run", fake_run)

    result = kicad_versions._cli_version(["/tmp/.mount_kicad/bin/kicad"])

    assert result == ""
    assert seen_timeout["value"] <= 5  # not the old 15s


def test_a_timeout_is_cached_too_so_it_only_costs_once(monkeypatch):
    calls = []

    def fake_run(args, **kwargs):
        calls.append(args)
        raise subprocess.TimeoutExpired(cmd=args, timeout=kwargs.get("timeout"))

    monkeypatch.setattr(kicad_versions.subprocess, "run", fake_run)

    kicad_versions._cli_version(["/tmp/.mount_kicad/bin/kicad"])
    kicad_versions._cli_version(["/tmp/.mount_kicad/bin/kicad"])
    kicad_versions._cli_version(["/tmp/.mount_kicad/bin/kicad"])

    assert len(calls) == 1


def test_flatpak_probe_only_runs_once(monkeypatch):
    calls = []

    def fake_run(args, **kwargs):
        calls.append(args)
        return subprocess.CompletedProcess(args, 0)

    monkeypatch.setattr(kicad_versions.subprocess, "run", fake_run)

    assert kicad_versions._flatpak_has_kicad("/usr/bin/flatpak") is True
    assert kicad_versions._flatpak_has_kicad("/usr/bin/flatpak") is True
    assert len(calls) == 1


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


def _make_mac_bundle(path):
    """A minimal fake .app bundle: just enough for _discover_macos to find it."""
    exe = path / "Contents" / "MacOS" / "kicad"
    exe.parent.mkdir(parents=True)
    exe.write_text("")


def test_finds_the_real_installers_suite_layout(tmp_path, monkeypatch):
    """The official .dmg and Homebrew's cask both give you
    /Applications/KiCad/KiCad.app, a suite folder, not a bare bundle at the
    Applications root. Missing this is exactly what sent someone hunting for
    why a real install wasn't found."""
    apps = tmp_path / "Applications"
    _make_mac_bundle(apps / "KiCad" / "KiCad.app")
    monkeypatch.setattr(kicad_versions, "_macos_app_roots", lambda: [apps])
    monkeypatch.setattr(sys, "platform", "darwin")

    found = kicad_versions.discover()

    assert [i.path for i in found] == [str(apps / "KiCad" / "KiCad.app")]


def test_still_finds_a_flat_bundle_at_the_applications_root(tmp_path, monkeypatch):
    apps = tmp_path / "Applications"
    _make_mac_bundle(apps / "KiCad 9.0.app")
    monkeypatch.setattr(kicad_versions, "_macos_app_roots", lambda: [apps])
    monkeypatch.setattr(sys, "platform", "darwin")

    found = kicad_versions.discover()

    assert [i.version for i in found] == ["9.0"]


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
