"""Phase 5: Prism hosts git.

The claim being tested is not "we made a directory called foo.git". It is that a real
`git clone` works against it, and that a client can push and another client sees the
push. So most of this drives actual git, not mocks.

The rule that must never break: **bare is only ever the server's side.** A client clone
is always a working tree, because KiCad opens files off the disk. Nothing is converted.
"""

import subprocess
from pathlib import Path

import pytest

from app.services import git_host_service
from app.services.git_host_service import GitHostError


def git(*args, cwd, check=True):
    return subprocess.run(
        ["git", *args], cwd=str(cwd), capture_output=True, text=True, check=check
    )


@pytest.fixture(autouse=True)
def root(tmp_path, monkeypatch):
    monkeypatch.setenv("KICAD_PROJECTS_ROOT", str(tmp_path))
    return tmp_path


# -- a project id can never escape the repos root --------------------------


@pytest.mark.parametrize(
    "bad", ["../../etc", "a/b", "a\\b", "..", "", "prj_../../../x"]
)
def test_a_bad_project_id_cannot_escape_the_repos_root(bad):
    """repo_path builds a filesystem path. Ids are minted by us, but a component that
    could walk out of the root would be a serious bug, so it is checked anyway."""
    with pytest.raises(GitHostError):
        git_host_service.repo_path(bad)


def test_a_real_id_resolves_inside_the_root():
    path = git_host_service.repo_path("prj_abc123")
    assert path.name == "prj_abc123.git"
    assert git_host_service.repos_root() in path.parents


# -- the bare repo ---------------------------------------------------------


def test_creates_a_genuinely_bare_repo():
    path = git_host_service.create("prj_abc")
    # Bare means no working tree. That is the whole point for an origin: there is no
    # checked-out copy for two people pushing to corrupt.
    assert (path / "HEAD").is_file()
    assert not (path / ".git").exists()
    out = git("rev-parse", "--is-bare-repository", cwd=path).stdout.strip()
    assert out == "true"


def test_create_is_idempotent():
    first = git_host_service.create("prj_abc")
    second = git_host_service.create("prj_abc")
    assert first == second


def test_a_fresh_repo_is_empty_and_says_so():
    git_host_service.create("prj_abc")
    assert git_host_service.is_empty("prj_abc")


def test_smart_http_is_enabled_on_a_new_repo():
    """Without http.receivepack, a self-hosted git-over-HTTP setup silently 403s on
    push. It is the single most common way this is got wrong."""
    path = git_host_service.create("prj_abc")
    assert git("config", "http.receivepack", cwd=path).stdout.strip() == "true"


def test_delete_removes_it():
    git_host_service.create("prj_abc")
    assert git_host_service.delete("prj_abc") is True
    assert not git_host_service.exists("prj_abc")


# -- a client can actually use it ------------------------------------------


def make_tree(path: Path, filename="board.kicad_pro") -> Path:
    path.mkdir(parents=True, exist_ok=True)
    git("init", "-b", "main", cwd=path)
    git("config", "user.email", "t@t.t", cwd=path)
    git("config", "user.name", "T", cwd=path)
    (path / filename).write_text("{}")
    git("add", "-A", cwd=path)
    git("commit", "-m", "first", cwd=path)
    return path


def test_a_client_can_clone_push_and_another_client_sees_it(tmp_path):
    """The actual feature, end to end, with real git: two working trees sharing a
    Prism-hosted origin."""
    bare = git_host_service.create("prj_abc")

    alice = make_tree(tmp_path / "alice")
    git("remote", "add", "origin", str(bare), cwd=alice)
    git("push", "-u", "origin", "main", cwd=alice)

    # Bob clones what Alice pushed.
    bob = tmp_path / "bob"
    git("clone", str(bare), str(bob), cwd=tmp_path)
    assert (bob / "board.kicad_pro").is_file()

    # A CLIENT clone is a working tree, never bare. KiCad opens files off the disk.
    assert (bob / ".git").is_dir()
    assert git("rev-parse", "--is-bare-repository", cwd=bob).stdout.strip() == "false"

    # Bob pushes; Alice sees it.
    (bob / "notes.md").write_text("hi")
    git("add", "-A", cwd=bob)
    git("commit", "-m", "bob's change", cwd=bob)
    git("push", cwd=bob)

    git("pull", cwd=alice)
    assert (alice / "notes.md").is_file()


