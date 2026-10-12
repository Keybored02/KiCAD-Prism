"""A person's sign-in at DigiKey, for change notices. Administrators only.

``POST /api/supply/connectors/{id}/signin`` gives the DigiKey address to open; DigiKey sends the browser back to
``GET /api/supply/oauth/digikey/callback``, which keeps the grant and returns to the Connectors tab with the result
in the address. The callback needs the same administrator's session and the one-time state from the start.
"""

from __future__ import annotations

import asyncio
from typing import Any, Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse

from app.api import supply_connectors
from app.core.security import AuthenticatedUser, require_admin
from app.services.supply import oauth
from app.services.supply.connectors import ConnectorNotFound
from app.services.trackers.secrets import SecretStoreLocked

router = APIRouter(prefix="/api/supply", tags=["supply"])

RETURN_TO = "/?section=library-manager&libraryView=connectors"


def _service():
    return supply_connectors.service


@router.get("/connectors/{connector_id}/signin")
async def signin_status(connector_id: str, _admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    """Whether someone is signed in for the connector, and the callback address the DigiKey app must list."""

    def read() -> dict[str, Any]:
        service = _service()
        service.get(connector_id)
        with service.store.connection() as conn:
            return oauth.status(conn, connector_id) | {"redirect_uri": oauth.redirect_uri()}

    try:
        return await asyncio.to_thread(read)
    except ConnectorNotFound as exc:
        raise HTTPException(status_code=404, detail="Connector not found") from exc


@router.post("/connectors/{connector_id}/signin")
async def start_signin(connector_id: str, admin: AuthenticatedUser = Depends(require_admin)) -> dict[str, str]:
    try:
        url = await asyncio.to_thread(oauth.start, _service(), connector_id, admin.email)
    except ConnectorNotFound as exc:
        raise HTTPException(status_code=404, detail="Connector not found") from exc
    except oauth.SignInError as exc:
        raise HTTPException(status_code=400, detail={"code": "signin_unavailable", "message": str(exc)}) from exc
    except SecretStoreLocked as exc:
        raise HTTPException(status_code=503, detail={"code": "keyring_locked", "message": "The credential keyring is locked."}) from exc
    return {"url": url}


@router.delete("/connectors/{connector_id}/signin", status_code=204)
async def forget_signin(connector_id: str, admin: AuthenticatedUser = Depends(require_admin)) -> Response:
    await asyncio.to_thread(oauth.forget, _service(), connector_id, admin.email)
    return Response(status_code=204)


@router.get(oauth.CALLBACK_PATH.removeprefix("/api/supply"), include_in_schema=False)
async def digikey_callback(
    code: Optional[str] = Query(default=None, max_length=2000),
    state: Optional[str] = Query(default=None, max_length=200),
    error: Optional[str] = Query(default=None, max_length=200),
    admin: AuthenticatedUser = Depends(require_admin),
) -> RedirectResponse:
    def back(result: str, message: str = "") -> RedirectResponse:
        query = urlencode({"signin": result, **({"message": message[:200]} if message else {})})
        return RedirectResponse(f"{RETURN_TO}&{query}", status_code=303)

    if error:
        return back("failed", "DigiKey did not give access.")
    try:
        await asyncio.to_thread(oauth.finish, _service(), state or "", code or "", admin.email)
    except oauth.SignInError as exc:
        return back("failed", str(exc))
    except (ConnectorNotFound, SecretStoreLocked):
        return back("failed", "The connector or its credentials cannot be read.")
    return back("ok")
