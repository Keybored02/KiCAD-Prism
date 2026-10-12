"""Assess parts: gather their facts, run the checks, score and apply waivers.

``assess_parts`` is what the API and the BOM lookup call. It reads what Prism already holds and
never calls a distributor.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping, Sequence

from app.services.supply import parts_view
from app.services.supply.assessment import checks, health, risk, settings_store, waivers
from app.services.supply.assessment.settings import DEFAULTS, AssessmentSettings
from app.services.supply.vocabulary import Lifecycle


def assess_one(
    item: Mapping[str, Any],
    offers: Sequence[Mapping[str, Any]],
    part_waivers: Sequence[Mapping[str, Any]],
    now: datetime,
    need: int | None = None,
    settings: AssessmentSettings = DEFAULTS,
    distributors: int | None = None,
    extras: Sequence[checks.Finding] = (),
) -> dict[str, Any]:
    facts = checks.Facts(
        lifecycle=Lifecycle(item["lifecycle"]), offers=offers, now=now, problem=item["problem"], need=need,
        distributors=distributors,
    )
    findings = [*waivers.apply(checks.evaluate(facts, settings), part_waivers), *extras]
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

    ``extras`` are findings from outside the part (a component's, say); they are not waivable here.
    """

    settings = settings or settings_store.load(conn)
    held = waivers.for_parts(conn, [item["id"] for item in items])
    distributors = conn.execute("SELECT COUNT(*) AS n FROM connectors WHERE enabled").fetchone()["n"]
    return {
        item["id"]: assess_one(item, offers.get(item["id"], []), held.get(item["id"], []), now, needs.get(item["id"]), settings, distributors, (extras or {}).get(item["id"], ()))
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
