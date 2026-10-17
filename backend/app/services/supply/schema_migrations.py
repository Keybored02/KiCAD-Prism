"""Versioned, additive migrations for the ``supply`` schema.

Supply keeps its own ledger so its numbers cannot collide with the workspace
or catalog ledgers when branches merge. ``SupplyStore.initialize()`` applies
these in order under the schema advisory lock and records each one. Every step
must be safe to apply twice.

Table names are unqualified; the caller has set the search path to the supply
schema (or a disposable test schema).
"""

from __future__ import annotations

import logging
from typing import Callable, List, Tuple

logger = logging.getLogger(__name__)

LEDGER_TABLE = "supply_schema_migrations"


def _m001_connectors_quota_audit(conn) -> None:
    """Distributor connectors, the daily call ledger, and the audit trail.

    ``credential_envelope`` is the encrypted credential set; ``credential_names``
    lists which credentials are set so the UI can show that without decrypting.
    ``UNIQUE (provider, storefront)`` is the one-connector-per-storefront rule.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS connectors (
            id TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            storefront TEXT NOT NULL DEFAULT '',
            display_name TEXT NOT NULL DEFAULT '',
            currency TEXT NOT NULL DEFAULT '',
            credential_envelope TEXT,
            credential_names JSONB NOT NULL DEFAULT '[]'::jsonb,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            paused_reason TEXT NOT NULL DEFAULT '',
            daily_budget INTEGER NOT NULL DEFAULT 0 CHECK (daily_budget >= 0),
            interactive_reserve_pct INTEGER NOT NULL DEFAULT 10
                CHECK (interactive_reserve_pct BETWEEN 0 AND 50),
            terms_reviewed_by TEXT NOT NULL DEFAULT '',
            terms_reviewed_at TIMESTAMPTZ,
            last_ok_at TIMESTAMPTZ,
            last_error_code TEXT NOT NULL DEFAULT '',
            last_error_at TIMESTAMPTZ,
            created_by TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (provider, storefront)
        );

        CREATE TABLE IF NOT EXISTS quota_ledger (
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            day DATE NOT NULL,
            spent INTEGER NOT NULL DEFAULT 0 CHECK (spent >= 0),
            interactive_spent INTEGER NOT NULL DEFAULT 0
                CHECK (interactive_spent >= 0 AND interactive_spent <= spent),
            PRIMARY KEY (connector_id, day)
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id BIGSERIAL PRIMARY KEY,
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            subject_kind TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            detail JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_supply_audit_subject
            ON audit_events(subject_kind, subject_id, at);
        """,
        prepare=False,
    )


def _m002_csv_offers(conn) -> None:
    """Offers uploaded as a file, for connectors with no API (or no internet).

    One import per connector, replaced whole on each upload. ``match_key`` is
    the lookup key from ``identity.match_key``; ``price_breaks`` is a list of
    ``[quantity, "price"]`` pairs.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS csv_imports (
            connector_id TEXT PRIMARY KEY REFERENCES connectors(id) ON DELETE CASCADE,
            filename TEXT NOT NULL DEFAULT '',
            imported_by TEXT NOT NULL,
            imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            row_count INTEGER NOT NULL CHECK (row_count >= 0)
        );

        CREATE TABLE IF NOT EXISTS csv_offers (
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            sku TEXT NOT NULL,
            mpn TEXT NOT NULL,
            match_key TEXT NOT NULL,
            manufacturer TEXT NOT NULL,
            stock INTEGER NOT NULL CHECK (stock >= 0),
            currency TEXT NOT NULL DEFAULT '',
            moq INTEGER NOT NULL DEFAULT 1 CHECK (moq >= 1),
            order_multiple INTEGER NOT NULL DEFAULT 1 CHECK (order_multiple >= 1),
            packaging TEXT NOT NULL DEFAULT 'unknown',
            lead_time_days INTEGER CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
            lifecycle TEXT NOT NULL DEFAULT 'unknown',
            discontinued BOOLEAN NOT NULL DEFAULT FALSE,
            rohs BOOLEAN,
            product_url TEXT NOT NULL DEFAULT '',
            incoming_qty INTEGER CHECK (incoming_qty IS NULL OR incoming_qty >= 1),
            incoming_date DATE,
            price_breaks JSONB NOT NULL DEFAULT '[]'::jsonb,
            PRIMARY KEY (connector_id, sku)
        );
        CREATE INDEX IF NOT EXISTS idx_csv_offers_match ON csv_offers (connector_id, match_key);
        """,
        prepare=False,
    )


def _m003_parts_and_listings(conn) -> None:
    """Manufacturers, their spellings, parts, and distributor listings.

    The manufacturer part is the spine every supply feature reads. A listing
    always points at the part it is a candidate for; ``match_state`` decides
    whether it counts. ``manufacturer_aliases`` rows are ``pending`` until a
    person maps the spelling to a manufacturer.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS manufacturers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_key TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS manufacturer_aliases (
            alias_key TEXT PRIMARY KEY,
            alias_text TEXT NOT NULL,
            manufacturer_id TEXT REFERENCES manufacturers(id) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK (status IN ('confirmed', 'pending')),
            seen_at_provider TEXT NOT NULL DEFAULT '',
            confirmed_by TEXT NOT NULL DEFAULT '',
            first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CHECK ((status = 'confirmed') = (manufacturer_id IS NOT NULL))
        );

        CREATE TABLE IF NOT EXISTS parts (
            id TEXT PRIMARY KEY,
            manufacturer_id TEXT NOT NULL REFERENCES manufacturers(id),
            mpn TEXT NOT NULL,
            match_key TEXT NOT NULL,
            lifecycle TEXT NOT NULL DEFAULT 'unknown',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (manufacturer_id, match_key)
        );
        CREATE INDEX IF NOT EXISTS idx_parts_match_key ON parts (match_key);

        CREATE TABLE IF NOT EXISTS listings (
            id TEXT PRIMARY KEY,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            sku TEXT NOT NULL,
            part_id TEXT REFERENCES parts(id) ON DELETE SET NULL,
            raw_mpn TEXT NOT NULL,
            raw_manufacturer TEXT NOT NULL,
            packaging TEXT NOT NULL DEFAULT 'unknown',
            match_state TEXT NOT NULL CHECK (match_state IN (
                'exact', 'manual', 'manufacturer_unresolved', 'near', 'rejected', 'gone'
            )),
            match_reason TEXT NOT NULL DEFAULT '',
            matched_by TEXT NOT NULL DEFAULT 'discovery',
            first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (connector_id, sku)
        );
        CREATE INDEX IF NOT EXISTS idx_listings_part ON listings (part_id, match_state);
        """,
        prepare=False,
    )


