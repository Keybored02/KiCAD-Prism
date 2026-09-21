# prism-kicad-native

Prism-owned Linux-friendly PCB geometry helper. It links the public
`kicad-monkey-core` source model at the exact revision in `Cargo.toml` and emits
the versioned `prism.pcb_geometry.v1` contract on stdout. Errors and diagnostics
go to stderr; non-zero exit status is fatal to an explicitly selected Rust
backend.

The helper owns no KiCad parser. Source scanning, typed family decoding, net
resolution, padstack resolution, and board/footprint semantics come from
`kicad-monkey-core`. Prism owns only geometry realization and the adapter DTO.

```bash
cargo test --locked
cargo build --release --locked
target/release/prism-kicad-native board.kicad_pcb > geometry.json
```

The frozen contract schema is
[`schema/prism.pcb_geometry.v1.schema.json`](schema/prism.pcb_geometry.v1.schema.json).
The Docker build compiles the helper in a Rust builder stage and copies only the
release binary into the Python worker image.
