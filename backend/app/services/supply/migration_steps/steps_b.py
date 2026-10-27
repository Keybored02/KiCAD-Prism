"""Supply schema migrations: the tracking, summaries and catch-up migrations and what followed them.

Applied migrations are never edited. ``schema_migrations`` lists every step in order and runs them.
"""

from __future__ import annotations


def _m040_read_requests(conn) -> None:
    """A BOM or a component someone asked to check once (see ``oneoff.py``): read at every distributor, tracked by nobody.

    ``read_request_work`` has a row for each part and distributor still to be read. It is paid from the pool, and from
    spare budget when the pool is empty, so a large BOM finishes over evenings and weekends.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_read_requests (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL CHECK (kind IN ('bom', 'component')),
            project_id TEXT NOT NULL DEFAULT '',
            requested_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            finished_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_supply_read_requests_open ON supply_read_requests (created_at) WHERE finished_at IS NULL;
        CREATE TABLE IF NOT EXISTS supply_read_request_work (
            request_id TEXT NOT NULL REFERENCES supply_read_requests(id) ON DELETE CASCADE,
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'done', 'failed')),
            attempts INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (request_id, part_id, connector_id)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_read_request_work_connector ON supply_read_request_work (connector_id, state);
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
        CREATE TABLE IF NOT EXISTS supply_summary_dirty (
            id BIGSERIAL PRIMARY KEY,
            part_id TEXT NOT NULL,
            xid BIGINT NOT NULL DEFAULT (pg_current_xact_id()::text::bigint)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_summary_dirty_part ON supply_summary_dirty (part_id, xid);
        ALTER TABLE supply_part_summaries DROP COLUMN IF EXISTS stale;
        ALTER TABLE supply_part_summaries DROP COLUMN IF EXISTS version;
        ALTER TABLE supply_part_summaries ADD COLUMN IF NOT EXISTS snap BIGINT NOT NULL DEFAULT 0;
        DELETE FROM supply_part_summaries;

        CREATE OR REPLACE FUNCTION supply_summary_stale(pid TEXT) RETURNS VOID AS $$
        BEGIN
            IF pid IS NOT NULL THEN INSERT INTO supply_summary_dirty (part_id) VALUES (pid); END IF;
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
        CREATE TABLE IF NOT EXISTS supply_part_summaries (
            part_id TEXT PRIMARY KEY REFERENCES supply_parts(id) ON DELETE CASCADE,
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            stale BOOLEAN NOT NULL DEFAULT TRUE,
            version BIGINT NOT NULL DEFAULT 0,
            computed_at TIMESTAMPTZ
        );

        CREATE OR REPLACE FUNCTION supply_summary_stale(pid TEXT) RETURNS VOID AS $$
        BEGIN
            IF pid IS NULL THEN RETURN; END IF;
            INSERT INTO supply_part_summaries (part_id) SELECT p.id FROM supply_parts p WHERE p.id = pid
            ON CONFLICT (part_id) DO UPDATE SET stale = TRUE, version = supply_part_summaries.version + 1;
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
            PERFORM supply_summary_stale((SELECT part_id FROM supply_listings WHERE id = COALESCE(NEW.listing_id, OLD.listing_id)));
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_supply_summary_listings ON supply_listings;
        CREATE TRIGGER trg_supply_summary_listings AFTER INSERT OR UPDATE OR DELETE ON supply_listings
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_supply_summary_watches ON supply_watches;
        CREATE TRIGGER trg_supply_summary_watches AFTER INSERT OR UPDATE OR DELETE ON supply_watches
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_supply_summary_picks ON supply_packaging_picks;
        CREATE TRIGGER trg_supply_summary_picks AFTER INSERT OR UPDATE OR DELETE ON supply_packaging_picks
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_supply_summary_discovery ON supply_discovery_runs;
        CREATE TRIGGER trg_supply_summary_discovery AFTER INSERT OR UPDATE OR DELETE ON supply_discovery_runs
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part();
        DROP TRIGGER IF EXISTS trg_supply_summary_offers ON supply_offers;
        CREATE TRIGGER trg_supply_summary_offers AFTER INSERT OR UPDATE OR DELETE ON supply_offers
            FOR EACH ROW EXECUTE FUNCTION supply_summary_by_listing();
        DROP TRIGGER IF EXISTS trg_supply_summary_poll_state ON supply_poll_state;
        CREATE TRIGGER trg_supply_summary_poll_state AFTER INSERT OR UPDATE OF tier OR DELETE ON supply_poll_state
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
        CREATE TABLE IF NOT EXISTS supply_release_snapshot_jobs (
            build_id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            state TEXT NOT NULL CHECK (state IN ('queued', 'done', 'failed')),
            reason TEXT NOT NULL DEFAULT '',
            attempts INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_supply_release_snapshot_jobs_project ON supply_release_snapshot_jobs (project_id);
        """,
        prepare=False,
    )


