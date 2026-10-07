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
`;var Wd=/\/api\/projects\/([^/]+)\/webgpu-3d\/assets\/([^/]+)\/([^/]+)\/(.+)$/,Jd="prism-bundle-cache-a0",Ir="manifest.json";function Sr(t){let e;try{e=new URL(t,"http://cache.invalid/")}catch{return null}let a=Wd.exec(e.pathname);if(!a)return null;let[,s,r,n,i]=a.map(decodeURIComponent);if(i.split("/").some(c=>!c||c==="."||c===".."))return null;let o=e.searchParams.get("viewer")||"";return`${s}/${r}/${n}/${i}${o?`?viewer=${o}`:""}`}function Ya(t){return`a_${encodeURIComponent(t)}`}function $d(t,e,{maxAgeMs:a=2592e6,maxBytes:s=2147483648}={}){let r=new Set,n=[];for(let[o,c]of Object.entries(t))e-Number(c.lastUsed||0)<=a?n.push([o,c]):r.add(o);n.sort((o,c)=>Number(c[1].lastUsed)-Number(o[1].lastUsed));let i=0;for(let[o,c]of n)i+=Number(c.bytes||0),i>s&&r.add(o);return[...r]}var Qa=class t{static open(e={}){return t.shared||(t.shared=new t(e)),t.shared}constructor({maxAgeMs:e=2592e6,maxBytes:a=2147483648}={}){this.maxAgeMs=e,this.maxBytes=a,this.stats={hits:0,misses:0,bypassed:0,cachedBytes:0,networkBytes:0,writeErrors:0},this.ready=this.init(),this.flushTimer=null}async init(){try{let e=globalThis.navigator?.storage;if(!e?.getDirectory)return null;let s=await(await e.getDirectory()).getDirectoryHandle(Jd,{create:!0}),r=await s.getFileHandle(Ir,{create:!0});if(typeof r.createWritable!="function")return null;let n={};try{let i=await(await r.getFile()).text();n=i?JSON.parse(i).entries||{}:{}}catch{n={}}return this.directory=s,this.entries=n,await this.prune(),globalThis.addEventListener?.("pagehide",()=>void this.flush()),s}catch{return null}}get enabled(){return!!this.directory}async fetchBytes(e,{store:a=!0,signal:s}={}){let r=Sr(e);if(await this.ready,r&&this.directory){let c=await this.read(r);if(c)return this.stats.hits+=1,this.stats.cachedBytes+=c.byteLength,c;this.stats.misses+=1}else this.stats.bypassed+=1;let n=await fetch(e,{cache:"no-store",signal:s});if(!n.ok)throw new Error(`Failed to load ${e}: ${n.status}`);let i=await n.arrayBuffer(),o=Number(n.headers.get("content-length")||0);return this.stats.networkBytes+=i.byteLength,a&&r&&this.directory&&(!o||o===i.byteLength)&&this.write(r,i),i}async fetchJson(e,a={}){let s=await this.fetchBytes(e,a);return JSON.parse(new TextDecoder().decode(s))}async peekJson(e){let a=Sr(e);if(await this.ready,!a||!this.directory)return null;let s=await this.read(a);return s?(this.stats.hits+=1,this.stats.cachedBytes+=s.byteLength,JSON.parse(new TextDecoder().decode(s))):null}async store(e,a){let s=Sr(e);await this.ready,s&&this.directory&&await this.write(s,a)}async read(e){let a=this.entries[e];if(!a)return null;try{let s=await(await this.directory.getFileHandle(Ya(e))).getFile();return s.size!==a.bytes?null:(a.lastUsed=Date.now(),this.scheduleFlush(),await s.arrayBuffer())}catch{return delete this.entries[e],null}}async write(e,a){try{let r=await(await this.directory.getFileHandle(Ya(e),{create:!0})).createWritable();await r.write(a),await r.close(),this.entries[e]={bytes:a.byteLength,lastUsed:Date.now()},this.scheduleFlush()}catch{this.stats.writeErrors+=1}}async prune(e=Date.now()){if(!this.directory)return[];let a=$d(this.entries,e,{maxAgeMs:this.maxAgeMs,maxBytes:this.maxBytes});for(let r of a)delete this.entries[r],await this.directory.removeEntry(Ya(r)).catch(()=>{});let s=new Set(Object.keys(this.entries).map(Ya));for await(let r of this.directory.keys())r!==Ir&&!s.has(r)&&await this.directory.removeEntry(r).catch(()=>{});return a.length&&await this.flush(),a}async clear(){await this.ready,this.directory&&(this.entries={},await this.prune(),await this.flush())}summary(){let e=Object.values(this.entries||{});return{enabled:this.enabled,files:e.length,bytes:e.reduce((a,s)=>a+Number(s.bytes||0),0),...this.stats}}scheduleFlush(){this.flushTimer||(this.flushTimer=setTimeout(()=>{this.flushTimer=null,this.flush()},1e3))}async flush(){if(this.directory)try{let a=await(await this.directory.getFileHandle(Ir,{create:!0})).createWritable();await a.write(JSON.stringify({schema:"prism.bundle_cache_manifest.a0",entries:this.entries})),await a.close()}catch{this.stats.writeErrors+=1}}};function Yd(t,e){if(!e)return t;let a=new URL(t);return a.searchParams.set("viewer",e),a.toString()}function ti(t,e,a,s){let r=new URL(a.asset_base||"./",e),n=structuredClone(t||{}),i=o=>!o||typeof o!="string"?o:Yd(new URL(o,r).toString(),s);for(let o of["assets","semantic_gltf","schematic_world","schematic_vector","schematic_scene","bom"]){let c=n[o];if(!(!c||typeof c!="object"))for(let[d,h]of Object.entries(c))c[d]=i(h)}return n}function Rr(t){return(t?.readiness?.stage||"semantic-ready")==="semantic-ready"&&(t?.readiness?.progress??100)>=100}var ne=(t,e,a)=>Math.max(e,Math.min(a,t)),es=(t,e,a)=>t+(e-t)*a;function Qe(t,e){return[t[0]+e[0],t[1]+e[1],t[2]+e[2]]}function Qd(t,e){return[t[0]-e[0],t[1]-e[1],t[2]-e[2]]}function De(t,e){return[t[0]*e,t[1]*e,t[2]*e]}function Zd(t){return Math.hypot(t[0],t[1],t[2])}function it(t){let e=Zd(t)||1;return De(t,1/e)}function pt(t,e){return[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]]}function xa(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function ai(t,e){let a=e/2,s=Math.sin(a),r=it(t);return[r[0]*s,r[1]*s,r[2]*s,Math.cos(a)]}function Za(t,e){return[t[3]*e[0]+t[0]*e[3]+t[1]*e[2]-t[2]*e[1],t[3]*e[1]-t[0]*e[2]+t[1]*e[3]+t[2]*e[0],t[3]*e[2]+t[0]*e[1]-t[1]*e[0]+t[2]*e[3],t[3]*e[3]-t[0]*e[0]-t[1]*e[1]-t[2]*e[2]]}function Ar(t,e){let a=[e[0],e[1],e[2],0],s=[-t[0],-t[1],-t[2],t[3]];return Za(Za(t,a),s).slice(0,3)}function ts(t,e){let a=new Float32Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function si(t,e,a){let s=it(Qd(t,e)),r=it(pt(a,s)),n=pt(s,r);return new Float32Array([r[0],n[0],s[0],0,r[1],n[1],s[1],0,r[2],n[2],s[2],0,-xa(r,t),-xa(n,t),-xa(s,t),1])}function ri(t,e,a,s){let r=1/Math.tan(t/2);return new Float32Array([r/e,0,0,0,0,r,0,0,0,0,a/(s-a),-1,0,0,a*s/(s-a),0])}function ni(t,e,a,s){return new Float32Array([2/t,0,0,0,0,2/e,0,0,0,0,1/(s-a),0,0,0,1,1])}function _r(t){return[(t[0]+t[3])/2,(t[1]+t[4])/2,(t[2]+t[5])/2]}function wa(t){return Math.max(.001,Math.hypot(t[3]-t[0],t[4]-t[1],t[5]-t[2])/2)}var va=class{constructor(e){let a=_r(e),s=wa(e);this.focus=[...a],this.targetFocus=[...a],this.azimuth=-.62,this.targetAzimuth=this.azimuth,this.polar=.72,this.targetPolar=this.polar,this.distance=s*2.8,this.targetDistance=this.distance,this.orthoScale=s*2.15,this.targetOrthoScale=this.orthoScale,this.sceneRadius=s,this.fov=Math.PI/4}update(e){let a=1-Math.exp(-e*14);this.focus=this.focus.map((s,r)=>es(s,this.targetFocus[r],a)),this.azimuth=oi(this.azimuth,this.targetAzimuth,a),this.polar=oi(this.polar,this.targetPolar,a),this.distance=es(this.distance,this.targetDistance,a),this.orthoScale=es(this.orthoScale,this.targetOrthoScale,a)}snap(){this.focus=[...this.targetFocus],this.azimuth=this.targetAzimuth,this.polar=this.targetPolar,this.distance=this.targetDistance,this.orthoScale=this.targetOrthoScale}basis(){let e=Math.sin(this.polar),a=Math.cos(this.polar),s=it([e*Math.sin(this.azimuth),-e*Math.cos(this.azimuth),a]),r=it([Math.cos(this.azimuth),Math.sin(this.azimuth),0]),n=it(pt(s,r));return{right:r,up:n,back:s}}matrix(e,a,s=!1,r=1){let n=Math.max(.01,e/Math.max(1,a)),{up:i,back:o}=this.basis(),c=Qe(this.focus,De(o,this.distance)),d=si(c,this.focus,i),h=s?ni(this.orthoScale*r*n,this.orthoScale*r,-this.sceneRadius*40,this.sceneRadius*40):ri(this.fov,n,Math.max(this.sceneRadius*5e-4,this.distance-this.sceneRadius*3.5),this.distance+this.sceneRadius*4.5);return ts(h,d)}orbit(e,a){let s=Math.sin(this.targetPolar)<0?-1:1;this.targetAzimuth-=s*e*.006,this.targetPolar=ii(this.targetPolar-a*.006)}isBelow(){return Math.cos(this.targetPolar)<0}pan(e,a,s,r=!1){let{right:n,up:i}=this.basis(),o=r?this.targetOrthoScale/Math.max(1,s):2*this.targetDistance*Math.tan(this.fov/2)/Math.max(1,s),c=Qe(De(n,-e*o),De(i,a*o));this.targetFocus=Qe(this.targetFocus,c)}dolly(e,a=!1){let s=Math.exp(e*.0032);a?this.targetOrthoScale=ne(this.targetOrthoScale*s,this.sceneRadius*.008,this.sceneRadius*24):this.targetDistance=ne(this.targetDistance*s,this.sceneRadius*.01,this.sceneRadius*48)}frame(e){if(!e)return;let a=wa(e);this.targetFocus=_r(e),this.targetDistance=Math.max(a*2.8,this.sceneRadius*.02),this.targetOrthoScale=Math.max(a*2.15,this.sceneRadius*.02)}setFocus(e){this.targetFocus=[...e]}setAxis(e,a=!1){e==="z"?(this.targetAzimuth=0,this.targetPolar=a?Math.PI-.015:.015):e==="x"?(this.targetAzimuth=a?-Math.PI/2:Math.PI/2,this.targetPolar=Math.PI/2):(this.targetAzimuth=a?0:Math.PI,this.targetPolar=Math.PI/2)}rotateZ(e=1){this.targetAzimuth+=e*Math.PI/2}flip(){this.targetPolar=ii(Math.PI-this.targetPolar)}};function ii(t){return Math.atan2(Math.sin(t),Math.cos(t))}function oi(t,e,a){let s=Math.atan2(Math.sin(e-t),Math.cos(e-t));return t+s*a}var as=class t{static async create(e,a,s={}){let r=await fetch(a,{cache:"default"});if(!r.ok)throw new Error(`Failed to load BoM ${a}: ${r.status}`);let n=await r.json();if(n.schema!=="prism.bom_a0")throw new Error(`Unsupported BoM schema: ${n.schema||"missing"}`);let i=new t(e,n,s);return i.render(),i}constructor(e,a,s){this.container=e,this.payload=a,this.callbacks=s,this.query="",this.selectedRowId="",this.selectedReference="",this.rowsById=new Map((a.rows||[]).map(r=>[r.id,r])),this.componentIndex=new Map(Object.entries(a.componentIndex||{}))}setSelectionByReference(e,a={}){let s=this.componentIndex.get(e);s&&(this.selectedReference=e,this.selectedRowId=s.rowId,this.renderContent(),a.scroll&&this.container.querySelector(`[data-row-id="${au(s.rowId)}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}))}clearSelection(){this.selectedReference="",this.selectedRowId="",this.renderContent()}render(){let e=this.filteredRows();this.container.innerHTML=`
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
            <tr>${a.map(r=>`<th>${Le(r)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${e.map(r=>this.rowHtml(r,a)).join("")}
          </tbody>
        </table>
      </div>
      ${s?`<aside class="bom-detail">${this.detailHtml(s)}</aside>`:""}
    `}filteredRows(){let e=this.query.trim().toLowerCase(),a=this.payload.rows||[];return e?a.filter(s=>JSON.stringify(s).toLowerCase().includes(e)):a}rowHtml(e,a){return`
      <tr class="${e.id===this.selectedRowId?"selected":""}" data-row-id="${Le(e.id)}">
        ${a.map(r=>{let n=e.fields?.[r]||"";return r==="Reference"?`<td class="bom-reference-cell">${(e.references||[]).map(i=>`
              <button class="bom-ref-chip ${i===this.selectedReference?"active":""}" data-reference="${Le(i)}">${Le(i)}</button>
            `).join("")}</td>`:!n&&tu(r)?'<td><span class="bom-missing">Missing</span></td>':`<td title="${Le(n)}">${Le(n)}</td>`}).join("")}
      </tr>
    `}detailHtml(e){let a=eu(e,this.payload.displayColumns||[],this.payload.extraColumns||[]);return`
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
        ${a.map(([s,r])=>`
          <div>
            <dt>${Le(s)}</dt>
            <dd>${Le(r)}</dd>
          </div>
        `).join("")}
      </dl>
    `}bind(){let e=this.container.querySelector("#bom-search");e?.addEventListener("input",()=>{this.query=e.value,this.renderContent()}),this.bindContent(this.container)}bindContent(e){e.querySelectorAll("[data-row-id]").forEach(a=>{a.addEventListener("click",s=>{s.target.closest("[data-reference]")||(this.selectedRowId=a.dataset.rowId,this.selectedReference="",this.renderContent())})}),e.querySelectorAll("[data-reference]").forEach(a=>{a.addEventListener("click",s=>{s.stopPropagation();let r=a.dataset.reference;this.setSelectionByReference(r),this.callbacks.onSelectReference?.(r)})})}};function eu(t,e,a){let s=[],r=new Set(["Reference","Qty"].map(Nr));for(let i of e){if(i==="Reference"||i==="Qty")continue;let o=t.fields?.[i]||"";o&&(s.push([i,o]),r.add(Nr(i)))}let n=t.canonicalFields||{};for(let i of a){let o=n[i]||"";if(!o)continue;let c=Nr(i);r.has(c)||(r.add(c),s.push([i,o]))}return s}function Nr(t){return String(t||"").toLowerCase().replace(/[\s_\-()[\]/]+/g,"")}function tu(t){return["Manufacturer Part Number","Vendor Part Number","Datasheet","Footprint","Value"].includes(t)}function Le(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function au(t){return String(t).replace(/["\\]/g,"\\$&")}function Cr(t){let e=`${t.nodeName||""} ${t.meshName||""} ${t.material?.name||""}`.toLowerCase();return e.includes("_pad")||e.includes(".pad")||e.endsWith("pad")?"pad":e.includes("silkscreen")?"silkscreen":e.includes("soldermask")?"soldermask":e.includes("paste")?"paste":"substrate"}function ss(t,e=()=>""){let a=new Map;for(let s of t){let n=`${e(s)}:${JSON.stringify(s.material)}`;a.has(n)||a.set(n,[]),a.get(n).push(s)}return[...a.values()].map(s=>{let r=s.reduce((f,l)=>f+l.position.length/3,0),n=s.reduce((f,l)=>f+l.indices.length,0),i=new Float32Array(r*3),o=new Float32Array(r*3),c=new Uint32Array(r),d=new Uint32Array(r),h=new Uint32Array(n),u=0,m=0,p=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let f of s){let l=f.position.length/3;i.set(f.position,u*3),o.set(f.normal,u*3),c.set(f.netId,u),d.set(f.objectFeatureId,u);for(let y=0;y<f.indices.length;y+=1)h[m+y]=Number(f.indices[y])+u;f.bounds&&(p[0]=Math.min(p[0],f.bounds[0]),p[1]=Math.min(p[1],f.bounds[1]),p[2]=Math.min(p[2],f.bounds[2]),p[3]=Math.max(p[3],f.bounds[3]),p[4]=Math.max(p[4],f.bounds[4]),p[5]=Math.max(p[5],f.bounds[5])),u+=l,m+=f.indices.length}return{position:i,normal:o,netId:c,objectFeatureId:d,indices:h,material:s[0].material,groupKey:e(s[0]),bounds:Number.isFinite(p[0])?p:null}})}function Ea(t){return!t||t.length!==6?null:[t[0]/1e3,-t[4]/1e3,t[2]/1e3,t[3]/1e3,-t[1]/1e3,t[5]/1e3]}function rs(t){let e=t?.min||[0,0,0],a=t?.max||[.08,.0016,.05];return[e[0],-a[2],e[1],a[0],-e[2],a[1]]}function sa(t){let e=t.filter(a=>Array.isArray(a)&&a.length===6);return e.length?e.reduce((a,s)=>[Math.min(a[0],s[0]),Math.min(a[1],s[1]),Math.min(a[2],s[2]),Math.max(a[3],s[3]),Math.max(a[4],s[4]),Math.max(a[5],s[5])],[...e[0]]):null}function ci(t){let e=t.replace("#","");return[0,2,4].map(a=>parseInt(e.slice(a,a+2),16)/255)}function li(t,e){if(typeof t?.color=="string"&&/^#[0-9a-fA-F]{6}$/.test(t.color))return[...ci(t.color),1];let a={"F.Cu":"#a9423c","B.Cu":"#315b9a","In1.Cu":"#477a55","In2.Cu":"#806244","In3.Cu":"#347c86","In4.Cu":"#685889","In5.Cu":"#92793e"},s=["#477a55","#806244","#347c86","#685889","#92793e","#82556e"],r=String(t?.name||""),n=Math.max(0,e.findIndex(i=>i.name===r)-1);return[...ci(a[r]||s[n%s.length]),1]}function di(t,e){let a=e.map(s=>[Number(s.id),Number(s.z_mm||0)]);return a.length<3?!1:(a.sort((s,r)=>s[1]-r[1]),t!==a[0][0]&&t!==a[a.length-1][0])}var Ma=Object.freeze({gold:[.83,.69,.37,1],silver:[.74,.75,.77,1],copper:[.76,.47,.28,1]});function ui(t){let e=String(t||"").toLowerCase();return/hasl|hal\b|tin|silver|lead/.test(e)?Ma.silver:/osp|bare|none/.test(e)?Ma.copper:Ma.gold}function fi(t,e){let a=String(t?.name||"");return!!a&&(a===e[0]?.name||a===e[e.length-1]?.name)}function hi(t,e){let a=String(t.material?.name||"").endsWith("_bottom"),s=e.find(r=>r.name===(a?"B.Cu":"F.Cu"))||(a?e[e.length-1]:e[0]);return Number(s?.id||0)}function bi(t,e=new Map){let a=new Map;for(let r of t||[]){let n=String(r?.designator||"");if(!n)continue;let i=a.get(n)||{reference:n,featureIds:new Set,modelCount:0},o=Number(r?.featureId)||0;o>0&&i.featureIds.add(o),a.set(n,i)}for(let[r,n]of e||[]){let i=a.get(String(r));i&&(i.modelCount=Math.max(i.modelCount,Number(n)||0))}let s=new Map;for(let[r,n]of a)s.set(r,{reference:r,featureIds:[...n.featureIds].sort((i,o)=>i-o),ambiguous:n.featureIds.size>1||n.modelCount>1});return s}function pi(t,e){let a=[...new Set((Array.isArray(t)?t:[]).map(c=>String(c||"")).filter(Boolean))],s=[],r=[],n=[],i=new Set,o=new Set;for(let c of a){let d=e.get(c);if(!d){n.push(c);continue}if(d.ambiguous){r.push(c);continue}s.push(c),o.add(c);for(let h of d.featureIds)i.add(h)}return{requested:a,applied:s,ambiguous:r,unknown:n,hiddenFeatureIds:i,hiddenReferences:o}}function ns(t,e){return!!t&&e.has(String(t))}var su={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function G(t){return String(t??"").replace(/[&<>"']/g,e=>su[e])}var Ta=`
fn netEmphasized(id: u32) -> bool {
  return id != 0u && id < arrayLength(&netMask) && netMask[id] != 0u;
}
`;function is(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function gi(t,e=0){let a=0;for(let r of is(t))a=Math.max(a,r);let s=64;for(;s<a+1;)s*=2;return Math.max(s,Math.floor(e)||0)}function mi(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(0);for(let r of is(t))r<a&&(s[r]=1);return s}function Vt(t,e){return!Array.isArray(t)||!e?null:t.find(a=>a.name===e||Array.isArray(a.aliases)&&a.aliases.includes(e))||null}function yi(t,e){let a=new Set;if(!Array.isArray(t)||!Array.isArray(e))return a;for(let s of e){if(!s)continue;let r=s.netUid&&t.find(i=>i.uid===s.netUid)||s.netName&&Vt(t,s.netName),n=Number(r?.id);Number.isInteger(n)&&n>0&&a.add(n)}return a}var Fr=Object.freeze([[.08,1,.2],[1,.72,.1],[.2,.75,1],[1,.3,.75],[.65,.45,1],[1,.45,.2],[.3,1,.85],[.95,.95,.3]]),xi=`
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
`;function wi(t){let e=null;return Array.isArray(t)&&t.length>=3&&t.slice(0,3).every(a=>Number.isFinite(Number(a)))?e=t.slice(0,3).map(a=>Math.round(Math.min(1,Math.max(0,Number(a)))*255)):typeof t=="string"&&/^#[0-9a-f]{6}$/i.test(t)&&(e=[1,3,5].map(a=>parseInt(t.slice(a,a+2),16))),e?(1<<24|e[0]<<16|e[1]<<8|e[2])>>>0:1}function vi(t){let e=1;for(let s of t)for(let r of s?.keys()||[])e=Math.max(e,r+1);let a=new Uint32Array(Math.max(64,t.length*e));return t.forEach((s,r)=>{for(let[n,i]of s||[])Number.isInteger(n)&&n>0&&(a[r*e+n]=i>>>0)}),{stride:e,data:a}}var Mi=class{_listeners={};addEventListener(t,e){let a=this._listeners;return a[t]===void 0&&(a[t]=[]),a[t].indexOf(e)===-1&&a[t].push(e),this}removeEventListener(t,e){let a=this._listeners[t];if(a!==void 0){let s=a.indexOf(e);s!==-1&&a.splice(s,1)}return this}dispatchEvent(t){let e=this._listeners[t.type];if(e!==void 0){let a=e.slice(0);for(let s=0,r=a.length;s<r;s++)a[s].call(this,t)}return this}dispose(){for(let t in this._listeners)delete this._listeners[t]}},mt=class{_disposed=!1;_name;_parent;_child;_attributes;constructor(t,e,a,s={}){if(this._name=t,this._parent=e,this._child=a,this._attributes=s,!e.isOnGraph(a))throw new Error("Cannot connect disconnected graphs.")}getName(){return this._name}getParent(){return this._parent}getChild(){return this._child}setChild(t){return this._child=t,this}getAttributes(){return this._attributes}dispose(){this._disposed||(this._parent._destroyRef(this),this._disposed=!0)}isDisposed(){return this._disposed}},Br=class extends Mi{_emptySet=new Set;_edges=new Set;_parentEdges=new Map;_childEdges=new Map;listEdges(){return Array.from(this._edges)}listParentEdges(t){return Array.from(this._childEdges.get(t)||this._emptySet)}listParents(t){let e=new Set;for(let a of this.listParentEdges(t))e.add(a.getParent());return Array.from(e)}listChildEdges(t){return Array.from(this._parentEdges.get(t)||this._emptySet)}listChildren(t){let e=new Set;for(let a of this.listChildEdges(t))e.add(a.getChild());return Array.from(e)}disconnectParents(t,e){for(let a of this.listParentEdges(t))(!e||e(a.getParent()))&&a.dispose();return this}_createEdge(t,e,a,s){let r=new mt(t,e,a,s);this._edges.add(r);let n=r.getParent();this._parentEdges.has(n)||this._parentEdges.set(n,new Set),this._parentEdges.get(n).add(r);let i=r.getChild();return this._childEdges.has(i)||this._childEdges.set(i,new Set),this._childEdges.get(i).add(r),r}_destroyEdge(t){return this._edges.delete(t),this._parentEdges.get(t.getParent()).delete(t),this._childEdges.get(t.getChild()).delete(t),this}},xe=class{list=[];constructor(t){if(t)for(let e of t)this.list.push(e)}add(t){this.list.push(t)}remove(t){let e=this.list.indexOf(t);e>=0&&this.list.splice(e,1)}removeChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);for(let a of e)this.remove(a);return e}listRefsByChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);return e}values(){return this.list}},ae=class{set=new Set;map=new Map;constructor(t){if(t)for(let e of t)this.add(e)}add(t){let e=t.getChild();this.removeChild(e),this.set.add(t),this.map.set(e,t)}remove(t){this.set.delete(t),this.map.delete(t.getChild())}removeChild(t){let e=this.map.get(t)||null;return e&&this.remove(e),e}getRefByChild(t){return this.map.get(t)||null}values(){return Array.from(this.set)}},ue=class{map={};constructor(t){t&&Object.assign(this.map,t)}set(t,e){this.map[t]=e}delete(t){delete this.map[t]}get(t){return this.map[t]||null}keys(){return Object.keys(this.map)}values(){return Object.values(this.map)}},Q=Symbol("attributes"),gt=Symbol("immutableKeys"),Ei=class Ti extends Mi{_disposed=!1;graph;[Q];[gt];constructor(e){super(),this.graph=e,this[gt]=new Set,this[Q]=this._createAttributes()}getDefaults(){return{}}_createAttributes(){let e=this.getDefaults(),a={};for(let s in e){let r=e[s];if(r instanceof Ti){let n=this.graph._createEdge(s,this,r);this[gt].add(s),a[s]=n}else a[s]=r}return a}isOnGraph(e){return this.graph===e.graph}isDisposed(){return this._disposed}dispose(){this._disposed||(this.graph.listChildEdges(this).forEach(e=>e.dispose()),this.graph.disconnectParents(this),this._disposed=!0,this.dispatchEvent({type:"dispose"}))}detach(){return this.graph.disconnectParents(this),this}swap(e,a){for(let s in this[Q]){let r=this[Q][s];if(r instanceof mt){let n=r;n.getChild()===e&&this.setRef(s,a,n.getAttributes())}else if(r instanceof xe)for(let n of r.listRefsByChild(e)){let i=n.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}else if(r instanceof ae){let n=r.getRefByChild(e);if(n){let i=n.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}}else if(r instanceof ue)for(let n of r.keys()){let i=r.get(n);i.getChild()===e&&this.setRefMap(s,n,a,i.getAttributes())}}return this}get(e){return this[Q][e]}set(e,a){return this[Q][e]=a,this.dispatchEvent({type:"change",attribute:e})}getRef(e){let a=this[Q][e];return a?a.getChild():null}setRef(e,a,s){if(this[gt].has(e))throw new Error(`Cannot overwrite immutable attribute, "${e}".`);let r=this[Q][e];if(r&&r.dispose(),!a)return this;let n=this.graph._createEdge(e,this,a,s);return this[Q][e]=n,this.dispatchEvent({type:"change",attribute:e})}listRefs(e){return this.assertRefList(e).values().map(a=>a.getChild())}addRef(e,a,s){let r=this.graph._createEdge(e,this,a,s);return this.assertRefList(e).add(r),this.dispatchEvent({type:"change",attribute:e})}removeRef(e,a){let s=this.assertRefList(e);if(s instanceof xe)for(let r of s.listRefsByChild(a))r.dispose();else{let r=s.getRefByChild(a);r&&r.dispose()}return this}assertRefList(e){let a=this[Q][e];if(a instanceof xe||a instanceof ae)return a;throw new Error(`Expected RefList or RefSet for attribute "${e}"`)}listRefMapKeys(e){return this.assertRefMap(e).keys()}listRefMapValues(e){return this.assertRefMap(e).values().map(a=>a.getChild())}getRefMap(e,a){let s=this.assertRefMap(e).get(a);return s?s.getChild():null}setRefMap(e,a,s,r){let n=this.assertRefMap(e),i=n.get(a);if(i&&i.dispose(),!s)return this;r=Object.assign(r||{},{key:a});let o=this.graph._createEdge(e,this,s,{...r,key:a});return n.set(a,o),this.dispatchEvent({type:"change",attribute:e,key:a})}assertRefMap(e){let a=this[Q][e];if(a instanceof ue)return a;throw new Error(`Expected RefMap for attribute "${e}"`)}dispatchEvent(e){return super.dispatchEvent({...e,target:this}),this.graph.dispatchEvent({...e,target:this,type:`node:${e.type}`}),this}_destroyRef(e){let a=e.getName();if(this[Q][a]===e)this[Q][a]=null,this[gt].has(a)&&e.getChild().dispose();else if(this[Q][a]instanceof xe)this[Q][a].remove(e);else if(this[Q][a]instanceof ae)this[Q][a].remove(e);else if(this[Q][a]instanceof ue){let s=this[Q][a];for(let r of s.keys())s.get(r)===e&&s.delete(r)}else return;this.graph._destroyEdge(e),this.dispatchEvent({type:"change",attribute:a})}};var Ni="v4.4.2",xt="@glb.bin",C=(function(t){return t.ACCESSOR="Accessor",t.ANIMATION="Animation",t.ANIMATION_CHANNEL="AnimationChannel",t.ANIMATION_SAMPLER="AnimationSampler",t.BUFFER="Buffer",t.CAMERA="Camera",t.MATERIAL="Material",t.MESH="Mesh",t.PRIMITIVE="Primitive",t.PRIMITIVE_TARGET="PrimitiveTarget",t.NODE="Node",t.ROOT="Root",t.SCENE="Scene",t.SKIN="Skin",t.TEXTURE="Texture",t.TEXTURE_INFO="TextureInfo",t})({});var ru=(function(t){return t.ARRAY_BUFFER="ARRAY_BUFFER",t.ELEMENT_ARRAY_BUFFER="ELEMENT_ARRAY_BUFFER",t.INVERSE_BIND_MATRICES="INVERSE_BIND_MATRICES",t.OTHER="OTHER",t.SPARSE="SPARSE",t})({}),Ve=(function(t){return t[t.R=4096]="R",t[t.G=256]="G",t[t.B=16]="B",t[t.A=1]="A",t})({});var nu=class extends Float32Array{constructor(){throw super(),new Error("Unsupported typed array instantiation.")}},bs={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5131:typeof Float16Array<"u"?Float16Array:nu,5126:Float32Array,5130:Float64Array},H=class{static createBufferFromDataURI(t){if(typeof Buffer>"u"){let e=atob(t.split(",")[1]),a=new Uint8Array(e.length);for(let s=0;s<e.length;s++)a[s]=e.charCodeAt(s);return a}else{let e=t.split(",")[1],a=t.indexOf("base64")>=0;return Buffer.from(e,a?"base64":"utf8")}}static encodeText(t){return new TextEncoder().encode(t)}static decodeText(t){return new TextDecoder().decode(t)}static concat(t){let e=0;for(let r of t)e+=r.byteLength;let a=new Uint8Array(e),s=0;for(let r of t)a.set(r,s),s+=r.byteLength;return a}static pad(t,e=0){let a=this.padNumber(t.byteLength);if(a===t.byteLength)return t;let s=new Uint8Array(a);if(s.set(t),e!==0)for(let r=t.byteLength;r<a;r++)s[r]=e;return s}static padNumber(t){return Math.ceil(t/4)*4}static equals(t,e){if(t===e)return!0;if(t.byteLength!==e.byteLength)return!1;let a=t.byteLength;for(;a--;)if(t[a]!==e[a])return!1;return!0}static toView(t,e=0,a=1/0){return new Uint8Array(t.buffer,t.byteOffset+e,Math.min(t.byteLength,a))}static assertView(t){if(t&&!ArrayBuffer.isView(t))throw new Error(`Method requires Uint8Array parameter; received "${typeof t}".`);return t}};var iu=class{match(t){return t.length>=3&&t[0]===255&&t[1]===216&&t[2]===255}getSize(t){let e=new DataView(t.buffer,t.byteOffset+4),a,s;for(;e.byteLength;){if(a=e.getUint16(0,!1),cu(e,a),s=e.getUint8(a+1),s===192||s===193||s===194)return[e.getUint16(a+7,!1),e.getUint16(a+5,!1)];e=new DataView(t.buffer,e.byteOffset+a+2)}throw new TypeError("Invalid JPG, no size found")}getChannels(t){return 3}},ou=class Ci{static PNG_FRIED_CHUNK_NAME="CgBI";match(e){return e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71&&e[4]===13&&e[5]===10&&e[6]===26&&e[7]===10}getSize(e){let a=new DataView(e.buffer,e.byteOffset);return H.decodeText(e.slice(12,16))===Ci.PNG_FRIED_CHUNK_NAME?[a.getUint32(32,!1),a.getUint32(36,!1)]:[a.getUint32(16,!1),a.getUint32(20,!1)]}getChannels(e){return 4}},Ze=class{static impls={"image/jpeg":new iu,"image/png":new ou};static registerFormat(t,e){this.impls[t]=e}static getMimeType(t){for(let e in this.impls)if(this.impls[e].match(t))return e;return null}static getSize(t,e){return this.impls[e]?this.impls[e].getSize(t):null}static getChannels(t,e){return this.impls[e]?this.impls[e].getChannels(t):null}static getVRAMByteLength(t,e){if(!this.impls[e])return null;if(this.impls[e].getVRAMByteLength)return this.impls[e].getVRAMByteLength(t);let a=0,s=4,r=this.getSize(t,e);if(!r)return null;for(;r[0]>1||r[1]>1;)a+=r[0]*r[1]*s,r[0]=Math.max(Math.floor(r[0]/2),1),r[1]=Math.max(Math.floor(r[1]/2),1);return a+=1*s,a}static mimeTypeToExtension(t){return t==="image/jpeg"?"jpg":t.split("/").pop()}static extensionToMimeType(t){return t==="jpg"?"image/jpeg":t?`image/${t}`:""}};function cu(t,e){if(e>t.byteLength)throw new TypeError("Corrupt JPG, exceeded buffer limits");if(t.getUint8(e)!==255)throw new TypeError("Invalid JPG, marker table corrupted");return t}var ra=class{static basename(t){let e=t.split(/[\\/]/).pop();return e.substring(0,e.lastIndexOf("."))}static extension(t){if(t.startsWith("data:image/")){let e=t.match(/data:(image\/\w+)/)[1];return Ze.mimeTypeToExtension(e)}else{if(t.startsWith("data:model/gltf+json"))return"gltf";if(t.startsWith("data:model/gltf-binary"))return"glb";if(t.startsWith("data:application/"))return"bin"}return t.split(/[\\/]/).pop().split(/[.]/).pop()}},Pr=typeof Float32Array<"u"?Float32Array:Array;Math.PI/180;180/Math.PI;function lu(){var t=new Pr(3);return Pr!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function jr(t){var e=t[0],a=t[1],s=t[2];return Math.sqrt(e*e+a*a+s*s)}function du(t,e,a){var s=e[0],r=e[1],n=e[2],i=a[3]*s+a[7]*r+a[11]*n+a[15];return i=i||1,t[0]=(a[0]*s+a[4]*r+a[8]*n+a[12])/i,t[1]=(a[1]*s+a[5]*r+a[9]*n+a[13])/i,t[2]=(a[2]*s+a[6]*r+a[10]*n+a[14])/i,t}(function(){var t=lu();return function(e,a,s,r,n,i){var o,c;for(a||(a=3),s||(s=0),r?c=Math.min(r*a+s,e.length):c=e.length,o=s;o<c;o+=a)t[0]=e[o],t[1]=e[o+1],t[2]=e[o+2],n(t,t,i),e[o]=t[0],e[o+1]=t[1],e[o+2]=t[2];return e}})();function Fi(t){let e=Bi(),a=t.propertyType==="Node"?[t]:t.listChildren();for(let s of a)s.traverse(r=>{let n=r.getMesh();if(!n)return;let i=uu(n,r.getWorldMatrix());i.min.every(isFinite)&&i.max.every(isFinite)&&(Dr(i.min,e),Dr(i.max,e))});return e}function uu(t,e){let a=Bi();for(let s of t.listPrimitives()){let r=s.getAttribute("POSITION"),n=s.getIndices();if(!r)continue;let i=[0,0,0],o=[0,0,0];for(let c=0,d=n?n.getCount():r.getCount();c<d;c++){let h=n?n.getScalar(c):c;i=r.getElement(h,i),o=du(o,i,e),Dr(o,a)}}return a}function Dr(t,e){for(let a=0;a<3;a++)e.min[a]=Math.min(t[a],e.min[a]),e.max[a]=Math.max(t[a],e.max[a])}function Bi(){return{min:[1/0,1/0,1/0],max:[-1/0,-1/0,-1/0]}}var ki="https://null.example",Or=class{static DEFAULT_INIT={};static PROTOCOL_REGEXP=/^[a-zA-Z]+:\/\//;static dirname(t){let e=t.lastIndexOf("/");return e===-1?"./":t.substring(0,e+1)}static basename(t){return ra.basename(new URL(t,ki).pathname)}static extension(t){return ra.extension(new URL(t,ki).pathname)}static resolve(t,e){if(!this.isRelativePath(e))return e;let a=t.split("/"),s=e.split("/");a.pop();for(let r=0;r<s.length;r++)s[r]!=="."&&(s[r]===".."?a.pop():a.push(s[r]));return a.join("/")}static isAbsoluteURL(t){return this.PROTOCOL_REGEXP.test(t)}static isRelativePath(t){return!/^(?:[a-zA-Z]+:)?\//.test(t)}};function Ii(t){return Object.prototype.toString.call(t)==="[object Object]"}function Ht(t){if(Ii(t)===!1)return!1;let e=t.constructor;if(e===void 0)return!0;let a=e.prototype;return!(Ii(a)===!1||Object.hasOwn(a,"isPrototypeOf")===!1)}var fu=(function(t){return t[t.SILENT=4]="SILENT",t[t.ERROR=3]="ERROR",t[t.WARN=2]="WARN",t[t.INFO=1]="INFO",t[t.DEBUG=0]="DEBUG",t})({}),ps=class ji{verbosity;static Verbosity=fu;static DEFAULT_INSTANCE=new ji(1);constructor(e){this.verbosity=e}debug(e){this.verbosity<=0&&console.debug(e)}info(e){this.verbosity<=1&&console.info(e)}warn(e){this.verbosity<=2&&console.warn(e)}error(e){this.verbosity<=3&&console.error(e)}};function hu(t){var e=t[0],a=t[1],s=t[2],r=t[3],n=t[4],i=t[5],o=t[6],c=t[7],d=t[8],h=t[9],u=t[10],m=t[11],p=t[12],f=t[13],l=t[14],y=t[15],b=e*i-a*n,g=e*o-s*n,x=a*o-s*i,v=d*f-h*p,T=d*l-u*p,I=h*l-u*f,S=e*I-a*T+s*v,R=n*I-i*T+o*v,_=d*x-h*g+u*b,A=p*x-f*g+l*b;return c*S-r*R+y*_-m*A}function bu(t,e,a){var s=e[0],r=e[1],n=e[2],i=e[3],o=e[4],c=e[5],d=e[6],h=e[7],u=e[8],m=e[9],p=e[10],f=e[11],l=e[12],y=e[13],b=e[14],g=e[15],x=a[0],v=a[1],T=a[2],I=a[3];return t[0]=x*s+v*o+T*u+I*l,t[1]=x*r+v*c+T*m+I*y,t[2]=x*n+v*d+T*p+I*b,t[3]=x*i+v*h+T*f+I*g,x=a[4],v=a[5],T=a[6],I=a[7],t[4]=x*s+v*o+T*u+I*l,t[5]=x*r+v*c+T*m+I*y,t[6]=x*n+v*d+T*p+I*b,t[7]=x*i+v*h+T*f+I*g,x=a[8],v=a[9],T=a[10],I=a[11],t[8]=x*s+v*o+T*u+I*l,t[9]=x*r+v*c+T*m+I*y,t[10]=x*n+v*d+T*p+I*b,t[11]=x*i+v*h+T*f+I*g,x=a[12],v=a[13],T=a[14],I=a[15],t[12]=x*s+v*o+T*u+I*l,t[13]=x*r+v*c+T*m+I*y,t[14]=x*n+v*d+T*p+I*b,t[15]=x*i+v*h+T*f+I*g,t}function pu(t,e){var a=e[0],s=e[1],r=e[2],n=e[4],i=e[5],o=e[6],c=e[8],d=e[9],h=e[10];return t[0]=Math.sqrt(a*a+s*s+r*r),t[1]=Math.sqrt(n*n+i*i+o*o),t[2]=Math.sqrt(c*c+d*d+h*h),t}function gu(t,e){var a=new Pr(3);pu(a,e);var s=1/a[0],r=1/a[1],n=1/a[2],i=e[0]*s,o=e[1]*r,c=e[2]*n,d=e[4]*s,h=e[5]*r,u=e[6]*n,m=e[8]*s,p=e[9]*r,f=e[10]*n,l=i+h+f,y=0;return l>0?(y=Math.sqrt(l+1)*2,t[3]=.25*y,t[0]=(u-p)/y,t[1]=(m-c)/y,t[2]=(o-d)/y):i>h&&i>f?(y=Math.sqrt(1+i-h-f)*2,t[3]=(u-p)/y,t[0]=.25*y,t[1]=(o+d)/y,t[2]=(m+c)/y):h>f?(y=Math.sqrt(1+h-i-f)*2,t[3]=(m-c)/y,t[0]=(o+d)/y,t[1]=.25*y,t[2]=(u+p)/y):(y=Math.sqrt(1+f-i-h)*2,t[3]=(o-d)/y,t[0]=(m+c)/y,t[1]=(u+p)/y,t[2]=.25*y),t}var ie=class ka{static identity(e){return e}static eq(e,a,s=1e-5){if(e.length!==a.length)return!1;for(let r=0;r<e.length;r++)if(Math.abs(e[r]-a[r])>s)return!1;return!0}static clamp(e,a,s){return e<a?a:e>s?s:e}static decodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return e/65535;case 5121:return e/255;case 5122:return Math.max(e/32767,-1);case 5120:return Math.max(e/127,-1);default:throw new Error("Invalid component type.")}}static encodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return Math.round(ka.clamp(e,0,1)*65535);case 5121:return Math.round(ka.clamp(e,0,1)*255);case 5122:return Math.round(ka.clamp(e,-1,1)*32767);case 5120:return Math.round(ka.clamp(e,-1,1)*127);default:throw new Error("Invalid component type.")}}static decompose(e,a,s,r){let n=jr([e[0],e[1],e[2]]),i=jr([e[4],e[5],e[6]]),o=jr([e[8],e[9],e[10]]);hu(e)<0&&(n=-n),a[0]=e[12],a[1]=e[13],a[2]=e[14];let c=e.slice(),d=1/n,h=1/i,u=1/o;c[0]*=d,c[1]*=d,c[2]*=d,c[4]*=h,c[5]*=h,c[6]*=h,c[8]*=u,c[9]*=u,c[10]*=u,gu(s,c),r[0]=n,r[1]=i,r[2]=o}static compose(e,a,s,r){let n=r,i=a[0],o=a[1],c=a[2],d=a[3],h=i+i,u=o+o,m=c+c,p=i*h,f=i*u,l=i*m,y=o*u,b=o*m,g=c*m,x=d*h,v=d*u,T=d*m,I=s[0],S=s[1],R=s[2];return n[0]=(1-(y+g))*I,n[1]=(f+T)*I,n[2]=(l-v)*I,n[3]=0,n[4]=(f-T)*S,n[5]=(1-(p+g))*S,n[6]=(b+x)*S,n[7]=0,n[8]=(l+v)*R,n[9]=(b-x)*R,n[10]=(1-(p+y))*R,n[11]=0,n[12]=e[0],n[13]=e[1],n[14]=e[2],n[15]=1,n}};function mu(t,e){if(!!t!=!!e)return!1;let a=t.getChild(),s=e.getChild();return a===s||a.equals(s)}function yu(t,e){if(!!t!=!!e)return!1;let a=t.values(),s=e.values();if(a.length!==s.length)return!1;for(let r=0;r<a.length;r++){let n=a[r],i=s[r];if(n.getChild()!==i.getChild()&&!n.getChild().equals(i.getChild()))return!1}return!0}function xu(t,e){if(!!t!=!!e)return!1;let a=t.keys(),s=e.keys();if(a.length!==s.length)return!1;for(let r of a){let n=t.get(r),i=e.get(r);if(!!n!=!!i)return!1;let o=n.getChild(),c=i.getChild();if(o!==c&&!o.equals(c))return!1}return!0}function Oi(t,e){if(t===e)return!0;if(!!t!=!!e||!t||!e||t.length!==e.length)return!1;for(let a=0;a<t.length;a++)if(t[a]!==e[a])return!1;return!0}function Pi(t,e){if(t===e)return!0;if(!!t!=!!e)return!1;if(!Ht(t)||!Ht(e))return t===e;let a=t,s=e,r=0,n=0,i;for(i in a)r++;for(i in s)n++;if(r!==n)return!1;for(i in a){let o=a[i],c=s[i];if(fs(o)&&fs(c)){if(!Oi(o,c))return!1}else if(Ht(o)&&Ht(c)){if(!Pi(o,c))return!1}else if(o!==c)return!1}return!0}function fs(t){return Array.isArray(t)||ArrayBuffer.isView(t)}var wu="23456789abdegjkmnpqrvwxyzABDEGJKMNPQRVWXYZ",vu=999,Mu=6,Si=new Set,Eu=function(){let t="";for(let e=0;e<Mu;e++)t+=wu.charAt(Math.floor(Math.random()*42));return t},Tu=function(){for(let t=0;t<vu;t++){let e=Eu();if(!Si.has(e))return Si.add(e),e}return""},wt=t=>t,ku=new Set,Gr=class extends Ei{constructor(t,e=""){super(t),this[Q].name=e,this.init(),this.dispatchEvent({type:"create"})}getGraph(){return this.graph}getDefaults(){return Object.assign(super.getDefaults(),{name:"",extras:{}})}set(t,e){return Array.isArray(e)&&(e=e.slice()),super.set(t,e)}getName(){return this.get("name")}setName(t){return this.set("name",t)}getExtras(){return this.get("extras")}setExtras(t){return this.set("extras",t)}clone(){let t=this.constructor;return new t(this.graph).copy(this,wt)}copy(t,e=wt){for(let a in this[Q]){let s=this[Q][a];if(s instanceof mt)this[gt].has(a)||s.dispose();else if(s instanceof xe||s instanceof ae)for(let r of s.values())r.dispose();else if(s instanceof ue)for(let r of s.values())r.dispose()}for(let a in t[Q]){let s=this[Q][a],r=t[Q][a];if(r instanceof mt)this[gt].has(a)?s.getChild().copy(e(r.getChild()),e):this.setRef(a,e(r.getChild()),r.getAttributes());else if(r instanceof ae||r instanceof xe)for(let n of r.values())this.addRef(a,e(n.getChild()),n.getAttributes());else if(r instanceof ue)for(let n of r.keys()){let i=r.get(n);this.setRefMap(a,n,e(i.getChild()),i.getAttributes())}else Ht(r)?this[Q][a]=JSON.parse(JSON.stringify(r)):Array.isArray(r)||r instanceof ArrayBuffer||ArrayBuffer.isView(r)?this[Q][a]=r.slice():this[Q][a]=r}return this}equals(t,e=ku){if(this===t)return!0;if(this.propertyType!==t.propertyType)return!1;for(let a in this[Q]){if(e.has(a))continue;let s=this[Q][a],r=t[Q][a];if(s instanceof mt||r instanceof mt){if(!mu(s,r))return!1}else if(s instanceof ae||r instanceof ae||s instanceof xe||r instanceof xe){if(!yu(s,r))return!1}else if(s instanceof ue||r instanceof ue){if(!xu(s,r))return!1}else if(Ht(s)||Ht(r)){if(!Pi(s,r))return!1}else if(fs(s)||fs(r)){if(!Oi(s,r))return!1}else if(s!==r)return!1}return!0}detach(){return this.graph.disconnectParents(this,t=>t.propertyType!=="Root"),this}listParents(){return this.graph.listParents(this)}},Ee=class extends Gr{getDefaults(){return Object.assign(super.getDefaults(),{extensions:new ue})}getExtension(t){return this.getRefMap("extensions",t)}setExtension(t,e){return e&&e._validateParent(this),this.setRefMap("extensions",t,e)}listExtensions(){return this.listRefMapValues("extensions")}},U=class fe extends Ee{static Type={SCALAR:"SCALAR",VEC2:"VEC2",VEC3:"VEC3",VEC4:"VEC4",MAT2:"MAT2",MAT3:"MAT3",MAT4:"MAT4"};static ComponentType={BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,FLOAT:5126,FLOAT16:5131,FLOAT64:5130};init(){this.propertyType="Accessor"}getDefaults(){return Object.assign(super.getDefaults(),{array:null,type:fe.Type.SCALAR,componentType:fe.ComponentType.FLOAT,normalized:!1,sparse:!1,buffer:null})}static getElementSize(e){switch(e){case fe.Type.SCALAR:return 1;case fe.Type.VEC2:return 2;case fe.Type.VEC3:return 3;case fe.Type.VEC4:return 4;case fe.Type.MAT2:return 4;case fe.Type.MAT3:return 9;case fe.Type.MAT4:return 16;default:throw new Error("Unexpected type: "+e)}}static getComponentSize(e){switch(e){case fe.ComponentType.BYTE:case fe.ComponentType.UNSIGNED_BYTE:return 1;case fe.ComponentType.SHORT:case fe.ComponentType.UNSIGNED_SHORT:return 2;case fe.ComponentType.UNSIGNED_INT:case fe.ComponentType.FLOAT:return 4;case fe.ComponentType.FLOAT16:return 2;case fe.ComponentType.FLOAT64:return 8;default:throw new Error("Unexpected component type: "+e)}}getMinNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),r=this.getComponentType();if(this.getMin(e),a)for(let n=0;n<s;n++)e[n]=ie.decodeNormalizedInt(e[n],r);return e}getMin(e){let a=this.getArray(),s=this.getCount(),r=this.getElementSize();for(let n=0;n<r;n++)e[n]=1/0;for(let n=0;n<s*r;n+=r)for(let i=0;i<r;i++){let o=a[n+i];Number.isFinite(o)&&(e[i]=Math.min(e[i],o))}return e}getMaxNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),r=this.getComponentType();if(this.getMax(e),a)for(let n=0;n<s;n++)e[n]=ie.decodeNormalizedInt(e[n],r);return e}getMax(e){let a=this.get("array"),s=this.getCount(),r=this.getElementSize();for(let n=0;n<r;n++)e[n]=-1/0;for(let n=0;n<s*r;n+=r)for(let i=0;i<r;i++){let o=a[n+i];Number.isFinite(o)&&(e[i]=Math.max(e[i],o))}return e}getCount(){let e=this.get("array");return e?e.length/this.getElementSize():0}getType(){return this.get("type")}setType(e){return this.set("type",e)}getElementSize(){return fe.getElementSize(this.get("type"))}getComponentSize(){return this.get("array").BYTES_PER_ELEMENT}getComponentType(){return this.get("componentType")}getNormalized(){return this.get("normalized")}setNormalized(e){return this.set("normalized",e)}getScalar(e){let a=this.getElementSize(),s=this.getComponentType(),r=this.getArray();return this.getNormalized()?ie.decodeNormalizedInt(r[e*a],s):r[e*a]}setScalar(e,a){let s=this.getElementSize(),r=this.getComponentType(),n=this.getArray();return this.getNormalized()?n[e*s]=ie.encodeNormalizedInt(a,r):n[e*s]=a,this}getElement(e,a){let s=this.getNormalized(),r=this.getElementSize(),n=this.getComponentType(),i=this.getArray();for(let o=0;o<r;o++)s?a[o]=ie.decodeNormalizedInt(i[e*r+o],n):a[o]=i[e*r+o];return a}setElement(e,a){let s=this.getNormalized(),r=this.getElementSize(),n=this.getComponentType(),i=this.getArray();for(let o=0;o<r;o++)s?i[e*r+o]=ie.encodeNormalizedInt(a[o],n):i[e*r+o]=a[o];return this}getSparse(){return this.get("sparse")}setSparse(e){return this.set("sparse",e)}getBuffer(){return this.getRef("buffer")}setBuffer(e){return this.setRef("buffer",e)}getArray(){return this.get("array")}setArray(e){return this.set("componentType",e?Iu(e):fe.ComponentType.FLOAT),this.set("array",e),this}getByteLength(){let e=this.get("array");return e?e.byteLength:0}};function Iu(t){switch(t.constructor){case Float32Array:return U.ComponentType.FLOAT;case Uint32Array:return U.ComponentType.UNSIGNED_INT;case Uint16Array:return U.ComponentType.UNSIGNED_SHORT;case Uint8Array:return U.ComponentType.UNSIGNED_BYTE;case Int16Array:return U.ComponentType.SHORT;case Int8Array:return U.ComponentType.BYTE;case Float64Array:return U.ComponentType.FLOAT64}if(typeof Float16Array<"u"&&t.constructor===Float16Array)return U.ComponentType.FLOAT16;throw new Error("Unknown accessor componentType.")}var Di=class extends Ee{init(){this.propertyType="Animation"}getDefaults(){return Object.assign(super.getDefaults(),{channels:new ae,samplers:new ae})}addChannel(t){return this.addRef("channels",t)}removeChannel(t){return this.removeRef("channels",t)}listChannels(){return this.listRefs("channels")}addSampler(t){return this.addRef("samplers",t)}removeSampler(t){return this.removeRef("samplers",t)}listSamplers(){return this.listRefs("samplers")}},Kr=class extends Ee{static TargetPath={TRANSLATION:"translation",ROTATION:"rotation",SCALE:"scale",WEIGHTS:"weights"};init(){this.propertyType="AnimationChannel"}getDefaults(){return Object.assign(super.getDefaults(),{targetPath:null,targetNode:null,sampler:null})}getTargetPath(){return this.get("targetPath")}setTargetPath(t){return this.set("targetPath",t)}getTargetNode(){return this.getRef("targetNode")}setTargetNode(t){return this.setRef("targetNode",t)}getSampler(){return this.getRef("sampler")}setSampler(t){return this.setRef("sampler",t)}},gs=class Li extends Ee{static Interpolation={LINEAR:"LINEAR",STEP:"STEP",CUBICSPLINE:"CUBICSPLINE"};init(){this.propertyType="AnimationSampler"}getDefaultAttributes(){return Object.assign(super.getDefaults(),{interpolation:Li.Interpolation.LINEAR,input:null,output:null})}getInterpolation(){return this.get("interpolation")}setInterpolation(e){return this.set("interpolation",e)}getInput(){return this.getRef("input")}setInput(e){return this.setRef("input",e,{usage:"OTHER"})}getOutput(){return this.getRef("output")}setOutput(e){return this.setRef("output",e,{usage:"OTHER"})}},Ui=class extends Ee{init(){this.propertyType="Buffer"}getDefaults(){return Object.assign(super.getDefaults(),{uri:""})}getURI(){return this.get("uri")}setURI(t){return this.set("uri",t)}},ms=class Gi extends Ee{static Type={PERSPECTIVE:"perspective",ORTHOGRAPHIC:"orthographic"};init(){this.propertyType="Camera"}getDefaults(){return Object.assign(super.getDefaults(),{type:Gi.Type.PERSPECTIVE,znear:.1,zfar:100,aspectRatio:null,yfov:Math.PI*2*50/360,xmag:1,ymag:1})}getType(){return this.get("type")}setType(e){return this.set("type",e)}getZNear(){return this.get("znear")}setZNear(e){return this.set("znear",e)}getZFar(){return this.get("zfar")}setZFar(e){return this.set("zfar",e)}getAspectRatio(){return this.get("aspectRatio")}setAspectRatio(e){return this.set("aspectRatio",e)}getYFov(){return this.get("yfov")}setYFov(e){return this.set("yfov",e)}getXMag(){return this.get("xmag")}setXMag(e){return this.set("xmag",e)}getYMag(){return this.get("ymag")}setYMag(e){return this.set("ymag",e)}},X=class extends Gr{static EXTENSION_NAME;_validateParent(t){if(!this.parentTypes.includes(t.propertyType))throw new Error(`Parent "${t.propertyType}" invalid for child "${this.propertyType}".`)}},re=class Lr extends Ee{static WrapMode={CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497};static MagFilter={NEAREST:9728,LINEAR:9729};static MinFilter={NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987};init(){this.propertyType="TextureInfo"}getDefaults(){return Object.assign(super.getDefaults(),{texCoord:0,magFilter:null,minFilter:null,wrapS:Lr.WrapMode.REPEAT,wrapT:Lr.WrapMode.REPEAT})}getTexCoord(){return this.get("texCoord")}setTexCoord(e){return this.set("texCoord",e)}getMagFilter(){return this.get("magFilter")}setMagFilter(e){return this.set("magFilter",e)}getMinFilter(){return this.get("minFilter")}setMinFilter(e){return this.set("minFilter",e)}getWrapS(){return this.get("wrapS")}setWrapS(e){return this.set("wrapS",e)}getWrapT(){return this.get("wrapT")}setWrapT(e){return this.set("wrapT",e)}},{R:os,G:cs,B:ls,A:Su}=Ve,hs=class Ki extends Ee{static AlphaMode={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};init(){this.propertyType="Material"}getDefaults(){return Object.assign(super.getDefaults(),{alphaMode:Ki.AlphaMode.OPAQUE,alphaCutoff:.5,doubleSided:!1,baseColorFactor:[1,1,1,1],baseColorTexture:null,baseColorTextureInfo:new re(this.graph,"baseColorTextureInfo"),emissiveFactor:[0,0,0],emissiveTexture:null,emissiveTextureInfo:new re(this.graph,"emissiveTextureInfo"),normalScale:1,normalTexture:null,normalTextureInfo:new re(this.graph,"normalTextureInfo"),occlusionStrength:1,occlusionTexture:null,occlusionTextureInfo:new re(this.graph,"occlusionTextureInfo"),roughnessFactor:1,metallicFactor:1,metallicRoughnessTexture:null,metallicRoughnessTextureInfo:new re(this.graph,"metallicRoughnessTextureInfo")})}getDoubleSided(){return this.get("doubleSided")}setDoubleSided(e){return this.set("doubleSided",e)}getAlpha(){return this.get("baseColorFactor")[3]}setAlpha(e){let a=this.get("baseColorFactor").slice();return a[3]=e,this.set("baseColorFactor",a)}getAlphaMode(){return this.get("alphaMode")}setAlphaMode(e){return this.set("alphaMode",e)}getAlphaCutoff(){return this.get("alphaCutoff")}setAlphaCutoff(e){return this.set("alphaCutoff",e)}getBaseColorFactor(){return this.get("baseColorFactor")}setBaseColorFactor(e){return this.set("baseColorFactor",e)}getBaseColorTexture(){return this.getRef("baseColorTexture")}getBaseColorTextureInfo(){return this.getRef("baseColorTexture")?this.getRef("baseColorTextureInfo"):null}setBaseColorTexture(e){return this.setRef("baseColorTexture",e,{channels:os|cs|ls|Su,isColor:!0})}getEmissiveFactor(){return this.get("emissiveFactor")}setEmissiveFactor(e){return this.set("emissiveFactor",e)}getEmissiveTexture(){return this.getRef("emissiveTexture")}getEmissiveTextureInfo(){return this.getRef("emissiveTexture")?this.getRef("emissiveTextureInfo"):null}setEmissiveTexture(e){return this.setRef("emissiveTexture",e,{channels:os|cs|ls,isColor:!0})}getNormalScale(){return this.get("normalScale")}setNormalScale(e){return this.set("normalScale",e)}getNormalTexture(){return this.getRef("normalTexture")}getNormalTextureInfo(){return this.getRef("normalTexture")?this.getRef("normalTextureInfo"):null}setNormalTexture(e){return this.setRef("normalTexture",e,{channels:os|cs|ls})}getOcclusionStrength(){return this.get("occlusionStrength")}setOcclusionStrength(e){return this.set("occlusionStrength",e)}getOcclusionTexture(){return this.getRef("occlusionTexture")}getOcclusionTextureInfo(){return this.getRef("occlusionTexture")?this.getRef("occlusionTextureInfo"):null}setOcclusionTexture(e){return this.setRef("occlusionTexture",e,{channels:os})}getRoughnessFactor(){return this.get("roughnessFactor")}setRoughnessFactor(e){return this.set("roughnessFactor",e)}getMetallicFactor(){return this.get("metallicFactor")}setMetallicFactor(e){return this.set("metallicFactor",e)}getMetallicRoughnessTexture(){return this.getRef("metallicRoughnessTexture")}getMetallicRoughnessTextureInfo(){return this.getRef("metallicRoughnessTexture")?this.getRef("metallicRoughnessTextureInfo"):null}setMetallicRoughnessTexture(e){return this.setRef("metallicRoughnessTexture",e,{channels:cs|ls})}},zi=class extends Ee{init(){this.propertyType="Mesh"}getDefaults(){return Object.assign(super.getDefaults(),{weights:[],primitives:new ae})}addPrimitive(t){return this.addRef("primitives",t)}removePrimitive(t){return this.removeRef("primitives",t)}listPrimitives(){return this.listRefs("primitives")}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}},Vi=class extends Ee{init(){this.propertyType="Node"}getDefaults(){return Object.assign(super.getDefaults(),{translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1],weights:[],camera:null,mesh:null,skin:null,children:new ae})}copy(t,e=wt){if(e===wt)throw new Error("Node cannot be copied.");return super.copy(t,e)}getTranslation(){return this.get("translation")}getRotation(){return this.get("rotation")}getScale(){return this.get("scale")}setTranslation(t){return this.set("translation",t)}setRotation(t){return this.set("rotation",t)}setScale(t){return this.set("scale",t)}getMatrix(){return ie.compose(this.get("translation"),this.get("rotation"),this.get("scale"),[])}setMatrix(t){let e=this.get("translation").slice(),a=this.get("rotation").slice(),s=this.get("scale").slice();return ie.decompose(t,e,a,s),this.set("translation",e).set("rotation",a).set("scale",s)}getWorldTranslation(){let t=[0,0,0];return ie.decompose(this.getWorldMatrix(),t,[0,0,0,1],[1,1,1]),t}getWorldRotation(){let t=[0,0,0,1];return ie.decompose(this.getWorldMatrix(),[0,0,0],t,[1,1,1]),t}getWorldScale(){let t=[1,1,1];return ie.decompose(this.getWorldMatrix(),[0,0,0],[0,0,0,1],t),t}getWorldMatrix(){let t=[];for(let s=this;s!=null;s=s.getParentNode())t.push(s);let e,a=t.pop().getMatrix();for(;e=t.pop();)bu(a,a,e.getMatrix());return a}addChild(t){let e=t.getParentNode();e&&e.removeChild(t);for(let a of t.listParents())a.propertyType==="Scene"&&a.removeChild(t);return this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}getParentNode(){for(let t of this.listParents())if(t.propertyType==="Node")return t;return null}getMesh(){return this.getRef("mesh")}setMesh(t){return this.setRef("mesh",t)}getCamera(){return this.getRef("camera")}setCamera(t){return this.setRef("camera",t)}getSkin(){return this.getRef("skin")}setSkin(t){return this.setRef("skin",t)}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}traverse(t){t(this);for(let e of this.listChildren())e.traverse(t);return this}},Ia=class Hi extends Ee{static Mode={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6};init(){this.propertyType="Primitive"}getDefaults(){return Object.assign(super.getDefaults(),{mode:Hi.Mode.TRIANGLES,material:null,indices:null,attributes:new ue,targets:new ae})}getIndices(){return this.getRef("indices")}setIndices(e){return this.setRef("indices",e,{usage:"ELEMENT_ARRAY_BUFFER"})}getAttribute(e){return this.getRefMap("attributes",e)}setAttribute(e,a){return this.setRefMap("attributes",e,a,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}getMaterial(){return this.getRef("material")}setMaterial(e){return this.setRef("material",e)}getMode(){return this.get("mode")}setMode(e){return this.set("mode",e)}listTargets(){return this.listRefs("targets")}addTarget(e){return this.addRef("targets",e)}removeTarget(e){return this.removeRef("targets",e)}},Ru=class extends Gr{init(){this.propertyType="PrimitiveTarget"}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},qi=class extends Ee{init(){this.propertyType="Scene"}getDefaults(){return Object.assign(super.getDefaults(),{children:new ae})}copy(t,e=wt){if(e===wt)throw new Error("Scene cannot be copied.");return super.copy(t,e)}addChild(t){let e=t.getParentNode();return e&&e.removeChild(t),this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}traverse(t){for(let e of this.listChildren())e.traverse(t);return this}},Xi=class extends Ee{init(){this.propertyType="Skin"}getDefaults(){return Object.assign(super.getDefaults(),{skeleton:null,inverseBindMatrices:null,joints:new ae})}getSkeleton(){return this.getRef("skeleton")}setSkeleton(t){return this.setRef("skeleton",t)}getInverseBindMatrices(){return this.getRef("inverseBindMatrices")}setInverseBindMatrices(t){return this.setRef("inverseBindMatrices",t,{usage:"INVERSE_BIND_MATRICES"})}addJoint(t){return this.addRef("joints",t)}removeJoint(t){return this.removeRef("joints",t)}listJoints(){return this.listRefs("joints")}},Wi=class extends Ee{init(){this.propertyType="Texture"}getDefaults(){return Object.assign(super.getDefaults(),{image:null,mimeType:"",uri:""})}getMimeType(){return this.get("mimeType")||Ze.extensionToMimeType(ra.extension(this.get("uri")))}setMimeType(t){return this.set("mimeType",t)}getURI(){return this.get("uri")}setURI(t){this.set("uri",t);let e=Ze.extensionToMimeType(ra.extension(t));return e&&this.set("mimeType",e),this}getImage(){return this.get("image")}setImage(t){return this.set("image",H.assertView(t))}getSize(){let t=this.get("image");return t?Ze.getSize(t,this.getMimeType()):null}},zr=class extends Ee{_extensions=new Set;init(){this.propertyType="Root"}getDefaults(){return Object.assign(super.getDefaults(),{asset:{generator:`glTF-Transform ${Ni}`,version:"2.0"},defaultScene:null,accessors:new ae,animations:new ae,buffers:new ae,cameras:new ae,materials:new ae,meshes:new ae,nodes:new ae,scenes:new ae,skins:new ae,textures:new ae})}constructor(t){super(t),t.addEventListener("node:create",e=>{this._addChildOfRoot(e.target)})}clone(){throw new Error("Root cannot be cloned.")}copy(t,e=wt){if(e===wt)throw new Error("Root cannot be copied.");this.set("asset",{...t.get("asset")}),this.setName(t.getName()),this.setExtras({...t.getExtras()}),this.setDefaultScene(t.getDefaultScene()?e(t.getDefaultScene()):null);for(let a of t.listRefMapKeys("extensions")){let s=t.getExtension(a);this.setExtension(a,e(s))}return this}_addChildOfRoot(t){return t instanceof qi?this.addRef("scenes",t):t instanceof Vi?this.addRef("nodes",t):t instanceof ms?this.addRef("cameras",t):t instanceof Xi?this.addRef("skins",t):t instanceof zi?this.addRef("meshes",t):t instanceof hs?this.addRef("materials",t):t instanceof Wi?this.addRef("textures",t):t instanceof Di?this.addRef("animations",t):t instanceof U?this.addRef("accessors",t):t instanceof Ui&&this.addRef("buffers",t),this}getAsset(){return this.get("asset")}listExtensionsUsed(){return Array.from(this._extensions)}listExtensionsRequired(){return this.listExtensionsUsed().filter(t=>t.isRequired())}_enableExtension(t){return this._extensions.add(t),this}_disableExtension(t){return this._extensions.delete(t),this}listScenes(){return this.listRefs("scenes")}setDefaultScene(t){return this.setRef("defaultScene",t)}getDefaultScene(){return this.getRef("defaultScene")}listNodes(){return this.listRefs("nodes")}listCameras(){return this.listRefs("cameras")}listSkins(){return this.listRefs("skins")}listMeshes(){return this.listRefs("meshes")}listMaterials(){return this.listRefs("materials")}listTextures(){return this.listRefs("textures")}listAnimations(){return this.listRefs("animations")}listAccessors(){return this.listRefs("accessors")}listBuffers(){return this.listRefs("buffers")}},Au=class Ur{_graph=new Br;_root=new zr(this._graph);_logger=ps.DEFAULT_INSTANCE;static _GRAPH_DOCUMENTS=new WeakMap;static fromGraph(e){return Ur._GRAPH_DOCUMENTS.get(e)||null}constructor(){Ur._GRAPH_DOCUMENTS.set(this._graph,this)}getRoot(){return this._root}getGraph(){return this._graph}getLogger(){return this._logger}setLogger(e){return this._logger=e,this}clone(){throw new Error("Use 'cloneDocument(source)' from '@gltf-transform/functions'.")}merge(e){throw new Error("Use 'mergeDocuments(target, source)' from '@gltf-transform/functions'.")}async transform(...e){let a=e.map(s=>s.name);for(let s of e)await s(this,{stack:a});return this}hasExtension(e){return this.getRoot().listExtensionsUsed().some(a=>a.extensionName===e)}createExtension(e){let a=e.EXTENSION_NAME;return this.getRoot().listExtensionsUsed().find(s=>s.extensionName===a)||new e(this)}disposeExtension(e){let a=this.getRoot().listExtensionsUsed().find(s=>s.extensionName===e);a&&a.dispose()}createScene(e=""){return new qi(this._graph,e)}createNode(e=""){return new Vi(this._graph,e)}createCamera(e=""){return new ms(this._graph,e)}createSkin(e=""){return new Xi(this._graph,e)}createMesh(e=""){return new zi(this._graph,e)}createPrimitive(){return new Ia(this._graph)}createPrimitiveTarget(e=""){return new Ru(this._graph,e)}createMaterial(e=""){return new hs(this._graph,e)}createTexture(e=""){return new Wi(this._graph,e)}createAnimation(e=""){return new Di(this._graph,e)}createAnimationChannel(e=""){return new Kr(this._graph,e)}createAnimationSampler(e=""){return new gs(this._graph,e)}createAccessor(e="",a=null){return a||(a=this.getRoot().listBuffers()[0]),new U(this._graph,e).setBuffer(a)}createBuffer(e=""){return new Ui(this._graph,e)}},ee=class{static EXTENSION_NAME;extensionName="";prereadTypes=[];prewriteTypes=[];readDependencies=[];writeDependencies=[];document;required=!1;properties=new Set;_listener;constructor(t){this.document=t,t.getRoot()._enableExtension(this),this._listener=a=>{let s=a,r=s.target;r instanceof X&&r.extensionName===this.extensionName&&(s.type==="node:create"&&this._addExtensionProperty(r),s.type==="node:dispose"&&this._removeExtensionProperty(r))};let e=t.getGraph();e.addEventListener("node:create",this._listener),e.addEventListener("node:dispose",this._listener)}dispose(){this.document.getRoot()._disableExtension(this);let t=this.document.getGraph();t.removeEventListener("node:create",this._listener),t.removeEventListener("node:dispose",this._listener);for(let e of this.properties)e.dispose()}static register(){}isRequired(){return this.required}setRequired(t){return this.required=t,this}listProperties(){return Array.from(this.properties)}_addExtensionProperty(t){return this.properties.add(t),this}_removeExtensionProperty(t){return this.properties.delete(t),this}install(t,e){return this}preread(t,e){return this}prewrite(t,e){return this}},_u=class{jsonDoc;buffers=[];bufferViews=[];bufferViewBuffers=[];accessors=[];textures=[];textureInfos=new Map;materials=[];meshes=[];cameras=[];nodes=[];skins=[];animations=[];scenes=[];constructor(t){this.jsonDoc=t}setTextureInfo(t,e){this.textureInfos.set(t,e),e.texCoord!==void 0&&t.setTexCoord(e.texCoord),e.extras!==void 0&&t.setExtras(e.extras);let a=this.jsonDoc.json.textures[e.index];if(a.sampler===void 0)return;let s=this.jsonDoc.json.samplers[a.sampler];s.magFilter!==void 0&&t.setMagFilter(s.magFilter),s.minFilter!==void 0&&t.setMinFilter(s.minFilter),s.wrapS!==void 0&&t.setWrapS(s.wrapS),s.wrapT!==void 0&&t.setWrapT(s.wrapT)}},Ri={logger:ps.DEFAULT_INSTANCE,extensions:[],dependencies:{}},Nu=new Set(["Buffer","Texture","Material","Mesh","Primitive","Node","Scene"]),Cu=class{static read(t,e=Ri){let a={...Ri,...e},{json:s}=t,r=new Au().setLogger(a.logger);this.validate(t,a);let n=new _u(t),i=s.asset,o=r.getRoot().getAsset();i.copyright&&(o.copyright=i.copyright),i.extras&&(o.extras=i.extras),s.extras!==void 0&&r.getRoot().setExtras({...s.extras});let c=s.extensionsUsed||[],d=s.extensionsRequired||[];a.extensions.sort((b,g)=>b.EXTENSION_NAME>g.EXTENSION_NAME?1:-1);for(let b of a.extensions)if(c.includes(b.EXTENSION_NAME)){let g=r.createExtension(b).setRequired(d.includes(b.EXTENSION_NAME)),x=g.prereadTypes.filter(v=>!Nu.has(v));x.length&&a.logger.warn(`Preread hooks for some types (${x.join()}), requested by extension ${g.extensionName}, are unsupported. Please file an issue or a PR.`);for(let v of g.readDependencies)g.install(v,a.dependencies[v])}let h=s.buffers||[];r.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Buffer")).forEach(b=>b.preread(n,"Buffer")),n.buffers=h.map(b=>{let g=r.createBuffer(b.name);return b.extras&&g.setExtras(b.extras),b.uri&&b.uri.indexOf("__")!==0&&g.setURI(b.uri),g}),n.bufferViewBuffers=(s.bufferViews||[]).map((b,g)=>{if(!n.bufferViews[g]){let x=t.json.buffers[b.buffer],v=x.uri?t.resources[x.uri]:t.resources[xt],T=b.byteOffset||0;n.bufferViews[g]=H.toView(v,T,b.byteLength)}return n.buffers[b.buffer]});let u=s.accessors||[];n.accessors=u.map(b=>{let g=n.bufferViewBuffers[b.bufferView],x=r.createAccessor(b.name,g).setType(b.type);return b.extras&&x.setExtras(b.extras),b.normalized!==void 0&&x.setNormalized(b.normalized),b.bufferView===void 0||x.setArray(us(b,n)),x});let m=s.images||[],p=s.textures||[];r.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Texture")).forEach(b=>b.preread(n,"Texture")),n.textures=m.map(b=>{let g=r.createTexture(b.name);if(b.extras&&g.setExtras(b.extras),b.bufferView!==void 0){let x=s.bufferViews[b.bufferView],v=t.json.buffers[x.buffer],T=v.uri?t.resources[v.uri]:t.resources[xt],I=x.byteOffset||0,S=x.byteLength,R=T.slice(I,I+S);g.setImage(R)}else b.uri!==void 0&&(g.setImage(t.resources[b.uri]),b.uri.indexOf("__")!==0&&g.setURI(b.uri));if(b.mimeType!==void 0)g.setMimeType(b.mimeType);else if(b.uri){let x=ra.extension(b.uri);g.setMimeType(Ze.extensionToMimeType(x))}return g}),r.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Material")).forEach(b=>b.preread(n,"Material")),n.materials=(s.materials||[]).map(b=>{let g=r.createMaterial(b.name);b.extras&&g.setExtras(b.extras),b.alphaMode!==void 0&&g.setAlphaMode(b.alphaMode),b.alphaCutoff!==void 0&&g.setAlphaCutoff(b.alphaCutoff),b.doubleSided!==void 0&&g.setDoubleSided(b.doubleSided);let x=b.pbrMetallicRoughness||{};if(x.baseColorFactor!==void 0&&g.setBaseColorFactor(x.baseColorFactor),b.emissiveFactor!==void 0&&g.setEmissiveFactor(b.emissiveFactor),x.metallicFactor!==void 0&&g.setMetallicFactor(x.metallicFactor),x.roughnessFactor!==void 0&&g.setRoughnessFactor(x.roughnessFactor),x.baseColorTexture!==void 0){let v=x.baseColorTexture,T=n.textures[p[v.index].source];g.setBaseColorTexture(T),n.setTextureInfo(g.getBaseColorTextureInfo(),v)}if(b.emissiveTexture!==void 0){let v=b.emissiveTexture,T=n.textures[p[v.index].source];g.setEmissiveTexture(T),n.setTextureInfo(g.getEmissiveTextureInfo(),v)}if(b.normalTexture!==void 0){let v=b.normalTexture,T=n.textures[p[v.index].source];g.setNormalTexture(T),n.setTextureInfo(g.getNormalTextureInfo(),v),b.normalTexture.scale!==void 0&&g.setNormalScale(b.normalTexture.scale)}if(b.occlusionTexture!==void 0){let v=b.occlusionTexture,T=n.textures[p[v.index].source];g.setOcclusionTexture(T),n.setTextureInfo(g.getOcclusionTextureInfo(),v),b.occlusionTexture.strength!==void 0&&g.setOcclusionStrength(b.occlusionTexture.strength)}if(x.metallicRoughnessTexture!==void 0){let v=x.metallicRoughnessTexture,T=n.textures[p[v.index].source];g.setMetallicRoughnessTexture(T),n.setTextureInfo(g.getMetallicRoughnessTextureInfo(),v)}return g}),r.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Mesh")).forEach(b=>b.preread(n,"Mesh"));let f=s.meshes||[];r.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Primitive")).forEach(b=>b.preread(n,"Primitive")),n.meshes=f.map(b=>{let g=r.createMesh(b.name);return b.extras&&g.setExtras(b.extras),b.weights!==void 0&&g.setWeights(b.weights),(b.primitives||[]).forEach(x=>{let v=r.createPrimitive();x.extras&&v.setExtras(x.extras),x.material!==void 0&&v.setMaterial(n.materials[x.material]),x.mode!==void 0&&v.setMode(x.mode);for(let[I,S]of Object.entries(x.attributes||{}))v.setAttribute(I,n.accessors[S]);x.indices!==void 0&&v.setIndices(n.accessors[x.indices]);let T=b.extras&&b.extras.targetNames||[];(x.targets||[]).forEach((I,S)=>{let R=T[S]||S.toString(),_=r.createPrimitiveTarget(R);for(let[A,j]of Object.entries(I))_.setAttribute(A,n.accessors[j]);v.addTarget(_)}),g.addPrimitive(v)}),g}),n.cameras=(s.cameras||[]).map(b=>{let g=r.createCamera(b.name).setType(b.type);if(b.extras&&g.setExtras(b.extras),b.type===ms.Type.PERSPECTIVE){let x=b.perspective;g.setYFov(x.yfov),g.setZNear(x.znear),x.zfar!==void 0&&g.setZFar(x.zfar),x.aspectRatio!==void 0&&g.setAspectRatio(x.aspectRatio)}else{let x=b.orthographic;g.setZNear(x.znear).setZFar(x.zfar).setXMag(x.xmag).setYMag(x.ymag)}return g});let l=s.nodes||[];r.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Node")).forEach(b=>b.preread(n,"Node")),n.nodes=l.map(b=>{let g=r.createNode(b.name);if(b.extras&&g.setExtras(b.extras),b.translation!==void 0&&g.setTranslation(b.translation),b.rotation!==void 0&&g.setRotation(b.rotation),b.scale!==void 0&&g.setScale(b.scale),b.matrix!==void 0){let x=[0,0,0],v=[0,0,0,1],T=[1,1,1];ie.decompose(b.matrix,x,v,T),g.setTranslation(x),g.setRotation(v),g.setScale(T)}return b.weights!==void 0&&g.setWeights(b.weights),g}),n.skins=(s.skins||[]).map(b=>{let g=r.createSkin(b.name);b.extras&&g.setExtras(b.extras),b.inverseBindMatrices!==void 0&&g.setInverseBindMatrices(n.accessors[b.inverseBindMatrices]),b.skeleton!==void 0&&g.setSkeleton(n.nodes[b.skeleton]);for(let x of b.joints)g.addJoint(n.nodes[x]);return g}),l.map((b,g)=>{let x=n.nodes[g];(b.children||[]).forEach(v=>x.addChild(n.nodes[v])),b.mesh!==void 0&&x.setMesh(n.meshes[b.mesh]),b.camera!==void 0&&x.setCamera(n.cameras[b.camera]),b.skin!==void 0&&x.setSkin(n.skins[b.skin])}),n.animations=(s.animations||[]).map(b=>{let g=r.createAnimation(b.name);b.extras&&g.setExtras(b.extras);let x=(b.samplers||[]).map(v=>{let T=r.createAnimationSampler().setInput(n.accessors[v.input]).setOutput(n.accessors[v.output]).setInterpolation(v.interpolation||gs.Interpolation.LINEAR);return v.extras&&T.setExtras(v.extras),g.addSampler(T),T});return(b.channels||[]).forEach(v=>{let T=r.createAnimationChannel().setSampler(x[v.sampler]).setTargetPath(v.target.path);v.target.node!==void 0&&T.setTargetNode(n.nodes[v.target.node]),v.extras&&T.setExtras(v.extras),g.addChannel(T)}),g});let y=s.scenes||[];return r.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Scene")).forEach(b=>b.preread(n,"Scene")),n.scenes=y.map(b=>{let g=r.createScene(b.name);return b.extras&&g.setExtras(b.extras),(b.nodes||[]).map(x=>n.nodes[x]).forEach(x=>g.addChild(x)),g}),s.scene!==void 0&&r.getRoot().setDefaultScene(n.scenes[s.scene]),r.getRoot().listExtensionsUsed().forEach(b=>b.read(n)),u.forEach((b,g)=>{let x=n.accessors[g],v=!!b.sparse,T=!b.bufferView&&!x.getArray();(v||T)&&x.setSparse(!0).setArray(Bu(b,n))}),r}static validate(t,e){let a=t.json;if(a.asset.version!=="2.0")throw new Error(`Unsupported glTF version, "${a.asset.version}".`);if(a.extensionsRequired){for(let s of a.extensionsRequired)if(!e.extensions.find(r=>r.EXTENSION_NAME===s))throw new Error(`Missing required extension, "${s}".`)}if(a.extensionsUsed)for(let s of a.extensionsUsed)e.extensions.find(r=>r.EXTENSION_NAME===s)||e.logger.warn(`Missing optional extension, "${s}".`)}};function Fu(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],r=a.json.bufferViews[t.bufferView],n=bs[t.componentType],i=U.getElementSize(t.type),o=n.BYTES_PER_ELEMENT,c=t.byteOffset||0,d=new n(t.count*i),h=new DataView(s.buffer,s.byteOffset,s.byteLength),u=r.byteStride;for(let m=0;m<t.count;m++)for(let p=0;p<i;p++){let f=c+m*u+p*o,l;switch(t.componentType){case U.ComponentType.FLOAT:l=h.getFloat32(f,!0);break;case U.ComponentType.UNSIGNED_INT:l=h.getUint32(f,!0);break;case U.ComponentType.UNSIGNED_SHORT:l=h.getUint16(f,!0);break;case U.ComponentType.UNSIGNED_BYTE:l=h.getUint8(f);break;case U.ComponentType.SHORT:l=h.getInt16(f,!0);break;case U.ComponentType.BYTE:l=h.getInt8(f);break;case U.ComponentType.FLOAT16:l=h.getFloat16(f,!0);break;case U.ComponentType.FLOAT64:l=h.getFloat64(f,!0);break;default:throw new Error(`Unexpected componentType "${t.componentType}".`)}d[m*i+p]=l}return d}function us(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],r=a.json.bufferViews[t.bufferView],n=bs[t.componentType],i=U.getElementSize(t.type),o=n.BYTES_PER_ELEMENT,c=i*o;if(r.byteStride!==void 0&&r.byteStride!==c)return Fu(t,e);let d=s.byteOffset+(t.byteOffset||0),h=t.count*i*o;return new n(s.buffer.slice(d,d+h))}function Bu(t,e){let a=bs[t.componentType],s=U.getElementSize(t.type),r;t.bufferView!==void 0?r=us(t,e):r=new a(t.count*s);let n=t.sparse;if(!n)return r;let i=n.count,o={...t,...n.indices,count:i,type:"SCALAR"},c={...t,...n.values,count:i},d=us(o,e),h=us(c,e);for(let u=0;u<o.count;u++)for(let m=0;m<s;m++)r[d[u]*s+m]=h[u*s+m];return r}var Ji=(function(t){return t[t.ARRAY_BUFFER=34962]="ARRAY_BUFFER",t[t.ELEMENT_ARRAY_BUFFER=34963]="ELEMENT_ARRAY_BUFFER",t})(Ji||{}),yt=class{_doc;jsonDoc;options;static BufferViewTarget=Ji;static BufferViewUsage=ru;static USAGE_TO_TARGET={ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963};accessorIndexMap=new Map;animationIndexMap=new Map;bufferIndexMap=new Map;cameraIndexMap=new Map;skinIndexMap=new Map;materialIndexMap=new Map;meshIndexMap=new Map;nodeIndexMap=new Map;imageIndexMap=new Map;textureDefIndexMap=new Map;textureInfoDefMap=new Map;samplerDefIndexMap=new Map;sceneIndexMap=new Map;imageBufferViews=[];otherBufferViews=new Map;otherBufferViewsIndexMap=new Map;extensionData={};bufferURIGenerator;imageURIGenerator;logger;_accessorUsageMap=new Map;accessorUsageGroupedByParent=new Set(["ARRAY_BUFFER"]);accessorParents=new Map;constructor(t,e,a){this._doc=t,this.jsonDoc=e,this.options=a;let s=t.getRoot(),r=s.listBuffers().length,n=s.listTextures().length;this.bufferURIGenerator=new Ai(r>1,()=>a.basename||"buffer"),this.imageURIGenerator=new Ai(n>1,i=>ju(t,i)||a.basename||"texture"),this.logger=t.getLogger()}createTextureInfoDef(t,e){let a={magFilter:e.getMagFilter()||void 0,minFilter:e.getMinFilter()||void 0,wrapS:e.getWrapS(),wrapT:e.getWrapT()},s=JSON.stringify(a);this.samplerDefIndexMap.has(s)||(this.samplerDefIndexMap.set(s,this.jsonDoc.json.samplers.length),this.jsonDoc.json.samplers.push(a));let r={source:this.imageIndexMap.get(t),sampler:this.samplerDefIndexMap.get(s)},n=JSON.stringify(r);this.textureDefIndexMap.has(n)||(this.textureDefIndexMap.set(n,this.jsonDoc.json.textures.length),this.jsonDoc.json.textures.push(r));let i={index:this.textureDefIndexMap.get(n)};return e.getTexCoord()!==0&&(i.texCoord=e.getTexCoord()),Object.keys(e.getExtras()).length>0&&(i.extras=e.getExtras()),this.textureInfoDefMap.set(e,i),i}createPropertyDef(t){let e={};return t.getName()&&(e.name=t.getName()),Object.keys(t.getExtras()).length>0&&(e.extras=t.getExtras()),e}createAccessorDef(t){let e=this.createPropertyDef(t);return e.type=t.getType(),e.componentType=t.getComponentType(),e.count=t.getCount(),this._doc.getGraph().listParentEdges(t).some(a=>a.getName()==="attributes"&&a.getAttributes().key==="POSITION"||a.getName()==="input")&&(e.max=t.getMax([]).map(Math.fround),e.min=t.getMin([]).map(Math.fround)),t.getNormalized()&&(e.normalized=t.getNormalized()),e}createImageData(t,e,a){if(this.options.format==="GLB")this.imageBufferViews.push(e),t.bufferView=this.jsonDoc.json.bufferViews.length,this.jsonDoc.json.bufferViews.push({buffer:0,byteOffset:-1,byteLength:e.byteLength});else{let s=Ze.mimeTypeToExtension(a.getMimeType());t.uri=this.imageURIGenerator.createURI(a,s),this.assignResourceURI(t.uri,e,!1)}}assignResourceURI(t,e,a){let s=this.jsonDoc.resources;if(!(t in s)){s[t]=e;return}if(e===s[t]){this.logger.warn(`Duplicate resource URI, "${t}".`);return}let r=`Resource URI "${t}" already assigned to different data.`;if(!a){this.logger.warn(r);return}throw new Error(r)}getAccessorUsage(t){let e=this._accessorUsageMap.get(t);if(e)return e;if(t.getSparse())return"SPARSE";for(let a of this._doc.getGraph().listParentEdges(t)){let{usage:s}=a.getAttributes();if(s)return s;a.getParent().propertyType!=="Root"&&this.logger.warn(`Missing attribute ".usage" on edge, "${a.getName()}".`)}return"OTHER"}addAccessorToUsageGroup(t,e){let a=this._accessorUsageMap.get(t);if(a&&a!==e)throw new Error(`Accessor with usage "${a}" cannot be reused as "${e}".`);return this._accessorUsageMap.set(t,e),this}},Ai=class{multiple;basename;counter={};constructor(t,e){this.multiple=t,this.basename=e}createURI(t,e){if(t.getURI())return t.getURI();if(this.multiple){let a=this.basename(t);return this.counter[a]=this.counter[a]||1,`${a}_${this.counter[a]++}.${e}`}else return`${this.basename(t)}.${e}`}};function ju(t,e){let a=t.getGraph().listParentEdges(e).find(s=>s.getParent()!==t.getRoot());return a?a.getName().replace(/texture$/i,""):""}var{BufferViewUsage:ds}=yt,{UNSIGNED_INT:Ou,UNSIGNED_SHORT:Pu,UNSIGNED_BYTE:Du}=U.ComponentType,Lu=new Set(["Accessor","Buffer","Material","Mesh"]),Uu=class{static write(t,e){let a=t.getGraph(),s=t.getRoot(),r={asset:{generator:`glTF-Transform ${Ni}`,...s.getAsset()},extras:{...s.getExtras()}},n={json:r,resources:{}},i=new yt(t,n,e),o=e.logger||ps.DEFAULT_INSTANCE,c=new Set(e.extensions.map(l=>l.EXTENSION_NAME)),d=t.getRoot().listExtensionsUsed().filter(l=>c.has(l.extensionName)).sort((l,y)=>l.extensionName>y.extensionName?1:-1),h=t.getRoot().listExtensionsRequired().filter(l=>c.has(l.extensionName)).sort((l,y)=>l.extensionName>y.extensionName?1:-1);d.length<t.getRoot().listExtensionsUsed().length&&o.warn("Some extensions were not registered for I/O, and will not be written.");for(let l of d){let y=l.prewriteTypes.filter(b=>!Lu.has(b));y.length&&o.warn(`Prewrite hooks for some types (${y.join()}), requested by extension ${l.extensionName}, are unsupported. Please file an issue or a PR.`);for(let b of l.writeDependencies)l.install(b,e.dependencies[b])}function u(l,y,b,g){let x=[],v=0;for(let I of l){let S=i.createAccessorDef(I);S.bufferView=r.bufferViews.length;let R=I.getArray(),_=H.pad(H.toView(R));S.byteOffset=v,v+=_.byteLength,x.push(_),i.accessorIndexMap.set(I,r.accessors.length),r.accessors.push(S)}let T={buffer:y,byteOffset:b,byteLength:H.concat(x).byteLength};return g&&(T.target=g),r.bufferViews.push(T),{buffers:x,byteLength:v}}function m(l,y,b){let g=l[0].getCount(),x=0;for(let R of l){let _=i.createAccessorDef(R);_.bufferView=r.bufferViews.length,_.byteOffset=x;let A=R.getElementSize(),j=R.getComponentSize();x+=H.padNumber(A*j),i.accessorIndexMap.set(R,r.accessors.length),r.accessors.push(_)}let v=g*x,T=new ArrayBuffer(v),I=new DataView(T);for(let R=0;R<g;R++){let _=0;for(let A of l){let j=A.getElementSize(),L=A.getComponentSize(),F=A.getComponentType(),K=A.getArray();for(let W=0;W<j;W++){let te=R*x+_+W*L,oe=K[R*j+W];switch(F){case U.ComponentType.FLOAT:I.setFloat32(te,oe,!0);break;case U.ComponentType.BYTE:I.setInt8(te,oe);break;case U.ComponentType.SHORT:I.setInt16(te,oe,!0);break;case U.ComponentType.UNSIGNED_BYTE:I.setUint8(te,oe);break;case U.ComponentType.UNSIGNED_SHORT:I.setUint16(te,oe,!0);break;case U.ComponentType.UNSIGNED_INT:I.setUint32(te,oe,!0);break;case U.ComponentType.FLOAT16:I.setFloat16(te,oe,!0);break;case U.ComponentType.FLOAT64:I.setFloat64(te,oe,!0);break;default:throw new Error("Unexpected component type: "+F)}}_+=H.padNumber(j*L)}}let S={buffer:y,byteOffset:b,byteLength:v,byteStride:x,target:yt.BufferViewTarget.ARRAY_BUFFER};return r.bufferViews.push(S),{byteLength:v,buffers:[new Uint8Array(T)]}}function p(l,y,b){let g=[],x=0,v=new Map,T=-1/0,I=!1;for(let F of l){let K=i.createAccessorDef(F);r.accessors.push(K),i.accessorIndexMap.set(F,r.accessors.length-1);let W=[],te=[],oe=[],Oe=new Array(F.getElementSize()).fill(0);for(let ve=0,$e=F.getCount();ve<$e;ve++)if(F.getElement(ve,oe),!ie.eq(oe,Oe,0)){T=Math.max(ve,T),W.push(ve);for(let ze=0;ze<oe.length;ze++)te.push(oe[ze])}let de=W.length,Pe={accessorDef:K,count:de};if(v.set(F,Pe),de===0)continue;de>F.getCount()/2&&(I=!0);let Ke=bs[F.getComponentType()];Pe.indices=W,Pe.values=new Ke(te)}if(!Number.isFinite(T))return{buffers:g,byteLength:x};I&&o.warn("Some sparse accessors have >50% non-zero elements, which may increase file size.");let S=T<255?Uint8Array:T<65535?Uint16Array:Uint32Array,R=T<255?Du:T<65535?Pu:Ou,_={buffer:y,byteOffset:b+x,byteLength:0};for(let F of l){let K=v.get(F);if(K.count===0)continue;K.indicesByteOffset=_.byteLength;let W=H.pad(H.toView(new S(K.indices)));g.push(W),x+=W.byteLength,_.byteLength+=W.byteLength}r.bufferViews.push(_);let A=r.bufferViews.length-1,j={buffer:y,byteOffset:b+x,byteLength:0};for(let F of l){let K=v.get(F);if(K.count===0)continue;K.valuesByteOffset=j.byteLength;let W=H.pad(H.toView(K.values));g.push(W),x+=W.byteLength,j.byteLength+=W.byteLength}r.bufferViews.push(j);let L=r.bufferViews.length-1;for(let F of l){let K=v.get(F);K.count!==0&&(K.accessorDef.sparse={count:K.count,indices:{bufferView:A,byteOffset:K.indicesByteOffset,componentType:R},values:{bufferView:L,byteOffset:K.valuesByteOffset}})}return{buffers:g,byteLength:x}}if(r.accessors=[],r.bufferViews=[],r.samplers=[],r.textures=[],r.images=s.listTextures().map((l,y)=>{let b=i.createPropertyDef(l);l.getMimeType()&&(b.mimeType=l.getMimeType());let g=l.getImage();return g&&i.createImageData(b,g,l),i.imageIndexMap.set(l,y),b}),d.filter(l=>l.prewriteTypes.includes("Accessor")).forEach(l=>l.prewrite(i,"Accessor")),s.listAccessors().forEach(l=>{let y=i.accessorUsageGroupedByParent,b=i.accessorParents;if(i.accessorIndexMap.has(l))return;let g=i.getAccessorUsage(l);if(i.addAccessorToUsageGroup(l,g),y.has(g)){let x=a.listParents(l).find(v=>v.propertyType!=="Root");b.set(l,x)}}),d.filter(l=>l.prewriteTypes.includes("Buffer")).forEach(l=>l.prewrite(i,"Buffer")),(s.listAccessors().length>0||i.otherBufferViews.size>0||s.listTextures().length>0&&e.format==="GLB")&&s.listBuffers().length===0)throw new Error("Buffer required for Document resources, but none was found.");r.buffers=[],s.listBuffers().forEach((l,y)=>{let b=i.createPropertyDef(l),g=i.accessorUsageGroupedByParent,x=l.listParents().filter(A=>A instanceof U),v=new Set(x.map(A=>i.accessorParents.get(A))),T=new Map(Array.from(v).map((A,j)=>[A,j])),I={};for(let A of x){if(i.accessorIndexMap.has(A))continue;let j=i.getAccessorUsage(A),L=j;if(g.has(j)){let F=i.accessorParents.get(A);L+=`:${T.get(F)}`}I[L]||={usage:j,accessors:[]},I[L].accessors.push(A)}let S=[],R=r.buffers.length,_=0;for(let{usage:A,accessors:j}of Object.values(I))if(A===ds.ARRAY_BUFFER&&e.vertexLayout==="interleaved"){let L=m(j,R,_);_+=L.byteLength;for(let F of L.buffers)S.push(F)}else if(A===ds.ARRAY_BUFFER)for(let L of j){let F=m([L],R,_);_+=F.byteLength;for(let K of F.buffers)S.push(K)}else if(A===ds.SPARSE){let L=p(j,R,_);_+=L.byteLength;for(let F of L.buffers)S.push(F)}else if(A===ds.ELEMENT_ARRAY_BUFFER){let L=yt.BufferViewTarget.ELEMENT_ARRAY_BUFFER,F=u(j,R,_,L);_+=F.byteLength;for(let K of F.buffers)S.push(K)}else{let L=u(j,R,_);_+=L.byteLength;for(let F of L.buffers)S.push(F)}if(i.imageBufferViews.length&&y===0){for(let A=0;A<i.imageBufferViews.length;A++)if(r.bufferViews[r.images[A].bufferView].byteOffset=_,_+=i.imageBufferViews[A].byteLength,S.push(i.imageBufferViews[A]),_%8){let j=8-_%8;_+=j,S.push(new Uint8Array(j))}}if(i.otherBufferViews.has(l))for(let A of i.otherBufferViews.get(l))r.bufferViews.push({buffer:R,byteOffset:_,byteLength:A.byteLength}),i.otherBufferViewsIndexMap.set(A,r.bufferViews.length-1),_+=A.byteLength,S.push(A);if(_){let A;e.format==="GLB"?A=xt:(A=i.bufferURIGenerator.createURI(l,"bin"),b.uri=A),b.byteLength=_,i.assignResourceURI(A,H.concat(S),!0)}r.buffers.push(b),i.bufferIndexMap.set(l,y)}),s.listAccessors().find(l=>!l.getBuffer())&&o.warn("Skipped writing one or more Accessors: no Buffer assigned."),d.filter(l=>l.prewriteTypes.includes("Material")).forEach(l=>l.prewrite(i,"Material")),r.materials=s.listMaterials().map((l,y)=>{let b=i.createPropertyDef(l);if(l.getAlphaMode()!==hs.AlphaMode.OPAQUE&&(b.alphaMode=l.getAlphaMode()),l.getAlphaMode()===hs.AlphaMode.MASK&&(b.alphaCutoff=l.getAlphaCutoff()),l.getDoubleSided()&&(b.doubleSided=!0),b.pbrMetallicRoughness={},ie.eq(l.getBaseColorFactor(),[1,1,1,1])||(b.pbrMetallicRoughness.baseColorFactor=l.getBaseColorFactor()),ie.eq(l.getEmissiveFactor(),[0,0,0])||(b.emissiveFactor=l.getEmissiveFactor()),l.getRoughnessFactor()!==1&&(b.pbrMetallicRoughness.roughnessFactor=l.getRoughnessFactor()),l.getMetallicFactor()!==1&&(b.pbrMetallicRoughness.metallicFactor=l.getMetallicFactor()),l.getBaseColorTexture()){let g=l.getBaseColorTexture(),x=l.getBaseColorTextureInfo();b.pbrMetallicRoughness.baseColorTexture=i.createTextureInfoDef(g,x)}if(l.getEmissiveTexture()){let g=l.getEmissiveTexture(),x=l.getEmissiveTextureInfo();b.emissiveTexture=i.createTextureInfoDef(g,x)}if(l.getNormalTexture()){let g=l.getNormalTexture(),x=l.getNormalTextureInfo(),v=i.createTextureInfoDef(g,x);l.getNormalScale()!==1&&(v.scale=l.getNormalScale()),b.normalTexture=v}if(l.getOcclusionTexture()){let g=l.getOcclusionTexture(),x=l.getOcclusionTextureInfo(),v=i.createTextureInfoDef(g,x);l.getOcclusionStrength()!==1&&(v.strength=l.getOcclusionStrength()),b.occlusionTexture=v}if(l.getMetallicRoughnessTexture()){let g=l.getMetallicRoughnessTexture(),x=l.getMetallicRoughnessTextureInfo();b.pbrMetallicRoughness.metallicRoughnessTexture=i.createTextureInfoDef(g,x)}return i.materialIndexMap.set(l,y),b}),d.filter(l=>l.prewriteTypes.includes("Mesh")).forEach(l=>l.prewrite(i,"Mesh")),r.meshes=s.listMeshes().map((l,y)=>{let b=i.createPropertyDef(l),g=null;return b.primitives=l.listPrimitives().map(x=>{let v={attributes:{}};v.mode=x.getMode();let T=x.getMaterial();T&&(v.material=i.materialIndexMap.get(T)),Object.keys(x.getExtras()).length&&(v.extras=x.getExtras());let I=x.getIndices();I&&(v.indices=i.accessorIndexMap.get(I));for(let S of x.listSemantics())v.attributes[S]=i.accessorIndexMap.get(x.getAttribute(S));for(let S of x.listTargets()){let R={};for(let _ of S.listSemantics())R[_]=i.accessorIndexMap.get(S.getAttribute(_));v.targets=v.targets||[],v.targets.push(R)}return x.listTargets().length&&!g&&(g=x.listTargets().map(S=>S.getName())),v}),l.getWeights().length&&(b.weights=l.getWeights()),g&&(b.extras=b.extras||{},b.extras.targetNames=g),i.meshIndexMap.set(l,y),b}),r.cameras=s.listCameras().map((l,y)=>{let b=i.createPropertyDef(l);if(b.type=l.getType(),b.type===ms.Type.PERSPECTIVE){b.perspective={znear:l.getZNear(),zfar:l.getZFar(),yfov:l.getYFov()};let g=l.getAspectRatio();g!==null&&(b.perspective.aspectRatio=g)}else b.orthographic={znear:l.getZNear(),zfar:l.getZFar(),xmag:l.getXMag(),ymag:l.getYMag()};return i.cameraIndexMap.set(l,y),b}),r.nodes=s.listNodes().map((l,y)=>{let b=i.createPropertyDef(l);return ie.eq(l.getTranslation(),[0,0,0])||(b.translation=l.getTranslation()),ie.eq(l.getRotation(),[0,0,0,1])||(b.rotation=l.getRotation()),ie.eq(l.getScale(),[1,1,1])||(b.scale=l.getScale()),l.getWeights().length&&(b.weights=l.getWeights()),i.nodeIndexMap.set(l,y),b}),r.skins=s.listSkins().map((l,y)=>{let b=i.createPropertyDef(l),g=l.getInverseBindMatrices();g&&(b.inverseBindMatrices=i.accessorIndexMap.get(g));let x=l.getSkeleton();return x&&(b.skeleton=i.nodeIndexMap.get(x)),b.joints=l.listJoints().map(v=>i.nodeIndexMap.get(v)),i.skinIndexMap.set(l,y),b}),s.listNodes().forEach((l,y)=>{let b=r.nodes[y],g=l.getMesh();g&&(b.mesh=i.meshIndexMap.get(g));let x=l.getCamera();x&&(b.camera=i.cameraIndexMap.get(x));let v=l.getSkin();v&&(b.skin=i.skinIndexMap.get(v)),l.listChildren().length>0&&(b.children=l.listChildren().map(T=>i.nodeIndexMap.get(T)))}),r.animations=s.listAnimations().map((l,y)=>{let b=i.createPropertyDef(l),g=new Map;return b.samplers=l.listSamplers().map((x,v)=>{let T=i.createPropertyDef(x);return T.input=i.accessorIndexMap.get(x.getInput()),T.output=i.accessorIndexMap.get(x.getOutput()),T.interpolation=x.getInterpolation(),g.set(x,v),T}),b.channels=l.listChannels().map(x=>{let v=i.createPropertyDef(x);return v.sampler=g.get(x.getSampler()),v.target={node:i.nodeIndexMap.get(x.getTargetNode()),path:x.getTargetPath()},v}),i.animationIndexMap.set(l,y),b}),r.scenes=s.listScenes().map((l,y)=>{let b=i.createPropertyDef(l);return b.nodes=l.listChildren().map(g=>i.nodeIndexMap.get(g)),i.sceneIndexMap.set(l,y),b});let f=s.getDefaultScene();return f&&(r.scene=s.listScenes().indexOf(f)),r.extensionsUsed=d.map(l=>l.extensionName),r.extensionsRequired=h.map(l=>l.extensionName),d.forEach(l=>l.write(i)),Gu(r),n}};function Gu(t){let e=[];for(let a in t){let s=t[a];(Array.isArray(s)&&s.length===0||s===null||s===""||s&&typeof s=="object"&&Object.keys(s).length===0)&&e.push(a)}for(let a of e)delete t[a]}var Ku=class{_logger=ps.DEFAULT_INSTANCE;_extensions=new Set;_dependencies={};_vertexLayout="interleaved";_strictResources=!0;lastReadBytes=0;lastWriteBytes=0;setLogger(t){return this._logger=t,this}registerExtensions(t){for(let e of t)this._extensions.add(e),e.register();return this}registerDependencies(t){return Object.assign(this._dependencies,t),this}setVertexLayout(t){return this._vertexLayout=t,this}setStrictResources(t){return this._strictResources=t,this}async read(t){return await this.readJSON(await this.readAsJSON(t))}async readAsJSON(t){let e=await this.readURI(t,"view");this.lastReadBytes=e.byteLength;let a=_i(e)?this._binaryToJSON(e):{json:JSON.parse(H.decodeText(e)),resources:{}};return await this._readResourcesExternal(a,this.dirname(t)),this._readResourcesInternal(a),a}async readJSON(t){return t=this._copyJSON(t),this._readResourcesInternal(t),Cu.read(t,{extensions:Array.from(this._extensions),dependencies:this._dependencies,logger:this._logger})}async binaryToJSON(t){let e=this._binaryToJSON(H.assertView(t));this._readResourcesInternal(e);let a=e.json;if(a.buffers&&a.buffers.some(s=>zu(e,s)))throw new Error("Cannot resolve external buffers with binaryToJSON().");if(a.images&&a.images.some(s=>Vu(e,s)))throw new Error("Cannot resolve external images with binaryToJSON().");return e}async readBinary(t){return this.readJSON(await this.binaryToJSON(H.assertView(t)))}async writeJSON(t,e={}){if(e.format==="GLB"&&t.getRoot().listBuffers().length>1)throw new Error("GLB must have 0\u20131 buffers.");return Uu.write(t,{format:e.format||"GLTF",basename:e.basename||"",logger:this._logger,vertexLayout:this._vertexLayout,dependencies:{...this._dependencies},extensions:Array.from(this._extensions)})}async writeBinary(t){let{json:e,resources:a}=await this.writeJSON(t,{format:"GLB"}),s=new Uint32Array([1179937895,2,12]),r=JSON.stringify(e),n=H.pad(H.encodeText(r),32),i=H.toView(new Uint32Array([n.byteLength,1313821514])),o=H.concat([i,n]);s[s.length-1]+=o.byteLength;let c=Object.values(a)[0];if(!c||!c.byteLength)return H.concat([H.toView(s),o]);let d=H.pad(c,0),h=H.toView(new Uint32Array([d.byteLength,5130562])),u=H.concat([h,d]);return s[s.length-1]+=u.byteLength,H.concat([H.toView(s),o,u])}async _readResourcesExternal(t,e){let a=t.json.images||[],s=t.json.buffers||[],r=[...a,...s].map(async n=>{let i=n.uri;if(!i||i.match(/data:/))return Promise.resolve();try{t.resources[i]=await this.readURI(this.resolve(e,i),"view"),this.lastReadBytes+=t.resources[i].byteLength}catch(o){if(!this._strictResources&&a.includes(n))this._logger.warn(`Failed to load image URI, "${i}". ${o}`),t.resources[i]=null;else throw o}});await Promise.all(r)}_readResourcesInternal(t){function e(a){if(a.uri){if(a.uri in t.resources){H.assertView(t.resources[a.uri]);return}if(a.uri.match(/data:/)){let s=`__${Tu()}.${ra.extension(a.uri)}`;t.resources[s]=H.createBufferFromDataURI(a.uri),a.uri=s}}}(t.json.images||[]).forEach(a=>{if(a.bufferView===void 0&&a.uri===void 0)throw new Error("Missing resource URI or buffer view.");e(a)}),(t.json.buffers||[]).forEach(e)}_copyJSON(t){let{images:e,buffers:a}=t.json;return t={json:{...t.json},resources:{...t.resources}},e&&(t.json.images=e.map(s=>({...s}))),a&&(t.json.buffers=a.map(s=>({...s}))),t}_binaryToJSON(t){if(!_i(t))throw new Error("Invalid glTF 2.0 binary.");let e=new Uint32Array(t.buffer,t.byteOffset+12,2);if(e[1]!==1313821514)throw new Error("Missing required GLB JSON chunk.");let a=20,s=e[0],r=H.decodeText(H.toView(t,a,s)),n=JSON.parse(r),i=a+s;if(t.byteLength<=i)return{json:n,resources:{}};let o=new Uint32Array(t.buffer,t.byteOffset+i,2);if(o[1]!==5130562)return{json:n,resources:{}};let c=o[0],d=H.toView(t,i+8,c);return{json:n,resources:{[xt]:d}}}};function zu(t,e){return e.uri!==void 0&&!(e.uri in t.resources)}function Vu(t,e){return e.uri!==void 0&&!(e.uri in t.resources)&&e.bufferView===void 0}function _i(t){if(t.byteLength<3*Uint32Array.BYTES_PER_ELEMENT)return!1;let e=new Uint32Array(t.buffer,t.byteOffset,3);return e[0]===1179937895&&e[1]===2}var $i=class extends Ku{_fetchConfig;constructor(t=Or.DEFAULT_INIT){super(),this._fetchConfig=t}async readURI(t,e){let a=await fetch(t,this._fetchConfig);switch(e){case"view":return new Uint8Array(await a.arrayBuffer());case"text":return a.text()}}resolve(t,e){return Or.resolve(t,e)}dirname(t){return Or.dirname(t)}};function Hu(){return{vkFormat:0,typeSize:1,pixelWidth:0,pixelHeight:0,pixelDepth:0,layerCount:0,faceCount:1,levelCount:0,supercompressionScheme:0,levels:[],dataFormatDescriptor:[{vendorId:0,descriptorType:0,versionNumber:2,colorModel:0,colorPrimaries:1,transferFunction:2,flags:0,texelBlockDimension:[0,0,0,0],bytesPlane:[0,0,0,0,0,0,0,0],samples:[]}],keyValue:{},globalData:null}}var qt=class{constructor(e,a,s,r){this._dataView=void 0,this._littleEndian=void 0,this._offset=void 0,this._dataView=new DataView(e.buffer,e.byteOffset+a,s),this._littleEndian=r,this._offset=0}_nextUint8(){let e=this._dataView.getUint8(this._offset);return this._offset+=1,e}_nextUint16(){let e=this._dataView.getUint16(this._offset,this._littleEndian);return this._offset+=2,e}_nextUint32(){let e=this._dataView.getUint32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint64(){let e=this._dataView.getUint32(this._offset,this._littleEndian),a=this._dataView.getUint32(this._offset+4,this._littleEndian),s=e+2**32*a;return this._offset+=8,s}_nextInt32(){let e=this._dataView.getInt32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint8Array(e){let a=new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+this._offset,e);return this._offset+=e,a}_skip(e){return this._offset+=e,this}_scan(e,a=0){let s=this._offset,r=0;for(;this._dataView.getUint8(this._offset)!==a&&r<e;)r++,this._offset++;return r<e&&this._offset++,new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+s,r)}};var _x=new Uint8Array([0]),Te=[171,75,84,88,32,50,48,187,13,10,26,10];function Yi(t){return new TextDecoder().decode(t)}function ys(t){let e=new Uint8Array(t.buffer,t.byteOffset,Te.length);if(e[0]!==Te[0]||e[1]!==Te[1]||e[2]!==Te[2]||e[3]!==Te[3]||e[4]!==Te[4]||e[5]!==Te[5]||e[6]!==Te[6]||e[7]!==Te[7]||e[8]!==Te[8]||e[9]!==Te[9]||e[10]!==Te[10]||e[11]!==Te[11])throw new Error("Missing KTX 2.0 identifier.");let a=Hu(),s=17*Uint32Array.BYTES_PER_ELEMENT,r=new qt(t,Te.length,s,!0);a.vkFormat=r._nextUint32(),a.typeSize=r._nextUint32(),a.pixelWidth=r._nextUint32(),a.pixelHeight=r._nextUint32(),a.pixelDepth=r._nextUint32(),a.layerCount=r._nextUint32(),a.faceCount=r._nextUint32(),a.levelCount=r._nextUint32(),a.supercompressionScheme=r._nextUint32();let n=r._nextUint32(),i=r._nextUint32(),o=r._nextUint32(),c=r._nextUint32(),d=r._nextUint64(),h=r._nextUint64(),u=Math.max(a.levelCount,1)*3*8,m=new qt(t,Te.length+s,u,!0);for(let B=0,O=Math.max(a.levelCount,1);B<O;B++)a.levels.push({levelData:new Uint8Array(t.buffer,t.byteOffset+m._nextUint64(),m._nextUint64()),uncompressedByteLength:m._nextUint64()});let p=new qt(t,n,i,!0);p._skip(4);let f=p._nextUint16(),l=p._nextUint16(),y=p._nextUint16(),b=p._nextUint16(),g=p._nextUint8(),x=p._nextUint8(),v=p._nextUint8(),T=p._nextUint8(),I=[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],S=[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],_={vendorId:f,descriptorType:l,versionNumber:y,colorModel:g,colorPrimaries:x,transferFunction:v,flags:T,texelBlockDimension:I,bytesPlane:S,samples:[]},L=(b/4-6)/4;for(let B=0;B<L;B++){let O={bitOffset:p._nextUint16(),bitLength:p._nextUint8(),channelType:p._nextUint8(),samplePosition:[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],sampleLower:Number.NEGATIVE_INFINITY,sampleUpper:Number.POSITIVE_INFINITY};O.channelType&64?(O.sampleLower=p._nextInt32(),O.sampleUpper=p._nextInt32()):(O.sampleLower=p._nextUint32(),O.sampleUpper=p._nextUint32()),_.samples[B]=O}a.dataFormatDescriptor.length=0,a.dataFormatDescriptor.push(_);let F=new qt(t,o,c,!0);for(;F._offset<c;){let B=F._nextUint32(),O=F._scan(B),$=Yi(O);if(a.keyValue[$]=F._nextUint8Array(B-O.byteLength-1),$.match(/^ktx/i)){let Me=Yi(a.keyValue[$]);a.keyValue[$]=Me.substring(0,Me.lastIndexOf("\0"))}let ce=B%4?4-B%4:0;F._skip(ce)}if(h<=0)return a;let K=new qt(t,d,h,!0),W=K._nextUint16(),te=K._nextUint16(),oe=K._nextUint32(),Oe=K._nextUint32(),de=K._nextUint32(),Pe=K._nextUint32(),Ke=[];for(let B=0,O=Math.max(a.levelCount,1);B<O;B++)Ke.push({imageFlags:K._nextUint32(),rgbSliceByteOffset:K._nextUint32(),rgbSliceByteLength:K._nextUint32(),alphaSliceByteOffset:K._nextUint32(),alphaSliceByteLength:K._nextUint32()});let ve=d+K._offset,$e=ve+oe,ze=$e+Oe,bt=ze+de,aa=new Uint8Array(t.buffer,t.byteOffset+ve,oe),Tr=new Uint8Array(t.buffer,t.byteOffset+$e,Oe),Ja=new Uint8Array(t.buffer,t.byteOffset+ze,de),k=new Uint8Array(t.buffer,t.byteOffset+bt,Pe);return a.globalData={endpointCount:W,selectorCount:te,imageDescs:Ke,endpointsData:aa,selectorsData:Tr,tablesData:Ja,extendedData:k},a}var vt="EXT_mesh_gpu_instancing",ct="EXT_mesh_features",Ae="EXT_meshopt_compression",V="EXT_structural_metadata",xs="EXT_texture_webp",ws="EXT_texture_avif",Yu="KHR_accessor_float16",Qu="KHR_accessor_float64",le="KHR_draco_mesh_compression",ot="KHR_lights_punctual",Mt="KHR_materials_anisotropy",Et="KHR_materials_clearcoat",Tt="KHR_materials_diffuse_transmission",kt="KHR_materials_dispersion",It="KHR_materials_emissive_strength",St="KHR_materials_ior",Rt="KHR_materials_iridescence",At="KHR_materials_pbrSpecularGlossiness",_t="KHR_materials_sheen",Nt="KHR_materials_specular",Ct="KHR_materials_transmission",na="KHR_materials_unlit",Ft="KHR_materials_volume",Be="KHR_materials_variants",Qi="KHR_mesh_primitive_restart",Zi="KHR_mesh_quantization",Bt="KHR_node_visibility",vs="KHR_texture_basisu",jt="KHR_texture_transform",He="KHR_xmp_json_ld",Zu=class extends X{static EXTENSION_NAME=ct;init(){this.extensionName=ct,this.propertyType="FeatureID",this.parentTypes=["Features"]}getDefaults(){return Object.assign(super.getDefaults(),{nullFeatureId:null,label:"",attribute:null,texture:null,propertyTable:null})}getFeatureCount(){return this.get("featureCount")}setFeatureCount(t){return this.set("featureCount",t)}getNullFeatureID(){return this.get("nullFeatureId")}setNullFeatureID(t){return this.set("nullFeatureId",t)}getLabel(){return this.get("label")}setLabel(t){return this.set("label",t)}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getPropertyTable(){return this.getRef("propertyTable")}setPropertyTable(t){return this.setRef("propertyTable",t)}},ef=class extends X{static EXTENSION_NAME=ct;init(){this.extensionName=ct,this.propertyType="FeatureIDTexture",this.parentTypes=["FeatureID"]}getDefaults(){let t=new re(this.graph,"textureInfo");return t.setMinFilter(re.MagFilter.NEAREST),t.setMagFilter(re.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}},tf=class extends X{static EXTENSION_NAME=ct;init(){this.extensionName=ct,this.propertyType="Features",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{featureIds:new ae([])})}listFeatureIDs(){return this.listRefs("featureIds")}addFeatureID(t){return this.addRef("featureIds",t)}removeFeatureID(t){return this.removeRef("featureIds",t)}},Sa=ct,Jr=class extends ee{extensionName=ct;static EXTENSION_NAME=ct;createFeatures(){return new tf(this.document.getGraph())}createFeatureID(){return new Zu(this.document.getGraph())}createFeatureIDTexture(){return new ef(this.document.getGraph())}read(t){return(t.jsonDoc.json.meshes||[]).forEach((e,a)=>{(e.primitives||[]).forEach((s,r)=>{this._readPrimitive(t,a,s,r)})}),this}_readPrimitive(t,e,a,s){if(!a.extensions||!a.extensions[Sa])return;let r=this.createFeatures(),n=a.extensions[Sa];for(let i of n.featureIds){let o=af(this.document,this,t,i);r.addFeatureID(o)}t.meshes[e].listPrimitives()[s].setExtension(Sa,r)}write(t){let e=t.jsonDoc.json.meshes;if(!e)return this;for(let a of this.document.getRoot().listMeshes()){let s=e[t.meshIndexMap.get(a)];a.listPrimitives().forEach((r,n)=>{let i=s.primitives[n];this._writePrimitive(t,r,i)})}return this}_writePrimitive(t,e,a){let s=e.getExtension(Sa);if(!s)return;let r={featureIds:[]};s.listFeatureIDs().forEach(n=>{r.featureIds.push(rf(this.document,t,n))}),a.extensions=a.extensions||{},a.extensions[Sa]=r}};function af(t,e,a,s){let r=e.createFeatureID().setFeatureCount(s.featureCount);s.nullFeatureId!==void 0&&r.setNullFeatureID(s.nullFeatureId),s.label!==void 0&&r.setLabel(s.label),s.attribute!==void 0&&r.setAttribute(s.attribute);let n=s.texture;if(n!==void 0){let i=sf(e,a,n);r.setTexture(i)}if(s.propertyTable!==void 0){let i=t.getRoot().getExtension(V).listPropertyTables();r.setPropertyTable(i[s.propertyTable])}return r}function sf(t,e,a){let s=t.createFeatureIDTexture(),{json:r}=e.jsonDoc;if(a.channels&&s.setChannels(a.channels),a.index!==void 0){let n=r.textures[a.index].source;s.setTexture(e.textures[n]),e.setTextureInfo(s.getTextureInfo(),a)}return s}function rf(t,e,a){let s=t.getRoot(),r={featureCount:a.getFeatureCount()};if(a.getNullFeatureID()!=null&&(r.nullFeatureId=a.getNullFeatureID()),a.getLabel()&&(r.label=a.getLabel()),a.getAttribute()!=null&&(r.attribute=a.getAttribute()),a.getTexture()){let n=a.getTexture(),i=n.getTexture(),o=n.getTextureInfo();r.texture=e.createTextureInfoDef(i,o);let c=n.getChannels();ie.eq(c,[0])||(r.texture.channels=c)}if(a.getPropertyTable()){let n=s.getExtension(V),i=a.getPropertyTable();r.propertyTable=n.listPropertyTables().indexOf(i)}return r}var qr="INSTANCE_ATTRIBUTE",nf=class extends X{static EXTENSION_NAME=vt;init(){this.extensionName=vt,this.propertyType="InstancedMesh",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:qr})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},of=class extends ee{static EXTENSION_NAME=vt;extensionName=vt;prewriteTypes=[C.ACCESSOR];createInstancedMesh(){return new nf(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(!e.extensions||!e.extensions.EXT_mesh_gpu_instancing)return;let s=e.extensions[vt],r=this.createInstancedMesh();for(let n in s.attributes)r.setAttribute(n,t.accessors[s.attributes[n]]);t.nodes[a].setExtension(vt,r)}),this}prewrite(t){t.accessorUsageGroupedByParent.add(qr);for(let e of this.properties)for(let a of e.listAttributes())t.addAccessorToUsageGroup(a,qr);return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listNodes().forEach(a=>{let s=a.getExtension(vt);if(s){let r=t.nodeIndexMap.get(a),n=e.json.nodes[r],i={attributes:{}};s.listSemantics().forEach(o=>{let c=s.getAttribute(o);i.attributes[o]=t.accessorIndexMap.get(c)}),n.extensions=n.extensions||{},n.extensions[vt]=i}}),this}},cf=(function(t){return t.QUANTIZE="quantize",t.FILTER="filter",t})({});function lf(t){return!t.extensions||!t.extensions.EXT_meshopt_compression?!1:!!t.extensions[Ae].fallback}var{BYTE:df,SHORT:eo,FLOAT:uf}=U.ComponentType,{encodeNormalizedInt:to,decodeNormalizedInt:Xr}=ie;function ff(t,e,a,s){let{filter:r,bits:n}=s,i={array:t.getArray(),byteStride:t.getElementSize()*t.getComponentSize(),componentType:t.getComponentType(),normalized:t.getNormalized()};if(a!=="ATTRIBUTES")return i;if(r!=="NONE"){let o=t.getNormalized()?hf(t):new Float32Array(i.array);switch(r){case"EXPONENTIAL":i.byteStride=t.getElementSize()*4,i.componentType=uf,i.normalized=!1,i.array=e.encodeFilterExp(o,t.getCount(),i.byteStride,n);break;case"OCTAHEDRAL":i.byteStride=n>8?8:4,i.componentType=n>8?eo:df,i.normalized=!0,o=t.getElementSize()===3?pf(o):o,i.array=e.encodeFilterOct(o,t.getCount(),i.byteStride,n);break;case"QUATERNION":i.byteStride=8,i.componentType=eo,i.normalized=!0,i.array=e.encodeFilterQuat(o,t.getCount(),i.byteStride,n);break;default:throw new Error("Invalid filter.")}i.min=t.getMin([]),i.max=t.getMax([]),t.getNormalized()&&(i.min=i.min.map(c=>Xr(c,t.getComponentType())),i.max=i.max.map(c=>Xr(c,t.getComponentType()))),i.normalized&&(i.min=i.min.map(c=>to(c,i.componentType)),i.max=i.max.map(c=>to(c,i.componentType)))}else i.byteStride%4&&(i.array=bf(i.array,t.getElementSize()),i.byteStride=i.array.byteLength/t.getCount());return i}function hf(t){let e=t.getComponentType(),a=t.getArray(),s=new Float32Array(a.length);for(let r=0;r<a.length;r++)s[r]=Xr(a[r],e);return s}function bf(t,e){let a=H.padNumber(t.BYTES_PER_ELEMENT*e)/t.BYTES_PER_ELEMENT,s=t.length/e,r=new t.constructor(s*a);for(let n=0;n*e<t.length;n++)for(let i=0;i<e;i++)r[n*a+i]=t[n*e+i];return r}function pf(t){let e=new Float32Array(t.length*4/3);for(let a=0,s=t.length/3;a<s;a++)e[a*4]=t[a*3],e[a*4+1]=t[a*3+1],e[a*4+2]=t[a*3+2];return e}function gf(t,e){return e===yt.BufferViewUsage.ELEMENT_ARRAY_BUFFER?t.listParents().some(a=>a instanceof Ia&&a.getMode()===Ia.Mode.TRIANGLES)?"TRIANGLES":"INDICES":"ATTRIBUTES"}function mf(t,e){let a=e.getGraph().listParentEdges(t).filter(s=>!(s.getParent()instanceof zr));for(let s of a){let r=s.getName(),n=s.getAttributes().key||"",i=s.getParent().propertyType===C.PRIMITIVE_TARGET;if(r==="indices")return{filter:"NONE"};if(r==="attributes"){if(n==="POSITION")return{filter:"NONE"};if(n==="TEXCOORD_0")return{filter:"NONE"};if(n.startsWith("JOINTS_"))return{filter:"NONE"};if(n.startsWith("WEIGHTS_"))return{filter:"NONE"};if(n==="NORMAL"||n==="TANGENT")return i?{filter:"NONE"}:{filter:"OCTAHEDRAL",bits:8}}if(r==="output"){let o=xo(t);return o==="rotation"?{filter:"QUATERNION",bits:16}:o==="translation"?{filter:"EXPONENTIAL",bits:12}:o==="scale"?{filter:"EXPONENTIAL",bits:12}:{filter:"NONE"}}if(r==="input")return{filter:"NONE"};if(r==="inverseBindMatrices")return{filter:"NONE"}}return{filter:"NONE"}}function xo(t){for(let e of t.listParents())if(e instanceof gs){for(let a of e.listParents())if(a instanceof Kr)return a.getTargetPath()}return null}var ao={method:"quantize"},$r=class extends ee{extensionName=Ae;prereadTypes=[C.BUFFER,C.PRIMITIVE];prewriteTypes=[C.BUFFER,C.ACCESSOR];readDependencies=["meshopt.decoder"];writeDependencies=["meshopt.encoder"];static EXTENSION_NAME=Ae;static EncoderMethod=cf;_decoder=null;_decoderFallbackBufferMap=new Map;_encoder=null;_encoderOptions=ao;_encoderFallbackBuffer=null;_encoderBufferViews={};_encoderBufferViewData={};_encoderBufferViewAccessors={};install(t,e){return t==="meshopt.decoder"&&(this._decoder=e),t==="meshopt.encoder"&&(this._encoder=e),this}setEncoderOptions(t){return this._encoderOptions={...ao,...t},this}preread(t,e){if(!this._decoder){if(!this.isRequired())return this;throw new Error(`[${Ae}] Please install extension dependency, "meshopt.decoder".`)}if(!this._decoder.supported){if(!this.isRequired())return this;throw new Error(`[${Ae}]: Missing WASM support.`)}return e===C.BUFFER?this._prereadBuffers(t):e===C.PRIMITIVE&&this._prereadPrimitives(t),this}_prereadBuffers(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach((a,s)=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let r=a.extensions[Ae],n=r.byteOffset||0,i=r.byteLength||0,o=r.count,c=r.byteStride,d=new Uint8Array(o*c),h=e.json.buffers[r.buffer],u=h.uri?e.resources[h.uri]:e.resources[xt],m=H.toView(u,n,i);this._decoder.decodeGltfBuffer(d,o,c,m,r.mode,r.filter),t.bufferViews[s]=d})}_prereadPrimitives(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach(a=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let s=a.extensions[Ae],r=t.buffers[s.buffer],n=t.buffers[a.buffer],i=e.json.buffers[a.buffer];lf(i)&&this._decoderFallbackBufferMap.set(n,r)})}read(t){if(!this.isRequired())return this;for(let[e,a]of this._decoderFallbackBufferMap){for(let s of e.listParents())s instanceof U&&s.swap(e,a);e.dispose()}return this}prewrite(t,e){return e===C.ACCESSOR?this._prewriteAccessors(t):e===C.BUFFER&&this._prewriteBuffers(t),this}_prewriteAccessors(t){let e=t.jsonDoc.json,a=this._encoder,s=this._encoderOptions,r=this.document.getGraph(),n=this.document.createBuffer(),i=this.document.getRoot().listBuffers().indexOf(n),o=1,c=new Map,d=h=>{for(let u of r.listParents(h)){if(u.propertyType===C.ROOT)continue;let m=c.get(h);return m===void 0&&c.set(h,m=o++),m}return-1};this._encoderFallbackBuffer=n,this._encoderBufferViews={},this._encoderBufferViewData={},this._encoderBufferViewAccessors={};for(let h of this.document.getRoot().listAccessors()){if(xo(h)==="weights"||h.getSparse())continue;let u=t.getAccessorUsage(h),m=t.accessorUsageGroupedByParent.has(u)?d(h):null,p=gf(h,u),f=s.method==="filter"?mf(h,this.document):{filter:"NONE"},l=ff(h,a,p,f),{array:y,byteStride:b}=l,g=h.getBuffer();if(!g)throw new Error(`${Ae}: Missing buffer for accessor.`);let x=this.document.getRoot().listBuffers().indexOf(g),v=[u,m,p,f.filter,b,x].join(":"),T=this._encoderBufferViews[v],I=this._encoderBufferViewData[v],S=this._encoderBufferViewAccessors[v];(!T||!I)&&(S=this._encoderBufferViewAccessors[v]=[],I=this._encoderBufferViewData[v]=[],T=this._encoderBufferViews[v]={buffer:i,target:yt.USAGE_TO_TARGET[u],byteOffset:0,byteLength:0,byteStride:u===yt.BufferViewUsage.ARRAY_BUFFER?b:void 0,extensions:{[Ae]:{buffer:x,byteOffset:0,byteLength:0,mode:p,filter:f.filter!=="NONE"?f.filter:void 0,byteStride:b,count:0}}});let R=t.createAccessorDef(h);R.componentType=l.componentType,R.normalized=l.normalized,R.byteOffset=T.byteLength,R.min&&l.min&&(R.min=l.min),R.max&&l.max&&(R.max=l.max),t.accessorIndexMap.set(h,e.accessors.length),e.accessors.push(R),S.push(R),I.push(new Uint8Array(y.buffer,y.byteOffset,y.byteLength)),T.byteLength+=y.byteLength,T.extensions.EXT_meshopt_compression.count+=h.getCount()}}_prewriteBuffers(t){let e=this._encoder;for(let a in this._encoderBufferViews){let s=this._encoderBufferViews[a],r=this._encoderBufferViewData[a],n=this.document.getRoot().listBuffers()[s.extensions[Ae].buffer],i=t.otherBufferViews.get(n)||[],{count:o,byteStride:c,mode:d}=s.extensions[Ae],h=H.concat(r),u=e.encodeGltfBuffer(h,o,c,d),m=H.pad(u);s.extensions[Ae].byteLength=u.byteLength,r.length=0,r.push(m),i.push(m),t.otherBufferViews.set(n,i)}}write(t){let e=0;for(let n in this._encoderBufferViews){let i=this._encoderBufferViews[n],o=this._encoderBufferViewData[n][0],c=t.otherBufferViewsIndexMap.get(o),d=this._encoderBufferViewAccessors[n];for(let p of d)p.bufferView=c;let h=t.jsonDoc.json.bufferViews[c],u=h.byteOffset||0;Object.assign(h,i),h.byteOffset=e;let m=h.extensions[Ae];m.byteOffset=u,e+=H.padNumber(i.byteLength)}let a=this._encoderFallbackBuffer,s=t.bufferIndexMap.get(a),r=t.jsonDoc.json.buffers[s];return r.byteLength=e,r.extensions={[Ae]:{fallback:!0}},a.dispose(),this}},yf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="StructuralMetadata",this.parentTypes=[C.ROOT]}getDefaults(){return Object.assign(super.getDefaults(),{schema:null,schemaUri:"",propertyTables:new xe,propertyTextures:new xe,propertyAttributes:new xe})}getSchema(){return this.getRef("schema")}setSchema(t){return this.setRef("schema",t)}getSchemaUri(){return this.get("schemaUri")}setSchemaUri(t){return this.set("schemaUri",t)}listPropertyTables(){return this.listRefs("propertyTables")}addPropertyTable(t){return this.addRef("propertyTables",t)}removePropertyTable(t){return this.removeRef("propertyTables",t)}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},xf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Schema",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",version:"",classes:new ue,enums:new ue})}getId(){return this.get("id")}setId(t){return this.set("id",t)}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getVersion(){return this.get("version")}setVersion(t){return this.set("version",t)}setClass(t,e){return this.setRefMap("classes",t,e)}getClass(t){return this.getRefMap("classes",t)}listClassKeys(){return this.listRefMapKeys("classes")}listClassValues(){return this.listRefMapValues("classes")}setEnum(t,e){return this.setRefMap("enums",t,e)}getEnum(t){return this.getRefMap("enums",t)}listEnumKeys(){return this.listRefMapKeys("enums")}listEnumValues(){return this.listRefMapValues("enums")}},wf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Class",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",properties:new ue})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},vf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="ClassProperty",this.parentTypes=["Class"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",componentType:null,enumType:null,array:null,count:null,normalized:null,offset:null,scale:null,max:null,min:null,required:null,noData:null,default:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getType(){return this.get("type")}setType(t){return this.set("type",t)}getComponentType(){return this.get("componentType")}setComponentType(t){return this.set("componentType",t)}getEnumType(){return this.get("enumType")}setEnumType(t){return this.set("enumType",t)}getArray(){return this.get("array")}setArray(t){return this.set("array",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}getNormalized(){return this.get("normalized")}setNormalized(t){return this.set("normalized",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}getRequired(){return this.get("required")}setRequired(t){return this.set("required",t)}getNoData(){return this.get("noData")}setNoData(t){return this.set("noData",t)}getDefault(){return this.get("default")}setDefault(t){return this.set("default",t)}},Mf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Enum",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",valueType:"UINT16",values:new xe})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValueType(){return this.get("valueType")}setValueType(t){return this.set("valueType",t)}listValues(){return this.listRefs("values")}addEnumValue(t){return this.addRef("values",t)}removeEnumValue(t){return this.removeRef("values",t)}},Ef=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="EnumValue",this.parentTypes=["Enum"]}getDefaults(){return Object.assign(super.getDefaults(),{description:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValue(){return this.get("value")}setValue(t){return this.set("value",t)}},Tf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTable",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},kf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTableProperty",this.parentTypes=["PropertyTable"]}getDefaults(){return Object.assign(super.getDefaults(),{arrayOffsets:null,stringOffsets:null,arrayOffsetType:null,stringOffsetType:null,offset:null,scale:null,max:null,min:null})}getValues(){return this.get("values")}setValues(t){return this.set("values",t)}getArrayOffsets(){return this.get("arrayOffsets")}setArrayOffsets(t){return this.set("arrayOffsets",t)}getStringOffsets(){return this.get("stringOffsets")}setStringOffsets(t){return this.set("stringOffsets",t)}getArrayOffsetType(){return this.get("arrayOffsetType")}setArrayOffsetType(t){return this.set("arrayOffsetType",t)}getStringOffsetType(){return this.get("stringOffsetType")}setStringOffsetType(t){return this.set("stringOffsetType",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},If=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTexture",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},Sf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTextureProperty",this.parentTypes=["PropertyTexture"]}getDefaults(){let t=new re(this.graph,"textureInfo");return t.setMinFilter(re.MagFilter.NEAREST),t.setMagFilter(re.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t,offset:null,scale:null,max:null,min:null})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},Rf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttribute",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},Af=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttributeProperty",this.parentTypes=["PropertyAttribute"]}getDefaults(){return Object.assign(super.getDefaults(),{offset:null,scale:null,max:null,min:null})}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},_f=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="NodeStructuralMetadata",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{class:"",properties:{}})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getProperties(){return this.get("properties")}setProperties(t){return this.set("properties",t)}},Nf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="MeshPrimitiveStructuralMetadata",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{propertyTextures:new xe,propertyAttributes:new xe})}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},Cf=class extends ee{extensionName=V;static EXTENSION_NAME=V;prewriteTypes=[C.BUFFER];prereadTypes=[C.SCENE];createStructuralMetadata(){return new yf(this.document.getGraph())}createSchema(){return new xf(this.document.getGraph())}createClass(){return new wf(this.document.getGraph())}createClassProperty(){return new vf(this.document.getGraph())}createEnum(){return new Mf(this.document.getGraph())}createEnumValue(){return new Ef(this.document.getGraph())}createPropertyTable(){return new Tf(this.document.getGraph())}createPropertyTableProperty(){return new kf(this.document.getGraph())}createPropertyTexture(){return new If(this.document.getGraph())}createPropertyTextureProperty(){return new Sf(this.document.getGraph())}createPropertyAttribute(){return new Rf(this.document.getGraph())}createPropertyAttributeProperty(){return new Af(this.document.getGraph())}createNodeStructuralMetadata(){return new _f(this.document.getGraph())}createMeshPrimitiveStructuralMetadata(){return new Nf(this.document.getGraph())}read(t){return this}preread(t){let e=this.document.getRoot(),{json:a}=t.jsonDoc,s=a.extensions[V],r=Ff(this,t,s);return e.setExtension(V,r),(a.meshes||[]).forEach((n,i)=>{let o=t.meshes[i].listPrimitives();(n.primitives||[]).forEach((c,d)=>{let h=o[d];this._readPrimitive(r,h,c)})}),(a.nodes||[]).forEach((n,i)=>{this._readNode(t.nodes[i],n)}),this}_readPrimitive(t,e,a){if(!a.extensions||!a.extensions.EXT_structural_metadata)return;let s=this.createMeshPrimitiveStructuralMetadata(),r=a.extensions[V],n=t.listPropertyTextures(),i=r.propertyTextures||[];for(let d of i){let h=n[d];s.addPropertyTexture(h)}let o=t.listPropertyAttributes(),c=r.propertyAttributes||[];for(let d of c){let h=o[d];s.addPropertyAttribute(h)}e.setExtension(V,s)}_readNode(t,e){if(!e.extensions||!e.extensions.EXT_structural_metadata)return;let a=e.extensions[V],s=this.createNodeStructuralMetadata().setClass(a.class).setProperties(a.properties);t.setExtension(V,s)}write(t){let e=this.document.getRoot(),a=e.getExtension(V);if(!a)return this;let s=t.jsonDoc.json,r=Hf(t,a);s.extensions=s.extensions||{},s.extensions[V]=r;let n=e.listMeshes(),i=s.meshes;if(i)for(let d of n){let h=i[t.meshIndexMap.get(d)];d.listPrimitives().forEach((u,m)=>{let p=h.primitives[m];this._writePrimitive(a,u,p)})}let o=e.listNodes(),c=s.nodes;if(c)for(let d of o){let h=t.nodeIndexMap.get(d);this._writeNode(d,c[h])}return this}_writePrimitive(t,e,a){let s=e.getExtension(V);if(!s)return;let r=t.listPropertyTextures(),n=t.listPropertyAttributes(),i,o,c=s.listPropertyTextures();if(c.length>0){i=[];for(let u of c){let m=r.indexOf(u);if(m>=0)i.push(m);else throw new Error(`${V}: Invalid property texture in mesh primitive`)}}let d=s.listPropertyAttributes();if(d.length>0){o=[];for(let u of d){let m=n.indexOf(u);if(m>=0)o.push(m);else throw new Error(`${V}: Invalid property attribute in mesh primitive`)}}let h={propertyTextures:i,propertyAttributes:o};a.extensions=a.extensions||{},a.extensions[V]=h}_writeNode(t,e){let a=t.getExtension("EXT_structural_metadata");a&&(e.extensions=e.extensions||{},e.extensions[V]={class:a.getClass(),properties:a.getProperties()})}prewrite(t,e){return e===C.BUFFER&&this._prewriteBuffers(t),this}_prewriteBuffers(t){let e=this.document,a=e.getRoot().getExtension(V);t.jsonDoc.json.bufferViews||=[];for(let s of a.listPropertyTables())for(let r of s.listPropertyValues()){let n=sh(e,t);n.push(r.getValues());let i=r.getArrayOffsets();i&&n.push(i);let o=r.getStringOffsets();o&&n.push(o)}}};function Ff(t,e,a){let s=t.createStructuralMetadata();if(a.schema!==void 0){let o=Bf(t,a.schema);s.setSchema(o)}else if(a.schemaUri){let o=a.schemaUri;s.setSchemaUri(o)}let r=a.propertyTextures||[];for(let o of r){let c=Lf(t,e,o);s.addPropertyTexture(c)}let n=a.propertyTables||[];for(let o of n){let c=Gf(t,e,o);s.addPropertyTable(c)}let i=a.propertyAttributes||[];for(let o of i){let c=zf(t,o);s.addPropertyAttribute(c)}return s}function Bf(t,e){let a=t.createSchema().setId(e.id);e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.version!==void 0&&a.setVersion(e.version);let s=e.classes||{};for(let n of Object.keys(s)){let i=s[n];a.setClass(n,jf(t,i))}let r=e.enums||{};for(let n of Object.keys(r))a.setEnum(n,Pf(t,r[n]));return a}function jf(t,e){let a=t.createClass();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description);let s=e.properties||{};for(let r of Object.keys(s)){let n=Of(t,s[r]);a.setProperty(r,n)}return a}function Of(t,e){let a=t.createClassProperty().setType(e.type);return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.componentType!==void 0&&a.setComponentType(e.componentType),e.enumType!==void 0&&a.setEnumType(e.enumType),e.array!==void 0&&a.setArray(e.array),e.count!==void 0&&a.setCount(e.count),e.normalized!==void 0&&a.setNormalized(e.normalized),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),e.required!==void 0&&a.setRequired(e.required),e.noData!==void 0&&a.setNoData(e.noData),e.default!==void 0&&a.setDefault(e.default),a}function Pf(t,e){let a=t.createEnum();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.valueType!==void 0&&a.setValueType(e.valueType);let s=e.values||{};for(let r of s)a.addEnumValue(Df(t,r));return a}function Df(t,e){let a=t.createEnumValue();return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.value!==void 0&&a.setValue(e.value),a}function Lf(t,e,a){let s=t.createPropertyTexture();s.setClass(a.class),a.name!==void 0&&s.setName(a.name);let r=a.properties||{};for(let n of Object.keys(r)){let i=Uf(t,e,r[n]);s.setProperty(n,i)}return s}function Uf(t,e,a){let s=t.createPropertyTextureProperty(),r=e.jsonDoc.json.textures||[];a.channels&&s.setChannels(a.channels);let n=r[a.index].source;if(n!==void 0){let i=e.textures[n];s.setTexture(i);let o=s.getTextureInfo();o&&e.setTextureInfo(o,a)}return a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function Gf(t,e,a){let s=t.createPropertyTable().setClass(a.class).setCount(a.count);a.name!==void 0&&s.setName(a.name);let r=a.properties||{};for(let n of Object.keys(r)){let i=Kf(t,e,r[n]);s.setProperty(n,i)}return s}function Kf(t,e,a){let s=t.createPropertyTableProperty(),r=Vr(e,a.values);if(s.setValues(r),a.arrayOffsets!==void 0){let n=Vr(e,a.arrayOffsets);s.setArrayOffsets(n)}if(a.stringOffsets!==void 0){let n=Vr(e,a.stringOffsets);s.setStringOffsets(n)}return a.arrayOffsetType!==void 0&&s.setArrayOffsetType(a.arrayOffsetType),a.stringOffsetType!==void 0&&s.setStringOffsetType(a.stringOffsetType),a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function zf(t,e){let a=t.createPropertyAttribute();a.setClass(e.class),e.name!==void 0&&a.setName(e.name);let s=e.properties||{};for(let r of Object.keys(s)){let n=Vf(t,s[r]);a.setProperty(r,n)}return a}function Vf(t,e){let a=t.createPropertyAttributeProperty();return a.setAttribute(e.attribute),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),a}function Hf(t,e){let a={},s=e.getSchema();s&&(a.schema=qf(s));let r=e.getSchemaUri();r&&(a.schemaUri=r);let n=e.listPropertyTables();if(n.length>0){let c=[];for(let d of n){let h=Yf(t,d);c.push(h)}a.propertyTables=c}let i=e.listPropertyTextures();if(i.length>0){let c=[];for(let d of i){let h=th(t,d);c.push(h)}a.propertyTextures=c}let o=e.listPropertyAttributes();if(o.length>0){let c=[];for(let d of o){let h=Zf(d);c.push(h)}a.propertyAttributes=c}return a}function qf(t){let e={id:t.getId()},a=t.listClassKeys();if(a.length>0){e.classes={};for(let r of a){let n=Xf(t.getClass(r));e.classes[r]=n}}let s=t.listEnumKeys();if(s.length>0){e.enums={};for(let r of s){let n=Jf(t.getEnum(r));e.enums[r]=n}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getVersion()&&(e.version=t.getVersion()),e}function Xf(t){let e={},a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let r=t.getProperty(s);e.properties[s]=Wf(r)}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),e}function Wf(t){let e={type:t.getType()};return t.getArray()&&(e.array=t.getArray()),t.getNormalized()&&(e.normalized=t.getNormalized()),t.getRequired()&&(e.required=t.getRequired()),t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getComponentType()!=null&&(e.componentType=t.getComponentType()),t.getEnumType()!=null&&(e.enumType=t.getEnumType()),t.getCount()!=null&&(e.count=t.getCount()),t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),t.getNoData()!=null&&(e.noData=t.getNoData()),t.getDefault()!=null&&(e.default=t.getDefault()),e}function Jf(t){let e={values:t.listValues().map($f)};return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getValueType()!=="UINT16"&&(e.valueType=t.getValueType()),e}function $f(t){let e={name:t.getName(),value:t.getValue()};return t.getDescription()&&(e.description=t.getDescription()),e}function Yf(t,e){let a={class:e.getClass(),count:e.getCount()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let r of s){let n=Qf(t,e.getProperty(r));a.properties[r]=n}}return a}function Qf(t,e){let a=e.getValues(),s={values:t.otherBufferViewsIndexMap.get(a)};if(e.getArrayOffsets()){let r=e.getArrayOffsets();s.arrayOffsets=t.otherBufferViewsIndexMap.get(r)}if(e.getStringOffsets()){let r=e.getStringOffsets();s.stringOffsets=t.otherBufferViewsIndexMap.get(r)}return e.getArrayOffsetType()!=null&&(s.arrayOffsetType=e.getArrayOffsetType()),e.getStringOffsetType()!=null&&(s.stringOffsetType=e.getStringOffsetType()),e.getOffset()!=null&&(s.offset=e.getOffset()),e.getScale()!=null&&(s.scale=e.getScale()),e.getMax()!=null&&(s.max=e.getMax()),e.getMin()!=null&&(s.min=e.getMin()),s}function Zf(t){let e={class:t.getClass()};t.getName()&&(e.name=t.getName());let a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let r=eh(t.getProperty(s));e.properties[s]=r}}return e}function eh(t){let e={attribute:t.getAttribute()};return t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),e}function th(t,e){let a={class:e.getClass()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let r of s){let n=ah(t,e.getProperty(r));a.properties[r]=n}}return a}function ah(t,e){let a=e.getTexture(),s=e.getTextureInfo(),r=e.getChannels(),n=t.createTextureInfoDef(a,s);return ie.eq(r,[0])||(n.channels=r),e.getOffset()!=null&&(n.offset=e.getOffset()),e.getScale()!=null&&(n.scale=e.getScale()),e.getMax()!=null&&(n.max=e.getMax()),e.getMin()!=null&&(n.min=e.getMin()),n}function Vr(t,e){let a=t.jsonDoc,s=a.json.buffers||[],r=(a.json.bufferViews||[])[e],n=s[r.buffer],i=n.uri?a.resources[n.uri]:a.resources[xt],o=r.byteOffset||0,c=r.byteLength;return i.slice(o,o+c)}function sh(t,e){let a=t.getRoot().listBuffers()[0],s=e.otherBufferViews.get(a);return s||(s=[],e.otherBufferViews.set(a,s)),s}var rh=class{match(t){return t.length>=12&&H.decodeText(t.slice(4,12))==="ftypavif"}getSize(t){if(!this.match(t))return null;let e=new DataView(t.buffer,t.byteOffset,t.byteLength),a=so(e,0);if(!a)return null;let s=a.end;for(;a=so(e,s);)if(a.type==="meta")s=a.start+4;else if(a.type==="iprp"||a.type==="ipco")s=a.start;else{if(a.type==="ispe")return[e.getUint32(a.start+4),e.getUint32(a.start+8)];if(a.type==="mdat")break;s=a.end}return null}getChannels(t){return 4}},nh=class extends ee{extensionName=ws;prereadTypes=[C.TEXTURE];static EXTENSION_NAME=ws;static register(){Ze.registerFormat("image/avif",new rh)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_avif&&(e.source=e.extensions[ws].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/avif"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[ws]={source:r.source},delete r.source)})}}),this}};function so(t,e){if(t.byteLength<4+e)return null;let a=t.getUint32(e);return t.byteLength<a+e||a<8?null:{type:H.decodeText(new Uint8Array(t.buffer,t.byteOffset+e+4,4)),start:e+8,end:e+a}}var ih=class{match(t){return t.length>=12&&t[8]===87&&t[9]===69&&t[10]===66&&t[11]===80}getSize(t){let e=H.decodeText(t.slice(0,4)),a=H.decodeText(t.slice(8,12));if(e!=="RIFF"||a!=="WEBP")return null;let s=new DataView(t.buffer,t.byteOffset),r=12;for(;r<s.byteLength;){let n=H.decodeText(new Uint8Array([s.getUint8(r),s.getUint8(r+1),s.getUint8(r+2),s.getUint8(r+3)])),i=s.getUint32(r+4,!0);if(n==="VP8 ")return[s.getInt16(r+14,!0)&16383,s.getInt16(r+16,!0)&16383];if(n==="VP8L"){let o=s.getUint8(r+9),c=s.getUint8(r+10),d=s.getUint8(r+11),h=s.getUint8(r+12);return[1+((c&63)<<8|o),1+((h&15)<<10|d<<2|(c&192)>>6)]}r+=8+i+i%2}return null}getChannels(t){return 4}},oh=class extends ee{extensionName=xs;prereadTypes=[C.TEXTURE];static EXTENSION_NAME=xs;static register(){Ze.registerFormat("image/webp",new ih)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_webp&&(e.source=e.extensions[xs].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/webp"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[xs]={source:r.source},delete r.source)})}}),this}},ro=Yu,ch=class extends ee{extensionName=ro;static EXTENSION_NAME=ro;read(t){return this}write(t){return this}},no=Qu,lh=class extends ee{extensionName=no;static EXTENSION_NAME=no;read(t){return this}write(t){return this}},he,wo,vo;function dh(t,e){let a=new he.DecoderBuffer;try{if(a.Init(e,e.length),t.GetEncodedGeometryType(a)!==he.TRIANGULAR_MESH)throw new Error(`[${le}] Unknown geometry type.`);let s=new he.Mesh;if(!t.DecodeBufferToMesh(a,s).ok()||s.ptr===0)throw new Error(`[${le}] Decoding failure.`);return s}finally{he.destroy(a)}}function uh(t,e){let a=e.num_faces()*3,s,r;if(e.num_points()<=65534){let n=a*Uint16Array.BYTES_PER_ELEMENT;s=he._malloc(n),t.GetTrianglesUInt16Array(e,n,s),r=new Uint16Array(he.HEAPU16.buffer,s,a).slice()}else{let n=a*Uint32Array.BYTES_PER_ELEMENT;s=he._malloc(n),t.GetTrianglesUInt32Array(e,n,s),r=new Uint32Array(he.HEAPU32.buffer,s,a).slice()}return he._free(s),r}function fh(t,e,a,s){let r=vo[s.componentType],n=wo[s.componentType],i=a.num_components(),o=e.num_points()*i,c=o*n.BYTES_PER_ELEMENT,d=he._malloc(c);t.GetAttributeDataArrayForAllPoints(e,a,r,c,d);let h=new n(he.HEAPF32.buffer,d,o).slice();return he._free(d),h}function hh(t){he=t,wo={[U.ComponentType.FLOAT]:Float32Array,[U.ComponentType.UNSIGNED_INT]:Uint32Array,[U.ComponentType.UNSIGNED_SHORT]:Uint16Array,[U.ComponentType.UNSIGNED_BYTE]:Uint8Array,[U.ComponentType.SHORT]:Int16Array,[U.ComponentType.BYTE]:Int8Array},vo={[U.ComponentType.FLOAT]:he.DT_FLOAT32,[U.ComponentType.UNSIGNED_INT]:he.DT_UINT32,[U.ComponentType.UNSIGNED_SHORT]:he.DT_UINT16,[U.ComponentType.UNSIGNED_BYTE]:he.DT_UINT8,[U.ComponentType.SHORT]:he.DT_INT16,[U.ComponentType.BYTE]:he.DT_INT8}}var Ue,bh=(function(t){return t[t.EDGEBREAKER=1]="EDGEBREAKER",t[t.SEQUENTIAL=0]="SEQUENTIAL",t})({}),Mo={POSITION:14,NORMAL:10,COLOR:8,TEX_COORD:12,GENERIC:12},io={decodeSpeed:5,encodeSpeed:5,method:1,quantizationBits:Mo,quantizationVolume:"mesh"};function ph(t){Ue=t}function gh(t,e=io){let a={...io,...e};a.quantizationBits={...Mo,...e.quantizationBits};let s=new Ue.MeshBuilder,r=new Ue.Mesh,n=new Ue.ExpertEncoder(r),i={},o=new Ue.DracoInt8Array,c=t.listTargets().length>0,d=!1;for(let l of t.listSemantics()){let y=t.getAttribute(l);if(y.getSparse()){d=!0;continue}let b=mh(l),g=yh(s,y.getComponentType(),r,Ue[b],y.getCount(),y.getElementSize(),y.getArray());if(g===-1)throw new Error(`Error compressing "${l}" attribute.`);if(i[l]=g,a.quantizationVolume==="mesh"||l!=="POSITION")n.SetAttributeQuantization(g,a.quantizationBits[b]);else if(typeof a.quantizationVolume=="object"){let{quantizationVolume:x}=a,v=Math.max(x.max[0]-x.min[0],x.max[1]-x.min[1],x.max[2]-x.min[2]);n.SetAttributeExplicitQuantization(g,a.quantizationBits[b],y.getElementSize(),x.min,v)}else throw new Error("Invalid quantization volume state.")}let h=t.getIndices();if(!h)throw new Wr("Primitive must have indices.");s.AddFacesToMesh(r,h.getCount()/3,h.getArray()),n.SetSpeedOptions(a.encodeSpeed,a.decodeSpeed),n.SetTrackEncodedProperties(!0),a.method===0||c||d?n.SetEncodingMethod(Ue.MESH_SEQUENTIAL_ENCODING):n.SetEncodingMethod(Ue.MESH_EDGEBREAKER_ENCODING);let u=n.EncodeToDracoBuffer(!(c||d),o);if(u<=0)throw new Wr("Error applying Draco compression.");let m=new Uint8Array(u);for(let l=0;l<u;++l)m[l]=o.GetValue(l);let p=n.GetNumberOfEncodedPoints(),f=n.GetNumberOfEncodedFaces()*3;return Ue.destroy(o),Ue.destroy(r),Ue.destroy(s),Ue.destroy(n),{numVertices:p,numIndices:f,data:m,attributeIDs:i}}function mh(t){return t==="POSITION"?"POSITION":t==="NORMAL"?"NORMAL":t.startsWith("COLOR_")?"COLOR":t.startsWith("TEXCOORD_")?"TEX_COORD":"GENERIC"}function yh(t,e,a,s,r,n,i){switch(e){case U.ComponentType.UNSIGNED_BYTE:return t.AddUInt8Attribute(a,s,r,n,i);case U.ComponentType.BYTE:return t.AddInt8Attribute(a,s,r,n,i);case U.ComponentType.UNSIGNED_SHORT:return t.AddUInt16Attribute(a,s,r,n,i);case U.ComponentType.SHORT:return t.AddInt16Attribute(a,s,r,n,i);case U.ComponentType.UNSIGNED_INT:return t.AddUInt32Attribute(a,s,r,n,i);case U.ComponentType.FLOAT:return t.AddFloatAttribute(a,s,r,n,i);default:throw new Error(`Unexpected component type, "${e}".`)}}var Wr=class extends Error{},xh=class extends ee{extensionName=le;prereadTypes=[C.PRIMITIVE];prewriteTypes=[C.ACCESSOR];readDependencies=["draco3d.decoder"];writeDependencies=["draco3d.encoder"];static EXTENSION_NAME=le;static EncoderMethod=bh;_decoderModule=null;_encoderModule=null;_encoderOptions={};install(t,e){return t==="draco3d.decoder"&&(this._decoderModule=e,hh(this._decoderModule)),t==="draco3d.encoder"&&(this._encoderModule=e,ph(this._encoderModule)),this}setEncoderOptions(t){return this._encoderOptions=t,this}preread(t){if(!this._decoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.decoder".`);let e=this.document.getLogger(),a=t.jsonDoc,s=new Map;try{let r=a.json.meshes||[];for(let n of r)for(let i of n.primitives){if(!i.extensions||!i.extensions.KHR_draco_mesh_compression)continue;let o=i.extensions[le],[c,d]=s.get(o.bufferView)||[];if(!d||!c){let h=a.json.bufferViews[o.bufferView],u=a.json.buffers[h.buffer],m=u.uri?a.resources[u.uri]:a.resources[xt],p=h.byteOffset||0,f=h.byteLength,l=H.toView(m,p,f);c=new this._decoderModule.Decoder,d=dh(c,l),s.set(o.bufferView,[c,d]),e.debug(`[${le}] Decompressed ${l.byteLength} bytes.`)}for(let h in o.attributes){let u=t.jsonDoc.json.accessors[i.attributes[h]],m=c.GetAttributeByUniqueId(d,o.attributes[h]),p=fh(c,d,m,u);t.accessors[i.attributes[h]].setArray(p)}i.indices!==void 0&&t.accessors[i.indices].setArray(uh(c,d))}}finally{for(let[r,n]of Array.from(s.values()))this._decoderModule.destroy(r),this._decoderModule.destroy(n)}return this}read(t){return this}prewrite(t,e){if(!this._encoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.encoder".`);let a=this.document.getLogger();a.debug(`[${le}] Compression options: ${JSON.stringify(this._encoderOptions)}`);let s=wh(this.document),r=new Map,n="mesh";this._encoderOptions.quantizationVolume==="scene"&&(this.document.getRoot().listScenes().length!==1?a.warn(`[${le}]: quantizationVolume=scene requires exactly 1 scene.`):n=Fi(this.document.getRoot().listScenes().pop()));for(let i of Array.from(s.keys())){let o=s.get(i);if(!o)throw new Error("Unexpected primitive.");if(r.has(o)){r.set(o,r.get(o));continue}let c=i.getIndices(),d=t.jsonDoc.json.accessors,h;try{h=gh(i,{...this._encoderOptions,quantizationVolume:n})}catch(p){if(p instanceof Wr){a.warn(`[${le}]: ${p.message} Skipping primitive compression.`);continue}throw p}r.set(o,h);let u=t.createAccessorDef(c);u.count=h.numIndices,t.accessorIndexMap.set(c,d.length),d.push(u),h.numVertices>65534&&U.getComponentSize(u.componentType)<=2?u.componentType=U.ComponentType.UNSIGNED_INT:h.numVertices>254&&U.getComponentSize(u.componentType)<=1&&(u.componentType=U.ComponentType.UNSIGNED_SHORT);for(let p of i.listSemantics()){let f=i.getAttribute(p);if(h.attributeIDs[p]===void 0)continue;let l=t.createAccessorDef(f);l.count=h.numVertices,t.accessorIndexMap.set(f,d.length),d.push(l)}let m=i.getAttribute("POSITION").getBuffer()||this.document.getRoot().listBuffers()[0];t.otherBufferViews.has(m)||t.otherBufferViews.set(m,[]),t.otherBufferViews.get(m).push(h.data)}return a.debug(`[${le}] Compressed ${s.size} primitives.`),t.extensionData[le]={primitiveHashMap:s,primitiveEncodingMap:r},this}write(t){let e=t.extensionData[le];for(let a of this.document.getRoot().listMeshes()){let s=t.jsonDoc.json.meshes[t.meshIndexMap.get(a)];for(let r=0;r<a.listPrimitives().length;r++){let n=a.listPrimitives()[r],i=s.primitives[r],o=e.primitiveHashMap.get(n);if(!o)continue;let c=e.primitiveEncodingMap.get(o);c&&(i.extensions=i.extensions||{},i.extensions[le]={bufferView:t.otherBufferViewsIndexMap.get(c.data),attributes:c.attributeIDs})}}if(!e.primitiveHashMap.size){let a=t.jsonDoc.json;a.extensionsUsed=(a.extensionsUsed||[]).filter(s=>s!==le),a.extensionsRequired=(a.extensionsRequired||[]).filter(s=>s!==le)}return this}};function wh(t){let e=t.getLogger(),a=new Set,s=new Set,r=0,n=0;for(let u of t.getRoot().listMeshes())for(let m of u.listPrimitives())m.getIndices()?m.getMode()!==Ia.Mode.TRIANGLES?(s.add(m),n++):a.add(m):(s.add(m),r++);r>0&&e.warn(`[${le}] Skipping Draco compression of ${r} non-indexed primitives.`),n>0&&e.warn(`[${le}] Skipping Draco compression of ${n} non-TRIANGLES primitives.`);let i=t.getRoot().listAccessors(),o=new Map;for(let u=0;u<i.length;u++)o.set(i[u],u);let c=new Map,d=new Set,h=new Map;for(let u of Array.from(a)){let m=oo(u,o);if(d.has(m)){h.set(u,m);continue}if(c.has(u.getIndices())){let p=u.getIndices(),f=p.clone();o.set(f,t.getRoot().listAccessors().length-1),u.swap(p,f)}for(let p of u.listAttributes())if(c.has(p)){let f=p.clone();o.set(f,t.getRoot().listAccessors().length-1),u.swap(p,f)}m=oo(u,o),d.add(m),h.set(u,m),c.set(u.getIndices(),m);for(let p of u.listAttributes())c.set(p,m)}for(let u of Array.from(c.keys())){let m=new Set(u.listParents().map(p=>p.propertyType));if(m.size!==2||!m.has(C.PRIMITIVE)||!m.has(C.ROOT))throw new Error(`[${le}] Compressed accessors must only be used as indices or vertex attributes.`)}for(let u of Array.from(a)){let m=h.get(u),p=u.getIndices();if(c.get(p)!==m||u.listAttributes().some(f=>c.get(f)!==m))throw new Error(`[${le}] Draco primitives must share all, or no, accessors.`)}for(let u of Array.from(s)){let m=u.getIndices();if(c.has(m)||u.listAttributes().some(p=>c.has(p)))throw new Error(`[${le}] Accessor cannot be shared by compressed and uncompressed primitives.`)}return h}function oo(t,e){let a=[],s=t.getIndices();a.push(e.get(s));for(let r of t.listAttributes())a.push(e.get(r));return a.sort().join("|")}var co=class Eo extends X{static EXTENSION_NAME=ot;static Type={POINT:"point",SPOT:"spot",DIRECTIONAL:"directional"};init(){this.extensionName=ot,this.propertyType="Light",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{color:[1,1,1],intensity:1,type:Eo.Type.POINT,range:null,innerConeAngle:0,outerConeAngle:Math.PI/4})}getColor(){return this.get("color")}setColor(e){return this.set("color",e)}getIntensity(){return this.get("intensity")}setIntensity(e){return this.set("intensity",e)}getType(){return this.get("type")}setType(e){return this.set("type",e)}getRange(){return this.get("range")}setRange(e){return this.set("range",e)}getInnerConeAngle(){return this.get("innerConeAngle")}setInnerConeAngle(e){return this.set("innerConeAngle",e)}getOuterConeAngle(){return this.get("outerConeAngle")}setOuterConeAngle(e){return this.set("outerConeAngle",e)}},vh=class extends ee{extensionName=ot;static EXTENSION_NAME=ot;createLight(t=""){return new co(this.document.getGraph(),t)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_lights_punctual)return this;let a=(e.json.extensions.KHR_lights_punctual.lights||[]).map(s=>{let r=this.createLight().setName(s.name||"").setType(s.type);return s.extras&&r.setExtras(s.extras),s.color!==void 0&&r.setColor(s.color),s.intensity!==void 0&&r.setIntensity(s.intensity),s.range!==void 0&&r.setRange(s.range),s.spot?.innerConeAngle!==void 0&&r.setInnerConeAngle(s.spot.innerConeAngle),s.spot?.outerConeAngle!==void 0&&r.setOuterConeAngle(s.spot.outerConeAngle),r});return e.json.nodes.forEach((s,r)=>{if(!s.extensions||!s.extensions.KHR_lights_punctual)return;let n=s.extensions[ot];t.nodes[r].setExtension(ot,a[n.light])}),this}write(t){let e=t.jsonDoc;if(this.properties.size===0)return this;let a=[],s=new Map;for(let r of this.properties){let n=r,i=t.createPropertyDef(r);i.type=n.getType(),ie.eq(n.getColor(),[1,1,1])||(i.color=n.getColor()),n.getIntensity()!==1&&(i.intensity=n.getIntensity()),n.getRange()!=null&&(i.range=n.getRange()),n.getName()&&(i.name=n.getName()),n.getType()===co.Type.SPOT&&(i.spot={innerConeAngle:n.getInnerConeAngle(),outerConeAngle:n.getOuterConeAngle()}),a.push(i),s.set(n,a.length-1)}return this.document.getRoot().listNodes().forEach(r=>{let n=r.getExtension(ot);if(n){let i=t.nodeIndexMap.get(r),o=e.json.nodes[i];o.extensions=o.extensions||{},o.extensions[ot]={light:s.get(n)}}}),e.json.extensions=e.json.extensions||{},e.json.extensions[ot]={lights:a},this}},{R:Mh,G:Eh,B:Th}=Ve,kh=class extends X{static EXTENSION_NAME=Mt;init(){this.extensionName=Mt,this.propertyType="Anisotropy",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{anisotropyStrength:0,anisotropyRotation:0,anisotropyTexture:null,anisotropyTextureInfo:new re(this.graph,"anisotropyTextureInfo")})}getAnisotropyStrength(){return this.get("anisotropyStrength")}setAnisotropyStrength(t){return this.set("anisotropyStrength",t)}getAnisotropyRotation(){return this.get("anisotropyRotation")}setAnisotropyRotation(t){return this.set("anisotropyRotation",t)}getAnisotropyTexture(){return this.getRef("anisotropyTexture")}getAnisotropyTextureInfo(){return this.getRef("anisotropyTexture")?this.getRef("anisotropyTextureInfo"):null}setAnisotropyTexture(t){return this.setRef("anisotropyTexture",t,{channels:Mh|Eh|Th})}},Ih=class extends ee{static EXTENSION_NAME=Mt;extensionName=Mt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createAnisotropy(){return new kh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_anisotropy){let i=this.createAnisotropy();t.materials[n].setExtension(Mt,i);let o=r.extensions[Mt];if(o.extras&&i.setExtras(o.extras),o.anisotropyStrength!==void 0&&i.setAnisotropyStrength(o.anisotropyStrength),o.anisotropyRotation!==void 0&&i.setAnisotropyRotation(o.anisotropyRotation),o.anisotropyTexture!==void 0){let c=o.anisotropyTexture,d=t.textures[s[c.index].source];i.setAnisotropyTexture(d),t.setTextureInfo(i.getAnisotropyTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Mt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Mt]=i,s.getAnisotropyStrength()>0&&(i.anisotropyStrength=s.getAnisotropyStrength()),s.getAnisotropyRotation()!==0&&(i.anisotropyRotation=s.getAnisotropyRotation()),s.getAnisotropyTexture()){let o=s.getAnisotropyTexture(),c=s.getAnisotropyTextureInfo();i.anisotropyTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:lo,G:uo,B:Sh}=Ve,Rh=class extends X{static EXTENSION_NAME=Et;init(){this.extensionName=Et,this.propertyType="Clearcoat",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{clearcoatFactor:0,clearcoatTexture:null,clearcoatTextureInfo:new re(this.graph,"clearcoatTextureInfo"),clearcoatRoughnessFactor:0,clearcoatRoughnessTexture:null,clearcoatRoughnessTextureInfo:new re(this.graph,"clearcoatRoughnessTextureInfo"),clearcoatNormalScale:1,clearcoatNormalTexture:null,clearcoatNormalTextureInfo:new re(this.graph,"clearcoatNormalTextureInfo")})}getClearcoatFactor(){return this.get("clearcoatFactor")}setClearcoatFactor(t){return this.set("clearcoatFactor",t)}getClearcoatTexture(){return this.getRef("clearcoatTexture")}getClearcoatTextureInfo(){return this.getRef("clearcoatTexture")?this.getRef("clearcoatTextureInfo"):null}setClearcoatTexture(t){return this.setRef("clearcoatTexture",t,{channels:lo})}getClearcoatRoughnessFactor(){return this.get("clearcoatRoughnessFactor")}setClearcoatRoughnessFactor(t){return this.set("clearcoatRoughnessFactor",t)}getClearcoatRoughnessTexture(){return this.getRef("clearcoatRoughnessTexture")}getClearcoatRoughnessTextureInfo(){return this.getRef("clearcoatRoughnessTexture")?this.getRef("clearcoatRoughnessTextureInfo"):null}setClearcoatRoughnessTexture(t){return this.setRef("clearcoatRoughnessTexture",t,{channels:uo})}getClearcoatNormalScale(){return this.get("clearcoatNormalScale")}setClearcoatNormalScale(t){return this.set("clearcoatNormalScale",t)}getClearcoatNormalTexture(){return this.getRef("clearcoatNormalTexture")}getClearcoatNormalTextureInfo(){return this.getRef("clearcoatNormalTexture")?this.getRef("clearcoatNormalTextureInfo"):null}setClearcoatNormalTexture(t){return this.setRef("clearcoatNormalTexture",t,{channels:lo|uo|Sh})}},Ah=class extends ee{static EXTENSION_NAME=Et;extensionName=Et;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createClearcoat(){return new Rh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_clearcoat){let i=this.createClearcoat();t.materials[n].setExtension(Et,i);let o=r.extensions[Et];if(o.extras&&i.setExtras(o.extras),o.clearcoatFactor!==void 0&&i.setClearcoatFactor(o.clearcoatFactor),o.clearcoatRoughnessFactor!==void 0&&i.setClearcoatRoughnessFactor(o.clearcoatRoughnessFactor),o.clearcoatTexture!==void 0){let c=o.clearcoatTexture,d=t.textures[s[c.index].source];i.setClearcoatTexture(d),t.setTextureInfo(i.getClearcoatTextureInfo(),c)}if(o.clearcoatRoughnessTexture!==void 0){let c=o.clearcoatRoughnessTexture,d=t.textures[s[c.index].source];i.setClearcoatRoughnessTexture(d),t.setTextureInfo(i.getClearcoatRoughnessTextureInfo(),c)}if(o.clearcoatNormalTexture!==void 0){let c=o.clearcoatNormalTexture,d=t.textures[s[c.index].source];i.setClearcoatNormalTexture(d),t.setTextureInfo(i.getClearcoatNormalTextureInfo(),c),c.scale!==void 0&&i.setClearcoatNormalScale(c.scale)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Et);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Et]=i,i.clearcoatFactor=s.getClearcoatFactor(),i.clearcoatRoughnessFactor=s.getClearcoatRoughnessFactor(),s.getClearcoatTexture()){let o=s.getClearcoatTexture(),c=s.getClearcoatTextureInfo();i.clearcoatTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatRoughnessTexture()){let o=s.getClearcoatRoughnessTexture(),c=s.getClearcoatRoughnessTextureInfo();i.clearcoatRoughnessTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatNormalTexture()){let o=s.getClearcoatNormalTexture(),c=s.getClearcoatNormalTextureInfo();i.clearcoatNormalTexture=t.createTextureInfoDef(o,c),s.getClearcoatNormalScale()!==1&&(i.clearcoatNormalTexture.scale=s.getClearcoatNormalScale())}}}),this}},{R:_h,G:Nh,B:Ch,A:Fh}=Ve,Bh=class extends X{static EXTENSION_NAME=Tt;init(){this.extensionName=Tt,this.propertyType="DiffuseTransmission",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseTransmissionFactor:0,diffuseTransmissionTexture:null,diffuseTransmissionTextureInfo:new re(this.graph,"diffuseTransmissionTextureInfo"),diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorTexture:null,diffuseTransmissionColorTextureInfo:new re(this.graph,"diffuseTransmissionColorTextureInfo")})}getDiffuseTransmissionFactor(){return this.get("diffuseTransmissionFactor")}setDiffuseTransmissionFactor(t){return this.set("diffuseTransmissionFactor",t)}getDiffuseTransmissionTexture(){return this.getRef("diffuseTransmissionTexture")}getDiffuseTransmissionTextureInfo(){return this.getRef("diffuseTransmissionTexture")?this.getRef("diffuseTransmissionTextureInfo"):null}setDiffuseTransmissionTexture(t){return this.setRef("diffuseTransmissionTexture",t,{channels:Fh})}getDiffuseTransmissionColorFactor(){return this.get("diffuseTransmissionColorFactor")}setDiffuseTransmissionColorFactor(t){return this.set("diffuseTransmissionColorFactor",t)}getDiffuseTransmissionColorTexture(){return this.getRef("diffuseTransmissionColorTexture")}getDiffuseTransmissionColorTextureInfo(){return this.getRef("diffuseTransmissionColorTexture")?this.getRef("diffuseTransmissionColorTextureInfo"):null}setDiffuseTransmissionColorTexture(t){return this.setRef("diffuseTransmissionColorTexture",t,{channels:_h|Nh|Ch})}},jh=class extends ee{extensionName=Tt;static EXTENSION_NAME=Tt;createDiffuseTransmission(){return new Bh(this.document.getGraph())}read(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_diffuse_transmission){let i=this.createDiffuseTransmission();t.materials[n].setExtension(Tt,i);let o=r.extensions[Tt];if(o.extras&&i.setExtras(o.extras),o.diffuseTransmissionFactor!==void 0&&i.setDiffuseTransmissionFactor(o.diffuseTransmissionFactor),o.diffuseTransmissionColorFactor!==void 0&&i.setDiffuseTransmissionColorFactor(o.diffuseTransmissionColorFactor),o.diffuseTransmissionTexture!==void 0){let c=o.diffuseTransmissionTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionTexture(d),t.setTextureInfo(i.getDiffuseTransmissionTextureInfo(),c)}if(o.diffuseTransmissionColorTexture!==void 0){let c=o.diffuseTransmissionColorTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionColorTexture(d),t.setTextureInfo(i.getDiffuseTransmissionColorTextureInfo(),c)}}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listMaterials()){let s=a.getExtension(Tt);if(!s)continue;let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Tt]=i,i.diffuseTransmissionFactor=s.getDiffuseTransmissionFactor(),i.diffuseTransmissionColorFactor=s.getDiffuseTransmissionColorFactor(),s.getDiffuseTransmissionTexture()){let o=s.getDiffuseTransmissionTexture(),c=s.getDiffuseTransmissionTextureInfo();i.diffuseTransmissionTexture=t.createTextureInfoDef(o,c)}if(s.getDiffuseTransmissionColorTexture()){let o=s.getDiffuseTransmissionColorTexture(),c=s.getDiffuseTransmissionColorTextureInfo();i.diffuseTransmissionColorTexture=t.createTextureInfoDef(o,c)}}return this}},Oh=class extends X{static EXTENSION_NAME=kt;init(){this.extensionName=kt,this.propertyType="Dispersion",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{dispersion:0})}getDispersion(){return this.get("dispersion")}setDispersion(t){return this.set("dispersion",t)}},Ph=class extends ee{static EXTENSION_NAME=kt;extensionName=kt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createDispersion(){return new Oh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_dispersion){let s=this.createDispersion();t.materials[a].setExtension(kt,s);let r=e.extensions[kt];r.extras&&s.setExtras(r.extras),r.dispersion!==void 0&&s.setDispersion(r.dispersion)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(kt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[kt]=i,i.dispersion=s.getDispersion()}}),this}},Dh=class extends X{static EXTENSION_NAME=It;init(){this.extensionName=It,this.propertyType="EmissiveStrength",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{emissiveStrength:1})}getEmissiveStrength(){return this.get("emissiveStrength")}setEmissiveStrength(t){return this.set("emissiveStrength",t)}},Lh=class extends ee{static EXTENSION_NAME=It;extensionName=It;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createEmissiveStrength(){return new Dh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_emissive_strength){let s=this.createEmissiveStrength();t.materials[a].setExtension(It,s);let r=e.extensions[It];r.extras&&s.setExtras(r.extras),r.emissiveStrength!==void 0&&s.setEmissiveStrength(r.emissiveStrength)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(It);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[It]=i,i.emissiveStrength=s.getEmissiveStrength()}}),this}},Uh=class extends X{static EXTENSION_NAME=St;init(){this.extensionName=St,this.propertyType="IOR",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{ior:1.5})}getIOR(){return this.get("ior")}setIOR(t){return this.set("ior",t)}},Gh=class extends ee{static EXTENSION_NAME=St;extensionName=St;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createIOR(){return new Uh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_ior){let s=this.createIOR();t.materials[a].setExtension(St,s);let r=e.extensions[St];r.extras&&s.setExtras(r.extras),r.ior!==void 0&&s.setIOR(r.ior)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(St);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[St]=i,i.ior=s.getIOR()}}),this}},{R:Kh,G:zh}=Ve,Vh=class extends X{static EXTENSION_NAME=Rt;init(){this.extensionName=Rt,this.propertyType="Iridescence",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{iridescenceFactor:0,iridescenceTexture:null,iridescenceTextureInfo:new re(this.graph,"iridescenceTextureInfo"),iridescenceIOR:1.3,iridescenceThicknessMinimum:100,iridescenceThicknessMaximum:400,iridescenceThicknessTexture:null,iridescenceThicknessTextureInfo:new re(this.graph,"iridescenceThicknessTextureInfo")})}getIridescenceFactor(){return this.get("iridescenceFactor")}setIridescenceFactor(t){return this.set("iridescenceFactor",t)}getIridescenceTexture(){return this.getRef("iridescenceTexture")}getIridescenceTextureInfo(){return this.getRef("iridescenceTexture")?this.getRef("iridescenceTextureInfo"):null}setIridescenceTexture(t){return this.setRef("iridescenceTexture",t,{channels:Kh})}getIridescenceIOR(){return this.get("iridescenceIOR")}setIridescenceIOR(t){return this.set("iridescenceIOR",t)}getIridescenceThicknessMinimum(){return this.get("iridescenceThicknessMinimum")}setIridescenceThicknessMinimum(t){return this.set("iridescenceThicknessMinimum",t)}getIridescenceThicknessMaximum(){return this.get("iridescenceThicknessMaximum")}setIridescenceThicknessMaximum(t){return this.set("iridescenceThicknessMaximum",t)}getIridescenceThicknessTexture(){return this.getRef("iridescenceThicknessTexture")}getIridescenceThicknessTextureInfo(){return this.getRef("iridescenceThicknessTexture")?this.getRef("iridescenceThicknessTextureInfo"):null}setIridescenceThicknessTexture(t){return this.setRef("iridescenceThicknessTexture",t,{channels:zh})}},Hh=class extends ee{static EXTENSION_NAME=Rt;extensionName=Rt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createIridescence(){return new Vh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_iridescence){let i=this.createIridescence();t.materials[n].setExtension(Rt,i);let o=r.extensions[Rt];if(o.extras&&i.setExtras(o.extras),o.iridescenceFactor!==void 0&&i.setIridescenceFactor(o.iridescenceFactor),o.iridescenceIor!==void 0&&i.setIridescenceIOR(o.iridescenceIor),o.iridescenceThicknessMinimum!==void 0&&i.setIridescenceThicknessMinimum(o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&i.setIridescenceThicknessMaximum(o.iridescenceThicknessMaximum),o.iridescenceTexture!==void 0){let c=o.iridescenceTexture,d=t.textures[s[c.index].source];i.setIridescenceTexture(d),t.setTextureInfo(i.getIridescenceTextureInfo(),c)}if(o.iridescenceThicknessTexture!==void 0){let c=o.iridescenceThicknessTexture,d=t.textures[s[c.index].source];i.setIridescenceThicknessTexture(d),t.setTextureInfo(i.getIridescenceThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Rt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Rt]=i,s.getIridescenceFactor()>0&&(i.iridescenceFactor=s.getIridescenceFactor()),s.getIridescenceIOR()!==1.3&&(i.iridescenceIor=s.getIridescenceIOR()),s.getIridescenceThicknessMinimum()!==100&&(i.iridescenceThicknessMinimum=s.getIridescenceThicknessMinimum()),s.getIridescenceThicknessMaximum()!==400&&(i.iridescenceThicknessMaximum=s.getIridescenceThicknessMaximum()),s.getIridescenceTexture()){let o=s.getIridescenceTexture(),c=s.getIridescenceTextureInfo();i.iridescenceTexture=t.createTextureInfoDef(o,c)}if(s.getIridescenceThicknessTexture()){let o=s.getIridescenceThicknessTexture(),c=s.getIridescenceThicknessTextureInfo();i.iridescenceThicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:fo,G:ho,B:bo,A:po}=Ve,qh=class extends X{static EXTENSION_NAME=At;init(){this.extensionName=At,this.propertyType="PBRSpecularGlossiness",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseFactor:[1,1,1,1],diffuseTexture:null,diffuseTextureInfo:new re(this.graph,"diffuseTextureInfo"),specularFactor:[1,1,1],glossinessFactor:1,specularGlossinessTexture:null,specularGlossinessTextureInfo:new re(this.graph,"specularGlossinessTextureInfo")})}getDiffuseFactor(){return this.get("diffuseFactor")}setDiffuseFactor(t){return this.set("diffuseFactor",t)}getDiffuseTexture(){return this.getRef("diffuseTexture")}getDiffuseTextureInfo(){return this.getRef("diffuseTexture")?this.getRef("diffuseTextureInfo"):null}setDiffuseTexture(t){return this.setRef("diffuseTexture",t,{channels:fo|ho|bo|po,isColor:!0})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getGlossinessFactor(){return this.get("glossinessFactor")}setGlossinessFactor(t){return this.set("glossinessFactor",t)}getSpecularGlossinessTexture(){return this.getRef("specularGlossinessTexture")}getSpecularGlossinessTextureInfo(){return this.getRef("specularGlossinessTexture")?this.getRef("specularGlossinessTextureInfo"):null}setSpecularGlossinessTexture(t){return this.setRef("specularGlossinessTexture",t,{channels:fo|ho|bo|po})}},Xh=class extends ee{static EXTENSION_NAME=At;extensionName=At;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createPBRSpecularGlossiness(){return new qh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_pbrSpecularGlossiness){let i=this.createPBRSpecularGlossiness();t.materials[n].setExtension(At,i);let o=r.extensions[At];if(o.extras&&i.setExtras(o.extras),o.diffuseFactor!==void 0&&i.setDiffuseFactor(o.diffuseFactor),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.glossinessFactor!==void 0&&i.setGlossinessFactor(o.glossinessFactor),o.diffuseTexture!==void 0){let c=o.diffuseTexture,d=t.textures[s[c.index].source];i.setDiffuseTexture(d),t.setTextureInfo(i.getDiffuseTextureInfo(),c)}if(o.specularGlossinessTexture!==void 0){let c=o.specularGlossinessTexture,d=t.textures[s[c.index].source];i.setSpecularGlossinessTexture(d),t.setTextureInfo(i.getSpecularGlossinessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(At);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[At]=i,i.diffuseFactor=s.getDiffuseFactor(),i.specularFactor=s.getSpecularFactor(),i.glossinessFactor=s.getGlossinessFactor(),s.getDiffuseTexture()){let o=s.getDiffuseTexture(),c=s.getDiffuseTextureInfo();i.diffuseTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularGlossinessTexture()){let o=s.getSpecularGlossinessTexture(),c=s.getSpecularGlossinessTextureInfo();i.specularGlossinessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Wh,G:Jh,B:$h,A:Yh}=Ve,Qh=class extends X{static EXTENSION_NAME=_t;init(){this.extensionName=_t,this.propertyType="Sheen",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{sheenColorFactor:[0,0,0],sheenColorTexture:null,sheenColorTextureInfo:new re(this.graph,"sheenColorTextureInfo"),sheenRoughnessFactor:0,sheenRoughnessTexture:null,sheenRoughnessTextureInfo:new re(this.graph,"sheenRoughnessTextureInfo")})}getSheenColorFactor(){return this.get("sheenColorFactor")}setSheenColorFactor(t){return this.set("sheenColorFactor",t)}getSheenColorTexture(){return this.getRef("sheenColorTexture")}getSheenColorTextureInfo(){return this.getRef("sheenColorTexture")?this.getRef("sheenColorTextureInfo"):null}setSheenColorTexture(t){return this.setRef("sheenColorTexture",t,{channels:Wh|Jh|$h,isColor:!0})}getSheenRoughnessFactor(){return this.get("sheenRoughnessFactor")}setSheenRoughnessFactor(t){return this.set("sheenRoughnessFactor",t)}getSheenRoughnessTexture(){return this.getRef("sheenRoughnessTexture")}getSheenRoughnessTextureInfo(){return this.getRef("sheenRoughnessTexture")?this.getRef("sheenRoughnessTextureInfo"):null}setSheenRoughnessTexture(t){return this.setRef("sheenRoughnessTexture",t,{channels:Yh})}},Zh=class extends ee{static EXTENSION_NAME=_t;extensionName=_t;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createSheen(){return new Qh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_sheen){let i=this.createSheen();t.materials[n].setExtension(_t,i);let o=r.extensions[_t];if(o.extras&&i.setExtras(o.extras),o.sheenColorFactor!==void 0&&i.setSheenColorFactor(o.sheenColorFactor),o.sheenRoughnessFactor!==void 0&&i.setSheenRoughnessFactor(o.sheenRoughnessFactor),o.sheenColorTexture!==void 0){let c=o.sheenColorTexture,d=t.textures[s[c.index].source];i.setSheenColorTexture(d),t.setTextureInfo(i.getSheenColorTextureInfo(),c)}if(o.sheenRoughnessTexture!==void 0){let c=o.sheenRoughnessTexture,d=t.textures[s[c.index].source];i.setSheenRoughnessTexture(d),t.setTextureInfo(i.getSheenRoughnessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(_t);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[_t]=i,i.sheenColorFactor=s.getSheenColorFactor(),i.sheenRoughnessFactor=s.getSheenRoughnessFactor(),s.getSheenColorTexture()){let o=s.getSheenColorTexture(),c=s.getSheenColorTextureInfo();i.sheenColorTexture=t.createTextureInfoDef(o,c)}if(s.getSheenRoughnessTexture()){let o=s.getSheenRoughnessTexture(),c=s.getSheenRoughnessTextureInfo();i.sheenRoughnessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:eb,G:tb,B:ab,A:sb}=Ve,rb=class extends X{static EXTENSION_NAME=Nt;init(){this.extensionName=Nt,this.propertyType="Specular",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{specularFactor:1,specularTexture:null,specularTextureInfo:new re(this.graph,"specularTextureInfo"),specularColorFactor:[1,1,1],specularColorTexture:null,specularColorTextureInfo:new re(this.graph,"specularColorTextureInfo")})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getSpecularColorFactor(){return this.get("specularColorFactor")}setSpecularColorFactor(t){return this.set("specularColorFactor",t)}getSpecularTexture(){return this.getRef("specularTexture")}getSpecularTextureInfo(){return this.getRef("specularTexture")?this.getRef("specularTextureInfo"):null}setSpecularTexture(t){return this.setRef("specularTexture",t,{channels:sb})}getSpecularColorTexture(){return this.getRef("specularColorTexture")}getSpecularColorTextureInfo(){return this.getRef("specularColorTexture")?this.getRef("specularColorTextureInfo"):null}setSpecularColorTexture(t){return this.setRef("specularColorTexture",t,{channels:eb|tb|ab,isColor:!0})}},nb=class extends ee{static EXTENSION_NAME=Nt;extensionName=Nt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createSpecular(){return new rb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_specular){let i=this.createSpecular();t.materials[n].setExtension(Nt,i);let o=r.extensions[Nt];if(o.extras&&i.setExtras(o.extras),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.specularColorFactor!==void 0&&i.setSpecularColorFactor(o.specularColorFactor),o.specularTexture!==void 0){let c=o.specularTexture,d=t.textures[s[c.index].source];i.setSpecularTexture(d),t.setTextureInfo(i.getSpecularTextureInfo(),c)}if(o.specularColorTexture!==void 0){let c=o.specularColorTexture,d=t.textures[s[c.index].source];i.setSpecularColorTexture(d),t.setTextureInfo(i.getSpecularColorTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Nt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Nt]=i,s.getSpecularFactor()!==1&&(i.specularFactor=s.getSpecularFactor()),ie.eq(s.getSpecularColorFactor(),[1,1,1])||(i.specularColorFactor=s.getSpecularColorFactor()),s.getSpecularTexture()){let o=s.getSpecularTexture(),c=s.getSpecularTextureInfo();i.specularTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularColorTexture()){let o=s.getSpecularColorTexture(),c=s.getSpecularColorTextureInfo();i.specularColorTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:ib}=Ve,ob=class extends X{static EXTENSION_NAME=Ct;init(){this.extensionName=Ct,this.propertyType="Transmission",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{transmissionFactor:0,transmissionTexture:null,transmissionTextureInfo:new re(this.graph,"transmissionTextureInfo")})}getTransmissionFactor(){return this.get("transmissionFactor")}setTransmissionFactor(t){return this.set("transmissionFactor",t)}getTransmissionTexture(){return this.getRef("transmissionTexture")}getTransmissionTextureInfo(){return this.getRef("transmissionTexture")?this.getRef("transmissionTextureInfo"):null}setTransmissionTexture(t){return this.setRef("transmissionTexture",t,{channels:ib})}},cb=class extends ee{static EXTENSION_NAME=Ct;extensionName=Ct;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createTransmission(){return new ob(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_transmission){let i=this.createTransmission();t.materials[n].setExtension(Ct,i);let o=r.extensions[Ct];if(o.extras&&i.setExtras(o.extras),o.transmissionFactor!==void 0&&i.setTransmissionFactor(o.transmissionFactor),o.transmissionTexture!==void 0){let c=o.transmissionTexture,d=t.textures[s[c.index].source];i.setTransmissionTexture(d),t.setTextureInfo(i.getTransmissionTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Ct);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Ct]=i,i.transmissionFactor=s.getTransmissionFactor(),s.getTransmissionTexture()){let o=s.getTransmissionTexture(),c=s.getTransmissionTextureInfo();i.transmissionTexture=t.createTextureInfoDef(o,c)}}}),this}},lb=class extends X{static EXTENSION_NAME=na;init(){this.extensionName=na,this.propertyType="Unlit",this.parentTypes=[C.MATERIAL]}},db=class extends ee{static EXTENSION_NAME=na;extensionName=na;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createUnlit(){return new lb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{e.extensions&&e.extensions.KHR_materials_unlit&&t.materials[a].setExtension(na,this.createUnlit())}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{if(a.getExtension("KHR_materials_unlit")){let s=t.materialIndexMap.get(a),r=e.json.materials[s];r.extensions=r.extensions||{},r.extensions[na]={}}}),this}},ub=class extends X{static EXTENSION_NAME=Be;init(){this.extensionName=Be,this.propertyType="Mapping",this.parentTypes=["MappingList"]}getDefaults(){return Object.assign(super.getDefaults(),{material:null,variants:new ae})}getMaterial(){return this.getRef("material")}setMaterial(t){return this.setRef("material",t)}addVariant(t){return this.addRef("variants",t)}removeVariant(t){return this.removeRef("variants",t)}listVariants(){return this.listRefs("variants")}},fb=class extends X{static EXTENSION_NAME=Be;init(){this.extensionName=Be,this.propertyType="MappingList",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{mappings:new ae})}addMapping(t){return this.addRef("mappings",t)}removeMapping(t){return this.removeRef("mappings",t)}listMappings(){return this.listRefs("mappings")}},go=class extends X{static EXTENSION_NAME=Be;init(){this.extensionName=Be,this.propertyType="Variant",this.parentTypes=["MappingList"]}},hb=class extends ee{extensionName=Be;static EXTENSION_NAME=Be;createMappingList(){return new fb(this.document.getGraph())}createVariant(t=""){return new go(this.document.getGraph(),t)}createMapping(){return new ub(this.document.getGraph())}listVariants(){return Array.from(this.properties).filter(t=>t instanceof go)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_materials_variants)return this;let a=(e.json.extensions.KHR_materials_variants.variants||[]).map(s=>this.createVariant().setName(s.name||""));return(e.json.meshes||[]).forEach((s,r)=>{let n=t.meshes[r];(s.primitives||[]).forEach((i,o)=>{if(!i.extensions||!i.extensions.KHR_materials_variants)return;let c=this.createMappingList(),d=i.extensions[Be];for(let h of d.mappings){let u=this.createMapping();h.material!==void 0&&u.setMaterial(t.materials[h.material]);for(let m of h.variants||[])u.addVariant(a[m]);c.addMapping(u)}n.listPrimitives()[o].setExtension(Be,c)})}),this}write(t){let e=t.jsonDoc,a=this.listVariants();if(!a.length)return this;let s=[],r=new Map;for(let n of a)r.set(n,s.length),s.push(t.createPropertyDef(n));for(let n of this.document.getRoot().listMeshes()){let i=t.meshIndexMap.get(n);n.listPrimitives().forEach((o,c)=>{let d=o.getExtension(Be);if(!d)return;let h=t.jsonDoc.json.meshes[i].primitives[c],u=d.listMappings().map(m=>{let p=t.createPropertyDef(m),f=m.getMaterial();return f&&(p.material=t.materialIndexMap.get(f)),p.variants=m.listVariants().map(l=>r.get(l)),p});h.extensions=h.extensions||{},h.extensions[Be]={mappings:u}})}return e.json.extensions=e.json.extensions||{},e.json.extensions[Be]={variants:s},this}},{G:bb}=Ve,pb=class extends X{static EXTENSION_NAME=Ft;init(){this.extensionName=Ft,this.propertyType="Volume",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{thicknessFactor:0,thicknessTexture:null,thicknessTextureInfo:new re(this.graph,"thicknessTexture"),attenuationDistance:1/0,attenuationColor:[1,1,1]})}getThicknessFactor(){return this.get("thicknessFactor")}setThicknessFactor(t){return this.set("thicknessFactor",t)}getThicknessTexture(){return this.getRef("thicknessTexture")}getThicknessTextureInfo(){return this.getRef("thicknessTexture")?this.getRef("thicknessTextureInfo"):null}setThicknessTexture(t){return this.setRef("thicknessTexture",t,{channels:bb})}getAttenuationDistance(){return this.get("attenuationDistance")}setAttenuationDistance(t){return this.set("attenuationDistance",t)}getAttenuationColor(){return this.get("attenuationColor")}setAttenuationColor(t){return this.set("attenuationColor",t)}},gb=class extends ee{static EXTENSION_NAME=Ft;extensionName=Ft;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createVolume(){return new pb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_volume){let i=this.createVolume();t.materials[n].setExtension(Ft,i);let o=r.extensions[Ft];if(o.extras&&i.setExtras(o.extras),o.thicknessFactor!==void 0&&i.setThicknessFactor(o.thicknessFactor),o.attenuationDistance!==void 0&&i.setAttenuationDistance(o.attenuationDistance),o.attenuationColor!==void 0&&i.setAttenuationColor(o.attenuationColor),o.thicknessTexture!==void 0){let c=o.thicknessTexture,d=t.textures[s[c.index].source];i.setThicknessTexture(d),t.setTextureInfo(i.getThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Ft);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Ft]=i,s.getThicknessFactor()>0&&(i.thicknessFactor=s.getThicknessFactor()),Number.isFinite(s.getAttenuationDistance())&&(i.attenuationDistance=s.getAttenuationDistance()),ie.eq(s.getAttenuationColor(),[1,1,1])||(i.attenuationColor=s.getAttenuationColor()),s.getThicknessTexture()){let o=s.getThicknessTexture(),c=s.getThicknessTextureInfo();i.thicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},mb=class extends ee{extensionName=Qi;static EXTENSION_NAME=Qi;read(t){return this}write(t){return this}},Yr=class extends ee{extensionName=Zi;static EXTENSION_NAME=Zi;read(t){return this}write(t){return this}},yb=class extends X{static EXTENSION_NAME=Bt;init(){this.extensionName=Bt,this.propertyType="Visibility",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{visible:!0})}getVisible(){return this.get("visible")}setVisible(t){return this.set("visible",t)}},xb=class extends ee{static EXTENSION_NAME=Bt;extensionName=Bt;createVisibility(){return new yb(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_node_visibility){let s=this.createVisibility();t.nodes[a].setExtension(Bt,s);let r=e.extensions[Bt];r.visible!==void 0&&s.setVisible(r.visible)}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listNodes()){let s=a.getExtension(Bt);if(!s)continue;let r=t.nodeIndexMap.get(a),n=e.json.nodes[r];n.extensions=n.extensions||{},n.extensions[Bt]={visible:s.getVisible()}}return this}};function wb(t){return t.vkFormat>0&&t.vkFormat<=123}function mo(t){let e=t.vkFormat===1000066e3&&t.dataFormatDescriptor[0].colorModel===167;return t.vkFormat===0||e}var vb=class{match(t){return t[0]===171&&t[1]===75&&t[2]===84&&t[3]===88&&t[4]===32&&t[5]===50&&t[6]===48&&t[7]===187&&t[8]===13&&t[9]===10&&t[10]===26&&t[11]===10}getSize(t){let e=ys(t);return[e.pixelWidth,e.pixelHeight]}getChannels(t){let e=ys(t),a=e.dataFormatDescriptor[0];if(wb(e))return a.samples.length;if(mo(e))switch(a.colorModel){case 163:return a.samples.length===2&&(a.samples[1].channelType&15)===15?4:3;case 166:return(a.samples[0].channelType&15)===3?4:3;default:throw new Error(`Unexpected KTX2 colorModel, "${a.colorModel}".`)}throw new Error(`Unexpected KTX2 vkFormat, "${e.vkFormat}".`)}getVRAMByteLength(t){let e=ys(t),a=0;if(mo(e)){let s=this.getChannels(t)>3;for(let r=0;r<e.levels.length;r++){let n=e.levels[r];if(n.uncompressedByteLength)a+=n.uncompressedByteLength;else{let i=Math.max(1,Math.floor(e.pixelWidth/Math.pow(2,r))),o=Math.max(1,Math.floor(e.pixelHeight/Math.pow(2,r))),c=s?16:8;a+=i/4*(o/4)*c}}}else for(let s of e.levels)e.supercompressionScheme===0?a+=s.levelData.byteLength:a+=s.uncompressedByteLength;return a}},Mb=class extends ee{static EXTENSION_NAME=vs;extensionName=vs;prereadTypes=[C.TEXTURE];static register(){Ze.registerFormat("image/ktx2",new vb)}preread(t){return t.jsonDoc.json.textures&&t.jsonDoc.json.textures.forEach(e=>{e.extensions&&e.extensions.KHR_texture_basisu&&(e.source=e.extensions[vs].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/ktx2"){let s=t.imageIndexMap.get(a);e.json.textures.forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[vs]={source:r.source},delete r.source)})}}),this}},Eb=class extends X{static EXTENSION_NAME=jt;init(){this.extensionName=jt,this.propertyType="Transform",this.parentTypes=[C.TEXTURE_INFO]}getDefaults(){return Object.assign(super.getDefaults(),{offset:[0,0],rotation:0,scale:[1,1],texCoord:null})}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getRotation(){return this.get("rotation")}setRotation(t){return this.set("rotation",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getTexCoord(){return this.get("texCoord")}setTexCoord(t){return this.set("texCoord",t)}},Tb=class extends ee{extensionName=jt;static EXTENSION_NAME=jt;createTransform(){return new Eb(this.document.getGraph())}read(t){for(let[e,a]of Array.from(t.textureInfos.entries())){if(!a.extensions||!a.extensions.KHR_texture_transform)continue;let s=this.createTransform(),r=a.extensions[jt];r.offset!==void 0&&s.setOffset(r.offset),r.rotation!==void 0&&s.setRotation(r.rotation),r.scale!==void 0&&s.setScale(r.scale),r.texCoord!==void 0&&s.setTexCoord(r.texCoord),e.setExtension(jt,s)}return this}write(t){let e=Array.from(t.textureInfoDefMap.entries());for(let[a,s]of e){let r=a.getExtension(jt);if(!r)continue;s.extensions=s.extensions||{};let n={},i=ie.eq;i(r.getOffset(),[0,0])||(n.offset=r.getOffset()),r.getRotation()!==0&&(n.rotation=r.getRotation()),i(r.getScale(),[1,1])||(n.scale=r.getScale()),r.getTexCoord()!=null&&(n.texCoord=r.getTexCoord()),s.extensions[jt]=n}return this}},kb=[C.ROOT,C.SCENE,C.NODE,C.MESH,C.MATERIAL,C.TEXTURE,C.ANIMATION],Ib=class extends X{static EXTENSION_NAME=He;init(){this.extensionName=He,this.propertyType="Packet",this.parentTypes=kb}getDefaults(){return Object.assign(super.getDefaults(),{context:{},properties:{}})}getContext(){return this.get("context")}setContext(t){return this.set("context",{...t})}listProperties(){return Object.keys(this.get("properties"))}getProperty(t){let e=this.get("properties");return t in e?e[t]:null}setProperty(t,e){this._assertContext(t);let a={...this.get("properties")};return e?a[t]=e:delete a[t],this.set("properties",a)}toJSONLD(){return{"@context":Hr(this.get("context")),...Hr(this.get("properties"))}}fromJSONLD(t){t=Hr(t);let e=t["@context"];return e&&this.set("context",e),delete t["@context"],this.set("properties",t)}_assertContext(t){if(!(t.split(":")[0]in this.get("context")))throw new Error(`${He}: Missing context for term, "${t}".`)}};function Hr(t){return JSON.parse(JSON.stringify(t))}var Sb=class extends ee{extensionName=He;static EXTENSION_NAME=He;createPacket(){return new Ib(this.document.getGraph())}listPackets(){return Array.from(this.properties)}read(t){let e=t.jsonDoc.json.extensions?.[He];if(!e||!e.packets)return this;let a=t.jsonDoc.json,s=this.document.getRoot(),r=e.packets.map(o=>this.createPacket().fromJSONLD(o)),n=[[a.asset],a.scenes,a.nodes,a.meshes,a.materials,a.images,a.animations],i=[[s],s.listScenes(),s.listNodes(),s.listMeshes(),s.listMaterials(),s.listTextures(),s.listAnimations()];for(let o=0;o<n.length;o++){let c=n[o]||[];for(let d=0;d<c.length;d++){let h=c[d];if(h.extensions&&h.extensions.KHR_xmp_json_ld){let u=h.extensions[He];i[o][d].setExtension(He,r[u.packet])}}}return this}write(t){let{json:e}=t.jsonDoc,a=[];for(let s of this.properties){a.push(s.toJSONLD());for(let r of s.listParents()){let n;switch(r.propertyType){case C.ROOT:n=e.asset;break;case C.SCENE:n=e.scenes[t.sceneIndexMap.get(r)];break;case C.NODE:n=e.nodes[t.nodeIndexMap.get(r)];break;case C.MESH:n=e.meshes[t.meshIndexMap.get(r)];break;case C.MATERIAL:n=e.materials[t.materialIndexMap.get(r)];break;case C.TEXTURE:n=e.images[t.imageIndexMap.get(r)];break;case C.ANIMATION:n=e.animations[t.animationIndexMap.get(r)];break;default:n=null,this.document.getLogger().warn(`[${He}]: Unsupported parent property, "${r.propertyType}"`);break}n&&(n.extensions=n.extensions||{},n.extensions[He]={packet:a.length-1})}}return a.length>0&&(e.extensions=e.extensions||{},e.extensions[He]={packets:a}),this}},Rb=[ch,lh,xh,vh,Ih,Ah,jh,Ph,Lh,Gh,Hh,Xh,nb,Zh,cb,db,hb,gb,mb,Yr,xb,Mb,Tb,Sb],Bx=[of,Jr,$r,Cf,nh,oh,...Rb];var Z0=(function(){var t="b9H79Tebbbe9ok9Geueu9Geub9Gbb9Gruuuuuuueu9Gvuuuuueu9Gduueu9Gluuuueu9Gvuuuuub9Gouuuuuub9Gluuuub9Giuuueui8AYdilveoveovrrwrrDDoDrbqqbelve9Weiiviebeoweuec;G:Qdkr:nlAo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9mW4W2be8A9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWVbd8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9c9V919U9KbiE9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949wWV79P9V9UblY9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWVbv8E9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWV9c9V919U9Kbo8A9TW79O9V9Wt9FW9U9J9V9KW69U9KW949wWV79P9V9UbrE9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JWbwa9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JW9c9V919U9KbDL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9p9JtbqK9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9r919HtbkL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWVT949WbxE9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OWbsa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OW9ttV9P9Wbza9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9WbHK9TW79O9V9Wt9F79W9Ht9P9H29t9VVt9sW9T9H9WbOl79IV9RbCDwebcekdKLqN9OYdbk:Bhdhud9:8Jjjjjbc;qw9Rgr8KjjjjbcbhwdnaeTmbabcbyd;C:kjjbaoaocb9iEgDc:GeV86bbarc;adfcbcjdz:wjjjb8AdnaiTmbarc;adfadalz:vjjjb8Akarc;abfalfcbcbcjdal9RalcFe0Ez:wjjjb8Aarc;abfarc;adfalz:vjjjb8AarcUf9cb83ibarc8Wf9cb83ibarcyf9cb83ibarcaf9cb83ibarcKf9cb83ibarczf9cb83ibar9cb83iwar9cb83ibcj;abal9Uc;WFbGcjdalca0Ehqdnaicd6mbavcd9imbaDTmbadcefhkaqci2gxal2hmarc;alfclfhParc;qlfceVhsarc;qofclVhzarc;qofcKfhHarc;qofczfhOcbhAincdhCcbhodnavci6mbaH9cb83ibaO9cb83ibar9cb83i;yoar9cb83i;qoadaAfgoybbhXcbhQincbhwcbhLdninaoalfhKaoybbgYaX7aLVhLawcP0meaKhoaYhXawcefgwaQfai6mbkkcbhXarc;qofhwincwh8AcwhEdnaLaX93gocFeGg3cs0mbclhEa3ci0mba3cb9hcethEkdnaocw4cFeGg3cs0mbclh8Aa3ci0mba3cb9hceth8Aka8AaEfh3awydbh5cwh8AcwhEdnaocz4cFeGg8Ecs0mbclhEa8Eci0mba8Ecb9hcethEka3a5fh3dnaocFFFFb0mbclh8AaocFFF8F0mbaocFFFr0ceth8Akawa3aEfa8AfBdbawclfhwaXcefgXcw9hmbkaKhoaYhXaQczfgQai6mbkcbhocehwazhLinawaoaLydbarc;qofaocdtfydb6EhoaLclfhLawcefgwcw9hmbkcihCkcbh3arc;qlfcbcjdz:wjjjb8Aarc;alfcwfcbBdbar9cb83i;alaoclth8Fadhaaqhhakh5inarc;qlfadcba3cufgoaoa30Eal2falz:vjjjb8Aaiahaiah6Ehgdnaqaia39Ra3aqfai6EgYcsfc9WGgoaY9nmbarc;qofaYfcbaoaY9Rz:wjjjb8Akada3al2fh8Jcbh8Kina8Ka8FVcl4hQarc;alfa8Kcdtfh8LaAh8Mcbh8Nina8NaAfhwdndndndndndna8KPldebidkasa8Mc98GgLfhoa5aLfh8Aarc;qlfawc98GgLfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkaYTmla8Ncith8Ea8JaLfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aQ93a8E486bba8Aalfh8AaEalfhEaLhXaKcefgKaY9hmbxlkkaYTmia8Mc9:Ghoa8NcitcwGhEarc;qlfawceVfRbbcwtarc;qlfawc9:GfRbbVhLarc;qofhwaghXinawa5aofRbbcwtaaaofRbbVg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbaoalfhoawcefhwa8AhLa3aXcufgX9hmbxikkaYTmda8Jawfhoarc;qlfawfRbbhLarc;qofhwaghXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLa3aXcufgX9hmbxdkkaYTmeka8LydbhEcbhKarc;qofhoincdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egwa8Aawa8A6Egwczawcz6EaEfhEaoczfhoaKczfgKaY6mbka8LaEBdbka8Mcefh8Ma8Ncefg8Ncl9hmbka8Kcefg8KaC9hmbkaaamfhaahaxfhha5amfh5a3axfg3ai6mbkcbhocehwaPhLinawaoaLydbarc;alfaocdtfydb6EhoaLclfhLawcefgXhwaCaX9hmbkaraAcd4fa8FcdVaoaocdSE86bbaAclfgAal6mbkkabaefh8Kabcefhoalcd4gecbaDEhkadcefhOarc;abfceVhHcbhmdndninaiam9nmearc;qofcbcjdz:wjjjb8Aa8Kao9Rak6mdadamal2gwfhxcbh8JaOawfhzaocbakz:wjjjbghakfh5aqaiam9Ramaqfai6Egscsfgocl4cifcd4hCaoc9WGg8LThPindndndndndndndndndndnaDTmbara8Jcd4fRbbgLciGPlbedlbkasTmdaxa8Jfhoarc;abfa8JfRbbhLarc;qofhwashXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLaXcufgXmbxikkasTmia8JcitcwGhEarc;abfa8JceVfRbbcwtarc;abfa8Jc9:GgofRbbVhLaxaofhoarc;qofhwashXinawao8Vbbg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbawcefhwaoalfhoa8AhLaXcufgXmbxdkkaHa8Jc98GgEfhoazaEfh8Aarc;abfaEfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkasTmbaLcl4hYa8JcitcKGh3axaEfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aY93a3486bba8Aalfh8AaEalfhEaLhXaKcefgKas9hmbkkaDmbcbhoxlka8LTmbcbhodninarc;qofaofgwcwf8Pibaw8Pib:e9qTmeaoczfgoa8L9pmdxbkkdnavmbcehoxikcbhEaChKaChYinarc;qofaEfgocwf8Pibhyao8Pibh8PcdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egoa8Aaoa8A6Egoczaocz6EaYfhYaocucbaya8P:e9cb9sEgwaoaw6EaKfhKaEczfgEa8L9pmdxbkkaha8Jcd4fgoaoRbbcda8JcetcoGtV86bbxikdnaKas6mbaYas6mbaha8Jcd4fgoaoRbbcia8JcetcoGtV86bba8Ka59Ras6mra5arc;qofasz:vjjjbasfh5xikaKaY9phokaha8Jcd4fgwawRbbaoa8JcetcoGtV86bbka8Ka59RaC6mla5cbaCz:wjjjbgAaCfhYdndna8LmbaPhoxekdna8KaY9RcK9pmbaPhoxekaocdtc:q1jjbfcj1jjbaDEg5ydxggcetc;:FFFeGh8Fcuh3cuagtcu7cFeGhacbh8Marc;qofhLinarc;qofa8MfhQczhEdndndnagPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhExekcbhoa8FhEinaEaaaLaofRbb9nfhEaocefgocz9hmbkkcih8Ecbh8Ainczhwdndndna5a8AcdtfydbgKPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhwxekaKcetc;:FFFeGhwcuaKtcu7cFeGhXcbhoinawaXaLaofRbb9nfhwaocefgocz9hmbkkdndnawaE6mbaKa39hmeawaE9hmea5a8EcdtfydbcwSmeka8Ah8EawhEka8Acefg8Aci9hmbkaAa8Mco4fgoaoRbba8Ea8Mci4coGtV86bbdndndna5a8Ecdtfydbg3PDdbbbbbbbebkdncwa39Tg8ETmbcua3tcu7hwdndna3ceSmbcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXa3tVhXaocefhoa8Acufg8AmbkaYaX86bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbxdkkcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXcetVhXaocefhoa8Acufg8AmbkaYaX:T9cFe:d9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:9ca188bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbkkcbhoinaYaLaofRbbgX86bbaYaXawcFeG9pfhYaocefgocz9hmbxikkdna3ceSmbinaYcb86bbaYcefhYxbkkinaYcb86bbaYcefhYxbkkaYaQ8Pbb83bbaYcwfaQcwf8Pbb83bbaYczfhYka8Mczfg8Ma8L9pgomeaLczfhLa8KaY9RcK9pmbkkaoTmlaYh5aYTmlka8Jcefg8Jal9hmbkarc;abfaxascufal2falz:vjjjb8Aasamfhma5hoa5mbkcbhwxdkdna8Kao9RakalfgwcKcaaDEgLawaL0EgX9pmbcbhwxdkdnawaL9pmbaocbaXaw9Rgwz:wjjjbawfhokaoarc;adfalz:vjjjbalfhodnaDTmbaoaraez:vjjjbaefhokaoab9Rhwxekcbhwkarc;qwf8Kjjjjbawk5babaeadaialcdcbyd;C:kjjbz:bjjjbk9reduaecd4gdaefgicaaica0Eabcj;abae9Uc;WFbGcjdaeca0Egifcufai9Uae2aiadfaicl4cifcd4f2fcefkmbcbabBd;C:kjjbk:Ese5u8Jjjjjbc;ae9Rgl8Kjjjjbcbhvdnaici9UgocHfae0mbabcbyd;m:kjjbgrc;GeV86bbalc;abfcFecjez:wjjjb8AalcUfgw9cu83ibalc8WfgD9cu83ibalcyfgq9cu83ibalcafgk9cu83ibalcKfgx9cu83ibalczfgm9cu83ibal9cu83iwal9cu83ibabaefc9WfhPabcefgsaofhednaiTmbcmcsarcb9kgzEhHcbhOcbhAcbhCcbhXcbhQindnaeaP9nmbcbhvxikaQcufhvadaCcdtfgLydbhKaLcwfydbhYaLclfydbh8AcbhEdndndninalc;abfavcsGcitfgoydlh3dndndnaoydbgoaK9hmba3a8ASmekdnaoa8A9hmba3aY9hmbaEcefhExekaoaY9hmea3aK9hmeaEcdfhEkaEc870mdaXcufhvaLaEciGcx2goc;i1jjbfydbcdtfydbh3aLaoc;e1jjbfydbcdtfydbh8AaLaoc;a1jjbfydbcdtfydbhKcbhodnindnalavcsGcdtfydba39hmbaohYxdkcuhYavcufhvaocefgocz9hmbkkaOa3aOSgvaYce9iaYaH9oVgoGfhOdndndncbcsavEaYaoEgvcs9hmbarce9imba3a3aAa3cefaASgvEgAcefSmecmcsavEhvkasavaEcdtc;WeGV86bbavcs9hmea3aA9Rgvcetavc8F917hvinaeavcFb0crtavcFbGV86bbaecefheavcje6hoavcr4hvaoTmbka3hAxvkcPhvasaEcdtcPV86bba3hAkavTmiavaH9omicdhocehEaQhYxlkavcufhvaEclfgEc;ab9hmbkkdnaLceaYaOSceta8AaOSEcx2gvc;a1jjbfydbcdtfydbgKTaLavc;e1jjbfydbcdtfydbg8AceSGaLavc;i1jjbfydbcdtfydbg3cdSGaOcb9hGazGg5ce9hmbaw9cu83ibaD9cu83ibaq9cu83ibak9cu83ibax9cu83ibam9cu83ibal9cu83iwal9cu83ibcbhOkcbhEaXcufgvhodnindnalaocsGcdtfydba8A9hmbaEhYxdkcuhYaocufhoaEcefgEcz9hmbkkcbhodnindnalavcsGcdtfydba39hmbaohExdkcuhEavcufhvaocefgocz9hmbkkaOaKaOSg8EfhLdndnaYcm0mbaYcefhYxekcbcsa8AaLSgvEhYaLavfhLkdndnaEcm0mbaEcefhExekcbcsa3aLSgvEhEaLavfhLkc9:cua8EEh8FcbhvaEaYcltVgacFeGhodndndninavc:W1jjbfRbbaoSmeavcefgvcz9hmbxdkka5aKaO9havcm0VVmbasavc;WeV86bbxekasa8F86bbaeaa86bbaecefhekdna8EmbaKaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombkaKhAkdnaYcs9hmba8AaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka8AhAkdnaEcs9hmba3aA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka3hAkalaXcdtfaKBdbaXcefcsGhvdndnaYPzbeeeeeeeeeeeeeebekalavcdtfa8ABdbaXcdfcsGhvkdndnaEPzbeeeeeeeeeeeeeebekalavcdtfa3BdbavcefcsGhvkcihoalc;abfaQcitfgEaKBdlaEa8ABdbaQcefcsGhYcdhEavhXaLhOxekcdhoalaXcdtfa3BdbcehEaXcefcsGhXaQhYkalc;abfaYcitfgva8ABdlava3Bdbalc;abfaQaEfcsGcitfgva3BdlavaKBdbascefhsaQaofcsGhQaCcifgCai6mbkkdnaeaP9nmbcbhvxekcbhvinaeavfavc:W1jjbfRbb86bbavcefgvcz9hmbkaeab9Ravfhvkalc;aef8KjjjjbavkZeeucbhddninadcefgdc8F0meceadtae6mbkkadcrfcFeGcr9Uci2cdfabci9U2cHfkmbcbabBd;m:kjjbk:Adewu8Jjjjjbcz9Rhlcbhvdnaicvfae0mbcbhvabcbRb;m:kjjbc;qeV86bbal9cb83iwabcefhoabaefc98fhrdnaiTmbcbhwcbhDindnaoar6mbcbskadaDcdtfydbgqalcwfawaqav9Rgvavc8F91gv7av9Rc507gwcdtfgkydb9Rgvc8E91c9:Gavcdt7awVhvinaoavcFb0gecrtavcFbGV86bbavcr4hvaocefhoaembkakaqBdbaqhvaDcefgDai9hmbkkdnaoar9nmbcbskaocbBbbaoab9RclfhvkavkBeeucbhddninadcefgdc8F0meceadtae6mbkkadcwfcFeGcr9Uab2cvfk:bvli99dui99ludnaeTmbcuadcetcuftcu7:Zhvdndncuaicuftcu7:ZgoJbbbZMgr:lJbbb9p9DTmbar:Ohwxekcjjjj94hwkcbhicbhDinalclfIdbgrJbbbbJbbjZalIdbgq:lar:lMalcwfIdbgk:lMgr:varJbbbb9BEgrNhxaqarNhrdndnakJbbbb9GTmbaxhqxekJbbjZar:l:tgqaq:maxJbbbb9GEhqJbbjZax:l:tgxax:marJbbbb9GEhrkdndnalcxfIdbgxJbbj:;axJbbj:;9GEgkJbbjZakJbbjZ9FEavNJbbbZJbbb:;axJbbbb9GEMgx:lJbbb9p9DTmbax:Ohmxekcjjjj94hmkdndnaqJbbj:;aqJbbj:;9GEgxJbbjZaxJbbjZ9FEaoNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:OhPxekcjjjj94hPkdndnarJbbj:;arJbbj:;9GEgqJbbjZaqJbbjZ9FEaoNJbbbZJbbb:;arJbbbb9GEMgr:lJbbb9p9DTmbar:Ohsxekcjjjj94hskdndnadcl9hmbabaifgzas86bbazcifam86bbazcdfaw86bbazcefaP86bbxekabaDfgzas87ebazcofam87ebazclfaw87ebazcdfaP87ebkalczfhlaiclfhiaDcwfhDaecufgembkkk;hlld99eud99eudnaeTmbdndncuaicuftcu7:ZgvJbbbZMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikaic;8FiGhrinabcofcicdalclfIdb:lalIdb:l9EgialcwfIdb:lalaicdtfIdb:l9EEgialcxfIdb:lalaicdtfIdb:l9EEgiarV87ebdndnJbbj:;JbbjZalaicdtfIdbJbbbb9DEgoalaicd7cdtfIdbJ;Zl:1ZNNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabcdfaq87ebdndnalaicefciGcdtfIdbJ;Zl:1ZNaoNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabaq87ebdndnaoalaicufciGcdtfIdbJ;Zl:1ZNNgoJbbj:;aoJbbj:;9GEgwJbbjZawJbbjZ9FEavNJbbbZJbbb:;aoJbbbb9GEMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikabclfai87ebabcwfhbalczfhlaecufgembkkk;3viDue99eu8Jjjjjbcjd9Rgo8Kjjjjbadcd4hrdndndndnavcd9hmbadcl6meaohwarhDinawc:CuBdbawclfhwaDcufgDmbkaeTmiadcl6mdarcdthqalhkcbhxinaohwakhDarhminawawydbgPcbaDIdbgs:8cL4cFeGc:cufasJbbbb9BEgzaPaz9kEBdbaDclfhDawclfhwamcufgmmbkakaqfhkaxcefgxaeSmixbkkaeTmdxekaeTmekarcdthkavce9hhqadcl6hdcbhxindndndnaqmbadmdc:CuhDalhwarhminaDcbawIdbgs:8cL4cFeGc:cufasJbbbb9BEgPaDaP9kEhDawclfhwamcufgmmbxdkkc:CuhDdndnavPleddbdkadmdaohwalhmarhPinawcbamIdbgs:8cL4cFeGgzc;:bazc;:b0Ec:cufasJbbbb9BEBdbamclfhmawclfhwaPcufgPmbxdkkadmecbhwarhminaoawfcbalawfIdbgs:8cL4cFeGgPc8AaPc8A0Ec:cufasJbbbb9BEBdbawclfhwamcufgmmbkkadmbcbhwarhPinaDhmdnavceSmbaoawfydbhmkdndnalawfIdbgscjjj;8iamai9RcefgmcLt9R::NJbbbZJbbb:;asJbbbb9GEMgs:lJbbb9p9DTmbas:Ohzxekcjjjj94hzkabawfazcFFFrGamcKtVBdbawclfhwaPcufgPmbkkabakfhbalakfhlaxcefgxae9hmbkkaocjdf8Kjjjjbk;YqdXui998Jjjjjbc:qd9Rgv8Kjjjjbavc:Sefcbc;Kbz:wjjjb8AcbhodnadTmbcbhoaiTmbdndnabaeSmbaehrxekavcuadcdtgwadcFFFFi0Ecbyd;u:kjjbHjjjjbbgrBd:SeavceBd:mdaraeawz:vjjjb8Akavc:GefcwfcbBdbav9cb83i:Geavc:Gefaradaiavc:Sefz:ojjjbavyd:GehDadci9Ugqcbyd;u:kjjbHjjjjbbheavc:Sefavyd:mdgkcdtfaeBdbavakcefgwBd:mdaecbaqz:wjjjbhxavc:SefawcdtfcuaicdtaicFFFFi0Ecbyd;u:kjjbHjjjjbbgmBdbavakcdfgPBd:mdalc;ebfhsaDheamhwinawalIdbasaeydbgzcwazcw6EcdtfIdbMUdbaeclfheawclfhwaicufgimbkavc:SefaPcdtfcuaqcdtadcFFFF970Ecbyd;u:kjjbHjjjjbbgPBdbdnadci6mbarheaPhwaqhiinawamaeydbcdtfIdbamaeclfydbcdtfIdbMamaecwfydbcdtfIdbMUdbaecxfheawclfhwaicufgimbkkakcifhoalc;ebfhHavc;qbfhOavheavyd:KehAavyd:OehCcbhzcbhwcbhXcehQinaehLcihkarawci2gKcdtfgeydbhsaeclfydbhdabaXcx2fgicwfaecwfydbgYBdbaiclfadBdbaiasBdbaxawfce86bbaOaYBdwaOadBdlaOasBdbaPawcdtfcbBdbdnazTmbcihkaLhiinaOakcdtfaiydbgeBdbakaeaY9haeas9haead9hGGfhkaiclfhiazcufgzmbkkaXcefhXcbhzinaCaAarazaKfcdtfydbcdtgifydbcdtfgYheaDaifgdydbgshidnasTmbdninaeydbawSmeaeclfheaicufgiTmdxbkkaeaYascdtfc98fydbBdbadadydbcufBdbkazcefgzci9hmbkdndnakTmbcuhwJbbbbh8Acbhdavyd:KehYavyd:OehKindndnaDaOadcdtfydbcdtgzfydbgembadcefhdxekadcs0hiamazfgsIdbhEasalcbadcefgdaiEcdtfIdbaHaecwaecw6EcdtfIdbMg3Udba3aE:th3aecdthiaKaYazfydbcdtfheinaPaeydbgzcdtfgsa3asIdbMgEUdbaEa8Aa8AaE9DgsEh8AazawasEhwaeclfheaic98fgimbkkadak9hmbkawcu9hmekaQaq9pmdindnaxaQfRbbmbaQhwxdkaqaQcefgQ9hmbxikkakczakcz6EhzaOheaLhOawcu9hmbkkaocdtavc:Seffc98fhedninaoTmeaeydbcbyd;q:kjjbH:bjjjbbaec98fheaocufhoxbkkavc:qdf8Kjjjjbk;IlevucuaicdtgvaicFFFFi0Egocbyd;u:kjjbHjjjjbbhralalyd9GgwcdtfarBdbalawcefBd9GabarBdbaocbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdlcuadcdtadcFFFFi0Ecbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdwabydbcbavz:wjjjb8Aadci9UhDdnadTmbabydbhoaehladhrinaoalydbcdtfgvavydbcefBdbalclfhlarcufgrmbkkdnaiTmbabydbhlabydlhrcbhvaihoinaravBdbarclfhralydbavfhvalclfhlaocufgombkkdnadci6mbabydlhrabydwhvcbhlinaecwfydbhoaeclfydbhdaraeydbcdtfgwawydbgwcefBdbavawcdtfalBdbaradcdtfgdadydbgdcefBdbavadcdtfalBdbaraocdtfgoaoydbgocefBdbavaocdtfalBdbaecxfheaDalcefgl9hmbkkdnaiTmbabydlheabydbhlinaeaeydbalydb9RBdbalclfhlaeclfheaicufgimbkkkQbabaeadaic;K1jjbz:njjjbkQbabaeadaic;m:jjjbz:njjjbk9DeeuabcFeaicdtz:wjjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk:Vvioud9:du8Jjjjjbc;Wa9Rgl8Kjjjjbcbhvalcxfcbc;Kbz:wjjjb8AalcuadcitgoadcFFFFe0Ecbyd;u:kjjbHjjjjbbgrBdxalceBd2araeadaicez:tjjjbalcuaoadcjjjjoGEcbyd;u:kjjbHjjjjbbgwBdzadcdthednadTmbabhiinaiavBdbaiclfhiadavcefgv9hmbkkawaefhDalabBdwalawBdl9cbhqindnadTmbaq9cq9:hkarhvaDhiadheinaiav8Pibak1:NcFrG87ebavcwfhvaicdfhiaecufgembkkalclfaq:NceGcdtfydbhxalclfaq9ce98gq:NceGcdtfydbhmalc;Wbfcbcjaz:wjjjb8AaDhvadhidnadTmbinalc;Wbfav8VebcdtfgeaeydbcefBdbavcdfhvaicufgimbkkcbhvcbhiinalc;WbfavfgeydbhoaeaiBdbaoaifhiavclfgvcja9hmbkadhvdndnadTmbinalc;WbfaDamydbgicetf8VebcdtfgeaeydbgecefBdbaxaecdtfaiBdbamclfhmavcufgvmbkaq9cv9smdcbhvinabawydbcdtfavBdbawclfhwadavcefgv9hmbxdkkaq9cv9smekkclhvdninavc98Smealcxfavfydbcbyd;q:kjjbH:bjjjbbavc98fhvxbkkalc;Waf8Kjjjjbk:Jwliuo99iud9:cbhv8Jjjjjbca9Rgoczfcwfcbyd:8:kjjbBdbaocb8Pd:0:kjjb83izaocwfcbyd;i:kjjbBdbaocb8Pd;a:kjjb83ibaicd4hrdndnadmbJFFuFhwJFFuuhDJFFuuhqJFFuFhkJFFuuhxJFFuFhmxekarcdthPaehsincbhiinaoczfaifgzasaifIdbgwazIdbgDaDaw9EEUdbaoaifgzawazIdbgDaDaw9DEUdbaiclfgicx9hmbkasaPfhsavcefgvad9hmbkaoIdKhDaoIdwhwaoIdChqaoIdlhkaoIdzhxaoIdbhmkdnadTmbJbbbbJbFu9hJbbbbamax:tgmamJbbbb9DEgmakaq:tgkakam9DEgkawaD:tgwawak9DEgw:vawJbbbb9BEhwdnalmbarcdthoindndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:S9cC:ghHdndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikaHai:S:ehHdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaHai:T9cy:g:e83ibaeaofheabcwfhbadcufgdmbxdkkarcdthoindndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cv9:9c;j:KM;j:KM;j:Kd:dhOdndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cq9:9cM;j:KM;j:KM;jl:daO:ehOdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaOai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cC9:9c:KM;j:KM;j:KMD:d:e83ibaeaofheabcwfhbadcufgdmbkkk9teiucbcbyd;y:kjjbgeabcifc98GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;y:kjjbgeabcrfc94GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;y:kjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;y:kjjbfgdBd;y:kjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk;Qddbcjwk;mdbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbbbbbbbbbbbbb4:h9w9N94:P:gW:j9O:ye9Pbbbbbbebbbdbbbebbbdbbbbbbbdbbbbbbbebbbbbbb:l29hZ;69:9kZ;N;76Z;rg97Z;z;o9xZ8J;B85Z;:;u9yZ;b;k9HZ:2;Z9DZ9e:l9mZ59A8KZ:r;T3Z:A:zYZ79OHZ;j4::8::Y:D9V8:bbbb9s:49:Z8R:hBZ9M9M;M8:L;z;o8:;8:PG89q;x:J878R:hQ8::M:B;e87bbbbbbjZbbjZbbjZ:E;V;N8::Y:DsZ9i;H;68:xd;R8:;h0838:;W:NoZbbbb:WV9O8:uf888:9i;H;68:9c9G;L89;n;m9m89;D8Ko8:bbbbf:8tZ9m836ZS:2AZL;zPZZ818EZ9e:lxZ;U98F8:819E;68:FFuuFFuuFFuuFFuFFFuFFFuFbc;mqkzebbbebbbdbbb9G:vbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(p){a=p.instance,a.exports.__wasm_call_ctors(),a.exports.meshopt_encodeVertexVersion(0),a.exports.meshopt_encodeIndexVersion(1)});function r(p){for(var f=new Uint8Array(p.length),l=0;l<p.length;++l){var y=p.charCodeAt(l);f[l]=y>96?y-97:y>64?y-39:y+4}for(var b=0,l=0;l<p.length;++l)f[b++]=f[l]<60?e[f[l]]:(f[l]-60)*64+f[++l];return f.buffer.slice(0,b)}function n(p){if(!p)throw new Error("Assertion failed")}function i(p){return new Uint8Array(p.buffer,p.byteOffset,p.byteLength)}function o(p,f,l,y){var b=a.exports.sbrk,g=b(f.length*4),x=b(l*4),v=new Uint8Array(a.exports.memory.buffer),T=i(f);v.set(T,g),y&&y(g,g,f.length,l);var I=p(x,g,f.length,l);v=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(l);new Uint8Array(S.buffer).set(v.subarray(x,x+l*4)),T.set(v.subarray(g,g+f.length*4)),b(g-b(0));for(var R=0;R<f.length;++R)f[R]=S[f[R]];return[S,I]}function c(p,f,l,y){var b=a.exports.sbrk,g=b(l*4),x=b(l*y),v=new Uint8Array(a.exports.memory.buffer);v.set(i(f),x),p(g,x,l,y),v=new Uint8Array(a.exports.memory.buffer);var T=new Uint32Array(l);return new Uint8Array(T.buffer).set(v.subarray(g,g+l*4)),b(g-b(0)),T}function d(p,f,l,y,b){var g=a.exports.sbrk,x=g(f),v=g(y*b),T=new Uint8Array(a.exports.memory.buffer);T.set(i(l),v);var I=p(x,f,v,y,b),S=new Uint8Array(I);return S.set(T.subarray(x,x+I)),g(x-g(0)),S}function h(p){for(var f=0,l=0;l<p.length;++l){var y=p[l];f=f<y?y:f}return f}function u(p,f){if(n(f==2||f==4),f==4)return new Uint32Array(p.buffer,p.byteOffset,p.byteLength/4);var l=new Uint16Array(p.buffer,p.byteOffset,p.byteLength/2);return new Uint32Array(l)}function m(p,f,l,y,b,g,x){var v=a.exports.sbrk,T=v(l*y),I=v(l*g),S=new Uint8Array(a.exports.memory.buffer);S.set(i(f),I),p(T,l,y,b,I,x);var R=new Uint8Array(l*y);return R.set(S.subarray(T,T+l*y)),v(T-v(0)),R}return{ready:s,supported:!0,reorderMesh:function(p,f,l){var y=f?l?a.exports.meshopt_optimizeVertexCacheStrip:a.exports.meshopt_optimizeVertexCache:void 0;return o(a.exports.meshopt_optimizeVertexFetchRemap,p,h(p)+1,y)},reorderPoints:function(p,f){return n(p instanceof Float32Array),n(p.length%f==0),n(f>=3),c(a.exports.meshopt_spatialSortRemap,p,p.length/f,f*4)},encodeVertexBuffer:function(p,f,l){n(l>0&&l<=256),n(l%4==0);var y=a.exports.meshopt_encodeVertexBufferBound(f,l);return d(a.exports.meshopt_encodeVertexBuffer,y,p,f,l)},encodeIndexBuffer:function(p,f,l){n(l==2||l==4),n(f%3==0);var y=u(p,l),b=a.exports.meshopt_encodeIndexBufferBound(f,h(y)+1);return d(a.exports.meshopt_encodeIndexBuffer,b,y,f,4)},encodeIndexSequence:function(p,f,l){n(l==2||l==4);var y=u(p,l),b=a.exports.meshopt_encodeIndexSequenceBound(f,h(y)+1);return d(a.exports.meshopt_encodeIndexSequence,b,y,f,4)},encodeGltfBuffer:function(p,f,l,y){var b={ATTRIBUTES:this.encodeVertexBuffer,TRIANGLES:this.encodeIndexBuffer,INDICES:this.encodeIndexSequence};return n(b[y]),b[y](p,f,l)},encodeFilterOct:function(p,f,l,y){return n(l==4||l==8),n(y>=1&&y<=16),m(a.exports.meshopt_encodeFilterOct,p,f,l,y,16)},encodeFilterQuat:function(p,f,l,y){return n(l==8),n(y>=4&&y<=16),m(a.exports.meshopt_encodeFilterQuat,p,f,l,y,16)},encodeFilterExp:function(p,f,l,y,b){n(l>0&&l%4==0),n(y>=1&&y<=24);var g={Separate:0,SharedVector:1,SharedComponent:2,Clamped:3};return m(a.exports.meshopt_encodeFilterExp,p,f,l,y,l,b?g[b]:1)}}})();var Qr=(function(){var t="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:W:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:S86qdbk;jYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz1jjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbhodnawTmbaxa8Acd4fRbbhokaocFeGh5cbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz1jjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:jjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q1jjbfcj1jjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bbarcwf9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfag9c8F1:NghcKtc8F91aicdfa8J9c8N1:Nfg8KRbbG86bbarcVfcba8KahcjeGcr4fghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fag9c8F1:NgicKtc8F91aha8J9c8N1:NfghRbbG86bbarc96fcbahaicjeGcr4fgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbb83bbarcwfaicwf8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbcbaocl49Rh8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E93aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z1jjjb8AazazcjdfaAcufad2fadz1jjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:XseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbyd:K1jjbgeabcifc98GfgbBd:K1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk81dbcjwk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:Kwkl8WNbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;G9Mqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:183lYud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxavaialfgmar9Rgoad;8qbbcj;abad9Uc;WFbGcjdadca0EhPdndndnadTmbaoadfhscbhzinaeaz9nmdamax9RaD6miabazad2fhHaxaDfhOaPaeaz9RazaPfae6EgAcsfgocl4cifcd4hCavcj;cbfaoc9WGgXcetfhQavcj;cbfaXci2fhLavcj;cbfaXfhKcbhYaoc;ab6h8AincbhodnawTmbaxaYcd4fRbbhokaocFeGhEcbh3avcj;cbfh5indndndndnaEa3cet4ciGgoc9:fPdebdkamaO9RaX6mwavcj;cbfa3aX2faOaX;8qbbaOaAfhOxdkavcj;cbfa3aX2fcbaX;8kbxekamaO9RaC6moaoclVcbawEhraOaCfhocbhidna8Ambamao9Rc;Gb6mbcbhlina5alfhidndndndndndnaOalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiczfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaicafaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaoclffaqc:q:yjjbfRbbfhoxikaic8Wfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaocwffaqc:q:yjjbfRbbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitc:q1jjbfpbibaic:q:yjjbfRbbgipsaoRbegqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqc:q:yjjbfRbbfhokalc;abfhialcjefaX0meaihlamao9Rc;Fb0mbkkdnaiaX9pmbaici4hlinamao9RcK6mwa5aifhqdndndndndndnaOaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaoclffahc:q:yjjbfRbbfhoxikaqaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaocwffahc:q:yjjbfRbbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpkbbaaaocdffahc:q:yjjbfRbbfhokalcdfhlaiczfgiaX6mbkkaohOaoTmoka5aXfh5a3cefg3cl9hmbkdndndndnawTmbasaYcd4fRbbglciGPlbedwbkaXTmdavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep9Ta8Epxeeeeeeeeeeeeeeeeg8Fp9op9Hp9rg8Eagp9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Ug8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9AbbbaladfhlaoczfgoaX6mbxikkaXTmeavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep:nea8Epxebebebebebebebebg8Fp9op:bep9rg8Eagp:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeg8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9AbbbaladfhlaoczfgoaX6mbxdkkaXTmbcbhocbalcl4gl9Rc8FGhiavcjdfaYfhravaYfpbdbh8Finaravcj;cbfaofpblbggaKaofpblbg8JpmbzeHdOiAlCvXoQrLg8KaQaofpblbg8LaLaofpblbg8MpmbzeHdOiAlCvXoQrLg8NpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ea8Fp9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Fa8Ka8NpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwKDYq8AkEx3m5P8Es8Fgga8La8MpmwKDYq8AkEx3m5P8Es8Fg8JpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9AbbbaradfhraoczfgoaX6mbkkaYclfgYad6mbkaHavcjdfaAad2;8qbbavavcjdfaAcufad2fad;8qbbaAazfhzc9:hoaOhxaOmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdaPaeao9RaoaPfae6Eaofgoae6mbkaial9Rhxkcbc99amax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbk:TseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:SPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiczfpxbbbbbbbbbbbbbbbbgopklbaiaopklbaiabalcitfgdaeciGglcitgv;8qbbdnalTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkadaiav;8qbbkk:oDllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiczfpxbbbbbbbbbbbbbbbbgkpklbaiakpklbaiabalcitfgoaeciGgvcitgw;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkaoaiaw;8qbbkk;uddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaic8WfpxbbbbbbbbbbbbbbbbgopklbaicafaopklbaiczfaopklbaiaopklbaiabavcdtfgdalciGgecdtgv;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkadaiav;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb",a=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),s=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var r=WebAssembly.validate(a)?o(e):o(t),n,i=WebAssembly.instantiate(r,{}).then(function(b){n=b.instance,n.exports.__wasm_call_ctors()});function o(b){for(var g=new Uint8Array(b.length),x=0;x<b.length;++x){var v=b.charCodeAt(x);g[x]=v>96?v-97:v>64?v-39:v+4}for(var T=0,x=0;x<b.length;++x)g[T++]=g[x]<60?s[g[x]]:(g[x]-60)*64+g[++x];return g.buffer.slice(0,T)}function c(b,g,x,v,T,I,S){var R=b.exports.sbrk,_=v+3&-4,A=R(_*T),j=R(I.length),L=new Uint8Array(b.exports.memory.buffer);L.set(I,j);var F=g(A,v,T,j,I.length);if(F==0&&S&&S(A,_,T),x.set(L.subarray(A,A+v*T)),R(A-R(0)),F!=0)throw new Error("Malformed buffer data: "+F)}var d={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},h={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},u=[],m=0;function p(b){var g={object:new Worker(b),pending:0,requests:{}};return g.object.onmessage=function(x){var v=x.data;g.pending-=v.count,g.requests[v.id][v.action](v.value),delete g.requests[v.id]},g}function f(b){for(var g="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(r)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+y.name+";"+c.toString()+y.toString(),x=new Blob([g],{type:"text/javascript"}),v=URL.createObjectURL(x),T=u.length;T<b;++T)u[T]=p(v);for(var T=b;T<u.length;++T)u[T].object.postMessage({});u.length=b,URL.revokeObjectURL(v)}function l(b,g,x,v,T){for(var I=u[0],S=1;S<u.length;++S)u[S].pending<I.pending&&(I=u[S]);return new Promise(function(R,_){var A=new Uint8Array(x),j=++m;I.pending+=b,I.requests[j]={resolve:R,reject:_},I.object.postMessage({id:j,count:b,size:g,source:A,mode:v,filter:T},[A.buffer])})}function y(b){var g=b.data;if(!g.id)return self.close();self.ready.then(function(x){try{var v=new Uint8Array(g.count*g.size);c(x,x.exports[g.mode],v,g.count,g.size,g.source,x.exports[g.filter]),self.postMessage({id:g.id,count:g.count,action:"resolve",value:v},[v.buffer])}catch(T){self.postMessage({id:g.id,count:g.count,action:"reject",value:T})}})}return{ready:i,supported:!0,useWorkers:function(b){f(b)},decodeVertexBuffer:function(b,g,x,v,T){c(n,n.exports.meshopt_decodeVertexBuffer,b,g,x,v,n.exports[d[T]])},decodeIndexBuffer:function(b,g,x,v){c(n,n.exports.meshopt_decodeIndexBuffer,b,g,x,v)},decodeIndexSequence:function(b,g,x,v){c(n,n.exports.meshopt_decodeIndexSequence,b,g,x,v)},decodeGltfBuffer:function(b,g,x,v,T,I){c(n,n.exports[h[T]],b,g,x,v,n.exports[d[I]])},decodeGltfBufferAsync:function(b,g,x,v,T){return u.length>0?l(b,g,x,h[v],d[T]):i.then(function(){var I=new Uint8Array(b*g);return c(n,n.exports[h[v]],I,b,g,x,n.exports[d[T]]),I})}}})();var aw=(function(){var t="b9H79Tebbbetm9Geueu9Geub9Gbb9Gsuuuuuuuuuuuu99uueu9Gvuuuuub9Gruuuuuuub9Gvuuuuue999Gvuuuuueu9Gquuuuuuu99uueu9Gwuuuuuu99ueu9Giuuue999Gluuuueu9GiuuueuiOHdilvorlwiDqkbxxbelve9Weiiviebeoweuec:G:Pdkr:Tewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bbz9TW79O9V9Wt9F79P9T9W29P9M95br8E9TW79O9V9Wt9F79P9T9W29P9M959x9Pt9OcttV9P9I91tW7bwQ9TW79O9V9Wt9F79P9T9W29P9M959q9V9P9Ut7bDX9TW79O9V9Wt9F79P9T9W29P9M959t9J9H2Wbqa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9Wbkl79IV9RbxDwebcekdzsq;B:xeHdbkM9Hi8Au8A99Au8Jjjjjbc;W;qb9Rgs8Kjjjjbcbhzascxfcbc;Kbz:ojjjb8AdnabaeSmbabaeadcdtz:njjjb8AkdndnamcdGmbascxfhHcbhOxekasalcrfci4gecbyd:m:jjjbHjjjjbbgABdxasceBd2aAcbaez:ojjjbhCcbhlcbhednadTmbcbhlabheadhAinaCaeydbgXci4fgQaQRbbgQceaXcrGgXtV86bbaQcu7aX4ceGalfhlaeclfheaAcufgAmbkcualcdtalcFFFFi0EhekascCfhHasaecbyd:m:jjjbHjjjjbbgOBdzascdBd2alcd4alfhXcehAinaAgecethAaeaX6mbkcdhzcbhLascuaecdtgAaecFFFFi0Ecbyd:m:jjjbHjjjjbbgXBdCasciBd2aXcFeaAz:ojjjbhKdnadTmbaecufhYcbh8AindndnaKabaLcdtfgEydbgQc:v;t;h;Ev2aYGgXcdtfgCydbgAcuSmbceheinaOaAcdtfydbaQSmdaXaefhAaecefheaKaAaYGgXcdtfgCydbgAcu9hmbkkaOa8AcdtfaQBdbaCa8ABdba8AhAa8Acefh8AkaEaABdbaLcefgLad9hmbkkaKcbyd1:jjjbH:bjjjbbascdBd2kcbh3aHcualcefgecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbg5Bdbasa5BdlasazceVgeBd2ascxfaecdtfcuadcitadcFFFFe0Ecbyd:m:jjjbHjjjjbbg8EBdbasa8EBdwasazcdfgeBd2asclfabadalcbz:cjjjbascxfaecdtfcualcdtgealcFFFFi0Eg8Fcbyd:m:jjjbHjjjjbbgABdbasazcifgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgaBdbasazclVBd2aAaaaialavaOascxfz:djjjbalcbyd:m:jjjbHjjjjbbhCascxfasyd2ghcdtfaCBdbasahcefgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgXBdbasahcdfgQBd2ascxfaQcdtfa8Fcbyd:m:jjjbHjjjjbbgQBdbasahcifggBd2aXcFeaez:ojjjbh8JaQcFeaez:ojjjbh8KdnalTmba8Ecwfh8Lindna5a3gQcefg3cdtfydbgKa5aQcdtgefydbgXSmbaKaX9Rhza8EaXcitfhHa8Kaefh8Ma8JaefhEcbhYindndnaHaYcitfydbg8AaQ9hmbaEaQBdba8MaQBdbxekdna5a8Acdtg8NfgeclfydbgXaeydbgeSmba8EaecitgKfydbaQSmeaXae9Rhyaecu7aXfhLa8LaKfhXcbheinaLaeSmeaecefheaXydbhKaXcwfhXaKaQ9hmbkaeay6meka8Ka8NfgeaQa8AaeydbcuSEBdbaEa8AaQaEydbcuSEBdbkaYcefgYaz9hmbkka3al9hmbkaAhXaahQa8KhKa8JhYcbheindndnaeaXydbg8A9hmbdnaeaQydbg8A9hmbaYydbh8AdnaKydbgLcu9hmba8Acu9hmbaCaefcb86bbxikaCaefhEdnaeaLSmbaea8ASmbaEce86bbxikaEcl86bbxdkdnaeaaa8AcdtgLfydb9hmbdnaKydbgEcuSmbaeaESmbaYydbgzcuSmbaeazSmba8KaLfydbgHcuSmbaHa8ASmba8JaLfydbgLcuSmbaLa8ASmbdnaAaEcdtfydbg8AaAaLcdtfydb9hmba8AaAazcdtfydbgLSmbaLaAaHcdtfydb9hmbaCaefcd86bbxlkaCaefcl86bbxikaCaefcl86bbxdkaCaefcl86bbxekaCaefaCa8AfRbb86bbkaXclfhXaQclfhQaKclfhKaYclfhYalaecefge9hmbkdnaqTmbdndnaOTmbaOheaAhXalhQindnaqaeydbfRbbTmbaCaXydbfcl86bbkaeclfheaXclfhXaQcufgQmbxdkkaAhealhXindnaqRbbTmbaCaeydbfcl86bbkaqcefhqaeclfheaXcufgXmbkkaAhealhQaChXindnaCaeydbfRbbcl9hmbaXcl86bbkaeclfheaXcefhXaQcufgQmbkkamceGTmbaChealhXindnaeRbbce9hmbaecl86bbkaecefheaXcufgXmbkkascxfagcdtfcualcx2alc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbg3BdbasahclfgHBd2a3aialavaOz:ejjjbh8PdndnaDmbcbhgcbh8Lxekcbh8LawhecbhXindnaeIdbJbbbb9ETmbasc;Wbfa8LcdtfaXBdba8Lcefh8LkaeclfheaDaXcefgX9hmbkascxfaHcdtfcua8Lal2gecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbggBdbasahcvfgHBd2alTmba8LTmbarcd4hEdnaOTmba8Lcdthzcbh8AaghLinaoaOa8AcdtfydbaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbxdkka8Lcdthzcbh8AaghLinaoa8AaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbkkascxfaHcdtfcualc8S2gealc;D;O;f8U0EgQcbyd:m:jjjbHjjjjbbgXBdbasaHcefgKBd2aXcbaez:ojjjbhqdndndna8LTmbascxfaKcdtfaQcbyd:m:jjjbHjjjjbbgvBdbasaHcdfgXBd2avcbaez:ojjjb8AascxfaXcdtfcua8Lal2gecltgXaecFFFFb0Ecbyd:m:jjjbHjjjjbbgiBdbasaHcifBd2aicbaXz:ojjjb8AadmexdkcbhvcbhiadTmekcbhYabhXindna3aXclfydbg8Acx2fgeIdba3aXydbgLcx2fgQIdbgI:tg8Ra3aXcwfydbgEcx2fgKIdlaQIdlg8S:tgRNaKIdbaI:tg8UaeIdla8S:tg8VN:tg8Wa8WNa8VaKIdwaQIdwg8X:tg8YNaRaeIdwa8X:tg8VN:tgRaRNa8Va8UNa8Ya8RN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaLcdtfydbc8S2fgeaRa8U:rg8UaRNNg8VaeIdbMUdbaea8Ra8Ua8RNg8ZNg8YaeIdlMUdlaea8Wa8Ua8WNg80Ng81aeIdwMUdwaea8ZaRNg8ZaeIdxMUdxaea80aRNgBaeIdzMUdzaea80a8RNg80aeIdCMUdCaeaRa8Ua8Wa8XNaRaINa8Sa8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAa8Acdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaEcdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaXcxfhXaYcifgYad6mbkcbhzabhLinabazcdtfh8AcbhXinaCa8AaXc;a1jjbfydbcdtfydbgQfRbbhedndnaCaLaXfydbgKfRbbgYc99fcFeGcpe0mbaec99fcFeGc;:e6mekdnaYcufcFeGce0mba8JaKcdtfydbaQ9hmekdnaecufcFeGce0mba8KaQcdtfydbaK9hmekdnaYcv2aefc:G1jjbfRbbTmbaAaQcdtfydbaAaKcdtfydb0mekJbbacJbbacJbbjZaecFeGceSEaYceSEh80dna3a8AaXc;e1jjbfydbcdtfydbcx2fgeIdwa3aKcx2fgYIdwg8S:tg8Wa3aQcx2fgEIdwa8S:tgRaRNaEIdbaYIdbg8X:tg8Ra8RNaEIdlaYIdlg8V:tg8Ua8UNMMgINa8WaRNaeIdba8X:tg81a8RNa8UaeIdla8V:tg8ZNMMg8YaRN:tg8Wa8WNa81aINa8Ya8RN:tgRaRNa8ZaINa8Ya8UN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaKcdtfydbc8S2fgeaRa80aI:rNg8UaRNNg8YaeIdbMUdbaea8Ra8Ua8RNg80Ng81aeIdlMUdlaea8Wa8Ua8WNgINg8ZaeIdwMUdwaea80aRNg80aeIdxMUdxaeaIaRNgBaeIdzMUdzaeaIa8RNg83aeIdCMUdCaeaRa8Ua8Wa8SNaRa8XNa8Va8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaQcdtfydbc8S2fgea8YaeIdbMUdbaea81aeIdlMUdlaea8ZaeIdwMUdwaea80aeIdxMUdxaeaBaeIdzMUdzaea83aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdykaXclfgXcx9hmbkaLcxfhLazcifgzad6mbka8LTmbcbhLinJbbbbh8Xa3abaLcdtfgeclfydbgEcx2fgXIdwa3aeydbgzcx2fgQIdwg8Z:tg8Ra8RNaXIdbaQIdbgB:tg8Wa8WNaXIdlaQIdlg83:tg8Ua8UNMMg80a3aecwfydbgHcx2fgeIdwa8Z:tgINa8Ra8RaINa8WaeIdbaB:tg8SNa8UaeIdla83:tg8VNMMgRN:tJbbbbJbbjZa80aIaINa8Sa8SNa8Va8VNMMg81NaRaRN:tg8Y:va8YJbbbb9BEg8YNhUa81a8RNaIaRN:ta8YNh85a80a8VNa8UaRN:ta8YNh86a81a8UNa8VaRN:ta8YNh87a80a8SNa8WaRN:ta8YNh88a81a8WNa8SaRN:ta8YNh89a8Wa8VNa8Sa8UN:tgRaRNa8UaINa8Va8RN:tgRaRNa8Ra8SNaIa8WN:tgRaRNMM:rJbbbZNhRagaza8L2gwcdtfhXagaHa8L2g8NcdtfhQagaEa8L2g5cdtfhKa8Z:mh8:a83:mhZaB:mhncbhYa8Lh8AJbbbbh8VJbbbbh8YJbbbbh80Jbbbbh81Jbbbbh8ZJbbbbhBJbbbbh83JbbbbhcJbbbbh9cinasc;WbfaYfgecwfaRa85aKIdbaXIdbgI:tg8UNaUaQIdbaI:tg8SNMg8RNUdbaeclfaRa87a8UNa86a8SNMg8WNUdbaeaRa89a8UNa88a8SNMg8UNUdbaecxfaRa8:a8RNaZa8WNaIana8UNMMMgINUdbaRa8Ra8WNNa81Mh81aRa8Ra8UNNa8ZMh8ZaRa8Wa8UNNaBMhBaRaIaINNa8XMh8XaRa8RaINNa8VMh8VaRa8WaINNa8YMh8YaRa8UaINNa80Mh80aRa8Ra8RNNa83Mh83aRa8Wa8WNNacMhcaRa8Ua8UNNa9cMh9caXclfhXaKclfhKaQclfhQaYczfhYa8Acufg8Ambkavazc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaEc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaHc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyaiawcltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia5cltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia8Ncltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaLcifgLad6mbkkcbhQdndnamcwGgJmbJbbbbh8Vcbh9ecbhocbhhxekcbh9ea8Fcbyd:m:jjjbHjjjjbbhhascxfasyd2gecdtfahBdbasaecefgXBd2ascxfaXcdtfcuahalabadaAz:fjjjbgKcltaKcjjjjiGEcbyd:m:jjjbHjjjjbbgoBdbasaecdfBd2aoaKaha3alz:gjjjbJFFuuh8VaKTmbaoheaKhXinaeIdbgRa8Va8VaR9EEh8VaeclfheaXcufgXmbkaKh9ekasydlhTdnalTmbaTclfheaTydbhKaChXalhYcbhQincbaeydbg8AaK9RaXRbbcpeGEaQfhQaXcefhXaeclfhea8AhKaYcufgYmbkaQce4hQkcuadaQ9RcifgScx2aSc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbhDascxfasyd2g9hcdtfaDBdbasa9hcefgeBd2ascxfaecdtfcuaScdtaScFFFFi0Ecbyd:m:jjjbHjjjjbbgrBdbasa9hcdfgeBd2ascxfaecdtfa8Fcbyd:m:jjjbHjjjjbbgyBdbasa9hcifgeBd2ascxfaecdtfalcbyd:m:jjjbHjjjjbbg9iBdbasa9hclfg6Bd2axaxNa8PJbbjZamclGEgUaUN:vh9cJbbbbhcdnadak9nmbdnaSci6mba8Lclth9kaDcwfh0Jbbbbh83JbbbbhcinasclfabadalaAz:cjjjbabhzcbh8Ecbh8Finaba8FcdtfhHcbheindnaAazaefydbgQcdtgEfydbgYaAaHaec;q1jjbfydbcdtfydbgXcdtgwfydbg8ASmbaCaXfRbbgLcv2aCaQfRbbgKfc;G1jjbfRbbg5aKcv2aLfg8Nc;G1jjbfRbbg8MVcFeGTmbdna8AaY9nmba8Nc:G1jjbfRbbcFeGmekaKcufhYdnaKaL9hmbaYcFeGce0mba8JaEfydbaX9hmekdndnaKclSmbaLcl9hmekdnaYcFeGce0mba8JaEfydbaX9hmdkaLcufcFeGce0mba8KawfydbaQ9hmekaDa8Ecx2fgKaXaQa8McFeGgYEBdlaKaQaXaYEBdbaKaYa5Gcb9hBdwa8Ecefh8Ekaeclfgecx9hmbkdna8Fcifg8Fad9pmbazcxfhza8EcifaS9nmekka8ETmdcbhLinaqaAaDaLcx2fgKydbgYcdtgzfydbc8S2fgeIdwa3aKydlg8Acx2fgXIdwg8WNaeIdzaXIdbg8UNaeIdaMgRaRMMa8WNaeIdlaXIdlgINaeIdCa8WNaeId3MgRaRMMaINaeIdba8UNaeIdxaINaeIdKMgRaRMMa8UNaeId8KMMM:lhRJbbbbJbbjZaeIdyg8R:va8RJbbbb9BEh8RdndnaKydwgEmbJFFuuh8YxekJbbbbJbbjZaqaAa8Acdtfydbc8S2fgeIdyg8S:va8SJbbbb9BEaeIdwa3aYcx2fgXIdwg8SNaeIdzaXIdbg8XNaeIdaMg8Ya8YMMa8SNaeIdlaXIdlg8YNaeIdCa8SNaeId3Mg8Sa8SMMa8YNaeIdba8XNaeIdxa8YNaeIdKMg8Sa8SMMa8XNaeId8KMMM:lNh8Yka8RaRNh80dna8LTmbavaYc8S2fgQIdwa8WNaQIdza8UNaQIdaMgRaRMMa8WNaQIdlaINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRaga8Aa8L2gHcdtfhXaiaYa8L2gwcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekava8Ac8S2fgQIdwa3aYcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8RagawcdtfhXaiaHcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YaCaYfRbbcd9hmbdna8Ka8Ja8Jazfydba8ASEaaazfydbgHcdtfydbgzcu9hmbaaa8AcdtfydbhzkavaHc8S2fgQIdwa3azcx2fgeIdwg8WNaQIdzaeIdbg8UNaQIdaMgRaRMMa8WNaQIdlaeIdlgINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRagaza8L2gwcdtfhXaiaHa8L2g8NcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekavazc8S2fgQIdwa3aHcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8Raga8NcdtfhXaiawcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YkaKa80a8Ya80a8Y9FgeEUdwaKa8AaYaeaETVgeEBdlaKaYa8AaeEBdbaLcefgLa8E9hmbkasc;Wbfcbcj;qbz:ojjjb8Aa0hea8EhXinasc;WbfaeydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbcefBdbaecxfheaXcufgXmbkcbhecbhXinasc;WbfaefgQydbhKaQaXBdbaKaXfhXaeclfgecj;qb9hmbkcbhea0hXinasc;WbfaXydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbgQcefBdbaraQcdtfaeBdbaXcxfhXa8Eaecefge9hmbkadak9RgQci9Uh9mdnalTmbcbheayhXinaXaeBdbaXclfhXalaecefge9hmbkkcbh9na9icbalz:ojjjbh8FaQcO9Uh9oa9mce4h9pasydwh9qcbh8Mcbh5dninaDara5cdtfydbcx2fg8NIdwgRa9c9Emea8Ma9m9pmeJFFuuh8Rdna9pa8E9pmbaDara9pcdtfydbcx2fIdwJbb;aZNh8RkdnaRa8R9ETmbaRac9ETmba8Ma9o0mdkdna8FaAa8NydlgHcdtg9rfydbgKfg9sRbba8FaAa8Nydbgzcdtg9tfydbgefg9uRbbVmbaCazfRbbh9vdnaTaecdtfgXclfydbgQaXydbgXSmbaQaX9RhYa3aKcx2fhLa3aecx2fhEa9qaXcitfhecbhXcehwdnindnayaeydbcdtfydbgQaKSmbayaeclfydbcdtfydbg8AaKSmbaQa8ASmba3a8Acx2fg8AIdba3aQcx2fgQIdbg8W:tgRaEIdlaQIdlg8U:tg8XNaEIdba8W:tg8Ya8AIdla8U:tg8RN:tgIaRaLIdla8U:tg80NaLIdba8W:tg81a8RN:tg8UNa8RaEIdwaQIdwg8S:tg8ZNa8Xa8AIdwa8S:tg8WN:tg8Xa8RaLIdwa8S:tgBNa80a8WN:tg8RNa8Wa8YNa8ZaRN:tg8Sa8Wa81NaBaRN:tgRNMMaIaINa8Xa8XNa8Sa8SNMMa8Ua8UNa8Ra8RNaRaRNMMN:rJbbj8:N9FmdkaecwfheaXcefgXaY6hwaYaX9hmbkkawceGTmba9pcefh9pxekdndndndna9vc9:fPdebdkazheinayaecdtgefaHBdbaaaefydbgeaz9hmbxikkdna8Ka8Ja8Ja9tfydbaHSEaaa9tfydbgzcdtfydbgecu9hmbaaa9rfydbhekaya9tfaHBdbaehHkayazcdtfaHBdbka9uce86bba9sce86bba8NIdwgRacacaR9DEhca9ncefh9ncecda9vceSEa8Mfh8Mka5cefg5a8E9hmbkka9nTmddnalTmbcbh8AcbhEindnayaEcdtgefydbgQaESmbaAaQcdtfydbhzdnaEaAaefydb9hgHmbaqazc8S2fgeaqaEc8S2fgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdyka8LTmbavaQc8S2fgeavaEc8S2gwfgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdya9kaQ2hLaihXa8LhKinaXaLfgeaXa8AfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaHmbJbbbbJbbjZaqawfgeIdygR:vaRJbbbb9BEaeIdwa3azcx2fgXIdwgRNaeIdzaXIdbg8RNaeIdaMg8Wa8WMMaRNaeIdlaXIdlg8WNaeIdCaRNaeId3MgRaRMMa8WNaeIdba8RNaeIdxa8WNaeIdKMgRaRMMa8RNaeId8KMMM:lNgRa83a83aR9DEh83ka8Aa9kfh8AaEcefgEal9hmbkcbhXa8JheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8JaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkcbhXa8KheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8KaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkka83aca8LEh83cbhKabhecbhYindnayaeydbcdtfydbgXayaeclfydbcdtfydbgQSmbaXayaecwfydbcdtfydbg8ASmbaQa8ASmbabaKcdtfgLaXBdbaLcwfa8ABdbaLclfaQBdbaKcifhKkaecxfheaYcifgYad6mbkdndnaJTmbaKak9nmba8Va839FTmbcbhdabhecbhXindnaoahaeydbgQcdtfydbcdtfIdba839ETmbabadcdtfgYaQBdbaYclfaeclfydbBdbaYcwfaecwfydbBdbadcifhdkaecxfheaXcifgXaK6mbkJFFuuh8Va9eTmeaohea9ehXJFFuuhRinaeIdbg8RaRaRa8R9EEg8WaRa8Ra839EgQEhRa8Wa8VaQEh8VaeclfheaXcufgXmbxdkkaKhdkadak0mbxdkkasclfabadalaAz:cjjjbkdndnadak0mbadhXxekdnaJmbadhXxekdna8Va9c9FmbadhXxekina8VJbb;aZNgRa9caRa9c9DEh8WJbbbbhRdna9eTmbaohea9ehAinaeIdbg8RaRa8Ra8W9FEaRa8RaR9EEhRaeclfheaAcufgAmbkkcbhXabhecbhAindnaoahaeydbgQcdtfydbcdtfIdba8W9ETmbabaXcdtfgKaQBdbaKclfaeclfydbBdbaKcwfaecwfydbBdbaXcifhXkaecxfheaAcifgAad6mbkJFFuuh8Vdna9eTmbaohea9ehAJFFuuh8RinaeIdbg8Ua8Ra8Ra8U9EEgIa8Ra8Ua8W9EgQEh8RaIa8VaQEh8VaeclfheaAcufgAmbkkdnaXad9hmbadhXxdkaRacacaR9DEhcaXak9nmeaXhda8Va9c9FmbkkdnamcjjjjlGTmbaOmbaXTmbcbh8AabheinaCaeydbgKfRbbc3thLaecwfgEydbhAdndna8JaKcdtgHfydbaeclfgzydbgQSmbcbhYa8KaQcdtfydbaK9hmekcjjjj94hYkaeaLaYVaKVBdbaCaQfRbbc3thLdndna8JaQcdtfydbaASmbcbhYa8KaAcdtfydbaQ9hmekcjjjj94hYkazaLaYVaQVBdbaCaAfRbbc3thYdndna8JaAcdtfydbaKSmbcbhQa8KaHfydbaA9hmekcjjjj94hQkaEaYaQVaAVBdbaecxfhea8Acifg8AaX6mbkkdnaOTmbaXTmbaXheinabaOabydbcdtfydbBdbabclfhbaecufgembkkdnaPTmbaPaUac:rNUdbka9hcdtascxffcxfhednina6Tmeaeydbcbyd1:jjjbH:bjjjbbaec98fhea6cufh6xbkkasc;W;qbf8KjjjjbaXk;Yieouabydlhvabydbclfcbaicdtz:ojjjbhoadci9UhrdnadTmbdnalTmbaehwadhDinaoalawydbcdtfydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbxdkkaehwadhDinaoawydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbkkdnaiTmbcbhDaohwinawydbhqawaDBdbawclfhwaqaDfhDaicufgimbkkdnadci6mbinaecwfydbhwaeclfydbhDaeydbhidnalTmbalawcdtfydbhwalaDcdtfydbhDalaicdtfydbhikavaoaicdtfgqydbcitfaDBdbavaqydbcitfawBdlaqaqydbcefBdbavaoaDcdtfgqydbcitfawBdbavaqydbcitfaiBdlaqaqydbcefBdbavaoawcdtfgwydbcitfaiBdbavawydbcitfaDBdlawawydbcefBdbaecxfhearcufgrmbkkabydbcbBdbk:todDue99aicd4aifhrcehwinawgDcethwaDar6mbkcuaDcdtgraDcFFFFi0Ecbyd:m:jjjbHjjjjbbhwaoaoyd9GgqcefBd9GaoaqcdtfawBdbawcFearz:ojjjbhkdnaiTmbalcd4hlaDcufhxcbhminamhDdnavTmbavamcdtfydbhDkcbadaDal2cdtfgDydlgwawcjjjj94SEgwcH4aw7c:F:b:DD2cbaDydbgwawcjjjj94SEgwcH4aw7c;D;O:B8J27cbaDydwgDaDcjjjj94SEgDcH4aD7c:3F;N8N27axGhwamcdthPdndndnavTmbakawcdtfgrydbgDcuSmeadavaPfydbal2cdtfgsIdbhzcehqinaqhrdnadavaDcdtfydbal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmlkarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbxdkkakawcdtfgrydbgDcuSmbadamal2cdtfgsIdbhzcehqinaqhrdnadaDal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmikarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbkkaramBdbamhDkabaPfaDBdbamcefgmai9hmbkkakcbyd1:jjjbH:bjjjbbaoaoyd9GcufBd9GdnaeTmbaiTmbcbhDaehwinawaDBdbawclfhwaiaDcefgD9hmbkcbhDaehwindnaDabydbgrSmbawaearcdtfgrydbBdbaraDBdbkawclfhwabclfhbaiaDcefgD9hmbkkk;Qodvuv998Jjjjjbca9Rgvczfcwfcbyd11jjbBdbavcb8Pdj1jjb83izavcwfcbydN1jjbBdbavcb8Pd:m1jjb83ibdnadTmbaicd4hodnabmbdnalTmbcbhrinaealarcdtfydbao2cdtfhwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxikkaocdthrcbhwincbhiinavczfaifgDaeaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkaearfheawcefgwad9hmbxdkkdnalTmbcbhrinabarcx2fgiaealarcdtfydbao2cdtfgwIdbUdbaiawIdlUdlaiawIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxdkkaocdthlcbhraehwinabarcx2fgiaearao2cdtfgDIdbUdbaiaDIdlUdlaiaDIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkawalfhwarcefgrad9hmbkkJbbbbavIdbavIdzgk:tgqaqJbbbb9DEgqavIdlavIdCgx:tgmamaq9DEgqavIdwavIdKgm:tgPaPaq9DEhPdnabTmbadTmbJbbbbJbbjZaP:vaPJbbbb9BEhqinabaqabIdbak:tNUdbabclfgvaqavIdbax:tNUdbabcwfgvaqavIdbam:tNUdbabcxfhbadcufgdmbkkaPk:ZlewudnaeTmbcbhvabhoinaoavBdbaoclfhoaeavcefgv9hmbkkdnaiTmbcbhrinadarcdtfhwcbhDinalawaDcdtgvc;a1jjbfydbcdtfydbcdtfydbhodnabalawavfydbcdtfydbgqcdtfgkydbgvaqSmbinakabavgqcdtfgxydbgvBdbaxhkaqav9hmbkkdnabaocdtfgkydbgvaoSmbinakabavgocdtfgxydbgvBdbaxhkaoav9hmbkkdnaqaoSmbabaqaoaqao0Ecdtfaqaoaqao6EBdbkaDcefgDci9hmbkarcifgrai6mbkkdnaembcbskcbhxindnalaxcdtgvfydbax9hmbaxhodnabavfgDydbgvaxSmbaDhqinaqabavgocdtfgkydbgvBdbakhqaoav9hmbkkaDaoBdbkaxcefgxae9hmbkcbhvabhocbhkindndnavalydbgq9hmbdnavaoydbgq9hmbaoakBdbakcefhkxdkaoabaqcdtfydbBdbxekaoabaqcdtfydbBdbkaoclfhoalclfhlaeavcefgv9hmbkakk;Jiilud99duabcbaecltz:ojjjbhvdnalTmbadhoaihralhwinarcwfIdbhDarclfIdbhqavaoydbcltfgkarIdbakIdbMUdbakclfgxaqaxIdbMUdbakcwfgxaDaxIdbMUdbakcxfgkakIdbJbbjZMUdbaoclfhoarcxfhrawcufgwmbkkdnaeTmbavhraehkinarcxfgoIdbhDaocbBdbararIdbJbbbbJbbjZaD:vaDJbbbb9BEgDNUdbarclfgoaDaoIdbNUdbarcwfgoaDaoIdbNUdbarczfhrakcufgkmbkkdnalTmbinavadydbcltfgrcxfgkaicwfIdbarcwfIdb:tgDaDNaiIdbarIdb:tgDaDNaiclfIdbarclfIdb:tgDaDNMMgDakIdbgqaqaD9DEUdbadclfhdaicxfhialcufglmbkkdnaeTmbavcxfhrinabarIdbUdbarczfhrabclfhbaecufgembkkk8MbabaeadaialavcbcbcbcbcbaoarawaDz:bjjjbk8MbabaeadaialavaoarawaDaqakaxamaPz:bjjjbk:DCoDud99rue99iul998Jjjjjbc;Wb9Rgw8KjjjjbdndnarmbcbhDxekawcxfcbc;Kbz:ojjjb8Aawcuadcx2adc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbgqBdxawceBd2aqaeadaicbz:ejjjb8AawcuadcdtadcFFFFi0Egkcbyd:m:jjjbHjjjjbbgxBdzawcdBd2adcd4adfhmceheinaegicetheaiam6mbkcbhPawcuaicdtgsaicFFFFi0Ecbyd:m:jjjbHjjjjbbgzBdCawciBd2dndnar:ZgH:rJbbbZMgO:lJbbb9p9DTmbaO:Ohexekcjjjj94hekaicufhAc:bwhmcbhCadhXcbhQinaChLaeamgKcufaeaK9iEaPgDcefaeaD9kEhYdndnadTmbaYcuf:YhOaqhiaxheadhmindndnaiIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbh5cbhPindna3axaPcdtfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbaeaCSmbcehiina3amaifaAGgmcdtfgEydbgecuSmeaicefhiaeaC9hmbkkaEaCBdba5aecuSfh5aPcefgPad9hmbxdkkazcFeasz:ojjjb8Acbh5kaDaYa5ar0giEhPaLa5aiEhCdna5arSmbaYaKaiEgmaP9Rcd9imbdndnaQcl0mbdnaX:ZgOaL:Zg8A:taY:Yg8EaD:Y:tg8Fa8EaK:Y:tgaa5:ZghaH:tNNNaOaH:taaNa8Aah:tNa8AaH:ta8FNahaO:tNM:va8EMJbbbZMgO:lJbbb9p9DTmbaO:Ohexdkcjjjj94hexekaPamfcd9Theka5aXaiEhXaQcefgQcs9hmekkdndnaCmbcihicbhDxekcbhiawakcbyd:m:jjjbHjjjjbbg5BdKawclBd2aPcuf:Yh8AdndnadTmbaqhiaxheadhmindndnaiIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbhDcbhYindndndna3axaYcdtgKfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbcehiinaxaecdtgefydbaCSmdamaifheaicefhia3aeaAGgmcdtfgEydbgecu9hmbkkaEaYBdbaDhiaDcefhDxeka5aefydbhika5aKfaiBdbaYcefgYad9hmbkcuaDc32giaDc;j:KM;jb0EhexekazcFeasz:ojjjb8AcbhDcbhekawaecbyd:m:jjjbHjjjjbbgeBd3awcvBd2aecbaiz:ojjjbhEavcd4hKdnadTmbdnalTmbaKcdth3a5hCaqhealhmadhAinaEaCydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiamIdbaiIdxMUdxaiamclfIdbaiIdzMUdzaiamcwfIdbaiIdCMUdCaiaiIdKJbbjZMUdKaCclfhCaecxfheama3fhmaAcufgAmbxdkka5hmaqheadhCinaEamydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiaiIdxJbbbbMUdxaiaiIdzJbbbbMUdzaiaiIdCJbbbbMUdCaiaiIdKJbbjZMUdKamclfhmaecxfheaCcufgCmbkkdnaDTmbaEhiaDheinaiaiIdbJbbbbJbbjZaicKfIdbgO:vaOJbbbb9BEgONUdbaiclfgmaOamIdbNUdbaicwfgmaOamIdbNUdbaicxfgmaOamIdbNUdbaiczfgmaOamIdbNUdbaicCfgmaOamIdbNUdbaic3fhiaecufgembkkcbhCawcuaDcdtgYaDcFFFFi0Egicbyd:m:jjjbHjjjjbbgeBdaawcoBd2awaicbyd:m:jjjbHjjjjbbg3Bd8KaecFeaYz:ojjjbhxdnadTmbJbbjZJbbjZa8A:vaPceSEaoNgOaONh8AaKcdthPalheina8Aaec;81jjbalEgmIdwaEa5ydbgAc32fgiIdC:tgOaONamIdbaiIdx:tgOaONamIdlaiIdz:tgOaONMMNaqcwfIdbaiIdw:tgOaONaqIdbaiIdb:tgOaONaqclfIdbaiIdl:tgOaONMMMhOdndnaxaAcdtgifgmydbcuSmba3aifIdbaO9ETmekamaCBdba3aifaOUdbka5clfh5aqcxfhqaeaPfheadaCcefgC9hmbkkabaxaYz:njjjb8AcrhikaicdthiinaiTmeaic98fgiawcxffydbcbyd1:jjjbH:bjjjbbxbkkawc;Wbf8KjjjjbaDk:Ydidui99ducbhi8Jjjjjbca9Rglczfcwfcbyd11jjbBdbalcb8Pdj1jjb83izalcwfcbydN1jjbBdbalcb8Pd:m1jjb83ibdndnaembJbbjFhvJbbjFhoJbbjFhrxekadcd4cdthwincbhdinalczfadfgDabadfIdbgvaDIdbgoaoav9EEUdbaladfgDavaDIdbgoaoav9DEUdbadclfgdcx9hmbkabawfhbaicefgiae9hmbkalIdwalIdK:thralIdlalIdC:thoalIdbalIdz:thvkJbbbbavavJbbbb9DEgvaoaoav9DEgvararav9DEk9DeeuabcFeaicdtz:ojjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcifc98GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcrfc94GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd:q:jjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd:q:jjjbfgdBd:q:jjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk:Iedbcjwk1eFFuuFFuuFFuuFFuFFFuFFFuFbbbbbbbbeeebeebebbeeebebbbbbebebbbbbbbbbebbbdbbbbbbbebbbebbbdbbbbbbbbbbbeeeeebebbebbebebbbeebbbbbbbbbbbbbbbbbbbbbc1Dkxebbbdbbb:GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(f){a=f.instance,a.exports.__wasm_call_ctors()});function r(f){for(var l=new Uint8Array(f.length),y=0;y<f.length;++y){var b=f.charCodeAt(y);l[y]=b>96?b-97:b>64?b-39:b+4}for(var g=0,y=0;y<f.length;++y)l[g++]=l[y]<60?e[l[y]]:(l[y]-60)*64+l[++y];return l.buffer.slice(0,g)}function n(f){if(!f)throw new Error("Assertion failed")}function i(f){return new Uint8Array(f.buffer,f.byteOffset,f.byteLength)}function o(f,l,y){var b=a.exports.sbrk,g=b(l.length*4),x=b(y*4),v=new Uint8Array(a.exports.memory.buffer),T=i(l);v.set(T,g);var I=f(x,g,l.length,y);v=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(y);new Uint8Array(S.buffer).set(v.subarray(x,x+y*4)),T.set(v.subarray(g,g+l.length*4)),b(g-b(0));for(var R=0;R<l.length;++R)l[R]=S[l[R]];return[S,I]}function c(f){for(var l=0,y=0;y<f.length;++y){var b=f[y];l=l<b?b:l}return l}function d(f,l,y,b,g,x,v,T,I){var S=a.exports.sbrk,R=S(4),_=S(y*4),A=S(g*x),j=S(y*4),L=new Uint8Array(a.exports.memory.buffer);L.set(i(b),A),L.set(i(l),j);var F=f(_,j,y,A,g,x,v,T,I,R);L=new Uint8Array(a.exports.memory.buffer);var K=new Uint32Array(F);i(K).set(L.subarray(_,_+F*4));var W=new Float32Array(1);return i(W).set(L.subarray(R,R+4)),S(R-S(0)),[K,W[0]]}function h(f,l,y,b,g,x,v,T,I,S,R,_,A){var j=a.exports.sbrk,L=j(4),F=j(y*4),K=j(g*x),W=j(g*T),te=j(I.length*4),oe=j(y*4),Oe=S?j(g):0,de=new Uint8Array(a.exports.memory.buffer);de.set(i(b),K),de.set(i(v),W),de.set(i(I),te),de.set(i(l),oe),S&&de.set(i(S),Oe);var Pe=f(F,oe,y,K,g,x,W,T,te,I.length,Oe,R,_,A,L);de=new Uint8Array(a.exports.memory.buffer);var Ke=new Uint32Array(Pe);i(Ke).set(de.subarray(F,F+Pe*4));var ve=new Float32Array(1);return i(ve).set(de.subarray(L,L+4)),j(L-j(0)),[Ke,ve[0]]}function u(f,l,y,b){var g=a.exports.sbrk,x=g(y*b),v=new Uint8Array(a.exports.memory.buffer);v.set(i(l),x);var T=f(x,y,b);return g(x-g(0)),T}function m(f,l,y,b,g,x,v,T){var I=a.exports.sbrk,S=I(T*4),R=I(y*b),_=I(y*x),A=new Uint8Array(a.exports.memory.buffer);A.set(i(l),R),g&&A.set(i(g),_);var j=f(S,R,y,b,_,x,v,T);A=new Uint8Array(a.exports.memory.buffer);var L=new Uint32Array(j);return i(L).set(A.subarray(S,S+j*4)),I(S-I(0)),L}var p={LockBorder:1,Sparse:2,ErrorAbsolute:4,Prune:8,_InternalDebug:1<<30};return{ready:s,supported:!0,compactMesh:function(f){n(f instanceof Uint32Array||f instanceof Int32Array||f instanceof Uint16Array||f instanceof Int16Array),n(f.length%3==0);var l=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f);return o(a.exports.meshopt_optimizeVertexFetchRemap,l,c(f)+1)},simplify:function(f,l,y,b,g,x){n(f instanceof Uint32Array||f instanceof Int32Array||f instanceof Uint16Array||f instanceof Int16Array),n(f.length%3==0),n(l instanceof Float32Array),n(l.length%y==0),n(y>=3),n(b>=0&&b<=f.length),n(b%3==0),n(g>=0);for(var v=0,T=0;T<(x?x.length:0);++T)n(x[T]in p),v|=p[x[T]];var I=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f),S=d(a.exports.meshopt_simplify,I,f.length,l,l.length/y,y*4,b,g,v);return S[0]=f instanceof Uint32Array?S[0]:new f.constructor(S[0]),S},simplifyWithAttributes:function(f,l,y,b,g,x,v,T,I,S){n(f instanceof Uint32Array||f instanceof Int32Array||f instanceof Uint16Array||f instanceof Int16Array),n(f.length%3==0),n(l instanceof Float32Array),n(l.length%y==0),n(y>=3),n(b instanceof Float32Array),n(b.length%g==0),n(g>=0),n(v==null||v instanceof Uint8Array),n(v==null||v.length==l.length/y),n(T>=0&&T<=f.length),n(T%3==0),n(I>=0),n(Array.isArray(x)),n(g>=x.length),n(x.length<=32);for(var R=0;R<x.length;++R)n(x[R]>=0);for(var _=0,R=0;R<(S?S.length:0);++R)n(S[R]in p),_|=p[S[R]];var A=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f),j=h(a.exports.meshopt_simplifyWithAttributes,A,f.length,l,l.length/y,y*4,b,g*4,new Float32Array(x),v?new Uint8Array(v):null,T,I,_);return j[0]=f instanceof Uint32Array?j[0]:new f.constructor(j[0]),j},getScale:function(f,l){return n(f instanceof Float32Array),n(f.length%l==0),n(l>=3),u(a.exports.meshopt_simplifyScale,f,f.length/l,l*4)},simplifyPoints:function(f,l,y,b,g,x){return n(f instanceof Float32Array),n(f.length%l==0),n(l>=3),n(y>=0&&y<=f.length/l),b?(n(b instanceof Float32Array),n(b.length%g==0),n(g>=3),n(f.length/l==b.length/g),m(a.exports.meshopt_simplifyPoints,f,f.length/l,l*4,b,g*4,x,y)):m(a.exports.meshopt_simplifyPoints,f,f.length/l,l*4,void 0,0,0,y)}}})();var rw=(function(){var t="b9H79TebbbeVx9Geueu9Geub9Gbb9Giuuueu9Gmuuuuuuuuuuu9999eu9Gvuuuuueu9Gwuuuuuuuub9Gxuuuuuuuuuuuueu9Gkuuuuuuuuuu99eu9Gouuuuuub9Gruuuuuuub9GluuuubiOHdilvorwDqqkbiibeilve9Weiiviebeoweuec;G:Odkr:Yewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9I919P29K9nW79O2Wt79c9V919U9KbeX9TW79O9V9Wt9F9I919P29K9nW79O2Wt7bo39TW79O9V9Wt9F9J9V9T9W91tWJ2917tWV9c9V919U9K7br39TW79O9V9Wt9F9J9V9T9W91tW9nW79O2Wt9c9V919U9K7bDL9TW79O9V9Wt9F9V9Wt9P9T9P96W9nW79O2Wtbql79IV9RbkDwebcekdsPq;Q9BHdbkIbabaec9:fgefcufae9Ugeabci9Uadfcufad9Ugbaeab0Ek:w8KDPue99eux99dui99euo99iu8Jjjjjbc:WD9Rgm8KjjjjbdndnalmbcbhPxekamc:Cwfcbc;Kbz:njjjb8Adndnalcb9imbaoal9nmbamcuaocdtaocFFFFi0Egscbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamascbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8waihsalhAinazasydbcdtfcbBdbasclfhsaAcufgAmbkaihsalhAinazasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkaihsalhCcbhXindnazasydbcdtgQfgAydbcb9imbaHaQfaXBdbaAaAydbgQcjjjj94VBdbaQaXfhXkasclfhsaCcufgCmbkalci9UhLdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhXaHaAydbcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaXcdtfgXaXydbgXcefBdbaOaXcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaihsalhAindnazasydbcdtgCfgXydbgQcu9kmbaXaQcFFFFrGgQBdbaHaCfgCaCydbaQ9RBdbkasclfhsaAcufgAmbxdkkamcuaocdtgsaocFFFFi0EgAcbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamaAcbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8wazcbasz:njjjbhXalci9UhLaihsalhAinaXasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkdnaoTmbcbhsaHhAaXhCaohQinaAasBdbaAclfhAaCydbasfhsaCclfhCaQcufgQmbkkdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhQaHaAydbcdtfgKaKydbgKcefBdbaOaKcdtfasBdbaHaQcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaoTmbcbhsaohAinaHasfgCaCydbaXasfydb9RBdbasclfhsaAcufgAmbkkamaLcbyd;y1jjbHjjjjbbgsBd:OwamclBd;8wascbaLz:njjjbhYamcuaLcK2alcjjjjd0Ecbyd;y1jjbHjjjjbbg8ABd:SwamcvBd;8wJbbbbhEdnalci6g3mbarcd4hKaihAa8AhsaLhrJbbbbh5inavaAclfydbaK2cdtfgCIdlh8EavaAydbaK2cdtfgXIdlhEavaAcwfydbaK2cdtfgQIdlh8FaCIdwhaaXIdwhhaQIdwhgasaCIdbg8JaXIdbg8KMaQIdbg8LMJbbnn:vUdbasclfaXIdlaCIdlMaQIdlMJbbnn:vUdbaQIdwh8MaCIdwh8NaXIdwhyascxfa8EaE:tg8Eagah:tggNa8FaE:tg8Faaah:tgaN:tgEJbbbbJbbjZa8Ja8K:tg8Ja8FNa8La8K:tg8Ka8EN:tghahNaEaENaaa8KNaga8JN:tgEaENMM:rg8K:va8KJbbbb9BEg8ENUdbasczfaEa8ENUdbascCfaha8ENUdbascwfa8Maya8NMMJbbnn:vUdba5a8KMh5aAcxfhAascKfhsarcufgrmbka5aL:Z:vJbbbZNhEkamcuaLcdtalcFFFF970Ecbyd;y1jjbHjjjjbbgCBd:WwamcoBd;8waEaq:ZNhEdna3mbcbhsaChAinaAasBdbaAclfhAaLascefgs9hmbkkaE:rhhcuh8PamcuaLcltalcFFFFd0Ecbyd;y1jjbHjjjjbbgIBd:0wamcrBd;8wcbaIa8AaCaLz:djjjb8AJFFuuhyJFFuuh8RJFFuuh8Sdnalci6gXmbJFFuuh8Sa8AhsaLhAJFFuuh8RJFFuuhyinascwfIdbgEayayaE9EEhyasclfIdbgEa8Ra8RaE9EEh8RasIdbgEa8Sa8SaE9EEh8SascKfhsaAcufgAmbkkahJbbbZNhgamaocetgscuaocu9kEcbyd;y1jjbHjjjjbbgABd:4waAcFeasz:njjjbhCdnaXmbcbhAJFFuuhEa8Ahscuh8PinascwfIdbay:tghahNasIdba8S:tghahNasclfIdba8R:tghahNMM:rghaEa8PcuSahaE9DVgXEhEaAa8PaXEh8PascKfhsaLaAcefgA9hmbkkamczfcbcjwz:njjjb8Aamcwf9cb83ibam9cb83ibagaxNhRJbbjZak:th8Ncbh8UJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80cbh81cbhPinJbbbbhEdna8UTmbJbbjZa8U:Z:vhEkJbbbbhhdna80a80Na8Ya8YNa8Za8ZNMMg8KJbbbb9BmbJbbjZa8K:r:vhhka8XaENh5a8WaENh8Fa8VaENhaa8PhQdndndndndna8UaPVTmbamydwgBTmea80ahNh8Ja8ZahNh8La8YahNh8Maeamydbcdtfh83cbh3JFFuuhEcvhXcuhQindnaza83a3cdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAindndnaCaiaAydbgKcx2fgsclfydbgrcetf8Vebcs4aCasydbgLcetf8Vebcs4faCascwfydbglcetf8Vebcs4fgombcbhsxekcehsazaLcdtfydbgLceSmbcehsazarcdtfydbgrceSmbcehsazalcdtfydbglceSmbdnarcdSaLcdSfalcdSfcd6mbaocefhsxekaocdfhskdnasaX9kmba8AaKcK2fgLIdwa5:thhaLIdla8F:th8KaLIdbaa:th8EdndnakJbbbb9DTmba8E:lg8Ea8K:lg8Ka8Ea8K9EEg8Kah:lgha8Kah9EEag:vJbbjZMhhxekahahNa8Ea8ENa8Ka8KNMM:rag:va8NNJbbjZMJ9VO:d86JbbjZaLIdCa8JNaLIdxa8MNa8LaLIdzNMMakN:tghahJ9VO:d869DENhhkaKaQasaX6ahaE9DVgLEhQasaXaLEhXahaEaLEhEkaAclfhAavcufgvmbkka3cefg3aB9hmbkkaQcu9hmekama5Ud:ODama8FUd:KDamaaUd:GDamcuBd:qDamcFFF;7rBdjDaIcba8AaYamc:GDfakJbbbb9Damc:qDfamcjDfz:ejjjbamyd:qDhQdndnaxJbbbb9ETmba8UaD6mbaQcuSmeceh3amIdjDaR9EmixdkaQcu9hmekdna8UTmbdnamydlgza8Uci2fgsciGTmbadasfcba8Uazcu7fciGcefz:njjjb8AkabaPcltfgzam8Pib83dbazcwfamcwf8Pib83dbaPcefhPkc3hzinazc98Smvamc:Cwfazfydbcbyd;u1jjbH:bjjjbbazc98fhzxbkkcbh3a8Uaq9pmbamydwaCaiaQcx2fgsydbcetf8Vebcs4aCascwfydbcetf8Vebcs4faCasclfydbcetf8Vebcs4ffaw9nmekcbhscbhAdna81TmbcbhAamczfhXinamczfaAcdtfaXydbgLBdbaXclfhXaAaYaLfRbbTfhAa81cufg81mbkkamydwhlamydbhXam9cu83i:GDam9cu83i:ODam9cu83i:qDam9cu83i:yDaAc;8eaAclfc:bd6Eh81inamcjDfasfcFFF;7rBdbasclfgscz9hmbka81cdthBdnalTmbaeaXcdtfhocbhrindnazaoarcdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAcuhLcuhsinazaiaAydbgKcx2fgXclfydbcdtfydbazaXydbcdtfydbfazaXcwfydbcdtfydbfgXasaXas6gXEhsaKaLaXEhLaAclfhAavcufgvmbkaLcuSmba8AaLcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEcbhAindndnasamc:qDfaAfgvydbgX6mbasaX9hmeaEamcjDfaAfIdb9FTmekavasBdbamc:GDfaAfaLBdbamcjDfaAfaEUdbxdkaAclfgAcz9hmbkkarcefgral9hmbkkamczfaBfhLcbhscbhAindnamc:GDfasfydbgXcuSmbaLaAcdtfaXBdbaAcefhAkasclfgscz9hmbkaAa81fg81TmbJFFuuhhcuhKamczfhsa81hvcuhLina8AasydbgXcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEdndnazaiaXcx2fgAclfydbcdtfydbazaAydbcdtfydbfazaAcwfydbcdtfydbfgAaL6mbaAaL9hmeaEah9DTmekaEhhaAhLaXhKkasclfhsavcufgvmbkaKcuSmbaKhQkdnamaiaQcx2fgrydbarclfydbarcwfydbaCabaeadaPawaqa3z:fjjjbTmbaPcefhPJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80kcbhXinaOaHaraXcdtfydbcdtgAfydbcdtfgKhsazaAfgvydbgLhAdnaLTmbdninasydbaQSmeasclfhsaAcufgATmdxbkkasaKaLcdtfc98fydbBdbavavydbcufBdbkaXcefgXci9hmbka8AaQcK2fgsIdbhEasIdlhhasIdwh8KasIdxh8EasIdzh5asIdCh8FaYaQfce86bba80a8FMh80a8Za5Mh8Za8Ya8EMh8Ya8Xa8KMh8Xa8WahMh8Wa8VaEMh8Vamydxh8Uxbkkamc:WDf8KjjjjbaPk;Vvivuv99lu8Jjjjjbca9Rgv8Kjjjjbdndnalcw0mbaiydbhoaeabcitfgralcdtcufBdlaraoBdbdnalcd6mbaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkkalabfhrxekcbhDavczfcwfcbBdbav9cb83izavcwfcbBdbav9cb83ibJbbjZhqJbbjZhkinadaiaDcdtfydbcK2fhwcbhrinavczfarfgoawarfIdbgxaoIdbgm:tgPakNamMgmUdbavarfgoaPaxam:tNaoIdbMUdbarclfgrcx9hmbkJbbjZaqJbbjZMgq:vhkaDcefgDal9hmbkcbhoadcbcecdavIdlgxavIdwgm9GEgravIdbgPam9GEaraPax9GEgscdtgrfhzavczfarfIdbhxaihralhwinaiaocdtfgDydbhHaDarydbgOBdbaraHBdbarclfhraoazaOcK2fIdbax9Dfhoawcufgwmbkaeabcitfhrdndnaocv6mbaoalc98f6mekaraiydbBdbaralcdtcufBdlaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkalabfhrxekaraxUdbararydlc98GasVBdlabcefaeadaiaoz:djjjbhwararydlciGawabcu7fcdtVBdlawaeadaiaocdtfalao9Rz:djjjbhrkavcaf8Kjjjjbark:;idiud99dndnabaecitfgwydlgDciGgqciSmbinabcbaDcd4gDalaqcdtfIdbawIdb:tgkJbbbb9FEgwaecefgefadaialavaoarz:ejjjbak:larIdb9FTmdabawaD7aefgecitfgwydlgDciGgqci9hmbkkabaecitfgeclfhbdnavmbcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdwalIdw:tgkakNaqIdbalIdb:tgkakNaqIdlalIdl:tgkakNMM:rgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbxdkkcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdbalIdb:t:lgkaqIdlalIdl:t:lgxakax9EEgkaqIdwalIdw:t:lgxakax9EEgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbkkk;llevudnabydwgxaladcetfgm8Vebcs4alaecetfgP8Vebgscs4falaicetfgz8Vebcs4ffaD0abydxaq9pVakVgDce9hmbavawcltfgxab8Pdb83dbaxcwfabcwfgx8Pdb83dbdnaxydbgqTmbaoabydbcdtfhxaqhsinalaxydbcetfcFFi87ebaxclfhxascufgsmbkkdnabydxglci2gsabydlgxfgkciGTmbarakfcbalaxcu7fciGcefz:njjjb8Aabydxci2hsabydlhxabydwhqkab9cb83dwababydbaqfBdbabascifc98GaxfBdlaP8Vebhscbhxkdnascztcz91cu9kmbabaxcefBdwaPax87ebaoabydbcdtfaxcdtfaeBdbkdnam8Uebcu9kmbababydwgxcefBdwamax87ebaoabydbcdtfaxcdtfadBdbkdnaz8Uebcu9kmbababydwgxcefBdwazax87ebaoabydbcdtfaxcdtfaiBdbkarabydlfabydxci2faPRbb86bbarabydlfabydxci2fcefamRbb86bbarabydlfabydxci2fcdfazRbb86bbababydxcefBdxaDk8LbabaeadaialavaoarawaDaDaqJbbbbz:cjjjbk;Nkovud99euv99eul998Jjjjjbc:W;ae9Rgo8KjjjjbdndnadTmbavcd4hrcbhwcbhDindnaiaeclfydbar2cdtfgvIdbaiaeydbar2cdtfgqIdbgk:tgxaiaecwfydbar2cdtfgmIdlaqIdlgP:tgsNamIdbak:tgzavIdlaP:tgPN:tgkakNaPamIdwaqIdwgH:tgONasavIdwaH:tgHN:tgPaPNaHazNaOaxN:tgxaxNMM:rgsJbbbb9Bmbaoc:W:qefawcx2fgAakas:vUdwaAaxas:vUdlaAaPas:vUdbaoc8Wfawc8K2fgAaq8Pdb83dbaAav8Pdb83dxaAam8Pdb83dKaAcwfaqcwfydbBdbaAcCfavcwfydbBdbaAcafamcwfydbBdbawcefhwkaecxfheaDcifgDad6mbkab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbawTmeaocbBd8Sao9cb83iKao9cb83izaoczfaoc8Wfawci2cxaoc8Sfcbcrz1jjjbaoIdKhCaoIdChXaoIdzhQao9cb83iwao9cb83ibaoaoc:W:qefawcxaoc8Sfcbciz1jjjbJbbjZhkaoIdwgPJbbbbJbbjZaPaPNaoIdbgPaPNaoIdlgsasNMM:rgx:vaxJbbbb9BEgzNhxasazNhsaPazNhzaoc:W:qefheawhvinaecwfIdbaxNaeIdbazNasaeclfIdbNMMgPakaPak9DEhkaecxfheavcufgvmbkabaCUdwabaXUdlabaQUdbabaoId3UdxdndnakJ;n;m;m899FmbJbbbbhPaoc:W:qefheaoc8WfhvinaCavcwfIdb:taecwfIdbgHNaQavIdb:taeIdbgONaXavclfIdb:taeclfIdbgLNMMaxaHNazaONasaLNMM:vgHaPaHaP9EEhPavc8KfhvaecxfheawcufgwmbkabaxUd8KabasUdaabazUd3abaCaxaPN:tUdKabaXasaPN:tUdCabaQazaPN:tUdzabJbbjZakakN:t:rgkUdydndnaxJbbj:;axJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;axJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohexekcjjjj94hekabae86b8UdndnasJbbj:;asJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;asJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkabav86bRdndnazJbbj:;azJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;azJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohqxekcjjjj94hqkabaq86b8SdndnaecKtcK91:YJbb;:9c:vax:t:lavcKtcK91:YJbb;:9c:vas:t:laqcKtcK91:YJbb;:9c:vaz:t:lakMMMJbb;:9cNJbbjZMgk:lJbbb9p9DTmbak:Ohexekcjjjj94hekaecFbaecFb9iEhexekabcjjj;8iBdycFbhekabae86b8Vxekab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbkaoc:W;aef8Kjjjjbk;Iwwvul99iud99eue99eul998Jjjjjbcje9Rgr8Kjjjjbavcd4hwaicd4hDdndnaoTmbarc;abfcbaocdtgvz:njjjb8Aarc;Gbfcbavz:njjjb8AarhvarcafhiaohqinavcFFF97BdbaicFFF;7rBdbaiclfhiavclfhvaqcufgqmbkdnadTmbcbhkinaeakaD2cdtfgvIdwhxavIdlhmavIdbhPalakaw2cdtfIdbhsarc;abfhzarhiarc;GbfhHarcafhqcj1jjbhvaohOinasavcwfIdbaxNavIdbaPNavclfIdbamNMMgAMhCakhXdnaAas:tgAaqIdbgQ9DgLmbaHydbhXkaHaXBdbakhXdnaCaiIdbgK9EmbazydbhXaKhCkazaXBdbaiaCUdbaqaAaQaLEUdbavcxfhvaqclfhqaHclfhHaiclfhiazclfhzaOcufgOmbkakcefgkad9hmbkkadThkJbbbbhCcbhXarc;abfhvarc;Gbfhicbhqinalavydbgzaw2cdtfIdbalaiydbgHaw2cdtfIdbaeazaD2cdtfgzIdwaeaHaD2cdtfgHIdw:tgsasNazIdbaHIdb:tgsasNazIdlaHIdl:tgsasNMM:rMMgsaCasaC9EgzEhCaqaXazEhXaiclfhiavclfhvaoaqcefgq9hmbkaCJbbbZNhKxekadThkcbhXJbbbbhKkJbbbbhCdnaearc;abfaXcdtgifydbgqaD2cdtfgvIdwaearc;GbfaifydbgzaD2cdtfgiIdwgm:tgsasNavIdbaiIdbgY:tgAaANavIdlaiIdlgP:tgQaQNMM:rgxJbbbb9ETmbaxalaqaw2cdtfIdbMalazaw2cdtfIdb:taxaxM:vhCkasaCNamMhmaQaCNaPMhPaAaCNaYMhYdnakmbaDcdthvawcdthiindnalIdbg8AaecwfIdbam:tgCaCNaeIdbaY:tgsasNaeclfIdbaP:tgAaANMM:rgQMgEaK9ETmbJbbbbhxdnaQJbbbb9ETmbaEaK:taQaQM:vhxkaxaCNamMhmaxaANaPMhPaxasNaYMhYa8AaKaQMMJbbbZNhKkaeavfhealaifhladcufgdmbkkabaKUdxabamUdwabaPUdlabaYUdbarcjef8Kjjjjbkjeeiu8Jjjjjbcj8W9Rgr8Kjjjjbaici2hwdnaiTmbawceawce0EhDarhiinaiaeadRbbcdtfydbBdbadcefhdaiclfhiaDcufgDmbkkabarawaladaoz:hjjjbarcj8Wf8Kjjjjbk:3lequ8JjjjjbcjP9Rgl8Kjjjjbcbhvalcjxfcbaiz:njjjb8AdndnadTmbcjehoaehrincuhwarhDcuhqavhkdninawakaoalcjxfaDcefRbbfRbb9RcFeGci6aoalcjxfaDRbbfRbb9RcFeGci6faoalcjxfaDcdfRbbfRbb9RcFeGci6fgxaq9mgmEhwdnammbaxce0mdkaxaqaxaq9kEhqaDcifhDadakcefgk9hmbkkaeawci2fgDcdfRbbhqaDcefRbbhxaDRbbhkaeavci2fgDcifaDawav9Rci2z:qjjjb8Aakalcjxffaocefgo86bbaxalcjxffao86bbaDcdfaq86bbaDcefax86bbaDak86bbaqalcjxffao86bbarcifhravcefgvad9hmbkalcFeaicetz:njjjbhoadci2gDceaDce0EhqcbhxindnaoaeRbbgkcetfgw8UebgDcu9kmbawax87ebaocjlfaxcdtfabakcdtfydbBdbaxhDaxcefhxkaeaD86bbaecefheaqcufgqmbkaxcdthDxekcbhDkabalcjlfaDz:mjjjb8AalcjPf8Kjjjjbk9teiucbcbyd;C1jjbgeabcifc98GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;C1jjbgeabcrfc94GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;C1jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;C1jjbfgdBd;C1jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk:;Deludndndnadch9pmbabaeSmdaeabadfgi9Rcbadcet9R0mekabaead;8qbbxekaeab7ciGhldndndnabae9pmbdnalTmbadhvabhixikdnabciGmbadhvabhixdkadTmiabaeRbb86bbadcufhvdnabcefgiciGmbaecefhexdkavTmiabaeRbe86beadc9:fhvdnabcdfgiciGmbaecdfhexdkavTmiabaeRbd86bdadc99fhvdnabcifgiciGmbaecifhexdkavTmiabaeRbi86biabclfhiaeclfheadc98fhvxekdnalmbdnaiciGTmbadTmlabadcufgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc9:fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc99fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc98fgdfaeadfRbb86bbkadcl6mbdnadc98fgocd4cefciGgiTmbaec98fhlabc98fhvinavadfaladfydbBdbadc98fhdaicufgimbkkaocx6mbaec9Wfhvabc9WfhoinaoadfgicxfavadfglcxfydbBdbaicwfalcwfydbBdbaiclfalclfydbBdbaialydbBdbadc9Wfgdci0mbkkadTmdadhidnadciGglTmbaecufhvabcufhoadhiinaoaifavaifRbb86bbaicufhialcufglmbkkadcl6mdaec98fhlabc98fhvinavaifgecifalaifgdcifRbb86bbaecdfadcdfRbb86bbaecefadcefRbb86bbaeadRbb86bbaic98fgimbxikkavcl6mbdnavc98fglcd4cefcrGgdTmbavadcdt9RhvinaiaeydbBdbaeclfheaiclfhiadcufgdmbkkalc36mbinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaiaeydzBdzaiaeydCBdCaiaeydKBdKaiaeyd3Bd3aecafheaicafhiavc9Gfgvci0mbkkavTmbdndnavcrGgdmbavhlxekavc94GhlinaiaeRbb86bbaicefhiaecefheadcufgdmbkkavcw6mbinaiaeRbb86bbaiaeRbe86beaiaeRbd86bdaiaeRbi86biaiaeRbl86blaiaeRbv86bvaiaeRbo86boaiaeRbr86braicwfhiaecwfhealc94fglmbkkabkk9Tdbcjwk9ubbjZbbbbbbbbbbbbbbjZbbbbbbbbbbbbbbjZ86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;bc;uwkxebbbdbbb9GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(f){a=f.instance,a.exports.__wasm_call_ctors()});function r(f){for(var l=new Uint8Array(f.length),y=0;y<f.length;++y){var b=f.charCodeAt(y);l[y]=b>96?b-97:b>64?b-39:b+4}for(var g=0,y=0;y<f.length;++y)l[g++]=l[y]<60?e[l[y]]:(l[y]-60)*64+l[++y];return l.buffer.slice(0,g)}function n(f){if(!f)throw new Error("Assertion failed")}function i(f){return new Uint8Array(f.buffer,f.byteOffset,f.byteLength)}var o=48,c=16;function d(f,l){var y=f.meshlets[l*4+0],b=f.meshlets[l*4+1],g=f.meshlets[l*4+2],x=f.meshlets[l*4+3];return{vertices:f.vertices.subarray(y,y+g),triangles:f.triangles.subarray(b,b+x*3)}}function h(f,l,y,b,g,x,v){var T=a.exports.sbrk,I=a.exports.meshopt_buildMeshletsBound(f.length,g,x),S=T(I*c),R=T(I*g*4),_=T(I*x*3),A=T(f.byteLength),j=T(l.byteLength),L=new Uint8Array(a.exports.memory.buffer);L.set(i(f),A),L.set(i(l),j);var F=a.exports.meshopt_buildMeshlets(S,R,_,A,f.length,j,y,b,g,x,v);L=new Uint8Array(a.exports.memory.buffer);for(var K=L.subarray(S,S+F*c),W=new Uint32Array(K.buffer,K.byteOffset,K.byteLength/4).slice(),te=0;te<F;++te){var oe=W[te*4+0],Oe=W[te*4+1],y=W[te*4+2],de=W[te*4+3];a.exports.meshopt_optimizeMeshlet(R+oe*4,_+Oe,de,y)}var Pe=W[(F-1)*4+0],Ke=W[(F-1)*4+1],ve=W[(F-1)*4+2],$e=W[(F-1)*4+3],ze=Pe+ve,bt=Ke+($e*3+3&-4),aa={meshlets:W,vertices:new Uint32Array(L.buffer,R,ze).slice(),triangles:new Uint8Array(L.buffer,_,bt*3).slice(),meshletCount:F};return T(S-T(0)),aa}function u(f){var l=new Float32Array(a.exports.memory.buffer,f,o/4);return{centerX:l[0],centerY:l[1],centerZ:l[2],radius:l[3],coneApexX:l[4],coneApexY:l[5],coneApexZ:l[6],coneAxisX:l[7],coneAxisY:l[8],coneAxisZ:l[9],coneCutoff:l[10]}}function m(f,l,y,b){var g=a.exports.sbrk,x=[],v=g(l.byteLength),T=g(f.vertices.byteLength),I=g(f.triangles.byteLength),S=g(o),R=new Uint8Array(a.exports.memory.buffer);R.set(i(l),v),R.set(i(f.vertices),T),R.set(i(f.triangles),I);for(var _=0;_<f.meshletCount;++_){var A=f.meshlets[_*4+0],j=f.meshlets[_*4+0+1],L=f.meshlets[_*4+0+3];a.exports.meshopt_computeMeshletBounds(S,T+A*4,I+j,L,v,y,b),x.push(u(S))}return g(v-g(0)),x}function p(f,l,y,b){var g=a.exports.sbrk,x=g(o),v=g(f.byteLength),T=g(l.byteLength),I=new Uint8Array(a.exports.memory.buffer);I.set(i(f),v),I.set(i(l),T),a.exports.meshopt_computeClusterBounds(x,v,f.length,T,y,b);var S=u(x);return g(x-g(0)),S}return{ready:s,supported:!0,buildMeshlets:function(f,l,y,b,g,x){n(f.length%3==0),n(l instanceof Float32Array),n(l.length%y==0),n(y>=3),n(b<=256||b>0),n(g<=512),n(g%4==0),x=x||0;var v=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f);return h(v,l,l.length/y,y*4,b,g,x)},computeClusterBounds:function(f,l,y){n(f.length%3==0),n(f.length/3<=512),n(l instanceof Float32Array),n(l.length%y==0),n(y>=3);var b=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f);return p(b,l,l.length/y,y*4)},computeMeshletBounds:function(f,l,y){return n(f.meshletCount!=0),n(l instanceof Float32Array),n(l.length%y==0),n(y>=3),m(f,l,l.length/y,y*4)},extractMeshlet:function(f,l){return n(l>=0&&l<f.meshletCount),d(f,l)}}})();var Ab=new $i().registerExtensions([Jr,$r,Yr]).registerDependencies({"meshopt.decoder":Qr});async function Ra(t,e={}){await Qr.ready;let a;if(e.fetchBytes)a=new Uint8Array(await e.fetchBytes(t));else{let c=await fetch(t,{cache:e.fetchCache||"no-store"});if(!c.ok)throw new Error(`Failed to load ${t}: ${c.status}`);a=new Uint8Array(await c.arrayBuffer())}let s=await Ab.readBinary(a),r=[],n=e.componentFeatures||new Map,i=new Map;function o(c,d=""){let h=n.has(c.getName());h&&i.set(c.getName(),(i.get(c.getName())||0)+1);let u=h?c.getName():d,m=c.getMesh();if(m){let p=c.getWorldMatrix();for(let f of m.listPrimitives()){let l=f.getAttribute("POSITION"),y=f.getAttribute("NORMAL"),b=f.getAttribute("_FEATURE_ID_0"),g=f.getAttribute("_FEATURE_ID_1"),x=f.getIndices()?.getArray();if(!l||!x)continue;let v=l.getCount(),T=new Float32Array(v*3),I=new Float32Array(v*3),S=new Uint32Array(v),R=new Uint32Array(v),_=[1/0,1/0,1/0,-1/0,-1/0,-1/0],A=[],j=n.get(u)?.featureId||e.defaultFeatureId||0;for(let F=0;F<v;F+=1)l.getElement(F,A),_b(T,F*3,A,p),_[0]=Math.min(_[0],T[F*3]),_[1]=Math.min(_[1],T[F*3+1]),_[2]=Math.min(_[2],T[F*3+2]),_[3]=Math.max(_[3],T[F*3]),_[4]=Math.max(_[4],T[F*3+1]),_[5]=Math.max(_[5],T[F*3+2]),y?(y.getElement(F,A),Nb(I,F*3,A,p)):I.set([0,0,1],F*3),S[F]=Number(b?.getScalar(F)||0),R[F]=Number(g?g.getScalar(F)||0:j);let L=f.getMaterial();r.push({position:T,normal:I,netId:S,objectFeatureId:R,indices:x,designator:u,nodeName:c.getName(),meshName:m.getName(),bounds:_,material:L?{name:L.getName(),baseColor:L.getBaseColorFactor(),metallic:L.getMetallicFactor(),roughness:L.getRoughnessFactor(),emissive:L.getEmissiveFactor()}:{baseColor:e.baseColor||[.55,.58,.64,1],metallic:.05,roughness:.72,emissive:[0,0,0]}})}}for(let p of c.listChildren())o(p,u)}for(let c of s.getRoot().listScenes())for(let d of c.listChildren())o(d);return{byteLength:a.byteLength,primitives:r,componentNodeCounts:i}}function _b(t,e,a,s){let r=s[0]*a[0]+s[4]*a[1]+s[8]*a[2]+s[12],n=s[1]*a[0]+s[5]*a[1]+s[9]*a[2]+s[13],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2]+s[14];t[e]=r,t[e+1]=-i,t[e+2]=n}function Nb(t,e,a,s){let r=s[0]*a[0]+s[4]*a[1]+s[8]*a[2],n=s[1]*a[0]+s[5]*a[1]+s[9]*a[2],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2],o=Math.hypot(r,n,i)||1;t[e]=r/o,t[e+1]=-i/o,t[e+2]=n/o}var Aa=Object.freeze({mm:1,fineMm:.1,deg:15,fineDeg:1}),Zr=Object.freeze([[1,0,0],[0,1,0],[0,0,1]]);function To(t){return Math.round(t*1e9)/1e9+0}function Ot(t){let e=Math.hypot(...t.rotation)||1,a=t.rotation.map(r=>r/e),s=[a[3],a[0],a[1],a[2]].find(r=>Math.abs(r)>1e-12)??1;return{translationMm:t.translationMm.map(To),rotation:a.map(r=>To(s<0?-r:r))}}function Cb(t){let[e,a,s,r]=t.rotation,[n,i,o]=t.translationMm;return[1-2*(a*a+s*s),2*(e*a+s*r),2*(e*s-a*r),0,2*(e*a-s*r),1-2*(e*e+s*s),2*(a*s+e*r),0,2*(e*s+a*r),2*(a*s-e*r),1-2*(e*e+a*a),0,n,i,o,1]}function ko(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Fb(t){let e=[t[0],t[4],t[8],0,t[1],t[5],t[9],0,t[2],t[6],t[10],0,0,0,0,1];for(let a=0;a<3;a+=1)e[12+a]=-(e[a]*t[12]+e[4+a]*t[13]+e[8+a]*t[14]);return e}function en(t,e){return e>0?Math.round(t/e)*e:t}function Io(t,e){let a=e[0]**2+e[1]**2;return a<1e-9?0:(t[0]*e[0]+t[1]*e[1])/a}function So(t,e,a){let s=Math.atan2(e[1]-t[1],e[0]-t[0]),n=Math.atan2(a[1]-t[1],a[0]-t[0])-s;for(;n>Math.PI;)n-=2*Math.PI;for(;n<-Math.PI;)n+=2*Math.PI;return n}function Ro(t,e,a){return xa(t,e)>=0?-a:a}function Ao(t){return Zr.map(e=>Ar(t.rotation,e))}function _o(t,e,a){return{translationMm:t.translationMm.map((s,r)=>s+e[r]*a),rotation:[...t.rotation]}}function No(t,e,a,s){let r=ai(e,a),n=t.translationMm.map((o,c)=>o-s[c]);return{translationMm:Ar(r,n).map((o,c)=>o+s[c]),rotation:Za(r,t.rotation)}}function Co(t,e){if(e==null)return null;let a=`/${String(e).split("/")[1]||""}`;return(t?.occurrences||[]).find(s=>s.path===a&&s.depth===1)??null}function Fo(t,e,a){let s=t.occurrences.find(o=>o.path===e);if(!s||s.depth!==1)return t;let r=Cb(a),n=ko(r,Fb(s.worldMatrix)),i=`${e}/`;return{...t,occurrences:t.occurrences.map(o=>o.path===e?{...o,pose:{...Ot(a),source:"manual"},worldMatrix:r}:o.path.startsWith(i)?{...o,worldMatrix:ko(n,o.worldMatrix)}:o)}}function Bo(t){let e=Math.abs(t[0])<.9?[1,0,0]:[0,1,0];return it(pt(t,e))}var Bb=Object.freeze([0,1,1,0]),Ms=48,_a=`
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
`,Xt=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);function jb(t){let e=t?.matrix??t;if(!e||typeof e.length!="number"||e.length!==16)throw new TypeError("An occurrence matrix must have 16 numbers (column-major)");let a=Array.from(e,Number);if(!a.every(Number.isFinite))throw new TypeError("An occurrence matrix must be finite");if(a[3]!==0||a[7]!==0||a[11]!==0||a[15]!==1)throw new TypeError("An occurrence matrix must be affine (last row 0 0 0 1)");return a}function Ob(t){let[e,a,s,,r,n,i,,o,c,d]=t,h=n*d-c*i,u=c*s-a*d,m=a*i-n*s,p=o*i-r*d,f=e*d-o*s,l=r*s-e*i,y=r*c-o*n,b=o*a-e*c,g=e*n-r*a,x=e*h+r*u+o*m;if(x===0)throw new TypeError("An occurrence matrix must be invertible");let v=x<0?-1:1;return[v*h,v*p,v*y,0,v*u,v*f,v*b,0,v*m,v*l,v*g,0,0,0,0,1]}function Pb(t){let e=new Uint32Array(4);for(let a of t||[]){let s=Number(a);!Number.isInteger(s)||s<0||s>=128||(e[s>>>5]|=1<<(s&31)>>>0)}return e}function Es(t,e=[],a=[]){let s=new Float32Array(Math.max(1,t.length)*40),r=new Uint32Array(s.buffer);return t.forEach((n,i)=>{let o=i*40;s.set(n,o),s.set(Ob(n),o+16),e[i]&&r.set(Pb(e[i]),o+32),s.set(a[i]||Bb,o+36)}),s}function jo(t){let e=new ArrayBuffer(Math.max(1,t.length)*Ms),a=new DataView(e);return t.forEach((s,r)=>{let n=r*Ms;a.setFloat32(n,s.centerMm[0]/1e3,!0),a.setFloat32(n+4,-s.centerMm[1]/1e3,!0),a.setFloat32(n+8,Math.min(s.drillWidthMm,s.drillHeightMm)/2e3,!0),a.setFloat32(n+12,Math.max(s.outerWidthMm,s.outerHeightMm)/2e3,!0),a.setFloat32(n+16,s.startZMm/1e3,!0),a.setFloat32(n+20,s.endZMm/1e3,!0),a.setUint32(n+32,s.netId||0,!0),a.setUint32(n+36,s.objectFeatureId||0,!0),a.setUint32(n+40,s.startLayerId||0,!0),a.setUint32(n+44,s.endLayerId||0,!0)}),e}function Ts(t,e){let[a,s,r]=e;return[t[0]*a+t[4]*s+t[8]*r+t[12],t[1]*a+t[5]*s+t[9]*r+t[13],t[2]*a+t[6]*s+t[10]*r+t[14]]}function ia(t,e){if(!e)return null;let a=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let s=0;s<8;s+=1){let r=Ts(t,[e[s&1?3:0],e[s&2?4:1],e[s&4?5:2]]);for(let n=0;n<3;n+=1)a[n]=Math.min(a[n],r[n]),a[n+3]=Math.max(a[n+3],r[n])}return a}function ks(t){return t.every((e,a)=>e===Xt[a])}var Db=0,Lb=4294901759;function Oo(t,e){let a=t>>>0,s=e>>>0;return a===Db?{kind:"none",occurrenceIndex:-1,featureId:0}:{kind:s?"feature":"board",occurrenceIndex:a-1,featureId:s}}function Po(t){let e=Array.from(t);if(e.length>Lb)throw new RangeError("Too many occurrences for the pick target");let a=e.map(jb),s=o=>o&&!Array.isArray(o)&&!ArrayBuffer.isView(o),r=e.map((o,c)=>s(o)&&o.key!=null?String(o.key):String(c));if(new Set(r).size!==r.length)throw new TypeError("Occurrence keys must be unique");let n=e.map(o=>s(o)&&o.hiddenLayers?[...o.hiddenLayers].map(Number):[]),i=e.map(o=>s(o)&&o.explode?[...o.explode].map(Number):null);return{matrices:a,keys:r,hiddenLayers:n,explode:i}}function Na(t,e,a){let[s,r,n]=e,i=t[0]*s+t[4]*r+t[8]*n+t[12],o=t[1]*s+t[5]*r+t[9]*n+t[13],c=t[2]*s+t[6]*r+t[10]*n+t[14],d=t[3]*s+t[7]*r+t[11]*n+t[15];return!(d>0)||c<0||c>d?null:{x:a.x+(i/d*.5+.5)*a.width,y:a.y+(.5-o/d*.5)*a.height}}var Do=0;var Lo=3,tn=4,mw=Object.freeze(["full","board","body","box"]),qe=Object.freeze({fullPx:140,boardPx:70,boxPx:18,keep:.8});function oa(t={}){let e=(i,o)=>Number.isFinite(Number(t[i]))?Math.max(0,Number(t[i])):o,a=e("boxPx",qe.boxPx),s=Math.max(a,e("boardPx",qe.boardPx)),r=Math.max(s,e("fullPx",qe.fullPx)),n=Math.min(1,Math.max(.05,e("keep",qe.keep)));return{fullPx:r,boardPx:s,boxPx:a,keep:n}}function Uo(t){let e=c=>[t[c],t[4+c],t[8+c],t[12+c]],[a,s,r,n]=[e(0),e(1),e(2),e(3)],i=(c,d)=>c.map((h,u)=>h+d[u]),o=(c,d)=>c.map((h,u)=>h-d[u]);return[i(n,a),o(n,a),i(n,s),o(n,s),r,o(n,r)]}var an=`
fn featureHidden(id: u32) -> bool {
  return id < arrayLength(&hiddenMask) && hiddenMask[id] == 0u;
}
`;function Is(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function Go(t,e=0){let a=0;for(let n of Is(t))a=Math.max(a,n);let s=64,r=a+1;for(;s<r;)s*=2;return Math.max(s,Math.floor(e)||0)}function Ko(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(1);for(let r of Is(t))r<a&&(s[r]=0);return s}var zo=40,et=256,Vo=112,Pt="rg32uint",ca=et/4,zb=256,Vb={compare:"always",passOp:"zero"},Hb={compare:"always",passOp:"replace"},qb={compare:"not-equal",passOp:"keep"},Xb={compare:"equal",passOp:"keep"},Wo=`
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
${an}
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
@group(0) @binding(3) var<storage, read> hiddenMask: array<u32>;
@group(0) @binding(4) var<storage, read> netMask: array<u32>;
${an}
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
`;function sn(t,e){return e.reduce((a,[s,r])=>{if(a.split(s).length!==2)throw new Error(`Shader variant anchor not found once: ${s.slice(0,60)}`);return a.replace(s,()=>r)},t)}var rn=[`  padding0: u32,
  padding1: u32,`,`  selectedOccurrence: u32,
  occurrenceBase: u32,`],Rs=[["  padding2: u32,","  emphasisStride: u32,"],["fn netEmphasized(id: u32) -> bool {",`${xi}fn netEmphasized(id: u32) -> bool {`]],Qo="  let lit = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",Zo=`  let lit = emphasisOf(input.occurrence, input.netId) != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`,ec=sn(Wo,[rn,[`  @location(3) world: vec3f,
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
  let selectedComponent = here && component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;`],...Rs,["      base = vec3f(0.08, 1.0, 0.2) * pulse;","      base = emphasisColor(mark, vec3f(0.08, 1.0, 0.2)) * pulse;"],["  var alpha = draw.flags.y;","  var alpha = draw.flags.y * input.fade;"]]),tc=sn(Jo,[rn,[`  @location(0) @interpolate(flat) objectId: u32,
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
  return vec2u(input.occurrence, select(input.objectId, 0u, kind == 0u));`],...Rs,[Qo,Zo]]),Wb=`struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
  @location(3) dimensions: vec4f,
  @location(4) span: vec2f,
  @location(5) ids: vec4u,
};`,Jb=`struct Barrel {
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
};`;function ac(t,e,a=[]){return sn(t,[rn,[`@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
`,""],[Wb,Jb],["@vertex fn vs(input: Input) -> Output {",`struct Record {
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
  output.occurrence = index + 1u + globals.occurrenceBase;`],...a])}var sc=ac($o,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.normal = input.normal;`,[[`  let z0 = input.span.x + layerOffsets[input.ids.z];
  let z1 = input.span.y + layerOffsets[input.ids.w];`,`  let z0 = input.span.x + layerOffsets[input.ids.z] * spread;
  let z1 = input.span.y + layerOffsets[input.ids.w] * spread;`],[`  output.normal = input.normal;
  output.netId`,`  output.normal = (occurrence.normal * vec4f(input.normal, 0.0)).xyz;
  output.netId`],[`  @location(3) @interpolate(flat) visible: u32,
};`,`  @location(3) @interpolate(flat) visible: u32,
  @location(4) @interpolate(flat) occurrence: u32,
};`],["  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",`  let mark = emphasisOf(input.occurrence, input.netId);
  let selected = mark != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`],...Rs,["      base = vec3f(0.1, 1.0, 0.22) * (","      base = emphasisColor(mark, vec3f(0.1, 1.0, 0.22)) * ("]]),rc=ac(Yo,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.objectId`,[["mix(input.span.x + layerOffsets[input.ids.z], input.span.y + layerOffsets[input.ids.w], input.unit.z)","mix(input.span.x + layerOffsets[input.ids.z] * spread, input.span.y + layerOffsets[input.ids.w] * spread, input.unit.z)"],[`  @location(1) @interpolate(flat) visible: u32,
};`,`  @location(1) @interpolate(flat) visible: u32,
  @location(2) @interpolate(flat) occurrence: u32,
};`],["  return vec2u(1u, input.objectId);","  return vec2u(input.occurrence, input.objectId);"],...Rs,[Qo,Zo]]),nc=`
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
`,ic=`${nc}
@fragment fn fs(input: Output) -> @location(0) vec4f {
  let light = normalize(globals.lightDirection.xyz);
  return vec4f(draw.color.rgb * (0.45 + max(dot(normalize(input.normal), light), 0.0) * 0.55), 1.0);
}
`,oc=`${nc}
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
`,Ho=[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}],Ew=Object.freeze({main:ec,pick:tc,barrel:sc,barrelPick:rc,box:ic,boxPick:oc,cull:cc}),Wt=class t{static async create(e){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)throw new Error("No WebGPU adapter is available");let s=a.features.has("depth32float-stencil8"),r=await a.requestDevice(s?{requiredFeatures:["depth32float-stencil8"]}:void 0);return new t(e,r,{stencil:s})}constructor(e,a,{shareFrom:s=null,stencil:r=!1}={}){if(this.canvas=e,this.device=a,this.shareFrom=s,this.stencil=s?s.stencil:!!r,this.depthFormat=this.stencil?"depth32float-stencil8":"depth32float",this.version=0,this.barrelColor=[.55,.35,.16,.78],this.alwaysInstanced=!!s,this.occurrenceBase=0,s?(this.context=s.context,this.format=s.format):(a.addEventListener("uncapturederror",n=>{console.error(`Uncaptured WebGPU error: ${n.error?.message||n.error}`)}),a.lost.then(n=>{n.reason!=="destroyed"&&console.error(`WebGPU device lost: ${n.reason}`,n.message)}),this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"})),this.entries=[],this.barrels=null,this.drawSlotCapacity=zb,this.drawSlotBuffer=this.createDrawSlotBuffer(this.drawSlotCapacity),this.drawStaging=new Float32Array(this.drawSlotCapacity*ca),this.freeDrawSlots=[],this.nextDrawSlot=0,this.globalBuffer=a.createBuffer({size:Vo,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.layerOffsetBuffer=a.createBuffer({size:1024,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.occurrenceMatrices=[[...Xt]],this.occurrenceKeys=["0"],this.occurrenceHiddenLayers=[[]],this.occurrenceExplode=[null],this.identityOnly=!0,this.occurrenceCapacity=1,this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.device.queue.writeBuffer(this.occurrenceBuffer,0,Es(this.occurrenceMatrices)),this.barrelRecordBuffer=a.createBuffer({label:"barrel-records",size:Ms,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.instancedPipelines=null,this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.slotCapacity=0,this.slotArgs=new Uint32Array(0),this.slotClasses=new Uint32Array(0),this.freeSlots=[],this.nextSlot=2,this.argsBuffer=null,this.classesBuffer=null,this.growSlots(256),this.setSlot(0,0,4),this.setSlot(1,0,4),this.cull=null,this.box=null,this.boardBounds=null,this.selectedOccurrence=-1,this.lodOverride=null,this.lodThresholds={...qe},this.innerCopperAtFull=!0,this.cullCounts={full:0,board:0,body:0,box:0,culled:0},this.frameStats={triangles:0,draws:0},this.boxColor=[.24,.36,.28,1],s)for(let n of["bindGroupLayout","pipelineLayout","vertexBuffers","pipeline","pickPipeline","barrelPipeline","barrelPickPipeline","singlePipelines"])this[n]=s[n];else this.createSinglePipelines();this.depth=null,this.pickTexture=null,this.pickSerial=Promise.resolve(),this.bundleCache=new Map,this.globalScratch=new ArrayBuffer(Vo),this.globalScratchF32=new Float32Array(this.globalScratch),this.globalScratchView=new DataView(this.globalScratch),this.barrelDrawScratch=new Float32Array(et/4),this.nextEntryId=1,this.hiddenFeatureIds=new Set,this.showPlaceholders=!0,this.featureMaskCapacity=64,this.featureMaskBuffer=this.createFeatureMaskBuffer(this.featureMaskCapacity),this.uploadFeatureMask(),this.emphasizedNetIds=new Set,this.occurrenceEmphasis=null,this.emphasisStride=0,this.dimCopper=!1,this.netMaskCapacity=64,this.netMaskBuffer=this.createNetMaskBuffer(this.netMaskCapacity),this.uploadNetMask(),s&&this.setOccurrences([])}createSinglePipelines(){let e=this.device;this.bindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:5,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:6,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:7,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]});let a=e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]});this.pipelineLayout=a;let s=this.vertexBuffers=[{arrayStride:zo,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"uint32"},{shaderLocation:3,offset:28,format:"uint32"},{shaderLocation:4,offset:32,format:"uint32"},{shaderLocation:5,offset:36,format:"uint32"}]}];this.singlePipelines={...this.makeMainPipelines(Wo,""),pick:this.makePipeline(a,Jo,Pt,s,"pick"),barrel:this.makeBarrelPipeline(a,$o,this.format,"barrel"),barrelPick:this.makeBarrelPipeline(a,Yo,Pt,"barrel-pick")},this.pipeline=this.singlePipelines.main,this.pickPipeline=this.singlePipelines.pick,this.barrelPipeline=this.singlePipelines.barrel,this.barrelPickPipeline=this.singlePipelines.barrelPick}makeMainPipelines(e,a){let s=this.pipelineLayout,r=this.vertexBuffers,n=(c,d)=>this.makePipeline(s,e,this.format,r,`${c}${a}`,d),i=n("main",{stencil:Vb}),o=n("main-blend");return{main:i,mark:this.stencil?n("main-mark",{stencil:Hb}):i,blend:o,mask:this.stencil?n("mask",{stencil:qb}):o,maskCovered:this.stencil?n("mask-covered",{stencil:Xb,constants:{COVERED:1}}):null}}createOccurrenceBuffer(e){return this.device.createBuffer({label:"occurrences",size:e*160,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createListBuffer(e){return this.device.createBuffer({label:"visible-occurrences",size:e*4*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}growSlots(e){let a=new Uint32Array(e*5);a.set(this.slotArgs);let s=new Uint32Array(e).fill(4);s.set(this.slotClasses),this.slotArgs=a,this.slotClasses=s,this.slotCapacity=e,this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.(),this.argsBuffer=this.device.createBuffer({label:"indirect-args",size:a.byteLength,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.classesBuffer=this.device.createBuffer({label:"draw-classes",size:s.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.argsBuffer,0,a),this.device.queue.writeBuffer(this.classesBuffer,0,s),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache?.clear()}setSlot(e,a,s){this.slotArgs.fill(0,e*5,e*5+5),this.slotArgs[e*5]=a,this.slotClasses[e]=s,this.device.queue.writeBuffer(this.argsBuffer,e*20,this.slotArgs,e*5,5),this.device.queue.writeBuffer(this.classesBuffer,e*4,this.slotClasses,e,1)}allocSlot(e,a){let s=this.freeSlots.length?this.freeSlots.pop():this.nextSlot++;return s>=this.slotCapacity&&this.growSlots(this.slotCapacity*2),this.setSlot(s,e,a),s}get occurrenceCount(){return this.occurrenceMatrices.length}setOccurrences(e){let{matrices:a,keys:s,hiddenLayers:r,explode:n}=Po(e??[Xt]);this.occurrenceMatrices=a,this.occurrenceKeys=s,this.occurrenceHiddenLayers=r,this.occurrenceExplode=n,this.identityOnly=!this.alwaysInstanced&&a.length===1&&ks(a[0]),this.identityOnly||this.ensureInstancedPipelines(),a.length>this.occurrenceCapacity&&(this.occurrenceBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.occurrenceCapacity=Math.max(a.length,this.occurrenceCapacity*2),this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.cull&&(this.cull.lods.destroy(),this.cull.lods=this.createLodBuffer(this.occurrenceCapacity)),this.rebindAll()),a.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,Es(a,r,n)),this.cull&&this.device.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(tn)),this.selectedOccurrence>=a.length&&(this.selectedOccurrence=-1),this.bundleCache.clear(),this.invalidate()}setOccurrenceHiddenLayers(e){this.occurrenceHiddenLayers=this.occurrenceMatrices.map((a,s)=>[...e?.[s]||[]].map(Number)),this.writeOccurrenceRecords()}setOccurrenceExplode(e){this.occurrenceExplode=this.occurrenceMatrices.map((a,s)=>e?.[s]?[...e[s]].map(Number):null),this.writeOccurrenceRecords()}writeOccurrenceRecords(){this.occurrenceMatrices.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,Es(this.occurrenceMatrices,this.occurrenceHiddenLayers,this.occurrenceExplode)),this.invalidate()}setInnerCopperAtFull(e){if(this.innerCopperAtFull!==e){this.innerCopperAtFull=e;for(let a of this.entries)a.innerCopper&&(a.drawClass=qo(a,e),this.setSlot(a.slot,a.indexCount,a.drawClass));this.invalidate()}}setBoardBounds(e){this.boardBounds=e?[...e]:null,this.invalidate()}setLodThresholds(e){this.lodThresholds=oa({...this.lodThresholds,...e}),this.invalidate()}setLodOverride(e){this.lodOverride=e==null?null:Number(e),this.invalidate()}createLodBuffer(e){return this.device.createBuffer({label:"occurrence-lods",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createCull(){let e=this.device,a=this.shareFrom?.cull,s=i=>({visibility:GPUShaderStage.COMPUTE,buffer:{type:i}}),r=a?.layout||e.createBindGroupLayout({label:"cull",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,...s("read-only-storage")},{binding:2,...s("storage")},{binding:3,...s("storage")},{binding:4,...s("storage")},{binding:5,...s("storage")},{binding:6,...s("read-only-storage")}]}),n=a&&{layout:r,classify:a.classify,writeArgs:a.writeArgs};if(!n){let i=this.createShaderModule(cc,"cull"),o=e.createPipelineLayout({bindGroupLayouts:[r]});n={layout:r,classify:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"classify"}}),writeArgs:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"writeArgs"}})}}this.cull={...n,uniform:e.createBuffer({label:"cull-params",size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),lods:this.createLodBuffer(this.occurrenceCapacity),counters:e.createBuffer({label:"cull-counters",size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),readback:e.createBuffer({label:"cull-readback",size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),scratch:new ArrayBuffer(192),reading:!1,readAt:0,bindGroup:null},e.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(tn)),this.cull.bindGroup=this.makeCullBindGroup()}makeCullBindGroup(){return this.device.createBindGroup({layout:this.cull.layout,entries:[{binding:0,resource:{buffer:this.cull.uniform}},{binding:1,resource:{buffer:this.occurrenceBuffer}},{binding:2,resource:{buffer:this.cull.lods}},{binding:3,resource:{buffer:this.listBuffer}},{binding:4,resource:{buffer:this.cull.counters}},{binding:5,resource:{buffer:this.argsBuffer}},{binding:6,resource:{buffer:this.classesBuffer}}]})}createBox(){let e=[[[1,0,0],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[[-1,0,0],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],[[0,1,0],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[[0,0,1],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],[[0,0,-1],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]],a=[],s=[];e.forEach(([d,h],u)=>{for(let p of h)a.push(...p,...d);let m=u*4;s.push(m,m+1,m+2,m,m+2,m+3)});let r=new Float32Array(a),n=new Uint16Array(s),i=this.device.createBuffer({label:"box-vertices",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),o=this.device.createBuffer({label:"box-indices",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(i,0,r),this.device.queue.writeBuffer(o,0,n);let c=this.device.createBuffer({size:et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.box={vertexBuffer:i,indexBuffer:o,indexCount:n.length,drawBuffer:c,bindGroup:this.makeBindGroup(c),scratch:new Float32Array(et/4)},this.setSlot(1,n.length,3)}writeBoxDraw(){let e=this.box.scratch,[a,s,r,n,i,o]=this.boardBounds;e.fill(0),e.set(this.boxColor,0),e.set([n-a,i-s,o-r,0],4),e.set([a,s,r,0],8),this.device.queue.writeBuffer(this.box.drawBuffer,0,e)}encodeCull(e,a){let s=this.cull,r=new Float32Array(s.scratch),n=new Uint32Array(s.scratch);r.fill(0),Uo(a.matrix).forEach((l,y)=>r.set(l,y*4));let i=a.lod;i&&r.set([...i.eye,i.orthographic?0:1],24);let o=this.boardBounds||[-1e6,-1e6,-1e6,1e6,1e6,1e6];r.set([o[0],o[1],o[2],0,o[3],o[4],o[5],0],28);let{fullPx:c,boardPx:d,boxPx:h,keep:u}=this.lodThresholds;r.set([i?.pixelScale||0,c,h,u],36);let m=this.lodOverride!=null?this.lodOverride+1:!i||!this.boardBounds?Do+1:0;n.set([this.occurrenceMatrices.length,this.selectedOccurrence+1,m,this.nextSlot],40),n[44]=this.barrels?.instanceCount||0,r[45]=d,this.device.queue.writeBuffer(s.uniform,0,s.scratch),e.clearBuffer(s.counters);let p=e.beginComputePass({label:"cull"});p.setBindGroup(0,s.bindGroup),p.setPipeline(s.classify),p.dispatchWorkgroups(Math.ceil(this.occurrenceMatrices.length/64)),p.setPipeline(s.writeArgs),p.dispatchWorkgroups(Math.ceil(this.nextSlot/64)),p.end();let f=performance.now();return!s.reading&&f-s.readAt>250?(e.copyBufferToBuffer(s.counters,0,s.readback,0,16),s.readAt=f,!0):!1}readCullCounts(){let e=this.cull;e.reading=!0;let a=this.occurrenceMatrices.length;e.readback.mapAsync(GPUMapMode.READ).then(()=>{let[s,r,n,i]=new Uint32Array(e.readback.getMappedRange().slice(0));e.readback.unmap(),this.cullCounts={full:s,board:r-s,body:n-r,box:i,culled:Math.max(0,a-n-i)}}).catch(()=>{}).finally(()=>{e.reading=!1})}countFor(e){if(this.identityOnly)return e===2?this.barrels?.instanceCount||0:e===3?0:1;let{full:a,board:s,body:r,box:n}=this.cullCounts;return e===5?a+s+r:e===0?a+s:e===1?a:e===2?(a+s)*(this.barrels?.instanceCount||0):n}gpuMemoryBytes(){let e=0;for(let a of this.entries)e+=(a.vertexBuffer?.size||0)+(a.indexBuffer?.size||0);for(let a of[this.barrels?.vertexBuffer,this.barrels?.indexBuffer,this.barrels?.instanceBuffer,this.barrelRecordBuffer,this.occurrenceBuffer,this.listBuffer,this.argsBuffer,this.classesBuffer,this.featureMaskBuffer,this.netMaskBuffer,this.cull?.lods])e+=a?.size||0;return e+=this.canvas.width*this.canvas.height*12,e}ensureInstancedPipelines(){if(this.instancedPipelines)return;if(this.shareFrom){this.shareFrom.ensureInstancedPipelines(),this.instancedPipelines=this.shareFrom.instancedPipelines,this.createBox(),this.createCull();return}let e=this.pipelineLayout;this.instancedPipelines={...this.makeMainPipelines(ec,"-instanced"),pick:this.makePipeline(e,tc,Pt,this.vertexBuffers,"pick-instanced"),barrel:this.makeBarrelPipeline(e,sc,this.format,"barrel-instanced",!1),barrelPick:this.makeBarrelPipeline(e,rc,Pt,"barrel-pick-instanced",!1),box:this.makePipeline(e,ic,this.format,Ho,"box"),boxPick:this.makePipeline(e,oc,Pt,Ho,"box-pick")},this.createBox(),this.createCull()}drawSet(){return this.identityOnly?{pipelines:this.singlePipelines,indirect:!1,barrelInstances:this.barrels?.instanceCount||0}:{pipelines:this.instancedPipelines,indirect:!0,barrelInstances:0}}drawEntry(e,a,s){e.setBindGroup(0,a.bindGroup),e.setVertexBuffer(0,a.vertexBuffer),e.setIndexBuffer(a.indexBuffer,"uint32"),s?e.drawIndexedIndirect(this.argsBuffer,a.slot*20):e.drawIndexed(a.indexCount)}drawBarrels(e,a,s,r){e.setPipeline(a),e.setBindGroup(0,this.barrels.bindGroup),e.setVertexBuffer(0,this.barrels.vertexBuffer),e.setVertexBuffer(1,this.barrels.instanceBuffer),e.setIndexBuffer(this.barrels.indexBuffer,"uint16"),s?e.drawIndexedIndirect(this.argsBuffer,0):e.drawIndexed(this.barrels.indexCount,r)}drawBox(e,a){!this.box||!this.boardBounds||(this.writeBoxDraw(),e.setPipeline(a),e.setBindGroup(0,this.box.bindGroup),e.setVertexBuffer(0,this.box.vertexBuffer),e.setIndexBuffer(this.box.indexBuffer,"uint16"),e.drawIndexedIndirect(this.argsBuffer,20))}createNetMaskBuffer(e){return this.device.createBuffer({label:"net-emphasis-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}uploadNetMask(){let e;if(this.occurrenceEmphasis&&!this.identityOnly){let s=vi(this.occurrenceEmphasis);this.emphasisStride=s.stride,e=s.data}else this.emphasisStride=0,e=mi(this.emphasizedNetIds,this.netMaskCapacity);if(e.length>this.netMaskCapacity){this.netMaskBuffer?.destroy?.();let s=this.netMaskCapacity;for(;s<e.length;)s*=2;this.netMaskCapacity=s,this.netMaskBuffer=this.createNetMaskBuffer(s),this.rebindAll()}let a=new Uint32Array(this.netMaskCapacity);a.set(e),this.device.queue.writeBuffer(this.netMaskBuffer,0,a)}setOccurrenceEmphasis(e,{dimCopper:a=!1}={}){let s=Array.isArray(e)&&e.some(r=>r&&r.size);this.occurrenceEmphasis=s?e.map(r=>r&&r.size?new Map(r):null):null,this.dimCopper=!!a,this.uploadNetMask(),this.invalidate()}get netHighlightActive(){return!!(this.emphasizedNetIds.size||this.occurrenceEmphasis||this.dimCopper)}setEmphasizedNetIds(e){this.emphasizedNetIds=is(e),this.occurrenceEmphasis=null;let a=gi(this.emphasizedNetIds,this.netMaskCapacity);a!==this.netMaskCapacity&&(this.netMaskBuffer?.destroy?.(),this.netMaskCapacity=a,this.netMaskBuffer=this.createNetMaskBuffer(a),this.rebindAll()),this.uploadNetMask(),this.invalidate()}rebindAll(){for(let e of this.entries)e.bindGroup=this.makeBindGroup(this.drawSlotBuffer,e.drawSlot*et);this.barrels&&(this.barrels.bindGroup=this.makeBindGroup(this.barrels.drawBuffer)),this.box&&(this.box.bindGroup=this.makeBindGroup(this.box.drawBuffer)),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache.clear()}createFeatureMaskBuffer(e){return this.device.createBuffer({label:"feature-visibility-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createDrawSlotBuffer(e){return this.device.createBuffer({label:"draw-uniforms",size:e*et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}allocateDrawSlot(){if(this.freeDrawSlots.length)return this.freeDrawSlots.pop();if(this.nextDrawSlot>=this.drawSlotCapacity){let e=this.drawSlotCapacity*2,a=new Float32Array(e*ca);a.set(this.drawStaging),this.drawSlotBuffer.destroy?.(),this.drawSlotCapacity=e,this.drawSlotBuffer=this.createDrawSlotBuffer(e),this.drawStaging=a,this.rebindAll()}return this.nextDrawSlot++}flushDraws(e){if(!e.length)return;let a=1/0,s=-1;for(let r of e)a=Math.min(a,r.drawSlot),s=Math.max(s,r.drawSlot);this.device.queue.writeBuffer(this.drawSlotBuffer,a*et,this.drawStaging,a*ca,(s-a+1)*ca)}invalidate(){this.version+=1}setBarrelColor(e){this.barrelColor=[...e],this.invalidate()}makeBindGroup(e,a=0){return this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e,offset:a,size:et}},{binding:2,resource:{buffer:this.layerOffsetBuffer}},{binding:3,resource:{buffer:this.featureMaskBuffer}},{binding:4,resource:{buffer:this.netMaskBuffer}},{binding:5,resource:{buffer:this.occurrenceBuffer}},{binding:6,resource:{buffer:this.barrelRecordBuffer}},{binding:7,resource:{buffer:this.listBuffer}}]})}uploadFeatureMask(){let e=Ko(this.hiddenFeatureIds,this.featureMaskCapacity);this.device.queue.writeBuffer(this.featureMaskBuffer,0,e)}setHiddenFeatureIds(e){this.hiddenFeatureIds=Is(e);let a=Go(this.hiddenFeatureIds,this.featureMaskCapacity);a!==this.featureMaskCapacity&&(this.featureMaskBuffer?.destroy?.(),this.featureMaskCapacity=a,this.featureMaskBuffer=this.createFeatureMaskBuffer(a),this.rebindAll()),this.uploadFeatureMask(),this.bundleCache.clear(),this.invalidate()}depthStencilState(e=null){let a={format:this.depthFormat,depthWriteEnabled:!0,depthCompare:"greater"};return this.stencil&&e&&(a.stencilFront=e,a.stencilBack=e),a}makePipeline(e,a,s,r,n,i={}){let o=this.createShaderModule(a,n);return this.device.createRenderPipeline({layout:e,vertex:{module:o,entryPoint:"vs",buffers:r},fragment:{module:o,entryPoint:"fs",...i.constants?{constants:i.constants}:{},targets:[{format:s,blend:s===Pt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState(i.stencil),multisample:{count:1}})}makeBarrelPipeline(e,a,s,r,n=!0){let i=this.createShaderModule(a,r);return this.device.createRenderPipeline({layout:e,vertex:{module:i,entryPoint:"vs",buffers:[{arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32"}]},...n?[{arrayStride:40,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"float32x4"},{shaderLocation:4,offset:16,format:"float32x2"},{shaderLocation:5,offset:24,format:"uint32x4"}]}]:[]]},fragment:{module:i,entryPoint:"fs",targets:[{format:s,blend:s===Pt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState()})}createShaderModule(e,a){let s=this.device.createShaderModule({label:`pcb-${a}`,code:e});return typeof s.getCompilationInfo=="function"&&s.getCompilationInfo().then(r=>{let n=[...r.messages||[]];if(n.length){console.groupCollapsed(`WebGPU shader compilation info: pcb-${a}`);for(let i of n)console[i.type==="error"?"error":"warn"](`${i.type} ${i.lineNum}:${i.linePos} ${i.message}`);console.groupEnd()}}),s}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));this.canvas.width===a&&this.canvas.height===s||(this.canvas.width=a,this.canvas.height=s,this.depth?.destroy(),this.pickTexture?.destroy(),this.depth=this.device.createTexture({size:[a,s],format:this.depthFormat,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.pickTexture=this.device.createTexture({size:[a,s],format:Pt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}))}addPrimitive(e,a){let s=e.position.length/3,r=new ArrayBuffer(s*zo),n=new Float32Array(r),i=new Uint32Array(r);for(let f=0;f<s;f+=1){let l=f*10,y=f*3;n[l]=e.position[y],n[l+1]=e.position[y+1],n[l+2]=e.position[y+2],n[l+3]=e.normal[y],n[l+4]=e.normal[y+1],n[l+5]=e.normal[y+2],i[l+6]=e.netId[f]||0,i[l+7]=e.objectFeatureId[f]||0,i[l+8]=a.layerId||0,i[l+9]=a.materialId||0}let o=this.device.createBuffer({size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(o,0,r);let c=e.indices instanceof Uint32Array?e.indices:new Uint32Array(e.indices),d=this.device.createBuffer({size:c.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,c);let h=this.allocateDrawSlot(),u=this.makeBindGroup(this.drawSlotBuffer,h*et),m=qo(a,this.innerCopperAtFull),p={...a,drawClass:m,slot:this.allocSlot(c.length,m),bounds:e.bounds||a.bounds||null,id:this.nextEntryId++,vertexBuffer:o,indexBuffer:d,indexCount:c.length,drawSlot:h,bindGroup:u};return this.entries.push(p),this.bundleCache.clear(),this.invalidate(),p}removeEntries(e){if(!e?.length)return;let a=new Set(e.map(s=>s.id));for(let s of e)s.vertexBuffer?.destroy?.(),s.indexBuffer?.destroy?.(),this.freeDrawSlots.push(s.drawSlot),s.slot!=null&&(this.setSlot(s.slot,0,4),this.freeSlots.push(s.slot));this.entries=this.entries.filter(s=>!a.has(s.id)),this.bundleCache.clear(),this.invalidate()}dispose(){this.removeEntries(this.entries),this.barrels&&(this.barrels.vertexBuffer?.destroy?.(),this.barrels.indexBuffer?.destroy?.(),this.barrels.instanceBuffer?.destroy?.(),this.barrels.drawBuffer?.destroy?.(),this.barrels=null),this.depth?.destroy(),this.pickTexture?.destroy(),this.featureMaskBuffer?.destroy?.(),this.occurrenceBuffer?.destroy?.(),this.barrelRecordBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.();for(let e of[this.box?.vertexBuffer,this.box?.indexBuffer,this.box?.drawBuffer,this.cull?.uniform,this.cull?.lods,this.cull?.counters,this.cull?.readback])e?.destroy?.();this.box=null,this.cull=null,this.drawSlotBuffer?.destroy?.(),this.depth=null,this.pickTexture=null,this.featureMaskBuffer=null,this.bundleCache.clear()}setBarrels(e){if(!e?.length)return;let a=20,s=[],r=[];for(let f of[0,1]){let l=s.length/7;for(let y=0;y<a;y+=1){let b=Math.PI*2*y/a,g=Math.cos(b),x=Math.sin(b);for(let v of[0,1])s.push(g,x,v,f?-g:g,f?-x:x,0,f)}for(let y=0;y<a;y+=1){let b=(y+1)%a,g=l+y*2,x=l+b*2;r.push(g,x,x+1,g,x+1,g+1)}}let n=new Float32Array(s),i=new Uint16Array(r),o=new ArrayBuffer(e.length*40),c=new DataView(o);e.forEach((f,l)=>{let y=l*40;c.setFloat32(y,f.centerMm[0]/1e3,!0),c.setFloat32(y+4,-f.centerMm[1]/1e3,!0),c.setFloat32(y+8,Math.min(f.drillWidthMm,f.drillHeightMm)/2e3,!0),c.setFloat32(y+12,Math.max(f.outerWidthMm,f.outerHeightMm)/2e3,!0),c.setFloat32(y+16,f.startZMm/1e3,!0),c.setFloat32(y+20,f.endZMm/1e3,!0),c.setUint32(y+24,f.netId||0,!0),c.setUint32(y+28,f.objectFeatureId||0,!0),c.setUint32(y+32,f.startLayerId||0,!0),c.setUint32(y+36,f.endLayerId||0,!0)});let d=this.device.createBuffer({size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),h=this.device.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),u=this.device.createBuffer({size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,n),this.device.queue.writeBuffer(h,0,i),this.device.queue.writeBuffer(u,0,o);let m=jo(e);this.barrelRecordBuffer?.destroy?.(),this.barrelRecordBuffer=this.device.createBuffer({label:"barrel-records",size:m.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.barrelRecordBuffer,0,m);let p=this.device.createBuffer({size:et,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.barrels={records:e,vertexBuffer:d,indexBuffer:h,instanceBuffer:u,indexCount:i.length,instanceCount:e.length,drawBuffer:p,bindGroup:null},this.setSlot(0,i.length,2),this.rebindAll(),this.invalidate()}render(e){let{panels:a,layerOffsets:s}=e;this.resize(),this.device.queue.writeBuffer(this.layerOffsetBuffer,0,s);let r=this.context.getCurrentTexture().createView(),n=0,i=0;a.forEach((o,c)=>{let d=this.device.createCommandEncoder(),h=!this.identityOnly&&this.encodeCull(d,o),u=d.beginRenderPass({colorAttachments:[{view:r,clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:c===0?"clear":"load",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),m=Xo(o.viewport,this.canvas.width,this.canvas.height);u.setViewport(m.x,m.y,m.width,m.height,0,1),u.setScissorRect(m.x,m.y,m.width,m.height);let p=this.encodeDraws(u,o,e);n+=p.triangles,i+=p.draws,u.end(),this.device.queue.submit([d.finish()]),h&&this.readCullCounts()}),this.frameStats={triangles:Math.round(n),draws:i}}encodeDraws(e,a,{activeNetId:s,selectedFeatureId:r,time:n,visibleLayers:i,showBoard:o,showComponents:c,showPaste:d=!0,componentOpacity:h,boardOpacity:u,isolateNet:m,compareMode:p=!1,compareOffsets:f=new Map,layerAlphas:l=null,visibleTileIds:y=null}){let b=0,g=0;this.stencil&&e.setStencilReference(1),this.writeGlobals(a.matrix,s,a.layerId,n,r);let{pipelines:x,indirect:v,barrelInstances:T}=this.drawSet(),I=!d||!!(s||this.netHighlightActive),S=this.entries.filter(A=>this.visible(A,a.layerId,i,o,c,h,p,y)&&!(I&&A.boardRole==="paste")),R=S.filter(A=>!Ss(A)).sort((A,j)=>+!!A.stencilMark-+!!j.stencilMark),_=S.filter(A=>Ss(A)).sort((A,j)=>Ss(A)-Ss(j));for(let A of S)this.writeDraw(A,s,h,u,m,p,f.get(A.layerId),l?.get(A.layerId)??1);this.flushDraws(S),R.length>64?e.executeBundles([this.renderBundle(R,a.layerId)]):this.drawEntries(e,R,x,v);for(let A of S)b+=A.indexCount/3*this.countFor(A.drawClass);return g+=S.length,!p&&this.barrels&&(a.layerId===0||i.has(a.layerId))&&(this.writeBarrelDraw(m),this.drawBarrels(e,x.barrel,v,T),b+=this.barrels.indexCount/3*this.countFor(2),g+=1),v&&!p&&(this.drawBox(e,x.box),b+=12*this.countFor(3),g+=1),this.drawBlended(e,_,x,v),{triangles:b,draws:g}}depthAttachment(){let e={view:this.depth.createView(),depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"store"};return this.stencil&&Object.assign(e,{stencilClearValue:0,stencilLoadOp:"clear",stencilStoreOp:"discard"}),e}drawEntries(e,a,s,r){let n=null;for(let i of a){let o=i.stencilMark?s.mark:s.main;o!==n&&(e.setPipeline(o),n=o),this.drawEntry(e,i,r)}}drawBlended(e,a,s,r){for(let n of a)n.boardRole==="soldermask"&&n.kind==="board"?(e.setPipeline(s.mask),this.drawEntry(e,n,r),s.maskCovered&&(e.setPipeline(s.maskCovered),this.drawEntry(e,n,r))):(e.setPipeline(s.blend),this.drawEntry(e,n,r))}setPlaceholdersVisible(e){this.showPlaceholders=!!e,this.invalidate()}visible(e,a,s,r,n,i,o=!1,c=null){return e.placeholder&&!this.showPlaceholders||e.kind==="board"&&e.boardRole==="pad"||!o&&e.kind==="copper"&&c&&!c.has(e.tileId)?!1:o?e.kind==="copper"&&s.has(e.layerId):e.boardRole==="paste"?a===0&&s.has(e.layerId):e.kind==="board"?a===0&&r:e.kind==="component"?a===0&&n&&i>.001:a?e.layerId===a:s.has(e.layerId)}writeGlobals(e,a,s,r,n=0){let i=this.globalScratch,o=this.globalScratchF32;o.fill(0),o.set(e,0);let c=this.globalScratchView;c.setUint32(64,a||0,!0),c.setUint32(68,s||0,!0),c.setFloat32(72,r,!0),c.setFloat32(76,a||this.netHighlightActive?1:0,!0),c.setUint32(80,n||0,!0),c.setUint32(84,this.selectedOccurrence>=0?this.selectedOccurrence+1+this.occurrenceBase:0,!0),c.setUint32(88,this.occurrenceBase,!0),c.setUint32(92,this.emphasisStride,!0),o.set([.35,-.5,.8,0],24),this.device.queue.writeBuffer(this.globalBuffer,0,i)}writeDraw(e,a,s,r=1,n=!1,i=!1,o=null,c=1){let d=this.drawStaging.subarray(e.drawSlot*ca,(e.drawSlot+1)*ca);d.fill(0);let h=e.color||e.material.baseColor;d.set(h,0),d.set([e.material.metallic||0,e.material.roughness??.72,e.opacityScale!=null?s:0,$b[e.drawClass]??1],4);let u=Qb(e);d.set([o?.[0]||0,o?.[1]||0,(i?-(e.baseZ||0):e.layerOffset||0)+u,e.kind==="copper"||e.boardRole==="paste"?Number(e.layerId||0)+1:0],8);let m=Number.isFinite(h?.[3])?h[3]:1,p=e.kind==="component"?s*(e.opacityScale??1):e.kind==="board"&&e.boardRole!=="paste"?r*Yb(e,m):c,f=e.kind==="copper"?1:e.kind==="component"?2:0;d.set([f,p,n?1:0,i?1:0],12)}writeBarrelDraw(e=!1){let a=this.barrelDrawScratch;a.fill(0),a.set(this.barrelColor,0),a.set([.75,.32,0,0],4),a.set([1,1,e?1:0,0],12),this.device.queue.writeBuffer(this.barrels.drawBuffer,0,a)}renderBundle(e,a){let{pipelines:s,indirect:r}=this.drawSet(),n=`${a}:${r?"indirect":"single"}:${e.map(d=>d.id).join(",")}`,i=this.bundleCache.get(n);if(i)return i;let o=this.device.createRenderBundleEncoder({colorFormats:[this.format],depthStencilFormat:this.depthFormat});this.drawEntries(o,e,s,r);let c=o.finish();return this.bundleCache.set(n,c),this.bundleCache.size>32&&this.bundleCache.delete(this.bundleCache.keys().next().value),c}pick(e,a,s,r){let n=this.pickSerial.then(()=>this.performPick(e,a,s,r));return this.pickSerial=n.catch(()=>0),n}async performPick(e,a,s,r){this.resize();let n=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),i=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s)));this.device.queue.writeBuffer(this.layerOffsetBuffer,0,r.layerOffsets);let o=this.device.createCommandEncoder(),c=o.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),d=Xo(e.viewport,this.canvas.width,this.canvas.height);return c.setViewport(d.x,d.y,d.width,d.height,0,1),c.setScissorRect(d.x,d.y,d.width,d.height),this.encodePick(c,e,r),c.end(),this.readPick(o,n,i)}encodePick(e,a,s){this.writeGlobals(a.matrix,s.activeNetId,a.layerId,performance.now()/1e3,s.selectedFeatureId);let{pipelines:r,indirect:n,barrelInstances:i}=this.drawSet();e.setPipeline(r.pick);let o=[];for(let c of this.entries)this.visible(c,a.layerId,s.visibleLayers,s.showBoard,s.showComponents,s.componentOpacity,s.compareMode,s.visibleTileIds)&&(c.kind==="board"&&(this.identityOnly||c.boardRole!=="substrate")||(this.writeDraw(c,s.activeNetId,s.componentOpacity,s.boardOpacity,s.isolateNet,s.compareMode,s.compareOffsets?.get(c.layerId)),o.push(c)));this.flushDraws(o);for(let c of o)this.drawEntry(e,c,n);!s.compareMode&&this.barrels&&(this.writeBarrelDraw(s.isolateNet),this.drawBarrels(e,r.barrelPick,n,i)),n&&!s.compareMode&&this.drawBox(e,r.boxPick)}async readPick(e,a,s){let r=this.device.createBuffer({label:"pick-readback",size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});e.copyTextureToBuffer({texture:this.pickTexture,origin:{x:a,y:s}},{buffer:r,bytesPerRow:256},{width:1,height:1}),this.device.queue.submit([e.finish()]);try{await r.mapAsync(GPUMapMode.READ);let n=new DataView(r.getMappedRange()),i=Oo(n.getUint32(0,!0),n.getUint32(4,!0));return r.unmap(),{...i,occurrenceKey:i.occurrenceIndex>=0?this.occurrenceKeys[i.occurrenceIndex]??null:null}}finally{r.mapState==="mapped"&&r.unmap(),r.destroy()}}},$b=Object.freeze({0:1,1:0,5:2});function qo(t,e){return t.kind==="component"||t.innerCopper&&e?1:t.kind==="board"&&(t.boardRole==="substrate"||t.boardRole==="soldermask")?5:0}function Ss(t){return t.translucent?3:t.kind!=="board"?0:t.boardRole==="soldermask"?1:t.boardRole==="silkscreen"?2:0}function Yb(t,e){return t.kind!=="board"||t.boardRole==="substrate"?1:t.boardRole==="soldermask"?Math.min(e,.72):t.boardRole==="silkscreen"?Math.min(e,.92):e}function Qb(t){if(t.kind!=="board"||t.boardRole!=="soldermask"&&t.boardRole!=="silkscreen")return 0;let e=t.bounds,s=(e?(e[2]+e[5])*.5:0)<0?-1:1,r=t.boardRole==="silkscreen"?35e-6:18e-6;return s*r}function Xo(t,e,a){let s=Math.max(0,Math.min(e-1,Math.floor(t.x))),r=Math.max(0,Math.min(a-1,Math.floor(t.y)));return{x:s,y:r,width:Math.max(1,Math.min(e-s,Math.floor(t.width))),height:Math.max(1,Math.min(a-r,Math.floor(t.height)))}}function lc(t){return t*12+2}function dc(t){let e=[],a=0,s=0,r=0;for(let p=0;p<t.length;p+=1){let f=Math.floor(t[p].samplesMm.length/3);f<2||(e.push(p),a+=f,s+=lc(f),r+=(f-1)*12*6+72)}let n=new Float32Array(Math.max(a,1)*4),i=new ArrayBuffer(Math.max(e.length,1)*32),o=new Uint32Array(i),c=new Float32Array(i),d=new Uint32Array(Math.max(r,3)),h=0,u=0,m=0;return e.forEach((p,f)=>{let l=t[p],y=Math.floor(l.samplesMm.length/3);for(let x=0;x<y;x+=1)n[(h+x)*4]=l.samplesMm[x*3]*.001,n[(h+x)*4+1]=l.samplesMm[x*3+1]*.001,n[(h+x)*4+2]=l.samplesMm[x*3+2]*.001;o[f*8]=h,o[f*8+1]=y,o[f*8+2]=u,o[f*8+3]=f,c[f*8+4]=l.radiusMm*.001;let b=(x,v)=>u+x*12+v%12;for(let x=0;x+1<y;x+=1)for(let v=0;v<12;v+=1)d.set([b(x,v),b(x+1,v),b(x+1,v+1),b(x,v),b(x+1,v+1),b(x,v+1)],m),m+=6;let g=u+y*12;for(let x=0;x<12;x+=1)d.set([g,b(0,x+1),b(0,x)],m),d.set([g+1,b(y-1,x),b(y-1,x+1)],m+3),m+=6;h+=y,u+=lc(y)}),{samples:n,segments:o,indices:d,kept:e,sampleCount:a,vertexCount:s,indexCount:r}}var ep=`
struct Segment { start: u32, count: u32, vertexStart: u32, color: u32, radius: f32, p0: u32, p1: u32, p2: u32 };
struct Vertex { position: vec4f, normal: vec4f };
`,tp=`${ep}
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
`,ap=`
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
`,uc=96,As=class{constructor(e){this.host=e,this.device=e.device,this.counts={segments:0,samples:0,vertices:0,indices:0},this.dirty=!1,this.kept=[];let a=this.device,s=a.createShaderModule({label:"harness-tubes-compute",code:tp});this.computeLayout=a.createBindGroupLayout({label:"harness-tubes-compute",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});let r=a.createPipelineLayout({bindGroupLayouts:[this.computeLayout]});this.framesPipeline=a.createComputePipeline({layout:r,compute:{module:s,entryPoint:"framesMain"}}),this.ringsPipeline=a.createComputePipeline({layout:r,compute:{module:s,entryPoint:"ringsMain"}});let n=a.createShaderModule({label:"harness-tubes-draw",code:ap});this.drawLayout=a.createBindGroupLayout({label:"harness-tubes-draw",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),this.drawPipeline=a.createRenderPipeline({label:"harness-tubes",layout:a.createPipelineLayout({bindGroupLayouts:[this.drawLayout]}),vertex:{module:n,entryPoint:"vs",buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:"float32x4"},{shaderLocation:1,offset:16,format:"float32x4"}]}]},fragment:{module:n,entryPoint:"fs",targets:[{format:e.format}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:e.depthStencilState(),multisample:{count:1}}),this.globals=a.createBuffer({label:"harness-tubes-globals",size:uc,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.countBuffer=a.createBuffer({label:"harness-tubes-counts",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.buffers={},this.capacity={samples:0,segments:0,vertices:0,indices:0},this.globalScratch=new Float32Array(uc/4)}ensure(e,a,s){let r=this.buffers[e];return r&&r.size>=a?!1:(r?.destroy(),this.buffers[e]=this.device.createBuffer({label:`harness-tubes-${e}`,size:Math.max(256,Math.ceil(a*1.5/4)*4),usage:s}),!0)}setTubes(e,a){let s=dc(e);if(this.kept=s.kept.map(o=>e[o]),this.counts={segments:s.kept.length,samples:s.sampleCount,vertices:s.vertexCount,indices:s.indexCount},!this.counts.segments){this.dirty=!1;return}let r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,n=!1;n=this.ensure("samples",s.samples.byteLength,r)||n,n=this.ensure("segments",s.segments.byteLength,r)||n,n=this.ensure("frames",s.samples.byteLength,GPUBufferUsage.STORAGE)||n,n=this.ensure("vertices",this.counts.vertices*32,GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX)||n,this.ensure("indices",s.indices.byteLength,GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST);let i=this.device.queue;i.writeBuffer(this.buffers.samples,0,s.samples),i.writeBuffer(this.buffers.segments,0,s.segments),i.writeBuffer(this.buffers.indices,0,s.indices),i.writeBuffer(this.countBuffer,0,new Uint32Array([this.counts.segments,this.counts.samples,this.counts.vertices,0])),(n||!this.computeGroup)&&(this.computeGroup=this.device.createBindGroup({layout:this.computeLayout,entries:["samples","segments","frames","vertices"].map((o,c)=>({binding:c,resource:{buffer:this.buffers[o]}})).concat([{binding:4,resource:{buffer:this.countBuffer}}])})),this.setColors(a),this.dirty=!0}setColors(e){if(!this.counts.segments)return;let a=new Float32Array(this.counts.segments*4);this.kept.forEach((s,r)=>{let{rgb:n,mode:i}=e(s);a.set([n[0],n[1],n[2],i],r*4)}),(this.ensure("colors",a.byteLength,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST)||!this.drawGroup||this.drawGroupColors!==this.buffers.colors)&&(this.drawGroup=this.device.createBindGroup({layout:this.drawLayout,entries:[{binding:0,resource:{buffer:this.globals}},{binding:1,resource:{buffer:this.buffers.colors}}]}),this.drawGroupColors=this.buffers.colors),this.device.queue.writeBuffer(this.buffers.colors,0,a)}encodeCompute(e){if(!this.dirty||!this.counts.segments)return;let a=e.beginComputePass({label:"harness-tubes"});a.setBindGroup(0,this.computeGroup),a.setPipeline(this.framesPipeline),a.dispatchWorkgroups(Math.ceil(this.counts.segments/64)),a.setPipeline(this.ringsPipeline),a.dispatchWorkgroups(Math.ceil(this.counts.vertices/64)),a.end(),this.dirty=!1}draw(e,a,s=0){if(!this.counts.segments)return 0;let r=this.globalScratch;return r.fill(0),r.set(a,0),r.set([.35,-.45,.82,0],16),r[20]=s,this.device.queue.writeBuffer(this.globals,0,r),e.setPipeline(this.drawPipeline),e.setBindGroup(0,this.drawGroup),e.setVertexBuffer(0,this.buffers.vertices),e.setIndexBuffer(this.buffers.indices,"uint32"),e.drawIndexed(this.counts.indices),this.counts.indices/3}gpuMemoryBytes(){return Object.values(this.buffers).reduce((e,a)=>e+a.size,0)}dispose(){for(let e of Object.values(this.buffers))e.destroy();this.globals.destroy(),this.countBuffer.destroy(),this.buffers={}}};var sp=[0,0,0,1,1,1],_s=class t{static async create(e){return new t(await Wt.create(e))}constructor(e){this.host=e,this.canvas=e.canvas,this.device=e.device,e.alwaysInstanced=!0,e.setOccurrences([]),this.assets=new Map,this.order=[],this.frameStats={triangles:0,draws:0},this.lodThresholds={...qe},this.tubes=null,this.tubeVersion=0}setTubes(e,a){!e.length&&!this.tubes||(this.tubes??=new As(this.host),this.tubes.setTubes(e,a),this.tubeVersion+=1)}setTubeColors(e){this.tubes?.setColors(e),this.tubeVersion+=1}asset(e){let a=this.assets.get(e);return a||(a=new Wt(this.canvas,this.device,{shareFrom:this.host}),a.setLodThresholds(this.lodThresholds),this.assets.set(e,a)),a}standIn(e,a){let s=this.asset(e);return s.standIn||(s.standIn=!0,s.setBoardBounds(sp),s.setLodOverride(Lo)),s.boxColor=[...a],s}removeAsset(e){let a=this.assets.get(e);a&&(a.dispose(),this.assets.delete(e))}get renderers(){return this.order.map(e=>this.assets.get(e)).filter(Boolean)}setOccurrences(e){this.order=[...e.keys()].filter(s=>this.assets.has(s));for(let[s,r]of this.assets)e.has(s)||r.setOccurrences([]);for(let s of this.order)this.assets.get(s).setOccurrences(e.get(s));let a=0;for(let s of this.renderers)s.occurrenceBase=a,a+=s.occurrenceCount;this.occurrenceCount=a}locate(e){for(let a of this.renderers){let s=e-a.occurrenceBase;if(s>=0&&s<a.occurrenceCount)return{renderer:a,local:s}}return null}keyOf(e){let a=this.locate(e);return a?a.renderer.occurrenceKeys[a.local]??null:null}setSelectedOccurrence(e){let a=e>=0?this.locate(e):null;for(let s of this.renderers)s.selectedOccurrence=!s.standIn&&a?.renderer===s?a.local:-1}resize(){this.host.resize()}render(e,a){let s=this.host;s.resize();let r=this.renderers.filter(u=>u.occurrenceCount>0),n=new Map(r.map(u=>[u,a(u)]));for(let[u,m]of n)fc(u,m);let i=this.device.createCommandEncoder(),o=r.filter(u=>u.encodeCull(i,e));this.tubes?.encodeCompute(i);let c=i.beginRenderPass({colorAttachments:[{view:s.context.getCurrentTexture().createView(),clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:s.depthAttachment()});hc(c,e.viewport,this.canvas);let d=0,h=0;for(let u of r){let m=u.encodeDraws(c,e,n.get(u));d+=m.triangles,h+=m.draws}this.tubes?.counts.segments&&(d+=this.tubes.draw(c,e.matrix,performance.now()/1e3),h+=1),c.end(),this.device.queue.submit([i.finish()]);for(let u of o)u.readCullCounts();this.frameStats={triangles:Math.round(d),draws:h}}pick(e,a,s,r){let n=this.host.pickSerial.then(()=>this.performPick(e,a,s,r));return this.host.pickSerial=n.catch(()=>0),n}async performPick(e,a,s,r){let n=this.host;n.resize();let i=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),o=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s))),c=this.device.createCommandEncoder(),d=c.beginRenderPass({colorAttachments:[{view:n.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:n.depthAttachment()});hc(d,e.viewport,this.canvas);for(let m of this.renderers){if(m.occurrenceCount===0)continue;let p=r(m);fc(m,p),m.encodePick(d,e,p)}d.end();let h=await n.readPick(c,i,o),u=h.occurrenceIndex>=0?this.locate(h.occurrenceIndex):null;return{...h,occurrenceKey:u?u.renderer.occurrenceKeys[u.local]??null:null,renderer:u?.renderer||null,standIn:!!u?.renderer?.standIn}}gpuMemoryBytes(){let e=0;for(let a of this.renderers)e+=a.gpuMemoryBytes();return e+=this.tubes?.gpuMemoryBytes()||0,e-Math.max(0,this.renderers.length-1)*this.canvas.width*this.canvas.height*12}setLodThresholds(e){this.lodThresholds=oa({...this.lodThresholds,...e});for(let a of this.assets.values())a.setLodThresholds(this.lodThresholds);return{...this.lodThresholds}}cullCounts(){let e={full:0,board:0,body:0,box:0,culled:0};for(let a of this.renderers)if(a.occurrenceCount)for(let s of Object.keys(e))e[s]+=a.cullCounts[s]||0;return e}dispose(){for(let e of[...this.assets.keys()])this.removeAsset(e);this.tubes?.dispose(),this.tubes=null,this.host.dispose(),this.host.context?.unconfigure?.(),this.device.destroy?.()}};function fc(t,e){e?.layerOffsets&&t.device.queue.writeBuffer(t.layerOffsetBuffer,0,e.layerOffsets)}function hc(t,e,a){let s=Math.max(0,Math.min(a.width-1,Math.floor(e.x))),r=Math.max(0,Math.min(a.height-1,Math.floor(e.y))),n=Math.max(1,Math.min(a.width-s,Math.floor(e.width))),i=Math.max(1,Math.min(a.height-r,Math.floor(e.height)));t.setViewport(s,r,n,i,0,1),t.setScissorRect(s,r,n,i)}var rp=`
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
}`,np=`
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
}`,ip=`
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
}`,op=`
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
}`,cp=`
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
}`,lp=`
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
}`,dp=`
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
}`,up=6.2,fp=4.6,hp=3.8,Cs=4*1024*1024,bp=Math.floor(Cs/6),bc=bp*6,Ns=512*1024,pc=512*1024,gc=96,pp=96,gp=18,mc=96*1024*1024,mp=2,js=class t{static async create(e,a){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let s=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!s)throw new Error("No WebGPU adapter is available");let r=await s.requestDevice(),n=await fetch(a,{cache:"default"});if(!n.ok)throw new Error(`Failed to load schematic manifest: ${n.status}`);let i=await n.json();if(!["prism.schematic_world_a0","prism.schematic_vector_a0"].includes(i.schema))throw new Error(`Unsupported schematic scene schema: ${i.schema}`);let o=i.featureTable||i.features,c=await fetch(new URL(o,a),{cache:"default"});if(!c.ok)throw new Error(`Failed to load schematic features: ${c.status}`);let d=xp(await c.json());return new t(e,r,a,i,d)}constructor(e,a,s,r,n){this.canvas=e,this.device=a,this.manifestUrl=s,this.manifest=r,this.isNativeScene=r.schema==="prism.schematic_vector_a0",this.pages=r.pages||[],this.featuresByPage=n,this.featuresById=new Map;for(let p of Object.values(n))for(let f of p)this.featuresById.set(Number(f.id),f);this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"}),this.flowCanvas=null,this.flowContext=null,this.globalBuffer=a.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.bindGroupLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]});let i=a.createShaderModule({code:rp});this.pagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:this.format}]},primitive:{topology:"triangle-list"}}),this.edgeLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});let o=a.createShaderModule({code:np});this.edgePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:o,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:o,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.edgeBindGroup=a.createBindGroup({layout:this.edgeLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}}]});let c=a.createShaderModule({code:ip});this.highlightPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:c,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:c,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.highlightBufferSize=4*1024*1024,this.highlightBuffer=a.createBuffer({size:this.highlightBufferSize,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});let d=a.createShaderModule({code:op});this.netFlowPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:d,entryPoint:"vs",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x2"}]}]},fragment:{module:d,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.netFlowBuffer=a.createBuffer({size:pc*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.globalUniformScratch=new Float32Array(12),this.pageUniformScratch=new Float32Array(8),this.imageUniformScratch=new Float32Array(8),this.vectorScratch=new Float32Array(Cs),this.highlightScratch=new Float32Array(this.highlightBufferSize/4),this.netFlowScratch=new Float32Array(pc),this.netTrackingCache=null,this.selectedIntrasheetLinkIndex=-1,this.truncatedHighlightCount=0,this.truncatedVectorCount=0,this.frameSerial=0,this.querySerial=0;let h=a.createShaderModule({code:cp});this.vectorPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:h,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x4"}]}]},fragment:{module:h,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.vectorBuffer=a.createBuffer({size:Cs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers=[this.vectorBuffer];let u=a.createShaderModule({code:lp});this.imagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:u,entryPoint:"vs"},fragment:{module:u,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}});let m=a.createShaderModule({code:dp});this.pickPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:m,entryPoint:"vs",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"uint32"}]}]},fragment:{module:m,entryPoint:"fs",targets:[{format:"r32uint"}]},primitive:{topology:"triangle-list"}}),this.pickVertexBuffer=a.createBuffer({size:Ns*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.pickReadBuffer=a.createBuffer({size:256,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pickTexture=null,this.pickTextureSize=[0,0],this.pickPending=!1,this.vectorChunks=new Map,this.failedVectorChunks=new Map,this.nativeDetailState=new Map,this.domDetailPageIds=new Set,this.nativeDetailThresholds=new Map,this.residentVectorBytes=0,this.sampler=a.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.placeholder=this.createSolidTexture([245,247,249,255]),this.pageResources=new Map,this.imageResources=new Map,this.loading=new Map,this.selectedPageId="",this.selectedFeatureId=0,this.activeNetUid="",this.showHierarchy=!0,this.downloadedBytes=0,this.world=r.worldBoundsMm,this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/900,(this.world.maxY-this.world.minY)/650,.1)*1.16,this.edgeBuffer=this.createEdgeBuffer();for(let p of this.pages)this.createPageResource(p)}createSolidTexture(e){let a=this.device.createTexture({size:[1,1],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.queue.writeTexture({texture:a},new Uint8Array(e),{bytesPerRow:4},[1,1]),a}createPageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={page:e,uniform:a,texture:this.placeholder,textureWidth:0,svgBlob:null,bindGroup:null};this.pageResources.set(e.id,s),this.updateBindGroup(s)}createImageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={path:e,uniform:a,texture:this.placeholder,loaded:!1,bindGroup:null};return this.imageResources.set(e,s),this.updateBindGroup(s),s}updateBindGroup(e){e.bindGroup=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e.uniform}},{binding:2,resource:this.sampler},{binding:3,resource:e.texture.createView()}]})}async loadImageTexture(e){let a=this.imageResources.get(e)||this.createImageResource(e);if(a.loaded)return a;let s=`image:${e}`;if(this.loading.has(s))return this.loading.get(s);let r=(async()=>{try{let n=await fetch(new URL(e,this.manifestUrl),{cache:"default"});if(!n.ok)throw new Error(`Failed to load schematic image ${e}: ${n.status}`);let i=await n.blob(),o=await createImageBitmap(i),c=this.device.createTexture({size:[o.width,o.height],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:o},{texture:c},[o.width,o.height]),o.close(),a.texture!==this.placeholder&&a.texture.destroy(),a.texture=c,a.loaded=!0,this.updateBindGroup(a)}finally{this.loading.delete(s)}return a})();return this.loading.set(s,r),r}createEdgeBuffer(){let e=new Map(this.pages.map(n=>[n.id,n])),a=[];for(let n of this.manifest.edges||[]){let i=e.get(n.source),o=e.get(n.target);!i||!o||a.push(i.worldX+i.widthMm/2,i.worldY+i.heightMm,o.worldX+o.widthMm/2,o.worldY)}let s=new Float32Array(a);if(!s.length)return null;let r=this.device.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(r,0,s),{buffer:r,count:s.length/2}}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));(this.canvas.width!==a||this.canvas.height!==s)&&(this.canvas.width=a,this.canvas.height=s),this.flowCanvas&&(this.flowCanvas.width!==a||this.flowCanvas.height!==s)&&(this.flowCanvas.width=a,this.flowCanvas.height=s)}setFlowOverlayCanvas(e){e&&(this.flowCanvas=e,this.flowContext=e.getContext("webgpu"),this.flowContext.configure({device:this.device,format:this.format,alphaMode:"premultiplied"}))}writeGlobals(){let e=this.globalUniformScratch;e[0]=this.center[0],e[1]=this.center[1],e[2]=this.scale,e[3]=performance.now()*.001,e[4]=this.canvas.width,e[5]=this.canvas.height,this.device.queue.writeBuffer(this.globalBuffer,0,e)}pagePixelWidth(e){return e.widthMm/this.scale}pageSourcePixelsPerMm(e){let a=this.pagePixelWidth(e)/Math.max(1,e.sourceWidthMm||e.widthMm),s=e.heightMm/this.scale/Math.max(1,e.sourceHeightMm||e.heightMm);return Math.min(a,s)}pageNativeDetailThresholds(e){let a=this.nativeDetailThresholds.get(e.id);if(a)return a;let s=Math.max(1,e.sourceWidthMm||e.widthMm),r=Math.max(1,e.sourceHeightMm||e.heightMm),n=s*r,i=Math.max(0,e.featureCount||e.featureIds?.length||0)/Math.max(1,n),o=ne(1-i*72,.84,1.08),c=ne(Math.sqrt(Math.max(s,r)/Math.max(1,Math.min(s,r)))/1.18,.92,1.14),d=ne(up*o*c,5,7.4),h={enter:d,exit:ne(Math.min(d-1.2,fp*o),3.8,d-.7),prefetch:ne(Math.min(d-2,hp*o),3,d-1)};return this.nativeDetailThresholds.set(e.id,h),h}pageWantsNativeDetail(e){if(!this.pageHasNativeDetail(e))return!1;let a=this.pageSourcePixelsPerMm(e),s=this.nativeDetailState.get(e.id)===!0,r=this.pageNativeDetailThresholds(e),n=s?r.exit:r.enter,i=a>=n;return i!==s&&this.nativeDetailState.set(e.id,i),i}pageNativeDetailReady(e){if(this.domDetailPageIds.has(e.id)||!this.pageWantsNativeDetail(e))return!1;let a=this.vectorChunks.get(e.id);return!a?.loaded||!a.segments?.length&&!a.fills?.length?!1:this.visibleNativeImagesReady(e,a)}visibleNativeImagesReady(e,a){if(!a?.images?.length)return!0;let s=this.sourceViewportBounds(e,4),r=!0;for(let n of a.images){if(!lt(n.bounds,s))continue;(this.imageResources.get(n.path)||this.createImageResource(n.path)).loaded||(r=!1,this.loadImageTexture(n.path).catch(()=>{}))}return r}visiblePages(){let e=this.canvas.width*this.scale/2,a=this.canvas.height*this.scale/2,s=this.center[0]-e,r=this.center[0]+e,n=this.center[1]-a,i=this.center[1]+a;return this.pages.filter(o=>o.worldX+o.widthMm>=s&&o.worldX<=r&&o.worldY+o.heightMm>=n&&o.worldY<=i)}worldViewportBounds(e=0){let a=this.canvas.width*this.scale/2,s=this.canvas.height*this.scale/2;return[this.center[0]-a-e,this.center[1]-s-e,this.center[0]+a+e,this.center[1]+s+e]}sourceViewportBounds(e,a=2.5){let s=this.worldViewportBounds(this.scale*8),r=(s[0]-e.worldX)/e.widthMm*e.sourceWidthMm-a,n=(s[1]-e.worldY)/e.heightMm*e.sourceHeightMm-a,i=(s[2]-e.worldX)/e.widthMm*e.sourceWidthMm+a,o=(s[3]-e.worldY)/e.heightMm*e.sourceHeightMm+a;return[Math.max(-a,Math.min(r,i)),Math.max(-a,Math.min(n,o)),Math.min(e.sourceWidthMm+a,Math.max(r,i)),Math.min(e.sourceHeightMm+a,Math.max(n,o))]}render(){this.frameSerial+=1,this.resize(),this.writeGlobals();let e=this.visiblePages(),a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.045,g:.055,b:.073,a:1},loadOp:"clear",storeOp:"store"}]});this.showHierarchy&&this.edgeBuffer&&(s.setPipeline(this.edgePipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.edgeBuffer.buffer),s.draw(this.edgeBuffer.count)),s.setPipeline(this.pagePipeline);for(let i of e){let o=this.pageResources.get(i.id),c=this.activeNetUid&&i.netUids.includes(this.activeNetUid),d=this.domDetailPageIds.has(i.id),h=!d&&this.pageNativeDetailReady(i),u=this.pageUniformScratch;u[0]=i.worldX,u[1]=i.worldY,u[2]=i.widthMm,u[3]=i.heightMm,u[4]=i.id===this.selectedPageId?1:0,u[5]=c?1:0,u[6]=this.activeNetUid?1:0,u[7]=h||d?1:0,this.device.queue.writeBuffer(o.uniform,0,u),s.setBindGroup(0,o.bindGroup),s.draw(6);let m=ne(Math.ceil(this.pagePixelWidth(i)*1.3/512)*512,512,6144);o.textureWidth<m*.82&&this.loadPageTexture(i,m).catch(()=>{})}this.scheduleVisibleVectorLoads(e),this.drawVisibleImages(s,e),this.drawVisibleVectors(s,e);let r=this.writeNetTrackingOverlay();r&&!this.flowContext&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(r));let n=this.writeNetHighlights(e);return n&&(s.setPipeline(this.highlightPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.highlightBuffer),s.draw(n)),s.end(),this.device.queue.submit([a.finish()]),this.renderFlowOverlay(r),this.evictVectorChunks(e),e}renderFlowOverlay(e){if(!this.flowContext)return;let a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.flowContext.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});e&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(e)),s.end(),this.device.queue.submit([a.finish()])}drawVisibleImages(e,a){if(!this.isNativeScene)return;let s=!1;for(let r of a){if(this.domDetailPageIds.has(r.id)||!this.pageNativeDetailReady(r))continue;let n=this.vectorChunks.get(r.id);if(!n?.images?.length)continue;let i=this.sourceViewportBounds(r,4);for(let o of n.images){if(!lt(o.bounds,i))continue;let c=this.imageResources.get(o.path)||this.createImageResource(o.path);c.loaded||this.loadImageTexture(o.path).catch(()=>{});let d=o.worldOrigin||this.sourceToWorld(r,[o.xMm,o.yMm]),h=o.worldSize||this.sourceSizeToWorld(r,o.widthMm,o.heightMm),u=this.imageUniformScratch;u[0]=d[0],u[1]=d[1],u[2]=h[0],u[3]=h[1],u[4]=0,u[5]=0,u[6]=0,u[7]=0,this.device.queue.writeBuffer(c.uniform,0,u),s||(e.setPipeline(this.imagePipeline),s=!0),e.setBindGroup(0,c.bindGroup),e.draw(6)}}}drawVisibleVectors(e,a){if(!this.isNativeScene)return 0;let s=this.vectorScratch,r=0,n=0,i=0,o=0,c=!1,d=()=>{if(!r)return;let u=this.vectorBuffers[o];u||(u=this.device.createBuffer({size:Cs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers.push(u)),this.device.queue.writeBuffer(u,0,s,0,r),c||(e.setPipeline(this.vectorPipeline),e.setBindGroup(0,this.edgeBindGroup),c=!0);let m=Math.floor(r/6);e.setVertexBuffer(0,u),e.draw(m),i+=m,o+=1,r=0},h=u=>u>bc||u>s.length?(n+=1,!1):((r+u>bc||r+u>s.length)&&d(),!0);for(let u of a){if(this.domDetailPageIds.has(u.id)||!this.pageHasNativeDetail(u))continue;let m=this.vectorChunks.get(u.id);if(!m?.segments?.length&&!m?.fills?.length||!this.pageNativeDetailReady(u))continue;m.lastUsedFrame=this.frameSerial;let p=this.sourceViewportBounds(u),f=xc(m.spatial,p);for(let l of f.fills){if(!lt(l.bounds,p)||!h(18))continue;let y=this.featuresById.get(l.featureId),b=this.activeNetUid&&y?.netUid===this.activeNetUid,x=this.selectedFeatureId===l.featureId?[.24,.58,1,1]:b?[.06,1,.24,1]:this.activeNetUid&&Ba(y)?Ec(y,l.kind,l.color):ln(y,l.kind,l.color),v=l.worldPoints||l.points.map(T=>this.sourceToWorld(u,T));r=Op(s,r,v[0],v[1],v[2],x)}for(let l of f.segments){if(!lt(l.bounds,p))continue;let y=this.featuresById.get(l.featureId),b=this.activeNetUid&&y?.netUid===this.activeNetUid,g=this.selectedFeatureId===l.featureId,x=g?[.24,.58,1,1]:b?[.06,1,.24,1]:this.activeNetUid&&Ba(y)?Ec(y,l.kind,l.color):ln(y,l.kind,l.color),v=this.segmentWorldWidth(u,l,y,b||g);for(let T of this.visibleSegmentParts(u,l,y)){if(!h(36))continue;let I=T.worldA||this.sourceToWorld(u,T.a),S=T.worldB||this.sourceToWorld(u,T.b);r=jp(s,r,I,S,v,x)}}}return d(),this.truncatedVectorCount=n,this.vectorTruncated=n>0,this.lastVectorVertices=i,this.lastVectorChunks=o,i}pageHasNativeDetail(e){return this.isNativeScene?e?.nativeDetail?.enabled!==!1:!1}scheduleVisibleVectorLoads(e){if(!this.isNativeScene)return;let a=[...this.vectorChunks.values()].filter(n=>n?.promise&&!n.loaded).length,s=Math.max(0,mp-a);if(!s)return;let r=e.filter(n=>!this.domDetailPageIds.has(n.id)).filter(n=>this.pageHasNativeDetail(n)&&this.pageSourcePixelsPerMm(n)>=this.pageNativeDetailThresholds(n).prefetch).filter(n=>!this.vectorChunks.get(n.id)?.loaded&&!this.vectorChunks.get(n.id)?.promise).sort((n,i)=>{let o=Math.hypot(n.worldX+n.widthMm/2-this.center[0],n.worldY+n.heightMm/2-this.center[1]),c=Math.hypot(i.worldX+i.widthMm/2-this.center[0],i.worldY+i.heightMm/2-this.center[1]);return o-c});for(let n of r)if(this.loadPageVectors(n).catch(()=>{}),s-=1,!s)break}featurePrimitiveBounds(e,a){let s=this.vectorChunks.get(e.id);if(!s?.segments?.length&&!s?.fills?.length)return null;let r=[],n=[];for(let i of s.segments||[])i.featureId===a&&(r.push(i.a[0],i.b[0]),n.push(i.a[1],i.b[1]));for(let i of s.fills||[])if(i.featureId===a)for(let o of i.points||[])r.push(o[0]),n.push(o[1]);return r.length?[Math.min(...r),Math.min(...n),Math.max(...r),Math.max(...n)]:null}symbolClipBounds(e){if(this._symbolClipBounds||(this._symbolClipBounds=new Map),this._symbolClipBounds.has(e.id))return this._symbolClipBounds.get(e.id);let a=(this.featuresByPage[e.id]||[]).filter(s=>s?.kind==="symbol_body"&&s.boundsMm&&!String(s.sourceId||"").includes(":overplot")).map(s=>{let r=this.featurePrimitiveBounds(e,s.id)||s.boundsMm;return[r[0]-.02,r[1]-.02,r[2]+.02,r[3]+.02]}).filter(s=>{let r=s[2]-s[0],n=s[3]-s[1];return Math.max(r,n)<=12&&r*n<=80});return this._symbolClipBounds.set(e.id,a),a}visibleSegmentParts(e,a,s){if(a._visibleParts)return a._visibleParts;let r=String(s?.kind||""),n=String(s?.semanticRole||"");if(r!=="wire"&&n!=="wire")return a._visibleParts=[a],a._visibleParts;let i=[a];for(let o of this.symbolClipBounds(e)){let c=[];for(let d of i)c.push(...Lp(d,o));if(i=c,!i.length)break}for(let o of i)o.worldA=da(e,o.a),o.worldB=da(e,o.b);return a._visibleParts=i,a._visibleParts}netTrackingSegments(){if(!this.activeNetUid)return{netUid:"",anchorsByPage:new Map,segments:[],intrasheetSegments:[]};let e=Number(this.selectedFeatureId||0),a=String(this.selectedFeatureKey||""),s=String(this.selectedSourceId||"");if(this.netTrackingCache?.netUid===this.activeNetUid&&this.netTrackingCache?.selectedFeatureId===e&&this.netTrackingCache?.selectedFeatureKey===a&&this.netTrackingCache?.selectedSourceId===s)return this.netTrackingCache;this.selectedIntrasheetLinkIndex=-1;let r=new Map(this.pages.map(f=>[f.id,f])),n=this.manifest.netToPages?.[this.activeNetUid]||[],i=n.length?n.map(f=>r.get(f)).filter(Boolean):this.pages.filter(f=>f.netUids?.includes(this.activeNetUid)),o=new Map;for(let f of i.slice(0,pp)){let l=this.netTrackingAnchorsForPage(f);l.length&&o.set(f.id,l)}let c=[],d=[];for(let[f,l]of o){let y=vc(Np(l),"intrasheet",f);c.push(...y),d.push(...y)}let h=[...o.entries()].map(([f,l])=>Cp(r.get(f),l,{featureId:e,stableKey:a,sourceId:s})).filter(Boolean);c.push(...vc(h,"intersheet",""));let u=d.map((f,l)=>({...f,intrasheetIndex:l})),m=0,p=c.map((f,l)=>{if(f.type!=="intrasheet")return{...f,id:l};let y=m;return m+=1,{...f,id:l,intrasheetIndex:y}});return this.netTrackingCache={netUid:this.activeNetUid,selectedFeatureId:e,selectedFeatureKey:a,selectedSourceId:s,anchorsByPage:o,segments:p,intrasheetSegments:u},this.selectedIntrasheetLinkIndex>=this.netTrackingCache.intrasheetSegments.length&&(this.selectedIntrasheetLinkIndex=-1),this.netTrackingCache}netTrackingAnchorsForPage(e){let a=this.featuresByPage[e.id]||[],s=[];for(let r of a){if(r.netUid!==this.activeNetUid||!r.boundsMm||!Ap(r))continue;let n=r.boundsMm,i=[(n[0]+n[2])/2,(n[1]+n[3])/2],o=this.sourceToWorld(e,i);s.push({pageId:e.id,featureId:Number(r.id||0),stableKey:String(r.stableKey||""),sourceId:String(r.sourceId||r.sourceUid||r.objectId||""),kind:r.kind||r.semanticRole||"",source:i,world:o,bounds:n,priority:_p(r)})}return s.sort((r,n)=>n.priority-r.priority||r.source[1]-n.source[1]||r.source[0]-n.source[0]),s}writeNetTrackingOverlay(){let e=this.netTrackingSegments();if(this.lastNetFlowSegments=e.segments.length,this.lastNetFlowIntrasheetSegments=e.intrasheetSegments.length,!e.segments.length)return this.lastNetFlowVertices=0,0;let a=this.worldViewportBounds(this.scale*96),s=this.netFlowScratch,r=0,n=0;for(let i of e.segments){if(!lt(Mc(i),a))continue;let o=i.type==="intrasheet"&&i.intrasheetIndex===this.selectedIntrasheetLinkIndex,c=o?9.5:i.type==="intersheet"?8:4.8,d=o?2:i.type==="intersheet"?1:0,h=Pp(s,r,i.a,i.b,c*this.scale,d,n,this.scale);if(h!==r&&(r=h,n+=Math.hypot(i.b[0]-i.a[0],i.b[1]-i.a[1])/Math.max(this.scale,1e-6),r+24>s.length))break}return r?(this.device.queue.writeBuffer(this.netFlowBuffer,0,s,0,r),this.lastNetFlowVertices=r/4,r/4):(this.lastNetFlowVertices=0,0)}cycleNetIntrasheetLink(e=1){let a=this.netTrackingSegments();if(!a.intrasheetSegments.length)return null;let s=a.intrasheetSegments.length;this.selectedIntrasheetLinkIndex=(this.selectedIntrasheetLinkIndex+e+s)%s;let r=a.intrasheetSegments[this.selectedIntrasheetLinkIndex];if(!r)return null;let n=Mc(r,14*this.scale);return this.center=[(n[0]+n[2])/2,(n[1]+n[3])/2],this.scale=Math.max((n[2]-n[0])/Math.max(1,this.canvas.width*.36),(n[3]-n[1])/Math.max(1,this.canvas.height*.3),this.scale*.35,.025),{pageId:r.pageId,segment:r}}writeNetHighlights(e){if(!this.activeNetUid)return 0;let a=this.highlightScratch,s=0,r=0;for(let n of e){let i=this.sourceViewportBounds(n,5);for(let o of this.featuresByPage[n.id]||[]){if(o.netUid!==this.activeNetUid||!o.boundsMm||!lt(o.boundsMm,i))continue;let c=this.featureWorldBounds(n,o.boundsMm);if(s+16>a.length){r+=1;continue}a[s++]=c[0],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[3],a[s++]=c[2],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[1]}}return this.truncatedHighlightCount=r,s?(this.device.queue.writeBuffer(this.highlightBuffer,0,a,0,s),s/2):0}featureWorldBounds(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm,e.worldX+a[2]/e.sourceWidthMm*e.widthMm,e.worldY+a[3]/e.sourceHeightMm*e.heightMm]}sourceToWorld(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm]}sourceSizeToWorld(e,a,s){return[a/e.sourceWidthMm*e.widthMm,s/e.sourceHeightMm*e.heightMm]}async loadPageVectors(e){if(!this.pageHasNativeDetail(e)||!e.chunks?.lod2)return null;let a=this.vectorChunks.get(e.id);if(a?.loaded)return a;if(a?.promise)return a.promise;let s=(async()=>{try{let r=await fetch(new URL(e.chunks.lod2,this.manifestUrl));if(!r.ok)throw new Error(`Failed to load schematic vector chunk ${e.id}: ${r.status}`);let n=await r.json(),i=wp(n.primitives||[]);vp(e,i);let c=JSON.stringify(n).length,d={loaded:!0,segments:i.segments,fills:i.fills,images:i.images,spatial:Rp(i),unsupported:n.unsupported||[],bytes:c,lastUsedFrame:this.frameSerial};return this.vectorChunks.set(e.id,d),this.failedVectorChunks.delete(e.id),this.residentVectorBytes+=c,d}catch(r){let n=this.failedVectorChunks.get(e.id)||{count:0,message:""};throw this.failedVectorChunks.set(e.id,{count:n.count+1,message:r?.message||String(r)}),this.vectorChunks.delete(e.id),r}})();return this.vectorChunks.set(e.id,{loaded:!1,promise:s,segments:[]}),s}evictVectorChunks(e){if(this.residentVectorBytes<=mc)return;let a=new Set(e.map(r=>r.id)),s=[...this.vectorChunks.entries()].filter(([,r])=>r?.loaded).filter(([r])=>!a.has(r)&&r!==this.selectedPageId).sort((r,n)=>(r[1].lastUsedFrame||0)-(n[1].lastUsedFrame||0));for(let[r,n]of s)if(this.vectorChunks.delete(r),this.residentVectorBytes=Math.max(0,this.residentVectorBytes-(n.bytes||0)),this.residentVectorBytes<=mc*.82)break}stats(){let e=this.visiblePages(),a=e.map(r=>this.pageSourcePixelsPerMm(r)),s=e.map(r=>this.pageNativeDetailThresholds(r).enter);return{residentVectorBytes:this.residentVectorBytes,vectorChunks:[...this.vectorChunks.values()].filter(r=>r?.loaded).length,vectorLoads:[...this.vectorChunks.values()].filter(r=>r?.promise&&!r.loaded).length,failedVectorChunks:this.failedVectorChunks.size,vectorVertices:this.lastVectorVertices||0,vectorDrawChunks:this.lastVectorChunks||0,truncatedVectors:this.truncatedVectorCount||0,nativeDetailPages:[...this.nativeDetailState.values()].filter(Boolean).length,nativePxPerMm:Number((Math.max(0,...a)||0).toFixed(2)),nativeThresholdPxPerMm:Number((s.length?Math.min(...s):0).toFixed(2)),domDetailPages:this.domDetailPageIds.size,netFlowSegments:this.lastNetFlowSegments||0,netFlowIntrasheetSegments:this.lastNetFlowIntrasheetSegments||0,netFlowVertices:this.lastNetFlowVertices||0}}setDomDetailPageIds(e){this.domDetailPageIds=new Set(e||[])}async loadPageTexture(e,a){let s=`${e.id}:${a}`;if(this.loading.has(s))return this.loading.get(s);let r=this.pageResources.get(e.id);if(!r||r.textureWidth>=a)return;let n=(async()=>{if(!r.svgBlob){let c=await fetch(new URL(yp(e),this.manifestUrl));if(!c.ok)throw new Error(`Failed to load schematic page ${e.name}: ${c.status}`);r.svgBlob=await c.blob(),this.downloadedBytes+=r.svgBlob.size}let i=r.svgBlob,o=URL.createObjectURL(i);try{let c=new Image;if(c.decoding="async",c.src=o,await c.decode(),r.textureWidth>=a)return;let d=Math.max(64,Math.round(a*e.heightMm/e.widthMm)),h=new OffscreenCanvas(a,d),u=h.getContext("2d",{alpha:!1});u.fillStyle="#ffffff",u.fillRect(0,0,a,d),u.drawImage(c,0,0,a,d);let m=await createImageBitmap(h),p=this.device.createTexture({size:[a,d],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:m},{texture:p},[a,d]),m.close(),r.texture!==this.placeholder&&r.texture.destroy(),r.texture=p,r.textureWidth=a,this.updateBindGroup(r)}finally{URL.revokeObjectURL(o),this.loading.delete(s)}})();return this.loading.set(s,n),n}preloadOverview(){let e=[...this.pages],a=async()=>{for(;e.length;){let s=e.shift();await this.loadPageTexture(s,512).catch(()=>{})}};return Promise.all(Array.from({length:Math.min(4,e.length)},a))}screenToWorld(e,a){let s=this.canvas.getBoundingClientRect(),r=(e-s.left)*this.canvas.width/s.width,n=(a-s.top)*this.canvas.height/s.height;return[this.center[0]+(r-this.canvas.width/2)*this.scale,this.center[1]+(n-this.canvas.height/2)*this.scale]}worldToScreen(e,a){let s=this.canvas.clientWidth/this.canvas.width,r=this.canvas.clientHeight/this.canvas.height;return[((e-this.center[0])/this.scale+this.canvas.width/2)*s,((a-this.center[1])/this.scale+this.canvas.height/2)*r]}hitPage(e,a){let[s,r]=this.screenToWorld(e,a);return[...this.pages].reverse().find(n=>s>=n.worldX&&s<=n.worldX+n.widthMm&&r>=n.worldY&&r<=n.worldY+n.heightMm)||null}async pickFeature(e,a){if(!this.isNativeScene)return this.hitFeature(e,a);let s=this.hitPage(e,a);if(!s)return null;if(!this.pageHasNativeDetail(s))return this.hitFeature(e,a);await this.loadPageVectors(s);let r=await this.gpuPickFeature(s,e,a);return r&&!Fa(r)?{page:s,feature:r,source:this.clientToSource(s,e,a),native:!0,gpu:!0}:this.hitFeature(e,a)}hitFeature(e,a){let s=this.hitPage(e,a);if(!s)return null;let[r,n]=this.clientToSource(s,e,a),i=Math.max(.45,5*this.scale*this.canvas.width/Math.max(1,this.canvas.clientWidth)*s.sourceWidthMm/s.widthMm),o=this.hitResidentVectorFeature(s,r,n,i);if(o)return{page:s,feature:o,source:[r,n],native:!0};let c=this.hitSymbolInterior(s,r,n);if(c)return{page:s,feature:c,source:[r,n],native:!0,interior:!0};let d=(this.featuresByPage[s.id]||[]).filter(h=>{if(Fa(h))return!1;let u=h.boundsMm;return u&&r>=u[0]-i&&r<=u[2]+i&&n>=u[1]-i&&n<=u[3]+i}).map(h=>({feature:h,priority:Ca(h),area:Math.max(1e-4,(h.boundsMm[2]-h.boundsMm[0])*(h.boundsMm[3]-h.boundsMm[1]))})).sort((h,u)=>u.priority-h.priority||h.area-u.area);return{page:s,feature:d[0]?.feature||null,source:[r,n]}}hitSymbolInterior(e,a,s){let r=null;for(let n of this.featuresByPage[e.id]||[]){let i=String(n?.kind||"");if(i!=="symbol_body"&&i!=="symbol_instance"||String(n?.sourceId||"").includes(":overplot"))continue;let o=n.boundsMm;if(!o||a<o[0]||a>o[2]||s<o[1]||s>o[3])continue;let c=Math.max(1e-4,(o[2]-o[0])*(o[3]-o[1])),d=(i==="symbol_body"?0:1e6)+c;(!r||d<r.score)&&(r={feature:n,score:d})}return r?.feature||null}clientToSource(e,a,s){let[r,n]=this.screenToWorld(a,s);return[(r-e.worldX)/e.widthMm*e.sourceWidthMm,(n-e.worldY)/e.heightMm*e.sourceHeightMm]}ensurePickTexture(){this.pickTexture&&this.pickTextureSize[0]===this.canvas.width&&this.pickTextureSize[1]===this.canvas.height||(this.pickTexture&&this.pickTexture.destroy(),this.pickTexture=this.device.createTexture({size:[this.canvas.width,this.canvas.height],format:"r32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),this.pickTextureSize=[this.canvas.width,this.canvas.height])}writePickVectors(e){let a=new ArrayBuffer(Ns*12),s=new DataView(a),r=0,n=[];for(let i of e){let o=this.vectorChunks.get(i.id);if(!o?.segments?.length&&!o?.fills?.length&&!o?.images?.length)continue;let c=this._pickSourcePointByPage?.get(i.id),d=c?[c[0]-2.5,c[1]-2.5,c[0]+2.5,c[1]+2.5]:[0,0,i.sourceWidthMm,i.sourceHeightMm],h=xc(o.spatial,d);for(let u of h.images){if(!lt(u.bounds,d))continue;let m=this.featuresById.get(u.featureId);!m||Fa(m)||n.push({page:i,image:u,feature:m,priority:Ca(m)-5})}for(let u of h.fills){if(!lt(u.bounds,d))continue;let m=this.featuresById.get(u.featureId);!m||Fa(m)||n.push({page:i,fill:u,feature:m,priority:Ca(m)-2})}for(let u of h.segments){if(!lt(u.bounds,d))continue;let m=this.featuresById.get(u.featureId);!m||Fa(m)||n.push({page:i,segment:u,feature:m,priority:Ca(m)})}}n.sort((i,o)=>i.priority-o.priority);for(let{page:i,segment:o,fill:c,image:d,feature:h}of n){if(r+6>Ns)break;if(d){let u=this.sourceToWorld(i,[d.xMm,d.yMm]),m=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm]),p=this.sourceToWorld(i,[d.xMm,d.yMm+d.heightMm]),f=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm+d.heightMm]);r=cn(s,r,u,m,p,d.featureId),r=cn(s,r,p,m,f,d.featureId)}else if(c){let u=c.worldPoints||c.points.map(m=>this.sourceToWorld(i,m));r=cn(s,r,u[0],u[1],u[2],c.featureId)}else{let u=Math.max(this.segmentWorldWidth(i,o,h,!1),this.scale*7);for(let m of this.visibleSegmentParts(i,o,h)){if(r+6>Ns)break;let p=m.worldA||this.sourceToWorld(i,m.a),f=m.worldB||this.sourceToWorld(i,m.b);r=Up(s,r,p,f,u,o.featureId)}}}return r?(this.device.queue.writeBuffer(this.pickVertexBuffer,0,a,0,r*12),r):0}async gpuPickFeature(e,a,s){if(this.pickPending)return null;let r=this.clientToSource(e,a,s);this._pickSourcePointByPage=new Map([[e.id,r]]);let n=this.writePickVectors([e]);if(this._pickSourcePointByPage=null,!n)return null;this.resize(),this.writeGlobals(),this.ensurePickTexture();let i=this.canvas.getBoundingClientRect(),o=Math.max(0,Math.min(this.canvas.width-1,Math.floor((a-i.left)*this.canvas.width/i.width))),c=Math.max(0,Math.min(this.canvas.height-1,Math.floor((s-i.top)*this.canvas.height/i.height))),d=this.device.createCommandEncoder(),h=d.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});h.setPipeline(this.pickPipeline),h.setBindGroup(0,this.edgeBindGroup),h.setVertexBuffer(0,this.pickVertexBuffer),h.draw(n),h.end(),d.copyTextureToBuffer({texture:this.pickTexture,origin:{x:o,y:c}},{buffer:this.pickReadBuffer,bytesPerRow:256,rowsPerImage:1},{width:1,height:1,depthOrArrayLayers:1}),this.pickPending=!0,this.device.queue.submit([d.finish()]);try{await this.pickReadBuffer.mapAsync(GPUMapMode.READ);let u=new DataView(this.pickReadBuffer.getMappedRange()).getUint32(0,!0);return this.pickReadBuffer.unmap(),u&&this.featuresById.get(u)||null}finally{this.pickReadBuffer.mapState==="mapped"&&this.pickReadBuffer.unmap(),this.pickPending=!1}}hitResidentVectorFeature(e,a,s,r){if(!this.isNativeScene)return null;let n=this.vectorChunks.get(e.id);if(!n?.loaded)return null;let i=null;for(let o of n.segments){let c=this.featuresById.get(o.featureId),d=Math.max(r,(o.widthMm||0)*.5+r*.45);if(c)for(let h of this.visibleSegmentParts(e,o,c)){let u=Dp([a,s],h.a,h.b);if(u>d)continue;let m=u-Ca(c)*.025+(Ba(c)?0:8);(!i||m<i.score)&&(i={feature:c,score:m})}}return i?.feature||null}segmentWorldWidth(e,a,s,r){let n=(a.widthMm||.15)/Math.max(1,e.sourceWidthMm)*e.widthMm;return Math.max(n,this.scale*Bp(s,a.kind,r))}pan(e,a){let s=this.canvas.width/Math.max(1,this.canvas.clientWidth);this.center[0]-=e*this.scale*s,this.center[1]-=a*this.scale*s}zoom(e,a,s){let r=this.screenToWorld(a,s);this.scale=ne(this.scale*Math.exp(e*.0015),.015,16);let n=this.screenToWorld(a,s);this.center[0]+=r[0]-n[0],this.center[1]+=r[1]-n[1]}framePage(e){e&&(this.resize(),this.center=[e.worldX+e.widthMm/2,e.worldY+e.heightMm/2],this.scale=Math.max(e.widthMm/Math.max(1,this.canvas.width*.88),e.heightMm/Math.max(1,this.canvas.height*.84)))}frameWorld(){this.resize(),this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/Math.max(1,this.canvas.width*.9),(this.world.maxY-this.world.minY)/Math.max(1,this.canvas.height*.88),.05)}};function yp(t){return t.thumbnail?.path||t.svg}function xp(t){if(t.schema==="prism.schematic_vector_a0.features"){let e=new Map((t.features||[]).map(s=>[Number(s.id),s])),a={};for(let[s,r]of Object.entries(t.pages||{}))a[s]=r.map(n=>e.get(Number(n))).filter(Boolean);return a}return t.pages||{}}function wp(t){let e=[],a=[],s=[];for(let r of t){let n=Number(r.featureId||0);if(!n)continue;if(r.kind==="plotimage"&&r.image?.path){let g=r.xMm||0,x=r.yMm||0,v=r.widthMm||0,T=r.heightMm||0;s.push({featureId:n,kind:r.kind,xMm:g,yMm:x,widthMm:v,heightMm:T,bounds:[g,x,g+v,x+T],path:r.image.path});continue}let i=String(r.semanticRole||""),o=r.radiusMm||r.diameterMm/2||0,c=String(r.fill||"").toUpperCase()==="FILLED_SHAPE",d=r.widthMm||r.pen_widthMm||(i==="junction"?.08:.15),h=String(r.lineStyle||r.line_style||"DEFAULT").toUpperCase(),u=r.color||r.strokeColor||r.style?.color||"",m=r.fillColor||r.color||r.style?.color||"",p=(g,x)=>Ip(e,{featureId:n,kind:r.kind,widthMm:d,lineStyle:h,color:u},g,x),f=r.x1Mm,l=r.y1Mm,y=r.x2Mm,b=r.y2Mm;if(r.trianglesMm?.length){for(let g of r.trianglesMm)Array.isArray(g)&&g.length===3&&a.push({featureId:n,kind:r.kind,color:m,points:g,bounds:Tc(g)});if(r.pointsMm?.length>=2){for(let g=1;g<r.pointsMm.length;g+=1)p(r.pointsMm[g-1],r.pointsMm[g]);wc(r)&&p(r.pointsMm[r.pointsMm.length-1],r.pointsMm[0])}}else if(r.pointsMm?.length>=2){c&&r.pointsMm.length>=3&&kp(a,n,r.kind,r.pointsMm,m);for(let g=1;g<r.pointsMm.length;g+=1)p(r.pointsMm[g-1],r.pointsMm[g]);wc(r)&&p(r.pointsMm[r.pointsMm.length-1],r.pointsMm[0])}else if(r.polylinesMm?.length){for(let g of r.polylinesMm)if(!(!Array.isArray(g)||g.length<2))for(let x=1;x<g.length;x+=1)p(g[x-1],g[x])}else if(Number.isFinite(f)&&Number.isFinite(l)&&Number.isFinite(y)&&Number.isFinite(b))r.kind==="rect"?(c&&Ep(a,n,r.kind,[f,l,y,b],m),p([f,l],[y,l]),p([y,l],[y,b]),p([y,b],[f,b]),p([f,b],[f,l])):p([f,l],[y,b]);else if(Number.isFinite(r.cxMm)&&Number.isFinite(r.cyMm)){let g=r.radiusMm||r.diameterMm/2||.4;c&&Tp(a,n,r.kind,[r.cxMm,r.cyMm],g,m),Sp(e,{featureId:n,kind:r.kind,widthMm:d,lineStyle:h,color:u},[r.cxMm,r.cyMm],g)}else if(r.contoursMm?.length){for(let g of r.contoursMm)if(!(!Array.isArray(g)||g.length<2)){for(let x=1;x<g.length;x+=1)p(g[x-1],g[x]);p(g[g.length-1],g[0])}}else if(Number.isFinite(r.start_xMm)&&Number.isFinite(r.start_yMm)&&Number.isFinite(r.end_xMm)&&Number.isFinite(r.end_yMm))Number.isFinite(r.mid_xMm)&&Number.isFinite(r.mid_yMm)?(p([r.start_xMm,r.start_yMm],[r.mid_xMm,r.mid_yMm]),p([r.mid_xMm,r.mid_yMm],[r.end_xMm,r.end_yMm])):p([r.start_xMm,r.start_yMm],[r.end_xMm,r.end_yMm]);else if(Number.isFinite(r.start_xMm)&&Number.isFinite(r.start_yMm)&&Number.isFinite(r.mid_xMm)&&Number.isFinite(r.mid_yMm)&&Number.isFinite(r.end_xMm)&&Number.isFinite(r.end_yMm))p([r.start_xMm,r.start_yMm],[r.mid_xMm,r.mid_yMm]),p([r.mid_xMm,r.mid_yMm],[r.end_xMm,r.end_yMm]);else if(r.boundsMm&&r.kind!=="text"){let[g,x,v,T]=r.boundsMm;p([g,x],[v,x]),p([v,x],[v,T]),p([v,T],[g,T]),p([g,T],[g,x])}}return{segments:e,fills:a,images:s}}function vp(t,e){for(let a of e.segments||[])a.worldA=da(t,a.a),a.worldB=da(t,a.b);for(let a of e.fills||[])a.worldPoints=a.points.map(s=>da(t,s));for(let a of e.images||[])a.worldOrigin=da(t,[a.xMm,a.yMm]),a.worldSize=Mp(t,a.widthMm,a.heightMm)}function da(t,e){return[t.worldX+e[0]/t.sourceWidthMm*t.widthMm,t.worldY+e[1]/t.sourceHeightMm*t.heightMm]}function Mp(t,e,a){return[e/t.sourceWidthMm*t.widthMm,a/t.sourceHeightMm*t.heightMm]}function Ep(t,e,a,s,r){let[n,i,o,c]=s;t.push({featureId:e,kind:a,color:r,points:[[n,i],[o,i],[n,c]],bounds:[n,i,o,c]},{featureId:e,kind:a,color:r,points:[[n,c],[o,i],[o,c]],bounds:[n,i,o,c]})}function Tp(t,e,a,s,r,n){for(let o=0;o<36;o+=1){let c=o/36*Math.PI*2,d=(o+1)/36*Math.PI*2;t.push({featureId:e,kind:a,color:n,points:[s,[s[0]+Math.cos(c)*r,s[1]+Math.sin(c)*r],[s[0]+Math.cos(d)*r,s[1]+Math.sin(d)*r]],bounds:[s[0]-r,s[1]-r,s[0]+r,s[1]+r]})}}function kp(t,e,a,s,r){let n=s[0],i=Tc(s);for(let o=2;o<s.length;o+=1)t.push({featureId:e,kind:a,color:r,points:[n,s[o-1],s[o]],bounds:i})}function Ip(t,e,a,s){let r=yc(a,s,e.widthMm||.15),n=e.lineStyle||"DEFAULT";if(!["DASH","DASHED","DOT","DOTTED","DASHDOT","DASH_DOT"].includes(n)){t.push({...e,a,b:s,bounds:r});return}let i=s[0]-a[0],o=s[1]-a[1],c=Math.hypot(i,o);if(c<1e-6)return;let d=i/c,h=o/c,u=Math.max(e.widthMm*4,.45),m=n.includes("DOT")?[u*.8,u*.75,u*3,u*.75]:[u*3,u*1.5],p=0,f=0;for(;p<c;){let l=Math.min(m[f%m.length],c-p);if(f%2===0){let y=[a[0]+d*p,a[1]+h*p],b=[a[0]+d*(p+l),a[1]+h*(p+l)];t.push({...e,a:y,b,bounds:yc(y,b,e.widthMm||.15)})}p+=l,f+=1}}function Sp(t,e,a,s){for(let n=0;n<32;n+=1){let i=n/32*Math.PI*2,o=(n+1)/32*Math.PI*2;t.push({...e,a:[a[0]+Math.cos(i)*s,a[1]+Math.sin(i)*s],b:[a[0]+Math.cos(o)*s,a[1]+Math.sin(o)*s],bounds:[a[0]-s,a[1]-s,a[0]+s,a[1]+s]})}}function Tc(t,e=0){let a=1/0,s=1/0,r=-1/0,n=-1/0;for(let i of t||[])a=Math.min(a,i[0]),s=Math.min(s,i[1]),r=Math.max(r,i[0]),n=Math.max(n,i[1]);return Number.isFinite(a)?[a-e,s-e,r+e,n+e]:[0,0,0,0]}function yc(t,e,a=0){let s=Math.max(.05,a*.5);return[Math.min(t[0],e[0])-s,Math.min(t[1],e[1])-s,Math.max(t[0],e[0])+s,Math.max(t[1],e[1])+s]}function lt(t,e){return!t||!e?!0:t[0]<=e[2]&&t[2]>=e[0]&&t[1]<=e[3]&&t[3]>=e[1]}function Rp(t){let e={cellSize:gp,cells:new Map,segments:t.segments||[],fills:t.fills||[],images:t.images||[],queryId:0};for(let a of e.segments)nn(e,"segments",a);for(let a of e.fills)nn(e,"fills",a);for(let a of e.images)nn(e,"images",a);return e}function nn(t,e,a){let s=a.bounds;if(!s)return;let r=Math.floor(s[0]/t.cellSize),n=Math.floor(s[2]/t.cellSize),i=Math.floor(s[1]/t.cellSize),o=Math.floor(s[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=r;d<=n;d+=1){let h=`${d}:${c}`,u=t.cells.get(h);u||(u={segments:[],fills:[],images:[]},t.cells.set(h,u)),u[e].push(a)}}function xc(t,e){if(!t)return{segments:[],fills:[],images:[]};t.queryId=(t.queryId||0)+1;let a=t.queryId,s={segments:[],fills:[],images:[]},r=Math.floor(e[0]/t.cellSize),n=Math.floor(e[2]/t.cellSize),i=Math.floor(e[1]/t.cellSize),o=Math.floor(e[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=r;d<=n;d+=1){let h=t.cells.get(`${d}:${c}`);h&&(on(h.segments,s.segments,a,"segments"),on(h.fills,s.fills,a,"fills"),on(h.images,s.images,a,"images"))}return s}function on(t,e,a,s){let r=`_${s}QueryId`;for(let n of t)n[r]!==a&&(n[r]=a,e.push(n))}function wc(t){let e=String(t.kind||"");if(String(t.fill||"").toUpperCase()==="FILLED_SHAPE"||t.closed===!0||["polygon","fill"].includes(e))return!0;let s=t.pointsMm||[];if(s.length>=3){let r=s[0],n=s[s.length-1];return Math.hypot(r[0]-n[0],r[1]-n[1])<1e-6}return!1}function Ba(t){return!!t?.netUid}function Ap(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="pin"||e==="pin_body"||e==="label"||e==="global_label"||e==="hierarchical_label"||e==="netclass_flag"||e==="power_symbol"||e==="power_port"||a==="label"||a==="global_label"||a==="hierarchical_label"}function _p(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="global_label"||a==="global_label"?130:e==="hierarchical_label"||a==="hierarchical_label"?125:e==="label"||a==="label"?118:e==="pin"||e==="pin_body"?106:e==="power_symbol"||e==="power_port"||e==="netclass_flag"?98:50}function Np(t){if(t.length<=gc)return t;let e=t.slice(0,gc);return e.sort((a,s)=>a.source[1]-s.source[1]||a.source[0]-s.source[0]),e}function Cp(t,e,a={}){if(!t||!e?.length)return null;let s=a.featureId||a.stableKey||a.sourceId?e.find(d=>a.featureId&&Number(d.featureId||0)===Number(a.featureId)||a.stableKey&&d.stableKey===a.stableKey||a.sourceId&&d.sourceId===a.sourceId):null;if(s)return{...s,kind:"selected-net-occurrence",priority:200};let r=e.filter(d=>d.priority>=118).slice(0,16),n=r.length?r:e.slice(0,16),i=0,o=0;for(let d of n)i+=d.world[0],o+=d.world[1];let c=[i/n.length,o/n.length];return{pageId:t.id,featureId:n[0]?.featureId||0,kind:"page-net-occurrence",source:[0,0],world:c,bounds:[c[0],c[1],c[0],c[1]],priority:1}}function vc(t,e,a){if(!t||t.length<2)return[];let s=t.map(i=>({...i})).sort((i,o)=>i.world[1]-o.world[1]||i.world[0]-o.world[0]),r=[],n=s.shift();for(;s.length;){let i=0,o=1/0;for(let d=0;d<s.length;d+=1){let h=s[d],u=Math.hypot(h.world[0]-n.world[0],h.world[1]-n.world[1]);u<o&&(o=u,i=d)}let c=s.splice(i,1)[0];r.push({type:e,pageId:a||n.pageId||c.pageId||"",a:n.world,b:c.world,sourceFeatureIds:[n.featureId,c.featureId].filter(Boolean)}),n=c}return r}function Mc(t,e=0){return[Math.min(t.a[0],t.b[0])-e,Math.min(t.a[1],t.b[1])-e,Math.max(t.a[0],t.b[0])+e,Math.max(t.a[1],t.b[1])+e]}function Ca(t){let e=String(t?.kind||""),s=String(t?.semanticRole||"")||e;return s==="pin_number"||s==="pin_name"?120:s==="pin_body"||e==="pin"?110:s==="symbol_reference"||s==="symbol_value"?92:e==="junction"||e==="no_connect"?88:e==="wire"||e==="bus"||e==="bus_entry"?78:s==="symbol_body"||e==="symbol_body"?45:e==="symbol_instance"||e==="symbol_overplot"?30:e==="text"||String(s).includes("text")?24:10}function Fa(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");if(e==="page"||e==="sheet_header")return!0;if(e==="graphic_rect"&&a==="graphic_rect"&&!t?.netUid&&!t?.componentUid){let s=t.boundsMm||[];return s[2]-s[0]>150&&s[3]-s[1]>120}return!1}function Fp(t){if(!t||typeof t!="string")return null;let a=t.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);if(!a)return null;let s=a[1],r=a[2]??"ff";return[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255,parseInt(r,16)/255]}function ln(t,e,a=""){let s=Fp(a||t?.color||"");return t?.kind==="dnp_marker"?s||[.86,.04,.05,.85]:t?.dnp&&["symbol_reference","symbol_value","symbol_text"].includes(String(t?.kind||""))?[.5,.52,.54,.56]:s||(t?.dnp?[.5,.52,.54,.56]:Ba(t)?[.12,.56,.2,.96]:t?.kind==="pin_name"?[0,.28,.31,.96]:t?.kind==="pin_number"?[.45,.17,.16,.96]:t?.kind==="pin_body"?[.28,.18,.18,.88]:t?.kind==="symbol_body"||t?.kind==="symbol_instance"?[.42,.18,.18,.72]:t?.kind==="symbol_reference"||t?.kind==="symbol_value"?[.05,.13,.16,.94]:t?.kind==="text"||String(e||"").startsWith("text")?[.05,.13,.16,.94]:[.16,.17,.19,.7])}function Ec(t,e,a=""){let s=ln(t,e,a);return[s[0]*.72,s[1]*.72,s[2]*.72,Math.min(s[3],.38)]}function Bp(t,e,a){return a?5.5:t?.kind==="dnp_marker"?3:["pin_name","pin_number"].includes(String(t?.kind||""))?1.5:t?.kind==="pin_body"?1.7:String(e||"").startsWith("text")?1.35:e==="bus"||t?.kind==="bus"?4.2:Ba(t)?2.6:t?.kind==="symbol_body"||t?.kind==="symbol_instance"||t?.kind==="sheet"?1.5:1.25}function Fs(t,e,a,s){return t[e++]=a[0],t[e++]=a[1],t[e++]=s[0],t[e++]=s[1],t[e++]=s[2],t[e++]=s[3],e}function jp(t,e,a,s,r,n){let i=kc(a,s,r);if(!i)return e;for(let o of i)e=Fs(t,e,o,n);return e}function Op(t,e,a,s,r,n){return e=Fs(t,e,a,n),e=Fs(t,e,s,n),e=Fs(t,e,r,n),e}function la(t,e,a,s,r){return t[e++]=a[0],t[e++]=a[1],t[e++]=s,t[e++]=r,e}function Pp(t,e,a,s,r,n,i,o){let c=s[0]-a[0],d=s[1]-a[1],h=Math.hypot(c,d);if(h<1e-6||e+24>t.length)return e;let u=r*.5,m=c/h,f=-(d/h)*u,l=m*u,y=[a[0]+f,a[1]+l],b=[a[0]-f,a[1]-l],g=[s[0]+f,s[1]+l],x=[s[0]-f,s[1]-l],v=i+h/Math.max(o,1e-6);return e=la(t,e,y,i,n),e=la(t,e,b,i,n),e=la(t,e,g,v,n),e=la(t,e,g,v,n),e=la(t,e,b,i,n),e=la(t,e,x,v,n),e}function kc(t,e,a){let s=e[0]-t[0],r=e[1]-t[1],n=Math.hypot(s,r);if(n<1e-6)return null;let i=a*.5,o=s/n*i,c=r/n*i,d=-r/n*i,h=s/n*i,u=[t[0]-o,t[1]-c],m=[e[0]+o,e[1]+c],p=[u[0]+d,u[1]+h],f=[u[0]-d,u[1]-h],l=[m[0]+d,m[1]+h],y=[m[0]-d,m[1]-h];return[p,f,l,l,f,y]}function Dp(t,e,a){let s=a[0]-e[0],r=a[1]-e[1],n=s*s+r*r||1,i=ne(((t[0]-e[0])*s+(t[1]-e[1])*r)/n,0,1),o=e[0]+s*i,c=e[1]+r*i;return Math.hypot(t[0]-o,t[1]-c)}function Lp(t,e){let[a,s,r,n]=e,[i,o]=t.a,[c,d]=t.b,h=1e-6,u=(m,p)=>({...t,a:m,b:p});if(Math.abs(o-d)<=h){let m=o;if(m<s-h||m>n+h)return[t];let p=Math.min(i,c),f=Math.max(i,c),l=Math.max(p,a),y=Math.min(f,r);if(y<=l+h)return[t];let b=[],g=i<=c;if(p<l-h){let x=g?[p,m]:[l,m],v=g?[l,m]:[p,m];b.push(u(x,v))}if(y<f-h){let x=g?[y,m]:[f,m],v=g?[f,m]:[y,m];b.push(u(x,v))}return b}if(Math.abs(i-c)<=h){let m=i;if(m<a-h||m>r+h)return[t];let p=Math.min(o,d),f=Math.max(o,d),l=Math.max(p,s),y=Math.min(f,n);if(y<=l+h)return[t];let b=[],g=o<=d;if(p<l-h){let x=g?[m,p]:[m,l],v=g?[m,l]:[m,p];b.push(u(x,v))}if(y<f-h){let x=g?[m,y]:[m,f],v=g?[m,f]:[m,y];b.push(u(x,v))}return b}return[t]}function Bs(t,e,a,s){let r=e*12;t.setFloat32(r,a[0],!0),t.setFloat32(r+4,a[1],!0),t.setUint32(r+8,s,!0)}function Up(t,e,a,s,r,n){let i=kc(a,s,r);if(!i)return e;for(let o of i)Bs(t,e,o,n),e+=1;return e}function cn(t,e,a,s,r,n){return Bs(t,e,a,n),Bs(t,e+1,s,n),Bs(t,e+2,r,n),e+3}function Gp(t,e){let a=Array.isArray(t?.layerIds)?t.layerIds:[];if(a.length<2&&t?.startLayerId!=null&&t?.endLayerId!=null&&(a=[t.startLayerId,t.endLayerId]),a.length<2&&t?.layerMask!=null)try{let s=BigInt(String(t.layerMask));a=e.filter((r,n)=>(s&1n<<BigInt(n))!==0n).map(r=>r.id)}catch{a=[]}return a}function Kp(t){let e=t?.objectFeatureId??t?.id;if(e!=null&&Number.isFinite(Number(e))&&Number(e)!==0)return`feature:${Number(e)}`;let a=String(t?.sourceUid||"");return a?`source:${a}`:""}function Ic(t,e){let a=new Map(t.map((o,c)=>[Number(o.id),c])),s=new Map(t.map(o=>[Number(o.id),o])),r=new Map,n=new Set,i={thru:0,blind:0,buried:0};for(let o of e){let c=Kp(o);if(c){if(n.has(c))continue;n.add(c)}let d=[...new Set(Gp(o,t).map(Number))].filter(x=>a.has(x)).sort((x,v)=>a.get(x)-a.get(v));if(d.length<2)continue;let h=d[0],u=d[d.length-1],m=a.get(h),p=a.get(u),f=m===0,l=p===t.length-1,y=f&&l?"thru":f||l?"blind":"buried";i[y]+=1;let b=`${h}:${u}:${y}`,g=r.get(b);if(g){g.count+=1;continue}r.set(b,{startId:h,endId:u,startName:s.get(h)?.name||String(h),endName:s.get(u)?.name||String(u),startIndex:m,endIndex:p,type:y,count:1})}return{counts:i,spans:[...r.values()]}}var ja="http://www.w3.org/2000/svg";var zp=new Set(["script","foreignobject","iframe","object","embed"]),Vp=new Set(["href","xlink:href"]),Hp=1,qp=18,Xp=8,Ds=class t{static create(e,a,s,r,n={}){return new t(e,a,s,r,n)}constructor(e,a,s,r,n){this.host=e,this.manifestUrl=a,this.manifest=s,this.featuresByPage=r||{},this.callbacks=n,this.activePage=null,this.activeSvgUrl="",this.container=null,this.svg=null,this.overlay=null,this.mountedPages=new Map,this.loadingPages=new Map,this.svgCache=new Map,this.serial=0,this.maxMountedWorldPages=Hp,this.maxCachedSvgPages=qp,this.worldHandlersInstalled=!1,this.worldDrag=null,this.view={scale:1,tx:0,ty:0},this.drag=null,this.selected=null,this.highlightedNetUid="",this.index=_c(),this.lastStats={mountedPages:0,domNodes:0,indexedFeatures:0,indexedNets:0,mountMs:0,coldMounts:0,warmMounts:0,highlightMs:0,selectionMs:0,cachedSvgPages:0,cachedSvgBytes:0,heapMb:null,fallbackReason:""}}get active(){return!!(this.container&&this.activePage)}get worldActive(){return this.mountedPages.size>0}stats(){return{...this.lastStats,activePage:this.activePage?.name||[...this.mountedPages.values()][0]?.page?.name||"-",mountedPages:this.active?1:this.mountedPages.size}}dispose(){this.unmountPage(),this.unmountWorldPages()}unmountPage(){this.container?.remove(),this.container=null,this.svg=null,this.overlay=null,this.activePage=null,this.activeSvgUrl="",this.index=_c(),this.host.hidden=!0}unmountWorldPages(){for(let e of this.mountedPages.values())e.container.remove();this.mountedPages.clear(),this.loadingPages.clear(),this.active||(this.host.hidden=!0)}async preloadPages(e){let a=performance.now(),s=await Promise.allSettled((e||[]).slice(0,Xp).map(r=>this.loadSvgTemplate(r)));this.lastStats.preloadedPages=s.filter(r=>r.status==="fulfilled"&&r.value).length,this.lastStats.preloadMs=performance.now()-a,this.updateCacheStats()}syncWorldPages(e,a,s={}){if(!a)return;this.installWorldHandlers(a);let r=(e||[]).slice(0,s.maxMountedPages||this.maxMountedWorldPages),n=new Set(r.map(i=>i.id));for(let[i,o]of this.mountedPages)n.has(i)||(o.container.remove(),this.mountedPages.delete(i));for(let i of r){let o=this.mountedPages.get(i.id);if(o)o.lastUsed=++this.serial,this.positionWorldEntry(o,a);else if(!this.loadingPages.has(i.id)){let c=this.mountWorldPage(i).then(d=>{d&&n.has(i.id)?this.positionWorldEntry(d,a):d?.container.remove()}).finally(()=>this.loadingPages.delete(i.id));this.loadingPages.set(i.id,c)}}this.pruneMountedWorldPages(n),this.host.hidden=r.length===0&&!this.active,this.setSelection(this.selected),this.setHighlightedNet(s.activeNetUid??this.highlightedNetUid),this.lastStats.mountedPages=this.mountedPages.size,this.updateCacheStats()}async mountWorldPage(e){let a=performance.now(),s=this.hasCachedSvg(e),r=await this.loadImportedSvg(e);if(!r)return null;let n=document.createElement("div");n.className="svg-dom-page svg-dom-world-page",n.dataset.pageId=e.id,n.append(r),this.host.append(n);let i=Rc(r),o=Ac(r),c=Sc(r,e,this.featuresByPage[e.id]||[]),d={page:e,container:n,svg:r,overlay:i,selectionOverlay:o,index:c,mountMs:performance.now()-a,lastUsed:++this.serial,warm:s};return this.mountedPages.set(e.id,d),this.lastStats={...this.lastStats,mountedPages:this.mountedPages.size,domNodes:[...this.mountedPages.values()].reduce((h,u)=>h+u.svg.querySelectorAll("*").length,0),indexedFeatures:[...this.mountedPages.values()].reduce((h,u)=>h+u.index.featureToElements.size,0),indexedNets:new Set([...this.mountedPages.values()].flatMap(h=>[...h.index.netToElements.keys()])).size,mountMs:d.mountMs,coldMounts:this.lastStats.coldMounts+(d.warm?0:1),warmMounts:this.lastStats.warmMounts+(d.warm?1:0),fallbackReason:""},this.updateCacheStats(),d}async loadImportedSvg(e){let a=await this.loadSvgTemplate(e);return a?a.cloneNode(!0):null}async loadSvgTemplate(e){let a=this.svgUrlForPage(e),s=this.svgCache.get(a);if(s?.template)return s.lastUsed=++this.serial,s.template;if(s?.promise)return s.promise;let r=performance.now(),n=(async()=>{let i=await fetch(a,{cache:"default"});if(!i.ok)return this.lastStats.fallbackReason=`Failed to load SVG page ${e.id}: ${i.status}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;let o=await i.text(),d=new DOMParser().parseFromString(o,"image/svg+xml"),h=d.documentElement;if(!h||h.localName.toLowerCase()!=="svg"||d.querySelector("parsererror"))return this.lastStats.fallbackReason=`Invalid SVG for page ${e.id}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;Wp(d,a,e.id);let u=document.importNode(h,!0);u.classList.add("svg-dom-page-svg"),eg(u);let m=this.svgCache.get(a)||{};return Object.assign(m,{template:u,promise:null,pageId:e.id,byteLength:o.length*2,loadMs:performance.now()-r,lastUsed:++this.serial}),this.svgCache.set(a,m),this.pruneSvgCache(),this.updateCacheStats(),u})();return this.svgCache.set(a,{promise:n,pageId:e.id,byteLength:0,loadMs:0,lastUsed:++this.serial}),n}svgUrlForPage(e){return new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString()}positionWorldEntry(e,a){let{page:s,container:r}=e,[n,i]=a.worldToScreen(s.worldX,s.worldY),[o,c]=a.worldToScreen(s.worldX+s.widthMm,s.worldY+s.heightMm),d=Math.max(1,o-n),h=Math.max(1,c-i);r.style.transform=`translate3d(${n}px, ${i}px, 0)`,r.style.width=`${d}px`,r.style.height=`${h}px`}installWorldHandlers(e){if(this.worldHandlersInstalled)return;this.worldHandlersInstalled=!0;let a=this.host;a.oncontextmenu=s=>s.preventDefault(),a.onpointerdown=s=>{let r=s.button===0&&!s.shiftKey&&!!s.target.closest?.("text"),i=s.target.closest?.("[data-feature-key]")?null:this.featureAtEvent(s);this.worldDrag={pointerId:s.pointerId,startX:s.clientX,startY:s.clientY,lastX:s.clientX,lastY:s.clientY,button:s.button,moved:!1,pan:!r&&(s.button===0||s.button===1||s.shiftKey),allowTextSelection:r},r||a.setPointerCapture(s.pointerId)},a.onpointermove=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let r=s.clientX-this.worldDrag.lastX,n=s.clientY-this.worldDrag.lastY;this.worldDrag.lastX=s.clientX,this.worldDrag.lastY=s.clientY,Math.hypot(s.clientX-this.worldDrag.startX,s.clientY-this.worldDrag.startY)>3&&(this.worldDrag.moved=!0),this.worldDrag.pan&&e.pan(r,n)},a.onpointerup=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let r=this.worldDrag;if(this.worldDrag=null,r.allowTextSelection||a.releasePointerCapture(s.pointerId),r.button!==0||r.moved)return;let n=s.target.closest?.("[data-feature-key]");if(n)this.selectElement(n,s);else{let i=this.featureAtEvent(s);i?this.selectFeature(i.entry,i.feature,s):this.callbacks.onBlank?.()}},a.ondblclick=s=>{let r=s.target.closest?.("[data-feature-key]"),n=r?null:this.featureAtEvent(s),i=n?.entry||this.entryForPoint(s.clientX,s.clientY),o=r?this.selectionFromElement(r):n?this.selectionFromFeature(n.entry,n.feature):this.selected;Nc(o)?this.callbacks.onOpenPage?.(o):o?.netUid?this.callbacks.onHighlightNet?.(o.netUid,o):!n&&i?.page&&this.callbacks.onOpenPage?.({kind:"page",pageId:i.page.id,page:i.page})},a.onwheel=s=>{s.preventDefault(),Math.abs(s.deltaX)>Math.abs(s.deltaY)*.65?e.pan(-s.deltaX,-s.deltaY):e.zoom(s.deltaY,s.clientX,s.clientY)}}async focusPage(e,a={}){if(!e)return!1;if(this.activePage?.id===e.id&&this.active)return a.frame!==!1&&this.fitPage(),!0;let s=performance.now(),r=await this.loadImportedSvg(e);if(!r)return!1;let n=document.createElement("div");return n.className="svg-dom-page",n.append(r),this.host.replaceChildren(n),this.host.hidden=!1,this.container=n,this.svg=r,this.activePage=e,this.activeSvgUrl=new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString(),this.overlay=Rc(r),this.selectionOverlay=Ac(r),this.index=Sc(r,e,this.featuresByPage[e.id]||[]),this.installPageHandlers(),this.fitPage(),this.setSelection(this.selected),this.setHighlightedNet(this.highlightedNetUid),this.lastStats={...this.lastStats,mountedPages:1,domNodes:r.querySelectorAll("*").length,indexedFeatures:this.index.featureToElements.size,indexedNets:this.index.netToElements.size,mountMs:performance.now()-s,fallbackReason:""},this.updateCacheStats(),!0}installPageHandlers(){let e=this.host;e.oncontextmenu=a=>a.preventDefault(),e.onpointerdown=a=>{if(!this.active)return;let s=a.button===0&&!a.shiftKey&&!!a.target.closest?.("text"),r=a.target.closest?.("[data-feature-key]"),n=r?null:this.featureAtEvent(a);this.drag={pointerId:a.pointerId,startX:a.clientX,startY:a.clientY,lastX:a.clientX,lastY:a.clientY,button:a.button,moved:!1,pan:!s&&(a.button===0||a.button===1||a.shiftKey),featureElement:r,allowTextSelection:s},s||e.setPointerCapture(a.pointerId)},e.onpointermove=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=a.clientX-this.drag.lastX,r=a.clientY-this.drag.lastY;this.drag.lastX=a.clientX,this.drag.lastY=a.clientY,Math.hypot(a.clientX-this.drag.startX,a.clientY-this.drag.startY)>3&&(this.drag.moved=!0),this.drag.pan&&(this.view.tx+=s,this.view.ty+=r,this.applyTransform())},e.onpointerup=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=this.drag;if(this.drag=null,s.allowTextSelection||e.releasePointerCapture(a.pointerId),s.button!==0||s.moved)return;let r=a.target.closest?.("[data-feature-key]");if(r)this.selectElement(r,a);else{let n=this.featureAtEvent(a);n?this.selectFeature(n.entry,n.feature,a):this.callbacks.onBlank?.()}},e.ondblclick=a=>{let s=a.target.closest?.("[data-feature-key]"),r=s?null:this.featureAtEvent(a),n=s?this.selectionFromElement(s):r?this.selectionFromFeature(r.entry,r.feature):this.selected;Nc(n)?this.callbacks.onOpenPage?.(n):n?.netUid?this.callbacks.onHighlightNet?.(n.netUid,n):!r&&this.activePage&&this.callbacks.onOpenPage?.({kind:"page",pageId:this.activePage.id,page:this.activePage})},e.onwheel=a=>{if(a.preventDefault(),!this.active)return;if(Math.abs(a.deltaX)>Math.abs(a.deltaY)*.65){this.view.tx-=a.deltaX,this.view.ty-=a.deltaY,this.applyTransform();return}let s=this.host.getBoundingClientRect(),r=a.clientX-s.left,n=a.clientY-s.top,i=this.screenToSvg(r,n),o=Math.exp(-a.deltaY*.0016);this.view.scale=Os(this.view.scale*o,.02,80),this.view.tx=r-i[0]*this.view.scale,this.view.ty=n-i[1]*this.view.scale,this.applyTransform()}}selectElement(e,a){let s=performance.now(),r=this.selectionFromElement(e);if(this.setSelection(r),a){let n=this.host.getBoundingClientRect();r.anchor={x:a.clientX-n.left,y:a.clientY-n.top}}this.callbacks.onSelect?.(r),this.lastStats.selectionMs=performance.now()-s}selectFeature(e,a,s){let r=performance.now(),n=this.selectionFromFeature(e,a);if(this.setSelection(n),s){let i=this.host.getBoundingClientRect();n.anchor={x:s.clientX-i.left,y:s.clientY-i.top}}this.callbacks.onSelect?.(n),this.lastStats.selectionMs=performance.now()-r}selectionFromElement(e){let a=e.dataset.featureKey||"",s=this.entryForElement(e),r=s.index.featureByKey.get(a)||{};return this.selectionFromFeature(s,r,e)}selectionFromFeature(e,a,s=null){let r=a?.stableKey||s?.dataset?.featureKey||"",n=e?.page||this.activePage,i=a?.kind||s?.dataset?.role||s?.dataset?.primitive||"feature",o=a?.netUid||s?.dataset?.netUid||"",c=a?.netName||s?.dataset?.netName||"";return i==="sheet"?{kind:"sheet",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",sheetName:a?.sheet_name||a?.sheetName||s?.dataset?.sheetName||a?.objectId||"",sheetFile:a?.sheet_file||a?.sheetFile||s?.dataset?.sheetFile||"",feature:a}:i==="pin"||i==="pin_body"||i==="pin_name"||i==="pin_number"||s?.dataset?.pin?{kind:"pin",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",pinNumber:a?.pinNumber||s?.dataset?.pin||"",pinName:a?.pinName||"",netUid:o,netName:c,feature:a}:i==="symbol_body"||i==="symbol_instance"||i==="component"||s?.dataset?.ref?{kind:"component",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",netUid:o,netName:c,feature:a}:{kind:o?"feature":i,featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",role:i,netUid:o,netName:c,feature:a}}setSelection(e){this.selected=e||null;for(let s of this.host.querySelectorAll(".prism-svg-selected"))s.classList.remove("prism-svg-selected");for(let s of this.host.querySelectorAll("[data-prism-overlay='selection']"))s.replaceChildren();let a=e?.featureKey||"";if(a){for(let s of this.entries()){for(let r of s.index.featureToElements.get(a)||[])r.classList.add("prism-svg-selected");this.drawSelectionOverlay(s,e)}for(let s of this.index.featureToElements.get(a)||[])s.classList.add("prism-svg-selected");this.drawSelectionOverlay({page:this.activePage,index:this.index,selectionOverlay:this.selectionOverlay},e)}}setHighlightedNet(e){this.highlightedNetUid=e||"";let a=performance.now();for(let s of this.entries())this.updateEntryHighlight(s);if(!this.svg||!this.overlay){this.lastStats.highlightMs=performance.now()-a;return}this.updateEntryHighlight({svg:this.svg,overlay:this.overlay,index:this.index,page:this.activePage}),this.lastStats.highlightMs=performance.now()-a}updateEntryHighlight(e){if(!e?.svg||!e?.overlay||(e.overlay.replaceChildren(),!this.highlightedNetUid))return;let a=Ps(e.svg,e.page),s=document.createElementNS(ja,"rect");s.setAttribute("x",String(a[0])),s.setAttribute("y",String(a[1])),s.setAttribute("width",String(a[2])),s.setAttribute("height",String(a[3])),s.setAttribute("class","prism-svg-net-dimmer"),e.overlay.append(s);let n=(e.index.netToElements.get(this.highlightedNetUid)||[]).slice(0,2200);for(let i of n){let o=tg(i);e.overlay.append(o)}}entries(){return[...this.mountedPages.values()]}entryForElement(e){let s=e.closest?.(".svg-dom-page")?.dataset.pageId||"";return this.mountedPages.get(s)||{page:this.activePage,index:this.index,svg:this.svg,overlay:this.overlay,selectionOverlay:this.selectionOverlay}}featureAtEvent(e){let a=this.entryForPoint(e.clientX,e.clientY);if(!a)return null;let s=this.clientToSvg(a,e.clientX,e.clientY);if(!s)return null;let r=Math.max(.18,5*sg(a)),i=a.index.features.filter(o=>(o?.domBoundsMm||o?.boundsMm)&&Bc(o)).filter(o=>s[0]>=(o.domBoundsMm||o.boundsMm)[0]-r&&s[0]<=(o.domBoundsMm||o.boundsMm)[2]+r&&s[1]>=(o.domBoundsMm||o.boundsMm)[1]-r&&s[1]<=(o.domBoundsMm||o.boundsMm)[3]+r).map(o=>({feature:o,priority:ng(o),area:Math.max(1e-4,((o.domBoundsMm||o.boundsMm)[2]-(o.domBoundsMm||o.boundsMm)[0])*((o.domBoundsMm||o.boundsMm)[3]-(o.domBoundsMm||o.boundsMm)[1]))})).sort((o,c)=>c.priority-o.priority||o.area-c.area)[0]?.feature;return i?{entry:a,feature:i,point:s}:null}entryForPoint(e,a){for(let s of[...this.entries()].reverse()){let r=s.container.getBoundingClientRect();if(e>=r.left&&e<=r.right&&a>=r.top&&a<=r.bottom)return s}if(this.container){let s=this.container.getBoundingClientRect();if(e>=s.left&&e<=s.right&&a>=s.top&&a<=s.bottom)return{page:this.activePage,container:this.container,svg:this.svg,index:this.index,selectionOverlay:this.selectionOverlay}}return null}clientToSvg(e,a,s){if(!e?.container||!e?.svg||!e?.page)return null;let r=e.container.getBoundingClientRect();if(!r.width||!r.height)return null;let n=Ps(e.svg,e.page);return[n[0]+(a-r.left)/r.width*n[2],n[1]+(s-r.top)/r.height*n[3]]}drawSelectionOverlay(e,a){if(!e?.selectionOverlay||!a?.featureKey)return;let s=e.index.featureByKey.get(a.featureKey),r=s?.domBoundsMm||s?.boundsMm;if(!r)return;let[n,i,o,c]=r,d=document.createElementNS(ja,"rect");d.setAttribute("x",String(n)),d.setAttribute("y",String(i)),d.setAttribute("width",String(Math.max(.001,o-n))),d.setAttribute("height",String(Math.max(.001,c-i))),d.setAttribute("rx","0.65"),d.setAttribute("ry","0.65"),d.setAttribute("class","prism-svg-selection-box"),e.selectionOverlay.append(d)}fitPage(){if(!this.svg||!this.activePage)return;let e=Ps(this.svg,this.activePage),a=e[2]||this.activePage.sourceWidthMm||this.activePage.widthMm||1,s=e[3]||this.activePage.sourceHeightMm||this.activePage.heightMm||1,r=this.host.getBoundingClientRect(),n=Math.min(r.width/a,r.height/s)*.92;this.view.scale=Os(n,.02,80),this.view.tx=(r.width-a*this.view.scale)/2-e[0]*this.view.scale,this.view.ty=(r.height-s*this.view.scale)/2-e[1]*this.view.scale,this.applyTransform()}frameSelection(e=this.selected){if(!e?.featureKey||!this.active){this.fitPage();return}let a=this.index.featureToElements.get(e.featureKey)||[],s=Fc(a);if(!s)return;let r=this.host.getBoundingClientRect(),n=Math.max(1,s[2]-s[0]),i=Math.max(1,s[3]-s[1]),o=Math.min(r.width/n,r.height/i)*.36;this.view.scale=Os(o,.04,80),this.view.tx=r.width/2-(s[0]+s[2])/2*this.view.scale,this.view.ty=r.height/2-(s[1]+s[3])/2*this.view.scale,this.applyTransform()}pan(e,a){this.active&&(this.view.tx+=e,this.view.ty+=a,this.applyTransform())}zoom(e,a,s){if(!this.active)return;let r=this.host.getBoundingClientRect(),n=(a??r.left+r.width/2)-r.left,i=(s??r.top+r.height/2)-r.top,o=this.screenToSvg(n,i),c=Math.exp(-e*.0016);this.view.scale=Os(this.view.scale*c,.02,80),this.view.tx=n-o[0]*this.view.scale,this.view.ty=i-o[1]*this.view.scale,this.applyTransform()}screenToSvg(e,a){return[(e-this.view.tx)/Math.max(1e-6,this.view.scale),(a-this.view.ty)/Math.max(1e-6,this.view.scale)]}applyTransform(){this.container&&(this.container.style.transform=`translate3d(${this.view.tx}px, ${this.view.ty}px, 0) scale(${this.view.scale})`)}hasCachedSvg(e){return!!this.svgCache.get(this.svgUrlForPage(e))?.template}pruneMountedWorldPages(e=new Set){if(this.mountedPages.size<=this.maxMountedWorldPages)return;let a=[...this.mountedPages.entries()].filter(([s])=>!e.has(s)).sort((s,r)=>(s[1].lastUsed||0)-(r[1].lastUsed||0));for(let[s,r]of a){if(this.mountedPages.size<=this.maxMountedWorldPages)break;r.container.remove(),this.mountedPages.delete(s)}}pruneSvgCache(){let e=[...this.svgCache.entries()].filter(([,r])=>r?.template);if(e.length<=this.maxCachedSvgPages)return;let a=new Set([...this.mountedPages.values()].map(r=>this.svgUrlForPage(r.page)));this.activePage&&a.add(this.svgUrlForPage(this.activePage));let s=e.filter(([r])=>!a.has(r)).sort((r,n)=>(r[1].lastUsed||0)-(n[1].lastUsed||0));for(let[r]of s){if([...this.svgCache.values()].filter(n=>n?.template).length<=this.maxCachedSvgPages)break;this.svgCache.delete(r)}}updateCacheStats(){let e=[...this.svgCache.values()].filter(s=>s?.template);this.lastStats.cachedSvgPages=e.length,this.lastStats.cachedSvgBytes=e.reduce((s,r)=>s+(r.byteLength||0),0);let a=performance?.memory;this.lastStats.heapMb=a?.usedJSHeapSize?a.usedJSHeapSize/1048576:null}};function Wp(t,e,a){for(let n of[...t.querySelectorAll("*")]){if(zp.has(n.localName.toLowerCase())){n.remove();continue}for(let i of[...n.attributes]){let o=i.name,c=o.toLowerCase(),d=i.value||"";if(c.startsWith("on")){n.removeAttribute(o);continue}if((c==="href"||c==="xlink:href"||c==="src")&&jc(d)){if((c==="href"||c==="xlink:href")&&n.localName.toLowerCase()==="image"&&og(d))continue;n.removeAttribute(o);continue}c==="style"&&n.setAttribute(o,lg(d))}}let s=`prism-${dn(a)}-`,r=new Map;for(let n of t.querySelectorAll("[id]")){let i=n.getAttribute("id"),o=`${s}${dn(i)}`;r.set(i,o),n.setAttribute("id",o)}for(let n of t.querySelectorAll("*"))for(let i of[...n.attributes]){let o=i.name.toLowerCase(),c=i.value||"";Vp.has(o)&&(c.startsWith("#")&&r.has(c.slice(1))?c=`#${r.get(c.slice(1))}`:cg(c)&&(c=new URL(c,e).toString())),c=dg(c,r),n.setAttribute(i.name,c)}}function Sc(t,e,a){let s=new Map,r=new Map,n=new Map,i=[];for(let h of a){let u=Yp(h,e);i.push(u),r.set(u.stableKey,u),n.set(Number(u.id||0),u);for(let m of Qp(u))s.has(m)||s.set(m,[]),s.get(m).push(u)}let o=new Map,c=new Map,d=new Map;for(let h of i)d.set(h.stableKey,h);for(let h of t.querySelectorAll("[data-uuid], [data-element-key], [data-primitive], [data-ref], [data-pin], [data-object-id], [data-designator], [data-component]")){let u=Jp(h,s,e);if(u&&!Bc(u)||!u&&!ig(h))continue;let m=Zp(h,e),p=u?.stableKey||m,f=u?.netUid||"",l=u?.netName||"";h.classList.add("prism-feature"),h.dataset.featureKey=p,h.dataset.sourceId=u?.sourceId||h.dataset.uuid||h.dataset.elementKey||"",h.dataset.role=u?.kind||h.dataset.primitive||h.dataset.ref||"feature",u?.id&&(h.dataset.featureId=String(u.id)),f&&(h.dataset.netUid=f),l&&(h.dataset.netName=l),h.id||(h.id=`prism-feature-${dn(p)}`),Cc(o,p,h),d.set(p,u||{id:0,stableKey:p,kind:h.dataset.role,sourceId:h.dataset.sourceId,sheetInstancePath:e.sheetInstancePath||""}),f&&Cc(c,f,h)}for(let[h,u]of o){let m=d.get(h),p=Fc(u);m&&p&&(m.domBoundsMm=ag(m.boundsMm,p))}return{featureToElements:o,netToElements:c,featureByKey:d,byId:n,bySource:s,features:i}}function Jp(t,e,a){let r=[t.dataset.uuid,t.dataset.elementKey,t.dataset.sourceId,t.dataset.objectId,t.dataset.componentUid,t.dataset.componentUuid,t.dataset.ref&&`${t.dataset.ref}:${t.dataset.pin||""}`].filter(Boolean).flatMap(i=>e.get(i)||[]);if(!r.length)return null;let n=String(t.dataset.primitive||t.dataset.ref||t.dataset.pin||"").toLowerCase();return r.map(i=>({feature:i,score:$p(i,n,a)})).sort((i,o)=>o.score-i.score)[0].feature}function $p(t,e,a){let s=0,r=String(t.kind||"").toLowerCase();return t.sheetInstancePath===a.sheetInstancePath&&(s+=20),t.netUid&&(s+=4),e&&r.includes(e)&&(s+=8),e==="symbol"&&r==="symbol_body"&&(s+=12),(e==="label"||e==="port")&&(r.includes("label")||r.includes("port"))&&(s+=12),e==="sheet"&&r==="sheet"&&(s+=12),r!=="record"&&(s+=2),r.includes("pin")&&(s+=2),s}function Yp(t,e){let a=t.sourceId||t.sourceUid||t.uuid||t.objectId||t.stableKey||"";return{...t,id:Number(t.id||0),sourceId:a,stableKey:t.stableKey||`${e.sheetInstancePath||e.id}|${a}|0|${t.kind||"feature"}|0`,sheetInstancePath:t.sheetInstancePath||e.sheetInstancePath||""}}function Qp(t){let e=new Set([t.sourceId,t.sourceUid,t.uuid,t.objectId,t.stableKey].filter(Boolean).map(String));return t.reference&&t.pinNumber&&e.add(`${t.reference}:${t.pinNumber}`),t.componentDesignator&&e.add(t.componentDesignator),t.reference&&e.add(t.reference),[...e]}function Zp(t,e){let a=t.dataset.uuid||t.dataset.elementKey||t.dataset.objectId||t.dataset.ref||t.id||"svg",s=t.dataset.primitive||t.dataset.role||t.localName||"feature";return`${e.sheetInstancePath||e.id}|${a}|0|${s}|0`}function eg(t){let e=document.createElementNS(ja,"style");e.textContent=`
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
  `,t.prepend(e)}function Rc(t){let e=document.createElementNS(ja,"g");return e.setAttribute("class","prism-svg-net-overlay"),e.setAttribute("data-prism-overlay","net-highlight"),t.append(e),e}function Ac(t){let e=document.createElementNS(ja,"g");return e.setAttribute("class","prism-svg-selection-overlay"),e.setAttribute("data-prism-overlay","selection"),e.style.pointerEvents="none",t.append(e),e}function tg(t){let e=t.cloneNode(!0);e.removeAttribute("id"),e.removeAttribute("data-feature-key"),e.removeAttribute("data-net-uid"),e.removeAttribute("data-net-name"),e.classList.add("prism-svg-net-overlay-clone");for(let a of[e,...Array.from(e.querySelectorAll?.("*")||[])])a instanceof SVGElement&&(a.removeAttribute("filter"),a.style.pointerEvents="none",a.style.stroke="#18ef52",a.style.fill="none",a.style.opacity="0.98",a.style.vectorEffect="non-scaling-stroke");return e}function Fc(t){let e=null;for(let a of t)if(a.getBBox)try{let s=a.getBBox(),r=[s.x,s.y,s.x+s.width,s.y+s.height];e=e?[Math.min(e[0],r[0]),Math.min(e[1],r[1]),Math.max(e[2],r[2]),Math.max(e[3],r[3])]:r}catch{}return e}function ag(t,e){return t?e?[Math.min(t[0],e[0]),Math.min(t[1],e[1]),Math.max(t[2],e[2]),Math.max(t[3],e[3])]:t:e}function Ps(t,e){let a=t.getAttribute("viewBox");if(a){let s=a.trim().split(/[\s,]+/).map(Number);if(s.length===4&&s.every(Number.isFinite))return s}return[0,0,e.sourceWidthMm||e.widthMm||1,e.sourceHeightMm||e.heightMm||1]}function _c(){return{featureToElements:new Map,netToElements:new Map,featureByKey:new Map,byId:new Map,bySource:new Map,features:[]}}function sg(t){let e=t?.container?.getBoundingClientRect?.();if(!t?.svg||!t?.page||!e?.width||!e?.height)return .1;let a=Ps(t.svg,t.page);return Math.max(a[2]/e.width,a[3]/e.height)}function rg(t){let e=String(t?.kind||"").toLowerCase(),a=String(t?.semanticRole||"").toLowerCase(),s=`${t?.sourceId||""} ${t?.objectId||""} ${t?.text||""}`.toLowerCase();return e.includes("page")||a.includes("page")||e.includes("background")||a.includes("background")||s.includes("background")||s.includes("sheet_header")||s.includes("sheet header")||s.includes("drawing-sheet")}function ng(t){let e=String(t?.kind||t?.semanticRole||"").toLowerCase();return e.includes("pin")?90:e.includes("label")||e.includes("port")?78:e.includes("wire")||e.includes("bus")||e.includes("junction")?70:e.includes("symbol")||e.includes("component")?54:e.includes("image")?30:20}function Bc(t){if(!t||rg(t))return!1;let e=String(t.kind||t.semanticRole||"").toLowerCase();return["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function ig(t){let e=`${t?.dataset?.primitive||""} ${t?.dataset?.ref||""} ${t?.dataset?.role||""} ${t?.dataset?.objectId||""} ${t?.dataset?.text||""}`.toLowerCase();return!e||e.includes("background")||e.includes("sheet_header")||e.includes("sheet header")||e.includes("drawing-sheet")?!1:["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function Nc(t){return String(t?.kind||t?.feature?.kind||"").toLowerCase()==="sheet"}function Cc(t,e,a){t.has(e)||t.set(e,[]),t.get(e).push(a)}function jc(t){let e=String(t||"").trim().toLowerCase();return!e||e.startsWith("#")?!1:e.startsWith("javascript:")||e.startsWith("data:")||e.startsWith("http://")||e.startsWith("https://")}function og(t){return/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(String(t||"").trim())}function cg(t){let e=String(t||"").trim();return e&&!e.startsWith("#")&&!/^[a-z][a-z0-9+.-]*:/i.test(e)}function lg(t){return String(t||"").replace(/url\(([^)]+)\)/gi,(e,a)=>{let s=a.trim().replace(/^['"]|['"]$/g,"");return jc(s)?"none":e})}function dg(t,e){let a=String(t||"");return a=a.replace(/url\(#([^)]+)\)/g,(s,r)=>e.has(r)?`url(#${e.get(r)})`:s),a=a.replace(/^#(.+)$/,(s,r)=>e.has(r)?`#${e.get(r)}`:s),a}function dn(t){return String(t||"").trim().replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,96)||"item"}function Os(t,e,a){return Math.max(e,Math.min(a,t))}function Ls(t){return`${t.level||""}/${t.id}`}function Oc(t){let e=t.ends||[],a=t.wires||[];return e.length<2?[]:e.length===2?[{key:`${e[0].id}~${e[1].id}`,a:e[0].id,b:e[1].id,wires:new Set(a.map(s=>s.id))}]:e.map(s=>({key:`hub~${s.id}`,a:"hub",b:s.id,wires:new Set(a.filter(r=>r.from===s.id||r.to===s.id).map(r=>r.id))}))}function ug(t,e){return!e||e.harness!==t.id?!1:!t.level||!e.occurrence||e.occurrence.startsWith(`${t.level}/`)}function Pc(t,e){let a=new Map;for(let s of t||[]){let r=new Map,n=new Set((s.wires||[]).map(i=>i.id));for(let i of e||[])for(let o of i.wires||[])n.has(o.wire)&&ug(s,o)&&!r.has(o.wire)&&r.set(o.wire,i.color);r.size&&a.set(Ls(s),r)}return a}function Dc(t,e){if(!e)return null;for(let a of t.wires)if(e.has(a))return e.get(a);return null}function Lc(t,e){let a=new Map;if(!e)return a;for(let s of t.wires||[]){let r=e.get(s.id);r&&(a.has(s.from)||a.set(s.from,r),a.has(s.to)||a.set(s.to,r))}return a}function Uc(t){let e=t.filter(Boolean);return e.length<2?null:[0,1,2].map(a=>e.reduce((s,r)=>s+r[a],0)/e.length)}var fg=/_vertical(_|$)/i,hg=/_(horizontal|rightangle|right_angle|angled)(_|$)|_RA(_|$)/i,Kc=t=>t*Math.PI/180;function Gc(t){let e=t.replace(/[0-9]+$/,""),a=t.slice(e.length);return[e,a?Number.parseInt(a,10):-1,t]}function bg(t,e){let[a,s,r]=Gc(t),[n,i,o]=Gc(e);return a!==n?a<n?-1:1:s!==i?s-i:r<o?-1:r>o?1:0}function fn(t,e){let a=Kc(t.rotationDeg),s=e[0]-t.positionMm[0],r=e[1]-t.positionMm[1];return[s*Math.cos(a)+r*Math.sin(a),-s*Math.sin(a)+r*Math.cos(a)]}function zc(t,e){let a=Kc(t.rotationDeg);return[e[0]*Math.cos(a)-e[1]*Math.sin(a),e[0]*Math.sin(a)+e[1]*Math.cos(a),0]}function pg(t){return new Set(t.pads.map(e=>`${e.positionMm[0]},${e.positionMm[1]}`)).size}function Vc(t){let e=t.pads.filter(a=>a.pad);return e.length?e:t.pads}function Hc(t){let e=Vc(t),a=e.length;return[e.reduce((s,r)=>s+r.positionMm[0],0)/a,e.reduce((s,r)=>s+r.positionMm[1],0)/a]}function gg(t,e){let a=Math.atan2(e,t)*180/Math.PI,s=mg(a/90)*90;return Math.abs(a-s)>20?null:{0:"+x",90:"+y",180:"-x","-180":"-x","-90":"-y"}[String(s===0?0:s)]}function mg(t){let e=Math.floor(t),a=t-e;return a>.5?e+1:a<.5||e%2===0?e:e+1}function yg(t){let e=(l,y,...b)=>({axis:y==="low"?null:l,confidence:y,reasons:b});if(!t||pg(t)<2)return e(null,"low","too_few_pads");let a=t.side==="top"?"top":"bottom",s=t.footprintName??"",r=fg.test(s),n=hg.test(s),i=t.courtyard;if(!i)return r?e(a,"medium","name_vertical","no_courtyard"):e(null,"low","no_courtyard");let o=t.pads.map(l=>fn(t,l.positionMm)),c=o.map(([l])=>l),d=o.map(([,l])=>l),h=[c.reduce((l,y)=>l+y,0)/c.length,d.reduce((l,y)=>l+y,0)/d.length],u=[(i.minMm[0]+i.maxMm[0])/2,(i.minMm[1]+i.maxMm[1])/2],m=Math.min(...c)-1<=u[0]&&u[0]<=Math.max(...c)+1&&Math.min(...d)-1<=u[1]&&u[1]<=Math.max(...d)+1,p=[u[0]-h[0],u[1]-h[1]],f=!m&&Math.hypot(...p)>=.5?gg(...p):null;return r?m?e(a,"high","name_vertical","body_over_pads"):e(null,"low","name_vertical","name_conflicts_geometry"):n?f?e(f,"high","name_right_angle","body_off_pads"):e(null,"low","name_right_angle","name_conflicts_geometry"):m?e(a,"medium","body_over_pads"):f?e(f,"medium","body_off_pads"):e(null,"low","body_ambiguous")}function Us(t){let e=Math.sqrt(t.reduce((a,s)=>a+s*s,0));return t.map(a=>a/e)}var xg=(t,e)=>[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]],un=(t,e)=>t.reduce((a,s,r)=>a+s*e[r],0);function wg(t){let e=t.pads.filter(s=>s.pad),a=e.find(s=>s.pad==="1");return a||(e.length?[...e].sort((s,r)=>bg(s.pad,r.pad))[0]:t.pads[0])}function vg(t){let[e,a]=Hc(t),s=Vc(t),r=s.length,n=0,i=0,o=0;for(let p of s)n+=(p.positionMm[0]-e)**2,i+=(p.positionMm[1]-a)**2,o+=(p.positionMm[0]-e)*(p.positionMm[1]-a);n/=r,i/=r,o/=r;let c=(n+i)/2,d=n*i-o*o,h=Math.sqrt(Math.max(c*c-d,0)),u=c+h,m=c-h;return u<=1e-12||u-m<=.05*u?zc(t,[1,0]):Math.abs(o)>1e-12?Us([u-i,o,0]):n>=i?[1,0,0]:[0,1,0]}function Mg(t,e){if(e==="top")return[0,0,1];if(e==="bottom")return[0,0,-1];let a=e[0]==="-"?-1:1;return Us(zc(t,e[1]==="x"?[a,0]:[0,a]))}function hn(t,e,a){let[s,r,n]=t,[i,o,c]=e,[d,h,u]=a,m=s+o+u,p;if(m>0){let l=Math.sqrt(m+1)*2;p=[(c-h)/l,(d-n)/l,(r-i)/l,.25*l]}else if(s>o&&s>u){let l=Math.sqrt(1+s-o-u)*2;p=[.25*l,(i+r)/l,(d+n)/l,(c-h)/l]}else if(o>u){let l=Math.sqrt(1+o-s-u)*2;p=[(i+r)/l,.25*l,(h+c)/l,(d-n)/l]}else{let l=Math.sqrt(1+u-s-o)*2;p=[(d+n)/l,(h+c)/l,.25*l,(r-i)/l]}return p=Us(p),([p[3],p[0],p[1],p[2]].find(l=>Math.abs(l)>1e-12)??1)<0?p.map(l=>-l):p}function bn(t,e,a){if(!t||t.pads.length===0)return null;let s=a?a.axis:yg(t).axis;if(!s)return null;let r=a?((a.quarterTurns??0)%4+4)%4:0,[n,i]=Hc(t),o=(e??0)/2,c=[n,i,t.side==="top"?o:-o],d=Mg(t,s),h=vg(t),u=un(h,d),m=[h[0]-u*d[0],h[1]-u*d[1],h[2]-u*d[2]];Math.sqrt(un(m,m))<1e-9&&(m=[-d[1],d[0],0]),m=Us(m);let p=wg(t).positionMm;un([p[0]-n,p[1]-i,0],m)>1e-9&&(m=m.map(l=>-l));let f=xg(d,m);for(let l=0;l<r;l+=1)[m,f]=[f,m.map(y=>-y)];return{axis:s,quarterTurns:r,originMm:c,xAxis:m,yAxis:f,zAxis:d,rotation:hn(m,f,d)}}var _e={bootMm:10,housingDepthMm:8,breakoutLiftMm:10,chordErrorMm:.2,catmullRomAlpha:.5,minBendRadiusFactor:6,bendRelaxIterations:8,packingFactor:1.2,ringSegments:12,breakoutBlendMm:5,lengthAllowance:.1,lengthMismatchTolerance:.15,boardCollisionMarginMm:1,defaultGaugeAwg:"24"},pn={24:1.143,22:1.3208,20:1.524,18:1.8034,16:2.0066,14:2.3622,12:2.8956,10:3.5306,8:5.0546,6:6.35,4:7.9248,2:9.8552,1:10.9474,0:12.1666,"00":13.8684};function qc(t){let e=t==null?null:String(t).trim().toUpperCase().replace(/AWG$/,"").trim();return e!==null&&e in pn?{odMm:pn[e],assumed:!1}:{odMm:pn[_e.defaultGaugeAwg],assumed:!0}}function pe(t){return Math.round(t*1e9)/1e9+0}function Gs(t){let e=Math.hypot(...t)||1,a=t.map(r=>r/e),s=[a[3],a[0],a[1],a[2]].find(r=>Math.abs(r)>1e-12)??1;return a.map(r=>pe(s<0?-r:r))}function Oa(t,e){let[a,s,r,n]=t,i=s*e[2]-r*e[1],o=r*e[0]-a*e[2],c=a*e[1]-s*e[0];return[e[0]+2*(n*i+s*c-r*o),e[1]+2*(n*o+r*i-a*c),e[2]+2*(n*c+a*o-s*i)]}function Eg(t,e){let[a,s,r,n]=t,[i,o,c,d]=e;return[n*i+a*d+s*c-r*o,n*o-a*c+s*d+r*i,n*c+a*o-s*i+r*d,n*d-a*i-s*o-r*c]}function Dt(t,e){let a=Oa(t.rotation,e.translationMm);return{translationMm:t.translationMm.map((s,r)=>pe(s+a[r])),rotation:Gs(Eg(t.rotation,e.rotation))}}var Tg=12,kg=2,Ig=1e-9,fa=(t,e)=>[t[0]-e[0],t[1]-e[1],t[2]-e[2]],dt=(t,e)=>Math.sqrt((t[0]-e[0])**2+(t[1]-e[1])**2+(t[2]-e[2])**2);function ua(t,e,a,s,r){if(s===a)return[t[0],t[1],t[2]];let n=(s-r)/(s-a),i=(r-a)/(s-a);return[n*t[0]+i*e[0],n*t[1]+i*e[1],n*t[2]+i*e[2]]}function Sg(t,e,a,s){let r=_e.catmullRomAlpha,n=0,i=n+dt(t,e)**r,o=i+dt(e,a)**r,c=o+dt(a,s)**r;return d=>{let h=i+d*(o-i),u=ua(t,e,n,i,h),m=ua(e,a,i,o,h),p=ua(a,s,o,c,h),f=ua(u,m,n,o,h),l=ua(m,p,i,c,h);return ua(f,l,i,o,h)}}function Rg(t,e,a){let s=fa(a,e),r=fa(t,e),n=Math.sqrt(s[0]*s[0]+s[1]*s[1]+s[2]*s[2]);if(n<1e-12)return dt(t,e);let i=[s[1]*r[2]-s[2]*r[1],s[2]*r[0]-s[0]*r[2],s[0]*r[1]-s[1]*r[0]];return Math.sqrt(i[0]*i[0]+i[1]*i[1]+i[2]*i[2])/n}function Xc(t){let e=o=>[o[0],o[1],o[2]];if(t.length<2)return{samples:t.map(e),spans:t.map(()=>0)};let a=t[0],s=t[t.length-1],r=[fa([2*a[0],2*a[1],2*a[2]],t[1]),...t,fa([2*s[0],2*s[1],2*s[2]],t[t.length-2])],n=[e(a)],i=[0];for(let o=0;o<t.length-1;o+=1){let c=Sg(r[o],r[o+1],r[o+2],r[o+3]),d=(h,u,m,p,f)=>{let l=(h+u)/2,y=c(l);f<kg||f<Tg&&Rg(y,m,p)>_e.chordErrorMm?(d(h,l,m,y,f+1),d(l,u,y,p,f+1)):(n.push(p),i.push(o))};d(0,1,e(t[o]),e(t[o+1]),0)}return{samples:n,spans:i}}function Ag(t,e,a){let s=dt(t,e),r=dt(e,a),n=dt(a,t),i=fa(e,t),o=fa(a,t),c=[i[1]*o[2]-i[2]*o[1],i[2]*o[0]-i[0]*o[2],i[0]*o[1]-i[1]*o[0]],d=Math.sqrt(c[0]*c[0]+c[1]*c[1]+c[2]*c[2]);return d<1e-12?Number.POSITIVE_INFINITY:s*r*n/(2*d)}function Wc(t){let e=Number.POSITIVE_INFINITY,a=-1;for(let s=1;s<t.length-1;s+=1){let r=Ag(t[s-1],t[s],t[s+1]);r<e&&(e=r,a=s)}return{radius:e,at:a}}function _g(t,e,a){let s=[],r=[];t.forEach((m,p)=>{if(s.length&&dt(s[s.length-1],m)<Ig){r[r.length-1]=r[r.length-1]&&e[p];return}s.push([m[0],m[1],m[2]]),r.push(!!e[p])});let n=_e.minBendRadiusFactor*a,{samples:i,spans:o}=Xc(s),{radius:c,at:d}=Wc(i);for(let m=0;m<_e.bendRelaxIterations&&!(c>=n||d<0);m+=1){let p=o[d],f=[];for(let g=1;g<s.length-1;g+=1)r[g]&&f.push(g);if(!f.length)break;let l=g=>Math.min(Math.abs(g-p),Math.abs(g-(p+1))),y=f[0];for(let g of f)l(g)<l(y)&&(y=g);let b=[0,1,2].map(g=>(s[y-1][g]+s[y+1][g])/2);s[y]=[0,1,2].map(g=>(s[y][g]+b[g])/2),{samples:i,spans:o}=Xc(s),{radius:c,at:d}=Wc(i)}let h=0;for(let m=0;m+1<i.length;m+=1)h+=dt(i[m],i[m+1]);let u=m=>m.map(pe);return{controlMm:s.map(u),samplesMm:i.map(u),lengthMm:pe(h),minRadiusMm:Number.isFinite(c)?pe(c):null,minRadiusAllowedMm:pe(n),tightBend:d>=0&&c<n?{atMm:u(i[d]),radiusMm:pe(c)}:null}}function Ng(t){let e=_e.bootMm/2,{exitMm:a,outward:s,legMm:r}=t;return[[a[0],a[1],a[2]],[a[0]+e*s[0],a[1]+e*s[1],a[2]+e*s[2]],[r[0],r[1],r[2]],[r[0]+e*s[0],r[1]+e*s[1],r[2]+e*s[2]]]}function Jc(t,e,a={}){let s=new Map(e.nodes.map(r=>[r.id,r.positionMm]));return e.segments.map(r=>{let n=u=>u in t?Ng(t[u]):[[...s.get(u)]],i=n(r.from),o=n(r.to),c=(a[r.id]??[]).map(u=>[u[0],u[1],u[2]]),d=[...i,...c,...o.reverse()],h=[...i.map(()=>!1),...c.map(()=>!0),...o.map(()=>!1)];return{segmentId:r.id,..._g(d,h,r.diameterMm)}})}var $c=5;var Ks=Math.SQRT1_2,Hw=[[0,0,0,1],[0,0,Ks,Ks],[0,0,1,0],[0,0,Ks,-Ks]];function Cg(t,e){let a=[0,1,2].map(s=>e[s]-t.originMm[s]);return[t.xAxis,t.yAxis,t.zAxis].map(s=>a[0]*s[0]+a[1]*s[1]+a[2]*s[2])}function Yc(t,e,a){let s,r;if(a)s=[...a.minMm],r=[...a.maxMm];else if(t.courtyard)s=[...t.courtyard.minMm,0],r=[...t.courtyard.maxMm,$c];else{let u=t.pads.map(m=>fn(t,m.positionMm));s=[Math.min(...u.map(m=>m[0])),Math.min(...u.map(m=>m[1])),0],r=[Math.max(...u.map(m=>m[0])),Math.max(...u.map(m=>m[1])),$c]}let n=t.rotationDeg*Math.PI/180,[i,o]=t.positionMm,c=(e??0)/2,d=t.side==="top",h=[];for(let u=0;u<8;u+=1){let[m,p,f]=[0,1,2].map(l=>(u>>l&1?r:s)[l]);h.push([i+m*Math.cos(n)-p*Math.sin(n),o+m*Math.sin(n)+p*Math.cos(n),d?c+f:-c-f])}return h}function Qc(t,e){let a=e.map(s=>Cg(t,s));return[[0,1,2].map(s=>Math.min(...a.map(r=>r[s]))),[0,1,2].map(s=>Math.max(...a.map(r=>r[s])))]}var zs=Math.SQRT1_2,Fg=[[0,0,0,1],[0,0,zs,zs],[0,0,1,0],[0,0,zs,-zs]],Bg=[1,0,0,0],Vs=[0,0,0,1],jg=(t,e)=>{let a=e*Math.PI/360;return[t[0]*Math.sin(a),t[1]*Math.sin(a),t[2]*Math.sin(a),Math.cos(a)]};function Og(t){if(!t)return{pose:{translationMm:[0,0,0],rotation:Vs},scale:1};let[e,a,s]=(t.rotationDeg??[0,0,0]).map(Number),r=Vs;for(let[i,o]of[[[0,0,1],s],[[0,1,0],a],[[1,0,0],e]])r=Dt({translationMm:[0,0,0],rotation:r},{translationMm:[0,0,0],rotation:jg(i,o)}).rotation;return{pose:{translationMm:(t.offsetMm??[0,0,0]).map(Number),rotation:Gs(r)},scale:Number(t.scale??1)||1}}function Pg(t){let e=t?.boundsMm;if(!e)return{exit:[0,0,-_e.housingDepthMm],depth:_e.housingDepthMm,modeled:!1};let{pose:a,scale:s}=Og(t.alignment),r=[];for(let c=0;c<8;c+=1){let d=[0,1,2].map(u=>(c>>u&1?e.maxMm:e.minMm)[u]*s),h=Oa(a.rotation,d);r.push([0,1,2].map(u=>h[u]+a.translationMm[u]))}let n=[0,1,2].map(c=>Math.min(...r.map(d=>d[c]))),i=[0,1,2].map(c=>Math.max(...r.map(d=>d[c]))),o=Math.min(n[2],0);return{exit:[(n[0]+i[0])/2,(n[1]+i[1])/2,o],depth:-o+0,modeled:!0}}function Dg(t,e=0,a){let s=Fg[(e%4+4)%4],r=Dt({translationMm:[0,0,0],rotation:Bg},{translationMm:[0,0,0],rotation:s}),n=Dt(t,r),{exit:i,depth:o,modeled:c}=Pg(a),d=Dt(n,{translationMm:i,rotation:Vs}).translationMm,h=Oa(n.rotation,[0,0,-1]),u=[0,1,2].map(m=>d[m]+_e.bootMm*h[m]);return{pose:n,exitMm:d.map(pe),outward:h.map(pe),legMm:u.map(pe),depthMm:pe(o),modeled:c}}function Zc(t,e,a,s,r=0,n,i){let o=bn(e,a,s);if(!o||!e)return null;let c=Math.max(Qc(o,Yc(e,a,i))[1][2],0),d=Dt(t,{translationMm:o.originMm,rotation:o.rotation});return d=Dt(d,{translationMm:[0,0,c],rotation:Vs}),{...Dg(d,r,n),matingPlaneMm:pe(c)}}var el=(t,e)=>Math.hypot(t[0]-e[0],t[1]-e[1],t[2]-e[2]);function Lg(t){if(!t.length)return{diameterMm:0,assumedGauge:!1};let e=0,a=!1;for(let s of t){let{odMm:r,assumed:n}=qc(s.gaugeAwg);e+=r*r,a=a||n}return{diameterMm:pe(_e.packingFactor*Math.sqrt(e)),assumedGauge:a}}function Ug(t,e){let a=t.map(o=>Math.max(e.get(o.id)??0,0));a.every(o=>o===0)&&(a=t.map(()=>1));let s=a.reduce((o,c)=>o+c,0),r=[0,1,2].map(o=>t.reduce((c,d,h)=>c+a[h]*d.legMm[o],0)/s),n=[0,1,2].map(o=>t.reduce((c,d)=>c+d.outward[o],0)/t.length),i=Math.hypot(...n);return i<1e-9?r:[0,1,2].map(o=>r[o]+_e.breakoutLiftMm*n[o]/i)}function tl(t,e,a=[]){let s=new Map(t.map(p=>[p.id,p])),r=[],n=[];for(let p of e)s.has(p.from.end)&&s.has(p.to.end)?r.push(p):n.push(p.id);let i=new Map;for(let p of r)for(let f of[p.from.end,p.to.end])i.set(f,(i.get(f)??0)+1);let o=p=>p.map(pe),c=t.map(p=>({id:p.id,kind:"end",positionMm:o(p.legMm)})),d=[];if(a.length){for(let f of a)c.push({id:f.id,kind:"breakout",positionMm:o(f.positionMm)});let p=new Map;for(let f of a)for(let l of f.ends??[])s.has(l)&&!p.has(l)&&p.set(l,f.id);for(let f of t){let l=p.get(f.id);if(l===void 0){let y=a[0];for(let b of a)el(b.positionMm,f.legMm)<el(y.positionMm,f.legMm)&&(y=b);l=y.id}d.push([f.id,l])}for(let f=0;f+1<a.length;f+=1)d.push([a[f].id,a[f+1].id])}else if(t.length===2)d.push([t[0].id,t[1].id]);else if(t.length>2){c.push({id:"auto",kind:"breakout",positionMm:o(Ug(t,i))});for(let p of t)d.push([p.id,"auto"])}let h=new Map(c.map(p=>[p.id,[]]));for(let[p,f]of d)h.get(p).push(f),h.get(f).push(p);let u=(p,f)=>{let l=new Set([p]),y=[p];for(;y.length;){let b=y.pop();for(let g of h.get(b))b===f[0]&&g===f[1]||b===f[1]&&g===f[0]||l.has(g)||(l.add(g),y.push(g))}return l},m=d.map(([p,f])=>{let l=u(p,[p,f]),y=r.filter(b=>l.has(b.from.end)!==l.has(b.to.end));return{id:`${p}~${f}`,from:p,to:f,wires:y.map(b=>b.id),...Lg(y)}});return{nodes:c,segments:m,unplaced:n}}function Gg(t){return{translationMm:[t[12],t[13],t[14]],rotation:hn([t[0],t[1],t[2]],[t[4],t[5],t[6]],[t[8],t[9],t[10]])}}function al(t,e){let a=[];for(let s of t){let r=`${s.level||""}/${s.id}`,n=new Map;for(let h of[...s.ends].sort((u,m)=>u.ordinal-m.ordinal)){let u=h.occurrence?e(h.occurrence):null;if(!u||!h.connector)continue;let m=Zc(Gg(u),h.connector.geometry,h.connector.thicknessMm,h.connector.stored);m&&n.set(h.id,m)}if(n.size<2)continue;let i=[...n].map(([h,u])=>({id:h,legMm:u.legMm,outward:u.outward})),o=s.wires.map(h=>({id:h.id,from:{end:h.from},to:{end:h.to},gaugeAwg:h.gaugeAwg??null})),c=tl(i,o),d=new Map(c.segments.map(h=>[h.id,h]));for(let h of Jc(Object.fromEntries(n),c)){let u=d.get(h.segmentId);u.diameterMm<=0||a.push({harness:r,segmentId:h.segmentId,samplesMm:h.samplesMm.flat(),radiusMm:u.diameterMm/2,wires:u.wires,tightBend:h.tightBend!==null,assumedGauge:u.assumedGauge})}}return a}var Hs=Object.freeze({restricted:{color:[.55,.57,.6,1],label:"Restricted"},loading:{color:[.7,.76,.82,1],label:"Loading\u2026"},building:{color:[.62,.72,.84,1],label:"Building 3D view\u2026"},missing:{color:[.78,.76,.7,1],label:"No 3D view"},failed:{color:[.86,.6,.56,1],label:"3D view failed"},unknown:{color:[.78,.76,.7,1],label:""}}),sl=Object.freeze([.001,0,0,0,0,.001,0,0,0,0,.001,0,0,0,0,1]);function Pa(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Kg([t,e,a]){return[1,0,0,0,0,1,0,0,0,0,1,0,t,e,a,1]}function zg([t,e,a]){return[t,0,0,0,0,e,0,0,0,0,a,0,0,0,0,1]}function rl(t,e){return Pa(sl,Pa(t,e))}function nl(t,e){let a=e.minMm,s=e.maxMm.map((r,n)=>Math.max(r-a[n],.2));return Pa(sl,Pa(t,Pa(Kg(a),zg(s))))}function il(t,e,a){return t.restricted?"restricted":!t.assetId||!e?"missing":a==="loaded"?null:a==="failed"?"failed":e.status==="ready"?e.bundleUrl&&e.bundleToBoard?"loading":"building":Hs[e.status]?e.status:"unknown"}function gn(t){return!!(t&&t.status==="ready"&&t.bundleUrl&&t.bundleToBoard)}function ol(t,e){return!t||t.bundleUrl!==e.bundleUrl||t.loadState==="failed"?"create":t.loadState==="waiting"&&gn(e)?"load":"keep"}function cl(t){return(t?.occurrences||[]).filter(e=>e.kind==="board"||e.restricted)}function ll(t){if(!t.length)return!1;let e=0;for(let a of t)if(!a.standIn)e+=1;else if(a.standIn==="loading")return!1;return e>0}var dl=512*1024*1024,Vg=.65,Hg=120,qg=12,Xg=48,Ml=230,Wg=40,Jg=4,Rn=document,ut,D,Ie,Zs,er,tr,ba,hr,rt,Ws,Da,at,Xe,be,Ce,Js,ar,La,ke,Z,br,pr,Ne,ha,Yt,st,Jt,sr,J=t=>Rn.querySelector(t),$t=t=>Rn.querySelectorAll(t);function El(t=document){Rn=t,ut=J("#app"),D=J("#viewport"),Ie=J("#schematic-viewport"),Zs=J("#schematic-dom-layer"),er=J("#schematic-flow-overlay"),tr=J("#bom-view"),ba=J("#status")||{set textContent(e){}},hr=J("#viewer-kind")||{set textContent(e){}},rt=J("#selection")||{set textContent(e){}},Ws=J("#diagnostics")||{set innerHTML(e){}},Da=J("#scene-stats"),at=J("#lod-tuning"),Xe=J("#layers"),be=J("#search-controls"),Ce=J("#view-controls"),Ne=J("#stackup-workspace-view"),Js=J("#fallback"),ar=J("#panel-labels"),La=J("#schematic-labels"),ke=J("#axis-gizmo"),Z=J("#selection-card"),br=J("#primary-heading"),pr=J("#primary-description"),ha=J("#mode-switch"),Yt=J("#system-labels"),st=J("#move-gizmo"),Jt=J("#system-help"),sr=J("#system-harnesses"),ut.classList.add("workspace-pcb")}function Tl(){return{workspace:"pcb",mode:"3d",activeNetId:0,selectedFeatureId:0,selectedOccurrence:0,selectionAnchor:null,showBoard:!0,showComponents:!0,showPlaceholders:!0,realisticColors:!0,isolateNet:!1,savedShowBoard:!0,savedShowComponents:!0,preIsolationShowBoard:null,separation:0,dragging:!1,dragMode:"orbit",lastX:0,lastY:0,pointerStartX:0,pointerStartY:0,frameCpuMs:0,frameCpuP95Ms:0,frameIntervalMs:0,frameIntervalP95Ms:0,frameSamples:[],fps:0,frames:0,fpsAt:performance.now(),activeTab:"layers",selectedPageId:"",selectedSchematicFeature:null,schematicDragging:!1,schematicLastX:0,schematicLastY:0,schematicStartX:0,schematicStartY:0}}function za(t={}){return{key:t.key??"board",topology:t.topology||window.__TOPOLOGY__||{},semanticGeometry:t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},viewerReadiness:t.readiness||{stage:"semantic-ready",progress:100},assetCache:t.assetCache||null,deferComponents:!!t.deferComponents,scene:$g(),renderer:null,compareLayers:new Set,desiredCompareLayers:new Set,visible3dLayers:new Set,preIsolation3dLayers:null,preIsolationCompareLayers:null,highlightedNetIds:new Set,hiddenComponents:new Set,hiddenComponentRequest:null,loadedBytes:0,triangles:0,residentTileBytes:0,residentTileGpuBytes:0,residentTileTriangles:0,tileLoads:0,tileEvictions:0,tileSchedulerMs:0,lastTileScheduleAt:0,visibleTileIds:new Set,gpuBytes:0}}function $g(){return{manifest:null,manifestUrl:"",layers:[],copperLayers:[],nets:[],features:new Map,tiles:new Map,loaded:new Set,loading:new Map,failed:new Map,residentTiles:new Map,componentFeatures:new Map,componentModelCounts:new Map,componentTier:"idle",componentEntries:[],componentsWantedAt:0,componentEvictions:0,runtimeBounds:null,layerZOffsets:new Float32Array(256),layerZOffsetSignature:""}}function kl(){return{key:"",started:0,from:new Map,current:new Map}}function Il(){return{phase:"idle",previous:new Set,target:new Set,previousOffsets:new Map,started:0}}function Sl(){return{manifest:null,manifestUrl:"",pages:[],byId:new Map,activeNetUid:"",visiblePages:[],fitted:!1,rendererMode:new URLSearchParams(location.search).get("schematicRenderer")||"svg-dom",domFallbackReason:""}}var w=Tl(),E=za(),M=null,we=kl(),q=Il(),P=Sl(),rr=[],nr=1.5*1024*1024*1024,Yg=5e3,N,Y,We,z,se,Qt=new Map,Lt=performance.now(),me=0,$s=0,Va=null,ir=null,or=null,mn=!1,Se=!1,gr=()=>!0,Ua=!0;!window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__&&document.getElementById("app")&&_n().catch(t=>{console.error(t),ba&&(ba.textContent="Renderer failed"),Js&&(Js.hidden=!1,Js.textContent=t.stack||t.message||String(t))});function Rl(t){let e=new Map((t.components||[]).map(s=>[s.uid,s])),a={};for(let s of t.terminals||[]){let r=s.net_uid;if(!r)continue;let n=e.get(s.component_uid)||{},i={designator:s.designator||n.designator||"",pin:s.pin||"",value:n.value||"",pcb_pad_id:s.pcb_pad_id||""};a[r]||(a[r]={terminals:[]});let o=a[r].terminals;o.some(c=>c.designator===i.designator&&c.pin===i.pin)||o.push(i)}return a}function Qg(t,e=E){if(!t||!e.topology||!e.topology.physical_objects)return 0;let a=e.topology.physical_objects.find(r=>r.uid===t);if(!a||!a.source_ids||!a.source_ids.length)return 0;let s=a.source_ids[0];for(let[r,n]of e.scene.features.entries())if(n.sourceUid===s)return r;return 0}function An(t,e=E){return!t||!e.topology||!e.topology.components?null:e.topology.components.find(a=>a.designator===t)}function qs(t,e){for(let a of Object.keys(t))delete t[a];Object.assign(t,e)}function Al(){if($s&&(cancelAnimationFrame($s),$s=0),window.removeEventListener("keydown",jd),M){for(let t of M.boards.values())t.abort?.abort();M.scene.dispose(),M=null}else E.renderer?.dispose?.();E.renderer=null,N=null,Y?.dispose?.(),Y=null,We=null,Va=null,gr=()=>!0,Ua=!0}function _l(){return me+=1,Al(),qs(w,Tl()),E=za(),qs(we,kl()),qs(q,Il()),qs(P,Sl()),rr=[],z=null,se=null,Qt=new Map,Lt=performance.now(),me}function Nl(t){t===me&&(me+=1,Al())}function Ga(t){t===me&&($s=requestAnimationFrame(e=>sy(e,t)))}function ge(t){return t===me}async function _n(t={}){let e=_l(),a={};if(E.topology=t.topology||window.__TOPOLOGY__||{},E.topology&&!E.topology.net_details&&(E.topology.net_details=Rl(E.topology)),E.semanticGeometry=t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},E.viewerReadiness=t.readiness||E.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},Va=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,or=typeof t.onContextMenu=="function"?t.onContextMenu:null,ir=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,gr=typeof t.isActive=="function"?t.isActive:()=>!0,Ua=t.workspaceScope!=="3d",E.assetCache=t.assetCache||null,w.gpuBudgetBytes=nr,El(t.root||document),!ut||!D)throw new Error("Semantic viewer shell is missing required DOM nodes");return await tm(e,a,t.onPerformanceEvent),{performance:a,setSelection(s){Se=!0;try{if(s?.occurrence!=null&&Zg(s.occurrence),!s)Fe();else if(s?.netName||s?.netUid){let r=s.netUid&&E.scene.nets.find(n=>n.uid===s.netUid)||s.netName&&Vt(E.scene.nets,s.netName);r&&ma(Number(r.id),!0)}else s?.netId?ma(Number(s.netId),!0):s?.featureId?Kt(Number(s.featureId),!0):s?.reference&&Er(String(s.reference),!0)}finally{Se=!1}},resize(){E.renderer?.resize(),N?.resize(),w.workspace==="pcb"&&w.mode==="layer"&&Gn()},setWorkspace(s){let r=s==="stackup"?"stackup":"pcb";w.workspace!==r&&_d(r)},setHiddenComponents(s){return Rd(s)},getComponentReferences(){return[...E.scene.componentFeatures.keys()]},setHighlightedNets(s){return em(s)},setStatsOverlay(s){jn(s)},stats(){return Bn()},setLodOverride(s){E.renderer?.setLodOverride(s)},setGpuBudget(s){let r=Number(s);w.gpuBudgetBytes=Number.isFinite(r)&&r>0?r:nr;for(let n of M?M.boards.values():[E])n.tiersCheckedAt=0},pickAt(s,r){return Fd(s,r)},projectComponent(s){return Bd(E,s,r=>kn(r,Xt))},projectPoint(s){return kn(s,Xt)},getViewState:Nn,setViewMode:Ed,setLayerVisible:Vn,applyLayerPreset:Hn,setShowBoard:qn,setShowComponents:Xn,setShowPlaceholders:Td,setRealisticColors:kd,setSeparation:Wn,showNetLayers:Mr,setNetIsolation:Gt,dispose(){Nl(e)}}}function Ut(){!ir||mn||(mn=!0,queueMicrotask(()=>{mn=!1,ir?.(Nn())}))}function Nn(){let t=w.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;return{mode:w.mode,layers:E.scene.copperLayers.map(e=>({id:Number(e.id),name:String(e.name),color:Qn(vr(e)),visible:t.has(Number(e.id))})),showBoard:w.showBoard,showComponents:w.showComponents,showPlaceholders:w.showPlaceholders,realisticColors:w.realisticColors,separation:M?M.separation.get(Ka())||0:w.separation,isolateNet:w.isolateNet,hasNet:!!w.activeNetId||ft(),...M?{boards:Nm(),selectedBoard:Ka()}:{}}}function mr(t){if(M?.move.enabled&&wr(),Se)return;let e=E.renderer&&!E.renderer.identityOnly?E.renderer.occurrenceKeys[w.selectedOccurrence]:null;Va?.(t&&e!=null?{...t,occurrence:e}:t)}function Zg(t){let e=E.renderer?.occurrenceKeys.indexOf(String(t))??-1;e>=0&&(w.selectedOccurrence=e)}function Cn(t){if(!t||!E.renderer||E.renderer.identityOnly)return t;let e=E.renderer.occurrenceMatrices[w.selectedOccurrence];return e?ia(e,t):t}function Cl(t,e=null){return t?{kind:"net",sourceContext:"3D",netName:String(t.name||""),netUid:String(t.uid||"")||void 0,netCode:Number(t.id||0)||void 0,featureId:Number(e?.id||0)||void 0,uuid:String(e?.sourceUid||"")||void 0}:null}function Fl(t,e=E){if(!t)return null;let a=ya(t),s=String(t.padNumber||t.pin||t.pinNumber||""),r=e.scene.nets.find(n=>Number(n.id)===Number(t.netId||0));if(a&&s)return{kind:"terminal",sourceContext:"3D",reference:a,pin:s,netUid:r?.uid,netName:r?.name,netCode:r?Number(r.id):void 0,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0};if(a){let n=An(a,e);return{kind:"component",sourceContext:"3D",reference:a,componentUid:n?.uid,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0}}return Cl(r,t)}function Bl(){w.showBoard=!0,w.showComponents=!0,ta(),typeof Re=="function"&&Re()}function ft(){return pa().size>0||!!M?.emphasisSets.length}function pa(){let t=new Set(E.highlightedNetIds);return w.activeNetId&&t.add(Number(w.activeNetId)),t}function em(t){let e=Array.isArray(t)?t:[],a=yi(E.scene.nets,e),s=ft();E.highlightedNetIds=a,E.renderer?.setEmphasizedNetIds(a);let r=ft();return r&&!s?yr():!r&&s&&Fn(),w.isolateNet&&r&&ea(),ye(performance.now(),{force:!0}),{applied:a.size,requested:e.length}}function yr(){(w.showBoard||w.showComponents)&&(w.savedShowBoard=w.showBoard,w.savedShowComponents=w.showComponents),w.showBoard=!1,w.showComponents=!1,ta(),typeof Re=="function"&&Re()}function Fn(){w.showBoard=w.savedShowBoard!==!1,w.showComponents=w.savedShowComponents!==!1,ta(),typeof Re=="function"&&Re()}async function jl(t,e,a={}){let s=t.semanticGeometry.assets?.scene_manifest||t.semanticGeometry.semantic_gltf?.path,r=performance.now();if(s){if(t.scene.manifestUrl=new URL(s,location.href).toString(),t.scene.manifest=await rm(t.scene.manifestUrl,t),a.scene_manifest_fetch_parse_ms=performance.now()-r,!ge(e))return!1;if(t.scene.manifest.schema!=="prism.semantic_gltf_a0")throw new Error(`Unsupported scene schema: ${t.scene.manifest.schema}`)}else t.scene.manifest={schema:"prism.semantic_gltf_partial.a0",bbox:null,layers:[],nets:[],objectFeatures:[],components:[],tiles:[],barrels:[]},a.scene_manifest_fetch_parse_ms=0;r=performance.now(),t.scene.layers=t.scene.manifest.layers||[],t.scene.copperLayers=t.scene.layers.filter(i=>i.role==="copper"||String(i.name).endsWith(".Cu")),t.scene.nets=t.scene.manifest.nets||[];for(let i of t.scene.manifest.objectFeatures||[])t.scene.features.set(Number(i.id),{...i,bounds:Ea(i.boundsMm)});for(let i of t.scene.manifest.components||[])t.scene.componentFeatures.set(i.designator,i),t.scene.features.set(Number(i.featureId),{...i,kind:"component",sourceUid:i.uid,netId:0,bounds:null});for(let i of t.scene.manifest.tiles||[])t.scene.tiles.set(i.id,i);a.scene_manifest_index_ms=performance.now()-r;let n=Pl(t);for(let i of n)t.compareLayers.add(i),t.desiredCompareLayers.add(i);for(let i of t.scene.copperLayers)t.visible3dLayers.add(Number(i.id));return!0}async function tm(t,e={},a=null){let s=performance.now();if(!await jl(E,t,e))return;let r=performance.now();if(E.renderer=await Wt.create(D),e.webgpu_renderer_create_ms=performance.now()-r,!ge(t)){E.renderer?.dispose?.(),E.renderer=null;return}E.renderer.setBarrels(E.scene.manifest.barrels||[]),Wa(),r=performance.now();let n=await Kl(t);if(e.board_fetch_parse_upload_ms=performance.now()-r,!ge(t)||(E.scene.runtimeBounds=n||rs(E.scene.manifest.bbox),z=new va(E.scene.runtimeBounds),Ua&&(await am(t),!ge(t)||(await sm(t),!ge(t)))))return;r=performance.now(),Kn(),Ad(),Ua&&(Sy(),Iy()),Id(),Pd(),e.controls_and_bindings_ms=performance.now()-r;let i={"board-ready":"Board ready \xB7 components and semantic layers are still generating","components-ready":"Board and components ready \xB7 semantic layers are still generating","semantic-ready":"WebGPU semantic glTF active"};if(ba.textContent=i[E.viewerReadiness.stage]||"Loading 3D assets",E.semanticGeometry.assets?.components_glb&&!E.deferComponents){let o=performance.now();dd(t).then(()=>{ge(t)&&(Tn(n),a?.({schema:"prism.semantic_viewer_performance.a0",milestone:"components-loaded",readiness_stage:E.viewerReadiness.stage,elapsed_ms:performance.now()-o,bytes_loaded:E.loadedBytes}))})}else Tn(n);ye(performance.now(),{force:!0}),Ga(t),r=performance.now(),await new Promise(o=>requestAnimationFrame(o)),e.first_frame_wait_ms=performance.now()-r,e.boot_total_ms=performance.now()-s}async function am(t=me){let e=E.semanticGeometry.assets?.schematic_native_manifest||E.semanticGeometry.schematic_vector?.path||E.semanticGeometry.schematic_scene?.path,a=E.semanticGeometry.assets?.schematic_manifest||E.semanticGeometry.schematic_world?.path,s=J("[data-workspace=schematic]");if(!e&&!a){s.disabled=!0,s.title="No schematic world assets are available";return}let r=[e,a].filter(Boolean),n=null;for(let o of r)try{P.manifestUrl=new URL(o,location.href).toString();let c=await js.create(Ie,P.manifestUrl);if(!ge(t))return;N=c,N.setFlowOverlayCanvas(er);break}catch(c){if(n=c,N=null,o===a)throw c}if(!N)throw n||new Error("Failed to load schematic viewer assets");P.manifest=N.manifest,P.pages=N.pages,P.byId=new Map(P.pages.map(o=>[o.id,o])),w.selectedPageId=P.pages[0]?.id||"",N.selectedPageId=w.selectedPageId,!["native","legacy","webgpu"].includes(String(P.rendererMode).toLowerCase())&&(Y=Ds.create(Zs,P.manifestUrl,P.manifest,N.featuresByPage,{onSelect:gy,onBlank:Xa,onHighlightNet:vd,onOpenPage:by,onFallback:o=>{P.domFallbackReason=o,console.warn(o)}}),Y.preloadPages(P.pages)),N.preloadOverview()}async function sm(t=me){let e=E.semanticGeometry.assets?.bom||E.semanticGeometry.bom?.path,a=J("[data-workspace=bom]");if(!e){a&&(a.disabled=!0,a.title="No BoM artifact is available");return}try{let s=await as.create(tr,new URL(e,location.href).toString(),{onSelectReference:r=>Er(r,!0)});if(!ge(t))return;We=s}catch(s){if(!ge(t))return;console.warn(s),a&&(a.disabled=!0,a.title=s?.message||"BoM artifact could not be loaded")}}async function rm(t,e=E){if(e.assetCache)return e.assetCache.fetchJson(String(t));let a=await fetch(t,{cache:"default"});if(!a.ok)throw new Error(`Failed to load ${t}: ${a.status}`);return a.json()}async function nm(t,e=me,a=E){if(!ge(e))return;let s=a.scene.residentTiles.get(t.id);if(s){s.lastUsed=performance.now();return}if(a.scene.failed.get(t.id))return;if(a.scene.loading.has(t.id))return a.scene.loading.get(t.id);let n=(async()=>{try{let i=await Ra(new URL(t.path,a.scene.manifestUrl).toString(),{fetchBytes:dr(a),fetchCache:"no-store"});if(!ge(e)||!a.renderer)return;a.loadedBytes+=i.byteLength;let o=a.scene.layers.find(m=>Number(m.id)===Number(t.layerId)),c=[],d=0,h=0;for(let m of i.primitives){let p=a.renderer.addPrimitive(m,{kind:"copper",tileId:t.id,layerId:Number(t.layerId),innerCopper:hm(Number(t.layerId),a),color:bd(o,a),stencilMark:hd(o,a),baseZ:Number(o?.z_mm||0)/1e3,material:{baseColor:[1,1,1,1],metallic:.78,roughness:.32}});c.push(p),d+=m.indices.length/3,h+=im(m)}let u={tile:t,entries:c,byteLength:i.byteLength,gpuBytes:h,triangles:d,lastUsed:performance.now(),pinned:!1};a.scene.residentTiles.set(t.id,u),a.scene.loaded.add(t.id),a.tileLoads+=1,a.residentTileBytes+=i.byteLength,a.residentTileGpuBytes+=h,a.residentTileTriangles+=d,a.triangles=a.residentTileTriangles,a.scene.failed.delete(t.id)}catch(i){if(!ge(e))return;let o=a.scene.failed.get(t.id)||{count:0,message:""};a.scene.failed.set(t.id,{count:o.count+1,message:i?.message||String(i)}),o.count||console.warn(`Failed to load tile ${t.id}; suppressing retries until assets are regenerated`,i)}finally{ge(e)&&a.scene.loading.delete(t.id)}})();return a.scene.loading.set(t.id,n),n}function im(t){return t.position.length/3*Wg+t.indices.length*Jg}function om(t,e=E){let a=e.scene.residentTiles.get(t);a&&(e.renderer.removeEntries(a.entries),e.scene.residentTiles.delete(t),e.scene.loaded.delete(t),e.residentTileBytes=Math.max(0,e.residentTileBytes-a.byteLength),e.residentTileGpuBytes=Math.max(0,e.residentTileGpuBytes-a.gpuBytes),e.residentTileTriangles=Math.max(0,e.residentTileTriangles-a.triangles),e.triangles=e.residentTileTriangles,e.tileEvictions+=1)}function ye(t=performance.now(),e={},a=E){if(!a.renderer||!z||w.workspace!=="pcb")return;let s=w.mode==="layer"&&q.phase==="preload";if(!e.force&&!s&&t-a.lastTileScheduleAt<Hg)return;let r=performance.now();a.lastTileScheduleAt=t;let n=cm(a);a.visibleTileIds=n;let i=a.scene.loading.size,c=Math.max(0,(s?Xg:qg)-i),d=[...n].map(u=>a.scene.tiles.get(u)).filter(u=>u&&!a.scene.residentTiles.has(u.id)&&!a.scene.loading.has(u.id)&&!a.scene.failed.has(u.id)).sort((u,m)=>fl(u,a)-fl(m,a)).slice(0,c),h=me;for(let u of d)nm(u,h,a);for(let u of n){let m=a.scene.residentTiles.get(u);m&&(m.lastUsed=t)}Ll(n,void 0,a),a.tileSchedulerMs=performance.now()-r}function cm(t=E){let e=new Set,a=w.mode==="3d"?t.visible3dLayers:lm();if(!a.size||!se)return e;if(w.mode==="layer"){for(let n of t.scene.tiles.values())a.has(Number(n.layerId))&&e.add(n.id);return e}let s=new Set,r=Zl(t);if(r.size){for(let n of t.scene.tiles.values())if(a.has(Number(n.layerId))){for(let i of r)if(Gl(n,i)){s.add(n.id);break}}}for(let n of t.scene.tiles.values()){if(!a.has(Number(n.layerId)))continue;let i=w.mode==="layer"?Qt.get(Number(n.layerId)):null;um(n,se.matrix,i,Vg,t)&&e.add(n.id)}for(let n of s)e.add(n);return e}function lm(){return w.mode!=="layer"||q.phase==="idle"?E.compareLayers:Dl(q.previous,q.target)}function Ol(){return w.mode!=="layer"?E.visible3dLayers:q.phase==="reveal"?Dl(q.previous,q.target):E.compareLayers}function Pl(t=E){let e=t.scene.copperLayers.map(a=>Number(a.id)).filter(Number.isFinite);return e.length?e.length===1?new Set([e[0]]):new Set([e[0],e[e.length-1]]):new Set}function dm(){let t=E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers;return t.size?new Set([...t].map(Number)):Pl()}function Dl(...t){let e=new Set;for(let a of t)for(let s of a||[])e.add(Number(s));return e}function Ll(t,e=dl,a=E){if(w.mode==="layer")return;let s=Math.min(dl,e);if(a.residentTileGpuBytes<=s)return;let r=[...a.scene.residentTiles.values()].filter(n=>!t.has(n.tile.id)&&!a.scene.loading.has(n.tile.id)).sort((n,i)=>n.lastUsed-i.lastUsed);for(let n of r){if(a.residentTileGpuBytes<=s)break;om(n.tile.id,a)}}function um(t,e,a=null,s=0,r=E){let n=Ul(t,r);if(!n)return!0;let i=Math.max(n[3]-n[0],n[4]-n[1])*s,o=[n[0]-i+(a?.[0]||0),n[1]-i+(a?.[1]||0),n[2]-.002,n[3]+i+(a?.[0]||0),n[4]+i+(a?.[1]||0),n[5]+.002],c=r.renderer?.occurrenceMatrices;return!c||c.length===1&&ks(c[0])?ul(o,e):c.some(d=>ul(o,ts(e,d)))}function Ul(t,e=E){let a=t.boundsMm;if(!a||a.length!==4)return null;let s=e.scene.layers.find(n=>Number(n.id)===Number(t.layerId)),r=Number(s?.z_mm||0)/1e3;return[a[0]/1e3,-a[3]/1e3,r-4e-4,a[2]/1e3,-a[1]/1e3,r+4e-4]}function ul(t,e){let a=[[t[0],t[1],t[2]],[t[3],t[1],t[2]],[t[0],t[4],t[2]],[t[3],t[4],t[2]],[t[0],t[1],t[5]],[t[3],t[1],t[5]],[t[0],t[4],t[5]],[t[3],t[4],t[5]]].map(r=>fm(e,r));return![r=>r[0]<-r[3],r=>r[0]>r[3],r=>r[1]<-r[3],r=>r[1]>r[3],r=>r[2]<0,r=>r[2]>r[3]].some(r=>a.every(r))}function fm(t,e){let a=e[0],s=e[1],r=e[2];return[t[0]*a+t[4]*s+t[8]*r+t[12],t[1]*a+t[5]*s+t[9]*r+t[13],t[2]*a+t[6]*s+t[10]*r+t[14],t[3]*a+t[7]*s+t[11]*r+t[15]]}function Gl(t,e){return Array.isArray(t.netIds)&&t.netIds.some(a=>Number(a)===Number(e))}function fl(t,e=E){let a=Ul(t,e);if(!a||!z)return 0;let s=(a[0]+a[3])*.5-z.focus[0],r=(a[1]+a[4])*.5-z.focus[1];return s*s+r*r}async function Kl(t=me,e=E){let a=e.semanticGeometry.assets?.base_board_glb;if(!a)return null;let s=e.semanticGeometry.assets?.soldermask_glb,[r,n]=await Promise.all([Ra(new URL(a,location.href).toString(),{defaultFeatureId:0,fetchBytes:dr(e)}),s?Ra(new URL(s,location.href).toString(),{defaultFeatureId:0,fetchBytes:dr(e)}).catch(o=>(console.warn("[prism-semantic-viewer] solder mask failed to load",o),null)):null]);if(!ge(t)||!e.renderer)return null;e.loadedBytes+=r.byteLength,n&&(e.loadedBytes+=n.byteLength);let i=[...r.primitives.filter(o=>{let c=Cr(o);return c!=="pad"&&!(n&&c==="soldermask")}),...n?.primitives||[]];for(let o of ss(i,Cr))e.renderer.addPrimitive(o,{kind:"board",boardRole:o.groupKey,layerId:o.groupKey==="paste"?Ym(o,e):0,material:o.material,color:o.material.baseColor});return sa(i.map(o=>o.bounds))}function Zt(t=E){return t.scene.runtimeBounds||rs(t.scene.manifest?.bbox)}function hm(t,e=E){return di(t,e.scene.copperLayers)}function zl(t,e){let{back:a}=z.basis();return{eye:Qe(z.focus,De(a,z.distance)),orthographic:e,pixelScale:e?t/Math.max(1e-9,z.orthoScale):t/2/Math.tan(z.fov/2)}}function Bn(){if(M)return bm();let t=E.renderer?.cullCounts||{full:0,board:0,body:0,box:0,culled:0},e=!E.renderer||E.renderer.identityOnly;return{occurrences:E.renderer?.occurrenceMatrices.length||0,lod:e?{full:1,board:0,body:0,box:0,culled:0}:{...t},triangles:E.renderer?.frameStats.triangles||0,draws:E.renderer?.frameStats.draws||0,gpuMemoryBytes:E.renderer?.gpuMemoryBytes()||0,gpuBudgetBytes:w.gpuBudgetBytes,componentTier:E.scene.componentTier,componentEvictions:E.scene.componentEvictions,tileEvictions:E.tileEvictions,cache:E.assetCache?E.assetCache.summary():{enabled:!1},frameIntervalMs:w.frameIntervalMs,frameIntervalP95Ms:w.frameIntervalP95Ms,frameCpuMs:w.frameCpuMs,frameCpuP95Ms:w.frameCpuP95Ms,fps:w.fps}}function bm(){let t=Je(),e=t.map(a=>a.scene.componentTier);return{occurrences:M.scene.occurrenceCount||0,lod:M.scene.cullCounts(),triangles:M.scene.frameStats.triangles,draws:M.scene.frameStats.draws,gpuMemoryBytes:M.scene.gpuMemoryBytes(),gpuBudgetBytes:w.gpuBudgetBytes,componentTier:`${e.filter(a=>a==="loaded").length}/${t.length} loaded`,componentEvictions:t.reduce((a,s)=>a+s.scene.componentEvictions,0),tileEvictions:t.reduce((a,s)=>a+s.tileEvictions,0),cache:t.find(a=>a.assetCache)?.assetCache.summary()||{enabled:!1},frameIntervalMs:w.frameIntervalMs,frameIntervalP95Ms:w.frameIntervalP95Ms,frameCpuMs:w.frameCpuMs,frameCpuP95Ms:w.frameCpuP95Ms,fps:w.fps,firstFrame:M.timing.boardsDrawnAt==null?null:{sinceSceneMs:M.timing.boardsDrawnAt-M.timing.descriptorAt,sinceNavigationMs:M.timing.boardsDrawnAt}}}function jn(t){w.showStats=!!t,Da&&(Da.hidden=!w.showStats),at&&(at.hidden=!(w.showStats&&M)),w.showStats&&M&&ym(),Vl()}var vn="prism.systemScene.lodThresholds",pm=Object.freeze([{key:"fullPx",label:"Parts",max:600},{key:"boardPx",label:"Copper",max:400},{key:"boxPx",label:"Box below",max:120}]);function gm(){try{let t=JSON.parse(globalThis.localStorage?.getItem(vn)||"null");if(t&&typeof t=="object")return oa(t)}catch{}return{...qe}}function mm(t){try{t?globalThis.localStorage?.setItem(vn,JSON.stringify(t)):globalThis.localStorage?.removeItem(vn)}catch{}}function Mn(t){if(!M)return null;let e=t==null?{...qe}:{...M.scene.lodThresholds,...t},a=M.scene.setLodThresholds(e);return mm(t==null?null:a),En(),a}function ym(){if(!at||at.childElementCount)return En();let t=document.createElement("h2");t.textContent="Detail thresholds (CSS px)",at.append(t);for(let a of pm){let s=document.createElement("label"),r=document.createElement("span");r.textContent=a.label;let n=document.createElement("input");Object.assign(n,{type:"range",min:"0",max:String(a.max),step:"1"}),n.dataset.key=a.key;let i=document.createElement("output");n.addEventListener("input",()=>Mn({[a.key]:Number(n.value)})),s.append(r,n,i),at.append(s)}let e=document.createElement("button");e.type="button",e.textContent="Defaults",e.addEventListener("click",()=>Mn(null)),at.append(e),En()}function En(){if(!at||!M)return;let t=M.scene.lodThresholds;for(let e of at.querySelectorAll("input[data-key]"))e.value=String(t[e.dataset.key]),e.nextElementSibling.value=String(Math.round(t[e.dataset.key]))}function Vl(){if(!Da||!w.showStats)return;let t=Bn(),{full:e,board:a,body:s,box:r,culled:n}=t.lod,i=[["Occurrences",`${t.occurrences} (${e+a+s+r} visible)`],["Detail",`${e} full \xB7 ${a} board \xB7 ${s} body \xB7 ${r} box \xB7 ${n} culled`],["Triangles",t.triangles.toLocaleString()],["Draws",t.draws.toLocaleString()],["GPU memory",`${(t.gpuMemoryBytes/1048576).toFixed(1)} / ${(t.gpuBudgetBytes/1048576).toFixed(0)} MB`],["Components",`${t.componentTier}${t.componentEvictions?` \xB7 ${t.componentEvictions} evicted`:""}`],["Cache",t.cache.enabled?`${t.cache.hits} hits \xB7 ${t.cache.misses} misses \xB7 ${(t.cache.bytes/1048576).toFixed(0)} MB`:"off"],["Frame",`${t.frameIntervalMs.toFixed(1)} ms \xB7 p95 ${t.frameIntervalP95Ms.toFixed(1)}`],["CPU",`${t.frameCpuMs.toFixed(2)} ms \xB7 p95 ${t.frameCpuP95Ms.toFixed(2)}`],["FPS",t.fps.toFixed(0)]];Da.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("")}var xm="prism.system_scene.a0";function Je(){return M?[...M.boards.values()].filter(t=>t.renderer&&t.loadState==="loaded"):[]}async function Hl(t={}){let e=_l();if(Va=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,or=typeof t.onContextMenu=="function"?t.onContextMenu:null,ir=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,gr=typeof t.isActive=="function"?t.isActive:()=>!0,Ua=!1,w.gpuBudgetBytes=nr,El(t.root||document),!ut||!D)throw new Error("Semantic viewer shell is missing required DOM nodes");if(typeof t.loadBundle!="function")throw new Error("A system scene needs a bundle loader");let a=await _s.create(D);return ge(e)?(a.setLodThresholds(gm()),M={scene:a,loadBundle:t.loadBundle,onEmphasis:typeof t.onEmphasis=="function"?t.onEmphasis:null,onMove:typeof t.onMove=="function"?t.onMove:null,baseDescriptor:null,descriptor:null,move:Om(),gizmo:null,standInKey:null,showLabels:!0,harnesses:[],harnessLit:new Map,showHarnesses:!0,harnessDrawn:null,tubes:[],tubedHarnesses:new Set,timing:{descriptorAt:null,boardsDrawnAt:null},boards:new Map,groups:new Map,placed:[],placements:new Map,hiddenLayers:new Map,separation:new Map,bounds:null,framed:!1,snapped:!1,boardSelected:!1,inputs:new Map,emphasisSets:[],emphasisBounds:new Map,emphasisReport:null},E=za({key:""}),z=new va([-.1,-.1,-.01,.1,.1,.01]),Kn(),Ad(),Id(),Pd(),ba.textContent="System scene",Ga(e),{setSystemScene:wm,setNetEmphasis:Cm,frameNetEmphasis:Fm,frameAll(){M?.bounds&&z.frame(M.bounds)},setMoveAllowed:Pm,setMoveMode:lr,setMoveSpace:id,previewPose:Dm,cancelMove:Un,getMoveState:()=>M?nd():null,setLabelsVisible(s){M&&(M.showLabels=!!s,Yt&&(Yt.hidden=!M.showLabels))},setHelpVisible:ld,setHarnessesVisible(s){M&&(M.showHarnesses=!!s,M.harnessDrawn=null,Xl())},frameBoard(s){let r=M?.placements.get(String(s));return r&&z.frame(r.worldBounds),!!r},frameParts:Bm,setSelection(s){Se=!0;try{s?km(s):Fe()}finally{Se=!1}},resize(){M?.scene.resize()},setStatsOverlay:jn,stats:Bn,setLodOverride(s){for(let r of Je())r.renderer.setLodOverride(s)},setLodThresholds:Mn,setGpuBudget(s){let r=Number(s);w.gpuBudgetBytes=Number.isFinite(r)&&r>0?r:nr;for(let n of M?.boards.values()||[])n.tiersCheckedAt=0},pickAt(s,r){return Fd(s,r)},projectPoint(s,r){return pl(s,r)},projectComponent(s,r){let n=M?.placements.get(String(r));return n?.board?Bd(n.board,s,i=>pl(i,r)):null},getViewState:Nn,setLayerVisible:Vn,applyLayerPreset:Hn,setShowBoard:qn,setShowComponents:Xn,setShowPlaceholders:Td,setRealisticColors:kd,setSeparation:Wn,setNetIsolation:Gt,showNetLayers:Mr,dispose(){Nl(e)}}):(a.dispose(),null)}function wm(t){if(!M)return;if(t?.schema!==xm)throw new Error(`Unsupported system scene schema: ${t?.schema||"missing"}`);M.baseDescriptor=t,M.timing.descriptorAt??=performance.now();let e=M.move.target?t.occurrences.find(s=>s.path===M.move.target):null;e?!M.move.drag&&sd(M.move.preview,e.pose)&&(M.move.preview=null):(M.move.drag=null,M.move.preview=null,M.move.target=null),M.descriptor=rd(),M.harnesses=Array.isArray(t.harnesses)?t.harnesses:[],M.harnessDrawn=null;let a=new Set;for(let s of t.assets||[]){a.add(s.assetId);let r=M.boards.get(s.assetId),n=ol(r,s);if(n!=="create"){r.asset=s,n==="load"&&bl(r,me);continue}r&&hl(s.assetId);let i=za({key:s.assetId,topology:{},semanticGeometry:{},deferComponents:!0});Object.assign(i,{asset:s,bundleUrl:s.bundleUrl,loadState:"waiting",abort:null}),M.boards.set(s.assetId,i),gn(s)&&bl(i,me)}for(let s of[...M.boards.keys()])a.has(s)||hl(s);cr(),M.move.enabled&&(wr({quiet:!0}),nt("sync"))}function hl(t){let e=M.boards.get(t);e?.abort?.abort(),M.boards.delete(t),M.scene.removeAsset(t),e&&(e.renderer=null),E===e&&On()}async function bl(t,e){t.loadState="loading",t.abort=new AbortController;let a=()=>ge(e)&&M?.boards.get(t.key)===t&&!t.abort.signal.aborted;try{let s=await M.loadBundle(t.bundleUrl,t.abort.signal);if(!a()||(t.topology=s.topology||{},t.topology.net_details||(t.topology.net_details=Rl(t.topology)),t.semanticGeometry=s.semanticGeometry||{},t.viewerReadiness=s.readiness||t.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},t.assetCache=s.assetCache||null,!await jl(t,e)||!a()))return;t.renderer=M.scene.asset(t.key),t.renderer.setBarrels(t.scene.manifest.barrels||[]),Wa(t);let r=await Kl(e,t);if(!a())return;t.scene.runtimeBounds=r||rs(t.scene.manifest.bbox),t.renderer.setBoardBounds(t.scene.runtimeBounds),t.loadState="loaded",cr()}catch(s){if(!a())return;console.warn(`[prism-semantic-viewer] system board ${t.key} failed to load`,s),t.loadState="failed",t.error=s?.message||String(s),M.scene.removeAsset(t.key),t.renderer=null,E===t&&On(),cr()}}function cr({relabel:t=!0}={}){let e=M?.descriptor;if(!e)return;M.harnessDrawn=null;let a=Ka(),s=new Map((e.assets||[]).map(o=>[o.assetId,o])),r=new Map,n=[];for(let o of cl(e)){let c=o.assetId?s.get(o.assetId):null,d=o.assetId?M.boards.get(o.assetId):null,h=il(o,c,d?.loadState),u,m,p;if(!h)u=d.key,m=rl(o.worldMatrix,c.bundleToBoard),p=ia(m,d.scene.runtimeBounds);else{if(!o.boundsMm)continue;u=`stand-in:${h}`,M.scene.standIn(u,Hs[h].color),m=nl(o.worldMatrix,o.boundsMm),p=ia(m,[0,0,0,1,1,1])}r.has(u)||r.set(u,[]),r.get(u).push({matrix:m,key:o.path,hiddenLayers:h?[]:[...M.hiddenLayers.get(o.path)||[]],explode:h?null:ed(d,M.separation.get(o.path)||0)}),n.push({occurrence:o,rendererId:u,board:h?null:d,matrix:m,worldBounds:p,standIn:h})}for(let o of M.scene.assets.keys())r.has(o)||r.set(o,[]);M.scene.setOccurrences(r),M.groups=r;let i=M.placements;if(M.placed=n,M.placements=new Map(n.map(o=>[o.occurrence.path,o])),t||!i)Jm();else for(let o of n)o.label=i.get(o.occurrence.path)?.label;M.bounds=sa(n.map(o=>o.worldBounds)),M.bounds&&(z.sceneRadius=wa(M.bounds),M.framed||(z.frame(M.bounds),M.snapped||z.snap(),M.snapped=!0,n.some(o=>o.standIn==="loading")||(M.framed=!0)));for(let o of Je())xr(o);a!=null&&(M.placements.get(a)?.board===E?w.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(a):On()),Xl(),td(),Ut()}var ql=[.17,.18,.2];function Xl(){if(!M?.descriptor)return;let t=[];if(M.showHarnesses&&M.harnesses.length){let e=new Map(M.descriptor.occurrences.map(a=>[a.path,a.worldMatrix]));try{t=al(M.harnesses,a=>e.get(a)??null)}catch(a){console.warn("[prism-semantic-viewer] harness tubes failed",a)}}M.tubes=t,M.tubedHarnesses=new Set(t.map(e=>e.harness)),M.scene.setTubes(t,Wl)}function Wl(t){let e=M.harnessLit.get(t.harness),a=e?t.wires.map(s=>e.get(s)).find(Boolean):null;return a?{rgb:vm(a),mode:1}:{rgb:ql,mode:M.emphasisSets.length?2:0}}function vm(t){let e=/^#?([0-9a-f]{6})$/i.exec(String(t));if(!e)return ql;let a=Number.parseInt(e[1],16);return[(a>>16&255)/255,(a>>8&255)/255,(a&255)/255]}function Ka(){return!M||!E.renderer||!Jl()?null:E.renderer.occurrenceKeys[w.selectedOccurrence]??null}function Jl(){return!!(w.selectedFeatureId||w.activeNetId||M?.boardSelected)}function $l(t){if(E===t)return;let e=Se;Se=!0;try{Fe()}finally{Se=e}E=t,Re()}function On(){Fe(),E=za({key:""}),Re()}function Mm(t,e){let a=performance.now(),s=Math.max(0,t-Lt),r=Math.min(.05,(t-Lt)/1e3);Lt=t,z.update(r),M.scene.resize(),se={layerId:0,viewport:{x:0,y:0,width:D.width,height:D.height},matrix:z.matrix(D.width,D.height,!1),lod:zl(D.height/Math.min(devicePixelRatio||1,2),!1)};let n=ft(),i=new Map;for(let o of Je()){let c=Rm(o);o.scene.copperRealism!==ga()&&Wa(o),o.renderer.setInnerCopperAtFull(w.showBoard&&!Am(o)&&!n),o.renderer.dimCopper=n,ye(t,{},o);let d=o===E;i.set(o.renderer,{activeNetId:d?w.activeNetId:0,selectedFeatureId:d?w.selectedFeatureId:0,time:t/1e3,layerOffsets:c,visibleLayers:o.visible3dLayers,showBoard:w.showBoard,showComponents:w.showComponents,showPaste:!0,componentOpacity:1,boardOpacity:n?.34:1,isolateNet:w.isolateNet,compareMode:!1,compareOffsets:new Map,layerAlphas:null,visibleTileIds:o.visibleTileIds})}M.inputs=i,M.scene.setSelectedOccurrence(E.renderer&&Jl()?E.renderer.occurrenceBase+w.selectedOccurrence:-1),iy(t,i,n)&&(M.scene.render(se,o=>i.get(o)||Yl(t)),Od(),$m()),Wm(),Um(),M.timing.boardsDrawnAt==null&&ll(M.placed)&&(M.timing.boardsDrawnAt=performance.now());for(let o of Je())ud(t,o);In(s,performance.now()-a),Sn(t),Ga(e)}function Yl(t){return{activeNetId:0,selectedFeatureId:0,time:t/1e3,visibleLayers:new Set,showBoard:!0,showComponents:!1,componentOpacity:1,boardOpacity:1,isolateNet:!1}}function Em(t,e){let a=performance.now();return M.scene.pick(se,t,e,s=>M.inputs.get(s)||Yl(a))}function Tm(t){let e=t.occurrenceKey!=null?M.placements.get(t.occurrenceKey):null;if(!e)return Fe();if(e.standIn)return Ql(e);let a=e.board;if(w.isolateNet&&!Im(a,e.occurrence.path,t.featureId))return Fe();$l(a),w.selectedOccurrence=a.renderer.occurrenceKeys.indexOf(e.occurrence.path),t.featureId&&!M.move.enabled?Kt(t.featureId,!0):Yn()}function km(t){let e=t.occurrence!=null?M?.placements.get(String(t.occurrence)):null;if(e){if(e.standIn){Ql(e);return}if($l(e.board),w.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(e.occurrence.path),t.netName||t.netUid){let a=t.netUid&&E.scene.nets.find(s=>s.uid===t.netUid)||t.netName&&Vt(E.scene.nets,t.netName);a&&ma(Number(a.id),!0)}else t.netId?ma(Number(t.netId),!0):t.featureId?Kt(Number(t.featureId),!0):t.reference?Er(String(t.reference),!0):Yn()}}function Ql(t){let e=Se;Se=!0;try{Fe()}finally{Se=e}M.standInKey=t.occurrence.path,M.move.enabled&&wr(),Se||Va?.({kind:"board",sourceContext:"3D",occurrence:t.occurrence.path,standIn:t.standIn})}function Im(t,e,a){let s=Number(t.scene.features.get(Number(a))?.netId)||0;if(!s)return!1;let r=t.renderer.occurrenceKeys.indexOf(e);return r<0?!1:t.renderer.occurrenceEmphasis?.[r]?.has(s)?!0:t===E&&r===w.selectedOccurrence&&s===Number(w.activeNetId)}function pl(t,e){let a=M?.placements.get(String(e));return a?kn(t,a.matrix):null}function Zl(t=E){if(!M)return pa();let e=new Set(t===E?pa():[]);for(let a of t.renderer?.occurrenceEmphasis||[])if(a)for(let s of a.keys())e.add(Number(s));return e}function xr(t){let e=M.groups.get(t.key)||[],a=new Set;for(let s of t.scene.copperLayers){let r=Number(s.id);e.some(n=>!M.hiddenLayers.get(n.key)?.has(r))&&a.add(r)}if(w.isolateNet){let s=new Set;for(let r of Zl(t))for(let n of zn(r,t))s.add(n);t.visible3dLayers=new Set([...a].filter(r=>s.has(r)))}else t.visible3dLayers=a;ye(performance.now(),{force:!0},t)}function Pn(t,e){let a=t??(M.groups.get(E.key)||[]).map(s=>s.key);for(let s of a){let r=new Set(M.hiddenLayers.get(String(s))||[]);e(r,M.placements.get(String(s))?.board),M.hiddenLayers.set(String(s),r)}for(let s of Je()){let r=M.groups.get(s.key)||[];for(let n of r)n.hiddenLayers=[...M.hiddenLayers.get(n.key)||[]];s.renderer.setOccurrenceHiddenLayers(r.map(n=>n.hiddenLayers)),xr(s)}Re(),Ut()}function Sm(){let t=Ka();if(t==null||!w.activeNetId)return;let e=zn(w.activeNetId,E);e.size&&Pn([t],a=>{a.clear();for(let s of E.scene.copperLayers)e.has(Number(s.id))||a.add(Number(s.id))})}function Rm(t){if(t.scene.layerSteps)return t.scene.layerSteps;let e=new Float32Array(256),a=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((s,r)=>{e[Number(s.id)]=a-r}),t.scene.layerSteps=e,e}function ed(t,e){let a=t?.scene.runtimeBounds,s=a?Math.hypot((a[3]-a[0])*1e3,(a[4]-a[1])*1e3):0;return[e*e*ne(s*.12,8,25)/1e3,e<.0999?1:0,1-e*.72,1]}function Am(t){return(M.groups.get(t.key)||[]).some(e=>(M.separation.get(e.key)||0)>.001)}function _m(t,e){let a=e!=null?[String(e)]:(M.groups.get(E.key)||[]).map(s=>s.key);for(let s of a)M.separation.set(s,t);for(let s of Je()){let r=M.groups.get(s.key)||[];s.renderer.setOccurrenceExplode(r.map(n=>ed(s,M.separation.get(n.key)||0)))}Ut()}function Nm(){return M.placed.map(t=>{let e=M.hiddenLayers.get(t.occurrence.path)||new Set,a=t.board;return{key:t.occurrence.path,name:t.occurrence.displayPath||t.occurrence.path,standIn:t.standIn||null,separation:M.separation.get(t.occurrence.path)||0,layers:a?a.scene.copperLayers.map(s=>({id:Number(s.id),name:String(s.name),color:Qn(vr(s,a)),visible:!e.has(Number(s.id))})):[]}})}function Cm(t){if(!M)return[];let e=ft();M.emphasisSets=(Array.isArray(t)?t:[]).map((r,n)=>{let i=wi(r?.color??Fr[n%Fr.length]);return{key:String(r?.key??n),mark:i,color:`#${(i&16777215).toString(16).padStart(6,"0")}`,members:(Array.isArray(r?.members)?r.members:[]).filter(o=>o&&typeof o.occurrence=="string"&&typeof o.net=="string"),wires:(Array.isArray(r?.wires)?r.wires:[]).filter(o=>o&&typeof o.harness=="string"&&typeof o.wire=="string")}});let a=td(),s=ft();return s&&!e?yr():!s&&e&&(w.isolateNet&&Gt(!1),Fn()),w.isolateNet&&s&&ea(),a}function td(){if(!M)return[];let t=new Map;for(let[n,i]of M.groups)t.set(n,i.map(()=>null));let e=new Map;for(let n of M.groups.values())n.forEach((i,o)=>e.set(i.key,o));M.emphasisBounds=new Map;let a=M.emphasisSets.map(n=>{let i={key:n.key,color:n.color,lit:0,unresolved:[]},o=[];M.emphasisBounds.set(n.key,o);for(let c of n.members){let d=M.placements.get(c.occurrence),h=d?.board;if(!h){let y=d?d.standIn==="loading"||d.standIn==="building"?"loading":d.standIn==="restricted"?"restricted":"not-drawn":"not-drawn";i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:y});continue}let u=Vt(h.scene.nets,c.net),m=Number(u?.id)||0;if(!m){i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:"unknown-net"});continue}let p=t.get(h.key),f=e.get(c.occurrence);if(!p||f==null)continue;p[f]=p[f]||new Map,p[f].has(m)||p[f].set(m,n.mark),i.lit+=1;let l=Ea(u.boundsMm);l&&o.push({occurrence:c.occurrence,box:ia(d.matrix,l)})}return i});M.harnessLit=Pc(M.harnesses,M.emphasisSets),M.harnessDrawn=null,M.scene.setTubeColors(Wl);for(let n of a){n.wires=0;for(let i of M.harnessLit.values())for(let o of i.values())o===n.color&&(n.wires+=1)}let s=M.emphasisSets.length>0;for(let n of Je())n.renderer.setOccurrenceEmphasis(s&&t.get(n.key)||null,{dimCopper:s});if(w.isolateNet)for(let n of Je())xr(n);let r=JSON.stringify(a)!==JSON.stringify(M.emphasisReport);return M.emphasisReport=a,r&&M.onEmphasis?.(a),a}function Fm(t=null,e=null){let a=[];for(let[r,n]of M?.emphasisBounds||[])if(!(t!=null&&r!==String(t)))for(let i of n)(e==null||i.occurrence===e)&&a.push(i.box);let s=sa(a);return s?(z.frame(s),!0):!1}function Bm(t){let e=[];for(let s of Array.isArray(t)?t:[]){let r=M?.placements.get(String(s?.occurrence)),n=r?.board?.scene.componentFeatures.get(String(s?.reference)),i=n?r.board.scene.features.get(Number(n.featureId))?.bounds:null;i&&e.push(ia(r.matrix,i))}let a=sa(e);return a?(z.frame(a),!0):!1}var ad=.001,jm=90,gl=["#e5484d","#30a46c","#3e63dd"],yn=["X","Y","Z"];function sd(t,e){if(!t||!e)return!1;let a=Ot(t),s=Ot(e),r=[...a.translationMm,...a.rotation],n=[...s.translationMm,...s.rotation];return r.every((i,o)=>Math.abs(i-n[o])<1e-6)}function Om(){return{allowed:!1,enabled:!1,space:"world",target:null,preview:null,drag:null}}function rd(){let t=M.baseDescriptor;return!t||!M.move.target||!M.move.preview?t:Fo(t,M.move.target,M.move.preview)}function Ha(){M.baseDescriptor&&(M.descriptor=rd(),cr({relabel:!1}))}function Dn(){let t=M.move.target;return t?M.baseDescriptor?.occurrences.find(e=>e.path===t)??null:null}function nd(){let t=M.move,e=Dn();return{allowed:t.allowed,enabled:t.enabled,space:t.space,dragging:!!t.drag,target:e?{occurrence:e.path,instanceId:e.instanceId,displayPath:e.displayPath,kind:e.kind,restricted:!!e.restricted,pose:Ot(t.preview??e.pose),source:t.preview?"manual":e.pose?.source??"default",unsaved:!!t.preview}:null}}function nt(t){M.onMove?.({phase:t,...nd()})}function Pm(t){M.move.allowed=!!t,!M.move.allowed&&M.move.enabled&&lr(!1)}function lr(t){let e=!!t&&M.move.allowed;e!==M.move.enabled&&(e||od(),M.move.enabled=e,e&&wr({quiet:!0}),nt("mode"))}function id(t){M.move.space=t==="local"?"local":"world",nt("mode")}function Ln(){return M.standInKey??Ka()}function wr({quiet:t=!1}={}){if(!M)return;let e=Ln(),a=M.move.enabled&&e!=null?Co(M.baseDescriptor,e)?.path??null:null;a!==M.move.target&&(od(),M.move.target=a,t||nt("target"))}function od(){let t=!!M.move.preview;M.move.drag=null,M.move.preview=null,M.move.target=null,t&&Ha()}function Dm(t){M?.move.target&&(M.move.preview=t?Ot(t):null,Ha(),nt("preview"))}function Un(){!M||!M.move.preview&&!M.move.drag||(M.move.drag=null,M.move.preview=null,Ha(),nt("cancel"))}function Lm(){let t=`${M.move.target}/`,e=sa(M.placed.filter(a=>a.occurrence.path===M.move.target||a.occurrence.path.startsWith(t)).map(a=>a.worldBounds));return e?[0,1,2].map(a=>(e[a]+e[a+3])/2/ad):null}function Xs(t){let e=Na(se.matrix,De(t,ad),se.viewport);if(!e)return null;let a=D.getBoundingClientRect();return[e.x*a.width/D.width,e.y*a.height/D.height]}function Um(){let t=st;if(!t)return;let e=Dn(),a=M.move.enabled&&e&&se?Lm():null,s=a?Xs(a):null;if(!s){t.toggleAttribute("hidden",!0),M.gizmo=null;return}t.toggleAttribute("hidden",!1),t.firstChild||Gm(t);let{right:r,back:n}=z.basis(),i=Xs(Qe(a,r)),o=i?Math.hypot(i[0]-s[0],i[1]-s[1]):0;if(!(o>1e-6)){t.toggleAttribute("hidden",!0);return}let c=jm/o,d=M.move.preview??e.pose,h=M.move.space==="local"?Ao(d):Zr,u=[];h.forEach((p,f)=>{let l=Xs(Qe(a,De(p,c))),y=t.querySelector(`[data-part="t${f}"]`),b=l&&Math.hypot(l[0]-s[0],l[1]-s[1])>12;if(y.style.display=b?"":"none",b){let T=y.querySelector("line");T.setAttribute("x1",s[0]),T.setAttribute("y1",s[1]),T.setAttribute("x2",l[0]),T.setAttribute("y2",l[1]),y.querySelector("circle").setAttribute("cx",l[0]),y.querySelector("circle").setAttribute("cy",l[1]),y.querySelector("text").setAttribute("x",l[0]+9),y.querySelector("text").setAttribute("y",l[1]-7)}let g=Bo(p),x=pt(p,g),v=[];for(let T=0;T<=64;T+=1){let I=T/64*Math.PI*2,S=Xs(Qe(a,De(Qe(De(g,Math.cos(I)),De(x,Math.sin(I))),c*.7)));S&&v.push(`${S[0].toFixed(1)},${S[1].toFixed(1)}`)}t.querySelector(`[data-part="r${f}"]`).setAttribute("points",v.join(" ")),u.push({axis:p,pxPerMm:l?[(l[0]-s[0])/c,(l[1]-s[1])/c]:[0,0]})});let m=t.querySelector('[data-part="pivot"]');m.setAttribute("cx",s[0]),m.setAttribute("cy",s[1]),M.gizmo={center:s,pivot:a,handles:u,back:n}}function Gm(t){let e="http://www.w3.org/2000/svg",a=(s,r)=>{let n=document.createElementNS(e,s);for(let[i,o]of Object.entries(r))n.setAttribute(i,o);return n};gl.forEach((s,r)=>{let n=a("polyline",{"data-part":`r${r}`,class:"ring",stroke:s,fill:"none"}),i=a("title",{});i.textContent=`Rotate about ${yn[r]}`,n.append(i),t.append(n)}),gl.forEach((s,r)=>{let n=a("g",{"data-part":`t${r}`,class:"arrow",stroke:s,fill:s}),i=a("title",{});i.textContent=`Move along ${yn[r]}`;let o=a("text",{stroke:"none"});o.textContent=yn[r],n.append(i,a("line",{}),a("circle",{r:6}),o),t.append(n)}),t.append(a("circle",{"data-part":"pivot",r:4,class:"pivot"})),t.append(a("text",{"data-part":"readout",class:"readout"})),t.addEventListener("pointerdown",Km),t.addEventListener("pointermove",zm),t.addEventListener("pointerup",Vm),t.addEventListener("pointercancel",()=>cd())}function Km(t){let e=t.target.closest?.("[data-part]")?.dataset.part;if(!M||!e||!M.gizmo||!/^[tr][012]$/.test(e))return;t.preventDefault(),t.stopPropagation();let a=Dn(),s=st.getBoundingClientRect();M.move.drag={kind:e[0]==="t"?"translate":"rotate",handle:M.gizmo.handles[Number(e[1])],start:[t.clientX-s.left,t.clientY-s.top],startPose:Ot(M.move.preview??a.pose),hadPreview:!!M.move.preview,center:M.gizmo.center,pivot:M.gizmo.pivot,back:M.gizmo.back,changed:!1};try{st.setPointerCapture(t.pointerId)}catch{}}function zm(t){let e=M?.move.drag;if(!e)return;let a=st.getBoundingClientRect(),s=[t.clientX-a.left,t.clientY-a.top],r=t.shiftKey,n,i;if(e.kind==="translate"){let c=en(Io([s[0]-e.start[0],s[1]-e.start[1]],e.handle.pxPerMm),r?Aa.fineMm:Aa.mm);n=_o(e.startPose,e.handle.axis,c),i=`${c>=0?"+":""}${c.toFixed(r?1:0)} mm`}else{let c=Ro(e.handle.axis,e.back,So(e.center,e.start,s))*180/Math.PI,d=en(c,r?Aa.fineDeg:Aa.deg);n=No(e.startPose,e.handle.axis,d*Math.PI/180,e.pivot),i=`${d>=0?"+":""}${d.toFixed(0)}\xB0`}e.changed=e.changed||!sd(n,e.startPose),M.move.preview=Ot(n);let o=st.querySelector('[data-part="readout"]');o.textContent=i,o.setAttribute("x",s[0]+14),o.setAttribute("y",s[1]-10),Ha(),nt("preview")}function Vm(t){let e=M?.move.drag;e&&(st.hasPointerCapture?.(t.pointerId)&&st.releasePointerCapture(t.pointerId),M.move.drag=null,st.querySelector('[data-part="readout"]').textContent="",e.changed?nt("commit"):e.hadPreview||Un())}function cd(){let t=M?.move.drag;return t?(M.move.drag=null,M.move.preview=t.hadPreview?t.startPose:null,st.querySelector('[data-part="readout"]').textContent="",Ha(),nt("cancel"),!0):!1}function Hm(t,e){let a=M.move;if(e==="escape"){if(Jt&&!Jt.hidden)Jt.hidden=!0;else if(!cd())if(a.preview)Un();else if(a.enabled)lr(!1);else return!1;return!0}if(e==="m"&&a.allowed)lr(!a.enabled);else if(e==="l"&&a.enabled)id(a.space==="world"?"local":"world");else if(e==="enter"&&a.preview&&!a.drag)nt("commit");else if(t.key==="?")ld(!!Jt?.hidden);else if(e==="a")z.frame(M.bounds||Zt());else return!1;return!0}function ld(t){Jt&&(Jt.hidden=!t)}var xn="http://www.w3.org/2000/svg";function qm(t){let e=t.occurrence?M.placements.get(t.occurrence):null;if(!e)return null;let a=t.reference&&e.board?e.board.scene.componentFeatures.get(t.reference):null,s=a?e.board.scene.features.get(Number(a.featureId))?.bounds:null;if(s)return Ts(e.matrix,[0,1,2].map(n=>(s[n]+s[n+3])/2));let r=e.worldBounds;return r?[0,1,2].map(n=>(r[n]+r[n+3])/2):null}function Xm(){let t=M.emphasisSets.length>0,e=[],a=[];for(let s of M.showHarnesses?M.harnesses:[]){let r=M.harnessLit.get(Ls(s)),n=Lc(s,r),i=new Map(s.ends.map(c=>[c.id,qm(c)]));i.set("hub",s.ends.length>2?Uc([...i.values()]):null);let o=s.name||"Harness";for(let c of M.tubedHarnesses.has(Ls(s))?[]:Oc(s)){let d=Dc(c,r),h=document.createElementNS(xn,"line");h.setAttribute("class",`segment${d?" lit":t?" dim":""}`),d&&Object.assign(h.style,{stroke:d,color:d});let u=document.createElementNS(xn,"title");u.textContent=`${o}: ${c.wires.size} wire${c.wires.size===1?"":"s"}`,h.append(u),a.push(h),e.push({node:h,kind:"line",a:i.get(c.a),b:i.get(c.b)})}for(let c of s.ends){let d=n.get(c.id),h=document.createElementNS(xn,"circle");h.setAttribute("class",`end${d?" lit":t?" dim":""}`),h.setAttribute("r",d?"6":"4"),d&&(h.style.fill=d),a.push(h),e.push({node:h,kind:"dot",a:i.get(c.id)})}}sr.replaceChildren(...a),M.harnessDrawn={items:e,matrix:null}}function Wm(){if(!sr||!se)return;M.harnessDrawn||Xm();let t=M.harnessDrawn;sr.toggleAttribute("hidden",!t.items.length);let e=se.matrix.join(",");if(t.matrix===e)return;t.matrix=e;let a=D.getBoundingClientRect(),s=a.width/Math.max(1,D.width),r=a.height/Math.max(1,D.height),n=i=>{let o=i?Na(se.matrix,i,se.viewport):null;return o?[o.x*s,o.y*r]:null};for(let i of t.items){let o=n(i.a),c=i.kind==="line"?n(i.b):null,d=i.kind==="line"?!!(o&&c):!!o;i.node.style.display=d?"":"none",d&&(i.kind==="line"?(i.node.setAttribute("x1",o[0].toFixed(1)),i.node.setAttribute("y1",o[1].toFixed(1)),i.node.setAttribute("x2",c[0].toFixed(1)),i.node.setAttribute("y2",c[1].toFixed(1))):(i.node.setAttribute("cx",o[0].toFixed(1)),i.node.setAttribute("cy",o[1].toFixed(1))))}}function Jm(){Yt&&(M.labelsDrawn=null,Yt.replaceChildren(...M.placed.map(t=>{let e=document.createElement("div");e.className=`scene-label${t.standIn?` stand-in ${t.standIn}`:""}`;let a=document.createElement("strong");a.textContent=t.occurrence.displayPath||t.occurrence.labels?.join(" / ")||t.occurrence.path,e.append(a);let s=t.standIn?Hs[t.standIn]?.label:"";if(s){let r=document.createElement("span");r.textContent=s,e.append(r)}return t.label=e,e})))}function $m(){if(!Yt||!se)return;if(Yt.hidden=!M.showLabels,!M.showLabels){M.labelsDrawn=null;return}let t=D.getBoundingClientRect(),e=Ln(),a=`${e}|${t.width}x${t.height}|${Array.prototype.join.call(se.matrix,",")}`;if(M.labelsDrawn?.placed===M.placed&&M.labelsDrawn.key===a)return;M.labelsDrawn={placed:M.placed,key:a};let s=t.width/Math.max(1,D.width),r=t.height/Math.max(1,D.height);for(let n of M.placed){if(!n.label)continue;let[i,o,,c,d,h]=n.worldBounds,u=Na(se.matrix,[(i+c)/2,(o+d)/2,h],se.viewport),m=u&&u.x>=0&&u.y>=0&&u.x<=D.width&&u.y<=D.height;n.label.hidden=!m,m&&(n.label.style.transform=`translate(${(u.x*s).toFixed(1)}px, ${(u.y*r).toFixed(1)}px) translate(-50%, -100%)`),n.label.classList.toggle("selected",e===n.occurrence.path)}}function Ym(t,e=E){return hi(t,e.scene.copperLayers)}async function dd(t=me,e=E){let a=e.semanticGeometry.assets?.components_glb;if(!a||e.scene.componentTier!=="idle")return;e.scene.componentTier="loading";let s;try{s=await Ra(new URL(a,location.href).toString(),{componentFeatures:e.scene.componentFeatures,fetchBytes:dr(e)})}catch(r){throw ge(t)&&(e.scene.componentTier="idle"),r}if(!(!ge(t)||!e.renderer)){e.scene.componentTier="loaded",e.loadedBytes+=s.byteLength;for(let r of s.primitives){let n=e.scene.componentFeatures.get(r.designator);n&&ey(n.featureId,r.position,e)}M&&(M.harnessDrawn=null,M.labelsDrawn=null);for(let[r,n]of s.componentNodeCounts||[])e.scene.componentModelCounts.set(r,n);e.hiddenComponentRequest&&Rd(e.hiddenComponentRequest),e.scene.componentEntries=ss(s.primitives).map(r=>e.renderer.addPrimitive(r,{kind:"component",layerId:0,material:r.material,color:r.material.baseColor}))}}function dr(t=E){return t.assetCache?e=>t.assetCache.fetchBytes(e):void 0}function ud(t,e=E){if(!e.renderer||t-(e.tiersCheckedAt||0)<250)return;e.tiersCheckedAt=t;let a=e.renderer.identityOnly&&!e.deferComponents||!e.renderer.identityOnly&&e.renderer.cullCounts.full>0;a&&(e.scene.componentsWantedAt=t),a&&e.scene.componentTier==="idle"&&e.semanticGeometry.assets?.components_glb&&dd(me,e).then(()=>{M&&e.renderer&&e.scene.componentTier==="loaded"&&Tn(e.scene.runtimeBounds,e)}).catch(r=>console.warn("Failed to load components",r));let s=()=>M?M.scene.gpuMemoryBytes():e.renderer.gpuMemoryBytes();e.gpuBytes=s(),!(e.gpuBytes<=w.gpuBudgetBytes)&&(e.scene.componentTier==="loaded"&&t-e.scene.componentsWantedAt>Yg&&(e.renderer.removeEntries(e.scene.componentEntries),e.scene.componentEntries=[],e.scene.componentTier="idle",e.scene.componentEvictions+=1,e.gpuBytes=s()),e.gpuBytes>w.gpuBudgetBytes&&Ll(e.visibleTileIds||new Set,Math.max(0,e.residentTileGpuBytes-(e.gpuBytes-w.gpuBudgetBytes)),e))}var ml=4e-4,yl=5e-5,Qm={baseColor:[.62,.7,.8,1],metallic:0,roughness:.8,emissive:[0,0,0]};function Tn(t,e=E){if(!e.renderer)return;let a=new Map;for(let i of e.topology.physical_objects||[])i.kind==="footprint_body"&&i.designator&&i.bbox_mm?.length===4&&a.set(i.designator,i);let s=(t?.[5]??8e-4)+yl,r=(t?.[2]??-8e-4)-yl,n=[];for(let i of e.scene.componentFeatures.values()){let o=Number(i.featureId),c=e.scene.features.get(o),d=a.get(i.designator);if(!c||c.bounds||!d)continue;let[h,u,m,p]=d.bbox_mm.map(Number),f=String(d.layer||"").startsWith("B."),l=[h/1e3,-p/1e3,f?r-ml:s,m/1e3,-u/1e3,f?r:s+ml];c.bounds=l,c.placeholder=!0,n.push(Zm(l,o))}if(n.length)for(let i of ss(n))e.renderer.addPrimitive(i,{kind:"component",layerId:0,material:i.material,color:i.material.baseColor,opacityScale:.3,translucent:!0,placeholder:!0})}function Zm([t,e,a,s,r,n],i){let o=[[[0,0,1],[[t,e,n],[s,e,n],[s,r,n],[t,r,n]]],[[0,0,-1],[[t,r,a],[s,r,a],[s,e,a],[t,e,a]]],[[1,0,0],[[s,e,a],[s,r,a],[s,r,n],[s,e,n]]],[[-1,0,0],[[t,r,a],[t,e,a],[t,e,n],[t,r,n]]],[[0,1,0],[[s,r,a],[t,r,a],[t,r,n],[s,r,n]]],[[0,-1,0],[[t,e,a],[s,e,a],[s,e,n],[t,e,n]]]],c=new Float32Array(72),d=new Float32Array(72),h=new Uint32Array(36);return o.forEach(([u,m],p)=>{m.forEach((l,y)=>{c.set(l,(p*4+y)*3),d.set(u,(p*4+y)*3)});let f=p*4;h.set([f,f+1,f+2,f,f+2,f+3],p*6)}),{position:c,normal:d,netId:new Uint32Array(24),objectFeatureId:new Uint32Array(24).fill(i),indices:h,material:Qm,bounds:[t,e,a,s,r,n]}}function ey(t,e,a=E){let s=a.scene.features.get(Number(t));if(!s||!e.length)return;let r=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let n=0;n<e.length;n+=3)r[0]=Math.min(r[0],e[n]),r[1]=Math.min(r[1],e[n+1]),r[2]=Math.min(r[2],e[n+2]),r[3]=Math.max(r[3],e[n]),r[4]=Math.max(r[4],e[n+1]),r[5]=Math.max(r[5],e[n+2]);s.bounds=s.bounds?[Math.min(s.bounds[0],r[0]),Math.min(s.bounds[1],r[1]),Math.min(s.bounds[2],r[2]),Math.max(s.bounds[3],r[3]),Math.max(s.bounds[4],r[4]),Math.max(s.bounds[5],r[5])]:r}function vr(t,e=E){return li(t,e.scene.copperLayers)}var ty=[.55,.35,.16,.78];function fd(t=E){return ui(t.topology?.board?.stackup?.copper_finish)}function hd(t,e=E){return fi(t,e.scene.copperLayers)}var ay=.25;function ga(){return!w.realisticColors||w.mode==="layer"?0:1-ne(w.separation/ay,0,1)}function bd(t,e=E){let a=hd(t,e)?fd(e):Ma.copper;return pd(vr(t,e),a,ga())}function pd(t,e,a){return t.map((s,r)=>s+(e[r]-s)*a)}function sy(t,e=me){if(e===me&&M&&z){Mm(t,e);return}if(e!==me||!E.renderer||!z)return;let a=performance.now(),s=Math.max(0,t-Lt);if(w.workspace==="schematic"&&N){Lt=t;let d=N.visiblePages(),h=Y?cy(d):[];N.setDomDetailPageIds(h.map(u=>u.id)),P.visiblePages=N.render(),Y?.syncWorldPages(h,N,{activeNetUid:P.activeNetUid}),Dd(),In(s,performance.now()-a),Sn(t),Ga(e);return}let r=Math.min(.05,(t-Lt)/1e3);Lt=t,z.update(r),E.renderer.resize();let n=yd();E.scene.copperRealism!==ga()&&Wa();for(let d of E.renderer.entries)d.layerOffset=n[d.layerId]||0;ly(t),Qt=xd(t);let i=uy(t);se={layerId:0,viewport:{x:0,y:0,width:D.width,height:D.height},matrix:z.matrix(D.width,D.height,w.mode==="layer"),lod:zl(D.height,w.mode==="layer")},E.renderer.selectedOccurrence=w.selectedFeatureId||w.activeNetId?w.selectedOccurrence:-1,E.renderer.setInnerCopperAtFull(w.showBoard&&w.separation<=.001&&!pa().size),ye(t);let o=w.mode==="3d"?E.visible3dLayers:Ol(),c={panels:[se],activeNetId:w.activeNetId,selectedFeatureId:w.selectedFeatureId,time:t/1e3,layerOffsets:n,visibleLayers:o,showBoard:w.showBoard,showComponents:w.showComponents,showPaste:w.separation===0,componentOpacity:ne(1-w.separation/.1,0,1),boardOpacity:pa().size?.34:1-w.separation*.72,isolateNet:w.isolateNet,compareMode:w.mode==="layer",compareOffsets:Qt,layerAlphas:i,visibleTileIds:w.mode==="3d"?E.visibleTileIds:null};ry(t,c)&&(E.renderer.render(c),Od(),Ay()),ud(t),In(s,performance.now()-a),Sn(t),Ga(e)}var gd=1e3,tt={key:"",matrix:new Float32Array(16),tiles:null,at:0};function ry(t,e){let a=e.panels[0].matrix,s=!1;for(let o=0;o<16;o+=1)if(a[o]!==tt.matrix[o]){s=!0;break}if(s)return tt.matrix.set(a),tt.key="",tt.at=t,!0;let r=[D.width,D.height,E.renderer.version,E.renderer.selectedOccurrence,w.workspace,w.mode,e.activeNetId,e.selectedFeatureId,e.showBoard,e.showComponents,e.showPaste,e.componentOpacity,e.boardOpacity,e.isolateNet,E.scene.layerZOffsetSignature,[...e.visibleLayers].join(","),[...e.compareOffsets].map(([o,c])=>`${o}:${c}`).join(";"),e.layerAlphas?[...e.layerAlphas].join(";"):""].join("|");return!!(e.activeNetId||e.selectedFeatureId||E.renderer.emphasizedNetIds.size)||r!==tt.key||!md(e.visibleTileIds,tt.tiles)||t-tt.at>gd?(tt.key=r,tt.tiles=e.visibleTileIds,tt.at=t,!0):!1}var ny=1e3/30-2,je={scene:null,key:"",matrix:new Float32Array(16),tiles:new Map,at:0};function iy(t,e,a){let s=se.matrix,r=!1;for(let m=0;m<16;m+=1)if(s[m]!==je.matrix[m]){r=!0;break}if(je.scene!==M.scene&&(je.scene=M.scene,r=!0),r)return je.matrix.set(s),je.key="",je.at=t,!0;let n=[D.width,D.height,w.showBoard,w.showComponents,w.isolateNet,w.activeNetId,w.selectedFeatureId,w.selectedOccurrence,M.showLabels,a,ga(),Ln(),M.scene.tubeVersion];for(let m of M.scene.renderers){let p=e.get(m);n.push(m.version,m.occurrenceCount,m.selectedOccurrence,m.dimCopper,m.standIn?m.boxColor.join(","):"",p?[...p.visibleLayers].join(","):"",p?.layerOffsets?Array.prototype.join.call(p.layerOffsets,","):"")}let i=n.join("|"),o=!1;for(let[m,p]of e)md(p.visibleTileIds,je.tiles.get(m))||(o=!0);let c=!!(a||w.activeNetId||w.selectedFeatureId),d=o||i!==je.key,h=c&&t-je.at>=ny;return d||h||t-je.at>gd?(je.key=i,je.tiles=new Map([...e].map(([m,p])=>[m,p.visibleTileIds])),je.at=t,!0):!1}function md(t,e){if(!t||!e)return t===e;if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function oy(t){if(!N||!t)return{widthPx:0,heightPx:0,sourcePxPerMm:0,area:0};let e=N.pagePixelWidth(t),a=t.heightMm/Math.max(1e-6,N.scale),s=N.pageSourcePixelsPerMm(t);return{widthPx:e,heightPx:a,sourcePxPerMm:s,area:e*a}}function cy(t){if(!Y||!N)return[];let e=t||[],a=Math.max(1,Ie.clientWidth*Ie.clientHeight);return e.map(n=>({page:n,...oy(n)})).filter(n=>n.widthPx>=760&&n.heightPx>=520&&n.area>=a*.36&&n.sourcePxPerMm>=1.25).sort((n,i)=>i.area-n.area).slice(0,1).map(n=>n.page)}function yd(t=E){let e=Zt(t),a=Math.hypot((e[3]-e[0])*1e3,(e[4]-e[1])*1e3),s=w.separation*w.separation*ne(a*.12,8,25)/1e3,r=`${w.separation}:${s}:${t.scene.copperLayers.length}`;if(t.scene.layerZOffsetSignature===r)return t.scene.layerZOffsets;let n=t.scene.layerZOffsets;n.fill(0);let i=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((o,c)=>{n[Number(o.id)]=(i-c)*s}),t.scene.layerZOffsetSignature=r,n}function xd(t){if(w.mode!=="layer")return we.key="3d",we.current.clear(),new Map;let e=E.scene.copperLayers.filter(y=>E.compareLayers.has(Number(y.id))),a=Math.max(1,e.length),s=D.width/Math.max(1,D.height),r=1;a===2?r=s>=1?2:1:a===3||a===4?r=2:a>4&&(r=Math.ceil(Math.sqrt(a*s)));let n=Math.ceil(a/r),i=Zt(),o=i[3]-i[0],c=i[4]-i[1],d=o*1.18,h=c*1.22,u=e.map((y,b)=>{let g=b%r,x=Math.floor(b/r);return{layer:y,layerId:Number(y.id),column:g,row:x,offset:[(g-(r-1)/2)*d,((n-1)/2-x)*h,0]}}),m=`${r}x${n}:${u.map(y=>y.layerId).join(",")}`;if(m!==we.key){we.key=m,we.started=t,we.from=new Map(we.current);let y=r*o+(r-1)*(d-o),b=n*c+(n-1)*(h-c);z.targetFocus=[(i[0]+i[3])/2,(i[1]+i[4])/2,(i[2]+i[5])/2],z.targetOrthoScale=Math.max(b,y/s)*1.08}let p=ne((t-we.started)/420,0,1),f=1-Math.pow(1-p,3),l=new Map;for(let y of u){let b=we.from.get(y.layerId)||[0,0,0],g=y.offset.map((x,v)=>b[v]+(x-b[v])*f);l.set(y.layerId,g),we.current.set(y.layerId,g)}if(q.phase==="reveal")for(let y of q.previous)l.has(Number(y))||l.set(Number(y),q.previousOffsets.get(Number(y))||[0,0,0]);for(let y of[...we.current.keys()])u.some(b=>b.layerId===y)||we.current.delete(y);return l}function qa(t){let e=new Set([...t].map(Number));if(!(xl(e,E.desiredCompareLayers)&&q.phase!=="idle")){if(E.desiredCompareLayers=e,xl(e,E.compareLayers)){q.phase="idle",q.previous.clear(),q.target.clear();return}q.phase="preload",q.previous=new Set(E.compareLayers),q.target=new Set(e),q.previousOffsets=new Map(we.current),q.started=performance.now(),ye(q.started,{force:!0})}}function Gn({snap:t=!0}={}){w.mode="layer";let e=dm();E.desiredCompareLayers=new Set(e),!E.compareLayers.size&&e.size&&(E.compareLayers=new Set(e)),q.phase="idle",q.previous.clear(),q.target.clear(),we.key="",z.setAxis("z",!1),E.renderer?.resize(),Qt=xd(performance.now()),t&&z.snap(),ye(performance.now(),{force:!0})}function ly(t){if(!(w.mode!=="layer"||q.phase==="idle")){if(q.phase==="preload"){if(!dy(q.target)){ye(t,{force:!0});return}q.phase="reveal",q.started=t,q.previousOffsets=new Map(we.current),E.compareLayers=new Set(q.target),we.key="";return}q.phase==="reveal"&&t-q.started>=Ml&&(E.compareLayers=new Set(q.target),q.phase="idle",q.previous.clear(),q.target.clear(),q.previousOffsets.clear(),ye(t,{force:!0}))}}function dy(t,e=E){for(let a of e.scene.tiles.values())if(t.has(Number(a.layerId))&&!e.scene.residentTiles.has(a.id)&&!e.scene.failed.has(a.id))return!1;return!0}function uy(t){if(w.mode!=="layer"||q.phase!=="reveal")return null;let e=ne((t-q.started)/Ml,0,1),a=e*e*(3-2*e),s=new Map;for(let r of q.previous)s.set(Number(r),q.target.has(Number(r))?1:1-a);for(let r of q.target)s.set(Number(r),q.previous.has(Number(r))?1:a);return s}function xl(t,e){if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function Kn(){if(w.workspace==="schematic"){hy();return}if(w.workspace==="bom"){fy();return}if(w.workspace==="stackup")return;hr.textContent=E.viewerReadiness.stage==="semantic-ready"?"Semantic GLTF A0":"Prism staged 3D",br.textContent="Layers",pr.textContent="Visibility and compare",J('[data-panel="search"] .section-heading span').textContent="Nets, components and pins",J('[data-panel="view"] .section-heading span').textContent="Camera and stackup";let t=`
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
    </label>`,Re(),xy()}function fy(){hr.textContent="BoM A0",br.textContent="Bill of Materials",pr.textContent="Grouped procurement view",J('[data-panel="search"] .section-heading span').textContent="Search inside the BoM table",J('[data-panel="view"] .section-heading span').textContent="BoM actions";let t=We?.payload?.counts||{};Xe.innerHTML=`
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
    </div>`,be.querySelector("#clear-selection")?.addEventListener("click",Fe)}function hy(){hr.textContent=Y?"Schematic SVG DOM":P.manifest?.schema==="prism.schematic_vector_a0"?"Schematic Vector A0":"Schematic World A0",br.textContent="Pages",pr.textContent=`${P.pages.length} hierarchy instances`,J('[data-panel="search"] .section-heading span').textContent="Pages, nets and components",J('[data-panel="view"] .section-heading span').textContent="World navigation",Xe.innerHTML=`
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
    </div>`,Xe.querySelectorAll("[data-page]").forEach(t=>{t.addEventListener("click",()=>ht(t.dataset.page,!0))}),Xe.querySelectorAll("[data-page-action]").forEach(t=>{t.addEventListener("click",()=>Ys(t.dataset.pageAction))}),be.querySelector("#entity-search").addEventListener("input",t=>{py(t.target.value)}),be.querySelector("#frame-selection").addEventListener("click",Md),be.querySelector("#clear-selection").addEventListener("click",Xa),Ce.querySelector("#show-hierarchy").checked=N?.showHierarchy??!0,Ce.querySelector("#show-hierarchy").addEventListener("change",t=>{N.showHierarchy=t.target.checked})}function ht(t,e){let a=P.byId.get(t);!a||!N||(w.selectedPageId=a.id,w.selectedSchematicFeature=null,N.selectedPageId=a.id,N.selectedFeatureId=0,rt.textContent=JSON.stringify(a,null,2),e&&N.framePage(a),Xe.querySelectorAll("[data-page]").forEach(s=>{s.classList.toggle("active",s.dataset.page===a.id)}))}function Ys(t){if(!N)return;if(t==="world"){N.frameWorld();return}let e=Math.max(0,P.pages.findIndex(s=>s.id===w.selectedPageId)),a=null;t==="previous"?a=P.pages[(e-1+P.pages.length)%P.pages.length]:t==="next"?a=P.pages[(e+1)%P.pages.length]:t==="parent"&&(a=P.byId.get(P.pages[e]?.parentId)),a&&ht(a.id,!0)}function by(t){if(!t||!N)return;if(Xa(),t.kind==="page"&&t.pageId){ht(t.pageId,!0);return}if(t.kind!=="sheet")return;let e=P.pages.find(n=>n.sheetInstancePath===t.sheetInstancePath)||P.byId.get(w.selectedPageId),a=String(t.sheetFile||t.feature?.sheet_file||"").replace(/\\/g,"/"),s=String(t.sheetName||t.feature?.sheet_name||t.feature?.objectId||""),r=P.pages.find(n=>{if(e&&n.parentId&&n.parentId!==e.id)return!1;let i=String(n.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&n.name===s})||P.pages.find(n=>{let i=String(n.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&n.name===s});r&&ht(r.id,!0)}function py(t){let e=be.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=P.pages.filter(n=>`${n.name} ${n.sheetPath}`.toLowerCase().includes(a)).slice(0,8),r=E.scene.nets.filter(n=>String(n.name).toLowerCase().includes(a)).slice(0,8);e.innerHTML=[...s.map(n=>`<button data-page="${n.id}"><b>${G(n.name)}</b><span>Page ${n.sheetNumber}</span></button>`),...r.map(n=>`<button data-schematic-net="${n.id}"><b>${G(n.name)}</b><span>${(P.manifest.netToPages?.[n.uid]||[]).length} pages</span></button>`)].join(""),e.querySelectorAll("[data-page]").forEach(n=>{n.addEventListener("click",()=>ht(n.dataset.page,!0))}),e.querySelectorAll("[data-schematic-net]").forEach(n=>{n.addEventListener("click",()=>wd(Number(n.dataset.schematicNet),!0))})}function wd(t,e){let a=E.scene.nets.find(r=>Number(r.id)===t);if(!a||!N)return;w.activeNetId=t,w.selectedFeatureId=0,w.selectedSchematicFeature=null,N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId="",P.activeNetUid=a.uid,N.activeNetUid=a.uid,Y?.setHighlightedNet(a.uid),rt.textContent=JSON.stringify(a,null,2),Ge();let s=P.manifest.netToPages?.[a.uid]||[];e&&s.length&&ht(s[0],!0)}function vd(t,e=null){let a=E.scene.nets.find(s=>s.uid===t);a&&(w.activeNetId=Number(a.id),P.activeNetUid=a.uid,N&&(N.activeNetUid=a.uid,N.selectedFeatureId=Number(e?.feature?.id||e?.featureId||0),N.selectedFeatureKey=e?.feature?.stableKey||e?.featureKey||"",N.selectedSourceId=e?.feature?.sourceId||e?.sourceId||""),Y?.setHighlightedNet(a.uid),e&&(w.selectedSchematicFeature={...e,pageId:w.selectedPageId}),rt.textContent=JSON.stringify(e?{...e,net:a}:a,null,2),Ge())}function Xa(){w.activeNetId=0,w.selectedFeatureId=0,w.selectedSchematicFeature=null,P.activeNetUid="",N&&(N.activeNetUid="",N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId=""),Y?.setSelection(null),Y?.setHighlightedNet(""),rt.textContent="No object selected",Ge()}function Md(){let t=P.byId.get(w.selectedPageId);t?N.framePage(t):N.frameWorld()}function gy(t){w.selectedPageId=t.sheetInstancePath&&P.pages.find(s=>s.sheetInstancePath===t.sheetInstancePath)?.id||w.selectedPageId,w.selectedFeatureId=0,w.selectedSchematicFeature={...t,pageId:w.selectedPageId},t.anchor&&(w.selectionAnchor=t.anchor),N&&(N.selectedPageId=w.selectedPageId,N.selectedFeatureId=Number(t.feature?.id||0));let e=t.netUid?E.scene.nets.find(s=>s.uid===t.netUid):null,a=t.reference?E.scene.componentFeatures.get(t.reference):null;a&&(w.selectedFeatureId=Number(a.featureId||0),We?.setSelectionByReference(t.reference,{scroll:w.workspace==="bom"})),rt.textContent=JSON.stringify({...t,net:e,component:a},null,2),Ge()}function my(t){let{page:e,feature:a}=t;if(!a){w.selectedSchematicFeature=null,N.selectedFeatureId=0,ht(e.id,!1),Ge();return}let s=Number(a.id||0);if(w.selectedPageId=e.id,N.selectedPageId=e.id,N.selectedFeatureId=s,w.selectedSchematicFeature={...a,pageId:e.id},w.selectionAnchor=null,a.netUid){let r=E.scene.nets.find(n=>n.uid===a.netUid);if(r){wd(Number(r.id),!1),w.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}if(a.reference){let r=E.scene.componentFeatures.get(a.reference);if(r){Kt(Number(r.featureId),!1),w.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}w.activeNetId=0,w.selectedFeatureId=0,N.activeNetUid="",rt.textContent=JSON.stringify({page:e.name,...a},null,2),Ge()}function ta(){let t=w.isolateNet,e=be?.querySelector?.("#isolate-net");e?.classList.toggle("active",t),e?.setAttribute("aria-pressed",String(t));let a=Z?.querySelector?.("[data-action=isolate]");a?.classList.toggle("active",t),a?.setAttribute("aria-pressed",String(t));let s=Ce?.querySelector?.("#show-board");s&&(s.checked=w.showBoard);let r=Ce?.querySelector?.("#show-components");r&&(r.checked=w.showComponents),Ut()}function yy(){let t=new Set;for(let e of pa())for(let a of zn(e))t.add(a);return t}function zn(t,e=E){let a=new Set,s=e.scene.nets.find(n=>Number(n.id)===Number(t)),r=new Set(e.scene.copperLayers.map(n=>Number(n.id)));for(let n of Object.keys(s?.layerBoundsMm||{})){let i=Number(n);r.has(i)&&a.add(i)}if(!a.size){let n=new Map(e.scene.copperLayers.map(i=>[i.name,Number(i.id)]));for(let i of s?.metrics?.layers||[]){let o=n.get(i);o!=null&&a.add(o)}}if(a.size)return a;for(let n of e.scene.tiles.values())Gl(n,t)&&a.add(Number(n.layerId));return a}function ea(){if(M){for(let e of Je())xr(e);return}let t=yy();t.size&&(E.visible3dLayers=new Set(t),w.mode==="layer"?qa(t):(E.compareLayers=new Set(t),E.desiredCompareLayers=new Set(t)),ye(performance.now(),{force:!0}))}function Gt(t){let e=!!(t&&ft()),a=w.isolateNet;if(e&&!w.isolateNet&&!M&&(E.preIsolation3dLayers=new Set(E.visible3dLayers),E.preIsolationCompareLayers=new Set(E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers)),w.isolateNet=e,M)ea();else if(w.isolateNet)ea();else if(E.preIsolation3dLayers||E.preIsolationCompareLayers){if(E.preIsolation3dLayers&&(E.visible3dLayers=new Set(E.preIsolation3dLayers)),E.preIsolationCompareLayers){let s=new Set(E.preIsolationCompareLayers);w.mode==="layer"?qa(s):(E.compareLayers=s,E.desiredCompareLayers=new Set(s))}E.preIsolation3dLayers=null,E.preIsolationCompareLayers=null,ye(performance.now(),{force:!0})}e&&!a?(w.preIsolationShowBoard=w.showBoard,w.showBoard=!1):!e&&a&&(typeof w.preIsolationShowBoard=="boolean"&&(w.showBoard=w.preIsolationShowBoard),w.preIsolationShowBoard=null),ta(),Re()}function Re(){(ha||Xe).querySelectorAll("[data-mode]").forEach(a=>{let s=a.dataset.mode===w.mode;a.classList.toggle("active",s),a.setAttribute("aria-pressed",String(s))}),Ce.querySelector("#show-board").checked=w.showBoard,Ce.querySelector("#show-components").checked=w.showComponents,Ce.querySelector("#separation").value=w.separation;let t=Xe.querySelector(".layer-list"),e=w.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;t.innerHTML=E.scene.copperLayers.map((a,s)=>`
    <label class="layer-row">
      <input type="checkbox" data-layer="${a.id}" ${e.has(Number(a.id))?"checked":""}>
      <span class="swatch" style="background:${Qn(vr(a))}"></span>
      <span>${G(a.name)}</span><small>${s+1}</small>
    </label>`).join(""),t.querySelectorAll("[data-layer]").forEach(a=>a.addEventListener("change",()=>{Vn(Number(a.dataset.layer),a.checked)})),ta()}function Ed(t){t==="layer"?Gn():(w.mode="3d",z.frame(Zt()),z.snap(),E.visibleTileIds=new Set,ye(performance.now(),{force:!0})),Re()}function Vn(t,e,a=null){if(M){let s=Number(t);Pn(a==null?null:[a],r=>e?r.delete(s):r.add(s));return}if(w.mode==="3d")e?E.visible3dLayers.add(t):E.visible3dLayers.delete(t),ye(performance.now(),{force:!0});else{let s=new Set(E.desiredCompareLayers);e?s.add(t):s.delete(t),qa(s)}Re()}function Hn(t,e=null){if(M){Pn(e==null?null:[e],(s,r)=>{let n=r?.scene.copperLayers||[];s.clear(),n.forEach((i,o)=>{t==="all"||t==="outer"&&(o===0||o===n.length-1)||t==="inner"&&o>0&&o<n.length-1||s.add(Number(i.id))})});return}let a=w.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let[s,r]of E.scene.copperLayers.entries())(t==="all"||t==="outer"&&(s===0||s===E.scene.copperLayers.length-1)||t==="inner"&&s>0&&s<E.scene.copperLayers.length-1)&&a.add(Number(r.id));w.mode==="3d"?ye(performance.now(),{force:!0}):qa(a),Re()}function qn(t){w.showBoard=!!t,w.savedShowBoard=w.showBoard,w.showBoard&&w.isolateNet?Gt(!1):ta()}function Xn(t){w.showComponents=!!t,w.savedShowComponents=w.showComponents,ta()}function Td(t){w.showPlaceholders=!!t;for(let e of M?Je():[E])e.renderer?.setPlaceholdersVisible(w.showPlaceholders);Ut()}function kd(t){w.realisticColors=!!t,Wa(),Ut()}function Wa(t=E){if(!t.renderer)return;let e=new Map(t.scene.layers.map(a=>[Number(a.id),a]));for(let a of t.renderer.entries)a.kind==="copper"&&(a.color=bd(e.get(Number(a.layerId)),t));t.renderer.setBarrelColor(pd(ty,[...fd(t).slice(0,3),.78],ga())),t.scene.copperRealism=ga()}function Wn(t,e=null){if(M){_m(ne(Number(t)||0,0,1),e);return}w.separation=ne(Number(t)||0,0,1),Ut()}function xy(){(ha||Xe).querySelectorAll("[data-mode]").forEach(e=>e.addEventListener("click",()=>{Ed(e.dataset.mode)})),Xe.querySelectorAll("[data-preset]").forEach(e=>e.addEventListener("click",()=>{Hn(e.dataset.preset)})),Ce.querySelector("#show-board").addEventListener("change",e=>{qn(e.target.checked)}),Ce.querySelector("#show-components").addEventListener("change",e=>{Xn(e.target.checked)}),Ce.querySelector("#separation").addEventListener("input",e=>{Wn(e.target.value)}),be.querySelector("#clear-selection").addEventListener("click",Fe),be.querySelector("#isolate-net").addEventListener("click",()=>{Gt(!w.isolateNet)}),be.querySelector("#frame-selection").addEventListener("click",$n),be.querySelector("#show-net-layers").addEventListener("click",Mr);let t=be.querySelector("#entity-search");t.addEventListener("input",()=>Sd(t.value))}function Id(){$t(".rail-tab").forEach(t=>t.addEventListener("click",()=>{let e=t.dataset.tab,a=w.activeTab===e&&!ut.classList.contains("panel-collapsed");w.activeTab=e,ut.classList.toggle("panel-collapsed",a),$t(".rail-tab").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.tab===e)}),$t(".tab-panel").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.panel===e)})}))}function Mr(){if(M){Sm();return}let t=E.scene.nets.find(s=>Number(s.id)===w.activeNetId);if(!t)return;let e=new Set(t.metrics?.layers||[]),a=w.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let s of E.scene.copperLayers)e.has(s.name)&&a.add(Number(s.id));w.mode==="3d"?ye(performance.now(),{force:!0}):qa(a),Re()}function Sd(t){let e=be.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=E.scene.nets.filter(n=>String(n.name).toLowerCase().includes(a)).slice(0,8),r=[...E.scene.componentFeatures.values()].filter(n=>!E.hiddenComponents.has(String(n.designator||""))&&`${n.designator} ${n.value} ${n.footprint}`.toLowerCase().includes(a)).slice(0,6);e.innerHTML=[...s.map(n=>`<button data-net="${n.id}"><b>${G(n.name)}</b><span>${G(n.netClass||"")}</span></button>`),...r.map(n=>`<button data-feature="${n.featureId}"><b>${G(n.designator)}</b><span>${G(n.value)}</span></button>`)].join(""),e.querySelectorAll("[data-net]").forEach(n=>{n.addEventListener("click",()=>ma(Number(n.dataset.net),!0))}),e.querySelectorAll("[data-feature]").forEach(n=>{n.addEventListener("click",()=>Kt(Number(n.dataset.feature),!0))})}function ma(t,e){e&&(w.selectionAnchor=null),w.activeNetId=t,w.selectedFeatureId=0;let a=E.scene.nets.find(s=>Number(s.id)===t);w.workspace==="schematic"&&a&&N&&(P.activeNetUid=a.uid,N.activeNetUid=a.uid),yr(),rt.textContent=JSON.stringify(a||{},null,2),Ge(),w.isolateNet&&ea(),e&&a?.boundsMm&&z.frame(Cn(Ea(a.boundsMm))),ye(performance.now(),{force:!0}),mr(Cl(a))}function Kt(t,e=!1){let a=E.scene.features.get(t);if(a?.kind==="component"&&ns(ya(a),E.hiddenComponents))return;e&&(w.selectionAnchor=null),w.selectedFeatureId=t,w.activeNetId=Number(a?.netId||0);let s=ya(a);s&&We?.setSelectionByReference(s,{scroll:w.workspace==="bom"});let r=Fl(a);r?.kind==="net"?yr():Bl(),rt.textContent=a?JSON.stringify(a,null,2):"No object selected",Ge(),w.isolateNet&&w.activeNetId&&ea(),e&&a?.bounds&&Jn(a),ye(performance.now(),{force:!0}),mr(r)}function Er(t,e=!1){if(ns(t,E.hiddenComponents))return;let a=E.scene.componentFeatures.get(t);if(We?.setSelectionByReference(t,{scroll:w.workspace==="bom"}),!a?.featureId)return;Bl(),Kt(Number(a.featureId),!1);let s=vy(t);if(s){let{page:r,feature:n}=s;w.selectedPageId=r.id,w.selectedSchematicFeature={...n,pageId:r.id},N&&(N.selectedPageId=r.id,N.selectedFeatureId=Number(n.id||0)),Y?.setSelection?.({kind:"component",featureKey:n.stableKey||"",sheetInstancePath:n.sheetInstancePath||r.sheetInstancePath||"",sourceId:n.sourceId||n.uuid||"",reference:t,feature:n,pageId:r.id}),e&&w.workspace==="schematic"&&(ht(r.id,!0),Y?.frameSelection?.())}if(e&&w.workspace==="pcb"){let r=E.scene.features.get(Number(a.featureId));r?.bounds&&Jn(r,!0)}Ge()}function ya(t){return t?.designator||t?.reference||t?.componentDesignator||""}function wy(t=E){return bi(t.scene.manifest?.components||[],t.scene.componentModelCounts)}function Rd(t){E.hiddenComponentRequest=t;let e=pi(t,wy());E.hiddenComponents=e.hiddenReferences,E.renderer?.setHiddenFeatureIds(e.hiddenFeatureIds),e.ambiguous.length&&console.warn(`[prism-semantic-viewer] keeping ambiguous components visible: ${e.ambiguous.join(", ")}`),e.unknown.length&&console.warn(`[prism-semantic-viewer] ignoring unknown components: ${e.unknown.join(", ")}`);let a=ya(E.scene.features.get(w.selectedFeatureId));ns(a,E.hiddenComponents)&&Fe();let s=be.querySelector("input");return s?.value&&Sd(s.value),e}function Jn(t,e=!1){if(!t?.bounds)return;let a=Cn(t.bounds);if(e||t.kind==="component"||!!ya(t)){let n=(a[2]+a[5])*.5<0,i=z.isBelow();n!==i&&z.setAxis("z",n)}z.frame(a)}function vy(t){if(!t||!N?.featuresByPage)return null;let e=P.byId.get(w.selectedPageId),a=[...e?[e]:[],...(P.pages||[]).filter(r=>r.id!==e?.id)],s=r=>{let n=String(r.kind||"").toLowerCase();return n==="component"||n==="symbol_body"||n==="symbol_instance"?0:n==="symbol_reference"?1:n.startsWith("pin")?2:3};for(let r of a){let n=(N.featuresByPage[r.id]||[]).filter(i=>String(i.reference||i.designator||i.componentDesignator||"")===t).sort((i,o)=>s(i)-s(o));if(n.length)return{page:r,feature:n[0]}}return null}function Fe(){w.activeNetId=0,w.selectedFeatureId=0,M&&(M.boardSelected=!1,M.standInKey=null),w.selectedSchematicFeature=null,w.selectionAnchor=null;let t=ft(),e=w.isolateNet;e&&!t?Gt(!1):t?e&&ea():w.isolateNet=!1,t||Fn(),P.activeNetUid="",N&&(N.activeNetUid=""),Y?.setSelection(null),Y?.setHighlightedNet(""),rt.textContent="No object selected",We?.clearSelection?.(),Ge(),mr(null)}function Qs(t){return`<div class="selection-properties">${t.map(([e,a])=>`
    <div class="selection-property">
      <small>${G(e)}</small>
      <strong title="${G(String(a))}">${G(String(a))}</strong>
    </div>`).join("")}</div>`}function ur(t,e,a){return`
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
    </div>`}function My(t){let a=(E.topology.net_details?.[t.uid]||{}).terminals||[],s=t.metrics||{},r=Number(s.traceLengthMm||0).toFixed(2),n=s.objectCounts?.via||0,i=a.length,c=/^(VCC|VDD|GND|3V3|5V|12V|VIN|POWER)/i.test(t.name)?"#10b981":"#8b5cf6",d=t.netClass||"Default",h=a.length?a.map(u=>`
      <div class="selection-row pin-row-interactive" data-ref="${G(u.designator)}" data-pin="${G(u.pin)}">
        <span class="refdes-col"><strong>${G(u.designator)}</strong></span>
        <span class="pin-col">Pin ${G(u.pin)}</span>
        <span class="val-col" title="${G(u.value||"")}">${G(u.value||"-")}</span>
      </div>`).join(""):'<div class="selection-empty">No connected pin metadata is available.</div>';return`
    ${ur("Net",t.name,c)}
    <div class="selection-net-dashboard">
      <div class="net-metric-grid">
        <div class="metric-card">
          <small>Length</small>
          <strong>${r} <span class="unit">mm</span></strong>
        </div>
        <div class="metric-card">
          <small>Vias</small>
          <strong>${n}</strong>
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
          ${(s.layers||[]).length?s.layers.map(u=>`<span class="layer-badge">${G(u)}</span>`).join(""):'<span class="layer-badge unknown">None</span>'}
        </div>
      </div>

      <div class="selection-section">
        <span class="selection-section-title">Connected Pins</span>
        <div class="selection-table compact-scroll" style="max-height: 120px;">
          ${h}
        </div>
      </div>
    </div>`}function Ey(t,e=null){let a=An(t.designator),s=a?a.value:t.value||"Not specified",r=a?a.footprint:t.footprint||"Not specified",n=a?.parameters||{},i=n.Manufacturer||n.Mfr||"",o=n["Manufacturer Part Number"]||n.MPN||n["Part Number"]||"",c=n.kicad_dnp==="true"||n.DNP==="true"||n.kicad_in_bom==="false",d="";(i||o)&&(d=`
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
      </div>`);let h="";return e&&(h=`
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
    ${ur("Component",t.designator||"Unknown","#3b82f6")}
    <div class="selection-component-dashboard">
      ${c?'<div class="dnp-banner" style="background:#b45309;color:#fff;font-size:9px;font-weight:750;text-align:center;padding:3px;margin-bottom:8px;border-radius:2px;text-transform:uppercase;letter-spacing:0.05em;">DNP (Do Not Populate)</div>':""}
      ${Qs([["Value",s],["Footprint",r.split(":").pop()||r]])}
      ${d}
      ${h}
    </div>`}function Ty(t,e){let a=String(t.kind||"").toLowerCase(),s=a.startsWith("pin");if(a==="component"||a.includes("symbol"))return`
      ${ur("Component",t.reference||t.componentDesignator||"Unknown","#3b82f6")}
      ${Qs([["Value",t.value||t.componentValue||"Not specified"],["Footprint",t.componentFootprint||t.footprint||"Not specified"],["Library",t.libraryRef||"Not specified"],["UID",t.componentUid||t.uuid||t.sourceId||"Not resolved"]])}
      <div class="selection-section">
        <span class="selection-section-title">Schematic placement</span>
        ${Qs([["Page",e?.name||"Unknown"],["Sheet",t.sheetInstancePath||"/"]])}
      </div>`;let n=s?[["Symbol",t.reference||t.designator||"Unknown"],["Value",t.value||t.componentValue||"Not specified"],["Pin",`${t.pinNumber||"-"}${t.pinName?` ${t.pinName}`:""}`],["Net",t.netName||"Not connected"],["PCB Pad",t.pcbPadId||"Not resolved"],["Component UID",t.componentUid||"Not resolved"]]:[["Page",e?.name||"Unknown"],["Kind",t.kind.replaceAll("_"," ")],["Net",t.netName||"Not connected"]];return`
    ${ur(t.kind.replaceAll("_"," "),t.pinName||t.reference||t.designator||t.text||t.netName||"Schematic object","#3b82f6")}
    ${Qs(n)}
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
    </div>`}function Ge(){if(Ut(),w.workspace==="bom"){Z.hidden=!0,Z.innerHTML="";return}let t=E.scene.features.get(w.selectedFeatureId),e=t?.kind==="component"?t:null,a=w.workspace==="schematic"?w.selectedSchematicFeature:null,s=a?P.byId.get(a.pageId):null,r=w.activeNetId?E.scene.nets.find(u=>Number(u.id)===w.activeNetId):null;if(!r&&a&&(a.netUid?r=E.scene.nets.find(u=>u.uid===a.netUid):a.netName&&(r=Vt(E.scene.nets,a.netName))),!e&&a){let u=a.reference||a.componentDesignator||a.designator;u&&(e=E.scene.componentFeatures.get(u)||{designator:u})}if(!e&&!r&&!a){Z.hidden=!0,Z.innerHTML="";return}let n="";if(r)n=My(r);else if(e){let u=a?.kind?.startsWith("pin")?a:null;n=Ey(e,u)}else a&&(n=Ty(a,s));Z.innerHTML=`
    ${n}
    <div class="selection-card-actions">
      ${r?`
        <button type="button" data-action="isolate" aria-keyshortcuts="I" title="Toggle isolated net view (I)" class="${w.isolateNet?"active":""}">Isolate</button>
        <button type="button" data-action="net-layers">Layers</button>
      `:""}
      <button type="button" data-action="frame">Frame selection</button>
    </div>`,Z.hidden=!1;let i=w.workspace==="schematic"?Ie:D,o=w.selectionAnchor,c=Z.offsetWidth||360,d=Z.offsetHeight||330;if(o){let u=Math.max(16,i.clientWidth-c-24),m=Math.max(16,i.clientHeight-d-24);Z.style.left=`${ne(o.x+18,16,u)}px`,Z.style.top=`${ne(o.y+18,16,m)}px`}else Z.style.left="20px",Z.style.top="20px";if(Z.querySelector(".selection-card-close").addEventListener("click",Fe),Z.querySelector("[data-action=frame]").addEventListener("click",$n),r){let u=Z.querySelector("[data-action=isolate]");u&&u.addEventListener("click",()=>{Gt(!w.isolateNet)});let m=Z.querySelector("[data-action=net-layers]");m&&m.addEventListener("click",Mr),Z.querySelectorAll(".pin-row-interactive").forEach(p=>{p.addEventListener("click",()=>{let f=p.dataset.ref,l=p.dataset.pin;if(!f)return;let g=((E.topology.net_details?.[r.uid]||{}).terminals||[]).find(v=>v.designator===f&&v.pin===l),x=g?Qg(g.pcb_pad_id):0;x?Kt(x,!0):Er(f,!0)})})}let h=Z.querySelector(".net-ref-interactive");h&&h.addEventListener("click",()=>{let u=h.dataset.netName;if(!u)return;let m=Vt(E.scene.nets,u);m&&ma(Number(m.id),!0)})}function $n(){if(w.workspace==="schematic"){Md();return}let t=E.scene.features.get(w.selectedFeatureId);if(t?.bounds)Jn(t);else{let e=E.scene.nets.find(a=>Number(a.id)===w.activeNetId);e?.boundsMm&&z.frame(Cn(Ea(e.boundsMm)))}}function Ad(){D.addEventListener("contextmenu",t=>t.preventDefault()),D.addEventListener("pointerdown",t=>{M&&(M.framed=!0),w.dragging=!0,w.lastX=t.clientX,w.lastY=t.clientY,w.pointerStartX=t.clientX,w.pointerStartY=t.clientY,w.dragMode=w.mode==="layer"||t.shiftKey||t.button!==0?"pan":"orbit",D.setPointerCapture(t.pointerId)}),D.addEventListener("pointermove",t=>{if(!w.dragging)return;let e=t.clientX-w.lastX,a=t.clientY-w.lastY;w.lastX=t.clientX,w.lastY=t.clientY,w.dragMode==="pan"?z.pan(e,a,D.clientHeight,w.mode==="layer"):z.orbit(e,a)}),D.addEventListener("pointerup",async t=>{w.dragging=!1,D.releasePointerCapture(t.pointerId),!(Math.hypot(t.clientX-w.pointerStartX,t.clientY-w.pointerStartY)>=3)&&(t.button===0?await wl(t):t.button===2&&await Ry(t))}),D.addEventListener("dblclick",async t=>{await wl(t),$n()}),D.addEventListener("wheel",t=>{M&&(M.framed=!0),t.preventDefault(),Math.abs(t.deltaX)>Math.abs(t.deltaY)*.4?z.pan(-t.deltaX,0,D.clientHeight,w.mode==="layer"):z.dolly(t.deltaY,w.mode==="layer")},{passive:!1}),window.addEventListener("keydown",jd),ky()}function ky(){let t=!1,e,a,s=0,r=0;Z.addEventListener("pointerdown",n=>{if(!n.target.closest(".selection-card-head")||n.target.closest(".selection-card-close"))return;t=!0,Z.classList.add("dragging");let o=Z.getBoundingClientRect();s=o.left,r=o.top,e=n.clientX,a=n.clientY,Z.setPointerCapture(n.pointerId),n.stopPropagation()}),Z.addEventListener("pointermove",n=>{if(!t)return;let i=n.clientX-e,o=n.clientY-a,c=w.workspace==="schematic"?Ie:D,d=Z.offsetWidth||360,h=Z.offsetHeight||330,u=Math.max(16,c.clientWidth-d-24),m=Math.max(16,c.clientHeight-h-24),p=ne(s+i,16,u),f=ne(r+o,16,m);Z.style.left=`${p}px`,Z.style.top=`${f}px`,w.selectionAnchor={x:p-18,y:f-18},n.stopPropagation()}),Z.addEventListener("pointerup",n=>{t&&(t=!1,Z.classList.remove("dragging"),Z.releasePointerCapture(n.pointerId),n.stopPropagation())})}function Iy(){$t("[data-workspace]").forEach(t=>{t.addEventListener("click",()=>_d(t.dataset.workspace))})}function _d(t){if(t==="schematic"&&!N||t==="bom"&&!We)return;w.workspace=t,ut.classList.remove("workspace-pcb","workspace-schematic","workspace-bom","workspace-stackup"),ut.classList.add(`workspace-${t}`),(t==="schematic"&&(w.activeTab==="view"||w.activeTab==="inspect"||w.activeTab==="stats")||t==="bom"||t==="stackup")&&fr("layers");let e=J('.rail-tab[data-tab="layers"]');e&&(t==="schematic"?(e.textContent="Pages",e.title="Schematic pages"):t==="bom"?(e.textContent="Summary",e.title="BoM summary"):(e.textContent="Layers",e.title="Layers and compare"));let a=t==="schematic",s=t==="bom",r=t==="stackup";if(D.hidden=a||s||r,Ie&&(Ie.hidden=!a),Zs&&(Zs.hidden=!a||!Y),er&&(er.hidden=!a),tr&&(tr.hidden=!s),Ne&&(Ne.hidden=!r),ke.hidden=a||s||r,ar.hidden=a||s||r,La&&(La.hidden=!a),$t("[data-workspace]").forEach(n=>{n.classList.toggle("active",n.dataset.workspace===t)}),ba.textContent=s?"Semantic BoM active":a?Y?"SVG DOM + WebGPU schematic world active":"WebGPU schematic world active":r?"Layer Stackup active":"WebGPU semantic glTF active",a&&!P.fitted&&(N.resize(),N.frameWorld(),P.fitted=!0),!a&&!s&&!r&&(E.renderer?.resize(),w.mode==="layer"?Gn():ye(performance.now(),{force:!0})),r)try{Cy()}catch(n){console.error("Failed to render stackup workspace",n),Ne&&(Ne.innerHTML=`
          <div class="selection-empty" style="padding:40px;text-align:center;">
            Stackup view failed to render. ${G(n?.message||String(n))}
          </div>
        `)}Kn(),Ge()}function Sy(){Ie.addEventListener("pointerdown",t=>{Y?.worldActive||Y?.active||(w.schematicDragging=!0,w.schematicLastX=t.clientX,w.schematicLastY=t.clientY,w.schematicStartX=t.clientX,w.schematicStartY=t.clientY,Ie.setPointerCapture(t.pointerId))}),Ie.addEventListener("pointermove",t=>{if(Y?.worldActive||Y?.active||!w.schematicDragging||!N)return;let e=t.clientX-w.schematicLastX,a=t.clientY-w.schematicLastY;w.schematicLastX=t.clientX,w.schematicLastY=t.clientY,N.pan(e,a)}),Ie.addEventListener("pointerup",async t=>{if(!(Y?.worldActive||Y?.active)&&(w.schematicDragging=!1,Ie.releasePointerCapture(t.pointerId),Math.hypot(t.clientX-w.schematicStartX,t.clientY-w.schematicStartY)<3)){let e=await N.pickFeature(t.clientX,t.clientY);e?my(e):Xa()}}),Ie.addEventListener("dblclick",t=>{if(Y?.worldActive||Y?.active)return;let e=N.hitPage(t.clientX,t.clientY);e&&ht(e.id,!0)}),Ie.addEventListener("wheel",t=>{Y?.worldActive||Y?.active||(t.preventDefault(),N.zoom(t.deltaY,t.clientX,t.clientY))},{passive:!1})}async function wl(t){if(!se)return;let e=D.getBoundingClientRect();w.selectionAnchor={x:t.clientX-e.left,y:t.clientY-e.top};let a=await Nd(t);if(M){Tm(a);return}(a.kind==="feature"||a.kind==="board")&&(w.selectedOccurrence=a.occurrenceIndex),a.featureId?Kt(a.featureId,!0):a.kind==="board"&&!E.renderer.identityOnly?Yn():Fe()}async function Ry(t){if(!se||!or)return;let e=await Nd(t),a=M?M.placements.get(e.occurrenceKey)?.board:E;if(!a)return;let s=a.scene.features.get(e.featureId),r=ya(s),n=r?An(r,a):null;or({clientX:t.clientX,clientY:t.clientY,reference:r||void 0,value:String(n?.value||s?.value||"")||void 0})}function Nd(t){let e=D.getBoundingClientRect();return Cd((t.clientX-e.left)*D.width/e.width,(t.clientY-e.top)*D.height/e.height)}function Cd(t,e){return M?Em(t,e):E.renderer.pick(se,t,e,{activeNetId:w.activeNetId,selectedFeatureId:w.selectedFeatureId,layerOffsets:yd(),visibleLayers:w.mode==="3d"?E.visible3dLayers:E.compareLayers,showBoard:w.showBoard,showComponents:w.showComponents,componentOpacity:ne(1-w.separation/.1,0,1),boardOpacity:1-w.separation*.72,isolateNet:w.isolateNet,compareMode:w.mode==="layer",compareOffsets:Qt,visibleTileIds:w.mode==="3d"?E.visibleTileIds:null})}async function Fd(t,e){if(!se||!(M||E.renderer))return null;let a=D.getBoundingClientRect(),s=await Cd((t-a.left)*D.width/a.width,(e-a.top)*D.height/a.height),r=M?M.placements.get(s.occurrenceKey)?.board:E,n=s.featureId&&r?Fl(r.scene.features.get(s.featureId),r):null;return{...s,renderer:void 0,selection:n}}function Yn(){let t=w.selectedOccurrence,e=Se;Se=!0;try{Fe()}finally{Se=e}w.selectedOccurrence=t,M&&(M.boardSelected=!0),mr({kind:"board",sourceContext:"3D"})}function Bd(t,e,a){let s=t.scene.componentFeatures.get(String(e)),r=s?t.scene.features.get(Number(s.featureId))?.bounds:null;if(!r)return null;let n=r[2]+r[5]>=0;return a([(r[0]+r[3])/2,(r[1]+r[4])/2,n?r[5]:r[2]])}function kn(t,e){if(!se)return null;let a=Na(se.matrix,Ts(e,t),se.viewport);if(!a)return null;let s=D.getBoundingClientRect();return{x:s.left+a.x*s.width/D.width,y:s.top+a.y*s.height/D.height}}function jd(t){if(!gr())return;if(t.target instanceof HTMLInputElement){t.key==="Escape"&&t.target.blur();return}let e=t.key.toLowerCase();if(w.workspace==="schematic"){if(e==="/")t.preventDefault(),fr("search"),be.querySelector("#entity-search")?.focus();else if(e==="escape")P.activeNetUid?(P.activeNetUid="",w.activeNetId=0,N.activeNetUid="",Y?.setHighlightedNet(""),Ge()):Xa();else if(e==="~"||t.key==="~"){t.preventDefault();let a=w.selectedSchematicFeature?.netUid;a&&(P.activeNetUid===a?(P.activeNetUid="",w.activeNetId=0,N.activeNetUid="",Y?.setHighlightedNet("")):vd(a,w.selectedSchematicFeature))}else if(e==="home")N?.frameWorld();else if(e==="[")Ys("previous");else if(e==="]")Ys("next");else if(e==="n"){t.preventDefault();let a=N?.cycleNetIntrasheetLink(t.shiftKey?-1:1);a?.pageId&&(w.selectedPageId=a.pageId,N.selectedPageId=a.pageId,Dd())}else if(t.altKey&&e==="arrowup")Ys("parent");else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;N?.pan(a,s)}return}if(M&&Hm(t,e)){t.preventDefault();return}if(e==="/")t.preventDefault(),fr("search"),be.querySelector("#entity-search").focus();else if(e==="escape")Fe();else if(e==="i"&&w.workspace==="pcb"&&ft())t.preventDefault(),Gt(!w.isolateNet);else if(e==="home")z.frame(M&&M.bounds||Zt());else if(e==="`")jn(!w.showStats);else if(["x","y","z"].includes(e))z.setAxis(e,t.shiftKey);else if(e==="f")z.flip();else if(e==="r")z.rotateZ(t.shiftKey?-1:1);else if(e===" "){t.preventDefault();let a=E.scene.features.get(w.selectedFeatureId);a?.bounds&&z.setFocus([(a.bounds[0]+a.bounds[3])/2,(a.bounds[1]+a.bounds[4])/2,(a.bounds[2]+a.bounds[5])/2])}else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;z.pan(a,s,D.clientHeight,w.mode==="layer")}}function fr(t){w.activeTab=t,ut.classList.remove("panel-collapsed"),$t(".rail-tab").forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),$t(".tab-panel").forEach(e=>{e.classList.toggle("active",e.dataset.panel===t)})}function Od(){let t=ke.getContext("2d");t.clearRect(0,0,ke.width,ke.height);let e=[ke.width/2,ke.height/2],a=z.basis(),s=[{axis:"x",label:"X",color:"#e23838",vector:[1,0,0]},{axis:"y",label:"Y",color:"#2dbd50",vector:[0,1,0]},{axis:"z",label:"Z",color:"#3157d5",vector:[0,0,1]}],r=[];for(let n of s)for(let i of[-1,1]){let o=n.vector.map(d=>d*i),c=[wn(o,a.right),-wn(o,a.up),wn(o,a.back)];r.push({...n,sign:i,depth:c[2],point:[e[0]+c[0]*34,e[1]+c[1]*34]})}for(let n of s){let i=r.find(o=>o.axis===n.axis&&o.sign===1);t.strokeStyle=n.color,t.lineWidth=2.4,t.beginPath(),t.moveTo(...e),t.lineTo(...i.point),t.stroke()}rr=[];for(let n of r.sort((i,o)=>o.depth-i.depth)){let i=n.sign===1,o=i?13:9;t.beginPath(),t.arc(n.point[0],n.point[1],o,0,Math.PI*2),t.fillStyle=i?n.color:`${n.color}66`,t.fill(),t.lineWidth=2,t.strokeStyle=Ny(n.color,i?.45:.58),t.stroke(),i&&(t.fillStyle="#07101c",t.font="700 13px system-ui",t.textAlign="center",t.textBaseline="middle",t.fillText(n.label,n.point[0],n.point[1]+.5)),rr.push({...n,radius:o+5})}}function Pd(){!ke||ke.dataset.bound==="true"||(ke.dataset.bound="true",ke.addEventListener("click",t=>{let e=ke.width/ke.clientWidth,a=ke.height/ke.clientHeight,s=[t.offsetX*e,t.offsetY*a],r=rr.map(n=>({item:n,distance:Math.hypot(s[0]-n.point[0],s[1]-n.point[1])})).filter(({item:n,distance:i})=>i<=n.radius).sort((n,i)=>n.distance-i.distance)[0]?.item;r&&z.setAxis(r.axis,r.sign<0)}))}function Ay(){if(w.mode!=="layer"||!se){ar.innerHTML="";return}let t=Zt(),e=Ol();ar.innerHTML=E.scene.copperLayers.filter(a=>e.has(Number(a.id))).map(a=>{let s=Qt.get(Number(a.id))||[0,0,0],r=_y([t[0]+s[0],t[4]+s[1],0],se.matrix,D.clientWidth,D.clientHeight);return!r||r[0]<-100||r[0]>D.clientWidth+100||r[1]<-100||r[1]>D.clientHeight+100?"":`<span style="left:${r[0]}px;top:${r[1]}px">${G(a.name)}</span>`}).join("")}function Dd(){if(w.workspace!=="schematic"||!N){La.innerHTML="";return}La.innerHTML=P.visiblePages.filter(t=>N.pagePixelWidth(t)>120).map(t=>{let[e,a]=N.worldToScreen(t.worldX+8*N.scale,t.worldY-6*N.scale),s=t.id===w.selectedPageId,n=P.activeNetUid&&t.netUids.includes(P.activeNetUid)?"#18ef52":s?"#3b82f6":"#4b8de8";return`<div class="schematic-page-label" style="left:${e}px;top:${a}px;border-left-color:${n}">
        <strong>${G(t.name)}</strong>
        <small>Page ${t.sheetNumber} &middot; ${t.featureCount.toLocaleString()} features</small>
      </div>`}).join("")}function _y(t,e,a,s){let r=t[0],n=t[1],i=t[2],o=e[0]*r+e[4]*n+e[8]*i+e[12],c=e[1]*r+e[5]*n+e[9]*i+e[13],d=e[3]*r+e[7]*n+e[11]*i+e[15];return Math.abs(d)<1e-8?null:[(o/d*.5+.5)*a,(.5-c/d*.5)*s]}function wn(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function Ny(t,e){let a=t.replace("#","");return`#${[0,2,4].map(s=>Math.round(parseInt(a.slice(s,s+2),16)*e).toString(16).padStart(2,"0")).join("")}`}function In(t,e){w.frameSamples.push({intervalMs:t,cpuMs:e}),w.frameSamples.length>180&&w.frameSamples.shift()}function vl(t,e){if(!t.length)return 0;let a=[...t].sort((s,r)=>s-r);return a[Math.min(a.length-1,Math.floor((a.length-1)*e))]}function Sn(t){if(!Ws||(w.frames+=1,t-w.fpsAt<=500))return;w.fps=w.frames*1e3/(t-w.fpsAt);let e=w.frameSamples;if(w.frameIntervalMs=e.length?e.reduce((n,i)=>n+i.intervalMs,0)/e.length:0,w.frameCpuMs=e.length?e.reduce((n,i)=>n+i.cpuMs,0)/e.length:0,w.frameIntervalP95Ms=vl(e.map(n=>n.intervalMs),.95),w.frameCpuP95Ms=vl(e.map(n=>n.cpuMs),.95),w.frames=0,w.fpsAt=t,Vl(),w.workspace==="bom"){let n=We?.payload?.counts||{},i=[["Renderer","BoM DOM table"],["Schema",We?.payload?.schema||"-"],["Grouped rows",n.rows||0],["Components",n.components||0],["DNP components",n.dnpComponents||0],["Extra columns",We?.payload?.extraColumns?.length||0],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]];Ws.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("");return}let a=w.workspace==="schematic"&&N?N.stats():null,s=w.workspace==="schematic"&&Y?Y.stats():null,r=w.workspace==="schematic"&&N?Y?.active?[["Renderer","SVG DOM schematic detail"],["Pages",P.pages.length],["Mounted pages",s.mountedPages],["Active page",s.activePage],["DOM nodes",s.domNodes.toLocaleString()],["Indexed features",s.indexedFeatures.toLocaleString()],["Indexed nets",s.indexedNets.toLocaleString()],["SVG cache",`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`],["Selection",`${s.selectionMs.toFixed(1)} ms`],["Active net",E.scene.nets.find(n=>n.uid===P.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Tracking verts",a.netFlowVertices.toLocaleString()],["Mount",`${s.mountMs.toFixed(1)} ms`],["Highlight",`${s.highlightMs.toFixed(1)} ms`],["Fallback",s.fallbackReason||"-"],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]]:[["Renderer",Y?"SVG DOM + WebGPU world":"WebGPU schematic world"],["Pages",P.pages.length],["Visible pages",P.visiblePages.length],["DOM pages",s?s.mountedPages:0],["DOM nodes",s?s.domNodes.toLocaleString():"0"],["Indexed SVG features",s?s.indexedFeatures.toLocaleString():"0"],["SVG cache",s?`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`:"0 pages"],["JS heap",s?.heapMb?`${s.heapMb.toFixed(1)} MB`:"-"],["Hierarchy links",P.manifest.edges?.length||0],["Selected page",P.byId.get(w.selectedPageId)?.name||"-"],["Active net",E.scene.nets.find(n=>n.uid===P.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Downloaded",`${(N.downloadedBytes/1048576).toFixed(1)} MB`],["Resident vectors",`${(a.residentVectorBytes/1048576).toFixed(1)} MB`],["Vector pages",`${a.vectorChunks} loaded / ${a.vectorLoads} loading`],["Vector draw",`${a.vectorVertices.toLocaleString()} verts / ${a.vectorDrawChunks} chunks`],["Native detail",`${a.nativeDetailPages} pages @ ${a.nativePxPerMm} / ${a.nativeThresholdPxPerMm} px/mm`],["Vector failures",a.failedVectorChunks],["Truncated",a.truncatedVectors],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]]:[["Renderer","WebGPU semantic glTF"],["Mode",w.mode==="3d"?"3D":"Layer Compare"],["Visible layers",w.mode==="3d"?E.visible3dLayers.size:E.compareLayers.size],["Resident tiles",E.scene.loaded.size],["Loading tiles",E.scene.loading.size],["Failed tiles",E.scene.failed.size],["Triangles",Math.round(E.triangles).toLocaleString()],["Downloaded",`${(E.loadedBytes/1048576).toFixed(1)} MB`],["Resident GLB",`${(E.residentTileBytes/1048576).toFixed(1)} MB`],["Resident GPU",`${(E.residentTileGpuBytes/1048576).toFixed(1)} MB`],["Tile loads",E.tileLoads.toLocaleString()],["Tile evictions",E.tileEvictions.toLocaleString()],["Tile scheduler",`${E.tileSchedulerMs.toFixed(2)} ms`],["Active net",E.scene.nets.find(n=>Number(n.id)===w.activeNetId)?.name||"-"],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]];Ws.innerHTML=r.map(([n,i])=>`<dt>${n}</dt><dd>${i}</dd>`).join("")}function Qn(t){return`rgb(${t.slice(0,3).map(e=>Math.round(e*255)).join(" ")})`}function Cy(){if(!Ne)return;let t=E.scene.layers||[];if(!t.length){Ne.innerHTML='<div class="selection-empty" style="padding:40px;text-align:center;">No stackup information available for this board.</div>';return}let e=t.filter(k=>["copper","dielectric","paste","silkscreen","soldermask"].includes(k.role)),a=E.topology.board?.stackup||{},s=k=>{if(k==null||k==="")return"None";let B=String(k);return G(B.includes(".")?B.split(".").pop():B)},r=(k,B=4)=>{let O=Number(k);return Number.isFinite(O)&&O>0?O.toFixed(B):"-"},n=(k,B=3)=>{let O=Number(k);return Number.isFinite(O)?O.toFixed(B):"-"},i=k=>{if(k==null||k==="")return"No";if(typeof k=="boolean")return k?"Yes":"No";let B=String(k).trim().toLowerCase(),O=B.includes(".")?B.split(".").pop():B;return["0","false","no","n","off","none"].includes(O)?"No":(["1","true","yes","y","on"].includes(O),"Yes")},o=k=>({copper:"Copper",dielectric:"Dielectric",paste:"Paste",silkscreen:"Silkscreen",soldermask:"Solder mask"})[k]||String(k||"Layer"),c=k=>k.role!=="dielectric"?"":k.type==="core"?"Core":k.type==="prepreg"||(k.material||"").toLowerCase().includes("prepreg")?"Prepreg":"Core",d=(k,B=4)=>{let O=Number(k.thickness_mm);return Number.isFinite(O)&&O>0?`${O.toFixed(B)} mm`:"Not specified"},h=k=>{let B=o(k.role),O=String(k.material||"").trim(),$=O&&O.toLowerCase()!==String(k.role||"").toLowerCase();if(k.role==="dielectric"){let ce=[$?O:"",r(k.epsilon_r,3)!=="-"?`\u03B5r ${r(k.epsilon_r,3)}`:"",r(k.loss_tangent,4)!=="-"?`tan \u03B4 ${r(k.loss_tangent,4)}`:""].filter(Boolean).join(" \xB7 ");return{primary:`${k.name} \xB7 ${c(k)}`,secondary:ce}}return{primary:[k.name,B,$?O:""].filter(Boolean).join(" \xB7 "),secondary:""}},u=0,m=0,p=0,f=0;e.forEach(k=>{f+=k.thickness_mm||0,k.role==="copper"?k.name.toLowerCase().includes("gnd")||k.name.toLowerCase().includes("pwr")||k.name.toLowerCase().includes("plane")?m++:u++:k.role==="dielectric"&&p++});let l=E.scene.copperLayers||[],y=0,b=0,g=0,x=[...(E.scene.manifest?.barrels||[]).filter(k=>k.kind==="via"),...[...E.scene.features.values()].filter(k=>k.kind==="via")],v=Ic(l,x);y=v.counts.thru,b=v.counts.blind,g=v.counts.buried;let T=v.spans,I=30,S=I,R=[],_=new Map(e.map((k,B)=>[k,B])),A=Fy(e),j=(k,B)=>{let O=A.get(k.name);if(O!==void 0)return O;let $=Number(k.stack_index);return Number.isFinite($)?$:B+1e5},L=[...e].sort((k,B)=>{let O=j(k,_.get(k)||0),$=j(B,_.get(B)||0);return O!==$?O-$:(B.z_mm||0)-(k.z_mm||0)});L.forEach(k=>{let B=12;k.role==="dielectric"?B=Math.max(160,Math.min(360,(k.thickness_mm||.1)*140)):k.role==="copper"?B=22:k.role==="soldermask"&&(B=14),R.push({...k,svgY:S,svgHeight:B}),S+=B});let F=800,K=130,W=240,te=K+W+16,oe=te+84,Oe="";R.forEach(k=>{let B=k.color||"#7f7f7f";k.role==="copper"?B=k.color||"#f97316":k.role==="dielectric"?B="#a98d5c":k.role==="paste"?B="#cbd5e1":k.role==="soldermask"?B="#1b4332":k.role==="silkscreen"&&(B="#e2e8f0");let O=l.findIndex(qd=>qd.name===k.name),$=h(k),ce=k.svgY+k.svgHeight/2,Me=!!$.secondary&&k.svgHeight>=38,zt=Me?ce-5:ce+3,kr=G(k.id),$a=G(k.name),Ye=Number.isFinite(Number(k.thickness_mm))&&Number(k.thickness_mm)>0,Vd=G(Ye?d(k):"\u2014"),Hd=G([$.primary,$.secondary,`Thickness ${d(k)}`].filter(Boolean).join("; "));Oe+=`
      <g class="stackup-svg-layer" data-layer-id="${kr}" data-layer-name="${$a}">
        <title>${Hd}</title>
        <rect x="${K}" y="${k.svgY}" width="${W}" height="${k.svgHeight}" fill="${B}" opacity="0.85" rx="1"/>
        <text x="${K-8}" y="${k.svgY+k.svgHeight/2+3}" fill="var(--muted)" font-size="9px" text-anchor="end" font-weight="700">
          ${k.role==="copper"?O+1:""}
        </text>
        <path class="stackup-layer-dimension" d="M ${te+6} ${k.svgY+1} H ${te} V ${k.svgY+k.svgHeight-1} H ${te+6}" />
        <text class="stackup-layer-thickness" x="${te+10}" y="${ce+3}" fill="var(--muted)" font-size="8.5px" font-weight="650">
          ${Vd}
        </text>
        <text class="stackup-layer-name" x="${oe}" y="${zt}" fill="var(--foreground)" font-size="9px" font-weight="650">
          ${G($.primary)}
        </text>
        ${Me?`<text class="stackup-layer-metadata" x="${oe}" y="${ce+10}" fill="var(--muted)" font-size="8px">${G($.secondary)}</text>`:""}
      </g>
    `});let de="",Pe=R.filter(k=>k.role==="copper");T.forEach((k,B)=>{let O=R.find(Ye=>Ye.name===k.startName),$=R.find(Ye=>Ye.name===k.endName);if(!O||!$)return;let ce=O.svgY,Me=$.svgY+$.svgHeight,zt=K+(B+1)*W/(T.length+1),kr=k.type==="thru"?"Thru":k.type==="blind"?"Blind":"Buried",$a=`var(--stackup-via-${k.type})`;de+=`
      <g class="stackup-svg-via" data-via-type="${k.type}">
        <title>${kr}: ${k.startName} \u2192 ${k.endName}</title>
        ${Pe.map(Ye=>Ye.svgY>=O.svgY&&Ye.svgY<=$.svgY?`<rect x="${zt-5}" y="${Ye.svgY}" width="10" height="${Ye.svgHeight}" fill="${$a}" rx="0.5" />`:"").join("")}
        <rect x="${zt-2}" y="${ce}" width="4" height="${Me-ce}" fill="${$a}" opacity="0.95" />
        <rect x="${zt-.75}" y="${ce-1}" width="1.5" height="${Me-ce+2}" fill="var(--panel)" opacity="0.9" />
      </g>
    `});let Ke=`
    <svg class="stackup-visual-svg" viewBox="0 0 ${F} ${S+10}" width="${F}" height="${S+10}">
      <g class="stackup-svg-column-headings" aria-hidden="true">
        <text x="${te+10}" y="15">Thickness</text>
        <text x="${oe}" y="15">Layer / material properties</text>
      </g>
      <g class="stackup-total-dimension" aria-label="Total board thickness ${f.toFixed(4)} millimetres">
        <path d="M 76 ${I} H 68 V ${S} H 76" />
        <text x="68" y="15">Total ${f.toFixed(4)} mm</text>
      </g>
      ${Oe}
      ${de}
    </svg>
    <div class="stackup-via-legend" aria-label="Via span legend">
      <span><i data-via-type="thru"></i>Thru</span>
      <span><i data-via-type="blind"></i>Blind</span>
      <span><i data-via-type="buried"></i>Buried</span>
    </div>
  `,ve="";L.forEach(k=>{let B="silk";k.role==="copper"?B="copper":k.role==="dielectric"?B="dielectric":k.role==="paste"?B="paste":k.role==="soldermask"&&(B="mask");let O=c(k),$=G(k.id),ce=G(k.name),Me=h(k);ve+=`
      <tr data-layer-id="${$}" data-layer-name="${ce}" tabindex="0" aria-label="${G(`${Me.primary}; thickness ${d(k)}`)}">
        <td><strong>${ce}</strong></td>
        <td><span class="stackup-badge ${B}">${k.role}</span></td>
        <td>${O||"-"}</td>
        <td>${G(k.material||"-")}</td>
        <td>${k.role==="dielectric"?r(k.epsilon_r,3):"-"}</td>
        <td>${k.role==="dielectric"?r(k.loss_tangent,4):"-"}</td>
        <td>${k.thickness_mm?k.thickness_mm.toFixed(4)+" mm":"-"}</td>
      </tr>
    `});let $e="",ze=E.topology.board?.net_classes||[],bt=k=>{let B=n(k);return B==="-"?B:`${B} mm`};ze.length?ze.forEach(k=>{$e+=`
        <tr>
          <td><strong>${k.name}</strong></td>
          <td>${bt(k.track_width)}</td>
          <td>${bt(k.clearance)}</td>
          <td>${bt(k.diff_pair_width)}</td>
          <td>${bt(k.diff_pair_gap)}</td>
          <td>${Number.isFinite(Number(k.via_diameter))?`${n(k.via_drill)}/${n(k.via_diameter)} mm`:"-"}</td>
        </tr>
      `}):$e=`
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
          <span>${f.toFixed(4)} mm</span>
        </div>
        <div class="stackup-summary-card">
          <label>Copper Layers</label>
          <span>${l.length} (${u} Sig / ${m} Plane)</span>
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
          <span>${b}</span>
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
                ${$e}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </aside>
    </div>
  `;let aa=(k,B)=>{Ne.querySelectorAll(".stackup-svg-layer").forEach(O=>{let $=O.dataset.layerId===k;O.classList.toggle("active",$&&B)}),Ne.querySelectorAll(".stackup-table tbody tr[data-layer-id]").forEach(O=>{let $=O.dataset.layerId===k;O.classList.toggle("active",$&&B)})},Tr=k=>{let B=Ne.querySelector(".stackup-diagram-card"),O=Ne.querySelector(`.stackup-svg-layer[data-layer-id="${CSS.escape(k)}"]`);if(!B||!O||B.scrollHeight<=B.clientHeight)return;let $=B.getBoundingClientRect(),ce=O.getBoundingClientRect(),Me=B.scrollTop+ce.top-$.top-(B.clientHeight-ce.height)/2,zt=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;B.scrollTo({top:Math.max(0,Me),behavior:zt?"auto":"smooth"})},Ja=(k,{revealDiagram:B=!1}={})=>{k.forEach(O=>{let $=()=>{let Me=O.dataset.layerId;aa(Me,!0),B&&Tr(Me)},ce=()=>aa(null,!1);O.addEventListener("mouseenter",$),O.addEventListener("mouseleave",ce),B&&(O.addEventListener("focus",$),O.addEventListener("blur",ce))})};Ja(Ne.querySelectorAll(".stackup-svg-layer")),Ja(Ne.querySelectorAll(".stackup-table tbody tr[data-layer-id]"),{revealDiagram:!0})}function Fy(t){let e=t.filter(r=>r.role==="dielectric");if(!(e.length===1&&e[0]?.name==="Board"))return new Map;let s=new Map;return["F.SilkS","F.Paste","F.Mask","F.Cu","Board","B.Cu","B.Mask","B.Paste","B.SilkS"].forEach((r,n)=>s.set(r,n)),s}function Ld(){let t=null;return{begin(){return t?.abort(),t=new AbortController,t},owns(e){return e!==null&&e===t&&!e.signal.aborted},cancel(){t?.abort(),t=null}}}async function Ud(t,e,{owner:a,bundleUrl:s,loadBundle:r,now:n=()=>performance.now()}){let i=n(),o={},{signal:c}=e,d=()=>a.owns(e)&&t.isConnected;try{t.renderLoading();let h=n(),{bundle:u,topology:m,semanticGeometry:p,assetCache:f}=await r(s,o,c);if(o.bundle_group_total_ms=n()-h,!d())return;t.renderShell();let l=n(),y=await t.mountViewer({topology:m,semanticGeometry:p,readiness:u.readiness,assetCache:f,signal:c});if(!d()){y?.dispose?.();return}t.publishController(y),o.mount_and_first_frame_ms=n()-l,Object.assign(o,y?.performance||{}),o.reload_to_visible_ms=n()-i,t.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"board-visible",readiness_stage:u.readiness?.stage||"semantic-ready",readiness_progress:u.readiness?.progress??100,timings:o})}catch(h){if(!d())return;t.renderError(h),t.emitError(h)}}var By="prism.visualizer_bundle.a0";function jy(){return`
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
  `}function Oy(t){return String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}async function Gd(t,e=null,a="fetch",s=void 0){let r=performance.now(),n=await fetch(t,{cache:"no-store",signal:s});if(!n.ok)throw new Error(`Failed to load ${t}: ${n.status}`);let i=await n.json();return e&&(e[`${a}_fetch_parse_ms`]=performance.now()-r,e[`${a}_content_length`]=Number(n.headers.get("content-length")||0)),i}async function Kd(t,e,a){let s=new URL(t,document.baseURI).toString(),r=new URL(s).searchParams.get("viewer")||"",n=Qa.open(),i=await n.peekJson(s).catch(()=>null),o=!!i;i||(i=await Gd(s,e,"bundle",a),Rr(i)&&n.store(s,new TextEncoder().encode(JSON.stringify(i)))),e&&(e.bundle_from_cache=o);let c=Rr(i)&&n.enabled?n:null;if(i.schema!==By)throw new Error(`Unsupported visualizer bundle schema: ${i.schema||"missing"}`);let d=new URL(i.topology||"topology.json",s),h=new URL(i.semantic_geometry||"semantic_geometry.json",s),u=(f,l)=>c?c.fetchJson(f.toString(),{signal:a}):Gd(f,e,l,a),[m,p]=await Promise.all([u(d,"topology"),u(h,"semantic_geometry")]);return{bundle:i,topology:m,semanticGeometry:ti(p,s,i,r),assetCache:c}}var Zn=class extends HTMLElement{static get observedAttributes(){return["bundle-url","workspace","mode","move-allowed"]}constructor(){super(),this.attachShadow({mode:"open"}),this.controller=null,this.reloadOwner=Ld(),this.pendingSelection=null,this.pendingHiddenComponents=null,this.reloadQueued=!1,this.reloadSource=null}connectedCallback(){this.queueReload()}disconnectedCallback(){this.reloadOwner.cancel(),this.controller?.dispose?.(),this.controller=null,this.reloadSource=null}attributeChangedCallback(e,a,s){if(!(!this.isConnected||a===s)){if(e==="workspace"){this.controller?.setWorkspace?.(this.workspace);return}if(e==="move-allowed"){this.controller?.setMoveAllowed?.(s==="true");return}this.queueReload()}}get workspace(){return this.getAttribute("workspace")==="stackup"?"stackup":"pcb"}get systemMode(){return this.getAttribute("mode")==="system"}queueReload(){let e=this.systemMode?"system":this.getAttribute("bundle-url");!e||e===this.reloadSource||(this.reloadSource=e,!this.reloadQueued&&(this.reloadQueued=!0,queueMicrotask(()=>{this.reloadQueued=!1,this.isConnected&&this.reload()})))}async reload(){let e=this.getAttribute("bundle-url"),a=this.reloadOwner.begin();if(this.controller?.dispose?.(),this.controller=null,this.systemMode){await this.reloadSystem(a);return}if(!e){this.shadowRoot.innerHTML="<style>:host{display:block;height:100%;font:14px system-ui;color:#94a3b8}</style><div>Semantic bundle URL is missing.</div>";return}await Ud(this,a,{owner:this.reloadOwner,bundleUrl:e,loadBundle:Kd})}async reloadSystem(e){let{signal:a}=e,s=()=>this.reloadOwner.owns(e)&&this.isConnected;try{this.renderShell();let r=await Hl({root:this.shadowRoot,loadBundle:(i,o)=>Kd(i,null,o),isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{a.aborted||this.emit("selectionchange",{selection:i})},onContextMenu:i=>{a.aborted||this.emit("contextmenu",i)},onViewStateChange:i=>{a.aborted||this.emitViewState(i)},onEmphasis:i=>{a.aborted||this.emit("emphasis",{results:i})},onMove:i=>{a.aborted||this.emit("move",i)}});if(!s()){r?.dispose?.();return}this.controller=r,this.pendingGpuBudget!=null&&r.setGpuBudget(this.pendingGpuBudget),this.pendingSystemScene&&r.setSystemScene(this.pendingSystemScene),this.pendingNetEmphasis&&r.setNetEmphasis(this.pendingNetEmphasis),r.setMoveAllowed(this.getAttribute("move-allowed")==="true"),this.pendingLabels!=null&&r.setLabelsVisible(this.pendingLabels);let n=this.getViewState();n&&this.emitViewState(n),this.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"system-mounted"})}catch(r){if(!s())return;this.renderError(r),this.emitError(r)}}emit(e,a){this.dispatchEvent(new CustomEvent(`prism-semantic-viewer:${e}`,{bubbles:!0,composed:!0,detail:a}))}setSystemScene(e){this.pendingSystemScene=e||null,e&&this.controller?.setSystemScene?.(e)}setNetEmphasis(e){return this.pendingNetEmphasis=Array.isArray(e)?e:[],this.controller?.setNetEmphasis?.(this.pendingNetEmphasis)??[]}frameNetEmphasis(e=null,a=null){return this.controller?.frameNetEmphasis?.(e,a)??!1}setMoveMode(e){this.controller?.setMoveMode?.(e)}setMoveSpace(e){this.controller?.setMoveSpace?.(e)}previewPose(e){this.controller?.previewPose?.(e)}cancelMove(){this.controller?.cancelMove?.()}getMoveState(){return this.controller?.getMoveState?.()??null}setLabelsVisible(e){this.pendingLabels=!!e,this.controller?.setLabelsVisible?.(this.pendingLabels)}setHarnessesVisible(e){this.controller?.setHarnessesVisible?.(!!e)}setHelpVisible(e){this.controller?.setHelpVisible?.(e)}frameAll(){this.controller?.frameAll?.()}frameBoard(e){return this.controller?.frameBoard?.(e)??!1}frameParts(e){return this.controller?.frameParts?.(e)??!1}renderLoading(){this.shadowRoot.innerHTML='<style>:host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}</style><div style="display:grid;place-items:center;height:100%">Loading semantic visualizer...</div>'}renderShell(){this.shadowRoot.innerHTML=jy()}renderError(e){console.error(e),this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}
        .error{height:100%;display:grid;place-items:center;padding:24px}
        pre{max-width:100%;white-space:pre-wrap;color:#fecaca;background:#111827;border:1px solid #374151;padding:16px}
      </style>
      <div class="error"><pre>${Oy(e?.stack||e?.message||String(e))}</pre></div>
    `}mountViewer({topology:e,semanticGeometry:a,readiness:s,assetCache:r=null,signal:n}){return _n({root:this.shadowRoot,topology:e,semanticGeometry:a,readiness:s,workspaceScope:"3d",assetCache:r,isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{n.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:selectionchange",{bubbles:!0,composed:!0,detail:{selection:i}}))},onContextMenu:i=>{n.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:contextmenu",{bubbles:!0,composed:!0,detail:i}))},onViewStateChange:i=>{n.aborted||this.emitViewState(i)},onPerformanceEvent:i=>{n.aborted||(console.info("[prism-3d-perf]",i),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:performance",{bubbles:!0,composed:!0,detail:i})))}})}publishController(e){this.controller=e,this.controller?.setWorkspace?.(this.workspace),this.pendingHiddenComponents&&this.controller?.setHiddenComponents?.(this.pendingHiddenComponents),this.pendingGpuBudget!=null&&this.controller?.setGpuBudget?.(this.pendingGpuBudget),this.pendingSelection&&this.controller?.setSelection?.(this.pendingSelection),this.pendingHighlightedNets?.length&&this.controller?.setHighlightedNets?.(this.pendingHighlightedNets);let a=this.getViewState();a&&this.emitViewState(a)}emitViewState(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:viewstatechange",{bubbles:!0,composed:!0,detail:e}))}emitReady(e){console.info("[prism-3d-perf]",e),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:ready",{bubbles:!0,composed:!0,detail:e}))}emitError(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:error",{bubbles:!0,detail:{error:e}}))}setSelection(e){this.pendingSelection=e||null,this.controller?.setSelection?.(this.pendingSelection)}setHighlightedNets(e){this.pendingHighlightedNets=Array.isArray(e)?[...e]:[],this.controller?.setHighlightedNets?.(this.pendingHighlightedNets)}setHiddenComponents(e){this.pendingHiddenComponents=Array.isArray(e)?[...e]:[],this.controller?.setHiddenComponents?.(this.pendingHiddenComponents)}pickAt(e,a){return Promise.resolve(this.controller?.pickAt?.(e,a)??null)}projectComponent(e,a){return this.controller?.projectComponent?.(e,a)??null}setStatsOverlay(e){this.controller?.setStatsOverlay?.(e)}getStats(){return this.controller?.stats?.()??null}setLodOverride(e){this.controller?.setLodOverride?.(e)}setLodThresholds(e){return this.controller?.setLodThresholds?.(e)??null}setGpuBudget(e){this.pendingGpuBudget=e,this.controller?.setGpuBudget?.(e)}projectPoint(e,a){return this.controller?.projectPoint?.(e,a)??null}getComponentReferences(){return this.controller?.getComponentReferences?.()??[]}resize(){this.controller?.resize?.()}getViewState(){return this.controller?.getViewState?.()??null}setViewMode(e){this.controller?.setViewMode?.(e)}setLayerVisible(e,a,s=null){this.controller?.setLayerVisible?.(e,a,s)}applyLayerPreset(e,a=null){this.controller?.applyLayerPreset?.(e,a)}setShowBoard(e){this.controller?.setShowBoard?.(e)}setShowComponents(e){this.controller?.setShowComponents?.(e)}setShowPlaceholders(e){this.controller?.setShowPlaceholders?.(e)}setRealisticColors(e){this.controller?.setRealisticColors?.(e)}setSeparation(e,a=null){this.controller?.setSeparation?.(e,a)}showNetLayers(){this.controller?.showNetLayers?.()}setNetIsolation(e){this.controller?.setNetIsolation?.(e)}};function zd(){customElements.get("prism-semantic-viewer")||customElements.define("prism-semantic-viewer",Zn)}window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__=!0;zd();
