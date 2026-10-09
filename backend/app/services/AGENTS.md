# Backend services

This map focuses on the catalog subsystem, whose public surface spans several
large modules. Read `AGENTS.md` at the repository root first.

## Catalog layering

Three files, and the names do not tell you which to use:

| File | Role |
| --- | --- |
| `component_catalog_service.py` | Compatibility import and runtime singleton. |
| `component_catalog_service_postgres.py` | Concrete PostgreSQL connection, schema initialization, and database-specific overrides. |
| `component_catalog_domain.py` | Compatibility facade: the historical callable surface, delegating to collaborators in `catalog/`. |

`ComponentCatalogPostgresService` inherits `ComponentCatalogDomainService`,
owns PostgreSQL connection and schema setup, and passes PostgreSQL locks into
the shared collaborator graph in `catalog/collaborators.py`. The compatibility
facade owns transaction boundaries. The
behavior itself lives in `backend/app/services/catalog/`; read
`backend/app/services/catalog/AGENTS.md` for the layer map. To find where a
facade method lands, search the facade for the method name and follow the
`self._<collaborator>.` call. Public reads generally begin with `list_`,
`get_`, or `search_`.

Do not extend the inheritance split casually. When adding a cohesive capability,
first consider a narrow collaborator with a public API that both workers and
HTTP handlers can use; avoid creating another caller of private catalog methods.

## Catalog jobs

`catalog_worker_tasks.py` holds the `HANDLERS` table — the catalog worker's
equivalent of `job_handlers.py`:

`catalog_validation`, `catalog_preview_generation`, `project_component_import`,
`folder_library_import`, `artifact_maintenance`, `catalog_metadata_batch`.

The catalog wrapper restores `catalog_checkpoint` and `catalog_result` into the
legacy handler envelope and persists updates reported through `progress`.
Handlers that report checkpoints must therefore tolerate resumption and must
not duplicate completed work after a lease is reclaimed.

## Rules that live here

- **Fail closed.** `rate_limit_service.py` explains why the limiter denies on
  outage rather than allowing. Do not invert it for convenience.
- **Host keys are pinned.** `project_import_service.py` documents why
  `accept-new` was removed. Do not restore it.
- **Role-aware lookups only.** See the access-control section in the root
  `AGENTS.md`.
- **Audit identity comes from the session**, never from the request payload.

## Design variants

`project_source_snapshot.py` resolves a working tree or an exact commit and
keys it by the configured anchor; `variant_catalog_service.py` discovers the
ordered catalog from source text; `semantic_index_variants.py` resolves
effective default and per-variant occurrence/component/footprint state through
the pinned kicad-monkey helpers (applying the sheet fold and version gate the
resolver leaves to the caller); `semantic_index_service.py` publishes the
`assembly` block, joins it onto existing `componentUid`s, and hashes the three
modules into `GENERATOR_BUILD`. Resolver semantics belong to the frozen
design-variant contract packet (issue #169), not to this file.

## Design comparison

`design_compare_service.py` orchestrates; `design_compare_nodes.py` parses;
`design_compare_net_pairing.py` decides which nets correspond across
revisions; `design_compare_semantics.py` classifies and groups;
`design_compare_artifacts.py` persists output; `design_compare_sources.py`
resolves revisions. The correctness rules
for this pipeline are in
`frontend/src/components/design-comparison/AGENTS.md`, because most of the ways
to get it wrong are visible on the frontend side.

One backend rule: the viewer must never infer the old route from the comparison
object (`design_compare_nodes.py`). Each revision carries its own geometry.

## Comments and issue publication

`comments_store_service.py` owns local discussion writes; `comments_revisions.py`
and `comment_anchor_bindings.py` preserve revision and binding history.
`comment_live_events.py` appends durable metadata in the same transaction as a
mutation; `comment_live_broker.py` wakes socket readers. Keep HTTP snapshots as
content authority and never let a tracker failure prevent local discussion.

`trackers/provider_registry.py` selects provider capabilities. Promotion,
reply/thread/state executors, webhook inboxes, and polling live under
`trackers/`; provider-specific operations must not be hard-coded in generic
handlers. Read `docs/TRACKER_INTEGRATION.md` and
`docs/tracker-integration/CONTRACTS.md` before changing credential, idempotency,
remote recovery, or authorization behavior.

## Fabrication viewer

`fabrication_view_service.py` turns a set of Gerber and drill files into a view
model and one SVG per layer; `placement_service.py` parses a position file and a
BOM and checks one against the other. Both are pure: files in, view out. The
routes that feed them are all in `backend/app/api/fabrication_view.py`: a
Release Studio build's dossier, and a folder of committed outputs. Keep them
together; the Release Studio router is upstream's and carries none of this.

The parsing and drawing belong to `fabrication_compare_service.py`, which is
grandfathered at its current length and must not grow. New behavior goes in the
new modules; reach into the old one by module attribute rather than copying.

Rules that are easy to break:

- **Gerber and position files are Y-up; the board frame is Y-down.** The flip is
  done once, in the SVG renderer and in `placement_service.build_view`. Do not
  flip again downstream.
- **A declared layer function wins.** File names are read only for files with no
  Gerber X2 function (`fabrication_view_service._classify_by_name`).
- **Match columns by meaning, not by name.** KiCad and the JLCPCB plugin name the
  same columns differently, and a JLCPCB BOM has a `Designator` column, so a
  position file is recognised by having coordinates, not by its name.
- **A layer SVG is its colour, fully opaque, where plotted and transparent elsewhere.**
  A layer with nothing cleared (most of them) is drawn in its colour directly. Only a
  layer with clear polarity, or an aperture with a hole, is drawn white-on-black as a
  mask with the colour filled through it, so the cut shows what is behind instead of
  painting black. A mask costs the browser a second drawing, so it is used only then.
  The viewer stacks the layers; nothing is blended, and no SVG carries `opacity`.
- **Bump `RENDER_VERSION` whenever `svg()` draws differently.** Build layers are
  cached by the browser for a year as immutable, and the viewer puts the version in
  every layer URL. Without the bump, a browser keeps the old drawing: after the
  switch to opaque stacking, cached SVGs with a black background hid every layer
  under the last one painted.
- **A drawn line is at least 1.5 screen pixels wide.** `with_minimum_stroke` adds a
  `width` media-query ladder to each layer SVG: an image SVG evaluates those against
  its own rendered width, so the SVG can size its minimum line to the zoom without
  the viewer telling it. Without it a 0.1 mm silkscreen or outline line is under a
  pixel at fit zoom and renders dimmer than its swatch. Only polylines (and drill
  circles) are widened; pads, vias and aperture-macro lines keep their true size.
