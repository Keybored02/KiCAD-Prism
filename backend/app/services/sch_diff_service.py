"""
Schematic Diff Service

Parses .kicad_sch files from two commits, diffs them by UUID, and returns
a structured change set suitable for the interactive schematic diff viewer.
"""

import re
import subprocess
from pathlib import Path
from typing import Optional
from app.services.project_service import get_registered_projects, find_schematic_file


# ---------------------------------------------------------------------------
# S-expression parser (lightweight, enough for kicad_sch)
# ---------------------------------------------------------------------------

def _parse_sexp(text: str) -> list:
    """
    Parse an s-expression string into nested Python lists.
    Atoms become strings; lists become Python lists.
    """
    tokens = _tokenize(text)
    pos, result = _read_expr(tokens, 0)
    return result


def _tokenize(text: str):
    token_re = re.compile(
        r'"(?:[^"\\]|\\.)*"'   # quoted string
        r'|[()]'               # parens
        r'|[^\s()"]+'          # atom
    )
    return token_re.findall(text)


def _read_expr(tokens: list, pos: int):
    if pos >= len(tokens):
        return pos, None
    tok = tokens[pos]
    if tok == '(':
        pos += 1  # consume '('
        lst = []
        while pos < len(tokens) and tokens[pos] != ')':
            pos, child = _read_expr(tokens, pos)
            if child is not None:
                lst.append(child)
        pos += 1  # consume ')'
        return pos, lst
    elif tok == ')':
        return pos, None
    else:
        # Strip surrounding quotes if present
        if tok.startswith('"') and tok.endswith('"'):
            tok = tok[1:-1].replace('\\"', '"').replace('\\\\', '\\')
        return pos + 1, tok


# ---------------------------------------------------------------------------
# Schematic element extraction
# ---------------------------------------------------------------------------

def _get(lst: list, key: str, default=None):
    """Find first sub-list whose first element matches key."""
    for item in lst:
        if isinstance(item, list) and item and item[0] == key:
            return item
    return default


def _get_all(lst: list, key: str) -> list:
    return [item for item in lst if isinstance(item, list) and item and item[0] == key]


def _uuid(lst: list) -> Optional[str]:
    for key in ('uuid', 'tstamp'):
        u = _get(lst, key)
        if u and len(u) > 1:
            return u[1]
    return None


def _at(lst: list) -> tuple:
    """Return (x, y) from an (at x y ...) node."""
    a = _get(lst, 'at')
    if a and len(a) >= 3:
        try:
            return float(a[1]), float(a[2])
        except (ValueError, TypeError):
            pass
    return 0.0, 0.0


def _property(lst: list, name: str) -> Optional[str]:
    for item in _get_all(lst, 'property'):
        if len(item) >= 3 and item[1] == name:
            return item[2]
    return None


def _extract_symbols(tree: list) -> dict:
    """Return {uuid: item_dict} for all symbol instances."""
    result = {}
    for item in _get_all(tree, 'symbol'):
        uid = _uuid(item)
        if not uid:
            continue
        x, y = _at(item)
        result[uid] = {
            'type': 'symbol',
            'uuid': uid,
            'x': x,
            'y': y,
            'reference': _property(item, 'Reference') or '',
            'value': _property(item, 'Value') or '',
            'footprint': _property(item, 'Footprint') or '',
            'lib_id': (_get(item, 'lib_id') or [None, ''])[1],
        }
    return result


def _extract_labels(tree: list) -> dict:
    """Return {uuid: item_dict} for net labels, global labels, hierarchical labels."""
    result = {}
    for kind in ('label', 'global_label', 'hierarchical_label', 'net_label'):
        for item in _get_all(tree, kind):
            uid = _uuid(item)
            if not uid:
                continue
            x, y = _at(item)
            # label text is typically the second atom
            text = item[1] if len(item) > 1 and isinstance(item[1], str) else ''
            result[uid] = {
                'type': kind,
                'uuid': uid,
                'x': x,
                'y': y,
                'text': text,
            }
    return result


def _extract_texts(tree: list) -> dict:
    """Return {uuid: item_dict} for text annotations."""
    result = {}
    for item in _get_all(tree, 'text'):
        uid = _uuid(item)
        if not uid:
            continue
        x, y = _at(item)
        text = item[1] if len(item) > 1 and isinstance(item[1], str) else ''
        result[uid] = {
            'type': 'text',
            'uuid': uid,
            'x': x,
            'y': y,
            'text': text,
        }
    return result


def _extract_sheets(tree: list) -> dict:
    """Return {uuid: item_dict} for hierarchical sheet pins."""
    result = {}
    for item in _get_all(tree, 'sheet'):
        uid = _uuid(item)
        if not uid:
            continue
        x, y = _at(item)
        sheet_file = _property(item, 'Sheet file') or ''
        sheet_name = _property(item, 'Sheet name') or ''
        result[uid] = {
            'type': 'sheet',
            'uuid': uid,
            'x': x,
            'y': y,
            'sheet_file': sheet_file,
            'sheet_name': sheet_name,
        }
    return result


