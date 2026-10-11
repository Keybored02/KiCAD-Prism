"""Distributor connector HTTP API.

Readers (admin, designer, qa) see providers and connector state. Only admins
change anything. Credentials go in and never come out: responses say which are
set. Request bodies are stripped from validation errors so a pasted key is not
echoed back.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Optional, TypeVar

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Response
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import settings
from app.core.security import AuthenticatedUser, require_admin, require_supply_reader
from app.services.supply.connectors import ConnectorError, ConnectorNotFound, ConnectorService
from app.services.supply.providers import registry
from app.services.trackers.secrets import SecretStoreLocked

_PREFIX = "/api/supply"

router = APIRouter(prefix=_PREFIX, tags=["supply"])
service = ConnectorService()

T = TypeVar("T")


class CreateConnectorRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider: str = Field(min_length=1, max_length=64)
    storefront: str = Field(default="", max_length=64)
    display_name: str = Field(default="", max_length=120)
    currency: str = Field(default="", max_length=3)
    credentials: dict[str, str] = Field(default_factory=dict)
    daily_budget: Optional[int] = None
    interactive_reserve_pct: int = 10


class UpdateConnectorRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: Optional[str] = Field(default=None, max_length=120)
    currency: Optional[str] = Field(default=None, max_length=3)
    enabled: Optional[bool] = None
    daily_budget: Optional[int] = None
    interactive_reserve_pct: Optional[int] = None


class CredentialsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    credentials: dict[str, str]


class PauseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=1, max_length=200)


def _actor(user: AuthenticatedUser) -> str:
    return user.email


def _http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, ConnectorNotFound):
        return HTTPException(status_code=404, detail="Connector not found")
    if isinstance(exc, SecretStoreLocked):
        return HTTPException(status_code=503, detail="Credential encryption is locked")
    if isinstance(exc, ConnectorError):
        status = 409 if exc.code == "duplicate" else 403 if exc.code == "provider_disabled" else 400
        return HTTPException(status_code=status, detail={"code": exc.code, "message": str(exc)})
    raise exc


async def _run(call: Callable[[], T]) -> T:
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        raise _http_error(exc) from exc


def _provider_dto(spec) -> dict[str, Any]:
    return {
        "key": spec.key,
        "label": spec.label,
        "capabilities": sorted(spec.capabilities),
        "max_batch": spec.max_batch,
        "stock_pooling": spec.stock_pooling,
        "credential_fields": [
            {"name": item.name, "label": item.label, "secret": item.secret}
            for item in spec.credential_fields
        ],
        "storefronts": list(spec.storefronts),
        "default_daily_budget": spec.default_daily_budget,
    }


def _strip_validation_input(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{key: value for key, value in item.items() if key != "input"} for item in errors]


def register_validation_redaction(app: FastAPI) -> None:
    """Strip request bodies from 422 errors under ``/api/supply``.

    Wraps the handler already installed (the tracker one), so call this after
    it. Other routes keep their existing behavior.
    """

    previous = app.exception_handlers.get(RequestValidationError, request_validation_exception_handler)

    async def handler(request, exc: RequestValidationError) -> JSONResponse:
        if not request.url.path.startswith(_PREFIX):
            return await previous(request, exc)
        return JSONResponse(status_code=422, content={"detail": _strip_validation_input(exc.errors())})

    app.add_exception_handler(RequestValidationError, handler)


@router.get("/providers")
async def list_providers(_user: AuthenticatedUser = Depends(require_supply_reader)) -> list[dict[str, Any]]:
    include_dev = bool(settings.SUPPLY_ENABLE_SIMULATED_PROVIDER)
    return [_provider_dto(spec) for spec in registry.list_specs(include_dev=include_dev)]


@router.get("/connectors")
async def list_connectors(_user: AuthenticatedUser = Depends(require_supply_reader)) -> list[dict[str, Any]]:
    return await _run(service.list)


@router.post("/connectors", status_code=201)
async def create_connector(
    body: CreateConnectorRequest, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    return await _run(lambda: service.create(actor=_actor(admin), **body.model_dump()))


@router.patch("/connectors/{connector_id}")
async def update_connector(
    connector_id: str, body: UpdateConnectorRequest, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    changes = body.model_dump(exclude_unset=True)
    return await _run(lambda: service.update(connector_id, actor=_actor(admin), **changes))


@router.put("/connectors/{connector_id}/credentials")
async def set_connector_credentials(
    connector_id: str, body: CredentialsRequest, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    return await _run(
        lambda: service.set_credentials(connector_id, actor=_actor(admin), credentials=body.credentials)
    )


@router.post("/connectors/{connector_id}/pause")
async def pause_connector(
    connector_id: str, body: PauseRequest, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    return await _run(lambda: service.pause(connector_id, actor=_actor(admin), reason=body.reason))


@router.post("/connectors/{connector_id}/resume")
async def resume_connector(
    connector_id: str, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    return await _run(lambda: service.resume(connector_id, actor=_actor(admin)))


@router.post("/connectors/{connector_id}/terms-review")
async def confirm_terms_review(
    connector_id: str, admin: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    return await _run(lambda: service.confirm_terms_review(connector_id, actor=_actor(admin)))


@router.delete("/connectors/{connector_id}", status_code=204)
async def delete_connector(
    connector_id: str, admin: AuthenticatedUser = Depends(require_admin)
) -> Response:
    await _run(lambda: service.delete(connector_id, actor=_actor(admin)))
    return Response(status_code=204)
