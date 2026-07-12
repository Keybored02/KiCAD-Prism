"""KiCad-Prism tray agent.

Runs in the system tray, independent of KiCad. It owns the machine-side work —
knowing the local projects, running git, talking to the Prism backend — and
exposes it on a loopback HTTP API (see server.py). The KiCad plugin is a thin UI
client over that API, so the capabilities exist whether or not KiCad is open.

Run:  python -m prism_agent
"""

from __future__ import annotations

import os
import sys
import threading
from pathlib import Path

from . import discovery
from .prism_client import PrismConfig
from .server import VERSION, serve

try:
    import pystray
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - dependency guidance
    sys.exit(
        "The tray agent needs pystray and Pillow:\n"
        "    pip install -r tools/prism_agent/requirements.txt"
    )

ICON_PATH = Path(__file__).parent / "assets" / "prism-256.png"

# Fallback brand colours if the asset is missing (see kicad_plugin/prism_theme.py).
PRIMARY = (37, 99, 235)  # #2563EB


def _make_icon() -> "Image.Image":
    """The Prism logo, from the shared branding assets."""
    try:
        return Image.open(ICON_PATH).convert("RGBA")
    except OSError:
        # Never let a missing asset stop the agent from running — the tray icon is
        # cosmetic, the agent is not.
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        ImageDraw.Draw(img).rounded_rectangle([0, 0, 63, 63], radius=14, fill=PRIMARY)
        return img


def _prism_config() -> PrismConfig:
    """Backend location. Env-overridable so a dev pointing at a remote Prism
    doesn't have to edit code."""
    return PrismConfig(
        base_url=os.environ.get("PRISM_URL", PrismConfig.base_url),
        token=os.environ.get("PRISM_TOKEN", ""),
    )


def main() -> int:
    config = _prism_config()
    server, _thread, state = serve(config)
    port = server.server_address[1]

    stopping = threading.Event()

    def on_quit(icon, _item):
        stopping.set()
        server.shutdown()
        discovery.clear_endpoint()
        icon.stop()

    def on_open_prism(_icon, _item):
        import webbrowser

        webbrowser.open(config.base_url)

    def status_text(_item) -> str:
        # pystray re-evaluates this each time the menu opens, so it stays live.
        return f"Agent running on 127.0.0.1:{port}"

    icon = pystray.Icon(
        "kicad-prism",
        _make_icon(),
        f"KiCad-Prism agent {VERSION}",
        menu=pystray.Menu(
            pystray.MenuItem(status_text, None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Open Prism", on_open_prism),
            pystray.MenuItem("Quit", on_quit),
        ),
    )

    try:
        icon.run()  # blocks on the platform's tray loop
    finally:
        if not stopping.is_set():
            server.shutdown()
            discovery.clear_endpoint()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
