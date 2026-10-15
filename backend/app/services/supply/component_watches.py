"""Watching a catalog component: its own part and, when asked, every alternate approved for it.

A component watch is a standing request. ``sync`` turns it into ordinary part watches (one per part), so the
poller, alerts and the Parts list work as they do for any watched part. It runs when the watch is set, when an
alternate is approved, and on the supply poll job, so an alternate approved later is picked up without anyone
returning to the component. The component's packaging is applied when its part watches are created and when the
component watch is set; a later sync leaves a packaging someone set on a part alone. Stopping a component watch leaves the part watches alone: they may be wanted for
other reasons.
"""

from __future__ import annotations

from typing import Any, Callable, Iterable, Mapping

from app.services.supply import sources, stock, tracking, watches
from app.services.supply.audit import actor_text, write_audit

Identities = Callable[[Iterable[str]], Mapping[str, tuple[str, str]]]
SYSTEM = "system"


class ComponentWatchError(ValueError):
    """The request is not valid. The message is safe to show."""


def get(conn, component_id: str) -> dict[str, Any] | None:
    row = conn.execute(
        "SELECT component_id, include_alternates, packaging, tier, rate, owner FROM component_watches WHERE component_id = %s", (component_id,)
    ).fetchone()
    return dict(row) if row else None


def set_watch(
    conn, component_id: str, actor: str, identities: Identities, *, include_alternates: bool, packaging: str = "any",
    tier: int = 2, rate: str = "weekly",
) -> dict[str, Any]:
    actor = actor_text(actor)
    if packaging not in stock.POLICIES:
        raise ComponentWatchError("Packaging is any, cut_tape, tape_reel, tray, tube or bulk.")
    try:
        tier, rate = tracking.check_tier(tier, rate)
    except tracking.TrackingError as exc:
        raise ComponentWatchError(str(exc)) from exc
    maker, mpn = identities([component_id]).get(component_id, ("", ""))
    if not maker.strip() or not mpn.strip():
        raise ComponentWatchError("The component needs a manufacturer and a part number before it can be watched.")
    conn.execute(
        """
        INSERT INTO component_watches (component_id, include_alternates, packaging, tier, rate, owner, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (component_id) DO UPDATE SET include_alternates = EXCLUDED.include_alternates,
            packaging = EXCLUDED.packaging, tier = EXCLUDED.tier, rate = EXCLUDED.rate
        """,
        (component_id, include_alternates, packaging, tier, rate, actor, actor),
    )
    write_audit(conn, actor, "component_watch.set", component_id,
                {"include_alternates": include_alternates, "packaging": packaging, "tier": tier, "rate": rate},
                subject_kind="component")
    sync_component(conn, component_id, identities, actor, apply_packaging=True)
    return get(conn, component_id) or {}


def remove_watch(conn, component_id: str, actor: str) -> None:
    actor = actor_text(actor)
    conn.execute("DELETE FROM component_watches WHERE component_id = %s", (component_id,))
    write_audit(conn, actor, "component_watch.remove", component_id, {}, subject_kind="component")


def sync_component(conn, component_id: str, identities: Identities, actor: str = SYSTEM, *, apply_packaging: bool = False) -> int:
    """Make sure the component's parts are watched. Returns how many part watches were added.

    A new part watch takes the component's packaging. An existing one keeps its own unless ``apply_packaging`` is
    set, which is when a person has just set the component watch.
    """

    row = get(conn, component_id)
    if row is None:
        return 0
    # The component's own part follows the component's tier; its approved alternates are always tier 2.
    wanted: list[tuple[str, str, int, str]] = []
    maker, mpn = identities([component_id]).get(component_id, ("", ""))
    if maker.strip() and mpn.strip():
        wanted.append((maker, mpn, row["tier"], row["rate"]))
    if row["include_alternates"]:
        wanted += [
            (item["manufacturer"], item["mpn"], tracking.TIER_2, "weekly")
            for item in sources.list_sources(conn, component_id) if item["approval"] == sources.APPROVED
        ]
    added = 0
    for maker, mpn, tier, rate in wanted:
        with conn.transaction():
            record, created = watches.add_watch(conn, maker, mpn, actor, tier=tier, rate=rate, origin="component")
            if (created or apply_packaging) and record.packaging != row["packaging"]:
                watches.update_watch(conn, record.id, actor, packaging=row["packaging"])
        added += 1 if created else 0
    return added


def sync_all(conn, identities: Identities) -> int:
    added = 0
    for row in conn.execute("SELECT component_id FROM component_watches ORDER BY component_id").fetchall():
        added += sync_component(conn, row["component_id"], identities)
    return added