def _m004_watches_offers_samples(conn) -> None:
    """What is watched, what each listing last said, and how it changed.

    ``offers`` holds the latest state per listing. ``samples`` is append-only
    history, one row per distinct observation time. ``poll_state`` decides when a
    listing is next asked about. ``connectors.cooldown_until`` lets a provider's
    rate limit hold off every listing of that connector at once.
    """

    conn.execute(
        """
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMPTZ;

        CREATE TABLE IF NOT EXISTS watches (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL UNIQUE REFERENCES parts(id) ON DELETE CASCADE,
            threshold INTEGER CHECK (threshold IS NULL OR threshold >= 0),
            pinned BOOLEAN NOT NULL DEFAULT FALSE,
            owner TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS offers (
            listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
            fetched_at TIMESTAMPTZ NOT NULL,
            stock INTEGER NOT NULL CHECK (stock >= 0),
            incoming JSONB NOT NULL DEFAULT '[]'::jsonb,
            moq INTEGER NOT NULL DEFAULT 1,
            order_multiple INTEGER NOT NULL DEFAULT 1,
            packaging TEXT NOT NULL DEFAULT 'unknown',
            price_breaks JSONB NOT NULL DEFAULT '[]'::jsonb,
            currency TEXT NOT NULL DEFAULT '',
            lead_time_days INTEGER,
            lifecycle TEXT NOT NULL DEFAULT 'unknown',
            discontinued BOOLEAN NOT NULL DEFAULT FALSE,
            rohs BOOLEAN,
            marketplace BOOLEAN NOT NULL DEFAULT FALSE,
            product_url TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS samples (
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            sampled_at TIMESTAMPTZ NOT NULL,
            stock INTEGER NOT NULL CHECK (stock >= 0),
            incoming_qty INTEGER NOT NULL DEFAULT 0,
            unit_price NUMERIC(14, 6),
            currency TEXT NOT NULL DEFAULT '',
            lead_time_days INTEGER,
            lifecycle TEXT NOT NULL DEFAULT 'unknown',
            discontinued BOOLEAN NOT NULL DEFAULT FALSE,
            PRIMARY KEY (listing_id, sampled_at)
        );

        CREATE TABLE IF NOT EXISTS poll_state (
            listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
            tier TEXT NOT NULL CHECK (tier IN ('hot', 'warm', 'normal', 'cold')),
            next_poll_at TIMESTAMPTZ NOT NULL,
            last_polled_at TIMESTAMPTZ,
            last_change_at TIMESTAMPTZ,
            error_streak INTEGER NOT NULL DEFAULT 0,
            missing_streak INTEGER NOT NULL DEFAULT 0,
            last_error_code TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_poll_state_due ON poll_state (next_poll_at);
        """,
        prepare=False,
    )


def _m005_discovery_runs(conn) -> None:
    """When each watched part was last searched for at each connector.

    A watch has no listings until someone asks a distributor about it. This
    records that it was asked, so a part the distributor does not carry is
    searched again weekly rather than on every scan.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS discovery_runs (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            last_run_at TIMESTAMPTZ NOT NULL,
            found INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (part_id, connector_id)
        );
        """,
        prepare=False,
    )


def _m006_events_rollups(conn) -> None:
    """Market events, the marketplace flag on samples, and daily rollups of old samples.

    ``events`` records changes worth telling someone about (first kind: a listing
    that disappeared). ``samples.marketplace`` lets the history leave out
    marketplace stock like the current total does. ``samples_daily`` keeps one row
    per listing per day once the raw rows are old enough to compact.
    """

    conn.execute(
        """
        ALTER TABLE samples ADD COLUMN IF NOT EXISTS marketplace BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_samples_sampled_at ON samples (sampled_at);

        CREATE TABLE IF NOT EXISTS samples_daily (
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            day DATE NOT NULL,
            min_stock INTEGER NOT NULL,
            max_stock INTEGER NOT NULL,
            last_stock INTEGER NOT NULL,
            last_unit_price NUMERIC(14, 6),
            currency TEXT NOT NULL DEFAULT '',
            marketplace BOOLEAN NOT NULL DEFAULT FALSE,
            sample_count INTEGER NOT NULL CHECK (sample_count >= 1),
            PRIMARY KEY (listing_id, day)
        );

        CREATE TABLE IF NOT EXISTS events (
            id BIGSERIAL PRIMARY KEY,
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            kind TEXT NOT NULL,
            part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
            listing_id TEXT REFERENCES listings(id) ON DELETE CASCADE,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_supply_events_part ON events (part_id, at);
        """,
        prepare=False,
    )


def _m007_alerts(conn) -> None:
    """Alerts on watched parts: one per part and kind until it clears.

    ``pending`` rows are conditions seen once and not yet shown; they open after a
    second look (see ``alerts.py``). In-app only: nothing here is sent anywhere.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts (
            id BIGSERIAL PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            kind TEXT NOT NULL,
            severity TEXT NOT NULL CHECK (severity IN ('warning', 'error', 'fatal')),
            state TEXT NOT NULL CHECK (state IN ('pending', 'open', 'acknowledged', 'snoozed', 'resolved')),
            first_seen_at TIMESTAMPTZ NOT NULL,
            seen_count INTEGER NOT NULL DEFAULT 1,
            opened_at TIMESTAMPTZ,
            last_event_at TIMESTAMPTZ NOT NULL,
            acknowledged_by TEXT NOT NULL DEFAULT '',
            acknowledged_at TIMESTAMPTZ,
            snoozed_until TIMESTAMPTZ,
            resolved_at TIMESTAMPTZ,
            detail JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_one_live
            ON alerts (part_id, kind) WHERE state <> 'resolved';
        CREATE INDEX IF NOT EXISTS idx_alerts_state ON alerts (state, last_event_at);
        """,
        prepare=False,
    )


def _m008_bom_usage(conn) -> None:
    """Where parts are used: one row per distinct part on each project's BOM.

    Read from semantic indexes that already exist (see ``usage.py``). A row carries the part
    number key and the manufacturer spelling key, so it matches a supply part however that part
    got here. ``bom_usage_projects`` remembers which revision a project's rows were read from.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS bom_usage_projects (
            project_id TEXT PRIMARY KEY,
            project_name TEXT NOT NULL,
            revision_key TEXT NOT NULL,
            line_count INTEGER NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS bom_usage (
            project_id TEXT NOT NULL REFERENCES bom_usage_projects(project_id) ON DELETE CASCADE,
            line_key TEXT NOT NULL,
            manufacturer TEXT NOT NULL DEFAULT '',
            mpn TEXT NOT NULL,
            alias_key TEXT NOT NULL DEFAULT '',
            match_key TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 1),
            refs TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (project_id, line_key)
        );
        CREATE INDEX IF NOT EXISTS idx_bom_usage_match ON bom_usage (match_key);
        """,
        prepare=False,
    )


def _m009_usage_visibility(conn) -> None:
    """Which roles may see a project, copied from its folder when usage is read.

    A folder can hide its projects from some roles. Usage is a cache over every project, so each
    project carries the supply roles that may see it and reads filter on the caller's role.
    """

    conn.execute(
        "ALTER TABLE bom_usage_projects ADD COLUMN IF NOT EXISTS visible_roles TEXT[] NOT NULL DEFAULT '{admin,designer,qa}'",
        prepare=False,
    )


def _m010_component_sources(conn) -> None:
    """The approved parts list (AVL): which manufacturer parts may stand in for a catalog component.

    The component's own manufacturer part is its primary source and is read from the catalog, so
    only alternates are stored. The list is not part of any revision hash, so editing it makes no
    revision; every change is audited. ``component_id`` is a catalog id, which lives in another
    schema, so it has no foreign key.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS component_sources (
            id TEXT PRIMARY KEY,
            component_id TEXT NOT NULL,
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            approval TEXT NOT NULL CHECK (approval IN ('pending', 'approved', 'rejected')),
            rank INTEGER NOT NULL CHECK (rank >= 1),
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            decided_by TEXT NOT NULL DEFAULT '',
            decided_at TIMESTAMPTZ,
            UNIQUE (component_id, part_id)
        );
        CREATE INDEX IF NOT EXISTS idx_component_sources_part ON component_sources (part_id);
        """,
        prepare=False,
    )


def _m011_waivers(conn) -> None:
    """Waivers: a person's decision to accept a finding on a part.

    A waiver holds while the condition it was raised against (``scope``) stays the same; when the
    part changes so the finding means something else, the waiver is shown for another look. Only
    one waiver per part and check is open or approved at a time.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS waivers (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            check_id TEXT NOT NULL,
            scope TEXT NOT NULL,
            reason TEXT NOT NULL,
            state TEXT NOT NULL CHECK (state IN ('proposed', 'approved', 'rejected')),
            proposed_by TEXT NOT NULL,
            proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            decided_by TEXT NOT NULL DEFAULT '',
            decided_at TIMESTAMPTZ
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_waivers_open ON waivers (part_id, check_id) WHERE state <> 'rejected';
        """,
        prepare=False,
    )


