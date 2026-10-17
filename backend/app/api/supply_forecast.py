"""Forecasts: a part's, a project's, the Insights section and the track record.

Everyone who can read supply data may look. Nothing is saved by asking, and no distributor is called: the quantity and board count
are questions. A project the caller cannot open is not found.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api import supply_connectors
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_supply_reader
from app.services.supply import forecast_overview, forecast_project, forecast_view, forecasting, parts

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
            return forecast_view.part(conn, part_id, quantity=quantity)

    return await _run(read)


@router.get("/projects/{project_id}/forecast")
async def project_forecast(
    project_id: str,
    boards: int = Query(default=100, ge=1, le=1_000_000),
    variant: str = Query(default="", max_length=120),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            found = forecast_project.forecast(conn, project_id, variant, boards)
            states = forecasting.model_states(conn)
            return found | {"models": {name: {"state": item["state"], "checks": item["checks"], "needs": item["needs"]} for name, item in states.items()}}

    return await _run(read)


@router.get("/forecasts/insights")
async def forecasts_insights(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return forecast_overview.insights_page(conn)

    return await _run(read)


@router.get("/forecasts/track-record")
async def track_record(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return forecasting.track_record(conn)

    return await _run(read)
