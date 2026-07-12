"""The agent's local HTTP API — what the KiCad plugin (or curl) talks to.

Binds an ephemeral port on 127.0.0.1 only. Every route except /health requires the
shared token (see discovery.py for why that matters on loopback).

Endpoints
    GET  /health                     -> {ok, version, backend_reachable}
    GET  /project?path=<path>        -> {project, git, prism}   (the one the UI needs)
    GET  /changes?path=<path>        -> {changes: [...]}        uncommitted, item-level
    GET  /settings                   -> {settings, identity, protocol}
    PUT  /settings {..}              -> updates and re-points the backend client
    POST /open-in-prism {project_id} -> opens the web app in the browser
    POST /quit                       -> stops the agent
    POST /restart                    -> stops, then relaunches the agent

/quit exists so the API — not the tray icon — is the agent's control surface. On a
desktop with no usable tray (Wayland without an appindicator, SSH, headless) there
would otherwise be no way to stop it, which is exactly the situation that turns a
missing icon into an orphaned process.

Kept to the stdlib's http.server: this handles a handful of requests from one
local client, so a framework would be dead weight and another thing to install.
"""

from __future__ import annotations

import json
import logging
import secrets
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from . import autostart, discovery, protocol, settings as settings_store
from .prism_client import PrismClient, PrismConfig
from .projects import git_status, identify_project
from .worktree_diff import uncommitted_changes

VERSION = "0.3.1"

log = logging.getLogger(__name__)


class AgentState:
    """What the request handlers need. Passed in rather than global."""

    def __init__(self, prism: PrismClient):
        self.prism = prism
        self.token = secrets.token_urlsafe(32)
        # Set by the entry point. Lets /quit stop the agent, so the tray icon is a
        # convenience rather than the only way out.
        self.request_stop = None
        self.request_restart = None
        # Diffing a big board takes a second or two, and reopening the dialog
        # shouldn't re-parse a board that hasn't changed. Keyed on the mtimes of
        # the files git says are dirty, so any edit invalidates it by itself.
        self._changes_cache: dict[tuple, list[dict]] = {}
        self._changes_lock = threading.Lock()

    def rebuild_client(self, saved) -> None:
        """Re-point at the backend after the URL or token changed.

        Without this a new server URL wouldn't take effect until the agent
        restarted, which is a confusing thing to hand a user who just pressed Save.
        """
        self.prism = PrismClient(
            PrismConfig(base_url=saved.server_url, token=saved.api_token)
        )
        # A different server means different projects, so the cached diff answers
        # (which carry the Prism project row) are no longer trustworthy.
        with self._changes_lock:
            self._changes_cache = {}

    def changes(self, repo_root: str, scope: str) -> list[dict]:
        key = _worktree_fingerprint(repo_root, scope)
        with self._changes_lock:
            hit = self._changes_cache.get(key)
            if hit is not None:
                return hit

        result = uncommitted_changes(repo_root, scope)

        with self._changes_lock:
            # One project's worth of state is all we need; a stale key just means
            # the next call recomputes.
            self._changes_cache = {key: result}
        return result


