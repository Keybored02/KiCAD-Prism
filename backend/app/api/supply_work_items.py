"""Work items: engineering decisions about a component or a part, with an owner, evidence, QA's disposition and a recheck date.

Everyone who reads supply sees them. Those who follow supply (designers, QA, administrators) open and edit them; QA and
administrators accept, reject or reopen them; the owner, whoever opened one, or QA marks it done.
"""

from __future__ import annotations

import asyncio
from datetime import date
from typing import Any, Callable, Literal, Optional, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_tracker
from app.services.supply import work_items

router = APIRouter(prefix="/api/supply/work-items", tags=["supply"])

T = TypeVar("T")

Action = Literal["investigate", "alternate", "not_for_new_designs", "retire", "replace", "last_time_buy", "other"]


class CreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject_kind: Literal["component", "part"]
    subject_id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=work_items.MAX_TITLE)
    action: Action
    owner: str = Field(default="", max_length=200)
    note: str = Field(default="", max_length=work_items.MAX_NOTE)
    recheck_on: Optional[date] = None


class UpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = Field(default=None, max_length=work_items.MAX_TITLE)
    action: Optional[Action] = None
    owner: Optional[str] = Field(default=None, max_length=200)
    recheck_on: Optional[date] = None
    clear_recheck: bool = False
    note: str = Field(default="", max_length=work_items.MAX_NOTE)


class DecideIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    state: Literal["open", "accepted", "rejected", "done"]
    note: str = Field(default="", max_length=work_items.MAX_NOTE)


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
    except work_items.NotAllowed as exc:
        raise HTTPException(status_code=403, detail={"code": "not_allowed", "message": str(exc)}) from exc
    except work_items.WorkItemError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_work_item", "message": str(exc)}) from exc


@router.get("")
async def list_work_items(
    state: str = Query("live", max_length=16),
    subject_kind: str = Query("", max_length=16),
    subject_id: str = Query("", max_length=100),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> list[dict[str, Any]]:
    """Work items, soonest recheck first: ``live`` (open or accepted), ``mine``, ``due`` or one state; optionally about one subject."""

    def read() -> list[dict[str, Any]]:
        with _store().connection() as conn:
            return work_items.listed(conn, role=user.role, actor=user.email, state=state, subject_kind=subject_kind, subject_id=subject_id)

    return await _run(read)


@router.post("", status_code=201)
async def create_work_item(body: CreateIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            item = work_items.create(conn, **body.model_dump(), actor=user.email)
            return work_items.shown(conn, item, user.role)

    return await _run(run)


@router.patch("/{item_id}")
async def update_work_item(item_id: str, body: UpdateIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        recheck: date | None | str = None if body.clear_recheck else (body.recheck_on if body.recheck_on is not None else "unchanged")
        with _store().connection() as conn:
            item = work_items.update(conn, item_id, actor=user.email, role=user.role, title=body.title, action=body.action, owner=body.owner,
                                     recheck_on=recheck, note=body.note)
            return work_items.shown(conn, item, user.role)

    return await _run(run)


@router.post("/{item_id}/state")
async def decide_work_item(item_id: str, body: DecideIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            item = work_items.decide(conn, item_id, body.state, actor=user.email, role=user.role, note=body.note)
            return work_items.shown(conn, item, user.role)

    return await _run(run)


@router.get("/{item_id}/history")
async def work_item_history(item_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> list[dict[str, Any]]:
    def read() -> list[dict[str, Any]]:
        with _store().connection() as conn:
            return work_items.history(conn, item_id)

    return await _run(read)
