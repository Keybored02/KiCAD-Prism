"""Declared KiCad libraries: CRUD, variable ownership and fetch state.

Runs the store against a scratch schema migrated by the production workspace
ledger, so the migration and the SQL are the real ones.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.errors import Conflict, Invalid, NotFound  # noqa: E402
from app.services import kicad_libraries, kicad_library_store as store  # noqa: E402
from app.services.workspace_schema_migrations import WORKSPACE_LEDGER  # noqa: E402
from support.postgres import requires_scratch_postgres, scratch_schema  # noqa: E402

LSF = {"name": "lsf", "variables": ["LSF_KICAD_LIB"], "git": "https://example.org/lsf.git", "ref": "v1"}


@requires_scratch_postgres("KiCad library store tests")
class KicadLibraryStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.scratch = scratch_schema(self, "kicad_libraries", ledgers=(WORKSPACE_LEDGER,))
        patcher = patch.object(store, "connect", self.scratch.connection)
        patcher.start()
        self.addCleanup(patcher.stop)
        kicad_libraries.forget_rows()
        self.addCleanup(kicad_libraries.forget_rows)

    def test_create_lists_and_reads_back(self) -> None:
        created = store.create(LSF, updated_by="a@example.org")
        self.assertEqual(created["state"], "pending")
        self.assertEqual((created["git"], created["ref"], created["variables"]), (LSF["git"], "v1", ["LSF_KICAD_LIB"]))
        self.assertEqual(created["updatedBy"], "a@example.org")
        self.assertEqual([row["name"] for row in store.list_all()], ["lsf"])
        self.assertEqual(store.get("lsf")["name"], "lsf")

    def test_declared_is_what_the_resolver_validates(self) -> None:
        store.create(LSF, updated_by="")
        (row,) = store.declared()
        self.assertEqual(kicad_libraries.validate_entry(row).source, "https://example.org/lsf.git@v1#")

    def test_a_path_library(self) -> None:
        created = store.create({"name": "local", "variables": ["LOCAL_LIB"], "path": "lsf/"}, updated_by="")
        self.assertEqual((created["path"], created["git"]), ("lsf", ""))

    def test_invalid_input(self) -> None:
        for fields in ({**LSF, "git": "http://example.org/x.git"}, {**LSF, "variables": []}, {**LSF, "name": "a b"}):
            with self.subTest(fields=fields), self.assertRaises(Invalid):
                store.create(fields, updated_by="")

    def test_a_name_is_unique(self) -> None:
        store.create(LSF, updated_by="")
        with self.assertRaises(Conflict):
            store.create({**LSF, "variables": ["OTHER"]}, updated_by="")

    def test_a_variable_has_one_owner(self) -> None:
        store.create(LSF, updated_by="")
        with self.assertRaises(Conflict) as raised:
            store.create({**LSF, "name": "second"}, updated_by="")
        self.assertIn("lsf", str(raised.exception))

    def test_the_stock_preset_owns_its_variables(self) -> None:
        with patch.object(kicad_libraries.settings, "KICAD_3D_LIBRARY_ENABLED", True):
            with self.assertRaises(Conflict):
                store.create({**LSF, "name": "mine", "variables": ["KICAD10_3DMODEL_DIR"]}, updated_by="")

    def test_a_ref_change_resets_the_fetch(self) -> None:
        store.create(LSF, updated_by="")
        store.record_fetch("lsf", state="failed", error="boom", progress=40)
        kept = store.update("lsf", {"variables": ["LSF_KICAD_LIB", "LSF_EXTRA"]}, updated_by="")
        self.assertEqual((kept["state"], kept["error"]), ("failed", "boom"))
        moved = store.update("lsf", {"ref": "v2"}, updated_by="b@example.org")
        self.assertEqual((moved["ref"], moved["state"], moved["error"]), ("v2", "pending", None))
        self.assertEqual(moved["updatedBy"], "b@example.org")

    def test_update_can_keep_its_own_variables(self) -> None:
        store.create(LSF, updated_by="")
        self.assertEqual(store.update("lsf", {"ref": "v2"}, updated_by="")["variables"], ["LSF_KICAD_LIB"])

    def test_update_cannot_take_another_librarys_variable(self) -> None:
        store.create(LSF, updated_by="")
        store.create({**LSF, "name": "second", "variables": ["SECOND"]}, updated_by="")
        with self.assertRaises(Conflict):
            store.update("second", {"variables": ["LSF_KICAD_LIB"]}, updated_by="")

    def test_record_fetch(self) -> None:
        store.create(LSF, updated_by="")
        store.record_fetch("lsf", state="fetching", progress=10)
        self.assertEqual((store.get("lsf")["state"], store.get("lsf")["progress"]), ("fetching", 10))
        store.record_fetch("lsf", state="ready", progress=100, size_bytes=1234, error=None)
        done = store.get("lsf")
        self.assertEqual((done["state"], done["sizeBytes"], done["error"]), ("ready", 1234, None))
        self.assertIsNotNone(done["fetchedAt"])
        with self.assertRaises(Invalid):
            store.record_fetch("lsf", state="paused")

    def test_record_fetch_for_a_deleted_library_is_quiet(self) -> None:
        store.record_fetch("gone", state="failed", error="x")

    def test_delete(self) -> None:
        store.create(LSF, updated_by="")
        store.delete("lsf")
        self.assertEqual(store.list_all(), [])
        with self.assertRaises(NotFound):
            store.delete("lsf")
        with self.assertRaises(NotFound):
            store.get("lsf")

    def test_writes_forget_the_resolvers_rows(self) -> None:
        with patch.object(kicad_libraries, "forget_rows") as forget:
            store.create(LSF, updated_by="")
            store.update("lsf", {"ref": "v2"}, updated_by="")
            store.delete("lsf")
        self.assertEqual(forget.call_count, 3)

    def test_the_table_forbids_both_sources(self) -> None:
        import psycopg

        with self.assertRaises(psycopg.errors.CheckViolation):
            self.scratch.conn.execute(
                "INSERT INTO ws_kicad_libraries (name, variables, git_url, ref, path) VALUES ('x', '[]', 'u', 'r', 'p')"
            )


if __name__ == "__main__":
    unittest.main()
