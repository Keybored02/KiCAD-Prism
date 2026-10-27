"""Check once: read a BOM or a component at the distributors without tracking it, and follow the progress."""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Literal, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_tracker
from app.services.supply import oneoff

router = APIRouter(prefix="/api/supply/checks", tags=["supply"])

T = TypeVar("T")


class LineIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    manufacturer: str = Field(default="", max_length=200)
    mpn: str = Field(default="", max_length=200)


class CheckIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["bom", "component"]
    project_id: str = Field(default="", max_length=120)
    lines: list[LineIn] = Field(max_length=oneoff.MAX_PARTS * 2)


def _store():
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except oneoff.RequestError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_check", "message": str(exc)}) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc


@router.post("", status_code=201)
async def start(body: CheckIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            made = oneoff.request(conn, body.kind, [(line.manufacturer, line.mpn) for line in body.lines], user.email, project_id=body.project_id)
            return {**made, "progress": oneoff.progress(conn, made["id"])}

    return await _run(run)


@router.get("/{request_id}")
async def progress(request_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return oneoff.progress(conn, request_id)

    return await _run(read)
