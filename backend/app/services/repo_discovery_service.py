"""Find the KiCad repositories on a connected Git host.

A connector's API credential lists which repositories exist; Prism's own git
access (workspace SSH key, ``GITHUB_TOKEN``) then reads each one the way an
import would, through ``clone_and_discover_projects``. A repository is
therefore a candidate on exactly the grounds the analyze job would find
projects in it, and one Prism cannot clone is reported as such rather than
offered.

Whether a candidate is already imported is never stored. It is worked out when
the list is read, so an import by URL or a deleted project cannot leave it
stale.
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any, Callable, Mapping, Optional, Sequence

from git import RemoteProgress
from psycopg.types.json import Jsonb

from app.services import git_access_service, git_remote_access
from app.services.git_failures import GitAccessError
from app.services.git_remote_url import RemoteUrlError, parse_remote_url
from app.services.job_kinds import JobKind, JobSubject, subject_lock
from app.services.job_runtime import JobCancelled, JobContext, JobResult, LostJobLease
from app.services.postgres_database import database
from app.services.project_import_service import (
    clone_and_discover_projects,
    make_project_key,
)
from app.services.workspace_service import workspace

logger = logging.getLogger(__name__)

SCAN_WORKERS = 4
TABLE_NAME = "ws_repo_discovery_candidates"
TABLE = f"workspace.{TABLE_NAME}"


@dataclass
class Inspection:
    """What reading one repository found. ``None`` from an inspector means unchanged."""

    state: str
    head_sha: str = ""
    default_branch: str = ""
    projects: list[dict[str, Any]] = field(default_factory=list)
    branches: list[str] = field(default_factory=list)
    error: str = ""


Inspector = Callable[[Mapping[str, Any], Callable[[], None]], Optional[Inspection]]


# --- Which URL to read a repository by ----------------------------------------


def choose_clone_url(listed: Mapping[str, Any]) -> str:
    """The URL an import would use: SSH when Prism has a key and trusts the host."""

    ssh_url = str(listed.get("sshUrl") or "")
    http_url = str(listed.get("cloneUrl") or "")
    if ssh_url and git_access_service.describe_key().exists:
        try:
            host = parse_remote_url(ssh_url, git_remote_access.remote_url_policy()).host
        except RemoteUrlError:
            host = ""
        if host and git_access_service.is_host_trusted(host):
            return ssh_url
    return http_url or ssh_url


# --- Storage ------------------------------------------------------------------


def sync_listing(connector_id: str, listed: Sequence[Mapping[str, Any]]) -> None:
    """Make the stored candidates match what the host lists now.

    A repository the host stopped listing is dropped. One that is new is
    ``pending`` until a scan reads it, and one that is still listed keeps what
    the last scan found.
    """

    policy = git_remote_access.remote_url_policy()
    with database.connection() as conn:
        for item in listed:
            url = choose_clone_url(item)
            state, error, dedup_key = "pending", "", ""
            try:
                dedup_key = parse_remote_url(url, policy).dedup_key
            except RemoteUrlError as exc:
                state, error = "blocked", str(exc)
            conn.execute(
                f"""
                INSERT INTO {TABLE}
                    (id, connector_id, remote_id, full_name, web_url, clone_url, dedup_key,
                     default_branch, archived, size_bytes, state, error)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (connector_id, remote_id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    web_url = EXCLUDED.web_url,
                    clone_url = EXCLUDED.clone_url,
                    dedup_key = EXCLUDED.dedup_key,
                    archived = EXCLUDED.archived,
                    size_bytes = EXCLUDED.size_bytes,
                    default_branch = COALESCE(NULLIF(EXCLUDED.default_branch, ''), {TABLE_NAME}.default_branch),
                    state = CASE
                        WHEN EXCLUDED.state = 'blocked' THEN 'blocked'
                        WHEN {TABLE_NAME}.state = 'blocked' THEN 'pending'
                        ELSE {TABLE_NAME}.state
                    END,
                    error = CASE
                        WHEN EXCLUDED.state = 'blocked' THEN EXCLUDED.error
                        WHEN {TABLE_NAME}.state = 'blocked' THEN ''
                        ELSE {TABLE_NAME}.error
                    END
                """,
                (
                    uuid.uuid4().hex,
                    connector_id,
                    str(item["id"]),
                    str(item.get("fullName") or ""),
                    str(item.get("htmlUrl") or ""),
                    url,
                    dedup_key,
                    str(item.get("defaultBranch") or ""),
                    bool(item.get("archived")),
                    item.get("sizeBytes"),
                    state,
                    error,
                ),
            )
        conn.execute(
            f"DELETE FROM {TABLE} WHERE connector_id = %s AND remote_id <> ALL(%s)",
            (connector_id, [str(item["id"]) for item in listed]),
        )
        conn.commit()


def candidate_rows(connector_id: str) -> list[dict[str, Any]]:
    with database.connection() as conn:
        rows = conn.execute(
            f"SELECT * FROM {TABLE} WHERE connector_id = %s ORDER BY lower(full_name)",
            (connector_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def record_inspection(candidate_id: str, result: Inspection) -> None:
    with database.connection() as conn:
        conn.execute(
            f"""
            UPDATE {TABLE}
            SET state = %s, head_sha = %s, projects = %s, branches = %s, error = %s, scanned_at = now(),
                default_branch = COALESCE(NULLIF(%s, ''), default_branch)
            WHERE id = %s
            """,
            (
                result.state,
                result.head_sha,
                Jsonb(result.projects),
                Jsonb(result.branches),
                result.error,
                result.default_branch,
                candidate_id,
            ),
        )
        conn.commit()


def delete_for_connector(connector_id: str) -> None:
    with database.connection() as conn:
        conn.execute(f"DELETE FROM {TABLE} WHERE connector_id = %s", (connector_id,))
        conn.commit()


# --- Reading one repository ---------------------------------------------------


class _CancelCheck(RemoteProgress):
    """Lets a cancelled scan stop a clone at its next progress tick."""

    def __init__(self, check: Callable[[], None]) -> None:
        super().__init__()
        self._check = check

    def update(self, op_code, cur_count, max_count=None, message=""):  # noqa: ANN001
        self._check()


def inspect_repository(candidate: Mapping[str, Any], check_cancelled: Callable[[], None]) -> Optional[Inspection]:
    """Read one repository's default branch the way an import would.

    Returns ``None`` when its head is the one already scanned.
    """

    state = str(candidate.get("state") or "pending")
    if state == "blocked":
        return Inspection(state="blocked", error=str(candidate.get("error") or ""))
    try:
        parsed = parse_remote_url(str(candidate["clone_url"]), git_remote_access.remote_url_policy())
        branch, sha, branches = git_remote_access.read_remote_refs(parsed)
        if not sha:
            return Inspection(state="empty", default_branch=branch or "")
        if sha == candidate.get("head_sha") and state in {"kicad", "empty"}:
            return None
        check_cancelled()
        found = clone_and_discover_projects(parsed, progress=_CancelCheck(check_cancelled))
    except RemoteUrlError as exc:
        return Inspection(state="blocked", error=str(exc))
    except GitAccessError as exc:
        return Inspection(state="no_access", error=str(exc))
    except (JobCancelled, LostJobLease):
        raise
    except Exception as exc:  # noqa: BLE001 - one repository must not end the scan
        logger.warning("Scanning %s failed", candidate.get("full_name"), exc_info=True)
        return Inspection(state="error", error=str(exc) or type(exc).__name__)
    return Inspection(
        state="kicad" if found else "empty",
        head_sha=sha,
        default_branch=branch or "",
        branches=branches,
        projects=[
            {
                "name": project.name,
                "relative_path": project.relative_path,
                "project_key": project.project_key,
                "has_schematic": project.has_schematic,
                "has_pcb": project.has_pcb,
            }
            for project in found
        ],
    )


# --- The scan -----------------------------------------------------------------


def scan(
    connector_id: str,
    *,
    inspect: Inspector = inspect_repository,
    workers: int = SCAN_WORKERS,
    progress: Callable[[int, int], None] = lambda done, total: None,
    check_cancelled: Callable[[], None] = lambda: None,
) -> dict[str, int]:
    """Read every stored candidate of a connector; returns a count per state, plus ``unchanged``."""

    rows = candidate_rows(connector_id)
    counts: dict[str, int] = {"unchanged": 0}
    done = 0
    executor = ThreadPoolExecutor(max_workers=max(1, workers), thread_name_prefix="repo-scan")
    try:
        futures = {executor.submit(inspect, row, check_cancelled): row for row in rows}
        for future in as_completed(futures):
            check_cancelled()
            row = futures[future]
            result = future.result()
            if result is None:
                counts["unchanged"] += 1
            else:
                record_inspection(str(row["id"]), result)
                counts[result.state] = counts.get(result.state, 0) + 1
            done += 1
            progress(done, len(rows))
    finally:
        executor.shutdown(wait=False, cancel_futures=True)
    return counts


def run_scan_job(context: JobContext) -> JobResult:
    from app.services.trackers.connector_service import ConnectorService

    connector_id = str(context.payload["connector_id"])
    context.progress(stage="list-repositories", message="Listing repositories", percent=0, force=True)
    listed = ConnectorService().list_readable_repositories(connector_id)
    context.check_cancelled()
    sync_listing(connector_id, listed)

    def report(done: int, total: int) -> None:
        context.progress(
            stage="scan-repositories",
            message=f"Scanned {done} of {total} repositories",
            percent=100.0 * done / total if total else 100.0,
        )

    counts = scan(connector_id, progress=report, check_cancelled=context.check_cancelled)
    return JobResult(message="Scan complete", details={"listed": len(listed), "counts": counts})


def start_scan_job(connector_id: str, *, requested_by: str = "") -> str:
    """Queue a scan; a scan already running for the connector is returned instead."""

    queued = REPO_DISCOVERY_SCAN.enqueue(
        {"connector_id": connector_id},
        subject=JobSubject(lock_key=f"repo-discovery:{connector_id}"),
        artifact_key=hashlib.sha256(connector_id.encode("utf-8")).hexdigest(),
        requested_by=requested_by,
    )
    return str(queued["job_id"])


# --- What the list shows ------------------------------------------------------


def _imported_projects_by_remote() -> dict[str, set[str]]:
    """Canonical remote identity -> keys of the projects already imported from it."""

    policy = git_remote_access.remote_url_policy()
    imported: dict[str, set[str]] = {}
    for repository in workspace.get_repositories():
        try:
            dedup_key = parse_remote_url(str(repository.get("url") or ""), policy).dedup_key
        except Exception:  # noqa: BLE001 - a row predating URL validation is not a match
            continue
        keys = imported.setdefault(dedup_key, set())
        for row in workspace.get_projects_by_repo(str(repository["id"])):
            keys.add(
                make_project_key(
                    str(row.get("relative_path") or "."), str(row.get("project_file_rel") or "")
                )
            )
            # Projects registered before anchors existed are known by directory.
            keys.add(str(row.get("relative_path") or "."))
    return imported


def candidate_views(connector_id: str) -> list[dict[str, Any]]:
    """The connector's candidates with how much of each is already imported."""

    imported = _imported_projects_by_remote()
    views = []
    for row in candidate_rows(connector_id):
        projects = list(row["projects"] or [])
        known = imported.get(str(row["dedup_key"]))
        in_directory: dict[str, int] = {}
        for project in projects:
            in_directory[project["relative_path"]] = in_directory.get(project["relative_path"], 0) + 1
        def is_imported(project: dict[str, Any]) -> bool:
            return known is not None and (
                project["project_key"] in known
                or (in_directory[project["relative_path"]] == 1 and project["relative_path"] in known)
            )

        projects = [{**project, "imported": is_imported(project)} for project in projects]
        imported_count = sum(1 for project in projects if project["imported"])
        scanned_at = row.get("scanned_at")
        views.append(
            {
                "id": row["id"],
                "fullName": row["full_name"],
                "webUrl": row["web_url"],
                "cloneUrl": row["clone_url"],
                "defaultBranch": row["default_branch"],
                "archived": bool(row["archived"]),
                "sizeBytes": row["size_bytes"],
                "branches": list(row["branches"] or []),
                "state": row["state"],
                "projects": projects,
                "importedCount": imported_count,
                "repositoryImported": known is not None,
                "error": row["error"],
                "scannedAt": scanned_at.isoformat() if scanned_at else None,
            }
        )
    return views


# --- Reading a pasted web address by the host's own address ------------------------


def _stored_clone_url(connector_id: str, path: str) -> Optional[str]:
    with database.connection() as conn:
        row = conn.execute(
            f"SELECT clone_url FROM {TABLE} WHERE connector_id = %s AND lower(full_name) = lower(%s)",
            (connector_id, path),
        ).fetchone()
    return str(row["clone_url"]) if row and row["clone_url"] else None


def _live_clone_url(connector_id: str, path: str) -> Optional[str]:
    """Ask the host for its repositories, for an address that was never scanned. A failure is not an error here."""

    from app.services.trackers.connector_service import ConnectorService

    try:
        listed = ConnectorService().list_readable_repositories(connector_id)
    except Exception:  # noqa: BLE001 - not being able to look it up must not stop an import
        logger.warning("Could not list repositories to resolve %s", path, exc_info=True)
        return None
    for item in listed:
        if str(item.get("fullName") or "").casefold() == path.casefold():
            return choose_clone_url(item)
    return None


def preferred_clone_url(url: str) -> str:
    """The address to read a pasted repository address by.

    A web address (``http(s)://host/org/repo``) on a connected host is replaced
    by that host's own clone address for the repository, which is SSH when Prism
    has a key and trusts the host. Prism holds no password for a web address, so
    importing by it could only fail. Any other address, a host Prism has no
    connection to, or a repository the host does not list comes back unchanged.
    """

    try:
        parsed = parse_remote_url(url, git_remote_access.remote_url_policy())
    except RemoteUrlError:
        return url
    path = parsed.path.strip("/").removesuffix(".git")
    if parsed.scheme not in {"http", "https"} or path.count("/") < 1:
        return url

    from app.services.trackers.connector_service import ConnectorService

    try:
        sources = ConnectorService().discovery_sources()
    except Exception:  # noqa: BLE001 - the connection list is optional here
        logger.warning("Could not read the connected hosts to resolve %s", url, exc_info=True)
        return url
    for source in sources:
        if str(source["host"]).casefold() != parsed.host.casefold():
            continue
        found = _stored_clone_url(source["id"], path) or _live_clone_url(source["id"], path)
        if found:
            return found
    return url


REPO_DISCOVERY_SCAN = JobKind(
    "repo_discovery_scan",
    run_scan_job,
    resources={"prism_worker": 1, "import": 1},
    lock=subject_lock("write"),
    max_attempts=1,
)
JOB_KINDS = (REPO_DISCOVERY_SCAN,)
