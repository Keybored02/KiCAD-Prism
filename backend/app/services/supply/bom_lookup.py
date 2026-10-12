"""Looking a bill of materials up in what Prism knows about parts.

A BOM line is a manufacturer, a part number and how many go on one board. This resolves each
line to a supply part (plan 6.4),
then reports stock, status, lead time and the cheapest way to buy what a build needs.

Reads only: it never calls a distributor. A line whose part nobody watches is reported as such;
watching it (``watch_lines``) is what makes Prism read it. Lines without a part number are "not
tracked" and are counted, never dropped.

Resolution, first hit wins. A line with a ``Prism ID`` the catalog knows is first given that component's
manufacturer and part number (``with_library_identity``); the rest is unchanged.

1. manufacturer and part number, through confirmed spellings and the part number key: exact
2. part number alone, when the manufacturer is blank or unrecognised and exactly one part has it:
   that part, marked so the manufacturer can be fixed
3. several parts share the number and the manufacturer cannot tell them apart: ambiguous
4. a part number nobody has watched or matched: unknown
5. no part number: not tracked
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timezone
import math
from decimal import Decimal
from typing import Any, Iterable, Mapping, Sequence

from app.services.supply import parts, parts_view, pricing, usage, watches
from app.services.supply.assessment import health as health_rules
from app.services.supply.assessment import service as assessment
from app.services.supply.vocabulary import Status
from app.services.supply.identity import alias_key, match_key

MAX_LINES = 2000
MAX_WATCH_LINES = 200
_NEEDS_A_LOOK = frozenset({"warning", "error", "fatal"})

NO_MPN, UNKNOWN, AMBIGUOUS, TRACKED = "no_mpn", "unknown", "ambiguous", "tracked"


@dataclass(frozen=True, slots=True)
class BomLine:
    key: str
    manufacturer: str
    mpn: str
    quantity: int  # per board, counting only parts that are fitted
    prism_id: str = ""  # the catalog component placed on the symbol


def _manufacturer_ids(conn, alias_keys: Iterable[str]) -> dict[str, str]:
    keys = sorted({key for key in alias_keys if key})
    if not keys:
        return {}
    found: dict[str, str] = {}
    for row in conn.execute("SELECT name_key, id FROM manufacturers WHERE name_key = ANY(%s)", (keys,)).fetchall():
        found[row["name_key"]] = row["id"]
    for row in conn.execute(
        "SELECT alias_key, manufacturer_id FROM manufacturer_aliases WHERE alias_key = ANY(%s) AND status = 'confirmed'",
        (keys,),
    ).fetchall():
        found[row["alias_key"]] = row["manufacturer_id"]
    return found


def _resolve(lines: Sequence[BomLine], conn) -> dict[str, tuple[str, str | None, str | None]]:
    """Per line key: (state, part id, how the manufacturer matched)."""

    keys = {line.key: (alias_key(line.manufacturer), match_key(line.mpn)) for line in lines}
    manufacturers = _manufacturer_ids(conn, (alias for alias, _ in keys.values()))
    wanted = sorted({number for _, number in keys.values() if number})
    by_number: dict[str, list[tuple[str, str]]] = {}
    if wanted:
        for row in conn.execute("SELECT id, manufacturer_id, match_key FROM parts WHERE match_key = ANY(%s)", (wanted,)).fetchall():
            by_number.setdefault(row["match_key"], []).append((row["id"], row["manufacturer_id"]))

    resolved: dict[str, tuple[str, str | None, str | None]] = {}
    for line in lines:
        alias, number = keys[line.key]
        if not number:
            resolved[line.key] = (NO_MPN, None, None)
            continue
        candidates = by_number.get(number, [])
        manufacturer_id = manufacturers.get(alias) if alias else None
        exact = [part_id for part_id, owner in candidates if owner == manufacturer_id] if manufacturer_id else []
        if exact:
            resolved[line.key] = (TRACKED, exact[0], "exact")
        elif len(candidates) == 1:
            resolved[line.key] = (TRACKED, candidates[0][0], "missing" if not alias else "unmatched")
        elif len(candidates) > 1:
            resolved[line.key] = (AMBIGUOUS, None, None)
        else:
            resolved[line.key] = (UNKNOWN, None, None)
    return resolved


def resolve_lines(lines: Sequence[BomLine], conn) -> dict[str, tuple[str, str | None, str | None]]:
    """Per line key: (state, part id, how the manufacturer matched). Reads only."""

    return _resolve(lines, conn)


def _best_purchase(offers: Sequence[Mapping[str, Any]], need: int) -> dict[str, Any] | None:
    """The cheapest single offer for ``need`` pieces, in one currency.

    Offers that hold enough stock win over cheaper ones that do not. Marketplace stock is not offered.
    """

    candidates = []
    for offer in offers:
        if offer["marketplace"] or not offer["currency"]:
            continue
        breaks = [(int(quantity), Decimal(price)) for quantity, price in offer["price_breaks"]]
        unit = pricing.unit_price_at(breaks, moq=offer["moq"], order_multiple=offer["order_multiple"], wanted=need)
        if unit is None:
            continue
        order = pricing.order_quantity(need, offer["moq"], offer["order_multiple"])
        candidates.append((offer["stock"] >= order, unit * order, unit, order, offer))
    if not candidates:
        return None
    if len({entry[4]["currency"] for entry in candidates}) != 1:
        return None  # nothing here converts currencies
    covered = [entry for entry in candidates if entry[0]]
    covers, extended, unit, order, offer = min(covered or candidates, key=lambda entry: entry[1])
    return {
        "quantity": order,
        "unit_price": format(unit.normalize(), "f"),
        "currency": offer["currency"],
        "extended": format(extended.quantize(Decimal("0.0001")).normalize(), "f"),
        "covers": covers,
        "connector_name": offer["connector_name"],
        "sku": offer["sku"],
        "product_url": offer["product_url"],
    }


def _lead_time(offers: Sequence[Mapping[str, Any]]) -> int | None:
    """The shortest lead time among offers holding stock, else among all."""

    in_stock = [o["lead_time_days"] for o in offers if o["lead_time_days"] is not None and o["stock"] > 0]
    anywhere = [o["lead_time_days"] for o in offers if o["lead_time_days"] is not None]
    pool = in_stock or anywhere
    return min(pool) if pool else None


def needed(per_board: int, build_quantity: int, attrition_percent: float = 0) -> int:
    """Units to have for a build: what the boards use, plus the spares attrition asks for, rounded up."""

    exact = Decimal(per_board * build_quantity) * (Decimal(100) + Decimal(str(attrition_percent))) / Decimal(100)
    return math.ceil(exact)


def with_library_identity(lines: Sequence[BomLine], identities: usage.Identities | None) -> list[BomLine]:
    """Lines whose ``prism_id`` the catalog knows take the library component's manufacturer and part number (6.4, step 1)."""

    library = identities({line.prism_id for line in lines if line.prism_id}) if identities else {}
    return [replace(line, manufacturer=library[line.prism_id][0], mpn=library[line.prism_id][1]) if line.prism_id in library else line for line in lines]


