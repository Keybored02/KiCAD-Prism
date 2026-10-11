"""Supply review API: the decisions matching leaves to people.

Everyone who can read supply data sees the queue. Confirming a manufacturer
spelling and pinning or rejecting a listing follow catalog QA (admin, qa).
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Optional, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_approver, require_supply_reader
from app.services.supply import discovery, parts, review

router = APIRouter(prefix="/api/supply/review", tags=["supply"])

T = TypeVar("T")


class ConfirmAliasRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    alias_key: str = Field(min_length=1, max_length=200)
    # Map to a manufacturer that exists, or name one to create. Exactly one.
    manufacturer_id: Optional[str] = Field(default=None, max_length=64)
    new_manufacturer_name: Optional[str] = Field(default=None, min_length=1, max_length=120)

    @model_validator(mode="after")
    def exactly_one_target(self) -> "ConfirmAliasRequest":
        if (self.manufacturer_id is None) == (self.new_manufacturer_name is None):
            raise ValueError("give manufacturer_id or new_manufacturer_name, not both")
        return self


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, (discovery.ListingNotFound, parts.PartNotFound)):
        return HTTPException(status_code=404, detail="Not found")
    if isinstance(exc, parts.AliasError):
        return HTTPException(status_code=400, detail={"code": "alias_error", "message": str(exc)})
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail={"code": "invalid_request", "message": str(exc)})
    raise exc


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        raise _http_error(exc) from exc


@router.get("")
async def get_review_queue(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return review.review_queue(conn)

    return await _run(read)


@router.post("/aliases/confirm")
async def confirm_alias(
    body: ConfirmAliasRequest, approver: AuthenticatedUser = Depends(require_supply_approver)
) -> dict[str, int]:
    def run() -> dict[str, int]:
        with _store().connection() as conn:
            manufacturer_id = body.manufacturer_id or parts.ensure_manufacturer(
                conn, body.new_manufacturer_name or "", approver.email
            )
            moved = parts.confirm_alias(conn, body.alias_key, manufacturer_id, approver.email)
        return {"listings_updated": moved}

    return await _run(run)


@router.post("/listings/{listing_id}/pin", status_code=204)
async def pin_listing(listing_id: str, approver: AuthenticatedUser = Depends(require_supply_approver)) -> None:
    """Confirm the listing is the part it is a candidate for."""

    def run() -> None:
        with _store().connection() as conn:
            row = conn.execute("SELECT part_id FROM listings WHERE id = %s", (listing_id,)).fetchone()
            if row is None:
                raise discovery.ListingNotFound(listing_id)
            if row["part_id"] is None:
                raise ValueError("This listing has no candidate part to confirm.")
            discovery.pin_listing(conn, listing_id, row["part_id"], approver.email)

    await _run(run)


@router.post("/listings/{listing_id}/reject", status_code=204)
async def reject_listing(listing_id: str, approver: AuthenticatedUser = Depends(require_supply_approver)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            discovery.reject_listing(conn, listing_id, approver.email)

    await _run(run)
