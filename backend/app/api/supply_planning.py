"""Planning for readers of supply data: where open demand outruns what is held."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader
from app.services.supply import catalog_read, planning

router = APIRouter(prefix="/api/supply", tags=["supply"])


@router.get("/planning")
async def planning_view(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with supply_connectors.service.store.connection() as conn:
            try:
                return planning.compute(conn, catalog_read.own_stock)
            except Exception:  # noqa: BLE001 - an unreadable catalog must not hide the plan; our own stock is then unknown
                return planning.compute(conn, None)

    return await asyncio.to_thread(read)
