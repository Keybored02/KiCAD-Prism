"""Accounts, the provider's day, the ledger's breakdown, pacing and the reactions to trouble.

Database tests need ``PRISM_DATABASE_URL`` and use a disposable schema.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
ACTOR = "ana@example.com"
START = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


class PacerTests(unittest.TestCase):
    def pacer(self, target=2.0, rng=lambda: 0.5):
        from app.services.supply.pacing import Pacer

        clock = {"t": 100.0}
        sleeps: list[float] = []

        def sleep(seconds: float) -> None:
            sleeps.append(seconds)
            clock["t"] += seconds

        return Pacer(target, monotonic=lambda: clock["t"], sleep=sleep, rng=rng), clock, sleeps

    def test_the_first_call_goes_at_once_and_later_ones_wait_a_gap_around_the_target(self) -> None:
        pacer, clock, sleeps = self.pacer(rng=lambda: 0.0)
        pacer.wait()
        pacer.wait()
        pacer.wait()
        self.assertEqual(sleeps, [1.5, 1.5], "0.75 times a 2 second target")

    def test_gaps_stay_between_three_quarters_and_one_and_a_half_times_the_target(self) -> None:
        import random

        pacer, _clock, sleeps = self.pacer(target=4.0, rng=random.Random(7).random)
        for _ in range(200):
            pacer.wait()
        self.assertTrue(all(3.0 <= gap <= 6.0 for gap in sleeps))
        self.assertGreater(len({round(gap, 3) for gap in sleeps}), 100, "never evenly spaced")

    def test_time_spent_elsewhere_counts_toward_the_gap(self) -> None:
        pacer, clock, sleeps = self.pacer(rng=lambda: 0.0)
        pacer.wait()
        clock["t"] += 10
        pacer.wait()
        self.assertEqual(sleeps, [])

    def test_a_rate_limit_doubles_the_gaps_for_a_day(self) -> None:
        pacer, clock, sleeps = self.pacer(rng=lambda: 0.0)
        pacer.slow_down()
        pacer.wait()
        pacer.wait()
        self.assertEqual(sleeps, [3.0])
        clock["t"] += 86401
        pacer.wait()
        pacer.wait()
        self.assertEqual(sleeps[1:], [1.5], "back to normal after a day")

    def test_an_account_shares_one_pacer_and_no_account_gets_its_own(self) -> None:
        from app.services.supply import pacing

        self.assertIs(pacing.pacer_for("acct-x", 1.0), pacing.pacer_for("acct-x", 1.0))
        self.assertIsNot(pacing.pacer_for("", 1.0), pacing.pacer_for("", 1.0))


class DayTests(unittest.TestCase):
    def test_the_provider_day_begins_at_its_reset_time_in_its_zone(self) -> None:
        from app.services.supply import quota

        at = datetime(2026, 3, 1, 23, 30, tzinfo=timezone.utc)
        self.assertEqual(quota.provider_day(at).isoformat(), "2026-03-01")
        self.assertEqual(quota.provider_day(at, "00:00", "Europe/Rome").isoformat(), "2026-03-02", "00:30 in Rome")
        self.assertEqual(quota.provider_day(at, "07:00", "UTC").isoformat(), "2026-03-01")
        self.assertEqual(quota.provider_day(datetime(2026, 3, 2, 6, 59, tzinfo=timezone.utc), "07:00", "UTC").isoformat(), "2026-03-01")
        self.assertEqual(quota.seconds_into_day(at, "23:00", "UTC"), 1800)
        self.assertEqual(quota.day_hour(at, "23:00", "UTC"), 0)

    def test_an_unknown_zone_or_reset_falls_back_to_utc_midnight(self) -> None:
        from app.services.supply import quota

        at = datetime(2026, 3, 1, 5, 0, tzinfo=timezone.utc)
        self.assertEqual(quota.seconds_into_day(at, "nonsense", "Mars/Base"), 5 * 3600)

    def test_background_spending_spreads_over_the_day_after_the_start_delay(self) -> None:
        from app.services.supply import quota

        state = quota.QuotaState(daily_budget=1000, spent_today=0, interactive_spent_today=0, reserve_pct=10)
        early = datetime(2026, 3, 1, 0, 2, tzinfo=timezone.utc)
        self.assertEqual(quota.background_allowance(state, early, delay_seconds=600), 0, "held back after the reset")
        late = datetime(2026, 3, 1, 23, 59, 59, tzinfo=timezone.utc)
        self.assertEqual(quota.background_allowance(state, late, delay_seconds=600), 900, "the whole committed share by the end")

    def test_the_start_delay_is_five_to_thirty_minutes_and_changes_each_day(self) -> None:
        from datetime import date

        from app.services.supply import quota

        delays = {quota.start_delay_seconds("acct", date(2026, 3, d)) for d in range(1, 29)}
        self.assertTrue(all(300 <= d <= 1800 for d in delays))
        self.assertGreater(len(delays), 10)


class SpareTests(unittest.TestCase):
    WEEK = None

    def setUp(self) -> None:
        from app.services.supply import quota

        self.quota = quota
        self.week = quota.WorkWeek("UTC", (0, 1, 2, 3, 4), "08:00", "19:00")

    def state(self, spent=0, interactive=0, spare=0, budget=1000, reserve_pct=10):
        return self.quota.QuotaState(budget, max(spent, interactive + spare), interactive, reserve_pct, spare)

    def at(self, weekday_date, hour, minute=0):
        return datetime(2026, 3, weekday_date, hour, minute, tzinfo=timezone.utc)  # 2 = Monday, 7 = Saturday

    def test_nothing_is_spare_during_working_hours(self) -> None:
        self.assertEqual(self.quota.spare_allowance(self.state(), self.at(2, 11), self.week), 0)

    def test_the_pools_unused_part_is_spare_after_hours_but_its_floor_stays(self) -> None:
        # A pool of 100; a quarter, 25, stays for people.
        self.assertEqual(self.quota.spare_allowance(self.state(), self.at(2, 20), self.week), 75)
        self.assertEqual(self.quota.spare_allowance(self.state(interactive=40), self.at(2, 20), self.week), 35)
        self.assertEqual(self.quota.spare_allowance(self.state(interactive=90), self.at(2, 20), self.week), 0)
        self.assertEqual(self.quota.spare_allowance(self.state(spare=75), self.at(2, 20), self.week), 0, "spare already spent counts")

    def test_a_non_working_day_is_spare_all_day(self) -> None:
        self.assertEqual(self.quota.spare_allowance(self.state(), self.at(7, 11), self.week), 75)
        self.assertEqual(self.quota.spare_allowance(self.state(), self.at(8, 3), self.week), 75)

    def test_everything_left_is_released_in_the_last_hours_before_the_reset_but_the_floor(self) -> None:
        self.assertEqual(self.quota.spare_allowance(self.state(spent=400), self.at(2, 21, 30), self.week), 575)
        self.assertEqual(self.quota.spare_allowance(self.state(spent=400), self.at(2, 20, 30), self.week), 75, "not yet the last hours")
        self.assertEqual(self.quota.spare_allowance(self.state(spent=990), self.at(2, 22), self.week), 0)

    def test_the_last_hours_follow_the_providers_reset(self) -> None:
        # A day that resets at 07:00 ends at 07:00, so 05:00 is inside its last three hours.
        got = self.quota.spare_allowance(self.state(spent=400), self.at(2, 5), self.week, reset_time="07:00", tz="UTC")
        self.assertEqual(got, 575)

    def test_the_week_is_the_workspaces_in_its_time_zone(self) -> None:
        rome = self.quota.WorkWeek("Europe/Rome", (0, 1, 2, 3, 4), "08:00", "19:00")
        # 17:30 UTC is 18:30 in Rome: still work.
        self.assertTrue(self.quota.is_working_time(self.at(2, 17, 30), rome))
        self.assertFalse(self.quota.is_working_time(self.at(2, 18, 30), rome))


class ErrorBackoffTests(unittest.TestCase):
    def test_server_errors_back_off_exponentially_with_a_spread(self) -> None:
        from app.services.supply import trouble

        self.assertEqual(trouble.error_cooldown(1, 0.0), timedelta(minutes=5))
        self.assertEqual(trouble.error_cooldown(2, 0.0), timedelta(minutes=10))
        self.assertEqual(trouble.error_cooldown(3, 1.0), timedelta(minutes=30))
        self.assertEqual(trouble.error_cooldown(30, 0.0), timedelta(hours=6), "capped")


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class AccountingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import accounts, ledger, quota, trouble
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers import registry
        from app.services.supply.providers.base import CredentialField, ProviderSpec
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.accounts, cls.ledger, cls.quota, cls.trouble = database, accounts, ledger, quota, trouble
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_acct_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        cls.clock = {"now": START}
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True, clock=lambda: cls.clock["now"])
        cls.registry = registry
        registry.register(ProviderSpec(
            key="acct_demo", label="Account demo", capabilities=frozenset({"offers"}), max_batch=2, stock_pooling="separate",
            credential_fields=(CredentialField("api_key", "API key"),), factory=lambda config: FakeProvider(config),
            storefronts=("uk", "de"), default_daily_budget=100,
        ), replace=True)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.registry.unregister("acct_demo")
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("quota_ledger", "call_counts", "connectors"):
                conn.execute(f"DELETE FROM {table}")
        self.clock["now"] = START

    def make(self, storefront: str, key: str = "KEY-1", **extra) -> str:
        return self.connectors.create(
            actor=ACTOR, provider="acct_demo", storefront=storefront, credentials={"api_key": key}, interactive_reserve_pct=10, **extra
        )["id"]

    def spent(self, ledger_id: str) -> int:
        with self.store.connection() as conn:
            row = conn.execute("SELECT COALESCE(SUM(spent), 0) AS n FROM quota_ledger WHERE connector_id = %s", (ledger_id,)).fetchone()
        return int(row["n"])

    def counted(self, *, exclude_refused: bool = True) -> int:
        with self.store.connection() as conn:
            row = conn.execute(
                "SELECT COALESCE(SUM(calls), 0) AS n FROM call_counts WHERE (%s = FALSE OR kind <> 'refused')", (exclude_refused,)
            ).fetchone()
        return int(row["n"])

    def spend(self, connector_id: str, units: int = 1, **kwargs) -> bool:
        return self.ledger.spend_call(self.store, self.connectors.get(connector_id), now=self.clock["now"], units=units, **kwargs)

    def test_connectors_on_one_key_are_one_account_with_one_budget(self) -> None:
        uk, de = self.make("uk"), self.make("de")
        with self.store.connection() as conn:
            account = self.accounts.resolve(conn, de)
        self.assertEqual((account.ledger_id, set(account.members)), (uk, {uk, de}))
        self.assertTrue(account.shared)

    def test_a_different_key_is_a_different_account(self) -> None:
        a = self.make("uk", key="KEY-1")
        b = self.make("de", key="KEY-2")
        with self.store.connection() as conn:
            self.assertEqual(self.accounts.resolve(conn, b).ledger_id, b)
            self.assertFalse(self.accounts.resolve(conn, a).shared)

    def test_the_key_is_not_the_credential_and_changes_with_it(self) -> None:
        cid = self.make("uk")
        with self.store.connection() as conn:
            before = conn.execute("SELECT account_key FROM connectors WHERE id = %s", (cid,)).fetchone()["account_key"]
        self.assertTrue(before)
        self.assertNotIn("KEY-1", before)
        self.connectors.set_credentials(cid, actor=ACTOR, credentials={"api_key": "KEY-9"})
        with self.store.connection() as conn:
            after = conn.execute("SELECT account_key FROM connectors WHERE id = %s", (cid,)).fetchone()["account_key"]
        self.assertNotEqual(before, after)

    def test_two_connectors_on_one_key_spend_one_budget(self) -> None:
        uk, de = self.make("uk"), self.make("de")
        self.clock["now"] = START.replace(hour=23, minute=59)  # the whole day's spread has opened
        got = 0
        for connector_id in (uk, de) * 100:
            got += self.spend(connector_id, interactive=False)
        self.assertEqual(got, 90, "the committed 90 of a 100 budget, however it is split")
        self.assertEqual(self.spent(uk), 90)
        self.assertEqual(self.spent(de), 0, "the ledger is the account's")
        self.assertEqual(self.counted(), 90)
        self.assertEqual(self.connectors.get(de)["usage_today"]["spent"], 90, "both show the account's figure")

    def test_the_breakdown_always_adds_up_to_what_was_spent(self) -> None:
        cid = self.make("uk")
        self.clock["now"] = START.replace(hour=23, minute=59)
        for kind in (self.ledger.KIND_SEARCH, self.ledger.KIND_OFFERS, self.ledger.KIND_NOTICES):
            self.assertTrue(self.spend(cid, kind=kind))
        self.assertTrue(self.spend(cid, interactive=True, kind=self.ledger.KIND_TEST))
        self.ledger.record_calls(self.store, cid, 2, now=self.clock["now"], kind=self.ledger.KIND_OFFERS)
        self.assertEqual(self.counted(), self.spent(cid))
        with self.store.connection() as conn:
            rows = conn.execute("SELECT kind, purpose, SUM(calls) AS n FROM call_counts GROUP BY kind, purpose").fetchall()
        got = {(row["kind"], row["purpose"]): int(row["n"]) for row in rows}
        self.assertEqual(got[("test", "interactive")], 1)
        self.assertEqual(got[("offers", "committed")], 3)
        self.assertEqual(got[("search", "committed")], 1)

    def test_a_refusal_is_counted_but_not_spent(self) -> None:
        cid = self.make("uk")
        self.assertTrue(self.spend(cid, interactive=True))
        self.ledger.note_refusal(self.store, cid, now=self.clock["now"])
        self.assertEqual(self.spent(cid), 1)
        self.assertEqual(self.counted(exclude_refused=False), 2)
        self.assertEqual(self.counted(), self.spent(cid))

    def test_the_ledger_day_follows_the_connectors_reset(self) -> None:
        cid = self.make("uk")
        self.connectors.update(cid, actor=ACTOR, reset_time="12:00", reset_tz="UTC")
        self.clock["now"] = START.replace(hour=11, minute=59)
        self.assertTrue(self.spend(cid, interactive=True))
        self.clock["now"] = START.replace(hour=12, minute=1)
        self.assertTrue(self.spend(cid, interactive=True))
        with self.store.connection() as conn:
            days = [row["day"].isoformat() for row in conn.execute("SELECT day FROM quota_ledger ORDER BY day").fetchall()]
        self.assertEqual(days, ["2026-02-28", "2026-03-01"], "11:59 still belongs to the day that began yesterday at noon")

    def test_the_reset_is_checked(self) -> None:
        from app.services.supply.connectors import ConnectorError

        cid = self.make("uk")
        for changes in ({"reset_time": "25:00"}, {"reset_time": "7"}, {"reset_tz": "Mars/Base"}):
            with self.assertRaises(ConnectorError):
                self.connectors.update(cid, actor=ACTOR, **changes)
        self.assertEqual(self.connectors.update(cid, actor=ACTOR, reset_time="06:30", reset_tz="Europe/Rome")["reset_time"], "06:30")

    def test_a_rate_limit_holds_every_connector_on_the_account_and_is_counted(self) -> None:
        from app.services.supply.providers.base import RateLimited

        uk, de = self.make("uk"), self.make("de")
        reason = self.trouble.react(self.connectors, self.store, uk, RateLimited("slow down", retry_after_seconds=3600), START)
        self.assertEqual(reason, "rate_limited")
        self.assertTrue(self.trouble.cooling_down(self.store, de, START + timedelta(minutes=30)))
        self.assertFalse(self.trouble.cooling_down(self.store, de, START + timedelta(minutes=61)))
        self.assertEqual(self.counted(exclude_refused=False), 1)

    def test_a_block_holds_off_for_hours_and_shows_on_the_connector(self) -> None:
        from app.services.supply.providers.base import Blocked

        cid = self.make("uk")
        self.assertEqual(self.trouble.react(self.connectors, self.store, cid, Blocked("page"), START), "blocked")
        self.assertTrue(self.trouble.cooling_down(self.store, cid, START + timedelta(hours=11)))
        self.assertFalse(self.trouble.cooling_down(self.store, cid, START + timedelta(hours=13)))
        self.assertEqual(self.connectors.get(cid)["last_error_code"], "blocked")

    def test_repeated_failures_rest_longer_each_time(self) -> None:
        from app.services.supply.providers.base import Unavailable

        cid = self.make("uk")
        waits = []
        for _ in range(3):
            self.trouble.react(self.connectors, self.store, cid, Unavailable("down"), START, rng=lambda: 0.0)
            with self.store.connection() as conn:
                waits.append(conn.execute("SELECT cooldown_until FROM connectors WHERE id = %s", (cid,)).fetchone()["cooldown_until"] - START)
        self.assertEqual(waits, [timedelta(minutes=5), timedelta(minutes=10), timedelta(minutes=20)])
        self.connectors.record_result(cid)
        self.trouble.react(self.connectors, self.store, cid, Unavailable("down"), START, rng=lambda: 0.0)
        with self.store.connection() as conn:
            self.assertEqual(conn.execute("SELECT cooldown_until FROM connectors WHERE id = %s", (cid,)).fetchone()["cooldown_until"] - START, timedelta(minutes=5))


if __name__ == "__main__":
    unittest.main()
