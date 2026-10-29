"""Accounts: the credentials a provider knows Prism by.

Two connectors on the same credentials (two TME storefronts, two DigiKey sites) are one account to the provider, so
they share its daily budget, its pacing and its job slot. An account is recognised by a keyed hash of the provider and
its credentials; the credentials themselves are never kept in the clear. A connector with no credentials is its own
account.

The account's ledger, budget, reserve and reset time are those of its first connector (oldest, then by id).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from app.services.supply import quota
from app.services.trackers.secrets import CredentialKeyring

PURPOSE = "supply.account"


@dataclass(frozen=True, slots=True)
class Account:
    ledger_id: str
    daily_budget: int
    reserve_pct: int
    reset_time: str
    reset_tz: str
    members: tuple[str, ...]

    @property
    def shared(self) -> bool:
        return len(self.members) > 1


def key_for(keyring: CredentialKeyring, provider: str, credentials: Mapping[str, str]) -> str:
    """The account key of these credentials, or empty when there are none."""

    if not credentials:
        return ""
    text = provider + "\0" + "\0".join(f"{name}={credentials[name]}" for name in sorted(credentials))
    return keyring.fingerprint(text, PURPOSE)


def pace_key(account_key: str, provider: str) -> str:
    """What connectors share the pacing of: an account, or, with no credentials, the provider (limits are per address)."""

    return account_key or f"provider:{provider}"


def resolve(conn, connector_id: str) -> Account:
    """The account a connector belongs to. An unknown connector is an account of its own with no budget."""

    row = conn.execute(
        "SELECT id, account_key, daily_budget, interactive_reserve_pct, reset_time, reset_tz FROM supply_connectors WHERE id = %s",
        (connector_id,),
    ).fetchone()
    if row is None:
        return Account(connector_id, 0, 10, quota.DEFAULT_RESET_TIME, quota.DEFAULT_RESET_TZ, (connector_id,))
    members = [connector_id]
    if row["account_key"]:
        members = [
            item["id"] for item in conn.execute(
                "SELECT id FROM supply_connectors WHERE account_key = %s ORDER BY created_at, id", (row["account_key"],)
            ).fetchall()
        ]
        if members[0] != connector_id:
            row = conn.execute(
                "SELECT id, daily_budget, interactive_reserve_pct, reset_time, reset_tz FROM supply_connectors WHERE id = %s",
                (members[0],),
            ).fetchone()
    return Account(
        row["id"], int(row["daily_budget"]), int(row["interactive_reserve_pct"]), row["reset_time"], row["reset_tz"], tuple(members)
    )
