"""Alternatives for a part, graded by how close they are, from what Prism already holds.

A candidate is another part in the same distributor category whose parameters match. Three grades:

* ``direct``: the same package, the same value, and every other parameter both parts list is the same, or better where more is
  better (voltage, power, current) or tighter where less is better (tolerance).
* ``form_fit_function``: the same package and the same value, but a parameter differs or is not listed for one of them.
* ``functional``: the same value in another package. It does the job; the board has to change.

The manufacturer's own suggestion (a fact distributors give, such as Mouser's ``SuggestedReplacement``) is listed as it was
written, beside the graded ones. This compares what distributors say, nothing about the footprint or pins: a person checks
those before an alternate is approved. A candidate is proposed as an alternate of a catalog component the usual way, and
approving it stays with QA.
"""

from __future__ import annotations

import re
from decimal import Decimal
from typing import Any, Mapping

from app.services.supply import alternates, facts, parts_view

MAX_CANDIDATES = 12
MAX_POOL = 300
EXACT_TOLERANCE = Decimal("0.001")
# The values that make a part what it is. Candidates must match every one the part lists.
CORE = ("resistance", "capacitance", "inductance", "output_voltage", "positions", "rows", "pitch", "core")
# More is at least as good.
AT_LEAST = ("voltage_rating", "power_rating", "input_voltage_max", "output_current", "clock", "flash", "ram", "io_count")
# Less is at least as good.
AT_MOST = ("tolerance",)
TEXT = ("dielectric", "regulator_type", "mounting")
IGNORED = ("temperature_range", "supply_voltage")
GRADES = ("direct", "form_fit_function", "functional")
GRADE_LABEL = {"direct": "Direct replacement", "form_fit_function": "Same form, fit and function", "functional": "Same function, other package"}
_CODE = re.compile(r"(?<!\d)(01005|0201|0402|0603|0805|1206|1210|1812|2010|2512)(?!\d)")


def package_key(raw: str) -> str:
    """The package as comparable text: the imperial size code when there is one, else the text lower case."""

    found = _CODE.search(raw)
    return found.group(1) if found else re.sub(r"\s+", " ", raw.strip().lower())


def _same(left: Decimal, right: Decimal) -> bool:
    return left == right or abs(left - right) / max(abs(left), abs(right)) <= EXACT_TOLERANCE


def grade(base: Mapping[str, Mapping[str, Any]], other: Mapping[str, Mapping[str, Any]]) -> dict[str, Any] | None:
    """How close ``other`` is to ``base``, or None when it is not an alternative. Both map a canonical key to ``{"value", "raw"}``."""

    core = [key for key in CORE if key in base]
    if not core:
        return None
    for key in core:
        mine, theirs = base[key].get("value"), other.get(key, {}).get("value")
        if key == "core":
            if base[key]["raw"].strip().lower() != other.get(key, {}).get("raw", "").strip().lower():
                return None
        elif mine is None or theirs is None or not _same(mine, theirs):
            return None
    same: list[str] = [key for key in core]
    differs: list[str] = []
    for key in (*AT_LEAST, *AT_MOST, *TEXT):
        if key not in base or key not in other:
            continue
        mine, theirs = base[key].get("value"), other[key].get("value")
        if key in TEXT or mine is None or theirs is None:
            ok = base[key]["raw"].strip().lower() == other[key]["raw"].strip().lower()
        elif key in AT_MOST:
            ok = theirs <= mine or _same(mine, theirs)
        else:
            ok = theirs >= mine or _same(mine, theirs)
        (same if ok else differs).append(key)
    package_known = "package" in base and "package" in other
    package_same = package_known and package_key(base["package"]["raw"]) == package_key(other["package"]["raw"])
    if package_known and not package_same:
        return {"grade": "functional", "same": same, "differs": [*differs, "package"]}
    if package_same and not differs and len(same) + 1 >= 3:
        return {"grade": "direct", "same": [*same, "package"], "differs": []}
    return {"grade": "form_fit_function", "same": [*same, *(["package"] if package_same else [])], "differs": differs}


def _signature(conn, part_id: str) -> dict[str, dict[str, Any]]:
    return {
        item["key"]: {"value": Decimal(item["value"]) if item["value"] is not None else None, "raw": item["raw"]}
        for item in parts_view.parameters_of(conn, part_id) if item["key"]
    }


def _categories(conn, part_id: str) -> list[str]:
    return [
        row["value"].strip().lower() for row in conn.execute(
            "SELECT value FROM supply_part_facts WHERE part_id = %s AND name = 'category'", (part_id,)
        ).fetchall() if row["value"].strip()
    ]


def candidates(conn, part_id: str, limit: int = MAX_CANDIDATES) -> dict[str, Any]:
    """Graded alternatives to a part, and the manufacturer's own suggestion if a distributor gave one."""

    base = _signature(conn, part_id)
    suggested = [
        source["value"] for fact in facts.for_part(conn, part_id) if fact["name"] == "suggested_replacement" for source in fact["sources"]
    ]
    found: list[dict[str, Any]] = []
    categories = _categories(conn, part_id)
    if categories and any(key in base for key in CORE):
        pool = conn.execute(
            """
            SELECT DISTINCT p.id FROM supply_parts p JOIN supply_part_facts f ON f.part_id = p.id
            WHERE f.name = 'category' AND lower(trim(f.value)) = ANY(%s) AND p.id <> %s LIMIT %s
            """,
            (categories, part_id, MAX_POOL),
        ).fetchall()
        standing = {item["id"]: item for item in parts_view.summaries_for(conn, [row["id"] for row in pool])}
        for row in pool:
            verdict = grade(base, _signature(conn, row["id"]))
            if verdict is None:
                continue
            item = standing[row["id"]]
            found.append({
                "part_id": row["id"], "manufacturer": item["manufacturer"], "mpn": item["mpn"], "grade": verdict["grade"],
                "grade_label": GRADE_LABEL[verdict["grade"]], "same": verdict["same"], "differs": verdict["differs"],
                "stock": item["stock"], "status": item["status"], "lifecycle": item["lifecycle"],
            })
    found.sort(key=lambda entry: (GRADES.index(entry["grade"]), -(entry["stock"] or 0), entry["mpn"]))
    return {
        "candidates": found[:limit], "suggested_by_distributors": sorted(set(suggested)), "judged_on": sorted(base),
        "suggestions": _suggestions(conn, part_id),
    }


def _suggestions(conn, part_id: str) -> list[dict[str, Any]]:
    """What distributors suggest in place of the part, with the stock and standing of those Prism already tracks."""

    found = alternates.for_part(conn, part_id)
    standing = {item["id"]: item for item in parts_view.summaries_for(conn, [entry["part_id"] for entry in found if entry["part_id"]])}
    for entry in found:
        item = standing.get(entry["part_id"] or "")
        entry["stock"] = item["stock"] if item else None
        entry["status"] = item["status"] if item else None
        entry["tracked"] = bool(item and (item["tracking"] or item["watch"]))
    return found
