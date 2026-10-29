"""The Dashboard's inbox: what needs a person, worst first, each item naming where it is acted on."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import inbox  # noqa: E402

NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


class InboxTests(unittest.TestCase):
    def build(self, role: str | None = "qa", *, alerts=(), approvals: int = 0, **built):
        with mock.patch.object(inbox, "_alerts", return_value=list(alerts)), mock.patch.object(inbox, "_awaiting_approval", return_value=approvals):
            return inbox.items(None, built, role, NOW)

    def test_worst_first_and_feeds_before_everything_of_their_severity(self) -> None:
        found = self.build(
            alerts=[{"kind": "alerts", "severity": "warning", "count": 40, "alert_kind": "price_up"},
                    {"kind": "alerts", "severity": "fatal", "count": 1, "alert_kind": "lifecycle"}],
            approvals=3,
            failing_feeds=[{"kind": "connector", "name": "DigiKey", "since": None}],
            ending_components=4,
        )
        self.assertEqual([(item["kind"], item["severity"]) for item in found["items"]], [
            ("alerts", "fatal"), ("feed", "error"), ("ending", "error"), ("alerts", "warning"), ("approvals", "warning"),
        ])

    def test_several_stores_sources_are_one_feed(self) -> None:
        found = self.build(failing_feeds=[
            {"kind": "stores", "name": "Main", "since": "2026-02-27T10:00:00+00:00"},
            {"kind": "stores", "name": "Lab", "since": "2026-02-26T10:00:00+00:00"},
            {"kind": "connector", "name": "Mouser", "since": None},
        ])
        self.assertEqual([(item["name"], item["count"], item["since"]) for item in found["items"]],
                         [("Stores", 2, "2026-02-26T10:00:00+00:00"), ("Mouser", 1, None)])

    def test_a_project_short_of_its_usual_build_and_one_with_unchecked_lines(self) -> None:
        found = self.build(projects=[
            {"project_id": "p1", "project_name": "Power", "stats": {"boards": 40, "build_quantity": 100}},
            {"project_id": "p2", "project_name": "Radio", "stats": {"boards": 500, "build_quantity": 100, "unchecked": 2}},
            {"project_id": "p3", "project_name": "Fine", "stats": {"boards": 500, "build_quantity": 100}},
        ])
        self.assertEqual([(item["kind"], item["project_id"], item["count"]) for item in found["items"]],
                         [("project_short", "p1", 40), ("project_unconfirmed", "p2", 2)])

    def test_only_deadlines_within_a_month_and_only_qa_sees_approvals(self) -> None:
        deadlines = [{"part_id": "a", "mpn": "A-1", "kind": "last_time_buy", "date": "2026-03-10"},
                     {"part_id": "b", "mpn": "B-1", "kind": "last_buy_date", "date": "2026-03-20"},
                     {"part_id": "c", "mpn": "C-1", "kind": "last_buy_date", "date": "2026-09-01"}]
        (deadline,) = self.build(deadlines=deadlines)["items"]
        self.assertEqual((deadline["mpn"], deadline["count"]), ("A-1", 2))
        self.assertEqual(self.build("designer", approvals=3)["items"], [], "a designer doesn't approve")

    def test_only_a_few_lines_and_how_many_more(self) -> None:
        alerts = [{"kind": "alerts", "severity": "warning", "count": n, "alert_kind": f"k{n}"} for n in range(1, 12)]
        found = self.build(alerts=alerts)
        self.assertEqual((len(found["items"]), found["more"]), (inbox.SHOWN, 11 - inbox.SHOWN))
        self.assertEqual(found["items"][0]["count"], 11, "the biggest group of a kind first")
