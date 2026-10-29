"""The forecast models and the words. No database."""

from __future__ import annotations

import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import forecast_lifecycle, forecast_market, forecast_price, forecast_stock, forecasting  # noqa: E402
from app.services.supply.forecast_stock import Holder  # noqa: E402

START = date(2026, 9, 1)


def series(values, start=START):
    return [(start + timedelta(days=i), int(v)) for i, v in enumerate(values)]


def holder(values, name="Mouser", quote=None, weekly=False, cid="m"):
    return Holder(cid, name, "mouser", series(values), quote, weekly)


class WordsTests(unittest.TestCase):
    def test_one_scale_of_words(self) -> None:
        words = [forecasting.chance_word(p) for p in (0.95, 0.9, 0.78, 0.5, 0.2, 0.05)]
        self.assertEqual(words, ["Almost certain", "Almost certain", "Likely", "Uncertain", "Unlikely", "Very unlikely"])
        self.assertEqual(forecasting.chance_percent(0.784), 78)


class DrainTests(unittest.TestCase):
    def test_a_falling_series_gives_a_runout_range_around_the_straight_line(self) -> None:
        values = [3000 - 100 * i for i in range(20)]  # 100 a day, 1,100 left: out in about 11 days
        result = forecast_stock.forecast([holder(values)], {}, {}, quantity=100)
        run = result["runout"]
        self.assertTrue(result["available"])
        self.assertAlmostEqual(run["median"], 11, delta=1.5)
        self.assertLessEqual(run["low"], run["median"])
        self.assertLessEqual(run["median"], run["high"])
        self.assertGreater(run["probability"], 0.9)
        self.assertEqual(result["weeks"][0] > 0.9, True, "100 can still be bought next week")
        self.assertLess(result["weeks"][3], 0.1, "but not in a month, with no restock known")

    def test_a_noisy_drain_widens_the_range(self) -> None:
        rng = np.random.default_rng(1)
        steady = [3000 - 100 * i for i in range(20)]
        noisy = [int(3000 - 100 * i + rng.normal(0, 60)) for i in range(20)]
        tight = forecast_stock.forecast([holder(steady)], {}, {}, 100)["runout"]
        wide = forecast_stock.forecast([holder(noisy)], {}, {}, 100)["runout"]
        self.assertGreater(wide["high"] - wide["low"], tight["high"] - tight["low"])

    def test_a_steady_part_is_not_going_to_run_out(self) -> None:
        result = forecast_stock.forecast([holder([5000] * 20)], {}, {}, 100)
        self.assertIsNone(result["runout"])
        self.assertTrue(all(week == 1.0 for week in result["weeks"]))
        self.assertEqual(result["p_out_total"], 0.0)

    def test_too_few_readings_say_nothing(self) -> None:
        self.assertEqual(forecast_stock.forecast([holder([100, 90, 80])], {}, {}, 10), {"available": False, "reason": "too_few_readings"})
        self.assertEqual(forecast_stock.forecast([], {}, {}, 10), {"available": False, "reason": "no_readings"})

    def test_a_short_run_since_a_restock_has_no_drain_to_speak_of(self) -> None:
        values = [100, 90, 80, 70, 60, 50, 40, 30, 5000, 4990]  # restocked two readings ago
        self.assertIsNone(forecast_stock.drain_samples(series(values)))

    def test_a_week_read_part_has_a_range_at_least_a_week_wide(self) -> None:
        values = [3000 - 100 * i for i in range(20)]
        run = forecast_stock.forecast([holder(values, weekly=True)], {}, {}, 100, weekly=True)["runout"]
        self.assertGreaterEqual(run["high"] - run["low"], 7)


