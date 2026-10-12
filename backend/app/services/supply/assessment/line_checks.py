"""Findings about how a BOM line names its part, not about the part itself."""

from __future__ import annotations

from app.services.supply.assessment import settings as ids
from app.services.supply.assessment.checks import Finding
from app.services.supply.assessment.settings import DEFAULTS, AssessmentSettings


def manufacturer_missing(settings: AssessmentSettings = DEFAULTS) -> Finding:
    """The line gives a part number but no manufacturer; the part was found by number alone."""

    return Finding(
        ids.MANUFACTURER_MISSING,
        settings.severity_of(ids.MANUFACTURER_MISSING),
        "The BOM line has no manufacturer. The part was found by its number alone.",
        "manufacturer_missing",
    )


def not_in_library(settings: AssessmentSettings = DEFAULTS) -> Finding:
    """The part is tracked, but no catalog component has this manufacturer and part number."""

    return Finding(
        ids.NOT_IN_LIBRARY,
        settings.severity_of(ids.NOT_IN_LIBRARY),
        "No component in the library has this manufacturer and part number.",
        "not_in_library",
    )
