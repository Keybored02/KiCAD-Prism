"""
PCB Diff Service

Parses .kicad_pcb files from two commits, diffs them by UUID, and returns
a structured change set suitable for the interactive PCB diff viewer.
"""

from pathlib import Path
from typing import Optional
from app.services.project_service import get_registered_projects
# Reuse the s-expression parser and git helpers from sch_diff_service
from app.services.sch_diff_service import (
    _parse_sexp,
    _get, _get_all, _uuid, _at,
    _git_root, _read_file_at_commit, _find_all_sch_paths,
)
import subprocess


# ---------------------------------------------------------------------------
# PCB element extraction
# ---------------------------------------------------------------------------

def _property(lst: list, name: str) -> Optional[str]:
    for item in _get_all(lst, 'property'):
        if len(item) >= 3 and item[1] == name:
            return item[2]
    return None


def _extract_footprints(tree: list) -> dict:
    result = {}
    for item in _get_all(tree, 'footprint'):
        uid = _uuid(item)
        if not uid:
            continue
        x, y = _at(item)
        layer_node = _get(item, 'layer')
        layer = layer_node[1] if layer_node and len(layer_node) > 1 else ''
        result[uid] = {
            'type': 'footprint',
            'uuid': uid,
            'x': x,
            'y': y,
            'reference': _property(item, 'Reference') or '',
            'value': _property(item, 'Value') or '',
            'lib_id': item[1] if len(item) > 1 and isinstance(item[1], str) else '',
            'layer': layer,
        }
    return result


def _extract_segments(tree: list) -> dict:
    result = {}
    for item in _get_all(tree, 'segment'):
        uid = _uuid(item)
        if not uid:
            continue
        # Midpoint of the segment as representative position
        start = _get(item, 'start')
        end = _get(item, 'end')
        sx = float(start[1]) if start and len(start) > 1 else 0.0
        sy = float(start[2]) if start and len(start) > 2 else 0.0
        ex = float(end[1]) if end and len(end) > 1 else 0.0
        ey = float(end[2]) if end and len(end) > 2 else 0.0
        layer_node = _get(item, 'layer')
        layer = layer_node[1] if layer_node and len(layer_node) > 1 else ''
        net_node = _get(item, 'net')
        net = net_node[1] if net_node and len(net_node) > 1 else ''
        width_node = _get(item, 'width')
        width = float(width_node[1]) if width_node and len(width_node) > 1 else 0.0
        result[uid] = {
            'type': 'segment',
            'uuid': uid,
            'x': (sx + ex) / 2,
            'y': (sy + ey) / 2,
            'start_x': sx, 'start_y': sy,
            'end_x': ex, 'end_y': ey,
            'layer': layer,
            'net': str(net),
            'width': width,
        }
    return result


def _extract_vias(tree: list) -> dict:
    result = {}
    for item in _get_all(tree, 'via'):
        uid = _uuid(item)
        if not uid:
            continue
        x, y = _at(item)
        size_node = _get(item, 'size')
        size = float(size_node[1]) if size_node and len(size_node) > 1 else 0.0
        drill_node = _get(item, 'drill')
        drill = float(drill_node[1]) if drill_node and len(drill_node) > 1 else 0.0
        net_node = _get(item, 'net')
        net = net_node[1] if net_node and len(net_node) > 1 else ''
        result[uid] = {
            'type': 'via',
            'uuid': uid,
            'x': x,
            'y': y,
            'size': size,
            'drill': drill,
            'net': str(net),
        }
    return result


def _extract_zones(tree: list) -> dict:
    result = {}
    for item in _get_all(tree, 'zone'):
        uid = _uuid(item)
        if not uid:
            continue
        # Use centroid of the filled polygon if available, else (0,0)
        x, y = 0.0, 0.0
        polygon = _get(item, 'polygon') or _get(item, 'filled_polygon')
        if polygon:
            pts = _get(polygon, 'pts')
            if pts:
                xys = _get_all(pts, 'xy')
                if xys:
                    xs = [float(p[1]) for p in xys if len(p) > 2]
                    ys = [float(p[2]) for p in xys if len(p) > 2]
                    if xs:
                        x, y = sum(xs) / len(xs), sum(ys) / len(ys)
        net_node = _get(item, 'net')
        net_name_node = _get(item, 'net_name')
        name_node = _get(item, 'name')
        result[uid] = {
            'type': 'zone',
            'uuid': uid,
            'x': x,
            'y': y,
            'net': str(net_node[1]) if net_node and len(net_node) > 1 else '',
            'net_name': net_name_node[1] if net_name_node and len(net_name_node) > 1 else '',
            'name': name_node[1] if name_node and len(name_node) > 1 else '',
        }
    return result


