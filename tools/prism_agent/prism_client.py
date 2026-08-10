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
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

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

        Two ways, in order, and neither compares filesystem paths any more. The server
        no longer sends its own `path` (it was meaningless off-machine), so the old
        string match is gone.

        1. **The marker.** The checkout's `.prism.json` carries the project id. Direct
           lookup, works from anywhere.
        2. **The git origin.** For a checkout that predates the marker, ask git for its
           `origin` and match that against the project's `origin_url`. Also machine
           independent: two clones of the same repo agree on their remote no matter
           where they sit on disk.

        Both are identities. Neither is a guess about co-location.
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
            # rather than fall back: a loose match could report the *wrong* project,
            # and a wrong answer about which board you are looking at is worse than
            # no answer.
            return None

        return self._find_by_origin(rows, path)

    def _find_by_origin(self, rows: list, path: str) -> dict | None:
        """Match a checkout to a project by the git remote they share.

        For projects imported before the marker existed. A project with no origin at
        all (`origin_owner == "none"`) can never match this way, which is correct:
        there is nothing to match on, and guessing would be worse than saying no.
        """
        origin = _git_origin(path)
        if not origin:
            return None
        target = _normalise_url(origin)
        for row in rows:
            if not isinstance(row, dict):
                continue
            candidate = row.get("origin_url")
            if candidate and _normalise_url(candidate) == target:
                return row
        return None

    def reserve_project(self, name: str, description: str = "") -> dict | None:
        """Ask the server for an empty hosted repo to push an existing project into.

        The server cannot adopt a folder on this machine (it cannot read it), so instead
        it hands back a URL and we push. Nothing is registered until the push lands.
        """
        result = self._request(
            "POST",
            "/api/projects/reserve",
            {"name": name, "description": description},
        )
        return result if isinstance(result, dict) else None

    def adopt_pushed(
        self, project_id: str, name: str, description: str = ""
    ) -> dict | None:
        """Tell the server our push landed, so it can clone and render the board."""
        result = self._request(
            "POST",
            "/api/projects/adopt-pushed",
            {"id": project_id, "name": name, "description": description},
        )
        return result if isinstance(result, dict) else None

    def project_url(self, project_id: str) -> str:
        """Deep link into the web app for this project.

        The route is `/project/<id>`, singular. Pluralising it (the natural typo,
        and what this used to do) matches no route, so the app's catch-all bounces
        you to the home page: "Open in Prism" appeared to work but just opened the
        web UI. Keep this in step with the Route in frontend/src/App.tsx.
        """
        return f"{self.config.base_url.rstrip('/')}/project/{project_id}"

    def merge_url(self, session_id: str, agent_port: int) -> str:
        """Deep link to the merge UI for one session.

        The page needs the agent's port to talk back to it: the agent binds an ephemeral
        port, so the browser cannot guess it and there is nowhere else for it to come
        from. It is not a secret (anything local can scan for it), which is exactly why
        the agent requires a token as well.

        The one-shot claim key is NOT part of this URL. The caller appends it as a
        fragment, which browsers never send to a server, so it cannot appear in an access
        log or a Referer header. Keep this in step with the Route in frontend/src/App.tsx.
        """
        base = self.config.base_url.rstrip("/")
        session = urllib.parse.quote(session_id)
        return f"{base}/merge?session={session}&agent={agent_port}"


def _git_origin(tree: str) -> str:
    """The `origin` remote of a local checkout, or "" if it has none."""
    try:
        result = subprocess.run(
            ["git", "-C", tree, "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
            # Windows: stop a console window flashing up when KiCad's Python calls us.
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    return result.stdout.strip() if result.returncode == 0 else ""


def _normalise_url(url: str) -> str:
    """Canonical form of a git remote, for comparing two spellings of the same one.

    The same NAS share really does show up as both `\\\\HOST\\share\\x` and
    `//HOST/share/x` depending on who wrote it, and a trailing `.git` is optional
    everywhere. Compared raw, those name the same remote and fail to match.

    Deliberately conservative: fold separators, a trailing slash, a trailing `.git`,
    and case. It does not try to equate ssh:// with https:// forms of the same host,
    because those are genuinely different remotes to git and pretending otherwise
    would be a guess.
    """
    u = url.strip().replace("\\", "/").rstrip("/")
    if u.lower().endswith(".git"):
        u = u[:-4]
    return u.casefold()


# _normalise(path) used to live here: it canonicalised a filesystem path so the
# agent could compare its own against the one the server reported. The server no
# longer reports one, so there is nothing left to compare and the function is gone.
# Identity now travels in the repo (the marker) or in git (the origin).
