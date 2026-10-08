# Fabrication viewer

A fabrication package as a board: layers with the Visualizer's menu, top and
bottom, pan and zoom, the drill table, and pick-and-place parts. Read `AGENTS.md`
at the repository root first; the backend half is in
`backend/app/services/AGENTS.md`.

The viewer knows nothing about where a package comes from. `types.ts`
`FabricationSource` carries the URLs, and `sources.ts` builds them for a Release
Studio build and for a committed output folder. Add a new source there, not
inside the viewer. Key the viewer on `source.key`: a new package is a new
component, so no state has to reset itself.

## It is built from the existing viewers' parts

Look and behavior are meant to match the Visualizer and Design Comparison, so
reuse before adding:

- **Layer list:** `PcbLayerList` and `PcbLayerSwatch` from
  `frontend/src/components/ecad-viewer-controls.tsx`, the same rows (swatch, name, eye,
  click to highlight) and the same preset menu labels and order.
- **Pane:** `Pane` from `frontend/src/components/design-comparison/fabrication-panel.tsx`, the pane
  Design Comparison draws its fabrication layers in. It takes `mirrored`.
- **Camera:** `useBoardViewport` from `frontend/src/components/design-comparison/fabrication-viewport.ts`.
- **Toolbar and footer:** Compare's layout: title and subtitle on the left,
  bordered segmented groups on the right, a footer strip with the selection and
  the zoom. Zoom step is 1.4.
- **Colours:** KiCad's own, chosen in `backend/app/services/fabrication_view_service.py`, so a layer is
  the same colour as in the Visualizer.

If one of these changes, the viewer should follow it.

## Modules

- `fabrication-viewer.tsx`: composition. Owns the viewport so a picked part can
  move the camera.
- `viewer-state.ts`: pure reducer for the side, visible layers, highlighted layer,
  selected part and markers. Test changes here without rendering.
- `layers-rail.tsx`: the Visualizer-style rail: presets and the layer list, a little
  narrower than the Visualizer's.
- `viewer-toolbar.tsx`, `viewer-footer.tsx`: the strips above and below the board.
- `board-canvas.tsx`, `part-markers.tsx`, `part-status.ts`: the stacked layers,
  the parts over them, and the BOM-check vocabulary they and the table share.
- `use-fabrication-data.ts`, `use-placement.ts`: loading. Layer SVGs are fetched
  the first time a layer is shown, then kept; object URLs are revoked on unmount.
- `drill-table.tsx`, `placement-panel.tsx`: the two table views.
- `fabrication-dialog.tsx`: the viewer in a dialog, for file lists.

## Traps

- **Layers are fully opaque and never blended.** This is a viewer, not a comparison:
  you are meant to see each layer as it is. The backend returns each layer as its
  colour where plotted and transparent elsewhere, and `paintOrder` in
  `viewer-state.ts` stacks them farthest first: from the top the top side is painted
  last, from the bottom the bottom side is, and annotation, the profile and the
  holes go over everything. An earlier version used `screen`, then `lighten`
  blending; both mixed overlapping layers so a layer stopped matching its swatch
  (silkscreen over red copper went near-white). Do not reintroduce a blend mode.
  Only highlighting fades the other layers.
- **The bottom view mirrors the whole pane.** `useBoardViewport` takes `mirrorX`
  and `Pane` takes `mirrored`, so dragging and zoom-to-cursor still follow the
  pointer; text drawn inside the pane (marker labels) must be flipped back.
- **Fit to the board with a margin** (`withMargin`). Fitting the profile exactly
  puts its edges on the pane border, where they are clipped.
- **A press on a marker is a pick, not a drag.** The pane captures the pointer to
  pan, so markers stop `pointerdown` from reaching it.
- **Parts not in the BOM are not drawn** (unless picked); the table still lists
  them. There is no filter menu: the toolbar's Parts button is the switch.
- **Marker colours are fixed, not theme tokens.** The pane is dark in every
  theme. Flagged parts also get a ring, so colour is never the only cue. Everything
  outside the pane uses theme tokens.
- **Wide tables need `min-w-0` all the way up.** Without it a table widens the
  whole viewer past its panel instead of scrolling.
- A missing position file is normal. A 404 from the placement route means "no
  Placement view", not an error.
