"""What plugin version this server expects.

The KiCad plugin talks to one Prism server, so its version has to follow that server's.
Letting the two drift is how you end up supporting a plugin from six months ago against
an API that has moved on.

This is deliberately NOT authenticated. A plugin too old to authenticate is exactly the
one that most needs to be told to update, and telling it so leaks nothing: the version
number and a download URL are public facts about a release.

Bump PLUGIN_EXPECTED when the server starts relying on plugin behaviour an older one
does not have. Bump PLUGIN_MIN only when an older plugin is genuinely broken against
this server, not merely behind: it is the difference between "you should update" and
"you must".
"""

from __future__ import annotations

import os

from fastapi import APIRouter

router = APIRouter()

# The plugin version shipped with this server.
PLUGIN_EXPECTED = "0.4.0"

# The oldest plugin this server can still serve correctly.
PLUGIN_MIN = "0.4.0"

# Where to get it. Overridable so a private deployment can serve its own build rather
# than sending users to a public repo they may not be able to reach.
DOWNLOAD_URL = os.environ.get(
    "PRISM_PLUGIN_DOWNLOAD_URL",
    "https://github.com/Keybored02/KiCAD-Prism/releases/latest",
)


@router.get("/version")
async def plugin_version() -> dict:
    """The plugin version this server expects, and where to get it."""
    return {
        "expected": PLUGIN_EXPECTED,
        "minimum": PLUGIN_MIN,
        "download_url": DOWNLOAD_URL,
    }
