"""Polling watched listings and recording what the distributor says.

One call to ``poll_connector`` takes the listings of one connector that are due,
spends the call budget in batches, asks the provider, and records the answer.
Provider calls happen outside any database transaction.

Reactions to trouble:

* budget spent: stop quietly; the rest stay due and wait for more budget
* rate limited: hold the whole connector off until the provider says
* credentials rejected: pause the connector so it stops spending anything
* unavailable or any other provider error: stop the run, back the batch off
* a SKU missing from an answer: tolerated twice, marked gone on the third
"""

from __future__ import annotations

import json
from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
from typing import Callable, Sequence

from app.services.supply import alerts, alternates, facts, insights, ledger, parts_view, price_breaks, pricing, promises, stock, stock_events, tiers, trouble
from app.services.supply.connectors import ConnectorService
from app.services.supply.discovery import remember_datasheet
from app.services.supply.identity import match_key
from app.services.supply.models import Offer
from app.services.supply.providers import packaging_hints, registry
from app.services.supply.providers.base import AuthError, Blocked, ProviderError, RateLimited, SupplyProvider
from app.services.supply.store import SupplyStore, supply_store
from app.services.supply.vocabulary import Lifecycle, Packaging

MAX_BATCHES_PER_RUN = 20
# A tier-2 listing read early from spare budget is not read early again for this long.
EARLY_GAP = timedelta(days=1)
# For a provider that reads a part's listings together, how many due listings a run starts from per batch (a part
# usually has two or three packagings).
GROUP_LISTINGS = 3
MISSES_BEFORE_GONE = 3
# A listing's reading is kept at least this often, changed or not, so a flat line is still a line.
SAMPLE_EVERY = timedelta(days=1)

STOPPED_INACTIVE = "inactive"
STOPPED_COOLING_DOWN = "cooling_down"
STOPPED_NOTHING_DUE = "nothing_due"
STOPPED_BUDGET = "budget"


@dataclass(frozen=True, slots=True)
class DueListing:
    id: str
    sku: str
    part_id: str
    error_streak: int
    missing_streak: int
    last_change_at: datetime | None
    # The part's tracking tier (2 for a part nobody tracks), which says what the read is charged to.
    tier: int = 2
    # What the last failed read said ("" when it did not fail).
    last_error_code: str = ""


@dataclass(frozen=True, slots=True)
class PollSummary:
    connector_id: str
    calls: int = 0
    polled: int = 0
    gone: int = 0
    stopped: str | None = None


# When the budget cannot serve everything, tier 1 comes before tier 2; within a tier a listing never read goes first, then
# the most urgent (low stock, near the threshold, ending life, projected to run out), then the one waiting longest.
_SERVICE_ORDER = (
    "pt.tier, (ps.listing_id IS NOT NULL), COALESCE(ps.urgency, 0), "
    "COALESCE(ps.next_poll_at, '-infinity'::timestamptz), l.sku"
)


def _due(r) -> DueListing:
    return DueListing(
        r["id"], r["sku"], r["part_id"], int(r["error_streak"]), int(r["missing_streak"]), r["last_change_at"], int(r["tier"]),
        r.get("last_error_code") or "",
    )


