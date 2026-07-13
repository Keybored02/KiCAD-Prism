"""KiCad-Prism agent.

Runs independent of KiCad. It owns the machine-side work, knowing the local
projects, running git, diffing the working tree, talking to the Prism backend,
and exposes it on a loopback HTTP API (see server.py). The KiCad plugin is a thin
UI client over that API, so the capabilities exist whether or not KiCad is open.

The tray icon is the *convenience*, not the architecture. The agent's real control
surface is its HTTP API, which works identically everywhere. So when no tray can
be drawn, Wayland without an appindicator, a headless box, SSH, the agent says
so and keeps serving, rather than dying or (worse) running invisibly with no way
to stop it. See _run_headless.

Run:  python -m prism_agent
      python -m prism_agent --no-tray     # explicit headless
"""

from __future__ import annotations

import argparse
import signal
import subprocess
import sys
import threading
from pathlib import Path

from . import discovery, protocol
from . import settings as settings_store
from .prism_client import PrismClient, PrismConfig
from .server import VERSION, serve


def _assets_dir() -> Path:
    """Where the icons live, which differs once we're a frozen binary.

    PyInstaller unpacks bundled data into a temp dir and points sys._MEIPASS at it,
    so the source-relative path is wrong there and the tray would silently fall
    back to a plain coloured tile.
    """
    base = getattr(sys, "_MEIPASS", None)
    if base:
        return Path(base) / "prism_agent" / "assets"
    return Path(__file__).parent / "assets"


ASSETS = _assets_dir()


def is_frozen() -> bool:
    """Are we the packaged binary rather than a source checkout?"""
    return getattr(sys, "frozen", False)


# Fallback brand colour if the asset is missing (see kicad_plugin/prism_theme.py).
PRIMARY = (37, 99, 235)  # #2563EB

# Tray icons are small, and the platforms don't agree on how big. Handing a 256px
# image straight to the tray gives a blurry or oversized icon, so we ship
# purpose-built sizes and pick one. macOS wants a larger source because it renders
# at 2x on Retina; Windows and Linux trays are nominally 16-24px but look better
# fed a 32-64px image they can downscale once.
TRAY_ICON_PX = 32 if sys.platform == "win32" else 64


