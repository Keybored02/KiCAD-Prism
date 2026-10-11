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


MIGRATIONS: List[Tuple[int, str, Callable[[object], None]]] = [
    (1, "connectors_quota_audit", _m001_connectors_quota_audit),
    (2, "csv_offers", _m002_csv_offers),
    (3, "parts_and_listings", _m003_parts_and_listings),
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
