"""Market indices for readers of supply data: how the followed parts do as a group, by manufacturer."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader
from app.services.supply import market

router = APIRouter(prefix="/api/supply", tags=["supply"])


@router.get("/market")
async def market_overview(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with supply_connectors.service.store.connection() as conn:
            return market.overview(conn)

    return await asyncio.to_thread(read)
