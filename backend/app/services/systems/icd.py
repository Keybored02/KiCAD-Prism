"""ICD rendering and snapshot diffs (``docs/system-builder/CONTRACTS.md`` §9).

Everything here reads a system document (live or frozen) that has already
been redacted for its reader, so a restricted board can never leak through
an export. The renderers are deterministic for a given document and
generation time.
"""

from __future__ import annotations

import csv
import html
import io
import re
from datetime import datetime, timezone
from typing import Any, Mapping, Optional, Sequence

from app.services.systems import layout as system_layout
from app.services.systems.drift import pad_sort_key

RENDERER_VERSION = "5"  # 5: waived findings listed apart (SB2-100)

CSV_COLUMNS = (
    "row_id", "link_id", "link_name", "harness", "signal",
    "a_board", "a_connector", "a_pin", "a_pin_name", "a_net",
    "b_board", "b_connector", "b_pin", "b_pin_name", "b_net",
    "status", "a_commit", "b_commit",
    # Harness wires (CONTRACTS_P2 §17.4); empty on link rows.
    "from_end", "from_end_pin", "to_end", "to_end_pin", "gauge_awg", "colour", "wire_label",
)
WIRE_COLUMNS = CSV_COLUMNS[-7:]

_ROW_ERROR_RULES = ("SYS-V01", "SYS-V04")
_END_ERROR_RULES = ("SYS-V03",)


def _join(values: Optional[list]) -> str:
    return "|".join(str(v) for v in values or [])


def _row_status(row: Mapping[str, Any], link: Mapping[str, Any], validation: Mapping[str, Any],
                review_rows: set[str]) -> str:
    """§9.2: ``error`` from error findings, ``review`` from open review items, else ``ok``."""

    for finding in validation.get("findings") or []:
        if finding["severity"] != "error" or finding["linkId"] != link["id"]:
            continue
        if finding["rule"] in _ROW_ERROR_RULES and finding["rowId"] == row["id"]:
            return "error"
        if finding["rule"] in _END_ERROR_RULES:
            return "error"
    return "review" if row["id"] in review_rows else "ok"


def _end_label(labels: Mapping[str, str], end: Mapping[str, Any]) -> str:
    """"OBC-1 J7", or for a subsystem export "CNDH-A ▸ PWR_IN → J1" (the physical connector, P2 §10)."""
    reference = (end.get("port") or {}).get("reference") or "restricted"
    if (end.get("subport") or {}).get("name"):  # P2 §22.5: "OBC-1 J6.PWR"
        reference = f"{reference}.{end['subport']['name']}"
    label = labels.get(end["instanceId"], "?")
    export = end.get("export")
    if export:
        return f"{label} ▸ {reference}" + (f" → {export['reference']}" if export.get("reference") else "")
    return f"{label} {reference}"


def csv_records(document: Mapping[str, Any]) -> list[dict[str, str]]:
    """The §9.2 export rows, in order."""

    instances = {i["id"]: i for i in document["instances"]}
    validation = document.get("validation") or {}
    review_rows = set(document.get("reviewRowIds") or [])
    records = []
    for link in sorted(document["links"], key=lambda l: (l["name"], l["id"])):
        for row in sorted(link["rows"], key=lambda r: (pad_sort_key(r["pinA"] or ""), r["id"])):
            record = {"row_id": row["id"], "link_id": link["id"], "link_name": link["name"],
                      "harness": link["harness"] or "", "signal": row["signal"]}
            for end, column in (("a", "A"), ("b", "B")):
                instance = instances[link[end]["instanceId"]]
                port = link[end]["port"] or {}
                observed = row.get(f"observed{column}") or {}
                nets = observed.get("nets") if observed.get("present") else None
                subport = (link[end].get("subport") or {}).get("name")
                record.update({
                    f"{end}_board": instance["label"],
                    # P2 §22.5: "J6.PWR" for a sub-port end; import reads it back.
                    f"{end}_connector": f"{port.get('reference') or ''}.{subport}" if subport else port.get("reference") or "",
                    f"{end}_pin": row[f"pin{column}"] or "",
                    f"{end}_pin_name": _join(observed.get("pinNames")),
                    f"{end}_net": _join(nets if nets is not None else row[f"net{column}"]),
                    f"{end}_commit": instance["baselineCommit"] or "",
                })
            record["status"] = _row_status(row, link, validation, review_rows)
            records.append({**record, **{c: "" for c in WIRE_COLUMNS}})
    return records + wire_records(document)


def end_name(end: Mapping[str, Any]) -> str:
    """Ends are named by position, as the harness editor shows them."""
    return f"End {end['ordinal'] + 1}"


def _wire_status(wire: Mapping[str, Any], harness: Mapping[str, Any], validation: Mapping[str, Any],
                 review_rows: set[str]) -> str:
    for finding in validation.get("findings") or []:
        detail = finding.get("detail") or {}
        if finding["severity"] != "error" or detail.get("harnessId") != harness["id"]:
            continue
        if detail.get("wireId") == wire["id"] or detail.get("endId") in (wire["from"]["end"], wire["to"]["end"]):
            return "error"
    return "review" if wire["id"] in review_rows else "ok"


def wire_records(document: Mapping[str, Any]) -> list[dict[str, str]]:
    """§17.4: one CSV row per harness wire. ``a_*``/``b_*`` name the connector and pad each end mates
    (empty while unmated or restricted); ``*_end_pin`` is the end pin, which a pin map may put on another pad."""

    instances = {i["id"]: i for i in document["instances"]}
    validation = document.get("validation") or {}
    review_rows = set(document.get("reviewRowIds") or [])
    records = []
    for harness in sorted(document.get("harnesses") or [], key=lambda h: (h["name"], h["id"])):
        ends = {end["id"]: end for end in harness["ends"]}
        order = sorted(harness["wires"], key=lambda w: (ends[w["from"]["end"]]["ordinal"], pad_sort_key(w["from"]["pin"]),
                                                        ends[w["to"]["end"]]["ordinal"], pad_sort_key(w["to"]["pin"]), w["id"]))
        for wire in order:
            record = {"row_id": wire["id"], "link_id": harness["id"], "link_name": harness["name"],
                      "harness": harness.get("label") or "", "signal": wire.get("signal") or "",
                      "a_pin_name": "", "b_pin_name": ""}
            for side, point, nets in (("a", wire["from"], wire.get("netFrom")), ("b", wire["to"], wire.get("netTo"))):
                end = ends[point["end"]]
                mates = end.get("mates") or {}
                port = mates.get("port") or {}
                instance = instances.get(mates.get("instanceId") or "", {})
                visible = bool(port) and not mates.get("redacted")
                record.update({
                    f"{side}_board": instance.get("label") or "" if mates else "",
                    f"{side}_connector": port.get("reference") or "" if visible else "",
                    f"{side}_pin": str((end.get("pinMap") or {}).get(point["pin"], point["pin"])) if visible else "",
                    f"{side}_net": _join(nets) if visible else "",
                    f"{side}_commit": instance.get("baselineCommit") or "" if mates else "",
                })
            gauge = wire.get("gaugeAwg")
            record.update({
                "status": _wire_status(wire, harness, validation, review_rows),
                "from_end": end_name(ends[wire["from"]["end"]]), "from_end_pin": wire["from"]["pin"],
                "to_end": end_name(ends[wire["to"]["end"]]), "to_end_pin": wire["to"]["pin"],
                "gauge_awg": "" if gauge is None else str(gauge), "colour": wire.get("colour") or "",
                "wire_label": wire.get("label") or "",
            })
            records.append(record)
    return records


