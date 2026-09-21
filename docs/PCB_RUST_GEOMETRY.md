# Rust PCB geometry backend

Prism has an opt-in Linux source-build path for PCB copper geometry. The
default remains `legacy`; set `PRISM_PCB_GEOMETRY_BACKEND=rust` to use it. An
explicit Rust selection fails closed if the helper is missing, the schema or
source digest is wrong, the pinned upstream revision differs, or the helper
reports an error diagnostic.

## Upstream boundary

The dependency is pinned to `wavenumber-eng/kicad_monkey` revision
`bc6796c1b8ce55bfbcb8b1771f3ecbc70658d34d`, engine version `2026.9.7`, with
Rust `1.95.0`. At that revision the analytic copper materializer discussed in
upstream issue 20 is not a public stable API. Prism therefore uses the public
source-backed `PcbView`, selected PCB families, resolved net references, and
`resolve_pad_copper_layer`. Conditional remove-unused-layer policy is the only
narrow exception: the public board plot document is used as a layer-presence
fact oracle, and the contract emits a diagnostic when that path is exercised.

This is distinct from upstream's packaged native provider. Windows has the
promoted packaged native application/provider path. Prism's Linux deployment
does not consume that package; it directly compiles the portable Rust library
inside its controlled worker image. Upstream's Linux/macOS packaged provider
switches remain development/test surfaces and are not production dependencies.

## Pipeline and ownership

```text
.kicad_pcb
    │
    ▼
kicad-monkey-core public source model (Rust)
    │  source scan, selected indexing, typed semantics, nets, padstacks
    ▼
prism-kicad-native (Rust, Prism-owned adapter)
    │  geometry realization + prism.pcb_geometry.v1 JSON
    ▼
existing SemanticGltfBuilder (Python orchestration)
    │  Clipper/tiling/triangulation/Meshopt
    ▼
WebGPU scene manifest and GLB tiles
```

`kicad-monkey-core` owns KiCad interpretation. Prism owns the contract,
polygonal approximation tolerance, subprocess lifecycle, strict validation,
scene ingestion, and rendering. The adapter does not contain an S-expression
or KiCad parser.

Rust currently handles board source scanning/indexing; resolved name-based and
ordinal net references; tracks and routed arcs; through/blind/buried vias and
drills; normal, round, oval, rectangular, rounded, chamfered, trapezoid, custom,
and per-layer padstack shapes; footprint transforms; filled-zone polygons and
islands; and board/layer/stackup facts. Python still loads the design/netlist for
topology and orchestrates KiCad CLI 3D export and the existing scene compiler.

## Contract and identity

The frozen v1 schema is
`kicad-prism-viewer/native/prism-kicad-native/schema/prism.pcb_geometry.v1.schema.json`.
Coordinates are integer nanometres in KiCad board axes. Rings are open; outer
and hole roles are explicit. Layer and net indexes are dense. Every drawable
and drill retains a source UID, semantic ID, net, physical layer set, footprint
UID, reference, and pad number where applicable. These fields feed the existing
object-feature table, click selection, single-net highlighting, and simultaneous
multi-net highlighting without a second semantic mapping.

## Build and operation

Docker uses a reproducible Rust builder stage and `cargo build --release
--locked`; only `/usr/local/bin/prism-kicad-native` enters the runtime image.
The Python runtime does not need a Rust toolchain.

Useful settings:

```text
PRISM_PCB_GEOMETRY_BACKEND=legacy|rust|python-copper
PRISM_KICAD_NATIVE_PATH=/usr/local/bin/prism-kicad-native
PRISM_KICAD_NATIVE_TIMEOUT_SECONDS=300
```

`python-copper` is retained only as an experimental compatibility surface. It
is not selected automatically. Rollback is immediate: set the backend to
`legacy` and restart workers. There is no silent fallback from an explicitly
selected Rust backend.

## Verification and benchmarking

The committed benchmark runner performs interleaved cold scene builds, records
wall and CPU time, peak RSS, input/intermediate/final bytes, feature/net/layer
counts, mesh size, and stage timings, then compares final semantic manifests:

```bash
backend/venv/bin/python kicad-prism-viewer/scripts/pcb_backend_benchmark.py \
  fixtures/release-studio/cynthion/cynthion.kicad_pro \
  --helper kicad-prism-viewer/native/prism-kicad-native/target/release/prism-kicad-native \
  --output /tmp/prism-pcb-benchmark --trials 3
```

The Rust contract emits warnings for unsupported primitives instead of dropping
them silently. A non-zero `unsupported_features` count, any error diagnostic,
or a contract/revision/digest mismatch blocks the Rust path.

Known intentional difference: NPTH mechanical pads do not flash copper on the
Rust path even when old source files serialize `*.Cu`; they remain explicit
non-plated drills. The legacy plotter path can retain a zero-area copper record
for such a pad. Bounds for shared USB-PD semantic objects were within the 0.005
mm curve tolerance during implementation validation.

