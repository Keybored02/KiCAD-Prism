"""Reading catalog components for supply, through the catalog's public service.

Supply never reads catalog tables. These helpers page through ``list_components`` and are the
only place that knows how.
"""

from __future__ import annotations

from typing import Any, Iterable, Iterator

from app.services.supply.identity import alias_key, match_key

PAGE_SIZE = 500


def catalog_components() -> Iterator[dict[str, Any]]:
    """Every active catalog component, a page at a time."""

    from app.services.component_catalog_service import catalog_service

    page = 1
    while True:
        result = catalog_service.list_components(query="", page=page, page_size=PAGE_SIZE, include_inactive=False)
        yield from result["items"]
        if page >= int(result.get("pages") or 1):
            return
        page += 1


def identities(component_ids: Iterable[str]) -> dict[str, tuple[str, str]]:
    """Catalog component id to (manufacturer, part number), for the ids the catalog knows. Others are left out."""

    from app.services.component_catalog_service import catalog_service

    wanted = sorted({str(item) for item in component_ids if item})
    return catalog_service.component_identities(wanted) if wanted else {}


def in_library(pairs: Iterable[tuple[str, str]]) -> set[tuple[str, str]]:
    """The (manufacturer, part number) pairs some active catalog component has, compared ignoring case."""

    from app.services.component_catalog_service import catalog_service

    wanted = [{"manufacturer": maker, "mpn": mpn} for maker, mpn in pairs]
    if not wanted:
        return set()
    found = catalog_service.match_component_identities(wanted)
    return {tuple(key.split(chr(0), 1)) for key in found}  # type: ignore[misc]


def own_stock(pairs: Iterable[tuple[str, str]]) -> dict[tuple[str, str], int | None]:
    """Our own on-hand quantity per (manufacturer, part number), keyed in lower case.

    A pair no component has is left out. A component whose stock rows mix units has no usable
    quantity, so it maps to None rather than a wrong sum.
    """

    from app.services.component_catalog_service import catalog_service

    wanted = [{"manufacturer": maker, "mpn": mpn} for maker, mpn in pairs]
    if not wanted:
        return {}
    matches = catalog_service.match_component_identities(wanted)
    inventory = catalog_service.component_inventory([match["component_id"] for match in matches.values()])
    found: dict[tuple[str, str], int | None] = {}
    for key, match in matches.items():
        maker, mpn = key.split(chr(0), 1)
        local = inventory.get(match["component_id"])
        found[(maker, mpn)] = None if local is None or local["mixed_units"] else int(local["quantity"])
    return found


def component_ids_by_part(components: Iterator[dict[str, Any]] | None = None) -> dict[tuple[str, str], str]:
    """(manufacturer key, part number key) to catalog component id."""

    found: dict[tuple[str, str], str] = {}
    for component in components if components is not None else catalog_components():
        number = match_key(str(component.get("mpn") or ""))
        if number:
            found.setdefault((alias_key(str(component.get("manufacturer") or "")), number), str(component["id"]))
    return found
