"""Talks to the Prism FastAPI backend.

This is the "HTTP later" seam: the shape is real and the calls work, but the agent
is useful without a backend configured (project detection and git status are
purely local). Everything here degrades to `None`/`[]` when the backend is
unreachable or unconfigured, so the UI can always render something.

stdlib-only (urllib) so the same module could be imported from KiCad's Python if
we ever want the plugin to talk to Prism directly.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from . import identity

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
TIMEOUT = 10


@dataclass
class PrismConfig:
    base_url: str = DEFAULT_BASE_URL
    token: str = ""  # bearer token, if the backend requires auth

    @property
    def configured(self) -> bool:
        return bool(self.base_url)


class PrismClient:
    def __init__(self, config: PrismConfig):
        self.config = config

    # -- plumbing ---------------------------------------------------------

    def _request(
        self, method: str, path: str, body: dict | None = None
    ) -> dict | list | None:
        if not self.config.configured:
            return None
        url = self.config.base_url.rstrip("/") + path
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Accept", "application/json")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        if self.config.token:
            req.add_header("Authorization", f"Bearer {self.config.token}")
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                raw = resp.read()
            return json.loads(raw) if raw else None
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, OSError):
            # The backend being down is a normal state, not an error worth raising:
            # the agent's local features must keep working regardless.
            return None

    # -- API --------------------------------------------------------------

    def health(self) -> bool:
        """Is the backend reachable (and are we authenticated)?"""
        return self._request("GET", "/api/projects") is not None

    def plugin_version(self) -> dict | None:
        """The plugin version this server expects, and where to get it.

        The plugin follows the server it talks to, rather than updating on its own
        schedule. Unauthenticated on purpose: a plugin too old to authenticate is the
        one that most needs telling.
        """
        return self._request("GET", "/api/plugin/version")

    def auth_config(self) -> dict | None:
        """Whether the server wants anyone to log in, and via which provider.

        Prism authenticates with OIDC authorization-code, you sign in at an
        identity provider in a *browser*, which redirects back with a code. There
        is no username/password endpoint to call, so a desktop client can't collect
        credentials itself; it has to hand off to the browser. When `auth_enabled`
        is false (the current default) every request is a guest and no token is
        needed at all.
        """
        return self._request("GET", "/api/auth/config")

    def me(self) -> dict | None:
        """Who the backend thinks we are, or None if we're not authenticated."""
        return self._request("GET", "/api/auth/me")

    def identity(self) -> dict:
        """A summary the settings UI can render without knowing about OIDC."""
        cfg = self.auth_config()
        if cfg is None:
            return {"reachable": False, "auth_enabled": False, "user": None}

        if not cfg.get("auth_enabled"):
            return {
                "reachable": True,
                "auth_enabled": False,
                "user": None,
                "provider": "",
                # Say why there's nothing to sign into, so the UI isn't just blank.
                "note": "This server has authentication disabled, every request is a guest.",
            }

        return {
            "reachable": True,
            "auth_enabled": True,
            "provider": cfg.get("oidc_provider_name", ""),
            "user": self.me(),
        }

    def find_project(self, path: str) -> dict | None:
        """Which Prism project is this local directory?

        Two ways, in order:

        1. **The marker.** The checkout's `.prism.json` carries the project id, so we
           just look it up. This is the one that works when the server is on another
           machine, which is the entire point.
        2. **The path**, as a fallback. Only correct when the server and the client
           are the same machine, which is the assumption this whole exercise exists
           to remove. It stays because markers are still spreading: a project imported
           before phase 1 and not yet reopened has no marker, and regressing it to
           "Not registered" would be a real bug for no gain.

        The fallback goes away in phase 3, when the server stops sending `path` at all.
        """
        rows = self._request("GET", "/api/projects")
        if not isinstance(rows, list):
            return None

        marker_id = identity.project_id(path)
        if marker_id:
            for row in rows:
                if isinstance(row, dict) and row.get("id") == marker_id:
                    return row
            # The checkout names a project this server does not have. Say nothing
            # rather than fall back to a path match: a path collision would report
            # the *wrong* project, and a wrong answer is worse than no answer.
            return None

        return self._find_by_path(rows, path)

    def _find_by_path(self, rows: list, path: str) -> dict | None:
        """Legacy lookup: compare the local path against the server's own path.

        Same-machine only. See find_project.
        """
        target = _normalise(path)
        for row in rows:
            p = row.get("path") if isinstance(row, dict) else None
            if p and _normalise(p) == target:
                return row
        return None

    def project_url(self, project_id: str) -> str:
        """Deep link into the web app for this project.

        The route is `/project/<id>`, singular. Pluralising it (the natural typo,
        and what this used to do) matches no route, so the app's catch-all bounces
        you to the home page: "Open in Prism" appeared to work but just opened the
        web UI. Keep this in step with the Route in frontend/src/App.tsx.
        """
        return f"{self.config.base_url.rstrip('/')}/project/{project_id}"


def _normalise(path: str) -> str:
    """Canonical form of a path, for comparing two spellings of the same folder.

    Resolving matters, not just lowercasing: Prism stores the path it was imported
    with, which is often *relative to its own workspace* and full of `..`, e.g.

        C:\\...\\KiCAD-Prism\\data\\projects\\..\\..\\..\\test board

    That names the same folder as C:\\Users\\...\\Projects\\test board, but compared
    as a string it doesn't match, so the plugin reported a registered project as
    "Not registered". Collapse the traversal (and follow symlinks, so a project
    reached through a link still matches) before comparing.
    """
    try:
        # resolve() collapses `..` and follows symlinks. strict=False so a path
        # that no longer exists still normalises rather than raising.
        resolved = str(Path(path).expanduser().resolve())
    except (OSError, ValueError):
        resolved = os.path.normpath(os.path.expanduser(path))
    # normcase folds case *and* separators on Windows; a no-op on POSIX, where
    # paths really are case-sensitive.
    return os.path.normcase(resolved).replace("\\", "/").rstrip("/")
