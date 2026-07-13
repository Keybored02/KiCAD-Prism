"""Client for the local Prism tray agent.

Runs inside KiCad's embedded Python, so this is strictly stdlib — no requests, no
pip. It finds the agent via the discovery file the agent publishes (port + token)
and calls its loopback API.

The plugin does no real work itself: everything (git, project lookup, backend
calls) lives in the agent, so those capabilities exist whether or not KiCad is
open. This is just the UI's transport.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

TIMEOUT = 15
# Diffing the working tree means parsing every changed board; a big one takes a
# couple of seconds cold (the agent caches on mtime, so it's ~instant after that).
DIFF_TIMEOUT = 120
APP_NAME = "kicad-prism"
ENDPOINT_FILE = "agent.json"


class AgentUnavailable(Exception):
    """We couldn't get an answer out of the agent — it's down, or it refused."""


def _http_message(exc, route):
    """Turn an HTTP failure into something that points at the actual fix.

    A 404 from a *live* agent means the agent is older than the plugin: the route didn't
    exist when it started. During development that's the single most likely thing to go
    wrong — you edit the agent, reload the plugin, and the still-running old process
    doesn't have the new endpoint. "Restart the agent" is the real fix, so say it,
    instead of a bare status code or (worse) claiming the agent isn't running at all.
    """
    if exc.code == 404:
        return (
            "This Prism agent doesn't know about %s.\n\n"
            "It's running an older build than the plugin — restart the agent to pick "
            "up the new version." % route
        )
    if exc.code == 401:
        return (
            "The agent rejected our token.\n\n"
            "Its endpoint file is probably stale. Restart the agent."
        )

    detail = ""
    try:
        body = json.loads(exc.read() or b"{}")
        if isinstance(body, dict):
            detail = body.get("error") or ""
    except (ValueError, OSError):
        pass
    return detail or "The agent returned HTTP %d for %s." % (exc.code, route)


def profile():
    """Which agent are we talking to — the installed one, or a dev one?

    A symlinked working copy and a real PCM install can both be loaded by KiCad at
    once (that's the point: iterate on one, verify the other). They must not share an
    agent, or the single-instance guard means only one starts and it silently serves
    both — you edit agent code, restart, and see nothing change.

    So the dev copy uses its own profile. PRISM_PROFILE wins if it's set (for running
    the agent by hand); otherwise we detect it, the same way __init__ does: a dev
    checkout has the repo's build script as a sibling, an install doesn't.
    """
    env = os.environ.get("PRISM_PROFILE", "").strip()
    if env:
        return env
    tools = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    return "dev" if os.path.isfile(os.path.join(tools, "build_agent.py")) else ""


def _config_dir():
    # Duplicated from prism_agent.discovery rather than imported: the plugin is
    # installed into KiCad's plugin dir on its own and cannot import the agent
    # package. Keep the two in sync — they're both tiny.
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or os.path.expanduser("~/AppData/Roaming")
    elif sys.platform == "darwin":
        base = os.path.expanduser("~/Library/Application Support")
    else:
        base = os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config")
    p = profile()
    return os.path.join(base, f"{APP_NAME}-{p}" if p else APP_NAME)


def _endpoint():
    path = os.path.join(_config_dir(), ENDPOINT_FILE)
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        raise AgentUnavailable(
            "The Prism agent isn't running.\n\n"
            "Start it from the system tray, or run:\n"
            "    python -m prism_agent"
        )
    if "port" not in data or "token" not in data:
        raise AgentUnavailable("The agent's endpoint file is malformed.")
    return data


class AgentClient:
    def __init__(self):
        ep = _endpoint()
        self.base = "http://127.0.0.1:%d" % ep["port"]
        self.token = ep["token"]

    def _call(self, method, path, body=None, timeout=TIMEOUT):
        url = self.base + path
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Accept", "application/json")
        req.add_header("Authorization", "Bearer " + self.token)
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as exc:
            # HTTPError subclasses URLError, so it MUST be caught first — otherwise an
            # agent answering "404" is reported as an agent that isn't running, and the
            # user goes off restarting a process that was working fine. An HTTP status
            # is proof it's alive.
            raise AgentUnavailable(_http_message(exc, path)) from exc
        except urllib.error.URLError as exc:
            # Nothing answered: the agent really is gone, or the endpoint file is stale
            # (it quit without cleaning up).
            raise AgentUnavailable(
                "Couldn't reach the Prism agent at %s.\n\n"
                "It may have stopped. Restart it from the tray." % self.base
            ) from exc
        return json.loads(raw) if raw else None

    # -- API ---------------------------------------------------------------

    def health(self):
        return self._call("GET", "/health")

    def project(self, path):
        """Everything the dialog shows: the project, its git state, its Prism row."""
        return self._call("GET", "/project?path=" + urllib.parse.quote(path))

    def changes(self, path):
        """Uncommitted changes, grouped the way the web UI groups a commit's.

        Slow the first time (it parses every changed board); the agent caches on
        file mtime, so subsequent calls are instant until you actually edit.
        """
        return self._call(
            "GET",
            "/changes?path=" + urllib.parse.quote(path),
            timeout=DIFF_TIMEOUT,
        )

    def open_in_prism(self, project_id):
        return self._call("POST", "/open-in-prism", {"project_id": project_id})

    def library(self):
        """Is Prism registered as KiCad's remote symbol provider?

        Returns {configured, kicad_version, linked, stale, linked_url, server_url,
        kicad_running}. `stale` means a Prism provider IS registered, but for a
        different server than the one we're configured for.
        """
        return self._call("GET", "/library")

    # -- settings ----------------------------------------------------------

    def settings(self):
        """Current settings, backend identity, and prism:// registration state."""
        return self._call("GET", "/settings")

    def save_settings(self, changes):
        """Update settings. Returns the same shape as settings().

        The token is write-only: it's never sent back, so an empty api_token means
        "leave it as it is" rather than "clear it" — pass clear_token to clear.
        """
        return self._call("PUT", "/settings", changes)

    def restart(self):
        return self._call("POST", "/restart", {})

    def quit(self):
        return self._call("POST", "/quit", {})
