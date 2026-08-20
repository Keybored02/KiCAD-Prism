# Design comparison performance work

Branch: `perf/compare-parser`

This document records the performance work done on the design comparison
pipeline, from clicking "compare" to the boards being drawn on screen. It
covers what was measured, what was changed, and the numbers before and after.

## Goal

Cut the time between clicking compare and seeing the two revisions rendered,
across the whole path (backend job, network, and the browser render), not just
one stage. The target was large, repeatable wins, not small savings.

## Test setup

All numbers below are from the satnogs board (`satnogs-comms-hardware`), a
9.3 MB `.kicad_pcb` with ten schematic sheets and real git history. The commit
pair compared is `ba85605` (base) against `d848b0c` (head), which changes the
board and nine of the ten sheets, so both sides actually parse.

Two measurement tools were used:

- A backend harness that runs the comparison job in process and reads the
  structured benchmark it already writes (per-stage timings, thread-aware).
- A browser harness (Playwright) that drives the real app, triggers a compare
  by URL, and reads the timing events the app already emits when tracing is on
  (`?compareDebug=1`), including the viewer's own parse-and-paint time.

The browser harness and its dependency are kept local only. They are not part
of this branch or the pull request.

## What the measurements showed

The comparison parses the same board more than once:

1. Backend schematic index, built with kicad-monkey.
2. Backend object delta, built with the vendored ecad-viewer parser in Node.
3. Browser render, built with the same ecad-viewer parser in the viewer, once
   per side.

kicad-monkey is a third-party package and covers only the first of those
three. It is not the dominant cost end to end.

Baseline, satnogs, PCB comparison:

| Path                    | Before |
| ----------------------- | ------ |
| Cold backend job        | ~17 s  |
| Warm backend job        | ~3.5 s |
| Full click-to-pixels, cold | ~32 s |
| Full click-to-pixels, warm | ~19 s |

Breakdown of the warm click-to-pixels time (~19 s):

- ~5.5 s before the viewer starts (backend job, status polling, file download).
- ~10 s in the viewer preparing and painting both 9 MB boards.

The raw s-expression parse of a board is only about 250 ms. The viewer's ~10 s
is model construction, the WebGL scene build, and diff overlay preparation, not
parsing. That is the largest single remaining cost and is the next target. It
is not addressed by the changes below.

## Changes

### 1. Cache the parsed object index per commit

Commit: `dabbeb3` — `scripts/ecad-parse.mjs`, `scripts/ecad-parse.test.mjs`

The object delta re-parsed both board snapshots on every comparison, even when
the same commit pair was compared again, at roughly 1.2 s per board. A snapshot
lives under a per-commit cache directory and does not change once written, so
its parse result is stable.

`index_snapshot` now fingerprints the files it would read (path, size, mtime)
plus the parser schema, and rehydrates a cached index when the fingerprint
matches instead of re-parsing. Rehydrating is about 0.15 s versus 1.2 s, roughly
eight times faster per board. The cache file sits next to the snapshot
directory. A cache write failure never fails the comparison; it just re-parses
next time. It can be turned off with `ECAD_INDEX_CACHE=0`.

Result on satnogs: warm comparison 3.5 s to 2.0 s; the object delta stage 3.1 s
to 1.6 s. The delta output is byte-for-byte identical to the uncached path.

### 2. Skip the wasted board parse in schematic-only builds

Commit: `056879d` — `backend/app/services/semantic_index_service.py`

Each revision's schematic index is built with `include_pcb=False`, because the
board is handled separately. The upstream (pip) build of kicad-monkey has no
such switch, so its part-placement projection lazily parsed the entire 9 MB
board anyway, only to discard it, on both revisions. That board parse was about
25 s of otherwise pointless work.

On the upstream fallback, when the caller does not want board data, the board is
now detached before the design JSON is built, so the projection skips it. The
board is still parsed once, separately, by the stages that need it. The
optimized build of kicad-monkey, which honours the switch, is unaffected.

