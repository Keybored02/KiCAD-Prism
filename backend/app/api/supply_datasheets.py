"""A part's datasheet address: where a person opens the manufacturer's datasheet.

Prism keeps the address a distributor gives and downloads nothing.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader
from app.services.supply import parts

router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except parts.PartNotFound as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc


@router.get("/parts/{part_id}/datasheet")
async def get_datasheet(part_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            part = parts.get_part(conn, part_id)
            return {"url": conn.execute("SELECT datasheet_url FROM supply_parts WHERE id = %s", (part.id,)).fetchone()["datasheet_url"]}

    return await _run(read)
