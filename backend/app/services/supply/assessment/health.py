"""Health and status from findings and sub-scores, and the roll-up over many parts."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence

from app.services.supply.assessment.checks import Finding
from app.services.supply.assessment.risk import SubScore
from app.services.supply.assessment.settings import AssessmentSettings
from app.services.supply.vocabulary import Status

_FINDING_PENALTY = {Status.ERROR: 1.5, Status.WARNING: 0.5}
# One fatal line drags a BOM's health down to this at most.
FATAL_CAP = 4.0


@dataclass(frozen=True, slots=True)
class Health:
    score: float
    status: Status


def _unwaived(findings: Iterable[Finding]) -> list[Finding]:
    return [f for f in findings if not (f.waiver and f.waiver.get("holds"))]


def health(findings: Sequence[Finding], scores: Sequence[SubScore], settings: AssessmentSettings, *, has_data: bool) -> Health:
    """10 minus weighted sub-score penalties minus unwaived finding penalties, 0 to 10.

    Any unwaived fatal finding sets 0. Status: fatal on an unwaived fatal finding, error on an
    unwaived error or health under 4, warning on an unwaived warning or health under 7, ok
    otherwise, unknown when there is no data and nothing to report.
    """

    open_findings = _unwaived(findings)
    if not has_data and not open_findings:
        return Health(0.0, Status.UNKNOWN)
    if any(f.severity is Status.FATAL for f in open_findings):
        return Health(0.0, Status.FATAL)
    total_weight = sum(settings.weights.get(s.name, 0.0) for s in scores) or 1.0
    penalty = settings.sub_score_penalty * sum(settings.weights.get(s.name, 0.0) * (s.score - 1) / 4 for s in scores) / total_weight
    penalty += min(sum(_FINDING_PENALTY.get(f.severity, 0.0) for f in open_findings), settings.finding_penalty_cap)
    score = round(max(0.0, min(10.0, 10.0 - penalty)), 1)
    if any(f.severity is Status.ERROR for f in open_findings) or score < 4:
        return Health(score, Status.ERROR)
    if any(f.severity is Status.WARNING for f in open_findings) or score < 7:
        return Health(score, Status.WARNING)
    return Health(score, Status.OK)


def rollup(parts: Sequence[tuple[float, int, Status]]) -> Health:
    """The quantity-weighted mean of (health, quantity, status), capped at 4 when any line is fatal."""

    scored = [(score, max(quantity, 1), status) for score, quantity, status in parts if status is not Status.UNKNOWN]
    if not scored:
        return Health(0.0, Status.UNKNOWN)
    weight = sum(quantity for _, quantity, _ in scored)
    mean = sum(score * quantity for score, quantity, _ in scored) / weight
    if any(status is Status.FATAL for _, _, status in scored):
        mean = min(mean, FATAL_CAP)
        return Health(round(mean, 1), Status.FATAL)
    score = round(mean, 1)
    worst = Status.OK
    for _, _, status in scored:
        if status is Status.ERROR:
            worst = Status.ERROR
        elif status is Status.WARNING and worst is Status.OK:
            worst = Status.WARNING
    return Health(score, worst)
