"""The assessment rules: findings, sub-scores, health and status. No database."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply.assessment import checks, health, risk, waivers  # noqa: E402
from app.services.supply.assessment.settings import DEFAULTS, AssessmentSettings  # noqa: E402
from app.services.supply.vocabulary import Lifecycle, Status  # noqa: E402

NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


def offer(**over):
    base = {
        "connector_id": "c1", "stock": 1000, "marketplace": False, "discontinued": False, "rohs": True,
        "lead_time_days": None, "fetched_at": NOW - timedelta(hours=1),
    }
    return base | over


def facts(offers=None, lifecycle=Lifecycle.ACTIVE, **over):
    return checks.Facts(lifecycle=lifecycle, offers=[offer()] if offers is None else offers, now=NOW, **over)


def ids(found):
    return [f.check for f in found]


class CheckTests(unittest.TestCase):
    def test_a_healthy_part_has_no_findings(self) -> None:
        self.assertEqual(checks.evaluate(facts(), DEFAULTS), [])

    def test_lifecycle_findings_follow_the_manufacturer(self) -> None:
        for lifecycle, check, severity in (
            (Lifecycle.OBSOLETE, "obsolete", Status.FATAL),
            (Lifecycle.LAST_TIME_BUY, "last_time_buy", Status.WARNING),
            (Lifecycle.NRND, "nrnd", Status.WARNING),
        ):
            (finding,) = checks.evaluate(facts(lifecycle=lifecycle), DEFAULTS)
            self.assertEqual((finding.check, finding.severity), (check, severity), lifecycle)

    def test_stock_findings(self) -> None:
        self.assertEqual(ids(checks.evaluate(facts([offer(stock=0)]), DEFAULTS)), ["no_distributor_stock"])
        self.assertEqual(ids(checks.evaluate(facts(need=5000), DEFAULTS)), ["insufficient_stock"])
        self.assertEqual(checks.evaluate(facts(need=1000), DEFAULTS), [], "exactly enough is enough")

    def test_one_distributor_among_several_is_a_single_source(self) -> None:
        one_holder = [offer(), offer(connector_id="c2", stock=0)]
        self.assertEqual(ids(checks.evaluate(facts(one_holder, distributors=2), DEFAULTS)), ["single_source"])
        self.assertEqual(checks.evaluate(facts(one_holder, distributors=1), DEFAULTS), [], "with one distributor there is no choice")
        self.assertEqual(checks.evaluate(facts(one_holder), DEFAULTS), [], "unknown means not asked")
        two_holders = [offer(), offer(connector_id="c2")]
        self.assertEqual(checks.evaluate(facts(two_holders, distributors=2), DEFAULTS), [])
        self.assertNotIn("single_source", ids(checks.evaluate(facts([offer(stock=0)], distributors=3), DEFAULTS)))

    def test_marketplace_stock_does_not_count(self) -> None:
        self.assertEqual(ids(checks.evaluate(facts([offer(stock=900, marketplace=True)]), DEFAULTS)), ["no_distributor_stock"])

    def test_dropped_everywhere_but_not_when_one_still_sells_it(self) -> None:
        both = [offer(discontinued=True), offer(connector_id="c2", discontinued=True)]
        self.assertIn("distributor_discontinued", ids(checks.evaluate(facts(both), DEFAULTS)))
        one = [offer(discontinued=True), offer(connector_id="c2")]
        self.assertNotIn("distributor_discontinued", ids(checks.evaluate(facts(one), DEFAULTS)))

    def test_lead_time_rohs_and_age(self) -> None:
        self.assertEqual(ids(checks.evaluate(facts([offer(lead_time_days=120)]), DEFAULTS)), ["lead_time_over_threshold"])
        self.assertEqual(checks.evaluate(facts([offer(lead_time_days=84)]), DEFAULTS), [])
        self.assertEqual(ids(checks.evaluate(facts([offer(rohs=False)]), DEFAULTS)), ["rohs_noncompliant"])
        self.assertEqual(checks.evaluate(facts([offer(rohs=False), offer(connector_id="c2", rohs=True)]), DEFAULTS), [])
        self.assertEqual(ids(checks.evaluate(facts([offer(fetched_at=NOW - timedelta(hours=100))]), DEFAULTS)), ["data_stale"])

    def test_a_part_nobody_carries(self) -> None:
        self.assertEqual(ids(checks.evaluate(facts([], problem="not_found"), DEFAULTS)), ["part_not_found"])
        self.assertEqual(checks.evaluate(facts([]), DEFAULTS), [], "not read yet is not a finding")

    def test_severity_can_be_overridden(self) -> None:
        loose = AssessmentSettings(severity={"nrnd": Status.OK})
        (finding,) = checks.evaluate(facts(lifecycle=Lifecycle.NRND), loose)
        self.assertEqual(finding.severity, Status.OK)


class RiskTests(unittest.TestCase):
    def scores(self, *args, **kwargs):
        return {s.name: s.score for s in risk.sub_scores(facts(*args, **kwargs))}

    def test_a_good_part_scores_one_everywhere(self) -> None:
        two = [offer(), offer(connector_id="c2"), offer(connector_id="c3")]
        self.assertEqual(self.scores(two, need=100), dict.fromkeys(("lifecycle", "sourcing", "inventory", "market", "compliance"), 1))

    def test_sourcing_is_about_how_many_distributors_hold_it(self) -> None:
        self.assertEqual(self.scores([offer()])["sourcing"], 3)
        self.assertEqual(self.scores([offer(), offer(connector_id="c2")])["sourcing"], 2)
        self.assertEqual(self.scores([offer(stock=0)])["sourcing"], 5)

    def test_inventory_follows_cover(self) -> None:
        for need, score in ((100, 1), (500, 2), (900, 3), (2000, 4)):
            self.assertEqual(self.scores(need=need)["inventory"], score, need)
        self.assertEqual(self.scores([offer(stock=0)])["inventory"], 5)

    def test_lifecycle_rises_when_every_distributor_dropped_it(self) -> None:
        self.assertEqual(self.scores(lifecycle=Lifecycle.NRND)["lifecycle"], 3)
        self.assertEqual(self.scores([offer(discontinued=True)], lifecycle=Lifecycle.NRND)["lifecycle"], 4)

    def test_market_follows_lead_time(self) -> None:
        for days, score in ((20, 1), (50, 2), (80, 3), (150, 4), (400, 5)):
            self.assertEqual(self.scores([offer(lead_time_days=days)])["market"], score, days)


class HealthTests(unittest.TestCase):
    def assess(self, f):
        found = checks.evaluate(f, DEFAULTS)
        return found, health.health(found, risk.sub_scores(f), DEFAULTS, has_data=bool(f.offers))

    def test_a_part_with_nothing_wrong_is_ok_and_not_ten_when_one_distributor_holds_it(self) -> None:
        _, result = self.assess(facts())
        self.assertEqual(result.status, Status.OK)
        self.assertLess(result.score, 10)
        self.assertGreater(result.score, 8)

    def test_fatal_sets_zero_and_a_waiver_lifts_it(self) -> None:
        found, result = self.assess(facts(lifecycle=Lifecycle.OBSOLETE))
        self.assertEqual((result.score, result.status), (0.0, Status.FATAL))
        waived = waivers.apply(found, [{"id": "w", "check_id": "obsolete", "scope": "obsolete", "reason": "x", "state": "approved", "proposed_by": "a", "decided_by": "b"}])
        again = health.health(waived, risk.sub_scores(facts(lifecycle=Lifecycle.OBSOLETE)), DEFAULTS, has_data=True)
        self.assertNotEqual(again.status, Status.FATAL)
        self.assertGreater(again.score, 0)

    def test_status_follows_the_worst_open_finding_or_the_score(self) -> None:
        self.assertEqual(self.assess(facts([offer(stock=0)]))[1].status, Status.ERROR)
        self.assertEqual(self.assess(facts(lifecycle=Lifecycle.NRND))[1].status, Status.WARNING)

    def test_no_data_is_unknown_not_good(self) -> None:
        self.assertEqual(self.assess(facts([]))[1], health.Health(0.0, Status.UNKNOWN))

    def test_rollup_weights_by_quantity_and_caps_at_four_when_a_line_is_fatal(self) -> None:
        rolled = health.rollup([(9.0, 90, Status.OK), (3.0, 10, Status.ERROR)])
        self.assertEqual((rolled.score, rolled.status), (8.4, Status.ERROR))
        capped = health.rollup([(9.0, 90, Status.OK), (0.0, 10, Status.FATAL)])
        self.assertEqual((capped.score, capped.status), (4.0, Status.FATAL))
        self.assertEqual(health.rollup([(0.0, 5, Status.UNKNOWN)]).status, Status.UNKNOWN)


class WaiverApplyTests(unittest.TestCase):
    FINDING = checks.Finding("nrnd", Status.WARNING, "x", "nrnd")

    def apply(self, **waiver):
        base = {"id": "w1", "check_id": "nrnd", "scope": "nrnd", "reason": "ok", "state": "approved", "proposed_by": "a", "decided_by": "b"}
        (result,) = waivers.apply([self.FINDING], [base | waiver])
        return result.waiver

    def test_an_approved_waiver_for_the_same_condition_holds(self) -> None:
        self.assertEqual((self.apply()["holds"], self.apply()["outdated"]), (True, False))

    def test_one_for_another_condition_is_outdated_and_does_not_hold(self) -> None:
        waiver = self.apply(scope="last_time_buy")
        self.assertEqual((waiver["holds"], waiver["outdated"]), (False, True))

    def test_a_proposed_waiver_does_not_hold_yet(self) -> None:
        self.assertEqual(self.apply(state="proposed")["holds"], False)


if __name__ == "__main__":
    unittest.main()
