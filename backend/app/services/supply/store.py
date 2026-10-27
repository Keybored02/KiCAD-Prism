"""Connection and schema setup for the ``supply`` schema."""

from __future__ import annotations

import threading
from contextlib import contextmanager
from typing import Iterator

from app.services.postgres_database import database
from app.services.supply import schema_migrations


class SupplyStore:
    """Owns the schema. Services take a store and call ``connection()``."""

    # Tests point a subclass at a disposable schema; production is "supply".
    schema = "supply"

    def __init__(self) -> None:
        self._init_lock = threading.Lock()
        self._initialized = False

    def initialize(self) -> None:
        """Create the schema and apply pending migrations."""

        if self._initialized:
            return
        with self._init_lock:
            if self._initialized:
                return
            with database.connection() as conn:
                # Same advisory key as the other schemas, so startup of every
                # service serializes instead of racing on shared catalogs.
                conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", ("prism-schema",))
                conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{self.schema}"')
                conn.execute(f'SET search_path TO "{self.schema}", public')
                schema_migrations.apply_supply_migrations(conn)
                conn.commit()
            self._initialized = True

    @contextmanager
    def connection(self) -> Iterator[object]:
        """A pooled connection with the search path on the supply schema."""

        with database.connection() as conn:
            conn.execute(f'SET search_path TO "{self.schema}", public')
            yield conn


supply_store = SupplyStore()


def initialize_supply_store() -> None:
    supply_store.initialize()
