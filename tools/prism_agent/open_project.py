"""Opening a Prism project on this machine: `prism://open/<id>`.

Everything phases 1 to 3 built exists to make this one function honest:

    have it?  -> open it in KiCad
    not?      -> offer to clone `origin_url`, then open it
    no git?   -> say so; do not pretend

The client never asks where the *server* keeps its copy, and never compares paths. It
looks for a `.prism.json` marker under the user's projects roots, and clones the URL
the server told it to. That is identical code for both origin models, which was the
whole point of unifying them: an external origin and a Prism-hosted one differ only in
what `origin_url` happens to say.
"""

from __future__ import annotations

import logging
import os
import subprocess
import sys
from pathlib import Path

from . import identity
from . import settings as settings_store
from .prism_client import PrismClient

log = logging.getLogger(__name__)

# Give a clone room to finish. A board repo with 3D models is not small, and killing
# a half-finished clone would leave a broken tree the user then has to clean up.
CLONE_TIMEOUT = 900


class OpenError(Exception):
    """Couldn't open the project, with a reason worth showing the user."""


def _no_window() -> int:
    """Stop a console window flashing up on Windows for a background subprocess."""
    return getattr(subprocess, "CREATE_NO_WINDOW", 0)


def find_project_file(directory: str | Path) -> str:
    """The `.kicad_pro` to hand to KiCad, or "" if there isn't one.

    The project file, not the board: opening the .kicad_pro gets you KiCad's project
    window with the schematic and PCB both reachable, which is what someone following
    a link to a *project* expects.
    """
    try:
        pro = sorted(Path(directory).glob("*.kicad_pro"))
    except OSError:
        return ""
    return str(pro[0]) if pro else ""


def launch_kicad(project_dir: str | Path) -> None:
    """Open a project directory in KiCad.

    Hands the `.kicad_pro` to the OS rather than hunting for a KiCad binary. The user
    already has KiCad associated with its own project files (they installed it), and
    guessing at install paths across three platforms and a dozen versions is a
    reliability problem we do not need to own.
    """
    pro = find_project_file(project_dir)
    if not pro:
        raise OpenError("No KiCad project file (.kicad_pro) in %s" % project_dir)

    try:
        if sys.platform == "win32":
            os.startfile(pro)  # noqa: S606
        elif sys.platform == "darwin":
            subprocess.Popen(["open", pro])
        else:
            subprocess.Popen(["xdg-open", pro])
    except OSError as exc:
        raise OpenError("Couldn't open %s: %s" % (pro, exc)) from exc


def clone(origin_url: str, destination: str | Path) -> None:
    """Clone a project into `destination`.

    A normal working-tree clone, never bare: KiCad opens files off the disk, so a bare
    clone would be useless to it. Bare only ever applies to a Prism-hosted origin on
    the *server* side.
    """
    dest = Path(destination)
    if dest.exists() and any(dest.iterdir()):
        raise OpenError("%s already exists and is not empty" % dest)

    env = os.environ.copy()
    # Never block on a credential prompt: this runs detached from any terminal, so a
    # prompt would hang forever with nothing on screen to answer it.
    env["GIT_TERMINAL_PROMPT"] = "0"

    try:
        result = subprocess.run(
            ["git", "clone", origin_url, str(dest)],
            capture_output=True,
            text=True,
            timeout=CLONE_TIMEOUT,
            check=False,
            env=env,
            creationflags=_no_window(),
        )
    except subprocess.TimeoutExpired as exc:
        raise OpenError("The clone timed out.") from exc
    except OSError as exc:
        raise OpenError("Couldn't run git: %s" % exc) from exc

    if result.returncode != 0:
        # git's own last line is almost always the useful one ("Repository not found",
        # "Permission denied (publickey)"). Our own wording would only bury it.
        detail = (result.stderr or "").strip().splitlines()
        raise OpenError(detail[-1] if detail else "The clone failed.")


def resolve(project_id: str) -> dict:
    """Work out what opening this project would involve, without doing it.

    Returns:
        found     the local directory, if we already have it
        origin    what we would clone
        owner     external | prism | none
        name      for the confirmation prompt
        roots     configured projects roots (empty = we did not look anywhere)
    """
    saved = settings_store.load()
    found = identity.find_by_id(project_id, saved.projects_roots)

    client = PrismClient(_config(saved))
    rows = client._request("GET", "/api/projects")
    row = None
    if isinstance(rows, list):
        row = next(
            (r for r in rows if isinstance(r, dict) and r.get("id") == project_id),
            None,
        )

    return {
        "id": project_id,
        "found": found,
        "origin": (row or {}).get("origin_url") or "",
        "owner": (row or {}).get("origin_owner") or "",
        "name": (row or {}).get("name") or project_id,
        "known": row is not None,
        "roots": saved.projects_roots,
    }


def _config(saved):
    from .prism_client import PrismConfig

    return PrismConfig(base_url=saved.server_url, token=saved.api_token)


def open_project(project_id: str, confirm=None) -> str:
    """Open a Prism project, cloning it first if this machine does not have it.

    `confirm(question) -> bool` is asked before anything is written to disk. Cloning a
    repo the user did not ask for, into a folder they did not choose, is exactly the
    kind of thing a URL handler must not do silently: a link in a browser is not
    consent to write to the filesystem.

    Returns the directory the project was opened from.
    """
    state = resolve(project_id)

    if state["found"]:
        launch_kicad(state["found"])
        return state["found"]

    # From here on we would have to create something, so every path needs a reason the
    # user can act on.
    if not state["known"]:
        raise OpenError(
            "This server has no project %s. It may have been deleted, or the link "
            "may point at a different Prism server." % project_id
        )

    if state["owner"] == "none" or not state["origin"]:
        raise OpenError(
            "%s is not backed by git, so there is nothing to clone. Open it on the "
            "machine that holds it." % state["name"]
        )

    roots = state["roots"]
    if not roots:
        raise OpenError(
            "No projects folder is set, so there is nowhere to put %s. Add one in "
            "Prism settings." % state["name"]
        )

    destination = Path(roots[0]) / _safe_dirname(state["name"])
    if confirm is not None and not confirm(
        "Prism doesn't have %s on this machine.\n\nClone it into:\n%s"
        % (state["name"], destination)
    ):
        raise OpenError("Cancelled.")

    clone(state["origin"], destination)

    # The clone has no marker if the project predates phase 1, and without one we
    # would fail to find it next time and clone it all over again. Stamp it.
    marker_dir = str(destination)
    if not identity.project_id(marker_dir):
        identity.write(marker_dir, project_id, settings_store.load().server_url)

    launch_kicad(marker_dir)
    return marker_dir


def _safe_dirname(name: str) -> str:
    """A project name turned into a directory name.

    Project names come from the server and can contain anything. A name with a
    separator or a `..` in it would let a link write outside the projects root, which
    a URL handler must never allow.
    """
    cleaned = "".join(c for c in name if c.isalnum() or c in " ._-").strip(" .")
    return cleaned or "project"