def _m036_poll_schedules(conn) -> None:
    """A listing's schedule is daily, weekly or monthly (its part's tracking rate), not a risk tier; ``urgency`` orders the day's queue."""

    conn.execute("ALTER TABLE supply_poll_state DROP CONSTRAINT IF EXISTS supply_poll_state_tier_check", prepare=False)
    conn.execute("UPDATE supply_poll_state SET tier = 'daily' WHERE tier IN ('hot', 'warm', 'normal', 'cold')", prepare=False)
    conn.execute(
        "ALTER TABLE supply_poll_state ADD CONSTRAINT supply_poll_state_tier_check CHECK (tier IN ('daily', 'weekly', 'monthly'))", prepare=False
    )
    conn.execute("ALTER TABLE supply_poll_state ADD COLUMN IF NOT EXISTS urgency SMALLINT NOT NULL DEFAULT 2", prepare=False)
    conn.execute("ALTER TABLE supply_quota_ledger ADD COLUMN IF NOT EXISTS spare_spent INTEGER NOT NULL DEFAULT 0", prepare=False)


def _m035_tracking(conn) -> None:
    """Tracking tiers, the call budget's accounting and packaging picks (see ``tracking.py``, ``budget.py``).

    A watch is a person's choice of tier 1 (daily) or tier 2 (weekly or monthly); ``origin`` says where it came from.
    ``part_tiers`` is derived from every source and says why. ``admissions`` says where a part is read or waits for room.
    ``call_counts`` is the ledger's breakdown by kind and purpose. A connector's ``account_key`` is a keyed hash of its
    credentials, so connectors on one key share a budget; the reset time is the provider's own day. The committed share is what ``interactive_reserve_pct`` leaves.
    """

    conn.execute(
        """
        ALTER TABLE supply_watches ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2));
        ALTER TABLE supply_watches ADD COLUMN IF NOT EXISTS rate TEXT NOT NULL DEFAULT 'weekly' CHECK (rate IN ('daily', 'weekly', 'monthly'));
        ALTER TABLE supply_watches ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'legacy' CHECK (origin IN ('person', 'component', 'legacy'));
        ALTER TABLE supply_watches ALTER COLUMN origin SET DEFAULT 'person';
        ALTER TABLE supply_component_watches ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2));
        ALTER TABLE supply_component_watches ADD COLUMN IF NOT EXISTS rate TEXT NOT NULL DEFAULT 'weekly' CHECK (rate IN ('daily', 'weekly', 'monthly'));

        CREATE TABLE IF NOT EXISTS supply_tracked_projects (
            project_id TEXT PRIMARY KEY,
            variants TEXT[] NOT NULL DEFAULT '{""}',
            connector_ids TEXT[],
            tracked_by TEXT NOT NULL,
            tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supply_part_tiers (
            part_id TEXT PRIMARY KEY REFERENCES supply_parts(id) ON DELETE CASCADE,
            tier SMALLINT NOT NULL CHECK (tier IN (1, 2)),
            rate TEXT NOT NULL CHECK (rate IN ('daily', 'weekly', 'monthly')),
            reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_supply_part_tiers_tier ON supply_part_tiers (tier, part_id);

        CREATE TABLE IF NOT EXISTS supply_admissions (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            state TEXT NOT NULL CHECK (state IN ('admitted', 'waiting')),
            since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, connector_id)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_admissions_connector ON supply_admissions (connector_id, state, since);

        CREATE TABLE IF NOT EXISTS supply_packaging_picks (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            listing_id TEXT NOT NULL REFERENCES supply_listings(id) ON DELETE CASCADE,
            picked_by TEXT NOT NULL,
            picked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, connector_id)
        );

        CREATE TABLE IF NOT EXISTS supply_call_counts (
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            day DATE NOT NULL,
            hour SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
            kind TEXT NOT NULL,
            purpose TEXT NOT NULL,
            calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0),
            PRIMARY KEY (connector_id, day, hour, kind, purpose)
        );

        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS account_key TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS reset_time TEXT NOT NULL DEFAULT '00:00';
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS reset_tz TEXT NOT NULL DEFAULT 'UTC';
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS error_streak INTEGER NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_supply_connectors_account ON supply_connectors (account_key) WHERE account_key <> '';
        """,
        prepare=False,
    )
    # Every part watched before tiers is tier 2, weekly; its reason says so.
    conn.execute(
        """
        INSERT INTO supply_part_tiers (part_id, tier, rate, reasons)
        SELECT part_id, tier, rate, jsonb_build_array(jsonb_build_object('kind', origin, 'ref', id)) FROM supply_watches
        ON CONFLICT (part_id) DO NOTHING
        """,
        prepare=False,
    )
    # A watch's packaging policy becomes a pick where a listing of that packaging exists (the first by SKU).
    conn.execute(
        """
        INSERT INTO supply_packaging_picks (part_id, connector_id, listing_id, picked_by)
        SELECT DISTINCT ON (l.part_id, l.connector_id) l.part_id, l.connector_id, l.id, 'migration'
        FROM supply_watches w JOIN supply_listings l ON l.part_id = w.part_id
        WHERE w.packaging <> 'any' AND l.packaging = w.packaging AND l.match_state IN ('exact', 'manual')
        ORDER BY l.part_id, l.connector_id, l.sku
        ON CONFLICT (part_id, connector_id) DO NOTHING
        """,
        prepare=False,
    )


