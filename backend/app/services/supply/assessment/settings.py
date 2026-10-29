"""What the assessment weighs, with defaults in code.

A workspace will be able to change these in Supply Settings. Until that screen exists everything
uses ``DEFAULTS``, and every function takes the settings it was given, so changing them later
does not touch the rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Mapping

from app.core.config import settings as deployment
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
ROHS_DISPUTED = "rohs_disputed"
DATA_STALE = "data_stale"
SINGLE_SOURCE = "single_source"
MANUFACTURER_MISSING = "manufacturer_missing"
NOT_IN_LIBRARY = "not_in_library"
REACH_SVHC = "reach_svhc"
PARAMETER_MISMATCH = "parameter_mismatch"
PACKAGE_MISMATCH = "package_mismatch"
LIFECYCLE_DISAGREEMENT = "lifecycle_disagreement"
PRICE_OUTLIER = "price_outlier"
ENDING_WITHIN_2_YEARS = "ending_within_2_years"

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
    # Distributors say both: neither is taken as the answer.
    ROHS_DISPUTED: Status.WARNING,
    DATA_STALE: Status.WARNING,
    SINGLE_SOURCE: Status.WARNING,
    MANUFACTURER_MISSING: Status.WARNING,
    # The plan says error; a manufacturer spelled differently in the library would flood a BOM, so it starts as a warning.
    NOT_IN_LIBRARY: Status.WARNING,
    REACH_SVHC: Status.WARNING,
    PARAMETER_MISMATCH: Status.WARNING,
    PACKAGE_MISMATCH: Status.WARNING,
    LIFECYCLE_DISAGREEMENT: Status.WARNING,
    # Prices differ for many reasons; it starts as a note that does not count against health.
    PRICE_OUTLIER: Status.OK,
    # The lifecycle outlook (``outlook.py``) reads more than the lifecycle word: notices, last dates to buy, distributors dropping it.
    ENDING_WITHIN_2_YEARS: Status.WARNING,
})


@dataclass(frozen=True, slots=True)
class AssessmentSettings:
    # Longer than this and a lead time is a finding.
    lead_time_days: int = 84
    # A last date to buy this close, or past, makes a last time buy (or an ending part) an error, and a fatal one once it has passed.
    last_buy_error_days: int = 180
    # A read is late when it is this many hours past when the part's schedule wanted it (a day for a daily part, a week, a month).
    late_hours: int = 48
    # Spares a costing orders on top of the boards' need: "flat" is ``spares_percent`` for every part, "package" is by kind of part
    # (``attrition.py``: ``spares_small_passives`` for 01005 to 0603 passives, ``spares_others`` for the rest).
    spares_mode: str = "flat"
    spares_percent: float = 0.0
    spares_small_passives: float = 2.0
    spares_others: float = 0.0
    # The cheapest price rising by this many percent raises a "price up" alert, and the chance of running out within four weeks that
    # raises "likely to run out"; a part's own rule wins (``alert_rules``).
    alert_price_rise_percent: int = 20
    alert_likely_out_percent: int = 70
    # Prices in other currencies are converted to this one to be compared and totalled.
    base_currency: str = "EUR"
    # The quantity lists and price history price at, unless a part has its own.
    price_quantity: int = 100
    # Price the BOM at the preferred distributor when it holds enough stock for the build, else at the cheapest (Altium's preferred suppliers).
    prefer_distributors: bool = False
    # Connector ids, most preferred first. A part's own preferred distributor comes before them.
    distributor_order: tuple[str, ...] = ()
    severity: Mapping[str, Status] = field(default_factory=lambda: DEFAULT_SEVERITY)

    def severity_of(self, check: str) -> Status:
        return self.severity.get(check, DEFAULT_SEVERITY[check])

    def default_attrition(self) -> float | None:
        """The spares a costing asks for unless told otherwise, as ``bom_lookup.lookup`` takes them: a percent, or None for by package."""

        return None if self.spares_mode == "package" else self.spares_percent

    def spares_table(self) -> Mapping[str, float]:
        """Spares by kind of part, for a costing by package."""

        return {"small_passive": self.spares_small_passives, "other": self.spares_others}


# The deployment chooses the currency a workspace starts in (SUPPLY_BASE_CURRENCY).
DEFAULTS = AssessmentSettings(base_currency=deployment.SUPPLY_BASE_CURRENCY)


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
    ROHS_DISPUTED: "Distributors disagree on RoHS",
    DATA_STALE: "A read is late",
    SINGLE_SOURCE: "Only one distributor has it in stock",
    MANUFACTURER_MISSING: "The BOM line has no manufacturer",
    NOT_IN_LIBRARY: "No library component has this part",
    REACH_SVHC: "Affected by REACH (substance of very high concern)",
    PARAMETER_MISMATCH: "The BOM value differs from the distributor's",
    PACKAGE_MISMATCH: "The footprint size differs from the distributor's package",
    LIFECYCLE_DISAGREEMENT: "Distributors disagree on the lifecycle",
    PRICE_OUTLIER: "A distributor's price is far from the others'",
    ENDING_WITHIN_2_YEARS: "A notice or a last date to buy says the part is ending",
})

# Where each check is listed in the settings: one area for every check.
AREAS = ("Lifecycle", "Sourcing", "Stock", "Compliance", "BOM line")
CHECK_AREA: Mapping[str, str] = MappingProxyType({
    OBSOLETE: "Lifecycle", NRND: "Lifecycle", LAST_TIME_BUY: "Lifecycle", DISTRIBUTOR_DISCONTINUED: "Lifecycle",
    LIFECYCLE_DISAGREEMENT: "Lifecycle", ENDING_WITHIN_2_YEARS: "Lifecycle",
    PART_NOT_FOUND: "Sourcing", SINGLE_SOURCE: "Sourcing", LEAD_TIME_OVER_THRESHOLD: "Sourcing", DATA_STALE: "Sourcing", PRICE_OUTLIER: "Sourcing",
    NO_DISTRIBUTOR_STOCK: "Stock", INSUFFICIENT_STOCK: "Stock",
    ROHS_NONCOMPLIANT: "Compliance", ROHS_DISPUTED: "Compliance", REACH_SVHC: "Compliance",
    MANUFACTURER_MISSING: "BOM line", NOT_IN_LIBRARY: "BOM line", PARAMETER_MISMATCH: "BOM line", PACKAGE_MISMATCH: "BOM line",
})

# What a workspace may set. "ok" turns a check into a note that does not count against health.
SEVERITY_CHOICES = (Status.OK, Status.WARNING, Status.ERROR, Status.FATAL)
LEAD_TIME_RANGE = (1, 730)
LAST_BUY_ERROR_RANGE = (30, 730)
LATE_HOURS_RANGE = (1, 720)
PRICE_QUANTITY_RANGE = (1, 1_000_000)
SPARES_RANGE = (0, 100)
ALERT_PRICE_RISE_RANGE = (1, 500)
ALERT_LIKELY_OUT_RANGE = (50, 99)
SPARES_MODES = ("flat", "package")


def to_dto(settings: AssessmentSettings) -> dict:
    return {
        "lead_time_days": settings.lead_time_days,
        "last_buy_error_days": settings.last_buy_error_days,
        "late_hours": settings.late_hours,
        "spares_mode": settings.spares_mode,
        "spares_percent": settings.spares_percent,
        "spares_small_passives": settings.spares_small_passives,
        "spares_others": settings.spares_others,
        "alert_price_rise_percent": settings.alert_price_rise_percent,
        "alert_likely_out_percent": settings.alert_likely_out_percent,
        "base_currency": settings.base_currency,
        "price_quantity": settings.price_quantity,
        "prefer_distributors": settings.prefer_distributors,
        "distributor_order": list(settings.distributor_order),
        "severity": {check: settings.severity_of(check).value for check in CHECK_LABELS},
    }


def from_dto(payload: Mapping) -> AssessmentSettings:
    """Settings from a validated payload, filling anything missing from the defaults."""

    base = DEFAULTS
    return AssessmentSettings(
        lead_time_days=int(payload.get("lead_time_days", base.lead_time_days)),
        last_buy_error_days=int(payload.get("last_buy_error_days", base.last_buy_error_days)),
        late_hours=int(payload.get("late_hours", base.late_hours)),
        spares_mode=str(payload.get("spares_mode", base.spares_mode)),
        spares_percent=float(payload.get("spares_percent", base.spares_percent)),
        spares_small_passives=float(payload.get("spares_small_passives", base.spares_small_passives)),
        spares_others=float(payload.get("spares_others", base.spares_others)),
        alert_price_rise_percent=int(payload.get("alert_price_rise_percent", base.alert_price_rise_percent)),
        alert_likely_out_percent=int(payload.get("alert_likely_out_percent", base.alert_likely_out_percent)),
        base_currency=str(payload.get("base_currency", base.base_currency)),
        price_quantity=int(payload.get("price_quantity", base.price_quantity)),
        prefer_distributors=bool(payload.get("prefer_distributors", base.prefer_distributors)),
        distributor_order=tuple(str(item) for item in payload.get("distributor_order", base.distributor_order)),
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

    def percent(name: str, label: str) -> float:
        value = payload.get(name, getattr(DEFAULTS, name))
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not SPARES_RANGE[0] <= value <= SPARES_RANGE[1]:
            raise ValueError(f"{label} must be a percent from {SPARES_RANGE[0]} to {SPARES_RANGE[1]}.")
        return float(value)

    mode = payload.get("spares_mode", DEFAULTS.spares_mode)
    if mode not in SPARES_MODES:
        raise ValueError("Spares are one percent for every part or by kind of part.")
    currency = payload.get("base_currency", DEFAULTS.base_currency)
    if not isinstance(currency, str) or len(currency) != 3 or not currency.isalpha() or not currency.isupper():
        raise ValueError("The base currency must be a three letter code in capitals, such as EUR.")
    prefer = payload.get("prefer_distributors", DEFAULTS.prefer_distributors)
    order = payload.get("distributor_order", list(DEFAULTS.distributor_order))
    if not isinstance(prefer, bool):
        raise ValueError("Preferring distributors is on or off.")
    if not isinstance(order, list) or len(order) > 30 or any(not isinstance(item, str) or not item or len(item) > 64 for item in order) or len(set(order)) != len(order):
        raise ValueError("The preferred distributors are a list of distributors, each once.")
    severity = payload.get("severity", {})
    if not isinstance(severity, Mapping):
        raise ValueError("Severities must be given by name.")
    allowed = {item.value for item in SEVERITY_CHOICES}
    for check, value in severity.items():
        if check not in CHECK_LABELS:
            raise ValueError(f"Unknown check: {check}.")
        if value not in allowed:
            raise ValueError(f"The severity of {check} must be one of {', '.join(sorted(allowed))}.")
    return {
        "lead_time_days": whole("lead_time_days", "The lead time limit", *LEAD_TIME_RANGE),
        "last_buy_error_days": whole("last_buy_error_days", "The last-date-to-buy limit", *LAST_BUY_ERROR_RANGE),
        "late_hours": whole("late_hours", "The late read limit", *LATE_HOURS_RANGE),
        "spares_mode": mode,
        "spares_percent": percent("spares_percent", "The spares"),
        "spares_small_passives": percent("spares_small_passives", "The spares for small passives"),
        "spares_others": percent("spares_others", "The spares for other parts"),
        "alert_price_rise_percent": whole("alert_price_rise_percent", "The price rise that raises an alert", *ALERT_PRICE_RISE_RANGE),
        "alert_likely_out_percent": whole("alert_likely_out_percent", "The chance of running out that raises an alert", *ALERT_LIKELY_OUT_RANGE),
        "base_currency": currency,
        "price_quantity": whole("price_quantity", "The price quantity", *PRICE_QUANTITY_RANGE),
        "prefer_distributors": prefer,
        "distributor_order": order,
        "severity": {check: severity.get(check, DEFAULTS.severity_of(check).value) for check in CHECK_LABELS},
    }