def _nested_records(levels: Sequence[Mapping[str, Any]]) -> list[dict[str, str]]:
    """``?depth=all`` rows from child levels: manifest links under their occurrence path (P2 §10)."""
    records = []
    for level in levels:
        labels = level["labels"]
        for link in sorted(level["links"], key=lambda l: (l.get("name") or "", l["id"])):
            for row in sorted(link["rows"], key=lambda r: (pad_sort_key(r["pinA"]), r["id"])):
                record = {"occurrence": level["displayPath"], "row_id": row["id"], "link_id": link["id"],
                          "link_name": link.get("name") or "", "harness": link.get("harnessLabel") or "",
                          "signal": row.get("signal") or "", "status": ""}
                for end, column in (("a", "A"), ("b", "B")):
                    raw = link[end]
                    baseline = raw.get("port") or raw.get("export") or {}
                    hidden = raw["instanceId"] in level.get("restricted", ())
                    record.update({
                        f"{end}_board": labels.get(raw["instanceId"], "?"),
                        f"{end}_connector": "" if hidden else (baseline.get("reference") or baseline.get("name") or ""),
                        f"{end}_pin": row[f"pin{column}"], f"{end}_pin_name": "",
                        f"{end}_net": "" if hidden else _join(row[f"net{column}"]), f"{end}_commit": "",
                    })
                records.append(record)
    return records


def render_csv(document: Mapping[str, Any], levels: Optional[Sequence[Mapping[str, Any]]] = None) -> str:
    """§9.4 CSV. With ``levels`` (``?depth=all``) an ``occurrence`` column leads, empty for this system's own rows."""
    buffer = io.StringIO()
    columns = CSV_COLUMNS if levels is None else ("occurrence", *CSV_COLUMNS)
    writer = csv.DictWriter(buffer, fieldnames=columns, lineterminator="\r\n")
    writer.writeheader()
    own = csv_records(document)
    if levels is None:
        writer.writerows(own)
    else:
        writer.writerows([{"occurrence": "", **r} for r in own] + _nested_records(levels))
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# HTML


def _e(value: Any) -> str:
    return html.escape("" if value is None else str(value), quote=True)


# D-P2-50: the Diagram tab's kind colours (CSS variables in _STYLE, light and dark).
_KIND_LABEL = {"board": "Board", "module": "Module", "assembly": "Subsystem", "harness": "Harness"}
_KIND_CLASS = {"board": "k-board", "module": "k-module", "assembly": "k-subsystem", "harness": "k-harness"}


def _block_rows(document: Mapping[str, Any], instance: Mapping[str, Any], block: Any) -> tuple[list[tuple[str, str, bool]], int]:
    """``(rows, unlinked count)``: linked rows, then exported ports a parent links to (as the canvas shows them)."""

    rows = [(row.reference, "↔ " + ", ".join(f"{p.board_label} {p.reference or 'restricted'}" for p in row.partners), False)
            for row in block.rows]
    exported = {e["portKey"]: e["name"] for e in document.get("exports") or []
                if e.get("instanceId") == instance["id"] and e.get("portKey") is not None}
    hidden = 0
    for port in block.hidden_ports:
        if port["portKey"] in exported:
            rows.append((port["reference"], f"⇪ {exported[port['portKey']]}", True))
        else:
            hidden += 1
    return rows, hidden


