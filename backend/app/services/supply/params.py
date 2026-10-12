"""Part parameters: the attributes distributors list, put into one vocabulary for passive components.

Each distributor names and writes attributes its own way ("Resistance", "10 kOhms", "±1%", "Voltage - Rated"). This
maps the common ones for resistors, capacitors and inductors to a canonical key and reads the number into SI units, so
they can be compared. The raw text is always kept, and anything not recognised stays as the distributor wrote it: a value
is never guessed, and a number that does not parse is shown raw. Written without a units library on purpose: only a few
units and prefixes matter here.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Iterable

# canonical key -> (unit, the attribute names distributors use, lower case)
KEYS: dict[str, tuple[str, tuple[str, ...]]] = {
    "resistance": ("ohm", ("resistance", "resistance (ohms)", "resistance (ohm)")),
    "capacitance": ("farad", ("capacitance",)),
    "inductance": ("henry", ("inductance",)),
    "tolerance": ("percent", ("tolerance", "capacitance tolerance", "resistance tolerance")),
    "voltage_rating": (
        "volt",
        ("voltage - rated", "voltage rating", "voltage rated", "rated voltage", "voltage - rated dc", "voltage rating - dc", "voltage rating dc"),
    ),
    "power_rating": ("watt", ("power (watts)", "power", "power rating", "power - max")),
    "package": ("", ("package / case", "package", "case/package", "case code - in", "supplier device package", "case code (imperial)")),
    "dielectric": ("", ("temperature coefficient", "dielectric", "dielectric material")),
}

_PREFIX = {"p": Decimal("1e-12"), "n": Decimal("1e-9"), "u": Decimal("1e-6"), "µ": Decimal("1e-6"), "μ": Decimal("1e-6"),
           "m": Decimal("1e-3"), "": Decimal(1), "k": Decimal("1e3"), "M": Decimal("1e6"), "G": Decimal("1e9")}
_UNIT_WORDS = {
    "ohm": ("ohm", "ohms", "Ω", "Ω", "r"),
    "farad": ("f", "farad", "farads"),
    "henry": ("h", "henry", "henries"),
    "volt": ("v", "vdc", "volt", "volts"),
    "watt": ("w", "watt", "watts"),
}
_NUMBER = re.compile(r"^\s*[±+]?\s*(\d+(?:[.,]\d+)?)\s*([pnuµμmkMG]?)\s*([A-Za-zΩΩ]*)\s*$")
_FRACTION = re.compile(r"^\s*(\d+)\s*/\s*(\d+)\s*([A-Za-z]*)")
_BY_NAME = {name: key for key, (_unit, names) in KEYS.items() for name in names}


@dataclass(frozen=True, slots=True)
class Parameter:
    name: str
    raw: str
    key: str | None = None
    value: Decimal | None = None
    unit: str = ""


def canonical_key(name: str) -> str | None:
    return _BY_NAME.get(re.sub(r"\s+", " ", name.strip().lower()))


def _unit_of(text: str, wanted: str) -> bool:
    lowered = text.lower()
    return lowered in {word.lower() for word in _UNIT_WORDS.get(wanted, ())}


def parse_quantity(raw: str, unit: str) -> Decimal | None:
    """The SI value of a text like "10 kOhms", "100nF", "0.1W" or "1/10W", when it is in ``unit``. None if not."""

    if unit == "percent":
        match = re.match(r"^\s*[±+]?\s*(\d+(?:[.,]\d+)?)\s*%", raw)
        return Decimal(match.group(1).replace(",", ".")) if match else None
    fraction = _FRACTION.match(raw)
    if fraction and unit == "watt" and _unit_of(fraction.group(3), "watt"):
        return Decimal(fraction.group(1)) / Decimal(fraction.group(2))
    match = _NUMBER.match(raw)
    if not match:
        return None
    number, prefix, suffix = match.group(1).replace(",", "."), match.group(2), match.group(3)
    # "10k" with no unit word is taken in the wanted unit; "10 mF" splits into prefix m and unit F.
    if suffix and not _unit_of(suffix, unit):
        # a word like "Ohms" glued after a prefix-less number, or a prefix typed as part of the word ("kOhms")
        glued = (prefix + suffix)
        for candidate in ("k", "M", "G", "m", "u", "n", "p"):
            if glued.startswith(candidate) and _unit_of(glued[len(candidate):], unit):
                prefix, suffix = candidate, glued[len(candidate):]
                break
        else:
            return None
    try:
        return Decimal(number) * _PREFIX[prefix]
    except (InvalidOperation, KeyError):
        return None


def normalise(attributes: Iterable[tuple[str, str]]) -> list[Parameter]:
    """Canonical parameters first, in the order of ``KEYS``; everything else raw, as the distributor wrote it."""

    found: dict[str, Parameter] = {}
    rest: list[Parameter] = []
    for name, raw in attributes:
        name, raw = name.strip(), raw.strip()
        if not name or not raw or raw == "-":
            continue
        key = canonical_key(name)
        if key is None:
            rest.append(Parameter(name, raw))
            continue
        if key in found:
            continue  # the first spelling wins; a second source is kept raw below
        unit = KEYS[key][0]
        value = parse_quantity(raw, unit) if unit else None
        found[key] = Parameter(name, raw, key, value, unit)
    order = list(KEYS)
    return [found[key] for key in order if key in found] + rest


def differs(left: Decimal | None, right: Decimal | None, tolerance: Decimal = Decimal("0.001")) -> bool:
    """Whether two parsed values disagree by more than ``tolerance`` (relative). Unknown values never disagree."""

    if left is None or right is None:
        return False
    if left == right:
        return False
    base = max(abs(left), abs(right))
    return abs(left - right) / base > tolerance
