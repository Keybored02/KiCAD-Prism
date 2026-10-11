"""What the stock history says: rates, restocks, confidence, and when a warning is believable."""

from __future__ import annotations

import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import insights  # noqa: E402
from app.services.supply.insights import Point  # noqa: E402

START = date(2026, 1, 1)


def series(values, *, listings=1, start=START, step=1):
    return [Point(start + timedelta(days=index * step), value, listings) for index, value in enumerate(values)]


class RateTests(unittest.TestCase):
    def test_nothing_to_say_without_history(self) -> None:
        for points in ([], series([100])):
            result = insights.analyse(points)
            self.assertEqual((result["confidence"], result["decrease_per_day"], result["days_to_zero"]), ("none", None, None))
            self.assertEqual(result["restocks"], 0)

    def test_a_steady_drawdown_gives_a_rate_and_days_left(self) -> None:
        result = insights.analyse(series([1000, 950, 900, 850, 800, 750, 700, 650]), threshold=300)
        self.assertEqual((result["trend"], result["decrease_per_day"]), ("falling", 50.0))
        self.assertEqual((result["days_to_zero"], result["days_to_threshold"]), (13, 7))
        self.assertEqual(result["inputs"], {"points": 8, "span_days": 7, "points_in_run": 8, "current": 650})

    def test_the_rate_is_a_median_so_one_odd_day_does_not_move_it(self) -> None:
        values = [1000, 950, 900, 850, 100 + 700, 750, 700, 650]  # one reading 700 pieces too high
        result = insights.analyse(series(values))
        self.assertAlmostEqual(result["decrease_per_day"], 50.0, delta=8)

    def test_uneven_spacing_is_measured_in_days(self) -> None:
        points = [Point(START + timedelta(days=d), stock, 1) for d, stock in ((0, 1000), (2, 900), (3, 850), (7, 650), (10, 500))]
        self.assertEqual(insights.analyse(points)["decrease_per_day"], 50.0)

    def test_too_few_points_or_days_give_no_rate(self) -> None:
        self.assertIsNone(insights.analyse(series([100, 90, 80]))["decrease_per_day"])
        short = [Point(START, 100, 1), Point(START, 90, 1), Point(START + timedelta(days=1), 80, 1), Point(START + timedelta(days=2), 70, 1)]
        self.assertIsNone(insights.analyse(short)["decrease_per_day"], "four readings in under three days")

    def test_a_flat_or_rising_part_has_no_days_to_zero(self) -> None:
        flat = insights.analyse(series([500] * 8))
        self.assertEqual((flat["trend"], flat["days_to_zero"]), ("steady", None))
        rising = insights.analyse(series([500, 505, 510, 515, 520, 525, 530, 535]))
        self.assertEqual((rising["trend"], rising["days_to_zero"], rising["restocks"]), ("rising", None, 0))

    def test_out_of_stock_has_no_days_to_zero_and_a_met_threshold_no_days_to_it(self) -> None:
        empty = insights.analyse(series([40, 30, 20, 10, 0]), threshold=5)
        self.assertEqual((empty["days_to_zero"], empty["days_to_threshold"]), (None, None))
        below = insights.analyse(series([100, 90, 80, 70, 60]), threshold=500)
        self.assertEqual((below["days_to_threshold"], below["days_to_zero"]), (None, 6))