class OutageTests(unittest.TestCase):
    def test_kaplan_meier_needs_five_ended_stock_outs(self) -> None:
        self.assertIsNone(forecast_stock.kaplan_meier([10, 20, 30, 40], [True] * 4))
        model = forecast_stock.kaplan_meier([10, 20, 30, 40, 50, 60], [True] * 5 + [False])
        self.assertEqual(model.events, 5)
        self.assertTrue(np.all(np.diff(model.survival) <= 0))

    def test_a_distributor_that_is_out_comes_back_in_the_time_stock_outs_have_lasted(self) -> None:
        model = forecast_stock.kaplan_meier([20, 22, 25, 28, 30, 33, 35, 40], [True] * 8)
        out = [90, 80, 60, 40, 20, 5, 0, 0, 0, 0, 0, 0, 0]
        result = forecast_stock.forecast([holder(out)], {"m": model}, {}, 50)
        back = result["back"][0]
        self.assertTrue(result["out_now"])
        self.assertGreater(back["median"], 10)
        self.assertLess(back["high"], 60)
        self.assertEqual(result["weeks"][0], 0.0, "out now, back in a few weeks")
        self.assertGreater(max(result["weeks"][3:7]), 0.2, "back within a few weeks, as often as stock-outs have lasted")

    def test_a_quote_stands_in_when_there_are_too_few_stock_outs(self) -> None:
        out = [50, 30, 10, 0, 0, 0, 0, 0, 0, 0]
        result = forecast_stock.forecast([holder(out, quote=42)], {}, {"m": 1.5}, 10)
        back = result["back"][0]
        self.assertAlmostEqual(back["median"], 42 * 1.5 - 6, delta=12)
        self.assertEqual(back["quote_days"], 42)

    def test_without_a_model_or_a_quote_the_return_is_unknown(self) -> None:
        out = [50, 30, 10, 0, 0, 0, 0, 0, 0, 0]
        result = forecast_stock.forecast([holder(out)], {}, {}, 10)
        self.assertEqual(result["back"], [])
        self.assertEqual(result["weeks"][11], 0.0)

    def test_the_ratio_is_pulled_towards_the_pooled_one(self) -> None:
        pooled = [1.0] * 6
        self.assertEqual(forecast_stock.shrunk_ratio([], pooled), (1.0, 0))
        ratio, n = forecast_stock.shrunk_ratio([2.0], pooled)
        self.assertEqual(n, 1)
        self.assertTrue(1.0 < ratio < 2.0)
        far, _ = forecast_stock.shrunk_ratio([2.0] * 20, pooled)
        self.assertGreater(far, ratio)

    def test_two_distributors_make_the_part_likelier_to_be_buyable(self) -> None:
        falling = [3000 - 100 * i for i in range(20)]
        one = forecast_stock.forecast([holder(falling)], {}, {}, 100)["weeks"][3]
        two = forecast_stock.forecast([holder(falling), holder([5000] * 20, "DigiKey", cid="d")], {}, {}, 100)["weeks"][3]
        self.assertLess(one, two)
        self.assertEqual(two, 1.0)


class OutEverywhereJudgeTests(unittest.TestCase):
    def test_out_within_four_weeks_is_any_day_of_them_even_if_restocked_after(self) -> None:
        from datetime import date

        from app.services.supply import forecast_run

        made = date(2026, 3, 1)
        truth = type("Truth", (), {"total": {date(2026, 3, 10): 0, date(2026, 3, 20): 5000}, "lines": {}, "ended": [], "covers": lambda self, day: True})()
        row = {"made_on": made, "target": "out_4w", "horizon_days": 28}
        self.assertEqual(forecast_run._judge(row, truth)[0], 1.0, "out in week two, back in week three")
        truth.total = {date(2026, 3, 10): 40, date(2026, 3, 29): 0}
        self.assertEqual(forecast_run._judge(row, truth)[0], 1.0, "out on the last day")
        truth.total = {date(2026, 3, 10): 40, date(2026, 4, 5): 0}
        self.assertEqual(forecast_run._judge(row, truth)[0], 0.0, "out after the window")


