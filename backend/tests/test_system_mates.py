"""SB2-16: mates-with in systems (CONTRACTS_P2 §18): SYS-V18 and harness-end suggestions.

The catalog is a separate service; a fake stands in, and the fixture board
interfaces get MPNs on OBC-A J7 and PAY J4 (the P1 fixtures carry none).
"""

from __future__ import annotations

from system_builder_db import FixtureSystemCase

from app.services.systems.interface_extractor import _mpn
from app.services.systems import interface_cache
from app.services.systems.jobs import extract_and_store
from app.services.systems import manifest as manifest_io
from app.services.systems.service import Caller, SystemService
from app.services.systems.store import Conflict, Invalid, NotFound

DESIGNER = Caller(role="designer", email="designer@example.com")
PLUG = {"componentId": "cmp_plug", "name": "Plug", "mpn": "SAMTEC-PLUG", "manufacturer": "Samtec"}
SOCKET = {"componentId": "cmp_socket", "name": "Socket", "mpn": "SAMTEC-SOCKET", "manufacturer": "Samtec"}
HOUSING = {"componentId": "cmp_housing", "name": "Housing", "mpn": "JST-H", "manufacturer": "JST"}


class FakeCatalog:
    def __init__(self) -> None:
        self.pairs: set[tuple[str, str]] = set()
        self.parts = {p["mpn"].lower(): p for p in (PLUG, SOCKET, HOUSING)}

    def parts_by_mpn(self, mpns):
        return {m.strip().lower(): self.parts[m.strip().lower()] for m in mpns if m.strip().lower() in self.parts}

    def mate_pairs(self, ids):
        return {pair for pair in self.pairs if set(pair) & set(ids)}

    def part_for_block(self, component_id):
        blocks = {"cmp_housing": {**HOUSING, "revisionId": "rev_h", "pins": ["1", "2", "3", "4"]},
                  "cmp_blank": {**HOUSING, "componentId": "cmp_blank", "revisionId": "rev_b", "pins": None}}
        if component_id not in blocks:
            raise LookupError("Component not found")
        return blocks[component_id]

    def list_mates_with(self, component_id):
        partners = [b if a == component_id else a for a, b in self.pairs if component_id in (a, b)]
        return [p for p in self.parts.values() if p["componentId"] in partners]


class MatesCase(FixtureSystemCase):
    def setUp(self) -> None:
        super().setUp()
        self.catalog = FakeCatalog()
        self.service = SystemService(connect=self.connect, project_loader=self.projects.get,
                                     enqueue=lambda *a, **k: {"job_id": "j", "status": "queued"},
                                     catalog=lambda: self.catalog)
        for board, project_id in (("mini_obc", "prj_obc"), ("mini_payload", "prj_pay"), ("mini_power", "prj_pwr")):
            extract_and_store(self.projects[project_id], self.commits[board]["F0"], self.connect)
        for project, reference, mpn in (("prj_obc", "J7", PLUG["mpn"]), ("prj_pay", "J4", SOCKET["mpn"])):
            interface_cache.interfaces.clear()  # a direct artifact write bypasses the SB2-93 cache
            self.conn.execute(
                """UPDATE system_interface_artifacts SET payload = jsonb_set(payload, '{components}',
                     (SELECT jsonb_agg(CASE WHEN c->>'reference' = %s THEN jsonb_set(c, '{mpn}', to_jsonb(%s::text)) ELSE c END)
                      FROM jsonb_array_elements(payload->'components') c))
                   WHERE project_id = %s""", (reference, mpn, project))
        self.conn.commit()
        self.link = self.links["L-J7J4"]



