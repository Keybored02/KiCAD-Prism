"""Exchange rates for supply prices. Everyone who reads supply data sees what is loaded; administrators refresh or enter rates."""

from __future__ import annotations

from datetime import date
from functools import partial
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.api.supply_call import run_supply
from app.core.security import AuthenticatedUser, require_admin, require_supply_reader
from app.services.supply import clock, fx

router = APIRouter(prefix="/api/supply/fx", tags=["supply"])
_run = partial(run_supply, invalid="invalid_rates", upstream="The exchange rates could not be fetched.")


class ManualRates(BaseModel):
    model_config = ConfigDict(extra="forbid")

    day: date
    # Units of the currency per euro, as the ECB quotes them.
    rates: dict[str, float] = Field(min_length=1, max_length=60)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


def _view(rates: fx.Rates) -> dict[str, Any]:
    today = clock.now().date()
    return {
        "day": rates.day.isoformat() if rates.day else None,
        "currencies": sorted(rates.per_eur),
        "stale": fx.is_stale(rates, today),
    }


@router.get("")
async def current_rates(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return _view(fx.latest(conn))

    return await _run(read)


@router.post("/refresh")
async def refresh_rates(_admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            saved = fx.refresh_from_ecb(conn)
            return {**_view(fx.latest(conn)), "saved": saved}

    return await _run(run)


@router.post("/rates")
async def enter_rates(body: ManualRates, admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            saved = fx.enter_manually(conn, body.day, body.rates, admin.email)
            return {**_view(fx.latest(conn)), "saved": saved}

    return await _run(run)
