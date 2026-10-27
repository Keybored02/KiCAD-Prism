"""Supply schema migrations: the first migrations (connectors, parts, listings, watches, alerts and the facts built on them).

Applied migrations are never edited. ``schema_migrations`` lists every step in order and runs them.
"""

from __future__ import annotations

from typing import Any, Callable, List, Tuple  # noqa: F401


def _m001_connectors_quota_audit(conn) -> None:
    """Distributor connectors, the daily call ledger, and the audit trail.

    ``credential_envelope`` is the encrypted credential set; ``credential_names``
    lists which credentials are set so the UI can show that without decrypting.
    ``UNIQUE (provider, storefront)`` is the one-connector-per-storefront rule.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_connectors (
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

        CREATE TABLE IF NOT EXISTS supply_quota_ledger (
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            day DATE NOT NULL,
            spent INTEGER NOT NULL DEFAULT 0 CHECK (spent >= 0),
            interactive_spent INTEGER NOT NULL DEFAULT 0
                CHECK (interactive_spent >= 0 AND interactive_spent <= spent),
            PRIMARY KEY (connector_id, day)
        );

        CREATE TABLE IF NOT EXISTS supply_audit_events (
            id BIGSERIAL PRIMARY KEY,
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            subject_kind TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            detail JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_supply_audit_subject
            ON supply_audit_events(subject_kind, subject_id, at);
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
        CREATE TABLE IF NOT EXISTS supply_csv_imports (
            connector_id TEXT PRIMARY KEY REFERENCES supply_connectors(id) ON DELETE CASCADE,
            filename TEXT NOT NULL DEFAULT '',
            imported_by TEXT NOT NULL,
            imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            row_count INTEGER NOT NULL CHECK (row_count >= 0)
        );

        CREATE TABLE IF NOT EXISTS supply_csv_offers (
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
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
        CREATE INDEX IF NOT EXISTS idx_supply_csv_offers_match ON supply_csv_offers (connector_id, match_key);
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
        CREATE TABLE IF NOT EXISTS supply_manufacturers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_key TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supply_manufacturer_aliases (
            alias_key TEXT PRIMARY KEY,
            alias_text TEXT NOT NULL,
            manufacturer_id TEXT REFERENCES supply_manufacturers(id) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK (status IN ('confirmed', 'pending')),
            seen_at_provider TEXT NOT NULL DEFAULT '',
            confirmed_by TEXT NOT NULL DEFAULT '',
            first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CHECK ((status = 'confirmed') = (manufacturer_id IS NOT NULL))
        );

        CREATE TABLE IF NOT EXISTS supply_parts (
            id TEXT PRIMARY KEY,
            manufacturer_id TEXT NOT NULL REFERENCES supply_manufacturers(id),
            mpn TEXT NOT NULL,
            match_key TEXT NOT NULL,
            lifecycle TEXT NOT NULL DEFAULT 'unknown',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (manufacturer_id, match_key)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_parts_match_key ON supply_parts (match_key);

        CREATE TABLE IF NOT EXISTS supply_listings (
            id TEXT PRIMARY KEY,
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            sku TEXT NOT NULL,
            part_id TEXT REFERENCES supply_parts(id) ON DELETE SET NULL,
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
        CREATE INDEX IF NOT EXISTS idx_supply_listings_part ON supply_listings (part_id, match_state);
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
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMPTZ;

        CREATE TABLE IF NOT EXISTS supply_watches (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL UNIQUE REFERENCES supply_parts(id) ON DELETE CASCADE,
            threshold INTEGER CHECK (threshold IS NULL OR threshold >= 0),
            pinned BOOLEAN NOT NULL DEFAULT FALSE,
            owner TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supply_offers (
            listing_id TEXT PRIMARY KEY REFERENCES supply_listings(id) ON DELETE CASCADE,
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

        CREATE TABLE IF NOT EXISTS supply_samples (
            listing_id TEXT NOT NULL REFERENCES supply_listings(id) ON DELETE CASCADE,
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

        CREATE TABLE IF NOT EXISTS supply_poll_state (
            listing_id TEXT PRIMARY KEY REFERENCES supply_listings(id) ON DELETE CASCADE,
            tier TEXT NOT NULL CHECK (tier IN ('hot', 'warm', 'normal', 'cold')),
            next_poll_at TIMESTAMPTZ NOT NULL,
            last_polled_at TIMESTAMPTZ,
            last_change_at TIMESTAMPTZ,
            error_streak INTEGER NOT NULL DEFAULT 0,
            missing_streak INTEGER NOT NULL DEFAULT 0,
            last_error_code TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_supply_poll_state_due ON supply_poll_state (next_poll_at);
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
        CREATE TABLE IF NOT EXISTS supply_discovery_runs (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
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
        ALTER TABLE supply_samples ADD COLUMN IF NOT EXISTS marketplace BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_supply_samples_sampled_at ON supply_samples (sampled_at);

        CREATE TABLE IF NOT EXISTS supply_samples_daily (
            listing_id TEXT NOT NULL REFERENCES supply_listings(id) ON DELETE CASCADE,
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

        CREATE TABLE IF NOT EXISTS supply_events (
            id BIGSERIAL PRIMARY KEY,
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            kind TEXT NOT NULL,
            part_id TEXT REFERENCES supply_parts(id) ON DELETE CASCADE,
            listing_id TEXT REFERENCES supply_listings(id) ON DELETE CASCADE,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_supply_events_part ON supply_events (part_id, at);
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
        CREATE TABLE IF NOT EXISTS supply_alerts (
            id BIGSERIAL PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
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
        CREATE UNIQUE INDEX IF NOT EXISTS idx_supply_alerts_one_live
            ON supply_alerts (part_id, kind) WHERE state <> 'resolved';
        CREATE INDEX IF NOT EXISTS idx_supply_alerts_state ON supply_alerts (state, last_event_at);
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
        CREATE TABLE IF NOT EXISTS supply_bom_usage_projects (
            project_id TEXT PRIMARY KEY,
            project_name TEXT NOT NULL,
            revision_key TEXT NOT NULL,
            line_count INTEGER NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS supply_bom_usage (
            project_id TEXT NOT NULL REFERENCES supply_bom_usage_projects(project_id) ON DELETE CASCADE,
            line_key TEXT NOT NULL,
            manufacturer TEXT NOT NULL DEFAULT '',
            mpn TEXT NOT NULL,
            alias_key TEXT NOT NULL DEFAULT '',
            match_key TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 1),
            refs TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (project_id, line_key)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_bom_usage_match ON supply_bom_usage (match_key);
        """,
        prepare=False,
    )


