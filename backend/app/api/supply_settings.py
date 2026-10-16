"""Supply settings API: what the assessment weighs.

Everyone who can read supply data sees the settings and the defaults. Changing them is for administrators.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Dict, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_admin, require_supply_reader
from app.services.supply import maker_seeds
from app.services.supply.assessment import settings as rules
from app.services.supply.assessment import settings_store

router = APIRouter(prefix="/api/supply/settings", tags=["supply"])

T = TypeVar("T")


class AssessmentSettingsBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lead_time_days: int
    stale_hours: int
    base_currency: str = "EUR"
    weights: Dict[str, float]
    severity: Dict[str, str]


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _view(current: rules.AssessmentSettings) -> dict[str, Any]:
    return {
        "settings": rules.to_dto(current),
        "defaults": rules.to_dto(rules.DEFAULTS),
        "checks": [{"id": check, "label": label} for check, label in rules.CHECK_LABELS.items()],
        "ranges": {"lead_time_days": list(rules.LEAD_TIME_RANGE), "stale_hours": list(rules.STALE_HOURS_RANGE)},
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


@router.get("/assessment")
async def get_assessment_settings(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return _view(settings_store.load(conn))

    return await _run(read)


@router.put("/assessment")
async def put_assessment_settings(
    body: AssessmentSettingsBody, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return _view(settings_store.save(conn, body.model_dump(), admin.email))

    return await _run(run)


@router.delete("/assessment")
async def reset_assessment_settings(admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return _view(settings_store.reset(conn, admin.email))

    return await _run(run)
