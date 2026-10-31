"""Find the KiCad repositories on a connected Git host, then import them one at a time.

Importing stays the import dialog's job: this router only lists what a host has
and what a scan saw in it.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Optional, TypeVar

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict

from app.api.projects_models import JobStarted
from app.core import errors, policy
from app.core.security import AuthenticatedUser, require_designer
from app.services import repo_discovery_service as discovery
from app.services.trackers.connector_service import ConnectorNotFound, ConnectorService
from app.services.trackers.errors import ProviderError

router = APIRouter(
    prefix="/api/repo-discovery",
    tags=["repo-discovery"],
    dependencies=[Depends(require_designer)],
)
service = ConnectorService()

T = TypeVar("T")

# States only an administrator sees: they describe Prism's own access, which a
# designer cannot fix.
ADMIN_ONLY_STATES = frozenset({"no_access", "blocked", "error"})


class DiscoverySource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    provider: str
    displayName: str
    host: str


class DiscoveredProjectView(BaseModel):
    model_config = ConfigDict(extra="allow")

    name: str
    relative_path: str
    project_key: str
    has_schematic: bool
    has_pcb: bool
    imported: bool


class DiscoveredRepository(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    fullName: str
    webUrl: str
    cloneUrl: str
    defaultBranch: str
    archived: bool
    sizeBytes: Optional[int]
    branches: list[str]
    state: str
    projects: list[DiscoveredProjectView]
    importedCount: int
    repositoryImported: bool
    error: str
    scannedAt: Optional[str]


class DiscoveredRepositoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    candidates: list[DiscoveredRepository]
    # Repositories left out because only an administrator sees them.
    hiddenCount: int


def _refusal(exc: Exception) -> errors.DomainError:
    if isinstance(exc, ConnectorNotFound):
        return errors.NotFound("Host connection not found", code="connector_not_found")
    if isinstance(exc, ProviderError):
        status = 403 if exc.class_ in {"forbidden", "capability_missing"} else 400
        return exc.refusal(409 if exc.class_ == "auth_lost" else status)
    raise exc


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        raise _refusal(exc) from exc


def _require_source(connector_id: str) -> None:
    if connector_id not in {source["id"] for source in service.discovery_sources()}:
        raise errors.NotFound("This host cannot be scanned for repositories", code="not_a_source")


@router.get("/sources", response_model=list[DiscoverySource], summary="Connected hosts repositories can be discovered on")
async def list_discovery_sources() -> list[dict[str, Any]]:
    return await _run(service.discovery_sources)


@router.post(
    "/sources/{connector_id}/scan",
    response_model=JobStarted,
    summary="Scan a connected host for KiCad repositories",
)
async def scan_discovery_source(connector_id: str, user: AuthenticatedUser = Depends(require_designer)) -> dict[str, str]:
    """List the host's repositories and read each one's default branch. Runs as a job."""

    def start() -> dict[str, str]:
        _require_source(connector_id)
        job_id = discovery.start_scan_job(connector_id, requested_by=user.email)
        return {"job_id": job_id, "status": "started"}

    return await _run(start)


@router.get(
    "/sources/{connector_id}/candidates",
    response_model=DiscoveredRepositoryList,
    summary="The repositories a scan found on a host",
)
async def list_discovered_repositories(connector_id: str, user: AuthenticatedUser = Depends(require_designer)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        _require_source(connector_id)
        views = discovery.candidate_views(connector_id)
        if policy.allows(user, "admin"):
            return {"candidates": views, "hiddenCount": 0}
        shown = [view for view in views if view["state"] not in ADMIN_ONLY_STATES]
        return {
            "candidates": [{**view, "error": ""} for view in shown],
            "hiddenCount": len(views) - len(shown),
        }

    return await _run(read)
