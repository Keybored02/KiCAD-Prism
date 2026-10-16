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

A line the steps above leave untracked, unknown or ambiguous, but whose symbol carries an LCSC number already
linked to a part, is that part. Watching a line with an LCSC number links that number to the part at the LCSC
connector, as a person's decision.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timezone
import math
import uuid
from decimal import Decimal
from typing import Any, Callable, Iterable, Mapping, Sequence

from app.services.supply import attrition, fx, parts, parts_view, pricing, usage, watches
from app.services.supply.assessment import component_checks, line_checks, settings_store
from app.services.supply.assessment import health as health_rules
from app.services.supply.assessment import service as assessment
from app.services.supply.audit import write_audit
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
    lcsc: str = ""  # the LCSC number the symbol carries, such as C7950
    value: str = ""  # the symbol's value, such as 10k, checked against the distributor's
    footprint: str = ""  # the footprint's name, whose size (0603) is checked against the distributor's package


LCSC_PROVIDER = "lcsc"
LCSC_REASON = "LCSC number on the BOM"


def _by_lcsc(conn, numbers: Iterable[str]) -> dict[str, str]:
    """Part id per LCSC number, for numbers already linked to a part at an LCSC connector."""

    wanted = sorted({number for number in numbers if number})
    if not wanted:
        return {}
    rows = conn.execute(
        "SELECT l.sku, l.part_id FROM listings l JOIN connectors c ON c.id = l.connector_id "
        "WHERE c.provider = %s AND l.sku = ANY(%s) AND l.match_state IN ('exact', 'manual') AND l.part_id IS NOT NULL",
        (LCSC_PROVIDER, wanted),
    ).fetchall()
    return {row["sku"]: row["part_id"] for row in rows}


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

    spelled: dict[str, set[str]] = {}
    for part_ids in by_number.values():
        for row in conn.execute("SELECT part_id, alias_key FROM part_spellings WHERE part_id = ANY(%s)", ([part_id for part_id, _ in part_ids],)).fetchall():
            spelled.setdefault(row["part_id"], set()).add(row["alias_key"])

    resolved: dict[str, tuple[str, str | None, str | None]] = {}
    for line in lines:
        alias, number = keys[line.key]
        if not number:
            resolved[line.key] = (NO_MPN, None, None)
            continue
        candidates = by_number.get(number, [])
        manufacturer_id = manufacturers.get(alias) if alias else None
        exact = [part_id for part_id, owner in candidates if owner == manufacturer_id] if manufacturer_id else []
        if not exact and alias:
            exact = [part_id for part_id, _owner in candidates if alias in spelled.get(part_id, ())]
        if exact:
            resolved[line.key] = (TRACKED, exact[0], "exact")
        elif len(candidates) == 1:
            resolved[line.key] = (TRACKED, candidates[0][0], "missing" if not alias else "unmatched")
        elif len(candidates) > 1:
            resolved[line.key] = (AMBIGUOUS, None, None)
        else:
            resolved[line.key] = (UNKNOWN, None, None)
    # A line the numbers could not settle is still the part its LCSC number is linked to.
    unsettled = [line for line in lines if resolved[line.key][0] != TRACKED and line.lcsc]
    linked = _by_lcsc(conn, (line.lcsc for line in unsettled))
    for line in unsettled:
        if line.lcsc in linked:
            resolved[line.key] = (TRACKED, linked[line.lcsc], "lcsc")
    return resolved


def resolve_lines(lines: Sequence[BomLine], conn) -> dict[str, tuple[str, str | None, str | None]]:
    """Per line key: (state, part id, how the manufacturer matched). Reads only."""

    return _resolve(lines, conn)