def _diagram(document: Mapping[str, Any], positions: Optional[Mapping[str, Any]] = None) -> str:
    """§9.5 item 3, as the Diagram tab draws it (SB2-71): blocks by kind, harness blocks, saved positions."""

    if not document["instances"] and not document.get("harnesses"):
        return ""
    blocks, wires = system_layout.layout(document, positions)
    instances = {i["id"]: i for i in document["instances"]}
    harnesses = {h["id"]: h for h in document.get("harnesses") or []}
    end_owner = {end["id"]: h for h in harnesses.values() for end in h["ends"]}
    link_types = {link["id"]: link.get("type") for link in document["links"]}
    bw = system_layout.BOARD_WIDTH
    drawn: list[tuple[Any, float]] = []
    for block in blocks.values():
        if block.id in instances:
            rows, hidden = _block_rows(document, instances[block.id], block)
            height = system_layout.board_height(len(rows), hidden)
        else:
            height = system_layout.board_height(len(block.rows) + len(block.hidden_ports), 0)
        drawn.append((block, height))
    pad = 24
    xs = [b.x for b, _ in drawn] + [x for w in wires for x, _ in w.points]
    ys = [b.y for b, _ in drawn] + [y for w in wires for _, y in w.points]
    min_x, min_y = min(xs) - pad, min(ys) - pad
    width = max([b.x + bw for b, _ in drawn] + [x for w in wires for x, _ in w.points]) + pad - min_x
    height_total = max([b.y + h for b, h in drawn] + [y for w in wires for _, y in w.points]) + pad - min_y
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{min_x:.1f} {min_y:.1f} {width:.1f} {height_total:.1f}" '
             f'width="100%" style="max-width:{width:.0f}px" role="img" aria-label="Block diagram">']
    for wire in wires:
        points = " ".join(f"{x:.1f},{y:.1f}" for x, y in wire.points)
        kind = "w-harness" if wire.link_id in end_owner else "w-b2b" if link_types.get(wire.link_id) == "b2b" else "w-link"
        parts.append(f'<polyline points="{points}" class="wire {kind}"/>')
    for block, height in drawn:
        instance = instances.get(block.id)
        harness = harnesses.get(block.id)
        kind = "harness" if harness else (instance.get("kind") or "board")
        css = _KIND_CLASS.get(kind, "k-board")
        if harness:
            ends = len(harness["ends"])
            sub = f'{ends} end{"s" if ends != 1 else ""} · {len(harness["wires"])} wire{"s" if len(harness["wires"]) != 1 else ""}'
            by_end = {end["id"]: end for end in harness["ends"]}
            rows = []
            for end_id in [row.port_key for row in block.rows] + [port["portKey"] for port in block.hidden_ports]:
                end = by_end.get(end_id)
                if end is None:
                    continue
                mates = end.get("mates")
                partner = ("restricted" if mates.get("redacted") or not mates.get("port")
                           else f'{instances.get(mates["instanceId"], {}).get("label", "?")} {mates["port"]["reference"]}') if mates else "not mated"
                rows.append((system_layout.end_label(end), f"↔ {partner}" if mates else partner, False))
            hidden = 0
            label = harness["name"]
        else:
            rows, hidden = _block_rows(document, instance, block)
            label = instance["label"]
            catalog = instance.get("catalog") or {}
            sub = instance.get("projectName") or ("restricted" if instance.get("restricted") else "")
            if kind != "board" and catalog.get("version"):
                sub = f'{sub} · v{catalog["version"]}' if sub else f'v{catalog["version"]}'
        dash = ' stroke-dasharray="6 4"' if harness else ""
        parts.append(f'<g class="block {css}" transform="translate({block.x:.1f},{block.y:.1f})">')
        parts.append(f'<rect width="{bw}" height="{height:.1f}" rx="6" class="block-body"{dash}/>')
        parts.append(f'<path d="M0,6 a6,6 0 0 1 6,-6 h{bw - 12} a6,6 0 0 1 6,6 v{system_layout.HEADER_HEIGHT - 6} h-{bw} z" class="block-head"/>')
        parts.append(f'<text x="12" y="21" class="block-label">{_e(label)}</text>')
        parts.append(f'<text x="12" y="38" class="block-sub"><tspan class="block-kind">{_KIND_LABEL.get(kind, "Board")}</tspan>'
                     f'{" · " + _e(sub) if sub else ""}</text>')
        if not rows:
            parts.append(f'<text x="12" y="{system_layout.HEADER_HEIGHT + 17}" class="row-partner">'
                         f'{"Restricted" if instance and instance.get("restricted") else "No links yet"}</text>')
        for index, (reference, partner, exported) in enumerate(rows):
            y = system_layout.HEADER_HEIGHT + index * system_layout.ROW_HEIGHT
            if index:
                parts.append(f'<line x1="0" x2="{bw}" y1="{y}" y2="{y}" class="row-rule"/>')
            parts.append(f'<text x="12" y="{y + 17}" class="row-ref">{_e(reference)}</text>')
            parts.append(f'<text x="{bw - 12}" y="{y + 17}" class="row-partner{" row-export" if exported else ""}" '
                         f'text-anchor="end">{_e(_clip(partner, 30))}</text>')
        if hidden:
            y = system_layout.HEADER_HEIGHT + max(1, len(rows)) * system_layout.ROW_HEIGHT
            parts.append(f'<text x="{bw / 2}" y="{y + 18}" class="row-partner" text-anchor="middle">'
                         f'{hidden} unlinked port{"s" if hidden != 1 else ""}</text>')
        parts.append("</g>")
    parts.append("</svg>")
    return "".join(parts)


def _contents(page: str) -> str:
    """The section list at the top of an exported document (the workspace has its own)."""

    entries = re.findall(r'<h2 id="([^"]+)">([^<]+)</h2>', page)
    links = "".join(f'<a href="#{slug}">{label}</a>' for slug, label in entries)
    return f'<nav class="toc" aria-label="Contents">{links}</nav>' if entries else ""


def _anchor_sections(page: str) -> str:
    """Give each section heading an id (``#connections``) for links and the workspace's jump list."""

    def anchor(match: re.Match) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", html.unescape(match.group(1)).lower()).strip("-")
        return f'<h2 id="{slug}">{match.group(1)}</h2>'

    return re.sub(r"<h2>([^<]+)</h2>", anchor, page)


def _status(status: str) -> str:
    """A row's status: quiet when ok, a chip when it needs attention."""
    return '<span class="meta">ok</span>' if status == "ok" else _chip(status)


def _finding_groups(findings: Sequence[Mapping[str, Any]]) -> list[tuple[dict, list[str]]]:
    """One entry per (severity, rule, board, connector, link) with its pins, errors first."""

    groups: dict[tuple, dict] = {}
    for finding in findings:
        key = (finding["severity"], finding["rule"], finding.get("instanceId"), finding.get("reference"), finding.get("linkId"))
        entry = groups.setdefault(key, {"finding": finding, "pins": []})
        if finding.get("pin"):
            entry["pins"].append(finding["pin"])
    order = {"error": 0, "warning": 1, "info": 2}
    return [(groups[k]["finding"], sorted(groups[k]["pins"], key=pad_sort_key))
            for k in sorted(groups, key=lambda k: (order.get(k[0], 3), k[1], k[3] or ""))]


def _link_findings(findings: Sequence[Mapping[str, Any]]) -> str:
    """A connection's own findings, above its pins."""

    shown = [(f, pins) for f, pins in _finding_groups(findings) if f["severity"] != "info"]
    if not shown:
        return ""
    items = "".join(
        f'<li><span class="chip {"error" if f["severity"] == "error" else "review"}">{_e(f["rule"])}</span> '
        f'{_e(f["name"].replace("_", " "))}'
        + (f' <span class="meta">· {_e(f["reference"])}</span>' if f.get("reference") else "")
        + (f' <span class="meta mono">· pin{"s" if len(pins) != 1 else ""} {_e(", ".join(pins))}</span>' if pins else "")
        + "</li>" for f, pins in shown)
    return f'<ul class="link-findings">{items}</ul>'


def _connections_overview(document: Mapping[str, Any], ordered: Sequence[Mapping[str, Any]], labels: Mapping[str, str],
                          records: Sequence[Mapping[str, Any]], findings: Sequence[Mapping[str, Any]]) -> str:
    """Every connection on one table, each linking to its pins."""

    if not ordered:
        return '<p class="meta">No connections.</p>'
    rows = []
    for index, link in enumerate(ordered, start=1):
        ends = [_end_label(labels, link[e]) for e in ("a", "b")]
        own = [f for f in findings if f.get("linkId") == link["id"]]
        errors = sum(1 for f in own if f["severity"] == "error")
        warnings = sum(1 for f in own if f["severity"] == "warning")
        state = " ".join(part for part in (f'<span class="chip error">{errors}</span>' if errors else "",
                                           f'<span class="chip review">{warnings}</span>' if warnings else "") if part)
        kind = "Board-to-board" if link.get("type") == "b2b" else "Link"
        rows.append(f'<tr><td class="num">{index}</td><td><a href="#link-{_e(link["id"])}">{_e(link["name"] or ends[0] + " ↔ " + ends[1])}</a></td>'
                    f"<td>{kind}</td><td>{_e(ends[0])}</td><td>{_e(ends[1])}</td>"
                    f'<td class="num">{sum(1 for r in records if r["link_id"] == link["id"])}</td>'
                    f'<td>{state or "<span class=meta>ok</span>"}</td></tr>')
    return ("<table class=\"overview\"><thead><tr><th>#</th><th>Connection</th><th>Type</th><th>End A</th><th>End B</th>"
            "<th>Pins</th><th>Findings</th></tr></thead><tbody>" + "".join(rows) + "</tbody></table>")


