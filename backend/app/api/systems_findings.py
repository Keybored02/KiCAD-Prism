"""System Builder finding waivers (SB2-100, D-P2-56): waive a warning or info finding with a note,
or take a waiver back. Registered on ``systems.router``."""

from __future__ import annotations

from fastapi import Depends, Request, Response
from pydantic import BaseModel, Field

from app.api.systems import _caller, _expected_version, _no_content, _respond, _run, router, system_service
from app.core.security import AuthenticatedUser, require_designer, require_viewer


class WaiverRequest(BaseModel):
    findingKey: str = Field(min_length=1, max_length=2000)
    note: str = Field(min_length=1, max_length=2000)


@router.post("/{system_id}/waivers", dependencies=[Depends(require_designer)], status_code=201)
async def waive_finding(
    system_id: str, body: WaiverRequest, request: Request, response: Response,
    user: AuthenticatedUser = Depends(require_viewer),
):
    version = _expected_version(request, system_id)
    result = await _run(system_id, lambda: system_service.service.waive_finding(
        _caller(user), system_id, version, body.findingKey, body.note,
    ))
    return _respond(result, response, status_code=201)


@router.delete("/{system_id}/waivers/{waiver_id}", dependencies=[Depends(require_designer)])
async def unwaive_finding(system_id: str, waiver_id: str, request: Request, user: AuthenticatedUser = Depends(require_viewer)):
    version = _expected_version(request, system_id)
    return _no_content(await _run(system_id, lambda: system_service.service.unwaive_finding(
        _caller(user), system_id, version, waiver_id,
    )))
