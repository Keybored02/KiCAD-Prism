"""What the assessment weighs, with defaults in code.

A workspace will be able to change these in Supply Settings. Until that screen exists everything
uses ``DEFAULTS``, and every function takes the settings it was given, so changing them later
does not touch the rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Mapping

from app.services.supply.vocabulary import Status

# Check ids. Severity is the default; a workspace can override it per check.
PART_NOT_FOUND = "part_not_found"
OBSOLETE = "obsolete"
NRND = "nrnd"
LAST_TIME_BUY = "last_time_buy"
DISTRIBUTOR_DISCONTINUED = "distributor_discontinued"
NO_DISTRIBUTOR_STOCK = "no_distributor_stock"
INSUFFICIENT_STOCK = "insufficient_stock"
LEAD_TIME_OVER_THRESHOLD = "lead_time_over_threshold"
ROHS_NONCOMPLIANT = "rohs_noncompliant"
DATA_STALE = "data_stale"

DEFAULT_SEVERITY: Mapping[str, Status] = MappingProxyType({
    PART_NOT_FOUND: Status.ERROR,
    OBSOLETE: Status.FATAL,
    NRND: Status.WARNING,
    LAST_TIME_BUY: Status.WARNING,
    DISTRIBUTOR_DISCONTINUED: Status.WARNING,
    NO_DISTRIBUTOR_STOCK: Status.ERROR,
    INSUFFICIENT_STOCK: Status.ERROR,
    LEAD_TIME_OVER_THRESHOLD: Status.WARNING,
    ROHS_NONCOMPLIANT: Status.ERROR,
    DATA_STALE: Status.WARNING,
})

SUB_SCORES = ("lifecycle", "sourcing", "inventory", "market", "compliance")


@dataclass(frozen=True, slots=True)
class AssessmentSettings:
    # Longer than this and a lead time is a finding.
    lead_time_days: int = 84
    # An offer older than this is out of date.
    stale_hours: int = 72
    # Weights of the five sub-scores in health. They are relative; only their proportions matter.
    weights: Mapping[str, float] = field(default_factory=lambda: MappingProxyType({
        "lifecycle": 0.25, "sourcing": 0.2, "inventory": 0.3, "market": 0.1, "compliance": 0.15,
    }))
    severity: Mapping[str, Status] = field(default_factory=lambda: DEFAULT_SEVERITY)
    # The most health the sub-scores can take away, and the most the findings can.
    sub_score_penalty: float = 6.0
    finding_penalty_cap: float = 4.0

    def severity_of(self, check: str) -> Status:
        return self.severity.get(check, DEFAULT_SEVERITY[check])


DEFAULTS = AssessmentSettings()