def due_listings(
    conn, connector_id: str, now: datetime, limit: int, only_part: str | Sequence[str] | None = None, *, metered: bool = True
) -> list[DueListing]:
    """Counted listings of followed parts that have never been polled or whose time has come.

    A part is read at a connector once it is admitted there (a connector that is not metered admits everything), and
    only the listing a person picked when one is picked.

    ``only_part`` (a part id, or several) asks for the counted listings of those parts whatever their schedule, tracked or not:
    it is a person asking to read one part now.
    """

    if only_part is not None:
        rows = conn.execute(
            """
            SELECT l.id, l.sku, l.part_id, COALESCE(ps.error_streak, 0) AS error_streak,
                   COALESCE(ps.missing_streak, 0) AS missing_streak, ps.last_change_at,
                   COALESCE((SELECT pt.tier FROM part_tiers pt WHERE pt.part_id = l.part_id), 2) AS tier
            FROM listings l LEFT JOIN poll_state ps ON ps.listing_id = l.id
            WHERE l.connector_id = %s AND l.part_id = ANY(%s) AND l.match_state IN ('exact', 'manual')
            ORDER BY l.part_id, l.sku LIMIT %s
            """,
            (connector_id, [only_part] if isinstance(only_part, str) else list(only_part), limit),
        ).fetchall()
        return [
            _due(r)
            for r in rows
        ]
    rows = conn.execute(
        f"""
        SELECT l.id, l.sku, l.part_id, COALESCE(ps.error_streak, 0) AS error_streak,
               COALESCE(ps.missing_streak, 0) AS missing_streak, ps.last_change_at, pt.tier,
               COALESCE(ps.last_error_code, '') AS last_error_code
        FROM listings l
        JOIN part_tiers pt ON pt.part_id = l.part_id
        LEFT JOIN admissions a ON a.part_id = l.part_id AND a.connector_id = l.connector_id
        LEFT JOIN packaging_picks pk ON pk.part_id = l.part_id AND pk.connector_id = l.connector_id
        LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.connector_id = %s AND l.match_state IN ('exact', 'manual')
          AND (NOT %s OR a.state = 'admitted')
          AND (pk.listing_id IS NULL OR pk.listing_id = l.id)
          AND (ps.listing_id IS NULL OR ps.next_poll_at <= %s)
        ORDER BY {_SERVICE_ORDER}
        LIMIT %s
        """,
        (connector_id, metered, now, limit),
    ).fetchall()
    return [
        _due(r)
        for r in rows
    ]


def spare_listings(conn, connector_id: str, now: datetime, limit: int, kind: str) -> list[DueListing]:
    """Listings to read from spare budget.

    ``waiting``: counted listings of parts that wait for room here, not read since their rate asks.
    ``tier2_early``: tier-2 listings admitted here that are not yet due, the soonest due first, and not read in the last
    ``EARLY_GAP``: early reads make a tier-2 part fresher, never read more often than a tier-1 one.
    """

    if kind == "waiting":
        where = "a.state = 'waiting' AND (ps.listing_id IS NULL OR ps.next_poll_at <= %(now)s)"
        order = "COALESCE(ps.next_poll_at, '-infinity'::timestamptz), l.sku"
    elif kind == "tier2_early":
        where = (
            "a.state = 'admitted' AND pt.tier = 2 AND ps.listing_id IS NOT NULL AND ps.next_poll_at > %(now)s"
            " AND (ps.last_polled_at IS NULL OR ps.last_polled_at <= %(early)s)"
        )
        order = "ps.next_poll_at, l.sku"
    else:
        raise ValueError(f"unknown spare work: {kind}")
    rows = conn.execute(
        f"""
        SELECT l.id, l.sku, l.part_id, COALESCE(ps.error_streak, 0) AS error_streak,
               COALESCE(ps.missing_streak, 0) AS missing_streak, ps.last_change_at, pt.tier,
               COALESCE(ps.last_error_code, '') AS last_error_code
        FROM listings l
        JOIN part_tiers pt ON pt.part_id = l.part_id
        JOIN admissions a ON a.part_id = l.part_id AND a.connector_id = l.connector_id
        LEFT JOIN packaging_picks pk ON pk.part_id = l.part_id AND pk.connector_id = l.connector_id
        LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.connector_id = %(connector)s AND l.match_state IN ('exact', 'manual')
          AND (pk.listing_id IS NULL OR pk.listing_id = l.id) AND {where}
        ORDER BY {order}
        LIMIT %(limit)s
        """,
        {"connector": connector_id, "now": now, "limit": limit, "early": now - EARLY_GAP},
    ).fetchall()
    return [
        _due(r)
        for r in rows
    ]


