"""Findings about a component as a whole: its own part and the alternates approved for it.

A part's checks see one part. A component can still be built when its own part is out of stock but
an approved alternate is not, so a catalog component is judged on all of them together. With no
approved alternate this adds nothing: the part's own "no distributor has it in stock" already says it.
"""

from __future__ import annotations

from typing import Any, Mapping, Sequence

from app.services.supply import parts_view, sources
from app.services.supply.assessment import settings as ids
from app.services.supply.assessment.checks import Finding
from app.services.supply.assessment.settings import DEFAULTS, AssessmentSettings


def no_approved_source(
    primary_stock: int | None, alternate_stocks: Sequence[int | None], settings: AssessmentSettings = DEFAULTS
) -> Finding | None:
    """Raised when the component's part and every approved alternate are all known to be out of stock."""

    if not alternate_stocks:
        return None
    figures = [primary_stock, *alternate_stocks]
    if any(figure is None for figure in figures) or any(figures):
        return None
    count = len(alternate_stocks)
    return Finding(
        ids.NO_APPROVED_SOURCE,
        settings.severity_of(ids.NO_APPROVED_SOURCE),
        f"The part and {'its approved alternate' if count == 1 else f'all {count} approved alternates'} are out of stock.",
        "no_approved_source",
    )


def for_component(
    conn, component_id: str, primary_part_id: str | None, settings: AssessmentSettings = DEFAULTS
) -> list[Finding]:
    """The component-level findings of one catalog component. ``primary_part_id`` is its own part, if tracked."""

    approved = [row["part_id"] for row in conn.execute(
        "SELECT part_id FROM component_sources WHERE component_id = %s AND approval = %s", (component_id, sources.APPROVED)
    ).fetchall()]
    wanted = [part_id for part_id in [primary_part_id, *approved] if part_id]
    stock: Mapping[str, Any] = {item["id"]: item["stock"] for item in parts_view.summaries_for(conn, wanted)} if wanted else {}
    primary = stock.get(primary_part_id) if primary_part_id else None
    found = no_approved_source(primary, [stock.get(part_id) for part_id in approved], settings)
    return [found] if found else []
