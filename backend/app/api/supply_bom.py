"""Looking a bill of materials up in the supply data, and watching its parts.

Readers (admin, designer, qa) look lines up; nothing here calls a distributor. Watching the
parts on a BOM needs write access (admin, designer). Only admin and qa can name a manufacturer
Prism does not know yet, so a designer's lines with an unknown manufacturer are skipped and
reported, not created.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.roles import SUPPLY_APPROVE_ROLES
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_writer
from app.services.supply import bom_lookup, usage

router = APIRouter(prefix="/api/supply/bom", tags=["supply"])

T = TypeVar("T")


class LineIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(min_length=1, max_length=200)
    manufacturer: str = Field(default="", max_length=200)
    mpn: str = Field(default="", max_length=200)
    # Fitted parts per board. A line with none fitted is not sent.
    quantity: int = Field(default=1, ge=1, le=100_000)


class LookupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    build_quantity: int = Field(default=1, ge=1, le=1_000_000)
    # Spares on top of what the boards use, as a percentage of the quantity.
    attrition_percent: float = Field(default=0, ge=0, le=100)
    lines: list[LineIn] = Field(max_length=bom_lookup.MAX_LINES)


class WatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lines: list[LineIn] = Field(max_length=bom_lookup.MAX_WATCH_LINES)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_request", "message": str(exc)}) from exc


def _lines(items: list[LineIn]) -> list[bom_lookup.BomLine]:
    return [bom_lookup.BomLine(item.key, item.manufacturer, item.mpn, item.quantity) for item in items]


@router.post("/usage/refresh")
async def refresh_usage(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, int]:
    """Read where parts are used from the projects' existing semantic indexes. Builds none, so it is cheap."""

    def run() -> dict[str, int]:
        # Imported here so the supply API loads without the project services in tests that do not need them.
        from app.services import project_service, semantic_index_service
        from app.services.workspace_service import workspace

        # Every project, whatever its folder allows: usage is a cache, and reads filter by the caller's role.
        rows = workspace.get_all_projects(None)
        projects = [project_service._workspace_row_to_project(row) for row in rows]
        visible = {
            row["id"]: [role for role in usage.ALL_ROLES if workspace._is_folder_visible(row, role)]
            for row in rows
        }
        with _store().connection() as conn:
            return usage.refresh(conn, projects, semantic_index_service.get_existing, datetime.now(timezone.utc), visible)

    return await _run(run)


# One request queues at most this many projects, so a large workspace is read over a few clicks, not all at once.
MAX_BUILDS_PER_REQUEST = 25


@router.post("/usage/build")
async def build_usage(writer: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, int]:
    """Queue the semantic index of projects that have none, so their BOMs can be read.

    Each is an ordinary index job: the worker does them one at a time, and one already queued or
    running is not queued again. Reading usage afterwards picks the finished ones up.
    """

    def run() -> dict[str, int]:
        from app.services import project_service, semantic_index_service
        from app.services.workspace_service import workspace

        rows = workspace.get_all_projects(None)
        missing = []
        for row in rows:
            if semantic_index_service.get_existing(project_service._workspace_row_to_project(row)) is None:
                missing.append(str(row["id"]))
        queued = 0
        for project_id in missing[:MAX_BUILDS_PER_REQUEST]:
            project_service.start_semantic_index_job(project_id, requested_by=writer.email)
            queued += 1
        return {"projects": len(rows), "missing": len(missing), "queued": queued}

    return await _run(run)


@router.post("/lookup")
async def lookup(body: LookupRequest, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return bom_lookup.lookup(conn, _lines(body.lines), body.build_quantity, body.attrition_percent)

    return await _run(read)


@router.post("/watch")
async def watch(body: WatchRequest, writer: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return bom_lookup.watch_lines(
                conn, _lines(body.lines), writer.email, may_create_manufacturer=writer.role in SUPPLY_APPROVE_ROLES
            )

    return await _run(run)
