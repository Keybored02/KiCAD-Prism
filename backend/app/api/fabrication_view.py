"""Fabrication viewer for committed output files (the Assets Portal source).

Release Studio serves the package of a build; this serves the Gerber and drill
files a project keeps in its manufacturing outputs, from the working tree or at a
commit.  Same view model, same viewer: only where the bytes come from differs.
Mounted at ``/api/projects``.
"""

from __future__ import annotations

import os
import posixpath
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from app.api import projects as projects_api
from app.api._helpers import (
    get_project_for_role_or_404,
    require_output_type,
    resolve_path_within_root,
)
from app.core.security import AuthenticatedUser, require_viewer
from app.services.placement_service import (
    PlacementError,
    parse_bom,
    parse_positions,
)
from app.services.placement_service import build_view as build_placement_view
from app.services.fabrication_view_service import (
    FabricationPackage,
    FabricationViewError,
    PackageCache,
)

router = APIRouter(dependencies=[Depends(require_viewer)])

#: Gerber (`.gbr`, KiCad's Protel `.gtl`/`.gbl`/`.gm1`/..., inner `.g1`), job file, drill.
_LAYER_FILE = re.compile(
    r"\.(gbr|gtl|gbl|gts|gbs|gto|gbo|gtp|gbp|gta|gba|gm\d|gko|g\d+|gbrjob|drl|xln)$",
    re.IGNORECASE,
)
_MAX_FILES = 80
_MAX_FILE_BYTES = 25 * 1024 * 1024

_cache = PackageCache(4)


def _clean_folder(folder: str) -> str:
    normalized = posixpath.normpath(folder.replace("\\", "/")) if folder.strip() else ""
    if normalized in ("", "."):
        return ""
    if normalized.startswith("/") or normalized == ".." or normalized.startswith("../"):
        raise HTTPException(status_code=400, detail="Invalid folder path")
    return normalized


_LAYERS = (_LAYER_FILE, "No Gerber or drill files in this folder")
_CSV_FILE = re.compile(r"\.csv$", re.IGNORECASE)
_TABLES = (_CSV_FILE, "No CSV files in this folder")


def _candidates(names_sizes: list[tuple[str, int]], kind) -> list[tuple[str, int]]:
    """The files of one kind, with the limits that keep a request bounded."""

    pattern, empty = kind
    found = [(name, size) for name, size in names_sizes if pattern.search(name)]
    if not found:
        raise HTTPException(status_code=404, detail=empty)
    if len(found) > _MAX_FILES:
        raise HTTPException(status_code=413, detail="Too many files to view as one package")
    if any(size > _MAX_FILE_BYTES for _, size in found):
        raise HTTPException(status_code=413, detail="A file in this folder is too large to view")
    return found


def _working_tree(project, output_type: str, folder: str, kind=_LAYERS):
    output_dir = projects_api._resolve_output_dir(project, output_type)
    directory = resolve_path_within_root(output_dir, folder, invalid_detail="Invalid folder path")
    if not directory.is_dir():
        raise HTTPException(status_code=404, detail="Folder not found")
    entries = [
        (entry.name, entry.stat())
        for entry in os.scandir(directory)
        if entry.is_file() and kind[0].search(entry.name)
    ]
    _candidates([(name, stat.st_size) for name, stat in entries], kind)
    signature = tuple(sorted((name, stat.st_size, stat.st_mtime_ns) for name, stat in entries))

    def read() -> dict[str, bytes]:
        return {name: (directory / name).read_bytes() for name, _ in entries}

    return signature, read


def _at_commit(project, output_type: str, folder: str, commit: str, kind=_LAYERS):
    config = projects_api._path_config_from_commit(project, commit)
    base = projects_api._join_relative_paths(
        projects_api._output_dir_from_config(config, output_type), folder
    )
    items = [
        item
        for item in projects_api._files_from_commit(project, commit, base)
        if not item.is_dir and "/" not in item.path
    ]
    found = _candidates([(item.name, item.size) for item in items], kind)
    signature = tuple(sorted(found))

    def read() -> dict[str, bytes]:
        return {
            name: projects_api._read_commit_file(
                project, commit, name, relative_prefix=base, not_found_detail="File not found"
            ).content
            for name, _ in found
        }

    return signature, read