def _m009_usage_visibility(conn) -> None:
    """Which roles may see a project, copied from its folder when usage is read.

    A folder can hide its projects from some roles. Usage is a cache over every project, so each
    project carries the supply roles that may see it and reads filter on the caller's role.
    """

    conn.execute(
        "ALTER TABLE supply_bom_usage_projects ADD COLUMN IF NOT EXISTS visible_roles TEXT[] NOT NULL DEFAULT '{admin,designer,qa}'",
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
        CREATE TABLE IF NOT EXISTS supply_component_sources (
            id TEXT PRIMARY KEY,
            component_id TEXT NOT NULL,
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            approval TEXT NOT NULL CHECK (approval IN ('pending', 'approved', 'rejected')),
            rank INTEGER NOT NULL CHECK (rank >= 1),
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            decided_by TEXT NOT NULL DEFAULT '',
            decided_at TIMESTAMPTZ,
            UNIQUE (component_id, part_id)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_component_sources_part ON supply_component_sources (part_id);
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
        CREATE TABLE IF NOT EXISTS supply_waivers (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            check_id TEXT NOT NULL,
            scope TEXT NOT NULL,
            reason TEXT NOT NULL,
            state TEXT NOT NULL CHECK (state IN ('proposed', 'approved', 'rejected')),
            proposed_by TEXT NOT NULL,
            proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            decided_by TEXT NOT NULL DEFAULT '',
            decided_at TIMESTAMPTZ
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_supply_waivers_open ON supply_waivers (part_id, check_id) WHERE state <> 'rejected';
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
        CREATE TABLE IF NOT EXISTS supply_release_snapshots (
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
        CREATE INDEX IF NOT EXISTS idx_supply_release_snapshots_project ON supply_release_snapshots (project_id, created_at DESC);
        CREATE OR REPLACE FUNCTION supply_release_snapshots_frozen() RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'A release snapshot cannot be changed or removed';
        END;
        $$ LANGUAGE plpgsql;
        DROP TRIGGER IF EXISTS trg_supply_release_snapshots_frozen ON supply_release_snapshots;
        CREATE TRIGGER trg_supply_release_snapshots_frozen BEFORE UPDATE OR DELETE ON supply_release_snapshots
            FOR EACH ROW EXECUTE FUNCTION supply_release_snapshots_frozen();
        """,
        prepare=False,
    )


def _m013_settings(conn) -> None:
    """Workspace settings for supply, one JSON value per area. Absent means the defaults in code."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_settings (
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
        CREATE TABLE IF NOT EXISTS supply_demands (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
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
        CREATE INDEX IF NOT EXISTS idx_supply_demands_part ON supply_demands (part_id, state, need_by);
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
        CREATE TABLE IF NOT EXISTS supply_fx_rates (
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
        ALTER TABLE supply_parts ADD COLUMN IF NOT EXISTS datasheet_url TEXT NOT NULL DEFAULT '';
        CREATE TABLE IF NOT EXISTS supply_datasheets (
            id TEXT PRIMARY KEY,
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
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
        CREATE TABLE IF NOT EXISTS supply_datasheet_checks (
            part_id TEXT PRIMARY KEY REFERENCES supply_parts(id) ON DELETE CASCADE,
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
        ALTER TABLE supply_offers ADD COLUMN IF NOT EXISTS reach_affected BOOLEAN;
        CREATE TABLE IF NOT EXISTS supply_svhc_substances (
            cas TEXT NOT NULL,
            name TEXT NOT NULL,
            ec TEXT NOT NULL DEFAULT '',
            added_on DATE,
            PRIMARY KEY (cas, name)
        );
        CREATE TABLE IF NOT EXISTS supply_svhc_list (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            loaded_at TIMESTAMPTZ NOT NULL,
            loaded_by TEXT NOT NULL,
            source_name TEXT NOT NULL DEFAULT '',
            substances INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS supply_part_substances (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
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
        CREATE TABLE IF NOT EXISTS supply_market_indices (
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
        CREATE TABLE IF NOT EXISTS supply_pcns (
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
        CREATE TABLE IF NOT EXISTS supply_pcn_parts (
            pcn_id TEXT NOT NULL REFERENCES supply_pcns(id) ON DELETE CASCADE,
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            PRIMARY KEY (pcn_id, part_id)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_pcn_parts_part ON supply_pcn_parts (part_id);
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
        CREATE TABLE IF NOT EXISTS supply_part_params (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            name TEXT NOT NULL,
            raw TEXT NOT NULL,
            observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, provider, name)
        );
        """,
        prepare=False,
    )
