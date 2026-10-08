"""SB2-09: the parent ICD (Subsystems table) and the flattened ``?depth=all`` ICD (CONTRACTS_P2 §10)."""

from __future__ import annotations

import csv
import io
import unittest

from test_system_assemblies import AssemblyCase
from test_system_snapshots import DESIGNER, VIEWER


class ParentIcdTest(AssemblyCase):
    def bus(self, *, release: bool = True) -> str:
        publication = self.child(release=release)
        bus, version = self.parent()
        self.add(bus, version, "CNDH-A", publication["componentId"],
                 revision_id=None if release else publication["revisionId"],
                 follow="latest_released" if release else "pinned")
        return bus

    def test_the_parent_icd_lists_its_subsystems(self) -> None:
        bus = self.bus()
        html, _name, _version = self.service.icd(VIEWER, bus, "html")
        self.assertIn(">Subsystems</h2>", html)
        self.assertIn(self.ipn, html)
        self.assertIn("<td>v1</td>", html)
        self.assertIn("released", html)
        self.assertNotIn("Inside subsystems", html)
        self.assertNotIn("unreleased revision", html)

    def test_an_unreleased_pin_is_bannered(self) -> None:
        bus = self.bus(release=False)
        html, _name, _version = self.service.icd(VIEWER, bus, "html")
        self.assertIn("1 subsystem pins an unreleased revision.", html)

    def test_depth_all_adds_every_subsystem_level(self) -> None:
        bus = self.bus()
        html, _name, _version = self.service.icd(VIEWER, bus, "html", None, "all")
        self.assertIn(">Inside subsystems</h2>", html)
        self.assertIn("<h3>CNDH-A</h3>", html)
        for name in self.links:  # the child fixture's own links (L-J7J4, …)
            self.assertIn(name, html)
        content, _name, _version = self.service.icd(VIEWER, bus, "csv", None, "all")
        rows = list(csv.DictReader(io.StringIO(content)))
        self.assertTrue(rows)
        self.assertEqual(list(rows[0])[0], "occurrence")
        self.assertTrue(all(r["occurrence"] == "CNDH-A" for r in rows), "the bus has no links of its own yet")
        self.assertEqual({r["link_name"] for r in rows}, set(self.links))
        own, _name, _version = self.service.icd(VIEWER, bus, "csv")
        self.assertNotIn("occurrence", own.splitlines()[0])

    def test_depth_all_redacts_hidden_boards_and_hidden_child_systems(self) -> None:
        bus = self.bus()
        self.hide_pay()
        content, _name, _version = self.service.icd(VIEWER, bus, "csv", None, "all")
        rows = list(csv.DictReader(io.StringIO(content)))
        pay_ends = [(r["a_connector"], r["a_net"]) for r in rows if r["a_board"] == "PAY"] + \
                   [(r["b_connector"], r["b_net"]) for r in rows if r["b_board"] == "PAY"]
        self.assertTrue(pay_ends)
        self.assertTrue(all(connector == "" and net == "" for connector, net in pay_ends))
        self.conn.execute("UPDATE system_projects SET folder_id = 'fld_admins' WHERE id = %s", (self.sid,))
        self.conn.commit()
        html, _name, _version = self.service.icd(VIEWER, bus, "html", None, "all")
        self.assertNotIn("<h3>CNDH-A</h3>", html)
        admin_html, _n, _v = self.service.icd(DESIGNER.__class__(role="admin", email="a@x"), bus, "html", None, "all")
        self.assertIn("<h3>CNDH-A</h3>", admin_html)


if __name__ == "__main__":
    unittest.main()
