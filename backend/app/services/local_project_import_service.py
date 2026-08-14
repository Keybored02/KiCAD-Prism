"""Import a KiCad project from a local folder the user picks in the browser.

A browser cannot hand the backend a filesystem path, so the folder is uploaded
file by file (the same webkitdirectory pattern the library import uses) into a
per-session staging directory that preserves the tree, including any ``.git``.
The backend then:

  * detects whether the staged folder is already a git repository,
  * if it is, clones it into the workspace as its own repo (like a remote
    import, but from the local staging path git can clone natively),
  * if it is not, waits for the user to confirm, then ``git init`` s the folder
    with one initial commit and imports that,

and finally discovers and registers the KiCad projects inside, reusing the same
machinery a remote import uses so a locally imported project behaves identically
afterwards.

The staging area is scratch: it lives under the projects root, is namespaced by
an opaque session id, and is removed once the import lands (or is abandoned).
"""

from __future__ import annotations

import logging
import os
import shutil
import stat
import uuid
from pathlib import Path
from typing import Any, Optional

from git import Actor, Repo

from app.services import project_import_service, project_service
from app.services.workspace_service import workspace

logger = logging.getLogger(__name__)

# One initial commit for a folder that had no git history. A fixed identity
# keeps the import reproducible and makes it obvious in the log that Prism, not
# the user, created this commit.
_INIT_ACTOR = Actor("Prism", "prism@localhost")


def _force_rmtree(path: Path) -> None:
    """Remove a tree that may contain a git dir.

    git marks pack files read-only, and on Windows shutil.rmtree cannot delete a
    read-only file; the handler clears the bit and retries so a .git directory
    comes away cleanly instead of leaving a half-deleted orphan.
    """
    def _on_error(func, target, _exc):
        try:
            os.chmod(target, stat.S_IWRITE)
            func(target)
        except OSError:
            pass

    shutil.rmtree(path, onerror=_on_error)


def _staging_root() -> Path:
    root = Path(project_service.PROJECTS_ROOT) / ".local-import-staging"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _session_dir(session_id: str) -> Path:
    # The id is minted by create_session (a uuid hex), never taken from a client
    # path, so it cannot contain separators; still, resolve and re-check that the
    # result stays under the staging root before any write.
    path = (_staging_root() / session_id).resolve()
    if not path.is_relative_to(_staging_root().resolve()):
        raise ValueError("Invalid import session")
    return path


def create_session() -> str:
    """Start a staging session and return its id."""
    session_id = uuid.uuid4().hex
    _session_dir(session_id).mkdir(parents=True, exist_ok=True)
    return session_id


def _safe_target(session_id: str, relative_path: str) -> Path:
    """Resolve an uploaded file's destination, refusing any escape.

    webkitdirectory sends forward-slash relative paths; an attacker could send
    ``../`` to write outside the session. Normalise and verify containment.
    """
    session = _session_dir(session_id)
    if not session.is_dir():
        raise ValueError("Unknown import session")
    cleaned = relative_path.replace("\\", "/").lstrip("/")
    target = (session / cleaned).resolve()
    if not target.is_relative_to(session.resolve()):
        raise ValueError(f"Upload path escapes the session: {relative_path}")
    return target