def _best_purchase(
    offers: Sequence[Mapping[str, Any]], need: int, rates: fx.Rates | None = None, base: str = "EUR"
) -> dict[str, Any] | None:
    """The cheapest single offer for ``need`` pieces.

    Offers that hold enough stock win over cheaper ones that do not. Marketplace stock is not offered.
    Offers in different currencies are compared in ``base`` when the rates allow it, and not at all
    when they do not. ``in_base`` is the chosen offer's extended price in ``base``, if it can be told.
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

    def in_base(extended: Decimal, currency: str) -> Decimal | None:
        return rates.convert(extended, currency, base) if rates is not None else (extended if currency == base else None)

    mixed = len({entry[4]["currency"] for entry in candidates}) != 1
    if mixed:
        priced = [(entry, in_base(entry[1], entry[4]["currency"])) for entry in candidates]
        if any(value is None for _, value in priced):
            return None  # a rate is missing, so the offers cannot be compared
        candidates = [entry for entry, _ in sorted(priced, key=lambda pair: pair[1])]
        sort_key = lambda entry: in_base(entry[1], entry[4]["currency"])  # noqa: E731
    else:
        sort_key = lambda entry: entry[1]  # noqa: E731
    covered = [entry for entry in candidates if entry[0]]
    covers, extended, unit, order, offer = min(covered or candidates, key=sort_key)
    converted = in_base(extended, offer["currency"])
    spare = order - need
    return {
        # Pieces bought beyond the need because of the smallest order and its multiples, and what they cost.
        "waste": spare,
        "waste_cost": format((unit * spare).quantize(Decimal("0.0001")).normalize(), "f") if spare > 0 else "0",
        "next_break": _next_break(offer, order, extended),
        "in_base": format(converted.quantize(Decimal("0.0001")).normalize(), "f") if converted is not None else None,
        "quantity": order,
        "unit_price": format(unit.normalize(), "f"),
        "currency": offer["currency"],
        "extended": format(extended.quantize(Decimal("0.0001")).normalize(), "f"),
        "covers": covers,
        "connector_name": offer["connector_name"],
        "provider": offer["provider"],
        "sku": offer["sku"],
        "product_url": offer["product_url"],
    }


def _next_break(offer: Mapping[str, Any], order: int, extended: Decimal) -> dict[str, Any] | None:
    """The next price break above the order, and what buying that many would cost in total against the order. Negative
    ``extra`` means buying more is cheaper in total."""

    for quantity, price in sorted((int(q), Decimal(p)) for q, p in offer["price_breaks"]):
        if quantity > order:
            total = price * pricing.order_quantity(quantity, offer["moq"], offer["order_multiple"])
            return {
                "quantity": quantity, "unit_price": format(price.normalize(), "f"),
                "extra": format((total - extended).quantize(Decimal("0.0001")).normalize(), "f"),
            }
    return None


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


def library_identities(lines: Sequence[BomLine], identities: usage.Identities | None) -> dict[str, tuple[str, str]]:
    """Manufacturer and part number of the catalog components the lines name. A component without a part number is left out."""

    wanted = {line.prism_id for line in lines if line.prism_id}
    found = identities(wanted) if identities and wanted else {}
    return {component_id: identity for component_id, identity in found.items() if identity[1].strip()}


def with_library_identity(lines: Sequence[BomLine], library: Mapping[str, tuple[str, str]]) -> list[BomLine]:
    """Lines whose ``prism_id`` the catalog knows take the library component's manufacturer and part number (6.4, step 1)."""

    return [replace(line, manufacturer=library[line.prism_id][0], mpn=library[line.prism_id][1]) if line.prism_id in library else line for line in lines]