class RestockTests(unittest.TestCase):
    def test_a_big_rise_is_a_restock_and_the_rate_starts_again_after_it(self) -> None:
        values = [1000, 900, 800, 700, 5000, 4900, 4800, 4700, 4600]
        result = insights.analyse(series(values))
        self.assertEqual(result["restocks"], 1)
        self.assertEqual(result["decrease_per_day"], 100.0, "only the days since the restock count")
        self.assertEqual(result["inputs"]["points_in_run"], 5)

    def test_a_small_rise_is_not_a_restock(self) -> None:
        self.assertEqual(insights.analyse(series([1000, 900, 950, 850, 800, 760]))["restocks"], 0)

    def test_any_rise_from_zero_is_a_restock(self) -> None:
        self.assertEqual(insights.analyse(series([30, 20, 10, 0, 5, 4, 3]))["restocks"], 1)

    def test_a_just_restocked_part_has_no_rate_yet(self) -> None:
        result = insights.analyse(series([1000, 900, 800, 700, 600, 5000, 4900]))
        self.assertIsNone(result["decrease_per_day"])
        self.assertEqual(result["restocks"], 1)

    def test_a_change_of_coverage_is_not_a_restock_and_cuts_the_series(self) -> None:
        points = series([1000, 950, 900], listings=1) + series([5900, 5850, 5800, 5750, 5700], listings=2, start=START + timedelta(days=3))
        result = insights.analyse(points)
        self.assertEqual(result["restocks"], 0, "a second listing appearing is not stock arriving")
        self.assertEqual(result["decrease_per_day"], 50.0)
        self.assertEqual(result["inputs"]["points_in_run"], 5)

    def test_regular_restocks_give_a_cadence(self) -> None:
        values = [1000, 800, 600, 4000, 3800, 3600, 3400, 3200, 3000, 6000, 5800, 5600, 5400]
        points = series(values)
        result = insights.analyse(points, today=points[-1].day)
        self.assertEqual((result["restocks"], result["restock_interval_days"]), (2, 6))
        self.assertEqual(result["restock_expected_in_days"], 6 - 3)


class ConfidenceTests(unittest.TestCase):
    def test_it_grows_with_points_and_span(self) -> None:
        self.assertEqual(insights.analyse(series([100, 99, 98]))["confidence"], "low")
        self.assertEqual(insights.analyse(series([1000 - 10 * i for i in range(10)]))["confidence"], "medium")
        self.assertEqual(insights.analyse(series([5000 - 10 * i for i in range(40)]))["confidence"], "high")

    def test_a_long_history_with_a_short_run_stays_medium(self) -> None:
        values = [5000 - 10 * i for i in range(35)] + [9000, 8990, 8980, 8970]
        self.assertEqual(insights.analyse(series(values))["confidence"], "medium")


class BelievableWarningTests(unittest.TestCase):
    def falling(self, count=20, start_value=1000, step=50):
        return insights.analyse(series([start_value - step * i for i in range(count)]))

    def test_a_confident_rate_inside_the_horizon_is_a_warning(self) -> None:
        result = {**insights.analyse(series([2000 - 50 * i for i in range(35)]))}
        self.assertEqual(insights.rupture_expected_within(result), result["days_to_zero"])
        self.assertLessEqual(result["days_to_zero"], insights.HORIZON_DAYS)

    def test_beyond_the_horizon_or_with_low_confidence_it_is_not(self) -> None:
        self.assertIsNone(insights.rupture_expected_within({"days_to_zero": 120, "confidence": "high"}))
        self.assertIsNone(insights.rupture_expected_within({"days_to_zero": 10, "confidence": "low"}))
        self.assertIsNone(insights.rupture_expected_within({"days_to_zero": None, "confidence": "high"}))

    def test_a_regular_restock_due_first_is_not_a_false_alarm(self) -> None:
        base = {"days_to_zero": 20, "confidence": "high", "restocks": 3}
        self.assertIsNone(insights.rupture_expected_within({**base, "restock_expected_in_days": 5}))
        self.assertEqual(insights.rupture_expected_within({**base, "restock_expected_in_days": 40}), 20)
        self.assertEqual(insights.rupture_expected_within({**base, "restock_expected_in_days": -3}), 20, "overdue: no comfort in it")
        self.assertEqual(insights.rupture_expected_within({**base, "restocks": 1, "restock_expected_in_days": 5}), 20,
                         "one restock is not a cadence")


if __name__ == "__main__":
    unittest.main()
