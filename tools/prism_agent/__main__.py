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
import logging
import signal
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

from . import discovery, protocol
from . import settings as settings_store
from .prism_client import PrismClient, PrismConfig
from .server import VERSION, serve

log = logging.getLogger(__name__)


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

        if not link.project_id:
            # No project named: just the web app.
            webbrowser.open(saved.server_url.rstrip("/"))
            return 0

        # A project link opens the project ON THIS MACHINE, in KiCad. That is the
        # point of having a desktop agent at all; if the user wanted the web app they
        # would have clicked a web link.
        #
        # ?commit=<sha> (or ?ref=) opens a PRECISE revision, which is what makes a link
        # from a diff or a release actually land somewhere useful.
        ref = link.params.get("commit") or link.params.get("ref") or ""
        return _open_project_locally(link.project_id, saved, ref)

    if link.action == "web":
        # The escape hatch: prism://web/<id> forces the browser. Go through
        # PrismClient rather than hand-rolling the path, it's the one place that
        # knows the web app's route, and building it here is how this drifted to the
        # wrong (pluralised) URL before.
        import webbrowser

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
        # Sign-in does NOT use this scheme. The agent signs in through a loopback
        # listener (see signin.py), the browser redirects back to 127.0.0.1
        # directly, so a prism://auth callback should never occur. If one does,
        # say so plainly rather than appear to accept a login we did nothing with.
        print(
            "Received a prism://auth callback, but the agent signs in over a "
            "loopback listener, not this scheme. Nothing to do.",
            file=sys.stderr,
        )
        return 1

    print(f"Don't know how to handle prism://{link.action}", file=sys.stderr)
    return 2


def _open_project_locally(project_id: str, saved, ref: str = "") -> int:
    """prism://open/<id>: open the project in KiCad, cloning it first if needed.

    `ref` opens a precise revision. Runs in the short-lived process the OS spawned for
    the URL, so there is no tray and no wx here. Anything the user needs to see or answer
    goes through the themed tkinter dialogs in dialogs.py.
    """
    from . import open_project

    try:
        opened = open_project.open_project(
            project_id,
            confirm=_ask,
            ref=ref,
            ask_choice=_ask_uncommitted,
            clone_flow=_clone_flow,
            on_root_added=_root_added,
        )
    except open_project.OpenError as exc:
        msg = str(exc)
        if msg == "Cancelled.":
            return 0  # the user said no; that is an outcome, not an error
        _show_dialog("Prism", msg)
        return 1

    log.info("Opened %s from %s", project_id, opened)
    return 0


def _clone_flow(name: str, origin: str) -> str | None:
    """Ask to clone, let the user pick a parent folder, then confirm. Returns the
    parent directory, or None to cancel.

    Prism only ever clones the project's own Prism-known origin, with the user's local
    git. This is the consent path for that: a plain link is not permission to write to
    disk, so nothing happens until the user says Clone, chooses where, and confirms.
    """
    from . import dialogs
    from .open_project import _safe_dirname

    if not dialogs.ask_clone_or_cancel(
        "Prism doesn't have %s on this machine.\n\n"
        "Clone it from remote repository?" % name,
        title="Open in KiCad",
    ):
        return None

    parent = dialogs.pick_clone_folder(
        "Pick a folder to clone %s into.\n\n"
        "That folder is added to "
        "your project list in the plugin if it isn't already." % name,
        title="Choose a folder",
    )
    if not parent:
        return None

    destination = "%s/%s" % (parent.rstrip("/\\"), _safe_dirname(name))
    if not dialogs.ask_clone_or_cancel(
        "Clone %s into:\n%s\n\n"
        "This uses your own git access (the same credentials you use for git)."
        % (name, destination),
        title="Clone",
    ):
        return None
    return parent


def _root_added(cloned_dir: str) -> None:
    """Tell the user the cloned folder was added to their project list."""
    _show_dialog(
        "Project list updated",
        "Added this folder to your Prism project list so it's found next time:\n\n%s"
        % cloned_dir,
    )


def _ask(question: str) -> bool:
    """A yes/no the user can actually refuse.

    Cloning a repo they did not ask for, into a folder they did not choose, is not
    something a link in a browser should authorise. So we ask, and a failure to ask
    (no dialog available) is a NO, never a silent yes.
    """
    from . import dialogs

    return dialogs.ask(question, confirm="Continue")


def _ask_uncommitted(question: str) -> tuple[str, str]:
    """The three-way choice for uncommitted work: set aside, discard, or cancel.

    Returns (action, message). Cancel when we cannot ask: a link is not consent to move,
    let alone destroy, somebody's unsaved board.
    """
    from . import dialogs

    return dialogs.ask_stash_or_discard(question, title="Uncommitted changes")


def _show_dialog(title: str, message: str) -> None:
    """Say something, from a process with no GUI toolkit loaded.

    Falls back to stdout if no window can be opened, which is all a headless machine can
    do and better than swallowing the message.
    """
    from . import dialogs

    dialogs.tell(message, title=title)