def lookup(
    conn,
    lines: Sequence[BomLine],
    build_quantity: int,
    attrition_percent: float | None = 0,
    identities: usage.Identities | None = None,
    in_library: Callable[[Iterable[tuple[str, str]]], set[tuple[str, str]]] | None = None,
) -> dict[str, Any]:
    if len(lines) > MAX_LINES:
        raise ValueError(f"At most {MAX_LINES} lines can be looked up at once.")
    known = library_identities(lines, identities)
    lines = with_library_identity(lines, known)
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

    # `None` asks for spares by kind of part, taken from the footprint on the part's first line; a number is for every part.
    by_key = {line.key: line for line in lines}
    percents = {
        part_id: attrition.percent_for(by_key[first_line[part_id]].footprint) if attrition_percent is None else attrition_percent
        for part_id in per_board
    }
    needs = {part_id: needed(count, build_quantity, percents[part_id]) for part_id, count in per_board.items()}
    settings = settings_store.load(conn)
    extras: dict[str, list] = {}
    for component_id in sorted({line.prism_id for line in lines if line.prism_id in known}):
        # The part on the line is the component's own part; alternates and the rest are judged with it.
        leader = next(resolved[line.key][1] for line in lines if line.prism_id == component_id)
        if leader:
            extras.setdefault(leader, []).extend(component_checks.for_component(conn, component_id, leader, settings))
    _line_findings(conn, lines, resolved, summary, first_line, set(known), in_library, settings, extras)
    assessed = assessment.assess_summaries(conn, items, offers, needs, datetime.now(timezone.utc), settings, extras)

    rates = fx.latest(conn)
    results: dict[str, dict[str, Any]] = {}
    for line in lines:
        state, part_id, how = resolved[line.key]
        entry: dict[str, Any] = {"state": state, "part_id": part_id, "manufacturer_match": how, "need": needed(line.quantity, build_quantity, percents.get(part_id, attrition_percent or 0) if part_id else (attrition_percent or 0))}
        if part_id:
            item = summary[part_id]
            offers_here = offers.get(part_id, [])
            stock = item["stock"]
            part_need = needs[part_id]
            leader = first_line[part_id]
            entry |= {
                "watched": item["tracking"] is not None,
                "jlc": item.get("jlc"),
                "status": item["status"],
                "problem": item["problem"],
                "stock": stock,
                "lifecycle": item["lifecycle"],
                "lead_time_days": _lead_time(offers_here),
                "fetched_at": item["fetched_at"],
                "part_need": part_need,
                "short": stock is not None and stock < part_need,
                # Only the first line of a part carries the purchase; the others say where it is.
                "buy": _best_purchase(offers_here, part_need, rates, settings.base_currency) if line.key == leader else None,
                "bought_with": None if line.key == leader else leader,
                "assessment": _assessment_line(assessed[part_id]),
            }
        results[line.key] = entry
    return {
        "build_quantity": build_quantity,
        "attrition_percent": attrition_percent,
        "attrition_by_part": percents if attrition_percent is None else None,
        "lines": results,
        "rollup": _rollup(lines, results, build_quantity, per_board, first_line, percents, rates, settings.base_currency)
        | _health_rollup(assessed, needs),
    }


def _line_findings(conn, lines, resolved, summary, first_line, placed, in_library, settings, extras) -> None:
    """Add what the way a line names its part says: a missing manufacturer, a part the library does not have."""

    by_key = {line.key: line for line in lines}
    leaders = {part_id: by_key[key] for part_id, key in first_line.items()}
    for part_id, line in leaders.items():
        if resolved[line.key][2] == "missing":
            extras.setdefault(part_id, []).append(line_checks.manufacturer_missing(settings))
    for part_id, line in leaders.items():
        if line.value or line.footprint:
            listed = parts_view.parameters_of(conn, part_id)
            for found in (line_checks.parameter_mismatch(line.value, listed, settings), line_checks.package_mismatch(line.footprint, listed, settings)):
                if found:
                    extras.setdefault(part_id, []).append(found)
    if in_library is None:
        return
    unplaced = {part_id: line for part_id, line in leaders.items() if line.prism_id not in placed}
    have = in_library((summary[part_id]["manufacturer"], summary[part_id]["mpn"]) for part_id in unplaced)
    for part_id in unplaced:
        pair = (str(summary[part_id]["manufacturer"]).strip().casefold(), str(summary[part_id]["mpn"]).strip().casefold())
        if pair not in have:
            extras.setdefault(part_id, []).append(line_checks.not_in_library(settings))


