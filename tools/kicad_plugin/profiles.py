"""Run profiles, mirrored for the plugin side.

This is a copy of ``prism_agent/profiles.py``. The plugin is installed into
KiCad's plugin directory on its own and cannot import the agent package, so the
registry both sides depend on to find each other must exist here too. The two
files must agree on every config-relevant field (name, config_suffix) or the
plugin computes a different config dir than the agent and never finds it;
``tools/tests/test_profiles_parity.py`` asserts they stay in sync.

Stdlib-only: this runs inside KiCad's Python, not the repo virtualenv.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Profile:
    name: str
    label: str
    preferred_port: int
    install_name: str
    config_suffix: str


PROFILES: dict[str, Profile] = {
    "release": Profile(
        name="release",
        label="Prism",
        preferred_port=48730,
        install_name="prism",
        config_suffix="",
    ),
    "dev": Profile(
        name="dev",
        label="Prism (dev)",
        preferred_port=48731,
        install_name="prism_dev",
        config_suffix="dev",
    ),
}

DEFAULT_PROFILE = "release"


def _auto_detect() -> str:
    tools = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    return "dev" if os.path.isfile(os.path.join(tools, "build_agent.py")) else "release"


def resolve(explicit: str | None = None) -> Profile:
    name = (explicit or os.environ.get("PRISM_PROFILE") or "").strip()
    if not name:
        name = _auto_detect()
    return PROFILES.get(name, PROFILES[DEFAULT_PROFILE])


def is_known(name: str) -> bool:
    return name in PROFILES