def _finding_link(finding: Mapping[str, Any], names: Mapping[str, str], document: Mapping[str, Any]) -> str:
    link_id = finding.get("linkId")
    name = _e(names.get(link_id, "")) if link_id else ""
    if link_id and any(link["id"] == link_id for link in document["links"]):
        return f'<a href="#link-{_e(link_id)}">{name}</a>'
    return name


def _stage(stage: str) -> str:
    return f'<span class="chip {"ok" if stage == "released" else "review"}">{_e(stage.replace("_", " "))}</span>'


def _when(iso: str) -> str:
    """``2026-10-08T14:01:44+00:00`` as ``8 Oct 2026, 14:01 UTC``; anything else as given."""

    try:
        moment = datetime.fromisoformat(iso).astimezone(timezone.utc)
    except ValueError:
        return iso
    return f"{moment.day} {moment:%b %Y, %H:%M} UTC"


def _clip(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _legend(document: Mapping[str, Any]) -> str:
    kinds = [k for k in ("board", "module", "assembly") if any((i.get("kind") or "board") == k for i in document["instances"])]
    if document.get("harnesses"):
        kinds.append("harness")
    wires = [("w-b2b", "Board-to-board")] if any(link.get("type") == "b2b" for link in document["links"]) else []
    if any(end.get("mates") for h in document.get("harnesses") or [] for end in h["ends"]):
        wires.append(("w-harness", "Harness"))
    if any(link.get("type") != "b2b" for link in document["links"]):
        wires.append(("w-link", "Link"))
    items = [f'<span class="lg"><i class="sw {_KIND_CLASS[k]}"></i>{_KIND_LABEL[k]}</span>' for k in kinds]
    items += [f'<span class="lg"><svg width="18" height="6"><line x1="0" x2="18" y1="3" y2="3" class="wire {css}"/></svg>{name}</span>'
              for css, name in wires]
    return f'<div class="legend">{"".join(items)}</div>'


_STYLE = """
:root{--fg:#0f172a;--muted:#64748b;--line:#e2e8f0;--line-strong:#cbd5e1;--soft:#f8fafc;--paper:#fff;--row-alt:#fcfdfe;
--accent:#2563eb;--ok:#15803d;--ok-line:#bbf7d0;--ok-bg:#f0fdf4;--warn:#b45309;--warn-line:#fde68a;--warn-bg:#fffbeb;
--err:#b91c1c;--err-line:#fecaca;--err-bg:#fef2f2;--banner-line:#f59e0b;--banner-bg:#fffbeb;--banner-fg:#78350f;
--kind-board:#2563eb;--kind-module:#7c3aed;--kind-subsystem:#0d9488;--kind-harness:#d97706;--kind-link:#64748b;
--sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
/* D-P2-52: inside the workspace the ICD follows the app (the page adds these classes); exports stay as above. */
html.prism-dark{--fg:#f8fafc;--muted:#94a3b8;--line:#1e293b;--line-strong:#334155;--soft:#0b1426;--paper:#020817;--row-alt:#06101f;
--accent:#3b82f6;--ok:#22c55e;--ok-line:#14532d;--ok-bg:#052e16;--warn:#f59e0b;--warn-line:#78350f;--warn-bg:#1c1305;
--err:#f87171;--err-line:#7f1d1d;--err-bg:#1f0a0a;--banner-line:#f59e0b;--banner-bg:#1c1305;--banner-fg:#fcd34d;
--kind-board:#3b82f6;--kind-module:#a78bfa;--kind-subsystem:#2dd4bf;--kind-harness:#f59e0b;--kind-link:#94a3b8}
html.prism-embed{--sans:"Inter Variable",ui-sans-serif,system-ui,sans-serif}
html.prism-embed main{max-width:none;padding:24px 32px 40px}
*{box-sizing:border-box}
body{font:13px/1.5 var(--sans);color:var(--fg);margin:0;background:var(--paper)}
main{max-width:1180px;margin:0 auto;padding:32px 40px 48px}
header.doc{border-bottom:2px solid var(--fg);padding-bottom:16px;margin-bottom:8px}
.eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 4px}
h1{font-size:24px;line-height:1.25;margin:0 0 8px}
h2{font-size:16px;margin:32px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--line);scroll-margin-top:16px}
h3{font-size:14px;margin:0}
.meta{color:var(--muted);margin:0}.mono{font-family:var(--mono);font-size:12px}
.description{margin:10px 0 0;max-width:72ch}
.stats{display:flex;flex-wrap:wrap;border-top:1px solid var(--line);border-left:1px solid var(--line);margin:20px 0 0}
.stat{flex:1 1 120px;background:var(--paper);padding:10px 14px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.stat b{display:block;font-size:20px;line-height:1.2}.stat span{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.stat.err b{color:var(--err)}.stat.warn b{color:var(--warn)}
.banner{border:1px solid var(--banner-line);border-left:4px solid var(--banner-line);background:var(--banner-bg);color:var(--banner-fg);padding:8px 12px;margin:16px 0;font-weight:600}
.print-banner{display:none}
table{border-collapse:collapse;width:100%;font-size:12px}
th,td{padding:5px 8px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}
thead th{background:var(--soft);font-weight:600;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--line-strong)}
tbody tr:nth-child(even) td{background:var(--row-alt)}
td.num{white-space:nowrap}td.side-b{text-align:right}th.side-b{text-align:right}
td.sig{font-weight:600}
.chip{display:inline-block;padding:1px 7px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid}
.chip.ok{color:var(--ok);border-color:var(--ok-line);background:var(--ok-bg)}.chip.review{color:var(--warn);border-color:var(--warn-line);background:var(--warn-bg)}
.chip.error{color:var(--err);border-color:var(--err-line);background:var(--err-bg)}.chip.info{color:var(--muted);border-color:var(--line);background:var(--soft)}
.link{margin:0 0 28px;break-inside:auto}
.link-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;padding:8px 0;border-bottom:2px solid var(--fg);break-after:avoid}
.link-head .swatch{width:10px;height:10px;border-radius:2px;display:inline-block}
.link-head .ends{color:var(--muted)}
.diagram{border:1px solid var(--line);background:var(--soft);padding:12px;overflow:auto}
.block-body{fill:var(--paper);stroke:var(--kind);stroke-width:1.5}.block-head{fill:var(--kind);fill-opacity:.12}
.k-board{--kind:var(--kind-board)}.k-module{--kind:var(--kind-module)}.k-subsystem{--kind:var(--kind-subsystem)}.k-harness{--kind:var(--kind-harness)}
.block-label{font:600 13px var(--sans);fill:var(--fg)}.block-sub{font:11px var(--sans);fill:var(--muted)}
.block-kind{fill:var(--kind);font-weight:600}.row-export{fill:var(--kind-board)}
.wire{fill:none}.w-b2b{stroke:var(--kind-board);stroke-width:3}.w-harness{stroke:var(--kind-harness);stroke-width:2}.w-link{stroke:var(--kind-link);stroke-width:1.5}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 8px;color:var(--muted);font-size:11px}.lg{display:inline-flex;align-items:center;gap:6px}
.sw{display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--kind)}
.row-ref{font:600 11px var(--mono);fill:var(--fg)}.row-partner{font:11px var(--sans);fill:var(--muted)}
.row-rule{stroke:var(--line)}
.toc{display:flex;flex-wrap:wrap;gap:4px 16px;margin:16px 0 0;font-size:12px}.toc a{color:var(--accent);text-decoration:none}
html.prism-embed .toc{display:none}
a{color:var(--accent)}table.overview{margin:0 0 24px}table.overview a{text-decoration:none}
.link{scroll-margin-top:16px}.link-findings{list-style:none;margin:8px 0;padding:0;display:grid;gap:4px;font-size:12px}
footer{margin-top:40px;padding-top:12px;border-top:1px solid var(--line);color:var(--muted);font-size:11px}
@media print{
  @page{size:A4 landscape;margin:12mm}
  main{max-width:none;padding:0}
  body{font-size:11px}table{font-size:10px}
  .banner{display:none}
  .print-banner{display:block;position:fixed;top:0;left:0;right:0;border:1px solid #f59e0b;background:#fffbeb;color:#78350f;padding:4px 8px;font-weight:600;font-size:10px}
  thead{display:table-header-group}tr{break-inside:avoid}
  h2{break-after:avoid}.diagram{break-inside:avoid;background:#fff}
}
"""


def _chip(status: str) -> str:
    return f'<span class="chip {_e(status)}">{_e(status)}</span>'


AXIS_TEXT = {"top": "Vertical, top side", "bottom": "Vertical, bottom side", "+x": "Right-angle, footprint +X",
             "-x": "Right-angle, footprint −X", "+y": "Right-angle, footprint +Y", "-y": "Right-angle, footprint −Y"}


def _mm(value: Any) -> str:
    return f"{float(value):g}"


def _frame(end: Mapping[str, Any]) -> str:
    """A link end's mating frame as the ICD states it (CONTRACTS_P2 §15)."""
    if end.get("redacted"):
        return '<span class="meta">restricted</span>'
    mating = end.get("mating")
    if not mating:
        return '<span class="meta">not confirmed</span>'
    turns = f" · turned {mating['quarterTurns'] * 90}°" if mating.get("quarterTurns") else ""
    how = "confirmed" if mating["mode"] == "confirmed" else "set by hand"
    return f"{_e(AXIS_TEXT.get(mating['axis'], mating['axis']))}{turns} <span class=\"meta\">({how})</span>"


def _b2b_section(links: Sequence[Mapping[str, Any]], labels: Mapping[str, str]) -> list[str]:
    """§17.4: each board-to-board pair with both mating frames and the stack height."""
    pairs = [link for link in links if link.get("type") == "b2b"]
    if not pairs:
        return []
    out = ["<h2>Board-to-board mating</h2><table><thead><tr><th>Link</th><th>End A</th><th>Frame A</th>"
           "<th>End B</th><th>Frame B</th><th>Stack height</th></tr></thead><tbody>"]
    for link in pairs:
        a, b = (_end_label(labels, link[e]) for e in ("a", "b"))
        height = link.get("stackHeightMm")
        out.append(f"<tr><td><b>{_e(link['name'] or f'{a} ↔ {b}')}</b></td><td>{_e(a)}</td><td>{_frame(link['a'])}</td>"
                   f"<td>{_e(b)}</td><td>{_frame(link['b'])}</td>"
                   f"<td>{_mm(height) + ' mm' if height is not None else '<span class=\"meta\">not entered</span>'}</td></tr>")
    out.append("</tbody></table>")
    return out


def _end_mates(end: Mapping[str, Any], labels: Mapping[str, str]) -> str:
    mates = end.get("mates")
    if not mates:
        return "Not mated"
    port = mates.get("port") or {}
    if mates.get("redacted") or not port:
        return f"{labels.get(mates['instanceId'], '?')} (restricted)"
    return f"{labels.get(mates['instanceId'], '?')} {port.get('reference') or ''}"


def _block(end: Mapping[str, Any]) -> str:
    part = end.get("part")
    if not part:
        return f"Generic · {end['pinCount']} pins"
    name = " · ".join(v for v in (part.get("mpn"), part.get("manufacturer")) if v) or part.get("name") or part["componentId"]
    return f"{name} · {end['pinCount']} pins"


def _harness_section(document: Mapping[str, Any], labels: Mapping[str, str],
                     records: Sequence[Mapping[str, str]]) -> list[str]:
    """§17.4: per harness, its ends (mate, block, pin map), its wires and its splices."""
    harnesses = sorted(document.get("harnesses") or [], key=lambda h: (h["name"], h["id"]))
    if not harnesses:
        return []
    out = ["<h2>Harnesses</h2>"]
    for harness in harnesses:
        rows = [r for r in records if r["link_id"] == harness["id"]]
        meta = [f"{len(harness['ends'])} ends", f"{len(rows)} wire{'s' if len(rows) != 1 else ''}"]
        if harness.get("label"):
            meta.append(f"label {harness['label']}")
        if harness.get("cutLengthMm"):
            meta.append(f"cut {_mm(harness['cutLengthMm'])} mm")
        lengths = harness.get("lengths") or {}
        if lengths:
            # §17.10: measured where the System 3D view routes it, plus the service allowance.
            partial = "" if lengths.get("complete") else ", ends not all placed"
            meta.append(f"estimated {_mm(lengths['estimatedMm'])} mm (bundle {_mm(lengths['bundleMm'])} mm "
                        f"+ {_mm(lengths['allowancePct'])} %{partial})")
        wire_lengths = lengths.get("wires") or {}
        errors = sum(1 for r in rows if r["status"] == "error")
        if errors:
            meta.append(f"{errors} error")
        out.append('<section class="link">')
        out.append(f'<div class="link-head"><h3>{_e(harness["name"])}</h3><span class="meta">{_e(" · ".join(meta))}</span></div>')
        out.append("<table><thead><tr><th>End</th><th>Mates</th><th>Mating block</th><th>Pin map</th>"
                   "<th>Boot (mm)</th></tr></thead><tbody>")
        for end in sorted(harness["ends"], key=lambda e: e["ordinal"]):
            pin_map = end.get("pinMap") or {}
            mapped = ", ".join(f"{pin} → {pad}" for pin, pad in sorted(pin_map.items(), key=lambda p: pad_sort_key(p[0])))
            out.append(f"<tr><td><b>{_e(end_name(end))}</b></td><td>{_e(_end_mates(end, labels))}</td>"
                       f"<td>{_e(_block(end))}</td><td class=\"mono\">{_e(mapped) if mapped else 'One to one'}</td>"
                       f"<td>{_mm(end['bootMm']) if end.get('bootMm') is not None else ''}</td></tr>")
        out.append("</tbody></table>")
        out.append("<table><thead><tr><th>From</th><th>Pin</th><th>Pad</th><th>Net</th><th>Signal</th>"
                   "<th class=\"side-b\">Net</th><th class=\"side-b\">Pad</th><th class=\"side-b\">Pin</th>"
                   "<th class=\"side-b\">To</th><th>AWG</th><th>Length (mm)</th><th>Colour</th><th>Label</th><th>Status</th>"
                   "</tr></thead><tbody>")
        for r in rows:
            out.append(f"<tr><td>{_e(r['from_end'])}</td><td class=\"mono num\"><b>{_e(r['from_end_pin'])}</b></td>"
                       f"<td class=\"mono\">{_e(r['a_pin'])}</td><td class=\"mono\">{_e(r['a_net'])}</td>"
                       f"<td class=\"sig\">{_e(r['signal'])}</td><td class=\"mono side-b\">{_e(r['b_net'])}</td>"
                       f"<td class=\"mono side-b\">{_e(r['b_pin'])}</td>"
                       f"<td class=\"mono num side-b\"><b>{_e(r['to_end_pin'])}</b></td><td class=\"side-b\">{_e(r['to_end'])}</td>"
                       f"<td>{_e(r['gauge_awg'])}</td>"
                       f"<td class=\"num\">{_mm(wire_lengths[r['row_id']]['estimatedMm']) if r['row_id'] in wire_lengths else ''}</td>"
                       f"<td>{_e(r['colour'])}</td><td>{_e(r['wire_label'])}</td>"
                       f"<td>{_chip(r['status'])}</td></tr>")
        if not rows:
            out.append('<tr><td colspan="14" class="meta">No wires.</td></tr>')
        out.append("</tbody></table>")
        uses: dict[tuple[str, str], int] = {}
        for r in rows:
            for end, pin in ((r["from_end"], r["from_end_pin"]), (r["to_end"], r["to_end_pin"])):
                uses[(end, pin)] = uses.get((end, pin), 0) + 1
        splices = sorted(((end, pin, n) for (end, pin), n in uses.items() if n > 1),
                         key=lambda s: (int(s[0].split()[-1]), pad_sort_key(s[1])))
        if splices:
            out.append('<p class="meta">Splices: ' + _e("; ".join(f"{end} pin {pin} joins {n} wires" for end, pin, n in splices))
                       + "</p>")
        out.append("</section>")
    return out


def render_html(document: Mapping[str, Any], *, source: str, generated_at: str,
                levels: Optional[Sequence[Mapping[str, Any]]] = None,
                positions: Optional[Mapping[str, Any]] = None) -> str:
    """§9.5: the printable ICD. ``source`` is the snapshot name or ``live``; ``levels`` adds the subsystems' own links."""

    system = document["system"]
    open_reviews = int(document.get("openReviewCount") or 0)
    boards = [i for i in document["instances"] if i.get("kind", "board") == "board"]
    subsystems = [i for i in document["instances"] if i.get("kind") == "assembly"]
    modules = [i for i in document["instances"] if i.get("kind") == "module"]
    banner_parts = []
    if open_reviews:
        banner_parts.append(f'This document contains {open_reviews} unreviewed change{"s" if open_reviews != 1 else ""}.')
    for noun, group in (("subsystem", subsystems), ("module", modules)):
        unreleased = [i for i in group if (i.get("catalog") or {}).get("releaseStatus") not in (None, "released")]
        if unreleased:
            banner_parts.append(f'{len(unreleased)} {noun}{"s pin" if len(unreleased) != 1 else " pins"} an unreleased revision.')
    banner_text = " ".join(banner_parts)
    validation = document.get("validation") or {}
    findings = validation.get("findings") or []
    labels = {i["id"]: i["label"] for i in document["instances"]}
    records = csv_records(document)
    waived = [f for f in findings if f.get("waived")]
    findings = [f for f in findings if not f.get("waived")]  # SB2-100: waived ones are listed apart
    errors = sum(1 for f in findings if f["severity"] == "error")
    warnings = sum(1 for f in findings if f["severity"] == "warning")

    out = ["<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">",
           "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
           f"<title>ICD — {_e(system['name'])}</title><style>{_STYLE}</style></head><body>"]
    if banner_text:
        # One copy on screen; the print copy is fixed, so it repeats on every printed page (§9.5).
        out.append(f'<div class="print-banner" role="note">{banner_text}</div>')
    out.append("<main>")
    out.append('<header class="doc"><p class="eyebrow">Interface control document</p>')
    out.append(f"<h1>{_e(system['name'])}</h1>")
    out.append(f'<p class="meta">{"Live" if source == "live" else "Snapshot " + _e(source)} · generated {_e(_when(generated_at))}'
               f' · renderer {RENDERER_VERSION}</p>')
    if system.get("description"):
        out.append(f'<p class="description">{_e(system["description"])}</p>')
    out.append('<div class="stats">'
               f'<div class="stat"><b>{len(boards)}</b><span>Boards</span></div>'
               + (f'<div class="stat"><b>{len(modules)}</b><span>Modules</span></div>' if modules else "")
               + (f'<div class="stat"><b>{len(subsystems)}</b><span>Subsystems</span></div>' if subsystems else "") +
               f'<div class="stat"><b>{len(document["links"])}</b><span>Links</span></div>'
               + (f'<div class="stat"><b>{len(document.get("harnesses") or [])}</b><span>Harnesses</span></div>'
                  if document.get("harnesses") else "") +
               f'<div class="stat"><b>{len(records)}</b><span>Connections</span></div>'
               f'<div class="stat{" err" if errors else ""}"><b>{errors}</b><span>Errors</span></div>'
               f'<div class="stat{" warn" if warnings else ""}"><b>{warnings}</b><span>Warnings</span></div>'
               f'<div class="stat{" warn" if open_reviews else ""}"><b>{open_reviews}</b><span>Open reviews</span></div>'
               "</div></header>")
    if banner_text:
        out.append(f'<div class="banner" role="note">{banner_text}</div>')
    out.append("@@TOC@@")

    out.append("<h2>Boards</h2><table><thead><tr><th>Label</th><th>Project</th><th>Baseline</th>"
               "<th>Branch</th></tr></thead><tbody>")
    for instance in boards:
        commit = instance["baselineCommit"]
        baseline = (f'<span class="mono" title="{_e(commit)}"><b>{_e(commit[:12])}</b></span>'
                    if commit else '<span class="meta">restricted</span>')
        branch = (f'<span class="mono">{_e(instance["trackedRef"])}</span>' if instance["trackedRef"] else '<span class="meta">not tracked</span>')
        out.append(f"<tr><td><b>{_e(instance['label'])}</b></td><td>{_e(instance['projectName'] or '')}</td>"
                   f"<td>{baseline}</td><td>{branch}{' <span class=\"chip info\">pinned</span>' if instance['pinned'] else ''}</td></tr>")
    out.append("</tbody></table>")

    if subsystems:
        out.append("<h2>Subsystems</h2><table><thead><tr><th>Label</th><th>Assembly</th><th>IPN</th><th>Revision</th>"
                   "<th>Stage</th><th>Source snapshot</th><th>Unreviewed at publish</th></tr></thead><tbody>")
        for instance in subsystems:
            ref = instance.get("catalog") or {}
            stage = ref.get("releaseStatus") or "unavailable"
            out.append(f"<tr><td><b>{_e(instance['label'])}</b></td><td>{_e(instance.get('projectName') or '')}</td>"
                       f"<td class=\"mono\">{_e(ref.get('identity') or '')}</td>"
                       f"<td>{'v' + str(ref['version']) if ref.get('version') else '—'}</td>"
                       f"<td>{_stage(stage)}</td>"
                       f"<td>{_e(ref.get('snapshotName') or '')}</td><td>{int(ref.get('openReviewCount') or 0)}</td></tr>")
        out.append("</tbody></table>")
    if modules:
        out.append("<h2>Modules</h2><table><thead><tr><th>Label</th><th>Part</th><th>IPN</th><th>Revision</th>"
                   "<th>Stage</th><th>Connectors</th></tr></thead><tbody>")
        for instance in modules:
            ref = instance.get("catalog") or {}
            ports = ", ".join(p["reference"] for p in instance.get("ports") or [])
            out.append(f"<tr><td><b>{_e(instance['label'])}</b></td><td>{_e(instance.get('projectName') or '')}</td>"
                       f"<td class=\"mono\">{_e(ref.get('identity') or '')}</td>"
                       f"<td>{'v' + str(ref['version']) if ref.get('version') else '—'}</td>"
                       f"<td>{_stage(ref.get('releaseStatus') or 'unavailable')}</td><td class=\"mono\">{_e(ports)}</td></tr>")
        out.append("</tbody></table>")

    out.append(f'<h2>Block diagram</h2><div class="diagram">{_legend(document)}{_diagram(document, positions)}</div>')

    out.append("<h2>Connections</h2>")
    ordered = sorted(document["links"], key=lambda l: (l["name"], l["id"]))
    out.append(_connections_overview(document, ordered, labels, records, findings))
    for index, link in enumerate(ordered, start=1):
        ends = [_end_label(labels, link[e]) for e in ("a", "b")]
        rows = [r for r in records if r["link_id"] == link["id"]]
        statuses = {status: sum(1 for r in rows if r["status"] == status) for status in ("error", "review")}
        colour = "var(--kind-board)" if link.get("type") == "b2b" else "var(--kind-link)"
        title = link["name"] or f"{ends[0]} ↔ {ends[1]}"
        out.append(f'<section class="link" id="link-{_e(link["id"])}">')
        out.append(f'<div class="link-head"><span class="swatch" style="background:{colour}"></span>'
                   f"<h3>{index}. {_e(title)}</h3>"
                   + (f"<span class=\"ends\">{_e(ends[0])} ↔ {_e(ends[1])}</span>" if link["name"] else "")
                   + f'<span class="meta">{len(rows)} pin{"s" if len(rows) != 1 else ""}'
                   + (f" · harness {_e(link['harness'])}" if link["harness"] else "")
                   + (" · board-to-board" if link.get("type") == "b2b" else "")
                   + (f" · stack {_mm(link['stackHeightMm'])} mm" if link.get("stackHeightMm") is not None else "")
                   + "".join(f" · {count} {status}" for status, count in statuses.items() if count)
                   + "</span></div>")
        out.append(_link_findings([f for f in findings if f.get("linkId") == link["id"]]))
        out.append(f"<table><thead><tr><th>{_e(ends[0])}</th><th>Pin name</th><th>Net</th><th>Signal</th>"
                   f"<th class=\"side-b\">Net</th><th class=\"side-b\">Pin name</th><th class=\"side-b\">{_e(ends[1])}</th>"
                   "<th>Status</th></tr></thead><tbody>")
        for record in rows:
            # A pin name that only repeats the pad says nothing.
            for side in ("a", "b"):
                if record[f"{side}_pin_name"] == record[f"{side}_pin"]:
                    record = {**record, f"{side}_pin_name": ""}
            out.append(
                f'<tr><td class="mono num"><b>{_e(record["a_pin"])}</b></td><td>{_e(record["a_pin_name"])}</td>'
                f'<td class="mono">{_e(record["a_net"])}</td><td class="sig">{_e(record["signal"])}</td>'
                f'<td class="mono side-b">{_e(record["b_net"])}</td><td class="side-b">{_e(record["b_pin_name"])}</td>'
                f'<td class="mono num side-b"><b>{_e(record["b_pin"])}</b></td><td>{_status(record["status"])}</td></tr>')
        if not rows:
            out.append('<tr><td colspan="8" class="meta">No pins mapped.</td></tr>')
        out.append("</tbody></table></section>")

    out.extend(_b2b_section(ordered, labels))
    out.extend(_harness_section(document, labels, records))

    if levels:
        out.append("<h2>Inside subsystems</h2>")
        for level in levels:
            nested = [r for r in _nested_records([level])]
            out.append(f'<section class="link"><div class="link-head"><h3>{_e(level["displayPath"])}</h3>'
                       f'<span class="meta">{_e(level.get("snapshotName") or "")} · {len(nested)} pin'
                       f'{"s" if len(nested) != 1 else ""}</span></div>')
            if not nested:
                out.append('<p class="meta">No links inside.</p></section>')
                continue
            out.append("<table><thead><tr><th>Link</th><th>From</th><th>Pin</th><th>Net</th><th>Signal</th>"
                       "<th class=\"side-b\">Net</th><th class=\"side-b\">Pin</th><th class=\"side-b\">To</th></tr></thead><tbody>")
            for r in nested:
                out.append(f"<tr><td>{_e(r['link_name'])}</td><td>{_e(r['a_board'])} {_e(r['a_connector'])}</td>"
                           f"<td class=\"mono\">{_e(r['a_pin'])}</td><td class=\"mono\">{_e(r['a_net'])}</td>"
                           f"<td>{_e(r['signal'])}</td><td class=\"mono side-b\">{_e(r['b_net'])}</td>"
                           f"<td class=\"mono side-b\">{_e(r['b_pin'])}</td>"
                           f"<td class=\"side-b\">{_e(r['b_board'])} {_e(r['b_connector'])}</td></tr>")
            out.append("</tbody></table></section>")

    out.append("<h2>Findings</h2>")
    if findings:
        groups: dict[tuple, dict] = {}
        for finding in findings:
            key = (finding["severity"], finding["rule"], finding["instanceId"], finding["reference"], finding["linkId"])
            entry = groups.setdefault(key, {"finding": finding, "pins": []})
            if finding["pin"]:
                entry["pins"].append(finding["pin"])
        link_names = {l["id"]: l["name"] or " ↔ ".join(_end_label(labels, l[e]) for e in ("a", "b"))
                      for l in document["links"]}
        link_names.update({h["id"]: h["name"] for h in document.get("harnesses") or []})
        order = {"error": 0, "warning": 1, "info": 2}
        out.append("<table><thead><tr><th>Severity</th><th>Rule</th><th>Board</th><th>Connector</th><th>Pins</th>"
                   "<th>Link</th></tr></thead><tbody>")
        for key in sorted(groups, key=lambda k: (order.get(k[0], 3), k[1], labels.get(k[2] or "", ""), k[3] or "")):
            finding, pins = groups[key]["finding"], sorted(groups[key]["pins"], key=pad_sort_key)
            severity = {"warning": "review", "error": "error"}.get(finding["severity"], "info")
            out.append(f'<tr><td><span class="chip {severity}">{_e(finding["severity"])}</span></td>'
                       f'<td><b>{_e(finding["rule"])}</b> {_e(finding["name"].replace("_", " "))}</td>'
                       f"<td>{_e(labels.get(finding['instanceId'], ''))}</td><td class=\"mono\">{_e(finding['reference'] or '')}</td>"
                       f'<td class="mono">{_e(", ".join(pins))}</td><td>{_finding_link(finding, link_names, document)}</td></tr>')
        out.append("</tbody></table>")
    else:
        out.append('<p class="meta">No findings.</p>')
    waivers = validation.get("waivers") or []
    if waivers or waived:
        out.append("<h2>Waived findings</h2>")
        out.append("<table><thead><tr><th>Rule</th><th>Board</th><th>Connector</th><th>Pin</th><th>Note</th>"
                   "<th>By</th><th>Date</th><th>State</th></tr></thead><tbody>")
        for waiver in waivers:
            parts = ((waiver.get("findingKey") or "").split("|") + [""] * 7)[:7]
            by = (waiver.get("by") or "").removeprefix("user:")
            state = "waived" if waiver.get("active") else "no longer raised"
            out.append(f"<tr><td><b>{_e(waiver.get('rule') or '')}</b></td><td>{_e(labels.get(parts[1], ''))}</td>"
                       f"<td class=\"mono\">{_e(parts[5])}</td><td class=\"mono\">{_e(parts[6])}</td>"
                       f"<td>{_e(waiver.get('note') or '')}</td><td>{_e(by)}</td>"
                       f"<td class=\"mono\">{_e((waiver.get('at') or '')[:10])}</td><td>{_e(state)}</td></tr>")
        out.append("</tbody></table>")
    for entry in validation.get("notEvaluated") or []:
        out.append(f"<p class=\"meta\">Not evaluated: {_e(entry['rule'])} for "
                   f"{_e(labels.get(entry['instanceId'], ''))} ({_e(entry['reason'])}).</p>")
    out.append(f"<footer>KiCAD-Prism System Builder · {_e(system['name'])} · {_e(source)} · {_e(generated_at)}</footer>")
    out.append("</main></body></html>")
    page = _anchor_sections("".join(out))
    return page.replace("@@TOC@@", _contents(page))


# ---------------------------------------------------------------------------
# Diff


_ROW_FIELDS = ("pinA", "pinB", "signal", "netA", "netB")


def diff(before: Mapping[str, Any], after: Mapping[str, Any]) -> dict:
    """Row-level differences grouped by link, plus baseline changes per board."""

    def by_id(items):
        return {item["id"]: item for item in items}

    boards = []
    old_instances, new_instances = by_id(before["instances"]), by_id(after["instances"])
    for iid in sorted(set(old_instances) | set(new_instances)):
        old, new = old_instances.get(iid), new_instances.get(iid)
        if old is None or new is None or old["baselineCommit"] != new["baselineCommit"]:
            boards.append({
                "instanceId": iid, "label": (new or old)["label"],
                "status": "added" if old is None else "removed" if new is None else "rebased",
                "before": old and old["baselineCommit"], "after": new and new["baselineCommit"],
            })

    links = []
    old_links, new_links = by_id(before["links"]), by_id(after["links"])
    for lid in sorted(set(old_links) | set(new_links)):
        old, new = old_links.get(lid), new_links.get(lid)
        old_rows, new_rows = by_id(old["rows"] if old else []), by_id(new["rows"] if new else [])
        added = [new_rows[r] for r in sorted(set(new_rows) - set(old_rows))]
        removed = [old_rows[r] for r in sorted(set(old_rows) - set(new_rows))]
        changed = []
        for rid in sorted(set(old_rows) & set(new_rows)):
            a = {k: old_rows[rid].get(k) for k in _ROW_FIELDS}
            b = {k: new_rows[rid].get(k) for k in _ROW_FIELDS}
            if a != b:
                changed.append({"id": rid, "before": a, "after": b})
        meta_changed = bool(old and new and (old["name"], old["harness"]) != (new["name"], new["harness"]))
        if old is None or new is None or added or removed or changed or meta_changed:
            links.append({
                "linkId": lid, "name": (new or old)["name"],
                "status": "added" if old is None else "removed" if new is None else "changed",
                "rows": {"added": added, "removed": removed, "changed": changed},
            })
    return {"boards": boards, "links": links}