class PriceTests(unittest.TestCase):
    def test_a_flat_price_stays_flat_and_says_so(self) -> None:
        flat = [(START + timedelta(days=i), 0.5) for i in range(70)]
        result = forecast_price.forecast(flat, forecast_price.Moves(0, 0.0, []))
        self.assertTrue(result["available"])
        self.assertTrue(result["h90"]["flat"])
        self.assertAlmostEqual(result["h90"]["median"], 0.5)

    def test_a_price_that_moves_gets_a_range(self) -> None:
        moving = [(START + timedelta(days=i), 0.5 + 0.02 * (i // 5)) for i in range(70)]
        result = forecast_price.forecast(moving, forecast_price.Moves(0, 0.0, []))
        self.assertGreater(result["h90"]["high"], result["h90"]["low"])
        self.assertFalse(result["h90"]["flat"])
        self.assertEqual(result["inputs"]["own_moves"], 13)

    def test_a_series_is_forecast_only_when_it_covers_the_horizon_a_month_for_30_days_two_for_90(self) -> None:
        pool = forecast_price.Moves(0, 0.0, [])
        self.assertFalse(forecast_price.forecast([(START, 0.5), (START + timedelta(days=2), 0.5)], pool)["available"])
        forty_five = [(START + timedelta(days=i), 0.5) for i in range(46)]
        self.assertFalse(forecast_price.forecast(forty_five, pool)["available"], "45 days is enough for 30 days ahead, not for 90")
        self.assertIsNotNone(forecast_price.draw_prices(forty_five, pool, 30))
        self.assertIsNone(forecast_price.draw_prices(forty_five, pool, 90))
        self.assertIsNone(forecast_price.draw_prices([(START + timedelta(days=i), 0.5) for i in range(20)], pool, 30))

    def test_the_same_series_gives_the_same_forecast(self) -> None:
        moving = [(START + timedelta(days=i), 0.5 + 0.02 * (i // 5)) for i in range(70)]
        pool = forecast_price.Moves(2, 100.0, [0.05, -0.03])
        self.assertEqual(forecast_price.forecast(moving, pool), forecast_price.forecast(moving, pool))

    def test_a_pool_that_went_mostly_up_is_a_spread_not_a_drift_for_a_part_that_never_repriced(self) -> None:
        flat = [(START + timedelta(days=i), 0.5) for i in range(70)]
        pool = forecast_price.Moves(10, 100.0, [0.05] * 8 + [-0.02] * 2)
        result = forecast_price.forecast(flat, pool)
        self.assertAlmostEqual(result["h30"]["median"], 0.5, delta=0.03, msg="today's price is the middle of the forecast")
        self.assertAlmostEqual(result["h90"]["median"], 0.5, delta=0.04)

    def test_a_part_with_three_moves_the_same_way_over_two_months_may_drift(self) -> None:
        up = forecast_price.Moves(3, 70.0, [0.05, 0.04, 0.06])
        self.assertTrue(forecast_price.drifts(up))
        self.assertFalse(forecast_price.drifts(forecast_price.Moves(3, 40.0, [0.05, 0.04, 0.06])), "too short a history")
        self.assertFalse(forecast_price.drifts(forecast_price.Moves(3, 70.0, [0.05, -0.04, 0.06])), "only two the same way")

    def test_noise_and_unconfirmed_jumps_are_not_repricings(self) -> None:
        def days(*values):
            return [(START + timedelta(days=i), value) for i, value in enumerate(values)]

        self.assertEqual(forecast_price._repricings(days(1.0, 1.005, 1.0, 1.004)), [], "under 1% is noise")
        self.assertEqual(len(forecast_price._repricings(days(1.0, 1.10, 1.10))), 1, "a 10% move counts")
        self.assertEqual(forecast_price._repricings(days(1.0, 2.0, 1.0, 1.0)), [], "a spike that reverts is dropped")
        self.assertEqual(len(forecast_price._repricings(days(1.0, 2.0, 2.0, 2.0))), 1, "a big move the next reading holds counts")
        self.assertEqual(forecast_price._repricings(days(1.0, 2.0)), [], "a big move nothing confirms yet is not counted")

    def test_a_slower_prior_rate_gives_a_part_with_no_history_about_one_repricing_a_quarter(self) -> None:
        flat = [(START + timedelta(days=i), 0.5) for i in range(70)]
        pool = forecast_price.Moves(0, 0.0, [0.05, -0.05])
        result = forecast_price.forecast(flat, pool, forecast_price.Moves(0, 70.0, []))
        self.assertTrue(result["h30"]["flat"] is False or result["h30"]["high"] >= result["h30"]["low"])
        rate = (0 + forecast_price.SHRINK_DAYS * forecast_price.PRIOR_RATE) / (70.0 + forecast_price.SHRINK_DAYS)
        self.assertAlmostEqual(rate * 90, 0.5625, places=3, msg="about half a repricing in a quarter for a part that has had none in 70 days")


class VerdictTests(unittest.TestCase):
    def test_a_range_model_holds_when_80_percent_ranges_hold_about_80_percent(self) -> None:
        rows = [{"inside": i % 5 != 0, "probability": None, "observed": None} for i in range(50)]
        self.assertEqual(forecasting.verdict("range", rows), (True, 0.8))
        wide = [{"inside": True} for _ in range(50)]
        self.assertFalse(forecasting.verdict("range", wide)[0], "ranges that always hold are too wide")
        narrow = [{"inside": i % 2 == 0} for i in range(50)]
        self.assertFalse(forecasting.verdict("range", narrow)[0])

    def test_a_chance_model_holds_when_what_it_said_matches_what_happened(self) -> None:
        good = [{"probability": 0.7, "observed": 1.0 if i % 10 < 7 else 0.0, "inside": None} for i in range(100)]
        self.assertTrue(forecasting.verdict("chance", good)[0])
        bad = [{"probability": 0.9, "observed": 0.0, "inside": None} for _ in range(100)]
        self.assertFalse(forecasting.verdict("chance", bad)[0])
        self.assertEqual(forecasting.verdict("range", []), (False, None))


def points(values, start=START):
    return [(start + timedelta(days=i), float(v)) for i, v in enumerate(values)]


class FamilyTests(unittest.TestCase):
    def test_lead_times_stretching_easing_or_flat(self) -> None:
        up = forecast_market.lead_trend(points([40 + i for i in range(40)]))
        down = forecast_market.lead_trend(points([80 - i for i in range(40)]))
        flat = forecast_market.lead_trend(points([40] * 40))
        self.assertEqual((up["direction"], down["direction"], flat["direction"]), ("stretching", "easing", "flat"))
        self.assertGreater(up["median"], up["now"])
        self.assertIsNone(forecast_market.lead_trend(points([40] * 5)))

    def test_a_shift_has_to_hold_for_two_weeks_and_beat_the_familys_own_wobble(self) -> None:
        held = forecast_market.shift("out_of_stock", points([0.04] * 14 + [0.15] * 14))
        self.assertEqual((held["direction"], round(held["before"], 2), round(held["after"], 2)), ("up", 0.04, 0.15))
        self.assertIsNone(forecast_market.shift("out_of_stock", points([0.04] * 14 + [0.15] * 7 + [0.04] * 7)), "it came back")
        wobble = [0.04, 0.2] * 7 + [0.2, 0.04] * 7
        self.assertIsNone(forecast_market.shift("out_of_stock", points(wobble)), "a family that swings this much has not shifted")
        self.assertIsNone(forecast_market.shift("out_of_stock", points([0.04] * 14 + [0.06] * 14)), "below the floor")
        self.assertIsNone(forecast_market.shift("out_of_stock", points([0.04] * 10)))


class LifecycleTests(unittest.TestCase):
    def test_a_rate_becomes_a_chance_over_the_months(self) -> None:
        self.assertAlmostEqual(forecast_lifecycle.chance(0.01, 12), 1 - 2.718281828 ** -0.12, places=4)
        self.assertEqual(forecast_lifecycle.chance(0.0, 24), 0.0)
        self.assertGreater(forecast_lifecycle.chance(0.01, 24), forecast_lifecycle.chance(0.01, 12))

    def test_pooled_rates_are_used_without_being_worked_out_again(self) -> None:
        from unittest import mock

        class Conn:
            def execute(self, sql, params=()):
                class Rows:
                    def fetchone(self):
                        return {"name": "Acme"}

                return Rows()

        pooled = {"pooled": 0.01, "makers": {"Acme": 0.02}, "changes": 3, "part_months": 40.0, "exposure": {}}
        with mock.patch.object(forecast_lifecycle, "rates", side_effect=AssertionError("rates() should not run again")), \
                mock.patch.object(forecast_lifecycle, "signs", return_value={"notice": False, "dropped_share": 0.0}):
            found = forecast_lifecycle.part_chance(Conn(), "part-1", "active", START, pooled=pooled)
        self.assertEqual(found["changes"], 3)
        self.assertAlmostEqual(found["rate"], 0.02)


if __name__ == "__main__":
    unittest.main()


class RunsOutFirstTests(unittest.TestCase):
    def test_parts_are_ordered_by_the_chance_of_being_out_in_four_weeks_then_the_days_to_zero(self) -> None:
        from unittest import mock

        from app.services.supply import parts_view

        kept = {
            "none": {"days_to_zero": None, "forecast": {"available": False}},
            "slow": {"days_to_zero": 90, "forecast": {"available": True, "p_out_4w": 0.1}},
            "sure": {"days_to_zero": 20, "forecast": {"available": True, "p_out_4w": 0.9}},
            "out": {"days_to_zero": 0, "forecast": {"available": True, "out_now": True, "p_out_4w": 0.0}},
            "sooner": {"days_to_zero": 5, "forecast": {"available": True, "p_out_4w": 0.1}},
        }
        with mock.patch.object(parts_view.part_insights, "of_parts", return_value=kept):
            ordered = parts_view._runs_out_first(None, [{"id": key} for key in ("none", "slow", "sure", "out", "sooner")])  # noqa: SLF001
        self.assertEqual([item["id"] for item in ordered], ["out", "sure", "sooner", "slow", "none"])


class SimilarPartsTests(unittest.TestCase):
    def holder(self, readings, similar=None):
        series = [(START + timedelta(days=index), value) for index, value in enumerate(readings)]
        return forecast_stock.Holder("c1", "DigiKey", "digikey", series, None, False, similar)

    def test_a_part_with_too_few_readings_since_its_restock_borrows_the_drain_of_similar_parts_and_says_so(self) -> None:
        # Ten days of 100, then a restock to 1,000 and three readings since: no drain of its own.
        alone = self.holder([100] * 10 + [1000, 990, 985])
        own = forecast_stock.forecast([alone], {}, {}, 1)
        borrowed = forecast_stock.forecast([self.holder([100] * 10 + [1000, 990, 985], np.asarray([0.05] * 6))], {}, {}, 1)
        self.assertEqual(borrowed["inputs"]["from_similar"], 1)
        self.assertEqual(own["inputs"]["from_similar"], 0)
        self.assertIsNone(own["runout"], "no drain: nothing says when it runs out")
        self.assertIsNotNone(borrowed["runout"], "5% of stock a day runs out within 8 weeks")
        self.assertLess(borrowed["runout"]["median"], 40)

    def test_a_part_with_a_drain_of_its_own_does_not_borrow(self) -> None:
        drained = self.holder([1000 - 40 * index for index in range(15)], np.asarray([0.2] * 6))
        self.assertEqual(forecast_stock.forecast([drained], {}, {}, 1)["inputs"]["from_similar"], 0)
