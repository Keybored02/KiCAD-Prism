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
SINGLE_SOURCE = "single_source"
NO_APPROVED_SOURCE = "no_approved_source"
MANUFACTURER_MISSING = "manufacturer_missing"
NOT_IN_LIBRARY = "not_in_library"
REACH_SVHC = "reach_svhc"
PARAMETER_MISMATCH = "parameter_mismatch"
PACKAGE_MISMATCH = "package_mismatch"
LIFECYCLE_DISAGREEMENT = "lifecycle_disagreement"
PRICE_OUTLIER = "price_outlier"

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
    SINGLE_SOURCE: Status.WARNING,
    NO_APPROVED_SOURCE: Status.ERROR,
    MANUFACTURER_MISSING: Status.WARNING,
    # The plan says error; a manufacturer spelled differently in the library would flood a BOM, so it starts as a warning.
    NOT_IN_LIBRARY: Status.WARNING,
    REACH_SVHC: Status.WARNING,
    PARAMETER_MISMATCH: Status.WARNING,
    PACKAGE_MISMATCH: Status.WARNING,
    LIFECYCLE_DISAGREEMENT: Status.WARNING,
    # Prices differ for many reasons; it starts as a note that does not count against health.
    PRICE_OUTLIER: Status.OK,
})

SUB_SCORES = ("lifecycle", "sourcing", "inventory", "market", "compliance")


@dataclass(frozen=True, slots=True)
class AssessmentSettings:
    # Longer than this and a lead time is a finding.
    lead_time_days: int = 84
    # An offer older than this is out of date.
    stale_hours: int = 72
    # Prices in other currencies are converted to this one to be compared and totalled.
    base_currency: str = "EUR"
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


CHECK_LABELS: Mapping[str, str] = MappingProxyType({
    PART_NOT_FOUND: "No distributor carries the part number",
    OBSOLETE: "Manufacturer lists it as obsolete",
    NRND: "Not recommended for new designs",
    LAST_TIME_BUY: "Last time buy announced",
    DISTRIBUTOR_DISCONTINUED: "Every distributor dropped it",
    NO_DISTRIBUTOR_STOCK: "No distributor has it in stock",
    INSUFFICIENT_STOCK: "Stock does not cover the build",
    LEAD_TIME_OVER_THRESHOLD: "Lead time over the limit",
    ROHS_NONCOMPLIANT: "Not RoHS compliant",
    DATA_STALE: "Distributor data is out of date",
    SINGLE_SOURCE: "Only one distributor has it in stock",
    NO_APPROVED_SOURCE: "No approved part for the component is in stock",
    MANUFACTURER_MISSING: "The BOM line has no manufacturer",
    NOT_IN_LIBRARY: "No library component has this part",
    REACH_SVHC: "Affected by REACH (substance of very high concern)",
    PARAMETER_MISMATCH: "The BOM value differs from the distributor's",
    PACKAGE_MISMATCH: "The footprint size differs from the distributor's package",
    LIFECYCLE_DISAGREEMENT: "Distributors disagree on the lifecycle",
    PRICE_OUTLIER: "A distributor's price is far from the others'",
})

# What a workspace may set. "ok" turns a check into a note that does not count against health.
SEVERITY_CHOICES = (Status.OK, Status.WARNING, Status.ERROR, Status.FATAL)
LEAD_TIME_RANGE = (1, 730)
STALE_HOURS_RANGE = (1, 720)


def to_dto(settings: AssessmentSettings) -> dict:
    return {
        "lead_time_days": settings.lead_time_days,
        "stale_hours": settings.stale_hours,
        "base_currency": settings.base_currency,
        "weights": {name: settings.weights[name] for name in SUB_SCORES},
        "severity": {check: settings.severity_of(check).value for check in CHECK_LABELS},
    }


def from_dto(payload: Mapping) -> AssessmentSettings:
    """Settings from a validated payload, filling anything missing from the defaults."""

    base = DEFAULTS
    return AssessmentSettings(
        lead_time_days=int(payload.get("lead_time_days", base.lead_time_days)),
        stale_hours=int(payload.get("stale_hours", base.stale_hours)),
        base_currency=str(payload.get("base_currency", base.base_currency)),
        weights=MappingProxyType({name: float(payload.get("weights", {}).get(name, base.weights[name])) for name in SUB_SCORES}),
        severity=MappingProxyType({
            check: Status(payload.get("severity", {}).get(check, base.severity_of(check).value)) for check in CHECK_LABELS
        }),
    )


def validate(payload: Mapping) -> dict:
    """The payload in its stored form, or a ValueError with a sentence a person can act on."""

    def whole(name: str, label: str, low: int, high: int) -> int:
        value = payload.get(name, getattr(DEFAULTS, name))
        if isinstance(value, bool) or not isinstance(value, int) or not low <= value <= high:
            raise ValueError(f"{label} must be a whole number from {low} to {high}.")
        return value

    currency = payload.get("base_currency", DEFAULTS.base_currency)
    if not isinstance(currency, str) or len(currency) != 3 or not currency.isalpha() or not currency.isupper():
        raise ValueError("The base currency must be a three letter code in capitals, such as EUR.")
    weights = payload.get("weights", {})
    severity = payload.get("severity", {})
    if not isinstance(weights, Mapping) or not isinstance(severity, Mapping):
        raise ValueError("Weights and severities must be given by name.")
    for name, value in weights.items():
        if name not in SUB_SCORES:
            raise ValueError(f"Unknown risk area: {name}.")
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 1:
            raise ValueError(f"The weight of {name} must be between 0 and 1.")
    merged = {name: float(weights.get(name, DEFAULTS.weights[name])) for name in SUB_SCORES}
    if sum(merged.values()) <= 0:
        raise ValueError("At least one risk area needs a weight above 0.")
    allowed = {item.value for item in SEVERITY_CHOICES}
    for check, value in severity.items():
        if check not in CHECK_LABELS:
            raise ValueError(f"Unknown check: {check}.")
        if value not in allowed:
            raise ValueError(f"The severity of {check} must be one of {', '.join(sorted(allowed))}.")
    return {
        "lead_time_days": whole("lead_time_days", "The lead time limit", *LEAD_TIME_RANGE),
        "stale_hours": whole("stale_hours", "The data age limit", *STALE_HOURS_RANGE),
        "base_currency": currency,
        "weights": merged,
        "severity": {check: severity.get(check, DEFAULTS.severity_of(check).value) for check in CHECK_LABELS},
    }
