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


def inspect_session(session_id: str) -> dict[str, Any]:
    """Report whether the staged folder is a git repo, without changing it."""
    session = _session_dir(session_id)
    if not session.is_dir():
        raise ValueError("Unknown import session")
    return {
        "session_id": session_id,
        "is_git_repo": _is_git_repo(_content_root(session)),
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
    shutil.rmtree(_session_dir(session_id), ignore_errors=True)


def import_session(
    session_id: str,
    *,
    confirm_init: bool = False,
    requested_by: str = "local-import",
) -> dict[str, Any]:
    """Clone (or init then clone) the staged folder into the workspace.

    Returns either an ``imported`` payload with the project ids, or a
    ``needs_init`` payload when the folder is not a git repo and the caller has
    not yet confirmed initialising one.
    """
    session = _session_dir(session_id)
    if not session.is_dir():
        raise ValueError("Unknown import session")
    content = _content_root(session)

    if not _is_git_repo(content):
        if not confirm_init:
            return {"status": "needs_init", "session_id": session_id}
        _initialise_repo(content)

    return _clone_and_register(content, requested_by=requested_by, session_id=session_id)


def _clone_and_register(
    content: Path,
    *,
    requested_by: str,
    session_id: str,
) -> dict[str, Any]:
    """Clone the staged repo into the workspace and register its projects.

    Mirrors run_project_import_job_v3's second half, but the source is a local
    path git clones directly, so there is no remote parsing or access handling.
    ``content`` is the real repo root inside the session (see _content_root).
    """
    repo_name = _folder_name(content)

    # Discover from the staged repo first: if it holds no KiCad project there is
    # nothing to import, and saying so before writing anything is kinder than
    # registering an empty repository.
    staged_repo = Repo(str(content))
    discovered = project_import_service.discover_projects_from_repo(staged_repo)
    if not discovered:
        raise ValueError(
            f"No KiCad projects found in '{repo_name}'. Prism looks for "
            "directories containing a .kicad_pro, .kicad_pcb or .kicad_sch file."
        )
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
    # remote import; the local folder's own git origin (if any) is preserved.
    Repo.clone_from(str(content), str(target_path))

    imported_ids = _register(target_path, repo_name, import_type, discovered)

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
) -> list[str]:
    repo_id = workspace.register_repository(
        name=repo_name,
        url=str(target_path),
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
    return imported_ids


def _folder_name(content: Path) -> str:
    """The imported repo's name, taken from the uploaded folder's own name.

    ``content`` is the picked folder (see _content_root), so its own name is the
    natural repo name; fall back to a generic one only if it is unnamed (e.g. a
    session root used directly).
    """
    name = content.name.strip()
    return name or "local-project"
