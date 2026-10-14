"""Stored facts, the weekly details pass (DigiKey notices, Mouser substances), the DigiKey sign-in and its routes.

Needs ``PRISM_DATABASE_URL``. Providers and DigiKey's token endpoint are stand-ins; nothing reaches the network.
"""

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

from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)
ADMIN = "admin@example.com"
LIST_CSV = "Substance name,EC No.,CAS No.,Date of inclusion\nLead,231-100-4,7439-92-1,2018-06-27\nDibutyl phthalate (DBP),201-557-4,84-74-2,2008-10-28\n"


class FakeTokens:
    """DigiKey's token endpoint: answers in order and records the forms it got."""

    def __init__(self, *answers):
        self.answers = list(answers)
        self.forms: list[dict] = []

    def request_json(self, method, url, **kwargs):
        self.forms.append(kwargs.get("form") or {})
        answer = self.answers.pop(0)
        if isinstance(answer, BaseException):
            raise answer
        return answer


def tokens(access="a1", refresh="r1"):
    return {"access_token": access, "refresh_token": refresh, "expires_in": 1799, "refresh_token_expires_in": 7776000}


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class DetailsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_oauth
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database = database
        cls.users = {role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role) for role in ("designer", "admin")}
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_details_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_oauth.router)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        from app.services.supply import oauth, parts, watches

        # A dev .env may set the sign-in address; these tests set PUBLIC_BASE_URL themselves.
        override = mock.patch.object(oauth.settings, "SUPPLY_OAUTH_BASE_URL", "")
        override.start()
        self.addCleanup(override.stop)

        with self.store.connection() as conn:
            for table in ("pcn_parts", "pcns", "part_facts", "part_substances", "detail_checks", "oauth_states", "connector_grants",
                          "listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events",
                          "svhc_substances", "svhc_list"):
                conn.execute(f"DELETE FROM {table}")
        self.digikey = self.connectors.create(actor=ADMIN, provider="digikey", storefront="IT", currency="EUR", display_name="DigiKey",
                                              credentials={"client_id": "cid", "client_secret": "csecret"})["id"]
        self.mouser = self.connectors.create(actor=ADMIN, provider="mouser", currency="EUR", display_name="Mouser",
                                             credentials={"api_key": "key"})["id"]
        with self.store.connection() as conn:
            self.part_a = parts.ensure_part(conn, "Texas Instruments", "LM358DR", ADMIN).id
            self.part_b = parts.ensure_part(conn, "Texas Instruments", "LM358DRG4", ADMIN).id
            watches.add_watch(conn, "Texas Instruments", "LM358DR", ADMIN)
            watches.add_watch(conn, "Texas Instruments", "LM358DRG4", ADMIN)
        self.dk_a = self.listing(self.digikey, "296-1395-1-ND", self.part_a)
        self.dk_b = self.listing(self.digikey, "296-9999-1-ND", self.part_b)
        self.mo_a = self.listing(self.mouser, "595-LM358DR", self.part_a)

    def listing(self, connector_id, sku, part_id):
        listing_id = uuid.uuid4().hex
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES (%s, %s, %s, %s, 'LM358DR', 'Texas Instruments', 'exact')", (listing_id, connector_id, sku, part_id))
        return listing_id

    def rows(self, sql, *params):
        with self.store.connection() as conn:
            return [dict(row) for row in conn.execute(sql, params).fetchall()]

    # --- facts --------------------------------------------------------------

    def test_an_offer_read_replaces_a_providers_facts_but_keeps_its_substance_list(self) -> None:
        from app.services.supply import facts

        with self.store.connection() as conn:
            facts.replace(conn, self.part_a, "digikey", [("rohs_status", "ROHS3 Compliant"), ("eccn", "EAR99")], NOW)
            facts.replace(conn, self.part_a, "mouser", [("rohs_status", "RoHS non-compliant")], NOW)
            facts.set_one(conn, self.part_a, "mouser", "reach_svhc", "Lead (CAS 7439-92-1)", NOW)
            facts.replace(conn, self.part_a, "digikey", [("rohs_status", "ROHS3 Compliant")], NOW)
            facts.replace(conn, self.part_a, "mouser", [("rohs_status", "RoHS non-compliant")], NOW)
            found = {item["name"]: item for item in facts.for_part(conn, self.part_a)}
            summary = facts.summary(conn, [self.part_a])[self.part_a]
        self.assertNotIn("eccn", found, "a fact the provider stopped sending is gone")
        self.assertIn("reach_svhc", found, "an offer read leaves the substance list alone")
        self.assertTrue(found["rohs_status"]["disagree"])
        self.assertEqual([s["source"] for s in found["rohs_status"]["sources"]], ["DigiKey", "Mouser"])
        self.assertEqual(summary["rohs"], "ROHS3 Compliant (DigiKey); RoHS non-compliant (Mouser)")

    # --- DigiKey notices ----------------------------------------------------

    def run_notices(self, notices_by_sku, token="user-token"):
        from app.services.supply import details
        from app.services.supply.models import ChangeNotice

        class Provider:
            def change_notices(self, sku, user_token):
                assert user_token == token
                return [ChangeNotice("digikey", sku, **item) for item in notices_by_sku.get(sku, [])]

        return details.run(self.connectors, self.digikey, now=NOW, provider=Provider(), token_for=lambda *_a: token)

    def test_a_notice_is_kept_once_for_every_part_it_covers_and_a_closed_one_stays_closed(self) -> None:
        from app.services.supply import pcn

        eol = {"kind_text": "EOL", "description": "Obsolescence of LM358DR family", "url": "https://media.digikey.com/pdf/PCN/x.pdf",
               "published_on": date(2025, 11, 4)}
        summary = self.run_notices({"296-1395-1-ND": [eol], "296-9999-1-ND": [eol]})
        self.assertEqual((summary.read, summary.new, summary.stopped), (2, 2, None))
        (notice,) = self.rows("SELECT id, kind, source, state, published_on FROM pcns")
        self.assertEqual((notice["kind"], notice["source"], notice["published_on"]), ("end_of_life", "digikey", date(2025, 11, 4)))
        self.assertEqual(len(self.rows("SELECT * FROM pcn_parts")), 2)
        with self.store.connection() as conn:
            listed = pcn.for_part(conn, self.part_a)
            pcn.close(conn, notice["id"], ADMIN)
        self.assertEqual((listed[0]["source_label"], listed[0]["published_on"]), ("DigiKey", "2025-11-04"))
        alerts = self.rows("SELECT kind FROM alerts WHERE part_id = %s", self.part_a)
        self.assertIn({"kind": "pcn"}, alerts)
        with self.store.connection() as conn:
            conn.execute("UPDATE detail_checks SET checked_at = %s", (NOW - timedelta(days=8),))
        self.run_notices({"296-1395-1-ND": [eol]})
        self.assertEqual(self.rows("SELECT state FROM pcns"), [{"state": "closed"}], "listing it again does not reopen it")

    def test_a_listing_read_this_week_is_not_read_again(self) -> None:
        self.run_notices({})
        self.assertEqual(self.run_notices({}).read, 0)

    def test_without_a_sign_in_notices_are_skipped_and_a_refusal_marks_the_grant(self) -> None:
        from app.services.supply import details, oauth
        from app.services.supply.providers.base import AuthError

        def nobody(*_args):
            raise oauth.NotSignedIn("nobody signed in")

        self.assertEqual(details.run(self.connectors, self.digikey, now=NOW, provider=object(), token_for=nobody).stopped, "not_signed_in")

        class Refusing:
            def change_notices(self, sku, user_token):
                raise AuthError("401")

        with self.store.connection() as conn:
            conn.execute("INSERT INTO connector_grants (connector_id, envelope, granted_by) VALUES (%s, 'x', %s)", (self.digikey, ADMIN))
        result = details.run(self.connectors, self.digikey, now=NOW, provider=Refusing(), token_for=lambda *_a: "tok")
        self.assertEqual(result.stopped, "sign_in_refused")
        self.assertEqual(self.rows("SELECT last_error FROM connector_grants"), [{"last_error": "refused"}])
        self.assertEqual(self.connectors.get(self.digikey)["paused_reason"], "", "the connector itself is not paused")

    def test_a_person_can_check_one_parts_notices_now_once_an_hour(self) -> None:
        from datetime import timedelta as delta

        from app.services.supply import details, oauth
        from app.services.supply.models import ChangeNotice

        calls = []

        class Provider:
            def change_notices(self, sku, user_token):
                calls.append(sku)
                return [ChangeNotice("digikey", sku, kind_text="PCN Packaging", description="Label Chg 12/Mar/2025", url="https://x.example/p.pdf")]

        # The wait is judged against the audit log's own clock, so this test uses the real one.
        real = datetime.now(timezone.utc)
        token = lambda *_a: "tok"  # noqa: E731
        self.run_notices({})  # this week's turn is used up, which a check ignores
        first = details.check_now(self.connectors, self.part_a, ADMIN, now=real, provider=Provider(), token_for=token)
        self.assertEqual((first["read"], first["new"], first["connectors"], first["problems"]), (1, 1, 1, []))
        self.assertEqual(calls, ["296-1395-1-ND"], "only this part's listing is read")
        with self.assertRaises(details.TooSoon):
            details.check_now(self.connectors, self.part_a, ADMIN, now=real + delta(minutes=10), provider=Provider(), token_for=token)
        again = details.check_now(self.connectors, self.part_a, "other@example.com", now=real + delta(minutes=10), provider=Provider(), token_for=token)
        self.assertEqual((again["read"], again["new"]), (1, 0), "another person may ask; the notice is kept once")
        later = details.check_now(self.connectors, self.part_a, ADMIN, now=real + delta(hours=1, minutes=1), provider=Provider(), token_for=token)
        self.assertEqual(later["read"], 1)

        def nobody(*_args):
            raise oauth.NotSignedIn("nobody")

        said = details.check_now(self.connectors, self.part_a, "third@example.com", now=real, provider=Provider(), token_for=nobody)
        self.assertEqual((said["read"], len(said["problems"])), (0, 1))
        self.assertIn("sign in at DigiKey", said["problems"][0]["reason"])

    # --- Mouser substances --------------------------------------------------

    def test_substances_mouser_names_become_its_declarations_and_follow_its_list(self) -> None:
        from app.services.supply import compliance, details
        from app.services.supply.models import Substances

        with self.store.connection() as conn:
            compliance.load_list(conn, LIST_CSV, "candidate.csv", ADMIN)
            compliance.declare(conn, self.part_a, "84-74-2", "supplier letter", ADMIN)
        answers = [Substances(entries=("Lead (CAS 7439-92-1)", "Dibutyl phthalate (DBP)"), stated=True), Substances(entries=(), stated=True)]
        seen = []

        class Provider:
            def substances(self, sku, manufacturer):
                seen.append((sku, manufacturer))
                return answers.pop(0)

        details.run(self.connectors, self.mouser, now=NOW, provider=Provider())
        self.assertEqual(seen, [("595-LM358DR", "Texas Instruments")])
        declared = self.rows("SELECT cas, declared_by FROM part_substances ORDER BY cas")
        self.assertEqual(declared, [{"cas": "7439-92-1", "declared_by": "distributor:mouser"}, {"cas": "84-74-2", "declared_by": ADMIN}],
                         "a person's declaration of the same substance is kept as theirs")
        with self.store.connection() as conn:
            by_cas = {item["cas"]: item for item in compliance.declared(conn, self.part_a)}
        self.assertEqual((by_cas["7439-92-1"]["declared_by"], by_cas["7439-92-1"]["from_distributor"]), ("Mouser", True))
        self.assertEqual(by_cas["7439-92-1"]["listed_as"], "Lead")
        with self.store.connection() as conn:
            conn.execute("UPDATE detail_checks SET checked_at = %s", (NOW - timedelta(days=8),))
        details.run(self.connectors, self.mouser, now=NOW, provider=Provider())
        self.assertEqual(self.rows("SELECT cas FROM part_substances"), [{"cas": "84-74-2"}], "what Mouser no longer lists goes")
        self.assertEqual(self.rows("SELECT value FROM part_facts WHERE name = 'reach_svhc'"), [{"value": "None listed"}])

    # --- sign-in ------------------------------------------------------------

    def test_a_later_reading_corrects_the_date_of_a_notice_kept_before(self) -> None:
        from datetime import date

        from app.services.supply import pcn

        with self.store.connection() as conn:
            part = conn.execute("SELECT id FROM parts LIMIT 1").fetchone()["id"]
            pcn.record_external(conn, "digikey", "k1", part, kind_text="PCN Packaging", description="Label Chg 12/Mar/2017",
                                notice_url="https://x.example/a.pdf", published_on=date(2026, 10, 12))
            again = pcn.record_external(conn, "digikey", "k1", part, kind_text="PCN Packaging", description="Label Chg 12/Mar/2017",
                                        notice_url="https://x.example/a.pdf", published_on=date(2017, 3, 12))
            row = conn.execute("SELECT published_on FROM pcns WHERE external_key = 'k1'").fetchone()
        self.assertEqual((again, row["published_on"]), (False, date(2017, 3, 12)), "the same notice, its date corrected")

    def test_the_sign_in_address_can_differ_from_the_public_one(self) -> None:
        from app.services.supply import oauth

        with mock.patch.object(oauth.settings, "PUBLIC_BASE_URL", "https://192.168.1.17"),                 mock.patch.object(oauth.settings, "SUPPLY_OAUTH_BASE_URL", "https://localhost/"):
            self.assertEqual(oauth.redirect_uri(), "https://localhost/api/supply/oauth/digikey/callback")
            self.assertIn("redirect_uri=https%3A%2F%2Flocalhost%2Fapi", oauth.start(self.connectors, self.digikey, ADMIN, NOW))
        with mock.patch.object(oauth.settings, "PUBLIC_BASE_URL", "https://192.168.1.17"):
            self.assertEqual(oauth.redirect_uri(), "https://192.168.1.17/api/supply/oauth/digikey/callback")

    def signin(self, client):
        from app.services.supply import oauth

        with mock.patch.object(oauth.settings, "PUBLIC_BASE_URL", "https://prism.example"):
            url = oauth.start(self.connectors, self.digikey, ADMIN, NOW)
            state = dict(part.split("=", 1) for part in url.split("?", 1)[1].split("&"))["state"]
            oauth.finish(self.connectors, state, "the-code", ADMIN, NOW, client=client)
        return url, state

    def test_a_sign_in_keeps_sealed_tokens_and_a_refresh_rotates_them(self) -> None:
        from app.services.supply import oauth

        client = FakeTokens(tokens("tok-access-one", "tok-refresh-one"), tokens("tok-access-two", "tok-refresh-two"))
        url, _state = self.signin(client)
        self.assertTrue(url.startswith("https://api.digikey.com/v1/oauth2/authorize?response_type=code&client_id=cid"))
        self.assertIn("redirect_uri=https%3A%2F%2Fprism.example%2Fapi%2Fsupply%2Foauth%2Fdigikey%2Fcallback", url)
        self.assertEqual(client.forms[0]["grant_type"], "authorization_code")
        (grant,) = self.rows("SELECT envelope FROM connector_grants")
        self.assertNotIn("tok-access-one", grant["envelope"])
        self.assertEqual(oauth.access_token(self.connectors, self.digikey, NOW, client=client), "tok-access-one")
        later = NOW + timedelta(hours=1)
        self.assertEqual(oauth.access_token(self.connectors, self.digikey, later, client=client), "tok-access-two")
        self.assertEqual((client.forms[1]["grant_type"], client.forms[1]["refresh_token"]), ("refresh_token", "tok-refresh-one"))
        with self.store.connection() as conn:
            status = oauth.status(conn, self.digikey, later)
        self.assertEqual((status["signed_in"], status["granted_by"]), (True, ADMIN))

    def test_a_state_works_once_for_the_person_who_started_it(self) -> None:
        from app.services.supply import oauth

        with mock.patch.object(oauth.settings, "PUBLIC_BASE_URL", "https://prism.example"):
            url = oauth.start(self.connectors, self.digikey, ADMIN, NOW)
            state = url.split("state=", 1)[1]
            with self.assertRaises(oauth.SignInError):
                oauth.finish(self.connectors, state, "code", "someone@example.com", NOW, client=FakeTokens(tokens()))
            with self.assertRaises(oauth.SignInError):
                oauth.finish(self.connectors, state, "code", ADMIN, NOW, client=FakeTokens(tokens()))
            with self.assertRaises(oauth.SignInError):
                oauth.start(self.connectors, self.mouser, ADMIN, NOW)
        with mock.patch.object(oauth.settings, "PUBLIC_BASE_URL", "http://prism.example"):
            with self.assertRaises(oauth.SignInError):
                oauth.start(self.connectors, self.digikey, ADMIN, NOW)

    def test_a_refused_refresh_needs_a_new_sign_in(self) -> None:
        from app.services.supply import oauth
        from app.services.supply.providers.base import AuthError

        client = FakeTokens(tokens(), AuthError("400"))
        self.signin(client)
        with self.assertRaises(oauth.NotSignedIn):
            oauth.access_token(self.connectors, self.digikey, NOW + timedelta(hours=1), client=client)
        with self.store.connection() as conn:
            self.assertEqual(oauth.status(conn, self.digikey)["state"], "refused")

    def test_the_distributor_category_is_listed_with_the_parameters_not_under_compliance(self) -> None:
        from app.services.supply import facts, parts_view

        with self.store.connection() as conn:
            facts.replace(conn, self.part_a, "digikey", (("category", "Op Amps"), ("rohs_status", "ROHS3 Compliant")), NOW)
            compliance_names = [item["name"] for item in facts.for_part(conn, self.part_a, hide=facts.NOT_COMPLIANCE)]
            everything = [item["name"] for item in facts.for_part(conn, self.part_a)]
            listed = parts_view.parameters_of(conn, self.part_a)
        self.assertEqual((compliance_names, "category" in everything), (["rohs_status"], True))
        self.assertEqual([(row["name"], row["raw"], row["sources"]) for row in listed], [("Distributor category", "Op Amps", ["digikey"])])

    def test_any_other_refusal_of_the_token_endpoint_also_needs_a_new_sign_in(self) -> None:
        from app.services.supply import oauth
        from app.services.supply.providers.base import ProviderError

        # OAuth answers a dead refresh token with HTTP 400 ``invalid_grant``, which is neither 401 nor 403.
        for second in (ProviderError("400"), {"access_token": "x"}):
            with self.store.connection() as conn:
                conn.execute("DELETE FROM connector_grants")
            client = FakeTokens(tokens(), second)
            self.signin(client)
            with self.assertRaises(oauth.NotSignedIn):
                oauth.access_token(self.connectors, self.digikey, NOW + timedelta(hours=1), client=client)
            with self.store.connection() as conn:
                self.assertEqual(oauth.status(conn, self.digikey)["state"], "refused")

    def test_a_service_that_does_not_answer_leaves_the_sign_in_alone(self) -> None:
        from app.services.supply import oauth
        from app.services.supply.providers.base import Unavailable

        client = FakeTokens(tokens(), Unavailable("503"))
        self.signin(client)
        with self.assertRaises(Unavailable):
            oauth.access_token(self.connectors, self.digikey, NOW + timedelta(hours=1), client=client)
        with self.store.connection() as conn:
            self.assertEqual(oauth.status(conn, self.digikey, NOW + timedelta(hours=1))["state"], "ok")

    def test_a_sign_in_ends_when_the_app_it_was_made_for_changes(self) -> None:
        self.signin(FakeTokens(tokens()))
        self.connectors.set_credentials(self.digikey, actor=ADMIN, credentials={"client_id": "cid", "client_secret": "new-secret"})
        self.assertEqual(len(self.rows("SELECT 1 FROM connector_grants")), 1, "the same app keeps its sign-in")
        self.connectors.set_credentials(self.digikey, actor=ADMIN, credentials={"client_id": "other", "client_secret": "s"})
        self.assertEqual(self.rows("SELECT 1 FROM connector_grants"), [])

    def test_checking_notices_says_so_when_the_token_cannot_be_renewed(self) -> None:
        from app.services.supply import details
        from app.services.supply.providers.base import Unavailable

        def down(*_args):
            raise Unavailable("503")

        said = details.check_now(self.connectors, self.part_a, "fourth@example.com", provider=object(), token_for=down)
        self.assertEqual((said["read"], len(said["problems"])), (0, 1))
        self.assertIn("did not answer", said["problems"][0]["reason"])

    def test_the_routes_are_for_administrators_and_the_callback_returns_to_the_connectors_tab(self) -> None:
        from app.services.supply import oauth

        self.assertEqual(_request(self.app, "POST", f"/api/supply/connectors/{self.digikey}/signin", user=self.users["designer"]).status, 403)
        with mock.patch.object(oauth.settings, "PUBLIC_BASE_URL", "https://prism.example"):
            started = _request(self.app, "POST", f"/api/supply/connectors/{self.digikey}/signin", user=self.users["admin"])
            self.assertEqual(started.status, 200, started.text)
            state = started.json["url"].split("state=", 1)[1]
            with mock.patch.object(oauth, "_client", lambda: FakeTokens(tokens())):
                back = _request(self.app, "GET", "/api/supply/oauth/digikey/callback", user=self.users["admin"],
                                query=f"code=abc&state={state}")
            self.assertEqual(back.status, 303)
            self.assertEqual(back.headers["location"], "/?section=supply&supplyView=connectors&signin=ok")
            again = _request(self.app, "GET", "/api/supply/oauth/digikey/callback", user=self.users["admin"], query=f"code=abc&state={state}")
            self.assertTrue(again.headers["location"].endswith("&signin=failed&reason=expired"), again.headers["location"])
            status = _request(self.app, "GET", f"/api/supply/connectors/{self.digikey}/signin", user=self.users["admin"])
        self.assertEqual((status.json["signed_in"], status.json["redirect_uri"]),
                         (True, "https://prism.example/api/supply/oauth/digikey/callback"))
        self.assertEqual(_request(self.app, "DELETE", f"/api/supply/connectors/{self.digikey}/signin", user=self.users["admin"]).status, 204)
        self.assertEqual(self.rows("SELECT * FROM connector_grants"), [])


if __name__ == "__main__":
    unittest.main()
