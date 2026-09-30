"""Test configuration for the agent and plugin suites.

The merge-engine tests drive the real thing: a 100 KB board, parsed and three-way
merged for each case. That is the work being tested, so it cannot be mocked or cached
away, but it is around twenty seconds a test and roughly six of the seven minutes the
full suite takes. Paying that on every run while editing the plugin's UI is what made
the suite something to avoid rather than something to lean on.

So `slow` tests are skipped by default and run on request:

    python -m pytest tools/tests              # fast, seconds
    python -m pytest tools/tests --slow       # everything
    python -m pytest tools/tests -m slow --slow   # only the slow ones

CI passes --slow, so nothing is quietly dropped from the gate: see the agent-plugin
job in .github/workflows/dev-quality-gate.yml.
"""

from __future__ import annotations

import pytest

# Suites whose cost is the real engine rather than the test harness. Named here rather
# than marked file by file so the list is visible in one place.
SLOW_MODULES = ("test_merge_session",)


def pytest_addoption(parser):
    parser.addoption(
        "--slow",
        action="store_true",
        default=False,
        help="run the slow merge-engine tests as well as the fast suite",
    )


def pytest_configure(config):
    config.addinivalue_line(
        "markers", "slow: exercises the real merge engine on a full board"
    )


def pytest_collection_modifyitems(config, items):
    """Mark the slow modules, and skip them unless --slow was given."""
    for item in items:
        if item.module.__name__.rsplit(".", 1)[-1] in SLOW_MODULES:
            item.add_marker(pytest.mark.slow)

    if config.getoption("--slow"):
        return

    skip = pytest.mark.skip(reason="slow; run with --slow")
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(skip)
