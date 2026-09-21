#!/usr/bin/env python3
"""Benchmark and compare Prism's legacy and Rust PCB geometry backends."""

from __future__ import annotations

import argparse
import json
import os
import platform
import resource
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any


SCHEMA = "prism.pcb_backend_benchmark.v1"
VIEWER_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = VIEWER_ROOT.parent


def _rss_bytes(value: int) -> int:
    return int(value if sys.platform == "darwin" else value * 1024)


def _run_trial(
    project: Path,
    backend: str,
    helper: Path,
    output_root: Path,
    trial: int,
) -> tuple[dict[str, Any], dict[str, Any]]:
    logs = output_root / "logs"
    logs.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"{project.stem}-{backend}-", dir=output_root) as temp:
        run_root = Path(temp)
        artifact_dir = run_root / "artifact"
        metrics_path = run_root / "metrics.json"
        cache_dir = run_root / "cache"
        log_path = logs / f"{project.stem}-{backend}-{trial}.log"
        env = os.environ.copy()
        env["PYTHONPATH"] = os.pathsep.join(
            value
            for value in (str(VIEWER_ROOT), env.get("PYTHONPATH", ""))
            if value
        )
        env["PRISM_PCB_GEOMETRY_BACKEND"] = backend
        env["PRISM_KICAD_NATIVE_PATH"] = str(helper)
        env["PRISM_TOPOLOGY_COMPILER_METRICS_PATH"] = str(metrics_path)
        command = [
            sys.executable,
            "-m",
            "pipeline.topology_compiler",
            "from-project",
            str(project),
            "--output",
            str(artifact_dir),
            "--scope",
            "3d",
            "--force-rebuild",
            "--clean-cache",
            "--cache-dir",
            str(cache_dir),
        ]
        started = time.perf_counter()
        with log_path.open("w", encoding="utf-8") as log:
            process = subprocess.Popen(
                command,
                cwd=REPO_ROOT,
                env=env,
                stdout=log,
                stderr=subprocess.STDOUT,
            )
            while True:
                child, status, usage = os.wait4(process.pid, os.WNOHANG)
                if child:
                    process.returncode = os.waitstatus_to_exitcode(status)
                    break
                time.sleep(0.02)
        wall_ms = (time.perf_counter() - started) * 1000.0
        if process.returncode != 0:
            raise RuntimeError(
                f"{backend} trial {trial} failed with exit code {process.returncode}; see {log_path}"
            )
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        manifest = json.loads(
            (artifact_dir / "scene-gltf" / "scene.manifest.json").read_text(encoding="utf-8")
        )
        inventory = json.loads(
            (artifact_dir / "artifact-manifest.json").read_text(encoding="utf-8")
        )
        node_metrics = next(
            (
                event.get("node_metrics") or {}
                for event in metrics.get("profileEvents", [])
                if event.get("stage") == "semantic_gltf.node_builder"
            ),
            {},
        )
        geometry_stats = dict(node_metrics.get("geometry_stats") or {})
        input_json_bytes = next(
            (
                int(event.get("input_json_bytes") or 0)
                for event in metrics.get("profileEvents", [])
                if event.get("stage") == "semantic_gltf.serialize_input"
            ),
            0,
        )
        result = {
            "backend": backend,
            "trial": trial,
            "wall_ms": wall_ms,
            "cpu_ms": (usage.ru_utime + usage.ru_stime) * 1000.0,
            "peak_rss_bytes": _rss_bytes(usage.ru_maxrss),
            "source_bytes": project.with_suffix(".kicad_pcb").stat().st_size,
            "intermediate_bytes": input_json_bytes,
            "feature_count": len(manifest.get("objectFeatures") or ()) - 1,
            "net_count": len(manifest.get("nets") or ()) - 1,
            "layer_count": len(manifest.get("layers") or ()),
            "final_asset_bytes": int(inventory.get("totalBytes") or 0),
            "mesh_bytes": int(geometry_stats.get("output_bytes") or 0),
            "source_polygons": int(geometry_stats.get("source_polygons") or 0),
            "triangles": int(geometry_stats.get("triangles") or 0),
            "timings_ms": {
                key: value
                for key, value in metrics.items()
                if key.endswith("_ms") and isinstance(value, (int, float))
            },
            "native_metrics": next(
                (
                    event
                    for event in metrics.get("profileEvents", [])
                    if event.get("stage") == "context.rust_geometry_contract"
                ),
                None,
            ),
            "log": str(log_path),
        }
        return result, manifest


def _signature(manifest: dict[str, Any]) -> dict[tuple[str, str, str, str], list[float] | None]:
    net_names = {int(item["id"]): str(item.get("name") or "") for item in manifest["nets"]}
    layer_names = {int(item["id"]): str(item.get("name") or "") for item in manifest["layers"]}
    return {
        (
            str(item.get("sourceUid") or ""),
            str(item.get("kind") or ""),
            net_names.get(int(item.get("netId") or 0), ""),
            layer_names.get(int(item.get("layerId") or 0), ""),
        ): item.get("boundsMm")
        for item in manifest["objectFeatures"][1:]
    }


