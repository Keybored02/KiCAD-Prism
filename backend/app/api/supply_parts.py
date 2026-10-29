"""Parts and watches API.

Everyone who can read supply data sees parts, stock and history. Watching a part
and changing a watch's rules need write access (admin, designer).
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Literal, Optional, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.api.supply_access import is_approver
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_tracker, require_supply_writer
from app.services.supply import catalog_read, component_parts, cross_reference, part_history, parts, parts_view, preferences, price_quantity, trade_marks, refresh, review, watches

router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


class AddWatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    manufacturer: str = Field(default="", max_length=120)
    mpn: str = Field(min_length=1, max_length=100)
    threshold: Optional[int] = Field(default=None, ge=0)
    pinned: bool = False
    packaging: Literal["any", "cut_tape", "custom_reel", "tape_reel", "tray", "tube", "bulk"] = "any"


class UpdateWatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Absent leaves it alone; null clears the threshold.
    threshold: Optional[int] = Field(default=None, ge=0)
    pinned: Optional[bool] = None
    packaging: Optional[Literal["any", "cut_tape", "custom_reel", "tape_reel", "tray", "tube", "bulk"]] = None


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, (watches.WatchNotFound, parts.PartNotFound)):
        return HTTPException(status_code=404, detail="Not found")
    if isinstance(exc, component_parts.NotInLibrary):
        return HTTPException(status_code=400, detail={"code": "not_in_library", "message": str(exc)})
    if isinstance(exc, parts.UnknownManufacturer):
        return HTTPException(status_code=400, detail={"code": "unknown_manufacturer", "message": str(exc)})
    if isinstance(exc, watches.WatchError):
        return HTTPException(status_code=400, detail={"code": "watch_error", "message": str(exc)})
    if isinstance(exc, refresh.TooSoon):
        return HTTPException(status_code=429, detail={"code": "read_too_soon", "message": str(exc)})
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail={"code": "invalid_request", "message": str(exc)})
    raise exc


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        raise _http_error(exc) from exc


def _watch_dto(record: watches.WatchRecord) -> dict[str, Any]:
    return {
        "id": record.id, "part_id": record.part_id, "manufacturer": record.manufacturer_name, "mpn": record.mpn,
        "threshold": record.threshold, "pinned": record.pinned, "owner": record.owner, "packaging": record.packaging,
    }


@router.get("/parts")
async def list_parts(
    scope: Literal["watched", "followed", "in_use", "all", "tier1", "tier2", "waiting", "pick"] = "watched",
    only: str = Query(default="", max_length=120, pattern=r"^[A-Za-z0-9_]*(:[^\x00-\x1f]{1,100})?$"),
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=100, ge=1, le=parts_view.MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    project_id: str = Query(default="", max_length=100),
    vendor: str = Query(default="", max_length=100),
    sort: str = Query(default="", pattern=r"^(runout|(part|stock|price):(asc|desc))?$"),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return parts_view.list_parts(
                conn, scope=scope, query=q, limit=limit, role=user.role, only=only, offset=offset, project_id=project_id, vendor=vendor, sort=sort,
            )

    return await _run(read)


@router.get("/part-groups")
async def part_groups(
    scope: Literal["watched", "followed", "in_use", "all", "tier1", "tier2", "waiting", "pick"] = "watched",
    only: str = Query(default="", max_length=120, pattern=r"^[A-Za-z0-9_]*(:[^\x00-\x1f]{1,100})?$"),
    q: str = Query(default="", max_length=100),
    vendor: str = Query(default="", max_length=100),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    """The matching parts grouped by the projects that use them, tracked projects first."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return parts_view.part_groups(conn, scope=scope, query=q, role=user.role, only=only, vendor=vendor)

    return await _run(read)