def lookup(
    conn, lines: Sequence[BomLine], build_quantity: int, attrition_percent: float = 0, identities: usage.Identities | None = None
) -> dict[str, Any]:
    if len(lines) > MAX_LINES:
        raise ValueError(f"At most {MAX_LINES} lines can be looked up at once.")
    lines = with_library_identity(lines, identities)
    resolved = _resolve(lines, conn)
    part_ids = sorted({part_id for _, part_id, _ in resolved.values() if part_id})
    items, offers = parts_view.summaries_with_offers(conn, part_ids)
    summary = {item["id"]: item for item in items}

    # Two lines can be one part (one names the manufacturer, one leaves it blank). The part is
    # checked against stock and bought once, for everything the lines need together.
    per_board: dict[str, int] = {}
    first_line: dict[str, str] = {}
    for line in lines:
        part_id = resolved[line.key][1]
        if part_id:
            per_board[part_id] = per_board.get(part_id, 0) + line.quantity
            first_line.setdefault(part_id, line.key)

    needs = {part_id: needed(count, build_quantity, attrition_percent) for part_id, count in per_board.items()}
    assessed = assessment.assess_summaries(conn, items, offers, needs, datetime.now(timezone.utc))

    results: dict[str, dict[str, Any]] = {}
    for line in lines:
        state, part_id, how = resolved[line.key]
        entry: dict[str, Any] = {"state": state, "part_id": part_id, "manufacturer_match": how, "need": needed(line.quantity, build_quantity, attrition_percent)}
        if part_id:
            item = summary[part_id]
            offers_here = offers.get(part_id, [])
            stock = item["stock"]
            part_need = needs[part_id]
            leader = first_line[part_id]
            entry |= {
                "watched": item["watch"] is not None,
                "status": item["status"],
                "problem": item["problem"],
                "stock": stock,
                "lifecycle": item["lifecycle"],
                "lead_time_days": _lead_time(offers_here),
                "fetched_at": item["fetched_at"],
                "part_need": part_need,
                "short": stock is not None and stock < part_need,
                # Only the first line of a part carries the purchase; the others say where it is.
                "buy": _best_purchase(offers_here, part_need) if line.key == leader else None,
                "bought_with": None if line.key == leader else leader,
                "assessment": _assessment_line(assessed[part_id]),
            }
        results[line.key] = entry
    return {
        "build_quantity": build_quantity,
        "attrition_percent": attrition_percent,
        "lines": results,
        "rollup": _rollup(lines, results, build_quantity, per_board, first_line, attrition_percent)
        | _health_rollup(assessed, needs),
    }


