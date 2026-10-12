"""Seed supply listings from the catalog's vendor fields. Needs write access (admin, designer)."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_writer
from app.services.supply import seeding

router = APIRouter(prefix="/api/supply/seed", tags=["supply"])

PAGE_SIZE = 500


def _catalog_components():
    from app.services.component_catalog_service import catalog_service

    page = 1
    while True:
        result = catalog_service.list_components(query="", page=page, page_size=PAGE_SIZE, include_inactive=False)
        yield from result["items"]
        if page >= int(result.get("pages") or 1):
            return
        page += 1


@router.post("/catalog")
async def seed_from_catalog(writer: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, Any]:
    def run() -> dict[str, int]:
        service = supply_connectors.service
        connectors = service.list()
        components = list(_catalog_components())
        with service.store.connection() as conn:
            return seeding.seed(conn, components, connectors, writer.email)

    return await asyncio.to_thread(run)
