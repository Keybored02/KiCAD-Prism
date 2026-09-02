"""Sign the agent in to an auth-enabled Prism, through the user's browser.

A new user on an auth-enabled server has no bearer token to give the agent, and
the agent cannot collect a password itself: Prism logs in via a browser
redirect, not a username/password endpoint. So we do what gh, gcloud, and aws do
for a desktop CLI, a loopback OAuth flow with PKCE:

  1. bind a one-shot HTTP listener on 127.0.0.1 (an ephemeral port);
  2. open the browser at Prism's /api/agent/authorize, telling it to redirect
     back to that loopback port with a one-time code;
  3. the user logs in normally and approves on a Prism consent page;
  4. the browser lands on our loopback listener carrying ?code&state;
  5. we exchange the code over a back-channel POST, proving possession of the
     PKCE verifier we never put in a URL, and get a scoped, revocable token.

The token never travels in a URL, only the one-time code does, and the code is
worthless without the verifier the listener kept in memory. The listener binds
loopback only and accepts exactly one request, so nothing off-machine can reach
it and a second hit cannot replay the code.

stdlib only (urllib + http.server), so it stays importable anywhere the rest of
the agent runs and needs nothing installed.
"""

from __future__ import annotations

import base64
import hashlib
import json
import secrets
import socket
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer

# How long to wait for the user to finish in the browser before giving up. Long
# enough to type a password and approve, short enough that a forgotten flow (the
# user closed the tab without approving) does not hold a listener open for ages.
# The caller can cancel sooner, which is the common case, this is the backstop.
LISTEN_TIMEOUT = 180

# The redirect path the loopback listener answers on. Any path works; a fixed one
# keeps the consent screen's "redirecting to 127.0.0.1/cb" legible.
CALLBACK_PATH = "/cb"

# The event a pending sign-in is waiting on, so a concurrent cancel can wake it.
# There is only ever one interactive sign-in at a time (the user drives it), so a
# single slot is enough; a fresh flow replaces any stale one. A cancelled flow is
# distinguished from a completed one by _CANCELLED, set alongside.
_pending_lock = threading.Lock()
_pending_done: threading.Event | None = None
_CANCELLED = "__cancelled__"


def cancel_pending_sign_in() -> bool:
    """Abandon a sign-in that is currently waiting on the browser.

    Called when the user gives up (closed the tab, pressed Cancel). Wakes the
    waiter so it stops holding the loopback listener open, rather than blocking
    until LISTEN_TIMEOUT. Returns whether there was one to cancel.
    """
    with _pending_lock:
        event = _pending_done
    if event is None or event.is_set():
        return False
    # Mark the wake as a cancellation, then release the waiter.
    setattr(event, _CANCELLED, True)
    event.set()
    return True


class SignInError(Exception):
    """Sign-in could not complete, with a reason to show the user."""


class SignInCancelled(SignInError):
    """The user abandoned the flow before approving."""


@dataclass
class SignInResult:
    token: str
    scope: str
    expires_in: int


def _pkce_pair() -> tuple[str, str]:
    """A PKCE verifier and its S256 challenge, base64url without padding.

    The verifier is a fresh high-entropy secret we keep in memory; the challenge
    is its SHA-256, and only the challenge ever leaves this process before the
    final back-channel exchange. That is the whole point of PKCE: a code stolen
    from the loopback callback is useless without the verifier.
    """
    verifier = secrets.token_urlsafe(48)
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return verifier, challenge


class _CallbackServer(HTTPServer):
    """A one-shot loopback listener that captures the authorization code.

    Binds 127.0.0.1 on an ephemeral port. The handler stores the query it
    receives on the server instance and signals `done`, so the calling thread can
    wake up and read the result. Nothing here trusts the request beyond reading
    its query string; the code it carries is verified server-side on exchange.
    """

    def __init__(self):
        super().__init__(("127.0.0.1", 0), _CallbackHandler)
        self.query: dict[str, str] = {}
        self.done = threading.Event()

    @property
    def redirect_uri(self) -> str:
        return f"http://127.0.0.1:{self.server_address[1]}{CALLBACK_PATH}"


class _CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802 - stdlib naming
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != CALLBACK_PATH:
            self.send_response(404)
            self.end_headers()
            return

        raw = urllib.parse.parse_qs(parsed.query)
        self.server.query = {k: v[0] for k, v in raw.items() if v}

        ok = "code" in self.server.query and "error" not in self.server.query
        body = (_DONE_PAGE if ok else _FAIL_PAGE).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.server.done.set()

    def log_message(self, *_args):  # noqa: A003 - silence stdlib access logging
        pass


