"""Net rename proposal persistence (SB2-106, CONTRACTS_P2 §23). A mixin of ``store.SystemStore``."""

from __future__ import annotations

from typing import Any, Mapping, Optional, Sequence

from app.services.systems.store_base import Conflict, Mutation, NotFound, new_id


class RenamesStore:
    conn: Any

    def list_renames(self, system_id: str, states: Sequence[str] = ("open",)) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM system_net_renames WHERE system_id = %s AND state = ANY(%s) ORDER BY created_at, id",
            (system_id, list(states)),
        ).fetchall()
        return [dict(row) for row in rows]

    def renames_on(self, instance_ids: Sequence[str], states: Sequence[str] = ("open",)) -> list[dict]:
        if not instance_ids:
            return []
        rows = self.conn.execute(
            "SELECT * FROM system_net_renames WHERE instance_id = ANY(%s) AND state = ANY(%s) ORDER BY created_at, id",
            (list(instance_ids), list(states)),
        ).fetchall()
        return [dict(row) for row in rows]

    def get_rename(self, system_id: str, rename_id: str) -> dict:
        row = self.conn.execute("SELECT * FROM system_net_renames WHERE system_id = %s AND id = %s",
                                (system_id, rename_id)).fetchone()
        if row is None:
            raise NotFound("Rename proposal not found")
        return dict(row)

    def propose_rename(self, change: Mutation, *, instance_id: str, net: str, name: str, note: str) -> dict:
        clash = self.conn.execute(
            "SELECT 1 FROM system_net_renames WHERE instance_id = %s AND net = %s AND state = 'open'",
            (instance_id, net),
        ).fetchone()
        if clash:
            raise Conflict("rename_open: this net already has an open rename proposal")
        rename_id = new_id("snr_")
        self.conn.execute(
            """
            INSERT INTO system_net_renames (id, system_id, instance_id, net, name, note, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (rename_id, change.system_id, instance_id, net, name, note, change.actor),
        )
        change.audit("rename_proposed", {"renameId": rename_id, "instanceId": instance_id, "net": net, "name": name})
        return self.get_rename(change.system_id, rename_id)

    def close_rename(self, change: Mutation, rename_id: str, state: str, *, commit: Optional[str] = None) -> None:
        """``applied`` (by a commit) or ``withdrawn`` (by a designer), audited either way."""
        before = self.get_rename(change.system_id, rename_id)
        if before["state"] != "open":
            raise Conflict(f"rename_closed: this proposal is already {before['state']}")
        self.conn.execute(
            """
            UPDATE system_net_renames SET state = %s, closed_by = %s, closed_at = NOW(), closed_commit = %s
            WHERE id = %s
            """,
            (state, change.actor, commit, rename_id),
        )
        change.audit(f"rename_{state}", {"renameId": rename_id, "instanceId": before["instance_id"],
                                         "net": before["net"], "name": before["name"], "commit": commit})

    def close_applied_renames(self, change: Mutation, instance_id: str, commit: str) -> int:
        """§23.3: after a baseline advance, each open proposal the board's rows now show applied."""
        from app.services.systems import renames

        proposals = self.renames_on([instance_id])
        if not proposals:
            return 0
        links = self.drift_links(change.system_id)
        applied = [p for p in proposals if renames.is_applied(links, instance_id, p)]
        for proposal in applied:
            self.close_rename(change, proposal["id"], "applied", commit=commit)
        return len(applied)

    # ------------------------------------------------------------------
    # The last collision check (SB2-108, P2 §24.2); kept beside the proposals as a small read model.

    def get_collision_check(self, system_id: str) -> Optional[dict]:
        row = self.conn.execute("SELECT * FROM system_collision_checks WHERE system_id = %s", (system_id,)).fetchone()
        return dict(row) if row else None

    def record_collision_check(self, system_id: str, *, scene_key: str, version: int, result: dict,
                               job_id: Optional[str]) -> None:
        """Outside any system mutation, like the finding counts (SB2-101): no lock, no version bump."""
        from psycopg.types.json import Jsonb

        self.conn.execute(
            """
            INSERT INTO system_collision_checks (system_id, scene_key, version, result, job_id, checked_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (system_id) DO UPDATE SET scene_key = EXCLUDED.scene_key, version = EXCLUDED.version,
                result = EXCLUDED.result, job_id = EXCLUDED.job_id, checked_at = EXCLUDED.checked_at
            """,
            (system_id, scene_key, version, Jsonb(result), job_id),
        )

    # ------------------------------------------------------------------
    # The latest STEP export (SB2-109, P2 §25), the same kind of read model.

    def get_step_export(self, system_id: str) -> Optional[dict]:
        row = self.conn.execute("SELECT * FROM system_step_exports WHERE system_id = %s", (system_id,)).fetchone()
        return dict(row) if row else None

    def record_step_export(self, system_id: str, *, version: int, state: str, job_id: Optional[str],
                           path: Optional[str] = None, size_bytes: Optional[int] = None,
                           skipped: Sequence[Mapping[str, Any]] = (), projects: Sequence[str] = (),
                           error: Optional[str] = None) -> None:
        """Outside any system mutation: no lock, no version bump. A new run replaces the last one."""
        from psycopg.types.json import Jsonb

        self.conn.execute(
            """
            INSERT INTO system_step_exports (system_id, version, state, job_id, path, size_bytes, skipped, projects,
                                             error, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (system_id) DO UPDATE SET version = EXCLUDED.version, state = EXCLUDED.state,
                job_id = EXCLUDED.job_id, path = EXCLUDED.path, size_bytes = EXCLUDED.size_bytes,
                skipped = EXCLUDED.skipped, projects = EXCLUDED.projects, error = EXCLUDED.error,
                created_at = CASE WHEN EXCLUDED.state = 'running' THEN NOW() ELSE system_step_exports.created_at END,
                updated_at = NOW()
            """,
            (system_id, version, state, job_id, path, size_bytes, Jsonb(list(skipped)), sorted(set(projects)), error),
        )