def _m034_variant_usage_keys(conn) -> None:
    """The match keys of variant lines, so a part only a design variant fits is found as in use like any other."""

    conn.execute("ALTER TABLE supply_bom_usage_variants ADD COLUMN IF NOT EXISTS alias_key TEXT NOT NULL DEFAULT ''", prepare=False)
    conn.execute("ALTER TABLE supply_bom_usage_variants ADD COLUMN IF NOT EXISTS match_key TEXT NOT NULL DEFAULT ''", prepare=False)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_supply_bom_usage_variants_match_key ON supply_bom_usage_variants (match_key)", prepare=False)


def _m033_connector_keep_days(conn) -> None:
    """Days any history of a connector's listings may be kept, for a provider whose terms limit storage. Empty means for good."""

    conn.execute("ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS keep_days INTEGER CHECK (keep_days BETWEEN 1 AND 3650)", prepare=False)


def _m032_bom_usage_variants(conn) -> None:
    """The BOM lines of each design variant of a project, beside the base design's ``bom_usage`` (see ``usage.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_bom_usage_variants (
            project_id TEXT NOT NULL REFERENCES supply_bom_usage_projects(project_id) ON DELETE CASCADE,
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
        CREATE TABLE IF NOT EXISTS supply_bom_comments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            line_key TEXT NOT NULL,
            body TEXT NOT NULL,
            author TEXT NOT NULL,
            author_name TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_supply_bom_comments_project ON supply_bom_comments (project_id, line_key, created_at);
        """,
        prepare=False,
    )


def _m030_release_compliance(conn) -> None:
    """The compliance draft as it stood when a release was published, kept beside the rest of its snapshot.

    Snapshots are never updated, so the column is filled at insert. Snapshots taken before this have none.
    """

    conn.execute("ALTER TABLE supply_release_snapshots ADD COLUMN IF NOT EXISTS compliance JSONB", prepare=False)


def _m029_notice_files(conn) -> None:
    """A kept copy of a notice's PDF: its hash (the file is stored like a datasheet), and when and how the last try went."""

    conn.execute(
        """
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS file_sha256 TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS file_checked_at TIMESTAMPTZ;
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS file_status TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS file_failures INTEGER NOT NULL DEFAULT 0;
        """,
        prepare=False,
    )


