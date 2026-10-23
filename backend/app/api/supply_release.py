"""Supply check on a project's BOM before release, and the snapshot frozen at publish.

Everyone who can read supply data may look. Projects follow the caller's role: a project the caller
cannot open is not found. The check reads existing semantic indexes and calls no distributor.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.api import supply_connectors
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_supply_reader, require_supply_tracker
from app.services.supply import (
    bom_lookup, catalog_read, compliance_draft, project_supply, release_bom, release_check, release_source, trade, usage,
)

from app.services.supply import release_snapshot as snapshot_jobs  # noqa: E402

router = APIRouter(prefix="/api/supply/projects", tags=["supply"])

T = TypeVar("T")


def _store():
    # Resolved per call so a replaced connector service (tests) brings its own store.
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except release_check.SnapshotNotFound as exc:
        raise HTTPException(status_code=404, detail="No supply snapshot for this build") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_request", "message": str(exc)}) from exc


@router.get("/{project_id}/bom-health")
async def bom_health(
    project_id: str,
    build_quantity: int = Query(default=1, ge=1, le=1_000_000),
    variant: str = Query(default="", max_length=120),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    """The project's BOM rolled up from the lines stored when its BOM was read. Never calls a distributor.

    ``variant`` names a design variant; empty is the base design. ``variants`` lists the names stored.
    """

    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            rows = usage.project_rows(conn, project_id, variant)
            if not rows:
                return {"available": False}
            lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
            return {
                "available": True, "build_quantity": build_quantity, "variant": variant, "variants": usage.project_variants(conn, project_id),
                "rollup": bom_lookup.lookup(conn, lines, build_quantity)["rollup"],
            }

    return await _run(read)


@router.get("/{project_id}/supply")
async def project_overview(
    project_id: str,
    build_quantity: int | None = Query(default=None, ge=1, le=1_000_000),
    variant: str = Query(default="", max_length=120),
    spares: str = Query(default="", max_length=12),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    """The project's parts, planned builds, releases (with what changed since) and line notes, from its stored BOM. Calls no distributor.
    ``spares`` is "auto" (by package) or a percent."""

    get_project_for_role_or_404(project_id, user.role)
    try:
        attrition = project_supply.attrition_of(spares)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return project_supply.overview(conn, project_id, variant, build_quantity, attrition)

    return await _run(read)


@router.get("/{project_id}/cost-export")
async def cost_export(
    project_id: str,
    build_quantity: int = Query(default=1, ge=1, le=1_000_000),
    variant: str = Query(default="", max_length=120),
    spares: str = Query(default="", max_length=12),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> Response:
    """The stored BOM costed at a build size, as a CSV: a costing with no distributor, SKU or link, so nothing to order from."""

    project = get_project_for_role_or_404(project_id, user.role)
    try:
        attrition = project_supply.attrition_of(spares)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    def read() -> str | None:
        with _store().connection() as conn:
            return project_supply.cost_csv(conn, project_id, variant, build_quantity, attrition)

    text = await _run(read)
    if text is None:
        raise HTTPException(status_code=404, detail="This project's BOM has not been read yet")
    name = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in (project.name or project_id))[:60]
    return Response(
        content=text, media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{name}-cost-{build_quantity}.csv"'},
    )


@router.get("/{project_id}/costing.zip")
async def costing_zip(
    project_id: str,
    variant: str = Query(default="", max_length=120),
    build_quantity: int = Query(default=1, ge=1, le=1_000_000),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> Response:
    """The costing as a zip: the whole costing, the costing by distributor, the draft RoHS and REACH declaration and the trade classification."""

    project = get_project_for_role_or_404(project_id, user.role)

    def read() -> bytes | None:
        with _store().connection() as conn:
            return project_supply.costing_zip(conn, project_id, variant, build_quantity)

    content = await _run(read)
    if content is None:
        raise HTTPException(status_code=404, detail="This project's BOM has not been read yet")
    name = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in (project.name or project_id))[:60]
    return Response(content=content, media_type="application/zip", headers={"Content-Disposition": f'attachment; filename="{name}-costing-{build_quantity}.zip"'})


@router.get("/{project_id}/trade")
async def trade_classification(
    project_id: str,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    variant: str = Query(default="", max_length=120),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> Any:
    """The export control class and tariff codes distributors give for the project's parts, with the gaps. What they state, not a classification."""

    project = get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            rows = usage.project_rows(conn, project_id, variant)
            return {"available": bool(rows), "report": trade.build(conn, rows) if rows else None}

    result = await _run(read)
    if format == "csv":
        if not result["available"]:
            raise HTTPException(status_code=404, detail="This project's BOM has not been read yet")
        name = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in (project.name or project_id))[:60]
        return Response(
            content=trade.to_csv(result["report"]), media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{name}-trade-classification.csv"'},
        )
    return result


