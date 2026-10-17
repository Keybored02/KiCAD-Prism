"""The risk views of the Dashboard and Insights: where the risk sits, the dates that cannot be missed, who carries the BOM.

Industry practice (SiliconExpert, Z2Data, Altium BOM Portal) puts risk on a grid of lifecycle against availability, keeps a
calendar of last-time-buy and last-ship dates, and counts how many distributors carry the parts. Unknown is always its own
category and never folded into "fine". Reads only, from the summaries, the facts kept in ``part_insights`` and the facts distributors state.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from typing import Any, Mapping, Sequence

from app.services.supply import facts, parts_view, trade

LIFECYCLES = ("active", "nrnd", "last_time_buy", "obsolete", "unknown")
AVAILABILITY = ("two_plus", "one", "out", "not_read")
DEADLINE_DAYS = 365
DEADLINE_LIMIT = 40
LEAD_BUCKETS = (("under_2w", 14), ("2_to_8w", 56), ("8_to_16w", 112), ("16_to_26w", 182))
MOVERS = 8
ORIGINS = 12
CONTROLLED_LIMIT = 20


def availability_of(item: Mapping[str, Any], held: Mapping[str, Any] | None) -> str:
    """Where a part stands for supply: nothing read, out, held by one distributor, or by two or more."""

    if item["stock"] is None:
        return "not_read"
    if item["stock"] == 0:
        return "out"
    holders = (held or {}).get("holders")
    return "two_plus" if holders is not None and holders >= 2 else "one"


def risk_grid(items: Sequence[Mapping[str, Any]], kept: Mapping[str, Mapping[str, Any]]) -> list[dict[str, Any]]:
    """Lifecycle against availability, one row per lifecycle, every cell a count of parts."""

    cells: dict[str, Counter[str]] = {name: Counter() for name in LIFECYCLES}
    for item in items:
        lifecycle = item["lifecycle"] if item["lifecycle"] in cells else "unknown"
        cells[lifecycle][availability_of(item, kept.get(item["id"]))] += 1
    return [{"lifecycle": name, **{column: cells[name].get(column, 0) for column in AVAILABILITY}} for name in LIFECYCLES]


def _day(text: str) -> date | None:
    try:
        return date.fromisoformat(text.strip()[:10])
    except ValueError:
        return None


def deadlines(conn, tracked: Sequence[str], today: date) -> list[dict[str, Any]]:
    """Last-time-buy and last-ship dates of open notices and the last date to buy a distributor gives, in the next year, soonest first."""

    if not tracked:
        return []
    until = today + timedelta(days=DEADLINE_DAYS)
    found: list[dict[str, Any]] = []
    for row in conn.execute(
        """
        SELECT n.title, n.last_time_buy, n.last_time_ship, n.notice_url, pp.part_id, p.mpn, m.name AS manufacturer
        FROM pcns n JOIN pcn_parts pp ON pp.pcn_id = n.id JOIN parts p ON p.id = pp.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE n.state = 'open' AND pp.part_id = ANY(%s) AND (n.last_time_buy IS NOT NULL OR n.last_time_ship IS NOT NULL)
        """,
        (list(tracked),),
    ).fetchall():
        for kind, when in (("last_time_buy", row["last_time_buy"]), ("last_time_ship", row["last_time_ship"])):
            if when and today <= when <= until:
                found.append({"part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"], "kind": kind, "date": when.isoformat(), "source": "notice", "url": row["notice_url"]})
    for row in conn.execute(
        """
        SELECT f.part_id, f.provider, f.value, p.mpn, m.name AS manufacturer
        FROM part_facts f JOIN parts p ON p.id = f.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE f.name = 'last_buy_date' AND f.part_id = ANY(%s)
        """,
        (list(tracked),),
    ).fetchall():
        when = _day(row["value"])
        if when and today <= when <= until:
            found.append({"part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"], "kind": "last_buy_date", "date": when.isoformat(), "source": row["provider"], "url": ""})
    found.sort(key=lambda item: (item["date"], item["mpn"].lower()))
    seen: set[tuple[str, str, str]] = set()
    unique = []
    for item in found:
        key = (item["part_id"], item["kind"], item["date"])
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique[:DEADLINE_LIMIT]


def coverage(conn, items: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """For each distributor: how many of the tracked parts it lists, holds in stock, and is the cheapest for."""

    ids = [item["id"] for item in items]
    offers = parts_view.offers_by_part(conn, ids)
    listed: Counter[str] = Counter()
    held: Counter[str] = Counter()
    cheapest: Counter[str] = Counter()
    names: dict[str, tuple[str, str]] = {}
    for part_id in ids:
        here = [offer for offer in offers.get(part_id, []) if not offer["marketplace"]]
        by_connector: dict[str, dict[str, Any]] = {}
        for offer in here:
            names[offer["connector_id"]] = (offer["connector_name"], offer["provider"])
            entry = by_connector.setdefault(offer["connector_id"], {"stock": 0, "price": None, "currency": ""})
            entry["stock"] += int(offer["stock"] or 0)
            price, currency, _qty = parts_view._cheapest([offer])  # noqa: SLF001
            if price is not None and (entry["price"] is None or float(price) < entry["price"]):
                entry["price"], entry["currency"] = float(price), currency
        for connector_id, entry in by_connector.items():
            listed[connector_id] += 1
            held[connector_id] += 1 if entry["stock"] > 0 else 0
        priced = {cid: entry for cid, entry in by_connector.items() if entry["price"] is not None}
        if len({entry["currency"] for entry in priced.values()}) == 1 and len(priced) > 1:
            best = min(entry["price"] for entry in priced.values())
            for connector_id, entry in priced.items():
                cheapest[connector_id] += 1 if entry["price"] == best else 0
    return sorted(
        ({"connector_id": cid, "name": names[cid][0], "provider": names[cid][1], "tracked": len(ids), "listed": listed[cid], "in_stock": held[cid], "cheapest": cheapest[cid]} for cid in listed),
        key=lambda item: -item["listed"],
    )


def lifecycle_mix(items: Sequence[Mapping[str, Any]]) -> dict[str, int]:
    counts = Counter(item["lifecycle"] if item["lifecycle"] in LIFECYCLES else "unknown" for item in items)
    return {name: counts.get(name, 0) for name in LIFECYCLES}


def outlook_bands(rows: Sequence[Mapping[str, Any]]) -> dict[str, int]:
    from app.services.supply import outlook

    counts = Counter(row.get("outlook_band") or outlook.UNKNOWN for row in rows)
    return {name: counts.get(name, 0) for name in (outlook.ENDED, outlook.UNDER_TWO, outlook.TWO_TO_FIVE, outlook.NO_SIGNS, outlook.UNKNOWN)}


def compliance(conn, tracked: Sequence[str]) -> dict[str, dict[str, int]]:
    """RoHS and REACH by what distributors state: any one saying no wins, then a yes, else unknown."""

    rohs: dict[str, set[str]] = defaultdict(set)
    reach: dict[str, set[str]] = defaultdict(set)
    if tracked:
        for row in conn.execute(
            "SELECT part_id, name, value FROM part_facts WHERE name IN ('rohs_status', 'reach_status') AND part_id = ANY(%s)", (list(tracked),)
        ).fetchall():
            (rohs if row["name"] == "rohs_status" else reach)[row["part_id"]].add(facts.rohs_class(row["value"]) if row["name"] == "rohs_status" else facts.reach_class(row["value"]))

    def verdict(classes: set[str], bad: str, good: tuple[str, ...]) -> str:
        if bad in classes:
            return bad
        for name in good:
            if name in classes:
                return "compliant" if name.startswith("compliant") or name == "unaffected" else name
        return "unknown"

    rohs_counts = Counter(verdict(rohs.get(part_id, set()), "not_compliant", ("compliant", "compliant_exemption", "not_applicable")) for part_id in tracked)
    reach_counts = Counter(verdict(reach.get(part_id, set()), "affected", ("unaffected", "not_applicable")) for part_id in tracked)
    return {
        "rohs": {name: rohs_counts.get(name, 0) for name in ("compliant", "not_compliant", "not_applicable", "unknown")},
        "reach": {name: reach_counts.get(name, 0) for name in ("compliant", "affected", "not_applicable", "unknown")},
    }


def lead_histogram(rows: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """The shortest quoted lead time of each part in buckets of weeks; parts that give none are counted apart."""

    counts: Counter[str] = Counter()
    for row in rows:
        days = row.get("lead_days")
        if not days:
            counts["none"] += 1
            continue
        counts[next((name for name, limit in LEAD_BUCKETS if days <= limit), "over_26w")] += 1
    return [{"bucket": name, "parts": counts.get(name, 0)} for name in [*(name for name, _ in LEAD_BUCKETS), "over_26w", "none"]]


def price_movers(rows: Sequence[Mapping[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """The parts whose cheapest price moved most over 30 days, up and down."""

    moved = [row for row in rows if row.get("price_change_percent")]

    def pick(row: Mapping[str, Any]) -> dict[str, Any]:
        return {"part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"], "percent": row["price_change_percent"]}

    up = sorted((row for row in moved if row["price_change_percent"] > 0), key=lambda row: -row["price_change_percent"])
    down = sorted((row for row in moved if row["price_change_percent"] < 0), key=lambda row: row["price_change_percent"])
    return {"up": [pick(row) for row in up[:MOVERS]], "down": [pick(row) for row in down[:MOVERS]]}


def trade_overview(conn, tracked: Sequence[str]) -> dict[str, Any]:
    """Where the tracked parts come from and which are export controlled. A person's mark wins over what distributors state."""

    if not tracked:
        return {"origins": [], "other_origins": 0, "control": {"controlled": 0, "none": 0, "disputed": 0, "unknown": 0}, "controlled": []}
    origins: dict[str, set[str]] = defaultdict(set)
    eccn: dict[str, set[str]] = defaultdict(set)
    for row in conn.execute("SELECT part_id, name, value FROM part_facts WHERE name IN ('origin_country', 'eccn') AND part_id = ANY(%s)", (list(tracked),)).fetchall():
        (origins if row["name"] == "origin_country" else eccn)[row["part_id"]].add(row["value"].strip())
    marks = {row["part_id"]: row for row in conn.execute("SELECT part_id, control, eccn FROM part_trade_marks WHERE part_id = ANY(%s)", (list(tracked),)).fetchall()}
    names = {row["id"]: (row["mpn"], row["manufacturer"]) for row in conn.execute(
        "SELECT p.id, p.mpn, m.name AS manufacturer FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id WHERE p.id = ANY(%s)", (list(tracked),)).fetchall()}
    country: Counter[str] = Counter()
    control: Counter[str] = Counter()
    controlled = []
    for part_id in tracked:
        found = {value for value in origins.get(part_id, set()) if value}
        country[sorted(found)[0] if len(found) == 1 else ("Several" if found else "Unknown")] += 1
        mark = marks.get(part_id)
        if mark:
            state, code = ("controlled", mark["eccn"]) if mark["control"] == "controlled" else ("none", "")
        else:
            classes = {value for value in eccn.get(part_id, set()) if value}
            state = trade.control_of(sorted(classes))
            code = ", ".join(sorted(classes)) if state in ("controlled", "disputed") else ""
        control[state] += 1
        if state in ("controlled", "disputed") and len(controlled) < CONTROLLED_LIMIT:
            controlled.append({"part_id": part_id, "mpn": names.get(part_id, ("", ""))[0], "manufacturer": names.get(part_id, ("", ""))[1], "eccn": code, "state": state, "by_person": part_id in marks})
    top = [(name, count) for name, count in country.most_common() if name not in ("Unknown", "Several")][:ORIGINS]
    shown = {name for name, _ in top}
    return {
        "origins": [{"country": name, "parts": count} for name, count in top] + [{"country": name, "parts": country[name]} for name in ("Several", "Unknown") if country.get(name)],
        "other_origins": sum(count for name, count in country.items() if name not in shown and name not in ("Unknown", "Several")),
        "control": {name: control.get(name, 0) for name in ("controlled", "none", "disputed", "unknown")},
        "controlled": controlled,
    }


def today() -> date:
    return datetime.now().date()
