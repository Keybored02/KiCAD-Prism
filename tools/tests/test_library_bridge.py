"""The local loopback proxy that lets KiCad accept a plain-HTTP LAN server.

KiCad refuses a remote symbol provider URL that isn't HTTPS or a literal loopback
host, no config override anywhere (see remote_library.py's module docstring for the
full story). This is the workaround: forward 127.0.0.1:<port> to the real server, so
KiCad's own check passes while the traffic still ultimately reaches server_url.
"""

import http.server
import sys
import threading
import urllib.error
import urllib.request
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import library_bridge  # noqa: E402


@pytest.fixture(autouse=True)
def _stop_after():
    """Never leave a listener behind for the next test, whatever a test does."""
    yield
    library_bridge.stop()


def _fake_upstream(status=200, body=b'{"ok": true}', content_type="application/json"):
    class Handler(http.server.BaseHTTPRequestHandler):
        received = {}

        def do_GET(self):
            Handler.received["path"] = self.path
            Handler.received["headers"] = dict(self.headers)
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            length = int(self.headers.get("Content-Length") or 0)
            Handler.received["body"] = self.rfile.read(length)
            self.send_response(status)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args):
            pass

    server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, Handler, "http://127.0.0.1:%d" % server.server_address[1]


# -- is_insecure_remote: must mirror KiCad's own rule exactly ---------------


@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://example.com", False),
        ("https://192.168.1.17:5173", False),
        ("http://localhost:5173", False),
        ("http://127.0.0.1:5173", False),
        ("http://[::1]:5173", False),
        ("HTTP://LOCALHOST:5173", False),
        ("http://192.168.1.17:5173", True),
        ("http://example.com", True),
        ("http://my-server:5173", True),
        ("", True),
        ("not a url at all", True),
    ],
)
def test_is_insecure_remote(url, expected):
    assert library_bridge.is_insecure_remote(url) is expected


# -- the proxy itself ---------------------------------------------------------


def test_forwards_a_get_and_returns_the_response_body():
    up, _handler, upstream_url = _fake_upstream(body=b'{"projects": []}')
    try:
        bridge_url = library_bridge.start(upstream_url)
        resp = urllib.request.urlopen(bridge_url + "/api/projects")
        assert resp.status == 200
        assert resp.read() == b'{"projects": []}'
    finally:
        up.shutdown()


def test_forwards_the_path_unchanged():
    up, handler, upstream_url = _fake_upstream()
    try:
        bridge_url = library_bridge.start(upstream_url)
        urllib.request.urlopen(bridge_url + "/library/manifest.json?x=1")
        assert handler.received["path"] == "/library/manifest.json?x=1"
    finally:
        up.shutdown()


def test_tells_the_server_its_own_loopback_origin():
    # The server builds api_base_url, the OAuth endpoints and the panel URL from this,
    # so KiCad gets URLs on the bridge rather than the LAN address it would reject.
    up, handler, upstream_url = _fake_upstream()
    try:
        bridge_url = library_bridge.start(upstream_url)
        req = urllib.request.Request(
            bridge_url + "/x", headers={"X-Prism-Loopback-Origin": "http://evil:1"}
        )
        urllib.request.urlopen(req)
        received = {k.lower(): v for k, v in handler.received["headers"].items()}
        assert received["x-prism-loopback-origin"] == bridge_url
    finally:
        up.shutdown()


def test_forwards_a_post_body():
    up, handler, upstream_url = _fake_upstream()
    try:
        bridge_url = library_bridge.start(upstream_url)
        req = urllib.request.Request(
            bridge_url + "/x", data=b"hello", method="POST"
        )
        urllib.request.urlopen(req)
        assert handler.received["body"] == b"hello"
    finally:
        up.shutdown()


def test_an_unreachable_upstream_answers_502_rather_than_hanging():
    # A port nothing listens on: the connection itself fails, not a slow response.
    probe = http.server.HTTPServer(("127.0.0.1", 0), http.server.BaseHTTPRequestHandler)
    dead_port = probe.server_address[1]
    probe.server_close()

    bridge_url = library_bridge.start("http://127.0.0.1:%d" % dead_port)
    try:
        urllib.request.urlopen(bridge_url + "/x", timeout=5)
        assert False, "should have raised"
    except urllib.error.HTTPError as exc:
        assert exc.code == 502


def test_url_and_port_agree():
    up, _handler, upstream_url = _fake_upstream()
    try:
        bridge_url = library_bridge.start(upstream_url)
        assert bridge_url == "http://127.0.0.1:%d" % library_bridge.port()
        assert bridge_url == library_bridge.url()
    finally:
        up.shutdown()


def test_starting_twice_with_the_same_upstream_reuses_the_port():
    up, _handler, upstream_url = _fake_upstream()
    try:
        first = library_bridge.start(upstream_url)
        second = library_bridge.start(upstream_url)
        assert first == second
    finally:
        up.shutdown()


def test_starting_with_a_different_upstream_restarts_on_a_new_port():
    up1, _h1, upstream1 = _fake_upstream()
    up2, _h2, upstream2 = _fake_upstream()
    try:
        first = library_bridge.start(upstream1)
        second = library_bridge.start(upstream2)
        assert first != second
        # And it's actually forwarding to the NEW upstream now, not the old one.
        resp = urllib.request.urlopen(second + "/x")
        assert resp.status == 200
    finally:
        up1.shutdown()
        up2.shutdown()


def test_stop_releases_the_port():
    up, _handler, upstream_url = _fake_upstream()
    try:
        library_bridge.start(upstream_url)
        assert library_bridge.is_running() is True
        library_bridge.stop()
        assert library_bridge.is_running() is False
        with pytest.raises(RuntimeError):
            library_bridge.port()
    finally:
        up.shutdown()


def test_stop_when_never_started_does_not_raise():
    library_bridge.stop()  # must be a no-op, not an error


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
