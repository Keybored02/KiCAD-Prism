"""Shared supply response models (ADR scripting-and-mcp §3.2, supply decision D4).

They describe the JSON supply routes already return. Every model allows extras,
so a key a model misses still reaches the client. ``scripts/export_supply_types.py``
writes the models supply routes declare as the frontend's TypeScript types.
"""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class SupplyModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class Items(SupplyModel, Generic[T]):
    """A list answer. Every supply list is ``{"items": [...]}``, so a field can join it later."""

    items: list[T]
