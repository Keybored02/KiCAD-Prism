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
        start = _get(item, 'start')
        end = _get(item, 'end')
        sx = float(start[1]) if start and len(start) > 1 else 0.0
        sy = float(start[2]) if start and len(start) > 2 else 0.0
        ex = float(end[1]) if end and len(end) > 1 else 0.0
        ey = float(end[2]) if end and len(end) > 2 else 0.0
        # Normalise direction so (A→B) and (B→A) hash the same
        if (sx, sy) > (ex, ey):
            sx, sy, ex, ey = ex, ey, sx, sy
        layer_node = _get(item, 'layer')
        layer = layer_node[1] if layer_node and len(layer_node) > 1 else ''
        net_node = _get(item, 'net')
        net = str(net_node[1]) if net_node and len(net_node) > 1 else ''
        width_node = _get(item, 'width')
        width = float(width_node[1]) if width_node and len(width_node) > 1 else 0.0
        # Key by geometry — KiCAD regenerates UUIDs on every save so they are not stable
        geo_key = f"seg:{sx:.4f},{sy:.4f}-{ex:.4f},{ey:.4f}:{layer}:{net}:{width:.4f}"
        result[geo_key] = {
            'type': 'segment',
            'uuid': geo_key,
            'x': (sx + ex) / 2,
            'y': (sy + ey) / 2,
            'start_x': sx, 'start_y': sy,
            'end_x': ex, 'end_y': ey,
            'layer': layer,
            'net': net,
            'width': width,
        }
    return result


def _extract_vias(tree: list) -> dict:
    result = {}
    for item in _get_all(tree, 'via'):
        x, y = _at(item)
        size_node = _get(item, 'size')
        size = float(size_node[1]) if size_node and len(size_node) > 1 else 0.0
        drill_node = _get(item, 'drill')
        drill = float(drill_node[1]) if drill_node and len(drill_node) > 1 else 0.0
        net_node = _get(item, 'net')
        net = str(net_node[1]) if net_node and len(net_node) > 1 else ''
        # Key by geometry for same reason as segments
        geo_key = f"via:{x:.4f},{y:.4f}:{size:.4f}:{drill:.4f}:{net}"
        result[geo_key] = {
            'type': 'via',
            'uuid': geo_key,
            'x': x,
            'y': y,
            'size': size,
            'drill': drill,
            'net': net,
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
        # Collect outline polygon points for frontend rendering
        polygon_points = []
        if polygon:
            pts = _get(polygon, 'pts')
            if pts:
                xys = _get_all(pts, 'xy')
                polygon_points = [[float(p[1]), float(p[2])] for p in xys if len(p) > 2]
        result[uid] = {
            'type': 'zone',
            'uuid': uid,
            'x': x,
            'y': y,
            'net': str(net_node[1]) if net_node and len(net_node) > 1 else '',
            'net_name': net_name_node[1] if net_name_node and len(net_name_node) > 1 else '',
            'name': name_node[1] if name_node and len(name_node) > 1 else '',
            'polygon_points': polygon_points,
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


_SNAP = 0.001  # mm tolerance for shared-endpoint matching


def _seg_endpoints(item: dict):
    return (
        (item['start_x'], item['start_y']),
        (item['end_x'],   item['end_y']),
    )


def _pts_close(a, b) -> bool:
    return abs(a[0] - b[0]) < _SNAP and abs(a[1] - b[1]) < _SNAP


def _segments_share_endpoint(old: dict, new: dict) -> bool:
    """True when the two segments share at least one endpoint (within tolerance)."""
    for op in _seg_endpoints(old):
        for np in _seg_endpoints(new):
            if _pts_close(op, np):
                return True
    return False


def _match_segments(removed_segs: list, added_segs: list) -> tuple:
    """
    Greedily pair removed↔added segments that share an endpoint and have the
    same layer/net/width.  Returns (changed_pairs, still_removed, still_added).
    """
    changed = []
    used_removed = set()
    used_added   = set()

    # Index added segments by (layer, net, width) for fast lookup
    from collections import defaultdict
    added_by_key = defaultdict(list)
    for i, seg in enumerate(added_segs):
        k = (seg['layer'], seg['net'], seg['width'])
        added_by_key[k].append(i)

    for ri, old_seg in enumerate(removed_segs):
        k = (old_seg['layer'], old_seg['net'], old_seg['width'])
        for ai in added_by_key.get(k, []):
            if ai in used_added:
                continue
            new_seg = added_segs[ai]
            if _segments_share_endpoint(old_seg, new_seg):
                chg = _item_changes(old_seg, new_seg)
                if chg:
                    changed.append({'item': new_seg, 'changes': chg})
                used_removed.add(ri)
                used_added.add(ai)
                break  # each removed seg matches at most one added seg

    still_removed = [s for i, s in enumerate(removed_segs) if i not in used_removed]
    still_added   = [s for i, s in enumerate(added_segs)   if i not in used_added]
    return changed, still_removed, still_added


def diff_pcb(old_content: str, new_content: str) -> dict:
    old_tree = _parse_sexp(old_content)
    new_tree = _parse_sexp(new_content)
    old_items = _extract_all_pcb(old_tree)
    new_items = _extract_all_pcb(new_tree)

    old_uuids = set(old_items)
    new_uuids = set(new_items)

    added_all   = [new_items[u] for u in (new_uuids - old_uuids)]
    removed_all = [old_items[u] for u in (old_uuids - new_uuids)]
    changed = []
    for u in old_uuids & new_uuids:
        chg = _item_changes(old_items[u], new_items[u])
        if chg:
            changed.append({'item': new_items[u], 'changes': chg})

    # Reclassify added/removed segment pairs that share an endpoint as "changed"
    added_segs   = [i for i in added_all   if i['type'] == 'segment']
    removed_segs = [i for i in removed_all if i['type'] == 'segment']
    added_other   = [i for i in added_all   if i['type'] != 'segment']
    removed_other = [i for i in removed_all if i['type'] != 'segment']

    seg_changed, still_removed, still_added = _match_segments(removed_segs, added_segs)
    changed.extend(seg_changed)

    return {
        'added':   added_other   + still_added,
        'removed': removed_other + still_removed,
        'changed': changed,
    }


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
        # commit1 = newer, commit2 = older (parent)
        new_content = _read_file_at_commit(repo_root, commit1, rel_path) if rel_path in paths1 else None
        old_content = _read_file_at_commit(repo_root, commit2, rel_path) if rel_path in paths2 else None

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
