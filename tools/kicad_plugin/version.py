"""Version, and what the plugin needs from the agent.

The plugin and the agent are shipped together in one zip, but they do NOT
necessarily run together. The agent is a detached process that outlives KiCad, and
autostart means it's already running at login, so after an update, a **new plugin
routinely meets an old agent**. That's not an edge case; with automatic updates it's
the normal path.

Left unchecked, the plugin talks to the old agent, gets a 404 for a route that
didn't exist yet, or a payload missing a field, and fails in a way that looks like a
bug in the new code. This turns that whole class of mystery into one clear message.

Bump AGENT_MIN when the plugin starts relying on something a previous agent didn't
have. Leave it alone for changes the old agent can still serve.
"""

from __future__ import annotations

# This plugin's version. Kept in step with the package metadata.
VERSION = "0.4.0"

# The oldest agent this plugin can work with.
#
# 0.3.0 added /settings and /restart, which the plugin now depends on: without them
# Settings is dead and we can't recover from a version mismatch. Anything older is
# genuinely unusable, not merely degraded.
AGENT_MIN = "0.3.0"


def parse(v: str) -> tuple:
    """'0.3.1' -> (0, 3, 1). Tolerant: anything unparseable sorts lowest, so a
    garbled version is treated as too old rather than assumed fine."""
    parts = []
    for chunk in str(v or "").split(".")[:3]:
        digits = ""
        for ch in chunk:
            if ch.isdigit():
                digits += ch
            else:
                break
        parts.append(int(digits) if digits else 0)
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts)


def agent_too_old(agent_version: str) -> bool:
    return parse(agent_version) < parse(AGENT_MIN)
