var ei=`:host,
:root {
  color-scheme: dark;
  --shell: var(--prism-shell, #09090b);
  --panel: var(--prism-panel, #09090b);
  --panel-raised: var(--prism-panel-raised, #18181b);
  --control: var(--prism-control, #18181b);
  --control-hover: var(--prism-control-hover, #27272a);
  --foreground: var(--prism-foreground, #fafafa);
  --muted: var(--prism-muted, #a1a1aa);
  --border: var(--prism-border, #27272a);
  --primary: var(--prism-primary, #3b82f6);
  --primary-foreground: var(--prism-primary-foreground, var(--panel));
  --surface: var(--prism-shell, #09090b);
  --stackup-via-thru: color-mix(in srgb, var(--primary) 34%, var(--foreground));
  --stackup-via-blind: var(--primary);
  --stackup-via-buried: color-mix(in srgb, var(--primary) 58%, var(--muted));
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:host {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--shell);
  color: var(--foreground);
}

html,
body {
  width: 100%;
  height: 100%;
  min-height: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  overflow: hidden;
  background: var(--shell);
  color: var(--foreground);
}

button,
input {
  font: inherit;
}

#app {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 376px;
  height: 100%;
  min-height: 0;
  background: var(--shell);
  color: var(--foreground);
  transition: grid-template-columns 180ms ease;
}

#app.panel-collapsed {
  grid-template-columns: 48px minmax(0, 1fr) 46px;
}

.workspace-rail {
  position: relative;
  z-index: 8;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--panel);
}

.workspace-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 132px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.workspace-tab:hover {
  background: var(--control);
  color: var(--foreground);
}

.workspace-tab.active {
  box-shadow: inset -2px 0 var(--primary);
  background: var(--panel-raised);
  color: var(--foreground);
}

.viewport-shell {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--surface);
}

#viewport {
  display: block;
  width: 100%;
  height: 100%;
}

#schematic-viewport {
  display: block;
  width: 100%;
  height: 100%;
  background: #0b0e13;
}

#schematic-dom-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  background: transparent;
  touch-action: none;
}

#schematic-flow-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.svg-dom-page {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.svg-dom-page-svg {
  display: block;
  overflow: visible;
  background: #f4f1e7;
  box-shadow: 0 18px 58px rgba(0, 0, 0, 0.22);
}

.svg-dom-world-page {
  overflow: hidden;
  pointer-events: auto;
}

.svg-dom-world-page .svg-dom-page-svg {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-shadow: none;
}

#viewport[hidden],
#schematic-viewport[hidden],
#schematic-dom-layer[hidden],
#schematic-flow-overlay[hidden],
#bom-view[hidden] {
  display: none;
}

#bom-view {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  background: var(--shell);
  color: var(--foreground);
}

.bom-workspace {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.bom-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  backdrop-filter: blur(14px);
}

.bom-toolbar h2 {
  margin: 2px 0 1px;
  color: var(--foreground);
  font-size: 20px;
  letter-spacing: 0;
}

.bom-toolbar span,
.bom-search span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}

.bom-search {
  display: grid;
  gap: 6px;
  min-width: min(420px, 46vw);
}

.bom-search input {
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--control);
  color: var(--foreground);
  padding: 0 11px;
  outline: none;
}

.bom-search input:focus {
  border-color: rgba(59, 130, 246, 0.7);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.13);
}

.bom-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 24vw);
  min-height: 0;
}

.bom-content:not(:has(.bom-detail)) {
  grid-template-columns: minmax(0, 1fr);
}

.bom-table-wrap {
  min-width: 0;
  overflow: auto;
}

.bom-table {
  width: 100%;
  min-width: 1680px;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--foreground);
  font-size: 12px;
}

.bom-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid var(--border);
  background: var(--panel-raised);
  color: var(--muted);
  padding: 9px 10px;
  text-align: left;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bom-table td {
  max-width: 220px;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
  padding: 9px 10px;
  vertical-align: top;
  white-space: normal;
  overflow-wrap: anywhere;
}

.bom-table tr {
  cursor: pointer;
}

.bom-table tr:hover td {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}

.bom-table tr.selected td {
  background: color-mix(in srgb, var(--primary) 15%, transparent);
}

.bom-reference-cell {
  min-width: 180px;
}

.bom-ref-chip {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  margin: 0 4px 4px 0;
  border: 1px solid color-mix(in srgb, var(--primary) 42%, var(--border));
  border-radius: 4px;
  background: color-mix(in srgb, var(--primary) 9%, var(--control));
  color: color-mix(in srgb, var(--primary) 45%, var(--foreground));
  padding: 2px 7px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 750;
}

.bom-ref-chip:hover,
.bom-ref-chip.active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 24%, var(--control));
  color: var(--foreground);
}

.bom-ref-chip.detail {
  margin-bottom: 6px;
}

.bom-missing {
  color: #f59e0b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.bom-detail {
  min-width: 0;
  overflow: auto;
  border-left: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel-raised) 90%, transparent);
  padding: 18px;
}

.bom-detail-head {
  border-bottom: 1px solid var(--border);
  padding-bottom: 14px;
}

.bom-detail-head h3 {
  margin: 4px 0;
  color: var(--foreground);
  font-size: 18px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.bom-detail-head span {
  color: var(--muted);
  font-size: 12px;
}

.bom-ref-list {
  padding: 14px 0 10px;
}

.bom-field-list {
  display: grid;
  gap: 9px;
  margin: 0;
}

.bom-field-list div {
  border-top: 1px solid color-mix(in srgb, var(--border) 74%, transparent);
  padding-top: 8px;
}

.bom-field-list dt {
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bom-field-list dd {
  margin: 3px 0 0;
  color: var(--foreground);
  overflow-wrap: anywhere;
}

.bom-empty {
  color: var(--muted);
  font-size: 13px;
}

#panel-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

#panel-labels span {
  position: absolute;
  padding: 4px 8px;
  border: 1px solid rgba(26, 36, 51, 0.14);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  color: #253047;
  font-size: 11px;
  font-weight: 650;
  backdrop-filter: blur(8px);
  transform: translate(10px, -50%);
  transition: left 60ms linear, top 60ms linear;
}

#axis-gizmo {
  position: absolute;
  left: calc(var(--prism-viewport-inset-left, 0px) + 14px);
  bottom: 14px;
  width: 104px;
  height: 104px;
  cursor: pointer;
  border: 0;
  background: transparent;
  filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.18));
}

#selection-card {
  position: absolute;
  z-index: 4;
  width: min(360px, calc(100% - 32px));
  border: 1px solid var(--border);
  border-radius: 3px;
  background: color-mix(in srgb, var(--panel-raised) 96%, transparent);
  box-shadow: 0 22px 58px rgba(0, 0, 0, 0.34);
  color: var(--foreground);
  font-family: Inter, "SF Pro Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
  font-feature-settings: "tnum" 1, "ss01" 1;
  backdrop-filter: blur(16px);
}

#selection-card[hidden] {
  display: none;
}

.selection-card-head {
  display: grid;
  grid-template-columns: 4px auto minmax(0, 1fr) 24px;
  min-height: 48px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  cursor: grab;
  user-select: none;
}

.selection-card-head:active {
  cursor: grabbing;
}

.selection-card-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  padding: 6px;
  margin-left: 2px;
}

.selection-card-drag-handle svg {
  opacity: 0.5;
  transition: opacity 120ms ease;
}

.selection-card-head:hover .selection-card-drag-handle svg {
  opacity: 0.8;
  color: var(--foreground);
}

.selection-card-accent {
  width: 4px;
  height: 100%;
  background: #18ef52;
  box-shadow: 3px 0 14px rgba(24, 239, 82, 0.24);
}

.selection-card-title {
  display: grid;
  align-content: center;
  gap: 1px;
  min-width: 0;
  padding: 6px 10px;
}

.selection-card-title small,
.selection-section-title {
  color: var(--muted);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.selection-card-title strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 670;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selection-card-close {
  width: 24px;
  height: 24px;
  margin: 6px 6px 0 0;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.selection-card-close:hover {
  background: var(--control-hover);
  color: var(--foreground);
}

.selection-properties {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--border);
}

.selection-property {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border-right: 1px solid var(--border);
}

.selection-property:last-child {
  border-right: 0;
}

.selection-property small {
  display: block;
  margin-bottom: 2px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.selection-property strong {
  display: block;
  overflow: hidden;
  color: var(--foreground);
  font-size: 11px;
  font-weight: 620;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: anywhere;
}

.selection-section {
  padding: 8px 12px;
}

.selection-section-title {
  display: block;
  margin-bottom: 5px;
}

.selection-table {
  max-height: 152px;
  overflow: auto;
  border: 1px solid var(--border);
  background: var(--panel);
}

.selection-row {
  display: grid;
  grid-template-columns: minmax(48px, 0.7fr) minmax(42px, 0.55fr) minmax(0, 1.4fr);
  min-height: 26px;
  border-bottom: 1px solid var(--border);
}

.selection-row:last-child {
  border-bottom: 0;
}

.selection-row > span {
  overflow: hidden;
  padding: 5px 8px;
  border-right: 1px solid var(--border);
  color: var(--muted);
  font-size: 10px;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: anywhere;
}

.selection-row > span:last-child {
  border-right: 0;
}

.selection-row strong {
  color: var(--foreground);
  font-weight: 680;
}

.selection-empty {
  padding: 10px;
  color: var(--muted);
  font-size: 10px;
}

.selection-card-actions {
  display: flex;
  justify-content: flex-end;
  padding: 6px 12px;
  border-top: 1px solid var(--border);
  background: var(--panel);
}

.selection-card-actions button {
  min-height: 26px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--control);
  color: var(--foreground);
  cursor: pointer;
  font-size: 10px;
  font-weight: 650;
}

.selection-card-actions button:hover {
  border-color: var(--primary);
  background: var(--control-hover);
}

/* Net Dashboard styles */
.selection-net-dashboard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
}

.net-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 3px;
}

.metric-card small {
  color: var(--muted);
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.metric-card strong {
  font-size: 13px;
  color: var(--foreground);
  font-weight: 670;
}

.metric-card .unit {
  font-size: 9px;
  color: var(--muted);
  font-weight: normal;
}

.net-layers-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.layer-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--control-hover);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.layer-badge.unknown {
  color: var(--muted);
  font-style: italic;
}

.pin-row-interactive {
  cursor: pointer;
  transition: background 100ms ease;
}

.pin-row-interactive:hover {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}

.refdes-col {
  color: var(--primary) !important;
}

.refdes-col:hover {
  text-decoration: underline;
}

.pin-col {
  font-weight: 600;
}

.compact-scroll::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.compact-scroll::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.compact-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

.selection-card-actions button {
  margin-left: 6px;
}

.selection-card-actions button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

#fallback {
  position: absolute;
  inset: 16px;
  color: #171d28;
  font-size: 13px;
}

.panel {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  border-left: 1px solid var(--border);
  background: var(--panel);
}

.panel-rail {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-right: 1px solid var(--border);
  background: var(--panel);
}

.rail-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 94px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: #718096;
  cursor: pointer;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  transition: color 120ms ease, background 120ms ease;
}

.rail-tab:hover {
  background: var(--control);
  color: var(--foreground);
}

.rail-tab.active {
  box-shadow: inset -2px 0 var(--primary);
  background: var(--panel-raised);
  color: var(--foreground);
}

.panel-drawer {
  min-width: 0;
  overflow: auto;
  padding: 18px;
  opacity: 1;
  transition: opacity 100ms ease;
}

.panel-collapsed .panel-drawer {
  visibility: hidden;
  padding: 0;
  opacity: 0;
}

.panel header {
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.panel-mode-header {
  padding-top: 1px;
}

.eyebrow {
  margin: 0 0 5px;
  color: #60a5fa;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  overflow: hidden;
  font-size: 18px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h2 {
  font-size: 13px;
  font-weight: 700;
}

#status {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-heading span {
  color: var(--muted);
  font-size: 10px;
}

.mode-toolbar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--panel-raised);
}

.mode-toolbar button,
.layer-presets button,
.quick-actions button {
  min-width: 0;
  height: 32px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 120ms ease;
}

.mode-toolbar button:hover,
.layer-presets button:hover,
.quick-actions button:hover {
  background: var(--control-hover);
  color: var(--foreground);
}

.mode-toolbar button.active {
  background: var(--primary);
  border: 1px solid var(--primary);
  color: var(--primary-foreground);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--primary) 30%, transparent);
}

.quick-actions button.active {
  background: var(--control-hover);
  border: 1px solid var(--border);
  color: var(--foreground);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--shell) 60%, transparent);
}

.layer-presets,
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 10px;
}

.layer-presets button,
.quick-actions button {
  border: 1px solid var(--border);
  background: var(--control);
  font-size: 11px;
}

.layer-list {
  display: grid;
  gap: 1px;
  margin-top: 12px;
}

.layer-row {
  display: grid;
  grid-template-columns: 16px 12px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 31px;
  padding: 0 7px;
  border-radius: 4px;
  color: #d9e0ea;
  font-size: 12px;
}

.layer-row:hover {
  background: #111b2a;
}

.layer-row input,
.toggle-row input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--primary);
}

.layer-row small {
  color: #68758a;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.swatch {
  width: 11px;
  height: 11px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 2px;
}

.control-field {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}

.control-field > span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.layer-select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 5px;
  outline: none;
  background: var(--control);
  color: var(--foreground);
  font-size: 12px;
}

.layer-select:focus {
  border-color: #3974be;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.13);
}

.search-results {
  display: grid;
  gap: 2px;
}

.search-results button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--foreground);
  text-align: left;
  cursor: pointer;
}

.search-results button:hover {
  background: var(--control);
}

.search-results span {
  overflow: hidden;
  color: var(--muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-list {
  display: grid;
  gap: 2px;
  padding: 8px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.toggle-row {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 32px;
  color: #dce3ed;
  font-size: 12px;
}

.range-field {
  margin-top: 18px;
}

input[type="range"] {
  width: 100%;
  height: 4px;
  margin: 8px 0;
  accent-color: var(--primary);
}

pre {
  overflow: auto;
  max-height: calc(100vh - 170px);
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: #070c14;
  color: #dbe4f0;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
}

#diagnostics {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 14px;
  margin: 0;
  font-size: 11px;
}

#diagnostics dt {
  color: var(--muted);
}

#diagnostics dd {
  margin: 0;
  color: #dbe4f0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

#schematic-labels {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

#schematic-labels[hidden] {
  display: none;
}

.schematic-page-label {
  position: absolute;
  display: grid;
  gap: 1px;
  min-width: 96px;
  max-width: 220px;
  padding: 5px 7px;
  border-left: 2px solid #4b8de8;
  background: rgba(8, 13, 22, 0.88);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  color: #edf3fb;
  font-size: 10px;
  transform: translateY(-100%);
  backdrop-filter: blur(8px);
}

.schematic-page-label strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schematic-page-label small {
  color: #8f9caf;
  font-size: 8px;
}

.page-list {
  display: grid;
  gap: 2px;
  margin-top: 12px;
}

.page-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: #dce3ee;
  cursor: pointer;
  text-align: left;
}

.page-row:hover {
  border-color: #28364a;
  background: #111a28;
}

.page-row.active {
  border-color: #346db6;
  background: #14243c;
}

.page-row > span:first-child {
  color: #6f7d92;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.page-row strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-row small {
  color: #718096;
  font-size: 9px;
}

@media (max-width: 900px) {
  #app {
    grid-template-columns: 42px minmax(0, 1fr) 326px;
  }

  #app.panel-collapsed {
    grid-template-columns: 42px minmax(0, 1fr) 46px;
  }
}

/* Workspace specific panel rail controls */
.workspace-schematic [data-tab="view"] {
  display: none !important;
}

.workspace-schematic [data-tab="stackup"],
.workspace-bom [data-tab="stackup"] {
  display: none !important;
}

/* Stackup Workspace layout */
#app.workspace-stackup {
  grid-template-columns: 48px minmax(0, 1fr);
}

.workspace-stackup .panel {
  display: none !important;
}

#stackup-workspace-view {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  background: var(--shell);
  color: var(--foreground);
  padding: clamp(20px, 3vw, 40px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

#stackup-workspace-view[hidden] {
  display: none !important;
}

.stackup-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.stackup-header-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stackup-header-title h1 {
  font-size: clamp(22px, 2vw, 30px);
  font-weight: 700;
  margin: 0;
  color: var(--foreground);
}

.stackup-header-title p {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

.stackup-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stackup-summary-card {
  background: color-mix(in srgb, var(--panel-raised) 54%, var(--panel));
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stackup-summary-card label {
  font-size: 9px;
  color: var(--muted);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.stackup-summary-card span {
  font-size: 16px;
  font-weight: 650;
  color: var(--foreground);
}

.stackup-workspace-body {
  display: grid;
  grid-template-columns: minmax(520px, 1fr) minmax(360px, 44vw);
  gap: 28px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.stackup-diagram-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: flex-start;
  background: color-mix(in srgb, var(--panel-raised) 38%, var(--panel));
  border: 1px solid var(--border);
  border-radius: 6px;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stackup-visual-svg {
  width: 96%;
  max-width: 720px;
  height: auto;
  flex: none;
  overflow: visible;
}

.stackup-side-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

.stackup-via-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.stackup-via-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.stackup-via-legend i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  background: var(--stackup-via-thru);
}

.stackup-via-legend i[data-via-type="blind"] {
  background: var(--stackup-via-blind);
}

.stackup-via-legend i[data-via-type="buried"] {
  background: var(--stackup-via-buried);
}

.stackup-svg-layer {
  cursor: pointer;
  transition: opacity 120ms ease, filter 120ms ease;
}

.stackup-svg-column-headings text {
  fill: var(--muted);
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stackup-layer-dimension,
.stackup-total-dimension path {
  fill: none;
  stroke: var(--muted);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.stackup-total-dimension text {
  fill: var(--muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-anchor: middle;
  text-transform: uppercase;
}

.stackup-layer-name,
.stackup-layer-thickness,
.stackup-layer-metadata {
  transition: fill 120ms ease, font-weight 120ms ease;
}

.stackup-svg-layer:hover {
  filter: brightness(1.2) contrast(1.1);
  opacity: 0.95;
}

.stackup-svg-layer.active rect {
  stroke: var(--primary);
  stroke-width: 1.5px;
  filter: brightness(1.3);
}

.stackup-svg-layer.active .stackup-layer-dimension {
  stroke: var(--primary);
  stroke-width: 1.5px;
}

.stackup-svg-layer.active .stackup-layer-name,
.stackup-svg-layer.active .stackup-layer-thickness {
  fill: var(--primary);
  font-weight: 800;
}

.stackup-tables-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.stackup-table-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stackup-section-title {
  color: var(--muted);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.stackup-section-heading {
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-left: 3px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 9%, var(--panel));
  color: var(--foreground);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.stackup-section-heading small {
  margin-left: auto;
  color: var(--muted);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.stackup-table-wrapper {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--panel-raised) 26%, var(--panel));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-height: min(360px, calc(100vh - 420px));
}

.stackup-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  text-align: left;
}

.stackup-table th {
  position: sticky;
  top: 0;
  background: var(--control);
  color: var(--muted);
  font-weight: 700;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.05em;
  z-index: 1;
}

.stackup-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
  vertical-align: middle;
}

.stackup-table tr:last-child td {
  border-bottom: 0;
}

.stackup-table tr.active td {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  color: var(--primary);
}

.stackup-table tr:hover td {
  background: var(--control-hover);
}

.stackup-table tbody tr[data-layer-id] {
  cursor: crosshair;
}

.stackup-table tbody tr[data-layer-id]:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.stackup-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
}

.stackup-badge.copper {
  background: rgba(224, 133, 36, 0.15);
  color: #f97316;
}

.stackup-badge.dielectric {
  background: rgba(169, 141, 92, 0.15);
  color: #ca8a04;
}

.stackup-badge.mask {
  background: rgba(47, 107, 79, 0.15);
  color: #10b981;
}

.stackup-badge.paste {
  background: rgba(203, 213, 225, 0.12);
  color: #cbd5e1;
}

.stackup-badge.silk {
  background: rgba(255, 255, 255, 0.1);
  color: var(--foreground);
}

@media (max-width: 1180px) {
  #stackup-workspace-view {
    overflow-y: auto;
  }

  .stackup-workspace-body {
    grid-template-columns: 1fr;
    flex: none;
  }

  .stackup-diagram-card {
    min-height: auto;
    height: auto;
    overflow: visible;
  }

  .stackup-side-panel {
    height: auto;
    overflow: visible;
    padding-right: 0;
  }

  .stackup-table-wrapper {
    max-height: none;
  }
}

@media (max-width: 760px) {
  #stackup-workspace-view {
    padding: 16px;
  }

  .stackup-diagram-card {
    align-items: flex-start;
    overflow-x: auto;
  }

  .stackup-visual-svg,
  .stackup-via-legend {
    width: 680px;
    max-width: none;
  }

  .stackup-summary-grid {
    grid-template-columns: 1fr;
  }
}
`;var Qd=/\/api\/projects\/([^/]+)\/webgpu-3d\/assets\/([^/]+)\/([^/]+)\/(.+)$/,Zd="prism-bundle-cache-a0",Sn="manifest.json";function Rn(t){let e;try{e=new URL(t,"http://cache.invalid/")}catch{return null}let a=Qd.exec(e.pathname);if(!a)return null;let[,s,n,r,i]=a.map(decodeURIComponent);if(i.split("/").some(c=>!c||c==="."||c===".."))return null;let o=e.searchParams.get("viewer")||"";return`${s}/${n}/${r}/${i}${o?`?viewer=${o}`:""}`}function Ya(t){return`a_${encodeURIComponent(t)}`}function eu(t,e,{maxAgeMs:a=2592e6,maxBytes:s=2147483648}={}){let n=new Set,r=[];for(let[o,c]of Object.entries(t))e-Number(c.lastUsed||0)<=a?r.push([o,c]):n.add(o);r.sort((o,c)=>Number(c[1].lastUsed)-Number(o[1].lastUsed));let i=0;for(let[o,c]of r)i+=Number(c.bytes||0),i>s&&n.add(o);return[...n]}var Qa=class t{static open(e={}){return t.shared||(t.shared=new t(e)),t.shared}constructor({maxAgeMs:e=2592e6,maxBytes:a=2147483648}={}){this.maxAgeMs=e,this.maxBytes=a,this.stats={hits:0,misses:0,bypassed:0,cachedBytes:0,networkBytes:0,writeErrors:0},this.ready=this.init(),this.flushTimer=null}async init(){try{let e=globalThis.navigator?.storage;if(!e?.getDirectory)return null;let s=await(await e.getDirectory()).getDirectoryHandle(Zd,{create:!0}),n=await s.getFileHandle(Sn,{create:!0});if(typeof n.createWritable!="function")return null;let r={};try{let i=await(await n.getFile()).text();r=i?JSON.parse(i).entries||{}:{}}catch{r={}}return this.directory=s,this.entries=r,await this.prune(),globalThis.addEventListener?.("pagehide",()=>void this.flush()),s}catch{return null}}get enabled(){return!!this.directory}async fetchBytes(e,{store:a=!0,signal:s}={}){let n=Rn(e);if(await this.ready,n&&this.directory){let c=await this.read(n);if(c)return this.stats.hits+=1,this.stats.cachedBytes+=c.byteLength,c;this.stats.misses+=1}else this.stats.bypassed+=1;let r=await fetch(e,{cache:"no-store",signal:s});if(!r.ok)throw new Error(`Failed to load ${e}: ${r.status}`);let i=await r.arrayBuffer(),o=Number(r.headers.get("content-length")||0);return this.stats.networkBytes+=i.byteLength,a&&n&&this.directory&&(!o||o===i.byteLength)&&this.write(n,i),i}async fetchJson(e,a={}){let s=await this.fetchBytes(e,a);return JSON.parse(new TextDecoder().decode(s))}async peekJson(e){let a=Rn(e);if(await this.ready,!a||!this.directory)return null;let s=await this.read(a);return s?(this.stats.hits+=1,this.stats.cachedBytes+=s.byteLength,JSON.parse(new TextDecoder().decode(s))):null}async store(e,a){let s=Rn(e);await this.ready,s&&this.directory&&await this.write(s,a)}async read(e){let a=this.entries[e];if(!a)return null;try{let s=await(await this.directory.getFileHandle(Ya(e))).getFile();return s.size!==a.bytes?null:(a.lastUsed=Date.now(),this.scheduleFlush(),await s.arrayBuffer())}catch{return delete this.entries[e],null}}async write(e,a){try{let n=await(await this.directory.getFileHandle(Ya(e),{create:!0})).createWritable();await n.write(a),await n.close(),this.entries[e]={bytes:a.byteLength,lastUsed:Date.now()},this.scheduleFlush()}catch{this.stats.writeErrors+=1}}async prune(e=Date.now()){if(!this.directory)return[];let a=eu(this.entries,e,{maxAgeMs:this.maxAgeMs,maxBytes:this.maxBytes});for(let n of a)delete this.entries[n],await this.directory.removeEntry(Ya(n)).catch(()=>{});let s=new Set(Object.keys(this.entries).map(Ya));for await(let n of this.directory.keys())n!==Sn&&!s.has(n)&&await this.directory.removeEntry(n).catch(()=>{});return a.length&&await this.flush(),a}async clear(){await this.ready,this.directory&&(this.entries={},await this.prune(),await this.flush())}summary(){let e=Object.values(this.entries||{});return{enabled:this.enabled,files:e.length,bytes:e.reduce((a,s)=>a+Number(s.bytes||0),0),...this.stats}}scheduleFlush(){this.flushTimer||(this.flushTimer=setTimeout(()=>{this.flushTimer=null,this.flush()},1e3))}async flush(){if(this.directory)try{let a=await(await this.directory.getFileHandle(Sn,{create:!0})).createWritable();await a.write(JSON.stringify({schema:"prism.bundle_cache_manifest.a0",entries:this.entries})),await a.close()}catch{this.stats.writeErrors+=1}}};function tu(t,e){if(!e)return t;let a=new URL(t);return a.searchParams.set("viewer",e),a.toString()}function ti(t,e,a,s){let n=new URL(a.asset_base||"./",e),r=structuredClone(t||{}),i=o=>!o||typeof o!="string"?o:tu(new URL(o,n).toString(),s);for(let o of["assets","semantic_gltf","schematic_world","schematic_vector","schematic_scene","bom"]){let c=r[o];if(!(!c||typeof c!="object"))for(let[d,b]of Object.entries(c))c[d]=i(b)}return r}function An(t){return(t?.readiness?.stage||"semantic-ready")==="semantic-ready"&&(t?.readiness?.progress??100)>=100}var re=(t,e,a)=>Math.max(e,Math.min(a,t)),es=(t,e,a)=>t+(e-t)*a;function Qe(t,e){return[t[0]+e[0],t[1]+e[1],t[2]+e[2]]}function au(t,e){return[t[0]-e[0],t[1]-e[1],t[2]-e[2]]}function De(t,e){return[t[0]*e,t[1]*e,t[2]*e]}function su(t){return Math.hypot(t[0],t[1],t[2])}function it(t){let e=su(t)||1;return De(t,1/e)}function pt(t,e){return[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]]}function xa(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function ai(t,e){let a=e/2,s=Math.sin(a),n=it(t);return[n[0]*s,n[1]*s,n[2]*s,Math.cos(a)]}function Za(t,e){return[t[3]*e[0]+t[0]*e[3]+t[1]*e[2]-t[2]*e[1],t[3]*e[1]-t[0]*e[2]+t[1]*e[3]+t[2]*e[0],t[3]*e[2]+t[0]*e[1]-t[1]*e[0]+t[2]*e[3],t[3]*e[3]-t[0]*e[0]-t[1]*e[1]-t[2]*e[2]]}function _n(t,e){let a=[e[0],e[1],e[2],0],s=[-t[0],-t[1],-t[2],t[3]];return Za(Za(t,a),s).slice(0,3)}function ts(t,e){let a=new Float32Array(16);for(let s=0;s<4;s+=1)for(let n=0;n<4;n+=1)a[s*4+n]=t[n]*e[s*4]+t[4+n]*e[s*4+1]+t[8+n]*e[s*4+2]+t[12+n]*e[s*4+3];return a}function si(t,e,a){let s=it(au(t,e)),n=it(pt(a,s)),r=pt(s,n);return new Float32Array([n[0],r[0],s[0],0,n[1],r[1],s[1],0,n[2],r[2],s[2],0,-xa(n,t),-xa(r,t),-xa(s,t),1])}function ni(t,e,a,s){let n=1/Math.tan(t/2);return new Float32Array([n/e,0,0,0,0,n,0,0,0,0,a/(s-a),-1,0,0,a*s/(s-a),0])}function ri(t,e,a,s){return new Float32Array([2/t,0,0,0,0,2/e,0,0,0,0,1/(s-a),0,0,0,1,1])}function Nn(t){return[(t[0]+t[3])/2,(t[1]+t[4])/2,(t[2]+t[5])/2]}function wa(t){return Math.max(.001,Math.hypot(t[3]-t[0],t[4]-t[1],t[5]-t[2])/2)}var va=class{constructor(e){let a=Nn(e),s=wa(e);this.focus=[...a],this.targetFocus=[...a],this.azimuth=-.62,this.targetAzimuth=this.azimuth,this.polar=.72,this.targetPolar=this.polar,this.distance=s*2.8,this.targetDistance=this.distance,this.orthoScale=s*2.15,this.targetOrthoScale=this.orthoScale,this.sceneRadius=s,this.fov=Math.PI/4}update(e){let a=1-Math.exp(-e*14);this.focus=this.focus.map((s,n)=>es(s,this.targetFocus[n],a)),this.azimuth=oi(this.azimuth,this.targetAzimuth,a),this.polar=oi(this.polar,this.targetPolar,a),this.distance=es(this.distance,this.targetDistance,a),this.orthoScale=es(this.orthoScale,this.targetOrthoScale,a)}snap(){this.focus=[...this.targetFocus],this.azimuth=this.targetAzimuth,this.polar=this.targetPolar,this.distance=this.targetDistance,this.orthoScale=this.targetOrthoScale}basis(){let e=Math.sin(this.polar),a=Math.cos(this.polar),s=it([e*Math.sin(this.azimuth),-e*Math.cos(this.azimuth),a]),n=it([Math.cos(this.azimuth),Math.sin(this.azimuth),0]),r=it(pt(s,n));return{right:n,up:r,back:s}}matrix(e,a,s=!1,n=1){let r=Math.max(.01,e/Math.max(1,a)),{up:i,back:o}=this.basis(),c=Qe(this.focus,De(o,this.distance)),d=si(c,this.focus,i),b=s?ri(this.orthoScale*n*r,this.orthoScale*n,-this.sceneRadius*40,this.sceneRadius*40):ni(this.fov,r,Math.max(this.sceneRadius*5e-4,this.distance-this.sceneRadius*3.5),this.distance+this.sceneRadius*4.5);return ts(b,d)}orbit(e,a){let s=Math.sin(this.targetPolar)<0?-1:1;this.targetAzimuth-=s*e*.006,this.targetPolar=ii(this.targetPolar-a*.006)}isBelow(){return Math.cos(this.targetPolar)<0}pan(e,a,s,n=!1){let{right:r,up:i}=this.basis(),o=n?this.targetOrthoScale/Math.max(1,s):2*this.targetDistance*Math.tan(this.fov/2)/Math.max(1,s),c=Qe(De(r,-e*o),De(i,a*o));this.targetFocus=Qe(this.targetFocus,c)}dolly(e,a=!1){let s=Math.exp(e*.0032);a?this.targetOrthoScale=re(this.targetOrthoScale*s,this.sceneRadius*.008,this.sceneRadius*24):this.targetDistance=re(this.targetDistance*s,this.sceneRadius*.01,this.sceneRadius*48)}frame(e){if(!e)return;let a=wa(e);this.targetFocus=Nn(e),this.targetDistance=Math.max(a*2.8,this.sceneRadius*.02),this.targetOrthoScale=Math.max(a*2.15,this.sceneRadius*.02)}setFocus(e){this.targetFocus=[...e]}setAxis(e,a=!1){e==="z"?(this.targetAzimuth=0,this.targetPolar=a?Math.PI-.015:.015):e==="x"?(this.targetAzimuth=a?-Math.PI/2:Math.PI/2,this.targetPolar=Math.PI/2):(this.targetAzimuth=a?0:Math.PI,this.targetPolar=Math.PI/2)}rotateZ(e=1){this.targetAzimuth+=e*Math.PI/2}flip(){this.targetPolar=ii(Math.PI-this.targetPolar)}};function ii(t){return Math.atan2(Math.sin(t),Math.cos(t))}function oi(t,e,a){let s=Math.atan2(Math.sin(e-t),Math.cos(e-t));return t+s*a}var as=class t{static async create(e,a,s={}){let n=await fetch(a,{cache:"default"});if(!n.ok)throw new Error(`Failed to load BoM ${a}: ${n.status}`);let r=await n.json();if(r.schema!=="prism.bom_a0")throw new Error(`Unsupported BoM schema: ${r.schema||"missing"}`);let i=new t(e,r,s);return i.render(),i}constructor(e,a,s){this.container=e,this.payload=a,this.callbacks=s,this.query="",this.selectedRowId="",this.selectedReference="",this.rowsById=new Map((a.rows||[]).map(n=>[n.id,n])),this.componentIndex=new Map(Object.entries(a.componentIndex||{}))}setSelectionByReference(e,a={}){let s=this.componentIndex.get(e);s&&(this.selectedReference=e,this.selectedRowId=s.rowId,this.renderContent(),a.scroll&&this.container.querySelector(`[data-row-id="${iu(s.rowId)}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}))}clearSelection(){this.selectedReference="",this.selectedRowId="",this.renderContent()}render(){let e=this.filteredRows();this.container.innerHTML=`
      <section class="bom-workspace">
        <header class="bom-toolbar">
          <div>
            <p class="eyebrow">Prism BoM A0</p>
            <h2>Bill of Materials</h2>
            <span data-bom-count>${e.length} of ${(this.payload.rows||[]).length} grouped rows \xB7 ${(this.payload.components||[]).length} components</span>
          </div>
          <label class="bom-search">
            <span>Search</span>
            <input id="bom-search" type="search" value="${Le(this.query)}" placeholder="Reference, value, footprint, manufacturer..." />
          </label>
        </header>
        <div class="bom-content" data-bom-content>
          ${this.contentHtml(e,this.payload.displayColumns||[])}
        </div>
      </section>
    `,this.bind()}renderContent(){let e=this.container.querySelector("[data-bom-content]");if(!e){this.render();return}let a=this.filteredRows();e.innerHTML=this.contentHtml(a,this.payload.displayColumns||[]);let s=this.container.querySelector("[data-bom-count]");s&&(s.textContent=`${a.length} of ${(this.payload.rows||[]).length} grouped rows \xB7 ${(this.payload.components||[]).length} components`),this.bindContent(e)}contentHtml(e,a){let s=this.rowsById.get(this.selectedRowId);return`
      <div class="bom-table-wrap">
        <table class="bom-table">
          <thead>
            <tr>${a.map(n=>`<th>${Le(n)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${e.map(n=>this.rowHtml(n,a)).join("")}
          </tbody>
        </table>
      </div>
      ${s?`<aside class="bom-detail">${this.detailHtml(s)}</aside>`:""}
    `}filteredRows(){let e=this.query.trim().toLowerCase(),a=this.payload.rows||[];return e?a.filter(s=>JSON.stringify(s).toLowerCase().includes(e)):a}rowHtml(e,a){return`
      <tr class="${e.id===this.selectedRowId?"selected":""}" data-row-id="${Le(e.id)}">
        ${a.map(n=>{let r=e.fields?.[n]||"";return n==="Reference"?`<td class="bom-reference-cell">${(e.references||[]).map(i=>`
              <button class="bom-ref-chip ${i===this.selectedReference?"active":""}" data-reference="${Le(i)}">${Le(i)}</button>
            `).join("")}</td>`:!r&&ru(n)?'<td><span class="bom-missing">Missing</span></td>':`<td title="${Le(r)}">${Le(r)}</td>`}).join("")}
      </tr>
    `}detailHtml(e){let a=nu(e,this.payload.displayColumns||[],this.payload.extraColumns||[]);return`
      <div class="bom-detail-head">
        <p class="eyebrow">Line item</p>
        <h3>${Le((e.references||[]).join(", "))}</h3>
        <span>${e.qty} component${e.qty===1?"":"s"}${e.dnp?" \xB7 DNP":""}</span>
      </div>
      <div class="bom-ref-list">
        ${(e.references||[]).map(s=>`
          <button class="bom-ref-chip detail ${s===this.selectedReference?"active":""}" data-reference="${Le(s)}">${Le(s)}</button>
        `).join("")}
      </div>
      <dl class="bom-field-list">
        ${a.map(([s,n])=>`
          <div>
            <dt>${Le(s)}</dt>
            <dd>${Le(n)}</dd>
          </div>
        `).join("")}
      </dl>
    `}bind(){let e=this.container.querySelector("#bom-search");e?.addEventListener("input",()=>{this.query=e.value,this.renderContent()}),this.bindContent(this.container)}bindContent(e){e.querySelectorAll("[data-row-id]").forEach(a=>{a.addEventListener("click",s=>{s.target.closest("[data-reference]")||(this.selectedRowId=a.dataset.rowId,this.selectedReference="",this.renderContent())})}),e.querySelectorAll("[data-reference]").forEach(a=>{a.addEventListener("click",s=>{s.stopPropagation();let n=a.dataset.reference;this.setSelectionByReference(n),this.callbacks.onSelectReference?.(n)})})}};function nu(t,e,a){let s=[],n=new Set(["Reference","Qty"].map(Cn));for(let i of e){if(i==="Reference"||i==="Qty")continue;let o=t.fields?.[i]||"";o&&(s.push([i,o]),n.add(Cn(i)))}let r=t.canonicalFields||{};for(let i of a){let o=r[i]||"";if(!o)continue;let c=Cn(i);n.has(c)||(n.add(c),s.push([i,o]))}return s}function Cn(t){return String(t||"").toLowerCase().replace(/[\s_\-()[\]/]+/g,"")}function ru(t){return["Manufacturer Part Number","Vendor Part Number","Datasheet","Footprint","Value"].includes(t)}function Le(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function iu(t){return String(t).replace(/["\\]/g,"\\$&")}function Fn(t){let e=`${t.nodeName||""} ${t.meshName||""} ${t.material?.name||""}`.toLowerCase();return e.includes("_pad")||e.includes(".pad")||e.endsWith("pad")?"pad":e.includes("silkscreen")?"silkscreen":e.includes("soldermask")?"soldermask":e.includes("paste")?"paste":"substrate"}function ss(t,e=()=>""){let a=new Map;for(let s of t){let r=`${e(s)}:${JSON.stringify(s.material)}`;a.has(r)||a.set(r,[]),a.get(r).push(s)}return[...a.values()].map(s=>{let n=s.reduce((u,l)=>u+l.position.length/3,0),r=s.reduce((u,l)=>u+l.indices.length,0),i=new Float32Array(n*3),o=new Float32Array(n*3),c=new Uint32Array(n),d=new Uint32Array(n),b=new Uint32Array(r),f=0,m=0,p=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let u of s){let l=u.position.length/3;i.set(u.position,f*3),o.set(u.normal,f*3),c.set(u.netId,f),d.set(u.objectFeatureId,f);for(let y=0;y<u.indices.length;y+=1)b[m+y]=Number(u.indices[y])+f;u.bounds&&(p[0]=Math.min(p[0],u.bounds[0]),p[1]=Math.min(p[1],u.bounds[1]),p[2]=Math.min(p[2],u.bounds[2]),p[3]=Math.max(p[3],u.bounds[3]),p[4]=Math.max(p[4],u.bounds[4]),p[5]=Math.max(p[5],u.bounds[5])),f+=l,m+=u.indices.length}return{position:i,normal:o,netId:c,objectFeatureId:d,indices:b,material:s[0].material,groupKey:e(s[0]),bounds:Number.isFinite(p[0])?p:null}})}function Ea(t){return!t||t.length!==6?null:[t[0]/1e3,-t[4]/1e3,t[2]/1e3,t[3]/1e3,-t[1]/1e3,t[5]/1e3]}function ns(t){let e=t?.min||[0,0,0],a=t?.max||[.08,.0016,.05];return[e[0],-a[2],e[1],a[0],-e[2],a[1]]}function sa(t){let e=t.filter(a=>Array.isArray(a)&&a.length===6);return e.length?e.reduce((a,s)=>[Math.min(a[0],s[0]),Math.min(a[1],s[1]),Math.min(a[2],s[2]),Math.max(a[3],s[3]),Math.max(a[4],s[4]),Math.max(a[5],s[5])],[...e[0]]):null}function ci(t){let e=t.replace("#","");return[0,2,4].map(a=>parseInt(e.slice(a,a+2),16)/255)}function li(t,e){if(typeof t?.color=="string"&&/^#[0-9a-fA-F]{6}$/.test(t.color))return[...ci(t.color),1];let a={"F.Cu":"#a9423c","B.Cu":"#315b9a","In1.Cu":"#477a55","In2.Cu":"#806244","In3.Cu":"#347c86","In4.Cu":"#685889","In5.Cu":"#92793e"},s=["#477a55","#806244","#347c86","#685889","#92793e","#82556e"],n=String(t?.name||""),r=Math.max(0,e.findIndex(i=>i.name===n)-1);return[...ci(a[n]||s[r%s.length]),1]}function di(t,e){let a=e.map(s=>[Number(s.id),Number(s.z_mm||0)]);return a.length<3?!1:(a.sort((s,n)=>s[1]-n[1]),t!==a[0][0]&&t!==a[a.length-1][0])}var Ma=Object.freeze({gold:[.83,.69,.37,1],silver:[.74,.75,.77,1],copper:[.76,.47,.28,1]});function ui(t){let e=String(t||"").toLowerCase();return/hasl|hal\b|tin|silver|lead/.test(e)?Ma.silver:/osp|bare|none/.test(e)?Ma.copper:Ma.gold}function fi(t,e){let a=String(t?.name||"");return!!a&&(a===e[0]?.name||a===e[e.length-1]?.name)}function hi(t,e){let a=String(t.material?.name||"").endsWith("_bottom"),s=e.find(n=>n.name===(a?"B.Cu":"F.Cu"))||(a?e[e.length-1]:e[0]);return Number(s?.id||0)}function bi(t,e=new Map){let a=new Map;for(let n of t||[]){let r=String(n?.designator||"");if(!r)continue;let i=a.get(r)||{reference:r,featureIds:new Set,modelCount:0},o=Number(n?.featureId)||0;o>0&&i.featureIds.add(o),a.set(r,i)}for(let[n,r]of e||[]){let i=a.get(String(n));i&&(i.modelCount=Math.max(i.modelCount,Number(r)||0))}let s=new Map;for(let[n,r]of a)s.set(n,{reference:n,featureIds:[...r.featureIds].sort((i,o)=>i-o),ambiguous:r.featureIds.size>1||r.modelCount>1});return s}function pi(t,e){let a=[...new Set((Array.isArray(t)?t:[]).map(c=>String(c||"")).filter(Boolean))],s=[],n=[],r=[],i=new Set,o=new Set;for(let c of a){let d=e.get(c);if(!d){r.push(c);continue}if(d.ambiguous){n.push(c);continue}s.push(c),o.add(c);for(let b of d.featureIds)i.add(b)}return{requested:a,applied:s,ambiguous:n,unknown:r,hiddenFeatureIds:i,hiddenReferences:o}}function rs(t,e){return!!t&&e.has(String(t))}var ou={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function G(t){return String(t??"").replace(/[&<>"']/g,e=>ou[e])}var Ta=`
fn netEmphasized(id: u32) -> bool {
  return id != 0u && id < arrayLength(&netMask) && netMask[id] != 0u;
}
`;function is(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function gi(t,e=0){let a=0;for(let n of is(t))a=Math.max(a,n);let s=64;for(;s<a+1;)s*=2;return Math.max(s,Math.floor(e)||0)}function mi(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(0);for(let n of is(t))n<a&&(s[n]=1);return s}function Vt(t,e){return!Array.isArray(t)||!e?null:t.find(a=>a.name===e||Array.isArray(a.aliases)&&a.aliases.includes(e))||null}function yi(t,e){let a=new Set;if(!Array.isArray(t)||!Array.isArray(e))return a;for(let s of e){if(!s)continue;let n=s.netUid&&t.find(i=>i.uid===s.netUid)||s.netName&&Vt(t,s.netName),r=Number(n?.id);Number.isInteger(r)&&r>0&&a.add(r)}return a}var Bn=Object.freeze([[.08,1,.2],[1,.72,.1],[.2,.75,1],[1,.3,.75],[.65,.45,1],[1,.45,.2],[.3,1,.85],[.95,.95,.3]]),xi=`
// 0: off; 1: the default colour; 0x01RRGGBB: that colour.
fn emphasisOf(occurrence: u32, id: u32) -> u32 {
  if (id == 0u) { return 0u; }
  if (globals.emphasisStride == 0u) { return select(0u, 1u, netEmphasized(id)); }
  if (id >= globals.emphasisStride || occurrence <= globals.occurrenceBase) { return 0u; }
  let slot = (occurrence - 1u - globals.occurrenceBase) * globals.emphasisStride + id;
  if (slot >= arrayLength(&netMask)) { return 0u; }
  return netMask[slot];
}
fn emphasisColor(mark: u32, fallback: vec3f) -> vec3f {
  if ((mark >> 24u) == 0u) { return fallback; }
  return vec3f(f32((mark >> 16u) & 255u), f32((mark >> 8u) & 255u), f32(mark & 255u)) / 255.0;
}
`;function wi(t){let e=null;return Array.isArray(t)&&t.length>=3&&t.slice(0,3).every(a=>Number.isFinite(Number(a)))?e=t.slice(0,3).map(a=>Math.round(Math.min(1,Math.max(0,Number(a)))*255)):typeof t=="string"&&/^#[0-9a-f]{6}$/i.test(t)&&(e=[1,3,5].map(a=>parseInt(t.slice(a,a+2),16))),e?(1<<24|e[0]<<16|e[1]<<8|e[2])>>>0:1}function vi(t){let e=1;for(let s of t)for(let n of s?.keys()||[])e=Math.max(e,n+1);let a=new Uint32Array(Math.max(64,t.length*e));return t.forEach((s,n)=>{for(let[r,i]of s||[])Number.isInteger(r)&&r>0&&(a[n*e+r]=i>>>0)}),{stride:e,data:a}}var Mi=class{_listeners={};addEventListener(t,e){let a=this._listeners;return a[t]===void 0&&(a[t]=[]),a[t].indexOf(e)===-1&&a[t].push(e),this}removeEventListener(t,e){let a=this._listeners[t];if(a!==void 0){let s=a.indexOf(e);s!==-1&&a.splice(s,1)}return this}dispatchEvent(t){let e=this._listeners[t.type];if(e!==void 0){let a=e.slice(0);for(let s=0,n=a.length;s<n;s++)a[s].call(this,t)}return this}dispose(){for(let t in this._listeners)delete this._listeners[t]}},mt=class{_disposed=!1;_name;_parent;_child;_attributes;constructor(t,e,a,s={}){if(this._name=t,this._parent=e,this._child=a,this._attributes=s,!e.isOnGraph(a))throw new Error("Cannot connect disconnected graphs.")}getName(){return this._name}getParent(){return this._parent}getChild(){return this._child}setChild(t){return this._child=t,this}getAttributes(){return this._attributes}dispose(){this._disposed||(this._parent._destroyRef(this),this._disposed=!0)}isDisposed(){return this._disposed}},jn=class extends Mi{_emptySet=new Set;_edges=new Set;_parentEdges=new Map;_childEdges=new Map;listEdges(){return Array.from(this._edges)}listParentEdges(t){return Array.from(this._childEdges.get(t)||this._emptySet)}listParents(t){let e=new Set;for(let a of this.listParentEdges(t))e.add(a.getParent());return Array.from(e)}listChildEdges(t){return Array.from(this._parentEdges.get(t)||this._emptySet)}listChildren(t){let e=new Set;for(let a of this.listChildEdges(t))e.add(a.getChild());return Array.from(e)}disconnectParents(t,e){for(let a of this.listParentEdges(t))(!e||e(a.getParent()))&&a.dispose();return this}_createEdge(t,e,a,s){let n=new mt(t,e,a,s);this._edges.add(n);let r=n.getParent();this._parentEdges.has(r)||this._parentEdges.set(r,new Set),this._parentEdges.get(r).add(n);let i=n.getChild();return this._childEdges.has(i)||this._childEdges.set(i,new Set),this._childEdges.get(i).add(n),n}_destroyEdge(t){return this._edges.delete(t),this._parentEdges.get(t.getParent()).delete(t),this._childEdges.get(t.getChild()).delete(t),this}},xe=class{list=[];constructor(t){if(t)for(let e of t)this.list.push(e)}add(t){this.list.push(t)}remove(t){let e=this.list.indexOf(t);e>=0&&this.list.splice(e,1)}removeChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);for(let a of e)this.remove(a);return e}listRefsByChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);return e}values(){return this.list}},ae=class{set=new Set;map=new Map;constructor(t){if(t)for(let e of t)this.add(e)}add(t){let e=t.getChild();this.removeChild(e),this.set.add(t),this.map.set(e,t)}remove(t){this.set.delete(t),this.map.delete(t.getChild())}removeChild(t){let e=this.map.get(t)||null;return e&&this.remove(e),e}getRefByChild(t){return this.map.get(t)||null}values(){return Array.from(this.set)}},ue=class{map={};constructor(t){t&&Object.assign(this.map,t)}set(t,e){this.map[t]=e}delete(t){delete this.map[t]}get(t){return this.map[t]||null}keys(){return Object.keys(this.map)}values(){return Object.values(this.map)}},Q=Symbol("attributes"),gt=Symbol("immutableKeys"),Ei=class Ti extends Mi{_disposed=!1;graph;[Q];[gt];constructor(e){super(),this.graph=e,this[gt]=new Set,this[Q]=this._createAttributes()}getDefaults(){return{}}_createAttributes(){let e=this.getDefaults(),a={};for(let s in e){let n=e[s];if(n instanceof Ti){let r=this.graph._createEdge(s,this,n);this[gt].add(s),a[s]=r}else a[s]=n}return a}isOnGraph(e){return this.graph===e.graph}isDisposed(){return this._disposed}dispose(){this._disposed||(this.graph.listChildEdges(this).forEach(e=>e.dispose()),this.graph.disconnectParents(this),this._disposed=!0,this.dispatchEvent({type:"dispose"}))}detach(){return this.graph.disconnectParents(this),this}swap(e,a){for(let s in this[Q]){let n=this[Q][s];if(n instanceof mt){let r=n;r.getChild()===e&&this.setRef(s,a,r.getAttributes())}else if(n instanceof xe)for(let r of n.listRefsByChild(e)){let i=r.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}else if(n instanceof ae){let r=n.getRefByChild(e);if(r){let i=r.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}}else if(n instanceof ue)for(let r of n.keys()){let i=n.get(r);i.getChild()===e&&this.setRefMap(s,r,a,i.getAttributes())}}return this}get(e){return this[Q][e]}set(e,a){return this[Q][e]=a,this.dispatchEvent({type:"change",attribute:e})}getRef(e){let a=this[Q][e];return a?a.getChild():null}setRef(e,a,s){if(this[gt].has(e))throw new Error(`Cannot overwrite immutable attribute, "${e}".`);let n=this[Q][e];if(n&&n.dispose(),!a)return this;let r=this.graph._createEdge(e,this,a,s);return this[Q][e]=r,this.dispatchEvent({type:"change",attribute:e})}listRefs(e){return this.assertRefList(e).values().map(a=>a.getChild())}addRef(e,a,s){let n=this.graph._createEdge(e,this,a,s);return this.assertRefList(e).add(n),this.dispatchEvent({type:"change",attribute:e})}removeRef(e,a){let s=this.assertRefList(e);if(s instanceof xe)for(let n of s.listRefsByChild(a))n.dispose();else{let n=s.getRefByChild(a);n&&n.dispose()}return this}assertRefList(e){let a=this[Q][e];if(a instanceof xe||a instanceof ae)return a;throw new Error(`Expected RefList or RefSet for attribute "${e}"`)}listRefMapKeys(e){return this.assertRefMap(e).keys()}listRefMapValues(e){return this.assertRefMap(e).values().map(a=>a.getChild())}getRefMap(e,a){let s=this.assertRefMap(e).get(a);return s?s.getChild():null}setRefMap(e,a,s,n){let r=this.assertRefMap(e),i=r.get(a);if(i&&i.dispose(),!s)return this;n=Object.assign(n||{},{key:a});let o=this.graph._createEdge(e,this,s,{...n,key:a});return r.set(a,o),this.dispatchEvent({type:"change",attribute:e,key:a})}assertRefMap(e){let a=this[Q][e];if(a instanceof ue)return a;throw new Error(`Expected RefMap for attribute "${e}"`)}dispatchEvent(e){return super.dispatchEvent({...e,target:this}),this.graph.dispatchEvent({...e,target:this,type:`node:${e.type}`}),this}_destroyRef(e){let a=e.getName();if(this[Q][a]===e)this[Q][a]=null,this[gt].has(a)&&e.getChild().dispose();else if(this[Q][a]instanceof xe)this[Q][a].remove(e);else if(this[Q][a]instanceof ae)this[Q][a].remove(e);else if(this[Q][a]instanceof ue){let s=this[Q][a];for(let n of s.keys())s.get(n)===e&&s.delete(n)}else return;this.graph._destroyEdge(e),this.dispatchEvent({type:"change",attribute:a})}};var Ni="v4.4.2",xt="@glb.bin",C=(function(t){return t.ACCESSOR="Accessor",t.ANIMATION="Animation",t.ANIMATION_CHANNEL="AnimationChannel",t.ANIMATION_SAMPLER="AnimationSampler",t.BUFFER="Buffer",t.CAMERA="Camera",t.MATERIAL="Material",t.MESH="Mesh",t.PRIMITIVE="Primitive",t.PRIMITIVE_TARGET="PrimitiveTarget",t.NODE="Node",t.ROOT="Root",t.SCENE="Scene",t.SKIN="Skin",t.TEXTURE="Texture",t.TEXTURE_INFO="TextureInfo",t})({});var cu=(function(t){return t.ARRAY_BUFFER="ARRAY_BUFFER",t.ELEMENT_ARRAY_BUFFER="ELEMENT_ARRAY_BUFFER",t.INVERSE_BIND_MATRICES="INVERSE_BIND_MATRICES",t.OTHER="OTHER",t.SPARSE="SPARSE",t})({}),Ve=(function(t){return t[t.R=4096]="R",t[t.G=256]="G",t[t.B=16]="B",t[t.A=1]="A",t})({});var lu=class extends Float32Array{constructor(){throw super(),new Error("Unsupported typed array instantiation.")}},bs={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5131:typeof Float16Array<"u"?Float16Array:lu,5126:Float32Array,5130:Float64Array},H=class{static createBufferFromDataURI(t){if(typeof Buffer>"u"){let e=atob(t.split(",")[1]),a=new Uint8Array(e.length);for(let s=0;s<e.length;s++)a[s]=e.charCodeAt(s);return a}else{let e=t.split(",")[1],a=t.indexOf("base64")>=0;return Buffer.from(e,a?"base64":"utf8")}}static encodeText(t){return new TextEncoder().encode(t)}static decodeText(t){return new TextDecoder().decode(t)}static concat(t){let e=0;for(let n of t)e+=n.byteLength;let a=new Uint8Array(e),s=0;for(let n of t)a.set(n,s),s+=n.byteLength;return a}static pad(t,e=0){let a=this.padNumber(t.byteLength);if(a===t.byteLength)return t;let s=new Uint8Array(a);if(s.set(t),e!==0)for(let n=t.byteLength;n<a;n++)s[n]=e;return s}static padNumber(t){return Math.ceil(t/4)*4}static equals(t,e){if(t===e)return!0;if(t.byteLength!==e.byteLength)return!1;let a=t.byteLength;for(;a--;)if(t[a]!==e[a])return!1;return!0}static toView(t,e=0,a=1/0){return new Uint8Array(t.buffer,t.byteOffset+e,Math.min(t.byteLength,a))}static assertView(t){if(t&&!ArrayBuffer.isView(t))throw new Error(`Method requires Uint8Array parameter; received "${typeof t}".`);return t}};var du=class{match(t){return t.length>=3&&t[0]===255&&t[1]===216&&t[2]===255}getSize(t){let e=new DataView(t.buffer,t.byteOffset+4),a,s;for(;e.byteLength;){if(a=e.getUint16(0,!1),fu(e,a),s=e.getUint8(a+1),s===192||s===193||s===194)return[e.getUint16(a+7,!1),e.getUint16(a+5,!1)];e=new DataView(t.buffer,e.byteOffset+a+2)}throw new TypeError("Invalid JPG, no size found")}getChannels(t){return 3}},uu=class Ci{static PNG_FRIED_CHUNK_NAME="CgBI";match(e){return e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71&&e[4]===13&&e[5]===10&&e[6]===26&&e[7]===10}getSize(e){let a=new DataView(e.buffer,e.byteOffset);return H.decodeText(e.slice(12,16))===Ci.PNG_FRIED_CHUNK_NAME?[a.getUint32(32,!1),a.getUint32(36,!1)]:[a.getUint32(16,!1),a.getUint32(20,!1)]}getChannels(e){return 4}},Ze=class{static impls={"image/jpeg":new du,"image/png":new uu};static registerFormat(t,e){this.impls[t]=e}static getMimeType(t){for(let e in this.impls)if(this.impls[e].match(t))return e;return null}static getSize(t,e){return this.impls[e]?this.impls[e].getSize(t):null}static getChannels(t,e){return this.impls[e]?this.impls[e].getChannels(t):null}static getVRAMByteLength(t,e){if(!this.impls[e])return null;if(this.impls[e].getVRAMByteLength)return this.impls[e].getVRAMByteLength(t);let a=0,s=4,n=this.getSize(t,e);if(!n)return null;for(;n[0]>1||n[1]>1;)a+=n[0]*n[1]*s,n[0]=Math.max(Math.floor(n[0]/2),1),n[1]=Math.max(Math.floor(n[1]/2),1);return a+=1*s,a}static mimeTypeToExtension(t){return t==="image/jpeg"?"jpg":t.split("/").pop()}static extensionToMimeType(t){return t==="jpg"?"image/jpeg":t?`image/${t}`:""}};function fu(t,e){if(e>t.byteLength)throw new TypeError("Corrupt JPG, exceeded buffer limits");if(t.getUint8(e)!==255)throw new TypeError("Invalid JPG, marker table corrupted");return t}var na=class{static basename(t){let e=t.split(/[\\/]/).pop();return e.substring(0,e.lastIndexOf("."))}static extension(t){if(t.startsWith("data:image/")){let e=t.match(/data:(image\/\w+)/)[1];return Ze.mimeTypeToExtension(e)}else{if(t.startsWith("data:model/gltf+json"))return"gltf";if(t.startsWith("data:model/gltf-binary"))return"glb";if(t.startsWith("data:application/"))return"bin"}return t.split(/[\\/]/).pop().split(/[.]/).pop()}},Dn=typeof Float32Array<"u"?Float32Array:Array;Math.PI/180;180/Math.PI;function hu(){var t=new Dn(3);return Dn!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function On(t){var e=t[0],a=t[1],s=t[2];return Math.sqrt(e*e+a*a+s*s)}function bu(t,e,a){var s=e[0],n=e[1],r=e[2],i=a[3]*s+a[7]*n+a[11]*r+a[15];return i=i||1,t[0]=(a[0]*s+a[4]*n+a[8]*r+a[12])/i,t[1]=(a[1]*s+a[5]*n+a[9]*r+a[13])/i,t[2]=(a[2]*s+a[6]*n+a[10]*r+a[14])/i,t}(function(){var t=hu();return function(e,a,s,n,r,i){var o,c;for(a||(a=3),s||(s=0),n?c=Math.min(n*a+s,e.length):c=e.length,o=s;o<c;o+=a)t[0]=e[o],t[1]=e[o+1],t[2]=e[o+2],r(t,t,i),e[o]=t[0],e[o+1]=t[1],e[o+2]=t[2];return e}})();function Fi(t){let e=Bi(),a=t.propertyType==="Node"?[t]:t.listChildren();for(let s of a)s.traverse(n=>{let r=n.getMesh();if(!r)return;let i=pu(r,n.getWorldMatrix());i.min.every(isFinite)&&i.max.every(isFinite)&&(Ln(i.min,e),Ln(i.max,e))});return e}function pu(t,e){let a=Bi();for(let s of t.listPrimitives()){let n=s.getAttribute("POSITION"),r=s.getIndices();if(!n)continue;let i=[0,0,0],o=[0,0,0];for(let c=0,d=r?r.getCount():n.getCount();c<d;c++){let b=r?r.getScalar(c):c;i=n.getElement(b,i),o=bu(o,i,e),Ln(o,a)}}return a}function Ln(t,e){for(let a=0;a<3;a++)e.min[a]=Math.min(t[a],e.min[a]),e.max[a]=Math.max(t[a],e.max[a])}function Bi(){return{min:[1/0,1/0,1/0],max:[-1/0,-1/0,-1/0]}}var ki="https://null.example",Pn=class{static DEFAULT_INIT={};static PROTOCOL_REGEXP=/^[a-zA-Z]+:\/\//;static dirname(t){let e=t.lastIndexOf("/");return e===-1?"./":t.substring(0,e+1)}static basename(t){return na.basename(new URL(t,ki).pathname)}static extension(t){return na.extension(new URL(t,ki).pathname)}static resolve(t,e){if(!this.isRelativePath(e))return e;let a=t.split("/"),s=e.split("/");a.pop();for(let n=0;n<s.length;n++)s[n]!=="."&&(s[n]===".."?a.pop():a.push(s[n]));return a.join("/")}static isAbsoluteURL(t){return this.PROTOCOL_REGEXP.test(t)}static isRelativePath(t){return!/^(?:[a-zA-Z]+:)?\//.test(t)}};function Ii(t){return Object.prototype.toString.call(t)==="[object Object]"}function Ht(t){if(Ii(t)===!1)return!1;let e=t.constructor;if(e===void 0)return!0;let a=e.prototype;return!(Ii(a)===!1||Object.hasOwn(a,"isPrototypeOf")===!1)}var gu=(function(t){return t[t.SILENT=4]="SILENT",t[t.ERROR=3]="ERROR",t[t.WARN=2]="WARN",t[t.INFO=1]="INFO",t[t.DEBUG=0]="DEBUG",t})({}),ps=class ji{verbosity;static Verbosity=gu;static DEFAULT_INSTANCE=new ji(1);constructor(e){this.verbosity=e}debug(e){this.verbosity<=0&&console.debug(e)}info(e){this.verbosity<=1&&console.info(e)}warn(e){this.verbosity<=2&&console.warn(e)}error(e){this.verbosity<=3&&console.error(e)}};function mu(t){var e=t[0],a=t[1],s=t[2],n=t[3],r=t[4],i=t[5],o=t[6],c=t[7],d=t[8],b=t[9],f=t[10],m=t[11],p=t[12],u=t[13],l=t[14],y=t[15],h=e*i-a*r,g=e*o-s*r,x=a*o-s*i,v=d*u-b*p,T=d*l-f*p,I=b*l-f*u,S=e*I-a*T+s*v,R=r*I-i*T+o*v,_=d*x-b*g+f*h,A=p*x-u*g+l*h;return c*S-n*R+y*_-m*A}function yu(t,e,a){var s=e[0],n=e[1],r=e[2],i=e[3],o=e[4],c=e[5],d=e[6],b=e[7],f=e[8],m=e[9],p=e[10],u=e[11],l=e[12],y=e[13],h=e[14],g=e[15],x=a[0],v=a[1],T=a[2],I=a[3];return t[0]=x*s+v*o+T*f+I*l,t[1]=x*n+v*c+T*m+I*y,t[2]=x*r+v*d+T*p+I*h,t[3]=x*i+v*b+T*u+I*g,x=a[4],v=a[5],T=a[6],I=a[7],t[4]=x*s+v*o+T*f+I*l,t[5]=x*n+v*c+T*m+I*y,t[6]=x*r+v*d+T*p+I*h,t[7]=x*i+v*b+T*u+I*g,x=a[8],v=a[9],T=a[10],I=a[11],t[8]=x*s+v*o+T*f+I*l,t[9]=x*n+v*c+T*m+I*y,t[10]=x*r+v*d+T*p+I*h,t[11]=x*i+v*b+T*u+I*g,x=a[12],v=a[13],T=a[14],I=a[15],t[12]=x*s+v*o+T*f+I*l,t[13]=x*n+v*c+T*m+I*y,t[14]=x*r+v*d+T*p+I*h,t[15]=x*i+v*b+T*u+I*g,t}function xu(t,e){var a=e[0],s=e[1],n=e[2],r=e[4],i=e[5],o=e[6],c=e[8],d=e[9],b=e[10];return t[0]=Math.sqrt(a*a+s*s+n*n),t[1]=Math.sqrt(r*r+i*i+o*o),t[2]=Math.sqrt(c*c+d*d+b*b),t}function wu(t,e){var a=new Dn(3);xu(a,e);var s=1/a[0],n=1/a[1],r=1/a[2],i=e[0]*s,o=e[1]*n,c=e[2]*r,d=e[4]*s,b=e[5]*n,f=e[6]*r,m=e[8]*s,p=e[9]*n,u=e[10]*r,l=i+b+u,y=0;return l>0?(y=Math.sqrt(l+1)*2,t[3]=.25*y,t[0]=(f-p)/y,t[1]=(m-c)/y,t[2]=(o-d)/y):i>b&&i>u?(y=Math.sqrt(1+i-b-u)*2,t[3]=(f-p)/y,t[0]=.25*y,t[1]=(o+d)/y,t[2]=(m+c)/y):b>u?(y=Math.sqrt(1+b-i-u)*2,t[3]=(m-c)/y,t[0]=(o+d)/y,t[1]=.25*y,t[2]=(f+p)/y):(y=Math.sqrt(1+u-i-b)*2,t[3]=(o-d)/y,t[0]=(m+c)/y,t[1]=(f+p)/y,t[2]=.25*y),t}var ie=class ka{static identity(e){return e}static eq(e,a,s=1e-5){if(e.length!==a.length)return!1;for(let n=0;n<e.length;n++)if(Math.abs(e[n]-a[n])>s)return!1;return!0}static clamp(e,a,s){return e<a?a:e>s?s:e}static decodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return e/65535;case 5121:return e/255;case 5122:return Math.max(e/32767,-1);case 5120:return Math.max(e/127,-1);default:throw new Error("Invalid component type.")}}static encodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return Math.round(ka.clamp(e,0,1)*65535);case 5121:return Math.round(ka.clamp(e,0,1)*255);case 5122:return Math.round(ka.clamp(e,-1,1)*32767);case 5120:return Math.round(ka.clamp(e,-1,1)*127);default:throw new Error("Invalid component type.")}}static decompose(e,a,s,n){let r=On([e[0],e[1],e[2]]),i=On([e[4],e[5],e[6]]),o=On([e[8],e[9],e[10]]);mu(e)<0&&(r=-r),a[0]=e[12],a[1]=e[13],a[2]=e[14];let c=e.slice(),d=1/r,b=1/i,f=1/o;c[0]*=d,c[1]*=d,c[2]*=d,c[4]*=b,c[5]*=b,c[6]*=b,c[8]*=f,c[9]*=f,c[10]*=f,wu(s,c),n[0]=r,n[1]=i,n[2]=o}static compose(e,a,s,n){let r=n,i=a[0],o=a[1],c=a[2],d=a[3],b=i+i,f=o+o,m=c+c,p=i*b,u=i*f,l=i*m,y=o*f,h=o*m,g=c*m,x=d*b,v=d*f,T=d*m,I=s[0],S=s[1],R=s[2];return r[0]=(1-(y+g))*I,r[1]=(u+T)*I,r[2]=(l-v)*I,r[3]=0,r[4]=(u-T)*S,r[5]=(1-(p+g))*S,r[6]=(h+x)*S,r[7]=0,r[8]=(l+v)*R,r[9]=(h-x)*R,r[10]=(1-(p+y))*R,r[11]=0,r[12]=e[0],r[13]=e[1],r[14]=e[2],r[15]=1,r}};function vu(t,e){if(!!t!=!!e)return!1;let a=t.getChild(),s=e.getChild();return a===s||a.equals(s)}function Mu(t,e){if(!!t!=!!e)return!1;let a=t.values(),s=e.values();if(a.length!==s.length)return!1;for(let n=0;n<a.length;n++){let r=a[n],i=s[n];if(r.getChild()!==i.getChild()&&!r.getChild().equals(i.getChild()))return!1}return!0}function Eu(t,e){if(!!t!=!!e)return!1;let a=t.keys(),s=e.keys();if(a.length!==s.length)return!1;for(let n of a){let r=t.get(n),i=e.get(n);if(!!r!=!!i)return!1;let o=r.getChild(),c=i.getChild();if(o!==c&&!o.equals(c))return!1}return!0}function Oi(t,e){if(t===e)return!0;if(!!t!=!!e||!t||!e||t.length!==e.length)return!1;for(let a=0;a<t.length;a++)if(t[a]!==e[a])return!1;return!0}function Pi(t,e){if(t===e)return!0;if(!!t!=!!e)return!1;if(!Ht(t)||!Ht(e))return t===e;let a=t,s=e,n=0,r=0,i;for(i in a)n++;for(i in s)r++;if(n!==r)return!1;for(i in a){let o=a[i],c=s[i];if(fs(o)&&fs(c)){if(!Oi(o,c))return!1}else if(Ht(o)&&Ht(c)){if(!Pi(o,c))return!1}else if(o!==c)return!1}return!0}function fs(t){return Array.isArray(t)||ArrayBuffer.isView(t)}var Tu="23456789abdegjkmnpqrvwxyzABDEGJKMNPQRVWXYZ",ku=999,Iu=6,Si=new Set,Su=function(){let t="";for(let e=0;e<Iu;e++)t+=Tu.charAt(Math.floor(Math.random()*42));return t},Ru=function(){for(let t=0;t<ku;t++){let e=Su();if(!Si.has(e))return Si.add(e),e}return""},wt=t=>t,Au=new Set,Kn=class extends Ei{constructor(t,e=""){super(t),this[Q].name=e,this.init(),this.dispatchEvent({type:"create"})}getGraph(){return this.graph}getDefaults(){return Object.assign(super.getDefaults(),{name:"",extras:{}})}set(t,e){return Array.isArray(e)&&(e=e.slice()),super.set(t,e)}getName(){return this.get("name")}setName(t){return this.set("name",t)}getExtras(){return this.get("extras")}setExtras(t){return this.set("extras",t)}clone(){let t=this.constructor;return new t(this.graph).copy(this,wt)}copy(t,e=wt){for(let a in this[Q]){let s=this[Q][a];if(s instanceof mt)this[gt].has(a)||s.dispose();else if(s instanceof xe||s instanceof ae)for(let n of s.values())n.dispose();else if(s instanceof ue)for(let n of s.values())n.dispose()}for(let a in t[Q]){let s=this[Q][a],n=t[Q][a];if(n instanceof mt)this[gt].has(a)?s.getChild().copy(e(n.getChild()),e):this.setRef(a,e(n.getChild()),n.getAttributes());else if(n instanceof ae||n instanceof xe)for(let r of n.values())this.addRef(a,e(r.getChild()),r.getAttributes());else if(n instanceof ue)for(let r of n.keys()){let i=n.get(r);this.setRefMap(a,r,e(i.getChild()),i.getAttributes())}else Ht(n)?this[Q][a]=JSON.parse(JSON.stringify(n)):Array.isArray(n)||n instanceof ArrayBuffer||ArrayBuffer.isView(n)?this[Q][a]=n.slice():this[Q][a]=n}return this}equals(t,e=Au){if(this===t)return!0;if(this.propertyType!==t.propertyType)return!1;for(let a in this[Q]){if(e.has(a))continue;let s=this[Q][a],n=t[Q][a];if(s instanceof mt||n instanceof mt){if(!vu(s,n))return!1}else if(s instanceof ae||n instanceof ae||s instanceof xe||n instanceof xe){if(!Mu(s,n))return!1}else if(s instanceof ue||n instanceof ue){if(!Eu(s,n))return!1}else if(Ht(s)||Ht(n)){if(!Pi(s,n))return!1}else if(fs(s)||fs(n)){if(!Oi(s,n))return!1}else if(s!==n)return!1}return!0}detach(){return this.graph.disconnectParents(this,t=>t.propertyType!=="Root"),this}listParents(){return this.graph.listParents(this)}},Ee=class extends Kn{getDefaults(){return Object.assign(super.getDefaults(),{extensions:new ue})}getExtension(t){return this.getRefMap("extensions",t)}setExtension(t,e){return e&&e._validateParent(this),this.setRefMap("extensions",t,e)}listExtensions(){return this.listRefMapValues("extensions")}},U=class fe extends Ee{static Type={SCALAR:"SCALAR",VEC2:"VEC2",VEC3:"VEC3",VEC4:"VEC4",MAT2:"MAT2",MAT3:"MAT3",MAT4:"MAT4"};static ComponentType={BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,FLOAT:5126,FLOAT16:5131,FLOAT64:5130};init(){this.propertyType="Accessor"}getDefaults(){return Object.assign(super.getDefaults(),{array:null,type:fe.Type.SCALAR,componentType:fe.ComponentType.FLOAT,normalized:!1,sparse:!1,buffer:null})}static getElementSize(e){switch(e){case fe.Type.SCALAR:return 1;case fe.Type.VEC2:return 2;case fe.Type.VEC3:return 3;case fe.Type.VEC4:return 4;case fe.Type.MAT2:return 4;case fe.Type.MAT3:return 9;case fe.Type.MAT4:return 16;default:throw new Error("Unexpected type: "+e)}}static getComponentSize(e){switch(e){case fe.ComponentType.BYTE:case fe.ComponentType.UNSIGNED_BYTE:return 1;case fe.ComponentType.SHORT:case fe.ComponentType.UNSIGNED_SHORT:return 2;case fe.ComponentType.UNSIGNED_INT:case fe.ComponentType.FLOAT:return 4;case fe.ComponentType.FLOAT16:return 2;case fe.ComponentType.FLOAT64:return 8;default:throw new Error("Unexpected component type: "+e)}}getMinNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),n=this.getComponentType();if(this.getMin(e),a)for(let r=0;r<s;r++)e[r]=ie.decodeNormalizedInt(e[r],n);return e}getMin(e){let a=this.getArray(),s=this.getCount(),n=this.getElementSize();for(let r=0;r<n;r++)e[r]=1/0;for(let r=0;r<s*n;r+=n)for(let i=0;i<n;i++){let o=a[r+i];Number.isFinite(o)&&(e[i]=Math.min(e[i],o))}return e}getMaxNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),n=this.getComponentType();if(this.getMax(e),a)for(let r=0;r<s;r++)e[r]=ie.decodeNormalizedInt(e[r],n);return e}getMax(e){let a=this.get("array"),s=this.getCount(),n=this.getElementSize();for(let r=0;r<n;r++)e[r]=-1/0;for(let r=0;r<s*n;r+=n)for(let i=0;i<n;i++){let o=a[r+i];Number.isFinite(o)&&(e[i]=Math.max(e[i],o))}return e}getCount(){let e=this.get("array");return e?e.length/this.getElementSize():0}getType(){return this.get("type")}setType(e){return this.set("type",e)}getElementSize(){return fe.getElementSize(this.get("type"))}getComponentSize(){return this.get("array").BYTES_PER_ELEMENT}getComponentType(){return this.get("componentType")}getNormalized(){return this.get("normalized")}setNormalized(e){return this.set("normalized",e)}getScalar(e){let a=this.getElementSize(),s=this.getComponentType(),n=this.getArray();return this.getNormalized()?ie.decodeNormalizedInt(n[e*a],s):n[e*a]}setScalar(e,a){let s=this.getElementSize(),n=this.getComponentType(),r=this.getArray();return this.getNormalized()?r[e*s]=ie.encodeNormalizedInt(a,n):r[e*s]=a,this}getElement(e,a){let s=this.getNormalized(),n=this.getElementSize(),r=this.getComponentType(),i=this.getArray();for(let o=0;o<n;o++)s?a[o]=ie.decodeNormalizedInt(i[e*n+o],r):a[o]=i[e*n+o];return a}setElement(e,a){let s=this.getNormalized(),n=this.getElementSize(),r=this.getComponentType(),i=this.getArray();for(let o=0;o<n;o++)s?i[e*n+o]=ie.encodeNormalizedInt(a[o],r):i[e*n+o]=a[o];return this}getSparse(){return this.get("sparse")}setSparse(e){return this.set("sparse",e)}getBuffer(){return this.getRef("buffer")}setBuffer(e){return this.setRef("buffer",e)}getArray(){return this.get("array")}setArray(e){return this.set("componentType",e?_u(e):fe.ComponentType.FLOAT),this.set("array",e),this}getByteLength(){let e=this.get("array");return e?e.byteLength:0}};function _u(t){switch(t.constructor){case Float32Array:return U.ComponentType.FLOAT;case Uint32Array:return U.ComponentType.UNSIGNED_INT;case Uint16Array:return U.ComponentType.UNSIGNED_SHORT;case Uint8Array:return U.ComponentType.UNSIGNED_BYTE;case Int16Array:return U.ComponentType.SHORT;case Int8Array:return U.ComponentType.BYTE;case Float64Array:return U.ComponentType.FLOAT64}if(typeof Float16Array<"u"&&t.constructor===Float16Array)return U.ComponentType.FLOAT16;throw new Error("Unknown accessor componentType.")}var Di=class extends Ee{init(){this.propertyType="Animation"}getDefaults(){return Object.assign(super.getDefaults(),{channels:new ae,samplers:new ae})}addChannel(t){return this.addRef("channels",t)}removeChannel(t){return this.removeRef("channels",t)}listChannels(){return this.listRefs("channels")}addSampler(t){return this.addRef("samplers",t)}removeSampler(t){return this.removeRef("samplers",t)}listSamplers(){return this.listRefs("samplers")}},zn=class extends Ee{static TargetPath={TRANSLATION:"translation",ROTATION:"rotation",SCALE:"scale",WEIGHTS:"weights"};init(){this.propertyType="AnimationChannel"}getDefaults(){return Object.assign(super.getDefaults(),{targetPath:null,targetNode:null,sampler:null})}getTargetPath(){return this.get("targetPath")}setTargetPath(t){return this.set("targetPath",t)}getTargetNode(){return this.getRef("targetNode")}setTargetNode(t){return this.setRef("targetNode",t)}getSampler(){return this.getRef("sampler")}setSampler(t){return this.setRef("sampler",t)}},gs=class Li extends Ee{static Interpolation={LINEAR:"LINEAR",STEP:"STEP",CUBICSPLINE:"CUBICSPLINE"};init(){this.propertyType="AnimationSampler"}getDefaultAttributes(){return Object.assign(super.getDefaults(),{interpolation:Li.Interpolation.LINEAR,input:null,output:null})}getInterpolation(){return this.get("interpolation")}setInterpolation(e){return this.set("interpolation",e)}getInput(){return this.getRef("input")}setInput(e){return this.setRef("input",e,{usage:"OTHER"})}getOutput(){return this.getRef("output")}setOutput(e){return this.setRef("output",e,{usage:"OTHER"})}},Ui=class extends Ee{init(){this.propertyType="Buffer"}getDefaults(){return Object.assign(super.getDefaults(),{uri:""})}getURI(){return this.get("uri")}setURI(t){return this.set("uri",t)}},ms=class Gi extends Ee{static Type={PERSPECTIVE:"perspective",ORTHOGRAPHIC:"orthographic"};init(){this.propertyType="Camera"}getDefaults(){return Object.assign(super.getDefaults(),{type:Gi.Type.PERSPECTIVE,znear:.1,zfar:100,aspectRatio:null,yfov:Math.PI*2*50/360,xmag:1,ymag:1})}getType(){return this.get("type")}setType(e){return this.set("type",e)}getZNear(){return this.get("znear")}setZNear(e){return this.set("znear",e)}getZFar(){return this.get("zfar")}setZFar(e){return this.set("zfar",e)}getAspectRatio(){return this.get("aspectRatio")}setAspectRatio(e){return this.set("aspectRatio",e)}getYFov(){return this.get("yfov")}setYFov(e){return this.set("yfov",e)}getXMag(){return this.get("xmag")}setXMag(e){return this.set("xmag",e)}getYMag(){return this.get("ymag")}setYMag(e){return this.set("ymag",e)}},X=class extends Kn{static EXTENSION_NAME;_validateParent(t){if(!this.parentTypes.includes(t.propertyType))throw new Error(`Parent "${t.propertyType}" invalid for child "${this.propertyType}".`)}},ne=class Un extends Ee{static WrapMode={CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497};static MagFilter={NEAREST:9728,LINEAR:9729};static MinFilter={NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987};init(){this.propertyType="TextureInfo"}getDefaults(){return Object.assign(super.getDefaults(),{texCoord:0,magFilter:null,minFilter:null,wrapS:Un.WrapMode.REPEAT,wrapT:Un.WrapMode.REPEAT})}getTexCoord(){return this.get("texCoord")}setTexCoord(e){return this.set("texCoord",e)}getMagFilter(){return this.get("magFilter")}setMagFilter(e){return this.set("magFilter",e)}getMinFilter(){return this.get("minFilter")}setMinFilter(e){return this.set("minFilter",e)}getWrapS(){return this.get("wrapS")}setWrapS(e){return this.set("wrapS",e)}getWrapT(){return this.get("wrapT")}setWrapT(e){return this.set("wrapT",e)}},{R:os,G:cs,B:ls,A:Nu}=Ve,hs=class Ki extends Ee{static AlphaMode={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};init(){this.propertyType="Material"}getDefaults(){return Object.assign(super.getDefaults(),{alphaMode:Ki.AlphaMode.OPAQUE,alphaCutoff:.5,doubleSided:!1,baseColorFactor:[1,1,1,1],baseColorTexture:null,baseColorTextureInfo:new ne(this.graph,"baseColorTextureInfo"),emissiveFactor:[0,0,0],emissiveTexture:null,emissiveTextureInfo:new ne(this.graph,"emissiveTextureInfo"),normalScale:1,normalTexture:null,normalTextureInfo:new ne(this.graph,"normalTextureInfo"),occlusionStrength:1,occlusionTexture:null,occlusionTextureInfo:new ne(this.graph,"occlusionTextureInfo"),roughnessFactor:1,metallicFactor:1,metallicRoughnessTexture:null,metallicRoughnessTextureInfo:new ne(this.graph,"metallicRoughnessTextureInfo")})}getDoubleSided(){return this.get("doubleSided")}setDoubleSided(e){return this.set("doubleSided",e)}getAlpha(){return this.get("baseColorFactor")[3]}setAlpha(e){let a=this.get("baseColorFactor").slice();return a[3]=e,this.set("baseColorFactor",a)}getAlphaMode(){return this.get("alphaMode")}setAlphaMode(e){return this.set("alphaMode",e)}getAlphaCutoff(){return this.get("alphaCutoff")}setAlphaCutoff(e){return this.set("alphaCutoff",e)}getBaseColorFactor(){return this.get("baseColorFactor")}setBaseColorFactor(e){return this.set("baseColorFactor",e)}getBaseColorTexture(){return this.getRef("baseColorTexture")}getBaseColorTextureInfo(){return this.getRef("baseColorTexture")?this.getRef("baseColorTextureInfo"):null}setBaseColorTexture(e){return this.setRef("baseColorTexture",e,{channels:os|cs|ls|Nu,isColor:!0})}getEmissiveFactor(){return this.get("emissiveFactor")}setEmissiveFactor(e){return this.set("emissiveFactor",e)}getEmissiveTexture(){return this.getRef("emissiveTexture")}getEmissiveTextureInfo(){return this.getRef("emissiveTexture")?this.getRef("emissiveTextureInfo"):null}setEmissiveTexture(e){return this.setRef("emissiveTexture",e,{channels:os|cs|ls,isColor:!0})}getNormalScale(){return this.get("normalScale")}setNormalScale(e){return this.set("normalScale",e)}getNormalTexture(){return this.getRef("normalTexture")}getNormalTextureInfo(){return this.getRef("normalTexture")?this.getRef("normalTextureInfo"):null}setNormalTexture(e){return this.setRef("normalTexture",e,{channels:os|cs|ls})}getOcclusionStrength(){return this.get("occlusionStrength")}setOcclusionStrength(e){return this.set("occlusionStrength",e)}getOcclusionTexture(){return this.getRef("occlusionTexture")}getOcclusionTextureInfo(){return this.getRef("occlusionTexture")?this.getRef("occlusionTextureInfo"):null}setOcclusionTexture(e){return this.setRef("occlusionTexture",e,{channels:os})}getRoughnessFactor(){return this.get("roughnessFactor")}setRoughnessFactor(e){return this.set("roughnessFactor",e)}getMetallicFactor(){return this.get("metallicFactor")}setMetallicFactor(e){return this.set("metallicFactor",e)}getMetallicRoughnessTexture(){return this.getRef("metallicRoughnessTexture")}getMetallicRoughnessTextureInfo(){return this.getRef("metallicRoughnessTexture")?this.getRef("metallicRoughnessTextureInfo"):null}setMetallicRoughnessTexture(e){return this.setRef("metallicRoughnessTexture",e,{channels:cs|ls})}},zi=class extends Ee{init(){this.propertyType="Mesh"}getDefaults(){return Object.assign(super.getDefaults(),{weights:[],primitives:new ae})}addPrimitive(t){return this.addRef("primitives",t)}removePrimitive(t){return this.removeRef("primitives",t)}listPrimitives(){return this.listRefs("primitives")}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}},Vi=class extends Ee{init(){this.propertyType="Node"}getDefaults(){return Object.assign(super.getDefaults(),{translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1],weights:[],camera:null,mesh:null,skin:null,children:new ae})}copy(t,e=wt){if(e===wt)throw new Error("Node cannot be copied.");return super.copy(t,e)}getTranslation(){return this.get("translation")}getRotation(){return this.get("rotation")}getScale(){return this.get("scale")}setTranslation(t){return this.set("translation",t)}setRotation(t){return this.set("rotation",t)}setScale(t){return this.set("scale",t)}getMatrix(){return ie.compose(this.get("translation"),this.get("rotation"),this.get("scale"),[])}setMatrix(t){let e=this.get("translation").slice(),a=this.get("rotation").slice(),s=this.get("scale").slice();return ie.decompose(t,e,a,s),this.set("translation",e).set("rotation",a).set("scale",s)}getWorldTranslation(){let t=[0,0,0];return ie.decompose(this.getWorldMatrix(),t,[0,0,0,1],[1,1,1]),t}getWorldRotation(){let t=[0,0,0,1];return ie.decompose(this.getWorldMatrix(),[0,0,0],t,[1,1,1]),t}getWorldScale(){let t=[1,1,1];return ie.decompose(this.getWorldMatrix(),[0,0,0],[0,0,0,1],t),t}getWorldMatrix(){let t=[];for(let s=this;s!=null;s=s.getParentNode())t.push(s);let e,a=t.pop().getMatrix();for(;e=t.pop();)yu(a,a,e.getMatrix());return a}addChild(t){let e=t.getParentNode();e&&e.removeChild(t);for(let a of t.listParents())a.propertyType==="Scene"&&a.removeChild(t);return this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}getParentNode(){for(let t of this.listParents())if(t.propertyType==="Node")return t;return null}getMesh(){return this.getRef("mesh")}setMesh(t){return this.setRef("mesh",t)}getCamera(){return this.getRef("camera")}setCamera(t){return this.setRef("camera",t)}getSkin(){return this.getRef("skin")}setSkin(t){return this.setRef("skin",t)}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}traverse(t){t(this);for(let e of this.listChildren())e.traverse(t);return this}},Ia=class Hi extends Ee{static Mode={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6};init(){this.propertyType="Primitive"}getDefaults(){return Object.assign(super.getDefaults(),{mode:Hi.Mode.TRIANGLES,material:null,indices:null,attributes:new ue,targets:new ae})}getIndices(){return this.getRef("indices")}setIndices(e){return this.setRef("indices",e,{usage:"ELEMENT_ARRAY_BUFFER"})}getAttribute(e){return this.getRefMap("attributes",e)}setAttribute(e,a){return this.setRefMap("attributes",e,a,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}getMaterial(){return this.getRef("material")}setMaterial(e){return this.setRef("material",e)}getMode(){return this.get("mode")}setMode(e){return this.set("mode",e)}listTargets(){return this.listRefs("targets")}addTarget(e){return this.addRef("targets",e)}removeTarget(e){return this.removeRef("targets",e)}},Cu=class extends Kn{init(){this.propertyType="PrimitiveTarget"}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},qi=class extends Ee{init(){this.propertyType="Scene"}getDefaults(){return Object.assign(super.getDefaults(),{children:new ae})}copy(t,e=wt){if(e===wt)throw new Error("Scene cannot be copied.");return super.copy(t,e)}addChild(t){let e=t.getParentNode();return e&&e.removeChild(t),this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}traverse(t){for(let e of this.listChildren())e.traverse(t);return this}},Xi=class extends Ee{init(){this.propertyType="Skin"}getDefaults(){return Object.assign(super.getDefaults(),{skeleton:null,inverseBindMatrices:null,joints:new ae})}getSkeleton(){return this.getRef("skeleton")}setSkeleton(t){return this.setRef("skeleton",t)}getInverseBindMatrices(){return this.getRef("inverseBindMatrices")}setInverseBindMatrices(t){return this.setRef("inverseBindMatrices",t,{usage:"INVERSE_BIND_MATRICES"})}addJoint(t){return this.addRef("joints",t)}removeJoint(t){return this.removeRef("joints",t)}listJoints(){return this.listRefs("joints")}},Wi=class extends Ee{init(){this.propertyType="Texture"}getDefaults(){return Object.assign(super.getDefaults(),{image:null,mimeType:"",uri:""})}getMimeType(){return this.get("mimeType")||Ze.extensionToMimeType(na.extension(this.get("uri")))}setMimeType(t){return this.set("mimeType",t)}getURI(){return this.get("uri")}setURI(t){this.set("uri",t);let e=Ze.extensionToMimeType(na.extension(t));return e&&this.set("mimeType",e),this}getImage(){return this.get("image")}setImage(t){return this.set("image",H.assertView(t))}getSize(){let t=this.get("image");return t?Ze.getSize(t,this.getMimeType()):null}},Vn=class extends Ee{_extensions=new Set;init(){this.propertyType="Root"}getDefaults(){return Object.assign(super.getDefaults(),{asset:{generator:`glTF-Transform ${Ni}`,version:"2.0"},defaultScene:null,accessors:new ae,animations:new ae,buffers:new ae,cameras:new ae,materials:new ae,meshes:new ae,nodes:new ae,scenes:new ae,skins:new ae,textures:new ae})}constructor(t){super(t),t.addEventListener("node:create",e=>{this._addChildOfRoot(e.target)})}clone(){throw new Error("Root cannot be cloned.")}copy(t,e=wt){if(e===wt)throw new Error("Root cannot be copied.");this.set("asset",{...t.get("asset")}),this.setName(t.getName()),this.setExtras({...t.getExtras()}),this.setDefaultScene(t.getDefaultScene()?e(t.getDefaultScene()):null);for(let a of t.listRefMapKeys("extensions")){let s=t.getExtension(a);this.setExtension(a,e(s))}return this}_addChildOfRoot(t){return t instanceof qi?this.addRef("scenes",t):t instanceof Vi?this.addRef("nodes",t):t instanceof ms?this.addRef("cameras",t):t instanceof Xi?this.addRef("skins",t):t instanceof zi?this.addRef("meshes",t):t instanceof hs?this.addRef("materials",t):t instanceof Wi?this.addRef("textures",t):t instanceof Di?this.addRef("animations",t):t instanceof U?this.addRef("accessors",t):t instanceof Ui&&this.addRef("buffers",t),this}getAsset(){return this.get("asset")}listExtensionsUsed(){return Array.from(this._extensions)}listExtensionsRequired(){return this.listExtensionsUsed().filter(t=>t.isRequired())}_enableExtension(t){return this._extensions.add(t),this}_disableExtension(t){return this._extensions.delete(t),this}listScenes(){return this.listRefs("scenes")}setDefaultScene(t){return this.setRef("defaultScene",t)}getDefaultScene(){return this.getRef("defaultScene")}listNodes(){return this.listRefs("nodes")}listCameras(){return this.listRefs("cameras")}listSkins(){return this.listRefs("skins")}listMeshes(){return this.listRefs("meshes")}listMaterials(){return this.listRefs("materials")}listTextures(){return this.listRefs("textures")}listAnimations(){return this.listRefs("animations")}listAccessors(){return this.listRefs("accessors")}listBuffers(){return this.listRefs("buffers")}},Fu=class Gn{_graph=new jn;_root=new Vn(this._graph);_logger=ps.DEFAULT_INSTANCE;static _GRAPH_DOCUMENTS=new WeakMap;static fromGraph(e){return Gn._GRAPH_DOCUMENTS.get(e)||null}constructor(){Gn._GRAPH_DOCUMENTS.set(this._graph,this)}getRoot(){return this._root}getGraph(){return this._graph}getLogger(){return this._logger}setLogger(e){return this._logger=e,this}clone(){throw new Error("Use 'cloneDocument(source)' from '@gltf-transform/functions'.")}merge(e){throw new Error("Use 'mergeDocuments(target, source)' from '@gltf-transform/functions'.")}async transform(...e){let a=e.map(s=>s.name);for(let s of e)await s(this,{stack:a});return this}hasExtension(e){return this.getRoot().listExtensionsUsed().some(a=>a.extensionName===e)}createExtension(e){let a=e.EXTENSION_NAME;return this.getRoot().listExtensionsUsed().find(s=>s.extensionName===a)||new e(this)}disposeExtension(e){let a=this.getRoot().listExtensionsUsed().find(s=>s.extensionName===e);a&&a.dispose()}createScene(e=""){return new qi(this._graph,e)}createNode(e=""){return new Vi(this._graph,e)}createCamera(e=""){return new ms(this._graph,e)}createSkin(e=""){return new Xi(this._graph,e)}createMesh(e=""){return new zi(this._graph,e)}createPrimitive(){return new Ia(this._graph)}createPrimitiveTarget(e=""){return new Cu(this._graph,e)}createMaterial(e=""){return new hs(this._graph,e)}createTexture(e=""){return new Wi(this._graph,e)}createAnimation(e=""){return new Di(this._graph,e)}createAnimationChannel(e=""){return new zn(this._graph,e)}createAnimationSampler(e=""){return new gs(this._graph,e)}createAccessor(e="",a=null){return a||(a=this.getRoot().listBuffers()[0]),new U(this._graph,e).setBuffer(a)}createBuffer(e=""){return new Ui(this._graph,e)}},ee=class{static EXTENSION_NAME;extensionName="";prereadTypes=[];prewriteTypes=[];readDependencies=[];writeDependencies=[];document;required=!1;properties=new Set;_listener;constructor(t){this.document=t,t.getRoot()._enableExtension(this),this._listener=a=>{let s=a,n=s.target;n instanceof X&&n.extensionName===this.extensionName&&(s.type==="node:create"&&this._addExtensionProperty(n),s.type==="node:dispose"&&this._removeExtensionProperty(n))};let e=t.getGraph();e.addEventListener("node:create",this._listener),e.addEventListener("node:dispose",this._listener)}dispose(){this.document.getRoot()._disableExtension(this);let t=this.document.getGraph();t.removeEventListener("node:create",this._listener),t.removeEventListener("node:dispose",this._listener);for(let e of this.properties)e.dispose()}static register(){}isRequired(){return this.required}setRequired(t){return this.required=t,this}listProperties(){return Array.from(this.properties)}_addExtensionProperty(t){return this.properties.add(t),this}_removeExtensionProperty(t){return this.properties.delete(t),this}install(t,e){return this}preread(t,e){return this}prewrite(t,e){return this}},Bu=class{jsonDoc;buffers=[];bufferViews=[];bufferViewBuffers=[];accessors=[];textures=[];textureInfos=new Map;materials=[];meshes=[];cameras=[];nodes=[];skins=[];animations=[];scenes=[];constructor(t){this.jsonDoc=t}setTextureInfo(t,e){this.textureInfos.set(t,e),e.texCoord!==void 0&&t.setTexCoord(e.texCoord),e.extras!==void 0&&t.setExtras(e.extras);let a=this.jsonDoc.json.textures[e.index];if(a.sampler===void 0)return;let s=this.jsonDoc.json.samplers[a.sampler];s.magFilter!==void 0&&t.setMagFilter(s.magFilter),s.minFilter!==void 0&&t.setMinFilter(s.minFilter),s.wrapS!==void 0&&t.setWrapS(s.wrapS),s.wrapT!==void 0&&t.setWrapT(s.wrapT)}},Ri={logger:ps.DEFAULT_INSTANCE,extensions:[],dependencies:{}},ju=new Set(["Buffer","Texture","Material","Mesh","Primitive","Node","Scene"]),Ou=class{static read(t,e=Ri){let a={...Ri,...e},{json:s}=t,n=new Fu().setLogger(a.logger);this.validate(t,a);let r=new Bu(t),i=s.asset,o=n.getRoot().getAsset();i.copyright&&(o.copyright=i.copyright),i.extras&&(o.extras=i.extras),s.extras!==void 0&&n.getRoot().setExtras({...s.extras});let c=s.extensionsUsed||[],d=s.extensionsRequired||[];a.extensions.sort((h,g)=>h.EXTENSION_NAME>g.EXTENSION_NAME?1:-1);for(let h of a.extensions)if(c.includes(h.EXTENSION_NAME)){let g=n.createExtension(h).setRequired(d.includes(h.EXTENSION_NAME)),x=g.prereadTypes.filter(v=>!ju.has(v));x.length&&a.logger.warn(`Preread hooks for some types (${x.join()}), requested by extension ${g.extensionName}, are unsupported. Please file an issue or a PR.`);for(let v of g.readDependencies)g.install(v,a.dependencies[v])}let b=s.buffers||[];n.getRoot().listExtensionsUsed().filter(h=>h.prereadTypes.includes("Buffer")).forEach(h=>h.preread(r,"Buffer")),r.buffers=b.map(h=>{let g=n.createBuffer(h.name);return h.extras&&g.setExtras(h.extras),h.uri&&h.uri.indexOf("__")!==0&&g.setURI(h.uri),g}),r.bufferViewBuffers=(s.bufferViews||[]).map((h,g)=>{if(!r.bufferViews[g]){let x=t.json.buffers[h.buffer],v=x.uri?t.resources[x.uri]:t.resources[xt],T=h.byteOffset||0;r.bufferViews[g]=H.toView(v,T,h.byteLength)}return r.buffers[h.buffer]});let f=s.accessors||[];r.accessors=f.map(h=>{let g=r.bufferViewBuffers[h.bufferView],x=n.createAccessor(h.name,g).setType(h.type);return h.extras&&x.setExtras(h.extras),h.normalized!==void 0&&x.setNormalized(h.normalized),h.bufferView===void 0||x.setArray(us(h,r)),x});let m=s.images||[],p=s.textures||[];n.getRoot().listExtensionsUsed().filter(h=>h.prereadTypes.includes("Texture")).forEach(h=>h.preread(r,"Texture")),r.textures=m.map(h=>{let g=n.createTexture(h.name);if(h.extras&&g.setExtras(h.extras),h.bufferView!==void 0){let x=s.bufferViews[h.bufferView],v=t.json.buffers[x.buffer],T=v.uri?t.resources[v.uri]:t.resources[xt],I=x.byteOffset||0,S=x.byteLength,R=T.slice(I,I+S);g.setImage(R)}else h.uri!==void 0&&(g.setImage(t.resources[h.uri]),h.uri.indexOf("__")!==0&&g.setURI(h.uri));if(h.mimeType!==void 0)g.setMimeType(h.mimeType);else if(h.uri){let x=na.extension(h.uri);g.setMimeType(Ze.extensionToMimeType(x))}return g}),n.getRoot().listExtensionsUsed().filter(h=>h.prereadTypes.includes("Material")).forEach(h=>h.preread(r,"Material")),r.materials=(s.materials||[]).map(h=>{let g=n.createMaterial(h.name);h.extras&&g.setExtras(h.extras),h.alphaMode!==void 0&&g.setAlphaMode(h.alphaMode),h.alphaCutoff!==void 0&&g.setAlphaCutoff(h.alphaCutoff),h.doubleSided!==void 0&&g.setDoubleSided(h.doubleSided);let x=h.pbrMetallicRoughness||{};if(x.baseColorFactor!==void 0&&g.setBaseColorFactor(x.baseColorFactor),h.emissiveFactor!==void 0&&g.setEmissiveFactor(h.emissiveFactor),x.metallicFactor!==void 0&&g.setMetallicFactor(x.metallicFactor),x.roughnessFactor!==void 0&&g.setRoughnessFactor(x.roughnessFactor),x.baseColorTexture!==void 0){let v=x.baseColorTexture,T=r.textures[p[v.index].source];g.setBaseColorTexture(T),r.setTextureInfo(g.getBaseColorTextureInfo(),v)}if(h.emissiveTexture!==void 0){let v=h.emissiveTexture,T=r.textures[p[v.index].source];g.setEmissiveTexture(T),r.setTextureInfo(g.getEmissiveTextureInfo(),v)}if(h.normalTexture!==void 0){let v=h.normalTexture,T=r.textures[p[v.index].source];g.setNormalTexture(T),r.setTextureInfo(g.getNormalTextureInfo(),v),h.normalTexture.scale!==void 0&&g.setNormalScale(h.normalTexture.scale)}if(h.occlusionTexture!==void 0){let v=h.occlusionTexture,T=r.textures[p[v.index].source];g.setOcclusionTexture(T),r.setTextureInfo(g.getOcclusionTextureInfo(),v),h.occlusionTexture.strength!==void 0&&g.setOcclusionStrength(h.occlusionTexture.strength)}if(x.metallicRoughnessTexture!==void 0){let v=x.metallicRoughnessTexture,T=r.textures[p[v.index].source];g.setMetallicRoughnessTexture(T),r.setTextureInfo(g.getMetallicRoughnessTextureInfo(),v)}return g}),n.getRoot().listExtensionsUsed().filter(h=>h.prereadTypes.includes("Mesh")).forEach(h=>h.preread(r,"Mesh"));let u=s.meshes||[];n.getRoot().listExtensionsUsed().filter(h=>h.prereadTypes.includes("Primitive")).forEach(h=>h.preread(r,"Primitive")),r.meshes=u.map(h=>{let g=n.createMesh(h.name);return h.extras&&g.setExtras(h.extras),h.weights!==void 0&&g.setWeights(h.weights),(h.primitives||[]).forEach(x=>{let v=n.createPrimitive();x.extras&&v.setExtras(x.extras),x.material!==void 0&&v.setMaterial(r.materials[x.material]),x.mode!==void 0&&v.setMode(x.mode);for(let[I,S]of Object.entries(x.attributes||{}))v.setAttribute(I,r.accessors[S]);x.indices!==void 0&&v.setIndices(r.accessors[x.indices]);let T=h.extras&&h.extras.targetNames||[];(x.targets||[]).forEach((I,S)=>{let R=T[S]||S.toString(),_=n.createPrimitiveTarget(R);for(let[A,j]of Object.entries(I))_.setAttribute(A,r.accessors[j]);v.addTarget(_)}),g.addPrimitive(v)}),g}),r.cameras=(s.cameras||[]).map(h=>{let g=n.createCamera(h.name).setType(h.type);if(h.extras&&g.setExtras(h.extras),h.type===ms.Type.PERSPECTIVE){let x=h.perspective;g.setYFov(x.yfov),g.setZNear(x.znear),x.zfar!==void 0&&g.setZFar(x.zfar),x.aspectRatio!==void 0&&g.setAspectRatio(x.aspectRatio)}else{let x=h.orthographic;g.setZNear(x.znear).setZFar(x.zfar).setXMag(x.xmag).setYMag(x.ymag)}return g});let l=s.nodes||[];n.getRoot().listExtensionsUsed().filter(h=>h.prereadTypes.includes("Node")).forEach(h=>h.preread(r,"Node")),r.nodes=l.map(h=>{let g=n.createNode(h.name);if(h.extras&&g.setExtras(h.extras),h.translation!==void 0&&g.setTranslation(h.translation),h.rotation!==void 0&&g.setRotation(h.rotation),h.scale!==void 0&&g.setScale(h.scale),h.matrix!==void 0){let x=[0,0,0],v=[0,0,0,1],T=[1,1,1];ie.decompose(h.matrix,x,v,T),g.setTranslation(x),g.setRotation(v),g.setScale(T)}return h.weights!==void 0&&g.setWeights(h.weights),g}),r.skins=(s.skins||[]).map(h=>{let g=n.createSkin(h.name);h.extras&&g.setExtras(h.extras),h.inverseBindMatrices!==void 0&&g.setInverseBindMatrices(r.accessors[h.inverseBindMatrices]),h.skeleton!==void 0&&g.setSkeleton(r.nodes[h.skeleton]);for(let x of h.joints)g.addJoint(r.nodes[x]);return g}),l.map((h,g)=>{let x=r.nodes[g];(h.children||[]).forEach(v=>x.addChild(r.nodes[v])),h.mesh!==void 0&&x.setMesh(r.meshes[h.mesh]),h.camera!==void 0&&x.setCamera(r.cameras[h.camera]),h.skin!==void 0&&x.setSkin(r.skins[h.skin])}),r.animations=(s.animations||[]).map(h=>{let g=n.createAnimation(h.name);h.extras&&g.setExtras(h.extras);let x=(h.samplers||[]).map(v=>{let T=n.createAnimationSampler().setInput(r.accessors[v.input]).setOutput(r.accessors[v.output]).setInterpolation(v.interpolation||gs.Interpolation.LINEAR);return v.extras&&T.setExtras(v.extras),g.addSampler(T),T});return(h.channels||[]).forEach(v=>{let T=n.createAnimationChannel().setSampler(x[v.sampler]).setTargetPath(v.target.path);v.target.node!==void 0&&T.setTargetNode(r.nodes[v.target.node]),v.extras&&T.setExtras(v.extras),g.addChannel(T)}),g});let y=s.scenes||[];return n.getRoot().listExtensionsUsed().filter(h=>h.prereadTypes.includes("Scene")).forEach(h=>h.preread(r,"Scene")),r.scenes=y.map(h=>{let g=n.createScene(h.name);return h.extras&&g.setExtras(h.extras),(h.nodes||[]).map(x=>r.nodes[x]).forEach(x=>g.addChild(x)),g}),s.scene!==void 0&&n.getRoot().setDefaultScene(r.scenes[s.scene]),n.getRoot().listExtensionsUsed().forEach(h=>h.read(r)),f.forEach((h,g)=>{let x=r.accessors[g],v=!!h.sparse,T=!h.bufferView&&!x.getArray();(v||T)&&x.setSparse(!0).setArray(Du(h,r))}),n}static validate(t,e){let a=t.json;if(a.asset.version!=="2.0")throw new Error(`Unsupported glTF version, "${a.asset.version}".`);if(a.extensionsRequired){for(let s of a.extensionsRequired)if(!e.extensions.find(n=>n.EXTENSION_NAME===s))throw new Error(`Missing required extension, "${s}".`)}if(a.extensionsUsed)for(let s of a.extensionsUsed)e.extensions.find(n=>n.EXTENSION_NAME===s)||e.logger.warn(`Missing optional extension, "${s}".`)}};function Pu(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],n=a.json.bufferViews[t.bufferView],r=bs[t.componentType],i=U.getElementSize(t.type),o=r.BYTES_PER_ELEMENT,c=t.byteOffset||0,d=new r(t.count*i),b=new DataView(s.buffer,s.byteOffset,s.byteLength),f=n.byteStride;for(let m=0;m<t.count;m++)for(let p=0;p<i;p++){let u=c+m*f+p*o,l;switch(t.componentType){case U.ComponentType.FLOAT:l=b.getFloat32(u,!0);break;case U.ComponentType.UNSIGNED_INT:l=b.getUint32(u,!0);break;case U.ComponentType.UNSIGNED_SHORT:l=b.getUint16(u,!0);break;case U.ComponentType.UNSIGNED_BYTE:l=b.getUint8(u);break;case U.ComponentType.SHORT:l=b.getInt16(u,!0);break;case U.ComponentType.BYTE:l=b.getInt8(u);break;case U.ComponentType.FLOAT16:l=b.getFloat16(u,!0);break;case U.ComponentType.FLOAT64:l=b.getFloat64(u,!0);break;default:throw new Error(`Unexpected componentType "${t.componentType}".`)}d[m*i+p]=l}return d}function us(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],n=a.json.bufferViews[t.bufferView],r=bs[t.componentType],i=U.getElementSize(t.type),o=r.BYTES_PER_ELEMENT,c=i*o;if(n.byteStride!==void 0&&n.byteStride!==c)return Pu(t,e);let d=s.byteOffset+(t.byteOffset||0),b=t.count*i*o;return new r(s.buffer.slice(d,d+b))}function Du(t,e){let a=bs[t.componentType],s=U.getElementSize(t.type),n;t.bufferView!==void 0?n=us(t,e):n=new a(t.count*s);let r=t.sparse;if(!r)return n;let i=r.count,o={...t,...r.indices,count:i,type:"SCALAR"},c={...t,...r.values,count:i},d=us(o,e),b=us(c,e);for(let f=0;f<o.count;f++)for(let m=0;m<s;m++)n[d[f]*s+m]=b[f*s+m];return n}var $i=(function(t){return t[t.ARRAY_BUFFER=34962]="ARRAY_BUFFER",t[t.ELEMENT_ARRAY_BUFFER=34963]="ELEMENT_ARRAY_BUFFER",t})($i||{}),yt=class{_doc;jsonDoc;options;static BufferViewTarget=$i;static BufferViewUsage=cu;static USAGE_TO_TARGET={ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963};accessorIndexMap=new Map;animationIndexMap=new Map;bufferIndexMap=new Map;cameraIndexMap=new Map;skinIndexMap=new Map;materialIndexMap=new Map;meshIndexMap=new Map;nodeIndexMap=new Map;imageIndexMap=new Map;textureDefIndexMap=new Map;textureInfoDefMap=new Map;samplerDefIndexMap=new Map;sceneIndexMap=new Map;imageBufferViews=[];otherBufferViews=new Map;otherBufferViewsIndexMap=new Map;extensionData={};bufferURIGenerator;imageURIGenerator;logger;_accessorUsageMap=new Map;accessorUsageGroupedByParent=new Set(["ARRAY_BUFFER"]);accessorParents=new Map;constructor(t,e,a){this._doc=t,this.jsonDoc=e,this.options=a;let s=t.getRoot(),n=s.listBuffers().length,r=s.listTextures().length;this.bufferURIGenerator=new Ai(n>1,()=>a.basename||"buffer"),this.imageURIGenerator=new Ai(r>1,i=>Lu(t,i)||a.basename||"texture"),this.logger=t.getLogger()}createTextureInfoDef(t,e){let a={magFilter:e.getMagFilter()||void 0,minFilter:e.getMinFilter()||void 0,wrapS:e.getWrapS(),wrapT:e.getWrapT()},s=JSON.stringify(a);this.samplerDefIndexMap.has(s)||(this.samplerDefIndexMap.set(s,this.jsonDoc.json.samplers.length),this.jsonDoc.json.samplers.push(a));let n={source:this.imageIndexMap.get(t),sampler:this.samplerDefIndexMap.get(s)},r=JSON.stringify(n);this.textureDefIndexMap.has(r)||(this.textureDefIndexMap.set(r,this.jsonDoc.json.textures.length),this.jsonDoc.json.textures.push(n));let i={index:this.textureDefIndexMap.get(r)};return e.getTexCoord()!==0&&(i.texCoord=e.getTexCoord()),Object.keys(e.getExtras()).length>0&&(i.extras=e.getExtras()),this.textureInfoDefMap.set(e,i),i}createPropertyDef(t){let e={};return t.getName()&&(e.name=t.getName()),Object.keys(t.getExtras()).length>0&&(e.extras=t.getExtras()),e}createAccessorDef(t){let e=this.createPropertyDef(t);return e.type=t.getType(),e.componentType=t.getComponentType(),e.count=t.getCount(),this._doc.getGraph().listParentEdges(t).some(a=>a.getName()==="attributes"&&a.getAttributes().key==="POSITION"||a.getName()==="input")&&(e.max=t.getMax([]).map(Math.fround),e.min=t.getMin([]).map(Math.fround)),t.getNormalized()&&(e.normalized=t.getNormalized()),e}createImageData(t,e,a){if(this.options.format==="GLB")this.imageBufferViews.push(e),t.bufferView=this.jsonDoc.json.bufferViews.length,this.jsonDoc.json.bufferViews.push({buffer:0,byteOffset:-1,byteLength:e.byteLength});else{let s=Ze.mimeTypeToExtension(a.getMimeType());t.uri=this.imageURIGenerator.createURI(a,s),this.assignResourceURI(t.uri,e,!1)}}assignResourceURI(t,e,a){let s=this.jsonDoc.resources;if(!(t in s)){s[t]=e;return}if(e===s[t]){this.logger.warn(`Duplicate resource URI, "${t}".`);return}let n=`Resource URI "${t}" already assigned to different data.`;if(!a){this.logger.warn(n);return}throw new Error(n)}getAccessorUsage(t){let e=this._accessorUsageMap.get(t);if(e)return e;if(t.getSparse())return"SPARSE";for(let a of this._doc.getGraph().listParentEdges(t)){let{usage:s}=a.getAttributes();if(s)return s;a.getParent().propertyType!=="Root"&&this.logger.warn(`Missing attribute ".usage" on edge, "${a.getName()}".`)}return"OTHER"}addAccessorToUsageGroup(t,e){let a=this._accessorUsageMap.get(t);if(a&&a!==e)throw new Error(`Accessor with usage "${a}" cannot be reused as "${e}".`);return this._accessorUsageMap.set(t,e),this}},Ai=class{multiple;basename;counter={};constructor(t,e){this.multiple=t,this.basename=e}createURI(t,e){if(t.getURI())return t.getURI();if(this.multiple){let a=this.basename(t);return this.counter[a]=this.counter[a]||1,`${a}_${this.counter[a]++}.${e}`}else return`${this.basename(t)}.${e}`}};function Lu(t,e){let a=t.getGraph().listParentEdges(e).find(s=>s.getParent()!==t.getRoot());return a?a.getName().replace(/texture$/i,""):""}var{BufferViewUsage:ds}=yt,{UNSIGNED_INT:Uu,UNSIGNED_SHORT:Gu,UNSIGNED_BYTE:Ku}=U.ComponentType,zu=new Set(["Accessor","Buffer","Material","Mesh"]),Vu=class{static write(t,e){let a=t.getGraph(),s=t.getRoot(),n={asset:{generator:`glTF-Transform ${Ni}`,...s.getAsset()},extras:{...s.getExtras()}},r={json:n,resources:{}},i=new yt(t,r,e),o=e.logger||ps.DEFAULT_INSTANCE,c=new Set(e.extensions.map(l=>l.EXTENSION_NAME)),d=t.getRoot().listExtensionsUsed().filter(l=>c.has(l.extensionName)).sort((l,y)=>l.extensionName>y.extensionName?1:-1),b=t.getRoot().listExtensionsRequired().filter(l=>c.has(l.extensionName)).sort((l,y)=>l.extensionName>y.extensionName?1:-1);d.length<t.getRoot().listExtensionsUsed().length&&o.warn("Some extensions were not registered for I/O, and will not be written.");for(let l of d){let y=l.prewriteTypes.filter(h=>!zu.has(h));y.length&&o.warn(`Prewrite hooks for some types (${y.join()}), requested by extension ${l.extensionName}, are unsupported. Please file an issue or a PR.`);for(let h of l.writeDependencies)l.install(h,e.dependencies[h])}function f(l,y,h,g){let x=[],v=0;for(let I of l){let S=i.createAccessorDef(I);S.bufferView=n.bufferViews.length;let R=I.getArray(),_=H.pad(H.toView(R));S.byteOffset=v,v+=_.byteLength,x.push(_),i.accessorIndexMap.set(I,n.accessors.length),n.accessors.push(S)}let T={buffer:y,byteOffset:h,byteLength:H.concat(x).byteLength};return g&&(T.target=g),n.bufferViews.push(T),{buffers:x,byteLength:v}}function m(l,y,h){let g=l[0].getCount(),x=0;for(let R of l){let _=i.createAccessorDef(R);_.bufferView=n.bufferViews.length,_.byteOffset=x;let A=R.getElementSize(),j=R.getComponentSize();x+=H.padNumber(A*j),i.accessorIndexMap.set(R,n.accessors.length),n.accessors.push(_)}let v=g*x,T=new ArrayBuffer(v),I=new DataView(T);for(let R=0;R<g;R++){let _=0;for(let A of l){let j=A.getElementSize(),L=A.getComponentSize(),F=A.getComponentType(),K=A.getArray();for(let W=0;W<j;W++){let te=R*x+_+W*L,oe=K[R*j+W];switch(F){case U.ComponentType.FLOAT:I.setFloat32(te,oe,!0);break;case U.ComponentType.BYTE:I.setInt8(te,oe);break;case U.ComponentType.SHORT:I.setInt16(te,oe,!0);break;case U.ComponentType.UNSIGNED_BYTE:I.setUint8(te,oe);break;case U.ComponentType.UNSIGNED_SHORT:I.setUint16(te,oe,!0);break;case U.ComponentType.UNSIGNED_INT:I.setUint32(te,oe,!0);break;case U.ComponentType.FLOAT16:I.setFloat16(te,oe,!0);break;case U.ComponentType.FLOAT64:I.setFloat64(te,oe,!0);break;default:throw new Error("Unexpected component type: "+F)}}_+=H.padNumber(j*L)}}let S={buffer:y,byteOffset:h,byteLength:v,byteStride:x,target:yt.BufferViewTarget.ARRAY_BUFFER};return n.bufferViews.push(S),{byteLength:v,buffers:[new Uint8Array(T)]}}function p(l,y,h){let g=[],x=0,v=new Map,T=-1/0,I=!1;for(let F of l){let K=i.createAccessorDef(F);n.accessors.push(K),i.accessorIndexMap.set(F,n.accessors.length-1);let W=[],te=[],oe=[],Oe=new Array(F.getElementSize()).fill(0);for(let ve=0,Je=F.getCount();ve<Je;ve++)if(F.getElement(ve,oe),!ie.eq(oe,Oe,0)){T=Math.max(ve,T),W.push(ve);for(let ze=0;ze<oe.length;ze++)te.push(oe[ze])}let de=W.length,Pe={accessorDef:K,count:de};if(v.set(F,Pe),de===0)continue;de>F.getCount()/2&&(I=!0);let Ke=bs[F.getComponentType()];Pe.indices=W,Pe.values=new Ke(te)}if(!Number.isFinite(T))return{buffers:g,byteLength:x};I&&o.warn("Some sparse accessors have >50% non-zero elements, which may increase file size.");let S=T<255?Uint8Array:T<65535?Uint16Array:Uint32Array,R=T<255?Ku:T<65535?Gu:Uu,_={buffer:y,byteOffset:h+x,byteLength:0};for(let F of l){let K=v.get(F);if(K.count===0)continue;K.indicesByteOffset=_.byteLength;let W=H.pad(H.toView(new S(K.indices)));g.push(W),x+=W.byteLength,_.byteLength+=W.byteLength}n.bufferViews.push(_);let A=n.bufferViews.length-1,j={buffer:y,byteOffset:h+x,byteLength:0};for(let F of l){let K=v.get(F);if(K.count===0)continue;K.valuesByteOffset=j.byteLength;let W=H.pad(H.toView(K.values));g.push(W),x+=W.byteLength,j.byteLength+=W.byteLength}n.bufferViews.push(j);let L=n.bufferViews.length-1;for(let F of l){let K=v.get(F);K.count!==0&&(K.accessorDef.sparse={count:K.count,indices:{bufferView:A,byteOffset:K.indicesByteOffset,componentType:R},values:{bufferView:L,byteOffset:K.valuesByteOffset}})}return{buffers:g,byteLength:x}}if(n.accessors=[],n.bufferViews=[],n.samplers=[],n.textures=[],n.images=s.listTextures().map((l,y)=>{let h=i.createPropertyDef(l);l.getMimeType()&&(h.mimeType=l.getMimeType());let g=l.getImage();return g&&i.createImageData(h,g,l),i.imageIndexMap.set(l,y),h}),d.filter(l=>l.prewriteTypes.includes("Accessor")).forEach(l=>l.prewrite(i,"Accessor")),s.listAccessors().forEach(l=>{let y=i.accessorUsageGroupedByParent,h=i.accessorParents;if(i.accessorIndexMap.has(l))return;let g=i.getAccessorUsage(l);if(i.addAccessorToUsageGroup(l,g),y.has(g)){let x=a.listParents(l).find(v=>v.propertyType!=="Root");h.set(l,x)}}),d.filter(l=>l.prewriteTypes.includes("Buffer")).forEach(l=>l.prewrite(i,"Buffer")),(s.listAccessors().length>0||i.otherBufferViews.size>0||s.listTextures().length>0&&e.format==="GLB")&&s.listBuffers().length===0)throw new Error("Buffer required for Document resources, but none was found.");n.buffers=[],s.listBuffers().forEach((l,y)=>{let h=i.createPropertyDef(l),g=i.accessorUsageGroupedByParent,x=l.listParents().filter(A=>A instanceof U),v=new Set(x.map(A=>i.accessorParents.get(A))),T=new Map(Array.from(v).map((A,j)=>[A,j])),I={};for(let A of x){if(i.accessorIndexMap.has(A))continue;let j=i.getAccessorUsage(A),L=j;if(g.has(j)){let F=i.accessorParents.get(A);L+=`:${T.get(F)}`}I[L]||={usage:j,accessors:[]},I[L].accessors.push(A)}let S=[],R=n.buffers.length,_=0;for(let{usage:A,accessors:j}of Object.values(I))if(A===ds.ARRAY_BUFFER&&e.vertexLayout==="interleaved"){let L=m(j,R,_);_+=L.byteLength;for(let F of L.buffers)S.push(F)}else if(A===ds.ARRAY_BUFFER)for(let L of j){let F=m([L],R,_);_+=F.byteLength;for(let K of F.buffers)S.push(K)}else if(A===ds.SPARSE){let L=p(j,R,_);_+=L.byteLength;for(let F of L.buffers)S.push(F)}else if(A===ds.ELEMENT_ARRAY_BUFFER){let L=yt.BufferViewTarget.ELEMENT_ARRAY_BUFFER,F=f(j,R,_,L);_+=F.byteLength;for(let K of F.buffers)S.push(K)}else{let L=f(j,R,_);_+=L.byteLength;for(let F of L.buffers)S.push(F)}if(i.imageBufferViews.length&&y===0){for(let A=0;A<i.imageBufferViews.length;A++)if(n.bufferViews[n.images[A].bufferView].byteOffset=_,_+=i.imageBufferViews[A].byteLength,S.push(i.imageBufferViews[A]),_%8){let j=8-_%8;_+=j,S.push(new Uint8Array(j))}}if(i.otherBufferViews.has(l))for(let A of i.otherBufferViews.get(l))n.bufferViews.push({buffer:R,byteOffset:_,byteLength:A.byteLength}),i.otherBufferViewsIndexMap.set(A,n.bufferViews.length-1),_+=A.byteLength,S.push(A);if(_){let A;e.format==="GLB"?A=xt:(A=i.bufferURIGenerator.createURI(l,"bin"),h.uri=A),h.byteLength=_,i.assignResourceURI(A,H.concat(S),!0)}n.buffers.push(h),i.bufferIndexMap.set(l,y)}),s.listAccessors().find(l=>!l.getBuffer())&&o.warn("Skipped writing one or more Accessors: no Buffer assigned."),d.filter(l=>l.prewriteTypes.includes("Material")).forEach(l=>l.prewrite(i,"Material")),n.materials=s.listMaterials().map((l,y)=>{let h=i.createPropertyDef(l);if(l.getAlphaMode()!==hs.AlphaMode.OPAQUE&&(h.alphaMode=l.getAlphaMode()),l.getAlphaMode()===hs.AlphaMode.MASK&&(h.alphaCutoff=l.getAlphaCutoff()),l.getDoubleSided()&&(h.doubleSided=!0),h.pbrMetallicRoughness={},ie.eq(l.getBaseColorFactor(),[1,1,1,1])||(h.pbrMetallicRoughness.baseColorFactor=l.getBaseColorFactor()),ie.eq(l.getEmissiveFactor(),[0,0,0])||(h.emissiveFactor=l.getEmissiveFactor()),l.getRoughnessFactor()!==1&&(h.pbrMetallicRoughness.roughnessFactor=l.getRoughnessFactor()),l.getMetallicFactor()!==1&&(h.pbrMetallicRoughness.metallicFactor=l.getMetallicFactor()),l.getBaseColorTexture()){let g=l.getBaseColorTexture(),x=l.getBaseColorTextureInfo();h.pbrMetallicRoughness.baseColorTexture=i.createTextureInfoDef(g,x)}if(l.getEmissiveTexture()){let g=l.getEmissiveTexture(),x=l.getEmissiveTextureInfo();h.emissiveTexture=i.createTextureInfoDef(g,x)}if(l.getNormalTexture()){let g=l.getNormalTexture(),x=l.getNormalTextureInfo(),v=i.createTextureInfoDef(g,x);l.getNormalScale()!==1&&(v.scale=l.getNormalScale()),h.normalTexture=v}if(l.getOcclusionTexture()){let g=l.getOcclusionTexture(),x=l.getOcclusionTextureInfo(),v=i.createTextureInfoDef(g,x);l.getOcclusionStrength()!==1&&(v.strength=l.getOcclusionStrength()),h.occlusionTexture=v}if(l.getMetallicRoughnessTexture()){let g=l.getMetallicRoughnessTexture(),x=l.getMetallicRoughnessTextureInfo();h.pbrMetallicRoughness.metallicRoughnessTexture=i.createTextureInfoDef(g,x)}return i.materialIndexMap.set(l,y),h}),d.filter(l=>l.prewriteTypes.includes("Mesh")).forEach(l=>l.prewrite(i,"Mesh")),n.meshes=s.listMeshes().map((l,y)=>{let h=i.createPropertyDef(l),g=null;return h.primitives=l.listPrimitives().map(x=>{let v={attributes:{}};v.mode=x.getMode();let T=x.getMaterial();T&&(v.material=i.materialIndexMap.get(T)),Object.keys(x.getExtras()).length&&(v.extras=x.getExtras());let I=x.getIndices();I&&(v.indices=i.accessorIndexMap.get(I));for(let S of x.listSemantics())v.attributes[S]=i.accessorIndexMap.get(x.getAttribute(S));for(let S of x.listTargets()){let R={};for(let _ of S.listSemantics())R[_]=i.accessorIndexMap.get(S.getAttribute(_));v.targets=v.targets||[],v.targets.push(R)}return x.listTargets().length&&!g&&(g=x.listTargets().map(S=>S.getName())),v}),l.getWeights().length&&(h.weights=l.getWeights()),g&&(h.extras=h.extras||{},h.extras.targetNames=g),i.meshIndexMap.set(l,y),h}),n.cameras=s.listCameras().map((l,y)=>{let h=i.createPropertyDef(l);if(h.type=l.getType(),h.type===ms.Type.PERSPECTIVE){h.perspective={znear:l.getZNear(),zfar:l.getZFar(),yfov:l.getYFov()};let g=l.getAspectRatio();g!==null&&(h.perspective.aspectRatio=g)}else h.orthographic={znear:l.getZNear(),zfar:l.getZFar(),xmag:l.getXMag(),ymag:l.getYMag()};return i.cameraIndexMap.set(l,y),h}),n.nodes=s.listNodes().map((l,y)=>{let h=i.createPropertyDef(l);return ie.eq(l.getTranslation(),[0,0,0])||(h.translation=l.getTranslation()),ie.eq(l.getRotation(),[0,0,0,1])||(h.rotation=l.getRotation()),ie.eq(l.getScale(),[1,1,1])||(h.scale=l.getScale()),l.getWeights().length&&(h.weights=l.getWeights()),i.nodeIndexMap.set(l,y),h}),n.skins=s.listSkins().map((l,y)=>{let h=i.createPropertyDef(l),g=l.getInverseBindMatrices();g&&(h.inverseBindMatrices=i.accessorIndexMap.get(g));let x=l.getSkeleton();return x&&(h.skeleton=i.nodeIndexMap.get(x)),h.joints=l.listJoints().map(v=>i.nodeIndexMap.get(v)),i.skinIndexMap.set(l,y),h}),s.listNodes().forEach((l,y)=>{let h=n.nodes[y],g=l.getMesh();g&&(h.mesh=i.meshIndexMap.get(g));let x=l.getCamera();x&&(h.camera=i.cameraIndexMap.get(x));let v=l.getSkin();v&&(h.skin=i.skinIndexMap.get(v)),l.listChildren().length>0&&(h.children=l.listChildren().map(T=>i.nodeIndexMap.get(T)))}),n.animations=s.listAnimations().map((l,y)=>{let h=i.createPropertyDef(l),g=new Map;return h.samplers=l.listSamplers().map((x,v)=>{let T=i.createPropertyDef(x);return T.input=i.accessorIndexMap.get(x.getInput()),T.output=i.accessorIndexMap.get(x.getOutput()),T.interpolation=x.getInterpolation(),g.set(x,v),T}),h.channels=l.listChannels().map(x=>{let v=i.createPropertyDef(x);return v.sampler=g.get(x.getSampler()),v.target={node:i.nodeIndexMap.get(x.getTargetNode()),path:x.getTargetPath()},v}),i.animationIndexMap.set(l,y),h}),n.scenes=s.listScenes().map((l,y)=>{let h=i.createPropertyDef(l);return h.nodes=l.listChildren().map(g=>i.nodeIndexMap.get(g)),i.sceneIndexMap.set(l,y),h});let u=s.getDefaultScene();return u&&(n.scene=s.listScenes().indexOf(u)),n.extensionsUsed=d.map(l=>l.extensionName),n.extensionsRequired=b.map(l=>l.extensionName),d.forEach(l=>l.write(i)),Hu(n),r}};function Hu(t){let e=[];for(let a in t){let s=t[a];(Array.isArray(s)&&s.length===0||s===null||s===""||s&&typeof s=="object"&&Object.keys(s).length===0)&&e.push(a)}for(let a of e)delete t[a]}var qu=class{_logger=ps.DEFAULT_INSTANCE;_extensions=new Set;_dependencies={};_vertexLayout="interleaved";_strictResources=!0;lastReadBytes=0;lastWriteBytes=0;setLogger(t){return this._logger=t,this}registerExtensions(t){for(let e of t)this._extensions.add(e),e.register();return this}registerDependencies(t){return Object.assign(this._dependencies,t),this}setVertexLayout(t){return this._vertexLayout=t,this}setStrictResources(t){return this._strictResources=t,this}async read(t){return await this.readJSON(await this.readAsJSON(t))}async readAsJSON(t){let e=await this.readURI(t,"view");this.lastReadBytes=e.byteLength;let a=_i(e)?this._binaryToJSON(e):{json:JSON.parse(H.decodeText(e)),resources:{}};return await this._readResourcesExternal(a,this.dirname(t)),this._readResourcesInternal(a),a}async readJSON(t){return t=this._copyJSON(t),this._readResourcesInternal(t),Ou.read(t,{extensions:Array.from(this._extensions),dependencies:this._dependencies,logger:this._logger})}async binaryToJSON(t){let e=this._binaryToJSON(H.assertView(t));this._readResourcesInternal(e);let a=e.json;if(a.buffers&&a.buffers.some(s=>Xu(e,s)))throw new Error("Cannot resolve external buffers with binaryToJSON().");if(a.images&&a.images.some(s=>Wu(e,s)))throw new Error("Cannot resolve external images with binaryToJSON().");return e}async readBinary(t){return this.readJSON(await this.binaryToJSON(H.assertView(t)))}async writeJSON(t,e={}){if(e.format==="GLB"&&t.getRoot().listBuffers().length>1)throw new Error("GLB must have 0\u20131 buffers.");return Vu.write(t,{format:e.format||"GLTF",basename:e.basename||"",logger:this._logger,vertexLayout:this._vertexLayout,dependencies:{...this._dependencies},extensions:Array.from(this._extensions)})}async writeBinary(t){let{json:e,resources:a}=await this.writeJSON(t,{format:"GLB"}),s=new Uint32Array([1179937895,2,12]),n=JSON.stringify(e),r=H.pad(H.encodeText(n),32),i=H.toView(new Uint32Array([r.byteLength,1313821514])),o=H.concat([i,r]);s[s.length-1]+=o.byteLength;let c=Object.values(a)[0];if(!c||!c.byteLength)return H.concat([H.toView(s),o]);let d=H.pad(c,0),b=H.toView(new Uint32Array([d.byteLength,5130562])),f=H.concat([b,d]);return s[s.length-1]+=f.byteLength,H.concat([H.toView(s),o,f])}async _readResourcesExternal(t,e){let a=t.json.images||[],s=t.json.buffers||[],n=[...a,...s].map(async r=>{let i=r.uri;if(!i||i.match(/data:/))return Promise.resolve();try{t.resources[i]=await this.readURI(this.resolve(e,i),"view"),this.lastReadBytes+=t.resources[i].byteLength}catch(o){if(!this._strictResources&&a.includes(r))this._logger.warn(`Failed to load image URI, "${i}". ${o}`),t.resources[i]=null;else throw o}});await Promise.all(n)}_readResourcesInternal(t){function e(a){if(a.uri){if(a.uri in t.resources){H.assertView(t.resources[a.uri]);return}if(a.uri.match(/data:/)){let s=`__${Ru()}.${na.extension(a.uri)}`;t.resources[s]=H.createBufferFromDataURI(a.uri),a.uri=s}}}(t.json.images||[]).forEach(a=>{if(a.bufferView===void 0&&a.uri===void 0)throw new Error("Missing resource URI or buffer view.");e(a)}),(t.json.buffers||[]).forEach(e)}_copyJSON(t){let{images:e,buffers:a}=t.json;return t={json:{...t.json},resources:{...t.resources}},e&&(t.json.images=e.map(s=>({...s}))),a&&(t.json.buffers=a.map(s=>({...s}))),t}_binaryToJSON(t){if(!_i(t))throw new Error("Invalid glTF 2.0 binary.");let e=new Uint32Array(t.buffer,t.byteOffset+12,2);if(e[1]!==1313821514)throw new Error("Missing required GLB JSON chunk.");let a=20,s=e[0],n=H.decodeText(H.toView(t,a,s)),r=JSON.parse(n),i=a+s;if(t.byteLength<=i)return{json:r,resources:{}};let o=new Uint32Array(t.buffer,t.byteOffset+i,2);if(o[1]!==5130562)return{json:r,resources:{}};let c=o[0],d=H.toView(t,i+8,c);return{json:r,resources:{[xt]:d}}}};function Xu(t,e){return e.uri!==void 0&&!(e.uri in t.resources)}function Wu(t,e){return e.uri!==void 0&&!(e.uri in t.resources)&&e.bufferView===void 0}function _i(t){if(t.byteLength<3*Uint32Array.BYTES_PER_ELEMENT)return!1;let e=new Uint32Array(t.buffer,t.byteOffset,3);return e[0]===1179937895&&e[1]===2}var Ji=class extends qu{_fetchConfig;constructor(t=Pn.DEFAULT_INIT){super(),this._fetchConfig=t}async readURI(t,e){let a=await fetch(t,this._fetchConfig);switch(e){case"view":return new Uint8Array(await a.arrayBuffer());case"text":return a.text()}}resolve(t,e){return Pn.resolve(t,e)}dirname(t){return Pn.dirname(t)}};function $u(){return{vkFormat:0,typeSize:1,pixelWidth:0,pixelHeight:0,pixelDepth:0,layerCount:0,faceCount:1,levelCount:0,supercompressionScheme:0,levels:[],dataFormatDescriptor:[{vendorId:0,descriptorType:0,versionNumber:2,colorModel:0,colorPrimaries:1,transferFunction:2,flags:0,texelBlockDimension:[0,0,0,0],bytesPlane:[0,0,0,0,0,0,0,0],samples:[]}],keyValue:{},globalData:null}}var qt=class{constructor(e,a,s,n){this._dataView=void 0,this._littleEndian=void 0,this._offset=void 0,this._dataView=new DataView(e.buffer,e.byteOffset+a,s),this._littleEndian=n,this._offset=0}_nextUint8(){let e=this._dataView.getUint8(this._offset);return this._offset+=1,e}_nextUint16(){let e=this._dataView.getUint16(this._offset,this._littleEndian);return this._offset+=2,e}_nextUint32(){let e=this._dataView.getUint32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint64(){let e=this._dataView.getUint32(this._offset,this._littleEndian),a=this._dataView.getUint32(this._offset+4,this._littleEndian),s=e+2**32*a;return this._offset+=8,s}_nextInt32(){let e=this._dataView.getInt32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint8Array(e){let a=new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+this._offset,e);return this._offset+=e,a}_skip(e){return this._offset+=e,this}_scan(e,a=0){let s=this._offset,n=0;for(;this._dataView.getUint8(this._offset)!==a&&n<e;)n++,this._offset++;return n<e&&this._offset++,new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+s,n)}};var Ox=new Uint8Array([0]),Te=[171,75,84,88,32,50,48,187,13,10,26,10];function Yi(t){return new TextDecoder().decode(t)}function ys(t){let e=new Uint8Array(t.buffer,t.byteOffset,Te.length);if(e[0]!==Te[0]||e[1]!==Te[1]||e[2]!==Te[2]||e[3]!==Te[3]||e[4]!==Te[4]||e[5]!==Te[5]||e[6]!==Te[6]||e[7]!==Te[7]||e[8]!==Te[8]||e[9]!==Te[9]||e[10]!==Te[10]||e[11]!==Te[11])throw new Error("Missing KTX 2.0 identifier.");let a=$u(),s=17*Uint32Array.BYTES_PER_ELEMENT,n=new qt(t,Te.length,s,!0);a.vkFormat=n._nextUint32(),a.typeSize=n._nextUint32(),a.pixelWidth=n._nextUint32(),a.pixelHeight=n._nextUint32(),a.pixelDepth=n._nextUint32(),a.layerCount=n._nextUint32(),a.faceCount=n._nextUint32(),a.levelCount=n._nextUint32(),a.supercompressionScheme=n._nextUint32();let r=n._nextUint32(),i=n._nextUint32(),o=n._nextUint32(),c=n._nextUint32(),d=n._nextUint64(),b=n._nextUint64(),f=Math.max(a.levelCount,1)*3*8,m=new qt(t,Te.length+s,f,!0);for(let B=0,O=Math.max(a.levelCount,1);B<O;B++)a.levels.push({levelData:new Uint8Array(t.buffer,t.byteOffset+m._nextUint64(),m._nextUint64()),uncompressedByteLength:m._nextUint64()});let p=new qt(t,r,i,!0);p._skip(4);let u=p._nextUint16(),l=p._nextUint16(),y=p._nextUint16(),h=p._nextUint16(),g=p._nextUint8(),x=p._nextUint8(),v=p._nextUint8(),T=p._nextUint8(),I=[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],S=[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],_={vendorId:u,descriptorType:l,versionNumber:y,colorModel:g,colorPrimaries:x,transferFunction:v,flags:T,texelBlockDimension:I,bytesPlane:S,samples:[]},L=(h/4-6)/4;for(let B=0;B<L;B++){let O={bitOffset:p._nextUint16(),bitLength:p._nextUint8(),channelType:p._nextUint8(),samplePosition:[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],sampleLower:Number.NEGATIVE_INFINITY,sampleUpper:Number.POSITIVE_INFINITY};O.channelType&64?(O.sampleLower=p._nextInt32(),O.sampleUpper=p._nextInt32()):(O.sampleLower=p._nextUint32(),O.sampleUpper=p._nextUint32()),_.samples[B]=O}a.dataFormatDescriptor.length=0,a.dataFormatDescriptor.push(_);let F=new qt(t,o,c,!0);for(;F._offset<c;){let B=F._nextUint32(),O=F._scan(B),J=Yi(O);if(a.keyValue[J]=F._nextUint8Array(B-O.byteLength-1),J.match(/^ktx/i)){let Me=Yi(a.keyValue[J]);a.keyValue[J]=Me.substring(0,Me.lastIndexOf("\0"))}let ce=B%4?4-B%4:0;F._skip(ce)}if(b<=0)return a;let K=new qt(t,d,b,!0),W=K._nextUint16(),te=K._nextUint16(),oe=K._nextUint32(),Oe=K._nextUint32(),de=K._nextUint32(),Pe=K._nextUint32(),Ke=[];for(let B=0,O=Math.max(a.levelCount,1);B<O;B++)Ke.push({imageFlags:K._nextUint32(),rgbSliceByteOffset:K._nextUint32(),rgbSliceByteLength:K._nextUint32(),alphaSliceByteOffset:K._nextUint32(),alphaSliceByteLength:K._nextUint32()});let ve=d+K._offset,Je=ve+oe,ze=Je+Oe,bt=ze+de,aa=new Uint8Array(t.buffer,t.byteOffset+ve,oe),kn=new Uint8Array(t.buffer,t.byteOffset+Je,Oe),$a=new Uint8Array(t.buffer,t.byteOffset+ze,de),k=new Uint8Array(t.buffer,t.byteOffset+bt,Pe);return a.globalData={endpointCount:W,selectorCount:te,imageDescs:Ke,endpointsData:aa,selectorsData:kn,tablesData:$a,extendedData:k},a}var vt="EXT_mesh_gpu_instancing",ct="EXT_mesh_features",Ae="EXT_meshopt_compression",V="EXT_structural_metadata",xs="EXT_texture_webp",ws="EXT_texture_avif",tf="KHR_accessor_float16",af="KHR_accessor_float64",le="KHR_draco_mesh_compression",ot="KHR_lights_punctual",Mt="KHR_materials_anisotropy",Et="KHR_materials_clearcoat",Tt="KHR_materials_diffuse_transmission",kt="KHR_materials_dispersion",It="KHR_materials_emissive_strength",St="KHR_materials_ior",Rt="KHR_materials_iridescence",At="KHR_materials_pbrSpecularGlossiness",_t="KHR_materials_sheen",Nt="KHR_materials_specular",Ct="KHR_materials_transmission",ra="KHR_materials_unlit",Ft="KHR_materials_volume",Be="KHR_materials_variants",Qi="KHR_mesh_primitive_restart",Zi="KHR_mesh_quantization",Bt="KHR_node_visibility",vs="KHR_texture_basisu",jt="KHR_texture_transform",He="KHR_xmp_json_ld",sf=class extends X{static EXTENSION_NAME=ct;init(){this.extensionName=ct,this.propertyType="FeatureID",this.parentTypes=["Features"]}getDefaults(){return Object.assign(super.getDefaults(),{nullFeatureId:null,label:"",attribute:null,texture:null,propertyTable:null})}getFeatureCount(){return this.get("featureCount")}setFeatureCount(t){return this.set("featureCount",t)}getNullFeatureID(){return this.get("nullFeatureId")}setNullFeatureID(t){return this.set("nullFeatureId",t)}getLabel(){return this.get("label")}setLabel(t){return this.set("label",t)}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getPropertyTable(){return this.getRef("propertyTable")}setPropertyTable(t){return this.setRef("propertyTable",t)}},nf=class extends X{static EXTENSION_NAME=ct;init(){this.extensionName=ct,this.propertyType="FeatureIDTexture",this.parentTypes=["FeatureID"]}getDefaults(){let t=new ne(this.graph,"textureInfo");return t.setMinFilter(ne.MagFilter.NEAREST),t.setMagFilter(ne.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}},rf=class extends X{static EXTENSION_NAME=ct;init(){this.extensionName=ct,this.propertyType="Features",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{featureIds:new ae([])})}listFeatureIDs(){return this.listRefs("featureIds")}addFeatureID(t){return this.addRef("featureIds",t)}removeFeatureID(t){return this.removeRef("featureIds",t)}},Sa=ct,Jn=class extends ee{extensionName=ct;static EXTENSION_NAME=ct;createFeatures(){return new rf(this.document.getGraph())}createFeatureID(){return new sf(this.document.getGraph())}createFeatureIDTexture(){return new nf(this.document.getGraph())}read(t){return(t.jsonDoc.json.meshes||[]).forEach((e,a)=>{(e.primitives||[]).forEach((s,n)=>{this._readPrimitive(t,a,s,n)})}),this}_readPrimitive(t,e,a,s){if(!a.extensions||!a.extensions[Sa])return;let n=this.createFeatures(),r=a.extensions[Sa];for(let i of r.featureIds){let o=of(this.document,this,t,i);n.addFeatureID(o)}t.meshes[e].listPrimitives()[s].setExtension(Sa,n)}write(t){let e=t.jsonDoc.json.meshes;if(!e)return this;for(let a of this.document.getRoot().listMeshes()){let s=e[t.meshIndexMap.get(a)];a.listPrimitives().forEach((n,r)=>{let i=s.primitives[r];this._writePrimitive(t,n,i)})}return this}_writePrimitive(t,e,a){let s=e.getExtension(Sa);if(!s)return;let n={featureIds:[]};s.listFeatureIDs().forEach(r=>{n.featureIds.push(lf(this.document,t,r))}),a.extensions=a.extensions||{},a.extensions[Sa]=n}};function of(t,e,a,s){let n=e.createFeatureID().setFeatureCount(s.featureCount);s.nullFeatureId!==void 0&&n.setNullFeatureID(s.nullFeatureId),s.label!==void 0&&n.setLabel(s.label),s.attribute!==void 0&&n.setAttribute(s.attribute);let r=s.texture;if(r!==void 0){let i=cf(e,a,r);n.setTexture(i)}if(s.propertyTable!==void 0){let i=t.getRoot().getExtension(V).listPropertyTables();n.setPropertyTable(i[s.propertyTable])}return n}function cf(t,e,a){let s=t.createFeatureIDTexture(),{json:n}=e.jsonDoc;if(a.channels&&s.setChannels(a.channels),a.index!==void 0){let r=n.textures[a.index].source;s.setTexture(e.textures[r]),e.setTextureInfo(s.getTextureInfo(),a)}return s}function lf(t,e,a){let s=t.getRoot(),n={featureCount:a.getFeatureCount()};if(a.getNullFeatureID()!=null&&(n.nullFeatureId=a.getNullFeatureID()),a.getLabel()&&(n.label=a.getLabel()),a.getAttribute()!=null&&(n.attribute=a.getAttribute()),a.getTexture()){let r=a.getTexture(),i=r.getTexture(),o=r.getTextureInfo();n.texture=e.createTextureInfoDef(i,o);let c=r.getChannels();ie.eq(c,[0])||(n.texture.channels=c)}if(a.getPropertyTable()){let r=s.getExtension(V),i=a.getPropertyTable();n.propertyTable=r.listPropertyTables().indexOf(i)}return n}var Xn="INSTANCE_ATTRIBUTE",df=class extends X{static EXTENSION_NAME=vt;init(){this.extensionName=vt,this.propertyType="InstancedMesh",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:Xn})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},uf=class extends ee{static EXTENSION_NAME=vt;extensionName=vt;prewriteTypes=[C.ACCESSOR];createInstancedMesh(){return new df(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(!e.extensions||!e.extensions.EXT_mesh_gpu_instancing)return;let s=e.extensions[vt],n=this.createInstancedMesh();for(let r in s.attributes)n.setAttribute(r,t.accessors[s.attributes[r]]);t.nodes[a].setExtension(vt,n)}),this}prewrite(t){t.accessorUsageGroupedByParent.add(Xn);for(let e of this.properties)for(let a of e.listAttributes())t.addAccessorToUsageGroup(a,Xn);return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listNodes().forEach(a=>{let s=a.getExtension(vt);if(s){let n=t.nodeIndexMap.get(a),r=e.json.nodes[n],i={attributes:{}};s.listSemantics().forEach(o=>{let c=s.getAttribute(o);i.attributes[o]=t.accessorIndexMap.get(c)}),r.extensions=r.extensions||{},r.extensions[vt]=i}}),this}},ff=(function(t){return t.QUANTIZE="quantize",t.FILTER="filter",t})({});function hf(t){return!t.extensions||!t.extensions.EXT_meshopt_compression?!1:!!t.extensions[Ae].fallback}var{BYTE:bf,SHORT:eo,FLOAT:pf}=U.ComponentType,{encodeNormalizedInt:to,decodeNormalizedInt:Wn}=ie;function gf(t,e,a,s){let{filter:n,bits:r}=s,i={array:t.getArray(),byteStride:t.getElementSize()*t.getComponentSize(),componentType:t.getComponentType(),normalized:t.getNormalized()};if(a!=="ATTRIBUTES")return i;if(n!=="NONE"){let o=t.getNormalized()?mf(t):new Float32Array(i.array);switch(n){case"EXPONENTIAL":i.byteStride=t.getElementSize()*4,i.componentType=pf,i.normalized=!1,i.array=e.encodeFilterExp(o,t.getCount(),i.byteStride,r);break;case"OCTAHEDRAL":i.byteStride=r>8?8:4,i.componentType=r>8?eo:bf,i.normalized=!0,o=t.getElementSize()===3?xf(o):o,i.array=e.encodeFilterOct(o,t.getCount(),i.byteStride,r);break;case"QUATERNION":i.byteStride=8,i.componentType=eo,i.normalized=!0,i.array=e.encodeFilterQuat(o,t.getCount(),i.byteStride,r);break;default:throw new Error("Invalid filter.")}i.min=t.getMin([]),i.max=t.getMax([]),t.getNormalized()&&(i.min=i.min.map(c=>Wn(c,t.getComponentType())),i.max=i.max.map(c=>Wn(c,t.getComponentType()))),i.normalized&&(i.min=i.min.map(c=>to(c,i.componentType)),i.max=i.max.map(c=>to(c,i.componentType)))}else i.byteStride%4&&(i.array=yf(i.array,t.getElementSize()),i.byteStride=i.array.byteLength/t.getCount());return i}function mf(t){let e=t.getComponentType(),a=t.getArray(),s=new Float32Array(a.length);for(let n=0;n<a.length;n++)s[n]=Wn(a[n],e);return s}function yf(t,e){let a=H.padNumber(t.BYTES_PER_ELEMENT*e)/t.BYTES_PER_ELEMENT,s=t.length/e,n=new t.constructor(s*a);for(let r=0;r*e<t.length;r++)for(let i=0;i<e;i++)n[r*a+i]=t[r*e+i];return n}function xf(t){let e=new Float32Array(t.length*4/3);for(let a=0,s=t.length/3;a<s;a++)e[a*4]=t[a*3],e[a*4+1]=t[a*3+1],e[a*4+2]=t[a*3+2];return e}function wf(t,e){return e===yt.BufferViewUsage.ELEMENT_ARRAY_BUFFER?t.listParents().some(a=>a instanceof Ia&&a.getMode()===Ia.Mode.TRIANGLES)?"TRIANGLES":"INDICES":"ATTRIBUTES"}function vf(t,e){let a=e.getGraph().listParentEdges(t).filter(s=>!(s.getParent()instanceof Vn));for(let s of a){let n=s.getName(),r=s.getAttributes().key||"",i=s.getParent().propertyType===C.PRIMITIVE_TARGET;if(n==="indices")return{filter:"NONE"};if(n==="attributes"){if(r==="POSITION")return{filter:"NONE"};if(r==="TEXCOORD_0")return{filter:"NONE"};if(r.startsWith("JOINTS_"))return{filter:"NONE"};if(r.startsWith("WEIGHTS_"))return{filter:"NONE"};if(r==="NORMAL"||r==="TANGENT")return i?{filter:"NONE"}:{filter:"OCTAHEDRAL",bits:8}}if(n==="output"){let o=xo(t);return o==="rotation"?{filter:"QUATERNION",bits:16}:o==="translation"?{filter:"EXPONENTIAL",bits:12}:o==="scale"?{filter:"EXPONENTIAL",bits:12}:{filter:"NONE"}}if(n==="input")return{filter:"NONE"};if(n==="inverseBindMatrices")return{filter:"NONE"}}return{filter:"NONE"}}function xo(t){for(let e of t.listParents())if(e instanceof gs){for(let a of e.listParents())if(a instanceof zn)return a.getTargetPath()}return null}var ao={method:"quantize"},Yn=class extends ee{extensionName=Ae;prereadTypes=[C.BUFFER,C.PRIMITIVE];prewriteTypes=[C.BUFFER,C.ACCESSOR];readDependencies=["meshopt.decoder"];writeDependencies=["meshopt.encoder"];static EXTENSION_NAME=Ae;static EncoderMethod=ff;_decoder=null;_decoderFallbackBufferMap=new Map;_encoder=null;_encoderOptions=ao;_encoderFallbackBuffer=null;_encoderBufferViews={};_encoderBufferViewData={};_encoderBufferViewAccessors={};install(t,e){return t==="meshopt.decoder"&&(this._decoder=e),t==="meshopt.encoder"&&(this._encoder=e),this}setEncoderOptions(t){return this._encoderOptions={...ao,...t},this}preread(t,e){if(!this._decoder){if(!this.isRequired())return this;throw new Error(`[${Ae}] Please install extension dependency, "meshopt.decoder".`)}if(!this._decoder.supported){if(!this.isRequired())return this;throw new Error(`[${Ae}]: Missing WASM support.`)}return e===C.BUFFER?this._prereadBuffers(t):e===C.PRIMITIVE&&this._prereadPrimitives(t),this}_prereadBuffers(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach((a,s)=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let n=a.extensions[Ae],r=n.byteOffset||0,i=n.byteLength||0,o=n.count,c=n.byteStride,d=new Uint8Array(o*c),b=e.json.buffers[n.buffer],f=b.uri?e.resources[b.uri]:e.resources[xt],m=H.toView(f,r,i);this._decoder.decodeGltfBuffer(d,o,c,m,n.mode,n.filter),t.bufferViews[s]=d})}_prereadPrimitives(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach(a=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let s=a.extensions[Ae],n=t.buffers[s.buffer],r=t.buffers[a.buffer],i=e.json.buffers[a.buffer];hf(i)&&this._decoderFallbackBufferMap.set(r,n)})}read(t){if(!this.isRequired())return this;for(let[e,a]of this._decoderFallbackBufferMap){for(let s of e.listParents())s instanceof U&&s.swap(e,a);e.dispose()}return this}prewrite(t,e){return e===C.ACCESSOR?this._prewriteAccessors(t):e===C.BUFFER&&this._prewriteBuffers(t),this}_prewriteAccessors(t){let e=t.jsonDoc.json,a=this._encoder,s=this._encoderOptions,n=this.document.getGraph(),r=this.document.createBuffer(),i=this.document.getRoot().listBuffers().indexOf(r),o=1,c=new Map,d=b=>{for(let f of n.listParents(b)){if(f.propertyType===C.ROOT)continue;let m=c.get(b);return m===void 0&&c.set(b,m=o++),m}return-1};this._encoderFallbackBuffer=r,this._encoderBufferViews={},this._encoderBufferViewData={},this._encoderBufferViewAccessors={};for(let b of this.document.getRoot().listAccessors()){if(xo(b)==="weights"||b.getSparse())continue;let f=t.getAccessorUsage(b),m=t.accessorUsageGroupedByParent.has(f)?d(b):null,p=wf(b,f),u=s.method==="filter"?vf(b,this.document):{filter:"NONE"},l=gf(b,a,p,u),{array:y,byteStride:h}=l,g=b.getBuffer();if(!g)throw new Error(`${Ae}: Missing buffer for accessor.`);let x=this.document.getRoot().listBuffers().indexOf(g),v=[f,m,p,u.filter,h,x].join(":"),T=this._encoderBufferViews[v],I=this._encoderBufferViewData[v],S=this._encoderBufferViewAccessors[v];(!T||!I)&&(S=this._encoderBufferViewAccessors[v]=[],I=this._encoderBufferViewData[v]=[],T=this._encoderBufferViews[v]={buffer:i,target:yt.USAGE_TO_TARGET[f],byteOffset:0,byteLength:0,byteStride:f===yt.BufferViewUsage.ARRAY_BUFFER?h:void 0,extensions:{[Ae]:{buffer:x,byteOffset:0,byteLength:0,mode:p,filter:u.filter!=="NONE"?u.filter:void 0,byteStride:h,count:0}}});let R=t.createAccessorDef(b);R.componentType=l.componentType,R.normalized=l.normalized,R.byteOffset=T.byteLength,R.min&&l.min&&(R.min=l.min),R.max&&l.max&&(R.max=l.max),t.accessorIndexMap.set(b,e.accessors.length),e.accessors.push(R),S.push(R),I.push(new Uint8Array(y.buffer,y.byteOffset,y.byteLength)),T.byteLength+=y.byteLength,T.extensions.EXT_meshopt_compression.count+=b.getCount()}}_prewriteBuffers(t){let e=this._encoder;for(let a in this._encoderBufferViews){let s=this._encoderBufferViews[a],n=this._encoderBufferViewData[a],r=this.document.getRoot().listBuffers()[s.extensions[Ae].buffer],i=t.otherBufferViews.get(r)||[],{count:o,byteStride:c,mode:d}=s.extensions[Ae],b=H.concat(n),f=e.encodeGltfBuffer(b,o,c,d),m=H.pad(f);s.extensions[Ae].byteLength=f.byteLength,n.length=0,n.push(m),i.push(m),t.otherBufferViews.set(r,i)}}write(t){let e=0;for(let r in this._encoderBufferViews){let i=this._encoderBufferViews[r],o=this._encoderBufferViewData[r][0],c=t.otherBufferViewsIndexMap.get(o),d=this._encoderBufferViewAccessors[r];for(let p of d)p.bufferView=c;let b=t.jsonDoc.json.bufferViews[c],f=b.byteOffset||0;Object.assign(b,i),b.byteOffset=e;let m=b.extensions[Ae];m.byteOffset=f,e+=H.padNumber(i.byteLength)}let a=this._encoderFallbackBuffer,s=t.bufferIndexMap.get(a),n=t.jsonDoc.json.buffers[s];return n.byteLength=e,n.extensions={[Ae]:{fallback:!0}},a.dispose(),this}},Mf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="StructuralMetadata",this.parentTypes=[C.ROOT]}getDefaults(){return Object.assign(super.getDefaults(),{schema:null,schemaUri:"",propertyTables:new xe,propertyTextures:new xe,propertyAttributes:new xe})}getSchema(){return this.getRef("schema")}setSchema(t){return this.setRef("schema",t)}getSchemaUri(){return this.get("schemaUri")}setSchemaUri(t){return this.set("schemaUri",t)}listPropertyTables(){return this.listRefs("propertyTables")}addPropertyTable(t){return this.addRef("propertyTables",t)}removePropertyTable(t){return this.removeRef("propertyTables",t)}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},Ef=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Schema",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",version:"",classes:new ue,enums:new ue})}getId(){return this.get("id")}setId(t){return this.set("id",t)}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getVersion(){return this.get("version")}setVersion(t){return this.set("version",t)}setClass(t,e){return this.setRefMap("classes",t,e)}getClass(t){return this.getRefMap("classes",t)}listClassKeys(){return this.listRefMapKeys("classes")}listClassValues(){return this.listRefMapValues("classes")}setEnum(t,e){return this.setRefMap("enums",t,e)}getEnum(t){return this.getRefMap("enums",t)}listEnumKeys(){return this.listRefMapKeys("enums")}listEnumValues(){return this.listRefMapValues("enums")}},Tf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Class",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",properties:new ue})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},kf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="ClassProperty",this.parentTypes=["Class"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",componentType:null,enumType:null,array:null,count:null,normalized:null,offset:null,scale:null,max:null,min:null,required:null,noData:null,default:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getType(){return this.get("type")}setType(t){return this.set("type",t)}getComponentType(){return this.get("componentType")}setComponentType(t){return this.set("componentType",t)}getEnumType(){return this.get("enumType")}setEnumType(t){return this.set("enumType",t)}getArray(){return this.get("array")}setArray(t){return this.set("array",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}getNormalized(){return this.get("normalized")}setNormalized(t){return this.set("normalized",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}getRequired(){return this.get("required")}setRequired(t){return this.set("required",t)}getNoData(){return this.get("noData")}setNoData(t){return this.set("noData",t)}getDefault(){return this.get("default")}setDefault(t){return this.set("default",t)}},If=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Enum",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",valueType:"UINT16",values:new xe})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValueType(){return this.get("valueType")}setValueType(t){return this.set("valueType",t)}listValues(){return this.listRefs("values")}addEnumValue(t){return this.addRef("values",t)}removeEnumValue(t){return this.removeRef("values",t)}},Sf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="EnumValue",this.parentTypes=["Enum"]}getDefaults(){return Object.assign(super.getDefaults(),{description:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValue(){return this.get("value")}setValue(t){return this.set("value",t)}},Rf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTable",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},Af=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTableProperty",this.parentTypes=["PropertyTable"]}getDefaults(){return Object.assign(super.getDefaults(),{arrayOffsets:null,stringOffsets:null,arrayOffsetType:null,stringOffsetType:null,offset:null,scale:null,max:null,min:null})}getValues(){return this.get("values")}setValues(t){return this.set("values",t)}getArrayOffsets(){return this.get("arrayOffsets")}setArrayOffsets(t){return this.set("arrayOffsets",t)}getStringOffsets(){return this.get("stringOffsets")}setStringOffsets(t){return this.set("stringOffsets",t)}getArrayOffsetType(){return this.get("arrayOffsetType")}setArrayOffsetType(t){return this.set("arrayOffsetType",t)}getStringOffsetType(){return this.get("stringOffsetType")}setStringOffsetType(t){return this.set("stringOffsetType",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},_f=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTexture",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},Nf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTextureProperty",this.parentTypes=["PropertyTexture"]}getDefaults(){let t=new ne(this.graph,"textureInfo");return t.setMinFilter(ne.MagFilter.NEAREST),t.setMagFilter(ne.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t,offset:null,scale:null,max:null,min:null})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},Cf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttribute",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},Ff=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttributeProperty",this.parentTypes=["PropertyAttribute"]}getDefaults(){return Object.assign(super.getDefaults(),{offset:null,scale:null,max:null,min:null})}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},Bf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="NodeStructuralMetadata",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{class:"",properties:{}})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getProperties(){return this.get("properties")}setProperties(t){return this.set("properties",t)}},jf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="MeshPrimitiveStructuralMetadata",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{propertyTextures:new xe,propertyAttributes:new xe})}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},Of=class extends ee{extensionName=V;static EXTENSION_NAME=V;prewriteTypes=[C.BUFFER];prereadTypes=[C.SCENE];createStructuralMetadata(){return new Mf(this.document.getGraph())}createSchema(){return new Ef(this.document.getGraph())}createClass(){return new Tf(this.document.getGraph())}createClassProperty(){return new kf(this.document.getGraph())}createEnum(){return new If(this.document.getGraph())}createEnumValue(){return new Sf(this.document.getGraph())}createPropertyTable(){return new Rf(this.document.getGraph())}createPropertyTableProperty(){return new Af(this.document.getGraph())}createPropertyTexture(){return new _f(this.document.getGraph())}createPropertyTextureProperty(){return new Nf(this.document.getGraph())}createPropertyAttribute(){return new Cf(this.document.getGraph())}createPropertyAttributeProperty(){return new Ff(this.document.getGraph())}createNodeStructuralMetadata(){return new Bf(this.document.getGraph())}createMeshPrimitiveStructuralMetadata(){return new jf(this.document.getGraph())}read(t){return this}preread(t){let e=this.document.getRoot(),{json:a}=t.jsonDoc,s=a.extensions[V],n=Pf(this,t,s);return e.setExtension(V,n),(a.meshes||[]).forEach((r,i)=>{let o=t.meshes[i].listPrimitives();(r.primitives||[]).forEach((c,d)=>{let b=o[d];this._readPrimitive(n,b,c)})}),(a.nodes||[]).forEach((r,i)=>{this._readNode(t.nodes[i],r)}),this}_readPrimitive(t,e,a){if(!a.extensions||!a.extensions.EXT_structural_metadata)return;let s=this.createMeshPrimitiveStructuralMetadata(),n=a.extensions[V],r=t.listPropertyTextures(),i=n.propertyTextures||[];for(let d of i){let b=r[d];s.addPropertyTexture(b)}let o=t.listPropertyAttributes(),c=n.propertyAttributes||[];for(let d of c){let b=o[d];s.addPropertyAttribute(b)}e.setExtension(V,s)}_readNode(t,e){if(!e.extensions||!e.extensions.EXT_structural_metadata)return;let a=e.extensions[V],s=this.createNodeStructuralMetadata().setClass(a.class).setProperties(a.properties);t.setExtension(V,s)}write(t){let e=this.document.getRoot(),a=e.getExtension(V);if(!a)return this;let s=t.jsonDoc.json,n=$f(t,a);s.extensions=s.extensions||{},s.extensions[V]=n;let r=e.listMeshes(),i=s.meshes;if(i)for(let d of r){let b=i[t.meshIndexMap.get(d)];d.listPrimitives().forEach((f,m)=>{let p=b.primitives[m];this._writePrimitive(a,f,p)})}let o=e.listNodes(),c=s.nodes;if(c)for(let d of o){let b=t.nodeIndexMap.get(d);this._writeNode(d,c[b])}return this}_writePrimitive(t,e,a){let s=e.getExtension(V);if(!s)return;let n=t.listPropertyTextures(),r=t.listPropertyAttributes(),i,o,c=s.listPropertyTextures();if(c.length>0){i=[];for(let f of c){let m=n.indexOf(f);if(m>=0)i.push(m);else throw new Error(`${V}: Invalid property texture in mesh primitive`)}}let d=s.listPropertyAttributes();if(d.length>0){o=[];for(let f of d){let m=r.indexOf(f);if(m>=0)o.push(m);else throw new Error(`${V}: Invalid property attribute in mesh primitive`)}}let b={propertyTextures:i,propertyAttributes:o};a.extensions=a.extensions||{},a.extensions[V]=b}_writeNode(t,e){let a=t.getExtension("EXT_structural_metadata");a&&(e.extensions=e.extensions||{},e.extensions[V]={class:a.getClass(),properties:a.getProperties()})}prewrite(t,e){return e===C.BUFFER&&this._prewriteBuffers(t),this}_prewriteBuffers(t){let e=this.document,a=e.getRoot().getExtension(V);t.jsonDoc.json.bufferViews||=[];for(let s of a.listPropertyTables())for(let n of s.listPropertyValues()){let r=oh(e,t);r.push(n.getValues());let i=n.getArrayOffsets();i&&r.push(i);let o=n.getStringOffsets();o&&r.push(o)}}};function Pf(t,e,a){let s=t.createStructuralMetadata();if(a.schema!==void 0){let o=Df(t,a.schema);s.setSchema(o)}else if(a.schemaUri){let o=a.schemaUri;s.setSchemaUri(o)}let n=a.propertyTextures||[];for(let o of n){let c=zf(t,e,o);s.addPropertyTexture(c)}let r=a.propertyTables||[];for(let o of r){let c=Hf(t,e,o);s.addPropertyTable(c)}let i=a.propertyAttributes||[];for(let o of i){let c=Xf(t,o);s.addPropertyAttribute(c)}return s}function Df(t,e){let a=t.createSchema().setId(e.id);e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.version!==void 0&&a.setVersion(e.version);let s=e.classes||{};for(let r of Object.keys(s)){let i=s[r];a.setClass(r,Lf(t,i))}let n=e.enums||{};for(let r of Object.keys(n))a.setEnum(r,Gf(t,n[r]));return a}function Lf(t,e){let a=t.createClass();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description);let s=e.properties||{};for(let n of Object.keys(s)){let r=Uf(t,s[n]);a.setProperty(n,r)}return a}function Uf(t,e){let a=t.createClassProperty().setType(e.type);return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.componentType!==void 0&&a.setComponentType(e.componentType),e.enumType!==void 0&&a.setEnumType(e.enumType),e.array!==void 0&&a.setArray(e.array),e.count!==void 0&&a.setCount(e.count),e.normalized!==void 0&&a.setNormalized(e.normalized),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),e.required!==void 0&&a.setRequired(e.required),e.noData!==void 0&&a.setNoData(e.noData),e.default!==void 0&&a.setDefault(e.default),a}function Gf(t,e){let a=t.createEnum();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.valueType!==void 0&&a.setValueType(e.valueType);let s=e.values||{};for(let n of s)a.addEnumValue(Kf(t,n));return a}function Kf(t,e){let a=t.createEnumValue();return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.value!==void 0&&a.setValue(e.value),a}function zf(t,e,a){let s=t.createPropertyTexture();s.setClass(a.class),a.name!==void 0&&s.setName(a.name);let n=a.properties||{};for(let r of Object.keys(n)){let i=Vf(t,e,n[r]);s.setProperty(r,i)}return s}function Vf(t,e,a){let s=t.createPropertyTextureProperty(),n=e.jsonDoc.json.textures||[];a.channels&&s.setChannels(a.channels);let r=n[a.index].source;if(r!==void 0){let i=e.textures[r];s.setTexture(i);let o=s.getTextureInfo();o&&e.setTextureInfo(o,a)}return a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function Hf(t,e,a){let s=t.createPropertyTable().setClass(a.class).setCount(a.count);a.name!==void 0&&s.setName(a.name);let n=a.properties||{};for(let r of Object.keys(n)){let i=qf(t,e,n[r]);s.setProperty(r,i)}return s}function qf(t,e,a){let s=t.createPropertyTableProperty(),n=Hn(e,a.values);if(s.setValues(n),a.arrayOffsets!==void 0){let r=Hn(e,a.arrayOffsets);s.setArrayOffsets(r)}if(a.stringOffsets!==void 0){let r=Hn(e,a.stringOffsets);s.setStringOffsets(r)}return a.arrayOffsetType!==void 0&&s.setArrayOffsetType(a.arrayOffsetType),a.stringOffsetType!==void 0&&s.setStringOffsetType(a.stringOffsetType),a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function Xf(t,e){let a=t.createPropertyAttribute();a.setClass(e.class),e.name!==void 0&&a.setName(e.name);let s=e.properties||{};for(let n of Object.keys(s)){let r=Wf(t,s[n]);a.setProperty(n,r)}return a}function Wf(t,e){let a=t.createPropertyAttributeProperty();return a.setAttribute(e.attribute),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),a}function $f(t,e){let a={},s=e.getSchema();s&&(a.schema=Jf(s));let n=e.getSchemaUri();n&&(a.schemaUri=n);let r=e.listPropertyTables();if(r.length>0){let c=[];for(let d of r){let b=th(t,d);c.push(b)}a.propertyTables=c}let i=e.listPropertyTextures();if(i.length>0){let c=[];for(let d of i){let b=rh(t,d);c.push(b)}a.propertyTextures=c}let o=e.listPropertyAttributes();if(o.length>0){let c=[];for(let d of o){let b=sh(d);c.push(b)}a.propertyAttributes=c}return a}function Jf(t){let e={id:t.getId()},a=t.listClassKeys();if(a.length>0){e.classes={};for(let n of a){let r=Yf(t.getClass(n));e.classes[n]=r}}let s=t.listEnumKeys();if(s.length>0){e.enums={};for(let n of s){let r=Zf(t.getEnum(n));e.enums[n]=r}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getVersion()&&(e.version=t.getVersion()),e}function Yf(t){let e={},a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let n=t.getProperty(s);e.properties[s]=Qf(n)}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),e}function Qf(t){let e={type:t.getType()};return t.getArray()&&(e.array=t.getArray()),t.getNormalized()&&(e.normalized=t.getNormalized()),t.getRequired()&&(e.required=t.getRequired()),t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getComponentType()!=null&&(e.componentType=t.getComponentType()),t.getEnumType()!=null&&(e.enumType=t.getEnumType()),t.getCount()!=null&&(e.count=t.getCount()),t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),t.getNoData()!=null&&(e.noData=t.getNoData()),t.getDefault()!=null&&(e.default=t.getDefault()),e}function Zf(t){let e={values:t.listValues().map(eh)};return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getValueType()!=="UINT16"&&(e.valueType=t.getValueType()),e}function eh(t){let e={name:t.getName(),value:t.getValue()};return t.getDescription()&&(e.description=t.getDescription()),e}function th(t,e){let a={class:e.getClass(),count:e.getCount()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let n of s){let r=ah(t,e.getProperty(n));a.properties[n]=r}}return a}function ah(t,e){let a=e.getValues(),s={values:t.otherBufferViewsIndexMap.get(a)};if(e.getArrayOffsets()){let n=e.getArrayOffsets();s.arrayOffsets=t.otherBufferViewsIndexMap.get(n)}if(e.getStringOffsets()){let n=e.getStringOffsets();s.stringOffsets=t.otherBufferViewsIndexMap.get(n)}return e.getArrayOffsetType()!=null&&(s.arrayOffsetType=e.getArrayOffsetType()),e.getStringOffsetType()!=null&&(s.stringOffsetType=e.getStringOffsetType()),e.getOffset()!=null&&(s.offset=e.getOffset()),e.getScale()!=null&&(s.scale=e.getScale()),e.getMax()!=null&&(s.max=e.getMax()),e.getMin()!=null&&(s.min=e.getMin()),s}function sh(t){let e={class:t.getClass()};t.getName()&&(e.name=t.getName());let a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let n=nh(t.getProperty(s));e.properties[s]=n}}return e}function nh(t){let e={attribute:t.getAttribute()};return t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),e}function rh(t,e){let a={class:e.getClass()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let n of s){let r=ih(t,e.getProperty(n));a.properties[n]=r}}return a}function ih(t,e){let a=e.getTexture(),s=e.getTextureInfo(),n=e.getChannels(),r=t.createTextureInfoDef(a,s);return ie.eq(n,[0])||(r.channels=n),e.getOffset()!=null&&(r.offset=e.getOffset()),e.getScale()!=null&&(r.scale=e.getScale()),e.getMax()!=null&&(r.max=e.getMax()),e.getMin()!=null&&(r.min=e.getMin()),r}function Hn(t,e){let a=t.jsonDoc,s=a.json.buffers||[],n=(a.json.bufferViews||[])[e],r=s[n.buffer],i=r.uri?a.resources[r.uri]:a.resources[xt],o=n.byteOffset||0,c=n.byteLength;return i.slice(o,o+c)}function oh(t,e){let a=t.getRoot().listBuffers()[0],s=e.otherBufferViews.get(a);return s||(s=[],e.otherBufferViews.set(a,s)),s}var ch=class{match(t){return t.length>=12&&H.decodeText(t.slice(4,12))==="ftypavif"}getSize(t){if(!this.match(t))return null;let e=new DataView(t.buffer,t.byteOffset,t.byteLength),a=so(e,0);if(!a)return null;let s=a.end;for(;a=so(e,s);)if(a.type==="meta")s=a.start+4;else if(a.type==="iprp"||a.type==="ipco")s=a.start;else{if(a.type==="ispe")return[e.getUint32(a.start+4),e.getUint32(a.start+8)];if(a.type==="mdat")break;s=a.end}return null}getChannels(t){return 4}},lh=class extends ee{extensionName=ws;prereadTypes=[C.TEXTURE];static EXTENSION_NAME=ws;static register(){Ze.registerFormat("image/avif",new ch)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_avif&&(e.source=e.extensions[ws].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/avif"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(n=>{n.source===s&&(n.extensions=n.extensions||{},n.extensions[ws]={source:n.source},delete n.source)})}}),this}};function so(t,e){if(t.byteLength<4+e)return null;let a=t.getUint32(e);return t.byteLength<a+e||a<8?null:{type:H.decodeText(new Uint8Array(t.buffer,t.byteOffset+e+4,4)),start:e+8,end:e+a}}var dh=class{match(t){return t.length>=12&&t[8]===87&&t[9]===69&&t[10]===66&&t[11]===80}getSize(t){let e=H.decodeText(t.slice(0,4)),a=H.decodeText(t.slice(8,12));if(e!=="RIFF"||a!=="WEBP")return null;let s=new DataView(t.buffer,t.byteOffset),n=12;for(;n<s.byteLength;){let r=H.decodeText(new Uint8Array([s.getUint8(n),s.getUint8(n+1),s.getUint8(n+2),s.getUint8(n+3)])),i=s.getUint32(n+4,!0);if(r==="VP8 ")return[s.getInt16(n+14,!0)&16383,s.getInt16(n+16,!0)&16383];if(r==="VP8L"){let o=s.getUint8(n+9),c=s.getUint8(n+10),d=s.getUint8(n+11),b=s.getUint8(n+12);return[1+((c&63)<<8|o),1+((b&15)<<10|d<<2|(c&192)>>6)]}n+=8+i+i%2}return null}getChannels(t){return 4}},uh=class extends ee{extensionName=xs;prereadTypes=[C.TEXTURE];static EXTENSION_NAME=xs;static register(){Ze.registerFormat("image/webp",new dh)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_webp&&(e.source=e.extensions[xs].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/webp"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(n=>{n.source===s&&(n.extensions=n.extensions||{},n.extensions[xs]={source:n.source},delete n.source)})}}),this}},no=tf,fh=class extends ee{extensionName=no;static EXTENSION_NAME=no;read(t){return this}write(t){return this}},ro=af,hh=class extends ee{extensionName=ro;static EXTENSION_NAME=ro;read(t){return this}write(t){return this}},he,wo,vo;function bh(t,e){let a=new he.DecoderBuffer;try{if(a.Init(e,e.length),t.GetEncodedGeometryType(a)!==he.TRIANGULAR_MESH)throw new Error(`[${le}] Unknown geometry type.`);let s=new he.Mesh;if(!t.DecodeBufferToMesh(a,s).ok()||s.ptr===0)throw new Error(`[${le}] Decoding failure.`);return s}finally{he.destroy(a)}}function ph(t,e){let a=e.num_faces()*3,s,n;if(e.num_points()<=65534){let r=a*Uint16Array.BYTES_PER_ELEMENT;s=he._malloc(r),t.GetTrianglesUInt16Array(e,r,s),n=new Uint16Array(he.HEAPU16.buffer,s,a).slice()}else{let r=a*Uint32Array.BYTES_PER_ELEMENT;s=he._malloc(r),t.GetTrianglesUInt32Array(e,r,s),n=new Uint32Array(he.HEAPU32.buffer,s,a).slice()}return he._free(s),n}function gh(t,e,a,s){let n=vo[s.componentType],r=wo[s.componentType],i=a.num_components(),o=e.num_points()*i,c=o*r.BYTES_PER_ELEMENT,d=he._malloc(c);t.GetAttributeDataArrayForAllPoints(e,a,n,c,d);let b=new r(he.HEAPF32.buffer,d,o).slice();return he._free(d),b}function mh(t){he=t,wo={[U.ComponentType.FLOAT]:Float32Array,[U.ComponentType.UNSIGNED_INT]:Uint32Array,[U.ComponentType.UNSIGNED_SHORT]:Uint16Array,[U.ComponentType.UNSIGNED_BYTE]:Uint8Array,[U.ComponentType.SHORT]:Int16Array,[U.ComponentType.BYTE]:Int8Array},vo={[U.ComponentType.FLOAT]:he.DT_FLOAT32,[U.ComponentType.UNSIGNED_INT]:he.DT_UINT32,[U.ComponentType.UNSIGNED_SHORT]:he.DT_UINT16,[U.ComponentType.UNSIGNED_BYTE]:he.DT_UINT8,[U.ComponentType.SHORT]:he.DT_INT16,[U.ComponentType.BYTE]:he.DT_INT8}}var Ue,yh=(function(t){return t[t.EDGEBREAKER=1]="EDGEBREAKER",t[t.SEQUENTIAL=0]="SEQUENTIAL",t})({}),Mo={POSITION:14,NORMAL:10,COLOR:8,TEX_COORD:12,GENERIC:12},io={decodeSpeed:5,encodeSpeed:5,method:1,quantizationBits:Mo,quantizationVolume:"mesh"};function xh(t){Ue=t}function wh(t,e=io){let a={...io,...e};a.quantizationBits={...Mo,...e.quantizationBits};let s=new Ue.MeshBuilder,n=new Ue.Mesh,r=new Ue.ExpertEncoder(n),i={},o=new Ue.DracoInt8Array,c=t.listTargets().length>0,d=!1;for(let l of t.listSemantics()){let y=t.getAttribute(l);if(y.getSparse()){d=!0;continue}let h=vh(l),g=Mh(s,y.getComponentType(),n,Ue[h],y.getCount(),y.getElementSize(),y.getArray());if(g===-1)throw new Error(`Error compressing "${l}" attribute.`);if(i[l]=g,a.quantizationVolume==="mesh"||l!=="POSITION")r.SetAttributeQuantization(g,a.quantizationBits[h]);else if(typeof a.quantizationVolume=="object"){let{quantizationVolume:x}=a,v=Math.max(x.max[0]-x.min[0],x.max[1]-x.min[1],x.max[2]-x.min[2]);r.SetAttributeExplicitQuantization(g,a.quantizationBits[h],y.getElementSize(),x.min,v)}else throw new Error("Invalid quantization volume state.")}let b=t.getIndices();if(!b)throw new $n("Primitive must have indices.");s.AddFacesToMesh(n,b.getCount()/3,b.getArray()),r.SetSpeedOptions(a.encodeSpeed,a.decodeSpeed),r.SetTrackEncodedProperties(!0),a.method===0||c||d?r.SetEncodingMethod(Ue.MESH_SEQUENTIAL_ENCODING):r.SetEncodingMethod(Ue.MESH_EDGEBREAKER_ENCODING);let f=r.EncodeToDracoBuffer(!(c||d),o);if(f<=0)throw new $n("Error applying Draco compression.");let m=new Uint8Array(f);for(let l=0;l<f;++l)m[l]=o.GetValue(l);let p=r.GetNumberOfEncodedPoints(),u=r.GetNumberOfEncodedFaces()*3;return Ue.destroy(o),Ue.destroy(n),Ue.destroy(s),Ue.destroy(r),{numVertices:p,numIndices:u,data:m,attributeIDs:i}}function vh(t){return t==="POSITION"?"POSITION":t==="NORMAL"?"NORMAL":t.startsWith("COLOR_")?"COLOR":t.startsWith("TEXCOORD_")?"TEX_COORD":"GENERIC"}function Mh(t,e,a,s,n,r,i){switch(e){case U.ComponentType.UNSIGNED_BYTE:return t.AddUInt8Attribute(a,s,n,r,i);case U.ComponentType.BYTE:return t.AddInt8Attribute(a,s,n,r,i);case U.ComponentType.UNSIGNED_SHORT:return t.AddUInt16Attribute(a,s,n,r,i);case U.ComponentType.SHORT:return t.AddInt16Attribute(a,s,n,r,i);case U.ComponentType.UNSIGNED_INT:return t.AddUInt32Attribute(a,s,n,r,i);case U.ComponentType.FLOAT:return t.AddFloatAttribute(a,s,n,r,i);default:throw new Error(`Unexpected component type, "${e}".`)}}var $n=class extends Error{},Eh=class extends ee{extensionName=le;prereadTypes=[C.PRIMITIVE];prewriteTypes=[C.ACCESSOR];readDependencies=["draco3d.decoder"];writeDependencies=["draco3d.encoder"];static EXTENSION_NAME=le;static EncoderMethod=yh;_decoderModule=null;_encoderModule=null;_encoderOptions={};install(t,e){return t==="draco3d.decoder"&&(this._decoderModule=e,mh(this._decoderModule)),t==="draco3d.encoder"&&(this._encoderModule=e,xh(this._encoderModule)),this}setEncoderOptions(t){return this._encoderOptions=t,this}preread(t){if(!this._decoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.decoder".`);let e=this.document.getLogger(),a=t.jsonDoc,s=new Map;try{let n=a.json.meshes||[];for(let r of n)for(let i of r.primitives){if(!i.extensions||!i.extensions.KHR_draco_mesh_compression)continue;let o=i.extensions[le],[c,d]=s.get(o.bufferView)||[];if(!d||!c){let b=a.json.bufferViews[o.bufferView],f=a.json.buffers[b.buffer],m=f.uri?a.resources[f.uri]:a.resources[xt],p=b.byteOffset||0,u=b.byteLength,l=H.toView(m,p,u);c=new this._decoderModule.Decoder,d=bh(c,l),s.set(o.bufferView,[c,d]),e.debug(`[${le}] Decompressed ${l.byteLength} bytes.`)}for(let b in o.attributes){let f=t.jsonDoc.json.accessors[i.attributes[b]],m=c.GetAttributeByUniqueId(d,o.attributes[b]),p=gh(c,d,m,f);t.accessors[i.attributes[b]].setArray(p)}i.indices!==void 0&&t.accessors[i.indices].setArray(ph(c,d))}}finally{for(let[n,r]of Array.from(s.values()))this._decoderModule.destroy(n),this._decoderModule.destroy(r)}return this}read(t){return this}prewrite(t,e){if(!this._encoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.encoder".`);let a=this.document.getLogger();a.debug(`[${le}] Compression options: ${JSON.stringify(this._encoderOptions)}`);let s=Th(this.document),n=new Map,r="mesh";this._encoderOptions.quantizationVolume==="scene"&&(this.document.getRoot().listScenes().length!==1?a.warn(`[${le}]: quantizationVolume=scene requires exactly 1 scene.`):r=Fi(this.document.getRoot().listScenes().pop()));for(let i of Array.from(s.keys())){let o=s.get(i);if(!o)throw new Error("Unexpected primitive.");if(n.has(o)){n.set(o,n.get(o));continue}let c=i.getIndices(),d=t.jsonDoc.json.accessors,b;try{b=wh(i,{...this._encoderOptions,quantizationVolume:r})}catch(p){if(p instanceof $n){a.warn(`[${le}]: ${p.message} Skipping primitive compression.`);continue}throw p}n.set(o,b);let f=t.createAccessorDef(c);f.count=b.numIndices,t.accessorIndexMap.set(c,d.length),d.push(f),b.numVertices>65534&&U.getComponentSize(f.componentType)<=2?f.componentType=U.ComponentType.UNSIGNED_INT:b.numVertices>254&&U.getComponentSize(f.componentType)<=1&&(f.componentType=U.ComponentType.UNSIGNED_SHORT);for(let p of i.listSemantics()){let u=i.getAttribute(p);if(b.attributeIDs[p]===void 0)continue;let l=t.createAccessorDef(u);l.count=b.numVertices,t.accessorIndexMap.set(u,d.length),d.push(l)}let m=i.getAttribute("POSITION").getBuffer()||this.document.getRoot().listBuffers()[0];t.otherBufferViews.has(m)||t.otherBufferViews.set(m,[]),t.otherBufferViews.get(m).push(b.data)}return a.debug(`[${le}] Compressed ${s.size} primitives.`),t.extensionData[le]={primitiveHashMap:s,primitiveEncodingMap:n},this}write(t){let e=t.extensionData[le];for(let a of this.document.getRoot().listMeshes()){let s=t.jsonDoc.json.meshes[t.meshIndexMap.get(a)];for(let n=0;n<a.listPrimitives().length;n++){let r=a.listPrimitives()[n],i=s.primitives[n],o=e.primitiveHashMap.get(r);if(!o)continue;let c=e.primitiveEncodingMap.get(o);c&&(i.extensions=i.extensions||{},i.extensions[le]={bufferView:t.otherBufferViewsIndexMap.get(c.data),attributes:c.attributeIDs})}}if(!e.primitiveHashMap.size){let a=t.jsonDoc.json;a.extensionsUsed=(a.extensionsUsed||[]).filter(s=>s!==le),a.extensionsRequired=(a.extensionsRequired||[]).filter(s=>s!==le)}return this}};function Th(t){let e=t.getLogger(),a=new Set,s=new Set,n=0,r=0;for(let f of t.getRoot().listMeshes())for(let m of f.listPrimitives())m.getIndices()?m.getMode()!==Ia.Mode.TRIANGLES?(s.add(m),r++):a.add(m):(s.add(m),n++);n>0&&e.warn(`[${le}] Skipping Draco compression of ${n} non-indexed primitives.`),r>0&&e.warn(`[${le}] Skipping Draco compression of ${r} non-TRIANGLES primitives.`);let i=t.getRoot().listAccessors(),o=new Map;for(let f=0;f<i.length;f++)o.set(i[f],f);let c=new Map,d=new Set,b=new Map;for(let f of Array.from(a)){let m=oo(f,o);if(d.has(m)){b.set(f,m);continue}if(c.has(f.getIndices())){let p=f.getIndices(),u=p.clone();o.set(u,t.getRoot().listAccessors().length-1),f.swap(p,u)}for(let p of f.listAttributes())if(c.has(p)){let u=p.clone();o.set(u,t.getRoot().listAccessors().length-1),f.swap(p,u)}m=oo(f,o),d.add(m),b.set(f,m),c.set(f.getIndices(),m);for(let p of f.listAttributes())c.set(p,m)}for(let f of Array.from(c.keys())){let m=new Set(f.listParents().map(p=>p.propertyType));if(m.size!==2||!m.has(C.PRIMITIVE)||!m.has(C.ROOT))throw new Error(`[${le}] Compressed accessors must only be used as indices or vertex attributes.`)}for(let f of Array.from(a)){let m=b.get(f),p=f.getIndices();if(c.get(p)!==m||f.listAttributes().some(u=>c.get(u)!==m))throw new Error(`[${le}] Draco primitives must share all, or no, accessors.`)}for(let f of Array.from(s)){let m=f.getIndices();if(c.has(m)||f.listAttributes().some(p=>c.has(p)))throw new Error(`[${le}] Accessor cannot be shared by compressed and uncompressed primitives.`)}return b}function oo(t,e){let a=[],s=t.getIndices();a.push(e.get(s));for(let n of t.listAttributes())a.push(e.get(n));return a.sort().join("|")}var co=class Eo extends X{static EXTENSION_NAME=ot;static Type={POINT:"point",SPOT:"spot",DIRECTIONAL:"directional"};init(){this.extensionName=ot,this.propertyType="Light",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{color:[1,1,1],intensity:1,type:Eo.Type.POINT,range:null,innerConeAngle:0,outerConeAngle:Math.PI/4})}getColor(){return this.get("color")}setColor(e){return this.set("color",e)}getIntensity(){return this.get("intensity")}setIntensity(e){return this.set("intensity",e)}getType(){return this.get("type")}setType(e){return this.set("type",e)}getRange(){return this.get("range")}setRange(e){return this.set("range",e)}getInnerConeAngle(){return this.get("innerConeAngle")}setInnerConeAngle(e){return this.set("innerConeAngle",e)}getOuterConeAngle(){return this.get("outerConeAngle")}setOuterConeAngle(e){return this.set("outerConeAngle",e)}},kh=class extends ee{extensionName=ot;static EXTENSION_NAME=ot;createLight(t=""){return new co(this.document.getGraph(),t)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_lights_punctual)return this;let a=(e.json.extensions.KHR_lights_punctual.lights||[]).map(s=>{let n=this.createLight().setName(s.name||"").setType(s.type);return s.extras&&n.setExtras(s.extras),s.color!==void 0&&n.setColor(s.color),s.intensity!==void 0&&n.setIntensity(s.intensity),s.range!==void 0&&n.setRange(s.range),s.spot?.innerConeAngle!==void 0&&n.setInnerConeAngle(s.spot.innerConeAngle),s.spot?.outerConeAngle!==void 0&&n.setOuterConeAngle(s.spot.outerConeAngle),n});return e.json.nodes.forEach((s,n)=>{if(!s.extensions||!s.extensions.KHR_lights_punctual)return;let r=s.extensions[ot];t.nodes[n].setExtension(ot,a[r.light])}),this}write(t){let e=t.jsonDoc;if(this.properties.size===0)return this;let a=[],s=new Map;for(let n of this.properties){let r=n,i=t.createPropertyDef(n);i.type=r.getType(),ie.eq(r.getColor(),[1,1,1])||(i.color=r.getColor()),r.getIntensity()!==1&&(i.intensity=r.getIntensity()),r.getRange()!=null&&(i.range=r.getRange()),r.getName()&&(i.name=r.getName()),r.getType()===co.Type.SPOT&&(i.spot={innerConeAngle:r.getInnerConeAngle(),outerConeAngle:r.getOuterConeAngle()}),a.push(i),s.set(r,a.length-1)}return this.document.getRoot().listNodes().forEach(n=>{let r=n.getExtension(ot);if(r){let i=t.nodeIndexMap.get(n),o=e.json.nodes[i];o.extensions=o.extensions||{},o.extensions[ot]={light:s.get(r)}}}),e.json.extensions=e.json.extensions||{},e.json.extensions[ot]={lights:a},this}},{R:Ih,G:Sh,B:Rh}=Ve,Ah=class extends X{static EXTENSION_NAME=Mt;init(){this.extensionName=Mt,this.propertyType="Anisotropy",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{anisotropyStrength:0,anisotropyRotation:0,anisotropyTexture:null,anisotropyTextureInfo:new ne(this.graph,"anisotropyTextureInfo")})}getAnisotropyStrength(){return this.get("anisotropyStrength")}setAnisotropyStrength(t){return this.set("anisotropyStrength",t)}getAnisotropyRotation(){return this.get("anisotropyRotation")}setAnisotropyRotation(t){return this.set("anisotropyRotation",t)}getAnisotropyTexture(){return this.getRef("anisotropyTexture")}getAnisotropyTextureInfo(){return this.getRef("anisotropyTexture")?this.getRef("anisotropyTextureInfo"):null}setAnisotropyTexture(t){return this.setRef("anisotropyTexture",t,{channels:Ih|Sh|Rh})}},_h=class extends ee{static EXTENSION_NAME=Mt;extensionName=Mt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createAnisotropy(){return new Ah(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_anisotropy){let i=this.createAnisotropy();t.materials[r].setExtension(Mt,i);let o=n.extensions[Mt];if(o.extras&&i.setExtras(o.extras),o.anisotropyStrength!==void 0&&i.setAnisotropyStrength(o.anisotropyStrength),o.anisotropyRotation!==void 0&&i.setAnisotropyRotation(o.anisotropyRotation),o.anisotropyTexture!==void 0){let c=o.anisotropyTexture,d=t.textures[s[c.index].source];i.setAnisotropyTexture(d),t.setTextureInfo(i.getAnisotropyTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Mt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Mt]=i,s.getAnisotropyStrength()>0&&(i.anisotropyStrength=s.getAnisotropyStrength()),s.getAnisotropyRotation()!==0&&(i.anisotropyRotation=s.getAnisotropyRotation()),s.getAnisotropyTexture()){let o=s.getAnisotropyTexture(),c=s.getAnisotropyTextureInfo();i.anisotropyTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:lo,G:uo,B:Nh}=Ve,Ch=class extends X{static EXTENSION_NAME=Et;init(){this.extensionName=Et,this.propertyType="Clearcoat",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{clearcoatFactor:0,clearcoatTexture:null,clearcoatTextureInfo:new ne(this.graph,"clearcoatTextureInfo"),clearcoatRoughnessFactor:0,clearcoatRoughnessTexture:null,clearcoatRoughnessTextureInfo:new ne(this.graph,"clearcoatRoughnessTextureInfo"),clearcoatNormalScale:1,clearcoatNormalTexture:null,clearcoatNormalTextureInfo:new ne(this.graph,"clearcoatNormalTextureInfo")})}getClearcoatFactor(){return this.get("clearcoatFactor")}setClearcoatFactor(t){return this.set("clearcoatFactor",t)}getClearcoatTexture(){return this.getRef("clearcoatTexture")}getClearcoatTextureInfo(){return this.getRef("clearcoatTexture")?this.getRef("clearcoatTextureInfo"):null}setClearcoatTexture(t){return this.setRef("clearcoatTexture",t,{channels:lo})}getClearcoatRoughnessFactor(){return this.get("clearcoatRoughnessFactor")}setClearcoatRoughnessFactor(t){return this.set("clearcoatRoughnessFactor",t)}getClearcoatRoughnessTexture(){return this.getRef("clearcoatRoughnessTexture")}getClearcoatRoughnessTextureInfo(){return this.getRef("clearcoatRoughnessTexture")?this.getRef("clearcoatRoughnessTextureInfo"):null}setClearcoatRoughnessTexture(t){return this.setRef("clearcoatRoughnessTexture",t,{channels:uo})}getClearcoatNormalScale(){return this.get("clearcoatNormalScale")}setClearcoatNormalScale(t){return this.set("clearcoatNormalScale",t)}getClearcoatNormalTexture(){return this.getRef("clearcoatNormalTexture")}getClearcoatNormalTextureInfo(){return this.getRef("clearcoatNormalTexture")?this.getRef("clearcoatNormalTextureInfo"):null}setClearcoatNormalTexture(t){return this.setRef("clearcoatNormalTexture",t,{channels:lo|uo|Nh})}},Fh=class extends ee{static EXTENSION_NAME=Et;extensionName=Et;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createClearcoat(){return new Ch(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_clearcoat){let i=this.createClearcoat();t.materials[r].setExtension(Et,i);let o=n.extensions[Et];if(o.extras&&i.setExtras(o.extras),o.clearcoatFactor!==void 0&&i.setClearcoatFactor(o.clearcoatFactor),o.clearcoatRoughnessFactor!==void 0&&i.setClearcoatRoughnessFactor(o.clearcoatRoughnessFactor),o.clearcoatTexture!==void 0){let c=o.clearcoatTexture,d=t.textures[s[c.index].source];i.setClearcoatTexture(d),t.setTextureInfo(i.getClearcoatTextureInfo(),c)}if(o.clearcoatRoughnessTexture!==void 0){let c=o.clearcoatRoughnessTexture,d=t.textures[s[c.index].source];i.setClearcoatRoughnessTexture(d),t.setTextureInfo(i.getClearcoatRoughnessTextureInfo(),c)}if(o.clearcoatNormalTexture!==void 0){let c=o.clearcoatNormalTexture,d=t.textures[s[c.index].source];i.setClearcoatNormalTexture(d),t.setTextureInfo(i.getClearcoatNormalTextureInfo(),c),c.scale!==void 0&&i.setClearcoatNormalScale(c.scale)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Et);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Et]=i,i.clearcoatFactor=s.getClearcoatFactor(),i.clearcoatRoughnessFactor=s.getClearcoatRoughnessFactor(),s.getClearcoatTexture()){let o=s.getClearcoatTexture(),c=s.getClearcoatTextureInfo();i.clearcoatTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatRoughnessTexture()){let o=s.getClearcoatRoughnessTexture(),c=s.getClearcoatRoughnessTextureInfo();i.clearcoatRoughnessTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatNormalTexture()){let o=s.getClearcoatNormalTexture(),c=s.getClearcoatNormalTextureInfo();i.clearcoatNormalTexture=t.createTextureInfoDef(o,c),s.getClearcoatNormalScale()!==1&&(i.clearcoatNormalTexture.scale=s.getClearcoatNormalScale())}}}),this}},{R:Bh,G:jh,B:Oh,A:Ph}=Ve,Dh=class extends X{static EXTENSION_NAME=Tt;init(){this.extensionName=Tt,this.propertyType="DiffuseTransmission",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseTransmissionFactor:0,diffuseTransmissionTexture:null,diffuseTransmissionTextureInfo:new ne(this.graph,"diffuseTransmissionTextureInfo"),diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorTexture:null,diffuseTransmissionColorTextureInfo:new ne(this.graph,"diffuseTransmissionColorTextureInfo")})}getDiffuseTransmissionFactor(){return this.get("diffuseTransmissionFactor")}setDiffuseTransmissionFactor(t){return this.set("diffuseTransmissionFactor",t)}getDiffuseTransmissionTexture(){return this.getRef("diffuseTransmissionTexture")}getDiffuseTransmissionTextureInfo(){return this.getRef("diffuseTransmissionTexture")?this.getRef("diffuseTransmissionTextureInfo"):null}setDiffuseTransmissionTexture(t){return this.setRef("diffuseTransmissionTexture",t,{channels:Ph})}getDiffuseTransmissionColorFactor(){return this.get("diffuseTransmissionColorFactor")}setDiffuseTransmissionColorFactor(t){return this.set("diffuseTransmissionColorFactor",t)}getDiffuseTransmissionColorTexture(){return this.getRef("diffuseTransmissionColorTexture")}getDiffuseTransmissionColorTextureInfo(){return this.getRef("diffuseTransmissionColorTexture")?this.getRef("diffuseTransmissionColorTextureInfo"):null}setDiffuseTransmissionColorTexture(t){return this.setRef("diffuseTransmissionColorTexture",t,{channels:Bh|jh|Oh})}},Lh=class extends ee{extensionName=Tt;static EXTENSION_NAME=Tt;createDiffuseTransmission(){return new Dh(this.document.getGraph())}read(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_diffuse_transmission){let i=this.createDiffuseTransmission();t.materials[r].setExtension(Tt,i);let o=n.extensions[Tt];if(o.extras&&i.setExtras(o.extras),o.diffuseTransmissionFactor!==void 0&&i.setDiffuseTransmissionFactor(o.diffuseTransmissionFactor),o.diffuseTransmissionColorFactor!==void 0&&i.setDiffuseTransmissionColorFactor(o.diffuseTransmissionColorFactor),o.diffuseTransmissionTexture!==void 0){let c=o.diffuseTransmissionTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionTexture(d),t.setTextureInfo(i.getDiffuseTransmissionTextureInfo(),c)}if(o.diffuseTransmissionColorTexture!==void 0){let c=o.diffuseTransmissionColorTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionColorTexture(d),t.setTextureInfo(i.getDiffuseTransmissionColorTextureInfo(),c)}}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listMaterials()){let s=a.getExtension(Tt);if(!s)continue;let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Tt]=i,i.diffuseTransmissionFactor=s.getDiffuseTransmissionFactor(),i.diffuseTransmissionColorFactor=s.getDiffuseTransmissionColorFactor(),s.getDiffuseTransmissionTexture()){let o=s.getDiffuseTransmissionTexture(),c=s.getDiffuseTransmissionTextureInfo();i.diffuseTransmissionTexture=t.createTextureInfoDef(o,c)}if(s.getDiffuseTransmissionColorTexture()){let o=s.getDiffuseTransmissionColorTexture(),c=s.getDiffuseTransmissionColorTextureInfo();i.diffuseTransmissionColorTexture=t.createTextureInfoDef(o,c)}}return this}},Uh=class extends X{static EXTENSION_NAME=kt;init(){this.extensionName=kt,this.propertyType="Dispersion",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{dispersion:0})}getDispersion(){return this.get("dispersion")}setDispersion(t){return this.set("dispersion",t)}},Gh=class extends ee{static EXTENSION_NAME=kt;extensionName=kt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createDispersion(){return new Uh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_dispersion){let s=this.createDispersion();t.materials[a].setExtension(kt,s);let n=e.extensions[kt];n.extras&&s.setExtras(n.extras),n.dispersion!==void 0&&s.setDispersion(n.dispersion)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(kt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);r.extensions=r.extensions||{},r.extensions[kt]=i,i.dispersion=s.getDispersion()}}),this}},Kh=class extends X{static EXTENSION_NAME=It;init(){this.extensionName=It,this.propertyType="EmissiveStrength",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{emissiveStrength:1})}getEmissiveStrength(){return this.get("emissiveStrength")}setEmissiveStrength(t){return this.set("emissiveStrength",t)}},zh=class extends ee{static EXTENSION_NAME=It;extensionName=It;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createEmissiveStrength(){return new Kh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_emissive_strength){let s=this.createEmissiveStrength();t.materials[a].setExtension(It,s);let n=e.extensions[It];n.extras&&s.setExtras(n.extras),n.emissiveStrength!==void 0&&s.setEmissiveStrength(n.emissiveStrength)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(It);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);r.extensions=r.extensions||{},r.extensions[It]=i,i.emissiveStrength=s.getEmissiveStrength()}}),this}},Vh=class extends X{static EXTENSION_NAME=St;init(){this.extensionName=St,this.propertyType="IOR",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{ior:1.5})}getIOR(){return this.get("ior")}setIOR(t){return this.set("ior",t)}},Hh=class extends ee{static EXTENSION_NAME=St;extensionName=St;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createIOR(){return new Vh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_ior){let s=this.createIOR();t.materials[a].setExtension(St,s);let n=e.extensions[St];n.extras&&s.setExtras(n.extras),n.ior!==void 0&&s.setIOR(n.ior)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(St);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);r.extensions=r.extensions||{},r.extensions[St]=i,i.ior=s.getIOR()}}),this}},{R:qh,G:Xh}=Ve,Wh=class extends X{static EXTENSION_NAME=Rt;init(){this.extensionName=Rt,this.propertyType="Iridescence",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{iridescenceFactor:0,iridescenceTexture:null,iridescenceTextureInfo:new ne(this.graph,"iridescenceTextureInfo"),iridescenceIOR:1.3,iridescenceThicknessMinimum:100,iridescenceThicknessMaximum:400,iridescenceThicknessTexture:null,iridescenceThicknessTextureInfo:new ne(this.graph,"iridescenceThicknessTextureInfo")})}getIridescenceFactor(){return this.get("iridescenceFactor")}setIridescenceFactor(t){return this.set("iridescenceFactor",t)}getIridescenceTexture(){return this.getRef("iridescenceTexture")}getIridescenceTextureInfo(){return this.getRef("iridescenceTexture")?this.getRef("iridescenceTextureInfo"):null}setIridescenceTexture(t){return this.setRef("iridescenceTexture",t,{channels:qh})}getIridescenceIOR(){return this.get("iridescenceIOR")}setIridescenceIOR(t){return this.set("iridescenceIOR",t)}getIridescenceThicknessMinimum(){return this.get("iridescenceThicknessMinimum")}setIridescenceThicknessMinimum(t){return this.set("iridescenceThicknessMinimum",t)}getIridescenceThicknessMaximum(){return this.get("iridescenceThicknessMaximum")}setIridescenceThicknessMaximum(t){return this.set("iridescenceThicknessMaximum",t)}getIridescenceThicknessTexture(){return this.getRef("iridescenceThicknessTexture")}getIridescenceThicknessTextureInfo(){return this.getRef("iridescenceThicknessTexture")?this.getRef("iridescenceThicknessTextureInfo"):null}setIridescenceThicknessTexture(t){return this.setRef("iridescenceThicknessTexture",t,{channels:Xh})}},$h=class extends ee{static EXTENSION_NAME=Rt;extensionName=Rt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createIridescence(){return new Wh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_iridescence){let i=this.createIridescence();t.materials[r].setExtension(Rt,i);let o=n.extensions[Rt];if(o.extras&&i.setExtras(o.extras),o.iridescenceFactor!==void 0&&i.setIridescenceFactor(o.iridescenceFactor),o.iridescenceIor!==void 0&&i.setIridescenceIOR(o.iridescenceIor),o.iridescenceThicknessMinimum!==void 0&&i.setIridescenceThicknessMinimum(o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&i.setIridescenceThicknessMaximum(o.iridescenceThicknessMaximum),o.iridescenceTexture!==void 0){let c=o.iridescenceTexture,d=t.textures[s[c.index].source];i.setIridescenceTexture(d),t.setTextureInfo(i.getIridescenceTextureInfo(),c)}if(o.iridescenceThicknessTexture!==void 0){let c=o.iridescenceThicknessTexture,d=t.textures[s[c.index].source];i.setIridescenceThicknessTexture(d),t.setTextureInfo(i.getIridescenceThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Rt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Rt]=i,s.getIridescenceFactor()>0&&(i.iridescenceFactor=s.getIridescenceFactor()),s.getIridescenceIOR()!==1.3&&(i.iridescenceIor=s.getIridescenceIOR()),s.getIridescenceThicknessMinimum()!==100&&(i.iridescenceThicknessMinimum=s.getIridescenceThicknessMinimum()),s.getIridescenceThicknessMaximum()!==400&&(i.iridescenceThicknessMaximum=s.getIridescenceThicknessMaximum()),s.getIridescenceTexture()){let o=s.getIridescenceTexture(),c=s.getIridescenceTextureInfo();i.iridescenceTexture=t.createTextureInfoDef(o,c)}if(s.getIridescenceThicknessTexture()){let o=s.getIridescenceThicknessTexture(),c=s.getIridescenceThicknessTextureInfo();i.iridescenceThicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:fo,G:ho,B:bo,A:po}=Ve,Jh=class extends X{static EXTENSION_NAME=At;init(){this.extensionName=At,this.propertyType="PBRSpecularGlossiness",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseFactor:[1,1,1,1],diffuseTexture:null,diffuseTextureInfo:new ne(this.graph,"diffuseTextureInfo"),specularFactor:[1,1,1],glossinessFactor:1,specularGlossinessTexture:null,specularGlossinessTextureInfo:new ne(this.graph,"specularGlossinessTextureInfo")})}getDiffuseFactor(){return this.get("diffuseFactor")}setDiffuseFactor(t){return this.set("diffuseFactor",t)}getDiffuseTexture(){return this.getRef("diffuseTexture")}getDiffuseTextureInfo(){return this.getRef("diffuseTexture")?this.getRef("diffuseTextureInfo"):null}setDiffuseTexture(t){return this.setRef("diffuseTexture",t,{channels:fo|ho|bo|po,isColor:!0})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getGlossinessFactor(){return this.get("glossinessFactor")}setGlossinessFactor(t){return this.set("glossinessFactor",t)}getSpecularGlossinessTexture(){return this.getRef("specularGlossinessTexture")}getSpecularGlossinessTextureInfo(){return this.getRef("specularGlossinessTexture")?this.getRef("specularGlossinessTextureInfo"):null}setSpecularGlossinessTexture(t){return this.setRef("specularGlossinessTexture",t,{channels:fo|ho|bo|po})}},Yh=class extends ee{static EXTENSION_NAME=At;extensionName=At;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createPBRSpecularGlossiness(){return new Jh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_pbrSpecularGlossiness){let i=this.createPBRSpecularGlossiness();t.materials[r].setExtension(At,i);let o=n.extensions[At];if(o.extras&&i.setExtras(o.extras),o.diffuseFactor!==void 0&&i.setDiffuseFactor(o.diffuseFactor),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.glossinessFactor!==void 0&&i.setGlossinessFactor(o.glossinessFactor),o.diffuseTexture!==void 0){let c=o.diffuseTexture,d=t.textures[s[c.index].source];i.setDiffuseTexture(d),t.setTextureInfo(i.getDiffuseTextureInfo(),c)}if(o.specularGlossinessTexture!==void 0){let c=o.specularGlossinessTexture,d=t.textures[s[c.index].source];i.setSpecularGlossinessTexture(d),t.setTextureInfo(i.getSpecularGlossinessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(At);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[At]=i,i.diffuseFactor=s.getDiffuseFactor(),i.specularFactor=s.getSpecularFactor(),i.glossinessFactor=s.getGlossinessFactor(),s.getDiffuseTexture()){let o=s.getDiffuseTexture(),c=s.getDiffuseTextureInfo();i.diffuseTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularGlossinessTexture()){let o=s.getSpecularGlossinessTexture(),c=s.getSpecularGlossinessTextureInfo();i.specularGlossinessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Qh,G:Zh,B:eb,A:tb}=Ve,ab=class extends X{static EXTENSION_NAME=_t;init(){this.extensionName=_t,this.propertyType="Sheen",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{sheenColorFactor:[0,0,0],sheenColorTexture:null,sheenColorTextureInfo:new ne(this.graph,"sheenColorTextureInfo"),sheenRoughnessFactor:0,sheenRoughnessTexture:null,sheenRoughnessTextureInfo:new ne(this.graph,"sheenRoughnessTextureInfo")})}getSheenColorFactor(){return this.get("sheenColorFactor")}setSheenColorFactor(t){return this.set("sheenColorFactor",t)}getSheenColorTexture(){return this.getRef("sheenColorTexture")}getSheenColorTextureInfo(){return this.getRef("sheenColorTexture")?this.getRef("sheenColorTextureInfo"):null}setSheenColorTexture(t){return this.setRef("sheenColorTexture",t,{channels:Qh|Zh|eb,isColor:!0})}getSheenRoughnessFactor(){return this.get("sheenRoughnessFactor")}setSheenRoughnessFactor(t){return this.set("sheenRoughnessFactor",t)}getSheenRoughnessTexture(){return this.getRef("sheenRoughnessTexture")}getSheenRoughnessTextureInfo(){return this.getRef("sheenRoughnessTexture")?this.getRef("sheenRoughnessTextureInfo"):null}setSheenRoughnessTexture(t){return this.setRef("sheenRoughnessTexture",t,{channels:tb})}},sb=class extends ee{static EXTENSION_NAME=_t;extensionName=_t;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createSheen(){return new ab(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_sheen){let i=this.createSheen();t.materials[r].setExtension(_t,i);let o=n.extensions[_t];if(o.extras&&i.setExtras(o.extras),o.sheenColorFactor!==void 0&&i.setSheenColorFactor(o.sheenColorFactor),o.sheenRoughnessFactor!==void 0&&i.setSheenRoughnessFactor(o.sheenRoughnessFactor),o.sheenColorTexture!==void 0){let c=o.sheenColorTexture,d=t.textures[s[c.index].source];i.setSheenColorTexture(d),t.setTextureInfo(i.getSheenColorTextureInfo(),c)}if(o.sheenRoughnessTexture!==void 0){let c=o.sheenRoughnessTexture,d=t.textures[s[c.index].source];i.setSheenRoughnessTexture(d),t.setTextureInfo(i.getSheenRoughnessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(_t);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[_t]=i,i.sheenColorFactor=s.getSheenColorFactor(),i.sheenRoughnessFactor=s.getSheenRoughnessFactor(),s.getSheenColorTexture()){let o=s.getSheenColorTexture(),c=s.getSheenColorTextureInfo();i.sheenColorTexture=t.createTextureInfoDef(o,c)}if(s.getSheenRoughnessTexture()){let o=s.getSheenRoughnessTexture(),c=s.getSheenRoughnessTextureInfo();i.sheenRoughnessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:nb,G:rb,B:ib,A:ob}=Ve,cb=class extends X{static EXTENSION_NAME=Nt;init(){this.extensionName=Nt,this.propertyType="Specular",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{specularFactor:1,specularTexture:null,specularTextureInfo:new ne(this.graph,"specularTextureInfo"),specularColorFactor:[1,1,1],specularColorTexture:null,specularColorTextureInfo:new ne(this.graph,"specularColorTextureInfo")})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getSpecularColorFactor(){return this.get("specularColorFactor")}setSpecularColorFactor(t){return this.set("specularColorFactor",t)}getSpecularTexture(){return this.getRef("specularTexture")}getSpecularTextureInfo(){return this.getRef("specularTexture")?this.getRef("specularTextureInfo"):null}setSpecularTexture(t){return this.setRef("specularTexture",t,{channels:ob})}getSpecularColorTexture(){return this.getRef("specularColorTexture")}getSpecularColorTextureInfo(){return this.getRef("specularColorTexture")?this.getRef("specularColorTextureInfo"):null}setSpecularColorTexture(t){return this.setRef("specularColorTexture",t,{channels:nb|rb|ib,isColor:!0})}},lb=class extends ee{static EXTENSION_NAME=Nt;extensionName=Nt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createSpecular(){return new cb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_specular){let i=this.createSpecular();t.materials[r].setExtension(Nt,i);let o=n.extensions[Nt];if(o.extras&&i.setExtras(o.extras),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.specularColorFactor!==void 0&&i.setSpecularColorFactor(o.specularColorFactor),o.specularTexture!==void 0){let c=o.specularTexture,d=t.textures[s[c.index].source];i.setSpecularTexture(d),t.setTextureInfo(i.getSpecularTextureInfo(),c)}if(o.specularColorTexture!==void 0){let c=o.specularColorTexture,d=t.textures[s[c.index].source];i.setSpecularColorTexture(d),t.setTextureInfo(i.getSpecularColorTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Nt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Nt]=i,s.getSpecularFactor()!==1&&(i.specularFactor=s.getSpecularFactor()),ie.eq(s.getSpecularColorFactor(),[1,1,1])||(i.specularColorFactor=s.getSpecularColorFactor()),s.getSpecularTexture()){let o=s.getSpecularTexture(),c=s.getSpecularTextureInfo();i.specularTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularColorTexture()){let o=s.getSpecularColorTexture(),c=s.getSpecularColorTextureInfo();i.specularColorTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:db}=Ve,ub=class extends X{static EXTENSION_NAME=Ct;init(){this.extensionName=Ct,this.propertyType="Transmission",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{transmissionFactor:0,transmissionTexture:null,transmissionTextureInfo:new ne(this.graph,"transmissionTextureInfo")})}getTransmissionFactor(){return this.get("transmissionFactor")}setTransmissionFactor(t){return this.set("transmissionFactor",t)}getTransmissionTexture(){return this.getRef("transmissionTexture")}getTransmissionTextureInfo(){return this.getRef("transmissionTexture")?this.getRef("transmissionTextureInfo"):null}setTransmissionTexture(t){return this.setRef("transmissionTexture",t,{channels:db})}},fb=class extends ee{static EXTENSION_NAME=Ct;extensionName=Ct;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createTransmission(){return new ub(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_transmission){let i=this.createTransmission();t.materials[r].setExtension(Ct,i);let o=n.extensions[Ct];if(o.extras&&i.setExtras(o.extras),o.transmissionFactor!==void 0&&i.setTransmissionFactor(o.transmissionFactor),o.transmissionTexture!==void 0){let c=o.transmissionTexture,d=t.textures[s[c.index].source];i.setTransmissionTexture(d),t.setTextureInfo(i.getTransmissionTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Ct);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Ct]=i,i.transmissionFactor=s.getTransmissionFactor(),s.getTransmissionTexture()){let o=s.getTransmissionTexture(),c=s.getTransmissionTextureInfo();i.transmissionTexture=t.createTextureInfoDef(o,c)}}}),this}},hb=class extends X{static EXTENSION_NAME=ra;init(){this.extensionName=ra,this.propertyType="Unlit",this.parentTypes=[C.MATERIAL]}},bb=class extends ee{static EXTENSION_NAME=ra;extensionName=ra;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createUnlit(){return new hb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{e.extensions&&e.extensions.KHR_materials_unlit&&t.materials[a].setExtension(ra,this.createUnlit())}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{if(a.getExtension("KHR_materials_unlit")){let s=t.materialIndexMap.get(a),n=e.json.materials[s];n.extensions=n.extensions||{},n.extensions[ra]={}}}),this}},pb=class extends X{static EXTENSION_NAME=Be;init(){this.extensionName=Be,this.propertyType="Mapping",this.parentTypes=["MappingList"]}getDefaults(){return Object.assign(super.getDefaults(),{material:null,variants:new ae})}getMaterial(){return this.getRef("material")}setMaterial(t){return this.setRef("material",t)}addVariant(t){return this.addRef("variants",t)}removeVariant(t){return this.removeRef("variants",t)}listVariants(){return this.listRefs("variants")}},gb=class extends X{static EXTENSION_NAME=Be;init(){this.extensionName=Be,this.propertyType="MappingList",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{mappings:new ae})}addMapping(t){return this.addRef("mappings",t)}removeMapping(t){return this.removeRef("mappings",t)}listMappings(){return this.listRefs("mappings")}},go=class extends X{static EXTENSION_NAME=Be;init(){this.extensionName=Be,this.propertyType="Variant",this.parentTypes=["MappingList"]}},mb=class extends ee{extensionName=Be;static EXTENSION_NAME=Be;createMappingList(){return new gb(this.document.getGraph())}createVariant(t=""){return new go(this.document.getGraph(),t)}createMapping(){return new pb(this.document.getGraph())}listVariants(){return Array.from(this.properties).filter(t=>t instanceof go)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_materials_variants)return this;let a=(e.json.extensions.KHR_materials_variants.variants||[]).map(s=>this.createVariant().setName(s.name||""));return(e.json.meshes||[]).forEach((s,n)=>{let r=t.meshes[n];(s.primitives||[]).forEach((i,o)=>{if(!i.extensions||!i.extensions.KHR_materials_variants)return;let c=this.createMappingList(),d=i.extensions[Be];for(let b of d.mappings){let f=this.createMapping();b.material!==void 0&&f.setMaterial(t.materials[b.material]);for(let m of b.variants||[])f.addVariant(a[m]);c.addMapping(f)}r.listPrimitives()[o].setExtension(Be,c)})}),this}write(t){let e=t.jsonDoc,a=this.listVariants();if(!a.length)return this;let s=[],n=new Map;for(let r of a)n.set(r,s.length),s.push(t.createPropertyDef(r));for(let r of this.document.getRoot().listMeshes()){let i=t.meshIndexMap.get(r);r.listPrimitives().forEach((o,c)=>{let d=o.getExtension(Be);if(!d)return;let b=t.jsonDoc.json.meshes[i].primitives[c],f=d.listMappings().map(m=>{let p=t.createPropertyDef(m),u=m.getMaterial();return u&&(p.material=t.materialIndexMap.get(u)),p.variants=m.listVariants().map(l=>n.get(l)),p});b.extensions=b.extensions||{},b.extensions[Be]={mappings:f}})}return e.json.extensions=e.json.extensions||{},e.json.extensions[Be]={variants:s},this}},{G:yb}=Ve,xb=class extends X{static EXTENSION_NAME=Ft;init(){this.extensionName=Ft,this.propertyType="Volume",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{thicknessFactor:0,thicknessTexture:null,thicknessTextureInfo:new ne(this.graph,"thicknessTexture"),attenuationDistance:1/0,attenuationColor:[1,1,1]})}getThicknessFactor(){return this.get("thicknessFactor")}setThicknessFactor(t){return this.set("thicknessFactor",t)}getThicknessTexture(){return this.getRef("thicknessTexture")}getThicknessTextureInfo(){return this.getRef("thicknessTexture")?this.getRef("thicknessTextureInfo"):null}setThicknessTexture(t){return this.setRef("thicknessTexture",t,{channels:yb})}getAttenuationDistance(){return this.get("attenuationDistance")}setAttenuationDistance(t){return this.set("attenuationDistance",t)}getAttenuationColor(){return this.get("attenuationColor")}setAttenuationColor(t){return this.set("attenuationColor",t)}},wb=class extends ee{static EXTENSION_NAME=Ft;extensionName=Ft;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createVolume(){return new xb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_volume){let i=this.createVolume();t.materials[r].setExtension(Ft,i);let o=n.extensions[Ft];if(o.extras&&i.setExtras(o.extras),o.thicknessFactor!==void 0&&i.setThicknessFactor(o.thicknessFactor),o.attenuationDistance!==void 0&&i.setAttenuationDistance(o.attenuationDistance),o.attenuationColor!==void 0&&i.setAttenuationColor(o.attenuationColor),o.thicknessTexture!==void 0){let c=o.thicknessTexture,d=t.textures[s[c.index].source];i.setThicknessTexture(d),t.setTextureInfo(i.getThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Ft);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Ft]=i,s.getThicknessFactor()>0&&(i.thicknessFactor=s.getThicknessFactor()),Number.isFinite(s.getAttenuationDistance())&&(i.attenuationDistance=s.getAttenuationDistance()),ie.eq(s.getAttenuationColor(),[1,1,1])||(i.attenuationColor=s.getAttenuationColor()),s.getThicknessTexture()){let o=s.getThicknessTexture(),c=s.getThicknessTextureInfo();i.thicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},vb=class extends ee{extensionName=Qi;static EXTENSION_NAME=Qi;read(t){return this}write(t){return this}},Qn=class extends ee{extensionName=Zi;static EXTENSION_NAME=Zi;read(t){return this}write(t){return this}},Mb=class extends X{static EXTENSION_NAME=Bt;init(){this.extensionName=Bt,this.propertyType="Visibility",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{visible:!0})}getVisible(){return this.get("visible")}setVisible(t){return this.set("visible",t)}},Eb=class extends ee{static EXTENSION_NAME=Bt;extensionName=Bt;createVisibility(){return new Mb(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_node_visibility){let s=this.createVisibility();t.nodes[a].setExtension(Bt,s);let n=e.extensions[Bt];n.visible!==void 0&&s.setVisible(n.visible)}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listNodes()){let s=a.getExtension(Bt);if(!s)continue;let n=t.nodeIndexMap.get(a),r=e.json.nodes[n];r.extensions=r.extensions||{},r.extensions[Bt]={visible:s.getVisible()}}return this}};function Tb(t){return t.vkFormat>0&&t.vkFormat<=123}function mo(t){let e=t.vkFormat===1000066e3&&t.dataFormatDescriptor[0].colorModel===167;return t.vkFormat===0||e}var kb=class{match(t){return t[0]===171&&t[1]===75&&t[2]===84&&t[3]===88&&t[4]===32&&t[5]===50&&t[6]===48&&t[7]===187&&t[8]===13&&t[9]===10&&t[10]===26&&t[11]===10}getSize(t){let e=ys(t);return[e.pixelWidth,e.pixelHeight]}getChannels(t){let e=ys(t),a=e.dataFormatDescriptor[0];if(Tb(e))return a.samples.length;if(mo(e))switch(a.colorModel){case 163:return a.samples.length===2&&(a.samples[1].channelType&15)===15?4:3;case 166:return(a.samples[0].channelType&15)===3?4:3;default:throw new Error(`Unexpected KTX2 colorModel, "${a.colorModel}".`)}throw new Error(`Unexpected KTX2 vkFormat, "${e.vkFormat}".`)}getVRAMByteLength(t){let e=ys(t),a=0;if(mo(e)){let s=this.getChannels(t)>3;for(let n=0;n<e.levels.length;n++){let r=e.levels[n];if(r.uncompressedByteLength)a+=r.uncompressedByteLength;else{let i=Math.max(1,Math.floor(e.pixelWidth/Math.pow(2,n))),o=Math.max(1,Math.floor(e.pixelHeight/Math.pow(2,n))),c=s?16:8;a+=i/4*(o/4)*c}}}else for(let s of e.levels)e.supercompressionScheme===0?a+=s.levelData.byteLength:a+=s.uncompressedByteLength;return a}},Ib=class extends ee{static EXTENSION_NAME=vs;extensionName=vs;prereadTypes=[C.TEXTURE];static register(){Ze.registerFormat("image/ktx2",new kb)}preread(t){return t.jsonDoc.json.textures&&t.jsonDoc.json.textures.forEach(e=>{e.extensions&&e.extensions.KHR_texture_basisu&&(e.source=e.extensions[vs].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/ktx2"){let s=t.imageIndexMap.get(a);e.json.textures.forEach(n=>{n.source===s&&(n.extensions=n.extensions||{},n.extensions[vs]={source:n.source},delete n.source)})}}),this}},Sb=class extends X{static EXTENSION_NAME=jt;init(){this.extensionName=jt,this.propertyType="Transform",this.parentTypes=[C.TEXTURE_INFO]}getDefaults(){return Object.assign(super.getDefaults(),{offset:[0,0],rotation:0,scale:[1,1],texCoord:null})}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getRotation(){return this.get("rotation")}setRotation(t){return this.set("rotation",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getTexCoord(){return this.get("texCoord")}setTexCoord(t){return this.set("texCoord",t)}},Rb=class extends ee{extensionName=jt;static EXTENSION_NAME=jt;createTransform(){return new Sb(this.document.getGraph())}read(t){for(let[e,a]of Array.from(t.textureInfos.entries())){if(!a.extensions||!a.extensions.KHR_texture_transform)continue;let s=this.createTransform(),n=a.extensions[jt];n.offset!==void 0&&s.setOffset(n.offset),n.rotation!==void 0&&s.setRotation(n.rotation),n.scale!==void 0&&s.setScale(n.scale),n.texCoord!==void 0&&s.setTexCoord(n.texCoord),e.setExtension(jt,s)}return this}write(t){let e=Array.from(t.textureInfoDefMap.entries());for(let[a,s]of e){let n=a.getExtension(jt);if(!n)continue;s.extensions=s.extensions||{};let r={},i=ie.eq;i(n.getOffset(),[0,0])||(r.offset=n.getOffset()),n.getRotation()!==0&&(r.rotation=n.getRotation()),i(n.getScale(),[1,1])||(r.scale=n.getScale()),n.getTexCoord()!=null&&(r.texCoord=n.getTexCoord()),s.extensions[jt]=r}return this}},Ab=[C.ROOT,C.SCENE,C.NODE,C.MESH,C.MATERIAL,C.TEXTURE,C.ANIMATION],_b=class extends X{static EXTENSION_NAME=He;init(){this.extensionName=He,this.propertyType="Packet",this.parentTypes=Ab}getDefaults(){return Object.assign(super.getDefaults(),{context:{},properties:{}})}getContext(){return this.get("context")}setContext(t){return this.set("context",{...t})}listProperties(){return Object.keys(this.get("properties"))}getProperty(t){let e=this.get("properties");return t in e?e[t]:null}setProperty(t,e){this._assertContext(t);let a={...this.get("properties")};return e?a[t]=e:delete a[t],this.set("properties",a)}toJSONLD(){return{"@context":qn(this.get("context")),...qn(this.get("properties"))}}fromJSONLD(t){t=qn(t);let e=t["@context"];return e&&this.set("context",e),delete t["@context"],this.set("properties",t)}_assertContext(t){if(!(t.split(":")[0]in this.get("context")))throw new Error(`${He}: Missing context for term, "${t}".`)}};function qn(t){return JSON.parse(JSON.stringify(t))}var Nb=class extends ee{extensionName=He;static EXTENSION_NAME=He;createPacket(){return new _b(this.document.getGraph())}listPackets(){return Array.from(this.properties)}read(t){let e=t.jsonDoc.json.extensions?.[He];if(!e||!e.packets)return this;let a=t.jsonDoc.json,s=this.document.getRoot(),n=e.packets.map(o=>this.createPacket().fromJSONLD(o)),r=[[a.asset],a.scenes,a.nodes,a.meshes,a.materials,a.images,a.animations],i=[[s],s.listScenes(),s.listNodes(),s.listMeshes(),s.listMaterials(),s.listTextures(),s.listAnimations()];for(let o=0;o<r.length;o++){let c=r[o]||[];for(let d=0;d<c.length;d++){let b=c[d];if(b.extensions&&b.extensions.KHR_xmp_json_ld){let f=b.extensions[He];i[o][d].setExtension(He,n[f.packet])}}}return this}write(t){let{json:e}=t.jsonDoc,a=[];for(let s of this.properties){a.push(s.toJSONLD());for(let n of s.listParents()){let r;switch(n.propertyType){case C.ROOT:r=e.asset;break;case C.SCENE:r=e.scenes[t.sceneIndexMap.get(n)];break;case C.NODE:r=e.nodes[t.nodeIndexMap.get(n)];break;case C.MESH:r=e.meshes[t.meshIndexMap.get(n)];break;case C.MATERIAL:r=e.materials[t.materialIndexMap.get(n)];break;case C.TEXTURE:r=e.images[t.imageIndexMap.get(n)];break;case C.ANIMATION:r=e.animations[t.animationIndexMap.get(n)];break;default:r=null,this.document.getLogger().warn(`[${He}]: Unsupported parent property, "${n.propertyType}"`);break}r&&(r.extensions=r.extensions||{},r.extensions[He]={packet:a.length-1})}}return a.length>0&&(e.extensions=e.extensions||{},e.extensions[He]={packets:a}),this}},Cb=[fh,hh,Eh,kh,_h,Fh,Lh,Gh,zh,Hh,$h,Yh,lb,sb,fb,bb,mb,wb,vb,Qn,Eb,Ib,Rb,Nb],Ux=[uf,Jn,Yn,Of,lh,uh,...Cb];var rw=(function(){var t="b9H79Tebbbe9ok9Geueu9Geub9Gbb9Gruuuuuuueu9Gvuuuuueu9Gduueu9Gluuuueu9Gvuuuuub9Gouuuuuub9Gluuuub9Giuuueui8AYdilveoveovrrwrrDDoDrbqqbelve9Weiiviebeoweuec;G:Qdkr:nlAo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9mW4W2be8A9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWVbd8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9c9V919U9KbiE9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949wWV79P9V9UblY9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWVbv8E9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWV9c9V919U9Kbo8A9TW79O9V9Wt9FW9U9J9V9KW69U9KW949wWV79P9V9UbrE9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JWbwa9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JW9c9V919U9KbDL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9p9JtbqK9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9r919HtbkL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWVT949WbxE9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OWbsa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OW9ttV9P9Wbza9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9WbHK9TW79O9V9Wt9F79W9Ht9P9H29t9VVt9sW9T9H9WbOl79IV9RbCDwebcekdKLqN9OYdbk:Bhdhud9:8Jjjjjbc;qw9Rgr8KjjjjbcbhwdnaeTmbabcbyd;C:kjjbaoaocb9iEgDc:GeV86bbarc;adfcbcjdz:wjjjb8AdnaiTmbarc;adfadalz:vjjjb8Akarc;abfalfcbcbcjdal9RalcFe0Ez:wjjjb8Aarc;abfarc;adfalz:vjjjb8AarcUf9cb83ibarc8Wf9cb83ibarcyf9cb83ibarcaf9cb83ibarcKf9cb83ibarczf9cb83ibar9cb83iwar9cb83ibcj;abal9Uc;WFbGcjdalca0Ehqdnaicd6mbavcd9imbaDTmbadcefhkaqci2gxal2hmarc;alfclfhParc;qlfceVhsarc;qofclVhzarc;qofcKfhHarc;qofczfhOcbhAincdhCcbhodnavci6mbaH9cb83ibaO9cb83ibar9cb83i;yoar9cb83i;qoadaAfgoybbhXcbhQincbhwcbhLdninaoalfhKaoybbgYaX7aLVhLawcP0meaKhoaYhXawcefgwaQfai6mbkkcbhXarc;qofhwincwh8AcwhEdnaLaX93gocFeGg3cs0mbclhEa3ci0mba3cb9hcethEkdnaocw4cFeGg3cs0mbclh8Aa3ci0mba3cb9hceth8Aka8AaEfh3awydbh5cwh8AcwhEdnaocz4cFeGg8Ecs0mbclhEa8Eci0mba8Ecb9hcethEka3a5fh3dnaocFFFFb0mbclh8AaocFFF8F0mbaocFFFr0ceth8Akawa3aEfa8AfBdbawclfhwaXcefgXcw9hmbkaKhoaYhXaQczfgQai6mbkcbhocehwazhLinawaoaLydbarc;qofaocdtfydb6EhoaLclfhLawcefgwcw9hmbkcihCkcbh3arc;qlfcbcjdz:wjjjb8Aarc;alfcwfcbBdbar9cb83i;alaoclth8Fadhaaqhhakh5inarc;qlfadcba3cufgoaoa30Eal2falz:vjjjb8Aaiahaiah6Ehgdnaqaia39Ra3aqfai6EgYcsfc9WGgoaY9nmbarc;qofaYfcbaoaY9Rz:wjjjb8Akada3al2fh8Jcbh8Kina8Ka8FVcl4hQarc;alfa8Kcdtfh8LaAh8Mcbh8Nina8NaAfhwdndndndndndna8KPldebidkasa8Mc98GgLfhoa5aLfh8Aarc;qlfawc98GgLfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkaYTmla8Ncith8Ea8JaLfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aQ93a8E486bba8Aalfh8AaEalfhEaLhXaKcefgKaY9hmbxlkkaYTmia8Mc9:Ghoa8NcitcwGhEarc;qlfawceVfRbbcwtarc;qlfawc9:GfRbbVhLarc;qofhwaghXinawa5aofRbbcwtaaaofRbbVg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbaoalfhoawcefhwa8AhLa3aXcufgX9hmbxikkaYTmda8Jawfhoarc;qlfawfRbbhLarc;qofhwaghXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLa3aXcufgX9hmbxdkkaYTmeka8LydbhEcbhKarc;qofhoincdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egwa8Aawa8A6Egwczawcz6EaEfhEaoczfhoaKczfgKaY6mbka8LaEBdbka8Mcefh8Ma8Ncefg8Ncl9hmbka8Kcefg8KaC9hmbkaaamfhaahaxfhha5amfh5a3axfg3ai6mbkcbhocehwaPhLinawaoaLydbarc;alfaocdtfydb6EhoaLclfhLawcefgXhwaCaX9hmbkaraAcd4fa8FcdVaoaocdSE86bbaAclfgAal6mbkkabaefh8Kabcefhoalcd4gecbaDEhkadcefhOarc;abfceVhHcbhmdndninaiam9nmearc;qofcbcjdz:wjjjb8Aa8Kao9Rak6mdadamal2gwfhxcbh8JaOawfhzaocbakz:wjjjbghakfh5aqaiam9Ramaqfai6Egscsfgocl4cifcd4hCaoc9WGg8LThPindndndndndndndndndndnaDTmbara8Jcd4fRbbgLciGPlbedlbkasTmdaxa8Jfhoarc;abfa8JfRbbhLarc;qofhwashXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLaXcufgXmbxikkasTmia8JcitcwGhEarc;abfa8JceVfRbbcwtarc;abfa8Jc9:GgofRbbVhLaxaofhoarc;qofhwashXinawao8Vbbg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbawcefhwaoalfhoa8AhLaXcufgXmbxdkkaHa8Jc98GgEfhoazaEfh8Aarc;abfaEfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkasTmbaLcl4hYa8JcitcKGh3axaEfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aY93a3486bba8Aalfh8AaEalfhEaLhXaKcefgKas9hmbkkaDmbcbhoxlka8LTmbcbhodninarc;qofaofgwcwf8Pibaw8Pib:e9qTmeaoczfgoa8L9pmdxbkkdnavmbcehoxikcbhEaChKaChYinarc;qofaEfgocwf8Pibhyao8Pibh8PcdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egoa8Aaoa8A6Egoczaocz6EaYfhYaocucbaya8P:e9cb9sEgwaoaw6EaKfhKaEczfgEa8L9pmdxbkkaha8Jcd4fgoaoRbbcda8JcetcoGtV86bbxikdnaKas6mbaYas6mbaha8Jcd4fgoaoRbbcia8JcetcoGtV86bba8Ka59Ras6mra5arc;qofasz:vjjjbasfh5xikaKaY9phokaha8Jcd4fgwawRbbaoa8JcetcoGtV86bbka8Ka59RaC6mla5cbaCz:wjjjbgAaCfhYdndna8LmbaPhoxekdna8KaY9RcK9pmbaPhoxekaocdtc:q1jjbfcj1jjbaDEg5ydxggcetc;:FFFeGh8Fcuh3cuagtcu7cFeGhacbh8Marc;qofhLinarc;qofa8MfhQczhEdndndnagPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhExekcbhoa8FhEinaEaaaLaofRbb9nfhEaocefgocz9hmbkkcih8Ecbh8Ainczhwdndndna5a8AcdtfydbgKPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhwxekaKcetc;:FFFeGhwcuaKtcu7cFeGhXcbhoinawaXaLaofRbb9nfhwaocefgocz9hmbkkdndnawaE6mbaKa39hmeawaE9hmea5a8EcdtfydbcwSmeka8Ah8EawhEka8Acefg8Aci9hmbkaAa8Mco4fgoaoRbba8Ea8Mci4coGtV86bbdndndna5a8Ecdtfydbg3PDdbbbbbbbebkdncwa39Tg8ETmbcua3tcu7hwdndna3ceSmbcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXa3tVhXaocefhoa8Acufg8AmbkaYaX86bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbxdkkcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXcetVhXaocefhoa8Acufg8AmbkaYaX:T9cFe:d9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:9ca188bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbkkcbhoinaYaLaofRbbgX86bbaYaXawcFeG9pfhYaocefgocz9hmbxikkdna3ceSmbinaYcb86bbaYcefhYxbkkinaYcb86bbaYcefhYxbkkaYaQ8Pbb83bbaYcwfaQcwf8Pbb83bbaYczfhYka8Mczfg8Ma8L9pgomeaLczfhLa8KaY9RcK9pmbkkaoTmlaYh5aYTmlka8Jcefg8Jal9hmbkarc;abfaxascufal2falz:vjjjb8Aasamfhma5hoa5mbkcbhwxdkdna8Kao9RakalfgwcKcaaDEgLawaL0EgX9pmbcbhwxdkdnawaL9pmbaocbaXaw9Rgwz:wjjjbawfhokaoarc;adfalz:vjjjbalfhodnaDTmbaoaraez:vjjjbaefhokaoab9Rhwxekcbhwkarc;qwf8Kjjjjbawk5babaeadaialcdcbyd;C:kjjbz:bjjjbk9reduaecd4gdaefgicaaica0Eabcj;abae9Uc;WFbGcjdaeca0Egifcufai9Uae2aiadfaicl4cifcd4f2fcefkmbcbabBd;C:kjjbk:Ese5u8Jjjjjbc;ae9Rgl8Kjjjjbcbhvdnaici9UgocHfae0mbabcbyd;m:kjjbgrc;GeV86bbalc;abfcFecjez:wjjjb8AalcUfgw9cu83ibalc8WfgD9cu83ibalcyfgq9cu83ibalcafgk9cu83ibalcKfgx9cu83ibalczfgm9cu83ibal9cu83iwal9cu83ibabaefc9WfhPabcefgsaofhednaiTmbcmcsarcb9kgzEhHcbhOcbhAcbhCcbhXcbhQindnaeaP9nmbcbhvxikaQcufhvadaCcdtfgLydbhKaLcwfydbhYaLclfydbh8AcbhEdndndninalc;abfavcsGcitfgoydlh3dndndnaoydbgoaK9hmba3a8ASmekdnaoa8A9hmba3aY9hmbaEcefhExekaoaY9hmea3aK9hmeaEcdfhEkaEc870mdaXcufhvaLaEciGcx2goc;i1jjbfydbcdtfydbh3aLaoc;e1jjbfydbcdtfydbh8AaLaoc;a1jjbfydbcdtfydbhKcbhodnindnalavcsGcdtfydba39hmbaohYxdkcuhYavcufhvaocefgocz9hmbkkaOa3aOSgvaYce9iaYaH9oVgoGfhOdndndncbcsavEaYaoEgvcs9hmbarce9imba3a3aAa3cefaASgvEgAcefSmecmcsavEhvkasavaEcdtc;WeGV86bbavcs9hmea3aA9Rgvcetavc8F917hvinaeavcFb0crtavcFbGV86bbaecefheavcje6hoavcr4hvaoTmbka3hAxvkcPhvasaEcdtcPV86bba3hAkavTmiavaH9omicdhocehEaQhYxlkavcufhvaEclfgEc;ab9hmbkkdnaLceaYaOSceta8AaOSEcx2gvc;a1jjbfydbcdtfydbgKTaLavc;e1jjbfydbcdtfydbg8AceSGaLavc;i1jjbfydbcdtfydbg3cdSGaOcb9hGazGg5ce9hmbaw9cu83ibaD9cu83ibaq9cu83ibak9cu83ibax9cu83ibam9cu83ibal9cu83iwal9cu83ibcbhOkcbhEaXcufgvhodnindnalaocsGcdtfydba8A9hmbaEhYxdkcuhYaocufhoaEcefgEcz9hmbkkcbhodnindnalavcsGcdtfydba39hmbaohExdkcuhEavcufhvaocefgocz9hmbkkaOaKaOSg8EfhLdndnaYcm0mbaYcefhYxekcbcsa8AaLSgvEhYaLavfhLkdndnaEcm0mbaEcefhExekcbcsa3aLSgvEhEaLavfhLkc9:cua8EEh8FcbhvaEaYcltVgacFeGhodndndninavc:W1jjbfRbbaoSmeavcefgvcz9hmbxdkka5aKaO9havcm0VVmbasavc;WeV86bbxekasa8F86bbaeaa86bbaecefhekdna8EmbaKaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombkaKhAkdnaYcs9hmba8AaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka8AhAkdnaEcs9hmba3aA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka3hAkalaXcdtfaKBdbaXcefcsGhvdndnaYPzbeeeeeeeeeeeeeebekalavcdtfa8ABdbaXcdfcsGhvkdndnaEPzbeeeeeeeeeeeeeebekalavcdtfa3BdbavcefcsGhvkcihoalc;abfaQcitfgEaKBdlaEa8ABdbaQcefcsGhYcdhEavhXaLhOxekcdhoalaXcdtfa3BdbcehEaXcefcsGhXaQhYkalc;abfaYcitfgva8ABdlava3Bdbalc;abfaQaEfcsGcitfgva3BdlavaKBdbascefhsaQaofcsGhQaCcifgCai6mbkkdnaeaP9nmbcbhvxekcbhvinaeavfavc:W1jjbfRbb86bbavcefgvcz9hmbkaeab9Ravfhvkalc;aef8KjjjjbavkZeeucbhddninadcefgdc8F0meceadtae6mbkkadcrfcFeGcr9Uci2cdfabci9U2cHfkmbcbabBd;m:kjjbk:Adewu8Jjjjjbcz9Rhlcbhvdnaicvfae0mbcbhvabcbRb;m:kjjbc;qeV86bbal9cb83iwabcefhoabaefc98fhrdnaiTmbcbhwcbhDindnaoar6mbcbskadaDcdtfydbgqalcwfawaqav9Rgvavc8F91gv7av9Rc507gwcdtfgkydb9Rgvc8E91c9:Gavcdt7awVhvinaoavcFb0gecrtavcFbGV86bbavcr4hvaocefhoaembkakaqBdbaqhvaDcefgDai9hmbkkdnaoar9nmbcbskaocbBbbaoab9RclfhvkavkBeeucbhddninadcefgdc8F0meceadtae6mbkkadcwfcFeGcr9Uab2cvfk:bvli99dui99ludnaeTmbcuadcetcuftcu7:Zhvdndncuaicuftcu7:ZgoJbbbZMgr:lJbbb9p9DTmbar:Ohwxekcjjjj94hwkcbhicbhDinalclfIdbgrJbbbbJbbjZalIdbgq:lar:lMalcwfIdbgk:lMgr:varJbbbb9BEgrNhxaqarNhrdndnakJbbbb9GTmbaxhqxekJbbjZar:l:tgqaq:maxJbbbb9GEhqJbbjZax:l:tgxax:marJbbbb9GEhrkdndnalcxfIdbgxJbbj:;axJbbj:;9GEgkJbbjZakJbbjZ9FEavNJbbbZJbbb:;axJbbbb9GEMgx:lJbbb9p9DTmbax:Ohmxekcjjjj94hmkdndnaqJbbj:;aqJbbj:;9GEgxJbbjZaxJbbjZ9FEaoNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:OhPxekcjjjj94hPkdndnarJbbj:;arJbbj:;9GEgqJbbjZaqJbbjZ9FEaoNJbbbZJbbb:;arJbbbb9GEMgr:lJbbb9p9DTmbar:Ohsxekcjjjj94hskdndnadcl9hmbabaifgzas86bbazcifam86bbazcdfaw86bbazcefaP86bbxekabaDfgzas87ebazcofam87ebazclfaw87ebazcdfaP87ebkalczfhlaiclfhiaDcwfhDaecufgembkkk;hlld99eud99eudnaeTmbdndncuaicuftcu7:ZgvJbbbZMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikaic;8FiGhrinabcofcicdalclfIdb:lalIdb:l9EgialcwfIdb:lalaicdtfIdb:l9EEgialcxfIdb:lalaicdtfIdb:l9EEgiarV87ebdndnJbbj:;JbbjZalaicdtfIdbJbbbb9DEgoalaicd7cdtfIdbJ;Zl:1ZNNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabcdfaq87ebdndnalaicefciGcdtfIdbJ;Zl:1ZNaoNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabaq87ebdndnaoalaicufciGcdtfIdbJ;Zl:1ZNNgoJbbj:;aoJbbj:;9GEgwJbbjZawJbbjZ9FEavNJbbbZJbbb:;aoJbbbb9GEMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikabclfai87ebabcwfhbalczfhlaecufgembkkk;3viDue99eu8Jjjjjbcjd9Rgo8Kjjjjbadcd4hrdndndndnavcd9hmbadcl6meaohwarhDinawc:CuBdbawclfhwaDcufgDmbkaeTmiadcl6mdarcdthqalhkcbhxinaohwakhDarhminawawydbgPcbaDIdbgs:8cL4cFeGc:cufasJbbbb9BEgzaPaz9kEBdbaDclfhDawclfhwamcufgmmbkakaqfhkaxcefgxaeSmixbkkaeTmdxekaeTmekarcdthkavce9hhqadcl6hdcbhxindndndnaqmbadmdc:CuhDalhwarhminaDcbawIdbgs:8cL4cFeGc:cufasJbbbb9BEgPaDaP9kEhDawclfhwamcufgmmbxdkkc:CuhDdndnavPleddbdkadmdaohwalhmarhPinawcbamIdbgs:8cL4cFeGgzc;:bazc;:b0Ec:cufasJbbbb9BEBdbamclfhmawclfhwaPcufgPmbxdkkadmecbhwarhminaoawfcbalawfIdbgs:8cL4cFeGgPc8AaPc8A0Ec:cufasJbbbb9BEBdbawclfhwamcufgmmbkkadmbcbhwarhPinaDhmdnavceSmbaoawfydbhmkdndnalawfIdbgscjjj;8iamai9RcefgmcLt9R::NJbbbZJbbb:;asJbbbb9GEMgs:lJbbb9p9DTmbas:Ohzxekcjjjj94hzkabawfazcFFFrGamcKtVBdbawclfhwaPcufgPmbkkabakfhbalakfhlaxcefgxae9hmbkkaocjdf8Kjjjjbk;YqdXui998Jjjjjbc:qd9Rgv8Kjjjjbavc:Sefcbc;Kbz:wjjjb8AcbhodnadTmbcbhoaiTmbdndnabaeSmbaehrxekavcuadcdtgwadcFFFFi0Ecbyd;u:kjjbHjjjjbbgrBd:SeavceBd:mdaraeawz:vjjjb8Akavc:GefcwfcbBdbav9cb83i:Geavc:Gefaradaiavc:Sefz:ojjjbavyd:GehDadci9Ugqcbyd;u:kjjbHjjjjbbheavc:Sefavyd:mdgkcdtfaeBdbavakcefgwBd:mdaecbaqz:wjjjbhxavc:SefawcdtfcuaicdtaicFFFFi0Ecbyd;u:kjjbHjjjjbbgmBdbavakcdfgPBd:mdalc;ebfhsaDheamhwinawalIdbasaeydbgzcwazcw6EcdtfIdbMUdbaeclfheawclfhwaicufgimbkavc:SefaPcdtfcuaqcdtadcFFFF970Ecbyd;u:kjjbHjjjjbbgPBdbdnadci6mbarheaPhwaqhiinawamaeydbcdtfIdbamaeclfydbcdtfIdbMamaecwfydbcdtfIdbMUdbaecxfheawclfhwaicufgimbkkakcifhoalc;ebfhHavc;qbfhOavheavyd:KehAavyd:OehCcbhzcbhwcbhXcehQinaehLcihkarawci2gKcdtfgeydbhsaeclfydbhdabaXcx2fgicwfaecwfydbgYBdbaiclfadBdbaiasBdbaxawfce86bbaOaYBdwaOadBdlaOasBdbaPawcdtfcbBdbdnazTmbcihkaLhiinaOakcdtfaiydbgeBdbakaeaY9haeas9haead9hGGfhkaiclfhiazcufgzmbkkaXcefhXcbhzinaCaAarazaKfcdtfydbcdtgifydbcdtfgYheaDaifgdydbgshidnasTmbdninaeydbawSmeaeclfheaicufgiTmdxbkkaeaYascdtfc98fydbBdbadadydbcufBdbkazcefgzci9hmbkdndnakTmbcuhwJbbbbh8Acbhdavyd:KehYavyd:OehKindndnaDaOadcdtfydbcdtgzfydbgembadcefhdxekadcs0hiamazfgsIdbhEasalcbadcefgdaiEcdtfIdbaHaecwaecw6EcdtfIdbMg3Udba3aE:th3aecdthiaKaYazfydbcdtfheinaPaeydbgzcdtfgsa3asIdbMgEUdbaEa8Aa8AaE9DgsEh8AazawasEhwaeclfheaic98fgimbkkadak9hmbkawcu9hmekaQaq9pmdindnaxaQfRbbmbaQhwxdkaqaQcefgQ9hmbxikkakczakcz6EhzaOheaLhOawcu9hmbkkaocdtavc:Seffc98fhedninaoTmeaeydbcbyd;q:kjjbH:bjjjbbaec98fheaocufhoxbkkavc:qdf8Kjjjjbk;IlevucuaicdtgvaicFFFFi0Egocbyd;u:kjjbHjjjjbbhralalyd9GgwcdtfarBdbalawcefBd9GabarBdbaocbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdlcuadcdtadcFFFFi0Ecbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdwabydbcbavz:wjjjb8Aadci9UhDdnadTmbabydbhoaehladhrinaoalydbcdtfgvavydbcefBdbalclfhlarcufgrmbkkdnaiTmbabydbhlabydlhrcbhvaihoinaravBdbarclfhralydbavfhvalclfhlaocufgombkkdnadci6mbabydlhrabydwhvcbhlinaecwfydbhoaeclfydbhdaraeydbcdtfgwawydbgwcefBdbavawcdtfalBdbaradcdtfgdadydbgdcefBdbavadcdtfalBdbaraocdtfgoaoydbgocefBdbavaocdtfalBdbaecxfheaDalcefgl9hmbkkdnaiTmbabydlheabydbhlinaeaeydbalydb9RBdbalclfhlaeclfheaicufgimbkkkQbabaeadaic;K1jjbz:njjjbkQbabaeadaic;m:jjjbz:njjjbk9DeeuabcFeaicdtz:wjjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk:Vvioud9:du8Jjjjjbc;Wa9Rgl8Kjjjjbcbhvalcxfcbc;Kbz:wjjjb8AalcuadcitgoadcFFFFe0Ecbyd;u:kjjbHjjjjbbgrBdxalceBd2araeadaicez:tjjjbalcuaoadcjjjjoGEcbyd;u:kjjbHjjjjbbgwBdzadcdthednadTmbabhiinaiavBdbaiclfhiadavcefgv9hmbkkawaefhDalabBdwalawBdl9cbhqindnadTmbaq9cq9:hkarhvaDhiadheinaiav8Pibak1:NcFrG87ebavcwfhvaicdfhiaecufgembkkalclfaq:NceGcdtfydbhxalclfaq9ce98gq:NceGcdtfydbhmalc;Wbfcbcjaz:wjjjb8AaDhvadhidnadTmbinalc;Wbfav8VebcdtfgeaeydbcefBdbavcdfhvaicufgimbkkcbhvcbhiinalc;WbfavfgeydbhoaeaiBdbaoaifhiavclfgvcja9hmbkadhvdndnadTmbinalc;WbfaDamydbgicetf8VebcdtfgeaeydbgecefBdbaxaecdtfaiBdbamclfhmavcufgvmbkaq9cv9smdcbhvinabawydbcdtfavBdbawclfhwadavcefgv9hmbxdkkaq9cv9smekkclhvdninavc98Smealcxfavfydbcbyd;q:kjjbH:bjjjbbavc98fhvxbkkalc;Waf8Kjjjjbk:Jwliuo99iud9:cbhv8Jjjjjbca9Rgoczfcwfcbyd:8:kjjbBdbaocb8Pd:0:kjjb83izaocwfcbyd;i:kjjbBdbaocb8Pd;a:kjjb83ibaicd4hrdndnadmbJFFuFhwJFFuuhDJFFuuhqJFFuFhkJFFuuhxJFFuFhmxekarcdthPaehsincbhiinaoczfaifgzasaifIdbgwazIdbgDaDaw9EEUdbaoaifgzawazIdbgDaDaw9DEUdbaiclfgicx9hmbkasaPfhsavcefgvad9hmbkaoIdKhDaoIdwhwaoIdChqaoIdlhkaoIdzhxaoIdbhmkdnadTmbJbbbbJbFu9hJbbbbamax:tgmamJbbbb9DEgmakaq:tgkakam9DEgkawaD:tgwawak9DEgw:vawJbbbb9BEhwdnalmbarcdthoindndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:S9cC:ghHdndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikaHai:S:ehHdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaHai:T9cy:g:e83ibaeaofheabcwfhbadcufgdmbxdkkarcdthoindndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cv9:9c;j:KM;j:KM;j:Kd:dhOdndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cq9:9cM;j:KM;j:KM;jl:daO:ehOdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaOai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cC9:9c:KM;j:KM;j:KMD:d:e83ibaeaofheabcwfhbadcufgdmbkkk9teiucbcbyd;y:kjjbgeabcifc98GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;y:kjjbgeabcrfc94GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;y:kjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;y:kjjbfgdBd;y:kjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk;Qddbcjwk;mdbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbbbbbbbbbbbbb4:h9w9N94:P:gW:j9O:ye9Pbbbbbbebbbdbbbebbbdbbbbbbbdbbbbbbbebbbbbbb:l29hZ;69:9kZ;N;76Z;rg97Z;z;o9xZ8J;B85Z;:;u9yZ;b;k9HZ:2;Z9DZ9e:l9mZ59A8KZ:r;T3Z:A:zYZ79OHZ;j4::8::Y:D9V8:bbbb9s:49:Z8R:hBZ9M9M;M8:L;z;o8:;8:PG89q;x:J878R:hQ8::M:B;e87bbbbbbjZbbjZbbjZ:E;V;N8::Y:DsZ9i;H;68:xd;R8:;h0838:;W:NoZbbbb:WV9O8:uf888:9i;H;68:9c9G;L89;n;m9m89;D8Ko8:bbbbf:8tZ9m836ZS:2AZL;zPZZ818EZ9e:lxZ;U98F8:819E;68:FFuuFFuuFFuuFFuFFFuFFFuFbc;mqkzebbbebbbdbbb9G:vbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(n(t),{}).then(function(p){a=p.instance,a.exports.__wasm_call_ctors(),a.exports.meshopt_encodeVertexVersion(0),a.exports.meshopt_encodeIndexVersion(1)});function n(p){for(var u=new Uint8Array(p.length),l=0;l<p.length;++l){var y=p.charCodeAt(l);u[l]=y>96?y-97:y>64?y-39:y+4}for(var h=0,l=0;l<p.length;++l)u[h++]=u[l]<60?e[u[l]]:(u[l]-60)*64+u[++l];return u.buffer.slice(0,h)}function r(p){if(!p)throw new Error("Assertion failed")}function i(p){return new Uint8Array(p.buffer,p.byteOffset,p.byteLength)}function o(p,u,l,y){var h=a.exports.sbrk,g=h(u.length*4),x=h(l*4),v=new Uint8Array(a.exports.memory.buffer),T=i(u);v.set(T,g),y&&y(g,g,u.length,l);var I=p(x,g,u.length,l);v=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(l);new Uint8Array(S.buffer).set(v.subarray(x,x+l*4)),T.set(v.subarray(g,g+u.length*4)),h(g-h(0));for(var R=0;R<u.length;++R)u[R]=S[u[R]];return[S,I]}function c(p,u,l,y){var h=a.exports.sbrk,g=h(l*4),x=h(l*y),v=new Uint8Array(a.exports.memory.buffer);v.set(i(u),x),p(g,x,l,y),v=new Uint8Array(a.exports.memory.buffer);var T=new Uint32Array(l);return new Uint8Array(T.buffer).set(v.subarray(g,g+l*4)),h(g-h(0)),T}function d(p,u,l,y,h){var g=a.exports.sbrk,x=g(u),v=g(y*h),T=new Uint8Array(a.exports.memory.buffer);T.set(i(l),v);var I=p(x,u,v,y,h),S=new Uint8Array(I);return S.set(T.subarray(x,x+I)),g(x-g(0)),S}function b(p){for(var u=0,l=0;l<p.length;++l){var y=p[l];u=u<y?y:u}return u}function f(p,u){if(r(u==2||u==4),u==4)return new Uint32Array(p.buffer,p.byteOffset,p.byteLength/4);var l=new Uint16Array(p.buffer,p.byteOffset,p.byteLength/2);return new Uint32Array(l)}function m(p,u,l,y,h,g,x){var v=a.exports.sbrk,T=v(l*y),I=v(l*g),S=new Uint8Array(a.exports.memory.buffer);S.set(i(u),I),p(T,l,y,h,I,x);var R=new Uint8Array(l*y);return R.set(S.subarray(T,T+l*y)),v(T-v(0)),R}return{ready:s,supported:!0,reorderMesh:function(p,u,l){var y=u?l?a.exports.meshopt_optimizeVertexCacheStrip:a.exports.meshopt_optimizeVertexCache:void 0;return o(a.exports.meshopt_optimizeVertexFetchRemap,p,b(p)+1,y)},reorderPoints:function(p,u){return r(p instanceof Float32Array),r(p.length%u==0),r(u>=3),c(a.exports.meshopt_spatialSortRemap,p,p.length/u,u*4)},encodeVertexBuffer:function(p,u,l){r(l>0&&l<=256),r(l%4==0);var y=a.exports.meshopt_encodeVertexBufferBound(u,l);return d(a.exports.meshopt_encodeVertexBuffer,y,p,u,l)},encodeIndexBuffer:function(p,u,l){r(l==2||l==4),r(u%3==0);var y=f(p,l),h=a.exports.meshopt_encodeIndexBufferBound(u,b(y)+1);return d(a.exports.meshopt_encodeIndexBuffer,h,y,u,4)},encodeIndexSequence:function(p,u,l){r(l==2||l==4);var y=f(p,l),h=a.exports.meshopt_encodeIndexSequenceBound(u,b(y)+1);return d(a.exports.meshopt_encodeIndexSequence,h,y,u,4)},encodeGltfBuffer:function(p,u,l,y){var h={ATTRIBUTES:this.encodeVertexBuffer,TRIANGLES:this.encodeIndexBuffer,INDICES:this.encodeIndexSequence};return r(h[y]),h[y](p,u,l)},encodeFilterOct:function(p,u,l,y){return r(l==4||l==8),r(y>=1&&y<=16),m(a.exports.meshopt_encodeFilterOct,p,u,l,y,16)},encodeFilterQuat:function(p,u,l,y){return r(l==8),r(y>=4&&y<=16),m(a.exports.meshopt_encodeFilterQuat,p,u,l,y,16)},encodeFilterExp:function(p,u,l,y,h){r(l>0&&l%4==0),r(y>=1&&y<=24);var g={Separate:0,SharedVector:1,SharedComponent:2,Clamped:3};return m(a.exports.meshopt_encodeFilterExp,p,u,l,y,l,h?g[h]:1)}}})();var Zn=(function(){var t="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:W:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:S86qdbk;jYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz1jjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbhodnawTmbaxa8Acd4fRbbhokaocFeGh5cbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz1jjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:jjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q1jjbfcj1jjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bbarcwf9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfag9c8F1:NghcKtc8F91aicdfa8J9c8N1:Nfg8KRbbG86bbarcVfcba8KahcjeGcr4fghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fag9c8F1:NgicKtc8F91aha8J9c8N1:NfghRbbG86bbarc96fcbahaicjeGcr4fgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbb83bbarcwfaicwf8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbcbaocl49Rh8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E93aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z1jjjb8AazazcjdfaAcufad2fadz1jjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:XseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbyd:K1jjbgeabcifc98GfgbBd:K1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk81dbcjwk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:Kwkl8WNbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;G9Mqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:183lYud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxavaialfgmar9Rgoad;8qbbcj;abad9Uc;WFbGcjdadca0EhPdndndnadTmbaoadfhscbhzinaeaz9nmdamax9RaD6miabazad2fhHaxaDfhOaPaeaz9RazaPfae6EgAcsfgocl4cifcd4hCavcj;cbfaoc9WGgXcetfhQavcj;cbfaXci2fhLavcj;cbfaXfhKcbhYaoc;ab6h8AincbhodnawTmbaxaYcd4fRbbhokaocFeGhEcbh3avcj;cbfh5indndndndnaEa3cet4ciGgoc9:fPdebdkamaO9RaX6mwavcj;cbfa3aX2faOaX;8qbbaOaAfhOxdkavcj;cbfa3aX2fcbaX;8kbxekamaO9RaC6moaoclVcbawEhraOaCfhocbhidna8Ambamao9Rc;Gb6mbcbhlina5alfhidndndndndndnaOalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiczfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaicafaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaoclffaqc:q:yjjbfRbbfhoxikaic8Wfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaocwffaqc:q:yjjbfRbbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitc:q1jjbfpbibaic:q:yjjbfRbbgipsaoRbegqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqc:q:yjjbfRbbfhokalc;abfhialcjefaX0meaihlamao9Rc;Fb0mbkkdnaiaX9pmbaici4hlinamao9RcK6mwa5aifhqdndndndndndnaOaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaoclffahc:q:yjjbfRbbfhoxikaqaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaocwffahc:q:yjjbfRbbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpkbbaaaocdffahc:q:yjjbfRbbfhokalcdfhlaiczfgiaX6mbkkaohOaoTmoka5aXfh5a3cefg3cl9hmbkdndndndnawTmbasaYcd4fRbbglciGPlbedwbkaXTmdavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep9Ta8Epxeeeeeeeeeeeeeeeeg8Fp9op9Hp9rg8Eagp9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Ug8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9AbbbaladfhlaoczfgoaX6mbxikkaXTmeavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep:nea8Epxebebebebebebebebg8Fp9op:bep9rg8Eagp:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeg8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9AbbbaladfhlaoczfgoaX6mbxdkkaXTmbcbhocbalcl4gl9Rc8FGhiavcjdfaYfhravaYfpbdbh8Finaravcj;cbfaofpblbggaKaofpblbg8JpmbzeHdOiAlCvXoQrLg8KaQaofpblbg8LaLaofpblbg8MpmbzeHdOiAlCvXoQrLg8NpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ea8Fp9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Fa8Ka8NpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwKDYq8AkEx3m5P8Es8Fgga8La8MpmwKDYq8AkEx3m5P8Es8Fg8JpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9AbbbaradfhraoczfgoaX6mbkkaYclfgYad6mbkaHavcjdfaAad2;8qbbavavcjdfaAcufad2fad;8qbbaAazfhzc9:hoaOhxaOmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdaPaeao9RaoaPfae6Eaofgoae6mbkaial9Rhxkcbc99amax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbk:TseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:SPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiczfpxbbbbbbbbbbbbbbbbgopklbaiaopklbaiabalcitfgdaeciGglcitgv;8qbbdnalTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkadaiav;8qbbkk:oDllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiczfpxbbbbbbbbbbbbbbbbgkpklbaiakpklbaiabalcitfgoaeciGgvcitgw;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkaoaiaw;8qbbkk;uddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaic8WfpxbbbbbbbbbbbbbbbbgopklbaicafaopklbaiczfaopklbaiaopklbaiabavcdtfgdalciGgecdtgv;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkadaiav;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb",a=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),s=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var n=WebAssembly.validate(a)?o(e):o(t),r,i=WebAssembly.instantiate(n,{}).then(function(h){r=h.instance,r.exports.__wasm_call_ctors()});function o(h){for(var g=new Uint8Array(h.length),x=0;x<h.length;++x){var v=h.charCodeAt(x);g[x]=v>96?v-97:v>64?v-39:v+4}for(var T=0,x=0;x<h.length;++x)g[T++]=g[x]<60?s[g[x]]:(g[x]-60)*64+g[++x];return g.buffer.slice(0,T)}function c(h,g,x,v,T,I,S){var R=h.exports.sbrk,_=v+3&-4,A=R(_*T),j=R(I.length),L=new Uint8Array(h.exports.memory.buffer);L.set(I,j);var F=g(A,v,T,j,I.length);if(F==0&&S&&S(A,_,T),x.set(L.subarray(A,A+v*T)),R(A-R(0)),F!=0)throw new Error("Malformed buffer data: "+F)}var d={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},b={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},f=[],m=0;function p(h){var g={object:new Worker(h),pending:0,requests:{}};return g.object.onmessage=function(x){var v=x.data;g.pending-=v.count,g.requests[v.id][v.action](v.value),delete g.requests[v.id]},g}function u(h){for(var g="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(n)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+y.name+";"+c.toString()+y.toString(),x=new Blob([g],{type:"text/javascript"}),v=URL.createObjectURL(x),T=f.length;T<h;++T)f[T]=p(v);for(var T=h;T<f.length;++T)f[T].object.postMessage({});f.length=h,URL.revokeObjectURL(v)}function l(h,g,x,v,T){for(var I=f[0],S=1;S<f.length;++S)f[S].pending<I.pending&&(I=f[S]);return new Promise(function(R,_){var A=new Uint8Array(x),j=++m;I.pending+=h,I.requests[j]={resolve:R,reject:_},I.object.postMessage({id:j,count:h,size:g,source:A,mode:v,filter:T},[A.buffer])})}function y(h){var g=h.data;if(!g.id)return self.close();self.ready.then(function(x){try{var v=new Uint8Array(g.count*g.size);c(x,x.exports[g.mode],v,g.count,g.size,g.source,x.exports[g.filter]),self.postMessage({id:g.id,count:g.count,action:"resolve",value:v},[v.buffer])}catch(T){self.postMessage({id:g.id,count:g.count,action:"reject",value:T})}})}return{ready:i,supported:!0,useWorkers:function(h){u(h)},decodeVertexBuffer:function(h,g,x,v,T){c(r,r.exports.meshopt_decodeVertexBuffer,h,g,x,v,r.exports[d[T]])},decodeIndexBuffer:function(h,g,x,v){c(r,r.exports.meshopt_decodeIndexBuffer,h,g,x,v)},decodeIndexSequence:function(h,g,x,v){c(r,r.exports.meshopt_decodeIndexSequence,h,g,x,v)},decodeGltfBuffer:function(h,g,x,v,T,I){c(r,r.exports[b[T]],h,g,x,v,r.exports[d[I]])},decodeGltfBufferAsync:function(h,g,x,v,T){return f.length>0?l(h,g,x,b[v],d[T]):i.then(function(){var I=new Uint8Array(h*g);return c(r,r.exports[b[v]],I,h,g,x,r.exports[d[T]]),I})}}})();var cw=(function(){var t="b9H79Tebbbetm9Geueu9Geub9Gbb9Gsuuuuuuuuuuuu99uueu9Gvuuuuub9Gruuuuuuub9Gvuuuuue999Gvuuuuueu9Gquuuuuuu99uueu9Gwuuuuuu99ueu9Giuuue999Gluuuueu9GiuuueuiOHdilvorlwiDqkbxxbelve9Weiiviebeoweuec:G:Pdkr:Tewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bbz9TW79O9V9Wt9F79P9T9W29P9M95br8E9TW79O9V9Wt9F79P9T9W29P9M959x9Pt9OcttV9P9I91tW7bwQ9TW79O9V9Wt9F79P9T9W29P9M959q9V9P9Ut7bDX9TW79O9V9Wt9F79P9T9W29P9M959t9J9H2Wbqa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9Wbkl79IV9RbxDwebcekdzsq;B:xeHdbkM9Hi8Au8A99Au8Jjjjjbc;W;qb9Rgs8Kjjjjbcbhzascxfcbc;Kbz:ojjjb8AdnabaeSmbabaeadcdtz:njjjb8AkdndnamcdGmbascxfhHcbhOxekasalcrfci4gecbyd:m:jjjbHjjjjbbgABdxasceBd2aAcbaez:ojjjbhCcbhlcbhednadTmbcbhlabheadhAinaCaeydbgXci4fgQaQRbbgQceaXcrGgXtV86bbaQcu7aX4ceGalfhlaeclfheaAcufgAmbkcualcdtalcFFFFi0EhekascCfhHasaecbyd:m:jjjbHjjjjbbgOBdzascdBd2alcd4alfhXcehAinaAgecethAaeaX6mbkcdhzcbhLascuaecdtgAaecFFFFi0Ecbyd:m:jjjbHjjjjbbgXBdCasciBd2aXcFeaAz:ojjjbhKdnadTmbaecufhYcbh8AindndnaKabaLcdtfgEydbgQc:v;t;h;Ev2aYGgXcdtfgCydbgAcuSmbceheinaOaAcdtfydbaQSmdaXaefhAaecefheaKaAaYGgXcdtfgCydbgAcu9hmbkkaOa8AcdtfaQBdbaCa8ABdba8AhAa8Acefh8AkaEaABdbaLcefgLad9hmbkkaKcbyd1:jjjbH:bjjjbbascdBd2kcbh3aHcualcefgecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbg5Bdbasa5BdlasazceVgeBd2ascxfaecdtfcuadcitadcFFFFe0Ecbyd:m:jjjbHjjjjbbg8EBdbasa8EBdwasazcdfgeBd2asclfabadalcbz:cjjjbascxfaecdtfcualcdtgealcFFFFi0Eg8Fcbyd:m:jjjbHjjjjbbgABdbasazcifgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgaBdbasazclVBd2aAaaaialavaOascxfz:djjjbalcbyd:m:jjjbHjjjjbbhCascxfasyd2ghcdtfaCBdbasahcefgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgXBdbasahcdfgQBd2ascxfaQcdtfa8Fcbyd:m:jjjbHjjjjbbgQBdbasahcifggBd2aXcFeaez:ojjjbh8JaQcFeaez:ojjjbh8KdnalTmba8Ecwfh8Lindna5a3gQcefg3cdtfydbgKa5aQcdtgefydbgXSmbaKaX9Rhza8EaXcitfhHa8Kaefh8Ma8JaefhEcbhYindndnaHaYcitfydbg8AaQ9hmbaEaQBdba8MaQBdbxekdna5a8Acdtg8NfgeclfydbgXaeydbgeSmba8EaecitgKfydbaQSmeaXae9Rhyaecu7aXfhLa8LaKfhXcbheinaLaeSmeaecefheaXydbhKaXcwfhXaKaQ9hmbkaeay6meka8Ka8NfgeaQa8AaeydbcuSEBdbaEa8AaQaEydbcuSEBdbkaYcefgYaz9hmbkka3al9hmbkaAhXaahQa8KhKa8JhYcbheindndnaeaXydbg8A9hmbdnaeaQydbg8A9hmbaYydbh8AdnaKydbgLcu9hmba8Acu9hmbaCaefcb86bbxikaCaefhEdnaeaLSmbaea8ASmbaEce86bbxikaEcl86bbxdkdnaeaaa8AcdtgLfydb9hmbdnaKydbgEcuSmbaeaESmbaYydbgzcuSmbaeazSmba8KaLfydbgHcuSmbaHa8ASmba8JaLfydbgLcuSmbaLa8ASmbdnaAaEcdtfydbg8AaAaLcdtfydb9hmba8AaAazcdtfydbgLSmbaLaAaHcdtfydb9hmbaCaefcd86bbxlkaCaefcl86bbxikaCaefcl86bbxdkaCaefcl86bbxekaCaefaCa8AfRbb86bbkaXclfhXaQclfhQaKclfhKaYclfhYalaecefge9hmbkdnaqTmbdndnaOTmbaOheaAhXalhQindnaqaeydbfRbbTmbaCaXydbfcl86bbkaeclfheaXclfhXaQcufgQmbxdkkaAhealhXindnaqRbbTmbaCaeydbfcl86bbkaqcefhqaeclfheaXcufgXmbkkaAhealhQaChXindnaCaeydbfRbbcl9hmbaXcl86bbkaeclfheaXcefhXaQcufgQmbkkamceGTmbaChealhXindnaeRbbce9hmbaecl86bbkaecefheaXcufgXmbkkascxfagcdtfcualcx2alc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbg3BdbasahclfgHBd2a3aialavaOz:ejjjbh8PdndnaDmbcbhgcbh8Lxekcbh8LawhecbhXindnaeIdbJbbbb9ETmbasc;Wbfa8LcdtfaXBdba8Lcefh8LkaeclfheaDaXcefgX9hmbkascxfaHcdtfcua8Lal2gecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbggBdbasahcvfgHBd2alTmba8LTmbarcd4hEdnaOTmba8Lcdthzcbh8AaghLinaoaOa8AcdtfydbaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbxdkka8Lcdthzcbh8AaghLinaoa8AaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbkkascxfaHcdtfcualc8S2gealc;D;O;f8U0EgQcbyd:m:jjjbHjjjjbbgXBdbasaHcefgKBd2aXcbaez:ojjjbhqdndndna8LTmbascxfaKcdtfaQcbyd:m:jjjbHjjjjbbgvBdbasaHcdfgXBd2avcbaez:ojjjb8AascxfaXcdtfcua8Lal2gecltgXaecFFFFb0Ecbyd:m:jjjbHjjjjbbgiBdbasaHcifBd2aicbaXz:ojjjb8AadmexdkcbhvcbhiadTmekcbhYabhXindna3aXclfydbg8Acx2fgeIdba3aXydbgLcx2fgQIdbgI:tg8Ra3aXcwfydbgEcx2fgKIdlaQIdlg8S:tgRNaKIdbaI:tg8UaeIdla8S:tg8VN:tg8Wa8WNa8VaKIdwaQIdwg8X:tg8YNaRaeIdwa8X:tg8VN:tgRaRNa8Va8UNa8Ya8RN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaLcdtfydbc8S2fgeaRa8U:rg8UaRNNg8VaeIdbMUdbaea8Ra8Ua8RNg8ZNg8YaeIdlMUdlaea8Wa8Ua8WNg80Ng81aeIdwMUdwaea8ZaRNg8ZaeIdxMUdxaea80aRNgBaeIdzMUdzaea80a8RNg80aeIdCMUdCaeaRa8Ua8Wa8XNaRaINa8Sa8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAa8Acdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaEcdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaXcxfhXaYcifgYad6mbkcbhzabhLinabazcdtfh8AcbhXinaCa8AaXc;a1jjbfydbcdtfydbgQfRbbhedndnaCaLaXfydbgKfRbbgYc99fcFeGcpe0mbaec99fcFeGc;:e6mekdnaYcufcFeGce0mba8JaKcdtfydbaQ9hmekdnaecufcFeGce0mba8KaQcdtfydbaK9hmekdnaYcv2aefc:G1jjbfRbbTmbaAaQcdtfydbaAaKcdtfydb0mekJbbacJbbacJbbjZaecFeGceSEaYceSEh80dna3a8AaXc;e1jjbfydbcdtfydbcx2fgeIdwa3aKcx2fgYIdwg8S:tg8Wa3aQcx2fgEIdwa8S:tgRaRNaEIdbaYIdbg8X:tg8Ra8RNaEIdlaYIdlg8V:tg8Ua8UNMMgINa8WaRNaeIdba8X:tg81a8RNa8UaeIdla8V:tg8ZNMMg8YaRN:tg8Wa8WNa81aINa8Ya8RN:tgRaRNa8ZaINa8Ya8UN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaKcdtfydbc8S2fgeaRa80aI:rNg8UaRNNg8YaeIdbMUdbaea8Ra8Ua8RNg80Ng81aeIdlMUdlaea8Wa8Ua8WNgINg8ZaeIdwMUdwaea80aRNg80aeIdxMUdxaeaIaRNgBaeIdzMUdzaeaIa8RNg83aeIdCMUdCaeaRa8Ua8Wa8SNaRa8XNa8Va8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaQcdtfydbc8S2fgea8YaeIdbMUdbaea81aeIdlMUdlaea8ZaeIdwMUdwaea80aeIdxMUdxaeaBaeIdzMUdzaea83aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdykaXclfgXcx9hmbkaLcxfhLazcifgzad6mbka8LTmbcbhLinJbbbbh8Xa3abaLcdtfgeclfydbgEcx2fgXIdwa3aeydbgzcx2fgQIdwg8Z:tg8Ra8RNaXIdbaQIdbgB:tg8Wa8WNaXIdlaQIdlg83:tg8Ua8UNMMg80a3aecwfydbgHcx2fgeIdwa8Z:tgINa8Ra8RaINa8WaeIdbaB:tg8SNa8UaeIdla83:tg8VNMMgRN:tJbbbbJbbjZa80aIaINa8Sa8SNa8Va8VNMMg81NaRaRN:tg8Y:va8YJbbbb9BEg8YNhUa81a8RNaIaRN:ta8YNh85a80a8VNa8UaRN:ta8YNh86a81a8UNa8VaRN:ta8YNh87a80a8SNa8WaRN:ta8YNh88a81a8WNa8SaRN:ta8YNh89a8Wa8VNa8Sa8UN:tgRaRNa8UaINa8Va8RN:tgRaRNa8Ra8SNaIa8WN:tgRaRNMM:rJbbbZNhRagaza8L2gwcdtfhXagaHa8L2g8NcdtfhQagaEa8L2g5cdtfhKa8Z:mh8:a83:mhZaB:mhncbhYa8Lh8AJbbbbh8VJbbbbh8YJbbbbh80Jbbbbh81Jbbbbh8ZJbbbbhBJbbbbh83JbbbbhcJbbbbh9cinasc;WbfaYfgecwfaRa85aKIdbaXIdbgI:tg8UNaUaQIdbaI:tg8SNMg8RNUdbaeclfaRa87a8UNa86a8SNMg8WNUdbaeaRa89a8UNa88a8SNMg8UNUdbaecxfaRa8:a8RNaZa8WNaIana8UNMMMgINUdbaRa8Ra8WNNa81Mh81aRa8Ra8UNNa8ZMh8ZaRa8Wa8UNNaBMhBaRaIaINNa8XMh8XaRa8RaINNa8VMh8VaRa8WaINNa8YMh8YaRa8UaINNa80Mh80aRa8Ra8RNNa83Mh83aRa8Wa8WNNacMhcaRa8Ua8UNNa9cMh9caXclfhXaKclfhKaQclfhQaYczfhYa8Acufg8Ambkavazc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaEc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaHc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyaiawcltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia5cltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia8Ncltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaLcifgLad6mbkkcbhQdndnamcwGgJmbJbbbbh8Vcbh9ecbhocbhhxekcbh9ea8Fcbyd:m:jjjbHjjjjbbhhascxfasyd2gecdtfahBdbasaecefgXBd2ascxfaXcdtfcuahalabadaAz:fjjjbgKcltaKcjjjjiGEcbyd:m:jjjbHjjjjbbgoBdbasaecdfBd2aoaKaha3alz:gjjjbJFFuuh8VaKTmbaoheaKhXinaeIdbgRa8Va8VaR9EEh8VaeclfheaXcufgXmbkaKh9ekasydlhTdnalTmbaTclfheaTydbhKaChXalhYcbhQincbaeydbg8AaK9RaXRbbcpeGEaQfhQaXcefhXaeclfhea8AhKaYcufgYmbkaQce4hQkcuadaQ9RcifgScx2aSc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbhDascxfasyd2g9hcdtfaDBdbasa9hcefgeBd2ascxfaecdtfcuaScdtaScFFFFi0Ecbyd:m:jjjbHjjjjbbgrBdbasa9hcdfgeBd2ascxfaecdtfa8Fcbyd:m:jjjbHjjjjbbgyBdbasa9hcifgeBd2ascxfaecdtfalcbyd:m:jjjbHjjjjbbg9iBdbasa9hclfg6Bd2axaxNa8PJbbjZamclGEgUaUN:vh9cJbbbbhcdnadak9nmbdnaSci6mba8Lclth9kaDcwfh0Jbbbbh83JbbbbhcinasclfabadalaAz:cjjjbabhzcbh8Ecbh8Finaba8FcdtfhHcbheindnaAazaefydbgQcdtgEfydbgYaAaHaec;q1jjbfydbcdtfydbgXcdtgwfydbg8ASmbaCaXfRbbgLcv2aCaQfRbbgKfc;G1jjbfRbbg5aKcv2aLfg8Nc;G1jjbfRbbg8MVcFeGTmbdna8AaY9nmba8Nc:G1jjbfRbbcFeGmekaKcufhYdnaKaL9hmbaYcFeGce0mba8JaEfydbaX9hmekdndnaKclSmbaLcl9hmekdnaYcFeGce0mba8JaEfydbaX9hmdkaLcufcFeGce0mba8KawfydbaQ9hmekaDa8Ecx2fgKaXaQa8McFeGgYEBdlaKaQaXaYEBdbaKaYa5Gcb9hBdwa8Ecefh8Ekaeclfgecx9hmbkdna8Fcifg8Fad9pmbazcxfhza8EcifaS9nmekka8ETmdcbhLinaqaAaDaLcx2fgKydbgYcdtgzfydbc8S2fgeIdwa3aKydlg8Acx2fgXIdwg8WNaeIdzaXIdbg8UNaeIdaMgRaRMMa8WNaeIdlaXIdlgINaeIdCa8WNaeId3MgRaRMMaINaeIdba8UNaeIdxaINaeIdKMgRaRMMa8UNaeId8KMMM:lhRJbbbbJbbjZaeIdyg8R:va8RJbbbb9BEh8RdndnaKydwgEmbJFFuuh8YxekJbbbbJbbjZaqaAa8Acdtfydbc8S2fgeIdyg8S:va8SJbbbb9BEaeIdwa3aYcx2fgXIdwg8SNaeIdzaXIdbg8XNaeIdaMg8Ya8YMMa8SNaeIdlaXIdlg8YNaeIdCa8SNaeId3Mg8Sa8SMMa8YNaeIdba8XNaeIdxa8YNaeIdKMg8Sa8SMMa8XNaeId8KMMM:lNh8Yka8RaRNh80dna8LTmbavaYc8S2fgQIdwa8WNaQIdza8UNaQIdaMgRaRMMa8WNaQIdlaINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRaga8Aa8L2gHcdtfhXaiaYa8L2gwcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekava8Ac8S2fgQIdwa3aYcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8RagawcdtfhXaiaHcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YaCaYfRbbcd9hmbdna8Ka8Ja8Jazfydba8ASEaaazfydbgHcdtfydbgzcu9hmbaaa8AcdtfydbhzkavaHc8S2fgQIdwa3azcx2fgeIdwg8WNaQIdzaeIdbg8UNaQIdaMgRaRMMa8WNaQIdlaeIdlgINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRagaza8L2gwcdtfhXaiaHa8L2g8NcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekavazc8S2fgQIdwa3aHcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8Raga8NcdtfhXaiawcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YkaKa80a8Ya80a8Y9FgeEUdwaKa8AaYaeaETVgeEBdlaKaYa8AaeEBdbaLcefgLa8E9hmbkasc;Wbfcbcj;qbz:ojjjb8Aa0hea8EhXinasc;WbfaeydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbcefBdbaecxfheaXcufgXmbkcbhecbhXinasc;WbfaefgQydbhKaQaXBdbaKaXfhXaeclfgecj;qb9hmbkcbhea0hXinasc;WbfaXydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbgQcefBdbaraQcdtfaeBdbaXcxfhXa8Eaecefge9hmbkadak9RgQci9Uh9mdnalTmbcbheayhXinaXaeBdbaXclfhXalaecefge9hmbkkcbh9na9icbalz:ojjjbh8FaQcO9Uh9oa9mce4h9pasydwh9qcbh8Mcbh5dninaDara5cdtfydbcx2fg8NIdwgRa9c9Emea8Ma9m9pmeJFFuuh8Rdna9pa8E9pmbaDara9pcdtfydbcx2fIdwJbb;aZNh8RkdnaRa8R9ETmbaRac9ETmba8Ma9o0mdkdna8FaAa8NydlgHcdtg9rfydbgKfg9sRbba8FaAa8Nydbgzcdtg9tfydbgefg9uRbbVmbaCazfRbbh9vdnaTaecdtfgXclfydbgQaXydbgXSmbaQaX9RhYa3aKcx2fhLa3aecx2fhEa9qaXcitfhecbhXcehwdnindnayaeydbcdtfydbgQaKSmbayaeclfydbcdtfydbg8AaKSmbaQa8ASmba3a8Acx2fg8AIdba3aQcx2fgQIdbg8W:tgRaEIdlaQIdlg8U:tg8XNaEIdba8W:tg8Ya8AIdla8U:tg8RN:tgIaRaLIdla8U:tg80NaLIdba8W:tg81a8RN:tg8UNa8RaEIdwaQIdwg8S:tg8ZNa8Xa8AIdwa8S:tg8WN:tg8Xa8RaLIdwa8S:tgBNa80a8WN:tg8RNa8Wa8YNa8ZaRN:tg8Sa8Wa81NaBaRN:tgRNMMaIaINa8Xa8XNa8Sa8SNMMa8Ua8UNa8Ra8RNaRaRNMMN:rJbbj8:N9FmdkaecwfheaXcefgXaY6hwaYaX9hmbkkawceGTmba9pcefh9pxekdndndndna9vc9:fPdebdkazheinayaecdtgefaHBdbaaaefydbgeaz9hmbxikkdna8Ka8Ja8Ja9tfydbaHSEaaa9tfydbgzcdtfydbgecu9hmbaaa9rfydbhekaya9tfaHBdbaehHkayazcdtfaHBdbka9uce86bba9sce86bba8NIdwgRacacaR9DEhca9ncefh9ncecda9vceSEa8Mfh8Mka5cefg5a8E9hmbkka9nTmddnalTmbcbh8AcbhEindnayaEcdtgefydbgQaESmbaAaQcdtfydbhzdnaEaAaefydb9hgHmbaqazc8S2fgeaqaEc8S2fgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdyka8LTmbavaQc8S2fgeavaEc8S2gwfgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdya9kaQ2hLaihXa8LhKinaXaLfgeaXa8AfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaHmbJbbbbJbbjZaqawfgeIdygR:vaRJbbbb9BEaeIdwa3azcx2fgXIdwgRNaeIdzaXIdbg8RNaeIdaMg8Wa8WMMaRNaeIdlaXIdlg8WNaeIdCaRNaeId3MgRaRMMa8WNaeIdba8RNaeIdxa8WNaeIdKMgRaRMMa8RNaeId8KMMM:lNgRa83a83aR9DEh83ka8Aa9kfh8AaEcefgEal9hmbkcbhXa8JheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8JaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkcbhXa8KheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8KaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkka83aca8LEh83cbhKabhecbhYindnayaeydbcdtfydbgXayaeclfydbcdtfydbgQSmbaXayaecwfydbcdtfydbg8ASmbaQa8ASmbabaKcdtfgLaXBdbaLcwfa8ABdbaLclfaQBdbaKcifhKkaecxfheaYcifgYad6mbkdndnaJTmbaKak9nmba8Va839FTmbcbhdabhecbhXindnaoahaeydbgQcdtfydbcdtfIdba839ETmbabadcdtfgYaQBdbaYclfaeclfydbBdbaYcwfaecwfydbBdbadcifhdkaecxfheaXcifgXaK6mbkJFFuuh8Va9eTmeaohea9ehXJFFuuhRinaeIdbg8RaRaRa8R9EEg8WaRa8Ra839EgQEhRa8Wa8VaQEh8VaeclfheaXcufgXmbxdkkaKhdkadak0mbxdkkasclfabadalaAz:cjjjbkdndnadak0mbadhXxekdnaJmbadhXxekdna8Va9c9FmbadhXxekina8VJbb;aZNgRa9caRa9c9DEh8WJbbbbhRdna9eTmbaohea9ehAinaeIdbg8RaRa8Ra8W9FEaRa8RaR9EEhRaeclfheaAcufgAmbkkcbhXabhecbhAindnaoahaeydbgQcdtfydbcdtfIdba8W9ETmbabaXcdtfgKaQBdbaKclfaeclfydbBdbaKcwfaecwfydbBdbaXcifhXkaecxfheaAcifgAad6mbkJFFuuh8Vdna9eTmbaohea9ehAJFFuuh8RinaeIdbg8Ua8Ra8Ra8U9EEgIa8Ra8Ua8W9EgQEh8RaIa8VaQEh8VaeclfheaAcufgAmbkkdnaXad9hmbadhXxdkaRacacaR9DEhcaXak9nmeaXhda8Va9c9FmbkkdnamcjjjjlGTmbaOmbaXTmbcbh8AabheinaCaeydbgKfRbbc3thLaecwfgEydbhAdndna8JaKcdtgHfydbaeclfgzydbgQSmbcbhYa8KaQcdtfydbaK9hmekcjjjj94hYkaeaLaYVaKVBdbaCaQfRbbc3thLdndna8JaQcdtfydbaASmbcbhYa8KaAcdtfydbaQ9hmekcjjjj94hYkazaLaYVaQVBdbaCaAfRbbc3thYdndna8JaAcdtfydbaKSmbcbhQa8KaHfydbaA9hmekcjjjj94hQkaEaYaQVaAVBdbaecxfhea8Acifg8AaX6mbkkdnaOTmbaXTmbaXheinabaOabydbcdtfydbBdbabclfhbaecufgembkkdnaPTmbaPaUac:rNUdbka9hcdtascxffcxfhednina6Tmeaeydbcbyd1:jjjbH:bjjjbbaec98fhea6cufh6xbkkasc;W;qbf8KjjjjbaXk;Yieouabydlhvabydbclfcbaicdtz:ojjjbhoadci9UhrdnadTmbdnalTmbaehwadhDinaoalawydbcdtfydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbxdkkaehwadhDinaoawydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbkkdnaiTmbcbhDaohwinawydbhqawaDBdbawclfhwaqaDfhDaicufgimbkkdnadci6mbinaecwfydbhwaeclfydbhDaeydbhidnalTmbalawcdtfydbhwalaDcdtfydbhDalaicdtfydbhikavaoaicdtfgqydbcitfaDBdbavaqydbcitfawBdlaqaqydbcefBdbavaoaDcdtfgqydbcitfawBdbavaqydbcitfaiBdlaqaqydbcefBdbavaoawcdtfgwydbcitfaiBdbavawydbcitfaDBdlawawydbcefBdbaecxfhearcufgrmbkkabydbcbBdbk:todDue99aicd4aifhrcehwinawgDcethwaDar6mbkcuaDcdtgraDcFFFFi0Ecbyd:m:jjjbHjjjjbbhwaoaoyd9GgqcefBd9GaoaqcdtfawBdbawcFearz:ojjjbhkdnaiTmbalcd4hlaDcufhxcbhminamhDdnavTmbavamcdtfydbhDkcbadaDal2cdtfgDydlgwawcjjjj94SEgwcH4aw7c:F:b:DD2cbaDydbgwawcjjjj94SEgwcH4aw7c;D;O:B8J27cbaDydwgDaDcjjjj94SEgDcH4aD7c:3F;N8N27axGhwamcdthPdndndnavTmbakawcdtfgrydbgDcuSmeadavaPfydbal2cdtfgsIdbhzcehqinaqhrdnadavaDcdtfydbal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmlkarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbxdkkakawcdtfgrydbgDcuSmbadamal2cdtfgsIdbhzcehqinaqhrdnadaDal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmikarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbkkaramBdbamhDkabaPfaDBdbamcefgmai9hmbkkakcbyd1:jjjbH:bjjjbbaoaoyd9GcufBd9GdnaeTmbaiTmbcbhDaehwinawaDBdbawclfhwaiaDcefgD9hmbkcbhDaehwindnaDabydbgrSmbawaearcdtfgrydbBdbaraDBdbkawclfhwabclfhbaiaDcefgD9hmbkkk;Qodvuv998Jjjjjbca9Rgvczfcwfcbyd11jjbBdbavcb8Pdj1jjb83izavcwfcbydN1jjbBdbavcb8Pd:m1jjb83ibdnadTmbaicd4hodnabmbdnalTmbcbhrinaealarcdtfydbao2cdtfhwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxikkaocdthrcbhwincbhiinavczfaifgDaeaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkaearfheawcefgwad9hmbxdkkdnalTmbcbhrinabarcx2fgiaealarcdtfydbao2cdtfgwIdbUdbaiawIdlUdlaiawIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxdkkaocdthlcbhraehwinabarcx2fgiaearao2cdtfgDIdbUdbaiaDIdlUdlaiaDIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkawalfhwarcefgrad9hmbkkJbbbbavIdbavIdzgk:tgqaqJbbbb9DEgqavIdlavIdCgx:tgmamaq9DEgqavIdwavIdKgm:tgPaPaq9DEhPdnabTmbadTmbJbbbbJbbjZaP:vaPJbbbb9BEhqinabaqabIdbak:tNUdbabclfgvaqavIdbax:tNUdbabcwfgvaqavIdbam:tNUdbabcxfhbadcufgdmbkkaPk:ZlewudnaeTmbcbhvabhoinaoavBdbaoclfhoaeavcefgv9hmbkkdnaiTmbcbhrinadarcdtfhwcbhDinalawaDcdtgvc;a1jjbfydbcdtfydbcdtfydbhodnabalawavfydbcdtfydbgqcdtfgkydbgvaqSmbinakabavgqcdtfgxydbgvBdbaxhkaqav9hmbkkdnabaocdtfgkydbgvaoSmbinakabavgocdtfgxydbgvBdbaxhkaoav9hmbkkdnaqaoSmbabaqaoaqao0Ecdtfaqaoaqao6EBdbkaDcefgDci9hmbkarcifgrai6mbkkdnaembcbskcbhxindnalaxcdtgvfydbax9hmbaxhodnabavfgDydbgvaxSmbaDhqinaqabavgocdtfgkydbgvBdbakhqaoav9hmbkkaDaoBdbkaxcefgxae9hmbkcbhvabhocbhkindndnavalydbgq9hmbdnavaoydbgq9hmbaoakBdbakcefhkxdkaoabaqcdtfydbBdbxekaoabaqcdtfydbBdbkaoclfhoalclfhlaeavcefgv9hmbkakk;Jiilud99duabcbaecltz:ojjjbhvdnalTmbadhoaihralhwinarcwfIdbhDarclfIdbhqavaoydbcltfgkarIdbakIdbMUdbakclfgxaqaxIdbMUdbakcwfgxaDaxIdbMUdbakcxfgkakIdbJbbjZMUdbaoclfhoarcxfhrawcufgwmbkkdnaeTmbavhraehkinarcxfgoIdbhDaocbBdbararIdbJbbbbJbbjZaD:vaDJbbbb9BEgDNUdbarclfgoaDaoIdbNUdbarcwfgoaDaoIdbNUdbarczfhrakcufgkmbkkdnalTmbinavadydbcltfgrcxfgkaicwfIdbarcwfIdb:tgDaDNaiIdbarIdb:tgDaDNaiclfIdbarclfIdb:tgDaDNMMgDakIdbgqaqaD9DEUdbadclfhdaicxfhialcufglmbkkdnaeTmbavcxfhrinabarIdbUdbarczfhrabclfhbaecufgembkkk8MbabaeadaialavcbcbcbcbcbaoarawaDz:bjjjbk8MbabaeadaialavaoarawaDaqakaxamaPz:bjjjbk:DCoDud99rue99iul998Jjjjjbc;Wb9Rgw8KjjjjbdndnarmbcbhDxekawcxfcbc;Kbz:ojjjb8Aawcuadcx2adc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbgqBdxawceBd2aqaeadaicbz:ejjjb8AawcuadcdtadcFFFFi0Egkcbyd:m:jjjbHjjjjbbgxBdzawcdBd2adcd4adfhmceheinaegicetheaiam6mbkcbhPawcuaicdtgsaicFFFFi0Ecbyd:m:jjjbHjjjjbbgzBdCawciBd2dndnar:ZgH:rJbbbZMgO:lJbbb9p9DTmbaO:Ohexekcjjjj94hekaicufhAc:bwhmcbhCadhXcbhQinaChLaeamgKcufaeaK9iEaPgDcefaeaD9kEhYdndnadTmbaYcuf:YhOaqhiaxheadhmindndnaiIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbh5cbhPindna3axaPcdtfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbaeaCSmbcehiina3amaifaAGgmcdtfgEydbgecuSmeaicefhiaeaC9hmbkkaEaCBdba5aecuSfh5aPcefgPad9hmbxdkkazcFeasz:ojjjb8Acbh5kaDaYa5ar0giEhPaLa5aiEhCdna5arSmbaYaKaiEgmaP9Rcd9imbdndnaQcl0mbdnaX:ZgOaL:Zg8A:taY:Yg8EaD:Y:tg8Fa8EaK:Y:tgaa5:ZghaH:tNNNaOaH:taaNa8Aah:tNa8AaH:ta8FNahaO:tNM:va8EMJbbbZMgO:lJbbb9p9DTmbaO:Ohexdkcjjjj94hexekaPamfcd9Theka5aXaiEhXaQcefgQcs9hmekkdndnaCmbcihicbhDxekcbhiawakcbyd:m:jjjbHjjjjbbg5BdKawclBd2aPcuf:Yh8AdndnadTmbaqhiaxheadhmindndnaiIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbhDcbhYindndndna3axaYcdtgKfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbcehiinaxaecdtgefydbaCSmdamaifheaicefhia3aeaAGgmcdtfgEydbgecu9hmbkkaEaYBdbaDhiaDcefhDxeka5aefydbhika5aKfaiBdbaYcefgYad9hmbkcuaDc32giaDc;j:KM;jb0EhexekazcFeasz:ojjjb8AcbhDcbhekawaecbyd:m:jjjbHjjjjbbgeBd3awcvBd2aecbaiz:ojjjbhEavcd4hKdnadTmbdnalTmbaKcdth3a5hCaqhealhmadhAinaEaCydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiamIdbaiIdxMUdxaiamclfIdbaiIdzMUdzaiamcwfIdbaiIdCMUdCaiaiIdKJbbjZMUdKaCclfhCaecxfheama3fhmaAcufgAmbxdkka5hmaqheadhCinaEamydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiaiIdxJbbbbMUdxaiaiIdzJbbbbMUdzaiaiIdCJbbbbMUdCaiaiIdKJbbjZMUdKamclfhmaecxfheaCcufgCmbkkdnaDTmbaEhiaDheinaiaiIdbJbbbbJbbjZaicKfIdbgO:vaOJbbbb9BEgONUdbaiclfgmaOamIdbNUdbaicwfgmaOamIdbNUdbaicxfgmaOamIdbNUdbaiczfgmaOamIdbNUdbaicCfgmaOamIdbNUdbaic3fhiaecufgembkkcbhCawcuaDcdtgYaDcFFFFi0Egicbyd:m:jjjbHjjjjbbgeBdaawcoBd2awaicbyd:m:jjjbHjjjjbbg3Bd8KaecFeaYz:ojjjbhxdnadTmbJbbjZJbbjZa8A:vaPceSEaoNgOaONh8AaKcdthPalheina8Aaec;81jjbalEgmIdwaEa5ydbgAc32fgiIdC:tgOaONamIdbaiIdx:tgOaONamIdlaiIdz:tgOaONMMNaqcwfIdbaiIdw:tgOaONaqIdbaiIdb:tgOaONaqclfIdbaiIdl:tgOaONMMMhOdndnaxaAcdtgifgmydbcuSmba3aifIdbaO9ETmekamaCBdba3aifaOUdbka5clfh5aqcxfhqaeaPfheadaCcefgC9hmbkkabaxaYz:njjjb8AcrhikaicdthiinaiTmeaic98fgiawcxffydbcbyd1:jjjbH:bjjjbbxbkkawc;Wbf8KjjjjbaDk:Ydidui99ducbhi8Jjjjjbca9Rglczfcwfcbyd11jjbBdbalcb8Pdj1jjb83izalcwfcbydN1jjbBdbalcb8Pd:m1jjb83ibdndnaembJbbjFhvJbbjFhoJbbjFhrxekadcd4cdthwincbhdinalczfadfgDabadfIdbgvaDIdbgoaoav9EEUdbaladfgDavaDIdbgoaoav9DEUdbadclfgdcx9hmbkabawfhbaicefgiae9hmbkalIdwalIdK:thralIdlalIdC:thoalIdbalIdz:thvkJbbbbavavJbbbb9DEgvaoaoav9DEgvararav9DEk9DeeuabcFeaicdtz:ojjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcifc98GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcrfc94GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd:q:jjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd:q:jjjbfgdBd:q:jjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk:Iedbcjwk1eFFuuFFuuFFuuFFuFFFuFFFuFbbbbbbbbeeebeebebbeeebebbbbbebebbbbbbbbbebbbdbbbbbbbebbbebbbdbbbbbbbbbbbeeeeebebbebbebebbbeebbbbbbbbbbbbbbbbbbbbbc1Dkxebbbdbbb:GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(n(t),{}).then(function(u){a=u.instance,a.exports.__wasm_call_ctors()});function n(u){for(var l=new Uint8Array(u.length),y=0;y<u.length;++y){var h=u.charCodeAt(y);l[y]=h>96?h-97:h>64?h-39:h+4}for(var g=0,y=0;y<u.length;++y)l[g++]=l[y]<60?e[l[y]]:(l[y]-60)*64+l[++y];return l.buffer.slice(0,g)}function r(u){if(!u)throw new Error("Assertion failed")}function i(u){return new Uint8Array(u.buffer,u.byteOffset,u.byteLength)}function o(u,l,y){var h=a.exports.sbrk,g=h(l.length*4),x=h(y*4),v=new Uint8Array(a.exports.memory.buffer),T=i(l);v.set(T,g);var I=u(x,g,l.length,y);v=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(y);new Uint8Array(S.buffer).set(v.subarray(x,x+y*4)),T.set(v.subarray(g,g+l.length*4)),h(g-h(0));for(var R=0;R<l.length;++R)l[R]=S[l[R]];return[S,I]}function c(u){for(var l=0,y=0;y<u.length;++y){var h=u[y];l=l<h?h:l}return l}function d(u,l,y,h,g,x,v,T,I){var S=a.exports.sbrk,R=S(4),_=S(y*4),A=S(g*x),j=S(y*4),L=new Uint8Array(a.exports.memory.buffer);L.set(i(h),A),L.set(i(l),j);var F=u(_,j,y,A,g,x,v,T,I,R);L=new Uint8Array(a.exports.memory.buffer);var K=new Uint32Array(F);i(K).set(L.subarray(_,_+F*4));var W=new Float32Array(1);return i(W).set(L.subarray(R,R+4)),S(R-S(0)),[K,W[0]]}function b(u,l,y,h,g,x,v,T,I,S,R,_,A){var j=a.exports.sbrk,L=j(4),F=j(y*4),K=j(g*x),W=j(g*T),te=j(I.length*4),oe=j(y*4),Oe=S?j(g):0,de=new Uint8Array(a.exports.memory.buffer);de.set(i(h),K),de.set(i(v),W),de.set(i(I),te),de.set(i(l),oe),S&&de.set(i(S),Oe);var Pe=u(F,oe,y,K,g,x,W,T,te,I.length,Oe,R,_,A,L);de=new Uint8Array(a.exports.memory.buffer);var Ke=new Uint32Array(Pe);i(Ke).set(de.subarray(F,F+Pe*4));var ve=new Float32Array(1);return i(ve).set(de.subarray(L,L+4)),j(L-j(0)),[Ke,ve[0]]}function f(u,l,y,h){var g=a.exports.sbrk,x=g(y*h),v=new Uint8Array(a.exports.memory.buffer);v.set(i(l),x);var T=u(x,y,h);return g(x-g(0)),T}function m(u,l,y,h,g,x,v,T){var I=a.exports.sbrk,S=I(T*4),R=I(y*h),_=I(y*x),A=new Uint8Array(a.exports.memory.buffer);A.set(i(l),R),g&&A.set(i(g),_);var j=u(S,R,y,h,_,x,v,T);A=new Uint8Array(a.exports.memory.buffer);var L=new Uint32Array(j);return i(L).set(A.subarray(S,S+j*4)),I(S-I(0)),L}var p={LockBorder:1,Sparse:2,ErrorAbsolute:4,Prune:8,_InternalDebug:1<<30};return{ready:s,supported:!0,compactMesh:function(u){r(u instanceof Uint32Array||u instanceof Int32Array||u instanceof Uint16Array||u instanceof Int16Array),r(u.length%3==0);var l=u.BYTES_PER_ELEMENT==4?u:new Uint32Array(u);return o(a.exports.meshopt_optimizeVertexFetchRemap,l,c(u)+1)},simplify:function(u,l,y,h,g,x){r(u instanceof Uint32Array||u instanceof Int32Array||u instanceof Uint16Array||u instanceof Int16Array),r(u.length%3==0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),r(h>=0&&h<=u.length),r(h%3==0),r(g>=0);for(var v=0,T=0;T<(x?x.length:0);++T)r(x[T]in p),v|=p[x[T]];var I=u.BYTES_PER_ELEMENT==4?u:new Uint32Array(u),S=d(a.exports.meshopt_simplify,I,u.length,l,l.length/y,y*4,h,g,v);return S[0]=u instanceof Uint32Array?S[0]:new u.constructor(S[0]),S},simplifyWithAttributes:function(u,l,y,h,g,x,v,T,I,S){r(u instanceof Uint32Array||u instanceof Int32Array||u instanceof Uint16Array||u instanceof Int16Array),r(u.length%3==0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),r(h instanceof Float32Array),r(h.length%g==0),r(g>=0),r(v==null||v instanceof Uint8Array),r(v==null||v.length==l.length/y),r(T>=0&&T<=u.length),r(T%3==0),r(I>=0),r(Array.isArray(x)),r(g>=x.length),r(x.length<=32);for(var R=0;R<x.length;++R)r(x[R]>=0);for(var _=0,R=0;R<(S?S.length:0);++R)r(S[R]in p),_|=p[S[R]];var A=u.BYTES_PER_ELEMENT==4?u:new Uint32Array(u),j=b(a.exports.meshopt_simplifyWithAttributes,A,u.length,l,l.length/y,y*4,h,g*4,new Float32Array(x),v?new Uint8Array(v):null,T,I,_);return j[0]=u instanceof Uint32Array?j[0]:new u.constructor(j[0]),j},getScale:function(u,l){return r(u instanceof Float32Array),r(u.length%l==0),r(l>=3),f(a.exports.meshopt_simplifyScale,u,u.length/l,l*4)},simplifyPoints:function(u,l,y,h,g,x){return r(u instanceof Float32Array),r(u.length%l==0),r(l>=3),r(y>=0&&y<=u.length/l),h?(r(h instanceof Float32Array),r(h.length%g==0),r(g>=3),r(u.length/l==h.length/g),m(a.exports.meshopt_simplifyPoints,u,u.length/l,l*4,h,g*4,x,y)):m(a.exports.meshopt_simplifyPoints,u,u.length/l,l*4,void 0,0,0,y)}}})();var dw=(function(){var t="b9H79TebbbeVx9Geueu9Geub9Gbb9Giuuueu9Gmuuuuuuuuuuu9999eu9Gvuuuuueu9Gwuuuuuuuub9Gxuuuuuuuuuuuueu9Gkuuuuuuuuuu99eu9Gouuuuuub9Gruuuuuuub9GluuuubiOHdilvorwDqqkbiibeilve9Weiiviebeoweuec;G:Odkr:Yewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9I919P29K9nW79O2Wt79c9V919U9KbeX9TW79O9V9Wt9F9I919P29K9nW79O2Wt7bo39TW79O9V9Wt9F9J9V9T9W91tWJ2917tWV9c9V919U9K7br39TW79O9V9Wt9F9J9V9T9W91tW9nW79O2Wt9c9V919U9K7bDL9TW79O9V9Wt9F9V9Wt9P9T9P96W9nW79O2Wtbql79IV9RbkDwebcekdsPq;Q9BHdbkIbabaec9:fgefcufae9Ugeabci9Uadfcufad9Ugbaeab0Ek:w8KDPue99eux99dui99euo99iu8Jjjjjbc:WD9Rgm8KjjjjbdndnalmbcbhPxekamc:Cwfcbc;Kbz:njjjb8Adndnalcb9imbaoal9nmbamcuaocdtaocFFFFi0Egscbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamascbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8waihsalhAinazasydbcdtfcbBdbasclfhsaAcufgAmbkaihsalhAinazasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkaihsalhCcbhXindnazasydbcdtgQfgAydbcb9imbaHaQfaXBdbaAaAydbgQcjjjj94VBdbaQaXfhXkasclfhsaCcufgCmbkalci9UhLdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhXaHaAydbcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaXcdtfgXaXydbgXcefBdbaOaXcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaihsalhAindnazasydbcdtgCfgXydbgQcu9kmbaXaQcFFFFrGgQBdbaHaCfgCaCydbaQ9RBdbkasclfhsaAcufgAmbxdkkamcuaocdtgsaocFFFFi0EgAcbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamaAcbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8wazcbasz:njjjbhXalci9UhLaihsalhAinaXasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkdnaoTmbcbhsaHhAaXhCaohQinaAasBdbaAclfhAaCydbasfhsaCclfhCaQcufgQmbkkdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhQaHaAydbcdtfgKaKydbgKcefBdbaOaKcdtfasBdbaHaQcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaoTmbcbhsaohAinaHasfgCaCydbaXasfydb9RBdbasclfhsaAcufgAmbkkamaLcbyd;y1jjbHjjjjbbgsBd:OwamclBd;8wascbaLz:njjjbhYamcuaLcK2alcjjjjd0Ecbyd;y1jjbHjjjjbbg8ABd:SwamcvBd;8wJbbbbhEdnalci6g3mbarcd4hKaihAa8AhsaLhrJbbbbh5inavaAclfydbaK2cdtfgCIdlh8EavaAydbaK2cdtfgXIdlhEavaAcwfydbaK2cdtfgQIdlh8FaCIdwhaaXIdwhhaQIdwhgasaCIdbg8JaXIdbg8KMaQIdbg8LMJbbnn:vUdbasclfaXIdlaCIdlMaQIdlMJbbnn:vUdbaQIdwh8MaCIdwh8NaXIdwhyascxfa8EaE:tg8Eagah:tggNa8FaE:tg8Faaah:tgaN:tgEJbbbbJbbjZa8Ja8K:tg8Ja8FNa8La8K:tg8Ka8EN:tghahNaEaENaaa8KNaga8JN:tgEaENMM:rg8K:va8KJbbbb9BEg8ENUdbasczfaEa8ENUdbascCfaha8ENUdbascwfa8Maya8NMMJbbnn:vUdba5a8KMh5aAcxfhAascKfhsarcufgrmbka5aL:Z:vJbbbZNhEkamcuaLcdtalcFFFF970Ecbyd;y1jjbHjjjjbbgCBd:WwamcoBd;8waEaq:ZNhEdna3mbcbhsaChAinaAasBdbaAclfhAaLascefgs9hmbkkaE:rhhcuh8PamcuaLcltalcFFFFd0Ecbyd;y1jjbHjjjjbbgIBd:0wamcrBd;8wcbaIa8AaCaLz:djjjb8AJFFuuhyJFFuuh8RJFFuuh8Sdnalci6gXmbJFFuuh8Sa8AhsaLhAJFFuuh8RJFFuuhyinascwfIdbgEayayaE9EEhyasclfIdbgEa8Ra8RaE9EEh8RasIdbgEa8Sa8SaE9EEh8SascKfhsaAcufgAmbkkahJbbbZNhgamaocetgscuaocu9kEcbyd;y1jjbHjjjjbbgABd:4waAcFeasz:njjjbhCdnaXmbcbhAJFFuuhEa8Ahscuh8PinascwfIdbay:tghahNasIdba8S:tghahNasclfIdba8R:tghahNMM:rghaEa8PcuSahaE9DVgXEhEaAa8PaXEh8PascKfhsaLaAcefgA9hmbkkamczfcbcjwz:njjjb8Aamcwf9cb83ibam9cb83ibagaxNhRJbbjZak:th8Ncbh8UJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80cbh81cbhPinJbbbbhEdna8UTmbJbbjZa8U:Z:vhEkJbbbbhhdna80a80Na8Ya8YNa8Za8ZNMMg8KJbbbb9BmbJbbjZa8K:r:vhhka8XaENh5a8WaENh8Fa8VaENhaa8PhQdndndndndna8UaPVTmbamydwgBTmea80ahNh8Ja8ZahNh8La8YahNh8Maeamydbcdtfh83cbh3JFFuuhEcvhXcuhQindnaza83a3cdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAindndnaCaiaAydbgKcx2fgsclfydbgrcetf8Vebcs4aCasydbgLcetf8Vebcs4faCascwfydbglcetf8Vebcs4fgombcbhsxekcehsazaLcdtfydbgLceSmbcehsazarcdtfydbgrceSmbcehsazalcdtfydbglceSmbdnarcdSaLcdSfalcdSfcd6mbaocefhsxekaocdfhskdnasaX9kmba8AaKcK2fgLIdwa5:thhaLIdla8F:th8KaLIdbaa:th8EdndnakJbbbb9DTmba8E:lg8Ea8K:lg8Ka8Ea8K9EEg8Kah:lgha8Kah9EEag:vJbbjZMhhxekahahNa8Ea8ENa8Ka8KNMM:rag:va8NNJbbjZMJ9VO:d86JbbjZaLIdCa8JNaLIdxa8MNa8LaLIdzNMMakN:tghahJ9VO:d869DENhhkaKaQasaX6ahaE9DVgLEhQasaXaLEhXahaEaLEhEkaAclfhAavcufgvmbkka3cefg3aB9hmbkkaQcu9hmekama5Ud:ODama8FUd:KDamaaUd:GDamcuBd:qDamcFFF;7rBdjDaIcba8AaYamc:GDfakJbbbb9Damc:qDfamcjDfz:ejjjbamyd:qDhQdndnaxJbbbb9ETmba8UaD6mbaQcuSmeceh3amIdjDaR9EmixdkaQcu9hmekdna8UTmbdnamydlgza8Uci2fgsciGTmbadasfcba8Uazcu7fciGcefz:njjjb8AkabaPcltfgzam8Pib83dbazcwfamcwf8Pib83dbaPcefhPkc3hzinazc98Smvamc:Cwfazfydbcbyd;u1jjbH:bjjjbbazc98fhzxbkkcbh3a8Uaq9pmbamydwaCaiaQcx2fgsydbcetf8Vebcs4aCascwfydbcetf8Vebcs4faCasclfydbcetf8Vebcs4ffaw9nmekcbhscbhAdna81TmbcbhAamczfhXinamczfaAcdtfaXydbgLBdbaXclfhXaAaYaLfRbbTfhAa81cufg81mbkkamydwhlamydbhXam9cu83i:GDam9cu83i:ODam9cu83i:qDam9cu83i:yDaAc;8eaAclfc:bd6Eh81inamcjDfasfcFFF;7rBdbasclfgscz9hmbka81cdthBdnalTmbaeaXcdtfhocbhrindnazaoarcdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAcuhLcuhsinazaiaAydbgKcx2fgXclfydbcdtfydbazaXydbcdtfydbfazaXcwfydbcdtfydbfgXasaXas6gXEhsaKaLaXEhLaAclfhAavcufgvmbkaLcuSmba8AaLcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEcbhAindndnasamc:qDfaAfgvydbgX6mbasaX9hmeaEamcjDfaAfIdb9FTmekavasBdbamc:GDfaAfaLBdbamcjDfaAfaEUdbxdkaAclfgAcz9hmbkkarcefgral9hmbkkamczfaBfhLcbhscbhAindnamc:GDfasfydbgXcuSmbaLaAcdtfaXBdbaAcefhAkasclfgscz9hmbkaAa81fg81TmbJFFuuhhcuhKamczfhsa81hvcuhLina8AasydbgXcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEdndnazaiaXcx2fgAclfydbcdtfydbazaAydbcdtfydbfazaAcwfydbcdtfydbfgAaL6mbaAaL9hmeaEah9DTmekaEhhaAhLaXhKkasclfhsavcufgvmbkaKcuSmbaKhQkdnamaiaQcx2fgrydbarclfydbarcwfydbaCabaeadaPawaqa3z:fjjjbTmbaPcefhPJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80kcbhXinaOaHaraXcdtfydbcdtgAfydbcdtfgKhsazaAfgvydbgLhAdnaLTmbdninasydbaQSmeasclfhsaAcufgATmdxbkkasaKaLcdtfc98fydbBdbavavydbcufBdbkaXcefgXci9hmbka8AaQcK2fgsIdbhEasIdlhhasIdwh8KasIdxh8EasIdzh5asIdCh8FaYaQfce86bba80a8FMh80a8Za5Mh8Za8Ya8EMh8Ya8Xa8KMh8Xa8WahMh8Wa8VaEMh8Vamydxh8Uxbkkamc:WDf8KjjjjbaPk;Vvivuv99lu8Jjjjjbca9Rgv8Kjjjjbdndnalcw0mbaiydbhoaeabcitfgralcdtcufBdlaraoBdbdnalcd6mbaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkkalabfhrxekcbhDavczfcwfcbBdbav9cb83izavcwfcbBdbav9cb83ibJbbjZhqJbbjZhkinadaiaDcdtfydbcK2fhwcbhrinavczfarfgoawarfIdbgxaoIdbgm:tgPakNamMgmUdbavarfgoaPaxam:tNaoIdbMUdbarclfgrcx9hmbkJbbjZaqJbbjZMgq:vhkaDcefgDal9hmbkcbhoadcbcecdavIdlgxavIdwgm9GEgravIdbgPam9GEaraPax9GEgscdtgrfhzavczfarfIdbhxaihralhwinaiaocdtfgDydbhHaDarydbgOBdbaraHBdbarclfhraoazaOcK2fIdbax9Dfhoawcufgwmbkaeabcitfhrdndnaocv6mbaoalc98f6mekaraiydbBdbaralcdtcufBdlaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkalabfhrxekaraxUdbararydlc98GasVBdlabcefaeadaiaoz:djjjbhwararydlciGawabcu7fcdtVBdlawaeadaiaocdtfalao9Rz:djjjbhrkavcaf8Kjjjjbark:;idiud99dndnabaecitfgwydlgDciGgqciSmbinabcbaDcd4gDalaqcdtfIdbawIdb:tgkJbbbb9FEgwaecefgefadaialavaoarz:ejjjbak:larIdb9FTmdabawaD7aefgecitfgwydlgDciGgqci9hmbkkabaecitfgeclfhbdnavmbcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdwalIdw:tgkakNaqIdbalIdb:tgkakNaqIdlalIdl:tgkakNMM:rgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbxdkkcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdbalIdb:t:lgkaqIdlalIdl:t:lgxakax9EEgkaqIdwalIdw:t:lgxakax9EEgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbkkk;llevudnabydwgxaladcetfgm8Vebcs4alaecetfgP8Vebgscs4falaicetfgz8Vebcs4ffaD0abydxaq9pVakVgDce9hmbavawcltfgxab8Pdb83dbaxcwfabcwfgx8Pdb83dbdnaxydbgqTmbaoabydbcdtfhxaqhsinalaxydbcetfcFFi87ebaxclfhxascufgsmbkkdnabydxglci2gsabydlgxfgkciGTmbarakfcbalaxcu7fciGcefz:njjjb8Aabydxci2hsabydlhxabydwhqkab9cb83dwababydbaqfBdbabascifc98GaxfBdlaP8Vebhscbhxkdnascztcz91cu9kmbabaxcefBdwaPax87ebaoabydbcdtfaxcdtfaeBdbkdnam8Uebcu9kmbababydwgxcefBdwamax87ebaoabydbcdtfaxcdtfadBdbkdnaz8Uebcu9kmbababydwgxcefBdwazax87ebaoabydbcdtfaxcdtfaiBdbkarabydlfabydxci2faPRbb86bbarabydlfabydxci2fcefamRbb86bbarabydlfabydxci2fcdfazRbb86bbababydxcefBdxaDk8LbabaeadaialavaoarawaDaDaqJbbbbz:cjjjbk;Nkovud99euv99eul998Jjjjjbc:W;ae9Rgo8KjjjjbdndnadTmbavcd4hrcbhwcbhDindnaiaeclfydbar2cdtfgvIdbaiaeydbar2cdtfgqIdbgk:tgxaiaecwfydbar2cdtfgmIdlaqIdlgP:tgsNamIdbak:tgzavIdlaP:tgPN:tgkakNaPamIdwaqIdwgH:tgONasavIdwaH:tgHN:tgPaPNaHazNaOaxN:tgxaxNMM:rgsJbbbb9Bmbaoc:W:qefawcx2fgAakas:vUdwaAaxas:vUdlaAaPas:vUdbaoc8Wfawc8K2fgAaq8Pdb83dbaAav8Pdb83dxaAam8Pdb83dKaAcwfaqcwfydbBdbaAcCfavcwfydbBdbaAcafamcwfydbBdbawcefhwkaecxfheaDcifgDad6mbkab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbawTmeaocbBd8Sao9cb83iKao9cb83izaoczfaoc8Wfawci2cxaoc8Sfcbcrz1jjjbaoIdKhCaoIdChXaoIdzhQao9cb83iwao9cb83ibaoaoc:W:qefawcxaoc8Sfcbciz1jjjbJbbjZhkaoIdwgPJbbbbJbbjZaPaPNaoIdbgPaPNaoIdlgsasNMM:rgx:vaxJbbbb9BEgzNhxasazNhsaPazNhzaoc:W:qefheawhvinaecwfIdbaxNaeIdbazNasaeclfIdbNMMgPakaPak9DEhkaecxfheavcufgvmbkabaCUdwabaXUdlabaQUdbabaoId3UdxdndnakJ;n;m;m899FmbJbbbbhPaoc:W:qefheaoc8WfhvinaCavcwfIdb:taecwfIdbgHNaQavIdb:taeIdbgONaXavclfIdb:taeclfIdbgLNMMaxaHNazaONasaLNMM:vgHaPaHaP9EEhPavc8KfhvaecxfheawcufgwmbkabaxUd8KabasUdaabazUd3abaCaxaPN:tUdKabaXasaPN:tUdCabaQazaPN:tUdzabJbbjZakakN:t:rgkUdydndnaxJbbj:;axJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;axJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohexekcjjjj94hekabae86b8UdndnasJbbj:;asJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;asJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkabav86bRdndnazJbbj:;azJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;azJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohqxekcjjjj94hqkabaq86b8SdndnaecKtcK91:YJbb;:9c:vax:t:lavcKtcK91:YJbb;:9c:vas:t:laqcKtcK91:YJbb;:9c:vaz:t:lakMMMJbb;:9cNJbbjZMgk:lJbbb9p9DTmbak:Ohexekcjjjj94hekaecFbaecFb9iEhexekabcjjj;8iBdycFbhekabae86b8Vxekab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbkaoc:W;aef8Kjjjjbk;Iwwvul99iud99eue99eul998Jjjjjbcje9Rgr8Kjjjjbavcd4hwaicd4hDdndnaoTmbarc;abfcbaocdtgvz:njjjb8Aarc;Gbfcbavz:njjjb8AarhvarcafhiaohqinavcFFF97BdbaicFFF;7rBdbaiclfhiavclfhvaqcufgqmbkdnadTmbcbhkinaeakaD2cdtfgvIdwhxavIdlhmavIdbhPalakaw2cdtfIdbhsarc;abfhzarhiarc;GbfhHarcafhqcj1jjbhvaohOinasavcwfIdbaxNavIdbaPNavclfIdbamNMMgAMhCakhXdnaAas:tgAaqIdbgQ9DgLmbaHydbhXkaHaXBdbakhXdnaCaiIdbgK9EmbazydbhXaKhCkazaXBdbaiaCUdbaqaAaQaLEUdbavcxfhvaqclfhqaHclfhHaiclfhiazclfhzaOcufgOmbkakcefgkad9hmbkkadThkJbbbbhCcbhXarc;abfhvarc;Gbfhicbhqinalavydbgzaw2cdtfIdbalaiydbgHaw2cdtfIdbaeazaD2cdtfgzIdwaeaHaD2cdtfgHIdw:tgsasNazIdbaHIdb:tgsasNazIdlaHIdl:tgsasNMM:rMMgsaCasaC9EgzEhCaqaXazEhXaiclfhiavclfhvaoaqcefgq9hmbkaCJbbbZNhKxekadThkcbhXJbbbbhKkJbbbbhCdnaearc;abfaXcdtgifydbgqaD2cdtfgvIdwaearc;GbfaifydbgzaD2cdtfgiIdwgm:tgsasNavIdbaiIdbgY:tgAaANavIdlaiIdlgP:tgQaQNMM:rgxJbbbb9ETmbaxalaqaw2cdtfIdbMalazaw2cdtfIdb:taxaxM:vhCkasaCNamMhmaQaCNaPMhPaAaCNaYMhYdnakmbaDcdthvawcdthiindnalIdbg8AaecwfIdbam:tgCaCNaeIdbaY:tgsasNaeclfIdbaP:tgAaANMM:rgQMgEaK9ETmbJbbbbhxdnaQJbbbb9ETmbaEaK:taQaQM:vhxkaxaCNamMhmaxaANaPMhPaxasNaYMhYa8AaKaQMMJbbbZNhKkaeavfhealaifhladcufgdmbkkabaKUdxabamUdwabaPUdlabaYUdbarcjef8Kjjjjbkjeeiu8Jjjjjbcj8W9Rgr8Kjjjjbaici2hwdnaiTmbawceawce0EhDarhiinaiaeadRbbcdtfydbBdbadcefhdaiclfhiaDcufgDmbkkabarawaladaoz:hjjjbarcj8Wf8Kjjjjbk:3lequ8JjjjjbcjP9Rgl8Kjjjjbcbhvalcjxfcbaiz:njjjb8AdndnadTmbcjehoaehrincuhwarhDcuhqavhkdninawakaoalcjxfaDcefRbbfRbb9RcFeGci6aoalcjxfaDRbbfRbb9RcFeGci6faoalcjxfaDcdfRbbfRbb9RcFeGci6fgxaq9mgmEhwdnammbaxce0mdkaxaqaxaq9kEhqaDcifhDadakcefgk9hmbkkaeawci2fgDcdfRbbhqaDcefRbbhxaDRbbhkaeavci2fgDcifaDawav9Rci2z:qjjjb8Aakalcjxffaocefgo86bbaxalcjxffao86bbaDcdfaq86bbaDcefax86bbaDak86bbaqalcjxffao86bbarcifhravcefgvad9hmbkalcFeaicetz:njjjbhoadci2gDceaDce0EhqcbhxindnaoaeRbbgkcetfgw8UebgDcu9kmbawax87ebaocjlfaxcdtfabakcdtfydbBdbaxhDaxcefhxkaeaD86bbaecefheaqcufgqmbkaxcdthDxekcbhDkabalcjlfaDz:mjjjb8AalcjPf8Kjjjjbk9teiucbcbyd;C1jjbgeabcifc98GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;C1jjbgeabcrfc94GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;C1jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;C1jjbfgdBd;C1jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk:;Deludndndnadch9pmbabaeSmdaeabadfgi9Rcbadcet9R0mekabaead;8qbbxekaeab7ciGhldndndnabae9pmbdnalTmbadhvabhixikdnabciGmbadhvabhixdkadTmiabaeRbb86bbadcufhvdnabcefgiciGmbaecefhexdkavTmiabaeRbe86beadc9:fhvdnabcdfgiciGmbaecdfhexdkavTmiabaeRbd86bdadc99fhvdnabcifgiciGmbaecifhexdkavTmiabaeRbi86biabclfhiaeclfheadc98fhvxekdnalmbdnaiciGTmbadTmlabadcufgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc9:fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc99fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc98fgdfaeadfRbb86bbkadcl6mbdnadc98fgocd4cefciGgiTmbaec98fhlabc98fhvinavadfaladfydbBdbadc98fhdaicufgimbkkaocx6mbaec9Wfhvabc9WfhoinaoadfgicxfavadfglcxfydbBdbaicwfalcwfydbBdbaiclfalclfydbBdbaialydbBdbadc9Wfgdci0mbkkadTmdadhidnadciGglTmbaecufhvabcufhoadhiinaoaifavaifRbb86bbaicufhialcufglmbkkadcl6mdaec98fhlabc98fhvinavaifgecifalaifgdcifRbb86bbaecdfadcdfRbb86bbaecefadcefRbb86bbaeadRbb86bbaic98fgimbxikkavcl6mbdnavc98fglcd4cefcrGgdTmbavadcdt9RhvinaiaeydbBdbaeclfheaiclfhiadcufgdmbkkalc36mbinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaiaeydzBdzaiaeydCBdCaiaeydKBdKaiaeyd3Bd3aecafheaicafhiavc9Gfgvci0mbkkavTmbdndnavcrGgdmbavhlxekavc94GhlinaiaeRbb86bbaicefhiaecefheadcufgdmbkkavcw6mbinaiaeRbb86bbaiaeRbe86beaiaeRbd86bdaiaeRbi86biaiaeRbl86blaiaeRbv86bvaiaeRbo86boaiaeRbr86braicwfhiaecwfhealc94fglmbkkabkk9Tdbcjwk9ubbjZbbbbbbbbbbbbbbjZbbbbbbbbbbbbbbjZ86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;bc;uwkxebbbdbbb9GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(n(t),{}).then(function(u){a=u.instance,a.exports.__wasm_call_ctors()});function n(u){for(var l=new Uint8Array(u.length),y=0;y<u.length;++y){var h=u.charCodeAt(y);l[y]=h>96?h-97:h>64?h-39:h+4}for(var g=0,y=0;y<u.length;++y)l[g++]=l[y]<60?e[l[y]]:(l[y]-60)*64+l[++y];return l.buffer.slice(0,g)}function r(u){if(!u)throw new Error("Assertion failed")}function i(u){return new Uint8Array(u.buffer,u.byteOffset,u.byteLength)}var o=48,c=16;function d(u,l){var y=u.meshlets[l*4+0],h=u.meshlets[l*4+1],g=u.meshlets[l*4+2],x=u.meshlets[l*4+3];return{vertices:u.vertices.subarray(y,y+g),triangles:u.triangles.subarray(h,h+x*3)}}function b(u,l,y,h,g,x,v){var T=a.exports.sbrk,I=a.exports.meshopt_buildMeshletsBound(u.length,g,x),S=T(I*c),R=T(I*g*4),_=T(I*x*3),A=T(u.byteLength),j=T(l.byteLength),L=new Uint8Array(a.exports.memory.buffer);L.set(i(u),A),L.set(i(l),j);var F=a.exports.meshopt_buildMeshlets(S,R,_,A,u.length,j,y,h,g,x,v);L=new Uint8Array(a.exports.memory.buffer);for(var K=L.subarray(S,S+F*c),W=new Uint32Array(K.buffer,K.byteOffset,K.byteLength/4).slice(),te=0;te<F;++te){var oe=W[te*4+0],Oe=W[te*4+1],y=W[te*4+2],de=W[te*4+3];a.exports.meshopt_optimizeMeshlet(R+oe*4,_+Oe,de,y)}var Pe=W[(F-1)*4+0],Ke=W[(F-1)*4+1],ve=W[(F-1)*4+2],Je=W[(F-1)*4+3],ze=Pe+ve,bt=Ke+(Je*3+3&-4),aa={meshlets:W,vertices:new Uint32Array(L.buffer,R,ze).slice(),triangles:new Uint8Array(L.buffer,_,bt*3).slice(),meshletCount:F};return T(S-T(0)),aa}function f(u){var l=new Float32Array(a.exports.memory.buffer,u,o/4);return{centerX:l[0],centerY:l[1],centerZ:l[2],radius:l[3],coneApexX:l[4],coneApexY:l[5],coneApexZ:l[6],coneAxisX:l[7],coneAxisY:l[8],coneAxisZ:l[9],coneCutoff:l[10]}}function m(u,l,y,h){var g=a.exports.sbrk,x=[],v=g(l.byteLength),T=g(u.vertices.byteLength),I=g(u.triangles.byteLength),S=g(o),R=new Uint8Array(a.exports.memory.buffer);R.set(i(l),v),R.set(i(u.vertices),T),R.set(i(u.triangles),I);for(var _=0;_<u.meshletCount;++_){var A=u.meshlets[_*4+0],j=u.meshlets[_*4+0+1],L=u.meshlets[_*4+0+3];a.exports.meshopt_computeMeshletBounds(S,T+A*4,I+j,L,v,y,h),x.push(f(S))}return g(v-g(0)),x}function p(u,l,y,h){var g=a.exports.sbrk,x=g(o),v=g(u.byteLength),T=g(l.byteLength),I=new Uint8Array(a.exports.memory.buffer);I.set(i(u),v),I.set(i(l),T),a.exports.meshopt_computeClusterBounds(x,v,u.length,T,y,h);var S=f(x);return g(x-g(0)),S}return{ready:s,supported:!0,buildMeshlets:function(u,l,y,h,g,x){r(u.length%3==0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),r(h<=256||h>0),r(g<=512),r(g%4==0),x=x||0;var v=u.BYTES_PER_ELEMENT==4?u:new Uint32Array(u);return b(v,l,l.length/y,y*4,h,g,x)},computeClusterBounds:function(u,l,y){r(u.length%3==0),r(u.length/3<=512),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3);var h=u.BYTES_PER_ELEMENT==4?u:new Uint32Array(u);return p(h,l,l.length/y,y*4)},computeMeshletBounds:function(u,l,y){return r(u.meshletCount!=0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),m(u,l,l.length/y,y*4)},extractMeshlet:function(u,l){return r(l>=0&&l<u.meshletCount),d(u,l)}}})();var Fb=new Ji().registerExtensions([Jn,Yn,Qn]).registerDependencies({"meshopt.decoder":Zn});async function Ra(t,e={}){await Zn.ready;let a;if(e.fetchBytes)a=new Uint8Array(await e.fetchBytes(t));else{let c=await fetch(t,{cache:e.fetchCache||"no-store"});if(!c.ok)throw new Error(`Failed to load ${t}: ${c.status}`);a=new Uint8Array(await c.arrayBuffer())}let s=await Fb.readBinary(a),n=[],r=e.componentFeatures||new Map,i=new Map;function o(c,d=""){let b=r.has(c.getName());b&&i.set(c.getName(),(i.get(c.getName())||0)+1);let f=b?c.getName():d,m=c.getMesh();if(m){let p=c.getWorldMatrix();for(let u of m.listPrimitives()){let l=u.getAttribute("POSITION"),y=u.getAttribute("NORMAL"),h=u.getAttribute("_FEATURE_ID_0"),g=u.getAttribute("_FEATURE_ID_1"),x=u.getIndices()?.getArray();if(!l||!x)continue;let v=l.getCount(),T=new Float32Array(v*3),I=new Float32Array(v*3),S=new Uint32Array(v),R=new Uint32Array(v),_=[1/0,1/0,1/0,-1/0,-1/0,-1/0],A=[],j=r.get(f)?.featureId||e.defaultFeatureId||0;for(let F=0;F<v;F+=1)l.getElement(F,A),Bb(T,F*3,A,p),_[0]=Math.min(_[0],T[F*3]),_[1]=Math.min(_[1],T[F*3+1]),_[2]=Math.min(_[2],T[F*3+2]),_[3]=Math.max(_[3],T[F*3]),_[4]=Math.max(_[4],T[F*3+1]),_[5]=Math.max(_[5],T[F*3+2]),y?(y.getElement(F,A),jb(I,F*3,A,p)):I.set([0,0,1],F*3),S[F]=Number(h?.getScalar(F)||0),R[F]=Number(g?g.getScalar(F)||0:j);let L=u.getMaterial();n.push({position:T,normal:I,netId:S,objectFeatureId:R,indices:x,designator:f,nodeName:c.getName(),meshName:m.getName(),bounds:_,material:L?{name:L.getName(),baseColor:L.getBaseColorFactor(),metallic:L.getMetallicFactor(),roughness:L.getRoughnessFactor(),emissive:L.getEmissiveFactor()}:{baseColor:e.baseColor||[.55,.58,.64,1],metallic:.05,roughness:.72,emissive:[0,0,0]}})}}for(let p of c.listChildren())o(p,f)}for(let c of s.getRoot().listScenes())for(let d of c.listChildren())o(d);return{byteLength:a.byteLength,primitives:n,componentNodeCounts:i}}function Bb(t,e,a,s){let n=s[0]*a[0]+s[4]*a[1]+s[8]*a[2]+s[12],r=s[1]*a[0]+s[5]*a[1]+s[9]*a[2]+s[13],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2]+s[14];t[e]=n,t[e+1]=-i,t[e+2]=r}function jb(t,e,a,s){let n=s[0]*a[0]+s[4]*a[1]+s[8]*a[2],r=s[1]*a[0]+s[5]*a[1]+s[9]*a[2],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2],o=Math.hypot(n,r,i)||1;t[e]=n/o,t[e+1]=-i/o,t[e+2]=r/o}var Aa=Object.freeze({mm:1,fineMm:.1,deg:15,fineDeg:1}),er=Object.freeze([[1,0,0],[0,1,0],[0,0,1]]);function To(t){return Math.round(t*1e9)/1e9+0}function Ot(t){let e=Math.hypot(...t.rotation)||1,a=t.rotation.map(n=>n/e),s=[a[3],a[0],a[1],a[2]].find(n=>Math.abs(n)>1e-12)??1;return{translationMm:t.translationMm.map(To),rotation:a.map(n=>To(s<0?-n:n))}}function Ob(t){let[e,a,s,n]=t.rotation,[r,i,o]=t.translationMm;return[1-2*(a*a+s*s),2*(e*a+s*n),2*(e*s-a*n),0,2*(e*a-s*n),1-2*(e*e+s*s),2*(a*s+e*n),0,2*(e*s+a*n),2*(a*s-e*n),1-2*(e*e+a*a),0,r,i,o,1]}function ko(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let n=0;n<4;n+=1)a[s*4+n]=t[n]*e[s*4]+t[4+n]*e[s*4+1]+t[8+n]*e[s*4+2]+t[12+n]*e[s*4+3];return a}function Pb(t){let e=[t[0],t[4],t[8],0,t[1],t[5],t[9],0,t[2],t[6],t[10],0,0,0,0,1];for(let a=0;a<3;a+=1)e[12+a]=-(e[a]*t[12]+e[4+a]*t[13]+e[8+a]*t[14]);return e}function tr(t,e){return e>0?Math.round(t/e)*e:t}function Io(t,e){let a=e[0]**2+e[1]**2;return a<1e-9?0:(t[0]*e[0]+t[1]*e[1])/a}function So(t,e,a){let s=Math.atan2(e[1]-t[1],e[0]-t[0]),r=Math.atan2(a[1]-t[1],a[0]-t[0])-s;for(;r>Math.PI;)r-=2*Math.PI;for(;r<-Math.PI;)r+=2*Math.PI;return r}function Ro(t,e,a){return xa(t,e)>=0?-a:a}function Ao(t){return er.map(e=>_n(t.rotation,e))}function _o(t,e,a){return{translationMm:t.translationMm.map((s,n)=>s+e[n]*a),rotation:[...t.rotation]}}function No(t,e,a,s){let n=ai(e,a),r=t.translationMm.map((o,c)=>o-s[c]);return{translationMm:_n(n,r).map((o,c)=>o+s[c]),rotation:Za(n,t.rotation)}}function Co(t,e){if(e==null)return null;let a=`/${String(e).split("/")[1]||""}`;return(t?.occurrences||[]).find(s=>s.path===a&&s.depth===1)??null}function Fo(t,e,a){let s=t.occurrences.find(o=>o.path===e);if(!s||s.depth!==1)return t;let n=Ob(a),r=ko(n,Pb(s.worldMatrix)),i=`${e}/`;return{...t,occurrences:t.occurrences.map(o=>o.path===e?{...o,pose:{...Ot(a),source:"manual"},worldMatrix:n}:o.path.startsWith(i)?{...o,worldMatrix:ko(r,o.worldMatrix)}:o)}}function Bo(t){let e=Math.abs(t[0])<.9?[1,0,0]:[0,1,0];return it(pt(t,e))}var Db=Object.freeze([0,1,1,0]),Ms=48,_a=`
struct Occurrence {
  model: mat4x4f,
  normal: mat4x4f,
  hiddenLayers: vec4u,
  explode: vec4f,
};
@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
@group(0) @binding(5) var<storage, read> occurrences: array<Occurrence>;
// The cull pass (SB2-25) lists the occurrences to draw, interleaved by level of
// detail: slot * 4 + list. Components draw for LIST_FULL; copper, barrels,
// silkscreen and paste for LIST_BOARD (full or board); substrate and mask for
// LIST_BODY (full, board or body); the stand-in box for LIST_BOX.
@group(0) @binding(7) var<storage, read> visibleOccurrences: array<u32>;
const LIST_FULL = 0u;
const LIST_BOARD = 1u;
const LIST_BODY = 2u;
const LIST_BOX = 3u;
fn listedOccurrence(list: u32, instance: u32) -> u32 { return visibleOccurrences[instance * 4u + list]; }
// draw.offset.w is the draw's layer id + 1 for copper and paste (0: no layer).
// A draw this occurrence's separation removes: components once exploded, paste whenever separated.
fn explodeHides(occurrence: Occurrence, kind: f32, layerPlusOne: f32) -> bool {
  let explode = occurrence.explode;
  if (explode.w < 0.5) { return false; }
  if (kind > 1.5 && kind < 2.5 && explode.y < 0.5) { return true; }
  return kind < 0.5 && layerPlusOne > 0.5 && explode.x > 0.0;
}
// How far this occurrence lifts a copper or paste draw's layer (0: the draw's own offset stands).
fn explodeLift(occurrence: Occurrence, layerPlusOne: f32) -> f32 {
  if (occurrence.explode.w < 0.5 || layerPlusOne < 0.5) { return 0.0; }
  return layerOffsets[u32(layerPlusOne + 0.5) - 1u] * occurrence.explode.x;
}
fn layerHiddenAt(occurrence: Occurrence, layerPlusOne: f32) -> bool {
  if (layerPlusOne < 0.5) { return false; }
  let layer = u32(layerPlusOne + 0.5) - 1u;
  if (layer >= 128u) { return false; }
  return (occurrence.hiddenLayers[layer / 32u] & (1u << (layer % 32u))) != 0u;
}
`,Xt=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);function Lb(t){let e=t?.matrix??t;if(!e||typeof e.length!="number"||e.length!==16)throw new TypeError("An occurrence matrix must have 16 numbers (column-major)");let a=Array.from(e,Number);if(!a.every(Number.isFinite))throw new TypeError("An occurrence matrix must be finite");if(a[3]!==0||a[7]!==0||a[11]!==0||a[15]!==1)throw new TypeError("An occurrence matrix must be affine (last row 0 0 0 1)");return a}function Ub(t){let[e,a,s,,n,r,i,,o,c,d]=t,b=r*d-c*i,f=c*s-a*d,m=a*i-r*s,p=o*i-n*d,u=e*d-o*s,l=n*s-e*i,y=n*c-o*r,h=o*a-e*c,g=e*r-n*a,x=e*b+n*f+o*m;if(x===0)throw new TypeError("An occurrence matrix must be invertible");let v=x<0?-1:1;return[v*b,v*p,v*y,0,v*f,v*u,v*h,0,v*m,v*l,v*g,0,0,0,0,1]}function Gb(t){let e=new Uint32Array(4);for(let a of t||[]){let s=Number(a);!Number.isInteger(s)||s<0||s>=128||(e[s>>>5]|=1<<(s&31)>>>0)}return e}function Es(t,e=[],a=[]){let s=new Float32Array(Math.max(1,t.length)*40),n=new Uint32Array(s.buffer);return t.forEach((r,i)=>{let o=i*40;s.set(r,o),s.set(Ub(r),o+16),e[i]&&n.set(Gb(e[i]),o+32),s.set(a[i]||Db,o+36)}),s}function jo(t){let e=new ArrayBuffer(Math.max(1,t.length)*Ms),a=new DataView(e);return t.forEach((s,n)=>{let r=n*Ms;a.setFloat32(r,s.centerMm[0]/1e3,!0),a.setFloat32(r+4,-s.centerMm[1]/1e3,!0),a.setFloat32(r+8,Math.min(s.drillWidthMm,s.drillHeightMm)/2e3,!0),a.setFloat32(r+12,Math.max(s.outerWidthMm,s.outerHeightMm)/2e3,!0),a.setFloat32(r+16,s.startZMm/1e3,!0),a.setFloat32(r+20,s.endZMm/1e3,!0),a.setUint32(r+32,s.netId||0,!0),a.setUint32(r+36,s.objectFeatureId||0,!0),a.setUint32(r+40,s.startLayerId||0,!0),a.setUint32(r+44,s.endLayerId||0,!0)}),e}function Ts(t,e){let[a,s,n]=e;return[t[0]*a+t[4]*s+t[8]*n+t[12],t[1]*a+t[5]*s+t[9]*n+t[13],t[2]*a+t[6]*s+t[10]*n+t[14]]}function ia(t,e){if(!e)return null;let a=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let s=0;s<8;s+=1){let n=Ts(t,[e[s&1?3:0],e[s&2?4:1],e[s&4?5:2]]);for(let r=0;r<3;r+=1)a[r]=Math.min(a[r],n[r]),a[r+3]=Math.max(a[r+3],n[r])}return a}function ks(t){return t.every((e,a)=>e===Xt[a])}var Kb=0,zb=4294901759;function Oo(t,e){let a=t>>>0,s=e>>>0;return a===Kb?{kind:"none",occurrenceIndex:-1,featureId:0}:{kind:s?"feature":"board",occurrenceIndex:a-1,featureId:s}}function Po(t){let e=Array.from(t);if(e.length>zb)throw new RangeError("Too many occurrences for the pick target");let a=e.map(Lb),s=o=>o&&!Array.isArray(o)&&!ArrayBuffer.isView(o),n=e.map((o,c)=>s(o)&&o.key!=null?String(o.key):String(c));if(new Set(n).size!==n.length)throw new TypeError("Occurrence keys must be unique");let r=e.map(o=>s(o)&&o.hiddenLayers?[...o.hiddenLayers].map(Number):[]),i=e.map(o=>s(o)&&o.explode?[...o.explode].map(Number):null);return{matrices:a,keys:n,hiddenLayers:r,explode:i}}function Na(t,e,a){let[s,n,r]=e,i=t[0]*s+t[4]*n+t[8]*r+t[12],o=t[1]*s+t[5]*n+t[9]*r+t[13],c=t[2]*s+t[6]*n+t[10]*r+t[14],d=t[3]*s+t[7]*n+t[11]*r+t[15];return!(d>0)||c<0||c>d?null:{x:a.x+(i/d*.5+.5)*a.width,y:a.y+(.5-o/d*.5)*a.height}}var Do=0;var Lo=3,ar=4,Ew=Object.freeze(["full","board","body","box"]),qe=Object.freeze({fullPx:140,boardPx:70,boxPx:18,keep:.8});function oa(t={}){let e=(i,o)=>Number.isFinite(Number(t[i]))?Math.max(0,Number(t[i])):o,a=e("boxPx",qe.boxPx),s=Math.max(a,e("boardPx",qe.boardPx)),n=Math.max(s,e("fullPx",qe.fullPx)),r=Math.min(1,Math.max(.05,e("keep",qe.keep)));return{fullPx:n,boardPx:s,boxPx:a,keep:r}}function Uo(t){let e=c=>[t[c],t[4+c],t[8+c],t[12+c]],[a,s,n,r]=[e(0),e(1),e(2),e(3)],i=(c,d)=>c.map((b,f)=>b+d[f]),o=(c,d)=>c.map((b,f)=>b-d[f]);return[i(r,a),o(r,a),i(r,s),o(r,s),n,o(r,n)]}var sr=`
fn featureHidden(id: u32) -> bool {
  return id < arrayLength(&hiddenMask) && hiddenMask[id] == 0u;
}
`;function Is(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function Go(t,e=0){let a=0;for(let r of Is(t))a=Math.max(a,r);let s=64,n=a+1;for(;s<n;)s*=2;return Math.max(s,Math.floor(e)||0)}function Ko(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(1);for(let n of Is(t))n<a&&(s[n]=0);return s}var zo=40,et=256,Vo=112,Pt="rg32uint",ca=et/4,Xb=256,Wb={compare:"always",passOp:"zero"},$b={compare:"always",passOp:"replace"},Jb={compare:"not-equal",passOp:"keep"},Yb={compare:"equal",passOp:"keep"},Wo=`
struct Globals {
  viewProjection: mat4x4f,
  activeNet: u32,
  selectedLayer: u32,
  time: f32,
  hasHighlight: f32,
  selectedFeature: u32,
  padding0: u32,
  padding1: u32,
  padding2: u32,
  lightDirection: vec4f,
};
struct Draw {
  color: vec4f,
  material: vec4f,
  offset: vec4f,
  flags: vec4f,
};
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<uniform> draw: Draw;
@group(0) @binding(3) var<storage, read> hiddenMask: array<u32>;
@group(0) @binding(4) var<storage, read> netMask: array<u32>;
${sr}
${Ta}
// Set on the pipeline that draws the solder mask over copper.
override COVERED: bool = false;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) netId: u32,
  @location(3) objectId: u32,
  @location(4) layerId: u32,
  @location(5) materialId: u32,
};
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) @interpolate(flat) netId: u32,
  @location(2) @interpolate(flat) objectId: u32,
  @location(3) world: vec3f,
};
@vertex fn vs(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.world = input.position + draw.offset.xyz;
  output.position = globals.viewProjection * vec4f(output.world, 1.0);
  output.normal = normalize(input.normal);
  output.netId = input.netId;
  output.objectId = input.objectId;
  return output;
}
fn aces(color: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3f(0), vec3f(1));
}
@fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
  let kind = u32(draw.flags.x);
  let copper = kind == 1u;
  let component = kind == 2u;
  if (component && featureHidden(input.objectId)) { discard; }
  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);
  let selectedComponent = component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;
  var base = draw.color.rgb;
  if (COVERED) {
    // Mask over copper reads lighter, as in KiCad.
    base = min(base * 1.6 + vec3f(0.03, 0.05, 0.02), vec3f(1.0));
  }
  if (selected && copper) {
    if (draw.flags.z < 0.5) {
      let pulse = 0.88 + 0.12 * sin(globals.time * 3.2);
      base = vec3f(0.08, 1.0, 0.2) * pulse;
    }
  } else if (globals.hasHighlight > 0.5 && copper) {
    base = mix(base, vec3f(0.12, 0.14, 0.17), 0.58);
  }
  if (selectedComponent) {
    let pulse = 0.84 + 0.16 * sin(globals.time * 3.6);
    base = mix(base, vec3f(0.15, 0.72, 1.0) * pulse, 0.72);
  }
  if (draw.flags.z > 0.5 && copper && !selected) { discard; }
  let normal = normalize(input.normal);
  // Light each side of the board from its own side, as KiCad does, so the
  // bottom reads as clearly as the top.
  let side = vec3f(1.0, 1.0, select(1.0, -1.0, normal.z < 0.0));
  let light = normalize(globals.lightDirection.xyz * side);
  let diffuse = max(dot(normal, light), 0.0);
  let hemi = mix(0.28, 0.62, abs(normal.z) * 0.5 + 0.5);
  let roughness = clamp(draw.material.y, 0.05, 1.0);
  let metallic = clamp(draw.material.x, 0.0, 1.0);
  let specular = pow(max(dot(normal, normalize(light + vec3f(0.3, -0.4, 0.85) * side)), 0.0), mix(96.0, 6.0, roughness));
  let shaded = base * (hemi + diffuse * 0.72) + mix(vec3f(0.04), base, metallic) * specular * 0.5;
  var lit = shaded;
  if (draw.flags.w > 0.5) {
    lit = base;
  }
  var alpha = draw.flags.y;
  // Translucent placeholders (material.z = full component opacity) turn solid when selected.
  if (selectedComponent) { alpha = max(alpha, draw.material.z * 0.9); }
  if (COVERED) { alpha = min(1.0, alpha * 1.2); }
  return vec4f(aces(lit), alpha);
}
`,$o=`
struct Globals {
  viewProjection: mat4x4f,
  activeNet: u32,
  selectedLayer: u32,
  time: f32,
  hasHighlight: f32,
  selectedFeature: u32,
  padding0: u32,
  padding1: u32,
  padding2: u32,
  lightDirection: vec4f,
};
struct Draw { color: vec4f, material: vec4f, offset: vec4f, flags: vec4f };
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<uniform> draw: Draw;
@group(0) @binding(3) var<storage, read> hiddenMask: array<u32>;
@group(0) @binding(4) var<storage, read> netMask: array<u32>;
${sr}
${Ta}
struct Input {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) netId: u32,
  @location(3) objectId: u32,
  @location(4) layerId: u32,
  @location(5) materialId: u32,
};
struct Output {
  @builtin(position) position: vec4f,
  @location(2) @interpolate(flat) netId: u32,
  @location(0) @interpolate(flat) objectId: u32,
};
@vertex fn vs(input: Input) -> Output {
  var output: Output;
  output.position = globals.viewProjection * vec4f(input.position + draw.offset.xyz, 1.0);
  output.objectId = input.objectId;
  output.netId = input.netId;
  return output;
}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  if (u32(draw.flags.x) == 2u && featureHidden(input.objectId)) { discard; }
  // Isolated (flags.z), unlit copper is not drawn, so it is not there to pick (SB2-31e).
  let lit = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);
  if (u32(draw.flags.x) == 1u && draw.flags.z > 0.5 && !lit) { discard; }
  return vec2u(1u, input.objectId);
}
`,Jo=`
struct Globals {
  viewProjection: mat4x4f,
  activeNet: u32,
  selectedLayer: u32,
  time: f32,
  hasHighlight: f32,
  selectedFeature: u32,
  padding0: u32,
  padding1: u32,
  padding2: u32,
  lightDirection: vec4f,
};
struct Draw { color: vec4f, material: vec4f, offset: vec4f, flags: vec4f };
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<uniform> draw: Draw;
@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
@group(0) @binding(4) var<storage, read> netMask: array<u32>;
${Ta}
struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
  @location(3) dimensions: vec4f,
  @location(4) span: vec2f,
  @location(5) ids: vec4u,
};
struct Output {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) @interpolate(flat) netId: u32,
  @location(2) @interpolate(flat) objectId: u32,
  @location(3) @interpolate(flat) visible: u32,
};
@vertex fn vs(input: Input) -> Output {
  let radius = mix(input.dimensions.z, input.dimensions.w, input.radiusMix);
  let z0 = input.span.x + layerOffsets[input.ids.z];
  let z1 = input.span.y + layerOffsets[input.ids.w];
  let world = vec3f(
    input.dimensions.x + input.unit.x * radius,
    input.dimensions.y + input.unit.y * radius,
    mix(z0, z1, input.unit.z)
  );
  var output: Output;
  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.normal = input.normal;
  output.netId = input.ids.x;
  output.objectId = input.ids.y;
  output.visible = 0u;
  if (globals.selectedLayer == 0u || (globals.selectedLayer >= input.ids.z && globals.selectedLayer <= input.ids.w)) {
    output.visible = 1u;
  }
  return output;
}
@fragment fn fs(input: Output) -> @location(0) vec4f {
  if (input.visible == 0u) { discard; }
  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);
  var base = draw.color.rgb;
  if (selected) {
    if (draw.flags.z < 0.5) {
      base = vec3f(0.1, 1.0, 0.22) * (0.88 + 0.12 * sin(globals.time * 3.2));
    }
  } else if (globals.hasHighlight > 0.5) {
    base = mix(base, vec3f(0.12, 0.14, 0.17), 0.58);
  }
  if (draw.flags.z > 0.5 && !selected) { discard; }
  let light = normalize(globals.lightDirection.xyz);
  let lit = base * (0.38 + max(dot(normalize(input.normal), light), 0.0) * 0.72);
  return vec4f(lit, 1.0);
}
`,Yo=`
struct Globals {
  viewProjection: mat4x4f,
  activeNet: u32,
  selectedLayer: u32,
  time: f32,
  hasHighlight: f32,
  selectedFeature: u32,
  padding0: u32,
  padding1: u32,
  padding2: u32,
  lightDirection: vec4f,
};
struct Draw { color: vec4f, material: vec4f, offset: vec4f, flags: vec4f };
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<uniform> draw: Draw;
@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
@group(0) @binding(4) var<storage, read> netMask: array<u32>;
${Ta}
struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
  @location(3) dimensions: vec4f,
  @location(4) span: vec2f,
  @location(5) ids: vec4u,
};
struct Output {
  @builtin(position) position: vec4f,
  @location(3) @interpolate(flat) netId: u32,
  @location(0) @interpolate(flat) objectId: u32,
  @location(1) @interpolate(flat) visible: u32,
};
@vertex fn vs(input: Input) -> Output {
  let radius = mix(input.dimensions.z, input.dimensions.w, input.radiusMix);
  let world = vec3f(
    input.dimensions.x + input.unit.x * radius,
    input.dimensions.y + input.unit.y * radius,
    mix(input.span.x + layerOffsets[input.ids.z], input.span.y + layerOffsets[input.ids.w], input.unit.z)
  );
  var output: Output;
  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.objectId = input.ids.y;
  output.netId = input.ids.x;
  output.visible = 0u;
  if (globals.selectedLayer == 0u || (globals.selectedLayer >= input.ids.z && globals.selectedLayer <= input.ids.w)) {
    output.visible = 1u;
  }
  return output;
}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  if (input.visible == 0u) { discard; }
  let lit = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);
  if (draw.flags.z > 0.5 && !lit) { discard; }
  return vec2u(1u, input.objectId);
}
`;function nr(t,e){return e.reduce((a,[s,n])=>{if(a.split(s).length!==2)throw new Error(`Shader variant anchor not found once: ${s.slice(0,60)}`);return a.replace(s,()=>n)},t)}var rr=[`  padding0: u32,
  padding1: u32,`,`  selectedOccurrence: u32,
  occurrenceBase: u32,`],Rs=[["  padding2: u32,","  emphasisStride: u32,"],["fn netEmphasized(id: u32) -> bool {",`${xi}fn netEmphasized(id: u32) -> bool {`]],Qo="  let lit = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",Zo=`  let lit = emphasisOf(input.occurrence, input.netId) != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`,ec=nr(Wo,[rr,[`  @location(3) world: vec3f,
};`,`  @location(3) world: vec3f,
  @location(4) @interpolate(flat) occurrence: u32,
  // Mask and silkscreen opacity of this occurrence's own stackup separation (SB2-31f).
  @location(5) @interpolate(flat) fade: f32,
};`],[`@vertex fn vs(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.world = input.position + draw.offset.xyz;
  output.position = globals.viewProjection * vec4f(output.world, 1.0);
  output.normal = normalize(input.normal);`,`${_a}
@vertex fn vs(input: VertexInput, @builtin(instance_index) instance: u32) -> VertexOutput {
  // Full-detail draws (components; inner copper behind an opaque board) list only
  // occurrences at full detail (draw.material.w = LIST_FULL); copper and the
  // like list full or board, substrate and mask full, board or body.
  let index = listedOccurrence(u32(draw.material.w + 0.5), instance);
  let occurrence = occurrences[index];
  var output: VertexOutput;
  let lift = vec3f(0.0, 0.0, explodeLift(occurrence, draw.offset.w));
  output.world = (occurrence.model * vec4f(input.position + draw.offset.xyz + lift, 1.0)).xyz;
  output.position = globals.viewProjection * vec4f(output.world, 1.0);
  output.normal = normalize((occurrence.normal * vec4f(input.normal, 0.0)).xyz);
  output.occurrence = index + 1u + globals.occurrenceBase;
  output.fade = select(1.0, occurrence.explode.z, occurrence.explode.w > 0.5 && draw.flags.x < 0.5);
  // A layer this copy hides (SB2-31e), or a draw its separation removes (SB2-31f), collapses outside the clip volume.
  if (layerHiddenAt(occurrence, draw.offset.w) || explodeHides(occurrence, draw.flags.x, draw.offset.w)) {
    output.position = vec4f(0.0, 0.0, 2.0, 1.0);
  }`],[`  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);
  let selectedComponent = component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;`,`  // The inspected selection lights its own copy; host-highlighted nets light every copy.
  let here = input.occurrence == globals.selectedOccurrence;
  let mark = emphasisOf(input.occurrence, input.netId);
  let selected = mark != 0u || (here && globals.activeNet != 0u && input.netId == globals.activeNet);
  let selectedComponent = here && component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;`],...Rs,["      base = vec3f(0.08, 1.0, 0.2) * pulse;","      base = emphasisColor(mark, vec3f(0.08, 1.0, 0.2)) * pulse;"],["  var alpha = draw.flags.y;","  var alpha = draw.flags.y * input.fade;"]]),tc=nr($o,[rr,[`  @location(0) @interpolate(flat) objectId: u32,
};`,`  @location(0) @interpolate(flat) objectId: u32,
  @location(1) @interpolate(flat) occurrence: u32,
};`],[`@vertex fn vs(input: Input) -> Output {
  var output: Output;
  output.position = globals.viewProjection * vec4f(input.position + draw.offset.xyz, 1.0);`,`${_a}
@vertex fn vs(input: Input, @builtin(instance_index) instance: u32) -> Output {
  let index = listedOccurrence(u32(draw.material.w + 0.5), instance);
  let occurrence = occurrences[index];
  let lift = vec3f(0.0, 0.0, explodeLift(occurrence, draw.offset.w));
  let world = (occurrence.model * vec4f(input.position + draw.offset.xyz + lift, 1.0)).xyz;
  var output: Output;
  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.occurrence = index + 1u + globals.occurrenceBase;
  if (layerHiddenAt(occurrence, draw.offset.w) || explodeHides(occurrence, draw.flags.x, draw.offset.w)) {
    output.position = vec4f(0.0, 0.0, 2.0, 1.0);
  }`],["  return vec2u(1u, input.objectId);",`  let kind = u32(draw.flags.x);
  return vec2u(input.occurrence, select(input.objectId, 0u, kind == 0u));`],...Rs,[Qo,Zo]]),Qb=`struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
  @location(3) dimensions: vec4f,
  @location(4) span: vec2f,
  @location(5) ids: vec4u,
};`,Zb=`struct Barrel {
  dimensions: vec4f,
  span: vec2f,
  ids: vec4u,
};
@group(0) @binding(6) var<storage, read> barrels: array<Barrel>;
${_a}
struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
};`;function ac(t,e,a=[]){return nr(t,[rr,[`@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
`,""],[Qb,Zb],["@vertex fn vs(input: Input) -> Output {",`struct Record {
  unit: vec3f,
  normal: vec3f,
  radiusMix: f32,
  dimensions: vec4f,
  span: vec2f,
  ids: vec4u,
};
@vertex fn vs(vertex: Input, @builtin(instance_index) instance: u32) -> Output {
  let count = arrayLength(&barrels);
  let barrel = barrels[instance % count];
  let index = listedOccurrence(LIST_BOARD, instance / count);
  let occurrence = occurrences[index];
  // An occurrence that explodes itself (SB2-31f) scales the renderer's per-layer steps by its own gap.
  let spread = select(1.0, occurrence.explode.x, occurrence.explode.w > 0.5);
  let input = Record(vertex.unit, vertex.normal, vertex.radiusMix, barrel.dimensions, barrel.span, barrel.ids);`],[e,e.replace("vec4f(world, 1.0)","vec4f((occurrence.model * vec4f(world, 1.0)).xyz, 1.0)")],["  output.objectId = input.ids.y;",`  output.objectId = input.ids.y;
  output.occurrence = index + 1u + globals.occurrenceBase;`],...a])}var sc=ac(Jo,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.normal = input.normal;`,[[`  let z0 = input.span.x + layerOffsets[input.ids.z];
  let z1 = input.span.y + layerOffsets[input.ids.w];`,`  let z0 = input.span.x + layerOffsets[input.ids.z] * spread;
  let z1 = input.span.y + layerOffsets[input.ids.w] * spread;`],[`  output.normal = input.normal;
  output.netId`,`  output.normal = (occurrence.normal * vec4f(input.normal, 0.0)).xyz;
  output.netId`],[`  @location(3) @interpolate(flat) visible: u32,
};`,`  @location(3) @interpolate(flat) visible: u32,
  @location(4) @interpolate(flat) occurrence: u32,
};`],["  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",`  let mark = emphasisOf(input.occurrence, input.netId);
  let selected = mark != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`],...Rs,["      base = vec3f(0.1, 1.0, 0.22) * (","      base = emphasisColor(mark, vec3f(0.1, 1.0, 0.22)) * ("]]),nc=ac(Yo,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.objectId`,[["mix(input.span.x + layerOffsets[input.ids.z], input.span.y + layerOffsets[input.ids.w], input.unit.z)","mix(input.span.x + layerOffsets[input.ids.z] * spread, input.span.y + layerOffsets[input.ids.w] * spread, input.unit.z)"],[`  @location(1) @interpolate(flat) visible: u32,
};`,`  @location(1) @interpolate(flat) visible: u32,
  @location(2) @interpolate(flat) occurrence: u32,
};`],["  return vec2u(1u, input.objectId);","  return vec2u(input.occurrence, input.objectId);"],...Rs,[Qo,Zo]]),rc=`
struct Globals {
  viewProjection: mat4x4f,
  activeNet: u32,
  selectedLayer: u32,
  time: f32,
  hasHighlight: f32,
  selectedFeature: u32,
  selectedOccurrence: u32,
  occurrenceBase: u32,
  padding2: u32,
  lightDirection: vec4f,
};
struct Draw { color: vec4f, material: vec4f, offset: vec4f, flags: vec4f };
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<uniform> draw: Draw;
${_a}
struct Input {
  @location(0) corner: vec3f,
  @location(1) normal: vec3f,
};
struct Output {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) @interpolate(flat) occurrence: u32,
};
@vertex fn vs(input: Input, @builtin(instance_index) instance: u32) -> Output {
  let index = listedOccurrence(LIST_BOX, instance);
  let occurrence = occurrences[index];
  let local = draw.offset.xyz + input.corner * draw.material.xyz;
  var output: Output;
  output.position = globals.viewProjection * vec4f((occurrence.model * vec4f(local, 1.0)).xyz, 1.0);
  output.normal = (occurrence.normal * vec4f(input.normal, 0.0)).xyz;
  output.occurrence = index + 1u + globals.occurrenceBase;
  return output;
}
`,ic=`${rc}
@fragment fn fs(input: Output) -> @location(0) vec4f {
  let light = normalize(globals.lightDirection.xyz);
  return vec4f(draw.color.rgb * (0.45 + max(dot(normalize(input.normal), light), 0.0) * 0.55), 1.0);
}
`,oc=`${rc}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  return vec2u(input.occurrence, 0u);
}
`,cc=`
struct Occurrence {
  model: mat4x4f,
  normal: mat4x4f,
  hiddenLayers: vec4u,
  explode: vec4f,
};
struct Cull {
  planes: array<vec4f, 6>,
  eye: vec4f,
  boundsMin: vec4f,
  boundsMax: vec4f,
  lod: vec4f,
  info: vec4u,
  extra: vec4u,
};
@group(0) @binding(0) var<uniform> cull: Cull;
@group(0) @binding(1) var<storage, read> occurrences: array<Occurrence>;
@group(0) @binding(2) var<storage, read_write> lods: array<u32>;
@group(0) @binding(3) var<storage, read_write> lists: array<u32>;
@group(0) @binding(4) var<storage, read_write> counters: array<atomic<u32>, 4>;
@group(0) @binding(5) var<storage, read_write> args: array<u32>;
@group(0) @binding(6) var<storage, read> classes: array<u32>;

fn chooseLod(previous: u32, pixels: f32) -> u32 {
  var limits = array<f32, 3>(cull.lod.y, bitcast<f32>(cull.extra.y), cull.lod.z);
  let keep = cull.lod.w;
  var lod = 3u;
  if (pixels >= limits[2]) { lod = 2u; }
  if (pixels >= limits[1]) { lod = 1u; }
  if (pixels >= limits[0]) { lod = 0u; }
  for (var level = 0u; level < lod; level += 1u) {
    if (previous <= level && pixels >= limits[level] * keep) { return level; }
  }
  return lod;
}

@compute @workgroup_size(64) fn classify(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= cull.info.x) { return; }
  let model = occurrences[i].model;
  var lo = vec3f(3.0e38);
  var hi = vec3f(-3.0e38);
  for (var corner = 0u; corner < 8u; corner += 1u) {
    let local = vec3f(
      select(cull.boundsMin.x, cull.boundsMax.x, (corner & 1u) != 0u),
      select(cull.boundsMin.y, cull.boundsMax.y, (corner & 2u) != 0u),
      select(cull.boundsMin.z, cull.boundsMax.z, (corner & 4u) != 0u));
    let point = (model * vec4f(local, 1.0)).xyz;
    lo = min(lo, point);
    hi = max(hi, point);
  }
  var inside = true;
  for (var k = 0u; k < 6u; k += 1u) {
    let plane = cull.planes[k];
    let far = select(lo, hi, plane.xyz >= vec3f(0.0));
    if (dot(plane.xyz, far) + plane.w < 0.0) { inside = false; }
  }
  var lod = 3u;
  if (inside) {
    let center = (lo + hi) * 0.5;
    let radius = length(hi - lo) * 0.5;
    // Perspective: pixels per unit at unit distance over the distance; orthographic: per unit.
    let distance = select(1.0, max(length(center - cull.eye.xyz), 1.0e-6), cull.eye.w > 0.5);
    lod = chooseLod(lods[i], radius * cull.lod.x / distance);
    if (cull.info.z != 0u) { lod = cull.info.z - 1u; }
    if (i + 1u == cull.info.y) { lod = 0u; }
  }
  lods[i] = lod;
  if (lod == 0u) { lists[atomicAdd(&counters[0], 1u) * 4u] = i; }
  if (lod <= 1u) { lists[atomicAdd(&counters[1], 1u) * 4u + 1u] = i; }
  if (lod <= 2u) { lists[atomicAdd(&counters[2], 1u) * 4u + 2u] = i; }
  if (lod == 3u) { lists[atomicAdd(&counters[3], 1u) * 4u + 3u] = i; }
}

@compute @workgroup_size(64) fn writeArgs(@builtin(global_invocation_id) id: vec3u) {
  let slot = id.x;
  if (slot >= cull.info.w) { return; }
  let full = atomicLoad(&counters[0]);
  let board = atomicLoad(&counters[1]);
  let body = atomicLoad(&counters[2]);
  let box = atomicLoad(&counters[3]);
  let kind = classes[slot];
  var count = 0u;
  if (kind == 0u) { count = board; }
  else if (kind == 1u) { count = full; }
  else if (kind == 2u) { count = board * cull.extra.x; }
  else if (kind == 3u) { count = box; }
  else if (kind == 5u) { count = body; }
  args[slot * 5u + 1u] = count;
}
`,Ho=[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}],Aw=Object.freeze({main:ec,pick:tc,barrel:sc,barrelPick:nc,box:ic,boxPick:oc,cull:cc}),Wt=class t{static async create(e){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)throw new Error("No WebGPU adapter is available");let s=a.features.has("depth32float-stencil8"),n=await a.requestDevice(s?{requiredFeatures:["depth32float-stencil8"]}:void 0);return new t(e,n,{stencil:s})}constructor(e,a,{shareFrom:s=null,stencil:n=!1}={}){if(this.canvas=e,this.device=a,this.shareFrom=s,this.stencil=s?s.stencil:!!n,this.depthFormat=this.stencil?"depth32float-stencil8":"depth32float",this.version=0,this.barrelColor=[.55,.35,.16,.78],this.alwaysInstanced=!!s,this.occurrenceBase=0,s?(this.context=s.context,this.format=s.format):(a.addEventListener("uncapturederror",r=>{console.error(`Uncaptured WebGPU error: ${r.error?.message||r.error}`)}),a.lost.then(r=>{r.reason!=="destroyed"&&console.error(`WebGPU device lost: ${r.reason}`,r.message)}),this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"})),this.entries=[],this.barrels=null,this.drawSlotCapacity=Xb,this.drawSlotBuffer=this.createDrawSlotBuffer(this.drawSlotCapacity),this.drawStaging=new Float32Array(this.drawSlotCapacity*ca),this.freeDrawSlots=[],this.nextDrawSlot=0,this.globalBuffer=a.createBuffer({size:Vo,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.layerOffsetBuffer=a.createBuffer({size:1024,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.occurrenceMatrices=[[...Xt]],this.occurrenceKeys=["0"],this.occurrenceHiddenLayers=[[]],this.occurrenceExplode=[null],this.identityOnly=!0,this.occurrenceCapacity=1,this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.device.queue.writeBuffer(this.occurrenceBuffer,0,Es(this.occurrenceMatrices)),this.barrelRecordBuffer=a.createBuffer({label:"barrel-records",size:Ms,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.instancedPipelines=null,this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.slotCapacity=0,this.slotArgs=new Uint32Array(0),this.slotClasses=new Uint32Array(0),this.freeSlots=[],this.nextSlot=2,this.argsBuffer=null,this.classesBuffer=null,this.growSlots(256),this.setSlot(0,0,4),this.setSlot(1,0,4),this.cull=null,this.box=null,this.boardBounds=null,this.selectedOccurrence=-1,this.lodOverride=null,this.lodThresholds={...qe},this.innerCopperAtFull=!0,this.cullCounts={full:0,board:0,body:0,box:0,culled:0},this.frameStats={triangles:0,draws:0},this.boxColor=[.24,.36,.28,1],s)for(let r of["bindGroupLayout","pipelineLayout","vertexBuffers","pipeline","pickPipeline","barrelPipeline","barrelPickPipeline","singlePipelines"])this[r]=s[r];else this.createSinglePipelines();this.depth=null,this.pickTexture=null,this.pickSerial=Promise.resolve(),this.bundleCache=new Map,this.globalScratch=new ArrayBuffer(Vo),this.globalScratchF32=new Float32Array(this.globalScratch),this.globalScratchView=new DataView(this.globalScratch),this.barrelDrawScratch=new Float32Array(et/4),this.nextEntryId=1,this.hiddenFeatureIds=new Set,this.showPlaceholders=!0,this.featureMaskCapacity=64,this.featureMaskBuffer=this.createFeatureMaskBuffer(this.featureMaskCapacity),this.uploadFeatureMask(),this.emphasizedNetIds=new Set,this.occurrenceEmphasis=null,this.emphasisStride=0,this.dimCopper=!1,this.netMaskCapacity=64,this.netMaskBuffer=this.createNetMaskBuffer(this.netMaskCapacity),this.uploadNetMask(),s&&this.setOccurrences([])}createSinglePipelines(){let e=this.device;this.bindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:5,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:6,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:7,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]});let a=e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]});this.pipelineLayout=a;let s=this.vertexBuffers=[{arrayStride:zo,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"uint32"},{shaderLocation:3,offset:28,format:"uint32"},{shaderLocation:4,offset:32,format:"uint32"},{shaderLocation:5,offset:36,format:"uint32"}]}];this.singlePipelines={...this.makeMainPipelines(Wo,""),pick:this.makePipeline(a,$o,Pt,s,"pick"),barrel:this.makeBarrelPipeline(a,Jo,this.format,"barrel"),barrelPick:this.makeBarrelPipeline(a,Yo,Pt,"barrel-pick")},this.pipeline=this.singlePipelines.main,this.pickPipeline=this.singlePipelines.pick,this.barrelPipeline=this.singlePipelines.barrel,this.barrelPickPipeline=this.singlePipelines.barrelPick}makeMainPipelines(e,a){let s=this.pipelineLayout,n=this.vertexBuffers,r=(c,d)=>this.makePipeline(s,e,this.format,n,`${c}${a}`,d),i=r("main",{stencil:Wb}),o=r("main-blend");return{main:i,mark:this.stencil?r("main-mark",{stencil:$b}):i,blend:o,mask:this.stencil?r("mask",{stencil:Jb}):o,maskCovered:this.stencil?r("mask-covered",{stencil:Yb,constants:{COVERED:1}}):null}}createOccurrenceBuffer(e){return this.device.createBuffer({label:"occurrences",size:e*160,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createListBuffer(e){return this.device.createBuffer({label:"visible-occurrences",size:e*4*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}growSlots(e){let a=new Uint32Array(e*5);a.set(this.slotArgs);let s=new Uint32Array(e).fill(4);s.set(this.slotClasses),this.slotArgs=a,this.slotClasses=s,this.slotCapacity=e,this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.(),this.argsBuffer=this.device.createBuffer({label:"indirect-args",size:a.byteLength,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.classesBuffer=this.device.createBuffer({label:"draw-classes",size:s.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.argsBuffer,0,a),this.device.queue.writeBuffer(this.classesBuffer,0,s),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache?.clear()}setSlot(e,a,s){this.slotArgs.fill(0,e*5,e*5+5),this.slotArgs[e*5]=a,this.slotClasses[e]=s,this.device.queue.writeBuffer(this.argsBuffer,e*20,this.slotArgs,e*5,5),this.device.queue.writeBuffer(this.classesBuffer,e*4,this.slotClasses,e,1)}allocSlot(e,a){let s=this.freeSlots.length?this.freeSlots.pop():this.nextSlot++;return s>=this.slotCapacity&&this.growSlots(this.slotCapacity*2),this.setSlot(s,e,a),s}get occurrenceCount(){return this.occurrenceMatrices.length}setOccurrences(e){let{matrices:a,keys:s,hiddenLayers:n,explode:r}=Po(e??[Xt]);this.occurrenceMatrices=a,this.occurrenceKeys=s,this.occurrenceHiddenLayers=n,this.occurrenceExplode=r,this.identityOnly=!this.alwaysInstanced&&a.length===1&&ks(a[0]),this.identityOnly||this.ensureInstancedPipelines(),a.length>this.occurrenceCapacity&&(this.occurrenceBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.occurrenceCapacity=Math.max(a.length,this.occurrenceCapacity*2),this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.cull&&(this.cull.lods.destroy(),this.cull.lods=this.createLodBuffer(this.occurrenceCapacity)),this.rebindAll()),a.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,Es(a,n,r)),this.cull&&this.device.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(ar)),this.selectedOccurrence>=a.length&&(this.selectedOccurrence=-1),this.bundleCache.clear(),this.invalidate()}setOccurrenceHiddenLayers(e){this.occurrenceHiddenLayers=this.occurrenceMatrices.map((a,s)=>[...e?.[s]||[]].map(Number)),this.writeOccurrenceRecords()}setOccurrenceExplode(e){this.occurrenceExplode=this.occurrenceMatrices.map((a,s)=>e?.[s]?[...e[s]].map(Number):null),this.writeOccurrenceRecords()}writeOccurrenceRecords(){this.occurrenceMatrices.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,Es(this.occurrenceMatrices,this.occurrenceHiddenLayers,this.occurrenceExplode)),this.invalidate()}setInnerCopperAtFull(e){if(this.innerCopperAtFull!==e){this.innerCopperAtFull=e;for(let a of this.entries)a.innerCopper&&(a.drawClass=qo(a,e),this.setSlot(a.slot,a.indexCount,a.drawClass));this.invalidate()}}setBoardBounds(e){this.boardBounds=e?[...e]:null,this.invalidate()}setLodThresholds(e){this.lodThresholds=oa({...this.lodThresholds,...e}),this.invalidate()}setLodOverride(e){this.lodOverride=e==null?null:Number(e),this.invalidate()}createLodBuffer(e){return this.device.createBuffer({label:"occurrence-lods",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createCull(){let e=this.device,a=this.shareFrom?.cull,s=i=>({visibility:GPUShaderStage.COMPUTE,buffer:{type:i}}),n=a?.layout||e.createBindGroupLayout({label:"cull",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,...s("read-only-storage")},{binding:2,...s("storage")},{binding:3,...s("storage")},{binding:4,...s("storage")},{binding:5,...s("storage")},{binding:6,...s("read-only-storage")}]}),r=a&&{layout:n,classify:a.classify,writeArgs:a.writeArgs};if(!r){let i=this.createShaderModule(cc,"cull"),o=e.createPipelineLayout({bindGroupLayouts:[n]});r={layout:n,classify:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"classify"}}),writeArgs:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"writeArgs"}})}}this.cull={...r,uniform:e.createBuffer({label:"cull-params",size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),lods:this.createLodBuffer(this.occurrenceCapacity),counters:e.createBuffer({label:"cull-counters",size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),readback:e.createBuffer({label:"cull-readback",size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),scratch:new ArrayBuffer(192),reading:!1,readAt:0,bindGroup:null},e.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(ar)),this.cull.bindGroup=this.makeCullBindGroup()}makeCullBindGroup(){return this.device.createBindGroup({layout:this.cull.layout,entries:[{binding:0,resource:{buffer:this.cull.uniform}},{binding:1,resource:{buffer:this.occurrenceBuffer}},{binding:2,resource:{buffer:this.cull.lods}},{binding:3,resource:{buffer:this.listBuffer}},{binding:4,resource:{buffer:this.cull.counters}},{binding:5,resource:{buffer:this.argsBuffer}},{binding:6,resource:{buffer:this.classesBuffer}}]})}createBox(){let e=[[[1,0,0],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[[-1,0,0],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],[[0,1,0],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[[0,0,1],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],[[0,0,-1],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]],a=[],s=[];e.forEach(([d,b],f)=>{for(let p of b)a.push(...p,...d);let m=f*4;s.push(m,m+1,m+2,m,m+2,m+3)});let n=new Float32Array(a),r=new Uint16Array(s),i=this.device.createBuffer({label:"box-vertices",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),o=this.device.createBuffer({label:"box-indices",size:r.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(i,0,n),this.device.queue.writeBuffer(o,0,r);let c=this.device.createBuffer({size:et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.box={vertexBuffer:i,indexBuffer:o,indexCount:r.length,drawBuffer:c,bindGroup:this.makeBindGroup(c),scratch:new Float32Array(et/4)},this.setSlot(1,r.length,3)}writeBoxDraw(){let e=this.box.scratch,[a,s,n,r,i,o]=this.boardBounds;e.fill(0),e.set(this.boxColor,0),e.set([r-a,i-s,o-n,0],4),e.set([a,s,n,0],8),this.device.queue.writeBuffer(this.box.drawBuffer,0,e)}encodeCull(e,a){let s=this.cull,n=new Float32Array(s.scratch),r=new Uint32Array(s.scratch);n.fill(0),Uo(a.matrix).forEach((l,y)=>n.set(l,y*4));let i=a.lod;i&&n.set([...i.eye,i.orthographic?0:1],24);let o=this.boardBounds||[-1e6,-1e6,-1e6,1e6,1e6,1e6];n.set([o[0],o[1],o[2],0,o[3],o[4],o[5],0],28);let{fullPx:c,boardPx:d,boxPx:b,keep:f}=this.lodThresholds;n.set([i?.pixelScale||0,c,b,f],36);let m=this.lodOverride!=null?this.lodOverride+1:!i||!this.boardBounds?Do+1:0;r.set([this.occurrenceMatrices.length,this.selectedOccurrence+1,m,this.nextSlot],40),r[44]=this.barrels?.instanceCount||0,n[45]=d,this.device.queue.writeBuffer(s.uniform,0,s.scratch),e.clearBuffer(s.counters);let p=e.beginComputePass({label:"cull"});p.setBindGroup(0,s.bindGroup),p.setPipeline(s.classify),p.dispatchWorkgroups(Math.ceil(this.occurrenceMatrices.length/64)),p.setPipeline(s.writeArgs),p.dispatchWorkgroups(Math.ceil(this.nextSlot/64)),p.end();let u=performance.now();return!s.reading&&u-s.readAt>250?(e.copyBufferToBuffer(s.counters,0,s.readback,0,16),s.readAt=u,!0):!1}readCullCounts(){let e=this.cull;e.reading=!0;let a=this.occurrenceMatrices.length;e.readback.mapAsync(GPUMapMode.READ).then(()=>{let[s,n,r,i]=new Uint32Array(e.readback.getMappedRange().slice(0));e.readback.unmap(),this.cullCounts={full:s,board:n-s,body:r-n,box:i,culled:Math.max(0,a-r-i)}}).catch(()=>{}).finally(()=>{e.reading=!1})}countFor(e){if(this.identityOnly)return e===2?this.barrels?.instanceCount||0:e===3?0:1;let{full:a,board:s,body:n,box:r}=this.cullCounts;return e===5?a+s+n:e===0?a+s:e===1?a:e===2?(a+s)*(this.barrels?.instanceCount||0):r}gpuMemoryBytes(){let e=0;for(let a of this.entries)e+=(a.vertexBuffer?.size||0)+(a.indexBuffer?.size||0);for(let a of[this.barrels?.vertexBuffer,this.barrels?.indexBuffer,this.barrels?.instanceBuffer,this.barrelRecordBuffer,this.occurrenceBuffer,this.listBuffer,this.argsBuffer,this.classesBuffer,this.featureMaskBuffer,this.netMaskBuffer,this.cull?.lods])e+=a?.size||0;return e+=this.canvas.width*this.canvas.height*12,e}ensureInstancedPipelines(){if(this.instancedPipelines)return;if(this.shareFrom){this.shareFrom.ensureInstancedPipelines(),this.instancedPipelines=this.shareFrom.instancedPipelines,this.createBox(),this.createCull();return}let e=this.pipelineLayout;this.instancedPipelines={...this.makeMainPipelines(ec,"-instanced"),pick:this.makePipeline(e,tc,Pt,this.vertexBuffers,"pick-instanced"),barrel:this.makeBarrelPipeline(e,sc,this.format,"barrel-instanced",!1),barrelPick:this.makeBarrelPipeline(e,nc,Pt,"barrel-pick-instanced",!1),box:this.makePipeline(e,ic,this.format,Ho,"box"),boxPick:this.makePipeline(e,oc,Pt,Ho,"box-pick")},this.createBox(),this.createCull()}drawSet(){return this.identityOnly?{pipelines:this.singlePipelines,indirect:!1,barrelInstances:this.barrels?.instanceCount||0}:{pipelines:this.instancedPipelines,indirect:!0,barrelInstances:0}}drawEntry(e,a,s){e.setBindGroup(0,a.bindGroup),e.setVertexBuffer(0,a.vertexBuffer),e.setIndexBuffer(a.indexBuffer,"uint32"),s?e.drawIndexedIndirect(this.argsBuffer,a.slot*20):e.drawIndexed(a.indexCount)}drawBarrels(e,a,s,n){e.setPipeline(a),e.setBindGroup(0,this.barrels.bindGroup),e.setVertexBuffer(0,this.barrels.vertexBuffer),e.setVertexBuffer(1,this.barrels.instanceBuffer),e.setIndexBuffer(this.barrels.indexBuffer,"uint16"),s?e.drawIndexedIndirect(this.argsBuffer,0):e.drawIndexed(this.barrels.indexCount,n)}drawBox(e,a){!this.box||!this.boardBounds||(this.writeBoxDraw(),e.setPipeline(a),e.setBindGroup(0,this.box.bindGroup),e.setVertexBuffer(0,this.box.vertexBuffer),e.setIndexBuffer(this.box.indexBuffer,"uint16"),e.drawIndexedIndirect(this.argsBuffer,20))}createNetMaskBuffer(e){return this.device.createBuffer({label:"net-emphasis-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}uploadNetMask(){let e;if(this.occurrenceEmphasis&&!this.identityOnly){let s=vi(this.occurrenceEmphasis);this.emphasisStride=s.stride,e=s.data}else this.emphasisStride=0,e=mi(this.emphasizedNetIds,this.netMaskCapacity);if(e.length>this.netMaskCapacity){this.netMaskBuffer?.destroy?.();let s=this.netMaskCapacity;for(;s<e.length;)s*=2;this.netMaskCapacity=s,this.netMaskBuffer=this.createNetMaskBuffer(s),this.rebindAll()}let a=new Uint32Array(this.netMaskCapacity);a.set(e),this.device.queue.writeBuffer(this.netMaskBuffer,0,a)}setOccurrenceEmphasis(e,{dimCopper:a=!1}={}){let s=Array.isArray(e)&&e.some(n=>n&&n.size);this.occurrenceEmphasis=s?e.map(n=>n&&n.size?new Map(n):null):null,this.dimCopper=!!a,this.uploadNetMask(),this.invalidate()}get netHighlightActive(){return!!(this.emphasizedNetIds.size||this.occurrenceEmphasis||this.dimCopper)}setEmphasizedNetIds(e){this.emphasizedNetIds=is(e),this.occurrenceEmphasis=null;let a=gi(this.emphasizedNetIds,this.netMaskCapacity);a!==this.netMaskCapacity&&(this.netMaskBuffer?.destroy?.(),this.netMaskCapacity=a,this.netMaskBuffer=this.createNetMaskBuffer(a),this.rebindAll()),this.uploadNetMask(),this.invalidate()}rebindAll(){for(let e of this.entries)e.bindGroup=this.makeBindGroup(this.drawSlotBuffer,e.drawSlot*et);this.barrels&&(this.barrels.bindGroup=this.makeBindGroup(this.barrels.drawBuffer)),this.box&&(this.box.bindGroup=this.makeBindGroup(this.box.drawBuffer)),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache.clear()}createFeatureMaskBuffer(e){return this.device.createBuffer({label:"feature-visibility-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createDrawSlotBuffer(e){return this.device.createBuffer({label:"draw-uniforms",size:e*et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}allocateDrawSlot(){if(this.freeDrawSlots.length)return this.freeDrawSlots.pop();if(this.nextDrawSlot>=this.drawSlotCapacity){let e=this.drawSlotCapacity*2,a=new Float32Array(e*ca);a.set(this.drawStaging),this.drawSlotBuffer.destroy?.(),this.drawSlotCapacity=e,this.drawSlotBuffer=this.createDrawSlotBuffer(e),this.drawStaging=a,this.rebindAll()}return this.nextDrawSlot++}flushDraws(e){if(!e.length)return;let a=1/0,s=-1;for(let n of e)a=Math.min(a,n.drawSlot),s=Math.max(s,n.drawSlot);this.device.queue.writeBuffer(this.drawSlotBuffer,a*et,this.drawStaging,a*ca,(s-a+1)*ca)}invalidate(){this.version+=1}setBarrelColor(e){this.barrelColor=[...e],this.invalidate()}makeBindGroup(e,a=0){return this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e,offset:a,size:et}},{binding:2,resource:{buffer:this.layerOffsetBuffer}},{binding:3,resource:{buffer:this.featureMaskBuffer}},{binding:4,resource:{buffer:this.netMaskBuffer}},{binding:5,resource:{buffer:this.occurrenceBuffer}},{binding:6,resource:{buffer:this.barrelRecordBuffer}},{binding:7,resource:{buffer:this.listBuffer}}]})}uploadFeatureMask(){let e=Ko(this.hiddenFeatureIds,this.featureMaskCapacity);this.device.queue.writeBuffer(this.featureMaskBuffer,0,e)}setHiddenFeatureIds(e){this.hiddenFeatureIds=Is(e);let a=Go(this.hiddenFeatureIds,this.featureMaskCapacity);a!==this.featureMaskCapacity&&(this.featureMaskBuffer?.destroy?.(),this.featureMaskCapacity=a,this.featureMaskBuffer=this.createFeatureMaskBuffer(a),this.rebindAll()),this.uploadFeatureMask(),this.bundleCache.clear(),this.invalidate()}depthStencilState(e=null){let a={format:this.depthFormat,depthWriteEnabled:!0,depthCompare:"greater"};return this.stencil&&e&&(a.stencilFront=e,a.stencilBack=e),a}makePipeline(e,a,s,n,r,i={}){let o=this.createShaderModule(a,r);return this.device.createRenderPipeline({layout:e,vertex:{module:o,entryPoint:"vs",buffers:n},fragment:{module:o,entryPoint:"fs",...i.constants?{constants:i.constants}:{},targets:[{format:s,blend:s===Pt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState(i.stencil),multisample:{count:1}})}makeBarrelPipeline(e,a,s,n,r=!0){let i=this.createShaderModule(a,n);return this.device.createRenderPipeline({layout:e,vertex:{module:i,entryPoint:"vs",buffers:[{arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32"}]},...r?[{arrayStride:40,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"float32x4"},{shaderLocation:4,offset:16,format:"float32x2"},{shaderLocation:5,offset:24,format:"uint32x4"}]}]:[]]},fragment:{module:i,entryPoint:"fs",targets:[{format:s,blend:s===Pt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState()})}createShaderModule(e,a){let s=this.device.createShaderModule({label:`pcb-${a}`,code:e});return typeof s.getCompilationInfo=="function"&&s.getCompilationInfo().then(n=>{let r=[...n.messages||[]];if(r.length){console.groupCollapsed(`WebGPU shader compilation info: pcb-${a}`);for(let i of r)console[i.type==="error"?"error":"warn"](`${i.type} ${i.lineNum}:${i.linePos} ${i.message}`);console.groupEnd()}}),s}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));this.canvas.width===a&&this.canvas.height===s||(this.canvas.width=a,this.canvas.height=s,this.depth?.destroy(),this.pickTexture?.destroy(),this.depth=this.device.createTexture({size:[a,s],format:this.depthFormat,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.pickTexture=this.device.createTexture({size:[a,s],format:Pt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}))}addPrimitive(e,a){let s=e.position.length/3,n=new ArrayBuffer(s*zo),r=new Float32Array(n),i=new Uint32Array(n);for(let u=0;u<s;u+=1){let l=u*10,y=u*3;r[l]=e.position[y],r[l+1]=e.position[y+1],r[l+2]=e.position[y+2],r[l+3]=e.normal[y],r[l+4]=e.normal[y+1],r[l+5]=e.normal[y+2],i[l+6]=e.netId[u]||0,i[l+7]=e.objectFeatureId[u]||0,i[l+8]=a.layerId||0,i[l+9]=a.materialId||0}let o=this.device.createBuffer({size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(o,0,n);let c=e.indices instanceof Uint32Array?e.indices:new Uint32Array(e.indices),d=this.device.createBuffer({size:c.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,c);let b=this.allocateDrawSlot(),f=this.makeBindGroup(this.drawSlotBuffer,b*et),m=qo(a,this.innerCopperAtFull),p={...a,drawClass:m,slot:this.allocSlot(c.length,m),bounds:e.bounds||a.bounds||null,id:this.nextEntryId++,vertexBuffer:o,indexBuffer:d,indexCount:c.length,drawSlot:b,bindGroup:f};return this.entries.push(p),this.bundleCache.clear(),this.invalidate(),p}removeEntries(e){if(!e?.length)return;let a=new Set(e.map(s=>s.id));for(let s of e)s.vertexBuffer?.destroy?.(),s.indexBuffer?.destroy?.(),this.freeDrawSlots.push(s.drawSlot),s.slot!=null&&(this.setSlot(s.slot,0,4),this.freeSlots.push(s.slot));this.entries=this.entries.filter(s=>!a.has(s.id)),this.bundleCache.clear(),this.invalidate()}dispose(){this.removeEntries(this.entries),this.barrels&&(this.barrels.vertexBuffer?.destroy?.(),this.barrels.indexBuffer?.destroy?.(),this.barrels.instanceBuffer?.destroy?.(),this.barrels.drawBuffer?.destroy?.(),this.barrels=null),this.depth?.destroy(),this.pickTexture?.destroy(),this.featureMaskBuffer?.destroy?.(),this.occurrenceBuffer?.destroy?.(),this.barrelRecordBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.();for(let e of[this.box?.vertexBuffer,this.box?.indexBuffer,this.box?.drawBuffer,this.cull?.uniform,this.cull?.lods,this.cull?.counters,this.cull?.readback])e?.destroy?.();this.box=null,this.cull=null,this.drawSlotBuffer?.destroy?.(),this.depth=null,this.pickTexture=null,this.featureMaskBuffer=null,this.bundleCache.clear()}setBarrels(e){if(!e?.length)return;let a=20,s=[],n=[];for(let u of[0,1]){let l=s.length/7;for(let y=0;y<a;y+=1){let h=Math.PI*2*y/a,g=Math.cos(h),x=Math.sin(h);for(let v of[0,1])s.push(g,x,v,u?-g:g,u?-x:x,0,u)}for(let y=0;y<a;y+=1){let h=(y+1)%a,g=l+y*2,x=l+h*2;n.push(g,x,x+1,g,x+1,g+1)}}let r=new Float32Array(s),i=new Uint16Array(n),o=new ArrayBuffer(e.length*40),c=new DataView(o);e.forEach((u,l)=>{let y=l*40;c.setFloat32(y,u.centerMm[0]/1e3,!0),c.setFloat32(y+4,-u.centerMm[1]/1e3,!0),c.setFloat32(y+8,Math.min(u.drillWidthMm,u.drillHeightMm)/2e3,!0),c.setFloat32(y+12,Math.max(u.outerWidthMm,u.outerHeightMm)/2e3,!0),c.setFloat32(y+16,u.startZMm/1e3,!0),c.setFloat32(y+20,u.endZMm/1e3,!0),c.setUint32(y+24,u.netId||0,!0),c.setUint32(y+28,u.objectFeatureId||0,!0),c.setUint32(y+32,u.startLayerId||0,!0),c.setUint32(y+36,u.endLayerId||0,!0)});let d=this.device.createBuffer({size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),b=this.device.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),f=this.device.createBuffer({size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,r),this.device.queue.writeBuffer(b,0,i),this.device.queue.writeBuffer(f,0,o);let m=jo(e);this.barrelRecordBuffer?.destroy?.(),this.barrelRecordBuffer=this.device.createBuffer({label:"barrel-records",size:m.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.barrelRecordBuffer,0,m);let p=this.device.createBuffer({size:et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.barrels={records:e,vertexBuffer:d,indexBuffer:b,instanceBuffer:f,indexCount:i.length,instanceCount:e.length,drawBuffer:p,bindGroup:null},this.setSlot(0,i.length,2),this.rebindAll(),this.invalidate()}render(e){let{panels:a,layerOffsets:s}=e;this.resize(),this.device.queue.writeBuffer(this.layerOffsetBuffer,0,s);let n=this.context.getCurrentTexture().createView(),r=0,i=0;a.forEach((o,c)=>{let d=this.device.createCommandEncoder(),b=!this.identityOnly&&this.encodeCull(d,o),f=d.beginRenderPass({colorAttachments:[{view:n,clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:c===0?"clear":"load",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),m=Xo(o.viewport,this.canvas.width,this.canvas.height);f.setViewport(m.x,m.y,m.width,m.height,0,1),f.setScissorRect(m.x,m.y,m.width,m.height);let p=this.encodeDraws(f,o,e);r+=p.triangles,i+=p.draws,f.end(),this.device.queue.submit([d.finish()]),b&&this.readCullCounts()}),this.frameStats={triangles:Math.round(r),draws:i}}encodeDraws(e,a,{activeNetId:s,selectedFeatureId:n,time:r,visibleLayers:i,showBoard:o,showComponents:c,showPaste:d=!0,componentOpacity:b,boardOpacity:f,isolateNet:m,compareMode:p=!1,compareOffsets:u=new Map,layerAlphas:l=null,visibleTileIds:y=null}){let h=0,g=0;this.stencil&&e.setStencilReference(1),this.writeGlobals(a.matrix,s,a.layerId,r,n);let{pipelines:x,indirect:v,barrelInstances:T}=this.drawSet(),I=!d||!!(s||this.netHighlightActive),S=this.entries.filter(A=>this.visible(A,a.layerId,i,o,c,b,p,y)&&!(I&&A.boardRole==="paste")),R=S.filter(A=>!Ss(A)).sort((A,j)=>+!!A.stencilMark-+!!j.stencilMark),_=S.filter(A=>Ss(A)).sort((A,j)=>Ss(A)-Ss(j));for(let A of S)this.writeDraw(A,s,b,f,m,p,u.get(A.layerId),l?.get(A.layerId)??1);this.flushDraws(S),R.length>64?e.executeBundles([this.renderBundle(R,a.layerId)]):this.drawEntries(e,R,x,v);for(let A of S)h+=A.indexCount/3*this.countFor(A.drawClass);return g+=S.length,!p&&this.barrels&&(a.layerId===0||i.has(a.layerId))&&(this.writeBarrelDraw(m),this.drawBarrels(e,x.barrel,v,T),h+=this.barrels.indexCount/3*this.countFor(2),g+=1),v&&!p&&(this.drawBox(e,x.box),h+=12*this.countFor(3),g+=1),this.drawBlended(e,_,x,v),{triangles:h,draws:g}}depthAttachment(){let e={view:this.depth.createView(),depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"store"};return this.stencil&&Object.assign(e,{stencilClearValue:0,stencilLoadOp:"clear",stencilStoreOp:"discard"}),e}drawEntries(e,a,s,n){let r=null;for(let i of a){let o=i.stencilMark?s.mark:s.main;o!==r&&(e.setPipeline(o),r=o),this.drawEntry(e,i,n)}}drawBlended(e,a,s,n){for(let r of a)r.boardRole==="soldermask"&&r.kind==="board"?(e.setPipeline(s.mask),this.drawEntry(e,r,n),s.maskCovered&&(e.setPipeline(s.maskCovered),this.drawEntry(e,r,n))):(e.setPipeline(s.blend),this.drawEntry(e,r,n))}setPlaceholdersVisible(e){this.showPlaceholders=!!e,this.invalidate()}visible(e,a,s,n,r,i,o=!1,c=null){return e.placeholder&&!this.showPlaceholders||e.kind==="board"&&e.boardRole==="pad"||!o&&e.kind==="copper"&&c&&!c.has(e.tileId)?!1:o?e.kind==="copper"&&s.has(e.layerId):e.boardRole==="paste"?a===0&&s.has(e.layerId):e.kind==="board"?a===0&&n:e.kind==="component"?a===0&&r&&i>.001:a?e.layerId===a:s.has(e.layerId)}writeGlobals(e,a,s,n,r=0){let i=this.globalScratch,o=this.globalScratchF32;o.fill(0),o.set(e,0);let c=this.globalScratchView;c.setUint32(64,a||0,!0),c.setUint32(68,s||0,!0),c.setFloat32(72,n,!0),c.setFloat32(76,a||this.netHighlightActive?1:0,!0),c.setUint32(80,r||0,!0),c.setUint32(84,this.selectedOccurrence>=0?this.selectedOccurrence+1+this.occurrenceBase:0,!0),c.setUint32(88,this.occurrenceBase,!0),c.setUint32(92,this.emphasisStride,!0),o.set([.35,-.5,.8,0],24),this.device.queue.writeBuffer(this.globalBuffer,0,i)}writeDraw(e,a,s,n=1,r=!1,i=!1,o=null,c=1){let d=this.drawStaging.subarray(e.drawSlot*ca,(e.drawSlot+1)*ca);d.fill(0);let b=e.color||e.material.baseColor;d.set(b,0),d.set([e.material.metallic||0,e.material.roughness??.72,e.opacityScale!=null?s:0,ep[e.drawClass]??1],4);let f=ap(e);d.set([o?.[0]||0,o?.[1]||0,(i?-(e.baseZ||0):e.layerOffset||0)+f,e.kind==="copper"||e.boardRole==="paste"?Number(e.layerId||0)+1:0],8);let m=Number.isFinite(b?.[3])?b[3]:1,p=e.kind==="component"?s*(e.opacityScale??1):e.kind==="board"&&e.boardRole!=="paste"?n*tp(e,m):c,u=e.kind==="copper"?1:e.kind==="component"?2:0;d.set([u,p,r?1:0,i?1:0],12)}writeBarrelDraw(e=!1){let a=this.barrelDrawScratch;a.fill(0),a.set(this.barrelColor,0),a.set([.75,.32,0,0],4),a.set([1,1,e?1:0,0],12),this.device.queue.writeBuffer(this.barrels.drawBuffer,0,a)}renderBundle(e,a){let{pipelines:s,indirect:n}=this.drawSet(),r=`${a}:${n?"indirect":"single"}:${e.map(d=>d.id).join(",")}`,i=this.bundleCache.get(r);if(i)return i;let o=this.device.createRenderBundleEncoder({colorFormats:[this.format],depthStencilFormat:this.depthFormat});this.drawEntries(o,e,s,n);let c=o.finish();return this.bundleCache.set(r,c),this.bundleCache.size>32&&this.bundleCache.delete(this.bundleCache.keys().next().value),c}pick(e,a,s,n){let r=this.pickSerial.then(()=>this.performPick(e,a,s,n));return this.pickSerial=r.catch(()=>0),r}async performPick(e,a,s,n){this.resize();let r=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),i=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s)));this.device.queue.writeBuffer(this.layerOffsetBuffer,0,n.layerOffsets);let o=this.device.createCommandEncoder(),c=o.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),d=Xo(e.viewport,this.canvas.width,this.canvas.height);return c.setViewport(d.x,d.y,d.width,d.height,0,1),c.setScissorRect(d.x,d.y,d.width,d.height),this.encodePick(c,e,n),c.end(),this.readPick(o,r,i)}encodePick(e,a,s){this.writeGlobals(a.matrix,s.activeNetId,a.layerId,performance.now()/1e3,s.selectedFeatureId);let{pipelines:n,indirect:r,barrelInstances:i}=this.drawSet();e.setPipeline(n.pick);let o=[];for(let c of this.entries)this.visible(c,a.layerId,s.visibleLayers,s.showBoard,s.showComponents,s.componentOpacity,s.compareMode,s.visibleTileIds)&&(c.kind==="board"&&(this.identityOnly||c.boardRole!=="substrate")||(this.writeDraw(c,s.activeNetId,s.componentOpacity,s.boardOpacity,s.isolateNet,s.compareMode,s.compareOffsets?.get(c.layerId)),o.push(c)));this.flushDraws(o);for(let c of o)this.drawEntry(e,c,r);!s.compareMode&&this.barrels&&(this.writeBarrelDraw(s.isolateNet),this.drawBarrels(e,n.barrelPick,r,i)),r&&!s.compareMode&&this.drawBox(e,n.boxPick)}async readPick(e,a,s){let n=this.device.createBuffer({label:"pick-readback",size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});e.copyTextureToBuffer({texture:this.pickTexture,origin:{x:a,y:s}},{buffer:n,bytesPerRow:256},{width:1,height:1}),this.device.queue.submit([e.finish()]);try{await n.mapAsync(GPUMapMode.READ);let r=new DataView(n.getMappedRange()),i=Oo(r.getUint32(0,!0),r.getUint32(4,!0));return n.unmap(),{...i,occurrenceKey:i.occurrenceIndex>=0?this.occurrenceKeys[i.occurrenceIndex]??null:null}}finally{n.mapState==="mapped"&&n.unmap(),n.destroy()}}},ep=Object.freeze({0:1,1:0,5:2});function qo(t,e){return t.kind==="component"||t.innerCopper&&e?1:t.kind==="board"&&(t.boardRole==="substrate"||t.boardRole==="soldermask")?5:0}function Ss(t){return t.translucent?3:t.kind!=="board"?0:t.boardRole==="soldermask"?1:t.boardRole==="silkscreen"?2:0}function tp(t,e){return t.kind!=="board"||t.boardRole==="substrate"?1:t.boardRole==="soldermask"?Math.min(e,.72):t.boardRole==="silkscreen"?Math.min(e,.92):e}function ap(t){if(t.kind!=="board"||t.boardRole!=="soldermask"&&t.boardRole!=="silkscreen")return 0;let e=t.bounds,s=(e?(e[2]+e[5])*.5:0)<0?-1:1,n=t.boardRole==="silkscreen"?35e-6:18e-6;return s*n}function Xo(t,e,a){let s=Math.max(0,Math.min(e-1,Math.floor(t.x))),n=Math.max(0,Math.min(a-1,Math.floor(t.y)));return{x:s,y:n,width:Math.max(1,Math.min(e-s,Math.floor(t.width))),height:Math.max(1,Math.min(a-n,Math.floor(t.height)))}}function lc(t){return t*12+2}function dc(t){let e=[],a=0,s=0,n=0;for(let p=0;p<t.length;p+=1){let u=Math.floor(t[p].samplesMm.length/3);u<2||(e.push(p),a+=u,s+=lc(u),n+=(u-1)*12*6+72)}let r=new Float32Array(Math.max(a,1)*4),i=new ArrayBuffer(Math.max(e.length,1)*32),o=new Uint32Array(i),c=new Float32Array(i),d=new Uint32Array(Math.max(n,3)),b=0,f=0,m=0;return e.forEach((p,u)=>{let l=t[p],y=Math.floor(l.samplesMm.length/3);for(let x=0;x<y;x+=1)r[(b+x)*4]=l.samplesMm[x*3]*.001,r[(b+x)*4+1]=l.samplesMm[x*3+1]*.001,r[(b+x)*4+2]=l.samplesMm[x*3+2]*.001;o[u*8]=b,o[u*8+1]=y,o[u*8+2]=f,o[u*8+3]=u,c[u*8+4]=l.radiusMm*.001;let h=(x,v)=>f+x*12+v%12;for(let x=0;x+1<y;x+=1)for(let v=0;v<12;v+=1)d.set([h(x,v),h(x+1,v),h(x+1,v+1),h(x,v),h(x+1,v+1),h(x,v+1)],m),m+=6;let g=f+y*12;for(let x=0;x<12;x+=1)d.set([g,h(0,x+1),h(0,x)],m),d.set([g+1,h(y-1,x),h(y-1,x+1)],m+3),m+=6;b+=y,f+=lc(y)}),{samples:r,segments:o,indices:d,kept:e,sampleCount:a,vertexCount:s,indexCount:n}}var np=`
struct Segment { start: u32, count: u32, vertexStart: u32, color: u32, radius: f32, p0: u32, p1: u32, p2: u32 };
struct Vertex { position: vec4f, normal: vec4f };
`,rp=`${np}
const RING: u32 = ${12}u;
const TAU: f32 = 6.283185307179586;
@group(0) @binding(0) var<storage, read> samples: array<vec4f>;
@group(0) @binding(1) var<storage, read> segments: array<Segment>;
@group(0) @binding(2) var<storage, read_write> frames: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> vertices: array<Vertex>;
@group(0) @binding(4) var<uniform> counts: vec4u; // segments, samples, vertices

fn safeNormalize(v: vec3f) -> vec3f {
  let length = sqrt(dot(v, v));
  return select(vec3f(0.0, 0.0, 1.0), v / length, length > 1e-12);
}
fn point(s: Segment, i: u32) -> vec3f { return samples[s.start + i].xyz; }
fn tangent(s: Segment, i: u32) -> vec3f {
  let a = point(s, select(i - 1u, 0u, i == 0u));
  let b = point(s, min(i + 1u, s.count - 1u));
  return safeNormalize(b - a);
}
fn perpendicularTo(t: vec3f) -> vec3f {
  let a = abs(t);
  var axis = vec3f(0.0, 0.0, 1.0);
  if (a.x <= a.y && a.x <= a.z) { axis = vec3f(1.0, 0.0, 0.0); } else if (a.y <= a.z) { axis = vec3f(0.0, 1.0, 0.0); }
  return safeNormalize(cross(t, axis));
}

@compute @workgroup_size(64) fn framesMain(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= counts.x) { return; }
  let s = segments[id.x];
  var r = perpendicularTo(tangent(s, 0u));
  frames[s.start] = vec4f(r, 0.0);
  for (var i = 0u; i + 1u < s.count; i++) {
    let v1 = point(s, i + 1u) - point(s, i);
    let c1 = dot(v1, v1);
    if (c1 >= 1e-24) {
      let rL = r - (2.0 / c1) * dot(v1, r) * v1;
      let tL = tangent(s, i) - (2.0 / c1) * dot(v1, tangent(s, i)) * v1;
      let v2 = tangent(s, i + 1u) - tL;
      let c2 = dot(v2, v2);
      r = safeNormalize(select(rL - (2.0 / c2) * dot(v2, rL) * v2, rL, c2 < 1e-24));
    }
    frames[s.start + i + 1u] = vec4f(r, 0.0);
  }
}

fn segmentOf(vertex: u32) -> u32 {
  var low = 0u;
  var high = counts.x - 1u;
  loop {
    if (low >= high) { break; }
    let middle = (low + high + 1u) / 2u;
    if (segments[middle].vertexStart <= vertex) { low = middle; } else { high = middle - 1u; }
  }
  return low;
}

@compute @workgroup_size(64) fn ringsMain(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= counts.z) { return; }
  let index = segmentOf(id.x);
  let s = segments[index];
  let local = id.x - s.vertexStart;
  let ringVertices = s.count * RING;
  var position: vec3f;
  var normal: vec3f;
  if (local < ringVertices) {
    let i = local / RING;
    let angle = TAU * f32(local % RING) / f32(RING);
    let t = tangent(s, i);
    let r = frames[s.start + i].xyz;
    normal = cos(angle) * r + sin(angle) * cross(t, r);
    position = point(s, i) + s.radius * normal;
  } else if (local == ringVertices) {
    normal = -tangent(s, 0u);
    position = point(s, 0u);
  } else {
    normal = tangent(s, s.count - 1u);
    position = point(s, s.count - 1u);
  }
  vertices[id.x] = Vertex(vec4f(position, bitcast<f32>(s.color)), vec4f(normal, 0.0));
}
`,ip=`
struct Globals { viewProjection: mat4x4f, light: vec4f, time: vec4f };
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<storage, read> colors: array<vec4f>; // rgb, mode: 0 idle, 1 lit, 2 dim

struct Out {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) @interpolate(flat) color: u32,
};
@vertex fn vs(@location(0) position: vec4f, @location(1) normal: vec4f) -> Out {
  var out: Out;
  out.position = globals.viewProjection * vec4f(position.xyz, 1.0);
  out.normal = normal.xyz;
  out.color = bitcast<u32>(position.w);
  return out;
}
@fragment fn fs(input: Out) -> @location(0) vec4f {
  let entry = colors[input.color];
  let mode = u32(entry.a + 0.5);
  var base = entry.rgb;
  if (mode == 1u) { base = base * (0.9 + 0.1 * sin(globals.time.x * 3.2)); }
  if (mode == 2u) { base = mix(base, vec3f(0.62, 0.64, 0.67), 0.7); }
  let n = normalize(input.normal);
  let diffuse = max(dot(n, normalize(globals.light.xyz)), 0.0);
  let hemi = mix(0.35, 0.7, n.z * 0.5 + 0.5);
  let lit = base * (hemi + 0.6 * diffuse);
  return vec4f(select(lit, max(lit, base * 0.95), mode == 1u), 1.0);
}
`,uc=96,As=class{constructor(e){this.host=e,this.device=e.device,this.counts={segments:0,samples:0,vertices:0,indices:0},this.dirty=!1,this.kept=[];let a=this.device,s=a.createShaderModule({label:"harness-tubes-compute",code:rp});this.computeLayout=a.createBindGroupLayout({label:"harness-tubes-compute",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});let n=a.createPipelineLayout({bindGroupLayouts:[this.computeLayout]});this.framesPipeline=a.createComputePipeline({layout:n,compute:{module:s,entryPoint:"framesMain"}}),this.ringsPipeline=a.createComputePipeline({layout:n,compute:{module:s,entryPoint:"ringsMain"}});let r=a.createShaderModule({label:"harness-tubes-draw",code:ip});this.drawLayout=a.createBindGroupLayout({label:"harness-tubes-draw",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),this.drawPipeline=a.createRenderPipeline({label:"harness-tubes",layout:a.createPipelineLayout({bindGroupLayouts:[this.drawLayout]}),vertex:{module:r,entryPoint:"vs",buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:"float32x4"},{shaderLocation:1,offset:16,format:"float32x4"}]}]},fragment:{module:r,entryPoint:"fs",targets:[{format:e.format}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:e.depthStencilState(),multisample:{count:1}}),this.globals=a.createBuffer({label:"harness-tubes-globals",size:uc,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.countBuffer=a.createBuffer({label:"harness-tubes-counts",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.buffers={},this.capacity={samples:0,segments:0,vertices:0,indices:0},this.globalScratch=new Float32Array(uc/4)}ensure(e,a,s){let n=this.buffers[e];return n&&n.size>=a?!1:(n?.destroy(),this.buffers[e]=this.device.createBuffer({label:`harness-tubes-${e}`,size:Math.max(256,Math.ceil(a*1.5/4)*4),usage:s}),!0)}setTubes(e,a){let s=dc(e);if(this.kept=s.kept.map(o=>e[o]),this.counts={segments:s.kept.length,samples:s.sampleCount,vertices:s.vertexCount,indices:s.indexCount},!this.counts.segments){this.dirty=!1;return}let n=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,r=!1;r=this.ensure("samples",s.samples.byteLength,n)||r,r=this.ensure("segments",s.segments.byteLength,n)||r,r=this.ensure("frames",s.samples.byteLength,GPUBufferUsage.STORAGE)||r,r=this.ensure("vertices",this.counts.vertices*32,GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX)||r,this.ensure("indices",s.indices.byteLength,GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST);let i=this.device.queue;i.writeBuffer(this.buffers.samples,0,s.samples),i.writeBuffer(this.buffers.segments,0,s.segments),i.writeBuffer(this.buffers.indices,0,s.indices),i.writeBuffer(this.countBuffer,0,new Uint32Array([this.counts.segments,this.counts.samples,this.counts.vertices,0])),(r||!this.computeGroup)&&(this.computeGroup=this.device.createBindGroup({layout:this.computeLayout,entries:["samples","segments","frames","vertices"].map((o,c)=>({binding:c,resource:{buffer:this.buffers[o]}})).concat([{binding:4,resource:{buffer:this.countBuffer}}])})),this.setColors(a),this.dirty=!0}setColors(e){if(!this.counts.segments)return;let a=new Float32Array(this.counts.segments*4);this.kept.forEach((s,n)=>{let{rgb:r,mode:i}=e(s);a.set([r[0],r[1],r[2],i],n*4)}),(this.ensure("colors",a.byteLength,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST)||!this.drawGroup||this.drawGroupColors!==this.buffers.colors)&&(this.drawGroup=this.device.createBindGroup({layout:this.drawLayout,entries:[{binding:0,resource:{buffer:this.globals}},{binding:1,resource:{buffer:this.buffers.colors}}]}),this.drawGroupColors=this.buffers.colors),this.device.queue.writeBuffer(this.buffers.colors,0,a)}encodeCompute(e){if(!this.dirty||!this.counts.segments)return;let a=e.beginComputePass({label:"harness-tubes"});a.setBindGroup(0,this.computeGroup),a.setPipeline(this.framesPipeline),a.dispatchWorkgroups(Math.ceil(this.counts.segments/64)),a.setPipeline(this.ringsPipeline),a.dispatchWorkgroups(Math.ceil(this.counts.vertices/64)),a.end(),this.dirty=!1}draw(e,a,s=0){if(!this.counts.segments)return 0;let n=this.globalScratch;return n.fill(0),n.set(a,0),n.set([.35,-.45,.82,0],16),n[20]=s,this.device.queue.writeBuffer(this.globals,0,n),e.setPipeline(this.drawPipeline),e.setBindGroup(0,this.drawGroup),e.setVertexBuffer(0,this.buffers.vertices),e.setIndexBuffer(this.buffers.indices,"uint32"),e.drawIndexed(this.counts.indices),this.counts.indices/3}gpuMemoryBytes(){return Object.values(this.buffers).reduce((e,a)=>e+a.size,0)}dispose(){for(let e of Object.values(this.buffers))e.destroy();this.globals.destroy(),this.countBuffer.destroy(),this.buffers={}}};var op=[0,0,0,1,1,1],_s=class t{static async create(e){return new t(await Wt.create(e))}constructor(e){this.host=e,this.canvas=e.canvas,this.device=e.device,e.alwaysInstanced=!0,e.setOccurrences([]),this.assets=new Map,this.order=[],this.frameStats={triangles:0,draws:0},this.lodThresholds={...qe},this.tubes=null,this.tubeVersion=0}setTubes(e,a){!e.length&&!this.tubes||(this.tubes??=new As(this.host),this.tubes.setTubes(e,a),this.tubeVersion+=1)}setTubeColors(e){this.tubes?.setColors(e),this.tubeVersion+=1}asset(e){let a=this.assets.get(e);return a||(a=new Wt(this.canvas,this.device,{shareFrom:this.host}),a.setLodThresholds(this.lodThresholds),this.assets.set(e,a)),a}standIn(e,a){let s=this.asset(e);return s.standIn||(s.standIn=!0,s.setBoardBounds(op),s.setLodOverride(Lo)),s.boxColor=[...a],s}removeAsset(e){let a=this.assets.get(e);a&&(a.dispose(),this.assets.delete(e))}get renderers(){return this.order.map(e=>this.assets.get(e)).filter(Boolean)}setOccurrences(e){this.order=[...e.keys()].filter(s=>this.assets.has(s));for(let[s,n]of this.assets)e.has(s)||n.setOccurrences([]);for(let s of this.order)this.assets.get(s).setOccurrences(e.get(s));let a=0;for(let s of this.renderers)s.occurrenceBase=a,a+=s.occurrenceCount;this.occurrenceCount=a}locate(e){for(let a of this.renderers){let s=e-a.occurrenceBase;if(s>=0&&s<a.occurrenceCount)return{renderer:a,local:s}}return null}keyOf(e){let a=this.locate(e);return a?a.renderer.occurrenceKeys[a.local]??null:null}setSelectedOccurrence(e){let a=e>=0?this.locate(e):null;for(let s of this.renderers)s.selectedOccurrence=!s.standIn&&a?.renderer===s?a.local:-1}resize(){this.host.resize()}render(e,a){let s=this.host;s.resize();let n=this.renderers.filter(f=>f.occurrenceCount>0),r=new Map(n.map(f=>[f,a(f)]));for(let[f,m]of r)fc(f,m);let i=this.device.createCommandEncoder(),o=n.filter(f=>f.encodeCull(i,e));this.tubes?.encodeCompute(i);let c=i.beginRenderPass({colorAttachments:[{view:s.context.getCurrentTexture().createView(),clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:s.depthAttachment()});hc(c,e.viewport,this.canvas);let d=0,b=0;for(let f of n){let m=f.encodeDraws(c,e,r.get(f));d+=m.triangles,b+=m.draws}this.tubes?.counts.segments&&(d+=this.tubes.draw(c,e.matrix,performance.now()/1e3),b+=1),c.end(),this.device.queue.submit([i.finish()]);for(let f of o)f.readCullCounts();this.frameStats={triangles:Math.round(d),draws:b}}pick(e,a,s,n){let r=this.host.pickSerial.then(()=>this.performPick(e,a,s,n));return this.host.pickSerial=r.catch(()=>0),r}async performPick(e,a,s,n){let r=this.host;r.resize();let i=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),o=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s))),c=this.device.createCommandEncoder(),d=c.beginRenderPass({colorAttachments:[{view:r.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:r.depthAttachment()});hc(d,e.viewport,this.canvas);for(let m of this.renderers){if(m.occurrenceCount===0)continue;let p=n(m);fc(m,p),m.encodePick(d,e,p)}d.end();let b=await r.readPick(c,i,o),f=b.occurrenceIndex>=0?this.locate(b.occurrenceIndex):null;return{...b,occurrenceKey:f?f.renderer.occurrenceKeys[f.local]??null:null,renderer:f?.renderer||null,standIn:!!f?.renderer?.standIn}}gpuMemoryBytes(){let e=0;for(let a of this.renderers)e+=a.gpuMemoryBytes();return e+=this.tubes?.gpuMemoryBytes()||0,e-Math.max(0,this.renderers.length-1)*this.canvas.width*this.canvas.height*12}setLodThresholds(e){this.lodThresholds=oa({...this.lodThresholds,...e});for(let a of this.assets.values())a.setLodThresholds(this.lodThresholds);return{...this.lodThresholds}}cullCounts(){let e={full:0,board:0,body:0,box:0,culled:0};for(let a of this.renderers)if(a.occurrenceCount)for(let s of Object.keys(e))e[s]+=a.cullCounts[s]||0;return e}dispose(){for(let e of[...this.assets.keys()])this.removeAsset(e);this.tubes?.dispose(),this.tubes=null,this.host.dispose(),this.host.context?.unconfigure?.(),this.device.destroy?.()}};function fc(t,e){e?.layerOffsets&&t.device.queue.writeBuffer(t.layerOffsetBuffer,0,e.layerOffsets)}function hc(t,e,a){let s=Math.max(0,Math.min(a.width-1,Math.floor(e.x))),n=Math.max(0,Math.min(a.height-1,Math.floor(e.y))),r=Math.max(1,Math.min(a.width-s,Math.floor(e.width))),i=Math.max(1,Math.min(a.height-n,Math.floor(e.height)));t.setViewport(s,n,r,i,0,1),t.setScissorRect(s,n,r,i)}var cp=`
struct Globals {
  camera: vec4f,
  viewport: vec2f,
  activeNet: u32,
  _pad: u32,
};
struct Page {
  originSize: vec4f,
  flags: vec4f,
};
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<uniform> page: Page;
@group(0) @binding(2) var pageSampler: sampler;
@group(0) @binding(3) var pageTexture: texture_2d<f32>;

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vs(@builtin(vertex_index) index: u32) -> VertexOut {
  var positions = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  );
  let uv = positions[index];
  let world = page.originSize.xy + uv * page.originSize.zw;
  let halfViewport = globals.viewport * globals.camera.z * 0.5;
  let clip = vec2f(
    (world.x - globals.camera.x) / halfViewport.x,
    -(world.y - globals.camera.y) / halfViewport.y
  );
  var out: VertexOut;
  out.position = vec4f(clip, 0.0, 1.0);
  out.uv = uv;
  return out;
}

@fragment fn fs(input: VertexOut) -> @location(0) vec4f {
  let sampled = textureSample(pageTexture, pageSampler, input.uv);
  let edge = min(min(input.uv.x, 1.0 - input.uv.x), min(input.uv.y, 1.0 - input.uv.y));
  let selected = page.flags.x > 0.5;
  let containsNet = page.flags.y > 0.5;
  let hasActiveNet = page.flags.z > 0.5;
  let nativeDetail = page.flags.w > 0.5;
  if (edge < 0.006) {
    if (containsNet) { return vec4f(0.12, 0.92, 0.35, 1.0); }
    if (selected) { return vec4f(0.12, 0.45, 0.95, 1.0); }
    return vec4f(0.28, 0.32, 0.39, 1.0);
  }
  if (nativeDetail) {
    return vec4f(0.925, 0.918, 0.865, 1.0);
  }
  var dim = 1.0;
  if (hasActiveNet) {
    dim = 0.42;
    if (containsNet) {
      dim = 1.0;
    }
  }
  return vec4f(sampled.rgb * dim, 1.0);
}`,lp=`
struct Globals {
  camera: vec4f,
  viewport: vec2f,
  activeNet: u32,
  _pad: u32,
};
@group(0) @binding(0) var<uniform> globals: Globals;
struct Out { @builtin(position) position: vec4f };
@vertex fn vs(@location(0) world: vec2f) -> Out {
  let halfViewport = globals.viewport * globals.camera.z * 0.5;
  let clip = vec2f(
    (world.x - globals.camera.x) / halfViewport.x,
    -(world.y - globals.camera.y) / halfViewport.y
  );
  var out: Out;
  out.position = vec4f(clip, 0.4, 1.0);
  return out;
}
@fragment fn fs() -> @location(0) vec4f {
  return vec4f(0.22, 0.48, 0.82, 0.82);
}`,dp=`
struct Globals {
  camera: vec4f,
  viewport: vec2f,
  activeNet: u32,
  _pad: u32,
};
@group(0) @binding(0) var<uniform> globals: Globals;
struct Out { @builtin(position) position: vec4f };
@vertex fn vs(@location(0) world: vec2f) -> Out {
  let halfViewport = globals.viewport * globals.camera.z * 0.5;
  let clip = vec2f(
    (world.x - globals.camera.x) / halfViewport.x,
    -(world.y - globals.camera.y) / halfViewport.y
  );
  var out: Out;
  out.position = vec4f(clip, 0.2, 1.0);
  return out;
}
@fragment fn fs() -> @location(0) vec4f {
  return vec4f(0.08, 1.0, 0.27, 0.96);
}`,up=`
struct Globals {
  camera: vec4f,
  viewport: vec2f,
  activeNet: u32,
  _pad: u32,
};
@group(0) @binding(0) var<uniform> globals: Globals;
struct Out {
  @builtin(position) position: vec4f,
  @location(0) distance: f32,
  @location(1) kind: f32,
};
@vertex fn vs(@location(0) world: vec2f, @location(1) flow: vec2f) -> Out {
  let halfViewport = globals.viewport * globals.camera.z * 0.5;
  let clip = vec2f(
    (world.x - globals.camera.x) / halfViewport.x,
    -(world.y - globals.camera.y) / halfViewport.y
  );
  var out: Out;
  out.position = vec4f(clip, 0.05, 1.0);
  out.distance = flow.x;
  out.kind = flow.y;
  return out;
}
@fragment fn fs(input: Out) -> @location(0) vec4f {
  let selected = input.kind > 1.5;
  let intersheet = input.kind > 0.5 && !selected;
  var speed = 0.62;
  var period = 18.0;
  if (intersheet || selected) {
    speed = 0.88;
    period = 28.0;
  }
  let phase = fract(input.distance / period - globals.camera.w * speed);
  let dash = smoothstep(0.04, 0.13, phase) * (1.0 - smoothstep(0.38, 0.52, phase));
  let intraBase = vec3f(0.94, 0.48, 0.12);
  let intraDash = vec3f(1.0, 0.86, 0.24);
  let interBase = vec3f(0.10, 0.46, 0.92);
  let interDash = vec3f(0.42, 0.82, 1.0);
  let selectedBase = vec3f(0.08, 1.0, 0.34);
  let selectedDash = vec3f(0.86, 1.0, 0.72);
  var base = intraBase;
  var bright = intraDash;
  if (intersheet) {
    base = interBase;
    bright = interDash;
  }
  if (selected) {
    base = selectedBase;
    bright = selectedDash;
  }
  let color = base + (bright - base) * dash;
  var alpha = 0.24 + dash * 0.54;
  if (intersheet) {
    alpha = 0.30 + dash * 0.54;
  }
  if (selected) {
    alpha = 0.44 + dash * 0.50;
  }
  return vec4f(color, alpha);
}`,fp=`
struct Globals {
  camera: vec4f,
  viewport: vec2f,
  activeNet: u32,
  _pad: u32,
};
@group(0) @binding(0) var<uniform> globals: Globals;
struct Out {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};
@vertex fn vs(@location(0) world: vec2f, @location(1) color: vec4f) -> Out {
  let halfViewport = globals.viewport * globals.camera.z * 0.5;
  let clip = vec2f(
    (world.x - globals.camera.x) / halfViewport.x,
    -(world.y - globals.camera.y) / halfViewport.y
  );
  var out: Out;
  out.position = vec4f(clip, 0.1, 1.0);
  out.color = color;
  return out;
}
@fragment fn fs(input: Out) -> @location(0) vec4f {
  return input.color;
}`,hp=`
struct Globals {
  camera: vec4f,
  viewport: vec2f,
  activeNet: u32,
  _pad: u32,
};
struct ImageQuad {
  originSize: vec4f,
  flags: vec4f,
};
@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<uniform> imageQuad: ImageQuad;
@group(0) @binding(2) var imageSampler: sampler;
@group(0) @binding(3) var imageTexture: texture_2d<f32>;

struct Out {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vs(@builtin(vertex_index) index: u32) -> Out {
  var positions = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  );
  let uv = positions[index];
  let world = imageQuad.originSize.xy + uv * imageQuad.originSize.zw;
  let halfViewport = globals.viewport * globals.camera.z * 0.5;
  let clip = vec2f(
    (world.x - globals.camera.x) / halfViewport.x,
    -(world.y - globals.camera.y) / halfViewport.y
  );
  var out: Out;
  out.position = vec4f(clip, 0.08, 1.0);
  out.uv = uv;
  return out;
}

@fragment fn fs(input: Out) -> @location(0) vec4f {
  return textureSample(imageTexture, imageSampler, input.uv);
}`,bp=`
struct Globals {
  camera: vec4f,
  viewport: vec2f,
  activeNet: u32,
  _pad: u32,
};
@group(0) @binding(0) var<uniform> globals: Globals;
struct Out {
  @builtin(position) position: vec4f,
  @location(0) featureId: u32,
};
@vertex fn vs(@location(0) world: vec2f, @location(1) featureId: u32) -> Out {
  let halfViewport = globals.viewport * globals.camera.z * 0.5;
  let clip = vec2f(
    (world.x - globals.camera.x) / halfViewport.x,
    -(world.y - globals.camera.y) / halfViewport.y
  );
  var out: Out;
  out.position = vec4f(clip, 0.0, 1.0);
  out.featureId = featureId;
  return out;
}
@fragment fn fs(input: Out) -> @location(0) u32 {
  return input.featureId;
}`,pp=6.2,gp=4.6,mp=3.8,Cs=4*1024*1024,yp=Math.floor(Cs/6),bc=yp*6,Ns=512*1024,pc=512*1024,gc=96,xp=96,wp=18,mc=96*1024*1024,vp=2,js=class t{static async create(e,a){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let s=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!s)throw new Error("No WebGPU adapter is available");let n=await s.requestDevice(),r=await fetch(a,{cache:"default"});if(!r.ok)throw new Error(`Failed to load schematic manifest: ${r.status}`);let i=await r.json();if(!["prism.schematic_world_a0","prism.schematic_vector_a0"].includes(i.schema))throw new Error(`Unsupported schematic scene schema: ${i.schema}`);let o=i.featureTable||i.features,c=await fetch(new URL(o,a),{cache:"default"});if(!c.ok)throw new Error(`Failed to load schematic features: ${c.status}`);let d=Ep(await c.json());return new t(e,n,a,i,d)}constructor(e,a,s,n,r){this.canvas=e,this.device=a,this.manifestUrl=s,this.manifest=n,this.isNativeScene=n.schema==="prism.schematic_vector_a0",this.pages=n.pages||[],this.featuresByPage=r,this.featuresById=new Map;for(let p of Object.values(r))for(let u of p)this.featuresById.set(Number(u.id),u);this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"}),this.flowCanvas=null,this.flowContext=null,this.globalBuffer=a.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.bindGroupLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]});let i=a.createShaderModule({code:cp});this.pagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:this.format}]},primitive:{topology:"triangle-list"}}),this.edgeLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});let o=a.createShaderModule({code:lp});this.edgePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:o,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:o,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.edgeBindGroup=a.createBindGroup({layout:this.edgeLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}}]});let c=a.createShaderModule({code:dp});this.highlightPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:c,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:c,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.highlightBufferSize=4*1024*1024,this.highlightBuffer=a.createBuffer({size:this.highlightBufferSize,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});let d=a.createShaderModule({code:up});this.netFlowPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:d,entryPoint:"vs",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x2"}]}]},fragment:{module:d,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.netFlowBuffer=a.createBuffer({size:pc*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.globalUniformScratch=new Float32Array(12),this.pageUniformScratch=new Float32Array(8),this.imageUniformScratch=new Float32Array(8),this.vectorScratch=new Float32Array(Cs),this.highlightScratch=new Float32Array(this.highlightBufferSize/4),this.netFlowScratch=new Float32Array(pc),this.netTrackingCache=null,this.selectedIntrasheetLinkIndex=-1,this.truncatedHighlightCount=0,this.truncatedVectorCount=0,this.frameSerial=0,this.querySerial=0;let b=a.createShaderModule({code:fp});this.vectorPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:b,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x4"}]}]},fragment:{module:b,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.vectorBuffer=a.createBuffer({size:Cs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers=[this.vectorBuffer];let f=a.createShaderModule({code:hp});this.imagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:f,entryPoint:"vs"},fragment:{module:f,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}});let m=a.createShaderModule({code:bp});this.pickPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:m,entryPoint:"vs",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"uint32"}]}]},fragment:{module:m,entryPoint:"fs",targets:[{format:"r32uint"}]},primitive:{topology:"triangle-list"}}),this.pickVertexBuffer=a.createBuffer({size:Ns*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.pickReadBuffer=a.createBuffer({size:256,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pickTexture=null,this.pickTextureSize=[0,0],this.pickPending=!1,this.vectorChunks=new Map,this.failedVectorChunks=new Map,this.nativeDetailState=new Map,this.domDetailPageIds=new Set,this.nativeDetailThresholds=new Map,this.residentVectorBytes=0,this.sampler=a.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.placeholder=this.createSolidTexture([245,247,249,255]),this.pageResources=new Map,this.imageResources=new Map,this.loading=new Map,this.selectedPageId="",this.selectedFeatureId=0,this.activeNetUid="",this.showHierarchy=!0,this.downloadedBytes=0,this.world=n.worldBoundsMm,this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/900,(this.world.maxY-this.world.minY)/650,.1)*1.16,this.edgeBuffer=this.createEdgeBuffer();for(let p of this.pages)this.createPageResource(p)}createSolidTexture(e){let a=this.device.createTexture({size:[1,1],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.queue.writeTexture({texture:a},new Uint8Array(e),{bytesPerRow:4},[1,1]),a}createPageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={page:e,uniform:a,texture:this.placeholder,textureWidth:0,svgBlob:null,bindGroup:null};this.pageResources.set(e.id,s),this.updateBindGroup(s)}createImageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={path:e,uniform:a,texture:this.placeholder,loaded:!1,bindGroup:null};return this.imageResources.set(e,s),this.updateBindGroup(s),s}updateBindGroup(e){e.bindGroup=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e.uniform}},{binding:2,resource:this.sampler},{binding:3,resource:e.texture.createView()}]})}async loadImageTexture(e){let a=this.imageResources.get(e)||this.createImageResource(e);if(a.loaded)return a;let s=`image:${e}`;if(this.loading.has(s))return this.loading.get(s);let n=(async()=>{try{let r=await fetch(new URL(e,this.manifestUrl),{cache:"default"});if(!r.ok)throw new Error(`Failed to load schematic image ${e}: ${r.status}`);let i=await r.blob(),o=await createImageBitmap(i),c=this.device.createTexture({size:[o.width,o.height],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:o},{texture:c},[o.width,o.height]),o.close(),a.texture!==this.placeholder&&a.texture.destroy(),a.texture=c,a.loaded=!0,this.updateBindGroup(a)}finally{this.loading.delete(s)}return a})();return this.loading.set(s,n),n}createEdgeBuffer(){let e=new Map(this.pages.map(r=>[r.id,r])),a=[];for(let r of this.manifest.edges||[]){let i=e.get(r.source),o=e.get(r.target);!i||!o||a.push(i.worldX+i.widthMm/2,i.worldY+i.heightMm,o.worldX+o.widthMm/2,o.worldY)}let s=new Float32Array(a);if(!s.length)return null;let n=this.device.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(n,0,s),{buffer:n,count:s.length/2}}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));(this.canvas.width!==a||this.canvas.height!==s)&&(this.canvas.width=a,this.canvas.height=s),this.flowCanvas&&(this.flowCanvas.width!==a||this.flowCanvas.height!==s)&&(this.flowCanvas.width=a,this.flowCanvas.height=s)}setFlowOverlayCanvas(e){e&&(this.flowCanvas=e,this.flowContext=e.getContext("webgpu"),this.flowContext.configure({device:this.device,format:this.format,alphaMode:"premultiplied"}))}writeGlobals(){let e=this.globalUniformScratch;e[0]=this.center[0],e[1]=this.center[1],e[2]=this.scale,e[3]=performance.now()*.001,e[4]=this.canvas.width,e[5]=this.canvas.height,this.device.queue.writeBuffer(this.globalBuffer,0,e)}pagePixelWidth(e){return e.widthMm/this.scale}pageSourcePixelsPerMm(e){let a=this.pagePixelWidth(e)/Math.max(1,e.sourceWidthMm||e.widthMm),s=e.heightMm/this.scale/Math.max(1,e.sourceHeightMm||e.heightMm);return Math.min(a,s)}pageNativeDetailThresholds(e){let a=this.nativeDetailThresholds.get(e.id);if(a)return a;let s=Math.max(1,e.sourceWidthMm||e.widthMm),n=Math.max(1,e.sourceHeightMm||e.heightMm),r=s*n,i=Math.max(0,e.featureCount||e.featureIds?.length||0)/Math.max(1,r),o=re(1-i*72,.84,1.08),c=re(Math.sqrt(Math.max(s,n)/Math.max(1,Math.min(s,n)))/1.18,.92,1.14),d=re(pp*o*c,5,7.4),b={enter:d,exit:re(Math.min(d-1.2,gp*o),3.8,d-.7),prefetch:re(Math.min(d-2,mp*o),3,d-1)};return this.nativeDetailThresholds.set(e.id,b),b}pageWantsNativeDetail(e){if(!this.pageHasNativeDetail(e))return!1;let a=this.pageSourcePixelsPerMm(e),s=this.nativeDetailState.get(e.id)===!0,n=this.pageNativeDetailThresholds(e),r=s?n.exit:n.enter,i=a>=r;return i!==s&&this.nativeDetailState.set(e.id,i),i}pageNativeDetailReady(e){if(this.domDetailPageIds.has(e.id)||!this.pageWantsNativeDetail(e))return!1;let a=this.vectorChunks.get(e.id);return!a?.loaded||!a.segments?.length&&!a.fills?.length?!1:this.visibleNativeImagesReady(e,a)}visibleNativeImagesReady(e,a){if(!a?.images?.length)return!0;let s=this.sourceViewportBounds(e,4),n=!0;for(let r of a.images){if(!lt(r.bounds,s))continue;(this.imageResources.get(r.path)||this.createImageResource(r.path)).loaded||(n=!1,this.loadImageTexture(r.path).catch(()=>{}))}return n}visiblePages(){let e=this.canvas.width*this.scale/2,a=this.canvas.height*this.scale/2,s=this.center[0]-e,n=this.center[0]+e,r=this.center[1]-a,i=this.center[1]+a;return this.pages.filter(o=>o.worldX+o.widthMm>=s&&o.worldX<=n&&o.worldY+o.heightMm>=r&&o.worldY<=i)}worldViewportBounds(e=0){let a=this.canvas.width*this.scale/2,s=this.canvas.height*this.scale/2;return[this.center[0]-a-e,this.center[1]-s-e,this.center[0]+a+e,this.center[1]+s+e]}sourceViewportBounds(e,a=2.5){let s=this.worldViewportBounds(this.scale*8),n=(s[0]-e.worldX)/e.widthMm*e.sourceWidthMm-a,r=(s[1]-e.worldY)/e.heightMm*e.sourceHeightMm-a,i=(s[2]-e.worldX)/e.widthMm*e.sourceWidthMm+a,o=(s[3]-e.worldY)/e.heightMm*e.sourceHeightMm+a;return[Math.max(-a,Math.min(n,i)),Math.max(-a,Math.min(r,o)),Math.min(e.sourceWidthMm+a,Math.max(n,i)),Math.min(e.sourceHeightMm+a,Math.max(r,o))]}render(){this.frameSerial+=1,this.resize(),this.writeGlobals();let e=this.visiblePages(),a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.045,g:.055,b:.073,a:1},loadOp:"clear",storeOp:"store"}]});this.showHierarchy&&this.edgeBuffer&&(s.setPipeline(this.edgePipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.edgeBuffer.buffer),s.draw(this.edgeBuffer.count)),s.setPipeline(this.pagePipeline);for(let i of e){let o=this.pageResources.get(i.id),c=this.activeNetUid&&i.netUids.includes(this.activeNetUid),d=this.domDetailPageIds.has(i.id),b=!d&&this.pageNativeDetailReady(i),f=this.pageUniformScratch;f[0]=i.worldX,f[1]=i.worldY,f[2]=i.widthMm,f[3]=i.heightMm,f[4]=i.id===this.selectedPageId?1:0,f[5]=c?1:0,f[6]=this.activeNetUid?1:0,f[7]=b||d?1:0,this.device.queue.writeBuffer(o.uniform,0,f),s.setBindGroup(0,o.bindGroup),s.draw(6);let m=re(Math.ceil(this.pagePixelWidth(i)*1.3/512)*512,512,6144);o.textureWidth<m*.82&&this.loadPageTexture(i,m).catch(()=>{})}this.scheduleVisibleVectorLoads(e),this.drawVisibleImages(s,e),this.drawVisibleVectors(s,e);let n=this.writeNetTrackingOverlay();n&&!this.flowContext&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(n));let r=this.writeNetHighlights(e);return r&&(s.setPipeline(this.highlightPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.highlightBuffer),s.draw(r)),s.end(),this.device.queue.submit([a.finish()]),this.renderFlowOverlay(n),this.evictVectorChunks(e),e}renderFlowOverlay(e){if(!this.flowContext)return;let a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.flowContext.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});e&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(e)),s.end(),this.device.queue.submit([a.finish()])}drawVisibleImages(e,a){if(!this.isNativeScene)return;let s=!1;for(let n of a){if(this.domDetailPageIds.has(n.id)||!this.pageNativeDetailReady(n))continue;let r=this.vectorChunks.get(n.id);if(!r?.images?.length)continue;let i=this.sourceViewportBounds(n,4);for(let o of r.images){if(!lt(o.bounds,i))continue;let c=this.imageResources.get(o.path)||this.createImageResource(o.path);c.loaded||this.loadImageTexture(o.path).catch(()=>{});let d=o.worldOrigin||this.sourceToWorld(n,[o.xMm,o.yMm]),b=o.worldSize||this.sourceSizeToWorld(n,o.widthMm,o.heightMm),f=this.imageUniformScratch;f[0]=d[0],f[1]=d[1],f[2]=b[0],f[3]=b[1],f[4]=0,f[5]=0,f[6]=0,f[7]=0,this.device.queue.writeBuffer(c.uniform,0,f),s||(e.setPipeline(this.imagePipeline),s=!0),e.setBindGroup(0,c.bindGroup),e.draw(6)}}}drawVisibleVectors(e,a){if(!this.isNativeScene)return 0;let s=this.vectorScratch,n=0,r=0,i=0,o=0,c=!1,d=()=>{if(!n)return;let f=this.vectorBuffers[o];f||(f=this.device.createBuffer({size:Cs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers.push(f)),this.device.queue.writeBuffer(f,0,s,0,n),c||(e.setPipeline(this.vectorPipeline),e.setBindGroup(0,this.edgeBindGroup),c=!0);let m=Math.floor(n/6);e.setVertexBuffer(0,f),e.draw(m),i+=m,o+=1,n=0},b=f=>f>bc||f>s.length?(r+=1,!1):((n+f>bc||n+f>s.length)&&d(),!0);for(let f of a){if(this.domDetailPageIds.has(f.id)||!this.pageHasNativeDetail(f))continue;let m=this.vectorChunks.get(f.id);if(!m?.segments?.length&&!m?.fills?.length||!this.pageNativeDetailReady(f))continue;m.lastUsedFrame=this.frameSerial;let p=this.sourceViewportBounds(f),u=xc(m.spatial,p);for(let l of u.fills){if(!lt(l.bounds,p)||!b(18))continue;let y=this.featuresById.get(l.featureId),h=this.activeNetUid&&y?.netUid===this.activeNetUid,x=this.selectedFeatureId===l.featureId?[.24,.58,1,1]:h?[.06,1,.24,1]:this.activeNetUid&&Ba(y)?Ec(y,l.kind,l.color):lr(y,l.kind,l.color),v=l.worldPoints||l.points.map(T=>this.sourceToWorld(f,T));n=Up(s,n,v[0],v[1],v[2],x)}for(let l of u.segments){if(!lt(l.bounds,p))continue;let y=this.featuresById.get(l.featureId),h=this.activeNetUid&&y?.netUid===this.activeNetUid,g=this.selectedFeatureId===l.featureId,x=g?[.24,.58,1,1]:h?[.06,1,.24,1]:this.activeNetUid&&Ba(y)?Ec(y,l.kind,l.color):lr(y,l.kind,l.color),v=this.segmentWorldWidth(f,l,y,h||g);for(let T of this.visibleSegmentParts(f,l,y)){if(!b(36))continue;let I=T.worldA||this.sourceToWorld(f,T.a),S=T.worldB||this.sourceToWorld(f,T.b);n=Lp(s,n,I,S,v,x)}}}return d(),this.truncatedVectorCount=r,this.vectorTruncated=r>0,this.lastVectorVertices=i,this.lastVectorChunks=o,i}pageHasNativeDetail(e){return this.isNativeScene?e?.nativeDetail?.enabled!==!1:!1}scheduleVisibleVectorLoads(e){if(!this.isNativeScene)return;let a=[...this.vectorChunks.values()].filter(r=>r?.promise&&!r.loaded).length,s=Math.max(0,vp-a);if(!s)return;let n=e.filter(r=>!this.domDetailPageIds.has(r.id)).filter(r=>this.pageHasNativeDetail(r)&&this.pageSourcePixelsPerMm(r)>=this.pageNativeDetailThresholds(r).prefetch).filter(r=>!this.vectorChunks.get(r.id)?.loaded&&!this.vectorChunks.get(r.id)?.promise).sort((r,i)=>{let o=Math.hypot(r.worldX+r.widthMm/2-this.center[0],r.worldY+r.heightMm/2-this.center[1]),c=Math.hypot(i.worldX+i.widthMm/2-this.center[0],i.worldY+i.heightMm/2-this.center[1]);return o-c});for(let r of n)if(this.loadPageVectors(r).catch(()=>{}),s-=1,!s)break}featurePrimitiveBounds(e,a){let s=this.vectorChunks.get(e.id);if(!s?.segments?.length&&!s?.fills?.length)return null;let n=[],r=[];for(let i of s.segments||[])i.featureId===a&&(n.push(i.a[0],i.b[0]),r.push(i.a[1],i.b[1]));for(let i of s.fills||[])if(i.featureId===a)for(let o of i.points||[])n.push(o[0]),r.push(o[1]);return n.length?[Math.min(...n),Math.min(...r),Math.max(...n),Math.max(...r)]:null}symbolClipBounds(e){if(this._symbolClipBounds||(this._symbolClipBounds=new Map),this._symbolClipBounds.has(e.id))return this._symbolClipBounds.get(e.id);let a=(this.featuresByPage[e.id]||[]).filter(s=>s?.kind==="symbol_body"&&s.boundsMm&&!String(s.sourceId||"").includes(":overplot")).map(s=>{let n=this.featurePrimitiveBounds(e,s.id)||s.boundsMm;return[n[0]-.02,n[1]-.02,n[2]+.02,n[3]+.02]}).filter(s=>{let n=s[2]-s[0],r=s[3]-s[1];return Math.max(n,r)<=12&&n*r<=80});return this._symbolClipBounds.set(e.id,a),a}visibleSegmentParts(e,a,s){if(a._visibleParts)return a._visibleParts;let n=String(s?.kind||""),r=String(s?.semanticRole||"");if(n!=="wire"&&r!=="wire")return a._visibleParts=[a],a._visibleParts;let i=[a];for(let o of this.symbolClipBounds(e)){let c=[];for(let d of i)c.push(...zp(d,o));if(i=c,!i.length)break}for(let o of i)o.worldA=da(e,o.a),o.worldB=da(e,o.b);return a._visibleParts=i,a._visibleParts}netTrackingSegments(){if(!this.activeNetUid)return{netUid:"",anchorsByPage:new Map,segments:[],intrasheetSegments:[]};let e=Number(this.selectedFeatureId||0),a=String(this.selectedFeatureKey||""),s=String(this.selectedSourceId||"");if(this.netTrackingCache?.netUid===this.activeNetUid&&this.netTrackingCache?.selectedFeatureId===e&&this.netTrackingCache?.selectedFeatureKey===a&&this.netTrackingCache?.selectedSourceId===s)return this.netTrackingCache;this.selectedIntrasheetLinkIndex=-1;let n=new Map(this.pages.map(u=>[u.id,u])),r=this.manifest.netToPages?.[this.activeNetUid]||[],i=r.length?r.map(u=>n.get(u)).filter(Boolean):this.pages.filter(u=>u.netUids?.includes(this.activeNetUid)),o=new Map;for(let u of i.slice(0,xp)){let l=this.netTrackingAnchorsForPage(u);l.length&&o.set(u.id,l)}let c=[],d=[];for(let[u,l]of o){let y=vc(jp(l),"intrasheet",u);c.push(...y),d.push(...y)}let b=[...o.entries()].map(([u,l])=>Op(n.get(u),l,{featureId:e,stableKey:a,sourceId:s})).filter(Boolean);c.push(...vc(b,"intersheet",""));let f=d.map((u,l)=>({...u,intrasheetIndex:l})),m=0,p=c.map((u,l)=>{if(u.type!=="intrasheet")return{...u,id:l};let y=m;return m+=1,{...u,id:l,intrasheetIndex:y}});return this.netTrackingCache={netUid:this.activeNetUid,selectedFeatureId:e,selectedFeatureKey:a,selectedSourceId:s,anchorsByPage:o,segments:p,intrasheetSegments:f},this.selectedIntrasheetLinkIndex>=this.netTrackingCache.intrasheetSegments.length&&(this.selectedIntrasheetLinkIndex=-1),this.netTrackingCache}netTrackingAnchorsForPage(e){let a=this.featuresByPage[e.id]||[],s=[];for(let n of a){if(n.netUid!==this.activeNetUid||!n.boundsMm||!Fp(n))continue;let r=n.boundsMm,i=[(r[0]+r[2])/2,(r[1]+r[3])/2],o=this.sourceToWorld(e,i);s.push({pageId:e.id,featureId:Number(n.id||0),stableKey:String(n.stableKey||""),sourceId:String(n.sourceId||n.sourceUid||n.objectId||""),kind:n.kind||n.semanticRole||"",source:i,world:o,bounds:r,priority:Bp(n)})}return s.sort((n,r)=>r.priority-n.priority||n.source[1]-r.source[1]||n.source[0]-r.source[0]),s}writeNetTrackingOverlay(){let e=this.netTrackingSegments();if(this.lastNetFlowSegments=e.segments.length,this.lastNetFlowIntrasheetSegments=e.intrasheetSegments.length,!e.segments.length)return this.lastNetFlowVertices=0,0;let a=this.worldViewportBounds(this.scale*96),s=this.netFlowScratch,n=0,r=0;for(let i of e.segments){if(!lt(Mc(i),a))continue;let o=i.type==="intrasheet"&&i.intrasheetIndex===this.selectedIntrasheetLinkIndex,c=o?9.5:i.type==="intersheet"?8:4.8,d=o?2:i.type==="intersheet"?1:0,b=Gp(s,n,i.a,i.b,c*this.scale,d,r,this.scale);if(b!==n&&(n=b,r+=Math.hypot(i.b[0]-i.a[0],i.b[1]-i.a[1])/Math.max(this.scale,1e-6),n+24>s.length))break}return n?(this.device.queue.writeBuffer(this.netFlowBuffer,0,s,0,n),this.lastNetFlowVertices=n/4,n/4):(this.lastNetFlowVertices=0,0)}cycleNetIntrasheetLink(e=1){let a=this.netTrackingSegments();if(!a.intrasheetSegments.length)return null;let s=a.intrasheetSegments.length;this.selectedIntrasheetLinkIndex=(this.selectedIntrasheetLinkIndex+e+s)%s;let n=a.intrasheetSegments[this.selectedIntrasheetLinkIndex];if(!n)return null;let r=Mc(n,14*this.scale);return this.center=[(r[0]+r[2])/2,(r[1]+r[3])/2],this.scale=Math.max((r[2]-r[0])/Math.max(1,this.canvas.width*.36),(r[3]-r[1])/Math.max(1,this.canvas.height*.3),this.scale*.35,.025),{pageId:n.pageId,segment:n}}writeNetHighlights(e){if(!this.activeNetUid)return 0;let a=this.highlightScratch,s=0,n=0;for(let r of e){let i=this.sourceViewportBounds(r,5);for(let o of this.featuresByPage[r.id]||[]){if(o.netUid!==this.activeNetUid||!o.boundsMm||!lt(o.boundsMm,i))continue;let c=this.featureWorldBounds(r,o.boundsMm);if(s+16>a.length){n+=1;continue}a[s++]=c[0],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[3],a[s++]=c[2],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[1]}}return this.truncatedHighlightCount=n,s?(this.device.queue.writeBuffer(this.highlightBuffer,0,a,0,s),s/2):0}featureWorldBounds(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm,e.worldX+a[2]/e.sourceWidthMm*e.widthMm,e.worldY+a[3]/e.sourceHeightMm*e.heightMm]}sourceToWorld(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm]}sourceSizeToWorld(e,a,s){return[a/e.sourceWidthMm*e.widthMm,s/e.sourceHeightMm*e.heightMm]}async loadPageVectors(e){if(!this.pageHasNativeDetail(e)||!e.chunks?.lod2)return null;let a=this.vectorChunks.get(e.id);if(a?.loaded)return a;if(a?.promise)return a.promise;let s=(async()=>{try{let n=await fetch(new URL(e.chunks.lod2,this.manifestUrl));if(!n.ok)throw new Error(`Failed to load schematic vector chunk ${e.id}: ${n.status}`);let r=await n.json(),i=Tp(r.primitives||[]);kp(e,i);let c=JSON.stringify(r).length,d={loaded:!0,segments:i.segments,fills:i.fills,images:i.images,spatial:Cp(i),unsupported:r.unsupported||[],bytes:c,lastUsedFrame:this.frameSerial};return this.vectorChunks.set(e.id,d),this.failedVectorChunks.delete(e.id),this.residentVectorBytes+=c,d}catch(n){let r=this.failedVectorChunks.get(e.id)||{count:0,message:""};throw this.failedVectorChunks.set(e.id,{count:r.count+1,message:n?.message||String(n)}),this.vectorChunks.delete(e.id),n}})();return this.vectorChunks.set(e.id,{loaded:!1,promise:s,segments:[]}),s}evictVectorChunks(e){if(this.residentVectorBytes<=mc)return;let a=new Set(e.map(n=>n.id)),s=[...this.vectorChunks.entries()].filter(([,n])=>n?.loaded).filter(([n])=>!a.has(n)&&n!==this.selectedPageId).sort((n,r)=>(n[1].lastUsedFrame||0)-(r[1].lastUsedFrame||0));for(let[n,r]of s)if(this.vectorChunks.delete(n),this.residentVectorBytes=Math.max(0,this.residentVectorBytes-(r.bytes||0)),this.residentVectorBytes<=mc*.82)break}stats(){let e=this.visiblePages(),a=e.map(n=>this.pageSourcePixelsPerMm(n)),s=e.map(n=>this.pageNativeDetailThresholds(n).enter);return{residentVectorBytes:this.residentVectorBytes,vectorChunks:[...this.vectorChunks.values()].filter(n=>n?.loaded).length,vectorLoads:[...this.vectorChunks.values()].filter(n=>n?.promise&&!n.loaded).length,failedVectorChunks:this.failedVectorChunks.size,vectorVertices:this.lastVectorVertices||0,vectorDrawChunks:this.lastVectorChunks||0,truncatedVectors:this.truncatedVectorCount||0,nativeDetailPages:[...this.nativeDetailState.values()].filter(Boolean).length,nativePxPerMm:Number((Math.max(0,...a)||0).toFixed(2)),nativeThresholdPxPerMm:Number((s.length?Math.min(...s):0).toFixed(2)),domDetailPages:this.domDetailPageIds.size,netFlowSegments:this.lastNetFlowSegments||0,netFlowIntrasheetSegments:this.lastNetFlowIntrasheetSegments||0,netFlowVertices:this.lastNetFlowVertices||0}}setDomDetailPageIds(e){this.domDetailPageIds=new Set(e||[])}async loadPageTexture(e,a){let s=`${e.id}:${a}`;if(this.loading.has(s))return this.loading.get(s);let n=this.pageResources.get(e.id);if(!n||n.textureWidth>=a)return;let r=(async()=>{if(!n.svgBlob){let c=await fetch(new URL(Mp(e),this.manifestUrl));if(!c.ok)throw new Error(`Failed to load schematic page ${e.name}: ${c.status}`);n.svgBlob=await c.blob(),this.downloadedBytes+=n.svgBlob.size}let i=n.svgBlob,o=URL.createObjectURL(i);try{let c=new Image;if(c.decoding="async",c.src=o,await c.decode(),n.textureWidth>=a)return;let d=Math.max(64,Math.round(a*e.heightMm/e.widthMm)),b=new OffscreenCanvas(a,d),f=b.getContext("2d",{alpha:!1});f.fillStyle="#ffffff",f.fillRect(0,0,a,d),f.drawImage(c,0,0,a,d);let m=await createImageBitmap(b),p=this.device.createTexture({size:[a,d],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:m},{texture:p},[a,d]),m.close(),n.texture!==this.placeholder&&n.texture.destroy(),n.texture=p,n.textureWidth=a,this.updateBindGroup(n)}finally{URL.revokeObjectURL(o),this.loading.delete(s)}})();return this.loading.set(s,r),r}preloadOverview(){let e=[...this.pages],a=async()=>{for(;e.length;){let s=e.shift();await this.loadPageTexture(s,512).catch(()=>{})}};return Promise.all(Array.from({length:Math.min(4,e.length)},a))}screenToWorld(e,a){let s=this.canvas.getBoundingClientRect(),n=(e-s.left)*this.canvas.width/s.width,r=(a-s.top)*this.canvas.height/s.height;return[this.center[0]+(n-this.canvas.width/2)*this.scale,this.center[1]+(r-this.canvas.height/2)*this.scale]}worldToScreen(e,a){let s=this.canvas.clientWidth/this.canvas.width,n=this.canvas.clientHeight/this.canvas.height;return[((e-this.center[0])/this.scale+this.canvas.width/2)*s,((a-this.center[1])/this.scale+this.canvas.height/2)*n]}hitPage(e,a){let[s,n]=this.screenToWorld(e,a);return[...this.pages].reverse().find(r=>s>=r.worldX&&s<=r.worldX+r.widthMm&&n>=r.worldY&&n<=r.worldY+r.heightMm)||null}async pickFeature(e,a){if(!this.isNativeScene)return this.hitFeature(e,a);let s=this.hitPage(e,a);if(!s)return null;if(!this.pageHasNativeDetail(s))return this.hitFeature(e,a);await this.loadPageVectors(s);let n=await this.gpuPickFeature(s,e,a);return n&&!Fa(n)?{page:s,feature:n,source:this.clientToSource(s,e,a),native:!0,gpu:!0}:this.hitFeature(e,a)}hitFeature(e,a){let s=this.hitPage(e,a);if(!s)return null;let[n,r]=this.clientToSource(s,e,a),i=Math.max(.45,5*this.scale*this.canvas.width/Math.max(1,this.canvas.clientWidth)*s.sourceWidthMm/s.widthMm),o=this.hitResidentVectorFeature(s,n,r,i);if(o)return{page:s,feature:o,source:[n,r],native:!0};let c=this.hitSymbolInterior(s,n,r);if(c)return{page:s,feature:c,source:[n,r],native:!0,interior:!0};let d=(this.featuresByPage[s.id]||[]).filter(b=>{if(Fa(b))return!1;let f=b.boundsMm;return f&&n>=f[0]-i&&n<=f[2]+i&&r>=f[1]-i&&r<=f[3]+i}).map(b=>({feature:b,priority:Ca(b),area:Math.max(1e-4,(b.boundsMm[2]-b.boundsMm[0])*(b.boundsMm[3]-b.boundsMm[1]))})).sort((b,f)=>f.priority-b.priority||b.area-f.area);return{page:s,feature:d[0]?.feature||null,source:[n,r]}}hitSymbolInterior(e,a,s){let n=null;for(let r of this.featuresByPage[e.id]||[]){let i=String(r?.kind||"");if(i!=="symbol_body"&&i!=="symbol_instance"||String(r?.sourceId||"").includes(":overplot"))continue;let o=r.boundsMm;if(!o||a<o[0]||a>o[2]||s<o[1]||s>o[3])continue;let c=Math.max(1e-4,(o[2]-o[0])*(o[3]-o[1])),d=(i==="symbol_body"?0:1e6)+c;(!n||d<n.score)&&(n={feature:r,score:d})}return n?.feature||null}clientToSource(e,a,s){let[n,r]=this.screenToWorld(a,s);return[(n-e.worldX)/e.widthMm*e.sourceWidthMm,(r-e.worldY)/e.heightMm*e.sourceHeightMm]}ensurePickTexture(){this.pickTexture&&this.pickTextureSize[0]===this.canvas.width&&this.pickTextureSize[1]===this.canvas.height||(this.pickTexture&&this.pickTexture.destroy(),this.pickTexture=this.device.createTexture({size:[this.canvas.width,this.canvas.height],format:"r32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),this.pickTextureSize=[this.canvas.width,this.canvas.height])}writePickVectors(e){let a=new ArrayBuffer(Ns*12),s=new DataView(a),n=0,r=[];for(let i of e){let o=this.vectorChunks.get(i.id);if(!o?.segments?.length&&!o?.fills?.length&&!o?.images?.length)continue;let c=this._pickSourcePointByPage?.get(i.id),d=c?[c[0]-2.5,c[1]-2.5,c[0]+2.5,c[1]+2.5]:[0,0,i.sourceWidthMm,i.sourceHeightMm],b=xc(o.spatial,d);for(let f of b.images){if(!lt(f.bounds,d))continue;let m=this.featuresById.get(f.featureId);!m||Fa(m)||r.push({page:i,image:f,feature:m,priority:Ca(m)-5})}for(let f of b.fills){if(!lt(f.bounds,d))continue;let m=this.featuresById.get(f.featureId);!m||Fa(m)||r.push({page:i,fill:f,feature:m,priority:Ca(m)-2})}for(let f of b.segments){if(!lt(f.bounds,d))continue;let m=this.featuresById.get(f.featureId);!m||Fa(m)||r.push({page:i,segment:f,feature:m,priority:Ca(m)})}}r.sort((i,o)=>i.priority-o.priority);for(let{page:i,segment:o,fill:c,image:d,feature:b}of r){if(n+6>Ns)break;if(d){let f=this.sourceToWorld(i,[d.xMm,d.yMm]),m=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm]),p=this.sourceToWorld(i,[d.xMm,d.yMm+d.heightMm]),u=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm+d.heightMm]);n=cr(s,n,f,m,p,d.featureId),n=cr(s,n,p,m,u,d.featureId)}else if(c){let f=c.worldPoints||c.points.map(m=>this.sourceToWorld(i,m));n=cr(s,n,f[0],f[1],f[2],c.featureId)}else{let f=Math.max(this.segmentWorldWidth(i,o,b,!1),this.scale*7);for(let m of this.visibleSegmentParts(i,o,b)){if(n+6>Ns)break;let p=m.worldA||this.sourceToWorld(i,m.a),u=m.worldB||this.sourceToWorld(i,m.b);n=Vp(s,n,p,u,f,o.featureId)}}}return n?(this.device.queue.writeBuffer(this.pickVertexBuffer,0,a,0,n*12),n):0}async gpuPickFeature(e,a,s){if(this.pickPending)return null;let n=this.clientToSource(e,a,s);this._pickSourcePointByPage=new Map([[e.id,n]]);let r=this.writePickVectors([e]);if(this._pickSourcePointByPage=null,!r)return null;this.resize(),this.writeGlobals(),this.ensurePickTexture();let i=this.canvas.getBoundingClientRect(),o=Math.max(0,Math.min(this.canvas.width-1,Math.floor((a-i.left)*this.canvas.width/i.width))),c=Math.max(0,Math.min(this.canvas.height-1,Math.floor((s-i.top)*this.canvas.height/i.height))),d=this.device.createCommandEncoder(),b=d.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});b.setPipeline(this.pickPipeline),b.setBindGroup(0,this.edgeBindGroup),b.setVertexBuffer(0,this.pickVertexBuffer),b.draw(r),b.end(),d.copyTextureToBuffer({texture:this.pickTexture,origin:{x:o,y:c}},{buffer:this.pickReadBuffer,bytesPerRow:256,rowsPerImage:1},{width:1,height:1,depthOrArrayLayers:1}),this.pickPending=!0,this.device.queue.submit([d.finish()]);try{await this.pickReadBuffer.mapAsync(GPUMapMode.READ);let f=new DataView(this.pickReadBuffer.getMappedRange()).getUint32(0,!0);return this.pickReadBuffer.unmap(),f&&this.featuresById.get(f)||null}finally{this.pickReadBuffer.mapState==="mapped"&&this.pickReadBuffer.unmap(),this.pickPending=!1}}hitResidentVectorFeature(e,a,s,n){if(!this.isNativeScene)return null;let r=this.vectorChunks.get(e.id);if(!r?.loaded)return null;let i=null;for(let o of r.segments){let c=this.featuresById.get(o.featureId),d=Math.max(n,(o.widthMm||0)*.5+n*.45);if(c)for(let b of this.visibleSegmentParts(e,o,c)){let f=Kp([a,s],b.a,b.b);if(f>d)continue;let m=f-Ca(c)*.025+(Ba(c)?0:8);(!i||m<i.score)&&(i={feature:c,score:m})}}return i?.feature||null}segmentWorldWidth(e,a,s,n){let r=(a.widthMm||.15)/Math.max(1,e.sourceWidthMm)*e.widthMm;return Math.max(r,this.scale*Dp(s,a.kind,n))}pan(e,a){let s=this.canvas.width/Math.max(1,this.canvas.clientWidth);this.center[0]-=e*this.scale*s,this.center[1]-=a*this.scale*s}zoom(e,a,s){let n=this.screenToWorld(a,s);this.scale=re(this.scale*Math.exp(e*.0015),.015,16);let r=this.screenToWorld(a,s);this.center[0]+=n[0]-r[0],this.center[1]+=n[1]-r[1]}framePage(e){e&&(this.resize(),this.center=[e.worldX+e.widthMm/2,e.worldY+e.heightMm/2],this.scale=Math.max(e.widthMm/Math.max(1,this.canvas.width*.88),e.heightMm/Math.max(1,this.canvas.height*.84)))}frameWorld(){this.resize(),this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/Math.max(1,this.canvas.width*.9),(this.world.maxY-this.world.minY)/Math.max(1,this.canvas.height*.88),.05)}};function Mp(t){return t.thumbnail?.path||t.svg}function Ep(t){if(t.schema==="prism.schematic_vector_a0.features"){let e=new Map((t.features||[]).map(s=>[Number(s.id),s])),a={};for(let[s,n]of Object.entries(t.pages||{}))a[s]=n.map(r=>e.get(Number(r))).filter(Boolean);return a}return t.pages||{}}function Tp(t){let e=[],a=[],s=[];for(let n of t){let r=Number(n.featureId||0);if(!r)continue;if(n.kind==="plotimage"&&n.image?.path){let g=n.xMm||0,x=n.yMm||0,v=n.widthMm||0,T=n.heightMm||0;s.push({featureId:r,kind:n.kind,xMm:g,yMm:x,widthMm:v,heightMm:T,bounds:[g,x,g+v,x+T],path:n.image.path});continue}let i=String(n.semanticRole||""),o=n.radiusMm||n.diameterMm/2||0,c=String(n.fill||"").toUpperCase()==="FILLED_SHAPE",d=n.widthMm||n.pen_widthMm||(i==="junction"?.08:.15),b=String(n.lineStyle||n.line_style||"DEFAULT").toUpperCase(),f=n.color||n.strokeColor||n.style?.color||"",m=n.fillColor||n.color||n.style?.color||"",p=(g,x)=>_p(e,{featureId:r,kind:n.kind,widthMm:d,lineStyle:b,color:f},g,x),u=n.x1Mm,l=n.y1Mm,y=n.x2Mm,h=n.y2Mm;if(n.trianglesMm?.length){for(let g of n.trianglesMm)Array.isArray(g)&&g.length===3&&a.push({featureId:r,kind:n.kind,color:m,points:g,bounds:Tc(g)});if(n.pointsMm?.length>=2){for(let g=1;g<n.pointsMm.length;g+=1)p(n.pointsMm[g-1],n.pointsMm[g]);wc(n)&&p(n.pointsMm[n.pointsMm.length-1],n.pointsMm[0])}}else if(n.pointsMm?.length>=2){c&&n.pointsMm.length>=3&&Ap(a,r,n.kind,n.pointsMm,m);for(let g=1;g<n.pointsMm.length;g+=1)p(n.pointsMm[g-1],n.pointsMm[g]);wc(n)&&p(n.pointsMm[n.pointsMm.length-1],n.pointsMm[0])}else if(n.polylinesMm?.length){for(let g of n.polylinesMm)if(!(!Array.isArray(g)||g.length<2))for(let x=1;x<g.length;x+=1)p(g[x-1],g[x])}else if(Number.isFinite(u)&&Number.isFinite(l)&&Number.isFinite(y)&&Number.isFinite(h))n.kind==="rect"?(c&&Sp(a,r,n.kind,[u,l,y,h],m),p([u,l],[y,l]),p([y,l],[y,h]),p([y,h],[u,h]),p([u,h],[u,l])):p([u,l],[y,h]);else if(Number.isFinite(n.cxMm)&&Number.isFinite(n.cyMm)){let g=n.radiusMm||n.diameterMm/2||.4;c&&Rp(a,r,n.kind,[n.cxMm,n.cyMm],g,m),Np(e,{featureId:r,kind:n.kind,widthMm:d,lineStyle:b,color:f},[n.cxMm,n.cyMm],g)}else if(n.contoursMm?.length){for(let g of n.contoursMm)if(!(!Array.isArray(g)||g.length<2)){for(let x=1;x<g.length;x+=1)p(g[x-1],g[x]);p(g[g.length-1],g[0])}}else if(Number.isFinite(n.start_xMm)&&Number.isFinite(n.start_yMm)&&Number.isFinite(n.end_xMm)&&Number.isFinite(n.end_yMm))Number.isFinite(n.mid_xMm)&&Number.isFinite(n.mid_yMm)?(p([n.start_xMm,n.start_yMm],[n.mid_xMm,n.mid_yMm]),p([n.mid_xMm,n.mid_yMm],[n.end_xMm,n.end_yMm])):p([n.start_xMm,n.start_yMm],[n.end_xMm,n.end_yMm]);else if(Number.isFinite(n.start_xMm)&&Number.isFinite(n.start_yMm)&&Number.isFinite(n.mid_xMm)&&Number.isFinite(n.mid_yMm)&&Number.isFinite(n.end_xMm)&&Number.isFinite(n.end_yMm))p([n.start_xMm,n.start_yMm],[n.mid_xMm,n.mid_yMm]),p([n.mid_xMm,n.mid_yMm],[n.end_xMm,n.end_yMm]);else if(n.boundsMm&&n.kind!=="text"){let[g,x,v,T]=n.boundsMm;p([g,x],[v,x]),p([v,x],[v,T]),p([v,T],[g,T]),p([g,T],[g,x])}}return{segments:e,fills:a,images:s}}function kp(t,e){for(let a of e.segments||[])a.worldA=da(t,a.a),a.worldB=da(t,a.b);for(let a of e.fills||[])a.worldPoints=a.points.map(s=>da(t,s));for(let a of e.images||[])a.worldOrigin=da(t,[a.xMm,a.yMm]),a.worldSize=Ip(t,a.widthMm,a.heightMm)}function da(t,e){return[t.worldX+e[0]/t.sourceWidthMm*t.widthMm,t.worldY+e[1]/t.sourceHeightMm*t.heightMm]}function Ip(t,e,a){return[e/t.sourceWidthMm*t.widthMm,a/t.sourceHeightMm*t.heightMm]}function Sp(t,e,a,s,n){let[r,i,o,c]=s;t.push({featureId:e,kind:a,color:n,points:[[r,i],[o,i],[r,c]],bounds:[r,i,o,c]},{featureId:e,kind:a,color:n,points:[[r,c],[o,i],[o,c]],bounds:[r,i,o,c]})}function Rp(t,e,a,s,n,r){for(let o=0;o<36;o+=1){let c=o/36*Math.PI*2,d=(o+1)/36*Math.PI*2;t.push({featureId:e,kind:a,color:r,points:[s,[s[0]+Math.cos(c)*n,s[1]+Math.sin(c)*n],[s[0]+Math.cos(d)*n,s[1]+Math.sin(d)*n]],bounds:[s[0]-n,s[1]-n,s[0]+n,s[1]+n]})}}function Ap(t,e,a,s,n){let r=s[0],i=Tc(s);for(let o=2;o<s.length;o+=1)t.push({featureId:e,kind:a,color:n,points:[r,s[o-1],s[o]],bounds:i})}function _p(t,e,a,s){let n=yc(a,s,e.widthMm||.15),r=e.lineStyle||"DEFAULT";if(!["DASH","DASHED","DOT","DOTTED","DASHDOT","DASH_DOT"].includes(r)){t.push({...e,a,b:s,bounds:n});return}let i=s[0]-a[0],o=s[1]-a[1],c=Math.hypot(i,o);if(c<1e-6)return;let d=i/c,b=o/c,f=Math.max(e.widthMm*4,.45),m=r.includes("DOT")?[f*.8,f*.75,f*3,f*.75]:[f*3,f*1.5],p=0,u=0;for(;p<c;){let l=Math.min(m[u%m.length],c-p);if(u%2===0){let y=[a[0]+d*p,a[1]+b*p],h=[a[0]+d*(p+l),a[1]+b*(p+l)];t.push({...e,a:y,b:h,bounds:yc(y,h,e.widthMm||.15)})}p+=l,u+=1}}function Np(t,e,a,s){for(let r=0;r<32;r+=1){let i=r/32*Math.PI*2,o=(r+1)/32*Math.PI*2;t.push({...e,a:[a[0]+Math.cos(i)*s,a[1]+Math.sin(i)*s],b:[a[0]+Math.cos(o)*s,a[1]+Math.sin(o)*s],bounds:[a[0]-s,a[1]-s,a[0]+s,a[1]+s]})}}function Tc(t,e=0){let a=1/0,s=1/0,n=-1/0,r=-1/0;for(let i of t||[])a=Math.min(a,i[0]),s=Math.min(s,i[1]),n=Math.max(n,i[0]),r=Math.max(r,i[1]);return Number.isFinite(a)?[a-e,s-e,n+e,r+e]:[0,0,0,0]}function yc(t,e,a=0){let s=Math.max(.05,a*.5);return[Math.min(t[0],e[0])-s,Math.min(t[1],e[1])-s,Math.max(t[0],e[0])+s,Math.max(t[1],e[1])+s]}function lt(t,e){return!t||!e?!0:t[0]<=e[2]&&t[2]>=e[0]&&t[1]<=e[3]&&t[3]>=e[1]}function Cp(t){let e={cellSize:wp,cells:new Map,segments:t.segments||[],fills:t.fills||[],images:t.images||[],queryId:0};for(let a of e.segments)ir(e,"segments",a);for(let a of e.fills)ir(e,"fills",a);for(let a of e.images)ir(e,"images",a);return e}function ir(t,e,a){let s=a.bounds;if(!s)return;let n=Math.floor(s[0]/t.cellSize),r=Math.floor(s[2]/t.cellSize),i=Math.floor(s[1]/t.cellSize),o=Math.floor(s[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=n;d<=r;d+=1){let b=`${d}:${c}`,f=t.cells.get(b);f||(f={segments:[],fills:[],images:[]},t.cells.set(b,f)),f[e].push(a)}}function xc(t,e){if(!t)return{segments:[],fills:[],images:[]};t.queryId=(t.queryId||0)+1;let a=t.queryId,s={segments:[],fills:[],images:[]},n=Math.floor(e[0]/t.cellSize),r=Math.floor(e[2]/t.cellSize),i=Math.floor(e[1]/t.cellSize),o=Math.floor(e[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=n;d<=r;d+=1){let b=t.cells.get(`${d}:${c}`);b&&(or(b.segments,s.segments,a,"segments"),or(b.fills,s.fills,a,"fills"),or(b.images,s.images,a,"images"))}return s}function or(t,e,a,s){let n=`_${s}QueryId`;for(let r of t)r[n]!==a&&(r[n]=a,e.push(r))}function wc(t){let e=String(t.kind||"");if(String(t.fill||"").toUpperCase()==="FILLED_SHAPE"||t.closed===!0||["polygon","fill"].includes(e))return!0;let s=t.pointsMm||[];if(s.length>=3){let n=s[0],r=s[s.length-1];return Math.hypot(n[0]-r[0],n[1]-r[1])<1e-6}return!1}function Ba(t){return!!t?.netUid}function Fp(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="pin"||e==="pin_body"||e==="label"||e==="global_label"||e==="hierarchical_label"||e==="netclass_flag"||e==="power_symbol"||e==="power_port"||a==="label"||a==="global_label"||a==="hierarchical_label"}function Bp(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="global_label"||a==="global_label"?130:e==="hierarchical_label"||a==="hierarchical_label"?125:e==="label"||a==="label"?118:e==="pin"||e==="pin_body"?106:e==="power_symbol"||e==="power_port"||e==="netclass_flag"?98:50}function jp(t){if(t.length<=gc)return t;let e=t.slice(0,gc);return e.sort((a,s)=>a.source[1]-s.source[1]||a.source[0]-s.source[0]),e}function Op(t,e,a={}){if(!t||!e?.length)return null;let s=a.featureId||a.stableKey||a.sourceId?e.find(d=>a.featureId&&Number(d.featureId||0)===Number(a.featureId)||a.stableKey&&d.stableKey===a.stableKey||a.sourceId&&d.sourceId===a.sourceId):null;if(s)return{...s,kind:"selected-net-occurrence",priority:200};let n=e.filter(d=>d.priority>=118).slice(0,16),r=n.length?n:e.slice(0,16),i=0,o=0;for(let d of r)i+=d.world[0],o+=d.world[1];let c=[i/r.length,o/r.length];return{pageId:t.id,featureId:r[0]?.featureId||0,kind:"page-net-occurrence",source:[0,0],world:c,bounds:[c[0],c[1],c[0],c[1]],priority:1}}function vc(t,e,a){if(!t||t.length<2)return[];let s=t.map(i=>({...i})).sort((i,o)=>i.world[1]-o.world[1]||i.world[0]-o.world[0]),n=[],r=s.shift();for(;s.length;){let i=0,o=1/0;for(let d=0;d<s.length;d+=1){let b=s[d],f=Math.hypot(b.world[0]-r.world[0],b.world[1]-r.world[1]);f<o&&(o=f,i=d)}let c=s.splice(i,1)[0];n.push({type:e,pageId:a||r.pageId||c.pageId||"",a:r.world,b:c.world,sourceFeatureIds:[r.featureId,c.featureId].filter(Boolean)}),r=c}return n}function Mc(t,e=0){return[Math.min(t.a[0],t.b[0])-e,Math.min(t.a[1],t.b[1])-e,Math.max(t.a[0],t.b[0])+e,Math.max(t.a[1],t.b[1])+e]}function Ca(t){let e=String(t?.kind||""),s=String(t?.semanticRole||"")||e;return s==="pin_number"||s==="pin_name"?120:s==="pin_body"||e==="pin"?110:s==="symbol_reference"||s==="symbol_value"?92:e==="junction"||e==="no_connect"?88:e==="wire"||e==="bus"||e==="bus_entry"?78:s==="symbol_body"||e==="symbol_body"?45:e==="symbol_instance"||e==="symbol_overplot"?30:e==="text"||String(s).includes("text")?24:10}function Fa(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");if(e==="page"||e==="sheet_header")return!0;if(e==="graphic_rect"&&a==="graphic_rect"&&!t?.netUid&&!t?.componentUid){let s=t.boundsMm||[];return s[2]-s[0]>150&&s[3]-s[1]>120}return!1}function Pp(t){if(!t||typeof t!="string")return null;let a=t.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);if(!a)return null;let s=a[1],n=a[2]??"ff";return[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255,parseInt(n,16)/255]}function lr(t,e,a=""){let s=Pp(a||t?.color||"");return t?.kind==="dnp_marker"?s||[.86,.04,.05,.85]:t?.dnp&&["symbol_reference","symbol_value","symbol_text"].includes(String(t?.kind||""))?[.5,.52,.54,.56]:s||(t?.dnp?[.5,.52,.54,.56]:Ba(t)?[.12,.56,.2,.96]:t?.kind==="pin_name"?[0,.28,.31,.96]:t?.kind==="pin_number"?[.45,.17,.16,.96]:t?.kind==="pin_body"?[.28,.18,.18,.88]:t?.kind==="symbol_body"||t?.kind==="symbol_instance"?[.42,.18,.18,.72]:t?.kind==="symbol_reference"||t?.kind==="symbol_value"?[.05,.13,.16,.94]:t?.kind==="text"||String(e||"").startsWith("text")?[.05,.13,.16,.94]:[.16,.17,.19,.7])}function Ec(t,e,a=""){let s=lr(t,e,a);return[s[0]*.72,s[1]*.72,s[2]*.72,Math.min(s[3],.38)]}function Dp(t,e,a){return a?5.5:t?.kind==="dnp_marker"?3:["pin_name","pin_number"].includes(String(t?.kind||""))?1.5:t?.kind==="pin_body"?1.7:String(e||"").startsWith("text")?1.35:e==="bus"||t?.kind==="bus"?4.2:Ba(t)?2.6:t?.kind==="symbol_body"||t?.kind==="symbol_instance"||t?.kind==="sheet"?1.5:1.25}function Fs(t,e,a,s){return t[e++]=a[0],t[e++]=a[1],t[e++]=s[0],t[e++]=s[1],t[e++]=s[2],t[e++]=s[3],e}function Lp(t,e,a,s,n,r){let i=kc(a,s,n);if(!i)return e;for(let o of i)e=Fs(t,e,o,r);return e}function Up(t,e,a,s,n,r){return e=Fs(t,e,a,r),e=Fs(t,e,s,r),e=Fs(t,e,n,r),e}function la(t,e,a,s,n){return t[e++]=a[0],t[e++]=a[1],t[e++]=s,t[e++]=n,e}function Gp(t,e,a,s,n,r,i,o){let c=s[0]-a[0],d=s[1]-a[1],b=Math.hypot(c,d);if(b<1e-6||e+24>t.length)return e;let f=n*.5,m=c/b,u=-(d/b)*f,l=m*f,y=[a[0]+u,a[1]+l],h=[a[0]-u,a[1]-l],g=[s[0]+u,s[1]+l],x=[s[0]-u,s[1]-l],v=i+b/Math.max(o,1e-6);return e=la(t,e,y,i,r),e=la(t,e,h,i,r),e=la(t,e,g,v,r),e=la(t,e,g,v,r),e=la(t,e,h,i,r),e=la(t,e,x,v,r),e}function kc(t,e,a){let s=e[0]-t[0],n=e[1]-t[1],r=Math.hypot(s,n);if(r<1e-6)return null;let i=a*.5,o=s/r*i,c=n/r*i,d=-n/r*i,b=s/r*i,f=[t[0]-o,t[1]-c],m=[e[0]+o,e[1]+c],p=[f[0]+d,f[1]+b],u=[f[0]-d,f[1]-b],l=[m[0]+d,m[1]+b],y=[m[0]-d,m[1]-b];return[p,u,l,l,u,y]}function Kp(t,e,a){let s=a[0]-e[0],n=a[1]-e[1],r=s*s+n*n||1,i=re(((t[0]-e[0])*s+(t[1]-e[1])*n)/r,0,1),o=e[0]+s*i,c=e[1]+n*i;return Math.hypot(t[0]-o,t[1]-c)}function zp(t,e){let[a,s,n,r]=e,[i,o]=t.a,[c,d]=t.b,b=1e-6,f=(m,p)=>({...t,a:m,b:p});if(Math.abs(o-d)<=b){let m=o;if(m<s-b||m>r+b)return[t];let p=Math.min(i,c),u=Math.max(i,c),l=Math.max(p,a),y=Math.min(u,n);if(y<=l+b)return[t];let h=[],g=i<=c;if(p<l-b){let x=g?[p,m]:[l,m],v=g?[l,m]:[p,m];h.push(f(x,v))}if(y<u-b){let x=g?[y,m]:[u,m],v=g?[u,m]:[y,m];h.push(f(x,v))}return h}if(Math.abs(i-c)<=b){let m=i;if(m<a-b||m>n+b)return[t];let p=Math.min(o,d),u=Math.max(o,d),l=Math.max(p,s),y=Math.min(u,r);if(y<=l+b)return[t];let h=[],g=o<=d;if(p<l-b){let x=g?[m,p]:[m,l],v=g?[m,l]:[m,p];h.push(f(x,v))}if(y<u-b){let x=g?[m,y]:[m,u],v=g?[m,u]:[m,y];h.push(f(x,v))}return h}return[t]}function Bs(t,e,a,s){let n=e*12;t.setFloat32(n,a[0],!0),t.setFloat32(n+4,a[1],!0),t.setUint32(n+8,s,!0)}function Vp(t,e,a,s,n,r){let i=kc(a,s,n);if(!i)return e;for(let o of i)Bs(t,e,o,r),e+=1;return e}function cr(t,e,a,s,n,r){return Bs(t,e,a,r),Bs(t,e+1,s,r),Bs(t,e+2,n,r),e+3}function Hp(t,e){let a=Array.isArray(t?.layerIds)?t.layerIds:[];if(a.length<2&&t?.startLayerId!=null&&t?.endLayerId!=null&&(a=[t.startLayerId,t.endLayerId]),a.length<2&&t?.layerMask!=null)try{let s=BigInt(String(t.layerMask));a=e.filter((n,r)=>(s&1n<<BigInt(r))!==0n).map(n=>n.id)}catch{a=[]}return a}function qp(t){let e=t?.objectFeatureId??t?.id;if(e!=null&&Number.isFinite(Number(e))&&Number(e)!==0)return`feature:${Number(e)}`;let a=String(t?.sourceUid||"");return a?`source:${a}`:""}function Ic(t,e){let a=new Map(t.map((o,c)=>[Number(o.id),c])),s=new Map(t.map(o=>[Number(o.id),o])),n=new Map,r=new Set,i={thru:0,blind:0,buried:0};for(let o of e){let c=qp(o);if(c){if(r.has(c))continue;r.add(c)}let d=[...new Set(Hp(o,t).map(Number))].filter(x=>a.has(x)).sort((x,v)=>a.get(x)-a.get(v));if(d.length<2)continue;let b=d[0],f=d[d.length-1],m=a.get(b),p=a.get(f),u=m===0,l=p===t.length-1,y=u&&l?"thru":u||l?"blind":"buried";i[y]+=1;let h=`${b}:${f}:${y}`,g=n.get(h);if(g){g.count+=1;continue}n.set(h,{startId:b,endId:f,startName:s.get(b)?.name||String(b),endName:s.get(f)?.name||String(f),startIndex:m,endIndex:p,type:y,count:1})}return{counts:i,spans:[...n.values()]}}var ja="http://www.w3.org/2000/svg";var Xp=new Set(["script","foreignobject","iframe","object","embed"]),Wp=new Set(["href","xlink:href"]),$p=1,Jp=18,Yp=8,Ds=class t{static create(e,a,s,n,r={}){return new t(e,a,s,n,r)}constructor(e,a,s,n,r){this.host=e,this.manifestUrl=a,this.manifest=s,this.featuresByPage=n||{},this.callbacks=r,this.activePage=null,this.activeSvgUrl="",this.container=null,this.svg=null,this.overlay=null,this.mountedPages=new Map,this.loadingPages=new Map,this.svgCache=new Map,this.serial=0,this.maxMountedWorldPages=$p,this.maxCachedSvgPages=Jp,this.worldHandlersInstalled=!1,this.worldDrag=null,this.view={scale:1,tx:0,ty:0},this.drag=null,this.selected=null,this.highlightedNetUid="",this.index=_c(),this.lastStats={mountedPages:0,domNodes:0,indexedFeatures:0,indexedNets:0,mountMs:0,coldMounts:0,warmMounts:0,highlightMs:0,selectionMs:0,cachedSvgPages:0,cachedSvgBytes:0,heapMb:null,fallbackReason:""}}get active(){return!!(this.container&&this.activePage)}get worldActive(){return this.mountedPages.size>0}stats(){return{...this.lastStats,activePage:this.activePage?.name||[...this.mountedPages.values()][0]?.page?.name||"-",mountedPages:this.active?1:this.mountedPages.size}}dispose(){this.unmountPage(),this.unmountWorldPages()}unmountPage(){this.container?.remove(),this.container=null,this.svg=null,this.overlay=null,this.activePage=null,this.activeSvgUrl="",this.index=_c(),this.host.hidden=!0}unmountWorldPages(){for(let e of this.mountedPages.values())e.container.remove();this.mountedPages.clear(),this.loadingPages.clear(),this.active||(this.host.hidden=!0)}async preloadPages(e){let a=performance.now(),s=await Promise.allSettled((e||[]).slice(0,Yp).map(n=>this.loadSvgTemplate(n)));this.lastStats.preloadedPages=s.filter(n=>n.status==="fulfilled"&&n.value).length,this.lastStats.preloadMs=performance.now()-a,this.updateCacheStats()}syncWorldPages(e,a,s={}){if(!a)return;this.installWorldHandlers(a);let n=(e||[]).slice(0,s.maxMountedPages||this.maxMountedWorldPages),r=new Set(n.map(i=>i.id));for(let[i,o]of this.mountedPages)r.has(i)||(o.container.remove(),this.mountedPages.delete(i));for(let i of n){let o=this.mountedPages.get(i.id);if(o)o.lastUsed=++this.serial,this.positionWorldEntry(o,a);else if(!this.loadingPages.has(i.id)){let c=this.mountWorldPage(i).then(d=>{d&&r.has(i.id)?this.positionWorldEntry(d,a):d?.container.remove()}).finally(()=>this.loadingPages.delete(i.id));this.loadingPages.set(i.id,c)}}this.pruneMountedWorldPages(r),this.host.hidden=n.length===0&&!this.active,this.setSelection(this.selected),this.setHighlightedNet(s.activeNetUid??this.highlightedNetUid),this.lastStats.mountedPages=this.mountedPages.size,this.updateCacheStats()}async mountWorldPage(e){let a=performance.now(),s=this.hasCachedSvg(e),n=await this.loadImportedSvg(e);if(!n)return null;let r=document.createElement("div");r.className="svg-dom-page svg-dom-world-page",r.dataset.pageId=e.id,r.append(n),this.host.append(r);let i=Rc(n),o=Ac(n),c=Sc(n,e,this.featuresByPage[e.id]||[]),d={page:e,container:r,svg:n,overlay:i,selectionOverlay:o,index:c,mountMs:performance.now()-a,lastUsed:++this.serial,warm:s};return this.mountedPages.set(e.id,d),this.lastStats={...this.lastStats,mountedPages:this.mountedPages.size,domNodes:[...this.mountedPages.values()].reduce((b,f)=>b+f.svg.querySelectorAll("*").length,0),indexedFeatures:[...this.mountedPages.values()].reduce((b,f)=>b+f.index.featureToElements.size,0),indexedNets:new Set([...this.mountedPages.values()].flatMap(b=>[...b.index.netToElements.keys()])).size,mountMs:d.mountMs,coldMounts:this.lastStats.coldMounts+(d.warm?0:1),warmMounts:this.lastStats.warmMounts+(d.warm?1:0),fallbackReason:""},this.updateCacheStats(),d}async loadImportedSvg(e){let a=await this.loadSvgTemplate(e);return a?a.cloneNode(!0):null}async loadSvgTemplate(e){let a=this.svgUrlForPage(e),s=this.svgCache.get(a);if(s?.template)return s.lastUsed=++this.serial,s.template;if(s?.promise)return s.promise;let n=performance.now(),r=(async()=>{let i=await fetch(a,{cache:"default"});if(!i.ok)return this.lastStats.fallbackReason=`Failed to load SVG page ${e.id}: ${i.status}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;let o=await i.text(),d=new DOMParser().parseFromString(o,"image/svg+xml"),b=d.documentElement;if(!b||b.localName.toLowerCase()!=="svg"||d.querySelector("parsererror"))return this.lastStats.fallbackReason=`Invalid SVG for page ${e.id}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;Qp(d,a,e.id);let f=document.importNode(b,!0);f.classList.add("svg-dom-page-svg"),ng(f);let m=this.svgCache.get(a)||{};return Object.assign(m,{template:f,promise:null,pageId:e.id,byteLength:o.length*2,loadMs:performance.now()-n,lastUsed:++this.serial}),this.svgCache.set(a,m),this.pruneSvgCache(),this.updateCacheStats(),f})();return this.svgCache.set(a,{promise:r,pageId:e.id,byteLength:0,loadMs:0,lastUsed:++this.serial}),r}svgUrlForPage(e){return new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString()}positionWorldEntry(e,a){let{page:s,container:n}=e,[r,i]=a.worldToScreen(s.worldX,s.worldY),[o,c]=a.worldToScreen(s.worldX+s.widthMm,s.worldY+s.heightMm),d=Math.max(1,o-r),b=Math.max(1,c-i);n.style.transform=`translate3d(${r}px, ${i}px, 0)`,n.style.width=`${d}px`,n.style.height=`${b}px`}installWorldHandlers(e){if(this.worldHandlersInstalled)return;this.worldHandlersInstalled=!0;let a=this.host;a.oncontextmenu=s=>s.preventDefault(),a.onpointerdown=s=>{let n=s.button===0&&!s.shiftKey&&!!s.target.closest?.("text"),i=s.target.closest?.("[data-feature-key]")?null:this.featureAtEvent(s);this.worldDrag={pointerId:s.pointerId,startX:s.clientX,startY:s.clientY,lastX:s.clientX,lastY:s.clientY,button:s.button,moved:!1,pan:!n&&(s.button===0||s.button===1||s.shiftKey),allowTextSelection:n},n||a.setPointerCapture(s.pointerId)},a.onpointermove=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let n=s.clientX-this.worldDrag.lastX,r=s.clientY-this.worldDrag.lastY;this.worldDrag.lastX=s.clientX,this.worldDrag.lastY=s.clientY,Math.hypot(s.clientX-this.worldDrag.startX,s.clientY-this.worldDrag.startY)>3&&(this.worldDrag.moved=!0),this.worldDrag.pan&&e.pan(n,r)},a.onpointerup=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let n=this.worldDrag;if(this.worldDrag=null,n.allowTextSelection||a.releasePointerCapture(s.pointerId),n.button!==0||n.moved)return;let r=s.target.closest?.("[data-feature-key]");if(r)this.selectElement(r,s);else{let i=this.featureAtEvent(s);i?this.selectFeature(i.entry,i.feature,s):this.callbacks.onBlank?.()}},a.ondblclick=s=>{let n=s.target.closest?.("[data-feature-key]"),r=n?null:this.featureAtEvent(s),i=r?.entry||this.entryForPoint(s.clientX,s.clientY),o=n?this.selectionFromElement(n):r?this.selectionFromFeature(r.entry,r.feature):this.selected;Nc(o)?this.callbacks.onOpenPage?.(o):o?.netUid?this.callbacks.onHighlightNet?.(o.netUid,o):!r&&i?.page&&this.callbacks.onOpenPage?.({kind:"page",pageId:i.page.id,page:i.page})},a.onwheel=s=>{s.preventDefault(),Math.abs(s.deltaX)>Math.abs(s.deltaY)*.65?e.pan(-s.deltaX,-s.deltaY):e.zoom(s.deltaY,s.clientX,s.clientY)}}async focusPage(e,a={}){if(!e)return!1;if(this.activePage?.id===e.id&&this.active)return a.frame!==!1&&this.fitPage(),!0;let s=performance.now(),n=await this.loadImportedSvg(e);if(!n)return!1;let r=document.createElement("div");return r.className="svg-dom-page",r.append(n),this.host.replaceChildren(r),this.host.hidden=!1,this.container=r,this.svg=n,this.activePage=e,this.activeSvgUrl=new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString(),this.overlay=Rc(n),this.selectionOverlay=Ac(n),this.index=Sc(n,e,this.featuresByPage[e.id]||[]),this.installPageHandlers(),this.fitPage(),this.setSelection(this.selected),this.setHighlightedNet(this.highlightedNetUid),this.lastStats={...this.lastStats,mountedPages:1,domNodes:n.querySelectorAll("*").length,indexedFeatures:this.index.featureToElements.size,indexedNets:this.index.netToElements.size,mountMs:performance.now()-s,fallbackReason:""},this.updateCacheStats(),!0}installPageHandlers(){let e=this.host;e.oncontextmenu=a=>a.preventDefault(),e.onpointerdown=a=>{if(!this.active)return;let s=a.button===0&&!a.shiftKey&&!!a.target.closest?.("text"),n=a.target.closest?.("[data-feature-key]"),r=n?null:this.featureAtEvent(a);this.drag={pointerId:a.pointerId,startX:a.clientX,startY:a.clientY,lastX:a.clientX,lastY:a.clientY,button:a.button,moved:!1,pan:!s&&(a.button===0||a.button===1||a.shiftKey),featureElement:n,allowTextSelection:s},s||e.setPointerCapture(a.pointerId)},e.onpointermove=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=a.clientX-this.drag.lastX,n=a.clientY-this.drag.lastY;this.drag.lastX=a.clientX,this.drag.lastY=a.clientY,Math.hypot(a.clientX-this.drag.startX,a.clientY-this.drag.startY)>3&&(this.drag.moved=!0),this.drag.pan&&(this.view.tx+=s,this.view.ty+=n,this.applyTransform())},e.onpointerup=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=this.drag;if(this.drag=null,s.allowTextSelection||e.releasePointerCapture(a.pointerId),s.button!==0||s.moved)return;let n=a.target.closest?.("[data-feature-key]");if(n)this.selectElement(n,a);else{let r=this.featureAtEvent(a);r?this.selectFeature(r.entry,r.feature,a):this.callbacks.onBlank?.()}},e.ondblclick=a=>{let s=a.target.closest?.("[data-feature-key]"),n=s?null:this.featureAtEvent(a),r=s?this.selectionFromElement(s):n?this.selectionFromFeature(n.entry,n.feature):this.selected;Nc(r)?this.callbacks.onOpenPage?.(r):r?.netUid?this.callbacks.onHighlightNet?.(r.netUid,r):!n&&this.activePage&&this.callbacks.onOpenPage?.({kind:"page",pageId:this.activePage.id,page:this.activePage})},e.onwheel=a=>{if(a.preventDefault(),!this.active)return;if(Math.abs(a.deltaX)>Math.abs(a.deltaY)*.65){this.view.tx-=a.deltaX,this.view.ty-=a.deltaY,this.applyTransform();return}let s=this.host.getBoundingClientRect(),n=a.clientX-s.left,r=a.clientY-s.top,i=this.screenToSvg(n,r),o=Math.exp(-a.deltaY*.0016);this.view.scale=Os(this.view.scale*o,.02,80),this.view.tx=n-i[0]*this.view.scale,this.view.ty=r-i[1]*this.view.scale,this.applyTransform()}}selectElement(e,a){let s=performance.now(),n=this.selectionFromElement(e);if(this.setSelection(n),a){let r=this.host.getBoundingClientRect();n.anchor={x:a.clientX-r.left,y:a.clientY-r.top}}this.callbacks.onSelect?.(n),this.lastStats.selectionMs=performance.now()-s}selectFeature(e,a,s){let n=performance.now(),r=this.selectionFromFeature(e,a);if(this.setSelection(r),s){let i=this.host.getBoundingClientRect();r.anchor={x:s.clientX-i.left,y:s.clientY-i.top}}this.callbacks.onSelect?.(r),this.lastStats.selectionMs=performance.now()-n}selectionFromElement(e){let a=e.dataset.featureKey||"",s=this.entryForElement(e),n=s.index.featureByKey.get(a)||{};return this.selectionFromFeature(s,n,e)}selectionFromFeature(e,a,s=null){let n=a?.stableKey||s?.dataset?.featureKey||"",r=e?.page||this.activePage,i=a?.kind||s?.dataset?.role||s?.dataset?.primitive||"feature",o=a?.netUid||s?.dataset?.netUid||"",c=a?.netName||s?.dataset?.netName||"";return i==="sheet"?{kind:"sheet",featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",sheetName:a?.sheet_name||a?.sheetName||s?.dataset?.sheetName||a?.objectId||"",sheetFile:a?.sheet_file||a?.sheetFile||s?.dataset?.sheetFile||"",feature:a}:i==="pin"||i==="pin_body"||i==="pin_name"||i==="pin_number"||s?.dataset?.pin?{kind:"pin",featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",pinNumber:a?.pinNumber||s?.dataset?.pin||"",pinName:a?.pinName||"",netUid:o,netName:c,feature:a}:i==="symbol_body"||i==="symbol_instance"||i==="component"||s?.dataset?.ref?{kind:"component",featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",netUid:o,netName:c,feature:a}:{kind:o?"feature":i,featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",role:i,netUid:o,netName:c,feature:a}}setSelection(e){this.selected=e||null;for(let s of this.host.querySelectorAll(".prism-svg-selected"))s.classList.remove("prism-svg-selected");for(let s of this.host.querySelectorAll("[data-prism-overlay='selection']"))s.replaceChildren();let a=e?.featureKey||"";if(a){for(let s of this.entries()){for(let n of s.index.featureToElements.get(a)||[])n.classList.add("prism-svg-selected");this.drawSelectionOverlay(s,e)}for(let s of this.index.featureToElements.get(a)||[])s.classList.add("prism-svg-selected");this.drawSelectionOverlay({page:this.activePage,index:this.index,selectionOverlay:this.selectionOverlay},e)}}setHighlightedNet(e){this.highlightedNetUid=e||"";let a=performance.now();for(let s of this.entries())this.updateEntryHighlight(s);if(!this.svg||!this.overlay){this.lastStats.highlightMs=performance.now()-a;return}this.updateEntryHighlight({svg:this.svg,overlay:this.overlay,index:this.index,page:this.activePage}),this.lastStats.highlightMs=performance.now()-a}updateEntryHighlight(e){if(!e?.svg||!e?.overlay||(e.overlay.replaceChildren(),!this.highlightedNetUid))return;let a=Ps(e.svg,e.page),s=document.createElementNS(ja,"rect");s.setAttribute("x",String(a[0])),s.setAttribute("y",String(a[1])),s.setAttribute("width",String(a[2])),s.setAttribute("height",String(a[3])),s.setAttribute("class","prism-svg-net-dimmer"),e.overlay.append(s);let r=(e.index.netToElements.get(this.highlightedNetUid)||[]).slice(0,2200);for(let i of r){let o=rg(i);e.overlay.append(o)}}entries(){return[...this.mountedPages.values()]}entryForElement(e){let s=e.closest?.(".svg-dom-page")?.dataset.pageId||"";return this.mountedPages.get(s)||{page:this.activePage,index:this.index,svg:this.svg,overlay:this.overlay,selectionOverlay:this.selectionOverlay}}featureAtEvent(e){let a=this.entryForPoint(e.clientX,e.clientY);if(!a)return null;let s=this.clientToSvg(a,e.clientX,e.clientY);if(!s)return null;let n=Math.max(.18,5*og(a)),i=a.index.features.filter(o=>(o?.domBoundsMm||o?.boundsMm)&&Bc(o)).filter(o=>s[0]>=(o.domBoundsMm||o.boundsMm)[0]-n&&s[0]<=(o.domBoundsMm||o.boundsMm)[2]+n&&s[1]>=(o.domBoundsMm||o.boundsMm)[1]-n&&s[1]<=(o.domBoundsMm||o.boundsMm)[3]+n).map(o=>({feature:o,priority:lg(o),area:Math.max(1e-4,((o.domBoundsMm||o.boundsMm)[2]-(o.domBoundsMm||o.boundsMm)[0])*((o.domBoundsMm||o.boundsMm)[3]-(o.domBoundsMm||o.boundsMm)[1]))})).sort((o,c)=>c.priority-o.priority||o.area-c.area)[0]?.feature;return i?{entry:a,feature:i,point:s}:null}entryForPoint(e,a){for(let s of[...this.entries()].reverse()){let n=s.container.getBoundingClientRect();if(e>=n.left&&e<=n.right&&a>=n.top&&a<=n.bottom)return s}if(this.container){let s=this.container.getBoundingClientRect();if(e>=s.left&&e<=s.right&&a>=s.top&&a<=s.bottom)return{page:this.activePage,container:this.container,svg:this.svg,index:this.index,selectionOverlay:this.selectionOverlay}}return null}clientToSvg(e,a,s){if(!e?.container||!e?.svg||!e?.page)return null;let n=e.container.getBoundingClientRect();if(!n.width||!n.height)return null;let r=Ps(e.svg,e.page);return[r[0]+(a-n.left)/n.width*r[2],r[1]+(s-n.top)/n.height*r[3]]}drawSelectionOverlay(e,a){if(!e?.selectionOverlay||!a?.featureKey)return;let s=e.index.featureByKey.get(a.featureKey),n=s?.domBoundsMm||s?.boundsMm;if(!n)return;let[r,i,o,c]=n,d=document.createElementNS(ja,"rect");d.setAttribute("x",String(r)),d.setAttribute("y",String(i)),d.setAttribute("width",String(Math.max(.001,o-r))),d.setAttribute("height",String(Math.max(.001,c-i))),d.setAttribute("rx","0.65"),d.setAttribute("ry","0.65"),d.setAttribute("class","prism-svg-selection-box"),e.selectionOverlay.append(d)}fitPage(){if(!this.svg||!this.activePage)return;let e=Ps(this.svg,this.activePage),a=e[2]||this.activePage.sourceWidthMm||this.activePage.widthMm||1,s=e[3]||this.activePage.sourceHeightMm||this.activePage.heightMm||1,n=this.host.getBoundingClientRect(),r=Math.min(n.width/a,n.height/s)*.92;this.view.scale=Os(r,.02,80),this.view.tx=(n.width-a*this.view.scale)/2-e[0]*this.view.scale,this.view.ty=(n.height-s*this.view.scale)/2-e[1]*this.view.scale,this.applyTransform()}frameSelection(e=this.selected){if(!e?.featureKey||!this.active){this.fitPage();return}let a=this.index.featureToElements.get(e.featureKey)||[],s=Fc(a);if(!s)return;let n=this.host.getBoundingClientRect(),r=Math.max(1,s[2]-s[0]),i=Math.max(1,s[3]-s[1]),o=Math.min(n.width/r,n.height/i)*.36;this.view.scale=Os(o,.04,80),this.view.tx=n.width/2-(s[0]+s[2])/2*this.view.scale,this.view.ty=n.height/2-(s[1]+s[3])/2*this.view.scale,this.applyTransform()}pan(e,a){this.active&&(this.view.tx+=e,this.view.ty+=a,this.applyTransform())}zoom(e,a,s){if(!this.active)return;let n=this.host.getBoundingClientRect(),r=(a??n.left+n.width/2)-n.left,i=(s??n.top+n.height/2)-n.top,o=this.screenToSvg(r,i),c=Math.exp(-e*.0016);this.view.scale=Os(this.view.scale*c,.02,80),this.view.tx=r-o[0]*this.view.scale,this.view.ty=i-o[1]*this.view.scale,this.applyTransform()}screenToSvg(e,a){return[(e-this.view.tx)/Math.max(1e-6,this.view.scale),(a-this.view.ty)/Math.max(1e-6,this.view.scale)]}applyTransform(){this.container&&(this.container.style.transform=`translate3d(${this.view.tx}px, ${this.view.ty}px, 0) scale(${this.view.scale})`)}hasCachedSvg(e){return!!this.svgCache.get(this.svgUrlForPage(e))?.template}pruneMountedWorldPages(e=new Set){if(this.mountedPages.size<=this.maxMountedWorldPages)return;let a=[...this.mountedPages.entries()].filter(([s])=>!e.has(s)).sort((s,n)=>(s[1].lastUsed||0)-(n[1].lastUsed||0));for(let[s,n]of a){if(this.mountedPages.size<=this.maxMountedWorldPages)break;n.container.remove(),this.mountedPages.delete(s)}}pruneSvgCache(){let e=[...this.svgCache.entries()].filter(([,n])=>n?.template);if(e.length<=this.maxCachedSvgPages)return;let a=new Set([...this.mountedPages.values()].map(n=>this.svgUrlForPage(n.page)));this.activePage&&a.add(this.svgUrlForPage(this.activePage));let s=e.filter(([n])=>!a.has(n)).sort((n,r)=>(n[1].lastUsed||0)-(r[1].lastUsed||0));for(let[n]of s){if([...this.svgCache.values()].filter(r=>r?.template).length<=this.maxCachedSvgPages)break;this.svgCache.delete(n)}}updateCacheStats(){let e=[...this.svgCache.values()].filter(s=>s?.template);this.lastStats.cachedSvgPages=e.length,this.lastStats.cachedSvgBytes=e.reduce((s,n)=>s+(n.byteLength||0),0);let a=performance?.memory;this.lastStats.heapMb=a?.usedJSHeapSize?a.usedJSHeapSize/1048576:null}};function Qp(t,e,a){for(let r of[...t.querySelectorAll("*")]){if(Xp.has(r.localName.toLowerCase())){r.remove();continue}for(let i of[...r.attributes]){let o=i.name,c=o.toLowerCase(),d=i.value||"";if(c.startsWith("on")){r.removeAttribute(o);continue}if((c==="href"||c==="xlink:href"||c==="src")&&jc(d)){if((c==="href"||c==="xlink:href")&&r.localName.toLowerCase()==="image"&&ug(d))continue;r.removeAttribute(o);continue}c==="style"&&r.setAttribute(o,hg(d))}}let s=`prism-${dr(a)}-`,n=new Map;for(let r of t.querySelectorAll("[id]")){let i=r.getAttribute("id"),o=`${s}${dr(i)}`;n.set(i,o),r.setAttribute("id",o)}for(let r of t.querySelectorAll("*"))for(let i of[...r.attributes]){let o=i.name.toLowerCase(),c=i.value||"";Wp.has(o)&&(c.startsWith("#")&&n.has(c.slice(1))?c=`#${n.get(c.slice(1))}`:fg(c)&&(c=new URL(c,e).toString())),c=bg(c,n),r.setAttribute(i.name,c)}}function Sc(t,e,a){let s=new Map,n=new Map,r=new Map,i=[];for(let b of a){let f=tg(b,e);i.push(f),n.set(f.stableKey,f),r.set(Number(f.id||0),f);for(let m of ag(f))s.has(m)||s.set(m,[]),s.get(m).push(f)}let o=new Map,c=new Map,d=new Map;for(let b of i)d.set(b.stableKey,b);for(let b of t.querySelectorAll("[data-uuid], [data-element-key], [data-primitive], [data-ref], [data-pin], [data-object-id], [data-designator], [data-component]")){let f=Zp(b,s,e);if(f&&!Bc(f)||!f&&!dg(b))continue;let m=sg(b,e),p=f?.stableKey||m,u=f?.netUid||"",l=f?.netName||"";b.classList.add("prism-feature"),b.dataset.featureKey=p,b.dataset.sourceId=f?.sourceId||b.dataset.uuid||b.dataset.elementKey||"",b.dataset.role=f?.kind||b.dataset.primitive||b.dataset.ref||"feature",f?.id&&(b.dataset.featureId=String(f.id)),u&&(b.dataset.netUid=u),l&&(b.dataset.netName=l),b.id||(b.id=`prism-feature-${dr(p)}`),Cc(o,p,b),d.set(p,f||{id:0,stableKey:p,kind:b.dataset.role,sourceId:b.dataset.sourceId,sheetInstancePath:e.sheetInstancePath||""}),u&&Cc(c,u,b)}for(let[b,f]of o){let m=d.get(b),p=Fc(f);m&&p&&(m.domBoundsMm=ig(m.boundsMm,p))}return{featureToElements:o,netToElements:c,featureByKey:d,byId:r,bySource:s,features:i}}function Zp(t,e,a){let n=[t.dataset.uuid,t.dataset.elementKey,t.dataset.sourceId,t.dataset.objectId,t.dataset.componentUid,t.dataset.componentUuid,t.dataset.ref&&`${t.dataset.ref}:${t.dataset.pin||""}`].filter(Boolean).flatMap(i=>e.get(i)||[]);if(!n.length)return null;let r=String(t.dataset.primitive||t.dataset.ref||t.dataset.pin||"").toLowerCase();return n.map(i=>({feature:i,score:eg(i,r,a)})).sort((i,o)=>o.score-i.score)[0].feature}function eg(t,e,a){let s=0,n=String(t.kind||"").toLowerCase();return t.sheetInstancePath===a.sheetInstancePath&&(s+=20),t.netUid&&(s+=4),e&&n.includes(e)&&(s+=8),e==="symbol"&&n==="symbol_body"&&(s+=12),(e==="label"||e==="port")&&(n.includes("label")||n.includes("port"))&&(s+=12),e==="sheet"&&n==="sheet"&&(s+=12),n!=="record"&&(s+=2),n.includes("pin")&&(s+=2),s}function tg(t,e){let a=t.sourceId||t.sourceUid||t.uuid||t.objectId||t.stableKey||"";return{...t,id:Number(t.id||0),sourceId:a,stableKey:t.stableKey||`${e.sheetInstancePath||e.id}|${a}|0|${t.kind||"feature"}|0`,sheetInstancePath:t.sheetInstancePath||e.sheetInstancePath||""}}function ag(t){let e=new Set([t.sourceId,t.sourceUid,t.uuid,t.objectId,t.stableKey].filter(Boolean).map(String));return t.reference&&t.pinNumber&&e.add(`${t.reference}:${t.pinNumber}`),t.componentDesignator&&e.add(t.componentDesignator),t.reference&&e.add(t.reference),[...e]}function sg(t,e){let a=t.dataset.uuid||t.dataset.elementKey||t.dataset.objectId||t.dataset.ref||t.id||"svg",s=t.dataset.primitive||t.dataset.role||t.localName||"feature";return`${e.sheetInstancePath||e.id}|${a}|0|${s}|0`}function ng(t){let e=document.createElementNS(ja,"style");e.textContent=`
    .prism-feature { cursor: pointer; }
    .prism-svg-selected { outline: none; filter: drop-shadow(0 0 2.4px rgba(59,130,246,0.98)); }
    .prism-svg-selection-box {
      fill: rgba(59, 130, 246, 0.12);
      stroke: #3b82f6;
      stroke-width: 0.38mm;
      stroke-dasharray: 1.4 0.7;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .prism-svg-net-dimmer { fill: rgba(10, 14, 22, 0.055); pointer-events: none; }
    .prism-svg-net-overlay { pointer-events: none; }
    .prism-svg-net-overlay * {
      stroke: #18ef52 !important;
      fill: none !important;
      stroke-width: 0.34mm !important;
      vector-effect: non-scaling-stroke;
      opacity: 0.98;
    }
  `,t.prepend(e)}function Rc(t){let e=document.createElementNS(ja,"g");return e.setAttribute("class","prism-svg-net-overlay"),e.setAttribute("data-prism-overlay","net-highlight"),t.append(e),e}function Ac(t){let e=document.createElementNS(ja,"g");return e.setAttribute("class","prism-svg-selection-overlay"),e.setAttribute("data-prism-overlay","selection"),e.style.pointerEvents="none",t.append(e),e}function rg(t){let e=t.cloneNode(!0);e.removeAttribute("id"),e.removeAttribute("data-feature-key"),e.removeAttribute("data-net-uid"),e.removeAttribute("data-net-name"),e.classList.add("prism-svg-net-overlay-clone");for(let a of[e,...Array.from(e.querySelectorAll?.("*")||[])])a instanceof SVGElement&&(a.removeAttribute("filter"),a.style.pointerEvents="none",a.style.stroke="#18ef52",a.style.fill="none",a.style.opacity="0.98",a.style.vectorEffect="non-scaling-stroke");return e}function Fc(t){let e=null;for(let a of t)if(a.getBBox)try{let s=a.getBBox(),n=[s.x,s.y,s.x+s.width,s.y+s.height];e=e?[Math.min(e[0],n[0]),Math.min(e[1],n[1]),Math.max(e[2],n[2]),Math.max(e[3],n[3])]:n}catch{}return e}function ig(t,e){return t?e?[Math.min(t[0],e[0]),Math.min(t[1],e[1]),Math.max(t[2],e[2]),Math.max(t[3],e[3])]:t:e}function Ps(t,e){let a=t.getAttribute("viewBox");if(a){let s=a.trim().split(/[\s,]+/).map(Number);if(s.length===4&&s.every(Number.isFinite))return s}return[0,0,e.sourceWidthMm||e.widthMm||1,e.sourceHeightMm||e.heightMm||1]}function _c(){return{featureToElements:new Map,netToElements:new Map,featureByKey:new Map,byId:new Map,bySource:new Map,features:[]}}function og(t){let e=t?.container?.getBoundingClientRect?.();if(!t?.svg||!t?.page||!e?.width||!e?.height)return .1;let a=Ps(t.svg,t.page);return Math.max(a[2]/e.width,a[3]/e.height)}function cg(t){let e=String(t?.kind||"").toLowerCase(),a=String(t?.semanticRole||"").toLowerCase(),s=`${t?.sourceId||""} ${t?.objectId||""} ${t?.text||""}`.toLowerCase();return e.includes("page")||a.includes("page")||e.includes("background")||a.includes("background")||s.includes("background")||s.includes("sheet_header")||s.includes("sheet header")||s.includes("drawing-sheet")}function lg(t){let e=String(t?.kind||t?.semanticRole||"").toLowerCase();return e.includes("pin")?90:e.includes("label")||e.includes("port")?78:e.includes("wire")||e.includes("bus")||e.includes("junction")?70:e.includes("symbol")||e.includes("component")?54:e.includes("image")?30:20}function Bc(t){if(!t||cg(t))return!1;let e=String(t.kind||t.semanticRole||"").toLowerCase();return["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function dg(t){let e=`${t?.dataset?.primitive||""} ${t?.dataset?.ref||""} ${t?.dataset?.role||""} ${t?.dataset?.objectId||""} ${t?.dataset?.text||""}`.toLowerCase();return!e||e.includes("background")||e.includes("sheet_header")||e.includes("sheet header")||e.includes("drawing-sheet")?!1:["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function Nc(t){return String(t?.kind||t?.feature?.kind||"").toLowerCase()==="sheet"}function Cc(t,e,a){t.has(e)||t.set(e,[]),t.get(e).push(a)}function jc(t){let e=String(t||"").trim().toLowerCase();return!e||e.startsWith("#")?!1:e.startsWith("javascript:")||e.startsWith("data:")||e.startsWith("http://")||e.startsWith("https://")}function ug(t){return/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(String(t||"").trim())}function fg(t){let e=String(t||"").trim();return e&&!e.startsWith("#")&&!/^[a-z][a-z0-9+.-]*:/i.test(e)}function hg(t){return String(t||"").replace(/url\(([^)]+)\)/gi,(e,a)=>{let s=a.trim().replace(/^['"]|['"]$/g,"");return jc(s)?"none":e})}function bg(t,e){let a=String(t||"");return a=a.replace(/url\(#([^)]+)\)/g,(s,n)=>e.has(n)?`url(#${e.get(n)})`:s),a=a.replace(/^#(.+)$/,(s,n)=>e.has(n)?`#${e.get(n)}`:s),a}function dr(t){return String(t||"").trim().replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,96)||"item"}function Os(t,e,a){return Math.max(e,Math.min(a,t))}function Ls(t){return`${t.level||""}/${t.id}`}function Oc(t){let e=t.ends||[],a=t.wires||[];return e.length<2?[]:e.length===2?[{key:`${e[0].id}~${e[1].id}`,a:e[0].id,b:e[1].id,wires:new Set(a.map(s=>s.id))}]:e.map(s=>({key:`hub~${s.id}`,a:"hub",b:s.id,wires:new Set(a.filter(n=>n.from===s.id||n.to===s.id).map(n=>n.id))}))}function pg(t,e){return!e||e.harness!==t.id?!1:!t.level||!e.occurrence||e.occurrence.startsWith(`${t.level}/`)}function Pc(t,e){let a=new Map;for(let s of t||[]){let n=new Map,r=new Set((s.wires||[]).map(i=>i.id));for(let i of e||[])for(let o of i.wires||[])r.has(o.wire)&&pg(s,o)&&!n.has(o.wire)&&n.set(o.wire,i.color);n.size&&a.set(Ls(s),n)}return a}function Dc(t,e){if(!e)return null;for(let a of t.wires)if(e.has(a))return e.get(a);return null}function Lc(t,e){let a=new Map;if(!e)return a;for(let s of t.wires||[]){let n=e.get(s.id);n&&(a.has(s.from)||a.set(s.from,n),a.has(s.to)||a.set(s.to,n))}return a}function Uc(t){let e=t.filter(Boolean);return e.length<2?null:[0,1,2].map(a=>e.reduce((s,n)=>s+n[a],0)/e.length)}var gg=/_vertical(_|$)/i,mg=/_(horizontal|rightangle|right_angle|angled)(_|$)|_RA(_|$)/i,Kc=t=>t*Math.PI/180;function Gc(t){let e=t.replace(/[0-9]+$/,""),a=t.slice(e.length);return[e,a?Number.parseInt(a,10):-1,t]}function yg(t,e){let[a,s,n]=Gc(t),[r,i,o]=Gc(e);return a!==r?a<r?-1:1:s!==i?s-i:n<o?-1:n>o?1:0}function fr(t,e){let a=Kc(t.rotationDeg),s=e[0]-t.positionMm[0],n=e[1]-t.positionMm[1];return[s*Math.cos(a)+n*Math.sin(a),-s*Math.sin(a)+n*Math.cos(a)]}function zc(t,e){let a=Kc(t.rotationDeg);return[e[0]*Math.cos(a)-e[1]*Math.sin(a),e[0]*Math.sin(a)+e[1]*Math.cos(a),0]}function xg(t){return new Set(t.pads.map(e=>`${e.positionMm[0]},${e.positionMm[1]}`)).size}function Vc(t){let e=t.pads.filter(a=>a.pad);return e.length?e:t.pads}function Hc(t){let e=Vc(t),a=e.length;return[e.reduce((s,n)=>s+n.positionMm[0],0)/a,e.reduce((s,n)=>s+n.positionMm[1],0)/a]}function wg(t,e){let a=Math.atan2(e,t)*180/Math.PI,s=vg(a/90)*90;return Math.abs(a-s)>20?null:{0:"+x",90:"+y",180:"-x","-180":"-x","-90":"-y"}[String(s===0?0:s)]}function vg(t){let e=Math.floor(t),a=t-e;return a>.5?e+1:a<.5||e%2===0?e:e+1}function Mg(t){let e=(l,y,...h)=>({axis:y==="low"?null:l,confidence:y,reasons:h});if(!t||xg(t)<2)return e(null,"low","too_few_pads");let a=t.side==="top"?"top":"bottom",s=t.footprintName??"",n=gg.test(s),r=mg.test(s),i=t.courtyard;if(!i)return n?e(a,"medium","name_vertical","no_courtyard"):e(null,"low","no_courtyard");let o=t.pads.map(l=>fr(t,l.positionMm)),c=o.map(([l])=>l),d=o.map(([,l])=>l),b=[c.reduce((l,y)=>l+y,0)/c.length,d.reduce((l,y)=>l+y,0)/d.length],f=[(i.minMm[0]+i.maxMm[0])/2,(i.minMm[1]+i.maxMm[1])/2],m=Math.min(...c)-1<=f[0]&&f[0]<=Math.max(...c)+1&&Math.min(...d)-1<=f[1]&&f[1]<=Math.max(...d)+1,p=[f[0]-b[0],f[1]-b[1]],u=!m&&Math.hypot(...p)>=.5?wg(...p):null;return n?m?e(a,"high","name_vertical","body_over_pads"):e(null,"low","name_vertical","name_conflicts_geometry"):r?u?e(u,"high","name_right_angle","body_off_pads"):e(null,"low","name_right_angle","name_conflicts_geometry"):m?e(a,"medium","body_over_pads"):u?e(u,"medium","body_off_pads"):e(null,"low","body_ambiguous")}function Us(t){let e=Math.sqrt(t.reduce((a,s)=>a+s*s,0));return t.map(a=>a/e)}var Eg=(t,e)=>[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]],ur=(t,e)=>t.reduce((a,s,n)=>a+s*e[n],0);function Tg(t){let e=t.pads.filter(s=>s.pad),a=e.find(s=>s.pad==="1");return a||(e.length?[...e].sort((s,n)=>yg(s.pad,n.pad))[0]:t.pads[0])}function kg(t){let[e,a]=Hc(t),s=Vc(t),n=s.length,r=0,i=0,o=0;for(let p of s)r+=(p.positionMm[0]-e)**2,i+=(p.positionMm[1]-a)**2,o+=(p.positionMm[0]-e)*(p.positionMm[1]-a);r/=n,i/=n,o/=n;let c=(r+i)/2,d=r*i-o*o,b=Math.sqrt(Math.max(c*c-d,0)),f=c+b,m=c-b;return f<=1e-12||f-m<=.05*f?zc(t,[1,0]):Math.abs(o)>1e-12?Us([f-i,o,0]):r>=i?[1,0,0]:[0,1,0]}function Ig(t,e){if(e==="top")return[0,0,1];if(e==="bottom")return[0,0,-1];let a=e[0]==="-"?-1:1;return Us(zc(t,e[1]==="x"?[a,0]:[0,a]))}function hr(t,e,a){let[s,n,r]=t,[i,o,c]=e,[d,b,f]=a,m=s+o+f,p;if(m>0){let l=Math.sqrt(m+1)*2;p=[(c-b)/l,(d-r)/l,(n-i)/l,.25*l]}else if(s>o&&s>f){let l=Math.sqrt(1+s-o-f)*2;p=[.25*l,(i+n)/l,(d+r)/l,(c-b)/l]}else if(o>f){let l=Math.sqrt(1+o-s-f)*2;p=[(i+n)/l,.25*l,(b+c)/l,(d-r)/l]}else{let l=Math.sqrt(1+f-s-o)*2;p=[(d+r)/l,(b+c)/l,.25*l,(n-i)/l]}return p=Us(p),([p[3],p[0],p[1],p[2]].find(l=>Math.abs(l)>1e-12)??1)<0?p.map(l=>-l):p}function br(t,e,a){if(!t||t.pads.length===0)return null;let s=a?a.axis:Mg(t).axis;if(!s)return null;let n=a?((a.quarterTurns??0)%4+4)%4:0,[r,i]=Hc(t),o=(e??0)/2,c=[r,i,t.side==="top"?o:-o],d=Ig(t,s),b=kg(t),f=ur(b,d),m=[b[0]-f*d[0],b[1]-f*d[1],b[2]-f*d[2]];Math.sqrt(ur(m,m))<1e-9&&(m=[-d[1],d[0],0]),m=Us(m);let p=Tg(t).positionMm;ur([p[0]-r,p[1]-i,0],m)>1e-9&&(m=m.map(l=>-l));let u=Eg(d,m);for(let l=0;l<n;l+=1)[m,u]=[u,m.map(y=>-y)];return{axis:s,quarterTurns:n,originMm:c,xAxis:m,yAxis:u,zAxis:d,rotation:hr(m,u,d)}}var _e={bootMm:10,housingDepthMm:8,breakoutLiftMm:10,chordErrorMm:.2,catmullRomAlpha:.5,minBendRadiusFactor:6,bendRelaxIterations:8,packingFactor:1.2,ringSegments:12,breakoutBlendMm:5,lengthAllowance:.1,lengthMismatchTolerance:.15,boardCollisionMarginMm:1,defaultGaugeAwg:"24"},pr={24:1.143,22:1.3208,20:1.524,18:1.8034,16:2.0066,14:2.3622,12:2.8956,10:3.5306,8:5.0546,6:6.35,4:7.9248,2:9.8552,1:10.9474,0:12.1666,"00":13.8684};function qc(t){let e=t==null?null:String(t).trim().toUpperCase().replace(/AWG$/,"").trim();return e!==null&&e in pr?{odMm:pr[e],assumed:!1}:{odMm:pr[_e.defaultGaugeAwg],assumed:!0}}function pe(t){return Math.round(t*1e9)/1e9+0}function Gs(t){let e=Math.hypot(...t)||1,a=t.map(n=>n/e),s=[a[3],a[0],a[1],a[2]].find(n=>Math.abs(n)>1e-12)??1;return a.map(n=>pe(s<0?-n:n))}function Oa(t,e){let[a,s,n,r]=t,i=s*e[2]-n*e[1],o=n*e[0]-a*e[2],c=a*e[1]-s*e[0];return[e[0]+2*(r*i+s*c-n*o),e[1]+2*(r*o+n*i-a*c),e[2]+2*(r*c+a*o-s*i)]}function Sg(t,e){let[a,s,n,r]=t,[i,o,c,d]=e;return[r*i+a*d+s*c-n*o,r*o-a*c+s*d+n*i,r*c+a*o-s*i+n*d,r*d-a*i-s*o-n*c]}function Dt(t,e){let a=Oa(t.rotation,e.translationMm);return{translationMm:t.translationMm.map((s,n)=>pe(s+a[n])),rotation:Gs(Sg(t.rotation,e.rotation))}}var Rg=12,Ag=2,_g=1e-9,fa=(t,e)=>[t[0]-e[0],t[1]-e[1],t[2]-e[2]],dt=(t,e)=>Math.sqrt((t[0]-e[0])**2+(t[1]-e[1])**2+(t[2]-e[2])**2);function ua(t,e,a,s,n){if(s===a)return[t[0],t[1],t[2]];let r=(s-n)/(s-a),i=(n-a)/(s-a);return[r*t[0]+i*e[0],r*t[1]+i*e[1],r*t[2]+i*e[2]]}function Ng(t,e,a,s){let n=_e.catmullRomAlpha,r=0,i=r+dt(t,e)**n,o=i+dt(e,a)**n,c=o+dt(a,s)**n;return d=>{let b=i+d*(o-i),f=ua(t,e,r,i,b),m=ua(e,a,i,o,b),p=ua(a,s,o,c,b),u=ua(f,m,r,o,b),l=ua(m,p,i,c,b);return ua(u,l,i,o,b)}}function Cg(t,e,a){let s=fa(a,e),n=fa(t,e),r=Math.sqrt(s[0]*s[0]+s[1]*s[1]+s[2]*s[2]);if(r<1e-12)return dt(t,e);let i=[s[1]*n[2]-s[2]*n[1],s[2]*n[0]-s[0]*n[2],s[0]*n[1]-s[1]*n[0]];return Math.sqrt(i[0]*i[0]+i[1]*i[1]+i[2]*i[2])/r}function Xc(t){let e=o=>[o[0],o[1],o[2]];if(t.length<2)return{samples:t.map(e),spans:t.map(()=>0)};let a=t[0],s=t[t.length-1],n=[fa([2*a[0],2*a[1],2*a[2]],t[1]),...t,fa([2*s[0],2*s[1],2*s[2]],t[t.length-2])],r=[e(a)],i=[0];for(let o=0;o<t.length-1;o+=1){let c=Ng(n[o],n[o+1],n[o+2],n[o+3]),d=(b,f,m,p,u)=>{let l=(b+f)/2,y=c(l);u<Ag||u<Rg&&Cg(y,m,p)>_e.chordErrorMm?(d(b,l,m,y,u+1),d(l,f,y,p,u+1)):(r.push(p),i.push(o))};d(0,1,e(t[o]),e(t[o+1]),0)}return{samples:r,spans:i}}function Fg(t,e,a){let s=dt(t,e),n=dt(e,a),r=dt(a,t),i=fa(e,t),o=fa(a,t),c=[i[1]*o[2]-i[2]*o[1],i[2]*o[0]-i[0]*o[2],i[0]*o[1]-i[1]*o[0]],d=Math.sqrt(c[0]*c[0]+c[1]*c[1]+c[2]*c[2]);return d<1e-12?Number.POSITIVE_INFINITY:s*n*r/(2*d)}function Wc(t){let e=Number.POSITIVE_INFINITY,a=-1;for(let s=1;s<t.length-1;s+=1){let n=Fg(t[s-1],t[s],t[s+1]);n<e&&(e=n,a=s)}return{radius:e,at:a}}function Bg(t,e,a){let s=[],n=[];t.forEach((m,p)=>{if(s.length&&dt(s[s.length-1],m)<_g){n[n.length-1]=n[n.length-1]&&e[p];return}s.push([m[0],m[1],m[2]]),n.push(!!e[p])});let r=_e.minBendRadiusFactor*a,{samples:i,spans:o}=Xc(s),{radius:c,at:d}=Wc(i);for(let m=0;m<_e.bendRelaxIterations&&!(c>=r||d<0);m+=1){let p=o[d],u=[];for(let g=1;g<s.length-1;g+=1)n[g]&&u.push(g);if(!u.length)break;let l=g=>Math.min(Math.abs(g-p),Math.abs(g-(p+1))),y=u[0];for(let g of u)l(g)<l(y)&&(y=g);let h=[0,1,2].map(g=>(s[y-1][g]+s[y+1][g])/2);s[y]=[0,1,2].map(g=>(s[y][g]+h[g])/2),{samples:i,spans:o}=Xc(s),{radius:c,at:d}=Wc(i)}let b=0;for(let m=0;m+1<i.length;m+=1)b+=dt(i[m],i[m+1]);let f=m=>m.map(pe);return{controlMm:s.map(f),samplesMm:i.map(f),lengthMm:pe(b),minRadiusMm:Number.isFinite(c)?pe(c):null,minRadiusAllowedMm:pe(r),tightBend:d>=0&&c<r?{atMm:f(i[d]),radiusMm:pe(c)}:null}}function jg(t){let e=_e.bootMm/2,{exitMm:a,outward:s,legMm:n}=t;return[[a[0],a[1],a[2]],[a[0]+e*s[0],a[1]+e*s[1],a[2]+e*s[2]],[n[0],n[1],n[2]],[n[0]+e*s[0],n[1]+e*s[1],n[2]+e*s[2]]]}function $c(t,e,a={},s={}){let n=new Map(e.nodes.map(r=>[r.id,r.positionMm]));return e.segments.map(r=>{let i=p=>p in t?jg(t[p]):[[...n.get(p)]],o=i(r.from),c=i(r.to),d=(a[r.id]??[]).map(p=>[p[0],p[1],p[2]]),b=[...o,...d,...c.reverse()],f=s[r.id]??[],m=[...o.map(()=>!1),...d.map((p,u)=>!f[u]),...c.map(()=>!1)];return{segmentId:r.id,...Bg(b,m,r.diameterMm)}})}var Jc=5;var Ks=Math.SQRT1_2,Yw=[[0,0,0,1],[0,0,Ks,Ks],[0,0,1,0],[0,0,Ks,-Ks]];function Og(t,e){let a=[0,1,2].map(s=>e[s]-t.originMm[s]);return[t.xAxis,t.yAxis,t.zAxis].map(s=>a[0]*s[0]+a[1]*s[1]+a[2]*s[2])}function Yc(t,e,a){let s,n;if(a)s=[...a.minMm],n=[...a.maxMm];else if(t.courtyard)s=[...t.courtyard.minMm,0],n=[...t.courtyard.maxMm,Jc];else{let f=t.pads.map(m=>fr(t,m.positionMm));s=[Math.min(...f.map(m=>m[0])),Math.min(...f.map(m=>m[1])),0],n=[Math.max(...f.map(m=>m[0])),Math.max(...f.map(m=>m[1])),Jc]}let r=t.rotationDeg*Math.PI/180,[i,o]=t.positionMm,c=(e??0)/2,d=t.side==="top",b=[];for(let f=0;f<8;f+=1){let[m,p,u]=[0,1,2].map(l=>(f>>l&1?n:s)[l]);b.push([i+m*Math.cos(r)-p*Math.sin(r),o+m*Math.sin(r)+p*Math.cos(r),d?c+u:-c-u])}return b}function Qc(t,e){let a=e.map(s=>Og(t,s));return[[0,1,2].map(s=>Math.min(...a.map(n=>n[s]))),[0,1,2].map(s=>Math.max(...a.map(n=>n[s])))]}var zs=Math.SQRT1_2,Pg=[[0,0,0,1],[0,0,zs,zs],[0,0,1,0],[0,0,zs,-zs]],Dg=[1,0,0,0],Vs=[0,0,0,1],Lg=(t,e)=>{let a=e*Math.PI/360;return[t[0]*Math.sin(a),t[1]*Math.sin(a),t[2]*Math.sin(a),Math.cos(a)]};function Ug(t){if(!t)return{pose:{translationMm:[0,0,0],rotation:Vs},scale:1};let[e,a,s]=(t.rotationDeg??[0,0,0]).map(Number),n=Vs;for(let[i,o]of[[[0,0,1],s],[[0,1,0],a],[[1,0,0],e]])n=Dt({translationMm:[0,0,0],rotation:n},{translationMm:[0,0,0],rotation:Lg(i,o)}).rotation;return{pose:{translationMm:(t.offsetMm??[0,0,0]).map(Number),rotation:Gs(n)},scale:Number(t.scale??1)||1}}function Gg(t){let e=t?.boundsMm;if(!e)return{exit:[0,0,-_e.housingDepthMm],depth:_e.housingDepthMm,modeled:!1};let{pose:a,scale:s}=Ug(t.alignment),n=[];for(let c=0;c<8;c+=1){let d=[0,1,2].map(f=>(c>>f&1?e.maxMm:e.minMm)[f]*s),b=Oa(a.rotation,d);n.push([0,1,2].map(f=>b[f]+a.translationMm[f]))}let r=[0,1,2].map(c=>Math.min(...n.map(d=>d[c]))),i=[0,1,2].map(c=>Math.max(...n.map(d=>d[c]))),o=Math.min(r[2],0);return{exit:[(r[0]+i[0])/2,(r[1]+i[1])/2,o],depth:-o+0,modeled:!0}}function Kg(t,e=0,a){let s=Pg[(e%4+4)%4],n=Dt({translationMm:[0,0,0],rotation:Dg},{translationMm:[0,0,0],rotation:s}),r=Dt(t,n),{exit:i,depth:o,modeled:c}=Gg(a),d=Dt(r,{translationMm:i,rotation:Vs}).translationMm,b=Oa(r.rotation,[0,0,-1]),f=[0,1,2].map(m=>d[m]+_e.bootMm*b[m]);return{pose:r,exitMm:d.map(pe),outward:b.map(pe),legMm:f.map(pe),depthMm:pe(o),modeled:c}}function Zc(t,e,a,s,n=0,r,i){let o=br(e,a,s);if(!o||!e)return null;let c=Math.max(Qc(o,Yc(e,a,i))[1][2],0),d=Dt(t,{translationMm:o.originMm,rotation:o.rotation});return d=Dt(d,{translationMm:[0,0,c],rotation:Vs}),{...Kg(d,n,r),matingPlaneMm:pe(c)}}var el=t=>[t[0],t[1],t[2]];function tl(t,e){return t.filter(a=>a.kind===e).sort((a,s)=>a.order-s.order||(a.id<s.id?-1:a.id>s.id?1:0))}function al(t){return tl(t,"breakout").map(e=>({id:e.id,positionMm:el(e.positionMm),ends:[...e.ends??[]]}))}function sl(t,e){let a=(i,o)=>i<o?`${i}
${o}`:`${o}
${i}`,s=new Map;for(let i of tl(e,"waypoint")){let[o,c]=i.between??[],d=a(o,c),b=s.get(d);b?b.push(i):s.set(d,[i])}let n={waypoints:{},pinned:{},unused:[]},r=new Set;for(let i of t.segments){let o=a(i.from,i.to),c=s.get(o);c&&(r.add(o),c[0].between?.[0]!==i.from&&(c=[...c].reverse()),n.waypoints[i.id]=c.map(d=>el(d.positionMm)),n.pinned[i.id]=c.map(d=>!!d.pinned))}for(let[i,o]of s)r.has(i)||n.unused.push(...o.map(c=>c.id));return n.unused.sort(),n}var nl=(t,e)=>Math.hypot(t[0]-e[0],t[1]-e[1],t[2]-e[2]);function zg(t){if(!t.length)return{diameterMm:0,assumedGauge:!1};let e=0,a=!1;for(let s of t){let{odMm:n,assumed:r}=qc(s.gaugeAwg);e+=n*n,a=a||r}return{diameterMm:pe(_e.packingFactor*Math.sqrt(e)),assumedGauge:a}}function Vg(t,e){let a=t.map(o=>Math.max(e.get(o.id)??0,0));a.every(o=>o===0)&&(a=t.map(()=>1));let s=a.reduce((o,c)=>o+c,0),n=[0,1,2].map(o=>t.reduce((c,d,b)=>c+a[b]*d.legMm[o],0)/s),r=[0,1,2].map(o=>t.reduce((c,d)=>c+d.outward[o],0)/t.length),i=Math.hypot(...r);return i<1e-9?n:[0,1,2].map(o=>n[o]+_e.breakoutLiftMm*r[o]/i)}function rl(t,e,a=[]){let s=new Map(t.map(p=>[p.id,p])),n=[],r=[];for(let p of e)s.has(p.from.end)&&s.has(p.to.end)?n.push(p):r.push(p.id);let i=new Map;for(let p of n)for(let u of[p.from.end,p.to.end])i.set(u,(i.get(u)??0)+1);let o=p=>p.map(pe),c=t.map(p=>({id:p.id,kind:"end",positionMm:o(p.legMm)})),d=[];if(a.length){for(let u of a)c.push({id:u.id,kind:"breakout",positionMm:o(u.positionMm)});let p=new Map;for(let u of a)for(let l of u.ends??[])s.has(l)&&!p.has(l)&&p.set(l,u.id);for(let u of t){let l=p.get(u.id);if(l===void 0){let y=a[0];for(let h of a)nl(h.positionMm,u.legMm)<nl(y.positionMm,u.legMm)&&(y=h);l=y.id}d.push([u.id,l])}for(let u=0;u+1<a.length;u+=1)d.push([a[u].id,a[u+1].id])}else if(t.length===2)d.push([t[0].id,t[1].id]);else if(t.length>2){c.push({id:"auto",kind:"breakout",positionMm:o(Vg(t,i))});for(let p of t)d.push([p.id,"auto"])}let b=new Map(c.map(p=>[p.id,[]]));for(let[p,u]of d)b.get(p).push(u),b.get(u).push(p);let f=(p,u)=>{let l=new Set([p]),y=[p];for(;y.length;){let h=y.pop();for(let g of b.get(h))h===u[0]&&g===u[1]||h===u[1]&&g===u[0]||l.has(g)||(l.add(g),y.push(g))}return l},m=d.map(([p,u])=>{let l=f(p,[p,u]),y=n.filter(h=>l.has(h.from.end)!==l.has(h.to.end));return{id:`${p}~${u}`,from:p,to:u,wires:y.map(h=>h.id),...zg(y)}});return{nodes:c,segments:m,unplaced:r}}function Hg(t){return{translationMm:[t[12],t[13],t[14]],rotation:hr([t[0],t[1],t[2]],[t[4],t[5],t[6]],[t[8],t[9],t[10]])}}var qg=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];function Xg(t,e){return[0,1,2].map(a=>t[a]*e[0]+t[4+a]*e[1]+t[8+a]*e[2]+t[12+a])}function il(t,e){let a=[];for(let s of t){let n=`${s.level||""}/${s.id}`,r=new Map;for(let p of[...s.ends].sort((u,l)=>u.ordinal-l.ordinal)){let u=p.occurrence?e(p.occurrence):null;if(!u||!p.connector)continue;let l=Zc(Hg(u),p.connector.geometry,p.connector.thicknessMm,p.connector.stored);l&&r.set(p.id,l)}if(r.size<2)continue;let i=[...r].map(([p,u])=>({id:p,legMm:u.legMm,outward:u.outward})),o=s.wires.map(p=>({id:p.id,from:{end:p.from},to:{end:p.to},gaugeAwg:p.gaugeAwg??null})),c=s.level?e(s.level):qg,d=c?(s.nodes??[]).map(p=>({...p,positionMm:Xg(c,p.positionMm)})):[],b=rl(i,o,al(d)),f=sl(b,d),m=new Map(b.segments.map(p=>[p.id,p]));for(let p of $c(Object.fromEntries(r),b,f.waypoints,f.pinned)){let u=m.get(p.segmentId);u.diameterMm<=0||a.push({harness:n,segmentId:p.segmentId,samplesMm:p.samplesMm.flat(),radiusMm:u.diameterMm/2,wires:u.wires,tightBend:p.tightBend!==null,assumedGauge:u.assumedGauge})}}return a}var Hs=Object.freeze({restricted:{color:[.55,.57,.6,1],label:"Restricted"},loading:{color:[.7,.76,.82,1],label:"Loading\u2026"},building:{color:[.62,.72,.84,1],label:"Building 3D view\u2026"},missing:{color:[.78,.76,.7,1],label:"No 3D view"},failed:{color:[.86,.6,.56,1],label:"3D view failed"},unknown:{color:[.78,.76,.7,1],label:""}}),ol=Object.freeze([.001,0,0,0,0,.001,0,0,0,0,.001,0,0,0,0,1]);function Pa(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let n=0;n<4;n+=1)a[s*4+n]=t[n]*e[s*4]+t[4+n]*e[s*4+1]+t[8+n]*e[s*4+2]+t[12+n]*e[s*4+3];return a}function Wg([t,e,a]){return[1,0,0,0,0,1,0,0,0,0,1,0,t,e,a,1]}function $g([t,e,a]){return[t,0,0,0,0,e,0,0,0,0,a,0,0,0,0,1]}function cl(t,e){return Pa(ol,Pa(t,e))}function ll(t,e){let a=e.minMm,s=e.maxMm.map((n,r)=>Math.max(n-a[r],.2));return Pa(ol,Pa(t,Pa(Wg(a),$g(s))))}function dl(t,e,a){return t.restricted?"restricted":!t.assetId||!e?"missing":a==="loaded"?null:a==="failed"?"failed":e.status==="ready"?e.bundleUrl&&e.bundleToBoard?"loading":"building":Hs[e.status]?e.status:"unknown"}function gr(t){return!!(t&&t.status==="ready"&&t.bundleUrl&&t.bundleToBoard)}function ul(t,e){return!t||t.bundleUrl!==e.bundleUrl||t.loadState==="failed"?"create":t.loadState==="waiting"&&gr(e)?"load":"keep"}function fl(t){return(t?.occurrences||[]).filter(e=>e.kind==="board"||e.restricted)}function hl(t){if(!t.length)return!1;let e=0;for(let a of t)if(!a.standIn)e+=1;else if(a.standIn==="loading")return!1;return e>0}var bl=512*1024*1024,Jg=.65,Yg=120,Qg=12,Zg=48,Il=230,em=40,tm=4,Rr=document,ut,D,Ie,Zs,en,tn,ba,bn,nt,Ws,Da,at,Xe,be,Ce,$s,an,La,ke,Z,pn,gn,Ne,ha,Yt,st,$t,sn,$=t=>Rr.querySelector(t),Jt=t=>Rr.querySelectorAll(t);function Sl(t=document){Rr=t,ut=$("#app"),D=$("#viewport"),Ie=$("#schematic-viewport"),Zs=$("#schematic-dom-layer"),en=$("#schematic-flow-overlay"),tn=$("#bom-view"),ba=$("#status")||{set textContent(e){}},bn=$("#viewer-kind")||{set textContent(e){}},nt=$("#selection")||{set textContent(e){}},Ws=$("#diagnostics")||{set innerHTML(e){}},Da=$("#scene-stats"),at=$("#lod-tuning"),Xe=$("#layers"),be=$("#search-controls"),Ce=$("#view-controls"),Ne=$("#stackup-workspace-view"),$s=$("#fallback"),an=$("#panel-labels"),La=$("#schematic-labels"),ke=$("#axis-gizmo"),Z=$("#selection-card"),pn=$("#primary-heading"),gn=$("#primary-description"),ha=$("#mode-switch"),Yt=$("#system-labels"),st=$("#move-gizmo"),$t=$("#system-help"),sn=$("#system-harnesses"),ut.classList.add("workspace-pcb")}function Rl(){return{workspace:"pcb",mode:"3d",activeNetId:0,selectedFeatureId:0,selectedOccurrence:0,selectionAnchor:null,showBoard:!0,showComponents:!0,showPlaceholders:!0,realisticColors:!0,isolateNet:!1,savedShowBoard:!0,savedShowComponents:!0,preIsolationShowBoard:null,separation:0,dragging:!1,dragMode:"orbit",lastX:0,lastY:0,pointerStartX:0,pointerStartY:0,frameCpuMs:0,frameCpuP95Ms:0,frameIntervalMs:0,frameIntervalP95Ms:0,frameSamples:[],fps:0,frames:0,fpsAt:performance.now(),activeTab:"layers",selectedPageId:"",selectedSchematicFeature:null,schematicDragging:!1,schematicLastX:0,schematicLastY:0,schematicStartX:0,schematicStartY:0}}function za(t={}){return{key:t.key??"board",topology:t.topology||window.__TOPOLOGY__||{},semanticGeometry:t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},viewerReadiness:t.readiness||{stage:"semantic-ready",progress:100},assetCache:t.assetCache||null,deferComponents:!!t.deferComponents,scene:am(),renderer:null,compareLayers:new Set,desiredCompareLayers:new Set,visible3dLayers:new Set,preIsolation3dLayers:null,preIsolationCompareLayers:null,highlightedNetIds:new Set,hiddenComponents:new Set,hiddenComponentRequest:null,loadedBytes:0,triangles:0,residentTileBytes:0,residentTileGpuBytes:0,residentTileTriangles:0,tileLoads:0,tileEvictions:0,tileSchedulerMs:0,lastTileScheduleAt:0,visibleTileIds:new Set,gpuBytes:0}}function am(){return{manifest:null,manifestUrl:"",layers:[],copperLayers:[],nets:[],features:new Map,tiles:new Map,loaded:new Set,loading:new Map,failed:new Map,residentTiles:new Map,componentFeatures:new Map,componentModelCounts:new Map,componentTier:"idle",componentEntries:[],componentsWantedAt:0,componentEvictions:0,runtimeBounds:null,layerZOffsets:new Float32Array(256),layerZOffsetSignature:""}}function Al(){return{key:"",started:0,from:new Map,current:new Map}}function _l(){return{phase:"idle",previous:new Set,target:new Set,previousOffsets:new Map,started:0}}function Nl(){return{manifest:null,manifestUrl:"",pages:[],byId:new Map,activeNetUid:"",visiblePages:[],fitted:!1,rendererMode:new URLSearchParams(location.search).get("schematicRenderer")||"svg-dom",domFallbackReason:""}}var w=Rl(),E=za(),M=null,we=Al(),q=_l(),P=Nl(),nn=[],rn=1.5*1024*1024*1024,sm=5e3,N,Y,We,z,se,Qt=new Map,Lt=performance.now(),me=0,Js=0,Va=null,on=null,cn=null,mr=!1,Se=!1,mn=()=>!0,Ua=!0;!window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__&&document.getElementById("app")&&_r().catch(t=>{console.error(t),ba&&(ba.textContent="Renderer failed"),$s&&($s.hidden=!1,$s.textContent=t.stack||t.message||String(t))});function Cl(t){let e=new Map((t.components||[]).map(s=>[s.uid,s])),a={};for(let s of t.terminals||[]){let n=s.net_uid;if(!n)continue;let r=e.get(s.component_uid)||{},i={designator:s.designator||r.designator||"",pin:s.pin||"",value:r.value||"",pcb_pad_id:s.pcb_pad_id||""};a[n]||(a[n]={terminals:[]});let o=a[n].terminals;o.some(c=>c.designator===i.designator&&c.pin===i.pin)||o.push(i)}return a}function nm(t,e=E){if(!t||!e.topology||!e.topology.physical_objects)return 0;let a=e.topology.physical_objects.find(n=>n.uid===t);if(!a||!a.source_ids||!a.source_ids.length)return 0;let s=a.source_ids[0];for(let[n,r]of e.scene.features.entries())if(r.sourceUid===s)return n;return 0}function Ar(t,e=E){return!t||!e.topology||!e.topology.components?null:e.topology.components.find(a=>a.designator===t)}function qs(t,e){for(let a of Object.keys(t))delete t[a];Object.assign(t,e)}function Fl(){if(Js&&(cancelAnimationFrame(Js),Js=0),window.removeEventListener("keydown",Ld),M){for(let t of M.boards.values())t.abort?.abort();M.scene.dispose(),M=null}else E.renderer?.dispose?.();E.renderer=null,N=null,Y?.dispose?.(),Y=null,We=null,Va=null,mn=()=>!0,Ua=!0}function Bl(){return me+=1,Fl(),qs(w,Rl()),E=za(),qs(we,Al()),qs(q,_l()),qs(P,Nl()),nn=[],z=null,se=null,Qt=new Map,Lt=performance.now(),me}function jl(t){t===me&&(me+=1,Fl())}function Ga(t){t===me&&(Js=requestAnimationFrame(e=>ly(e,t)))}function ge(t){return t===me}async function _r(t={}){let e=Bl(),a={};if(E.topology=t.topology||window.__TOPOLOGY__||{},E.topology&&!E.topology.net_details&&(E.topology.net_details=Cl(E.topology)),E.semanticGeometry=t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},E.viewerReadiness=t.readiness||E.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},Va=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,cn=typeof t.onContextMenu=="function"?t.onContextMenu:null,on=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,mn=typeof t.isActive=="function"?t.isActive:()=>!0,Ua=t.workspaceScope!=="3d",E.assetCache=t.assetCache||null,w.gpuBudgetBytes=rn,Sl(t.root||document),!ut||!D)throw new Error("Semantic viewer shell is missing required DOM nodes");return await om(e,a,t.onPerformanceEvent),{performance:a,setSelection(s){Se=!0;try{if(s?.occurrence!=null&&rm(s.occurrence),!s)Fe();else if(s?.netName||s?.netUid){let n=s.netUid&&E.scene.nets.find(r=>r.uid===s.netUid)||s.netName&&Vt(E.scene.nets,s.netName);n&&ma(Number(n.id),!0)}else s?.netId?ma(Number(s.netId),!0):s?.featureId?Kt(Number(s.featureId),!0):s?.reference&&Tn(String(s.reference),!0)}finally{Se=!1}},resize(){E.renderer?.resize(),N?.resize(),w.workspace==="pcb"&&w.mode==="layer"&&Gr()},setWorkspace(s){let n=s==="stackup"?"stackup":"pcb";w.workspace!==n&&Bd(n)},setHiddenComponents(s){return Cd(s)},getComponentReferences(){return[...E.scene.componentFeatures.keys()]},setHighlightedNets(s){return im(s)},setStatsOverlay(s){jr(s)},stats(){return Br()},setLodOverride(s){E.renderer?.setLodOverride(s)},setGpuBudget(s){let n=Number(s);w.gpuBudgetBytes=Number.isFinite(n)&&n>0?n:rn;for(let r of M?M.boards.values():[E])r.tiersCheckedAt=0},pickAt(s,n){return Pd(s,n)},projectComponent(s){return Dd(E,s,n=>kr(n,Xt))},projectPoint(s){return kr(s,Xt)},getViewState:Nr,setViewMode:Sd,setLayerVisible:Vr,applyLayerPreset:Hr,setShowBoard:qr,setShowComponents:Xr,setShowPlaceholders:Rd,setRealisticColors:Ad,setSeparation:Wr,showNetLayers:En,setNetIsolation:Gt,dispose(){jl(e)}}}function Ut(){!on||mr||(mr=!0,queueMicrotask(()=>{mr=!1,on?.(Nr())}))}function Nr(){let t=w.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;return{mode:w.mode,layers:E.scene.copperLayers.map(e=>({id:Number(e.id),name:String(e.name),color:Qr(Mn(e)),visible:t.has(Number(e.id))})),showBoard:w.showBoard,showComponents:w.showComponents,showPlaceholders:w.showPlaceholders,realisticColors:w.realisticColors,separation:M?M.separation.get(Ka())||0:w.separation,isolateNet:w.isolateNet,hasNet:!!w.activeNetId||ft(),...M?{boards:Pm(),selectedBoard:Ka()}:{}}}function yn(t){if(M?.move.enabled&&vn(),Se)return;let e=E.renderer&&!E.renderer.identityOnly?E.renderer.occurrenceKeys[w.selectedOccurrence]:null;Va?.(t&&e!=null?{...t,occurrence:e}:t)}function rm(t){let e=E.renderer?.occurrenceKeys.indexOf(String(t))??-1;e>=0&&(w.selectedOccurrence=e)}function Cr(t){if(!t||!E.renderer||E.renderer.identityOnly)return t;let e=E.renderer.occurrenceMatrices[w.selectedOccurrence];return e?ia(e,t):t}function Ol(t,e=null){return t?{kind:"net",sourceContext:"3D",netName:String(t.name||""),netUid:String(t.uid||"")||void 0,netCode:Number(t.id||0)||void 0,featureId:Number(e?.id||0)||void 0,uuid:String(e?.sourceUid||"")||void 0}:null}function Pl(t,e=E){if(!t)return null;let a=ya(t),s=String(t.padNumber||t.pin||t.pinNumber||""),n=e.scene.nets.find(r=>Number(r.id)===Number(t.netId||0));if(a&&s)return{kind:"terminal",sourceContext:"3D",reference:a,pin:s,netUid:n?.uid,netName:n?.name,netCode:n?Number(n.id):void 0,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0};if(a){let r=Ar(a,e);return{kind:"component",sourceContext:"3D",reference:a,componentUid:r?.uid,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0}}return Ol(n,t)}function Dl(){w.showBoard=!0,w.showComponents=!0,ta(),typeof Re=="function"&&Re()}function ft(){return pa().size>0||!!M?.emphasisSets.length}function pa(){let t=new Set(E.highlightedNetIds);return w.activeNetId&&t.add(Number(w.activeNetId)),t}function im(t){let e=Array.isArray(t)?t:[],a=yi(E.scene.nets,e),s=ft();E.highlightedNetIds=a,E.renderer?.setEmphasizedNetIds(a);let n=ft();return n&&!s?xn():!n&&s&&Fr(),w.isolateNet&&n&&ea(),ye(performance.now(),{force:!0}),{applied:a.size,requested:e.length}}function xn(){(w.showBoard||w.showComponents)&&(w.savedShowBoard=w.showBoard,w.savedShowComponents=w.showComponents),w.showBoard=!1,w.showComponents=!1,ta(),typeof Re=="function"&&Re()}function Fr(){w.showBoard=w.savedShowBoard!==!1,w.showComponents=w.savedShowComponents!==!1,ta(),typeof Re=="function"&&Re()}async function Ll(t,e,a={}){let s=t.semanticGeometry.assets?.scene_manifest||t.semanticGeometry.semantic_gltf?.path,n=performance.now();if(s){if(t.scene.manifestUrl=new URL(s,location.href).toString(),t.scene.manifest=await dm(t.scene.manifestUrl,t),a.scene_manifest_fetch_parse_ms=performance.now()-n,!ge(e))return!1;if(t.scene.manifest.schema!=="prism.semantic_gltf_a0")throw new Error(`Unsupported scene schema: ${t.scene.manifest.schema}`)}else t.scene.manifest={schema:"prism.semantic_gltf_partial.a0",bbox:null,layers:[],nets:[],objectFeatures:[],components:[],tiles:[],barrels:[]},a.scene_manifest_fetch_parse_ms=0;n=performance.now(),t.scene.layers=t.scene.manifest.layers||[],t.scene.copperLayers=t.scene.layers.filter(i=>i.role==="copper"||String(i.name).endsWith(".Cu")),t.scene.nets=t.scene.manifest.nets||[];for(let i of t.scene.manifest.objectFeatures||[])t.scene.features.set(Number(i.id),{...i,bounds:Ea(i.boundsMm)});for(let i of t.scene.manifest.components||[])t.scene.componentFeatures.set(i.designator,i),t.scene.features.set(Number(i.featureId),{...i,kind:"component",sourceUid:i.uid,netId:0,bounds:null});for(let i of t.scene.manifest.tiles||[])t.scene.tiles.set(i.id,i);a.scene_manifest_index_ms=performance.now()-n;let r=Gl(t);for(let i of r)t.compareLayers.add(i),t.desiredCompareLayers.add(i);for(let i of t.scene.copperLayers)t.visible3dLayers.add(Number(i.id));return!0}async function om(t,e={},a=null){let s=performance.now();if(!await Ll(E,t,e))return;let n=performance.now();if(E.renderer=await Wt.create(D),e.webgpu_renderer_create_ms=performance.now()-n,!ge(t)){E.renderer?.dispose?.(),E.renderer=null;return}E.renderer.setBarrels(E.scene.manifest.barrels||[]),Wa(),n=performance.now();let r=await ql(t);if(e.board_fetch_parse_upload_ms=performance.now()-n,!ge(t)||(E.scene.runtimeBounds=r||ns(E.scene.manifest.bbox),z=new va(E.scene.runtimeBounds),Ua&&(await cm(t),!ge(t)||(await lm(t),!ge(t)))))return;n=performance.now(),Kr(),Fd(),Ua&&(Fy(),Cy()),_d(),Gd(),e.controls_and_bindings_ms=performance.now()-n;let i={"board-ready":"Board ready \xB7 components and semantic layers are still generating","components-ready":"Board and components ready \xB7 semantic layers are still generating","semantic-ready":"WebGPU semantic glTF active"};if(ba.textContent=i[E.viewerReadiness.stage]||"Loading 3D assets",E.semanticGeometry.assets?.components_glb&&!E.deferComponents){let o=performance.now();bd(t).then(()=>{ge(t)&&(Tr(r),a?.({schema:"prism.semantic_viewer_performance.a0",milestone:"components-loaded",readiness_stage:E.viewerReadiness.stage,elapsed_ms:performance.now()-o,bytes_loaded:E.loadedBytes}))})}else Tr(r);ye(performance.now(),{force:!0}),Ga(t),n=performance.now(),await new Promise(o=>requestAnimationFrame(o)),e.first_frame_wait_ms=performance.now()-n,e.boot_total_ms=performance.now()-s}async function cm(t=me){let e=E.semanticGeometry.assets?.schematic_native_manifest||E.semanticGeometry.schematic_vector?.path||E.semanticGeometry.schematic_scene?.path,a=E.semanticGeometry.assets?.schematic_manifest||E.semanticGeometry.schematic_world?.path,s=$("[data-workspace=schematic]");if(!e&&!a){s.disabled=!0,s.title="No schematic world assets are available";return}let n=[e,a].filter(Boolean),r=null;for(let o of n)try{P.manifestUrl=new URL(o,location.href).toString();let c=await js.create(Ie,P.manifestUrl);if(!ge(t))return;N=c,N.setFlowOverlayCanvas(en);break}catch(c){if(r=c,N=null,o===a)throw c}if(!N)throw r||new Error("Failed to load schematic viewer assets");P.manifest=N.manifest,P.pages=N.pages,P.byId=new Map(P.pages.map(o=>[o.id,o])),w.selectedPageId=P.pages[0]?.id||"",N.selectedPageId=w.selectedPageId,!["native","legacy","webgpu"].includes(String(P.rendererMode).toLowerCase())&&(Y=Ds.create(Zs,P.manifestUrl,P.manifest,N.featuresByPage,{onSelect:My,onBlank:Xa,onHighlightNet:kd,onOpenPage:wy,onFallback:o=>{P.domFallbackReason=o,console.warn(o)}}),Y.preloadPages(P.pages)),N.preloadOverview()}async function lm(t=me){let e=E.semanticGeometry.assets?.bom||E.semanticGeometry.bom?.path,a=$("[data-workspace=bom]");if(!e){a&&(a.disabled=!0,a.title="No BoM artifact is available");return}try{let s=await as.create(tn,new URL(e,location.href).toString(),{onSelectReference:n=>Tn(n,!0)});if(!ge(t))return;We=s}catch(s){if(!ge(t))return;console.warn(s),a&&(a.disabled=!0,a.title=s?.message||"BoM artifact could not be loaded")}}async function dm(t,e=E){if(e.assetCache)return e.assetCache.fetchJson(String(t));let a=await fetch(t,{cache:"default"});if(!a.ok)throw new Error(`Failed to load ${t}: ${a.status}`);return a.json()}async function um(t,e=me,a=E){if(!ge(e))return;let s=a.scene.residentTiles.get(t.id);if(s){s.lastUsed=performance.now();return}if(a.scene.failed.get(t.id))return;if(a.scene.loading.has(t.id))return a.scene.loading.get(t.id);let r=(async()=>{try{let i=await Ra(new URL(t.path,a.scene.manifestUrl).toString(),{fetchBytes:un(a),fetchCache:"no-store"});if(!ge(e)||!a.renderer)return;a.loadedBytes+=i.byteLength;let o=a.scene.layers.find(m=>Number(m.id)===Number(t.layerId)),c=[],d=0,b=0;for(let m of i.primitives){let p=a.renderer.addPrimitive(m,{kind:"copper",tileId:t.id,layerId:Number(t.layerId),innerCopper:xm(Number(t.layerId),a),color:yd(o,a),stencilMark:md(o,a),baseZ:Number(o?.z_mm||0)/1e3,material:{baseColor:[1,1,1,1],metallic:.78,roughness:.32}});c.push(p),d+=m.indices.length/3,b+=fm(m)}let f={tile:t,entries:c,byteLength:i.byteLength,gpuBytes:b,triangles:d,lastUsed:performance.now(),pinned:!1};a.scene.residentTiles.set(t.id,f),a.scene.loaded.add(t.id),a.tileLoads+=1,a.residentTileBytes+=i.byteLength,a.residentTileGpuBytes+=b,a.residentTileTriangles+=d,a.triangles=a.residentTileTriangles,a.scene.failed.delete(t.id)}catch(i){if(!ge(e))return;let o=a.scene.failed.get(t.id)||{count:0,message:""};a.scene.failed.set(t.id,{count:o.count+1,message:i?.message||String(i)}),o.count||console.warn(`Failed to load tile ${t.id}; suppressing retries until assets are regenerated`,i)}finally{ge(e)&&a.scene.loading.delete(t.id)}})();return a.scene.loading.set(t.id,r),r}function fm(t){return t.position.length/3*em+t.indices.length*tm}function hm(t,e=E){let a=e.scene.residentTiles.get(t);a&&(e.renderer.removeEntries(a.entries),e.scene.residentTiles.delete(t),e.scene.loaded.delete(t),e.residentTileBytes=Math.max(0,e.residentTileBytes-a.byteLength),e.residentTileGpuBytes=Math.max(0,e.residentTileGpuBytes-a.gpuBytes),e.residentTileTriangles=Math.max(0,e.residentTileTriangles-a.triangles),e.triangles=e.residentTileTriangles,e.tileEvictions+=1)}function ye(t=performance.now(),e={},a=E){if(!a.renderer||!z||w.workspace!=="pcb")return;let s=w.mode==="layer"&&q.phase==="preload";if(!e.force&&!s&&t-a.lastTileScheduleAt<Yg)return;let n=performance.now();a.lastTileScheduleAt=t;let r=bm(a);a.visibleTileIds=r;let i=a.scene.loading.size,c=Math.max(0,(s?Zg:Qg)-i),d=[...r].map(f=>a.scene.tiles.get(f)).filter(f=>f&&!a.scene.residentTiles.has(f.id)&&!a.scene.loading.has(f.id)&&!a.scene.failed.has(f.id)).sort((f,m)=>gl(f,a)-gl(m,a)).slice(0,c),b=me;for(let f of d)um(f,b,a);for(let f of r){let m=a.scene.residentTiles.get(f);m&&(m.lastUsed=t)}zl(r,void 0,a),a.tileSchedulerMs=performance.now()-n}function bm(t=E){let e=new Set,a=w.mode==="3d"?t.visible3dLayers:pm();if(!a.size||!se)return e;if(w.mode==="layer"){for(let r of t.scene.tiles.values())a.has(Number(r.layerId))&&e.add(r.id);return e}let s=new Set,n=sd(t);if(n.size){for(let r of t.scene.tiles.values())if(a.has(Number(r.layerId))){for(let i of n)if(Hl(r,i)){s.add(r.id);break}}}for(let r of t.scene.tiles.values()){if(!a.has(Number(r.layerId)))continue;let i=w.mode==="layer"?Qt.get(Number(r.layerId)):null;mm(r,se.matrix,i,Jg,t)&&e.add(r.id)}for(let r of s)e.add(r);return e}function pm(){return w.mode!=="layer"||q.phase==="idle"?E.compareLayers:Kl(q.previous,q.target)}function Ul(){return w.mode!=="layer"?E.visible3dLayers:q.phase==="reveal"?Kl(q.previous,q.target):E.compareLayers}function Gl(t=E){let e=t.scene.copperLayers.map(a=>Number(a.id)).filter(Number.isFinite);return e.length?e.length===1?new Set([e[0]]):new Set([e[0],e[e.length-1]]):new Set}function gm(){let t=E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers;return t.size?new Set([...t].map(Number)):Gl()}function Kl(...t){let e=new Set;for(let a of t)for(let s of a||[])e.add(Number(s));return e}function zl(t,e=bl,a=E){if(w.mode==="layer")return;let s=Math.min(bl,e);if(a.residentTileGpuBytes<=s)return;let n=[...a.scene.residentTiles.values()].filter(r=>!t.has(r.tile.id)&&!a.scene.loading.has(r.tile.id)).sort((r,i)=>r.lastUsed-i.lastUsed);for(let r of n){if(a.residentTileGpuBytes<=s)break;hm(r.tile.id,a)}}function mm(t,e,a=null,s=0,n=E){let r=Vl(t,n);if(!r)return!0;let i=Math.max(r[3]-r[0],r[4]-r[1])*s,o=[r[0]-i+(a?.[0]||0),r[1]-i+(a?.[1]||0),r[2]-.002,r[3]+i+(a?.[0]||0),r[4]+i+(a?.[1]||0),r[5]+.002],c=n.renderer?.occurrenceMatrices;return!c||c.length===1&&ks(c[0])?pl(o,e):c.some(d=>pl(o,ts(e,d)))}function Vl(t,e=E){let a=t.boundsMm;if(!a||a.length!==4)return null;let s=e.scene.layers.find(r=>Number(r.id)===Number(t.layerId)),n=Number(s?.z_mm||0)/1e3;return[a[0]/1e3,-a[3]/1e3,n-4e-4,a[2]/1e3,-a[1]/1e3,n+4e-4]}function pl(t,e){let a=[[t[0],t[1],t[2]],[t[3],t[1],t[2]],[t[0],t[4],t[2]],[t[3],t[4],t[2]],[t[0],t[1],t[5]],[t[3],t[1],t[5]],[t[0],t[4],t[5]],[t[3],t[4],t[5]]].map(n=>ym(e,n));return![n=>n[0]<-n[3],n=>n[0]>n[3],n=>n[1]<-n[3],n=>n[1]>n[3],n=>n[2]<0,n=>n[2]>n[3]].some(n=>a.every(n))}function ym(t,e){let a=e[0],s=e[1],n=e[2];return[t[0]*a+t[4]*s+t[8]*n+t[12],t[1]*a+t[5]*s+t[9]*n+t[13],t[2]*a+t[6]*s+t[10]*n+t[14],t[3]*a+t[7]*s+t[11]*n+t[15]]}function Hl(t,e){return Array.isArray(t.netIds)&&t.netIds.some(a=>Number(a)===Number(e))}function gl(t,e=E){let a=Vl(t,e);if(!a||!z)return 0;let s=(a[0]+a[3])*.5-z.focus[0],n=(a[1]+a[4])*.5-z.focus[1];return s*s+n*n}async function ql(t=me,e=E){let a=e.semanticGeometry.assets?.base_board_glb;if(!a)return null;let s=e.semanticGeometry.assets?.soldermask_glb,[n,r]=await Promise.all([Ra(new URL(a,location.href).toString(),{defaultFeatureId:0,fetchBytes:un(e)}),s?Ra(new URL(s,location.href).toString(),{defaultFeatureId:0,fetchBytes:un(e)}).catch(o=>(console.warn("[prism-semantic-viewer] solder mask failed to load",o),null)):null]);if(!ge(t)||!e.renderer)return null;e.loadedBytes+=n.byteLength,r&&(e.loadedBytes+=r.byteLength);let i=[...n.primitives.filter(o=>{let c=Fn(o);return c!=="pad"&&!(r&&c==="soldermask")}),...r?.primitives||[]];for(let o of ss(i,Fn))e.renderer.addPrimitive(o,{kind:"board",boardRole:o.groupKey,layerId:o.groupKey==="paste"?sy(o,e):0,material:o.material,color:o.material.baseColor});return sa(i.map(o=>o.bounds))}function Zt(t=E){return t.scene.runtimeBounds||ns(t.scene.manifest?.bbox)}function xm(t,e=E){return di(t,e.scene.copperLayers)}function Xl(t,e){let{back:a}=z.basis();return{eye:Qe(z.focus,De(a,z.distance)),orthographic:e,pixelScale:e?t/Math.max(1e-9,z.orthoScale):t/2/Math.tan(z.fov/2)}}function Br(){if(M)return wm();let t=E.renderer?.cullCounts||{full:0,board:0,body:0,box:0,culled:0},e=!E.renderer||E.renderer.identityOnly;return{occurrences:E.renderer?.occurrenceMatrices.length||0,lod:e?{full:1,board:0,body:0,box:0,culled:0}:{...t},triangles:E.renderer?.frameStats.triangles||0,draws:E.renderer?.frameStats.draws||0,gpuMemoryBytes:E.renderer?.gpuMemoryBytes()||0,gpuBudgetBytes:w.gpuBudgetBytes,componentTier:E.scene.componentTier,componentEvictions:E.scene.componentEvictions,tileEvictions:E.tileEvictions,cache:E.assetCache?E.assetCache.summary():{enabled:!1},frameIntervalMs:w.frameIntervalMs,frameIntervalP95Ms:w.frameIntervalP95Ms,frameCpuMs:w.frameCpuMs,frameCpuP95Ms:w.frameCpuP95Ms,fps:w.fps}}function wm(){let t=$e(),e=t.map(a=>a.scene.componentTier);return{occurrences:M.scene.occurrenceCount||0,lod:M.scene.cullCounts(),triangles:M.scene.frameStats.triangles,draws:M.scene.frameStats.draws,gpuMemoryBytes:M.scene.gpuMemoryBytes(),gpuBudgetBytes:w.gpuBudgetBytes,componentTier:`${e.filter(a=>a==="loaded").length}/${t.length} loaded`,componentEvictions:t.reduce((a,s)=>a+s.scene.componentEvictions,0),tileEvictions:t.reduce((a,s)=>a+s.tileEvictions,0),cache:t.find(a=>a.assetCache)?.assetCache.summary()||{enabled:!1},frameIntervalMs:w.frameIntervalMs,frameIntervalP95Ms:w.frameIntervalP95Ms,frameCpuMs:w.frameCpuMs,frameCpuP95Ms:w.frameCpuP95Ms,fps:w.fps,firstFrame:M.timing.boardsDrawnAt==null?null:{sinceSceneMs:M.timing.boardsDrawnAt-M.timing.descriptorAt,sinceNavigationMs:M.timing.boardsDrawnAt}}}function jr(t){w.showStats=!!t,Da&&(Da.hidden=!w.showStats),at&&(at.hidden=!(w.showStats&&M)),w.showStats&&M&&Tm(),Wl()}var vr="prism.systemScene.lodThresholds",vm=Object.freeze([{key:"fullPx",label:"Parts",max:600},{key:"boardPx",label:"Copper",max:400},{key:"boxPx",label:"Box below",max:120}]);function Mm(){try{let t=JSON.parse(globalThis.localStorage?.getItem(vr)||"null");if(t&&typeof t=="object")return oa(t)}catch{}return{...qe}}function Em(t){try{t?globalThis.localStorage?.setItem(vr,JSON.stringify(t)):globalThis.localStorage?.removeItem(vr)}catch{}}function Mr(t){if(!M)return null;let e=t==null?{...qe}:{...M.scene.lodThresholds,...t},a=M.scene.setLodThresholds(e);return Em(t==null?null:a),Er(),a}function Tm(){if(!at||at.childElementCount)return Er();let t=document.createElement("h2");t.textContent="Detail thresholds (CSS px)",at.append(t);for(let a of vm){let s=document.createElement("label"),n=document.createElement("span");n.textContent=a.label;let r=document.createElement("input");Object.assign(r,{type:"range",min:"0",max:String(a.max),step:"1"}),r.dataset.key=a.key;let i=document.createElement("output");r.addEventListener("input",()=>Mr({[a.key]:Number(r.value)})),s.append(n,r,i),at.append(s)}let e=document.createElement("button");e.type="button",e.textContent="Defaults",e.addEventListener("click",()=>Mr(null)),at.append(e),Er()}function Er(){if(!at||!M)return;let t=M.scene.lodThresholds;for(let e of at.querySelectorAll("input[data-key]"))e.value=String(t[e.dataset.key]),e.nextElementSibling.value=String(Math.round(t[e.dataset.key]))}function Wl(){if(!Da||!w.showStats)return;let t=Br(),{full:e,board:a,body:s,box:n,culled:r}=t.lod,i=[["Occurrences",`${t.occurrences} (${e+a+s+n} visible)`],["Detail",`${e} full \xB7 ${a} board \xB7 ${s} body \xB7 ${n} box \xB7 ${r} culled`],["Triangles",t.triangles.toLocaleString()],["Draws",t.draws.toLocaleString()],["GPU memory",`${(t.gpuMemoryBytes/1048576).toFixed(1)} / ${(t.gpuBudgetBytes/1048576).toFixed(0)} MB`],["Components",`${t.componentTier}${t.componentEvictions?` \xB7 ${t.componentEvictions} evicted`:""}`],["Cache",t.cache.enabled?`${t.cache.hits} hits \xB7 ${t.cache.misses} misses \xB7 ${(t.cache.bytes/1048576).toFixed(0)} MB`:"off"],["Frame",`${t.frameIntervalMs.toFixed(1)} ms \xB7 p95 ${t.frameIntervalP95Ms.toFixed(1)}`],["CPU",`${t.frameCpuMs.toFixed(2)} ms \xB7 p95 ${t.frameCpuP95Ms.toFixed(2)}`],["FPS",t.fps.toFixed(0)]];Da.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("")}var km="prism.system_scene.a0";function $e(){return M?[...M.boards.values()].filter(t=>t.renderer&&t.loadState==="loaded"):[]}async function $l(t={}){let e=Bl();if(Va=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,cn=typeof t.onContextMenu=="function"?t.onContextMenu:null,on=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,mn=typeof t.isActive=="function"?t.isActive:()=>!0,Ua=!1,w.gpuBudgetBytes=rn,Sl(t.root||document),!ut||!D)throw new Error("Semantic viewer shell is missing required DOM nodes");if(typeof t.loadBundle!="function")throw new Error("A system scene needs a bundle loader");let a=await _s.create(D);return ge(e)?(a.setLodThresholds(Mm()),M={scene:a,loadBundle:t.loadBundle,onEmphasis:typeof t.onEmphasis=="function"?t.onEmphasis:null,onMove:typeof t.onMove=="function"?t.onMove:null,baseDescriptor:null,descriptor:null,move:Km(),gizmo:null,standInKey:null,showLabels:!0,harnesses:[],harnessLit:new Map,showHarnesses:!0,harnessDrawn:null,tubes:[],tubedHarnesses:new Set,timing:{descriptorAt:null,boardsDrawnAt:null},boards:new Map,groups:new Map,placed:[],placements:new Map,hiddenLayers:new Map,separation:new Map,bounds:null,framed:!1,snapped:!1,boardSelected:!1,inputs:new Map,emphasisSets:[],emphasisBounds:new Map,emphasisReport:null},E=za({key:""}),z=new va([-.1,-.1,-.01,.1,.1,.01]),Kr(),Fd(),_d(),Gd(),ba.textContent="System scene",Ga(e),{setSystemScene:Im,setNetEmphasis:Dm,frameNetEmphasis:Lm,frameAll(){M?.bounds&&z.frame(M.bounds)},setMoveAllowed:zm,setMoveMode:dn,setMoveSpace:dd,previewPose:Vm,cancelMove:Ur,getMoveState:()=>M?ld():null,setLabelsVisible(s){M&&(M.showLabels=!!s,Yt&&(Yt.hidden=!M.showLabels))},setHelpVisible:hd,setHarnessesVisible(s){M&&(M.showHarnesses=!!s,M.harnessDrawn=null,Yl())},frameBoard(s){let n=M?.placements.get(String(s));return n&&z.frame(n.worldBounds),!!n},frameParts:Um,setSelection(s){Se=!0;try{s?Nm(s):Fe()}finally{Se=!1}},resize(){M?.scene.resize()},setStatsOverlay:jr,stats:Br,setLodOverride(s){for(let n of $e())n.renderer.setLodOverride(s)},setLodThresholds:Mr,setGpuBudget(s){let n=Number(s);w.gpuBudgetBytes=Number.isFinite(n)&&n>0?n:rn;for(let r of M?.boards.values()||[])r.tiersCheckedAt=0},pickAt(s,n){return Pd(s,n)},projectPoint(s,n){return xl(s,n)},projectComponent(s,n){let r=M?.placements.get(String(n));return r?.board?Dd(r.board,s,i=>xl(i,n)):null},getViewState:Nr,setLayerVisible:Vr,applyLayerPreset:Hr,setShowBoard:qr,setShowComponents:Xr,setShowPlaceholders:Rd,setRealisticColors:Ad,setSeparation:Wr,setNetIsolation:Gt,showNetLayers:En,dispose(){jl(e)}}):(a.dispose(),null)}function Im(t){if(!M)return;if(t?.schema!==km)throw new Error(`Unsupported system scene schema: ${t?.schema||"missing"}`);M.baseDescriptor=t,M.timing.descriptorAt??=performance.now();let e=M.move.target?t.occurrences.find(s=>s.path===M.move.target):null;e?!M.move.drag&&od(M.move.preview,e.pose)&&(M.move.preview=null):(M.move.drag=null,M.move.preview=null,M.move.target=null),M.descriptor=cd(),M.harnesses=Array.isArray(t.harnesses)?t.harnesses:[],M.harnessDrawn=null;let a=new Set;for(let s of t.assets||[]){a.add(s.assetId);let n=M.boards.get(s.assetId),r=ul(n,s);if(r!=="create"){n.asset=s,r==="load"&&yl(n,me);continue}n&&ml(s.assetId);let i=za({key:s.assetId,topology:{},semanticGeometry:{},deferComponents:!0});Object.assign(i,{asset:s,bundleUrl:s.bundleUrl,loadState:"waiting",abort:null}),M.boards.set(s.assetId,i),gr(s)&&yl(i,me)}for(let s of[...M.boards.keys()])a.has(s)||ml(s);ln(),M.move.enabled&&(vn({quiet:!0}),rt("sync"))}function ml(t){let e=M.boards.get(t);e?.abort?.abort(),M.boards.delete(t),M.scene.removeAsset(t),e&&(e.renderer=null),E===e&&Or()}async function yl(t,e){t.loadState="loading",t.abort=new AbortController;let a=()=>ge(e)&&M?.boards.get(t.key)===t&&!t.abort.signal.aborted;try{let s=await M.loadBundle(t.bundleUrl,t.abort.signal);if(!a()||(t.topology=s.topology||{},t.topology.net_details||(t.topology.net_details=Cl(t.topology)),t.semanticGeometry=s.semanticGeometry||{},t.viewerReadiness=s.readiness||t.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},t.assetCache=s.assetCache||null,!await Ll(t,e)||!a()))return;t.renderer=M.scene.asset(t.key),t.renderer.setBarrels(t.scene.manifest.barrels||[]),Wa(t);let n=await ql(e,t);if(!a())return;t.scene.runtimeBounds=n||ns(t.scene.manifest.bbox),t.renderer.setBoardBounds(t.scene.runtimeBounds),t.loadState="loaded",ln()}catch(s){if(!a())return;console.warn(`[prism-semantic-viewer] system board ${t.key} failed to load`,s),t.loadState="failed",t.error=s?.message||String(s),M.scene.removeAsset(t.key),t.renderer=null,E===t&&Or(),ln()}}function ln({relabel:t=!0}={}){let e=M?.descriptor;if(!e)return;M.harnessDrawn=null;let a=Ka(),s=new Map((e.assets||[]).map(o=>[o.assetId,o])),n=new Map,r=[];for(let o of fl(e)){let c=o.assetId?s.get(o.assetId):null,d=o.assetId?M.boards.get(o.assetId):null,b=dl(o,c,d?.loadState),f,m,p;if(!b)f=d.key,m=cl(o.worldMatrix,c.bundleToBoard),p=ia(m,d.scene.runtimeBounds);else{if(!o.boundsMm)continue;f=`stand-in:${b}`,M.scene.standIn(f,Hs[b].color),m=ll(o.worldMatrix,o.boundsMm),p=ia(m,[0,0,0,1,1,1])}n.has(f)||n.set(f,[]),n.get(f).push({matrix:m,key:o.path,hiddenLayers:b?[]:[...M.hiddenLayers.get(o.path)||[]],explode:b?null:nd(d,M.separation.get(o.path)||0)}),r.push({occurrence:o,rendererId:f,board:b?null:d,matrix:m,worldBounds:p,standIn:b})}for(let o of M.scene.assets.keys())n.has(o)||n.set(o,[]);M.scene.setOccurrences(n),M.groups=n;let i=M.placements;if(M.placed=r,M.placements=new Map(r.map(o=>[o.occurrence.path,o])),t||!i)ty();else for(let o of r)o.label=i.get(o.occurrence.path)?.label;M.bounds=sa(r.map(o=>o.worldBounds)),M.bounds&&(z.sceneRadius=wa(M.bounds),M.framed||(z.frame(M.bounds),M.snapped||z.snap(),M.snapped=!0,r.some(o=>o.standIn==="loading")||(M.framed=!0)));for(let o of $e())wn(o);a!=null&&(M.placements.get(a)?.board===E?w.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(a):Or()),Yl(),rd(),Ut()}var Jl=[.17,.18,.2];function Yl(){if(!M?.descriptor)return;let t=[];if(M.showHarnesses&&M.harnesses.length){let e=new Map(M.descriptor.occurrences.map(a=>[a.path,a.worldMatrix]));try{t=il(M.harnesses,a=>e.get(a)??null)}catch(a){console.warn("[prism-semantic-viewer] harness tubes failed",a)}}M.tubes=t,M.tubedHarnesses=new Set(t.map(e=>e.harness)),M.scene.setTubes(t,Ql)}function Ql(t){let e=M.harnessLit.get(t.harness),a=e?t.wires.map(s=>e.get(s)).find(Boolean):null;return a?{rgb:Sm(a),mode:1}:{rgb:Jl,mode:M.emphasisSets.length?2:0}}function Sm(t){let e=/^#?([0-9a-f]{6})$/i.exec(String(t));if(!e)return Jl;let a=Number.parseInt(e[1],16);return[(a>>16&255)/255,(a>>8&255)/255,(a&255)/255]}function Ka(){return!M||!E.renderer||!Zl()?null:E.renderer.occurrenceKeys[w.selectedOccurrence]??null}function Zl(){return!!(w.selectedFeatureId||w.activeNetId||M?.boardSelected)}function ed(t){if(E===t)return;let e=Se;Se=!0;try{Fe()}finally{Se=e}E=t,Re()}function Or(){Fe(),E=za({key:""}),Re()}function Rm(t,e){let a=performance.now(),s=Math.max(0,t-Lt),n=Math.min(.05,(t-Lt)/1e3);Lt=t,z.update(n),M.scene.resize(),se={layerId:0,viewport:{x:0,y:0,width:D.width,height:D.height},matrix:z.matrix(D.width,D.height,!1),lod:Xl(D.height/Math.min(devicePixelRatio||1,2),!1)};let r=ft(),i=new Map;for(let o of $e()){let c=Bm(o);o.scene.copperRealism!==ga()&&Wa(o),o.renderer.setInnerCopperAtFull(w.showBoard&&!jm(o)&&!r),o.renderer.dimCopper=r,ye(t,{},o);let d=o===E;i.set(o.renderer,{activeNetId:d?w.activeNetId:0,selectedFeatureId:d?w.selectedFeatureId:0,time:t/1e3,layerOffsets:c,visibleLayers:o.visible3dLayers,showBoard:w.showBoard,showComponents:w.showComponents,showPaste:!0,componentOpacity:1,boardOpacity:r?.34:1,isolateNet:w.isolateNet,compareMode:!1,compareOffsets:new Map,layerAlphas:null,visibleTileIds:o.visibleTileIds})}M.inputs=i,M.scene.setSelectedOccurrence(E.renderer&&Zl()?E.renderer.occurrenceBase+w.selectedOccurrence:-1),fy(t,i,r)&&(M.scene.render(se,o=>i.get(o)||td(t)),Ud(),ay()),ey(),qm(),M.timing.boardsDrawnAt==null&&hl(M.placed)&&(M.timing.boardsDrawnAt=performance.now());for(let o of $e())pd(t,o);Ir(s,performance.now()-a),Sr(t),Ga(e)}function td(t){return{activeNetId:0,selectedFeatureId:0,time:t/1e3,visibleLayers:new Set,showBoard:!0,showComponents:!1,componentOpacity:1,boardOpacity:1,isolateNet:!1}}function Am(t,e){let a=performance.now();return M.scene.pick(se,t,e,s=>M.inputs.get(s)||td(a))}function _m(t){let e=t.occurrenceKey!=null?M.placements.get(t.occurrenceKey):null;if(!e)return Fe();if(e.standIn)return ad(e);let a=e.board;if(w.isolateNet&&!Cm(a,e.occurrence.path,t.featureId))return Fe();ed(a),w.selectedOccurrence=a.renderer.occurrenceKeys.indexOf(e.occurrence.path),t.featureId&&!M.move.enabled?Kt(t.featureId,!0):Yr()}function Nm(t){let e=t.occurrence!=null?M?.placements.get(String(t.occurrence)):null;if(e){if(e.standIn){ad(e);return}if(ed(e.board),w.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(e.occurrence.path),t.netName||t.netUid){let a=t.netUid&&E.scene.nets.find(s=>s.uid===t.netUid)||t.netName&&Vt(E.scene.nets,t.netName);a&&ma(Number(a.id),!0)}else t.netId?ma(Number(t.netId),!0):t.featureId?Kt(Number(t.featureId),!0):t.reference?Tn(String(t.reference),!0):Yr()}}function ad(t){let e=Se;Se=!0;try{Fe()}finally{Se=e}M.standInKey=t.occurrence.path,M.move.enabled&&vn(),Se||Va?.({kind:"board",sourceContext:"3D",occurrence:t.occurrence.path,standIn:t.standIn})}function Cm(t,e,a){let s=Number(t.scene.features.get(Number(a))?.netId)||0;if(!s)return!1;let n=t.renderer.occurrenceKeys.indexOf(e);return n<0?!1:t.renderer.occurrenceEmphasis?.[n]?.has(s)?!0:t===E&&n===w.selectedOccurrence&&s===Number(w.activeNetId)}function xl(t,e){let a=M?.placements.get(String(e));return a?kr(t,a.matrix):null}function sd(t=E){if(!M)return pa();let e=new Set(t===E?pa():[]);for(let a of t.renderer?.occurrenceEmphasis||[])if(a)for(let s of a.keys())e.add(Number(s));return e}function wn(t){let e=M.groups.get(t.key)||[],a=new Set;for(let s of t.scene.copperLayers){let n=Number(s.id);e.some(r=>!M.hiddenLayers.get(r.key)?.has(n))&&a.add(n)}if(w.isolateNet){let s=new Set;for(let n of sd(t))for(let r of zr(n,t))s.add(r);t.visible3dLayers=new Set([...a].filter(n=>s.has(n)))}else t.visible3dLayers=a;ye(performance.now(),{force:!0},t)}function Pr(t,e){let a=t??(M.groups.get(E.key)||[]).map(s=>s.key);for(let s of a){let n=new Set(M.hiddenLayers.get(String(s))||[]);e(n,M.placements.get(String(s))?.board),M.hiddenLayers.set(String(s),n)}for(let s of $e()){let n=M.groups.get(s.key)||[];for(let r of n)r.hiddenLayers=[...M.hiddenLayers.get(r.key)||[]];s.renderer.setOccurrenceHiddenLayers(n.map(r=>r.hiddenLayers)),wn(s)}Re(),Ut()}function Fm(){let t=Ka();if(t==null||!w.activeNetId)return;let e=zr(w.activeNetId,E);e.size&&Pr([t],a=>{a.clear();for(let s of E.scene.copperLayers)e.has(Number(s.id))||a.add(Number(s.id))})}function Bm(t){if(t.scene.layerSteps)return t.scene.layerSteps;let e=new Float32Array(256),a=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((s,n)=>{e[Number(s.id)]=a-n}),t.scene.layerSteps=e,e}function nd(t,e){let a=t?.scene.runtimeBounds,s=a?Math.hypot((a[3]-a[0])*1e3,(a[4]-a[1])*1e3):0;return[e*e*re(s*.12,8,25)/1e3,e<.0999?1:0,1-e*.72,1]}function jm(t){return(M.groups.get(t.key)||[]).some(e=>(M.separation.get(e.key)||0)>.001)}function Om(t,e){let a=e!=null?[String(e)]:(M.groups.get(E.key)||[]).map(s=>s.key);for(let s of a)M.separation.set(s,t);for(let s of $e()){let n=M.groups.get(s.key)||[];s.renderer.setOccurrenceExplode(n.map(r=>nd(s,M.separation.get(r.key)||0)))}Ut()}function Pm(){return M.placed.map(t=>{let e=M.hiddenLayers.get(t.occurrence.path)||new Set,a=t.board;return{key:t.occurrence.path,name:t.occurrence.displayPath||t.occurrence.path,standIn:t.standIn||null,separation:M.separation.get(t.occurrence.path)||0,layers:a?a.scene.copperLayers.map(s=>({id:Number(s.id),name:String(s.name),color:Qr(Mn(s,a)),visible:!e.has(Number(s.id))})):[]}})}function Dm(t){if(!M)return[];let e=ft();M.emphasisSets=(Array.isArray(t)?t:[]).map((n,r)=>{let i=wi(n?.color??Bn[r%Bn.length]);return{key:String(n?.key??r),mark:i,color:`#${(i&16777215).toString(16).padStart(6,"0")}`,members:(Array.isArray(n?.members)?n.members:[]).filter(o=>o&&typeof o.occurrence=="string"&&typeof o.net=="string"),wires:(Array.isArray(n?.wires)?n.wires:[]).filter(o=>o&&typeof o.harness=="string"&&typeof o.wire=="string")}});let a=rd(),s=ft();return s&&!e?xn():!s&&e&&(w.isolateNet&&Gt(!1),Fr()),w.isolateNet&&s&&ea(),a}function rd(){if(!M)return[];let t=new Map;for(let[r,i]of M.groups)t.set(r,i.map(()=>null));let e=new Map;for(let r of M.groups.values())r.forEach((i,o)=>e.set(i.key,o));M.emphasisBounds=new Map;let a=M.emphasisSets.map(r=>{let i={key:r.key,color:r.color,lit:0,unresolved:[]},o=[];M.emphasisBounds.set(r.key,o);for(let c of r.members){let d=M.placements.get(c.occurrence),b=d?.board;if(!b){let y=d?d.standIn==="loading"||d.standIn==="building"?"loading":d.standIn==="restricted"?"restricted":"not-drawn":"not-drawn";i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:y});continue}let f=Vt(b.scene.nets,c.net),m=Number(f?.id)||0;if(!m){i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:"unknown-net"});continue}let p=t.get(b.key),u=e.get(c.occurrence);if(!p||u==null)continue;p[u]=p[u]||new Map,p[u].has(m)||p[u].set(m,r.mark),i.lit+=1;let l=Ea(f.boundsMm);l&&o.push({occurrence:c.occurrence,box:ia(d.matrix,l)})}return i});M.harnessLit=Pc(M.harnesses,M.emphasisSets),M.harnessDrawn=null,M.scene.setTubeColors(Ql);for(let r of a){r.wires=0;for(let i of M.harnessLit.values())for(let o of i.values())o===r.color&&(r.wires+=1)}let s=M.emphasisSets.length>0;for(let r of $e())r.renderer.setOccurrenceEmphasis(s&&t.get(r.key)||null,{dimCopper:s});if(w.isolateNet)for(let r of $e())wn(r);let n=JSON.stringify(a)!==JSON.stringify(M.emphasisReport);return M.emphasisReport=a,n&&M.onEmphasis?.(a),a}function Lm(t=null,e=null){let a=[];for(let[n,r]of M?.emphasisBounds||[])if(!(t!=null&&n!==String(t)))for(let i of r)(e==null||i.occurrence===e)&&a.push(i.box);let s=sa(a);return s?(z.frame(s),!0):!1}function Um(t){let e=[];for(let s of Array.isArray(t)?t:[]){let n=M?.placements.get(String(s?.occurrence)),r=n?.board?.scene.componentFeatures.get(String(s?.reference)),i=r?n.board.scene.features.get(Number(r.featureId))?.bounds:null;i&&e.push(ia(n.matrix,i))}let a=sa(e);return a?(z.frame(a),!0):!1}var id=.001,Gm=90,wl=["#e5484d","#30a46c","#3e63dd"],yr=["X","Y","Z"];function od(t,e){if(!t||!e)return!1;let a=Ot(t),s=Ot(e),n=[...a.translationMm,...a.rotation],r=[...s.translationMm,...s.rotation];return n.every((i,o)=>Math.abs(i-r[o])<1e-6)}function Km(){return{allowed:!1,enabled:!1,space:"world",target:null,preview:null,drag:null}}function cd(){let t=M.baseDescriptor;return!t||!M.move.target||!M.move.preview?t:Fo(t,M.move.target,M.move.preview)}function Ha(){M.baseDescriptor&&(M.descriptor=cd(),ln({relabel:!1}))}function Dr(){let t=M.move.target;return t?M.baseDescriptor?.occurrences.find(e=>e.path===t)??null:null}function ld(){let t=M.move,e=Dr();return{allowed:t.allowed,enabled:t.enabled,space:t.space,dragging:!!t.drag,target:e?{occurrence:e.path,instanceId:e.instanceId,displayPath:e.displayPath,kind:e.kind,restricted:!!e.restricted,pose:Ot(t.preview??e.pose),source:t.preview?"manual":e.pose?.source??"default",unsaved:!!t.preview}:null}}function rt(t){M.onMove?.({phase:t,...ld()})}function zm(t){M.move.allowed=!!t,!M.move.allowed&&M.move.enabled&&dn(!1)}function dn(t){let e=!!t&&M.move.allowed;e!==M.move.enabled&&(e||ud(),M.move.enabled=e,e&&vn({quiet:!0}),rt("mode"))}function dd(t){M.move.space=t==="local"?"local":"world",rt("mode")}function Lr(){return M.standInKey??Ka()}function vn({quiet:t=!1}={}){if(!M)return;let e=Lr(),a=M.move.enabled&&e!=null?Co(M.baseDescriptor,e)?.path??null:null;a!==M.move.target&&(ud(),M.move.target=a,t||rt("target"))}function ud(){let t=!!M.move.preview;M.move.drag=null,M.move.preview=null,M.move.target=null,t&&Ha()}function Vm(t){M?.move.target&&(M.move.preview=t?Ot(t):null,Ha(),rt("preview"))}function Ur(){!M||!M.move.preview&&!M.move.drag||(M.move.drag=null,M.move.preview=null,Ha(),rt("cancel"))}function Hm(){let t=`${M.move.target}/`,e=sa(M.placed.filter(a=>a.occurrence.path===M.move.target||a.occurrence.path.startsWith(t)).map(a=>a.worldBounds));return e?[0,1,2].map(a=>(e[a]+e[a+3])/2/id):null}function Xs(t){let e=Na(se.matrix,De(t,id),se.viewport);if(!e)return null;let a=D.getBoundingClientRect();return[e.x*a.width/D.width,e.y*a.height/D.height]}function qm(){let t=st;if(!t)return;let e=Dr(),a=M.move.enabled&&e&&se?Hm():null,s=a?Xs(a):null;if(!s){t.toggleAttribute("hidden",!0),M.gizmo=null;return}t.toggleAttribute("hidden",!1),t.firstChild||Xm(t);let{right:n,back:r}=z.basis(),i=Xs(Qe(a,n)),o=i?Math.hypot(i[0]-s[0],i[1]-s[1]):0;if(!(o>1e-6)){t.toggleAttribute("hidden",!0);return}let c=Gm/o,d=M.move.preview??e.pose,b=M.move.space==="local"?Ao(d):er,f=[];b.forEach((p,u)=>{let l=Xs(Qe(a,De(p,c))),y=t.querySelector(`[data-part="t${u}"]`),h=l&&Math.hypot(l[0]-s[0],l[1]-s[1])>12;if(y.style.display=h?"":"none",h){let T=y.querySelector("line");T.setAttribute("x1",s[0]),T.setAttribute("y1",s[1]),T.setAttribute("x2",l[0]),T.setAttribute("y2",l[1]),y.querySelector("circle").setAttribute("cx",l[0]),y.querySelector("circle").setAttribute("cy",l[1]),y.querySelector("text").setAttribute("x",l[0]+9),y.querySelector("text").setAttribute("y",l[1]-7)}let g=Bo(p),x=pt(p,g),v=[];for(let T=0;T<=64;T+=1){let I=T/64*Math.PI*2,S=Xs(Qe(a,De(Qe(De(g,Math.cos(I)),De(x,Math.sin(I))),c*.7)));S&&v.push(`${S[0].toFixed(1)},${S[1].toFixed(1)}`)}t.querySelector(`[data-part="r${u}"]`).setAttribute("points",v.join(" ")),f.push({axis:p,pxPerMm:l?[(l[0]-s[0])/c,(l[1]-s[1])/c]:[0,0]})});let m=t.querySelector('[data-part="pivot"]');m.setAttribute("cx",s[0]),m.setAttribute("cy",s[1]),M.gizmo={center:s,pivot:a,handles:f,back:r}}function Xm(t){let e="http://www.w3.org/2000/svg",a=(s,n)=>{let r=document.createElementNS(e,s);for(let[i,o]of Object.entries(n))r.setAttribute(i,o);return r};wl.forEach((s,n)=>{let r=a("polyline",{"data-part":`r${n}`,class:"ring",stroke:s,fill:"none"}),i=a("title",{});i.textContent=`Rotate about ${yr[n]}`,r.append(i),t.append(r)}),wl.forEach((s,n)=>{let r=a("g",{"data-part":`t${n}`,class:"arrow",stroke:s,fill:s}),i=a("title",{});i.textContent=`Move along ${yr[n]}`;let o=a("text",{stroke:"none"});o.textContent=yr[n],r.append(i,a("line",{}),a("circle",{r:6}),o),t.append(r)}),t.append(a("circle",{"data-part":"pivot",r:4,class:"pivot"})),t.append(a("text",{"data-part":"readout",class:"readout"})),t.addEventListener("pointerdown",Wm),t.addEventListener("pointermove",$m),t.addEventListener("pointerup",Jm),t.addEventListener("pointercancel",()=>fd())}function Wm(t){let e=t.target.closest?.("[data-part]")?.dataset.part;if(!M||!e||!M.gizmo||!/^[tr][012]$/.test(e))return;t.preventDefault(),t.stopPropagation();let a=Dr(),s=st.getBoundingClientRect();M.move.drag={kind:e[0]==="t"?"translate":"rotate",handle:M.gizmo.handles[Number(e[1])],start:[t.clientX-s.left,t.clientY-s.top],startPose:Ot(M.move.preview??a.pose),hadPreview:!!M.move.preview,center:M.gizmo.center,pivot:M.gizmo.pivot,back:M.gizmo.back,changed:!1};try{st.setPointerCapture(t.pointerId)}catch{}}function $m(t){let e=M?.move.drag;if(!e)return;let a=st.getBoundingClientRect(),s=[t.clientX-a.left,t.clientY-a.top],n=t.shiftKey,r,i;if(e.kind==="translate"){let c=tr(Io([s[0]-e.start[0],s[1]-e.start[1]],e.handle.pxPerMm),n?Aa.fineMm:Aa.mm);r=_o(e.startPose,e.handle.axis,c),i=`${c>=0?"+":""}${c.toFixed(n?1:0)} mm`}else{let c=Ro(e.handle.axis,e.back,So(e.center,e.start,s))*180/Math.PI,d=tr(c,n?Aa.fineDeg:Aa.deg);r=No(e.startPose,e.handle.axis,d*Math.PI/180,e.pivot),i=`${d>=0?"+":""}${d.toFixed(0)}\xB0`}e.changed=e.changed||!od(r,e.startPose),M.move.preview=Ot(r);let o=st.querySelector('[data-part="readout"]');o.textContent=i,o.setAttribute("x",s[0]+14),o.setAttribute("y",s[1]-10),Ha(),rt("preview")}function Jm(t){let e=M?.move.drag;e&&(st.hasPointerCapture?.(t.pointerId)&&st.releasePointerCapture(t.pointerId),M.move.drag=null,st.querySelector('[data-part="readout"]').textContent="",e.changed?rt("commit"):e.hadPreview||Ur())}function fd(){let t=M?.move.drag;return t?(M.move.drag=null,M.move.preview=t.hadPreview?t.startPose:null,st.querySelector('[data-part="readout"]').textContent="",Ha(),rt("cancel"),!0):!1}function Ym(t,e){let a=M.move;if(e==="escape"){if($t&&!$t.hidden)$t.hidden=!0;else if(!fd())if(a.preview)Ur();else if(a.enabled)dn(!1);else return!1;return!0}if(e==="m"&&a.allowed)dn(!a.enabled);else if(e==="l"&&a.enabled)dd(a.space==="world"?"local":"world");else if(e==="enter"&&a.preview&&!a.drag)rt("commit");else if(t.key==="?")hd(!!$t?.hidden);else if(e==="a")z.frame(M.bounds||Zt());else return!1;return!0}function hd(t){$t&&($t.hidden=!t)}var xr="http://www.w3.org/2000/svg";function Qm(t){let e=t.occurrence?M.placements.get(t.occurrence):null;if(!e)return null;let a=t.reference&&e.board?e.board.scene.componentFeatures.get(t.reference):null,s=a?e.board.scene.features.get(Number(a.featureId))?.bounds:null;if(s)return Ts(e.matrix,[0,1,2].map(r=>(s[r]+s[r+3])/2));let n=e.worldBounds;return n?[0,1,2].map(r=>(n[r]+n[r+3])/2):null}function Zm(){let t=M.emphasisSets.length>0,e=[],a=[];for(let s of M.showHarnesses?M.harnesses:[]){let n=M.harnessLit.get(Ls(s)),r=Lc(s,n),i=new Map(s.ends.map(c=>[c.id,Qm(c)]));i.set("hub",s.ends.length>2?Uc([...i.values()]):null);let o=s.name||"Harness";for(let c of M.tubedHarnesses.has(Ls(s))?[]:Oc(s)){let d=Dc(c,n),b=document.createElementNS(xr,"line");b.setAttribute("class",`segment${d?" lit":t?" dim":""}`),d&&Object.assign(b.style,{stroke:d,color:d});let f=document.createElementNS(xr,"title");f.textContent=`${o}: ${c.wires.size} wire${c.wires.size===1?"":"s"}`,b.append(f),a.push(b),e.push({node:b,kind:"line",a:i.get(c.a),b:i.get(c.b)})}for(let c of s.ends){let d=r.get(c.id),b=document.createElementNS(xr,"circle");b.setAttribute("class",`end${d?" lit":t?" dim":""}`),b.setAttribute("r",d?"6":"4"),d&&(b.style.fill=d),a.push(b),e.push({node:b,kind:"dot",a:i.get(c.id)})}}sn.replaceChildren(...a),M.harnessDrawn={items:e,matrix:null}}function ey(){if(!sn||!se)return;M.harnessDrawn||Zm();let t=M.harnessDrawn;sn.toggleAttribute("hidden",!t.items.length);let e=se.matrix.join(",");if(t.matrix===e)return;t.matrix=e;let a=D.getBoundingClientRect(),s=a.width/Math.max(1,D.width),n=a.height/Math.max(1,D.height),r=i=>{let o=i?Na(se.matrix,i,se.viewport):null;return o?[o.x*s,o.y*n]:null};for(let i of t.items){let o=r(i.a),c=i.kind==="line"?r(i.b):null,d=i.kind==="line"?!!(o&&c):!!o;i.node.style.display=d?"":"none",d&&(i.kind==="line"?(i.node.setAttribute("x1",o[0].toFixed(1)),i.node.setAttribute("y1",o[1].toFixed(1)),i.node.setAttribute("x2",c[0].toFixed(1)),i.node.setAttribute("y2",c[1].toFixed(1))):(i.node.setAttribute("cx",o[0].toFixed(1)),i.node.setAttribute("cy",o[1].toFixed(1))))}}function ty(){Yt&&(M.labelsDrawn=null,Yt.replaceChildren(...M.placed.map(t=>{let e=document.createElement("div");e.className=`scene-label${t.standIn?` stand-in ${t.standIn}`:""}`;let a=document.createElement("strong");a.textContent=t.occurrence.displayPath||t.occurrence.labels?.join(" / ")||t.occurrence.path,e.append(a);let s=t.standIn?Hs[t.standIn]?.label:"";if(s){let n=document.createElement("span");n.textContent=s,e.append(n)}return t.label=e,e})))}function ay(){if(!Yt||!se)return;if(Yt.hidden=!M.showLabels,!M.showLabels){M.labelsDrawn=null;return}let t=D.getBoundingClientRect(),e=Lr(),a=`${e}|${t.width}x${t.height}|${Array.prototype.join.call(se.matrix,",")}`;if(M.labelsDrawn?.placed===M.placed&&M.labelsDrawn.key===a)return;M.labelsDrawn={placed:M.placed,key:a};let s=t.width/Math.max(1,D.width),n=t.height/Math.max(1,D.height);for(let r of M.placed){if(!r.label)continue;let[i,o,,c,d,b]=r.worldBounds,f=Na(se.matrix,[(i+c)/2,(o+d)/2,b],se.viewport),m=f&&f.x>=0&&f.y>=0&&f.x<=D.width&&f.y<=D.height;r.label.hidden=!m,m&&(r.label.style.transform=`translate(${(f.x*s).toFixed(1)}px, ${(f.y*n).toFixed(1)}px) translate(-50%, -100%)`),r.label.classList.toggle("selected",e===r.occurrence.path)}}function sy(t,e=E){return hi(t,e.scene.copperLayers)}async function bd(t=me,e=E){let a=e.semanticGeometry.assets?.components_glb;if(!a||e.scene.componentTier!=="idle")return;e.scene.componentTier="loading";let s;try{s=await Ra(new URL(a,location.href).toString(),{componentFeatures:e.scene.componentFeatures,fetchBytes:un(e)})}catch(n){throw ge(t)&&(e.scene.componentTier="idle"),n}if(!(!ge(t)||!e.renderer)){e.scene.componentTier="loaded",e.loadedBytes+=s.byteLength;for(let n of s.primitives){let r=e.scene.componentFeatures.get(n.designator);r&&iy(r.featureId,n.position,e)}M&&(M.harnessDrawn=null,M.labelsDrawn=null);for(let[n,r]of s.componentNodeCounts||[])e.scene.componentModelCounts.set(n,r);e.hiddenComponentRequest&&Cd(e.hiddenComponentRequest),e.scene.componentEntries=ss(s.primitives).map(n=>e.renderer.addPrimitive(n,{kind:"component",layerId:0,material:n.material,color:n.material.baseColor}))}}function un(t=E){return t.assetCache?e=>t.assetCache.fetchBytes(e):void 0}function pd(t,e=E){if(!e.renderer||t-(e.tiersCheckedAt||0)<250)return;e.tiersCheckedAt=t;let a=e.renderer.identityOnly&&!e.deferComponents||!e.renderer.identityOnly&&e.renderer.cullCounts.full>0;a&&(e.scene.componentsWantedAt=t),a&&e.scene.componentTier==="idle"&&e.semanticGeometry.assets?.components_glb&&bd(me,e).then(()=>{M&&e.renderer&&e.scene.componentTier==="loaded"&&Tr(e.scene.runtimeBounds,e)}).catch(n=>console.warn("Failed to load components",n));let s=()=>M?M.scene.gpuMemoryBytes():e.renderer.gpuMemoryBytes();e.gpuBytes=s(),!(e.gpuBytes<=w.gpuBudgetBytes)&&(e.scene.componentTier==="loaded"&&t-e.scene.componentsWantedAt>sm&&(e.renderer.removeEntries(e.scene.componentEntries),e.scene.componentEntries=[],e.scene.componentTier="idle",e.scene.componentEvictions+=1,e.gpuBytes=s()),e.gpuBytes>w.gpuBudgetBytes&&zl(e.visibleTileIds||new Set,Math.max(0,e.residentTileGpuBytes-(e.gpuBytes-w.gpuBudgetBytes)),e))}var vl=4e-4,Ml=5e-5,ny={baseColor:[.62,.7,.8,1],metallic:0,roughness:.8,emissive:[0,0,0]};function Tr(t,e=E){if(!e.renderer)return;let a=new Map;for(let i of e.topology.physical_objects||[])i.kind==="footprint_body"&&i.designator&&i.bbox_mm?.length===4&&a.set(i.designator,i);let s=(t?.[5]??8e-4)+Ml,n=(t?.[2]??-8e-4)-Ml,r=[];for(let i of e.scene.componentFeatures.values()){let o=Number(i.featureId),c=e.scene.features.get(o),d=a.get(i.designator);if(!c||c.bounds||!d)continue;let[b,f,m,p]=d.bbox_mm.map(Number),u=String(d.layer||"").startsWith("B."),l=[b/1e3,-p/1e3,u?n-vl:s,m/1e3,-f/1e3,u?n:s+vl];c.bounds=l,c.placeholder=!0,r.push(ry(l,o))}if(r.length)for(let i of ss(r))e.renderer.addPrimitive(i,{kind:"component",layerId:0,material:i.material,color:i.material.baseColor,opacityScale:.3,translucent:!0,placeholder:!0})}function ry([t,e,a,s,n,r],i){let o=[[[0,0,1],[[t,e,r],[s,e,r],[s,n,r],[t,n,r]]],[[0,0,-1],[[t,n,a],[s,n,a],[s,e,a],[t,e,a]]],[[1,0,0],[[s,e,a],[s,n,a],[s,n,r],[s,e,r]]],[[-1,0,0],[[t,n,a],[t,e,a],[t,e,r],[t,n,r]]],[[0,1,0],[[s,n,a],[t,n,a],[t,n,r],[s,n,r]]],[[0,-1,0],[[t,e,a],[s,e,a],[s,e,r],[t,e,r]]]],c=new Float32Array(72),d=new Float32Array(72),b=new Uint32Array(36);return o.forEach(([f,m],p)=>{m.forEach((l,y)=>{c.set(l,(p*4+y)*3),d.set(f,(p*4+y)*3)});let u=p*4;b.set([u,u+1,u+2,u,u+2,u+3],p*6)}),{position:c,normal:d,netId:new Uint32Array(24),objectFeatureId:new Uint32Array(24).fill(i),indices:b,material:ny,bounds:[t,e,a,s,n,r]}}function iy(t,e,a=E){let s=a.scene.features.get(Number(t));if(!s||!e.length)return;let n=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let r=0;r<e.length;r+=3)n[0]=Math.min(n[0],e[r]),n[1]=Math.min(n[1],e[r+1]),n[2]=Math.min(n[2],e[r+2]),n[3]=Math.max(n[3],e[r]),n[4]=Math.max(n[4],e[r+1]),n[5]=Math.max(n[5],e[r+2]);s.bounds=s.bounds?[Math.min(s.bounds[0],n[0]),Math.min(s.bounds[1],n[1]),Math.min(s.bounds[2],n[2]),Math.max(s.bounds[3],n[3]),Math.max(s.bounds[4],n[4]),Math.max(s.bounds[5],n[5])]:n}function Mn(t,e=E){return li(t,e.scene.copperLayers)}var oy=[.55,.35,.16,.78];function gd(t=E){return ui(t.topology?.board?.stackup?.copper_finish)}function md(t,e=E){return fi(t,e.scene.copperLayers)}var cy=.25;function ga(){return!w.realisticColors||w.mode==="layer"?0:1-re(w.separation/cy,0,1)}function yd(t,e=E){let a=md(t,e)?gd(e):Ma.copper;return xd(Mn(t,e),a,ga())}function xd(t,e,a){return t.map((s,n)=>s+(e[n]-s)*a)}function ly(t,e=me){if(e===me&&M&&z){Rm(t,e);return}if(e!==me||!E.renderer||!z)return;let a=performance.now(),s=Math.max(0,t-Lt);if(w.workspace==="schematic"&&N){Lt=t;let d=N.visiblePages(),b=Y?by(d):[];N.setDomDetailPageIds(b.map(f=>f.id)),P.visiblePages=N.render(),Y?.syncWorldPages(b,N,{activeNetUid:P.activeNetUid}),Kd(),Ir(s,performance.now()-a),Sr(t),Ga(e);return}let n=Math.min(.05,(t-Lt)/1e3);Lt=t,z.update(n),E.renderer.resize();let r=Md();E.scene.copperRealism!==ga()&&Wa();for(let d of E.renderer.entries)d.layerOffset=r[d.layerId]||0;py(t),Qt=Ed(t);let i=my(t);se={layerId:0,viewport:{x:0,y:0,width:D.width,height:D.height},matrix:z.matrix(D.width,D.height,w.mode==="layer"),lod:Xl(D.height,w.mode==="layer")},E.renderer.selectedOccurrence=w.selectedFeatureId||w.activeNetId?w.selectedOccurrence:-1,E.renderer.setInnerCopperAtFull(w.showBoard&&w.separation<=.001&&!pa().size),ye(t);let o=w.mode==="3d"?E.visible3dLayers:Ul(),c={panels:[se],activeNetId:w.activeNetId,selectedFeatureId:w.selectedFeatureId,time:t/1e3,layerOffsets:r,visibleLayers:o,showBoard:w.showBoard,showComponents:w.showComponents,showPaste:w.separation===0,componentOpacity:re(1-w.separation/.1,0,1),boardOpacity:pa().size?.34:1-w.separation*.72,isolateNet:w.isolateNet,compareMode:w.mode==="layer",compareOffsets:Qt,layerAlphas:i,visibleTileIds:w.mode==="3d"?E.visibleTileIds:null};dy(t,c)&&(E.renderer.render(c),Ud(),jy()),pd(t),Ir(s,performance.now()-a),Sr(t),Ga(e)}var wd=1e3,tt={key:"",matrix:new Float32Array(16),tiles:null,at:0};function dy(t,e){let a=e.panels[0].matrix,s=!1;for(let o=0;o<16;o+=1)if(a[o]!==tt.matrix[o]){s=!0;break}if(s)return tt.matrix.set(a),tt.key="",tt.at=t,!0;let n=[D.width,D.height,E.renderer.version,E.renderer.selectedOccurrence,w.workspace,w.mode,e.activeNetId,e.selectedFeatureId,e.showBoard,e.showComponents,e.showPaste,e.componentOpacity,e.boardOpacity,e.isolateNet,E.scene.layerZOffsetSignature,[...e.visibleLayers].join(","),[...e.compareOffsets].map(([o,c])=>`${o}:${c}`).join(";"),e.layerAlphas?[...e.layerAlphas].join(";"):""].join("|");return!!(e.activeNetId||e.selectedFeatureId||E.renderer.emphasizedNetIds.size)||n!==tt.key||!vd(e.visibleTileIds,tt.tiles)||t-tt.at>wd?(tt.key=n,tt.tiles=e.visibleTileIds,tt.at=t,!0):!1}var uy=1e3/30-2,je={scene:null,key:"",matrix:new Float32Array(16),tiles:new Map,at:0};function fy(t,e,a){let s=se.matrix,n=!1;for(let m=0;m<16;m+=1)if(s[m]!==je.matrix[m]){n=!0;break}if(je.scene!==M.scene&&(je.scene=M.scene,n=!0),n)return je.matrix.set(s),je.key="",je.at=t,!0;let r=[D.width,D.height,w.showBoard,w.showComponents,w.isolateNet,w.activeNetId,w.selectedFeatureId,w.selectedOccurrence,M.showLabels,a,ga(),Lr(),M.scene.tubeVersion];for(let m of M.scene.renderers){let p=e.get(m);r.push(m.version,m.occurrenceCount,m.selectedOccurrence,m.dimCopper,m.standIn?m.boxColor.join(","):"",p?[...p.visibleLayers].join(","):"",p?.layerOffsets?Array.prototype.join.call(p.layerOffsets,","):"")}let i=r.join("|"),o=!1;for(let[m,p]of e)vd(p.visibleTileIds,je.tiles.get(m))||(o=!0);let c=!!(a||w.activeNetId||w.selectedFeatureId),d=o||i!==je.key,b=c&&t-je.at>=uy;return d||b||t-je.at>wd?(je.key=i,je.tiles=new Map([...e].map(([m,p])=>[m,p.visibleTileIds])),je.at=t,!0):!1}function vd(t,e){if(!t||!e)return t===e;if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function hy(t){if(!N||!t)return{widthPx:0,heightPx:0,sourcePxPerMm:0,area:0};let e=N.pagePixelWidth(t),a=t.heightMm/Math.max(1e-6,N.scale),s=N.pageSourcePixelsPerMm(t);return{widthPx:e,heightPx:a,sourcePxPerMm:s,area:e*a}}function by(t){if(!Y||!N)return[];let e=t||[],a=Math.max(1,Ie.clientWidth*Ie.clientHeight);return e.map(r=>({page:r,...hy(r)})).filter(r=>r.widthPx>=760&&r.heightPx>=520&&r.area>=a*.36&&r.sourcePxPerMm>=1.25).sort((r,i)=>i.area-r.area).slice(0,1).map(r=>r.page)}function Md(t=E){let e=Zt(t),a=Math.hypot((e[3]-e[0])*1e3,(e[4]-e[1])*1e3),s=w.separation*w.separation*re(a*.12,8,25)/1e3,n=`${w.separation}:${s}:${t.scene.copperLayers.length}`;if(t.scene.layerZOffsetSignature===n)return t.scene.layerZOffsets;let r=t.scene.layerZOffsets;r.fill(0);let i=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((o,c)=>{r[Number(o.id)]=(i-c)*s}),t.scene.layerZOffsetSignature=n,r}function Ed(t){if(w.mode!=="layer")return we.key="3d",we.current.clear(),new Map;let e=E.scene.copperLayers.filter(y=>E.compareLayers.has(Number(y.id))),a=Math.max(1,e.length),s=D.width/Math.max(1,D.height),n=1;a===2?n=s>=1?2:1:a===3||a===4?n=2:a>4&&(n=Math.ceil(Math.sqrt(a*s)));let r=Math.ceil(a/n),i=Zt(),o=i[3]-i[0],c=i[4]-i[1],d=o*1.18,b=c*1.22,f=e.map((y,h)=>{let g=h%n,x=Math.floor(h/n);return{layer:y,layerId:Number(y.id),column:g,row:x,offset:[(g-(n-1)/2)*d,((r-1)/2-x)*b,0]}}),m=`${n}x${r}:${f.map(y=>y.layerId).join(",")}`;if(m!==we.key){we.key=m,we.started=t,we.from=new Map(we.current);let y=n*o+(n-1)*(d-o),h=r*c+(r-1)*(b-c);z.targetFocus=[(i[0]+i[3])/2,(i[1]+i[4])/2,(i[2]+i[5])/2],z.targetOrthoScale=Math.max(h,y/s)*1.08}let p=re((t-we.started)/420,0,1),u=1-Math.pow(1-p,3),l=new Map;for(let y of f){let h=we.from.get(y.layerId)||[0,0,0],g=y.offset.map((x,v)=>h[v]+(x-h[v])*u);l.set(y.layerId,g),we.current.set(y.layerId,g)}if(q.phase==="reveal")for(let y of q.previous)l.has(Number(y))||l.set(Number(y),q.previousOffsets.get(Number(y))||[0,0,0]);for(let y of[...we.current.keys()])f.some(h=>h.layerId===y)||we.current.delete(y);return l}function qa(t){let e=new Set([...t].map(Number));if(!(El(e,E.desiredCompareLayers)&&q.phase!=="idle")){if(E.desiredCompareLayers=e,El(e,E.compareLayers)){q.phase="idle",q.previous.clear(),q.target.clear();return}q.phase="preload",q.previous=new Set(E.compareLayers),q.target=new Set(e),q.previousOffsets=new Map(we.current),q.started=performance.now(),ye(q.started,{force:!0})}}function Gr({snap:t=!0}={}){w.mode="layer";let e=gm();E.desiredCompareLayers=new Set(e),!E.compareLayers.size&&e.size&&(E.compareLayers=new Set(e)),q.phase="idle",q.previous.clear(),q.target.clear(),we.key="",z.setAxis("z",!1),E.renderer?.resize(),Qt=Ed(performance.now()),t&&z.snap(),ye(performance.now(),{force:!0})}function py(t){if(!(w.mode!=="layer"||q.phase==="idle")){if(q.phase==="preload"){if(!gy(q.target)){ye(t,{force:!0});return}q.phase="reveal",q.started=t,q.previousOffsets=new Map(we.current),E.compareLayers=new Set(q.target),we.key="";return}q.phase==="reveal"&&t-q.started>=Il&&(E.compareLayers=new Set(q.target),q.phase="idle",q.previous.clear(),q.target.clear(),q.previousOffsets.clear(),ye(t,{force:!0}))}}function gy(t,e=E){for(let a of e.scene.tiles.values())if(t.has(Number(a.layerId))&&!e.scene.residentTiles.has(a.id)&&!e.scene.failed.has(a.id))return!1;return!0}function my(t){if(w.mode!=="layer"||q.phase!=="reveal")return null;let e=re((t-q.started)/Il,0,1),a=e*e*(3-2*e),s=new Map;for(let n of q.previous)s.set(Number(n),q.target.has(Number(n))?1:1-a);for(let n of q.target)s.set(Number(n),q.previous.has(Number(n))?1:a);return s}function El(t,e){if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function Kr(){if(w.workspace==="schematic"){xy();return}if(w.workspace==="bom"){yy();return}if(w.workspace==="stackup")return;bn.textContent=E.viewerReadiness.stage==="semantic-ready"?"Semantic GLTF A0":"Prism staged 3D",pn.textContent="Layers",gn.textContent="Visibility and compare",$('[data-panel="search"] .section-heading span').textContent="Nets, components and pins",$('[data-panel="view"] .section-heading span').textContent="Camera and stackup";let t=`
    <div class="mode-toolbar">
      <button data-mode="layer">PCB</button>
      <button data-mode="3d">3D</button>
    </div>`;ha&&(ha.innerHTML=t),Xe.innerHTML=`
    ${ha?"":t}
    <div class="layer-presets">
      <button data-preset="all">All</button><button data-preset="none">None</button>
      <button data-preset="outer">Outer</button><button data-preset="inner">Inner</button>
    </div>
    <div class="layer-list"></div>`,be.innerHTML=`
    <label class="control-field"><span>Search</span>
      <input id="entity-search" class="layer-select" type="search" placeholder="Net, component or pin">
      <div id="search-results" class="search-results"></div>
    </label>
    <div class="quick-actions">
      <button id="frame-selection">Frame</button>
      <button id="show-net-layers">Net layers</button>
      <button id="isolate-net" aria-keyshortcuts="I" title="Toggle isolated net view (I)">Isolate</button>
      <button id="clear-selection">Clear</button>
    </div>`,Ce.innerHTML=`
    <div class="toggle-list">
      <label class="toggle-row"><input id="show-board" type="checkbox"><span>Board substrate</span></label>
      <label class="toggle-row"><input id="show-components" type="checkbox"><span>Components</span></label>
    </div>
    <label class="control-field range-field"><span>Stackup separation</span>
      <input id="separation" type="range" min="0" max="1" step="0.002">
    </label>`,Re(),ky()}function yy(){bn.textContent="BoM A0",pn.textContent="Bill of Materials",gn.textContent="Grouped procurement view",$('[data-panel="search"] .section-heading span').textContent="Search inside the BoM table",$('[data-panel="view"] .section-heading span').textContent="BoM actions";let t=We?.payload?.counts||{};Xe.innerHTML=`
    <div class="selection-properties">
      <div class="selection-property"><small>Rows</small><strong>${t.rows||0}</strong></div>
      <div class="selection-property"><small>Components</small><strong>${t.components||0}</strong></div>
      <div class="selection-property"><small>DNP</small><strong>${t.dnpComponents||0}</strong></div>
    </div>
    <div class="selection-section">
      <span class="selection-section-title">Columns</span>
      <div class="selection-empty">Primary procurement and thermal columns are shown first. Additional symbol and footprint metadata is available in the row detail panel.</div>
    </div>`,be.innerHTML=`
    <div class="selection-empty">Use the BoM search box in the main view. Reference chips update the shared PCB and schematic selection without changing workspaces.</div>
    <div class="quick-actions">
      <button id="clear-selection">Clear</button>
    </div>`,Ce.innerHTML=`
    <div class="selection-section">
      <span class="selection-section-title">Cross-probing</span>
      <div class="selection-table">
        <div class="selection-row"><span><strong>PCB/Schematic</strong></span><span>Select component</span><span>Highlights matching BoM row</span></div>
        <div class="selection-row"><span><strong>BoM reference</strong></span><span>Click chip</span><span>Holds component selection for PCB and schematic</span></div>
      </div>
    </div>`,be.querySelector("#clear-selection")?.addEventListener("click",Fe)}function xy(){bn.textContent=Y?"Schematic SVG DOM":P.manifest?.schema==="prism.schematic_vector_a0"?"Schematic Vector A0":"Schematic World A0",pn.textContent="Pages",gn.textContent=`${P.pages.length} hierarchy instances`,$('[data-panel="search"] .section-heading span').textContent="Pages, nets and components",$('[data-panel="view"] .section-heading span').textContent="World navigation",Xe.innerHTML=`
    <div class="layer-presets">
      <button data-page-action="world">Fit world</button>
      <button data-page-action="parent">Parent</button>
      <button data-page-action="previous">Previous</button>
      <button data-page-action="next">Next</button>
    </div>
    <div class="page-list">${P.pages.map(t=>`
      <button class="page-row ${t.id===w.selectedPageId?"active":""}" data-page="${t.id}">
        <span>${t.sheetNumber}</span>
        <strong>${G(t.name)}</strong>
        <small>L${t.depth}</small>
      </button>`).join("")}</div>`,be.innerHTML=`
    <label class="control-field"><span>Search</span>
      <input id="entity-search" class="layer-select" type="search" placeholder="Page, net or component">
      <div id="search-results" class="search-results"></div>
    </label>
    <div class="quick-actions">
      <button id="frame-selection">Frame</button>
      <button id="clear-selection">Clear</button>
    </div>`,Ce.innerHTML=`
    <div class="toggle-list">
      <label class="toggle-row"><input id="show-hierarchy" type="checkbox" checked><span>Hierarchy links</span></label>
    </div>
    <div class="selection-section">
      <span class="selection-section-title">Navigation</span>
      <div class="selection-table">
        <div class="selection-row"><span><strong>Home</strong></span><span>World</span><span>Frame every page</span></div>
        <div class="selection-row"><span><strong>[ / ]</strong></span><span>Pages</span><span>Previous or next instance</span></div>
        <div class="selection-row"><span><strong>Alt+Up</strong></span><span>Parent</span><span>Move up hierarchy</span></div>
      </div>
    </div>`,Xe.querySelectorAll("[data-page]").forEach(t=>{t.addEventListener("click",()=>ht(t.dataset.page,!0))}),Xe.querySelectorAll("[data-page-action]").forEach(t=>{t.addEventListener("click",()=>Ys(t.dataset.pageAction))}),be.querySelector("#entity-search").addEventListener("input",t=>{vy(t.target.value)}),be.querySelector("#frame-selection").addEventListener("click",Id),be.querySelector("#clear-selection").addEventListener("click",Xa),Ce.querySelector("#show-hierarchy").checked=N?.showHierarchy??!0,Ce.querySelector("#show-hierarchy").addEventListener("change",t=>{N.showHierarchy=t.target.checked})}function ht(t,e){let a=P.byId.get(t);!a||!N||(w.selectedPageId=a.id,w.selectedSchematicFeature=null,N.selectedPageId=a.id,N.selectedFeatureId=0,nt.textContent=JSON.stringify(a,null,2),e&&N.framePage(a),Xe.querySelectorAll("[data-page]").forEach(s=>{s.classList.toggle("active",s.dataset.page===a.id)}))}function Ys(t){if(!N)return;if(t==="world"){N.frameWorld();return}let e=Math.max(0,P.pages.findIndex(s=>s.id===w.selectedPageId)),a=null;t==="previous"?a=P.pages[(e-1+P.pages.length)%P.pages.length]:t==="next"?a=P.pages[(e+1)%P.pages.length]:t==="parent"&&(a=P.byId.get(P.pages[e]?.parentId)),a&&ht(a.id,!0)}function wy(t){if(!t||!N)return;if(Xa(),t.kind==="page"&&t.pageId){ht(t.pageId,!0);return}if(t.kind!=="sheet")return;let e=P.pages.find(r=>r.sheetInstancePath===t.sheetInstancePath)||P.byId.get(w.selectedPageId),a=String(t.sheetFile||t.feature?.sheet_file||"").replace(/\\/g,"/"),s=String(t.sheetName||t.feature?.sheet_name||t.feature?.objectId||""),n=P.pages.find(r=>{if(e&&r.parentId&&r.parentId!==e.id)return!1;let i=String(r.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&r.name===s})||P.pages.find(r=>{let i=String(r.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&r.name===s});n&&ht(n.id,!0)}function vy(t){let e=be.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=P.pages.filter(r=>`${r.name} ${r.sheetPath}`.toLowerCase().includes(a)).slice(0,8),n=E.scene.nets.filter(r=>String(r.name).toLowerCase().includes(a)).slice(0,8);e.innerHTML=[...s.map(r=>`<button data-page="${r.id}"><b>${G(r.name)}</b><span>Page ${r.sheetNumber}</span></button>`),...n.map(r=>`<button data-schematic-net="${r.id}"><b>${G(r.name)}</b><span>${(P.manifest.netToPages?.[r.uid]||[]).length} pages</span></button>`)].join(""),e.querySelectorAll("[data-page]").forEach(r=>{r.addEventListener("click",()=>ht(r.dataset.page,!0))}),e.querySelectorAll("[data-schematic-net]").forEach(r=>{r.addEventListener("click",()=>Td(Number(r.dataset.schematicNet),!0))})}function Td(t,e){let a=E.scene.nets.find(n=>Number(n.id)===t);if(!a||!N)return;w.activeNetId=t,w.selectedFeatureId=0,w.selectedSchematicFeature=null,N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId="",P.activeNetUid=a.uid,N.activeNetUid=a.uid,Y?.setHighlightedNet(a.uid),nt.textContent=JSON.stringify(a,null,2),Ge();let s=P.manifest.netToPages?.[a.uid]||[];e&&s.length&&ht(s[0],!0)}function kd(t,e=null){let a=E.scene.nets.find(s=>s.uid===t);a&&(w.activeNetId=Number(a.id),P.activeNetUid=a.uid,N&&(N.activeNetUid=a.uid,N.selectedFeatureId=Number(e?.feature?.id||e?.featureId||0),N.selectedFeatureKey=e?.feature?.stableKey||e?.featureKey||"",N.selectedSourceId=e?.feature?.sourceId||e?.sourceId||""),Y?.setHighlightedNet(a.uid),e&&(w.selectedSchematicFeature={...e,pageId:w.selectedPageId}),nt.textContent=JSON.stringify(e?{...e,net:a}:a,null,2),Ge())}function Xa(){w.activeNetId=0,w.selectedFeatureId=0,w.selectedSchematicFeature=null,P.activeNetUid="",N&&(N.activeNetUid="",N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId=""),Y?.setSelection(null),Y?.setHighlightedNet(""),nt.textContent="No object selected",Ge()}function Id(){let t=P.byId.get(w.selectedPageId);t?N.framePage(t):N.frameWorld()}function My(t){w.selectedPageId=t.sheetInstancePath&&P.pages.find(s=>s.sheetInstancePath===t.sheetInstancePath)?.id||w.selectedPageId,w.selectedFeatureId=0,w.selectedSchematicFeature={...t,pageId:w.selectedPageId},t.anchor&&(w.selectionAnchor=t.anchor),N&&(N.selectedPageId=w.selectedPageId,N.selectedFeatureId=Number(t.feature?.id||0));let e=t.netUid?E.scene.nets.find(s=>s.uid===t.netUid):null,a=t.reference?E.scene.componentFeatures.get(t.reference):null;a&&(w.selectedFeatureId=Number(a.featureId||0),We?.setSelectionByReference(t.reference,{scroll:w.workspace==="bom"})),nt.textContent=JSON.stringify({...t,net:e,component:a},null,2),Ge()}function Ey(t){let{page:e,feature:a}=t;if(!a){w.selectedSchematicFeature=null,N.selectedFeatureId=0,ht(e.id,!1),Ge();return}let s=Number(a.id||0);if(w.selectedPageId=e.id,N.selectedPageId=e.id,N.selectedFeatureId=s,w.selectedSchematicFeature={...a,pageId:e.id},w.selectionAnchor=null,a.netUid){let n=E.scene.nets.find(r=>r.uid===a.netUid);if(n){Td(Number(n.id),!1),w.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}if(a.reference){let n=E.scene.componentFeatures.get(a.reference);if(n){Kt(Number(n.featureId),!1),w.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}w.activeNetId=0,w.selectedFeatureId=0,N.activeNetUid="",nt.textContent=JSON.stringify({page:e.name,...a},null,2),Ge()}function ta(){let t=w.isolateNet,e=be?.querySelector?.("#isolate-net");e?.classList.toggle("active",t),e?.setAttribute("aria-pressed",String(t));let a=Z?.querySelector?.("[data-action=isolate]");a?.classList.toggle("active",t),a?.setAttribute("aria-pressed",String(t));let s=Ce?.querySelector?.("#show-board");s&&(s.checked=w.showBoard);let n=Ce?.querySelector?.("#show-components");n&&(n.checked=w.showComponents),Ut()}function Ty(){let t=new Set;for(let e of pa())for(let a of zr(e))t.add(a);return t}function zr(t,e=E){let a=new Set,s=e.scene.nets.find(r=>Number(r.id)===Number(t)),n=new Set(e.scene.copperLayers.map(r=>Number(r.id)));for(let r of Object.keys(s?.layerBoundsMm||{})){let i=Number(r);n.has(i)&&a.add(i)}if(!a.size){let r=new Map(e.scene.copperLayers.map(i=>[i.name,Number(i.id)]));for(let i of s?.metrics?.layers||[]){let o=r.get(i);o!=null&&a.add(o)}}if(a.size)return a;for(let r of e.scene.tiles.values())Hl(r,t)&&a.add(Number(r.layerId));return a}function ea(){if(M){for(let e of $e())wn(e);return}let t=Ty();t.size&&(E.visible3dLayers=new Set(t),w.mode==="layer"?qa(t):(E.compareLayers=new Set(t),E.desiredCompareLayers=new Set(t)),ye(performance.now(),{force:!0}))}function Gt(t){let e=!!(t&&ft()),a=w.isolateNet;if(e&&!w.isolateNet&&!M&&(E.preIsolation3dLayers=new Set(E.visible3dLayers),E.preIsolationCompareLayers=new Set(E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers)),w.isolateNet=e,M)ea();else if(w.isolateNet)ea();else if(E.preIsolation3dLayers||E.preIsolationCompareLayers){if(E.preIsolation3dLayers&&(E.visible3dLayers=new Set(E.preIsolation3dLayers)),E.preIsolationCompareLayers){let s=new Set(E.preIsolationCompareLayers);w.mode==="layer"?qa(s):(E.compareLayers=s,E.desiredCompareLayers=new Set(s))}E.preIsolation3dLayers=null,E.preIsolationCompareLayers=null,ye(performance.now(),{force:!0})}e&&!a?(w.preIsolationShowBoard=w.showBoard,w.showBoard=!1):!e&&a&&(typeof w.preIsolationShowBoard=="boolean"&&(w.showBoard=w.preIsolationShowBoard),w.preIsolationShowBoard=null),ta(),Re()}function Re(){(ha||Xe).querySelectorAll("[data-mode]").forEach(a=>{let s=a.dataset.mode===w.mode;a.classList.toggle("active",s),a.setAttribute("aria-pressed",String(s))}),Ce.querySelector("#show-board").checked=w.showBoard,Ce.querySelector("#show-components").checked=w.showComponents,Ce.querySelector("#separation").value=w.separation;let t=Xe.querySelector(".layer-list"),e=w.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;t.innerHTML=E.scene.copperLayers.map((a,s)=>`
    <label class="layer-row">
      <input type="checkbox" data-layer="${a.id}" ${e.has(Number(a.id))?"checked":""}>
      <span class="swatch" style="background:${Qr(Mn(a))}"></span>
      <span>${G(a.name)}</span><small>${s+1}</small>
    </label>`).join(""),t.querySelectorAll("[data-layer]").forEach(a=>a.addEventListener("change",()=>{Vr(Number(a.dataset.layer),a.checked)})),ta()}function Sd(t){t==="layer"?Gr():(w.mode="3d",z.frame(Zt()),z.snap(),E.visibleTileIds=new Set,ye(performance.now(),{force:!0})),Re()}function Vr(t,e,a=null){if(M){let s=Number(t);Pr(a==null?null:[a],n=>e?n.delete(s):n.add(s));return}if(w.mode==="3d")e?E.visible3dLayers.add(t):E.visible3dLayers.delete(t),ye(performance.now(),{force:!0});else{let s=new Set(E.desiredCompareLayers);e?s.add(t):s.delete(t),qa(s)}Re()}function Hr(t,e=null){if(M){Pr(e==null?null:[e],(s,n)=>{let r=n?.scene.copperLayers||[];s.clear(),r.forEach((i,o)=>{t==="all"||t==="outer"&&(o===0||o===r.length-1)||t==="inner"&&o>0&&o<r.length-1||s.add(Number(i.id))})});return}let a=w.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let[s,n]of E.scene.copperLayers.entries())(t==="all"||t==="outer"&&(s===0||s===E.scene.copperLayers.length-1)||t==="inner"&&s>0&&s<E.scene.copperLayers.length-1)&&a.add(Number(n.id));w.mode==="3d"?ye(performance.now(),{force:!0}):qa(a),Re()}function qr(t){w.showBoard=!!t,w.savedShowBoard=w.showBoard,w.showBoard&&w.isolateNet?Gt(!1):ta()}function Xr(t){w.showComponents=!!t,w.savedShowComponents=w.showComponents,ta()}function Rd(t){w.showPlaceholders=!!t;for(let e of M?$e():[E])e.renderer?.setPlaceholdersVisible(w.showPlaceholders);Ut()}function Ad(t){w.realisticColors=!!t,Wa(),Ut()}function Wa(t=E){if(!t.renderer)return;let e=new Map(t.scene.layers.map(a=>[Number(a.id),a]));for(let a of t.renderer.entries)a.kind==="copper"&&(a.color=yd(e.get(Number(a.layerId)),t));t.renderer.setBarrelColor(xd(oy,[...gd(t).slice(0,3),.78],ga())),t.scene.copperRealism=ga()}function Wr(t,e=null){if(M){Om(re(Number(t)||0,0,1),e);return}w.separation=re(Number(t)||0,0,1),Ut()}function ky(){(ha||Xe).querySelectorAll("[data-mode]").forEach(e=>e.addEventListener("click",()=>{Sd(e.dataset.mode)})),Xe.querySelectorAll("[data-preset]").forEach(e=>e.addEventListener("click",()=>{Hr(e.dataset.preset)})),Ce.querySelector("#show-board").addEventListener("change",e=>{qr(e.target.checked)}),Ce.querySelector("#show-components").addEventListener("change",e=>{Xr(e.target.checked)}),Ce.querySelector("#separation").addEventListener("input",e=>{Wr(e.target.value)}),be.querySelector("#clear-selection").addEventListener("click",Fe),be.querySelector("#isolate-net").addEventListener("click",()=>{Gt(!w.isolateNet)}),be.querySelector("#frame-selection").addEventListener("click",Jr),be.querySelector("#show-net-layers").addEventListener("click",En);let t=be.querySelector("#entity-search");t.addEventListener("input",()=>Nd(t.value))}function _d(){Jt(".rail-tab").forEach(t=>t.addEventListener("click",()=>{let e=t.dataset.tab,a=w.activeTab===e&&!ut.classList.contains("panel-collapsed");w.activeTab=e,ut.classList.toggle("panel-collapsed",a),Jt(".rail-tab").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.tab===e)}),Jt(".tab-panel").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.panel===e)})}))}function En(){if(M){Fm();return}let t=E.scene.nets.find(s=>Number(s.id)===w.activeNetId);if(!t)return;let e=new Set(t.metrics?.layers||[]),a=w.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let s of E.scene.copperLayers)e.has(s.name)&&a.add(Number(s.id));w.mode==="3d"?ye(performance.now(),{force:!0}):qa(a),Re()}function Nd(t){let e=be.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=E.scene.nets.filter(r=>String(r.name).toLowerCase().includes(a)).slice(0,8),n=[...E.scene.componentFeatures.values()].filter(r=>!E.hiddenComponents.has(String(r.designator||""))&&`${r.designator} ${r.value} ${r.footprint}`.toLowerCase().includes(a)).slice(0,6);e.innerHTML=[...s.map(r=>`<button data-net="${r.id}"><b>${G(r.name)}</b><span>${G(r.netClass||"")}</span></button>`),...n.map(r=>`<button data-feature="${r.featureId}"><b>${G(r.designator)}</b><span>${G(r.value)}</span></button>`)].join(""),e.querySelectorAll("[data-net]").forEach(r=>{r.addEventListener("click",()=>ma(Number(r.dataset.net),!0))}),e.querySelectorAll("[data-feature]").forEach(r=>{r.addEventListener("click",()=>Kt(Number(r.dataset.feature),!0))})}function ma(t,e){e&&(w.selectionAnchor=null),w.activeNetId=t,w.selectedFeatureId=0;let a=E.scene.nets.find(s=>Number(s.id)===t);w.workspace==="schematic"&&a&&N&&(P.activeNetUid=a.uid,N.activeNetUid=a.uid),xn(),nt.textContent=JSON.stringify(a||{},null,2),Ge(),w.isolateNet&&ea(),e&&a?.boundsMm&&z.frame(Cr(Ea(a.boundsMm))),ye(performance.now(),{force:!0}),yn(Ol(a))}function Kt(t,e=!1){let a=E.scene.features.get(t);if(a?.kind==="component"&&rs(ya(a),E.hiddenComponents))return;e&&(w.selectionAnchor=null),w.selectedFeatureId=t,w.activeNetId=Number(a?.netId||0);let s=ya(a);s&&We?.setSelectionByReference(s,{scroll:w.workspace==="bom"});let n=Pl(a);n?.kind==="net"?xn():Dl(),nt.textContent=a?JSON.stringify(a,null,2):"No object selected",Ge(),w.isolateNet&&w.activeNetId&&ea(),e&&a?.bounds&&$r(a),ye(performance.now(),{force:!0}),yn(n)}function Tn(t,e=!1){if(rs(t,E.hiddenComponents))return;let a=E.scene.componentFeatures.get(t);if(We?.setSelectionByReference(t,{scroll:w.workspace==="bom"}),!a?.featureId)return;Dl(),Kt(Number(a.featureId),!1);let s=Sy(t);if(s){let{page:n,feature:r}=s;w.selectedPageId=n.id,w.selectedSchematicFeature={...r,pageId:n.id},N&&(N.selectedPageId=n.id,N.selectedFeatureId=Number(r.id||0)),Y?.setSelection?.({kind:"component",featureKey:r.stableKey||"",sheetInstancePath:r.sheetInstancePath||n.sheetInstancePath||"",sourceId:r.sourceId||r.uuid||"",reference:t,feature:r,pageId:n.id}),e&&w.workspace==="schematic"&&(ht(n.id,!0),Y?.frameSelection?.())}if(e&&w.workspace==="pcb"){let n=E.scene.features.get(Number(a.featureId));n?.bounds&&$r(n,!0)}Ge()}function ya(t){return t?.designator||t?.reference||t?.componentDesignator||""}function Iy(t=E){return bi(t.scene.manifest?.components||[],t.scene.componentModelCounts)}function Cd(t){E.hiddenComponentRequest=t;let e=pi(t,Iy());E.hiddenComponents=e.hiddenReferences,E.renderer?.setHiddenFeatureIds(e.hiddenFeatureIds),e.ambiguous.length&&console.warn(`[prism-semantic-viewer] keeping ambiguous components visible: ${e.ambiguous.join(", ")}`),e.unknown.length&&console.warn(`[prism-semantic-viewer] ignoring unknown components: ${e.unknown.join(", ")}`);let a=ya(E.scene.features.get(w.selectedFeatureId));rs(a,E.hiddenComponents)&&Fe();let s=be.querySelector("input");return s?.value&&Nd(s.value),e}function $r(t,e=!1){if(!t?.bounds)return;let a=Cr(t.bounds);if(e||t.kind==="component"||!!ya(t)){let r=(a[2]+a[5])*.5<0,i=z.isBelow();r!==i&&z.setAxis("z",r)}z.frame(a)}function Sy(t){if(!t||!N?.featuresByPage)return null;let e=P.byId.get(w.selectedPageId),a=[...e?[e]:[],...(P.pages||[]).filter(n=>n.id!==e?.id)],s=n=>{let r=String(n.kind||"").toLowerCase();return r==="component"||r==="symbol_body"||r==="symbol_instance"?0:r==="symbol_reference"?1:r.startsWith("pin")?2:3};for(let n of a){let r=(N.featuresByPage[n.id]||[]).filter(i=>String(i.reference||i.designator||i.componentDesignator||"")===t).sort((i,o)=>s(i)-s(o));if(r.length)return{page:n,feature:r[0]}}return null}function Fe(){w.activeNetId=0,w.selectedFeatureId=0,M&&(M.boardSelected=!1,M.standInKey=null),w.selectedSchematicFeature=null,w.selectionAnchor=null;let t=ft(),e=w.isolateNet;e&&!t?Gt(!1):t?e&&ea():w.isolateNet=!1,t||Fr(),P.activeNetUid="",N&&(N.activeNetUid=""),Y?.setSelection(null),Y?.setHighlightedNet(""),nt.textContent="No object selected",We?.clearSelection?.(),Ge(),yn(null)}function Qs(t){return`<div class="selection-properties">${t.map(([e,a])=>`
    <div class="selection-property">
      <small>${G(e)}</small>
      <strong title="${G(String(a))}">${G(String(a))}</strong>
    </div>`).join("")}</div>`}function fn(t,e,a){return`
    <div class="selection-card-head">
      <span class="selection-card-accent" style="background:${a}"></span>
      <div class="selection-card-drag-handle" title="Drag to move card">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="2" cy="2" r="1"/>
          <circle cx="6" cy="2" r="1"/>
          <circle cx="10" cy="2" r="1"/>
          <circle cx="2" cy="6" r="1"/>
          <circle cx="6" cy="6" r="1"/>
          <circle cx="10" cy="6" r="1"/>
          <circle cx="2" cy="10" r="1"/>
          <circle cx="6" cy="10" r="1"/>
          <circle cx="10" cy="10" r="1"/>
        </svg>
      </div>
      <div class="selection-card-title"><small>${G(t)}</small><strong>${G(e)}</strong></div>
      <button class="selection-card-close" type="button" aria-label="Clear selection">&times;</button>
    </div>`}function Ry(t){let a=(E.topology.net_details?.[t.uid]||{}).terminals||[],s=t.metrics||{},n=Number(s.traceLengthMm||0).toFixed(2),r=s.objectCounts?.via||0,i=a.length,c=/^(VCC|VDD|GND|3V3|5V|12V|VIN|POWER)/i.test(t.name)?"#10b981":"#8b5cf6",d=t.netClass||"Default",b=a.length?a.map(f=>`
      <div class="selection-row pin-row-interactive" data-ref="${G(f.designator)}" data-pin="${G(f.pin)}">
        <span class="refdes-col"><strong>${G(f.designator)}</strong></span>
        <span class="pin-col">Pin ${G(f.pin)}</span>
        <span class="val-col" title="${G(f.value||"")}">${G(f.value||"-")}</span>
      </div>`).join(""):'<div class="selection-empty">No connected pin metadata is available.</div>';return`
    ${fn("Net",t.name,c)}
    <div class="selection-net-dashboard">
      <div class="net-metric-grid">
        <div class="metric-card">
          <small>Length</small>
          <strong>${n} <span class="unit">mm</span></strong>
        </div>
        <div class="metric-card">
          <small>Vias</small>
          <strong>${r}</strong>
        </div>
        <div class="metric-card">
          <small>Pins</small>
          <strong>${i}</strong>
        </div>
        <div class="metric-card">
          <small>Class</small>
          <strong title="${G(d)}">${G(d)}</strong>
        </div>
      </div>
      
      <div class="selection-section">
        <span class="selection-section-title">Layers</span>
        <div class="net-layers-badges">
          ${(s.layers||[]).length?s.layers.map(f=>`<span class="layer-badge">${G(f)}</span>`).join(""):'<span class="layer-badge unknown">None</span>'}
        </div>
      </div>

      <div class="selection-section">
        <span class="selection-section-title">Connected Pins</span>
        <div class="selection-table compact-scroll" style="max-height: 120px;">
          ${b}
        </div>
      </div>
    </div>`}function Ay(t,e=null){let a=Ar(t.designator),s=a?a.value:t.value||"Not specified",n=a?a.footprint:t.footprint||"Not specified",r=a?.parameters||{},i=r.Manufacturer||r.Mfr||"",o=r["Manufacturer Part Number"]||r.MPN||r["Part Number"]||"",c=r.kicad_dnp==="true"||r.DNP==="true"||r.kicad_in_bom==="false",d="";(i||o)&&(d=`
      <div class="selection-section">
        <span class="selection-section-title">Component details</span>
        <div class="selection-table">
          <div class="selection-row">
            <span><strong>Manufacturer</strong></span>
            <span title="${G(i)}">${G(i||"-")}</span>
          </div>
          <div class="selection-row">
            <span><strong>Part Number</strong></span>
            <span title="${G(o)}">${G(o||"-")}</span>
          </div>
        </div>
      </div>`);let b="";return e&&(b=`
      <div class="selection-section">
        <span class="selection-section-title">Selected Pin</span>
        <div class="selection-table">
          <div class="selection-row">
            <span><strong>Pin</strong></span>
            <span>Pin ${G(e.pinNumber||e.pin||"")}</span>
            <span title="${G(e.pinName||"")}">${G(e.pinName||"No name")}</span>
          </div>
          <div class="selection-row">
            <span><strong>Net</strong></span>
            <span class="net-ref-interactive" data-net-name="${G(e.netName||"")}">${G(e.netName||"Not connected")}</span>
          </div>
        </div>
      </div>`),`
    ${fn("Component",t.designator||"Unknown","#3b82f6")}
    <div class="selection-component-dashboard">
      ${c?'<div class="dnp-banner" style="background:#b45309;color:#fff;font-size:9px;font-weight:750;text-align:center;padding:3px;margin-bottom:8px;border-radius:2px;text-transform:uppercase;letter-spacing:0.05em;">DNP (Do Not Populate)</div>':""}
      ${Qs([["Value",s],["Footprint",n.split(":").pop()||n]])}
      ${d}
      ${b}
    </div>`}function _y(t,e){let a=String(t.kind||"").toLowerCase(),s=a.startsWith("pin");if(a==="component"||a.includes("symbol"))return`
      ${fn("Component",t.reference||t.componentDesignator||"Unknown","#3b82f6")}
      ${Qs([["Value",t.value||t.componentValue||"Not specified"],["Footprint",t.componentFootprint||t.footprint||"Not specified"],["Library",t.libraryRef||"Not specified"],["UID",t.componentUid||t.uuid||t.sourceId||"Not resolved"]])}
      <div class="selection-section">
        <span class="selection-section-title">Schematic placement</span>
        ${Qs([["Page",e?.name||"Unknown"],["Sheet",t.sheetInstancePath||"/"]])}
      </div>`;let r=s?[["Symbol",t.reference||t.designator||"Unknown"],["Value",t.value||t.componentValue||"Not specified"],["Pin",`${t.pinNumber||"-"}${t.pinName?` ${t.pinName}`:""}`],["Net",t.netName||"Not connected"],["PCB Pad",t.pcbPadId||"Not resolved"],["Component UID",t.componentUid||"Not resolved"]]:[["Page",e?.name||"Unknown"],["Kind",t.kind.replaceAll("_"," ")],["Net",t.netName||"Not connected"]];return`
    ${fn(t.kind.replaceAll("_"," "),t.pinName||t.reference||t.designator||t.text||t.netName||"Schematic object","#3b82f6")}
    ${Qs(r)}
    <div class="selection-section">
      <span class="selection-section-title">Source identity</span>
      <div class="selection-table">
        <div class="selection-row">
          <span><strong>${s?"Pin UUID":"UUID"}</strong></span>
          <span title="${G(t.uuid||t.sourceId||"")}">${G(t.uuid||t.sourceId||"-")}</span>
          <span title="${G(t.objectId||"")}">${G(t.objectId||"No object ID")}</span>
        </div>
        <div class="selection-row">
          <span><strong>Sheet</strong></span>
          <span>${G(e?.name||"Unknown")}</span>
          <span title="${G(t.sheetInstancePath||"")}">${G(t.sheetInstancePath||"/")}</span>
        </div>
      </div>
    </div>`}function Ge(){if(Ut(),w.workspace==="bom"){Z.hidden=!0,Z.innerHTML="";return}let t=E.scene.features.get(w.selectedFeatureId),e=t?.kind==="component"?t:null,a=w.workspace==="schematic"?w.selectedSchematicFeature:null,s=a?P.byId.get(a.pageId):null,n=w.activeNetId?E.scene.nets.find(f=>Number(f.id)===w.activeNetId):null;if(!n&&a&&(a.netUid?n=E.scene.nets.find(f=>f.uid===a.netUid):a.netName&&(n=Vt(E.scene.nets,a.netName))),!e&&a){let f=a.reference||a.componentDesignator||a.designator;f&&(e=E.scene.componentFeatures.get(f)||{designator:f})}if(!e&&!n&&!a){Z.hidden=!0,Z.innerHTML="";return}let r="";if(n)r=Ry(n);else if(e){let f=a?.kind?.startsWith("pin")?a:null;r=Ay(e,f)}else a&&(r=_y(a,s));Z.innerHTML=`
    ${r}
    <div class="selection-card-actions">
      ${n?`
        <button type="button" data-action="isolate" aria-keyshortcuts="I" title="Toggle isolated net view (I)" class="${w.isolateNet?"active":""}">Isolate</button>
        <button type="button" data-action="net-layers">Layers</button>
      `:""}
      <button type="button" data-action="frame">Frame selection</button>
    </div>`,Z.hidden=!1;let i=w.workspace==="schematic"?Ie:D,o=w.selectionAnchor,c=Z.offsetWidth||360,d=Z.offsetHeight||330;if(o){let f=Math.max(16,i.clientWidth-c-24),m=Math.max(16,i.clientHeight-d-24);Z.style.left=`${re(o.x+18,16,f)}px`,Z.style.top=`${re(o.y+18,16,m)}px`}else Z.style.left="20px",Z.style.top="20px";if(Z.querySelector(".selection-card-close").addEventListener("click",Fe),Z.querySelector("[data-action=frame]").addEventListener("click",Jr),n){let f=Z.querySelector("[data-action=isolate]");f&&f.addEventListener("click",()=>{Gt(!w.isolateNet)});let m=Z.querySelector("[data-action=net-layers]");m&&m.addEventListener("click",En),Z.querySelectorAll(".pin-row-interactive").forEach(p=>{p.addEventListener("click",()=>{let u=p.dataset.ref,l=p.dataset.pin;if(!u)return;let g=((E.topology.net_details?.[n.uid]||{}).terminals||[]).find(v=>v.designator===u&&v.pin===l),x=g?nm(g.pcb_pad_id):0;x?Kt(x,!0):Tn(u,!0)})})}let b=Z.querySelector(".net-ref-interactive");b&&b.addEventListener("click",()=>{let f=b.dataset.netName;if(!f)return;let m=Vt(E.scene.nets,f);m&&ma(Number(m.id),!0)})}function Jr(){if(w.workspace==="schematic"){Id();return}let t=E.scene.features.get(w.selectedFeatureId);if(t?.bounds)$r(t);else{let e=E.scene.nets.find(a=>Number(a.id)===w.activeNetId);e?.boundsMm&&z.frame(Cr(Ea(e.boundsMm)))}}function Fd(){D.addEventListener("contextmenu",t=>t.preventDefault()),D.addEventListener("pointerdown",t=>{M&&(M.framed=!0),w.dragging=!0,w.lastX=t.clientX,w.lastY=t.clientY,w.pointerStartX=t.clientX,w.pointerStartY=t.clientY,w.dragMode=w.mode==="layer"||t.shiftKey||t.button!==0?"pan":"orbit",D.setPointerCapture(t.pointerId)}),D.addEventListener("pointermove",t=>{if(!w.dragging)return;let e=t.clientX-w.lastX,a=t.clientY-w.lastY;w.lastX=t.clientX,w.lastY=t.clientY,w.dragMode==="pan"?z.pan(e,a,D.clientHeight,w.mode==="layer"):z.orbit(e,a)}),D.addEventListener("pointerup",async t=>{w.dragging=!1,D.releasePointerCapture(t.pointerId),!(Math.hypot(t.clientX-w.pointerStartX,t.clientY-w.pointerStartY)>=3)&&(t.button===0?await Tl(t):t.button===2&&await By(t))}),D.addEventListener("dblclick",async t=>{await Tl(t),Jr()}),D.addEventListener("wheel",t=>{M&&(M.framed=!0),t.preventDefault(),Math.abs(t.deltaX)>Math.abs(t.deltaY)*.4?z.pan(-t.deltaX,0,D.clientHeight,w.mode==="layer"):z.dolly(t.deltaY,w.mode==="layer")},{passive:!1}),window.addEventListener("keydown",Ld),Ny()}function Ny(){let t=!1,e,a,s=0,n=0;Z.addEventListener("pointerdown",r=>{if(!r.target.closest(".selection-card-head")||r.target.closest(".selection-card-close"))return;t=!0,Z.classList.add("dragging");let o=Z.getBoundingClientRect();s=o.left,n=o.top,e=r.clientX,a=r.clientY,Z.setPointerCapture(r.pointerId),r.stopPropagation()}),Z.addEventListener("pointermove",r=>{if(!t)return;let i=r.clientX-e,o=r.clientY-a,c=w.workspace==="schematic"?Ie:D,d=Z.offsetWidth||360,b=Z.offsetHeight||330,f=Math.max(16,c.clientWidth-d-24),m=Math.max(16,c.clientHeight-b-24),p=re(s+i,16,f),u=re(n+o,16,m);Z.style.left=`${p}px`,Z.style.top=`${u}px`,w.selectionAnchor={x:p-18,y:u-18},r.stopPropagation()}),Z.addEventListener("pointerup",r=>{t&&(t=!1,Z.classList.remove("dragging"),Z.releasePointerCapture(r.pointerId),r.stopPropagation())})}function Cy(){Jt("[data-workspace]").forEach(t=>{t.addEventListener("click",()=>Bd(t.dataset.workspace))})}function Bd(t){if(t==="schematic"&&!N||t==="bom"&&!We)return;w.workspace=t,ut.classList.remove("workspace-pcb","workspace-schematic","workspace-bom","workspace-stackup"),ut.classList.add(`workspace-${t}`),(t==="schematic"&&(w.activeTab==="view"||w.activeTab==="inspect"||w.activeTab==="stats")||t==="bom"||t==="stackup")&&hn("layers");let e=$('.rail-tab[data-tab="layers"]');e&&(t==="schematic"?(e.textContent="Pages",e.title="Schematic pages"):t==="bom"?(e.textContent="Summary",e.title="BoM summary"):(e.textContent="Layers",e.title="Layers and compare"));let a=t==="schematic",s=t==="bom",n=t==="stackup";if(D.hidden=a||s||n,Ie&&(Ie.hidden=!a),Zs&&(Zs.hidden=!a||!Y),en&&(en.hidden=!a),tn&&(tn.hidden=!s),Ne&&(Ne.hidden=!n),ke.hidden=a||s||n,an.hidden=a||s||n,La&&(La.hidden=!a),Jt("[data-workspace]").forEach(r=>{r.classList.toggle("active",r.dataset.workspace===t)}),ba.textContent=s?"Semantic BoM active":a?Y?"SVG DOM + WebGPU schematic world active":"WebGPU schematic world active":n?"Layer Stackup active":"WebGPU semantic glTF active",a&&!P.fitted&&(N.resize(),N.frameWorld(),P.fitted=!0),!a&&!s&&!n&&(E.renderer?.resize(),w.mode==="layer"?Gr():ye(performance.now(),{force:!0})),n)try{Dy()}catch(r){console.error("Failed to render stackup workspace",r),Ne&&(Ne.innerHTML=`
          <div class="selection-empty" style="padding:40px;text-align:center;">
            Stackup view failed to render. ${G(r?.message||String(r))}
          </div>
        `)}Kr(),Ge()}function Fy(){Ie.addEventListener("pointerdown",t=>{Y?.worldActive||Y?.active||(w.schematicDragging=!0,w.schematicLastX=t.clientX,w.schematicLastY=t.clientY,w.schematicStartX=t.clientX,w.schematicStartY=t.clientY,Ie.setPointerCapture(t.pointerId))}),Ie.addEventListener("pointermove",t=>{if(Y?.worldActive||Y?.active||!w.schematicDragging||!N)return;let e=t.clientX-w.schematicLastX,a=t.clientY-w.schematicLastY;w.schematicLastX=t.clientX,w.schematicLastY=t.clientY,N.pan(e,a)}),Ie.addEventListener("pointerup",async t=>{if(!(Y?.worldActive||Y?.active)&&(w.schematicDragging=!1,Ie.releasePointerCapture(t.pointerId),Math.hypot(t.clientX-w.schematicStartX,t.clientY-w.schematicStartY)<3)){let e=await N.pickFeature(t.clientX,t.clientY);e?Ey(e):Xa()}}),Ie.addEventListener("dblclick",t=>{if(Y?.worldActive||Y?.active)return;let e=N.hitPage(t.clientX,t.clientY);e&&ht(e.id,!0)}),Ie.addEventListener("wheel",t=>{Y?.worldActive||Y?.active||(t.preventDefault(),N.zoom(t.deltaY,t.clientX,t.clientY))},{passive:!1})}async function Tl(t){if(!se)return;let e=D.getBoundingClientRect();w.selectionAnchor={x:t.clientX-e.left,y:t.clientY-e.top};let a=await jd(t);if(M){_m(a);return}(a.kind==="feature"||a.kind==="board")&&(w.selectedOccurrence=a.occurrenceIndex),a.featureId?Kt(a.featureId,!0):a.kind==="board"&&!E.renderer.identityOnly?Yr():Fe()}async function By(t){if(!se||!cn)return;let e=await jd(t),a=M?M.placements.get(e.occurrenceKey)?.board:E;if(!a)return;let s=a.scene.features.get(e.featureId),n=ya(s),r=n?Ar(n,a):null;cn({clientX:t.clientX,clientY:t.clientY,reference:n||void 0,value:String(r?.value||s?.value||"")||void 0})}function jd(t){let e=D.getBoundingClientRect();return Od((t.clientX-e.left)*D.width/e.width,(t.clientY-e.top)*D.height/e.height)}function Od(t,e){return M?Am(t,e):E.renderer.pick(se,t,e,{activeNetId:w.activeNetId,selectedFeatureId:w.selectedFeatureId,layerOffsets:Md(),visibleLayers:w.mode==="3d"?E.visible3dLayers:E.compareLayers,showBoard:w.showBoard,showComponents:w.showComponents,componentOpacity:re(1-w.separation/.1,0,1),boardOpacity:1-w.separation*.72,isolateNet:w.isolateNet,compareMode:w.mode==="layer",compareOffsets:Qt,visibleTileIds:w.mode==="3d"?E.visibleTileIds:null})}async function Pd(t,e){if(!se||!(M||E.renderer))return null;let a=D.getBoundingClientRect(),s=await Od((t-a.left)*D.width/a.width,(e-a.top)*D.height/a.height),n=M?M.placements.get(s.occurrenceKey)?.board:E,r=s.featureId&&n?Pl(n.scene.features.get(s.featureId),n):null;return{...s,renderer:void 0,selection:r}}function Yr(){let t=w.selectedOccurrence,e=Se;Se=!0;try{Fe()}finally{Se=e}w.selectedOccurrence=t,M&&(M.boardSelected=!0),yn({kind:"board",sourceContext:"3D"})}function Dd(t,e,a){let s=t.scene.componentFeatures.get(String(e)),n=s?t.scene.features.get(Number(s.featureId))?.bounds:null;if(!n)return null;let r=n[2]+n[5]>=0;return a([(n[0]+n[3])/2,(n[1]+n[4])/2,r?n[5]:n[2]])}function kr(t,e){if(!se)return null;let a=Na(se.matrix,Ts(e,t),se.viewport);if(!a)return null;let s=D.getBoundingClientRect();return{x:s.left+a.x*s.width/D.width,y:s.top+a.y*s.height/D.height}}function Ld(t){if(!mn())return;if(t.target instanceof HTMLInputElement){t.key==="Escape"&&t.target.blur();return}let e=t.key.toLowerCase();if(w.workspace==="schematic"){if(e==="/")t.preventDefault(),hn("search"),be.querySelector("#entity-search")?.focus();else if(e==="escape")P.activeNetUid?(P.activeNetUid="",w.activeNetId=0,N.activeNetUid="",Y?.setHighlightedNet(""),Ge()):Xa();else if(e==="~"||t.key==="~"){t.preventDefault();let a=w.selectedSchematicFeature?.netUid;a&&(P.activeNetUid===a?(P.activeNetUid="",w.activeNetId=0,N.activeNetUid="",Y?.setHighlightedNet("")):kd(a,w.selectedSchematicFeature))}else if(e==="home")N?.frameWorld();else if(e==="[")Ys("previous");else if(e==="]")Ys("next");else if(e==="n"){t.preventDefault();let a=N?.cycleNetIntrasheetLink(t.shiftKey?-1:1);a?.pageId&&(w.selectedPageId=a.pageId,N.selectedPageId=a.pageId,Kd())}else if(t.altKey&&e==="arrowup")Ys("parent");else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;N?.pan(a,s)}return}if(M&&Ym(t,e)){t.preventDefault();return}if(e==="/")t.preventDefault(),hn("search"),be.querySelector("#entity-search").focus();else if(e==="escape")Fe();else if(e==="i"&&w.workspace==="pcb"&&ft())t.preventDefault(),Gt(!w.isolateNet);else if(e==="home")z.frame(M&&M.bounds||Zt());else if(e==="`")jr(!w.showStats);else if(["x","y","z"].includes(e))z.setAxis(e,t.shiftKey);else if(e==="f")z.flip();else if(e==="r")z.rotateZ(t.shiftKey?-1:1);else if(e===" "){t.preventDefault();let a=E.scene.features.get(w.selectedFeatureId);a?.bounds&&z.setFocus([(a.bounds[0]+a.bounds[3])/2,(a.bounds[1]+a.bounds[4])/2,(a.bounds[2]+a.bounds[5])/2])}else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;z.pan(a,s,D.clientHeight,w.mode==="layer")}}function hn(t){w.activeTab=t,ut.classList.remove("panel-collapsed"),Jt(".rail-tab").forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),Jt(".tab-panel").forEach(e=>{e.classList.toggle("active",e.dataset.panel===t)})}function Ud(){let t=ke.getContext("2d");t.clearRect(0,0,ke.width,ke.height);let e=[ke.width/2,ke.height/2],a=z.basis(),s=[{axis:"x",label:"X",color:"#e23838",vector:[1,0,0]},{axis:"y",label:"Y",color:"#2dbd50",vector:[0,1,0]},{axis:"z",label:"Z",color:"#3157d5",vector:[0,0,1]}],n=[];for(let r of s)for(let i of[-1,1]){let o=r.vector.map(d=>d*i),c=[wr(o,a.right),-wr(o,a.up),wr(o,a.back)];n.push({...r,sign:i,depth:c[2],point:[e[0]+c[0]*34,e[1]+c[1]*34]})}for(let r of s){let i=n.find(o=>o.axis===r.axis&&o.sign===1);t.strokeStyle=r.color,t.lineWidth=2.4,t.beginPath(),t.moveTo(...e),t.lineTo(...i.point),t.stroke()}nn=[];for(let r of n.sort((i,o)=>o.depth-i.depth)){let i=r.sign===1,o=i?13:9;t.beginPath(),t.arc(r.point[0],r.point[1],o,0,Math.PI*2),t.fillStyle=i?r.color:`${r.color}66`,t.fill(),t.lineWidth=2,t.strokeStyle=Py(r.color,i?.45:.58),t.stroke(),i&&(t.fillStyle="#07101c",t.font="700 13px system-ui",t.textAlign="center",t.textBaseline="middle",t.fillText(r.label,r.point[0],r.point[1]+.5)),nn.push({...r,radius:o+5})}}function Gd(){!ke||ke.dataset.bound==="true"||(ke.dataset.bound="true",ke.addEventListener("click",t=>{let e=ke.width/ke.clientWidth,a=ke.height/ke.clientHeight,s=[t.offsetX*e,t.offsetY*a],n=nn.map(r=>({item:r,distance:Math.hypot(s[0]-r.point[0],s[1]-r.point[1])})).filter(({item:r,distance:i})=>i<=r.radius).sort((r,i)=>r.distance-i.distance)[0]?.item;n&&z.setAxis(n.axis,n.sign<0)}))}function jy(){if(w.mode!=="layer"||!se){an.innerHTML="";return}let t=Zt(),e=Ul();an.innerHTML=E.scene.copperLayers.filter(a=>e.has(Number(a.id))).map(a=>{let s=Qt.get(Number(a.id))||[0,0,0],n=Oy([t[0]+s[0],t[4]+s[1],0],se.matrix,D.clientWidth,D.clientHeight);return!n||n[0]<-100||n[0]>D.clientWidth+100||n[1]<-100||n[1]>D.clientHeight+100?"":`<span style="left:${n[0]}px;top:${n[1]}px">${G(a.name)}</span>`}).join("")}function Kd(){if(w.workspace!=="schematic"||!N){La.innerHTML="";return}La.innerHTML=P.visiblePages.filter(t=>N.pagePixelWidth(t)>120).map(t=>{let[e,a]=N.worldToScreen(t.worldX+8*N.scale,t.worldY-6*N.scale),s=t.id===w.selectedPageId,r=P.activeNetUid&&t.netUids.includes(P.activeNetUid)?"#18ef52":s?"#3b82f6":"#4b8de8";return`<div class="schematic-page-label" style="left:${e}px;top:${a}px;border-left-color:${r}">
        <strong>${G(t.name)}</strong>
        <small>Page ${t.sheetNumber} &middot; ${t.featureCount.toLocaleString()} features</small>
      </div>`}).join("")}function Oy(t,e,a,s){let n=t[0],r=t[1],i=t[2],o=e[0]*n+e[4]*r+e[8]*i+e[12],c=e[1]*n+e[5]*r+e[9]*i+e[13],d=e[3]*n+e[7]*r+e[11]*i+e[15];return Math.abs(d)<1e-8?null:[(o/d*.5+.5)*a,(.5-c/d*.5)*s]}function wr(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function Py(t,e){let a=t.replace("#","");return`#${[0,2,4].map(s=>Math.round(parseInt(a.slice(s,s+2),16)*e).toString(16).padStart(2,"0")).join("")}`}function Ir(t,e){w.frameSamples.push({intervalMs:t,cpuMs:e}),w.frameSamples.length>180&&w.frameSamples.shift()}function kl(t,e){if(!t.length)return 0;let a=[...t].sort((s,n)=>s-n);return a[Math.min(a.length-1,Math.floor((a.length-1)*e))]}function Sr(t){if(!Ws||(w.frames+=1,t-w.fpsAt<=500))return;w.fps=w.frames*1e3/(t-w.fpsAt);let e=w.frameSamples;if(w.frameIntervalMs=e.length?e.reduce((r,i)=>r+i.intervalMs,0)/e.length:0,w.frameCpuMs=e.length?e.reduce((r,i)=>r+i.cpuMs,0)/e.length:0,w.frameIntervalP95Ms=kl(e.map(r=>r.intervalMs),.95),w.frameCpuP95Ms=kl(e.map(r=>r.cpuMs),.95),w.frames=0,w.fpsAt=t,Wl(),w.workspace==="bom"){let r=We?.payload?.counts||{},i=[["Renderer","BoM DOM table"],["Schema",We?.payload?.schema||"-"],["Grouped rows",r.rows||0],["Components",r.components||0],["DNP components",r.dnpComponents||0],["Extra columns",We?.payload?.extraColumns?.length||0],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]];Ws.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("");return}let a=w.workspace==="schematic"&&N?N.stats():null,s=w.workspace==="schematic"&&Y?Y.stats():null,n=w.workspace==="schematic"&&N?Y?.active?[["Renderer","SVG DOM schematic detail"],["Pages",P.pages.length],["Mounted pages",s.mountedPages],["Active page",s.activePage],["DOM nodes",s.domNodes.toLocaleString()],["Indexed features",s.indexedFeatures.toLocaleString()],["Indexed nets",s.indexedNets.toLocaleString()],["SVG cache",`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`],["Selection",`${s.selectionMs.toFixed(1)} ms`],["Active net",E.scene.nets.find(r=>r.uid===P.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Tracking verts",a.netFlowVertices.toLocaleString()],["Mount",`${s.mountMs.toFixed(1)} ms`],["Highlight",`${s.highlightMs.toFixed(1)} ms`],["Fallback",s.fallbackReason||"-"],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]]:[["Renderer",Y?"SVG DOM + WebGPU world":"WebGPU schematic world"],["Pages",P.pages.length],["Visible pages",P.visiblePages.length],["DOM pages",s?s.mountedPages:0],["DOM nodes",s?s.domNodes.toLocaleString():"0"],["Indexed SVG features",s?s.indexedFeatures.toLocaleString():"0"],["SVG cache",s?`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`:"0 pages"],["JS heap",s?.heapMb?`${s.heapMb.toFixed(1)} MB`:"-"],["Hierarchy links",P.manifest.edges?.length||0],["Selected page",P.byId.get(w.selectedPageId)?.name||"-"],["Active net",E.scene.nets.find(r=>r.uid===P.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Downloaded",`${(N.downloadedBytes/1048576).toFixed(1)} MB`],["Resident vectors",`${(a.residentVectorBytes/1048576).toFixed(1)} MB`],["Vector pages",`${a.vectorChunks} loaded / ${a.vectorLoads} loading`],["Vector draw",`${a.vectorVertices.toLocaleString()} verts / ${a.vectorDrawChunks} chunks`],["Native detail",`${a.nativeDetailPages} pages @ ${a.nativePxPerMm} / ${a.nativeThresholdPxPerMm} px/mm`],["Vector failures",a.failedVectorChunks],["Truncated",a.truncatedVectors],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]]:[["Renderer","WebGPU semantic glTF"],["Mode",w.mode==="3d"?"3D":"Layer Compare"],["Visible layers",w.mode==="3d"?E.visible3dLayers.size:E.compareLayers.size],["Resident tiles",E.scene.loaded.size],["Loading tiles",E.scene.loading.size],["Failed tiles",E.scene.failed.size],["Triangles",Math.round(E.triangles).toLocaleString()],["Downloaded",`${(E.loadedBytes/1048576).toFixed(1)} MB`],["Resident GLB",`${(E.residentTileBytes/1048576).toFixed(1)} MB`],["Resident GPU",`${(E.residentTileGpuBytes/1048576).toFixed(1)} MB`],["Tile loads",E.tileLoads.toLocaleString()],["Tile evictions",E.tileEvictions.toLocaleString()],["Tile scheduler",`${E.tileSchedulerMs.toFixed(2)} ms`],["Active net",E.scene.nets.find(r=>Number(r.id)===w.activeNetId)?.name||"-"],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]];Ws.innerHTML=n.map(([r,i])=>`<dt>${r}</dt><dd>${i}</dd>`).join("")}function Qr(t){return`rgb(${t.slice(0,3).map(e=>Math.round(e*255)).join(" ")})`}function Dy(){if(!Ne)return;let t=E.scene.layers||[];if(!t.length){Ne.innerHTML='<div class="selection-empty" style="padding:40px;text-align:center;">No stackup information available for this board.</div>';return}let e=t.filter(k=>["copper","dielectric","paste","silkscreen","soldermask"].includes(k.role)),a=E.topology.board?.stackup||{},s=k=>{if(k==null||k==="")return"None";let B=String(k);return G(B.includes(".")?B.split(".").pop():B)},n=(k,B=4)=>{let O=Number(k);return Number.isFinite(O)&&O>0?O.toFixed(B):"-"},r=(k,B=3)=>{let O=Number(k);return Number.isFinite(O)?O.toFixed(B):"-"},i=k=>{if(k==null||k==="")return"No";if(typeof k=="boolean")return k?"Yes":"No";let B=String(k).trim().toLowerCase(),O=B.includes(".")?B.split(".").pop():B;return["0","false","no","n","off","none"].includes(O)?"No":(["1","true","yes","y","on"].includes(O),"Yes")},o=k=>({copper:"Copper",dielectric:"Dielectric",paste:"Paste",silkscreen:"Silkscreen",soldermask:"Solder mask"})[k]||String(k||"Layer"),c=k=>k.role!=="dielectric"?"":k.type==="core"?"Core":k.type==="prepreg"||(k.material||"").toLowerCase().includes("prepreg")?"Prepreg":"Core",d=(k,B=4)=>{let O=Number(k.thickness_mm);return Number.isFinite(O)&&O>0?`${O.toFixed(B)} mm`:"Not specified"},b=k=>{let B=o(k.role),O=String(k.material||"").trim(),J=O&&O.toLowerCase()!==String(k.role||"").toLowerCase();if(k.role==="dielectric"){let ce=[J?O:"",n(k.epsilon_r,3)!=="-"?`\u03B5r ${n(k.epsilon_r,3)}`:"",n(k.loss_tangent,4)!=="-"?`tan \u03B4 ${n(k.loss_tangent,4)}`:""].filter(Boolean).join(" \xB7 ");return{primary:`${k.name} \xB7 ${c(k)}`,secondary:ce}}return{primary:[k.name,B,J?O:""].filter(Boolean).join(" \xB7 "),secondary:""}},f=0,m=0,p=0,u=0;e.forEach(k=>{u+=k.thickness_mm||0,k.role==="copper"?k.name.toLowerCase().includes("gnd")||k.name.toLowerCase().includes("pwr")||k.name.toLowerCase().includes("plane")?m++:f++:k.role==="dielectric"&&p++});let l=E.scene.copperLayers||[],y=0,h=0,g=0,x=[...(E.scene.manifest?.barrels||[]).filter(k=>k.kind==="via"),...[...E.scene.features.values()].filter(k=>k.kind==="via")],v=Ic(l,x);y=v.counts.thru,h=v.counts.blind,g=v.counts.buried;let T=v.spans,I=30,S=I,R=[],_=new Map(e.map((k,B)=>[k,B])),A=Ly(e),j=(k,B)=>{let O=A.get(k.name);if(O!==void 0)return O;let J=Number(k.stack_index);return Number.isFinite(J)?J:B+1e5},L=[...e].sort((k,B)=>{let O=j(k,_.get(k)||0),J=j(B,_.get(B)||0);return O!==J?O-J:(B.z_mm||0)-(k.z_mm||0)});L.forEach(k=>{let B=12;k.role==="dielectric"?B=Math.max(160,Math.min(360,(k.thickness_mm||.1)*140)):k.role==="copper"?B=22:k.role==="soldermask"&&(B=14),R.push({...k,svgY:S,svgHeight:B}),S+=B});let F=800,K=130,W=240,te=K+W+16,oe=te+84,Oe="";R.forEach(k=>{let B=k.color||"#7f7f7f";k.role==="copper"?B=k.color||"#f97316":k.role==="dielectric"?B="#a98d5c":k.role==="paste"?B="#cbd5e1":k.role==="soldermask"?B="#1b4332":k.role==="silkscreen"&&(B="#e2e8f0");let O=l.findIndex(Jd=>Jd.name===k.name),J=b(k),ce=k.svgY+k.svgHeight/2,Me=!!J.secondary&&k.svgHeight>=38,zt=Me?ce-5:ce+3,In=G(k.id),Ja=G(k.name),Ye=Number.isFinite(Number(k.thickness_mm))&&Number(k.thickness_mm)>0,Wd=G(Ye?d(k):"\u2014"),$d=G([J.primary,J.secondary,`Thickness ${d(k)}`].filter(Boolean).join("; "));Oe+=`
      <g class="stackup-svg-layer" data-layer-id="${In}" data-layer-name="${Ja}">
        <title>${$d}</title>
        <rect x="${K}" y="${k.svgY}" width="${W}" height="${k.svgHeight}" fill="${B}" opacity="0.85" rx="1"/>
        <text x="${K-8}" y="${k.svgY+k.svgHeight/2+3}" fill="var(--muted)" font-size="9px" text-anchor="end" font-weight="700">
          ${k.role==="copper"?O+1:""}
        </text>
        <path class="stackup-layer-dimension" d="M ${te+6} ${k.svgY+1} H ${te} V ${k.svgY+k.svgHeight-1} H ${te+6}" />
        <text class="stackup-layer-thickness" x="${te+10}" y="${ce+3}" fill="var(--muted)" font-size="8.5px" font-weight="650">
          ${Wd}
        </text>
        <text class="stackup-layer-name" x="${oe}" y="${zt}" fill="var(--foreground)" font-size="9px" font-weight="650">
          ${G(J.primary)}
        </text>
        ${Me?`<text class="stackup-layer-metadata" x="${oe}" y="${ce+10}" fill="var(--muted)" font-size="8px">${G(J.secondary)}</text>`:""}
      </g>
    `});let de="",Pe=R.filter(k=>k.role==="copper");T.forEach((k,B)=>{let O=R.find(Ye=>Ye.name===k.startName),J=R.find(Ye=>Ye.name===k.endName);if(!O||!J)return;let ce=O.svgY,Me=J.svgY+J.svgHeight,zt=K+(B+1)*W/(T.length+1),In=k.type==="thru"?"Thru":k.type==="blind"?"Blind":"Buried",Ja=`var(--stackup-via-${k.type})`;de+=`
      <g class="stackup-svg-via" data-via-type="${k.type}">
        <title>${In}: ${k.startName} \u2192 ${k.endName}</title>
        ${Pe.map(Ye=>Ye.svgY>=O.svgY&&Ye.svgY<=J.svgY?`<rect x="${zt-5}" y="${Ye.svgY}" width="10" height="${Ye.svgHeight}" fill="${Ja}" rx="0.5" />`:"").join("")}
        <rect x="${zt-2}" y="${ce}" width="4" height="${Me-ce}" fill="${Ja}" opacity="0.95" />
        <rect x="${zt-.75}" y="${ce-1}" width="1.5" height="${Me-ce+2}" fill="var(--panel)" opacity="0.9" />
      </g>
    `});let Ke=`
    <svg class="stackup-visual-svg" viewBox="0 0 ${F} ${S+10}" width="${F}" height="${S+10}">
      <g class="stackup-svg-column-headings" aria-hidden="true">
        <text x="${te+10}" y="15">Thickness</text>
        <text x="${oe}" y="15">Layer / material properties</text>
      </g>
      <g class="stackup-total-dimension" aria-label="Total board thickness ${u.toFixed(4)} millimetres">
        <path d="M 76 ${I} H 68 V ${S} H 76" />
        <text x="68" y="15">Total ${u.toFixed(4)} mm</text>
      </g>
      ${Oe}
      ${de}
    </svg>
    <div class="stackup-via-legend" aria-label="Via span legend">
      <span><i data-via-type="thru"></i>Thru</span>
      <span><i data-via-type="blind"></i>Blind</span>
      <span><i data-via-type="buried"></i>Buried</span>
    </div>
  `,ve="";L.forEach(k=>{let B="silk";k.role==="copper"?B="copper":k.role==="dielectric"?B="dielectric":k.role==="paste"?B="paste":k.role==="soldermask"&&(B="mask");let O=c(k),J=G(k.id),ce=G(k.name),Me=b(k);ve+=`
      <tr data-layer-id="${J}" data-layer-name="${ce}" tabindex="0" aria-label="${G(`${Me.primary}; thickness ${d(k)}`)}">
        <td><strong>${ce}</strong></td>
        <td><span class="stackup-badge ${B}">${k.role}</span></td>
        <td>${O||"-"}</td>
        <td>${G(k.material||"-")}</td>
        <td>${k.role==="dielectric"?n(k.epsilon_r,3):"-"}</td>
        <td>${k.role==="dielectric"?n(k.loss_tangent,4):"-"}</td>
        <td>${k.thickness_mm?k.thickness_mm.toFixed(4)+" mm":"-"}</td>
      </tr>
    `});let Je="",ze=E.topology.board?.net_classes||[],bt=k=>{let B=r(k);return B==="-"?B:`${B} mm`};ze.length?ze.forEach(k=>{Je+=`
        <tr>
          <td><strong>${k.name}</strong></td>
          <td>${bt(k.track_width)}</td>
          <td>${bt(k.clearance)}</td>
          <td>${bt(k.diff_pair_width)}</td>
          <td>${bt(k.diff_pair_gap)}</td>
          <td>${Number.isFinite(Number(k.via_diameter))?`${r(k.via_drill)}/${r(k.via_diameter)} mm`:"-"}</td>
        </tr>
      `}):Je=`
      <tr>
        <td colspan="6" class="selection-empty" style="text-align: center;">No design rules or impedance classes defined.</td>
      </tr>
    `,Ne.innerHTML=`
    <div class="stackup-header">
      <div class="stackup-header-title">
        <h1>Layer Stackup</h1>
        <p>Board cross-section profile, layer properties & design rules</p>
      </div>
    </div>

    <div class="stackup-workspace-body">
      <div class="stackup-diagram-card">
        <span class="stackup-section-title">Cross-Section Profile</span>
        ${Ke}
      </div>
      <aside class="stackup-side-panel">
      <div class="stackup-summary-grid">
        <div class="stackup-summary-card">
          <label>Total Thickness</label>
          <span>${u.toFixed(4)} mm</span>
        </div>
        <div class="stackup-summary-card">
          <label>Copper Layers</label>
          <span>${l.length} (${f} Sig / ${m} Plane)</span>
        </div>
        <div class="stackup-summary-card">
          <label>Dielectrics</label>
          <span>${p} Layers</span>
        </div>
        <div class="stackup-summary-card">
          <label>Thru Vias</label>
          <span>${y}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Blind Vias</label>
          <span>${h}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Buried Vias</label>
          <span>${g}</span>
        </div>
      </div>
      <span class="stackup-section-title stackup-section-heading">Fabrication</span>
      <div class="stackup-summary-grid">
        <div class="stackup-summary-card">
          <label>Copper Finish</label>
          <span>${s(a.copper_finish)}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Edge Connector</label>
          <span>${i(a.edge_connector)}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Castellated Holes</label>
          <span>${i(a.castellated_pads)}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Edge Plating</label>
          <span>${i(a.edge_plating)}</span>
        </div>
      </div>
      <div class="stackup-tables-container">
        <div class="stackup-table-section">
          <div class="stackup-section-title stackup-section-heading">
            <span>Layers Stackup</span>
            <small>Hover or focus a row to locate it</small>
          </div>
          <div class="stackup-table-wrapper">
            <table class="stackup-table">
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Type</th>
                  <th>Subtype</th>
                  <th>Material</th>
                  <th>\u03B5r</th>
                  <th>tan \u03B4</th>
                  <th>Thickness</th>
                </tr>
              </thead>
              <tbody>
                ${ve}
              </tbody>
            </table>
          </div>
        </div>

        <div class="stackup-table-section">
          <span class="stackup-section-title stackup-section-heading">Impedance Net Classes</span>
          <div class="stackup-table-wrapper">
            <table class="stackup-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Width</th>
                  <th>Clearance</th>
                  <th>Diff W</th>
                  <th>Diff Gap</th>
                  <th>Drill/Dia</th>
                </tr>
              </thead>
              <tbody>
                ${Je}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </aside>
    </div>
  `;let aa=(k,B)=>{Ne.querySelectorAll(".stackup-svg-layer").forEach(O=>{let J=O.dataset.layerId===k;O.classList.toggle("active",J&&B)}),Ne.querySelectorAll(".stackup-table tbody tr[data-layer-id]").forEach(O=>{let J=O.dataset.layerId===k;O.classList.toggle("active",J&&B)})},kn=k=>{let B=Ne.querySelector(".stackup-diagram-card"),O=Ne.querySelector(`.stackup-svg-layer[data-layer-id="${CSS.escape(k)}"]`);if(!B||!O||B.scrollHeight<=B.clientHeight)return;let J=B.getBoundingClientRect(),ce=O.getBoundingClientRect(),Me=B.scrollTop+ce.top-J.top-(B.clientHeight-ce.height)/2,zt=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;B.scrollTo({top:Math.max(0,Me),behavior:zt?"auto":"smooth"})},$a=(k,{revealDiagram:B=!1}={})=>{k.forEach(O=>{let J=()=>{let Me=O.dataset.layerId;aa(Me,!0),B&&kn(Me)},ce=()=>aa(null,!1);O.addEventListener("mouseenter",J),O.addEventListener("mouseleave",ce),B&&(O.addEventListener("focus",J),O.addEventListener("blur",ce))})};$a(Ne.querySelectorAll(".stackup-svg-layer")),$a(Ne.querySelectorAll(".stackup-table tbody tr[data-layer-id]"),{revealDiagram:!0})}function Ly(t){let e=t.filter(n=>n.role==="dielectric");if(!(e.length===1&&e[0]?.name==="Board"))return new Map;let s=new Map;return["F.SilkS","F.Paste","F.Mask","F.Cu","Board","B.Cu","B.Mask","B.Paste","B.SilkS"].forEach((n,r)=>s.set(n,r)),s}function zd(){let t=null;return{begin(){return t?.abort(),t=new AbortController,t},owns(e){return e!==null&&e===t&&!e.signal.aborted},cancel(){t?.abort(),t=null}}}async function Vd(t,e,{owner:a,bundleUrl:s,loadBundle:n,now:r=()=>performance.now()}){let i=r(),o={},{signal:c}=e,d=()=>a.owns(e)&&t.isConnected;try{t.renderLoading();let b=r(),{bundle:f,topology:m,semanticGeometry:p,assetCache:u}=await n(s,o,c);if(o.bundle_group_total_ms=r()-b,!d())return;t.renderShell();let l=r(),y=await t.mountViewer({topology:m,semanticGeometry:p,readiness:f.readiness,assetCache:u,signal:c});if(!d()){y?.dispose?.();return}t.publishController(y),o.mount_and_first_frame_ms=r()-l,Object.assign(o,y?.performance||{}),o.reload_to_visible_ms=r()-i,t.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"board-visible",readiness_stage:f.readiness?.stage||"semantic-ready",readiness_progress:f.readiness?.progress??100,timings:o})}catch(b){if(!d())return;t.renderError(b),t.emitError(b)}}var Uy="prism.visualizer_bundle.a0";function Gy(){return`
    <style>
      ${ei}
      #app { grid-template-columns: minmax(0, 1fr) 376px; }
      #app.panel-collapsed { grid-template-columns: minmax(0, 1fr) 46px; }
      #app.workspace-stackup { grid-template-columns: minmax(0, 1fr); }
      #selection-card { display: none !important; }
      #scene-stats {
        position: absolute; top: 12px; right: 12px; z-index: 4; margin: 0; padding: 8px 10px;
        display: grid; grid-template-columns: auto auto; gap: 2px 12px;
        background: rgb(15 20 28 / 0.82); color: #dbe4f0; border-radius: 6px;
        font: 11px/1.4 "SFMono-Regular", Consolas, monospace; font-variant-numeric: tabular-nums;
        pointer-events: none;
      }
      #scene-stats[hidden] { display: none; }
      #scene-stats dt { color: #8a97a8; }
      #scene-stats dd { margin: 0; text-align: right; }
      /* SB2-30a: level-of-detail thresholds, beside the stats in mode="system". */
      #lod-tuning {
        position: absolute; right: 12px; bottom: 12px; z-index: 4; width: 230px; padding: 8px 10px;
        background: rgb(15 20 28 / 0.86); color: #dbe4f0; border-radius: 6px;
        font: 11px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      #lod-tuning[hidden] { display: none; }
      #lod-tuning h2 { margin: 0 0 6px; font-size: 11px; font-weight: 600; }
      #lod-tuning label { display: grid; grid-template-columns: 64px 1fr 30px; align-items: center; gap: 6px; }
      #lod-tuning input { width: 100%; margin: 0; }
      #lod-tuning output { text-align: right; font: 11px "SFMono-Regular", Consolas, monospace; font-variant-numeric: tabular-nums; }
      #lod-tuning button {
        margin-top: 6px; font: inherit; color: inherit; background: rgb(255 255 255 / 0.12);
        border: 0; border-radius: 4px; padding: 2px 8px; cursor: pointer;
      }
      /* System mode (SB2-31f): board labels, the move gizmo and the key list. */
      #system-labels { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
      /* SB2-34: proxy harnesses, straight segments between connectors until M5's geometry. */
      #system-harnesses { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; overflow: hidden; }
      #system-harnesses[hidden] { display: none; }
      #system-harnesses .segment { stroke: #1e293b; stroke-width: 2.5; stroke-dasharray: 7 5; stroke-linecap: round; filter: drop-shadow(0 0 1.5px rgb(255 255 255 / 0.9)); }
      #system-harnesses .segment.dim { opacity: 0.25; }
      #system-harnesses .segment.lit { stroke-width: 4.5; stroke-dasharray: none; opacity: 1; filter: drop-shadow(0 0 4px currentColor); }
      #system-harnesses .end { fill: #f8fafc; stroke: #1e293b; stroke-width: 2; }
      #system-harnesses .end.dim { opacity: 0.3; }
      #system-harnesses .end.lit { stroke: #fff; animation: harness-glow 1.9s ease-in-out infinite; }
      @keyframes harness-glow { 50% { opacity: 0.65; } }
      #system-labels[hidden] { display: none; }
      .scene-label {
        position: absolute; left: 0; top: 0; display: flex; flex-direction: column; align-items: center;
        padding: 2px 7px; border-radius: 5px; background: rgb(15 20 28 / 0.72); color: #f1f5f9;
        font: 500 11px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; white-space: nowrap; margin-top: -6px;
      }
      .scene-label[hidden] { display: none; }
      .scene-label span { font-weight: 400; color: #cbd5e1; font-size: 10px; }
      .scene-label.stand-in { background: rgb(71 85 105 / 0.78); }
      .scene-label.restricted { background: rgb(55 65 81 / 0.85); }
      .scene-label.failed { background: rgb(153 27 27 / 0.8); }
      .scene-label.selected { background: rgb(37 99 235 / 0.92); }
      #move-gizmo { position: absolute; inset: 0; z-index: 3; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
      #move-gizmo[hidden] { display: none; }
      #move-gizmo .ring { stroke-width: 2.5; opacity: 0.75; pointer-events: stroke; cursor: grab; }
      #move-gizmo .ring:hover { stroke-width: 5; opacity: 1; }
      #move-gizmo .arrow { pointer-events: visiblePainted; cursor: grab; }
      #move-gizmo .arrow line { stroke-width: 4; stroke-linecap: round; }
      #move-gizmo .arrow:hover line { stroke-width: 6; }
      #move-gizmo .arrow text { font: 700 11px system-ui, -apple-system, "Segoe UI", sans-serif; paint-order: stroke; }
      #move-gizmo .pivot { fill: #0f172a; stroke: #fff; stroke-width: 1.5; }
      #move-gizmo .readout { font: 600 12px system-ui, -apple-system, "Segoe UI", sans-serif; fill: #0f172a;
        paint-order: stroke; stroke: #fff; stroke-width: 3px; }
      #system-help { position: absolute; right: 12px; bottom: 12px; z-index: 4; margin: 0; padding: 10px 12px; max-width: 340px;
        display: grid; grid-template-columns: auto 1fr; gap: 3px 12px;
        background: rgb(15 20 28 / 0.9); color: #e2e8f0; border-radius: 8px;
        font: 12px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
      #system-help[hidden] { display: none; }
      #system-help h2 { grid-column: 1 / -1; margin: 0 0 4px; font-size: 12px; font-weight: 600; }
      #system-help kbd { font: 600 11px "SFMono-Regular", Consolas, monospace; color: #fff; }
      #system-help dd { margin: 0; color: #cbd5e1; }
      /* The host renders the PCB controls itself (see getViewState). */
      :host([hide-panel]) #app,
      :host([hide-panel]) #app.panel-collapsed { grid-template-columns: minmax(0, 1fr); }
      :host([hide-panel]) .panel { display: none !important; }
    </style>
    <main id="app">
      <section class="viewport-shell">
        <canvas id="viewport"></canvas>
        <div id="stackup-workspace-view" hidden></div>
        <div id="panel-labels"></div>
        <div id="selection-card" hidden></div>
        <canvas id="axis-gizmo" width="112" height="112" title="Click an axis to align the camera"></canvas>
        <dl id="scene-stats" hidden></dl>
        <div id="lod-tuning" role="group" aria-label="Level of detail thresholds" hidden></div>
        <svg id="system-harnesses" hidden aria-hidden="true"></svg>
        <div id="system-labels" hidden></div>
        <svg id="move-gizmo" hidden aria-hidden="true"></svg>
        <dl id="system-help" hidden aria-label="Keyboard shortcuts">
          <h2>Keyboard</h2>
          <dt><kbd>Home</kbd> <kbd>A</kbd></dt><dd>Frame every board</dd>
          <dt><kbd>Double-click</kbd></dt><dd>Select and frame</dd>
          <dt><kbd>X</kbd> <kbd>Y</kbd> <kbd>Z</kbd></dt><dd>Look along an axis (Shift: from the other side)</dd>
          <dt><kbd>F</kbd> <kbd>R</kbd></dt><dd>Flip the view, turn it a quarter</dd>
          <dt><kbd>I</kbd></dt><dd>Isolate the lit nets' copper, or back</dd>
          <dt><kbd>M</kbd></dt><dd>Move mode on or off (editors)</dd>
          <dt><kbd>L</kbd></dt><dd>Gizmo axes: world or the board's own</dd>
          <dt><kbd>Shift</kbd></dt><dd>While dragging: 0.1 mm and 1\xB0 steps (else 1 mm, 15\xB0)</dd>
          <dt><kbd>Enter</kbd></dt><dd>Save the shown position</dd>
          <dt><kbd>Esc</kbd></dt><dd>Undo the drag, leave move mode, or clear the selection</dd>
          <dt><kbd>\`</kbd></dt><dd>Scene stats</dd>
          <dt><kbd>?</kbd></dt><dd>This list</dd>
        </dl>
        <div id="fallback" hidden></div>
      </section>
      <aside class="panel">
        <nav class="panel-rail" aria-label="Viewer tools">
          <button class="rail-tab active" data-tab="layers" title="Layers">Layers</button>
          <button class="rail-tab" data-tab="search" title="Search and selection">Find</button>
          <button class="rail-tab" data-tab="view" title="View controls">View</button>
        </nav>
        <div class="panel-drawer">
          <header class="panel-mode-header">
            <div id="mode-switch"></div>
          </header>
          <section class="tab-panel active" data-panel="layers">
            <div class="section-heading"><h2 id="primary-heading">Layers</h2><span id="primary-description">Visibility and compare</span></div>
            <div id="layers"></div>
          </section>
          <section class="tab-panel" data-panel="search">
            <div class="section-heading"><h2>Find</h2><span>Nets, components and pins</span></div>
            <div id="search-controls"></div>
          </section>
          <section class="tab-panel" data-panel="view">
            <div class="section-heading"><h2>View</h2><span>Camera and stackup</span></div>
            <div id="view-controls"></div>
          </section>
        </div>
      </aside>
    </main>
  `}function Ky(t){return String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}async function Hd(t,e=null,a="fetch",s=void 0){let n=performance.now(),r=await fetch(t,{cache:"no-store",signal:s});if(!r.ok)throw new Error(`Failed to load ${t}: ${r.status}`);let i=await r.json();return e&&(e[`${a}_fetch_parse_ms`]=performance.now()-n,e[`${a}_content_length`]=Number(r.headers.get("content-length")||0)),i}async function qd(t,e,a){let s=new URL(t,document.baseURI).toString(),n=new URL(s).searchParams.get("viewer")||"",r=Qa.open(),i=await r.peekJson(s).catch(()=>null),o=!!i;i||(i=await Hd(s,e,"bundle",a),An(i)&&r.store(s,new TextEncoder().encode(JSON.stringify(i)))),e&&(e.bundle_from_cache=o);let c=An(i)&&r.enabled?r:null;if(i.schema!==Uy)throw new Error(`Unsupported visualizer bundle schema: ${i.schema||"missing"}`);let d=new URL(i.topology||"topology.json",s),b=new URL(i.semantic_geometry||"semantic_geometry.json",s),f=(u,l)=>c?c.fetchJson(u.toString(),{signal:a}):Hd(u,e,l,a),[m,p]=await Promise.all([f(d,"topology"),f(b,"semantic_geometry")]);return{bundle:i,topology:m,semanticGeometry:ti(p,s,i,n),assetCache:c}}var Zr=class extends HTMLElement{static get observedAttributes(){return["bundle-url","workspace","mode","move-allowed"]}constructor(){super(),this.attachShadow({mode:"open"}),this.controller=null,this.reloadOwner=zd(),this.pendingSelection=null,this.pendingHiddenComponents=null,this.reloadQueued=!1,this.reloadSource=null}connectedCallback(){this.queueReload()}disconnectedCallback(){this.reloadOwner.cancel(),this.controller?.dispose?.(),this.controller=null,this.reloadSource=null}attributeChangedCallback(e,a,s){if(!(!this.isConnected||a===s)){if(e==="workspace"){this.controller?.setWorkspace?.(this.workspace);return}if(e==="move-allowed"){this.controller?.setMoveAllowed?.(s==="true");return}this.queueReload()}}get workspace(){return this.getAttribute("workspace")==="stackup"?"stackup":"pcb"}get systemMode(){return this.getAttribute("mode")==="system"}queueReload(){let e=this.systemMode?"system":this.getAttribute("bundle-url");!e||e===this.reloadSource||(this.reloadSource=e,!this.reloadQueued&&(this.reloadQueued=!0,queueMicrotask(()=>{this.reloadQueued=!1,this.isConnected&&this.reload()})))}async reload(){let e=this.getAttribute("bundle-url"),a=this.reloadOwner.begin();if(this.controller?.dispose?.(),this.controller=null,this.systemMode){await this.reloadSystem(a);return}if(!e){this.shadowRoot.innerHTML="<style>:host{display:block;height:100%;font:14px system-ui;color:#94a3b8}</style><div>Semantic bundle URL is missing.</div>";return}await Vd(this,a,{owner:this.reloadOwner,bundleUrl:e,loadBundle:qd})}async reloadSystem(e){let{signal:a}=e,s=()=>this.reloadOwner.owns(e)&&this.isConnected;try{this.renderShell();let n=await $l({root:this.shadowRoot,loadBundle:(i,o)=>qd(i,null,o),isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{a.aborted||this.emit("selectionchange",{selection:i})},onContextMenu:i=>{a.aborted||this.emit("contextmenu",i)},onViewStateChange:i=>{a.aborted||this.emitViewState(i)},onEmphasis:i=>{a.aborted||this.emit("emphasis",{results:i})},onMove:i=>{a.aborted||this.emit("move",i)}});if(!s()){n?.dispose?.();return}this.controller=n,this.pendingGpuBudget!=null&&n.setGpuBudget(this.pendingGpuBudget),this.pendingSystemScene&&n.setSystemScene(this.pendingSystemScene),this.pendingNetEmphasis&&n.setNetEmphasis(this.pendingNetEmphasis),n.setMoveAllowed(this.getAttribute("move-allowed")==="true"),this.pendingLabels!=null&&n.setLabelsVisible(this.pendingLabels);let r=this.getViewState();r&&this.emitViewState(r),this.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"system-mounted"})}catch(n){if(!s())return;this.renderError(n),this.emitError(n)}}emit(e,a){this.dispatchEvent(new CustomEvent(`prism-semantic-viewer:${e}`,{bubbles:!0,composed:!0,detail:a}))}setSystemScene(e){this.pendingSystemScene=e||null,e&&this.controller?.setSystemScene?.(e)}setNetEmphasis(e){return this.pendingNetEmphasis=Array.isArray(e)?e:[],this.controller?.setNetEmphasis?.(this.pendingNetEmphasis)??[]}frameNetEmphasis(e=null,a=null){return this.controller?.frameNetEmphasis?.(e,a)??!1}setMoveMode(e){this.controller?.setMoveMode?.(e)}setMoveSpace(e){this.controller?.setMoveSpace?.(e)}previewPose(e){this.controller?.previewPose?.(e)}cancelMove(){this.controller?.cancelMove?.()}getMoveState(){return this.controller?.getMoveState?.()??null}setLabelsVisible(e){this.pendingLabels=!!e,this.controller?.setLabelsVisible?.(this.pendingLabels)}setHarnessesVisible(e){this.controller?.setHarnessesVisible?.(!!e)}setHelpVisible(e){this.controller?.setHelpVisible?.(e)}frameAll(){this.controller?.frameAll?.()}frameBoard(e){return this.controller?.frameBoard?.(e)??!1}frameParts(e){return this.controller?.frameParts?.(e)??!1}renderLoading(){this.shadowRoot.innerHTML='<style>:host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}</style><div style="display:grid;place-items:center;height:100%">Loading semantic visualizer...</div>'}renderShell(){this.shadowRoot.innerHTML=Gy()}renderError(e){console.error(e),this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}
        .error{height:100%;display:grid;place-items:center;padding:24px}
        pre{max-width:100%;white-space:pre-wrap;color:#fecaca;background:#111827;border:1px solid #374151;padding:16px}
      </style>
      <div class="error"><pre>${Ky(e?.stack||e?.message||String(e))}</pre></div>
    `}mountViewer({topology:e,semanticGeometry:a,readiness:s,assetCache:n=null,signal:r}){return _r({root:this.shadowRoot,topology:e,semanticGeometry:a,readiness:s,workspaceScope:"3d",assetCache:n,isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{r.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:selectionchange",{bubbles:!0,composed:!0,detail:{selection:i}}))},onContextMenu:i=>{r.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:contextmenu",{bubbles:!0,composed:!0,detail:i}))},onViewStateChange:i=>{r.aborted||this.emitViewState(i)},onPerformanceEvent:i=>{r.aborted||(console.info("[prism-3d-perf]",i),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:performance",{bubbles:!0,composed:!0,detail:i})))}})}publishController(e){this.controller=e,this.controller?.setWorkspace?.(this.workspace),this.pendingHiddenComponents&&this.controller?.setHiddenComponents?.(this.pendingHiddenComponents),this.pendingGpuBudget!=null&&this.controller?.setGpuBudget?.(this.pendingGpuBudget),this.pendingSelection&&this.controller?.setSelection?.(this.pendingSelection),this.pendingHighlightedNets?.length&&this.controller?.setHighlightedNets?.(this.pendingHighlightedNets);let a=this.getViewState();a&&this.emitViewState(a)}emitViewState(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:viewstatechange",{bubbles:!0,composed:!0,detail:e}))}emitReady(e){console.info("[prism-3d-perf]",e),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:ready",{bubbles:!0,composed:!0,detail:e}))}emitError(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:error",{bubbles:!0,detail:{error:e}}))}setSelection(e){this.pendingSelection=e||null,this.controller?.setSelection?.(this.pendingSelection)}setHighlightedNets(e){this.pendingHighlightedNets=Array.isArray(e)?[...e]:[],this.controller?.setHighlightedNets?.(this.pendingHighlightedNets)}setHiddenComponents(e){this.pendingHiddenComponents=Array.isArray(e)?[...e]:[],this.controller?.setHiddenComponents?.(this.pendingHiddenComponents)}pickAt(e,a){return Promise.resolve(this.controller?.pickAt?.(e,a)??null)}projectComponent(e,a){return this.controller?.projectComponent?.(e,a)??null}setStatsOverlay(e){this.controller?.setStatsOverlay?.(e)}getStats(){return this.controller?.stats?.()??null}setLodOverride(e){this.controller?.setLodOverride?.(e)}setLodThresholds(e){return this.controller?.setLodThresholds?.(e)??null}setGpuBudget(e){this.pendingGpuBudget=e,this.controller?.setGpuBudget?.(e)}projectPoint(e,a){return this.controller?.projectPoint?.(e,a)??null}getComponentReferences(){return this.controller?.getComponentReferences?.()??[]}resize(){this.controller?.resize?.()}getViewState(){return this.controller?.getViewState?.()??null}setViewMode(e){this.controller?.setViewMode?.(e)}setLayerVisible(e,a,s=null){this.controller?.setLayerVisible?.(e,a,s)}applyLayerPreset(e,a=null){this.controller?.applyLayerPreset?.(e,a)}setShowBoard(e){this.controller?.setShowBoard?.(e)}setShowComponents(e){this.controller?.setShowComponents?.(e)}setShowPlaceholders(e){this.controller?.setShowPlaceholders?.(e)}setRealisticColors(e){this.controller?.setRealisticColors?.(e)}setSeparation(e,a=null){this.controller?.setSeparation?.(e,a)}showNetLayers(){this.controller?.showNetLayers?.()}setNetIsolation(e){this.controller?.setNetIsolation?.(e)}};function Xd(){customElements.get("prism-semantic-viewer")||customElements.define("prism-semantic-viewer",Zr)}window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__=!0;Xd();
