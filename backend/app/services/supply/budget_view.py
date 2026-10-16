"""Where each connector's call budget goes: today, the last two weeks, and what tracking costs.

Everything here is read, nothing is changed. Per metered connector:

* the shares of its account's day: committed (what tracking may use) and the pool (people's reads, first searches and
  one-off checks), with what each has spent, and the time to the provider's reset
* what was spent, by kind and by purpose, hour by hour today and by day for 14 days (``call_counts``)
* what tracking has admitted and what waits for room (``admission.status``)
* the projects and parts that cost most, from the cost model (``budget.py``), a part two projects share split between them
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from app.services.supply import accounts, admission, budget, ledger, quota
from app.services.supply.providers import registry

DAYS = 14
TOP = 10


def _hourly(conn, connector_id: str, day) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT hour, kind, purpose, calls FROM call_counts WHERE connector_id = %s AND day = %s ORDER BY hour, kind, purpose",
        (connector_id, day),
    ).fetchall()
    return [{"hour": int(r["hour"]), "kind": r["kind"], "purpose": r["purpose"], "calls": int(r["calls"])} for r in rows]


def _daily(conn, connector_id: str, day) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT day, purpose, SUM(calls) AS calls FROM call_counts WHERE connector_id = %s AND day > %s AND day <= %s AND kind <> 'refused' "
        "GROUP BY day, purpose ORDER BY day, purpose",
        (connector_id, day - timedelta(days=DAYS), day),
    ).fetchall()
    return [{"day": r["day"].isoformat(), "purpose": r["purpose"], "calls": int(r["calls"])} for r in rows]


def _refused(conn, connector_id: str, day) -> int:
    row = conn.execute(
        "SELECT COALESCE(SUM(calls), 0) AS n FROM call_counts WHERE connector_id = %s AND day = %s AND kind = 'refused'", (connector_id, day)
    ).fetchone()
    return int(row["n"])


def owners(conn, connector_id: str, spec, data: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    """The projects and parts that cost most at a connector, estimated: calls a day, by the cost model."""

    rows = conn.execute(
        "SELECT a.part_id, p.mpn, m.name AS manufacturer FROM admissions a JOIN parts p ON p.id = a.part_id "
        "JOIN manufacturers m ON m.id = p.manufacturer_id WHERE a.connector_id = %s AND a.state = 'admitted'",
        (connector_id,),
    ).fetchall()
    projects: dict[str, float] = defaultdict(float)
    parts: list[dict[str, Any]] = []
    for row in rows:
        if row["part_id"] not in data["tiers"]:
            continue
        cost = admission.part_cost(spec, row["part_id"], connector_id, data)
        tier, rate, reasons = data["tiers"][row["part_id"]]
        named = sorted({item["ref"] for item in reasons if item["kind"] == "project"})
        for ref in named or [""]:
            projects[ref] += cost / len(named or [""])
        parts.append({
            "part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"], "tier": tier,
            "calls_a_day": round(cost, 3),
            "pick_saves": round(budget.pick_saving(spec, tier, rate, int(data["listed"].get((row["part_id"], connector_id), 1))), 3)
            if (row["part_id"], connector_id) not in data["picked"] else 0.0,
        })
    parts.sort(key=lambda item: -item["calls_a_day"])
    top_projects = sorted(({"project_id": ref, "calls_a_day": round(cost, 3)} for ref, cost in projects.items()), key=lambda item: -item["calls_a_day"])
    top_projects = top_projects[:TOP]
    names = {row["project_id"]: row["project_name"] for row in conn.execute(
        "SELECT project_id, project_name FROM bom_usage_projects WHERE project_id = ANY(%s)", ([item["project_id"] for item in top_projects],)
    ).fetchall()}
    for item in top_projects:
        item["project_name"] = names.get(item["project_id"]) or item["project_id"]
    return {"projects": top_projects, "parts": parts[:TOP]}


def view(conn, now: datetime) -> list[dict[str, Any]]:
    data = admission._inputs(conn)  # noqa: SLF001 - the cost inputs are read once for every connector
    standing = {item["connector_id"]: item for item in admission.status(conn)}
    result = []
    for row in conn.execute("SELECT id, provider, display_name, enabled FROM connectors ORDER BY lower(display_name), id").fetchall():
        try:
            spec = registry.get_spec(row["provider"])
        except registry.UnknownProvider:
            continue
        if not spec.metered:
            continue
        account = accounts.resolve(conn, row["id"])
        day = quota.provider_day(now, account.reset_time, account.reset_tz)
        state = ledger.get_state(
            conn, account.ledger_id, daily_budget=account.daily_budget, reserve_pct=account.reserve_pct, now=now,
            reset_time=account.reset_time, reset_tz=account.reset_tz,
        )
        committed = budget.committed_calls(account.daily_budget, account.reserve_pct)
        reset_in = quota.seconds_to_reset(now, account.reset_time, account.reset_tz)
        result.append({
            "connector_id": row["id"],
            "name": row["display_name"],
            "provider": row["provider"],
            "enabled": bool(row["enabled"]),
            "account": account.ledger_id,
            "shares_account": account.shared,
            "day": day.isoformat(),
            "reset_in_seconds": reset_in,
            "daily_budget": account.daily_budget,
            "committed": {"capacity": committed, "spent": state.spent_today - state.interactive_spent_today - state.spare_spent_today},
            "pool": {"capacity": account.daily_budget - committed, "spent": state.interactive_spent_today},
            "spare_spent": state.spare_spent_today,
            "spent": state.spent_today,
            "refused_today": _refused(conn, row["id"], day),
            "tracking": standing.get(row["id"]),
            "hourly": _hourly(conn, row["id"], day),
            "days": _daily(conn, row["id"], day),
            "owners": owners(conn, row["id"], spec, data),
        })
    return result
