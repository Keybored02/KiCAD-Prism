"""pytest configuration for the backend suite (``unittest`` tests, run by pytest).

Parallel runs (``pytest -n auto``, pytest-xdist) give each worker its own fresh
copy of the three test databases, so workers never share rows or schemas:
``PRISM_DATABASE_URL``, ``TEST_POSTGRES_URL`` and ``LEGACY_SURVIVOR_TEST_POSTGRES_URL``
each get the worker id appended to their database name (``…/ci_main_gw0``).
This runs at import, before any test module reads the variables.
"""

from __future__ import annotations

import os
from urllib.parse import urlsplit, urlunsplit

DATABASE_VARIABLES = ("PRISM_DATABASE_URL", "TEST_POSTGRES_URL", "LEGACY_SURVIVOR_TEST_POSTGRES_URL")


def _worker_databases(worker: str) -> None:
    import psycopg

    for variable in DATABASE_VARIABLES:
        url = os.environ.get(variable)
        if not url or not url.startswith("postgres"):
            continue
        parts = urlsplit(url)
        name = f"{parts.path.lstrip('/')}_{worker}"
        server = urlunsplit(parts._replace(path="/postgres"))
        with psycopg.connect(server, autocommit=True) as conn:
            conn.execute(f'DROP DATABASE IF EXISTS "{name}" WITH (FORCE)')
            conn.execute(f'CREATE DATABASE "{name}"')
        os.environ[variable] = urlunsplit(parts._replace(path=f"/{name}"))


_WORKER = os.environ.get("PYTEST_XDIST_WORKER")
if _WORKER:
    _worker_databases(_WORKER)
