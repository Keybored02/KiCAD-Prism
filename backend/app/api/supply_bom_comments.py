"""Notes on a project's BOM lines. Anyone who reads supply data and can open the project may read and write them."""

from __future__ import annotations

import asyncio
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from app.api import supply_connectors
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_supply_commenter, require_supply_reader
from app.services.supply import bom_comments

router = APIRouter(prefix="/api/supply/projects", tags=["supply"])

T = TypeVar("T")


class CommentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    line_key: str = Field(min_length=1, max_length=bom_comments.MAX_KEY)
    body: str = Field(min_length=1, max_length=bom_comments.MAX_BODY)


def _store():
    return supply_connectors.service.store


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except bom_comments.CommentNotFound as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": "invalid_comment", "message": str(exc)}) from exc


@router.get("/{project_id}/bom-comments")
async def list_comments(project_id: str, user: AuthenticatedUser = Depends(require_supply_reader)) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def read() -> dict[str, Any]:
        with _store().connection() as conn:
            return {"items": bom_comments.for_project(conn, project_id)}

    return await _run(read)


@router.post("/{project_id}/bom-comments", status_code=201)
async def add_comment(project_id: str, body: CommentIn, user: AuthenticatedUser = Depends(require_supply_commenter)) -> dict[str, Any]:
    get_project_for_role_or_404(project_id, user.role)

    def run() -> dict[str, Any]:
        with _store().connection() as conn:
            return bom_comments.add(conn, project_id, body.line_key, body.body, user.email, user.name or "")

    return await _run(run)


@router.delete("/{project_id}/bom-comments/{comment_id}", status_code=204)
async def remove_comment(project_id: str, comment_id: str, user: AuthenticatedUser = Depends(require_supply_commenter)) -> Response:
    get_project_for_role_or_404(project_id, user.role)

    def run() -> None:
        with _store().connection() as conn:
            bom_comments.remove(conn, project_id, comment_id, user.email, admin=user.role == "admin")

    await _run(run)
    return Response(status_code=204)