def _m012_release_snapshots(conn) -> None:
    """What supply data said when a release was published: its BOM assessment and approved parts.

    Written once, at publish, and never changed. It is evidence beside the release, not part of
    its digest: stock moves every hour, so hashing it would make equal builds differ.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS release_snapshots (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            build_id TEXT NOT NULL UNIQUE,
            tag TEXT NOT NULL,
            commit_sha TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            health NUMERIC(3, 1),
            status TEXT NOT NULL,
            assessment JSONB NOT NULL,
            avl JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_release_snapshots_project ON release_snapshots (project_id, created_at DESC);
        CREATE OR REPLACE FUNCTION release_snapshots_frozen() RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'A release snapshot cannot be changed or removed';
        END;
        $$ LANGUAGE plpgsql;
        DROP TRIGGER IF EXISTS trg_release_snapshots_frozen ON release_snapshots;
        CREATE TRIGGER trg_release_snapshots_frozen BEFORE UPDATE OR DELETE ON release_snapshots
            FOR EACH ROW EXECUTE FUNCTION release_snapshots_frozen();
        """,
        prepare=False,
    )


def _m013_settings(conn) -> None:
    """Workspace settings for supply, one JSON value per area. Absent means the defaults in code."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m014_demands(conn) -> None:
    """What is needed, and when: a quantity of a part from a source.

    ``quantity`` may be negative: an entry for stock that is already on its way in. ``source_ref``
    names the run or list a demand came from, so the source can replace it later. Open demand is
    ``planned`` or ``committed``; ``closed`` demand is kept for history.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS demands (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            source TEXT NOT NULL CHECK (source IN ('manual', 'bom_watch', 'manufacturing_run')),
            source_ref TEXT NOT NULL DEFAULT '',
            quantity INTEGER NOT NULL CHECK (quantity <> 0),
            need_by DATE,
            state TEXT NOT NULL CHECK (state IN ('planned', 'committed', 'closed')),
            note TEXT NOT NULL DEFAULT '',
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            closed_by TEXT NOT NULL DEFAULT '',
            closed_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_supply_demands_part ON demands (part_id, state, need_by);
        """,
        prepare=False,
    )


def _m015_fx_rates(conn) -> None:
    """Exchange rates, as the European Central Bank publishes them: units of a currency per euro.

    One row per day and currency. ``source`` says where a rate came from (``ecb`` or ``manual``). The
    latest day on or before today is the one used; a missing day is never filled by guessing.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS fx_rates (
            day DATE NOT NULL,
            currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
            per_eur NUMERIC(20, 8) NOT NULL CHECK (per_eur > 0),
            source TEXT NOT NULL CHECK (source IN ('ecb', 'manual')),
            fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (day, currency)
        );
        """,
        prepare=False,
    )


def _m016_datasheets(conn) -> None:
    """Datasheets kept as the manufacturer published them, one row per version.

    The file itself is stored by its SHA-256 outside the database. A new hash for the same part is a new
    version; ``markers`` are phrases found in the text that matter for lifecycle, and ``change_summary``
    says what differs from the version before. ``datasheet_checks`` remembers when an address was last
    tried so a dead link is not retried every run.
    """

    conn.execute(
        """
        ALTER TABLE parts ADD COLUMN IF NOT EXISTS datasheet_url TEXT NOT NULL DEFAULT '';
        CREATE TABLE IF NOT EXISTS datasheets (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            version INTEGER NOT NULL CHECK (version >= 1),
            url TEXT NOT NULL,
            sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
            size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
            pages INTEGER NOT NULL DEFAULT 0,
            text_sha256 TEXT NOT NULL DEFAULT '',
            markers TEXT[] NOT NULL DEFAULT '{}',
            change_summary TEXT NOT NULL DEFAULT '',
            fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (part_id, version),
            UNIQUE (part_id, sha256)
        );
        CREATE TABLE IF NOT EXISTS datasheet_checks (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            checked_at TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL,
            failures INTEGER NOT NULL DEFAULT 0
        );
        """,
        prepare=False,
    )


def _m017_reach(conn) -> None:
    """REACH: whether a distributor flags an offer as affected, the Candidate List, and declared substances.

    ``offers.reach_affected`` is true when a distributor says the part is affected, false when it says it is
    not, and null when it says nothing. The Candidate List is loaded whole by an administrator.
    ``part_substances`` holds what a supplier declared for a part, as CAS numbers.
    """

    conn.execute(
        """
        ALTER TABLE offers ADD COLUMN IF NOT EXISTS reach_affected BOOLEAN;
        CREATE TABLE IF NOT EXISTS svhc_substances (
            cas TEXT NOT NULL,
            name TEXT NOT NULL,
            ec TEXT NOT NULL DEFAULT '',
            added_on DATE,
            PRIMARY KEY (cas, name)
        );
        CREATE TABLE IF NOT EXISTS svhc_list (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            loaded_at TIMESTAMPTZ NOT NULL,
            loaded_by TEXT NOT NULL,
            source_name TEXT NOT NULL DEFAULT '',
            substances INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS part_substances (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            cas TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            declared_by TEXT NOT NULL,
            declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, cas)
        );
        """,
        prepare=False,
    )


def _m018_market_indices(conn) -> None:
    """One value a day per scope and metric, over the parts a workspace follows (see ``market.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS market_indices (
            day DATE NOT NULL,
            scope_kind TEXT NOT NULL CHECK (scope_kind IN ('all', 'manufacturer')),
            scope_value TEXT NOT NULL DEFAULT '',
            metric TEXT NOT NULL,
            value NUMERIC(14, 4) NOT NULL,
            sample_size INTEGER NOT NULL CHECK (sample_size >= 1),
            PRIMARY KEY (day, scope_kind, scope_value, metric)
        );
        """,
        prepare=False,
    )


def _m019_pcns(conn) -> None:
    """Product change notices entered by people, and the parts each covers (see ``pcn.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS pcns (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('end_of_life', 'nrnd', 'last_time_buy', 'change')),
            notice_url TEXT NOT NULL DEFAULT '',
            last_time_buy DATE,
            last_time_ship DATE,
            notes TEXT NOT NULL DEFAULT '',
            state TEXT NOT NULL CHECK (state IN ('open', 'closed')),
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            closed_by TEXT NOT NULL DEFAULT '',
            closed_at TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS pcn_parts (
            pcn_id TEXT NOT NULL REFERENCES pcns(id) ON DELETE CASCADE,
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            PRIMARY KEY (pcn_id, part_id)
        );
        CREATE INDEX IF NOT EXISTS idx_pcn_parts_part ON pcn_parts (part_id);
        """,
        prepare=False,
    )


def _m020_part_params(conn) -> None:
    """Attributes distributors list for a part, as they wrote them (see ``params.py`` for how they are read).

    One row per part, provider and attribute name: the latest text seen. Normalising happens when they are read,
    so a better parser applies to what is already stored.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_params (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            name TEXT NOT NULL,
            raw TEXT NOT NULL,
            observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, provider, name)
        );
        """,
        prepare=False,
    )


def _m040_read_requests(conn) -> None:
    """A BOM or a component someone asked to check once (see ``oneoff.py``): read at every distributor, tracked by nobody.

    ``read_request_work`` has a row for each part and distributor still to be read. It is paid from the pool, and from
    spare budget when the pool is empty, so a large BOM finishes over evenings and weekends.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS read_requests (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL CHECK (kind IN ('bom', 'component')),
            project_id TEXT NOT NULL DEFAULT '',
            requested_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            finished_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_read_requests_open ON read_requests (created_at) WHERE finished_at IS NULL;
        CREATE TABLE IF NOT EXISTS read_request_work (
            request_id TEXT NOT NULL REFERENCES read_requests(id) ON DELETE CASCADE,
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'done', 'failed')),
            attempts INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (request_id, part_id, connector_id)
        );
        CREATE INDEX IF NOT EXISTS idx_read_request_work_connector ON read_request_work (connector_id, state);
        """,
        prepare=False,
    )


def _m039_summary_dirty_log(conn) -> None:
    """Mark a summary stale by adding a row to a log, not by updating the summary's own row.

    Updating the summary row made every writer of one part wait for the others, even a poll and a person's click. The log
    only appends, so nothing waits. A kept summary is current while no log row for its part comes from a transaction that
    had not finished when the summary was worked out (``snap`` is that moment's oldest running transaction).
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS summary_dirty (
            id BIGSERIAL PRIMARY KEY,
            part_id TEXT NOT NULL,
            xid BIGINT NOT NULL DEFAULT (pg_current_xact_id()::text::bigint)
        );
        CREATE INDEX IF NOT EXISTS idx_summary_dirty_part ON summary_dirty (part_id, xid);
        ALTER TABLE part_summaries DROP COLUMN IF EXISTS stale;
        ALTER TABLE part_summaries DROP COLUMN IF EXISTS version;
        ALTER TABLE part_summaries ADD COLUMN IF NOT EXISTS snap BIGINT NOT NULL DEFAULT 0;
        DELETE FROM part_summaries;

        CREATE OR REPLACE FUNCTION supply_summary_stale(pid TEXT) RETURNS VOID AS $$
        BEGIN
            IF pid IS NOT NULL THEN INSERT INTO summary_dirty (part_id) VALUES (pid); END IF;
        END;
        $$ LANGUAGE plpgsql;
        """,
        prepare=False,
    )


def _m038_part_summaries(conn) -> None:
    """What a part's offers add up to (stock, price, lifecycle, problem), kept per part so a list does not add them up again.

    A row is marked stale by a trigger on anything it is made from: offers, listings, polling, the watch's packaging,
    packaging picks and searches. A read recomputes only the stale or missing rows (see ``parts_view.py``).
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_summaries (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            stale BOOLEAN NOT NULL DEFAULT TRUE,
            version BIGINT NOT NULL DEFAULT 0,
            computed_at TIMESTAMPTZ
        );

        CREATE OR REPLACE FUNCTION supply_summary_stale(pid TEXT) RETURNS VOID AS $$
        BEGIN
            IF pid IS NULL THEN RETURN; END IF;
            INSERT INTO part_summaries (part_id) SELECT p.id FROM parts p WHERE p.id = pid
            ON CONFLICT (part_id) DO UPDATE SET stale = TRUE, version = part_summaries.version + 1;
        END;
        $$ LANGUAGE plpgsql;

        CREATE OR REPLACE FUNCTION supply_summary_by_part() RETURNS trigger AS $$
        BEGIN
            IF TG_OP <> 'INSERT' THEN PERFORM supply_summary_stale(OLD.part_id); END IF;
            IF TG_OP <> 'DELETE' THEN PERFORM supply_summary_stale(NEW.part_id); END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        CREATE OR REPLACE FUNCTION supply_summary_by_listing() RETURNS trigger AS $$
        BEGIN
            PERFORM supply_summary_stale((SELECT part_id FROM listings WHERE id = COALESCE(NEW.listing_id, OLD.listing_id)));
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_summary_listings ON listings;
        CREATE TRIGGER trg_summary_listings AFTER INSERT OR UPDATE OR DELETE ON listings
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_summary_watches ON watches;
        CREATE TRIGGER trg_summary_watches AFTER INSERT OR UPDATE OR DELETE ON watches
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_summary_picks ON packaging_picks;
        CREATE TRIGGER trg_summary_picks AFTER INSERT OR UPDATE OR DELETE ON packaging_picks
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_summary_discovery ON discovery_runs;
        CREATE TRIGGER trg_summary_discovery AFTER INSERT OR UPDATE OR DELETE ON discovery_runs
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_summary_offers ON offers;
        CREATE TRIGGER trg_summary_offers AFTER INSERT OR UPDATE OR DELETE ON offers
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_listing();
        DROP TRIGGER IF EXISTS trg_summary_poll_state ON poll_state;
        CREATE TRIGGER trg_summary_poll_state AFTER INSERT OR UPDATE OF tier OR DELETE ON poll_state
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_listing();
        """,
        prepare=False,
    )


def _m037_release_snapshot_jobs(conn) -> None:
    """Whether a release's supply snapshot was taken, and why not. Snapshots are append-only, so a failure lives apart.

    A snapshot is taken by a worker job queued at publish, retried, and idempotent per build (see ``release_snapshot.py``).
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS release_snapshot_jobs (
            build_id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            state TEXT NOT NULL CHECK (state IN ('queued', 'done', 'failed')),
            reason TEXT NOT NULL DEFAULT '',
            attempts INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_release_snapshot_jobs_project ON release_snapshot_jobs (project_id);
        """,
        prepare=False,
    )


def _m036_poll_schedules(conn) -> None:
    """A listing's schedule is daily, weekly or monthly (its part's tracking rate), not a risk tier; ``urgency`` orders the day's queue."""

    conn.execute("ALTER TABLE poll_state DROP CONSTRAINT IF EXISTS poll_state_tier_check", prepare=False)
    conn.execute("UPDATE poll_state SET tier = 'daily' WHERE tier IN ('hot', 'warm', 'normal', 'cold')", prepare=False)
    conn.execute(
        "ALTER TABLE poll_state ADD CONSTRAINT poll_state_tier_check CHECK (tier IN ('daily', 'weekly', 'monthly'))", prepare=False
    )
    conn.execute("ALTER TABLE poll_state ADD COLUMN IF NOT EXISTS urgency SMALLINT NOT NULL DEFAULT 2", prepare=False)
    conn.execute("ALTER TABLE quota_ledger ADD COLUMN IF NOT EXISTS spare_spent INTEGER NOT NULL DEFAULT 0", prepare=False)


def _m035_tracking(conn) -> None:
    """Tracking tiers, the call budget's accounting and packaging picks (see ``tracking.py``, ``budget.py``).

    A watch is a person's choice of tier 1 (daily) or tier 2 (weekly or monthly); ``origin`` says where it came from.
    ``part_tiers`` is derived from every source and says why. ``admissions`` says where a part is read or waits for room.
    ``call_counts`` is the ledger's breakdown by kind and purpose. A connector's ``account_key`` is a keyed hash of its
    credentials, so connectors on one key share a budget; the reset time is the provider's own day. The committed share is what ``interactive_reserve_pct`` leaves.
    """

    conn.execute(
        """
        ALTER TABLE watches ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2));
        ALTER TABLE watches ADD COLUMN IF NOT EXISTS rate TEXT NOT NULL DEFAULT 'weekly' CHECK (rate IN ('daily', 'weekly', 'monthly'));
        ALTER TABLE watches ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'legacy' CHECK (origin IN ('person', 'component', 'legacy'));
        ALTER TABLE watches ALTER COLUMN origin SET DEFAULT 'person';
        ALTER TABLE component_watches ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2));
        ALTER TABLE component_watches ADD COLUMN IF NOT EXISTS rate TEXT NOT NULL DEFAULT 'weekly' CHECK (rate IN ('daily', 'weekly', 'monthly'));

        CREATE TABLE IF NOT EXISTS tracked_projects (
            project_id TEXT PRIMARY KEY,
            variants TEXT[] NOT NULL DEFAULT '{""}',
            connector_ids TEXT[],
            tracked_by TEXT NOT NULL,
            tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS part_tiers (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            tier SMALLINT NOT NULL CHECK (tier IN (1, 2)),
            rate TEXT NOT NULL CHECK (rate IN ('daily', 'weekly', 'monthly')),
            reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_part_tiers_tier ON part_tiers (tier, part_id);

        CREATE TABLE IF NOT EXISTS admissions (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            state TEXT NOT NULL CHECK (state IN ('admitted', 'waiting')),
            since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, connector_id)
        );
        CREATE INDEX IF NOT EXISTS idx_admissions_connector ON admissions (connector_id, state, since);

        CREATE TABLE IF NOT EXISTS packaging_picks (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            picked_by TEXT NOT NULL,
            picked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, connector_id)
        );

        CREATE TABLE IF NOT EXISTS call_counts (
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            day DATE NOT NULL,
            hour SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
            kind TEXT NOT NULL,
            purpose TEXT NOT NULL,
            calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0),
            PRIMARY KEY (connector_id, day, hour, kind, purpose)
        );

        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS account_key TEXT NOT NULL DEFAULT '';
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS reset_time TEXT NOT NULL DEFAULT '00:00';
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS reset_tz TEXT NOT NULL DEFAULT 'UTC';
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS error_streak INTEGER NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_connectors_account ON connectors (account_key) WHERE account_key <> '';
        """,
        prepare=False,
    )
    # Every part watched before tiers is tier 2, weekly; its reason says so.
    conn.execute(
        """
        INSERT INTO part_tiers (part_id, tier, rate, reasons)
        SELECT part_id, tier, rate, jsonb_build_array(jsonb_build_object('kind', origin, 'ref', id)) FROM watches
        ON CONFLICT (part_id) DO NOTHING
        """,
        prepare=False,
    )
    # A watch's packaging policy becomes a pick where a listing of that packaging exists (the first by SKU).
    conn.execute(
        """
        INSERT INTO packaging_picks (part_id, connector_id, listing_id, picked_by)
        SELECT DISTINCT ON (l.part_id, l.connector_id) l.part_id, l.connector_id, l.id, 'migration'
        FROM watches w JOIN listings l ON l.part_id = w.part_id
        WHERE w.packaging <> 'any' AND l.packaging = w.packaging AND l.match_state IN ('exact', 'manual')
        ORDER BY l.part_id, l.connector_id, l.sku
        ON CONFLICT (part_id, connector_id) DO NOTHING
        """,
        prepare=False,
    )


def _m034_variant_usage_keys(conn) -> None:
    """The match keys of variant lines, so a part only a design variant fits is found as in use like any other."""

    conn.execute("ALTER TABLE bom_usage_variants ADD COLUMN IF NOT EXISTS alias_key TEXT NOT NULL DEFAULT ''", prepare=False)
    conn.execute("ALTER TABLE bom_usage_variants ADD COLUMN IF NOT EXISTS match_key TEXT NOT NULL DEFAULT ''", prepare=False)
    conn.execute("CREATE INDEX IF NOT EXISTS bom_usage_variants_match_key ON bom_usage_variants (match_key)", prepare=False)


def _m033_connector_keep_days(conn) -> None:
    """Days any history of a connector's listings may be kept, for a provider whose terms limit storage. Empty means for good."""

    conn.execute("ALTER TABLE connectors ADD COLUMN IF NOT EXISTS keep_days INTEGER CHECK (keep_days BETWEEN 1 AND 3650)", prepare=False)


def _m032_bom_usage_variants(conn) -> None:
    """The BOM lines of each design variant of a project, beside the base design's ``bom_usage`` (see ``usage.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS bom_usage_variants (
            project_id TEXT NOT NULL REFERENCES bom_usage_projects(project_id) ON DELETE CASCADE,
            variant TEXT NOT NULL,
            line_key TEXT NOT NULL,
            manufacturer TEXT NOT NULL DEFAULT '',
            mpn TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 1),
            refs TEXT NOT NULL DEFAULT '',
            lcsc TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (project_id, variant, line_key)
        );
        """,
        prepare=False,
    )


def _m031_bom_comments(conn) -> None:
    """Notes on a line of a project's BOM (see ``bom_comments.py``). Kept by the line's key, so they follow the part."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS bom_comments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            line_key TEXT NOT NULL,
            body TEXT NOT NULL,
            author TEXT NOT NULL,
            author_name TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_bom_comments_project ON bom_comments (project_id, line_key, created_at);
        """,
        prepare=False,
    )


