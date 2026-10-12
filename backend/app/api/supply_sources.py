"""Approved parts list (AVL) API.

Everyone who can read supply data sees a component's list. Proposing a part needs write or
approval access (admin, designer, qa); approving, rejecting and ranking follow catalog QA (admin, qa).
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.roles import SUPPLY_APPROVE_ROLES
from app.api.supply_access import require_supply_editor
from app.core.security import AuthenticatedUser, require_supply_approver, require_supply_reader
from app.services.supply import catalog_read, parts, sources
from app.services.supply.assessment import component_checks, settings_store

router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


class AddSourceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    manufacturer: str = Field(min_length=1, max_length=120)
    mpn: str = Field(min_length=1, max_length=100)


class RankRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rank: int = Field(ge=1, le=sources.MAX_PER_COMPONENT)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, sources.SourceNotFound):
        return HTTPException(status_code=404, detail="Not found")
    if isinstance(exc, parts.UnknownManufacturer):
        return HTTPException(status_code=400, detail={"code": "unknown_manufacturer", "message": str(exc)})
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail={"code": "source_error", "message": str(exc)})
    raise exc


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        raise _http_error(exc) from exc


@router.get("/components/{component_id}/sources")
async def list_sources(component_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return {"items": sources.list_sources(conn, component_id)}

    return await _run(read)


@router.get("/components/{component_id}/assessment")
async def component_assessment(component_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """What is wrong with a component taken with its approved alternates. Empty when nothing is."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            maker, mpn = catalog_read.identities([component_id]).get(component_id, ("", ""))
            primary = parts.find_part(conn, maker, mpn) if maker and mpn else None
            found = component_checks.for_component(conn, component_id, primary.id if primary else None, settings_store.load(conn))
            return {"findings": [{"check": f.check, "severity": f.severity.value, "text": f.text, "scope": f.scope} for f in found]}

    return await _run(read)


@router.post("/components/{component_id}/sources", status_code=201)
async def add_source(
    component_id: str, body: AddSourceRequest, writer: AuthenticatedUser = Depends(require_supply_editor)
) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return sources.add_source(
                conn, component_id, body.manufacturer, body.mpn, writer.email,
                approver=writer.role in SUPPLY_APPROVE_ROLES,
            )

    return await _run(run)


@router.post("/sources/{source_id}/approve", status_code=204)
async def approve_source(source_id: str, approver: AuthenticatedUser = Depends(require_supply_approver)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            sources.decide(conn, source_id, approver.email, approve=True)

    await _run(run)
    return Response(status_code=204)


@router.post("/sources/{source_id}/reject", status_code=204)
async def reject_source(source_id: str, approver: AuthenticatedUser = Depends(require_supply_approver)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            sources.decide(conn, source_id, approver.email, approve=False)

    await _run(run)
    return Response(status_code=204)


@router.patch("/sources/{source_id}", status_code=204)
async def rank_source(
    source_id: str, body: RankRequest, approver: AuthenticatedUser = Depends(require_supply_approver)
) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            sources.set_rank(conn, source_id, body.rank, approver.email)

    await _run(run)
    return Response(status_code=204)


@router.delete("/sources/{source_id}", status_code=204)
async def remove_source(source_id: str, writer: AuthenticatedUser = Depends(require_supply_editor)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            sources.remove(conn, source_id, writer.email, approver=writer.role in SUPPLY_APPROVE_ROLES)

    await _run(run)
    return Response(status_code=204)
