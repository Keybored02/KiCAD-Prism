"""What counts as KiCad-generated noise, rather than design work.

KiCad writes a lot of files nobody wants to see in a change list or a commit
history. The worst is the auto-archive: `auto_backup` is ON by default and keeps up
to 25 zips / 100 MB per project in a `<project>-backups/` folder. There are also
`-bak` files, autosaves, and caches KiCad regenerates on demand.

None of it tells you anything about the design, and there can be dozens of entries
per real edit — which is exactly how the signal gets drowned.

Two things this module deliberately does NOT do:

  * It doesn't delete anything. It classifies.
  * It doesn't hide things silently. Callers should *gate* — show a count and let
    the user unfold it — because a file that vanishes with no trace is worse than
    one that's merely noisy. Silently hiding a file the user actually committed
    would be a lie about the state of their repo.

The honest fix for most of these is a .gitignore entry: they shouldn't be committed
at all. This module is what lets us say so.
"""

from __future__ import annotations

import re

# Directories KiCad owns end-to-end. Anything under them is noise.
NOISE_DIRS = (
    "-backups",  # the auto-archive: <project>-backups/*.zip. The big one.
)

# Suffixes for files KiCad writes for itself.
NOISE_SUFFIXES = (
    ".kicad_pcb-bak",
    ".kicad_sch-bak",
    ".kicad_prl",  # per-user local project state; not shared design data
    ".bak",
    ".bck",
    "-bak",
    "~",  # editor/KiCad leftovers
)

# Exact names (case-insensitive) that are generated rather than designed.
#   fp-info-cache  a footprint index KiCad rebuilds whenever it feels like it
#   .prism.json    our own project marker. We put it there; it is not the user's work,
#                  and showing it in their change list is us adding to the noise we are
#                  supposed to be removing.
NOISE_NAMES = ("fp-info-cache", ".prism.json")

# Directories whose contents we fetch rather than the user authoring them. RemoteLibrary
# is where the symbol provider downloads placed parts; it is a cache of upstream assets,
# and it churns on every placement.
_FETCHED_DIRS = re.compile(r"(^|/)RemoteLibrary(/|$)", re.IGNORECASE)

# Autosaves: KiCad prefixes the filename, e.g. _autosave-board.kicad_pcb
_AUTOSAVE = re.compile(r"(^|/)[_~]autosave[-_]", re.IGNORECASE)

# Cache libraries KiCad rebuilds from the schematic.
_CACHE_LIB = re.compile(r"-cache\.(lib|dcm)$", re.IGNORECASE)

# Lock files: "~<project>.kicad_pcb.lck", written while a document is open and deleted
# on close. They only appear in a change list because KiCad happened to be running.
_LOCK = re.compile(r"(^|/)~.*\.lck$", re.IGNORECASE)


def is_noise(path: str) -> bool:
    """Is this path something KiCad generated rather than something you designed?

    `path` is repo-relative and forward-slashed, as git reports it.
    """
    if not path:
        return False

    p = path.replace("\\", "/")
    lower = p.lower()
    name = lower.rsplit("/", 1)[-1]

    # A backups *directory* anywhere in the path — the archive folder, and anything
    # git reports inside it.
    for segment in lower.split("/"):
        if segment.endswith(NOISE_DIRS):
            return True

    if name in NOISE_NAMES:
        return True

    if lower.endswith(NOISE_SUFFIXES):
        return True

    if _AUTOSAVE.search(lower) or _CACHE_LIB.search(lower) or _LOCK.search(lower):
        return True

    return bool(_FETCHED_DIRS.search(p))


def partition(paths):
    """Split an iterable of paths into (design, noise), preserving order."""
    design, noise = [], []
    for p in paths:
        (noise if is_noise(p) else design).append(p)
    return design, noise
