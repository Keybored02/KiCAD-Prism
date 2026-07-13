"""prism://open/<id>: open a project here, cloning it first if we don't have it.

This is a URL handler, which means a web page can invoke it. Two things follow, and
most of these tests are about them:

  * It must never write to disk without asking. A link in a browser is not consent to
    clone a repository into someone's filesystem.
  * A project name comes from the server and can contain anything. It must never be
    able to steer a clone outside the projects root.
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import open_project  # noqa: E402
from prism_agent.open_project import OpenError  # noqa: E402


@pytest.fixture
def roots(tmp_path, monkeypatch):
    """A configured projects root, and a stub server that knows one project."""
    root = tmp_path / "projects"
    root.mkdir()

    class FakeSettings:
        projects_roots = [str(root)]
        server_url = "https://prism.example.com"
        api_token = ""

    monkeypatch.setattr(open_project.settings_store, "load", lambda: FakeSettings())
    return root


def stub_server(monkeypatch, rows):
    monkeypatch.setattr(
        open_project.PrismClient, "_request", lambda self, m, p, body=None: rows
    )


def stamp(directory: Path, project_id: str) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / ".prism.json").write_text(json.dumps({"project": {"id": project_id}}))
    return directory


# -- the name can never escape the root ------------------------------------


@pytest.mark.parametrize(
    "name",
    [
        "../../../etc/passwd",
        "..\\..\\Windows\\System32",
        "/absolute/elsewhere",
        "C:\\Windows",
        "..",
        ".",
    ],
)
def test_a_hostile_project_name_cannot_steer_the_clone_out_of_the_root(name):
    """The name comes from the server. A separator or a `..` in it must not let a link
    write outside the projects root."""
    safe = open_project._safe_dirname(name)
    assert "/" not in safe
    assert "\\" not in safe
    assert ".." not in safe
    assert safe not in ("", ".")


def test_an_ordinary_name_survives_intact():
    assert open_project._safe_dirname("SatNOGS Comms v2.1") == "SatNOGS Comms v2.1"


def test_a_name_of_pure_punctuation_still_yields_a_directory():
    assert open_project._safe_dirname("///") == "project"


# -- nothing is written without a yes --------------------------------------


def test_declining_the_clone_writes_nothing(roots, monkeypatch):
    stub_server(
        monkeypatch,
        [
            {
                "id": "prj_a",
                "name": "widget",
                "origin_url": "https://h/x",
                "origin_owner": "external",
            }
        ],
    )
    cloned = []
    monkeypatch.setattr(open_project, "clone", lambda *a: cloned.append(a))

    with pytest.raises(OpenError, match="Cancelled"):
        open_project.open_project("prj_a", confirm=lambda _: False)

    assert cloned == []
    assert list(roots.iterdir()) == []


def test_the_confirmation_names_the_destination(roots, monkeypatch):
    """The user has to be able to see WHERE it is about to be written before agreeing."""
    stub_server(
        monkeypatch,
        [
            {
                "id": "prj_a",
                "name": "widget",
                "origin_url": "https://h/x",
                "origin_owner": "external",
            }
        ],
    )
    asked = []

    def confirm(question):
        asked.append(question)
        return False

    with pytest.raises(OpenError):
        open_project.open_project("prj_a", confirm=confirm)

    assert str(roots / "widget") in asked[0]


def test_accepting_clones_then_opens(roots, monkeypatch):
    stub_server(
        monkeypatch,
        [
            {
                "id": "prj_a",
                "name": "widget",
                "origin_url": "https://h/x",
                "origin_owner": "external",
            }
        ],
    )

    def fake_clone(origin, dest):
        Path(dest).mkdir(parents=True)
        (Path(dest) / "widget.kicad_pro").write_text("{}")

    opened = []
    monkeypatch.setattr(open_project, "clone", fake_clone)
    monkeypatch.setattr(open_project, "launch_kicad", lambda d: opened.append(str(d)))

    result = open_project.open_project("prj_a", confirm=lambda _: True)

    assert result == str(roots / "widget")
    assert opened == [str(roots / "widget")]


def test_a_fresh_clone_gets_a_marker(roots, monkeypatch):
    """Without this we would fail to find it next time and clone it all over again."""
    stub_server(
        monkeypatch,
        [
            {
                "id": "prj_a",
                "name": "widget",
                "origin_url": "https://h/x",
                "origin_owner": "external",
            }
        ],
    )
    monkeypatch.setattr(
        open_project,
        "clone",
        lambda origin, dest: Path(dest).mkdir(parents=True),
    )
    monkeypatch.setattr(open_project, "launch_kicad", lambda d: None)

    open_project.open_project("prj_a", confirm=lambda _: True)

    marker = json.loads((roots / "widget" / ".prism.json").read_text())
    assert marker["project"]["id"] == "prj_a"


# -- we already have it ----------------------------------------------------


def test_a_project_we_already_have_opens_without_asking_or_cloning(roots, monkeypatch):
    local = stamp(roots / "widget", "prj_a")
    stub_server(monkeypatch, [{"id": "prj_a", "name": "widget"}])

    opened = []
    monkeypatch.setattr(open_project, "launch_kicad", lambda d: opened.append(str(d)))
    monkeypatch.setattr(
        open_project, "clone", lambda *a: pytest.fail("must not clone what we have")
    )

    def confirm(_):
        pytest.fail("must not ask about a project we already have")

    assert open_project.open_project("prj_a", confirm=confirm) == str(local)
    assert opened == [str(local)]


# -- the honest refusals ---------------------------------------------------


def test_a_project_with_no_git_says_so_rather_than_pretending(roots, monkeypatch):
    """origin_owner == "none" is the real CIAA_ACC case: registered with Prism, not in
    git. There is nothing to clone, and inventing something would be worse."""
    stub_server(
        monkeypatch,
        [{"id": "prj_a", "name": "CIAA_ACC", "origin_url": "", "origin_owner": "none"}],
    )
    with pytest.raises(OpenError, match="not backed by git"):
        open_project.open_project("prj_a", confirm=lambda _: True)


def test_a_prism_hosted_project_with_no_url_names_the_real_cause(roots, monkeypatch):
    """Found in the wild. origin_owner is "prism", so Prism IS hosting the git, but the
    server has no PRISM_SERVER_URL and so cannot say where. The old code lumped this in
    with "not backed by git", which told the user their repository did not exist when it
    did. A wrong diagnosis is worse than none: it sends them to fix the wrong thing."""
    stub_server(
        monkeypatch,
        [{"id": "prj_a", "name": "widget", "origin_url": "", "origin_owner": "prism"}],
    )
    with pytest.raises(OpenError, match="PRISM_SERVER_URL"):
        open_project.open_project("prj_a", confirm=lambda _: True)


def test_a_prism_hosted_project_with_no_url_is_not_called_ungitted(roots, monkeypatch):
    stub_server(
        monkeypatch,
        [{"id": "prj_a", "name": "widget", "origin_url": "", "origin_owner": "prism"}],
    )
    with pytest.raises(OpenError) as exc:
        open_project.open_project("prj_a", confirm=lambda _: True)
    assert "not backed by git" not in str(exc.value)


def test_an_unknown_project_says_the_server_does_not_have_it(roots, monkeypatch):
    stub_server(monkeypatch, [])
    with pytest.raises(OpenError, match="no project"):
        open_project.open_project("prj_gone", confirm=lambda _: True)


def test_no_configured_root_means_nowhere_to_put_it(tmp_path, monkeypatch):
    class NoRoots:
        projects_roots = []
        server_url = "https://prism.example.com"
        api_token = ""

    monkeypatch.setattr(open_project.settings_store, "load", lambda: NoRoots())
    stub_server(
        monkeypatch,
        [
            {
                "id": "prj_a",
                "name": "widget",
                "origin_url": "https://h/x",
                "origin_owner": "external",
            }
        ],
    )
    with pytest.raises(OpenError, match="No projects folder"):
        open_project.open_project("prj_a", confirm=lambda _: True)


def test_a_server_that_is_down_does_not_silently_clone(roots, monkeypatch):
    stub_server(monkeypatch, None)  # _request returns None when unreachable
    with pytest.raises(OpenError):
        open_project.open_project("prj_a", confirm=lambda _: True)


# -- finding the project file ----------------------------------------------


def test_finds_the_kicad_pro(tmp_path):
    (tmp_path / "board.kicad_pro").write_text("{}")
    assert open_project.find_project_file(tmp_path).endswith("board.kicad_pro")


def test_a_directory_with_no_project_file_reports_nothing(tmp_path):
    (tmp_path / "board.kicad_pcb").write_text("")
    assert open_project.find_project_file(tmp_path) == ""


def test_launching_a_directory_with_no_project_file_is_an_error(tmp_path):
    with pytest.raises(OpenError, match="No KiCad project file"):
        open_project.launch_kicad(tmp_path)


def test_refuses_to_clone_over_a_non_empty_directory(tmp_path):
    dest = tmp_path / "existing"
    dest.mkdir()
    (dest / "work.kicad_pcb").write_text("do not destroy me")
    with pytest.raises(OpenError, match="already exists"):
        open_project.clone("https://h/x", dest)


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
