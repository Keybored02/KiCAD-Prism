"""The agent finding a project by its marker instead of by comparing paths.

The bug this replaces: the agent asked the server for every project's `path` and
string-compared it against the local one. That is only ever correct when the server
and the client are the same machine. These tests pin the new behaviour, and in
particular the two cases where marker-matching and path-matching disagree.
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import identity, server  # noqa: E402
from prism_agent.prism_client import PrismClient, PrismConfig  # noqa: E402


def stamp(directory: Path, project_id: str, server: str = "") -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    block = {"id": project_id}
    if server:
        block["server"] = server
    (directory / ".prism.json").write_text(json.dumps({"project": block}))
    return directory


# -- reading the marker ----------------------------------------------------


def test_reads_the_id_from_a_marker(tmp_path):
    stamp(tmp_path, "prj_abc", "https://prism.example.com")
    assert identity.project_id(tmp_path) == "prj_abc"
    assert identity.read(tmp_path)["server"] == "https://prism.example.com"


def test_no_marker_means_no_id(tmp_path):
    assert identity.project_id(tmp_path) == ""
    assert identity.read(tmp_path) is None


def test_an_unparseable_marker_means_no_id(tmp_path):
    (tmp_path / ".prism.json").write_text("{not json")
    assert identity.project_id(tmp_path) == ""


def test_a_marker_without_a_project_block_means_no_id(tmp_path):
    # A .prism.json that only carries path config is the common pre-phase-1 case.
    (tmp_path / ".prism.json").write_text(json.dumps({"paths": {"pcb": "a.kicad_pcb"}}))
    assert identity.project_id(tmp_path) == ""


# -- searching the roots ---------------------------------------------------


def test_finds_a_project_nested_under_a_root(tmp_path):
    stamp(tmp_path / "work" / "boards" / "widget", "prj_abc")
    assert identity.find_by_id("prj_abc", [str(tmp_path)]) == str(
        tmp_path / "work" / "boards" / "widget"
    )


def test_finds_a_root_that_is_itself_the_project(tmp_path):
    # A user can name a single project folder as a root. Do not require it to be a
    # container.
    stamp(tmp_path, "prj_abc")
    assert identity.find_by_id("prj_abc", [str(tmp_path)]) == str(tmp_path.resolve())


def test_returns_empty_when_the_project_is_not_under_any_root(tmp_path):
    stamp(tmp_path / "elsewhere", "prj_abc")
    root = tmp_path / "roots"
    root.mkdir()
    assert identity.find_by_id("prj_abc", [str(root)]) == ""


def test_returns_empty_when_no_roots_are_configured(tmp_path):
    stamp(tmp_path / "proj", "prj_abc")
    assert identity.find_by_id("prj_abc", []) == ""


def test_earlier_roots_win(tmp_path):
    # Two checkouts of the same project is a real situation (a scratch clone beside
    # a working one). Whichever we pick, it has to be predictable.
    first = stamp(tmp_path / "a" / "widget", "prj_abc")
    stamp(tmp_path / "b" / "widget", "prj_abc")
    found = identity.find_by_id("prj_abc", [str(tmp_path / "a"), str(tmp_path / "b")])
    assert found == str(first)


def test_a_missing_root_is_skipped_not_fatal(tmp_path):
    stamp(tmp_path / "real" / "widget", "prj_abc")
    found = identity.find_by_id(
        "prj_abc", [str(tmp_path / "does-not-exist"), str(tmp_path / "real")]
    )
    assert found == str(tmp_path / "real" / "widget")


def test_does_not_descend_into_skipped_directories(tmp_path):
    # node_modules and .git can be enormous. Walking them to find a marker that will
    # never be there is how an agent ends up hanging on startup.
    stamp(tmp_path / "node_modules" / "pkg", "prj_abc")
    assert identity.find_by_id("prj_abc", [str(tmp_path)]) == ""


def test_an_empty_id_never_matches(tmp_path):
    stamp(tmp_path / "proj", "prj_abc")
    assert identity.find_by_id("", [str(tmp_path)]) == ""


# -- the client's lookup ---------------------------------------------------


class FakeClient(PrismClient):
    """A PrismClient whose /api/projects response we control."""

    def __init__(self, rows):
        super().__init__(PrismConfig(base_url="http://server"))
        self.rows = rows

    def _request(self, method, path, body=None):
        return self.rows


def test_marker_wins_over_path(tmp_path):
    """The whole point. The server reports a path that is meaningless here (it is
    the server's own disk), and the marker still resolves the project correctly."""
    local = stamp(tmp_path / "widget", "prj_abc")
    client = FakeClient(
        [
            {"id": "prj_abc", "name": "widget", "path": "/srv/prism/data/widget"},
        ]
    )
    assert client.find_project(str(local))["id"] == "prj_abc"


def test_a_marker_for_an_unknown_project_returns_nothing(tmp_path):
    """The checkout names a project this server does not have. Answering "none" is
    correct; falling back to a path match could return the WRONG project, and a
    wrong answer is worse than no answer."""
    local = stamp(tmp_path / "widget", "prj_gone")
    client = FakeClient([{"id": "prj_other", "path": str(local)}])
    assert client.find_project(str(local)) is None


def test_falls_back_to_the_path_when_there_is_no_marker(tmp_path):
    """Projects imported before phase 1 carry no marker. Regressing them to
    "Not registered" would be a real bug for no gain, so the old same-machine path
    match stays until phase 3 removes `path` from the payload entirely."""
    local = tmp_path / "widget"
    local.mkdir()
    client = FakeClient([{"id": "prj_legacy", "path": str(local)}])
    assert client.find_project(str(local))["id"] == "prj_legacy"


def test_the_path_fallback_still_collapses_relative_escapes(tmp_path):
    # The server stores paths like data/projects/../../../test board. They name the
    # right folder but do not compare equal as strings, which used to report a
    # registered project as "Not registered".
    local = tmp_path / "widget"
    local.mkdir()
    weird = str(tmp_path / "data" / "projects" / ".." / ".." / "widget")
    client = FakeClient([{"id": "prj_legacy", "path": weird}])
    assert client.find_project(str(local))["id"] == "prj_legacy"


def test_returns_none_when_the_server_is_unreachable(tmp_path):
    stamp(tmp_path / "widget", "prj_abc")
    client = FakeClient(None)  # _request returns None when the backend is down
    assert client.find_project(str(tmp_path / "widget")) is None


# -- tidying the roots the user typed --------------------------------------


def test_blank_and_non_string_roots_are_dropped(tmp_path):
    assert server._clean_roots(["", "   ", None, 42]) == []


def test_the_same_folder_spelled_twice_is_stored_once(tmp_path):
    a = tmp_path / "work"
    a.mkdir()
    spellings = [str(a), str(a) + "/", str(a / "sub" / "..")]
    assert len(server._clean_roots(spellings)) == 1


def test_a_root_that_does_not_exist_is_kept(tmp_path):
    """A removable drive or an offline network share is still where the user keeps
    their projects. Silently deleting it from their settings because we could not
    stat it right now would be its own bug."""
    missing = str(tmp_path / "usb-stick")
    assert server._clean_roots([missing]) == [missing]


def test_order_is_preserved(tmp_path):
    # find_by_id searches roots in order and the first wins, so the order the user
    # chose has to survive being saved.
    a, b = tmp_path / "a", tmp_path / "b"
    a.mkdir()
    b.mkdir()
    assert server._clean_roots([str(b), str(a)]) == [str(b), str(a)]


def test_garbage_input_is_not_a_crash(tmp_path):
    assert server._clean_roots("not a list") == []
    assert server._clean_roots(None) == []


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