def _chunks(items: Sequence[DueListing], size: int) -> list[Sequence[DueListing]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


MAX_SPLIT = 6


def _batches(items: Sequence[DueListing], size: int) -> list[Sequence[DueListing]]:
    """Batches of ``size``, except that listings whose last reads failed go in smaller ones: half the size for a second failure, a
    quarter for a third, and so on, grouped by how many times they failed. A bad listing in a batch fails it for the good ones too; this
    way the good ones split off within a few tries and the bad one ends alone. A provider that was unavailable says nothing of the
    listing, so those keep the full size."""

    levels: dict[int, list[DueListing]] = {}
    for item in items:
        level = 0 if item.error_streak < 2 or item.last_error_code == "unavailable" else min(item.error_streak - 1, MAX_SPLIT)
        levels.setdefault(level, []).append(item)
    return [chunk for level in sorted(levels) for chunk in _chunks(levels[level], max(1, size // 2 ** level))]


def _by_part(items: Sequence[DueListing]) -> list[Sequence[DueListing]]:
    """Listings grouped by part, in the order each part first appears (the service order)."""

    groups: dict[str, list[DueListing]] = {}
    for item in items:
        groups.setdefault(item.part_id, []).append(item)
    return list(groups.values())


def with_siblings(conn, connector_id: str, due: Sequence[DueListing]) -> list[DueListing]:
    """``due`` plus the other counted listings of the same parts at this connector.

    For a provider whose one answer serves all of a part's listings, the others come for free, so they are read
    in the same call rather than later in calls of their own.
    """

    have = {item.id for item in due}
    part_ids = sorted({item.part_id for item in due})
    if not part_ids:
        return list(due)
    rows = conn.execute(
        """
        SELECT l.id, l.sku, l.part_id, COALESCE(ps.error_streak, 0) AS error_streak,
               COALESCE(ps.missing_streak, 0) AS missing_streak, ps.last_change_at,
               COALESCE((SELECT pt.tier FROM part_tiers pt WHERE pt.part_id = l.part_id), 2) AS tier
        FROM listings l LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.connector_id = %s AND l.part_id = ANY(%s) AND l.match_state IN ('exact', 'manual') AND NOT (l.id = ANY(%s))
        ORDER BY l.sku
        """,
        (connector_id, part_ids, sorted(have)),
    ).fetchall()
    extra = [
        _due(r)
        for r in rows
    ]
    return list(due) + extra


class Poller:
    def __init__(
        self,
        connectors: ConnectorService,
        *,
        store: SupplyStore = supply_store,
        provider_for: Callable[[str], SupplyProvider] | None = None,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._connectors = connectors
        self._store = store
        self._provider_for = provider_for or connectors.load_provider
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        # The rupture projection of a part, worked out once per poll: its listings are recorded one after another.
        self._rupture: dict[str, int | None] = {}
        # The provider's day for the connector being polled, which sets when a daily listing is next due.
        self._reset: tuple[str, str] = ("00:00", "UTC")

    def poll_connector(
        self, connector_id: str, *, interactive: bool = False, only_part: str | Sequence[str] | None = None, spare: str | None = None,
        oneoff: bool = False,
    ) -> PollSummary:
        """Read what is due. With ``spare`` (a kind from ``spare_listings``) read that spare work instead, from spare budget.

        ``oneoff`` marks a check someone asked for once (``oneoff.py``): paid from the pool, and from spare budget when the
        pool is empty.
        """

        now = self._clock()
        self._rupture.clear()
        connector = self._connectors.get(connector_id)
        if not connector["enabled"] or connector["paused_reason"] or not connector["provider_available"]:
            return PollSummary(connector_id, stopped=STOPPED_INACTIVE)
        spec = registry.get_spec(connector["provider"])
        self._reset = (connector["reset_time"], connector["reset_tz"])

        if trouble.cooling_down(self._store, connector_id, now):
            return PollSummary(connector_id, stopped=STOPPED_COOLING_DOWN)
        with self._store.connection() as conn:
            limit = (GROUP_LISTINGS if spec.groups_by_part else spec.max_batch) * MAX_BATCHES_PER_RUN
            due = (
                spare_listings(conn, connector_id, now, limit, spare) if spare
                else due_listings(conn, connector_id, now, limit, only_part, metered=spec.metered)
            )
            if spec.groups_by_part:
                due = with_siblings(conn, connector_id, due)
        if not due:
            return PollSummary(connector_id, stopped=STOPPED_NOTHING_DUE)

        provider = self._provider_for(connector_id)
        calls = polled = gone = 0
        stopped: str | None = None
        for batch in _by_part(due) if spec.groups_by_part else _batches(due, spec.max_batch):
            purpose = (
                ledger.PURPOSE_ONE_OFF if oneoff else ledger.PURPOSE_INTERACTIVE if interactive else ledger.PURPOSE_SPARE if spare
                else f"tier{min(row.tier for row in batch)}"
            )

            def spend(from_spare: bool) -> bool:
                return ledger.spend_call(
                    self._store, connector, now=now, interactive=interactive or (oneoff and not from_spare), units=spec.calls_per_offers_batch,
                    kind=ledger.KIND_OFFERS, purpose=purpose, spare=bool(spare) or from_spare,
                )

            if spec.metered and not (spend(False) or (oneoff and spend(True))):
                stopped = STOPPED_BUDGET
                break
            calls += 1
            try:
                offers = provider.get_offers([row.sku for row in batch])
                # A group that needed more calls than the one it paid for (two products) pays the rest now.
                extra = getattr(provider, "last_batch_calls", 1) - spec.calls_per_offers_batch if spec.groups_by_part else 0
                if extra > 0:
                    ledger.record_calls(
                        self._store, connector_id, extra, now=now, interactive=interactive, kind=ledger.KIND_OFFERS, purpose=purpose
                    )
                    calls += extra
            except ProviderError as exc:
                if not isinstance(exc, (RateLimited, AuthError, Blocked)):
                    # Only a failure of this batch is the batch's fault; a rate limit or
                    # bad credentials say nothing about the listings.
                    self._record_failure(batch, now, exc.code)
                stopped = trouble.react(self._connectors, self._store, connector_id, exc, now)
                break
            with self._store.connection() as conn:
                gone += self._record_answer(conn, batch, offers, now)
                alerts.evaluate_parts(conn, (row.part_id for row in batch), now)
            polled += len(batch)
            self._connectors.record_result(connector_id)
        return PollSummary(connector_id, calls=calls, polled=polled, gone=gone, stopped=stopped)

    # --- recording --------------------------------------------------------

    def _record_failure(self, batch: Sequence[DueListing], now: datetime, code: str) -> None:
        with self._store.connection() as conn:
            for row in batch:
                streak = row.error_streak + 1
                conn.execute(
                    """
                    INSERT INTO poll_state (listing_id, tier, next_poll_at, last_polled_at, error_streak, last_error_code)
                    VALUES (%s, 'daily', %s, %s, %s, %s)
                    ON CONFLICT (listing_id) DO UPDATE SET
                        next_poll_at = EXCLUDED.next_poll_at, last_polled_at = EXCLUDED.last_polled_at,
                        error_streak = EXCLUDED.error_streak, last_error_code = EXCLUDED.last_error_code
                    """,
                    (row.id, tiers.retry_at(now, streak, key=row.id), now, streak, code[:64]),
                )

    def _record_answer(self, conn, batch: Sequence[DueListing], offers: Sequence[Offer], now: datetime) -> int:
        """Store one answer. Returns how many listings it marked gone."""

        by_sku = {offer.sku: offer for offer in offers}
        gone = 0
        for row in batch:
            offer = by_sku.get(row.sku)
            if offer is None:
                gone += self._record_missing(conn, row, now)
            else:
                self._record_offer(conn, row, offer, now)
        return gone

    @staticmethod
    def _bom_link_is_wrong(conn, row: DueListing, offer: Offer) -> bool:
        """A number taken from a BOM field is trusted until the distributor names the product. If the product is another
        part (not the same number, nor one that extends it, as with a packaging suffix), the link is only a near match
        and its figures are not kept. True when the link was demoted."""

        link = conn.execute(
            "SELECT l.match_state, l.matched_by, p.match_key FROM listings l JOIN parts p ON p.id = l.part_id WHERE l.id = %s",
            (row.id,),
        ).fetchone()
        if link is None or link["match_state"] != "manual" or link["matched_by"] != "bom" or not offer.mpn.strip():
            return False
        wanted, found = link["match_key"], match_key(offer.mpn)
        if not found or wanted == found or found.startswith(wanted) or wanted.startswith(found):
            return False
        conn.execute(
            "UPDATE listings SET match_state = 'near', match_reason = %s WHERE id = %s",
            (f"The BOM gave this number, but the distributor lists it as {offer.mpn.strip()[:80]}.", row.id),
        )
        return True

    def _record_offer(self, conn, row: DueListing, offer: Offer, now: datetime) -> None:
        if self._bom_link_is_wrong(conn, row, offer):
            return
        if offer.packaging is Packaging.UNKNOWN and offer.provider not in packaging_hints.NO_GUESS:
            guess = packaging_hints.infer(
                offer.sku, offer.moq, offer.order_multiple, offer.price_breaks[0].quantity if offer.price_breaks else None)
            if guess is not Packaging.UNKNOWN:
                offer = replace(offer, packaging=guess, packaging_inferred=True)
        price = pricing.unit_price_at(
            [(item.quantity, item.unit_price) for item in offer.price_breaks],
            moq=offer.moq, order_multiple=offer.order_multiple,
        )
        previous = conn.execute(
            "SELECT sampled_at, stock, unit_price, lifecycle, discontinued, moq, order_multiple FROM samples WHERE listing_id = %s "
            "ORDER BY sampled_at DESC LIMIT 1", (row.id,)
        ).fetchone()
        changed = previous is None or (
            previous["stock"] != offer.stock
            or previous["unit_price"] != price
            or previous["lifecycle"] != offer.lifecycle.value
            or previous["discontinued"] != offer.discontinued
            or previous["moq"] != offer.moq
            or previous["order_multiple"] != offer.order_multiple
        )

        conn.execute(
            """
            INSERT INTO offers (listing_id, fetched_at, stock, incoming, moq, order_multiple, packaging, price_breaks,
                                currency, lead_time_days, lifecycle, discontinued, rohs, marketplace, product_url, reach_affected,
                                reel_size, packaging_inferred)
            VALUES (%s, %s, %s, %s::jsonb, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (listing_id) DO UPDATE SET
                fetched_at = EXCLUDED.fetched_at, stock = EXCLUDED.stock, incoming = EXCLUDED.incoming,
                moq = EXCLUDED.moq, order_multiple = EXCLUDED.order_multiple, packaging = EXCLUDED.packaging,
                price_breaks = EXCLUDED.price_breaks, currency = EXCLUDED.currency,
                lead_time_days = EXCLUDED.lead_time_days, lifecycle = EXCLUDED.lifecycle,
                discontinued = EXCLUDED.discontinued, rohs = EXCLUDED.rohs, marketplace = EXCLUDED.marketplace,
                product_url = EXCLUDED.product_url, reach_affected = EXCLUDED.reach_affected,
                reel_size = EXCLUDED.reel_size, packaging_inferred = EXCLUDED.packaging_inferred
            """,
            (
                row.id, offer.fetched_at, offer.stock,
                json.dumps([[item.quantity, item.expected.isoformat() if item.expected else None] for item in offer.incoming]),
                offer.moq, offer.order_multiple, offer.packaging.value,
                json.dumps([[item.quantity, str(item.unit_price)] for item in offer.price_breaks]),
                offer.currency, offer.lead_time_days, offer.lifecycle.value, offer.discontinued, offer.rohs,
                offer.marketplace, offer.product_url, offer.reach_affected, offer.reel_size, offer.packaging_inferred,
            ),
        )
        price_breaks.record(
            conn, row.id, offer.fetched_at, [(item.quantity, item.unit_price) for item in offer.price_breaks],
            offer.currency, offer.moq, offer.order_multiple,
        )
        # A reading is kept when something changed since the last, or the last is a day old; a re-read of an unchanged
        # listing the same day adds nothing.
        if changed or previous["sampled_at"] <= offer.fetched_at - SAMPLE_EVERY:
            conn.execute(
                """
                INSERT INTO samples (listing_id, sampled_at, stock, incoming_qty, unit_price, currency, lead_time_days,
                                     lifecycle, discontinued, marketplace, moq, order_multiple)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (listing_id, sampled_at) DO NOTHING
                """,
                (row.id, offer.fetched_at, offer.stock, sum(item.quantity for item in offer.incoming), price,
                 offer.currency, offer.lead_time_days, offer.lifecycle.value, offer.discontinued, offer.marketplace,
                 offer.moq, offer.order_multiple),
            )
        promises.record(conn, row.id, offer.incoming, previous["stock"] if previous is not None else None, offer.stock, now)
        stock_events.record(conn, row.id, previous["stock"] if previous is not None else None, offer.stock, offer.lead_time_days, offer.marketplace, now)
        conn.execute("UPDATE listings SET packaging = %s, last_seen_at = %s WHERE id = %s", (offer.packaging.value, now, row.id))
        # Compliance and trade facts come with the answer; keeping them costs no call.
        stocked_before = conn.execute(
            "SELECT value FROM part_facts WHERE part_id = %s AND provider = %s AND name = 'normally_stocking'", (row.part_id, offer.provider)
        ).fetchone()
        facts.replace(conn, row.part_id, offer.provider, offer.facts, now)
        if offer.alternates is not None:
            alternates.replace(conn, row.part_id, offer.provider, offer.alternates, now)
        self._note_changes(conn, row, offer, previous, stocked_before["value"] if stocked_before else None)
        if offer.datasheet_url:
            remember_datasheet(conn, row.part_id, offer.datasheet_url)

        last_change = now if changed else row.last_change_at
        urgency = self._urgency_for(conn, row, offer.lifecycle, last_change, now)
        self._write_state(conn, row.id, self._schedule_of(conn, row.part_id), urgency, now, last_change, key=row.id, reset=self._reset)

    @staticmethod
    def _packaging_of(conn, listing_id: str) -> str:
        found = conn.execute("SELECT packaging FROM listings WHERE id = %s", (listing_id,)).fetchone()
        return found["packaging"] if found else "unknown"

    @staticmethod
    def _note_changes(conn, row: DueListing, offer: Offer, previous, stocked_before: str | None) -> None:
        """Write an event for what a reading shows that the one before did not: a lifecycle change, a distributor that stops
        stocking the part normally, a jump in the smallest order. Nothing is written for a first reading."""

        def event(kind: str, payload: dict) -> None:
            conn.execute(
                "INSERT INTO events (kind, part_id, listing_id, payload) VALUES (%s, %s, %s, %s::jsonb)",
                (kind, row.part_id, row.id, json.dumps({"sku": row.sku, **payload})),
            )

        if previous is not None and previous["lifecycle"] != offer.lifecycle.value and "unknown" not in (previous["lifecycle"], offer.lifecycle.value):
            event("lifecycle_changed", {"from": previous["lifecycle"], "to": offer.lifecycle.value})
        now_stocked = dict(offer.facts).get("normally_stocking")
        if stocked_before == "Yes" and now_stocked == "No":
            event("normally_stocking_lost", {})
        if previous is not None and previous["moq"] >= 1 and offer.moq >= 2 * previous["moq"]:
            event("moq_jump", {"from": previous["moq"], "to": offer.moq})

    def _record_missing(self, conn, row: DueListing, now: datetime) -> int:
        misses = row.missing_streak + 1
        if misses >= MISSES_BEFORE_GONE:
            conn.execute(
                "UPDATE listings SET match_state = 'gone', match_reason = 'not returned by the provider' WHERE id = %s",
                (row.id,),
            )
            conn.execute("DELETE FROM poll_state WHERE listing_id = %s", (row.id,))
            conn.execute(
                "INSERT INTO events (kind, part_id, listing_id, payload) VALUES ('listing_gone', %s, %s, %s::jsonb)",
                (row.part_id, row.id, json.dumps({"sku": row.sku, "packaging": self._packaging_of(conn, row.id)})),
            )
            return 1
        # Asking again soon does not change how urgent the listing is or how often it is read.
        current = conn.execute("SELECT tier, urgency FROM poll_state WHERE listing_id = %s", (row.id,)).fetchone()
        schedule = current["tier"] if current else self._schedule_of(conn, row.part_id)
        urgency = tiers.Urgency(current["urgency"]) if current else tiers.Urgency.NORMAL
        self._write_state(conn, row.id, schedule, urgency, now, row.last_change_at, key=row.id, missing=misses, reset=self._reset)
        return 0

    @staticmethod
    def _schedule_of(conn, part_id: str) -> str:
        """How often the part is read: its tracking rate. A part nobody tracks (read once on request) is not on a schedule."""

        row = conn.execute("SELECT rate FROM part_tiers WHERE part_id = %s", (part_id,)).fetchone()
        return row["rate"] if row else "monthly"

    def _urgency_for(self, conn, row: DueListing, lifecycle: Lifecycle, last_change: datetime | None, now: datetime) -> tiers.Urgency:
        watch = conn.execute("SELECT threshold, pinned FROM watches WHERE part_id = %s", (row.part_id,)).fetchone()
        rupture = None
        if watch is not None:
            if row.part_id not in self._rupture:
                insight = parts_view.insight_from(parts_view.history(conn, row.part_id, now), watch["threshold"], now)
                self._rupture[row.part_id] = insights.rupture_expected_within(insight)
            rupture = self._rupture[row.part_id]
        return tiers.urgency(tiers.UrgencyInputs(
            now=now,
            pinned=bool(watch and watch["pinned"]),
            lifecycle=lifecycle,
            total_stock=stock.part_stock(conn, row.part_id).total,
            threshold=watch["threshold"] if watch else None,
            last_change_at=last_change,
            rupture_days=rupture,
        ))

    @staticmethod
    def _write_state(conn, listing_id: str, schedule: str, urgency: tiers.Urgency, now: datetime, last_change: datetime | None,
                     *, key: str, reset: tuple[str, str], missing: int = 0) -> None:
        # A listing that is merely missing is asked again within the hour, not on its schedule.
        when = (
            now + min(tiers.interval(schedule), timedelta(hours=1)) if missing
            else tiers.next_poll_at(now, schedule, key=key, reset_time=reset[0], tz=reset[1])
        )
        conn.execute(
            """
            INSERT INTO poll_state (listing_id, tier, urgency, next_poll_at, last_polled_at, last_change_at,
                                    error_streak, missing_streak, last_error_code)
            VALUES (%s, %s, %s, %s, %s, %s, 0, %s, '')
            ON CONFLICT (listing_id) DO UPDATE SET
                tier = EXCLUDED.tier, urgency = EXCLUDED.urgency, next_poll_at = EXCLUDED.next_poll_at,
                last_polled_at = EXCLUDED.last_polled_at, last_change_at = EXCLUDED.last_change_at, error_streak = 0,
                missing_streak = EXCLUDED.missing_streak, last_error_code = ''
            """,
            (listing_id, schedule, int(urgency), when, now, last_change, missing),
        )
