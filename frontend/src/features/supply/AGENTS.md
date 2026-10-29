# Supply UI

The screens for distributor stock, prices and lifecycle: the Supply section,
the project Supply tab, supply in the BOM, the catalog and Release Studio, and
the Connectors and Review pages in Library Manager. Read `AGENTS.md` at the
repository root first. Every figure here is worked out by the backend
(`backend/app/services/supply/AGENTS.md`); this directory shows it.

## Rules

- **The UI computes no supply figure.** Stock totals, status, boards
  buildable, cost per board, findings and forecasts come from the API as they
  are. A screen that needs a new figure gets it from the backend, so the
  Dashboard, the project tab, the BOM and the KiCad panel never disagree.
- **No prose.** No helper sentences or explaining hover hints; labels,
  numbers and states only. If a screen needs a paragraph, the screen is wrong.
- **One wording.** Status, lifecycle, problem and packaging labels come from
  `supply-format.ts` (`STATUS_LABEL`, `LIFECYCLE_LABEL`, `PROBLEM_LABEL`,
  `packagingName`); prices from `formatPrice`, stock from `formatStock`. Never
  spell a status or format a price in a component.
- **Roles gate on the client and the server.** `canOpenSupply` (`@/lib/roles`)
  decides whether supply shows at all; the server still checks every call, so
  a hidden button is a courtesy, not the control.
- **The URL holds the place.** `section=supply` with `supplyView` (the tab),
  `part` (the open part sheet), `partsScope`, `partsQ`, `partsOnly` and
  `partsSort` on Tracking. `supply-views.ts` maps old addresses (`parts`,
  `overview`, `market`, `connectors`, `review`) to where they live now; keep
  old addresses working when a place moves.

## Module groups

**Section and navigation** — `supply-workspace.tsx` (the four tabs:
Dashboard, Tracking, Projects, Insights, each lazy-loaded), `supply-views.ts`
(`resolvePlace`, `partHref`, the Library Manager places),
`use-supply-navigation.ts`, `open-part-sheet.tsx`. Mounted by
`frontend/src/components/workspace.tsx`.

**API and loading** — `supply-api.ts` is the typed client for `/api/supply`
(errors are `ApiHttpError`); `tracking-api.ts`, `inventory-api.ts`,
`ending-api.ts`, `fill-api.ts`, `packaging-api.ts`, `release-check-api.ts`,
`catalog-supply-api.ts` and `component-supply-api.ts` cover their areas.
Types are hand-written in `frontend/src/types/supply.ts`; change them with the
backend's response. `use-loaded.ts` loads by key and, with `cacheAs`, starts
from what `loaded-cache.ts` kept for the tab's lifetime so a return to Supply
doesn't flash a skeleton. `frontend/src/test/setup.ts` clears that cache
between tests.

**Dashboard** — `dashboard-view.tsx` with `dashboard-tiles.tsx`,
`dashboard-charts.tsx`, `dashboard-risk-cards.tsx`, `dashboard-forecast.tsx`,
`dashboard-inbox.tsx` (the inbox, ranked by `backend/app/services/supply/inbox.py`), `dashboard-alerts.tsx`, `ending-notifications.tsx`,
`recent-changes.tsx`.

**Tracking and the part sheet** — `parts-view.tsx`, `parts-table.tsx`,
`parts-filters.ts`, `parts-sort.ts`, `parts-layout.ts`; the sheet is
`part-sheet.tsx` with `part-detail-sections.tsx`, `part-history*.ts(x)`,
`part-offer-rows.tsx`, `listing-*.tsx`, `outlook-section.tsx`,
`forecast-section.tsx`, `notices-section.tsx`, `compliance-section.tsx`,
`alert-rules-section.tsx`. Tracking a part: `watch-part-dialog.tsx`,
`watch-popover.tsx`, `tracking-control.tsx` (tiers). The BOM file check is
`bom-file-*.ts(x)`.

**Projects** — `projects-view.tsx` and `project-groups.tsx` (every tracked
project); the project's own tab is `project-supply-tab.tsx`, mounted by
`frontend/src/pages/ProjectDetailPage.tsx`, with `project-headline.tsx`,
`project-cost-*.tsx`, `project-parts-list.tsx`, `project-read-now.tsx`.
Tracking a project is the `track-*.tsx` dialog steps and
`use-track-project.ts`. The project cards' chip is `project-supply-chip.tsx`
(`useBuildAnswers`).

**Insights** — `insights-view.tsx`, `insights-sections.tsx`,
`insights-shown.ts` (which sections have data), `runway-*.tsx`,
`market-*.ts(x)`, `sourcing-panel.tsx`, `scorecard-table.tsx`,
`forecast-insights.tsx`.

**Library Manager pages** — `library-connectors-view.tsx` and
`connectors-view.tsx` (connector cards, `create-connector-dialog.tsx`,
`edit-connector-dialog.tsx`, `connector-signin.tsx`, `csv-upload-dialog.tsx`,
`budget-view.tsx`), `inventory-sources.tsx` and `inventory-source-dialogs.tsx`
(InvenTree-compatible stores), `settings-view.tsx` and `settings-*.tsx`
(Supply settings), `library-review-view.tsx` and `review-view.tsx` (Review).
Mounted by `frontend/src/components/workspace/library-manager-workspace.tsx`.
Each form mounts only while its dialog is open, so it resets without effects;
connector form rules live in `connector-form-model.ts`, not in components.

**Supply elsewhere** — BOM columns and the row drawer (`bom-supply*.ts(x)`,
`use-bom-supply.ts`, `use-bom-row-detail.tsx`, used by
`frontend/src/components/engineering-bom-table.tsx`), the catalog column and
filter (`catalog-supply-*.ts(x)`, `use-catalog-supply.ts`), a component's
Supply tab (`component-parts-section.tsx`, `component-watch.tsx`,
`local-stock-section.tsx`), the viewer's selection row
(`selection-supply-row.tsx`) and Release Studio (`release-supply-*.tsx`,
`release-snapshot-card.tsx`). The KiCad panel takes only `vendor-colors.ts`.

**Shared pieces** — `status-dot.tsx`, `vendor-name.tsx`, `vendor-colors.ts`,
`supply-icons.tsx` (use these icons in lists, tables, bars and cards),
`sparkline.tsx`, `chart-card.tsx`, `chart-format.ts`, `fold-section.tsx`,
`collapsible-section.tsx`, `hover-details.tsx`.

## Tests

Tests are `*.test.ts(x)` beside the code and run with the frontend suite.
Build test data with `supply-test-fixtures.ts` and `forecast-test-fixtures.ts`
rather than literal objects, so a type change breaks one place. Before
pushing, run `npx tsc -b` and `npm run scan:gate` in `frontend/`.