@router.get("/{project_id}/compliance-draft")
async def compliance_draft_for(
    project_id: str,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    variant: str = Query(default="", max_length=120),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> Any:
    """A draft RoHS and REACH declaration for the project's stored BOM, with the gaps listed. A working document, not a declaration."""

    project = get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            rows = usage.project_rows(conn, project_id, variant)
            return {"available": bool(rows), "draft": compliance_draft.build(conn, rows) if rows else None}

    result = await _run(read)
    if format == "csv":
        if not result["available"]:
            raise HTTPException(status_code=404, detail="This project's BOM has not been read yet")
        name = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in (project.name or project_id))[:60]
        return Response(
            content=compliance_draft.to_csv(result["draft"]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{name}-compliance-draft.csv"'},
        )
    return result


def _build_of_project(project_id: str, build_id: str) -> None:
    """The build must belong to the project the caller can open."""

    from app.services import release_studio_service as store

    build = store.get_build(build_id)
    if build is None or str(build.get("project_id") or "") != project_id:
        raise HTTPException(status_code=404, detail="Build not found")


@router.get("/{project_id}/release-builds/{build_id}/check")
async def release_check_for(
    project_id: str, build_id: str, user: AuthenticatedUser = Depends(require_supply_reader),
) -> dict[str, Any]:
    """The supply check of the BOM a release build exported: the run's variant and BOM preset, exactly what ships."""

    get_project_for_role_or_404(project_id, user.role)
    _build_of_project(project_id, build_id)

    def read() -> dict[str, Any]:
        try:
            read_bom = release_bom.lines_from_csv(release_source.build_bom_text(build_id), catalog_read.identities)
        except (release_source.NoBuildBom, release_bom.BomReadError) as exc:
            return {"available": False, "reason": str(exc)}
        with _store().connection() as conn:
            return {"available": True, **release_check.check(conn, read_bom.lines, without_number=read_bom.without_number)}

    return await _run(read)


@router.post("/{project_id}/release-builds/{build_id}/read-bom")
async def read_release_bom(
    project_id: str, build_id: str, user: AuthenticatedUser = Depends(require_supply_tracker),
) -> dict[str, Any]:
    """Keep the release's BOM lines as the project's usage, for a project Prism has never read. No distributor is asked and
    nothing is tracked: tracking is a separate decision, made on the project's Supply tab."""

    project = get_project_for_role_or_404(project_id, user.role)
    _build_of_project(project_id, build_id)

    def run() -> dict[str, Any]:
        from datetime import datetime, timezone

        try:
            read_bom = release_bom.lines_from_csv(release_source.build_bom_text(build_id), catalog_read.identities)
        except (release_source.NoBuildBom, release_bom.BomReadError) as exc:
            raise ValueError(str(exc)) from exc
        with _store().connection() as conn:
            stored = usage.store_project(
                conn, project_id, project.name or project_id, f"release:{build_id}|u{usage.USAGE_VERSION}", read_bom.lines,
                datetime.now(timezone.utc),
            )
        return {"stored": stored, "parts": len(read_bom.lines), "without_number": read_bom.without_number}

    return await _run(run)


@router.get("/{project_id}/releases/{build_id}/compliance")
async def release_compliance(
    project_id: str,
    build_id: str,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    user: AuthenticatedUser = Depends(require_supply_reader),
) -> Any:
    """The draft RoHS and REACH declaration as it stood when the release was published. A working document, not a declaration."""

    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return release_check.get_snapshot(conn, project_id, build_id)

    snapshot = await _run(read)
    if snapshot["compliance"] is None:
        raise HTTPException(status_code=404, detail="This release was published before drafts were kept")
    if format == "csv":
        name = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in snapshot["tag"])[:60] or "release"
        return Response(
            content=compliance_draft.to_csv(snapshot["compliance"]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{name}-compliance-draft.csv"'},
        )
    return {"tag": snapshot["tag"], "created_at": snapshot["created_at"], "draft": snapshot["compliance"]}


@router.get("/{project_id}/releases/{build_id}/supply")
async def release_snapshot(
    project_id: str, build_id: str, user: AuthenticatedUser = Depends(require_supply_reader)
) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return release_check.get_snapshot(conn, project_id, build_id)

    return await _run(read)


@router.get("/{project_id}/releases/{build_id}/supply-status")
async def release_snapshot_status(
    project_id: str, build_id: str, user: AuthenticatedUser = Depends(require_supply_reader)
) -> dict[str, Any]:
    """Whether the release has its supply snapshot (``taken``), is waiting for it (``queued``), or could not have one."""

    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return snapshot_jobs.status_of(conn, project_id, build_id)

    return await _run(read)
