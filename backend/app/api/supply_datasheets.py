"""A part's datasheet address: where a person opens the manufacturer's datasheet.

Prism keeps the address a distributor gives, or one a designer or administrator sets, and downloads nothing.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_writer
from app.services.supply import parts
from app.services.supply.audit import write_audit

router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


class DatasheetAddress(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Empty clears it.
    url: str = Field(default="", max_length=500)


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
            return {"url": conn.execute("SELECT datasheet_url FROM parts WHERE id = %s", (part.id,)).fetchone()["datasheet_url"]}

    return await _run(read)


@router.put("/parts/{part_id}/datasheet-url", status_code=204)
async def set_datasheet_url(
    part_id: str, body: DatasheetAddress, writer: AuthenticatedUser = Depends(require_supply_writer)
) -> Response:
    url = body.url.strip()
    if url and not url.lower().startswith("https://"):
        raise HTTPException(status_code=400, detail={"code": "invalid_datasheet", "message": "The datasheet address must start with https://."})

    def run() -> None:
        with _store().connection() as conn:
            part = parts.get_part(conn, part_id)
            before = conn.execute("SELECT datasheet_url FROM parts WHERE id = %s", (part.id,)).fetchone()["datasheet_url"]
            conn.execute("UPDATE parts SET datasheet_url = %s WHERE id = %s", (url, part.id))
            write_audit(conn, writer.email, "datasheet.url", part.id, {"before": before, "after": url}, subject_kind="part")

    await _run(run)
    return Response(status_code=204)
