"""A redirect must never send the agent to a different HOST than it asked.

Reproduces the real failure: the dev Vite proxy runs with changeOrigin, which
rewrites the Host header the backend sees to the proxy's own loopback target
(127.0.0.1:8000). A trailing-slash mismatch then makes Starlette's own
redirect_slashes build a 307 Location from THAT header, so a remote client
(the plugin's agent on another machine, reached over prism://) gets handed
"http://127.0.0.1:8000/..." -- its own loopback, nothing is listening there,
and the request silently fails with no sign of why. See PrismClient._opener.
"""

import http.server
import json
import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent.prism_client import PrismClient, PrismConfig  # noqa: E402


def _server(handler_cls):
    server = http.server.HTTPServer(("127.0.0.1", 0), handler_cls)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def test_a_redirect_to_a_different_host_is_rewritten_back(monkeypatch):
    """The exact bug: Location names 127.0.0.1:8000 (the proxy's own target),
    which is not where this test's server is actually listening. The client
    must follow the redirect's PATH against the server it was configured for,
    not the host the redirect claims."""

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/api/projects":
                self.send_response(307)
                # The wrong host on purpose: a real, unrelated port nothing here
                # is listening on, standing in for the proxy's loopback target.
                self.send_header("Location", "http://127.0.0.1:8000/api/projects/")
                self.end_headers()
                return
            if self.path == "/api/projects/":
                body = json.dumps([{"id": "abc"}]).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            self.send_response(404)
            self.end_headers()

        def log_message(self, *_args):
            pass

    server = _server(Handler)
    try:
        port = server.server_address[1]
        client = PrismClient(PrismConfig(base_url=f"http://127.0.0.1:{port}"))
        result = client._request("GET", "/api/projects")
        assert result == [{"id": "abc"}]
    finally:
        server.shutdown()


def test_a_same_host_redirect_still_works(monkeypatch):
    """The common case (no proxy involved) must keep working unchanged."""

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/api/projects":
                port = self.server.server_address[1]
                self.send_response(307)
                self.send_header(
                    "Location", f"http://127.0.0.1:{port}/api/projects/"
                )
                self.end_headers()
                return
            if self.path == "/api/projects/":
                body = json.dumps([]).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            self.send_response(404)
            self.end_headers()

        def log_message(self, *_args):
            pass

    server = _server(Handler)
    try:
        port = server.server_address[1]
        client = PrismClient(PrismConfig(base_url=f"http://127.0.0.1:{port}"))
        assert client._request("GET", "/api/projects") == []
    finally:
        server.shutdown()
