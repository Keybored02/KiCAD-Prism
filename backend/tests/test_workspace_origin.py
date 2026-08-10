"""Phase 3: the server stops leaking its own filesystem, and records where git is.

Two things are pinned here.

**`path` must not reach a client.** It names a directory on the SERVER's disk. A client
that compares it against its own paths is only ever right by accident of being the same
machine, and that accident is the bug this migration exists to remove. Server-side code
still needs it, so it stays on the model and is excluded from serialisation. If someone
ever drops the `exclude=True`, these tests fail.

**`origin_owner` must be derived from git, not from `url`.** The stored `url` holds a
real remote for a cloned repo but a plain filesystem path for a local import, and the
two are indistinguishable to a client. Only git actually knows.
"""

import json
import subprocess

import pytest

from app.api._helpers import _row_to_project
from app.services import project_service
from app.services.workspace_service import WorkspaceService, _git_origin


def git(*args, cwd):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


@pytest.fixture
def ws(tmp_path, monkeypatch):
    monkeypatch.setenv("KICAD_PROJECTS_ROOT", str(tmp_path))
    service = WorkspaceService()
    service.initialize()
    return service


# -- reading the real origin -----------------------------------------------


def test_a_repo_with_a_remote_reports_it(tmp_path):
    repo = tmp_path / "with-remote"
    repo.mkdir()
    git("init", cwd=repo)
    git("remote", "add", "origin", "https://github.com/x/y.git", cwd=repo)
    assert _git_origin(str(repo)) == "https://github.com/x/y.git"


def test_a_repo_with_no_remote_reports_nothing(tmp_path):
    repo = tmp_path / "no-remote"
    repo.mkdir()
    git("init", cwd=repo)
    assert _git_origin(str(repo)) == ""


def test_a_plain_directory_reports_nothing(tmp_path):
    """The real CIAA_ACC case: a registered project that is not a git repo at all.
    Legitimate, not an error."""
    plain = tmp_path / "not-a-repo"
    plain.mkdir()
    assert _git_origin(str(plain)) == ""


def test_a_missing_directory_reports_nothing(tmp_path):
    assert _git_origin(str(tmp_path / "gone")) == ""


# -- classifying a repository ----------------------------------------------


def test_a_cloned_repo_is_external(ws, tmp_path):
    repo = tmp_path / "cloned"
    repo.mkdir()
    git("init", cwd=repo)
    git("remote", "add", "origin", "https://gitlab.com/a/b", cwd=repo)

    rid = ws.register_repository(
        name="cloned", url="https://gitlab.com/a/b", clone_path_abs=str(repo)
    )
    row = ws.get_repository(rid)
    assert row["origin_owner"] == "external"
    assert row["origin_url"] == "https://gitlab.com/a/b"


def test_a_local_import_with_no_git_is_none_not_external(ws, tmp_path):
    """The `url` here is a FILESYSTEM PATH the user picked, not a remote. Trusting it
    would tell a client to `git clone C:\\Users\\...`, which is nonsense off-machine.
    Saying "none" is the honest answer."""
    plain = tmp_path / "desktop-project"
    plain.mkdir()

    rid = ws.register_repository(
        name="desktop-project", url=str(plain), clone_path_abs=str(plain)
    )
    row = ws.get_repository(rid)
    assert row["origin_owner"] == "none"
    assert not row["origin_url"]


def test_a_caller_that_knows_the_owner_is_believed(ws, tmp_path):
    """Phase 5 hosts the origin itself, so it does not need us to guess."""
    repo = tmp_path / "prism-hosted"
    repo.mkdir()

    rid = ws.register_repository(
        name="prism-hosted",
        url="x",
        clone_path_abs=str(repo),
        origin_url="https://prism.example.com/git/prj_abc.git",
        origin_owner="prism",
    )
    row = ws.get_repository(rid)
    assert row["origin_owner"] == "prism"


# -- what actually reaches a client ----------------------------------------


def project_payload(ws, tmp_path, *, with_remote: str | None) -> dict:
    repo = tmp_path / "proj"
    repo.mkdir(exist_ok=True)
    git("init", cwd=repo)
    if with_remote:
        git("remote", "add", "origin", with_remote, cwd=repo)
    rid = ws.register_repository(name="proj", url="u", clone_path_abs=str(repo))
    ws.register_project(repo_id=rid, name="proj", relative_path=".")
    row = ws.get_all_projects()[0]
    return json.loads(_row_to_project(row).model_dump_json())


def test_the_servers_path_never_reaches_a_client(ws, tmp_path):
    payload = project_payload(ws, tmp_path, with_remote="https://github.com/x/y")
    assert "path" not in payload
    assert "parent_repo_path" not in payload


def test_the_origin_does_reach_a_client(ws, tmp_path):
    payload = project_payload(ws, tmp_path, with_remote="https://github.com/x/y")
    assert payload["origin_url"] == "https://github.com/x/y"
    assert payload["origin_owner"] == "external"


def test_server_side_code_can_still_read_the_path(ws, tmp_path):
    """Private to clients, not to us. Thumbnails, diffs and path config all need a
    real directory on disk."""
    repo = tmp_path / "proj"
    repo.mkdir()
    git("init", cwd=repo)
    rid = ws.register_repository(name="proj", url="u", clone_path_abs=str(repo))
    ws.register_project(repo_id=rid, name="proj", relative_path=".")

    model = _row_to_project(ws.get_all_projects()[0])
    assert model.path  # readable in-process
    assert "path" not in json.loads(model.model_dump_json())  # never serialised


def test_the_model_still_declares_path_as_required():
    # A guard against someone "fixing" the exclude by deleting the field: server code
    # depends on it, so it must exist, it must just never be sent.
    assert "path" in project_service.Project.model_fields