def _m028_datasheet_denied_hosts(conn) -> None:
    """Hosts datasheets are never fetched from, set by an administrator (see ``datasheets.deny``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_datasheet_denied_hosts (
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
        CREATE TABLE IF NOT EXISTS supply_component_watches (
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
        "ALTER TABLE supply_watches ADD COLUMN IF NOT EXISTS packaging TEXT NOT NULL DEFAULT 'any' "
        "CHECK (packaging IN ('any', 'cut_tape', 'tape_reel', 'tray', 'tube', 'bulk'))",
        prepare=False,
    )


def _m025_worker_seen(conn) -> None:
    """The worker's last report of the providers it knows and the age of its code (see ``worker_seen.py``)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_worker_seen (
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

    conn.execute("ALTER TABLE supply_market_indices DROP CONSTRAINT IF EXISTS supply_market_indices_scope_kind_check", prepare=False)
    conn.execute(
        "ALTER TABLE supply_market_indices ADD CONSTRAINT supply_market_indices_scope_kind_check CHECK (scope_kind IN ('all', 'manufacturer', 'category'))",
        prepare=False,
    )


def _m023_connector_retention(conn) -> None:
    """Days raw samples are kept per connector, for a provider whose terms limit how long its data may be stored."""

    conn.execute("ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS retention_days INTEGER CHECK (retention_days BETWEEN 1 AND 365)", prepare=False)


def _m022_usage_lcsc(conn) -> None:
    """The LCSC number a BOM line's symbol carries, kept with the stored line so lines read later resolve through it."""

    conn.execute("ALTER TABLE supply_bom_usage ADD COLUMN IF NOT EXISTS lcsc TEXT NOT NULL DEFAULT ''", prepare=False)


def _m021_distributor_details(conn) -> None:
    """Compliance and trade facts, a person's sign-in at a distributor, and notices read from distributors.

    ``part_facts`` holds what each provider states about a part (see ``facts.py``). ``connector_grants`` holds a
    sealed user grant (DigiKey change notices need one); ``oauth_states`` the one-time codes of a sign-in in progress.
    ``detail_checks`` says when a listing's notices or substances were last read. A notice read from a distributor
    is ``pcns`` with ``source`` and ``external_key``, the same notice once however many parts it covers.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_part_facts (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            observed_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (part_id, provider, name)
        );
        CREATE TABLE IF NOT EXISTS supply_connector_grants (
            connector_id TEXT PRIMARY KEY REFERENCES supply_connectors(id) ON DELETE CASCADE,
            envelope TEXT NOT NULL,
            access_expires_at TIMESTAMPTZ,
            refresh_expires_at TIMESTAMPTZ,
            granted_by TEXT NOT NULL,
            granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_error TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS supply_oauth_states (
            state TEXT PRIMARY KEY,
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            actor TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS supply_detail_checks (
            listing_id TEXT NOT NULL REFERENCES supply_listings(id) ON DELETE CASCADE,
            kind TEXT NOT NULL CHECK (kind IN ('notices', 'substances')),
            checked_at TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL,
            failures INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (listing_id, kind)
        );
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS external_key TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS published_on DATE;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_supply_pcns_external ON supply_pcns (source, external_key) WHERE external_key <> '';
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
        ALTER TABLE supply_samples ADD COLUMN IF NOT EXISTS moq INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE supply_samples ADD COLUMN IF NOT EXISTS order_multiple INTEGER NOT NULL DEFAULT 1;
        """,
        prepare=False,
    )


def _m043_bom_cost_history(conn) -> None:
    """One cost per board a day for each project and design variant that is tracked, so the cost of a BOM can be followed."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_bom_cost_history (
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
        CREATE TABLE IF NOT EXISTS supply_alert_rules (
            part_id TEXT PRIMARY KEY REFERENCES supply_parts(id) ON DELETE CASCADE,
            muted TEXT[] NOT NULL DEFAULT '{}',
            price_rise_percent INTEGER,
            target_price NUMERIC(14, 6),
            target_currency TEXT NOT NULL DEFAULT '',
            updated_by TEXT NOT NULL DEFAULT '',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS supply_assessment_marks (
            part_id TEXT PRIMARY KEY REFERENCES supply_parts(id) ON DELETE CASCADE,
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
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS parsed JSONB;
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS parse_state TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS parse_failures INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE supply_pcns ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ;
        """,
        prepare=False,
    )