def save_uploaded_file(session_id: str, relative_path: str, stream: Any) -> None:
    """Write one uploaded file into the session, creating parent dirs."""
    target = _safe_target(session_id, relative_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("wb") as handle:
        shutil.copyfileobj(stream, handle)


def _content_root(session: Path) -> Path:
    """The real top of the uploaded tree inside a session.

    webkitdirectory nests everything under the folder the user picked, so an
    upload lands at ``session/<picked-folder>/...`` rather than at the session
    root. When the session holds exactly one directory and no loose files, that
    directory is the content root; otherwise the session itself is used (e.g. a
    caller that uploaded a flat set of files).
    """
    entries = list(session.iterdir())
    dirs = [child for child in entries if child.is_dir()]
    files = [child for child in entries if child.is_file()]
    if len(dirs) == 1 and not files:
        return dirs[0]
    return session


def _is_git_repo(path: Path) -> bool:
    """True when the staged folder is a working tree Prism can clone from."""
    try:
        repo = Repo(str(path))
    except Exception:
        return False
    try:
        # A freshly-init'd repo with no commit has no HEAD to clone; treat that
        # as "not yet a usable repo" so it takes the init path and gets a commit.
        return not repo.bare and repo.head.is_valid()
    except Exception:
        return False


def _origin_url(repo: Repo) -> str:
    """The repo's ``origin`` remote URL, or "" if it has none."""
    try:
        return next(iter(repo.remote("origin").urls), "")
    except Exception:
        return ""


def _set_origin(repo: Repo, url: str) -> None:
    """Make ``origin`` be ``url``, or remove it when ``url`` is empty.

    A clone from a local path points origin at that path; this replaces it with
    the folder's true remote, or drops it, so the workspace repo matches what a
    remote import would have (a real origin) or an honestly local one (none).
    """
    try:
        if repo.remotes:
            for remote in list(repo.remotes):
                if remote.name == "origin":
                    repo.delete_remote(remote)
        if url:
            repo.create_remote("origin", url)
    except Exception as error:
        logger.warning("Could not set origin on the imported repo: %s", error)


def inspect_session(session_id: str) -> dict[str, Any]:
    """Analyse the staged folder and return the same review a remote import does.

    Discovery is git-based (it reads the tree at HEAD), so a folder that is not a
    git repo yet is initialised *in the scratch staging copy* first, purely so the
    one shared discovery function can run. That init is on throwaway staging, not
    the user's original folder, and is what would happen at import anyway; doing it
    here lets local and remote share a single discovery and review path.

    Returns a payload shaped like ``project_analyze``'s result: ``projects`` (each
    with name/relative_path/has_*), ``import_type``, ``repo_name``. ``was_git`` and
    ``was_initialised`` tell the dialog whether it needs to confirm creating a repo.
    """
    session = _session_dir(session_id)
    if not session.is_dir():
        raise ValueError("Unknown import session")
    content = _content_root(session)

    was_git = _is_git_repo(content)
    if not was_git:
        _initialise_repo(content)

    staged_repo = Repo(str(content))
    try:
        discovered = project_import_service.discover_projects_from_repo(staged_repo)
        import_type = project_import_service.classify_import_type(discovered) if discovered else "type1"
    finally:
        staged_repo.close()

    return {
        "session_id": session_id,
        "was_git": was_git,
        "was_initialised": not was_git,
        "repo_name": _folder_name(content),
        "import_type": import_type,
        "projects": [
            {
                "name": project.name,
                "relative_path": project.relative_path,
                "has_schematic": project.has_schematic,
                "has_pcb": project.has_pcb,
                "has_project_file": project.has_project_file,
            }
            for project in discovered
        ],
        "empty_reason": (
            "No KiCad design files were found in this folder. Prism looks for "
            "directories containing a .kicad_pro, .kicad_pcb or .kicad_sch file."
            if not discovered else None
        ),
    }


def _initialise_repo(path: Path) -> None:
    """Turn a plain folder into a git repo with a single initial commit.

    Only reached after the user confirmed: creating a commit writes to disk and a
    URL/click is not consent to do that silently.
    """
    repo = Repo.init(str(path))
    repo.git.add(A=True)
    # An empty folder (no files at all) cannot be committed; guard so init still
    # produces a valid, if empty, HEAD the clone step can use.
    if repo.git.status("--porcelain"):
        repo.index.commit(
            "Initial import into Prism",
            author=_INIT_ACTOR,
            committer=_INIT_ACTOR,
        )
    else:
        # Nothing to commit: make an empty root commit so HEAD is valid.
        repo.git.commit("--allow-empty", "-m", "Initial import into Prism")


def cleanup_session(session_id: str) -> None:
    # The staging tree can hold an uploaded .git, so use the read-only-aware
    # remover rather than plain rmtree.
    session = _session_dir(session_id)
    if session.exists():
        _force_rmtree(session)


def import_session(
    session_id: str,
    *,
    selected_paths: Optional[list[str]] = None,
    confirm_init: bool = False,
    requested_by: str = "local-import",
) -> dict[str, Any]:
    """Clone the staged folder into the workspace and register the chosen projects.

    ``selected_paths`` are the project relative paths the user picked in the
    review (as with a remote import); None or empty means every discovered
    project. inspect_session has already initialised a non-git folder's staging
    copy, so import just clones and registers.
    """
    session = _session_dir(session_id)
    if not session.is_dir():
        raise ValueError("Unknown import session")
    content = _content_root(session)

    # A folder reaching import without git means inspect was skipped; initialise
    # so the clone has a HEAD, matching what inspect would have done.
    if not _is_git_repo(content):
        if not confirm_init:
            return {"status": "needs_init", "session_id": session_id}
        _initialise_repo(content)

    return _clone_and_register(
        content,
        requested_by=requested_by,
        session_id=session_id,
        selected_paths=selected_paths,
    )


def _clone_and_register(
    content: Path,
    *,
    requested_by: str,
    session_id: str,
    selected_paths: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Clone the staged repo into the workspace and register its projects.

    Mirrors run_project_import_job_v3's second half, but the source is a local
    path git clones directly, so there is no remote parsing or access handling.
    ``content`` is the real repo root inside the session (see _content_root).
    ``selected_paths`` filters to the projects the user picked, like a remote
    import; None or empty imports all.
    """
    repo_name = _folder_name(content)

    # Discover from the staged repo first: if it holds no KiCad project there is
    # nothing to import, and saying so before writing anything is kinder than
    # registering an empty repository.
    staged_repo = Repo(str(content))
    # The folder's own origin, if it had one, is the true provenance. A clone from
    # a local path would otherwise point origin at the staging dir we are about to
    # delete, leaving a dead remote; capture the real one to restore below.
    source_origin = _origin_url(staged_repo)
    discovered = project_import_service.discover_projects_from_repo(staged_repo)
    if not discovered:
        raise ValueError(
            f"No KiCad projects found in '{repo_name}'. Prism looks for "
            "directories containing a .kicad_pro, .kicad_pcb or .kicad_sch file."
        )

    # Keep only the projects the user selected in the review. A Type-1 repo is a
    # single project, so selection does not apply there.
    import_type = project_import_service.classify_import_type(discovered)
    if selected_paths and import_type != "type1":
        wanted = set(selected_paths)
        discovered = [p for p in discovered if p.relative_path in wanted]
        if not discovered:
            raise ValueError("None of the selected projects were found in the folder.")
        import_type = project_import_service.classify_import_type(discovered)

    base_path = Path(project_service.PROJECTS_ROOT) / (
        "type1" if import_type == "type1" else "type2"
    )
    base_path.mkdir(parents=True, exist_ok=True)
    target_path = base_path / repo_name
    if target_path.exists():
        raise ValueError(
            f"A project directory named '{repo_name}' already exists. Rename the "
            "folder or remove the existing import first."
        )

    # Clone from the local staging path. git handles a filesystem source, so the
    # workspace copy is a normal clone with its own history, exactly like a
    # remote import.
    #
    # Clone and register are one unit: a failure after the clone must not leave an
    # orphaned directory behind, or the next attempt fails with "already exists"
    # about a repo the database never knew. On any error, remove the clone (and
    # unwind any rows registered so far) before re-raising.
    cloned = Repo.clone_from(str(content), str(target_path))
    # A clone from a local path sets origin to that path, which we are about to
    # delete. Converge with a remote import instead: point origin at the folder's
    # real remote when it had one, or drop origin entirely when it did not, so the
    # workspace repo never carries a dead remote. This is the ONLY thing that
    # differs by provenance; everything else about the repo is identical.
    _set_origin(cloned, source_origin)
    # Release the clone's git handles up front: GitPython holds them open, and on
    # Windows that keeps .git locked so a rollback rmtree would silently fail.
    cloned.close()
    repo_id = ""
    try:
        repo_id, imported_ids = _register(
            target_path, repo_name, import_type, discovered, origin_url=source_origin
        )
    except Exception:
        # delete_repository cascades to its projects, so it unwinds whatever
        # _register managed to write before it failed.
        if repo_id:
            try:
                workspace.delete_repository(repo_id)
            except Exception:
                logger.warning("Could not unwind repository %s after a failed import", repo_id)
        _force_rmtree(target_path)
        raise

    cleanup_session(session_id)
    return {
        "status": "imported",
        "import_type": import_type,
        "project_ids": imported_ids,
        "repo_name": repo_name,
    }


def _register(
    target_path: Path,
    repo_name: str,
    import_type: str,
    discovered: list,
    *,
    origin_url: str = "",
) -> tuple[str, list[str]]:
    """Register the repo and its projects; returns (repo_id, project_ids).

    Returning the repo_id lets the caller unwind a partial registration by
    deleting the repository (which cascades to any projects already written).
    ``origin_url`` is the folder's real remote, stored as the repo url so a local
    import with a remote records the same provenance a remote import would; a
    folder with no remote records an empty url.
    """
    repo_id = workspace.register_repository(
        name=repo_name,
        url=origin_url,
        clone_path_abs=str(target_path),
        import_type="single" if import_type == "type1" else "multi",
    )
    imported_ids: list[str] = []
    if import_type == "type1":
        cached = project_import_service.resolve_cached_paths(str(target_path))
        imported_ids.append(
            workspace.register_project(
                repo_id=repo_id,
                name=repo_name,
                relative_path=".",
                description=f"Project {repo_name}",
                **cached,
            )
        )
    else:
        checkout_root = target_path.resolve()
        for project in discovered:
            relative_path = project.relative_path
            full_project_path = target_path / relative_path
            if not full_project_path.resolve().is_relative_to(checkout_root):
                raise ValueError(f"Project path escapes the checkout: {relative_path}")
            board_name = project.name or os.path.basename(relative_path)
            cached = project_import_service.resolve_cached_paths(str(full_project_path))
            imported_ids.append(
                workspace.register_project(
                    repo_id=repo_id,
                    name=board_name,
                    relative_path=relative_path,
                    description=f"{repo_name} / {board_name}",
                    **cached,
                )
            )
    return repo_id, imported_ids


def _folder_name(content: Path) -> str:
    """The imported repo's name, taken from the uploaded folder's own name.

    ``content`` is the picked folder (see _content_root), so its own name is the
    natural repo name; fall back to a generic one only if it is unnamed (e.g. a
    session root used directly).
    """
    name = content.name.strip()
    return name or "local-project"
