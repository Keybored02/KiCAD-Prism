"""Workspace schema migration 38: harness objects (CONTRACTS_P2 §17.1).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A harness has ends (each mating one port, or nothing) and wires between end pins.

    Breakouts and waypoints (``system_harness_nodes``) arrive with harness geometry in M5.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_harnesses (
            id                    TEXT PRIMARY KEY,
            system_id             TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            name                  TEXT NOT NULL CHECK (btrim(name) <> ''),
            label                 TEXT,
            cut_length_mm         DOUBLE PRECISION CHECK (cut_length_mm IS NULL OR cut_length_mm > 0),
            service_allowance_pct DOUBLE PRECISION
                CHECK (service_allowance_pct IS NULL OR service_allowance_pct BETWEEN 0 AND 100),
            created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_system_harnesses_system ON system_harnesses(system_id);

        CREATE TABLE IF NOT EXISTS system_harness_ends (
            id                   TEXT PRIMARY KEY,
            harness_id           TEXT NOT NULL REFERENCES system_harnesses(id) ON DELETE CASCADE,
            ordinal              INTEGER NOT NULL CHECK (ordinal >= 0),
            mates_instance_id    TEXT REFERENCES system_instances(id) ON DELETE SET NULL,
            mates_port           JSONB,
            catalog_component_id TEXT,
            catalog_revision_id  TEXT,
            pin_count            INTEGER NOT NULL CHECK (pin_count >= 1),
            pin_map              JSONB,
            boot_mm              DOUBLE PRECISION CHECK (boot_mm IS NULL OR boot_mm >= 0),
            CONSTRAINT system_harness_ends_ordinal_key UNIQUE (harness_id, ordinal)
        );
        CREATE INDEX IF NOT EXISTS idx_system_harness_ends_mates ON system_harness_ends(mates_instance_id);

        CREATE TABLE IF NOT EXISTS system_harness_wires (
            id         TEXT PRIMARY KEY,
            harness_id TEXT NOT NULL REFERENCES system_harnesses(id) ON DELETE CASCADE,
            from_end   TEXT NOT NULL REFERENCES system_harness_ends(id) ON DELETE CASCADE,
            from_pin   TEXT NOT NULL CHECK (from_pin <> ''),
            to_end     TEXT NOT NULL REFERENCES system_harness_ends(id) ON DELETE CASCADE,
            to_pin     TEXT NOT NULL CHECK (to_pin <> ''),
            signal     TEXT NOT NULL DEFAULT '',
            gauge_awg  INTEGER CHECK (gauge_awg IS NULL OR gauge_awg BETWEEN 0 AND 40),
            colour     TEXT,
            label      TEXT,
            net_from   JSONB NOT NULL DEFAULT '[]'::jsonb,
            net_to     JSONB NOT NULL DEFAULT '[]'::jsonb,
            CHECK (from_end <> to_end)
        );
        CREATE INDEX IF NOT EXISTS idx_system_harness_wires_harness ON system_harness_wires(harness_id);
        """
    )
