"""The agent and plugin ship separate copies of the profile registry.

The plugin is installed into KiCad's plugin directory on its own and cannot
import the agent package, so prism_agent/profiles.py is mirrored in
kicad_plugin/profiles.py. If the two drift on any config-relevant field, the
plugin computes a different config dir or port than the agent and never finds
it. These tests fail the moment they diverge.
"""

from __future__ import annotations

import importlib.util
import sys
from dataclasses import asdict
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))

from prism_agent import profiles as agent_profiles  # noqa: E402


def _load_plugin_profiles():
    """Load kicad_plugin/profiles.py without importing the plugin package.

    The package __init__ pulls in pcbnew (KiCad's runtime module), absent
    outside KiCad, so load the mirror file directly by path instead.
    """
    path = TOOLS / "kicad_plugin" / "profiles.py"
    name = "_plugin_profiles_under_test"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    # Register before exec so the dataclass decorator can resolve the module.
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


plugin_profiles = _load_plugin_profiles()


def test_the_two_registries_are_identical():
    agent = {name: asdict(p) for name, p in agent_profiles.PROFILES.items()}
    plugin = {name: asdict(p) for name, p in plugin_profiles.PROFILES.items()}
    assert agent == plugin


def test_the_default_profile_matches():
    assert agent_profiles.DEFAULT_PROFILE == plugin_profiles.DEFAULT_PROFILE


def test_release_keeps_the_historical_unsuffixed_config():
    # An existing install's discovery file and settings live in the unsuffixed
    # config dir; changing release's suffix would orphan them.
    assert agent_profiles.PROFILES["release"].config_suffix == ""


def test_ports_are_distinct_so_dev_and_release_do_not_fight():
    ports = [p.preferred_port for p in agent_profiles.PROFILES.values()]
    assert len(ports) == len(set(ports))


def test_install_names_are_distinct_so_kicad_shows_both():
    names = [p.install_name for p in agent_profiles.PROFILES.values()]
    assert len(names) == len(set(names))


def test_an_unknown_profile_falls_back_to_the_default():
    resolved = agent_profiles.resolve("does-not-exist")
    assert resolved.name == agent_profiles.DEFAULT_PROFILE