def _load_tray():
    """Import pystray, or explain precisely why there's no tray.

    Two *different* failures both surface as ImportError here, and conflating them
    sends the user down the wrong path:

      - pystray/Pillow genuinely aren't installed  -> pip install
      - they are installed, but no backend works   -> a system package (Linux) or
        simply no desktop at all (headless/SSH)

    pystray picks its backend at import: darwin on macOS, win32 on Windows, and on
    Linux it tries appindicator -> gtk -> xorg, raising ImportError if all three
    fail. That makes the "no tray available" case detectable rather than silent,
    we don't have to know anything about individual distros.
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return None, (
            "Pillow isn't installed.\n"
            "    pip install -r tools/prism_agent/requirements.txt"
        )

    try:
        import pystray
    except ImportError as exc:
        # Distinguish "not installed" from "installed but unusable here".
        try:
            import importlib.util

            installed = importlib.util.find_spec("pystray") is not None
        except (ImportError, ValueError):
            installed = False

        if not installed:
            return None, (
                "pystray isn't installed.\n"
                "    pip install -r tools/prism_agent/requirements.txt"
            )
        return None, (
            "No system tray is available here (%s).\n"
            "On Linux the tray needs an AppIndicator backend:\n"
            "    sudo apt install gir1.2-ayatanaappindicator3-0.1 python3-gi\n"
            "The agent works fine without it, see below." % exc
        )

    return (pystray, Image, ImageDraw), None


def _make_icon(Image, ImageDraw):
    """The Prism logo at a size the tray can render crisply.

    Prefers a purpose-built asset at the exact size (they're hand-tuned for small
    renders and beat any downscale); falls back to resampling the 256px master,
    then to a plain brand-coloured tile.
    """
    exact = ASSETS / f"prism-{TRAY_ICON_PX}.png"
    if exact.is_file():
        try:
            return Image.open(exact).convert("RGBA")
        except OSError:
            pass

    try:
        icon = Image.open(ASSETS / "prism-256.png").convert("RGBA")
        return icon.resize((TRAY_ICON_PX, TRAY_ICON_PX), Image.LANCZOS)
    except OSError:
        # A missing asset must never stop the agent, the icon is cosmetic, the
        # agent is not.
        icon = Image.new("RGBA", (TRAY_ICON_PX, TRAY_ICON_PX), (0, 0, 0, 0))
        ImageDraw.Draw(icon).rounded_rectangle(
            [0, 0, TRAY_ICON_PX - 1, TRAY_ICON_PX - 1],
            radius=TRAY_ICON_PX // 5,
            fill=PRIMARY,
        )
        return icon


def _prism_config() -> PrismConfig:
    """Backend location, from the user's saved settings.

    settings.load() already lets PRISM_URL / PRISM_TOKEN win over the saved values,
    so a dev pointing at a staging backend for one run neither loses their saved
    setting nor silently overwrites it.
    """
    saved = settings_store.load()
    return PrismConfig(base_url=saved.server_url, token=saved.api_token)


def _shutdown(server) -> None:
    server.shutdown()
    discovery.clear_endpoint()


def _handle_url(url: str) -> int:
    """Act on a prism:// link. This is what the OS invokes for a registered scheme.

    Runs as a short-lived process, separate from the agent: the browser launches a
    *new* copy of us with the URL, it isn't delivered to the one already running.
    So do the work and exit, don't try to start a second agent (which the
    single-instance guard would refuse anyway).
    """
    link = protocol.parse(url)
    if link is None:
        print(f"Not a prism:// URL: {url}", file=sys.stderr)
        return 2

    saved = settings_store.load()

    if link.action == "open":
        import webbrowser

        # Go through PrismClient rather than hand-rolling the path: it's the one
        # place that knows the web app's route, and building it here is how this
        # drifted to the wrong (pluralised) URL in the first place.
        client = PrismClient(
            PrismConfig(base_url=saved.server_url, token=saved.api_token)
        )
        target = (
            client.project_url(link.project_id)
            if link.project_id
            else saved.server_url.rstrip("/")
        )
        webbrowser.open(target)
        return 0

    if link.action == "ping":
        # End-to-end check of the registration itself: the browser hands the OS a
        # prism:// URL, the OS launches us, we say so. No project, no KiCad.
        _show_dialog("Prism", "prism:// links are working.")
        return 0

    if link.action == "auth":
        # The OIDC redirect will land here. Handing the code to the running agent
        # is the next piece of work; for now say so plainly rather than silently
        # dropping a login the user just completed.
        print(
            "Received a prism://auth callback, but sign-in isn't wired up yet.",
            file=sys.stderr,
        )
        return 1

    print(f"Don't know how to handle prism://{link.action}", file=sys.stderr)
    return 2


def _show_dialog(title: str, message: str) -> None:
    """A message box, from a process with no GUI toolkit loaded.

    This runs as a short-lived process the OS spawned for the URL, so there's no wx
    and no tray to talk to. Each platform's own dialog is the cheapest way to put
    something on screen, and falls back to stdout if that fails.
    """
    try:
        if sys.platform == "win32":
            import ctypes

            ctypes.windll.user32.MessageBoxW(None, message, title, 0x40)  # MB_ICONINFO
            return
        if sys.platform == "darwin":
            subprocess.run(
                [
                    "osascript",
                    "-e",
                    f'display dialog "{message}" with title "{title}" '
                    'buttons {"OK"} default button "OK"',
                ],
                check=False,
                timeout=60,
            )
            return
        for cmd in (
            ["zenity", "--info", f"--title={title}", f"--text={message}"],
            ["kdialog", "--title", title, "--msgbox", message],
            ["notify-send", title, message],
        ):
            try:
                subprocess.run(cmd, check=True, timeout=60)
                return
            except (OSError, subprocess.SubprocessError):
                continue
    except Exception:
        pass  # no GUI available; fall through to stdout

    print(f"{title}: {message}")


def self_command(*args: str) -> list[str]:
    """How to invoke *this* agent again, frozen or not.

    Frozen, sys.executable IS the agent, so it takes the arguments directly. From a
    checkout it's a Python interpreter, which needs `-m prism_agent`. Everything
    that re-launches us (restart, autostart, the prism:// handler) must go through
    here, or it will work in a dev tree and break in the shipped binary.
    """
    if is_frozen():
        return [sys.executable, *args]
    return [sys.executable, "-m", "prism_agent", *args]


def _detached() -> dict:
    """Popen flags for a process that must outlive its parent."""
    if sys.platform == "win32":
        return {
            "creationflags": (
                subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
            )
        }
    return {"start_new_session": True}  # setsid


def _relaunch() -> None:
    """Start a fresh agent process, for /restart.

    Detached, and only *after* the current one has released its port and discovery
    file, otherwise the new agent's single-instance guard would see us still alive
    and politely refuse to start.
    """
    cwd = None if is_frozen() else str(Path(__file__).resolve().parent.parent)
    subprocess.Popen(
        self_command(),
        cwd=cwd,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        **_detached(),
    )


def _run_tray(tray_mods, server, stop: threading.Event, config, port) -> int:
    pystray, Image, ImageDraw = tray_mods

    def on_quit(icon, _item):
        stop.set()
        _shutdown(server)
        icon.stop()

    def on_restart(icon, _item):
        # Same path /restart takes: stop, then relaunch once we've released the
        # port and the discovery file.
        if server.state.request_restart:
            server.state.request_restart()
        _shutdown(server)
        icon.stop()

    def on_open_prism(_icon, _item):
        import webbrowser

        # Read the setting fresh: the user may have changed the server URL since
        # the agent started, and opening the old one would be quietly wrong.
        webbrowser.open(settings_store.load().server_url)

    def status_text(_item) -> str:
        # pystray re-evaluates this each time the menu opens, so it stays live.
        return f"Agent running on 127.0.0.1:{port}"

    def server_text(_item) -> str:
        return f"Server: {settings_store.load().server_url}"

    icon = pystray.Icon(
        "kicad-prism",
        _make_icon(Image, ImageDraw),
        f"KiCad-Prism agent {VERSION}",
        menu=pystray.Menu(
            pystray.MenuItem(status_text, None, enabled=False),
            pystray.MenuItem(server_text, None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Open Prism", on_open_prism),
            # Settings live in the plugin's dialog, which is a real UI toolkit,
            # pystray menus can't host text fields, so pointing at it beats a
            # half-usable tray form.
            pystray.MenuItem("Restart agent", on_restart),
            pystray.MenuItem("Quit", on_quit),
        ),
    )

    # /quit sets the same event the tray's Quit item does, so the API can stop the
    # agent even while the tray loop owns the main thread. Without this the process
    # would keep running after /quit answered "stopping".
    def _watch_for_api_quit():
        stop.wait()
        _shutdown(server)
        icon.stop()

    threading.Thread(target=_watch_for_api_quit, daemon=True).start()

    try:
        icon.run()  # blocks on the platform's tray loop
    finally:
        if not stop.is_set():
            _shutdown(server)
    return 0


def _run_headless(server, stop: threading.Event, port, reason: str | None) -> int:
    """Serve with no tray. The API is the control surface, so nothing is lost but
    the icon, as long as we say so loudly and explain how to stop it."""
    if reason:
        print(reason, file=sys.stderr)
        print(file=sys.stderr)

    print(f"KiCad-Prism agent {VERSION} running on 127.0.0.1:{port} (no tray).")
    print("The KiCad plugin will find it as usual.")
    print(f"Stop it with Ctrl-C, or POST /quit (token in {discovery.endpoint_path()}).")
    sys.stdout.flush()

    def _sig(_signum, _frame):
        stop.set()

    signal.signal(signal.SIGINT, _sig)
    try:
        signal.signal(signal.SIGTERM, _sig)
    except (AttributeError, ValueError):
        pass  # not settable on every platform / thread

    try:
        stop.wait()
    finally:
        _shutdown(server)
    print("\nAgent stopped.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="prism_agent", description=__doc__)
    ap.add_argument(
        "--no-tray",
        action="store_true",
        help="run without a tray icon (headless, SSH, or a desktop with no tray)",
    )
    ap.add_argument(
        "--open-url",
        metavar="URL",
        help="handle a prism:// link and exit (this is how the OS invokes us)",
    )
    ap.add_argument(
        "--profile",
        metavar="NAME",
        help=(
            "run an isolated agent (own discovery file, settings, and "
            "single-instance guard). Lets a dev copy and an installed one coexist."
        ),
    )
    args = ap.parse_args()

    if args.profile:
        # Must be set before anything reads it. discovery.PROFILE is captured at
        # import, so update both the environment (for child processes we spawn) and
        # the already-imported module.
        import os

        os.environ["PRISM_PROFILE"] = args.profile
        discovery.PROFILE = args.profile

    if args.open_url:
        return _handle_url(args.open_url)

    # One agent per machine. A second would bind a different port, overwrite the
    # discovery file, and leave two processes racing, with whichever exits last
    # deleting the file and orphaning the other, so the plugin can find neither.
    # The plugin's "Start agent" button makes double-starting easy, so refuse here.
    existing = discovery.running_agent()
    if existing:
        print(
            f"The Prism agent is already running on 127.0.0.1:{existing['port']} "
            f"(pid {existing.get('pid')}).",
            file=sys.stderr,
        )
        return 0  # not an error: the desired state already holds

    config = _prism_config()
    server, _thread, state = serve(config)
    port = server.server_address[1]

    # One stop signal for every route out: the tray's Quit item, Ctrl-C, and the
    # API's /quit all set it. That's what keeps the agent controllable on a
    # machine where no tray icon can be drawn.
    stop = threading.Event()
    restarting = threading.Event()
    state.request_stop = stop.set

    def request_restart():
        # Relaunch only after we've exited, so the new agent's single-instance
        # guard doesn't see us still alive and refuse to start.
        restarting.set()
        stop.set()

    state.request_restart = request_restart

    try:
        if args.no_tray:
            return _run_headless(server, stop, port, None)
        return _run_with_tray(server, stop, config, port)
    finally:
        if restarting.is_set():
            _relaunch()


def _run_with_tray(server, stop, config, port) -> int:
    tray_mods, problem = _load_tray()
    if tray_mods is None:
        # No tray available, but the agent is still perfectly useful, and exiting
        # here would take the plugin's only backend down with it.
        return _run_headless(server, stop, port, problem)
    return _run_tray(tray_mods, server, stop, config, port)


if __name__ == "__main__":
    raise SystemExit(main())