def _m046_rohs_exemptions(conn) -> None:
    """The RoHS exemptions a part relies on (such as 7(a), lead in high melting solder), named by a person from the manufacturer's declaration."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_rohs_exemptions (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
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
        CREATE TABLE IF NOT EXISTS supply_arrival_promises (
            listing_id TEXT NOT NULL REFERENCES supply_listings(id) ON DELETE CASCADE,
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
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS rate_limits JSONB NOT NULL DEFAULT '{}'::jsonb;
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS rate_limits_at TIMESTAMPTZ;
        """,
        prepare=False,
    )


def _m049_limit_marks(conn) -> None:
    """Readings and refusals that bracket a provider's reset (``limits.py``), and the header names a provider sends."""

    conn.execute(
        """
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS headers_seen JSONB NOT NULL DEFAULT '[]'::jsonb;
        ALTER TABLE supply_connectors ADD COLUMN IF NOT EXISTS reset_from_provider BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE TABLE IF NOT EXISTS supply_limit_marks (
            connector_id TEXT NOT NULL REFERENCES supply_connectors(id) ON DELETE CASCADE,
            at TIMESTAMPTZ NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('remaining', 'refused', 'ok')),
            remaining INTEGER,
            quota INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_supply_limit_marks_connector ON supply_limit_marks (connector_id, at);
        """,
        prepare=False,
    )


def _m050_drop_headers_seen(conn) -> None:
    """The header names a provider sent were only for finding out which providers report limits."""

    conn.execute("ALTER TABLE supply_connectors DROP COLUMN IF EXISTS headers_seen;", prepare=False)


def _m051_project_opt_outs(conn) -> None:
    """A tracked project names the distributors it does not buy from, and the assembly-only ones it is built at.

    It used to name the ones it buys from, so a distributor added later was never used for it. A stored list becomes:
    every regular connector not in it is left out, and the assembly-only ones in it are kept.
    """

    from app.services.supply.providers import registry

    conn.execute(
        """
        ALTER TABLE supply_tracked_projects ADD COLUMN IF NOT EXISTS excluded_ids TEXT[] NOT NULL DEFAULT '{}';
        ALTER TABLE supply_tracked_projects ADD COLUMN IF NOT EXISTS assembly_ids TEXT[] NOT NULL DEFAULT '{}';
        """,
        prepare=False,
    )
    has_old = conn.execute(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'supply_tracked_projects' "
        "AND column_name = 'connector_ids'"
    ).fetchone()
    if not has_old:
        return
    assembly = set()
    regular = set()
    for row in conn.execute("SELECT id, provider FROM supply_connectors").fetchall():
        try:
            only = registry.get_spec(row["provider"]).assembly_only
        except registry.UnknownProvider:
            only = False
        (assembly if only else regular).add(row["id"])
    for row in conn.execute("SELECT project_id, connector_ids FROM supply_tracked_projects WHERE connector_ids IS NOT NULL").fetchall():
        chosen = set(row["connector_ids"])
        conn.execute(
            "UPDATE supply_tracked_projects SET excluded_ids = %s, assembly_ids = %s WHERE project_id = %s",
            (sorted(regular - chosen), sorted(chosen & assembly), row["project_id"]),
        )
    conn.execute("ALTER TABLE supply_tracked_projects DROP COLUMN connector_ids", prepare=False)


def _m052_usage_symbol_facts(conn) -> None:
    """What a symbol says about itself beyond its part number: its datasheet address and the catalog component placed on it.

    Read back by ``bom_suggestions.py`` to say what Prism could add to the BOM."""

    conn.execute(
        """
        ALTER TABLE supply_bom_usage ADD COLUMN IF NOT EXISTS datasheet TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_bom_usage ADD COLUMN IF NOT EXISTS prism_id TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_bom_usage_variants ADD COLUMN IF NOT EXISTS datasheet TEXT NOT NULL DEFAULT '';
        ALTER TABLE supply_bom_usage_variants ADD COLUMN IF NOT EXISTS prism_id TEXT NOT NULL DEFAULT '';
        """,
        prepare=False,
    )