def _assessment_line(assessment_dto: Mapping[str, Any]) -> dict[str, Any]:
    """What a BOM row needs of an assessment: the number, the status and how many findings still stand."""

    open_findings = [f for f in assessment_dto["findings"] if not (f["waiver"] and f["waiver"]["holds"])]
    return {"health": assessment_dto["health"], "status": assessment_dto["status"], "open": len(open_findings)}


def _health_rollup(assessed: Mapping[str, Mapping[str, Any]], needs: Mapping[str, int]) -> dict[str, Any]:
    """BOM health: the mean of its parts weighted by units needed, capped when any part is fatal."""

    rolled = health_rules.rollup([(a["health"], needs.get(part_id, 1), Status(a["status"])) for part_id, a in assessed.items()])
    return {"health": rolled.score if rolled.status is not Status.UNKNOWN else None, "health_status": rolled.status.value}


def _rollup(
    lines: Sequence[BomLine],
    results: Mapping[str, Mapping[str, Any]],
    build_quantity: int,
    per_board: Mapping[str, int],
    first_line: Mapping[str, str],
    attrition_percent: float = 0,
) -> dict[str, Any]:
    """Counts of lines (``lines``, ``tracked``, ``not_tracked``, ``watched``) and of distinct parts
    (``at_risk``, ``short``, ``priced``, ``without_stock_data``);
    ``lines_priced`` is how many lines the cost covers, so one part on two lines counts once."""

    tracked = [results[line.key] for line in lines if results[line.key]["state"] == TRACKED]
    leaders = [results[key] for key in first_line.values()]
    priced = [entry["buy"] for entry in leaders if entry["buy"]]
    lines_priced = sum(1 for line in lines if results[line.key]["part_id"] and results[first_line[results[line.key]["part_id"]]]["buy"])
    currencies = {buy["currency"] for buy in priced}
    total = sum((Decimal(buy["extended"]) for buy in priced), Decimal(0)) if len(currencies) == 1 else None

    can_build = None
    limiting = None
    for part_id, key in first_line.items():
        stock = results[key]["stock"]
        if stock is None:
            continue
        # Boards the stock covers once the spares are set aside.
        possible = int(Decimal(stock) * 100 // (Decimal(per_board[part_id]) * (Decimal(100) + Decimal(str(attrition_percent)))))
        if can_build is None or possible < can_build:
            can_build, limiting = possible, key
    return {
        "lines": len(lines),
        "tracked": len(tracked),
        "not_tracked": len(lines) - len(tracked),
        "watched": sum(1 for entry in tracked if entry["watched"]),
        "at_risk": sum(1 for entry in leaders if entry["status"] in _NEEDS_A_LOOK),
        "short": sum(1 for entry in leaders if entry["short"]),
        "priced": len(priced),
        "lines_priced": lines_priced,
        "currency": next(iter(currencies)) if len(currencies) == 1 else None,
        "cost_build": format(total.quantize(Decimal("0.01")), "f") if total is not None else None,
        "cost_per_board": format((total / build_quantity).quantize(Decimal("0.0001")), "f") if total is not None else None,
        "can_build": can_build,
        "limited_by": limiting,
        "without_stock_data": sum(1 for entry in leaders if entry["stock"] is None),
        "parts": len(first_line),
    }


def watch_lines(
    conn, lines: Sequence[BomLine], actor: str, *, may_create_manufacturer: bool, identities: usage.Identities | None = None
) -> dict[str, Any]:
    """Watch every distinct part on the lines. Reports what it could not and why."""

    if len(lines) > MAX_WATCH_LINES:
        raise ValueError(f"At most {MAX_WATCH_LINES} lines can be watched at once.")
    lines = with_library_identity(lines, identities)
    seen: set[tuple[str, str]] = set()
    watched = already = 0
    skipped: list[dict[str, str]] = []
    for line in lines:
        mpn, maker = line.mpn.strip(), line.manufacturer.strip()
        if not match_key(mpn):
            skipped.append({"key": line.key, "reason": "no_mpn"})
            continue
        if not alias_key(maker):
            skipped.append({"key": line.key, "reason": "no_manufacturer"})
            continue
        identity = (alias_key(maker), match_key(mpn))
        if identity in seen:
            continue
        seen.add(identity)
        try:
            with conn.transaction():
                _record, created = watches.add_watch(conn, maker, mpn, actor, may_create_manufacturer=may_create_manufacturer)
        except parts.UnknownManufacturer:
            skipped.append({"key": line.key, "reason": "unknown_manufacturer"})
            continue
        watched += 1 if created else 0
        already += 0 if created else 1
    return {"watched": watched, "already_watched": already, "skipped": skipped}
