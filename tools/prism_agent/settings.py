"""Persistent agent settings.

Lives next to the discovery file in the user's config dir, but is a *separate*
file on purpose: the discovery file is ephemeral runtime state (port, pid, a token
minted per run) and gets deleted on shutdown, whereas this is what the user chose
and must outlive the process.

Env vars still win over the file, so a dev pointing at a staging backend with
PRISM_URL doesn't have their saved setting silently overridden, or silently
overwrite it.
"""

from __future__ import annotations

import json
import os
import threading
from dataclasses import asdict, dataclass, field, fields
from pathlib import Path

from .discovery import config_dir

SETTINGS_FILE = "settings.json"

DEFAULT_SERVER_URL = "http://127.0.0.1:8000"


@dataclass
class Settings:
    """What the user can configure. Add fields here; they persist automatically."""

    server_url: str = DEFAULT_SERVER_URL
    # A bearer token for the Prism API. Empty while the server has auth disabled,
    # which is the current default (see /api/auth/config -> auth_enabled).
    api_token: str = field(default="", repr=False)  # keep it out of logs
    # Whether the user has opted into this machine handling prism:// links. Never
    # registered without an explicit yes, silently claiming a URL scheme is the
    # kind of thing people rightly resent.
    protocol_handler: bool = False
    # Start the agent at login. Same principle: opt-in only. Without it the agent
    # only exists once KiCad has been opened, which undercuts the whole point of it
    # running independently.
    autostart: bool = False
    # Has the user been through first-run setup? Lives here rather than beside the
    # plugin so it survives a plugin reinstall, being asked to set up again just
    # because you updated the plugin would be irritating and pointless.
    first_run_done: bool = False
    # Directories to search for Prism projects, by their `.prism.json` marker.
    #
    # A place to *look*, not a place you are forced to put things: a checkout works
    # wherever it is, and a user who keeps projects in three unrelated folders adds
    # three roots. This exists so "do I have prj_x?" is a bounded search rather than
    # a walk of the whole disk.
    projects_roots: list[str] = field(default_factory=list)

    def to_dict(self, redact: bool = False) -> dict:
        d = asdict(self)
        if redact:
            # The UI only needs to know *whether* a token is set, never its value:
            # it travels over loopback HTTP and would end up in logs and screenshots.
            d["api_token"] = ""
            d["has_token"] = bool(self.api_token)
        return d

    @classmethod
    def from_dict(cls, data: dict) -> "Settings":
        known = {f.name for f in fields(cls)}
        return cls(**{k: v for k, v in data.items() if k in known})


def settings_path() -> Path:
    return config_dir() / SETTINGS_FILE


_lock = threading.Lock()


def load() -> Settings:
    """Saved settings, with env vars taking precedence."""
    data = {}
    try:
        data = json.loads(settings_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        pass  # no file yet, or corrupt, defaults are a fine answer

    s = Settings.from_dict(data) if isinstance(data, dict) else Settings()

    # Env wins. It's how you point at a different backend for one run without
    # mutating what the user saved.
    if os.environ.get("PRISM_URL"):
        s.server_url = os.environ["PRISM_URL"]
    if os.environ.get("PRISM_TOKEN"):
        s.api_token = os.environ["PRISM_TOKEN"]
    return s


def save(settings: Settings) -> Path:
    """Persist settings. Write-then-replace so a reader never sees a half file."""
    path = settings_path()
    with _lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(asdict(settings), indent=2), encoding="utf-8")
        tmp.replace(path)
        _restrict(path)
    return path


def update(**changes) -> Settings:
    """Change some fields and persist. Unknown keys are ignored, not an error,
    an older agent shouldn't choke on a setting a newer UI sent."""
    current = load()
    known = {f.name for f in fields(Settings)}
    for key, value in changes.items():
        if key in known and value is not None:
            setattr(current, key, value)
    save(current)
    return current


def _restrict(path: Path) -> None:
    """The file can hold an API token, so keep it out of other users' reach.

    chmod 600 on POSIX. On Windows it already sits in the user's roaming profile,
    which other non-admin users can't read; an ACL would need pywin32 for the same
    outcome.
    """
    if os.name != "nt":
        try:
            path.chmod(0o600)
        except OSError:
            pass