def _extract_gr_items(tree: list) -> dict:
    """Graphical items: gr_text, gr_line, gr_circle, gr_rect, gr_arc."""
    result = {}
    for kind in ('gr_text', 'gr_line', 'gr_circle', 'gr_rect', 'gr_arc'):
        for item in _get_all(tree, kind):
            uid = _uuid(item)
            if not uid:
                continue
            x, y = _at(item)
            layer_node = _get(item, 'layer')
            layer = layer_node[1] if layer_node and len(layer_node) > 1 else ''
            text = ''
            if kind == 'gr_text' and len(item) > 1 and isinstance(item[1], str):
                text = item[1]
            result[uid] = {
                'type': kind,
                'uuid': uid,
                'x': x,
                'y': y,
                'layer': layer,
                'text': text,
            }
    return result


def _extract_all_pcb(tree: list) -> dict:
    items = {}
    items.update(_extract_footprints(tree))
    items.update(_extract_segments(tree))
    items.update(_extract_vias(tree))
    items.update(_extract_zones(tree))
    items.update(_extract_gr_items(tree))
    return items


# ---------------------------------------------------------------------------
# Diff computation
# ---------------------------------------------------------------------------

_PCB_COMPARABLE_KEYS = {
    'footprint': ['reference', 'value', 'lib_id', 'layer', 'x', 'y'],
    'segment':   ['start_x', 'start_y', 'end_x', 'end_y', 'layer', 'net', 'width'],
    'via':       ['x', 'y', 'size', 'drill', 'net'],
    'zone':      ['net_name', 'name', 'x', 'y'],
    'gr_text':   ['text', 'layer', 'x', 'y'],
    'gr_line':   ['layer', 'x', 'y'],
    'gr_circle': ['layer', 'x', 'y'],
    'gr_rect':   ['layer', 'x', 'y'],
    'gr_arc':    ['layer', 'x', 'y'],
}


def _item_changes(old: dict, new: dict) -> dict:
    changes = {}
    keys = _PCB_COMPARABLE_KEYS.get(old['type'], [])
    for k in keys:
        ov, nv = old.get(k), new.get(k)
        if ov != nv:
            changes[k] = {'old': ov, 'new': nv}
    return changes


def diff_pcb(old_content: str, new_content: str) -> dict:
    old_tree = _parse_sexp(old_content)
    new_tree = _parse_sexp(new_content)
    old_items = _extract_all_pcb(old_tree)
    new_items = _extract_all_pcb(new_tree)

    old_uuids = set(old_items)
    new_uuids = set(new_items)

    added   = [new_items[u] for u in (new_uuids - old_uuids)]
    removed = [old_items[u] for u in (old_uuids - new_uuids)]
    changed = []
    for u in old_uuids & new_uuids:
        chg = _item_changes(old_items[u], new_items[u])
        if chg:
            changed.append({'item': new_items[u], 'changes': chg})

    return {'added': added, 'removed': removed, 'changed': changed}


# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------

def _find_all_pcb_paths(repo_root: Path, commit: str) -> list:
    try:
        result = subprocess.run(
            ['git', 'ls-tree', '-r', '--name-only', commit],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
        return [l for l in result.stdout.splitlines() if l.endswith('.kicad_pcb')]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def get_pcb_diff(project_id: str, commit1: str, commit2: str) -> Optional[dict]:
    """
    Return interactive diff data for all PCB files between two commits.

    Returns:
        {
            commit1: str,
            commit2: str,
            boards: [
                {
                    filename: str,
                    old_content: str|None,
                    new_content: str|None,
                    diff: { added, removed, changed },
                },
                ...
            ],
        }
    or None if no PCB files found.
    """
    projects = get_registered_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        return None

    project_path = Path(project.path)
    repo_root = _git_root(project_path)

    paths1 = set(_find_all_pcb_paths(repo_root, commit1))
    paths2 = set(_find_all_pcb_paths(repo_root, commit2))
    all_paths = paths1 | paths2

    if not all_paths:
        return None

    boards = []
    for rel_path in sorted(all_paths):
        filename = rel_path.split('/')[-1]
        old_content = _read_file_at_commit(repo_root, commit1, rel_path) if rel_path in paths1 else None
        new_content = _read_file_at_commit(repo_root, commit2, rel_path) if rel_path in paths2 else None

        if old_content and new_content:
            diff = diff_pcb(old_content, new_content)
        elif new_content:
            tree = _parse_sexp(new_content)
            items = list(_extract_all_pcb(tree).values())
            diff = {'added': items, 'removed': [], 'changed': []}
        elif old_content:
            tree = _parse_sexp(old_content)
            items = list(_extract_all_pcb(tree).values())
            diff = {'added': [], 'removed': items, 'changed': []}
        else:
            continue

        boards.append({
            'filename': filename,
            'old_content': old_content,
            'new_content': new_content,
            'diff': diff,
        })

    if not boards:
        return None

    return {'commit1': commit1, 'commit2': commit2, 'boards': boards}
