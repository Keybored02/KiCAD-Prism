# Postgres Component Library Rebuild

This file tracks the clean-slate rebuild of the KiCAD Prism component catalog.

## Goal

Replace the current seed-driven SQLite catalog and asset-owned workflow with a fresh Postgres-backed model where:

- components and their metadata are first-class records
- reusable assets are stored canonically on disk and linked to components
- previews are asset-scoped and reused
- metadata-only components are valid
- manual entry and CSV import work against the same backend rules
- a release workflow exists
- the current Remote Symbols panel look and Library Manager look are preserved

## Constraints

- Do not preserve old SQLite dataflow behavior
- Do not reuse seed entries
- Keep the current visual language of the Library Manager and Remote Symbols panel
- Change UI only where required for:
  - Apps & Integrations landing
  - release workflow exposure
  - import / asset attachment behavior

## Work Checklist

### 1. Runtime and configuration

- [x] Add Postgres service to `docker-compose.yml`
- [x] Add backend Postgres configuration to `backend/app/core/config.py`
- [x] Add Postgres driver dependency to `backend/requirements.txt`
- [x] Ensure backend startup waits on or can connect to Postgres cleanly

### 2. Fresh catalog model

- [x] Remove seed initialization from catalog startup
- [x] Replace the current SQLite-backed catalog service with a fresh Postgres-backed implementation
- [x] Create schema for:
  - [x] `components`
  - [x] `component_revisions`
  - [x] `assets`
  - [x] `revision_assets`
  - [x] `asset_previews`
  - [x] `oauth_auth_codes`
  - [x] `oauth_revoked_tokens`
- [x] Model reusable assets as shared records instead of component-owned files
- [x] Keep canonical on-disk storage under:
  - [x] `symbols/`
  - [x] `footprints/`
  - [x] `3dmodels/`
  - [x] `spice/`
  - [x] `previews/`
  - [x] `revisions/`

### 3. Release workflow

- [x] Add release states to revisions
- [x] Add backend transitions for:
  - [x] `draft`
  - [x] `in_review`
  - [x] `qa_approved`
  - [x] `released`
  - [x] `deprecated`
- [x] Gate Remote Symbols visibility to released components only
- [x] Gate placement to released + placeable revisions only

### 4. Manual component logic

- [x] Manual component creation should create metadata-first entries with no required assets
- [x] New manual components should default to metadata-only draft revisions
- [x] Metadata edits should create or reuse editable draft revisions
- [x] Asset attach/link operations should target revisions, not component-owned files

### 5. Shared asset logic

- [x] Rebuild symbol import to:
  - [x] normalize through `kicad-cli sym upgrade`
  - [x] allow symbol selection when a library contains multiple symbols
  - [x] create or reuse reusable symbol assets
- [x] Rebuild footprint import to:
  - [x] support `.kicad_mod`
  - [x] support zipped `.pretty`
  - [x] allow footprint selection when multiple footprints are present
  - [x] create or reuse reusable footprint assets
- [x] Rebuild 3D/SPICE import to create or reuse reusable assets
- [x] Rebuild “link existing asset” logic to resolve canonical assets instead of attaching ad hoc files
- [x] Ensure deleting a component does not delete shared canonical assets still needed by other revisions

### 6. Preview logic

- [x] Make previews asset-scoped rather than component-scoped
- [x] Generate symbol previews once per reusable symbol asset
- [x] Generate footprint previews once per reusable footprint asset
- [x] Reuse preview references in:
  - [x] Library Manager
  - [x] Remote Symbols panel

### 7. CSV import

- [x] Rebuild CSV import as validate-first / apply-second
- [x] Require mandatory columns:
  - [x] `value`
  - [x] `datasheet`
  - [x] `description`
  - [x] `manufacturer`
  - [x] `manufacturer_part_number`
- [x] Support optional canonical asset-link columns:
  - [x] `symbol_file_path`
  - [x] `symbol_target_library`
  - [x] `symbol_target_name`
  - [x] `footprint_file_path`
  - [x] `footprint_target_library`
  - [x] `footprint_target_name`
  - [x] `model_3d_file_path`
  - [x] `spice_file_path`
- [x] Upsert by `manufacturer_part_number`
- [x] Allow metadata-only imports
- [x] Keep blank asset columns from detaching existing links

### 8. Admin API surface

- [x] Rework `backend/app/api/catalog_admin.py` onto the new catalog service
- [x] Preserve current endpoint shapes where possible so current screens continue to work
- [x] Add release transition endpoints
- [x] Keep browse/link/upload asset endpoints but change their backend semantics

### 9. Remote provider API surface

- [x] Rework `backend/app/api/remote_provider.py` onto the new catalog service
- [x] Keep current panel contract shape where possible
- [x] Ensure detail and placement resolve through reusable assets
- [x] Ensure shared symbol assets still get component-specific metadata overlays during placement
- [x] Ensure preview URLs are asset-backed

### 10. Frontend routing

- [x] Change Apps & Integrations so it opens an entry screen rather than the Library Manager immediately
- [x] Add Library Manager as an app entry inside Apps & Integrations
- [x] Preserve the current visual style of Library Manager
- [x] Preserve the current Remote Symbols panel visual style

### 11. Verification

- [x] Add or replace backend tests for the new catalog service
- [ ] Verify manual metadata-only creation
- [ ] Verify shared symbol/footprint reuse across multiple components
- [ ] Verify CSV import required-column validation
- [ ] Verify released components appear in Remote Symbols
- [ ] Verify draft or incomplete components do not place
- [ ] Verify symbol metadata injection still works during placement
- [ ] Verify footprint import into KiCad `RemoteLibrary` still works

### 12. Existing KiCad library migration

- [x] Add a script to ingest KiCad-style library folders into Prism canonical storage
- [x] Split packed `.kicad_sym` libraries into one symbol per canonical file
- [x] Copy `.pretty/*.kicad_mod` footprints into canonical footprint libraries
- [x] Copy STEP/STP models into canonical `3dmodels/`
- [x] Optionally index imported canonical files into Postgres as reusable assets
- [x] Optionally generate asset-scoped previews during indexing
- [x] Generate a Prism metadata CSV from symbol properties
- [x] Include canonical asset-link columns in the generated CSV where symbol/footprint links can be inferred
- [ ] Run the importer against `EEE_KiCAD_Libraries` in the Docker backend runtime
- [ ] Upload the generated CSV through the Library Manager and verify large-catalog performance

## Notes

- This rebuild intentionally does **not** attempt to preserve the current SQLite catalog behavior.
- PLM integration is out of scope for this pass.
- Seeded catalog entries should not be reintroduced.
