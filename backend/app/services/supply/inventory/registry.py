"""Inventory source kinds, beside the provider registry: what a source is and how Prism reads it.

A server with a reader module is read on a schedule. A push source sends its whole stock itself, with a token of its own.
The catalog's CSV upload is fed: it has no source row and no reader, only the stock rows it writes. A new kind is one reader
module and one ``register`` line (and, until the table allows more kinds, a migration for its ``kind`` check).
"""

from __future__ import annotations

from app.services.supply.inventory.base import InventorySourceSpec


class UnknownKind(KeyError):
    """No inventory source kind is registered under this key."""


_specs: dict[str, InventorySourceSpec] = {}


def register(spec: InventorySourceSpec) -> None:
    if spec.kind in _specs:
        raise ValueError(f"inventory source kind already registered: {spec.kind}")
    _specs[spec.kind] = spec


def get_spec(kind: str) -> InventorySourceSpec:
    try:
        return _specs[kind]
    except KeyError:
        raise UnknownKind(kind) from None


def list_specs() -> list[InventorySourceSpec]:
    return sorted(_specs.values(), key=lambda spec: spec.label.lower())


register(InventorySourceSpec(kind="push", label="Push", level_source="push", pushed=True))
register(InventorySourceSpec(kind="csv", label="CSV upload", level_source="csv"))
