"""Diff the working tree against HEAD, the changes you haven't committed yet.

The web app can only ever show *committed* history, because that's all the backend
can see. The interesting changes while you're actually working in KiCad are the
ones still on disk. This computes them locally: old side = the blob at HEAD, new
side = the file as it currently sits on disk.

The parse/diff itself reuses the backend's `pcb_diff_service` / `sch_diff_service`
rather than reimplementing them. Those modules are pure-stdlib at their core, the
`diff_pcb(old, new)` / `diff_schematics(old, new)` entry points take plain strings.
Their *module-level* imports pull in GitPython and the workspace DB, neither of
which the agent wants, so we load them by path with those two names stubbed out.
That's a bit of machinery, but the alternative is a second copy of ~2000 lines of
diff logic that would silently drift from the one the web UI uses, and then the
plugin and the web app would disagree about the same board.
"""

from __future__ import annotations

import importlib.util
import logging
import subprocess
import sys
import types
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from .diff_grouping import Group, group_file_diff
from .projects import _run_git

log = logging.getLogger(__name__)

# Only these two extensions carry structured, item-level diffs. Everything else
# in a commit is reported as a plain file change.
SCH_EXT = ".kicad_sch"
PCB_EXT = ".kicad_pcb"

# Guard against pathological boards making the plugin hang.
_MAX_BYTES = 40 * 1024 * 1024


def _backend_services_dir() -> Path:
    """Where the backend's diff services live.

    Two very different situations:

    Frozen, the services are BUNDLED INTO the binary (build_agent.py copies them
    in), because the user has a plugin zip and no repo. Resolving a path relative
    to the source tree there would find nothing, the import would fail, and the
    diff would silently degrade to file-level rows: a board full of edits reported
    as "1 changed file" and no detail. That's the failure this branch exists to
    prevent.

    From a checkout, walk up to the repo and use the real backend source, so a dev
    editing pcb_diff_service sees the effect immediately without rebuilding.
    """
    base = getattr(sys, "_MEIPASS", None)
    if base:
        return Path(base) / "backend_services"
    return Path(__file__).resolve().parents[2] / "backend" / "app" / "services"


@lru_cache(maxsize=1)
def _load_noise_classifier():
    """The backend's is_noise(), loaded the same way as the diff services.

    Shared rather than duplicated on purpose: the web history and the plugin's
    change list must agree on what counts as a KiCad backup, or a file hidden in
    one place and shown in the other is just confusing. Two copies of these
    patterns would drift the first time KiCad changes a suffix.
    """
    services = _backend_services_dir()
    path = services / "kicad_noise_service.py"
    if not path.is_file():
        log.warning("kicad_noise_service not found; nothing will be flagged as noise")
        return None
    try:
        return _load_by_path("app.services.kicad_noise_service", path)
    except Exception:
        log.warning("couldn't load the noise classifier", exc_info=True)
        return None


def _is_noise(path: str) -> bool:
    mod = _load_noise_classifier()
    # No classifier means show everything: better a noisy list than a silently
    # incomplete one.
    return bool(mod and mod.is_noise(path))


@lru_cache(maxsize=1)
def _load_diff_services() -> tuple[types.ModuleType | None, types.ModuleType | None]:
    """Import the backend diff services without their backend dependencies.

    Returns (sch, pcb), or (None, None) if the backend source isn't alongside us
    (e.g. the plugin installed standalone). Callers degrade to file-level changes.
    """
    services = _backend_services_dir()
    if not services.is_dir():
        return None, None

    try:
        # The diff cores never call these; they're only used by the higher-level,
        # project-scoped helpers we don't touch. Stub them so the imports resolve.
        _stub_module("git", Repo=None)
        _stub_module("app")
        _stub_module("app.services")
        _stub_module("app.services.workspace_service", workspace=None)
        _stub_kicad_monkey()

        sch = _load_by_path(
            "app.services.sch_diff_service", services / "sch_diff_service.py"
        )
        pcb = _load_by_path(
            "app.services.pcb_diff_service", services / "pcb_diff_service.py"
        )
        return sch, pcb
    except Exception:
        # A missing/renamed backend module must not take the agent down; the
        # caller falls back to file-level changes. But log it, degrading to
        # "no item detail" without a word looks like the board simply has no
        # changes, which is worse than an error.
        log.warning("couldn't load the backend diff services", exc_info=True)
        return None, None


