"""Switch a branch after KiCad closes, then reopen the project.

The plugin runs inside KiCad and cannot close it, and a checkout under an open board
is a data-loss hazard: KiCad holds the board in memory and would overwrite the
checked-out file on its next save. So the switch is deferred to the agent, which is a
separate process that outlives KiCad.

The flow:

  1. The plugin, knowing KiCad's pid (its own process), schedules a switch here.
  2. The agent watches that pid. Nothing touches the working tree while it is alive.
  3. When it exits (plus a short settle for the OS to release file locks), the agent
     re-checks the guard, checks out the ref, and reopens the project in KiCad.
  4. Any failure is surfaced to the user, so they are never left wondering why KiCad
     did not reopen.

Only one switch is pending at a time (the user drives it); scheduling a new one
replaces any pending one. A cap stops a forgotten switch waiting forever, and the
schedule can be cancelled.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path

from . import checkout, discovery, open_project

log = logging.getLogger(__name__)

# How long to wait for KiCad to close before giving up. A switch the user set up and
# then walked away from should not reopen KiCad hours later.
MAX_WAIT_SECONDS = 30 * 60

# After the pid is gone, wait this long before touching files: on Windows the process
# handle can be released while the OS still holds a lock on the files for a moment.
SETTLE_SECONDS = 1.5

# How often to poll the pid.
POLL_SECONDS = 1.0


@dataclass
class PendingSwitch:
    repo: str
    ref: str
    project_dir: str
    kicad_pid: int
    created: float = field(default_factory=time.time)


class SwitchScheduler:
    """Holds the one pending switch and the thread watching for KiCad to close."""

    def __init__(self, notify=None) -> None:
        # notify(title, message) shows the user an outcome. Injected so the agent can
        # route it through a short-lived helper process rather than calling a GUI
        # toolkit from this background thread, which is not safe while the tray owns
        # its own loop.
        self._notify = notify or (lambda *_: None)
        self._lock = threading.Lock()
        self._pending: PendingSwitch | None = None
        self._thread: threading.Thread | None = None
        self._cancel = threading.Event()

    def schedule(self, *, repo: str, ref: str, project_dir: str, kicad_pid: int) -> dict:
        """Record a switch and start watching. Replaces any pending one.

        Refuses if KiCad is not actually running under that pid: scheduling against a
        dead pid would fire immediately, possibly onto a tree KiCad had not finished
        writing on exit.
        """
        if not discovery._pid_alive(kicad_pid):
            raise checkout.CheckoutError(
                "KiCad does not appear to be running, so there is nothing to wait for. "
                "Switch from the panel while KiCad is open."
            )

        with self._lock:
            self._cancel.set()  # stop any existing watcher
            self._cancel = threading.Event()
            self._pending = PendingSwitch(
                repo=repo, ref=ref, project_dir=project_dir, kicad_pid=kicad_pid
            )
            cancel = self._cancel
            pending = self._pending
            self._thread = threading.Thread(
                target=self._watch, args=(pending, cancel), daemon=True,
                name="prism-switch-watch",
            )
            self._thread.start()
        return {"ok": True, "scheduled": True, "ref": ref}

    def cancel(self) -> dict:
        """Drop the pending switch, if any. The user changed their mind."""
        with self._lock:
            had = self._pending is not None
            self._cancel.set()
            self._pending = None
        return {"ok": True, "cancelled": had}

    def pending(self) -> dict | None:
        with self._lock:
            if self._pending is None:
                return None
            return {"ref": self._pending.ref, "project_dir": self._pending.project_dir}

    # -- the watcher -------------------------------------------------------

    def _watch(self, pending: PendingSwitch, cancel: threading.Event) -> None:
        """Wait for KiCad to close, then do the switch. Runs on its own thread."""
        deadline = pending.created + MAX_WAIT_SECONDS
        while not cancel.is_set():
            if not discovery._pid_alive(pending.kicad_pid):
                break
            if time.time() > deadline:
                self._clear_if_current(pending)
                self._notify(
                    "Prism",
                    "Gave up waiting for KiCad to close, so the branch switch to "
                    "%s was cancelled." % pending.ref,
                )
                return
            if cancel.wait(POLL_SECONDS):
                return  # cancelled

        if cancel.is_set():
            return

        # KiCad is gone. Let the OS settle before touching the tree.
        time.sleep(SETTLE_SECONDS)
        self._clear_if_current(pending)
        self._perform(pending)

    def _clear_if_current(self, pending: PendingSwitch) -> None:
        with self._lock:
            if self._pending is pending:
                self._pending = None

    def _perform(self, pending: PendingSwitch) -> None:
        """Re-check the guard, check out, reopen. Any failure is reported to the user."""
        repo = Path(pending.repo)

        # The user may have reopened KiCad in the gap, or KiCad may have written files on
        # close (autosave, project settings). Re-check right before acting rather than
        # trusting the state from when the switch was scheduled.
        try:
            state = checkout.status(repo, pending.ref)
        except checkout.CheckoutError as exc:
            self._notify("Prism", "Couldn't switch to %s: %s" % (pending.ref, exc))
            return

        if not state["can"]:
            # Dirty again, or the ref vanished. Do not stash or discard without asking;
            # tell the user and leave the tree as it is.
            self._notify(
                "Prism",
                "Couldn't switch to %s after closing KiCad:\n\n%s\n\n"
                "Your files are unchanged. Sort it out in the panel and try again."
                % (pending.ref, state["message"]),
            )
            return

        try:
            checkout.checkout(repo, pending.ref)
        except checkout.CheckoutError as exc:
            self._notify(
                "Prism",
                "Couldn't switch to %s: %s\n\nYour files are unchanged."
                % (pending.ref, exc),
            )
            return

        # Reopen. The project file may not exist on the target branch (renamed/removed),
        # in which case there is nothing to open, say so rather than failing silently.
        pro = open_project.find_project_file(pending.project_dir)
        if not pro:
            self._notify(
                "Prism",
                "Switched to %s, but it has no KiCad project file to reopen in %s."
                % (pending.ref, pending.project_dir),
            )
            return

        try:
            open_project.launch_kicad(pending.project_dir)
        except open_project.OpenError as exc:
            self._notify(
                "Prism",
                "Switched to %s, but couldn't reopen KiCad: %s" % (pending.ref, exc),
            )
            return

        log.info("Switched %s to %s and reopened", pending.repo, pending.ref)

        # If work was set aside from the branch we just landed on, tell the user it is
        # there. Not auto-applied: a restore can conflict, and it is theirs to trigger
        # from the panel. Only a returnable stash whose origin matches this branch.
        try:
            current = checkout.status(repo).get("current_branch") or ""
            match = checkout.find_returnable_stash(repo, current) if current else None
        except checkout.CheckoutError:
            match = None
        if match:
            self._notify(
                "Prism",
                "Reopened on %s. You have work set aside from this branch (\"%s\"); "
                "bring it back from the Prism panel when you're ready."
                % (current, match.get("message") or "your changes"),
            )
