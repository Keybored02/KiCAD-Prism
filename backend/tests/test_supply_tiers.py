"""Polling tiers and backoff. Pure rules, no database."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import tiers  # noqa: E402
from app.services.supply.tiers import Tier, TierInputs  # noqa: E402
from app.services.supply.vocabulary import Lifecycle  # noqa: E402

NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


def pick(**kwargs) -> Tier:
    return tiers.choose_tier(TierInputs(now=NOW, **kwargs))


class ChooseTierTests(unittest.TestCase):
    def test_a_quiet_watched_part_polls_at_the_normal_rate(self) -> None:
        self.assertEqual(pick(total_stock=5000), Tier.NORMAL)
        self.assertEqual(pick(), Tier.NORMAL, "no stock known yet")

    def test_open_demand_speeds_polling_as_stock_stops_covering_it(self) -> None:
        self.assertEqual(pick(total_stock=1000, demand=1000), Tier.HOT, "stock only just covers the need")
        self.assertEqual(pick(total_stock=1400, demand=1000), Tier.HOT, "under one and a half times")
        self.assertEqual(pick(total_stock=2500, demand=1000), Tier.WARM, "under three times")
        self.assertEqual(pick(total_stock=3000, demand=1000), Tier.NORMAL, "comfortably covered")
        self.assertEqual(pick(total_stock=10, demand=0), Tier.NORMAL, "no demand asks nothing")
        self.assertEqual(pick(total_stock=10, demand=-50), Tier.NORMAL, "incoming stock alone asks nothing")
        self.assertEqual(pick(demand=1000), Tier.NORMAL, "no stock figure yet")

    def test_a_pin_is_the_fastest_tier(self) -> None:
        self.assertEqual(pick(pinned=True, total_stock=100000), Tier.HOT)

    def test_no_stock_at_all_is_hot(self) -> None:
        self.assertEqual(pick(total_stock=0), Tier.HOT)

    def test_a_threshold_speeds_polling_as_stock_nears_it(self) -> None:
        self.assertEqual(pick(total_stock=100, threshold=100), Tier.HOT, "at the threshold")
        self.assertEqual(pick(total_stock=40, threshold=100), Tier.HOT, "below it")
        self.assertEqual(pick(total_stock=250, threshold=100), Tier.WARM, "within three times")
        self.assertEqual(pick(total_stock=300, threshold=100), Tier.NORMAL, "comfortably above")
        self.assertEqual(pick(total_stock=5, threshold=0), Tier.NORMAL, "a zero threshold only matters at zero")

    def test_a_part_going_out_of_production_is_at_least_warm(self) -> None:
        for lifecycle in (Lifecycle.NRND, Lifecycle.LAST_TIME_BUY, Lifecycle.OBSOLETE):
            self.assertEqual(pick(lifecycle=lifecycle, total_stock=5000), Tier.WARM, lifecycle)
        self.assertEqual(pick(lifecycle=Lifecycle.ACTIVE, total_stock=5000), Tier.NORMAL)

    def test_a_projected_rupture_speeds_polling_by_how_near_it_is(self) -> None:
        self.assertEqual(pick(total_stock=5000, rupture_days=10), Tier.HOT)
        self.assertEqual(pick(total_stock=5000, rupture_days=14), Tier.HOT)
        self.assertEqual(pick(total_stock=5000, rupture_days=40), Tier.WARM)
        self.assertEqual(pick(total_stock=5000, rupture_days=None), Tier.NORMAL)

    def test_recent_movement_is_warm_and_old_movement_is_not(self) -> None:
        self.assertEqual(pick(last_change_at=NOW - timedelta(hours=3)), Tier.WARM)
        self.assertEqual(pick(last_change_at=NOW - timedelta(days=2)), Tier.NORMAL)

    def test_the_most_urgent_rule_wins(self) -> None:
        self.assertEqual(pick(lifecycle=Lifecycle.NRND, total_stock=0), Tier.HOT)
        self.assertEqual(pick(last_change_at=NOW - timedelta(hours=1), pinned=True), Tier.HOT)

    def test_unwatched_parts_that_stay_still_go_cold(self) -> None:
        self.assertEqual(pick(watched=False, last_change_at=NOW - timedelta(days=60)), Tier.COLD)
        self.assertEqual(pick(watched=False), Tier.COLD, "never seen to change")
        self.assertEqual(pick(watched=False, last_change_at=NOW - timedelta(days=5)), Tier.NORMAL)
        self.assertEqual(pick(watched=False, last_change_at=NOW - timedelta(hours=2)), Tier.WARM)
        self.assertEqual(pick(watched=True, last_change_at=NOW - timedelta(days=60)), Tier.NORMAL, "watched parts never go cold")


class ScheduleTests(unittest.TestCase):
    def test_backoff_doubles_and_is_capped(self) -> None:
        self.assertEqual(tiers.backoff(0), timedelta(0))
        self.assertEqual([tiers.backoff(n) for n in (1, 2, 3)],
                         [timedelta(minutes=5), timedelta(minutes=10), timedelta(minutes=20)])
        self.assertEqual(tiers.backoff(30), timedelta(hours=24))

    def test_the_next_poll_is_never_sooner_than_the_tier_and_barely_later(self) -> None:
        for tier in Tier:
            base = tiers.interval(tier)
            for key in ("a", "b", "listing-42", ""):
                when = tiers.next_poll_at(NOW, tier, key=key)
                self.assertGreaterEqual(when, NOW + base, (tier, key))
                self.assertLessEqual(when, NOW + base * 1.1, (tier, key))

    def test_the_spread_is_stable_per_listing_and_differs_between_listings(self) -> None:
        first = tiers.next_poll_at(NOW, Tier.NORMAL, key="listing-1")
        self.assertEqual(first, tiers.next_poll_at(NOW, Tier.NORMAL, key="listing-1"))
        spreads = {tiers.next_poll_at(NOW, Tier.NORMAL, key=f"listing-{i}") for i in range(50)}
        self.assertGreater(len(spreads), 10)

    def test_a_retry_follows_the_backoff_and_ignores_the_tier(self) -> None:
        for streak in (1, 2, 3, 6, 12):
            wait = tiers.retry_at(NOW, streak, key="x") - NOW
            self.assertGreaterEqual(wait, tiers.backoff(streak), streak)
            self.assertLessEqual(wait, tiers.backoff(streak) * 1.1, streak)
        self.assertLess(tiers.retry_at(NOW, 1, key="x") - NOW, tiers.interval(Tier.NORMAL),
                        "a first failure is retried long before the normal interval")

    def test_retries_wait_longer_each_time_up_to_a_day(self) -> None:
        waits = [tiers.retry_at(NOW, streak, key="x") - NOW for streak in range(1, 12)]
        self.assertEqual(waits, sorted(waits))
        self.assertLessEqual(waits[-1], timedelta(hours=24) * 1.1)

    def test_a_retry_with_no_streak_still_waits(self) -> None:
        self.assertGreaterEqual(tiers.retry_at(NOW, 0, key="x") - NOW, tiers.backoff(1))


if __name__ == "__main__":
    unittest.main()
