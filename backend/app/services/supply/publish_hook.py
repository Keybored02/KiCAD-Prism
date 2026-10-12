"""Freeze the supply check beside a release when it is published.

Called by Release Studio after a publish succeeded. Whatever goes wrong here is logged and
dropped: a missing supply snapshot must never undo or hide a release that already exists.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def freeze_after_publish(project_id: str, build_id: str, tag: str, commit_sha: str, actor: str) -> str | None:
    try:
        from app.services import project_service, semantic_index_service
        from app.services.supply import catalog_read, release_check
        from app.services.supply.store import supply_store
        from app.services.workspace_service import workspace

        row = workspace.get_project_by_id(project_id)
        if not row:
            return None
        project = project_service._workspace_row_to_project(row)
        index = semantic_index_service.get_existing(project, commit_sha)
        if not index:
            logger.info("No semantic index for %s at %s; no supply snapshot taken", project_id, commit_sha)
            return None
        with supply_store.connection() as conn:
            return release_check.freeze(
                conn, project_id, build_id, tag, commit_sha, actor,
                index.get("components") or [], catalog_read.component_ids_by_part(), datetime.now(timezone.utc),
            )
    except Exception:  # noqa: BLE001 - see the module docstring
        logger.warning("Could not take the supply snapshot for build %s", build_id, exc_info=True)
        return None
