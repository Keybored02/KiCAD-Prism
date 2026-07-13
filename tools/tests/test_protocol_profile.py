"""The prism:// handler must read the same settings as the agent that registered it.

The bug, found in the wild: a dev agent (PRISM_PROFILE=dev) registered a command with no
profile in it. The OS launches that handler as a fresh process carrying NONE of our
environment, so it fell back to the default profile and read a different settings file:
different server, no projects roots. The user added project folders in the plugin, saw
them saved, then got "no projects folder is set" when opening a commit.

The profile is part of *which agent this is*. It belongs in the registered command, not
in an environment we do not control at the moment the OS invokes us.
"""

import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import protocol  # noqa: E402

TOOLS = str(Path(__file__).resolve().parent.parent)


def test_a_profiled_agent_bakes_its_profile_into_the_command(monkeypatch):
    monkeypatch.setenv("PRISM_PROFILE", "dev")
    bootstrap = protocol._launch_command()[2]
    assert "PRISM_PROFILE" in bootstrap
    assert "'dev'" in bootstrap


def test_an_unprofiled_agent_does_not(monkeypatch):
    """The installed agent has no profile, and injecting an empty one would be noise."""
    monkeypatch.setenv("PRISM_PROFILE", "")
    bootstrap = protocol._launch_command()[2]
    assert "PRISM_PROFILE" not in bootstrap


@pytest.mark.parametrize("profile", ["", "dev"])
def test_the_handler_resolves_the_registering_agents_config(profile, monkeypatch):
    """The one that actually matters. Run the registered bootstrap the way the OS does:
    a fresh process with NONE of our environment. It must land on the same config dir as
    the agent that wrote the command."""
    monkeypatch.setenv("PRISM_PROFILE", profile)
    bootstrap = protocol._launch_command()[2]

    probe = bootstrap.replace(
        "from prism_agent.__main__ import main; sys.exit(main())",
        "from prism_agent import discovery; print(discovery.config_dir().name)",
    )
    # No PRISM_PROFILE in the environment: this is exactly how Windows/Linux launch it.
    result = subprocess.run(
        [sys.executable, "-c", probe],
        capture_output=True,
        text=True,
        check=True,
        env={"PATH": "", "SYSTEMROOT": "C:\\Windows", "APPDATA": TOOLS},
    )
    expected = f"kicad-prism-{profile}" if profile else "kicad-prism"
    assert result.stdout.strip() == expected


def test_the_bootstrap_sets_the_profile_before_importing_us(monkeypatch):
    """Order matters: discovery.PROFILE is captured at import time, so the environment
    has to be set BEFORE prism_agent is imported or the profile is read too late."""
    monkeypatch.setenv("PRISM_PROFILE", "dev")
    bootstrap = protocol._launch_command()[2]

    set_env = bootstrap.index("PRISM_PROFILE")
    do_import = bootstrap.index("from prism_agent")
    assert set_env < do_import


# -- noticing a registration that has gone stale ---------------------------


def test_a_registration_from_a_different_profile_is_stale(monkeypatch):
    """The bug. is_registered() said yes, because the key existed and looked fine, so
    nothing ever rewrote it and the handler kept reading the wrong settings file."""
    monkeypatch.setattr(protocol, "is_registered", lambda: True)
    # What an agent with NO profile wrote.
    monkeypatch.setenv("PRISM_PROFILE", "")
    stored = " ".join(f'"{p}"' for p in protocol._launch_command()) + ' "%1"'
    monkeypatch.setattr(protocol, "registered_command", lambda: stored)

    # We are now the dev agent. The stored command is not ours.
    monkeypatch.setenv("PRISM_PROFILE", "dev")
    assert protocol.is_stale() is True


def test_our_own_registration_is_not_stale(monkeypatch):
    """Idempotence. Without this the agent rewrites the registry on every single boot."""
    monkeypatch.setattr(protocol, "is_registered", lambda: True)
    monkeypatch.setenv("PRISM_PROFILE", "dev")
    stored = " ".join(f'"{p}"' for p in protocol._launch_command()) + ' "%1"'
    monkeypatch.setattr(protocol, "registered_command", lambda: stored)

    assert protocol.is_stale() is False


@pytest.mark.skipif(
    sys.platform != "win32", reason="drive-letter casing is a Windows thing"
)
def test_a_difference_in_drive_letter_case_is_not_stale(monkeypatch):
    """sys.executable reports 'c:\\...' while the registry holds 'C:\\...'. That means
    nothing, and treating it as a difference would rewrite the registry forever."""
    monkeypatch.setattr(protocol, "is_registered", lambda: True)
    monkeypatch.setenv("PRISM_PROFILE", "dev")
    stored = " ".join(f'"{p}"' for p in protocol._launch_command()) + ' "%1"'
    monkeypatch.setattr(protocol, "registered_command", lambda: stored.upper())

    assert protocol.is_stale() is False


def test_an_unregistered_scheme_is_not_stale(monkeypatch):
    """Absent is 'off', not 'stale'. This must never claim the scheme uninvited."""
    monkeypatch.setattr(protocol, "is_registered", lambda: False)
    assert protocol.is_stale() is False


def test_a_command_we_cannot_read_back_is_not_stale(monkeypatch):
    """On a platform where we cannot read the registration, do not guess and do not
    rewrite: a wrong guess would clobber a working handler."""
    monkeypatch.setattr(protocol, "is_registered", lambda: True)
    monkeypatch.setattr(protocol, "registered_command", lambda: "")
    assert protocol.is_stale() is False


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
