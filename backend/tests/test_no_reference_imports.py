"""Phase 6: "reference in place" is closed.

Reference mode meant the server operated directly on the folder the user was editing in
KiCad: no clone, no copy, Prism writing into a live working tree. It only ever worked
because the server and the client were the same machine.

Two things are pinned here, and both are about not destroying a user's work.

  * A new reference import is refused, and the DEFAULT is copy. It used to default to
    reference, so any caller who simply omitted the argument got the dangerous mode.
    A dangerous default is worse than a missing feature.

  * Unregistering a project never deletes files. Prism registering a folder is not a
    claim of ownership over it.
"""

import inspect

import pytest

from app.services import project_import_service, project_service
from app.services.workspace_service import workspace

# -- the door is closed ----------------------------------------------------


def test_a_reference_import_is_refused(tmp_path):
    with pytest.raises(ValueError, match="no longer supported"):
        project_import_service.start_import_job(
            repo_url=str(tmp_path),
            import_type="type1",
            local_path_mode="reference",
        )


def test_omitting_the_mode_copies_rather_than_referencing(tmp_path, monkeypatch):
    """The one that mattered most. `local_path_mode or "reference"` meant a caller who
    simply omitted the argument silently got the mode that writes to the user's own
    folder. Assert on what the job is actually STARTED with, not on the source text."""
    started = {}

    class FakeThread:
        def __init__(self, target=None, args=(), **kw):
            started["args"] = args

        def start(self):
            pass

        daemon = True

    monkeypatch.setattr(project_import_service.threading, "Thread", FakeThread)

    project_import_service.start_import_job(
        repo_url=str(tmp_path), import_type="type1"
    )  # no local_path_mode at all

    # The last positional arg of _run_import_local_job is the mode.
    assert started["args"][-1] == "copy"


def test_the_import_job_no_longer_has_a_reference_branch():
    source = inspect.getsource(project_import_service._run_import_local_job)
    # The branch that used `source` directly as the project path, with no copy at all.
    assert "effective_path = source" not in source


# -- unregistering never deletes a user's files ----------------------------


def test_project_service_no_longer_exposes_a_deleting_delete():
    """It rmtree'd the project directory, and the only guard was a local_path_mode
    check. For a reference project that directory IS the user's KiCad folder.

    It had zero callers. Deleted rather than left dead, because dead code with an
    rmtree in it is one careless import away from being live code with an rmtree."""
    assert not hasattr(project_service, "delete_project")


def test_unregistering_a_project_leaves_its_files_alone(tmp_path, monkeypatch):
    """The live delete path. It must remove the row and nothing else."""
    monkeypatch.setenv("KICAD_PROJECTS_ROOT", str(tmp_path))
    monkeypatch.setattr(
        "app.core.config.settings.CATALOG_SQLITE_PATH", str(tmp_path / "t.sqlite3")
    )
    from app.services.workspace_service import WorkspaceService

    ws = WorkspaceService()
    ws.initialize()

    project_dir = tmp_path / "my-precious-board"
    project_dir.mkdir()
    board = project_dir / "board.kicad_pcb"
    board.write_text("months of work")

    repo_id = ws.register_repository(
        name="board", url="x", clone_path_abs=str(project_dir)
    )
    pid = ws.register_project(repo_id=repo_id, name="board", relative_path=".")

    assert ws.delete_project(pid) is True

    # The row is gone. The board is not.
    assert not any(p["id"] == pid for p in ws.get_all_projects())
    assert board.is_file()
    assert board.read_text() == "months of work"


def test_the_workspace_delete_touches_no_filesystem_at_all():
    source = inspect.getsource(workspace.delete_project)
    for destructive in ("rmtree", "unlink", "remove", "shutil"):
        assert destructive not in source
