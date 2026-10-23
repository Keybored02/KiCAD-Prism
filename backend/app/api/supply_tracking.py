"""Tracking: which projects and parts Prism follows, at what tier, and what that costs the call budget.

Anyone who reads supply data sees it, and the same people (administrators, designers and QA) change it. Every change can be previewed first:
a preview does exactly what the change would and rolls it back, so the figures shown are the figures that follow.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Callable, Literal, TypeVar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_admin, require_supply_reader, require_supply_tracker
from app.services.supply import admission, budget_view, parts, project_bom, room, schedule_settings, tracking, usage, watches

router = APIRouter(prefix="/api/supply/tracking", tags=["supply"])
budget_router = APIRouter(prefix="/api/supply", tags=["supply"])

T = TypeVar("T")


class ProjectIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # The designs to follow: '' is the base design, the rest are named variants.
    variants: list[str] = Field(default_factory=lambda: [""], max_length=usage.MAX_VARIANTS + 1)
    # The distributors the project is bought from; empty (null) means all but the assembly-only ones.
    connector_ids: list[str] | None = Field(default=None, max_length=50)
    # Follow every design the project has, also those it gets later (variants is then ignored).
    all_variants: bool = False
    # The packaging the project prefers: decides which listing is followed at each distributor.
    packaging: Literal["cut_tape", "custom_reel", "tape_reel", "tube_tray", "smallest"] = "cut_tape"
    # The usual build, in boards: the project's cost is worked out for it each day. Null keeps the one it has (100 for a new project).
    build_quantity: int | None = Field(default=None, ge=1, le=1_000_000)
    # What the project's cost is worked out with: "" the workspace's setting, "auto" by package, or a percent. Null keeps the one it has.
    spares: str | None = Field(default=None, max_length=12)


class BuildIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    build_quantity: int = Field(ge=1, le=1_000_000)


class PartIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tier: int
    rate: str = "weekly"


def _store():
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except admission.NoRoom as exc:
        raise HTTPException(status_code=409, detail={"code": "no_room", "message": str(exc)}) from exc
    except parts.PartNotFound as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
    except (tracking.TrackingError, schedule_settings.ScheduleError, ValueError) as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_request", "message": str(exc)}) from exc


def _read_project_bom(conn, project_id: str) -> str:
    """Read the project's BOM into usage from its semantic index, when it is not there or has changed."""

    from app.services import project_service, semantic_index_service
    from app.services.supply import catalog_read
    from app.services.workspace_service import workspace

    row = next((item for item in workspace.get_all_projects(None) if str(item["id"]) == project_id), None)
    if row is None:
        raise ValueError("This project does not exist.")
    visible = [role for role in usage.ALL_ROLES if workspace._is_folder_visible(row, role)]
    return usage.refresh_one(
        conn, project_service._workspace_row_to_project(row), semantic_index_service.get_existing,
        datetime.now(timezone.utc), visible, catalog_read.identities,
    )


def _track(project_id: str, body: ProjectIn, actor: str) -> Callable[[Any], Any]:
    def change(conn) -> dict[str, Any]:
        _read_project_bom(conn, project_id)
        return tracking.track_project(conn, project_id, body.variants, actor, connector_ids=body.connector_ids, all_variants=body.all_variants, packaging=body.packaging, build_quantity=body.build_quantity, spares=body.spares)

    return change


class LineChoiceIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    part_id: str = Field(min_length=1, max_length=64)
    manufacturer: str = Field(min_length=1, max_length=200)