Result on satnogs: schematic index build 16.2 s to 5.0 s; cold comparison end to
end 17.2 s to 11.7 s. The schematic, PCB, and BOM change counts are identical
before and after (1065 / 683 / 49).

### 3. Poll fast, then back off

Commit: `5172a18` — `frontend/src/components/design-comparison/use-design-compare-job.ts`

The client polled the job status at a flat 800 ms. A warm comparison finishes in
a couple of seconds and its first usable result lands sooner, so the viewer
could sit idle for up to 800 ms after the backend was already done.

Polling now starts at 150 ms and widens by 1.4x up to 800 ms. Quick completions
are noticed almost immediately, while a long cold job still settles to the old
rate and does not hammer the status endpoint.

Result on satnogs, warm PCB: the viewer starts preparing about 1.8 s sooner
(around 5.5 s down to around 3.7 s).

### 4. Compress large responses

Commit: `e8649f6` — `backend/app/main.py`

The API served everything uncompressed. KiCad source files are the heaviest
payloads and compress about five times (9.3 MB down to 1.95 MB). The comparison
viewer downloads one board per side, and the large JSON comparison result
compresses well too.

Added gzip middleware with a 1 KB minimum size, so any client that accepts gzip
gets it and any client that does not still gets the plain body. This helps every
large response across the API, not only the comparison path.

Verified: the asset endpoint returns `content-encoding: gzip` when gzip is
accepted and the full identity body when it is not.

## Combined result

Backend comparison job on satnogs (`ba85605`..`d848b0c`):

| Path | Before | After |
| ---- | ------ | ----- |
| Cold | ~17 s  | ~10.5 s |
| Warm | ~3.5 s | ~1.6 s  |

Full click-to-pixels on the same board (PCB tab), measured in the browser with
all four changes live:

| Stage | Before (warm) | After (warm) |
| ----- | ------------- | ------------ |
| Click to viewer starts | ~5.5 s | ~6.6 s* |
| Viewer prepare (parse and paint) | ~10 s | ~6 s** |
| Full wall (click to painted) | ~19 s | ~16.4 s |

\* The board download is now about 1.1 s per side (1.9 MB gzipped) instead of
about 4 s per side (9 MB uncompressed). The rest of the pre-viewer time is the
backend job (about 0.4 s warm), sidecar fetches (about 0.2 s), and the viewer
element mounting and settling.

\*\* The viewer prepare time varies with machine load; the stable warm figure is
about 6 s for the PCB and about 2 s for a schematic. This work did not change
the viewer, so the drop from the first ~10 s reading reflects a quieter machine,
not a code change. It remains the largest single cost and is the next target.

## Correctness

- Object delta output is byte-for-byte identical with the index cache on and
  off.
- Schematic, PCB, and BOM change counts are identical before and after the
  board-parse change.
- 45 Node parser and diff tests pass, including three new tests covering the
  index cache (a hit reproduces the parse, an edit invalidates it, and the
  environment toggle disables it).
- 87 backend semantic and comparison tests pass.
- 236 frontend design-comparison tests pass.

## Files changed

    backend/app/main.py                                              |  7 +
    backend/app/services/semantic_index_service.py                   | 12 +-
    frontend/src/components/design-comparison/use-design-compare-job.ts | 17 +-
    scripts/ecad-parse.mjs                                           | 115 +-
    scripts/ecad-parse.test.mjs                                      | 63 +-

## Still open

- The viewer's prepare step (parse, model build, WebGL scene, diff overlay) is
  about 10 s for a 9 MB PCB and is now the largest single cost from click to
  pixels. It lives in the vendored ecad-viewer, which is ours to change. Profile
  it to see where the time goes before optimizing.
- The board download is one full file per side. With compression in place the
  transfer is smaller, but there may be room to avoid fetching the same content
  twice or to stream it.
