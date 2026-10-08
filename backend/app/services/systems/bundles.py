"""Board 3D bundles for the system scene (CONTRACTS_P2 §20.2).

Wraps the single-board pipeline (``semantic_visualizer_service``): the scene
reuses its bundles, its readiness cache and its ``webgpu_3d`` job, and adds
nothing to how a bundle is built.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Mapping, Optional

logger = logging.getLogger(__name__)


class BundleUnreadable(Exception):
    """The bundle a ready status names cannot be read: its files are gone or broken (SB2-91)."""


def mid_plane_from_layers(layers: list[Mapping[str, Any]]) -> float:
    """Height of the board mid-plane in a bundle's runtime frame, in mm.

    The pipeline puts KiCad's substrate between the inner faces of the outer
    copper layers, from z = 0 up (``semantic_gltf._set_canonical_board_y_range``); the
    mid-plane is half way. Without two copper layers the runtime z is the
    centred stackup z, so the mid-plane is 0.
    """
    copper = sorted((layer for layer in layers if layer.get("role") == "copper"),
                    key=lambda layer: float(layer.get("z_mm") or 0.0))
    if len(copper) < 2:
        return 0.0
    bottom, top = copper[0], copper[-1]
    bottom_inner = float(bottom.get("z_mm") or 0.0) + float(bottom.get("thickness_mm") or 0.0) / 2.0
    top_inner = float(top.get("z_mm") or 0.0) - float(top.get("thickness_mm") or 0.0) / 2.0
    body = top_inner - bottom_inner
    return body / 2.0 if body > 0 else 0.0


def latest_job(kind: str, artifact_key: str) -> Optional[dict]:
    """The most recent job of ``kind`` for ``artifact_key``, in any status."""
    from app.services.systems.jobs import workspace_connection

    with workspace_connection() as conn:
        row = conn.execute(
            "SELECT id, status, error_message, message FROM ws_jobs"
            " WHERE kind = %s AND artifact_key = %s ORDER BY created_at DESC LIMIT 1",
            (kind, artifact_key),
        ).fetchone()
    return dict(row) if row else None


class BundleSource:
    """The production source; tests pass a fake with the same four methods."""

    def status(self, project: Any, commit: str) -> dict:
        from app.services import semantic_visualizer_service

        return semantic_visualizer_service.get_status_fast(project, commit)

    def last_build(self, project_id: str, commit: str) -> Optional[dict]:
        """The latest ``webgpu_3d`` job for this commit: ``{jobId, status, error}``, or None."""
        from app.services import project_service
        from app.services.workspace_service import workspace

        row = workspace.get_project_by_id(project_id)
        if not row:
            return None
        job = latest_job("webgpu_3d", project_service.webgpu_artifact_key(row, commit))
        if not job:
            return None
        return {"jobId": str(job["id"]), "status": str(job["status"]),
                "error": job["error_message"] or job["message"] or None}

    def build(self, project_id: str, commit: str, *, requested_by: str) -> Optional[str]:
        from app.services import project_service

        return project_service.start_workflow_job(project_id, "webgpu_3d", requested_by or "system-scene", commit=commit)

    def mid_plane_mm(self, project_id: str, status: Mapping[str, Any]) -> Optional[float]:
        """The bundle's board mid-plane; None for a board-stage bundle; BundleUnreadable when its files fail."""
        from app.services import semantic_visualizer_service

        try:
            root = semantic_visualizer_service.bundle_dir(project_id, status["source_fingerprint"],
                                                          status["build_fingerprint"])
            bundle = json.loads((root / "bundle.json").read_text(encoding="utf-8"))
            geometry = json.loads((root / str(bundle.get("semantic_geometry") or "semantic_geometry.json"))
                                  .read_text(encoding="utf-8"))
            manifest = (geometry.get("assets") or {}).get("scene_manifest") or (geometry.get("semantic_gltf") or {}).get("path")
            if not manifest:
                return None  # a board-stage bundle: the renderer waits for the next readiness step
            layers = json.loads((root / manifest).read_text(encoding="utf-8")).get("layers") or []
        except (OSError, ValueError, KeyError, TypeError) as error:
            logger.warning("Could not read the layer table of bundle %s: %s", status.get("bundle_url"), error)
            raise BundleUnreadable(str(error)) from error
        return mid_plane_from_layers(layers)