def _m030_release_compliance(conn) -> None:
    """The compliance draft as it stood when a release was published, kept beside the rest of its snapshot.

    Snapshots are never updated, so the column is filled at insert. Snapshots taken before this have none.
    """

    conn.execute("ALTER TABLE release_snapshots ADD COLUMN IF NOT EXISTS compliance JSONB", prepare=False)


def _m029_notice_files(conn) -> None:
    """A kept copy of a notice's PDF: its hash (the file is stored like a datasheet), and when and how the last try went."""

    conn.execute(
        """
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS file_sha256 TEXT NOT NULL DEFAULT '';
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS file_checked_at TIMESTAMPTZ;
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS file_status TEXT NOT NULL DEFAULT '';
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS file_failures INTEGER NOT NULL DEFAULT 0;
        """,
        prepare=False,
    )


def _m028_datasheet_denied_hosts(conn) -> None:
    """Hosts datasheets are never fetched from, set by an administrator (see ``datasheets.deny``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS datasheet_denied_hosts (
            host TEXT PRIMARY KEY,
            reason TEXT NOT NULL DEFAULT '',
            added_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m027_component_watches(conn) -> None:
    """A standing request to watch a catalog component, and its approved alternates when asked (see ``component_watches.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS component_watches (
            component_id TEXT PRIMARY KEY,
            include_alternates BOOLEAN NOT NULL DEFAULT FALSE,
            packaging TEXT NOT NULL DEFAULT 'any' CHECK (packaging IN ('any', 'cut_tape', 'tape_reel', 'tray', 'tube', 'bulk')),
            owner TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m026_watch_packaging(conn) -> None:
    """Which packaging a watch counts: any, or one of cut tape, tape and reel, tray, tube, bulk."""

    conn.execute(
        "ALTER TABLE watches ADD COLUMN IF NOT EXISTS packaging TEXT NOT NULL DEFAULT 'any' "
        "CHECK (packaging IN ('any', 'cut_tape', 'tape_reel', 'tray', 'tube', 'bulk'))",
        prepare=False,
    )


def _m025_worker_seen(conn) -> None:
    """The worker's last report of the providers it knows and the age of its code (see ``worker_seen.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS worker_seen (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            providers TEXT[] NOT NULL DEFAULT '{}',
            code_stamp DOUBLE PRECISION NOT NULL DEFAULT 0,
            seen_at TIMESTAMPTZ NOT NULL
        );
        """,
        prepare=False,
    )


def _m024_market_categories(conn) -> None:
    """Market figures by the category a distributor files a part under, as well as by manufacturer."""

    conn.execute("ALTER TABLE market_indices DROP CONSTRAINT IF EXISTS market_indices_scope_kind_check", prepare=False)
    conn.execute(
        "ALTER TABLE market_indices ADD CONSTRAINT market_indices_scope_kind_check CHECK (scope_kind IN ('all', 'manufacturer', 'category'))",
        prepare=False,
    )


def _m023_connector_retention(conn) -> None:
    """Days raw samples are kept per connector, for a provider whose terms limit how long its data may be stored."""

    conn.execute("ALTER TABLE connectors ADD COLUMN IF NOT EXISTS retention_days INTEGER CHECK (retention_days BETWEEN 1 AND 365)", prepare=False)


def _m022_usage_lcsc(conn) -> None:
    """The LCSC number a BOM line's symbol carries, kept with the stored line so lines read later resolve through it."""

    conn.execute("ALTER TABLE bom_usage ADD COLUMN IF NOT EXISTS lcsc TEXT NOT NULL DEFAULT ''", prepare=False)


def _m021_distributor_details(conn) -> None:
    """Compliance and trade facts, a person's sign-in at a distributor, and notices read from distributors.

    ``part_facts`` holds what each provider states about a part (see ``facts.py``). ``connector_grants`` holds a
    sealed user grant (DigiKey change notices need one); ``oauth_states`` the one-time codes of a sign-in in progress.
    ``detail_checks`` says when a listing's notices or substances were last read. A notice read from a distributor
    is ``pcns`` with ``source`` and ``external_key``, the same notice once however many parts it covers.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_facts (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            observed_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (part_id, provider, name)
        );
        CREATE TABLE IF NOT EXISTS connector_grants (
            connector_id TEXT PRIMARY KEY REFERENCES connectors(id) ON DELETE CASCADE,
            envelope TEXT NOT NULL,
            access_expires_at TIMESTAMPTZ,
            refresh_expires_at TIMESTAMPTZ,
            granted_by TEXT NOT NULL,
            granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_error TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS oauth_states (
            state TEXT PRIMARY KEY,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            actor TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS detail_checks (
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            kind TEXT NOT NULL CHECK (kind IN ('notices', 'substances')),
            checked_at TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL,
            failures INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (listing_id, kind)
        );
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS external_key TEXT NOT NULL DEFAULT '';
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS published_on DATE;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_pcns_external ON pcns (source, external_key) WHERE external_key <> '';
        """,
        prepare=False,
    )


