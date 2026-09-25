"""A loopback proxy, for when Prism's server isn't reachable as localhost.

KiCad's remote symbol provider refuses a metadata_url that isn't HTTPS, unless the
host is literally "localhost", "127.0.0.1", or "::1" (see remote_provider_utils.cpp's
ValidateRemoteUrlSecurity / IsLoopbackHost, KiCad's own source; there is no setting
that widens that check, a LAN address is never treated as loopback no matter what a
provider's config says). Most Prism deployments in the wild are exactly the case that
fails: a plain-HTTP server on the LAN, no certificate, because setting one up for a
homelab box is real friction for no real gain (the traffic never leaves the LAN).

The agent already runs on the same machine as KiCad, so it is the natural place to
close that gap: listen on 127.0.0.1 at some port, forward every request byte-for-byte
to the real server, and give KiCad THAT url instead. KiCad's check passes (it really is
127.0.0.1), and everything still ultimately reaches the configured server_url.

Opt-in only, same principle as protocol_handler and autostart: this changes what gets
written into the user's eeschema.json, and running an extra listener is not something
to do by default just because a server happens to be unencrypted.
"""

from __future__ import annotations

import logging
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

log = logging.getLogger(__name__)

LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}


def is_insecure_remote(url: str) -> bool:
    """Would KiCad's own check reject this as a provider URL?

    Mirrors ValidateRemoteUrlSecurity exactly: HTTPS always passes, HTTP passes only
    for a literal loopback hostname. Anything else -- a LAN IP, a hostname, HTTP on a
    hostname that merely resolves to this machine -- fails KiCad's check the same way.
    """
    try:
        parts = urlsplit(url)
    except ValueError:
        return True
    if parts.scheme.lower() == "https":
        return False
    host = (parts.hostname or "").lower()
    return not (parts.scheme.lower() == "http" and host in LOOPBACK_HOSTS)


class _ProxyHandler(BaseHTTPRequestHandler):
    # self.server is a _Server instance at runtime (BaseHTTPRequestHandler sets it);
    # not declared here, an assignment would shadow the real one ThreadingHTTPServer
    # provides.

    def log_message(self, *_args):  # noqa: A003 - silence stdlib access logging
        pass

    def _forward(self, method: str) -> None:
        target = self.server.upstream.rstrip("/") + self.path
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        headers = {
            k: v
            for k, v in self.headers.items()
            # Host and Content-Length are rebuilt by urllib for the new target;
            # forwarding the client's own values would name the wrong host or a
            # length that no longer matches a body urllib may re-encode.
            if k.lower() not in ("host", "content-length")
        }

        req = urllib.request.Request(target, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                self._reply(resp.status, dict(resp.getheaders()), resp.read())
        except urllib.error.HTTPError as exc:
            self._reply(exc.code, dict(exc.headers or {}), exc.read())
        except (urllib.error.URLError, OSError) as exc:
            self._reply(502, {}, ("upstream unreachable: %s" % exc).encode())

    def _reply(self, status: int, headers: dict, body: bytes) -> None:
        self.send_response(status)
        for key, value in headers.items():
            if key.lower() not in ("transfer-encoding", "connection"):
                self.send_header(key, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if body:
            self.wfile.write(body)

    def do_GET(self):  # noqa: N802
        self._forward("GET")

    def do_POST(self):  # noqa: N802
        self._forward("POST")

    def do_PUT(self):  # noqa: N802
        self._forward("PUT")

    def do_DELETE(self):  # noqa: N802
        self._forward("DELETE")

    def do_HEAD(self):  # noqa: N802
        self._forward("HEAD")


class _Server(ThreadingHTTPServer):
    upstream: str


_lock = threading.Lock()
_server: _Server | None = None
_thread: threading.Thread | None = None


def start(upstream: str) -> str:
    """Start forwarding to `upstream`, idempotently. Returns the loopback URL to use
    in its place. Restarts if `upstream` changed since the last start."""
    global _server, _thread
    with _lock:
        if _server is not None:
            if _server.upstream == upstream.rstrip("/"):
                return _url_locked()
            _stop_locked()

        server = _Server(("127.0.0.1", 0), _ProxyHandler)
        server.upstream = upstream.rstrip("/")
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        _server, _thread = server, thread
        log.info(
            "Library bridge listening on 127.0.0.1:%d -> %s",
            server.server_address[1],
            upstream,
        )
        return _url_locked()


def stop() -> None:
    with _lock:
        _stop_locked()


def _stop_locked() -> None:
    global _server, _thread
    if _server is not None:
        _server.shutdown()
        _server.server_close()
    _server, _thread = None, None


def is_running() -> bool:
    with _lock:
        return _server is not None


def port() -> int:
    with _lock:
        return _port_locked()


def _port_locked() -> int:
    if _server is None:
        raise RuntimeError("the library bridge is not running")
    return _server.server_address[1]


def url() -> str:
    with _lock:
        return _url_locked()


def _url_locked() -> str:
    return "http://127.0.0.1:%d" % _port_locked()
