"""Part identity helpers shared by every supply feature.

``match_key`` is for lookup only. It is never displayed and never replaces the
catalog's own identity (``normalize_identity_value``: trim and lowercase).

The rule is deliberately conservative. Two part numbers that differ in a
character that carries meaning must not collide: dots and slashes stay, so
``1.0UF`` and ``10UF`` are different keys. Only whitespace, hyphens and
underscores are ignored, because distributors and people disagree about them
(``LM358-D`` and ``LM358D``) far more often than they mean different parts.
"""

from __future__ import annotations

import re
import unicodedata

# Hyphen-like characters: hyphen-minus, hyphen, non-breaking hyphen, figure
# dash, en dash, em dash, minus sign.
_IGNORED = re.compile(r"[\s_‐‑‒–—−-]+")


def match_key(part_number: str) -> str:
    """The lookup key for a manufacturer part number. Empty for blank input."""

    return _IGNORED.sub("", unicodedata.normalize("NFKC", part_number or "")).upper()