def _m041_catch_up(conn) -> None:
    """Run migrations 35 to 40 again. They were edited after they had run on some databases (``error_streak``, ``spare_spent``,
    later trigger changes), and each is written to be run twice."""

    for migrate in (_m035_tracking, _m036_poll_schedules, _m037_release_snapshot_jobs, _m038_part_summaries, _m039_summary_dirty_log, _m040_read_requests):
        migrate(conn)


def _m042_sample_order_terms(conn) -> None:
    """A reading keeps the smallest order and the order multiple, so a jump in either can be told from history."""

    conn.execute(
        """
        ALTER TABLE samples ADD COLUMN IF NOT EXISTS moq INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE samples ADD COLUMN IF NOT EXISTS order_multiple INTEGER NOT NULL DEFAULT 1;
        """,
        prepare=False,
    )


def _m043_bom_cost_history(conn) -> None:
    """One cost per board a day for each project and design variant that is tracked, so the cost of a BOM can be followed."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS bom_cost_history (
            project_id TEXT NOT NULL,
            variant TEXT NOT NULL DEFAULT '',
            day DATE NOT NULL,
            cost_per_board NUMERIC(14, 4) NOT NULL,
            currency TEXT NOT NULL,
            lines INTEGER NOT NULL,
            lines_priced INTEGER NOT NULL,
            PRIMARY KEY (project_id, variant, day)
        );
        """,
        prepare=False,
    )


