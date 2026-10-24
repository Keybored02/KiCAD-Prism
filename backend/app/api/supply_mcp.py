"""A read-only Model Context Protocol endpoint for supply data, so an assistant can ask "which parts of project X are at risk".

It speaks MCP's streamable HTTP in its plainest form: one JSON-RPC 2.0 request in a POST, one JSON answer back. It offers
tools only, all of them reads, and it answers as the caller: a service client's role decides what it sees, and a project the
caller cannot open is not found. Nothing here writes, tracks, reads a distributor or reveals credentials.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable

from fastapi import APIRouter, Depends, Request, Response

from app.api import supply_connectors
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_supply_reader
from app.services.supply import cross_reference, parts, parts_view, project_supply

router = APIRouter(prefix="/api/supply/mcp", tags=["supply"])

PROTOCOL_VERSION = "2025-03-26"
_AT_RISK = ("error", "fatal")

TOOLS: list[dict[str, Any]] = [
    {
        "name": "parts_at_risk",
        "description": "The parts of a project's stored BOM that need a look: out of stock, short, end of life, or in a poor state. Reads no distributor.",
        "inputSchema": {
            "type": "object",
            "properties": {"project_id": {"type": "string"}, "variant": {"type": "string", "description": "A design variant; empty is the base design."}},
            "required": ["project_id"],
        },
    },
    {
        "name": "part_status",
        "description": "How a manufacturer part stands now: status, stock, lifecycle and how it is tracked. Reads no distributor.",
        "inputSchema": {
            "type": "object",
            "properties": {"manufacturer": {"type": "string"}, "mpn": {"type": "string"}},
            "required": ["manufacturer", "mpn"],
        },
    },
    {
        "name": "best_alternate",
        "description": "Alternatives to a part, closest first (direct, same form-fit-function, functional), from parameters distributors list. Footprint and pins are not compared.",
        "inputSchema": {
            "type": "object",
            "properties": {"manufacturer": {"type": "string"}, "mpn": {"type": "string"}},
            "required": ["manufacturer", "mpn"],
        },
    },
]


def _store():
    return supply_connectors.service.store


def _text(payload: Any) -> dict[str, Any]:
    import json

    return {"content": [{"type": "text", "text": json.dumps(payload, default=str)}]}


def _failure(message: str) -> dict[str, Any]:
    return {"content": [{"type": "text", "text": message}], "isError": True}


def _parts_at_risk(user: AuthenticatedUser, arguments: dict[str, Any]) -> dict[str, Any]:
    project_id = str(arguments.get("project_id") or "")
    try:
        get_project_for_role_or_404(project_id, user.role)
    except Exception:  # noqa: BLE001 - not found and not allowed look the same
        return _failure("No such project.")
    with _store().connection() as conn:
        overview = project_supply.overview(conn, project_id, str(arguments.get("variant") or ""), 1)
    if not overview["available"]:
        return _failure("This project's BOM has not been read yet.")
    risky = [
        {key: part[key] for key in ("manufacturer", "mpn", "quantity", "status", "stock", "lifecycle", "short", "references")}
        for part in overview["parts"] if part["status"] in _AT_RISK or part["short"]
    ]
    return _text({"project_id": project_id, "parts": len(overview["parts"]), "at_risk": risky})


def _find(conn, arguments: dict[str, Any]):
    return parts.find_part(conn, str(arguments.get("manufacturer") or ""), str(arguments.get("mpn") or ""))


def _part_status(user: AuthenticatedUser, arguments: dict[str, Any]) -> dict[str, Any]:
    with _store().connection() as conn:
        part = _find(conn, arguments)
        if part is None:
            return _failure("Prism does not know that part.")
        (item,) = parts_view.summaries_for(conn, [part.id])
    return _text({key: item[key] for key in ("manufacturer", "mpn", "status", "stock", "lifecycle", "unit_price", "currency", "tracking", "problem")})


def _best_alternate(user: AuthenticatedUser, arguments: dict[str, Any]) -> dict[str, Any]:
    with _store().connection() as conn:
        part = _find(conn, arguments)
        if part is None:
            return _failure("Prism does not know that part.")
        found = cross_reference.candidates(conn, part.id, limit=5)
    return _text(found)


_HANDLERS: dict[str, Callable[[AuthenticatedUser, dict[str, Any]], dict[str, Any]]] = {
    "parts_at_risk": _parts_at_risk, "part_status": _part_status, "best_alternate": _best_alternate,
}


def _answer(request_id: Any, result: Any = None, error: tuple[int, str] | None = None) -> dict[str, Any]:
    if error is not None:
        return {"jsonrpc": "2.0", "id": request_id, "error": {"code": error[0], "message": error[1]}}
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def handle(user: AuthenticatedUser, message: Any) -> dict[str, Any] | None:
    """One JSON-RPC message to its answer; None for a notification, which gets none."""

    if not isinstance(message, dict) or message.get("jsonrpc") != "2.0" or not isinstance(message.get("method"), str):
        return _answer(message.get("id") if isinstance(message, dict) else None, error=(-32600, "Not a JSON-RPC 2.0 request."))
    method, request_id = message["method"], message.get("id")
    if "id" not in message:
        return None
    params = message.get("params") if isinstance(message.get("params"), dict) else {}
    if method == "initialize":
        return _answer(request_id, {
            "protocolVersion": PROTOCOL_VERSION, "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "kicad-prism-supply", "version": "1"},
            "instructions": "Read-only supply data. Nothing here orders, tracks or changes anything.",
        })
    if method == "ping":
        return _answer(request_id, {})
    if method == "tools/list":
        return _answer(request_id, {"tools": TOOLS})
    if method == "tools/call":
        handler = _HANDLERS.get(str(params.get("name")))
        if handler is None:
            return _answer(request_id, error=(-32602, "Unknown tool."))
        arguments = params.get("arguments") if isinstance(params.get("arguments"), dict) else {}
        return _answer(request_id, handler(user, arguments))
    return _answer(request_id, error=(-32601, "Method not found."))


@router.post("")
async def mcp(request: Request, user: AuthenticatedUser = Depends(require_supply_reader)) -> Response:
    import json

    try:
        message = await request.json()
    except ValueError:
        return Response(json.dumps(_answer(None, error=(-32700, "Parse error."))), media_type="application/json")
    if isinstance(message, list):
        answers = [answer for answer in await asyncio.gather(*(asyncio.to_thread(handle, user, item) for item in message[:20])) if answer]
        return Response(json.dumps(answers), media_type="application/json") if answers else Response(status_code=202)
    answer = await asyncio.to_thread(handle, user, message)
    if answer is None:
        return Response(status_code=202)
    return Response(json.dumps(answer, default=str), media_type="application/json")
