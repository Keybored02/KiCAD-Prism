"""Supply health for administrators: calls against budget, errors and late reads per connector."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_admin
from app.services.supply import community_export, health, worker_seen

router = APIRouter(prefix="/api/supply", tags=["supply"])


@router.get("/health")
async def supply_health(_admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with supply_connectors.service.store.connection() as conn:
            return {"connectors": health.connector_health(conn), "worker": worker_seen.status(conn)}

    return await asyncio.to_thread(read)


@router.get("/community-export")
async def community_export(_admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    """The facts with a public source this workspace could share: confirmed manufacturer spellings and lifecycles with their page. Sends nothing."""

    def read() -> dict[str, Any]:
        with supply_connectors.service.store.connection() as conn:
            return community_export.build(conn)

    return await asyncio.to_thread(read)
