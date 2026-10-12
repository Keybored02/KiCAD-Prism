"""Datasheet archive API: the versions kept for a part, the file, and the address a part's datasheet is read from.

Everyone who can read supply data sees the versions and downloads a file. Admin and designer set the address.
The file is served as an attachment with a sandboxing policy: it came from the internet.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_writer
from app.services.supply import datasheets, parts
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
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_datasheet", "message": str(exc)}) from exc


@router.get("/parts/{part_id}/datasheets")
async def list_datasheets(part_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            part = parts.get_part(conn, part_id)
            url = conn.execute("SELECT datasheet_url FROM parts WHERE id = %s", (part.id,)).fetchone()["datasheet_url"]
            checked = conn.execute("SELECT checked_at, status FROM datasheet_checks WHERE part_id = %s", (part.id,)).fetchone()
            return {
                "url": url,
                "checked_at": checked["checked_at"].isoformat() if checked else None,
                "status": checked["status"] if checked else None,
                "items": datasheets.list_versions(conn, part.id),
            }

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
            # A new address is tried on the next run, whatever happened to the old one.
            conn.execute("DELETE FROM datasheet_checks WHERE part_id = %s", (part.id,))
            write_audit(conn, writer.email, "datasheet.url", part.id, {"before": before, "after": url}, subject_kind="part")

    await _run(run)
    return Response(status_code=204)


@router.get("/datasheets/{datasheet_id}/file")
async def datasheet_file(datasheet_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> Response:
    def read() -> tuple[str, bytes] | None:
        with _store().connection() as conn:
            return datasheets.file_of(conn, datasheet_id)

    found = await _run(read)
    if found is None:
        raise HTTPException(status_code=404, detail="Not found")
    name, data = found
    return Response(
        content=data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{name}"',
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox",
        },
    )
