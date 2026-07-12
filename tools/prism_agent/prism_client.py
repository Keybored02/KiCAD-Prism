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

    def find_project_by_path(self, path: str) -> dict | None:
        """Match a local project directory to a Prism project.

        Prism's project list carries each project's on-disk `path`, so we resolve
        locally rather than needing a dedicated lookup endpoint.
        """
        rows = self._request("GET", "/api/projects")
        if not isinstance(rows, list):
            return None
        target = _normalise(path)
        for row in rows:
            p = row.get("path") if isinstance(row, dict) else None
            if p and _normalise(p) == target:
                return row
        return None

    def project_url(self, project_id: str) -> str:
        """Deep link into the web app for this project."""
        return f"{self.config.base_url.rstrip('/')}/projects/{project_id}"


def _normalise(path: str) -> str:
    """Canonical form of a path, for comparing two spellings of the same folder.

    Resolving matters, not just lowercasing: Prism stores the path it was imported
    with, which is often *relative to its own workspace* and full of `..` — e.g.

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
