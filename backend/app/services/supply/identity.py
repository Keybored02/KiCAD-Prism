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


# Legal-form words dropped from the end of a manufacturer name. Only these:
# "TI" and "Texas Instruments" stay different until a person confirms the alias.
_LEGAL_FORMS = frozenset({
    "inc", "incorporated", "corp", "corporation", "co", "company", "ltd", "limited", "llc", "plc",
    "gmbh", "ag", "sa", "bv", "nv", "srl", "spa", "ab", "as", "oy", "kg", "kk", "pte", "pty",
})
_PUNCTUATION = re.compile(r"[.,;:'\"()\[\]!?]")


def alias_key(name: str) -> str:
    """The key under which a manufacturer spelling is looked up. Blank for blank input.

    Case, punctuation, ``&`` and trailing legal forms are ignored, so
    ``Texas Instruments Inc.`` and ``TEXAS INSTRUMENTS`` share a key.
    """

    text = unicodedata.normalize("NFKC", name or "").casefold().replace("&", " and ")
    words = _PUNCTUATION.sub(" ", text).replace("-", " ").split()
    while len(words) > 1 and words[-1] in _LEGAL_FORMS:
        words.pop()
    return " ".join(words)
