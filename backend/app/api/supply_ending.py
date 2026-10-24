"""Ending parts in the library: the components whose part is ending, and the decision about each.

Everyone who reads supply data sees the list. Marking a component "not for new designs", or recording that it was retired, is for QA
and administrators. Retiring itself is the catalog's own archive transition; this records that it happened.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Literal, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_approver, require_supply_reader
from app.services.supply import ending_parts

router = APIRouter(prefix="/api/supply/ending", tags=["supply"])

T = TypeVar("T")


class RestrictionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    level: Literal["not_for_new_designs", "retired"]
    reason: str = Field(default="", max_length=ending_parts.MAX_REASON)
    # The component that takes its place, when there is one.
    replacement_component_id: str = Field(default="", max_length=100)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_restriction", "message": str(exc)}) from exc


@router.get("")
async def list_ending(user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return ending_parts.queue(conn, user.role)

    return await _run(read)


@router.put("/{component_id}/restriction")
async def set_restriction(component_id: str, body: RestrictionIn, user: AuthenticatedUser = Depends(require_supply_approver)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return ending_parts.set_restriction(conn, component_id, body.level, body.reason, body.replacement_component_id, user.email)

    return await _run(run)


@router.delete("/{component_id}/restriction", status_code=204)
async def clear_restriction(component_id: str, user: AuthenticatedUser = Depends(require_supply_approver)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            ending_parts.clear_restriction(conn, component_id, user.email)

    await _run(run)
    return Response(status_code=204)
