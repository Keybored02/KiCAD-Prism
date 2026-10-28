"""Local inventory sources API: InvenTree-compatible servers whose stock fills the catalog (decision D15).

Administrators add, change, check, read and remove sources. Everyone who reads supply data sees which parts a source
could not match; linking them is Review's (S5).
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Callable, Literal, Optional, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_admin, require_supply_reader
from app.services.supply.inventory import sources, sync
from app.services.supply.inventory.inventree import InvenTreeClient
from app.services.supply.providers.base import ProviderError
from app.services.trackers.secrets import SecretStoreLocked

router = APIRouter(prefix="/api/supply/inventory-sources", tags=["supply"])

T = TypeVar("T")


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store and keyring.
    return supply_connectors.service.store


def _keyring():
    return supply_connectors.service.keyring()


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except sources.SourceNotFound as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
    except SecretStoreLocked as exc:
        raise HTTPException(status_code=503, detail={"code": "keyring_locked", "message": "The credential keyring is locked."}) from exc
    except sources.SourceError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_source", "message": str(exc)}) from exc
    except ProviderError as exc:
        raise HTTPException(status_code=502, detail={"code": exc.code, "message": str(exc)}) from exc


class InventorySource(BaseModel):
    id: str
    kind: Literal["inventree"]
    display_name: str
    base_url: str
    category_id: Optional[int]
    enabled: bool
    interval_hours: int
    has_token: bool
    server: str
    api_version: Optional[int]
    last_sync_at: Optional[str]
    last_status: str
    last_error: str
    matched: int
    unmatched: int


class CreateSourceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str = Field(min_length=1, max_length=sources.MAX_NAME)
    base_url: str = Field(min_length=1, max_length=500)
    token: str = Field(default="", max_length=500)
    category_id: Optional[int] = None
    interval_hours: int = Field(default=24, ge=1, le=168)


class UpdateSourceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: Optional[str] = Field(default=None, min_length=1, max_length=sources.MAX_NAME)
    base_url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    # An empty string removes the token.
    token: Optional[str] = Field(default=None, max_length=500)
    category_id: Optional[int] = None
    interval_hours: Optional[int] = Field(default=None, ge=1, le=168)
    enabled: Optional[bool] = None


class ServerCategory(BaseModel):
    pk: int
    name: str
    pathstring: str
    parent: Optional[int]


class ServerCheck(BaseModel):
    server: str
    api_version: int
    instance: str
    categories: list[ServerCategory]


class SyncResult(BaseModel):
    status: Literal["ok", "error"]
    error: str = ""
    matched: int = 0
    unmatched: int = 0
    records: int = 0


class UnmatchedPart(BaseModel):
    remote_part: str
    ipn: str
    mpn: str
    manufacturer: str
    name: str
    quantity: float
    records: int
    reason: Literal["no_component", "sap_code_shared", "mpn_shared"]
    seen_at: datetime


@router.get("")
async def list_inventory_sources(_user: AuthenticatedUser = Depends(require_supply_reader)) -> list[InventorySource]:
    def read() -> list[InventorySource]:
        with _store().connection() as conn:
            return [InventorySource(**sources.dto(row)) for row in sources.list_sources(conn)]

    return await _run(read)


@router.post("", status_code=201)
async def create_inventory_source(body: CreateSourceRequest, admin: AuthenticatedUser = Depends(require_admin)) -> InventorySource:
    def run() -> InventorySource:
        with _store().connection() as conn:
            row = sources.create(
                conn, _keyring(), admin.email, display_name=body.display_name, url=body.base_url, token=body.token,
                category_id=body.category_id, interval_hours=body.interval_hours,
            )
            return InventorySource(**sources.dto(row))

    return await _run(run)


@router.patch("/{source_id}")
async def update_inventory_source(source_id: str, body: UpdateSourceRequest, admin: AuthenticatedUser = Depends(require_admin)) -> InventorySource:
    changes = {("url" if key == "base_url" else key): value for key, value in body.model_dump(exclude_unset=True).items()}

    def run() -> InventorySource:
        with _store().connection() as conn:
            return InventorySource(**sources.dto(sources.update(conn, _keyring(), source_id, admin.email, **changes)))

    return await _run(run)


@router.delete("/{source_id}", status_code=204)
async def delete_inventory_source(source_id: str, admin: AuthenticatedUser = Depends(require_admin)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            sources.delete(conn, source_id, admin.email)

    await _run(run)
    return Response(status_code=204)


@router.post("/{source_id}/check")
async def check_inventory_source(source_id: str, _admin: AuthenticatedUser = Depends(require_admin)) -> ServerCheck:
    """Ask the server who it is and which categories it has, with the stored token. Changes nothing."""

    def run() -> ServerCheck:
        with _store().connection() as conn:
            row = sources.get(conn, source_id)
        client = InvenTreeClient(row["base_url"], sources.token_of(_keyring(), row))
        try:
            info = client.server()
            categories = [ServerCategory(pk=c.pk, name=c.name, pathstring=c.pathstring, parent=c.parent) for c in client.categories()]
        finally:
            client.close()
        return ServerCheck(server=info.server, api_version=info.api_version, instance=info.instance, categories=categories)

    return await _run(run)


@router.post("/{source_id}/sync")
async def sync_inventory_source(source_id: str, _admin: AuthenticatedUser = Depends(require_admin)) -> SyncResult:
    """Read the source now. A failed read keeps the stock it had, marked stale."""

    return await _run(lambda: SyncResult(**sync.sync(_store(), _keyring(), source_id)))


@router.get("/{source_id}/unmatched")
async def list_unmatched_parts(source_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> list[UnmatchedPart]:
    def read() -> list[UnmatchedPart]:
        with _store().connection() as conn:
            sources.get(conn, source_id)
            return [UnmatchedPart(**row) for row in sync.unmatched(conn, source_id)]

    return await _run(read)
