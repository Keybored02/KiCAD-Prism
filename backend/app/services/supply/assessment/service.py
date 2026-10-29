"""Assess parts: gather their facts, run the checks, score and apply waivers.

``assess_parts`` is what the API and the BOM lookup call. It reads what Prism already holds and
never calls a distributor.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Mapping, Sequence

from app.services.supply import compliance, fx, part_insights, parts_view, pricing
from app.services.supply.assessment import checks, health, risk, settings_store, waivers
from app.services.supply.assessment.settings import DEFAULTS, AssessmentSettings
from app.services.supply.vocabulary import Lifecycle


def distributor_count(conn) -> int:
    """Distributors Prism reads: distinct providers among enabled connectors. Files and the simulator are not distributors."""

    return conn.execute(
        "SELECT COUNT(DISTINCT provider) AS n FROM supply_connectors WHERE enabled AND provider NOT IN ('csv', 'fake')"
    ).fetchone()["n"]


def _quotes(offers: Sequence[Mapping[str, Any]], base: str, rates: fx.Rates | None) -> list[tuple[str, Decimal]]:
    """Each distributor's cheapest unit price at the reference quantity, in the base currency. A distributor with no price, or in
    a currency without a rate, is left out."""

    cheapest: dict[str, tuple[str, Decimal]] = {}
    for offer in offers:
        if offer["marketplace"] or not offer.get("price_breaks") or not offer.get("currency"):
            continue
        price = pricing.unit_price_at([(int(q), Decimal(str(p))) for q, p in offer["price_breaks"]], moq=offer["moq"], order_multiple=offer["order_multiple"], up_to=offer.get("price_up_to"))
        if price is None:
            continue
        converted = price if offer["currency"] == base else (rates.convert(price, offer["currency"], base) if rates else None)
        if converted is None:
            continue
        name = str(offer.get("connector_name") or offer["connector_id"])
        if name not in cheapest or converted < cheapest[name][1]:
            cheapest[name] = (name, converted)
    return list(cheapest.values())


def assess_one(
    item: Mapping[str, Any],
    offers: Sequence[Mapping[str, Any]],
    part_waivers: Sequence[Mapping[str, Any]],
    now: datetime,
    need: int | None = None,
    settings: AssessmentSettings = DEFAULTS,
    distributors: int | None = None,
    extras: Sequence[checks.Finding] = (),
    svhc_listed: Sequence[str] = (),
    rates: fx.Rates | None = None,
    outlook: str = "",
    last_buy: date | None = None,
) -> dict[str, Any]:
    facts = checks.Facts(
        lifecycle=Lifecycle(item["lifecycle"]), offers=offers, now=now, problem=item["problem"], need=need,
        distributors=distributors,
        svhc_listed=svhc_listed, prices=_quotes(offers, settings.base_currency, rates), outlook=outlook,
        last_buy=last_buy, rate=str((item.get("tracking") or {}).get("rate") or ""),
    )
    # Findings from outside the part (a component's) are waived like the part's own.
    findings = waivers.apply([*checks.evaluate(facts, settings), *extras], part_waivers)
    scores = risk.sub_scores(facts)
    result = health.health(findings, scores, settings, has_data=bool(offers))
    return {
        "part_id": item["id"],
        "health": result.score,
        "status": result.status.value,
        "need": need,
        "findings": [
            {"check": f.check, "severity": f.severity.value, "text": f.text, "scope": f.scope, "waiver": dict(f.waiver) if f.waiver else None}
            for f in findings
        ],
        "sub_scores": [{"name": s.name, "score": s.score, "reasons": list(s.reasons)} for s in scores],
    }


def last_buy_dates(conn, part_ids: Sequence[str]) -> dict[str, date]:
    """The earliest last date to buy of each part: one a distributor states, or an open notice gives. Read for all parts at once."""

    found: dict[str, date] = {}

    def note(part_id: str, value: Any) -> None:
        try:
            day = value if isinstance(value, date) else date.fromisoformat(str(value)[:10])
        except ValueError:
            return
        if part_id not in found or day < found[part_id]:
            found[part_id] = day

    for row in conn.execute("SELECT part_id, value FROM supply_part_facts WHERE name = 'last_buy_date' AND part_id = ANY(%s)", (list(part_ids),)).fetchall():
        note(row["part_id"], row["value"])
    for row in conn.execute(
        "SELECT pp.part_id, n.last_time_buy FROM supply_pcn_parts pp JOIN supply_pcns n ON n.id = pp.pcn_id "
        "WHERE n.state = 'open' AND n.last_time_buy IS NOT NULL AND pp.part_id = ANY(%s)", (list(part_ids),),
    ).fetchall():
        note(row["part_id"], row["last_time_buy"])
    return found


def assess_summaries(
    conn,
    items: Sequence[Mapping[str, Any]],
    offers: Mapping[str, Sequence[Mapping[str, Any]]],
    needs: Mapping[str, int | None],
    now: datetime,
    settings: AssessmentSettings | None = None,
    extras: Mapping[str, Sequence[checks.Finding]] | None = None,
) -> dict[str, dict[str, Any]]:
    """Assess parts whose summaries and offers a caller already loaded, by the workspace's settings.

    ``extras`` are findings from outside the part (a component's, say); a waiver on the part covers them like its own.
    """

    settings = settings or settings_store.load(conn)
    held = waivers.for_parts(conn, [item["id"] for item in items])
    distributors = distributor_count(conn)
    listed = compliance.listed_substances(conn, [item["id"] for item in items])
    rates = fx.latest(conn)
    # The outlook band is kept by housekeeping with the part's other insights, so a read here costs one query.
    bands = {part_id: data.get("outlook_band") or "" for part_id, data in part_insights.of_parts(conn, [item["id"] for item in items]).items()}
    last_buys = last_buy_dates(conn, [item["id"] for item in items])
    return {
        item["id"]: assess_one(
            item, offers.get(item["id"], []), held.get(item["id"], []), now, needs.get(item["id"]), settings, distributors,
            (extras or {}).get(item["id"], ()), listed.get(item["id"], ()), rates, bands.get(item["id"], ""), last_buys.get(item["id"]),
        )
        for item in items
    }


def assess_parts(
    conn,
    part_ids: Sequence[str],
    needs: Mapping[str, int | None] | None = None,
    now: datetime | None = None,
    settings: AssessmentSettings | None = None,
) -> dict[str, dict[str, Any]]:
    items, offers = parts_view.summaries_with_offers(conn, list(part_ids))
    return assess_summaries(conn, items, offers, needs or {}, now or datetime.now(timezone.utc), settings)
