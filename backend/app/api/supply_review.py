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
from app.core.security import AuthenticatedUser, require_supply_approver, require_supply_reader, require_supply_tracker
from app.services.supply import discovery, parts, review, settle

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


class ChoiceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(min_length=1, max_length=200)


@router.post("/choices/{part_id}/choose")
async def choose_maker(part_id: str, body: ChoiceRequest, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, str]:
    """Say which maker a part is (or, for a part with a known maker, that the listed maker is the same)."""

    def run() -> dict[str, str]:
        with _store().connection() as conn:
            return {"result": settle.choose(conn, part_id, body.key, user.email)}

    return await _run(run)


class NumbersRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    keys: list[str] = Field(min_length=1, max_length=50)


@router.post("/choices/{part_id}/numbers")
async def use_numbers(part_id: str, body: NumbersRequest, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, int]:
    """Say the part is also sold as these numbers."""

    def run() -> dict[str, int]:
        with _store().connection() as conn:
            return {"counted": settle.use_numbers(conn, part_id, body.keys, user.email)}

    return await _run(run)


@router.post("/choices/{part_id}/other")
async def other_maker(part_id: str, body: ChoiceRequest, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, int]:
    """Say the listings of one maker are not this part."""

    def run() -> dict[str, int]:
        with _store().connection() as conn:
            return {"rejected": settle.not_this_maker(conn, part_id, body.key, user.email)}

    return await _run(run)


@router.post("/parts/{part_id}/undo")
async def undo_settled(part_id: str, approver: AuthenticatedUser = Depends(require_supply_approver)) -> dict[str, bool]:
    """Take back the maker Prism settled for a part: it is asked about again."""

    def run() -> dict[str, bool]:
        with _store().connection() as conn:
            return {"undone": settle.undo_settled(conn, part_id, approver.email)}

    return await _run(run)


@router.post("/aliases/{alias_key}/undo")
async def undo_alias(alias_key: str, approver: AuthenticatedUser = Depends(require_supply_approver)) -> dict[str, int]:
    def run() -> dict[str, int]:
        with _store().connection() as conn:
            return {"listings": settle.undo_alias(conn, alias_key, approver.email)}

    return await _run(run)


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


class PinRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # The listing is numbered otherwise than the part: also say the part is sold under that number.
    add_number: bool = False


@router.post("/listings/{listing_id}/pin", status_code=204)
async def pin_listing(listing_id: str, body: Optional[PinRequest] = None, approver: AuthenticatedUser = Depends(require_supply_approver)) -> None:
    """Confirm the listing is the part it is a candidate for."""

    def run() -> None:
        with _store().connection() as conn:
            row = conn.execute("SELECT part_id, raw_mpn FROM supply_listings WHERE id = %s", (listing_id,)).fetchone()
            if row is None:
                raise discovery.ListingNotFound(listing_id)
            if row["part_id"] is None:
                raise ValueError("This listing has no candidate part to confirm.")
            discovery.pin_listing(conn, listing_id, row["part_id"], approver.email)
            if body is not None and body.add_number and row["raw_mpn"]:
                parts.add_number(conn, row["part_id"], row["raw_mpn"], approver.email, "person")

    await _run(run)


class RejectManyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    listing_ids: list[str] = Field(min_length=1, max_length=500)


@router.post("/listings/reject-many")
async def reject_listings(body: RejectManyRequest, approver: AuthenticatedUser = Depends(require_supply_approver)) -> dict[str, int]:
    """Take several listings off their part in one go (the pins with another number)."""

    def run() -> dict[str, int]:
        with _store().connection() as conn:
            for listing_id in dict.fromkeys(body.listing_ids):
                discovery.reject_listing(conn, listing_id, approver.email)
        return {"rejected": len(set(body.listing_ids))}

    return await _run(run)


@router.post("/listings/{listing_id}/reject", status_code=204)
async def reject_listing(listing_id: str, approver: AuthenticatedUser = Depends(require_supply_approver)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            discovery.reject_listing(conn, listing_id, approver.email)

    await _run(run)