def _extract_all(tree: list) -> dict:
    items = {}
    items.update(_extract_symbols(tree))
    items.update(_extract_labels(tree))
    items.update(_extract_texts(tree))
    items.update(_extract_sheets(tree))
    return items


# ---------------------------------------------------------------------------
# Diff computation
# ---------------------------------------------------------------------------

_COMPARABLE_KEYS = {
    'symbol': ['reference', 'value', 'footprint', 'lib_id', 'x', 'y'],
    'label': ['text', 'x', 'y'],
    'global_label': ['text', 'x', 'y'],
    'hierarchical_label': ['text', 'x', 'y'],
    'net_label': ['text', 'x', 'y'],
    'text': ['text', 'x', 'y'],
    'sheet': ['sheet_file', 'sheet_name', 'x', 'y'],
}


def _item_changes(old: dict, new: dict) -> dict:
    """Return {field: {old, new}} for fields that differ."""
    changes = {}
    keys = _COMPARABLE_KEYS.get(old['type'], [])
    for k in keys:
        ov, nv = old.get(k), new.get(k)
        if ov != nv:
            changes[k] = {'old': ov, 'new': nv}
    return changes


def diff_schematics(old_content: str, new_content: str) -> dict:
    """
    Compare two .kicad_sch file contents and return a structured diff.

    Returns:
        {
            added:   [item_dict, ...],
            removed: [item_dict, ...],
            changed: [{item: item_dict, changes: {field: {old,new}}}, ...],
        }
    """
    old_tree = _parse_sexp(old_content)
    new_tree = _parse_sexp(new_content)

    old_items = _extract_all(old_tree)
    new_items = _extract_all(new_tree)

    old_uuids = set(old_items)
    new_uuids = set(new_items)

    added = [new_items[uid] for uid in (new_uuids - old_uuids)]
    removed = [old_items[uid] for uid in (old_uuids - new_uuids)]
    changed = []

    for uid in old_uuids & new_uuids:
        changes = _item_changes(old_items[uid], new_items[uid])
        if changes:
            changed.append({'item': new_items[uid], 'changes': changes})

    return {
        'added': added,
        'removed': removed,
        'changed': changed,
    }


# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------

def _git_root(project_path: Path) -> Path:
    """Return the git repository root for project_path."""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--show-toplevel'],
            cwd=project_path,
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            return Path(result.stdout.strip())
    except Exception:
        pass
    return project_path


def _read_file_at_commit(repo_root: Path, commit: str, rel_path: str) -> Optional[str]:
    """Return file content at a given commit using a path relative to the repo root."""
    try:
        result = subprocess.run(
            ['git', 'show', f'{commit}:{rel_path}'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
        )
        if result.returncode == 0:
            return result.stdout
    except Exception:
        pass
    return None


def _find_all_sch_paths(repo_root: Path, commit: str) -> list:
    """Return all repo-root-relative .kicad_sch paths in the commit tree."""
    try:
        result = subprocess.run(
            ['git', 'ls-tree', '-r', '--name-only', commit],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
        return [l for l in result.stdout.splitlines() if l.endswith('.kicad_sch')]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def get_schematic_diff(project_id: str, commit1: str, commit2: str) -> Optional[dict]:
    """
    Return interactive diff data for all schematic sheets between two commits.

    Returns:
        {
            commit1: str,
            commit2: str,
            sheets: [
                {
                    filename: str,          # bare filename, e.g. "top.kicad_sch"
                    old_content: str|None,
                    new_content: str|None,
                    diff: { added, removed, changed },  # empty lists if one side missing
                },
                ...
            ],
        }
    or None if the project or no schematics can be found.
    """
    projects = get_registered_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        return None

    project_path = Path(project.path)
    repo_root = _git_root(project_path)

    paths1 = set(_find_all_sch_paths(repo_root, commit1))
    paths2 = set(_find_all_sch_paths(repo_root, commit2))
    all_paths = paths1 | paths2

    if not all_paths:
        return None

    sheets = []
    for rel_path in sorted(all_paths):
        filename = rel_path.split('/')[-1]
        old_content = _read_file_at_commit(repo_root, commit1, rel_path) if rel_path in paths1 else None
        new_content = _read_file_at_commit(repo_root, commit2, rel_path) if rel_path in paths2 else None

        if old_content and new_content:
            diff = diff_schematics(old_content, new_content)
        elif new_content:
            # Sheet added — all items are "added"
            tree = _parse_sexp(new_content)
            items = list(_extract_all(tree).values())
            diff = {'added': items, 'removed': [], 'changed': []}
        elif old_content:
            # Sheet removed — all items are "removed"
            tree = _parse_sexp(old_content)
            items = list(_extract_all(tree).values())
            diff = {'added': [], 'removed': items, 'changed': []}
        else:
            continue

        sheets.append({
            'filename': filename,
            'old_content': old_content,
            'new_content': new_content,
            'diff': diff,
        })

    if not sheets:
        return None

    return {
        'commit1': commit1,
        'commit2': commit2,
        'sheets': sheets,
    }