def _m044_alert_rules(conn) -> None:
    """Per-part alert rules (muted kinds, price rise limit, target price), and the status each part's assessment is judged against."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS alert_rules (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            muted TEXT[] NOT NULL DEFAULT '{}',
            price_rise_percent INTEGER,
            target_price NUMERIC(14, 6),
            target_currency TEXT NOT NULL DEFAULT '',
            updated_by TEXT NOT NULL DEFAULT '',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS assessment_marks (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m045_notice_parse(conn) -> None:
    """What was read from a kept notice PDF, apart from the notice, until a person confirms it (see ``notice_parse.py``)."""

    conn.execute(
        """
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS parsed JSONB;
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS parse_state TEXT NOT NULL DEFAULT '';
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS parse_failures INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE pcns ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ;
        """,
        prepare=False,
    )


def _m046_rohs_exemptions(conn) -> None:
    """The RoHS exemptions a part relies on (such as 7(a), lead in high melting solder), named by a person from the manufacturer's declaration."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS rohs_exemptions (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            code TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            declared_by TEXT NOT NULL,
            declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, code)
        );
        """,
        prepare=False,
    )


def _m047_arrival_promises(conn) -> None:
    """Arrivals a distributor announced for a listing, and whether they came (see ``promises.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS arrival_promises (
            listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            expected DATE NOT NULL,
            quantity INTEGER NOT NULL,
            first_seen_at TIMESTAMPTZ NOT NULL,
            last_seen_at TIMESTAMPTZ NOT NULL,
            state TEXT NOT NULL CHECK (state IN ('open', 'arrived', 'slipped', 'gone')),
            resolved_at TIMESTAMPTZ,
            delay_days INTEGER,
            PRIMARY KEY (listing_id, expected)
        );
        """,
        prepare=False,
    )


def _m048_rate_limits(conn) -> None:
    """The limits a provider reported in its answer headers at the last test, as text (see ``http_client.limit_headers``)."""

    conn.execute(
        """
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS rate_limits JSONB NOT NULL DEFAULT '{}'::jsonb;
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS rate_limits_at TIMESTAMPTZ;
        """,
        prepare=False,
    )


def _m049_limit_marks(conn) -> None:
    """Readings and refusals that bracket a provider's reset (``limits.py``), and the header names a provider sends."""

    conn.execute(
        """
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS headers_seen JSONB NOT NULL DEFAULT '[]'::jsonb;
        ALTER TABLE connectors ADD COLUMN IF NOT EXISTS reset_from_provider BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE TABLE IF NOT EXISTS limit_marks (
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            at TIMESTAMPTZ NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('remaining', 'refused', 'ok')),
            remaining INTEGER,
            quota INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_limit_marks_connector ON limit_marks (connector_id, at);
        """,
        prepare=False,
    )


def _m050_drop_headers_seen(conn) -> None:
    """The header names a provider sent were only for finding out which providers report limits."""

    conn.execute("ALTER TABLE connectors DROP COLUMN IF EXISTS headers_seen;", prepare=False)


def _m051_project_opt_outs(conn) -> None:
    """A tracked project names the distributors it does not buy from, and the assembly-only ones it is built at.

    It used to name the ones it buys from, so a distributor added later was never used for it. A stored list becomes:
    every regular connector not in it is left out, and the assembly-only ones in it are kept.
    """

    from app.services.supply.providers import registry

    conn.execute(
        """
        ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS excluded_ids TEXT[] NOT NULL DEFAULT '{}';
        ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS assembly_ids TEXT[] NOT NULL DEFAULT '{}';
        """,
        prepare=False,
    )
    has_old = conn.execute(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'tracked_projects' "
        "AND column_name = 'connector_ids'"
    ).fetchone()
    if not has_old:
        return
    assembly = set()
    regular = set()
    for row in conn.execute("SELECT id, provider FROM connectors").fetchall():
        try:
            only = registry.get_spec(row["provider"]).assembly_only
        except registry.UnknownProvider:
            only = False
        (assembly if only else regular).add(row["id"])
    for row in conn.execute("SELECT project_id, connector_ids FROM tracked_projects WHERE connector_ids IS NOT NULL").fetchall():
        chosen = set(row["connector_ids"])
        conn.execute(
            "UPDATE tracked_projects SET excluded_ids = %s, assembly_ids = %s WHERE project_id = %s",
            (sorted(regular - chosen), sorted(chosen & assembly), row["project_id"]),
        )
    conn.execute("ALTER TABLE tracked_projects DROP COLUMN connector_ids", prepare=False)


def _m052_usage_symbol_facts(conn) -> None:
    """What a symbol says about itself beyond its part number: its datasheet address and the catalog component placed on it.

    Read back by ``bom_suggestions.py`` to say what Prism could add to the BOM."""

    conn.execute(
        """
        ALTER TABLE bom_usage ADD COLUMN IF NOT EXISTS datasheet TEXT NOT NULL DEFAULT '';
        ALTER TABLE bom_usage ADD COLUMN IF NOT EXISTS prism_id TEXT NOT NULL DEFAULT '';
        ALTER TABLE bom_usage_variants ADD COLUMN IF NOT EXISTS datasheet TEXT NOT NULL DEFAULT '';
        ALTER TABLE bom_usage_variants ADD COLUMN IF NOT EXISTS prism_id TEXT NOT NULL DEFAULT '';
        """,
        prepare=False,
    )


def _m053_no_stored_files(conn) -> None:
    """Prism keeps no files: no datasheet versions, no copies of notice PDFs, nothing read from them (plan 10, 2026-10-16).

    A part keeps its datasheet address (``parts.datasheet_url``) and a notice its link (``pcns.notice_url``)."""

    conn.execute(
        """
        DELETE FROM alerts WHERE kind = 'datasheet_changed';
        UPDATE alert_rules SET muted = array_remove(muted, 'datasheet_changed');
        DROP TABLE IF EXISTS datasheets;
        DROP TABLE IF EXISTS datasheet_checks;
        DROP TABLE IF EXISTS datasheet_denied_hosts;
        ALTER TABLE pcns DROP COLUMN IF EXISTS file_sha256;
        ALTER TABLE pcns DROP COLUMN IF EXISTS file_checked_at;
        ALTER TABLE pcns DROP COLUMN IF EXISTS file_status;
        ALTER TABLE pcns DROP COLUMN IF EXISTS file_failures;
        ALTER TABLE pcns DROP COLUMN IF EXISTS parsed;
        ALTER TABLE pcns DROP COLUMN IF EXISTS parse_state;
        ALTER TABLE pcns DROP COLUMN IF EXISTS parse_failures;
        ALTER TABLE pcns DROP COLUMN IF EXISTS parsed_at;
        """,
        prepare=False,
    )


def _m054_limit_scopes(conn) -> None:
    """Limit readings by the API that gave them: DigiKey's product API and its change-notice API have separate quotas."""

    conn.execute(
        """
        ALTER TABLE limit_marks ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT '';
        DELETE FROM limit_marks;
        UPDATE connectors SET rate_limits = '{}'::jsonb, rate_limits_at = NULL;
        """,
        prepare=False,
    )


def _m055_follow_all_variants(conn) -> None:
    """A tracked project can follow every design variant it has, including ones added to it later."""

    conn.execute("ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS all_variants BOOLEAN NOT NULL DEFAULT FALSE", prepare=False)


def _m056_makers_without_friction(conn) -> None:
    """Parts exist before their maker is settled; distributors' answers settle it (``makers.py``, ``settle.py``)."""

    conn.execute(
        """
        ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS provisional BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE manufacturer_aliases ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'person';

        CREATE TABLE IF NOT EXISTS part_spellings (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            alias_key TEXT NOT NULL,
            alias_text TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'learned',
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, alias_key)
        );
        CREATE INDEX IF NOT EXISTS idx_part_spellings_key ON part_spellings (alias_key);

        CREATE TABLE IF NOT EXISTS alias_rejections (
            alias_key TEXT NOT NULL,
            manufacturer_id TEXT NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
            rejected_by TEXT NOT NULL DEFAULT '',
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (alias_key, manufacturer_id)
        );
        """,
        prepare=False,
    )
    # What waits today is classified again under the new rules.
    from app.services.supply import maker_backfill

    maker_backfill.run(conn)


def _m057_part_numbers(conn) -> None:
    """Other numbers a part is sold under (a packaging suffix, a family number), beside the catalog's own."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_numbers (
            part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
            mpn TEXT NOT NULL,
            match_key TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'person',
            created_by TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, match_key)
        );
        CREATE INDEX IF NOT EXISTS idx_part_numbers_key ON part_numbers (match_key);
        """,
        prepare=False,
    )


