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
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable, Sequence

from app.services.supply import alerts, demand, ledger, pricing, stock, tiers, trouble
from app.services.supply.connectors import ConnectorService
from app.services.supply.models import Offer
from app.services.supply.providers import registry
from app.services.supply.providers.base import AuthError, ProviderError, RateLimited, SupplyProvider
from app.services.supply.store import SupplyStore, supply_store
from app.services.supply.vocabulary import Lifecycle

MAX_BATCHES_PER_RUN = 20
MISSES_BEFORE_GONE = 3

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


@dataclass(frozen=True, slots=True)
class PollSummary:
    connector_id: str
    calls: int = 0
    polled: int = 0
    gone: int = 0
    stopped: str | None = None


def due_listings(conn, connector_id: str, now: datetime, limit: int, only_part: str | None = None) -> list[DueListing]:
    """Counted listings of watched parts that have never been polled or whose time has come.

    ``only_part`` asks for that part's counted listings whatever their schedule, watched or not:
    it is a person asking to read one part now.
    """

    if only_part is not None:
        rows = conn.execute(
            """
            SELECT l.id, l.sku, l.part_id, COALESCE(ps.error_streak, 0) AS error_streak,
                   COALESCE(ps.missing_streak, 0) AS missing_streak, ps.last_change_at
            FROM listings l LEFT JOIN poll_state ps ON ps.listing_id = l.id
            WHERE l.connector_id = %s AND l.part_id = %s AND l.match_state IN ('exact', 'manual')
            ORDER BY l.sku LIMIT %s
            """,
            (connector_id, only_part, limit),
        ).fetchall()
        return [
            DueListing(r["id"], r["sku"], r["part_id"], int(r["error_streak"]), int(r["missing_streak"]), r["last_change_at"])
            for r in rows
        ]
    rows = conn.execute(
        """
        SELECT l.id, l.sku, l.part_id, COALESCE(ps.error_streak, 0) AS error_streak,
               COALESCE(ps.missing_streak, 0) AS missing_streak, ps.last_change_at
        FROM listings l
        JOIN watches w ON w.part_id = l.part_id
        LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.connector_id = %s AND l.match_state IN ('exact', 'manual')
          AND (ps.listing_id IS NULL OR ps.next_poll_at <= %s)
        ORDER BY COALESCE(ps.next_poll_at, '-infinity'::timestamptz), l.sku
        LIMIT %s
        """,
        (connector_id, now, limit),
    ).fetchall()
    return [
        DueListing(r["id"], r["sku"], r["part_id"], int(r["error_streak"]), int(r["missing_streak"]), r["last_change_at"])
        for r in rows
    ]


