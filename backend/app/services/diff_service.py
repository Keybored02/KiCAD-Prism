"""
Native Visual Diff Service

Generates visual diffs between commits using local kicad-cli.
"""

import logging
import os
import subprocess
import threading
import uuid
import shutil
import time
import json
import re
from pathlib import Path
from typing import Optional, List, Dict
from app.services.project_service import find_schematic_file
from app.services.workspace_service import workspace
from app.services import bom_diff_service

try:
    import cairosvg
    _CAIROSVG_AVAILABLE = True
except ImportError:
    _CAIROSVG_AVAILABLE = False

SVG_TO_PNG_DPI = 150  # ~2000px wide for a typical A4 schematic

# Global job store
# Structure: { job_id: { ... } }
diff_jobs: Dict[str, dict] = {}

# Configuration
MAX_JOB_AGE_SECONDS = 3600 * 24  # 24 hours

DIFF_CACHE_DIR = Path("/tmp/prism_diff")

_cache_loaded = False

def _load_cached_jobs():
    """Scan disk for previously completed jobs and populate diff_jobs."""
    global _cache_loaded
    if _cache_loaded:
        return
    _cache_loaded = True
    if not DIFF_CACHE_DIR.exists():
        return
    for job_dir in DIFF_CACHE_DIR.iterdir():
        if not job_dir.is_dir():
            continue
        job_meta = job_dir / "job.json"
        if not job_meta.exists():
            continue
        try:
            with open(job_meta, "r") as f:
                meta = json.load(f)
            job_id = job_dir.name
            if job_id not in diff_jobs:
                diff_jobs[job_id] = meta
                print(f"[diff cache] restored job {job_id[:8]} key={meta.get('cache_key')}", flush=True)
        except Exception as e:
            print(f"[diff cache] failed to restore job from {job_dir}: {e}", flush=True)

import platform

