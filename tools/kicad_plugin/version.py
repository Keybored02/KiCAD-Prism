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

# This plugin's version, and the source of truth for the package's. package_plugin.py
# reads it rather than taking one as an argument, and refuses to build unless the
# agent's VERSION matches, so a zip cannot claim a version its code disagrees with.
VERSION = "0.5.16"

# The oldest agent this plugin can work with: the last release that actually changed
# what the plugin needs, not the current one. Pinning it to VERSION forces a restart
# after every update, even when the running agent serves this plugin perfectly well.
#
# 0.5.0: switching a branch changed shape rather than merely gaining a route. In 0.4.0
# /switch was a GET reporting the pending deferred switch; from 0.5.0 it is a POST that
# performs the checkout, so a 0.4.0 agent answers this plugin's switch with a 404, and
# /remotes does not exist there at all.
#
# (0.3.0 was the floor before that, for /settings and /restart.)
AGENT_MIN = "0.5.0"


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


def server_verdict(server_plugin: dict | None) -> tuple[str, str]:
    """How this plugin stands against the server it's talking to.

    The plugin follows its server. There is no independent update channel, precisely so
    the two can't drift: a plugin from six months ago against a moved-on API is exactly
    the support burden worth designing out.

    Returns (verdict, download_url):
        "ok"        current, or ahead of a server that hasn't been updated yet
        "update"    behind what the server expects, but still workable
        "required"  older than the server can serve at all

    Anything unknown (no server, an older server with no version endpoint) is "ok": the
    plugin must keep working against a backend that can't answer.
    """
    if not isinstance(server_plugin, dict):
        return "ok", ""

    url = str(server_plugin.get("download_url") or "")
    mine = parse(VERSION)

    minimum = server_plugin.get("minimum")
    if minimum and mine < parse(minimum):
        return "required", url

    expected = server_plugin.get("expected")
    if expected and mine < parse(expected):
        return "update", url

    return "ok", url
