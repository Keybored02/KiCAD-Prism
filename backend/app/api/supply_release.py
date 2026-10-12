"""Supply check on a project's BOM before release, and the snapshot frozen at publish.

Everyone who can read supply data may look. Projects follow the caller's role: a project the caller
cannot open is not found. The check reads existing semantic indexes and calls no distributor.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Optional, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api import supply_connectors
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_supply_reader
from app.services import semantic_index_service
from app.services.supply import release_check

router = APIRouter(prefix="/api/supply/projects", tags=["supply"])

T = TypeVar("T")


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except release_check.SnapshotNotFound as exc:
        raise HTTPException(status_code=404, detail="No supply snapshot for this build") from exc


@router.get("/{project_id}/release-check")
async def release_check_for(
    project_id: str,
    commit: Optional[str] = Query(default=None, max_length=64),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    project = get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        index = semantic_index_service.get_existing(project, commit or None)
        if not index:
            return {"available": False, "reason": "This revision's BOM has not been read yet. Open its BOM once to read it."}
        with _store().connection() as conn:
            return {"available": True, **release_check.check(conn, index.get("components") or [])}

    return await _run(read)


@router.get("/{project_id}/releases/{build_id}/supply")
async def release_snapshot(
    project_id: str, build_id: str, user: AuthenticatedUser = Depends(require_supply_reader)
) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return release_check.get_snapshot(conn, project_id, build_id)

    return await _run(read)
