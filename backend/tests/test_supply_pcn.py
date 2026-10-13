"""Product change notices: entry, the alert, the outlook, the API. Needs ``PRISM_DATABASE_URL`` for all but the first test."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply import outlook, pcn  # noqa: E402
from app.services.supply.vocabulary import Lifecycle  # noqa: E402
from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


def notice(kind="last_time_buy", state="open", buy="2026-04-15"):
    return {"state": state, "kind": kind, "kind_label": pcn.KIND_LABEL[kind], "title": "PCN-1234", "last_time_buy": buy, "last_time_ship": None}


class PureTests(unittest.TestCase):
    def test_the_alert_picks_the_most_pressing_ending_notice_and_is_urgent_within_ninety_days(self) -> None:
        today = date(2026, 3, 1)
        self.assertIsNone(pcn.alert_detail([notice("change"), notice(state="closed")], today))
        soon = pcn.alert_detail([notice(buy="2026-09-01"), notice("end_of_life", buy="2026-04-15")], today)
        self.assertEqual((soon["kind"], soon["last_time_buy"], soon["soon"]), ("end_of_life", "2026-04-15", True))
        far = pcn.alert_detail([notice(buy="2027-01-01")], today)
        self.assertFalse(far["soon"])
        self.assertFalse(pcn.alert_detail([notice("nrnd", buy=None)], today)["soon"])

    def test_a_change_notice_just_learned_of_is_news_and_an_old_one_is_not(self) -> None:
        today = date(2026, 3, 1)

        def change(released, seen="2026-02-25T10:00:00+00:00", description="Assembly site 10/Feb/2026"):
            return notice("change") | {"title": "PCN Assembly/Origin", "notes": description, "published_on": released, "created_at": seen}

        fresh = pcn.alert_detail([change("2026-02-10"), change("2017-03-12", description="Label Chg 12/Mar/2017")], today)
        self.assertEqual((fresh["title"], fresh["description"], fresh["new"], fresh["soon"]), ("PCN Assembly/Origin", "Assembly site 10/Feb/2026", 1, False))
        self.assertIsNone(pcn.alert_detail([change("2017-03-12")], today), "released years ago: history, not news")
        self.assertIsNone(pcn.alert_detail([change("2026-02-10", seen="2026-01-20T10:00:00+00:00")], today), "seen more than two weeks ago")
        self.assertEqual(pcn.alert_detail([change(None)], today)["new"], 1, "no release date: news while it is new to Prism")
        ending = pcn.alert_detail([change("2026-02-10"), notice("end_of_life")], today)
        self.assertEqual(ending["kind"], "end_of_life", "an ending notice still comes first")

    def test_an_open_notice_is_a_signal_in_the_outlook(self) -> None:
        eol = outlook.outlook(Lifecycle.ACTIVE, [{"discontinued": False}], notices=[notice("end_of_life")])
        self.assertEqual(eol["band"], "under_2_years")
        self.assertEqual(eol["signals"][0]["source"], "product change notice")
        self.assertEqual(outlook.outlook(Lifecycle.ACTIVE, [{"discontinued": False}], notices=[notice("nrnd", buy=None)])["band"], "2_to_5_years")
        self.assertEqual(outlook.outlook(Lifecycle.ACTIVE, [{"discontinued": False}], notices=[notice("change")])["band"], "no_signs")
        self.assertEqual(outlook.outlook(Lifecycle.ACTIVE, [{"discontinued": False}], notices=[notice(state="closed")])["band"], "no_signs")


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class PcnDatabaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_pcn
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import alerts, parts, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.watches, cls.alerts = database, parts, watches, alerts
        cls.users = {role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role) for role in ("viewer", "qa", "designer", "admin")}
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_pcn_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_pcn.router)
        supply_connectors.register_validation_redaction(cls.app)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("pcn_parts", "pcns", "alerts", "watches", "parts", "manufacturers", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
            record, _ = self.watches.add_watch(conn, "Acme", "ABC-1", "seed@example.com")
            self.part = record.part_id

    def call(self, method, path, *, role="designer", body=None):
        return _request(self.app, method, path, user=self.users[role], body=body)

    def add(self, **extra):
        body = {"title": "PCN-1234 end of production", "kind": "end_of_life", "parts": [{"manufacturer": "Acme", "mpn": "ABC-1"}], "last_time_buy": "2026-04-15"} | extra
        return self.call("POST", "/api/supply/notices", body=body)

    def test_a_designer_enters_a_notice_and_it_shows_on_each_part_it_covers(self) -> None:
        with self.store.connection() as conn:
            other = self.parts.ensure_part(conn, "Acme", "ABC-2", "seed@example.com").id
        created = self.add(parts=[{"manufacturer": "Acme", "mpn": "ABC-1"}, {"manufacturer": "acme inc", "mpn": "ABC-2"}], notice_url="https://acme.example/pcn.pdf")
        self.assertEqual(created.status, 201, created.text)
        for part in (self.part, other):
            listed = self.call("GET", f"/api/supply/parts/{part}/notices", role="qa").json["items"]
            self.assertEqual((len(listed), listed[0]["kind_label"], listed[0]["last_time_buy"], listed[0]["parts"]), (1, "End of life", "2026-04-15", 2))
        self.assertEqual(self.call("GET", f"/api/supply/parts/{self.part}/notices", role="viewer").status, 403)

    def test_a_notice_pdf_is_kept_once_and_served_and_a_dead_link_is_given_up_on(self) -> None:
        import tempfile
        from pathlib import Path
        from types import SimpleNamespace

        from app.services.supply import datasheets, notice_files

        class Client:
            def __init__(self, *bodies):
                self.bodies = list(bodies)

            def request(self, method, url, **kwargs):
                body = self.bodies.pop(0)
                if isinstance(body, Exception):
                    raise body
                return SimpleNamespace(body=body)

        created = self.add(notice_url="https://acme.example/pcn.pdf").json
        now = datetime(2026, 3, 1, 12, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as root, mock.patch.object(datasheets, "archive_root", lambda: Path(root)):
            self.assertEqual(notice_files.run_due(self.store, now, 2, Client(b"%PDF-1.4 notice")), {"kept": 1})
            self.assertEqual(notice_files.run_due(self.store, now, 2, Client()), {}, "nothing left to keep")
            listed = self.call("GET", f"/api/supply/parts/{self.part}/notices", role="qa").json["items"]
            self.assertTrue(listed[0]["has_file"])
            served = self.call("GET", f"/api/supply/notices/{created['id']}/file", role="qa")
            self.assertEqual((served.status, served.headers["content-type"]), (200, "application/pdf"))
            self.assertEqual(self.call("GET", "/api/supply/notices/nope/file", role="qa").status, 404)
            self.assertEqual(self.call("GET", f"/api/supply/notices/{created['id']}/file", role="viewer").status, 403)

            other = self.add(title="Another", notice_url="https://acme.example/gone.pdf").json
            for attempt in range(notice_files.GIVE_UP_AFTER + 2):
                later = now + notice_files.RETRY_AFTER * (attempt + 1)
                notice_files.run_due(self.store, later, 2, Client(b"<html>not a pdf</html>"))
            with self.store.connection() as conn:
                row = conn.execute("SELECT file_failures, file_status, file_sha256 FROM pcns WHERE id = %s", (other["id"],)).fetchone()
            self.assertEqual((row["file_failures"], row["file_status"], row["file_sha256"]), (notice_files.GIVE_UP_AFTER, "not_a_pdf", ""))
            self.assertEqual(self.call("GET", f"/api/supply/notices/{other['id']}/file", role="qa").status, 404)

    def test_what_is_refused_says_why(self) -> None:
        cases = [
            ({"kind": "other"}, "kind must be one of"),
            ({"notice_url": "http://acme.example/pcn"}, "must start with https://"),
            ({"last_time_buy": "2026-06-01", "last_time_ship": "2026-05-01"}, "cannot be before"),
            ({"parts": [{"manufacturer": "Nobody", "mpn": "X-1"}]}, "Nobody"),
        ]
        for extra, message in cases:
            response = self.add(**extra)
            self.assertEqual(response.status, 400, extra)
            self.assertIn(message, response.text)
        self.assertEqual(self.call("POST", "/api/supply/notices", role="qa", body={"title": "t", "kind": "change", "parts": [{"manufacturer": "Acme", "mpn": "ABC-1"}]}).status, 403)

    def test_an_open_ending_notice_raises_an_alert_that_clears_when_the_notice_is_closed(self) -> None:
        notice_id = self.add().json["id"]
        for later in (timedelta(0), timedelta(hours=1)):
            with self.store.connection() as conn:
                self.alerts.evaluate_parts(conn, [self.part], NOW + later)
        with self.store.connection() as conn:
            (alert,) = [a for a in self.alerts.list_alerts(conn, NOW + timedelta(hours=2)) if a["kind"] == "pcn"]
        self.assertEqual((alert["severity"], alert["detail"]["kind"]), ("error", "end_of_life"))
        self.assertEqual(self.call("POST", f"/api/supply/notices/{notice_id}/close").status, 204)
        with self.store.connection() as conn:
            self.alerts.evaluate_parts(conn, [self.part], NOW + timedelta(hours=3))
            self.assertEqual([a for a in self.alerts.list_alerts(conn, NOW + timedelta(hours=4)) if a["kind"] == "pcn"], [])
        closed = self.call("GET", f"/api/supply/parts/{self.part}/notices").json["items"]
        self.assertEqual(closed[0]["state"], "closed")
        self.assertEqual(self.call("POST", "/api/supply/notices/nope/close").status, 404)


if __name__ == "__main__":
    unittest.main()
