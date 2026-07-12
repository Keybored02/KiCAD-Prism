"""The agent's local HTTP API — what the KiCad plugin (or curl) talks to.

Binds an ephemeral port on 127.0.0.1 only. Every route except /health requires the
shared token (see discovery.py for why that matters on loopback).

Endpoints
    GET  /health                     -> {ok, version, backend_reachable}
    GET  /project?path=<path>        -> {project, git, prism}   (the one the UI needs)
    POST /open-in-prism {project_id} -> opens the web app in the browser

Kept to the stdlib's http.server: this handles a handful of requests from one
local client, so a framework would be dead weight and another thing to install.
"""

from __future__ import annotations

import json
import secrets
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from . import discovery
from .prism_client import PrismClient, PrismConfig
from .projects import git_status, identify_project

VERSION = "0.1.0"


class AgentState:
    """What the request handlers need. Passed in rather than global."""

    def __init__(self, prism: PrismClient):
        self.prism = prism
        self.token = secrets.token_urlsafe(32)


class _Handler(BaseHTTPRequestHandler):
    state: AgentState  # injected by make_server

    # -- helpers ----------------------------------------------------------

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _authorised(self) -> bool:
        header = self.headers.get("Authorization", "")
        token = header[7:] if header.startswith("Bearer ") else ""
        # Constant-time compare: the token guards git + filesystem access.
        return secrets.compare_digest(token, self.state.token)

    def log_message(self, fmt, *args):  # noqa: A003 - silence stdlib access logging
        pass

    # -- routes -----------------------------------------------------------

    def do_GET(self):  # noqa: N802 - stdlib naming
        route = urlparse(self.path)
        query = parse_qs(route.query)

        if route.path == "/health":
            self._send(
                200,
                {
                    "ok": True,
                    "version": VERSION,
                    "backend_reachable": self.state.prism.health(),
                },
            )
            return

        if not self._authorised():
            self._send(401, {"error": "unauthorised"})
            return

        if route.path == "/project":
            path = (query.get("path") or [""])[0]
            if not path:
                self._send(400, {"error": "path is required"})
                return
            self._send(200, self._project_payload(path))
            return

        self._send(404, {"error": "not found"})

    def do_POST(self):  # noqa: N802
        route = urlparse(self.path)

        if not self._authorised():
            self._send(401, {"error": "unauthorised"})
            return

        length = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            self._send(400, {"error": "invalid json"})
            return

        if route.path == "/open-in-prism":
            project_id = body.get("project_id")
            if not project_id:
                self._send(400, {"error": "project_id is required"})
                return
            webbrowser.open(self.state.prism.project_url(project_id))
            self._send(200, {"ok": True})
            return

        self._send(404, {"error": "not found"})

    # -- the payload the plugin renders ------------------------------------

    def _project_payload(self, path: str) -> dict:
        project = identify_project(path)
        if not project:
            return {"project": None, "git": None, "prism": None}

        git = git_status(project.repo_root) if project.repo_root else None
        # The backend may be down or unconfigured; that's fine, we just say so.
        prism = self.state.prism.find_project_by_path(project.path)

        return {
            "project": project.to_dict(),
            "git": git.to_dict() if git else None,
            "prism": prism,
        }


def make_server(prism: PrismClient) -> tuple[ThreadingHTTPServer, AgentState]:
    """Bind 127.0.0.1 on an ephemeral port. Caller runs serve_forever()."""
    state = AgentState(prism)
    handler = type("Handler", (_Handler,), {"state": state})
    # Port 0 = let the OS pick a free one; we publish it via discovery.
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    return server, state


def serve(
    prism_config: PrismConfig,
) -> tuple[ThreadingHTTPServer, threading.Thread, AgentState]:
    """Start the API in a background thread and publish where to find it."""
    server, state = make_server(PrismClient(prism_config))
    port = server.server_address[1]
    discovery.write_endpoint(port, state.token)

    thread = threading.Thread(
        target=server.serve_forever, name="prism-agent-http", daemon=True
    )
    thread.start()
    return server, thread, state