def _assessment_line(assessment_dto: Mapping[str, Any]) -> dict[str, Any]:
    """What a BOM row needs of an assessment: the number, the status, and which findings still stand."""

    open_findings = [f for f in assessment_dto["findings"] if not (f["waiver"] and f["waiver"]["holds"])]
    return {
        "health": assessment_dto["health"],
        "status": assessment_dto["status"],
        "open": len(open_findings),
        "checks": [f["check"] for f in open_findings],
    }


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
    percents: Mapping[str, float],
    rates: fx.Rates | None = None,
    base: str = "EUR",
) -> dict[str, Any]:
    """Counts of lines (``lines``, ``tracked``, ``not_tracked``, ``watched``) and of distinct parts
    (``at_risk``, ``short``, ``priced``, ``without_stock_data``);
    ``lines_priced`` is how many lines the cost covers, so one part on two lines counts once."""

    tracked = [results[line.key] for line in lines if results[line.key]["state"] == TRACKED]
    leaders = [results[key] for key in first_line.values()]
    priced = [entry["buy"] for entry in leaders if entry["buy"]]
    lines_priced = sum(1 for line in lines if results[line.key]["part_id"] and results[first_line[results[line.key]["part_id"]]]["buy"])
    currencies = {buy["currency"] for buy in priced}
    converted = False
    if len(currencies) == 1:
        total = sum((Decimal(buy["extended"]) for buy in priced), Decimal(0))
        shown_currency: str | None = next(iter(currencies))
    elif priced and all(buy["in_base"] is not None for buy in priced):
        total = sum((Decimal(buy["in_base"]) for buy in priced), Decimal(0))
        shown_currency, converted = base, True
    else:
        total, shown_currency = None, None

    # What the rounding to smallest orders and multiples buys beyond the need, in the total's currency.
    waste: Decimal | None = Decimal(0) if total is not None else None
    for buy in priced:
        if waste is None or Decimal(buy["extended"]) <= 0 or buy["waste"] <= 0:
            continue
        figure = Decimal(buy["in_base"] if converted else buy["extended"]) if (buy["in_base"] is not None or not converted) else None
        if figure is None:
            waste = None
            break
        waste += figure * Decimal(buy["waste_cost"]) / Decimal(buy["extended"])

    can_build = None
    limiting = None
    for part_id, key in first_line.items():
        stock = results[key]["stock"]
        if stock is None:
            continue
        # Boards the stock covers once the spares are set aside.
        possible = int(Decimal(stock) * 100 // (Decimal(per_board[part_id]) * (Decimal(100) + Decimal(str(percents[part_id])))))
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
        "currency": shown_currency,
        "converted": converted,
        "rates_day": rates.day.isoformat() if converted and rates is not None and rates.day else None,
        "cost_build": format(total.quantize(Decimal("0.01")), "f") if total is not None else None,
        # What the total is made of before conversion, per currency the offers are quoted in. Empty when nothing was converted.
        "original_costs": (
            {code: format(sum((Decimal(buy["extended"]) for buy in priced if buy["currency"] == code), Decimal(0)).quantize(Decimal("0.01")), "f")
             for code in sorted(currencies)}
            if converted else {}
        ),
        "waste_cost": format(waste.quantize(Decimal("0.01")), "f") if waste is not None else None,
        "cost_per_board": format((total / build_quantity).quantize(Decimal("0.0001")), "f") if total is not None else None,
        "can_build": can_build,
        "limited_by": limiting,
        "without_stock_data": sum(1 for entry in leaders if entry["stock"] is None),
        "parts": len(first_line),
    }


