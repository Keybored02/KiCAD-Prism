"""Kept answers worked out from the rest, and the change marks that say when they are stale: part summaries, part
insights, project rollups, and the triggers that write the marks.
"""

from __future__ import annotations

TABLES: tuple[str, ...] = (
    """
    CREATE TABLE IF NOT EXISTS supply_part_insights (
        part_id TEXT PRIMARY KEY REFERENCES supply_parts(id) ON DELETE CASCADE,
        computed_at TIMESTAMPTZ NOT NULL,
        data JSONB NOT NULL DEFAULT '{}'::jsonb
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS supply_part_summaries (
        part_id TEXT PRIMARY KEY REFERENCES supply_parts(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        computed_at TIMESTAMPTZ,
        snap BIGINT NOT NULL DEFAULT 0
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS supply_project_rollups (
        project_id TEXT NOT NULL,
        variant TEXT NOT NULL DEFAULT '',
        data JSONB NOT NULL,
        part_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
        seen TEXT NOT NULL,
        snap BIGINT NOT NULL,
        own BIGINT NOT NULL DEFAULT 0,
        computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (project_id, variant)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS supply_rollup_dirty (
        id BIGSERIAL PRIMARY KEY,
        scope TEXT NOT NULL,
        xid BIGINT NOT NULL DEFAULT ((pg_current_xact_id())::text)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_supply_rollup_dirty_scope ON supply_rollup_dirty (scope, xid);
    """,
    """
    CREATE TABLE IF NOT EXISTS supply_summary_dirty (
        id BIGSERIAL PRIMARY KEY,
        part_id TEXT NOT NULL,
        xid BIGINT NOT NULL DEFAULT ((pg_current_xact_id())::text)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_supply_summary_dirty_part ON supply_summary_dirty (part_id, xid);
    """,
)

FUNCTIONS: tuple[str, ...] = (
    """
    CREATE OR REPLACE FUNCTION supply_summary_stale(pid TEXT) RETURNS void LANGUAGE plpgsql AS $$
    BEGIN
        IF pid IS NOT NULL THEN INSERT INTO supply_summary_dirty (part_id) VALUES (pid); END IF;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION supply_summary_by_part() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
        IF TG_OP <> 'INSERT' THEN PERFORM supply_summary_stale(OLD.part_id); END IF;
        IF TG_OP <> 'DELETE' THEN PERFORM supply_summary_stale(NEW.part_id); END IF;
        RETURN NULL;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION supply_summary_by_listing() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
        PERFORM supply_summary_stale((SELECT part_id FROM supply_listings WHERE id = COALESCE(NEW.listing_id, OLD.listing_id)));
        RETURN NULL;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION supply_rollup_by_project() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
        IF TG_OP IN ('UPDATE', 'DELETE') THEN INSERT INTO supply_rollup_dirty (scope) VALUES (OLD.project_id); END IF;
        IF TG_OP IN ('INSERT', 'UPDATE') THEN INSERT INTO supply_rollup_dirty (scope) VALUES (NEW.project_id); END IF;
        RETURN NULL;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION supply_rollup_everywhere() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
        INSERT INTO supply_rollup_dirty (scope) VALUES ('*');
        RETURN NULL;
    END;
    $$;
    """,
)

# A part's summary is stale when one of these rows of it changes (an offer or poll state through its listing).
SUMMARY_BY_PART = {
    "discovery": "supply_discovery_runs", "listings": "supply_listings", "picks": "supply_packaging_picks", "watches": "supply_watches",
}
SUMMARY_BY_LISTING = {"offers": ("supply_offers", "UPDATE"), "poll_state": ("supply_poll_state", "UPDATE OF tier")}
# A project's rollup is stale when its own rows change, every rollup when one of these does.
ROLLUP_BY_PROJECT = ("supply_bom_usage", "supply_bom_usage_projects", "supply_tracked_projects")
ROLLUP_EVERYWHERE = (
    "supply_fx_rates", "supply_manufacturer_aliases", "supply_part_alternates", "supply_part_numbers", "supply_part_preferences",
    "supply_part_spellings", "supply_part_tiers", "supply_parts", "supply_settings",
)
# Catalog tables the rollups read; their triggers are made once the catalog has them (``create_catalog_links``).
ROLLUP_EVERYWHERE_CATALOG = ("component_parts", "components", "inventory_levels")


def _everywhere(table: str) -> str:
    return (
        f"CREATE OR REPLACE TRIGGER trg_supply_rollup_{table} AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON {table} "
        "FOR EACH STATEMENT EXECUTE FUNCTION supply_rollup_everywhere()"
    )


TRIGGERS: tuple[str, ...] = (
    *(
        f"CREATE OR REPLACE TRIGGER trg_supply_summary_{name} AFTER INSERT OR DELETE OR UPDATE ON {table} "
        "FOR EACH ROW EXECUTE FUNCTION supply_summary_by_part()"
        for name, table in SUMMARY_BY_PART.items()
    ),
    *(
        f"CREATE OR REPLACE TRIGGER trg_supply_summary_{name} AFTER INSERT OR DELETE OR {update} ON {table} "
        "FOR EACH ROW EXECUTE FUNCTION supply_summary_by_listing()"
        for name, (table, update) in SUMMARY_BY_LISTING.items()
    ),
    *(
        f"CREATE OR REPLACE TRIGGER trg_supply_rollup_{table} AFTER INSERT OR DELETE OR UPDATE ON {table} "
        "FOR EACH ROW EXECUTE FUNCTION supply_rollup_by_project()"
        for table in ROLLUP_BY_PROJECT
    ),
    *(_everywhere(table) for table in ROLLUP_EVERYWHERE),
)

CATALOG_TRIGGERS: tuple[str, ...] = tuple(_everywhere(table) for table in ROLLUP_EVERYWHERE_CATALOG)
