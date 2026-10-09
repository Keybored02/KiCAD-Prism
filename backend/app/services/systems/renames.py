"""Net rename proposals (SB2-106, CONTRACTS_P2 §23): pure helpers.

A proposal asks one board to rename one of its nets. These helpers find the rows it covers, tell
whether a drift item is that rename arriving, and whether a board's rows show it applied.
"""

from __future__ import annotations

import re
from typing import Any, Iterable, Mapping, Optional, Sequence

NAME = re.compile(r"^[^/\s]{1,100}$")


def leaf(net: str) -> str:
    """A net's last path segment: ``/Payload/SPI_SCK`` → ``SPI_SCK``."""
    return net.rsplit("/", 1)[-1]


def check_name(net: str, name: str) -> Optional[str]:
    """Why ``name`` cannot be proposed for ``net``, or None."""
    if not isinstance(name, str) or not NAME.match(name):
        return "invalid_name: a net name is 1–100 characters with no '/' or whitespace"
    if leaf(net) == name:
        return f"invalid_name: {net} is already named {name}"
    return None


def board_rows(links: Iterable[Mapping[str, Any]], instance_id: str) -> Iterable[tuple[str, str, Mapping[str, Any]]]:
    """``(link_id, end, row)`` for every row (or harness wire, via drift links) with an end on the board."""
    for link in links:
        for end in ("a", "b"):
            if link.get(f"{end}_instance_id") == instance_id:
                for row in link.get("rows") or ():
                    yield link["id"], end, row


def covered(links: Iterable[Mapping[str, Any]], instance_id: str, net: str) -> list[tuple[str, str]]:
    """``(link_id, row_id)`` of the rows whose end on the board carries ``net`` (§23.1)."""
    return [(link_id, row["id"]) for link_id, end, row in board_rows(links, instance_id)
            if net in (row.get(f"net_{end}") or ())]


def is_applied(links: Iterable[Mapping[str, Any]], instance_id: str, proposal: Mapping[str, Any]) -> bool:
    """§23.3: no row on the board still carries the old net, and one carries the new name."""
    nets = [n for _link, end, row in board_rows(list(links), instance_id) for n in row.get(f"net_{end}") or ()]
    return proposal["net"] not in nets and any(leaf(n) == proposal["name"] for n in nets)


def match(item: Any, proposals: Sequence[Mapping[str, Any]]) -> Optional[Mapping[str, Any]]:
    """The open proposal a drift item is the arrival of: a ``net_changed`` from exactly ``[net]``
    to one net named ``name`` (§23.3)."""
    if getattr(item, "kind", None) != "net_changed":
        return None
    expected, observed = list(item.expected or ()), list(item.observed or ())
    if len(expected) != 1 or len(observed) != 1:
        return None
    return next((p for p in proposals if p["net"] == expected[0] and leaf(observed[0]) == p["name"]), None)


def annotate(findings: Sequence[dict], links: Sequence[Mapping[str, Any]],
             proposals: Sequence[Mapping[str, Any]]) -> list[dict]:
    """SYS-V09 findings whose row carries a net with an open proposal gain ``detail.rename`` (§23.4)."""
    if not proposals:
        return list(findings)
    by_net = {(p["instance_id"], p["net"]): p for p in proposals}
    rows = {(link["id"], row["id"]): (link, row) for link in links for row in link.get("rows") or ()}
    out = []
    for finding in findings:
        found = rows.get((finding.get("linkId"), finding.get("rowId"))) if finding["rule"] == "SYS-V09" else None
        proposal = None
        if found:
            link, row = found
            proposal = next((by_net[(link[f"{end}_instance_id"], net)] for end in ("a", "b")
                             for net in row.get(f"net_{end}") or ()
                             if (link[f"{end}_instance_id"], net) in by_net), None)
        if proposal:
            finding = {**finding, "detail": {**(finding.get("detail") or {}), "rename": {
                "id": proposal["id"], "instanceId": proposal["instance_id"], "name": proposal["name"]}}}
        out.append(finding)
    return out
