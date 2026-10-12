"""Reading catalog components for supply, through the catalog's public service.

Supply never reads catalog tables. These helpers page through ``list_components`` and are the
only place that knows how.
"""

from __future__ import annotations

from typing import Any, Iterator

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


def component_ids_by_part(components: Iterator[dict[str, Any]] | None = None) -> dict[tuple[str, str], str]:
    """(manufacturer key, part number key) to catalog component id."""

    found: dict[tuple[str, str], str] = {}
    for component in components if components is not None else catalog_components():
        number = match_key(str(component.get("mpn") or ""))
        if number:
            found.setdefault((alias_key(str(component.get("manufacturer") or "")), number), str(component["id"]))
    return found
