"""Shared supply response models (ADR scripting-and-mcp §3.2, supply decision D4).

They describe the JSON supply routes already return. Every model allows extras,
so a key a model misses still reaches the client. ``scripts/export_supply_types.py``
writes the models supply routes declare as the frontend's TypeScript types.
"""

from __future__ import annotations

from typing import Generic, Literal, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


#: A part's status, best to worst; ``unknown`` until something that counts has been read.
SupplyStatus = Literal["ok", "warning", "error", "fatal", "unknown"]


class SupplyModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class Items(SupplyModel, Generic[T]):
    """A list answer. Every supply list is ``{"items": [...]}``, so a field can join it later."""

    items: list[T]


class Page(Items[T], Generic[T]):
    """One page of a long list: ``total`` matches in all, and where the next page starts (null at the end)."""

    total: int
    limit: int
    offset: int
    next_offset: Optional[int]


class JobProgress(SupplyModel):
    """How far a supply job has got. Every supply job answers this shape (``progress.job_progress``)."""

    state: Literal["running", "done", "failed", "none"]
    done: int
    total: int
    failed: int
    reason: str


class DecisionState(SupplyModel):
    """A decision someone asked for: an approver's stands (``approved``), anyone else's waits for one (``proposed``)."""

    id: str
    state: Literal["approved", "proposed"]
