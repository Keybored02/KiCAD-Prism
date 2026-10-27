"""Waivers: accepting a finding on a part.

Someone who writes supply data proposes a waiver with a reason; someone who approves (admin, qa)
accepts or rejects it, and an approver who proposes one approves it in the same step. A waiver is
tied to the condition it was raised against, so it stops holding when the part changes enough that
the finding means something else; it is then shown for another look, not silently kept.

Every change is audited.
"""

from __future__ import annotations

import dataclasses
import uuid
from typing import Any, Iterable, Mapping, Sequence

from app.services.supply.assessment.checks import Finding
from app.services.supply.audit import actor_text, write_audit

PROPOSED, APPROVED, REJECTED = "proposed", "approved", "rejected"
MAX_REASON = 500


class WaiverNotFound(KeyError):
    """No waiver with this id."""


class WaiverError(ValueError):
    """The change does not apply. The message is safe to show."""


def for_parts(conn, part_ids: Sequence[str]) -> dict[str, list[dict[str, Any]]]:
    """Every open or approved waiver of these parts, by part."""

    found: dict[str, list[dict[str, Any]]] = {}
    if not part_ids:
        return found
    for row in conn.execute(
        "SELECT id, part_id, check_id, scope, reason, state, proposed_by, decided_by FROM supply_waivers "
        "WHERE part_id = ANY(%s) AND state <> 'rejected'",
        (list(part_ids),),
    ).fetchall():
        found.setdefault(row["part_id"], []).append(dict(row))
    return found


def apply(findings: Iterable[Finding], waivers: Iterable[Mapping[str, Any]]) -> list[Finding]:
    """Attach each finding's waiver. ``holds`` is true only for an approved waiver of the same condition."""

    by_check = {w["check_id"]: w for w in waivers}
    result = []
    for finding in findings:
        waiver = by_check.get(finding.check)
        if waiver is None:
            result.append(finding)
            continue
        same = waiver["scope"] == finding.scope
        result.append(dataclasses.replace(finding, waiver={
            "id": waiver["id"],
            "state": waiver["state"],
            "reason": waiver["reason"],
            "proposed_by": waiver["proposed_by"],
            "decided_by": waiver["decided_by"],
            "holds": waiver["state"] == APPROVED and same,
            # Approved for a condition the part no longer has: needs another look.
            "outdated": waiver["state"] == APPROVED and not same,
        }))
    return result


def _row(conn, waiver_id: str):
    row = conn.execute("SELECT * FROM supply_waivers WHERE id = %s FOR UPDATE", (waiver_id,)).fetchone()
    if row is None:
        raise WaiverNotFound(waiver_id)
    return row


def propose(conn, part_id: str, finding: Finding | None, reason: str, actor: str, *, approver: bool) -> dict[str, str]:
    """Raise a waiver for a finding the part has now. ``finding`` is None when it has none."""

    actor = actor_text(actor)
    reason = reason.strip()
    if not reason:
        raise WaiverError("Say why this is acceptable.")
    if len(reason) > MAX_REASON:
        raise WaiverError(f"Keep the reason under {MAX_REASON} characters.")
    if finding is None:
        raise WaiverError("The part has no such finding to waive.")
    existing = conn.execute(
        "SELECT id, scope, state FROM supply_waivers WHERE part_id = %s AND check_id = %s AND state <> 'rejected' FOR UPDATE",
        (part_id, finding.check),
    ).fetchone()
    if existing is not None:
        if existing["state"] == APPROVED and existing["scope"] != finding.scope:
            # The old approval is for a different condition; this replaces it.
            conn.execute("DELETE FROM supply_waivers WHERE id = %s", (existing["id"],))
            write_audit(conn, actor, "waiver.replace", existing["id"], {"part_id": part_id, "check": finding.check}, subject_kind="waiver")
        else:
            raise WaiverError("This finding already has a waiver.")
    waiver_id = uuid.uuid4().hex
    state = APPROVED if approver else PROPOSED
    conn.execute(
        """
        INSERT INTO supply_waivers (id, part_id, check_id, scope, reason, state, proposed_by, decided_by, decided_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CASE WHEN %s THEN NOW() END)
        """,
        (waiver_id, part_id, finding.check, finding.scope, reason, state, actor, actor if approver else "", approver),
    )
    write_audit(conn, actor, "waiver.propose", waiver_id,
                {"part_id": part_id, "check": finding.check, "scope": finding.scope, "state": state}, subject_kind="waiver")
    return {"id": waiver_id, "state": state}


def decide(conn, waiver_id: str, actor: str, *, approve: bool) -> None:
    actor = actor_text(actor)
    row = _row(conn, waiver_id)
    if row["state"] != PROPOSED:
        raise WaiverError("Only a waiver that is waiting can be decided.")
    state = APPROVED if approve else REJECTED
    conn.execute("UPDATE supply_waivers SET state = %s, decided_by = %s, decided_at = NOW() WHERE id = %s", (state, actor, waiver_id))
    write_audit(conn, actor, "waiver.approve" if approve else "waiver.reject", waiver_id,
                {"part_id": row["part_id"], "check": row["check_id"]}, subject_kind="waiver")


def revoke(conn, waiver_id: str, actor: str, *, approver: bool) -> None:
    """Withdraw a waiver. Its proposer may do it while it waits; an approver may do it any time."""

    actor = actor_text(actor)
    row = _row(conn, waiver_id)
    if not approver and (row["state"] != PROPOSED or row["proposed_by"] != actor):
        raise WaiverError("Only an approver can revoke a waiver that is approved or was raised by someone else.")
    conn.execute("DELETE FROM supply_waivers WHERE id = %s", (waiver_id,))
    write_audit(conn, actor, "waiver.revoke", waiver_id,
                {"part_id": row["part_id"], "check": row["check_id"], "was": row["state"]}, subject_kind="waiver")