def _stub_kicad_monkey() -> None:
    """Let the PCB diff run without kicad_monkey installed.

    pcb_diff_service imports it lazily to render text glyphs to polylines, purely
    to get an *exact* bounding box for text items. That box drives the web
    viewer's highlight rectangles, the agent doesn't draw anything, it just needs
    to know *which* items changed, and identity doesn't depend on the glyph
    outlines.

    kicad_monkey only lives in the backend's venv, so without this the agent
    silently produces zero PCB groups on any Python that isn't the backend's, a
    board full of edits would report "no changes". Falling back to a coarse box is
    the right trade: the item list stays exactly right.
    """
    if "kicad_monkey" in sys.modules:
        return
    try:
        import kicad_monkey  # noqa: F401

        return  # the real thing is available; use it
    except ImportError:
        pass

    class _Renderer:
        def render_text_polylines(self, text, ax, ay, size_x, size_y, **_kw):
            # A single-line box roughly the size of the text. Enough for a bbox;
            # never used for rendering.
            if not text:
                return []
            half_w = 0.5 * size_x * len(text) * 0.7
            half_h = 0.5 * size_y
            return [
                [
                    (ax - half_w, ay - half_h),
                    (ax + half_w, ay - half_h),
                    (ax + half_w, ay + half_h),
                    (ax - half_w, ay + half_h),
                ]
            ]

    _stub_module("kicad_monkey")
    font = types.ModuleType("kicad_monkey.kicad_stroke_font")
    font.get_renderer = _Renderer
    sys.modules["kicad_monkey.kicad_stroke_font"] = font
    setattr(sys.modules["kicad_monkey"], "kicad_stroke_font", font)


def _stub_module(name: str, **attrs) -> None:
    """Register a placeholder module, unless the real one is already importable."""
    if name in sys.modules:
        return
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    if name == "app.services":
        # Make `app.services.x` resolvable as an attribute of `app`.
        setattr(sys.modules["app"], "services", mod)
    sys.modules[name] = mod


def _load_by_path(name: str, path: Path) -> types.ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(name)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


@dataclass
class FileChange:
    """One changed file, with its item-level groups when we can compute them."""

    path: str  # repo-relative
    filename: str  # basename
    status: str  # added | removed | modified
    kind: str  # pcb | sch | other
    groups: list[Group]
    # KiCad's own droppings, backup archives, -bak files, autosaves, caches. Tagged
    # rather than dropped: the UI collapses them behind a count, so nothing vanishes
    # without a trace. A file that silently disappears from a change list is worse
    # than one that's merely noisy, it's a lie about the state of the repo.
    noise: bool = False

    def to_dict(self) -> dict:
        return {
            "path": self.path,
            "filename": self.filename,
            "status": self.status,
            "kind": self.kind,
            "noise": self.noise,
            "groups": [
                {
                    "id": g.id,
                    "kind": g.kind,
                    "label": g.label,
                    "category": g.category,
                    "category_label": g.category_label,
                    "item_id": g.item_id,
                    "count": g.count,
                }
                for g in self.groups
            ],
        }


