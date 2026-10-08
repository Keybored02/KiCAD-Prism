var Ei=`:host,
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
`;var Ru=/\/api\/projects\/([^/]+)\/webgpu-3d\/assets\/([^/]+)\/([^/]+)\/(.+)$/,Au="prism-bundle-cache-a0",Kn="manifest.json";function zn(t){let e;try{e=new URL(t,"http://cache.invalid/")}catch{return null}let a=Ru.exec(e.pathname);if(!a)return null;let[,s,n,r,i]=a.map(decodeURIComponent);if(i.split("/").some(c=>!c||c==="."||c===".."))return null;let o=e.searchParams.get("viewer")||"";return`${s}/${n}/${r}/${i}${o?`?viewer=${o}`:""}`}function os(t){return`a_${encodeURIComponent(t)}`}function _u(t,e,{maxAgeMs:a=2592e6,maxBytes:s=2147483648}={}){let n=new Set,r=[];for(let[o,c]of Object.entries(t))e-Number(c.lastUsed||0)<=a?r.push([o,c]):n.add(o);r.sort((o,c)=>Number(c[1].lastUsed)-Number(o[1].lastUsed));let i=0;for(let[o,c]of r)i+=Number(c.bytes||0),i>s&&n.add(o);return[...n]}var cs=class t{static open(e={}){return t.shared||(t.shared=new t(e)),t.shared}constructor({maxAgeMs:e=2592e6,maxBytes:a=2147483648}={}){this.maxAgeMs=e,this.maxBytes=a,this.stats={hits:0,misses:0,bypassed:0,cachedBytes:0,networkBytes:0,writeErrors:0},this.ready=this.init(),this.flushTimer=null}async init(){try{let e=globalThis.navigator?.storage;if(!e?.getDirectory)return null;let s=await(await e.getDirectory()).getDirectoryHandle(Au,{create:!0}),n=await s.getFileHandle(Kn,{create:!0});if(typeof n.createWritable!="function")return null;let r={};try{let i=await(await n.getFile()).text();r=i?JSON.parse(i).entries||{}:{}}catch{r={}}return this.directory=s,this.entries=r,await this.prune(),globalThis.addEventListener?.("pagehide",()=>void this.flush()),s}catch{return null}}get enabled(){return!!this.directory}async fetchBytes(e,{store:a=!0,signal:s}={}){let n=zn(e);if(await this.ready,n&&this.directory){let c=await this.read(n);if(c)return this.stats.hits+=1,this.stats.cachedBytes+=c.byteLength,c;this.stats.misses+=1}else this.stats.bypassed+=1;let r=await fetch(e,{cache:"no-store",signal:s});if(!r.ok)throw new Error(`Failed to load ${e}: ${r.status}`);let i=await r.arrayBuffer(),o=Number(r.headers.get("content-length")||0);return this.stats.networkBytes+=i.byteLength,a&&n&&this.directory&&(!o||o===i.byteLength)&&this.write(n,i),i}async fetchJson(e,a={}){let s=await this.fetchBytes(e,a);return JSON.parse(new TextDecoder().decode(s))}async peekJson(e){let a=zn(e);if(await this.ready,!a||!this.directory)return null;let s=await this.read(a);return s?(this.stats.hits+=1,this.stats.cachedBytes+=s.byteLength,JSON.parse(new TextDecoder().decode(s))):null}async store(e,a){let s=zn(e);await this.ready,s&&this.directory&&await this.write(s,a)}async read(e){let a=this.entries[e];if(!a)return null;try{let s=await(await this.directory.getFileHandle(os(e))).getFile();return s.size!==a.bytes?null:(a.lastUsed=Date.now(),this.scheduleFlush(),await s.arrayBuffer())}catch{return delete this.entries[e],null}}async write(e,a){try{let n=await(await this.directory.getFileHandle(os(e),{create:!0})).createWritable();await n.write(a),await n.close(),this.entries[e]={bytes:a.byteLength,lastUsed:Date.now()},this.scheduleFlush()}catch{this.stats.writeErrors+=1}}async prune(e=Date.now()){if(!this.directory)return[];let a=_u(this.entries,e,{maxAgeMs:this.maxAgeMs,maxBytes:this.maxBytes});for(let n of a)delete this.entries[n],await this.directory.removeEntry(os(n)).catch(()=>{});let s=new Set(Object.keys(this.entries).map(os));for await(let n of this.directory.keys())n!==Kn&&!s.has(n)&&await this.directory.removeEntry(n).catch(()=>{});return a.length&&await this.flush(),a}async clear(){await this.ready,this.directory&&(this.entries={},await this.prune(),await this.flush())}summary(){let e=Object.values(this.entries||{});return{enabled:this.enabled,files:e.length,bytes:e.reduce((a,s)=>a+Number(s.bytes||0),0),...this.stats}}scheduleFlush(){this.flushTimer||(this.flushTimer=setTimeout(()=>{this.flushTimer=null,this.flush()},1e3))}async flush(){if(this.directory)try{let a=await(await this.directory.getFileHandle(Kn,{create:!0})).createWritable();await a.write(JSON.stringify({schema:"prism.bundle_cache_manifest.a0",entries:this.entries})),await a.close()}catch{this.stats.writeErrors+=1}}};function Nu(t,e){if(!e)return t;let a=new URL(t);return a.searchParams.set("viewer",e),a.toString()}function Ti(t,e,a,s){let n=new URL(a.asset_base||"./",e),r=structuredClone(t||{}),i=o=>!o||typeof o!="string"?o:Nu(new URL(o,n).toString(),s);for(let o of["assets","semantic_gltf","schematic_world","schematic_vector","schematic_scene","bom"]){let c=r[o];if(!(!c||typeof c!="object"))for(let[d,h]of Object.entries(c))c[d]=i(h)}return r}function Vn(t){return(t?.readiness?.stage||"semantic-ready")==="semantic-ready"&&(t?.readiness?.progress??100)>=100}var re=(t,e,a)=>Math.max(e,Math.min(a,t)),ds=(t,e,a)=>t+(e-t)*a;function Le(t,e){return[t[0]+e[0],t[1]+e[1],t[2]+e[2]]}function Cu(t,e){return[t[0]-e[0],t[1]-e[1],t[2]-e[2]]}function Be(t,e){return[t[0]*e,t[1]*e,t[2]*e]}function Fu(t){return Math.hypot(t[0],t[1],t[2])}function ot(t){let e=Fu(t)||1;return Be(t,1/e)}function mt(t,e){return[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]]}function Ra(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function ki(t,e){let a=e/2,s=Math.sin(a),n=ot(t);return[n[0]*s,n[1]*s,n[2]*s,Math.cos(a)]}function ls(t,e){return[t[3]*e[0]+t[0]*e[3]+t[1]*e[2]-t[2]*e[1],t[3]*e[1]-t[0]*e[2]+t[1]*e[3]+t[2]*e[0],t[3]*e[2]+t[0]*e[1]-t[1]*e[0]+t[2]*e[3],t[3]*e[3]-t[0]*e[0]-t[1]*e[1]-t[2]*e[2]]}function Hn(t,e){let a=[e[0],e[1],e[2],0],s=[-t[0],-t[1],-t[2],t[3]];return ls(ls(t,a),s).slice(0,3)}function us(t,e){let a=new Float32Array(16);for(let s=0;s<4;s+=1)for(let n=0;n<4;n+=1)a[s*4+n]=t[n]*e[s*4]+t[4+n]*e[s*4+1]+t[8+n]*e[s*4+2]+t[12+n]*e[s*4+3];return a}function Ii(t,e,a){let s=ot(Cu(t,e)),n=ot(mt(a,s)),r=mt(s,n);return new Float32Array([n[0],r[0],s[0],0,n[1],r[1],s[1],0,n[2],r[2],s[2],0,-Ra(n,t),-Ra(r,t),-Ra(s,t),1])}function Si(t,e,a,s){let n=1/Math.tan(t/2);return new Float32Array([n/e,0,0,0,0,n,0,0,0,0,a/(s-a),-1,0,0,a*s/(s-a),0])}function Ri(t,e,a,s){return new Float32Array([2/t,0,0,0,0,2/e,0,0,0,0,1/(s-a),0,0,0,1,1])}function qn(t){return[(t[0]+t[3])/2,(t[1]+t[4])/2,(t[2]+t[5])/2]}function Aa(t){return Math.max(.001,Math.hypot(t[3]-t[0],t[4]-t[1],t[5]-t[2])/2)}var _a=class{constructor(e){let a=qn(e),s=Aa(e);this.focus=[...a],this.targetFocus=[...a],this.azimuth=-.62,this.targetAzimuth=this.azimuth,this.polar=.72,this.targetPolar=this.polar,this.distance=s*2.8,this.targetDistance=this.distance,this.orthoScale=s*2.15,this.targetOrthoScale=this.orthoScale,this.sceneRadius=s,this.fov=Math.PI/4}update(e){let a=1-Math.exp(-e*14);this.focus=this.focus.map((s,n)=>ds(s,this.targetFocus[n],a)),this.azimuth=_i(this.azimuth,this.targetAzimuth,a),this.polar=_i(this.polar,this.targetPolar,a),this.distance=ds(this.distance,this.targetDistance,a),this.orthoScale=ds(this.orthoScale,this.targetOrthoScale,a)}snap(){this.focus=[...this.targetFocus],this.azimuth=this.targetAzimuth,this.polar=this.targetPolar,this.distance=this.targetDistance,this.orthoScale=this.targetOrthoScale}basis(){let e=Math.sin(this.polar),a=Math.cos(this.polar),s=ot([e*Math.sin(this.azimuth),-e*Math.cos(this.azimuth),a]),n=ot([Math.cos(this.azimuth),Math.sin(this.azimuth),0]),r=ot(mt(s,n));return{right:n,up:r,back:s}}matrix(e,a,s=!1,n=1){let r=Math.max(.01,e/Math.max(1,a)),{up:i,back:o}=this.basis(),c=Le(this.focus,Be(o,this.distance)),d=Ii(c,this.focus,i),h=s?Ri(this.orthoScale*n*r,this.orthoScale*n,-this.sceneRadius*40,this.sceneRadius*40):Si(this.fov,r,Math.max(this.sceneRadius*5e-4,this.distance-this.sceneRadius*3.5),this.distance+this.sceneRadius*4.5);return us(h,d)}orbit(e,a){let s=Math.sin(this.targetPolar)<0?-1:1;this.targetAzimuth-=s*e*.006,this.targetPolar=Ai(this.targetPolar-a*.006)}isBelow(){return Math.cos(this.targetPolar)<0}pan(e,a,s,n=!1){let{right:r,up:i}=this.basis(),o=n?this.targetOrthoScale/Math.max(1,s):2*this.targetDistance*Math.tan(this.fov/2)/Math.max(1,s),c=Le(Be(r,-e*o),Be(i,a*o));this.targetFocus=Le(this.targetFocus,c)}dolly(e,a=!1){let s=Math.exp(e*.0032);a?this.targetOrthoScale=re(this.targetOrthoScale*s,this.sceneRadius*.008,this.sceneRadius*24):this.targetDistance=re(this.targetDistance*s,this.sceneRadius*.01,this.sceneRadius*48)}frame(e){if(!e)return;let a=Aa(e);this.targetFocus=qn(e),this.targetDistance=Math.max(a*2.8,this.sceneRadius*.02),this.targetOrthoScale=Math.max(a*2.15,this.sceneRadius*.02)}setFocus(e){this.targetFocus=[...e]}setAxis(e,a=!1){e==="z"?(this.targetAzimuth=0,this.targetPolar=a?Math.PI-.015:.015):e==="x"?(this.targetAzimuth=a?-Math.PI/2:Math.PI/2,this.targetPolar=Math.PI/2):(this.targetAzimuth=a?0:Math.PI,this.targetPolar=Math.PI/2)}rotateZ(e=1){this.targetAzimuth+=e*Math.PI/2}flip(){this.targetPolar=Ai(Math.PI-this.targetPolar)}};function Ai(t){return Math.atan2(Math.sin(t),Math.cos(t))}function _i(t,e,a){let s=Math.atan2(Math.sin(e-t),Math.cos(e-t));return t+s*a}var fs=class t{static async create(e,a,s={}){let n=await fetch(a,{cache:"default"});if(!n.ok)throw new Error(`Failed to load BoM ${a}: ${n.status}`);let r=await n.json();if(r.schema!=="prism.bom_a0")throw new Error(`Unsupported BoM schema: ${r.schema||"missing"}`);let i=new t(e,r,s);return i.render(),i}constructor(e,a,s){this.container=e,this.payload=a,this.callbacks=s,this.query="",this.selectedRowId="",this.selectedReference="",this.rowsById=new Map((a.rows||[]).map(n=>[n.id,n])),this.componentIndex=new Map(Object.entries(a.componentIndex||{}))}setSelectionByReference(e,a={}){let s=this.componentIndex.get(e);s&&(this.selectedReference=e,this.selectedRowId=s.rowId,this.renderContent(),a.scroll&&this.container.querySelector(`[data-row-id="${Pu(s.rowId)}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}))}clearSelection(){this.selectedReference="",this.selectedRowId="",this.renderContent()}render(){let e=this.filteredRows();this.container.innerHTML=`
      <section class="bom-workspace">
        <header class="bom-toolbar">
          <div>
            <p class="eyebrow">Prism BoM A0</p>
            <h2>Bill of Materials</h2>
            <span data-bom-count>${e.length} of ${(this.payload.rows||[]).length} grouped rows \xB7 ${(this.payload.components||[]).length} components</span>
          </div>
          <label class="bom-search">
            <span>Search</span>
            <input id="bom-search" type="search" value="${Ue(this.query)}" placeholder="Reference, value, footprint, manufacturer..." />
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
            <tr>${a.map(n=>`<th>${Ue(n)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${e.map(n=>this.rowHtml(n,a)).join("")}
          </tbody>
        </table>
      </div>
      ${s?`<aside class="bom-detail">${this.detailHtml(s)}</aside>`:""}
    `}filteredRows(){let e=this.query.trim().toLowerCase(),a=this.payload.rows||[];return e?a.filter(s=>JSON.stringify(s).toLowerCase().includes(e)):a}rowHtml(e,a){return`
      <tr class="${e.id===this.selectedRowId?"selected":""}" data-row-id="${Ue(e.id)}">
        ${a.map(n=>{let r=e.fields?.[n]||"";return n==="Reference"?`<td class="bom-reference-cell">${(e.references||[]).map(i=>`
              <button class="bom-ref-chip ${i===this.selectedReference?"active":""}" data-reference="${Ue(i)}">${Ue(i)}</button>
            `).join("")}</td>`:!r&&ju(n)?'<td><span class="bom-missing">Missing</span></td>':`<td title="${Ue(r)}">${Ue(r)}</td>`}).join("")}
      </tr>
    `}detailHtml(e){let a=Bu(e,this.payload.displayColumns||[],this.payload.extraColumns||[]);return`
      <div class="bom-detail-head">
        <p class="eyebrow">Line item</p>
        <h3>${Ue((e.references||[]).join(", "))}</h3>
        <span>${e.qty} component${e.qty===1?"":"s"}${e.dnp?" \xB7 DNP":""}</span>
      </div>
      <div class="bom-ref-list">
        ${(e.references||[]).map(s=>`
          <button class="bom-ref-chip detail ${s===this.selectedReference?"active":""}" data-reference="${Ue(s)}">${Ue(s)}</button>
        `).join("")}
      </div>
      <dl class="bom-field-list">
        ${a.map(([s,n])=>`
          <div>
            <dt>${Ue(s)}</dt>
            <dd>${Ue(n)}</dd>
          </div>
        `).join("")}
      </dl>
    `}bind(){let e=this.container.querySelector("#bom-search");e?.addEventListener("input",()=>{this.query=e.value,this.renderContent()}),this.bindContent(this.container)}bindContent(e){e.querySelectorAll("[data-row-id]").forEach(a=>{a.addEventListener("click",s=>{s.target.closest("[data-reference]")||(this.selectedRowId=a.dataset.rowId,this.selectedReference="",this.renderContent())})}),e.querySelectorAll("[data-reference]").forEach(a=>{a.addEventListener("click",s=>{s.stopPropagation();let n=a.dataset.reference;this.setSelectionByReference(n),this.callbacks.onSelectReference?.(n)})})}};function Bu(t,e,a){let s=[],n=new Set(["Reference","Qty"].map(Xn));for(let i of e){if(i==="Reference"||i==="Qty")continue;let o=t.fields?.[i]||"";o&&(s.push([i,o]),n.add(Xn(i)))}let r=t.canonicalFields||{};for(let i of a){let o=r[i]||"";if(!o)continue;let c=Xn(i);n.has(c)||(n.add(c),s.push([i,o]))}return s}function Xn(t){return String(t||"").toLowerCase().replace(/[\s_\-()[\]/]+/g,"")}function ju(t){return["Manufacturer Part Number","Vendor Part Number","Datasheet","Footprint","Value"].includes(t)}function Ue(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Pu(t){return String(t).replace(/["\\]/g,"\\$&")}function Wn(t){let e=`${t.nodeName||""} ${t.meshName||""} ${t.material?.name||""}`.toLowerCase();return e.includes("_pad")||e.includes(".pad")||e.endsWith("pad")?"pad":e.includes("silkscreen")?"silkscreen":e.includes("soldermask")?"soldermask":e.includes("paste")?"paste":"substrate"}function hs(t,e=()=>""){let a=new Map;for(let s of t){let r=`${e(s)}:${JSON.stringify(s.material)}`;a.has(r)||a.set(r,[]),a.get(r).push(s)}return[...a.values()].map(s=>{let n=s.reduce((f,l)=>f+l.position.length/3,0),r=s.reduce((f,l)=>f+l.indices.length,0),i=new Float32Array(n*3),o=new Float32Array(n*3),c=new Uint32Array(n),d=new Uint32Array(n),h=new Uint32Array(r),u=0,m=0,p=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let f of s){let l=f.position.length/3;i.set(f.position,u*3),o.set(f.normal,u*3),c.set(f.netId,u),d.set(f.objectFeatureId,u);for(let y=0;y<f.indices.length;y+=1)h[m+y]=Number(f.indices[y])+u;f.bounds&&(p[0]=Math.min(p[0],f.bounds[0]),p[1]=Math.min(p[1],f.bounds[1]),p[2]=Math.min(p[2],f.bounds[2]),p[3]=Math.max(p[3],f.bounds[3]),p[4]=Math.max(p[4],f.bounds[4]),p[5]=Math.max(p[5],f.bounds[5])),u+=l,m+=f.indices.length}return{position:i,normal:o,netId:c,objectFeatureId:d,indices:h,material:s[0].material,groupKey:e(s[0]),bounds:Number.isFinite(p[0])?p:null}})}function Ca(t){return!t||t.length!==6?null:[t[0]/1e3,-t[4]/1e3,t[2]/1e3,t[3]/1e3,-t[1]/1e3,t[5]/1e3]}function bs(t){let e=t?.min||[0,0,0],a=t?.max||[.08,.0016,.05];return[e[0],-a[2],e[1],a[0],-e[2],a[1]]}function ca(t){let e=t.filter(a=>Array.isArray(a)&&a.length===6);return e.length?e.reduce((a,s)=>[Math.min(a[0],s[0]),Math.min(a[1],s[1]),Math.min(a[2],s[2]),Math.max(a[3],s[3]),Math.max(a[4],s[4]),Math.max(a[5],s[5])],[...e[0]]):null}function Ni(t){let e=t.replace("#","");return[0,2,4].map(a=>parseInt(e.slice(a,a+2),16)/255)}function Ci(t,e){if(typeof t?.color=="string"&&/^#[0-9a-fA-F]{6}$/.test(t.color))return[...Ni(t.color),1];let a={"F.Cu":"#a9423c","B.Cu":"#315b9a","In1.Cu":"#477a55","In2.Cu":"#806244","In3.Cu":"#347c86","In4.Cu":"#685889","In5.Cu":"#92793e"},s=["#477a55","#806244","#347c86","#685889","#92793e","#82556e"],n=String(t?.name||""),r=Math.max(0,e.findIndex(i=>i.name===n)-1);return[...Ni(a[n]||s[r%s.length]),1]}function Fi(t,e){let a=e.map(s=>[Number(s.id),Number(s.z_mm||0)]);return a.length<3?!1:(a.sort((s,n)=>s[1]-n[1]),t!==a[0][0]&&t!==a[a.length-1][0])}var Na=Object.freeze({gold:[.83,.69,.37,1],silver:[.74,.75,.77,1],copper:[.76,.47,.28,1]});function Bi(t){let e=String(t||"").toLowerCase();return/hasl|hal\b|tin|silver|lead/.test(e)?Na.silver:/osp|bare|none/.test(e)?Na.copper:Na.gold}function ji(t,e){let a=String(t?.name||"");return!!a&&(a===e[0]?.name||a===e[e.length-1]?.name)}function Pi(t,e){let a=String(t.material?.name||"").endsWith("_bottom"),s=e.find(n=>n.name===(a?"B.Cu":"F.Cu"))||(a?e[e.length-1]:e[0]);return Number(s?.id||0)}function Oi(t,e=new Map){let a=new Map;for(let n of t||[]){let r=String(n?.designator||"");if(!r)continue;let i=a.get(r)||{reference:r,featureIds:new Set,modelCount:0},o=Number(n?.featureId)||0;o>0&&i.featureIds.add(o),a.set(r,i)}for(let[n,r]of e||[]){let i=a.get(String(n));i&&(i.modelCount=Math.max(i.modelCount,Number(r)||0))}let s=new Map;for(let[n,r]of a)s.set(n,{reference:n,featureIds:[...r.featureIds].sort((i,o)=>i-o),ambiguous:r.featureIds.size>1||r.modelCount>1});return s}function Di(t,e){let a=[...new Set((Array.isArray(t)?t:[]).map(c=>String(c||"")).filter(Boolean))],s=[],n=[],r=[],i=new Set,o=new Set;for(let c of a){let d=e.get(c);if(!d){r.push(c);continue}if(d.ambiguous){n.push(c);continue}s.push(c),o.add(c);for(let h of d.featureIds)i.add(h)}return{requested:a,applied:s,ambiguous:n,unknown:r,hiddenFeatureIds:i,hiddenReferences:o}}function ps(t,e){return!!t&&e.has(String(t))}var Ou={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function G(t){return String(t??"").replace(/[&<>"']/g,e=>Ou[e])}var Fa=`
fn netEmphasized(id: u32) -> bool {
  return id != 0u && id < arrayLength(&netMask) && netMask[id] != 0u;
}
`;function ms(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function Li(t,e=0){let a=0;for(let n of ms(t))a=Math.max(a,n);let s=64;for(;s<a+1;)s*=2;return Math.max(s,Math.floor(e)||0)}function Ui(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(0);for(let n of ms(t))n<a&&(s[n]=1);return s}function Xt(t,e){return!Array.isArray(t)||!e?null:t.find(a=>a.name===e||Array.isArray(a.aliases)&&a.aliases.includes(e))||null}function Gi(t,e){let a=new Set;if(!Array.isArray(t)||!Array.isArray(e))return a;for(let s of e){if(!s)continue;let n=s.netUid&&t.find(i=>i.uid===s.netUid)||s.netName&&Xt(t,s.netName),r=Number(n?.id);Number.isInteger(r)&&r>0&&a.add(r)}return a}var $n=Object.freeze([[.08,1,.2],[1,.72,.1],[.2,.75,1],[1,.3,.75],[.65,.45,1],[1,.45,.2],[.3,1,.85],[.95,.95,.3]]),Ki=`
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
`;function zi(t){let e=null;return Array.isArray(t)&&t.length>=3&&t.slice(0,3).every(a=>Number.isFinite(Number(a)))?e=t.slice(0,3).map(a=>Math.round(Math.min(1,Math.max(0,Number(a)))*255)):typeof t=="string"&&/^#[0-9a-f]{6}$/i.test(t)&&(e=[1,3,5].map(a=>parseInt(t.slice(a,a+2),16))),e?(1<<24|e[0]<<16|e[1]<<8|e[2])>>>0:1}function Vi(t){let e=1;for(let s of t)for(let n of s?.keys()||[])e=Math.max(e,n+1);let a=new Uint32Array(Math.max(64,t.length*e));return t.forEach((s,n)=>{for(let[r,i]of s||[])Number.isInteger(r)&&r>0&&(a[n*e+r]=i>>>0)}),{stride:e,data:a}}var Hi=class{_listeners={};addEventListener(t,e){let a=this._listeners;return a[t]===void 0&&(a[t]=[]),a[t].indexOf(e)===-1&&a[t].push(e),this}removeEventListener(t,e){let a=this._listeners[t];if(a!==void 0){let s=a.indexOf(e);s!==-1&&a.splice(s,1)}return this}dispatchEvent(t){let e=this._listeners[t.type];if(e!==void 0){let a=e.slice(0);for(let s=0,n=a.length;s<n;s++)a[s].call(this,t)}return this}dispose(){for(let t in this._listeners)delete this._listeners[t]}},yt=class{_disposed=!1;_name;_parent;_child;_attributes;constructor(t,e,a,s={}){if(this._name=t,this._parent=e,this._child=a,this._attributes=s,!e.isOnGraph(a))throw new Error("Cannot connect disconnected graphs.")}getName(){return this._name}getParent(){return this._parent}getChild(){return this._child}setChild(t){return this._child=t,this}getAttributes(){return this._attributes}dispose(){this._disposed||(this._parent._destroyRef(this),this._disposed=!0)}isDisposed(){return this._disposed}},Yn=class extends Hi{_emptySet=new Set;_edges=new Set;_parentEdges=new Map;_childEdges=new Map;listEdges(){return Array.from(this._edges)}listParentEdges(t){return Array.from(this._childEdges.get(t)||this._emptySet)}listParents(t){let e=new Set;for(let a of this.listParentEdges(t))e.add(a.getParent());return Array.from(e)}listChildEdges(t){return Array.from(this._parentEdges.get(t)||this._emptySet)}listChildren(t){let e=new Set;for(let a of this.listChildEdges(t))e.add(a.getChild());return Array.from(e)}disconnectParents(t,e){for(let a of this.listParentEdges(t))(!e||e(a.getParent()))&&a.dispose();return this}_createEdge(t,e,a,s){let n=new yt(t,e,a,s);this._edges.add(n);let r=n.getParent();this._parentEdges.has(r)||this._parentEdges.set(r,new Set),this._parentEdges.get(r).add(n);let i=n.getChild();return this._childEdges.has(i)||this._childEdges.set(i,new Set),this._childEdges.get(i).add(n),n}_destroyEdge(t){return this._edges.delete(t),this._parentEdges.get(t.getParent()).delete(t),this._childEdges.get(t.getChild()).delete(t),this}},xe=class{list=[];constructor(t){if(t)for(let e of t)this.list.push(e)}add(t){this.list.push(t)}remove(t){let e=this.list.indexOf(t);e>=0&&this.list.splice(e,1)}removeChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);for(let a of e)this.remove(a);return e}listRefsByChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);return e}values(){return this.list}},se=class{set=new Set;map=new Map;constructor(t){if(t)for(let e of t)this.add(e)}add(t){let e=t.getChild();this.removeChild(e),this.set.add(t),this.map.set(e,t)}remove(t){this.set.delete(t),this.map.delete(t.getChild())}removeChild(t){let e=this.map.get(t)||null;return e&&this.remove(e),e}getRefByChild(t){return this.map.get(t)||null}values(){return Array.from(this.set)}},ue=class{map={};constructor(t){t&&Object.assign(this.map,t)}set(t,e){this.map[t]=e}delete(t){delete this.map[t]}get(t){return this.map[t]||null}keys(){return Object.keys(this.map)}values(){return Object.values(this.map)}},Q=Symbol("attributes"),gt=Symbol("immutableKeys"),qi=class Xi extends Hi{_disposed=!1;graph;[Q];[gt];constructor(e){super(),this.graph=e,this[gt]=new Set,this[Q]=this._createAttributes()}getDefaults(){return{}}_createAttributes(){let e=this.getDefaults(),a={};for(let s in e){let n=e[s];if(n instanceof Xi){let r=this.graph._createEdge(s,this,n);this[gt].add(s),a[s]=r}else a[s]=n}return a}isOnGraph(e){return this.graph===e.graph}isDisposed(){return this._disposed}dispose(){this._disposed||(this.graph.listChildEdges(this).forEach(e=>e.dispose()),this.graph.disconnectParents(this),this._disposed=!0,this.dispatchEvent({type:"dispose"}))}detach(){return this.graph.disconnectParents(this),this}swap(e,a){for(let s in this[Q]){let n=this[Q][s];if(n instanceof yt){let r=n;r.getChild()===e&&this.setRef(s,a,r.getAttributes())}else if(n instanceof xe)for(let r of n.listRefsByChild(e)){let i=r.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}else if(n instanceof se){let r=n.getRefByChild(e);if(r){let i=r.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}}else if(n instanceof ue)for(let r of n.keys()){let i=n.get(r);i.getChild()===e&&this.setRefMap(s,r,a,i.getAttributes())}}return this}get(e){return this[Q][e]}set(e,a){return this[Q][e]=a,this.dispatchEvent({type:"change",attribute:e})}getRef(e){let a=this[Q][e];return a?a.getChild():null}setRef(e,a,s){if(this[gt].has(e))throw new Error(`Cannot overwrite immutable attribute, "${e}".`);let n=this[Q][e];if(n&&n.dispose(),!a)return this;let r=this.graph._createEdge(e,this,a,s);return this[Q][e]=r,this.dispatchEvent({type:"change",attribute:e})}listRefs(e){return this.assertRefList(e).values().map(a=>a.getChild())}addRef(e,a,s){let n=this.graph._createEdge(e,this,a,s);return this.assertRefList(e).add(n),this.dispatchEvent({type:"change",attribute:e})}removeRef(e,a){let s=this.assertRefList(e);if(s instanceof xe)for(let n of s.listRefsByChild(a))n.dispose();else{let n=s.getRefByChild(a);n&&n.dispose()}return this}assertRefList(e){let a=this[Q][e];if(a instanceof xe||a instanceof se)return a;throw new Error(`Expected RefList or RefSet for attribute "${e}"`)}listRefMapKeys(e){return this.assertRefMap(e).keys()}listRefMapValues(e){return this.assertRefMap(e).values().map(a=>a.getChild())}getRefMap(e,a){let s=this.assertRefMap(e).get(a);return s?s.getChild():null}setRefMap(e,a,s,n){let r=this.assertRefMap(e),i=r.get(a);if(i&&i.dispose(),!s)return this;n=Object.assign(n||{},{key:a});let o=this.graph._createEdge(e,this,s,{...n,key:a});return r.set(a,o),this.dispatchEvent({type:"change",attribute:e,key:a})}assertRefMap(e){let a=this[Q][e];if(a instanceof ue)return a;throw new Error(`Expected RefMap for attribute "${e}"`)}dispatchEvent(e){return super.dispatchEvent({...e,target:this}),this.graph.dispatchEvent({...e,target:this,type:`node:${e.type}`}),this}_destroyRef(e){let a=e.getName();if(this[Q][a]===e)this[Q][a]=null,this[gt].has(a)&&e.getChild().dispose();else if(this[Q][a]instanceof xe)this[Q][a].remove(e);else if(this[Q][a]instanceof se)this[Q][a].remove(e);else if(this[Q][a]instanceof ue){let s=this[Q][a];for(let n of s.keys())s.get(n)===e&&s.delete(n)}else return;this.graph._destroyEdge(e),this.dispatchEvent({type:"change",attribute:a})}};var eo="v4.4.2",vt="@glb.bin",C=(function(t){return t.ACCESSOR="Accessor",t.ANIMATION="Animation",t.ANIMATION_CHANNEL="AnimationChannel",t.ANIMATION_SAMPLER="AnimationSampler",t.BUFFER="Buffer",t.CAMERA="Camera",t.MATERIAL="Material",t.MESH="Mesh",t.PRIMITIVE="Primitive",t.PRIMITIVE_TARGET="PrimitiveTarget",t.NODE="Node",t.ROOT="Root",t.SCENE="Scene",t.SKIN="Skin",t.TEXTURE="Texture",t.TEXTURE_INFO="TextureInfo",t})({});var Du=(function(t){return t.ARRAY_BUFFER="ARRAY_BUFFER",t.ELEMENT_ARRAY_BUFFER="ELEMENT_ARRAY_BUFFER",t.INVERSE_BIND_MATRICES="INVERSE_BIND_MATRICES",t.OTHER="OTHER",t.SPARSE="SPARSE",t})({}),Xe=(function(t){return t[t.R=4096]="R",t[t.G=256]="G",t[t.B=16]="B",t[t.A=1]="A",t})({});var Lu=class extends Float32Array{constructor(){throw super(),new Error("Unsupported typed array instantiation.")}},Ts={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5131:typeof Float16Array<"u"?Float16Array:Lu,5126:Float32Array,5130:Float64Array},H=class{static createBufferFromDataURI(t){if(typeof Buffer>"u"){let e=atob(t.split(",")[1]),a=new Uint8Array(e.length);for(let s=0;s<e.length;s++)a[s]=e.charCodeAt(s);return a}else{let e=t.split(",")[1],a=t.indexOf("base64")>=0;return Buffer.from(e,a?"base64":"utf8")}}static encodeText(t){return new TextEncoder().encode(t)}static decodeText(t){return new TextDecoder().decode(t)}static concat(t){let e=0;for(let n of t)e+=n.byteLength;let a=new Uint8Array(e),s=0;for(let n of t)a.set(n,s),s+=n.byteLength;return a}static pad(t,e=0){let a=this.padNumber(t.byteLength);if(a===t.byteLength)return t;let s=new Uint8Array(a);if(s.set(t),e!==0)for(let n=t.byteLength;n<a;n++)s[n]=e;return s}static padNumber(t){return Math.ceil(t/4)*4}static equals(t,e){if(t===e)return!0;if(t.byteLength!==e.byteLength)return!1;let a=t.byteLength;for(;a--;)if(t[a]!==e[a])return!1;return!0}static toView(t,e=0,a=1/0){return new Uint8Array(t.buffer,t.byteOffset+e,Math.min(t.byteLength,a))}static assertView(t){if(t&&!ArrayBuffer.isView(t))throw new Error(`Method requires Uint8Array parameter; received "${typeof t}".`);return t}};var Uu=class{match(t){return t.length>=3&&t[0]===255&&t[1]===216&&t[2]===255}getSize(t){let e=new DataView(t.buffer,t.byteOffset+4),a,s;for(;e.byteLength;){if(a=e.getUint16(0,!1),Ku(e,a),s=e.getUint8(a+1),s===192||s===193||s===194)return[e.getUint16(a+7,!1),e.getUint16(a+5,!1)];e=new DataView(t.buffer,e.byteOffset+a+2)}throw new TypeError("Invalid JPG, no size found")}getChannels(t){return 3}},Gu=class to{static PNG_FRIED_CHUNK_NAME="CgBI";match(e){return e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71&&e[4]===13&&e[5]===10&&e[6]===26&&e[7]===10}getSize(e){let a=new DataView(e.buffer,e.byteOffset);return H.decodeText(e.slice(12,16))===to.PNG_FRIED_CHUNK_NAME?[a.getUint32(32,!1),a.getUint32(36,!1)]:[a.getUint32(16,!1),a.getUint32(20,!1)]}getChannels(e){return 4}},tt=class{static impls={"image/jpeg":new Uu,"image/png":new Gu};static registerFormat(t,e){this.impls[t]=e}static getMimeType(t){for(let e in this.impls)if(this.impls[e].match(t))return e;return null}static getSize(t,e){return this.impls[e]?this.impls[e].getSize(t):null}static getChannels(t,e){return this.impls[e]?this.impls[e].getChannels(t):null}static getVRAMByteLength(t,e){if(!this.impls[e])return null;if(this.impls[e].getVRAMByteLength)return this.impls[e].getVRAMByteLength(t);let a=0,s=4,n=this.getSize(t,e);if(!n)return null;for(;n[0]>1||n[1]>1;)a+=n[0]*n[1]*s,n[0]=Math.max(Math.floor(n[0]/2),1),n[1]=Math.max(Math.floor(n[1]/2),1);return a+=1*s,a}static mimeTypeToExtension(t){return t==="image/jpeg"?"jpg":t.split("/").pop()}static extensionToMimeType(t){return t==="jpg"?"image/jpeg":t?`image/${t}`:""}};function Ku(t,e){if(e>t.byteLength)throw new TypeError("Corrupt JPG, exceeded buffer limits");if(t.getUint8(e)!==255)throw new TypeError("Invalid JPG, marker table corrupted");return t}var la=class{static basename(t){let e=t.split(/[\\/]/).pop();return e.substring(0,e.lastIndexOf("."))}static extension(t){if(t.startsWith("data:image/")){let e=t.match(/data:(image\/\w+)/)[1];return tt.mimeTypeToExtension(e)}else{if(t.startsWith("data:model/gltf+json"))return"gltf";if(t.startsWith("data:model/gltf-binary"))return"glb";if(t.startsWith("data:application/"))return"bin"}return t.split(/[\\/]/).pop().split(/[.]/).pop()}},Zn=typeof Float32Array<"u"?Float32Array:Array;Math.PI/180;180/Math.PI;function zu(){var t=new Zn(3);return Zn!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function Jn(t){var e=t[0],a=t[1],s=t[2];return Math.sqrt(e*e+a*a+s*s)}function Vu(t,e,a){var s=e[0],n=e[1],r=e[2],i=a[3]*s+a[7]*n+a[11]*r+a[15];return i=i||1,t[0]=(a[0]*s+a[4]*n+a[8]*r+a[12])/i,t[1]=(a[1]*s+a[5]*n+a[9]*r+a[13])/i,t[2]=(a[2]*s+a[6]*n+a[10]*r+a[14])/i,t}(function(){var t=zu();return function(e,a,s,n,r,i){var o,c;for(a||(a=3),s||(s=0),n?c=Math.min(n*a+s,e.length):c=e.length,o=s;o<c;o+=a)t[0]=e[o],t[1]=e[o+1],t[2]=e[o+2],r(t,t,i),e[o]=t[0],e[o+1]=t[1],e[o+2]=t[2];return e}})();function ao(t){let e=so(),a=t.propertyType==="Node"?[t]:t.listChildren();for(let s of a)s.traverse(n=>{let r=n.getMesh();if(!r)return;let i=Hu(r,n.getWorldMatrix());i.min.every(isFinite)&&i.max.every(isFinite)&&(er(i.min,e),er(i.max,e))});return e}function Hu(t,e){let a=so();for(let s of t.listPrimitives()){let n=s.getAttribute("POSITION"),r=s.getIndices();if(!n)continue;let i=[0,0,0],o=[0,0,0];for(let c=0,d=r?r.getCount():n.getCount();c<d;c++){let h=r?r.getScalar(c):c;i=n.getElement(h,i),o=Vu(o,i,e),er(o,a)}}return a}function er(t,e){for(let a=0;a<3;a++)e.min[a]=Math.min(t[a],e.min[a]),e.max[a]=Math.max(t[a],e.max[a])}function so(){return{min:[1/0,1/0,1/0],max:[-1/0,-1/0,-1/0]}}var Wi="https://null.example",Qn=class{static DEFAULT_INIT={};static PROTOCOL_REGEXP=/^[a-zA-Z]+:\/\//;static dirname(t){let e=t.lastIndexOf("/");return e===-1?"./":t.substring(0,e+1)}static basename(t){return la.basename(new URL(t,Wi).pathname)}static extension(t){return la.extension(new URL(t,Wi).pathname)}static resolve(t,e){if(!this.isRelativePath(e))return e;let a=t.split("/"),s=e.split("/");a.pop();for(let n=0;n<s.length;n++)s[n]!=="."&&(s[n]===".."?a.pop():a.push(s[n]));return a.join("/")}static isAbsoluteURL(t){return this.PROTOCOL_REGEXP.test(t)}static isRelativePath(t){return!/^(?:[a-zA-Z]+:)?\//.test(t)}};function $i(t){return Object.prototype.toString.call(t)==="[object Object]"}function Wt(t){if($i(t)===!1)return!1;let e=t.constructor;if(e===void 0)return!0;let a=e.prototype;return!($i(a)===!1||Object.hasOwn(a,"isPrototypeOf")===!1)}var qu=(function(t){return t[t.SILENT=4]="SILENT",t[t.ERROR=3]="ERROR",t[t.WARN=2]="WARN",t[t.INFO=1]="INFO",t[t.DEBUG=0]="DEBUG",t})({}),ks=class no{verbosity;static Verbosity=qu;static DEFAULT_INSTANCE=new no(1);constructor(e){this.verbosity=e}debug(e){this.verbosity<=0&&console.debug(e)}info(e){this.verbosity<=1&&console.info(e)}warn(e){this.verbosity<=2&&console.warn(e)}error(e){this.verbosity<=3&&console.error(e)}};function Xu(t){var e=t[0],a=t[1],s=t[2],n=t[3],r=t[4],i=t[5],o=t[6],c=t[7],d=t[8],h=t[9],u=t[10],m=t[11],p=t[12],f=t[13],l=t[14],y=t[15],b=e*i-a*r,g=e*o-s*r,x=a*o-s*i,M=d*f-h*p,T=d*l-u*p,I=h*l-u*f,S=e*I-a*T+s*M,R=r*I-i*T+o*M,A=d*x-h*g+u*b,_=p*x-f*g+l*b;return c*S-n*R+y*A-m*_}function Wu(t,e,a){var s=e[0],n=e[1],r=e[2],i=e[3],o=e[4],c=e[5],d=e[6],h=e[7],u=e[8],m=e[9],p=e[10],f=e[11],l=e[12],y=e[13],b=e[14],g=e[15],x=a[0],M=a[1],T=a[2],I=a[3];return t[0]=x*s+M*o+T*u+I*l,t[1]=x*n+M*c+T*m+I*y,t[2]=x*r+M*d+T*p+I*b,t[3]=x*i+M*h+T*f+I*g,x=a[4],M=a[5],T=a[6],I=a[7],t[4]=x*s+M*o+T*u+I*l,t[5]=x*n+M*c+T*m+I*y,t[6]=x*r+M*d+T*p+I*b,t[7]=x*i+M*h+T*f+I*g,x=a[8],M=a[9],T=a[10],I=a[11],t[8]=x*s+M*o+T*u+I*l,t[9]=x*n+M*c+T*m+I*y,t[10]=x*r+M*d+T*p+I*b,t[11]=x*i+M*h+T*f+I*g,x=a[12],M=a[13],T=a[14],I=a[15],t[12]=x*s+M*o+T*u+I*l,t[13]=x*n+M*c+T*m+I*y,t[14]=x*r+M*d+T*p+I*b,t[15]=x*i+M*h+T*f+I*g,t}function $u(t,e){var a=e[0],s=e[1],n=e[2],r=e[4],i=e[5],o=e[6],c=e[8],d=e[9],h=e[10];return t[0]=Math.sqrt(a*a+s*s+n*n),t[1]=Math.sqrt(r*r+i*i+o*o),t[2]=Math.sqrt(c*c+d*d+h*h),t}function Yu(t,e){var a=new Zn(3);$u(a,e);var s=1/a[0],n=1/a[1],r=1/a[2],i=e[0]*s,o=e[1]*n,c=e[2]*r,d=e[4]*s,h=e[5]*n,u=e[6]*r,m=e[8]*s,p=e[9]*n,f=e[10]*r,l=i+h+f,y=0;return l>0?(y=Math.sqrt(l+1)*2,t[3]=.25*y,t[0]=(u-p)/y,t[1]=(m-c)/y,t[2]=(o-d)/y):i>h&&i>f?(y=Math.sqrt(1+i-h-f)*2,t[3]=(u-p)/y,t[0]=.25*y,t[1]=(o+d)/y,t[2]=(m+c)/y):h>f?(y=Math.sqrt(1+h-i-f)*2,t[3]=(m-c)/y,t[0]=(o+d)/y,t[1]=.25*y,t[2]=(u+p)/y):(y=Math.sqrt(1+f-i-h)*2,t[3]=(o-d)/y,t[0]=(m+c)/y,t[1]=(u+p)/y,t[2]=.25*y),t}var ie=class Ba{static identity(e){return e}static eq(e,a,s=1e-5){if(e.length!==a.length)return!1;for(let n=0;n<e.length;n++)if(Math.abs(e[n]-a[n])>s)return!1;return!0}static clamp(e,a,s){return e<a?a:e>s?s:e}static decodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return e/65535;case 5121:return e/255;case 5122:return Math.max(e/32767,-1);case 5120:return Math.max(e/127,-1);default:throw new Error("Invalid component type.")}}static encodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return Math.round(Ba.clamp(e,0,1)*65535);case 5121:return Math.round(Ba.clamp(e,0,1)*255);case 5122:return Math.round(Ba.clamp(e,-1,1)*32767);case 5120:return Math.round(Ba.clamp(e,-1,1)*127);default:throw new Error("Invalid component type.")}}static decompose(e,a,s,n){let r=Jn([e[0],e[1],e[2]]),i=Jn([e[4],e[5],e[6]]),o=Jn([e[8],e[9],e[10]]);Xu(e)<0&&(r=-r),a[0]=e[12],a[1]=e[13],a[2]=e[14];let c=e.slice(),d=1/r,h=1/i,u=1/o;c[0]*=d,c[1]*=d,c[2]*=d,c[4]*=h,c[5]*=h,c[6]*=h,c[8]*=u,c[9]*=u,c[10]*=u,Yu(s,c),n[0]=r,n[1]=i,n[2]=o}static compose(e,a,s,n){let r=n,i=a[0],o=a[1],c=a[2],d=a[3],h=i+i,u=o+o,m=c+c,p=i*h,f=i*u,l=i*m,y=o*u,b=o*m,g=c*m,x=d*h,M=d*u,T=d*m,I=s[0],S=s[1],R=s[2];return r[0]=(1-(y+g))*I,r[1]=(f+T)*I,r[2]=(l-M)*I,r[3]=0,r[4]=(f-T)*S,r[5]=(1-(p+g))*S,r[6]=(b+x)*S,r[7]=0,r[8]=(l+M)*R,r[9]=(b-x)*R,r[10]=(1-(p+y))*R,r[11]=0,r[12]=e[0],r[13]=e[1],r[14]=e[2],r[15]=1,r}};function Ju(t,e){if(!!t!=!!e)return!1;let a=t.getChild(),s=e.getChild();return a===s||a.equals(s)}function Qu(t,e){if(!!t!=!!e)return!1;let a=t.values(),s=e.values();if(a.length!==s.length)return!1;for(let n=0;n<a.length;n++){let r=a[n],i=s[n];if(r.getChild()!==i.getChild()&&!r.getChild().equals(i.getChild()))return!1}return!0}function Zu(t,e){if(!!t!=!!e)return!1;let a=t.keys(),s=e.keys();if(a.length!==s.length)return!1;for(let n of a){let r=t.get(n),i=e.get(n);if(!!r!=!!i)return!1;let o=r.getChild(),c=i.getChild();if(o!==c&&!o.equals(c))return!1}return!0}function ro(t,e){if(t===e)return!0;if(!!t!=!!e||!t||!e||t.length!==e.length)return!1;for(let a=0;a<t.length;a++)if(t[a]!==e[a])return!1;return!0}function io(t,e){if(t===e)return!0;if(!!t!=!!e)return!1;if(!Wt(t)||!Wt(e))return t===e;let a=t,s=e,n=0,r=0,i;for(i in a)n++;for(i in s)r++;if(n!==r)return!1;for(i in a){let o=a[i],c=s[i];if(Ms(o)&&Ms(c)){if(!ro(o,c))return!1}else if(Wt(o)&&Wt(c)){if(!io(o,c))return!1}else if(o!==c)return!1}return!0}function Ms(t){return Array.isArray(t)||ArrayBuffer.isView(t)}var ef="23456789abdegjkmnpqrvwxyzABDEGJKMNPQRVWXYZ",tf=999,af=6,Yi=new Set,sf=function(){let t="";for(let e=0;e<af;e++)t+=ef.charAt(Math.floor(Math.random()*42));return t},nf=function(){for(let t=0;t<tf;t++){let e=sf();if(!Yi.has(e))return Yi.add(e),e}return""},wt=t=>t,rf=new Set,sr=class extends qi{constructor(t,e=""){super(t),this[Q].name=e,this.init(),this.dispatchEvent({type:"create"})}getGraph(){return this.graph}getDefaults(){return Object.assign(super.getDefaults(),{name:"",extras:{}})}set(t,e){return Array.isArray(e)&&(e=e.slice()),super.set(t,e)}getName(){return this.get("name")}setName(t){return this.set("name",t)}getExtras(){return this.get("extras")}setExtras(t){return this.set("extras",t)}clone(){let t=this.constructor;return new t(this.graph).copy(this,wt)}copy(t,e=wt){for(let a in this[Q]){let s=this[Q][a];if(s instanceof yt)this[gt].has(a)||s.dispose();else if(s instanceof xe||s instanceof se)for(let n of s.values())n.dispose();else if(s instanceof ue)for(let n of s.values())n.dispose()}for(let a in t[Q]){let s=this[Q][a],n=t[Q][a];if(n instanceof yt)this[gt].has(a)?s.getChild().copy(e(n.getChild()),e):this.setRef(a,e(n.getChild()),n.getAttributes());else if(n instanceof se||n instanceof xe)for(let r of n.values())this.addRef(a,e(r.getChild()),r.getAttributes());else if(n instanceof ue)for(let r of n.keys()){let i=n.get(r);this.setRefMap(a,r,e(i.getChild()),i.getAttributes())}else Wt(n)?this[Q][a]=JSON.parse(JSON.stringify(n)):Array.isArray(n)||n instanceof ArrayBuffer||ArrayBuffer.isView(n)?this[Q][a]=n.slice():this[Q][a]=n}return this}equals(t,e=rf){if(this===t)return!0;if(this.propertyType!==t.propertyType)return!1;for(let a in this[Q]){if(e.has(a))continue;let s=this[Q][a],n=t[Q][a];if(s instanceof yt||n instanceof yt){if(!Ju(s,n))return!1}else if(s instanceof se||n instanceof se||s instanceof xe||n instanceof xe){if(!Qu(s,n))return!1}else if(s instanceof ue||n instanceof ue){if(!Zu(s,n))return!1}else if(Wt(s)||Wt(n)){if(!io(s,n))return!1}else if(Ms(s)||Ms(n)){if(!ro(s,n))return!1}else if(s!==n)return!1}return!0}detach(){return this.graph.disconnectParents(this,t=>t.propertyType!=="Root"),this}listParents(){return this.graph.listParents(this)}},ke=class extends sr{getDefaults(){return Object.assign(super.getDefaults(),{extensions:new ue})}getExtension(t){return this.getRefMap("extensions",t)}setExtension(t,e){return e&&e._validateParent(this),this.setRefMap("extensions",t,e)}listExtensions(){return this.listRefMapValues("extensions")}},U=class fe extends ke{static Type={SCALAR:"SCALAR",VEC2:"VEC2",VEC3:"VEC3",VEC4:"VEC4",MAT2:"MAT2",MAT3:"MAT3",MAT4:"MAT4"};static ComponentType={BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,FLOAT:5126,FLOAT16:5131,FLOAT64:5130};init(){this.propertyType="Accessor"}getDefaults(){return Object.assign(super.getDefaults(),{array:null,type:fe.Type.SCALAR,componentType:fe.ComponentType.FLOAT,normalized:!1,sparse:!1,buffer:null})}static getElementSize(e){switch(e){case fe.Type.SCALAR:return 1;case fe.Type.VEC2:return 2;case fe.Type.VEC3:return 3;case fe.Type.VEC4:return 4;case fe.Type.MAT2:return 4;case fe.Type.MAT3:return 9;case fe.Type.MAT4:return 16;default:throw new Error("Unexpected type: "+e)}}static getComponentSize(e){switch(e){case fe.ComponentType.BYTE:case fe.ComponentType.UNSIGNED_BYTE:return 1;case fe.ComponentType.SHORT:case fe.ComponentType.UNSIGNED_SHORT:return 2;case fe.ComponentType.UNSIGNED_INT:case fe.ComponentType.FLOAT:return 4;case fe.ComponentType.FLOAT16:return 2;case fe.ComponentType.FLOAT64:return 8;default:throw new Error("Unexpected component type: "+e)}}getMinNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),n=this.getComponentType();if(this.getMin(e),a)for(let r=0;r<s;r++)e[r]=ie.decodeNormalizedInt(e[r],n);return e}getMin(e){let a=this.getArray(),s=this.getCount(),n=this.getElementSize();for(let r=0;r<n;r++)e[r]=1/0;for(let r=0;r<s*n;r+=n)for(let i=0;i<n;i++){let o=a[r+i];Number.isFinite(o)&&(e[i]=Math.min(e[i],o))}return e}getMaxNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),n=this.getComponentType();if(this.getMax(e),a)for(let r=0;r<s;r++)e[r]=ie.decodeNormalizedInt(e[r],n);return e}getMax(e){let a=this.get("array"),s=this.getCount(),n=this.getElementSize();for(let r=0;r<n;r++)e[r]=-1/0;for(let r=0;r<s*n;r+=n)for(let i=0;i<n;i++){let o=a[r+i];Number.isFinite(o)&&(e[i]=Math.max(e[i],o))}return e}getCount(){let e=this.get("array");return e?e.length/this.getElementSize():0}getType(){return this.get("type")}setType(e){return this.set("type",e)}getElementSize(){return fe.getElementSize(this.get("type"))}getComponentSize(){return this.get("array").BYTES_PER_ELEMENT}getComponentType(){return this.get("componentType")}getNormalized(){return this.get("normalized")}setNormalized(e){return this.set("normalized",e)}getScalar(e){let a=this.getElementSize(),s=this.getComponentType(),n=this.getArray();return this.getNormalized()?ie.decodeNormalizedInt(n[e*a],s):n[e*a]}setScalar(e,a){let s=this.getElementSize(),n=this.getComponentType(),r=this.getArray();return this.getNormalized()?r[e*s]=ie.encodeNormalizedInt(a,n):r[e*s]=a,this}getElement(e,a){let s=this.getNormalized(),n=this.getElementSize(),r=this.getComponentType(),i=this.getArray();for(let o=0;o<n;o++)s?a[o]=ie.decodeNormalizedInt(i[e*n+o],r):a[o]=i[e*n+o];return a}setElement(e,a){let s=this.getNormalized(),n=this.getElementSize(),r=this.getComponentType(),i=this.getArray();for(let o=0;o<n;o++)s?i[e*n+o]=ie.encodeNormalizedInt(a[o],r):i[e*n+o]=a[o];return this}getSparse(){return this.get("sparse")}setSparse(e){return this.set("sparse",e)}getBuffer(){return this.getRef("buffer")}setBuffer(e){return this.setRef("buffer",e)}getArray(){return this.get("array")}setArray(e){return this.set("componentType",e?of(e):fe.ComponentType.FLOAT),this.set("array",e),this}getByteLength(){let e=this.get("array");return e?e.byteLength:0}};function of(t){switch(t.constructor){case Float32Array:return U.ComponentType.FLOAT;case Uint32Array:return U.ComponentType.UNSIGNED_INT;case Uint16Array:return U.ComponentType.UNSIGNED_SHORT;case Uint8Array:return U.ComponentType.UNSIGNED_BYTE;case Int16Array:return U.ComponentType.SHORT;case Int8Array:return U.ComponentType.BYTE;case Float64Array:return U.ComponentType.FLOAT64}if(typeof Float16Array<"u"&&t.constructor===Float16Array)return U.ComponentType.FLOAT16;throw new Error("Unknown accessor componentType.")}var oo=class extends ke{init(){this.propertyType="Animation"}getDefaults(){return Object.assign(super.getDefaults(),{channels:new se,samplers:new se})}addChannel(t){return this.addRef("channels",t)}removeChannel(t){return this.removeRef("channels",t)}listChannels(){return this.listRefs("channels")}addSampler(t){return this.addRef("samplers",t)}removeSampler(t){return this.removeRef("samplers",t)}listSamplers(){return this.listRefs("samplers")}},nr=class extends ke{static TargetPath={TRANSLATION:"translation",ROTATION:"rotation",SCALE:"scale",WEIGHTS:"weights"};init(){this.propertyType="AnimationChannel"}getDefaults(){return Object.assign(super.getDefaults(),{targetPath:null,targetNode:null,sampler:null})}getTargetPath(){return this.get("targetPath")}setTargetPath(t){return this.set("targetPath",t)}getTargetNode(){return this.getRef("targetNode")}setTargetNode(t){return this.setRef("targetNode",t)}getSampler(){return this.getRef("sampler")}setSampler(t){return this.setRef("sampler",t)}},Is=class co extends ke{static Interpolation={LINEAR:"LINEAR",STEP:"STEP",CUBICSPLINE:"CUBICSPLINE"};init(){this.propertyType="AnimationSampler"}getDefaultAttributes(){return Object.assign(super.getDefaults(),{interpolation:co.Interpolation.LINEAR,input:null,output:null})}getInterpolation(){return this.get("interpolation")}setInterpolation(e){return this.set("interpolation",e)}getInput(){return this.getRef("input")}setInput(e){return this.setRef("input",e,{usage:"OTHER"})}getOutput(){return this.getRef("output")}setOutput(e){return this.setRef("output",e,{usage:"OTHER"})}},lo=class extends ke{init(){this.propertyType="Buffer"}getDefaults(){return Object.assign(super.getDefaults(),{uri:""})}getURI(){return this.get("uri")}setURI(t){return this.set("uri",t)}},Ss=class uo extends ke{static Type={PERSPECTIVE:"perspective",ORTHOGRAPHIC:"orthographic"};init(){this.propertyType="Camera"}getDefaults(){return Object.assign(super.getDefaults(),{type:uo.Type.PERSPECTIVE,znear:.1,zfar:100,aspectRatio:null,yfov:Math.PI*2*50/360,xmag:1,ymag:1})}getType(){return this.get("type")}setType(e){return this.set("type",e)}getZNear(){return this.get("znear")}setZNear(e){return this.set("znear",e)}getZFar(){return this.get("zfar")}setZFar(e){return this.set("zfar",e)}getAspectRatio(){return this.get("aspectRatio")}setAspectRatio(e){return this.set("aspectRatio",e)}getYFov(){return this.get("yfov")}setYFov(e){return this.set("yfov",e)}getXMag(){return this.get("xmag")}setXMag(e){return this.set("xmag",e)}getYMag(){return this.get("ymag")}setYMag(e){return this.set("ymag",e)}},X=class extends sr{static EXTENSION_NAME;_validateParent(t){if(!this.parentTypes.includes(t.propertyType))throw new Error(`Parent "${t.propertyType}" invalid for child "${this.propertyType}".`)}},ne=class tr extends ke{static WrapMode={CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497};static MagFilter={NEAREST:9728,LINEAR:9729};static MinFilter={NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987};init(){this.propertyType="TextureInfo"}getDefaults(){return Object.assign(super.getDefaults(),{texCoord:0,magFilter:null,minFilter:null,wrapS:tr.WrapMode.REPEAT,wrapT:tr.WrapMode.REPEAT})}getTexCoord(){return this.get("texCoord")}setTexCoord(e){return this.set("texCoord",e)}getMagFilter(){return this.get("magFilter")}setMagFilter(e){return this.set("magFilter",e)}getMinFilter(){return this.get("minFilter")}setMinFilter(e){return this.set("minFilter",e)}getWrapS(){return this.get("wrapS")}setWrapS(e){return this.set("wrapS",e)}getWrapT(){return this.get("wrapT")}setWrapT(e){return this.set("wrapT",e)}},{R:gs,G:ys,B:xs,A:cf}=Xe,Es=class fo extends ke{static AlphaMode={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};init(){this.propertyType="Material"}getDefaults(){return Object.assign(super.getDefaults(),{alphaMode:fo.AlphaMode.OPAQUE,alphaCutoff:.5,doubleSided:!1,baseColorFactor:[1,1,1,1],baseColorTexture:null,baseColorTextureInfo:new ne(this.graph,"baseColorTextureInfo"),emissiveFactor:[0,0,0],emissiveTexture:null,emissiveTextureInfo:new ne(this.graph,"emissiveTextureInfo"),normalScale:1,normalTexture:null,normalTextureInfo:new ne(this.graph,"normalTextureInfo"),occlusionStrength:1,occlusionTexture:null,occlusionTextureInfo:new ne(this.graph,"occlusionTextureInfo"),roughnessFactor:1,metallicFactor:1,metallicRoughnessTexture:null,metallicRoughnessTextureInfo:new ne(this.graph,"metallicRoughnessTextureInfo")})}getDoubleSided(){return this.get("doubleSided")}setDoubleSided(e){return this.set("doubleSided",e)}getAlpha(){return this.get("baseColorFactor")[3]}setAlpha(e){let a=this.get("baseColorFactor").slice();return a[3]=e,this.set("baseColorFactor",a)}getAlphaMode(){return this.get("alphaMode")}setAlphaMode(e){return this.set("alphaMode",e)}getAlphaCutoff(){return this.get("alphaCutoff")}setAlphaCutoff(e){return this.set("alphaCutoff",e)}getBaseColorFactor(){return this.get("baseColorFactor")}setBaseColorFactor(e){return this.set("baseColorFactor",e)}getBaseColorTexture(){return this.getRef("baseColorTexture")}getBaseColorTextureInfo(){return this.getRef("baseColorTexture")?this.getRef("baseColorTextureInfo"):null}setBaseColorTexture(e){return this.setRef("baseColorTexture",e,{channels:gs|ys|xs|cf,isColor:!0})}getEmissiveFactor(){return this.get("emissiveFactor")}setEmissiveFactor(e){return this.set("emissiveFactor",e)}getEmissiveTexture(){return this.getRef("emissiveTexture")}getEmissiveTextureInfo(){return this.getRef("emissiveTexture")?this.getRef("emissiveTextureInfo"):null}setEmissiveTexture(e){return this.setRef("emissiveTexture",e,{channels:gs|ys|xs,isColor:!0})}getNormalScale(){return this.get("normalScale")}setNormalScale(e){return this.set("normalScale",e)}getNormalTexture(){return this.getRef("normalTexture")}getNormalTextureInfo(){return this.getRef("normalTexture")?this.getRef("normalTextureInfo"):null}setNormalTexture(e){return this.setRef("normalTexture",e,{channels:gs|ys|xs})}getOcclusionStrength(){return this.get("occlusionStrength")}setOcclusionStrength(e){return this.set("occlusionStrength",e)}getOcclusionTexture(){return this.getRef("occlusionTexture")}getOcclusionTextureInfo(){return this.getRef("occlusionTexture")?this.getRef("occlusionTextureInfo"):null}setOcclusionTexture(e){return this.setRef("occlusionTexture",e,{channels:gs})}getRoughnessFactor(){return this.get("roughnessFactor")}setRoughnessFactor(e){return this.set("roughnessFactor",e)}getMetallicFactor(){return this.get("metallicFactor")}setMetallicFactor(e){return this.set("metallicFactor",e)}getMetallicRoughnessTexture(){return this.getRef("metallicRoughnessTexture")}getMetallicRoughnessTextureInfo(){return this.getRef("metallicRoughnessTexture")?this.getRef("metallicRoughnessTextureInfo"):null}setMetallicRoughnessTexture(e){return this.setRef("metallicRoughnessTexture",e,{channels:ys|xs})}},ho=class extends ke{init(){this.propertyType="Mesh"}getDefaults(){return Object.assign(super.getDefaults(),{weights:[],primitives:new se})}addPrimitive(t){return this.addRef("primitives",t)}removePrimitive(t){return this.removeRef("primitives",t)}listPrimitives(){return this.listRefs("primitives")}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}},bo=class extends ke{init(){this.propertyType="Node"}getDefaults(){return Object.assign(super.getDefaults(),{translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1],weights:[],camera:null,mesh:null,skin:null,children:new se})}copy(t,e=wt){if(e===wt)throw new Error("Node cannot be copied.");return super.copy(t,e)}getTranslation(){return this.get("translation")}getRotation(){return this.get("rotation")}getScale(){return this.get("scale")}setTranslation(t){return this.set("translation",t)}setRotation(t){return this.set("rotation",t)}setScale(t){return this.set("scale",t)}getMatrix(){return ie.compose(this.get("translation"),this.get("rotation"),this.get("scale"),[])}setMatrix(t){let e=this.get("translation").slice(),a=this.get("rotation").slice(),s=this.get("scale").slice();return ie.decompose(t,e,a,s),this.set("translation",e).set("rotation",a).set("scale",s)}getWorldTranslation(){let t=[0,0,0];return ie.decompose(this.getWorldMatrix(),t,[0,0,0,1],[1,1,1]),t}getWorldRotation(){let t=[0,0,0,1];return ie.decompose(this.getWorldMatrix(),[0,0,0],t,[1,1,1]),t}getWorldScale(){let t=[1,1,1];return ie.decompose(this.getWorldMatrix(),[0,0,0],[0,0,0,1],t),t}getWorldMatrix(){let t=[];for(let s=this;s!=null;s=s.getParentNode())t.push(s);let e,a=t.pop().getMatrix();for(;e=t.pop();)Wu(a,a,e.getMatrix());return a}addChild(t){let e=t.getParentNode();e&&e.removeChild(t);for(let a of t.listParents())a.propertyType==="Scene"&&a.removeChild(t);return this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}getParentNode(){for(let t of this.listParents())if(t.propertyType==="Node")return t;return null}getMesh(){return this.getRef("mesh")}setMesh(t){return this.setRef("mesh",t)}getCamera(){return this.getRef("camera")}setCamera(t){return this.setRef("camera",t)}getSkin(){return this.getRef("skin")}setSkin(t){return this.setRef("skin",t)}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}traverse(t){t(this);for(let e of this.listChildren())e.traverse(t);return this}},ja=class po extends ke{static Mode={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6};init(){this.propertyType="Primitive"}getDefaults(){return Object.assign(super.getDefaults(),{mode:po.Mode.TRIANGLES,material:null,indices:null,attributes:new ue,targets:new se})}getIndices(){return this.getRef("indices")}setIndices(e){return this.setRef("indices",e,{usage:"ELEMENT_ARRAY_BUFFER"})}getAttribute(e){return this.getRefMap("attributes",e)}setAttribute(e,a){return this.setRefMap("attributes",e,a,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}getMaterial(){return this.getRef("material")}setMaterial(e){return this.setRef("material",e)}getMode(){return this.get("mode")}setMode(e){return this.set("mode",e)}listTargets(){return this.listRefs("targets")}addTarget(e){return this.addRef("targets",e)}removeTarget(e){return this.removeRef("targets",e)}},lf=class extends sr{init(){this.propertyType="PrimitiveTarget"}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},mo=class extends ke{init(){this.propertyType="Scene"}getDefaults(){return Object.assign(super.getDefaults(),{children:new se})}copy(t,e=wt){if(e===wt)throw new Error("Scene cannot be copied.");return super.copy(t,e)}addChild(t){let e=t.getParentNode();return e&&e.removeChild(t),this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}traverse(t){for(let e of this.listChildren())e.traverse(t);return this}},go=class extends ke{init(){this.propertyType="Skin"}getDefaults(){return Object.assign(super.getDefaults(),{skeleton:null,inverseBindMatrices:null,joints:new se})}getSkeleton(){return this.getRef("skeleton")}setSkeleton(t){return this.setRef("skeleton",t)}getInverseBindMatrices(){return this.getRef("inverseBindMatrices")}setInverseBindMatrices(t){return this.setRef("inverseBindMatrices",t,{usage:"INVERSE_BIND_MATRICES"})}addJoint(t){return this.addRef("joints",t)}removeJoint(t){return this.removeRef("joints",t)}listJoints(){return this.listRefs("joints")}},yo=class extends ke{init(){this.propertyType="Texture"}getDefaults(){return Object.assign(super.getDefaults(),{image:null,mimeType:"",uri:""})}getMimeType(){return this.get("mimeType")||tt.extensionToMimeType(la.extension(this.get("uri")))}setMimeType(t){return this.set("mimeType",t)}getURI(){return this.get("uri")}setURI(t){this.set("uri",t);let e=tt.extensionToMimeType(la.extension(t));return e&&this.set("mimeType",e),this}getImage(){return this.get("image")}setImage(t){return this.set("image",H.assertView(t))}getSize(){let t=this.get("image");return t?tt.getSize(t,this.getMimeType()):null}},rr=class extends ke{_extensions=new Set;init(){this.propertyType="Root"}getDefaults(){return Object.assign(super.getDefaults(),{asset:{generator:`glTF-Transform ${eo}`,version:"2.0"},defaultScene:null,accessors:new se,animations:new se,buffers:new se,cameras:new se,materials:new se,meshes:new se,nodes:new se,scenes:new se,skins:new se,textures:new se})}constructor(t){super(t),t.addEventListener("node:create",e=>{this._addChildOfRoot(e.target)})}clone(){throw new Error("Root cannot be cloned.")}copy(t,e=wt){if(e===wt)throw new Error("Root cannot be copied.");this.set("asset",{...t.get("asset")}),this.setName(t.getName()),this.setExtras({...t.getExtras()}),this.setDefaultScene(t.getDefaultScene()?e(t.getDefaultScene()):null);for(let a of t.listRefMapKeys("extensions")){let s=t.getExtension(a);this.setExtension(a,e(s))}return this}_addChildOfRoot(t){return t instanceof mo?this.addRef("scenes",t):t instanceof bo?this.addRef("nodes",t):t instanceof Ss?this.addRef("cameras",t):t instanceof go?this.addRef("skins",t):t instanceof ho?this.addRef("meshes",t):t instanceof Es?this.addRef("materials",t):t instanceof yo?this.addRef("textures",t):t instanceof oo?this.addRef("animations",t):t instanceof U?this.addRef("accessors",t):t instanceof lo&&this.addRef("buffers",t),this}getAsset(){return this.get("asset")}listExtensionsUsed(){return Array.from(this._extensions)}listExtensionsRequired(){return this.listExtensionsUsed().filter(t=>t.isRequired())}_enableExtension(t){return this._extensions.add(t),this}_disableExtension(t){return this._extensions.delete(t),this}listScenes(){return this.listRefs("scenes")}setDefaultScene(t){return this.setRef("defaultScene",t)}getDefaultScene(){return this.getRef("defaultScene")}listNodes(){return this.listRefs("nodes")}listCameras(){return this.listRefs("cameras")}listSkins(){return this.listRefs("skins")}listMeshes(){return this.listRefs("meshes")}listMaterials(){return this.listRefs("materials")}listTextures(){return this.listRefs("textures")}listAnimations(){return this.listRefs("animations")}listAccessors(){return this.listRefs("accessors")}listBuffers(){return this.listRefs("buffers")}},df=class ar{_graph=new Yn;_root=new rr(this._graph);_logger=ks.DEFAULT_INSTANCE;static _GRAPH_DOCUMENTS=new WeakMap;static fromGraph(e){return ar._GRAPH_DOCUMENTS.get(e)||null}constructor(){ar._GRAPH_DOCUMENTS.set(this._graph,this)}getRoot(){return this._root}getGraph(){return this._graph}getLogger(){return this._logger}setLogger(e){return this._logger=e,this}clone(){throw new Error("Use 'cloneDocument(source)' from '@gltf-transform/functions'.")}merge(e){throw new Error("Use 'mergeDocuments(target, source)' from '@gltf-transform/functions'.")}async transform(...e){let a=e.map(s=>s.name);for(let s of e)await s(this,{stack:a});return this}hasExtension(e){return this.getRoot().listExtensionsUsed().some(a=>a.extensionName===e)}createExtension(e){let a=e.EXTENSION_NAME;return this.getRoot().listExtensionsUsed().find(s=>s.extensionName===a)||new e(this)}disposeExtension(e){let a=this.getRoot().listExtensionsUsed().find(s=>s.extensionName===e);a&&a.dispose()}createScene(e=""){return new mo(this._graph,e)}createNode(e=""){return new bo(this._graph,e)}createCamera(e=""){return new Ss(this._graph,e)}createSkin(e=""){return new go(this._graph,e)}createMesh(e=""){return new ho(this._graph,e)}createPrimitive(){return new ja(this._graph)}createPrimitiveTarget(e=""){return new lf(this._graph,e)}createMaterial(e=""){return new Es(this._graph,e)}createTexture(e=""){return new yo(this._graph,e)}createAnimation(e=""){return new oo(this._graph,e)}createAnimationChannel(e=""){return new nr(this._graph,e)}createAnimationSampler(e=""){return new Is(this._graph,e)}createAccessor(e="",a=null){return a||(a=this.getRoot().listBuffers()[0]),new U(this._graph,e).setBuffer(a)}createBuffer(e=""){return new lo(this._graph,e)}},te=class{static EXTENSION_NAME;extensionName="";prereadTypes=[];prewriteTypes=[];readDependencies=[];writeDependencies=[];document;required=!1;properties=new Set;_listener;constructor(t){this.document=t,t.getRoot()._enableExtension(this),this._listener=a=>{let s=a,n=s.target;n instanceof X&&n.extensionName===this.extensionName&&(s.type==="node:create"&&this._addExtensionProperty(n),s.type==="node:dispose"&&this._removeExtensionProperty(n))};let e=t.getGraph();e.addEventListener("node:create",this._listener),e.addEventListener("node:dispose",this._listener)}dispose(){this.document.getRoot()._disableExtension(this);let t=this.document.getGraph();t.removeEventListener("node:create",this._listener),t.removeEventListener("node:dispose",this._listener);for(let e of this.properties)e.dispose()}static register(){}isRequired(){return this.required}setRequired(t){return this.required=t,this}listProperties(){return Array.from(this.properties)}_addExtensionProperty(t){return this.properties.add(t),this}_removeExtensionProperty(t){return this.properties.delete(t),this}install(t,e){return this}preread(t,e){return this}prewrite(t,e){return this}},uf=class{jsonDoc;buffers=[];bufferViews=[];bufferViewBuffers=[];accessors=[];textures=[];textureInfos=new Map;materials=[];meshes=[];cameras=[];nodes=[];skins=[];animations=[];scenes=[];constructor(t){this.jsonDoc=t}setTextureInfo(t,e){this.textureInfos.set(t,e),e.texCoord!==void 0&&t.setTexCoord(e.texCoord),e.extras!==void 0&&t.setExtras(e.extras);let a=this.jsonDoc.json.textures[e.index];if(a.sampler===void 0)return;let s=this.jsonDoc.json.samplers[a.sampler];s.magFilter!==void 0&&t.setMagFilter(s.magFilter),s.minFilter!==void 0&&t.setMinFilter(s.minFilter),s.wrapS!==void 0&&t.setWrapS(s.wrapS),s.wrapT!==void 0&&t.setWrapT(s.wrapT)}},Ji={logger:ks.DEFAULT_INSTANCE,extensions:[],dependencies:{}},ff=new Set(["Buffer","Texture","Material","Mesh","Primitive","Node","Scene"]),hf=class{static read(t,e=Ji){let a={...Ji,...e},{json:s}=t,n=new df().setLogger(a.logger);this.validate(t,a);let r=new uf(t),i=s.asset,o=n.getRoot().getAsset();i.copyright&&(o.copyright=i.copyright),i.extras&&(o.extras=i.extras),s.extras!==void 0&&n.getRoot().setExtras({...s.extras});let c=s.extensionsUsed||[],d=s.extensionsRequired||[];a.extensions.sort((b,g)=>b.EXTENSION_NAME>g.EXTENSION_NAME?1:-1);for(let b of a.extensions)if(c.includes(b.EXTENSION_NAME)){let g=n.createExtension(b).setRequired(d.includes(b.EXTENSION_NAME)),x=g.prereadTypes.filter(M=>!ff.has(M));x.length&&a.logger.warn(`Preread hooks for some types (${x.join()}), requested by extension ${g.extensionName}, are unsupported. Please file an issue or a PR.`);for(let M of g.readDependencies)g.install(M,a.dependencies[M])}let h=s.buffers||[];n.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Buffer")).forEach(b=>b.preread(r,"Buffer")),r.buffers=h.map(b=>{let g=n.createBuffer(b.name);return b.extras&&g.setExtras(b.extras),b.uri&&b.uri.indexOf("__")!==0&&g.setURI(b.uri),g}),r.bufferViewBuffers=(s.bufferViews||[]).map((b,g)=>{if(!r.bufferViews[g]){let x=t.json.buffers[b.buffer],M=x.uri?t.resources[x.uri]:t.resources[vt],T=b.byteOffset||0;r.bufferViews[g]=H.toView(M,T,b.byteLength)}return r.buffers[b.buffer]});let u=s.accessors||[];r.accessors=u.map(b=>{let g=r.bufferViewBuffers[b.bufferView],x=n.createAccessor(b.name,g).setType(b.type);return b.extras&&x.setExtras(b.extras),b.normalized!==void 0&&x.setNormalized(b.normalized),b.bufferView===void 0||x.setArray(ws(b,r)),x});let m=s.images||[],p=s.textures||[];n.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Texture")).forEach(b=>b.preread(r,"Texture")),r.textures=m.map(b=>{let g=n.createTexture(b.name);if(b.extras&&g.setExtras(b.extras),b.bufferView!==void 0){let x=s.bufferViews[b.bufferView],M=t.json.buffers[x.buffer],T=M.uri?t.resources[M.uri]:t.resources[vt],I=x.byteOffset||0,S=x.byteLength,R=T.slice(I,I+S);g.setImage(R)}else b.uri!==void 0&&(g.setImage(t.resources[b.uri]),b.uri.indexOf("__")!==0&&g.setURI(b.uri));if(b.mimeType!==void 0)g.setMimeType(b.mimeType);else if(b.uri){let x=la.extension(b.uri);g.setMimeType(tt.extensionToMimeType(x))}return g}),n.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Material")).forEach(b=>b.preread(r,"Material")),r.materials=(s.materials||[]).map(b=>{let g=n.createMaterial(b.name);b.extras&&g.setExtras(b.extras),b.alphaMode!==void 0&&g.setAlphaMode(b.alphaMode),b.alphaCutoff!==void 0&&g.setAlphaCutoff(b.alphaCutoff),b.doubleSided!==void 0&&g.setDoubleSided(b.doubleSided);let x=b.pbrMetallicRoughness||{};if(x.baseColorFactor!==void 0&&g.setBaseColorFactor(x.baseColorFactor),b.emissiveFactor!==void 0&&g.setEmissiveFactor(b.emissiveFactor),x.metallicFactor!==void 0&&g.setMetallicFactor(x.metallicFactor),x.roughnessFactor!==void 0&&g.setRoughnessFactor(x.roughnessFactor),x.baseColorTexture!==void 0){let M=x.baseColorTexture,T=r.textures[p[M.index].source];g.setBaseColorTexture(T),r.setTextureInfo(g.getBaseColorTextureInfo(),M)}if(b.emissiveTexture!==void 0){let M=b.emissiveTexture,T=r.textures[p[M.index].source];g.setEmissiveTexture(T),r.setTextureInfo(g.getEmissiveTextureInfo(),M)}if(b.normalTexture!==void 0){let M=b.normalTexture,T=r.textures[p[M.index].source];g.setNormalTexture(T),r.setTextureInfo(g.getNormalTextureInfo(),M),b.normalTexture.scale!==void 0&&g.setNormalScale(b.normalTexture.scale)}if(b.occlusionTexture!==void 0){let M=b.occlusionTexture,T=r.textures[p[M.index].source];g.setOcclusionTexture(T),r.setTextureInfo(g.getOcclusionTextureInfo(),M),b.occlusionTexture.strength!==void 0&&g.setOcclusionStrength(b.occlusionTexture.strength)}if(x.metallicRoughnessTexture!==void 0){let M=x.metallicRoughnessTexture,T=r.textures[p[M.index].source];g.setMetallicRoughnessTexture(T),r.setTextureInfo(g.getMetallicRoughnessTextureInfo(),M)}return g}),n.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Mesh")).forEach(b=>b.preread(r,"Mesh"));let f=s.meshes||[];n.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Primitive")).forEach(b=>b.preread(r,"Primitive")),r.meshes=f.map(b=>{let g=n.createMesh(b.name);return b.extras&&g.setExtras(b.extras),b.weights!==void 0&&g.setWeights(b.weights),(b.primitives||[]).forEach(x=>{let M=n.createPrimitive();x.extras&&M.setExtras(x.extras),x.material!==void 0&&M.setMaterial(r.materials[x.material]),x.mode!==void 0&&M.setMode(x.mode);for(let[I,S]of Object.entries(x.attributes||{}))M.setAttribute(I,r.accessors[S]);x.indices!==void 0&&M.setIndices(r.accessors[x.indices]);let T=b.extras&&b.extras.targetNames||[];(x.targets||[]).forEach((I,S)=>{let R=T[S]||S.toString(),A=n.createPrimitiveTarget(R);for(let[_,j]of Object.entries(I))A.setAttribute(_,r.accessors[j]);M.addTarget(A)}),g.addPrimitive(M)}),g}),r.cameras=(s.cameras||[]).map(b=>{let g=n.createCamera(b.name).setType(b.type);if(b.extras&&g.setExtras(b.extras),b.type===Ss.Type.PERSPECTIVE){let x=b.perspective;g.setYFov(x.yfov),g.setZNear(x.znear),x.zfar!==void 0&&g.setZFar(x.zfar),x.aspectRatio!==void 0&&g.setAspectRatio(x.aspectRatio)}else{let x=b.orthographic;g.setZNear(x.znear).setZFar(x.zfar).setXMag(x.xmag).setYMag(x.ymag)}return g});let l=s.nodes||[];n.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Node")).forEach(b=>b.preread(r,"Node")),r.nodes=l.map(b=>{let g=n.createNode(b.name);if(b.extras&&g.setExtras(b.extras),b.translation!==void 0&&g.setTranslation(b.translation),b.rotation!==void 0&&g.setRotation(b.rotation),b.scale!==void 0&&g.setScale(b.scale),b.matrix!==void 0){let x=[0,0,0],M=[0,0,0,1],T=[1,1,1];ie.decompose(b.matrix,x,M,T),g.setTranslation(x),g.setRotation(M),g.setScale(T)}return b.weights!==void 0&&g.setWeights(b.weights),g}),r.skins=(s.skins||[]).map(b=>{let g=n.createSkin(b.name);b.extras&&g.setExtras(b.extras),b.inverseBindMatrices!==void 0&&g.setInverseBindMatrices(r.accessors[b.inverseBindMatrices]),b.skeleton!==void 0&&g.setSkeleton(r.nodes[b.skeleton]);for(let x of b.joints)g.addJoint(r.nodes[x]);return g}),l.map((b,g)=>{let x=r.nodes[g];(b.children||[]).forEach(M=>x.addChild(r.nodes[M])),b.mesh!==void 0&&x.setMesh(r.meshes[b.mesh]),b.camera!==void 0&&x.setCamera(r.cameras[b.camera]),b.skin!==void 0&&x.setSkin(r.skins[b.skin])}),r.animations=(s.animations||[]).map(b=>{let g=n.createAnimation(b.name);b.extras&&g.setExtras(b.extras);let x=(b.samplers||[]).map(M=>{let T=n.createAnimationSampler().setInput(r.accessors[M.input]).setOutput(r.accessors[M.output]).setInterpolation(M.interpolation||Is.Interpolation.LINEAR);return M.extras&&T.setExtras(M.extras),g.addSampler(T),T});return(b.channels||[]).forEach(M=>{let T=n.createAnimationChannel().setSampler(x[M.sampler]).setTargetPath(M.target.path);M.target.node!==void 0&&T.setTargetNode(r.nodes[M.target.node]),M.extras&&T.setExtras(M.extras),g.addChannel(T)}),g});let y=s.scenes||[];return n.getRoot().listExtensionsUsed().filter(b=>b.prereadTypes.includes("Scene")).forEach(b=>b.preread(r,"Scene")),r.scenes=y.map(b=>{let g=n.createScene(b.name);return b.extras&&g.setExtras(b.extras),(b.nodes||[]).map(x=>r.nodes[x]).forEach(x=>g.addChild(x)),g}),s.scene!==void 0&&n.getRoot().setDefaultScene(r.scenes[s.scene]),n.getRoot().listExtensionsUsed().forEach(b=>b.read(r)),u.forEach((b,g)=>{let x=r.accessors[g],M=!!b.sparse,T=!b.bufferView&&!x.getArray();(M||T)&&x.setSparse(!0).setArray(pf(b,r))}),n}static validate(t,e){let a=t.json;if(a.asset.version!=="2.0")throw new Error(`Unsupported glTF version, "${a.asset.version}".`);if(a.extensionsRequired){for(let s of a.extensionsRequired)if(!e.extensions.find(n=>n.EXTENSION_NAME===s))throw new Error(`Missing required extension, "${s}".`)}if(a.extensionsUsed)for(let s of a.extensionsUsed)e.extensions.find(n=>n.EXTENSION_NAME===s)||e.logger.warn(`Missing optional extension, "${s}".`)}};function bf(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],n=a.json.bufferViews[t.bufferView],r=Ts[t.componentType],i=U.getElementSize(t.type),o=r.BYTES_PER_ELEMENT,c=t.byteOffset||0,d=new r(t.count*i),h=new DataView(s.buffer,s.byteOffset,s.byteLength),u=n.byteStride;for(let m=0;m<t.count;m++)for(let p=0;p<i;p++){let f=c+m*u+p*o,l;switch(t.componentType){case U.ComponentType.FLOAT:l=h.getFloat32(f,!0);break;case U.ComponentType.UNSIGNED_INT:l=h.getUint32(f,!0);break;case U.ComponentType.UNSIGNED_SHORT:l=h.getUint16(f,!0);break;case U.ComponentType.UNSIGNED_BYTE:l=h.getUint8(f);break;case U.ComponentType.SHORT:l=h.getInt16(f,!0);break;case U.ComponentType.BYTE:l=h.getInt8(f);break;case U.ComponentType.FLOAT16:l=h.getFloat16(f,!0);break;case U.ComponentType.FLOAT64:l=h.getFloat64(f,!0);break;default:throw new Error(`Unexpected componentType "${t.componentType}".`)}d[m*i+p]=l}return d}function ws(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],n=a.json.bufferViews[t.bufferView],r=Ts[t.componentType],i=U.getElementSize(t.type),o=r.BYTES_PER_ELEMENT,c=i*o;if(n.byteStride!==void 0&&n.byteStride!==c)return bf(t,e);let d=s.byteOffset+(t.byteOffset||0),h=t.count*i*o;return new r(s.buffer.slice(d,d+h))}function pf(t,e){let a=Ts[t.componentType],s=U.getElementSize(t.type),n;t.bufferView!==void 0?n=ws(t,e):n=new a(t.count*s);let r=t.sparse;if(!r)return n;let i=r.count,o={...t,...r.indices,count:i,type:"SCALAR"},c={...t,...r.values,count:i},d=ws(o,e),h=ws(c,e);for(let u=0;u<o.count;u++)for(let m=0;m<s;m++)n[d[u]*s+m]=h[u*s+m];return n}var xo=(function(t){return t[t.ARRAY_BUFFER=34962]="ARRAY_BUFFER",t[t.ELEMENT_ARRAY_BUFFER=34963]="ELEMENT_ARRAY_BUFFER",t})(xo||{}),xt=class{_doc;jsonDoc;options;static BufferViewTarget=xo;static BufferViewUsage=Du;static USAGE_TO_TARGET={ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963};accessorIndexMap=new Map;animationIndexMap=new Map;bufferIndexMap=new Map;cameraIndexMap=new Map;skinIndexMap=new Map;materialIndexMap=new Map;meshIndexMap=new Map;nodeIndexMap=new Map;imageIndexMap=new Map;textureDefIndexMap=new Map;textureInfoDefMap=new Map;samplerDefIndexMap=new Map;sceneIndexMap=new Map;imageBufferViews=[];otherBufferViews=new Map;otherBufferViewsIndexMap=new Map;extensionData={};bufferURIGenerator;imageURIGenerator;logger;_accessorUsageMap=new Map;accessorUsageGroupedByParent=new Set(["ARRAY_BUFFER"]);accessorParents=new Map;constructor(t,e,a){this._doc=t,this.jsonDoc=e,this.options=a;let s=t.getRoot(),n=s.listBuffers().length,r=s.listTextures().length;this.bufferURIGenerator=new Qi(n>1,()=>a.basename||"buffer"),this.imageURIGenerator=new Qi(r>1,i=>mf(t,i)||a.basename||"texture"),this.logger=t.getLogger()}createTextureInfoDef(t,e){let a={magFilter:e.getMagFilter()||void 0,minFilter:e.getMinFilter()||void 0,wrapS:e.getWrapS(),wrapT:e.getWrapT()},s=JSON.stringify(a);this.samplerDefIndexMap.has(s)||(this.samplerDefIndexMap.set(s,this.jsonDoc.json.samplers.length),this.jsonDoc.json.samplers.push(a));let n={source:this.imageIndexMap.get(t),sampler:this.samplerDefIndexMap.get(s)},r=JSON.stringify(n);this.textureDefIndexMap.has(r)||(this.textureDefIndexMap.set(r,this.jsonDoc.json.textures.length),this.jsonDoc.json.textures.push(n));let i={index:this.textureDefIndexMap.get(r)};return e.getTexCoord()!==0&&(i.texCoord=e.getTexCoord()),Object.keys(e.getExtras()).length>0&&(i.extras=e.getExtras()),this.textureInfoDefMap.set(e,i),i}createPropertyDef(t){let e={};return t.getName()&&(e.name=t.getName()),Object.keys(t.getExtras()).length>0&&(e.extras=t.getExtras()),e}createAccessorDef(t){let e=this.createPropertyDef(t);return e.type=t.getType(),e.componentType=t.getComponentType(),e.count=t.getCount(),this._doc.getGraph().listParentEdges(t).some(a=>a.getName()==="attributes"&&a.getAttributes().key==="POSITION"||a.getName()==="input")&&(e.max=t.getMax([]).map(Math.fround),e.min=t.getMin([]).map(Math.fround)),t.getNormalized()&&(e.normalized=t.getNormalized()),e}createImageData(t,e,a){if(this.options.format==="GLB")this.imageBufferViews.push(e),t.bufferView=this.jsonDoc.json.bufferViews.length,this.jsonDoc.json.bufferViews.push({buffer:0,byteOffset:-1,byteLength:e.byteLength});else{let s=tt.mimeTypeToExtension(a.getMimeType());t.uri=this.imageURIGenerator.createURI(a,s),this.assignResourceURI(t.uri,e,!1)}}assignResourceURI(t,e,a){let s=this.jsonDoc.resources;if(!(t in s)){s[t]=e;return}if(e===s[t]){this.logger.warn(`Duplicate resource URI, "${t}".`);return}let n=`Resource URI "${t}" already assigned to different data.`;if(!a){this.logger.warn(n);return}throw new Error(n)}getAccessorUsage(t){let e=this._accessorUsageMap.get(t);if(e)return e;if(t.getSparse())return"SPARSE";for(let a of this._doc.getGraph().listParentEdges(t)){let{usage:s}=a.getAttributes();if(s)return s;a.getParent().propertyType!=="Root"&&this.logger.warn(`Missing attribute ".usage" on edge, "${a.getName()}".`)}return"OTHER"}addAccessorToUsageGroup(t,e){let a=this._accessorUsageMap.get(t);if(a&&a!==e)throw new Error(`Accessor with usage "${a}" cannot be reused as "${e}".`);return this._accessorUsageMap.set(t,e),this}},Qi=class{multiple;basename;counter={};constructor(t,e){this.multiple=t,this.basename=e}createURI(t,e){if(t.getURI())return t.getURI();if(this.multiple){let a=this.basename(t);return this.counter[a]=this.counter[a]||1,`${a}_${this.counter[a]++}.${e}`}else return`${this.basename(t)}.${e}`}};function mf(t,e){let a=t.getGraph().listParentEdges(e).find(s=>s.getParent()!==t.getRoot());return a?a.getName().replace(/texture$/i,""):""}var{BufferViewUsage:vs}=xt,{UNSIGNED_INT:gf,UNSIGNED_SHORT:yf,UNSIGNED_BYTE:xf}=U.ComponentType,vf=new Set(["Accessor","Buffer","Material","Mesh"]),wf=class{static write(t,e){let a=t.getGraph(),s=t.getRoot(),n={asset:{generator:`glTF-Transform ${eo}`,...s.getAsset()},extras:{...s.getExtras()}},r={json:n,resources:{}},i=new xt(t,r,e),o=e.logger||ks.DEFAULT_INSTANCE,c=new Set(e.extensions.map(l=>l.EXTENSION_NAME)),d=t.getRoot().listExtensionsUsed().filter(l=>c.has(l.extensionName)).sort((l,y)=>l.extensionName>y.extensionName?1:-1),h=t.getRoot().listExtensionsRequired().filter(l=>c.has(l.extensionName)).sort((l,y)=>l.extensionName>y.extensionName?1:-1);d.length<t.getRoot().listExtensionsUsed().length&&o.warn("Some extensions were not registered for I/O, and will not be written.");for(let l of d){let y=l.prewriteTypes.filter(b=>!vf.has(b));y.length&&o.warn(`Prewrite hooks for some types (${y.join()}), requested by extension ${l.extensionName}, are unsupported. Please file an issue or a PR.`);for(let b of l.writeDependencies)l.install(b,e.dependencies[b])}function u(l,y,b,g){let x=[],M=0;for(let I of l){let S=i.createAccessorDef(I);S.bufferView=n.bufferViews.length;let R=I.getArray(),A=H.pad(H.toView(R));S.byteOffset=M,M+=A.byteLength,x.push(A),i.accessorIndexMap.set(I,n.accessors.length),n.accessors.push(S)}let T={buffer:y,byteOffset:b,byteLength:H.concat(x).byteLength};return g&&(T.target=g),n.bufferViews.push(T),{buffers:x,byteLength:M}}function m(l,y,b){let g=l[0].getCount(),x=0;for(let R of l){let A=i.createAccessorDef(R);A.bufferView=n.bufferViews.length,A.byteOffset=x;let _=R.getElementSize(),j=R.getComponentSize();x+=H.padNumber(_*j),i.accessorIndexMap.set(R,n.accessors.length),n.accessors.push(A)}let M=g*x,T=new ArrayBuffer(M),I=new DataView(T);for(let R=0;R<g;R++){let A=0;for(let _ of l){let j=_.getElementSize(),L=_.getComponentSize(),F=_.getComponentType(),z=_.getArray();for(let W=0;W<j;W++){let ae=R*x+A+W*L,oe=z[R*j+W];switch(F){case U.ComponentType.FLOAT:I.setFloat32(ae,oe,!0);break;case U.ComponentType.BYTE:I.setInt8(ae,oe);break;case U.ComponentType.SHORT:I.setInt16(ae,oe,!0);break;case U.ComponentType.UNSIGNED_BYTE:I.setUint8(ae,oe);break;case U.ComponentType.UNSIGNED_SHORT:I.setUint16(ae,oe,!0);break;case U.ComponentType.UNSIGNED_INT:I.setUint32(ae,oe,!0);break;case U.ComponentType.FLOAT16:I.setFloat16(ae,oe,!0);break;case U.ComponentType.FLOAT64:I.setFloat64(ae,oe,!0);break;default:throw new Error("Unexpected component type: "+F)}}A+=H.padNumber(j*L)}}let S={buffer:y,byteOffset:b,byteLength:M,byteStride:x,target:xt.BufferViewTarget.ARRAY_BUFFER};return n.bufferViews.push(S),{byteLength:M,buffers:[new Uint8Array(T)]}}function p(l,y,b){let g=[],x=0,M=new Map,T=-1/0,I=!1;for(let F of l){let z=i.createAccessorDef(F);n.accessors.push(z),i.accessorIndexMap.set(F,n.accessors.length-1);let W=[],ae=[],oe=[],Oe=new Array(F.getElementSize()).fill(0);for(let Me=0,Ze=F.getCount();Me<Ze;Me++)if(F.getElement(Me,oe),!ie.eq(oe,Oe,0)){T=Math.max(Me,T),W.push(Me);for(let qe=0;qe<oe.length;qe++)ae.push(oe[qe])}let de=W.length,De={accessorDef:z,count:de};if(M.set(F,De),de===0)continue;de>F.getCount()/2&&(I=!0);let He=Ts[F.getComponentType()];De.indices=W,De.values=new He(ae)}if(!Number.isFinite(T))return{buffers:g,byteLength:x};I&&o.warn("Some sparse accessors have >50% non-zero elements, which may increase file size.");let S=T<255?Uint8Array:T<65535?Uint16Array:Uint32Array,R=T<255?xf:T<65535?yf:gf,A={buffer:y,byteOffset:b+x,byteLength:0};for(let F of l){let z=M.get(F);if(z.count===0)continue;z.indicesByteOffset=A.byteLength;let W=H.pad(H.toView(new S(z.indices)));g.push(W),x+=W.byteLength,A.byteLength+=W.byteLength}n.bufferViews.push(A);let _=n.bufferViews.length-1,j={buffer:y,byteOffset:b+x,byteLength:0};for(let F of l){let z=M.get(F);if(z.count===0)continue;z.valuesByteOffset=j.byteLength;let W=H.pad(H.toView(z.values));g.push(W),x+=W.byteLength,j.byteLength+=W.byteLength}n.bufferViews.push(j);let L=n.bufferViews.length-1;for(let F of l){let z=M.get(F);z.count!==0&&(z.accessorDef.sparse={count:z.count,indices:{bufferView:_,byteOffset:z.indicesByteOffset,componentType:R},values:{bufferView:L,byteOffset:z.valuesByteOffset}})}return{buffers:g,byteLength:x}}if(n.accessors=[],n.bufferViews=[],n.samplers=[],n.textures=[],n.images=s.listTextures().map((l,y)=>{let b=i.createPropertyDef(l);l.getMimeType()&&(b.mimeType=l.getMimeType());let g=l.getImage();return g&&i.createImageData(b,g,l),i.imageIndexMap.set(l,y),b}),d.filter(l=>l.prewriteTypes.includes("Accessor")).forEach(l=>l.prewrite(i,"Accessor")),s.listAccessors().forEach(l=>{let y=i.accessorUsageGroupedByParent,b=i.accessorParents;if(i.accessorIndexMap.has(l))return;let g=i.getAccessorUsage(l);if(i.addAccessorToUsageGroup(l,g),y.has(g)){let x=a.listParents(l).find(M=>M.propertyType!=="Root");b.set(l,x)}}),d.filter(l=>l.prewriteTypes.includes("Buffer")).forEach(l=>l.prewrite(i,"Buffer")),(s.listAccessors().length>0||i.otherBufferViews.size>0||s.listTextures().length>0&&e.format==="GLB")&&s.listBuffers().length===0)throw new Error("Buffer required for Document resources, but none was found.");n.buffers=[],s.listBuffers().forEach((l,y)=>{let b=i.createPropertyDef(l),g=i.accessorUsageGroupedByParent,x=l.listParents().filter(_=>_ instanceof U),M=new Set(x.map(_=>i.accessorParents.get(_))),T=new Map(Array.from(M).map((_,j)=>[_,j])),I={};for(let _ of x){if(i.accessorIndexMap.has(_))continue;let j=i.getAccessorUsage(_),L=j;if(g.has(j)){let F=i.accessorParents.get(_);L+=`:${T.get(F)}`}I[L]||={usage:j,accessors:[]},I[L].accessors.push(_)}let S=[],R=n.buffers.length,A=0;for(let{usage:_,accessors:j}of Object.values(I))if(_===vs.ARRAY_BUFFER&&e.vertexLayout==="interleaved"){let L=m(j,R,A);A+=L.byteLength;for(let F of L.buffers)S.push(F)}else if(_===vs.ARRAY_BUFFER)for(let L of j){let F=m([L],R,A);A+=F.byteLength;for(let z of F.buffers)S.push(z)}else if(_===vs.SPARSE){let L=p(j,R,A);A+=L.byteLength;for(let F of L.buffers)S.push(F)}else if(_===vs.ELEMENT_ARRAY_BUFFER){let L=xt.BufferViewTarget.ELEMENT_ARRAY_BUFFER,F=u(j,R,A,L);A+=F.byteLength;for(let z of F.buffers)S.push(z)}else{let L=u(j,R,A);A+=L.byteLength;for(let F of L.buffers)S.push(F)}if(i.imageBufferViews.length&&y===0){for(let _=0;_<i.imageBufferViews.length;_++)if(n.bufferViews[n.images[_].bufferView].byteOffset=A,A+=i.imageBufferViews[_].byteLength,S.push(i.imageBufferViews[_]),A%8){let j=8-A%8;A+=j,S.push(new Uint8Array(j))}}if(i.otherBufferViews.has(l))for(let _ of i.otherBufferViews.get(l))n.bufferViews.push({buffer:R,byteOffset:A,byteLength:_.byteLength}),i.otherBufferViewsIndexMap.set(_,n.bufferViews.length-1),A+=_.byteLength,S.push(_);if(A){let _;e.format==="GLB"?_=vt:(_=i.bufferURIGenerator.createURI(l,"bin"),b.uri=_),b.byteLength=A,i.assignResourceURI(_,H.concat(S),!0)}n.buffers.push(b),i.bufferIndexMap.set(l,y)}),s.listAccessors().find(l=>!l.getBuffer())&&o.warn("Skipped writing one or more Accessors: no Buffer assigned."),d.filter(l=>l.prewriteTypes.includes("Material")).forEach(l=>l.prewrite(i,"Material")),n.materials=s.listMaterials().map((l,y)=>{let b=i.createPropertyDef(l);if(l.getAlphaMode()!==Es.AlphaMode.OPAQUE&&(b.alphaMode=l.getAlphaMode()),l.getAlphaMode()===Es.AlphaMode.MASK&&(b.alphaCutoff=l.getAlphaCutoff()),l.getDoubleSided()&&(b.doubleSided=!0),b.pbrMetallicRoughness={},ie.eq(l.getBaseColorFactor(),[1,1,1,1])||(b.pbrMetallicRoughness.baseColorFactor=l.getBaseColorFactor()),ie.eq(l.getEmissiveFactor(),[0,0,0])||(b.emissiveFactor=l.getEmissiveFactor()),l.getRoughnessFactor()!==1&&(b.pbrMetallicRoughness.roughnessFactor=l.getRoughnessFactor()),l.getMetallicFactor()!==1&&(b.pbrMetallicRoughness.metallicFactor=l.getMetallicFactor()),l.getBaseColorTexture()){let g=l.getBaseColorTexture(),x=l.getBaseColorTextureInfo();b.pbrMetallicRoughness.baseColorTexture=i.createTextureInfoDef(g,x)}if(l.getEmissiveTexture()){let g=l.getEmissiveTexture(),x=l.getEmissiveTextureInfo();b.emissiveTexture=i.createTextureInfoDef(g,x)}if(l.getNormalTexture()){let g=l.getNormalTexture(),x=l.getNormalTextureInfo(),M=i.createTextureInfoDef(g,x);l.getNormalScale()!==1&&(M.scale=l.getNormalScale()),b.normalTexture=M}if(l.getOcclusionTexture()){let g=l.getOcclusionTexture(),x=l.getOcclusionTextureInfo(),M=i.createTextureInfoDef(g,x);l.getOcclusionStrength()!==1&&(M.strength=l.getOcclusionStrength()),b.occlusionTexture=M}if(l.getMetallicRoughnessTexture()){let g=l.getMetallicRoughnessTexture(),x=l.getMetallicRoughnessTextureInfo();b.pbrMetallicRoughness.metallicRoughnessTexture=i.createTextureInfoDef(g,x)}return i.materialIndexMap.set(l,y),b}),d.filter(l=>l.prewriteTypes.includes("Mesh")).forEach(l=>l.prewrite(i,"Mesh")),n.meshes=s.listMeshes().map((l,y)=>{let b=i.createPropertyDef(l),g=null;return b.primitives=l.listPrimitives().map(x=>{let M={attributes:{}};M.mode=x.getMode();let T=x.getMaterial();T&&(M.material=i.materialIndexMap.get(T)),Object.keys(x.getExtras()).length&&(M.extras=x.getExtras());let I=x.getIndices();I&&(M.indices=i.accessorIndexMap.get(I));for(let S of x.listSemantics())M.attributes[S]=i.accessorIndexMap.get(x.getAttribute(S));for(let S of x.listTargets()){let R={};for(let A of S.listSemantics())R[A]=i.accessorIndexMap.get(S.getAttribute(A));M.targets=M.targets||[],M.targets.push(R)}return x.listTargets().length&&!g&&(g=x.listTargets().map(S=>S.getName())),M}),l.getWeights().length&&(b.weights=l.getWeights()),g&&(b.extras=b.extras||{},b.extras.targetNames=g),i.meshIndexMap.set(l,y),b}),n.cameras=s.listCameras().map((l,y)=>{let b=i.createPropertyDef(l);if(b.type=l.getType(),b.type===Ss.Type.PERSPECTIVE){b.perspective={znear:l.getZNear(),zfar:l.getZFar(),yfov:l.getYFov()};let g=l.getAspectRatio();g!==null&&(b.perspective.aspectRatio=g)}else b.orthographic={znear:l.getZNear(),zfar:l.getZFar(),xmag:l.getXMag(),ymag:l.getYMag()};return i.cameraIndexMap.set(l,y),b}),n.nodes=s.listNodes().map((l,y)=>{let b=i.createPropertyDef(l);return ie.eq(l.getTranslation(),[0,0,0])||(b.translation=l.getTranslation()),ie.eq(l.getRotation(),[0,0,0,1])||(b.rotation=l.getRotation()),ie.eq(l.getScale(),[1,1,1])||(b.scale=l.getScale()),l.getWeights().length&&(b.weights=l.getWeights()),i.nodeIndexMap.set(l,y),b}),n.skins=s.listSkins().map((l,y)=>{let b=i.createPropertyDef(l),g=l.getInverseBindMatrices();g&&(b.inverseBindMatrices=i.accessorIndexMap.get(g));let x=l.getSkeleton();return x&&(b.skeleton=i.nodeIndexMap.get(x)),b.joints=l.listJoints().map(M=>i.nodeIndexMap.get(M)),i.skinIndexMap.set(l,y),b}),s.listNodes().forEach((l,y)=>{let b=n.nodes[y],g=l.getMesh();g&&(b.mesh=i.meshIndexMap.get(g));let x=l.getCamera();x&&(b.camera=i.cameraIndexMap.get(x));let M=l.getSkin();M&&(b.skin=i.skinIndexMap.get(M)),l.listChildren().length>0&&(b.children=l.listChildren().map(T=>i.nodeIndexMap.get(T)))}),n.animations=s.listAnimations().map((l,y)=>{let b=i.createPropertyDef(l),g=new Map;return b.samplers=l.listSamplers().map((x,M)=>{let T=i.createPropertyDef(x);return T.input=i.accessorIndexMap.get(x.getInput()),T.output=i.accessorIndexMap.get(x.getOutput()),T.interpolation=x.getInterpolation(),g.set(x,M),T}),b.channels=l.listChannels().map(x=>{let M=i.createPropertyDef(x);return M.sampler=g.get(x.getSampler()),M.target={node:i.nodeIndexMap.get(x.getTargetNode()),path:x.getTargetPath()},M}),i.animationIndexMap.set(l,y),b}),n.scenes=s.listScenes().map((l,y)=>{let b=i.createPropertyDef(l);return b.nodes=l.listChildren().map(g=>i.nodeIndexMap.get(g)),i.sceneIndexMap.set(l,y),b});let f=s.getDefaultScene();return f&&(n.scene=s.listScenes().indexOf(f)),n.extensionsUsed=d.map(l=>l.extensionName),n.extensionsRequired=h.map(l=>l.extensionName),d.forEach(l=>l.write(i)),Mf(n),r}};function Mf(t){let e=[];for(let a in t){let s=t[a];(Array.isArray(s)&&s.length===0||s===null||s===""||s&&typeof s=="object"&&Object.keys(s).length===0)&&e.push(a)}for(let a of e)delete t[a]}var Ef=class{_logger=ks.DEFAULT_INSTANCE;_extensions=new Set;_dependencies={};_vertexLayout="interleaved";_strictResources=!0;lastReadBytes=0;lastWriteBytes=0;setLogger(t){return this._logger=t,this}registerExtensions(t){for(let e of t)this._extensions.add(e),e.register();return this}registerDependencies(t){return Object.assign(this._dependencies,t),this}setVertexLayout(t){return this._vertexLayout=t,this}setStrictResources(t){return this._strictResources=t,this}async read(t){return await this.readJSON(await this.readAsJSON(t))}async readAsJSON(t){let e=await this.readURI(t,"view");this.lastReadBytes=e.byteLength;let a=Zi(e)?this._binaryToJSON(e):{json:JSON.parse(H.decodeText(e)),resources:{}};return await this._readResourcesExternal(a,this.dirname(t)),this._readResourcesInternal(a),a}async readJSON(t){return t=this._copyJSON(t),this._readResourcesInternal(t),hf.read(t,{extensions:Array.from(this._extensions),dependencies:this._dependencies,logger:this._logger})}async binaryToJSON(t){let e=this._binaryToJSON(H.assertView(t));this._readResourcesInternal(e);let a=e.json;if(a.buffers&&a.buffers.some(s=>Tf(e,s)))throw new Error("Cannot resolve external buffers with binaryToJSON().");if(a.images&&a.images.some(s=>kf(e,s)))throw new Error("Cannot resolve external images with binaryToJSON().");return e}async readBinary(t){return this.readJSON(await this.binaryToJSON(H.assertView(t)))}async writeJSON(t,e={}){if(e.format==="GLB"&&t.getRoot().listBuffers().length>1)throw new Error("GLB must have 0\u20131 buffers.");return wf.write(t,{format:e.format||"GLTF",basename:e.basename||"",logger:this._logger,vertexLayout:this._vertexLayout,dependencies:{...this._dependencies},extensions:Array.from(this._extensions)})}async writeBinary(t){let{json:e,resources:a}=await this.writeJSON(t,{format:"GLB"}),s=new Uint32Array([1179937895,2,12]),n=JSON.stringify(e),r=H.pad(H.encodeText(n),32),i=H.toView(new Uint32Array([r.byteLength,1313821514])),o=H.concat([i,r]);s[s.length-1]+=o.byteLength;let c=Object.values(a)[0];if(!c||!c.byteLength)return H.concat([H.toView(s),o]);let d=H.pad(c,0),h=H.toView(new Uint32Array([d.byteLength,5130562])),u=H.concat([h,d]);return s[s.length-1]+=u.byteLength,H.concat([H.toView(s),o,u])}async _readResourcesExternal(t,e){let a=t.json.images||[],s=t.json.buffers||[],n=[...a,...s].map(async r=>{let i=r.uri;if(!i||i.match(/data:/))return Promise.resolve();try{t.resources[i]=await this.readURI(this.resolve(e,i),"view"),this.lastReadBytes+=t.resources[i].byteLength}catch(o){if(!this._strictResources&&a.includes(r))this._logger.warn(`Failed to load image URI, "${i}". ${o}`),t.resources[i]=null;else throw o}});await Promise.all(n)}_readResourcesInternal(t){function e(a){if(a.uri){if(a.uri in t.resources){H.assertView(t.resources[a.uri]);return}if(a.uri.match(/data:/)){let s=`__${nf()}.${la.extension(a.uri)}`;t.resources[s]=H.createBufferFromDataURI(a.uri),a.uri=s}}}(t.json.images||[]).forEach(a=>{if(a.bufferView===void 0&&a.uri===void 0)throw new Error("Missing resource URI or buffer view.");e(a)}),(t.json.buffers||[]).forEach(e)}_copyJSON(t){let{images:e,buffers:a}=t.json;return t={json:{...t.json},resources:{...t.resources}},e&&(t.json.images=e.map(s=>({...s}))),a&&(t.json.buffers=a.map(s=>({...s}))),t}_binaryToJSON(t){if(!Zi(t))throw new Error("Invalid glTF 2.0 binary.");let e=new Uint32Array(t.buffer,t.byteOffset+12,2);if(e[1]!==1313821514)throw new Error("Missing required GLB JSON chunk.");let a=20,s=e[0],n=H.decodeText(H.toView(t,a,s)),r=JSON.parse(n),i=a+s;if(t.byteLength<=i)return{json:r,resources:{}};let o=new Uint32Array(t.buffer,t.byteOffset+i,2);if(o[1]!==5130562)return{json:r,resources:{}};let c=o[0],d=H.toView(t,i+8,c);return{json:r,resources:{[vt]:d}}}};function Tf(t,e){return e.uri!==void 0&&!(e.uri in t.resources)}function kf(t,e){return e.uri!==void 0&&!(e.uri in t.resources)&&e.bufferView===void 0}function Zi(t){if(t.byteLength<3*Uint32Array.BYTES_PER_ELEMENT)return!1;let e=new Uint32Array(t.buffer,t.byteOffset,3);return e[0]===1179937895&&e[1]===2}var vo=class extends Ef{_fetchConfig;constructor(t=Qn.DEFAULT_INIT){super(),this._fetchConfig=t}async readURI(t,e){let a=await fetch(t,this._fetchConfig);switch(e){case"view":return new Uint8Array(await a.arrayBuffer());case"text":return a.text()}}resolve(t,e){return Qn.resolve(t,e)}dirname(t){return Qn.dirname(t)}};function If(){return{vkFormat:0,typeSize:1,pixelWidth:0,pixelHeight:0,pixelDepth:0,layerCount:0,faceCount:1,levelCount:0,supercompressionScheme:0,levels:[],dataFormatDescriptor:[{vendorId:0,descriptorType:0,versionNumber:2,colorModel:0,colorPrimaries:1,transferFunction:2,flags:0,texelBlockDimension:[0,0,0,0],bytesPlane:[0,0,0,0,0,0,0,0],samples:[]}],keyValue:{},globalData:null}}var $t=class{constructor(e,a,s,n){this._dataView=void 0,this._littleEndian=void 0,this._offset=void 0,this._dataView=new DataView(e.buffer,e.byteOffset+a,s),this._littleEndian=n,this._offset=0}_nextUint8(){let e=this._dataView.getUint8(this._offset);return this._offset+=1,e}_nextUint16(){let e=this._dataView.getUint16(this._offset,this._littleEndian);return this._offset+=2,e}_nextUint32(){let e=this._dataView.getUint32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint64(){let e=this._dataView.getUint32(this._offset,this._littleEndian),a=this._dataView.getUint32(this._offset+4,this._littleEndian),s=e+2**32*a;return this._offset+=8,s}_nextInt32(){let e=this._dataView.getInt32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint8Array(e){let a=new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+this._offset,e);return this._offset+=e,a}_skip(e){return this._offset+=e,this}_scan(e,a=0){let s=this._offset,n=0;for(;this._dataView.getUint8(this._offset)!==a&&n<e;)n++,this._offset++;return n<e&&this._offset++,new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+s,n)}};var Nx=new Uint8Array([0]),Ie=[171,75,84,88,32,50,48,187,13,10,26,10];function wo(t){return new TextDecoder().decode(t)}function Rs(t){let e=new Uint8Array(t.buffer,t.byteOffset,Ie.length);if(e[0]!==Ie[0]||e[1]!==Ie[1]||e[2]!==Ie[2]||e[3]!==Ie[3]||e[4]!==Ie[4]||e[5]!==Ie[5]||e[6]!==Ie[6]||e[7]!==Ie[7]||e[8]!==Ie[8]||e[9]!==Ie[9]||e[10]!==Ie[10]||e[11]!==Ie[11])throw new Error("Missing KTX 2.0 identifier.");let a=If(),s=17*Uint32Array.BYTES_PER_ELEMENT,n=new $t(t,Ie.length,s,!0);a.vkFormat=n._nextUint32(),a.typeSize=n._nextUint32(),a.pixelWidth=n._nextUint32(),a.pixelHeight=n._nextUint32(),a.pixelDepth=n._nextUint32(),a.layerCount=n._nextUint32(),a.faceCount=n._nextUint32(),a.levelCount=n._nextUint32(),a.supercompressionScheme=n._nextUint32();let r=n._nextUint32(),i=n._nextUint32(),o=n._nextUint32(),c=n._nextUint32(),d=n._nextUint64(),h=n._nextUint64(),u=Math.max(a.levelCount,1)*3*8,m=new $t(t,Ie.length+s,u,!0);for(let B=0,P=Math.max(a.levelCount,1);B<P;B++)a.levels.push({levelData:new Uint8Array(t.buffer,t.byteOffset+m._nextUint64(),m._nextUint64()),uncompressedByteLength:m._nextUint64()});let p=new $t(t,r,i,!0);p._skip(4);let f=p._nextUint16(),l=p._nextUint16(),y=p._nextUint16(),b=p._nextUint16(),g=p._nextUint8(),x=p._nextUint8(),M=p._nextUint8(),T=p._nextUint8(),I=[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],S=[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],A={vendorId:f,descriptorType:l,versionNumber:y,colorModel:g,colorPrimaries:x,transferFunction:M,flags:T,texelBlockDimension:I,bytesPlane:S,samples:[]},L=(b/4-6)/4;for(let B=0;B<L;B++){let P={bitOffset:p._nextUint16(),bitLength:p._nextUint8(),channelType:p._nextUint8(),samplePosition:[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],sampleLower:Number.NEGATIVE_INFINITY,sampleUpper:Number.POSITIVE_INFINITY};P.channelType&64?(P.sampleLower=p._nextInt32(),P.sampleUpper=p._nextInt32()):(P.sampleLower=p._nextUint32(),P.sampleUpper=p._nextUint32()),A.samples[B]=P}a.dataFormatDescriptor.length=0,a.dataFormatDescriptor.push(A);let F=new $t(t,o,c,!0);for(;F._offset<c;){let B=F._nextUint32(),P=F._scan(B),Y=wo(P);if(a.keyValue[Y]=F._nextUint8Array(B-P.byteLength-1),Y.match(/^ktx/i)){let Te=wo(a.keyValue[Y]);a.keyValue[Y]=Te.substring(0,Te.lastIndexOf("\0"))}let ce=B%4?4-B%4:0;F._skip(ce)}if(h<=0)return a;let z=new $t(t,d,h,!0),W=z._nextUint16(),ae=z._nextUint16(),oe=z._nextUint32(),Oe=z._nextUint32(),de=z._nextUint32(),De=z._nextUint32(),He=[];for(let B=0,P=Math.max(a.levelCount,1);B<P;B++)He.push({imageFlags:z._nextUint32(),rgbSliceByteOffset:z._nextUint32(),rgbSliceByteLength:z._nextUint32(),alphaSliceByteOffset:z._nextUint32(),alphaSliceByteLength:z._nextUint32()});let Me=d+z._offset,Ze=Me+oe,qe=Ze+Oe,pt=qe+de,oa=new Uint8Array(t.buffer,t.byteOffset+Me,oe),Un=new Uint8Array(t.buffer,t.byteOffset+Ze,Oe),rs=new Uint8Array(t.buffer,t.byteOffset+qe,de),k=new Uint8Array(t.buffer,t.byteOffset+pt,De);return a.globalData={endpointCount:W,selectorCount:ae,imageDescs:He,endpointsData:oa,selectorsData:Un,tablesData:rs,extendedData:k},a}var Mt="EXT_mesh_gpu_instancing",lt="EXT_mesh_features",Ne="EXT_meshopt_compression",V="EXT_structural_metadata",As="EXT_texture_webp",_s="EXT_texture_avif",Cf="KHR_accessor_float16",Ff="KHR_accessor_float64",le="KHR_draco_mesh_compression",ct="KHR_lights_punctual",Et="KHR_materials_anisotropy",Tt="KHR_materials_clearcoat",kt="KHR_materials_diffuse_transmission",It="KHR_materials_dispersion",St="KHR_materials_emissive_strength",Rt="KHR_materials_ior",At="KHR_materials_iridescence",_t="KHR_materials_pbrSpecularGlossiness",Nt="KHR_materials_sheen",Ct="KHR_materials_specular",Ft="KHR_materials_transmission",da="KHR_materials_unlit",Bt="KHR_materials_volume",je="KHR_materials_variants",Mo="KHR_mesh_primitive_restart",Eo="KHR_mesh_quantization",jt="KHR_node_visibility",Ns="KHR_texture_basisu",Pt="KHR_texture_transform",We="KHR_xmp_json_ld",Bf=class extends X{static EXTENSION_NAME=lt;init(){this.extensionName=lt,this.propertyType="FeatureID",this.parentTypes=["Features"]}getDefaults(){return Object.assign(super.getDefaults(),{nullFeatureId:null,label:"",attribute:null,texture:null,propertyTable:null})}getFeatureCount(){return this.get("featureCount")}setFeatureCount(t){return this.set("featureCount",t)}getNullFeatureID(){return this.get("nullFeatureId")}setNullFeatureID(t){return this.set("nullFeatureId",t)}getLabel(){return this.get("label")}setLabel(t){return this.set("label",t)}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getPropertyTable(){return this.getRef("propertyTable")}setPropertyTable(t){return this.setRef("propertyTable",t)}},jf=class extends X{static EXTENSION_NAME=lt;init(){this.extensionName=lt,this.propertyType="FeatureIDTexture",this.parentTypes=["FeatureID"]}getDefaults(){let t=new ne(this.graph,"textureInfo");return t.setMinFilter(ne.MagFilter.NEAREST),t.setMagFilter(ne.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}},Pf=class extends X{static EXTENSION_NAME=lt;init(){this.extensionName=lt,this.propertyType="Features",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{featureIds:new se([])})}listFeatureIDs(){return this.listRefs("featureIds")}addFeatureID(t){return this.addRef("featureIds",t)}removeFeatureID(t){return this.removeRef("featureIds",t)}},Pa=lt,ur=class extends te{extensionName=lt;static EXTENSION_NAME=lt;createFeatures(){return new Pf(this.document.getGraph())}createFeatureID(){return new Bf(this.document.getGraph())}createFeatureIDTexture(){return new jf(this.document.getGraph())}read(t){return(t.jsonDoc.json.meshes||[]).forEach((e,a)=>{(e.primitives||[]).forEach((s,n)=>{this._readPrimitive(t,a,s,n)})}),this}_readPrimitive(t,e,a,s){if(!a.extensions||!a.extensions[Pa])return;let n=this.createFeatures(),r=a.extensions[Pa];for(let i of r.featureIds){let o=Of(this.document,this,t,i);n.addFeatureID(o)}t.meshes[e].listPrimitives()[s].setExtension(Pa,n)}write(t){let e=t.jsonDoc.json.meshes;if(!e)return this;for(let a of this.document.getRoot().listMeshes()){let s=e[t.meshIndexMap.get(a)];a.listPrimitives().forEach((n,r)=>{let i=s.primitives[r];this._writePrimitive(t,n,i)})}return this}_writePrimitive(t,e,a){let s=e.getExtension(Pa);if(!s)return;let n={featureIds:[]};s.listFeatureIDs().forEach(r=>{n.featureIds.push(Lf(this.document,t,r))}),a.extensions=a.extensions||{},a.extensions[Pa]=n}};function Of(t,e,a,s){let n=e.createFeatureID().setFeatureCount(s.featureCount);s.nullFeatureId!==void 0&&n.setNullFeatureID(s.nullFeatureId),s.label!==void 0&&n.setLabel(s.label),s.attribute!==void 0&&n.setAttribute(s.attribute);let r=s.texture;if(r!==void 0){let i=Df(e,a,r);n.setTexture(i)}if(s.propertyTable!==void 0){let i=t.getRoot().getExtension(V).listPropertyTables();n.setPropertyTable(i[s.propertyTable])}return n}function Df(t,e,a){let s=t.createFeatureIDTexture(),{json:n}=e.jsonDoc;if(a.channels&&s.setChannels(a.channels),a.index!==void 0){let r=n.textures[a.index].source;s.setTexture(e.textures[r]),e.setTextureInfo(s.getTextureInfo(),a)}return s}function Lf(t,e,a){let s=t.getRoot(),n={featureCount:a.getFeatureCount()};if(a.getNullFeatureID()!=null&&(n.nullFeatureId=a.getNullFeatureID()),a.getLabel()&&(n.label=a.getLabel()),a.getAttribute()!=null&&(n.attribute=a.getAttribute()),a.getTexture()){let r=a.getTexture(),i=r.getTexture(),o=r.getTextureInfo();n.texture=e.createTextureInfoDef(i,o);let c=r.getChannels();ie.eq(c,[0])||(n.texture.channels=c)}if(a.getPropertyTable()){let r=s.getExtension(V),i=a.getPropertyTable();n.propertyTable=r.listPropertyTables().indexOf(i)}return n}var cr="INSTANCE_ATTRIBUTE",Uf=class extends X{static EXTENSION_NAME=Mt;init(){this.extensionName=Mt,this.propertyType="InstancedMesh",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:cr})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},Gf=class extends te{static EXTENSION_NAME=Mt;extensionName=Mt;prewriteTypes=[C.ACCESSOR];createInstancedMesh(){return new Uf(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(!e.extensions||!e.extensions.EXT_mesh_gpu_instancing)return;let s=e.extensions[Mt],n=this.createInstancedMesh();for(let r in s.attributes)n.setAttribute(r,t.accessors[s.attributes[r]]);t.nodes[a].setExtension(Mt,n)}),this}prewrite(t){t.accessorUsageGroupedByParent.add(cr);for(let e of this.properties)for(let a of e.listAttributes())t.addAccessorToUsageGroup(a,cr);return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listNodes().forEach(a=>{let s=a.getExtension(Mt);if(s){let n=t.nodeIndexMap.get(a),r=e.json.nodes[n],i={attributes:{}};s.listSemantics().forEach(o=>{let c=s.getAttribute(o);i.attributes[o]=t.accessorIndexMap.get(c)}),r.extensions=r.extensions||{},r.extensions[Mt]=i}}),this}},Kf=(function(t){return t.QUANTIZE="quantize",t.FILTER="filter",t})({});function zf(t){return!t.extensions||!t.extensions.EXT_meshopt_compression?!1:!!t.extensions[Ne].fallback}var{BYTE:Vf,SHORT:To,FLOAT:Hf}=U.ComponentType,{encodeNormalizedInt:ko,decodeNormalizedInt:lr}=ie;function qf(t,e,a,s){let{filter:n,bits:r}=s,i={array:t.getArray(),byteStride:t.getElementSize()*t.getComponentSize(),componentType:t.getComponentType(),normalized:t.getNormalized()};if(a!=="ATTRIBUTES")return i;if(n!=="NONE"){let o=t.getNormalized()?Xf(t):new Float32Array(i.array);switch(n){case"EXPONENTIAL":i.byteStride=t.getElementSize()*4,i.componentType=Hf,i.normalized=!1,i.array=e.encodeFilterExp(o,t.getCount(),i.byteStride,r);break;case"OCTAHEDRAL":i.byteStride=r>8?8:4,i.componentType=r>8?To:Vf,i.normalized=!0,o=t.getElementSize()===3?$f(o):o,i.array=e.encodeFilterOct(o,t.getCount(),i.byteStride,r);break;case"QUATERNION":i.byteStride=8,i.componentType=To,i.normalized=!0,i.array=e.encodeFilterQuat(o,t.getCount(),i.byteStride,r);break;default:throw new Error("Invalid filter.")}i.min=t.getMin([]),i.max=t.getMax([]),t.getNormalized()&&(i.min=i.min.map(c=>lr(c,t.getComponentType())),i.max=i.max.map(c=>lr(c,t.getComponentType()))),i.normalized&&(i.min=i.min.map(c=>ko(c,i.componentType)),i.max=i.max.map(c=>ko(c,i.componentType)))}else i.byteStride%4&&(i.array=Wf(i.array,t.getElementSize()),i.byteStride=i.array.byteLength/t.getCount());return i}function Xf(t){let e=t.getComponentType(),a=t.getArray(),s=new Float32Array(a.length);for(let n=0;n<a.length;n++)s[n]=lr(a[n],e);return s}function Wf(t,e){let a=H.padNumber(t.BYTES_PER_ELEMENT*e)/t.BYTES_PER_ELEMENT,s=t.length/e,n=new t.constructor(s*a);for(let r=0;r*e<t.length;r++)for(let i=0;i<e;i++)n[r*a+i]=t[r*e+i];return n}function $f(t){let e=new Float32Array(t.length*4/3);for(let a=0,s=t.length/3;a<s;a++)e[a*4]=t[a*3],e[a*4+1]=t[a*3+1],e[a*4+2]=t[a*3+2];return e}function Yf(t,e){return e===xt.BufferViewUsage.ELEMENT_ARRAY_BUFFER?t.listParents().some(a=>a instanceof ja&&a.getMode()===ja.Mode.TRIANGLES)?"TRIANGLES":"INDICES":"ATTRIBUTES"}function Jf(t,e){let a=e.getGraph().listParentEdges(t).filter(s=>!(s.getParent()instanceof rr));for(let s of a){let n=s.getName(),r=s.getAttributes().key||"",i=s.getParent().propertyType===C.PRIMITIVE_TARGET;if(n==="indices")return{filter:"NONE"};if(n==="attributes"){if(r==="POSITION")return{filter:"NONE"};if(r==="TEXCOORD_0")return{filter:"NONE"};if(r.startsWith("JOINTS_"))return{filter:"NONE"};if(r.startsWith("WEIGHTS_"))return{filter:"NONE"};if(r==="NORMAL"||r==="TANGENT")return i?{filter:"NONE"}:{filter:"OCTAHEDRAL",bits:8}}if(n==="output"){let o=Ko(t);return o==="rotation"?{filter:"QUATERNION",bits:16}:o==="translation"?{filter:"EXPONENTIAL",bits:12}:o==="scale"?{filter:"EXPONENTIAL",bits:12}:{filter:"NONE"}}if(n==="input")return{filter:"NONE"};if(n==="inverseBindMatrices")return{filter:"NONE"}}return{filter:"NONE"}}function Ko(t){for(let e of t.listParents())if(e instanceof Is){for(let a of e.listParents())if(a instanceof nr)return a.getTargetPath()}return null}var Io={method:"quantize"},fr=class extends te{extensionName=Ne;prereadTypes=[C.BUFFER,C.PRIMITIVE];prewriteTypes=[C.BUFFER,C.ACCESSOR];readDependencies=["meshopt.decoder"];writeDependencies=["meshopt.encoder"];static EXTENSION_NAME=Ne;static EncoderMethod=Kf;_decoder=null;_decoderFallbackBufferMap=new Map;_encoder=null;_encoderOptions=Io;_encoderFallbackBuffer=null;_encoderBufferViews={};_encoderBufferViewData={};_encoderBufferViewAccessors={};install(t,e){return t==="meshopt.decoder"&&(this._decoder=e),t==="meshopt.encoder"&&(this._encoder=e),this}setEncoderOptions(t){return this._encoderOptions={...Io,...t},this}preread(t,e){if(!this._decoder){if(!this.isRequired())return this;throw new Error(`[${Ne}] Please install extension dependency, "meshopt.decoder".`)}if(!this._decoder.supported){if(!this.isRequired())return this;throw new Error(`[${Ne}]: Missing WASM support.`)}return e===C.BUFFER?this._prereadBuffers(t):e===C.PRIMITIVE&&this._prereadPrimitives(t),this}_prereadBuffers(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach((a,s)=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let n=a.extensions[Ne],r=n.byteOffset||0,i=n.byteLength||0,o=n.count,c=n.byteStride,d=new Uint8Array(o*c),h=e.json.buffers[n.buffer],u=h.uri?e.resources[h.uri]:e.resources[vt],m=H.toView(u,r,i);this._decoder.decodeGltfBuffer(d,o,c,m,n.mode,n.filter),t.bufferViews[s]=d})}_prereadPrimitives(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach(a=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let s=a.extensions[Ne],n=t.buffers[s.buffer],r=t.buffers[a.buffer],i=e.json.buffers[a.buffer];zf(i)&&this._decoderFallbackBufferMap.set(r,n)})}read(t){if(!this.isRequired())return this;for(let[e,a]of this._decoderFallbackBufferMap){for(let s of e.listParents())s instanceof U&&s.swap(e,a);e.dispose()}return this}prewrite(t,e){return e===C.ACCESSOR?this._prewriteAccessors(t):e===C.BUFFER&&this._prewriteBuffers(t),this}_prewriteAccessors(t){let e=t.jsonDoc.json,a=this._encoder,s=this._encoderOptions,n=this.document.getGraph(),r=this.document.createBuffer(),i=this.document.getRoot().listBuffers().indexOf(r),o=1,c=new Map,d=h=>{for(let u of n.listParents(h)){if(u.propertyType===C.ROOT)continue;let m=c.get(h);return m===void 0&&c.set(h,m=o++),m}return-1};this._encoderFallbackBuffer=r,this._encoderBufferViews={},this._encoderBufferViewData={},this._encoderBufferViewAccessors={};for(let h of this.document.getRoot().listAccessors()){if(Ko(h)==="weights"||h.getSparse())continue;let u=t.getAccessorUsage(h),m=t.accessorUsageGroupedByParent.has(u)?d(h):null,p=Yf(h,u),f=s.method==="filter"?Jf(h,this.document):{filter:"NONE"},l=qf(h,a,p,f),{array:y,byteStride:b}=l,g=h.getBuffer();if(!g)throw new Error(`${Ne}: Missing buffer for accessor.`);let x=this.document.getRoot().listBuffers().indexOf(g),M=[u,m,p,f.filter,b,x].join(":"),T=this._encoderBufferViews[M],I=this._encoderBufferViewData[M],S=this._encoderBufferViewAccessors[M];(!T||!I)&&(S=this._encoderBufferViewAccessors[M]=[],I=this._encoderBufferViewData[M]=[],T=this._encoderBufferViews[M]={buffer:i,target:xt.USAGE_TO_TARGET[u],byteOffset:0,byteLength:0,byteStride:u===xt.BufferViewUsage.ARRAY_BUFFER?b:void 0,extensions:{[Ne]:{buffer:x,byteOffset:0,byteLength:0,mode:p,filter:f.filter!=="NONE"?f.filter:void 0,byteStride:b,count:0}}});let R=t.createAccessorDef(h);R.componentType=l.componentType,R.normalized=l.normalized,R.byteOffset=T.byteLength,R.min&&l.min&&(R.min=l.min),R.max&&l.max&&(R.max=l.max),t.accessorIndexMap.set(h,e.accessors.length),e.accessors.push(R),S.push(R),I.push(new Uint8Array(y.buffer,y.byteOffset,y.byteLength)),T.byteLength+=y.byteLength,T.extensions.EXT_meshopt_compression.count+=h.getCount()}}_prewriteBuffers(t){let e=this._encoder;for(let a in this._encoderBufferViews){let s=this._encoderBufferViews[a],n=this._encoderBufferViewData[a],r=this.document.getRoot().listBuffers()[s.extensions[Ne].buffer],i=t.otherBufferViews.get(r)||[],{count:o,byteStride:c,mode:d}=s.extensions[Ne],h=H.concat(n),u=e.encodeGltfBuffer(h,o,c,d),m=H.pad(u);s.extensions[Ne].byteLength=u.byteLength,n.length=0,n.push(m),i.push(m),t.otherBufferViews.set(r,i)}}write(t){let e=0;for(let r in this._encoderBufferViews){let i=this._encoderBufferViews[r],o=this._encoderBufferViewData[r][0],c=t.otherBufferViewsIndexMap.get(o),d=this._encoderBufferViewAccessors[r];for(let p of d)p.bufferView=c;let h=t.jsonDoc.json.bufferViews[c],u=h.byteOffset||0;Object.assign(h,i),h.byteOffset=e;let m=h.extensions[Ne];m.byteOffset=u,e+=H.padNumber(i.byteLength)}let a=this._encoderFallbackBuffer,s=t.bufferIndexMap.get(a),n=t.jsonDoc.json.buffers[s];return n.byteLength=e,n.extensions={[Ne]:{fallback:!0}},a.dispose(),this}},Qf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="StructuralMetadata",this.parentTypes=[C.ROOT]}getDefaults(){return Object.assign(super.getDefaults(),{schema:null,schemaUri:"",propertyTables:new xe,propertyTextures:new xe,propertyAttributes:new xe})}getSchema(){return this.getRef("schema")}setSchema(t){return this.setRef("schema",t)}getSchemaUri(){return this.get("schemaUri")}setSchemaUri(t){return this.set("schemaUri",t)}listPropertyTables(){return this.listRefs("propertyTables")}addPropertyTable(t){return this.addRef("propertyTables",t)}removePropertyTable(t){return this.removeRef("propertyTables",t)}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},Zf=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Schema",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",version:"",classes:new ue,enums:new ue})}getId(){return this.get("id")}setId(t){return this.set("id",t)}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getVersion(){return this.get("version")}setVersion(t){return this.set("version",t)}setClass(t,e){return this.setRefMap("classes",t,e)}getClass(t){return this.getRefMap("classes",t)}listClassKeys(){return this.listRefMapKeys("classes")}listClassValues(){return this.listRefMapValues("classes")}setEnum(t,e){return this.setRefMap("enums",t,e)}getEnum(t){return this.getRefMap("enums",t)}listEnumKeys(){return this.listRefMapKeys("enums")}listEnumValues(){return this.listRefMapValues("enums")}},eh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Class",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",properties:new ue})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},th=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="ClassProperty",this.parentTypes=["Class"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",componentType:null,enumType:null,array:null,count:null,normalized:null,offset:null,scale:null,max:null,min:null,required:null,noData:null,default:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getType(){return this.get("type")}setType(t){return this.set("type",t)}getComponentType(){return this.get("componentType")}setComponentType(t){return this.set("componentType",t)}getEnumType(){return this.get("enumType")}setEnumType(t){return this.set("enumType",t)}getArray(){return this.get("array")}setArray(t){return this.set("array",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}getNormalized(){return this.get("normalized")}setNormalized(t){return this.set("normalized",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}getRequired(){return this.get("required")}setRequired(t){return this.set("required",t)}getNoData(){return this.get("noData")}setNoData(t){return this.set("noData",t)}getDefault(){return this.get("default")}setDefault(t){return this.set("default",t)}},ah=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Enum",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",valueType:"UINT16",values:new xe})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValueType(){return this.get("valueType")}setValueType(t){return this.set("valueType",t)}listValues(){return this.listRefs("values")}addEnumValue(t){return this.addRef("values",t)}removeEnumValue(t){return this.removeRef("values",t)}},sh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="EnumValue",this.parentTypes=["Enum"]}getDefaults(){return Object.assign(super.getDefaults(),{description:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValue(){return this.get("value")}setValue(t){return this.set("value",t)}},nh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTable",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},rh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTableProperty",this.parentTypes=["PropertyTable"]}getDefaults(){return Object.assign(super.getDefaults(),{arrayOffsets:null,stringOffsets:null,arrayOffsetType:null,stringOffsetType:null,offset:null,scale:null,max:null,min:null})}getValues(){return this.get("values")}setValues(t){return this.set("values",t)}getArrayOffsets(){return this.get("arrayOffsets")}setArrayOffsets(t){return this.set("arrayOffsets",t)}getStringOffsets(){return this.get("stringOffsets")}setStringOffsets(t){return this.set("stringOffsets",t)}getArrayOffsetType(){return this.get("arrayOffsetType")}setArrayOffsetType(t){return this.set("arrayOffsetType",t)}getStringOffsetType(){return this.get("stringOffsetType")}setStringOffsetType(t){return this.set("stringOffsetType",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},ih=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTexture",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},oh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTextureProperty",this.parentTypes=["PropertyTexture"]}getDefaults(){let t=new ne(this.graph,"textureInfo");return t.setMinFilter(ne.MagFilter.NEAREST),t.setMagFilter(ne.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t,offset:null,scale:null,max:null,min:null})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},ch=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttribute",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},lh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttributeProperty",this.parentTypes=["PropertyAttribute"]}getDefaults(){return Object.assign(super.getDefaults(),{offset:null,scale:null,max:null,min:null})}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},dh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="NodeStructuralMetadata",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{class:"",properties:{}})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getProperties(){return this.get("properties")}setProperties(t){return this.set("properties",t)}},uh=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="MeshPrimitiveStructuralMetadata",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{propertyTextures:new xe,propertyAttributes:new xe})}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},fh=class extends te{extensionName=V;static EXTENSION_NAME=V;prewriteTypes=[C.BUFFER];prereadTypes=[C.SCENE];createStructuralMetadata(){return new Qf(this.document.getGraph())}createSchema(){return new Zf(this.document.getGraph())}createClass(){return new eh(this.document.getGraph())}createClassProperty(){return new th(this.document.getGraph())}createEnum(){return new ah(this.document.getGraph())}createEnumValue(){return new sh(this.document.getGraph())}createPropertyTable(){return new nh(this.document.getGraph())}createPropertyTableProperty(){return new rh(this.document.getGraph())}createPropertyTexture(){return new ih(this.document.getGraph())}createPropertyTextureProperty(){return new oh(this.document.getGraph())}createPropertyAttribute(){return new ch(this.document.getGraph())}createPropertyAttributeProperty(){return new lh(this.document.getGraph())}createNodeStructuralMetadata(){return new dh(this.document.getGraph())}createMeshPrimitiveStructuralMetadata(){return new uh(this.document.getGraph())}read(t){return this}preread(t){let e=this.document.getRoot(),{json:a}=t.jsonDoc,s=a.extensions[V],n=hh(this,t,s);return e.setExtension(V,n),(a.meshes||[]).forEach((r,i)=>{let o=t.meshes[i].listPrimitives();(r.primitives||[]).forEach((c,d)=>{let h=o[d];this._readPrimitive(n,h,c)})}),(a.nodes||[]).forEach((r,i)=>{this._readNode(t.nodes[i],r)}),this}_readPrimitive(t,e,a){if(!a.extensions||!a.extensions.EXT_structural_metadata)return;let s=this.createMeshPrimitiveStructuralMetadata(),n=a.extensions[V],r=t.listPropertyTextures(),i=n.propertyTextures||[];for(let d of i){let h=r[d];s.addPropertyTexture(h)}let o=t.listPropertyAttributes(),c=n.propertyAttributes||[];for(let d of c){let h=o[d];s.addPropertyAttribute(h)}e.setExtension(V,s)}_readNode(t,e){if(!e.extensions||!e.extensions.EXT_structural_metadata)return;let a=e.extensions[V],s=this.createNodeStructuralMetadata().setClass(a.class).setProperties(a.properties);t.setExtension(V,s)}write(t){let e=this.document.getRoot(),a=e.getExtension(V);if(!a)return this;let s=t.jsonDoc.json,n=kh(t,a);s.extensions=s.extensions||{},s.extensions[V]=n;let r=e.listMeshes(),i=s.meshes;if(i)for(let d of r){let h=i[t.meshIndexMap.get(d)];d.listPrimitives().forEach((u,m)=>{let p=h.primitives[m];this._writePrimitive(a,u,p)})}let o=e.listNodes(),c=s.nodes;if(c)for(let d of o){let h=t.nodeIndexMap.get(d);this._writeNode(d,c[h])}return this}_writePrimitive(t,e,a){let s=e.getExtension(V);if(!s)return;let n=t.listPropertyTextures(),r=t.listPropertyAttributes(),i,o,c=s.listPropertyTextures();if(c.length>0){i=[];for(let u of c){let m=n.indexOf(u);if(m>=0)i.push(m);else throw new Error(`${V}: Invalid property texture in mesh primitive`)}}let d=s.listPropertyAttributes();if(d.length>0){o=[];for(let u of d){let m=r.indexOf(u);if(m>=0)o.push(m);else throw new Error(`${V}: Invalid property attribute in mesh primitive`)}}let h={propertyTextures:i,propertyAttributes:o};a.extensions=a.extensions||{},a.extensions[V]=h}_writeNode(t,e){let a=t.getExtension("EXT_structural_metadata");a&&(e.extensions=e.extensions||{},e.extensions[V]={class:a.getClass(),properties:a.getProperties()})}prewrite(t,e){return e===C.BUFFER&&this._prewriteBuffers(t),this}_prewriteBuffers(t){let e=this.document,a=e.getRoot().getExtension(V);t.jsonDoc.json.bufferViews||=[];for(let s of a.listPropertyTables())for(let n of s.listPropertyValues()){let r=Oh(e,t);r.push(n.getValues());let i=n.getArrayOffsets();i&&r.push(i);let o=n.getStringOffsets();o&&r.push(o)}}};function hh(t,e,a){let s=t.createStructuralMetadata();if(a.schema!==void 0){let o=bh(t,a.schema);s.setSchema(o)}else if(a.schemaUri){let o=a.schemaUri;s.setSchemaUri(o)}let n=a.propertyTextures||[];for(let o of n){let c=xh(t,e,o);s.addPropertyTexture(c)}let r=a.propertyTables||[];for(let o of r){let c=wh(t,e,o);s.addPropertyTable(c)}let i=a.propertyAttributes||[];for(let o of i){let c=Eh(t,o);s.addPropertyAttribute(c)}return s}function bh(t,e){let a=t.createSchema().setId(e.id);e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.version!==void 0&&a.setVersion(e.version);let s=e.classes||{};for(let r of Object.keys(s)){let i=s[r];a.setClass(r,ph(t,i))}let n=e.enums||{};for(let r of Object.keys(n))a.setEnum(r,gh(t,n[r]));return a}function ph(t,e){let a=t.createClass();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description);let s=e.properties||{};for(let n of Object.keys(s)){let r=mh(t,s[n]);a.setProperty(n,r)}return a}function mh(t,e){let a=t.createClassProperty().setType(e.type);return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.componentType!==void 0&&a.setComponentType(e.componentType),e.enumType!==void 0&&a.setEnumType(e.enumType),e.array!==void 0&&a.setArray(e.array),e.count!==void 0&&a.setCount(e.count),e.normalized!==void 0&&a.setNormalized(e.normalized),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),e.required!==void 0&&a.setRequired(e.required),e.noData!==void 0&&a.setNoData(e.noData),e.default!==void 0&&a.setDefault(e.default),a}function gh(t,e){let a=t.createEnum();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.valueType!==void 0&&a.setValueType(e.valueType);let s=e.values||{};for(let n of s)a.addEnumValue(yh(t,n));return a}function yh(t,e){let a=t.createEnumValue();return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.value!==void 0&&a.setValue(e.value),a}function xh(t,e,a){let s=t.createPropertyTexture();s.setClass(a.class),a.name!==void 0&&s.setName(a.name);let n=a.properties||{};for(let r of Object.keys(n)){let i=vh(t,e,n[r]);s.setProperty(r,i)}return s}function vh(t,e,a){let s=t.createPropertyTextureProperty(),n=e.jsonDoc.json.textures||[];a.channels&&s.setChannels(a.channels);let r=n[a.index].source;if(r!==void 0){let i=e.textures[r];s.setTexture(i);let o=s.getTextureInfo();o&&e.setTextureInfo(o,a)}return a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function wh(t,e,a){let s=t.createPropertyTable().setClass(a.class).setCount(a.count);a.name!==void 0&&s.setName(a.name);let n=a.properties||{};for(let r of Object.keys(n)){let i=Mh(t,e,n[r]);s.setProperty(r,i)}return s}function Mh(t,e,a){let s=t.createPropertyTableProperty(),n=ir(e,a.values);if(s.setValues(n),a.arrayOffsets!==void 0){let r=ir(e,a.arrayOffsets);s.setArrayOffsets(r)}if(a.stringOffsets!==void 0){let r=ir(e,a.stringOffsets);s.setStringOffsets(r)}return a.arrayOffsetType!==void 0&&s.setArrayOffsetType(a.arrayOffsetType),a.stringOffsetType!==void 0&&s.setStringOffsetType(a.stringOffsetType),a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function Eh(t,e){let a=t.createPropertyAttribute();a.setClass(e.class),e.name!==void 0&&a.setName(e.name);let s=e.properties||{};for(let n of Object.keys(s)){let r=Th(t,s[n]);a.setProperty(n,r)}return a}function Th(t,e){let a=t.createPropertyAttributeProperty();return a.setAttribute(e.attribute),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),a}function kh(t,e){let a={},s=e.getSchema();s&&(a.schema=Ih(s));let n=e.getSchemaUri();n&&(a.schemaUri=n);let r=e.listPropertyTables();if(r.length>0){let c=[];for(let d of r){let h=Nh(t,d);c.push(h)}a.propertyTables=c}let i=e.listPropertyTextures();if(i.length>0){let c=[];for(let d of i){let h=jh(t,d);c.push(h)}a.propertyTextures=c}let o=e.listPropertyAttributes();if(o.length>0){let c=[];for(let d of o){let h=Fh(d);c.push(h)}a.propertyAttributes=c}return a}function Ih(t){let e={id:t.getId()},a=t.listClassKeys();if(a.length>0){e.classes={};for(let n of a){let r=Sh(t.getClass(n));e.classes[n]=r}}let s=t.listEnumKeys();if(s.length>0){e.enums={};for(let n of s){let r=Ah(t.getEnum(n));e.enums[n]=r}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getVersion()&&(e.version=t.getVersion()),e}function Sh(t){let e={},a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let n=t.getProperty(s);e.properties[s]=Rh(n)}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),e}function Rh(t){let e={type:t.getType()};return t.getArray()&&(e.array=t.getArray()),t.getNormalized()&&(e.normalized=t.getNormalized()),t.getRequired()&&(e.required=t.getRequired()),t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getComponentType()!=null&&(e.componentType=t.getComponentType()),t.getEnumType()!=null&&(e.enumType=t.getEnumType()),t.getCount()!=null&&(e.count=t.getCount()),t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),t.getNoData()!=null&&(e.noData=t.getNoData()),t.getDefault()!=null&&(e.default=t.getDefault()),e}function Ah(t){let e={values:t.listValues().map(_h)};return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getValueType()!=="UINT16"&&(e.valueType=t.getValueType()),e}function _h(t){let e={name:t.getName(),value:t.getValue()};return t.getDescription()&&(e.description=t.getDescription()),e}function Nh(t,e){let a={class:e.getClass(),count:e.getCount()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let n of s){let r=Ch(t,e.getProperty(n));a.properties[n]=r}}return a}function Ch(t,e){let a=e.getValues(),s={values:t.otherBufferViewsIndexMap.get(a)};if(e.getArrayOffsets()){let n=e.getArrayOffsets();s.arrayOffsets=t.otherBufferViewsIndexMap.get(n)}if(e.getStringOffsets()){let n=e.getStringOffsets();s.stringOffsets=t.otherBufferViewsIndexMap.get(n)}return e.getArrayOffsetType()!=null&&(s.arrayOffsetType=e.getArrayOffsetType()),e.getStringOffsetType()!=null&&(s.stringOffsetType=e.getStringOffsetType()),e.getOffset()!=null&&(s.offset=e.getOffset()),e.getScale()!=null&&(s.scale=e.getScale()),e.getMax()!=null&&(s.max=e.getMax()),e.getMin()!=null&&(s.min=e.getMin()),s}function Fh(t){let e={class:t.getClass()};t.getName()&&(e.name=t.getName());let a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let n=Bh(t.getProperty(s));e.properties[s]=n}}return e}function Bh(t){let e={attribute:t.getAttribute()};return t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),e}function jh(t,e){let a={class:e.getClass()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let n of s){let r=Ph(t,e.getProperty(n));a.properties[n]=r}}return a}function Ph(t,e){let a=e.getTexture(),s=e.getTextureInfo(),n=e.getChannels(),r=t.createTextureInfoDef(a,s);return ie.eq(n,[0])||(r.channels=n),e.getOffset()!=null&&(r.offset=e.getOffset()),e.getScale()!=null&&(r.scale=e.getScale()),e.getMax()!=null&&(r.max=e.getMax()),e.getMin()!=null&&(r.min=e.getMin()),r}function ir(t,e){let a=t.jsonDoc,s=a.json.buffers||[],n=(a.json.bufferViews||[])[e],r=s[n.buffer],i=r.uri?a.resources[r.uri]:a.resources[vt],o=n.byteOffset||0,c=n.byteLength;return i.slice(o,o+c)}function Oh(t,e){let a=t.getRoot().listBuffers()[0],s=e.otherBufferViews.get(a);return s||(s=[],e.otherBufferViews.set(a,s)),s}var Dh=class{match(t){return t.length>=12&&H.decodeText(t.slice(4,12))==="ftypavif"}getSize(t){if(!this.match(t))return null;let e=new DataView(t.buffer,t.byteOffset,t.byteLength),a=So(e,0);if(!a)return null;let s=a.end;for(;a=So(e,s);)if(a.type==="meta")s=a.start+4;else if(a.type==="iprp"||a.type==="ipco")s=a.start;else{if(a.type==="ispe")return[e.getUint32(a.start+4),e.getUint32(a.start+8)];if(a.type==="mdat")break;s=a.end}return null}getChannels(t){return 4}},Lh=class extends te{extensionName=_s;prereadTypes=[C.TEXTURE];static EXTENSION_NAME=_s;static register(){tt.registerFormat("image/avif",new Dh)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_avif&&(e.source=e.extensions[_s].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/avif"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(n=>{n.source===s&&(n.extensions=n.extensions||{},n.extensions[_s]={source:n.source},delete n.source)})}}),this}};function So(t,e){if(t.byteLength<4+e)return null;let a=t.getUint32(e);return t.byteLength<a+e||a<8?null:{type:H.decodeText(new Uint8Array(t.buffer,t.byteOffset+e+4,4)),start:e+8,end:e+a}}var Uh=class{match(t){return t.length>=12&&t[8]===87&&t[9]===69&&t[10]===66&&t[11]===80}getSize(t){let e=H.decodeText(t.slice(0,4)),a=H.decodeText(t.slice(8,12));if(e!=="RIFF"||a!=="WEBP")return null;let s=new DataView(t.buffer,t.byteOffset),n=12;for(;n<s.byteLength;){let r=H.decodeText(new Uint8Array([s.getUint8(n),s.getUint8(n+1),s.getUint8(n+2),s.getUint8(n+3)])),i=s.getUint32(n+4,!0);if(r==="VP8 ")return[s.getInt16(n+14,!0)&16383,s.getInt16(n+16,!0)&16383];if(r==="VP8L"){let o=s.getUint8(n+9),c=s.getUint8(n+10),d=s.getUint8(n+11),h=s.getUint8(n+12);return[1+((c&63)<<8|o),1+((h&15)<<10|d<<2|(c&192)>>6)]}n+=8+i+i%2}return null}getChannels(t){return 4}},Gh=class extends te{extensionName=As;prereadTypes=[C.TEXTURE];static EXTENSION_NAME=As;static register(){tt.registerFormat("image/webp",new Uh)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_webp&&(e.source=e.extensions[As].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/webp"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(n=>{n.source===s&&(n.extensions=n.extensions||{},n.extensions[As]={source:n.source},delete n.source)})}}),this}},Ro=Cf,Kh=class extends te{extensionName=Ro;static EXTENSION_NAME=Ro;read(t){return this}write(t){return this}},Ao=Ff,zh=class extends te{extensionName=Ao;static EXTENSION_NAME=Ao;read(t){return this}write(t){return this}},he,zo,Vo;function Vh(t,e){let a=new he.DecoderBuffer;try{if(a.Init(e,e.length),t.GetEncodedGeometryType(a)!==he.TRIANGULAR_MESH)throw new Error(`[${le}] Unknown geometry type.`);let s=new he.Mesh;if(!t.DecodeBufferToMesh(a,s).ok()||s.ptr===0)throw new Error(`[${le}] Decoding failure.`);return s}finally{he.destroy(a)}}function Hh(t,e){let a=e.num_faces()*3,s,n;if(e.num_points()<=65534){let r=a*Uint16Array.BYTES_PER_ELEMENT;s=he._malloc(r),t.GetTrianglesUInt16Array(e,r,s),n=new Uint16Array(he.HEAPU16.buffer,s,a).slice()}else{let r=a*Uint32Array.BYTES_PER_ELEMENT;s=he._malloc(r),t.GetTrianglesUInt32Array(e,r,s),n=new Uint32Array(he.HEAPU32.buffer,s,a).slice()}return he._free(s),n}function qh(t,e,a,s){let n=Vo[s.componentType],r=zo[s.componentType],i=a.num_components(),o=e.num_points()*i,c=o*r.BYTES_PER_ELEMENT,d=he._malloc(c);t.GetAttributeDataArrayForAllPoints(e,a,n,c,d);let h=new r(he.HEAPF32.buffer,d,o).slice();return he._free(d),h}function Xh(t){he=t,zo={[U.ComponentType.FLOAT]:Float32Array,[U.ComponentType.UNSIGNED_INT]:Uint32Array,[U.ComponentType.UNSIGNED_SHORT]:Uint16Array,[U.ComponentType.UNSIGNED_BYTE]:Uint8Array,[U.ComponentType.SHORT]:Int16Array,[U.ComponentType.BYTE]:Int8Array},Vo={[U.ComponentType.FLOAT]:he.DT_FLOAT32,[U.ComponentType.UNSIGNED_INT]:he.DT_UINT32,[U.ComponentType.UNSIGNED_SHORT]:he.DT_UINT16,[U.ComponentType.UNSIGNED_BYTE]:he.DT_UINT8,[U.ComponentType.SHORT]:he.DT_INT16,[U.ComponentType.BYTE]:he.DT_INT8}}var Ge,Wh=(function(t){return t[t.EDGEBREAKER=1]="EDGEBREAKER",t[t.SEQUENTIAL=0]="SEQUENTIAL",t})({}),Ho={POSITION:14,NORMAL:10,COLOR:8,TEX_COORD:12,GENERIC:12},_o={decodeSpeed:5,encodeSpeed:5,method:1,quantizationBits:Ho,quantizationVolume:"mesh"};function $h(t){Ge=t}function Yh(t,e=_o){let a={..._o,...e};a.quantizationBits={...Ho,...e.quantizationBits};let s=new Ge.MeshBuilder,n=new Ge.Mesh,r=new Ge.ExpertEncoder(n),i={},o=new Ge.DracoInt8Array,c=t.listTargets().length>0,d=!1;for(let l of t.listSemantics()){let y=t.getAttribute(l);if(y.getSparse()){d=!0;continue}let b=Jh(l),g=Qh(s,y.getComponentType(),n,Ge[b],y.getCount(),y.getElementSize(),y.getArray());if(g===-1)throw new Error(`Error compressing "${l}" attribute.`);if(i[l]=g,a.quantizationVolume==="mesh"||l!=="POSITION")r.SetAttributeQuantization(g,a.quantizationBits[b]);else if(typeof a.quantizationVolume=="object"){let{quantizationVolume:x}=a,M=Math.max(x.max[0]-x.min[0],x.max[1]-x.min[1],x.max[2]-x.min[2]);r.SetAttributeExplicitQuantization(g,a.quantizationBits[b],y.getElementSize(),x.min,M)}else throw new Error("Invalid quantization volume state.")}let h=t.getIndices();if(!h)throw new dr("Primitive must have indices.");s.AddFacesToMesh(n,h.getCount()/3,h.getArray()),r.SetSpeedOptions(a.encodeSpeed,a.decodeSpeed),r.SetTrackEncodedProperties(!0),a.method===0||c||d?r.SetEncodingMethod(Ge.MESH_SEQUENTIAL_ENCODING):r.SetEncodingMethod(Ge.MESH_EDGEBREAKER_ENCODING);let u=r.EncodeToDracoBuffer(!(c||d),o);if(u<=0)throw new dr("Error applying Draco compression.");let m=new Uint8Array(u);for(let l=0;l<u;++l)m[l]=o.GetValue(l);let p=r.GetNumberOfEncodedPoints(),f=r.GetNumberOfEncodedFaces()*3;return Ge.destroy(o),Ge.destroy(n),Ge.destroy(s),Ge.destroy(r),{numVertices:p,numIndices:f,data:m,attributeIDs:i}}function Jh(t){return t==="POSITION"?"POSITION":t==="NORMAL"?"NORMAL":t.startsWith("COLOR_")?"COLOR":t.startsWith("TEXCOORD_")?"TEX_COORD":"GENERIC"}function Qh(t,e,a,s,n,r,i){switch(e){case U.ComponentType.UNSIGNED_BYTE:return t.AddUInt8Attribute(a,s,n,r,i);case U.ComponentType.BYTE:return t.AddInt8Attribute(a,s,n,r,i);case U.ComponentType.UNSIGNED_SHORT:return t.AddUInt16Attribute(a,s,n,r,i);case U.ComponentType.SHORT:return t.AddInt16Attribute(a,s,n,r,i);case U.ComponentType.UNSIGNED_INT:return t.AddUInt32Attribute(a,s,n,r,i);case U.ComponentType.FLOAT:return t.AddFloatAttribute(a,s,n,r,i);default:throw new Error(`Unexpected component type, "${e}".`)}}var dr=class extends Error{},Zh=class extends te{extensionName=le;prereadTypes=[C.PRIMITIVE];prewriteTypes=[C.ACCESSOR];readDependencies=["draco3d.decoder"];writeDependencies=["draco3d.encoder"];static EXTENSION_NAME=le;static EncoderMethod=Wh;_decoderModule=null;_encoderModule=null;_encoderOptions={};install(t,e){return t==="draco3d.decoder"&&(this._decoderModule=e,Xh(this._decoderModule)),t==="draco3d.encoder"&&(this._encoderModule=e,$h(this._encoderModule)),this}setEncoderOptions(t){return this._encoderOptions=t,this}preread(t){if(!this._decoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.decoder".`);let e=this.document.getLogger(),a=t.jsonDoc,s=new Map;try{let n=a.json.meshes||[];for(let r of n)for(let i of r.primitives){if(!i.extensions||!i.extensions.KHR_draco_mesh_compression)continue;let o=i.extensions[le],[c,d]=s.get(o.bufferView)||[];if(!d||!c){let h=a.json.bufferViews[o.bufferView],u=a.json.buffers[h.buffer],m=u.uri?a.resources[u.uri]:a.resources[vt],p=h.byteOffset||0,f=h.byteLength,l=H.toView(m,p,f);c=new this._decoderModule.Decoder,d=Vh(c,l),s.set(o.bufferView,[c,d]),e.debug(`[${le}] Decompressed ${l.byteLength} bytes.`)}for(let h in o.attributes){let u=t.jsonDoc.json.accessors[i.attributes[h]],m=c.GetAttributeByUniqueId(d,o.attributes[h]),p=qh(c,d,m,u);t.accessors[i.attributes[h]].setArray(p)}i.indices!==void 0&&t.accessors[i.indices].setArray(Hh(c,d))}}finally{for(let[n,r]of Array.from(s.values()))this._decoderModule.destroy(n),this._decoderModule.destroy(r)}return this}read(t){return this}prewrite(t,e){if(!this._encoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.encoder".`);let a=this.document.getLogger();a.debug(`[${le}] Compression options: ${JSON.stringify(this._encoderOptions)}`);let s=eb(this.document),n=new Map,r="mesh";this._encoderOptions.quantizationVolume==="scene"&&(this.document.getRoot().listScenes().length!==1?a.warn(`[${le}]: quantizationVolume=scene requires exactly 1 scene.`):r=ao(this.document.getRoot().listScenes().pop()));for(let i of Array.from(s.keys())){let o=s.get(i);if(!o)throw new Error("Unexpected primitive.");if(n.has(o)){n.set(o,n.get(o));continue}let c=i.getIndices(),d=t.jsonDoc.json.accessors,h;try{h=Yh(i,{...this._encoderOptions,quantizationVolume:r})}catch(p){if(p instanceof dr){a.warn(`[${le}]: ${p.message} Skipping primitive compression.`);continue}throw p}n.set(o,h);let u=t.createAccessorDef(c);u.count=h.numIndices,t.accessorIndexMap.set(c,d.length),d.push(u),h.numVertices>65534&&U.getComponentSize(u.componentType)<=2?u.componentType=U.ComponentType.UNSIGNED_INT:h.numVertices>254&&U.getComponentSize(u.componentType)<=1&&(u.componentType=U.ComponentType.UNSIGNED_SHORT);for(let p of i.listSemantics()){let f=i.getAttribute(p);if(h.attributeIDs[p]===void 0)continue;let l=t.createAccessorDef(f);l.count=h.numVertices,t.accessorIndexMap.set(f,d.length),d.push(l)}let m=i.getAttribute("POSITION").getBuffer()||this.document.getRoot().listBuffers()[0];t.otherBufferViews.has(m)||t.otherBufferViews.set(m,[]),t.otherBufferViews.get(m).push(h.data)}return a.debug(`[${le}] Compressed ${s.size} primitives.`),t.extensionData[le]={primitiveHashMap:s,primitiveEncodingMap:n},this}write(t){let e=t.extensionData[le];for(let a of this.document.getRoot().listMeshes()){let s=t.jsonDoc.json.meshes[t.meshIndexMap.get(a)];for(let n=0;n<a.listPrimitives().length;n++){let r=a.listPrimitives()[n],i=s.primitives[n],o=e.primitiveHashMap.get(r);if(!o)continue;let c=e.primitiveEncodingMap.get(o);c&&(i.extensions=i.extensions||{},i.extensions[le]={bufferView:t.otherBufferViewsIndexMap.get(c.data),attributes:c.attributeIDs})}}if(!e.primitiveHashMap.size){let a=t.jsonDoc.json;a.extensionsUsed=(a.extensionsUsed||[]).filter(s=>s!==le),a.extensionsRequired=(a.extensionsRequired||[]).filter(s=>s!==le)}return this}};function eb(t){let e=t.getLogger(),a=new Set,s=new Set,n=0,r=0;for(let u of t.getRoot().listMeshes())for(let m of u.listPrimitives())m.getIndices()?m.getMode()!==ja.Mode.TRIANGLES?(s.add(m),r++):a.add(m):(s.add(m),n++);n>0&&e.warn(`[${le}] Skipping Draco compression of ${n} non-indexed primitives.`),r>0&&e.warn(`[${le}] Skipping Draco compression of ${r} non-TRIANGLES primitives.`);let i=t.getRoot().listAccessors(),o=new Map;for(let u=0;u<i.length;u++)o.set(i[u],u);let c=new Map,d=new Set,h=new Map;for(let u of Array.from(a)){let m=No(u,o);if(d.has(m)){h.set(u,m);continue}if(c.has(u.getIndices())){let p=u.getIndices(),f=p.clone();o.set(f,t.getRoot().listAccessors().length-1),u.swap(p,f)}for(let p of u.listAttributes())if(c.has(p)){let f=p.clone();o.set(f,t.getRoot().listAccessors().length-1),u.swap(p,f)}m=No(u,o),d.add(m),h.set(u,m),c.set(u.getIndices(),m);for(let p of u.listAttributes())c.set(p,m)}for(let u of Array.from(c.keys())){let m=new Set(u.listParents().map(p=>p.propertyType));if(m.size!==2||!m.has(C.PRIMITIVE)||!m.has(C.ROOT))throw new Error(`[${le}] Compressed accessors must only be used as indices or vertex attributes.`)}for(let u of Array.from(a)){let m=h.get(u),p=u.getIndices();if(c.get(p)!==m||u.listAttributes().some(f=>c.get(f)!==m))throw new Error(`[${le}] Draco primitives must share all, or no, accessors.`)}for(let u of Array.from(s)){let m=u.getIndices();if(c.has(m)||u.listAttributes().some(p=>c.has(p)))throw new Error(`[${le}] Accessor cannot be shared by compressed and uncompressed primitives.`)}return h}function No(t,e){let a=[],s=t.getIndices();a.push(e.get(s));for(let n of t.listAttributes())a.push(e.get(n));return a.sort().join("|")}var Co=class qo extends X{static EXTENSION_NAME=ct;static Type={POINT:"point",SPOT:"spot",DIRECTIONAL:"directional"};init(){this.extensionName=ct,this.propertyType="Light",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{color:[1,1,1],intensity:1,type:qo.Type.POINT,range:null,innerConeAngle:0,outerConeAngle:Math.PI/4})}getColor(){return this.get("color")}setColor(e){return this.set("color",e)}getIntensity(){return this.get("intensity")}setIntensity(e){return this.set("intensity",e)}getType(){return this.get("type")}setType(e){return this.set("type",e)}getRange(){return this.get("range")}setRange(e){return this.set("range",e)}getInnerConeAngle(){return this.get("innerConeAngle")}setInnerConeAngle(e){return this.set("innerConeAngle",e)}getOuterConeAngle(){return this.get("outerConeAngle")}setOuterConeAngle(e){return this.set("outerConeAngle",e)}},tb=class extends te{extensionName=ct;static EXTENSION_NAME=ct;createLight(t=""){return new Co(this.document.getGraph(),t)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_lights_punctual)return this;let a=(e.json.extensions.KHR_lights_punctual.lights||[]).map(s=>{let n=this.createLight().setName(s.name||"").setType(s.type);return s.extras&&n.setExtras(s.extras),s.color!==void 0&&n.setColor(s.color),s.intensity!==void 0&&n.setIntensity(s.intensity),s.range!==void 0&&n.setRange(s.range),s.spot?.innerConeAngle!==void 0&&n.setInnerConeAngle(s.spot.innerConeAngle),s.spot?.outerConeAngle!==void 0&&n.setOuterConeAngle(s.spot.outerConeAngle),n});return e.json.nodes.forEach((s,n)=>{if(!s.extensions||!s.extensions.KHR_lights_punctual)return;let r=s.extensions[ct];t.nodes[n].setExtension(ct,a[r.light])}),this}write(t){let e=t.jsonDoc;if(this.properties.size===0)return this;let a=[],s=new Map;for(let n of this.properties){let r=n,i=t.createPropertyDef(n);i.type=r.getType(),ie.eq(r.getColor(),[1,1,1])||(i.color=r.getColor()),r.getIntensity()!==1&&(i.intensity=r.getIntensity()),r.getRange()!=null&&(i.range=r.getRange()),r.getName()&&(i.name=r.getName()),r.getType()===Co.Type.SPOT&&(i.spot={innerConeAngle:r.getInnerConeAngle(),outerConeAngle:r.getOuterConeAngle()}),a.push(i),s.set(r,a.length-1)}return this.document.getRoot().listNodes().forEach(n=>{let r=n.getExtension(ct);if(r){let i=t.nodeIndexMap.get(n),o=e.json.nodes[i];o.extensions=o.extensions||{},o.extensions[ct]={light:s.get(r)}}}),e.json.extensions=e.json.extensions||{},e.json.extensions[ct]={lights:a},this}},{R:ab,G:sb,B:nb}=Xe,rb=class extends X{static EXTENSION_NAME=Et;init(){this.extensionName=Et,this.propertyType="Anisotropy",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{anisotropyStrength:0,anisotropyRotation:0,anisotropyTexture:null,anisotropyTextureInfo:new ne(this.graph,"anisotropyTextureInfo")})}getAnisotropyStrength(){return this.get("anisotropyStrength")}setAnisotropyStrength(t){return this.set("anisotropyStrength",t)}getAnisotropyRotation(){return this.get("anisotropyRotation")}setAnisotropyRotation(t){return this.set("anisotropyRotation",t)}getAnisotropyTexture(){return this.getRef("anisotropyTexture")}getAnisotropyTextureInfo(){return this.getRef("anisotropyTexture")?this.getRef("anisotropyTextureInfo"):null}setAnisotropyTexture(t){return this.setRef("anisotropyTexture",t,{channels:ab|sb|nb})}},ib=class extends te{static EXTENSION_NAME=Et;extensionName=Et;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createAnisotropy(){return new rb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_anisotropy){let i=this.createAnisotropy();t.materials[r].setExtension(Et,i);let o=n.extensions[Et];if(o.extras&&i.setExtras(o.extras),o.anisotropyStrength!==void 0&&i.setAnisotropyStrength(o.anisotropyStrength),o.anisotropyRotation!==void 0&&i.setAnisotropyRotation(o.anisotropyRotation),o.anisotropyTexture!==void 0){let c=o.anisotropyTexture,d=t.textures[s[c.index].source];i.setAnisotropyTexture(d),t.setTextureInfo(i.getAnisotropyTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Et);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Et]=i,s.getAnisotropyStrength()>0&&(i.anisotropyStrength=s.getAnisotropyStrength()),s.getAnisotropyRotation()!==0&&(i.anisotropyRotation=s.getAnisotropyRotation()),s.getAnisotropyTexture()){let o=s.getAnisotropyTexture(),c=s.getAnisotropyTextureInfo();i.anisotropyTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Fo,G:Bo,B:ob}=Xe,cb=class extends X{static EXTENSION_NAME=Tt;init(){this.extensionName=Tt,this.propertyType="Clearcoat",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{clearcoatFactor:0,clearcoatTexture:null,clearcoatTextureInfo:new ne(this.graph,"clearcoatTextureInfo"),clearcoatRoughnessFactor:0,clearcoatRoughnessTexture:null,clearcoatRoughnessTextureInfo:new ne(this.graph,"clearcoatRoughnessTextureInfo"),clearcoatNormalScale:1,clearcoatNormalTexture:null,clearcoatNormalTextureInfo:new ne(this.graph,"clearcoatNormalTextureInfo")})}getClearcoatFactor(){return this.get("clearcoatFactor")}setClearcoatFactor(t){return this.set("clearcoatFactor",t)}getClearcoatTexture(){return this.getRef("clearcoatTexture")}getClearcoatTextureInfo(){return this.getRef("clearcoatTexture")?this.getRef("clearcoatTextureInfo"):null}setClearcoatTexture(t){return this.setRef("clearcoatTexture",t,{channels:Fo})}getClearcoatRoughnessFactor(){return this.get("clearcoatRoughnessFactor")}setClearcoatRoughnessFactor(t){return this.set("clearcoatRoughnessFactor",t)}getClearcoatRoughnessTexture(){return this.getRef("clearcoatRoughnessTexture")}getClearcoatRoughnessTextureInfo(){return this.getRef("clearcoatRoughnessTexture")?this.getRef("clearcoatRoughnessTextureInfo"):null}setClearcoatRoughnessTexture(t){return this.setRef("clearcoatRoughnessTexture",t,{channels:Bo})}getClearcoatNormalScale(){return this.get("clearcoatNormalScale")}setClearcoatNormalScale(t){return this.set("clearcoatNormalScale",t)}getClearcoatNormalTexture(){return this.getRef("clearcoatNormalTexture")}getClearcoatNormalTextureInfo(){return this.getRef("clearcoatNormalTexture")?this.getRef("clearcoatNormalTextureInfo"):null}setClearcoatNormalTexture(t){return this.setRef("clearcoatNormalTexture",t,{channels:Fo|Bo|ob})}},lb=class extends te{static EXTENSION_NAME=Tt;extensionName=Tt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createClearcoat(){return new cb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_clearcoat){let i=this.createClearcoat();t.materials[r].setExtension(Tt,i);let o=n.extensions[Tt];if(o.extras&&i.setExtras(o.extras),o.clearcoatFactor!==void 0&&i.setClearcoatFactor(o.clearcoatFactor),o.clearcoatRoughnessFactor!==void 0&&i.setClearcoatRoughnessFactor(o.clearcoatRoughnessFactor),o.clearcoatTexture!==void 0){let c=o.clearcoatTexture,d=t.textures[s[c.index].source];i.setClearcoatTexture(d),t.setTextureInfo(i.getClearcoatTextureInfo(),c)}if(o.clearcoatRoughnessTexture!==void 0){let c=o.clearcoatRoughnessTexture,d=t.textures[s[c.index].source];i.setClearcoatRoughnessTexture(d),t.setTextureInfo(i.getClearcoatRoughnessTextureInfo(),c)}if(o.clearcoatNormalTexture!==void 0){let c=o.clearcoatNormalTexture,d=t.textures[s[c.index].source];i.setClearcoatNormalTexture(d),t.setTextureInfo(i.getClearcoatNormalTextureInfo(),c),c.scale!==void 0&&i.setClearcoatNormalScale(c.scale)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Tt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Tt]=i,i.clearcoatFactor=s.getClearcoatFactor(),i.clearcoatRoughnessFactor=s.getClearcoatRoughnessFactor(),s.getClearcoatTexture()){let o=s.getClearcoatTexture(),c=s.getClearcoatTextureInfo();i.clearcoatTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatRoughnessTexture()){let o=s.getClearcoatRoughnessTexture(),c=s.getClearcoatRoughnessTextureInfo();i.clearcoatRoughnessTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatNormalTexture()){let o=s.getClearcoatNormalTexture(),c=s.getClearcoatNormalTextureInfo();i.clearcoatNormalTexture=t.createTextureInfoDef(o,c),s.getClearcoatNormalScale()!==1&&(i.clearcoatNormalTexture.scale=s.getClearcoatNormalScale())}}}),this}},{R:db,G:ub,B:fb,A:hb}=Xe,bb=class extends X{static EXTENSION_NAME=kt;init(){this.extensionName=kt,this.propertyType="DiffuseTransmission",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseTransmissionFactor:0,diffuseTransmissionTexture:null,diffuseTransmissionTextureInfo:new ne(this.graph,"diffuseTransmissionTextureInfo"),diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorTexture:null,diffuseTransmissionColorTextureInfo:new ne(this.graph,"diffuseTransmissionColorTextureInfo")})}getDiffuseTransmissionFactor(){return this.get("diffuseTransmissionFactor")}setDiffuseTransmissionFactor(t){return this.set("diffuseTransmissionFactor",t)}getDiffuseTransmissionTexture(){return this.getRef("diffuseTransmissionTexture")}getDiffuseTransmissionTextureInfo(){return this.getRef("diffuseTransmissionTexture")?this.getRef("diffuseTransmissionTextureInfo"):null}setDiffuseTransmissionTexture(t){return this.setRef("diffuseTransmissionTexture",t,{channels:hb})}getDiffuseTransmissionColorFactor(){return this.get("diffuseTransmissionColorFactor")}setDiffuseTransmissionColorFactor(t){return this.set("diffuseTransmissionColorFactor",t)}getDiffuseTransmissionColorTexture(){return this.getRef("diffuseTransmissionColorTexture")}getDiffuseTransmissionColorTextureInfo(){return this.getRef("diffuseTransmissionColorTexture")?this.getRef("diffuseTransmissionColorTextureInfo"):null}setDiffuseTransmissionColorTexture(t){return this.setRef("diffuseTransmissionColorTexture",t,{channels:db|ub|fb})}},pb=class extends te{extensionName=kt;static EXTENSION_NAME=kt;createDiffuseTransmission(){return new bb(this.document.getGraph())}read(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_diffuse_transmission){let i=this.createDiffuseTransmission();t.materials[r].setExtension(kt,i);let o=n.extensions[kt];if(o.extras&&i.setExtras(o.extras),o.diffuseTransmissionFactor!==void 0&&i.setDiffuseTransmissionFactor(o.diffuseTransmissionFactor),o.diffuseTransmissionColorFactor!==void 0&&i.setDiffuseTransmissionColorFactor(o.diffuseTransmissionColorFactor),o.diffuseTransmissionTexture!==void 0){let c=o.diffuseTransmissionTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionTexture(d),t.setTextureInfo(i.getDiffuseTransmissionTextureInfo(),c)}if(o.diffuseTransmissionColorTexture!==void 0){let c=o.diffuseTransmissionColorTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionColorTexture(d),t.setTextureInfo(i.getDiffuseTransmissionColorTextureInfo(),c)}}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listMaterials()){let s=a.getExtension(kt);if(!s)continue;let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[kt]=i,i.diffuseTransmissionFactor=s.getDiffuseTransmissionFactor(),i.diffuseTransmissionColorFactor=s.getDiffuseTransmissionColorFactor(),s.getDiffuseTransmissionTexture()){let o=s.getDiffuseTransmissionTexture(),c=s.getDiffuseTransmissionTextureInfo();i.diffuseTransmissionTexture=t.createTextureInfoDef(o,c)}if(s.getDiffuseTransmissionColorTexture()){let o=s.getDiffuseTransmissionColorTexture(),c=s.getDiffuseTransmissionColorTextureInfo();i.diffuseTransmissionColorTexture=t.createTextureInfoDef(o,c)}}return this}},mb=class extends X{static EXTENSION_NAME=It;init(){this.extensionName=It,this.propertyType="Dispersion",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{dispersion:0})}getDispersion(){return this.get("dispersion")}setDispersion(t){return this.set("dispersion",t)}},gb=class extends te{static EXTENSION_NAME=It;extensionName=It;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createDispersion(){return new mb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_dispersion){let s=this.createDispersion();t.materials[a].setExtension(It,s);let n=e.extensions[It];n.extras&&s.setExtras(n.extras),n.dispersion!==void 0&&s.setDispersion(n.dispersion)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(It);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);r.extensions=r.extensions||{},r.extensions[It]=i,i.dispersion=s.getDispersion()}}),this}},yb=class extends X{static EXTENSION_NAME=St;init(){this.extensionName=St,this.propertyType="EmissiveStrength",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{emissiveStrength:1})}getEmissiveStrength(){return this.get("emissiveStrength")}setEmissiveStrength(t){return this.set("emissiveStrength",t)}},xb=class extends te{static EXTENSION_NAME=St;extensionName=St;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createEmissiveStrength(){return new yb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_emissive_strength){let s=this.createEmissiveStrength();t.materials[a].setExtension(St,s);let n=e.extensions[St];n.extras&&s.setExtras(n.extras),n.emissiveStrength!==void 0&&s.setEmissiveStrength(n.emissiveStrength)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(St);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);r.extensions=r.extensions||{},r.extensions[St]=i,i.emissiveStrength=s.getEmissiveStrength()}}),this}},vb=class extends X{static EXTENSION_NAME=Rt;init(){this.extensionName=Rt,this.propertyType="IOR",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{ior:1.5})}getIOR(){return this.get("ior")}setIOR(t){return this.set("ior",t)}},wb=class extends te{static EXTENSION_NAME=Rt;extensionName=Rt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createIOR(){return new vb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_ior){let s=this.createIOR();t.materials[a].setExtension(Rt,s);let n=e.extensions[Rt];n.extras&&s.setExtras(n.extras),n.ior!==void 0&&s.setIOR(n.ior)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Rt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);r.extensions=r.extensions||{},r.extensions[Rt]=i,i.ior=s.getIOR()}}),this}},{R:Mb,G:Eb}=Xe,Tb=class extends X{static EXTENSION_NAME=At;init(){this.extensionName=At,this.propertyType="Iridescence",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{iridescenceFactor:0,iridescenceTexture:null,iridescenceTextureInfo:new ne(this.graph,"iridescenceTextureInfo"),iridescenceIOR:1.3,iridescenceThicknessMinimum:100,iridescenceThicknessMaximum:400,iridescenceThicknessTexture:null,iridescenceThicknessTextureInfo:new ne(this.graph,"iridescenceThicknessTextureInfo")})}getIridescenceFactor(){return this.get("iridescenceFactor")}setIridescenceFactor(t){return this.set("iridescenceFactor",t)}getIridescenceTexture(){return this.getRef("iridescenceTexture")}getIridescenceTextureInfo(){return this.getRef("iridescenceTexture")?this.getRef("iridescenceTextureInfo"):null}setIridescenceTexture(t){return this.setRef("iridescenceTexture",t,{channels:Mb})}getIridescenceIOR(){return this.get("iridescenceIOR")}setIridescenceIOR(t){return this.set("iridescenceIOR",t)}getIridescenceThicknessMinimum(){return this.get("iridescenceThicknessMinimum")}setIridescenceThicknessMinimum(t){return this.set("iridescenceThicknessMinimum",t)}getIridescenceThicknessMaximum(){return this.get("iridescenceThicknessMaximum")}setIridescenceThicknessMaximum(t){return this.set("iridescenceThicknessMaximum",t)}getIridescenceThicknessTexture(){return this.getRef("iridescenceThicknessTexture")}getIridescenceThicknessTextureInfo(){return this.getRef("iridescenceThicknessTexture")?this.getRef("iridescenceThicknessTextureInfo"):null}setIridescenceThicknessTexture(t){return this.setRef("iridescenceThicknessTexture",t,{channels:Eb})}},kb=class extends te{static EXTENSION_NAME=At;extensionName=At;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createIridescence(){return new Tb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_iridescence){let i=this.createIridescence();t.materials[r].setExtension(At,i);let o=n.extensions[At];if(o.extras&&i.setExtras(o.extras),o.iridescenceFactor!==void 0&&i.setIridescenceFactor(o.iridescenceFactor),o.iridescenceIor!==void 0&&i.setIridescenceIOR(o.iridescenceIor),o.iridescenceThicknessMinimum!==void 0&&i.setIridescenceThicknessMinimum(o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&i.setIridescenceThicknessMaximum(o.iridescenceThicknessMaximum),o.iridescenceTexture!==void 0){let c=o.iridescenceTexture,d=t.textures[s[c.index].source];i.setIridescenceTexture(d),t.setTextureInfo(i.getIridescenceTextureInfo(),c)}if(o.iridescenceThicknessTexture!==void 0){let c=o.iridescenceThicknessTexture,d=t.textures[s[c.index].source];i.setIridescenceThicknessTexture(d),t.setTextureInfo(i.getIridescenceThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(At);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[At]=i,s.getIridescenceFactor()>0&&(i.iridescenceFactor=s.getIridescenceFactor()),s.getIridescenceIOR()!==1.3&&(i.iridescenceIor=s.getIridescenceIOR()),s.getIridescenceThicknessMinimum()!==100&&(i.iridescenceThicknessMinimum=s.getIridescenceThicknessMinimum()),s.getIridescenceThicknessMaximum()!==400&&(i.iridescenceThicknessMaximum=s.getIridescenceThicknessMaximum()),s.getIridescenceTexture()){let o=s.getIridescenceTexture(),c=s.getIridescenceTextureInfo();i.iridescenceTexture=t.createTextureInfoDef(o,c)}if(s.getIridescenceThicknessTexture()){let o=s.getIridescenceThicknessTexture(),c=s.getIridescenceThicknessTextureInfo();i.iridescenceThicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:jo,G:Po,B:Oo,A:Do}=Xe,Ib=class extends X{static EXTENSION_NAME=_t;init(){this.extensionName=_t,this.propertyType="PBRSpecularGlossiness",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseFactor:[1,1,1,1],diffuseTexture:null,diffuseTextureInfo:new ne(this.graph,"diffuseTextureInfo"),specularFactor:[1,1,1],glossinessFactor:1,specularGlossinessTexture:null,specularGlossinessTextureInfo:new ne(this.graph,"specularGlossinessTextureInfo")})}getDiffuseFactor(){return this.get("diffuseFactor")}setDiffuseFactor(t){return this.set("diffuseFactor",t)}getDiffuseTexture(){return this.getRef("diffuseTexture")}getDiffuseTextureInfo(){return this.getRef("diffuseTexture")?this.getRef("diffuseTextureInfo"):null}setDiffuseTexture(t){return this.setRef("diffuseTexture",t,{channels:jo|Po|Oo|Do,isColor:!0})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getGlossinessFactor(){return this.get("glossinessFactor")}setGlossinessFactor(t){return this.set("glossinessFactor",t)}getSpecularGlossinessTexture(){return this.getRef("specularGlossinessTexture")}getSpecularGlossinessTextureInfo(){return this.getRef("specularGlossinessTexture")?this.getRef("specularGlossinessTextureInfo"):null}setSpecularGlossinessTexture(t){return this.setRef("specularGlossinessTexture",t,{channels:jo|Po|Oo|Do})}},Sb=class extends te{static EXTENSION_NAME=_t;extensionName=_t;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createPBRSpecularGlossiness(){return new Ib(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_pbrSpecularGlossiness){let i=this.createPBRSpecularGlossiness();t.materials[r].setExtension(_t,i);let o=n.extensions[_t];if(o.extras&&i.setExtras(o.extras),o.diffuseFactor!==void 0&&i.setDiffuseFactor(o.diffuseFactor),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.glossinessFactor!==void 0&&i.setGlossinessFactor(o.glossinessFactor),o.diffuseTexture!==void 0){let c=o.diffuseTexture,d=t.textures[s[c.index].source];i.setDiffuseTexture(d),t.setTextureInfo(i.getDiffuseTextureInfo(),c)}if(o.specularGlossinessTexture!==void 0){let c=o.specularGlossinessTexture,d=t.textures[s[c.index].source];i.setSpecularGlossinessTexture(d),t.setTextureInfo(i.getSpecularGlossinessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(_t);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[_t]=i,i.diffuseFactor=s.getDiffuseFactor(),i.specularFactor=s.getSpecularFactor(),i.glossinessFactor=s.getGlossinessFactor(),s.getDiffuseTexture()){let o=s.getDiffuseTexture(),c=s.getDiffuseTextureInfo();i.diffuseTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularGlossinessTexture()){let o=s.getSpecularGlossinessTexture(),c=s.getSpecularGlossinessTextureInfo();i.specularGlossinessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Rb,G:Ab,B:_b,A:Nb}=Xe,Cb=class extends X{static EXTENSION_NAME=Nt;init(){this.extensionName=Nt,this.propertyType="Sheen",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{sheenColorFactor:[0,0,0],sheenColorTexture:null,sheenColorTextureInfo:new ne(this.graph,"sheenColorTextureInfo"),sheenRoughnessFactor:0,sheenRoughnessTexture:null,sheenRoughnessTextureInfo:new ne(this.graph,"sheenRoughnessTextureInfo")})}getSheenColorFactor(){return this.get("sheenColorFactor")}setSheenColorFactor(t){return this.set("sheenColorFactor",t)}getSheenColorTexture(){return this.getRef("sheenColorTexture")}getSheenColorTextureInfo(){return this.getRef("sheenColorTexture")?this.getRef("sheenColorTextureInfo"):null}setSheenColorTexture(t){return this.setRef("sheenColorTexture",t,{channels:Rb|Ab|_b,isColor:!0})}getSheenRoughnessFactor(){return this.get("sheenRoughnessFactor")}setSheenRoughnessFactor(t){return this.set("sheenRoughnessFactor",t)}getSheenRoughnessTexture(){return this.getRef("sheenRoughnessTexture")}getSheenRoughnessTextureInfo(){return this.getRef("sheenRoughnessTexture")?this.getRef("sheenRoughnessTextureInfo"):null}setSheenRoughnessTexture(t){return this.setRef("sheenRoughnessTexture",t,{channels:Nb})}},Fb=class extends te{static EXTENSION_NAME=Nt;extensionName=Nt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createSheen(){return new Cb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_sheen){let i=this.createSheen();t.materials[r].setExtension(Nt,i);let o=n.extensions[Nt];if(o.extras&&i.setExtras(o.extras),o.sheenColorFactor!==void 0&&i.setSheenColorFactor(o.sheenColorFactor),o.sheenRoughnessFactor!==void 0&&i.setSheenRoughnessFactor(o.sheenRoughnessFactor),o.sheenColorTexture!==void 0){let c=o.sheenColorTexture,d=t.textures[s[c.index].source];i.setSheenColorTexture(d),t.setTextureInfo(i.getSheenColorTextureInfo(),c)}if(o.sheenRoughnessTexture!==void 0){let c=o.sheenRoughnessTexture,d=t.textures[s[c.index].source];i.setSheenRoughnessTexture(d),t.setTextureInfo(i.getSheenRoughnessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Nt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Nt]=i,i.sheenColorFactor=s.getSheenColorFactor(),i.sheenRoughnessFactor=s.getSheenRoughnessFactor(),s.getSheenColorTexture()){let o=s.getSheenColorTexture(),c=s.getSheenColorTextureInfo();i.sheenColorTexture=t.createTextureInfoDef(o,c)}if(s.getSheenRoughnessTexture()){let o=s.getSheenRoughnessTexture(),c=s.getSheenRoughnessTextureInfo();i.sheenRoughnessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Bb,G:jb,B:Pb,A:Ob}=Xe,Db=class extends X{static EXTENSION_NAME=Ct;init(){this.extensionName=Ct,this.propertyType="Specular",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{specularFactor:1,specularTexture:null,specularTextureInfo:new ne(this.graph,"specularTextureInfo"),specularColorFactor:[1,1,1],specularColorTexture:null,specularColorTextureInfo:new ne(this.graph,"specularColorTextureInfo")})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getSpecularColorFactor(){return this.get("specularColorFactor")}setSpecularColorFactor(t){return this.set("specularColorFactor",t)}getSpecularTexture(){return this.getRef("specularTexture")}getSpecularTextureInfo(){return this.getRef("specularTexture")?this.getRef("specularTextureInfo"):null}setSpecularTexture(t){return this.setRef("specularTexture",t,{channels:Ob})}getSpecularColorTexture(){return this.getRef("specularColorTexture")}getSpecularColorTextureInfo(){return this.getRef("specularColorTexture")?this.getRef("specularColorTextureInfo"):null}setSpecularColorTexture(t){return this.setRef("specularColorTexture",t,{channels:Bb|jb|Pb,isColor:!0})}},Lb=class extends te{static EXTENSION_NAME=Ct;extensionName=Ct;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createSpecular(){return new Db(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_specular){let i=this.createSpecular();t.materials[r].setExtension(Ct,i);let o=n.extensions[Ct];if(o.extras&&i.setExtras(o.extras),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.specularColorFactor!==void 0&&i.setSpecularColorFactor(o.specularColorFactor),o.specularTexture!==void 0){let c=o.specularTexture,d=t.textures[s[c.index].source];i.setSpecularTexture(d),t.setTextureInfo(i.getSpecularTextureInfo(),c)}if(o.specularColorTexture!==void 0){let c=o.specularColorTexture,d=t.textures[s[c.index].source];i.setSpecularColorTexture(d),t.setTextureInfo(i.getSpecularColorTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Ct);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Ct]=i,s.getSpecularFactor()!==1&&(i.specularFactor=s.getSpecularFactor()),ie.eq(s.getSpecularColorFactor(),[1,1,1])||(i.specularColorFactor=s.getSpecularColorFactor()),s.getSpecularTexture()){let o=s.getSpecularTexture(),c=s.getSpecularTextureInfo();i.specularTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularColorTexture()){let o=s.getSpecularColorTexture(),c=s.getSpecularColorTextureInfo();i.specularColorTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Ub}=Xe,Gb=class extends X{static EXTENSION_NAME=Ft;init(){this.extensionName=Ft,this.propertyType="Transmission",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{transmissionFactor:0,transmissionTexture:null,transmissionTextureInfo:new ne(this.graph,"transmissionTextureInfo")})}getTransmissionFactor(){return this.get("transmissionFactor")}setTransmissionFactor(t){return this.set("transmissionFactor",t)}getTransmissionTexture(){return this.getRef("transmissionTexture")}getTransmissionTextureInfo(){return this.getRef("transmissionTexture")?this.getRef("transmissionTextureInfo"):null}setTransmissionTexture(t){return this.setRef("transmissionTexture",t,{channels:Ub})}},Kb=class extends te{static EXTENSION_NAME=Ft;extensionName=Ft;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createTransmission(){return new Gb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_transmission){let i=this.createTransmission();t.materials[r].setExtension(Ft,i);let o=n.extensions[Ft];if(o.extras&&i.setExtras(o.extras),o.transmissionFactor!==void 0&&i.setTransmissionFactor(o.transmissionFactor),o.transmissionTexture!==void 0){let c=o.transmissionTexture,d=t.textures[s[c.index].source];i.setTransmissionTexture(d),t.setTextureInfo(i.getTransmissionTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Ft);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Ft]=i,i.transmissionFactor=s.getTransmissionFactor(),s.getTransmissionTexture()){let o=s.getTransmissionTexture(),c=s.getTransmissionTextureInfo();i.transmissionTexture=t.createTextureInfoDef(o,c)}}}),this}},zb=class extends X{static EXTENSION_NAME=da;init(){this.extensionName=da,this.propertyType="Unlit",this.parentTypes=[C.MATERIAL]}},Vb=class extends te{static EXTENSION_NAME=da;extensionName=da;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createUnlit(){return new zb(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{e.extensions&&e.extensions.KHR_materials_unlit&&t.materials[a].setExtension(da,this.createUnlit())}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{if(a.getExtension("KHR_materials_unlit")){let s=t.materialIndexMap.get(a),n=e.json.materials[s];n.extensions=n.extensions||{},n.extensions[da]={}}}),this}},Hb=class extends X{static EXTENSION_NAME=je;init(){this.extensionName=je,this.propertyType="Mapping",this.parentTypes=["MappingList"]}getDefaults(){return Object.assign(super.getDefaults(),{material:null,variants:new se})}getMaterial(){return this.getRef("material")}setMaterial(t){return this.setRef("material",t)}addVariant(t){return this.addRef("variants",t)}removeVariant(t){return this.removeRef("variants",t)}listVariants(){return this.listRefs("variants")}},qb=class extends X{static EXTENSION_NAME=je;init(){this.extensionName=je,this.propertyType="MappingList",this.parentTypes=[C.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{mappings:new se})}addMapping(t){return this.addRef("mappings",t)}removeMapping(t){return this.removeRef("mappings",t)}listMappings(){return this.listRefs("mappings")}},Lo=class extends X{static EXTENSION_NAME=je;init(){this.extensionName=je,this.propertyType="Variant",this.parentTypes=["MappingList"]}},Xb=class extends te{extensionName=je;static EXTENSION_NAME=je;createMappingList(){return new qb(this.document.getGraph())}createVariant(t=""){return new Lo(this.document.getGraph(),t)}createMapping(){return new Hb(this.document.getGraph())}listVariants(){return Array.from(this.properties).filter(t=>t instanceof Lo)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_materials_variants)return this;let a=(e.json.extensions.KHR_materials_variants.variants||[]).map(s=>this.createVariant().setName(s.name||""));return(e.json.meshes||[]).forEach((s,n)=>{let r=t.meshes[n];(s.primitives||[]).forEach((i,o)=>{if(!i.extensions||!i.extensions.KHR_materials_variants)return;let c=this.createMappingList(),d=i.extensions[je];for(let h of d.mappings){let u=this.createMapping();h.material!==void 0&&u.setMaterial(t.materials[h.material]);for(let m of h.variants||[])u.addVariant(a[m]);c.addMapping(u)}r.listPrimitives()[o].setExtension(je,c)})}),this}write(t){let e=t.jsonDoc,a=this.listVariants();if(!a.length)return this;let s=[],n=new Map;for(let r of a)n.set(r,s.length),s.push(t.createPropertyDef(r));for(let r of this.document.getRoot().listMeshes()){let i=t.meshIndexMap.get(r);r.listPrimitives().forEach((o,c)=>{let d=o.getExtension(je);if(!d)return;let h=t.jsonDoc.json.meshes[i].primitives[c],u=d.listMappings().map(m=>{let p=t.createPropertyDef(m),f=m.getMaterial();return f&&(p.material=t.materialIndexMap.get(f)),p.variants=m.listVariants().map(l=>n.get(l)),p});h.extensions=h.extensions||{},h.extensions[je]={mappings:u}})}return e.json.extensions=e.json.extensions||{},e.json.extensions[je]={variants:s},this}},{G:Wb}=Xe,$b=class extends X{static EXTENSION_NAME=Bt;init(){this.extensionName=Bt,this.propertyType="Volume",this.parentTypes=[C.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{thicknessFactor:0,thicknessTexture:null,thicknessTextureInfo:new ne(this.graph,"thicknessTexture"),attenuationDistance:1/0,attenuationColor:[1,1,1]})}getThicknessFactor(){return this.get("thicknessFactor")}setThicknessFactor(t){return this.set("thicknessFactor",t)}getThicknessTexture(){return this.getRef("thicknessTexture")}getThicknessTextureInfo(){return this.getRef("thicknessTexture")?this.getRef("thicknessTextureInfo"):null}setThicknessTexture(t){return this.setRef("thicknessTexture",t,{channels:Wb})}getAttenuationDistance(){return this.get("attenuationDistance")}setAttenuationDistance(t){return this.set("attenuationDistance",t)}getAttenuationColor(){return this.get("attenuationColor")}setAttenuationColor(t){return this.set("attenuationColor",t)}},Yb=class extends te{static EXTENSION_NAME=Bt;extensionName=Bt;prereadTypes=[C.MESH];prewriteTypes=[C.MESH];createVolume(){return new $b(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((n,r)=>{if(n.extensions&&n.extensions.KHR_materials_volume){let i=this.createVolume();t.materials[r].setExtension(Bt,i);let o=n.extensions[Bt];if(o.extras&&i.setExtras(o.extras),o.thicknessFactor!==void 0&&i.setThicknessFactor(o.thicknessFactor),o.attenuationDistance!==void 0&&i.setAttenuationDistance(o.attenuationDistance),o.attenuationColor!==void 0&&i.setAttenuationColor(o.attenuationColor),o.thicknessTexture!==void 0){let c=o.thicknessTexture,d=t.textures[s[c.index].source];i.setThicknessTexture(d),t.setTextureInfo(i.getThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Bt);if(s){let n=t.materialIndexMap.get(a),r=e.json.materials[n],i=t.createPropertyDef(s);if(r.extensions=r.extensions||{},r.extensions[Bt]=i,s.getThicknessFactor()>0&&(i.thicknessFactor=s.getThicknessFactor()),Number.isFinite(s.getAttenuationDistance())&&(i.attenuationDistance=s.getAttenuationDistance()),ie.eq(s.getAttenuationColor(),[1,1,1])||(i.attenuationColor=s.getAttenuationColor()),s.getThicknessTexture()){let o=s.getThicknessTexture(),c=s.getThicknessTextureInfo();i.thicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},Jb=class extends te{extensionName=Mo;static EXTENSION_NAME=Mo;read(t){return this}write(t){return this}},hr=class extends te{extensionName=Eo;static EXTENSION_NAME=Eo;read(t){return this}write(t){return this}},Qb=class extends X{static EXTENSION_NAME=jt;init(){this.extensionName=jt,this.propertyType="Visibility",this.parentTypes=[C.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{visible:!0})}getVisible(){return this.get("visible")}setVisible(t){return this.set("visible",t)}},Zb=class extends te{static EXTENSION_NAME=jt;extensionName=jt;createVisibility(){return new Qb(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_node_visibility){let s=this.createVisibility();t.nodes[a].setExtension(jt,s);let n=e.extensions[jt];n.visible!==void 0&&s.setVisible(n.visible)}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listNodes()){let s=a.getExtension(jt);if(!s)continue;let n=t.nodeIndexMap.get(a),r=e.json.nodes[n];r.extensions=r.extensions||{},r.extensions[jt]={visible:s.getVisible()}}return this}};function ep(t){return t.vkFormat>0&&t.vkFormat<=123}function Uo(t){let e=t.vkFormat===1000066e3&&t.dataFormatDescriptor[0].colorModel===167;return t.vkFormat===0||e}var tp=class{match(t){return t[0]===171&&t[1]===75&&t[2]===84&&t[3]===88&&t[4]===32&&t[5]===50&&t[6]===48&&t[7]===187&&t[8]===13&&t[9]===10&&t[10]===26&&t[11]===10}getSize(t){let e=Rs(t);return[e.pixelWidth,e.pixelHeight]}getChannels(t){let e=Rs(t),a=e.dataFormatDescriptor[0];if(ep(e))return a.samples.length;if(Uo(e))switch(a.colorModel){case 163:return a.samples.length===2&&(a.samples[1].channelType&15)===15?4:3;case 166:return(a.samples[0].channelType&15)===3?4:3;default:throw new Error(`Unexpected KTX2 colorModel, "${a.colorModel}".`)}throw new Error(`Unexpected KTX2 vkFormat, "${e.vkFormat}".`)}getVRAMByteLength(t){let e=Rs(t),a=0;if(Uo(e)){let s=this.getChannels(t)>3;for(let n=0;n<e.levels.length;n++){let r=e.levels[n];if(r.uncompressedByteLength)a+=r.uncompressedByteLength;else{let i=Math.max(1,Math.floor(e.pixelWidth/Math.pow(2,n))),o=Math.max(1,Math.floor(e.pixelHeight/Math.pow(2,n))),c=s?16:8;a+=i/4*(o/4)*c}}}else for(let s of e.levels)e.supercompressionScheme===0?a+=s.levelData.byteLength:a+=s.uncompressedByteLength;return a}},ap=class extends te{static EXTENSION_NAME=Ns;extensionName=Ns;prereadTypes=[C.TEXTURE];static register(){tt.registerFormat("image/ktx2",new tp)}preread(t){return t.jsonDoc.json.textures&&t.jsonDoc.json.textures.forEach(e=>{e.extensions&&e.extensions.KHR_texture_basisu&&(e.source=e.extensions[Ns].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/ktx2"){let s=t.imageIndexMap.get(a);e.json.textures.forEach(n=>{n.source===s&&(n.extensions=n.extensions||{},n.extensions[Ns]={source:n.source},delete n.source)})}}),this}},sp=class extends X{static EXTENSION_NAME=Pt;init(){this.extensionName=Pt,this.propertyType="Transform",this.parentTypes=[C.TEXTURE_INFO]}getDefaults(){return Object.assign(super.getDefaults(),{offset:[0,0],rotation:0,scale:[1,1],texCoord:null})}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getRotation(){return this.get("rotation")}setRotation(t){return this.set("rotation",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getTexCoord(){return this.get("texCoord")}setTexCoord(t){return this.set("texCoord",t)}},np=class extends te{extensionName=Pt;static EXTENSION_NAME=Pt;createTransform(){return new sp(this.document.getGraph())}read(t){for(let[e,a]of Array.from(t.textureInfos.entries())){if(!a.extensions||!a.extensions.KHR_texture_transform)continue;let s=this.createTransform(),n=a.extensions[Pt];n.offset!==void 0&&s.setOffset(n.offset),n.rotation!==void 0&&s.setRotation(n.rotation),n.scale!==void 0&&s.setScale(n.scale),n.texCoord!==void 0&&s.setTexCoord(n.texCoord),e.setExtension(Pt,s)}return this}write(t){let e=Array.from(t.textureInfoDefMap.entries());for(let[a,s]of e){let n=a.getExtension(Pt);if(!n)continue;s.extensions=s.extensions||{};let r={},i=ie.eq;i(n.getOffset(),[0,0])||(r.offset=n.getOffset()),n.getRotation()!==0&&(r.rotation=n.getRotation()),i(n.getScale(),[1,1])||(r.scale=n.getScale()),n.getTexCoord()!=null&&(r.texCoord=n.getTexCoord()),s.extensions[Pt]=r}return this}},rp=[C.ROOT,C.SCENE,C.NODE,C.MESH,C.MATERIAL,C.TEXTURE,C.ANIMATION],ip=class extends X{static EXTENSION_NAME=We;init(){this.extensionName=We,this.propertyType="Packet",this.parentTypes=rp}getDefaults(){return Object.assign(super.getDefaults(),{context:{},properties:{}})}getContext(){return this.get("context")}setContext(t){return this.set("context",{...t})}listProperties(){return Object.keys(this.get("properties"))}getProperty(t){let e=this.get("properties");return t in e?e[t]:null}setProperty(t,e){this._assertContext(t);let a={...this.get("properties")};return e?a[t]=e:delete a[t],this.set("properties",a)}toJSONLD(){return{"@context":or(this.get("context")),...or(this.get("properties"))}}fromJSONLD(t){t=or(t);let e=t["@context"];return e&&this.set("context",e),delete t["@context"],this.set("properties",t)}_assertContext(t){if(!(t.split(":")[0]in this.get("context")))throw new Error(`${We}: Missing context for term, "${t}".`)}};function or(t){return JSON.parse(JSON.stringify(t))}var op=class extends te{extensionName=We;static EXTENSION_NAME=We;createPacket(){return new ip(this.document.getGraph())}listPackets(){return Array.from(this.properties)}read(t){let e=t.jsonDoc.json.extensions?.[We];if(!e||!e.packets)return this;let a=t.jsonDoc.json,s=this.document.getRoot(),n=e.packets.map(o=>this.createPacket().fromJSONLD(o)),r=[[a.asset],a.scenes,a.nodes,a.meshes,a.materials,a.images,a.animations],i=[[s],s.listScenes(),s.listNodes(),s.listMeshes(),s.listMaterials(),s.listTextures(),s.listAnimations()];for(let o=0;o<r.length;o++){let c=r[o]||[];for(let d=0;d<c.length;d++){let h=c[d];if(h.extensions&&h.extensions.KHR_xmp_json_ld){let u=h.extensions[We];i[o][d].setExtension(We,n[u.packet])}}}return this}write(t){let{json:e}=t.jsonDoc,a=[];for(let s of this.properties){a.push(s.toJSONLD());for(let n of s.listParents()){let r;switch(n.propertyType){case C.ROOT:r=e.asset;break;case C.SCENE:r=e.scenes[t.sceneIndexMap.get(n)];break;case C.NODE:r=e.nodes[t.nodeIndexMap.get(n)];break;case C.MESH:r=e.meshes[t.meshIndexMap.get(n)];break;case C.MATERIAL:r=e.materials[t.materialIndexMap.get(n)];break;case C.TEXTURE:r=e.images[t.imageIndexMap.get(n)];break;case C.ANIMATION:r=e.animations[t.animationIndexMap.get(n)];break;default:r=null,this.document.getLogger().warn(`[${We}]: Unsupported parent property, "${n.propertyType}"`);break}r&&(r.extensions=r.extensions||{},r.extensions[We]={packet:a.length-1})}}return a.length>0&&(e.extensions=e.extensions||{},e.extensions[We]={packets:a}),this}},cp=[Kh,zh,Zh,tb,ib,lb,pb,gb,xb,wb,kb,Sb,Lb,Fb,Kb,Vb,Xb,Yb,Jb,hr,Zb,ap,np,op],jx=[Gf,ur,fr,fh,Lh,Gh,...cp];var ew=(function(){var t="b9H79Tebbbe9ok9Geueu9Geub9Gbb9Gruuuuuuueu9Gvuuuuueu9Gduueu9Gluuuueu9Gvuuuuub9Gouuuuuub9Gluuuub9Giuuueui8AYdilveoveovrrwrrDDoDrbqqbelve9Weiiviebeoweuec;G:Qdkr:nlAo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9mW4W2be8A9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWVbd8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9c9V919U9KbiE9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949wWV79P9V9UblY9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWVbv8E9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWV9c9V919U9Kbo8A9TW79O9V9Wt9FW9U9J9V9KW69U9KW949wWV79P9V9UbrE9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JWbwa9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JW9c9V919U9KbDL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9p9JtbqK9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9r919HtbkL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWVT949WbxE9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OWbsa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OW9ttV9P9Wbza9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9WbHK9TW79O9V9Wt9F79W9Ht9P9H29t9VVt9sW9T9H9WbOl79IV9RbCDwebcekdKLqN9OYdbk:Bhdhud9:8Jjjjjbc;qw9Rgr8KjjjjbcbhwdnaeTmbabcbyd;C:kjjbaoaocb9iEgDc:GeV86bbarc;adfcbcjdz:wjjjb8AdnaiTmbarc;adfadalz:vjjjb8Akarc;abfalfcbcbcjdal9RalcFe0Ez:wjjjb8Aarc;abfarc;adfalz:vjjjb8AarcUf9cb83ibarc8Wf9cb83ibarcyf9cb83ibarcaf9cb83ibarcKf9cb83ibarczf9cb83ibar9cb83iwar9cb83ibcj;abal9Uc;WFbGcjdalca0Ehqdnaicd6mbavcd9imbaDTmbadcefhkaqci2gxal2hmarc;alfclfhParc;qlfceVhsarc;qofclVhzarc;qofcKfhHarc;qofczfhOcbhAincdhCcbhodnavci6mbaH9cb83ibaO9cb83ibar9cb83i;yoar9cb83i;qoadaAfgoybbhXcbhQincbhwcbhLdninaoalfhKaoybbgYaX7aLVhLawcP0meaKhoaYhXawcefgwaQfai6mbkkcbhXarc;qofhwincwh8AcwhEdnaLaX93gocFeGg3cs0mbclhEa3ci0mba3cb9hcethEkdnaocw4cFeGg3cs0mbclh8Aa3ci0mba3cb9hceth8Aka8AaEfh3awydbh5cwh8AcwhEdnaocz4cFeGg8Ecs0mbclhEa8Eci0mba8Ecb9hcethEka3a5fh3dnaocFFFFb0mbclh8AaocFFF8F0mbaocFFFr0ceth8Akawa3aEfa8AfBdbawclfhwaXcefgXcw9hmbkaKhoaYhXaQczfgQai6mbkcbhocehwazhLinawaoaLydbarc;qofaocdtfydb6EhoaLclfhLawcefgwcw9hmbkcihCkcbh3arc;qlfcbcjdz:wjjjb8Aarc;alfcwfcbBdbar9cb83i;alaoclth8Fadhaaqhhakh5inarc;qlfadcba3cufgoaoa30Eal2falz:vjjjb8Aaiahaiah6Ehgdnaqaia39Ra3aqfai6EgYcsfc9WGgoaY9nmbarc;qofaYfcbaoaY9Rz:wjjjb8Akada3al2fh8Jcbh8Kina8Ka8FVcl4hQarc;alfa8Kcdtfh8LaAh8Mcbh8Nina8NaAfhwdndndndndndna8KPldebidkasa8Mc98GgLfhoa5aLfh8Aarc;qlfawc98GgLfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkaYTmla8Ncith8Ea8JaLfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aQ93a8E486bba8Aalfh8AaEalfhEaLhXaKcefgKaY9hmbxlkkaYTmia8Mc9:Ghoa8NcitcwGhEarc;qlfawceVfRbbcwtarc;qlfawc9:GfRbbVhLarc;qofhwaghXinawa5aofRbbcwtaaaofRbbVg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbaoalfhoawcefhwa8AhLa3aXcufgX9hmbxikkaYTmda8Jawfhoarc;qlfawfRbbhLarc;qofhwaghXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLa3aXcufgX9hmbxdkkaYTmeka8LydbhEcbhKarc;qofhoincdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egwa8Aawa8A6Egwczawcz6EaEfhEaoczfhoaKczfgKaY6mbka8LaEBdbka8Mcefh8Ma8Ncefg8Ncl9hmbka8Kcefg8KaC9hmbkaaamfhaahaxfhha5amfh5a3axfg3ai6mbkcbhocehwaPhLinawaoaLydbarc;alfaocdtfydb6EhoaLclfhLawcefgXhwaCaX9hmbkaraAcd4fa8FcdVaoaocdSE86bbaAclfgAal6mbkkabaefh8Kabcefhoalcd4gecbaDEhkadcefhOarc;abfceVhHcbhmdndninaiam9nmearc;qofcbcjdz:wjjjb8Aa8Kao9Rak6mdadamal2gwfhxcbh8JaOawfhzaocbakz:wjjjbghakfh5aqaiam9Ramaqfai6Egscsfgocl4cifcd4hCaoc9WGg8LThPindndndndndndndndndndnaDTmbara8Jcd4fRbbgLciGPlbedlbkasTmdaxa8Jfhoarc;abfa8JfRbbhLarc;qofhwashXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLaXcufgXmbxikkasTmia8JcitcwGhEarc;abfa8JceVfRbbcwtarc;abfa8Jc9:GgofRbbVhLaxaofhoarc;qofhwashXinawao8Vbbg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbawcefhwaoalfhoa8AhLaXcufgXmbxdkkaHa8Jc98GgEfhoazaEfh8Aarc;abfaEfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkasTmbaLcl4hYa8JcitcKGh3axaEfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aY93a3486bba8Aalfh8AaEalfhEaLhXaKcefgKas9hmbkkaDmbcbhoxlka8LTmbcbhodninarc;qofaofgwcwf8Pibaw8Pib:e9qTmeaoczfgoa8L9pmdxbkkdnavmbcehoxikcbhEaChKaChYinarc;qofaEfgocwf8Pibhyao8Pibh8PcdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egoa8Aaoa8A6Egoczaocz6EaYfhYaocucbaya8P:e9cb9sEgwaoaw6EaKfhKaEczfgEa8L9pmdxbkkaha8Jcd4fgoaoRbbcda8JcetcoGtV86bbxikdnaKas6mbaYas6mbaha8Jcd4fgoaoRbbcia8JcetcoGtV86bba8Ka59Ras6mra5arc;qofasz:vjjjbasfh5xikaKaY9phokaha8Jcd4fgwawRbbaoa8JcetcoGtV86bbka8Ka59RaC6mla5cbaCz:wjjjbgAaCfhYdndna8LmbaPhoxekdna8KaY9RcK9pmbaPhoxekaocdtc:q1jjbfcj1jjbaDEg5ydxggcetc;:FFFeGh8Fcuh3cuagtcu7cFeGhacbh8Marc;qofhLinarc;qofa8MfhQczhEdndndnagPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhExekcbhoa8FhEinaEaaaLaofRbb9nfhEaocefgocz9hmbkkcih8Ecbh8Ainczhwdndndna5a8AcdtfydbgKPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhwxekaKcetc;:FFFeGhwcuaKtcu7cFeGhXcbhoinawaXaLaofRbb9nfhwaocefgocz9hmbkkdndnawaE6mbaKa39hmeawaE9hmea5a8EcdtfydbcwSmeka8Ah8EawhEka8Acefg8Aci9hmbkaAa8Mco4fgoaoRbba8Ea8Mci4coGtV86bbdndndna5a8Ecdtfydbg3PDdbbbbbbbebkdncwa39Tg8ETmbcua3tcu7hwdndna3ceSmbcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXa3tVhXaocefhoa8Acufg8AmbkaYaX86bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbxdkkcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXcetVhXaocefhoa8Acufg8AmbkaYaX:T9cFe:d9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:9ca188bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbkkcbhoinaYaLaofRbbgX86bbaYaXawcFeG9pfhYaocefgocz9hmbxikkdna3ceSmbinaYcb86bbaYcefhYxbkkinaYcb86bbaYcefhYxbkkaYaQ8Pbb83bbaYcwfaQcwf8Pbb83bbaYczfhYka8Mczfg8Ma8L9pgomeaLczfhLa8KaY9RcK9pmbkkaoTmlaYh5aYTmlka8Jcefg8Jal9hmbkarc;abfaxascufal2falz:vjjjb8Aasamfhma5hoa5mbkcbhwxdkdna8Kao9RakalfgwcKcaaDEgLawaL0EgX9pmbcbhwxdkdnawaL9pmbaocbaXaw9Rgwz:wjjjbawfhokaoarc;adfalz:vjjjbalfhodnaDTmbaoaraez:vjjjbaefhokaoab9Rhwxekcbhwkarc;qwf8Kjjjjbawk5babaeadaialcdcbyd;C:kjjbz:bjjjbk9reduaecd4gdaefgicaaica0Eabcj;abae9Uc;WFbGcjdaeca0Egifcufai9Uae2aiadfaicl4cifcd4f2fcefkmbcbabBd;C:kjjbk:Ese5u8Jjjjjbc;ae9Rgl8Kjjjjbcbhvdnaici9UgocHfae0mbabcbyd;m:kjjbgrc;GeV86bbalc;abfcFecjez:wjjjb8AalcUfgw9cu83ibalc8WfgD9cu83ibalcyfgq9cu83ibalcafgk9cu83ibalcKfgx9cu83ibalczfgm9cu83ibal9cu83iwal9cu83ibabaefc9WfhPabcefgsaofhednaiTmbcmcsarcb9kgzEhHcbhOcbhAcbhCcbhXcbhQindnaeaP9nmbcbhvxikaQcufhvadaCcdtfgLydbhKaLcwfydbhYaLclfydbh8AcbhEdndndninalc;abfavcsGcitfgoydlh3dndndnaoydbgoaK9hmba3a8ASmekdnaoa8A9hmba3aY9hmbaEcefhExekaoaY9hmea3aK9hmeaEcdfhEkaEc870mdaXcufhvaLaEciGcx2goc;i1jjbfydbcdtfydbh3aLaoc;e1jjbfydbcdtfydbh8AaLaoc;a1jjbfydbcdtfydbhKcbhodnindnalavcsGcdtfydba39hmbaohYxdkcuhYavcufhvaocefgocz9hmbkkaOa3aOSgvaYce9iaYaH9oVgoGfhOdndndncbcsavEaYaoEgvcs9hmbarce9imba3a3aAa3cefaASgvEgAcefSmecmcsavEhvkasavaEcdtc;WeGV86bbavcs9hmea3aA9Rgvcetavc8F917hvinaeavcFb0crtavcFbGV86bbaecefheavcje6hoavcr4hvaoTmbka3hAxvkcPhvasaEcdtcPV86bba3hAkavTmiavaH9omicdhocehEaQhYxlkavcufhvaEclfgEc;ab9hmbkkdnaLceaYaOSceta8AaOSEcx2gvc;a1jjbfydbcdtfydbgKTaLavc;e1jjbfydbcdtfydbg8AceSGaLavc;i1jjbfydbcdtfydbg3cdSGaOcb9hGazGg5ce9hmbaw9cu83ibaD9cu83ibaq9cu83ibak9cu83ibax9cu83ibam9cu83ibal9cu83iwal9cu83ibcbhOkcbhEaXcufgvhodnindnalaocsGcdtfydba8A9hmbaEhYxdkcuhYaocufhoaEcefgEcz9hmbkkcbhodnindnalavcsGcdtfydba39hmbaohExdkcuhEavcufhvaocefgocz9hmbkkaOaKaOSg8EfhLdndnaYcm0mbaYcefhYxekcbcsa8AaLSgvEhYaLavfhLkdndnaEcm0mbaEcefhExekcbcsa3aLSgvEhEaLavfhLkc9:cua8EEh8FcbhvaEaYcltVgacFeGhodndndninavc:W1jjbfRbbaoSmeavcefgvcz9hmbxdkka5aKaO9havcm0VVmbasavc;WeV86bbxekasa8F86bbaeaa86bbaecefhekdna8EmbaKaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombkaKhAkdnaYcs9hmba8AaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka8AhAkdnaEcs9hmba3aA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka3hAkalaXcdtfaKBdbaXcefcsGhvdndnaYPzbeeeeeeeeeeeeeebekalavcdtfa8ABdbaXcdfcsGhvkdndnaEPzbeeeeeeeeeeeeeebekalavcdtfa3BdbavcefcsGhvkcihoalc;abfaQcitfgEaKBdlaEa8ABdbaQcefcsGhYcdhEavhXaLhOxekcdhoalaXcdtfa3BdbcehEaXcefcsGhXaQhYkalc;abfaYcitfgva8ABdlava3Bdbalc;abfaQaEfcsGcitfgva3BdlavaKBdbascefhsaQaofcsGhQaCcifgCai6mbkkdnaeaP9nmbcbhvxekcbhvinaeavfavc:W1jjbfRbb86bbavcefgvcz9hmbkaeab9Ravfhvkalc;aef8KjjjjbavkZeeucbhddninadcefgdc8F0meceadtae6mbkkadcrfcFeGcr9Uci2cdfabci9U2cHfkmbcbabBd;m:kjjbk:Adewu8Jjjjjbcz9Rhlcbhvdnaicvfae0mbcbhvabcbRb;m:kjjbc;qeV86bbal9cb83iwabcefhoabaefc98fhrdnaiTmbcbhwcbhDindnaoar6mbcbskadaDcdtfydbgqalcwfawaqav9Rgvavc8F91gv7av9Rc507gwcdtfgkydb9Rgvc8E91c9:Gavcdt7awVhvinaoavcFb0gecrtavcFbGV86bbavcr4hvaocefhoaembkakaqBdbaqhvaDcefgDai9hmbkkdnaoar9nmbcbskaocbBbbaoab9RclfhvkavkBeeucbhddninadcefgdc8F0meceadtae6mbkkadcwfcFeGcr9Uab2cvfk:bvli99dui99ludnaeTmbcuadcetcuftcu7:Zhvdndncuaicuftcu7:ZgoJbbbZMgr:lJbbb9p9DTmbar:Ohwxekcjjjj94hwkcbhicbhDinalclfIdbgrJbbbbJbbjZalIdbgq:lar:lMalcwfIdbgk:lMgr:varJbbbb9BEgrNhxaqarNhrdndnakJbbbb9GTmbaxhqxekJbbjZar:l:tgqaq:maxJbbbb9GEhqJbbjZax:l:tgxax:marJbbbb9GEhrkdndnalcxfIdbgxJbbj:;axJbbj:;9GEgkJbbjZakJbbjZ9FEavNJbbbZJbbb:;axJbbbb9GEMgx:lJbbb9p9DTmbax:Ohmxekcjjjj94hmkdndnaqJbbj:;aqJbbj:;9GEgxJbbjZaxJbbjZ9FEaoNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:OhPxekcjjjj94hPkdndnarJbbj:;arJbbj:;9GEgqJbbjZaqJbbjZ9FEaoNJbbbZJbbb:;arJbbbb9GEMgr:lJbbb9p9DTmbar:Ohsxekcjjjj94hskdndnadcl9hmbabaifgzas86bbazcifam86bbazcdfaw86bbazcefaP86bbxekabaDfgzas87ebazcofam87ebazclfaw87ebazcdfaP87ebkalczfhlaiclfhiaDcwfhDaecufgembkkk;hlld99eud99eudnaeTmbdndncuaicuftcu7:ZgvJbbbZMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikaic;8FiGhrinabcofcicdalclfIdb:lalIdb:l9EgialcwfIdb:lalaicdtfIdb:l9EEgialcxfIdb:lalaicdtfIdb:l9EEgiarV87ebdndnJbbj:;JbbjZalaicdtfIdbJbbbb9DEgoalaicd7cdtfIdbJ;Zl:1ZNNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabcdfaq87ebdndnalaicefciGcdtfIdbJ;Zl:1ZNaoNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabaq87ebdndnaoalaicufciGcdtfIdbJ;Zl:1ZNNgoJbbj:;aoJbbj:;9GEgwJbbjZawJbbjZ9FEavNJbbbZJbbb:;aoJbbbb9GEMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikabclfai87ebabcwfhbalczfhlaecufgembkkk;3viDue99eu8Jjjjjbcjd9Rgo8Kjjjjbadcd4hrdndndndnavcd9hmbadcl6meaohwarhDinawc:CuBdbawclfhwaDcufgDmbkaeTmiadcl6mdarcdthqalhkcbhxinaohwakhDarhminawawydbgPcbaDIdbgs:8cL4cFeGc:cufasJbbbb9BEgzaPaz9kEBdbaDclfhDawclfhwamcufgmmbkakaqfhkaxcefgxaeSmixbkkaeTmdxekaeTmekarcdthkavce9hhqadcl6hdcbhxindndndnaqmbadmdc:CuhDalhwarhminaDcbawIdbgs:8cL4cFeGc:cufasJbbbb9BEgPaDaP9kEhDawclfhwamcufgmmbxdkkc:CuhDdndnavPleddbdkadmdaohwalhmarhPinawcbamIdbgs:8cL4cFeGgzc;:bazc;:b0Ec:cufasJbbbb9BEBdbamclfhmawclfhwaPcufgPmbxdkkadmecbhwarhminaoawfcbalawfIdbgs:8cL4cFeGgPc8AaPc8A0Ec:cufasJbbbb9BEBdbawclfhwamcufgmmbkkadmbcbhwarhPinaDhmdnavceSmbaoawfydbhmkdndnalawfIdbgscjjj;8iamai9RcefgmcLt9R::NJbbbZJbbb:;asJbbbb9GEMgs:lJbbb9p9DTmbas:Ohzxekcjjjj94hzkabawfazcFFFrGamcKtVBdbawclfhwaPcufgPmbkkabakfhbalakfhlaxcefgxae9hmbkkaocjdf8Kjjjjbk;YqdXui998Jjjjjbc:qd9Rgv8Kjjjjbavc:Sefcbc;Kbz:wjjjb8AcbhodnadTmbcbhoaiTmbdndnabaeSmbaehrxekavcuadcdtgwadcFFFFi0Ecbyd;u:kjjbHjjjjbbgrBd:SeavceBd:mdaraeawz:vjjjb8Akavc:GefcwfcbBdbav9cb83i:Geavc:Gefaradaiavc:Sefz:ojjjbavyd:GehDadci9Ugqcbyd;u:kjjbHjjjjbbheavc:Sefavyd:mdgkcdtfaeBdbavakcefgwBd:mdaecbaqz:wjjjbhxavc:SefawcdtfcuaicdtaicFFFFi0Ecbyd;u:kjjbHjjjjbbgmBdbavakcdfgPBd:mdalc;ebfhsaDheamhwinawalIdbasaeydbgzcwazcw6EcdtfIdbMUdbaeclfheawclfhwaicufgimbkavc:SefaPcdtfcuaqcdtadcFFFF970Ecbyd;u:kjjbHjjjjbbgPBdbdnadci6mbarheaPhwaqhiinawamaeydbcdtfIdbamaeclfydbcdtfIdbMamaecwfydbcdtfIdbMUdbaecxfheawclfhwaicufgimbkkakcifhoalc;ebfhHavc;qbfhOavheavyd:KehAavyd:OehCcbhzcbhwcbhXcehQinaehLcihkarawci2gKcdtfgeydbhsaeclfydbhdabaXcx2fgicwfaecwfydbgYBdbaiclfadBdbaiasBdbaxawfce86bbaOaYBdwaOadBdlaOasBdbaPawcdtfcbBdbdnazTmbcihkaLhiinaOakcdtfaiydbgeBdbakaeaY9haeas9haead9hGGfhkaiclfhiazcufgzmbkkaXcefhXcbhzinaCaAarazaKfcdtfydbcdtgifydbcdtfgYheaDaifgdydbgshidnasTmbdninaeydbawSmeaeclfheaicufgiTmdxbkkaeaYascdtfc98fydbBdbadadydbcufBdbkazcefgzci9hmbkdndnakTmbcuhwJbbbbh8Acbhdavyd:KehYavyd:OehKindndnaDaOadcdtfydbcdtgzfydbgembadcefhdxekadcs0hiamazfgsIdbhEasalcbadcefgdaiEcdtfIdbaHaecwaecw6EcdtfIdbMg3Udba3aE:th3aecdthiaKaYazfydbcdtfheinaPaeydbgzcdtfgsa3asIdbMgEUdbaEa8Aa8AaE9DgsEh8AazawasEhwaeclfheaic98fgimbkkadak9hmbkawcu9hmekaQaq9pmdindnaxaQfRbbmbaQhwxdkaqaQcefgQ9hmbxikkakczakcz6EhzaOheaLhOawcu9hmbkkaocdtavc:Seffc98fhedninaoTmeaeydbcbyd;q:kjjbH:bjjjbbaec98fheaocufhoxbkkavc:qdf8Kjjjjbk;IlevucuaicdtgvaicFFFFi0Egocbyd;u:kjjbHjjjjbbhralalyd9GgwcdtfarBdbalawcefBd9GabarBdbaocbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdlcuadcdtadcFFFFi0Ecbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdwabydbcbavz:wjjjb8Aadci9UhDdnadTmbabydbhoaehladhrinaoalydbcdtfgvavydbcefBdbalclfhlarcufgrmbkkdnaiTmbabydbhlabydlhrcbhvaihoinaravBdbarclfhralydbavfhvalclfhlaocufgombkkdnadci6mbabydlhrabydwhvcbhlinaecwfydbhoaeclfydbhdaraeydbcdtfgwawydbgwcefBdbavawcdtfalBdbaradcdtfgdadydbgdcefBdbavadcdtfalBdbaraocdtfgoaoydbgocefBdbavaocdtfalBdbaecxfheaDalcefgl9hmbkkdnaiTmbabydlheabydbhlinaeaeydbalydb9RBdbalclfhlaeclfheaicufgimbkkkQbabaeadaic;K1jjbz:njjjbkQbabaeadaic;m:jjjbz:njjjbk9DeeuabcFeaicdtz:wjjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk:Vvioud9:du8Jjjjjbc;Wa9Rgl8Kjjjjbcbhvalcxfcbc;Kbz:wjjjb8AalcuadcitgoadcFFFFe0Ecbyd;u:kjjbHjjjjbbgrBdxalceBd2araeadaicez:tjjjbalcuaoadcjjjjoGEcbyd;u:kjjbHjjjjbbgwBdzadcdthednadTmbabhiinaiavBdbaiclfhiadavcefgv9hmbkkawaefhDalabBdwalawBdl9cbhqindnadTmbaq9cq9:hkarhvaDhiadheinaiav8Pibak1:NcFrG87ebavcwfhvaicdfhiaecufgembkkalclfaq:NceGcdtfydbhxalclfaq9ce98gq:NceGcdtfydbhmalc;Wbfcbcjaz:wjjjb8AaDhvadhidnadTmbinalc;Wbfav8VebcdtfgeaeydbcefBdbavcdfhvaicufgimbkkcbhvcbhiinalc;WbfavfgeydbhoaeaiBdbaoaifhiavclfgvcja9hmbkadhvdndnadTmbinalc;WbfaDamydbgicetf8VebcdtfgeaeydbgecefBdbaxaecdtfaiBdbamclfhmavcufgvmbkaq9cv9smdcbhvinabawydbcdtfavBdbawclfhwadavcefgv9hmbxdkkaq9cv9smekkclhvdninavc98Smealcxfavfydbcbyd;q:kjjbH:bjjjbbavc98fhvxbkkalc;Waf8Kjjjjbk:Jwliuo99iud9:cbhv8Jjjjjbca9Rgoczfcwfcbyd:8:kjjbBdbaocb8Pd:0:kjjb83izaocwfcbyd;i:kjjbBdbaocb8Pd;a:kjjb83ibaicd4hrdndnadmbJFFuFhwJFFuuhDJFFuuhqJFFuFhkJFFuuhxJFFuFhmxekarcdthPaehsincbhiinaoczfaifgzasaifIdbgwazIdbgDaDaw9EEUdbaoaifgzawazIdbgDaDaw9DEUdbaiclfgicx9hmbkasaPfhsavcefgvad9hmbkaoIdKhDaoIdwhwaoIdChqaoIdlhkaoIdzhxaoIdbhmkdnadTmbJbbbbJbFu9hJbbbbamax:tgmamJbbbb9DEgmakaq:tgkakam9DEgkawaD:tgwawak9DEgw:vawJbbbb9BEhwdnalmbarcdthoindndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:S9cC:ghHdndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikaHai:S:ehHdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaHai:T9cy:g:e83ibaeaofheabcwfhbadcufgdmbxdkkarcdthoindndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cv9:9c;j:KM;j:KM;j:Kd:dhOdndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cq9:9cM;j:KM;j:KM;jl:daO:ehOdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaOai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cC9:9c:KM;j:KM;j:KMD:d:e83ibaeaofheabcwfhbadcufgdmbkkk9teiucbcbyd;y:kjjbgeabcifc98GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;y:kjjbgeabcrfc94GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;y:kjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;y:kjjbfgdBd;y:kjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk;Qddbcjwk;mdbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbbbbbbbbbbbbb4:h9w9N94:P:gW:j9O:ye9Pbbbbbbebbbdbbbebbbdbbbbbbbdbbbbbbbebbbbbbb:l29hZ;69:9kZ;N;76Z;rg97Z;z;o9xZ8J;B85Z;:;u9yZ;b;k9HZ:2;Z9DZ9e:l9mZ59A8KZ:r;T3Z:A:zYZ79OHZ;j4::8::Y:D9V8:bbbb9s:49:Z8R:hBZ9M9M;M8:L;z;o8:;8:PG89q;x:J878R:hQ8::M:B;e87bbbbbbjZbbjZbbjZ:E;V;N8::Y:DsZ9i;H;68:xd;R8:;h0838:;W:NoZbbbb:WV9O8:uf888:9i;H;68:9c9G;L89;n;m9m89;D8Ko8:bbbbf:8tZ9m836ZS:2AZL;zPZZ818EZ9e:lxZ;U98F8:819E;68:FFuuFFuuFFuuFFuFFFuFFFuFbc;mqkzebbbebbbdbbb9G:vbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(n(t),{}).then(function(p){a=p.instance,a.exports.__wasm_call_ctors(),a.exports.meshopt_encodeVertexVersion(0),a.exports.meshopt_encodeIndexVersion(1)});function n(p){for(var f=new Uint8Array(p.length),l=0;l<p.length;++l){var y=p.charCodeAt(l);f[l]=y>96?y-97:y>64?y-39:y+4}for(var b=0,l=0;l<p.length;++l)f[b++]=f[l]<60?e[f[l]]:(f[l]-60)*64+f[++l];return f.buffer.slice(0,b)}function r(p){if(!p)throw new Error("Assertion failed")}function i(p){return new Uint8Array(p.buffer,p.byteOffset,p.byteLength)}function o(p,f,l,y){var b=a.exports.sbrk,g=b(f.length*4),x=b(l*4),M=new Uint8Array(a.exports.memory.buffer),T=i(f);M.set(T,g),y&&y(g,g,f.length,l);var I=p(x,g,f.length,l);M=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(l);new Uint8Array(S.buffer).set(M.subarray(x,x+l*4)),T.set(M.subarray(g,g+f.length*4)),b(g-b(0));for(var R=0;R<f.length;++R)f[R]=S[f[R]];return[S,I]}function c(p,f,l,y){var b=a.exports.sbrk,g=b(l*4),x=b(l*y),M=new Uint8Array(a.exports.memory.buffer);M.set(i(f),x),p(g,x,l,y),M=new Uint8Array(a.exports.memory.buffer);var T=new Uint32Array(l);return new Uint8Array(T.buffer).set(M.subarray(g,g+l*4)),b(g-b(0)),T}function d(p,f,l,y,b){var g=a.exports.sbrk,x=g(f),M=g(y*b),T=new Uint8Array(a.exports.memory.buffer);T.set(i(l),M);var I=p(x,f,M,y,b),S=new Uint8Array(I);return S.set(T.subarray(x,x+I)),g(x-g(0)),S}function h(p){for(var f=0,l=0;l<p.length;++l){var y=p[l];f=f<y?y:f}return f}function u(p,f){if(r(f==2||f==4),f==4)return new Uint32Array(p.buffer,p.byteOffset,p.byteLength/4);var l=new Uint16Array(p.buffer,p.byteOffset,p.byteLength/2);return new Uint32Array(l)}function m(p,f,l,y,b,g,x){var M=a.exports.sbrk,T=M(l*y),I=M(l*g),S=new Uint8Array(a.exports.memory.buffer);S.set(i(f),I),p(T,l,y,b,I,x);var R=new Uint8Array(l*y);return R.set(S.subarray(T,T+l*y)),M(T-M(0)),R}return{ready:s,supported:!0,reorderMesh:function(p,f,l){var y=f?l?a.exports.meshopt_optimizeVertexCacheStrip:a.exports.meshopt_optimizeVertexCache:void 0;return o(a.exports.meshopt_optimizeVertexFetchRemap,p,h(p)+1,y)},reorderPoints:function(p,f){return r(p instanceof Float32Array),r(p.length%f==0),r(f>=3),c(a.exports.meshopt_spatialSortRemap,p,p.length/f,f*4)},encodeVertexBuffer:function(p,f,l){r(l>0&&l<=256),r(l%4==0);var y=a.exports.meshopt_encodeVertexBufferBound(f,l);return d(a.exports.meshopt_encodeVertexBuffer,y,p,f,l)},encodeIndexBuffer:function(p,f,l){r(l==2||l==4),r(f%3==0);var y=u(p,l),b=a.exports.meshopt_encodeIndexBufferBound(f,h(y)+1);return d(a.exports.meshopt_encodeIndexBuffer,b,y,f,4)},encodeIndexSequence:function(p,f,l){r(l==2||l==4);var y=u(p,l),b=a.exports.meshopt_encodeIndexSequenceBound(f,h(y)+1);return d(a.exports.meshopt_encodeIndexSequence,b,y,f,4)},encodeGltfBuffer:function(p,f,l,y){var b={ATTRIBUTES:this.encodeVertexBuffer,TRIANGLES:this.encodeIndexBuffer,INDICES:this.encodeIndexSequence};return r(b[y]),b[y](p,f,l)},encodeFilterOct:function(p,f,l,y){return r(l==4||l==8),r(y>=1&&y<=16),m(a.exports.meshopt_encodeFilterOct,p,f,l,y,16)},encodeFilterQuat:function(p,f,l,y){return r(l==8),r(y>=4&&y<=16),m(a.exports.meshopt_encodeFilterQuat,p,f,l,y,16)},encodeFilterExp:function(p,f,l,y,b){r(l>0&&l%4==0),r(y>=1&&y<=24);var g={Separate:0,SharedVector:1,SharedComponent:2,Clamped:3};return m(a.exports.meshopt_encodeFilterExp,p,f,l,y,l,b?g[b]:1)}}})();var br=(function(){var t="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:W:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:S86qdbk;jYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz1jjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbhodnawTmbaxa8Acd4fRbbhokaocFeGh5cbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz1jjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:jjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q1jjbfcj1jjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bbarcwf9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfag9c8F1:NghcKtc8F91aicdfa8J9c8N1:Nfg8KRbbG86bbarcVfcba8KahcjeGcr4fghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fag9c8F1:NgicKtc8F91aha8J9c8N1:NfghRbbG86bbarc96fcbahaicjeGcr4fgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbb83bbarcwfaicwf8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbcbaocl49Rh8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E93aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z1jjjb8AazazcjdfaAcufad2fadz1jjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:XseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbyd:K1jjbgeabcifc98GfgbBd:K1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk81dbcjwk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:Kwkl8WNbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;G9Mqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:183lYud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxavaialfgmar9Rgoad;8qbbcj;abad9Uc;WFbGcjdadca0EhPdndndnadTmbaoadfhscbhzinaeaz9nmdamax9RaD6miabazad2fhHaxaDfhOaPaeaz9RazaPfae6EgAcsfgocl4cifcd4hCavcj;cbfaoc9WGgXcetfhQavcj;cbfaXci2fhLavcj;cbfaXfhKcbhYaoc;ab6h8AincbhodnawTmbaxaYcd4fRbbhokaocFeGhEcbh3avcj;cbfh5indndndndnaEa3cet4ciGgoc9:fPdebdkamaO9RaX6mwavcj;cbfa3aX2faOaX;8qbbaOaAfhOxdkavcj;cbfa3aX2fcbaX;8kbxekamaO9RaC6moaoclVcbawEhraOaCfhocbhidna8Ambamao9Rc;Gb6mbcbhlina5alfhidndndndndndnaOalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiczfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaicafaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaoclffaqc:q:yjjbfRbbfhoxikaic8Wfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaocwffaqc:q:yjjbfRbbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitc:q1jjbfpbibaic:q:yjjbfRbbgipsaoRbegqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqc:q:yjjbfRbbfhokalc;abfhialcjefaX0meaihlamao9Rc;Fb0mbkkdnaiaX9pmbaici4hlinamao9RcK6mwa5aifhqdndndndndndnaOaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaoclffahc:q:yjjbfRbbfhoxikaqaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaocwffahc:q:yjjbfRbbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpkbbaaaocdffahc:q:yjjbfRbbfhokalcdfhlaiczfgiaX6mbkkaohOaoTmoka5aXfh5a3cefg3cl9hmbkdndndndnawTmbasaYcd4fRbbglciGPlbedwbkaXTmdavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep9Ta8Epxeeeeeeeeeeeeeeeeg8Fp9op9Hp9rg8Eagp9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Ug8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9AbbbaladfhlaoczfgoaX6mbxikkaXTmeavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep:nea8Epxebebebebebebebebg8Fp9op:bep9rg8Eagp:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeg8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9AbbbaladfhlaoczfgoaX6mbxdkkaXTmbcbhocbalcl4gl9Rc8FGhiavcjdfaYfhravaYfpbdbh8Finaravcj;cbfaofpblbggaKaofpblbg8JpmbzeHdOiAlCvXoQrLg8KaQaofpblbg8LaLaofpblbg8MpmbzeHdOiAlCvXoQrLg8NpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ea8Fp9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Fa8Ka8NpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwKDYq8AkEx3m5P8Es8Fgga8La8MpmwKDYq8AkEx3m5P8Es8Fg8JpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9AbbbaradfhraoczfgoaX6mbkkaYclfgYad6mbkaHavcjdfaAad2;8qbbavavcjdfaAcufad2fad;8qbbaAazfhzc9:hoaOhxaOmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdaPaeao9RaoaPfae6Eaofgoae6mbkaial9Rhxkcbc99amax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbk:TseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:SPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiczfpxbbbbbbbbbbbbbbbbgopklbaiaopklbaiabalcitfgdaeciGglcitgv;8qbbdnalTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkadaiav;8qbbkk:oDllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiczfpxbbbbbbbbbbbbbbbbgkpklbaiakpklbaiabalcitfgoaeciGgvcitgw;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkaoaiaw;8qbbkk;uddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaic8WfpxbbbbbbbbbbbbbbbbgopklbaicafaopklbaiczfaopklbaiaopklbaiabavcdtfgdalciGgecdtgv;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkadaiav;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb",a=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),s=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var n=WebAssembly.validate(a)?o(e):o(t),r,i=WebAssembly.instantiate(n,{}).then(function(b){r=b.instance,r.exports.__wasm_call_ctors()});function o(b){for(var g=new Uint8Array(b.length),x=0;x<b.length;++x){var M=b.charCodeAt(x);g[x]=M>96?M-97:M>64?M-39:M+4}for(var T=0,x=0;x<b.length;++x)g[T++]=g[x]<60?s[g[x]]:(g[x]-60)*64+g[++x];return g.buffer.slice(0,T)}function c(b,g,x,M,T,I,S){var R=b.exports.sbrk,A=M+3&-4,_=R(A*T),j=R(I.length),L=new Uint8Array(b.exports.memory.buffer);L.set(I,j);var F=g(_,M,T,j,I.length);if(F==0&&S&&S(_,A,T),x.set(L.subarray(_,_+M*T)),R(_-R(0)),F!=0)throw new Error("Malformed buffer data: "+F)}var d={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},h={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},u=[],m=0;function p(b){var g={object:new Worker(b),pending:0,requests:{}};return g.object.onmessage=function(x){var M=x.data;g.pending-=M.count,g.requests[M.id][M.action](M.value),delete g.requests[M.id]},g}function f(b){for(var g="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(n)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+y.name+";"+c.toString()+y.toString(),x=new Blob([g],{type:"text/javascript"}),M=URL.createObjectURL(x),T=u.length;T<b;++T)u[T]=p(M);for(var T=b;T<u.length;++T)u[T].object.postMessage({});u.length=b,URL.revokeObjectURL(M)}function l(b,g,x,M,T){for(var I=u[0],S=1;S<u.length;++S)u[S].pending<I.pending&&(I=u[S]);return new Promise(function(R,A){var _=new Uint8Array(x),j=++m;I.pending+=b,I.requests[j]={resolve:R,reject:A},I.object.postMessage({id:j,count:b,size:g,source:_,mode:M,filter:T},[_.buffer])})}function y(b){var g=b.data;if(!g.id)return self.close();self.ready.then(function(x){try{var M=new Uint8Array(g.count*g.size);c(x,x.exports[g.mode],M,g.count,g.size,g.source,x.exports[g.filter]),self.postMessage({id:g.id,count:g.count,action:"resolve",value:M},[M.buffer])}catch(T){self.postMessage({id:g.id,count:g.count,action:"reject",value:T})}})}return{ready:i,supported:!0,useWorkers:function(b){f(b)},decodeVertexBuffer:function(b,g,x,M,T){c(r,r.exports.meshopt_decodeVertexBuffer,b,g,x,M,r.exports[d[T]])},decodeIndexBuffer:function(b,g,x,M){c(r,r.exports.meshopt_decodeIndexBuffer,b,g,x,M)},decodeIndexSequence:function(b,g,x,M){c(r,r.exports.meshopt_decodeIndexSequence,b,g,x,M)},decodeGltfBuffer:function(b,g,x,M,T,I){c(r,r.exports[h[T]],b,g,x,M,r.exports[d[I]])},decodeGltfBufferAsync:function(b,g,x,M,T){return u.length>0?l(b,g,x,h[M],d[T]):i.then(function(){var I=new Uint8Array(b*g);return c(r,r.exports[h[M]],I,b,g,x,r.exports[d[T]]),I})}}})();var sw=(function(){var t="b9H79Tebbbetm9Geueu9Geub9Gbb9Gsuuuuuuuuuuuu99uueu9Gvuuuuub9Gruuuuuuub9Gvuuuuue999Gvuuuuueu9Gquuuuuuu99uueu9Gwuuuuuu99ueu9Giuuue999Gluuuueu9GiuuueuiOHdilvorlwiDqkbxxbelve9Weiiviebeoweuec:G:Pdkr:Tewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bbz9TW79O9V9Wt9F79P9T9W29P9M95br8E9TW79O9V9Wt9F79P9T9W29P9M959x9Pt9OcttV9P9I91tW7bwQ9TW79O9V9Wt9F79P9T9W29P9M959q9V9P9Ut7bDX9TW79O9V9Wt9F79P9T9W29P9M959t9J9H2Wbqa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9Wbkl79IV9RbxDwebcekdzsq;B:xeHdbkM9Hi8Au8A99Au8Jjjjjbc;W;qb9Rgs8Kjjjjbcbhzascxfcbc;Kbz:ojjjb8AdnabaeSmbabaeadcdtz:njjjb8AkdndnamcdGmbascxfhHcbhOxekasalcrfci4gecbyd:m:jjjbHjjjjbbgABdxasceBd2aAcbaez:ojjjbhCcbhlcbhednadTmbcbhlabheadhAinaCaeydbgXci4fgQaQRbbgQceaXcrGgXtV86bbaQcu7aX4ceGalfhlaeclfheaAcufgAmbkcualcdtalcFFFFi0EhekascCfhHasaecbyd:m:jjjbHjjjjbbgOBdzascdBd2alcd4alfhXcehAinaAgecethAaeaX6mbkcdhzcbhLascuaecdtgAaecFFFFi0Ecbyd:m:jjjbHjjjjbbgXBdCasciBd2aXcFeaAz:ojjjbhKdnadTmbaecufhYcbh8AindndnaKabaLcdtfgEydbgQc:v;t;h;Ev2aYGgXcdtfgCydbgAcuSmbceheinaOaAcdtfydbaQSmdaXaefhAaecefheaKaAaYGgXcdtfgCydbgAcu9hmbkkaOa8AcdtfaQBdbaCa8ABdba8AhAa8Acefh8AkaEaABdbaLcefgLad9hmbkkaKcbyd1:jjjbH:bjjjbbascdBd2kcbh3aHcualcefgecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbg5Bdbasa5BdlasazceVgeBd2ascxfaecdtfcuadcitadcFFFFe0Ecbyd:m:jjjbHjjjjbbg8EBdbasa8EBdwasazcdfgeBd2asclfabadalcbz:cjjjbascxfaecdtfcualcdtgealcFFFFi0Eg8Fcbyd:m:jjjbHjjjjbbgABdbasazcifgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgaBdbasazclVBd2aAaaaialavaOascxfz:djjjbalcbyd:m:jjjbHjjjjbbhCascxfasyd2ghcdtfaCBdbasahcefgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgXBdbasahcdfgQBd2ascxfaQcdtfa8Fcbyd:m:jjjbHjjjjbbgQBdbasahcifggBd2aXcFeaez:ojjjbh8JaQcFeaez:ojjjbh8KdnalTmba8Ecwfh8Lindna5a3gQcefg3cdtfydbgKa5aQcdtgefydbgXSmbaKaX9Rhza8EaXcitfhHa8Kaefh8Ma8JaefhEcbhYindndnaHaYcitfydbg8AaQ9hmbaEaQBdba8MaQBdbxekdna5a8Acdtg8NfgeclfydbgXaeydbgeSmba8EaecitgKfydbaQSmeaXae9Rhyaecu7aXfhLa8LaKfhXcbheinaLaeSmeaecefheaXydbhKaXcwfhXaKaQ9hmbkaeay6meka8Ka8NfgeaQa8AaeydbcuSEBdbaEa8AaQaEydbcuSEBdbkaYcefgYaz9hmbkka3al9hmbkaAhXaahQa8KhKa8JhYcbheindndnaeaXydbg8A9hmbdnaeaQydbg8A9hmbaYydbh8AdnaKydbgLcu9hmba8Acu9hmbaCaefcb86bbxikaCaefhEdnaeaLSmbaea8ASmbaEce86bbxikaEcl86bbxdkdnaeaaa8AcdtgLfydb9hmbdnaKydbgEcuSmbaeaESmbaYydbgzcuSmbaeazSmba8KaLfydbgHcuSmbaHa8ASmba8JaLfydbgLcuSmbaLa8ASmbdnaAaEcdtfydbg8AaAaLcdtfydb9hmba8AaAazcdtfydbgLSmbaLaAaHcdtfydb9hmbaCaefcd86bbxlkaCaefcl86bbxikaCaefcl86bbxdkaCaefcl86bbxekaCaefaCa8AfRbb86bbkaXclfhXaQclfhQaKclfhKaYclfhYalaecefge9hmbkdnaqTmbdndnaOTmbaOheaAhXalhQindnaqaeydbfRbbTmbaCaXydbfcl86bbkaeclfheaXclfhXaQcufgQmbxdkkaAhealhXindnaqRbbTmbaCaeydbfcl86bbkaqcefhqaeclfheaXcufgXmbkkaAhealhQaChXindnaCaeydbfRbbcl9hmbaXcl86bbkaeclfheaXcefhXaQcufgQmbkkamceGTmbaChealhXindnaeRbbce9hmbaecl86bbkaecefheaXcufgXmbkkascxfagcdtfcualcx2alc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbg3BdbasahclfgHBd2a3aialavaOz:ejjjbh8PdndnaDmbcbhgcbh8Lxekcbh8LawhecbhXindnaeIdbJbbbb9ETmbasc;Wbfa8LcdtfaXBdba8Lcefh8LkaeclfheaDaXcefgX9hmbkascxfaHcdtfcua8Lal2gecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbggBdbasahcvfgHBd2alTmba8LTmbarcd4hEdnaOTmba8Lcdthzcbh8AaghLinaoaOa8AcdtfydbaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbxdkka8Lcdthzcbh8AaghLinaoa8AaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbkkascxfaHcdtfcualc8S2gealc;D;O;f8U0EgQcbyd:m:jjjbHjjjjbbgXBdbasaHcefgKBd2aXcbaez:ojjjbhqdndndna8LTmbascxfaKcdtfaQcbyd:m:jjjbHjjjjbbgvBdbasaHcdfgXBd2avcbaez:ojjjb8AascxfaXcdtfcua8Lal2gecltgXaecFFFFb0Ecbyd:m:jjjbHjjjjbbgiBdbasaHcifBd2aicbaXz:ojjjb8AadmexdkcbhvcbhiadTmekcbhYabhXindna3aXclfydbg8Acx2fgeIdba3aXydbgLcx2fgQIdbgI:tg8Ra3aXcwfydbgEcx2fgKIdlaQIdlg8S:tgRNaKIdbaI:tg8UaeIdla8S:tg8VN:tg8Wa8WNa8VaKIdwaQIdwg8X:tg8YNaRaeIdwa8X:tg8VN:tgRaRNa8Va8UNa8Ya8RN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaLcdtfydbc8S2fgeaRa8U:rg8UaRNNg8VaeIdbMUdbaea8Ra8Ua8RNg8ZNg8YaeIdlMUdlaea8Wa8Ua8WNg80Ng81aeIdwMUdwaea8ZaRNg8ZaeIdxMUdxaea80aRNgBaeIdzMUdzaea80a8RNg80aeIdCMUdCaeaRa8Ua8Wa8XNaRaINa8Sa8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAa8Acdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaEcdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaXcxfhXaYcifgYad6mbkcbhzabhLinabazcdtfh8AcbhXinaCa8AaXc;a1jjbfydbcdtfydbgQfRbbhedndnaCaLaXfydbgKfRbbgYc99fcFeGcpe0mbaec99fcFeGc;:e6mekdnaYcufcFeGce0mba8JaKcdtfydbaQ9hmekdnaecufcFeGce0mba8KaQcdtfydbaK9hmekdnaYcv2aefc:G1jjbfRbbTmbaAaQcdtfydbaAaKcdtfydb0mekJbbacJbbacJbbjZaecFeGceSEaYceSEh80dna3a8AaXc;e1jjbfydbcdtfydbcx2fgeIdwa3aKcx2fgYIdwg8S:tg8Wa3aQcx2fgEIdwa8S:tgRaRNaEIdbaYIdbg8X:tg8Ra8RNaEIdlaYIdlg8V:tg8Ua8UNMMgINa8WaRNaeIdba8X:tg81a8RNa8UaeIdla8V:tg8ZNMMg8YaRN:tg8Wa8WNa81aINa8Ya8RN:tgRaRNa8ZaINa8Ya8UN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaKcdtfydbc8S2fgeaRa80aI:rNg8UaRNNg8YaeIdbMUdbaea8Ra8Ua8RNg80Ng81aeIdlMUdlaea8Wa8Ua8WNgINg8ZaeIdwMUdwaea80aRNg80aeIdxMUdxaeaIaRNgBaeIdzMUdzaeaIa8RNg83aeIdCMUdCaeaRa8Ua8Wa8SNaRa8XNa8Va8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaQcdtfydbc8S2fgea8YaeIdbMUdbaea81aeIdlMUdlaea8ZaeIdwMUdwaea80aeIdxMUdxaeaBaeIdzMUdzaea83aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdykaXclfgXcx9hmbkaLcxfhLazcifgzad6mbka8LTmbcbhLinJbbbbh8Xa3abaLcdtfgeclfydbgEcx2fgXIdwa3aeydbgzcx2fgQIdwg8Z:tg8Ra8RNaXIdbaQIdbgB:tg8Wa8WNaXIdlaQIdlg83:tg8Ua8UNMMg80a3aecwfydbgHcx2fgeIdwa8Z:tgINa8Ra8RaINa8WaeIdbaB:tg8SNa8UaeIdla83:tg8VNMMgRN:tJbbbbJbbjZa80aIaINa8Sa8SNa8Va8VNMMg81NaRaRN:tg8Y:va8YJbbbb9BEg8YNhUa81a8RNaIaRN:ta8YNh85a80a8VNa8UaRN:ta8YNh86a81a8UNa8VaRN:ta8YNh87a80a8SNa8WaRN:ta8YNh88a81a8WNa8SaRN:ta8YNh89a8Wa8VNa8Sa8UN:tgRaRNa8UaINa8Va8RN:tgRaRNa8Ra8SNaIa8WN:tgRaRNMM:rJbbbZNhRagaza8L2gwcdtfhXagaHa8L2g8NcdtfhQagaEa8L2g5cdtfhKa8Z:mh8:a83:mhZaB:mhncbhYa8Lh8AJbbbbh8VJbbbbh8YJbbbbh80Jbbbbh81Jbbbbh8ZJbbbbhBJbbbbh83JbbbbhcJbbbbh9cinasc;WbfaYfgecwfaRa85aKIdbaXIdbgI:tg8UNaUaQIdbaI:tg8SNMg8RNUdbaeclfaRa87a8UNa86a8SNMg8WNUdbaeaRa89a8UNa88a8SNMg8UNUdbaecxfaRa8:a8RNaZa8WNaIana8UNMMMgINUdbaRa8Ra8WNNa81Mh81aRa8Ra8UNNa8ZMh8ZaRa8Wa8UNNaBMhBaRaIaINNa8XMh8XaRa8RaINNa8VMh8VaRa8WaINNa8YMh8YaRa8UaINNa80Mh80aRa8Ra8RNNa83Mh83aRa8Wa8WNNacMhcaRa8Ua8UNNa9cMh9caXclfhXaKclfhKaQclfhQaYczfhYa8Acufg8Ambkavazc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaEc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaHc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyaiawcltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia5cltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia8Ncltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaLcifgLad6mbkkcbhQdndnamcwGgJmbJbbbbh8Vcbh9ecbhocbhhxekcbh9ea8Fcbyd:m:jjjbHjjjjbbhhascxfasyd2gecdtfahBdbasaecefgXBd2ascxfaXcdtfcuahalabadaAz:fjjjbgKcltaKcjjjjiGEcbyd:m:jjjbHjjjjbbgoBdbasaecdfBd2aoaKaha3alz:gjjjbJFFuuh8VaKTmbaoheaKhXinaeIdbgRa8Va8VaR9EEh8VaeclfheaXcufgXmbkaKh9ekasydlhTdnalTmbaTclfheaTydbhKaChXalhYcbhQincbaeydbg8AaK9RaXRbbcpeGEaQfhQaXcefhXaeclfhea8AhKaYcufgYmbkaQce4hQkcuadaQ9RcifgScx2aSc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbhDascxfasyd2g9hcdtfaDBdbasa9hcefgeBd2ascxfaecdtfcuaScdtaScFFFFi0Ecbyd:m:jjjbHjjjjbbgrBdbasa9hcdfgeBd2ascxfaecdtfa8Fcbyd:m:jjjbHjjjjbbgyBdbasa9hcifgeBd2ascxfaecdtfalcbyd:m:jjjbHjjjjbbg9iBdbasa9hclfg6Bd2axaxNa8PJbbjZamclGEgUaUN:vh9cJbbbbhcdnadak9nmbdnaSci6mba8Lclth9kaDcwfh0Jbbbbh83JbbbbhcinasclfabadalaAz:cjjjbabhzcbh8Ecbh8Finaba8FcdtfhHcbheindnaAazaefydbgQcdtgEfydbgYaAaHaec;q1jjbfydbcdtfydbgXcdtgwfydbg8ASmbaCaXfRbbgLcv2aCaQfRbbgKfc;G1jjbfRbbg5aKcv2aLfg8Nc;G1jjbfRbbg8MVcFeGTmbdna8AaY9nmba8Nc:G1jjbfRbbcFeGmekaKcufhYdnaKaL9hmbaYcFeGce0mba8JaEfydbaX9hmekdndnaKclSmbaLcl9hmekdnaYcFeGce0mba8JaEfydbaX9hmdkaLcufcFeGce0mba8KawfydbaQ9hmekaDa8Ecx2fgKaXaQa8McFeGgYEBdlaKaQaXaYEBdbaKaYa5Gcb9hBdwa8Ecefh8Ekaeclfgecx9hmbkdna8Fcifg8Fad9pmbazcxfhza8EcifaS9nmekka8ETmdcbhLinaqaAaDaLcx2fgKydbgYcdtgzfydbc8S2fgeIdwa3aKydlg8Acx2fgXIdwg8WNaeIdzaXIdbg8UNaeIdaMgRaRMMa8WNaeIdlaXIdlgINaeIdCa8WNaeId3MgRaRMMaINaeIdba8UNaeIdxaINaeIdKMgRaRMMa8UNaeId8KMMM:lhRJbbbbJbbjZaeIdyg8R:va8RJbbbb9BEh8RdndnaKydwgEmbJFFuuh8YxekJbbbbJbbjZaqaAa8Acdtfydbc8S2fgeIdyg8S:va8SJbbbb9BEaeIdwa3aYcx2fgXIdwg8SNaeIdzaXIdbg8XNaeIdaMg8Ya8YMMa8SNaeIdlaXIdlg8YNaeIdCa8SNaeId3Mg8Sa8SMMa8YNaeIdba8XNaeIdxa8YNaeIdKMg8Sa8SMMa8XNaeId8KMMM:lNh8Yka8RaRNh80dna8LTmbavaYc8S2fgQIdwa8WNaQIdza8UNaQIdaMgRaRMMa8WNaQIdlaINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRaga8Aa8L2gHcdtfhXaiaYa8L2gwcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekava8Ac8S2fgQIdwa3aYcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8RagawcdtfhXaiaHcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YaCaYfRbbcd9hmbdna8Ka8Ja8Jazfydba8ASEaaazfydbgHcdtfydbgzcu9hmbaaa8AcdtfydbhzkavaHc8S2fgQIdwa3azcx2fgeIdwg8WNaQIdzaeIdbg8UNaQIdaMgRaRMMa8WNaQIdlaeIdlgINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRagaza8L2gwcdtfhXaiaHa8L2g8NcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekavazc8S2fgQIdwa3aHcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8Raga8NcdtfhXaiawcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YkaKa80a8Ya80a8Y9FgeEUdwaKa8AaYaeaETVgeEBdlaKaYa8AaeEBdbaLcefgLa8E9hmbkasc;Wbfcbcj;qbz:ojjjb8Aa0hea8EhXinasc;WbfaeydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbcefBdbaecxfheaXcufgXmbkcbhecbhXinasc;WbfaefgQydbhKaQaXBdbaKaXfhXaeclfgecj;qb9hmbkcbhea0hXinasc;WbfaXydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbgQcefBdbaraQcdtfaeBdbaXcxfhXa8Eaecefge9hmbkadak9RgQci9Uh9mdnalTmbcbheayhXinaXaeBdbaXclfhXalaecefge9hmbkkcbh9na9icbalz:ojjjbh8FaQcO9Uh9oa9mce4h9pasydwh9qcbh8Mcbh5dninaDara5cdtfydbcx2fg8NIdwgRa9c9Emea8Ma9m9pmeJFFuuh8Rdna9pa8E9pmbaDara9pcdtfydbcx2fIdwJbb;aZNh8RkdnaRa8R9ETmbaRac9ETmba8Ma9o0mdkdna8FaAa8NydlgHcdtg9rfydbgKfg9sRbba8FaAa8Nydbgzcdtg9tfydbgefg9uRbbVmbaCazfRbbh9vdnaTaecdtfgXclfydbgQaXydbgXSmbaQaX9RhYa3aKcx2fhLa3aecx2fhEa9qaXcitfhecbhXcehwdnindnayaeydbcdtfydbgQaKSmbayaeclfydbcdtfydbg8AaKSmbaQa8ASmba3a8Acx2fg8AIdba3aQcx2fgQIdbg8W:tgRaEIdlaQIdlg8U:tg8XNaEIdba8W:tg8Ya8AIdla8U:tg8RN:tgIaRaLIdla8U:tg80NaLIdba8W:tg81a8RN:tg8UNa8RaEIdwaQIdwg8S:tg8ZNa8Xa8AIdwa8S:tg8WN:tg8Xa8RaLIdwa8S:tgBNa80a8WN:tg8RNa8Wa8YNa8ZaRN:tg8Sa8Wa81NaBaRN:tgRNMMaIaINa8Xa8XNa8Sa8SNMMa8Ua8UNa8Ra8RNaRaRNMMN:rJbbj8:N9FmdkaecwfheaXcefgXaY6hwaYaX9hmbkkawceGTmba9pcefh9pxekdndndndna9vc9:fPdebdkazheinayaecdtgefaHBdbaaaefydbgeaz9hmbxikkdna8Ka8Ja8Ja9tfydbaHSEaaa9tfydbgzcdtfydbgecu9hmbaaa9rfydbhekaya9tfaHBdbaehHkayazcdtfaHBdbka9uce86bba9sce86bba8NIdwgRacacaR9DEhca9ncefh9ncecda9vceSEa8Mfh8Mka5cefg5a8E9hmbkka9nTmddnalTmbcbh8AcbhEindnayaEcdtgefydbgQaESmbaAaQcdtfydbhzdnaEaAaefydb9hgHmbaqazc8S2fgeaqaEc8S2fgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdyka8LTmbavaQc8S2fgeavaEc8S2gwfgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdya9kaQ2hLaihXa8LhKinaXaLfgeaXa8AfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaHmbJbbbbJbbjZaqawfgeIdygR:vaRJbbbb9BEaeIdwa3azcx2fgXIdwgRNaeIdzaXIdbg8RNaeIdaMg8Wa8WMMaRNaeIdlaXIdlg8WNaeIdCaRNaeId3MgRaRMMa8WNaeIdba8RNaeIdxa8WNaeIdKMgRaRMMa8RNaeId8KMMM:lNgRa83a83aR9DEh83ka8Aa9kfh8AaEcefgEal9hmbkcbhXa8JheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8JaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkcbhXa8KheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8KaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkka83aca8LEh83cbhKabhecbhYindnayaeydbcdtfydbgXayaeclfydbcdtfydbgQSmbaXayaecwfydbcdtfydbg8ASmbaQa8ASmbabaKcdtfgLaXBdbaLcwfa8ABdbaLclfaQBdbaKcifhKkaecxfheaYcifgYad6mbkdndnaJTmbaKak9nmba8Va839FTmbcbhdabhecbhXindnaoahaeydbgQcdtfydbcdtfIdba839ETmbabadcdtfgYaQBdbaYclfaeclfydbBdbaYcwfaecwfydbBdbadcifhdkaecxfheaXcifgXaK6mbkJFFuuh8Va9eTmeaohea9ehXJFFuuhRinaeIdbg8RaRaRa8R9EEg8WaRa8Ra839EgQEhRa8Wa8VaQEh8VaeclfheaXcufgXmbxdkkaKhdkadak0mbxdkkasclfabadalaAz:cjjjbkdndnadak0mbadhXxekdnaJmbadhXxekdna8Va9c9FmbadhXxekina8VJbb;aZNgRa9caRa9c9DEh8WJbbbbhRdna9eTmbaohea9ehAinaeIdbg8RaRa8Ra8W9FEaRa8RaR9EEhRaeclfheaAcufgAmbkkcbhXabhecbhAindnaoahaeydbgQcdtfydbcdtfIdba8W9ETmbabaXcdtfgKaQBdbaKclfaeclfydbBdbaKcwfaecwfydbBdbaXcifhXkaecxfheaAcifgAad6mbkJFFuuh8Vdna9eTmbaohea9ehAJFFuuh8RinaeIdbg8Ua8Ra8Ra8U9EEgIa8Ra8Ua8W9EgQEh8RaIa8VaQEh8VaeclfheaAcufgAmbkkdnaXad9hmbadhXxdkaRacacaR9DEhcaXak9nmeaXhda8Va9c9FmbkkdnamcjjjjlGTmbaOmbaXTmbcbh8AabheinaCaeydbgKfRbbc3thLaecwfgEydbhAdndna8JaKcdtgHfydbaeclfgzydbgQSmbcbhYa8KaQcdtfydbaK9hmekcjjjj94hYkaeaLaYVaKVBdbaCaQfRbbc3thLdndna8JaQcdtfydbaASmbcbhYa8KaAcdtfydbaQ9hmekcjjjj94hYkazaLaYVaQVBdbaCaAfRbbc3thYdndna8JaAcdtfydbaKSmbcbhQa8KaHfydbaA9hmekcjjjj94hQkaEaYaQVaAVBdbaecxfhea8Acifg8AaX6mbkkdnaOTmbaXTmbaXheinabaOabydbcdtfydbBdbabclfhbaecufgembkkdnaPTmbaPaUac:rNUdbka9hcdtascxffcxfhednina6Tmeaeydbcbyd1:jjjbH:bjjjbbaec98fhea6cufh6xbkkasc;W;qbf8KjjjjbaXk;Yieouabydlhvabydbclfcbaicdtz:ojjjbhoadci9UhrdnadTmbdnalTmbaehwadhDinaoalawydbcdtfydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbxdkkaehwadhDinaoawydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbkkdnaiTmbcbhDaohwinawydbhqawaDBdbawclfhwaqaDfhDaicufgimbkkdnadci6mbinaecwfydbhwaeclfydbhDaeydbhidnalTmbalawcdtfydbhwalaDcdtfydbhDalaicdtfydbhikavaoaicdtfgqydbcitfaDBdbavaqydbcitfawBdlaqaqydbcefBdbavaoaDcdtfgqydbcitfawBdbavaqydbcitfaiBdlaqaqydbcefBdbavaoawcdtfgwydbcitfaiBdbavawydbcitfaDBdlawawydbcefBdbaecxfhearcufgrmbkkabydbcbBdbk:todDue99aicd4aifhrcehwinawgDcethwaDar6mbkcuaDcdtgraDcFFFFi0Ecbyd:m:jjjbHjjjjbbhwaoaoyd9GgqcefBd9GaoaqcdtfawBdbawcFearz:ojjjbhkdnaiTmbalcd4hlaDcufhxcbhminamhDdnavTmbavamcdtfydbhDkcbadaDal2cdtfgDydlgwawcjjjj94SEgwcH4aw7c:F:b:DD2cbaDydbgwawcjjjj94SEgwcH4aw7c;D;O:B8J27cbaDydwgDaDcjjjj94SEgDcH4aD7c:3F;N8N27axGhwamcdthPdndndnavTmbakawcdtfgrydbgDcuSmeadavaPfydbal2cdtfgsIdbhzcehqinaqhrdnadavaDcdtfydbal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmlkarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbxdkkakawcdtfgrydbgDcuSmbadamal2cdtfgsIdbhzcehqinaqhrdnadaDal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmikarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbkkaramBdbamhDkabaPfaDBdbamcefgmai9hmbkkakcbyd1:jjjbH:bjjjbbaoaoyd9GcufBd9GdnaeTmbaiTmbcbhDaehwinawaDBdbawclfhwaiaDcefgD9hmbkcbhDaehwindnaDabydbgrSmbawaearcdtfgrydbBdbaraDBdbkawclfhwabclfhbaiaDcefgD9hmbkkk;Qodvuv998Jjjjjbca9Rgvczfcwfcbyd11jjbBdbavcb8Pdj1jjb83izavcwfcbydN1jjbBdbavcb8Pd:m1jjb83ibdnadTmbaicd4hodnabmbdnalTmbcbhrinaealarcdtfydbao2cdtfhwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxikkaocdthrcbhwincbhiinavczfaifgDaeaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkaearfheawcefgwad9hmbxdkkdnalTmbcbhrinabarcx2fgiaealarcdtfydbao2cdtfgwIdbUdbaiawIdlUdlaiawIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxdkkaocdthlcbhraehwinabarcx2fgiaearao2cdtfgDIdbUdbaiaDIdlUdlaiaDIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkawalfhwarcefgrad9hmbkkJbbbbavIdbavIdzgk:tgqaqJbbbb9DEgqavIdlavIdCgx:tgmamaq9DEgqavIdwavIdKgm:tgPaPaq9DEhPdnabTmbadTmbJbbbbJbbjZaP:vaPJbbbb9BEhqinabaqabIdbak:tNUdbabclfgvaqavIdbax:tNUdbabcwfgvaqavIdbam:tNUdbabcxfhbadcufgdmbkkaPk:ZlewudnaeTmbcbhvabhoinaoavBdbaoclfhoaeavcefgv9hmbkkdnaiTmbcbhrinadarcdtfhwcbhDinalawaDcdtgvc;a1jjbfydbcdtfydbcdtfydbhodnabalawavfydbcdtfydbgqcdtfgkydbgvaqSmbinakabavgqcdtfgxydbgvBdbaxhkaqav9hmbkkdnabaocdtfgkydbgvaoSmbinakabavgocdtfgxydbgvBdbaxhkaoav9hmbkkdnaqaoSmbabaqaoaqao0Ecdtfaqaoaqao6EBdbkaDcefgDci9hmbkarcifgrai6mbkkdnaembcbskcbhxindnalaxcdtgvfydbax9hmbaxhodnabavfgDydbgvaxSmbaDhqinaqabavgocdtfgkydbgvBdbakhqaoav9hmbkkaDaoBdbkaxcefgxae9hmbkcbhvabhocbhkindndnavalydbgq9hmbdnavaoydbgq9hmbaoakBdbakcefhkxdkaoabaqcdtfydbBdbxekaoabaqcdtfydbBdbkaoclfhoalclfhlaeavcefgv9hmbkakk;Jiilud99duabcbaecltz:ojjjbhvdnalTmbadhoaihralhwinarcwfIdbhDarclfIdbhqavaoydbcltfgkarIdbakIdbMUdbakclfgxaqaxIdbMUdbakcwfgxaDaxIdbMUdbakcxfgkakIdbJbbjZMUdbaoclfhoarcxfhrawcufgwmbkkdnaeTmbavhraehkinarcxfgoIdbhDaocbBdbararIdbJbbbbJbbjZaD:vaDJbbbb9BEgDNUdbarclfgoaDaoIdbNUdbarcwfgoaDaoIdbNUdbarczfhrakcufgkmbkkdnalTmbinavadydbcltfgrcxfgkaicwfIdbarcwfIdb:tgDaDNaiIdbarIdb:tgDaDNaiclfIdbarclfIdb:tgDaDNMMgDakIdbgqaqaD9DEUdbadclfhdaicxfhialcufglmbkkdnaeTmbavcxfhrinabarIdbUdbarczfhrabclfhbaecufgembkkk8MbabaeadaialavcbcbcbcbcbaoarawaDz:bjjjbk8MbabaeadaialavaoarawaDaqakaxamaPz:bjjjbk:DCoDud99rue99iul998Jjjjjbc;Wb9Rgw8KjjjjbdndnarmbcbhDxekawcxfcbc;Kbz:ojjjb8Aawcuadcx2adc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbgqBdxawceBd2aqaeadaicbz:ejjjb8AawcuadcdtadcFFFFi0Egkcbyd:m:jjjbHjjjjbbgxBdzawcdBd2adcd4adfhmceheinaegicetheaiam6mbkcbhPawcuaicdtgsaicFFFFi0Ecbyd:m:jjjbHjjjjbbgzBdCawciBd2dndnar:ZgH:rJbbbZMgO:lJbbb9p9DTmbaO:Ohexekcjjjj94hekaicufhAc:bwhmcbhCadhXcbhQinaChLaeamgKcufaeaK9iEaPgDcefaeaD9kEhYdndnadTmbaYcuf:YhOaqhiaxheadhmindndnaiIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbh5cbhPindna3axaPcdtfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbaeaCSmbcehiina3amaifaAGgmcdtfgEydbgecuSmeaicefhiaeaC9hmbkkaEaCBdba5aecuSfh5aPcefgPad9hmbxdkkazcFeasz:ojjjb8Acbh5kaDaYa5ar0giEhPaLa5aiEhCdna5arSmbaYaKaiEgmaP9Rcd9imbdndnaQcl0mbdnaX:ZgOaL:Zg8A:taY:Yg8EaD:Y:tg8Fa8EaK:Y:tgaa5:ZghaH:tNNNaOaH:taaNa8Aah:tNa8AaH:ta8FNahaO:tNM:va8EMJbbbZMgO:lJbbb9p9DTmbaO:Ohexdkcjjjj94hexekaPamfcd9Theka5aXaiEhXaQcefgQcs9hmekkdndnaCmbcihicbhDxekcbhiawakcbyd:m:jjjbHjjjjbbg5BdKawclBd2aPcuf:Yh8AdndnadTmbaqhiaxheadhmindndnaiIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbhDcbhYindndndna3axaYcdtgKfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbcehiinaxaecdtgefydbaCSmdamaifheaicefhia3aeaAGgmcdtfgEydbgecu9hmbkkaEaYBdbaDhiaDcefhDxeka5aefydbhika5aKfaiBdbaYcefgYad9hmbkcuaDc32giaDc;j:KM;jb0EhexekazcFeasz:ojjjb8AcbhDcbhekawaecbyd:m:jjjbHjjjjbbgeBd3awcvBd2aecbaiz:ojjjbhEavcd4hKdnadTmbdnalTmbaKcdth3a5hCaqhealhmadhAinaEaCydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiamIdbaiIdxMUdxaiamclfIdbaiIdzMUdzaiamcwfIdbaiIdCMUdCaiaiIdKJbbjZMUdKaCclfhCaecxfheama3fhmaAcufgAmbxdkka5hmaqheadhCinaEamydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiaiIdxJbbbbMUdxaiaiIdzJbbbbMUdzaiaiIdCJbbbbMUdCaiaiIdKJbbjZMUdKamclfhmaecxfheaCcufgCmbkkdnaDTmbaEhiaDheinaiaiIdbJbbbbJbbjZaicKfIdbgO:vaOJbbbb9BEgONUdbaiclfgmaOamIdbNUdbaicwfgmaOamIdbNUdbaicxfgmaOamIdbNUdbaiczfgmaOamIdbNUdbaicCfgmaOamIdbNUdbaic3fhiaecufgembkkcbhCawcuaDcdtgYaDcFFFFi0Egicbyd:m:jjjbHjjjjbbgeBdaawcoBd2awaicbyd:m:jjjbHjjjjbbg3Bd8KaecFeaYz:ojjjbhxdnadTmbJbbjZJbbjZa8A:vaPceSEaoNgOaONh8AaKcdthPalheina8Aaec;81jjbalEgmIdwaEa5ydbgAc32fgiIdC:tgOaONamIdbaiIdx:tgOaONamIdlaiIdz:tgOaONMMNaqcwfIdbaiIdw:tgOaONaqIdbaiIdb:tgOaONaqclfIdbaiIdl:tgOaONMMMhOdndnaxaAcdtgifgmydbcuSmba3aifIdbaO9ETmekamaCBdba3aifaOUdbka5clfh5aqcxfhqaeaPfheadaCcefgC9hmbkkabaxaYz:njjjb8AcrhikaicdthiinaiTmeaic98fgiawcxffydbcbyd1:jjjbH:bjjjbbxbkkawc;Wbf8KjjjjbaDk:Ydidui99ducbhi8Jjjjjbca9Rglczfcwfcbyd11jjbBdbalcb8Pdj1jjb83izalcwfcbydN1jjbBdbalcb8Pd:m1jjb83ibdndnaembJbbjFhvJbbjFhoJbbjFhrxekadcd4cdthwincbhdinalczfadfgDabadfIdbgvaDIdbgoaoav9EEUdbaladfgDavaDIdbgoaoav9DEUdbadclfgdcx9hmbkabawfhbaicefgiae9hmbkalIdwalIdK:thralIdlalIdC:thoalIdbalIdz:thvkJbbbbavavJbbbb9DEgvaoaoav9DEgvararav9DEk9DeeuabcFeaicdtz:ojjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcifc98GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcrfc94GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd:q:jjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd:q:jjjbfgdBd:q:jjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk:Iedbcjwk1eFFuuFFuuFFuuFFuFFFuFFFuFbbbbbbbbeeebeebebbeeebebbbbbebebbbbbbbbbebbbdbbbbbbbebbbebbbdbbbbbbbbbbbeeeeebebbebbebebbbeebbbbbbbbbbbbbbbbbbbbbc1Dkxebbbdbbb:GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(n(t),{}).then(function(f){a=f.instance,a.exports.__wasm_call_ctors()});function n(f){for(var l=new Uint8Array(f.length),y=0;y<f.length;++y){var b=f.charCodeAt(y);l[y]=b>96?b-97:b>64?b-39:b+4}for(var g=0,y=0;y<f.length;++y)l[g++]=l[y]<60?e[l[y]]:(l[y]-60)*64+l[++y];return l.buffer.slice(0,g)}function r(f){if(!f)throw new Error("Assertion failed")}function i(f){return new Uint8Array(f.buffer,f.byteOffset,f.byteLength)}function o(f,l,y){var b=a.exports.sbrk,g=b(l.length*4),x=b(y*4),M=new Uint8Array(a.exports.memory.buffer),T=i(l);M.set(T,g);var I=f(x,g,l.length,y);M=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(y);new Uint8Array(S.buffer).set(M.subarray(x,x+y*4)),T.set(M.subarray(g,g+l.length*4)),b(g-b(0));for(var R=0;R<l.length;++R)l[R]=S[l[R]];return[S,I]}function c(f){for(var l=0,y=0;y<f.length;++y){var b=f[y];l=l<b?b:l}return l}function d(f,l,y,b,g,x,M,T,I){var S=a.exports.sbrk,R=S(4),A=S(y*4),_=S(g*x),j=S(y*4),L=new Uint8Array(a.exports.memory.buffer);L.set(i(b),_),L.set(i(l),j);var F=f(A,j,y,_,g,x,M,T,I,R);L=new Uint8Array(a.exports.memory.buffer);var z=new Uint32Array(F);i(z).set(L.subarray(A,A+F*4));var W=new Float32Array(1);return i(W).set(L.subarray(R,R+4)),S(R-S(0)),[z,W[0]]}function h(f,l,y,b,g,x,M,T,I,S,R,A,_){var j=a.exports.sbrk,L=j(4),F=j(y*4),z=j(g*x),W=j(g*T),ae=j(I.length*4),oe=j(y*4),Oe=S?j(g):0,de=new Uint8Array(a.exports.memory.buffer);de.set(i(b),z),de.set(i(M),W),de.set(i(I),ae),de.set(i(l),oe),S&&de.set(i(S),Oe);var De=f(F,oe,y,z,g,x,W,T,ae,I.length,Oe,R,A,_,L);de=new Uint8Array(a.exports.memory.buffer);var He=new Uint32Array(De);i(He).set(de.subarray(F,F+De*4));var Me=new Float32Array(1);return i(Me).set(de.subarray(L,L+4)),j(L-j(0)),[He,Me[0]]}function u(f,l,y,b){var g=a.exports.sbrk,x=g(y*b),M=new Uint8Array(a.exports.memory.buffer);M.set(i(l),x);var T=f(x,y,b);return g(x-g(0)),T}function m(f,l,y,b,g,x,M,T){var I=a.exports.sbrk,S=I(T*4),R=I(y*b),A=I(y*x),_=new Uint8Array(a.exports.memory.buffer);_.set(i(l),R),g&&_.set(i(g),A);var j=f(S,R,y,b,A,x,M,T);_=new Uint8Array(a.exports.memory.buffer);var L=new Uint32Array(j);return i(L).set(_.subarray(S,S+j*4)),I(S-I(0)),L}var p={LockBorder:1,Sparse:2,ErrorAbsolute:4,Prune:8,_InternalDebug:1<<30};return{ready:s,supported:!0,compactMesh:function(f){r(f instanceof Uint32Array||f instanceof Int32Array||f instanceof Uint16Array||f instanceof Int16Array),r(f.length%3==0);var l=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f);return o(a.exports.meshopt_optimizeVertexFetchRemap,l,c(f)+1)},simplify:function(f,l,y,b,g,x){r(f instanceof Uint32Array||f instanceof Int32Array||f instanceof Uint16Array||f instanceof Int16Array),r(f.length%3==0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),r(b>=0&&b<=f.length),r(b%3==0),r(g>=0);for(var M=0,T=0;T<(x?x.length:0);++T)r(x[T]in p),M|=p[x[T]];var I=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f),S=d(a.exports.meshopt_simplify,I,f.length,l,l.length/y,y*4,b,g,M);return S[0]=f instanceof Uint32Array?S[0]:new f.constructor(S[0]),S},simplifyWithAttributes:function(f,l,y,b,g,x,M,T,I,S){r(f instanceof Uint32Array||f instanceof Int32Array||f instanceof Uint16Array||f instanceof Int16Array),r(f.length%3==0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),r(b instanceof Float32Array),r(b.length%g==0),r(g>=0),r(M==null||M instanceof Uint8Array),r(M==null||M.length==l.length/y),r(T>=0&&T<=f.length),r(T%3==0),r(I>=0),r(Array.isArray(x)),r(g>=x.length),r(x.length<=32);for(var R=0;R<x.length;++R)r(x[R]>=0);for(var A=0,R=0;R<(S?S.length:0);++R)r(S[R]in p),A|=p[S[R]];var _=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f),j=h(a.exports.meshopt_simplifyWithAttributes,_,f.length,l,l.length/y,y*4,b,g*4,new Float32Array(x),M?new Uint8Array(M):null,T,I,A);return j[0]=f instanceof Uint32Array?j[0]:new f.constructor(j[0]),j},getScale:function(f,l){return r(f instanceof Float32Array),r(f.length%l==0),r(l>=3),u(a.exports.meshopt_simplifyScale,f,f.length/l,l*4)},simplifyPoints:function(f,l,y,b,g,x){return r(f instanceof Float32Array),r(f.length%l==0),r(l>=3),r(y>=0&&y<=f.length/l),b?(r(b instanceof Float32Array),r(b.length%g==0),r(g>=3),r(f.length/l==b.length/g),m(a.exports.meshopt_simplifyPoints,f,f.length/l,l*4,b,g*4,x,y)):m(a.exports.meshopt_simplifyPoints,f,f.length/l,l*4,void 0,0,0,y)}}})();var rw=(function(){var t="b9H79TebbbeVx9Geueu9Geub9Gbb9Giuuueu9Gmuuuuuuuuuuu9999eu9Gvuuuuueu9Gwuuuuuuuub9Gxuuuuuuuuuuuueu9Gkuuuuuuuuuu99eu9Gouuuuuub9Gruuuuuuub9GluuuubiOHdilvorwDqqkbiibeilve9Weiiviebeoweuec;G:Odkr:Yewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9I919P29K9nW79O2Wt79c9V919U9KbeX9TW79O9V9Wt9F9I919P29K9nW79O2Wt7bo39TW79O9V9Wt9F9J9V9T9W91tWJ2917tWV9c9V919U9K7br39TW79O9V9Wt9F9J9V9T9W91tW9nW79O2Wt9c9V919U9K7bDL9TW79O9V9Wt9F9V9Wt9P9T9P96W9nW79O2Wtbql79IV9RbkDwebcekdsPq;Q9BHdbkIbabaec9:fgefcufae9Ugeabci9Uadfcufad9Ugbaeab0Ek:w8KDPue99eux99dui99euo99iu8Jjjjjbc:WD9Rgm8KjjjjbdndnalmbcbhPxekamc:Cwfcbc;Kbz:njjjb8Adndnalcb9imbaoal9nmbamcuaocdtaocFFFFi0Egscbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamascbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8waihsalhAinazasydbcdtfcbBdbasclfhsaAcufgAmbkaihsalhAinazasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkaihsalhCcbhXindnazasydbcdtgQfgAydbcb9imbaHaQfaXBdbaAaAydbgQcjjjj94VBdbaQaXfhXkasclfhsaCcufgCmbkalci9UhLdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhXaHaAydbcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaXcdtfgXaXydbgXcefBdbaOaXcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaihsalhAindnazasydbcdtgCfgXydbgQcu9kmbaXaQcFFFFrGgQBdbaHaCfgCaCydbaQ9RBdbkasclfhsaAcufgAmbxdkkamcuaocdtgsaocFFFFi0EgAcbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamaAcbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8wazcbasz:njjjbhXalci9UhLaihsalhAinaXasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkdnaoTmbcbhsaHhAaXhCaohQinaAasBdbaAclfhAaCydbasfhsaCclfhCaQcufgQmbkkdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhQaHaAydbcdtfgKaKydbgKcefBdbaOaKcdtfasBdbaHaQcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaoTmbcbhsaohAinaHasfgCaCydbaXasfydb9RBdbasclfhsaAcufgAmbkkamaLcbyd;y1jjbHjjjjbbgsBd:OwamclBd;8wascbaLz:njjjbhYamcuaLcK2alcjjjjd0Ecbyd;y1jjbHjjjjbbg8ABd:SwamcvBd;8wJbbbbhEdnalci6g3mbarcd4hKaihAa8AhsaLhrJbbbbh5inavaAclfydbaK2cdtfgCIdlh8EavaAydbaK2cdtfgXIdlhEavaAcwfydbaK2cdtfgQIdlh8FaCIdwhaaXIdwhhaQIdwhgasaCIdbg8JaXIdbg8KMaQIdbg8LMJbbnn:vUdbasclfaXIdlaCIdlMaQIdlMJbbnn:vUdbaQIdwh8MaCIdwh8NaXIdwhyascxfa8EaE:tg8Eagah:tggNa8FaE:tg8Faaah:tgaN:tgEJbbbbJbbjZa8Ja8K:tg8Ja8FNa8La8K:tg8Ka8EN:tghahNaEaENaaa8KNaga8JN:tgEaENMM:rg8K:va8KJbbbb9BEg8ENUdbasczfaEa8ENUdbascCfaha8ENUdbascwfa8Maya8NMMJbbnn:vUdba5a8KMh5aAcxfhAascKfhsarcufgrmbka5aL:Z:vJbbbZNhEkamcuaLcdtalcFFFF970Ecbyd;y1jjbHjjjjbbgCBd:WwamcoBd;8waEaq:ZNhEdna3mbcbhsaChAinaAasBdbaAclfhAaLascefgs9hmbkkaE:rhhcuh8PamcuaLcltalcFFFFd0Ecbyd;y1jjbHjjjjbbgIBd:0wamcrBd;8wcbaIa8AaCaLz:djjjb8AJFFuuhyJFFuuh8RJFFuuh8Sdnalci6gXmbJFFuuh8Sa8AhsaLhAJFFuuh8RJFFuuhyinascwfIdbgEayayaE9EEhyasclfIdbgEa8Ra8RaE9EEh8RasIdbgEa8Sa8SaE9EEh8SascKfhsaAcufgAmbkkahJbbbZNhgamaocetgscuaocu9kEcbyd;y1jjbHjjjjbbgABd:4waAcFeasz:njjjbhCdnaXmbcbhAJFFuuhEa8Ahscuh8PinascwfIdbay:tghahNasIdba8S:tghahNasclfIdba8R:tghahNMM:rghaEa8PcuSahaE9DVgXEhEaAa8PaXEh8PascKfhsaLaAcefgA9hmbkkamczfcbcjwz:njjjb8Aamcwf9cb83ibam9cb83ibagaxNhRJbbjZak:th8Ncbh8UJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80cbh81cbhPinJbbbbhEdna8UTmbJbbjZa8U:Z:vhEkJbbbbhhdna80a80Na8Ya8YNa8Za8ZNMMg8KJbbbb9BmbJbbjZa8K:r:vhhka8XaENh5a8WaENh8Fa8VaENhaa8PhQdndndndndna8UaPVTmbamydwgBTmea80ahNh8Ja8ZahNh8La8YahNh8Maeamydbcdtfh83cbh3JFFuuhEcvhXcuhQindnaza83a3cdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAindndnaCaiaAydbgKcx2fgsclfydbgrcetf8Vebcs4aCasydbgLcetf8Vebcs4faCascwfydbglcetf8Vebcs4fgombcbhsxekcehsazaLcdtfydbgLceSmbcehsazarcdtfydbgrceSmbcehsazalcdtfydbglceSmbdnarcdSaLcdSfalcdSfcd6mbaocefhsxekaocdfhskdnasaX9kmba8AaKcK2fgLIdwa5:thhaLIdla8F:th8KaLIdbaa:th8EdndnakJbbbb9DTmba8E:lg8Ea8K:lg8Ka8Ea8K9EEg8Kah:lgha8Kah9EEag:vJbbjZMhhxekahahNa8Ea8ENa8Ka8KNMM:rag:va8NNJbbjZMJ9VO:d86JbbjZaLIdCa8JNaLIdxa8MNa8LaLIdzNMMakN:tghahJ9VO:d869DENhhkaKaQasaX6ahaE9DVgLEhQasaXaLEhXahaEaLEhEkaAclfhAavcufgvmbkka3cefg3aB9hmbkkaQcu9hmekama5Ud:ODama8FUd:KDamaaUd:GDamcuBd:qDamcFFF;7rBdjDaIcba8AaYamc:GDfakJbbbb9Damc:qDfamcjDfz:ejjjbamyd:qDhQdndnaxJbbbb9ETmba8UaD6mbaQcuSmeceh3amIdjDaR9EmixdkaQcu9hmekdna8UTmbdnamydlgza8Uci2fgsciGTmbadasfcba8Uazcu7fciGcefz:njjjb8AkabaPcltfgzam8Pib83dbazcwfamcwf8Pib83dbaPcefhPkc3hzinazc98Smvamc:Cwfazfydbcbyd;u1jjbH:bjjjbbazc98fhzxbkkcbh3a8Uaq9pmbamydwaCaiaQcx2fgsydbcetf8Vebcs4aCascwfydbcetf8Vebcs4faCasclfydbcetf8Vebcs4ffaw9nmekcbhscbhAdna81TmbcbhAamczfhXinamczfaAcdtfaXydbgLBdbaXclfhXaAaYaLfRbbTfhAa81cufg81mbkkamydwhlamydbhXam9cu83i:GDam9cu83i:ODam9cu83i:qDam9cu83i:yDaAc;8eaAclfc:bd6Eh81inamcjDfasfcFFF;7rBdbasclfgscz9hmbka81cdthBdnalTmbaeaXcdtfhocbhrindnazaoarcdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAcuhLcuhsinazaiaAydbgKcx2fgXclfydbcdtfydbazaXydbcdtfydbfazaXcwfydbcdtfydbfgXasaXas6gXEhsaKaLaXEhLaAclfhAavcufgvmbkaLcuSmba8AaLcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEcbhAindndnasamc:qDfaAfgvydbgX6mbasaX9hmeaEamcjDfaAfIdb9FTmekavasBdbamc:GDfaAfaLBdbamcjDfaAfaEUdbxdkaAclfgAcz9hmbkkarcefgral9hmbkkamczfaBfhLcbhscbhAindnamc:GDfasfydbgXcuSmbaLaAcdtfaXBdbaAcefhAkasclfgscz9hmbkaAa81fg81TmbJFFuuhhcuhKamczfhsa81hvcuhLina8AasydbgXcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEdndnazaiaXcx2fgAclfydbcdtfydbazaAydbcdtfydbfazaAcwfydbcdtfydbfgAaL6mbaAaL9hmeaEah9DTmekaEhhaAhLaXhKkasclfhsavcufgvmbkaKcuSmbaKhQkdnamaiaQcx2fgrydbarclfydbarcwfydbaCabaeadaPawaqa3z:fjjjbTmbaPcefhPJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80kcbhXinaOaHaraXcdtfydbcdtgAfydbcdtfgKhsazaAfgvydbgLhAdnaLTmbdninasydbaQSmeasclfhsaAcufgATmdxbkkasaKaLcdtfc98fydbBdbavavydbcufBdbkaXcefgXci9hmbka8AaQcK2fgsIdbhEasIdlhhasIdwh8KasIdxh8EasIdzh5asIdCh8FaYaQfce86bba80a8FMh80a8Za5Mh8Za8Ya8EMh8Ya8Xa8KMh8Xa8WahMh8Wa8VaEMh8Vamydxh8Uxbkkamc:WDf8KjjjjbaPk;Vvivuv99lu8Jjjjjbca9Rgv8Kjjjjbdndnalcw0mbaiydbhoaeabcitfgralcdtcufBdlaraoBdbdnalcd6mbaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkkalabfhrxekcbhDavczfcwfcbBdbav9cb83izavcwfcbBdbav9cb83ibJbbjZhqJbbjZhkinadaiaDcdtfydbcK2fhwcbhrinavczfarfgoawarfIdbgxaoIdbgm:tgPakNamMgmUdbavarfgoaPaxam:tNaoIdbMUdbarclfgrcx9hmbkJbbjZaqJbbjZMgq:vhkaDcefgDal9hmbkcbhoadcbcecdavIdlgxavIdwgm9GEgravIdbgPam9GEaraPax9GEgscdtgrfhzavczfarfIdbhxaihralhwinaiaocdtfgDydbhHaDarydbgOBdbaraHBdbarclfhraoazaOcK2fIdbax9Dfhoawcufgwmbkaeabcitfhrdndnaocv6mbaoalc98f6mekaraiydbBdbaralcdtcufBdlaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkalabfhrxekaraxUdbararydlc98GasVBdlabcefaeadaiaoz:djjjbhwararydlciGawabcu7fcdtVBdlawaeadaiaocdtfalao9Rz:djjjbhrkavcaf8Kjjjjbark:;idiud99dndnabaecitfgwydlgDciGgqciSmbinabcbaDcd4gDalaqcdtfIdbawIdb:tgkJbbbb9FEgwaecefgefadaialavaoarz:ejjjbak:larIdb9FTmdabawaD7aefgecitfgwydlgDciGgqci9hmbkkabaecitfgeclfhbdnavmbcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdwalIdw:tgkakNaqIdbalIdb:tgkakNaqIdlalIdl:tgkakNMM:rgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbxdkkcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdbalIdb:t:lgkaqIdlalIdl:t:lgxakax9EEgkaqIdwalIdw:t:lgxakax9EEgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbkkk;llevudnabydwgxaladcetfgm8Vebcs4alaecetfgP8Vebgscs4falaicetfgz8Vebcs4ffaD0abydxaq9pVakVgDce9hmbavawcltfgxab8Pdb83dbaxcwfabcwfgx8Pdb83dbdnaxydbgqTmbaoabydbcdtfhxaqhsinalaxydbcetfcFFi87ebaxclfhxascufgsmbkkdnabydxglci2gsabydlgxfgkciGTmbarakfcbalaxcu7fciGcefz:njjjb8Aabydxci2hsabydlhxabydwhqkab9cb83dwababydbaqfBdbabascifc98GaxfBdlaP8Vebhscbhxkdnascztcz91cu9kmbabaxcefBdwaPax87ebaoabydbcdtfaxcdtfaeBdbkdnam8Uebcu9kmbababydwgxcefBdwamax87ebaoabydbcdtfaxcdtfadBdbkdnaz8Uebcu9kmbababydwgxcefBdwazax87ebaoabydbcdtfaxcdtfaiBdbkarabydlfabydxci2faPRbb86bbarabydlfabydxci2fcefamRbb86bbarabydlfabydxci2fcdfazRbb86bbababydxcefBdxaDk8LbabaeadaialavaoarawaDaDaqJbbbbz:cjjjbk;Nkovud99euv99eul998Jjjjjbc:W;ae9Rgo8KjjjjbdndnadTmbavcd4hrcbhwcbhDindnaiaeclfydbar2cdtfgvIdbaiaeydbar2cdtfgqIdbgk:tgxaiaecwfydbar2cdtfgmIdlaqIdlgP:tgsNamIdbak:tgzavIdlaP:tgPN:tgkakNaPamIdwaqIdwgH:tgONasavIdwaH:tgHN:tgPaPNaHazNaOaxN:tgxaxNMM:rgsJbbbb9Bmbaoc:W:qefawcx2fgAakas:vUdwaAaxas:vUdlaAaPas:vUdbaoc8Wfawc8K2fgAaq8Pdb83dbaAav8Pdb83dxaAam8Pdb83dKaAcwfaqcwfydbBdbaAcCfavcwfydbBdbaAcafamcwfydbBdbawcefhwkaecxfheaDcifgDad6mbkab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbawTmeaocbBd8Sao9cb83iKao9cb83izaoczfaoc8Wfawci2cxaoc8Sfcbcrz1jjjbaoIdKhCaoIdChXaoIdzhQao9cb83iwao9cb83ibaoaoc:W:qefawcxaoc8Sfcbciz1jjjbJbbjZhkaoIdwgPJbbbbJbbjZaPaPNaoIdbgPaPNaoIdlgsasNMM:rgx:vaxJbbbb9BEgzNhxasazNhsaPazNhzaoc:W:qefheawhvinaecwfIdbaxNaeIdbazNasaeclfIdbNMMgPakaPak9DEhkaecxfheavcufgvmbkabaCUdwabaXUdlabaQUdbabaoId3UdxdndnakJ;n;m;m899FmbJbbbbhPaoc:W:qefheaoc8WfhvinaCavcwfIdb:taecwfIdbgHNaQavIdb:taeIdbgONaXavclfIdb:taeclfIdbgLNMMaxaHNazaONasaLNMM:vgHaPaHaP9EEhPavc8KfhvaecxfheawcufgwmbkabaxUd8KabasUdaabazUd3abaCaxaPN:tUdKabaXasaPN:tUdCabaQazaPN:tUdzabJbbjZakakN:t:rgkUdydndnaxJbbj:;axJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;axJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohexekcjjjj94hekabae86b8UdndnasJbbj:;asJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;asJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkabav86bRdndnazJbbj:;azJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;azJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohqxekcjjjj94hqkabaq86b8SdndnaecKtcK91:YJbb;:9c:vax:t:lavcKtcK91:YJbb;:9c:vas:t:laqcKtcK91:YJbb;:9c:vaz:t:lakMMMJbb;:9cNJbbjZMgk:lJbbb9p9DTmbak:Ohexekcjjjj94hekaecFbaecFb9iEhexekabcjjj;8iBdycFbhekabae86b8Vxekab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbkaoc:W;aef8Kjjjjbk;Iwwvul99iud99eue99eul998Jjjjjbcje9Rgr8Kjjjjbavcd4hwaicd4hDdndnaoTmbarc;abfcbaocdtgvz:njjjb8Aarc;Gbfcbavz:njjjb8AarhvarcafhiaohqinavcFFF97BdbaicFFF;7rBdbaiclfhiavclfhvaqcufgqmbkdnadTmbcbhkinaeakaD2cdtfgvIdwhxavIdlhmavIdbhPalakaw2cdtfIdbhsarc;abfhzarhiarc;GbfhHarcafhqcj1jjbhvaohOinasavcwfIdbaxNavIdbaPNavclfIdbamNMMgAMhCakhXdnaAas:tgAaqIdbgQ9DgLmbaHydbhXkaHaXBdbakhXdnaCaiIdbgK9EmbazydbhXaKhCkazaXBdbaiaCUdbaqaAaQaLEUdbavcxfhvaqclfhqaHclfhHaiclfhiazclfhzaOcufgOmbkakcefgkad9hmbkkadThkJbbbbhCcbhXarc;abfhvarc;Gbfhicbhqinalavydbgzaw2cdtfIdbalaiydbgHaw2cdtfIdbaeazaD2cdtfgzIdwaeaHaD2cdtfgHIdw:tgsasNazIdbaHIdb:tgsasNazIdlaHIdl:tgsasNMM:rMMgsaCasaC9EgzEhCaqaXazEhXaiclfhiavclfhvaoaqcefgq9hmbkaCJbbbZNhKxekadThkcbhXJbbbbhKkJbbbbhCdnaearc;abfaXcdtgifydbgqaD2cdtfgvIdwaearc;GbfaifydbgzaD2cdtfgiIdwgm:tgsasNavIdbaiIdbgY:tgAaANavIdlaiIdlgP:tgQaQNMM:rgxJbbbb9ETmbaxalaqaw2cdtfIdbMalazaw2cdtfIdb:taxaxM:vhCkasaCNamMhmaQaCNaPMhPaAaCNaYMhYdnakmbaDcdthvawcdthiindnalIdbg8AaecwfIdbam:tgCaCNaeIdbaY:tgsasNaeclfIdbaP:tgAaANMM:rgQMgEaK9ETmbJbbbbhxdnaQJbbbb9ETmbaEaK:taQaQM:vhxkaxaCNamMhmaxaANaPMhPaxasNaYMhYa8AaKaQMMJbbbZNhKkaeavfhealaifhladcufgdmbkkabaKUdxabamUdwabaPUdlabaYUdbarcjef8Kjjjjbkjeeiu8Jjjjjbcj8W9Rgr8Kjjjjbaici2hwdnaiTmbawceawce0EhDarhiinaiaeadRbbcdtfydbBdbadcefhdaiclfhiaDcufgDmbkkabarawaladaoz:hjjjbarcj8Wf8Kjjjjbk:3lequ8JjjjjbcjP9Rgl8Kjjjjbcbhvalcjxfcbaiz:njjjb8AdndnadTmbcjehoaehrincuhwarhDcuhqavhkdninawakaoalcjxfaDcefRbbfRbb9RcFeGci6aoalcjxfaDRbbfRbb9RcFeGci6faoalcjxfaDcdfRbbfRbb9RcFeGci6fgxaq9mgmEhwdnammbaxce0mdkaxaqaxaq9kEhqaDcifhDadakcefgk9hmbkkaeawci2fgDcdfRbbhqaDcefRbbhxaDRbbhkaeavci2fgDcifaDawav9Rci2z:qjjjb8Aakalcjxffaocefgo86bbaxalcjxffao86bbaDcdfaq86bbaDcefax86bbaDak86bbaqalcjxffao86bbarcifhravcefgvad9hmbkalcFeaicetz:njjjbhoadci2gDceaDce0EhqcbhxindnaoaeRbbgkcetfgw8UebgDcu9kmbawax87ebaocjlfaxcdtfabakcdtfydbBdbaxhDaxcefhxkaeaD86bbaecefheaqcufgqmbkaxcdthDxekcbhDkabalcjlfaDz:mjjjb8AalcjPf8Kjjjjbk9teiucbcbyd;C1jjbgeabcifc98GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;C1jjbgeabcrfc94GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;C1jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;C1jjbfgdBd;C1jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk:;Deludndndnadch9pmbabaeSmdaeabadfgi9Rcbadcet9R0mekabaead;8qbbxekaeab7ciGhldndndnabae9pmbdnalTmbadhvabhixikdnabciGmbadhvabhixdkadTmiabaeRbb86bbadcufhvdnabcefgiciGmbaecefhexdkavTmiabaeRbe86beadc9:fhvdnabcdfgiciGmbaecdfhexdkavTmiabaeRbd86bdadc99fhvdnabcifgiciGmbaecifhexdkavTmiabaeRbi86biabclfhiaeclfheadc98fhvxekdnalmbdnaiciGTmbadTmlabadcufgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc9:fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc99fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc98fgdfaeadfRbb86bbkadcl6mbdnadc98fgocd4cefciGgiTmbaec98fhlabc98fhvinavadfaladfydbBdbadc98fhdaicufgimbkkaocx6mbaec9Wfhvabc9WfhoinaoadfgicxfavadfglcxfydbBdbaicwfalcwfydbBdbaiclfalclfydbBdbaialydbBdbadc9Wfgdci0mbkkadTmdadhidnadciGglTmbaecufhvabcufhoadhiinaoaifavaifRbb86bbaicufhialcufglmbkkadcl6mdaec98fhlabc98fhvinavaifgecifalaifgdcifRbb86bbaecdfadcdfRbb86bbaecefadcefRbb86bbaeadRbb86bbaic98fgimbxikkavcl6mbdnavc98fglcd4cefcrGgdTmbavadcdt9RhvinaiaeydbBdbaeclfheaiclfhiadcufgdmbkkalc36mbinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaiaeydzBdzaiaeydCBdCaiaeydKBdKaiaeyd3Bd3aecafheaicafhiavc9Gfgvci0mbkkavTmbdndnavcrGgdmbavhlxekavc94GhlinaiaeRbb86bbaicefhiaecefheadcufgdmbkkavcw6mbinaiaeRbb86bbaiaeRbe86beaiaeRbd86bdaiaeRbi86biaiaeRbl86blaiaeRbv86bvaiaeRbo86boaiaeRbr86braicwfhiaecwfhealc94fglmbkkabkk9Tdbcjwk9ubbjZbbbbbbbbbbbbbbjZbbbbbbbbbbbbbbjZ86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;bc;uwkxebbbdbbb9GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(n(t),{}).then(function(f){a=f.instance,a.exports.__wasm_call_ctors()});function n(f){for(var l=new Uint8Array(f.length),y=0;y<f.length;++y){var b=f.charCodeAt(y);l[y]=b>96?b-97:b>64?b-39:b+4}for(var g=0,y=0;y<f.length;++y)l[g++]=l[y]<60?e[l[y]]:(l[y]-60)*64+l[++y];return l.buffer.slice(0,g)}function r(f){if(!f)throw new Error("Assertion failed")}function i(f){return new Uint8Array(f.buffer,f.byteOffset,f.byteLength)}var o=48,c=16;function d(f,l){var y=f.meshlets[l*4+0],b=f.meshlets[l*4+1],g=f.meshlets[l*4+2],x=f.meshlets[l*4+3];return{vertices:f.vertices.subarray(y,y+g),triangles:f.triangles.subarray(b,b+x*3)}}function h(f,l,y,b,g,x,M){var T=a.exports.sbrk,I=a.exports.meshopt_buildMeshletsBound(f.length,g,x),S=T(I*c),R=T(I*g*4),A=T(I*x*3),_=T(f.byteLength),j=T(l.byteLength),L=new Uint8Array(a.exports.memory.buffer);L.set(i(f),_),L.set(i(l),j);var F=a.exports.meshopt_buildMeshlets(S,R,A,_,f.length,j,y,b,g,x,M);L=new Uint8Array(a.exports.memory.buffer);for(var z=L.subarray(S,S+F*c),W=new Uint32Array(z.buffer,z.byteOffset,z.byteLength/4).slice(),ae=0;ae<F;++ae){var oe=W[ae*4+0],Oe=W[ae*4+1],y=W[ae*4+2],de=W[ae*4+3];a.exports.meshopt_optimizeMeshlet(R+oe*4,A+Oe,de,y)}var De=W[(F-1)*4+0],He=W[(F-1)*4+1],Me=W[(F-1)*4+2],Ze=W[(F-1)*4+3],qe=De+Me,pt=He+(Ze*3+3&-4),oa={meshlets:W,vertices:new Uint32Array(L.buffer,R,qe).slice(),triangles:new Uint8Array(L.buffer,A,pt*3).slice(),meshletCount:F};return T(S-T(0)),oa}function u(f){var l=new Float32Array(a.exports.memory.buffer,f,o/4);return{centerX:l[0],centerY:l[1],centerZ:l[2],radius:l[3],coneApexX:l[4],coneApexY:l[5],coneApexZ:l[6],coneAxisX:l[7],coneAxisY:l[8],coneAxisZ:l[9],coneCutoff:l[10]}}function m(f,l,y,b){var g=a.exports.sbrk,x=[],M=g(l.byteLength),T=g(f.vertices.byteLength),I=g(f.triangles.byteLength),S=g(o),R=new Uint8Array(a.exports.memory.buffer);R.set(i(l),M),R.set(i(f.vertices),T),R.set(i(f.triangles),I);for(var A=0;A<f.meshletCount;++A){var _=f.meshlets[A*4+0],j=f.meshlets[A*4+0+1],L=f.meshlets[A*4+0+3];a.exports.meshopt_computeMeshletBounds(S,T+_*4,I+j,L,M,y,b),x.push(u(S))}return g(M-g(0)),x}function p(f,l,y,b){var g=a.exports.sbrk,x=g(o),M=g(f.byteLength),T=g(l.byteLength),I=new Uint8Array(a.exports.memory.buffer);I.set(i(f),M),I.set(i(l),T),a.exports.meshopt_computeClusterBounds(x,M,f.length,T,y,b);var S=u(x);return g(x-g(0)),S}return{ready:s,supported:!0,buildMeshlets:function(f,l,y,b,g,x){r(f.length%3==0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),r(b<=256||b>0),r(g<=512),r(g%4==0),x=x||0;var M=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f);return h(M,l,l.length/y,y*4,b,g,x)},computeClusterBounds:function(f,l,y){r(f.length%3==0),r(f.length/3<=512),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3);var b=f.BYTES_PER_ELEMENT==4?f:new Uint32Array(f);return p(b,l,l.length/y,y*4)},computeMeshletBounds:function(f,l,y){return r(f.meshletCount!=0),r(l instanceof Float32Array),r(l.length%y==0),r(y>=3),m(f,l,l.length/y,y*4)},extractMeshlet:function(f,l){return r(l>=0&&l<f.meshletCount),d(f,l)}}})();var lp=new vo().registerExtensions([ur,fr,hr]).registerDependencies({"meshopt.decoder":br});async function ua(t,e={}){await br.ready;let a;if(e.fetchBytes)a=new Uint8Array(await e.fetchBytes(t));else{let c=await fetch(t,{cache:e.fetchCache||"no-store"});if(!c.ok)throw new Error(`Failed to load ${t}: ${c.status}`);a=new Uint8Array(await c.arrayBuffer())}let s=await lp.readBinary(a),n=[],r=e.componentFeatures||new Map,i=new Map;function o(c,d=""){let h=r.has(c.getName());h&&i.set(c.getName(),(i.get(c.getName())||0)+1);let u=h?c.getName():d,m=c.getMesh();if(m){let p=c.getWorldMatrix();for(let f of m.listPrimitives()){let l=f.getAttribute("POSITION"),y=f.getAttribute("NORMAL"),b=f.getAttribute("_FEATURE_ID_0"),g=f.getAttribute("_FEATURE_ID_1"),x=f.getIndices()?.getArray();if(!l||!x)continue;let M=l.getCount(),T=new Float32Array(M*3),I=new Float32Array(M*3),S=new Uint32Array(M),R=new Uint32Array(M),A=[1/0,1/0,1/0,-1/0,-1/0,-1/0],_=[],j=r.get(u)?.featureId||e.defaultFeatureId||0;for(let F=0;F<M;F+=1)l.getElement(F,_),dp(T,F*3,_,p),A[0]=Math.min(A[0],T[F*3]),A[1]=Math.min(A[1],T[F*3+1]),A[2]=Math.min(A[2],T[F*3+2]),A[3]=Math.max(A[3],T[F*3]),A[4]=Math.max(A[4],T[F*3+1]),A[5]=Math.max(A[5],T[F*3+2]),y?(y.getElement(F,_),up(I,F*3,_,p)):I.set([0,0,1],F*3),S[F]=Number(b?.getScalar(F)||0),R[F]=Number(g?g.getScalar(F)||0:j);let L=f.getMaterial();n.push({position:T,normal:I,netId:S,objectFeatureId:R,indices:x,designator:u,nodeName:c.getName(),meshName:m.getName(),bounds:A,material:L?{name:L.getName(),baseColor:L.getBaseColorFactor(),metallic:L.getMetallicFactor(),roughness:L.getRoughnessFactor(),emissive:L.getEmissiveFactor()}:{baseColor:e.baseColor||[.55,.58,.64,1],metallic:.05,roughness:.72,emissive:[0,0,0]}})}}for(let p of c.listChildren())o(p,u)}for(let c of s.getRoot().listScenes())for(let d of c.listChildren())o(d);return{byteLength:a.byteLength,primitives:n,componentNodeCounts:i}}function dp(t,e,a,s){let n=s[0]*a[0]+s[4]*a[1]+s[8]*a[2]+s[12],r=s[1]*a[0]+s[5]*a[1]+s[9]*a[2]+s[13],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2]+s[14];t[e]=n,t[e+1]=-i,t[e+2]=r}function up(t,e,a,s){let n=s[0]*a[0]+s[4]*a[1]+s[8]*a[2],r=s[1]*a[0]+s[5]*a[1]+s[9]*a[2],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2],o=Math.hypot(n,r,i)||1;t[e]=n/o,t[e+1]=-i/o,t[e+2]=r/o}var Yt=Object.freeze({mm:1,fineMm:.1,deg:15,fineDeg:1}),pr=Object.freeze([[1,0,0],[0,1,0],[0,0,1]]);function Xo(t){return Math.round(t*1e9)/1e9+0}function Ot(t){let e=Math.hypot(...t.rotation)||1,a=t.rotation.map(n=>n/e),s=[a[3],a[0],a[1],a[2]].find(n=>Math.abs(n)>1e-12)??1;return{translationMm:t.translationMm.map(Xo),rotation:a.map(n=>Xo(s<0?-n:n))}}function fp(t){let[e,a,s,n]=t.rotation,[r,i,o]=t.translationMm;return[1-2*(a*a+s*s),2*(e*a+s*n),2*(e*s-a*n),0,2*(e*a-s*n),1-2*(e*e+s*s),2*(a*s+e*n),0,2*(e*s+a*n),2*(a*s-e*n),1-2*(e*e+a*a),0,r,i,o,1]}function Wo(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let n=0;n<4;n+=1)a[s*4+n]=t[n]*e[s*4]+t[4+n]*e[s*4+1]+t[8+n]*e[s*4+2]+t[12+n]*e[s*4+3];return a}function hp(t){let e=[t[0],t[4],t[8],0,t[1],t[5],t[9],0,t[2],t[6],t[10],0,0,0,0,1];for(let a=0;a<3;a+=1)e[12+a]=-(e[a]*t[12]+e[4+a]*t[13]+e[8+a]*t[14]);return e}function Cs(t,e){return e>0?Math.round(t/e)*e:t}function mr(t,e){let a=e[0]**2+e[1]**2;return a<1e-9?0:(t[0]*e[0]+t[1]*e[1])/a}function $o(t,e,a){let s=Math.atan2(e[1]-t[1],e[0]-t[0]),r=Math.atan2(a[1]-t[1],a[0]-t[0])-s;for(;r>Math.PI;)r-=2*Math.PI;for(;r<-Math.PI;)r+=2*Math.PI;return r}function Yo(t,e,a){return Ra(t,e)>=0?-a:a}function Jo(t){return pr.map(e=>Hn(t.rotation,e))}function Qo(t,e,a){return{translationMm:t.translationMm.map((s,n)=>s+e[n]*a),rotation:[...t.rotation]}}function Zo(t,e,a,s){let n=ki(e,a),r=t.translationMm.map((o,c)=>o-s[c]);return{translationMm:Hn(n,r).map((o,c)=>o+s[c]),rotation:ls(n,t.rotation)}}function ec(t,e){if(e==null)return null;let a=`/${String(e).split("/")[1]||""}`;return(t?.occurrences||[]).find(s=>s.path===a&&s.depth===1)??null}function tc(t,e,a){let s=t.occurrences.find(o=>o.path===e);if(!s||s.depth!==1)return t;let n=fp(a),r=Wo(n,hp(s.worldMatrix)),i=`${e}/`;return{...t,occurrences:t.occurrences.map(o=>o.path===e?{...o,pose:{...Ot(a),source:"manual"},worldMatrix:n}:o.path.startsWith(i)?{...o,worldMatrix:Wo(r,o.worldMatrix)}:o)}}function ac(t){let e=Math.abs(t[0])<.9?[1,0,0]:[0,1,0];return ot(mt(t,e))}var bp=Object.freeze([0,1,1,0]),Fs=48,Oa=`
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
`,Jt=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);function pp(t){let e=t?.matrix??t;if(!e||typeof e.length!="number"||e.length!==16)throw new TypeError("An occurrence matrix must have 16 numbers (column-major)");let a=Array.from(e,Number);if(!a.every(Number.isFinite))throw new TypeError("An occurrence matrix must be finite");if(a[3]!==0||a[7]!==0||a[11]!==0||a[15]!==1)throw new TypeError("An occurrence matrix must be affine (last row 0 0 0 1)");return a}function mp(t){let[e,a,s,,n,r,i,,o,c,d]=t,h=r*d-c*i,u=c*s-a*d,m=a*i-r*s,p=o*i-n*d,f=e*d-o*s,l=n*s-e*i,y=n*c-o*r,b=o*a-e*c,g=e*r-n*a,x=e*h+n*u+o*m;if(x===0)throw new TypeError("An occurrence matrix must be invertible");let M=x<0?-1:1;return[M*h,M*p,M*y,0,M*u,M*f,M*b,0,M*m,M*l,M*g,0,0,0,0,1]}function gp(t){let e=new Uint32Array(4);for(let a of t||[]){let s=Number(a);!Number.isInteger(s)||s<0||s>=128||(e[s>>>5]|=1<<(s&31)>>>0)}return e}function Bs(t,e=[],a=[]){let s=new Float32Array(Math.max(1,t.length)*40),n=new Uint32Array(s.buffer);return t.forEach((r,i)=>{let o=i*40;s.set(r,o),s.set(mp(r),o+16),e[i]&&n.set(gp(e[i]),o+32),s.set(a[i]||bp,o+36)}),s}function sc(t){let e=new ArrayBuffer(Math.max(1,t.length)*Fs),a=new DataView(e);return t.forEach((s,n)=>{let r=n*Fs;a.setFloat32(r,s.centerMm[0]/1e3,!0),a.setFloat32(r+4,-s.centerMm[1]/1e3,!0),a.setFloat32(r+8,Math.min(s.drillWidthMm,s.drillHeightMm)/2e3,!0),a.setFloat32(r+12,Math.max(s.outerWidthMm,s.outerHeightMm)/2e3,!0),a.setFloat32(r+16,s.startZMm/1e3,!0),a.setFloat32(r+20,s.endZMm/1e3,!0),a.setUint32(r+32,s.netId||0,!0),a.setUint32(r+36,s.objectFeatureId||0,!0),a.setUint32(r+40,s.startLayerId||0,!0),a.setUint32(r+44,s.endLayerId||0,!0)}),e}function js(t,e){let[a,s,n]=e;return[t[0]*a+t[4]*s+t[8]*n+t[12],t[1]*a+t[5]*s+t[9]*n+t[13],t[2]*a+t[6]*s+t[10]*n+t[14]]}function fa(t,e){if(!e)return null;let a=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let s=0;s<8;s+=1){let n=js(t,[e[s&1?3:0],e[s&2?4:1],e[s&4?5:2]]);for(let r=0;r<3;r+=1)a[r]=Math.min(a[r],n[r]),a[r+3]=Math.max(a[r+3],n[r])}return a}function Ps(t){return t.every((e,a)=>e===Jt[a])}var yp=0,xp=4294901759;function nc(t,e){let a=t>>>0,s=e>>>0;return a===yp?{kind:"none",occurrenceIndex:-1,featureId:0}:{kind:s?"feature":"board",occurrenceIndex:a-1,featureId:s}}function rc(t){let e=Array.from(t);if(e.length>xp)throw new RangeError("Too many occurrences for the pick target");let a=e.map(pp),s=o=>o&&!Array.isArray(o)&&!ArrayBuffer.isView(o),n=e.map((o,c)=>s(o)&&o.key!=null?String(o.key):String(c));if(new Set(n).size!==n.length)throw new TypeError("Occurrence keys must be unique");let r=e.map(o=>s(o)&&o.hiddenLayers?[...o.hiddenLayers].map(Number):[]),i=e.map(o=>s(o)&&o.explode?[...o.explode].map(Number):null);return{matrices:a,keys:n,hiddenLayers:r,explode:i}}function Da(t,e,a){let[s,n,r]=e,i=t[0]*s+t[4]*n+t[8]*r+t[12],o=t[1]*s+t[5]*n+t[9]*r+t[13],c=t[2]*s+t[6]*n+t[10]*r+t[14],d=t[3]*s+t[7]*n+t[11]*r+t[15];return!(d>0)||c<0||c>d?null:{x:a.x+(i/d*.5+.5)*a.width,y:a.y+(.5-o/d*.5)*a.height}}var Os=0;var ic=3,gr=4,yw=Object.freeze(["full","board","body","box"]),$e=Object.freeze({fullPx:140,boardPx:70,boxPx:18,keep:.8});function ha(t={}){let e=(i,o)=>Number.isFinite(Number(t[i]))?Math.max(0,Number(t[i])):o,a=e("boxPx",$e.boxPx),s=Math.max(a,e("boardPx",$e.boardPx)),n=Math.max(s,e("fullPx",$e.fullPx)),r=Math.min(1,Math.max(.05,e("keep",$e.keep)));return{fullPx:n,boardPx:s,boxPx:a,keep:r}}function oc(t){let e=c=>[t[c],t[4+c],t[8+c],t[12+c]],[a,s,n,r]=[e(0),e(1),e(2),e(3)],i=(c,d)=>c.map((h,u)=>h+d[u]),o=(c,d)=>c.map((h,u)=>h-d[u]);return[i(r,a),o(r,a),i(r,s),o(r,s),n,o(r,n)]}var yr=`
fn featureHidden(id: u32) -> bool {
  return id < arrayLength(&hiddenMask) && hiddenMask[id] == 0u;
}
`;function Ds(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function cc(t,e=0){let a=0;for(let r of Ds(t))a=Math.max(a,r);let s=64,n=a+1;for(;s<n;)s*=2;return Math.max(s,Math.floor(e)||0)}function lc(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(1);for(let n of Ds(t))n<a&&(s[n]=0);return s}var dc=40,at=256,uc=112,Dt="rg32uint",ba=at/4,Ep=256,Tp={compare:"always",passOp:"zero"},kp={compare:"always",passOp:"replace"},Ip={compare:"not-equal",passOp:"keep"},Sp={compare:"equal",passOp:"keep"},pc=`
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
${yr}
${Fa}
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
`,mc=`
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
${yr}
${Fa}
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
`,gc=`
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
${Fa}
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
`,yc=`
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
${Fa}
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
`;function xr(t,e){return e.reduce((a,[s,n])=>{if(a.split(s).length!==2)throw new Error(`Shader variant anchor not found once: ${s.slice(0,60)}`);return a.replace(s,()=>n)},t)}var vr=[`  padding0: u32,
  padding1: u32,`,`  selectedOccurrence: u32,
  occurrenceBase: u32,`],Us=[["  padding2: u32,","  emphasisStride: u32,"],["fn netEmphasized(id: u32) -> bool {",`${Ki}fn netEmphasized(id: u32) -> bool {`]],xc="  let lit = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",vc=`  let lit = emphasisOf(input.occurrence, input.netId) != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`,wc=xr(pc,[vr,[`  @location(3) world: vec3f,
};`,`  @location(3) world: vec3f,
  @location(4) @interpolate(flat) occurrence: u32,
  // Mask and silkscreen opacity of this occurrence's own stackup separation (SB2-31f).
  @location(5) @interpolate(flat) fade: f32,
};`],[`@vertex fn vs(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.world = input.position + draw.offset.xyz;
  output.position = globals.viewProjection * vec4f(output.world, 1.0);
  output.normal = normalize(input.normal);`,`${Oa}
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
  let selectedComponent = here && component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;`],...Us,["      base = vec3f(0.08, 1.0, 0.2) * pulse;","      base = emphasisColor(mark, vec3f(0.08, 1.0, 0.2)) * pulse;"],["  var alpha = draw.flags.y;","  var alpha = draw.flags.y * input.fade;"]]),Mc=xr(mc,[vr,[`  @location(0) @interpolate(flat) objectId: u32,
};`,`  @location(0) @interpolate(flat) objectId: u32,
  @location(1) @interpolate(flat) occurrence: u32,
};`],[`@vertex fn vs(input: Input) -> Output {
  var output: Output;
  output.position = globals.viewProjection * vec4f(input.position + draw.offset.xyz, 1.0);`,`${Oa}
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
  return vec2u(input.occurrence, select(input.objectId, 0u, kind == 0u));`],...Us,[xc,vc]]),Rp=`struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
  @location(3) dimensions: vec4f,
  @location(4) span: vec2f,
  @location(5) ids: vec4u,
};`,Ap=`struct Barrel {
  dimensions: vec4f,
  span: vec2f,
  ids: vec4u,
};
@group(0) @binding(6) var<storage, read> barrels: array<Barrel>;
${Oa}
struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
};`;function Ec(t,e,a=[]){return xr(t,[vr,[`@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
`,""],[Rp,Ap],["@vertex fn vs(input: Input) -> Output {",`struct Record {
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
  output.occurrence = index + 1u + globals.occurrenceBase;`],...a])}var Tc=Ec(gc,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.normal = input.normal;`,[[`  let z0 = input.span.x + layerOffsets[input.ids.z];
  let z1 = input.span.y + layerOffsets[input.ids.w];`,`  let z0 = input.span.x + layerOffsets[input.ids.z] * spread;
  let z1 = input.span.y + layerOffsets[input.ids.w] * spread;`],[`  output.normal = input.normal;
  output.netId`,`  output.normal = (occurrence.normal * vec4f(input.normal, 0.0)).xyz;
  output.netId`],[`  @location(3) @interpolate(flat) visible: u32,
};`,`  @location(3) @interpolate(flat) visible: u32,
  @location(4) @interpolate(flat) occurrence: u32,
};`],["  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",`  let mark = emphasisOf(input.occurrence, input.netId);
  let selected = mark != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`],...Us,["      base = vec3f(0.1, 1.0, 0.22) * (","      base = emphasisColor(mark, vec3f(0.1, 1.0, 0.22)) * ("]]),kc=Ec(yc,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.objectId`,[["mix(input.span.x + layerOffsets[input.ids.z], input.span.y + layerOffsets[input.ids.w], input.unit.z)","mix(input.span.x + layerOffsets[input.ids.z] * spread, input.span.y + layerOffsets[input.ids.w] * spread, input.unit.z)"],[`  @location(1) @interpolate(flat) visible: u32,
};`,`  @location(1) @interpolate(flat) visible: u32,
  @location(2) @interpolate(flat) occurrence: u32,
};`],["  return vec2u(1u, input.objectId);","  return vec2u(input.occurrence, input.objectId);"],...Us,[xc,vc]]),Ic=`
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
${Oa}
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
`,Sc=`${Ic}
@fragment fn fs(input: Output) -> @location(0) vec4f {
  let light = normalize(globals.lightDirection.xyz);
  return vec4f(draw.color.rgb * (0.45 + max(dot(normalize(input.normal), light), 0.0) * 0.55), 1.0);
}
`,Rc=`${Ic}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  return vec2u(input.occurrence, 0u);
}
`,Ac=`
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
`,fc=[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}],Tw=Object.freeze({main:wc,pick:Mc,barrel:Tc,barrelPick:kc,box:Sc,boxPick:Rc,cull:Ac}),Qt=class t{static async create(e){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)throw new Error("No WebGPU adapter is available");let s=a.features.has("depth32float-stencil8"),n=await a.requestDevice(s?{requiredFeatures:["depth32float-stencil8"]}:void 0);return new t(e,n,{stencil:s})}constructor(e,a,{shareFrom:s=null,stencil:n=!1}={}){if(this.canvas=e,this.device=a,this.shareFrom=s,this.stencil=s?s.stencil:!!n,this.depthFormat=this.stencil?"depth32float-stencil8":"depth32float",this.version=0,this.barrelColor=[.55,.35,.16,.78],this.alwaysInstanced=!!s,this.occurrenceBase=0,s?(this.context=s.context,this.format=s.format):(a.addEventListener("uncapturederror",r=>{console.error(`Uncaptured WebGPU error: ${r.error?.message||r.error}`)}),a.lost.then(r=>{r.reason!=="destroyed"&&console.error(`WebGPU device lost: ${r.reason}`,r.message)}),this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"})),this.entries=[],this.barrels=null,this.drawSlotCapacity=Ep,this.drawSlotBuffer=this.createDrawSlotBuffer(this.drawSlotCapacity),this.drawStaging=new Float32Array(this.drawSlotCapacity*ba),this.freeDrawSlots=[],this.nextDrawSlot=0,this.globalBuffer=a.createBuffer({size:uc,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.layerOffsetBuffer=a.createBuffer({size:1024,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.occurrenceMatrices=[[...Jt]],this.occurrenceKeys=["0"],this.occurrenceHiddenLayers=[[]],this.occurrenceExplode=[null],this.identityOnly=!0,this.occurrenceCapacity=1,this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.device.queue.writeBuffer(this.occurrenceBuffer,0,Bs(this.occurrenceMatrices)),this.barrelRecordBuffer=a.createBuffer({label:"barrel-records",size:Fs,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.instancedPipelines=null,this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.slotCapacity=0,this.slotArgs=new Uint32Array(0),this.slotClasses=new Uint32Array(0),this.freeSlots=[],this.nextSlot=2,this.argsBuffer=null,this.classesBuffer=null,this.growSlots(256),this.setSlot(0,0,4),this.setSlot(1,0,4),this.cull=null,this.box=null,this.boardBounds=null,this.selectedOccurrence=-1,this.lodOverride=null,this.lodThresholds={...$e},this.innerCopperAtFull=!0,this.cullCounts={full:0,board:0,body:0,box:0,culled:0},this.frameStats={triangles:0,draws:0},this.boxColor=[.24,.36,.28,1],s)for(let r of["bindGroupLayout","pipelineLayout","vertexBuffers","pipeline","pickPipeline","barrelPipeline","barrelPickPipeline","singlePipelines"])this[r]=s[r];else this.createSinglePipelines();this.depth=null,this.pickTexture=null,this.pickSerial=Promise.resolve(),this.bundleCache=new Map,this.globalScratch=new ArrayBuffer(uc),this.globalScratchF32=new Float32Array(this.globalScratch),this.globalScratchView=new DataView(this.globalScratch),this.barrelDrawScratch=new Float32Array(at/4),this.nextEntryId=1,this.hiddenFeatureIds=new Set,this.showPlaceholders=!0,this.featureMaskCapacity=64,this.featureMaskBuffer=this.createFeatureMaskBuffer(this.featureMaskCapacity),this.uploadFeatureMask(),this.emphasizedNetIds=new Set,this.occurrenceEmphasis=null,this.emphasisStride=0,this.dimCopper=!1,this.netMaskCapacity=64,this.netMaskBuffer=this.createNetMaskBuffer(this.netMaskCapacity),this.uploadNetMask(),s&&this.setOccurrences([])}createSinglePipelines(){let e=this.device;this.bindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:5,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:6,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:7,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]});let a=e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]});this.pipelineLayout=a;let s=this.vertexBuffers=[{arrayStride:dc,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"uint32"},{shaderLocation:3,offset:28,format:"uint32"},{shaderLocation:4,offset:32,format:"uint32"},{shaderLocation:5,offset:36,format:"uint32"}]}];this.singlePipelines={...this.makeMainPipelines(pc,""),pick:this.makePipeline(a,mc,Dt,s,"pick"),barrel:this.makeBarrelPipeline(a,gc,this.format,"barrel"),barrelPick:this.makeBarrelPipeline(a,yc,Dt,"barrel-pick")},this.pipeline=this.singlePipelines.main,this.pickPipeline=this.singlePipelines.pick,this.barrelPipeline=this.singlePipelines.barrel,this.barrelPickPipeline=this.singlePipelines.barrelPick}makeMainPipelines(e,a){let s=this.pipelineLayout,n=this.vertexBuffers,r=(c,d)=>this.makePipeline(s,e,this.format,n,`${c}${a}`,d),i=r("main",{stencil:Tp}),o=r("main-blend");return{main:i,mark:this.stencil?r("main-mark",{stencil:kp}):i,blend:o,mask:this.stencil?r("mask",{stencil:Ip}):o,maskCovered:this.stencil?r("mask-covered",{stencil:Sp,constants:{COVERED:1}}):null}}createOccurrenceBuffer(e){return this.device.createBuffer({label:"occurrences",size:e*160,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createListBuffer(e){return this.device.createBuffer({label:"visible-occurrences",size:e*4*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}growSlots(e){let a=new Uint32Array(e*5);a.set(this.slotArgs);let s=new Uint32Array(e).fill(4);s.set(this.slotClasses),this.slotArgs=a,this.slotClasses=s,this.slotCapacity=e,this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.(),this.argsBuffer=this.device.createBuffer({label:"indirect-args",size:a.byteLength,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.classesBuffer=this.device.createBuffer({label:"draw-classes",size:s.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.argsBuffer,0,a),this.device.queue.writeBuffer(this.classesBuffer,0,s),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache?.clear()}setSlot(e,a,s){this.slotArgs.fill(0,e*5,e*5+5),this.slotArgs[e*5]=a,this.slotClasses[e]=s,this.device.queue.writeBuffer(this.argsBuffer,e*20,this.slotArgs,e*5,5),this.device.queue.writeBuffer(this.classesBuffer,e*4,this.slotClasses,e,1)}allocSlot(e,a){let s=this.freeSlots.length?this.freeSlots.pop():this.nextSlot++;return s>=this.slotCapacity&&this.growSlots(this.slotCapacity*2),this.setSlot(s,e,a),s}get occurrenceCount(){return this.occurrenceMatrices.length}setOccurrences(e){let{matrices:a,keys:s,hiddenLayers:n,explode:r}=rc(e??[Jt]);this.occurrenceMatrices=a,this.occurrenceKeys=s,this.occurrenceHiddenLayers=n,this.occurrenceExplode=r,this.identityOnly=!this.alwaysInstanced&&a.length===1&&Ps(a[0]),this.identityOnly||this.ensureInstancedPipelines(),a.length>this.occurrenceCapacity&&(this.occurrenceBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.occurrenceCapacity=Math.max(a.length,this.occurrenceCapacity*2),this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.cull&&(this.cull.lods.destroy(),this.cull.lods=this.createLodBuffer(this.occurrenceCapacity)),this.rebindAll()),a.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,Bs(a,n,r)),this.cull&&this.device.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(gr)),this.selectedOccurrence>=a.length&&(this.selectedOccurrence=-1),this.bundleCache.clear(),this.invalidate()}setOccurrenceHiddenLayers(e){this.occurrenceHiddenLayers=this.occurrenceMatrices.map((a,s)=>[...e?.[s]||[]].map(Number)),this.writeOccurrenceRecords()}setOccurrenceExplode(e){this.occurrenceExplode=this.occurrenceMatrices.map((a,s)=>e?.[s]?[...e[s]].map(Number):null),this.writeOccurrenceRecords()}writeOccurrenceRecords(){this.occurrenceMatrices.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,Bs(this.occurrenceMatrices,this.occurrenceHiddenLayers,this.occurrenceExplode)),this.invalidate()}setInnerCopperAtFull(e){if(this.innerCopperAtFull!==e){this.innerCopperAtFull=e;for(let a of this.entries)a.innerCopper&&(a.drawClass=hc(a,e),this.setSlot(a.slot,a.indexCount,a.drawClass));this.invalidate()}}setBoardBounds(e){this.boardBounds=e?[...e]:null,this.invalidate()}setLodThresholds(e){this.lodThresholds=ha({...this.lodThresholds,...e}),this.invalidate()}setLodOverride(e){this.lodOverride=e==null?null:Number(e),this.invalidate()}createLodBuffer(e){return this.device.createBuffer({label:"occurrence-lods",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createCull(){let e=this.device,a=this.shareFrom?.cull,s=i=>({visibility:GPUShaderStage.COMPUTE,buffer:{type:i}}),n=a?.layout||e.createBindGroupLayout({label:"cull",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,...s("read-only-storage")},{binding:2,...s("storage")},{binding:3,...s("storage")},{binding:4,...s("storage")},{binding:5,...s("storage")},{binding:6,...s("read-only-storage")}]}),r=a&&{layout:n,classify:a.classify,writeArgs:a.writeArgs};if(!r){let i=this.createShaderModule(Ac,"cull"),o=e.createPipelineLayout({bindGroupLayouts:[n]});r={layout:n,classify:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"classify"}}),writeArgs:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"writeArgs"}})}}this.cull={...r,uniform:e.createBuffer({label:"cull-params",size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),lods:this.createLodBuffer(this.occurrenceCapacity),counters:e.createBuffer({label:"cull-counters",size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),readback:e.createBuffer({label:"cull-readback",size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),scratch:new ArrayBuffer(192),reading:!1,readAt:0,bindGroup:null},e.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(gr)),this.cull.bindGroup=this.makeCullBindGroup()}makeCullBindGroup(){return this.device.createBindGroup({layout:this.cull.layout,entries:[{binding:0,resource:{buffer:this.cull.uniform}},{binding:1,resource:{buffer:this.occurrenceBuffer}},{binding:2,resource:{buffer:this.cull.lods}},{binding:3,resource:{buffer:this.listBuffer}},{binding:4,resource:{buffer:this.cull.counters}},{binding:5,resource:{buffer:this.argsBuffer}},{binding:6,resource:{buffer:this.classesBuffer}}]})}createBox(){let e=[[[1,0,0],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[[-1,0,0],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],[[0,1,0],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[[0,0,1],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],[[0,0,-1],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]],a=[],s=[];e.forEach(([d,h],u)=>{for(let p of h)a.push(...p,...d);let m=u*4;s.push(m,m+1,m+2,m,m+2,m+3)});let n=new Float32Array(a),r=new Uint16Array(s),i=this.device.createBuffer({label:"box-vertices",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),o=this.device.createBuffer({label:"box-indices",size:r.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(i,0,n),this.device.queue.writeBuffer(o,0,r);let c=this.device.createBuffer({size:at,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.box={vertexBuffer:i,indexBuffer:o,indexCount:r.length,drawBuffer:c,bindGroup:this.makeBindGroup(c),scratch:new Float32Array(at/4)},this.setSlot(1,r.length,3)}writeBoxDraw(){let e=this.box.scratch,[a,s,n,r,i,o]=this.boardBounds;e.fill(0),e.set(this.boxColor,0),e.set([r-a,i-s,o-n,0],4),e.set([a,s,n,0],8),this.device.queue.writeBuffer(this.box.drawBuffer,0,e)}encodeCull(e,a){let s=this.cull,n=new Float32Array(s.scratch),r=new Uint32Array(s.scratch);n.fill(0),oc(a.matrix).forEach((l,y)=>n.set(l,y*4));let i=a.lod;i&&n.set([...i.eye,i.orthographic?0:1],24);let o=this.boardBounds||[-1e6,-1e6,-1e6,1e6,1e6,1e6];n.set([o[0],o[1],o[2],0,o[3],o[4],o[5],0],28);let{fullPx:c,boardPx:d,boxPx:h,keep:u}=this.lodThresholds;n.set([i?.pixelScale||0,c,h,u],36);let m=this.lodOverride!=null?this.lodOverride+1:!i||!this.boardBounds?Os+1:0;r.set([this.occurrenceMatrices.length,this.selectedOccurrence+1,m,this.nextSlot],40),r[44]=this.barrels?.instanceCount||0,n[45]=d,this.device.queue.writeBuffer(s.uniform,0,s.scratch),e.clearBuffer(s.counters);let p=e.beginComputePass({label:"cull"});p.setBindGroup(0,s.bindGroup),p.setPipeline(s.classify),p.dispatchWorkgroups(Math.ceil(this.occurrenceMatrices.length/64)),p.setPipeline(s.writeArgs),p.dispatchWorkgroups(Math.ceil(this.nextSlot/64)),p.end();let f=performance.now();return!s.reading&&f-s.readAt>250?(e.copyBufferToBuffer(s.counters,0,s.readback,0,16),s.readAt=f,!0):!1}readCullCounts(){let e=this.cull;e.reading=!0;let a=this.occurrenceMatrices.length;e.readback.mapAsync(GPUMapMode.READ).then(()=>{let[s,n,r,i]=new Uint32Array(e.readback.getMappedRange().slice(0));e.readback.unmap(),this.cullCounts={full:s,board:n-s,body:r-n,box:i,culled:Math.max(0,a-r-i)}}).catch(()=>{}).finally(()=>{e.reading=!1})}countFor(e){if(this.identityOnly)return e===2?this.barrels?.instanceCount||0:e===3?0:1;let{full:a,board:s,body:n,box:r}=this.cullCounts;return e===5?a+s+n:e===0?a+s:e===1?a:e===2?(a+s)*(this.barrels?.instanceCount||0):r}gpuMemoryBytes(){let e=0;for(let a of this.entries)e+=(a.vertexBuffer?.size||0)+(a.indexBuffer?.size||0);for(let a of[this.barrels?.vertexBuffer,this.barrels?.indexBuffer,this.barrels?.instanceBuffer,this.barrelRecordBuffer,this.occurrenceBuffer,this.listBuffer,this.argsBuffer,this.classesBuffer,this.featureMaskBuffer,this.netMaskBuffer,this.cull?.lods])e+=a?.size||0;return e+=this.canvas.width*this.canvas.height*12,e}ensureInstancedPipelines(){if(this.instancedPipelines)return;if(this.shareFrom){this.shareFrom.ensureInstancedPipelines(),this.instancedPipelines=this.shareFrom.instancedPipelines,this.createBox(),this.createCull();return}let e=this.pipelineLayout;this.instancedPipelines={...this.makeMainPipelines(wc,"-instanced"),pick:this.makePipeline(e,Mc,Dt,this.vertexBuffers,"pick-instanced"),barrel:this.makeBarrelPipeline(e,Tc,this.format,"barrel-instanced",!1),barrelPick:this.makeBarrelPipeline(e,kc,Dt,"barrel-pick-instanced",!1),box:this.makePipeline(e,Sc,this.format,fc,"box"),boxPick:this.makePipeline(e,Rc,Dt,fc,"box-pick")},this.createBox(),this.createCull()}drawSet(){return this.identityOnly?{pipelines:this.singlePipelines,indirect:!1,barrelInstances:this.barrels?.instanceCount||0}:{pipelines:this.instancedPipelines,indirect:!0,barrelInstances:0}}drawEntry(e,a,s){e.setBindGroup(0,a.bindGroup),e.setVertexBuffer(0,a.vertexBuffer),e.setIndexBuffer(a.indexBuffer,"uint32"),s?e.drawIndexedIndirect(this.argsBuffer,a.slot*20):e.drawIndexed(a.indexCount)}drawBarrels(e,a,s,n){e.setPipeline(a),e.setBindGroup(0,this.barrels.bindGroup),e.setVertexBuffer(0,this.barrels.vertexBuffer),e.setVertexBuffer(1,this.barrels.instanceBuffer),e.setIndexBuffer(this.barrels.indexBuffer,"uint16"),s?e.drawIndexedIndirect(this.argsBuffer,0):e.drawIndexed(this.barrels.indexCount,n)}drawBox(e,a){!this.box||!this.boardBounds||(this.writeBoxDraw(),e.setPipeline(a),e.setBindGroup(0,this.box.bindGroup),e.setVertexBuffer(0,this.box.vertexBuffer),e.setIndexBuffer(this.box.indexBuffer,"uint16"),e.drawIndexedIndirect(this.argsBuffer,20))}createNetMaskBuffer(e){return this.device.createBuffer({label:"net-emphasis-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}uploadNetMask(){let e;if(this.occurrenceEmphasis&&!this.identityOnly){let s=Vi(this.occurrenceEmphasis);this.emphasisStride=s.stride,e=s.data}else this.emphasisStride=0,e=Ui(this.emphasizedNetIds,this.netMaskCapacity);if(e.length>this.netMaskCapacity){this.netMaskBuffer?.destroy?.();let s=this.netMaskCapacity;for(;s<e.length;)s*=2;this.netMaskCapacity=s,this.netMaskBuffer=this.createNetMaskBuffer(s),this.rebindAll()}let a=new Uint32Array(this.netMaskCapacity);a.set(e),this.device.queue.writeBuffer(this.netMaskBuffer,0,a)}setOccurrenceEmphasis(e,{dimCopper:a=!1}={}){let s=Array.isArray(e)&&e.some(n=>n&&n.size);this.occurrenceEmphasis=s?e.map(n=>n&&n.size?new Map(n):null):null,this.dimCopper=!!a,this.uploadNetMask(),this.invalidate()}get netHighlightActive(){return!!(this.emphasizedNetIds.size||this.occurrenceEmphasis||this.dimCopper)}setEmphasizedNetIds(e){this.emphasizedNetIds=ms(e),this.occurrenceEmphasis=null;let a=Li(this.emphasizedNetIds,this.netMaskCapacity);a!==this.netMaskCapacity&&(this.netMaskBuffer?.destroy?.(),this.netMaskCapacity=a,this.netMaskBuffer=this.createNetMaskBuffer(a),this.rebindAll()),this.uploadNetMask(),this.invalidate()}rebindAll(){for(let e of this.entries)e.bindGroup=this.makeBindGroup(this.drawSlotBuffer,e.drawSlot*at);this.barrels&&(this.barrels.bindGroup=this.makeBindGroup(this.barrels.drawBuffer)),this.box&&(this.box.bindGroup=this.makeBindGroup(this.box.drawBuffer)),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache.clear()}createFeatureMaskBuffer(e){return this.device.createBuffer({label:"feature-visibility-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createDrawSlotBuffer(e){return this.device.createBuffer({label:"draw-uniforms",size:e*at,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}allocateDrawSlot(){if(this.freeDrawSlots.length)return this.freeDrawSlots.pop();if(this.nextDrawSlot>=this.drawSlotCapacity){let e=this.drawSlotCapacity*2,a=new Float32Array(e*ba);a.set(this.drawStaging),this.drawSlotBuffer.destroy?.(),this.drawSlotCapacity=e,this.drawSlotBuffer=this.createDrawSlotBuffer(e),this.drawStaging=a,this.rebindAll()}return this.nextDrawSlot++}flushDraws(e){if(!e.length)return;let a=1/0,s=-1;for(let n of e)a=Math.min(a,n.drawSlot),s=Math.max(s,n.drawSlot);this.device.queue.writeBuffer(this.drawSlotBuffer,a*at,this.drawStaging,a*ba,(s-a+1)*ba)}invalidate(){this.version+=1}setBarrelColor(e){this.barrelColor=[...e],this.invalidate()}makeBindGroup(e,a=0){return this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e,offset:a,size:at}},{binding:2,resource:{buffer:this.layerOffsetBuffer}},{binding:3,resource:{buffer:this.featureMaskBuffer}},{binding:4,resource:{buffer:this.netMaskBuffer}},{binding:5,resource:{buffer:this.occurrenceBuffer}},{binding:6,resource:{buffer:this.barrelRecordBuffer}},{binding:7,resource:{buffer:this.listBuffer}}]})}uploadFeatureMask(){let e=lc(this.hiddenFeatureIds,this.featureMaskCapacity);this.device.queue.writeBuffer(this.featureMaskBuffer,0,e)}setHiddenFeatureIds(e){this.hiddenFeatureIds=Ds(e);let a=cc(this.hiddenFeatureIds,this.featureMaskCapacity);a!==this.featureMaskCapacity&&(this.featureMaskBuffer?.destroy?.(),this.featureMaskCapacity=a,this.featureMaskBuffer=this.createFeatureMaskBuffer(a),this.rebindAll()),this.uploadFeatureMask(),this.bundleCache.clear(),this.invalidate()}depthStencilState(e=null){let a={format:this.depthFormat,depthWriteEnabled:!0,depthCompare:"greater"};return this.stencil&&e&&(a.stencilFront=e,a.stencilBack=e),a}makePipeline(e,a,s,n,r,i={}){let o=this.createShaderModule(a,r);return this.device.createRenderPipeline({layout:e,vertex:{module:o,entryPoint:"vs",buffers:n},fragment:{module:o,entryPoint:"fs",...i.constants?{constants:i.constants}:{},targets:[{format:s,blend:s===Dt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState(i.stencil),multisample:{count:1}})}makeBarrelPipeline(e,a,s,n,r=!0){let i=this.createShaderModule(a,n);return this.device.createRenderPipeline({layout:e,vertex:{module:i,entryPoint:"vs",buffers:[{arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32"}]},...r?[{arrayStride:40,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"float32x4"},{shaderLocation:4,offset:16,format:"float32x2"},{shaderLocation:5,offset:24,format:"uint32x4"}]}]:[]]},fragment:{module:i,entryPoint:"fs",targets:[{format:s,blend:s===Dt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState()})}createShaderModule(e,a){let s=this.device.createShaderModule({label:`pcb-${a}`,code:e});return typeof s.getCompilationInfo=="function"&&s.getCompilationInfo().then(n=>{let r=[...n.messages||[]];if(r.length){console.groupCollapsed(`WebGPU shader compilation info: pcb-${a}`);for(let i of r)console[i.type==="error"?"error":"warn"](`${i.type} ${i.lineNum}:${i.linePos} ${i.message}`);console.groupEnd()}}),s}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));this.canvas.width===a&&this.canvas.height===s||(this.canvas.width=a,this.canvas.height=s,this.depth?.destroy(),this.pickTexture?.destroy(),this.depth=this.device.createTexture({size:[a,s],format:this.depthFormat,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.pickTexture=this.device.createTexture({size:[a,s],format:Dt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}))}addPrimitive(e,a){let s=e.position.length/3,n=new ArrayBuffer(s*dc),r=new Float32Array(n),i=new Uint32Array(n);for(let f=0;f<s;f+=1){let l=f*10,y=f*3;r[l]=e.position[y],r[l+1]=e.position[y+1],r[l+2]=e.position[y+2],r[l+3]=e.normal[y],r[l+4]=e.normal[y+1],r[l+5]=e.normal[y+2],i[l+6]=e.netId[f]||0,i[l+7]=e.objectFeatureId[f]||0,i[l+8]=a.layerId||0,i[l+9]=a.materialId||0}let o=this.device.createBuffer({size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(o,0,n);let c=e.indices instanceof Uint32Array?e.indices:new Uint32Array(e.indices),d=this.device.createBuffer({size:c.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,c);let h=this.allocateDrawSlot(),u=this.makeBindGroup(this.drawSlotBuffer,h*at),m=hc(a,this.innerCopperAtFull),p={...a,drawClass:m,slot:this.allocSlot(c.length,m),bounds:e.bounds||a.bounds||null,id:this.nextEntryId++,vertexBuffer:o,indexBuffer:d,indexCount:c.length,drawSlot:h,bindGroup:u};return this.entries.push(p),this.bundleCache.clear(),this.invalidate(),p}removeEntries(e){if(!e?.length)return;let a=new Set(e.map(s=>s.id));for(let s of e)s.vertexBuffer?.destroy?.(),s.indexBuffer?.destroy?.(),this.freeDrawSlots.push(s.drawSlot),s.slot!=null&&(this.setSlot(s.slot,0,4),this.freeSlots.push(s.slot));this.entries=this.entries.filter(s=>!a.has(s.id)),this.bundleCache.clear(),this.invalidate()}dispose(){this.removeEntries(this.entries),this.barrels&&(this.barrels.vertexBuffer?.destroy?.(),this.barrels.indexBuffer?.destroy?.(),this.barrels.instanceBuffer?.destroy?.(),this.barrels.drawBuffer?.destroy?.(),this.barrels=null),this.depth?.destroy(),this.pickTexture?.destroy(),this.featureMaskBuffer?.destroy?.(),this.occurrenceBuffer?.destroy?.(),this.barrelRecordBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.();for(let e of[this.box?.vertexBuffer,this.box?.indexBuffer,this.box?.drawBuffer,this.cull?.uniform,this.cull?.lods,this.cull?.counters,this.cull?.readback])e?.destroy?.();this.box=null,this.cull=null,this.drawSlotBuffer?.destroy?.(),this.depth=null,this.pickTexture=null,this.featureMaskBuffer=null,this.bundleCache.clear()}setBarrels(e){if(!e?.length)return;let a=20,s=[],n=[];for(let f of[0,1]){let l=s.length/7;for(let y=0;y<a;y+=1){let b=Math.PI*2*y/a,g=Math.cos(b),x=Math.sin(b);for(let M of[0,1])s.push(g,x,M,f?-g:g,f?-x:x,0,f)}for(let y=0;y<a;y+=1){let b=(y+1)%a,g=l+y*2,x=l+b*2;n.push(g,x,x+1,g,x+1,g+1)}}let r=new Float32Array(s),i=new Uint16Array(n),o=new ArrayBuffer(e.length*40),c=new DataView(o);e.forEach((f,l)=>{let y=l*40;c.setFloat32(y,f.centerMm[0]/1e3,!0),c.setFloat32(y+4,-f.centerMm[1]/1e3,!0),c.setFloat32(y+8,Math.min(f.drillWidthMm,f.drillHeightMm)/2e3,!0),c.setFloat32(y+12,Math.max(f.outerWidthMm,f.outerHeightMm)/2e3,!0),c.setFloat32(y+16,f.startZMm/1e3,!0),c.setFloat32(y+20,f.endZMm/1e3,!0),c.setUint32(y+24,f.netId||0,!0),c.setUint32(y+28,f.objectFeatureId||0,!0),c.setUint32(y+32,f.startLayerId||0,!0),c.setUint32(y+36,f.endLayerId||0,!0)});let d=this.device.createBuffer({size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),h=this.device.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),u=this.device.createBuffer({size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,r),this.device.queue.writeBuffer(h,0,i),this.device.queue.writeBuffer(u,0,o);let m=sc(e);this.barrelRecordBuffer?.destroy?.(),this.barrelRecordBuffer=this.device.createBuffer({label:"barrel-records",size:m.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.barrelRecordBuffer,0,m);let p=this.device.createBuffer({size:at,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.barrels={records:e,vertexBuffer:d,indexBuffer:h,instanceBuffer:u,indexCount:i.length,instanceCount:e.length,drawBuffer:p,bindGroup:null},this.setSlot(0,i.length,2),this.rebindAll(),this.invalidate()}render(e){let{panels:a,layerOffsets:s}=e;this.resize(),this.device.queue.writeBuffer(this.layerOffsetBuffer,0,s);let n=this.context.getCurrentTexture().createView(),r=0,i=0;a.forEach((o,c)=>{let d=this.device.createCommandEncoder(),h=!this.identityOnly&&this.encodeCull(d,o),u=d.beginRenderPass({colorAttachments:[{view:n,clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:c===0?"clear":"load",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),m=bc(o.viewport,this.canvas.width,this.canvas.height);u.setViewport(m.x,m.y,m.width,m.height,0,1),u.setScissorRect(m.x,m.y,m.width,m.height);let p=this.encodeDraws(u,o,e);r+=p.triangles,i+=p.draws,u.end(),this.device.queue.submit([d.finish()]),h&&this.readCullCounts()}),this.frameStats={triangles:Math.round(r),draws:i}}encodeDraws(e,a,{activeNetId:s,selectedFeatureId:n,time:r,visibleLayers:i,showBoard:o,showComponents:c,showPaste:d=!0,componentOpacity:h,boardOpacity:u,isolateNet:m,compareMode:p=!1,compareOffsets:f=new Map,layerAlphas:l=null,visibleTileIds:y=null}){let b=0,g=0;this.stencil&&e.setStencilReference(1),this.writeGlobals(a.matrix,s,a.layerId,r,n);let{pipelines:x,indirect:M,barrelInstances:T}=this.drawSet(),I=!d||!!(s||this.netHighlightActive),S=this.entries.filter(_=>this.visible(_,a.layerId,i,o,c,h,p,y)&&!(I&&_.boardRole==="paste")),R=S.filter(_=>!Ls(_)).sort((_,j)=>+!!_.stencilMark-+!!j.stencilMark),A=S.filter(_=>Ls(_)).sort((_,j)=>Ls(_)-Ls(j));for(let _ of S)this.writeDraw(_,s,h,u,m,p,f.get(_.layerId),l?.get(_.layerId)??1);this.flushDraws(S),R.length>64?e.executeBundles([this.renderBundle(R,a.layerId)]):this.drawEntries(e,R,x,M);for(let _ of S)b+=_.indexCount/3*this.countFor(_.drawClass);return g+=S.length,!p&&this.barrels&&(a.layerId===0||i.has(a.layerId))&&(this.writeBarrelDraw(m),this.drawBarrels(e,x.barrel,M,T),b+=this.barrels.indexCount/3*this.countFor(2),g+=1),M&&!p&&(this.drawBox(e,x.box),b+=12*this.countFor(3),g+=1),this.drawBlended(e,A,x,M),{triangles:b,draws:g}}depthAttachment(){let e={view:this.depth.createView(),depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"store"};return this.stencil&&Object.assign(e,{stencilClearValue:0,stencilLoadOp:"clear",stencilStoreOp:"discard"}),e}drawEntries(e,a,s,n){let r=null;for(let i of a){let o=i.stencilMark?s.mark:s.main;o!==r&&(e.setPipeline(o),r=o),this.drawEntry(e,i,n)}}drawBlended(e,a,s,n){for(let r of a)r.boardRole==="soldermask"&&r.kind==="board"?(e.setPipeline(s.mask),this.drawEntry(e,r,n),s.maskCovered&&(e.setPipeline(s.maskCovered),this.drawEntry(e,r,n))):(e.setPipeline(s.blend),this.drawEntry(e,r,n))}setPlaceholdersVisible(e){this.showPlaceholders=!!e,this.invalidate()}visible(e,a,s,n,r,i,o=!1,c=null){return e.placeholder&&!this.showPlaceholders||e.kind==="board"&&e.boardRole==="pad"||!o&&e.kind==="copper"&&c&&!c.has(e.tileId)?!1:o?e.kind==="copper"&&s.has(e.layerId):e.boardRole==="paste"?a===0&&s.has(e.layerId):e.kind==="board"?a===0&&n:e.kind==="component"?a===0&&r&&i>.001:a?e.layerId===a:s.has(e.layerId)}writeGlobals(e,a,s,n,r=0){let i=this.globalScratch,o=this.globalScratchF32;o.fill(0),o.set(e,0);let c=this.globalScratchView;c.setUint32(64,a||0,!0),c.setUint32(68,s||0,!0),c.setFloat32(72,n,!0),c.setFloat32(76,a||this.netHighlightActive?1:0,!0),c.setUint32(80,r||0,!0),c.setUint32(84,this.selectedOccurrence>=0?this.selectedOccurrence+1+this.occurrenceBase:0,!0),c.setUint32(88,this.occurrenceBase,!0),c.setUint32(92,this.emphasisStride,!0),o.set([.35,-.5,.8,0],24),this.device.queue.writeBuffer(this.globalBuffer,0,i)}writeDraw(e,a,s,n=1,r=!1,i=!1,o=null,c=1){let d=this.drawStaging.subarray(e.drawSlot*ba,(e.drawSlot+1)*ba);d.fill(0);let h=e.color||e.material.baseColor;d.set(h,0),d.set([e.material.metallic||0,e.material.roughness??.72,e.opacityScale!=null?s:0,_p[e.drawClass]??1],4);let u=Cp(e);d.set([o?.[0]||0,o?.[1]||0,(i?-(e.baseZ||0):e.layerOffset||0)+u,e.kind==="copper"||e.boardRole==="paste"?Number(e.layerId||0)+1:0],8);let m=Number.isFinite(h?.[3])?h[3]:1,p=e.kind==="component"?s*(e.opacityScale??1):e.kind==="board"&&e.boardRole!=="paste"?n*Np(e,m):c,f=e.kind==="copper"?1:e.kind==="component"?2:0;d.set([f,p,r?1:0,i?1:0],12)}writeBarrelDraw(e=!1){let a=this.barrelDrawScratch;a.fill(0),a.set(this.barrelColor,0),a.set([.75,.32,0,0],4),a.set([1,1,e?1:0,0],12),this.device.queue.writeBuffer(this.barrels.drawBuffer,0,a)}renderBundle(e,a){let{pipelines:s,indirect:n}=this.drawSet(),r=`${a}:${n?"indirect":"single"}:${e.map(d=>d.id).join(",")}`,i=this.bundleCache.get(r);if(i)return i;let o=this.device.createRenderBundleEncoder({colorFormats:[this.format],depthStencilFormat:this.depthFormat});this.drawEntries(o,e,s,n);let c=o.finish();return this.bundleCache.set(r,c),this.bundleCache.size>32&&this.bundleCache.delete(this.bundleCache.keys().next().value),c}pick(e,a,s,n){let r=this.pickSerial.then(()=>this.performPick(e,a,s,n));return this.pickSerial=r.catch(()=>0),r}async performPick(e,a,s,n){this.resize();let r=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),i=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s)));this.device.queue.writeBuffer(this.layerOffsetBuffer,0,n.layerOffsets);let o=this.device.createCommandEncoder(),c=o.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),d=bc(e.viewport,this.canvas.width,this.canvas.height);return c.setViewport(d.x,d.y,d.width,d.height,0,1),c.setScissorRect(d.x,d.y,d.width,d.height),this.encodePick(c,e,n),c.end(),this.readPick(o,r,i)}encodePick(e,a,s){this.writeGlobals(a.matrix,s.activeNetId,a.layerId,performance.now()/1e3,s.selectedFeatureId);let{pipelines:n,indirect:r,barrelInstances:i}=this.drawSet();e.setPipeline(n.pick);let o=[];for(let c of this.entries)this.visible(c,a.layerId,s.visibleLayers,s.showBoard,s.showComponents,s.componentOpacity,s.compareMode,s.visibleTileIds)&&(c.kind==="board"&&(this.identityOnly||c.boardRole!=="substrate")||(this.writeDraw(c,s.activeNetId,s.componentOpacity,s.boardOpacity,s.isolateNet,s.compareMode,s.compareOffsets?.get(c.layerId)),o.push(c)));this.flushDraws(o);for(let c of o)this.drawEntry(e,c,r);!s.compareMode&&this.barrels&&(this.writeBarrelDraw(s.isolateNet),this.drawBarrels(e,n.barrelPick,r,i)),r&&!s.compareMode&&this.drawBox(e,n.boxPick)}async readPick(e,a,s){let n=this.device.createBuffer({label:"pick-readback",size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});e.copyTextureToBuffer({texture:this.pickTexture,origin:{x:a,y:s}},{buffer:n,bytesPerRow:256},{width:1,height:1}),this.device.queue.submit([e.finish()]);try{await n.mapAsync(GPUMapMode.READ);let r=new DataView(n.getMappedRange()),i=nc(r.getUint32(0,!0),r.getUint32(4,!0));return n.unmap(),{...i,occurrenceKey:i.occurrenceIndex>=0?this.occurrenceKeys[i.occurrenceIndex]??null:null}}finally{n.mapState==="mapped"&&n.unmap(),n.destroy()}}},_p=Object.freeze({0:1,1:0,5:2});function hc(t,e){return t.kind==="component"||t.innerCopper&&e?1:t.kind==="board"&&(t.boardRole==="substrate"||t.boardRole==="soldermask")?5:0}function Ls(t){return t.translucent?3:t.kind!=="board"?0:t.boardRole==="soldermask"?1:t.boardRole==="silkscreen"?2:0}function Np(t,e){return t.kind!=="board"||t.boardRole==="substrate"?1:t.boardRole==="soldermask"?Math.min(e,.72):t.boardRole==="silkscreen"?Math.min(e,.92):e}function Cp(t){if(t.kind!=="board"||t.boardRole!=="soldermask"&&t.boardRole!=="silkscreen")return 0;let e=t.bounds,s=(e?(e[2]+e[5])*.5:0)<0?-1:1,n=t.boardRole==="silkscreen"?35e-6:18e-6;return s*n}function bc(t,e,a){let s=Math.max(0,Math.min(e-1,Math.floor(t.x))),n=Math.max(0,Math.min(a-1,Math.floor(t.y)));return{x:s,y:n,width:Math.max(1,Math.min(e-s,Math.floor(t.width))),height:Math.max(1,Math.min(a-n,Math.floor(t.height)))}}function _c(t){return t*12+2}function Nc(t){let e=[],a=0,s=0,n=0;for(let p=0;p<t.length;p+=1){let f=Math.floor(t[p].samplesMm.length/3);f<2||(e.push(p),a+=f,s+=_c(f),n+=(f-1)*12*6+72)}let r=new Float32Array(Math.max(a,1)*4),i=new ArrayBuffer(Math.max(e.length,1)*32),o=new Uint32Array(i),c=new Float32Array(i),d=new Uint32Array(Math.max(n,3)),h=0,u=0,m=0;return e.forEach((p,f)=>{let l=t[p],y=Math.floor(l.samplesMm.length/3);for(let x=0;x<y;x+=1)r[(h+x)*4]=l.samplesMm[x*3]*.001,r[(h+x)*4+1]=l.samplesMm[x*3+1]*.001,r[(h+x)*4+2]=l.samplesMm[x*3+2]*.001;o[f*8]=h,o[f*8+1]=y,o[f*8+2]=u,o[f*8+3]=f,c[f*8+4]=l.radiusMm*.001;let b=(x,M)=>u+x*12+M%12;for(let x=0;x+1<y;x+=1)for(let M=0;M<12;M+=1)d.set([b(x,M),b(x+1,M),b(x+1,M+1),b(x,M),b(x+1,M+1),b(x,M+1)],m),m+=6;let g=u+y*12;for(let x=0;x<12;x+=1)d.set([g,b(0,x+1),b(0,x)],m),d.set([g+1,b(y-1,x),b(y-1,x+1)],m+3),m+=6;h+=y,u+=_c(y)}),{samples:r,segments:o,indices:d,kept:e,sampleCount:a,vertexCount:s,indexCount:n}}var Bp=`
struct Segment { start: u32, count: u32, vertexStart: u32, color: u32, radius: f32, p0: u32, p1: u32, p2: u32 };
struct Vertex { position: vec4f, normal: vec4f };
`,jp=`${Bp}
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
`,Pp=`
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
`,Cc=96,Gs=class{constructor(e){this.host=e,this.device=e.device,this.counts={segments:0,samples:0,vertices:0,indices:0},this.dirty=!1,this.kept=[];let a=this.device,s=a.createShaderModule({label:"harness-tubes-compute",code:jp});this.computeLayout=a.createBindGroupLayout({label:"harness-tubes-compute",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});let n=a.createPipelineLayout({bindGroupLayouts:[this.computeLayout]});this.framesPipeline=a.createComputePipeline({layout:n,compute:{module:s,entryPoint:"framesMain"}}),this.ringsPipeline=a.createComputePipeline({layout:n,compute:{module:s,entryPoint:"ringsMain"}});let r=a.createShaderModule({label:"harness-tubes-draw",code:Pp});this.drawLayout=a.createBindGroupLayout({label:"harness-tubes-draw",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),this.drawPipeline=a.createRenderPipeline({label:"harness-tubes",layout:a.createPipelineLayout({bindGroupLayouts:[this.drawLayout]}),vertex:{module:r,entryPoint:"vs",buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:"float32x4"},{shaderLocation:1,offset:16,format:"float32x4"}]}]},fragment:{module:r,entryPoint:"fs",targets:[{format:e.format}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:e.depthStencilState(),multisample:{count:1}}),this.globals=a.createBuffer({label:"harness-tubes-globals",size:Cc,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.countBuffer=a.createBuffer({label:"harness-tubes-counts",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.buffers={},this.capacity={samples:0,segments:0,vertices:0,indices:0},this.globalScratch=new Float32Array(Cc/4)}ensure(e,a,s){let n=this.buffers[e];return n&&n.size>=a?!1:(n?.destroy(),this.buffers[e]=this.device.createBuffer({label:`harness-tubes-${e}`,size:Math.max(256,Math.ceil(a*1.5/4)*4),usage:s}),!0)}setTubes(e,a){let s=Nc(e);if(this.kept=s.kept.map(o=>e[o]),this.counts={segments:s.kept.length,samples:s.sampleCount,vertices:s.vertexCount,indices:s.indexCount},!this.counts.segments){this.dirty=!1;return}let n=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,r=!1;r=this.ensure("samples",s.samples.byteLength,n)||r,r=this.ensure("segments",s.segments.byteLength,n)||r,r=this.ensure("frames",s.samples.byteLength,GPUBufferUsage.STORAGE)||r,r=this.ensure("vertices",this.counts.vertices*32,GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX)||r,this.ensure("indices",s.indices.byteLength,GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST);let i=this.device.queue;i.writeBuffer(this.buffers.samples,0,s.samples),i.writeBuffer(this.buffers.segments,0,s.segments),i.writeBuffer(this.buffers.indices,0,s.indices),i.writeBuffer(this.countBuffer,0,new Uint32Array([this.counts.segments,this.counts.samples,this.counts.vertices,0])),(r||!this.computeGroup)&&(this.computeGroup=this.device.createBindGroup({layout:this.computeLayout,entries:["samples","segments","frames","vertices"].map((o,c)=>({binding:c,resource:{buffer:this.buffers[o]}})).concat([{binding:4,resource:{buffer:this.countBuffer}}])})),this.setColors(a),this.dirty=!0}setColors(e){if(!this.counts.segments)return;let a=new Float32Array(this.counts.segments*4);this.kept.forEach((s,n)=>{let{rgb:r,mode:i}=e(s);a.set([r[0],r[1],r[2],i],n*4)}),(this.ensure("colors",a.byteLength,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST)||!this.drawGroup||this.drawGroupColors!==this.buffers.colors)&&(this.drawGroup=this.device.createBindGroup({layout:this.drawLayout,entries:[{binding:0,resource:{buffer:this.globals}},{binding:1,resource:{buffer:this.buffers.colors}}]}),this.drawGroupColors=this.buffers.colors),this.device.queue.writeBuffer(this.buffers.colors,0,a)}encodeCompute(e){if(!this.dirty||!this.counts.segments)return;let a=e.beginComputePass({label:"harness-tubes"});a.setBindGroup(0,this.computeGroup),a.setPipeline(this.framesPipeline),a.dispatchWorkgroups(Math.ceil(this.counts.segments/64)),a.setPipeline(this.ringsPipeline),a.dispatchWorkgroups(Math.ceil(this.counts.vertices/64)),a.end(),this.dirty=!1}draw(e,a,s=0){if(!this.counts.segments)return 0;let n=this.globalScratch;return n.fill(0),n.set(a,0),n.set([.35,-.45,.82,0],16),n[20]=s,this.device.queue.writeBuffer(this.globals,0,n),e.setPipeline(this.drawPipeline),e.setBindGroup(0,this.drawGroup),e.setVertexBuffer(0,this.buffers.vertices),e.setIndexBuffer(this.buffers.indices,"uint32"),e.drawIndexed(this.counts.indices),this.counts.indices/3}gpuMemoryBytes(){return Object.values(this.buffers).reduce((e,a)=>e+a.size,0)}dispose(){for(let e of Object.values(this.buffers))e.destroy();this.globals.destroy(),this.countBuffer.destroy(),this.buffers={}}};var Op=[0,0,0,1,1,1],Ks=class t{static async create(e){return new t(await Qt.create(e))}constructor(e){this.host=e,this.canvas=e.canvas,this.device=e.device,e.alwaysInstanced=!0,e.setOccurrences([]),this.assets=new Map,this.order=[],this.frameStats={triangles:0,draws:0},this.lodThresholds={...$e},this.tubes=null,this.tubeVersion=0}setTubes(e,a){!e.length&&!this.tubes||(this.tubes??=new Gs(this.host),this.tubes.setTubes(e,a),this.tubeVersion+=1)}setTubeColors(e){this.tubes?.setColors(e),this.tubeVersion+=1}asset(e){let a=this.assets.get(e);return a||(a=new Qt(this.canvas,this.device,{shareFrom:this.host}),a.setLodThresholds(this.lodThresholds),this.assets.set(e,a)),a}standIn(e,a){let s=this.asset(e);return s.standIn||(s.standIn=!0,s.setBoardBounds(Op),s.setLodOverride(ic)),s.boxColor=[...a],s}removeAsset(e){let a=this.assets.get(e);a&&(a.dispose(),this.assets.delete(e))}get renderers(){return this.order.map(e=>this.assets.get(e)).filter(Boolean)}setOccurrences(e){this.order=[...e.keys()].filter(s=>this.assets.has(s));for(let[s,n]of this.assets)e.has(s)||n.setOccurrences([]);for(let s of this.order)this.assets.get(s).setOccurrences(e.get(s));let a=0;for(let s of this.renderers)s.occurrenceBase=a,a+=s.occurrenceCount;this.occurrenceCount=a}locate(e){for(let a of this.renderers){let s=e-a.occurrenceBase;if(s>=0&&s<a.occurrenceCount)return{renderer:a,local:s}}return null}keyOf(e){let a=this.locate(e);return a?a.renderer.occurrenceKeys[a.local]??null:null}setSelectedOccurrence(e){let a=e>=0?this.locate(e):null;for(let s of this.renderers)s.selectedOccurrence=!s.standIn&&a?.renderer===s?a.local:-1}resize(){this.host.resize()}render(e,a){let s=this.host;s.resize();let n=this.renderers.filter(u=>u.occurrenceCount>0),r=new Map(n.map(u=>[u,a(u)]));for(let[u,m]of r)Fc(u,m);let i=this.device.createCommandEncoder(),o=n.filter(u=>u.encodeCull(i,e));this.tubes?.encodeCompute(i);let c=i.beginRenderPass({colorAttachments:[{view:s.context.getCurrentTexture().createView(),clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:s.depthAttachment()});Bc(c,e.viewport,this.canvas);let d=0,h=0;for(let u of n){let m=u.encodeDraws(c,e,r.get(u));d+=m.triangles,h+=m.draws}this.tubes?.counts.segments&&(d+=this.tubes.draw(c,e.matrix,performance.now()/1e3),h+=1),c.end(),this.device.queue.submit([i.finish()]);for(let u of o)u.readCullCounts();this.frameStats={triangles:Math.round(d),draws:h}}pick(e,a,s,n){let r=this.host.pickSerial.then(()=>this.performPick(e,a,s,n));return this.host.pickSerial=r.catch(()=>0),r}async performPick(e,a,s,n){let r=this.host;r.resize();let i=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),o=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s))),c=this.device.createCommandEncoder(),d=c.beginRenderPass({colorAttachments:[{view:r.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:r.depthAttachment()});Bc(d,e.viewport,this.canvas);for(let m of this.renderers){if(m.occurrenceCount===0)continue;let p=n(m);Fc(m,p),m.encodePick(d,e,p)}d.end();let h=await r.readPick(c,i,o),u=h.occurrenceIndex>=0?this.locate(h.occurrenceIndex):null;return{...h,occurrenceKey:u?u.renderer.occurrenceKeys[u.local]??null:null,renderer:u?.renderer||null,standIn:!!u?.renderer?.standIn}}gpuMemoryBytes(){let e=0;for(let a of this.renderers)e+=a.gpuMemoryBytes();return e+=this.tubes?.gpuMemoryBytes()||0,e-Math.max(0,this.renderers.length-1)*this.canvas.width*this.canvas.height*12}setLodThresholds(e){this.lodThresholds=ha({...this.lodThresholds,...e});for(let a of this.assets.values())a.setLodThresholds(this.lodThresholds);return{...this.lodThresholds}}cullCounts(){let e={full:0,board:0,body:0,box:0,culled:0};for(let a of this.renderers)if(a.occurrenceCount)for(let s of Object.keys(e))e[s]+=a.cullCounts[s]||0;return e}dispose(){for(let e of[...this.assets.keys()])this.removeAsset(e);this.tubes?.dispose(),this.tubes=null,this.host.dispose(),this.host.context?.unconfigure?.(),this.device.destroy?.()}};function Fc(t,e){e?.layerOffsets&&t.device.queue.writeBuffer(t.layerOffsetBuffer,0,e.layerOffsets)}function Bc(t,e,a){let s=Math.max(0,Math.min(a.width-1,Math.floor(e.x))),n=Math.max(0,Math.min(a.height-1,Math.floor(e.y))),r=Math.max(1,Math.min(a.width-s,Math.floor(e.width))),i=Math.max(1,Math.min(a.height-n,Math.floor(e.height)));t.setViewport(s,n,r,i,0,1),t.setScissorRect(s,n,r,i)}var Dp=`
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
}`,Lp=`
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
}`,Up=`
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
}`,Gp=`
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
}`,Kp=`
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
}`,zp=`
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
}`,Vp=`
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
}`,Hp=6.2,qp=4.6,Xp=3.8,Vs=4*1024*1024,Wp=Math.floor(Vs/6),jc=Wp*6,zs=512*1024,Pc=512*1024,Oc=96,$p=96,Yp=18,Dc=96*1024*1024,Jp=2,Xs=class t{static async create(e,a){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let s=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!s)throw new Error("No WebGPU adapter is available");let n=await s.requestDevice(),r=await fetch(a,{cache:"default"});if(!r.ok)throw new Error(`Failed to load schematic manifest: ${r.status}`);let i=await r.json();if(!["prism.schematic_world_a0","prism.schematic_vector_a0"].includes(i.schema))throw new Error(`Unsupported schematic scene schema: ${i.schema}`);let o=i.featureTable||i.features,c=await fetch(new URL(o,a),{cache:"default"});if(!c.ok)throw new Error(`Failed to load schematic features: ${c.status}`);let d=Zp(await c.json());return new t(e,n,a,i,d)}constructor(e,a,s,n,r){this.canvas=e,this.device=a,this.manifestUrl=s,this.manifest=n,this.isNativeScene=n.schema==="prism.schematic_vector_a0",this.pages=n.pages||[],this.featuresByPage=r,this.featuresById=new Map;for(let p of Object.values(r))for(let f of p)this.featuresById.set(Number(f.id),f);this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"}),this.flowCanvas=null,this.flowContext=null,this.globalBuffer=a.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.bindGroupLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]});let i=a.createShaderModule({code:Dp});this.pagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:this.format}]},primitive:{topology:"triangle-list"}}),this.edgeLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});let o=a.createShaderModule({code:Lp});this.edgePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:o,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:o,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.edgeBindGroup=a.createBindGroup({layout:this.edgeLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}}]});let c=a.createShaderModule({code:Up});this.highlightPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:c,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:c,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.highlightBufferSize=4*1024*1024,this.highlightBuffer=a.createBuffer({size:this.highlightBufferSize,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});let d=a.createShaderModule({code:Gp});this.netFlowPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:d,entryPoint:"vs",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x2"}]}]},fragment:{module:d,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.netFlowBuffer=a.createBuffer({size:Pc*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.globalUniformScratch=new Float32Array(12),this.pageUniformScratch=new Float32Array(8),this.imageUniformScratch=new Float32Array(8),this.vectorScratch=new Float32Array(Vs),this.highlightScratch=new Float32Array(this.highlightBufferSize/4),this.netFlowScratch=new Float32Array(Pc),this.netTrackingCache=null,this.selectedIntrasheetLinkIndex=-1,this.truncatedHighlightCount=0,this.truncatedVectorCount=0,this.frameSerial=0,this.querySerial=0;let h=a.createShaderModule({code:Kp});this.vectorPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:h,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x4"}]}]},fragment:{module:h,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.vectorBuffer=a.createBuffer({size:Vs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers=[this.vectorBuffer];let u=a.createShaderModule({code:zp});this.imagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:u,entryPoint:"vs"},fragment:{module:u,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}});let m=a.createShaderModule({code:Vp});this.pickPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:m,entryPoint:"vs",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"uint32"}]}]},fragment:{module:m,entryPoint:"fs",targets:[{format:"r32uint"}]},primitive:{topology:"triangle-list"}}),this.pickVertexBuffer=a.createBuffer({size:zs*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.pickReadBuffer=a.createBuffer({size:256,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pickTexture=null,this.pickTextureSize=[0,0],this.pickPending=!1,this.vectorChunks=new Map,this.failedVectorChunks=new Map,this.nativeDetailState=new Map,this.domDetailPageIds=new Set,this.nativeDetailThresholds=new Map,this.residentVectorBytes=0,this.sampler=a.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.placeholder=this.createSolidTexture([245,247,249,255]),this.pageResources=new Map,this.imageResources=new Map,this.loading=new Map,this.selectedPageId="",this.selectedFeatureId=0,this.activeNetUid="",this.showHierarchy=!0,this.downloadedBytes=0,this.world=n.worldBoundsMm,this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/900,(this.world.maxY-this.world.minY)/650,.1)*1.16,this.edgeBuffer=this.createEdgeBuffer();for(let p of this.pages)this.createPageResource(p)}createSolidTexture(e){let a=this.device.createTexture({size:[1,1],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.queue.writeTexture({texture:a},new Uint8Array(e),{bytesPerRow:4},[1,1]),a}createPageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={page:e,uniform:a,texture:this.placeholder,textureWidth:0,svgBlob:null,bindGroup:null};this.pageResources.set(e.id,s),this.updateBindGroup(s)}createImageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={path:e,uniform:a,texture:this.placeholder,loaded:!1,bindGroup:null};return this.imageResources.set(e,s),this.updateBindGroup(s),s}updateBindGroup(e){e.bindGroup=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e.uniform}},{binding:2,resource:this.sampler},{binding:3,resource:e.texture.createView()}]})}async loadImageTexture(e){let a=this.imageResources.get(e)||this.createImageResource(e);if(a.loaded)return a;let s=`image:${e}`;if(this.loading.has(s))return this.loading.get(s);let n=(async()=>{try{let r=await fetch(new URL(e,this.manifestUrl),{cache:"default"});if(!r.ok)throw new Error(`Failed to load schematic image ${e}: ${r.status}`);let i=await r.blob(),o=await createImageBitmap(i),c=this.device.createTexture({size:[o.width,o.height],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:o},{texture:c},[o.width,o.height]),o.close(),a.texture!==this.placeholder&&a.texture.destroy(),a.texture=c,a.loaded=!0,this.updateBindGroup(a)}finally{this.loading.delete(s)}return a})();return this.loading.set(s,n),n}createEdgeBuffer(){let e=new Map(this.pages.map(r=>[r.id,r])),a=[];for(let r of this.manifest.edges||[]){let i=e.get(r.source),o=e.get(r.target);!i||!o||a.push(i.worldX+i.widthMm/2,i.worldY+i.heightMm,o.worldX+o.widthMm/2,o.worldY)}let s=new Float32Array(a);if(!s.length)return null;let n=this.device.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(n,0,s),{buffer:n,count:s.length/2}}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));(this.canvas.width!==a||this.canvas.height!==s)&&(this.canvas.width=a,this.canvas.height=s),this.flowCanvas&&(this.flowCanvas.width!==a||this.flowCanvas.height!==s)&&(this.flowCanvas.width=a,this.flowCanvas.height=s)}setFlowOverlayCanvas(e){e&&(this.flowCanvas=e,this.flowContext=e.getContext("webgpu"),this.flowContext.configure({device:this.device,format:this.format,alphaMode:"premultiplied"}))}writeGlobals(){let e=this.globalUniformScratch;e[0]=this.center[0],e[1]=this.center[1],e[2]=this.scale,e[3]=performance.now()*.001,e[4]=this.canvas.width,e[5]=this.canvas.height,this.device.queue.writeBuffer(this.globalBuffer,0,e)}pagePixelWidth(e){return e.widthMm/this.scale}pageSourcePixelsPerMm(e){let a=this.pagePixelWidth(e)/Math.max(1,e.sourceWidthMm||e.widthMm),s=e.heightMm/this.scale/Math.max(1,e.sourceHeightMm||e.heightMm);return Math.min(a,s)}pageNativeDetailThresholds(e){let a=this.nativeDetailThresholds.get(e.id);if(a)return a;let s=Math.max(1,e.sourceWidthMm||e.widthMm),n=Math.max(1,e.sourceHeightMm||e.heightMm),r=s*n,i=Math.max(0,e.featureCount||e.featureIds?.length||0)/Math.max(1,r),o=re(1-i*72,.84,1.08),c=re(Math.sqrt(Math.max(s,n)/Math.max(1,Math.min(s,n)))/1.18,.92,1.14),d=re(Hp*o*c,5,7.4),h={enter:d,exit:re(Math.min(d-1.2,qp*o),3.8,d-.7),prefetch:re(Math.min(d-2,Xp*o),3,d-1)};return this.nativeDetailThresholds.set(e.id,h),h}pageWantsNativeDetail(e){if(!this.pageHasNativeDetail(e))return!1;let a=this.pageSourcePixelsPerMm(e),s=this.nativeDetailState.get(e.id)===!0,n=this.pageNativeDetailThresholds(e),r=s?n.exit:n.enter,i=a>=r;return i!==s&&this.nativeDetailState.set(e.id,i),i}pageNativeDetailReady(e){if(this.domDetailPageIds.has(e.id)||!this.pageWantsNativeDetail(e))return!1;let a=this.vectorChunks.get(e.id);return!a?.loaded||!a.segments?.length&&!a.fills?.length?!1:this.visibleNativeImagesReady(e,a)}visibleNativeImagesReady(e,a){if(!a?.images?.length)return!0;let s=this.sourceViewportBounds(e,4),n=!0;for(let r of a.images){if(!dt(r.bounds,s))continue;(this.imageResources.get(r.path)||this.createImageResource(r.path)).loaded||(n=!1,this.loadImageTexture(r.path).catch(()=>{}))}return n}visiblePages(){let e=this.canvas.width*this.scale/2,a=this.canvas.height*this.scale/2,s=this.center[0]-e,n=this.center[0]+e,r=this.center[1]-a,i=this.center[1]+a;return this.pages.filter(o=>o.worldX+o.widthMm>=s&&o.worldX<=n&&o.worldY+o.heightMm>=r&&o.worldY<=i)}worldViewportBounds(e=0){let a=this.canvas.width*this.scale/2,s=this.canvas.height*this.scale/2;return[this.center[0]-a-e,this.center[1]-s-e,this.center[0]+a+e,this.center[1]+s+e]}sourceViewportBounds(e,a=2.5){let s=this.worldViewportBounds(this.scale*8),n=(s[0]-e.worldX)/e.widthMm*e.sourceWidthMm-a,r=(s[1]-e.worldY)/e.heightMm*e.sourceHeightMm-a,i=(s[2]-e.worldX)/e.widthMm*e.sourceWidthMm+a,o=(s[3]-e.worldY)/e.heightMm*e.sourceHeightMm+a;return[Math.max(-a,Math.min(n,i)),Math.max(-a,Math.min(r,o)),Math.min(e.sourceWidthMm+a,Math.max(n,i)),Math.min(e.sourceHeightMm+a,Math.max(r,o))]}render(){this.frameSerial+=1,this.resize(),this.writeGlobals();let e=this.visiblePages(),a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.045,g:.055,b:.073,a:1},loadOp:"clear",storeOp:"store"}]});this.showHierarchy&&this.edgeBuffer&&(s.setPipeline(this.edgePipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.edgeBuffer.buffer),s.draw(this.edgeBuffer.count)),s.setPipeline(this.pagePipeline);for(let i of e){let o=this.pageResources.get(i.id),c=this.activeNetUid&&i.netUids.includes(this.activeNetUid),d=this.domDetailPageIds.has(i.id),h=!d&&this.pageNativeDetailReady(i),u=this.pageUniformScratch;u[0]=i.worldX,u[1]=i.worldY,u[2]=i.widthMm,u[3]=i.heightMm,u[4]=i.id===this.selectedPageId?1:0,u[5]=c?1:0,u[6]=this.activeNetUid?1:0,u[7]=h||d?1:0,this.device.queue.writeBuffer(o.uniform,0,u),s.setBindGroup(0,o.bindGroup),s.draw(6);let m=re(Math.ceil(this.pagePixelWidth(i)*1.3/512)*512,512,6144);o.textureWidth<m*.82&&this.loadPageTexture(i,m).catch(()=>{})}this.scheduleVisibleVectorLoads(e),this.drawVisibleImages(s,e),this.drawVisibleVectors(s,e);let n=this.writeNetTrackingOverlay();n&&!this.flowContext&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(n));let r=this.writeNetHighlights(e);return r&&(s.setPipeline(this.highlightPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.highlightBuffer),s.draw(r)),s.end(),this.device.queue.submit([a.finish()]),this.renderFlowOverlay(n),this.evictVectorChunks(e),e}renderFlowOverlay(e){if(!this.flowContext)return;let a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.flowContext.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});e&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(e)),s.end(),this.device.queue.submit([a.finish()])}drawVisibleImages(e,a){if(!this.isNativeScene)return;let s=!1;for(let n of a){if(this.domDetailPageIds.has(n.id)||!this.pageNativeDetailReady(n))continue;let r=this.vectorChunks.get(n.id);if(!r?.images?.length)continue;let i=this.sourceViewportBounds(n,4);for(let o of r.images){if(!dt(o.bounds,i))continue;let c=this.imageResources.get(o.path)||this.createImageResource(o.path);c.loaded||this.loadImageTexture(o.path).catch(()=>{});let d=o.worldOrigin||this.sourceToWorld(n,[o.xMm,o.yMm]),h=o.worldSize||this.sourceSizeToWorld(n,o.widthMm,o.heightMm),u=this.imageUniformScratch;u[0]=d[0],u[1]=d[1],u[2]=h[0],u[3]=h[1],u[4]=0,u[5]=0,u[6]=0,u[7]=0,this.device.queue.writeBuffer(c.uniform,0,u),s||(e.setPipeline(this.imagePipeline),s=!0),e.setBindGroup(0,c.bindGroup),e.draw(6)}}}drawVisibleVectors(e,a){if(!this.isNativeScene)return 0;let s=this.vectorScratch,n=0,r=0,i=0,o=0,c=!1,d=()=>{if(!n)return;let u=this.vectorBuffers[o];u||(u=this.device.createBuffer({size:Vs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers.push(u)),this.device.queue.writeBuffer(u,0,s,0,n),c||(e.setPipeline(this.vectorPipeline),e.setBindGroup(0,this.edgeBindGroup),c=!0);let m=Math.floor(n/6);e.setVertexBuffer(0,u),e.draw(m),i+=m,o+=1,n=0},h=u=>u>jc||u>s.length?(r+=1,!1):((n+u>jc||n+u>s.length)&&d(),!0);for(let u of a){if(this.domDetailPageIds.has(u.id)||!this.pageHasNativeDetail(u))continue;let m=this.vectorChunks.get(u.id);if(!m?.segments?.length&&!m?.fills?.length||!this.pageNativeDetailReady(u))continue;m.lastUsedFrame=this.frameSerial;let p=this.sourceViewportBounds(u),f=Uc(m.spatial,p);for(let l of f.fills){if(!dt(l.bounds,p)||!h(18))continue;let y=this.featuresById.get(l.featureId),b=this.activeNetUid&&y?.netUid===this.activeNetUid,x=this.selectedFeatureId===l.featureId?[.24,.58,1,1]:b?[.06,1,.24,1]:this.activeNetUid&&Ga(y)?Vc(y,l.kind,l.color):Tr(y,l.kind,l.color),M=l.worldPoints||l.points.map(T=>this.sourceToWorld(u,T));n=mm(s,n,M[0],M[1],M[2],x)}for(let l of f.segments){if(!dt(l.bounds,p))continue;let y=this.featuresById.get(l.featureId),b=this.activeNetUid&&y?.netUid===this.activeNetUid,g=this.selectedFeatureId===l.featureId,x=g?[.24,.58,1,1]:b?[.06,1,.24,1]:this.activeNetUid&&Ga(y)?Vc(y,l.kind,l.color):Tr(y,l.kind,l.color),M=this.segmentWorldWidth(u,l,y,b||g);for(let T of this.visibleSegmentParts(u,l,y)){if(!h(36))continue;let I=T.worldA||this.sourceToWorld(u,T.a),S=T.worldB||this.sourceToWorld(u,T.b);n=pm(s,n,I,S,M,x)}}}return d(),this.truncatedVectorCount=r,this.vectorTruncated=r>0,this.lastVectorVertices=i,this.lastVectorChunks=o,i}pageHasNativeDetail(e){return this.isNativeScene?e?.nativeDetail?.enabled!==!1:!1}scheduleVisibleVectorLoads(e){if(!this.isNativeScene)return;let a=[...this.vectorChunks.values()].filter(r=>r?.promise&&!r.loaded).length,s=Math.max(0,Jp-a);if(!s)return;let n=e.filter(r=>!this.domDetailPageIds.has(r.id)).filter(r=>this.pageHasNativeDetail(r)&&this.pageSourcePixelsPerMm(r)>=this.pageNativeDetailThresholds(r).prefetch).filter(r=>!this.vectorChunks.get(r.id)?.loaded&&!this.vectorChunks.get(r.id)?.promise).sort((r,i)=>{let o=Math.hypot(r.worldX+r.widthMm/2-this.center[0],r.worldY+r.heightMm/2-this.center[1]),c=Math.hypot(i.worldX+i.widthMm/2-this.center[0],i.worldY+i.heightMm/2-this.center[1]);return o-c});for(let r of n)if(this.loadPageVectors(r).catch(()=>{}),s-=1,!s)break}featurePrimitiveBounds(e,a){let s=this.vectorChunks.get(e.id);if(!s?.segments?.length&&!s?.fills?.length)return null;let n=[],r=[];for(let i of s.segments||[])i.featureId===a&&(n.push(i.a[0],i.b[0]),r.push(i.a[1],i.b[1]));for(let i of s.fills||[])if(i.featureId===a)for(let o of i.points||[])n.push(o[0]),r.push(o[1]);return n.length?[Math.min(...n),Math.min(...r),Math.max(...n),Math.max(...r)]:null}symbolClipBounds(e){if(this._symbolClipBounds||(this._symbolClipBounds=new Map),this._symbolClipBounds.has(e.id))return this._symbolClipBounds.get(e.id);let a=(this.featuresByPage[e.id]||[]).filter(s=>s?.kind==="symbol_body"&&s.boundsMm&&!String(s.sourceId||"").includes(":overplot")).map(s=>{let n=this.featurePrimitiveBounds(e,s.id)||s.boundsMm;return[n[0]-.02,n[1]-.02,n[2]+.02,n[3]+.02]}).filter(s=>{let n=s[2]-s[0],r=s[3]-s[1];return Math.max(n,r)<=12&&n*r<=80});return this._symbolClipBounds.set(e.id,a),a}visibleSegmentParts(e,a,s){if(a._visibleParts)return a._visibleParts;let n=String(s?.kind||""),r=String(s?.semanticRole||"");if(n!=="wire"&&r!=="wire")return a._visibleParts=[a],a._visibleParts;let i=[a];for(let o of this.symbolClipBounds(e)){let c=[];for(let d of i)c.push(...xm(d,o));if(i=c,!i.length)break}for(let o of i)o.worldA=ma(e,o.a),o.worldB=ma(e,o.b);return a._visibleParts=i,a._visibleParts}netTrackingSegments(){if(!this.activeNetUid)return{netUid:"",anchorsByPage:new Map,segments:[],intrasheetSegments:[]};let e=Number(this.selectedFeatureId||0),a=String(this.selectedFeatureKey||""),s=String(this.selectedSourceId||"");if(this.netTrackingCache?.netUid===this.activeNetUid&&this.netTrackingCache?.selectedFeatureId===e&&this.netTrackingCache?.selectedFeatureKey===a&&this.netTrackingCache?.selectedSourceId===s)return this.netTrackingCache;this.selectedIntrasheetLinkIndex=-1;let n=new Map(this.pages.map(f=>[f.id,f])),r=this.manifest.netToPages?.[this.activeNetUid]||[],i=r.length?r.map(f=>n.get(f)).filter(Boolean):this.pages.filter(f=>f.netUids?.includes(this.activeNetUid)),o=new Map;for(let f of i.slice(0,$p)){let l=this.netTrackingAnchorsForPage(f);l.length&&o.set(f.id,l)}let c=[],d=[];for(let[f,l]of o){let y=Kc(um(l),"intrasheet",f);c.push(...y),d.push(...y)}let h=[...o.entries()].map(([f,l])=>fm(n.get(f),l,{featureId:e,stableKey:a,sourceId:s})).filter(Boolean);c.push(...Kc(h,"intersheet",""));let u=d.map((f,l)=>({...f,intrasheetIndex:l})),m=0,p=c.map((f,l)=>{if(f.type!=="intrasheet")return{...f,id:l};let y=m;return m+=1,{...f,id:l,intrasheetIndex:y}});return this.netTrackingCache={netUid:this.activeNetUid,selectedFeatureId:e,selectedFeatureKey:a,selectedSourceId:s,anchorsByPage:o,segments:p,intrasheetSegments:u},this.selectedIntrasheetLinkIndex>=this.netTrackingCache.intrasheetSegments.length&&(this.selectedIntrasheetLinkIndex=-1),this.netTrackingCache}netTrackingAnchorsForPage(e){let a=this.featuresByPage[e.id]||[],s=[];for(let n of a){if(n.netUid!==this.activeNetUid||!n.boundsMm||!lm(n))continue;let r=n.boundsMm,i=[(r[0]+r[2])/2,(r[1]+r[3])/2],o=this.sourceToWorld(e,i);s.push({pageId:e.id,featureId:Number(n.id||0),stableKey:String(n.stableKey||""),sourceId:String(n.sourceId||n.sourceUid||n.objectId||""),kind:n.kind||n.semanticRole||"",source:i,world:o,bounds:r,priority:dm(n)})}return s.sort((n,r)=>r.priority-n.priority||n.source[1]-r.source[1]||n.source[0]-r.source[0]),s}writeNetTrackingOverlay(){let e=this.netTrackingSegments();if(this.lastNetFlowSegments=e.segments.length,this.lastNetFlowIntrasheetSegments=e.intrasheetSegments.length,!e.segments.length)return this.lastNetFlowVertices=0,0;let a=this.worldViewportBounds(this.scale*96),s=this.netFlowScratch,n=0,r=0;for(let i of e.segments){if(!dt(zc(i),a))continue;let o=i.type==="intrasheet"&&i.intrasheetIndex===this.selectedIntrasheetLinkIndex,c=o?9.5:i.type==="intersheet"?8:4.8,d=o?2:i.type==="intersheet"?1:0,h=gm(s,n,i.a,i.b,c*this.scale,d,r,this.scale);if(h!==n&&(n=h,r+=Math.hypot(i.b[0]-i.a[0],i.b[1]-i.a[1])/Math.max(this.scale,1e-6),n+24>s.length))break}return n?(this.device.queue.writeBuffer(this.netFlowBuffer,0,s,0,n),this.lastNetFlowVertices=n/4,n/4):(this.lastNetFlowVertices=0,0)}cycleNetIntrasheetLink(e=1){let a=this.netTrackingSegments();if(!a.intrasheetSegments.length)return null;let s=a.intrasheetSegments.length;this.selectedIntrasheetLinkIndex=(this.selectedIntrasheetLinkIndex+e+s)%s;let n=a.intrasheetSegments[this.selectedIntrasheetLinkIndex];if(!n)return null;let r=zc(n,14*this.scale);return this.center=[(r[0]+r[2])/2,(r[1]+r[3])/2],this.scale=Math.max((r[2]-r[0])/Math.max(1,this.canvas.width*.36),(r[3]-r[1])/Math.max(1,this.canvas.height*.3),this.scale*.35,.025),{pageId:n.pageId,segment:n}}writeNetHighlights(e){if(!this.activeNetUid)return 0;let a=this.highlightScratch,s=0,n=0;for(let r of e){let i=this.sourceViewportBounds(r,5);for(let o of this.featuresByPage[r.id]||[]){if(o.netUid!==this.activeNetUid||!o.boundsMm||!dt(o.boundsMm,i))continue;let c=this.featureWorldBounds(r,o.boundsMm);if(s+16>a.length){n+=1;continue}a[s++]=c[0],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[3],a[s++]=c[2],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[1]}}return this.truncatedHighlightCount=n,s?(this.device.queue.writeBuffer(this.highlightBuffer,0,a,0,s),s/2):0}featureWorldBounds(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm,e.worldX+a[2]/e.sourceWidthMm*e.widthMm,e.worldY+a[3]/e.sourceHeightMm*e.heightMm]}sourceToWorld(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm]}sourceSizeToWorld(e,a,s){return[a/e.sourceWidthMm*e.widthMm,s/e.sourceHeightMm*e.heightMm]}async loadPageVectors(e){if(!this.pageHasNativeDetail(e)||!e.chunks?.lod2)return null;let a=this.vectorChunks.get(e.id);if(a?.loaded)return a;if(a?.promise)return a.promise;let s=(async()=>{try{let n=await fetch(new URL(e.chunks.lod2,this.manifestUrl));if(!n.ok)throw new Error(`Failed to load schematic vector chunk ${e.id}: ${n.status}`);let r=await n.json(),i=em(r.primitives||[]);tm(e,i);let c=JSON.stringify(r).length,d={loaded:!0,segments:i.segments,fills:i.fills,images:i.images,spatial:cm(i),unsupported:r.unsupported||[],bytes:c,lastUsedFrame:this.frameSerial};return this.vectorChunks.set(e.id,d),this.failedVectorChunks.delete(e.id),this.residentVectorBytes+=c,d}catch(n){let r=this.failedVectorChunks.get(e.id)||{count:0,message:""};throw this.failedVectorChunks.set(e.id,{count:r.count+1,message:n?.message||String(n)}),this.vectorChunks.delete(e.id),n}})();return this.vectorChunks.set(e.id,{loaded:!1,promise:s,segments:[]}),s}evictVectorChunks(e){if(this.residentVectorBytes<=Dc)return;let a=new Set(e.map(n=>n.id)),s=[...this.vectorChunks.entries()].filter(([,n])=>n?.loaded).filter(([n])=>!a.has(n)&&n!==this.selectedPageId).sort((n,r)=>(n[1].lastUsedFrame||0)-(r[1].lastUsedFrame||0));for(let[n,r]of s)if(this.vectorChunks.delete(n),this.residentVectorBytes=Math.max(0,this.residentVectorBytes-(r.bytes||0)),this.residentVectorBytes<=Dc*.82)break}stats(){let e=this.visiblePages(),a=e.map(n=>this.pageSourcePixelsPerMm(n)),s=e.map(n=>this.pageNativeDetailThresholds(n).enter);return{residentVectorBytes:this.residentVectorBytes,vectorChunks:[...this.vectorChunks.values()].filter(n=>n?.loaded).length,vectorLoads:[...this.vectorChunks.values()].filter(n=>n?.promise&&!n.loaded).length,failedVectorChunks:this.failedVectorChunks.size,vectorVertices:this.lastVectorVertices||0,vectorDrawChunks:this.lastVectorChunks||0,truncatedVectors:this.truncatedVectorCount||0,nativeDetailPages:[...this.nativeDetailState.values()].filter(Boolean).length,nativePxPerMm:Number((Math.max(0,...a)||0).toFixed(2)),nativeThresholdPxPerMm:Number((s.length?Math.min(...s):0).toFixed(2)),domDetailPages:this.domDetailPageIds.size,netFlowSegments:this.lastNetFlowSegments||0,netFlowIntrasheetSegments:this.lastNetFlowIntrasheetSegments||0,netFlowVertices:this.lastNetFlowVertices||0}}setDomDetailPageIds(e){this.domDetailPageIds=new Set(e||[])}async loadPageTexture(e,a){let s=`${e.id}:${a}`;if(this.loading.has(s))return this.loading.get(s);let n=this.pageResources.get(e.id);if(!n||n.textureWidth>=a)return;let r=(async()=>{if(!n.svgBlob){let c=await fetch(new URL(Qp(e),this.manifestUrl));if(!c.ok)throw new Error(`Failed to load schematic page ${e.name}: ${c.status}`);n.svgBlob=await c.blob(),this.downloadedBytes+=n.svgBlob.size}let i=n.svgBlob,o=URL.createObjectURL(i);try{let c=new Image;if(c.decoding="async",c.src=o,await c.decode(),n.textureWidth>=a)return;let d=Math.max(64,Math.round(a*e.heightMm/e.widthMm)),h=new OffscreenCanvas(a,d),u=h.getContext("2d",{alpha:!1});u.fillStyle="#ffffff",u.fillRect(0,0,a,d),u.drawImage(c,0,0,a,d);let m=await createImageBitmap(h),p=this.device.createTexture({size:[a,d],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:m},{texture:p},[a,d]),m.close(),n.texture!==this.placeholder&&n.texture.destroy(),n.texture=p,n.textureWidth=a,this.updateBindGroup(n)}finally{URL.revokeObjectURL(o),this.loading.delete(s)}})();return this.loading.set(s,r),r}preloadOverview(){let e=[...this.pages],a=async()=>{for(;e.length;){let s=e.shift();await this.loadPageTexture(s,512).catch(()=>{})}};return Promise.all(Array.from({length:Math.min(4,e.length)},a))}screenToWorld(e,a){let s=this.canvas.getBoundingClientRect(),n=(e-s.left)*this.canvas.width/s.width,r=(a-s.top)*this.canvas.height/s.height;return[this.center[0]+(n-this.canvas.width/2)*this.scale,this.center[1]+(r-this.canvas.height/2)*this.scale]}worldToScreen(e,a){let s=this.canvas.clientWidth/this.canvas.width,n=this.canvas.clientHeight/this.canvas.height;return[((e-this.center[0])/this.scale+this.canvas.width/2)*s,((a-this.center[1])/this.scale+this.canvas.height/2)*n]}hitPage(e,a){let[s,n]=this.screenToWorld(e,a);return[...this.pages].reverse().find(r=>s>=r.worldX&&s<=r.worldX+r.widthMm&&n>=r.worldY&&n<=r.worldY+r.heightMm)||null}async pickFeature(e,a){if(!this.isNativeScene)return this.hitFeature(e,a);let s=this.hitPage(e,a);if(!s)return null;if(!this.pageHasNativeDetail(s))return this.hitFeature(e,a);await this.loadPageVectors(s);let n=await this.gpuPickFeature(s,e,a);return n&&!Ua(n)?{page:s,feature:n,source:this.clientToSource(s,e,a),native:!0,gpu:!0}:this.hitFeature(e,a)}hitFeature(e,a){let s=this.hitPage(e,a);if(!s)return null;let[n,r]=this.clientToSource(s,e,a),i=Math.max(.45,5*this.scale*this.canvas.width/Math.max(1,this.canvas.clientWidth)*s.sourceWidthMm/s.widthMm),o=this.hitResidentVectorFeature(s,n,r,i);if(o)return{page:s,feature:o,source:[n,r],native:!0};let c=this.hitSymbolInterior(s,n,r);if(c)return{page:s,feature:c,source:[n,r],native:!0,interior:!0};let d=(this.featuresByPage[s.id]||[]).filter(h=>{if(Ua(h))return!1;let u=h.boundsMm;return u&&n>=u[0]-i&&n<=u[2]+i&&r>=u[1]-i&&r<=u[3]+i}).map(h=>({feature:h,priority:La(h),area:Math.max(1e-4,(h.boundsMm[2]-h.boundsMm[0])*(h.boundsMm[3]-h.boundsMm[1]))})).sort((h,u)=>u.priority-h.priority||h.area-u.area);return{page:s,feature:d[0]?.feature||null,source:[n,r]}}hitSymbolInterior(e,a,s){let n=null;for(let r of this.featuresByPage[e.id]||[]){let i=String(r?.kind||"");if(i!=="symbol_body"&&i!=="symbol_instance"||String(r?.sourceId||"").includes(":overplot"))continue;let o=r.boundsMm;if(!o||a<o[0]||a>o[2]||s<o[1]||s>o[3])continue;let c=Math.max(1e-4,(o[2]-o[0])*(o[3]-o[1])),d=(i==="symbol_body"?0:1e6)+c;(!n||d<n.score)&&(n={feature:r,score:d})}return n?.feature||null}clientToSource(e,a,s){let[n,r]=this.screenToWorld(a,s);return[(n-e.worldX)/e.widthMm*e.sourceWidthMm,(r-e.worldY)/e.heightMm*e.sourceHeightMm]}ensurePickTexture(){this.pickTexture&&this.pickTextureSize[0]===this.canvas.width&&this.pickTextureSize[1]===this.canvas.height||(this.pickTexture&&this.pickTexture.destroy(),this.pickTexture=this.device.createTexture({size:[this.canvas.width,this.canvas.height],format:"r32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),this.pickTextureSize=[this.canvas.width,this.canvas.height])}writePickVectors(e){let a=new ArrayBuffer(zs*12),s=new DataView(a),n=0,r=[];for(let i of e){let o=this.vectorChunks.get(i.id);if(!o?.segments?.length&&!o?.fills?.length&&!o?.images?.length)continue;let c=this._pickSourcePointByPage?.get(i.id),d=c?[c[0]-2.5,c[1]-2.5,c[0]+2.5,c[1]+2.5]:[0,0,i.sourceWidthMm,i.sourceHeightMm],h=Uc(o.spatial,d);for(let u of h.images){if(!dt(u.bounds,d))continue;let m=this.featuresById.get(u.featureId);!m||Ua(m)||r.push({page:i,image:u,feature:m,priority:La(m)-5})}for(let u of h.fills){if(!dt(u.bounds,d))continue;let m=this.featuresById.get(u.featureId);!m||Ua(m)||r.push({page:i,fill:u,feature:m,priority:La(m)-2})}for(let u of h.segments){if(!dt(u.bounds,d))continue;let m=this.featuresById.get(u.featureId);!m||Ua(m)||r.push({page:i,segment:u,feature:m,priority:La(m)})}}r.sort((i,o)=>i.priority-o.priority);for(let{page:i,segment:o,fill:c,image:d,feature:h}of r){if(n+6>zs)break;if(d){let u=this.sourceToWorld(i,[d.xMm,d.yMm]),m=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm]),p=this.sourceToWorld(i,[d.xMm,d.yMm+d.heightMm]),f=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm+d.heightMm]);n=Er(s,n,u,m,p,d.featureId),n=Er(s,n,p,m,f,d.featureId)}else if(c){let u=c.worldPoints||c.points.map(m=>this.sourceToWorld(i,m));n=Er(s,n,u[0],u[1],u[2],c.featureId)}else{let u=Math.max(this.segmentWorldWidth(i,o,h,!1),this.scale*7);for(let m of this.visibleSegmentParts(i,o,h)){if(n+6>zs)break;let p=m.worldA||this.sourceToWorld(i,m.a),f=m.worldB||this.sourceToWorld(i,m.b);n=vm(s,n,p,f,u,o.featureId)}}}return n?(this.device.queue.writeBuffer(this.pickVertexBuffer,0,a,0,n*12),n):0}async gpuPickFeature(e,a,s){if(this.pickPending)return null;let n=this.clientToSource(e,a,s);this._pickSourcePointByPage=new Map([[e.id,n]]);let r=this.writePickVectors([e]);if(this._pickSourcePointByPage=null,!r)return null;this.resize(),this.writeGlobals(),this.ensurePickTexture();let i=this.canvas.getBoundingClientRect(),o=Math.max(0,Math.min(this.canvas.width-1,Math.floor((a-i.left)*this.canvas.width/i.width))),c=Math.max(0,Math.min(this.canvas.height-1,Math.floor((s-i.top)*this.canvas.height/i.height))),d=this.device.createCommandEncoder(),h=d.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});h.setPipeline(this.pickPipeline),h.setBindGroup(0,this.edgeBindGroup),h.setVertexBuffer(0,this.pickVertexBuffer),h.draw(r),h.end(),d.copyTextureToBuffer({texture:this.pickTexture,origin:{x:o,y:c}},{buffer:this.pickReadBuffer,bytesPerRow:256,rowsPerImage:1},{width:1,height:1,depthOrArrayLayers:1}),this.pickPending=!0,this.device.queue.submit([d.finish()]);try{await this.pickReadBuffer.mapAsync(GPUMapMode.READ);let u=new DataView(this.pickReadBuffer.getMappedRange()).getUint32(0,!0);return this.pickReadBuffer.unmap(),u&&this.featuresById.get(u)||null}finally{this.pickReadBuffer.mapState==="mapped"&&this.pickReadBuffer.unmap(),this.pickPending=!1}}hitResidentVectorFeature(e,a,s,n){if(!this.isNativeScene)return null;let r=this.vectorChunks.get(e.id);if(!r?.loaded)return null;let i=null;for(let o of r.segments){let c=this.featuresById.get(o.featureId),d=Math.max(n,(o.widthMm||0)*.5+n*.45);if(c)for(let h of this.visibleSegmentParts(e,o,c)){let u=ym([a,s],h.a,h.b);if(u>d)continue;let m=u-La(c)*.025+(Ga(c)?0:8);(!i||m<i.score)&&(i={feature:c,score:m})}}return i?.feature||null}segmentWorldWidth(e,a,s,n){let r=(a.widthMm||.15)/Math.max(1,e.sourceWidthMm)*e.widthMm;return Math.max(r,this.scale*bm(s,a.kind,n))}pan(e,a){let s=this.canvas.width/Math.max(1,this.canvas.clientWidth);this.center[0]-=e*this.scale*s,this.center[1]-=a*this.scale*s}zoom(e,a,s){let n=this.screenToWorld(a,s);this.scale=re(this.scale*Math.exp(e*.0015),.015,16);let r=this.screenToWorld(a,s);this.center[0]+=n[0]-r[0],this.center[1]+=n[1]-r[1]}framePage(e){e&&(this.resize(),this.center=[e.worldX+e.widthMm/2,e.worldY+e.heightMm/2],this.scale=Math.max(e.widthMm/Math.max(1,this.canvas.width*.88),e.heightMm/Math.max(1,this.canvas.height*.84)))}frameWorld(){this.resize(),this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/Math.max(1,this.canvas.width*.9),(this.world.maxY-this.world.minY)/Math.max(1,this.canvas.height*.88),.05)}};function Qp(t){return t.thumbnail?.path||t.svg}function Zp(t){if(t.schema==="prism.schematic_vector_a0.features"){let e=new Map((t.features||[]).map(s=>[Number(s.id),s])),a={};for(let[s,n]of Object.entries(t.pages||{}))a[s]=n.map(r=>e.get(Number(r))).filter(Boolean);return a}return t.pages||{}}function em(t){let e=[],a=[],s=[];for(let n of t){let r=Number(n.featureId||0);if(!r)continue;if(n.kind==="plotimage"&&n.image?.path){let g=n.xMm||0,x=n.yMm||0,M=n.widthMm||0,T=n.heightMm||0;s.push({featureId:r,kind:n.kind,xMm:g,yMm:x,widthMm:M,heightMm:T,bounds:[g,x,g+M,x+T],path:n.image.path});continue}let i=String(n.semanticRole||""),o=n.radiusMm||n.diameterMm/2||0,c=String(n.fill||"").toUpperCase()==="FILLED_SHAPE",d=n.widthMm||n.pen_widthMm||(i==="junction"?.08:.15),h=String(n.lineStyle||n.line_style||"DEFAULT").toUpperCase(),u=n.color||n.strokeColor||n.style?.color||"",m=n.fillColor||n.color||n.style?.color||"",p=(g,x)=>im(e,{featureId:r,kind:n.kind,widthMm:d,lineStyle:h,color:u},g,x),f=n.x1Mm,l=n.y1Mm,y=n.x2Mm,b=n.y2Mm;if(n.trianglesMm?.length){for(let g of n.trianglesMm)Array.isArray(g)&&g.length===3&&a.push({featureId:r,kind:n.kind,color:m,points:g,bounds:Hc(g)});if(n.pointsMm?.length>=2){for(let g=1;g<n.pointsMm.length;g+=1)p(n.pointsMm[g-1],n.pointsMm[g]);Gc(n)&&p(n.pointsMm[n.pointsMm.length-1],n.pointsMm[0])}}else if(n.pointsMm?.length>=2){c&&n.pointsMm.length>=3&&rm(a,r,n.kind,n.pointsMm,m);for(let g=1;g<n.pointsMm.length;g+=1)p(n.pointsMm[g-1],n.pointsMm[g]);Gc(n)&&p(n.pointsMm[n.pointsMm.length-1],n.pointsMm[0])}else if(n.polylinesMm?.length){for(let g of n.polylinesMm)if(!(!Array.isArray(g)||g.length<2))for(let x=1;x<g.length;x+=1)p(g[x-1],g[x])}else if(Number.isFinite(f)&&Number.isFinite(l)&&Number.isFinite(y)&&Number.isFinite(b))n.kind==="rect"?(c&&sm(a,r,n.kind,[f,l,y,b],m),p([f,l],[y,l]),p([y,l],[y,b]),p([y,b],[f,b]),p([f,b],[f,l])):p([f,l],[y,b]);else if(Number.isFinite(n.cxMm)&&Number.isFinite(n.cyMm)){let g=n.radiusMm||n.diameterMm/2||.4;c&&nm(a,r,n.kind,[n.cxMm,n.cyMm],g,m),om(e,{featureId:r,kind:n.kind,widthMm:d,lineStyle:h,color:u},[n.cxMm,n.cyMm],g)}else if(n.contoursMm?.length){for(let g of n.contoursMm)if(!(!Array.isArray(g)||g.length<2)){for(let x=1;x<g.length;x+=1)p(g[x-1],g[x]);p(g[g.length-1],g[0])}}else if(Number.isFinite(n.start_xMm)&&Number.isFinite(n.start_yMm)&&Number.isFinite(n.end_xMm)&&Number.isFinite(n.end_yMm))Number.isFinite(n.mid_xMm)&&Number.isFinite(n.mid_yMm)?(p([n.start_xMm,n.start_yMm],[n.mid_xMm,n.mid_yMm]),p([n.mid_xMm,n.mid_yMm],[n.end_xMm,n.end_yMm])):p([n.start_xMm,n.start_yMm],[n.end_xMm,n.end_yMm]);else if(Number.isFinite(n.start_xMm)&&Number.isFinite(n.start_yMm)&&Number.isFinite(n.mid_xMm)&&Number.isFinite(n.mid_yMm)&&Number.isFinite(n.end_xMm)&&Number.isFinite(n.end_yMm))p([n.start_xMm,n.start_yMm],[n.mid_xMm,n.mid_yMm]),p([n.mid_xMm,n.mid_yMm],[n.end_xMm,n.end_yMm]);else if(n.boundsMm&&n.kind!=="text"){let[g,x,M,T]=n.boundsMm;p([g,x],[M,x]),p([M,x],[M,T]),p([M,T],[g,T]),p([g,T],[g,x])}}return{segments:e,fills:a,images:s}}function tm(t,e){for(let a of e.segments||[])a.worldA=ma(t,a.a),a.worldB=ma(t,a.b);for(let a of e.fills||[])a.worldPoints=a.points.map(s=>ma(t,s));for(let a of e.images||[])a.worldOrigin=ma(t,[a.xMm,a.yMm]),a.worldSize=am(t,a.widthMm,a.heightMm)}function ma(t,e){return[t.worldX+e[0]/t.sourceWidthMm*t.widthMm,t.worldY+e[1]/t.sourceHeightMm*t.heightMm]}function am(t,e,a){return[e/t.sourceWidthMm*t.widthMm,a/t.sourceHeightMm*t.heightMm]}function sm(t,e,a,s,n){let[r,i,o,c]=s;t.push({featureId:e,kind:a,color:n,points:[[r,i],[o,i],[r,c]],bounds:[r,i,o,c]},{featureId:e,kind:a,color:n,points:[[r,c],[o,i],[o,c]],bounds:[r,i,o,c]})}function nm(t,e,a,s,n,r){for(let o=0;o<36;o+=1){let c=o/36*Math.PI*2,d=(o+1)/36*Math.PI*2;t.push({featureId:e,kind:a,color:r,points:[s,[s[0]+Math.cos(c)*n,s[1]+Math.sin(c)*n],[s[0]+Math.cos(d)*n,s[1]+Math.sin(d)*n]],bounds:[s[0]-n,s[1]-n,s[0]+n,s[1]+n]})}}function rm(t,e,a,s,n){let r=s[0],i=Hc(s);for(let o=2;o<s.length;o+=1)t.push({featureId:e,kind:a,color:n,points:[r,s[o-1],s[o]],bounds:i})}function im(t,e,a,s){let n=Lc(a,s,e.widthMm||.15),r=e.lineStyle||"DEFAULT";if(!["DASH","DASHED","DOT","DOTTED","DASHDOT","DASH_DOT"].includes(r)){t.push({...e,a,b:s,bounds:n});return}let i=s[0]-a[0],o=s[1]-a[1],c=Math.hypot(i,o);if(c<1e-6)return;let d=i/c,h=o/c,u=Math.max(e.widthMm*4,.45),m=r.includes("DOT")?[u*.8,u*.75,u*3,u*.75]:[u*3,u*1.5],p=0,f=0;for(;p<c;){let l=Math.min(m[f%m.length],c-p);if(f%2===0){let y=[a[0]+d*p,a[1]+h*p],b=[a[0]+d*(p+l),a[1]+h*(p+l)];t.push({...e,a:y,b,bounds:Lc(y,b,e.widthMm||.15)})}p+=l,f+=1}}function om(t,e,a,s){for(let r=0;r<32;r+=1){let i=r/32*Math.PI*2,o=(r+1)/32*Math.PI*2;t.push({...e,a:[a[0]+Math.cos(i)*s,a[1]+Math.sin(i)*s],b:[a[0]+Math.cos(o)*s,a[1]+Math.sin(o)*s],bounds:[a[0]-s,a[1]-s,a[0]+s,a[1]+s]})}}function Hc(t,e=0){let a=1/0,s=1/0,n=-1/0,r=-1/0;for(let i of t||[])a=Math.min(a,i[0]),s=Math.min(s,i[1]),n=Math.max(n,i[0]),r=Math.max(r,i[1]);return Number.isFinite(a)?[a-e,s-e,n+e,r+e]:[0,0,0,0]}function Lc(t,e,a=0){let s=Math.max(.05,a*.5);return[Math.min(t[0],e[0])-s,Math.min(t[1],e[1])-s,Math.max(t[0],e[0])+s,Math.max(t[1],e[1])+s]}function dt(t,e){return!t||!e?!0:t[0]<=e[2]&&t[2]>=e[0]&&t[1]<=e[3]&&t[3]>=e[1]}function cm(t){let e={cellSize:Yp,cells:new Map,segments:t.segments||[],fills:t.fills||[],images:t.images||[],queryId:0};for(let a of e.segments)wr(e,"segments",a);for(let a of e.fills)wr(e,"fills",a);for(let a of e.images)wr(e,"images",a);return e}function wr(t,e,a){let s=a.bounds;if(!s)return;let n=Math.floor(s[0]/t.cellSize),r=Math.floor(s[2]/t.cellSize),i=Math.floor(s[1]/t.cellSize),o=Math.floor(s[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=n;d<=r;d+=1){let h=`${d}:${c}`,u=t.cells.get(h);u||(u={segments:[],fills:[],images:[]},t.cells.set(h,u)),u[e].push(a)}}function Uc(t,e){if(!t)return{segments:[],fills:[],images:[]};t.queryId=(t.queryId||0)+1;let a=t.queryId,s={segments:[],fills:[],images:[]},n=Math.floor(e[0]/t.cellSize),r=Math.floor(e[2]/t.cellSize),i=Math.floor(e[1]/t.cellSize),o=Math.floor(e[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=n;d<=r;d+=1){let h=t.cells.get(`${d}:${c}`);h&&(Mr(h.segments,s.segments,a,"segments"),Mr(h.fills,s.fills,a,"fills"),Mr(h.images,s.images,a,"images"))}return s}function Mr(t,e,a,s){let n=`_${s}QueryId`;for(let r of t)r[n]!==a&&(r[n]=a,e.push(r))}function Gc(t){let e=String(t.kind||"");if(String(t.fill||"").toUpperCase()==="FILLED_SHAPE"||t.closed===!0||["polygon","fill"].includes(e))return!0;let s=t.pointsMm||[];if(s.length>=3){let n=s[0],r=s[s.length-1];return Math.hypot(n[0]-r[0],n[1]-r[1])<1e-6}return!1}function Ga(t){return!!t?.netUid}function lm(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="pin"||e==="pin_body"||e==="label"||e==="global_label"||e==="hierarchical_label"||e==="netclass_flag"||e==="power_symbol"||e==="power_port"||a==="label"||a==="global_label"||a==="hierarchical_label"}function dm(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="global_label"||a==="global_label"?130:e==="hierarchical_label"||a==="hierarchical_label"?125:e==="label"||a==="label"?118:e==="pin"||e==="pin_body"?106:e==="power_symbol"||e==="power_port"||e==="netclass_flag"?98:50}function um(t){if(t.length<=Oc)return t;let e=t.slice(0,Oc);return e.sort((a,s)=>a.source[1]-s.source[1]||a.source[0]-s.source[0]),e}function fm(t,e,a={}){if(!t||!e?.length)return null;let s=a.featureId||a.stableKey||a.sourceId?e.find(d=>a.featureId&&Number(d.featureId||0)===Number(a.featureId)||a.stableKey&&d.stableKey===a.stableKey||a.sourceId&&d.sourceId===a.sourceId):null;if(s)return{...s,kind:"selected-net-occurrence",priority:200};let n=e.filter(d=>d.priority>=118).slice(0,16),r=n.length?n:e.slice(0,16),i=0,o=0;for(let d of r)i+=d.world[0],o+=d.world[1];let c=[i/r.length,o/r.length];return{pageId:t.id,featureId:r[0]?.featureId||0,kind:"page-net-occurrence",source:[0,0],world:c,bounds:[c[0],c[1],c[0],c[1]],priority:1}}function Kc(t,e,a){if(!t||t.length<2)return[];let s=t.map(i=>({...i})).sort((i,o)=>i.world[1]-o.world[1]||i.world[0]-o.world[0]),n=[],r=s.shift();for(;s.length;){let i=0,o=1/0;for(let d=0;d<s.length;d+=1){let h=s[d],u=Math.hypot(h.world[0]-r.world[0],h.world[1]-r.world[1]);u<o&&(o=u,i=d)}let c=s.splice(i,1)[0];n.push({type:e,pageId:a||r.pageId||c.pageId||"",a:r.world,b:c.world,sourceFeatureIds:[r.featureId,c.featureId].filter(Boolean)}),r=c}return n}function zc(t,e=0){return[Math.min(t.a[0],t.b[0])-e,Math.min(t.a[1],t.b[1])-e,Math.max(t.a[0],t.b[0])+e,Math.max(t.a[1],t.b[1])+e]}function La(t){let e=String(t?.kind||""),s=String(t?.semanticRole||"")||e;return s==="pin_number"||s==="pin_name"?120:s==="pin_body"||e==="pin"?110:s==="symbol_reference"||s==="symbol_value"?92:e==="junction"||e==="no_connect"?88:e==="wire"||e==="bus"||e==="bus_entry"?78:s==="symbol_body"||e==="symbol_body"?45:e==="symbol_instance"||e==="symbol_overplot"?30:e==="text"||String(s).includes("text")?24:10}function Ua(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");if(e==="page"||e==="sheet_header")return!0;if(e==="graphic_rect"&&a==="graphic_rect"&&!t?.netUid&&!t?.componentUid){let s=t.boundsMm||[];return s[2]-s[0]>150&&s[3]-s[1]>120}return!1}function hm(t){if(!t||typeof t!="string")return null;let a=t.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);if(!a)return null;let s=a[1],n=a[2]??"ff";return[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255,parseInt(n,16)/255]}function Tr(t,e,a=""){let s=hm(a||t?.color||"");return t?.kind==="dnp_marker"?s||[.86,.04,.05,.85]:t?.dnp&&["symbol_reference","symbol_value","symbol_text"].includes(String(t?.kind||""))?[.5,.52,.54,.56]:s||(t?.dnp?[.5,.52,.54,.56]:Ga(t)?[.12,.56,.2,.96]:t?.kind==="pin_name"?[0,.28,.31,.96]:t?.kind==="pin_number"?[.45,.17,.16,.96]:t?.kind==="pin_body"?[.28,.18,.18,.88]:t?.kind==="symbol_body"||t?.kind==="symbol_instance"?[.42,.18,.18,.72]:t?.kind==="symbol_reference"||t?.kind==="symbol_value"?[.05,.13,.16,.94]:t?.kind==="text"||String(e||"").startsWith("text")?[.05,.13,.16,.94]:[.16,.17,.19,.7])}function Vc(t,e,a=""){let s=Tr(t,e,a);return[s[0]*.72,s[1]*.72,s[2]*.72,Math.min(s[3],.38)]}function bm(t,e,a){return a?5.5:t?.kind==="dnp_marker"?3:["pin_name","pin_number"].includes(String(t?.kind||""))?1.5:t?.kind==="pin_body"?1.7:String(e||"").startsWith("text")?1.35:e==="bus"||t?.kind==="bus"?4.2:Ga(t)?2.6:t?.kind==="symbol_body"||t?.kind==="symbol_instance"||t?.kind==="sheet"?1.5:1.25}function Hs(t,e,a,s){return t[e++]=a[0],t[e++]=a[1],t[e++]=s[0],t[e++]=s[1],t[e++]=s[2],t[e++]=s[3],e}function pm(t,e,a,s,n,r){let i=qc(a,s,n);if(!i)return e;for(let o of i)e=Hs(t,e,o,r);return e}function mm(t,e,a,s,n,r){return e=Hs(t,e,a,r),e=Hs(t,e,s,r),e=Hs(t,e,n,r),e}function pa(t,e,a,s,n){return t[e++]=a[0],t[e++]=a[1],t[e++]=s,t[e++]=n,e}function gm(t,e,a,s,n,r,i,o){let c=s[0]-a[0],d=s[1]-a[1],h=Math.hypot(c,d);if(h<1e-6||e+24>t.length)return e;let u=n*.5,m=c/h,f=-(d/h)*u,l=m*u,y=[a[0]+f,a[1]+l],b=[a[0]-f,a[1]-l],g=[s[0]+f,s[1]+l],x=[s[0]-f,s[1]-l],M=i+h/Math.max(o,1e-6);return e=pa(t,e,y,i,r),e=pa(t,e,b,i,r),e=pa(t,e,g,M,r),e=pa(t,e,g,M,r),e=pa(t,e,b,i,r),e=pa(t,e,x,M,r),e}function qc(t,e,a){let s=e[0]-t[0],n=e[1]-t[1],r=Math.hypot(s,n);if(r<1e-6)return null;let i=a*.5,o=s/r*i,c=n/r*i,d=-n/r*i,h=s/r*i,u=[t[0]-o,t[1]-c],m=[e[0]+o,e[1]+c],p=[u[0]+d,u[1]+h],f=[u[0]-d,u[1]-h],l=[m[0]+d,m[1]+h],y=[m[0]-d,m[1]-h];return[p,f,l,l,f,y]}function ym(t,e,a){let s=a[0]-e[0],n=a[1]-e[1],r=s*s+n*n||1,i=re(((t[0]-e[0])*s+(t[1]-e[1])*n)/r,0,1),o=e[0]+s*i,c=e[1]+n*i;return Math.hypot(t[0]-o,t[1]-c)}function xm(t,e){let[a,s,n,r]=e,[i,o]=t.a,[c,d]=t.b,h=1e-6,u=(m,p)=>({...t,a:m,b:p});if(Math.abs(o-d)<=h){let m=o;if(m<s-h||m>r+h)return[t];let p=Math.min(i,c),f=Math.max(i,c),l=Math.max(p,a),y=Math.min(f,n);if(y<=l+h)return[t];let b=[],g=i<=c;if(p<l-h){let x=g?[p,m]:[l,m],M=g?[l,m]:[p,m];b.push(u(x,M))}if(y<f-h){let x=g?[y,m]:[f,m],M=g?[f,m]:[y,m];b.push(u(x,M))}return b}if(Math.abs(i-c)<=h){let m=i;if(m<a-h||m>n+h)return[t];let p=Math.min(o,d),f=Math.max(o,d),l=Math.max(p,s),y=Math.min(f,r);if(y<=l+h)return[t];let b=[],g=o<=d;if(p<l-h){let x=g?[m,p]:[m,l],M=g?[m,l]:[m,p];b.push(u(x,M))}if(y<f-h){let x=g?[m,y]:[m,f],M=g?[m,f]:[m,y];b.push(u(x,M))}return b}return[t]}function qs(t,e,a,s){let n=e*12;t.setFloat32(n,a[0],!0),t.setFloat32(n+4,a[1],!0),t.setUint32(n+8,s,!0)}function vm(t,e,a,s,n,r){let i=qc(a,s,n);if(!i)return e;for(let o of i)qs(t,e,o,r),e+=1;return e}function Er(t,e,a,s,n,r){return qs(t,e,a,r),qs(t,e+1,s,r),qs(t,e+2,n,r),e+3}function wm(t,e){let a=Array.isArray(t?.layerIds)?t.layerIds:[];if(a.length<2&&t?.startLayerId!=null&&t?.endLayerId!=null&&(a=[t.startLayerId,t.endLayerId]),a.length<2&&t?.layerMask!=null)try{let s=BigInt(String(t.layerMask));a=e.filter((n,r)=>(s&1n<<BigInt(r))!==0n).map(n=>n.id)}catch{a=[]}return a}function Mm(t){let e=t?.objectFeatureId??t?.id;if(e!=null&&Number.isFinite(Number(e))&&Number(e)!==0)return`feature:${Number(e)}`;let a=String(t?.sourceUid||"");return a?`source:${a}`:""}function Xc(t,e){let a=new Map(t.map((o,c)=>[Number(o.id),c])),s=new Map(t.map(o=>[Number(o.id),o])),n=new Map,r=new Set,i={thru:0,blind:0,buried:0};for(let o of e){let c=Mm(o);if(c){if(r.has(c))continue;r.add(c)}let d=[...new Set(wm(o,t).map(Number))].filter(x=>a.has(x)).sort((x,M)=>a.get(x)-a.get(M));if(d.length<2)continue;let h=d[0],u=d[d.length-1],m=a.get(h),p=a.get(u),f=m===0,l=p===t.length-1,y=f&&l?"thru":f||l?"blind":"buried";i[y]+=1;let b=`${h}:${u}:${y}`,g=n.get(b);if(g){g.count+=1;continue}n.set(b,{startId:h,endId:u,startName:s.get(h)?.name||String(h),endName:s.get(u)?.name||String(u),startIndex:m,endIndex:p,type:y,count:1})}return{counts:i,spans:[...n.values()]}}var Ka="http://www.w3.org/2000/svg";var Em=new Set(["script","foreignobject","iframe","object","embed"]),Tm=new Set(["href","xlink:href"]),km=1,Im=18,Sm=8,Ys=class t{static create(e,a,s,n,r={}){return new t(e,a,s,n,r)}constructor(e,a,s,n,r){this.host=e,this.manifestUrl=a,this.manifest=s,this.featuresByPage=n||{},this.callbacks=r,this.activePage=null,this.activeSvgUrl="",this.container=null,this.svg=null,this.overlay=null,this.mountedPages=new Map,this.loadingPages=new Map,this.svgCache=new Map,this.serial=0,this.maxMountedWorldPages=km,this.maxCachedSvgPages=Im,this.worldHandlersInstalled=!1,this.worldDrag=null,this.view={scale:1,tx:0,ty:0},this.drag=null,this.selected=null,this.highlightedNetUid="",this.index=Jc(),this.lastStats={mountedPages:0,domNodes:0,indexedFeatures:0,indexedNets:0,mountMs:0,coldMounts:0,warmMounts:0,highlightMs:0,selectionMs:0,cachedSvgPages:0,cachedSvgBytes:0,heapMb:null,fallbackReason:""}}get active(){return!!(this.container&&this.activePage)}get worldActive(){return this.mountedPages.size>0}stats(){return{...this.lastStats,activePage:this.activePage?.name||[...this.mountedPages.values()][0]?.page?.name||"-",mountedPages:this.active?1:this.mountedPages.size}}dispose(){this.unmountPage(),this.unmountWorldPages()}unmountPage(){this.container?.remove(),this.container=null,this.svg=null,this.overlay=null,this.activePage=null,this.activeSvgUrl="",this.index=Jc(),this.host.hidden=!0}unmountWorldPages(){for(let e of this.mountedPages.values())e.container.remove();this.mountedPages.clear(),this.loadingPages.clear(),this.active||(this.host.hidden=!0)}async preloadPages(e){let a=performance.now(),s=await Promise.allSettled((e||[]).slice(0,Sm).map(n=>this.loadSvgTemplate(n)));this.lastStats.preloadedPages=s.filter(n=>n.status==="fulfilled"&&n.value).length,this.lastStats.preloadMs=performance.now()-a,this.updateCacheStats()}syncWorldPages(e,a,s={}){if(!a)return;this.installWorldHandlers(a);let n=(e||[]).slice(0,s.maxMountedPages||this.maxMountedWorldPages),r=new Set(n.map(i=>i.id));for(let[i,o]of this.mountedPages)r.has(i)||(o.container.remove(),this.mountedPages.delete(i));for(let i of n){let o=this.mountedPages.get(i.id);if(o)o.lastUsed=++this.serial,this.positionWorldEntry(o,a);else if(!this.loadingPages.has(i.id)){let c=this.mountWorldPage(i).then(d=>{d&&r.has(i.id)?this.positionWorldEntry(d,a):d?.container.remove()}).finally(()=>this.loadingPages.delete(i.id));this.loadingPages.set(i.id,c)}}this.pruneMountedWorldPages(r),this.host.hidden=n.length===0&&!this.active,this.setSelection(this.selected),this.setHighlightedNet(s.activeNetUid??this.highlightedNetUid),this.lastStats.mountedPages=this.mountedPages.size,this.updateCacheStats()}async mountWorldPage(e){let a=performance.now(),s=this.hasCachedSvg(e),n=await this.loadImportedSvg(e);if(!n)return null;let r=document.createElement("div");r.className="svg-dom-page svg-dom-world-page",r.dataset.pageId=e.id,r.append(n),this.host.append(r);let i=$c(n),o=Yc(n),c=Wc(n,e,this.featuresByPage[e.id]||[]),d={page:e,container:r,svg:n,overlay:i,selectionOverlay:o,index:c,mountMs:performance.now()-a,lastUsed:++this.serial,warm:s};return this.mountedPages.set(e.id,d),this.lastStats={...this.lastStats,mountedPages:this.mountedPages.size,domNodes:[...this.mountedPages.values()].reduce((h,u)=>h+u.svg.querySelectorAll("*").length,0),indexedFeatures:[...this.mountedPages.values()].reduce((h,u)=>h+u.index.featureToElements.size,0),indexedNets:new Set([...this.mountedPages.values()].flatMap(h=>[...h.index.netToElements.keys()])).size,mountMs:d.mountMs,coldMounts:this.lastStats.coldMounts+(d.warm?0:1),warmMounts:this.lastStats.warmMounts+(d.warm?1:0),fallbackReason:""},this.updateCacheStats(),d}async loadImportedSvg(e){let a=await this.loadSvgTemplate(e);return a?a.cloneNode(!0):null}async loadSvgTemplate(e){let a=this.svgUrlForPage(e),s=this.svgCache.get(a);if(s?.template)return s.lastUsed=++this.serial,s.template;if(s?.promise)return s.promise;let n=performance.now(),r=(async()=>{let i=await fetch(a,{cache:"default"});if(!i.ok)return this.lastStats.fallbackReason=`Failed to load SVG page ${e.id}: ${i.status}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;let o=await i.text(),d=new DOMParser().parseFromString(o,"image/svg+xml"),h=d.documentElement;if(!h||h.localName.toLowerCase()!=="svg"||d.querySelector("parsererror"))return this.lastStats.fallbackReason=`Invalid SVG for page ${e.id}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;Rm(d,a,e.id);let u=document.importNode(h,!0);u.classList.add("svg-dom-page-svg"),Bm(u);let m=this.svgCache.get(a)||{};return Object.assign(m,{template:u,promise:null,pageId:e.id,byteLength:o.length*2,loadMs:performance.now()-n,lastUsed:++this.serial}),this.svgCache.set(a,m),this.pruneSvgCache(),this.updateCacheStats(),u})();return this.svgCache.set(a,{promise:r,pageId:e.id,byteLength:0,loadMs:0,lastUsed:++this.serial}),r}svgUrlForPage(e){return new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString()}positionWorldEntry(e,a){let{page:s,container:n}=e,[r,i]=a.worldToScreen(s.worldX,s.worldY),[o,c]=a.worldToScreen(s.worldX+s.widthMm,s.worldY+s.heightMm),d=Math.max(1,o-r),h=Math.max(1,c-i);n.style.transform=`translate3d(${r}px, ${i}px, 0)`,n.style.width=`${d}px`,n.style.height=`${h}px`}installWorldHandlers(e){if(this.worldHandlersInstalled)return;this.worldHandlersInstalled=!0;let a=this.host;a.oncontextmenu=s=>s.preventDefault(),a.onpointerdown=s=>{let n=s.button===0&&!s.shiftKey&&!!s.target.closest?.("text"),i=s.target.closest?.("[data-feature-key]")?null:this.featureAtEvent(s);this.worldDrag={pointerId:s.pointerId,startX:s.clientX,startY:s.clientY,lastX:s.clientX,lastY:s.clientY,button:s.button,moved:!1,pan:!n&&(s.button===0||s.button===1||s.shiftKey),allowTextSelection:n},n||a.setPointerCapture(s.pointerId)},a.onpointermove=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let n=s.clientX-this.worldDrag.lastX,r=s.clientY-this.worldDrag.lastY;this.worldDrag.lastX=s.clientX,this.worldDrag.lastY=s.clientY,Math.hypot(s.clientX-this.worldDrag.startX,s.clientY-this.worldDrag.startY)>3&&(this.worldDrag.moved=!0),this.worldDrag.pan&&e.pan(n,r)},a.onpointerup=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let n=this.worldDrag;if(this.worldDrag=null,n.allowTextSelection||a.releasePointerCapture(s.pointerId),n.button!==0||n.moved)return;let r=s.target.closest?.("[data-feature-key]");if(r)this.selectElement(r,s);else{let i=this.featureAtEvent(s);i?this.selectFeature(i.entry,i.feature,s):this.callbacks.onBlank?.()}},a.ondblclick=s=>{let n=s.target.closest?.("[data-feature-key]"),r=n?null:this.featureAtEvent(s),i=r?.entry||this.entryForPoint(s.clientX,s.clientY),o=n?this.selectionFromElement(n):r?this.selectionFromFeature(r.entry,r.feature):this.selected;Qc(o)?this.callbacks.onOpenPage?.(o):o?.netUid?this.callbacks.onHighlightNet?.(o.netUid,o):!r&&i?.page&&this.callbacks.onOpenPage?.({kind:"page",pageId:i.page.id,page:i.page})},a.onwheel=s=>{s.preventDefault(),Math.abs(s.deltaX)>Math.abs(s.deltaY)*.65?e.pan(-s.deltaX,-s.deltaY):e.zoom(s.deltaY,s.clientX,s.clientY)}}async focusPage(e,a={}){if(!e)return!1;if(this.activePage?.id===e.id&&this.active)return a.frame!==!1&&this.fitPage(),!0;let s=performance.now(),n=await this.loadImportedSvg(e);if(!n)return!1;let r=document.createElement("div");return r.className="svg-dom-page",r.append(n),this.host.replaceChildren(r),this.host.hidden=!1,this.container=r,this.svg=n,this.activePage=e,this.activeSvgUrl=new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString(),this.overlay=$c(n),this.selectionOverlay=Yc(n),this.index=Wc(n,e,this.featuresByPage[e.id]||[]),this.installPageHandlers(),this.fitPage(),this.setSelection(this.selected),this.setHighlightedNet(this.highlightedNetUid),this.lastStats={...this.lastStats,mountedPages:1,domNodes:n.querySelectorAll("*").length,indexedFeatures:this.index.featureToElements.size,indexedNets:this.index.netToElements.size,mountMs:performance.now()-s,fallbackReason:""},this.updateCacheStats(),!0}installPageHandlers(){let e=this.host;e.oncontextmenu=a=>a.preventDefault(),e.onpointerdown=a=>{if(!this.active)return;let s=a.button===0&&!a.shiftKey&&!!a.target.closest?.("text"),n=a.target.closest?.("[data-feature-key]"),r=n?null:this.featureAtEvent(a);this.drag={pointerId:a.pointerId,startX:a.clientX,startY:a.clientY,lastX:a.clientX,lastY:a.clientY,button:a.button,moved:!1,pan:!s&&(a.button===0||a.button===1||a.shiftKey),featureElement:n,allowTextSelection:s},s||e.setPointerCapture(a.pointerId)},e.onpointermove=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=a.clientX-this.drag.lastX,n=a.clientY-this.drag.lastY;this.drag.lastX=a.clientX,this.drag.lastY=a.clientY,Math.hypot(a.clientX-this.drag.startX,a.clientY-this.drag.startY)>3&&(this.drag.moved=!0),this.drag.pan&&(this.view.tx+=s,this.view.ty+=n,this.applyTransform())},e.onpointerup=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=this.drag;if(this.drag=null,s.allowTextSelection||e.releasePointerCapture(a.pointerId),s.button!==0||s.moved)return;let n=a.target.closest?.("[data-feature-key]");if(n)this.selectElement(n,a);else{let r=this.featureAtEvent(a);r?this.selectFeature(r.entry,r.feature,a):this.callbacks.onBlank?.()}},e.ondblclick=a=>{let s=a.target.closest?.("[data-feature-key]"),n=s?null:this.featureAtEvent(a),r=s?this.selectionFromElement(s):n?this.selectionFromFeature(n.entry,n.feature):this.selected;Qc(r)?this.callbacks.onOpenPage?.(r):r?.netUid?this.callbacks.onHighlightNet?.(r.netUid,r):!n&&this.activePage&&this.callbacks.onOpenPage?.({kind:"page",pageId:this.activePage.id,page:this.activePage})},e.onwheel=a=>{if(a.preventDefault(),!this.active)return;if(Math.abs(a.deltaX)>Math.abs(a.deltaY)*.65){this.view.tx-=a.deltaX,this.view.ty-=a.deltaY,this.applyTransform();return}let s=this.host.getBoundingClientRect(),n=a.clientX-s.left,r=a.clientY-s.top,i=this.screenToSvg(n,r),o=Math.exp(-a.deltaY*.0016);this.view.scale=Ws(this.view.scale*o,.02,80),this.view.tx=n-i[0]*this.view.scale,this.view.ty=r-i[1]*this.view.scale,this.applyTransform()}}selectElement(e,a){let s=performance.now(),n=this.selectionFromElement(e);if(this.setSelection(n),a){let r=this.host.getBoundingClientRect();n.anchor={x:a.clientX-r.left,y:a.clientY-r.top}}this.callbacks.onSelect?.(n),this.lastStats.selectionMs=performance.now()-s}selectFeature(e,a,s){let n=performance.now(),r=this.selectionFromFeature(e,a);if(this.setSelection(r),s){let i=this.host.getBoundingClientRect();r.anchor={x:s.clientX-i.left,y:s.clientY-i.top}}this.callbacks.onSelect?.(r),this.lastStats.selectionMs=performance.now()-n}selectionFromElement(e){let a=e.dataset.featureKey||"",s=this.entryForElement(e),n=s.index.featureByKey.get(a)||{};return this.selectionFromFeature(s,n,e)}selectionFromFeature(e,a,s=null){let n=a?.stableKey||s?.dataset?.featureKey||"",r=e?.page||this.activePage,i=a?.kind||s?.dataset?.role||s?.dataset?.primitive||"feature",o=a?.netUid||s?.dataset?.netUid||"",c=a?.netName||s?.dataset?.netName||"";return i==="sheet"?{kind:"sheet",featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",sheetName:a?.sheet_name||a?.sheetName||s?.dataset?.sheetName||a?.objectId||"",sheetFile:a?.sheet_file||a?.sheetFile||s?.dataset?.sheetFile||"",feature:a}:i==="pin"||i==="pin_body"||i==="pin_name"||i==="pin_number"||s?.dataset?.pin?{kind:"pin",featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",pinNumber:a?.pinNumber||s?.dataset?.pin||"",pinName:a?.pinName||"",netUid:o,netName:c,feature:a}:i==="symbol_body"||i==="symbol_instance"||i==="component"||s?.dataset?.ref?{kind:"component",featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",netUid:o,netName:c,feature:a}:{kind:o?"feature":i,featureKey:n,sheetInstancePath:a?.sheetInstancePath||r?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",role:i,netUid:o,netName:c,feature:a}}setSelection(e){this.selected=e||null;for(let s of this.host.querySelectorAll(".prism-svg-selected"))s.classList.remove("prism-svg-selected");for(let s of this.host.querySelectorAll("[data-prism-overlay='selection']"))s.replaceChildren();let a=e?.featureKey||"";if(a){for(let s of this.entries()){for(let n of s.index.featureToElements.get(a)||[])n.classList.add("prism-svg-selected");this.drawSelectionOverlay(s,e)}for(let s of this.index.featureToElements.get(a)||[])s.classList.add("prism-svg-selected");this.drawSelectionOverlay({page:this.activePage,index:this.index,selectionOverlay:this.selectionOverlay},e)}}setHighlightedNet(e){this.highlightedNetUid=e||"";let a=performance.now();for(let s of this.entries())this.updateEntryHighlight(s);if(!this.svg||!this.overlay){this.lastStats.highlightMs=performance.now()-a;return}this.updateEntryHighlight({svg:this.svg,overlay:this.overlay,index:this.index,page:this.activePage}),this.lastStats.highlightMs=performance.now()-a}updateEntryHighlight(e){if(!e?.svg||!e?.overlay||(e.overlay.replaceChildren(),!this.highlightedNetUid))return;let a=$s(e.svg,e.page),s=document.createElementNS(Ka,"rect");s.setAttribute("x",String(a[0])),s.setAttribute("y",String(a[1])),s.setAttribute("width",String(a[2])),s.setAttribute("height",String(a[3])),s.setAttribute("class","prism-svg-net-dimmer"),e.overlay.append(s);let r=(e.index.netToElements.get(this.highlightedNetUid)||[]).slice(0,2200);for(let i of r){let o=jm(i);e.overlay.append(o)}}entries(){return[...this.mountedPages.values()]}entryForElement(e){let s=e.closest?.(".svg-dom-page")?.dataset.pageId||"";return this.mountedPages.get(s)||{page:this.activePage,index:this.index,svg:this.svg,overlay:this.overlay,selectionOverlay:this.selectionOverlay}}featureAtEvent(e){let a=this.entryForPoint(e.clientX,e.clientY);if(!a)return null;let s=this.clientToSvg(a,e.clientX,e.clientY);if(!s)return null;let n=Math.max(.18,5*Om(a)),i=a.index.features.filter(o=>(o?.domBoundsMm||o?.boundsMm)&&tl(o)).filter(o=>s[0]>=(o.domBoundsMm||o.boundsMm)[0]-n&&s[0]<=(o.domBoundsMm||o.boundsMm)[2]+n&&s[1]>=(o.domBoundsMm||o.boundsMm)[1]-n&&s[1]<=(o.domBoundsMm||o.boundsMm)[3]+n).map(o=>({feature:o,priority:Lm(o),area:Math.max(1e-4,((o.domBoundsMm||o.boundsMm)[2]-(o.domBoundsMm||o.boundsMm)[0])*((o.domBoundsMm||o.boundsMm)[3]-(o.domBoundsMm||o.boundsMm)[1]))})).sort((o,c)=>c.priority-o.priority||o.area-c.area)[0]?.feature;return i?{entry:a,feature:i,point:s}:null}entryForPoint(e,a){for(let s of[...this.entries()].reverse()){let n=s.container.getBoundingClientRect();if(e>=n.left&&e<=n.right&&a>=n.top&&a<=n.bottom)return s}if(this.container){let s=this.container.getBoundingClientRect();if(e>=s.left&&e<=s.right&&a>=s.top&&a<=s.bottom)return{page:this.activePage,container:this.container,svg:this.svg,index:this.index,selectionOverlay:this.selectionOverlay}}return null}clientToSvg(e,a,s){if(!e?.container||!e?.svg||!e?.page)return null;let n=e.container.getBoundingClientRect();if(!n.width||!n.height)return null;let r=$s(e.svg,e.page);return[r[0]+(a-n.left)/n.width*r[2],r[1]+(s-n.top)/n.height*r[3]]}drawSelectionOverlay(e,a){if(!e?.selectionOverlay||!a?.featureKey)return;let s=e.index.featureByKey.get(a.featureKey),n=s?.domBoundsMm||s?.boundsMm;if(!n)return;let[r,i,o,c]=n,d=document.createElementNS(Ka,"rect");d.setAttribute("x",String(r)),d.setAttribute("y",String(i)),d.setAttribute("width",String(Math.max(.001,o-r))),d.setAttribute("height",String(Math.max(.001,c-i))),d.setAttribute("rx","0.65"),d.setAttribute("ry","0.65"),d.setAttribute("class","prism-svg-selection-box"),e.selectionOverlay.append(d)}fitPage(){if(!this.svg||!this.activePage)return;let e=$s(this.svg,this.activePage),a=e[2]||this.activePage.sourceWidthMm||this.activePage.widthMm||1,s=e[3]||this.activePage.sourceHeightMm||this.activePage.heightMm||1,n=this.host.getBoundingClientRect(),r=Math.min(n.width/a,n.height/s)*.92;this.view.scale=Ws(r,.02,80),this.view.tx=(n.width-a*this.view.scale)/2-e[0]*this.view.scale,this.view.ty=(n.height-s*this.view.scale)/2-e[1]*this.view.scale,this.applyTransform()}frameSelection(e=this.selected){if(!e?.featureKey||!this.active){this.fitPage();return}let a=this.index.featureToElements.get(e.featureKey)||[],s=el(a);if(!s)return;let n=this.host.getBoundingClientRect(),r=Math.max(1,s[2]-s[0]),i=Math.max(1,s[3]-s[1]),o=Math.min(n.width/r,n.height/i)*.36;this.view.scale=Ws(o,.04,80),this.view.tx=n.width/2-(s[0]+s[2])/2*this.view.scale,this.view.ty=n.height/2-(s[1]+s[3])/2*this.view.scale,this.applyTransform()}pan(e,a){this.active&&(this.view.tx+=e,this.view.ty+=a,this.applyTransform())}zoom(e,a,s){if(!this.active)return;let n=this.host.getBoundingClientRect(),r=(a??n.left+n.width/2)-n.left,i=(s??n.top+n.height/2)-n.top,o=this.screenToSvg(r,i),c=Math.exp(-e*.0016);this.view.scale=Ws(this.view.scale*c,.02,80),this.view.tx=r-o[0]*this.view.scale,this.view.ty=i-o[1]*this.view.scale,this.applyTransform()}screenToSvg(e,a){return[(e-this.view.tx)/Math.max(1e-6,this.view.scale),(a-this.view.ty)/Math.max(1e-6,this.view.scale)]}applyTransform(){this.container&&(this.container.style.transform=`translate3d(${this.view.tx}px, ${this.view.ty}px, 0) scale(${this.view.scale})`)}hasCachedSvg(e){return!!this.svgCache.get(this.svgUrlForPage(e))?.template}pruneMountedWorldPages(e=new Set){if(this.mountedPages.size<=this.maxMountedWorldPages)return;let a=[...this.mountedPages.entries()].filter(([s])=>!e.has(s)).sort((s,n)=>(s[1].lastUsed||0)-(n[1].lastUsed||0));for(let[s,n]of a){if(this.mountedPages.size<=this.maxMountedWorldPages)break;n.container.remove(),this.mountedPages.delete(s)}}pruneSvgCache(){let e=[...this.svgCache.entries()].filter(([,n])=>n?.template);if(e.length<=this.maxCachedSvgPages)return;let a=new Set([...this.mountedPages.values()].map(n=>this.svgUrlForPage(n.page)));this.activePage&&a.add(this.svgUrlForPage(this.activePage));let s=e.filter(([n])=>!a.has(n)).sort((n,r)=>(n[1].lastUsed||0)-(r[1].lastUsed||0));for(let[n]of s){if([...this.svgCache.values()].filter(r=>r?.template).length<=this.maxCachedSvgPages)break;this.svgCache.delete(n)}}updateCacheStats(){let e=[...this.svgCache.values()].filter(s=>s?.template);this.lastStats.cachedSvgPages=e.length,this.lastStats.cachedSvgBytes=e.reduce((s,n)=>s+(n.byteLength||0),0);let a=performance?.memory;this.lastStats.heapMb=a?.usedJSHeapSize?a.usedJSHeapSize/1048576:null}};function Rm(t,e,a){for(let r of[...t.querySelectorAll("*")]){if(Em.has(r.localName.toLowerCase())){r.remove();continue}for(let i of[...r.attributes]){let o=i.name,c=o.toLowerCase(),d=i.value||"";if(c.startsWith("on")){r.removeAttribute(o);continue}if((c==="href"||c==="xlink:href"||c==="src")&&al(d)){if((c==="href"||c==="xlink:href")&&r.localName.toLowerCase()==="image"&&Gm(d))continue;r.removeAttribute(o);continue}c==="style"&&r.setAttribute(o,zm(d))}}let s=`prism-${kr(a)}-`,n=new Map;for(let r of t.querySelectorAll("[id]")){let i=r.getAttribute("id"),o=`${s}${kr(i)}`;n.set(i,o),r.setAttribute("id",o)}for(let r of t.querySelectorAll("*"))for(let i of[...r.attributes]){let o=i.name.toLowerCase(),c=i.value||"";Tm.has(o)&&(c.startsWith("#")&&n.has(c.slice(1))?c=`#${n.get(c.slice(1))}`:Km(c)&&(c=new URL(c,e).toString())),c=Vm(c,n),r.setAttribute(i.name,c)}}function Wc(t,e,a){let s=new Map,n=new Map,r=new Map,i=[];for(let h of a){let u=Nm(h,e);i.push(u),n.set(u.stableKey,u),r.set(Number(u.id||0),u);for(let m of Cm(u))s.has(m)||s.set(m,[]),s.get(m).push(u)}let o=new Map,c=new Map,d=new Map;for(let h of i)d.set(h.stableKey,h);for(let h of t.querySelectorAll("[data-uuid], [data-element-key], [data-primitive], [data-ref], [data-pin], [data-object-id], [data-designator], [data-component]")){let u=Am(h,s,e);if(u&&!tl(u)||!u&&!Um(h))continue;let m=Fm(h,e),p=u?.stableKey||m,f=u?.netUid||"",l=u?.netName||"";h.classList.add("prism-feature"),h.dataset.featureKey=p,h.dataset.sourceId=u?.sourceId||h.dataset.uuid||h.dataset.elementKey||"",h.dataset.role=u?.kind||h.dataset.primitive||h.dataset.ref||"feature",u?.id&&(h.dataset.featureId=String(u.id)),f&&(h.dataset.netUid=f),l&&(h.dataset.netName=l),h.id||(h.id=`prism-feature-${kr(p)}`),Zc(o,p,h),d.set(p,u||{id:0,stableKey:p,kind:h.dataset.role,sourceId:h.dataset.sourceId,sheetInstancePath:e.sheetInstancePath||""}),f&&Zc(c,f,h)}for(let[h,u]of o){let m=d.get(h),p=el(u);m&&p&&(m.domBoundsMm=Pm(m.boundsMm,p))}return{featureToElements:o,netToElements:c,featureByKey:d,byId:r,bySource:s,features:i}}function Am(t,e,a){let n=[t.dataset.uuid,t.dataset.elementKey,t.dataset.sourceId,t.dataset.objectId,t.dataset.componentUid,t.dataset.componentUuid,t.dataset.ref&&`${t.dataset.ref}:${t.dataset.pin||""}`].filter(Boolean).flatMap(i=>e.get(i)||[]);if(!n.length)return null;let r=String(t.dataset.primitive||t.dataset.ref||t.dataset.pin||"").toLowerCase();return n.map(i=>({feature:i,score:_m(i,r,a)})).sort((i,o)=>o.score-i.score)[0].feature}function _m(t,e,a){let s=0,n=String(t.kind||"").toLowerCase();return t.sheetInstancePath===a.sheetInstancePath&&(s+=20),t.netUid&&(s+=4),e&&n.includes(e)&&(s+=8),e==="symbol"&&n==="symbol_body"&&(s+=12),(e==="label"||e==="port")&&(n.includes("label")||n.includes("port"))&&(s+=12),e==="sheet"&&n==="sheet"&&(s+=12),n!=="record"&&(s+=2),n.includes("pin")&&(s+=2),s}function Nm(t,e){let a=t.sourceId||t.sourceUid||t.uuid||t.objectId||t.stableKey||"";return{...t,id:Number(t.id||0),sourceId:a,stableKey:t.stableKey||`${e.sheetInstancePath||e.id}|${a}|0|${t.kind||"feature"}|0`,sheetInstancePath:t.sheetInstancePath||e.sheetInstancePath||""}}function Cm(t){let e=new Set([t.sourceId,t.sourceUid,t.uuid,t.objectId,t.stableKey].filter(Boolean).map(String));return t.reference&&t.pinNumber&&e.add(`${t.reference}:${t.pinNumber}`),t.componentDesignator&&e.add(t.componentDesignator),t.reference&&e.add(t.reference),[...e]}function Fm(t,e){let a=t.dataset.uuid||t.dataset.elementKey||t.dataset.objectId||t.dataset.ref||t.id||"svg",s=t.dataset.primitive||t.dataset.role||t.localName||"feature";return`${e.sheetInstancePath||e.id}|${a}|0|${s}|0`}function Bm(t){let e=document.createElementNS(Ka,"style");e.textContent=`
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
  `,t.prepend(e)}function $c(t){let e=document.createElementNS(Ka,"g");return e.setAttribute("class","prism-svg-net-overlay"),e.setAttribute("data-prism-overlay","net-highlight"),t.append(e),e}function Yc(t){let e=document.createElementNS(Ka,"g");return e.setAttribute("class","prism-svg-selection-overlay"),e.setAttribute("data-prism-overlay","selection"),e.style.pointerEvents="none",t.append(e),e}function jm(t){let e=t.cloneNode(!0);e.removeAttribute("id"),e.removeAttribute("data-feature-key"),e.removeAttribute("data-net-uid"),e.removeAttribute("data-net-name"),e.classList.add("prism-svg-net-overlay-clone");for(let a of[e,...Array.from(e.querySelectorAll?.("*")||[])])a instanceof SVGElement&&(a.removeAttribute("filter"),a.style.pointerEvents="none",a.style.stroke="#18ef52",a.style.fill="none",a.style.opacity="0.98",a.style.vectorEffect="non-scaling-stroke");return e}function el(t){let e=null;for(let a of t)if(a.getBBox)try{let s=a.getBBox(),n=[s.x,s.y,s.x+s.width,s.y+s.height];e=e?[Math.min(e[0],n[0]),Math.min(e[1],n[1]),Math.max(e[2],n[2]),Math.max(e[3],n[3])]:n}catch{}return e}function Pm(t,e){return t?e?[Math.min(t[0],e[0]),Math.min(t[1],e[1]),Math.max(t[2],e[2]),Math.max(t[3],e[3])]:t:e}function $s(t,e){let a=t.getAttribute("viewBox");if(a){let s=a.trim().split(/[\s,]+/).map(Number);if(s.length===4&&s.every(Number.isFinite))return s}return[0,0,e.sourceWidthMm||e.widthMm||1,e.sourceHeightMm||e.heightMm||1]}function Jc(){return{featureToElements:new Map,netToElements:new Map,featureByKey:new Map,byId:new Map,bySource:new Map,features:[]}}function Om(t){let e=t?.container?.getBoundingClientRect?.();if(!t?.svg||!t?.page||!e?.width||!e?.height)return .1;let a=$s(t.svg,t.page);return Math.max(a[2]/e.width,a[3]/e.height)}function Dm(t){let e=String(t?.kind||"").toLowerCase(),a=String(t?.semanticRole||"").toLowerCase(),s=`${t?.sourceId||""} ${t?.objectId||""} ${t?.text||""}`.toLowerCase();return e.includes("page")||a.includes("page")||e.includes("background")||a.includes("background")||s.includes("background")||s.includes("sheet_header")||s.includes("sheet header")||s.includes("drawing-sheet")}function Lm(t){let e=String(t?.kind||t?.semanticRole||"").toLowerCase();return e.includes("pin")?90:e.includes("label")||e.includes("port")?78:e.includes("wire")||e.includes("bus")||e.includes("junction")?70:e.includes("symbol")||e.includes("component")?54:e.includes("image")?30:20}function tl(t){if(!t||Dm(t))return!1;let e=String(t.kind||t.semanticRole||"").toLowerCase();return["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function Um(t){let e=`${t?.dataset?.primitive||""} ${t?.dataset?.ref||""} ${t?.dataset?.role||""} ${t?.dataset?.objectId||""} ${t?.dataset?.text||""}`.toLowerCase();return!e||e.includes("background")||e.includes("sheet_header")||e.includes("sheet header")||e.includes("drawing-sheet")?!1:["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function Qc(t){return String(t?.kind||t?.feature?.kind||"").toLowerCase()==="sheet"}function Zc(t,e,a){t.has(e)||t.set(e,[]),t.get(e).push(a)}function al(t){let e=String(t||"").trim().toLowerCase();return!e||e.startsWith("#")?!1:e.startsWith("javascript:")||e.startsWith("data:")||e.startsWith("http://")||e.startsWith("https://")}function Gm(t){return/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(String(t||"").trim())}function Km(t){let e=String(t||"").trim();return e&&!e.startsWith("#")&&!/^[a-z][a-z0-9+.-]*:/i.test(e)}function zm(t){return String(t||"").replace(/url\(([^)]+)\)/gi,(e,a)=>{let s=a.trim().replace(/^['"]|['"]$/g,"");return al(s)?"none":e})}function Vm(t,e){let a=String(t||"");return a=a.replace(/url\(#([^)]+)\)/g,(s,n)=>e.has(n)?`url(#${e.get(n)})`:s),a=a.replace(/^#(.+)$/,(s,n)=>e.has(n)?`#${e.get(n)}`:s),a}function kr(t){return String(t||"").trim().replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,96)||"item"}function Ws(t,e,a){return Math.max(e,Math.min(a,t))}function Zt(t){return`${t.level||""}/${t.id}`}function sl(t){let e=t.ends||[],a=t.wires||[];return e.length<2?[]:e.length===2?[{key:`${e[0].id}~${e[1].id}`,a:e[0].id,b:e[1].id,wires:new Set(a.map(s=>s.id))}]:e.map(s=>({key:`hub~${s.id}`,a:"hub",b:s.id,wires:new Set(a.filter(n=>n.from===s.id||n.to===s.id).map(n=>n.id))}))}function Hm(t,e){return!e||e.harness!==t.id?!1:!t.level||!e.occurrence||e.occurrence.startsWith(`${t.level}/`)}function nl(t,e){let a=new Map;for(let s of t||[]){let n=new Map,r=new Set((s.wires||[]).map(i=>i.id));for(let i of e||[])for(let o of i.wires||[])r.has(o.wire)&&Hm(s,o)&&!n.has(o.wire)&&n.set(o.wire,i.color);n.size&&a.set(Zt(s),n)}return a}function rl(t,e){if(!e)return null;for(let a of t.wires)if(e.has(a))return e.get(a);return null}function il(t,e){let a=new Map;if(!e)return a;for(let s of t.wires||[]){let n=e.get(s.id);n&&(a.has(s.from)||a.set(s.from,n),a.has(s.to)||a.set(s.to,n))}return a}function ol(t){let e=t.filter(Boolean);return e.length<2?null:[0,1,2].map(a=>e.reduce((s,n)=>s+n[a],0)/e.length)}var ga="auto",qm=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];function Js(t,e){return t.level?e(t.level):qm}function Xm(t,e){return[0,1,2].map(a=>t[a]*e[0]+t[4+a]*e[1]+t[8+a]*e[2]+t[12+a])}function Ir(t,e){let a=[e[0]-t[12],e[1]-t[13],e[2]-t[14]];return[0,1,2].map(s=>t[s*4]*a[0]+t[s*4+1]*a[1]+t[s*4+2]*a[2])}function Sr(t,e,a){return e?t.map(s=>{if(a(s)!==e.harness)return s;let n=s.nodes??[],r=e.id===ga?[{id:ga,kind:"breakout",positionMm:e.positionMm,pinned:!1,order:-1,ends:[],between:null},...n]:n.map(i=>i.id===e.id?{...i,positionMm:e.positionMm}:i);return{...s,nodes:r}}):t}function cl(t,e,a){let s=(t.nodes??[]).map(r=>({id:r.id,kind:r.kind,pinned:!!r.pinned,worldMm:Xm(a,r.positionMm)})),n=e.find(r=>r.to===ga);return n&&s.push({id:ga,kind:"breakout",pinned:!1,auto:!0,worldMm:n.samplesMm.slice(-3)}),s}function Wm(t,e,a){let s=e[0]-t[0],n=e[1]-t[1],r=s*s+n*n,i=r>0?Math.max(0,Math.min(1,((a[0]-t[0])*s+(a[1]-t[1])*n)/r)):0;return{t:i,distance:Math.hypot(t[0]+i*s-a[0],t[1]+i*n-a[1])}}function ll(t,e,a,s,n=5){let r=null;return t.forEach((i,o)=>{let c=i.samplesMm,d=Math.floor(c.length/3),h=d?a([c[0],c[1],c[2]]):null;for(let u=0;u+1<d;u+=1){let m=[c[u*3+3],c[u*3+4],c[u*3+5]],p=a(m);if(h&&p){let{t:f,distance:l}=Wm(h,p,e),y=[0,1,2].map(g=>c[u*3+g]+f*(m[g]-c[u*3+g])),b=n+i.radiusMm*s(y);l<=b&&(!r||l<r.distancePx)&&(r={index:o,sample:u,t:f,pointMm:y,distancePx:l})}h=p}}),r}var ve={bootMm:10,housingDepthMm:8,breakoutLiftMm:10,chordErrorMm:.2,catmullRomAlpha:.5,minBendRadiusFactor:6,bendRelaxIterations:8,packingFactor:1.2,ringSegments:12,breakoutBlendMm:5,lengthAllowance:.1,lengthMismatchTolerance:.15,boardCollisionMarginMm:1,defaultGaugeAwg:"24"},Rr={24:1.143,22:1.3208,20:1.524,18:1.8034,16:2.0066,14:2.3622,12:2.8956,10:3.5306,8:5.0546,6:6.35,4:7.9248,2:9.8552,1:10.9474,0:12.1666,"00":13.8684};function dl(t){let e=t==null?null:String(t).trim().toUpperCase().replace(/AWG$/,"").trim();return e!==null&&e in Rr?{odMm:Rr[e],assumed:!1}:{odMm:Rr[ve.defaultGaugeAwg],assumed:!0}}var Qs=(Math.sqrt(5)-1)/2,$m=60;function Ym(t,e,a){let s=0;for(let n=0;n<3;n+=1){let r=t[n]<e[n]?e[n]-t[n]:t[n]>a[n]?t[n]-a[n]:0;s+=r*r}return s}function Jm(t,e,a,s){let n=p=>Ym([0,1,2].map(f=>t[f]+p*(e[f]-t[f])),a,s),r=0,i=1,o=i-Qs*(i-r),c=r+Qs*(i-r),d=n(o),h=n(c);for(let p=0;p<$m;p+=1)d<=h?([i,c,h]=[c,o,d],o=i-Qs*(i-r),d=n(o)):([r,o,d]=[o,c,h],c=r+Qs*(i-r),h=n(c));let[u,m]=d<=h?[o,d]:[c,h];for(let p of[0,1]){let f=n(p);f<m&&([u,m]=[p,f])}return[Math.sqrt(m),u]}function Qm(t,e){let a=[e[0]-t[12],e[1]-t[13],e[2]-t[14]];return[0,1,2].map(s=>t[s*4]*a[0]+t[s*4+1]*a[1]+t[s*4+2]*a[2])}function Zm(t,e){let[a,s]=[t[e],t[e+1]],n=0;for(let r=0;r<3;r+=1)n+=(s[r]-a[r])*(s[r]-a[r]);return Math.sqrt(n)}function ul(t,e){let a=t.length-1,s=0;for(let n=0;n<a;n+=1){let r=e?n:a-1-n;if(s>=ve.bootMm)return n;s+=Zm(t,r)}return a}function fl(t,e){let a=ve.boardCollisionMarginMm,s=e.map(r=>({board:r,lo:[0,1,2].map(i=>r.minMm[i]-a),hi:[0,1,2].map(i=>r.maxMm[i]+a)})),n=[];for(let r of t.curves){let i=r.diameterMm/2,o=r.samplesMm;if(i<=0||o.length<2)continue;let c=o.length-1,d=new Map,h=(p,f,l)=>{let y=d.get(p)??new Set;for(let b=f;b<l;b+=1)y.add(b);d.set(p,y)},u=t.ends[r.from];u&&h(u.occurrence,0,ul(o,!0));let m=t.ends[r.to];m&&h(m.occurrence,c-ul(o,!1),c);for(let{board:p,lo:f,hi:l}of s){let y=o.map(M=>Qm(p.matrix,M)),b=d.get(p.id),g=[],x=null;for(let M=0;M<c;M+=1){if(b?.has(M))continue;let[T,I]=Jm(y[M],y[M+1],f,l);T<i&&(g.push(M),(!x||T<x[0])&&(x=[T,M,I]))}if(x){let[M,T,I]=x,[S,R]=[o[T],o[T+1]];n.push({segmentId:r.segmentId,board:p.id,distanceMm:M,radiusMm:i,atMm:[0,1,2].map(A=>S[A]+I*(R[A]-S[A])),spans:g})}}}return n}var eg=/_vertical(_|$)/i,tg=/_(horizontal|rightangle|right_angle|angled)(_|$)|_RA(_|$)/i,bl=t=>t*Math.PI/180;function hl(t){let e=t.replace(/[0-9]+$/,""),a=t.slice(e.length);return[e,a?Number.parseInt(a,10):-1,t]}function ag(t,e){let[a,s,n]=hl(t),[r,i,o]=hl(e);return a!==r?a<r?-1:1:s!==i?s-i:n<o?-1:n>o?1:0}function _r(t,e){let a=bl(t.rotationDeg),s=e[0]-t.positionMm[0],n=e[1]-t.positionMm[1];return[s*Math.cos(a)+n*Math.sin(a),-s*Math.sin(a)+n*Math.cos(a)]}function pl(t,e){let a=bl(t.rotationDeg);return[e[0]*Math.cos(a)-e[1]*Math.sin(a),e[0]*Math.sin(a)+e[1]*Math.cos(a),0]}function sg(t){return new Set(t.pads.map(e=>`${e.positionMm[0]},${e.positionMm[1]}`)).size}function ml(t){let e=t.pads.filter(a=>a.pad);return e.length?e:t.pads}function gl(t){let e=ml(t),a=e.length;return[e.reduce((s,n)=>s+n.positionMm[0],0)/a,e.reduce((s,n)=>s+n.positionMm[1],0)/a]}function ng(t,e){let a=Math.atan2(e,t)*180/Math.PI,s=rg(a/90)*90;return Math.abs(a-s)>20?null:{0:"+x",90:"+y",180:"-x","-180":"-x","-90":"-y"}[String(s===0?0:s)]}function rg(t){let e=Math.floor(t),a=t-e;return a>.5?e+1:a<.5||e%2===0?e:e+1}function ig(t){let e=(l,y,...b)=>({axis:y==="low"?null:l,confidence:y,reasons:b});if(!t||sg(t)<2)return e(null,"low","too_few_pads");let a=t.side==="top"?"top":"bottom",s=t.footprintName??"",n=eg.test(s),r=tg.test(s),i=t.courtyard;if(!i)return n?e(a,"medium","name_vertical","no_courtyard"):e(null,"low","no_courtyard");let o=t.pads.map(l=>_r(t,l.positionMm)),c=o.map(([l])=>l),d=o.map(([,l])=>l),h=[c.reduce((l,y)=>l+y,0)/c.length,d.reduce((l,y)=>l+y,0)/d.length],u=[(i.minMm[0]+i.maxMm[0])/2,(i.minMm[1]+i.maxMm[1])/2],m=Math.min(...c)-1<=u[0]&&u[0]<=Math.max(...c)+1&&Math.min(...d)-1<=u[1]&&u[1]<=Math.max(...d)+1,p=[u[0]-h[0],u[1]-h[1]],f=!m&&Math.hypot(...p)>=.5?ng(...p):null;return n?m?e(a,"high","name_vertical","body_over_pads"):e(null,"low","name_vertical","name_conflicts_geometry"):r?f?e(f,"high","name_right_angle","body_off_pads"):e(null,"low","name_right_angle","name_conflicts_geometry"):m?e(a,"medium","body_over_pads"):f?e(f,"medium","body_off_pads"):e(null,"low","body_ambiguous")}function Zs(t){let e=Math.sqrt(t.reduce((a,s)=>a+s*s,0));return t.map(a=>a/e)}var og=(t,e)=>[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]],Ar=(t,e)=>t.reduce((a,s,n)=>a+s*e[n],0);function cg(t){let e=t.pads.filter(s=>s.pad),a=e.find(s=>s.pad==="1");return a||(e.length?[...e].sort((s,n)=>ag(s.pad,n.pad))[0]:t.pads[0])}function lg(t){let[e,a]=gl(t),s=ml(t),n=s.length,r=0,i=0,o=0;for(let p of s)r+=(p.positionMm[0]-e)**2,i+=(p.positionMm[1]-a)**2,o+=(p.positionMm[0]-e)*(p.positionMm[1]-a);r/=n,i/=n,o/=n;let c=(r+i)/2,d=r*i-o*o,h=Math.sqrt(Math.max(c*c-d,0)),u=c+h,m=c-h;return u<=1e-12||u-m<=.05*u?pl(t,[1,0]):Math.abs(o)>1e-12?Zs([u-i,o,0]):r>=i?[1,0,0]:[0,1,0]}function dg(t,e){if(e==="top")return[0,0,1];if(e==="bottom")return[0,0,-1];let a=e[0]==="-"?-1:1;return Zs(pl(t,e[1]==="x"?[a,0]:[0,a]))}function Nr(t,e,a){let[s,n,r]=t,[i,o,c]=e,[d,h,u]=a,m=s+o+u,p;if(m>0){let l=Math.sqrt(m+1)*2;p=[(c-h)/l,(d-r)/l,(n-i)/l,.25*l]}else if(s>o&&s>u){let l=Math.sqrt(1+s-o-u)*2;p=[.25*l,(i+n)/l,(d+r)/l,(c-h)/l]}else if(o>u){let l=Math.sqrt(1+o-s-u)*2;p=[(i+n)/l,.25*l,(h+c)/l,(d-r)/l]}else{let l=Math.sqrt(1+u-s-o)*2;p=[(d+r)/l,(h+c)/l,.25*l,(n-i)/l]}return p=Zs(p),([p[3],p[0],p[1],p[2]].find(l=>Math.abs(l)>1e-12)??1)<0?p.map(l=>-l):p}function za(t,e,a){if(!t||t.pads.length===0)return null;let s=a?a.axis:ig(t).axis;if(!s)return null;let n=a?((a.quarterTurns??0)%4+4)%4:0,[r,i]=gl(t),o=(e??0)/2,c=[r,i,t.side==="top"?o:-o],d=dg(t,s),h=lg(t),u=Ar(h,d),m=[h[0]-u*d[0],h[1]-u*d[1],h[2]-u*d[2]];Math.sqrt(Ar(m,m))<1e-9&&(m=[-d[1],d[0],0]),m=Zs(m);let p=cg(t).positionMm;Ar([p[0]-r,p[1]-i,0],m)>1e-9&&(m=m.map(l=>-l));let f=og(d,m);for(let l=0;l<n;l+=1)[m,f]=[f,m.map(y=>-y)];return{axis:s,quarterTurns:n,originMm:c,xAxis:m,yAxis:f,zAxis:d,rotation:Nr(m,f,d)}}function be(t){return Math.round(t*1e9)/1e9+0}function en(t){let e=Math.hypot(...t)||1,a=t.map(n=>n/e),s=[a[3],a[0],a[1],a[2]].find(n=>Math.abs(n)>1e-12)??1;return a.map(n=>be(s<0?-n:n))}function Va(t,e){let[a,s,n,r]=t,i=s*e[2]-n*e[1],o=n*e[0]-a*e[2],c=a*e[1]-s*e[0];return[e[0]+2*(r*i+s*c-n*o),e[1]+2*(r*o+n*i-a*c),e[2]+2*(r*c+a*o-s*i)]}function ug(t,e){let[a,s,n,r]=t,[i,o,c,d]=e;return[r*i+a*d+s*c-n*o,r*o-a*c+s*d+n*i,r*c+a*o-s*i+n*d,r*d-a*i-s*o-n*c]}function Lt(t,e){let a=Va(t.rotation,e.translationMm);return{translationMm:t.translationMm.map((s,n)=>be(s+a[n])),rotation:en(ug(t.rotation,e.rotation))}}function Cr(t){let[e,a,s,n]=t.rotation,[r,i,o]=t.translationMm;return[1-2*(a*a+s*s),2*(e*a+s*n),2*(e*s-a*n),0,2*(e*a-s*n),1-2*(e*e+s*s),2*(a*s+e*n),0,2*(e*s+a*n),2*(a*s-e*n),1-2*(e*e+a*a),0,r,i,o,1].map(be)}var yl=5;var tn=Math.SQRT1_2,Xw=[[0,0,0,1],[0,0,tn,tn],[0,0,1,0],[0,0,tn,-tn]];function fg(t,e){let a=[0,1,2].map(s=>e[s]-t.originMm[s]);return[t.xAxis,t.yAxis,t.zAxis].map(s=>a[0]*s[0]+a[1]*s[1]+a[2]*s[2])}function an(t,e,a){let s,n;if(a)s=[...a.minMm],n=[...a.maxMm];else if(t.courtyard)s=[...t.courtyard.minMm,0],n=[...t.courtyard.maxMm,yl];else{let u=t.pads.map(m=>_r(t,m.positionMm));s=[Math.min(...u.map(m=>m[0])),Math.min(...u.map(m=>m[1])),0],n=[Math.max(...u.map(m=>m[0])),Math.max(...u.map(m=>m[1])),yl]}let r=t.rotationDeg*Math.PI/180,[i,o]=t.positionMm,c=(e??0)/2,d=t.side==="top",h=[];for(let u=0;u<8;u+=1){let[m,p,f]=[0,1,2].map(l=>(u>>l&1?n:s)[l]);h.push([i+m*Math.cos(r)-p*Math.sin(r),o+m*Math.sin(r)+p*Math.cos(r),d?c+f:-c-f])}return h}function sn(t,e){let a=e.map(s=>fg(t,s));return[[0,1,2].map(s=>Math.min(...a.map(n=>n[s]))),[0,1,2].map(s=>Math.max(...a.map(n=>n[s])))]}var nn=Math.SQRT1_2,hg=[[0,0,0,1],[0,0,nn,nn],[0,0,1,0],[0,0,nn,-nn]],bg=[1,0,0,0],rn=[0,0,0,1],pg=(t,e)=>{let a=e*Math.PI/360;return[t[0]*Math.sin(a),t[1]*Math.sin(a),t[2]*Math.sin(a),Math.cos(a)]};function Fr(t){if(!t)return{pose:{translationMm:[0,0,0],rotation:rn},scale:1};let[e,a,s]=(t.rotationDeg??[0,0,0]).map(Number),n=rn;for(let[i,o]of[[[0,0,1],s],[[0,1,0],a],[[1,0,0],e]])n=Lt({translationMm:[0,0,0],rotation:n},{translationMm:[0,0,0],rotation:pg(i,o)}).rotation;return{pose:{translationMm:(t.offsetMm??[0,0,0]).map(Number),rotation:en(n)},scale:Number(t.scale??1)||1}}function mg(t){let e=t?.boundsMm;if(!e)return{exit:[0,0,-ve.housingDepthMm],depth:ve.housingDepthMm,modeled:!1};let{pose:a,scale:s}=Fr(t.alignment),n=[];for(let c=0;c<8;c+=1){let d=[0,1,2].map(u=>(c>>u&1?e.maxMm:e.minMm)[u]*s),h=Va(a.rotation,d);n.push([0,1,2].map(u=>h[u]+a.translationMm[u]))}let r=[0,1,2].map(c=>Math.min(...n.map(d=>d[c]))),i=[0,1,2].map(c=>Math.max(...n.map(d=>d[c]))),o=Math.min(r[2],0);return{exit:[(r[0]+i[0])/2,(r[1]+i[1])/2,o],depth:-o+0,modeled:!0}}function gg(t,e=0,a){let s=hg[(e%4+4)%4],n=Lt({translationMm:[0,0,0],rotation:bg},{translationMm:[0,0,0],rotation:s}),r=Lt(t,n),{exit:i,depth:o,modeled:c}=mg(a),d=Lt(r,{translationMm:i,rotation:rn}).translationMm,h=Va(r.rotation,[0,0,-1]),u=[0,1,2].map(m=>d[m]+ve.bootMm*h[m]);return{pose:r,exitMm:d.map(be),outward:h.map(be),legMm:u.map(be),depthMm:be(o),modeled:c}}function xl(t,e,a,s,n=0,r,i){let o=za(e,a,s);if(!o||!e)return null;let c=Math.max(sn(o,an(e,a,i))[1][2],0),d=Lt(t,{translationMm:o.originMm,rotation:o.rotation});return d=Lt(d,{translationMm:[0,0,c],rotation:rn}),{...gg(d,n,r),matingPlaneMm:be(c)}}function Br(t,e){let a=new Array(16).fill(0);for(let s=0;s<4;s+=1)for(let n=0;n<4;n+=1){let r=0;for(let i=0;i<4;i+=1)r+=t[i*4+n]*e[s*4+i];a[s*4+n]=r}return a}var yg=(t,e)=>[e[0]-t[0],0,0,0,0,e[1]-t[1],0,0,0,0,e[2]-t[2],0,t[0],t[1],t[2],1];function xg(t,e){let a=t.connector,s=a?za(a.geometry,a.thicknessMm,a.stored):null;if(!a||!s)return null;let[n,r]=sn(s,an(a.geometry,a.thicknessMm));return[[n[0],-r[1],-e],[r[0],-n[1],0]]}function vl(t,e){let a=`${t.level||""}/${t.id}`,s=[];for(let n of[...t.ends].sort((r,i)=>r.ordinal-i.ordinal)){let r=e.ends[n.id];if(!r)continue;let i=Cr(r.pose),o={key:`${a}/${n.id}`,harness:a,end:n.id};if(n.housing?.boundsMm){let{pose:d,scale:h}=Fr(n.housing.alignment),u=Br(Cr(d),[h,0,0,0,0,h,0,0,0,0,h,0,0,0,0,1]);s.push({...o,matrix:Br(i,u),model:n.housing});continue}let c=xg(n,r.depthMm);c&&s.push({...o,matrix:Br(i,yg(...c)),model:null})}return s}var vg=12,wg=2,Mg=1e-9,xa=(t,e)=>[t[0]-e[0],t[1]-e[1],t[2]-e[2]],ut=(t,e)=>Math.sqrt((t[0]-e[0])**2+(t[1]-e[1])**2+(t[2]-e[2])**2);function ya(t,e,a,s,n){if(s===a)return[t[0],t[1],t[2]];let r=(s-n)/(s-a),i=(n-a)/(s-a);return[r*t[0]+i*e[0],r*t[1]+i*e[1],r*t[2]+i*e[2]]}function Eg(t,e,a,s){let n=ve.catmullRomAlpha,r=0,i=r+ut(t,e)**n,o=i+ut(e,a)**n,c=o+ut(a,s)**n;return d=>{let h=i+d*(o-i),u=ya(t,e,r,i,h),m=ya(e,a,i,o,h),p=ya(a,s,o,c,h),f=ya(u,m,r,o,h),l=ya(m,p,i,c,h);return ya(f,l,i,o,h)}}function Tg(t,e,a){let s=xa(a,e),n=xa(t,e),r=Math.sqrt(s[0]*s[0]+s[1]*s[1]+s[2]*s[2]);if(r<1e-12)return ut(t,e);let i=[s[1]*n[2]-s[2]*n[1],s[2]*n[0]-s[0]*n[2],s[0]*n[1]-s[1]*n[0]];return Math.sqrt(i[0]*i[0]+i[1]*i[1]+i[2]*i[2])/r}function wl(t){let e=o=>[o[0],o[1],o[2]];if(t.length<2)return{samples:t.map(e),spans:t.map(()=>0)};let a=t[0],s=t[t.length-1],n=[xa([2*a[0],2*a[1],2*a[2]],t[1]),...t,xa([2*s[0],2*s[1],2*s[2]],t[t.length-2])],r=[e(a)],i=[0];for(let o=0;o<t.length-1;o+=1){let c=Eg(n[o],n[o+1],n[o+2],n[o+3]),d=(h,u,m,p,f)=>{let l=(h+u)/2,y=c(l);f<wg||f<vg&&Tg(y,m,p)>ve.chordErrorMm?(d(h,l,m,y,f+1),d(l,u,y,p,f+1)):(r.push(p),i.push(o))};d(0,1,e(t[o]),e(t[o+1]),0)}return{samples:r,spans:i}}function kg(t,e,a){let s=ut(t,e),n=ut(e,a),r=ut(a,t),i=xa(e,t),o=xa(a,t),c=[i[1]*o[2]-i[2]*o[1],i[2]*o[0]-i[0]*o[2],i[0]*o[1]-i[1]*o[0]],d=Math.sqrt(c[0]*c[0]+c[1]*c[1]+c[2]*c[2]);return d<1e-12?Number.POSITIVE_INFINITY:s*n*r/(2*d)}function Ml(t){let e=Number.POSITIVE_INFINITY,a=-1;for(let s=1;s<t.length-1;s+=1){let n=kg(t[s-1],t[s],t[s+1]);n<e&&(e=n,a=s)}return{radius:e,at:a}}function Ig(t,e,a){let s=[],n=[];t.forEach((m,p)=>{if(s.length&&ut(s[s.length-1],m)<Mg){n[n.length-1]=n[n.length-1]&&e[p];return}s.push([m[0],m[1],m[2]]),n.push(!!e[p])});let r=ve.minBendRadiusFactor*a,{samples:i,spans:o}=wl(s),{radius:c,at:d}=Ml(i);for(let m=0;m<ve.bendRelaxIterations&&!(c>=r||d<0);m+=1){let p=o[d],f=[];for(let g=1;g<s.length-1;g+=1)n[g]&&f.push(g);if(!f.length)break;let l=g=>Math.min(Math.abs(g-p),Math.abs(g-(p+1))),y=f[0];for(let g of f)l(g)<l(y)&&(y=g);let b=[0,1,2].map(g=>(s[y-1][g]+s[y+1][g])/2);s[y]=[0,1,2].map(g=>(s[y][g]+b[g])/2),{samples:i,spans:o}=wl(s),{radius:c,at:d}=Ml(i)}let h=0;for(let m=0;m+1<i.length;m+=1)h+=ut(i[m],i[m+1]);let u=m=>m.map(be);return{controlMm:s.map(u),samplesMm:i.map(u),lengthMm:be(h),minRadiusMm:Number.isFinite(c)?be(c):null,minRadiusAllowedMm:be(r),tightBend:d>=0&&c<r?{atMm:u(i[d]),radiusMm:be(c)}:null}}function Sg(t){let e=ve.bootMm/2,{exitMm:a,outward:s,legMm:n}=t;return[[a[0],a[1],a[2]],[a[0]+e*s[0],a[1]+e*s[1],a[2]+e*s[2]],[n[0],n[1],n[2]],[n[0]+e*s[0],n[1]+e*s[1],n[2]+e*s[2]]]}function El(t,e,a={},s={}){let n=new Map(e.nodes.map(r=>[r.id,r.positionMm]));return e.segments.map(r=>{let i=p=>p in t?Sg(t[p]):[[...n.get(p)]],o=i(r.from),c=i(r.to),d=(a[r.id]??[]).map(p=>[p[0],p[1],p[2]]),h=[...o,...d,...c.reverse()],u=s[r.id]??[],m=[...o.map(()=>!1),...d.map((p,f)=>!u[f]),...c.map(()=>!1)];return{segmentId:r.id,...Ig(h,m,r.diameterMm)}})}var Tl=t=>[t[0],t[1],t[2]];function kl(t,e){return t.filter(a=>a.kind===e).sort((a,s)=>a.order-s.order||(a.id<s.id?-1:a.id>s.id?1:0))}function Il(t){return kl(t,"breakout").map(e=>({id:e.id,positionMm:Tl(e.positionMm),ends:[...e.ends??[]]}))}function Sl(t,e){let a=(i,o)=>i<o?`${i}
${o}`:`${o}
${i}`,s=new Map;for(let i of kl(e,"waypoint")){let[o,c]=i.between??[],d=a(o,c),h=s.get(d);h?h.push(i):s.set(d,[i])}let n={waypoints:{},pinned:{},unused:[]},r=new Set;for(let i of t.segments){let o=a(i.from,i.to),c=s.get(o);c&&(r.add(o),c[0].between?.[0]!==i.from&&(c=[...c].reverse()),n.waypoints[i.id]=c.map(d=>Tl(d.positionMm)),n.pinned[i.id]=c.map(d=>!!d.pinned))}for(let[i,o]of s)r.has(i)||n.unused.push(...o.map(c=>c.id));return n.unused.sort(),n}var Rl=(t,e)=>Math.hypot(t[0]-e[0],t[1]-e[1],t[2]-e[2]);function Rg(t){if(!t.length)return{diameterMm:0,assumedGauge:!1};let e=0,a=!1;for(let s of t){let{odMm:n,assumed:r}=dl(s.gaugeAwg);e+=n*n,a=a||r}return{diameterMm:be(ve.packingFactor*Math.sqrt(e)),assumedGauge:a}}function Ag(t,e){let a=t.map(o=>Math.max(e.get(o.id)??0,0));a.every(o=>o===0)&&(a=t.map(()=>1));let s=a.reduce((o,c)=>o+c,0),n=[0,1,2].map(o=>t.reduce((c,d,h)=>c+a[h]*d.legMm[o],0)/s),r=[0,1,2].map(o=>t.reduce((c,d)=>c+d.outward[o],0)/t.length),i=Math.hypot(...r);return i<1e-9?n:[0,1,2].map(o=>n[o]+ve.breakoutLiftMm*r[o]/i)}function Al(t,e,a=[]){let s=new Map(t.map(p=>[p.id,p])),n=[],r=[];for(let p of e)s.has(p.from.end)&&s.has(p.to.end)?n.push(p):r.push(p.id);let i=new Map;for(let p of n)for(let f of[p.from.end,p.to.end])i.set(f,(i.get(f)??0)+1);let o=p=>p.map(be),c=t.map(p=>({id:p.id,kind:"end",positionMm:o(p.legMm)})),d=[];if(a.length){for(let f of a)c.push({id:f.id,kind:"breakout",positionMm:o(f.positionMm)});let p=new Map;for(let f of a)for(let l of f.ends??[])s.has(l)&&!p.has(l)&&p.set(l,f.id);for(let f of t){let l=p.get(f.id);if(l===void 0){let y=a[0];for(let b of a)Rl(b.positionMm,f.legMm)<Rl(y.positionMm,f.legMm)&&(y=b);l=y.id}d.push([f.id,l])}for(let f=0;f+1<a.length;f+=1)d.push([a[f].id,a[f+1].id])}else if(t.length===2)d.push([t[0].id,t[1].id]);else if(t.length>2){c.push({id:"auto",kind:"breakout",positionMm:o(Ag(t,i))});for(let p of t)d.push([p.id,"auto"])}let h=new Map(c.map(p=>[p.id,[]]));for(let[p,f]of d)h.get(p).push(f),h.get(f).push(p);let u=(p,f)=>{let l=new Set([p]),y=[p];for(;y.length;){let b=y.pop();for(let g of h.get(b))b===f[0]&&g===f[1]||b===f[1]&&g===f[0]||l.has(g)||(l.add(g),y.push(g))}return l},m=d.map(([p,f])=>{let l=u(p,[p,f]),y=n.filter(b=>l.has(b.from.end)!==l.has(b.to.end));return{id:`${p}~${f}`,from:p,to:f,wires:y.map(b=>b.id),...Rg(y)}});return{nodes:c,segments:m,unplaced:r}}var _g=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];function _l(t){return{translationMm:[t[12],t[13],t[14]],rotation:Nr([t[0],t[1],t[2]],[t[4],t[5],t[6]],[t[8],t[9],t[10]])}}function Ng(t,e){return[0,1,2].map(a=>t[a]*e[0]+t[4+a]*e[1]+t[8+a]*e[2]+t[12+a])}function Nl(t,e){let a={};for(let u of[...t.ends].sort((m,p)=>m.ordinal-p.ordinal)){let m=u.occurrence?e(u.occurrence):null;if(!m||!u.connector||!u.occurrence)continue;let p=xl(_l(m),u.connector.geometry,u.connector.thicknessMm,u.connector.stored,0,u.housing);p&&(a[u.id]={...p,occurrence:u.occurrence})}if(Object.keys(a).length<2)return null;let s=Object.entries(a).map(([u,m])=>({id:u,legMm:m.legMm,outward:m.outward})),n=t.wires.map(u=>({id:u.id,from:{end:u.from},to:{end:u.to},gaugeAwg:u.gaugeAwg??null})),r=t.level?e(t.level):_g,i=r?(t.nodes??[]).map(u=>({...u,positionMm:Ng(r,u.positionMm)})):[],o=Al(s,n,Il(i)),c=Sl(o,i),d=new Map(o.segments.map(u=>[u.id,u])),h=El(a,o,c.waypoints,c.pinned).map(u=>{let m=d.get(u.segmentId);return{...u,from:m.from,to:m.to,wires:[...m.wires],diameterMm:m.diameterMm,assumedGauge:m.assumedGauge}});return{ends:a,tree:o,curves:h,unused:c.unused,unplaced:o.unplaced,wires:t.wires.map(u=>({id:u.id,from:u.from,to:u.to}))}}function Cl(t,e,a=[]){let s=[],n=[];for(let r of t){let i=Nl(r,e);if(!i)continue;n.push(...vl(r,i));let o=new Map;for(let c of a.length?fl(i,a):[])o.set(c.segmentId,[...o.get(c.segmentId)??[],c.board]);for(let c of i.curves)c.diameterMm<=0||s.push({harness:`${r.level||""}/${r.id}`,segmentId:c.segmentId,from:c.from,to:c.to,samplesMm:c.samplesMm.flat(),radiusMm:c.diameterMm/2,wires:c.wires,tightBend:c.tightBend!==null,assumedGauge:c.assumedGauge,collides:o.get(c.segmentId)??[]})}return{tubes:s,housings:n}}var on=Object.freeze({restricted:{color:[.55,.57,.6,1],label:"Restricted"},loading:{color:[.7,.76,.82,1],label:"Loading\u2026"},building:{color:[.62,.72,.84,1],label:"Building 3D view\u2026"},missing:{color:[.78,.76,.7,1],label:"No 3D view"},failed:{color:[.86,.6,.56,1],label:"3D view failed"},unknown:{color:[.78,.76,.7,1],label:""}}),Fl=Object.freeze([.001,0,0,0,0,.001,0,0,0,0,.001,0,0,0,0,1]);function Ha(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let n=0;n<4;n+=1)a[s*4+n]=t[n]*e[s*4]+t[4+n]*e[s*4+1]+t[8+n]*e[s*4+2]+t[12+n]*e[s*4+3];return a}function Cg([t,e,a]){return[1,0,0,0,0,1,0,0,0,0,1,0,t,e,a,1]}function Fg([t,e,a]){return[t,0,0,0,0,e,0,0,0,0,a,0,0,0,0,1]}function jr(t,e){return Ha(Fl,Ha(t,e))}function Pr(t,e){let a=e.minMm,s=e.maxMm.map((n,r)=>Math.max(n-a[r],.2));return Ha(Fl,Ha(t,Ha(Cg(a),Fg(s))))}function Bl(t,e,a){return t.restricted?"restricted":!t.assetId||!e?"missing":a==="loaded"?null:a==="failed"?"failed":e.status==="ready"?e.bundleUrl&&e.bundleToBoard?"loading":"building":on[e.status]?e.status:"unknown"}function Or(t){return!!(t&&t.status==="ready"&&t.bundleUrl&&t.bundleToBoard)}function jl(t,e){return!t||t.bundleUrl!==e.bundleUrl||t.loadState==="failed"?"create":t.loadState==="waiting"&&Or(e)?"load":"keep"}function Pl(t){return(t?.occurrences||[]).filter(e=>e.kind==="board"||e.restricted)}function Ol(t){if(!t.length)return!1;let e=0;for(let a of t)if(!a.standIn)e+=1;else if(a.standIn==="loading")return!1;return e>0}var Dl=512*1024*1024,Bg=.65,jg=120,Pg=12,Og=48,Ql=230,Dg=40,Lg=4,Wr=document,ft,O,Re,bn,pn,mn,wa,Rn,rt,ln,Xa,nt,Ye,pe,Fe,dn,gn,Wa,Se,Z,An,_n,Ce,va,aa,Ke,ea,yn,Zl,$=t=>Wr.querySelector(t),ta=t=>Wr.querySelectorAll(t);function ed(t=document){Wr=t,ft=$("#app"),O=$("#viewport"),Re=$("#schematic-viewport"),bn=$("#schematic-dom-layer"),pn=$("#schematic-flow-overlay"),mn=$("#bom-view"),wa=$("#status")||{set textContent(e){}},Rn=$("#viewer-kind")||{set textContent(e){}},rt=$("#selection")||{set textContent(e){}},ln=$("#diagnostics")||{set innerHTML(e){}},Xa=$("#scene-stats"),nt=$("#lod-tuning"),Ye=$("#layers"),pe=$("#search-controls"),Fe=$("#view-controls"),Ce=$("#stackup-workspace-view"),dn=$("#fallback"),gn=$("#panel-labels"),Wa=$("#schematic-labels"),Se=$("#axis-gizmo"),Z=$("#selection-card"),An=$("#primary-heading"),_n=$("#primary-description"),va=$("#mode-switch"),aa=$("#system-labels"),Ke=$("#move-gizmo"),ea=$("#system-help"),yn=$("#system-harnesses"),Zl=$("#harness-nodes"),ft.classList.add("workspace-pcb")}function td(){return{workspace:"pcb",mode:"3d",activeNetId:0,selectedFeatureId:0,selectedOccurrence:0,selectionAnchor:null,showBoard:!0,showComponents:!0,showPlaceholders:!0,realisticColors:!0,isolateNet:!1,savedShowBoard:!0,savedShowComponents:!0,preIsolationShowBoard:null,separation:0,dragging:!1,dragMode:"orbit",lastX:0,lastY:0,pointerStartX:0,pointerStartY:0,frameCpuMs:0,frameCpuP95Ms:0,frameIntervalMs:0,frameIntervalP95Ms:0,frameSamples:[],fps:0,frames:0,fpsAt:performance.now(),activeTab:"layers",selectedPageId:"",selectedSchematicFeature:null,schematicDragging:!1,schematicLastX:0,schematicLastY:0,schematicStartX:0,schematicStartY:0}}function Qa(t={}){return{key:t.key??"board",topology:t.topology||window.__TOPOLOGY__||{},semanticGeometry:t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},viewerReadiness:t.readiness||{stage:"semantic-ready",progress:100},assetCache:t.assetCache||null,deferComponents:!!t.deferComponents,scene:Ug(),renderer:null,compareLayers:new Set,desiredCompareLayers:new Set,visible3dLayers:new Set,preIsolation3dLayers:null,preIsolationCompareLayers:null,highlightedNetIds:new Set,hiddenComponents:new Set,hiddenComponentRequest:null,loadedBytes:0,triangles:0,residentTileBytes:0,residentTileGpuBytes:0,residentTileTriangles:0,tileLoads:0,tileEvictions:0,tileSchedulerMs:0,lastTileScheduleAt:0,visibleTileIds:new Set,gpuBytes:0}}function Ug(){return{manifest:null,manifestUrl:"",layers:[],copperLayers:[],nets:[],features:new Map,tiles:new Map,loaded:new Set,loading:new Map,failed:new Map,residentTiles:new Map,componentFeatures:new Map,componentModelCounts:new Map,componentTier:"idle",componentEntries:[],componentsWantedAt:0,componentEvictions:0,runtimeBounds:null,layerZOffsets:new Float32Array(256),layerZOffsetSignature:""}}function ad(){return{key:"",started:0,from:new Map,current:new Map}}function sd(){return{phase:"idle",previous:new Set,target:new Set,previousOffsets:new Map,started:0}}function nd(){return{manifest:null,manifestUrl:"",pages:[],byId:new Map,activeNetUid:"",visiblePages:[],fitted:!1,rendererMode:new URLSearchParams(location.search).get("schematicRenderer")||"svg-dom",domFallbackReason:""}}var w=td(),E=Qa(),v=null,we=ad(),q=sd(),D=nd(),xn=[],vn=1.5*1024*1024*1024,Gg=5e3,N,J,Je,K,ee,sa=new Map,Ut=performance.now(),ge=0,un=0,Za=null,wn=null,Mn=null,Dr=!1,Ae=!1,Nn=()=>!0,$a=!0;!window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__&&document.getElementById("app")&&Yr().catch(t=>{console.error(t),wa&&(wa.textContent="Renderer failed"),dn&&(dn.hidden=!1,dn.textContent=t.stack||t.message||String(t))});function rd(t){let e=new Map((t.components||[]).map(s=>[s.uid,s])),a={};for(let s of t.terminals||[]){let n=s.net_uid;if(!n)continue;let r=e.get(s.component_uid)||{},i={designator:s.designator||r.designator||"",pin:s.pin||"",value:r.value||"",pcb_pad_id:s.pcb_pad_id||""};a[n]||(a[n]={terminals:[]});let o=a[n].terminals;o.some(c=>c.designator===i.designator&&c.pin===i.pin)||o.push(i)}return a}function Kg(t,e=E){if(!t||!e.topology||!e.topology.physical_objects)return 0;let a=e.topology.physical_objects.find(n=>n.uid===t);if(!a||!a.source_ids||!a.source_ids.length)return 0;let s=a.source_ids[0];for(let[n,r]of e.scene.features.entries())if(r.sourceUid===s)return n;return 0}function $r(t,e=E){return!t||!e.topology||!e.topology.components?null:e.topology.components.find(a=>a.designator===t)}function cn(t,e){for(let a of Object.keys(t))delete t[a];Object.assign(t,e)}function id(){if(un&&(cancelAnimationFrame(un),un=0),window.removeEventListener("keydown",pu),v){for(let t of v.boards.values())t.abort?.abort();v.scene.dispose(),v=null}else E.renderer?.dispose?.();E.renderer=null,N=null,J?.dispose?.(),J=null,Je=null,Za=null,Nn=()=>!0,$a=!0}function od(){return ge+=1,id(),cn(w,td()),E=Qa(),cn(we,ad()),cn(q,sd()),cn(D,nd()),xn=[],K=null,ee=null,sa=new Map,Ut=performance.now(),ge}function cd(t){t===ge&&(ge+=1,id())}function Ya(t){t===ge&&(un=requestAnimationFrame(e=>n0(e,t)))}function me(t){return t===ge}async function Yr(t={}){let e=od(),a={};if(E.topology=t.topology||window.__TOPOLOGY__||{},E.topology&&!E.topology.net_details&&(E.topology.net_details=rd(E.topology)),E.semanticGeometry=t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},E.viewerReadiness=t.readiness||E.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},Za=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,Mn=typeof t.onContextMenu=="function"?t.onContextMenu:null,wn=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,Nn=typeof t.isActive=="function"?t.isActive:()=>!0,$a=t.workspaceScope!=="3d",E.assetCache=t.assetCache||null,w.gpuBudgetBytes=vn,ed(t.root||document),!ft||!O)throw new Error("Semantic viewer shell is missing required DOM nodes");return await Hg(e,a,t.onPerformanceEvent),{performance:a,setSelection(s){Ae=!0;try{if(s?.occurrence!=null&&zg(s.occurrence),!s)Ee();else if(s?.netName||s?.netUid){let n=s.netUid&&E.scene.nets.find(r=>r.uid===s.netUid)||s.netName&&Xt(E.scene.nets,s.netName);n&&ka(Number(n.id),!0)}else s?.netId?ka(Number(s.netId),!0):s?.featureId?Ht(Number(s.featureId),!0):s?.reference&&Ln(String(s.reference),!0)}finally{Ae=!1}},resize(){E.renderer?.resize(),N?.resize(),w.workspace==="pcb"&&w.mode==="layer"&&di()},setWorkspace(s){let n=s==="stackup"?"stackup":"pcb";w.workspace!==n&&du(n)},setHiddenComponents(s){return cu(s)},getComponentReferences(){return[...E.scene.componentFeatures.keys()]},setHighlightedNets(s){return Vg(s)},setStatsOverlay(s){ti(s)},stats(){return ei()},setLodOverride(s){E.renderer?.setLodOverride(s)},setGpuBudget(s){let n=Number(s);w.gpuBudgetBytes=Number.isFinite(n)&&n>0?n:vn;for(let r of v?v.boards.values():[E])r.tiersCheckedAt=0},pickAt(s,n){return hu(s,n)},projectComponent(s){return bu(E,s,n=>Hr(n,Jt))},projectPoint(s){return Hr(s,Jt)},getViewState:Jr,setViewMode:su,setLayerVisible:hi,applyLayerPreset:bi,setShowBoard:pi,setShowComponents:mi,setShowPlaceholders:nu,setRealisticColors:ru,setSeparation:gi,showNetLayers:Dn,setNetIsolation:Vt,dispose(){cd(e)}}}function Kt(){!wn||Dr||(Dr=!0,queueMicrotask(()=>{Dr=!1,wn?.(Jr())}))}function Jr(){let t=w.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;return{mode:w.mode,layers:E.scene.copperLayers.map(e=>({id:Number(e.id),name:String(e.name),color:wi(On(e)),visible:t.has(Number(e.id))})),showBoard:w.showBoard,showComponents:w.showComponents,showPlaceholders:w.showPlaceholders,realisticColors:w.realisticColors,separation:v?v.separation.get(Ja())||0:w.separation,isolateNet:w.isolateNet,hasNet:!!w.activeNetId||ht(),...v?{boards:Ry(),selectedBoard:Ja()}:{}}}function Cn(t){if(v?.move.enabled&&ts(),Ae)return;let e=E.renderer&&!E.renderer.identityOnly?E.renderer.occurrenceKeys[w.selectedOccurrence]:null;Za?.(t&&e!=null?{...t,occurrence:e}:t)}function zg(t){let e=E.renderer?.occurrenceKeys.indexOf(String(t))??-1;e>=0&&(w.selectedOccurrence=e)}function Qr(t){if(!t||!E.renderer||E.renderer.identityOnly)return t;let e=E.renderer.occurrenceMatrices[w.selectedOccurrence];return e?fa(e,t):t}function ld(t,e=null){return t?{kind:"net",sourceContext:"3D",netName:String(t.name||""),netUid:String(t.uid||"")||void 0,netCode:Number(t.id||0)||void 0,featureId:Number(e?.id||0)||void 0,uuid:String(e?.sourceUid||"")||void 0}:null}function dd(t,e=E){if(!t)return null;let a=Ia(t),s=String(t.padNumber||t.pin||t.pinNumber||""),n=e.scene.nets.find(r=>Number(r.id)===Number(t.netId||0));if(a&&s)return{kind:"terminal",sourceContext:"3D",reference:a,pin:s,netUid:n?.uid,netName:n?.name,netCode:n?Number(n.id):void 0,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0};if(a){let r=$r(a,e);return{kind:"component",sourceContext:"3D",reference:a,componentUid:r?.uid,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0}}return ld(n,t)}function ud(){w.showBoard=!0,w.showComponents=!0,ia(),typeof _e=="function"&&_e()}function ht(){return Ma().size>0||!!v?.emphasisSets.length}function Ma(){let t=new Set(E.highlightedNetIds);return w.activeNetId&&t.add(Number(w.activeNetId)),t}function Vg(t){let e=Array.isArray(t)?t:[],a=Gi(E.scene.nets,e),s=ht();E.highlightedNetIds=a,E.renderer?.setEmphasizedNetIds(a);let n=ht();return n&&!s?Fn():!n&&s&&Zr(),w.isolateNet&&n&&ra(),ye(performance.now(),{force:!0}),{applied:a.size,requested:e.length}}function Fn(){(w.showBoard||w.showComponents)&&(w.savedShowBoard=w.showBoard,w.savedShowComponents=w.showComponents),w.showBoard=!1,w.showComponents=!1,ia(),typeof _e=="function"&&_e()}function Zr(){w.showBoard=w.savedShowBoard!==!1,w.showComponents=w.savedShowComponents!==!1,ia(),typeof _e=="function"&&_e()}async function fd(t,e,a={}){let s=t.semanticGeometry.assets?.scene_manifest||t.semanticGeometry.semantic_gltf?.path,n=performance.now();if(s){if(t.scene.manifestUrl=new URL(s,location.href).toString(),t.scene.manifest=await Wg(t.scene.manifestUrl,t),a.scene_manifest_fetch_parse_ms=performance.now()-n,!me(e))return!1;if(t.scene.manifest.schema!=="prism.semantic_gltf_a0")throw new Error(`Unsupported scene schema: ${t.scene.manifest.schema}`)}else t.scene.manifest={schema:"prism.semantic_gltf_partial.a0",bbox:null,layers:[],nets:[],objectFeatures:[],components:[],tiles:[],barrels:[]},a.scene_manifest_fetch_parse_ms=0;n=performance.now(),t.scene.layers=t.scene.manifest.layers||[],t.scene.copperLayers=t.scene.layers.filter(i=>i.role==="copper"||String(i.name).endsWith(".Cu")),t.scene.nets=t.scene.manifest.nets||[];for(let i of t.scene.manifest.objectFeatures||[])t.scene.features.set(Number(i.id),{...i,bounds:Ca(i.boundsMm)});for(let i of t.scene.manifest.components||[])t.scene.componentFeatures.set(i.designator,i),t.scene.features.set(Number(i.featureId),{...i,kind:"component",sourceUid:i.uid,netId:0,bounds:null});for(let i of t.scene.manifest.tiles||[])t.scene.tiles.set(i.id,i);a.scene_manifest_index_ms=performance.now()-n;let r=bd(t);for(let i of r)t.compareLayers.add(i),t.desiredCompareLayers.add(i);for(let i of t.scene.copperLayers)t.visible3dLayers.add(Number(i.id));return!0}async function Hg(t,e={},a=null){let s=performance.now();if(!await fd(E,t,e))return;let n=performance.now();if(E.renderer=await Qt.create(O),e.webgpu_renderer_create_ms=performance.now()-n,!me(t)){E.renderer?.dispose?.(),E.renderer=null;return}E.renderer.setBarrels(E.scene.manifest.barrels||[]),ns(),n=performance.now();let r=await xd(t);if(e.board_fetch_parse_upload_ms=performance.now()-n,!me(t)||(E.scene.runtimeBounds=r||bs(E.scene.manifest.bbox),K=new _a(E.scene.runtimeBounds),$a&&(await qg(t),!me(t)||(await Xg(t),!me(t)))))return;n=performance.now(),ui(),lu(),$a&&(R0(),S0()),iu(),gu(),e.controls_and_bindings_ms=performance.now()-n;let i={"board-ready":"Board ready \xB7 components and semantic layers are still generating","components-ready":"Board and components ready \xB7 semantic layers are still generating","semantic-ready":"WebGPU semantic glTF active"};if(wa.textContent=i[E.viewerReadiness.stage]||"Loading 3D assets",E.semanticGeometry.assets?.components_glb&&!E.deferComponents){let o=performance.now();Vd(t).then(()=>{me(t)&&(Vr(r),a?.({schema:"prism.semantic_viewer_performance.a0",milestone:"components-loaded",readiness_stage:E.viewerReadiness.stage,elapsed_ms:performance.now()-o,bytes_loaded:E.loadedBytes}))})}else Vr(r);ye(performance.now(),{force:!0}),Ya(t),n=performance.now(),await new Promise(o=>requestAnimationFrame(o)),e.first_frame_wait_ms=performance.now()-n,e.boot_total_ms=performance.now()-s}async function qg(t=ge){let e=E.semanticGeometry.assets?.schematic_native_manifest||E.semanticGeometry.schematic_vector?.path||E.semanticGeometry.schematic_scene?.path,a=E.semanticGeometry.assets?.schematic_manifest||E.semanticGeometry.schematic_world?.path,s=$("[data-workspace=schematic]");if(!e&&!a){s.disabled=!0,s.title="No schematic world assets are available";return}let n=[e,a].filter(Boolean),r=null;for(let o of n)try{D.manifestUrl=new URL(o,location.href).toString();let c=await Xs.create(Re,D.manifestUrl);if(!me(t))return;N=c,N.setFlowOverlayCanvas(pn);break}catch(c){if(r=c,N=null,o===a)throw c}if(!N)throw r||new Error("Failed to load schematic viewer assets");D.manifest=N.manifest,D.pages=N.pages,D.byId=new Map(D.pages.map(o=>[o.id,o])),w.selectedPageId=D.pages[0]?.id||"",N.selectedPageId=w.selectedPageId,!["native","legacy","webgpu"].includes(String(D.rendererMode).toLowerCase())&&(J=Ys.create(bn,D.manifestUrl,D.manifest,N.featuresByPage,{onSelect:g0,onBlank:ss,onHighlightNet:tu,onOpenPage:p0,onFallback:o=>{D.domFallbackReason=o,console.warn(o)}}),J.preloadPages(D.pages)),N.preloadOverview()}async function Xg(t=ge){let e=E.semanticGeometry.assets?.bom||E.semanticGeometry.bom?.path,a=$("[data-workspace=bom]");if(!e){a&&(a.disabled=!0,a.title="No BoM artifact is available");return}try{let s=await fs.create(mn,new URL(e,location.href).toString(),{onSelectReference:n=>Ln(n,!0)});if(!me(t))return;Je=s}catch(s){if(!me(t))return;console.warn(s),a&&(a.disabled=!0,a.title=s?.message||"BoM artifact could not be loaded")}}async function Wg(t,e=E){if(e.assetCache)return e.assetCache.fetchJson(String(t));let a=await fetch(t,{cache:"default"});if(!a.ok)throw new Error(`Failed to load ${t}: ${a.status}`);return a.json()}async function $g(t,e=ge,a=E){if(!me(e))return;let s=a.scene.residentTiles.get(t.id);if(s){s.lastUsed=performance.now();return}if(a.scene.failed.get(t.id))return;if(a.scene.loading.has(t.id))return a.scene.loading.get(t.id);let r=(async()=>{try{let i=await ua(new URL(t.path,a.scene.manifestUrl).toString(),{fetchBytes:kn(a),fetchCache:"no-store"});if(!me(e)||!a.renderer)return;a.loadedBytes+=i.byteLength;let o=a.scene.layers.find(m=>Number(m.id)===Number(t.layerId)),c=[],d=0,h=0;for(let m of i.primitives){let p=a.renderer.addPrimitive(m,{kind:"copper",tileId:t.id,layerId:Number(t.layerId),innerCopper:sy(Number(t.layerId),a),color:Wd(o,a),stencilMark:Xd(o,a),baseZ:Number(o?.z_mm||0)/1e3,material:{baseColor:[1,1,1,1],metallic:.78,roughness:.32}});c.push(p),d+=m.indices.length/3,h+=Yg(m)}let u={tile:t,entries:c,byteLength:i.byteLength,gpuBytes:h,triangles:d,lastUsed:performance.now(),pinned:!1};a.scene.residentTiles.set(t.id,u),a.scene.loaded.add(t.id),a.tileLoads+=1,a.residentTileBytes+=i.byteLength,a.residentTileGpuBytes+=h,a.residentTileTriangles+=d,a.triangles=a.residentTileTriangles,a.scene.failed.delete(t.id)}catch(i){if(!me(e))return;let o=a.scene.failed.get(t.id)||{count:0,message:""};a.scene.failed.set(t.id,{count:o.count+1,message:i?.message||String(i)}),o.count||console.warn(`Failed to load tile ${t.id}; suppressing retries until assets are regenerated`,i)}finally{me(e)&&a.scene.loading.delete(t.id)}})();return a.scene.loading.set(t.id,r),r}function Yg(t){return t.position.length/3*Dg+t.indices.length*Lg}function Jg(t,e=E){let a=e.scene.residentTiles.get(t);a&&(e.renderer.removeEntries(a.entries),e.scene.residentTiles.delete(t),e.scene.loaded.delete(t),e.residentTileBytes=Math.max(0,e.residentTileBytes-a.byteLength),e.residentTileGpuBytes=Math.max(0,e.residentTileGpuBytes-a.gpuBytes),e.residentTileTriangles=Math.max(0,e.residentTileTriangles-a.triangles),e.triangles=e.residentTileTriangles,e.tileEvictions+=1)}function ye(t=performance.now(),e={},a=E){if(!a.renderer||!K||w.workspace!=="pcb")return;let s=w.mode==="layer"&&q.phase==="preload";if(!e.force&&!s&&t-a.lastTileScheduleAt<jg)return;let n=performance.now();a.lastTileScheduleAt=t;let r=Qg(a);a.visibleTileIds=r;let i=a.scene.loading.size,c=Math.max(0,(s?Og:Pg)-i),d=[...r].map(u=>a.scene.tiles.get(u)).filter(u=>u&&!a.scene.residentTiles.has(u.id)&&!a.scene.loading.has(u.id)&&!a.scene.failed.has(u.id)).sort((u,m)=>Ul(u,a)-Ul(m,a)).slice(0,c),h=ge;for(let u of d)$g(u,h,a);for(let u of r){let m=a.scene.residentTiles.get(u);m&&(m.lastUsed=t)}md(r,void 0,a),a.tileSchedulerMs=performance.now()-n}function Qg(t=E){let e=new Set,a=w.mode==="3d"?t.visible3dLayers:Zg();if(!a.size||!ee)return e;if(w.mode==="layer"){for(let r of t.scene.tiles.values())a.has(Number(r.layerId))&&e.add(r.id);return e}let s=new Set,n=Nd(t);if(n.size){for(let r of t.scene.tiles.values())if(a.has(Number(r.layerId))){for(let i of n)if(yd(r,i)){s.add(r.id);break}}}for(let r of t.scene.tiles.values()){if(!a.has(Number(r.layerId)))continue;let i=w.mode==="layer"?sa.get(Number(r.layerId)):null;ty(r,ee.matrix,i,Bg,t)&&e.add(r.id)}for(let r of s)e.add(r);return e}function Zg(){return w.mode!=="layer"||q.phase==="idle"?E.compareLayers:pd(q.previous,q.target)}function hd(){return w.mode!=="layer"?E.visible3dLayers:q.phase==="reveal"?pd(q.previous,q.target):E.compareLayers}function bd(t=E){let e=t.scene.copperLayers.map(a=>Number(a.id)).filter(Number.isFinite);return e.length?e.length===1?new Set([e[0]]):new Set([e[0],e[e.length-1]]):new Set}function ey(){let t=E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers;return t.size?new Set([...t].map(Number)):bd()}function pd(...t){let e=new Set;for(let a of t)for(let s of a||[])e.add(Number(s));return e}function md(t,e=Dl,a=E){if(w.mode==="layer")return;let s=Math.min(Dl,e);if(a.residentTileGpuBytes<=s)return;let n=[...a.scene.residentTiles.values()].filter(r=>!t.has(r.tile.id)&&!a.scene.loading.has(r.tile.id)).sort((r,i)=>r.lastUsed-i.lastUsed);for(let r of n){if(a.residentTileGpuBytes<=s)break;Jg(r.tile.id,a)}}function ty(t,e,a=null,s=0,n=E){let r=gd(t,n);if(!r)return!0;let i=Math.max(r[3]-r[0],r[4]-r[1])*s,o=[r[0]-i+(a?.[0]||0),r[1]-i+(a?.[1]||0),r[2]-.002,r[3]+i+(a?.[0]||0),r[4]+i+(a?.[1]||0),r[5]+.002],c=n.renderer?.occurrenceMatrices;return!c||c.length===1&&Ps(c[0])?Ll(o,e):c.some(d=>Ll(o,us(e,d)))}function gd(t,e=E){let a=t.boundsMm;if(!a||a.length!==4)return null;let s=e.scene.layers.find(r=>Number(r.id)===Number(t.layerId)),n=Number(s?.z_mm||0)/1e3;return[a[0]/1e3,-a[3]/1e3,n-4e-4,a[2]/1e3,-a[1]/1e3,n+4e-4]}function Ll(t,e){let a=[[t[0],t[1],t[2]],[t[3],t[1],t[2]],[t[0],t[4],t[2]],[t[3],t[4],t[2]],[t[0],t[1],t[5]],[t[3],t[1],t[5]],[t[0],t[4],t[5]],[t[3],t[4],t[5]]].map(n=>ay(e,n));return![n=>n[0]<-n[3],n=>n[0]>n[3],n=>n[1]<-n[3],n=>n[1]>n[3],n=>n[2]<0,n=>n[2]>n[3]].some(n=>a.every(n))}function ay(t,e){let a=e[0],s=e[1],n=e[2];return[t[0]*a+t[4]*s+t[8]*n+t[12],t[1]*a+t[5]*s+t[9]*n+t[13],t[2]*a+t[6]*s+t[10]*n+t[14],t[3]*a+t[7]*s+t[11]*n+t[15]]}function yd(t,e){return Array.isArray(t.netIds)&&t.netIds.some(a=>Number(a)===Number(e))}function Ul(t,e=E){let a=gd(t,e);if(!a||!K)return 0;let s=(a[0]+a[3])*.5-K.focus[0],n=(a[1]+a[4])*.5-K.focus[1];return s*s+n*n}async function xd(t=ge,e=E){let a=e.semanticGeometry.assets?.base_board_glb;if(!a)return null;let s=e.semanticGeometry.assets?.soldermask_glb,[n,r]=await Promise.all([ua(new URL(a,location.href).toString(),{defaultFeatureId:0,fetchBytes:kn(e)}),s?ua(new URL(s,location.href).toString(),{defaultFeatureId:0,fetchBytes:kn(e)}).catch(o=>(console.warn("[prism-semantic-viewer] solder mask failed to load",o),null)):null]);if(!me(t)||!e.renderer)return null;e.loadedBytes+=n.byteLength,r&&(e.loadedBytes+=r.byteLength);let i=[...n.primitives.filter(o=>{let c=Wn(o);return c!=="pad"&&!(r&&c==="soldermask")}),...r?.primitives||[]];for(let o of hs(i,Wn))e.renderer.addPrimitive(o,{kind:"board",boardRole:o.groupKey,layerId:o.groupKey==="paste"?Qy(o,e):0,material:o.material,color:o.material.baseColor});return ca(i.map(o=>o.bounds))}function na(t=E){return t.scene.runtimeBounds||bs(t.scene.manifest?.bbox)}function sy(t,e=E){return Fi(t,e.scene.copperLayers)}function vd(t,e){let{back:a}=K.basis();return{eye:Le(K.focus,Be(a,K.distance)),orthographic:e,pixelScale:e?t/Math.max(1e-9,K.orthoScale):t/2/Math.tan(K.fov/2)}}function ei(){if(v)return ny();let t=E.renderer?.cullCounts||{full:0,board:0,body:0,box:0,culled:0},e=!E.renderer||E.renderer.identityOnly;return{occurrences:E.renderer?.occurrenceMatrices.length||0,lod:e?{full:1,board:0,body:0,box:0,culled:0}:{...t},triangles:E.renderer?.frameStats.triangles||0,draws:E.renderer?.frameStats.draws||0,gpuMemoryBytes:E.renderer?.gpuMemoryBytes()||0,gpuBudgetBytes:w.gpuBudgetBytes,componentTier:E.scene.componentTier,componentEvictions:E.scene.componentEvictions,tileEvictions:E.tileEvictions,cache:E.assetCache?E.assetCache.summary():{enabled:!1},frameIntervalMs:w.frameIntervalMs,frameIntervalP95Ms:w.frameIntervalP95Ms,frameCpuMs:w.frameCpuMs,frameCpuP95Ms:w.frameCpuP95Ms,fps:w.fps}}function ny(){let t=Qe(),e=t.map(a=>a.scene.componentTier);return{occurrences:v.scene.occurrenceCount||0,lod:v.scene.cullCounts(),triangles:v.scene.frameStats.triangles,draws:v.scene.frameStats.draws,gpuMemoryBytes:v.scene.gpuMemoryBytes(),gpuBudgetBytes:w.gpuBudgetBytes,componentTier:`${e.filter(a=>a==="loaded").length}/${t.length} loaded`,componentEvictions:t.reduce((a,s)=>a+s.scene.componentEvictions,0),tileEvictions:t.reduce((a,s)=>a+s.tileEvictions,0),cache:t.find(a=>a.assetCache)?.assetCache.summary()||{enabled:!1},frameIntervalMs:w.frameIntervalMs,frameIntervalP95Ms:w.frameIntervalP95Ms,frameCpuMs:w.frameCpuMs,frameCpuP95Ms:w.frameCpuP95Ms,fps:w.fps,firstFrame:v.timing.boardsDrawnAt==null?null:{sinceSceneMs:v.timing.boardsDrawnAt-v.timing.descriptorAt,sinceNavigationMs:v.timing.boardsDrawnAt}}}function ti(t){w.showStats=!!t,Xa&&(Xa.hidden=!w.showStats),nt&&(nt.hidden=!(w.showStats&&v)),w.showStats&&v&&cy(),wd()}var Gr="prism.systemScene.lodThresholds",ry=Object.freeze([{key:"fullPx",label:"Parts",max:600},{key:"boardPx",label:"Copper",max:400},{key:"boxPx",label:"Box below",max:120}]);function iy(){try{let t=JSON.parse(globalThis.localStorage?.getItem(Gr)||"null");if(t&&typeof t=="object")return ha(t)}catch{}return{...$e}}function oy(t){try{t?globalThis.localStorage?.setItem(Gr,JSON.stringify(t)):globalThis.localStorage?.removeItem(Gr)}catch{}}function Kr(t){if(!v)return null;let e=t==null?{...$e}:{...v.scene.lodThresholds,...t},a=v.scene.setLodThresholds(e);return oy(t==null?null:a),zr(),a}function cy(){if(!nt||nt.childElementCount)return zr();let t=document.createElement("h2");t.textContent="Detail thresholds (CSS px)",nt.append(t);for(let a of ry){let s=document.createElement("label"),n=document.createElement("span");n.textContent=a.label;let r=document.createElement("input");Object.assign(r,{type:"range",min:"0",max:String(a.max),step:"1"}),r.dataset.key=a.key;let i=document.createElement("output");r.addEventListener("input",()=>Kr({[a.key]:Number(r.value)})),s.append(n,r,i),nt.append(s)}let e=document.createElement("button");e.type="button",e.textContent="Defaults",e.addEventListener("click",()=>Kr(null)),nt.append(e),zr()}function zr(){if(!nt||!v)return;let t=v.scene.lodThresholds;for(let e of nt.querySelectorAll("input[data-key]"))e.value=String(t[e.dataset.key]),e.nextElementSibling.value=String(Math.round(t[e.dataset.key]))}function wd(){if(!Xa||!w.showStats)return;let t=ei(),{full:e,board:a,body:s,box:n,culled:r}=t.lod,i=[["Occurrences",`${t.occurrences} (${e+a+s+n} visible)`],["Detail",`${e} full \xB7 ${a} board \xB7 ${s} body \xB7 ${n} box \xB7 ${r} culled`],["Triangles",t.triangles.toLocaleString()],["Draws",t.draws.toLocaleString()],["GPU memory",`${(t.gpuMemoryBytes/1048576).toFixed(1)} / ${(t.gpuBudgetBytes/1048576).toFixed(0)} MB`],["Components",`${t.componentTier}${t.componentEvictions?` \xB7 ${t.componentEvictions} evicted`:""}`],["Cache",t.cache.enabled?`${t.cache.hits} hits \xB7 ${t.cache.misses} misses \xB7 ${(t.cache.bytes/1048576).toFixed(0)} MB`:"off"],["Frame",`${t.frameIntervalMs.toFixed(1)} ms \xB7 p95 ${t.frameIntervalP95Ms.toFixed(1)}`],["CPU",`${t.frameCpuMs.toFixed(2)} ms \xB7 p95 ${t.frameCpuP95Ms.toFixed(2)}`],["FPS",t.fps.toFixed(0)]];Xa.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("")}var ly="prism.system_scene.a0";function Qe(){return v?[...v.boards.values()].filter(t=>t.renderer&&t.loadState==="loaded"):[]}async function Md(t={}){let e=od();if(Za=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,Mn=typeof t.onContextMenu=="function"?t.onContextMenu:null,wn=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,Nn=typeof t.isActive=="function"?t.isActive:()=>!0,$a=!1,w.gpuBudgetBytes=vn,ed(t.root||document),!ft||!O)throw new Error("Semantic viewer shell is missing required DOM nodes");if(typeof t.loadBundle!="function")throw new Error("A system scene needs a bundle loader");let a=await Ks.create(O);return me(e)?(a.setLodThresholds(iy()),v={scene:a,loadBundle:t.loadBundle,onEmphasis:typeof t.onEmphasis=="function"?t.onEmphasis:null,onMove:typeof t.onMove=="function"?t.onMove:null,onHarness:typeof t.onHarness=="function"?t.onHarness:null,baseDescriptor:null,descriptor:null,move:Fy(),gizmo:null,standInKey:null,showLabels:!0,harnesses:[],harnessLit:new Map,showHarnesses:!0,harnessDrawn:null,tubes:[],tubedHarnesses:new Set,harnessPick:null,worlds:new Map,nodePreview:null,housingModels:new Map,timing:{descriptorAt:null,boardsDrawnAt:null},boards:new Map,groups:new Map,placed:[],placements:new Map,hiddenLayers:new Map,separation:new Map,bounds:null,framed:!1,snapped:!1,boardSelected:!1,inputs:new Map,emphasisSets:[],emphasisBounds:new Map,emphasisReport:null},E=Qa({key:""}),K=new _a([-.1,-.1,-.01,.1,.1,.01]),ui(),lu(),iu(),gu(),wa.textContent="System scene",Ya(e),{setSystemScene:dy,setNetEmphasis:Ay,frameNetEmphasis:_y,frameAll(){v?.bounds&&K.frame(v.bounds)},setMoveAllowed:By,setMoveMode:En,setMoveSpace:Dd,previewPose:jy,cancelMove:ii,getMoveState:()=>v?Od():null,targetHarnessNode:li,previewHarnessNode:Xy,cancelHarnessNode:zd,getHarnessState:()=>v?Kd():null,setLabelsVisible(s){v&&(v.showLabels=!!s,aa&&(aa.hidden=!v.showLabels))},setHelpVisible:Gd,setHarnessesVisible(s){v&&(v.showHarnesses=!!s,v.harnessDrawn=null,Ea({relabel:!1}))},frameBoard(s){let n=v?.placements.get(String(s));return n&&K.frame(n.worldBounds),!!n},frameParts:Ny,setSelection(s){Ae=!0;try{s?My(s):Ee()}finally{Ae=!1}},resize(){v?.scene.resize()},setStatsOverlay:ti,stats:ei,setLodOverride(s){for(let n of Qe())n.renderer.setLodOverride(s)},setLodThresholds:Kr,setGpuBudget(s){let n=Number(s);w.gpuBudgetBytes=Number.isFinite(n)&&n>0?n:vn;for(let r of v?.boards.values()||[])r.tiersCheckedAt=0},pickAt(s,n){return hu(s,n)},projectPoint(s,n){return zl(s,n)},projectComponent(s,n){let r=v?.placements.get(String(n));return r?.board?bu(r.board,s,i=>zl(i,n)):null},getViewState:Jr,setLayerVisible:hi,applyLayerPreset:bi,setShowBoard:pi,setShowComponents:mi,setShowPlaceholders:nu,setRealisticColors:ru,setSeparation:gi,setNetIsolation:Vt,showNetLayers:Dn,dispose(){cd(e)}}):(a.dispose(),null)}function dy(t){if(!v)return;if(t?.schema!==ly)throw new Error(`Unsupported system scene schema: ${t?.schema||"missing"}`);v.baseDescriptor=t,v.timing.descriptorAt??=performance.now();let e=v.move.target?t.occurrences.find(s=>s.path===v.move.target):null;e?!v.move.drag&&jd(v.move.preview,e.pose)&&(v.move.preview=null):(v.move.drag=null,v.move.preview=null,v.move.target=null),v.descriptor=Pd(),v.harnesses=Array.isArray(t.harnesses)?t.harnesses:[],v.harnessDrawn=null;let a=new Set;for(let s of t.assets||[]){a.add(s.assetId);let n=v.boards.get(s.assetId),r=jl(n,s);if(r!=="create"){n.asset=s,r==="load"&&Kl(n,ge);continue}n&&Gl(s.assetId);let i=Qa({key:s.assetId,topology:{},semanticGeometry:{},deferComponents:!0});Object.assign(i,{asset:s,bundleUrl:s.bundleUrl,loadState:"waiting",abort:null}),v.boards.set(s.assetId,i),Or(s)&&Kl(i,ge)}for(let s of[...v.boards.keys()])a.has(s)||Gl(s);Ea(),Wy(),v.move.enabled&&(ts({quiet:!0}),it("sync"))}function Gl(t){let e=v.boards.get(t);e?.abort?.abort(),v.boards.delete(t),v.scene.removeAsset(t),e&&(e.renderer=null),E===e&&ai()}async function Kl(t,e){t.loadState="loading",t.abort=new AbortController;let a=()=>me(e)&&v?.boards.get(t.key)===t&&!t.abort.signal.aborted;try{let s=await v.loadBundle(t.bundleUrl,t.abort.signal);if(!a()||(t.topology=s.topology||{},t.topology.net_details||(t.topology.net_details=rd(t.topology)),t.semanticGeometry=s.semanticGeometry||{},t.viewerReadiness=s.readiness||t.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},t.assetCache=s.assetCache||null,!await fd(t,e)||!a()))return;t.renderer=v.scene.asset(t.key),t.renderer.setBarrels(t.scene.manifest.barrels||[]),ns(t);let n=await xd(e,t);if(!a())return;t.scene.runtimeBounds=n||bs(t.scene.manifest.bbox),t.renderer.setBoardBounds(t.scene.runtimeBounds),t.loadState="loaded",Ea()}catch(s){if(!a())return;console.warn(`[prism-semantic-viewer] system board ${t.key} failed to load`,s),t.loadState="failed",t.error=s?.message||String(s),v.scene.removeAsset(t.key),t.renderer=null,E===t&&ai(),Ea()}}function Ea({relabel:t=!0}={}){let e=v?.descriptor;if(!e)return;v.harnessDrawn=null;let a=Ja(),s=new Map((e.assets||[]).map(c=>[c.assetId,c])),n=new Map,r=[];for(let c of Pl(e)){let d=c.assetId?s.get(c.assetId):null,h=c.assetId?v.boards.get(c.assetId):null,u=Bl(c,d,h?.loadState),m,p,f;if(!u)m=h.key,p=jr(c.worldMatrix,d.bundleToBoard),f=fa(p,h.scene.runtimeBounds);else{if(!c.boundsMm)continue;m=`stand-in:${u}`,v.scene.standIn(m,on[u].color),p=Pr(c.worldMatrix,c.boundsMm),f=fa(p,[0,0,0,1,1,1])}n.has(m)||n.set(m,[]),n.get(m).push({matrix:p,key:c.path,hiddenLayers:u?[]:[...v.hiddenLayers.get(c.path)||[]],explode:u?null:Cd(h,v.separation.get(c.path)||0)}),r.push({occurrence:c,rendererId:m,board:u?null:h,matrix:p,worldBounds:f,standIn:u})}let i=Td();my(n,i.housings);for(let c of v.scene.assets.keys())n.has(c)||n.set(c,[]);v.scene.setOccurrences(n),v.groups=n;let o=v.placements;if(v.placed=r,v.placements=new Map(r.map(c=>[c.occurrence.path,c])),t||!o)Yy();else for(let c of r)c.label=o.get(c.occurrence.path)?.label;v.bounds=ca(r.map(c=>c.worldBounds)),v.bounds&&(K.sceneRadius=Aa(v.bounds),v.framed||(K.frame(v.bounds),v.snapped||K.snap(),v.snapped=!0,r.some(c=>c.standIn==="loading")||(v.framed=!0)));for(let c of Qe())jn(c);a!=null&&(v.placements.get(a)?.board===E?w.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(a):ai()),zt(i),Fd(),Kt()}var Ed=[.17,.18,.2],uy=[.24,.39,.87],fy=[.9,.28,.3];function Td(){if(v.worlds=new Map(v.descriptor.occurrences.map(t=>[t.path,t.worldMatrix])),!v.showHarnesses||!v.harnesses.length)return{tubes:[],housings:[]};try{let t=v.descriptor.occurrences.filter(e=>e.kind==="board"&&e.boundsMm).map(e=>({id:e.path,matrix:e.worldMatrix,...e.boundsMm}));return Cl(Sr(v.harnesses,v.nodePreview,Zt),Bn,t)}catch(t){return console.warn("[prism-semantic-viewer] harness geometry failed",t),{tubes:[],housings:[]}}}function zt(t=null){if(!v?.descriptor)return;let e=(t??Td()).tubes;v.tubes=e,v.tubedHarnesses=new Set(e.map(a=>a.harness)),v.scene.setTubes(e,Id)}var hy=[.42,.45,.5,1],by=Object.freeze([1e3,0,0,0,0,0,-1e3,0,0,1e3,0,0,0,0,0,1]);function py(t){return{...Ad(t),showBoard:!1,showComponents:!0}}function kd(t,e){return t.housing?py(e):Ad(e)}function my(t,e){let a=(s,n)=>{t.has(s)||t.set(s,[]),t.get(s).push({...n,hiddenLayers:[],explode:null})};for(let s of e){let n=`housing:${s.key}`,r=s.model?v.housingModels.get(s.model.glbKey):null;if(s.model&&!r&&gy(s.model.glbKey),r?.state==="ready"){a(`housing:${s.model.glbKey}`,{key:n,matrix:jr(s.matrix,by)});continue}v.scene.standIn("housing:proxy",hy);let i=s.model?s.model.boundsMm:{minMm:[0,0,0],maxMm:[1,1,1]};a("housing:proxy",{key:n,matrix:Pr(s.matrix,i)})}}async function gy(t){v.housingModels.set(t,{state:"loading"});let e=ge;try{let a=await ua(new URL(`/api/catalog/models/${encodeURIComponent(t)}.glb`,location.href).toString(),{fetchCache:"force-cache"});if(!me(e)||!v)return;let s=v.scene.asset(`housing:${t}`);s.housing=!0,s.setLodOverride(Os);let n=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let r of a.primitives){for(let i=0;i<3;i+=1)n[i]=Math.min(n[i],r.bounds[i]),n[i+3]=Math.max(n[i+3],r.bounds[i+3]);s.addPrimitive(r,{kind:"component",layerId:0,material:r.material,color:r.material.baseColor})}a.primitives.length&&s.setBoardBounds(n),v.housingModels.set(t,{state:"ready"})}catch(a){console.warn("[prism-semantic-viewer] housing model failed",t,a),v&&v.housingModels.set(t,{state:"failed"})}v?.descriptor&&Ea({relabel:!1})}function Bn(t){return v.worlds.get(t)??null}function Id(t){let e=v.harnessLit.get(t.harness),a=e?t.wires.map(s=>e.get(s)).find(Boolean):null;return a?{rgb:yy(a),mode:1}:t.collides.length?{rgb:fy,mode:0}:v.harnessPick?.key===t.harness?{rgb:uy,mode:0}:{rgb:Ed,mode:v.emphasisSets.length?2:0}}function yy(t){let e=/^#?([0-9a-f]{6})$/i.exec(String(t));if(!e)return Ed;let a=Number.parseInt(e[1],16);return[(a>>16&255)/255,(a>>8&255)/255,(a&255)/255]}function Ja(){return!v||!E.renderer||!Sd()?null:E.renderer.occurrenceKeys[w.selectedOccurrence]??null}function Sd(){return!!(w.selectedFeatureId||w.activeNetId||v?.boardSelected)}function Rd(t){if(E===t)return;let e=Ae;Ae=!0;try{Ee()}finally{Ae=e}E=t,_e()}function ai(){Ee(),E=Qa({key:""}),_e()}function xy(t,e){let a=performance.now(),s=Math.max(0,t-Ut),n=Math.min(.05,(t-Ut)/1e3);Ut=t,K.update(n),v.scene.resize(),ee={layerId:0,viewport:{x:0,y:0,width:O.width,height:O.height},matrix:K.matrix(O.width,O.height,!1),lod:vd(O.height/Math.min(devicePixelRatio||1,2),!1)};let r=ht(),i=new Map;for(let o of Qe()){let c=ky(o);o.scene.copperRealism!==Ta()&&ns(o),o.renderer.setInnerCopperAtFull(w.showBoard&&!Iy(o)&&!r),o.renderer.dimCopper=r,ye(t,{},o);let d=o===E;i.set(o.renderer,{activeNetId:d?w.activeNetId:0,selectedFeatureId:d?w.selectedFeatureId:0,time:t/1e3,layerOffsets:c,visibleLayers:o.visible3dLayers,showBoard:w.showBoard,showComponents:w.showComponents,showPaste:!0,componentOpacity:1,boardOpacity:r?.34:1,isolateNet:w.isolateNet,compareMode:!1,compareOffsets:new Map,layerAlphas:null,visibleTileIds:o.visibleTileIds})}v.inputs=i,v.scene.setSelectedOccurrence(E.renderer&&Sd()?E.renderer.occurrenceBase+w.selectedOccurrence:-1),o0(t,i,r)&&(v.scene.render(ee,o=>i.get(o)||kd(o,t)),mu(),Jy()),Hy(),$y(),Oy(),v.timing.boardsDrawnAt==null&&Ol(v.placed)&&(v.timing.boardsDrawnAt=performance.now());for(let o of Qe())Hd(t,o);qr(s,performance.now()-a),Xr(t),Ya(e)}function Ad(t){return{activeNetId:0,selectedFeatureId:0,time:t/1e3,visibleLayers:new Set,showBoard:!0,showComponents:!1,componentOpacity:1,boardOpacity:1,isolateNet:!1}}function vy(t,e){let a=performance.now();return v.scene.pick(ee,t,e,s=>v.inputs.get(s)||kd(s,a))}function wy(t){let e=typeof t.occurrenceKey=="string"&&t.occurrenceKey.startsWith("housing:")?t.occurrenceKey.slice(8):null;if(e){let n=e.lastIndexOf("/"),[r,i]=[e.slice(0,n),e.slice(n+1)],o=v.tubes.find(c=>c.harness===r&&(c.from===i||c.to===i));o?Tn({key:r,segmentId:o.segmentId,pointMm:null}):Ee();return}let a=t.occurrenceKey!=null?v.placements.get(t.occurrenceKey):null;if(!a)return Ee();if(a.standIn)return _d(a);let s=a.board;if(w.isolateNet&&!Ey(s,a.occurrence.path,t.featureId))return Ee();Rd(s),w.selectedOccurrence=s.renderer.occurrenceKeys.indexOf(a.occurrence.path),t.featureId&&!v.move.enabled?Ht(t.featureId,!0):vi()}function My(t){let e=t.occurrence!=null?v?.placements.get(String(t.occurrence)):null;if(e){if(e.standIn){_d(e);return}if(Rd(e.board),w.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(e.occurrence.path),t.netName||t.netUid){let a=t.netUid&&E.scene.nets.find(s=>s.uid===t.netUid)||t.netName&&Xt(E.scene.nets,t.netName);a&&ka(Number(a.id),!0)}else t.netId?ka(Number(t.netId),!0):t.featureId?Ht(Number(t.featureId),!0):t.reference?Ln(String(t.reference),!0):vi()}}function _d(t){let e=Ae;Ae=!0;try{Ee()}finally{Ae=e}v.standInKey=t.occurrence.path,v.move.enabled&&ts(),Ae||Za?.({kind:"board",sourceContext:"3D",occurrence:t.occurrence.path,standIn:t.standIn})}function Ey(t,e,a){let s=Number(t.scene.features.get(Number(a))?.netId)||0;if(!s)return!1;let n=t.renderer.occurrenceKeys.indexOf(e);return n<0?!1:t.renderer.occurrenceEmphasis?.[n]?.has(s)?!0:t===E&&n===w.selectedOccurrence&&s===Number(w.activeNetId)}function zl(t,e){let a=v?.placements.get(String(e));return a?Hr(t,a.matrix):null}function Nd(t=E){if(!v)return Ma();let e=new Set(t===E?Ma():[]);for(let a of t.renderer?.occurrenceEmphasis||[])if(a)for(let s of a.keys())e.add(Number(s));return e}function jn(t){let e=v.groups.get(t.key)||[],a=new Set;for(let s of t.scene.copperLayers){let n=Number(s.id);e.some(r=>!v.hiddenLayers.get(r.key)?.has(n))&&a.add(n)}if(w.isolateNet){let s=new Set;for(let n of Nd(t))for(let r of fi(n,t))s.add(r);t.visible3dLayers=new Set([...a].filter(n=>s.has(n)))}else t.visible3dLayers=a;ye(performance.now(),{force:!0},t)}function si(t,e){let a=t??(v.groups.get(E.key)||[]).map(s=>s.key);for(let s of a){let n=new Set(v.hiddenLayers.get(String(s))||[]);e(n,v.placements.get(String(s))?.board),v.hiddenLayers.set(String(s),n)}for(let s of Qe()){let n=v.groups.get(s.key)||[];for(let r of n)r.hiddenLayers=[...v.hiddenLayers.get(r.key)||[]];s.renderer.setOccurrenceHiddenLayers(n.map(r=>r.hiddenLayers)),jn(s)}_e(),Kt()}function Ty(){let t=Ja();if(t==null||!w.activeNetId)return;let e=fi(w.activeNetId,E);e.size&&si([t],a=>{a.clear();for(let s of E.scene.copperLayers)e.has(Number(s.id))||a.add(Number(s.id))})}function ky(t){if(t.scene.layerSteps)return t.scene.layerSteps;let e=new Float32Array(256),a=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((s,n)=>{e[Number(s.id)]=a-n}),t.scene.layerSteps=e,e}function Cd(t,e){let a=t?.scene.runtimeBounds,s=a?Math.hypot((a[3]-a[0])*1e3,(a[4]-a[1])*1e3):0;return[e*e*re(s*.12,8,25)/1e3,e<.0999?1:0,1-e*.72,1]}function Iy(t){return(v.groups.get(t.key)||[]).some(e=>(v.separation.get(e.key)||0)>.001)}function Sy(t,e){let a=e!=null?[String(e)]:(v.groups.get(E.key)||[]).map(s=>s.key);for(let s of a)v.separation.set(s,t);for(let s of Qe()){let n=v.groups.get(s.key)||[];s.renderer.setOccurrenceExplode(n.map(r=>Cd(s,v.separation.get(r.key)||0)))}Kt()}function Ry(){return v.placed.map(t=>{let e=v.hiddenLayers.get(t.occurrence.path)||new Set,a=t.board;return{key:t.occurrence.path,name:t.occurrence.displayPath||t.occurrence.path,standIn:t.standIn||null,separation:v.separation.get(t.occurrence.path)||0,layers:a?a.scene.copperLayers.map(s=>({id:Number(s.id),name:String(s.name),color:wi(On(s,a)),visible:!e.has(Number(s.id))})):[]}})}function Ay(t){if(!v)return[];let e=ht();v.emphasisSets=(Array.isArray(t)?t:[]).map((n,r)=>{let i=zi(n?.color??$n[r%$n.length]);return{key:String(n?.key??r),mark:i,color:`#${(i&16777215).toString(16).padStart(6,"0")}`,members:(Array.isArray(n?.members)?n.members:[]).filter(o=>o&&typeof o.occurrence=="string"&&typeof o.net=="string"),wires:(Array.isArray(n?.wires)?n.wires:[]).filter(o=>o&&typeof o.harness=="string"&&typeof o.wire=="string")}});let a=Fd(),s=ht();return s&&!e?Fn():!s&&e&&(w.isolateNet&&Vt(!1),Zr()),w.isolateNet&&s&&ra(),a}function Fd(){if(!v)return[];let t=new Map;for(let[r,i]of v.groups)t.set(r,i.map(()=>null));let e=new Map;for(let r of v.groups.values())r.forEach((i,o)=>e.set(i.key,o));v.emphasisBounds=new Map;let a=v.emphasisSets.map(r=>{let i={key:r.key,color:r.color,lit:0,unresolved:[]},o=[];v.emphasisBounds.set(r.key,o);for(let c of r.members){let d=v.placements.get(c.occurrence),h=d?.board;if(!h){let y=d?d.standIn==="loading"||d.standIn==="building"?"loading":d.standIn==="restricted"?"restricted":"not-drawn":"not-drawn";i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:y});continue}let u=Xt(h.scene.nets,c.net),m=Number(u?.id)||0;if(!m){i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:"unknown-net"});continue}let p=t.get(h.key),f=e.get(c.occurrence);if(!p||f==null)continue;p[f]=p[f]||new Map,p[f].has(m)||p[f].set(m,r.mark),i.lit+=1;let l=Ca(u.boundsMm);l&&o.push({occurrence:c.occurrence,box:fa(d.matrix,l)})}return i});v.harnessLit=nl(v.harnesses,v.emphasisSets),v.harnessDrawn=null,v.scene.setTubeColors(Id);for(let r of a){r.wires=0;for(let i of v.harnessLit.values())for(let o of i.values())o===r.color&&(r.wires+=1)}let s=v.emphasisSets.length>0;for(let r of Qe())r.renderer.setOccurrenceEmphasis(s&&t.get(r.key)||null,{dimCopper:s});if(w.isolateNet)for(let r of Qe())jn(r);let n=JSON.stringify(a)!==JSON.stringify(v.emphasisReport);return v.emphasisReport=a,n&&v.onEmphasis?.(a),a}function _y(t=null,e=null){let a=[];for(let[n,r]of v?.emphasisBounds||[])if(!(t!=null&&n!==String(t)))for(let i of r)(e==null||i.occurrence===e)&&a.push(i.box);let s=ca(a);return s?(K.frame(s),!0):!1}function Ny(t){let e=[];for(let s of Array.isArray(t)?t:[]){let n=v?.placements.get(String(s?.occurrence)),r=n?.board?.scene.componentFeatures.get(String(s?.reference)),i=r?n.board.scene.features.get(Number(r.featureId))?.bounds:null;i&&e.push(fa(n.matrix,i))}let a=ca(e);return a?(K.frame(a),!0):!1}var Bd=.001,Cy=90,Vl=["#e5484d","#30a46c","#3e63dd"],Lr=["X","Y","Z"];function jd(t,e){if(!t||!e)return!1;let a=Ot(t),s=Ot(e),n=[...a.translationMm,...a.rotation],r=[...s.translationMm,...s.rotation];return n.every((i,o)=>Math.abs(i-r[o])<1e-6)}function Fy(){return{allowed:!1,enabled:!1,space:"world",target:null,preview:null,drag:null,node:null}}function Pd(){let t=v.baseDescriptor;return!t||!v.move.target||!v.move.preview?t:tc(t,v.move.target,v.move.preview)}function es(){v.baseDescriptor&&(v.descriptor=Pd(),Ea({relabel:!1}))}function ni(){let t=v.move.target;return t?v.baseDescriptor?.occurrences.find(e=>e.path===t)??null:null}function Od(){let t=v.move,e=ni();return{allowed:t.allowed,enabled:t.enabled,space:t.space,dragging:!!t.drag,target:e?{occurrence:e.path,instanceId:e.instanceId,displayPath:e.displayPath,kind:e.kind,restricted:!!e.restricted,pose:Ot(t.preview??e.pose),source:t.preview?"manual":e.pose?.source??"default",unsaved:!!t.preview}:null}}function it(t){v.onMove?.({phase:t,...Od()})}function By(t){v.move.allowed=!!t,!v.move.allowed&&v.move.enabled&&En(!1)}function En(t){let e=!!t&&v.move.allowed;e!==v.move.enabled&&(e||(Ld(),v.move.node&&(v.move.node=null,v.nodePreview&&(v.nodePreview=null,zt()),ze("target"))),v.move.enabled=e,e&&ts({quiet:!0}),it("mode"))}function Dd(t){v.move.space=t==="local"?"local":"world",it("mode")}function ri(){return v.standInKey??Ja()}function ts({quiet:t=!1}={}){if(!v)return;let e=ri(),a=v.move.enabled&&e!=null?ec(v.baseDescriptor,e)?.path??null:null;a!==v.move.target&&(Ld(),v.move.target=a,t||it("target"))}function Ld(){let t=!!v.move.preview;v.move.drag=null,v.move.preview=null,v.move.target=null,t&&es()}function jy(t){v?.move.target&&(v.move.preview=t?Ot(t):null,es(),it("preview"))}function ii(){!v||!v.move.preview&&!v.move.drag||(v.move.drag=null,v.move.preview=null,es(),it("cancel"))}function Py(){let t=`${v.move.target}/`,e=ca(v.placed.filter(a=>a.occurrence.path===v.move.target||a.occurrence.path.startsWith(t)).map(a=>a.worldBounds));return e?[0,1,2].map(a=>(e[a]+e[a+3])/2/Bd):null}function Gt(t){let e=Da(ee.matrix,Be(t,Bd),ee.viewport);if(!e)return null;let a=O.getBoundingClientRect();return[e.x*a.width/O.width,e.y*a.height/O.height]}function Oy(){let t=Ke;if(!t)return;let e=v.move.enabled&&ee?ci():null,a=e?null:ni(),s=e?e.worldMm:v.move.enabled&&a&&ee?Py():null,n=s?Gt(s):null;if(!n){t.toggleAttribute("hidden",!0),v.gizmo=null;return}t.toggleAttribute("hidden",!1),t.firstChild||Dy(t);let{right:r,back:i}=K.basis(),o=Gt(Le(s,r)),c=o?Math.hypot(o[0]-n[0],o[1]-n[1]):0;if(!(c>1e-6)){t.toggleAttribute("hidden",!0);return}let d=Cy/c,h=a?v.move.preview??a.pose:null,u=h&&v.move.space==="local"?Jo(h):pr,m=[];u.forEach((f,l)=>{let y=Gt(Le(s,Be(f,d))),b=t.querySelector(`[data-part="t${l}"]`),g=y&&Math.hypot(y[0]-n[0],y[1]-n[1])>12;if(b.style.display=g?"":"none",g){let S=b.querySelector("line");S.setAttribute("x1",n[0]),S.setAttribute("y1",n[1]),S.setAttribute("x2",y[0]),S.setAttribute("y2",y[1]),b.querySelector("circle").setAttribute("cx",y[0]),b.querySelector("circle").setAttribute("cy",y[1]),b.querySelector("text").setAttribute("x",y[0]+9),b.querySelector("text").setAttribute("y",y[1]-7)}let x=ac(f),M=mt(f,x),T=[];for(let S=0;S<=64;S+=1){let R=S/64*Math.PI*2,A=Gt(Le(s,Be(Le(Be(x,Math.cos(R)),Be(M,Math.sin(R))),d*.7)));A&&T.push(`${A[0].toFixed(1)},${A[1].toFixed(1)}`)}let I=t.querySelector(`[data-part="r${l}"]`);I.setAttribute("points",T.join(" ")),I.style.display=e?"none":"",m.push({axis:f,pxPerMm:y?[(y[0]-n[0])/d,(y[1]-n[1])/d]:[0,0]})});let p=t.querySelector('[data-part="pivot"]');p.setAttribute("cx",n[0]),p.setAttribute("cy",n[1]),v.gizmo={center:n,pivot:s,handles:m,back:i}}function Dy(t){let e="http://www.w3.org/2000/svg",a=(s,n)=>{let r=document.createElementNS(e,s);for(let[i,o]of Object.entries(n))r.setAttribute(i,o);return r};Vl.forEach((s,n)=>{let r=a("polyline",{"data-part":`r${n}`,class:"ring",stroke:s,fill:"none"}),i=a("title",{});i.textContent=`Rotate about ${Lr[n]}`,r.append(i),t.append(r)}),Vl.forEach((s,n)=>{let r=a("g",{"data-part":`t${n}`,class:"arrow",stroke:s,fill:s}),i=a("title",{});i.textContent=`Move along ${Lr[n]}`;let o=a("text",{stroke:"none"});o.textContent=Lr[n],r.append(i,a("line",{}),a("circle",{r:6}),o),t.append(r)}),t.append(a("circle",{"data-part":"pivot",r:4,class:"pivot"})),t.append(a("text",{"data-part":"readout",class:"readout"})),t.addEventListener("pointerdown",Ly),t.addEventListener("pointermove",Uy),t.addEventListener("pointerup",Gy),t.addEventListener("pointercancel",()=>Ud())}function Ly(t){let e=t.target.closest?.("[data-part]")?.dataset.part;if(!v||!e||!v.gizmo||!/^[tr][012]$/.test(e))return;t.preventDefault(),t.stopPropagation();let a=Ke.getBoundingClientRect(),s=ci();if(s){if(e[0]!=="t")return;v.move.drag={kind:"node",handle:v.gizmo.handles[Number(e[1])],start:[t.clientX-a.left,t.clientY-a.top],startMm:s.worldMm,startPreview:v.nodePreview,matrix:Js(Sa(),Bn),changed:!1};try{Ke.setPointerCapture(t.pointerId)}catch{}return}let n=ni();v.move.drag={kind:e[0]==="t"?"translate":"rotate",handle:v.gizmo.handles[Number(e[1])],start:[t.clientX-a.left,t.clientY-a.top],startPose:Ot(v.move.preview??n.pose),hadPreview:!!v.move.preview,center:v.gizmo.center,pivot:v.gizmo.pivot,back:v.gizmo.back,changed:!1};try{Ke.setPointerCapture(t.pointerId)}catch{}}function Uy(t){let e=v?.move.drag;if(!e)return;let a=Ke.getBoundingClientRect(),s=[t.clientX-a.left,t.clientY-a.top],n=t.shiftKey;if(e.kind==="node"){let o=Cs(mr([s[0]-e.start[0],s[1]-e.start[1]],e.handle.pxPerMm),n?Yt.fineMm:Yt.mm),c=Le(e.startMm,Be(e.handle.axis,o));e.changed=e.changed||o!==0,v.nodePreview={harness:v.harnessPick.key,id:v.move.node,positionMm:e.matrix?Ir(e.matrix,c):c},Hl(`${o>=0?"+":""}${o.toFixed(n?1:0)} mm`,s),zt(),ze("preview");return}let r,i;if(e.kind==="translate"){let o=Cs(mr([s[0]-e.start[0],s[1]-e.start[1]],e.handle.pxPerMm),n?Yt.fineMm:Yt.mm);r=Qo(e.startPose,e.handle.axis,o),i=`${o>=0?"+":""}${o.toFixed(n?1:0)} mm`}else{let o=Yo(e.handle.axis,e.back,$o(e.center,e.start,s))*180/Math.PI,c=Cs(o,n?Yt.fineDeg:Yt.deg);r=Zo(e.startPose,e.handle.axis,c*Math.PI/180,e.pivot),i=`${c>=0?"+":""}${c.toFixed(0)}\xB0`}e.changed=e.changed||!jd(r,e.startPose),v.move.preview=Ot(r),Hl(i,s),es(),it("preview")}function Hl(t,e){let a=Ke.querySelector('[data-part="readout"]');a.textContent=t,a.setAttribute("x",e[0]+14),a.setAttribute("y",e[1]-10)}function Gy(t){let e=v?.move.drag;if(e){if(Ke.hasPointerCapture?.(t.pointerId)&&Ke.releasePointerCapture(t.pointerId),v.move.drag=null,Ke.querySelector('[data-part="readout"]').textContent="",e.kind==="node"){e.changed&&ze("commit");return}e.changed?it("commit"):e.hadPreview||ii()}}function Ud(){let t=v?.move.drag;return t?(v.move.drag=null,t.kind==="node"?(Ke.querySelector('[data-part="readout"]').textContent="",v.nodePreview=t.startPreview,zt(),ze("cancel"),!0):(v.move.preview=t.hadPreview?t.startPose:null,Ke.querySelector('[data-part="readout"]').textContent="",es(),it("cancel"),!0)):!1}function Ky(t,e){let a=v.move;if(e==="escape"){if(ea&&!ea.hidden)ea.hidden=!0;else if(!Ud()){if(!zd())if(a.node)li(null);else if(a.preview)ii();else if(v.harnessPick)Tn(null);else if(a.enabled)En(!1);else return!1}return!0}if(e==="m"&&a.allowed)En(!a.enabled);else if(e==="l"&&a.enabled)Dd(a.space==="world"?"local":"world");else if(e==="enter"&&a.node&&v.nodePreview&&!a.drag)ze("commit");else if(e==="enter"&&a.preview&&!a.drag)it("commit");else if((e==="delete"||e==="backspace")&&a.node&&a.node!==ga&&!a.drag)ze("delete");else if(t.key==="?")Gd(!!ea?.hidden);else if(e==="a")K.frame(v.bounds||na());else return!1;return!0}function Gd(t){ea&&(ea.hidden=!t)}var qa="http://www.w3.org/2000/svg";function zy(t){let e=t.occurrence?v.placements.get(t.occurrence):null;if(!e)return null;let a=t.reference&&e.board?e.board.scene.componentFeatures.get(t.reference):null,s=a?e.board.scene.features.get(Number(a.featureId))?.bounds:null;if(s)return js(e.matrix,[0,1,2].map(r=>(s[r]+s[r+3])/2));let n=e.worldBounds;return n?[0,1,2].map(r=>(n[r]+n[r+3])/2):null}function Vy(){let t=v.emphasisSets.length>0,e=[],a=[];for(let s of v.showHarnesses?v.harnesses:[]){let n=v.harnessLit.get(Zt(s)),r=il(s,n),i=new Map(s.ends.map(c=>[c.id,zy(c)]));i.set("hub",s.ends.length>2?ol([...i.values()]):null);let o=s.name||"Harness";for(let c of v.tubedHarnesses.has(Zt(s))?[]:sl(s)){let d=rl(c,n),h=document.createElementNS(qa,"line");h.setAttribute("class",`segment${d?" lit":t?" dim":""}`),d&&Object.assign(h.style,{stroke:d,color:d});let u=document.createElementNS(qa,"title");u.textContent=`${o}: ${c.wires.size} wire${c.wires.size===1?"":"s"}`,h.append(u),a.push(h),e.push({node:h,kind:"line",a:i.get(c.a),b:i.get(c.b)})}for(let c of s.ends){let d=r.get(c.id),h=document.createElementNS(qa,"circle");h.setAttribute("class",`end${d?" lit":t?" dim":""}`),h.setAttribute("r",d?"6":"4"),d&&(h.style.fill=d),a.push(h),e.push({node:h,kind:"dot",a:i.get(c.id)})}}yn.replaceChildren(...a),v.harnessDrawn={items:e,matrix:null}}function Hy(){if(!yn||!ee)return;v.harnessDrawn||Vy();let t=v.harnessDrawn;yn.toggleAttribute("hidden",!t.items.length);let e=ee.matrix.join(",");if(t.matrix===e)return;t.matrix=e;let a=O.getBoundingClientRect(),s=a.width/Math.max(1,O.width),n=a.height/Math.max(1,O.height),r=i=>{let o=i?Da(ee.matrix,i,ee.viewport):null;return o?[o.x*s,o.y*n]:null};for(let i of t.items){let o=r(i.a),c=i.kind==="line"?r(i.b):null,d=i.kind==="line"?!!(o&&c):!!o;i.node.style.display=d?"":"none",d&&(i.kind==="line"?(i.node.setAttribute("x1",o[0].toFixed(1)),i.node.setAttribute("y1",o[1].toFixed(1)),i.node.setAttribute("x2",c[0].toFixed(1)),i.node.setAttribute("y2",c[1].toFixed(1))):(i.node.setAttribute("cx",o[0].toFixed(1)),i.node.setAttribute("cy",o[1].toFixed(1))))}}function qy(t){if(!v.tubes.length||!ee)return!1;let e=O.getBoundingClientRect(),{right:a}=K.basis(),s=i=>{let o=Gt(i),c=Gt(Le(i,a));return o&&c?Math.hypot(c[0]-o[0],c[1]-o[1]):0},n=ll(v.tubes,[t.clientX-e.left,t.clientY-e.top],Gt,s);if(!n)return Tn(null),!1;let r=v.tubes[n.index];return Tn({key:r.harness,segmentId:r.segmentId,pointMm:n.pointMm}),!0}function Tn(t){if(!t&&!v.harnessPick)return;t&&(Ee(),ts({quiet:!0}));let e=t&&v.harnessPick?.key===t.key;v.harnessPick=t,e||(v.move.node=null,v.nodePreview=null),zt(),ze("select")}function Sa(){let t=v?.harnessPick;return t?v.harnesses.find(e=>Zt(e)===t.key)??null:null}function oi(t){return!!t&&!t.level&&v.move.allowed}function Pn(){let t=Sa();if(!t)return[];let e=Sr([t],v.nodePreview,Zt)[0],a=v.tubes.filter(s=>s.harness===v.harnessPick.key);return cl(e,a,Js(t,Bn)??[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}function ci(){return v.move.node?Pn().find(t=>t.id===v.move.node)??null:null}function Kd(){let t=Sa();if(!t)return{harness:null,segment:null,pointMm:null,autoMm:null,node:null,editable:!1};let e=Js(t,Bn),a=h=>e?Ir(e,h):[...h],s=v.harnessPick,n=v.tubes.find(h=>h.harness===s.key&&h.segmentId===s.segmentId),r=[];for(let h=0;n&&h+2<n.samplesMm.length;h+=3)r.push(a(n.samplesMm.slice(h,h+3)));let o=Pn().find(h=>h.auto),c=ci(),d=!!(c&&v.nodePreview?.id===c.id);return{harness:{id:t.id,level:t.level??null,name:t.name||""},segment:n?{id:n.segmentId,from:n.from,to:n.to,samplesMm:r}:null,pointMm:s.pointMm?a(s.pointMm):null,autoMm:o?a(o.worldMm):null,node:c?{id:c.id,kind:c.kind,auto:!!c.auto,pinned:c.pinned,positionMm:d?[...v.nodePreview.positionMm]:a(c.worldMm),unsaved:d}:null,editable:oi(t)}}function ze(t){v.onHarness?.({phase:t,...Kd()})}function li(t){if(!v)return;let e=t&&oi(Sa())&&v.move.enabled?String(t):null;e!==v.move.node&&(v.move.node=e,v.move.drag=null,v.nodePreview&&v.nodePreview.id!==e&&(v.nodePreview=null,zt()),ze("target"))}function Xy(t){!v?.move.node||!v.harnessPick||(v.nodePreview=t?{harness:v.harnessPick.key,id:v.move.node,positionMm:[...t]}:null,zt(),ze("preview"))}function zd(){return v?.nodePreview?(v.nodePreview=null,v.move.drag=null,zt(),ze("cancel"),!0):!1}function Wy(){if(!Sa()){v.harnessPick&&(v.harnessPick=null,v.move.node=null,v.nodePreview=null,ze("select"));return}v.move.drag||(v.nodePreview=null),v.move.node&&!Pn().some(s=>s.id===v.move.node)&&(v.move.node=null);let e=v.harnessPick,a=v.tubes.filter(s=>s.harness===e.key);if(e.pointMm&&a.length&&!a.some(s=>s.segmentId===e.segmentId)){let s=n=>{let r=1/0;for(let i=0;i+2<n.samplesMm.length;i+=3)r=Math.min(r,Math.hypot(n.samplesMm[i]-e.pointMm[0],n.samplesMm[i+1]-e.pointMm[1],n.samplesMm[i+2]-e.pointMm[2]));return r};e.segmentId=a.reduce((n,r)=>s(r)<s(n)?r:n).segmentId}ze("sync")}function $y(){let t=Zl;if(!t)return;let e=v.move.enabled&&ee?Sa():null,a=oi(e)?Pn():[];if(t.toggleAttribute("hidden",!a.length),!a.length){t.firstChild&&t.replaceChildren();return}let s=new Map([...t.children].map(r=>[r.dataset.node,r])),n=new Set;for(let r of a){let i=Gt(r.worldMm),o=s.get(r.id);if(!o){o=document.createElementNS(qa,"circle"),o.dataset.node=r.id;let c=document.createElementNS(qa,"title");o.append(c),o.addEventListener("pointerdown",d=>{d.preventDefault(),d.stopPropagation(),li(o.dataset.node)}),t.append(o)}n.add(r.id),o.setAttribute("class",`node ${r.kind}${r.auto?" auto":""}${r.pinned?" pinned":""}${r.id===v.move.node?" target":""}`),o.setAttribute("r",r.kind==="breakout"?"7":"5.5"),o.querySelector("title").textContent=r.auto?"Automatic breakout: drag to place it":r.kind==="breakout"?"Breakout":r.pinned?"Pinned waypoint":"Waypoint",o.style.display=i?"":"none",i&&(o.setAttribute("cx",i[0].toFixed(1)),o.setAttribute("cy",i[1].toFixed(1)))}for(let[r,i]of s)n.has(r)||i.remove()}function Yy(){aa&&(v.labelsDrawn=null,aa.replaceChildren(...v.placed.map(t=>{let e=document.createElement("div");e.className=`scene-label${t.standIn?` stand-in ${t.standIn}`:""}`;let a=document.createElement("strong");a.textContent=t.occurrence.displayPath||t.occurrence.labels?.join(" / ")||t.occurrence.path,e.append(a);let s=t.standIn?on[t.standIn]?.label:"";if(s){let n=document.createElement("span");n.textContent=s,e.append(n)}return t.label=e,e})))}function Jy(){if(!aa||!ee)return;if(aa.hidden=!v.showLabels,!v.showLabels){v.labelsDrawn=null;return}let t=O.getBoundingClientRect(),e=ri(),a=`${e}|${t.width}x${t.height}|${Array.prototype.join.call(ee.matrix,",")}`;if(v.labelsDrawn?.placed===v.placed&&v.labelsDrawn.key===a)return;v.labelsDrawn={placed:v.placed,key:a};let s=t.width/Math.max(1,O.width),n=t.height/Math.max(1,O.height);for(let r of v.placed){if(!r.label)continue;let[i,o,,c,d,h]=r.worldBounds,u=Da(ee.matrix,[(i+c)/2,(o+d)/2,h],ee.viewport),m=u&&u.x>=0&&u.y>=0&&u.x<=O.width&&u.y<=O.height;r.label.hidden=!m,m&&(r.label.style.transform=`translate(${(u.x*s).toFixed(1)}px, ${(u.y*n).toFixed(1)}px) translate(-50%, -100%)`),r.label.classList.toggle("selected",e===r.occurrence.path)}}function Qy(t,e=E){return Pi(t,e.scene.copperLayers)}async function Vd(t=ge,e=E){let a=e.semanticGeometry.assets?.components_glb;if(!a||e.scene.componentTier!=="idle")return;e.scene.componentTier="loading";let s;try{s=await ua(new URL(a,location.href).toString(),{componentFeatures:e.scene.componentFeatures,fetchBytes:kn(e)})}catch(n){throw me(t)&&(e.scene.componentTier="idle"),n}if(!(!me(t)||!e.renderer)){e.scene.componentTier="loaded",e.loadedBytes+=s.byteLength;for(let n of s.primitives){let r=e.scene.componentFeatures.get(n.designator);r&&t0(r.featureId,n.position,e)}v&&(v.harnessDrawn=null,v.labelsDrawn=null);for(let[n,r]of s.componentNodeCounts||[])e.scene.componentModelCounts.set(n,r);e.hiddenComponentRequest&&cu(e.hiddenComponentRequest),e.scene.componentEntries=hs(s.primitives).map(n=>e.renderer.addPrimitive(n,{kind:"component",layerId:0,material:n.material,color:n.material.baseColor}))}}function kn(t=E){return t.assetCache?e=>t.assetCache.fetchBytes(e):void 0}function Hd(t,e=E){if(!e.renderer||t-(e.tiersCheckedAt||0)<250)return;e.tiersCheckedAt=t;let a=e.renderer.identityOnly&&!e.deferComponents||!e.renderer.identityOnly&&e.renderer.cullCounts.full>0;a&&(e.scene.componentsWantedAt=t),a&&e.scene.componentTier==="idle"&&e.semanticGeometry.assets?.components_glb&&Vd(ge,e).then(()=>{v&&e.renderer&&e.scene.componentTier==="loaded"&&Vr(e.scene.runtimeBounds,e)}).catch(n=>console.warn("Failed to load components",n));let s=()=>v?v.scene.gpuMemoryBytes():e.renderer.gpuMemoryBytes();e.gpuBytes=s(),!(e.gpuBytes<=w.gpuBudgetBytes)&&(e.scene.componentTier==="loaded"&&t-e.scene.componentsWantedAt>Gg&&(e.renderer.removeEntries(e.scene.componentEntries),e.scene.componentEntries=[],e.scene.componentTier="idle",e.scene.componentEvictions+=1,e.gpuBytes=s()),e.gpuBytes>w.gpuBudgetBytes&&md(e.visibleTileIds||new Set,Math.max(0,e.residentTileGpuBytes-(e.gpuBytes-w.gpuBudgetBytes)),e))}var ql=4e-4,Xl=5e-5,Zy={baseColor:[.62,.7,.8,1],metallic:0,roughness:.8,emissive:[0,0,0]};function Vr(t,e=E){if(!e.renderer)return;let a=new Map;for(let i of e.topology.physical_objects||[])i.kind==="footprint_body"&&i.designator&&i.bbox_mm?.length===4&&a.set(i.designator,i);let s=(t?.[5]??8e-4)+Xl,n=(t?.[2]??-8e-4)-Xl,r=[];for(let i of e.scene.componentFeatures.values()){let o=Number(i.featureId),c=e.scene.features.get(o),d=a.get(i.designator);if(!c||c.bounds||!d)continue;let[h,u,m,p]=d.bbox_mm.map(Number),f=String(d.layer||"").startsWith("B."),l=[h/1e3,-p/1e3,f?n-ql:s,m/1e3,-u/1e3,f?n:s+ql];c.bounds=l,c.placeholder=!0,r.push(e0(l,o))}if(r.length)for(let i of hs(r))e.renderer.addPrimitive(i,{kind:"component",layerId:0,material:i.material,color:i.material.baseColor,opacityScale:.3,translucent:!0,placeholder:!0})}function e0([t,e,a,s,n,r],i){let o=[[[0,0,1],[[t,e,r],[s,e,r],[s,n,r],[t,n,r]]],[[0,0,-1],[[t,n,a],[s,n,a],[s,e,a],[t,e,a]]],[[1,0,0],[[s,e,a],[s,n,a],[s,n,r],[s,e,r]]],[[-1,0,0],[[t,n,a],[t,e,a],[t,e,r],[t,n,r]]],[[0,1,0],[[s,n,a],[t,n,a],[t,n,r],[s,n,r]]],[[0,-1,0],[[t,e,a],[s,e,a],[s,e,r],[t,e,r]]]],c=new Float32Array(72),d=new Float32Array(72),h=new Uint32Array(36);return o.forEach(([u,m],p)=>{m.forEach((l,y)=>{c.set(l,(p*4+y)*3),d.set(u,(p*4+y)*3)});let f=p*4;h.set([f,f+1,f+2,f,f+2,f+3],p*6)}),{position:c,normal:d,netId:new Uint32Array(24),objectFeatureId:new Uint32Array(24).fill(i),indices:h,material:Zy,bounds:[t,e,a,s,n,r]}}function t0(t,e,a=E){let s=a.scene.features.get(Number(t));if(!s||!e.length)return;let n=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let r=0;r<e.length;r+=3)n[0]=Math.min(n[0],e[r]),n[1]=Math.min(n[1],e[r+1]),n[2]=Math.min(n[2],e[r+2]),n[3]=Math.max(n[3],e[r]),n[4]=Math.max(n[4],e[r+1]),n[5]=Math.max(n[5],e[r+2]);s.bounds=s.bounds?[Math.min(s.bounds[0],n[0]),Math.min(s.bounds[1],n[1]),Math.min(s.bounds[2],n[2]),Math.max(s.bounds[3],n[3]),Math.max(s.bounds[4],n[4]),Math.max(s.bounds[5],n[5])]:n}function On(t,e=E){return Ci(t,e.scene.copperLayers)}var a0=[.55,.35,.16,.78];function qd(t=E){return Bi(t.topology?.board?.stackup?.copper_finish)}function Xd(t,e=E){return ji(t,e.scene.copperLayers)}var s0=.25;function Ta(){return!w.realisticColors||w.mode==="layer"?0:1-re(w.separation/s0,0,1)}function Wd(t,e=E){let a=Xd(t,e)?qd(e):Na.copper;return $d(On(t,e),a,Ta())}function $d(t,e,a){return t.map((s,n)=>s+(e[n]-s)*a)}function n0(t,e=ge){if(e===ge&&v&&K){xy(t,e);return}if(e!==ge||!E.renderer||!K)return;let a=performance.now(),s=Math.max(0,t-Ut);if(w.workspace==="schematic"&&N){Ut=t;let d=N.visiblePages(),h=J?l0(d):[];N.setDomDetailPageIds(h.map(u=>u.id)),D.visiblePages=N.render(),J?.syncWorldPages(h,N,{activeNetUid:D.activeNetUid}),yu(),qr(s,performance.now()-a),Xr(t),Ya(e);return}let n=Math.min(.05,(t-Ut)/1e3);Ut=t,K.update(n),E.renderer.resize();let r=Qd();E.scene.copperRealism!==Ta()&&ns();for(let d of E.renderer.entries)d.layerOffset=r[d.layerId]||0;d0(t),sa=Zd(t);let i=f0(t);ee={layerId:0,viewport:{x:0,y:0,width:O.width,height:O.height},matrix:K.matrix(O.width,O.height,w.mode==="layer"),lod:vd(O.height,w.mode==="layer")},E.renderer.selectedOccurrence=w.selectedFeatureId||w.activeNetId?w.selectedOccurrence:-1,E.renderer.setInnerCopperAtFull(w.showBoard&&w.separation<=.001&&!Ma().size),ye(t);let o=w.mode==="3d"?E.visible3dLayers:hd(),c={panels:[ee],activeNetId:w.activeNetId,selectedFeatureId:w.selectedFeatureId,time:t/1e3,layerOffsets:r,visibleLayers:o,showBoard:w.showBoard,showComponents:w.showComponents,showPaste:w.separation===0,componentOpacity:re(1-w.separation/.1,0,1),boardOpacity:Ma().size?.34:1-w.separation*.72,isolateNet:w.isolateNet,compareMode:w.mode==="layer",compareOffsets:sa,layerAlphas:i,visibleTileIds:w.mode==="3d"?E.visibleTileIds:null};r0(t,c)&&(E.renderer.render(c),mu(),_0()),Hd(t),qr(s,performance.now()-a),Xr(t),Ya(e)}var Yd=1e3,st={key:"",matrix:new Float32Array(16),tiles:null,at:0};function r0(t,e){let a=e.panels[0].matrix,s=!1;for(let o=0;o<16;o+=1)if(a[o]!==st.matrix[o]){s=!0;break}if(s)return st.matrix.set(a),st.key="",st.at=t,!0;let n=[O.width,O.height,E.renderer.version,E.renderer.selectedOccurrence,w.workspace,w.mode,e.activeNetId,e.selectedFeatureId,e.showBoard,e.showComponents,e.showPaste,e.componentOpacity,e.boardOpacity,e.isolateNet,E.scene.layerZOffsetSignature,[...e.visibleLayers].join(","),[...e.compareOffsets].map(([o,c])=>`${o}:${c}`).join(";"),e.layerAlphas?[...e.layerAlphas].join(";"):""].join("|");return!!(e.activeNetId||e.selectedFeatureId||E.renderer.emphasizedNetIds.size)||n!==st.key||!Jd(e.visibleTileIds,st.tiles)||t-st.at>Yd?(st.key=n,st.tiles=e.visibleTileIds,st.at=t,!0):!1}var i0=1e3/30-2,Pe={scene:null,key:"",matrix:new Float32Array(16),tiles:new Map,at:0};function o0(t,e,a){let s=ee.matrix,n=!1;for(let m=0;m<16;m+=1)if(s[m]!==Pe.matrix[m]){n=!0;break}if(Pe.scene!==v.scene&&(Pe.scene=v.scene,n=!0),n)return Pe.matrix.set(s),Pe.key="",Pe.at=t,!0;let r=[O.width,O.height,w.showBoard,w.showComponents,w.isolateNet,w.activeNetId,w.selectedFeatureId,w.selectedOccurrence,v.showLabels,a,Ta(),ri(),v.scene.tubeVersion];for(let m of v.scene.renderers){let p=e.get(m);r.push(m.version,m.occurrenceCount,m.selectedOccurrence,m.dimCopper,m.standIn?m.boxColor.join(","):"",p?[...p.visibleLayers].join(","):"",p?.layerOffsets?Array.prototype.join.call(p.layerOffsets,","):"")}let i=r.join("|"),o=!1;for(let[m,p]of e)Jd(p.visibleTileIds,Pe.tiles.get(m))||(o=!0);let c=!!(a||w.activeNetId||w.selectedFeatureId),d=o||i!==Pe.key,h=c&&t-Pe.at>=i0;return d||h||t-Pe.at>Yd?(Pe.key=i,Pe.tiles=new Map([...e].map(([m,p])=>[m,p.visibleTileIds])),Pe.at=t,!0):!1}function Jd(t,e){if(!t||!e)return t===e;if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function c0(t){if(!N||!t)return{widthPx:0,heightPx:0,sourcePxPerMm:0,area:0};let e=N.pagePixelWidth(t),a=t.heightMm/Math.max(1e-6,N.scale),s=N.pageSourcePixelsPerMm(t);return{widthPx:e,heightPx:a,sourcePxPerMm:s,area:e*a}}function l0(t){if(!J||!N)return[];let e=t||[],a=Math.max(1,Re.clientWidth*Re.clientHeight);return e.map(r=>({page:r,...c0(r)})).filter(r=>r.widthPx>=760&&r.heightPx>=520&&r.area>=a*.36&&r.sourcePxPerMm>=1.25).sort((r,i)=>i.area-r.area).slice(0,1).map(r=>r.page)}function Qd(t=E){let e=na(t),a=Math.hypot((e[3]-e[0])*1e3,(e[4]-e[1])*1e3),s=w.separation*w.separation*re(a*.12,8,25)/1e3,n=`${w.separation}:${s}:${t.scene.copperLayers.length}`;if(t.scene.layerZOffsetSignature===n)return t.scene.layerZOffsets;let r=t.scene.layerZOffsets;r.fill(0);let i=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((o,c)=>{r[Number(o.id)]=(i-c)*s}),t.scene.layerZOffsetSignature=n,r}function Zd(t){if(w.mode!=="layer")return we.key="3d",we.current.clear(),new Map;let e=E.scene.copperLayers.filter(y=>E.compareLayers.has(Number(y.id))),a=Math.max(1,e.length),s=O.width/Math.max(1,O.height),n=1;a===2?n=s>=1?2:1:a===3||a===4?n=2:a>4&&(n=Math.ceil(Math.sqrt(a*s)));let r=Math.ceil(a/n),i=na(),o=i[3]-i[0],c=i[4]-i[1],d=o*1.18,h=c*1.22,u=e.map((y,b)=>{let g=b%n,x=Math.floor(b/n);return{layer:y,layerId:Number(y.id),column:g,row:x,offset:[(g-(n-1)/2)*d,((r-1)/2-x)*h,0]}}),m=`${n}x${r}:${u.map(y=>y.layerId).join(",")}`;if(m!==we.key){we.key=m,we.started=t,we.from=new Map(we.current);let y=n*o+(n-1)*(d-o),b=r*c+(r-1)*(h-c);K.targetFocus=[(i[0]+i[3])/2,(i[1]+i[4])/2,(i[2]+i[5])/2],K.targetOrthoScale=Math.max(b,y/s)*1.08}let p=re((t-we.started)/420,0,1),f=1-Math.pow(1-p,3),l=new Map;for(let y of u){let b=we.from.get(y.layerId)||[0,0,0],g=y.offset.map((x,M)=>b[M]+(x-b[M])*f);l.set(y.layerId,g),we.current.set(y.layerId,g)}if(q.phase==="reveal")for(let y of q.previous)l.has(Number(y))||l.set(Number(y),q.previousOffsets.get(Number(y))||[0,0,0]);for(let y of[...we.current.keys()])u.some(b=>b.layerId===y)||we.current.delete(y);return l}function as(t){let e=new Set([...t].map(Number));if(!(Wl(e,E.desiredCompareLayers)&&q.phase!=="idle")){if(E.desiredCompareLayers=e,Wl(e,E.compareLayers)){q.phase="idle",q.previous.clear(),q.target.clear();return}q.phase="preload",q.previous=new Set(E.compareLayers),q.target=new Set(e),q.previousOffsets=new Map(we.current),q.started=performance.now(),ye(q.started,{force:!0})}}function di({snap:t=!0}={}){w.mode="layer";let e=ey();E.desiredCompareLayers=new Set(e),!E.compareLayers.size&&e.size&&(E.compareLayers=new Set(e)),q.phase="idle",q.previous.clear(),q.target.clear(),we.key="",K.setAxis("z",!1),E.renderer?.resize(),sa=Zd(performance.now()),t&&K.snap(),ye(performance.now(),{force:!0})}function d0(t){if(!(w.mode!=="layer"||q.phase==="idle")){if(q.phase==="preload"){if(!u0(q.target)){ye(t,{force:!0});return}q.phase="reveal",q.started=t,q.previousOffsets=new Map(we.current),E.compareLayers=new Set(q.target),we.key="";return}q.phase==="reveal"&&t-q.started>=Ql&&(E.compareLayers=new Set(q.target),q.phase="idle",q.previous.clear(),q.target.clear(),q.previousOffsets.clear(),ye(t,{force:!0}))}}function u0(t,e=E){for(let a of e.scene.tiles.values())if(t.has(Number(a.layerId))&&!e.scene.residentTiles.has(a.id)&&!e.scene.failed.has(a.id))return!1;return!0}function f0(t){if(w.mode!=="layer"||q.phase!=="reveal")return null;let e=re((t-q.started)/Ql,0,1),a=e*e*(3-2*e),s=new Map;for(let n of q.previous)s.set(Number(n),q.target.has(Number(n))?1:1-a);for(let n of q.target)s.set(Number(n),q.previous.has(Number(n))?1:a);return s}function Wl(t,e){if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function ui(){if(w.workspace==="schematic"){b0();return}if(w.workspace==="bom"){h0();return}if(w.workspace==="stackup")return;Rn.textContent=E.viewerReadiness.stage==="semantic-ready"?"Semantic GLTF A0":"Prism staged 3D",An.textContent="Layers",_n.textContent="Visibility and compare",$('[data-panel="search"] .section-heading span').textContent="Nets, components and pins",$('[data-panel="view"] .section-heading span').textContent="Camera and stackup";let t=`
    <div class="mode-toolbar">
      <button data-mode="layer">PCB</button>
      <button data-mode="3d">3D</button>
    </div>`;va&&(va.innerHTML=t),Ye.innerHTML=`
    ${va?"":t}
    <div class="layer-presets">
      <button data-preset="all">All</button><button data-preset="none">None</button>
      <button data-preset="outer">Outer</button><button data-preset="inner">Inner</button>
    </div>
    <div class="layer-list"></div>`,pe.innerHTML=`
    <label class="control-field"><span>Search</span>
      <input id="entity-search" class="layer-select" type="search" placeholder="Net, component or pin">
      <div id="search-results" class="search-results"></div>
    </label>
    <div class="quick-actions">
      <button id="frame-selection">Frame</button>
      <button id="show-net-layers">Net layers</button>
      <button id="isolate-net" aria-keyshortcuts="I" title="Toggle isolated net view (I)">Isolate</button>
      <button id="clear-selection">Clear</button>
    </div>`,Fe.innerHTML=`
    <div class="toggle-list">
      <label class="toggle-row"><input id="show-board" type="checkbox"><span>Board substrate</span></label>
      <label class="toggle-row"><input id="show-components" type="checkbox"><span>Components</span></label>
    </div>
    <label class="control-field range-field"><span>Stackup separation</span>
      <input id="separation" type="range" min="0" max="1" step="0.002">
    </label>`,_e(),v0()}function h0(){Rn.textContent="BoM A0",An.textContent="Bill of Materials",_n.textContent="Grouped procurement view",$('[data-panel="search"] .section-heading span').textContent="Search inside the BoM table",$('[data-panel="view"] .section-heading span').textContent="BoM actions";let t=Je?.payload?.counts||{};Ye.innerHTML=`
    <div class="selection-properties">
      <div class="selection-property"><small>Rows</small><strong>${t.rows||0}</strong></div>
      <div class="selection-property"><small>Components</small><strong>${t.components||0}</strong></div>
      <div class="selection-property"><small>DNP</small><strong>${t.dnpComponents||0}</strong></div>
    </div>
    <div class="selection-section">
      <span class="selection-section-title">Columns</span>
      <div class="selection-empty">Primary procurement and thermal columns are shown first. Additional symbol and footprint metadata is available in the row detail panel.</div>
    </div>`,pe.innerHTML=`
    <div class="selection-empty">Use the BoM search box in the main view. Reference chips update the shared PCB and schematic selection without changing workspaces.</div>
    <div class="quick-actions">
      <button id="clear-selection">Clear</button>
    </div>`,Fe.innerHTML=`
    <div class="selection-section">
      <span class="selection-section-title">Cross-probing</span>
      <div class="selection-table">
        <div class="selection-row"><span><strong>PCB/Schematic</strong></span><span>Select component</span><span>Highlights matching BoM row</span></div>
        <div class="selection-row"><span><strong>BoM reference</strong></span><span>Click chip</span><span>Holds component selection for PCB and schematic</span></div>
      </div>
    </div>`,pe.querySelector("#clear-selection")?.addEventListener("click",Ee)}function b0(){Rn.textContent=J?"Schematic SVG DOM":D.manifest?.schema==="prism.schematic_vector_a0"?"Schematic Vector A0":"Schematic World A0",An.textContent="Pages",_n.textContent=`${D.pages.length} hierarchy instances`,$('[data-panel="search"] .section-heading span').textContent="Pages, nets and components",$('[data-panel="view"] .section-heading span').textContent="World navigation",Ye.innerHTML=`
    <div class="layer-presets">
      <button data-page-action="world">Fit world</button>
      <button data-page-action="parent">Parent</button>
      <button data-page-action="previous">Previous</button>
      <button data-page-action="next">Next</button>
    </div>
    <div class="page-list">${D.pages.map(t=>`
      <button class="page-row ${t.id===w.selectedPageId?"active":""}" data-page="${t.id}">
        <span>${t.sheetNumber}</span>
        <strong>${G(t.name)}</strong>
        <small>L${t.depth}</small>
      </button>`).join("")}</div>`,pe.innerHTML=`
    <label class="control-field"><span>Search</span>
      <input id="entity-search" class="layer-select" type="search" placeholder="Page, net or component">
      <div id="search-results" class="search-results"></div>
    </label>
    <div class="quick-actions">
      <button id="frame-selection">Frame</button>
      <button id="clear-selection">Clear</button>
    </div>`,Fe.innerHTML=`
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
    </div>`,Ye.querySelectorAll("[data-page]").forEach(t=>{t.addEventListener("click",()=>bt(t.dataset.page,!0))}),Ye.querySelectorAll("[data-page-action]").forEach(t=>{t.addEventListener("click",()=>fn(t.dataset.pageAction))}),pe.querySelector("#entity-search").addEventListener("input",t=>{m0(t.target.value)}),pe.querySelector("#frame-selection").addEventListener("click",au),pe.querySelector("#clear-selection").addEventListener("click",ss),Fe.querySelector("#show-hierarchy").checked=N?.showHierarchy??!0,Fe.querySelector("#show-hierarchy").addEventListener("change",t=>{N.showHierarchy=t.target.checked})}function bt(t,e){let a=D.byId.get(t);!a||!N||(w.selectedPageId=a.id,w.selectedSchematicFeature=null,N.selectedPageId=a.id,N.selectedFeatureId=0,rt.textContent=JSON.stringify(a,null,2),e&&N.framePage(a),Ye.querySelectorAll("[data-page]").forEach(s=>{s.classList.toggle("active",s.dataset.page===a.id)}))}function fn(t){if(!N)return;if(t==="world"){N.frameWorld();return}let e=Math.max(0,D.pages.findIndex(s=>s.id===w.selectedPageId)),a=null;t==="previous"?a=D.pages[(e-1+D.pages.length)%D.pages.length]:t==="next"?a=D.pages[(e+1)%D.pages.length]:t==="parent"&&(a=D.byId.get(D.pages[e]?.parentId)),a&&bt(a.id,!0)}function p0(t){if(!t||!N)return;if(ss(),t.kind==="page"&&t.pageId){bt(t.pageId,!0);return}if(t.kind!=="sheet")return;let e=D.pages.find(r=>r.sheetInstancePath===t.sheetInstancePath)||D.byId.get(w.selectedPageId),a=String(t.sheetFile||t.feature?.sheet_file||"").replace(/\\/g,"/"),s=String(t.sheetName||t.feature?.sheet_name||t.feature?.objectId||""),n=D.pages.find(r=>{if(e&&r.parentId&&r.parentId!==e.id)return!1;let i=String(r.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&r.name===s})||D.pages.find(r=>{let i=String(r.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&r.name===s});n&&bt(n.id,!0)}function m0(t){let e=pe.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=D.pages.filter(r=>`${r.name} ${r.sheetPath}`.toLowerCase().includes(a)).slice(0,8),n=E.scene.nets.filter(r=>String(r.name).toLowerCase().includes(a)).slice(0,8);e.innerHTML=[...s.map(r=>`<button data-page="${r.id}"><b>${G(r.name)}</b><span>Page ${r.sheetNumber}</span></button>`),...n.map(r=>`<button data-schematic-net="${r.id}"><b>${G(r.name)}</b><span>${(D.manifest.netToPages?.[r.uid]||[]).length} pages</span></button>`)].join(""),e.querySelectorAll("[data-page]").forEach(r=>{r.addEventListener("click",()=>bt(r.dataset.page,!0))}),e.querySelectorAll("[data-schematic-net]").forEach(r=>{r.addEventListener("click",()=>eu(Number(r.dataset.schematicNet),!0))})}function eu(t,e){let a=E.scene.nets.find(n=>Number(n.id)===t);if(!a||!N)return;w.activeNetId=t,w.selectedFeatureId=0,w.selectedSchematicFeature=null,N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId="",D.activeNetUid=a.uid,N.activeNetUid=a.uid,J?.setHighlightedNet(a.uid),rt.textContent=JSON.stringify(a,null,2),Ve();let s=D.manifest.netToPages?.[a.uid]||[];e&&s.length&&bt(s[0],!0)}function tu(t,e=null){let a=E.scene.nets.find(s=>s.uid===t);a&&(w.activeNetId=Number(a.id),D.activeNetUid=a.uid,N&&(N.activeNetUid=a.uid,N.selectedFeatureId=Number(e?.feature?.id||e?.featureId||0),N.selectedFeatureKey=e?.feature?.stableKey||e?.featureKey||"",N.selectedSourceId=e?.feature?.sourceId||e?.sourceId||""),J?.setHighlightedNet(a.uid),e&&(w.selectedSchematicFeature={...e,pageId:w.selectedPageId}),rt.textContent=JSON.stringify(e?{...e,net:a}:a,null,2),Ve())}function ss(){w.activeNetId=0,w.selectedFeatureId=0,w.selectedSchematicFeature=null,D.activeNetUid="",N&&(N.activeNetUid="",N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId=""),J?.setSelection(null),J?.setHighlightedNet(""),rt.textContent="No object selected",Ve()}function au(){let t=D.byId.get(w.selectedPageId);t?N.framePage(t):N.frameWorld()}function g0(t){w.selectedPageId=t.sheetInstancePath&&D.pages.find(s=>s.sheetInstancePath===t.sheetInstancePath)?.id||w.selectedPageId,w.selectedFeatureId=0,w.selectedSchematicFeature={...t,pageId:w.selectedPageId},t.anchor&&(w.selectionAnchor=t.anchor),N&&(N.selectedPageId=w.selectedPageId,N.selectedFeatureId=Number(t.feature?.id||0));let e=t.netUid?E.scene.nets.find(s=>s.uid===t.netUid):null,a=t.reference?E.scene.componentFeatures.get(t.reference):null;a&&(w.selectedFeatureId=Number(a.featureId||0),Je?.setSelectionByReference(t.reference,{scroll:w.workspace==="bom"})),rt.textContent=JSON.stringify({...t,net:e,component:a},null,2),Ve()}function y0(t){let{page:e,feature:a}=t;if(!a){w.selectedSchematicFeature=null,N.selectedFeatureId=0,bt(e.id,!1),Ve();return}let s=Number(a.id||0);if(w.selectedPageId=e.id,N.selectedPageId=e.id,N.selectedFeatureId=s,w.selectedSchematicFeature={...a,pageId:e.id},w.selectionAnchor=null,a.netUid){let n=E.scene.nets.find(r=>r.uid===a.netUid);if(n){eu(Number(n.id),!1),w.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}if(a.reference){let n=E.scene.componentFeatures.get(a.reference);if(n){Ht(Number(n.featureId),!1),w.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}w.activeNetId=0,w.selectedFeatureId=0,N.activeNetUid="",rt.textContent=JSON.stringify({page:e.name,...a},null,2),Ve()}function ia(){let t=w.isolateNet,e=pe?.querySelector?.("#isolate-net");e?.classList.toggle("active",t),e?.setAttribute("aria-pressed",String(t));let a=Z?.querySelector?.("[data-action=isolate]");a?.classList.toggle("active",t),a?.setAttribute("aria-pressed",String(t));let s=Fe?.querySelector?.("#show-board");s&&(s.checked=w.showBoard);let n=Fe?.querySelector?.("#show-components");n&&(n.checked=w.showComponents),Kt()}function x0(){let t=new Set;for(let e of Ma())for(let a of fi(e))t.add(a);return t}function fi(t,e=E){let a=new Set,s=e.scene.nets.find(r=>Number(r.id)===Number(t)),n=new Set(e.scene.copperLayers.map(r=>Number(r.id)));for(let r of Object.keys(s?.layerBoundsMm||{})){let i=Number(r);n.has(i)&&a.add(i)}if(!a.size){let r=new Map(e.scene.copperLayers.map(i=>[i.name,Number(i.id)]));for(let i of s?.metrics?.layers||[]){let o=r.get(i);o!=null&&a.add(o)}}if(a.size)return a;for(let r of e.scene.tiles.values())yd(r,t)&&a.add(Number(r.layerId));return a}function ra(){if(v){for(let e of Qe())jn(e);return}let t=x0();t.size&&(E.visible3dLayers=new Set(t),w.mode==="layer"?as(t):(E.compareLayers=new Set(t),E.desiredCompareLayers=new Set(t)),ye(performance.now(),{force:!0}))}function Vt(t){let e=!!(t&&ht()),a=w.isolateNet;if(e&&!w.isolateNet&&!v&&(E.preIsolation3dLayers=new Set(E.visible3dLayers),E.preIsolationCompareLayers=new Set(E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers)),w.isolateNet=e,v)ra();else if(w.isolateNet)ra();else if(E.preIsolation3dLayers||E.preIsolationCompareLayers){if(E.preIsolation3dLayers&&(E.visible3dLayers=new Set(E.preIsolation3dLayers)),E.preIsolationCompareLayers){let s=new Set(E.preIsolationCompareLayers);w.mode==="layer"?as(s):(E.compareLayers=s,E.desiredCompareLayers=new Set(s))}E.preIsolation3dLayers=null,E.preIsolationCompareLayers=null,ye(performance.now(),{force:!0})}e&&!a?(w.preIsolationShowBoard=w.showBoard,w.showBoard=!1):!e&&a&&(typeof w.preIsolationShowBoard=="boolean"&&(w.showBoard=w.preIsolationShowBoard),w.preIsolationShowBoard=null),ia(),_e()}function _e(){(va||Ye).querySelectorAll("[data-mode]").forEach(a=>{let s=a.dataset.mode===w.mode;a.classList.toggle("active",s),a.setAttribute("aria-pressed",String(s))}),Fe.querySelector("#show-board").checked=w.showBoard,Fe.querySelector("#show-components").checked=w.showComponents,Fe.querySelector("#separation").value=w.separation;let t=Ye.querySelector(".layer-list"),e=w.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;t.innerHTML=E.scene.copperLayers.map((a,s)=>`
    <label class="layer-row">
      <input type="checkbox" data-layer="${a.id}" ${e.has(Number(a.id))?"checked":""}>
      <span class="swatch" style="background:${wi(On(a))}"></span>
      <span>${G(a.name)}</span><small>${s+1}</small>
    </label>`).join(""),t.querySelectorAll("[data-layer]").forEach(a=>a.addEventListener("change",()=>{hi(Number(a.dataset.layer),a.checked)})),ia()}function su(t){t==="layer"?di():(w.mode="3d",K.frame(na()),K.snap(),E.visibleTileIds=new Set,ye(performance.now(),{force:!0})),_e()}function hi(t,e,a=null){if(v){let s=Number(t);si(a==null?null:[a],n=>e?n.delete(s):n.add(s));return}if(w.mode==="3d")e?E.visible3dLayers.add(t):E.visible3dLayers.delete(t),ye(performance.now(),{force:!0});else{let s=new Set(E.desiredCompareLayers);e?s.add(t):s.delete(t),as(s)}_e()}function bi(t,e=null){if(v){si(e==null?null:[e],(s,n)=>{let r=n?.scene.copperLayers||[];s.clear(),r.forEach((i,o)=>{t==="all"||t==="outer"&&(o===0||o===r.length-1)||t==="inner"&&o>0&&o<r.length-1||s.add(Number(i.id))})});return}let a=w.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let[s,n]of E.scene.copperLayers.entries())(t==="all"||t==="outer"&&(s===0||s===E.scene.copperLayers.length-1)||t==="inner"&&s>0&&s<E.scene.copperLayers.length-1)&&a.add(Number(n.id));w.mode==="3d"?ye(performance.now(),{force:!0}):as(a),_e()}function pi(t){w.showBoard=!!t,w.savedShowBoard=w.showBoard,w.showBoard&&w.isolateNet?Vt(!1):ia()}function mi(t){w.showComponents=!!t,w.savedShowComponents=w.showComponents,ia()}function nu(t){w.showPlaceholders=!!t;for(let e of v?Qe():[E])e.renderer?.setPlaceholdersVisible(w.showPlaceholders);Kt()}function ru(t){w.realisticColors=!!t,ns(),Kt()}function ns(t=E){if(!t.renderer)return;let e=new Map(t.scene.layers.map(a=>[Number(a.id),a]));for(let a of t.renderer.entries)a.kind==="copper"&&(a.color=Wd(e.get(Number(a.layerId)),t));t.renderer.setBarrelColor($d(a0,[...qd(t).slice(0,3),.78],Ta())),t.scene.copperRealism=Ta()}function gi(t,e=null){if(v){Sy(re(Number(t)||0,0,1),e);return}w.separation=re(Number(t)||0,0,1),Kt()}function v0(){(va||Ye).querySelectorAll("[data-mode]").forEach(e=>e.addEventListener("click",()=>{su(e.dataset.mode)})),Ye.querySelectorAll("[data-preset]").forEach(e=>e.addEventListener("click",()=>{bi(e.dataset.preset)})),Fe.querySelector("#show-board").addEventListener("change",e=>{pi(e.target.checked)}),Fe.querySelector("#show-components").addEventListener("change",e=>{mi(e.target.checked)}),Fe.querySelector("#separation").addEventListener("input",e=>{gi(e.target.value)}),pe.querySelector("#clear-selection").addEventListener("click",Ee),pe.querySelector("#isolate-net").addEventListener("click",()=>{Vt(!w.isolateNet)}),pe.querySelector("#frame-selection").addEventListener("click",xi),pe.querySelector("#show-net-layers").addEventListener("click",Dn);let t=pe.querySelector("#entity-search");t.addEventListener("input",()=>ou(t.value))}function iu(){ta(".rail-tab").forEach(t=>t.addEventListener("click",()=>{let e=t.dataset.tab,a=w.activeTab===e&&!ft.classList.contains("panel-collapsed");w.activeTab=e,ft.classList.toggle("panel-collapsed",a),ta(".rail-tab").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.tab===e)}),ta(".tab-panel").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.panel===e)})}))}function Dn(){if(v){Ty();return}let t=E.scene.nets.find(s=>Number(s.id)===w.activeNetId);if(!t)return;let e=new Set(t.metrics?.layers||[]),a=w.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let s of E.scene.copperLayers)e.has(s.name)&&a.add(Number(s.id));w.mode==="3d"?ye(performance.now(),{force:!0}):as(a),_e()}function ou(t){let e=pe.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=E.scene.nets.filter(r=>String(r.name).toLowerCase().includes(a)).slice(0,8),n=[...E.scene.componentFeatures.values()].filter(r=>!E.hiddenComponents.has(String(r.designator||""))&&`${r.designator} ${r.value} ${r.footprint}`.toLowerCase().includes(a)).slice(0,6);e.innerHTML=[...s.map(r=>`<button data-net="${r.id}"><b>${G(r.name)}</b><span>${G(r.netClass||"")}</span></button>`),...n.map(r=>`<button data-feature="${r.featureId}"><b>${G(r.designator)}</b><span>${G(r.value)}</span></button>`)].join(""),e.querySelectorAll("[data-net]").forEach(r=>{r.addEventListener("click",()=>ka(Number(r.dataset.net),!0))}),e.querySelectorAll("[data-feature]").forEach(r=>{r.addEventListener("click",()=>Ht(Number(r.dataset.feature),!0))})}function ka(t,e){e&&(w.selectionAnchor=null),w.activeNetId=t,w.selectedFeatureId=0;let a=E.scene.nets.find(s=>Number(s.id)===t);w.workspace==="schematic"&&a&&N&&(D.activeNetUid=a.uid,N.activeNetUid=a.uid),Fn(),rt.textContent=JSON.stringify(a||{},null,2),Ve(),w.isolateNet&&ra(),e&&a?.boundsMm&&K.frame(Qr(Ca(a.boundsMm))),ye(performance.now(),{force:!0}),Cn(ld(a))}function Ht(t,e=!1){let a=E.scene.features.get(t);if(a?.kind==="component"&&ps(Ia(a),E.hiddenComponents))return;e&&(w.selectionAnchor=null),w.selectedFeatureId=t,w.activeNetId=Number(a?.netId||0);let s=Ia(a);s&&Je?.setSelectionByReference(s,{scroll:w.workspace==="bom"});let n=dd(a);n?.kind==="net"?Fn():ud(),rt.textContent=a?JSON.stringify(a,null,2):"No object selected",Ve(),w.isolateNet&&w.activeNetId&&ra(),e&&a?.bounds&&yi(a),ye(performance.now(),{force:!0}),Cn(n)}function Ln(t,e=!1){if(ps(t,E.hiddenComponents))return;let a=E.scene.componentFeatures.get(t);if(Je?.setSelectionByReference(t,{scroll:w.workspace==="bom"}),!a?.featureId)return;ud(),Ht(Number(a.featureId),!1);let s=M0(t);if(s){let{page:n,feature:r}=s;w.selectedPageId=n.id,w.selectedSchematicFeature={...r,pageId:n.id},N&&(N.selectedPageId=n.id,N.selectedFeatureId=Number(r.id||0)),J?.setSelection?.({kind:"component",featureKey:r.stableKey||"",sheetInstancePath:r.sheetInstancePath||n.sheetInstancePath||"",sourceId:r.sourceId||r.uuid||"",reference:t,feature:r,pageId:n.id}),e&&w.workspace==="schematic"&&(bt(n.id,!0),J?.frameSelection?.())}if(e&&w.workspace==="pcb"){let n=E.scene.features.get(Number(a.featureId));n?.bounds&&yi(n,!0)}Ve()}function Ia(t){return t?.designator||t?.reference||t?.componentDesignator||""}function w0(t=E){return Oi(t.scene.manifest?.components||[],t.scene.componentModelCounts)}function cu(t){E.hiddenComponentRequest=t;let e=Di(t,w0());E.hiddenComponents=e.hiddenReferences,E.renderer?.setHiddenFeatureIds(e.hiddenFeatureIds),e.ambiguous.length&&console.warn(`[prism-semantic-viewer] keeping ambiguous components visible: ${e.ambiguous.join(", ")}`),e.unknown.length&&console.warn(`[prism-semantic-viewer] ignoring unknown components: ${e.unknown.join(", ")}`);let a=Ia(E.scene.features.get(w.selectedFeatureId));ps(a,E.hiddenComponents)&&Ee();let s=pe.querySelector("input");return s?.value&&ou(s.value),e}function yi(t,e=!1){if(!t?.bounds)return;let a=Qr(t.bounds);if(e||t.kind==="component"||!!Ia(t)){let r=(a[2]+a[5])*.5<0,i=K.isBelow();r!==i&&K.setAxis("z",r)}K.frame(a)}function M0(t){if(!t||!N?.featuresByPage)return null;let e=D.byId.get(w.selectedPageId),a=[...e?[e]:[],...(D.pages||[]).filter(n=>n.id!==e?.id)],s=n=>{let r=String(n.kind||"").toLowerCase();return r==="component"||r==="symbol_body"||r==="symbol_instance"?0:r==="symbol_reference"?1:r.startsWith("pin")?2:3};for(let n of a){let r=(N.featuresByPage[n.id]||[]).filter(i=>String(i.reference||i.designator||i.componentDesignator||"")===t).sort((i,o)=>s(i)-s(o));if(r.length)return{page:n,feature:r[0]}}return null}function Ee(){w.activeNetId=0,w.selectedFeatureId=0,v&&(v.boardSelected=!1,v.standInKey=null),w.selectedSchematicFeature=null,w.selectionAnchor=null;let t=ht(),e=w.isolateNet;e&&!t?Vt(!1):t?e&&ra():w.isolateNet=!1,t||Zr(),D.activeNetUid="",N&&(N.activeNetUid=""),J?.setSelection(null),J?.setHighlightedNet(""),rt.textContent="No object selected",Je?.clearSelection?.(),Ve(),Cn(null)}function hn(t){return`<div class="selection-properties">${t.map(([e,a])=>`
    <div class="selection-property">
      <small>${G(e)}</small>
      <strong title="${G(String(a))}">${G(String(a))}</strong>
    </div>`).join("")}</div>`}function In(t,e,a){return`
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
    </div>`}function E0(t){let a=(E.topology.net_details?.[t.uid]||{}).terminals||[],s=t.metrics||{},n=Number(s.traceLengthMm||0).toFixed(2),r=s.objectCounts?.via||0,i=a.length,c=/^(VCC|VDD|GND|3V3|5V|12V|VIN|POWER)/i.test(t.name)?"#10b981":"#8b5cf6",d=t.netClass||"Default",h=a.length?a.map(u=>`
      <div class="selection-row pin-row-interactive" data-ref="${G(u.designator)}" data-pin="${G(u.pin)}">
        <span class="refdes-col"><strong>${G(u.designator)}</strong></span>
        <span class="pin-col">Pin ${G(u.pin)}</span>
        <span class="val-col" title="${G(u.value||"")}">${G(u.value||"-")}</span>
      </div>`).join(""):'<div class="selection-empty">No connected pin metadata is available.</div>';return`
    ${In("Net",t.name,c)}
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
          ${(s.layers||[]).length?s.layers.map(u=>`<span class="layer-badge">${G(u)}</span>`).join(""):'<span class="layer-badge unknown">None</span>'}
        </div>
      </div>

      <div class="selection-section">
        <span class="selection-section-title">Connected Pins</span>
        <div class="selection-table compact-scroll" style="max-height: 120px;">
          ${h}
        </div>
      </div>
    </div>`}function T0(t,e=null){let a=$r(t.designator),s=a?a.value:t.value||"Not specified",n=a?a.footprint:t.footprint||"Not specified",r=a?.parameters||{},i=r.Manufacturer||r.Mfr||"",o=r["Manufacturer Part Number"]||r.MPN||r["Part Number"]||"",c=r.kicad_dnp==="true"||r.DNP==="true"||r.kicad_in_bom==="false",d="";(i||o)&&(d=`
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
    ${In("Component",t.designator||"Unknown","#3b82f6")}
    <div class="selection-component-dashboard">
      ${c?'<div class="dnp-banner" style="background:#b45309;color:#fff;font-size:9px;font-weight:750;text-align:center;padding:3px;margin-bottom:8px;border-radius:2px;text-transform:uppercase;letter-spacing:0.05em;">DNP (Do Not Populate)</div>':""}
      ${hn([["Value",s],["Footprint",n.split(":").pop()||n]])}
      ${d}
      ${h}
    </div>`}function k0(t,e){let a=String(t.kind||"").toLowerCase(),s=a.startsWith("pin");if(a==="component"||a.includes("symbol"))return`
      ${In("Component",t.reference||t.componentDesignator||"Unknown","#3b82f6")}
      ${hn([["Value",t.value||t.componentValue||"Not specified"],["Footprint",t.componentFootprint||t.footprint||"Not specified"],["Library",t.libraryRef||"Not specified"],["UID",t.componentUid||t.uuid||t.sourceId||"Not resolved"]])}
      <div class="selection-section">
        <span class="selection-section-title">Schematic placement</span>
        ${hn([["Page",e?.name||"Unknown"],["Sheet",t.sheetInstancePath||"/"]])}
      </div>`;let r=s?[["Symbol",t.reference||t.designator||"Unknown"],["Value",t.value||t.componentValue||"Not specified"],["Pin",`${t.pinNumber||"-"}${t.pinName?` ${t.pinName}`:""}`],["Net",t.netName||"Not connected"],["PCB Pad",t.pcbPadId||"Not resolved"],["Component UID",t.componentUid||"Not resolved"]]:[["Page",e?.name||"Unknown"],["Kind",t.kind.replaceAll("_"," ")],["Net",t.netName||"Not connected"]];return`
    ${In(t.kind.replaceAll("_"," "),t.pinName||t.reference||t.designator||t.text||t.netName||"Schematic object","#3b82f6")}
    ${hn(r)}
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
    </div>`}function Ve(){if(Kt(),w.workspace==="bom"){Z.hidden=!0,Z.innerHTML="";return}let t=E.scene.features.get(w.selectedFeatureId),e=t?.kind==="component"?t:null,a=w.workspace==="schematic"?w.selectedSchematicFeature:null,s=a?D.byId.get(a.pageId):null,n=w.activeNetId?E.scene.nets.find(u=>Number(u.id)===w.activeNetId):null;if(!n&&a&&(a.netUid?n=E.scene.nets.find(u=>u.uid===a.netUid):a.netName&&(n=Xt(E.scene.nets,a.netName))),!e&&a){let u=a.reference||a.componentDesignator||a.designator;u&&(e=E.scene.componentFeatures.get(u)||{designator:u})}if(!e&&!n&&!a){Z.hidden=!0,Z.innerHTML="";return}let r="";if(n)r=E0(n);else if(e){let u=a?.kind?.startsWith("pin")?a:null;r=T0(e,u)}else a&&(r=k0(a,s));Z.innerHTML=`
    ${r}
    <div class="selection-card-actions">
      ${n?`
        <button type="button" data-action="isolate" aria-keyshortcuts="I" title="Toggle isolated net view (I)" class="${w.isolateNet?"active":""}">Isolate</button>
        <button type="button" data-action="net-layers">Layers</button>
      `:""}
      <button type="button" data-action="frame">Frame selection</button>
    </div>`,Z.hidden=!1;let i=w.workspace==="schematic"?Re:O,o=w.selectionAnchor,c=Z.offsetWidth||360,d=Z.offsetHeight||330;if(o){let u=Math.max(16,i.clientWidth-c-24),m=Math.max(16,i.clientHeight-d-24);Z.style.left=`${re(o.x+18,16,u)}px`,Z.style.top=`${re(o.y+18,16,m)}px`}else Z.style.left="20px",Z.style.top="20px";if(Z.querySelector(".selection-card-close").addEventListener("click",Ee),Z.querySelector("[data-action=frame]").addEventListener("click",xi),n){let u=Z.querySelector("[data-action=isolate]");u&&u.addEventListener("click",()=>{Vt(!w.isolateNet)});let m=Z.querySelector("[data-action=net-layers]");m&&m.addEventListener("click",Dn),Z.querySelectorAll(".pin-row-interactive").forEach(p=>{p.addEventListener("click",()=>{let f=p.dataset.ref,l=p.dataset.pin;if(!f)return;let g=((E.topology.net_details?.[n.uid]||{}).terminals||[]).find(M=>M.designator===f&&M.pin===l),x=g?Kg(g.pcb_pad_id):0;x?Ht(x,!0):Ln(f,!0)})})}let h=Z.querySelector(".net-ref-interactive");h&&h.addEventListener("click",()=>{let u=h.dataset.netName;if(!u)return;let m=Xt(E.scene.nets,u);m&&ka(Number(m.id),!0)})}function xi(){if(w.workspace==="schematic"){au();return}let t=E.scene.features.get(w.selectedFeatureId);if(t?.bounds)yi(t);else{let e=E.scene.nets.find(a=>Number(a.id)===w.activeNetId);e?.boundsMm&&K.frame(Qr(Ca(e.boundsMm)))}}function lu(){O.addEventListener("contextmenu",t=>t.preventDefault()),O.addEventListener("pointerdown",t=>{v&&(v.framed=!0),w.dragging=!0,w.lastX=t.clientX,w.lastY=t.clientY,w.pointerStartX=t.clientX,w.pointerStartY=t.clientY,w.dragMode=w.mode==="layer"||t.shiftKey||t.button!==0?"pan":"orbit",O.setPointerCapture(t.pointerId)}),O.addEventListener("pointermove",t=>{if(!w.dragging)return;let e=t.clientX-w.lastX,a=t.clientY-w.lastY;w.lastX=t.clientX,w.lastY=t.clientY,w.dragMode==="pan"?K.pan(e,a,O.clientHeight,w.mode==="layer"):K.orbit(e,a)}),O.addEventListener("pointerup",async t=>{w.dragging=!1,O.releasePointerCapture(t.pointerId),!(Math.hypot(t.clientX-w.pointerStartX,t.clientY-w.pointerStartY)>=3)&&(t.button===0?await Yl(t):t.button===2&&await A0(t))}),O.addEventListener("dblclick",async t=>{await Yl(t),xi()}),O.addEventListener("wheel",t=>{v&&(v.framed=!0),t.preventDefault(),Math.abs(t.deltaX)>Math.abs(t.deltaY)*.4?K.pan(-t.deltaX,0,O.clientHeight,w.mode==="layer"):K.dolly(t.deltaY,w.mode==="layer")},{passive:!1}),window.addEventListener("keydown",pu),I0()}function I0(){let t=!1,e,a,s=0,n=0;Z.addEventListener("pointerdown",r=>{if(!r.target.closest(".selection-card-head")||r.target.closest(".selection-card-close"))return;t=!0,Z.classList.add("dragging");let o=Z.getBoundingClientRect();s=o.left,n=o.top,e=r.clientX,a=r.clientY,Z.setPointerCapture(r.pointerId),r.stopPropagation()}),Z.addEventListener("pointermove",r=>{if(!t)return;let i=r.clientX-e,o=r.clientY-a,c=w.workspace==="schematic"?Re:O,d=Z.offsetWidth||360,h=Z.offsetHeight||330,u=Math.max(16,c.clientWidth-d-24),m=Math.max(16,c.clientHeight-h-24),p=re(s+i,16,u),f=re(n+o,16,m);Z.style.left=`${p}px`,Z.style.top=`${f}px`,w.selectionAnchor={x:p-18,y:f-18},r.stopPropagation()}),Z.addEventListener("pointerup",r=>{t&&(t=!1,Z.classList.remove("dragging"),Z.releasePointerCapture(r.pointerId),r.stopPropagation())})}function S0(){ta("[data-workspace]").forEach(t=>{t.addEventListener("click",()=>du(t.dataset.workspace))})}function du(t){if(t==="schematic"&&!N||t==="bom"&&!Je)return;w.workspace=t,ft.classList.remove("workspace-pcb","workspace-schematic","workspace-bom","workspace-stackup"),ft.classList.add(`workspace-${t}`),(t==="schematic"&&(w.activeTab==="view"||w.activeTab==="inspect"||w.activeTab==="stats")||t==="bom"||t==="stackup")&&Sn("layers");let e=$('.rail-tab[data-tab="layers"]');e&&(t==="schematic"?(e.textContent="Pages",e.title="Schematic pages"):t==="bom"?(e.textContent="Summary",e.title="BoM summary"):(e.textContent="Layers",e.title="Layers and compare"));let a=t==="schematic",s=t==="bom",n=t==="stackup";if(O.hidden=a||s||n,Re&&(Re.hidden=!a),bn&&(bn.hidden=!a||!J),pn&&(pn.hidden=!a),mn&&(mn.hidden=!s),Ce&&(Ce.hidden=!n),Se.hidden=a||s||n,gn.hidden=a||s||n,Wa&&(Wa.hidden=!a),ta("[data-workspace]").forEach(r=>{r.classList.toggle("active",r.dataset.workspace===t)}),wa.textContent=s?"Semantic BoM active":a?J?"SVG DOM + WebGPU schematic world active":"WebGPU schematic world active":n?"Layer Stackup active":"WebGPU semantic glTF active",a&&!D.fitted&&(N.resize(),N.frameWorld(),D.fitted=!0),!a&&!s&&!n&&(E.renderer?.resize(),w.mode==="layer"?di():ye(performance.now(),{force:!0})),n)try{F0()}catch(r){console.error("Failed to render stackup workspace",r),Ce&&(Ce.innerHTML=`
          <div class="selection-empty" style="padding:40px;text-align:center;">
            Stackup view failed to render. ${G(r?.message||String(r))}
          </div>
        `)}ui(),Ve()}function R0(){Re.addEventListener("pointerdown",t=>{J?.worldActive||J?.active||(w.schematicDragging=!0,w.schematicLastX=t.clientX,w.schematicLastY=t.clientY,w.schematicStartX=t.clientX,w.schematicStartY=t.clientY,Re.setPointerCapture(t.pointerId))}),Re.addEventListener("pointermove",t=>{if(J?.worldActive||J?.active||!w.schematicDragging||!N)return;let e=t.clientX-w.schematicLastX,a=t.clientY-w.schematicLastY;w.schematicLastX=t.clientX,w.schematicLastY=t.clientY,N.pan(e,a)}),Re.addEventListener("pointerup",async t=>{if(!(J?.worldActive||J?.active)&&(w.schematicDragging=!1,Re.releasePointerCapture(t.pointerId),Math.hypot(t.clientX-w.schematicStartX,t.clientY-w.schematicStartY)<3)){let e=await N.pickFeature(t.clientX,t.clientY);e?y0(e):ss()}}),Re.addEventListener("dblclick",t=>{if(J?.worldActive||J?.active)return;let e=N.hitPage(t.clientX,t.clientY);e&&bt(e.id,!0)}),Re.addEventListener("wheel",t=>{J?.worldActive||J?.active||(t.preventDefault(),N.zoom(t.deltaY,t.clientX,t.clientY))},{passive:!1})}var $l=0;async function Yl(t){if(!ee)return;let e=++$l,a=O.getBoundingClientRect();if(w.selectionAnchor={x:t.clientX-a.left,y:t.clientY-a.top},v&&qy(t))return;let s=await uu(t);if(e===$l){if(v){wy(s);return}(s.kind==="feature"||s.kind==="board")&&(w.selectedOccurrence=s.occurrenceIndex),s.featureId?Ht(s.featureId,!0):s.kind==="board"&&!E.renderer.identityOnly?vi():Ee()}}async function A0(t){if(!ee||!Mn)return;let e=await uu(t),a=v?v.placements.get(e.occurrenceKey)?.board:E;if(!a)return;let s=a.scene.features.get(e.featureId),n=Ia(s),r=n?$r(n,a):null;Mn({clientX:t.clientX,clientY:t.clientY,reference:n||void 0,value:String(r?.value||s?.value||"")||void 0})}function uu(t){let e=O.getBoundingClientRect();return fu((t.clientX-e.left)*O.width/e.width,(t.clientY-e.top)*O.height/e.height)}function fu(t,e){return v?vy(t,e):E.renderer.pick(ee,t,e,{activeNetId:w.activeNetId,selectedFeatureId:w.selectedFeatureId,layerOffsets:Qd(),visibleLayers:w.mode==="3d"?E.visible3dLayers:E.compareLayers,showBoard:w.showBoard,showComponents:w.showComponents,componentOpacity:re(1-w.separation/.1,0,1),boardOpacity:1-w.separation*.72,isolateNet:w.isolateNet,compareMode:w.mode==="layer",compareOffsets:sa,visibleTileIds:w.mode==="3d"?E.visibleTileIds:null})}async function hu(t,e){if(!ee||!(v||E.renderer))return null;let a=O.getBoundingClientRect(),s=await fu((t-a.left)*O.width/a.width,(e-a.top)*O.height/a.height),n=v?v.placements.get(s.occurrenceKey)?.board:E,r=s.featureId&&n?dd(n.scene.features.get(s.featureId),n):null;return{...s,renderer:void 0,selection:r}}function vi(){let t=w.selectedOccurrence,e=Ae;Ae=!0;try{Ee()}finally{Ae=e}w.selectedOccurrence=t,v&&(v.boardSelected=!0),Cn({kind:"board",sourceContext:"3D"})}function bu(t,e,a){let s=t.scene.componentFeatures.get(String(e)),n=s?t.scene.features.get(Number(s.featureId))?.bounds:null;if(!n)return null;let r=n[2]+n[5]>=0;return a([(n[0]+n[3])/2,(n[1]+n[4])/2,r?n[5]:n[2]])}function Hr(t,e){if(!ee)return null;let a=Da(ee.matrix,js(e,t),ee.viewport);if(!a)return null;let s=O.getBoundingClientRect();return{x:s.left+a.x*s.width/O.width,y:s.top+a.y*s.height/O.height}}function pu(t){if(!Nn())return;if(t.target instanceof HTMLInputElement){t.key==="Escape"&&t.target.blur();return}let e=t.key.toLowerCase();if(w.workspace==="schematic"){if(e==="/")t.preventDefault(),Sn("search"),pe.querySelector("#entity-search")?.focus();else if(e==="escape")D.activeNetUid?(D.activeNetUid="",w.activeNetId=0,N.activeNetUid="",J?.setHighlightedNet(""),Ve()):ss();else if(e==="~"||t.key==="~"){t.preventDefault();let a=w.selectedSchematicFeature?.netUid;a&&(D.activeNetUid===a?(D.activeNetUid="",w.activeNetId=0,N.activeNetUid="",J?.setHighlightedNet("")):tu(a,w.selectedSchematicFeature))}else if(e==="home")N?.frameWorld();else if(e==="[")fn("previous");else if(e==="]")fn("next");else if(e==="n"){t.preventDefault();let a=N?.cycleNetIntrasheetLink(t.shiftKey?-1:1);a?.pageId&&(w.selectedPageId=a.pageId,N.selectedPageId=a.pageId,yu())}else if(t.altKey&&e==="arrowup")fn("parent");else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;N?.pan(a,s)}return}if(v&&Ky(t,e)){t.preventDefault();return}if(e==="/")t.preventDefault(),Sn("search"),pe.querySelector("#entity-search").focus();else if(e==="escape")Ee();else if(e==="i"&&w.workspace==="pcb"&&ht())t.preventDefault(),Vt(!w.isolateNet);else if(e==="home")K.frame(v&&v.bounds||na());else if(e==="`")ti(!w.showStats);else if(["x","y","z"].includes(e))K.setAxis(e,t.shiftKey);else if(e==="f")K.flip();else if(e==="r")K.rotateZ(t.shiftKey?-1:1);else if(e===" "){t.preventDefault();let a=E.scene.features.get(w.selectedFeatureId);a?.bounds&&K.setFocus([(a.bounds[0]+a.bounds[3])/2,(a.bounds[1]+a.bounds[4])/2,(a.bounds[2]+a.bounds[5])/2])}else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;K.pan(a,s,O.clientHeight,w.mode==="layer")}}function Sn(t){w.activeTab=t,ft.classList.remove("panel-collapsed"),ta(".rail-tab").forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),ta(".tab-panel").forEach(e=>{e.classList.toggle("active",e.dataset.panel===t)})}function mu(){let t=Se.getContext("2d");t.clearRect(0,0,Se.width,Se.height);let e=[Se.width/2,Se.height/2],a=K.basis(),s=[{axis:"x",label:"X",color:"#e23838",vector:[1,0,0]},{axis:"y",label:"Y",color:"#2dbd50",vector:[0,1,0]},{axis:"z",label:"Z",color:"#3157d5",vector:[0,0,1]}],n=[];for(let r of s)for(let i of[-1,1]){let o=r.vector.map(d=>d*i),c=[Ur(o,a.right),-Ur(o,a.up),Ur(o,a.back)];n.push({...r,sign:i,depth:c[2],point:[e[0]+c[0]*34,e[1]+c[1]*34]})}for(let r of s){let i=n.find(o=>o.axis===r.axis&&o.sign===1);t.strokeStyle=r.color,t.lineWidth=2.4,t.beginPath(),t.moveTo(...e),t.lineTo(...i.point),t.stroke()}xn=[];for(let r of n.sort((i,o)=>o.depth-i.depth)){let i=r.sign===1,o=i?13:9;t.beginPath(),t.arc(r.point[0],r.point[1],o,0,Math.PI*2),t.fillStyle=i?r.color:`${r.color}66`,t.fill(),t.lineWidth=2,t.strokeStyle=C0(r.color,i?.45:.58),t.stroke(),i&&(t.fillStyle="#07101c",t.font="700 13px system-ui",t.textAlign="center",t.textBaseline="middle",t.fillText(r.label,r.point[0],r.point[1]+.5)),xn.push({...r,radius:o+5})}}function gu(){!Se||Se.dataset.bound==="true"||(Se.dataset.bound="true",Se.addEventListener("click",t=>{let e=Se.width/Se.clientWidth,a=Se.height/Se.clientHeight,s=[t.offsetX*e,t.offsetY*a],n=xn.map(r=>({item:r,distance:Math.hypot(s[0]-r.point[0],s[1]-r.point[1])})).filter(({item:r,distance:i})=>i<=r.radius).sort((r,i)=>r.distance-i.distance)[0]?.item;n&&K.setAxis(n.axis,n.sign<0)}))}function _0(){if(w.mode!=="layer"||!ee){gn.innerHTML="";return}let t=na(),e=hd();gn.innerHTML=E.scene.copperLayers.filter(a=>e.has(Number(a.id))).map(a=>{let s=sa.get(Number(a.id))||[0,0,0],n=N0([t[0]+s[0],t[4]+s[1],0],ee.matrix,O.clientWidth,O.clientHeight);return!n||n[0]<-100||n[0]>O.clientWidth+100||n[1]<-100||n[1]>O.clientHeight+100?"":`<span style="left:${n[0]}px;top:${n[1]}px">${G(a.name)}</span>`}).join("")}function yu(){if(w.workspace!=="schematic"||!N){Wa.innerHTML="";return}Wa.innerHTML=D.visiblePages.filter(t=>N.pagePixelWidth(t)>120).map(t=>{let[e,a]=N.worldToScreen(t.worldX+8*N.scale,t.worldY-6*N.scale),s=t.id===w.selectedPageId,r=D.activeNetUid&&t.netUids.includes(D.activeNetUid)?"#18ef52":s?"#3b82f6":"#4b8de8";return`<div class="schematic-page-label" style="left:${e}px;top:${a}px;border-left-color:${r}">
        <strong>${G(t.name)}</strong>
        <small>Page ${t.sheetNumber} &middot; ${t.featureCount.toLocaleString()} features</small>
      </div>`}).join("")}function N0(t,e,a,s){let n=t[0],r=t[1],i=t[2],o=e[0]*n+e[4]*r+e[8]*i+e[12],c=e[1]*n+e[5]*r+e[9]*i+e[13],d=e[3]*n+e[7]*r+e[11]*i+e[15];return Math.abs(d)<1e-8?null:[(o/d*.5+.5)*a,(.5-c/d*.5)*s]}function Ur(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function C0(t,e){let a=t.replace("#","");return`#${[0,2,4].map(s=>Math.round(parseInt(a.slice(s,s+2),16)*e).toString(16).padStart(2,"0")).join("")}`}function qr(t,e){w.frameSamples.push({intervalMs:t,cpuMs:e}),w.frameSamples.length>180&&w.frameSamples.shift()}function Jl(t,e){if(!t.length)return 0;let a=[...t].sort((s,n)=>s-n);return a[Math.min(a.length-1,Math.floor((a.length-1)*e))]}function Xr(t){if(!ln||(w.frames+=1,t-w.fpsAt<=500))return;w.fps=w.frames*1e3/(t-w.fpsAt);let e=w.frameSamples;if(w.frameIntervalMs=e.length?e.reduce((r,i)=>r+i.intervalMs,0)/e.length:0,w.frameCpuMs=e.length?e.reduce((r,i)=>r+i.cpuMs,0)/e.length:0,w.frameIntervalP95Ms=Jl(e.map(r=>r.intervalMs),.95),w.frameCpuP95Ms=Jl(e.map(r=>r.cpuMs),.95),w.frames=0,w.fpsAt=t,wd(),w.workspace==="bom"){let r=Je?.payload?.counts||{},i=[["Renderer","BoM DOM table"],["Schema",Je?.payload?.schema||"-"],["Grouped rows",r.rows||0],["Components",r.components||0],["DNP components",r.dnpComponents||0],["Extra columns",Je?.payload?.extraColumns?.length||0],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]];ln.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("");return}let a=w.workspace==="schematic"&&N?N.stats():null,s=w.workspace==="schematic"&&J?J.stats():null,n=w.workspace==="schematic"&&N?J?.active?[["Renderer","SVG DOM schematic detail"],["Pages",D.pages.length],["Mounted pages",s.mountedPages],["Active page",s.activePage],["DOM nodes",s.domNodes.toLocaleString()],["Indexed features",s.indexedFeatures.toLocaleString()],["Indexed nets",s.indexedNets.toLocaleString()],["SVG cache",`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`],["Selection",`${s.selectionMs.toFixed(1)} ms`],["Active net",E.scene.nets.find(r=>r.uid===D.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Tracking verts",a.netFlowVertices.toLocaleString()],["Mount",`${s.mountMs.toFixed(1)} ms`],["Highlight",`${s.highlightMs.toFixed(1)} ms`],["Fallback",s.fallbackReason||"-"],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]]:[["Renderer",J?"SVG DOM + WebGPU world":"WebGPU schematic world"],["Pages",D.pages.length],["Visible pages",D.visiblePages.length],["DOM pages",s?s.mountedPages:0],["DOM nodes",s?s.domNodes.toLocaleString():"0"],["Indexed SVG features",s?s.indexedFeatures.toLocaleString():"0"],["SVG cache",s?`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`:"0 pages"],["JS heap",s?.heapMb?`${s.heapMb.toFixed(1)} MB`:"-"],["Hierarchy links",D.manifest.edges?.length||0],["Selected page",D.byId.get(w.selectedPageId)?.name||"-"],["Active net",E.scene.nets.find(r=>r.uid===D.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Downloaded",`${(N.downloadedBytes/1048576).toFixed(1)} MB`],["Resident vectors",`${(a.residentVectorBytes/1048576).toFixed(1)} MB`],["Vector pages",`${a.vectorChunks} loaded / ${a.vectorLoads} loading`],["Vector draw",`${a.vectorVertices.toLocaleString()} verts / ${a.vectorDrawChunks} chunks`],["Native detail",`${a.nativeDetailPages} pages @ ${a.nativePxPerMm} / ${a.nativeThresholdPxPerMm} px/mm`],["Vector failures",a.failedVectorChunks],["Truncated",a.truncatedVectors],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]]:[["Renderer","WebGPU semantic glTF"],["Mode",w.mode==="3d"?"3D":"Layer Compare"],["Visible layers",w.mode==="3d"?E.visible3dLayers.size:E.compareLayers.size],["Resident tiles",E.scene.loaded.size],["Loading tiles",E.scene.loading.size],["Failed tiles",E.scene.failed.size],["Triangles",Math.round(E.triangles).toLocaleString()],["Downloaded",`${(E.loadedBytes/1048576).toFixed(1)} MB`],["Resident GLB",`${(E.residentTileBytes/1048576).toFixed(1)} MB`],["Resident GPU",`${(E.residentTileGpuBytes/1048576).toFixed(1)} MB`],["Tile loads",E.tileLoads.toLocaleString()],["Tile evictions",E.tileEvictions.toLocaleString()],["Tile scheduler",`${E.tileSchedulerMs.toFixed(2)} ms`],["Active net",E.scene.nets.find(r=>Number(r.id)===w.activeNetId)?.name||"-"],["Frame interval",`${w.frameIntervalMs.toFixed(2)} ms avg / ${w.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${w.frameCpuMs.toFixed(2)} ms avg / ${w.frameCpuP95Ms.toFixed(2)} p95`],["FPS",w.fps.toFixed(1)]];ln.innerHTML=n.map(([r,i])=>`<dt>${r}</dt><dd>${i}</dd>`).join("")}function wi(t){return`rgb(${t.slice(0,3).map(e=>Math.round(e*255)).join(" ")})`}function F0(){if(!Ce)return;let t=E.scene.layers||[];if(!t.length){Ce.innerHTML='<div class="selection-empty" style="padding:40px;text-align:center;">No stackup information available for this board.</div>';return}let e=t.filter(k=>["copper","dielectric","paste","silkscreen","soldermask"].includes(k.role)),a=E.topology.board?.stackup||{},s=k=>{if(k==null||k==="")return"None";let B=String(k);return G(B.includes(".")?B.split(".").pop():B)},n=(k,B=4)=>{let P=Number(k);return Number.isFinite(P)&&P>0?P.toFixed(B):"-"},r=(k,B=3)=>{let P=Number(k);return Number.isFinite(P)?P.toFixed(B):"-"},i=k=>{if(k==null||k==="")return"No";if(typeof k=="boolean")return k?"Yes":"No";let B=String(k).trim().toLowerCase(),P=B.includes(".")?B.split(".").pop():B;return["0","false","no","n","off","none"].includes(P)?"No":(["1","true","yes","y","on"].includes(P),"Yes")},o=k=>({copper:"Copper",dielectric:"Dielectric",paste:"Paste",silkscreen:"Silkscreen",soldermask:"Solder mask"})[k]||String(k||"Layer"),c=k=>k.role!=="dielectric"?"":k.type==="core"?"Core":k.type==="prepreg"||(k.material||"").toLowerCase().includes("prepreg")?"Prepreg":"Core",d=(k,B=4)=>{let P=Number(k.thickness_mm);return Number.isFinite(P)&&P>0?`${P.toFixed(B)} mm`:"Not specified"},h=k=>{let B=o(k.role),P=String(k.material||"").trim(),Y=P&&P.toLowerCase()!==String(k.role||"").toLowerCase();if(k.role==="dielectric"){let ce=[Y?P:"",n(k.epsilon_r,3)!=="-"?`\u03B5r ${n(k.epsilon_r,3)}`:"",n(k.loss_tangent,4)!=="-"?`tan \u03B4 ${n(k.loss_tangent,4)}`:""].filter(Boolean).join(" \xB7 ");return{primary:`${k.name} \xB7 ${c(k)}`,secondary:ce}}return{primary:[k.name,B,Y?P:""].filter(Boolean).join(" \xB7 "),secondary:""}},u=0,m=0,p=0,f=0;e.forEach(k=>{f+=k.thickness_mm||0,k.role==="copper"?k.name.toLowerCase().includes("gnd")||k.name.toLowerCase().includes("pwr")||k.name.toLowerCase().includes("plane")?m++:u++:k.role==="dielectric"&&p++});let l=E.scene.copperLayers||[],y=0,b=0,g=0,x=[...(E.scene.manifest?.barrels||[]).filter(k=>k.kind==="via"),...[...E.scene.features.values()].filter(k=>k.kind==="via")],M=Xc(l,x);y=M.counts.thru,b=M.counts.blind,g=M.counts.buried;let T=M.spans,I=30,S=I,R=[],A=new Map(e.map((k,B)=>[k,B])),_=B0(e),j=(k,B)=>{let P=_.get(k.name);if(P!==void 0)return P;let Y=Number(k.stack_index);return Number.isFinite(Y)?Y:B+1e5},L=[...e].sort((k,B)=>{let P=j(k,A.get(k)||0),Y=j(B,A.get(B)||0);return P!==Y?P-Y:(B.z_mm||0)-(k.z_mm||0)});L.forEach(k=>{let B=12;k.role==="dielectric"?B=Math.max(160,Math.min(360,(k.thickness_mm||.1)*140)):k.role==="copper"?B=22:k.role==="soldermask"&&(B=14),R.push({...k,svgY:S,svgHeight:B}),S+=B});let F=800,z=130,W=240,ae=z+W+16,oe=ae+84,Oe="";R.forEach(k=>{let B=k.color||"#7f7f7f";k.role==="copper"?B=k.color||"#f97316":k.role==="dielectric"?B="#a98d5c":k.role==="paste"?B="#cbd5e1":k.role==="soldermask"?B="#1b4332":k.role==="silkscreen"&&(B="#e2e8f0");let P=l.findIndex(Iu=>Iu.name===k.name),Y=h(k),ce=k.svgY+k.svgHeight/2,Te=!!Y.secondary&&k.svgHeight>=38,qt=Te?ce-5:ce+3,Gn=G(k.id),is=G(k.name),et=Number.isFinite(Number(k.thickness_mm))&&Number(k.thickness_mm)>0,Tu=G(et?d(k):"\u2014"),ku=G([Y.primary,Y.secondary,`Thickness ${d(k)}`].filter(Boolean).join("; "));Oe+=`
      <g class="stackup-svg-layer" data-layer-id="${Gn}" data-layer-name="${is}">
        <title>${ku}</title>
        <rect x="${z}" y="${k.svgY}" width="${W}" height="${k.svgHeight}" fill="${B}" opacity="0.85" rx="1"/>
        <text x="${z-8}" y="${k.svgY+k.svgHeight/2+3}" fill="var(--muted)" font-size="9px" text-anchor="end" font-weight="700">
          ${k.role==="copper"?P+1:""}
        </text>
        <path class="stackup-layer-dimension" d="M ${ae+6} ${k.svgY+1} H ${ae} V ${k.svgY+k.svgHeight-1} H ${ae+6}" />
        <text class="stackup-layer-thickness" x="${ae+10}" y="${ce+3}" fill="var(--muted)" font-size="8.5px" font-weight="650">
          ${Tu}
        </text>
        <text class="stackup-layer-name" x="${oe}" y="${qt}" fill="var(--foreground)" font-size="9px" font-weight="650">
          ${G(Y.primary)}
        </text>
        ${Te?`<text class="stackup-layer-metadata" x="${oe}" y="${ce+10}" fill="var(--muted)" font-size="8px">${G(Y.secondary)}</text>`:""}
      </g>
    `});let de="",De=R.filter(k=>k.role==="copper");T.forEach((k,B)=>{let P=R.find(et=>et.name===k.startName),Y=R.find(et=>et.name===k.endName);if(!P||!Y)return;let ce=P.svgY,Te=Y.svgY+Y.svgHeight,qt=z+(B+1)*W/(T.length+1),Gn=k.type==="thru"?"Thru":k.type==="blind"?"Blind":"Buried",is=`var(--stackup-via-${k.type})`;de+=`
      <g class="stackup-svg-via" data-via-type="${k.type}">
        <title>${Gn}: ${k.startName} \u2192 ${k.endName}</title>
        ${De.map(et=>et.svgY>=P.svgY&&et.svgY<=Y.svgY?`<rect x="${qt-5}" y="${et.svgY}" width="10" height="${et.svgHeight}" fill="${is}" rx="0.5" />`:"").join("")}
        <rect x="${qt-2}" y="${ce}" width="4" height="${Te-ce}" fill="${is}" opacity="0.95" />
        <rect x="${qt-.75}" y="${ce-1}" width="1.5" height="${Te-ce+2}" fill="var(--panel)" opacity="0.9" />
      </g>
    `});let He=`
    <svg class="stackup-visual-svg" viewBox="0 0 ${F} ${S+10}" width="${F}" height="${S+10}">
      <g class="stackup-svg-column-headings" aria-hidden="true">
        <text x="${ae+10}" y="15">Thickness</text>
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
  `,Me="";L.forEach(k=>{let B="silk";k.role==="copper"?B="copper":k.role==="dielectric"?B="dielectric":k.role==="paste"?B="paste":k.role==="soldermask"&&(B="mask");let P=c(k),Y=G(k.id),ce=G(k.name),Te=h(k);Me+=`
      <tr data-layer-id="${Y}" data-layer-name="${ce}" tabindex="0" aria-label="${G(`${Te.primary}; thickness ${d(k)}`)}">
        <td><strong>${ce}</strong></td>
        <td><span class="stackup-badge ${B}">${k.role}</span></td>
        <td>${P||"-"}</td>
        <td>${G(k.material||"-")}</td>
        <td>${k.role==="dielectric"?n(k.epsilon_r,3):"-"}</td>
        <td>${k.role==="dielectric"?n(k.loss_tangent,4):"-"}</td>
        <td>${k.thickness_mm?k.thickness_mm.toFixed(4)+" mm":"-"}</td>
      </tr>
    `});let Ze="",qe=E.topology.board?.net_classes||[],pt=k=>{let B=r(k);return B==="-"?B:`${B} mm`};qe.length?qe.forEach(k=>{Ze+=`
        <tr>
          <td><strong>${k.name}</strong></td>
          <td>${pt(k.track_width)}</td>
          <td>${pt(k.clearance)}</td>
          <td>${pt(k.diff_pair_width)}</td>
          <td>${pt(k.diff_pair_gap)}</td>
          <td>${Number.isFinite(Number(k.via_diameter))?`${r(k.via_drill)}/${r(k.via_diameter)} mm`:"-"}</td>
        </tr>
      `}):Ze=`
      <tr>
        <td colspan="6" class="selection-empty" style="text-align: center;">No design rules or impedance classes defined.</td>
      </tr>
    `,Ce.innerHTML=`
    <div class="stackup-header">
      <div class="stackup-header-title">
        <h1>Layer Stackup</h1>
        <p>Board cross-section profile, layer properties & design rules</p>
      </div>
    </div>

    <div class="stackup-workspace-body">
      <div class="stackup-diagram-card">
        <span class="stackup-section-title">Cross-Section Profile</span>
        ${He}
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
                ${Me}
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
                ${Ze}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </aside>
    </div>
  `;let oa=(k,B)=>{Ce.querySelectorAll(".stackup-svg-layer").forEach(P=>{let Y=P.dataset.layerId===k;P.classList.toggle("active",Y&&B)}),Ce.querySelectorAll(".stackup-table tbody tr[data-layer-id]").forEach(P=>{let Y=P.dataset.layerId===k;P.classList.toggle("active",Y&&B)})},Un=k=>{let B=Ce.querySelector(".stackup-diagram-card"),P=Ce.querySelector(`.stackup-svg-layer[data-layer-id="${CSS.escape(k)}"]`);if(!B||!P||B.scrollHeight<=B.clientHeight)return;let Y=B.getBoundingClientRect(),ce=P.getBoundingClientRect(),Te=B.scrollTop+ce.top-Y.top-(B.clientHeight-ce.height)/2,qt=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;B.scrollTo({top:Math.max(0,Te),behavior:qt?"auto":"smooth"})},rs=(k,{revealDiagram:B=!1}={})=>{k.forEach(P=>{let Y=()=>{let Te=P.dataset.layerId;oa(Te,!0),B&&Un(Te)},ce=()=>oa(null,!1);P.addEventListener("mouseenter",Y),P.addEventListener("mouseleave",ce),B&&(P.addEventListener("focus",Y),P.addEventListener("blur",ce))})};rs(Ce.querySelectorAll(".stackup-svg-layer")),rs(Ce.querySelectorAll(".stackup-table tbody tr[data-layer-id]"),{revealDiagram:!0})}function B0(t){let e=t.filter(n=>n.role==="dielectric");if(!(e.length===1&&e[0]?.name==="Board"))return new Map;let s=new Map;return["F.SilkS","F.Paste","F.Mask","F.Cu","Board","B.Cu","B.Mask","B.Paste","B.SilkS"].forEach((n,r)=>s.set(n,r)),s}function xu(){let t=null;return{begin(){return t?.abort(),t=new AbortController,t},owns(e){return e!==null&&e===t&&!e.signal.aborted},cancel(){t?.abort(),t=null}}}async function vu(t,e,{owner:a,bundleUrl:s,loadBundle:n,now:r=()=>performance.now()}){let i=r(),o={},{signal:c}=e,d=()=>a.owns(e)&&t.isConnected;try{t.renderLoading();let h=r(),{bundle:u,topology:m,semanticGeometry:p,assetCache:f}=await n(s,o,c);if(o.bundle_group_total_ms=r()-h,!d())return;t.renderShell();let l=r(),y=await t.mountViewer({topology:m,semanticGeometry:p,readiness:u.readiness,assetCache:f,signal:c});if(!d()){y?.dispose?.();return}t.publishController(y),o.mount_and_first_frame_ms=r()-l,Object.assign(o,y?.performance||{}),o.reload_to_visible_ms=r()-i,t.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"board-visible",readiness_stage:u.readiness?.stage||"semantic-ready",readiness_progress:u.readiness?.progress??100,timings:o})}catch(h){if(!d())return;t.renderError(h),t.emitError(h)}}var j0="prism.visualizer_bundle.a0";function P0(){return`
    <style>
      ${Ei}
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
      /* SB2-45b: the picked harness's breakouts and waypoints in move mode, under the gizmo. */
      #harness-nodes { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
      #harness-nodes[hidden] { display: none; }
      #harness-nodes .node { fill: #f8fafc; stroke: #3e63dd; stroke-width: 2.5; pointer-events: visiblePainted; cursor: pointer; }
      #harness-nodes .node.breakout { fill: #3e63dd; stroke: #fff; }
      #harness-nodes .node.auto { fill: none; stroke: #3e63dd; stroke-dasharray: 3 2; }
      #harness-nodes .node.pinned { fill: #0f172a; }
      #harness-nodes .node.target { stroke: #f59e0b; stroke-width: 3.5; }
      #harness-nodes .node:hover { stroke-width: 4; }
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
        <svg id="harness-nodes" hidden aria-hidden="true"></svg>
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
  `}function O0(t){return String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}async function wu(t,e=null,a="fetch",s=void 0){let n=performance.now(),r=await fetch(t,{cache:"no-store",signal:s});if(!r.ok)throw new Error(`Failed to load ${t}: ${r.status}`);let i=await r.json();return e&&(e[`${a}_fetch_parse_ms`]=performance.now()-n,e[`${a}_content_length`]=Number(r.headers.get("content-length")||0)),i}async function Mu(t,e,a){let s=new URL(t,document.baseURI).toString(),n=new URL(s).searchParams.get("viewer")||"",r=cs.open(),i=await r.peekJson(s).catch(()=>null),o=!!i;i||(i=await wu(s,e,"bundle",a),Vn(i)&&r.store(s,new TextEncoder().encode(JSON.stringify(i)))),e&&(e.bundle_from_cache=o);let c=Vn(i)&&r.enabled?r:null;if(i.schema!==j0)throw new Error(`Unsupported visualizer bundle schema: ${i.schema||"missing"}`);let d=new URL(i.topology||"topology.json",s),h=new URL(i.semantic_geometry||"semantic_geometry.json",s),u=(f,l)=>c?c.fetchJson(f.toString(),{signal:a}):wu(f,e,l,a),[m,p]=await Promise.all([u(d,"topology"),u(h,"semantic_geometry")]);return{bundle:i,topology:m,semanticGeometry:Ti(p,s,i,n),assetCache:c}}var Mi=class extends HTMLElement{static get observedAttributes(){return["bundle-url","workspace","mode","move-allowed"]}constructor(){super(),this.attachShadow({mode:"open"}),this.controller=null,this.reloadOwner=xu(),this.pendingSelection=null,this.pendingHiddenComponents=null,this.reloadQueued=!1,this.reloadSource=null}connectedCallback(){this.queueReload()}disconnectedCallback(){this.reloadOwner.cancel(),this.controller?.dispose?.(),this.controller=null,this.reloadSource=null}attributeChangedCallback(e,a,s){if(!(!this.isConnected||a===s)){if(e==="workspace"){this.controller?.setWorkspace?.(this.workspace);return}if(e==="move-allowed"){this.controller?.setMoveAllowed?.(s==="true");return}this.queueReload()}}get workspace(){return this.getAttribute("workspace")==="stackup"?"stackup":"pcb"}get systemMode(){return this.getAttribute("mode")==="system"}queueReload(){let e=this.systemMode?"system":this.getAttribute("bundle-url");!e||e===this.reloadSource||(this.reloadSource=e,!this.reloadQueued&&(this.reloadQueued=!0,queueMicrotask(()=>{this.reloadQueued=!1,this.isConnected&&this.reload()})))}async reload(){let e=this.getAttribute("bundle-url"),a=this.reloadOwner.begin();if(this.controller?.dispose?.(),this.controller=null,this.systemMode){await this.reloadSystem(a);return}if(!e){this.shadowRoot.innerHTML="<style>:host{display:block;height:100%;font:14px system-ui;color:#94a3b8}</style><div>Semantic bundle URL is missing.</div>";return}await vu(this,a,{owner:this.reloadOwner,bundleUrl:e,loadBundle:Mu})}async reloadSystem(e){let{signal:a}=e,s=()=>this.reloadOwner.owns(e)&&this.isConnected;try{this.renderShell();let n=await Md({root:this.shadowRoot,loadBundle:(i,o)=>Mu(i,null,o),isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{a.aborted||this.emit("selectionchange",{selection:i})},onContextMenu:i=>{a.aborted||this.emit("contextmenu",i)},onViewStateChange:i=>{a.aborted||this.emitViewState(i)},onEmphasis:i=>{a.aborted||this.emit("emphasis",{results:i})},onMove:i=>{a.aborted||this.emit("move",i)},onHarness:i=>{a.aborted||this.emit("harness",i)}});if(!s()){n?.dispose?.();return}this.controller=n,this.pendingGpuBudget!=null&&n.setGpuBudget(this.pendingGpuBudget),this.pendingSystemScene&&n.setSystemScene(this.pendingSystemScene),this.pendingNetEmphasis&&n.setNetEmphasis(this.pendingNetEmphasis),n.setMoveAllowed(this.getAttribute("move-allowed")==="true"),this.pendingLabels!=null&&n.setLabelsVisible(this.pendingLabels);let r=this.getViewState();r&&this.emitViewState(r),this.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"system-mounted"})}catch(n){if(!s())return;this.renderError(n),this.emitError(n)}}emit(e,a){this.dispatchEvent(new CustomEvent(`prism-semantic-viewer:${e}`,{bubbles:!0,composed:!0,detail:a}))}setSystemScene(e){this.pendingSystemScene=e||null,e&&this.controller?.setSystemScene?.(e)}setNetEmphasis(e){return this.pendingNetEmphasis=Array.isArray(e)?e:[],this.controller?.setNetEmphasis?.(this.pendingNetEmphasis)??[]}frameNetEmphasis(e=null,a=null){return this.controller?.frameNetEmphasis?.(e,a)??!1}setMoveMode(e){this.controller?.setMoveMode?.(e)}setMoveSpace(e){this.controller?.setMoveSpace?.(e)}previewPose(e){this.controller?.previewPose?.(e)}cancelMove(){this.controller?.cancelMove?.()}getMoveState(){return this.controller?.getMoveState?.()??null}targetHarnessNode(e){this.controller?.targetHarnessNode?.(e)}previewHarnessNode(e){this.controller?.previewHarnessNode?.(e)}cancelHarnessNode(){this.controller?.cancelHarnessNode?.()}getHarnessState(){return this.controller?.getHarnessState?.()??null}setLabelsVisible(e){this.pendingLabels=!!e,this.controller?.setLabelsVisible?.(this.pendingLabels)}setHarnessesVisible(e){this.controller?.setHarnessesVisible?.(!!e)}setHelpVisible(e){this.controller?.setHelpVisible?.(e)}frameAll(){this.controller?.frameAll?.()}frameBoard(e){return this.controller?.frameBoard?.(e)??!1}frameParts(e){return this.controller?.frameParts?.(e)??!1}renderLoading(){this.shadowRoot.innerHTML='<style>:host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}</style><div style="display:grid;place-items:center;height:100%">Loading semantic visualizer...</div>'}renderShell(){this.shadowRoot.innerHTML=P0()}renderError(e){console.error(e),this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}
        .error{height:100%;display:grid;place-items:center;padding:24px}
        pre{max-width:100%;white-space:pre-wrap;color:#fecaca;background:#111827;border:1px solid #374151;padding:16px}
      </style>
      <div class="error"><pre>${O0(e?.stack||e?.message||String(e))}</pre></div>
    `}mountViewer({topology:e,semanticGeometry:a,readiness:s,assetCache:n=null,signal:r}){return Yr({root:this.shadowRoot,topology:e,semanticGeometry:a,readiness:s,workspaceScope:"3d",assetCache:n,isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{r.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:selectionchange",{bubbles:!0,composed:!0,detail:{selection:i}}))},onContextMenu:i=>{r.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:contextmenu",{bubbles:!0,composed:!0,detail:i}))},onViewStateChange:i=>{r.aborted||this.emitViewState(i)},onPerformanceEvent:i=>{r.aborted||(console.info("[prism-3d-perf]",i),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:performance",{bubbles:!0,composed:!0,detail:i})))}})}publishController(e){this.controller=e,this.controller?.setWorkspace?.(this.workspace),this.pendingHiddenComponents&&this.controller?.setHiddenComponents?.(this.pendingHiddenComponents),this.pendingGpuBudget!=null&&this.controller?.setGpuBudget?.(this.pendingGpuBudget),this.pendingSelection&&this.controller?.setSelection?.(this.pendingSelection),this.pendingHighlightedNets?.length&&this.controller?.setHighlightedNets?.(this.pendingHighlightedNets);let a=this.getViewState();a&&this.emitViewState(a)}emitViewState(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:viewstatechange",{bubbles:!0,composed:!0,detail:e}))}emitReady(e){console.info("[prism-3d-perf]",e),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:ready",{bubbles:!0,composed:!0,detail:e}))}emitError(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:error",{bubbles:!0,detail:{error:e}}))}setSelection(e){this.pendingSelection=e||null,this.controller?.setSelection?.(this.pendingSelection)}setHighlightedNets(e){this.pendingHighlightedNets=Array.isArray(e)?[...e]:[],this.controller?.setHighlightedNets?.(this.pendingHighlightedNets)}setHiddenComponents(e){this.pendingHiddenComponents=Array.isArray(e)?[...e]:[],this.controller?.setHiddenComponents?.(this.pendingHiddenComponents)}pickAt(e,a){return Promise.resolve(this.controller?.pickAt?.(e,a)??null)}projectComponent(e,a){return this.controller?.projectComponent?.(e,a)??null}setStatsOverlay(e){this.controller?.setStatsOverlay?.(e)}getStats(){return this.controller?.stats?.()??null}setLodOverride(e){this.controller?.setLodOverride?.(e)}setLodThresholds(e){return this.controller?.setLodThresholds?.(e)??null}setGpuBudget(e){this.pendingGpuBudget=e,this.controller?.setGpuBudget?.(e)}projectPoint(e,a){return this.controller?.projectPoint?.(e,a)??null}getComponentReferences(){return this.controller?.getComponentReferences?.()??[]}resize(){this.controller?.resize?.()}getViewState(){return this.controller?.getViewState?.()??null}setViewMode(e){this.controller?.setViewMode?.(e)}setLayerVisible(e,a,s=null){this.controller?.setLayerVisible?.(e,a,s)}applyLayerPreset(e,a=null){this.controller?.applyLayerPreset?.(e,a)}setShowBoard(e){this.controller?.setShowBoard?.(e)}setShowComponents(e){this.controller?.setShowComponents?.(e)}setShowPlaceholders(e){this.controller?.setShowPlaceholders?.(e)}setRealisticColors(e){this.controller?.setRealisticColors?.(e)}setSeparation(e,a=null){this.controller?.setSeparation?.(e,a)}showNetLayers(){this.controller?.showNetLayers?.()}setNetIsolation(e){this.controller?.setNetIsolation?.(e)}};function Eu(){customElements.get("prism-semantic-viewer")||customElements.define("prism-semantic-viewer",Mi)}window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__=!0;Eu();