@router.get("/projects/{project_id}/open")
async def project_open(project_id: str, user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """What the project waits on a person for."""

    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return tracking.project_open(conn, project_id)

    return await _run(read)


@router.get("/projects/{project_id}/progress")
async def project_progress(project_id: str, user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """How far the first searches of the project's parts have got, per distributor."""

    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return tracking.project_progress(conn, project_id)

    return await _run(read)


@router.post("/projects/{project_id}/lines/choose", status_code=204)
async def choose_line(project_id: str, body: LineChoiceIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> None:
    """Say which of several parts a BOM line's maker spelling names."""

    get_project_for_role_or_404(project_id, user.role)

    def run() -> None:
        with _store().connection() as conn:
            tracking.choose_line(conn, body.part_id, body.manufacturer, user.email)

    await _run(run)


@router.get("")
async def overview(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return {
                "counts": tracking.counts(conn),
                "projects": [
                    {**item, "tracked_at": item["tracked_at"].isoformat()} for item in tracking.list_tracked_projects(conn)
                ],
                "budget": admission.status(conn),
            }

    return await _run(read)


@router.get("/projects/{project_id}")
async def project_state(project_id: str, user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            tracked = tracking.tracked_project(conn, project_id)
            has_usage = conn.execute("SELECT 1 FROM bom_usage_projects WHERE project_id = %s", (project_id,)).fetchone() is not None
            return {
                "tracked": {**tracked, "tracked_at": tracked["tracked_at"].isoformat()} if tracked else None,
                "has_usage": has_usage,
                "variants": usage.project_variants(conn, project_id) if has_usage else [],
            }

    return await _run(read)


@router.post("/projects/{project_id}/read")
async def read_project_bom(project_id: str, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, str]:
    """Read the project's BOM now; when its newest revision has no index yet, queue one (``reading``) and read it later."""

    get_project_for_role_or_404(project_id, user.role)

    def run() -> dict[str, str]:
        found = project_bom._workspace_projects([project_id])  # noqa: SLF001 - the same lookup the poll job uses
        if not found:
            raise ValueError("This project does not exist.")
        project, roles = found[0]
        with _store().connection() as conn:
            return {"status": project_bom.read(conn, project, roles, datetime.now(timezone.utc))}

    return await _run(run)


@router.put("/projects/{project_id}/build")
async def keep_usual_build(project_id: str, body: BuildIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    """Keep a build size as the tracked project's usual build."""

    get_project_for_role_or_404(project_id, user.role)

    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return tracking.set_usual_build(conn, project_id, body.build_quantity, user.email)

    return await _run(run)


@router.post("/projects/{project_id}/preview")
async def preview_project(project_id: str, body: ProjectIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            report = admission.preview(conn, _track(project_id, body, user.email))
        return {key: value for key, value in report.items() if key != "result"} | {"tracked": report["result"]}

    return await _run(run)


@router.put("/projects/{project_id}")
async def track_project(project_id: str, body: ProjectIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            report = admission.apply(conn, _track(project_id, body, user.email))
        return {key: value for key, value in report.items() if key != "result"} | {"tracked": report["result"]}

    return await _run(run)


@router.delete("/projects/{project_id}", status_code=204)
async def untrack_project(project_id: str, user: AuthenticatedUser = Depends(require_supply_tracker)) -> None:
    get_project_for_role_or_404(project_id, user.role)

    def run() -> None:
        with _store().connection() as conn:
            tracking.untrack_project(conn, project_id, user.email)

    await _run(run)


@router.get("/parts/{part_id}")
async def part_state(part_id: str, _user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            parts.get_part(conn, part_id)
            waiting = [
                row["connector_id"] for row in conn.execute(
                    "SELECT connector_id FROM admissions WHERE part_id = %s AND state = 'waiting' ORDER BY connector_id", (part_id,)
                ).fetchall()
            ]
            return {"tier": tracking.tier_of(conn, part_id), "waiting_at": waiting}

    return await _run(read)


@router.post("/parts/{part_id}/preview")
async def preview_part(part_id: str, body: PartIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            report = admission.preview(conn, lambda c: watches.set_tier(c, part_id, body.tier, body.rate, user.email))
        return {key: value for key, value in report.items() if key != "result"}

    return await _run(run)


@router.put("/parts/{part_id}")
async def set_part_tier(part_id: str, body: PartIn, user: AuthenticatedUser = Depends(require_supply_tracker)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            report = admission.apply(conn, lambda c: watches.set_tier(c, part_id, body.tier, body.rate, user.email))
            return {**{key: value for key, value in report.items() if key != "result"}, "tier": tracking.tier_of(conn, part_id)}

    return await _run(run)


@router.delete("/parts/{part_id}", status_code=204)
async def stop_tracking_part(part_id: str, user: AuthenticatedUser = Depends(require_supply_tracker)) -> None:
    def run() -> None:
        with _store().connection() as conn:
            parts.get_part(conn, part_id)
            watches.stop_tracking(conn, part_id, user.email)

    await _run(run)


@budget_router.get("/budget")
async def budget(_user: AuthenticatedUser = Depends(require_supply_reader)) -> list[dict[str, Any]]:
    """Where each connector's call budget goes, today and over two weeks, and what tracking costs. Everyone who reads supply may see it."""

    def read() -> list[dict[str, Any]]:
        with _store().connection() as conn:
            return budget_view.view(conn, datetime.now(timezone.utc))

    return await _run(read)


@budget_router.get("/room")
async def tracking_room(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """How many more typical parts tracking has room for, per distributor and overall (``room.py``)."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return room.view(conn, datetime.now(timezone.utc))

    return await _run(read)


class ScheduleIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    spare: dict[str, bool]


@budget_router.get("/schedule")
async def get_schedule(_user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    """Which spare work is on. Spare budget is the calls nothing else needs, at any hour."""

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return schedule_settings.load(conn)

    return await _run(read)


@budget_router.put("/schedule")
async def put_schedule(body: ScheduleIn, user: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return schedule_settings.save(conn, body.model_dump(), user.email)

    return await _run(run)
