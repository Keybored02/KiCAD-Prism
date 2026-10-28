"""Supply settings API: what the assessment weighs.

Everyone who can read supply data sees the settings and the defaults. Changing them is for administrators.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Dict, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_admin, require_supply_reader
from app.services.supply import fx, maker_seeds, number_suffixes
from app.services.supply.assessment import settings as rules
from app.services.supply.assessment import settings_store

router = APIRouter(prefix="/api/supply/settings", tags=["supply"])

T = TypeVar("T")


class AssessmentSettingsBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lead_time_days: int
    last_buy_error_days: int = 180
    late_hours: int = 48
    spares_mode: str = "flat"
    spares_percent: float = 0.0
    spares_small_passives: float = 2.0
    spares_others: float = 0.0
    alert_price_rise_percent: int = 20
    alert_likely_out_percent: int = 70
    base_currency: str = Field(default_factory=lambda: rules.DEFAULTS.base_currency)
    price_quantity: int = 100
    prefer_distributors: bool = False
    distributor_order: list[str] = []
    severity: Dict[str, str]


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _currencies(conn, current: str) -> list[str]:
    """The currencies a workspace can cost in: the euro and every one Prism has a rate for, with the one chosen even without a rate."""

    return sorted({"EUR", current, *fx.latest(conn).per_eur})


def _view(conn, current: rules.AssessmentSettings) -> dict[str, Any]:
    return {
        "settings": rules.to_dto(current),
        "defaults": rules.to_dto(rules.DEFAULTS),
        "checks": [{"id": check, "label": label, "area": rules.CHECK_AREA[check]} for check, label in rules.CHECK_LABELS.items()],
        "ranges": {"lead_time_days": list(rules.LEAD_TIME_RANGE), "last_buy_error_days": list(rules.LAST_BUY_ERROR_RANGE), "late_hours": list(rules.LATE_HOURS_RANGE),
                   "spares": list(rules.SPARES_RANGE), "alert_price_rise_percent": list(rules.ALERT_PRICE_RISE_RANGE),
                   "alert_likely_out_percent": list(rules.ALERT_LIKELY_OUT_RANGE),
                   "price_quantity": list(rules.PRICE_QUANTITY_RANGE)},
        "currencies": _currencies(conn, current.base_currency),
    }


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_settings", "message": str(exc)}) from exc


class MakerSpellingBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    spelling: str
    # The group (a maker) it joins; none starts a new one.
    group_key: str | None = None


@router.get("/makers")
async def get_makers(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return {"groups": maker_seeds.groups(conn)}

    return await _run(read)


@router.post("/makers", status_code=201)
async def add_maker_spelling(body: MakerSpellingBody, admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            maker_seeds.add(conn, body.spelling, body.group_key, admin.email)
            return {"groups": maker_seeds.groups(conn)}

    return await _run(run)


@router.delete("/makers/{alias_key}", status_code=204)
async def remove_maker_spelling(alias_key: str, admin: AuthenticatedUser = Depends(require_admin)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            maker_seeds.remove(conn, alias_key, admin.email)

    await _run(run)


class SuffixBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ending: str
    kind: str


@router.get("/number-endings")
async def get_number_endings(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return {"endings": number_suffixes.listing_all(conn)}

    return await _run(read)


@router.post("/number-endings", status_code=201)
async def add_number_ending(body: SuffixBody, admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            number_suffixes.add(conn, body.ending, body.kind, admin.email)
            return {"endings": number_suffixes.listing_all(conn)}

    return await _run(run)


@router.delete("/number-endings/{key:path}", status_code=204)
async def remove_number_ending(key: str, admin: AuthenticatedUser = Depends(require_admin)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            number_suffixes.remove(conn, key, admin.email)

    await _run(run)


@router.get("/assessment")
async def get_assessment_settings(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return _view(conn, settings_store.load(conn))

    return await _run(read)


@router.put("/assessment")
async def put_assessment_settings(
    body: AssessmentSettingsBody, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return _view(conn, settings_store.save(conn, body.model_dump(), admin.email))

    return await _run(run)
