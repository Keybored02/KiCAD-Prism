"""Component watch API: watching a catalog component's own part.

Everyone who can read supply data sees a component's watch; setting or stopping one needs write access.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Literal, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_writer
from app.services.supply import catalog_read, component_watches

router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail={"code": "component_watch_error", "message": str(exc)})
    raise exc


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        raise _http_error(exc) from exc


class ComponentWatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    packaging: Literal["any", "cut_tape", "custom_reel", "tape_reel", "tray", "tube", "bulk"] = "any"


@router.get("/components/{component_id}/watch")
async def get_component_watch(component_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return {"watch": component_watches.get(conn, component_id)}

    return await _run(read)


@router.put("/components/{component_id}/watch")
async def set_component_watch(
    component_id: str, body: ComponentWatchRequest, writer: AuthenticatedUser = Depends(require_supply_writer)
) -> dict[str, Any]:
    """Watch a component's part. Setting it again changes the options."""

    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return {"watch": component_watches.set_watch(
                conn, component_id, writer.email, catalog_read.identities, packaging=body.packaging,
            )}

    return await _run(run)


@router.delete("/components/{component_id}/watch", status_code=204)
async def remove_component_watch(component_id: str, writer: AuthenticatedUser = Depends(require_supply_writer)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            component_watches.remove_watch(conn, component_id, writer.email)

    await _run(run)
    return Response(status_code=204)
