"""Structural validation (``docs/system-builder/CONTRACTS.md`` §7.2, §7.3).

``validate`` is a pure function over the live state at the current
baselines: instances, links with rows, each instance's baseline interface
(``None`` when not extracted), its port overrides, and open reviews. It
returns deterministic findings. A rule that cannot run for an instance is
reported under ``notEvaluated`` with a reason; it is never reported as
passing.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Collection, Mapping, Optional, Sequence

from app.services.systems import exposure
from app.services.systems.drift import pad_sort_key

RULES = {
    "SYS-V01": ("row_duplicate", "error"),
    "SYS-V02": ("pin_fanout", "warning"),
    "SYS-V03": ("port_not_exposed", "error"),
    "SYS-V04": ("pin_absent", "error"),
    "SYS-V05": ("source_unavailable", "error"),
    "SYS-V06": ("pcb_out_of_sync", "warning"),
    "SYS-V07": ("pin_net_ambiguous", "warning"),
    "SYS-V08": ("open_review", "info"),
    # CONTRACTS_P2 §8.4. V09-V15 arrive with their tickets.
    "SYS-V09": ("net_name_mismatch", "warning"),
    "SYS-V10": ("power_meets_signal", "error"),
    "SYS-V11": ("mate_mismatch", "warning"),
    "SYS-V14": ("child_revision_unreleased", "warning"),
    "SYS-V15": ("child_advance_blocked", "warning"),
    "SYS-V16": ("export_unresolved", "error"),
    "SYS-V17": ("mating_stale", "info"),
    "SYS-V18": ("mate_pair_unknown", "warning"),
    "SYS-V19": ("mate_pin_mismatch", "error"),
}
# Opt-in per system (``system_projects.optional_rules``, CONTRACTS_P2 §8.4): off unless enabled.
OPTIONAL_RULES = frozenset({"SYS-V09"})
_SEVERITY_ORDER = {"error": 0, "warning": 1, "info": 2}
# Rules that need an instance's baseline interface.
_INTERFACE_RULES = ("SYS-V03", "SYS-V04", "SYS-V06", "SYS-V07")


def _finding(rule: str, *, instance_id: Optional[str] = None, link_id: Optional[str] = None,
             row_id: Optional[str] = None, end: Optional[str] = None, reference: Optional[str] = None,
             pin: Optional[str] = None, detail: Mapping[str, Any] | None = None) -> dict:
    name, severity = RULES[rule]
    return {"rule": rule, "name": name, "severity": severity, "instanceId": instance_id,
            "linkId": link_id, "rowId": row_id, "end": end, "reference": reference, "pin": pin,
            "detail": dict(detail or {})}


def make_finding(rule: str, **fields: Any) -> dict:
    """``_finding`` for rule modules outside this file (harnesses, CONTRACTS_P2 §17.2)."""
    return _finding(rule, **fields)


def _sort_key(finding: Mapping[str, Any]) -> tuple:
    return (_SEVERITY_ORDER[finding["severity"]], finding["rule"], finding["linkId"] or "",
            finding["rowId"] or "", finding["end"] or "", finding["instanceId"] or "",
            pad_sort_key(finding["pin"] or ""))


def validate(
    instances: Sequence[Mapping[str, Any]],
    links: Sequence[Mapping[str, Any]],
    interfaces: Mapping[str, Optional[Mapping[str, Any]]],
    overrides: Mapping[str, Mapping[str, str]],
    open_reviews: Sequence[Mapping[str, Any]] = (),
    *,
    unavailable: Mapping[str, str] | None = None,
    exports: Sequence[Mapping[str, Any]] = (),
    optional_rules: Collection[str] = (),
) -> dict:
    """Findings for one system.

    ``optional_rules`` names the opt-in rules (``OPTIONAL_RULES``) this system
    enabled; the others in that set do not run.
    ``interfaces[instance_id]`` is the artifact at that instance's baseline or
    ``None``; ``unavailable[instance_id]`` gives a reason the source cannot be
    read (unresolved project, failed extraction). Pending extraction is
    neither: it only makes the interface rules ``not_evaluated``.
    """

    unavailable = dict(unavailable or {})
    findings: list[dict] = []
    not_evaluated: list[dict] = []
    exempt: list[dict] = []
    by_id = {i["id"]: i for i in instances}

    # SYS-V05, and which instances the interface rules can run on.
    evaluable: dict[str, Mapping[str, Any]] = {}
    for instance in instances:
        iid = instance["id"]
        reason = unavailable.get(iid)
        if instance.get("resolution") == "unresolved":
            reason = reason or "instance is unresolved"
        if reason:
            findings.append(_finding("SYS-V05", instance_id=iid, detail={"reason": reason}))
        interface = interfaces.get(iid)
        if interface is None:
            for rule in _INTERFACE_RULES:
                not_evaluated.append({"rule": rule, "instanceId": iid,
                                      "reason": reason or "interface not extracted yet"})
            continue
        evaluable[iid] = interface
        if not interface.get("hasPcb"):
            not_evaluated.append({"rule": "SYS-V06", "instanceId": iid, "reason": "hasPcb false"})

    # SYS-V01: duplicates that bypassed the write-time check (legacy imports).
    for link in links:
        seen: dict[tuple[str, str], str] = {}
        for row in sorted(link["rows"], key=lambda r: r["id"]):
            key = (row["pin_a"], row["pin_b"])
            if key in seen:
                findings.append(_finding("SYS-V01", link_id=link["id"], row_id=row["id"],
                                         detail={"duplicateOf": seen[key]}))
            else:
                seen[key] = row["id"]

    # SYS-V02: one (instance, port, pin) used by rows of several links.
    uses: dict[tuple[str, str, str], list[tuple[str, Optional[str], str, str]]] = defaultdict(list)
    references: dict[tuple[str, str], str] = {}
    for link in links:
        for end in ("a", "b"):
            port = link[f"{end}_port"]
            references[(link[f"{end}_instance_id"], port["portKey"])] = port.get("reference")
            for row in link["rows"]:
                uses[(link[f"{end}_instance_id"], port["portKey"], row[f"pin_{end}"])].append(
                    (link["id"], link.get("harness"), row["id"], end))
    for (iid, port_key, pin), entries in sorted(uses.items()):
        link_ids = sorted({e[0] for e in entries})
        if len(link_ids) < 2:
            continue
        reference = references[(iid, port_key)]
        harnesses = {e[1] for e in entries}
        record = {"instanceId": iid, "portKey": port_key, "reference": reference, "pin": pin,
                  "links": link_ids}
        if len(harnesses) == 1 and None not in harnesses:
            exempt.append({"rule": "SYS-V02", **record, "harness": next(iter(harnesses))})
            continue
        for link_id, _harness, row_id, end in sorted(entries):
            findings.append(_finding("SYS-V02", instance_id=iid, link_id=link_id, row_id=row_id,
                                     end=end, reference=reference, pin=pin,
                                     detail={"links": link_ids}))

    # SYS-V03, V04, V06, V07: per link end against the baseline interface.
    for link in links:
        for end in ("a", "b"):
            iid = link[f"{end}_instance_id"]
            interface = evaluable.get(iid)
            if interface is None:
                continue
            port = link[f"{end}_port"]
            component = exposure.component_by_key(interface, port["portKey"])
            if component is None or not exposure.is_exposed(
                component, (overrides.get(iid) or {}).get(component["portKey"])
            ):
                findings.append(_finding("SYS-V03", instance_id=iid, link_id=link["id"], end=end,
                                         reference=port.get("reference"),
                                         detail={"portKey": port["portKey"],
                                                 "present": component is not None}))
            pins = exposure.pins_by_pad(component) if component else {}
            for row in link["rows"]:
                pad = row[f"pin_{end}"]
                common = {"instance_id": iid, "link_id": link["id"], "row_id": row["id"], "end": end,
                          "reference": port.get("reference"), "pin": pad}
                if component is not None and pad not in pins:
                    findings.append(_finding("SYS-V04", **common))
                    continue
                pin = pins.get(pad)
                if pin is None:
                    continue
                nets = sorted(pin.get("nets") or [])
                if len(nets) > 1:
                    findings.append(_finding("SYS-V07", **common, detail={"nets": nets}))
                if interface.get("hasPcb"):
                    pcb = pin.get("pcbNets")
                    if pcb is None or sorted(pcb) != nets:
                        findings.append(_finding("SYS-V06", **common,
                                                 detail={"schematic": nets, "pcb": pcb}))

    # SYS-V09 / V10: each join (row) of this system's own links (CONTRACTS_P2 §8.4).
    from app.services.systems import system_nets

    for link in links:
        pins = {}
        for end in ("a", "b"):
            interface = interfaces.get(link[f"{end}_instance_id"])
            port_key = (link.get(f"{end}_port") or {}).get("portKey")
            component = exposure.component_by_key(interface, port_key) if interface and port_key else None
            pins[end] = exposure.pins_by_pad(component) if component else None
        for row in link.get("rows") or []:
            net_a, net_b = list(row.get("net_a") or []), list(row.get("net_b") or [])
            if "SYS-V09" in optional_rules and system_nets.name_mismatch(net_a, net_b):
                findings.append(_finding("SYS-V09", link_id=link["id"], row_id=row["id"],
                                         detail={"netA": net_a, "netB": net_b}))
            if pins["a"] is None or pins["b"] is None:
                continue
            power_a = (pins["a"].get(str(row["pin_a"])) or {}).get("powerNet")
            power_b = (pins["b"].get(str(row["pin_b"])) or {}).get("powerNet")
            if system_nets.power_meets_signal(power_a, net_a, power_b, net_b):
                findings.append(_finding("SYS-V10", link_id=link["id"], row_id=row["id"],
                                         detail={"powerSide": "a" if power_a else "b", "netA": net_a, "netB": net_b}))

    # SYS-V16: exports that no longer resolve or are no longer exposed.
    from app.services.systems import exports as exports_module

    unevaluated = {iid for iid in by_id if iid not in evaluable}
    for problem in exports_module.findings(exports, interfaces, overrides, unevaluated):
        findings.append(_finding("SYS-V16", instance_id=problem["instanceId"], reference=problem["reference"],
                                 detail={"exportId": problem["exportId"], "name": problem["name"],
                                         "reason": problem["reason"]}))

    # SYS-V08.
    for review in open_reviews:
        if review.get("instance_id") in by_id:
            findings.append(_finding("SYS-V08", instance_id=review["instance_id"],
                                     detail={"reviewId": review["id"], "kind": review["kind"]}))

    findings.sort(key=_sort_key)
    not_evaluated.sort(key=lambda n: (n["rule"], n["instanceId"]))
    exempt.sort(key=lambda e: (e["rule"], e["instanceId"], pad_sort_key(e["pin"])))
    counts = {"error": 0, "warning": 0, "info": 0}
    for finding in findings:
        counts[finding["severity"]] += 1
    counts["notEvaluated"] = len(not_evaluated)
    return {"findings": findings, "notEvaluated": not_evaluated, "exempt": exempt, "counts": counts}


def child_findings(children: Sequence[Mapping[str, Any]]) -> list[dict]:
    """SYS-V14 and V15 for assembly/module instances (CONTRACTS_P2 §8.4).

    Each child is ``{instanceId, releaseStatus, openReviewCount, blocked}``.
    """

    out = []
    for child in children:
        if child.get("releaseStatus") not in (None, "released"):
            out.append(_finding("SYS-V14", instance_id=child["instanceId"],
                                detail={"reason": "unreleased", "releaseStatus": child["releaseStatus"]}))
        elif int(child.get("openReviewCount") or 0) > 0:
            out.append(_finding("SYS-V14", instance_id=child["instanceId"],
                                detail={"reason": "open_reviews", "openReviewCount": child["openReviewCount"]}))
        if child.get("blocked"):
            out.append(_finding("SYS-V15", instance_id=child["instanceId"], detail={}))
    return out


def with_findings(report: Mapping[str, Any], extra: Sequence[Mapping[str, Any]]) -> dict:
    """``report`` with ``extra`` findings merged, sorted and counted."""
    findings = sorted([*report["findings"], *extra], key=_sort_key)
    counts = {"error": 0, "warning": 0, "info": 0}
    for finding in findings:
        counts[finding["severity"]] += 1
    counts["notEvaluated"] = report["counts"]["notEvaluated"]
    return {**report, "findings": findings, "counts": counts}


def mate_mismatch_findings(mismatches: Sequence[Mapping[str, Any]]) -> list[dict]:
    """SYS-V11 (CONTRACTS_P2 §14.9): a B2B mate that does not line up where the driving mates put its boards."""
    return [_finding("SYS-V11", link_id=item["linkId"],
                     detail={k: item[k] for k in ("offsetMm", "lateralMm", "axialMm", "angleDeg")})
            for item in mismatches]


def mating_findings(stale: Sequence[Mapping[str, Any]]) -> list[dict]:
    """SYS-V17 (CONTRACTS_P2 §15.2): a stored frame whose port geometry changed since it was confirmed."""
    return [_finding("SYS-V17", instance_id=item["instanceId"], reference=item["reference"],
                     detail={"portKey": item["portKey"], "mode": item["mode"]}) for item in stale]