def _read_head(repo: Path, rel: str) -> str | None:
    """The file's content at HEAD, or None if it isn't tracked there (new file)."""
    try:
        kwargs = {}
        if sys.platform == "win32":
            kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]
        out = subprocess.run(
            ["git", "-C", str(repo), "show", f"HEAD:{rel}"],
            capture_output=True,
            check=True,
            timeout=30,
            **kwargs,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
        return None
    return out.stdout.decode("utf-8", errors="replace")


def _read_disk(repo: Path, rel: str) -> str | None:
    f = repo / rel
    try:
        if not f.is_file() or f.stat().st_size > _MAX_BYTES:
            return None
        return f.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


def _changed_paths(repo: Path) -> list[tuple[str, str]]:
    """(status, repo-relative path) for everything not committed.

    Uses `git status --porcelain`, which reports staged *and* unstaged changes,
    both are "uncommitted" as far as the user is concerned. The format is column
    oriented (" M path"), so the output must not be stripped.
    """
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    try:
        lines = _run_git(repo, "status", "--porcelain", strip=False).splitlines()
    except Exception:
        return out

    for line in lines:
        if not line.strip():
            continue
        code, name = line[:2], line[3:].strip()
        # Renames read as "old -> new"; the new path is what's on disk.
        if " -> " in name:
            name = name.split(" -> ", 1)[1]
        name = name.strip('"')
        if name in seen:
            continue
        seen.add(name)

        if code == "??" or "A" in code:
            status = "added"
        elif "D" in code:
            status = "removed"
        else:
            status = "modified"
        out.append((status, name))
    return out


def uncommitted_changes(
    repo_root: str | Path, scope: str | Path | None = None
) -> list[dict]:
    """Every uncommitted change, with item-level detail for boards and schematics.

    `scope` (a project directory) restricts the result to that subtree, which
    matters in a monorepo holding several KiCad projects.
    """
    repo = Path(repo_root)
    if not repo.is_dir():
        return []

    scope_rel: str | None = None
    if scope:
        try:
            scope_rel = Path(scope).resolve().relative_to(repo.resolve()).as_posix()
        except ValueError:
            scope_rel = None  # scope outside the repo, don't filter

    sch_mod, pcb_mod = _load_diff_services()
    changes: list[FileChange] = []

    for status, rel in _changed_paths(repo):
        if (
            scope_rel
            and scope_rel not in ("", ".")
            and not rel.startswith(scope_rel + "/")
        ):
            continue

        name = Path(rel).name
        noise = _is_noise(rel)

        # A backup archive holds a *copy* of the board, so diffing it would find
        # hundreds of "changes" that are really just the old design, expensive to
        # compute and actively misleading. Never diff noise.
        if noise:
            changes.append(FileChange(rel, name, status, "other", [], noise=True))
            continue

        if rel.endswith(SCH_EXT):
            kind, mod, diff_fn = "sch", sch_mod, "diff_schematics"
        elif rel.endswith(PCB_EXT):
            kind, mod, diff_fn = "pcb", pcb_mod, "diff_pcb"
        else:
            changes.append(FileChange(rel, name, status, "other", []))
            continue

        groups = _diff_one(repo, rel, status, mod, diff_fn) if mod else []
        changes.append(FileChange(rel, name, status, kind, groups))

    # Boards and schematics first, they're what the user came to see. Noise last,
    # regardless of type.
    rank = {"sch": 0, "pcb": 1, "other": 2}
    changes.sort(key=lambda c: (c.noise, rank[c.kind], c.path))
    return [c.to_dict() for c in changes]


def _diff_one(
    repo: Path, rel: str, status: str, mod: types.ModuleType, diff_fn: str
) -> list[Group]:
    """Item-level groups for one file. Never raises, a diff failure degrades to
    a bare file row rather than losing the whole listing."""
    try:
        old = None if status == "added" else _read_head(repo, rel)
        new = None if status == "removed" else _read_disk(repo, rel)

        if old and new:
            diff = getattr(mod, diff_fn)(old, new)
        elif new or old:
            # Whole file added or removed: extract its items and report them all
            # as one-sided. Mirrors the backend's _enrich_with_diff.
            content = new or old
            extract = (
                mod._extract_all_pcb if diff_fn == "diff_pcb" else mod._extract_all
            )
            parse = sys.modules["app.services.sch_diff_service"]._parse_sexp
            items = list(extract(parse(content)).values())
            side = "added" if new else "removed"
            diff = {"added": [], "removed": [], "changed": [], side: items}
        else:
            return []

        return group_file_diff(diff)
    except Exception:
        # A diff failure on one file shouldn't lose the whole listing, the user
        # still gets a file-level row. Log it, though: silently showing "no
        # changes" for a board the user just edited is a lie, and we want to know.
        log.warning("diff failed for %s", rel, exc_info=True)
        return []
