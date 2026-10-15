"""Spacing calls to a provider the way a careful client does.

A provider's limits are a ceiling, and evenly spaced calls at the ceiling look like a script. A ``Pacer`` waits a
random gap between calls, 0.75 to 1.5 times its target, and the target is about half the published per-minute rate.
After a rate limit it doubles its gaps for a day.

One pacer belongs to an account (``accounts.py``), not a connector: connectors on the same credentials share it, so they
never call at the same moment. The registry is per process; the worker runs one job per account at a time.
"""

from __future__ import annotations

import random
import threading
import time
from typing import Callable

JITTER_LOW = 0.75
JITTER_HIGH = 1.5
SLOW_FACTOR = 2.0
SLOW_FOR_SECONDS = 86400.0


class Pacer:
    def __init__(
        self,
        target_seconds: float,
        *,
        monotonic: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
        rng: Callable[[], float] = random.random,
    ) -> None:
        if target_seconds < 0:
            raise ValueError("the target gap must not be negative")
        self.target = target_seconds
        self._monotonic = monotonic
        self._sleep = sleep
        self._rng = rng
        self._next_at: float | None = None
        self._slow_until = 0.0
        self._lock = threading.Lock()

    @property
    def slowed(self) -> bool:
        return self._monotonic() < self._slow_until

    def slow_down(self, seconds: float = SLOW_FOR_SECONDS) -> None:
        """Double the gaps for a while, after the provider turned a call away."""

        self._slow_until = max(self._slow_until, self._monotonic() + seconds)

    def _gap(self) -> float:
        factor = SLOW_FACTOR if self.slowed else 1.0
        return self.target * factor * (JITTER_LOW + (JITTER_HIGH - JITTER_LOW) * self._rng())

    def wait(self) -> None:
        """Block until the next call may be made, then reserve the gap after it."""

        with self._lock:
            now = self._monotonic()
            if self._next_at is not None and self._next_at > now:
                self._sleep(self._next_at - now)
                now = self._next_at
            self._next_at = now + self._gap()


_registry: dict[str, Pacer] = {}
_registry_lock = threading.Lock()


def pacer_for(
    account: str,
    target_seconds: float,
    *,
    monotonic: Callable[[], float] = time.monotonic,
    sleep: Callable[[float], None] = time.sleep,
) -> Pacer:
    """The pacer of an account, shared by every provider object built for it. With no account, one of its own."""

    if not account:
        return Pacer(target_seconds, monotonic=monotonic, sleep=sleep)
    with _registry_lock:
        pacer = _registry.get(account)
        if pacer is None or pacer.target != target_seconds:
            pacer = _registry[account] = Pacer(target_seconds, monotonic=monotonic, sleep=sleep)
        return pacer


def slow_down(account: str) -> None:
    """Slow an account's pacing for a day. A no-op for an account with no pacer yet."""

    with _registry_lock:
        pacer = _registry.get(account)
    if pacer is not None:
        pacer.slow_down()
