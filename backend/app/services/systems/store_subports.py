"""Sub-port persistence (SB2-105, CONTRACTS_P2 §22). A mixin of ``store.SystemStore``."""

from __future__ import annotations

from typing import Any, Mapping, Optional, Sequence

from psycopg.types.json import Jsonb

from app.services.systems.store_base import Mutation, NotFound, _given_id, _port_baseline


class SubportsStore:
    conn: Any

    def list_subports(self, system_id: str) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM system_subports WHERE system_id = %s ORDER BY instance_id, port_key, lower(name)",
            (system_id,),
        ).fetchall()
        return [dict(row) for row in rows]

    def get_subport(self, system_id: str, subport_id: str) -> dict:
        row = self.conn.execute(
            "SELECT * FROM system_subports WHERE system_id = %s AND id = %s", (system_id, subport_id)
        ).fetchone()
        if row is None:
            raise NotFound("Sub-port not found")
        return dict(row)

    def create_subport(self, change: Mutation, *, instance_id: str, port: Mapping[str, Any], name: str,
                       pads: Sequence[str], subport_id: Optional[str] = None) -> dict:
        baseline = _port_baseline(port)
        subport_id = _given_id("spt_", subport_id)
        self.conn.execute(
            """
            INSERT INTO system_subports (id, system_id, instance_id, port_key, port, name, pads, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (subport_id, change.system_id, instance_id, baseline["portKey"], Jsonb(baseline), name,
             Jsonb(list(pads)), change.actor),
        )
        return self.get_subport(change.system_id, subport_id)

    def update_subport(self, change: Mutation, subport_id: str, *, name: str, pads: Sequence[str]) -> dict:
        self.get_subport(change.system_id, subport_id)
        self.conn.execute("UPDATE system_subports SET name = %s, pads = %s WHERE id = %s",
                          (name, Jsonb(list(pads)), subport_id))
        return self.get_subport(change.system_id, subport_id)

    def delete_subport(self, change: Mutation, subport_id: str) -> None:
        self.get_subport(change.system_id, subport_id)
        self.conn.execute("DELETE FROM system_subports WHERE id = %s", (subport_id,))

    def follow_connector(self, instance_id: str, before: Mapping[str, Any], after: Mapping[str, Any]) -> None:
        """§22.4: the sub-ports on the connector ``before`` names follow it to ``after`` (relabel,
        rebind, accepted connector change)."""
        baseline = _port_baseline(after)
        self.conn.execute(
            "UPDATE system_subports SET port_key = %s, port = %s WHERE instance_id = %s AND port_key = %s",
            (baseline["portKey"], Jsonb(baseline), instance_id, before["portKey"]),
        )

    def set_link_subport(self, change: Mutation, link_id: str, end: str, subport_id: Optional[str]) -> None:
        if end not in ("a", "b"):
            raise ValueError(end)
        self.conn.execute(
            f"UPDATE system_links SET {end}_subport_id = %s, updated_at = NOW() WHERE id = %s AND system_id = %s",
            (subport_id, link_id, change.system_id),
        )

    def move_rows(self, change: Mutation, row_ids: Sequence[str], to_link_id: str) -> None:
        """Rows keep their IDs, pins and net baselines; only their link changes (§22.3)."""
        if row_ids:
            self.conn.execute("UPDATE system_link_rows SET link_id = %s WHERE id = ANY(%s)",
                              (to_link_id, list(row_ids)))
            self.conn.execute("UPDATE system_links SET updated_at = NOW() WHERE id = %s", (to_link_id,))
