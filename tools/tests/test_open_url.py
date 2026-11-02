"""POST /open-url opens a link in the user's browser, for the Remote Symbols panel.

KiCad's webview cannot leave the panel, so the panel asks the agent to open outside
links. The route is callable from a web page, so it is limited to the Prism server's
own origin, to http(s) links, and to a few windows at a time.
"""

import json
import sys
import threading
import urllib.error
import urllib.request
from pathlib import Path

import pytest

TOOLS = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(TOOLS))

from prism_agent import server, settings as settings_store  # noqa: E402

PRISM = "https://prism.test"


class _Settings:
    server_url = PRISM
    api_token = ""


@pytest.fixture
def agent(monkeypatch):
    opened: list[str] = []
    result = {"opened": True}

    def fake_open(url, new=0):
        opened.append(url)
        return result["opened"]

    monkeypatch.setattr(server.webbrowser, "open", fake_open)
    monkeypatch.setattr(settings_store, "load", lambda: _Settings())

    state = server.AgentState.__new__(server.AgentState)
    state.token = "agent-token"
    state._open_lock = threading.Lock()
    state._open_times = []
    handler = type("Handler", (server._Handler,), {"state": state})
    httpd = server._AgentServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield httpd.server_address[1], opened, result
    finally:
        httpd.shutdown()
        httpd.server_close()


def _call(port, body, origin=PRISM, method="POST"):
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/open-url",
        data=json.dumps(body).encode() if method == "POST" else None,
        method=method,
        headers={"Content-Type": "application/json", **({"Origin": origin} if origin else {})},
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, json.loads(response.read() or b"{}"), response.headers
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read() or b"{}"), exc.headers


def test_opens_the_link_for_the_prism_origin(agent):
    port, opened, _ = agent
    status, body, headers = _call(port, {"url": "https://www.ti.com/lit/ds/lm358.pdf"})
    assert status == 200 and body == {"ok": True}
    assert opened == ["https://www.ti.com/lit/ds/lm358.pdf"]
    assert headers["Access-Control-Allow-Origin"] == PRISM


def test_needs_no_agent_token_but_refuses_other_origins(agent):
    port, opened, _ = agent
    for origin in ("https://evil.test", "http://prism.test", ""):
        status, _, _ = _call(port, {"url": "https://example.com/"}, origin=origin)
        assert status == 403
    assert opened == []


@pytest.mark.parametrize(
    "url",
    [
        "file:///C:/Windows/System32/calc.exe",
        "javascript:alert(1)",
        "ms-settings:network",
        "mailto:a@b.c",
        "https://",
        "//example.com/x",
        "https://example.com/a b",
        "https://example.com/\nx",
        "https://example.com/" + "a" * 2100,
        "",
        None,
        42,
    ],
)
def test_refuses_anything_but_a_plain_web_link(agent, url):
    port, opened, _ = agent
    status, _, _ = _call(port, {"url": url})
    assert status == 400
    assert opened == []


def test_a_missing_url_is_refused(agent):
    port, opened, _ = agent
    assert _call(port, {})[0] == 400
    assert opened == []


def test_says_so_when_no_browser_opens(agent):
    port, opened, result = agent
    result["opened"] = False
    status, body, _ = _call(port, {"url": "https://example.com/"})
    assert status == 502
    assert "browser" in body["error"]


def test_a_burst_of_links_is_cut_off(agent):
    port, opened, _ = agent
    statuses = [_call(port, {"url": f"https://example.com/{i}"})[0] for i in range(server.OPEN_URL_LIMIT + 2)]
    assert statuses == [200] * server.OPEN_URL_LIMIT + [429, 429]
    assert len(opened) == server.OPEN_URL_LIMIT


def test_the_preflight_allows_the_prism_origin(agent):
    port, _, _ = agent
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/open-url",
        method="OPTIONS",
        headers={"Origin": PRISM, "Access-Control-Request-Method": "POST"},
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        assert response.status == 204
        assert response.headers["Access-Control-Allow-Origin"] == PRISM
