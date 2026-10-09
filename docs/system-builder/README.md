# System Builder

**Status: in development on `feature/system-builder`. Not in any release.**
Tracking issue: [#166](https://github.com/krishna-swaroop/KiCAD-Prism/issues/166).

System Builder binds an interface control document (ICD) to the revisioned
KiCad sources it describes, so a board revision cannot silently break a
system-level connection.

A **system** groups instances of Prism projects. Each instance is pinned to an
accepted commit and can track a branch. Prism extracts the connectors of each
instance as **ports**. Users connect ports with **links** and map pins inside
each link, either by hand or by importing an existing ICD spreadsheet.

When a tracked branch advances, Prism compares the new schematic against what
every connected pin was accepted as:

- If nothing a connection depends on changed, the baseline advances on its
  own.
- If something did change, Prism opens a review listing the affected
  connections. The user can accept the change, remap the pin, or stay pinned
  to the older revision.

Around that record a system has a multi-board 3D view (placement, harness
routing, collision check, STEP export), harnesses down to manufacturing
outputs, systems of systems through the catalog, sub-ports, net rename
proposals, findings with waivers, snapshots, and a Git-tracked manifest.

## Documents

- [User guide](USER_GUIDE.md): the workspace, building and connecting a
  system, the 3D view, harness outputs, reviews, findings, snapshots, the ICD,
  publishing and Git tracking.
- [Contracts](CONTRACTS.md) (P1): identity, the interface artifact, drift and
  auto-accept rules, the HTTP API, CSV and ICD formats, and the fixture
  acceptance matrix.
- [P2 contracts](CONTRACTS_P2.md): systems of systems, catalog assemblies and
  modules, exports, system nets, placement and 3D, harnesses, Git tracking,
  sub-ports, renames, parts and collisions, STEP and harness outputs, and the
  `prism.system_manifest.v1` format
  ([JSON Schema](schemas/system_manifest.v1.schema.json),
  [examples](examples/)). Extends the P1 contracts.

## Not covered

System Builder does not check signal direction, voltage domains or logic
levels, current ratings, connector keying, shielding, or impedance and length
matching (see the guide's "What the checks do not cover"). It works on KiCad
projects only, has no per-board variant selection, and never edits a board.
