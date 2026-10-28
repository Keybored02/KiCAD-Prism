"""The price a part shows in lists: one figure in the base currency, and what kind of figure it is.

Every counted listing is priced at the part's quantity and converted to the base currency, so distributors that quote
in different currencies compare. The figure is, in order of preference:

* ``orderable``: the cheapest listing that can be bought now (its stock covers its minimum order);
* ``backorder``: nothing can, so the cheapest listing that quotes a lead time, with that lead time;
* ``last_seen``: no lead time either, so the price when the part was last in stock;
* ``listed``: nothing was ever seen in stock, so the cheapest list price.

A listing whose minimum order is above the quantity (a full reel) only counts when no other listing does, and is then
quoted at what must be ordered. The range and median are over distributors, each at its own cheapest, so a pile of
listings at one distributor does not move them. A mean is never shown: one pack price would move it.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, Callable, Mapping, Sequence

from app.services.supply import pricing
from app.services.supply.fx import Rates

MIN_SELLERS_FOR_RANGE = 2


@dataclass(frozen=True, slots=True)
class Quote:
    price: Decimal  # per piece, in the base currency
    native: Decimal
    currency: str
    quantity: int  # what must be ordered
    within: bool  # the minimum order is not above the wanted quantity
    holds: bool  # the stock covers the minimum order
    lead_days: int | None
    connector_id: str


def _breaks(offer: Mapping[str, Any]) -> list[tuple[int, Decimal]]:
    return [(int(quantity), Decimal(str(price))) for quantity, price in offer["price_breaks"]]


def native_price(offer: Mapping[str, Any], wanted: int) -> tuple[str | None, str, int]:
    """One offer's unit price at ``wanted`` in its own currency, as (price, currency, quantity it is quoted at)."""

    quantity = pricing.order_quantity(wanted, offer["moq"], offer["order_multiple"])
    if not offer["currency"]:
        return None, "", quantity
    price = pricing.unit_price_at(_breaks(offer), moq=offer["moq"], order_multiple=offer["order_multiple"], wanted=wanted)
    return (format(price.normalize(), "f") if price is not None else None), offer["currency"], quantity


def quote(offer: Mapping[str, Any], wanted: int, base: str, rates: Rates) -> Quote | None:
    """The offer priced at ``wanted`` in the base currency, or None when it has no price or its currency has no rate."""

    if offer["marketplace"] or not offer["currency"]:
        return None
    native = pricing.unit_price_at(_breaks(offer), moq=offer["moq"], order_multiple=offer["order_multiple"], wanted=wanted)
    if native is None:
        return None
    converted = rates.convert(native, offer["currency"], base)
    if converted is None:
        return None
    lead = offer.get("lead_time_days")
    return Quote(
        price=converted, native=native, currency=offer["currency"],
        quantity=pricing.order_quantity(wanted, offer["moq"], offer["order_multiple"]),
        within=offer["moq"] <= wanted, holds=int(offer["stock"] or 0) >= max(int(offer["moq"] or 1), 1),
        lead_days=int(lead) if lead else None, connector_id=offer["connector_id"],
    )


def _first(groups: Sequence[Sequence[Quote]]) -> Quote | None:
    """The cheapest quote of the first group that has one."""

    for group in groups:
        if group:
            return min(group, key=lambda found: found.price)
    return None


def _range(quotes: Sequence[Quote]) -> dict[str, Any] | None:
    best: dict[str, Decimal] = {}
    for found in quotes:
        best[found.connector_id] = min(found.price, best.get(found.connector_id, found.price))
    if len(best) < MIN_SELLERS_FOR_RANGE:
        return None
    prices = list(best.values())
    return {"low": _text(min(prices)), "high": _text(max(prices)), "median": _text(statistics.median(prices)), "sellers": len(prices)}


_PLACES = Decimal("0.000001")


def _text(price: Decimal) -> str:
    """A price as plain text to the six places the readings keep, so a converted price is not 28 digits long."""

    return format(price.quantize(_PLACES).normalize(), "f")


def headline(
    offers: Sequence[Mapping[str, Any]], wanted: int, base: str, rates: Rates,
    last_seen: Callable[[], tuple[Decimal, date] | None] | None = None,
) -> dict[str, Any]:
    """The list price of a part: the figure, its kind and what goes with it. ``last_seen`` is asked only when nothing else prices it."""

    quotes = [found for found in (quote(offer, wanted, base, rates) for offer in offers) if found is not None]
    from app.services.supply.providers import registry  # the registry loads every provider, so it is imported when asked

    simulated = {offer["connector_id"] for offer in offers if registry.is_simulated(offer.get("provider") or "")}
    none = {"unit_price": None, "currency": "", "price_quantity": wanted, "price_kind": None, "price_lead_days": None,
            "price_range": None, "price_native": None, "price_seen_day": None, "price_unrated": _unrated(offers, quotes), "price_test_data": False}
    if not quotes:
        return none
    within = [found for found in quotes if found.within]
    beyond = [found for found in quotes if not found.within]
    chosen = _first([[q for q in within if q.holds], [q for q in beyond if q.holds]])
    kind, seen_day = "orderable", None
    if chosen is None:
        chosen = _first([[q for q in within if q.lead_days], [q for q in beyond if q.lead_days]])
        kind = "backorder"
    price, quantity = (chosen.price, chosen.quantity) if chosen else (None, wanted)
    if chosen is None and last_seen is not None:
        seen = last_seen()
        if seen is not None:
            price, seen_day = seen
            kind = "last_seen"
    if price is None:
        chosen = _first([within, beyond])
        kind = "listed"
        price, quantity = chosen.price, chosen.quantity
    foreign = chosen is not None and chosen.currency != base and kind != "last_seen"
    return {
        **none,
        "unit_price": _text(price), "currency": base, "price_quantity": quantity, "price_kind": kind,
        "price_lead_days": chosen.lead_days if kind == "backorder" and chosen else None,
        "price_range": _range(within or beyond),
        "price_native": {"price": _text(chosen.native), "currency": chosen.currency} if foreign else None,
        "price_seen_day": seen_day.isoformat() if seen_day else None,
        # The figure came from a simulated connector; a last-seen price is test data when every offer of the part is.
        "price_test_data": chosen.connector_id in simulated if chosen else bool(offers) and all(offer["connector_id"] in simulated for offer in offers),
    }


def _unrated(offers: Sequence[Mapping[str, Any]], quotes: Sequence[Quote]) -> list[str]:
    """Currencies of priced offers that could not be converted for want of a rate."""

    priced = {offer["currency"] for offer in offers if offer["currency"] and not offer["marketplace"] and offer["price_breaks"]}
    return sorted(priced - {found.currency for found in quotes})