def _folder_files(
    project_id: str,
    user: AuthenticatedUser,
    output_type: str,
    folder: str,
    commit: Optional[str],
    kind,
):
    """Signature and reader for one kind of file in a project output folder."""

    output_type = require_output_type(output_type)
    project = get_project_for_role_or_404(project_id, user.role)
    folder = _clean_folder(folder)
    return (
        _at_commit(project, output_type, folder, commit, kind)
        if commit
        else _working_tree(project, output_type, folder, kind)
    )


def _package(
    project_id: str,
    user: AuthenticatedUser,
    output_type: str,
    folder: str,
    commit: Optional[str],
) -> FabricationPackage:
    output_type = require_output_type(output_type)
    folder = _clean_folder(folder)
    signature, read = _folder_files(project_id, user, output_type, folder, commit, _LAYERS)
    key = (project_id, output_type, folder, commit or "", signature)
    cached = _cache.get(key)
    if cached is not None:
        return cached
    try:
        package = FabricationPackage.from_files(read())
    except FabricationViewError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    _cache.put(key, package)
    return package


# Plain `def`: parsing a dense board is CPU work for the threadpool, not the loop.
@router.get("/{project_id}/fabrication-view")
def get_output_fabrication_view(
    project_id: str,
    type: str = "manufacturing",
    folder: str = "",
    commit: Optional[str] = None,
    user: AuthenticatedUser = Depends(require_viewer),
):
    """Layers, board size and drill tools of the Gerber files in one folder."""

    return _package(project_id, user, type, folder, commit).view()


@router.get("/{project_id}/fabrication-view/layers/{layer_id}.svg")
def get_output_fabrication_layer(
    project_id: str,
    layer_id: str,
    type: str = "manufacturing",
    folder: str = "",
    commit: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(require_viewer),
):
    """One layer of that package as SVG, on the package's shared extent."""

    package = _package(project_id, user, type, folder, commit)
    try:
        svg = package.svg(layer_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Layer not found") from exc
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={
            # Working-tree files can change, so only a pinned commit is immutable.
            "Cache-Control": (
                "private, max-age=31536000, immutable"
                if commit and re.fullmatch(r"[0-9a-fA-F]{40}", commit)
                else "private, no-cache"
            ),
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
        },
    )


def _is_position_file(text: str) -> bool:
    try:
        parse_positions(text)
    except PlacementError:
        return False
    return True


def _pick(files: dict[str, str], wanted, prefer: re.Pattern[str]) -> Optional[str]:
    """First file `wanted` accepts, those named like `prefer` first."""

    for name in sorted(files, key=lambda item: (not prefer.search(item), item.casefold())):
        if wanted(files[name]):
            return name
    return None


_POSITION_NAME = re.compile(r"pos|cpl|place|centroid", re.IGNORECASE)
_BOM_NAME = re.compile(r"bom|parts", re.IGNORECASE)


@router.get("/{project_id}/placement")
def get_output_placement(
    project_id: str,
    type: str = "manufacturing",
    folder: str = "",
    commit: Optional[str] = None,
    user: AuthenticatedUser = Depends(require_viewer),
):
    """Parts of the position file in a folder, checked against its BOM if it has one.

    The files are found by what they contain, not by name: KiCad calls them
    ``*-pos.csv`` and ``*.csv``, the JLCPCB plugin ``CPL-*.csv`` and ``BOM-*.csv``.
    """

    _, read = _folder_files(
        project_id, user, require_output_type(type), _clean_folder(folder), commit, _TABLES
    )
    files = {name: data.decode("utf-8", errors="replace") for name, data in read().items()}
    positions = _pick(files, _is_position_file, _POSITION_NAME)
    if positions is None:
        raise HTTPException(status_code=404, detail="No position file in this folder")
    others = {name: text for name, text in files.items() if name != positions}

    def is_bom(text: str) -> bool:
        try:
            parse_bom(text)
        except PlacementError:
            return False
        return not _is_position_file(text)

    bom = _pick(others, is_bom, _BOM_NAME)
    return build_placement_view(
        files[positions],
        others[bom] if bom else None,
        positions_name=positions,
        bom_name=bom or "",
    )
