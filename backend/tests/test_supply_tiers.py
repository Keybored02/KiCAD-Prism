"""Read order (urgency), when a listing is next due, and backoff. Pure rules, no database."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import tiers  # noqa: E402
from app.services.supply.tiers import Urgency, UrgencyInputs  # noqa: E402
from app.services.supply.vocabulary import Lifecycle  # noqa: E402

NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


def pick(**kwargs) -> Urgency:
    return tiers.urgency(UrgencyInputs(now=NOW, **kwargs))


class UrgencyTests(unittest.TestCase):
    def test_a_quiet_part_is_normal(self) -> None:
        self.assertEqual(pick(total_stock=5000), Urgency.NORMAL)
        self.assertEqual(pick(), Urgency.NORMAL, "no stock known yet")

    def test_open_demand_makes_a_part_urgent_as_stock_stops_covering_it(self) -> None:
        self.assertEqual(pick(total_stock=1000, demand=1000), Urgency.HOT, "stock only just covers the need")
        self.assertEqual(pick(total_stock=1400, demand=1000), Urgency.HOT, "under one and a half times")
        self.assertEqual(pick(total_stock=2500, demand=1000), Urgency.WARM, "under three times")
        self.assertEqual(pick(total_stock=3000, demand=1000), Urgency.NORMAL, "comfortably covered")
        self.assertEqual(pick(total_stock=10, demand=0), Urgency.NORMAL, "no demand asks nothing")
        self.assertEqual(pick(total_stock=10, demand=-50), Urgency.NORMAL, "incoming stock alone asks nothing")
        self.assertEqual(pick(demand=1000), Urgency.NORMAL, "no stock figure yet")

    def test_a_pin_goes_first(self) -> None:
        self.assertEqual(pick(pinned=True, total_stock=100000), Urgency.HOT)

    def test_no_stock_at_all_is_hot(self) -> None:
        self.assertEqual(pick(total_stock=0), Urgency.HOT)

    def test_a_threshold_makes_a_part_urgent_as_stock_nears_it(self) -> None:
        self.assertEqual(pick(total_stock=100, threshold=100), Urgency.HOT, "at the threshold")
        self.assertEqual(pick(total_stock=40, threshold=100), Urgency.HOT, "below it")
        self.assertEqual(pick(total_stock=250, threshold=100), Urgency.WARM, "within three times")
        self.assertEqual(pick(total_stock=300, threshold=100), Urgency.NORMAL, "comfortably above")
        self.assertEqual(pick(total_stock=5, threshold=0), Urgency.NORMAL, "a zero threshold only matters at zero")

    def test_a_part_going_out_of_production_is_at_least_warm(self) -> None:
        for lifecycle in (Lifecycle.NRND, Lifecycle.LAST_TIME_BUY, Lifecycle.OBSOLETE):
            self.assertEqual(pick(lifecycle=lifecycle, total_stock=5000), Urgency.WARM, lifecycle)
        self.assertEqual(pick(lifecycle=Lifecycle.ACTIVE, total_stock=5000), Urgency.NORMAL)

    def test_a_projected_rupture_matters_by_how_near_it_is(self) -> None:
        self.assertEqual(pick(total_stock=5000, rupture_days=10), Urgency.HOT)
        self.assertEqual(pick(total_stock=5000, rupture_days=14), Urgency.HOT)
        self.assertEqual(pick(total_stock=5000, rupture_days=40), Urgency.WARM)
        self.assertEqual(pick(total_stock=5000, rupture_days=None), Urgency.NORMAL)

    def test_recent_movement_is_warm_and_old_movement_is_not(self) -> None:
        self.assertEqual(pick(last_change_at=NOW - timedelta(hours=3)), Urgency.WARM)
        self.assertEqual(pick(last_change_at=NOW - timedelta(days=2)), Urgency.NORMAL)

    def test_the_most_urgent_rule_wins(self) -> None:
        self.assertEqual(pick(lifecycle=Lifecycle.NRND, total_stock=0), Urgency.HOT)
        self.assertEqual(pick(last_change_at=NOW - timedelta(hours=1), pinned=True), Urgency.HOT)

    def test_lower_is_first(self) -> None:
        self.assertLess(Urgency.HOT, Urgency.WARM)
        self.assertLess(Urgency.WARM, Urgency.NORMAL)


class ScheduleTests(unittest.TestCase):
    def test_backoff_doubles_and_is_capped(self) -> None:
        self.assertEqual(tiers.backoff(0), timedelta(0))
        self.assertEqual([tiers.backoff(n) for n in (1, 2, 3)],
                         [timedelta(minutes=5), timedelta(minutes=10), timedelta(minutes=20)])
        self.assertEqual(tiers.backoff(30), timedelta(hours=24))

    def test_a_daily_listing_is_next_due_in_the_providers_next_day(self) -> None:
        for key in ("a", "b", "listing-42", ""):
            when = tiers.next_poll_at(NOW, "daily", key=key)
            midnight = datetime(2026, 3, 2, 0, 0, tzinfo=timezone.utc)
            self.assertGreaterEqual(when, midnight, key)
            self.assertLessEqual(when, midnight + tiers.DAILY_WINDOW, key)

    def test_a_daily_listing_follows_the_providers_reset(self) -> None:
        when = tiers.next_poll_at(NOW, "daily", key="x", reset_time="18:00", tz="UTC")
        self.assertGreaterEqual(when, datetime(2026, 3, 1, 18, 0, tzinfo=timezone.utc))
        self.assertLessEqual(when, datetime(2026, 3, 1, 18, 0, tzinfo=timezone.utc) + tiers.DAILY_WINDOW)

    def test_the_time_of_a_daily_read_changes_from_day_to_day_and_between_listings(self) -> None:
        offsets = set()
        for day in range(1, 29):
            moment = datetime(2026, 3, day, 12, 0, tzinfo=timezone.utc)
            when = tiers.next_poll_at(moment, "daily", key="listing-1")
            offsets.add(when - datetime(when.year, when.month, when.day, tzinfo=timezone.utc))
        self.assertGreater(len(offsets), 15, "never at the same moment every day")
        across = {tiers.next_poll_at(NOW, "daily", key=f"listing-{i}") for i in range(50)}
        self.assertGreater(len(across), 30)

    def test_weekly_and_monthly_listings_wait_their_interval_give_or_take_the_spread(self) -> None:
        for schedule in ("weekly", "monthly"):
            base, spread = tiers.INTERVAL[schedule], tiers.SPREAD[schedule]
            whens = [tiers.next_poll_at(NOW, schedule, key=f"l{i}") - NOW for i in range(60)]
            self.assertTrue(all(base - spread / 2 <= wait <= base + spread / 2 for wait in whens), schedule)
            self.assertGreater(len(set(whens)), 20)

    def test_a_retry_follows_the_backoff_and_ignores_the_schedule(self) -> None:
        for streak in (1, 2, 3, 6, 12):
            wait = tiers.retry_at(NOW, streak, key="x") - NOW
            self.assertGreaterEqual(wait, tiers.backoff(streak), streak)
            self.assertLessEqual(wait, tiers.backoff(streak) * 1.1, streak)
        self.assertLess(tiers.retry_at(NOW, 1, key="x") - NOW, tiers.interval("daily"),
                        "a first failure is retried long before the next day")

    def test_retries_wait_longer_each_time_up_to_a_day(self) -> None:
        waits = [tiers.retry_at(NOW, streak, key="x") - NOW for streak in range(1, 12)]
        self.assertEqual(waits, sorted(waits))
        self.assertLessEqual(waits[-1], timedelta(hours=24) * 1.1)

    def test_a_retry_with_no_streak_still_waits(self) -> None:
        self.assertGreaterEqual(tiers.retry_at(NOW, 0, key="x") - NOW, tiers.backoff(1))


if __name__ == "__main__":
    unittest.main()
