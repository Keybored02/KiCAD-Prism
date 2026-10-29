"""Exchange rates for supply prices. Everyone who reads supply data sees what is loaded; administrators refresh or enter rates."""

from __future__ import annotations

import asyncio
from datetime import date
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_admin, require_supply_reader
from app.services.supply import clock, fx
from app.services.supply.providers.base import ProviderError

router = APIRouter(prefix="/api/supply/fx", tags=["supply"])

T = TypeVar("T")


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


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_rates", "message": str(exc)}) from exc
    except ProviderError as exc:
        raise HTTPException(status_code=502, detail={"code": exc.code, "message": "The exchange rates could not be fetched."}) from exc


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
