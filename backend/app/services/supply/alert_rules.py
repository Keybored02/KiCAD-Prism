"""What a person wants to hear about a tracked part: which alerts to mute, how big a price rise matters, and a target price.

Rules are kept apart from the watch so a part tracked for another reason (a project) can carry them too.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Iterable, Mapping

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit

# Kinds a person may switch off. A lost part, a change notice and an obsolete part are facts and stay on.
MUTABLE = ("out_of_stock", "below_threshold", "rupture_soon", "price_up", "target_price_missed", "assessment_worse")
PRICE_RISE_RANGE = (1, 500)


class RuleError(ValueError):
    """The rules do not apply. The message is safe to show."""


@dataclass(frozen=True, slots=True)
class Rules:
    muted: frozenset[str] = frozenset()
    price_rise_percent: int | None = None
    target_price: Decimal | None = None
    target_currency: str = ""

    def to_dto(self) -> dict[str, Any]:
        return {
            "muted": sorted(self.muted), "price_rise_percent": self.price_rise_percent,
            "target_price": format(self.target_price.normalize(), "f") if self.target_price is not None else None,
            "target_currency": self.target_currency,
        }


NONE = Rules()


def _row_rules(row: Mapping[str, Any]) -> Rules:
    return Rules(frozenset(row["muted"]), row["price_rise_percent"], row["target_price"], row["target_currency"])


def for_parts(conn, part_ids: Iterable[str]) -> dict[str, Rules]:
    ids = sorted(set(part_ids))
    if not ids:
        return {}
    rows = conn.execute(
        "SELECT part_id, muted, price_rise_percent, target_price, target_currency FROM alert_rules WHERE part_id = ANY(%s)", (ids,)
    ).fetchall()
    return {row["part_id"]: _row_rules(row) for row in rows}


def get(conn, part_id: str) -> Rules:
    return for_parts(conn, [part_id]).get(part_id, NONE)


def check(payload: Mapping[str, Any]) -> Rules:
    muted = payload.get("muted", [])
    if not isinstance(muted, list) or any(item not in MUTABLE for item in muted):
        raise RuleError(f"Only these alerts can be switched off: {', '.join(MUTABLE)}.")
    rise = payload.get("price_rise_percent")
    if rise is not None and (isinstance(rise, bool) or not isinstance(rise, int) or not PRICE_RISE_RANGE[0] <= rise <= PRICE_RISE_RANGE[1]):
        raise RuleError(f"A price rise is a whole percent from {PRICE_RISE_RANGE[0]} to {PRICE_RISE_RANGE[1]}.")
    target, currency = payload.get("target_price"), str(payload.get("target_currency") or "").upper()
    value: Decimal | None = None
    if target not in (None, ""):
        try:
            value = Decimal(str(target))
        except InvalidOperation:
            raise RuleError("The target price is a number.") from None
        if value <= 0 or value > Decimal("1000000"):
            raise RuleError("The target price is above 0.")
        if len(currency) != 3 or not currency.isalpha():
            raise RuleError("Give the target price a three letter currency, such as EUR.")
    else:
        currency = ""
    return Rules(frozenset(muted), rise, value, currency)


def save(conn, part_id: str, payload: Mapping[str, Any], actor: str) -> Rules:
    """Replace the part's rules. Rules equal to the defaults remove the row."""

    from app.services.supply import alerts

    actor = actor_text(actor)
    parts.get_part(conn, part_id)
    rules = check(payload)
    if rules == NONE:
        conn.execute("DELETE FROM alert_rules WHERE part_id = %s", (part_id,))
    else:
        conn.execute(
            """
            INSERT INTO alert_rules (part_id, muted, price_rise_percent, target_price, target_currency, updated_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (part_id) DO UPDATE SET muted = EXCLUDED.muted, price_rise_percent = EXCLUDED.price_rise_percent,
                target_price = EXCLUDED.target_price, target_currency = EXCLUDED.target_currency,
                updated_by = EXCLUDED.updated_by, updated_at = NOW()
            """,
            (part_id, sorted(rules.muted), rules.price_rise_percent, rules.target_price, rules.target_currency, actor),
        )
    write_audit(conn, actor, "alert_rules.save", part_id, rules.to_dto(), subject_kind="part")
    alerts.evaluate_parts(conn, [part_id], datetime.now(timezone.utc))
    return rules