def _watch_for_uninstall(stop: threading.Event) -> None:
    """Notice that we've been uninstalled, and tidy up after ourselves.

    PCM has no uninstall hook, and the agent is a detached process that outlives KiCad.
    So uninstalling the plugin deletes our binary from under a still-running agent,
    which then keeps serving, keeps its autostart entry, and keeps owning the prism://
    scheme, all pointing at a file that no longer exists.

    Nobody else can clean that up, so we watch for our own binary disappearing. Only
    meaningful when frozen; from a source checkout there's no single file to miss, and
    a developer deleting one is not an uninstall.
    """
    exe = Path(sys.executable) if getattr(sys, "frozen", False) else None
    if exe is None:
        return

    while not stop.wait(30):
        if exe.exists():
            continue
        # Give a slow or retrying installer a moment; a brief gap during a file
        # replace is an update, not an uninstall.
        time.sleep(5)
        if exe.exists():
            continue

        print(
            f"{exe} is gone; the plugin was uninstalled. Cleaning up.", file=sys.stderr
        )
        _cleanup_os_integration()
        stop.set()
        return


def _cleanup_os_integration() -> None:
    """Undo everything we registered with the OS. Best effort: a failure here must not
    stop the agent exiting, or an uninstall leaves a process running."""
    from . import autostart

    try:
        autostart.disable()
    except Exception:
        print("Couldn't remove the autostart entry.", file=sys.stderr)
    try:
        protocol.unregister()
    except Exception:
        print("Couldn't unregister the prism:// handler.", file=sys.stderr)


def _claim_singleton() -> bool:
    """Become the one agent, retiring an older one if it holds the post.

    This is what makes an UPDATE work. The agent is detached and outlives KiCad, and
    autostart brings it back at login, so installing a new version routinely lands a
    new binary beside an OLD agent that is still running. The old code then serves
    forever: the newcomer used to see it, say "already running", and exit.

    So: if the incumbent is older than us, ask it to quit and take over. If it's the
    same version or newer, defer to it, there's nothing to gain by churning. If we
    can't tell (an agent from before this field existed), retire it anyway: an unknown
    version is by definition not newer than ours.

    Returns True if we should go on to serve.
    """
    existing = discovery.running_agent()
    if not existing:
        return True

    theirs = existing.get("version", "")
    if theirs and not _older_than(theirs, VERSION):
        print(
            f"The Prism agent is already running on 127.0.0.1:{existing['port']} "
            f"(pid {existing.get('pid')}, version {theirs}).",
            file=sys.stderr,
        )
        return False

    print(
        f"Retiring agent {theirs or 'of unknown version'} "
        f"(pid {existing.get('pid')}) in favour of {VERSION}.",
        file=sys.stderr,
    )
    if not _retire(existing):
        print("Couldn't stop the running agent; leaving it in place.", file=sys.stderr)
        return False
    return True


def _older_than(a: str, b: str) -> bool:
    """Is version a older than version b? Unparseable sorts as oldest."""

    def parts(v: str) -> tuple:
        try:
            return tuple(int(x) for x in v.strip().split("."))
        except ValueError:
            return ()

    return parts(a) < parts(b)


