"""Surviving an update that replaced our files underneath us.

Both of these were found by putting a real PCM install through an update, and both are
silent: nothing errors, the wrong thing simply runs. That makes them worth pinning even
though neither is reachable from an ordinary unit test without staging the filesystem
the way an installer leaves it.
"""

import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import __main__ as agent_main  # noqa: E402
from prism_agent import autostart, discovery, protocol  # noqa: E402


# -- the renamed binary ----------------------------------------------------
#
# Windows cannot delete a running .exe, so an installer replacing one renames it aside.
# sys.executable then points at a file that is no longer the agent, and every relaunch
# path (tray Restart, autostart, the prism:// handler) goes through self_command().


@pytest.fixture
def frozen(monkeypatch):
    """Pretend to be the packaged binary."""
    monkeypatch.setattr(sys, "frozen", True, raising=False)


def _install(tmp_path, *names):
    for name in names:
        (tmp_path / name).write_text("binary", encoding="utf-8")
    return tmp_path


def test_a_renamed_binary_still_relaunches_the_real_one(frozen, tmp_path, monkeypatch):
    """THE one that broke the tray's Restart after a PCM update.

    We are running as prism-agent.exe~RF1a2b3c4.TMP because the installer moved us out
    of the way. Relaunching that path would start the OLD agent, and once the temp file
    is cleaned up, nothing at all.
    """
    _install(tmp_path, "prism-agent.exe", "prism-agent.exe~RF2a16af5.TMP")
    monkeypatch.setattr(
        sys, "executable", str(tmp_path / "prism-agent.exe~RF2a16af5.TMP")
    )
    monkeypatch.setattr(sys, "platform", "win32")

    assert discovery.own_binary() == str(tmp_path / "prism-agent.exe")


def test_the_ordinary_case_is_unchanged(frozen, tmp_path, monkeypatch):
    _install(tmp_path, "prism-agent.exe")
    monkeypatch.setattr(sys, "executable", str(tmp_path / "prism-agent.exe"))
    monkeypatch.setattr(sys, "platform", "win32")

    assert discovery.own_binary() == str(tmp_path / "prism-agent.exe")


def test_without_a_canonical_binary_we_fall_back(frozen, tmp_path, monkeypatch):
    """An unusual layout is not a reason to refuse to relaunch at all."""
    odd = tmp_path / "prism-agent.exe~RF9.TMP"
    odd.write_text("binary", encoding="utf-8")
    monkeypatch.setattr(sys, "executable", str(odd))
    monkeypatch.setattr(sys, "platform", "win32")

    assert discovery.own_binary() == str(odd)


def test_the_autostart_entry_records_the_real_binary(frozen, tmp_path, monkeypatch):
    """An autostart entry outlives the build that wrote it, so a renamed temp file
    there starts the old agent at login and then nothing at all."""
    _install(tmp_path, "prism-agent.exe", "prism-agent.exe~RF2a16af5.TMP")
    monkeypatch.setattr(
        sys, "executable", str(tmp_path / "prism-agent.exe~RF2a16af5.TMP")
    )
    monkeypatch.setattr(sys, "platform", "win32")

    assert autostart._agent_command()[0] == str(tmp_path / "prism-agent.exe")


def test_the_protocol_handler_records_the_real_binary(frozen, tmp_path, monkeypatch):
    """Same for the prism:// registry command, which outlives builds too."""
    _install(tmp_path, "prism-agent.exe", "prism-agent.exe~RF2a16af5.TMP")
    monkeypatch.setattr(
        sys, "executable", str(tmp_path / "prism-agent.exe~RF2a16af5.TMP")
    )
    monkeypatch.setattr(sys, "platform", "win32")

    assert protocol._launch_command()[0] == str(tmp_path / "prism-agent.exe")


def test_a_source_checkout_has_no_binary_to_name(monkeypatch):
    """Empty rather than the interpreter: there is no single file to point at."""
    monkeypatch.setattr(sys, "frozen", False, raising=False)
    assert discovery.own_binary() == ""


def test_a_source_checkout_still_runs_the_module(monkeypatch):
    """Not frozen: the interpreter needs `-m prism_agent`, and no binary is involved."""
    monkeypatch.setattr(sys, "frozen", False, raising=False)

    command = agent_main.self_command("--profile", "dev")
    assert command[0] == sys.executable
    assert command[1:] == ["-m", "prism_agent", "--profile", "dev"]


# -- the stale bytecode ----------------------------------------------------
#
# A PCM update overwrites our .py files but leaves the previous install's __pycache__,
# and Python imports it, so KiCad runs the version that was just replaced. The purge
# lives in kicad_plugin/__init__.py, which imports pcbnew and cannot be imported here,
# so the behaviour is exercised through the same rule it applies.


def _purge(root: Path) -> None:
    """The rule kicad_plugin._purge_stale_bytecode applies."""
    cache = root / "__pycache__"
    if not cache.is_dir():
        return
    try:
        source = (root / "version.py").stat().st_mtime
    except OSError:
        return
    for entry in cache.iterdir():
        if entry.suffix != ".pyc":
            continue
        try:
            if entry.stat().st_mtime < source:
                entry.unlink()
        except OSError:
            pass


def _aged(path: Path, when: float) -> Path:
    path.write_bytes(b"bytecode")
    os.utime(path, (when, when))
    return path


def test_bytecode_older_than_the_version_is_dropped(tmp_path):
    """THE one that made a 0.5.1 plugin report itself as 0.5.0.

    version.py is rewritten by every update, so a .pyc older than it cannot have been
    built from it, whatever its own timestamp claims.
    """
    (tmp_path / "version.py").write_text('VERSION = "0.5.1"\n', encoding="utf-8")
    now = (tmp_path / "version.py").stat().st_mtime
    cache = tmp_path / "__pycache__"
    cache.mkdir()

    _aged(cache / "version.cpython-311.pyc", now - 600)
    _aged(cache / "widgets.cpython-311.pyc", now - 600)
    current = _aged(cache / "dialog.cpython-311.pyc", now + 60)

    _purge(tmp_path)

    assert [p.name for p in cache.iterdir()] == [current.name]


def test_a_cache_built_after_the_update_is_kept(tmp_path):
    """Ordinary running. Deleting this every launch would be pure overhead."""
    (tmp_path / "version.py").write_text('VERSION = "0.5.1"\n', encoding="utf-8")
    now = (tmp_path / "version.py").stat().st_mtime
    cache = tmp_path / "__pycache__"
    cache.mkdir()
    for name in ("version", "dialog", "widgets"):
        _aged(cache / f"{name}.cpython-311.pyc", now + 60)

    _purge(tmp_path)

    assert len(list(cache.iterdir())) == 3


def test_no_cache_at_all_is_not_an_error(tmp_path):
    (tmp_path / "version.py").write_text('VERSION = "0.5.1"\n', encoding="utf-8")
    _purge(tmp_path)  # must not raise


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
