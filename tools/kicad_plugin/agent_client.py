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
    """The tray agent isn't running (or we can't reach it)."""


def _config_dir():
    # Duplicated from prism_agent.discovery rather than imported: the plugin is
    # copied into KiCad's plugin dir on its own and cannot import the agent
    # package. Keep the two in sync — they're both tiny.
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or os.path.expanduser("~/AppData/Roaming")
    elif sys.platform == "darwin":
        base = os.path.expanduser("~/Library/Application Support")
    else:
        base = os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config")
    return os.path.join(base, APP_NAME)


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
        except urllib.error.URLError as exc:
            # A stale endpoint file (agent quit without cleaning up) lands here.
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
