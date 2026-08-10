"""Creating and adopting Prism-hosted projects (model B).

The invariant that has to hold across all of this: **one id**. The bare repo is named
prj_abc.git, the workspace row is prj_abc, and the .prism.json marker says prj_abc. If
those ever diverge, every lookup by id misses and the project becomes unreachable, in a
way that looks like it worked.
"""

import json
import subprocess
from pathlib import Path

import pytest

from app.services import git_host_service, project_create_service
from app.services.project_create_service import CreateError


def git(*args, cwd, check=True):
    return subprocess.run(
        ["git", *args], cwd=str(cwd), capture_output=True, text=True, check=check
    )


@pytest.fixture(autouse=True)
def workspace_root(tmp_path, monkeypatch):
    monkeypatch.setenv("KICAD_PROJECTS_ROOT", str(tmp_path))
    monkeypatch.setattr(
        "app.core.config.settings.CATALOG_SQLITE_PATH", str(tmp_path / "test.sqlite3")
    )
    monkeypatch.setattr(
        "app.core.config.settings.PRISM_SERVER_URL", "https://prism.example.com"
    )
    # The module-level `workspace` singleton resolved its DB path at import time.
    from app.services.workspace_service import WorkspaceService

    fresh = WorkspaceService()
    fresh.initialize()
    monkeypatch.setattr(project_create_service, "workspace", fresh)
    return fresh


# -- create ----------------------------------------------------------------


def test_create_makes_a_cloneable_seeded_project(workspace_root):
    result = project_create_service.create("Widget", "a board")

    assert result["origin_owner"] == "prism"
    assert result["origin_url"].endswith(f"/git/{result['id']}.git")

    # The bare repo exists and is NOT empty: an empty origin is a bad starting point
    # (clone warns, no branch to track, the user's first act would be creating the
    # files we already know they need).
    assert git_host_service.exists(result["id"])
    assert not git_host_service.is_empty(result["id"])


def test_the_id_is_the_same_everywhere(workspace_root):
    """The invariant. The bare repo, the workspace row and the marker must agree."""
    result = project_create_service.create("Widget")
    pid = result["id"]

    assert git_host_service.repo_path(pid).name == f"{pid}.git"

    rows = [p for p in workspace_root.get_all_projects() if p["id"] == pid]
    assert len(rows) == 1

    marker = json.loads((Path(rows[0]["path"]) / ".prism.json").read_text())
    assert marker["project"]["id"] == pid


def test_a_created_project_can_actually_be_cloned(workspace_root, tmp_path):
    result = project_create_service.create("Widget")
    bare = git_host_service.repo_path(result["id"])

    dest = tmp_path / "clone"
    git("clone", str(bare), str(dest), cwd=tmp_path)

    assert (dest / "Widget.kicad_pro").is_file()
    assert (dest / ".gitignore").is_file()
    # A client clone is a working tree, never bare.
    assert (dest / ".git").is_dir()


def test_the_seeded_gitignore_hides_kicad_noise(workspace_root, tmp_path):
    result = project_create_service.create("Widget")
    bare = git_host_service.repo_path(result["id"])
    dest = tmp_path / "clone"
    git("clone", str(bare), str(dest), cwd=tmp_path)

    ignored = (dest / ".gitignore").read_text()
    for noise in ("*-backups/", "*.kicad_prl", "*.lck", "RemoteLibrary/"):
        assert noise in ignored


def test_a_nameless_project_is_refused(workspace_root):
    with pytest.raises(CreateError, match="name is required"):
        project_create_service.create("   ")


# -- adopt -----------------------------------------------------------------


def make_tree(path: Path) -> Path:
    path.mkdir(parents=True)
    git("init", "-b", "main", cwd=path)
    git("config", "user.email", "t@t.t", cwd=path)
    git("config", "user.name", "T", cwd=path)
    (path / "board.kicad_pro").write_text("{}")
    git("add", "-A", cwd=path)
    git("commit", "-m", "first", cwd=path)
    return path


def test_adopt_leaves_the_users_tree_exactly_where_it_was(workspace_root, tmp_path):
    tree = make_tree(tmp_path / "mine")

    result = project_create_service.adopt(str(tree))

    assert result["origin_owner"] == "prism"
    # Still there, still a working tree, contents untouched.
    assert (tree / "board.kicad_pro").is_file()
    assert git("rev-parse", "--is-bare-repository", cwd=tree).stdout.strip() == "false"
    # It gained a remote pointing at the repo Prism now hosts.
    assert git("remote", "get-url", "origin", cwd=tree).stdout.strip() == str(
        git_host_service.repo_path(result["id"])
    )


def test_adopt_takes_its_name_from_the_folder_by_default(workspace_root, tmp_path):
    tree = make_tree(tmp_path / "CIAA_ACC")
    assert project_create_service.adopt(str(tree))["name"] == "CIAA_ACC"


def test_adopting_a_folder_that_is_not_a_repo_is_refused(workspace_root, tmp_path):
    """The real CIAA_ACC case. Turning a pile of files into a repo is deliberately a
    separate, explicit act: a `git add -A` on someone's project folder is how you commit
    3 GB of build output and a private key."""
    plain = tmp_path / "just-files"
    plain.mkdir()
    (plain / "board.kicad_pcb").write_text("")

    with pytest.raises(CreateError, match="not a git repository"):
        project_create_service.adopt(str(plain))


def test_adopting_a_missing_folder_is_refused(workspace_root, tmp_path):
    with pytest.raises(CreateError, match="not a folder"):
        project_create_service.adopt(str(tmp_path / "nope"))


def test_a_failed_adoption_leaves_no_orphaned_repo(workspace_root, tmp_path):
    plain = tmp_path / "just-files"
    plain.mkdir()

    with pytest.raises(CreateError):
        project_create_service.adopt(str(plain))

    # Nothing half-made left behind for the user to trip over.
    assert not list(git_host_service.repos_root().glob("*.git")) or all(
        not git_host_service.is_empty(p.stem)
        for p in git_host_service.repos_root().glob("*.git")
    )