def _chunks(items: Sequence[DueListing], size: int) -> list[Sequence[DueListing]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


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

    def poll_connector(self, connector_id: str, *, interactive: bool = False, only_part: str | None = None) -> PollSummary:
        now = self._clock()
        connector = self._connectors.get(connector_id)
        if not connector["enabled"] or connector["paused_reason"] or not connector["provider_available"]:
            return PollSummary(connector_id, stopped=STOPPED_INACTIVE)
        spec = registry.get_spec(connector["provider"])

        if trouble.cooling_down(self._store, connector_id, now):
            return PollSummary(connector_id, stopped=STOPPED_COOLING_DOWN)
        with self._store.connection() as conn:
            due = due_listings(conn, connector_id, now, spec.max_batch * MAX_BATCHES_PER_RUN, only_part)
        if not due:
            return PollSummary(connector_id, stopped=STOPPED_NOTHING_DUE)

        provider = self._provider_for(connector_id)
        calls = polled = gone = 0
        stopped: str | None = None
        for batch in _chunks(due, spec.max_batch):
            if spec.metered and not ledger.spend_call(
                self._store, connector, now=now, interactive=interactive, units=spec.calls_per_offers_batch
            ):
                stopped = STOPPED_BUDGET
                break
            calls += 1
            try:
                offers = provider.get_offers([row.sku for row in batch])
            except ProviderError as exc:
                if not isinstance(exc, (RateLimited, AuthError)):
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
                    VALUES (%s, 'normal', %s, %s, %s, %s)
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

    def _record_offer(self, conn, row: DueListing, offer: Offer, now: datetime) -> None:
        price = pricing.unit_price_at(
            [(item.quantity, item.unit_price) for item in offer.price_breaks],
            moq=offer.moq, order_multiple=offer.order_multiple,
        )
        previous = conn.execute(
            "SELECT stock, unit_price, lifecycle, discontinued FROM samples WHERE listing_id = %s "
            "ORDER BY sampled_at DESC LIMIT 1", (row.id,)
        ).fetchone()
        changed = previous is None or (
            previous["stock"] != offer.stock
            or previous["unit_price"] != price
            or previous["lifecycle"] != offer.lifecycle.value
            or previous["discontinued"] != offer.discontinued
        )

        conn.execute(
            """
            INSERT INTO offers (listing_id, fetched_at, stock, incoming, moq, order_multiple, packaging, price_breaks,
                                currency, lead_time_days, lifecycle, discontinued, rohs, marketplace, product_url)
            VALUES (%s, %s, %s, %s::jsonb, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (listing_id) DO UPDATE SET
                fetched_at = EXCLUDED.fetched_at, stock = EXCLUDED.stock, incoming = EXCLUDED.incoming,
                moq = EXCLUDED.moq, order_multiple = EXCLUDED.order_multiple, packaging = EXCLUDED.packaging,
                price_breaks = EXCLUDED.price_breaks, currency = EXCLUDED.currency,
                lead_time_days = EXCLUDED.lead_time_days, lifecycle = EXCLUDED.lifecycle,
                discontinued = EXCLUDED.discontinued, rohs = EXCLUDED.rohs, marketplace = EXCLUDED.marketplace,
                product_url = EXCLUDED.product_url
            """,
            (
                row.id, offer.fetched_at, offer.stock,
                json.dumps([[item.quantity, item.expected.isoformat() if item.expected else None] for item in offer.incoming]),
                offer.moq, offer.order_multiple, offer.packaging.value,
                json.dumps([[item.quantity, str(item.unit_price)] for item in offer.price_breaks]),
                offer.currency, offer.lead_time_days, offer.lifecycle.value, offer.discontinued, offer.rohs,
                offer.marketplace, offer.product_url,
            ),
        )
        conn.execute(
            """
            INSERT INTO samples (listing_id, sampled_at, stock, incoming_qty, unit_price, currency, lead_time_days,
                                 lifecycle, discontinued, marketplace)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (listing_id, sampled_at) DO NOTHING
            """,
            (row.id, offer.fetched_at, offer.stock, sum(item.quantity for item in offer.incoming), price,
             offer.currency, offer.lead_time_days, offer.lifecycle.value, offer.discontinued, offer.marketplace),
        )
        conn.execute("UPDATE listings SET packaging = %s, last_seen_at = %s WHERE id = %s", (offer.packaging.value, now, row.id))

        last_change = now if changed else row.last_change_at
        tier = self._tier_for(conn, row, offer.lifecycle, last_change, now)
        self._write_state(conn, row.id, tier, now, last_change, key=row.id)

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
                (row.part_id, row.id, json.dumps({"sku": row.sku})),
            )
            return 1
        # Asking again soon does not change how urgent the listing is.
        current = conn.execute("SELECT tier FROM poll_state WHERE listing_id = %s", (row.id,)).fetchone()
        tier = tiers.Tier(current["tier"]) if current else tiers.Tier.NORMAL
        self._write_state(conn, row.id, tier, now, row.last_change_at, key=row.id, missing=misses)
        return 0

    def _tier_for(self, conn, row: DueListing, lifecycle: Lifecycle, last_change: datetime | None, now: datetime) -> tiers.Tier:
        watch = conn.execute("SELECT threshold, pinned FROM watches WHERE part_id = %s", (row.part_id,)).fetchone()
        return tiers.choose_tier(tiers.TierInputs(
            now=now,
            watched=watch is not None,
            pinned=bool(watch and watch["pinned"]),
            lifecycle=lifecycle,
            total_stock=stock.part_stock(conn, row.part_id).total,
            threshold=watch["threshold"] if watch else None,
            last_change_at=last_change,
            demand=demand.open_totals(conn, [row.part_id]).get(row.part_id),
        ))

    @staticmethod
    def _write_state(conn, listing_id: str, tier: tiers.Tier, now: datetime, last_change: datetime | None,
                     *, key: str, missing: int = 0) -> None:
        # A listing that is merely missing is asked again within the hour, not on its tier.
        when = now + min(tiers.interval(tier), timedelta(hours=1)) if missing else tiers.next_poll_at(now, tier, key=key)
        conn.execute(
            """
            INSERT INTO poll_state (listing_id, tier, next_poll_at, last_polled_at, last_change_at,
                                    error_streak, missing_streak, last_error_code)
            VALUES (%s, %s, %s, %s, %s, 0, %s, '')
            ON CONFLICT (listing_id) DO UPDATE SET
                tier = EXCLUDED.tier, next_poll_at = EXCLUDED.next_poll_at, last_polled_at = EXCLUDED.last_polled_at,
                last_change_at = EXCLUDED.last_change_at, error_streak = 0,
                missing_streak = EXCLUDED.missing_streak, last_error_code = ''
            """,
            (listing_id, tier.value, when, now, last_change, missing),
        )