class MatesTest(MatesCase):
    def v18(self) -> list[dict]:
        return [f for f in self.service.validation_report(DESIGNER, self.sid).body["findings"] if f["rule"] == "SYS-V18"]

    def test_mpn_fields_are_read_case_insensitively(self) -> None:
        self.assertEqual(_mpn({"Manufacturer_Part_Number": " FTSH-110 "}), "FTSH-110")
        self.assertEqual(_mpn({"MPN": "", "Mfr. No.": "ADM6-30"}), "ADM6-30")
        self.assertIsNone(_mpn({"Value": "Conn_01x04"}))

    def test_an_unknown_b2b_pair_warns_until_the_catalog_relates_it(self) -> None:
        self.assertEqual(self.v18(), [], "unspecified links are not mates")
        self.service.update_link(DESIGNER, self.sid, self.version(), self.link, {"type": "b2b"})
        [finding] = self.v18()
        self.assertEqual((finding["severity"], finding["linkId"], finding["detail"]),
                         ("warning", self.link, {"partA": PLUG["componentId"], "partB": SOCKET["componentId"]}))
        self.catalog.pairs.add(("cmp_plug", "cmp_socket"))
        self.assertEqual(self.v18(), [])

    def test_a_part_on_a_harness_end_is_checked_and_suggestions_never_assign(self) -> None:
        harness = self.service.link_to_harness(DESIGNER, self.sid, self.version(), self.link).body
        obc_end = harness["ends"][0]
        self.catalog.pairs.add(("cmp_housing", "cmp_plug"))
        body = self.service.end_suggestions(DESIGNER, self.sid, harness["id"], obc_end["id"])
        self.assertEqual((body["connectorMpn"], body["connectorPart"]["componentId"],
                          [s["componentId"] for s in body["suggestions"]]),
                         (PLUG["mpn"], "cmp_plug", ["cmp_housing"]))
        self.assertIsNone(self.store.get_harness(self.sid, harness["id"])["ends"][0]["catalog_component_id"])
        # An assigned part that is not a known partner of the board connector warns.
        self.conn.execute("UPDATE system_harness_ends SET catalog_component_id = 'cmp_socket' WHERE id = %s",
                          (obc_end["id"],))
        self.conn.commit()
        [finding] = self.v18()
        self.assertEqual((finding["detail"]["endId"], finding["detail"]["part"], finding["detail"]["connectorPart"]),
                         (obc_end["id"], "cmp_socket", "cmp_plug"))
        self.conn.execute("UPDATE system_harness_ends SET catalog_component_id = 'cmp_housing' WHERE id = %s",
                          (obc_end["id"],))
        self.conn.commit()
        self.assertEqual(self.v18(), [])

    def test_no_mpn_means_not_evaluated(self) -> None:
        interface_cache.interfaces.clear()  # a direct artifact write bypasses the SB2-93 cache
        self.conn.execute("UPDATE system_interface_artifacts SET payload = jsonb_set(payload, '{components}',"
                          " (SELECT jsonb_agg(c - 'mpn') FROM jsonb_array_elements(payload->'components') c))")
        self.conn.commit()
        self.service.update_link(DESIGNER, self.sid, self.version(), self.link, {"type": "b2b"})
        self.assertEqual(self.v18(), [])


class HousingPartTest(MatesCase):
    """SB2-18: a catalog part on a harness end's mating block (CONTRACTS_P2 §17.2, SYS-V19)."""

    def harness(self) -> dict:
        harness = self.service.link_to_harness(DESIGNER, self.sid, self.version(), self.link).body
        a, b = harness["ends"]
        return self.service.replace_wires(DESIGNER, self.sid, self.version(), harness["id"], [
            {"from": {"end": a["id"], "pin": "1"}, "to": {"end": b["id"], "pin": "1"}},
            {"from": {"end": a["id"], "pin": "2"}, "to": {"end": b["id"], "pin": "2"}}]).body

    def assign(self, harness: dict, end: dict, part) -> dict:
        return self.service.update_harness_end(DESIGNER, self.sid, self.version(), harness["id"], end["id"],
                                               {"part": part}).body

    def v19(self) -> list[dict]:
        return [f for f in self.service.validation_report(DESIGNER, self.sid).body["findings"] if f["rule"] == "SYS-V19"]

    def test_a_part_replaces_the_pins_and_a_mismatch_needs_a_map(self) -> None:
        harness = self.harness()
        end = harness["ends"][0]
        self.assertEqual(len(end["pins"]), len(end["matePads"]))  # Generic: the connector's pads
        body = self.assign(harness, end, {"componentId": "cmp_housing"})
        assigned = body["ends"][0]
        self.assertEqual((assigned["part"], assigned["pins"], assigned["pinCount"]),
                         ({"componentId": "cmp_housing", "revisionId": "rev_h", "name": "Housing", "mpn": "JST-H",
                           "manufacturer": "JST"}, ["1", "2", "3", "4"], 4))
        [finding] = self.v19()
        self.assertEqual((finding["severity"], finding["detail"]["unmapped"], finding["detail"]["partPins"]),
                         ("error", ["1", "2"], 4))
        self.service.update_harness_end(DESIGNER, self.sid, self.version(), harness["id"], end["id"],
                                        {"pinMap": {"1": "1", "2": "2"}})
        self.assertEqual(self.v19(), [])
        manifest = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-09-30T00:00:00+00:00")
        self.assertEqual((manifest.harnesses[0].ends[0].partPins, manifest.harnesses[0].ends[0].part.mpn),
                         (["1", "2", "3", "4"], "JST-H"))
        generic = self.assign(harness, end, None)["ends"][0]
        self.assertEqual((generic["part"], len(generic["pins"])), (None, len(end["matePads"])))

    def test_refusals(self) -> None:
        harness = self.harness()
        end = harness["ends"][0]
        with self.assertRaises(NotFound):
            self.assign(harness, end, {"componentId": "cmp_missing"})
        with self.assertRaises(Invalid):
            self.assign(harness, end, {"componentId": "cmp_blank"})
        a, b = harness["ends"]
        self.service.replace_wires(DESIGNER, self.sid, self.version(), harness["id"],
                                   [{"from": {"end": a["id"], "pin": "9"}, "to": {"end": b["id"], "pin": "9"}}])
        with self.assertRaises(Conflict) as refused:
            self.assign(harness, end, {"componentId": "cmp_housing"})
        self.assertIn("9", str(refused.exception))
