"""Workspace schema migration 27: system_workspace_version.

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """Systems are listed in the workspace bootstrap, so they move its ETag.

    Every engineering change to a system bumps ``system_projects.version``
    (``SystemStore.mutation``), so one statement trigger on that table covers
    names, folders, instance counts and open reviews alike. It reuses the
    function from migration 2.
    """

    conn.execute("DROP TRIGGER IF EXISTS trg_system_projects_workspace_version ON system_projects")
    conn.execute(
        """
        CREATE TRIGGER trg_system_projects_workspace_version
        AFTER INSERT OR UPDATE OR DELETE ON system_projects
        FOR EACH STATEMENT
        EXECUTE FUNCTION ws_bump_workspace_version()
        """
    )
