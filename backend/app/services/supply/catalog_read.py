"""Reading catalog components for supply, through the catalog's public service.

Supply never reads catalog tables. These helpers page through ``list_components`` and are the
only place that knows how.
"""

from __future__ import annotations

from typing import Any, Iterable, Iterator

from app.services.supply.identity import alias_key, match_key
from app.services.supply.makers import same_maker

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
    """The (manufacturer, part number) pairs some active catalog component has, compared ignoring case.

    A pair also counts when a component has the number from the same maker under another spelling.
    """

    from app.services.component_catalog_service import catalog_service

    asked = [(str(maker), str(mpn)) for maker, mpn in pairs]
    if not asked:
        return set()
    found = catalog_service.match_component_identities([{"manufacturer": maker, "mpn": mpn} for maker, mpn in asked])
    have = {tuple(key.split(chr(0), 1)) for key in found}
    missing = [(maker, mpn) for maker, mpn in asked if (maker.strip().casefold(), mpn.strip().casefold()) not in have]
    if missing:
        components = component_ids_by_part()
        for maker, mpn in missing:
            if components.has(maker, mpn):
                have.add((maker.strip().casefold(), mpn.strip().casefold()))
    return have  # type: ignore[return-value]


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


class ComponentsByPart(dict):
    """(manufacturer key, part number key) to catalog component id.

    A lookup that finds no exact key falls back to a catalog component with the same number whose maker is the same maker
    (``makers.same_maker``): "TI" in a BOM and "Texas Instruments" in the library are one part.
    """

    def __init__(self) -> None:
        super().__init__()
        self._by_number: dict[str, list[tuple[str, str]]] = {}

    def add(self, maker: str, number: str, component_id: str) -> None:
        self.setdefault((alias_key(maker), number), component_id)
        self._by_number.setdefault(number, []).append((maker, component_id))

    def get(self, key, default=None):  # type: ignore[override]
        found = super().get(key)
        if found is not None or not isinstance(key, tuple) or len(key) != 2:
            return found if found is not None else default
        asked, number = key
        for maker, component_id in self._by_number.get(number, ()):
            if asked and same_maker(asked, maker):
                return component_id
        return default

    def has(self, maker: str, mpn: str) -> bool:
        return self.get((alias_key(maker), match_key(mpn))) is not None


def component_ids_by_part(components: Iterator[dict[str, Any]] | None = None) -> ComponentsByPart:
    """(manufacturer key, part number key) to catalog component id, also for another spelling of the same maker."""

    found = ComponentsByPart()
    for component in components if components is not None else catalog_components():
        number = match_key(str(component.get("mpn") or ""))
        if number:
            found.add(str(component.get("manufacturer") or ""), number, str(component["id"]))
    return found
