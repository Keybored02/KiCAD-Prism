"""Letting one browser tab drive one merge, without handing it the agent's keys.

The agent's own token guards git and the filesystem, and `discovery.py` says why it
exists at all: *"any local process (including a web page's JavaScript, via a stray fetch
to 127.0.0.1) can reach a loopback port."* The merge UI is exactly that web page, so it
must never hold that token.

Instead the agent mints a one-shot key per merge and puts it in the URL FRAGMENT. A
fragment is never sent to a server, so it cannot appear in an access log, a `Referer`
header, or a proxy's history. The page reads it, exchanges it once for a session token
scoped to that single merge, and erases it from the address bar.

What a stolen session token buys an attacker is deliberately small: it can pick different
objects from commits that already exist in the repository. It cannot introduce file
content, reach another project, or outlive the merge.
"""

from __future__ import annotations

import secrets
import threading
import time
from dataclasses import dataclass, field

# A merge is a sit-down task: read three boards, stage changes, commit. An hour is
# generous without being indefinite.
SESSION_TTL = 3600

# The fragment key is single-use and exchanged immediately on page load. Anything beyond
# a couple of minutes is a link someone pasted somewhere it should not have gone.
CLAIM_TTL = 120


@dataclass
class Session:
    """One merge, in one tab."""

    id: str
    repo: str
    theirs_ref: str
    token: str = ""
    claim_key: str = ""
    claimed: bool = False
    created: float = field(default_factory=time.time)

    @property
    def expired(self) -> bool:
        return time.time() - self.created > SESSION_TTL

    @property
    def claim_expired(self) -> bool:
        return time.time() - self.created > CLAIM_TTL


class Sessions:
    """Live merge sessions, keyed by id. Thread-safe: the HTTP server is threaded."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._sessions: dict[str, Session] = {}

    def create(self, repo: str, theirs_ref: str) -> Session:
        session = Session(
            id=secrets.token_urlsafe(16),
            repo=repo,
            theirs_ref=theirs_ref,
            claim_key=secrets.token_urlsafe(32),
        )
        with self._lock:
            self._sweep()
            self._sessions[session.id] = session
        return session

    def claim(self, session_id: str, claim_key: str) -> Session | None:
        """Exchange the fragment key for a session token. Once, and once only.

        A second attempt fails even with the right key: if a link is replayed, the first
        holder is the one who already has the session, and the second is either a mistake
        or someone who should not have it.
        """
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None or session.expired or session.claimed:
                return None
            if session.claim_expired:
                return None
            if not secrets.compare_digest(claim_key, session.claim_key):
                return None

            session.claimed = True
            session.claim_key = ""  # spent
            session.token = secrets.token_urlsafe(32)
            return session

    def authorise(self, session_id: str, token: str) -> Session | None:
        """The session behind a bearer token, or None."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None or session.expired or not session.token:
                return None
            if not secrets.compare_digest(token, session.token):
                return None
            return session

    def close(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def _sweep(self) -> None:
        """Drop expired sessions. Called under the lock, on create."""
        dead = [k for k, s in self._sessions.items() if s.expired]
        for key in dead:
            del self._sessions[key]