def _parity(legacy: dict[str, Any], rust: dict[str, Any]) -> dict[str, Any]:
    left = _signature(legacy)
    right = _signature(rust)
    shared = left.keys() & right.keys()
    bound_differences = [
        (
            max(
                abs(float(a) - float(b))
                for a, b in zip(left[key] or (), right[key] or ())
            ),
            key,
            left[key],
            right[key],
        )
        for key in shared
        if left[key] and right[key]
    ]
    bound_differences.sort(key=lambda item: item[0], reverse=True)
    bound_deltas = [item[0] for item in bound_differences]
    legacy_only = sorted(left.keys() - right.keys())
    rust_only = sorted(right.keys() - left.keys())
    legacy_blank = sum(
        not str(item.get("sourceUid") or "") for item in legacy["objectFeatures"][1:]
    )
    rust_blank = sum(
        not str(item.get("sourceUid") or "") for item in rust["objectFeatures"][1:]
    )
    return {
        "passed": not legacy_only and not rust_only and max(bound_deltas, default=0.0) <= 0.005,
        "shared_identities": len(shared),
        "legacy_only_count": len(legacy_only),
        "rust_only_count": len(rust_only),
        "legacy_only_examples": [list(item) for item in legacy_only[:50]],
        "rust_only_examples": [list(item) for item in rust_only[:50]],
        "legacy_blank_source_identity_count": legacy_blank,
        "rust_blank_source_identity_count": rust_blank,
        "max_shared_bounds_delta_mm": max(bound_deltas, default=0.0),
        "largest_shared_bounds_differences": [
            {
                "delta_mm": delta,
                "identity": list(key),
                "legacy_bounds_mm": legacy_bounds,
                "rust_bounds_mm": rust_bounds,
            }
            for delta, key, legacy_bounds, rust_bounds in bound_differences[:20]
        ],
        "net_names_match": [item.get("name") for item in legacy["nets"]]
        == [item.get("name") for item in rust["nets"]],
        "layer_names_match": [item.get("name") for item in legacy["layers"]]
        == [item.get("name") for item in rust["layers"]],
        "barrel_identities_match": {
            (item.get("sourceUid"), item.get("kind"), item.get("netId"))
            for item in legacy.get("barrels", [])
        }
        == {
            (item.get("sourceUid"), item.get("kind"), item.get("netId"))
            for item in rust.get("barrels", [])
        },
    }


def _median(trials: list[dict[str, Any]]) -> dict[str, Any]:
    keys = (
        "wall_ms",
        "cpu_ms",
        "peak_rss_bytes",
        "source_bytes",
        "intermediate_bytes",
        "feature_count",
        "net_count",
        "layer_count",
        "final_asset_bytes",
        "mesh_bytes",
        "source_polygons",
        "triangles",
    )
    result = {key: statistics.median(float(item[key]) for item in trials) for key in keys}
    timing_keys = sorted({key for item in trials for key in item["timings_ms"]})
    result["timings_ms"] = {
        key: statistics.median(float(item["timings_ms"].get(key, 0.0)) for item in trials)
        for key in timing_keys
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("projects", nargs="+", type=Path)
    parser.add_argument("--helper", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--trials", type=int, default=3)
    args = parser.parse_args()
    if args.trials < 3:
        parser.error("--trials must be at least 3")
    helper = args.helper.resolve()
    if not helper.is_file() or not os.access(helper, os.X_OK):
        parser.error(f"helper is not executable: {helper}")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    reports = []
    for raw_project in args.projects:
        project = raw_project.resolve()
        trials: dict[str, list[dict[str, Any]]] = {"legacy": [], "rust": []}
        manifests: dict[str, dict[str, Any]] = {}
        for trial in range(args.trials):
            for backend in ("legacy", "rust"):
                measured, manifest = _run_trial(project, backend, helper, output, trial)
                trials[backend].append(measured)
                manifests[backend] = manifest
                print(
                    f"{project.name} {backend} trial {trial + 1}/{args.trials}: "
                    f"{measured['wall_ms']:.1f} ms",
                    flush=True,
                )
        medians = {backend: _median(values) for backend, values in trials.items()}
        legacy_wall = medians["legacy"]["wall_ms"]
        rust_wall = medians["rust"]["wall_ms"]
        reports.append(
            {
                "project": str(project),
                "trials": trials,
                "medians": medians,
                "wall_improvement_percent": ((legacy_wall - rust_wall) / legacy_wall) * 100.0,
                "parity": _parity(manifests["legacy"], manifests["rust"]),
            }
        )
    report = {
        "schema": SCHEMA,
        "environment": {
            "platform": platform.platform(),
            "python": sys.version,
            "helper": str(helper),
        },
        "methodology": {
            "trials": args.trials,
            "cache": "cold semantic scene cache per trial; KiCad CLI export cache unchanged",
            "order": "legacy then rust, interleaved per trial",
        },
        "boards": reports,
    }
    destination = output / "pcb-backend-benchmark.json"
    destination.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