def _get_cli_command() -> str:
    """Find valid kicad-cli command across different OS platforms."""
    # 1. Check environment variable override
    env_path = os.environ.get("KICAD_CLI_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    # 2. Check PATH
    cli_name = "kicad-cli.exe" if platform.system() == "Windows" else "kicad-cli"
    if shutil.which(cli_name):
        return cli_name
    
    # 3. Check common OS-specific installation paths
    system = platform.system()
    paths_to_check = []

    if system == "Darwin": # macOS
        paths_to_check = [
            "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli",
            os.path.expanduser("~/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli")
        ]
    elif system == "Windows":
        # Check standard C:\Program Files paths, possibly trying different versions
        program_files = os.environ.get("ProgramFiles", "C:\\Program Files")
        kicad_root = Path(program_files) / "KiCad"
        if kicad_root.exists():
            # Try to find the latest version bin folder
            # Usually KiCad/8.0/bin/kicad-cli.exe
            versions = sorted([d for d in kicad_root.iterdir() if d.is_dir()], reverse=True)
            for v in versions:
                candidate = v / "bin" / "kicad-cli.exe"
                if candidate.exists():
                    paths_to_check.append(str(candidate))
        
        # Fallback to direct path if version detection fails
        paths_to_check.append(f"{program_files}\\KiCad\\8.0\\bin\\kicad-cli.exe")
        paths_to_check.append(f"{program_files}\\KiCad\\7.0\\bin\\kicad-cli.exe")

    elif system == "Linux":
        paths_to_check = [
            "/usr/bin/kicad-cli",
            "/usr/local/bin/kicad-cli",
            # Flatpak fallback
            "/var/lib/flatpak/exports/bin/org.kicad.KiCad" 
        ]
    
    for path in paths_to_check:
        if os.path.exists(path):
            return path
            
    # Fallback to default name
    return cli_name

logger = logging.getLogger(__name__)

CLI_CMD = _get_cli_command()
logger.info("[%s] Resolved kicad-cli: %s", platform.system(), CLI_CMD)


def _prune_stale_diff_dirs() -> None:
    """Remove diff output directories older than MAX_JOB_AGE_SECONDS."""
    diff_root = Path("/tmp/prism_diff")
    if not diff_root.is_dir():
        return
    cutoff = time.time() - MAX_JOB_AGE_SECONDS
    pruned = 0
    for child in diff_root.iterdir():
        if not child.is_dir():
            continue
        try:
            if child.stat().st_mtime < cutoff:
                shutil.rmtree(child, ignore_errors=True)
                pruned += 1
        except OSError:
            pass
    if pruned:
        logger.info("Pruned %d stale diff job(s) from %s", pruned, diff_root)


# Prune on module load (once per worker startup)
_prune_stale_diff_dirs()


def _find_kicad_pro_file(directory: Path) -> Optional[Path]:
    try:
        if not directory.exists(): return None
        for file in directory.iterdir():
            if file.suffix == ".kicad_pro":
                return file
    except OSError:
        pass
    return None

def _find_kicad_pcb_file(directory: Path) -> Optional[Path]:
    try:
        if not directory.exists(): return None
        for file in directory.iterdir():
            if file.suffix == ".kicad_pcb":
                return file
    except OSError:
        pass
    return None

def _cleanup_job(job_id: str):
    """Remove a job directory and entry."""
    if job_id in diff_jobs:
        job = diff_jobs[job_id]
        if job.get('status') == 'running':
            # Don't delete running jobs to avoid race conditions with tar/kicad-cli
            job['status'] = 'failed'
            job['error'] = 'Job cancelled by user'
            return

        output_dir = job.get('abs_output_path')
        if output_dir and os.path.exists(output_dir):
            try:
                # Give background threads a moment to finish current syscalls
                time.sleep(0.5) 
                shutil.rmtree(output_dir)
            except Exception as e:
                print(f"Error cleaning up job {job_id}: {e}")
        del diff_jobs[job_id]

def delete_job(job_id: str):
    """Public method to delete a job."""
    _cleanup_job(job_id)

def _snapshot_commit(project_path: Path, commit: str, destination: Path):
    """Snapshot a commit into destination using git archive."""
    destination.mkdir(parents=True, exist_ok=True)
    
    # git archive --format=tar commit | tar -x -C destination
    tar_cmd = ["git", "archive", "--format=tar", commit]
    
    # Run in repo root
    p1 = subprocess.Popen(tar_cmd, cwd=project_path, stdout=subprocess.PIPE)
    p2 = subprocess.Popen(["tar", "-x", "-C", str(destination)], stdin=p1.stdout)
    p1.stdout.close()
    p2.wait()
    
    if p2.returncode != 0:
        raise Exception(f"Failed to extract snapshot for {commit}")

def _get_pcb_layers(pcb_path: Path) -> List[str]:
    """
    Extract active layer names from the .kicad_pcb file.

    KiCad 8 renamed several layers (e.g. F.SilkS -> F.Silkscreen). Older PCB
    files may list both the old and new canonical names in their layers table.
    Passing duplicates to kicad-cli causes it to exit with code 1 and no
    stderr, so we deduplicate by always preferring the canonical (new) name.
    """
    # Map of legacy alias -> canonical KiCad 8 name
    _ALIASES: Dict[str, str] = {
        "F.SilkS":   "F.Silkscreen",
        "B.SilkS":   "B.Silkscreen",
        "F.Adhes":   "F.Adhesive",
        "B.Adhes":   "B.Adhesive",
        "F.CrtYd":   "F.Courtyard",
        "B.CrtYd":   "B.Courtyard",
        "Dwgs.User": "User.Drawings",
        "Cmts.User": "User.Comments",
        "Eco1.User": "User.Eco1",
        "Eco2.User": "User.Eco2",
    }

    if not pcb_path.exists():
        return []

    try:
        with open(pcb_path, 'r', encoding='utf-8', errors='ignore') as f:
            head = f.read(20000)

        layers_match = re.search(r'\(layers\s+(.*?)\s+\(setup', head, re.DOTALL)
        if not layers_match:
            layers_match = re.search(r'\(layers\s+(.*?)\n\s+\)', head, re.DOTALL)

        if layers_match:
            block = layers_match.group(1)
            raw = re.findall(r'"([^"]+)"', block)
            if raw:
                # Normalise: replace any legacy alias with its canonical name,
                # then deduplicate while preserving order.
                seen: set = set()
                result: List[str] = []
                for name in raw:
                    canonical = _ALIASES.get(name, name)
                    if canonical not in seen:
                        seen.add(canonical)
                        result.append(canonical)
                return result

    except Exception as e:
        print(f"Error parsing PCB layers: {e}")

    return ["F.Cu", "B.Cu", "F.Silkscreen", "B.Silkscreen", "F.Mask", "B.Mask", "Edge.Cuts"]
    

def _colorize_and_rasterize(svg_path: Path, color: str) -> Path:
    """
    Colorize an SVG (replace black with color) then convert it to a PNG.
    Returns the PNG path. The original SVG is deleted afterwards to save space.
    Falls back to keeping the SVG if cairosvg is unavailable.
    """
    if not svg_path.exists():
        return svg_path

    content = svg_path.read_text(encoding="utf-8")

    pattern = r'(stroke|fill)="(?:\#000000|\#000|black|rgb\(0,\s*0,\s*0\))"'
    content = re.sub(pattern, lambda m: f'{m.group(1)}="{color}"', content)
    style_pattern = r'(fill|stroke):(?:\#000000|\#000|black|rgb\(0,\s*0,\s*0\))'
    content = re.sub(style_pattern, f'\\1:{color}', content)

    if _CAIROSVG_AVAILABLE:
        png_path = svg_path.with_suffix(".png")
        cairosvg.svg2png(
            bytestring=content.encode("utf-8"),
            write_to=str(png_path),
            dpi=SVG_TO_PNG_DPI,
        )
        svg_path.unlink(missing_ok=True)
        return png_path
    else:
        svg_path.write_text(content, encoding="utf-8")
        return svg_path

def _run_diff_generation(job_id: str, project_id: str, commit1: str, commit2: str):
    """Execute diff generation in background."""
    job = diff_jobs[job_id]

    def _log(msg: str):
        print(f"[diff:{job_id[:8]}] {msg}", flush=True)
        job['logs'].append(msg)

    try:
        # 1. Setup paths
        row = workspace.get_project_by_id(project_id)
        if not row:
            raise ValueError(f"Project '{project_id}' not found")

        project_path = Path(row['path'])
        job_dir = (Path("/tmp/prism_diff") / job_id).resolve()
        job_dir.mkdir(parents=True, exist_ok=True)
        job['abs_output_path'] = str(job_dir)

        _log(f"Started diff job for {project_id}")
        _log(f"Output directory: {job_dir}")
        
        manifest = {
            "job_id": job_id,
            "commit1": commit1,
            "commit2": commit2,
            "schematic": True,
            "pcb": True,
            "bom": None,
        }
        
        # Load Config from Commit 1 (New) if exists
        def get_config(directory: Path):
            config_path = directory / ".prism.json"
            if config_path.exists():
                try:
                    return json.loads(config_path.read_text(encoding="utf-8"))
                except Exception as e:
                    _log(f"Warning: Failed to parse .prism.json: {e}")
            return {}

        # 1. Snapshot commits
        c1_dir = job_dir / commit1
        c2_dir = job_dir / commit2

        _log(f"Snapshotting commit {commit1}...")
        _snapshot_commit(project_path, commit1, c1_dir)

        _log(f"Snapshotting commit {commit2}...")
        _snapshot_commit(project_path, commit2, c2_dir)


        # We need to process both commits to ensure we catch files present in one but not other?
        # For simplicity, we scan both, but usually we iterate over the "New" structure 
        # or we just process both folders independently.
        
        # Define colors
        # Commit 1 (New) = GREEN
        # Commit 2 (Old) = RED
        COLOR_NEW = "#00AA00" # Slightly darker green for visibility on white
        COLOR_OLD = "#FF0000"
        
        # Per-commit sch output dirs, captured for the post-loop union.
        sch_dirs: Dict[str, Path] = {}

        for commit, directory, color in [(commit1, c1_dir, COLOR_NEW), (commit2, c2_dir, COLOR_OLD)]:
            # 1. Locate design files
            # Use the path-config-resolved root so kicad-cli walks the full
            # hierarchy. Picking an arbitrary .kicad_sch via rglob would miss
            # subsheets not reachable from that match.
            main_sch_str = find_schematic_file(str(directory))
            sch_file = Path(main_sch_str) if main_sch_str else None
            if sch_file and not sch_file.exists():
                sch_file = None

            pcb_file = next(directory.rglob("*.kicad_pcb"), None)

            # 2. Export Schematics
            if sch_file:
                sch_out_dir = directory / "sch"
                sch_out_dir.mkdir(exist_ok=True)
                sch_dirs[commit] = sch_out_dir
                _log(f"Exporting Schematics for {commit}...")

                cmd = [
                    CLI_CMD, "sch", "export", "svg",
                    "--black-and-white",
                    "--output", str(sch_out_dir),
                    str(sch_file)
                ]
                _log(f"SCH CMD: {' '.join(cmd)}")
                res = subprocess.run(cmd, capture_output=True, text=True)

                if res.returncode == 0:
                    for svg in list(sch_out_dir.glob("*.svg")):
                        _colorize_and_rasterize(svg, color)
                    if commit == commit1:
                        manifest["schematic"] = True
                else:
                    _log(f"SCH Export FAILED (Code {res.returncode})")
                    _log(f"STDERR: {res.stderr}")
            else:
                _log(f"No root .kicad_sch resolved for {commit}")

            # 3. Export PCB Layers (one call per layer — compatible with KiCad 8 and 9)
            if pcb_file:
                pcb_out_dir = directory / "pcb"
                pcb_out_dir.mkdir(exist_ok=True)
                all_layers = _get_pcb_layers(pcb_file)
                _log(f"Exporting {len(all_layers)} PCB layers for {commit}...")

                found_layers = []
                for layer in all_layers:
                    safe = layer.replace(".", "_")
                    out_svg = pcb_out_dir / f"{safe}.svg"
                    cmd = [
                        CLI_CMD, "pcb", "export", "svg",
                        "--layers", layer,
                        "--black-and-white",
                        "--exclude-drawing-sheet",
                        "--page-size-mode", "2",
                        "--output", str(out_svg),
                        str(pcb_file)
                    ]
                    res = subprocess.run(cmd, capture_output=True, text=True)
                    if res.returncode == 0 and out_svg.exists():
                        final = _colorize_and_rasterize(out_svg, color)
                        found_layers.append(final.name)  # e.g. "F_Cu.png" or "F_Cu.svg"
                    else:
                        _log(f"Layer {layer} FAILED (code {res.returncode}): {res.stderr.strip()}")

                _log(f"PCB export done: {len(found_layers)}/{len(all_layers)} layers succeeded")
                if commit == commit1:
                    manifest["layers"] = sorted(found_layers)
            else:
                _log(f"No .kicad_pcb found for {commit}")

        # Publish the union of emitted filenames across both commits so sheets
        # added/removed in one commit still appear. Match both SVG (cairosvg
        # unavailable fallback) and PNG (normal case).
        sheet_union: set = set()
        for d in sch_dirs.values():
            for ext in ("*.png", "*.svg"):
                sheet_union.update(p.name for p in d.glob(ext))
        if sheet_union:
            manifest["sheets"] = sorted(sheet_union)

        # 4. BoM Diff
        _log("Generating BoM Diff...")
        try:
            config = get_config(c1_dir)
            bom_fields = config.get("bom", {}).get("fields", ["Reference", "Value", "Footprint", "Datasheet"])

            bom_csvs = {}
            for commit, directory in [(commit1, c1_dir), (commit2, c2_dir)]:
                main_sch_str = find_schematic_file(str(directory))
                sch_file = Path(main_sch_str) if main_sch_str else None
                if sch_file and sch_file.exists():
                    csv_path = directory / "bom.csv"
                    cmd = [
                        CLI_CMD, "sch", "export", "bom",
                        "--fields", ",".join(bom_fields),
                        "--output", str(csv_path),
                        str(sch_file)
                    ]
                    res = subprocess.run(cmd, capture_output=True, text=True)
                    if res.returncode == 0 and csv_path.exists():
                        bom_csvs[commit] = csv_path.read_text(encoding="utf-8")
                    else:
                        _log(f"BoM export failed for {commit}: {res.stderr}")
                else:
                    _log(f"Skipping BoM export for {commit}: no root .kicad_sch resolved")

            if commit1 in bom_csvs and commit2 in bom_csvs:
                old_bom = bom_diff_service.parse_bom_csv(bom_csvs[commit2])
                new_bom = bom_diff_service.parse_bom_csv(bom_csvs[commit1])
                diff_results = bom_diff_service.diff_boms(old_bom, new_bom, bom_fields)
                manifest["bom"] = diff_results
                _log("BoM Diff generated successfully.")
            else:
                _log("Skipping BoM Diff: Could not generate CSVs for both commits.")

        except Exception as e:
            _log(f"Error generating BoM diff: {e}")

        # Write manifest and logs
        log_path = job_dir / "logs.txt"
        log_path.write_text("\n".join(job['logs']), encoding="utf-8")

        with open(job_dir / "manifest.json", "w") as f:
            json.dump(manifest, f, indent=2)

        job['status'] = 'completed'
        job['message'] = 'Ready'
        job['percent'] = 100
        _log("Diff generation complete.")
        log_path.write_text("\n".join(job['logs']), encoding="utf-8")

        # Persist job metadata so it survives process restarts
        job_meta = {k: v for k, v in job.items() if k != 'logs'}
        with open(job_dir / "job.json", "w") as f:
            json.dump(job_meta, f)

    except Exception as e:
        job['status'] = 'failed'
        job['error'] = str(e)
        _log(f"Critical Error: {str(e)}")
        if 'job_dir' in locals() and job_dir.exists():
            (job_dir / "logs.txt").write_text("\n".join(job['logs']), encoding="utf-8")


def _make_cache_key(project_id: str, commit1: str, commit2: str) -> str:
    """Stable cache key — commit pair is sorted so order doesn't matter."""
    a, b = sorted([commit1, commit2])
    return f"{project_id}:{a}:{b}"


def start_diff_job(project_id: str, commit1: str, commit2: str) -> str:
    """
    Start async diff job, or return an existing completed job for the same
    project + commit pair (cache hit avoids re-running kicad-cli exports).
    """
    _load_cached_jobs()
    cache_key = _make_cache_key(project_id, commit1, commit2)

    # Look for a completed job whose output directory still exists on disk
    print(f"[diff cache] lookup key={cache_key}, total_jobs={len(diff_jobs)}", flush=True)
    for existing_id, job in list(diff_jobs.items()):
        jck = job.get("cache_key")
        jst = job.get("status")
        jap = job.get("abs_output_path")
        jex = Path(jap).exists() if jap else False
        print(f"[diff cache]   job={existing_id[:8]} key={jck} status={jst} path_exists={jex}", flush=True)
        if (
            jck == cache_key
            and jst == "completed"
            and jap
            and jex
        ):
            print(f"[diff cache] HIT for {cache_key} -> {existing_id[:8]}", flush=True)
            return existing_id
    print(f"[diff cache] MISS for {cache_key}", flush=True)

    job_id = str(uuid.uuid4())
    diff_jobs[job_id] = {
        "status": "running",
        "message": "Initializing...",
        "percent": 0,
        "created_at": time.time(),
        "project_id": project_id,
        "commit1": commit1,
        "commit2": commit2,
        "cache_key": cache_key,
        "logs": [],
        "error": None,
        "abs_output_path": None,
    }

    thread = threading.Thread(
        target=_run_diff_generation,
        args=(job_id, project_id, commit1, commit2)
    )
    thread.daemon = True
    thread.start()

    return job_id

def get_job_status(job_id: str) -> Optional[dict]:
    return diff_jobs.get(job_id)

def get_manifest(job_id: str):
    job = diff_jobs.get(job_id)
    if not job or job['status'] != 'completed':
        return None
    
    path = Path(job['abs_output_path']) / "manifest.json"
    if path.exists():
        with open(path, 'r') as f:
            return json.load(f)
    return None

def get_asset_path(job_id: str, asset_path: str) -> Optional[Path]:
    job = diff_jobs.get(job_id)
    if not job or job['status'] != 'completed':
        return None
        
    root = Path(job['abs_output_path'])
    full_path = root / asset_path
    
    # Security check
    try:
        if root in full_path.resolve().parents:
            if full_path.exists():
                return full_path
    except Exception:
        pass
    return None