def _m058_buying_for(conn) -> None:
    """What a tracked project buys for: prototypes (cut tape, small orders) or production (reels)."""

    conn.execute("ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS buying_for TEXT NOT NULL DEFAULT 'prototypes'", prepare=False)


def _m059_ask_maker(conn) -> None:
    """A part whose maker a person took back from Prism: it is asked about again instead of settling by itself."""

    conn.execute("ALTER TABLE parts ADD COLUMN IF NOT EXISTS ask_maker BOOLEAN NOT NULL DEFAULT FALSE", prepare=False)


def _m060_maker_seeds(conn) -> None:
    """The usual spellings of large makers, as rows an administrator can read and change (they began as a list in code)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS maker_seeds (
            alias_key TEXT PRIMARY KEY,
            group_key TEXT NOT NULL,
            alias_text TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'seeded'
        );
        CREATE INDEX IF NOT EXISTS idx_maker_seeds_group ON maker_seeds (group_key);
        """,
        prepare=False,
    )
    from app.services.supply import makers
    from app.services.supply.identity import alias_key

    for group in makers.default_spellings():
        head = alias_key(group[0])
        for spelling in group:
            conn.execute(
                "INSERT INTO maker_seeds (alias_key, group_key, alias_text) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (alias_key(spelling), head, spelling.title() if spelling.islower() and len(spelling) > 3 else spelling.upper() if len(spelling) <= 3 else spelling),
            )


def _seed_makers(conn) -> None:
    """Add the usual spellings in code that the table does not have yet (a group's head is its first spelling)."""

    from app.services.supply import makers
    from app.services.supply.identity import alias_key

    for group in makers.default_spellings():
        head = alias_key(group[0])
        for spelling in group:
            conn.execute(
                "INSERT INTO maker_seeds (alias_key, group_key, alias_text) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (alias_key(spelling), head, spelling.title() if spelling.islower() and len(spelling) > 3 else spelling.upper() if len(spelling) <= 3 else spelling),
            )


def _m061_number_suffixes(conn) -> None:
    """The endings makers put on a base number, as rows an administrator can read and change (a list that was in code)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS number_suffixes (
            suffix_key TEXT PRIMARY KEY,
            suffix_text TEXT NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('packaging', 'grade')),
            source TEXT NOT NULL DEFAULT 'seeded'
        );
        """,
        prepare=False,
    )
    from app.services.supply import number_suffixes

    _seed_makers(conn)
    for key, kind in number_suffixes.DEFAULTS:
        conn.execute(
            "INSERT INTO number_suffixes (suffix_key, suffix_text, kind) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", (key, key, kind)
        )


def _m062_part_insights(conn) -> None:
    """What the history says about each tracked part, kept so the Dashboard and Insights can list and chart every part."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_insights (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            computed_at TIMESTAMPTZ NOT NULL,
            data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        """,
        prepare=False,
    )


def _m063_figure_history(conn) -> None:
    """The Dashboard's figures, one value a day, so each can show how it moved. Parts that found nothing countable are searched again."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS figure_history (
            day DATE NOT NULL,
            metric TEXT NOT NULL,
            value INTEGER NOT NULL,
            PRIMARY KEY (day, metric)
        );
        """,
        prepare=False,
    )
    # Searches now keep the longer numbers distributors list. A part that found nothing countable is searched again, from the
    # committed share, the next time the scheduler looks.
    conn.execute(
        """
        UPDATE discovery_runs SET last_run_at = '2000-01-01'::timestamptz
        WHERE part_id NOT IN (SELECT part_id FROM listings WHERE part_id IS NOT NULL AND match_state IN ('exact', 'manual'))
        """,
        prepare=False,
    )


def _m064_maker_seeds_added(conn) -> None:
    """Spellings added to the usual list after migration 60 (TAI-SAW's own brand, TST)."""

    _seed_makers(conn)


def _m065_family_done(conn) -> None:
    """Whether the looser search for a part's longer numbers has been made at a connector (once, and again when its numbers change)."""

    conn.execute("ALTER TABLE discovery_runs ADD COLUMN IF NOT EXISTS family_done BOOLEAN NOT NULL DEFAULT FALSE", prepare=False)


