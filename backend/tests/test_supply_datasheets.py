"""The datasheet archive: fetching, versions, change summaries, the alert, the API. Needs ``PRISM_DATABASE_URL``."""

from __future__ import annotations

import os
import shutil
import sys
import tempfile
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply import datasheets  # noqa: E402
from app.services.supply.providers.base import ProviderError  # noqa: E402
from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


def pdf(text: str) -> bytes:
    """A one page PDF holding ``text``, built by hand so the test needs no PDF writer."""

    stream = f"BT /F1 12 Tf 50 700 Td ({text}) Tj ET".encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out, offsets = b"%PDF-1.4\n", []
    for index, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % index + body + b"\nendobj\n"
    start = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    for offset in offsets:
        out += b"%010d 00000 n \n" % offset
    return out + b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF" % (len(objects) + 1, start)


class Client:
    def __init__(self, *bodies):
        self.bodies, self.urls = list(bodies), []

    def request(self, method, url, **kwargs):
        self.urls.append(url)
        body = self.bodies.pop(0)
        if isinstance(body, Exception):
            raise body
        return SimpleNamespace(body=body)


class TextTests(unittest.TestCase):
    def test_the_text_of_a_pdf_is_read_and_lifecycle_phrases_are_found(self) -> None:
        extracted = datasheets.extract(pdf("LM358 dual op amp. Not recommended for new designs. Last time buy 2027."))
        self.assertEqual(extracted.pages, 1)
        self.assertEqual(datasheets.markers_in(extracted.text), ["last time buy", "not recommended for new designs"])

    def test_a_file_that_is_not_a_pdf_or_is_broken_is_refused(self) -> None:
        with self.assertRaises(datasheets.DatasheetError):
            datasheets.fetch("https://example.com/a.pdf", Client(b"<html>sign in</html>"))
        with self.assertRaises(datasheets.DatasheetError):
            datasheets.extract(b"%PDF-1.4 not really")
        with self.assertRaises(datasheets.DatasheetError):
            datasheets.fetch("http://example.com/a.pdf", Client(b""))

    def test_a_refused_request_is_told_by_its_code(self) -> None:
        class Refused(ProviderError):
            code = "egress_denied"

        with self.assertRaises(datasheets.DatasheetError) as caught:
            datasheets.fetch("https://example.com/a.pdf", Client(Refused("blocked")))
        self.assertEqual(str(caught.exception), "egress_denied")

    def test_a_change_summary_says_how_much_changed_and_which_phrases_came_or_went(self) -> None:
        text = "Absolute maximum ratings 36 V " * 40
        self.assertEqual(datasheets.summarize_change(text, text, [], []), "The text is the same.")
        summary = datasheets.summarize_change(text, text + " Not recommended for new designs", [], ["not recommended for new designs"])
        self.assertIn("Now mentions: not recommended for new designs.", summary)
        self.assertIn("changed", summary)
        self.assertIn("No longer mentions: obsolete.", datasheets.summarize_change(text, text, ["obsolete"], []))


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class ArchiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_datasheets
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import alerts, parts, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.watches, cls.alerts = database, parts, watches, alerts
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_sheets_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_datasheets.router)
        supply_connectors.register_validation_redaction(cls.app)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()
        cls.root = tempfile.TemporaryDirectory()
        cls.root_patch = mock.patch.object(datasheets, "archive_root", lambda: Path(cls.root.name))
        cls.root_patch.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.root_patch.stop()
        cls.root.cleanup()
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        for child in Path(self.root.name).iterdir():
            shutil.rmtree(child, ignore_errors=True)
        with self.store.connection() as conn:
            for table in ("datasheet_checks", "datasheets", "watches", "parts", "manufacturers", "audit_events", "alerts"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
            record, _ = self.watches.add_watch(conn, "Acme", "ABC-1", "seed@example.com")
            self.part = record.part_id
            conn.execute("UPDATE parts SET datasheet_url = 'https://acme.example/abc1.pdf' WHERE id = %s", (self.part,))

    def versions(self):
        with self.store.connection() as conn:
            return datasheets.list_versions(conn, self.part)

    def test_a_changed_file_is_a_new_version_and_the_same_file_is_not(self) -> None:
        url = "https://acme.example/abc1.pdf"
        first = pdf("ABC-1 regulator. Active.")
        self.assertEqual(datasheets.check_part(self.store, self.part, url, NOW, Client(first)), "new")
        self.assertEqual(datasheets.check_part(self.store, self.part, url, NOW + timedelta(days=7), Client(first)), "unchanged")
        self.assertEqual(datasheets.check_part(self.store, self.part, url, NOW + timedelta(days=14), Client(pdf("ABC-1 regulator. Not recommended for new designs."))), "new")
        newest, oldest = self.versions()
        self.assertEqual((oldest["version"], oldest["change_summary"]), (1, ""))
        self.assertEqual(newest["version"], 2)
        self.assertIn("Now mentions: not recommended for new designs.", newest["change_summary"])
        self.assertEqual(newest["markers"], ["not recommended for new designs"])

    def test_only_the_newest_versions_are_kept_and_their_files_go_with_them(self) -> None:
        url = "https://acme.example/abc1.pdf"
        for index in range(datasheets.KEEP_VERSIONS + 2):
            datasheets.check_part(self.store, self.part, url, NOW + timedelta(days=7 * index), Client(pdf(f"Revision {index}")))
        kept = self.versions()
        self.assertEqual([item["version"] for item in kept], [7, 6, 5, 4, 3])
        with self.store.connection() as conn:
            self.assertIsNone(datasheets.file_of(conn, "nope"))
        stored = {path.name for path in Path(self.root.name).rglob("*") if path.is_file()}
        self.assertEqual(len([name for name in stored if name.endswith(".txt")]), datasheets.KEEP_VERSIONS)

    def test_losing_a_race_for_the_same_version_is_not_an_error(self) -> None:
        import psycopg.errors
        from unittest import mock

        url = "https://acme.example/abc1.pdf"
        with mock.patch.object(datasheets, "store_version", side_effect=psycopg.errors.UniqueViolation("another job kept it")):
            self.assertEqual(datasheets.check_part(self.store, self.part, url, NOW, Client(pdf("x"))), "unchanged")

    def test_a_dead_address_is_retried_less_and_less_often(self) -> None:
        url = "https://acme.example/abc1.pdf"
        for attempt in range(datasheets.DEAD_AFTER_FAILURES):
            outcome = datasheets.check_part(self.store, self.part, url, NOW + timedelta(days=7 * attempt), Client(b"<html></html>"))
            self.assertEqual(outcome, "not_a_pdf")
        with self.store.connection() as conn:
            later = NOW + timedelta(days=7 * 3)
            self.assertEqual(datasheets.due_parts(conn, later, 5), [], "dead: not tried again for a month")
            self.assertEqual(len(datasheets.due_parts(conn, NOW + timedelta(days=7 * 2 + 31), 5)), 1)

    def test_due_parts_are_watched_or_on_a_bom_and_checked_weekly(self) -> None:
        with self.store.connection() as conn:
            self.assertEqual([row["id"] for row in datasheets.due_parts(conn, NOW, 5)], [self.part])
            other = self.parts.ensure_part(conn, "Acme", "NOT-WATCHED", "seed@example.com").id
            conn.execute("UPDATE parts SET datasheet_url = 'https://acme.example/x.pdf' WHERE id = %s", (other,))
            self.assertEqual([row["id"] for row in datasheets.due_parts(conn, NOW, 5)], [self.part], "not watched, not on a BOM")
        datasheets.check_part(self.store, self.part, "https://acme.example/abc1.pdf", NOW, Client(pdf("x")))
        with self.store.connection() as conn:
            self.assertEqual(datasheets.due_parts(conn, NOW + timedelta(days=3), 5), [])
            self.assertEqual(len(datasheets.due_parts(conn, NOW + timedelta(days=8), 5)), 1)

    def test_run_due_checks_and_a_replaced_datasheet_raises_an_alert_after_two_looks(self) -> None:
        url = "https://acme.example/abc1.pdf"
        datasheets.run_due(self.store, NOW, 2, Client(pdf("one")))
        datasheets.run_due(self.store, NOW + timedelta(days=8), 2, Client(pdf("two, last time buy")))
        with self.store.connection() as conn:
            self.alerts.evaluate_parts(conn, [self.part], NOW + timedelta(days=8, hours=1))
            kinds = [row["kind"] for row in self.alerts.list_alerts(conn, NOW + timedelta(days=8, hours=2))]
        self.assertEqual(kinds, ["datasheet_changed"])
        self.assertEqual(url, "https://acme.example/abc1.pdf")

    def test_a_distributors_datasheet_address_is_kept_once_and_only_if_it_is_https(self) -> None:
        from app.services.supply import discovery

        with self.store.connection() as conn:
            conn.execute("UPDATE parts SET datasheet_url = '' WHERE id = %s", (self.part,))
            discovery.remember_datasheet(conn, self.part, "http://insecure.example/a.pdf")
            self.assertEqual(conn.execute("SELECT datasheet_url FROM parts WHERE id = %s", (self.part,)).fetchone()["datasheet_url"], "")
            discovery.remember_datasheet(conn, self.part, " https://first.example/a.pdf ")
            discovery.remember_datasheet(conn, self.part, "https://second.example/b.pdf")
            self.assertEqual(conn.execute("SELECT datasheet_url FROM parts WHERE id = %s", (self.part,)).fetchone()["datasheet_url"], "https://first.example/a.pdf")

    def call(self, method, path, *, role="designer", body=None):
        return _request(self.app, method, path, user=self.users[role], body=body)

    def test_versions_and_the_file_are_readable_and_the_address_is_set_by_writers(self) -> None:
        datasheets.check_part(self.store, self.part, "https://acme.example/abc1.pdf", NOW, Client(pdf("ABC-1")))
        listed = self.call("GET", f"/api/supply/parts/{self.part}/datasheets", role="qa")
        self.assertEqual((listed.status, listed.json["url"], listed.json["status"], len(listed.json["items"])), (200, "https://acme.example/abc1.pdf", "new", 1))
        file = self.call("GET", f"/api/supply/datasheets/{listed.json['items'][0]['id']}/file", role="qa")
        self.assertEqual((file.status, file.headers["content-type"], file.headers["content-security-policy"]), (200, "application/pdf", "sandbox"))
        self.assertTrue(file.headers["content-disposition"].startswith('attachment; filename="ABC-1-v1'))
        self.assertEqual(self.call("GET", "/api/supply/datasheets/nope/file").status, 404)
        self.assertEqual(self.call("GET", f"/api/supply/parts/{self.part}/datasheets", role="viewer").status, 403)

        self.assertEqual(self.call("PUT", f"/api/supply/parts/{self.part}/datasheet-url", role="qa", body={"url": "https://x.example/a.pdf"}).status, 403)
        self.assertEqual(self.call("PUT", f"/api/supply/parts/{self.part}/datasheet-url", body={"url": "http://x.example/a.pdf"}).status, 400)
        self.assertEqual(self.call("PUT", f"/api/supply/parts/{self.part}/datasheet-url", body={"url": "https://x.example/a.pdf"}).status, 204)
        after = self.call("GET", f"/api/supply/parts/{self.part}/datasheets").json
        self.assertEqual((after["url"], after["status"]), ("https://x.example/a.pdf", None), "a new address starts fresh")

    def test_an_administrator_denies_a_host_and_nothing_is_fetched_from_it_or_its_subdomains(self) -> None:
        url = "https://cdn.blocked.example/abc1.pdf"
        self.assertEqual(self.call("PUT", "/api/supply/datasheet-hosts", role="designer", body={"host": "blocked.example"}).status, 403)
        reply = self.call("PUT", "/api/supply/datasheet-hosts", role="admin", body={"host": "https://Blocked.example/x", "reason": "slow"})
        self.assertEqual([item["host"] for item in reply.json["items"]], ["blocked.example"])
        self.assertEqual(self.call("PUT", "/api/supply/datasheet-hosts", role="admin", body={"host": "not a host!"}).status, 400)
        try:
            self.assertEqual(datasheets.check_part(self.store, self.part, url, NOW, Client(pdf("x"))), "host_denied")
            self.assertEqual(datasheets.check_part(self.store, self.part, "https://notblocked.example/a.pdf", NOW, Client(pdf("x"))), "new")
            self.assertEqual(self.call("PUT", f"/api/supply/parts/{self.part}/datasheet-url", body={"url": url}).status, 400)
            self.assertEqual(self.call("GET", "/api/supply/datasheet-hosts", role="qa").status, 403)
        finally:
            self.assertEqual(self.call("DELETE", "/api/supply/datasheet-hosts/blocked.example", role="admin").json["items"], [])


if __name__ == "__main__":
    unittest.main()