# -- adoption never touches the user's tree --------------------------------


def test_adopt_pushes_the_history_and_leaves_the_tree_where_it_is(tmp_path):
    tree = make_tree(tmp_path / "mine")
    before = sorted(p.name for p in tree.iterdir())

    git_host_service.adopt("prj_abc", tree)

    # Still exactly where it was, still a working tree, NOT converted to bare.
    assert tree.is_dir()
    assert (tree / "board.kicad_pro").is_file()
    assert git("rev-parse", "--is-bare-repository", cwd=tree).stdout.strip() == "false"
    assert sorted(p.name for p in tree.iterdir()) == before

    # It gained a remote, and the history is really in the bare repo.
    origin = git("remote", "get-url", "origin", cwd=tree).stdout.strip()
    assert origin == str(git_host_service.repo_path("prj_abc"))
    assert not git_host_service.is_empty("prj_abc")


def test_adopting_a_folder_that_is_not_a_repo_is_refused(tmp_path):
    plain = tmp_path / "just-files"
    plain.mkdir()
    (plain / "board.kicad_pcb").write_text("")
    with pytest.raises(GitHostError, match="not a git repository"):
        git_host_service.adopt("prj_abc", plain)


def test_adopting_a_repo_with_no_commits_is_refused(tmp_path):
    empty = tmp_path / "empty"
    empty.mkdir()
    git("init", cwd=empty)
    with pytest.raises(GitHostError, match="no commits"):
        git_host_service.adopt("prj_abc", empty)


def test_adopting_a_repo_that_already_has_an_origin_is_refused(tmp_path):
    """Silently replacing someone's existing remote would disconnect them from the
    upstream they actually push to. Refuse and say why."""
    tree = make_tree(tmp_path / "mine")
    git("remote", "add", "origin", "https://github.com/x/y", cwd=tree)
    with pytest.raises(GitHostError, match="already has an origin"):
        git_host_service.adopt("prj_abc", tree)

    # And the user's remote is untouched.
    assert (
        git("remote", "get-url", "origin", cwd=tree).stdout.strip()
        == "https://github.com/x/y"
    )


@pytest.mark.parametrize(
    "make_bad",
    [
        pytest.param(lambda p: p.mkdir(), id="not-a-repo"),
        pytest.param(lambda p: (p.mkdir(), git("init", cwd=p)), id="no-commits"),
    ],
)
def test_a_refused_adoption_leaves_no_orphaned_repo(tmp_path, make_bad):
    """Creating the bare repo before validating would strand an empty prj_x.git on disk
    every time an adoption was refused."""
    bad = tmp_path / "bad"
    make_bad(bad)

    with pytest.raises(GitHostError):
        git_host_service.adopt("prj_abc", bad)

    assert not git_host_service.exists("prj_abc")


# -- the URL handed to clients ---------------------------------------------


def test_origin_url_is_empty_when_the_server_has_no_public_url(monkeypatch):
    """Better to say nothing than to hand out http://127.0.0.1:8000/git/..., which
    works only on the server's own machine."""
    monkeypatch.setattr("app.core.config.settings.PRISM_SERVER_URL", "")
    assert git_host_service.origin_url("prj_abc") == ""


def test_origin_url_is_cloneable_when_configured(monkeypatch):
    monkeypatch.setattr(
        "app.core.config.settings.PRISM_SERVER_URL", "https://prism.example.com/"
    )
    assert (
        git_host_service.origin_url("prj_abc")
        == "https://prism.example.com/git/prj_abc.git"
    )
