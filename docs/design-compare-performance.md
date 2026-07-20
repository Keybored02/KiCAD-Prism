# Design compare performance

Design comparison builds per-commit revision assets (semantic index, geometry,
stackup, BOM), then diffs them. Cold builds on large boards were dominated by
kicad-monkey PCB materialization and a second full-file geometry re-parse, and
base/head ran sequentially after in-process parallelism OOM'd uvicorn workers.

## Changes (2026-07)

| Area | Change |
| --- | --- |
| kicad-monkey | Pinned to **2026.7.17** (sexpr tokenizer + PCB projection/net lookup perf) |
| Semantic index | Uses `to_netlist_json()` then a single `design.pcb` walk for UUID indexes |
| Geometry | PCB sidecars emit from monkey objects; schematic keeps sexpr fallback |
| BOM | `kicad-cli sch export bom` overlaps geometry/stackup on a worker thread |
| Parallel revisions | Base ∥ head via **subprocess** workers (`PRISM_DESIGN_COMPARE_PARALLEL=1`, default on). Kill switch: `=0`. Host semaphore prevents stacked dual-builds. |
| Cache | Schema `prism.design_compare_revision_v4`; soft reuse of commit-keyed visualizer semantic-index when present |
| Telemetry | Job logs include `snapshot_ms`, `semantic_ms`, `geometry_ms`, `bom_ms`, `stackup_ms`, `parallel_revisions_ms`, `diff_ms`, `job_total_ms` |

## Env

| Variable | Default | Role |
| --- | --- | --- |
| `PRISM_DESIGN_COMPARE_PARALLEL` | `1` | `0` forces sequential revision builds |
| `PRISM_DESIGN_COMPARE_CHILD_TIMEOUT` | `900` | Seconds per child revision build |
| `PRISM_DESIGN_COMPARE_CACHE` | `/tmp/prism_design_compare_cache` | Revision cache root |

## How to measure (JTYU-OBC)

1. Clear compare cache for the project (or bump schema / monkey version).
2. Start a cold compare of two commits.
3. Poll job logs for stage timings. Expect:
   - Cold dual-miss wall ≈ `max(base, head)` when parallel is on, not `sum`.
   - `PCB geometry from monkey` in logs (no second full PCB text parse for PCB items).
   - `semantic_ms` benefiting from monkey 2026.7.17 parser work on large boards.

Warm compares should mostly show `Cache hit` / `revision_total_ms` in the low milliseconds per commit.
