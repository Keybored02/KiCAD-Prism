"""Workspace schema migration 26: System Builder.

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.

Shapes follow ``docs/system-builder/CONTRACTS.md`` §5.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """Create the System Builder tables.

    A system is not a ``ws_projects`` row: that table requires a repository and
    many paths assume one (plan decision D8). Systems share ``ws_folders`` for
    placement and visibility instead.

    Children are referenced by ``project_id`` without a foreign key on purpose:
    deleting a child project must leave the instance, its baselines, links and
    snapshots in place as ``unresolved`` (§5.1). Every other reference is a
    same-system composite key, so a link or review can never point at an
    instance of another system.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_projects (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL CHECK (btrim(name) <> ''),
            description TEXT NOT NULL DEFAULT '',
            folder_id   TEXT REFERENCES ws_folders(id) ON DELETE SET NULL,
            version     BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
            created_by  TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_system_projects_folder ON system_projects(folder_id);

        CREATE TABLE IF NOT EXISTS system_instances (
            id              TEXT PRIMARY KEY,
            system_id       TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            project_id      TEXT NOT NULL,
            label           TEXT NOT NULL CHECK (btrim(label) <> ''),
            baseline_commit TEXT NOT NULL CHECK (baseline_commit ~ '^[0-9a-f]{40}$'),
            tracked_ref     TEXT,
            pinned          BOOLEAN NOT NULL DEFAULT FALSE,
            resolution      TEXT NOT NULL DEFAULT 'resolved'
                            CHECK (resolution IN ('resolved', 'unresolved')),
            tip_commit      TEXT,
            tip_checked_at  TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT system_instances_system_id_key UNIQUE (system_id, id)
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_system_instances_label
            ON system_instances(system_id, lower(label));
        -- Reverse index: which instances depend on a project (detection).
        CREATE INDEX IF NOT EXISTS idx_system_instances_project ON system_instances(project_id);

        CREATE TABLE IF NOT EXISTS system_port_overrides (
            instance_id TEXT NOT NULL REFERENCES system_instances(id) ON DELETE CASCADE,
            port_key    TEXT NOT NULL,
            state       TEXT NOT NULL CHECK (state IN ('hidden', 'promoted')),
            PRIMARY KEY (instance_id, port_key)
        );

        CREATE TABLE IF NOT EXISTS system_links (
            id            TEXT PRIMARY KEY,
            system_id     TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            name          TEXT NOT NULL DEFAULT '',
            harness       TEXT,
            a_instance_id TEXT NOT NULL,
            a_port        JSONB NOT NULL,
            b_instance_id TEXT NOT NULL,
            b_port        JSONB NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT system_links_a_instance_fkey FOREIGN KEY (system_id, a_instance_id)
                REFERENCES system_instances(system_id, id),
            CONSTRAINT system_links_b_instance_fkey FOREIGN KEY (system_id, b_instance_id)
                REFERENCES system_instances(system_id, id),
            CONSTRAINT system_links_distinct_ports CHECK (
                NOT (a_instance_id = b_instance_id
                     AND a_port->>'portKey' = b_port->>'portKey')
            )
        );
        CREATE INDEX IF NOT EXISTS idx_system_links_system ON system_links(system_id);
        CREATE INDEX IF NOT EXISTS idx_system_links_a ON system_links(a_instance_id);
        CREATE INDEX IF NOT EXISTS idx_system_links_b ON system_links(b_instance_id);

        CREATE TABLE IF NOT EXISTS system_link_rows (
            id         TEXT PRIMARY KEY,
            link_id    TEXT NOT NULL REFERENCES system_links(id) ON DELETE CASCADE,
            pin_a      TEXT NOT NULL CHECK (pin_a <> ''),
            pin_b      TEXT NOT NULL CHECK (pin_b <> ''),
            signal     TEXT NOT NULL DEFAULT '',
            net_a      JSONB NOT NULL DEFAULT '[]'::jsonb,
            net_b      JSONB NOT NULL DEFAULT '[]'::jsonb,
            source     TEXT NOT NULL DEFAULT 'manual'
                       CHECK (source IN ('manual', 'generator', 'import')),
            CONSTRAINT system_link_rows_pins_key UNIQUE (link_id, pin_a, pin_b)
        );

        CREATE TABLE IF NOT EXISTS system_reviews (
            id          TEXT PRIMARY KEY,
            system_id   TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            instance_id TEXT,
            kind        TEXT NOT NULL
                        CHECK (kind IN ('source_update', 'baseline_unreachable', 'import')),
            from_commit TEXT,
            to_commit   TEXT,
            status      TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'applied', 'kept_pinned', 'superseded', 'closed')),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            decided_by  TEXT,
            decided_at  TIMESTAMPTZ,
            CONSTRAINT system_reviews_instance_fkey FOREIGN KEY (system_id, instance_id)
                REFERENCES system_instances(system_id, id) ON DELETE CASCADE,
            CONSTRAINT system_reviews_instance_required CHECK (
                (kind = 'import') = (instance_id IS NULL)
            )
        );
        -- At most one open source review per instance (§6.5 supersedes it).
        CREATE UNIQUE INDEX IF NOT EXISTS uq_system_reviews_open_instance
            ON system_reviews(instance_id)
            WHERE status = 'open' AND kind IN ('source_update', 'baseline_unreachable');
        CREATE INDEX IF NOT EXISTS idx_system_reviews_system ON system_reviews(system_id, status);

        CREATE TABLE IF NOT EXISTS system_review_items (
            id               TEXT PRIMARY KEY,
            review_id        TEXT NOT NULL REFERENCES system_reviews(id) ON DELETE CASCADE,
            ordinal          INTEGER NOT NULL,
            kind             TEXT NOT NULL CHECK (kind IN (
                                 'connector_missing', 'connector_changed', 'pin_missing',
                                 'net_changed', 'signal_mismatch')),
            link_id          TEXT,
            link_end         TEXT CHECK (link_end IN ('a', 'b')),
            row_ids          JSONB NOT NULL DEFAULT '[]'::jsonb,
            expected         JSONB,
            observed         JSONB,
            candidates       JSONB,
            decision         TEXT CHECK (decision IN (
                                 'accept', 'remap', 'bind_candidate', 'remove_rows')),
            decision_payload JSONB,
            CONSTRAINT system_review_items_ordinal_key UNIQUE (review_id, ordinal)
        );

        CREATE TABLE IF NOT EXISTS system_audit_events (
            seq       BIGSERIAL PRIMARY KEY,
            id        TEXT NOT NULL UNIQUE,
            system_id TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            actor     TEXT NOT NULL,
            kind      TEXT NOT NULL,
            payload   JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_system_audit_events_system
            ON system_audit_events(system_id, seq DESC);

        CREATE TABLE IF NOT EXISTS system_snapshots (
            id                TEXT PRIMARY KEY,
            system_id         TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            name              TEXT NOT NULL CHECK (btrim(name) <> ''),
            note              TEXT NOT NULL DEFAULT '',
            created_by        TEXT NOT NULL,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            document          JSONB NOT NULL,
            digest            TEXT NOT NULL,
            open_review_count INTEGER NOT NULL CHECK (open_review_count >= 0),
            renderer_version  TEXT NOT NULL,
            CONSTRAINT system_snapshots_name_key UNIQUE (system_id, name)
        );

        CREATE TABLE IF NOT EXISTS system_layouts (
            system_id  TEXT PRIMARY KEY REFERENCES system_projects(id) ON DELETE CASCADE,
            positions  JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Shared per (project, commit); no FK so artifacts outlive a project.
        CREATE TABLE IF NOT EXISTS system_interface_artifacts (
            project_id        TEXT NOT NULL,
            commit            TEXT NOT NULL CHECK (commit ~ '^[0-9a-f]{40}$'),
            extractor_version TEXT NOT NULL,
            digest            TEXT NOT NULL,
            payload           JSONB NOT NULL,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (project_id, commit, extractor_version)
        );

        CREATE TABLE IF NOT EXISTS system_source_checks (
            instance_id         TEXT PRIMARY KEY REFERENCES system_instances(id) ON DELETE CASCADE,
            last_checked_commit TEXT,
            last_outcome        TEXT NOT NULL,
            checked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