def _m066_drop_demands(conn) -> None:
    """Demand and planned builds are left to the manufacturing feature: the table that held them goes."""

    conn.execute("DROP TABLE IF EXISTS demands", prepare=False)


def _m067_cost_history_outliers(conn) -> None:
    """A Farnell pack priced as one piece (a coin cell at EUR 1,476) made some projects' cost per board absurd; those days go."""

    conn.execute(
        """
        DELETE FROM bom_cost_history h
        USING (
            SELECT project_id, variant, percentile_cont(0.5) WITHIN GROUP (ORDER BY cost_per_board) AS median
            FROM bom_cost_history GROUP BY project_id, variant
        ) m
        WHERE h.project_id = m.project_id AND h.variant = m.variant AND m.median > 0 AND h.cost_per_board > m.median * 100
        """,
        prepare=False,
    )


def _m068_drop_worker_seen(conn) -> None:
    """The worker no longer reports itself; the table that held its report goes."""

    conn.execute("DROP TABLE IF EXISTS worker_seen", prepare=False)


def _m069_offer_reel(conn) -> None:
    """A listing keeps the pieces on its full reel and whether its packaging was guessed."""

    conn.execute(
        """
        ALTER TABLE offers ADD COLUMN IF NOT EXISTS reel_size INTEGER;
        ALTER TABLE offers ADD COLUMN IF NOT EXISTS packaging_inferred BOOLEAN NOT NULL DEFAULT FALSE;
        """,
        prepare=False,
    )


def _m070_project_packaging(conn) -> None:
    """A project says which packaging it prefers instead of what it buys for; Prism's own picks note when they fell back."""

    conn.execute(
        """
        ALTER TABLE tracked_projects ADD COLUMN IF NOT EXISTS packaging TEXT NOT NULL DEFAULT 'cut_tape';
        UPDATE tracked_projects SET packaging = 'tape_reel' WHERE buying_for = 'production';
        ALTER TABLE tracked_projects DROP COLUMN IF EXISTS buying_for;
        ALTER TABLE packaging_picks ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
        """,
        prepare=False,
    )


def _m071_part_preferences(conn) -> None:
    """A person's preferred distributor for a part: shown first, and marked in lists."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS part_preferences (
            part_id TEXT PRIMARY KEY REFERENCES parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
            set_by TEXT NOT NULL DEFAULT '',
            set_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """,
        prepare=False,
    )


def _m072_cost_history_rollup(conn) -> None:
    """The day's BOM rollup is kept with the cost (boards the stock covers, money out, parts at risk) for the Projects rows."""

    conn.execute("ALTER TABLE bom_cost_history ADD COLUMN IF NOT EXISTS rollup JSONB NOT NULL DEFAULT '{}'::jsonb", prepare=False)


MIGRATIONS: List[Tuple[int, str, Callable[[object], None]]] = [
    (1, "connectors_quota_audit", _m001_connectors_quota_audit),
    (2, "csv_offers", _m002_csv_offers),
    (3, "parts_and_listings", _m003_parts_and_listings),
    (4, "watches_offers_samples", _m004_watches_offers_samples),
    (5, "discovery_runs", _m005_discovery_runs),
    (6, "events_rollups", _m006_events_rollups),
    (7, "alerts", _m007_alerts),
    (8, "bom_usage", _m008_bom_usage),
    (9, "usage_visibility", _m009_usage_visibility),
    (10, "component_sources", _m010_component_sources),
    (11, "waivers", _m011_waivers),
    (12, "release_snapshots", _m012_release_snapshots),
    (13, "settings", _m013_settings),
    (14, "demands", _m014_demands),
    (15, "fx_rates", _m015_fx_rates),
    (16, "datasheets", _m016_datasheets),
    (17, "reach", _m017_reach),
    (18, "market_indices", _m018_market_indices),
    (19, "pcns", _m019_pcns),
    (20, "part_params", _m020_part_params),
    (21, "distributor_details", _m021_distributor_details),
    (22, "usage_lcsc", _m022_usage_lcsc),
    (23, "connector_retention", _m023_connector_retention),
    (24, "market_categories", _m024_market_categories),
    (25, "worker_seen", _m025_worker_seen),
    (26, "watch_packaging", _m026_watch_packaging),
    (27, "component_watches", _m027_component_watches),
    (28, "datasheet_denied_hosts", _m028_datasheet_denied_hosts),
    (29, "notice_files", _m029_notice_files),
    (30, "release_compliance", _m030_release_compliance),
    (31, "bom_comments", _m031_bom_comments),
    (32, "bom_usage_variants", _m032_bom_usage_variants),
    (33, "connector_keep_days", _m033_connector_keep_days),
    (34, "variant_usage_keys", _m034_variant_usage_keys),
    (35, "tracking", _m035_tracking),
    (36, "poll_schedules", _m036_poll_schedules),
    (37, "release_snapshot_jobs", _m037_release_snapshot_jobs),
    (38, "part_summaries", _m038_part_summaries),
    (39, "summary_dirty_log", _m039_summary_dirty_log),
    (40, "read_requests", _m040_read_requests),
    (41, "catch_up", _m041_catch_up),
    (42, "sample_order_terms", _m042_sample_order_terms),
    (43, "bom_cost_history", _m043_bom_cost_history),
    (44, "alert_rules", _m044_alert_rules),
    (45, "notice_parse", _m045_notice_parse),
    (46, "rohs_exemptions", _m046_rohs_exemptions),
    (47, "arrival_promises", _m047_arrival_promises),
    (48, "rate_limits", _m048_rate_limits),
    (49, "limit_marks", _m049_limit_marks),
    (50, "drop_headers_seen", _m050_drop_headers_seen),
    (51, "project_opt_outs", _m051_project_opt_outs),
    (52, "usage_symbol_facts", _m052_usage_symbol_facts),
    (53, "no_stored_files", _m053_no_stored_files),
    (54, "limit_scopes", _m054_limit_scopes),
    (55, "follow_all_variants", _m055_follow_all_variants),
    (56, "makers_without_friction", _m056_makers_without_friction),
    (57, "part_numbers", _m057_part_numbers),
    (58, "buying_for", _m058_buying_for),
    (59, "ask_maker", _m059_ask_maker),
    (60, "maker_seeds", _m060_maker_seeds),
    (61, "number_suffixes", _m061_number_suffixes),
    (62, "part_insights", _m062_part_insights),
    (63, "figure_history", _m063_figure_history),
    (64, "maker_seeds_added", _m064_maker_seeds_added),
    (65, "family_done", _m065_family_done),
    (66, "drop_demands", _m066_drop_demands),
    (67, "cost_history_outliers", _m067_cost_history_outliers),
    (68, "drop_worker_seen", _m068_drop_worker_seen),
    (69, "offer_reel", _m069_offer_reel),
    (70, "project_packaging", _m070_project_packaging),
    (71, "part_preferences", _m071_part_preferences),
    (72, "cost_history_rollup", _m072_cost_history_rollup),
]


def applied_versions(conn) -> set[int]:
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {LEDGER_TABLE} (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    return {int(row["version"]) for row in conn.execute(f"SELECT version FROM {LEDGER_TABLE}").fetchall()}


def apply_supply_migrations(conn) -> List[int]:
    """Apply every pending migration in order; return the versions applied.

    Runs inside the caller's transaction and advisory lock, so a crash in the
    middle of a step rolls the step and its ledger row back together.
    """

    applied = applied_versions(conn)
    newly: List[int] = []
    for version, name, migration in MIGRATIONS:
        if version in applied:
            continue
        logger.info("Applying supply schema migration %s (%s)", version, name)
        migration(conn)
        conn.execute(
            f"INSERT INTO {LEDGER_TABLE}(version, name) VALUES (%s, %s)",
            (version, name),
        )
        newly.append(version)
    return newly
