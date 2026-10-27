"""Fill from distributor API. Looking a part up needs write access (admin, designer).

It reads from the distributors and writes nothing; the person saves the result through the
catalog's metadata edit.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_writer
from app.services.supply import fill

router = APIRouter(prefix="/api/supply/fill", tags=["supply"])

T = TypeVar("T")


class SearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mpn: str = Field(min_length=1, max_length=100)
    manufacturer: str = Field(default="", max_length=120)


class DetailsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    connector_id: str = Field(min_length=1, max_length=64)
    sku: str = Field(min_length=1, max_length=100)
    mpn: str = Field(min_length=1, max_length=100)
    manufacturer: str = Field(default="", max_length=120)


def _service() -> fill.FillService:
    # Built per call so a replaced connector service (tests) is the one used.
    return fill.FillService(supply_connectors.service)


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except fill.FillError as exc:
        raise HTTPException(status_code=400, detail={"code": "fill_error", "message": str(exc)}) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc


@router.post("/search")
async def search(body: SearchRequest, _user: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, Any]:
    return await _run(lambda: _service().search(body.mpn, body.manufacturer))


@router.post("/details")
async def details(body: DetailsRequest, _user: AuthenticatedUser = Depends(require_supply_writer)) -> dict[str, Any]:
    return await _run(lambda: _service().details(body.connector_id, body.sku, body.mpn, body.manufacturer))
