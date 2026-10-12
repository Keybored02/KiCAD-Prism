"""Demand API: how many of a part are needed, and by when.

Everyone who can read supply data sees a part's demand and the net requirement. Admin and designer add and
close manual demands. Our own stock comes from the catalog and is only read.
"""

from __future__ import annotations

import asyncio
from datetime import date
from typing import Any, Callable, Optional, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_writer
from app.services.supply import catalog_read, demand, parts

router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


class AddDemandRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Negative for stock that is already on its way in.
    quantity: int = Field(ge=-demand.MAX_QUANTITY, le=demand.MAX_QUANTITY)
    need_by: Optional[date] = None
    committed: bool = False
    note: str = Field(default="", max_length=demand.MAX_NOTE)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, (demand.DemandNotFound, parts.PartNotFound)):
        return HTTPException(status_code=404, detail="Not found")
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail={"code": "invalid_demand", "message": str(exc)})
    raise exc


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        raise _http_error(exc) from exc


def own_stock_of(part: parts.PartRecord) -> int | None:
    """Our on-hand quantity of the part, from the catalog component that has it. None when unknown."""

    try:
        found = catalog_read.own_stock([(part.manufacturer_name, part.mpn)])
    except Exception:  # noqa: BLE001 - the catalog being unreadable must not hide the demand
        return None
    return next(iter(found.values()), None)


@router.get("/parts/{part_id}/demands")
async def list_demands(part_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            part = parts.get_part(conn, part_id)
            return {"items": demand.list_for_part(conn, part_id), "summary": demand.summary(conn, part_id, own_stock_of(part))}

    return await _run(read)


@router.post("/parts/{part_id}/demands", status_code=201)
async def add_demand(
    part_id: str, body: AddDemandRequest, writer: AuthenticatedUser = Depends(require_supply_writer)
) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return demand.add_manual(
                conn, part_id, body.quantity, writer.email, need_by=body.need_by, committed=body.committed, note=body.note
            )

    return await _run(run)


@router.post("/demands/{demand_id}/close", status_code=204)
async def close_demand(demand_id: str, writer: AuthenticatedUser = Depends(require_supply_writer)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            demand.close(conn, demand_id, writer.email)

    await _run(run)
    return Response(status_code=204)