def _m053_no_stored_files(conn) -> None:
    """Prism keeps no files: no datasheet versions, no copies of notice PDFs, nothing read from them (plan 10, 2026-10-16).

    A part keeps its datasheet address (``parts.datasheet_url``) and a notice its link (``pcns.notice_url``)."""

    conn.execute(
        """
        DELETE FROM supply_alerts WHERE kind = 'datasheet_changed';
        UPDATE supply_alert_rules SET muted = array_remove(muted, 'datasheet_changed');
        DROP TABLE IF EXISTS supply_datasheets;
        DROP TABLE IF EXISTS supply_datasheet_checks;
        DROP TABLE IF EXISTS supply_datasheet_denied_hosts;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS file_sha256;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS file_checked_at;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS file_status;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS file_failures;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS parsed;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS parse_state;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS parse_failures;
        ALTER TABLE supply_pcns DROP COLUMN IF EXISTS parsed_at;
        """,
        prepare=False,
    )


def _m054_limit_scopes(conn) -> None:
    """Limit readings by the API that gave them: DigiKey's product API and its change-notice API have separate quotas."""

    conn.execute(
        """
        ALTER TABLE supply_limit_marks ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT '';
        DELETE FROM supply_limit_marks;
        UPDATE supply_connectors SET rate_limits = '{}'::jsonb, rate_limits_at = NULL;
        """,
        prepare=False,
    )


def _m055_follow_all_variants(conn) -> None:
    """A tracked project can follow every design variant it has, including ones added to it later."""

    conn.execute("ALTER TABLE supply_tracked_projects ADD COLUMN IF NOT EXISTS all_variants BOOLEAN NOT NULL DEFAULT FALSE", prepare=False)


def _m056_makers_without_friction(conn) -> None:
    """Parts exist before their maker is settled; distributors' answers settle it (``makers.py``, ``settle.py``)."""

    conn.execute(
        """
        ALTER TABLE supply_manufacturers ADD COLUMN IF NOT EXISTS provisional BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE supply_manufacturer_aliases ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'person';

        CREATE TABLE IF NOT EXISTS supply_part_spellings (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            alias_key TEXT NOT NULL,
            alias_text TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'learned',
            at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, alias_key)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_part_spellings_key ON supply_part_spellings (alias_key);

        CREATE TABLE IF NOT EXISTS supply_alias_rejections (
            alias_key TEXT NOT NULL,
            manufacturer_id TEXT NOT NULL REFERENCES supply_manufacturers(id) ON DELETE CASCADE,
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
        CREATE TABLE IF NOT EXISTS supply_part_numbers (
            part_id TEXT NOT NULL REFERENCES supply_parts(id) ON DELETE CASCADE,
            mpn TEXT NOT NULL,
            match_key TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'person',
            created_by TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (part_id, match_key)
        );
        CREATE INDEX IF NOT EXISTS idx_supply_part_numbers_key ON supply_part_numbers (match_key);
        """,
        prepare=False,
    )


def _m058_buying_for(conn) -> None:
    """What a tracked project buys for: prototypes (cut tape, small orders) or production (reels)."""

    conn.execute("ALTER TABLE supply_tracked_projects ADD COLUMN IF NOT EXISTS buying_for TEXT NOT NULL DEFAULT 'prototypes'", prepare=False)


def _m059_ask_maker(conn) -> None:
    """A part whose maker a person took back from Prism: it is asked about again instead of settling by itself."""

    conn.execute("ALTER TABLE supply_parts ADD COLUMN IF NOT EXISTS ask_maker BOOLEAN NOT NULL DEFAULT FALSE", prepare=False)


def _m060_maker_seeds(conn) -> None:
    """The usual spellings of large makers, as rows an administrator can read and change (they began as a list in code)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS supply_maker_seeds (
            alias_key TEXT PRIMARY KEY,
            group_key TEXT NOT NULL,
            alias_text TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'seeded'
        );
        CREATE INDEX IF NOT EXISTS idx_supply_maker_seeds_group ON supply_maker_seeds (group_key);
        """,
        prepare=False,
    )
    from app.services.supply import makers
    from app.services.supply.identity import alias_key

    for group in makers.default_spellings():
        head = alias_key(group[0])
        for spelling in group:
            conn.execute(
                "INSERT INTO supply_maker_seeds (alias_key, group_key, alias_text) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (alias_key(spelling), head, spelling.title() if spelling.islower() and len(spelling) > 3 else spelling.upper() if len(spelling) <= 3 else spelling),
            )