def sign_in(
    base_url: str,
    *,
    label: str = "",
    scope: str = "",
    open_browser=webbrowser.open,
    timeout: int = LISTEN_TIMEOUT,
) -> SignInResult:
    """Run the loopback flow against `base_url` and return a scoped token.

    `label` names this machine on the consent screen and in the user's token list,
    so a revoke later is a recognisable "my laptop", not an opaque id. `scope`
    empty means the agent's default scope set. `open_browser` is injectable so a
    test can drive the flow without a real browser.
    """
    base = base_url.rstrip("/")
    verifier, challenge = _pkce_pair()
    state = secrets.token_urlsafe(24)

    server = _CallbackServer()
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    # Publish this flow's event so cancel_pending_sign_in() can wake it. Replaces
    # any stale slot; only one interactive sign-in runs at a time.
    with _pending_lock:
        global _pending_done
        _pending_done = server.done
    try:
        params = {
            "response_type": "code",
            "redirect_uri": server.redirect_uri,
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
        if scope:
            params["scope"] = scope
        if label:
            params["label"] = label
        authorize_url = f"{base}/api/agent/authorize?{urllib.parse.urlencode(params)}"

        try:
            open_browser(authorize_url)
        except Exception as exc:  # a headless box, or no browser configured
            raise SignInError(
                "Could not open a browser to sign in. Open this URL yourself to "
                "continue:\n\n%s" % authorize_url
            ) from exc

        if not server.done.wait(timeout):
            raise SignInError(
                "Timed out waiting for the browser to finish signing in."
            )
        if getattr(server.done, _CANCELLED, False):
            # Woken by cancel_pending_sign_in(), not by the browser.
            raise SignInCancelled("Sign-in was cancelled.")

        query = server.query
        if query.get("error"):
            raise SignInError(_describe_error(query))
        if query.get("state") != state:
            # A mismatched state means the callback is not the one we started, so
            # the code (if any) is not ours to trust.
            raise SignInError("The sign-in response did not match this request.")
        code = query.get("code")
        if not code:
            raise SignInError("The browser returned no authorization code.")

        return _exchange(base, code=code, redirect_uri=server.redirect_uri, verifier=verifier)
    finally:
        with _pending_lock:
            if _pending_done is server.done:
                _pending_done = None
        server.shutdown()
        server.server_close()


def _exchange(
    base: str, *, code: str, redirect_uri: str, verifier: str
) -> SignInResult:
    """Trade the one-time code plus PKCE verifier for a token, over the back channel.

    This is a direct POST from the agent to Prism, never through the browser, so
    the verifier and the resulting token never touch a URL or a redirect.
    """
    data = urllib.parse.urlencode(
        {"code": code, "redirect_uri": redirect_uri, "code_verifier": verifier}
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{base}/api/agent/token", data=data, method="POST"
    )
    request.add_header("Content-Type", "application/x-www-form-urlencoded")
    request.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            payload = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        raise SignInError(_describe_http_error(exc)) from exc
    except (urllib.error.URLError, OSError) as exc:
        raise SignInError(
            "Could not reach Prism to complete sign-in: %s" % exc
        ) from exc
    except ValueError as exc:
        raise SignInError("Prism returned an unreadable sign-in response.") from exc

    token = payload.get("access_token")
    if not token:
        raise SignInError("Prism did not return a token.")
    return SignInResult(
        token=token,
        scope=str(payload.get("scope") or ""),
        expires_in=int(payload.get("expires_in") or 0),
    )


def _describe_error(query: dict[str, str]) -> str:
    """Turn an OAuth-style error redirect into a sentence."""
    description = query.get("error_description") or query.get("error") or "unknown error"
    return "Sign-in was refused: %s" % description


def _describe_http_error(exc: urllib.error.HTTPError) -> str:
    """A readable reason from a failed token exchange, using the server's detail."""
    try:
        detail = json.loads(exc.read()).get("detail")
    except (ValueError, OSError):
        detail = None
    if detail:
        return "Prism refused the sign-in: %s" % detail
    return "Prism refused the sign-in (HTTP %s)." % exc.code


def sign_out(base_url: str, token: str) -> bool:
    """Revoke this agent's token at Prism, so it stops working immediately.

    Best-effort: clearing the token locally is what actually signs the agent out
    on this machine, and we do that regardless. Revoking server-side also stops a
    copied token elsewhere, so it is worth attempting, but a server that is down
    must not trap the user signed in. Returns whether the server confirmed.
    """
    if not token:
        return True
    base = base_url.rstrip("/")
    jti = _token_jti(token)
    if not jti:
        return False
    request = urllib.request.Request(
        f"{base}/api/agent/tokens/{urllib.parse.quote(jti)}", method="DELETE"
    )
    request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=15) as resp:
            return 200 <= resp.status < 300
    except (urllib.error.URLError, urllib.error.HTTPError, OSError):
        return False


def _token_jti(token: str) -> str:
    """The token's registry id, read from its own payload.

    A ``v1.<b64>.<sig>`` token carries an unencrypted JSON payload we can read
    without the signing secret (we are not trusting it, just reading the id to
    ask the server to revoke it). If it is not one of ours, there is nothing to
    revoke by id.
    """
    parts = token.split(".")
    if len(parts) != 3 or parts[0] != "v1":
        return ""
    try:
        padded = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
    except (ValueError, OSError):
        return ""
    return str(payload.get("jti") or "")


def is_free_port() -> bool:
    """Whether we can still bind a loopback listener (a sanity check for callers)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
        return True
    except OSError:
        return False


_DONE_PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Signed in to Prism</title>
<style>body{font:15px/1.5 system-ui,sans-serif;display:grid;place-items:center;
min-height:100vh;margin:0;background:#f5f6f8;color:#14161b}
.card{background:#fff;border-radius:12px;padding:32px 36px;max-width:360px;
text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.08)}
@media(prefers-color-scheme:dark){body{background:#101216;color:#e7e9ee}
.card{background:#1a1d23}}</style></head>
<body><div class="card"><h1>Signed in</h1>
<p>The KiCad agent is connected. You can close this tab and return to KiCad.</p>
</div></body></html>"""

_FAIL_PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Sign-in failed</title>
<style>body{font:15px/1.5 system-ui,sans-serif;display:grid;place-items:center;
min-height:100vh;margin:0;background:#f5f6f8;color:#14161b}
.card{background:#fff;border-radius:12px;padding:32px 36px;max-width:360px;
text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.08)}
@media(prefers-color-scheme:dark){body{background:#101216;color:#e7e9ee}
.card{background:#1a1d23}}</style></head>
<body><div class="card"><h1>Sign-in didn't finish</h1>
<p>Return to KiCad and try again.</p></div></body></html>"""
