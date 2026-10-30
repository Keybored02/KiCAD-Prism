"""Product change notices API: entered by people, read by everyone who reads supply data.

Admin and designer enter notices. Every part a notice names must be in the Component Database (decision D12).
"""

from __future__ import annotations

from datetime import date
from functools import partial
from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.api.supply_access import is_approver
from app.api.supply_call import run_supply
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_tracker, require_supply_writer
from app.services.supply import component_parts, details, parts, pcn, substitutes

router = APIRouter(prefix="/api/supply", tags=["supply"])
_run = partial(run_supply, invalid="invalid_notice")


class NoticePart(BaseModel):
    model_config = ConfigDict(extra="forbid")

    manufacturer: str = Field(min_length=1, max_length=120)
    mpn: str = Field(min_length=1, max_length=100)


class NoticeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=pcn.MAX_TITLE)
    kind: str
    parts: list[NoticePart] = Field(min_length=1, max_length=pcn.MAX_PARTS)
    notice_url: str = Field(default="", max_length=500)
    last_time_buy: Optional[date] = None
    last_time_ship: Optional[date] = None
    notes: str = Field(default="", max_length=pcn.MAX_NOTES)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


@router.get("/parts/{part_id}/notices")
async def part_notices(part_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            parts.get_part(conn, part_id)
            return {"items": pcn.for_part(conn, part_id, include_closed=True)}

    return await _run(read)


@router.post("/parts/{part_id}/check-notices")
async def check_notices(part_id: str, writer: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, Any]:
    """Read this part's change notices from the distributors that list them, now. Once an hour per person and part."""

    return await run_supply(lambda: details.check_now(supply_connectors.service, part_id, writer.email), invalid="invalid_notice")


@router.post("/parts/{part_id}/ask-substitutes")
async def ask_substitutes(part_id: str, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    """Ask the distributors that can (DigiKey) for parts they offer in place of this one, now. Once an hour per part."""

    return await run_supply(lambda: substitutes.ask_now(supply_connectors.service, part_id, user.email), invalid="invalid_notice")


@router.post("/notices", status_code=201)
async def add_notice(body: NoticeIn, writer: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        approver = is_approver(writer)
        with _store().connection() as conn:
            ids = [component_parts.library_part(conn, item.manufacturer, item.mpn, writer.email, may_create=approver).id for item in body.parts]
            return pcn.add(
                conn, body.title, body.kind, ids, writer.email,
                notice_url=body.notice_url, last_time_buy=body.last_time_buy, last_time_ship=body.last_time_ship, notes=body.notes,
            )

    return await _run(run)
