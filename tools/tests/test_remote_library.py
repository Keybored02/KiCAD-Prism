"""Which KiCad Prism registers itself with, and reports as the user's.

KiCad keeps one config dir per major version and never removes them, so a machine
accumulates folders for versions that are long gone: an 8.0 left over from an upgrade,
or a 10.99 nightly that was tried once. Picking the highest number found there is
wrong twice over. It reports a version the user does not have, and, because link()
and unlink() resolve the same way, it writes the provider registration into a KiCad
they never launch, leaving the one they do use pointing at an old server.
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import kicad_versions, library_bridge, remote_library  # noqa: E402
from prism_agent.kicad_versions import KiCadInstall  # noqa: E402


@pytest.fixture
def kicad_home(tmp_path, monkeypatch):
    """A config base with a real 10.0 and a leftover 10.99 nightly."""
    base = tmp_path / "kicad"
    for name in ("8.0", "10.0", "10.99"):
        d = base / name
        d.mkdir(parents=True)
        (d / "eeschema.json").write_text(json.dumps({"remote_symbols": {}}), encoding="utf-8")
    monkeypatch.setattr(remote_library, "_config_base", lambda: base)
    # Nothing pinned unless a test says so.
    monkeypatch.setattr(remote_library, "_pinned_kicad_command", lambda: "")
    return base


def _installs(monkeypatch, *versions):
    monkeypatch.setattr(
        kicad_versions,
        "discover",
        lambda: [KiCadInstall(version=v, path=f"/fake/{v}/kicad") for v in versions],
    )


def test_a_leftover_config_does_not_beat_the_installed_kicad(kicad_home, monkeypatch):
    """THE bug: 10.99 sorts highest, but the user only has 10.0."""
    _installs(monkeypatch, "10.0", "8.0")
    assert remote_library.kicad_config_dir().name == "10.0"


def test_the_newest_installed_version_wins(kicad_home, monkeypatch):
    _installs(monkeypatch, "8.0", "10.0")
    assert remote_library.kicad_config_dir().name == "10.0"


def test_the_pinned_executable_beats_discovery(kicad_home, monkeypatch):
    """The user chose a KiCad explicitly; that is better evidence than a scan."""
    _installs(monkeypatch, "10.0")
    chosen = remote_library.kicad_config_dir(r"C:\Program Files\KiCad\8.0\bin\kicad.exe")
    assert chosen.name == "8.0"


def test_a_pinned_install_discovery_cannot_see_is_still_honoured(kicad_home, monkeypatch):
    """A portable or nightly build is not in the usual place, but it is still theirs."""
    _installs(monkeypatch, "10.0")
    chosen = remote_library.kicad_config_dir(r"C:\nightly\KiCad\10.99\bin\kicad.exe")
    assert chosen.name == "10.99"


def test_without_any_discoverable_install_the_newest_config_is_used(kicad_home, monkeypatch):
    """An unusual layout still has to work: an old folder beats no answer at all."""
    _installs(monkeypatch)
    assert remote_library.kicad_config_dir().name == "10.99"


def test_link_writes_to_the_kicad_the_user_actually_runs(kicad_home, monkeypatch):
    """The registration and the reported version have to name the same KiCad.

    This is the half that actually broke things: linking silently wrote into 10.99,
    so the 10.0 the user launches never saw the new server.
    """
    _installs(monkeypatch, "10.0")
    result = remote_library.link("http://localhost:5173")

    assert result["kicad_version"] == "10.0"

    written = json.loads((kicad_home / "10.0" / "eeschema.json").read_text(encoding="utf-8"))
    providers = written["remote_symbols"]["providers"]
    assert [p["metadata_url"] for p in providers] == ["http://localhost:5173"]

    # And the leftover was left alone rather than written to.
    untouched = json.loads((kicad_home / "10.99" / "eeschema.json").read_text(encoding="utf-8"))
    assert not (untouched.get("remote_symbols") or {}).get("providers")


def test_status_reports_the_installed_version(kicad_home, monkeypatch):
    _installs(monkeypatch, "10.0")
    remote_library.link("http://localhost:5173")
    state = remote_library.status("http://localhost:5173")
    assert state["kicad_version"] == "10.0"
    assert state["linked"] is True


def test_a_version_is_read_from_a_pinned_path_only_when_it_has_one(kicad_home):
    v = remote_library._version_of_command
    assert v(r"C:\Program Files\KiCad\10.0\bin\kicad.exe") == "10.0"
    assert v(r"C:\Program Files\KiCad\9.0\bin\kicad.exe") == "9.0"
    assert v("/usr/bin/kicad") == ""
    assert v("") == ""


# -- KiCad's HTTPS-or-loopback check, and the bridge that works around it --
#
# KiCad refuses a provider URL that isn't HTTPS or a literal loopback host
# (localhost/127.0.0.1/::1), with no config override anywhere, so most real Prism
# deployments (plain HTTP on the LAN) fail outright. The bridge (library_bridge.py)
# gives KiCad a genuine 127.0.0.1 URL to satisfy that instead; remote_library's job
# is making sure link/status/unlink all agree about which URL is actually in play.


def test_is_insecure_remote_matches_kicads_own_rule():
    assert library_bridge.is_insecure_remote("http://192.168.1.17:5173") is True
    assert library_bridge.is_insecure_remote("http://example.com") is True
    assert library_bridge.is_insecure_remote("https://192.168.1.17:5173") is False
    assert library_bridge.is_insecure_remote("http://localhost:5173") is False
    assert library_bridge.is_insecure_remote("http://127.0.0.1:5173") is False
    assert library_bridge.is_insecure_remote("HTTP://LOCALHOST:5173") is False


def test_status_reports_insecure_for_a_lan_server(kicad_home, monkeypatch):
    _installs(monkeypatch, "10.0")
    monkeypatch.setattr(remote_library, "_bridge_enabled", lambda: False)
    state = remote_library.status("http://192.168.1.17:5173")
    assert state["insecure"] is True
    assert state["bridge_active"] is False


def test_link_writes_the_bridge_url_when_enabled(kicad_home, monkeypatch):
    """With the bridge on, eeschema.json must get the LOOPBACK url, not the raw
    LAN server_url KiCad would refuse."""
    _installs(monkeypatch, "10.0")
    monkeypatch.setattr(library_bridge, "is_running", lambda: True)
    monkeypatch.setattr(library_bridge, "url", lambda: "http://127.0.0.1:54321")
    monkeypatch.setattr(remote_library, "_bridge_enabled", lambda: True)

    result = remote_library.link("http://192.168.1.17:5173")

    written = json.loads((kicad_home / "10.0" / "eeschema.json").read_text(encoding="utf-8"))
    providers = written["remote_symbols"]["providers"]
    assert [p["metadata_url"] for p in providers] == ["http://127.0.0.1:54321"]
    # The caller-facing result still names the real server, not the bridge's port.
    assert result["server_url"] == "http://192.168.1.17:5173"


def test_status_is_linked_through_the_bridge_not_stale(kicad_home, monkeypatch):
    """Once linked via the bridge, status() must compare against the SAME bridge
    url it wrote, or a working link reads as permanently "stale"."""
    _installs(monkeypatch, "10.0")
    monkeypatch.setattr(library_bridge, "is_running", lambda: True)
    monkeypatch.setattr(library_bridge, "url", lambda: "http://127.0.0.1:54321")
    monkeypatch.setattr(remote_library, "_bridge_enabled", lambda: True)

    remote_library.link("http://192.168.1.17:5173")
    state = remote_library.status("http://192.168.1.17:5173")

    assert state["linked"] is True
    assert state["stale"] is False
    assert state["bridge_active"] is True


def test_unlink_removes_a_bridged_entry(kicad_home, monkeypatch):
    _installs(monkeypatch, "10.0")
    monkeypatch.setattr(library_bridge, "is_running", lambda: True)
    monkeypatch.setattr(library_bridge, "url", lambda: "http://127.0.0.1:54321")
    monkeypatch.setattr(remote_library, "_bridge_enabled", lambda: True)

    remote_library.link("http://192.168.1.17:5173")
    result = remote_library.unlink("http://192.168.1.17:5173")

    assert result["removed"] is True
    written = json.loads((kicad_home / "10.0" / "eeschema.json").read_text(encoding="utf-8"))
    assert not written["remote_symbols"]["providers"]


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