@router.get("/part-lookup")
async def find_part(
    mpn: str = Query(min_length=1, max_length=100),
    manufacturer: str = Query(default="", max_length=120),
    _user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    """The part Prism knows for a manufacturer and number, and whether it follows it. A blank manufacturer finds a number only one part has.
    Creates nothing."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            record = parts.find_part(conn, manufacturer, mpn)
            if record is None:
                return {"part_id": None, "followed": False}
            followed = conn.execute("SELECT 1 FROM supply_part_tiers WHERE part_id = %s", (record.id,)).fetchone() is not None
            return {"part_id": record.id, "followed": followed}

    return await _run(read)


@router.get("/parts/{part_id}")
async def get_part(part_id: str, user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return parts_view.part_detail(conn, part_id, role=user.role)

    return await _run(read)


@router.get("/parts/{part_id}/history")
async def get_part_history(
    part_id: str, days: int = Query(part_history.DEFAULT_DAYS, ge=1, le=part_history.MAX_DAYS), user: AuthenticatedUser = Depends(require_supply_reader)
) -> dict[str, Any]:
    """Stock and price per distributor over the last ``days`` days."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return part_history.build(conn, part_id, days=days)

    return await _run(read)


class PreferredIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    connector_id: str = Field(min_length=1, max_length=64)


@router.put("/parts/{part_id}/preferred", status_code=204)
async def set_preferred(part_id: str, body: PreferredIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            preferences.set_preferred(conn, part_id, body.connector_id, user.email)

    await _run(run)


@router.delete("/parts/{part_id}/preferred", status_code=204)
async def clear_preferred(part_id: str, user: AuthenticatedUser = Depends(require_supply_tracker)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            parts.get_part(conn, part_id)
            preferences.clear(conn, part_id, user.email)

    await _run(run)


class PriceQuantityIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Null takes the part back to the workspace default.
    quantity: Optional[int] = Field(default=None, ge=1, le=1_000_000)


@router.put("/parts/{part_id}/price-quantity")
async def set_price_quantity(part_id: str, body: PriceQuantityIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    """The quantity this part is priced at in lists and its price history; null uses the workspace default."""

    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return price_quantity.set_for_part(conn, part_id, body.quantity, user.email)

    return await _run(run)


class TradeMarkIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    control: Literal["controlled", "none"]
    eccn: str = Field(default="", max_length=trade_marks.MAX_ECCN)


@router.put("/parts/{part_id}/trade-mark", status_code=204)
async def set_trade_mark(part_id: str, body: TradeMarkIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> None:
    """A person's word on whether the part is export controlled; it wins over what distributors state."""

    def run() -> None:
        with _store().connection() as conn:
            trade_marks.set_mark(conn, part_id, body.control, body.eccn, user.email)

    await _run(run)


@router.delete("/parts/{part_id}/trade-mark", status_code=204)
async def clear_trade_mark(part_id: str, user: AuthenticatedUser = Depends(require_supply_tracker)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            parts.get_part(conn, part_id)
            trade_marks.clear_mark(conn, part_id, user.email)

    await _run(run)


@router.get("/parts/{part_id}/cross-reference")
async def cross_reference_of(part_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """Alternatives to the part, graded by how close they are."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            parts.get_part(conn, part_id)
            return cross_reference.candidates(conn, part_id)

    return await _run(read)


@router.get("/parts/{part_id}/library-component")
async def library_component_of(part_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """The catalog component the part counts for (its main part first, then one it is an approved alternate of), so a part link
    can open it. None when the library has none."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            part = parts.get_part(conn, part_id)
            held = component_parts.components_holding(conn, [part_id]).get(part_id) or []
        return {"component_id": held[0]["id"] if held else catalog_read.component_for(part.manufacturer_name, part.mpn)}

    return await _run(read)


@router.post("/parts/{part_id}/view-read")
async def read_part_on_view(part_id: str, reader: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """Read a part someone opened, when nothing follows it and its prices are older than the read window. Once every 15 minutes per part."""

    return await _run(lambda: refresh.read_on_view(supply_connectors.service, [part_id], reader.email))


@router.post("/parts/{part_id}/refresh")
async def read_part_now(part_id: str, writer: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, Any]:
    """Read one part from its distributors now, from the interactive reserve. Once every 15 minutes per person and part."""

    return await _run(lambda: refresh.read_now(supply_connectors.service, part_id, writer.email))


@router.get("/manufacturers")
async def list_manufacturers(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return {"items": review.manufacturers(conn)}

    return await _run(read)


@router.post("/watches")
async def add_watch(
    body: AddWatchRequest, response: Response, writer: AuthenticatedUser = Depends(require_supply_writer)
) -> dict[str, Any]:
    def run() -> tuple[dict[str, Any], bool]:
        with _store().connection() as conn:
            record, created = watches.add_watch(
                conn, body.manufacturer, body.mpn, writer.email, threshold=body.threshold, pinned=body.pinned,
                packaging=body.packaging,
                may_create_manufacturer=is_approver(writer),
            )
        return _watch_dto(record), created

    dto, created = await _run(run)
    response.status_code = 201 if created else 200
    return dto


@router.patch("/watches/{watch_id}")
async def update_watch(
    watch_id: str, body: UpdateWatchRequest, writer: AuthenticatedUser = Depends(require_supply_writer)
) -> dict[str, Any]:
    changes: dict[str, Any] = {}
    if "threshold" in body.model_fields_set:
        changes["threshold"] = body.threshold
    if "pinned" in body.model_fields_set:
        changes["pinned"] = body.pinned
    if "packaging" in body.model_fields_set and body.packaging is not None:
        changes["packaging"] = body.packaging

    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return _watch_dto(watches.update_watch(conn, watch_id, writer.email, **changes))

    return await _run(run)


@router.delete("/watches/{watch_id}", status_code=204)
async def remove_watch(watch_id: str, writer: AuthenticatedUser = Depends(require_supply_writer)) -> Response:
    def run() -> None:
        with _store().connection() as conn:
            watches.remove_watch(conn, watch_id, writer.email)

    await _run(run)
    return Response(status_code=204)