def _worktree_fingerprint(repo_root: str, scope: str) -> tuple:
    """A key that changes whenever the working tree does.

    git status is cheap (milliseconds); parsing boards is not. So we let git tell
    us *which* files are dirty and stat those, rather than caching on a timer and
    showing the user stale changes.
    """
    from .projects import _run_git

    try:
        status = _run_git(Path(repo_root), "status", "--porcelain", strip=False)
    except Exception:
        return (repo_root, scope, None)

    stamps = []
    for line in status.splitlines():
        rel = line[3:].strip().strip('"')
        if " -> " in rel:
            rel = rel.split(" -> ", 1)[1]
        try:
            stamps.append((rel, (Path(repo_root) / rel).stat().st_mtime_ns))
        except OSError:
            stamps.append((rel, None))  # deleted; its absence is the signal
    return (repo_root, scope, tuple(stamps))


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

    def handle_one_request(self):
        """Never let a bug in one route take the agent down.

        socketserver logs the traceback and closes the socket, so the client sees
        `RemoteDisconnected: remote end closed connection without response` — a
        baffling error that says nothing about the actual fault. Worse, the agent
        can end up dead with its discovery file still on disk, so the plugin
        cheerfully connects to a port nobody is listening on.

        A single failing request should be a 500 with a real message, not a
        casualty list. (This exact scenario is why: an AttributeError in /changes
        killed the agent on every plugin launch.)
        """
        try:
            super().handle_one_request()
        except Exception:
            log.exception("unhandled error serving %s", getattr(self, "path", "?"))
            try:
                self._send(500, {"error": "the agent hit an internal error"})
            except Exception:  # noqa: S110 - the socket is probably already gone
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

        if route.path == "/changes":
            path = (query.get("path") or [""])[0]
            if not path:
                self._send(400, {"error": "path is required"})
                return
            self._send(200, self._changes_payload(path))
            return

        if route.path == "/settings":
            self._send(200, self._settings_payload())
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

        if route.path == "/quit":
            if not self.state.request_stop:
                self._send(501, {"error": "this agent can't stop itself"})
                return
            # Answer first, then stop: shutting the server down from inside a
            # handler would deadlock, so request_stop defers to another thread.
            self._send(200, {"ok": True, "stopping": True})
            self.state.request_stop()
            return

        if route.path == "/restart":
            if not self.state.request_restart:
                self._send(501, {"error": "this agent can't restart itself"})
                return
            self._send(200, {"ok": True, "restarting": True})
            self.state.request_restart()
            return

        self._send(404, {"error": "not found"})

    def do_PUT(self):  # noqa: N802
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

        if route.path == "/settings":
            self._send(200, self._save_settings(body))
            return

        self._send(404, {"error": "not found"})

    # -- settings ----------------------------------------------------------

    def _settings_payload(self) -> dict:
        current = settings_store.load()
        return {
            # Redacted: the token would otherwise travel over loopback HTTP and
            # end up in logs and screenshots. The UI only needs to know it's set.
            "settings": current.to_dict(redact=True),
            "identity": self.state.prism.identity(),
            "protocol": {
                "registered": protocol.is_registered(),
                # macOS can't register a scheme from a plain script (it needs an
                # .app bundle), so tell the UI rather than offering a toggle that
                # would always fail.
                "supported": sys.platform != "darwin",
            },
            "autostart": {"enabled": autostart.is_enabled(), "supported": True},
        }

    def _save_settings(self, body: dict) -> dict:
        changes = {
            k: body[k]
            for k in (
                "server_url",
                "api_token",
                "protocol_handler",
                "autostart",
                "first_run_done",
            )
            if k in body
        }

        # An empty api_token means "leave it alone" (the UI never receives the real
        # one, so it can't echo it back). Clearing is explicit, via clear_token.
        if changes.get("api_token") == "" and not body.get("clear_token"):
            changes.pop("api_token", None)
        if body.get("clear_token"):
            changes["api_token"] = ""

        # These two don't merely get stored — they register something with the OS.
        # If the OS refuses, don't persist the setting: a saved `true` with nothing
        # actually installed would leave the UI confidently reporting a handler
        # that isn't there.
        #
        # `current` reads the OS, not the settings file, so the two can't drift: if
        # a user deletes the registry key by hand, we notice.
        errors: list[str] = []
        toggles = (
            (
                "protocol_handler",
                protocol.is_registered,
                lambda want: protocol.register() if want else protocol.unregister(),
                protocol.RegistrationError,
            ),
            (
                "autostart",
                autostart.is_enabled,
                autostart.set_enabled,
                autostart.AutostartError,
            ),
        )
        for key, current, apply, failure in toggles:
            want = changes.get(key)
            if want is None or bool(want) == current():
                continue  # not asked for, or already in that state
            try:
                apply(bool(want))
            except failure as exc:
                changes.pop(key, None)
                errors.append(str(exc))

        saved = settings_store.update(**changes)
        # Re-point the backend client, or the new URL/token wouldn't take effect
        # until the agent restarted.
        self.state.rebuild_client(saved)
        payload = self._settings_payload()
        if errors:
            payload["error"] = "\n\n".join(errors)
        return payload

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

    def _changes_payload(self, path: str) -> dict:
        """Uncommitted changes, grouped the way the web UI groups a commit's."""
        project = identify_project(path)
        if not project or not project.repo_root:
            return {"changes": [], "project": None, "prism": None}

        changes = self.state.changes(project.repo_root, project.path)
        # The project id lets the plugin deep-link a change into Prism's viewer.
        prism = self.state.prism.find_project_by_path(project.path)
        return {
            "changes": changes,
            "project": project.to_dict(),
            "prism": prism,
        }


def make_server(prism: PrismClient) -> tuple[ThreadingHTTPServer, AgentState]:
    """Bind 127.0.0.1 on an ephemeral port. Caller runs serve_forever()."""
    state = AgentState(prism)
    handler = type("Handler", (_Handler,), {"state": state})
    # Port 0 = let the OS pick a free one; we publish it via discovery.
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    # Hang the state off the server too, so callers holding only the server (the
    # tray menu) can reach request_stop/request_restart without extra plumbing.
    server.state = state
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
