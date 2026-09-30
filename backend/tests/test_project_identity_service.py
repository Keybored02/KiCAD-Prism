"""Identity in the repo: the `project` block in `.prism.json`.

The dangerous direction here is *destructive*, not absent: `.prism.json` is a file the
user may have hand-written (paths, portfolio metadata, custom project name), and this
code opens it for writing. Losing someone's path config to add an id they never asked
for would be a far worse bug than failing to stamp one. Most of these tests guard that.
"""

import json

import pytest

from app.services import project_identity_service as ident


@pytest.fixture
def project(tmp_path):
    return tmp_path


def marker(project):
    return project / ".prism.json"


def read_raw(project):
    return json.loads(marker(project).read_text(encoding="utf-8"))


# -- writing ---------------------------------------------------------------


def test_stamps_a_project_with_no_marker_at_all(project):
    assert ident.write(project, "prj_abc123", "https://prism.example.com") is True
    assert read_raw(project)["project"] == {
        "id": "prj_abc123",
        "server": "https://prism.example.com",
    }


def test_omits_server_when_it_is_not_configured(project):
    # An empty PRISM_SERVER_URL is the default. Better to write no server than a
    # wrong one, since the id alone identifies the project.
    ident.write(project, "prj_abc123", "")
    assert read_raw(project)["project"] == {"id": "prj_abc123"}


def test_preserves_everything_else_in_the_file(project):
    marker(project).write_text(
        json.dumps(
            {
                "project_name": "My Board",
                "description": "hand written",
                "paths": {"pcb": "boards/main.kicad_pcb"},
                "portfolio": {"featured": True},
            }
        ),
        encoding="utf-8",
    )

    ident.write(project, "prj_abc123")

    data = read_raw(project)
    assert data["project_name"] == "My Board"
    assert data["description"] == "hand written"
    assert data["paths"] == {"pcb": "boards/main.kicad_pcb"}
    assert data["portfolio"] == {"featured": True}
    assert data["project"]["id"] == "prj_abc123"


def test_rewriting_the_same_identity_does_not_touch_the_file(project):
    ident.write(project, "prj_abc123", "https://prism.example.com")
    before = marker(project).read_bytes()

    # False means "already said this". It matters: a rewrite would dirty the working
    # tree on every server boot, since this runs in the startup backfill.
    assert ident.write(project, "prj_abc123", "https://prism.example.com") is False
    assert marker(project).read_bytes() == before


def test_a_changed_server_is_rewritten(project):
    ident.write(project, "prj_abc123", "https://old.example.com")
    assert ident.write(project, "prj_abc123", "https://new.example.com") is True
    assert read_raw(project)["project"]["server"] == "https://new.example.com"


def test_refuses_to_clobber_a_file_it_cannot_parse(project):
    # A hand-written .prism.json with a trailing comma is a real thing. Overwriting
    # it to add an id would destroy the user's config. Leave it alone and say so.
    broken = '{"paths": {"pcb": "main.kicad_pcb"},}'
    marker(project).write_text(broken, encoding="utf-8")

    assert ident.write(project, "prj_abc123") is False
    assert marker(project).read_text(encoding="utf-8") == broken


def test_refuses_to_clobber_a_file_that_is_not_an_object(project):
    marker(project).write_text("[1, 2, 3]", encoding="utf-8")
    # A JSON array parses fine but is not a config. Do not turn it into one.
    ident.write(project, "prj_abc123")
    assert read_raw(project)["project"]["id"] == "prj_abc123"


def test_write_to_a_missing_directory_fails_quietly(tmp_path):
    # Never raise: a project that cannot be stamped is one that keeps working the
    # old way. Failing an import over identity would be a bad trade.
    assert ident.write(tmp_path / "does-not-exist", "prj_abc123") is False


# -- reading ---------------------------------------------------------------


def test_read_returns_none_when_there_is_no_marker(project):
    assert ident.read(project) is None
    assert ident.project_id(project) is None


def test_read_returns_none_when_the_marker_has_no_project_block(project):
    marker(project).write_text(json.dumps({"paths": {}}), encoding="utf-8")
    assert ident.read(project) is None


def test_read_returns_none_when_the_block_has_no_id(project):
    # A block without an id is not an identity, it is noise.
    marker(project).write_text(
        json.dumps({"project": {"server": "https://prism.example.com"}}),
        encoding="utf-8",
    )
    assert ident.read(project) is None


def test_read_survives_an_unparseable_marker(project):
    marker(project).write_text("{not json", encoding="utf-8")
    assert ident.read(project) is None


def test_round_trip(project):
    ident.write(project, "prj_abc123", "https://prism.example.com")
    assert ident.project_id(project) == "prj_abc123"


# -- matching --------------------------------------------------------------


def test_matches_on_id(project):
    ident.write(project, "prj_abc123", "https://prism.example.com")
    assert ident.matches(project, "prj_abc123") is True
    assert ident.matches(project, "prj_other") is False


def test_matches_ignores_the_server(project):
    # `server` is a hint, not a constraint. The same repo may be registered on a
    # staging server and a production one, and a client that found the "wrong" one
    # should still recognise the project rather than refuse to work.
    ident.write(project, "prj_abc123", "https://staging.example.com")
    assert ident.matches(project, "prj_abc123") is True


def test_matches_is_false_for_an_unstamped_project(project):
    assert ident.matches(project, "prj_abc123") is False