def _retire(existing: dict) -> bool:
    """Ask a running agent to quit, and wait for it to actually go.

    Uses its own /quit route, so it shuts down cleanly and clears its discovery file
    rather than being killed and leaving a stale one behind.
    """
    port, token = existing.get("port"), existing.get("token")
    if not port or not token:
        return False

    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/quit", data=b"{}", method="POST"
    )
    request.add_header("Authorization", f"Bearer {token}")
    try:
        urllib.request.urlopen(request, timeout=10)
    except (OSError, ValueError):
        return False

    # It answers before it stops (shutting down from inside a handler would deadlock),
    # so wait for the port to actually go quiet rather than racing it for the bind.
    for _ in range(50):
        if discovery.running_agent() is None:
            return True
        time.sleep(0.1)
    return False


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
    """Popen flags for a process that must outlive its parent.

    CREATE_NO_WINDOW keeps the relaunched agent from opening a console window on
    restart, DETACHED_PROCESS alone frees it from the parent's console but does
    not stop a console-subsystem python from creating its own."""
    if sys.platform == "win32":
        return {
            "creationflags": (
                subprocess.CREATE_NEW_PROCESS_GROUP
                | subprocess.DETACHED_PROCESS
                | subprocess.CREATE_NO_WINDOW
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

    def _identity() -> dict:
        # Cheap enough to read on each menu open: it is a couple of loopback-ish
        # calls to the backend, and it keeps the Sign in/out items honest (a token
        # can expire or be revoked under a running agent).
        try:
            return server.state.prism.identity()
        except Exception:
            return {}

    def sign_in_visible(_item) -> bool:
        ident = _identity()
        return bool(ident.get("sign_in_required")) and not ident.get("signed_in")

    def sign_out_visible(_item) -> bool:
        return bool(_identity().get("signed_in"))

    def on_sign_in(_icon, _item):
        from .server import apply_sign_in

        # Off the tray thread: the browser wait can take minutes, and blocking the
        # tray loop would freeze the icon and its menu.
        def run():
            status, result = apply_sign_in(server.state)
            if status != 200:
                _show_dialog("Prism sign-in", result.get("error", "Sign-in failed."))

        threading.Thread(target=run, name="prism-signin", daemon=True).start()

    def on_sign_out(_icon, _item):
        from .server import apply_sign_out

        def run():
            warning = apply_sign_out(server.state)
            if warning:
                _show_dialog("Prism sign-out", warning)

        threading.Thread(target=run, name="prism-signout", daemon=True).start()

    def status_text(_item) -> str:
        # pystray re-evaluates this each time the menu opens, so it stays live.
        return f"Agent running on 127.0.0.1:{port}"

    def server_text(_item) -> str:
        return f"Server: {settings_store.load().server_url}"

    def _kicad_menu():
        """A radio submenu to choose which KiCad opens project files.

        Rebuilt each time the tray menu is constructed (once per run); discovery is
        cheap and the set of installed KiCads does not change under a running agent
        often enough to warrant re-scanning on every menu open. "System default"
        clears the pinned command, restoring the OS file association.
        """
        from . import kicad_versions

        try:
            installs = kicad_versions.discover()
        except Exception:
            installs = []

        def choose(command):
            return lambda _icon, _item: settings_store.update(kicad_command=command)

        def is_current(command):
            return lambda _item: settings_store.load().kicad_command.strip() == command

        items = [
            pystray.MenuItem(
                "System default",
                choose(""),
                checked=is_current(""),
                radio=True,
            )
        ]
        for install in installs:
            items.append(
                pystray.MenuItem(
                    install.label,
                    choose(install.path),
                    checked=is_current(install.path),
                    radio=True,
                )
            )
        if not installs:
            items.append(
                pystray.MenuItem("(no KiCad found)", None, enabled=False)
            )
        return pystray.Menu(*items)

    icon = pystray.Icon(
        "kicad-prism",
        _make_icon(Image, ImageDraw),
        f"KiCad-Prism agent {VERSION}",
        menu=pystray.Menu(
            pystray.MenuItem(status_text, None, enabled=False),
            pystray.MenuItem(server_text, None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Open Prism", on_open_prism),
            # Sign in / out show only when they apply: sign in when the server
            # wants a token and we have none, sign out when we are signed in. On a
            # no-auth server neither appears. pystray re-checks visible() each time
            # the menu opens, so the pair stays in step with the real state.
            pystray.MenuItem("Sign in", on_sign_in, visible=sign_in_visible),
            pystray.MenuItem("Sign out", on_sign_out, visible=sign_out_visible),
            pystray.Menu.SEPARATOR,
            # Which KiCad opens project files, when several are installed.
            pystray.MenuItem("Open files with", _kicad_menu()),
            pystray.Menu.SEPARATOR,
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
    from .profiles import PROFILES, is_known

    ap.add_argument(
        "--profile",
        metavar="NAME",
        choices=sorted(PROFILES),
        help=(
            "run as this profile (own discovery file, settings, port, and "
            "single-instance guard), one of: "
            + ", ".join(sorted(PROFILES))
            + ". Lets a dev copy and an installed one coexist. Defaults to "
            "auto-detection (a source checkout is 'dev')."
        ),
    )
    args = ap.parse_args()

    if args.profile:
        # Set the env var before anything resolves the profile: discovery,
        # server, and any child process we spawn all read PRISM_PROFILE through
        # the registry, so this one assignment steers them all. discovery.PROFILE
        # (captured at import) is refreshed too for callers that read it directly.
        import os

        os.environ["PRISM_PROFILE"] = args.profile
        discovery.PROFILE = args.profile if is_known(args.profile) else discovery.PROFILE

    if args.open_url:
        return _handle_url(args.open_url)

    # One agent per machine. A second would bind a different port, overwrite the
    # discovery file, and leave two processes racing, with whichever exits last
    # deleting the file and orphaning the other, so the plugin can find neither.
    if not _claim_singleton():
        return 0  # an equal-or-newer agent already holds the post

    # A prism:// registration embeds the interpreter, the source path and the profile,
    # and any of those can drift under it: moving the checkout, switching venvs, or
    # (the one that bit) a dev agent that registered a command carrying no profile, so
    # the handler read a different settings file than the agent and reported "no
    # projects folder is set" for folders the user could see in the plugin.
    #
    # is_registered() cannot catch that, the key is there and looks fine, so rewrite our
    # own registration when its contents no longer match what we would write. Only when
    # one already exists: this repairs, it never claims the scheme uninvited.
    try:
        if protocol.is_stale():
            protocol.register()
            log.info("Rewrote a stale prism:// registration")
    except protocol.RegistrationError as exc:
        log.warning("Couldn't refresh the prism:// registration: %s", exc)

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

    # Uninstalling the plugin deletes our binary from under us. Nobody else can notice
    # that (PCM has no uninstall hook, and we're detached from KiCad), so we do.
    threading.Thread(
        target=_watch_for_uninstall,
        args=(stop,),
        name="prism-uninstall-watch",
        daemon=True,
    ).start()

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
