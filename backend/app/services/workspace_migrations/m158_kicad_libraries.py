"""KiCad path libraries an administrator declares, and the variables boards use that none defines.

``ws_kicad_libraries``: one row per library, keyed by name. A library binds one
or more KiCad path variables (``${LSF_KICAD_LIB}``) to a folder, either a
shallow git clone Prism fetches (``git_url`` and ``ref``) or a folder under the
configured mount root (``path``, relative). ``state`` and the columns after it
describe the fetch; the clone's ready marker on disk is what makes a library
resolve.

``ws_kicad_variable_usage``: per project, how many model references use a
variable the last time a design bundle was built, so the console can list
variables nothing defines.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS ws_kicad_libraries (
            name TEXT PRIMARY KEY,
            variables JSONB NOT NULL,
            git_url TEXT,
            ref TEXT,
            subdir TEXT NOT NULL DEFAULT '',
            path TEXT,
            state TEXT NOT NULL DEFAULT 'pending'
                CHECK (state IN ('pending', 'fetching', 'ready', 'failed')),
            error TEXT,
            progress INTEGER,
            size_bytes BIGINT,
            fetched_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_by TEXT NOT NULL DEFAULT '',
            CHECK ((git_url IS NULL) <> (path IS NULL))
        );
        CREATE TABLE IF NOT EXISTS ws_kicad_variable_usage (
            project_id TEXT NOT NULL,
            variable TEXT NOT NULL,
            model_count INTEGER NOT NULL,
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (project_id, variable)
        );
        """
    )
