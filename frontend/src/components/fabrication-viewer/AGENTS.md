# Fabrication viewer

A fabrication package as a board: layers with toggles, top and bottom, pan and
zoom, the drill table, and pick-and-place parts. Read `AGENTS.md` at the
repository root first; the backend half is in `backend/app/services/AGENTS.md`.

The viewer knows nothing about where a package comes from. `types.ts`
`FabricationSource` carries the URLs, and `sources.ts` builds them for a Release
Studio build and for a committed output folder. Add a new source there, not
inside the viewer. Key the viewer on `source.key`: a new package is a new
component, so no state has to reset itself.

## Modules

- `fabrication-viewer.tsx`: composition. Owns the viewport so a picked part can
  move the camera.
- `viewer-state.ts`: pure reducer for the side, visible layers, selected part and
  markers. Test changes here without rendering.
- `use-fabrication-data.ts`, `use-placement.ts`: loading. Layer SVGs are fetched
  the first time a layer is shown, then kept; object URLs are revoked on unmount.
- `board-canvas.tsx`, `part-markers.tsx`: the stacked layers and the parts over
  them. `layer-list.tsx`, `drill-table.tsx`, `placement-panel.tsx`: the lists.
- `fabrication-dialog.tsx`: the viewer in a dialog, for file lists.

## Traps

- **Layers are screen-blended on a dark pane.** The backend draws each on pure
  black, which is the identity for that blend. A lighter background brightens a
  little more with every layer.
- **The bottom view mirrors the whole pane.** `useBoardViewport` takes `mirrorX`
  so dragging and zoom-to-cursor still follow the pointer; text drawn inside the
  pane (marker labels) must be flipped back.
- **Fit to the board with a margin** (`withMargin`). Fitting the profile exactly
  puts its edges on the pane border, where they are clipped.
- **A press on a marker is a pick, not a drag.** The pane captures the pointer to
  pan, so markers stop `pointerdown` from reaching it.
- A missing position file is normal. A 404 from the placement route means "no
  tab", not an error.
