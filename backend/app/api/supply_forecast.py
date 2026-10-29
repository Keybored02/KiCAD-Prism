"""Forecasts: a part's, the Insights section and the track record.

Everyone who can read supply data may look. Nothing is saved by asking, and no distributor is called: the quantity is a question.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader
from app.services.supply import parts
from app.services.supply.forecast import store, views

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


@router.get("/parts/{part_id}/forecast")
async def part_forecast(
    part_id: str, quantity: int | None = Query(default=None, ge=1, le=1_000_000), _user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            parts.get_part(conn, part_id)
            return views.part(conn, part_id, quantity=quantity)

    return await _run(read)


@router.get("/forecasts/insights")
async def forecasts_insights(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return views.insights_page(conn)

    return await _run(read)


@router.get("/forecasts/track-record")
async def track_record(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return store.track_record(conn)

    return await _run(read)
