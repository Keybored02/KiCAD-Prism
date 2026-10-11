"""Alerts and the overview.

Everyone who reads supply data sees both. Acknowledging or snoozing an alert needs
write access (admin, designer). Alerts are in-app only; nothing is sent anywhere.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_writer
from app.services.supply import alerts, overview

router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


class SnoozeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hours: int = Field(ge=1, le=alerts.MAX_SNOOZE_HOURS)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except alerts.AlertNotFound as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
    except alerts.AlertError as exc:
        raise HTTPException(status_code=409, detail={"code": "alert_state", "message": str(exc)}) from exc


@router.get("/overview")
async def get_overview(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return overview.build_overview(conn)

    return await _run(read)


@router.get("/alerts")
async def list_alerts(
    include_resolved: bool = Query(default=False),
    _user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        with _store().connection() as conn:
            return {"items": alerts.list_alerts(conn, now, include_resolved=include_resolved)}

    return await _run(read)


@router.post("/alerts/{alert_id}/acknowledge", status_code=204)
async def acknowledge_alert(alert_id: int, writer: AuthenticatedUser = Depends(require_supply_writer)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            alerts.acknowledge(conn, alert_id, writer.email, datetime.now(timezone.utc))

    await _run(run)
    return Response(status_code=204)


@router.post("/alerts/{alert_id}/snooze", status_code=204)
async def snooze_alert(
    alert_id: int, body: SnoozeRequest, writer: AuthenticatedUser = Depends(require_supply_writer)
) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            alerts.snooze(conn, alert_id, body.hours, writer.email, datetime.now(timezone.utc))

    await _run(run)
    return Response(status_code=204)
