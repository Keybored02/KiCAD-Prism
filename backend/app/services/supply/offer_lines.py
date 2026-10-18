"""A part's offers as the detailed list shows them: one line for each way of buying it.

A distributor's answer is not always one way of buying. Seen live for one crystal (``ABS07-32.768KHZ-7-T``):

* DigiKey lists Cut Tape (``-1-ND``) and Digi-Reel (``-6-ND``) as two products with the same stock, the same smallest order
  and the same prices. They are one way of buying, so they are one line that names both.
* Mouser has one number whose single price table covers cut tape, MouseReel and a full reel of 3,000. The reel is a second
  way of buying: it starts at the reel size, with the prices from there up.
* Farnell lists cut tape and a re-reeled length of the same tape at the same prices but a different smallest order. Those
  stay two lines.

Nothing is dropped: a merged line keeps every number it stands for in ``skus``, and a split line keeps its distributor's
own price breaks. The sheet's listings are untouched.
"""

from __future__ import annotations

from typing import Any

from app.services.supply.providers import packaging_hints
from app.services.supply.vocabulary import Packaging

# Two products with these packagings and the same terms are one way of buying: a length of tape, cut or on a custom reel.
_ONE_TAPE = frozenset({Packaging.CUT_TAPE.value, Packaging.CUSTOM_REEL.value})


def packaging_of(offer: dict[str, Any]) -> dict[str, Any]:
    """The packaging as stated, or a guess from the number and the order terms (marked as one) where the distributor says nothing."""

    stated = offer["packaging"] or Packaging.UNKNOWN.value
    if stated != Packaging.UNKNOWN.value or offer["provider"] in packaging_hints.NO_GUESS:
        return {"packaging": stated, "reel_size": offer["reel_size"], "packaging_inferred": bool(offer["packaging_inferred"])}
    first = int(offer["price_breaks"][0][0]) if offer["price_breaks"] else None
    guess = packaging_hints.infer(str(offer["sku"]), int(offer["moq"] or 0), int(offer["order_multiple"] or 0), first)
    return {"packaging": guess.value, "reel_size": None, "packaging_inferred": guess is not Packaging.UNKNOWN}


def _line(offer: dict[str, Any]) -> dict[str, Any]:
    return {
        "connector_id": offer["connector_id"], "provider": offer["provider"], "name": offer["connector_name"], "sku": offer["sku"],
        "skus": [offer["sku"]], "also_packaging": [],
        "stock": int(offer["stock"] or 0), "moq": int(offer["moq"] or 0), **packaging_of(offer),
        "product_url": offer["product_url"] or "",
        "currency": offer["currency"] or "", "price_breaks": [[int(quantity), str(price)] for quantity, price in offer["price_breaks"] or []],
    }


def _terms(offer: dict[str, Any]) -> tuple:
    return (
        offer["connector_id"], int(offer["stock"] or 0), int(offer["moq"] or 0), int(offer["order_multiple"] or 0), offer["currency"] or "",
        tuple((int(quantity), str(price)) for quantity, price in offer["price_breaks"] or []),
    )


def _merge_same_terms(offers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One line for products of a length of tape that share stock, smallest order and prices: cut tape and its custom reel."""

    lines: list[dict[str, Any]] = []
    seen: dict[tuple, dict[str, Any]] = {}
    for offer in sorted(offers, key=lambda item: (item["packaging"] != Packaging.CUT_TAPE.value, str(item["sku"]))):
        line = _line(offer)
        key = _terms(offer)
        kept = seen.get(key)
        if kept is not None and line["packaging"] in _ONE_TAPE and kept["packaging"] in _ONE_TAPE and line["price_breaks"]:
            kept["skus"].append(line["sku"])
            if line["packaging"] != kept["packaging"] and line["packaging"] not in kept["also_packaging"]:
                kept["also_packaging"].append(line["packaging"])
            continue
        lines.append(line)
        seen[key] = line
    return lines


def _split_reel(line: dict[str, Any]) -> list[dict[str, Any]]:
    """A number sold as several packagings with one price table has a full reel in it where the prices pass the reel size."""

    reel = line["reel_size"]
    if line["packaging"] != Packaging.SEVERAL.value or not reel:
        return [line]
    small = [item for item in line["price_breaks"] if item[0] < reel]
    full = [item for item in line["price_breaks"] if item[0] >= reel]
    if not small or not full:
        return [line]
    # The reel is a way of buying on its own, from its size up. The cut length and the distributor's custom reel come before it.
    cut = {**line, "packaging": Packaging.CUT_TAPE.value, "also_packaging": [Packaging.CUSTOM_REEL.value], "reel_size": None, "price_breaks": small}
    whole = {**line, "packaging": Packaging.TAPE_REEL.value, "also_packaging": [], "moq": max(line["moq"], int(reel)), "price_breaks": full}
    return [cut, whole]


def offer_lines(offers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The lines of the detailed list for these offers (one distributor's or several), by distributor and number."""

    lines = [part for line in _merge_same_terms(offers) for part in _split_reel(line)]
    order = {Packaging.CUT_TAPE.value: 0, Packaging.CUSTOM_REEL.value: 1, Packaging.TAPE_REEL.value: 2}
    return sorted(lines, key=lambda line: (line["name"].lower(), order.get(line["packaging"], 3), line["sku"]))
