"""The agent's local HTTP API, what the KiCad plugin (or curl) talks to.

Binds an ephemeral port on 127.0.0.1 only. Every route except /health requires the
shared token (see discovery.py for why that matters on loopback).

Endpoints
    GET  /health                     -> {ok, version, backend_reachable}
    GET  /project?path=<path>        -> {project, git, prism}   (the one the UI needs)
    GET  /changes?path=<path>        -> {changes: [...]}        uncommitted, item-level
    GET  /settings                   -> {settings, identity, protocol}
    GET  /library                    -> is Prism KiCad's remote symbol provider, and
                                        does it point at the server we're configured for?
    GET  /locate?id=<id>             -> where this machine keeps a project, by marker
    GET  /publish?path=<path>        -> what publishing this folder would involve
    GET  /checkout?path=&ref=        -> could we check this ref out, and if not, why not
    PUT  /settings {..}              -> updates and re-points the backend client
    POST /open-in-prism {project_id} -> opens the web app in the browser
    POST /publish {path, name}       -> commit if needed, reserve a repo, push, register
    POST /checkout {path, ref}       -> move the working tree to a commit/branch/tag
    POST /pull {path}                -> fetch and FAST-FORWARD (never merge; see checkout)
    POST /quit                       -> stops the agent
    POST /restart                    -> stops, then relaunches the agent

The write routes refuse rather than warn when they would destroy uncommitted work: a
commit is recoverable from git, an unsaved board edit is not. See checkout.py.

/quit exists so the API, not the tray icon, is the agent's control surface. On a
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
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

from . import (
    adopt,
    autostart,
    checkout,
    discovery,
    identity,
    protocol,
    remote_library,
    settings as settings_store,
)
from .prism_client import PrismClient, PrismConfig
from .projects import git_status, identify_project
from .worktree_diff import uncommitted_changes

VERSION = "0.4.0"

# The oldest plugin this agent can serve.
#
# Only bump this when a change here genuinely BREAKS an older plugin, not merely
# when the agent gains something. Every route so far has been additive, so an older
# plugin still works fine against a newer agent; declaring otherwise would break
# working setups for no reason. The compatibility that actually bites runs the other
# way (a new plugin meeting an old agent, because autostart kept it alive), and the
# plugin checks for that itself.
PLUGIN_MIN = "0.1.0"

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
        # What the backend expects of the plugin. Cached: /health runs on every plugin
        # open, and a release doesn't change under a running agent.
        self._server_plugin: dict | None = None

    def server_plugin_version(self) -> dict | None:
        """The plugin version the backend expects, or None if it can't say.

        None covers both an unreachable backend and one too old to have the endpoint.
        Either way the plugin should carry on rather than refuse to work.
        """
        if self._server_plugin is None:
            self._server_plugin = self.prism.plugin_version()
        return self._server_plugin

    def rebuild_client(self, saved) -> None:
        """Re-point at the backend after the URL or token changed.

        Without this a new server URL wouldn't take effect until the agent
        restarted, which is a confusing thing to hand a user who just pressed Save.
        """
        self.prism = PrismClient(
            PrismConfig(base_url=saved.server_url, token=saved.api_token)
        )
        # A different server means different projects, so the cached diff answers
        # (which carry the Prism project row) are no longer trustworthy. It may also
        # expect a different plugin version.
        self._server_plugin = None
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
        `RemoteDisconnected: remote end closed connection without response`, a
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
                    # The oldest plugin this agent can serve. The plugin checks our
                    # version against ITS minimum; this is the other direction, so a
                    # mismatch is caught whichever side is the stale one. Autostart
                    # means an old agent routinely meets a new plugin after an
                    # update, and a stale plugin can meet a new agent too.
                    "plugin_min": PLUGIN_MIN,
                    "backend_reachable": self.state.prism.health(),
                    # What the SERVER expects of the plugin. The plugin follows the
                    # server it talks to, so this is what stops the two drifting.
                    "server_plugin": self.state.server_plugin_version(),
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

        if route.path == "/library":
            server = settings_store.load().server_url
            self._send(200, remote_library.status(server))
            return

        if route.path == "/locate":
            # "Do I have this project, and where?" Answered from the `.prism.json`
            # markers under the user's projects roots, so it does not care where the
            # server keeps its own copy. This is what prism://open/<id> will use.
            project_id = (query.get("id") or [""])[0]
            if not project_id:
                self._send(400, {"error": "id is required"})
                return
            self._send(200, self._locate_payload(project_id))
            return

        if route.path == "/publish":
            # What publishing this folder WOULD involve. Read-only, so the UI can say
            # the right thing (and show what a first commit would sweep up) before the
            # user agrees to anything.
            path = (query.get("path") or [""])[0]
            if not path:
                self._send(400, {"error": "path is required"})
                return
            self._send(200, adopt.status(path))
            return

        if route.path == "/checkout":
            # Could we check this ref out, and if not, why not? Read-only, so a refusal
            # is explained BEFORE the user commits to the action rather than after.
            path = (query.get("path") or [""])[0]
            if not path:
                self._send(400, {"error": "path is required"})
                return
            try:
                self._send(200, checkout.status(path, (query.get("ref") or [""])[0]))
            except checkout.CheckoutError as exc:
                self._send(400, {"error": str(exc)})
            return

        if route.path == "/stash":
            # What is currently stashed. Includes stashes made by hand in a terminal:
            # they are still the user's work, and hiding them from a list of "your
            # stashed changes" is a good way to let someone destroy them.
            path = (query.get("path") or [""])[0]
            if not path:
                self._send(400, {"error": "path is required"})
                return
            self._send(200, {"stashes": checkout.stashes(path)})
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
            # The URL is built here, not in the plugin: project_url is the one place
            # that knows the web app's route, and hand-rolling it elsewhere is how it
            # drifted to the wrong (pluralised) path before.
            url = self.state.prism.project_url(project_id)
            commit = body.get("commit")
            if commit:
                # ?history= opens the History page and jumps to the commit, the way
                # clicking a release does. (?commit= is a different thing: it opens the
                # board *viewer* at that commit.)
                url += "?history=%s" % quote(str(commit))
            webbrowser.open(url)
            self._send(200, {"ok": True})
            return

        if route.path == "/library":
            server = settings_store.load().server_url
            try:
                if body.get("remove"):
                    result = remote_library.unlink(server)
                else:
                    result = remote_library.link(server)
            except remote_library.RemoteLibraryError as exc:
                self._send(400, {"error": str(exc)})
                return
            self._send(200, {"ok": True, **result})
            return

        if route.path == "/publish":
            # Publish a project this machine has, into a repo Prism hosts.
            #
            # The server cannot do this itself: it cannot read a folder on somebody
            # else's laptop. We can, so we init/commit if needed, ask the server to
            # reserve an origin, push into it, and tell the server the push landed.
            path = body.get("path") or ""
            name = (body.get("name") or "").strip()
            if not path or not name:
                self._send(400, {"error": "path and name are required"})
                return
            try:
                self._send(
                    200, self._publish(path, name, body.get("description") or "")
                )
            except adopt.AdoptError as exc:
                self._send(400, {"error": str(exc)})
            return

        if route.path == "/checkout":
            # Move the working tree to a commit, branch or tag. The guards are
            # re-checked inside, immediately before acting: the user may have saved a
            # board in KiCad since the UI last looked, and a stale "it was clean" is
            # exactly how uncommitted work gets destroyed.
            #
            # `stash_message` present (even empty) means "put my changes aside first".
            # Absent means uncommitted changes are still a refusal. The distinction is
            # consent: moving someone's work needs an explicit yes.
            path = body.get("path") or ""
            ref = body.get("ref") or ""
            if not path or not ref:
                self._send(400, {"error": "path and ref are required"})
                return
            try:
                self._send(200, checkout.checkout(path, ref, body.get("stash_message")))
            except checkout.CheckoutError as exc:
                self._send(400, {"error": str(exc)})
            return

        if route.path == "/pull":
            # Fetch and fast-forward. NEVER a merge: a .kicad_pcb cannot be merged
            # textually, and git would happily produce a board neither author drew.
            path = body.get("path") or ""
            if not path:
                self._send(400, {"error": "path is required"})
                return
            try:
                self._send(200, checkout.pull(path, body.get("stash_message")))
            except checkout.CheckoutError as exc:
                self._send(400, {"error": str(exc)})
            return

        if route.path == "/stash":
            # Put uncommitted work aside, or bring it back. The way OUT of the dirty
            # guard: refusing to move was correct, but a refusal with no way forward is
            # a dead end.
            path = body.get("path") or ""
            if not path:
                self._send(400, {"error": "path is required"})
                return
            try:
                if body.get("restore"):
                    result = checkout.restore(path, body.get("ref") or "stash@{0}")
                else:
                    result = checkout.stash(path, body.get("message") or "")
                self._send(200, result)
            except checkout.CheckoutError as exc:
                self._send(400, {"error": str(exc)})
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
                # All three platforms now. macOS needs an .app bundle to claim a
                # scheme, but we build one at opt-in time rather than shipping it.
                "supported": True,
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
                "projects_roots",
            )
            if k in body
        }

        if "projects_roots" in changes:
            changes["projects_roots"] = _clean_roots(changes["projects_roots"])

        # An empty api_token means "leave it alone" (the UI never receives the real
        # one, so it can't echo it back). Clearing is explicit, via clear_token.
        if changes.get("api_token") == "" and not body.get("clear_token"):
            changes.pop("api_token", None)
        if body.get("clear_token"):
            changes["api_token"] = ""

        # These two don't merely get stored, they register something with the OS.
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

        saved, ignored = settings_store.apply(**changes)

        # A setting this agent is too old to know about. It was dropped, so saying
        # nothing would report success while the user's value vanished, which is exactly
        # what happened with projects_roots. Name the fix: the agent, not the plugin, is
        # the stale half.
        if ignored:
            errors.append(
                "This agent is too old to store: %s.\n\n"
                "Restart the agent to pick up the new version."
                % ", ".join(sorted(ignored))
            )

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
        prism = self.state.prism.find_project(project.path)

        return {
            "project": project.to_dict(),
            "git": git.to_dict() if git else None,
            "prism": prism,
            # Everything else the header needs, in the one call the dialog already
            # makes. identity() is deliberately NOT cached the way the plugin version
            # is: who you are can change under a running agent (you sign in, a token
            # expires), and a stale name in the header would be worse than one more
            # call to a backend this handler is already talking to.
            "user": self.state.prism.identity().get("user"),
            "library": remote_library.status(settings_store.load().server_url),
        }

    def _changes_payload(self, path: str) -> dict:
        """Uncommitted changes, grouped the way the web UI groups a commit's."""
        project = identify_project(path)
        if not project or not project.repo_root:
            return {"changes": [], "project": None, "prism": None}

        changes = self.state.changes(project.repo_root, project.path)
        # The project id lets the plugin deep-link a change into Prism's viewer.
        prism = self.state.prism.find_project(project.path)
        return {
            "changes": changes,
            "project": project.to_dict(),
            "prism": prism,
        }

    def _publish(self, path: str, name: str, description: str) -> dict:
        """init (if needed) -> reserve -> push -> tell the server it landed.

        Ordered so a failure never leaves a project registered with an empty repo. The
        server registers nothing until the push has actually arrived.
        """
        state = adopt.status(path)

        if state["has_origin"]:
            raise adopt.AdoptError(
                f"This folder already pushes to {state['origin']}. "
                "Adopting would replace it."
            )

        if not state["is_repo"] or not state["has_commits"]:
            adopt.initialise(path)

        reserved = self.state.prism.reserve_project(name, description)
        if not reserved:
            raise adopt.AdoptError(
                "The server would not reserve a repository. Check that Prism is "
                "reachable and that you are signed in."
            )

        origin = reserved.get("origin_url") or ""
        if not origin:
            raise adopt.AdoptError("The server gave no URL to push to.")

        adopt.publish(path, origin)

        registered = self.state.prism.adopt_pushed(reserved["id"], name, description)
        if not registered:
            # The push succeeded, so their work is safe on the server even though the
            # project did not register. Say exactly that rather than implying data loss.
            raise adopt.AdoptError(
                "Pushed, but the server did not register the project. Your work is "
                "safe in the repository; try again from Prism."
            )

        # Stamp the marker so the agent can find this checkout by id from now on,
        # exactly as it would for one that was cloned.
        identity.write(
            path,
            registered.get("id") or reserved["id"],
            settings_store.load().server_url,
        )

        return {"ok": True, **registered}

    def _locate_payload(self, project_id: str) -> dict:
        """Where this machine keeps a given Prism project, if anywhere.

        `roots` comes back too, because "not found" means something different when
        no roots are configured (we did not look anywhere) than when they are (we
        looked and it is not there), and the caller has to be able to tell those
        apart rather than guessing.
        """
        roots = settings_store.load().projects_roots
        return {
            "id": project_id,
            "path": identity.find_by_id(project_id, roots),
            "roots": roots,
        }


def _clean_roots(raw) -> list[str]:
    """Tidy a list of projects roots without second-guessing the user.

    Blanks and duplicates go, and paths are resolved to a canonical form so the same
    folder spelled two ways is stored once. A root that does not exist is KEPT: a
    removable drive or a network share that is offline right now is still where the
    user keeps their projects, and quietly deleting it from their settings because
    we could not stat it would be its own bug.
    """
    if not isinstance(raw, list):
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, str) or not item.strip():
            continue
        try:
            resolved = str(Path(item.strip()).expanduser().resolve())
        except (OSError, ValueError):
            resolved = item.strip()
        key = resolved.casefold()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(resolved)
    return cleaned


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
    # The version goes in the discovery file so a NEWER agent starting up can tell it
    # should retire us. Without it an update leaves the old agent serving forever.
    discovery.write_endpoint(port, state.token, VERSION)

    thread = threading.Thread(
        target=server.serve_forever, name="prism-agent-http", daemon=True
    )
    thread.start()
    return server, thread, state
