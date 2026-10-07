"""Exports and harnesses (CONTRACTS_P2 §4, §17)."""

from __future__ import annotations

from typing import Any, Mapping, Optional, Sequence

from psycopg.types.json import Jsonb

from app.services.systems.store_base import (
    MAX_ROWS, MAX_HARNESSES, MAX_HARNESS_ENDS, MAX_WIRES, HARNESS_END_PREFIX, MAX_EXPORTS, ROW_SOURCES, NotFound,
    Conflict, Invalid, new_id, _given_id, _check_link_type, _port_baseline, _nets, Mutation,
)


class HarnessesStore:
    # ------------------------------------------------------------------
    # Exports (CONTRACTS_P2 §4)

    def list_exports(self, system_id: str) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM system_exports WHERE system_id = %s ORDER BY lower(name), id", (system_id,)
        ).fetchall()
        return [dict(row) for row in rows]

    def get_export(self, system_id: str, export_id: str) -> dict:
        row = self.conn.execute(
            "SELECT * FROM system_exports WHERE system_id = %s AND id = %s", (system_id, export_id)
        ).fetchone()
        if row is None:
            raise NotFound("Export not found")
        return dict(row)

    def exported_port(self, system_id: str, instance_id: str, port_key: str) -> Optional[dict]:
        """The export whose target is this port: a board port by portKey, or a child export (re-export)."""
        for export in self.list_exports(system_id):
            if export["target_instance_id"] != instance_id:
                continue
            port = export["target_port"]
            if (port and port["portKey"] == port_key) or export["target_export_id"] == port_key:
                return export
        return None

    def linked_port(self, system_id: str, instance_id: str, port_key: str) -> bool:
        return any(
            link[f"{end}_instance_id"] == instance_id and link[f"{end}_port"]["portKey"] == port_key
            for link in self.list_links(system_id) for end in ("a", "b")
        )

    def _require_free_export_name(self, system_id: str, name: str, *, except_id: str = "") -> str:
        name = name.strip()
        if not name or len(name) > 100:
            raise Invalid("export name must be 1 to 100 characters")
        clash = self.conn.execute(
            "SELECT 1 FROM system_exports WHERE system_id = %s AND lower(name) = lower(%s) AND id <> %s",
            (system_id, name, except_id),
        ).fetchone()
        if clash:
            raise Conflict(f"an export named {name!r} already exists")
        return name

    def create_export(
        self, change: Mutation, *, name: str, description: str, instance_id: str,
        port: Optional[Mapping[str, Any]] = None, child_export_id: Optional[str] = None,
        export_id: Optional[str] = None,
    ) -> dict:
        """One of ``port`` (a board port baseline) or ``child_export_id`` (a re-export)."""
        if (port is None) == (child_export_id is None):
            raise Invalid("an export targets exactly one of a port or a child export")
        count = self.conn.execute(
            "SELECT count(*) AS n FROM system_exports WHERE system_id = %s", (change.system_id,)
        ).fetchone()["n"]
        if count >= MAX_EXPORTS:
            raise Invalid(f"export_limit: at most {MAX_EXPORTS} exports per system")
        instance = self.get_instance(change.system_id, instance_id)
        name = self._require_free_export_name(change.system_id, name)
        baseline = _port_baseline(port) if port is not None else None
        if baseline is not None:
            if instance.get("kind", "board") not in ("board", "module"):
                raise Invalid("a port export needs a board or module instance")
            if self.linked_port(change.system_id, instance_id, baseline["portKey"]):
                raise Conflict("export_port_linked: this port is an end of a link in this system")
            if self.exported_port(change.system_id, instance_id, baseline["portKey"]):
                raise Conflict("this port is already exported")
        else:
            if instance.get("kind", "board") != "assembly":
                raise Invalid("a re-export needs an assembly instance")
            if self.linked_port(change.system_id, instance_id, child_export_id):
                raise Conflict("export_port_linked: this subsystem export is an end of a link in this system")
            if self.exported_port(change.system_id, instance_id, child_export_id):
                raise Conflict("this subsystem export is already re-exported")
        export_id = _given_id("sxp_", export_id)
        self.conn.execute(
            """
            INSERT INTO system_exports
                (id, system_id, name, description, target_instance_id, target_port, target_export_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (export_id, change.system_id, name, description or "", instance_id,
             Jsonb(baseline) if baseline is not None else None, child_export_id),
        )
        change.audit("export_created", {
            "exportId": export_id, "name": name, "instanceId": instance_id,
            "portKey": baseline["portKey"] if baseline else None, "childExportId": child_export_id,
        })
        return self.get_export(change.system_id, export_id)

    def update_export(
        self, change: Mutation, export_id: str, *, name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> dict:
        before = self.get_export(change.system_id, export_id)
        values = {
            "name": before["name"] if name is None else self._require_free_export_name(
                change.system_id, name, except_id=export_id),
            "description": before["description"] if description is None else description,
        }
        self.conn.execute(
            "UPDATE system_exports SET name = %s, description = %s, updated_at = NOW() WHERE id = %s",
            (values["name"], values["description"], export_id),
        )
        changed = {k: {"before": before[k], "after": v} for k, v in values.items() if before[k] != v}
        if changed:
            change.audit("export_updated", {"exportId": export_id, **changed})
        return self.get_export(change.system_id, export_id)

    def retarget_export(
        self, change: Mutation, export_id: str, *, instance_id: str, port: Mapping[str, Any],
    ) -> dict:
        """Point an export at another board port; its ID never changes (§4.1)."""
        before = self.get_export(change.system_id, export_id)
        baseline = _port_baseline(port)
        instance = self.get_instance(change.system_id, instance_id)
        if instance.get("kind", "board") not in ("board", "module"):
            raise Invalid("a port export needs a board or module instance")
        if self.linked_port(change.system_id, instance_id, baseline["portKey"]):
            raise Conflict("export_port_linked: this port is an end of a link in this system")
        other = self.exported_port(change.system_id, instance_id, baseline["portKey"])
        if other and other["id"] != export_id:
            raise Conflict("this port is already exported")
        self.conn.execute(
            """
            UPDATE system_exports
            SET target_instance_id = %s, target_port = %s, target_export_id = NULL, updated_at = NOW()
            WHERE id = %s
            """,
            (instance_id, Jsonb(baseline), export_id),
        )
        change.audit("export_retargeted", {
            "exportId": export_id,
            "before": {"instanceId": before["target_instance_id"],
                       "portKey": (before["target_port"] or {}).get("portKey"),
                       "childExportId": before["target_export_id"]},
            "after": {"instanceId": instance_id, "portKey": baseline["portKey"]},
        })
        return self.get_export(change.system_id, export_id)

    def set_export_port(self, change: Mutation, export_id: str, port: Mapping[str, Any]) -> None:
        """Refresh an export's port baseline after a silent relabel or rebind (no audit of its own)."""
        self.conn.execute(
            "UPDATE system_exports SET target_port = %s, updated_at = NOW() WHERE id = %s",
            (Jsonb(_port_baseline(port)), export_id),
        )

    def delete_export(self, change: Mutation, export_id: str) -> None:
        export = self.get_export(change.system_id, export_id)
        self.conn.execute("DELETE FROM system_exports WHERE id = %s", (export_id,))
        change.audit("export_deleted", {"exportId": export_id, "name": export["name"],
                                        "instanceId": export["target_instance_id"]})

    def update_link(
        self, change: Mutation, link_id: str, *, name: Optional[str] = None, harness: Any = ...,
        link_type: Optional[str] = None, stack_height_mm: Any = ...,
    ) -> dict:
        before = self.get_link(change.system_id, link_id)
        values = {
            "name": before["name"] if name is None else name,
            "harness": before["harness"] if harness is ... else (harness or None),
        }
        new_type = before["type"] if link_type is None else link_type
        stack = before["stack_height_mm"] if stack_height_mm is ... else stack_height_mm
        if new_type != "b2b" and stack_height_mm is ...:
            stack = None  # leaving b2b drops the pair's stack height (§16.2)
        _check_link_type(new_type, stack)
        if new_type == "b2b" and before["type"] != "b2b":
            self._check_b2b_ports(change.system_id, link_id, ((before["a_instance_id"], before["a_port"]["portKey"]),
                                                              (before["b_instance_id"], before["b_port"]["portKey"])))
        self.conn.execute(
            "UPDATE system_links SET name = %s, harness = %s, type = %s, stack_height_mm = %s, updated_at = NOW()"
            " WHERE id = %s",
            (values["name"], values["harness"], new_type, stack, link_id),
        )
        changed = {k: {"before": before[k], "after": v} for k, v in values.items() if before[k] != v}
        if before["stack_height_mm"] != stack:
            changed["stackHeightMm"] = {"before": before["stack_height_mm"], "after": stack}
        if changed:
            change.audit("link_updated", {"linkId": link_id, **changed})
        if before["type"] != new_type:
            change.audit("link_type_changed", {"linkId": link_id, "before": before["type"], "after": new_type})
        return self.get_link(change.system_id, link_id)

    def _check_b2b_ports(self, system_id: str, link_id: str, ends: Sequence[tuple[str, str]]) -> None:
        """§16.2 [T6]: a port is in at most one ``b2b`` link."""
        for instance_id, port_key in ends:
            clash = self.conn.execute(
                """
                SELECT id FROM system_links
                WHERE system_id = %s AND type = 'b2b' AND id <> %s
                  AND ((a_instance_id = %s AND a_port->>'portKey' = %s) OR (b_instance_id = %s AND b_port->>'portKey' = %s))
                LIMIT 1
                """,
                (system_id, link_id, instance_id, port_key, instance_id, port_key),
            ).fetchone()
            if clash is not None:
                raise Conflict("port_already_mated: this connector already mates in another board-to-board link")
            if self.harness_end_on_port(system_id, instance_id, port_key) is not None:
                raise Conflict("port_already_mated: a harness end mates this connector")

    def set_link_port(
        self, change: Mutation, link_id: str, end: str, port: Mapping[str, Any]
    ) -> None:
        """Replace one end's port baseline (silent relabel, rebind, accepted change)."""
        if end not in ("a", "b"):
            raise Invalid("end must be 'a' or 'b'")
        if link_id.startswith(HARNESS_END_PREFIX):  # a harness end's mate (CONTRACTS_P2 §17.2 drift)
            self._end_as_link(change.system_id, link_id)
            self.conn.execute("UPDATE system_harness_ends SET mates_port = %s WHERE id = %s",
                              (Jsonb(_port_baseline(port)), link_id))
            return
        self.get_link(change.system_id, link_id)
        self.conn.execute(
            f"UPDATE system_links SET {end}_port = %s, updated_at = NOW() WHERE id = %s",
            (Jsonb(_port_baseline(port)), link_id),
        )

    def delete_link(self, change: Mutation, link_id: str) -> None:
        link = self.get_link(change.system_id, link_id)
        self.conn.execute("DELETE FROM system_links WHERE id = %s", (link_id,))
        change.audit(
            "link_deleted", {"linkId": link_id, "name": link["name"], "rowCount": len(link["rows"])}
        )

    def replace_rows(
        self, change: Mutation, link_id: str, rows: Sequence[Mapping[str, Any]],
        *, keep_new_ids: bool = False,
    ) -> list[dict]:
        """§8.1 ``PUT …/rows``: replace a link's rows atomically.

        Each row carries ``pinA``, ``pinB``, ``signal``, ``source`` and the net
        baselines ``netA``/``netB`` the caller captured from the current
        observation. A row with an ``id`` of this link keeps that id.
        """

        link = self.get_link(change.system_id, link_id)
        previous = {row["id"]: row for row in link["rows"]}
        existing = set(previous)
        seen: set[tuple[str, str]] = set()
        ids: set[str] = set()
        normalized = []
        for row in rows:
            pin_a, pin_b = str(row.get("pinA") or ""), str(row.get("pinB") or "")
            if not pin_a or not pin_b:
                raise Invalid("every row needs pinA and pinB")
            if (pin_a, pin_b) in seen:
                raise Invalid(f"duplicate row {pin_a} ↔ {pin_b}")
            seen.add((pin_a, pin_b))
            source = str(row.get("source") or "manual")
            if source not in ROW_SOURCES:
                raise Invalid(f"unknown row source {source!r}")
            row_id = row.get("id")
            if row_id is not None and row_id not in existing:
                if not keep_new_ids:
                    raise Conflict(f"row {row_id} does not belong to this link")
                _given_id("srw_", row_id)  # manifest import: a new row keeps its ID
            if row_id is not None and row_id in ids:
                raise Invalid(f"row {row_id} appears twice")
            if row_id is not None:
                ids.add(row_id)
            normalized.append(
                (row_id or new_id("srw_"), pin_a, pin_b, str(row.get("signal") or ""),
                 _nets(row.get("netA") or []), _nets(row.get("netB") or []), source)
            )
        other_rows = self.conn.execute(
            """
            SELECT count(*) AS n FROM system_link_rows r JOIN system_links l ON l.id = r.link_id
            WHERE l.system_id = %s AND r.link_id <> %s
            """,
            (change.system_id, link_id),
        ).fetchone()["n"]
        if other_rows + len(normalized) > MAX_ROWS:
            raise Invalid(f"limit rows_per_system ({MAX_ROWS})")
        self.conn.execute("DELETE FROM system_link_rows WHERE link_id = %s", (link_id,))
        for row_id, pin_a, pin_b, signal, net_a, net_b, source in normalized:
            self.conn.execute(
                """
                INSERT INTO system_link_rows (id, link_id, pin_a, pin_b, signal, net_a, net_b, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (row_id, link_id, pin_a, pin_b, signal, Jsonb(net_a), Jsonb(net_b), source),
            )
        kept = {row[0] for row in normalized}

        def described(pin_a: str, pin_b: str, signal: str, net_a: list, net_b: list) -> dict:
            return {"pinA": pin_a, "pinB": pin_b, "signal": signal, "netA": net_a, "netB": net_b}

        after = {row[0]: described(*row[1:6]) for row in normalized}
        before = {rid: described(r["pin_a"], r["pin_b"], r["signal"], list(r["net_a"]), list(r["net_b"]))
                  for rid, r in previous.items()}
        change.audit(
            "rows_replaced",
            {"linkId": link_id, "rowCount": len(normalized),
             "added": sorted(kept - existing), "removed": sorted(existing - kept),
             # What each row was and became, so history explains the engineering change.
             "rows": {
                 "added": [{"id": rid, **after[rid]} for rid in sorted(kept - existing)],
                 "removed": [{"id": rid, **before[rid]} for rid in sorted(existing - kept)],
                 "changed": [{"id": rid, "before": before[rid], "after": after[rid]}
                             for rid in sorted(kept & existing) if before[rid] != after[rid]],
             }},
        )
        return self.get_link(change.system_id, link_id)["rows"]

    # ------------------------------------------------------------------
    # Harnesses (CONTRACTS_P2 §17)

    def list_harnesses(self, system_id: str) -> list[dict]:
        harnesses = [dict(r) for r in self.conn.execute(
            "SELECT * FROM system_harnesses WHERE system_id = %s ORDER BY lower(name), id", (system_id,)).fetchall()]
        if not harnesses:
            return []
        ids = [h["id"] for h in harnesses]
        ends: dict[str, list[dict]] = {}
        for row in self.conn.execute(
                "SELECT * FROM system_harness_ends WHERE harness_id = ANY(%s) ORDER BY harness_id, ordinal",
                (ids,)).fetchall():
            ends.setdefault(row["harness_id"], []).append(dict(row))
        wires: dict[str, list[dict]] = {}
        for row in self.conn.execute(
                "SELECT * FROM system_harness_wires WHERE harness_id = ANY(%s) ORDER BY harness_id, id",
                (ids,)).fetchall():
            wires.setdefault(row["harness_id"], []).append(dict(row))
        for harness in harnesses:
            harness["ends"] = ends.get(harness["id"], [])
            harness["wires"] = wires.get(harness["id"], [])
        return harnesses

    def get_harness(self, system_id: str, harness_id: str) -> dict:
        found = next((h for h in self.list_harnesses(system_id) if h["id"] == harness_id), None)
        if found is None:
            raise NotFound("Harness not found")
        return found

    def create_harness(
        self, change: Mutation, *, name: str, label: Optional[str] = None, harness_id: Optional[str] = None,
        cut_length_mm: Optional[float] = None, service_allowance_pct: Optional[float] = None,
        audit: Optional[Mapping[str, Any]] = None,
    ) -> dict:
        if not name.strip():
            raise Invalid("name is required")
        count = self.conn.execute("SELECT count(*) AS n FROM system_harnesses WHERE system_id = %s",
                                  (change.system_id,)).fetchone()["n"]
        if count >= MAX_HARNESSES:
            raise Invalid(f"limit harnesses_per_system ({MAX_HARNESSES})")
        harness_id = _given_id("shn_", harness_id)
        self.conn.execute(
            "INSERT INTO system_harnesses (id, system_id, name, label, cut_length_mm, service_allowance_pct)"
            " VALUES (%s, %s, %s, %s, %s, %s)",
            (harness_id, change.system_id, name.strip(), label or None, cut_length_mm, service_allowance_pct),
        )
        change.audit("harness_created", {"harnessId": harness_id, "name": name.strip(), **dict(audit or {})})
        return self.get_harness(change.system_id, harness_id)

    def update_harness(self, change: Mutation, harness_id: str, fields: Mapping[str, Any]) -> dict:
        before = self.get_harness(change.system_id, harness_id)
        columns = {"name": "name", "label": "label", "cutLengthMm": "cut_length_mm",
                   "serviceAllowancePct": "service_allowance_pct"}
        values = {column: before[column] for column in columns.values()}
        for key, column in columns.items():
            if key in fields:
                values[column] = fields[key]
        if not str(values["name"] or "").strip():
            raise Invalid("name is required")
        values["name"] = values["name"].strip()
        values["label"] = values["label"] or None
        self.conn.execute(
            "UPDATE system_harnesses SET name = %s, label = %s, cut_length_mm = %s, service_allowance_pct = %s,"
            " updated_at = NOW() WHERE id = %s",
            (values["name"], values["label"], values["cut_length_mm"], values["service_allowance_pct"], harness_id),
        )
        changed = {k: {"before": before[k], "after": v} for k, v in values.items() if before[k] != v}
        if changed:
            change.audit("harness_updated", {"harnessId": harness_id, **changed})
        return self.get_harness(change.system_id, harness_id)

    def delete_harness(self, change: Mutation, harness_id: str) -> None:
        harness = self.get_harness(change.system_id, harness_id)
        self.conn.execute("DELETE FROM system_harnesses WHERE id = %s", (harness_id,))
        change.audit("harness_deleted", {"harnessId": harness_id, "name": harness["name"],
                                         "ends": len(harness["ends"]), "wires": len(harness["wires"])})

    def harness_end_on_port(self, system_id: str, instance_id: str, port_key: str,
                            exclude_end: Optional[str] = None) -> Optional[str]:
        row = self.conn.execute(
            """
            SELECT e.id FROM system_harness_ends e JOIN system_harnesses h ON h.id = e.harness_id
            WHERE h.system_id = %s AND e.mates_instance_id = %s AND e.mates_port->>'portKey' = %s AND e.id <> %s
            LIMIT 1
            """,
            (system_id, instance_id, port_key, exclude_end or ""),
        ).fetchone()
        return row["id"] if row else None

    def _check_end_mate(self, system_id: str, end_id: str, instance_id: str, port_key: str) -> None:
        """§17.2 [T6]: a port is mated by one harness end, and then by no b2b link."""
        self.get_instance(system_id, instance_id)
        if self.harness_end_on_port(system_id, instance_id, port_key, exclude_end=end_id):
            raise Conflict("port_already_mated: another harness end mates this connector")
        b2b = self.conn.execute(
            """
            SELECT 1 FROM system_links WHERE system_id = %s AND type = 'b2b'
              AND ((a_instance_id = %s AND a_port->>'portKey' = %s) OR (b_instance_id = %s AND b_port->>'portKey' = %s))
            LIMIT 1
            """,
            (system_id, instance_id, port_key, instance_id, port_key),
        ).fetchone()
        if b2b is not None:
            raise Conflict("port_already_mated: a board-to-board link mates this connector")
        if self.exported_port(system_id, instance_id, port_key):
            raise Conflict("export_port_linked: this port is exported; delete or retarget the export first")

    def add_harness_end(
        self, change: Mutation, harness_id: str, *, mates_instance_id: Optional[str] = None,
        mates_port: Optional[Mapping[str, Any]] = None, pin_count: int, end_id: Optional[str] = None,
        pin_map: Optional[Mapping[str, str]] = None, boot_mm: Optional[float] = None,
        catalog_component_id: Optional[str] = None, catalog_revision_id: Optional[str] = None,
        ordinal: Optional[int] = None, part_pins: Optional[Sequence[str]] = None,
        part_summary: Optional[Mapping[str, Any]] = None,
    ) -> dict:
        harness = self.get_harness(change.system_id, harness_id)
        if len(harness["ends"]) >= MAX_HARNESS_ENDS:
            raise Invalid(f"a harness has at most {MAX_HARNESS_ENDS} ends")
        end_id = _given_id(HARNESS_END_PREFIX, end_id)
        baseline = _port_baseline(mates_port) if mates_port else None
        if (mates_instance_id is None) != (baseline is None):
            raise Invalid("an end mates an instance and a port, or nothing")
        if baseline is not None:
            self._check_end_mate(change.system_id, end_id, mates_instance_id, baseline["portKey"])
        if ordinal is None:
            ordinal = max((e["ordinal"] for e in harness["ends"]), default=-1) + 1
        self.conn.execute(
            """
            INSERT INTO system_harness_ends (id, harness_id, ordinal, mates_instance_id, mates_port,
                catalog_component_id, catalog_revision_id, pin_count, pin_map, boot_mm, part_pins, part_summary)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (end_id, harness_id, ordinal, mates_instance_id, Jsonb(baseline) if baseline else None,
             catalog_component_id, catalog_revision_id, int(pin_count),
             Jsonb(dict(pin_map)) if pin_map else None, boot_mm,
             Jsonb(list(part_pins)) if part_pins is not None else None,
             Jsonb(dict(part_summary)) if part_summary is not None else None),
        )
        change.audit("harness_updated", {"harnessId": harness_id, "endAdded": end_id,
                                         "mates": {"instanceId": mates_instance_id,
                                                   "portKey": baseline["portKey"]} if baseline else None})
        return self.get_harness(change.system_id, harness_id)

    def update_harness_end(self, change: Mutation, harness_id: str, end_id: str, fields: Mapping[str, Any]) -> dict:
        harness = self.get_harness(change.system_id, harness_id)
        before = next((e for e in harness["ends"] if e["id"] == end_id), None)
        if before is None:
            raise NotFound("Harness end not found")
        values = {k: before[k] for k in ("mates_instance_id", "mates_port", "catalog_component_id",
                                          "catalog_revision_id", "pin_count", "pin_map", "boot_mm", "part_pins",
                                          "part_summary")}
        if "mates" in fields:
            mates = fields["mates"]
            if mates is None:
                values["mates_instance_id"], values["mates_port"] = None, None
            else:
                baseline = _port_baseline(mates["port"])
                self._check_end_mate(change.system_id, end_id, mates["instanceId"], baseline["portKey"])
                values["mates_instance_id"], values["mates_port"] = mates["instanceId"], baseline
        for key, column in (("pinCount", "pin_count"), ("pinMap", "pin_map"), ("bootMm", "boot_mm"),
                            ("catalogComponentId", "catalog_component_id"),
                            ("catalogRevisionId", "catalog_revision_id"), ("partPins", "part_pins"),
                            ("partSummary", "part_summary")):
            if key in fields:
                values[column] = fields[key]
        if values["pin_map"] is not None:
            mapped = list(values["pin_map"].values())
            if len(set(mapped)) != len(mapped):
                raise Invalid("each connector pad is mapped at most once")
            values["pin_map"] = dict(values["pin_map"]) or None
        self.conn.execute(
            """
            UPDATE system_harness_ends SET mates_instance_id = %s, mates_port = %s, catalog_component_id = %s,
                catalog_revision_id = %s, pin_count = %s, pin_map = %s, boot_mm = %s, part_pins = %s,
                part_summary = %s WHERE id = %s
            """,
            (values["mates_instance_id"], Jsonb(values["mates_port"]) if values["mates_port"] else None,
             values["catalog_component_id"], values["catalog_revision_id"], int(values["pin_count"]),
             Jsonb(values["pin_map"]) if values["pin_map"] else None, values["boot_mm"],
             Jsonb(list(values["part_pins"])) if values["part_pins"] is not None else None,
             Jsonb(dict(values["part_summary"])) if values["part_summary"] is not None else None, end_id),
        )
        changed = {k: {"before": before[k], "after": v} for k, v in values.items() if before[k] != v}
        if changed:
            change.audit("harness_updated", {"harnessId": harness_id, "endId": end_id, **changed})
        return self.get_harness(change.system_id, harness_id)

    def delete_harness_end(self, change: Mutation, harness_id: str, end_id: str) -> dict:
        harness = self.get_harness(change.system_id, harness_id)
        if not any(e["id"] == end_id for e in harness["ends"]):
            raise NotFound("Harness end not found")
        if len(harness["ends"]) == 1:
            raise Invalid("a harness keeps at least one end; delete the harness instead")
        wires = [w["id"] for w in harness["wires"] if end_id in (w["from_end"], w["to_end"])]
        self.conn.execute("DELETE FROM system_harness_ends WHERE id = %s", (end_id,))
        change.audit("harness_updated", {"harnessId": harness_id, "endRemoved": end_id, "wiresRemoved": wires})
        return self.get_harness(change.system_id, harness_id)

    def replace_wires(self, change: Mutation, harness_id: str, wires: Sequence[Mapping[str, Any]],
                      *, keep_new_ids: bool = False) -> list[dict]:
        """Replace a harness's wire list. Callers capture ``netFrom``/``netTo`` (§17.2); a splice is allowed."""
        harness = self.get_harness(change.system_id, harness_id)
        ends = {e["id"] for e in harness["ends"]}
        existing = {w["id"] for w in harness["wires"]}
        ids: set[str] = set()
        normalized = []
        for wire in wires:
            source, target = wire.get("from") or {}, wire.get("to") or {}
            if source.get("end") not in ends or target.get("end") not in ends:
                raise Invalid("every wire joins two ends of this harness")
            if source["end"] == target["end"]:
                raise Invalid("a wire joins two different ends")
            if not str(source.get("pin") or "") or not str(target.get("pin") or ""):
                raise Invalid("every wire needs a pin at both ends")
            wire_id = wire.get("id")
            if wire_id is not None and wire_id not in existing:
                if not keep_new_ids:
                    raise Conflict(f"wire {wire_id} does not belong to this harness")
                _given_id("shw_", wire_id)
            if wire_id is not None and wire_id in ids:
                raise Invalid(f"wire {wire_id} appears twice")
            wire_id = wire_id or new_id("shw_")
            ids.add(wire_id)
            gauge = wire.get("gaugeAwg")
            if gauge is not None and not (isinstance(gauge, int) and 0 <= gauge <= 40):
                raise Invalid("gaugeAwg must be 0 to 40")
            normalized.append((wire_id, source["end"], str(source["pin"]), target["end"], str(target["pin"]),
                               str(wire.get("signal") or ""), gauge, wire.get("colour") or None,
                               wire.get("label") or None, _nets(wire.get("netFrom") or []),
                               _nets(wire.get("netTo") or [])))
        total = self.conn.execute(
            "SELECT count(*) AS n FROM system_harness_wires w JOIN system_harnesses h ON h.id = w.harness_id"
            " WHERE h.system_id = %s AND w.harness_id <> %s", (change.system_id, harness_id)).fetchone()["n"]
        if total + len(normalized) > MAX_WIRES:
            raise Invalid(f"limit wires_per_system ({MAX_WIRES})")
        self.conn.execute("DELETE FROM system_harness_wires WHERE harness_id = %s", (harness_id,))
        for row in normalized:
            self.conn.execute(
                """
                INSERT INTO system_harness_wires (id, harness_id, from_end, from_pin, to_end, to_pin, signal,
                    gauge_awg, colour, label, net_from, net_to)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (row[0], harness_id, *row[1:9], Jsonb(row[9]), Jsonb(row[10])),
            )
        kept = {row[0] for row in normalized}
        change.audit("harness_updated", {"harnessId": harness_id, "wireCount": len(normalized),
                                         "wiresAdded": sorted(kept - existing),
                                         "wiresRemoved": sorted(existing - kept)})
        return self.get_harness(change.system_id, harness_id)["wires"]

    # Harness ends seen by the drift engine and review plumbing as link ends (§17.2 drift).

    @staticmethod
    def end_pad(end: Mapping[str, Any], pin: str) -> str:
        """The mated connector pad an end pin maps to (``pinMap`` null = identity)."""
        return str((end.get("pin_map") or {}).get(pin, pin))

    def _end_link(self, harness: Mapping[str, Any], end: Mapping[str, Any]) -> dict:
        rows = []
        for wire in harness["wires"]:
            for side in ("from", "to"):
                if wire[f"{side}_end"] == end["id"]:
                    rows.append({"id": wire["id"], "pin_a": self.end_pad(end, wire[f"{side}_pin"]), "pin_b": "",
                                 "net_a": list(wire[f"net_{side}"]), "net_b": [], "signal": wire["signal"],
                                 "source": "manual"})
        return {"id": end["id"], "system_id": harness["system_id"], "name": f"{harness['name']} end {end['ordinal'] + 1}",
                "harness": harness["label"], "type": "harness_end", "stack_height_mm": None,
                "a_instance_id": end["mates_instance_id"], "a_port": end["mates_port"],
                "b_instance_id": None, "b_port": None, "rows": rows, "updated_at": harness["updated_at"]}

    def _end_as_link(self, system_id: str, end_id: str) -> dict:
        for harness in self.list_harnesses(system_id):
            for end in harness["ends"]:
                if end["id"] == end_id:
                    return self._end_link(harness, end)
        raise NotFound(end_id)

    def drift_links(self, system_id: str) -> list[dict]:
        """Links plus one link-shaped view per mated harness end, for drift and reviews only."""
        views = [self._end_link(harness, end) for harness in self.list_harnesses(system_id)
                 for end in harness["ends"] if end["mates_instance_id"] and end["mates_port"]]
        return self.list_links(system_id) + views

    def _update_wire_end(self, end_id: str, wire_id: str, *, pin: Optional[str], nets: Sequence[str]) -> None:
        """Accept (nets) or remap (``pin`` = the new connector pad, via the end's pin map) on one wire."""
        wire = self.conn.execute("SELECT * FROM system_harness_wires WHERE id = %s", (wire_id,)).fetchone()
        if wire is None:
            return
        side = "from" if wire["from_end"] == end_id else "to"
        if pin is not None:
            end = self.conn.execute("SELECT pin_map FROM system_harness_ends WHERE id = %s", (end_id,)).fetchone()
            pin_map = dict(end["pin_map"] or {})
            end_pin = wire[f"{side}_pin"]
            if pin == end_pin:
                pin_map.pop(end_pin, None)
            else:
                pin_map[end_pin] = pin
            if len(set(pin_map.values())) != len(pin_map):
                raise Conflict("the remapped pin would map two end pins to one pad")
            self.conn.execute("UPDATE system_harness_ends SET pin_map = %s WHERE id = %s",
                              (Jsonb(pin_map) if pin_map else None, end_id))
        self.conn.execute(f"UPDATE system_harness_wires SET net_{side} = %s WHERE id = %s",
                          (Jsonb(_nets(nets)), wire_id))