def build_needs(
    conn, lines: Sequence[BomLine], build_quantity: int, attrition_percent: float | None = 0, identities: usage.Identities | None = None
) -> dict[str, int]:
    """Units of each tracked part a build needs (spares included), by part id. Lines that resolve to no part are left out."""

    lines = with_library_identity(lines, library_identities(lines, identities))
    resolved = _resolve(lines, conn)
    per_board: dict[str, int] = {}
    first_footprint: dict[str, str] = {}
    for line in lines:
        state, part_id, _how = resolved[line.key]
        if state == TRACKED and part_id:
            per_board[part_id] = per_board.get(part_id, 0) + line.quantity
            first_footprint.setdefault(part_id, line.footprint)
    return {
        part_id: needed(count, build_quantity, attrition.percent_for(first_footprint[part_id]) if attrition_percent is None else attrition_percent)
        for part_id, count in per_board.items()
    }


def standing_of(conn, lines: Sequence[BomLine]) -> dict[str, dict[str, Any]]:
    """Status, stock and whether it is watched, per line key, for the lines that resolve to a tracked part. Reads only."""

    resolved = _resolve(lines, conn)
    part_ids = sorted({part_id for state, part_id, _ in resolved.values() if state == TRACKED and part_id})
    summary = {item["id"]: item for item in parts_view.summaries_for(conn, part_ids)} if part_ids else {}
    return {
        key: {"status": summary[part_id]["status"], "stock": summary[part_id]["stock"], "watched": summary[part_id]["tracking"] is not None}
        for key, (state, part_id, _how) in resolved.items()
        if state == TRACKED and part_id in summary
    }


def _link_lcsc(conn, connector_id: str, sku: str, part_id: str, mpn: str, manufacturer: str, actor: str) -> bool:
    """Link an LCSC number to a part, unless the number is already linked. True when a listing was added."""

    listing_id = uuid.uuid4().hex
    created = conn.execute(
        """
        INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state, match_reason, matched_by)
        VALUES (%s, %s, %s, %s, %s, %s, 'manual', %s, 'bom')
        ON CONFLICT (connector_id, sku) DO NOTHING RETURNING id
        """,
        (listing_id, connector_id, sku, part_id, mpn, manufacturer, LCSC_REASON),
    ).fetchone()
    if created:
        write_audit(conn, actor, "listing.seed", listing_id,
                    {"part_id": part_id, "connector_id": connector_id, "sku": sku, "source": "bom"}, subject_kind="listing")
    return created is not None


def watch_lines(
    conn, lines: Sequence[BomLine], actor: str, *, may_create_manufacturer: bool, identities: usage.Identities | None = None,
    lcsc_connector: str | None = None, tier: int | None = None, rate: str | None = None,
) -> dict[str, Any]:
    """Watch every distinct part on the lines at a tier (tier 2 weekly when none is asked). Reports what it could not and why.

    With ``lcsc_connector``, a line's LCSC number is linked to its part there, so it is read without a search.
    """

    if len(lines) > MAX_WATCH_LINES:
        raise ValueError(f"At most {MAX_WATCH_LINES} lines can be watched at once.")
    lines = with_library_identity(lines, library_identities(lines, identities))
    seen: set[tuple[str, str]] = set()
    watched = already = linked = 0
    skipped: list[dict[str, str]] = []
    for line in lines:
        mpn, maker = line.mpn.strip(), line.manufacturer.strip()
        if not match_key(mpn):
            skipped.append({"key": line.key, "reason": "no_mpn"})
            continue
        identity = (alias_key(maker), match_key(mpn))
        if identity in seen:
            continue
        seen.add(identity)
        try:
            with conn.transaction():
                record, created = watches.add_watch(conn, maker, mpn, actor, tier=tier, rate=rate, may_create_manufacturer=may_create_manufacturer)
                if lcsc_connector and line.lcsc:
                    linked += _link_lcsc(conn, lcsc_connector, line.lcsc, record.part_id, mpn, maker, actor)
        except parts.UnknownManufacturer:
            skipped.append({"key": line.key, "reason": "needs_choice"})
            continue
        watched += 1 if created else 0
        already += 0 if created else 1
    return {"watched": watched, "already_watched": already, "lcsc_linked": linked, "skipped": skipped}
