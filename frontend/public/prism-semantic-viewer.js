var qr=`:host,
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
`;var Dc=/\/api\/projects\/([^/]+)\/webgpu-3d\/assets\/([^/]+)\/([^/]+)\/(.+)$/,Uc="prism-bundle-cache-a0",Ls="manifest.json";function Ks(t){let e;try{e=new URL(t,"http://cache.invalid/")}catch{return null}let a=Dc.exec(e.pathname);if(!a)return null;let[,s,r,n,i]=a.map(decodeURIComponent);if(i.split("/").some(c=>!c||c==="."||c===".."))return null;let o=e.searchParams.get("viewer")||"";return`${s}/${r}/${n}/${i}${o?`?viewer=${o}`:""}`}function ja(t){return`a_${encodeURIComponent(t)}`}function Lc(t,e,{maxAgeMs:a=2592e6,maxBytes:s=2147483648}={}){let r=new Set,n=[];for(let[o,c]of Object.entries(t))e-Number(c.lastUsed||0)<=a?n.push([o,c]):r.add(o);n.sort((o,c)=>Number(c[1].lastUsed)-Number(o[1].lastUsed));let i=0;for(let[o,c]of n)i+=Number(c.bytes||0),i>s&&r.add(o);return[...r]}var zt=class t{static open(e={}){return t.shared||(t.shared=new t(e)),t.shared}constructor({maxAgeMs:e=2592e6,maxBytes:a=2147483648}={}){this.maxAgeMs=e,this.maxBytes=a,this.stats={hits:0,misses:0,bypassed:0,cachedBytes:0,networkBytes:0,writeErrors:0},this.ready=this.init(),this.flushTimer=null}async init(){try{let e=globalThis.navigator?.storage;if(!e?.getDirectory)return null;let s=await(await e.getDirectory()).getDirectoryHandle(Uc,{create:!0}),r=await s.getFileHandle(Ls,{create:!0});if(typeof r.createWritable!="function")return null;let n={};try{let i=await(await r.getFile()).text();n=i?JSON.parse(i).entries||{}:{}}catch{n={}}return this.directory=s,this.entries=n,await this.prune(),globalThis.addEventListener?.("pagehide",()=>void this.flush()),s}catch{return null}}get enabled(){return!!this.directory}async fetchBytes(e,{store:a=!0,signal:s}={}){let r=Ks(e);if(await this.ready,r&&this.directory){let c=await this.read(r);if(c)return this.stats.hits+=1,this.stats.cachedBytes+=c.byteLength,c;this.stats.misses+=1}else this.stats.bypassed+=1;let n=await fetch(e,{cache:"no-store",signal:s});if(!n.ok)throw new Error(`Failed to load ${e}: ${n.status}`);let i=await n.arrayBuffer(),o=Number(n.headers.get("content-length")||0);return this.stats.networkBytes+=i.byteLength,a&&r&&this.directory&&(!o||o===i.byteLength)&&this.write(r,i),i}async fetchJson(e,a={}){let s=await this.fetchBytes(e,a);return JSON.parse(new TextDecoder().decode(s))}async peekJson(e){let a=Ks(e);if(await this.ready,!a||!this.directory)return null;let s=await this.read(a);return s?(this.stats.hits+=1,this.stats.cachedBytes+=s.byteLength,JSON.parse(new TextDecoder().decode(s))):null}async store(e,a){let s=Ks(e);await this.ready,s&&this.directory&&await this.write(s,a)}async read(e){let a=this.entries[e];if(!a)return null;try{let s=await(await this.directory.getFileHandle(ja(e))).getFile();return s.size!==a.bytes?null:(a.lastUsed=Date.now(),this.scheduleFlush(),await s.arrayBuffer())}catch{return delete this.entries[e],null}}async write(e,a){try{let r=await(await this.directory.getFileHandle(ja(e),{create:!0})).createWritable();await r.write(a),await r.close(),this.entries[e]={bytes:a.byteLength,lastUsed:Date.now()},this.scheduleFlush()}catch{this.stats.writeErrors+=1}}async prune(e=Date.now()){if(!this.directory)return[];let a=Lc(this.entries,e,{maxAgeMs:this.maxAgeMs,maxBytes:this.maxBytes});for(let r of a)delete this.entries[r],await this.directory.removeEntry(ja(r)).catch(()=>{});let s=new Set(Object.keys(this.entries).map(ja));for await(let r of this.directory.keys())r!==Ls&&!s.has(r)&&await this.directory.removeEntry(r).catch(()=>{});return a.length&&await this.flush(),a}async clear(){await this.ready,this.directory&&(this.entries={},await this.prune(),await this.flush())}summary(){let e=Object.values(this.entries||{});return{enabled:this.enabled,files:e.length,bytes:e.reduce((a,s)=>a+Number(s.bytes||0),0),...this.stats}}scheduleFlush(){this.flushTimer||(this.flushTimer=setTimeout(()=>{this.flushTimer=null,this.flush()},1e3))}async flush(){if(this.directory)try{let a=await(await this.directory.getFileHandle(Ls,{create:!0})).createWritable();await a.write(JSON.stringify({schema:"prism.bundle_cache_manifest.a0",entries:this.entries})),await a.close()}catch{this.stats.writeErrors+=1}}};function Kc(t,e){if(!e)return t;let a=new URL(t);return a.searchParams.set("viewer",e),a.toString()}function Ba(t,e,a,s){let r=new URL(a.asset_base||"./",e),n=structuredClone(t||{}),i=o=>!o||typeof o!="string"?o:Kc(new URL(o,r).toString(),s);for(let o of["assets","semantic_gltf","schematic_world","schematic_vector","schematic_scene","bom"]){let c=n[o];if(!(!c||typeof c!="object"))for(let[d,u]of Object.entries(c))c[d]=i(u)}return n}function ia(t){return(t?.readiness?.stage||"semantic-ready")==="semantic-ready"&&(t?.readiness?.progress??100)>=100}var ne=(t,e,a)=>Math.max(e,Math.min(a,t)),Oa=(t,e,a)=>t+(e-t)*a;function Fe(t,e){return[t[0]+e[0],t[1]+e[1],t[2]+e[2]]}function Gc(t,e){return[t[0]-e[0],t[1]-e[1],t[2]-e[2]]}function ke(t,e){return[t[0]*e,t[1]*e,t[2]*e]}function zc(t){return Math.hypot(t[0],t[1],t[2])}function $e(t){let e=zc(t)||1;return ke(t,1/e)}function st(t,e){return[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]]}function oa(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function Xr(t,e){let a=e/2,s=Math.sin(a),r=$e(t);return[r[0]*s,r[1]*s,r[2]*s,Math.cos(a)]}function Ca(t,e){return[t[3]*e[0]+t[0]*e[3]+t[1]*e[2]-t[2]*e[1],t[3]*e[1]-t[0]*e[2]+t[1]*e[3]+t[2]*e[0],t[3]*e[2]+t[0]*e[1]-t[1]*e[0]+t[2]*e[3],t[3]*e[3]-t[0]*e[0]-t[1]*e[1]-t[2]*e[2]]}function Gs(t,e){let a=[e[0],e[1],e[2],0],s=[-t[0],-t[1],-t[2],t[3]];return Ca(Ca(t,a),s).slice(0,3)}function Pa(t,e){let a=new Float32Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Wr(t,e,a){let s=$e(Gc(t,e)),r=$e(st(a,s)),n=st(s,r);return new Float32Array([r[0],n[0],s[0],0,r[1],n[1],s[1],0,r[2],n[2],s[2],0,-oa(r,t),-oa(n,t),-oa(s,t),1])}function Jr(t,e,a,s){let r=1/Math.tan(t/2);return new Float32Array([r/e,0,0,0,0,r,0,0,0,0,a/(s-a),-1,0,0,a*s/(s-a),0])}function Yr(t,e,a,s){return new Float32Array([2/t,0,0,0,0,2/e,0,0,0,0,1/(s-a),0,0,0,1,1])}function zs(t){return[(t[0]+t[3])/2,(t[1]+t[4])/2,(t[2]+t[5])/2]}function _t(t){return Math.max(.001,Math.hypot(t[3]-t[0],t[4]-t[1],t[5]-t[2])/2)}var Vt=class{constructor(e){let a=zs(e),s=_t(e);this.focus=[...a],this.targetFocus=[...a],this.azimuth=-.62,this.targetAzimuth=this.azimuth,this.polar=.72,this.targetPolar=this.polar,this.distance=s*2.8,this.targetDistance=this.distance,this.orthoScale=s*2.15,this.targetOrthoScale=this.orthoScale,this.sceneRadius=s,this.fov=Math.PI/4}update(e){let a=1-Math.exp(-e*14);this.focus=this.focus.map((s,r)=>Oa(s,this.targetFocus[r],a)),this.azimuth=Qr(this.azimuth,this.targetAzimuth,a),this.polar=Qr(this.polar,this.targetPolar,a),this.distance=Oa(this.distance,this.targetDistance,a),this.orthoScale=Oa(this.orthoScale,this.targetOrthoScale,a)}snap(){this.focus=[...this.targetFocus],this.azimuth=this.targetAzimuth,this.polar=this.targetPolar,this.distance=this.targetDistance,this.orthoScale=this.targetOrthoScale}basis(){let e=Math.sin(this.polar),a=Math.cos(this.polar),s=$e([e*Math.sin(this.azimuth),-e*Math.cos(this.azimuth),a]),r=$e([Math.cos(this.azimuth),Math.sin(this.azimuth),0]),n=$e(st(s,r));return{right:r,up:n,back:s}}matrix(e,a,s=!1,r=1){let n=Math.max(.01,e/Math.max(1,a)),{up:i,back:o}=this.basis(),c=Fe(this.focus,ke(o,this.distance)),d=Wr(c,this.focus,i),u=s?Yr(this.orthoScale*r*n,this.orthoScale*r,-this.sceneRadius*40,this.sceneRadius*40):Jr(this.fov,n,Math.max(this.sceneRadius*5e-4,this.distance-this.sceneRadius*3.5),this.distance+this.sceneRadius*4.5);return Pa(u,d)}orbit(e,a){let s=Math.sin(this.targetPolar)<0?-1:1;this.targetAzimuth-=s*e*.006,this.targetPolar=$r(this.targetPolar-a*.006)}isBelow(){return Math.cos(this.targetPolar)<0}pan(e,a,s,r=!1){let{right:n,up:i}=this.basis(),o=r?this.targetOrthoScale/Math.max(1,s):2*this.targetDistance*Math.tan(this.fov/2)/Math.max(1,s),c=Fe(ke(n,-e*o),ke(i,a*o));this.targetFocus=Fe(this.targetFocus,c)}dolly(e,a=!1){let s=Math.exp(e*.0032);a?this.targetOrthoScale=ne(this.targetOrthoScale*s,this.sceneRadius*.008,this.sceneRadius*24):this.targetDistance=ne(this.targetDistance*s,this.sceneRadius*.01,this.sceneRadius*48)}frame(e){if(!e)return;let a=_t(e);this.targetFocus=zs(e),this.targetDistance=Math.max(a*2.8,this.sceneRadius*.02),this.targetOrthoScale=Math.max(a*2.15,this.sceneRadius*.02)}setFocus(e){this.targetFocus=[...e]}setAxis(e,a=!1){e==="z"?(this.targetAzimuth=0,this.targetPolar=a?Math.PI-.015:.015):e==="x"?(this.targetAzimuth=a?-Math.PI/2:Math.PI/2,this.targetPolar=Math.PI/2):(this.targetAzimuth=a?0:Math.PI,this.targetPolar=Math.PI/2)}rotateZ(e=1){this.targetAzimuth+=e*Math.PI/2}flip(){this.targetPolar=$r(Math.PI-this.targetPolar)}};function $r(t){return Math.atan2(Math.sin(t),Math.cos(t))}function Qr(t,e,a){let s=Math.atan2(Math.sin(e-t),Math.cos(e-t));return t+s*a}var Da=class t{static async create(e,a,s={}){let r=await fetch(a,{cache:"default"});if(!r.ok)throw new Error(`Failed to load BoM ${a}: ${r.status}`);let n=await r.json();if(n.schema!=="prism.bom_a0")throw new Error(`Unsupported BoM schema: ${n.schema||"missing"}`);let i=new t(e,n,s);return i.render(),i}constructor(e,a,s){this.container=e,this.payload=a,this.callbacks=s,this.query="",this.selectedRowId="",this.selectedReference="",this.rowsById=new Map((a.rows||[]).map(r=>[r.id,r])),this.componentIndex=new Map(Object.entries(a.componentIndex||{}))}setSelectionByReference(e,a={}){let s=this.componentIndex.get(e);s&&(this.selectedReference=e,this.selectedRowId=s.rowId,this.renderContent(),a.scroll&&this.container.querySelector(`[data-row-id="${qc(s.rowId)}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}))}clearSelection(){this.selectedReference="",this.selectedRowId="",this.renderContent()}render(){let e=this.filteredRows();this.container.innerHTML=`
      <section class="bom-workspace">
        <header class="bom-toolbar">
          <div>
            <p class="eyebrow">Prism BoM A0</p>
            <h2>Bill of Materials</h2>
            <span data-bom-count>${e.length} of ${(this.payload.rows||[]).length} grouped rows \xB7 ${(this.payload.components||[]).length} components</span>
          </div>
          <label class="bom-search">
            <span>Search</span>
            <input id="bom-search" type="search" value="${je(this.query)}" placeholder="Reference, value, footprint, manufacturer..." />
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
            <tr>${a.map(r=>`<th>${je(r)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${e.map(r=>this.rowHtml(r,a)).join("")}
          </tbody>
        </table>
      </div>
      ${s?`<aside class="bom-detail">${this.detailHtml(s)}</aside>`:""}
    `}filteredRows(){let e=this.query.trim().toLowerCase(),a=this.payload.rows||[];return e?a.filter(s=>JSON.stringify(s).toLowerCase().includes(e)):a}rowHtml(e,a){return`
      <tr class="${e.id===this.selectedRowId?"selected":""}" data-row-id="${je(e.id)}">
        ${a.map(r=>{let n=e.fields?.[r]||"";return r==="Reference"?`<td class="bom-reference-cell">${(e.references||[]).map(i=>`
              <button class="bom-ref-chip ${i===this.selectedReference?"active":""}" data-reference="${je(i)}">${je(i)}</button>
            `).join("")}</td>`:!n&&Hc(r)?'<td><span class="bom-missing">Missing</span></td>':`<td title="${je(n)}">${je(n)}</td>`}).join("")}
      </tr>
    `}detailHtml(e){let a=Vc(e,this.payload.displayColumns||[],this.payload.extraColumns||[]);return`
      <div class="bom-detail-head">
        <p class="eyebrow">Line item</p>
        <h3>${je((e.references||[]).join(", "))}</h3>
        <span>${e.qty} component${e.qty===1?"":"s"}${e.dnp?" \xB7 DNP":""}</span>
      </div>
      <div class="bom-ref-list">
        ${(e.references||[]).map(s=>`
          <button class="bom-ref-chip detail ${s===this.selectedReference?"active":""}" data-reference="${je(s)}">${je(s)}</button>
        `).join("")}
      </div>
      <dl class="bom-field-list">
        ${a.map(([s,r])=>`
          <div>
            <dt>${je(s)}</dt>
            <dd>${je(r)}</dd>
          </div>
        `).join("")}
      </dl>
    `}bind(){let e=this.container.querySelector("#bom-search");e?.addEventListener("input",()=>{this.query=e.value,this.renderContent()}),this.bindContent(this.container)}bindContent(e){e.querySelectorAll("[data-row-id]").forEach(a=>{a.addEventListener("click",s=>{s.target.closest("[data-reference]")||(this.selectedRowId=a.dataset.rowId,this.selectedReference="",this.renderContent())})}),e.querySelectorAll("[data-reference]").forEach(a=>{a.addEventListener("click",s=>{s.stopPropagation();let r=a.dataset.reference;this.setSelectionByReference(r),this.callbacks.onSelectReference?.(r)})})}};function Vc(t,e,a){let s=[],r=new Set(["Reference","Qty"].map(Vs));for(let i of e){if(i==="Reference"||i==="Qty")continue;let o=t.fields?.[i]||"";o&&(s.push([i,o]),r.add(Vs(i)))}let n=t.canonicalFields||{};for(let i of a){let o=n[i]||"";if(!o)continue;let c=Vs(i);r.has(c)||(r.add(c),s.push([i,o]))}return s}function Vs(t){return String(t||"").toLowerCase().replace(/[\s_\-()[\]/]+/g,"")}function Hc(t){return["Manufacturer Part Number","Vendor Part Number","Datasheet","Footprint","Value"].includes(t)}function je(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function qc(t){return String(t).replace(/["\\]/g,"\\$&")}function Ht(t){let e=`${t.nodeName||""} ${t.meshName||""} ${t.material?.name||""}`.toLowerCase();return e.includes("_pad")||e.includes(".pad")||e.endsWith("pad")?"pad":e.includes("silkscreen")?"silkscreen":e.includes("soldermask")?"soldermask":e.includes("paste")?"paste":"substrate"}function Nt(t,e=()=>""){let a=new Map;for(let s of t){let n=`${e(s)}:${JSON.stringify(s.material)}`;a.has(n)||a.set(n,[]),a.get(n).push(s)}return[...a.values()].map(s=>{let r=s.reduce((h,l)=>h+l.position.length/3,0),n=s.reduce((h,l)=>h+l.indices.length,0),i=new Float32Array(r*3),o=new Float32Array(r*3),c=new Uint32Array(r),d=new Uint32Array(r),u=new Uint32Array(n),b=0,w=0,v=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let h of s){let l=h.position.length/3;i.set(h.position,b*3),o.set(h.normal,b*3),c.set(h.netId,b),d.set(h.objectFeatureId,b);for(let m=0;m<h.indices.length;m+=1)u[w+m]=Number(h.indices[m])+b;h.bounds&&(v[0]=Math.min(v[0],h.bounds[0]),v[1]=Math.min(v[1],h.bounds[1]),v[2]=Math.min(v[2],h.bounds[2]),v[3]=Math.max(v[3],h.bounds[3]),v[4]=Math.max(v[4],h.bounds[4]),v[5]=Math.max(v[5],h.bounds[5])),b+=l,w+=h.indices.length}return{position:i,normal:o,netId:c,objectFeatureId:d,indices:u,material:s[0].material,groupKey:e(s[0]),bounds:Number.isFinite(v[0])?v:null}})}function qt(t){return!t||t.length!==6?null:[t[0]/1e3,-t[4]/1e3,t[2]/1e3,t[3]/1e3,-t[1]/1e3,t[5]/1e3]}function Xt(t){let e=t?.min||[0,0,0],a=t?.max||[.08,.0016,.05];return[e[0],-a[2],e[1],a[0],-e[2],a[1]]}function Ft(t){let e=t.filter(a=>Array.isArray(a)&&a.length===6);return e.length?e.reduce((a,s)=>[Math.min(a[0],s[0]),Math.min(a[1],s[1]),Math.min(a[2],s[2]),Math.max(a[3],s[3]),Math.max(a[4],s[4]),Math.max(a[5],s[5])],[...e[0]]):null}function Zr(t){let e=t.replace("#","");return[0,2,4].map(a=>parseInt(e.slice(a,a+2),16)/255)}function en(t,e){if(typeof t?.color=="string"&&/^#[0-9a-fA-F]{6}$/.test(t.color))return[...Zr(t.color),1];let a={"F.Cu":"#a9423c","B.Cu":"#315b9a","In1.Cu":"#477a55","In2.Cu":"#806244","In3.Cu":"#347c86","In4.Cu":"#685889","In5.Cu":"#92793e"},s=["#477a55","#806244","#347c86","#685889","#92793e","#82556e"],r=String(t?.name||""),n=Math.max(0,e.findIndex(i=>i.name===r)-1);return[...Zr(a[r]||s[n%s.length]),1]}function Ua(t,e){let a=e.map(s=>[Number(s.id),Number(s.z_mm||0)]);return a.length<3?!1:(a.sort((s,r)=>s[1]-r[1]),t!==a[0][0]&&t!==a[a.length-1][0])}var rt=Object.freeze({gold:[.83,.69,.37,1],silver:[.74,.75,.77,1],copper:[.76,.47,.28,1]});function ca(t){let e=String(t||"").toLowerCase();return/hasl|hal\b|tin|silver|lead/.test(e)?rt.silver:/osp|bare|none/.test(e)?rt.copper:rt.gold}function la(t,e){let a=String(t?.name||"");return!!a&&(a===e[0]?.name||a===e[e.length-1]?.name)}function La(t,e){let a=String(t.material?.name||"").endsWith("_bottom"),s=e.find(r=>r.name===(a?"B.Cu":"F.Cu"))||(a?e[e.length-1]:e[0]);return Number(s?.id||0)}function tn(t,e=new Map){let a=new Map;for(let r of t||[]){let n=String(r?.designator||"");if(!n)continue;let i=a.get(n)||{reference:n,featureIds:new Set,modelCount:0},o=Number(r?.featureId)||0;o>0&&i.featureIds.add(o),a.set(n,i)}for(let[r,n]of e||[]){let i=a.get(String(r));i&&(i.modelCount=Math.max(i.modelCount,Number(n)||0))}let s=new Map;for(let[r,n]of a)s.set(r,{reference:r,featureIds:[...n.featureIds].sort((i,o)=>i-o),ambiguous:n.featureIds.size>1||n.modelCount>1});return s}function an(t,e){let a=[...new Set((Array.isArray(t)?t:[]).map(c=>String(c||"")).filter(Boolean))],s=[],r=[],n=[],i=new Set,o=new Set;for(let c of a){let d=e.get(c);if(!d){n.push(c);continue}if(d.ambiguous){r.push(c);continue}s.push(c),o.add(c);for(let u of d.featureIds)i.add(u)}return{requested:a,applied:s,ambiguous:r,unknown:n,hiddenFeatureIds:i,hiddenReferences:o}}function Ka(t,e){return!!t&&e.has(String(t))}var Xc={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function U(t){return String(t??"").replace(/[&<>"']/g,e=>Xc[e])}var Hs=`
fn netEmphasized(id: u32) -> bool {
  return id != 0u && id < arrayLength(&netMask) && netMask[id] != 0u;
}
`;function Ga(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function sn(t,e=0){let a=0;for(let r of Ga(t))a=Math.max(a,r);let s=64;for(;s<a+1;)s*=2;return Math.max(s,Math.floor(e)||0)}function rn(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(0);for(let r of Ga(t))r<a&&(s[r]=1);return s}function jt(t,e){return!Array.isArray(t)||!e?null:t.find(a=>a.name===e||Array.isArray(a.aliases)&&a.aliases.includes(e))||null}function nn(t,e){let a=new Set;if(!Array.isArray(t)||!Array.isArray(e))return a;for(let s of e){if(!s)continue;let r=s.netUid&&t.find(i=>i.uid===s.netUid)||s.netName&&jt(t,s.netName),n=Number(r?.id);Number.isInteger(n)&&n>0&&a.add(n)}return a}var qs=Object.freeze([[.08,1,.2],[1,.72,.1],[.2,.75,1],[1,.3,.75],[.65,.45,1],[1,.45,.2],[.3,1,.85],[.95,.95,.3]]),on=`
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
`;function cn(t){let e=null;return Array.isArray(t)&&t.length>=3&&t.slice(0,3).every(a=>Number.isFinite(Number(a)))?e=t.slice(0,3).map(a=>Math.round(Math.min(1,Math.max(0,Number(a)))*255)):typeof t=="string"&&/^#[0-9a-f]{6}$/i.test(t)&&(e=[1,3,5].map(a=>parseInt(t.slice(a,a+2),16))),e?(1<<24|e[0]<<16|e[1]<<8|e[2])>>>0:1}function ln(t){let e=1;for(let s of t)for(let r of s?.keys()||[])e=Math.max(e,r+1);let a=new Uint32Array(Math.max(64,t.length*e));return t.forEach((s,r)=>{for(let[n,i]of s||[])Number.isInteger(n)&&n>0&&(a[r*e+n]=i>>>0)}),{stride:e,data:a}}var dn=class{_listeners={};addEventListener(t,e){let a=this._listeners;return a[t]===void 0&&(a[t]=[]),a[t].indexOf(e)===-1&&a[t].push(e),this}removeEventListener(t,e){let a=this._listeners[t];if(a!==void 0){let s=a.indexOf(e);s!==-1&&a.splice(s,1)}return this}dispatchEvent(t){let e=this._listeners[t.type];if(e!==void 0){let a=e.slice(0);for(let s=0,r=a.length;s<r;s++)a[s].call(this,t)}return this}dispose(){for(let t in this._listeners)delete this._listeners[t]}},it=class{_disposed=!1;_name;_parent;_child;_attributes;constructor(t,e,a,s={}){if(this._name=t,this._parent=e,this._child=a,this._attributes=s,!e.isOnGraph(a))throw new Error("Cannot connect disconnected graphs.")}getName(){return this._name}getParent(){return this._parent}getChild(){return this._child}setChild(t){return this._child=t,this}getAttributes(){return this._attributes}dispose(){this._disposed||(this._parent._destroyRef(this),this._disposed=!0)}isDisposed(){return this._disposed}},Xs=class extends dn{_emptySet=new Set;_edges=new Set;_parentEdges=new Map;_childEdges=new Map;listEdges(){return Array.from(this._edges)}listParentEdges(t){return Array.from(this._childEdges.get(t)||this._emptySet)}listParents(t){let e=new Set;for(let a of this.listParentEdges(t))e.add(a.getParent());return Array.from(e)}listChildEdges(t){return Array.from(this._parentEdges.get(t)||this._emptySet)}listChildren(t){let e=new Set;for(let a of this.listChildEdges(t))e.add(a.getChild());return Array.from(e)}disconnectParents(t,e){for(let a of this.listParentEdges(t))(!e||e(a.getParent()))&&a.dispose();return this}_createEdge(t,e,a,s){let r=new it(t,e,a,s);this._edges.add(r);let n=r.getParent();this._parentEdges.has(n)||this._parentEdges.set(n,new Set),this._parentEdges.get(n).add(r);let i=r.getChild();return this._childEdges.has(i)||this._childEdges.set(i,new Set),this._childEdges.get(i).add(r),r}_destroyEdge(t){return this._edges.delete(t),this._parentEdges.get(t.getParent()).delete(t),this._childEdges.get(t.getChild()).delete(t),this}},he=class{list=[];constructor(t){if(t)for(let e of t)this.list.push(e)}add(t){this.list.push(t)}remove(t){let e=this.list.indexOf(t);e>=0&&this.list.splice(e,1)}removeChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);for(let a of e)this.remove(a);return e}listRefsByChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);return e}values(){return this.list}},te=class{set=new Set;map=new Map;constructor(t){if(t)for(let e of t)this.add(e)}add(t){let e=t.getChild();this.removeChild(e),this.set.add(t),this.map.set(e,t)}remove(t){this.set.delete(t),this.map.delete(t.getChild())}removeChild(t){let e=this.map.get(t)||null;return e&&this.remove(e),e}getRefByChild(t){return this.map.get(t)||null}values(){return Array.from(this.set)}},le=class{map={};constructor(t){t&&Object.assign(this.map,t)}set(t,e){this.map[t]=e}delete(t){delete this.map[t]}get(t){return this.map[t]||null}keys(){return Object.keys(this.map)}values(){return Object.values(this.map)}},Y=Symbol("attributes"),nt=Symbol("immutableKeys"),un=class fn extends dn{_disposed=!1;graph;[Y];[nt];constructor(e){super(),this.graph=e,this[nt]=new Set,this[Y]=this._createAttributes()}getDefaults(){return{}}_createAttributes(){let e=this.getDefaults(),a={};for(let s in e){let r=e[s];if(r instanceof fn){let n=this.graph._createEdge(s,this,r);this[nt].add(s),a[s]=n}else a[s]=r}return a}isOnGraph(e){return this.graph===e.graph}isDisposed(){return this._disposed}dispose(){this._disposed||(this.graph.listChildEdges(this).forEach(e=>e.dispose()),this.graph.disconnectParents(this),this._disposed=!0,this.dispatchEvent({type:"dispose"}))}detach(){return this.graph.disconnectParents(this),this}swap(e,a){for(let s in this[Y]){let r=this[Y][s];if(r instanceof it){let n=r;n.getChild()===e&&this.setRef(s,a,n.getAttributes())}else if(r instanceof he)for(let n of r.listRefsByChild(e)){let i=n.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}else if(r instanceof te){let n=r.getRefByChild(e);if(n){let i=n.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}}else if(r instanceof le)for(let n of r.keys()){let i=r.get(n);i.getChild()===e&&this.setRefMap(s,n,a,i.getAttributes())}}return this}get(e){return this[Y][e]}set(e,a){return this[Y][e]=a,this.dispatchEvent({type:"change",attribute:e})}getRef(e){let a=this[Y][e];return a?a.getChild():null}setRef(e,a,s){if(this[nt].has(e))throw new Error(`Cannot overwrite immutable attribute, "${e}".`);let r=this[Y][e];if(r&&r.dispose(),!a)return this;let n=this.graph._createEdge(e,this,a,s);return this[Y][e]=n,this.dispatchEvent({type:"change",attribute:e})}listRefs(e){return this.assertRefList(e).values().map(a=>a.getChild())}addRef(e,a,s){let r=this.graph._createEdge(e,this,a,s);return this.assertRefList(e).add(r),this.dispatchEvent({type:"change",attribute:e})}removeRef(e,a){let s=this.assertRefList(e);if(s instanceof he)for(let r of s.listRefsByChild(a))r.dispose();else{let r=s.getRefByChild(a);r&&r.dispose()}return this}assertRefList(e){let a=this[Y][e];if(a instanceof he||a instanceof te)return a;throw new Error(`Expected RefList or RefSet for attribute "${e}"`)}listRefMapKeys(e){return this.assertRefMap(e).keys()}listRefMapValues(e){return this.assertRefMap(e).values().map(a=>a.getChild())}getRefMap(e,a){let s=this.assertRefMap(e).get(a);return s?s.getChild():null}setRefMap(e,a,s,r){let n=this.assertRefMap(e),i=n.get(a);if(i&&i.dispose(),!s)return this;r=Object.assign(r||{},{key:a});let o=this.graph._createEdge(e,this,s,{...r,key:a});return n.set(a,o),this.dispatchEvent({type:"change",attribute:e,key:a})}assertRefMap(e){let a=this[Y][e];if(a instanceof le)return a;throw new Error(`Expected RefMap for attribute "${e}"`)}dispatchEvent(e){return super.dispatchEvent({...e,target:this}),this.graph.dispatchEvent({...e,target:this,type:`node:${e.type}`}),this}_destroyRef(e){let a=e.getName();if(this[Y][a]===e)this[Y][a]=null,this[nt].has(a)&&e.getChild().dispose();else if(this[Y][a]instanceof he)this[Y][a].remove(e);else if(this[Y][a]instanceof te)this[Y][a].remove(e);else if(this[Y][a]instanceof le){let s=this[Y][a];for(let r of s.keys())s.get(r)===e&&s.delete(r)}else return;this.graph._destroyEdge(e),this.dispatchEvent({type:"change",attribute:a})}};var xn="v4.4.2",ct="@glb.bin",N=(function(t){return t.ACCESSOR="Accessor",t.ANIMATION="Animation",t.ANIMATION_CHANNEL="AnimationChannel",t.ANIMATION_SAMPLER="AnimationSampler",t.BUFFER="Buffer",t.CAMERA="Camera",t.MATERIAL="Material",t.MESH="Mesh",t.PRIMITIVE="Primitive",t.PRIMITIVE_TARGET="PrimitiveTarget",t.NODE="Node",t.ROOT="Root",t.SCENE="Scene",t.SKIN="Skin",t.TEXTURE="Texture",t.TEXTURE_INFO="TextureInfo",t})({});var Wc=(function(t){return t.ARRAY_BUFFER="ARRAY_BUFFER",t.ELEMENT_ARRAY_BUFFER="ELEMENT_ARRAY_BUFFER",t.INVERSE_BIND_MATRICES="INVERSE_BIND_MATRICES",t.OTHER="OTHER",t.SPARSE="SPARSE",t})({}),Ue=(function(t){return t[t.R=4096]="R",t[t.G=256]="G",t[t.B=16]="B",t[t.A=1]="A",t})({});var Jc=class extends Float32Array{constructor(){throw super(),new Error("Unsupported typed array instantiation.")}},Ya={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5131:typeof Float16Array<"u"?Float16Array:Jc,5126:Float32Array,5130:Float64Array},G=class{static createBufferFromDataURI(t){if(typeof Buffer>"u"){let e=atob(t.split(",")[1]),a=new Uint8Array(e.length);for(let s=0;s<e.length;s++)a[s]=e.charCodeAt(s);return a}else{let e=t.split(",")[1],a=t.indexOf("base64")>=0;return Buffer.from(e,a?"base64":"utf8")}}static encodeText(t){return new TextEncoder().encode(t)}static decodeText(t){return new TextDecoder().decode(t)}static concat(t){let e=0;for(let r of t)e+=r.byteLength;let a=new Uint8Array(e),s=0;for(let r of t)a.set(r,s),s+=r.byteLength;return a}static pad(t,e=0){let a=this.padNumber(t.byteLength);if(a===t.byteLength)return t;let s=new Uint8Array(a);if(s.set(t),e!==0)for(let r=t.byteLength;r<a;r++)s[r]=e;return s}static padNumber(t){return Math.ceil(t/4)*4}static equals(t,e){if(t===e)return!0;if(t.byteLength!==e.byteLength)return!1;let a=t.byteLength;for(;a--;)if(t[a]!==e[a])return!1;return!0}static toView(t,e=0,a=1/0){return new Uint8Array(t.buffer,t.byteOffset+e,Math.min(t.byteLength,a))}static assertView(t){if(t&&!ArrayBuffer.isView(t))throw new Error(`Method requires Uint8Array parameter; received "${typeof t}".`);return t}};var Yc=class{match(t){return t.length>=3&&t[0]===255&&t[1]===216&&t[2]===255}getSize(t){let e=new DataView(t.buffer,t.byteOffset+4),a,s;for(;e.byteLength;){if(a=e.getUint16(0,!1),Qc(e,a),s=e.getUint8(a+1),s===192||s===193||s===194)return[e.getUint16(a+7,!1),e.getUint16(a+5,!1)];e=new DataView(t.buffer,e.byteOffset+a+2)}throw new TypeError("Invalid JPG, no size found")}getChannels(t){return 3}},$c=class vn{static PNG_FRIED_CHUNK_NAME="CgBI";match(e){return e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71&&e[4]===13&&e[5]===10&&e[6]===26&&e[7]===10}getSize(e){let a=new DataView(e.buffer,e.byteOffset);return G.decodeText(e.slice(12,16))===vn.PNG_FRIED_CHUNK_NAME?[a.getUint32(32,!1),a.getUint32(36,!1)]:[a.getUint32(16,!1),a.getUint32(20,!1)]}getChannels(e){return 4}},qe=class{static impls={"image/jpeg":new Yc,"image/png":new $c};static registerFormat(t,e){this.impls[t]=e}static getMimeType(t){for(let e in this.impls)if(this.impls[e].match(t))return e;return null}static getSize(t,e){return this.impls[e]?this.impls[e].getSize(t):null}static getChannels(t,e){return this.impls[e]?this.impls[e].getChannels(t):null}static getVRAMByteLength(t,e){if(!this.impls[e])return null;if(this.impls[e].getVRAMByteLength)return this.impls[e].getVRAMByteLength(t);let a=0,s=4,r=this.getSize(t,e);if(!r)return null;for(;r[0]>1||r[1]>1;)a+=r[0]*r[1]*s,r[0]=Math.max(Math.floor(r[0]/2),1),r[1]=Math.max(Math.floor(r[1]/2),1);return a+=1*s,a}static mimeTypeToExtension(t){return t==="image/jpeg"?"jpg":t.split("/").pop()}static extensionToMimeType(t){return t==="jpg"?"image/jpeg":t?`image/${t}`:""}};function Qc(t,e){if(e>t.byteLength)throw new TypeError("Corrupt JPG, exceeded buffer limits");if(t.getUint8(e)!==255)throw new TypeError("Invalid JPG, marker table corrupted");return t}var Wt=class{static basename(t){let e=t.split(/[\\/]/).pop();return e.substring(0,e.lastIndexOf("."))}static extension(t){if(t.startsWith("data:image/")){let e=t.match(/data:(image\/\w+)/)[1];return qe.mimeTypeToExtension(e)}else{if(t.startsWith("data:model/gltf+json"))return"gltf";if(t.startsWith("data:model/gltf-binary"))return"glb";if(t.startsWith("data:application/"))return"bin"}return t.split(/[\\/]/).pop().split(/[.]/).pop()}},Ys=typeof Float32Array<"u"?Float32Array:Array;Math.PI/180;180/Math.PI;function Zc(){var t=new Ys(3);return Ys!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function Ws(t){var e=t[0],a=t[1],s=t[2];return Math.sqrt(e*e+a*a+s*s)}function el(t,e,a){var s=e[0],r=e[1],n=e[2],i=a[3]*s+a[7]*r+a[11]*n+a[15];return i=i||1,t[0]=(a[0]*s+a[4]*r+a[8]*n+a[12])/i,t[1]=(a[1]*s+a[5]*r+a[9]*n+a[13])/i,t[2]=(a[2]*s+a[6]*r+a[10]*n+a[14])/i,t}(function(){var t=Zc();return function(e,a,s,r,n,i){var o,c;for(a||(a=3),s||(s=0),r?c=Math.min(r*a+s,e.length):c=e.length,o=s;o<c;o+=a)t[0]=e[o],t[1]=e[o+1],t[2]=e[o+2],n(t,t,i),e[o]=t[0],e[o+1]=t[1],e[o+2]=t[2];return e}})();function wn(t){let e=En(),a=t.propertyType==="Node"?[t]:t.listChildren();for(let s of a)s.traverse(r=>{let n=r.getMesh();if(!n)return;let i=tl(n,r.getWorldMatrix());i.min.every(isFinite)&&i.max.every(isFinite)&&($s(i.min,e),$s(i.max,e))});return e}function tl(t,e){let a=En();for(let s of t.listPrimitives()){let r=s.getAttribute("POSITION"),n=s.getIndices();if(!r)continue;let i=[0,0,0],o=[0,0,0];for(let c=0,d=n?n.getCount():r.getCount();c<d;c++){let u=n?n.getScalar(c):c;i=r.getElement(u,i),o=el(o,i,e),$s(o,a)}}return a}function $s(t,e){for(let a=0;a<3;a++)e.min[a]=Math.min(t[a],e.min[a]),e.max[a]=Math.max(t[a],e.max[a])}function En(){return{min:[1/0,1/0,1/0],max:[-1/0,-1/0,-1/0]}}var hn="https://null.example",Js=class{static DEFAULT_INIT={};static PROTOCOL_REGEXP=/^[a-zA-Z]+:\/\//;static dirname(t){let e=t.lastIndexOf("/");return e===-1?"./":t.substring(0,e+1)}static basename(t){return Wt.basename(new URL(t,hn).pathname)}static extension(t){return Wt.extension(new URL(t,hn).pathname)}static resolve(t,e){if(!this.isRelativePath(e))return e;let a=t.split("/"),s=e.split("/");a.pop();for(let r=0;r<s.length;r++)s[r]!=="."&&(s[r]===".."?a.pop():a.push(s[r]));return a.join("/")}static isAbsoluteURL(t){return this.PROTOCOL_REGEXP.test(t)}static isRelativePath(t){return!/^(?:[a-zA-Z]+:)?\//.test(t)}};function bn(t){return Object.prototype.toString.call(t)==="[object Object]"}function Bt(t){if(bn(t)===!1)return!1;let e=t.constructor;if(e===void 0)return!0;let a=e.prototype;return!(bn(a)===!1||Object.hasOwn(a,"isPrototypeOf")===!1)}var al=(function(t){return t[t.SILENT=4]="SILENT",t[t.ERROR=3]="ERROR",t[t.WARN=2]="WARN",t[t.INFO=1]="INFO",t[t.DEBUG=0]="DEBUG",t})({}),$a=class Tn{verbosity;static Verbosity=al;static DEFAULT_INSTANCE=new Tn(1);constructor(e){this.verbosity=e}debug(e){this.verbosity<=0&&console.debug(e)}info(e){this.verbosity<=1&&console.info(e)}warn(e){this.verbosity<=2&&console.warn(e)}error(e){this.verbosity<=3&&console.error(e)}};function sl(t){var e=t[0],a=t[1],s=t[2],r=t[3],n=t[4],i=t[5],o=t[6],c=t[7],d=t[8],u=t[9],b=t[10],w=t[11],v=t[12],h=t[13],l=t[14],m=t[15],f=e*i-a*n,p=e*o-s*n,y=a*o-s*i,E=d*h-u*v,T=d*l-b*v,I=u*l-b*h,M=e*I-a*T+s*E,R=n*I-i*T+o*E,A=d*y-u*p+b*f,S=v*y-h*p+l*f;return c*M-r*R+m*A-w*S}function rl(t,e,a){var s=e[0],r=e[1],n=e[2],i=e[3],o=e[4],c=e[5],d=e[6],u=e[7],b=e[8],w=e[9],v=e[10],h=e[11],l=e[12],m=e[13],f=e[14],p=e[15],y=a[0],E=a[1],T=a[2],I=a[3];return t[0]=y*s+E*o+T*b+I*l,t[1]=y*r+E*c+T*w+I*m,t[2]=y*n+E*d+T*v+I*f,t[3]=y*i+E*u+T*h+I*p,y=a[4],E=a[5],T=a[6],I=a[7],t[4]=y*s+E*o+T*b+I*l,t[5]=y*r+E*c+T*w+I*m,t[6]=y*n+E*d+T*v+I*f,t[7]=y*i+E*u+T*h+I*p,y=a[8],E=a[9],T=a[10],I=a[11],t[8]=y*s+E*o+T*b+I*l,t[9]=y*r+E*c+T*w+I*m,t[10]=y*n+E*d+T*v+I*f,t[11]=y*i+E*u+T*h+I*p,y=a[12],E=a[13],T=a[14],I=a[15],t[12]=y*s+E*o+T*b+I*l,t[13]=y*r+E*c+T*w+I*m,t[14]=y*n+E*d+T*v+I*f,t[15]=y*i+E*u+T*h+I*p,t}function nl(t,e){var a=e[0],s=e[1],r=e[2],n=e[4],i=e[5],o=e[6],c=e[8],d=e[9],u=e[10];return t[0]=Math.sqrt(a*a+s*s+r*r),t[1]=Math.sqrt(n*n+i*i+o*o),t[2]=Math.sqrt(c*c+d*d+u*u),t}function il(t,e){var a=new Ys(3);nl(a,e);var s=1/a[0],r=1/a[1],n=1/a[2],i=e[0]*s,o=e[1]*r,c=e[2]*n,d=e[4]*s,u=e[5]*r,b=e[6]*n,w=e[8]*s,v=e[9]*r,h=e[10]*n,l=i+u+h,m=0;return l>0?(m=Math.sqrt(l+1)*2,t[3]=.25*m,t[0]=(b-v)/m,t[1]=(w-c)/m,t[2]=(o-d)/m):i>u&&i>h?(m=Math.sqrt(1+i-u-h)*2,t[3]=(b-v)/m,t[0]=.25*m,t[1]=(o+d)/m,t[2]=(w+c)/m):u>h?(m=Math.sqrt(1+u-i-h)*2,t[3]=(w-c)/m,t[0]=(o+d)/m,t[1]=.25*m,t[2]=(b+v)/m):(m=Math.sqrt(1+h-i-u)*2,t[3]=(o-d)/m,t[0]=(w+c)/m,t[1]=(b+v)/m,t[2]=.25*m),t}var se=class da{static identity(e){return e}static eq(e,a,s=1e-5){if(e.length!==a.length)return!1;for(let r=0;r<e.length;r++)if(Math.abs(e[r]-a[r])>s)return!1;return!0}static clamp(e,a,s){return e<a?a:e>s?s:e}static decodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return e/65535;case 5121:return e/255;case 5122:return Math.max(e/32767,-1);case 5120:return Math.max(e/127,-1);default:throw new Error("Invalid component type.")}}static encodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return Math.round(da.clamp(e,0,1)*65535);case 5121:return Math.round(da.clamp(e,0,1)*255);case 5122:return Math.round(da.clamp(e,-1,1)*32767);case 5120:return Math.round(da.clamp(e,-1,1)*127);default:throw new Error("Invalid component type.")}}static decompose(e,a,s,r){let n=Ws([e[0],e[1],e[2]]),i=Ws([e[4],e[5],e[6]]),o=Ws([e[8],e[9],e[10]]);sl(e)<0&&(n=-n),a[0]=e[12],a[1]=e[13],a[2]=e[14];let c=e.slice(),d=1/n,u=1/i,b=1/o;c[0]*=d,c[1]*=d,c[2]*=d,c[4]*=u,c[5]*=u,c[6]*=u,c[8]*=b,c[9]*=b,c[10]*=b,il(s,c),r[0]=n,r[1]=i,r[2]=o}static compose(e,a,s,r){let n=r,i=a[0],o=a[1],c=a[2],d=a[3],u=i+i,b=o+o,w=c+c,v=i*u,h=i*b,l=i*w,m=o*b,f=o*w,p=c*w,y=d*u,E=d*b,T=d*w,I=s[0],M=s[1],R=s[2];return n[0]=(1-(m+p))*I,n[1]=(h+T)*I,n[2]=(l-E)*I,n[3]=0,n[4]=(h-T)*M,n[5]=(1-(v+p))*M,n[6]=(f+y)*M,n[7]=0,n[8]=(l+E)*R,n[9]=(f-y)*R,n[10]=(1-(v+m))*R,n[11]=0,n[12]=e[0],n[13]=e[1],n[14]=e[2],n[15]=1,n}};function ol(t,e){if(!!t!=!!e)return!1;let a=t.getChild(),s=e.getChild();return a===s||a.equals(s)}function cl(t,e){if(!!t!=!!e)return!1;let a=t.values(),s=e.values();if(a.length!==s.length)return!1;for(let r=0;r<a.length;r++){let n=a[r],i=s[r];if(n.getChild()!==i.getChild()&&!n.getChild().equals(i.getChild()))return!1}return!0}function ll(t,e){if(!!t!=!!e)return!1;let a=t.keys(),s=e.keys();if(a.length!==s.length)return!1;for(let r of a){let n=t.get(r),i=e.get(r);if(!!n!=!!i)return!1;let o=n.getChild(),c=i.getChild();if(o!==c&&!o.equals(c))return!1}return!0}function kn(t,e){if(t===e)return!0;if(!!t!=!!e||!t||!e||t.length!==e.length)return!1;for(let a=0;a<t.length;a++)if(t[a]!==e[a])return!1;return!0}function Mn(t,e){if(t===e)return!0;if(!!t!=!!e)return!1;if(!Bt(t)||!Bt(e))return t===e;let a=t,s=e,r=0,n=0,i;for(i in a)r++;for(i in s)n++;if(r!==n)return!1;for(i in a){let o=a[i],c=s[i];if(Wa(o)&&Wa(c)){if(!kn(o,c))return!1}else if(Bt(o)&&Bt(c)){if(!Mn(o,c))return!1}else if(o!==c)return!1}return!0}function Wa(t){return Array.isArray(t)||ArrayBuffer.isView(t)}var dl="23456789abdegjkmnpqrvwxyzABDEGJKMNPQRVWXYZ",ul=999,fl=6,pn=new Set,hl=function(){let t="";for(let e=0;e<fl;e++)t+=dl.charAt(Math.floor(Math.random()*42));return t},bl=function(){for(let t=0;t<ul;t++){let e=hl();if(!pn.has(e))return pn.add(e),e}return""},lt=t=>t,pl=new Set,er=class extends un{constructor(t,e=""){super(t),this[Y].name=e,this.init(),this.dispatchEvent({type:"create"})}getGraph(){return this.graph}getDefaults(){return Object.assign(super.getDefaults(),{name:"",extras:{}})}set(t,e){return Array.isArray(e)&&(e=e.slice()),super.set(t,e)}getName(){return this.get("name")}setName(t){return this.set("name",t)}getExtras(){return this.get("extras")}setExtras(t){return this.set("extras",t)}clone(){let t=this.constructor;return new t(this.graph).copy(this,lt)}copy(t,e=lt){for(let a in this[Y]){let s=this[Y][a];if(s instanceof it)this[nt].has(a)||s.dispose();else if(s instanceof he||s instanceof te)for(let r of s.values())r.dispose();else if(s instanceof le)for(let r of s.values())r.dispose()}for(let a in t[Y]){let s=this[Y][a],r=t[Y][a];if(r instanceof it)this[nt].has(a)?s.getChild().copy(e(r.getChild()),e):this.setRef(a,e(r.getChild()),r.getAttributes());else if(r instanceof te||r instanceof he)for(let n of r.values())this.addRef(a,e(n.getChild()),n.getAttributes());else if(r instanceof le)for(let n of r.keys()){let i=r.get(n);this.setRefMap(a,n,e(i.getChild()),i.getAttributes())}else Bt(r)?this[Y][a]=JSON.parse(JSON.stringify(r)):Array.isArray(r)||r instanceof ArrayBuffer||ArrayBuffer.isView(r)?this[Y][a]=r.slice():this[Y][a]=r}return this}equals(t,e=pl){if(this===t)return!0;if(this.propertyType!==t.propertyType)return!1;for(let a in this[Y]){if(e.has(a))continue;let s=this[Y][a],r=t[Y][a];if(s instanceof it||r instanceof it){if(!ol(s,r))return!1}else if(s instanceof te||r instanceof te||s instanceof he||r instanceof he){if(!cl(s,r))return!1}else if(s instanceof le||r instanceof le){if(!ll(s,r))return!1}else if(Bt(s)||Bt(r)){if(!Mn(s,r))return!1}else if(Wa(s)||Wa(r)){if(!kn(s,r))return!1}else if(s!==r)return!1}return!0}detach(){return this.graph.disconnectParents(this,t=>t.propertyType!=="Root"),this}listParents(){return this.graph.listParents(this)}},xe=class extends er{getDefaults(){return Object.assign(super.getDefaults(),{extensions:new le})}getExtension(t){return this.getRefMap("extensions",t)}setExtension(t,e){return e&&e._validateParent(this),this.setRefMap("extensions",t,e)}listExtensions(){return this.listRefMapValues("extensions")}},D=class de extends xe{static Type={SCALAR:"SCALAR",VEC2:"VEC2",VEC3:"VEC3",VEC4:"VEC4",MAT2:"MAT2",MAT3:"MAT3",MAT4:"MAT4"};static ComponentType={BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,FLOAT:5126,FLOAT16:5131,FLOAT64:5130};init(){this.propertyType="Accessor"}getDefaults(){return Object.assign(super.getDefaults(),{array:null,type:de.Type.SCALAR,componentType:de.ComponentType.FLOAT,normalized:!1,sparse:!1,buffer:null})}static getElementSize(e){switch(e){case de.Type.SCALAR:return 1;case de.Type.VEC2:return 2;case de.Type.VEC3:return 3;case de.Type.VEC4:return 4;case de.Type.MAT2:return 4;case de.Type.MAT3:return 9;case de.Type.MAT4:return 16;default:throw new Error("Unexpected type: "+e)}}static getComponentSize(e){switch(e){case de.ComponentType.BYTE:case de.ComponentType.UNSIGNED_BYTE:return 1;case de.ComponentType.SHORT:case de.ComponentType.UNSIGNED_SHORT:return 2;case de.ComponentType.UNSIGNED_INT:case de.ComponentType.FLOAT:return 4;case de.ComponentType.FLOAT16:return 2;case de.ComponentType.FLOAT64:return 8;default:throw new Error("Unexpected component type: "+e)}}getMinNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),r=this.getComponentType();if(this.getMin(e),a)for(let n=0;n<s;n++)e[n]=se.decodeNormalizedInt(e[n],r);return e}getMin(e){let a=this.getArray(),s=this.getCount(),r=this.getElementSize();for(let n=0;n<r;n++)e[n]=1/0;for(let n=0;n<s*r;n+=r)for(let i=0;i<r;i++){let o=a[n+i];Number.isFinite(o)&&(e[i]=Math.min(e[i],o))}return e}getMaxNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),r=this.getComponentType();if(this.getMax(e),a)for(let n=0;n<s;n++)e[n]=se.decodeNormalizedInt(e[n],r);return e}getMax(e){let a=this.get("array"),s=this.getCount(),r=this.getElementSize();for(let n=0;n<r;n++)e[n]=-1/0;for(let n=0;n<s*r;n+=r)for(let i=0;i<r;i++){let o=a[n+i];Number.isFinite(o)&&(e[i]=Math.max(e[i],o))}return e}getCount(){let e=this.get("array");return e?e.length/this.getElementSize():0}getType(){return this.get("type")}setType(e){return this.set("type",e)}getElementSize(){return de.getElementSize(this.get("type"))}getComponentSize(){return this.get("array").BYTES_PER_ELEMENT}getComponentType(){return this.get("componentType")}getNormalized(){return this.get("normalized")}setNormalized(e){return this.set("normalized",e)}getScalar(e){let a=this.getElementSize(),s=this.getComponentType(),r=this.getArray();return this.getNormalized()?se.decodeNormalizedInt(r[e*a],s):r[e*a]}setScalar(e,a){let s=this.getElementSize(),r=this.getComponentType(),n=this.getArray();return this.getNormalized()?n[e*s]=se.encodeNormalizedInt(a,r):n[e*s]=a,this}getElement(e,a){let s=this.getNormalized(),r=this.getElementSize(),n=this.getComponentType(),i=this.getArray();for(let o=0;o<r;o++)s?a[o]=se.decodeNormalizedInt(i[e*r+o],n):a[o]=i[e*r+o];return a}setElement(e,a){let s=this.getNormalized(),r=this.getElementSize(),n=this.getComponentType(),i=this.getArray();for(let o=0;o<r;o++)s?i[e*r+o]=se.encodeNormalizedInt(a[o],n):i[e*r+o]=a[o];return this}getSparse(){return this.get("sparse")}setSparse(e){return this.set("sparse",e)}getBuffer(){return this.getRef("buffer")}setBuffer(e){return this.setRef("buffer",e)}getArray(){return this.get("array")}setArray(e){return this.set("componentType",e?gl(e):de.ComponentType.FLOAT),this.set("array",e),this}getByteLength(){let e=this.get("array");return e?e.byteLength:0}};function gl(t){switch(t.constructor){case Float32Array:return D.ComponentType.FLOAT;case Uint32Array:return D.ComponentType.UNSIGNED_INT;case Uint16Array:return D.ComponentType.UNSIGNED_SHORT;case Uint8Array:return D.ComponentType.UNSIGNED_BYTE;case Int16Array:return D.ComponentType.SHORT;case Int8Array:return D.ComponentType.BYTE;case Float64Array:return D.ComponentType.FLOAT64}if(typeof Float16Array<"u"&&t.constructor===Float16Array)return D.ComponentType.FLOAT16;throw new Error("Unknown accessor componentType.")}var In=class extends xe{init(){this.propertyType="Animation"}getDefaults(){return Object.assign(super.getDefaults(),{channels:new te,samplers:new te})}addChannel(t){return this.addRef("channels",t)}removeChannel(t){return this.removeRef("channels",t)}listChannels(){return this.listRefs("channels")}addSampler(t){return this.addRef("samplers",t)}removeSampler(t){return this.removeRef("samplers",t)}listSamplers(){return this.listRefs("samplers")}},tr=class extends xe{static TargetPath={TRANSLATION:"translation",ROTATION:"rotation",SCALE:"scale",WEIGHTS:"weights"};init(){this.propertyType="AnimationChannel"}getDefaults(){return Object.assign(super.getDefaults(),{targetPath:null,targetNode:null,sampler:null})}getTargetPath(){return this.get("targetPath")}setTargetPath(t){return this.set("targetPath",t)}getTargetNode(){return this.getRef("targetNode")}setTargetNode(t){return this.setRef("targetNode",t)}getSampler(){return this.getRef("sampler")}setSampler(t){return this.setRef("sampler",t)}},Qa=class Rn extends xe{static Interpolation={LINEAR:"LINEAR",STEP:"STEP",CUBICSPLINE:"CUBICSPLINE"};init(){this.propertyType="AnimationSampler"}getDefaultAttributes(){return Object.assign(super.getDefaults(),{interpolation:Rn.Interpolation.LINEAR,input:null,output:null})}getInterpolation(){return this.get("interpolation")}setInterpolation(e){return this.set("interpolation",e)}getInput(){return this.getRef("input")}setInput(e){return this.setRef("input",e,{usage:"OTHER"})}getOutput(){return this.getRef("output")}setOutput(e){return this.setRef("output",e,{usage:"OTHER"})}},Sn=class extends xe{init(){this.propertyType="Buffer"}getDefaults(){return Object.assign(super.getDefaults(),{uri:""})}getURI(){return this.get("uri")}setURI(t){return this.set("uri",t)}},Za=class An extends xe{static Type={PERSPECTIVE:"perspective",ORTHOGRAPHIC:"orthographic"};init(){this.propertyType="Camera"}getDefaults(){return Object.assign(super.getDefaults(),{type:An.Type.PERSPECTIVE,znear:.1,zfar:100,aspectRatio:null,yfov:Math.PI*2*50/360,xmag:1,ymag:1})}getType(){return this.get("type")}setType(e){return this.set("type",e)}getZNear(){return this.get("znear")}setZNear(e){return this.set("znear",e)}getZFar(){return this.get("zfar")}setZFar(e){return this.set("zfar",e)}getAspectRatio(){return this.get("aspectRatio")}setAspectRatio(e){return this.set("aspectRatio",e)}getYFov(){return this.get("yfov")}setYFov(e){return this.set("yfov",e)}getXMag(){return this.get("xmag")}setXMag(e){return this.set("xmag",e)}getYMag(){return this.get("ymag")}setYMag(e){return this.set("ymag",e)}},H=class extends er{static EXTENSION_NAME;_validateParent(t){if(!this.parentTypes.includes(t.propertyType))throw new Error(`Parent "${t.propertyType}" invalid for child "${this.propertyType}".`)}},ae=class Qs extends xe{static WrapMode={CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497};static MagFilter={NEAREST:9728,LINEAR:9729};static MinFilter={NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987};init(){this.propertyType="TextureInfo"}getDefaults(){return Object.assign(super.getDefaults(),{texCoord:0,magFilter:null,minFilter:null,wrapS:Qs.WrapMode.REPEAT,wrapT:Qs.WrapMode.REPEAT})}getTexCoord(){return this.get("texCoord")}setTexCoord(e){return this.set("texCoord",e)}getMagFilter(){return this.get("magFilter")}setMagFilter(e){return this.set("magFilter",e)}getMinFilter(){return this.get("minFilter")}setMinFilter(e){return this.set("minFilter",e)}getWrapS(){return this.get("wrapS")}setWrapS(e){return this.set("wrapS",e)}getWrapT(){return this.get("wrapT")}setWrapT(e){return this.set("wrapT",e)}},{R:za,G:Va,B:Ha,A:ml}=Ue,Ja=class _n extends xe{static AlphaMode={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};init(){this.propertyType="Material"}getDefaults(){return Object.assign(super.getDefaults(),{alphaMode:_n.AlphaMode.OPAQUE,alphaCutoff:.5,doubleSided:!1,baseColorFactor:[1,1,1,1],baseColorTexture:null,baseColorTextureInfo:new ae(this.graph,"baseColorTextureInfo"),emissiveFactor:[0,0,0],emissiveTexture:null,emissiveTextureInfo:new ae(this.graph,"emissiveTextureInfo"),normalScale:1,normalTexture:null,normalTextureInfo:new ae(this.graph,"normalTextureInfo"),occlusionStrength:1,occlusionTexture:null,occlusionTextureInfo:new ae(this.graph,"occlusionTextureInfo"),roughnessFactor:1,metallicFactor:1,metallicRoughnessTexture:null,metallicRoughnessTextureInfo:new ae(this.graph,"metallicRoughnessTextureInfo")})}getDoubleSided(){return this.get("doubleSided")}setDoubleSided(e){return this.set("doubleSided",e)}getAlpha(){return this.get("baseColorFactor")[3]}setAlpha(e){let a=this.get("baseColorFactor").slice();return a[3]=e,this.set("baseColorFactor",a)}getAlphaMode(){return this.get("alphaMode")}setAlphaMode(e){return this.set("alphaMode",e)}getAlphaCutoff(){return this.get("alphaCutoff")}setAlphaCutoff(e){return this.set("alphaCutoff",e)}getBaseColorFactor(){return this.get("baseColorFactor")}setBaseColorFactor(e){return this.set("baseColorFactor",e)}getBaseColorTexture(){return this.getRef("baseColorTexture")}getBaseColorTextureInfo(){return this.getRef("baseColorTexture")?this.getRef("baseColorTextureInfo"):null}setBaseColorTexture(e){return this.setRef("baseColorTexture",e,{channels:za|Va|Ha|ml,isColor:!0})}getEmissiveFactor(){return this.get("emissiveFactor")}setEmissiveFactor(e){return this.set("emissiveFactor",e)}getEmissiveTexture(){return this.getRef("emissiveTexture")}getEmissiveTextureInfo(){return this.getRef("emissiveTexture")?this.getRef("emissiveTextureInfo"):null}setEmissiveTexture(e){return this.setRef("emissiveTexture",e,{channels:za|Va|Ha,isColor:!0})}getNormalScale(){return this.get("normalScale")}setNormalScale(e){return this.set("normalScale",e)}getNormalTexture(){return this.getRef("normalTexture")}getNormalTextureInfo(){return this.getRef("normalTexture")?this.getRef("normalTextureInfo"):null}setNormalTexture(e){return this.setRef("normalTexture",e,{channels:za|Va|Ha})}getOcclusionStrength(){return this.get("occlusionStrength")}setOcclusionStrength(e){return this.set("occlusionStrength",e)}getOcclusionTexture(){return this.getRef("occlusionTexture")}getOcclusionTextureInfo(){return this.getRef("occlusionTexture")?this.getRef("occlusionTextureInfo"):null}setOcclusionTexture(e){return this.setRef("occlusionTexture",e,{channels:za})}getRoughnessFactor(){return this.get("roughnessFactor")}setRoughnessFactor(e){return this.set("roughnessFactor",e)}getMetallicFactor(){return this.get("metallicFactor")}setMetallicFactor(e){return this.set("metallicFactor",e)}getMetallicRoughnessTexture(){return this.getRef("metallicRoughnessTexture")}getMetallicRoughnessTextureInfo(){return this.getRef("metallicRoughnessTexture")?this.getRef("metallicRoughnessTextureInfo"):null}setMetallicRoughnessTexture(e){return this.setRef("metallicRoughnessTexture",e,{channels:Va|Ha})}},Nn=class extends xe{init(){this.propertyType="Mesh"}getDefaults(){return Object.assign(super.getDefaults(),{weights:[],primitives:new te})}addPrimitive(t){return this.addRef("primitives",t)}removePrimitive(t){return this.removeRef("primitives",t)}listPrimitives(){return this.listRefs("primitives")}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}},Fn=class extends xe{init(){this.propertyType="Node"}getDefaults(){return Object.assign(super.getDefaults(),{translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1],weights:[],camera:null,mesh:null,skin:null,children:new te})}copy(t,e=lt){if(e===lt)throw new Error("Node cannot be copied.");return super.copy(t,e)}getTranslation(){return this.get("translation")}getRotation(){return this.get("rotation")}getScale(){return this.get("scale")}setTranslation(t){return this.set("translation",t)}setRotation(t){return this.set("rotation",t)}setScale(t){return this.set("scale",t)}getMatrix(){return se.compose(this.get("translation"),this.get("rotation"),this.get("scale"),[])}setMatrix(t){let e=this.get("translation").slice(),a=this.get("rotation").slice(),s=this.get("scale").slice();return se.decompose(t,e,a,s),this.set("translation",e).set("rotation",a).set("scale",s)}getWorldTranslation(){let t=[0,0,0];return se.decompose(this.getWorldMatrix(),t,[0,0,0,1],[1,1,1]),t}getWorldRotation(){let t=[0,0,0,1];return se.decompose(this.getWorldMatrix(),[0,0,0],t,[1,1,1]),t}getWorldScale(){let t=[1,1,1];return se.decompose(this.getWorldMatrix(),[0,0,0],[0,0,0,1],t),t}getWorldMatrix(){let t=[];for(let s=this;s!=null;s=s.getParentNode())t.push(s);let e,a=t.pop().getMatrix();for(;e=t.pop();)rl(a,a,e.getMatrix());return a}addChild(t){let e=t.getParentNode();e&&e.removeChild(t);for(let a of t.listParents())a.propertyType==="Scene"&&a.removeChild(t);return this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}getParentNode(){for(let t of this.listParents())if(t.propertyType==="Node")return t;return null}getMesh(){return this.getRef("mesh")}setMesh(t){return this.setRef("mesh",t)}getCamera(){return this.getRef("camera")}setCamera(t){return this.setRef("camera",t)}getSkin(){return this.getRef("skin")}setSkin(t){return this.setRef("skin",t)}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}traverse(t){t(this);for(let e of this.listChildren())e.traverse(t);return this}},ua=class jn extends xe{static Mode={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6};init(){this.propertyType="Primitive"}getDefaults(){return Object.assign(super.getDefaults(),{mode:jn.Mode.TRIANGLES,material:null,indices:null,attributes:new le,targets:new te})}getIndices(){return this.getRef("indices")}setIndices(e){return this.setRef("indices",e,{usage:"ELEMENT_ARRAY_BUFFER"})}getAttribute(e){return this.getRefMap("attributes",e)}setAttribute(e,a){return this.setRefMap("attributes",e,a,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}getMaterial(){return this.getRef("material")}setMaterial(e){return this.setRef("material",e)}getMode(){return this.get("mode")}setMode(e){return this.set("mode",e)}listTargets(){return this.listRefs("targets")}addTarget(e){return this.addRef("targets",e)}removeTarget(e){return this.removeRef("targets",e)}},yl=class extends er{init(){this.propertyType="PrimitiveTarget"}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new le})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},Bn=class extends xe{init(){this.propertyType="Scene"}getDefaults(){return Object.assign(super.getDefaults(),{children:new te})}copy(t,e=lt){if(e===lt)throw new Error("Scene cannot be copied.");return super.copy(t,e)}addChild(t){let e=t.getParentNode();return e&&e.removeChild(t),this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}traverse(t){for(let e of this.listChildren())e.traverse(t);return this}},Cn=class extends xe{init(){this.propertyType="Skin"}getDefaults(){return Object.assign(super.getDefaults(),{skeleton:null,inverseBindMatrices:null,joints:new te})}getSkeleton(){return this.getRef("skeleton")}setSkeleton(t){return this.setRef("skeleton",t)}getInverseBindMatrices(){return this.getRef("inverseBindMatrices")}setInverseBindMatrices(t){return this.setRef("inverseBindMatrices",t,{usage:"INVERSE_BIND_MATRICES"})}addJoint(t){return this.addRef("joints",t)}removeJoint(t){return this.removeRef("joints",t)}listJoints(){return this.listRefs("joints")}},On=class extends xe{init(){this.propertyType="Texture"}getDefaults(){return Object.assign(super.getDefaults(),{image:null,mimeType:"",uri:""})}getMimeType(){return this.get("mimeType")||qe.extensionToMimeType(Wt.extension(this.get("uri")))}setMimeType(t){return this.set("mimeType",t)}getURI(){return this.get("uri")}setURI(t){this.set("uri",t);let e=qe.extensionToMimeType(Wt.extension(t));return e&&this.set("mimeType",e),this}getImage(){return this.get("image")}setImage(t){return this.set("image",G.assertView(t))}getSize(){let t=this.get("image");return t?qe.getSize(t,this.getMimeType()):null}},ar=class extends xe{_extensions=new Set;init(){this.propertyType="Root"}getDefaults(){return Object.assign(super.getDefaults(),{asset:{generator:`glTF-Transform ${xn}`,version:"2.0"},defaultScene:null,accessors:new te,animations:new te,buffers:new te,cameras:new te,materials:new te,meshes:new te,nodes:new te,scenes:new te,skins:new te,textures:new te})}constructor(t){super(t),t.addEventListener("node:create",e=>{this._addChildOfRoot(e.target)})}clone(){throw new Error("Root cannot be cloned.")}copy(t,e=lt){if(e===lt)throw new Error("Root cannot be copied.");this.set("asset",{...t.get("asset")}),this.setName(t.getName()),this.setExtras({...t.getExtras()}),this.setDefaultScene(t.getDefaultScene()?e(t.getDefaultScene()):null);for(let a of t.listRefMapKeys("extensions")){let s=t.getExtension(a);this.setExtension(a,e(s))}return this}_addChildOfRoot(t){return t instanceof Bn?this.addRef("scenes",t):t instanceof Fn?this.addRef("nodes",t):t instanceof Za?this.addRef("cameras",t):t instanceof Cn?this.addRef("skins",t):t instanceof Nn?this.addRef("meshes",t):t instanceof Ja?this.addRef("materials",t):t instanceof On?this.addRef("textures",t):t instanceof In?this.addRef("animations",t):t instanceof D?this.addRef("accessors",t):t instanceof Sn&&this.addRef("buffers",t),this}getAsset(){return this.get("asset")}listExtensionsUsed(){return Array.from(this._extensions)}listExtensionsRequired(){return this.listExtensionsUsed().filter(t=>t.isRequired())}_enableExtension(t){return this._extensions.add(t),this}_disableExtension(t){return this._extensions.delete(t),this}listScenes(){return this.listRefs("scenes")}setDefaultScene(t){return this.setRef("defaultScene",t)}getDefaultScene(){return this.getRef("defaultScene")}listNodes(){return this.listRefs("nodes")}listCameras(){return this.listRefs("cameras")}listSkins(){return this.listRefs("skins")}listMeshes(){return this.listRefs("meshes")}listMaterials(){return this.listRefs("materials")}listTextures(){return this.listRefs("textures")}listAnimations(){return this.listRefs("animations")}listAccessors(){return this.listRefs("accessors")}listBuffers(){return this.listRefs("buffers")}},xl=class Zs{_graph=new Xs;_root=new ar(this._graph);_logger=$a.DEFAULT_INSTANCE;static _GRAPH_DOCUMENTS=new WeakMap;static fromGraph(e){return Zs._GRAPH_DOCUMENTS.get(e)||null}constructor(){Zs._GRAPH_DOCUMENTS.set(this._graph,this)}getRoot(){return this._root}getGraph(){return this._graph}getLogger(){return this._logger}setLogger(e){return this._logger=e,this}clone(){throw new Error("Use 'cloneDocument(source)' from '@gltf-transform/functions'.")}merge(e){throw new Error("Use 'mergeDocuments(target, source)' from '@gltf-transform/functions'.")}async transform(...e){let a=e.map(s=>s.name);for(let s of e)await s(this,{stack:a});return this}hasExtension(e){return this.getRoot().listExtensionsUsed().some(a=>a.extensionName===e)}createExtension(e){let a=e.EXTENSION_NAME;return this.getRoot().listExtensionsUsed().find(s=>s.extensionName===a)||new e(this)}disposeExtension(e){let a=this.getRoot().listExtensionsUsed().find(s=>s.extensionName===e);a&&a.dispose()}createScene(e=""){return new Bn(this._graph,e)}createNode(e=""){return new Fn(this._graph,e)}createCamera(e=""){return new Za(this._graph,e)}createSkin(e=""){return new Cn(this._graph,e)}createMesh(e=""){return new Nn(this._graph,e)}createPrimitive(){return new ua(this._graph)}createPrimitiveTarget(e=""){return new yl(this._graph,e)}createMaterial(e=""){return new Ja(this._graph,e)}createTexture(e=""){return new On(this._graph,e)}createAnimation(e=""){return new In(this._graph,e)}createAnimationChannel(e=""){return new tr(this._graph,e)}createAnimationSampler(e=""){return new Qa(this._graph,e)}createAccessor(e="",a=null){return a||(a=this.getRoot().listBuffers()[0]),new D(this._graph,e).setBuffer(a)}createBuffer(e=""){return new Sn(this._graph,e)}},Z=class{static EXTENSION_NAME;extensionName="";prereadTypes=[];prewriteTypes=[];readDependencies=[];writeDependencies=[];document;required=!1;properties=new Set;_listener;constructor(t){this.document=t,t.getRoot()._enableExtension(this),this._listener=a=>{let s=a,r=s.target;r instanceof H&&r.extensionName===this.extensionName&&(s.type==="node:create"&&this._addExtensionProperty(r),s.type==="node:dispose"&&this._removeExtensionProperty(r))};let e=t.getGraph();e.addEventListener("node:create",this._listener),e.addEventListener("node:dispose",this._listener)}dispose(){this.document.getRoot()._disableExtension(this);let t=this.document.getGraph();t.removeEventListener("node:create",this._listener),t.removeEventListener("node:dispose",this._listener);for(let e of this.properties)e.dispose()}static register(){}isRequired(){return this.required}setRequired(t){return this.required=t,this}listProperties(){return Array.from(this.properties)}_addExtensionProperty(t){return this.properties.add(t),this}_removeExtensionProperty(t){return this.properties.delete(t),this}install(t,e){return this}preread(t,e){return this}prewrite(t,e){return this}},vl=class{jsonDoc;buffers=[];bufferViews=[];bufferViewBuffers=[];accessors=[];textures=[];textureInfos=new Map;materials=[];meshes=[];cameras=[];nodes=[];skins=[];animations=[];scenes=[];constructor(t){this.jsonDoc=t}setTextureInfo(t,e){this.textureInfos.set(t,e),e.texCoord!==void 0&&t.setTexCoord(e.texCoord),e.extras!==void 0&&t.setExtras(e.extras);let a=this.jsonDoc.json.textures[e.index];if(a.sampler===void 0)return;let s=this.jsonDoc.json.samplers[a.sampler];s.magFilter!==void 0&&t.setMagFilter(s.magFilter),s.minFilter!==void 0&&t.setMinFilter(s.minFilter),s.wrapS!==void 0&&t.setWrapS(s.wrapS),s.wrapT!==void 0&&t.setWrapT(s.wrapT)}},gn={logger:$a.DEFAULT_INSTANCE,extensions:[],dependencies:{}},wl=new Set(["Buffer","Texture","Material","Mesh","Primitive","Node","Scene"]),El=class{static read(t,e=gn){let a={...gn,...e},{json:s}=t,r=new xl().setLogger(a.logger);this.validate(t,a);let n=new vl(t),i=s.asset,o=r.getRoot().getAsset();i.copyright&&(o.copyright=i.copyright),i.extras&&(o.extras=i.extras),s.extras!==void 0&&r.getRoot().setExtras({...s.extras});let c=s.extensionsUsed||[],d=s.extensionsRequired||[];a.extensions.sort((f,p)=>f.EXTENSION_NAME>p.EXTENSION_NAME?1:-1);for(let f of a.extensions)if(c.includes(f.EXTENSION_NAME)){let p=r.createExtension(f).setRequired(d.includes(f.EXTENSION_NAME)),y=p.prereadTypes.filter(E=>!wl.has(E));y.length&&a.logger.warn(`Preread hooks for some types (${y.join()}), requested by extension ${p.extensionName}, are unsupported. Please file an issue or a PR.`);for(let E of p.readDependencies)p.install(E,a.dependencies[E])}let u=s.buffers||[];r.getRoot().listExtensionsUsed().filter(f=>f.prereadTypes.includes("Buffer")).forEach(f=>f.preread(n,"Buffer")),n.buffers=u.map(f=>{let p=r.createBuffer(f.name);return f.extras&&p.setExtras(f.extras),f.uri&&f.uri.indexOf("__")!==0&&p.setURI(f.uri),p}),n.bufferViewBuffers=(s.bufferViews||[]).map((f,p)=>{if(!n.bufferViews[p]){let y=t.json.buffers[f.buffer],E=y.uri?t.resources[y.uri]:t.resources[ct],T=f.byteOffset||0;n.bufferViews[p]=G.toView(E,T,f.byteLength)}return n.buffers[f.buffer]});let b=s.accessors||[];n.accessors=b.map(f=>{let p=n.bufferViewBuffers[f.bufferView],y=r.createAccessor(f.name,p).setType(f.type);return f.extras&&y.setExtras(f.extras),f.normalized!==void 0&&y.setNormalized(f.normalized),f.bufferView===void 0||y.setArray(Xa(f,n)),y});let w=s.images||[],v=s.textures||[];r.getRoot().listExtensionsUsed().filter(f=>f.prereadTypes.includes("Texture")).forEach(f=>f.preread(n,"Texture")),n.textures=w.map(f=>{let p=r.createTexture(f.name);if(f.extras&&p.setExtras(f.extras),f.bufferView!==void 0){let y=s.bufferViews[f.bufferView],E=t.json.buffers[y.buffer],T=E.uri?t.resources[E.uri]:t.resources[ct],I=y.byteOffset||0,M=y.byteLength,R=T.slice(I,I+M);p.setImage(R)}else f.uri!==void 0&&(p.setImage(t.resources[f.uri]),f.uri.indexOf("__")!==0&&p.setURI(f.uri));if(f.mimeType!==void 0)p.setMimeType(f.mimeType);else if(f.uri){let y=Wt.extension(f.uri);p.setMimeType(qe.extensionToMimeType(y))}return p}),r.getRoot().listExtensionsUsed().filter(f=>f.prereadTypes.includes("Material")).forEach(f=>f.preread(n,"Material")),n.materials=(s.materials||[]).map(f=>{let p=r.createMaterial(f.name);f.extras&&p.setExtras(f.extras),f.alphaMode!==void 0&&p.setAlphaMode(f.alphaMode),f.alphaCutoff!==void 0&&p.setAlphaCutoff(f.alphaCutoff),f.doubleSided!==void 0&&p.setDoubleSided(f.doubleSided);let y=f.pbrMetallicRoughness||{};if(y.baseColorFactor!==void 0&&p.setBaseColorFactor(y.baseColorFactor),f.emissiveFactor!==void 0&&p.setEmissiveFactor(f.emissiveFactor),y.metallicFactor!==void 0&&p.setMetallicFactor(y.metallicFactor),y.roughnessFactor!==void 0&&p.setRoughnessFactor(y.roughnessFactor),y.baseColorTexture!==void 0){let E=y.baseColorTexture,T=n.textures[v[E.index].source];p.setBaseColorTexture(T),n.setTextureInfo(p.getBaseColorTextureInfo(),E)}if(f.emissiveTexture!==void 0){let E=f.emissiveTexture,T=n.textures[v[E.index].source];p.setEmissiveTexture(T),n.setTextureInfo(p.getEmissiveTextureInfo(),E)}if(f.normalTexture!==void 0){let E=f.normalTexture,T=n.textures[v[E.index].source];p.setNormalTexture(T),n.setTextureInfo(p.getNormalTextureInfo(),E),f.normalTexture.scale!==void 0&&p.setNormalScale(f.normalTexture.scale)}if(f.occlusionTexture!==void 0){let E=f.occlusionTexture,T=n.textures[v[E.index].source];p.setOcclusionTexture(T),n.setTextureInfo(p.getOcclusionTextureInfo(),E),f.occlusionTexture.strength!==void 0&&p.setOcclusionStrength(f.occlusionTexture.strength)}if(y.metallicRoughnessTexture!==void 0){let E=y.metallicRoughnessTexture,T=n.textures[v[E.index].source];p.setMetallicRoughnessTexture(T),n.setTextureInfo(p.getMetallicRoughnessTextureInfo(),E)}return p}),r.getRoot().listExtensionsUsed().filter(f=>f.prereadTypes.includes("Mesh")).forEach(f=>f.preread(n,"Mesh"));let h=s.meshes||[];r.getRoot().listExtensionsUsed().filter(f=>f.prereadTypes.includes("Primitive")).forEach(f=>f.preread(n,"Primitive")),n.meshes=h.map(f=>{let p=r.createMesh(f.name);return f.extras&&p.setExtras(f.extras),f.weights!==void 0&&p.setWeights(f.weights),(f.primitives||[]).forEach(y=>{let E=r.createPrimitive();y.extras&&E.setExtras(y.extras),y.material!==void 0&&E.setMaterial(n.materials[y.material]),y.mode!==void 0&&E.setMode(y.mode);for(let[I,M]of Object.entries(y.attributes||{}))E.setAttribute(I,n.accessors[M]);y.indices!==void 0&&E.setIndices(n.accessors[y.indices]);let T=f.extras&&f.extras.targetNames||[];(y.targets||[]).forEach((I,M)=>{let R=T[M]||M.toString(),A=r.createPrimitiveTarget(R);for(let[S,B]of Object.entries(I))A.setAttribute(S,n.accessors[B]);E.addTarget(A)}),p.addPrimitive(E)}),p}),n.cameras=(s.cameras||[]).map(f=>{let p=r.createCamera(f.name).setType(f.type);if(f.extras&&p.setExtras(f.extras),f.type===Za.Type.PERSPECTIVE){let y=f.perspective;p.setYFov(y.yfov),p.setZNear(y.znear),y.zfar!==void 0&&p.setZFar(y.zfar),y.aspectRatio!==void 0&&p.setAspectRatio(y.aspectRatio)}else{let y=f.orthographic;p.setZNear(y.znear).setZFar(y.zfar).setXMag(y.xmag).setYMag(y.ymag)}return p});let l=s.nodes||[];r.getRoot().listExtensionsUsed().filter(f=>f.prereadTypes.includes("Node")).forEach(f=>f.preread(n,"Node")),n.nodes=l.map(f=>{let p=r.createNode(f.name);if(f.extras&&p.setExtras(f.extras),f.translation!==void 0&&p.setTranslation(f.translation),f.rotation!==void 0&&p.setRotation(f.rotation),f.scale!==void 0&&p.setScale(f.scale),f.matrix!==void 0){let y=[0,0,0],E=[0,0,0,1],T=[1,1,1];se.decompose(f.matrix,y,E,T),p.setTranslation(y),p.setRotation(E),p.setScale(T)}return f.weights!==void 0&&p.setWeights(f.weights),p}),n.skins=(s.skins||[]).map(f=>{let p=r.createSkin(f.name);f.extras&&p.setExtras(f.extras),f.inverseBindMatrices!==void 0&&p.setInverseBindMatrices(n.accessors[f.inverseBindMatrices]),f.skeleton!==void 0&&p.setSkeleton(n.nodes[f.skeleton]);for(let y of f.joints)p.addJoint(n.nodes[y]);return p}),l.map((f,p)=>{let y=n.nodes[p];(f.children||[]).forEach(E=>y.addChild(n.nodes[E])),f.mesh!==void 0&&y.setMesh(n.meshes[f.mesh]),f.camera!==void 0&&y.setCamera(n.cameras[f.camera]),f.skin!==void 0&&y.setSkin(n.skins[f.skin])}),n.animations=(s.animations||[]).map(f=>{let p=r.createAnimation(f.name);f.extras&&p.setExtras(f.extras);let y=(f.samplers||[]).map(E=>{let T=r.createAnimationSampler().setInput(n.accessors[E.input]).setOutput(n.accessors[E.output]).setInterpolation(E.interpolation||Qa.Interpolation.LINEAR);return E.extras&&T.setExtras(E.extras),p.addSampler(T),T});return(f.channels||[]).forEach(E=>{let T=r.createAnimationChannel().setSampler(y[E.sampler]).setTargetPath(E.target.path);E.target.node!==void 0&&T.setTargetNode(n.nodes[E.target.node]),E.extras&&T.setExtras(E.extras),p.addChannel(T)}),p});let m=s.scenes||[];return r.getRoot().listExtensionsUsed().filter(f=>f.prereadTypes.includes("Scene")).forEach(f=>f.preread(n,"Scene")),n.scenes=m.map(f=>{let p=r.createScene(f.name);return f.extras&&p.setExtras(f.extras),(f.nodes||[]).map(y=>n.nodes[y]).forEach(y=>p.addChild(y)),p}),s.scene!==void 0&&r.getRoot().setDefaultScene(n.scenes[s.scene]),r.getRoot().listExtensionsUsed().forEach(f=>f.read(n)),b.forEach((f,p)=>{let y=n.accessors[p],E=!!f.sparse,T=!f.bufferView&&!y.getArray();(E||T)&&y.setSparse(!0).setArray(kl(f,n))}),r}static validate(t,e){let a=t.json;if(a.asset.version!=="2.0")throw new Error(`Unsupported glTF version, "${a.asset.version}".`);if(a.extensionsRequired){for(let s of a.extensionsRequired)if(!e.extensions.find(r=>r.EXTENSION_NAME===s))throw new Error(`Missing required extension, "${s}".`)}if(a.extensionsUsed)for(let s of a.extensionsUsed)e.extensions.find(r=>r.EXTENSION_NAME===s)||e.logger.warn(`Missing optional extension, "${s}".`)}};function Tl(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],r=a.json.bufferViews[t.bufferView],n=Ya[t.componentType],i=D.getElementSize(t.type),o=n.BYTES_PER_ELEMENT,c=t.byteOffset||0,d=new n(t.count*i),u=new DataView(s.buffer,s.byteOffset,s.byteLength),b=r.byteStride;for(let w=0;w<t.count;w++)for(let v=0;v<i;v++){let h=c+w*b+v*o,l;switch(t.componentType){case D.ComponentType.FLOAT:l=u.getFloat32(h,!0);break;case D.ComponentType.UNSIGNED_INT:l=u.getUint32(h,!0);break;case D.ComponentType.UNSIGNED_SHORT:l=u.getUint16(h,!0);break;case D.ComponentType.UNSIGNED_BYTE:l=u.getUint8(h);break;case D.ComponentType.SHORT:l=u.getInt16(h,!0);break;case D.ComponentType.BYTE:l=u.getInt8(h);break;case D.ComponentType.FLOAT16:l=u.getFloat16(h,!0);break;case D.ComponentType.FLOAT64:l=u.getFloat64(h,!0);break;default:throw new Error(`Unexpected componentType "${t.componentType}".`)}d[w*i+v]=l}return d}function Xa(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],r=a.json.bufferViews[t.bufferView],n=Ya[t.componentType],i=D.getElementSize(t.type),o=n.BYTES_PER_ELEMENT,c=i*o;if(r.byteStride!==void 0&&r.byteStride!==c)return Tl(t,e);let d=s.byteOffset+(t.byteOffset||0),u=t.count*i*o;return new n(s.buffer.slice(d,d+u))}function kl(t,e){let a=Ya[t.componentType],s=D.getElementSize(t.type),r;t.bufferView!==void 0?r=Xa(t,e):r=new a(t.count*s);let n=t.sparse;if(!n)return r;let i=n.count,o={...t,...n.indices,count:i,type:"SCALAR"},c={...t,...n.values,count:i},d=Xa(o,e),u=Xa(c,e);for(let b=0;b<o.count;b++)for(let w=0;w<s;w++)r[d[b]*s+w]=u[b*s+w];return r}var Pn=(function(t){return t[t.ARRAY_BUFFER=34962]="ARRAY_BUFFER",t[t.ELEMENT_ARRAY_BUFFER=34963]="ELEMENT_ARRAY_BUFFER",t})(Pn||{}),ot=class{_doc;jsonDoc;options;static BufferViewTarget=Pn;static BufferViewUsage=Wc;static USAGE_TO_TARGET={ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963};accessorIndexMap=new Map;animationIndexMap=new Map;bufferIndexMap=new Map;cameraIndexMap=new Map;skinIndexMap=new Map;materialIndexMap=new Map;meshIndexMap=new Map;nodeIndexMap=new Map;imageIndexMap=new Map;textureDefIndexMap=new Map;textureInfoDefMap=new Map;samplerDefIndexMap=new Map;sceneIndexMap=new Map;imageBufferViews=[];otherBufferViews=new Map;otherBufferViewsIndexMap=new Map;extensionData={};bufferURIGenerator;imageURIGenerator;logger;_accessorUsageMap=new Map;accessorUsageGroupedByParent=new Set(["ARRAY_BUFFER"]);accessorParents=new Map;constructor(t,e,a){this._doc=t,this.jsonDoc=e,this.options=a;let s=t.getRoot(),r=s.listBuffers().length,n=s.listTextures().length;this.bufferURIGenerator=new mn(r>1,()=>a.basename||"buffer"),this.imageURIGenerator=new mn(n>1,i=>Ml(t,i)||a.basename||"texture"),this.logger=t.getLogger()}createTextureInfoDef(t,e){let a={magFilter:e.getMagFilter()||void 0,minFilter:e.getMinFilter()||void 0,wrapS:e.getWrapS(),wrapT:e.getWrapT()},s=JSON.stringify(a);this.samplerDefIndexMap.has(s)||(this.samplerDefIndexMap.set(s,this.jsonDoc.json.samplers.length),this.jsonDoc.json.samplers.push(a));let r={source:this.imageIndexMap.get(t),sampler:this.samplerDefIndexMap.get(s)},n=JSON.stringify(r);this.textureDefIndexMap.has(n)||(this.textureDefIndexMap.set(n,this.jsonDoc.json.textures.length),this.jsonDoc.json.textures.push(r));let i={index:this.textureDefIndexMap.get(n)};return e.getTexCoord()!==0&&(i.texCoord=e.getTexCoord()),Object.keys(e.getExtras()).length>0&&(i.extras=e.getExtras()),this.textureInfoDefMap.set(e,i),i}createPropertyDef(t){let e={};return t.getName()&&(e.name=t.getName()),Object.keys(t.getExtras()).length>0&&(e.extras=t.getExtras()),e}createAccessorDef(t){let e=this.createPropertyDef(t);return e.type=t.getType(),e.componentType=t.getComponentType(),e.count=t.getCount(),this._doc.getGraph().listParentEdges(t).some(a=>a.getName()==="attributes"&&a.getAttributes().key==="POSITION"||a.getName()==="input")&&(e.max=t.getMax([]).map(Math.fround),e.min=t.getMin([]).map(Math.fround)),t.getNormalized()&&(e.normalized=t.getNormalized()),e}createImageData(t,e,a){if(this.options.format==="GLB")this.imageBufferViews.push(e),t.bufferView=this.jsonDoc.json.bufferViews.length,this.jsonDoc.json.bufferViews.push({buffer:0,byteOffset:-1,byteLength:e.byteLength});else{let s=qe.mimeTypeToExtension(a.getMimeType());t.uri=this.imageURIGenerator.createURI(a,s),this.assignResourceURI(t.uri,e,!1)}}assignResourceURI(t,e,a){let s=this.jsonDoc.resources;if(!(t in s)){s[t]=e;return}if(e===s[t]){this.logger.warn(`Duplicate resource URI, "${t}".`);return}let r=`Resource URI "${t}" already assigned to different data.`;if(!a){this.logger.warn(r);return}throw new Error(r)}getAccessorUsage(t){let e=this._accessorUsageMap.get(t);if(e)return e;if(t.getSparse())return"SPARSE";for(let a of this._doc.getGraph().listParentEdges(t)){let{usage:s}=a.getAttributes();if(s)return s;a.getParent().propertyType!=="Root"&&this.logger.warn(`Missing attribute ".usage" on edge, "${a.getName()}".`)}return"OTHER"}addAccessorToUsageGroup(t,e){let a=this._accessorUsageMap.get(t);if(a&&a!==e)throw new Error(`Accessor with usage "${a}" cannot be reused as "${e}".`);return this._accessorUsageMap.set(t,e),this}},mn=class{multiple;basename;counter={};constructor(t,e){this.multiple=t,this.basename=e}createURI(t,e){if(t.getURI())return t.getURI();if(this.multiple){let a=this.basename(t);return this.counter[a]=this.counter[a]||1,`${a}_${this.counter[a]++}.${e}`}else return`${this.basename(t)}.${e}`}};function Ml(t,e){let a=t.getGraph().listParentEdges(e).find(s=>s.getParent()!==t.getRoot());return a?a.getName().replace(/texture$/i,""):""}var{BufferViewUsage:qa}=ot,{UNSIGNED_INT:Il,UNSIGNED_SHORT:Rl,UNSIGNED_BYTE:Sl}=D.ComponentType,Al=new Set(["Accessor","Buffer","Material","Mesh"]),_l=class{static write(t,e){let a=t.getGraph(),s=t.getRoot(),r={asset:{generator:`glTF-Transform ${xn}`,...s.getAsset()},extras:{...s.getExtras()}},n={json:r,resources:{}},i=new ot(t,n,e),o=e.logger||$a.DEFAULT_INSTANCE,c=new Set(e.extensions.map(l=>l.EXTENSION_NAME)),d=t.getRoot().listExtensionsUsed().filter(l=>c.has(l.extensionName)).sort((l,m)=>l.extensionName>m.extensionName?1:-1),u=t.getRoot().listExtensionsRequired().filter(l=>c.has(l.extensionName)).sort((l,m)=>l.extensionName>m.extensionName?1:-1);d.length<t.getRoot().listExtensionsUsed().length&&o.warn("Some extensions were not registered for I/O, and will not be written.");for(let l of d){let m=l.prewriteTypes.filter(f=>!Al.has(f));m.length&&o.warn(`Prewrite hooks for some types (${m.join()}), requested by extension ${l.extensionName}, are unsupported. Please file an issue or a PR.`);for(let f of l.writeDependencies)l.install(f,e.dependencies[f])}function b(l,m,f,p){let y=[],E=0;for(let I of l){let M=i.createAccessorDef(I);M.bufferView=r.bufferViews.length;let R=I.getArray(),A=G.pad(G.toView(R));M.byteOffset=E,E+=A.byteLength,y.push(A),i.accessorIndexMap.set(I,r.accessors.length),r.accessors.push(M)}let T={buffer:m,byteOffset:f,byteLength:G.concat(y).byteLength};return p&&(T.target=p),r.bufferViews.push(T),{buffers:y,byteLength:E}}function w(l,m,f){let p=l[0].getCount(),y=0;for(let R of l){let A=i.createAccessorDef(R);A.bufferView=r.bufferViews.length,A.byteOffset=y;let S=R.getElementSize(),B=R.getComponentSize();y+=G.padNumber(S*B),i.accessorIndexMap.set(R,r.accessors.length),r.accessors.push(A)}let E=p*y,T=new ArrayBuffer(E),I=new DataView(T);for(let R=0;R<p;R++){let A=0;for(let S of l){let B=S.getElementSize(),P=S.getComponentSize(),F=S.getComponentType(),L=S.getArray();for(let X=0;X<B;X++){let ee=R*y+A+X*P,re=L[R*B+X];switch(F){case D.ComponentType.FLOAT:I.setFloat32(ee,re,!0);break;case D.ComponentType.BYTE:I.setInt8(ee,re);break;case D.ComponentType.SHORT:I.setInt16(ee,re,!0);break;case D.ComponentType.UNSIGNED_BYTE:I.setUint8(ee,re);break;case D.ComponentType.UNSIGNED_SHORT:I.setUint16(ee,re,!0);break;case D.ComponentType.UNSIGNED_INT:I.setUint32(ee,re,!0);break;case D.ComponentType.FLOAT16:I.setFloat16(ee,re,!0);break;case D.ComponentType.FLOAT64:I.setFloat64(ee,re,!0);break;default:throw new Error("Unexpected component type: "+F)}}A+=G.padNumber(B*P)}}let M={buffer:m,byteOffset:f,byteLength:E,byteStride:y,target:ot.BufferViewTarget.ARRAY_BUFFER};return r.bufferViews.push(M),{byteLength:E,buffers:[new Uint8Array(T)]}}function v(l,m,f){let p=[],y=0,E=new Map,T=-1/0,I=!1;for(let F of l){let L=i.createAccessorDef(F);r.accessors.push(L),i.accessorIndexMap.set(F,r.accessors.length-1);let X=[],ee=[],re=[],_e=new Array(F.getElementSize()).fill(0);for(let ge=0,Ve=F.getCount();ge<Ve;ge++)if(F.getElement(ge,re),!se.eq(re,_e,0)){T=Math.max(ge,T),X.push(ge);for(let De=0;De<re.length;De++)ee.push(re[De])}let ce=X.length,Ne={accessorDef:L,count:ce};if(E.set(F,Ne),ce===0)continue;ce>F.getCount()/2&&(I=!0);let Pe=Ya[F.getComponentType()];Ne.indices=X,Ne.values=new Pe(ee)}if(!Number.isFinite(T))return{buffers:p,byteLength:y};I&&o.warn("Some sparse accessors have >50% non-zero elements, which may increase file size.");let M=T<255?Uint8Array:T<65535?Uint16Array:Uint32Array,R=T<255?Sl:T<65535?Rl:Il,A={buffer:m,byteOffset:f+y,byteLength:0};for(let F of l){let L=E.get(F);if(L.count===0)continue;L.indicesByteOffset=A.byteLength;let X=G.pad(G.toView(new M(L.indices)));p.push(X),y+=X.byteLength,A.byteLength+=X.byteLength}r.bufferViews.push(A);let S=r.bufferViews.length-1,B={buffer:m,byteOffset:f+y,byteLength:0};for(let F of l){let L=E.get(F);if(L.count===0)continue;L.valuesByteOffset=B.byteLength;let X=G.pad(G.toView(L.values));p.push(X),y+=X.byteLength,B.byteLength+=X.byteLength}r.bufferViews.push(B);let P=r.bufferViews.length-1;for(let F of l){let L=E.get(F);L.count!==0&&(L.accessorDef.sparse={count:L.count,indices:{bufferView:S,byteOffset:L.indicesByteOffset,componentType:R},values:{bufferView:P,byteOffset:L.valuesByteOffset}})}return{buffers:p,byteLength:y}}if(r.accessors=[],r.bufferViews=[],r.samplers=[],r.textures=[],r.images=s.listTextures().map((l,m)=>{let f=i.createPropertyDef(l);l.getMimeType()&&(f.mimeType=l.getMimeType());let p=l.getImage();return p&&i.createImageData(f,p,l),i.imageIndexMap.set(l,m),f}),d.filter(l=>l.prewriteTypes.includes("Accessor")).forEach(l=>l.prewrite(i,"Accessor")),s.listAccessors().forEach(l=>{let m=i.accessorUsageGroupedByParent,f=i.accessorParents;if(i.accessorIndexMap.has(l))return;let p=i.getAccessorUsage(l);if(i.addAccessorToUsageGroup(l,p),m.has(p)){let y=a.listParents(l).find(E=>E.propertyType!=="Root");f.set(l,y)}}),d.filter(l=>l.prewriteTypes.includes("Buffer")).forEach(l=>l.prewrite(i,"Buffer")),(s.listAccessors().length>0||i.otherBufferViews.size>0||s.listTextures().length>0&&e.format==="GLB")&&s.listBuffers().length===0)throw new Error("Buffer required for Document resources, but none was found.");r.buffers=[],s.listBuffers().forEach((l,m)=>{let f=i.createPropertyDef(l),p=i.accessorUsageGroupedByParent,y=l.listParents().filter(S=>S instanceof D),E=new Set(y.map(S=>i.accessorParents.get(S))),T=new Map(Array.from(E).map((S,B)=>[S,B])),I={};for(let S of y){if(i.accessorIndexMap.has(S))continue;let B=i.getAccessorUsage(S),P=B;if(p.has(B)){let F=i.accessorParents.get(S);P+=`:${T.get(F)}`}I[P]||={usage:B,accessors:[]},I[P].accessors.push(S)}let M=[],R=r.buffers.length,A=0;for(let{usage:S,accessors:B}of Object.values(I))if(S===qa.ARRAY_BUFFER&&e.vertexLayout==="interleaved"){let P=w(B,R,A);A+=P.byteLength;for(let F of P.buffers)M.push(F)}else if(S===qa.ARRAY_BUFFER)for(let P of B){let F=w([P],R,A);A+=F.byteLength;for(let L of F.buffers)M.push(L)}else if(S===qa.SPARSE){let P=v(B,R,A);A+=P.byteLength;for(let F of P.buffers)M.push(F)}else if(S===qa.ELEMENT_ARRAY_BUFFER){let P=ot.BufferViewTarget.ELEMENT_ARRAY_BUFFER,F=b(B,R,A,P);A+=F.byteLength;for(let L of F.buffers)M.push(L)}else{let P=b(B,R,A);A+=P.byteLength;for(let F of P.buffers)M.push(F)}if(i.imageBufferViews.length&&m===0){for(let S=0;S<i.imageBufferViews.length;S++)if(r.bufferViews[r.images[S].bufferView].byteOffset=A,A+=i.imageBufferViews[S].byteLength,M.push(i.imageBufferViews[S]),A%8){let B=8-A%8;A+=B,M.push(new Uint8Array(B))}}if(i.otherBufferViews.has(l))for(let S of i.otherBufferViews.get(l))r.bufferViews.push({buffer:R,byteOffset:A,byteLength:S.byteLength}),i.otherBufferViewsIndexMap.set(S,r.bufferViews.length-1),A+=S.byteLength,M.push(S);if(A){let S;e.format==="GLB"?S=ct:(S=i.bufferURIGenerator.createURI(l,"bin"),f.uri=S),f.byteLength=A,i.assignResourceURI(S,G.concat(M),!0)}r.buffers.push(f),i.bufferIndexMap.set(l,m)}),s.listAccessors().find(l=>!l.getBuffer())&&o.warn("Skipped writing one or more Accessors: no Buffer assigned."),d.filter(l=>l.prewriteTypes.includes("Material")).forEach(l=>l.prewrite(i,"Material")),r.materials=s.listMaterials().map((l,m)=>{let f=i.createPropertyDef(l);if(l.getAlphaMode()!==Ja.AlphaMode.OPAQUE&&(f.alphaMode=l.getAlphaMode()),l.getAlphaMode()===Ja.AlphaMode.MASK&&(f.alphaCutoff=l.getAlphaCutoff()),l.getDoubleSided()&&(f.doubleSided=!0),f.pbrMetallicRoughness={},se.eq(l.getBaseColorFactor(),[1,1,1,1])||(f.pbrMetallicRoughness.baseColorFactor=l.getBaseColorFactor()),se.eq(l.getEmissiveFactor(),[0,0,0])||(f.emissiveFactor=l.getEmissiveFactor()),l.getRoughnessFactor()!==1&&(f.pbrMetallicRoughness.roughnessFactor=l.getRoughnessFactor()),l.getMetallicFactor()!==1&&(f.pbrMetallicRoughness.metallicFactor=l.getMetallicFactor()),l.getBaseColorTexture()){let p=l.getBaseColorTexture(),y=l.getBaseColorTextureInfo();f.pbrMetallicRoughness.baseColorTexture=i.createTextureInfoDef(p,y)}if(l.getEmissiveTexture()){let p=l.getEmissiveTexture(),y=l.getEmissiveTextureInfo();f.emissiveTexture=i.createTextureInfoDef(p,y)}if(l.getNormalTexture()){let p=l.getNormalTexture(),y=l.getNormalTextureInfo(),E=i.createTextureInfoDef(p,y);l.getNormalScale()!==1&&(E.scale=l.getNormalScale()),f.normalTexture=E}if(l.getOcclusionTexture()){let p=l.getOcclusionTexture(),y=l.getOcclusionTextureInfo(),E=i.createTextureInfoDef(p,y);l.getOcclusionStrength()!==1&&(E.strength=l.getOcclusionStrength()),f.occlusionTexture=E}if(l.getMetallicRoughnessTexture()){let p=l.getMetallicRoughnessTexture(),y=l.getMetallicRoughnessTextureInfo();f.pbrMetallicRoughness.metallicRoughnessTexture=i.createTextureInfoDef(p,y)}return i.materialIndexMap.set(l,m),f}),d.filter(l=>l.prewriteTypes.includes("Mesh")).forEach(l=>l.prewrite(i,"Mesh")),r.meshes=s.listMeshes().map((l,m)=>{let f=i.createPropertyDef(l),p=null;return f.primitives=l.listPrimitives().map(y=>{let E={attributes:{}};E.mode=y.getMode();let T=y.getMaterial();T&&(E.material=i.materialIndexMap.get(T)),Object.keys(y.getExtras()).length&&(E.extras=y.getExtras());let I=y.getIndices();I&&(E.indices=i.accessorIndexMap.get(I));for(let M of y.listSemantics())E.attributes[M]=i.accessorIndexMap.get(y.getAttribute(M));for(let M of y.listTargets()){let R={};for(let A of M.listSemantics())R[A]=i.accessorIndexMap.get(M.getAttribute(A));E.targets=E.targets||[],E.targets.push(R)}return y.listTargets().length&&!p&&(p=y.listTargets().map(M=>M.getName())),E}),l.getWeights().length&&(f.weights=l.getWeights()),p&&(f.extras=f.extras||{},f.extras.targetNames=p),i.meshIndexMap.set(l,m),f}),r.cameras=s.listCameras().map((l,m)=>{let f=i.createPropertyDef(l);if(f.type=l.getType(),f.type===Za.Type.PERSPECTIVE){f.perspective={znear:l.getZNear(),zfar:l.getZFar(),yfov:l.getYFov()};let p=l.getAspectRatio();p!==null&&(f.perspective.aspectRatio=p)}else f.orthographic={znear:l.getZNear(),zfar:l.getZFar(),xmag:l.getXMag(),ymag:l.getYMag()};return i.cameraIndexMap.set(l,m),f}),r.nodes=s.listNodes().map((l,m)=>{let f=i.createPropertyDef(l);return se.eq(l.getTranslation(),[0,0,0])||(f.translation=l.getTranslation()),se.eq(l.getRotation(),[0,0,0,1])||(f.rotation=l.getRotation()),se.eq(l.getScale(),[1,1,1])||(f.scale=l.getScale()),l.getWeights().length&&(f.weights=l.getWeights()),i.nodeIndexMap.set(l,m),f}),r.skins=s.listSkins().map((l,m)=>{let f=i.createPropertyDef(l),p=l.getInverseBindMatrices();p&&(f.inverseBindMatrices=i.accessorIndexMap.get(p));let y=l.getSkeleton();return y&&(f.skeleton=i.nodeIndexMap.get(y)),f.joints=l.listJoints().map(E=>i.nodeIndexMap.get(E)),i.skinIndexMap.set(l,m),f}),s.listNodes().forEach((l,m)=>{let f=r.nodes[m],p=l.getMesh();p&&(f.mesh=i.meshIndexMap.get(p));let y=l.getCamera();y&&(f.camera=i.cameraIndexMap.get(y));let E=l.getSkin();E&&(f.skin=i.skinIndexMap.get(E)),l.listChildren().length>0&&(f.children=l.listChildren().map(T=>i.nodeIndexMap.get(T)))}),r.animations=s.listAnimations().map((l,m)=>{let f=i.createPropertyDef(l),p=new Map;return f.samplers=l.listSamplers().map((y,E)=>{let T=i.createPropertyDef(y);return T.input=i.accessorIndexMap.get(y.getInput()),T.output=i.accessorIndexMap.get(y.getOutput()),T.interpolation=y.getInterpolation(),p.set(y,E),T}),f.channels=l.listChannels().map(y=>{let E=i.createPropertyDef(y);return E.sampler=p.get(y.getSampler()),E.target={node:i.nodeIndexMap.get(y.getTargetNode()),path:y.getTargetPath()},E}),i.animationIndexMap.set(l,m),f}),r.scenes=s.listScenes().map((l,m)=>{let f=i.createPropertyDef(l);return f.nodes=l.listChildren().map(p=>i.nodeIndexMap.get(p)),i.sceneIndexMap.set(l,m),f});let h=s.getDefaultScene();return h&&(r.scene=s.listScenes().indexOf(h)),r.extensionsUsed=d.map(l=>l.extensionName),r.extensionsRequired=u.map(l=>l.extensionName),d.forEach(l=>l.write(i)),Nl(r),n}};function Nl(t){let e=[];for(let a in t){let s=t[a];(Array.isArray(s)&&s.length===0||s===null||s===""||s&&typeof s=="object"&&Object.keys(s).length===0)&&e.push(a)}for(let a of e)delete t[a]}var Fl=class{_logger=$a.DEFAULT_INSTANCE;_extensions=new Set;_dependencies={};_vertexLayout="interleaved";_strictResources=!0;lastReadBytes=0;lastWriteBytes=0;setLogger(t){return this._logger=t,this}registerExtensions(t){for(let e of t)this._extensions.add(e),e.register();return this}registerDependencies(t){return Object.assign(this._dependencies,t),this}setVertexLayout(t){return this._vertexLayout=t,this}setStrictResources(t){return this._strictResources=t,this}async read(t){return await this.readJSON(await this.readAsJSON(t))}async readAsJSON(t){let e=await this.readURI(t,"view");this.lastReadBytes=e.byteLength;let a=yn(e)?this._binaryToJSON(e):{json:JSON.parse(G.decodeText(e)),resources:{}};return await this._readResourcesExternal(a,this.dirname(t)),this._readResourcesInternal(a),a}async readJSON(t){return t=this._copyJSON(t),this._readResourcesInternal(t),El.read(t,{extensions:Array.from(this._extensions),dependencies:this._dependencies,logger:this._logger})}async binaryToJSON(t){let e=this._binaryToJSON(G.assertView(t));this._readResourcesInternal(e);let a=e.json;if(a.buffers&&a.buffers.some(s=>jl(e,s)))throw new Error("Cannot resolve external buffers with binaryToJSON().");if(a.images&&a.images.some(s=>Bl(e,s)))throw new Error("Cannot resolve external images with binaryToJSON().");return e}async readBinary(t){return this.readJSON(await this.binaryToJSON(G.assertView(t)))}async writeJSON(t,e={}){if(e.format==="GLB"&&t.getRoot().listBuffers().length>1)throw new Error("GLB must have 0\u20131 buffers.");return _l.write(t,{format:e.format||"GLTF",basename:e.basename||"",logger:this._logger,vertexLayout:this._vertexLayout,dependencies:{...this._dependencies},extensions:Array.from(this._extensions)})}async writeBinary(t){let{json:e,resources:a}=await this.writeJSON(t,{format:"GLB"}),s=new Uint32Array([1179937895,2,12]),r=JSON.stringify(e),n=G.pad(G.encodeText(r),32),i=G.toView(new Uint32Array([n.byteLength,1313821514])),o=G.concat([i,n]);s[s.length-1]+=o.byteLength;let c=Object.values(a)[0];if(!c||!c.byteLength)return G.concat([G.toView(s),o]);let d=G.pad(c,0),u=G.toView(new Uint32Array([d.byteLength,5130562])),b=G.concat([u,d]);return s[s.length-1]+=b.byteLength,G.concat([G.toView(s),o,b])}async _readResourcesExternal(t,e){let a=t.json.images||[],s=t.json.buffers||[],r=[...a,...s].map(async n=>{let i=n.uri;if(!i||i.match(/data:/))return Promise.resolve();try{t.resources[i]=await this.readURI(this.resolve(e,i),"view"),this.lastReadBytes+=t.resources[i].byteLength}catch(o){if(!this._strictResources&&a.includes(n))this._logger.warn(`Failed to load image URI, "${i}". ${o}`),t.resources[i]=null;else throw o}});await Promise.all(r)}_readResourcesInternal(t){function e(a){if(a.uri){if(a.uri in t.resources){G.assertView(t.resources[a.uri]);return}if(a.uri.match(/data:/)){let s=`__${bl()}.${Wt.extension(a.uri)}`;t.resources[s]=G.createBufferFromDataURI(a.uri),a.uri=s}}}(t.json.images||[]).forEach(a=>{if(a.bufferView===void 0&&a.uri===void 0)throw new Error("Missing resource URI or buffer view.");e(a)}),(t.json.buffers||[]).forEach(e)}_copyJSON(t){let{images:e,buffers:a}=t.json;return t={json:{...t.json},resources:{...t.resources}},e&&(t.json.images=e.map(s=>({...s}))),a&&(t.json.buffers=a.map(s=>({...s}))),t}_binaryToJSON(t){if(!yn(t))throw new Error("Invalid glTF 2.0 binary.");let e=new Uint32Array(t.buffer,t.byteOffset+12,2);if(e[1]!==1313821514)throw new Error("Missing required GLB JSON chunk.");let a=20,s=e[0],r=G.decodeText(G.toView(t,a,s)),n=JSON.parse(r),i=a+s;if(t.byteLength<=i)return{json:n,resources:{}};let o=new Uint32Array(t.buffer,t.byteOffset+i,2);if(o[1]!==5130562)return{json:n,resources:{}};let c=o[0],d=G.toView(t,i+8,c);return{json:n,resources:{[ct]:d}}}};function jl(t,e){return e.uri!==void 0&&!(e.uri in t.resources)}function Bl(t,e){return e.uri!==void 0&&!(e.uri in t.resources)&&e.bufferView===void 0}function yn(t){if(t.byteLength<3*Uint32Array.BYTES_PER_ELEMENT)return!1;let e=new Uint32Array(t.buffer,t.byteOffset,3);return e[0]===1179937895&&e[1]===2}var Dn=class extends Fl{_fetchConfig;constructor(t=Js.DEFAULT_INIT){super(),this._fetchConfig=t}async readURI(t,e){let a=await fetch(t,this._fetchConfig);switch(e){case"view":return new Uint8Array(await a.arrayBuffer());case"text":return a.text()}}resolve(t,e){return Js.resolve(t,e)}dirname(t){return Js.dirname(t)}};function Cl(){return{vkFormat:0,typeSize:1,pixelWidth:0,pixelHeight:0,pixelDepth:0,layerCount:0,faceCount:1,levelCount:0,supercompressionScheme:0,levels:[],dataFormatDescriptor:[{vendorId:0,descriptorType:0,versionNumber:2,colorModel:0,colorPrimaries:1,transferFunction:2,flags:0,texelBlockDimension:[0,0,0,0],bytesPlane:[0,0,0,0,0,0,0,0],samples:[]}],keyValue:{},globalData:null}}var Ct=class{constructor(e,a,s,r){this._dataView=void 0,this._littleEndian=void 0,this._offset=void 0,this._dataView=new DataView(e.buffer,e.byteOffset+a,s),this._littleEndian=r,this._offset=0}_nextUint8(){let e=this._dataView.getUint8(this._offset);return this._offset+=1,e}_nextUint16(){let e=this._dataView.getUint16(this._offset,this._littleEndian);return this._offset+=2,e}_nextUint32(){let e=this._dataView.getUint32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint64(){let e=this._dataView.getUint32(this._offset,this._littleEndian),a=this._dataView.getUint32(this._offset+4,this._littleEndian),s=e+2**32*a;return this._offset+=8,s}_nextInt32(){let e=this._dataView.getInt32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint8Array(e){let a=new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+this._offset,e);return this._offset+=e,a}_skip(e){return this._offset+=e,this}_scan(e,a=0){let s=this._offset,r=0;for(;this._dataView.getUint8(this._offset)!==a&&r<e;)r++,this._offset++;return r<e&&this._offset++,new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+s,r)}};var Sg=new Uint8Array([0]),ve=[171,75,84,88,32,50,48,187,13,10,26,10];function Un(t){return new TextDecoder().decode(t)}function es(t){let e=new Uint8Array(t.buffer,t.byteOffset,ve.length);if(e[0]!==ve[0]||e[1]!==ve[1]||e[2]!==ve[2]||e[3]!==ve[3]||e[4]!==ve[4]||e[5]!==ve[5]||e[6]!==ve[6]||e[7]!==ve[7]||e[8]!==ve[8]||e[9]!==ve[9]||e[10]!==ve[10]||e[11]!==ve[11])throw new Error("Missing KTX 2.0 identifier.");let a=Cl(),s=17*Uint32Array.BYTES_PER_ELEMENT,r=new Ct(t,ve.length,s,!0);a.vkFormat=r._nextUint32(),a.typeSize=r._nextUint32(),a.pixelWidth=r._nextUint32(),a.pixelHeight=r._nextUint32(),a.pixelDepth=r._nextUint32(),a.layerCount=r._nextUint32(),a.faceCount=r._nextUint32(),a.levelCount=r._nextUint32(),a.supercompressionScheme=r._nextUint32();let n=r._nextUint32(),i=r._nextUint32(),o=r._nextUint32(),c=r._nextUint32(),d=r._nextUint64(),u=r._nextUint64(),b=Math.max(a.levelCount,1)*3*8,w=new Ct(t,ve.length+s,b,!0);for(let j=0,C=Math.max(a.levelCount,1);j<C;j++)a.levels.push({levelData:new Uint8Array(t.buffer,t.byteOffset+w._nextUint64(),w._nextUint64()),uncompressedByteLength:w._nextUint64()});let v=new Ct(t,n,i,!0);v._skip(4);let h=v._nextUint16(),l=v._nextUint16(),m=v._nextUint16(),f=v._nextUint16(),p=v._nextUint8(),y=v._nextUint8(),E=v._nextUint8(),T=v._nextUint8(),I=[v._nextUint8(),v._nextUint8(),v._nextUint8(),v._nextUint8()],M=[v._nextUint8(),v._nextUint8(),v._nextUint8(),v._nextUint8(),v._nextUint8(),v._nextUint8(),v._nextUint8(),v._nextUint8()],A={vendorId:h,descriptorType:l,versionNumber:m,colorModel:p,colorPrimaries:y,transferFunction:E,flags:T,texelBlockDimension:I,bytesPlane:M,samples:[]},P=(f/4-6)/4;for(let j=0;j<P;j++){let C={bitOffset:v._nextUint16(),bitLength:v._nextUint8(),channelType:v._nextUint8(),samplePosition:[v._nextUint8(),v._nextUint8(),v._nextUint8(),v._nextUint8()],sampleLower:Number.NEGATIVE_INFINITY,sampleUpper:Number.POSITIVE_INFINITY};C.channelType&64?(C.sampleLower=v._nextInt32(),C.sampleUpper=v._nextInt32()):(C.sampleLower=v._nextUint32(),C.sampleUpper=v._nextUint32()),A.samples[j]=C}a.dataFormatDescriptor.length=0,a.dataFormatDescriptor.push(A);let F=new Ct(t,o,c,!0);for(;F._offset<c;){let j=F._nextUint32(),C=F._scan(j),W=Un(C);if(a.keyValue[W]=F._nextUint8Array(j-C.byteLength-1),W.match(/^ktx/i)){let ye=Un(a.keyValue[W]);a.keyValue[W]=ye.substring(0,ye.lastIndexOf("\0"))}let ie=j%4?4-j%4:0;F._skip(ie)}if(u<=0)return a;let L=new Ct(t,d,u,!0),X=L._nextUint16(),ee=L._nextUint16(),re=L._nextUint32(),_e=L._nextUint32(),ce=L._nextUint32(),Ne=L._nextUint32(),Pe=[];for(let j=0,C=Math.max(a.levelCount,1);j<C;j++)Pe.push({imageFlags:L._nextUint32(),rgbSliceByteOffset:L._nextUint32(),rgbSliceByteLength:L._nextUint32(),alphaSliceByteOffset:L._nextUint32(),alphaSliceByteLength:L._nextUint32()});let ge=d+L._offset,Ve=ge+re,De=Ve+_e,at=De+ce,Gt=new Uint8Array(t.buffer,t.byteOffset+ge,re),Ds=new Uint8Array(t.buffer,t.byteOffset+Ve,_e),Na=new Uint8Array(t.buffer,t.byteOffset+De,ce),k=new Uint8Array(t.buffer,t.byteOffset+at,Ne);return a.globalData={endpointCount:X,selectorCount:ee,imageDescs:Pe,endpointsData:Gt,selectorsData:Ds,tablesData:Na,extendedData:k},a}var dt="EXT_mesh_gpu_instancing",Ze="EXT_mesh_features",Me="EXT_meshopt_compression",K="EXT_structural_metadata",ts="EXT_texture_webp",as="EXT_texture_avif",Kl="KHR_accessor_float16",Gl="KHR_accessor_float64",oe="KHR_draco_mesh_compression",Qe="KHR_lights_punctual",ut="KHR_materials_anisotropy",ft="KHR_materials_clearcoat",ht="KHR_materials_diffuse_transmission",bt="KHR_materials_dispersion",pt="KHR_materials_emissive_strength",gt="KHR_materials_ior",mt="KHR_materials_iridescence",yt="KHR_materials_pbrSpecularGlossiness",xt="KHR_materials_sheen",vt="KHR_materials_specular",wt="KHR_materials_transmission",Jt="KHR_materials_unlit",Et="KHR_materials_volume",Ae="KHR_materials_variants",Ln="KHR_mesh_primitive_restart",Kn="KHR_mesh_quantization",Tt="KHR_node_visibility",ss="KHR_texture_basisu",kt="KHR_texture_transform",Le="KHR_xmp_json_ld",zl=class extends H{static EXTENSION_NAME=Ze;init(){this.extensionName=Ze,this.propertyType="FeatureID",this.parentTypes=["Features"]}getDefaults(){return Object.assign(super.getDefaults(),{nullFeatureId:null,label:"",attribute:null,texture:null,propertyTable:null})}getFeatureCount(){return this.get("featureCount")}setFeatureCount(t){return this.set("featureCount",t)}getNullFeatureID(){return this.get("nullFeatureId")}setNullFeatureID(t){return this.set("nullFeatureId",t)}getLabel(){return this.get("label")}setLabel(t){return this.set("label",t)}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getPropertyTable(){return this.getRef("propertyTable")}setPropertyTable(t){return this.setRef("propertyTable",t)}},Vl=class extends H{static EXTENSION_NAME=Ze;init(){this.extensionName=Ze,this.propertyType="FeatureIDTexture",this.parentTypes=["FeatureID"]}getDefaults(){let t=new ae(this.graph,"textureInfo");return t.setMinFilter(ae.MagFilter.NEAREST),t.setMagFilter(ae.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}},Hl=class extends H{static EXTENSION_NAME=Ze;init(){this.extensionName=Ze,this.propertyType="Features",this.parentTypes=[N.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{featureIds:new te([])})}listFeatureIDs(){return this.listRefs("featureIds")}addFeatureID(t){return this.addRef("featureIds",t)}removeFeatureID(t){return this.removeRef("featureIds",t)}},fa=Ze,cr=class extends Z{extensionName=Ze;static EXTENSION_NAME=Ze;createFeatures(){return new Hl(this.document.getGraph())}createFeatureID(){return new zl(this.document.getGraph())}createFeatureIDTexture(){return new Vl(this.document.getGraph())}read(t){return(t.jsonDoc.json.meshes||[]).forEach((e,a)=>{(e.primitives||[]).forEach((s,r)=>{this._readPrimitive(t,a,s,r)})}),this}_readPrimitive(t,e,a,s){if(!a.extensions||!a.extensions[fa])return;let r=this.createFeatures(),n=a.extensions[fa];for(let i of n.featureIds){let o=ql(this.document,this,t,i);r.addFeatureID(o)}t.meshes[e].listPrimitives()[s].setExtension(fa,r)}write(t){let e=t.jsonDoc.json.meshes;if(!e)return this;for(let a of this.document.getRoot().listMeshes()){let s=e[t.meshIndexMap.get(a)];a.listPrimitives().forEach((r,n)=>{let i=s.primitives[n];this._writePrimitive(t,r,i)})}return this}_writePrimitive(t,e,a){let s=e.getExtension(fa);if(!s)return;let r={featureIds:[]};s.listFeatureIDs().forEach(n=>{r.featureIds.push(Wl(this.document,t,n))}),a.extensions=a.extensions||{},a.extensions[fa]=r}};function ql(t,e,a,s){let r=e.createFeatureID().setFeatureCount(s.featureCount);s.nullFeatureId!==void 0&&r.setNullFeatureID(s.nullFeatureId),s.label!==void 0&&r.setLabel(s.label),s.attribute!==void 0&&r.setAttribute(s.attribute);let n=s.texture;if(n!==void 0){let i=Xl(e,a,n);r.setTexture(i)}if(s.propertyTable!==void 0){let i=t.getRoot().getExtension(K).listPropertyTables();r.setPropertyTable(i[s.propertyTable])}return r}function Xl(t,e,a){let s=t.createFeatureIDTexture(),{json:r}=e.jsonDoc;if(a.channels&&s.setChannels(a.channels),a.index!==void 0){let n=r.textures[a.index].source;s.setTexture(e.textures[n]),e.setTextureInfo(s.getTextureInfo(),a)}return s}function Wl(t,e,a){let s=t.getRoot(),r={featureCount:a.getFeatureCount()};if(a.getNullFeatureID()!=null&&(r.nullFeatureId=a.getNullFeatureID()),a.getLabel()&&(r.label=a.getLabel()),a.getAttribute()!=null&&(r.attribute=a.getAttribute()),a.getTexture()){let n=a.getTexture(),i=n.getTexture(),o=n.getTextureInfo();r.texture=e.createTextureInfoDef(i,o);let c=n.getChannels();se.eq(c,[0])||(r.texture.channels=c)}if(a.getPropertyTable()){let n=s.getExtension(K),i=a.getPropertyTable();r.propertyTable=n.listPropertyTables().indexOf(i)}return r}var nr="INSTANCE_ATTRIBUTE",Jl=class extends H{static EXTENSION_NAME=dt;init(){this.extensionName=dt,this.propertyType="InstancedMesh",this.parentTypes=[N.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new le})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:nr})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},Yl=class extends Z{static EXTENSION_NAME=dt;extensionName=dt;prewriteTypes=[N.ACCESSOR];createInstancedMesh(){return new Jl(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(!e.extensions||!e.extensions.EXT_mesh_gpu_instancing)return;let s=e.extensions[dt],r=this.createInstancedMesh();for(let n in s.attributes)r.setAttribute(n,t.accessors[s.attributes[n]]);t.nodes[a].setExtension(dt,r)}),this}prewrite(t){t.accessorUsageGroupedByParent.add(nr);for(let e of this.properties)for(let a of e.listAttributes())t.addAccessorToUsageGroup(a,nr);return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listNodes().forEach(a=>{let s=a.getExtension(dt);if(s){let r=t.nodeIndexMap.get(a),n=e.json.nodes[r],i={attributes:{}};s.listSemantics().forEach(o=>{let c=s.getAttribute(o);i.attributes[o]=t.accessorIndexMap.get(c)}),n.extensions=n.extensions||{},n.extensions[dt]=i}}),this}},$l=(function(t){return t.QUANTIZE="quantize",t.FILTER="filter",t})({});function Ql(t){return!t.extensions||!t.extensions.EXT_meshopt_compression?!1:!!t.extensions[Me].fallback}var{BYTE:Zl,SHORT:Gn,FLOAT:ed}=D.ComponentType,{encodeNormalizedInt:zn,decodeNormalizedInt:ir}=se;function td(t,e,a,s){let{filter:r,bits:n}=s,i={array:t.getArray(),byteStride:t.getElementSize()*t.getComponentSize(),componentType:t.getComponentType(),normalized:t.getNormalized()};if(a!=="ATTRIBUTES")return i;if(r!=="NONE"){let o=t.getNormalized()?ad(t):new Float32Array(i.array);switch(r){case"EXPONENTIAL":i.byteStride=t.getElementSize()*4,i.componentType=ed,i.normalized=!1,i.array=e.encodeFilterExp(o,t.getCount(),i.byteStride,n);break;case"OCTAHEDRAL":i.byteStride=n>8?8:4,i.componentType=n>8?Gn:Zl,i.normalized=!0,o=t.getElementSize()===3?rd(o):o,i.array=e.encodeFilterOct(o,t.getCount(),i.byteStride,n);break;case"QUATERNION":i.byteStride=8,i.componentType=Gn,i.normalized=!0,i.array=e.encodeFilterQuat(o,t.getCount(),i.byteStride,n);break;default:throw new Error("Invalid filter.")}i.min=t.getMin([]),i.max=t.getMax([]),t.getNormalized()&&(i.min=i.min.map(c=>ir(c,t.getComponentType())),i.max=i.max.map(c=>ir(c,t.getComponentType()))),i.normalized&&(i.min=i.min.map(c=>zn(c,i.componentType)),i.max=i.max.map(c=>zn(c,i.componentType)))}else i.byteStride%4&&(i.array=sd(i.array,t.getElementSize()),i.byteStride=i.array.byteLength/t.getCount());return i}function ad(t){let e=t.getComponentType(),a=t.getArray(),s=new Float32Array(a.length);for(let r=0;r<a.length;r++)s[r]=ir(a[r],e);return s}function sd(t,e){let a=G.padNumber(t.BYTES_PER_ELEMENT*e)/t.BYTES_PER_ELEMENT,s=t.length/e,r=new t.constructor(s*a);for(let n=0;n*e<t.length;n++)for(let i=0;i<e;i++)r[n*a+i]=t[n*e+i];return r}function rd(t){let e=new Float32Array(t.length*4/3);for(let a=0,s=t.length/3;a<s;a++)e[a*4]=t[a*3],e[a*4+1]=t[a*3+1],e[a*4+2]=t[a*3+2];return e}function nd(t,e){return e===ot.BufferViewUsage.ELEMENT_ARRAY_BUFFER?t.listParents().some(a=>a instanceof ua&&a.getMode()===ua.Mode.TRIANGLES)?"TRIANGLES":"INDICES":"ATTRIBUTES"}function id(t,e){let a=e.getGraph().listParentEdges(t).filter(s=>!(s.getParent()instanceof ar));for(let s of a){let r=s.getName(),n=s.getAttributes().key||"",i=s.getParent().propertyType===N.PRIMITIVE_TARGET;if(r==="indices")return{filter:"NONE"};if(r==="attributes"){if(n==="POSITION")return{filter:"NONE"};if(n==="TEXCOORD_0")return{filter:"NONE"};if(n.startsWith("JOINTS_"))return{filter:"NONE"};if(n.startsWith("WEIGHTS_"))return{filter:"NONE"};if(n==="NORMAL"||n==="TANGENT")return i?{filter:"NONE"}:{filter:"OCTAHEDRAL",bits:8}}if(r==="output"){let o=ii(t);return o==="rotation"?{filter:"QUATERNION",bits:16}:o==="translation"?{filter:"EXPONENTIAL",bits:12}:o==="scale"?{filter:"EXPONENTIAL",bits:12}:{filter:"NONE"}}if(r==="input")return{filter:"NONE"};if(r==="inverseBindMatrices")return{filter:"NONE"}}return{filter:"NONE"}}function ii(t){for(let e of t.listParents())if(e instanceof Qa){for(let a of e.listParents())if(a instanceof tr)return a.getTargetPath()}return null}var Vn={method:"quantize"},lr=class extends Z{extensionName=Me;prereadTypes=[N.BUFFER,N.PRIMITIVE];prewriteTypes=[N.BUFFER,N.ACCESSOR];readDependencies=["meshopt.decoder"];writeDependencies=["meshopt.encoder"];static EXTENSION_NAME=Me;static EncoderMethod=$l;_decoder=null;_decoderFallbackBufferMap=new Map;_encoder=null;_encoderOptions=Vn;_encoderFallbackBuffer=null;_encoderBufferViews={};_encoderBufferViewData={};_encoderBufferViewAccessors={};install(t,e){return t==="meshopt.decoder"&&(this._decoder=e),t==="meshopt.encoder"&&(this._encoder=e),this}setEncoderOptions(t){return this._encoderOptions={...Vn,...t},this}preread(t,e){if(!this._decoder){if(!this.isRequired())return this;throw new Error(`[${Me}] Please install extension dependency, "meshopt.decoder".`)}if(!this._decoder.supported){if(!this.isRequired())return this;throw new Error(`[${Me}]: Missing WASM support.`)}return e===N.BUFFER?this._prereadBuffers(t):e===N.PRIMITIVE&&this._prereadPrimitives(t),this}_prereadBuffers(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach((a,s)=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let r=a.extensions[Me],n=r.byteOffset||0,i=r.byteLength||0,o=r.count,c=r.byteStride,d=new Uint8Array(o*c),u=e.json.buffers[r.buffer],b=u.uri?e.resources[u.uri]:e.resources[ct],w=G.toView(b,n,i);this._decoder.decodeGltfBuffer(d,o,c,w,r.mode,r.filter),t.bufferViews[s]=d})}_prereadPrimitives(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach(a=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let s=a.extensions[Me],r=t.buffers[s.buffer],n=t.buffers[a.buffer],i=e.json.buffers[a.buffer];Ql(i)&&this._decoderFallbackBufferMap.set(n,r)})}read(t){if(!this.isRequired())return this;for(let[e,a]of this._decoderFallbackBufferMap){for(let s of e.listParents())s instanceof D&&s.swap(e,a);e.dispose()}return this}prewrite(t,e){return e===N.ACCESSOR?this._prewriteAccessors(t):e===N.BUFFER&&this._prewriteBuffers(t),this}_prewriteAccessors(t){let e=t.jsonDoc.json,a=this._encoder,s=this._encoderOptions,r=this.document.getGraph(),n=this.document.createBuffer(),i=this.document.getRoot().listBuffers().indexOf(n),o=1,c=new Map,d=u=>{for(let b of r.listParents(u)){if(b.propertyType===N.ROOT)continue;let w=c.get(u);return w===void 0&&c.set(u,w=o++),w}return-1};this._encoderFallbackBuffer=n,this._encoderBufferViews={},this._encoderBufferViewData={},this._encoderBufferViewAccessors={};for(let u of this.document.getRoot().listAccessors()){if(ii(u)==="weights"||u.getSparse())continue;let b=t.getAccessorUsage(u),w=t.accessorUsageGroupedByParent.has(b)?d(u):null,v=nd(u,b),h=s.method==="filter"?id(u,this.document):{filter:"NONE"},l=td(u,a,v,h),{array:m,byteStride:f}=l,p=u.getBuffer();if(!p)throw new Error(`${Me}: Missing buffer for accessor.`);let y=this.document.getRoot().listBuffers().indexOf(p),E=[b,w,v,h.filter,f,y].join(":"),T=this._encoderBufferViews[E],I=this._encoderBufferViewData[E],M=this._encoderBufferViewAccessors[E];(!T||!I)&&(M=this._encoderBufferViewAccessors[E]=[],I=this._encoderBufferViewData[E]=[],T=this._encoderBufferViews[E]={buffer:i,target:ot.USAGE_TO_TARGET[b],byteOffset:0,byteLength:0,byteStride:b===ot.BufferViewUsage.ARRAY_BUFFER?f:void 0,extensions:{[Me]:{buffer:y,byteOffset:0,byteLength:0,mode:v,filter:h.filter!=="NONE"?h.filter:void 0,byteStride:f,count:0}}});let R=t.createAccessorDef(u);R.componentType=l.componentType,R.normalized=l.normalized,R.byteOffset=T.byteLength,R.min&&l.min&&(R.min=l.min),R.max&&l.max&&(R.max=l.max),t.accessorIndexMap.set(u,e.accessors.length),e.accessors.push(R),M.push(R),I.push(new Uint8Array(m.buffer,m.byteOffset,m.byteLength)),T.byteLength+=m.byteLength,T.extensions.EXT_meshopt_compression.count+=u.getCount()}}_prewriteBuffers(t){let e=this._encoder;for(let a in this._encoderBufferViews){let s=this._encoderBufferViews[a],r=this._encoderBufferViewData[a],n=this.document.getRoot().listBuffers()[s.extensions[Me].buffer],i=t.otherBufferViews.get(n)||[],{count:o,byteStride:c,mode:d}=s.extensions[Me],u=G.concat(r),b=e.encodeGltfBuffer(u,o,c,d),w=G.pad(b);s.extensions[Me].byteLength=b.byteLength,r.length=0,r.push(w),i.push(w),t.otherBufferViews.set(n,i)}}write(t){let e=0;for(let n in this._encoderBufferViews){let i=this._encoderBufferViews[n],o=this._encoderBufferViewData[n][0],c=t.otherBufferViewsIndexMap.get(o),d=this._encoderBufferViewAccessors[n];for(let v of d)v.bufferView=c;let u=t.jsonDoc.json.bufferViews[c],b=u.byteOffset||0;Object.assign(u,i),u.byteOffset=e;let w=u.extensions[Me];w.byteOffset=b,e+=G.padNumber(i.byteLength)}let a=this._encoderFallbackBuffer,s=t.bufferIndexMap.get(a),r=t.jsonDoc.json.buffers[s];return r.byteLength=e,r.extensions={[Me]:{fallback:!0}},a.dispose(),this}},od=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="StructuralMetadata",this.parentTypes=[N.ROOT]}getDefaults(){return Object.assign(super.getDefaults(),{schema:null,schemaUri:"",propertyTables:new he,propertyTextures:new he,propertyAttributes:new he})}getSchema(){return this.getRef("schema")}setSchema(t){return this.setRef("schema",t)}getSchemaUri(){return this.get("schemaUri")}setSchemaUri(t){return this.set("schemaUri",t)}listPropertyTables(){return this.listRefs("propertyTables")}addPropertyTable(t){return this.addRef("propertyTables",t)}removePropertyTable(t){return this.removeRef("propertyTables",t)}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},cd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="Schema",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",version:"",classes:new le,enums:new le})}getId(){return this.get("id")}setId(t){return this.set("id",t)}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getVersion(){return this.get("version")}setVersion(t){return this.set("version",t)}setClass(t,e){return this.setRefMap("classes",t,e)}getClass(t){return this.getRefMap("classes",t)}listClassKeys(){return this.listRefMapKeys("classes")}listClassValues(){return this.listRefMapValues("classes")}setEnum(t,e){return this.setRefMap("enums",t,e)}getEnum(t){return this.getRefMap("enums",t)}listEnumKeys(){return this.listRefMapKeys("enums")}listEnumValues(){return this.listRefMapValues("enums")}},ld=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="Class",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",properties:new le})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},dd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="ClassProperty",this.parentTypes=["Class"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",componentType:null,enumType:null,array:null,count:null,normalized:null,offset:null,scale:null,max:null,min:null,required:null,noData:null,default:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getType(){return this.get("type")}setType(t){return this.set("type",t)}getComponentType(){return this.get("componentType")}setComponentType(t){return this.set("componentType",t)}getEnumType(){return this.get("enumType")}setEnumType(t){return this.set("enumType",t)}getArray(){return this.get("array")}setArray(t){return this.set("array",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}getNormalized(){return this.get("normalized")}setNormalized(t){return this.set("normalized",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}getRequired(){return this.get("required")}setRequired(t){return this.set("required",t)}getNoData(){return this.get("noData")}setNoData(t){return this.set("noData",t)}getDefault(){return this.get("default")}setDefault(t){return this.set("default",t)}},ud=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="Enum",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",valueType:"UINT16",values:new he})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValueType(){return this.get("valueType")}setValueType(t){return this.set("valueType",t)}listValues(){return this.listRefs("values")}addEnumValue(t){return this.addRef("values",t)}removeEnumValue(t){return this.removeRef("values",t)}},fd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="EnumValue",this.parentTypes=["Enum"]}getDefaults(){return Object.assign(super.getDefaults(),{description:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValue(){return this.get("value")}setValue(t){return this.set("value",t)}},hd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="PropertyTable",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new le})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},bd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="PropertyTableProperty",this.parentTypes=["PropertyTable"]}getDefaults(){return Object.assign(super.getDefaults(),{arrayOffsets:null,stringOffsets:null,arrayOffsetType:null,stringOffsetType:null,offset:null,scale:null,max:null,min:null})}getValues(){return this.get("values")}setValues(t){return this.set("values",t)}getArrayOffsets(){return this.get("arrayOffsets")}setArrayOffsets(t){return this.set("arrayOffsets",t)}getStringOffsets(){return this.get("stringOffsets")}setStringOffsets(t){return this.set("stringOffsets",t)}getArrayOffsetType(){return this.get("arrayOffsetType")}setArrayOffsetType(t){return this.set("arrayOffsetType",t)}getStringOffsetType(){return this.get("stringOffsetType")}setStringOffsetType(t){return this.set("stringOffsetType",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},pd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="PropertyTexture",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new le})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},gd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="PropertyTextureProperty",this.parentTypes=["PropertyTexture"]}getDefaults(){let t=new ae(this.graph,"textureInfo");return t.setMinFilter(ae.MagFilter.NEAREST),t.setMagFilter(ae.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t,offset:null,scale:null,max:null,min:null})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},md=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="PropertyAttribute",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new le})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},yd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="PropertyAttributeProperty",this.parentTypes=["PropertyAttribute"]}getDefaults(){return Object.assign(super.getDefaults(),{offset:null,scale:null,max:null,min:null})}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},xd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="NodeStructuralMetadata",this.parentTypes=[N.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{class:"",properties:{}})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getProperties(){return this.get("properties")}setProperties(t){return this.set("properties",t)}},vd=class extends H{static EXTENSION_NAME=K;init(){this.extensionName=K,this.propertyType="MeshPrimitiveStructuralMetadata",this.parentTypes=[N.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{propertyTextures:new he,propertyAttributes:new he})}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},wd=class extends Z{extensionName=K;static EXTENSION_NAME=K;prewriteTypes=[N.BUFFER];prereadTypes=[N.SCENE];createStructuralMetadata(){return new od(this.document.getGraph())}createSchema(){return new cd(this.document.getGraph())}createClass(){return new ld(this.document.getGraph())}createClassProperty(){return new dd(this.document.getGraph())}createEnum(){return new ud(this.document.getGraph())}createEnumValue(){return new fd(this.document.getGraph())}createPropertyTable(){return new hd(this.document.getGraph())}createPropertyTableProperty(){return new bd(this.document.getGraph())}createPropertyTexture(){return new pd(this.document.getGraph())}createPropertyTextureProperty(){return new gd(this.document.getGraph())}createPropertyAttribute(){return new md(this.document.getGraph())}createPropertyAttributeProperty(){return new yd(this.document.getGraph())}createNodeStructuralMetadata(){return new xd(this.document.getGraph())}createMeshPrimitiveStructuralMetadata(){return new vd(this.document.getGraph())}read(t){return this}preread(t){let e=this.document.getRoot(),{json:a}=t.jsonDoc,s=a.extensions[K],r=Ed(this,t,s);return e.setExtension(K,r),(a.meshes||[]).forEach((n,i)=>{let o=t.meshes[i].listPrimitives();(n.primitives||[]).forEach((c,d)=>{let u=o[d];this._readPrimitive(r,u,c)})}),(a.nodes||[]).forEach((n,i)=>{this._readNode(t.nodes[i],n)}),this}_readPrimitive(t,e,a){if(!a.extensions||!a.extensions.EXT_structural_metadata)return;let s=this.createMeshPrimitiveStructuralMetadata(),r=a.extensions[K],n=t.listPropertyTextures(),i=r.propertyTextures||[];for(let d of i){let u=n[d];s.addPropertyTexture(u)}let o=t.listPropertyAttributes(),c=r.propertyAttributes||[];for(let d of c){let u=o[d];s.addPropertyAttribute(u)}e.setExtension(K,s)}_readNode(t,e){if(!e.extensions||!e.extensions.EXT_structural_metadata)return;let a=e.extensions[K],s=this.createNodeStructuralMetadata().setClass(a.class).setProperties(a.properties);t.setExtension(K,s)}write(t){let e=this.document.getRoot(),a=e.getExtension(K);if(!a)return this;let s=t.jsonDoc.json,r=Bd(t,a);s.extensions=s.extensions||{},s.extensions[K]=r;let n=e.listMeshes(),i=s.meshes;if(i)for(let d of n){let u=i[t.meshIndexMap.get(d)];d.listPrimitives().forEach((b,w)=>{let v=u.primitives[w];this._writePrimitive(a,b,v)})}let o=e.listNodes(),c=s.nodes;if(c)for(let d of o){let u=t.nodeIndexMap.get(d);this._writeNode(d,c[u])}return this}_writePrimitive(t,e,a){let s=e.getExtension(K);if(!s)return;let r=t.listPropertyTextures(),n=t.listPropertyAttributes(),i,o,c=s.listPropertyTextures();if(c.length>0){i=[];for(let b of c){let w=r.indexOf(b);if(w>=0)i.push(w);else throw new Error(`${K}: Invalid property texture in mesh primitive`)}}let d=s.listPropertyAttributes();if(d.length>0){o=[];for(let b of d){let w=n.indexOf(b);if(w>=0)o.push(w);else throw new Error(`${K}: Invalid property attribute in mesh primitive`)}}let u={propertyTextures:i,propertyAttributes:o};a.extensions=a.extensions||{},a.extensions[K]=u}_writeNode(t,e){let a=t.getExtension("EXT_structural_metadata");a&&(e.extensions=e.extensions||{},e.extensions[K]={class:a.getClass(),properties:a.getProperties()})}prewrite(t,e){return e===N.BUFFER&&this._prewriteBuffers(t),this}_prewriteBuffers(t){let e=this.document,a=e.getRoot().getExtension(K);t.jsonDoc.json.bufferViews||=[];for(let s of a.listPropertyTables())for(let r of s.listPropertyValues()){let n=qd(e,t);n.push(r.getValues());let i=r.getArrayOffsets();i&&n.push(i);let o=r.getStringOffsets();o&&n.push(o)}}};function Ed(t,e,a){let s=t.createStructuralMetadata();if(a.schema!==void 0){let o=Td(t,a.schema);s.setSchema(o)}else if(a.schemaUri){let o=a.schemaUri;s.setSchemaUri(o)}let r=a.propertyTextures||[];for(let o of r){let c=Sd(t,e,o);s.addPropertyTexture(c)}let n=a.propertyTables||[];for(let o of n){let c=_d(t,e,o);s.addPropertyTable(c)}let i=a.propertyAttributes||[];for(let o of i){let c=Fd(t,o);s.addPropertyAttribute(c)}return s}function Td(t,e){let a=t.createSchema().setId(e.id);e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.version!==void 0&&a.setVersion(e.version);let s=e.classes||{};for(let n of Object.keys(s)){let i=s[n];a.setClass(n,kd(t,i))}let r=e.enums||{};for(let n of Object.keys(r))a.setEnum(n,Id(t,r[n]));return a}function kd(t,e){let a=t.createClass();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description);let s=e.properties||{};for(let r of Object.keys(s)){let n=Md(t,s[r]);a.setProperty(r,n)}return a}function Md(t,e){let a=t.createClassProperty().setType(e.type);return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.componentType!==void 0&&a.setComponentType(e.componentType),e.enumType!==void 0&&a.setEnumType(e.enumType),e.array!==void 0&&a.setArray(e.array),e.count!==void 0&&a.setCount(e.count),e.normalized!==void 0&&a.setNormalized(e.normalized),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),e.required!==void 0&&a.setRequired(e.required),e.noData!==void 0&&a.setNoData(e.noData),e.default!==void 0&&a.setDefault(e.default),a}function Id(t,e){let a=t.createEnum();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.valueType!==void 0&&a.setValueType(e.valueType);let s=e.values||{};for(let r of s)a.addEnumValue(Rd(t,r));return a}function Rd(t,e){let a=t.createEnumValue();return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.value!==void 0&&a.setValue(e.value),a}function Sd(t,e,a){let s=t.createPropertyTexture();s.setClass(a.class),a.name!==void 0&&s.setName(a.name);let r=a.properties||{};for(let n of Object.keys(r)){let i=Ad(t,e,r[n]);s.setProperty(n,i)}return s}function Ad(t,e,a){let s=t.createPropertyTextureProperty(),r=e.jsonDoc.json.textures||[];a.channels&&s.setChannels(a.channels);let n=r[a.index].source;if(n!==void 0){let i=e.textures[n];s.setTexture(i);let o=s.getTextureInfo();o&&e.setTextureInfo(o,a)}return a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function _d(t,e,a){let s=t.createPropertyTable().setClass(a.class).setCount(a.count);a.name!==void 0&&s.setName(a.name);let r=a.properties||{};for(let n of Object.keys(r)){let i=Nd(t,e,r[n]);s.setProperty(n,i)}return s}function Nd(t,e,a){let s=t.createPropertyTableProperty(),r=sr(e,a.values);if(s.setValues(r),a.arrayOffsets!==void 0){let n=sr(e,a.arrayOffsets);s.setArrayOffsets(n)}if(a.stringOffsets!==void 0){let n=sr(e,a.stringOffsets);s.setStringOffsets(n)}return a.arrayOffsetType!==void 0&&s.setArrayOffsetType(a.arrayOffsetType),a.stringOffsetType!==void 0&&s.setStringOffsetType(a.stringOffsetType),a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function Fd(t,e){let a=t.createPropertyAttribute();a.setClass(e.class),e.name!==void 0&&a.setName(e.name);let s=e.properties||{};for(let r of Object.keys(s)){let n=jd(t,s[r]);a.setProperty(r,n)}return a}function jd(t,e){let a=t.createPropertyAttributeProperty();return a.setAttribute(e.attribute),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),a}function Bd(t,e){let a={},s=e.getSchema();s&&(a.schema=Cd(s));let r=e.getSchemaUri();r&&(a.schemaUri=r);let n=e.listPropertyTables();if(n.length>0){let c=[];for(let d of n){let u=Ld(t,d);c.push(u)}a.propertyTables=c}let i=e.listPropertyTextures();if(i.length>0){let c=[];for(let d of i){let u=Vd(t,d);c.push(u)}a.propertyTextures=c}let o=e.listPropertyAttributes();if(o.length>0){let c=[];for(let d of o){let u=Gd(d);c.push(u)}a.propertyAttributes=c}return a}function Cd(t){let e={id:t.getId()},a=t.listClassKeys();if(a.length>0){e.classes={};for(let r of a){let n=Od(t.getClass(r));e.classes[r]=n}}let s=t.listEnumKeys();if(s.length>0){e.enums={};for(let r of s){let n=Dd(t.getEnum(r));e.enums[r]=n}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getVersion()&&(e.version=t.getVersion()),e}function Od(t){let e={},a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let r=t.getProperty(s);e.properties[s]=Pd(r)}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),e}function Pd(t){let e={type:t.getType()};return t.getArray()&&(e.array=t.getArray()),t.getNormalized()&&(e.normalized=t.getNormalized()),t.getRequired()&&(e.required=t.getRequired()),t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getComponentType()!=null&&(e.componentType=t.getComponentType()),t.getEnumType()!=null&&(e.enumType=t.getEnumType()),t.getCount()!=null&&(e.count=t.getCount()),t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),t.getNoData()!=null&&(e.noData=t.getNoData()),t.getDefault()!=null&&(e.default=t.getDefault()),e}function Dd(t){let e={values:t.listValues().map(Ud)};return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getValueType()!=="UINT16"&&(e.valueType=t.getValueType()),e}function Ud(t){let e={name:t.getName(),value:t.getValue()};return t.getDescription()&&(e.description=t.getDescription()),e}function Ld(t,e){let a={class:e.getClass(),count:e.getCount()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let r of s){let n=Kd(t,e.getProperty(r));a.properties[r]=n}}return a}function Kd(t,e){let a=e.getValues(),s={values:t.otherBufferViewsIndexMap.get(a)};if(e.getArrayOffsets()){let r=e.getArrayOffsets();s.arrayOffsets=t.otherBufferViewsIndexMap.get(r)}if(e.getStringOffsets()){let r=e.getStringOffsets();s.stringOffsets=t.otherBufferViewsIndexMap.get(r)}return e.getArrayOffsetType()!=null&&(s.arrayOffsetType=e.getArrayOffsetType()),e.getStringOffsetType()!=null&&(s.stringOffsetType=e.getStringOffsetType()),e.getOffset()!=null&&(s.offset=e.getOffset()),e.getScale()!=null&&(s.scale=e.getScale()),e.getMax()!=null&&(s.max=e.getMax()),e.getMin()!=null&&(s.min=e.getMin()),s}function Gd(t){let e={class:t.getClass()};t.getName()&&(e.name=t.getName());let a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let r=zd(t.getProperty(s));e.properties[s]=r}}return e}function zd(t){let e={attribute:t.getAttribute()};return t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),e}function Vd(t,e){let a={class:e.getClass()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let r of s){let n=Hd(t,e.getProperty(r));a.properties[r]=n}}return a}function Hd(t,e){let a=e.getTexture(),s=e.getTextureInfo(),r=e.getChannels(),n=t.createTextureInfoDef(a,s);return se.eq(r,[0])||(n.channels=r),e.getOffset()!=null&&(n.offset=e.getOffset()),e.getScale()!=null&&(n.scale=e.getScale()),e.getMax()!=null&&(n.max=e.getMax()),e.getMin()!=null&&(n.min=e.getMin()),n}function sr(t,e){let a=t.jsonDoc,s=a.json.buffers||[],r=(a.json.bufferViews||[])[e],n=s[r.buffer],i=n.uri?a.resources[n.uri]:a.resources[ct],o=r.byteOffset||0,c=r.byteLength;return i.slice(o,o+c)}function qd(t,e){let a=t.getRoot().listBuffers()[0],s=e.otherBufferViews.get(a);return s||(s=[],e.otherBufferViews.set(a,s)),s}var Xd=class{match(t){return t.length>=12&&G.decodeText(t.slice(4,12))==="ftypavif"}getSize(t){if(!this.match(t))return null;let e=new DataView(t.buffer,t.byteOffset,t.byteLength),a=Hn(e,0);if(!a)return null;let s=a.end;for(;a=Hn(e,s);)if(a.type==="meta")s=a.start+4;else if(a.type==="iprp"||a.type==="ipco")s=a.start;else{if(a.type==="ispe")return[e.getUint32(a.start+4),e.getUint32(a.start+8)];if(a.type==="mdat")break;s=a.end}return null}getChannels(t){return 4}},Wd=class extends Z{extensionName=as;prereadTypes=[N.TEXTURE];static EXTENSION_NAME=as;static register(){qe.registerFormat("image/avif",new Xd)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_avif&&(e.source=e.extensions[as].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/avif"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[as]={source:r.source},delete r.source)})}}),this}};function Hn(t,e){if(t.byteLength<4+e)return null;let a=t.getUint32(e);return t.byteLength<a+e||a<8?null:{type:G.decodeText(new Uint8Array(t.buffer,t.byteOffset+e+4,4)),start:e+8,end:e+a}}var Jd=class{match(t){return t.length>=12&&t[8]===87&&t[9]===69&&t[10]===66&&t[11]===80}getSize(t){let e=G.decodeText(t.slice(0,4)),a=G.decodeText(t.slice(8,12));if(e!=="RIFF"||a!=="WEBP")return null;let s=new DataView(t.buffer,t.byteOffset),r=12;for(;r<s.byteLength;){let n=G.decodeText(new Uint8Array([s.getUint8(r),s.getUint8(r+1),s.getUint8(r+2),s.getUint8(r+3)])),i=s.getUint32(r+4,!0);if(n==="VP8 ")return[s.getInt16(r+14,!0)&16383,s.getInt16(r+16,!0)&16383];if(n==="VP8L"){let o=s.getUint8(r+9),c=s.getUint8(r+10),d=s.getUint8(r+11),u=s.getUint8(r+12);return[1+((c&63)<<8|o),1+((u&15)<<10|d<<2|(c&192)>>6)]}r+=8+i+i%2}return null}getChannels(t){return 4}},Yd=class extends Z{extensionName=ts;prereadTypes=[N.TEXTURE];static EXTENSION_NAME=ts;static register(){qe.registerFormat("image/webp",new Jd)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_webp&&(e.source=e.extensions[ts].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/webp"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[ts]={source:r.source},delete r.source)})}}),this}},qn=Kl,$d=class extends Z{extensionName=qn;static EXTENSION_NAME=qn;read(t){return this}write(t){return this}},Xn=Gl,Qd=class extends Z{extensionName=Xn;static EXTENSION_NAME=Xn;read(t){return this}write(t){return this}},ue,oi,ci;function Zd(t,e){let a=new ue.DecoderBuffer;try{if(a.Init(e,e.length),t.GetEncodedGeometryType(a)!==ue.TRIANGULAR_MESH)throw new Error(`[${oe}] Unknown geometry type.`);let s=new ue.Mesh;if(!t.DecodeBufferToMesh(a,s).ok()||s.ptr===0)throw new Error(`[${oe}] Decoding failure.`);return s}finally{ue.destroy(a)}}function eu(t,e){let a=e.num_faces()*3,s,r;if(e.num_points()<=65534){let n=a*Uint16Array.BYTES_PER_ELEMENT;s=ue._malloc(n),t.GetTrianglesUInt16Array(e,n,s),r=new Uint16Array(ue.HEAPU16.buffer,s,a).slice()}else{let n=a*Uint32Array.BYTES_PER_ELEMENT;s=ue._malloc(n),t.GetTrianglesUInt32Array(e,n,s),r=new Uint32Array(ue.HEAPU32.buffer,s,a).slice()}return ue._free(s),r}function tu(t,e,a,s){let r=ci[s.componentType],n=oi[s.componentType],i=a.num_components(),o=e.num_points()*i,c=o*n.BYTES_PER_ELEMENT,d=ue._malloc(c);t.GetAttributeDataArrayForAllPoints(e,a,r,c,d);let u=new n(ue.HEAPF32.buffer,d,o).slice();return ue._free(d),u}function au(t){ue=t,oi={[D.ComponentType.FLOAT]:Float32Array,[D.ComponentType.UNSIGNED_INT]:Uint32Array,[D.ComponentType.UNSIGNED_SHORT]:Uint16Array,[D.ComponentType.UNSIGNED_BYTE]:Uint8Array,[D.ComponentType.SHORT]:Int16Array,[D.ComponentType.BYTE]:Int8Array},ci={[D.ComponentType.FLOAT]:ue.DT_FLOAT32,[D.ComponentType.UNSIGNED_INT]:ue.DT_UINT32,[D.ComponentType.UNSIGNED_SHORT]:ue.DT_UINT16,[D.ComponentType.UNSIGNED_BYTE]:ue.DT_UINT8,[D.ComponentType.SHORT]:ue.DT_INT16,[D.ComponentType.BYTE]:ue.DT_INT8}}var Be,su=(function(t){return t[t.EDGEBREAKER=1]="EDGEBREAKER",t[t.SEQUENTIAL=0]="SEQUENTIAL",t})({}),li={POSITION:14,NORMAL:10,COLOR:8,TEX_COORD:12,GENERIC:12},Wn={decodeSpeed:5,encodeSpeed:5,method:1,quantizationBits:li,quantizationVolume:"mesh"};function ru(t){Be=t}function nu(t,e=Wn){let a={...Wn,...e};a.quantizationBits={...li,...e.quantizationBits};let s=new Be.MeshBuilder,r=new Be.Mesh,n=new Be.ExpertEncoder(r),i={},o=new Be.DracoInt8Array,c=t.listTargets().length>0,d=!1;for(let l of t.listSemantics()){let m=t.getAttribute(l);if(m.getSparse()){d=!0;continue}let f=iu(l),p=ou(s,m.getComponentType(),r,Be[f],m.getCount(),m.getElementSize(),m.getArray());if(p===-1)throw new Error(`Error compressing "${l}" attribute.`);if(i[l]=p,a.quantizationVolume==="mesh"||l!=="POSITION")n.SetAttributeQuantization(p,a.quantizationBits[f]);else if(typeof a.quantizationVolume=="object"){let{quantizationVolume:y}=a,E=Math.max(y.max[0]-y.min[0],y.max[1]-y.min[1],y.max[2]-y.min[2]);n.SetAttributeExplicitQuantization(p,a.quantizationBits[f],m.getElementSize(),y.min,E)}else throw new Error("Invalid quantization volume state.")}let u=t.getIndices();if(!u)throw new or("Primitive must have indices.");s.AddFacesToMesh(r,u.getCount()/3,u.getArray()),n.SetSpeedOptions(a.encodeSpeed,a.decodeSpeed),n.SetTrackEncodedProperties(!0),a.method===0||c||d?n.SetEncodingMethod(Be.MESH_SEQUENTIAL_ENCODING):n.SetEncodingMethod(Be.MESH_EDGEBREAKER_ENCODING);let b=n.EncodeToDracoBuffer(!(c||d),o);if(b<=0)throw new or("Error applying Draco compression.");let w=new Uint8Array(b);for(let l=0;l<b;++l)w[l]=o.GetValue(l);let v=n.GetNumberOfEncodedPoints(),h=n.GetNumberOfEncodedFaces()*3;return Be.destroy(o),Be.destroy(r),Be.destroy(s),Be.destroy(n),{numVertices:v,numIndices:h,data:w,attributeIDs:i}}function iu(t){return t==="POSITION"?"POSITION":t==="NORMAL"?"NORMAL":t.startsWith("COLOR_")?"COLOR":t.startsWith("TEXCOORD_")?"TEX_COORD":"GENERIC"}function ou(t,e,a,s,r,n,i){switch(e){case D.ComponentType.UNSIGNED_BYTE:return t.AddUInt8Attribute(a,s,r,n,i);case D.ComponentType.BYTE:return t.AddInt8Attribute(a,s,r,n,i);case D.ComponentType.UNSIGNED_SHORT:return t.AddUInt16Attribute(a,s,r,n,i);case D.ComponentType.SHORT:return t.AddInt16Attribute(a,s,r,n,i);case D.ComponentType.UNSIGNED_INT:return t.AddUInt32Attribute(a,s,r,n,i);case D.ComponentType.FLOAT:return t.AddFloatAttribute(a,s,r,n,i);default:throw new Error(`Unexpected component type, "${e}".`)}}var or=class extends Error{},cu=class extends Z{extensionName=oe;prereadTypes=[N.PRIMITIVE];prewriteTypes=[N.ACCESSOR];readDependencies=["draco3d.decoder"];writeDependencies=["draco3d.encoder"];static EXTENSION_NAME=oe;static EncoderMethod=su;_decoderModule=null;_encoderModule=null;_encoderOptions={};install(t,e){return t==="draco3d.decoder"&&(this._decoderModule=e,au(this._decoderModule)),t==="draco3d.encoder"&&(this._encoderModule=e,ru(this._encoderModule)),this}setEncoderOptions(t){return this._encoderOptions=t,this}preread(t){if(!this._decoderModule)throw new Error(`[${oe}] Please install extension dependency, "draco3d.decoder".`);let e=this.document.getLogger(),a=t.jsonDoc,s=new Map;try{let r=a.json.meshes||[];for(let n of r)for(let i of n.primitives){if(!i.extensions||!i.extensions.KHR_draco_mesh_compression)continue;let o=i.extensions[oe],[c,d]=s.get(o.bufferView)||[];if(!d||!c){let u=a.json.bufferViews[o.bufferView],b=a.json.buffers[u.buffer],w=b.uri?a.resources[b.uri]:a.resources[ct],v=u.byteOffset||0,h=u.byteLength,l=G.toView(w,v,h);c=new this._decoderModule.Decoder,d=Zd(c,l),s.set(o.bufferView,[c,d]),e.debug(`[${oe}] Decompressed ${l.byteLength} bytes.`)}for(let u in o.attributes){let b=t.jsonDoc.json.accessors[i.attributes[u]],w=c.GetAttributeByUniqueId(d,o.attributes[u]),v=tu(c,d,w,b);t.accessors[i.attributes[u]].setArray(v)}i.indices!==void 0&&t.accessors[i.indices].setArray(eu(c,d))}}finally{for(let[r,n]of Array.from(s.values()))this._decoderModule.destroy(r),this._decoderModule.destroy(n)}return this}read(t){return this}prewrite(t,e){if(!this._encoderModule)throw new Error(`[${oe}] Please install extension dependency, "draco3d.encoder".`);let a=this.document.getLogger();a.debug(`[${oe}] Compression options: ${JSON.stringify(this._encoderOptions)}`);let s=lu(this.document),r=new Map,n="mesh";this._encoderOptions.quantizationVolume==="scene"&&(this.document.getRoot().listScenes().length!==1?a.warn(`[${oe}]: quantizationVolume=scene requires exactly 1 scene.`):n=wn(this.document.getRoot().listScenes().pop()));for(let i of Array.from(s.keys())){let o=s.get(i);if(!o)throw new Error("Unexpected primitive.");if(r.has(o)){r.set(o,r.get(o));continue}let c=i.getIndices(),d=t.jsonDoc.json.accessors,u;try{u=nu(i,{...this._encoderOptions,quantizationVolume:n})}catch(v){if(v instanceof or){a.warn(`[${oe}]: ${v.message} Skipping primitive compression.`);continue}throw v}r.set(o,u);let b=t.createAccessorDef(c);b.count=u.numIndices,t.accessorIndexMap.set(c,d.length),d.push(b),u.numVertices>65534&&D.getComponentSize(b.componentType)<=2?b.componentType=D.ComponentType.UNSIGNED_INT:u.numVertices>254&&D.getComponentSize(b.componentType)<=1&&(b.componentType=D.ComponentType.UNSIGNED_SHORT);for(let v of i.listSemantics()){let h=i.getAttribute(v);if(u.attributeIDs[v]===void 0)continue;let l=t.createAccessorDef(h);l.count=u.numVertices,t.accessorIndexMap.set(h,d.length),d.push(l)}let w=i.getAttribute("POSITION").getBuffer()||this.document.getRoot().listBuffers()[0];t.otherBufferViews.has(w)||t.otherBufferViews.set(w,[]),t.otherBufferViews.get(w).push(u.data)}return a.debug(`[${oe}] Compressed ${s.size} primitives.`),t.extensionData[oe]={primitiveHashMap:s,primitiveEncodingMap:r},this}write(t){let e=t.extensionData[oe];for(let a of this.document.getRoot().listMeshes()){let s=t.jsonDoc.json.meshes[t.meshIndexMap.get(a)];for(let r=0;r<a.listPrimitives().length;r++){let n=a.listPrimitives()[r],i=s.primitives[r],o=e.primitiveHashMap.get(n);if(!o)continue;let c=e.primitiveEncodingMap.get(o);c&&(i.extensions=i.extensions||{},i.extensions[oe]={bufferView:t.otherBufferViewsIndexMap.get(c.data),attributes:c.attributeIDs})}}if(!e.primitiveHashMap.size){let a=t.jsonDoc.json;a.extensionsUsed=(a.extensionsUsed||[]).filter(s=>s!==oe),a.extensionsRequired=(a.extensionsRequired||[]).filter(s=>s!==oe)}return this}};function lu(t){let e=t.getLogger(),a=new Set,s=new Set,r=0,n=0;for(let b of t.getRoot().listMeshes())for(let w of b.listPrimitives())w.getIndices()?w.getMode()!==ua.Mode.TRIANGLES?(s.add(w),n++):a.add(w):(s.add(w),r++);r>0&&e.warn(`[${oe}] Skipping Draco compression of ${r} non-indexed primitives.`),n>0&&e.warn(`[${oe}] Skipping Draco compression of ${n} non-TRIANGLES primitives.`);let i=t.getRoot().listAccessors(),o=new Map;for(let b=0;b<i.length;b++)o.set(i[b],b);let c=new Map,d=new Set,u=new Map;for(let b of Array.from(a)){let w=Jn(b,o);if(d.has(w)){u.set(b,w);continue}if(c.has(b.getIndices())){let v=b.getIndices(),h=v.clone();o.set(h,t.getRoot().listAccessors().length-1),b.swap(v,h)}for(let v of b.listAttributes())if(c.has(v)){let h=v.clone();o.set(h,t.getRoot().listAccessors().length-1),b.swap(v,h)}w=Jn(b,o),d.add(w),u.set(b,w),c.set(b.getIndices(),w);for(let v of b.listAttributes())c.set(v,w)}for(let b of Array.from(c.keys())){let w=new Set(b.listParents().map(v=>v.propertyType));if(w.size!==2||!w.has(N.PRIMITIVE)||!w.has(N.ROOT))throw new Error(`[${oe}] Compressed accessors must only be used as indices or vertex attributes.`)}for(let b of Array.from(a)){let w=u.get(b),v=b.getIndices();if(c.get(v)!==w||b.listAttributes().some(h=>c.get(h)!==w))throw new Error(`[${oe}] Draco primitives must share all, or no, accessors.`)}for(let b of Array.from(s)){let w=b.getIndices();if(c.has(w)||b.listAttributes().some(v=>c.has(v)))throw new Error(`[${oe}] Accessor cannot be shared by compressed and uncompressed primitives.`)}return u}function Jn(t,e){let a=[],s=t.getIndices();a.push(e.get(s));for(let r of t.listAttributes())a.push(e.get(r));return a.sort().join("|")}var Yn=class di extends H{static EXTENSION_NAME=Qe;static Type={POINT:"point",SPOT:"spot",DIRECTIONAL:"directional"};init(){this.extensionName=Qe,this.propertyType="Light",this.parentTypes=[N.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{color:[1,1,1],intensity:1,type:di.Type.POINT,range:null,innerConeAngle:0,outerConeAngle:Math.PI/4})}getColor(){return this.get("color")}setColor(e){return this.set("color",e)}getIntensity(){return this.get("intensity")}setIntensity(e){return this.set("intensity",e)}getType(){return this.get("type")}setType(e){return this.set("type",e)}getRange(){return this.get("range")}setRange(e){return this.set("range",e)}getInnerConeAngle(){return this.get("innerConeAngle")}setInnerConeAngle(e){return this.set("innerConeAngle",e)}getOuterConeAngle(){return this.get("outerConeAngle")}setOuterConeAngle(e){return this.set("outerConeAngle",e)}},du=class extends Z{extensionName=Qe;static EXTENSION_NAME=Qe;createLight(t=""){return new Yn(this.document.getGraph(),t)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_lights_punctual)return this;let a=(e.json.extensions.KHR_lights_punctual.lights||[]).map(s=>{let r=this.createLight().setName(s.name||"").setType(s.type);return s.extras&&r.setExtras(s.extras),s.color!==void 0&&r.setColor(s.color),s.intensity!==void 0&&r.setIntensity(s.intensity),s.range!==void 0&&r.setRange(s.range),s.spot?.innerConeAngle!==void 0&&r.setInnerConeAngle(s.spot.innerConeAngle),s.spot?.outerConeAngle!==void 0&&r.setOuterConeAngle(s.spot.outerConeAngle),r});return e.json.nodes.forEach((s,r)=>{if(!s.extensions||!s.extensions.KHR_lights_punctual)return;let n=s.extensions[Qe];t.nodes[r].setExtension(Qe,a[n.light])}),this}write(t){let e=t.jsonDoc;if(this.properties.size===0)return this;let a=[],s=new Map;for(let r of this.properties){let n=r,i=t.createPropertyDef(r);i.type=n.getType(),se.eq(n.getColor(),[1,1,1])||(i.color=n.getColor()),n.getIntensity()!==1&&(i.intensity=n.getIntensity()),n.getRange()!=null&&(i.range=n.getRange()),n.getName()&&(i.name=n.getName()),n.getType()===Yn.Type.SPOT&&(i.spot={innerConeAngle:n.getInnerConeAngle(),outerConeAngle:n.getOuterConeAngle()}),a.push(i),s.set(n,a.length-1)}return this.document.getRoot().listNodes().forEach(r=>{let n=r.getExtension(Qe);if(n){let i=t.nodeIndexMap.get(r),o=e.json.nodes[i];o.extensions=o.extensions||{},o.extensions[Qe]={light:s.get(n)}}}),e.json.extensions=e.json.extensions||{},e.json.extensions[Qe]={lights:a},this}},{R:uu,G:fu,B:hu}=Ue,bu=class extends H{static EXTENSION_NAME=ut;init(){this.extensionName=ut,this.propertyType="Anisotropy",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{anisotropyStrength:0,anisotropyRotation:0,anisotropyTexture:null,anisotropyTextureInfo:new ae(this.graph,"anisotropyTextureInfo")})}getAnisotropyStrength(){return this.get("anisotropyStrength")}setAnisotropyStrength(t){return this.set("anisotropyStrength",t)}getAnisotropyRotation(){return this.get("anisotropyRotation")}setAnisotropyRotation(t){return this.set("anisotropyRotation",t)}getAnisotropyTexture(){return this.getRef("anisotropyTexture")}getAnisotropyTextureInfo(){return this.getRef("anisotropyTexture")?this.getRef("anisotropyTextureInfo"):null}setAnisotropyTexture(t){return this.setRef("anisotropyTexture",t,{channels:uu|fu|hu})}},pu=class extends Z{static EXTENSION_NAME=ut;extensionName=ut;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createAnisotropy(){return new bu(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_anisotropy){let i=this.createAnisotropy();t.materials[n].setExtension(ut,i);let o=r.extensions[ut];if(o.extras&&i.setExtras(o.extras),o.anisotropyStrength!==void 0&&i.setAnisotropyStrength(o.anisotropyStrength),o.anisotropyRotation!==void 0&&i.setAnisotropyRotation(o.anisotropyRotation),o.anisotropyTexture!==void 0){let c=o.anisotropyTexture,d=t.textures[s[c.index].source];i.setAnisotropyTexture(d),t.setTextureInfo(i.getAnisotropyTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(ut);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[ut]=i,s.getAnisotropyStrength()>0&&(i.anisotropyStrength=s.getAnisotropyStrength()),s.getAnisotropyRotation()!==0&&(i.anisotropyRotation=s.getAnisotropyRotation()),s.getAnisotropyTexture()){let o=s.getAnisotropyTexture(),c=s.getAnisotropyTextureInfo();i.anisotropyTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:$n,G:Qn,B:gu}=Ue,mu=class extends H{static EXTENSION_NAME=ft;init(){this.extensionName=ft,this.propertyType="Clearcoat",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{clearcoatFactor:0,clearcoatTexture:null,clearcoatTextureInfo:new ae(this.graph,"clearcoatTextureInfo"),clearcoatRoughnessFactor:0,clearcoatRoughnessTexture:null,clearcoatRoughnessTextureInfo:new ae(this.graph,"clearcoatRoughnessTextureInfo"),clearcoatNormalScale:1,clearcoatNormalTexture:null,clearcoatNormalTextureInfo:new ae(this.graph,"clearcoatNormalTextureInfo")})}getClearcoatFactor(){return this.get("clearcoatFactor")}setClearcoatFactor(t){return this.set("clearcoatFactor",t)}getClearcoatTexture(){return this.getRef("clearcoatTexture")}getClearcoatTextureInfo(){return this.getRef("clearcoatTexture")?this.getRef("clearcoatTextureInfo"):null}setClearcoatTexture(t){return this.setRef("clearcoatTexture",t,{channels:$n})}getClearcoatRoughnessFactor(){return this.get("clearcoatRoughnessFactor")}setClearcoatRoughnessFactor(t){return this.set("clearcoatRoughnessFactor",t)}getClearcoatRoughnessTexture(){return this.getRef("clearcoatRoughnessTexture")}getClearcoatRoughnessTextureInfo(){return this.getRef("clearcoatRoughnessTexture")?this.getRef("clearcoatRoughnessTextureInfo"):null}setClearcoatRoughnessTexture(t){return this.setRef("clearcoatRoughnessTexture",t,{channels:Qn})}getClearcoatNormalScale(){return this.get("clearcoatNormalScale")}setClearcoatNormalScale(t){return this.set("clearcoatNormalScale",t)}getClearcoatNormalTexture(){return this.getRef("clearcoatNormalTexture")}getClearcoatNormalTextureInfo(){return this.getRef("clearcoatNormalTexture")?this.getRef("clearcoatNormalTextureInfo"):null}setClearcoatNormalTexture(t){return this.setRef("clearcoatNormalTexture",t,{channels:$n|Qn|gu})}},yu=class extends Z{static EXTENSION_NAME=ft;extensionName=ft;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createClearcoat(){return new mu(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_clearcoat){let i=this.createClearcoat();t.materials[n].setExtension(ft,i);let o=r.extensions[ft];if(o.extras&&i.setExtras(o.extras),o.clearcoatFactor!==void 0&&i.setClearcoatFactor(o.clearcoatFactor),o.clearcoatRoughnessFactor!==void 0&&i.setClearcoatRoughnessFactor(o.clearcoatRoughnessFactor),o.clearcoatTexture!==void 0){let c=o.clearcoatTexture,d=t.textures[s[c.index].source];i.setClearcoatTexture(d),t.setTextureInfo(i.getClearcoatTextureInfo(),c)}if(o.clearcoatRoughnessTexture!==void 0){let c=o.clearcoatRoughnessTexture,d=t.textures[s[c.index].source];i.setClearcoatRoughnessTexture(d),t.setTextureInfo(i.getClearcoatRoughnessTextureInfo(),c)}if(o.clearcoatNormalTexture!==void 0){let c=o.clearcoatNormalTexture,d=t.textures[s[c.index].source];i.setClearcoatNormalTexture(d),t.setTextureInfo(i.getClearcoatNormalTextureInfo(),c),c.scale!==void 0&&i.setClearcoatNormalScale(c.scale)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(ft);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[ft]=i,i.clearcoatFactor=s.getClearcoatFactor(),i.clearcoatRoughnessFactor=s.getClearcoatRoughnessFactor(),s.getClearcoatTexture()){let o=s.getClearcoatTexture(),c=s.getClearcoatTextureInfo();i.clearcoatTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatRoughnessTexture()){let o=s.getClearcoatRoughnessTexture(),c=s.getClearcoatRoughnessTextureInfo();i.clearcoatRoughnessTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatNormalTexture()){let o=s.getClearcoatNormalTexture(),c=s.getClearcoatNormalTextureInfo();i.clearcoatNormalTexture=t.createTextureInfoDef(o,c),s.getClearcoatNormalScale()!==1&&(i.clearcoatNormalTexture.scale=s.getClearcoatNormalScale())}}}),this}},{R:xu,G:vu,B:wu,A:Eu}=Ue,Tu=class extends H{static EXTENSION_NAME=ht;init(){this.extensionName=ht,this.propertyType="DiffuseTransmission",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseTransmissionFactor:0,diffuseTransmissionTexture:null,diffuseTransmissionTextureInfo:new ae(this.graph,"diffuseTransmissionTextureInfo"),diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorTexture:null,diffuseTransmissionColorTextureInfo:new ae(this.graph,"diffuseTransmissionColorTextureInfo")})}getDiffuseTransmissionFactor(){return this.get("diffuseTransmissionFactor")}setDiffuseTransmissionFactor(t){return this.set("diffuseTransmissionFactor",t)}getDiffuseTransmissionTexture(){return this.getRef("diffuseTransmissionTexture")}getDiffuseTransmissionTextureInfo(){return this.getRef("diffuseTransmissionTexture")?this.getRef("diffuseTransmissionTextureInfo"):null}setDiffuseTransmissionTexture(t){return this.setRef("diffuseTransmissionTexture",t,{channels:Eu})}getDiffuseTransmissionColorFactor(){return this.get("diffuseTransmissionColorFactor")}setDiffuseTransmissionColorFactor(t){return this.set("diffuseTransmissionColorFactor",t)}getDiffuseTransmissionColorTexture(){return this.getRef("diffuseTransmissionColorTexture")}getDiffuseTransmissionColorTextureInfo(){return this.getRef("diffuseTransmissionColorTexture")?this.getRef("diffuseTransmissionColorTextureInfo"):null}setDiffuseTransmissionColorTexture(t){return this.setRef("diffuseTransmissionColorTexture",t,{channels:xu|vu|wu})}},ku=class extends Z{extensionName=ht;static EXTENSION_NAME=ht;createDiffuseTransmission(){return new Tu(this.document.getGraph())}read(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_diffuse_transmission){let i=this.createDiffuseTransmission();t.materials[n].setExtension(ht,i);let o=r.extensions[ht];if(o.extras&&i.setExtras(o.extras),o.diffuseTransmissionFactor!==void 0&&i.setDiffuseTransmissionFactor(o.diffuseTransmissionFactor),o.diffuseTransmissionColorFactor!==void 0&&i.setDiffuseTransmissionColorFactor(o.diffuseTransmissionColorFactor),o.diffuseTransmissionTexture!==void 0){let c=o.diffuseTransmissionTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionTexture(d),t.setTextureInfo(i.getDiffuseTransmissionTextureInfo(),c)}if(o.diffuseTransmissionColorTexture!==void 0){let c=o.diffuseTransmissionColorTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionColorTexture(d),t.setTextureInfo(i.getDiffuseTransmissionColorTextureInfo(),c)}}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listMaterials()){let s=a.getExtension(ht);if(!s)continue;let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[ht]=i,i.diffuseTransmissionFactor=s.getDiffuseTransmissionFactor(),i.diffuseTransmissionColorFactor=s.getDiffuseTransmissionColorFactor(),s.getDiffuseTransmissionTexture()){let o=s.getDiffuseTransmissionTexture(),c=s.getDiffuseTransmissionTextureInfo();i.diffuseTransmissionTexture=t.createTextureInfoDef(o,c)}if(s.getDiffuseTransmissionColorTexture()){let o=s.getDiffuseTransmissionColorTexture(),c=s.getDiffuseTransmissionColorTextureInfo();i.diffuseTransmissionColorTexture=t.createTextureInfoDef(o,c)}}return this}},Mu=class extends H{static EXTENSION_NAME=bt;init(){this.extensionName=bt,this.propertyType="Dispersion",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{dispersion:0})}getDispersion(){return this.get("dispersion")}setDispersion(t){return this.set("dispersion",t)}},Iu=class extends Z{static EXTENSION_NAME=bt;extensionName=bt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createDispersion(){return new Mu(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_dispersion){let s=this.createDispersion();t.materials[a].setExtension(bt,s);let r=e.extensions[bt];r.extras&&s.setExtras(r.extras),r.dispersion!==void 0&&s.setDispersion(r.dispersion)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(bt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[bt]=i,i.dispersion=s.getDispersion()}}),this}},Ru=class extends H{static EXTENSION_NAME=pt;init(){this.extensionName=pt,this.propertyType="EmissiveStrength",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{emissiveStrength:1})}getEmissiveStrength(){return this.get("emissiveStrength")}setEmissiveStrength(t){return this.set("emissiveStrength",t)}},Su=class extends Z{static EXTENSION_NAME=pt;extensionName=pt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createEmissiveStrength(){return new Ru(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_emissive_strength){let s=this.createEmissiveStrength();t.materials[a].setExtension(pt,s);let r=e.extensions[pt];r.extras&&s.setExtras(r.extras),r.emissiveStrength!==void 0&&s.setEmissiveStrength(r.emissiveStrength)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(pt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[pt]=i,i.emissiveStrength=s.getEmissiveStrength()}}),this}},Au=class extends H{static EXTENSION_NAME=gt;init(){this.extensionName=gt,this.propertyType="IOR",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{ior:1.5})}getIOR(){return this.get("ior")}setIOR(t){return this.set("ior",t)}},_u=class extends Z{static EXTENSION_NAME=gt;extensionName=gt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createIOR(){return new Au(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_ior){let s=this.createIOR();t.materials[a].setExtension(gt,s);let r=e.extensions[gt];r.extras&&s.setExtras(r.extras),r.ior!==void 0&&s.setIOR(r.ior)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(gt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[gt]=i,i.ior=s.getIOR()}}),this}},{R:Nu,G:Fu}=Ue,ju=class extends H{static EXTENSION_NAME=mt;init(){this.extensionName=mt,this.propertyType="Iridescence",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{iridescenceFactor:0,iridescenceTexture:null,iridescenceTextureInfo:new ae(this.graph,"iridescenceTextureInfo"),iridescenceIOR:1.3,iridescenceThicknessMinimum:100,iridescenceThicknessMaximum:400,iridescenceThicknessTexture:null,iridescenceThicknessTextureInfo:new ae(this.graph,"iridescenceThicknessTextureInfo")})}getIridescenceFactor(){return this.get("iridescenceFactor")}setIridescenceFactor(t){return this.set("iridescenceFactor",t)}getIridescenceTexture(){return this.getRef("iridescenceTexture")}getIridescenceTextureInfo(){return this.getRef("iridescenceTexture")?this.getRef("iridescenceTextureInfo"):null}setIridescenceTexture(t){return this.setRef("iridescenceTexture",t,{channels:Nu})}getIridescenceIOR(){return this.get("iridescenceIOR")}setIridescenceIOR(t){return this.set("iridescenceIOR",t)}getIridescenceThicknessMinimum(){return this.get("iridescenceThicknessMinimum")}setIridescenceThicknessMinimum(t){return this.set("iridescenceThicknessMinimum",t)}getIridescenceThicknessMaximum(){return this.get("iridescenceThicknessMaximum")}setIridescenceThicknessMaximum(t){return this.set("iridescenceThicknessMaximum",t)}getIridescenceThicknessTexture(){return this.getRef("iridescenceThicknessTexture")}getIridescenceThicknessTextureInfo(){return this.getRef("iridescenceThicknessTexture")?this.getRef("iridescenceThicknessTextureInfo"):null}setIridescenceThicknessTexture(t){return this.setRef("iridescenceThicknessTexture",t,{channels:Fu})}},Bu=class extends Z{static EXTENSION_NAME=mt;extensionName=mt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createIridescence(){return new ju(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_iridescence){let i=this.createIridescence();t.materials[n].setExtension(mt,i);let o=r.extensions[mt];if(o.extras&&i.setExtras(o.extras),o.iridescenceFactor!==void 0&&i.setIridescenceFactor(o.iridescenceFactor),o.iridescenceIor!==void 0&&i.setIridescenceIOR(o.iridescenceIor),o.iridescenceThicknessMinimum!==void 0&&i.setIridescenceThicknessMinimum(o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&i.setIridescenceThicknessMaximum(o.iridescenceThicknessMaximum),o.iridescenceTexture!==void 0){let c=o.iridescenceTexture,d=t.textures[s[c.index].source];i.setIridescenceTexture(d),t.setTextureInfo(i.getIridescenceTextureInfo(),c)}if(o.iridescenceThicknessTexture!==void 0){let c=o.iridescenceThicknessTexture,d=t.textures[s[c.index].source];i.setIridescenceThicknessTexture(d),t.setTextureInfo(i.getIridescenceThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(mt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[mt]=i,s.getIridescenceFactor()>0&&(i.iridescenceFactor=s.getIridescenceFactor()),s.getIridescenceIOR()!==1.3&&(i.iridescenceIor=s.getIridescenceIOR()),s.getIridescenceThicknessMinimum()!==100&&(i.iridescenceThicknessMinimum=s.getIridescenceThicknessMinimum()),s.getIridescenceThicknessMaximum()!==400&&(i.iridescenceThicknessMaximum=s.getIridescenceThicknessMaximum()),s.getIridescenceTexture()){let o=s.getIridescenceTexture(),c=s.getIridescenceTextureInfo();i.iridescenceTexture=t.createTextureInfoDef(o,c)}if(s.getIridescenceThicknessTexture()){let o=s.getIridescenceThicknessTexture(),c=s.getIridescenceThicknessTextureInfo();i.iridescenceThicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Zn,G:ei,B:ti,A:ai}=Ue,Cu=class extends H{static EXTENSION_NAME=yt;init(){this.extensionName=yt,this.propertyType="PBRSpecularGlossiness",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseFactor:[1,1,1,1],diffuseTexture:null,diffuseTextureInfo:new ae(this.graph,"diffuseTextureInfo"),specularFactor:[1,1,1],glossinessFactor:1,specularGlossinessTexture:null,specularGlossinessTextureInfo:new ae(this.graph,"specularGlossinessTextureInfo")})}getDiffuseFactor(){return this.get("diffuseFactor")}setDiffuseFactor(t){return this.set("diffuseFactor",t)}getDiffuseTexture(){return this.getRef("diffuseTexture")}getDiffuseTextureInfo(){return this.getRef("diffuseTexture")?this.getRef("diffuseTextureInfo"):null}setDiffuseTexture(t){return this.setRef("diffuseTexture",t,{channels:Zn|ei|ti|ai,isColor:!0})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getGlossinessFactor(){return this.get("glossinessFactor")}setGlossinessFactor(t){return this.set("glossinessFactor",t)}getSpecularGlossinessTexture(){return this.getRef("specularGlossinessTexture")}getSpecularGlossinessTextureInfo(){return this.getRef("specularGlossinessTexture")?this.getRef("specularGlossinessTextureInfo"):null}setSpecularGlossinessTexture(t){return this.setRef("specularGlossinessTexture",t,{channels:Zn|ei|ti|ai})}},Ou=class extends Z{static EXTENSION_NAME=yt;extensionName=yt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createPBRSpecularGlossiness(){return new Cu(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_pbrSpecularGlossiness){let i=this.createPBRSpecularGlossiness();t.materials[n].setExtension(yt,i);let o=r.extensions[yt];if(o.extras&&i.setExtras(o.extras),o.diffuseFactor!==void 0&&i.setDiffuseFactor(o.diffuseFactor),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.glossinessFactor!==void 0&&i.setGlossinessFactor(o.glossinessFactor),o.diffuseTexture!==void 0){let c=o.diffuseTexture,d=t.textures[s[c.index].source];i.setDiffuseTexture(d),t.setTextureInfo(i.getDiffuseTextureInfo(),c)}if(o.specularGlossinessTexture!==void 0){let c=o.specularGlossinessTexture,d=t.textures[s[c.index].source];i.setSpecularGlossinessTexture(d),t.setTextureInfo(i.getSpecularGlossinessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(yt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[yt]=i,i.diffuseFactor=s.getDiffuseFactor(),i.specularFactor=s.getSpecularFactor(),i.glossinessFactor=s.getGlossinessFactor(),s.getDiffuseTexture()){let o=s.getDiffuseTexture(),c=s.getDiffuseTextureInfo();i.diffuseTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularGlossinessTexture()){let o=s.getSpecularGlossinessTexture(),c=s.getSpecularGlossinessTextureInfo();i.specularGlossinessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Pu,G:Du,B:Uu,A:Lu}=Ue,Ku=class extends H{static EXTENSION_NAME=xt;init(){this.extensionName=xt,this.propertyType="Sheen",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{sheenColorFactor:[0,0,0],sheenColorTexture:null,sheenColorTextureInfo:new ae(this.graph,"sheenColorTextureInfo"),sheenRoughnessFactor:0,sheenRoughnessTexture:null,sheenRoughnessTextureInfo:new ae(this.graph,"sheenRoughnessTextureInfo")})}getSheenColorFactor(){return this.get("sheenColorFactor")}setSheenColorFactor(t){return this.set("sheenColorFactor",t)}getSheenColorTexture(){return this.getRef("sheenColorTexture")}getSheenColorTextureInfo(){return this.getRef("sheenColorTexture")?this.getRef("sheenColorTextureInfo"):null}setSheenColorTexture(t){return this.setRef("sheenColorTexture",t,{channels:Pu|Du|Uu,isColor:!0})}getSheenRoughnessFactor(){return this.get("sheenRoughnessFactor")}setSheenRoughnessFactor(t){return this.set("sheenRoughnessFactor",t)}getSheenRoughnessTexture(){return this.getRef("sheenRoughnessTexture")}getSheenRoughnessTextureInfo(){return this.getRef("sheenRoughnessTexture")?this.getRef("sheenRoughnessTextureInfo"):null}setSheenRoughnessTexture(t){return this.setRef("sheenRoughnessTexture",t,{channels:Lu})}},Gu=class extends Z{static EXTENSION_NAME=xt;extensionName=xt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createSheen(){return new Ku(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_sheen){let i=this.createSheen();t.materials[n].setExtension(xt,i);let o=r.extensions[xt];if(o.extras&&i.setExtras(o.extras),o.sheenColorFactor!==void 0&&i.setSheenColorFactor(o.sheenColorFactor),o.sheenRoughnessFactor!==void 0&&i.setSheenRoughnessFactor(o.sheenRoughnessFactor),o.sheenColorTexture!==void 0){let c=o.sheenColorTexture,d=t.textures[s[c.index].source];i.setSheenColorTexture(d),t.setTextureInfo(i.getSheenColorTextureInfo(),c)}if(o.sheenRoughnessTexture!==void 0){let c=o.sheenRoughnessTexture,d=t.textures[s[c.index].source];i.setSheenRoughnessTexture(d),t.setTextureInfo(i.getSheenRoughnessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(xt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[xt]=i,i.sheenColorFactor=s.getSheenColorFactor(),i.sheenRoughnessFactor=s.getSheenRoughnessFactor(),s.getSheenColorTexture()){let o=s.getSheenColorTexture(),c=s.getSheenColorTextureInfo();i.sheenColorTexture=t.createTextureInfoDef(o,c)}if(s.getSheenRoughnessTexture()){let o=s.getSheenRoughnessTexture(),c=s.getSheenRoughnessTextureInfo();i.sheenRoughnessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:zu,G:Vu,B:Hu,A:qu}=Ue,Xu=class extends H{static EXTENSION_NAME=vt;init(){this.extensionName=vt,this.propertyType="Specular",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{specularFactor:1,specularTexture:null,specularTextureInfo:new ae(this.graph,"specularTextureInfo"),specularColorFactor:[1,1,1],specularColorTexture:null,specularColorTextureInfo:new ae(this.graph,"specularColorTextureInfo")})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getSpecularColorFactor(){return this.get("specularColorFactor")}setSpecularColorFactor(t){return this.set("specularColorFactor",t)}getSpecularTexture(){return this.getRef("specularTexture")}getSpecularTextureInfo(){return this.getRef("specularTexture")?this.getRef("specularTextureInfo"):null}setSpecularTexture(t){return this.setRef("specularTexture",t,{channels:qu})}getSpecularColorTexture(){return this.getRef("specularColorTexture")}getSpecularColorTextureInfo(){return this.getRef("specularColorTexture")?this.getRef("specularColorTextureInfo"):null}setSpecularColorTexture(t){return this.setRef("specularColorTexture",t,{channels:zu|Vu|Hu,isColor:!0})}},Wu=class extends Z{static EXTENSION_NAME=vt;extensionName=vt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createSpecular(){return new Xu(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_specular){let i=this.createSpecular();t.materials[n].setExtension(vt,i);let o=r.extensions[vt];if(o.extras&&i.setExtras(o.extras),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.specularColorFactor!==void 0&&i.setSpecularColorFactor(o.specularColorFactor),o.specularTexture!==void 0){let c=o.specularTexture,d=t.textures[s[c.index].source];i.setSpecularTexture(d),t.setTextureInfo(i.getSpecularTextureInfo(),c)}if(o.specularColorTexture!==void 0){let c=o.specularColorTexture,d=t.textures[s[c.index].source];i.setSpecularColorTexture(d),t.setTextureInfo(i.getSpecularColorTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(vt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[vt]=i,s.getSpecularFactor()!==1&&(i.specularFactor=s.getSpecularFactor()),se.eq(s.getSpecularColorFactor(),[1,1,1])||(i.specularColorFactor=s.getSpecularColorFactor()),s.getSpecularTexture()){let o=s.getSpecularTexture(),c=s.getSpecularTextureInfo();i.specularTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularColorTexture()){let o=s.getSpecularColorTexture(),c=s.getSpecularColorTextureInfo();i.specularColorTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Ju}=Ue,Yu=class extends H{static EXTENSION_NAME=wt;init(){this.extensionName=wt,this.propertyType="Transmission",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{transmissionFactor:0,transmissionTexture:null,transmissionTextureInfo:new ae(this.graph,"transmissionTextureInfo")})}getTransmissionFactor(){return this.get("transmissionFactor")}setTransmissionFactor(t){return this.set("transmissionFactor",t)}getTransmissionTexture(){return this.getRef("transmissionTexture")}getTransmissionTextureInfo(){return this.getRef("transmissionTexture")?this.getRef("transmissionTextureInfo"):null}setTransmissionTexture(t){return this.setRef("transmissionTexture",t,{channels:Ju})}},$u=class extends Z{static EXTENSION_NAME=wt;extensionName=wt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createTransmission(){return new Yu(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_transmission){let i=this.createTransmission();t.materials[n].setExtension(wt,i);let o=r.extensions[wt];if(o.extras&&i.setExtras(o.extras),o.transmissionFactor!==void 0&&i.setTransmissionFactor(o.transmissionFactor),o.transmissionTexture!==void 0){let c=o.transmissionTexture,d=t.textures[s[c.index].source];i.setTransmissionTexture(d),t.setTextureInfo(i.getTransmissionTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(wt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[wt]=i,i.transmissionFactor=s.getTransmissionFactor(),s.getTransmissionTexture()){let o=s.getTransmissionTexture(),c=s.getTransmissionTextureInfo();i.transmissionTexture=t.createTextureInfoDef(o,c)}}}),this}},Qu=class extends H{static EXTENSION_NAME=Jt;init(){this.extensionName=Jt,this.propertyType="Unlit",this.parentTypes=[N.MATERIAL]}},Zu=class extends Z{static EXTENSION_NAME=Jt;extensionName=Jt;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createUnlit(){return new Qu(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{e.extensions&&e.extensions.KHR_materials_unlit&&t.materials[a].setExtension(Jt,this.createUnlit())}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{if(a.getExtension("KHR_materials_unlit")){let s=t.materialIndexMap.get(a),r=e.json.materials[s];r.extensions=r.extensions||{},r.extensions[Jt]={}}}),this}},ef=class extends H{static EXTENSION_NAME=Ae;init(){this.extensionName=Ae,this.propertyType="Mapping",this.parentTypes=["MappingList"]}getDefaults(){return Object.assign(super.getDefaults(),{material:null,variants:new te})}getMaterial(){return this.getRef("material")}setMaterial(t){return this.setRef("material",t)}addVariant(t){return this.addRef("variants",t)}removeVariant(t){return this.removeRef("variants",t)}listVariants(){return this.listRefs("variants")}},tf=class extends H{static EXTENSION_NAME=Ae;init(){this.extensionName=Ae,this.propertyType="MappingList",this.parentTypes=[N.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{mappings:new te})}addMapping(t){return this.addRef("mappings",t)}removeMapping(t){return this.removeRef("mappings",t)}listMappings(){return this.listRefs("mappings")}},si=class extends H{static EXTENSION_NAME=Ae;init(){this.extensionName=Ae,this.propertyType="Variant",this.parentTypes=["MappingList"]}},af=class extends Z{extensionName=Ae;static EXTENSION_NAME=Ae;createMappingList(){return new tf(this.document.getGraph())}createVariant(t=""){return new si(this.document.getGraph(),t)}createMapping(){return new ef(this.document.getGraph())}listVariants(){return Array.from(this.properties).filter(t=>t instanceof si)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_materials_variants)return this;let a=(e.json.extensions.KHR_materials_variants.variants||[]).map(s=>this.createVariant().setName(s.name||""));return(e.json.meshes||[]).forEach((s,r)=>{let n=t.meshes[r];(s.primitives||[]).forEach((i,o)=>{if(!i.extensions||!i.extensions.KHR_materials_variants)return;let c=this.createMappingList(),d=i.extensions[Ae];for(let u of d.mappings){let b=this.createMapping();u.material!==void 0&&b.setMaterial(t.materials[u.material]);for(let w of u.variants||[])b.addVariant(a[w]);c.addMapping(b)}n.listPrimitives()[o].setExtension(Ae,c)})}),this}write(t){let e=t.jsonDoc,a=this.listVariants();if(!a.length)return this;let s=[],r=new Map;for(let n of a)r.set(n,s.length),s.push(t.createPropertyDef(n));for(let n of this.document.getRoot().listMeshes()){let i=t.meshIndexMap.get(n);n.listPrimitives().forEach((o,c)=>{let d=o.getExtension(Ae);if(!d)return;let u=t.jsonDoc.json.meshes[i].primitives[c],b=d.listMappings().map(w=>{let v=t.createPropertyDef(w),h=w.getMaterial();return h&&(v.material=t.materialIndexMap.get(h)),v.variants=w.listVariants().map(l=>r.get(l)),v});u.extensions=u.extensions||{},u.extensions[Ae]={mappings:b}})}return e.json.extensions=e.json.extensions||{},e.json.extensions[Ae]={variants:s},this}},{G:sf}=Ue,rf=class extends H{static EXTENSION_NAME=Et;init(){this.extensionName=Et,this.propertyType="Volume",this.parentTypes=[N.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{thicknessFactor:0,thicknessTexture:null,thicknessTextureInfo:new ae(this.graph,"thicknessTexture"),attenuationDistance:1/0,attenuationColor:[1,1,1]})}getThicknessFactor(){return this.get("thicknessFactor")}setThicknessFactor(t){return this.set("thicknessFactor",t)}getThicknessTexture(){return this.getRef("thicknessTexture")}getThicknessTextureInfo(){return this.getRef("thicknessTexture")?this.getRef("thicknessTextureInfo"):null}setThicknessTexture(t){return this.setRef("thicknessTexture",t,{channels:sf})}getAttenuationDistance(){return this.get("attenuationDistance")}setAttenuationDistance(t){return this.set("attenuationDistance",t)}getAttenuationColor(){return this.get("attenuationColor")}setAttenuationColor(t){return this.set("attenuationColor",t)}},nf=class extends Z{static EXTENSION_NAME=Et;extensionName=Et;prereadTypes=[N.MESH];prewriteTypes=[N.MESH];createVolume(){return new rf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_volume){let i=this.createVolume();t.materials[n].setExtension(Et,i);let o=r.extensions[Et];if(o.extras&&i.setExtras(o.extras),o.thicknessFactor!==void 0&&i.setThicknessFactor(o.thicknessFactor),o.attenuationDistance!==void 0&&i.setAttenuationDistance(o.attenuationDistance),o.attenuationColor!==void 0&&i.setAttenuationColor(o.attenuationColor),o.thicknessTexture!==void 0){let c=o.thicknessTexture,d=t.textures[s[c.index].source];i.setThicknessTexture(d),t.setTextureInfo(i.getThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Et);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Et]=i,s.getThicknessFactor()>0&&(i.thicknessFactor=s.getThicknessFactor()),Number.isFinite(s.getAttenuationDistance())&&(i.attenuationDistance=s.getAttenuationDistance()),se.eq(s.getAttenuationColor(),[1,1,1])||(i.attenuationColor=s.getAttenuationColor()),s.getThicknessTexture()){let o=s.getThicknessTexture(),c=s.getThicknessTextureInfo();i.thicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},of=class extends Z{extensionName=Ln;static EXTENSION_NAME=Ln;read(t){return this}write(t){return this}},dr=class extends Z{extensionName=Kn;static EXTENSION_NAME=Kn;read(t){return this}write(t){return this}},cf=class extends H{static EXTENSION_NAME=Tt;init(){this.extensionName=Tt,this.propertyType="Visibility",this.parentTypes=[N.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{visible:!0})}getVisible(){return this.get("visible")}setVisible(t){return this.set("visible",t)}},lf=class extends Z{static EXTENSION_NAME=Tt;extensionName=Tt;createVisibility(){return new cf(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_node_visibility){let s=this.createVisibility();t.nodes[a].setExtension(Tt,s);let r=e.extensions[Tt];r.visible!==void 0&&s.setVisible(r.visible)}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listNodes()){let s=a.getExtension(Tt);if(!s)continue;let r=t.nodeIndexMap.get(a),n=e.json.nodes[r];n.extensions=n.extensions||{},n.extensions[Tt]={visible:s.getVisible()}}return this}};function df(t){return t.vkFormat>0&&t.vkFormat<=123}function ri(t){let e=t.vkFormat===1000066e3&&t.dataFormatDescriptor[0].colorModel===167;return t.vkFormat===0||e}var uf=class{match(t){return t[0]===171&&t[1]===75&&t[2]===84&&t[3]===88&&t[4]===32&&t[5]===50&&t[6]===48&&t[7]===187&&t[8]===13&&t[9]===10&&t[10]===26&&t[11]===10}getSize(t){let e=es(t);return[e.pixelWidth,e.pixelHeight]}getChannels(t){let e=es(t),a=e.dataFormatDescriptor[0];if(df(e))return a.samples.length;if(ri(e))switch(a.colorModel){case 163:return a.samples.length===2&&(a.samples[1].channelType&15)===15?4:3;case 166:return(a.samples[0].channelType&15)===3?4:3;default:throw new Error(`Unexpected KTX2 colorModel, "${a.colorModel}".`)}throw new Error(`Unexpected KTX2 vkFormat, "${e.vkFormat}".`)}getVRAMByteLength(t){let e=es(t),a=0;if(ri(e)){let s=this.getChannels(t)>3;for(let r=0;r<e.levels.length;r++){let n=e.levels[r];if(n.uncompressedByteLength)a+=n.uncompressedByteLength;else{let i=Math.max(1,Math.floor(e.pixelWidth/Math.pow(2,r))),o=Math.max(1,Math.floor(e.pixelHeight/Math.pow(2,r))),c=s?16:8;a+=i/4*(o/4)*c}}}else for(let s of e.levels)e.supercompressionScheme===0?a+=s.levelData.byteLength:a+=s.uncompressedByteLength;return a}},ff=class extends Z{static EXTENSION_NAME=ss;extensionName=ss;prereadTypes=[N.TEXTURE];static register(){qe.registerFormat("image/ktx2",new uf)}preread(t){return t.jsonDoc.json.textures&&t.jsonDoc.json.textures.forEach(e=>{e.extensions&&e.extensions.KHR_texture_basisu&&(e.source=e.extensions[ss].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/ktx2"){let s=t.imageIndexMap.get(a);e.json.textures.forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[ss]={source:r.source},delete r.source)})}}),this}},hf=class extends H{static EXTENSION_NAME=kt;init(){this.extensionName=kt,this.propertyType="Transform",this.parentTypes=[N.TEXTURE_INFO]}getDefaults(){return Object.assign(super.getDefaults(),{offset:[0,0],rotation:0,scale:[1,1],texCoord:null})}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getRotation(){return this.get("rotation")}setRotation(t){return this.set("rotation",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getTexCoord(){return this.get("texCoord")}setTexCoord(t){return this.set("texCoord",t)}},bf=class extends Z{extensionName=kt;static EXTENSION_NAME=kt;createTransform(){return new hf(this.document.getGraph())}read(t){for(let[e,a]of Array.from(t.textureInfos.entries())){if(!a.extensions||!a.extensions.KHR_texture_transform)continue;let s=this.createTransform(),r=a.extensions[kt];r.offset!==void 0&&s.setOffset(r.offset),r.rotation!==void 0&&s.setRotation(r.rotation),r.scale!==void 0&&s.setScale(r.scale),r.texCoord!==void 0&&s.setTexCoord(r.texCoord),e.setExtension(kt,s)}return this}write(t){let e=Array.from(t.textureInfoDefMap.entries());for(let[a,s]of e){let r=a.getExtension(kt);if(!r)continue;s.extensions=s.extensions||{};let n={},i=se.eq;i(r.getOffset(),[0,0])||(n.offset=r.getOffset()),r.getRotation()!==0&&(n.rotation=r.getRotation()),i(r.getScale(),[1,1])||(n.scale=r.getScale()),r.getTexCoord()!=null&&(n.texCoord=r.getTexCoord()),s.extensions[kt]=n}return this}},pf=[N.ROOT,N.SCENE,N.NODE,N.MESH,N.MATERIAL,N.TEXTURE,N.ANIMATION],gf=class extends H{static EXTENSION_NAME=Le;init(){this.extensionName=Le,this.propertyType="Packet",this.parentTypes=pf}getDefaults(){return Object.assign(super.getDefaults(),{context:{},properties:{}})}getContext(){return this.get("context")}setContext(t){return this.set("context",{...t})}listProperties(){return Object.keys(this.get("properties"))}getProperty(t){let e=this.get("properties");return t in e?e[t]:null}setProperty(t,e){this._assertContext(t);let a={...this.get("properties")};return e?a[t]=e:delete a[t],this.set("properties",a)}toJSONLD(){return{"@context":rr(this.get("context")),...rr(this.get("properties"))}}fromJSONLD(t){t=rr(t);let e=t["@context"];return e&&this.set("context",e),delete t["@context"],this.set("properties",t)}_assertContext(t){if(!(t.split(":")[0]in this.get("context")))throw new Error(`${Le}: Missing context for term, "${t}".`)}};function rr(t){return JSON.parse(JSON.stringify(t))}var mf=class extends Z{extensionName=Le;static EXTENSION_NAME=Le;createPacket(){return new gf(this.document.getGraph())}listPackets(){return Array.from(this.properties)}read(t){let e=t.jsonDoc.json.extensions?.[Le];if(!e||!e.packets)return this;let a=t.jsonDoc.json,s=this.document.getRoot(),r=e.packets.map(o=>this.createPacket().fromJSONLD(o)),n=[[a.asset],a.scenes,a.nodes,a.meshes,a.materials,a.images,a.animations],i=[[s],s.listScenes(),s.listNodes(),s.listMeshes(),s.listMaterials(),s.listTextures(),s.listAnimations()];for(let o=0;o<n.length;o++){let c=n[o]||[];for(let d=0;d<c.length;d++){let u=c[d];if(u.extensions&&u.extensions.KHR_xmp_json_ld){let b=u.extensions[Le];i[o][d].setExtension(Le,r[b.packet])}}}return this}write(t){let{json:e}=t.jsonDoc,a=[];for(let s of this.properties){a.push(s.toJSONLD());for(let r of s.listParents()){let n;switch(r.propertyType){case N.ROOT:n=e.asset;break;case N.SCENE:n=e.scenes[t.sceneIndexMap.get(r)];break;case N.NODE:n=e.nodes[t.nodeIndexMap.get(r)];break;case N.MESH:n=e.meshes[t.meshIndexMap.get(r)];break;case N.MATERIAL:n=e.materials[t.materialIndexMap.get(r)];break;case N.TEXTURE:n=e.images[t.imageIndexMap.get(r)];break;case N.ANIMATION:n=e.animations[t.animationIndexMap.get(r)];break;default:n=null,this.document.getLogger().warn(`[${Le}]: Unsupported parent property, "${r.propertyType}"`);break}n&&(n.extensions=n.extensions||{},n.extensions[Le]={packet:a.length-1})}}return a.length>0&&(e.extensions=e.extensions||{},e.extensions[Le]={packets:a}),this}},yf=[$d,Qd,cu,du,pu,yu,ku,Iu,Su,_u,Bu,Ou,Wu,Gu,$u,Zu,af,nf,of,dr,lf,ff,bf,mf],Fg=[Yl,cr,lr,wd,Wd,Yd,...yf];var $m=(function(){var t="b9H79Tebbbe9ok9Geueu9Geub9Gbb9Gruuuuuuueu9Gvuuuuueu9Gduueu9Gluuuueu9Gvuuuuub9Gouuuuuub9Gluuuub9Giuuueui8AYdilveoveovrrwrrDDoDrbqqbelve9Weiiviebeoweuec;G:Qdkr:nlAo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9mW4W2be8A9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWVbd8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9c9V919U9KbiE9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949wWV79P9V9UblY9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWVbv8E9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWV9c9V919U9Kbo8A9TW79O9V9Wt9FW9U9J9V9KW69U9KW949wWV79P9V9UbrE9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JWbwa9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JW9c9V919U9KbDL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9p9JtbqK9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9r919HtbkL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWVT949WbxE9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OWbsa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OW9ttV9P9Wbza9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9WbHK9TW79O9V9Wt9F79W9Ht9P9H29t9VVt9sW9T9H9WbOl79IV9RbCDwebcekdKLqN9OYdbk:Bhdhud9:8Jjjjjbc;qw9Rgr8KjjjjbcbhwdnaeTmbabcbyd;C:kjjbaoaocb9iEgDc:GeV86bbarc;adfcbcjdz:wjjjb8AdnaiTmbarc;adfadalz:vjjjb8Akarc;abfalfcbcbcjdal9RalcFe0Ez:wjjjb8Aarc;abfarc;adfalz:vjjjb8AarcUf9cb83ibarc8Wf9cb83ibarcyf9cb83ibarcaf9cb83ibarcKf9cb83ibarczf9cb83ibar9cb83iwar9cb83ibcj;abal9Uc;WFbGcjdalca0Ehqdnaicd6mbavcd9imbaDTmbadcefhkaqci2gxal2hmarc;alfclfhParc;qlfceVhsarc;qofclVhzarc;qofcKfhHarc;qofczfhOcbhAincdhCcbhodnavci6mbaH9cb83ibaO9cb83ibar9cb83i;yoar9cb83i;qoadaAfgoybbhXcbhQincbhwcbhLdninaoalfhKaoybbgYaX7aLVhLawcP0meaKhoaYhXawcefgwaQfai6mbkkcbhXarc;qofhwincwh8AcwhEdnaLaX93gocFeGg3cs0mbclhEa3ci0mba3cb9hcethEkdnaocw4cFeGg3cs0mbclh8Aa3ci0mba3cb9hceth8Aka8AaEfh3awydbh5cwh8AcwhEdnaocz4cFeGg8Ecs0mbclhEa8Eci0mba8Ecb9hcethEka3a5fh3dnaocFFFFb0mbclh8AaocFFF8F0mbaocFFFr0ceth8Akawa3aEfa8AfBdbawclfhwaXcefgXcw9hmbkaKhoaYhXaQczfgQai6mbkcbhocehwazhLinawaoaLydbarc;qofaocdtfydb6EhoaLclfhLawcefgwcw9hmbkcihCkcbh3arc;qlfcbcjdz:wjjjb8Aarc;alfcwfcbBdbar9cb83i;alaoclth8Fadhaaqhhakh5inarc;qlfadcba3cufgoaoa30Eal2falz:vjjjb8Aaiahaiah6Ehgdnaqaia39Ra3aqfai6EgYcsfc9WGgoaY9nmbarc;qofaYfcbaoaY9Rz:wjjjb8Akada3al2fh8Jcbh8Kina8Ka8FVcl4hQarc;alfa8Kcdtfh8LaAh8Mcbh8Nina8NaAfhwdndndndndndna8KPldebidkasa8Mc98GgLfhoa5aLfh8Aarc;qlfawc98GgLfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkaYTmla8Ncith8Ea8JaLfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aQ93a8E486bba8Aalfh8AaEalfhEaLhXaKcefgKaY9hmbxlkkaYTmia8Mc9:Ghoa8NcitcwGhEarc;qlfawceVfRbbcwtarc;qlfawc9:GfRbbVhLarc;qofhwaghXinawa5aofRbbcwtaaaofRbbVg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbaoalfhoawcefhwa8AhLa3aXcufgX9hmbxikkaYTmda8Jawfhoarc;qlfawfRbbhLarc;qofhwaghXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLa3aXcufgX9hmbxdkkaYTmeka8LydbhEcbhKarc;qofhoincdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egwa8Aawa8A6Egwczawcz6EaEfhEaoczfhoaKczfgKaY6mbka8LaEBdbka8Mcefh8Ma8Ncefg8Ncl9hmbka8Kcefg8KaC9hmbkaaamfhaahaxfhha5amfh5a3axfg3ai6mbkcbhocehwaPhLinawaoaLydbarc;alfaocdtfydb6EhoaLclfhLawcefgXhwaCaX9hmbkaraAcd4fa8FcdVaoaocdSE86bbaAclfgAal6mbkkabaefh8Kabcefhoalcd4gecbaDEhkadcefhOarc;abfceVhHcbhmdndninaiam9nmearc;qofcbcjdz:wjjjb8Aa8Kao9Rak6mdadamal2gwfhxcbh8JaOawfhzaocbakz:wjjjbghakfh5aqaiam9Ramaqfai6Egscsfgocl4cifcd4hCaoc9WGg8LThPindndndndndndndndndndnaDTmbara8Jcd4fRbbgLciGPlbedlbkasTmdaxa8Jfhoarc;abfa8JfRbbhLarc;qofhwashXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLaXcufgXmbxikkasTmia8JcitcwGhEarc;abfa8JceVfRbbcwtarc;abfa8Jc9:GgofRbbVhLaxaofhoarc;qofhwashXinawao8Vbbg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbawcefhwaoalfhoa8AhLaXcufgXmbxdkkaHa8Jc98GgEfhoazaEfh8Aarc;abfaEfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkasTmbaLcl4hYa8JcitcKGh3axaEfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aY93a3486bba8Aalfh8AaEalfhEaLhXaKcefgKas9hmbkkaDmbcbhoxlka8LTmbcbhodninarc;qofaofgwcwf8Pibaw8Pib:e9qTmeaoczfgoa8L9pmdxbkkdnavmbcehoxikcbhEaChKaChYinarc;qofaEfgocwf8Pibhyao8Pibh8PcdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egoa8Aaoa8A6Egoczaocz6EaYfhYaocucbaya8P:e9cb9sEgwaoaw6EaKfhKaEczfgEa8L9pmdxbkkaha8Jcd4fgoaoRbbcda8JcetcoGtV86bbxikdnaKas6mbaYas6mbaha8Jcd4fgoaoRbbcia8JcetcoGtV86bba8Ka59Ras6mra5arc;qofasz:vjjjbasfh5xikaKaY9phokaha8Jcd4fgwawRbbaoa8JcetcoGtV86bbka8Ka59RaC6mla5cbaCz:wjjjbgAaCfhYdndna8LmbaPhoxekdna8KaY9RcK9pmbaPhoxekaocdtc:q1jjbfcj1jjbaDEg5ydxggcetc;:FFFeGh8Fcuh3cuagtcu7cFeGhacbh8Marc;qofhLinarc;qofa8MfhQczhEdndndnagPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhExekcbhoa8FhEinaEaaaLaofRbb9nfhEaocefgocz9hmbkkcih8Ecbh8Ainczhwdndndna5a8AcdtfydbgKPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhwxekaKcetc;:FFFeGhwcuaKtcu7cFeGhXcbhoinawaXaLaofRbb9nfhwaocefgocz9hmbkkdndnawaE6mbaKa39hmeawaE9hmea5a8EcdtfydbcwSmeka8Ah8EawhEka8Acefg8Aci9hmbkaAa8Mco4fgoaoRbba8Ea8Mci4coGtV86bbdndndna5a8Ecdtfydbg3PDdbbbbbbbebkdncwa39Tg8ETmbcua3tcu7hwdndna3ceSmbcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXa3tVhXaocefhoa8Acufg8AmbkaYaX86bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbxdkkcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXcetVhXaocefhoa8Acufg8AmbkaYaX:T9cFe:d9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:9ca188bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbkkcbhoinaYaLaofRbbgX86bbaYaXawcFeG9pfhYaocefgocz9hmbxikkdna3ceSmbinaYcb86bbaYcefhYxbkkinaYcb86bbaYcefhYxbkkaYaQ8Pbb83bbaYcwfaQcwf8Pbb83bbaYczfhYka8Mczfg8Ma8L9pgomeaLczfhLa8KaY9RcK9pmbkkaoTmlaYh5aYTmlka8Jcefg8Jal9hmbkarc;abfaxascufal2falz:vjjjb8Aasamfhma5hoa5mbkcbhwxdkdna8Kao9RakalfgwcKcaaDEgLawaL0EgX9pmbcbhwxdkdnawaL9pmbaocbaXaw9Rgwz:wjjjbawfhokaoarc;adfalz:vjjjbalfhodnaDTmbaoaraez:vjjjbaefhokaoab9Rhwxekcbhwkarc;qwf8Kjjjjbawk5babaeadaialcdcbyd;C:kjjbz:bjjjbk9reduaecd4gdaefgicaaica0Eabcj;abae9Uc;WFbGcjdaeca0Egifcufai9Uae2aiadfaicl4cifcd4f2fcefkmbcbabBd;C:kjjbk:Ese5u8Jjjjjbc;ae9Rgl8Kjjjjbcbhvdnaici9UgocHfae0mbabcbyd;m:kjjbgrc;GeV86bbalc;abfcFecjez:wjjjb8AalcUfgw9cu83ibalc8WfgD9cu83ibalcyfgq9cu83ibalcafgk9cu83ibalcKfgx9cu83ibalczfgm9cu83ibal9cu83iwal9cu83ibabaefc9WfhPabcefgsaofhednaiTmbcmcsarcb9kgzEhHcbhOcbhAcbhCcbhXcbhQindnaeaP9nmbcbhvxikaQcufhvadaCcdtfgLydbhKaLcwfydbhYaLclfydbh8AcbhEdndndninalc;abfavcsGcitfgoydlh3dndndnaoydbgoaK9hmba3a8ASmekdnaoa8A9hmba3aY9hmbaEcefhExekaoaY9hmea3aK9hmeaEcdfhEkaEc870mdaXcufhvaLaEciGcx2goc;i1jjbfydbcdtfydbh3aLaoc;e1jjbfydbcdtfydbh8AaLaoc;a1jjbfydbcdtfydbhKcbhodnindnalavcsGcdtfydba39hmbaohYxdkcuhYavcufhvaocefgocz9hmbkkaOa3aOSgvaYce9iaYaH9oVgoGfhOdndndncbcsavEaYaoEgvcs9hmbarce9imba3a3aAa3cefaASgvEgAcefSmecmcsavEhvkasavaEcdtc;WeGV86bbavcs9hmea3aA9Rgvcetavc8F917hvinaeavcFb0crtavcFbGV86bbaecefheavcje6hoavcr4hvaoTmbka3hAxvkcPhvasaEcdtcPV86bba3hAkavTmiavaH9omicdhocehEaQhYxlkavcufhvaEclfgEc;ab9hmbkkdnaLceaYaOSceta8AaOSEcx2gvc;a1jjbfydbcdtfydbgKTaLavc;e1jjbfydbcdtfydbg8AceSGaLavc;i1jjbfydbcdtfydbg3cdSGaOcb9hGazGg5ce9hmbaw9cu83ibaD9cu83ibaq9cu83ibak9cu83ibax9cu83ibam9cu83ibal9cu83iwal9cu83ibcbhOkcbhEaXcufgvhodnindnalaocsGcdtfydba8A9hmbaEhYxdkcuhYaocufhoaEcefgEcz9hmbkkcbhodnindnalavcsGcdtfydba39hmbaohExdkcuhEavcufhvaocefgocz9hmbkkaOaKaOSg8EfhLdndnaYcm0mbaYcefhYxekcbcsa8AaLSgvEhYaLavfhLkdndnaEcm0mbaEcefhExekcbcsa3aLSgvEhEaLavfhLkc9:cua8EEh8FcbhvaEaYcltVgacFeGhodndndninavc:W1jjbfRbbaoSmeavcefgvcz9hmbxdkka5aKaO9havcm0VVmbasavc;WeV86bbxekasa8F86bbaeaa86bbaecefhekdna8EmbaKaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombkaKhAkdnaYcs9hmba8AaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka8AhAkdnaEcs9hmba3aA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka3hAkalaXcdtfaKBdbaXcefcsGhvdndnaYPzbeeeeeeeeeeeeeebekalavcdtfa8ABdbaXcdfcsGhvkdndnaEPzbeeeeeeeeeeeeeebekalavcdtfa3BdbavcefcsGhvkcihoalc;abfaQcitfgEaKBdlaEa8ABdbaQcefcsGhYcdhEavhXaLhOxekcdhoalaXcdtfa3BdbcehEaXcefcsGhXaQhYkalc;abfaYcitfgva8ABdlava3Bdbalc;abfaQaEfcsGcitfgva3BdlavaKBdbascefhsaQaofcsGhQaCcifgCai6mbkkdnaeaP9nmbcbhvxekcbhvinaeavfavc:W1jjbfRbb86bbavcefgvcz9hmbkaeab9Ravfhvkalc;aef8KjjjjbavkZeeucbhddninadcefgdc8F0meceadtae6mbkkadcrfcFeGcr9Uci2cdfabci9U2cHfkmbcbabBd;m:kjjbk:Adewu8Jjjjjbcz9Rhlcbhvdnaicvfae0mbcbhvabcbRb;m:kjjbc;qeV86bbal9cb83iwabcefhoabaefc98fhrdnaiTmbcbhwcbhDindnaoar6mbcbskadaDcdtfydbgqalcwfawaqav9Rgvavc8F91gv7av9Rc507gwcdtfgkydb9Rgvc8E91c9:Gavcdt7awVhvinaoavcFb0gecrtavcFbGV86bbavcr4hvaocefhoaembkakaqBdbaqhvaDcefgDai9hmbkkdnaoar9nmbcbskaocbBbbaoab9RclfhvkavkBeeucbhddninadcefgdc8F0meceadtae6mbkkadcwfcFeGcr9Uab2cvfk:bvli99dui99ludnaeTmbcuadcetcuftcu7:Zhvdndncuaicuftcu7:ZgoJbbbZMgr:lJbbb9p9DTmbar:Ohwxekcjjjj94hwkcbhicbhDinalclfIdbgrJbbbbJbbjZalIdbgq:lar:lMalcwfIdbgk:lMgr:varJbbbb9BEgrNhxaqarNhrdndnakJbbbb9GTmbaxhqxekJbbjZar:l:tgqaq:maxJbbbb9GEhqJbbjZax:l:tgxax:marJbbbb9GEhrkdndnalcxfIdbgxJbbj:;axJbbj:;9GEgkJbbjZakJbbjZ9FEavNJbbbZJbbb:;axJbbbb9GEMgx:lJbbb9p9DTmbax:Ohmxekcjjjj94hmkdndnaqJbbj:;aqJbbj:;9GEgxJbbjZaxJbbjZ9FEaoNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:OhPxekcjjjj94hPkdndnarJbbj:;arJbbj:;9GEgqJbbjZaqJbbjZ9FEaoNJbbbZJbbb:;arJbbbb9GEMgr:lJbbb9p9DTmbar:Ohsxekcjjjj94hskdndnadcl9hmbabaifgzas86bbazcifam86bbazcdfaw86bbazcefaP86bbxekabaDfgzas87ebazcofam87ebazclfaw87ebazcdfaP87ebkalczfhlaiclfhiaDcwfhDaecufgembkkk;hlld99eud99eudnaeTmbdndncuaicuftcu7:ZgvJbbbZMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikaic;8FiGhrinabcofcicdalclfIdb:lalIdb:l9EgialcwfIdb:lalaicdtfIdb:l9EEgialcxfIdb:lalaicdtfIdb:l9EEgiarV87ebdndnJbbj:;JbbjZalaicdtfIdbJbbbb9DEgoalaicd7cdtfIdbJ;Zl:1ZNNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabcdfaq87ebdndnalaicefciGcdtfIdbJ;Zl:1ZNaoNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabaq87ebdndnaoalaicufciGcdtfIdbJ;Zl:1ZNNgoJbbj:;aoJbbj:;9GEgwJbbjZawJbbjZ9FEavNJbbbZJbbb:;aoJbbbb9GEMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikabclfai87ebabcwfhbalczfhlaecufgembkkk;3viDue99eu8Jjjjjbcjd9Rgo8Kjjjjbadcd4hrdndndndnavcd9hmbadcl6meaohwarhDinawc:CuBdbawclfhwaDcufgDmbkaeTmiadcl6mdarcdthqalhkcbhxinaohwakhDarhminawawydbgPcbaDIdbgs:8cL4cFeGc:cufasJbbbb9BEgzaPaz9kEBdbaDclfhDawclfhwamcufgmmbkakaqfhkaxcefgxaeSmixbkkaeTmdxekaeTmekarcdthkavce9hhqadcl6hdcbhxindndndnaqmbadmdc:CuhDalhwarhminaDcbawIdbgs:8cL4cFeGc:cufasJbbbb9BEgPaDaP9kEhDawclfhwamcufgmmbxdkkc:CuhDdndnavPleddbdkadmdaohwalhmarhPinawcbamIdbgs:8cL4cFeGgzc;:bazc;:b0Ec:cufasJbbbb9BEBdbamclfhmawclfhwaPcufgPmbxdkkadmecbhwarhminaoawfcbalawfIdbgs:8cL4cFeGgPc8AaPc8A0Ec:cufasJbbbb9BEBdbawclfhwamcufgmmbkkadmbcbhwarhPinaDhmdnavceSmbaoawfydbhmkdndnalawfIdbgscjjj;8iamai9RcefgmcLt9R::NJbbbZJbbb:;asJbbbb9GEMgs:lJbbb9p9DTmbas:Ohzxekcjjjj94hzkabawfazcFFFrGamcKtVBdbawclfhwaPcufgPmbkkabakfhbalakfhlaxcefgxae9hmbkkaocjdf8Kjjjjbk;YqdXui998Jjjjjbc:qd9Rgv8Kjjjjbavc:Sefcbc;Kbz:wjjjb8AcbhodnadTmbcbhoaiTmbdndnabaeSmbaehrxekavcuadcdtgwadcFFFFi0Ecbyd;u:kjjbHjjjjbbgrBd:SeavceBd:mdaraeawz:vjjjb8Akavc:GefcwfcbBdbav9cb83i:Geavc:Gefaradaiavc:Sefz:ojjjbavyd:GehDadci9Ugqcbyd;u:kjjbHjjjjbbheavc:Sefavyd:mdgkcdtfaeBdbavakcefgwBd:mdaecbaqz:wjjjbhxavc:SefawcdtfcuaicdtaicFFFFi0Ecbyd;u:kjjbHjjjjbbgmBdbavakcdfgPBd:mdalc;ebfhsaDheamhwinawalIdbasaeydbgzcwazcw6EcdtfIdbMUdbaeclfheawclfhwaicufgimbkavc:SefaPcdtfcuaqcdtadcFFFF970Ecbyd;u:kjjbHjjjjbbgPBdbdnadci6mbarheaPhwaqhiinawamaeydbcdtfIdbamaeclfydbcdtfIdbMamaecwfydbcdtfIdbMUdbaecxfheawclfhwaicufgimbkkakcifhoalc;ebfhHavc;qbfhOavheavyd:KehAavyd:OehCcbhzcbhwcbhXcehQinaehLcihkarawci2gKcdtfgeydbhsaeclfydbhdabaXcx2fgicwfaecwfydbgYBdbaiclfadBdbaiasBdbaxawfce86bbaOaYBdwaOadBdlaOasBdbaPawcdtfcbBdbdnazTmbcihkaLhiinaOakcdtfaiydbgeBdbakaeaY9haeas9haead9hGGfhkaiclfhiazcufgzmbkkaXcefhXcbhzinaCaAarazaKfcdtfydbcdtgifydbcdtfgYheaDaifgdydbgshidnasTmbdninaeydbawSmeaeclfheaicufgiTmdxbkkaeaYascdtfc98fydbBdbadadydbcufBdbkazcefgzci9hmbkdndnakTmbcuhwJbbbbh8Acbhdavyd:KehYavyd:OehKindndnaDaOadcdtfydbcdtgzfydbgembadcefhdxekadcs0hiamazfgsIdbhEasalcbadcefgdaiEcdtfIdbaHaecwaecw6EcdtfIdbMg3Udba3aE:th3aecdthiaKaYazfydbcdtfheinaPaeydbgzcdtfgsa3asIdbMgEUdbaEa8Aa8AaE9DgsEh8AazawasEhwaeclfheaic98fgimbkkadak9hmbkawcu9hmekaQaq9pmdindnaxaQfRbbmbaQhwxdkaqaQcefgQ9hmbxikkakczakcz6EhzaOheaLhOawcu9hmbkkaocdtavc:Seffc98fhedninaoTmeaeydbcbyd;q:kjjbH:bjjjbbaec98fheaocufhoxbkkavc:qdf8Kjjjjbk;IlevucuaicdtgvaicFFFFi0Egocbyd;u:kjjbHjjjjbbhralalyd9GgwcdtfarBdbalawcefBd9GabarBdbaocbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdlcuadcdtadcFFFFi0Ecbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdwabydbcbavz:wjjjb8Aadci9UhDdnadTmbabydbhoaehladhrinaoalydbcdtfgvavydbcefBdbalclfhlarcufgrmbkkdnaiTmbabydbhlabydlhrcbhvaihoinaravBdbarclfhralydbavfhvalclfhlaocufgombkkdnadci6mbabydlhrabydwhvcbhlinaecwfydbhoaeclfydbhdaraeydbcdtfgwawydbgwcefBdbavawcdtfalBdbaradcdtfgdadydbgdcefBdbavadcdtfalBdbaraocdtfgoaoydbgocefBdbavaocdtfalBdbaecxfheaDalcefgl9hmbkkdnaiTmbabydlheabydbhlinaeaeydbalydb9RBdbalclfhlaeclfheaicufgimbkkkQbabaeadaic;K1jjbz:njjjbkQbabaeadaic;m:jjjbz:njjjbk9DeeuabcFeaicdtz:wjjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk:Vvioud9:du8Jjjjjbc;Wa9Rgl8Kjjjjbcbhvalcxfcbc;Kbz:wjjjb8AalcuadcitgoadcFFFFe0Ecbyd;u:kjjbHjjjjbbgrBdxalceBd2araeadaicez:tjjjbalcuaoadcjjjjoGEcbyd;u:kjjbHjjjjbbgwBdzadcdthednadTmbabhiinaiavBdbaiclfhiadavcefgv9hmbkkawaefhDalabBdwalawBdl9cbhqindnadTmbaq9cq9:hkarhvaDhiadheinaiav8Pibak1:NcFrG87ebavcwfhvaicdfhiaecufgembkkalclfaq:NceGcdtfydbhxalclfaq9ce98gq:NceGcdtfydbhmalc;Wbfcbcjaz:wjjjb8AaDhvadhidnadTmbinalc;Wbfav8VebcdtfgeaeydbcefBdbavcdfhvaicufgimbkkcbhvcbhiinalc;WbfavfgeydbhoaeaiBdbaoaifhiavclfgvcja9hmbkadhvdndnadTmbinalc;WbfaDamydbgicetf8VebcdtfgeaeydbgecefBdbaxaecdtfaiBdbamclfhmavcufgvmbkaq9cv9smdcbhvinabawydbcdtfavBdbawclfhwadavcefgv9hmbxdkkaq9cv9smekkclhvdninavc98Smealcxfavfydbcbyd;q:kjjbH:bjjjbbavc98fhvxbkkalc;Waf8Kjjjjbk:Jwliuo99iud9:cbhv8Jjjjjbca9Rgoczfcwfcbyd:8:kjjbBdbaocb8Pd:0:kjjb83izaocwfcbyd;i:kjjbBdbaocb8Pd;a:kjjb83ibaicd4hrdndnadmbJFFuFhwJFFuuhDJFFuuhqJFFuFhkJFFuuhxJFFuFhmxekarcdthPaehsincbhiinaoczfaifgzasaifIdbgwazIdbgDaDaw9EEUdbaoaifgzawazIdbgDaDaw9DEUdbaiclfgicx9hmbkasaPfhsavcefgvad9hmbkaoIdKhDaoIdwhwaoIdChqaoIdlhkaoIdzhxaoIdbhmkdnadTmbJbbbbJbFu9hJbbbbamax:tgmamJbbbb9DEgmakaq:tgkakam9DEgkawaD:tgwawak9DEgw:vawJbbbb9BEhwdnalmbarcdthoindndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:S9cC:ghHdndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikaHai:S:ehHdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaHai:T9cy:g:e83ibaeaofheabcwfhbadcufgdmbxdkkarcdthoindndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cv9:9c;j:KM;j:KM;j:Kd:dhOdndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cq9:9cM;j:KM;j:KM;jl:daO:ehOdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaOai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cC9:9c:KM;j:KM;j:KMD:d:e83ibaeaofheabcwfhbadcufgdmbkkk9teiucbcbyd;y:kjjbgeabcifc98GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;y:kjjbgeabcrfc94GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;y:kjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;y:kjjbfgdBd;y:kjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk;Qddbcjwk;mdbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbbbbbbbbbbbbb4:h9w9N94:P:gW:j9O:ye9Pbbbbbbebbbdbbbebbbdbbbbbbbdbbbbbbbebbbbbbb:l29hZ;69:9kZ;N;76Z;rg97Z;z;o9xZ8J;B85Z;:;u9yZ;b;k9HZ:2;Z9DZ9e:l9mZ59A8KZ:r;T3Z:A:zYZ79OHZ;j4::8::Y:D9V8:bbbb9s:49:Z8R:hBZ9M9M;M8:L;z;o8:;8:PG89q;x:J878R:hQ8::M:B;e87bbbbbbjZbbjZbbjZ:E;V;N8::Y:DsZ9i;H;68:xd;R8:;h0838:;W:NoZbbbb:WV9O8:uf888:9i;H;68:9c9G;L89;n;m9m89;D8Ko8:bbbbf:8tZ9m836ZS:2AZL;zPZZ818EZ9e:lxZ;U98F8:819E;68:FFuuFFuuFFuuFFuFFFuFFFuFbc;mqkzebbbebbbdbbb9G:vbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(v){a=v.instance,a.exports.__wasm_call_ctors(),a.exports.meshopt_encodeVertexVersion(0),a.exports.meshopt_encodeIndexVersion(1)});function r(v){for(var h=new Uint8Array(v.length),l=0;l<v.length;++l){var m=v.charCodeAt(l);h[l]=m>96?m-97:m>64?m-39:m+4}for(var f=0,l=0;l<v.length;++l)h[f++]=h[l]<60?e[h[l]]:(h[l]-60)*64+h[++l];return h.buffer.slice(0,f)}function n(v){if(!v)throw new Error("Assertion failed")}function i(v){return new Uint8Array(v.buffer,v.byteOffset,v.byteLength)}function o(v,h,l,m){var f=a.exports.sbrk,p=f(h.length*4),y=f(l*4),E=new Uint8Array(a.exports.memory.buffer),T=i(h);E.set(T,p),m&&m(p,p,h.length,l);var I=v(y,p,h.length,l);E=new Uint8Array(a.exports.memory.buffer);var M=new Uint32Array(l);new Uint8Array(M.buffer).set(E.subarray(y,y+l*4)),T.set(E.subarray(p,p+h.length*4)),f(p-f(0));for(var R=0;R<h.length;++R)h[R]=M[h[R]];return[M,I]}function c(v,h,l,m){var f=a.exports.sbrk,p=f(l*4),y=f(l*m),E=new Uint8Array(a.exports.memory.buffer);E.set(i(h),y),v(p,y,l,m),E=new Uint8Array(a.exports.memory.buffer);var T=new Uint32Array(l);return new Uint8Array(T.buffer).set(E.subarray(p,p+l*4)),f(p-f(0)),T}function d(v,h,l,m,f){var p=a.exports.sbrk,y=p(h),E=p(m*f),T=new Uint8Array(a.exports.memory.buffer);T.set(i(l),E);var I=v(y,h,E,m,f),M=new Uint8Array(I);return M.set(T.subarray(y,y+I)),p(y-p(0)),M}function u(v){for(var h=0,l=0;l<v.length;++l){var m=v[l];h=h<m?m:h}return h}function b(v,h){if(n(h==2||h==4),h==4)return new Uint32Array(v.buffer,v.byteOffset,v.byteLength/4);var l=new Uint16Array(v.buffer,v.byteOffset,v.byteLength/2);return new Uint32Array(l)}function w(v,h,l,m,f,p,y){var E=a.exports.sbrk,T=E(l*m),I=E(l*p),M=new Uint8Array(a.exports.memory.buffer);M.set(i(h),I),v(T,l,m,f,I,y);var R=new Uint8Array(l*m);return R.set(M.subarray(T,T+l*m)),E(T-E(0)),R}return{ready:s,supported:!0,reorderMesh:function(v,h,l){var m=h?l?a.exports.meshopt_optimizeVertexCacheStrip:a.exports.meshopt_optimizeVertexCache:void 0;return o(a.exports.meshopt_optimizeVertexFetchRemap,v,u(v)+1,m)},reorderPoints:function(v,h){return n(v instanceof Float32Array),n(v.length%h==0),n(h>=3),c(a.exports.meshopt_spatialSortRemap,v,v.length/h,h*4)},encodeVertexBuffer:function(v,h,l){n(l>0&&l<=256),n(l%4==0);var m=a.exports.meshopt_encodeVertexBufferBound(h,l);return d(a.exports.meshopt_encodeVertexBuffer,m,v,h,l)},encodeIndexBuffer:function(v,h,l){n(l==2||l==4),n(h%3==0);var m=b(v,l),f=a.exports.meshopt_encodeIndexBufferBound(h,u(m)+1);return d(a.exports.meshopt_encodeIndexBuffer,f,m,h,4)},encodeIndexSequence:function(v,h,l){n(l==2||l==4);var m=b(v,l),f=a.exports.meshopt_encodeIndexSequenceBound(h,u(m)+1);return d(a.exports.meshopt_encodeIndexSequence,f,m,h,4)},encodeGltfBuffer:function(v,h,l,m){var f={ATTRIBUTES:this.encodeVertexBuffer,TRIANGLES:this.encodeIndexBuffer,INDICES:this.encodeIndexSequence};return n(f[m]),f[m](v,h,l)},encodeFilterOct:function(v,h,l,m){return n(l==4||l==8),n(m>=1&&m<=16),w(a.exports.meshopt_encodeFilterOct,v,h,l,m,16)},encodeFilterQuat:function(v,h,l,m){return n(l==8),n(m>=4&&m<=16),w(a.exports.meshopt_encodeFilterQuat,v,h,l,m,16)},encodeFilterExp:function(v,h,l,m,f){n(l>0&&l%4==0),n(m>=1&&m<=24);var p={Separate:0,SharedVector:1,SharedComponent:2,Clamped:3};return w(a.exports.meshopt_encodeFilterExp,v,h,l,m,l,f?p[f]:1)}}})();var ur=(function(){var t="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:W:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:S86qdbk;jYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz1jjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbhodnawTmbaxa8Acd4fRbbhokaocFeGh5cbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz1jjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:jjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q1jjbfcj1jjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bbarcwf9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfag9c8F1:NghcKtc8F91aicdfa8J9c8N1:Nfg8KRbbG86bbarcVfcba8KahcjeGcr4fghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fag9c8F1:NgicKtc8F91aha8J9c8N1:NfghRbbG86bbarc96fcbahaicjeGcr4fgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbb83bbarcwfaicwf8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbcbaocl49Rh8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E93aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z1jjjb8AazazcjdfaAcufad2fadz1jjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:XseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbyd:K1jjbgeabcifc98GfgbBd:K1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk81dbcjwk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:Kwkl8WNbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;G9Mqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:183lYud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxavaialfgmar9Rgoad;8qbbcj;abad9Uc;WFbGcjdadca0EhPdndndnadTmbaoadfhscbhzinaeaz9nmdamax9RaD6miabazad2fhHaxaDfhOaPaeaz9RazaPfae6EgAcsfgocl4cifcd4hCavcj;cbfaoc9WGgXcetfhQavcj;cbfaXci2fhLavcj;cbfaXfhKcbhYaoc;ab6h8AincbhodnawTmbaxaYcd4fRbbhokaocFeGhEcbh3avcj;cbfh5indndndndnaEa3cet4ciGgoc9:fPdebdkamaO9RaX6mwavcj;cbfa3aX2faOaX;8qbbaOaAfhOxdkavcj;cbfa3aX2fcbaX;8kbxekamaO9RaC6moaoclVcbawEhraOaCfhocbhidna8Ambamao9Rc;Gb6mbcbhlina5alfhidndndndndndnaOalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiczfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaicafaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaoclffaqc:q:yjjbfRbbfhoxikaic8Wfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaocwffaqc:q:yjjbfRbbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitc:q1jjbfpbibaic:q:yjjbfRbbgipsaoRbegqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqc:q:yjjbfRbbfhokalc;abfhialcjefaX0meaihlamao9Rc;Fb0mbkkdnaiaX9pmbaici4hlinamao9RcK6mwa5aifhqdndndndndndnaOaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaoclffahc:q:yjjbfRbbfhoxikaqaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaocwffahc:q:yjjbfRbbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpkbbaaaocdffahc:q:yjjbfRbbfhokalcdfhlaiczfgiaX6mbkkaohOaoTmoka5aXfh5a3cefg3cl9hmbkdndndndnawTmbasaYcd4fRbbglciGPlbedwbkaXTmdavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep9Ta8Epxeeeeeeeeeeeeeeeeg8Fp9op9Hp9rg8Eagp9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Ug8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9AbbbaladfhlaoczfgoaX6mbxikkaXTmeavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep:nea8Epxebebebebebebebebg8Fp9op:bep9rg8Eagp:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeg8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9AbbbaladfhlaoczfgoaX6mbxdkkaXTmbcbhocbalcl4gl9Rc8FGhiavcjdfaYfhravaYfpbdbh8Finaravcj;cbfaofpblbggaKaofpblbg8JpmbzeHdOiAlCvXoQrLg8KaQaofpblbg8LaLaofpblbg8MpmbzeHdOiAlCvXoQrLg8NpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ea8Fp9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Fa8Ka8NpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwKDYq8AkEx3m5P8Es8Fgga8La8MpmwKDYq8AkEx3m5P8Es8Fg8JpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9AbbbaradfhraoczfgoaX6mbkkaYclfgYad6mbkaHavcjdfaAad2;8qbbavavcjdfaAcufad2fad;8qbbaAazfhzc9:hoaOhxaOmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdaPaeao9RaoaPfae6Eaofgoae6mbkaial9Rhxkcbc99amax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbk:TseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:SPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiczfpxbbbbbbbbbbbbbbbbgopklbaiaopklbaiabalcitfgdaeciGglcitgv;8qbbdnalTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkadaiav;8qbbkk:oDllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiczfpxbbbbbbbbbbbbbbbbgkpklbaiakpklbaiabalcitfgoaeciGgvcitgw;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkaoaiaw;8qbbkk;uddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaic8WfpxbbbbbbbbbbbbbbbbgopklbaicafaopklbaiczfaopklbaiaopklbaiabavcdtfgdalciGgecdtgv;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkadaiav;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb",a=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),s=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var r=WebAssembly.validate(a)?o(e):o(t),n,i=WebAssembly.instantiate(r,{}).then(function(f){n=f.instance,n.exports.__wasm_call_ctors()});function o(f){for(var p=new Uint8Array(f.length),y=0;y<f.length;++y){var E=f.charCodeAt(y);p[y]=E>96?E-97:E>64?E-39:E+4}for(var T=0,y=0;y<f.length;++y)p[T++]=p[y]<60?s[p[y]]:(p[y]-60)*64+p[++y];return p.buffer.slice(0,T)}function c(f,p,y,E,T,I,M){var R=f.exports.sbrk,A=E+3&-4,S=R(A*T),B=R(I.length),P=new Uint8Array(f.exports.memory.buffer);P.set(I,B);var F=p(S,E,T,B,I.length);if(F==0&&M&&M(S,A,T),y.set(P.subarray(S,S+E*T)),R(S-R(0)),F!=0)throw new Error("Malformed buffer data: "+F)}var d={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},u={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},b=[],w=0;function v(f){var p={object:new Worker(f),pending:0,requests:{}};return p.object.onmessage=function(y){var E=y.data;p.pending-=E.count,p.requests[E.id][E.action](E.value),delete p.requests[E.id]},p}function h(f){for(var p="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(r)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+m.name+";"+c.toString()+m.toString(),y=new Blob([p],{type:"text/javascript"}),E=URL.createObjectURL(y),T=b.length;T<f;++T)b[T]=v(E);for(var T=f;T<b.length;++T)b[T].object.postMessage({});b.length=f,URL.revokeObjectURL(E)}function l(f,p,y,E,T){for(var I=b[0],M=1;M<b.length;++M)b[M].pending<I.pending&&(I=b[M]);return new Promise(function(R,A){var S=new Uint8Array(y),B=++w;I.pending+=f,I.requests[B]={resolve:R,reject:A},I.object.postMessage({id:B,count:f,size:p,source:S,mode:E,filter:T},[S.buffer])})}function m(f){var p=f.data;if(!p.id)return self.close();self.ready.then(function(y){try{var E=new Uint8Array(p.count*p.size);c(y,y.exports[p.mode],E,p.count,p.size,p.source,y.exports[p.filter]),self.postMessage({id:p.id,count:p.count,action:"resolve",value:E},[E.buffer])}catch(T){self.postMessage({id:p.id,count:p.count,action:"reject",value:T})}})}return{ready:i,supported:!0,useWorkers:function(f){h(f)},decodeVertexBuffer:function(f,p,y,E,T){c(n,n.exports.meshopt_decodeVertexBuffer,f,p,y,E,n.exports[d[T]])},decodeIndexBuffer:function(f,p,y,E){c(n,n.exports.meshopt_decodeIndexBuffer,f,p,y,E)},decodeIndexSequence:function(f,p,y,E){c(n,n.exports.meshopt_decodeIndexSequence,f,p,y,E)},decodeGltfBuffer:function(f,p,y,E,T,I){c(n,n.exports[u[T]],f,p,y,E,n.exports[d[I]])},decodeGltfBufferAsync:function(f,p,y,E,T){return b.length>0?l(f,p,y,u[E],d[T]):i.then(function(){var I=new Uint8Array(f*p);return c(n,n.exports[u[E]],I,f,p,y,n.exports[d[T]]),I})}}})();var ey=(function(){var t="b9H79Tebbbetm9Geueu9Geub9Gbb9Gsuuuuuuuuuuuu99uueu9Gvuuuuub9Gruuuuuuub9Gvuuuuue999Gvuuuuueu9Gquuuuuuu99uueu9Gwuuuuuu99ueu9Giuuue999Gluuuueu9GiuuueuiOHdilvorlwiDqkbxxbelve9Weiiviebeoweuec:G:Pdkr:Tewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bbz9TW79O9V9Wt9F79P9T9W29P9M95br8E9TW79O9V9Wt9F79P9T9W29P9M959x9Pt9OcttV9P9I91tW7bwQ9TW79O9V9Wt9F79P9T9W29P9M959q9V9P9Ut7bDX9TW79O9V9Wt9F79P9T9W29P9M959t9J9H2Wbqa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9Wbkl79IV9RbxDwebcekdzsq;B:xeHdbkM9Hi8Au8A99Au8Jjjjjbc;W;qb9Rgs8Kjjjjbcbhzascxfcbc;Kbz:ojjjb8AdnabaeSmbabaeadcdtz:njjjb8AkdndnamcdGmbascxfhHcbhOxekasalcrfci4gecbyd:m:jjjbHjjjjbbgABdxasceBd2aAcbaez:ojjjbhCcbhlcbhednadTmbcbhlabheadhAinaCaeydbgXci4fgQaQRbbgQceaXcrGgXtV86bbaQcu7aX4ceGalfhlaeclfheaAcufgAmbkcualcdtalcFFFFi0EhekascCfhHasaecbyd:m:jjjbHjjjjbbgOBdzascdBd2alcd4alfhXcehAinaAgecethAaeaX6mbkcdhzcbhLascuaecdtgAaecFFFFi0Ecbyd:m:jjjbHjjjjbbgXBdCasciBd2aXcFeaAz:ojjjbhKdnadTmbaecufhYcbh8AindndnaKabaLcdtfgEydbgQc:v;t;h;Ev2aYGgXcdtfgCydbgAcuSmbceheinaOaAcdtfydbaQSmdaXaefhAaecefheaKaAaYGgXcdtfgCydbgAcu9hmbkkaOa8AcdtfaQBdbaCa8ABdba8AhAa8Acefh8AkaEaABdbaLcefgLad9hmbkkaKcbyd1:jjjbH:bjjjbbascdBd2kcbh3aHcualcefgecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbg5Bdbasa5BdlasazceVgeBd2ascxfaecdtfcuadcitadcFFFFe0Ecbyd:m:jjjbHjjjjbbg8EBdbasa8EBdwasazcdfgeBd2asclfabadalcbz:cjjjbascxfaecdtfcualcdtgealcFFFFi0Eg8Fcbyd:m:jjjbHjjjjbbgABdbasazcifgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgaBdbasazclVBd2aAaaaialavaOascxfz:djjjbalcbyd:m:jjjbHjjjjbbhCascxfasyd2ghcdtfaCBdbasahcefgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgXBdbasahcdfgQBd2ascxfaQcdtfa8Fcbyd:m:jjjbHjjjjbbgQBdbasahcifggBd2aXcFeaez:ojjjbh8JaQcFeaez:ojjjbh8KdnalTmba8Ecwfh8Lindna5a3gQcefg3cdtfydbgKa5aQcdtgefydbgXSmbaKaX9Rhza8EaXcitfhHa8Kaefh8Ma8JaefhEcbhYindndnaHaYcitfydbg8AaQ9hmbaEaQBdba8MaQBdbxekdna5a8Acdtg8NfgeclfydbgXaeydbgeSmba8EaecitgKfydbaQSmeaXae9Rhyaecu7aXfhLa8LaKfhXcbheinaLaeSmeaecefheaXydbhKaXcwfhXaKaQ9hmbkaeay6meka8Ka8NfgeaQa8AaeydbcuSEBdbaEa8AaQaEydbcuSEBdbkaYcefgYaz9hmbkka3al9hmbkaAhXaahQa8KhKa8JhYcbheindndnaeaXydbg8A9hmbdnaeaQydbg8A9hmbaYydbh8AdnaKydbgLcu9hmba8Acu9hmbaCaefcb86bbxikaCaefhEdnaeaLSmbaea8ASmbaEce86bbxikaEcl86bbxdkdnaeaaa8AcdtgLfydb9hmbdnaKydbgEcuSmbaeaESmbaYydbgzcuSmbaeazSmba8KaLfydbgHcuSmbaHa8ASmba8JaLfydbgLcuSmbaLa8ASmbdnaAaEcdtfydbg8AaAaLcdtfydb9hmba8AaAazcdtfydbgLSmbaLaAaHcdtfydb9hmbaCaefcd86bbxlkaCaefcl86bbxikaCaefcl86bbxdkaCaefcl86bbxekaCaefaCa8AfRbb86bbkaXclfhXaQclfhQaKclfhKaYclfhYalaecefge9hmbkdnaqTmbdndnaOTmbaOheaAhXalhQindnaqaeydbfRbbTmbaCaXydbfcl86bbkaeclfheaXclfhXaQcufgQmbxdkkaAhealhXindnaqRbbTmbaCaeydbfcl86bbkaqcefhqaeclfheaXcufgXmbkkaAhealhQaChXindnaCaeydbfRbbcl9hmbaXcl86bbkaeclfheaXcefhXaQcufgQmbkkamceGTmbaChealhXindnaeRbbce9hmbaecl86bbkaecefheaXcufgXmbkkascxfagcdtfcualcx2alc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbg3BdbasahclfgHBd2a3aialavaOz:ejjjbh8PdndnaDmbcbhgcbh8Lxekcbh8LawhecbhXindnaeIdbJbbbb9ETmbasc;Wbfa8LcdtfaXBdba8Lcefh8LkaeclfheaDaXcefgX9hmbkascxfaHcdtfcua8Lal2gecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbggBdbasahcvfgHBd2alTmba8LTmbarcd4hEdnaOTmba8Lcdthzcbh8AaghLinaoaOa8AcdtfydbaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbxdkka8Lcdthzcbh8AaghLinaoa8AaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbkkascxfaHcdtfcualc8S2gealc;D;O;f8U0EgQcbyd:m:jjjbHjjjjbbgXBdbasaHcefgKBd2aXcbaez:ojjjbhqdndndna8LTmbascxfaKcdtfaQcbyd:m:jjjbHjjjjbbgvBdbasaHcdfgXBd2avcbaez:ojjjb8AascxfaXcdtfcua8Lal2gecltgXaecFFFFb0Ecbyd:m:jjjbHjjjjbbgiBdbasaHcifBd2aicbaXz:ojjjb8AadmexdkcbhvcbhiadTmekcbhYabhXindna3aXclfydbg8Acx2fgeIdba3aXydbgLcx2fgQIdbgI:tg8Ra3aXcwfydbgEcx2fgKIdlaQIdlg8S:tgRNaKIdbaI:tg8UaeIdla8S:tg8VN:tg8Wa8WNa8VaKIdwaQIdwg8X:tg8YNaRaeIdwa8X:tg8VN:tgRaRNa8Va8UNa8Ya8RN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaLcdtfydbc8S2fgeaRa8U:rg8UaRNNg8VaeIdbMUdbaea8Ra8Ua8RNg8ZNg8YaeIdlMUdlaea8Wa8Ua8WNg80Ng81aeIdwMUdwaea8ZaRNg8ZaeIdxMUdxaea80aRNgBaeIdzMUdzaea80a8RNg80aeIdCMUdCaeaRa8Ua8Wa8XNaRaINa8Sa8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAa8Acdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaEcdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaXcxfhXaYcifgYad6mbkcbhzabhLinabazcdtfh8AcbhXinaCa8AaXc;a1jjbfydbcdtfydbgQfRbbhedndnaCaLaXfydbgKfRbbgYc99fcFeGcpe0mbaec99fcFeGc;:e6mekdnaYcufcFeGce0mba8JaKcdtfydbaQ9hmekdnaecufcFeGce0mba8KaQcdtfydbaK9hmekdnaYcv2aefc:G1jjbfRbbTmbaAaQcdtfydbaAaKcdtfydb0mekJbbacJbbacJbbjZaecFeGceSEaYceSEh80dna3a8AaXc;e1jjbfydbcdtfydbcx2fgeIdwa3aKcx2fgYIdwg8S:tg8Wa3aQcx2fgEIdwa8S:tgRaRNaEIdbaYIdbg8X:tg8Ra8RNaEIdlaYIdlg8V:tg8Ua8UNMMgINa8WaRNaeIdba8X:tg81a8RNa8UaeIdla8V:tg8ZNMMg8YaRN:tg8Wa8WNa81aINa8Ya8RN:tgRaRNa8ZaINa8Ya8UN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaKcdtfydbc8S2fgeaRa80aI:rNg8UaRNNg8YaeIdbMUdbaea8Ra8Ua8RNg80Ng81aeIdlMUdlaea8Wa8Ua8WNgINg8ZaeIdwMUdwaea80aRNg80aeIdxMUdxaeaIaRNgBaeIdzMUdzaeaIa8RNg83aeIdCMUdCaeaRa8Ua8Wa8SNaRa8XNa8Va8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaQcdtfydbc8S2fgea8YaeIdbMUdbaea81aeIdlMUdlaea8ZaeIdwMUdwaea80aeIdxMUdxaeaBaeIdzMUdzaea83aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdykaXclfgXcx9hmbkaLcxfhLazcifgzad6mbka8LTmbcbhLinJbbbbh8Xa3abaLcdtfgeclfydbgEcx2fgXIdwa3aeydbgzcx2fgQIdwg8Z:tg8Ra8RNaXIdbaQIdbgB:tg8Wa8WNaXIdlaQIdlg83:tg8Ua8UNMMg80a3aecwfydbgHcx2fgeIdwa8Z:tgINa8Ra8RaINa8WaeIdbaB:tg8SNa8UaeIdla83:tg8VNMMgRN:tJbbbbJbbjZa80aIaINa8Sa8SNa8Va8VNMMg81NaRaRN:tg8Y:va8YJbbbb9BEg8YNhUa81a8RNaIaRN:ta8YNh85a80a8VNa8UaRN:ta8YNh86a81a8UNa8VaRN:ta8YNh87a80a8SNa8WaRN:ta8YNh88a81a8WNa8SaRN:ta8YNh89a8Wa8VNa8Sa8UN:tgRaRNa8UaINa8Va8RN:tgRaRNa8Ra8SNaIa8WN:tgRaRNMM:rJbbbZNhRagaza8L2gwcdtfhXagaHa8L2g8NcdtfhQagaEa8L2g5cdtfhKa8Z:mh8:a83:mhZaB:mhncbhYa8Lh8AJbbbbh8VJbbbbh8YJbbbbh80Jbbbbh81Jbbbbh8ZJbbbbhBJbbbbh83JbbbbhcJbbbbh9cinasc;WbfaYfgecwfaRa85aKIdbaXIdbgI:tg8UNaUaQIdbaI:tg8SNMg8RNUdbaeclfaRa87a8UNa86a8SNMg8WNUdbaeaRa89a8UNa88a8SNMg8UNUdbaecxfaRa8:a8RNaZa8WNaIana8UNMMMgINUdbaRa8Ra8WNNa81Mh81aRa8Ra8UNNa8ZMh8ZaRa8Wa8UNNaBMhBaRaIaINNa8XMh8XaRa8RaINNa8VMh8VaRa8WaINNa8YMh8YaRa8UaINNa80Mh80aRa8Ra8RNNa83Mh83aRa8Wa8WNNacMhcaRa8Ua8UNNa9cMh9caXclfhXaKclfhKaQclfhQaYczfhYa8Acufg8Ambkavazc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaEc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaHc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyaiawcltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia5cltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia8Ncltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaLcifgLad6mbkkcbhQdndnamcwGgJmbJbbbbh8Vcbh9ecbhocbhhxekcbh9ea8Fcbyd:m:jjjbHjjjjbbhhascxfasyd2gecdtfahBdbasaecefgXBd2ascxfaXcdtfcuahalabadaAz:fjjjbgKcltaKcjjjjiGEcbyd:m:jjjbHjjjjbbgoBdbasaecdfBd2aoaKaha3alz:gjjjbJFFuuh8VaKTmbaoheaKhXinaeIdbgRa8Va8VaR9EEh8VaeclfheaXcufgXmbkaKh9ekasydlhTdnalTmbaTclfheaTydbhKaChXalhYcbhQincbaeydbg8AaK9RaXRbbcpeGEaQfhQaXcefhXaeclfhea8AhKaYcufgYmbkaQce4hQkcuadaQ9RcifgScx2aSc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbhDascxfasyd2g9hcdtfaDBdbasa9hcefgeBd2ascxfaecdtfcuaScdtaScFFFFi0Ecbyd:m:jjjbHjjjjbbgrBdbasa9hcdfgeBd2ascxfaecdtfa8Fcbyd:m:jjjbHjjjjbbgyBdbasa9hcifgeBd2ascxfaecdtfalcbyd:m:jjjbHjjjjbbg9iBdbasa9hclfg6Bd2axaxNa8PJbbjZamclGEgUaUN:vh9cJbbbbhcdnadak9nmbdnaSci6mba8Lclth9kaDcwfh0Jbbbbh83JbbbbhcinasclfabadalaAz:cjjjbabhzcbh8Ecbh8Finaba8FcdtfhHcbheindnaAazaefydbgQcdtgEfydbgYaAaHaec;q1jjbfydbcdtfydbgXcdtgwfydbg8ASmbaCaXfRbbgLcv2aCaQfRbbgKfc;G1jjbfRbbg5aKcv2aLfg8Nc;G1jjbfRbbg8MVcFeGTmbdna8AaY9nmba8Nc:G1jjbfRbbcFeGmekaKcufhYdnaKaL9hmbaYcFeGce0mba8JaEfydbaX9hmekdndnaKclSmbaLcl9hmekdnaYcFeGce0mba8JaEfydbaX9hmdkaLcufcFeGce0mba8KawfydbaQ9hmekaDa8Ecx2fgKaXaQa8McFeGgYEBdlaKaQaXaYEBdbaKaYa5Gcb9hBdwa8Ecefh8Ekaeclfgecx9hmbkdna8Fcifg8Fad9pmbazcxfhza8EcifaS9nmekka8ETmdcbhLinaqaAaDaLcx2fgKydbgYcdtgzfydbc8S2fgeIdwa3aKydlg8Acx2fgXIdwg8WNaeIdzaXIdbg8UNaeIdaMgRaRMMa8WNaeIdlaXIdlgINaeIdCa8WNaeId3MgRaRMMaINaeIdba8UNaeIdxaINaeIdKMgRaRMMa8UNaeId8KMMM:lhRJbbbbJbbjZaeIdyg8R:va8RJbbbb9BEh8RdndnaKydwgEmbJFFuuh8YxekJbbbbJbbjZaqaAa8Acdtfydbc8S2fgeIdyg8S:va8SJbbbb9BEaeIdwa3aYcx2fgXIdwg8SNaeIdzaXIdbg8XNaeIdaMg8Ya8YMMa8SNaeIdlaXIdlg8YNaeIdCa8SNaeId3Mg8Sa8SMMa8YNaeIdba8XNaeIdxa8YNaeIdKMg8Sa8SMMa8XNaeId8KMMM:lNh8Yka8RaRNh80dna8LTmbavaYc8S2fgQIdwa8WNaQIdza8UNaQIdaMgRaRMMa8WNaQIdlaINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRaga8Aa8L2gHcdtfhXaiaYa8L2gwcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekava8Ac8S2fgQIdwa3aYcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8RagawcdtfhXaiaHcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YaCaYfRbbcd9hmbdna8Ka8Ja8Jazfydba8ASEaaazfydbgHcdtfydbgzcu9hmbaaa8AcdtfydbhzkavaHc8S2fgQIdwa3azcx2fgeIdwg8WNaQIdzaeIdbg8UNaQIdaMgRaRMMa8WNaQIdlaeIdlgINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRagaza8L2gwcdtfhXaiaHa8L2g8NcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekavazc8S2fgQIdwa3aHcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8Raga8NcdtfhXaiawcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YkaKa80a8Ya80a8Y9FgeEUdwaKa8AaYaeaETVgeEBdlaKaYa8AaeEBdbaLcefgLa8E9hmbkasc;Wbfcbcj;qbz:ojjjb8Aa0hea8EhXinasc;WbfaeydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbcefBdbaecxfheaXcufgXmbkcbhecbhXinasc;WbfaefgQydbhKaQaXBdbaKaXfhXaeclfgecj;qb9hmbkcbhea0hXinasc;WbfaXydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbgQcefBdbaraQcdtfaeBdbaXcxfhXa8Eaecefge9hmbkadak9RgQci9Uh9mdnalTmbcbheayhXinaXaeBdbaXclfhXalaecefge9hmbkkcbh9na9icbalz:ojjjbh8FaQcO9Uh9oa9mce4h9pasydwh9qcbh8Mcbh5dninaDara5cdtfydbcx2fg8NIdwgRa9c9Emea8Ma9m9pmeJFFuuh8Rdna9pa8E9pmbaDara9pcdtfydbcx2fIdwJbb;aZNh8RkdnaRa8R9ETmbaRac9ETmba8Ma9o0mdkdna8FaAa8NydlgHcdtg9rfydbgKfg9sRbba8FaAa8Nydbgzcdtg9tfydbgefg9uRbbVmbaCazfRbbh9vdnaTaecdtfgXclfydbgQaXydbgXSmbaQaX9RhYa3aKcx2fhLa3aecx2fhEa9qaXcitfhecbhXcehwdnindnayaeydbcdtfydbgQaKSmbayaeclfydbcdtfydbg8AaKSmbaQa8ASmba3a8Acx2fg8AIdba3aQcx2fgQIdbg8W:tgRaEIdlaQIdlg8U:tg8XNaEIdba8W:tg8Ya8AIdla8U:tg8RN:tgIaRaLIdla8U:tg80NaLIdba8W:tg81a8RN:tg8UNa8RaEIdwaQIdwg8S:tg8ZNa8Xa8AIdwa8S:tg8WN:tg8Xa8RaLIdwa8S:tgBNa80a8WN:tg8RNa8Wa8YNa8ZaRN:tg8Sa8Wa81NaBaRN:tgRNMMaIaINa8Xa8XNa8Sa8SNMMa8Ua8UNa8Ra8RNaRaRNMMN:rJbbj8:N9FmdkaecwfheaXcefgXaY6hwaYaX9hmbkkawceGTmba9pcefh9pxekdndndndna9vc9:fPdebdkazheinayaecdtgefaHBdbaaaefydbgeaz9hmbxikkdna8Ka8Ja8Ja9tfydbaHSEaaa9tfydbgzcdtfydbgecu9hmbaaa9rfydbhekaya9tfaHBdbaehHkayazcdtfaHBdbka9uce86bba9sce86bba8NIdwgRacacaR9DEhca9ncefh9ncecda9vceSEa8Mfh8Mka5cefg5a8E9hmbkka9nTmddnalTmbcbh8AcbhEindnayaEcdtgefydbgQaESmbaAaQcdtfydbhzdnaEaAaefydb9hgHmbaqazc8S2fgeaqaEc8S2fgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdyka8LTmbavaQc8S2fgeavaEc8S2gwfgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdya9kaQ2hLaihXa8LhKinaXaLfgeaXa8AfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaHmbJbbbbJbbjZaqawfgeIdygR:vaRJbbbb9BEaeIdwa3azcx2fgXIdwgRNaeIdzaXIdbg8RNaeIdaMg8Wa8WMMaRNaeIdlaXIdlg8WNaeIdCaRNaeId3MgRaRMMa8WNaeIdba8RNaeIdxa8WNaeIdKMgRaRMMa8RNaeId8KMMM:lNgRa83a83aR9DEh83ka8Aa9kfh8AaEcefgEal9hmbkcbhXa8JheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8JaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkcbhXa8KheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8KaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkka83aca8LEh83cbhKabhecbhYindnayaeydbcdtfydbgXayaeclfydbcdtfydbgQSmbaXayaecwfydbcdtfydbg8ASmbaQa8ASmbabaKcdtfgLaXBdbaLcwfa8ABdbaLclfaQBdbaKcifhKkaecxfheaYcifgYad6mbkdndnaJTmbaKak9nmba8Va839FTmbcbhdabhecbhXindnaoahaeydbgQcdtfydbcdtfIdba839ETmbabadcdtfgYaQBdbaYclfaeclfydbBdbaYcwfaecwfydbBdbadcifhdkaecxfheaXcifgXaK6mbkJFFuuh8Va9eTmeaohea9ehXJFFuuhRinaeIdbg8RaRaRa8R9EEg8WaRa8Ra839EgQEhRa8Wa8VaQEh8VaeclfheaXcufgXmbxdkkaKhdkadak0mbxdkkasclfabadalaAz:cjjjbkdndnadak0mbadhXxekdnaJmbadhXxekdna8Va9c9FmbadhXxekina8VJbb;aZNgRa9caRa9c9DEh8WJbbbbhRdna9eTmbaohea9ehAinaeIdbg8RaRa8Ra8W9FEaRa8RaR9EEhRaeclfheaAcufgAmbkkcbhXabhecbhAindnaoahaeydbgQcdtfydbcdtfIdba8W9ETmbabaXcdtfgKaQBdbaKclfaeclfydbBdbaKcwfaecwfydbBdbaXcifhXkaecxfheaAcifgAad6mbkJFFuuh8Vdna9eTmbaohea9ehAJFFuuh8RinaeIdbg8Ua8Ra8Ra8U9EEgIa8Ra8Ua8W9EgQEh8RaIa8VaQEh8VaeclfheaAcufgAmbkkdnaXad9hmbadhXxdkaRacacaR9DEhcaXak9nmeaXhda8Va9c9FmbkkdnamcjjjjlGTmbaOmbaXTmbcbh8AabheinaCaeydbgKfRbbc3thLaecwfgEydbhAdndna8JaKcdtgHfydbaeclfgzydbgQSmbcbhYa8KaQcdtfydbaK9hmekcjjjj94hYkaeaLaYVaKVBdbaCaQfRbbc3thLdndna8JaQcdtfydbaASmbcbhYa8KaAcdtfydbaQ9hmekcjjjj94hYkazaLaYVaQVBdbaCaAfRbbc3thYdndna8JaAcdtfydbaKSmbcbhQa8KaHfydbaA9hmekcjjjj94hQkaEaYaQVaAVBdbaecxfhea8Acifg8AaX6mbkkdnaOTmbaXTmbaXheinabaOabydbcdtfydbBdbabclfhbaecufgembkkdnaPTmbaPaUac:rNUdbka9hcdtascxffcxfhednina6Tmeaeydbcbyd1:jjjbH:bjjjbbaec98fhea6cufh6xbkkasc;W;qbf8KjjjjbaXk;Yieouabydlhvabydbclfcbaicdtz:ojjjbhoadci9UhrdnadTmbdnalTmbaehwadhDinaoalawydbcdtfydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbxdkkaehwadhDinaoawydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbkkdnaiTmbcbhDaohwinawydbhqawaDBdbawclfhwaqaDfhDaicufgimbkkdnadci6mbinaecwfydbhwaeclfydbhDaeydbhidnalTmbalawcdtfydbhwalaDcdtfydbhDalaicdtfydbhikavaoaicdtfgqydbcitfaDBdbavaqydbcitfawBdlaqaqydbcefBdbavaoaDcdtfgqydbcitfawBdbavaqydbcitfaiBdlaqaqydbcefBdbavaoawcdtfgwydbcitfaiBdbavawydbcitfaDBdlawawydbcefBdbaecxfhearcufgrmbkkabydbcbBdbk:todDue99aicd4aifhrcehwinawgDcethwaDar6mbkcuaDcdtgraDcFFFFi0Ecbyd:m:jjjbHjjjjbbhwaoaoyd9GgqcefBd9GaoaqcdtfawBdbawcFearz:ojjjbhkdnaiTmbalcd4hlaDcufhxcbhminamhDdnavTmbavamcdtfydbhDkcbadaDal2cdtfgDydlgwawcjjjj94SEgwcH4aw7c:F:b:DD2cbaDydbgwawcjjjj94SEgwcH4aw7c;D;O:B8J27cbaDydwgDaDcjjjj94SEgDcH4aD7c:3F;N8N27axGhwamcdthPdndndnavTmbakawcdtfgrydbgDcuSmeadavaPfydbal2cdtfgsIdbhzcehqinaqhrdnadavaDcdtfydbal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmlkarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbxdkkakawcdtfgrydbgDcuSmbadamal2cdtfgsIdbhzcehqinaqhrdnadaDal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmikarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbkkaramBdbamhDkabaPfaDBdbamcefgmai9hmbkkakcbyd1:jjjbH:bjjjbbaoaoyd9GcufBd9GdnaeTmbaiTmbcbhDaehwinawaDBdbawclfhwaiaDcefgD9hmbkcbhDaehwindnaDabydbgrSmbawaearcdtfgrydbBdbaraDBdbkawclfhwabclfhbaiaDcefgD9hmbkkk;Qodvuv998Jjjjjbca9Rgvczfcwfcbyd11jjbBdbavcb8Pdj1jjb83izavcwfcbydN1jjbBdbavcb8Pd:m1jjb83ibdnadTmbaicd4hodnabmbdnalTmbcbhrinaealarcdtfydbao2cdtfhwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxikkaocdthrcbhwincbhiinavczfaifgDaeaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkaearfheawcefgwad9hmbxdkkdnalTmbcbhrinabarcx2fgiaealarcdtfydbao2cdtfgwIdbUdbaiawIdlUdlaiawIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxdkkaocdthlcbhraehwinabarcx2fgiaearao2cdtfgDIdbUdbaiaDIdlUdlaiaDIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkawalfhwarcefgrad9hmbkkJbbbbavIdbavIdzgk:tgqaqJbbbb9DEgqavIdlavIdCgx:tgmamaq9DEgqavIdwavIdKgm:tgPaPaq9DEhPdnabTmbadTmbJbbbbJbbjZaP:vaPJbbbb9BEhqinabaqabIdbak:tNUdbabclfgvaqavIdbax:tNUdbabcwfgvaqavIdbam:tNUdbabcxfhbadcufgdmbkkaPk:ZlewudnaeTmbcbhvabhoinaoavBdbaoclfhoaeavcefgv9hmbkkdnaiTmbcbhrinadarcdtfhwcbhDinalawaDcdtgvc;a1jjbfydbcdtfydbcdtfydbhodnabalawavfydbcdtfydbgqcdtfgkydbgvaqSmbinakabavgqcdtfgxydbgvBdbaxhkaqav9hmbkkdnabaocdtfgkydbgvaoSmbinakabavgocdtfgxydbgvBdbaxhkaoav9hmbkkdnaqaoSmbabaqaoaqao0Ecdtfaqaoaqao6EBdbkaDcefgDci9hmbkarcifgrai6mbkkdnaembcbskcbhxindnalaxcdtgvfydbax9hmbaxhodnabavfgDydbgvaxSmbaDhqinaqabavgocdtfgkydbgvBdbakhqaoav9hmbkkaDaoBdbkaxcefgxae9hmbkcbhvabhocbhkindndnavalydbgq9hmbdnavaoydbgq9hmbaoakBdbakcefhkxdkaoabaqcdtfydbBdbxekaoabaqcdtfydbBdbkaoclfhoalclfhlaeavcefgv9hmbkakk;Jiilud99duabcbaecltz:ojjjbhvdnalTmbadhoaihralhwinarcwfIdbhDarclfIdbhqavaoydbcltfgkarIdbakIdbMUdbakclfgxaqaxIdbMUdbakcwfgxaDaxIdbMUdbakcxfgkakIdbJbbjZMUdbaoclfhoarcxfhrawcufgwmbkkdnaeTmbavhraehkinarcxfgoIdbhDaocbBdbararIdbJbbbbJbbjZaD:vaDJbbbb9BEgDNUdbarclfgoaDaoIdbNUdbarcwfgoaDaoIdbNUdbarczfhrakcufgkmbkkdnalTmbinavadydbcltfgrcxfgkaicwfIdbarcwfIdb:tgDaDNaiIdbarIdb:tgDaDNaiclfIdbarclfIdb:tgDaDNMMgDakIdbgqaqaD9DEUdbadclfhdaicxfhialcufglmbkkdnaeTmbavcxfhrinabarIdbUdbarczfhrabclfhbaecufgembkkk8MbabaeadaialavcbcbcbcbcbaoarawaDz:bjjjbk8MbabaeadaialavaoarawaDaqakaxamaPz:bjjjbk:DCoDud99rue99iul998Jjjjjbc;Wb9Rgw8KjjjjbdndnarmbcbhDxekawcxfcbc;Kbz:ojjjb8Aawcuadcx2adc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbgqBdxawceBd2aqaeadaicbz:ejjjb8AawcuadcdtadcFFFFi0Egkcbyd:m:jjjbHjjjjbbgxBdzawcdBd2adcd4adfhmceheinaegicetheaiam6mbkcbhPawcuaicdtgsaicFFFFi0Ecbyd:m:jjjbHjjjjbbgzBdCawciBd2dndnar:ZgH:rJbbbZMgO:lJbbb9p9DTmbaO:Ohexekcjjjj94hekaicufhAc:bwhmcbhCadhXcbhQinaChLaeamgKcufaeaK9iEaPgDcefaeaD9kEhYdndnadTmbaYcuf:YhOaqhiaxheadhmindndnaiIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbh5cbhPindna3axaPcdtfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbaeaCSmbcehiina3amaifaAGgmcdtfgEydbgecuSmeaicefhiaeaC9hmbkkaEaCBdba5aecuSfh5aPcefgPad9hmbxdkkazcFeasz:ojjjb8Acbh5kaDaYa5ar0giEhPaLa5aiEhCdna5arSmbaYaKaiEgmaP9Rcd9imbdndnaQcl0mbdnaX:ZgOaL:Zg8A:taY:Yg8EaD:Y:tg8Fa8EaK:Y:tgaa5:ZghaH:tNNNaOaH:taaNa8Aah:tNa8AaH:ta8FNahaO:tNM:va8EMJbbbZMgO:lJbbb9p9DTmbaO:Ohexdkcjjjj94hexekaPamfcd9Theka5aXaiEhXaQcefgQcs9hmekkdndnaCmbcihicbhDxekcbhiawakcbyd:m:jjjbHjjjjbbg5BdKawclBd2aPcuf:Yh8AdndnadTmbaqhiaxheadhmindndnaiIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbhDcbhYindndndna3axaYcdtgKfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbcehiinaxaecdtgefydbaCSmdamaifheaicefhia3aeaAGgmcdtfgEydbgecu9hmbkkaEaYBdbaDhiaDcefhDxeka5aefydbhika5aKfaiBdbaYcefgYad9hmbkcuaDc32giaDc;j:KM;jb0EhexekazcFeasz:ojjjb8AcbhDcbhekawaecbyd:m:jjjbHjjjjbbgeBd3awcvBd2aecbaiz:ojjjbhEavcd4hKdnadTmbdnalTmbaKcdth3a5hCaqhealhmadhAinaEaCydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiamIdbaiIdxMUdxaiamclfIdbaiIdzMUdzaiamcwfIdbaiIdCMUdCaiaiIdKJbbjZMUdKaCclfhCaecxfheama3fhmaAcufgAmbxdkka5hmaqheadhCinaEamydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiaiIdxJbbbbMUdxaiaiIdzJbbbbMUdzaiaiIdCJbbbbMUdCaiaiIdKJbbjZMUdKamclfhmaecxfheaCcufgCmbkkdnaDTmbaEhiaDheinaiaiIdbJbbbbJbbjZaicKfIdbgO:vaOJbbbb9BEgONUdbaiclfgmaOamIdbNUdbaicwfgmaOamIdbNUdbaicxfgmaOamIdbNUdbaiczfgmaOamIdbNUdbaicCfgmaOamIdbNUdbaic3fhiaecufgembkkcbhCawcuaDcdtgYaDcFFFFi0Egicbyd:m:jjjbHjjjjbbgeBdaawcoBd2awaicbyd:m:jjjbHjjjjbbg3Bd8KaecFeaYz:ojjjbhxdnadTmbJbbjZJbbjZa8A:vaPceSEaoNgOaONh8AaKcdthPalheina8Aaec;81jjbalEgmIdwaEa5ydbgAc32fgiIdC:tgOaONamIdbaiIdx:tgOaONamIdlaiIdz:tgOaONMMNaqcwfIdbaiIdw:tgOaONaqIdbaiIdb:tgOaONaqclfIdbaiIdl:tgOaONMMMhOdndnaxaAcdtgifgmydbcuSmba3aifIdbaO9ETmekamaCBdba3aifaOUdbka5clfh5aqcxfhqaeaPfheadaCcefgC9hmbkkabaxaYz:njjjb8AcrhikaicdthiinaiTmeaic98fgiawcxffydbcbyd1:jjjbH:bjjjbbxbkkawc;Wbf8KjjjjbaDk:Ydidui99ducbhi8Jjjjjbca9Rglczfcwfcbyd11jjbBdbalcb8Pdj1jjb83izalcwfcbydN1jjbBdbalcb8Pd:m1jjb83ibdndnaembJbbjFhvJbbjFhoJbbjFhrxekadcd4cdthwincbhdinalczfadfgDabadfIdbgvaDIdbgoaoav9EEUdbaladfgDavaDIdbgoaoav9DEUdbadclfgdcx9hmbkabawfhbaicefgiae9hmbkalIdwalIdK:thralIdlalIdC:thoalIdbalIdz:thvkJbbbbavavJbbbb9DEgvaoaoav9DEgvararav9DEk9DeeuabcFeaicdtz:ojjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcifc98GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcrfc94GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd:q:jjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd:q:jjjbfgdBd:q:jjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk:Iedbcjwk1eFFuuFFuuFFuuFFuFFFuFFFuFbbbbbbbbeeebeebebbeeebebbbbbebebbbbbbbbbebbbdbbbbbbbebbbebbbdbbbbbbbbbbbeeeeebebbebbebebbbeebbbbbbbbbbbbbbbbbbbbbc1Dkxebbbdbbb:GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(h){a=h.instance,a.exports.__wasm_call_ctors()});function r(h){for(var l=new Uint8Array(h.length),m=0;m<h.length;++m){var f=h.charCodeAt(m);l[m]=f>96?f-97:f>64?f-39:f+4}for(var p=0,m=0;m<h.length;++m)l[p++]=l[m]<60?e[l[m]]:(l[m]-60)*64+l[++m];return l.buffer.slice(0,p)}function n(h){if(!h)throw new Error("Assertion failed")}function i(h){return new Uint8Array(h.buffer,h.byteOffset,h.byteLength)}function o(h,l,m){var f=a.exports.sbrk,p=f(l.length*4),y=f(m*4),E=new Uint8Array(a.exports.memory.buffer),T=i(l);E.set(T,p);var I=h(y,p,l.length,m);E=new Uint8Array(a.exports.memory.buffer);var M=new Uint32Array(m);new Uint8Array(M.buffer).set(E.subarray(y,y+m*4)),T.set(E.subarray(p,p+l.length*4)),f(p-f(0));for(var R=0;R<l.length;++R)l[R]=M[l[R]];return[M,I]}function c(h){for(var l=0,m=0;m<h.length;++m){var f=h[m];l=l<f?f:l}return l}function d(h,l,m,f,p,y,E,T,I){var M=a.exports.sbrk,R=M(4),A=M(m*4),S=M(p*y),B=M(m*4),P=new Uint8Array(a.exports.memory.buffer);P.set(i(f),S),P.set(i(l),B);var F=h(A,B,m,S,p,y,E,T,I,R);P=new Uint8Array(a.exports.memory.buffer);var L=new Uint32Array(F);i(L).set(P.subarray(A,A+F*4));var X=new Float32Array(1);return i(X).set(P.subarray(R,R+4)),M(R-M(0)),[L,X[0]]}function u(h,l,m,f,p,y,E,T,I,M,R,A,S){var B=a.exports.sbrk,P=B(4),F=B(m*4),L=B(p*y),X=B(p*T),ee=B(I.length*4),re=B(m*4),_e=M?B(p):0,ce=new Uint8Array(a.exports.memory.buffer);ce.set(i(f),L),ce.set(i(E),X),ce.set(i(I),ee),ce.set(i(l),re),M&&ce.set(i(M),_e);var Ne=h(F,re,m,L,p,y,X,T,ee,I.length,_e,R,A,S,P);ce=new Uint8Array(a.exports.memory.buffer);var Pe=new Uint32Array(Ne);i(Pe).set(ce.subarray(F,F+Ne*4));var ge=new Float32Array(1);return i(ge).set(ce.subarray(P,P+4)),B(P-B(0)),[Pe,ge[0]]}function b(h,l,m,f){var p=a.exports.sbrk,y=p(m*f),E=new Uint8Array(a.exports.memory.buffer);E.set(i(l),y);var T=h(y,m,f);return p(y-p(0)),T}function w(h,l,m,f,p,y,E,T){var I=a.exports.sbrk,M=I(T*4),R=I(m*f),A=I(m*y),S=new Uint8Array(a.exports.memory.buffer);S.set(i(l),R),p&&S.set(i(p),A);var B=h(M,R,m,f,A,y,E,T);S=new Uint8Array(a.exports.memory.buffer);var P=new Uint32Array(B);return i(P).set(S.subarray(M,M+B*4)),I(M-I(0)),P}var v={LockBorder:1,Sparse:2,ErrorAbsolute:4,Prune:8,_InternalDebug:1<<30};return{ready:s,supported:!0,compactMesh:function(h){n(h instanceof Uint32Array||h instanceof Int32Array||h instanceof Uint16Array||h instanceof Int16Array),n(h.length%3==0);var l=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h);return o(a.exports.meshopt_optimizeVertexFetchRemap,l,c(h)+1)},simplify:function(h,l,m,f,p,y){n(h instanceof Uint32Array||h instanceof Int32Array||h instanceof Uint16Array||h instanceof Int16Array),n(h.length%3==0),n(l instanceof Float32Array),n(l.length%m==0),n(m>=3),n(f>=0&&f<=h.length),n(f%3==0),n(p>=0);for(var E=0,T=0;T<(y?y.length:0);++T)n(y[T]in v),E|=v[y[T]];var I=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h),M=d(a.exports.meshopt_simplify,I,h.length,l,l.length/m,m*4,f,p,E);return M[0]=h instanceof Uint32Array?M[0]:new h.constructor(M[0]),M},simplifyWithAttributes:function(h,l,m,f,p,y,E,T,I,M){n(h instanceof Uint32Array||h instanceof Int32Array||h instanceof Uint16Array||h instanceof Int16Array),n(h.length%3==0),n(l instanceof Float32Array),n(l.length%m==0),n(m>=3),n(f instanceof Float32Array),n(f.length%p==0),n(p>=0),n(E==null||E instanceof Uint8Array),n(E==null||E.length==l.length/m),n(T>=0&&T<=h.length),n(T%3==0),n(I>=0),n(Array.isArray(y)),n(p>=y.length),n(y.length<=32);for(var R=0;R<y.length;++R)n(y[R]>=0);for(var A=0,R=0;R<(M?M.length:0);++R)n(M[R]in v),A|=v[M[R]];var S=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h),B=u(a.exports.meshopt_simplifyWithAttributes,S,h.length,l,l.length/m,m*4,f,p*4,new Float32Array(y),E?new Uint8Array(E):null,T,I,A);return B[0]=h instanceof Uint32Array?B[0]:new h.constructor(B[0]),B},getScale:function(h,l){return n(h instanceof Float32Array),n(h.length%l==0),n(l>=3),b(a.exports.meshopt_simplifyScale,h,h.length/l,l*4)},simplifyPoints:function(h,l,m,f,p,y){return n(h instanceof Float32Array),n(h.length%l==0),n(l>=3),n(m>=0&&m<=h.length/l),f?(n(f instanceof Float32Array),n(f.length%p==0),n(p>=3),n(h.length/l==f.length/p),w(a.exports.meshopt_simplifyPoints,h,h.length/l,l*4,f,p*4,y,m)):w(a.exports.meshopt_simplifyPoints,h,h.length/l,l*4,void 0,0,0,m)}}})();var ay=(function(){var t="b9H79TebbbeVx9Geueu9Geub9Gbb9Giuuueu9Gmuuuuuuuuuuu9999eu9Gvuuuuueu9Gwuuuuuuuub9Gxuuuuuuuuuuuueu9Gkuuuuuuuuuu99eu9Gouuuuuub9Gruuuuuuub9GluuuubiOHdilvorwDqqkbiibeilve9Weiiviebeoweuec;G:Odkr:Yewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9I919P29K9nW79O2Wt79c9V919U9KbeX9TW79O9V9Wt9F9I919P29K9nW79O2Wt7bo39TW79O9V9Wt9F9J9V9T9W91tWJ2917tWV9c9V919U9K7br39TW79O9V9Wt9F9J9V9T9W91tW9nW79O2Wt9c9V919U9K7bDL9TW79O9V9Wt9F9V9Wt9P9T9P96W9nW79O2Wtbql79IV9RbkDwebcekdsPq;Q9BHdbkIbabaec9:fgefcufae9Ugeabci9Uadfcufad9Ugbaeab0Ek:w8KDPue99eux99dui99euo99iu8Jjjjjbc:WD9Rgm8KjjjjbdndnalmbcbhPxekamc:Cwfcbc;Kbz:njjjb8Adndnalcb9imbaoal9nmbamcuaocdtaocFFFFi0Egscbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamascbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8waihsalhAinazasydbcdtfcbBdbasclfhsaAcufgAmbkaihsalhAinazasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkaihsalhCcbhXindnazasydbcdtgQfgAydbcb9imbaHaQfaXBdbaAaAydbgQcjjjj94VBdbaQaXfhXkasclfhsaCcufgCmbkalci9UhLdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhXaHaAydbcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaXcdtfgXaXydbgXcefBdbaOaXcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaihsalhAindnazasydbcdtgCfgXydbgQcu9kmbaXaQcFFFFrGgQBdbaHaCfgCaCydbaQ9RBdbkasclfhsaAcufgAmbxdkkamcuaocdtgsaocFFFFi0EgAcbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamaAcbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8wazcbasz:njjjbhXalci9UhLaihsalhAinaXasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkdnaoTmbcbhsaHhAaXhCaohQinaAasBdbaAclfhAaCydbasfhsaCclfhCaQcufgQmbkkdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhQaHaAydbcdtfgKaKydbgKcefBdbaOaKcdtfasBdbaHaQcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaoTmbcbhsaohAinaHasfgCaCydbaXasfydb9RBdbasclfhsaAcufgAmbkkamaLcbyd;y1jjbHjjjjbbgsBd:OwamclBd;8wascbaLz:njjjbhYamcuaLcK2alcjjjjd0Ecbyd;y1jjbHjjjjbbg8ABd:SwamcvBd;8wJbbbbhEdnalci6g3mbarcd4hKaihAa8AhsaLhrJbbbbh5inavaAclfydbaK2cdtfgCIdlh8EavaAydbaK2cdtfgXIdlhEavaAcwfydbaK2cdtfgQIdlh8FaCIdwhaaXIdwhhaQIdwhgasaCIdbg8JaXIdbg8KMaQIdbg8LMJbbnn:vUdbasclfaXIdlaCIdlMaQIdlMJbbnn:vUdbaQIdwh8MaCIdwh8NaXIdwhyascxfa8EaE:tg8Eagah:tggNa8FaE:tg8Faaah:tgaN:tgEJbbbbJbbjZa8Ja8K:tg8Ja8FNa8La8K:tg8Ka8EN:tghahNaEaENaaa8KNaga8JN:tgEaENMM:rg8K:va8KJbbbb9BEg8ENUdbasczfaEa8ENUdbascCfaha8ENUdbascwfa8Maya8NMMJbbnn:vUdba5a8KMh5aAcxfhAascKfhsarcufgrmbka5aL:Z:vJbbbZNhEkamcuaLcdtalcFFFF970Ecbyd;y1jjbHjjjjbbgCBd:WwamcoBd;8waEaq:ZNhEdna3mbcbhsaChAinaAasBdbaAclfhAaLascefgs9hmbkkaE:rhhcuh8PamcuaLcltalcFFFFd0Ecbyd;y1jjbHjjjjbbgIBd:0wamcrBd;8wcbaIa8AaCaLz:djjjb8AJFFuuhyJFFuuh8RJFFuuh8Sdnalci6gXmbJFFuuh8Sa8AhsaLhAJFFuuh8RJFFuuhyinascwfIdbgEayayaE9EEhyasclfIdbgEa8Ra8RaE9EEh8RasIdbgEa8Sa8SaE9EEh8SascKfhsaAcufgAmbkkahJbbbZNhgamaocetgscuaocu9kEcbyd;y1jjbHjjjjbbgABd:4waAcFeasz:njjjbhCdnaXmbcbhAJFFuuhEa8Ahscuh8PinascwfIdbay:tghahNasIdba8S:tghahNasclfIdba8R:tghahNMM:rghaEa8PcuSahaE9DVgXEhEaAa8PaXEh8PascKfhsaLaAcefgA9hmbkkamczfcbcjwz:njjjb8Aamcwf9cb83ibam9cb83ibagaxNhRJbbjZak:th8Ncbh8UJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80cbh81cbhPinJbbbbhEdna8UTmbJbbjZa8U:Z:vhEkJbbbbhhdna80a80Na8Ya8YNa8Za8ZNMMg8KJbbbb9BmbJbbjZa8K:r:vhhka8XaENh5a8WaENh8Fa8VaENhaa8PhQdndndndndna8UaPVTmbamydwgBTmea80ahNh8Ja8ZahNh8La8YahNh8Maeamydbcdtfh83cbh3JFFuuhEcvhXcuhQindnaza83a3cdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAindndnaCaiaAydbgKcx2fgsclfydbgrcetf8Vebcs4aCasydbgLcetf8Vebcs4faCascwfydbglcetf8Vebcs4fgombcbhsxekcehsazaLcdtfydbgLceSmbcehsazarcdtfydbgrceSmbcehsazalcdtfydbglceSmbdnarcdSaLcdSfalcdSfcd6mbaocefhsxekaocdfhskdnasaX9kmba8AaKcK2fgLIdwa5:thhaLIdla8F:th8KaLIdbaa:th8EdndnakJbbbb9DTmba8E:lg8Ea8K:lg8Ka8Ea8K9EEg8Kah:lgha8Kah9EEag:vJbbjZMhhxekahahNa8Ea8ENa8Ka8KNMM:rag:va8NNJbbjZMJ9VO:d86JbbjZaLIdCa8JNaLIdxa8MNa8LaLIdzNMMakN:tghahJ9VO:d869DENhhkaKaQasaX6ahaE9DVgLEhQasaXaLEhXahaEaLEhEkaAclfhAavcufgvmbkka3cefg3aB9hmbkkaQcu9hmekama5Ud:ODama8FUd:KDamaaUd:GDamcuBd:qDamcFFF;7rBdjDaIcba8AaYamc:GDfakJbbbb9Damc:qDfamcjDfz:ejjjbamyd:qDhQdndnaxJbbbb9ETmba8UaD6mbaQcuSmeceh3amIdjDaR9EmixdkaQcu9hmekdna8UTmbdnamydlgza8Uci2fgsciGTmbadasfcba8Uazcu7fciGcefz:njjjb8AkabaPcltfgzam8Pib83dbazcwfamcwf8Pib83dbaPcefhPkc3hzinazc98Smvamc:Cwfazfydbcbyd;u1jjbH:bjjjbbazc98fhzxbkkcbh3a8Uaq9pmbamydwaCaiaQcx2fgsydbcetf8Vebcs4aCascwfydbcetf8Vebcs4faCasclfydbcetf8Vebcs4ffaw9nmekcbhscbhAdna81TmbcbhAamczfhXinamczfaAcdtfaXydbgLBdbaXclfhXaAaYaLfRbbTfhAa81cufg81mbkkamydwhlamydbhXam9cu83i:GDam9cu83i:ODam9cu83i:qDam9cu83i:yDaAc;8eaAclfc:bd6Eh81inamcjDfasfcFFF;7rBdbasclfgscz9hmbka81cdthBdnalTmbaeaXcdtfhocbhrindnazaoarcdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAcuhLcuhsinazaiaAydbgKcx2fgXclfydbcdtfydbazaXydbcdtfydbfazaXcwfydbcdtfydbfgXasaXas6gXEhsaKaLaXEhLaAclfhAavcufgvmbkaLcuSmba8AaLcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEcbhAindndnasamc:qDfaAfgvydbgX6mbasaX9hmeaEamcjDfaAfIdb9FTmekavasBdbamc:GDfaAfaLBdbamcjDfaAfaEUdbxdkaAclfgAcz9hmbkkarcefgral9hmbkkamczfaBfhLcbhscbhAindnamc:GDfasfydbgXcuSmbaLaAcdtfaXBdbaAcefhAkasclfgscz9hmbkaAa81fg81TmbJFFuuhhcuhKamczfhsa81hvcuhLina8AasydbgXcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEdndnazaiaXcx2fgAclfydbcdtfydbazaAydbcdtfydbfazaAcwfydbcdtfydbfgAaL6mbaAaL9hmeaEah9DTmekaEhhaAhLaXhKkasclfhsavcufgvmbkaKcuSmbaKhQkdnamaiaQcx2fgrydbarclfydbarcwfydbaCabaeadaPawaqa3z:fjjjbTmbaPcefhPJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80kcbhXinaOaHaraXcdtfydbcdtgAfydbcdtfgKhsazaAfgvydbgLhAdnaLTmbdninasydbaQSmeasclfhsaAcufgATmdxbkkasaKaLcdtfc98fydbBdbavavydbcufBdbkaXcefgXci9hmbka8AaQcK2fgsIdbhEasIdlhhasIdwh8KasIdxh8EasIdzh5asIdCh8FaYaQfce86bba80a8FMh80a8Za5Mh8Za8Ya8EMh8Ya8Xa8KMh8Xa8WahMh8Wa8VaEMh8Vamydxh8Uxbkkamc:WDf8KjjjjbaPk;Vvivuv99lu8Jjjjjbca9Rgv8Kjjjjbdndnalcw0mbaiydbhoaeabcitfgralcdtcufBdlaraoBdbdnalcd6mbaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkkalabfhrxekcbhDavczfcwfcbBdbav9cb83izavcwfcbBdbav9cb83ibJbbjZhqJbbjZhkinadaiaDcdtfydbcK2fhwcbhrinavczfarfgoawarfIdbgxaoIdbgm:tgPakNamMgmUdbavarfgoaPaxam:tNaoIdbMUdbarclfgrcx9hmbkJbbjZaqJbbjZMgq:vhkaDcefgDal9hmbkcbhoadcbcecdavIdlgxavIdwgm9GEgravIdbgPam9GEaraPax9GEgscdtgrfhzavczfarfIdbhxaihralhwinaiaocdtfgDydbhHaDarydbgOBdbaraHBdbarclfhraoazaOcK2fIdbax9Dfhoawcufgwmbkaeabcitfhrdndnaocv6mbaoalc98f6mekaraiydbBdbaralcdtcufBdlaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkalabfhrxekaraxUdbararydlc98GasVBdlabcefaeadaiaoz:djjjbhwararydlciGawabcu7fcdtVBdlawaeadaiaocdtfalao9Rz:djjjbhrkavcaf8Kjjjjbark:;idiud99dndnabaecitfgwydlgDciGgqciSmbinabcbaDcd4gDalaqcdtfIdbawIdb:tgkJbbbb9FEgwaecefgefadaialavaoarz:ejjjbak:larIdb9FTmdabawaD7aefgecitfgwydlgDciGgqci9hmbkkabaecitfgeclfhbdnavmbcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdwalIdw:tgkakNaqIdbalIdb:tgkakNaqIdlalIdl:tgkakNMM:rgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbxdkkcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdbalIdb:t:lgkaqIdlalIdl:t:lgxakax9EEgkaqIdwalIdw:t:lgxakax9EEgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbkkk;llevudnabydwgxaladcetfgm8Vebcs4alaecetfgP8Vebgscs4falaicetfgz8Vebcs4ffaD0abydxaq9pVakVgDce9hmbavawcltfgxab8Pdb83dbaxcwfabcwfgx8Pdb83dbdnaxydbgqTmbaoabydbcdtfhxaqhsinalaxydbcetfcFFi87ebaxclfhxascufgsmbkkdnabydxglci2gsabydlgxfgkciGTmbarakfcbalaxcu7fciGcefz:njjjb8Aabydxci2hsabydlhxabydwhqkab9cb83dwababydbaqfBdbabascifc98GaxfBdlaP8Vebhscbhxkdnascztcz91cu9kmbabaxcefBdwaPax87ebaoabydbcdtfaxcdtfaeBdbkdnam8Uebcu9kmbababydwgxcefBdwamax87ebaoabydbcdtfaxcdtfadBdbkdnaz8Uebcu9kmbababydwgxcefBdwazax87ebaoabydbcdtfaxcdtfaiBdbkarabydlfabydxci2faPRbb86bbarabydlfabydxci2fcefamRbb86bbarabydlfabydxci2fcdfazRbb86bbababydxcefBdxaDk8LbabaeadaialavaoarawaDaDaqJbbbbz:cjjjbk;Nkovud99euv99eul998Jjjjjbc:W;ae9Rgo8KjjjjbdndnadTmbavcd4hrcbhwcbhDindnaiaeclfydbar2cdtfgvIdbaiaeydbar2cdtfgqIdbgk:tgxaiaecwfydbar2cdtfgmIdlaqIdlgP:tgsNamIdbak:tgzavIdlaP:tgPN:tgkakNaPamIdwaqIdwgH:tgONasavIdwaH:tgHN:tgPaPNaHazNaOaxN:tgxaxNMM:rgsJbbbb9Bmbaoc:W:qefawcx2fgAakas:vUdwaAaxas:vUdlaAaPas:vUdbaoc8Wfawc8K2fgAaq8Pdb83dbaAav8Pdb83dxaAam8Pdb83dKaAcwfaqcwfydbBdbaAcCfavcwfydbBdbaAcafamcwfydbBdbawcefhwkaecxfheaDcifgDad6mbkab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbawTmeaocbBd8Sao9cb83iKao9cb83izaoczfaoc8Wfawci2cxaoc8Sfcbcrz1jjjbaoIdKhCaoIdChXaoIdzhQao9cb83iwao9cb83ibaoaoc:W:qefawcxaoc8Sfcbciz1jjjbJbbjZhkaoIdwgPJbbbbJbbjZaPaPNaoIdbgPaPNaoIdlgsasNMM:rgx:vaxJbbbb9BEgzNhxasazNhsaPazNhzaoc:W:qefheawhvinaecwfIdbaxNaeIdbazNasaeclfIdbNMMgPakaPak9DEhkaecxfheavcufgvmbkabaCUdwabaXUdlabaQUdbabaoId3UdxdndnakJ;n;m;m899FmbJbbbbhPaoc:W:qefheaoc8WfhvinaCavcwfIdb:taecwfIdbgHNaQavIdb:taeIdbgONaXavclfIdb:taeclfIdbgLNMMaxaHNazaONasaLNMM:vgHaPaHaP9EEhPavc8KfhvaecxfheawcufgwmbkabaxUd8KabasUdaabazUd3abaCaxaPN:tUdKabaXasaPN:tUdCabaQazaPN:tUdzabJbbjZakakN:t:rgkUdydndnaxJbbj:;axJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;axJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohexekcjjjj94hekabae86b8UdndnasJbbj:;asJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;asJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkabav86bRdndnazJbbj:;azJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;azJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohqxekcjjjj94hqkabaq86b8SdndnaecKtcK91:YJbb;:9c:vax:t:lavcKtcK91:YJbb;:9c:vas:t:laqcKtcK91:YJbb;:9c:vaz:t:lakMMMJbb;:9cNJbbjZMgk:lJbbb9p9DTmbak:Ohexekcjjjj94hekaecFbaecFb9iEhexekabcjjj;8iBdycFbhekabae86b8Vxekab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbkaoc:W;aef8Kjjjjbk;Iwwvul99iud99eue99eul998Jjjjjbcje9Rgr8Kjjjjbavcd4hwaicd4hDdndnaoTmbarc;abfcbaocdtgvz:njjjb8Aarc;Gbfcbavz:njjjb8AarhvarcafhiaohqinavcFFF97BdbaicFFF;7rBdbaiclfhiavclfhvaqcufgqmbkdnadTmbcbhkinaeakaD2cdtfgvIdwhxavIdlhmavIdbhPalakaw2cdtfIdbhsarc;abfhzarhiarc;GbfhHarcafhqcj1jjbhvaohOinasavcwfIdbaxNavIdbaPNavclfIdbamNMMgAMhCakhXdnaAas:tgAaqIdbgQ9DgLmbaHydbhXkaHaXBdbakhXdnaCaiIdbgK9EmbazydbhXaKhCkazaXBdbaiaCUdbaqaAaQaLEUdbavcxfhvaqclfhqaHclfhHaiclfhiazclfhzaOcufgOmbkakcefgkad9hmbkkadThkJbbbbhCcbhXarc;abfhvarc;Gbfhicbhqinalavydbgzaw2cdtfIdbalaiydbgHaw2cdtfIdbaeazaD2cdtfgzIdwaeaHaD2cdtfgHIdw:tgsasNazIdbaHIdb:tgsasNazIdlaHIdl:tgsasNMM:rMMgsaCasaC9EgzEhCaqaXazEhXaiclfhiavclfhvaoaqcefgq9hmbkaCJbbbZNhKxekadThkcbhXJbbbbhKkJbbbbhCdnaearc;abfaXcdtgifydbgqaD2cdtfgvIdwaearc;GbfaifydbgzaD2cdtfgiIdwgm:tgsasNavIdbaiIdbgY:tgAaANavIdlaiIdlgP:tgQaQNMM:rgxJbbbb9ETmbaxalaqaw2cdtfIdbMalazaw2cdtfIdb:taxaxM:vhCkasaCNamMhmaQaCNaPMhPaAaCNaYMhYdnakmbaDcdthvawcdthiindnalIdbg8AaecwfIdbam:tgCaCNaeIdbaY:tgsasNaeclfIdbaP:tgAaANMM:rgQMgEaK9ETmbJbbbbhxdnaQJbbbb9ETmbaEaK:taQaQM:vhxkaxaCNamMhmaxaANaPMhPaxasNaYMhYa8AaKaQMMJbbbZNhKkaeavfhealaifhladcufgdmbkkabaKUdxabamUdwabaPUdlabaYUdbarcjef8Kjjjjbkjeeiu8Jjjjjbcj8W9Rgr8Kjjjjbaici2hwdnaiTmbawceawce0EhDarhiinaiaeadRbbcdtfydbBdbadcefhdaiclfhiaDcufgDmbkkabarawaladaoz:hjjjbarcj8Wf8Kjjjjbk:3lequ8JjjjjbcjP9Rgl8Kjjjjbcbhvalcjxfcbaiz:njjjb8AdndnadTmbcjehoaehrincuhwarhDcuhqavhkdninawakaoalcjxfaDcefRbbfRbb9RcFeGci6aoalcjxfaDRbbfRbb9RcFeGci6faoalcjxfaDcdfRbbfRbb9RcFeGci6fgxaq9mgmEhwdnammbaxce0mdkaxaqaxaq9kEhqaDcifhDadakcefgk9hmbkkaeawci2fgDcdfRbbhqaDcefRbbhxaDRbbhkaeavci2fgDcifaDawav9Rci2z:qjjjb8Aakalcjxffaocefgo86bbaxalcjxffao86bbaDcdfaq86bbaDcefax86bbaDak86bbaqalcjxffao86bbarcifhravcefgvad9hmbkalcFeaicetz:njjjbhoadci2gDceaDce0EhqcbhxindnaoaeRbbgkcetfgw8UebgDcu9kmbawax87ebaocjlfaxcdtfabakcdtfydbBdbaxhDaxcefhxkaeaD86bbaecefheaqcufgqmbkaxcdthDxekcbhDkabalcjlfaDz:mjjjb8AalcjPf8Kjjjjbk9teiucbcbyd;C1jjbgeabcifc98GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;C1jjbgeabcrfc94GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;C1jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;C1jjbfgdBd;C1jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk:;Deludndndnadch9pmbabaeSmdaeabadfgi9Rcbadcet9R0mekabaead;8qbbxekaeab7ciGhldndndnabae9pmbdnalTmbadhvabhixikdnabciGmbadhvabhixdkadTmiabaeRbb86bbadcufhvdnabcefgiciGmbaecefhexdkavTmiabaeRbe86beadc9:fhvdnabcdfgiciGmbaecdfhexdkavTmiabaeRbd86bdadc99fhvdnabcifgiciGmbaecifhexdkavTmiabaeRbi86biabclfhiaeclfheadc98fhvxekdnalmbdnaiciGTmbadTmlabadcufgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc9:fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc99fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc98fgdfaeadfRbb86bbkadcl6mbdnadc98fgocd4cefciGgiTmbaec98fhlabc98fhvinavadfaladfydbBdbadc98fhdaicufgimbkkaocx6mbaec9Wfhvabc9WfhoinaoadfgicxfavadfglcxfydbBdbaicwfalcwfydbBdbaiclfalclfydbBdbaialydbBdbadc9Wfgdci0mbkkadTmdadhidnadciGglTmbaecufhvabcufhoadhiinaoaifavaifRbb86bbaicufhialcufglmbkkadcl6mdaec98fhlabc98fhvinavaifgecifalaifgdcifRbb86bbaecdfadcdfRbb86bbaecefadcefRbb86bbaeadRbb86bbaic98fgimbxikkavcl6mbdnavc98fglcd4cefcrGgdTmbavadcdt9RhvinaiaeydbBdbaeclfheaiclfhiadcufgdmbkkalc36mbinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaiaeydzBdzaiaeydCBdCaiaeydKBdKaiaeyd3Bd3aecafheaicafhiavc9Gfgvci0mbkkavTmbdndnavcrGgdmbavhlxekavc94GhlinaiaeRbb86bbaicefhiaecefheadcufgdmbkkavcw6mbinaiaeRbb86bbaiaeRbe86beaiaeRbd86bdaiaeRbi86biaiaeRbl86blaiaeRbv86bvaiaeRbo86boaiaeRbr86braicwfhiaecwfhealc94fglmbkkabkk9Tdbcjwk9ubbjZbbbbbbbbbbbbbbjZbbbbbbbbbbbbbbjZ86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;bc;uwkxebbbdbbb9GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(h){a=h.instance,a.exports.__wasm_call_ctors()});function r(h){for(var l=new Uint8Array(h.length),m=0;m<h.length;++m){var f=h.charCodeAt(m);l[m]=f>96?f-97:f>64?f-39:f+4}for(var p=0,m=0;m<h.length;++m)l[p++]=l[m]<60?e[l[m]]:(l[m]-60)*64+l[++m];return l.buffer.slice(0,p)}function n(h){if(!h)throw new Error("Assertion failed")}function i(h){return new Uint8Array(h.buffer,h.byteOffset,h.byteLength)}var o=48,c=16;function d(h,l){var m=h.meshlets[l*4+0],f=h.meshlets[l*4+1],p=h.meshlets[l*4+2],y=h.meshlets[l*4+3];return{vertices:h.vertices.subarray(m,m+p),triangles:h.triangles.subarray(f,f+y*3)}}function u(h,l,m,f,p,y,E){var T=a.exports.sbrk,I=a.exports.meshopt_buildMeshletsBound(h.length,p,y),M=T(I*c),R=T(I*p*4),A=T(I*y*3),S=T(h.byteLength),B=T(l.byteLength),P=new Uint8Array(a.exports.memory.buffer);P.set(i(h),S),P.set(i(l),B);var F=a.exports.meshopt_buildMeshlets(M,R,A,S,h.length,B,m,f,p,y,E);P=new Uint8Array(a.exports.memory.buffer);for(var L=P.subarray(M,M+F*c),X=new Uint32Array(L.buffer,L.byteOffset,L.byteLength/4).slice(),ee=0;ee<F;++ee){var re=X[ee*4+0],_e=X[ee*4+1],m=X[ee*4+2],ce=X[ee*4+3];a.exports.meshopt_optimizeMeshlet(R+re*4,A+_e,ce,m)}var Ne=X[(F-1)*4+0],Pe=X[(F-1)*4+1],ge=X[(F-1)*4+2],Ve=X[(F-1)*4+3],De=Ne+ge,at=Pe+(Ve*3+3&-4),Gt={meshlets:X,vertices:new Uint32Array(P.buffer,R,De).slice(),triangles:new Uint8Array(P.buffer,A,at*3).slice(),meshletCount:F};return T(M-T(0)),Gt}function b(h){var l=new Float32Array(a.exports.memory.buffer,h,o/4);return{centerX:l[0],centerY:l[1],centerZ:l[2],radius:l[3],coneApexX:l[4],coneApexY:l[5],coneApexZ:l[6],coneAxisX:l[7],coneAxisY:l[8],coneAxisZ:l[9],coneCutoff:l[10]}}function w(h,l,m,f){var p=a.exports.sbrk,y=[],E=p(l.byteLength),T=p(h.vertices.byteLength),I=p(h.triangles.byteLength),M=p(o),R=new Uint8Array(a.exports.memory.buffer);R.set(i(l),E),R.set(i(h.vertices),T),R.set(i(h.triangles),I);for(var A=0;A<h.meshletCount;++A){var S=h.meshlets[A*4+0],B=h.meshlets[A*4+0+1],P=h.meshlets[A*4+0+3];a.exports.meshopt_computeMeshletBounds(M,T+S*4,I+B,P,E,m,f),y.push(b(M))}return p(E-p(0)),y}function v(h,l,m,f){var p=a.exports.sbrk,y=p(o),E=p(h.byteLength),T=p(l.byteLength),I=new Uint8Array(a.exports.memory.buffer);I.set(i(h),E),I.set(i(l),T),a.exports.meshopt_computeClusterBounds(y,E,h.length,T,m,f);var M=b(y);return p(y-p(0)),M}return{ready:s,supported:!0,buildMeshlets:function(h,l,m,f,p,y){n(h.length%3==0),n(l instanceof Float32Array),n(l.length%m==0),n(m>=3),n(f<=256||f>0),n(p<=512),n(p%4==0),y=y||0;var E=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h);return u(E,l,l.length/m,m*4,f,p,y)},computeClusterBounds:function(h,l,m){n(h.length%3==0),n(h.length/3<=512),n(l instanceof Float32Array),n(l.length%m==0),n(m>=3);var f=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h);return v(f,l,l.length/m,m*4)},computeMeshletBounds:function(h,l,m){return n(h.meshletCount!=0),n(l instanceof Float32Array),n(l.length%m==0),n(m>=3),w(h,l,l.length/m,m*4)},extractMeshlet:function(h,l){return n(l>=0&&l<h.meshletCount),d(h,l)}}})();var xf=new Dn().registerExtensions([cr,lr,dr]).registerDependencies({"meshopt.decoder":ur});async function Ke(t,e={}){await ur.ready;let a;if(e.fetchBytes)a=new Uint8Array(await e.fetchBytes(t));else{let c=await fetch(t,{cache:e.fetchCache||"no-store"});if(!c.ok)throw new Error(`Failed to load ${t}: ${c.status}`);a=new Uint8Array(await c.arrayBuffer())}let s=await xf.readBinary(a),r=[],n=e.componentFeatures||new Map,i=new Map;function o(c,d=""){let u=n.has(c.getName());u&&i.set(c.getName(),(i.get(c.getName())||0)+1);let b=u?c.getName():d,w=c.getMesh();if(w){let v=c.getWorldMatrix();for(let h of w.listPrimitives()){let l=h.getAttribute("POSITION"),m=h.getAttribute("NORMAL"),f=h.getAttribute("_FEATURE_ID_0"),p=h.getAttribute("_FEATURE_ID_1"),y=h.getIndices()?.getArray();if(!l||!y)continue;let E=l.getCount(),T=new Float32Array(E*3),I=new Float32Array(E*3),M=new Uint32Array(E),R=new Uint32Array(E),A=[1/0,1/0,1/0,-1/0,-1/0,-1/0],S=[],B=n.get(b)?.featureId||e.defaultFeatureId||0;for(let F=0;F<E;F+=1)l.getElement(F,S),vf(T,F*3,S,v),A[0]=Math.min(A[0],T[F*3]),A[1]=Math.min(A[1],T[F*3+1]),A[2]=Math.min(A[2],T[F*3+2]),A[3]=Math.max(A[3],T[F*3]),A[4]=Math.max(A[4],T[F*3+1]),A[5]=Math.max(A[5],T[F*3+2]),m?(m.getElement(F,S),wf(I,F*3,S,v)):I.set([0,0,1],F*3),M[F]=Number(f?.getScalar(F)||0),R[F]=Number(p?p.getScalar(F)||0:B);let P=h.getMaterial();r.push({position:T,normal:I,netId:M,objectFeatureId:R,indices:y,designator:b,nodeName:c.getName(),meshName:w.getName(),bounds:A,material:P?{name:P.getName(),baseColor:P.getBaseColorFactor(),metallic:P.getMetallicFactor(),roughness:P.getRoughnessFactor(),emissive:P.getEmissiveFactor()}:{baseColor:e.baseColor||[.55,.58,.64,1],metallic:.05,roughness:.72,emissive:[0,0,0]}})}}for(let v of c.listChildren())o(v,b)}for(let c of s.getRoot().listScenes())for(let d of c.listChildren())o(d);return{byteLength:a.byteLength,primitives:r,componentNodeCounts:i}}function vf(t,e,a,s){let r=s[0]*a[0]+s[4]*a[1]+s[8]*a[2]+s[12],n=s[1]*a[0]+s[5]*a[1]+s[9]*a[2]+s[13],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2]+s[14];t[e]=r,t[e+1]=-i,t[e+2]=n}function wf(t,e,a,s){let r=s[0]*a[0]+s[4]*a[1]+s[8]*a[2],n=s[1]*a[0]+s[5]*a[1]+s[9]*a[2],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2],o=Math.hypot(r,n,i)||1;t[e]=r/o,t[e+1]=-i/o,t[e+2]=n/o}var ha=`
struct Occurrence {
  model: mat4x4f,
  normal: mat4x4f,
};
@group(0) @binding(5) var<storage, read> occurrences: array<Occurrence>;
// The cull pass (SB2-25) lists the occurrences to draw, interleaved by level of
// detail: slot * 3 + list. Components draw for LIST_FULL; board, copper and
// barrels for LIST_BOARD (full or board); the stand-in box for LIST_BOX.
@group(0) @binding(7) var<storage, read> visibleOccurrences: array<u32>;
const LIST_FULL = 0u;
const LIST_BOARD = 1u;
const LIST_BOX = 2u;
fn listedOccurrence(list: u32, instance: u32) -> u32 { return visibleOccurrences[instance * 3u + list]; }
`,Yt=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);function Ef(t){let e=t?.matrix??t;if(!e||typeof e.length!="number"||e.length!==16)throw new TypeError("An occurrence matrix must have 16 numbers (column-major)");let a=Array.from(e,Number);if(!a.every(Number.isFinite))throw new TypeError("An occurrence matrix must be finite");if(a[3]!==0||a[7]!==0||a[11]!==0||a[15]!==1)throw new TypeError("An occurrence matrix must be affine (last row 0 0 0 1)");return a}function Tf(t){let[e,a,s,,r,n,i,,o,c,d]=t,u=n*d-c*i,b=c*s-a*d,w=a*i-n*s,v=o*i-r*d,h=e*d-o*s,l=r*s-e*i,m=r*c-o*n,f=o*a-e*c,p=e*n-r*a,y=e*u+r*b+o*w;if(y===0)throw new TypeError("An occurrence matrix must be invertible");let E=y<0?-1:1;return[E*u,E*v,E*m,0,E*b,E*h,E*f,0,E*w,E*l,E*p,0,0,0,0,1]}function hr(t){let e=new Float32Array(Math.max(1,t.length)*32);return t.forEach((a,s)=>{let r=s*32;e.set(a,r),e.set(Tf(a),r+16)}),e}function ui(t){let e=new ArrayBuffer(Math.max(1,t.length)*48),a=new DataView(e);return t.forEach((s,r)=>{let n=r*48;a.setFloat32(n,s.centerMm[0]/1e3,!0),a.setFloat32(n+4,-s.centerMm[1]/1e3,!0),a.setFloat32(n+8,Math.min(s.drillWidthMm,s.drillHeightMm)/2e3,!0),a.setFloat32(n+12,Math.max(s.outerWidthMm,s.outerHeightMm)/2e3,!0),a.setFloat32(n+16,s.startZMm/1e3,!0),a.setFloat32(n+20,s.endZMm/1e3,!0),a.setUint32(n+32,s.netId||0,!0),a.setUint32(n+36,s.objectFeatureId||0,!0),a.setUint32(n+40,s.startLayerId||0,!0),a.setUint32(n+44,s.endLayerId||0,!0)}),e}function ba(t,e){let[a,s,r]=e;return[t[0]*a+t[4]*s+t[8]*r+t[12],t[1]*a+t[5]*s+t[9]*r+t[13],t[2]*a+t[6]*s+t[10]*r+t[14]]}function Ot(t,e){if(!e)return null;let a=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let s=0;s<8;s+=1){let r=ba(t,[e[s&1?3:0],e[s&2?4:1],e[s&4?5:2]]);for(let n=0;n<3;n+=1)a[n]=Math.min(a[n],r[n]),a[n+3]=Math.max(a[n+3],r[n])}return a}function fi(t,e){if(!e||!t.length)return e||null;if(t.length===1&&pa(t[0]))return e;let a=t.map(s=>Ot(s,e));return[0,1,2,3,4,5].map(s=>s<3?Math.min(...a.map(r=>r[s])):Math.max(...a.map(r=>r[s])))}function pa(t){return t.every((e,a)=>e===Yt[a])}var kf=0,fr=4294901760,Mf=fr-1;function hi(t,e){let a=t>>>0,s=e>>>0;return a===kf?{kind:"none",occurrenceIndex:-1,featureId:0}:a>=fr?{kind:"gizmo",occurrenceIndex:-1,featureId:0,gizmoPart:a-fr,gizmoValue:s}:{kind:s?"feature":"board",occurrenceIndex:a-1,featureId:s}}function bi(t){let e=Array.from(t);if(e.length>Mf)throw new RangeError("Too many occurrences for the pick target");let a=e.map(Ef),s=e.map((r,n)=>r&&!Array.isArray(r)&&!ArrayBuffer.isView(r)&&r.key!=null?String(r.key):String(n));if(new Set(s).size!==s.length)throw new TypeError("Occurrence keys must be unique");return{matrices:a,keys:s}}function Pt(t,e,a){let[s,r,n]=e,i=t[0]*s+t[4]*r+t[8]*n+t[12],o=t[1]*s+t[5]*r+t[9]*n+t[13],c=t[2]*s+t[6]*r+t[10]*n+t[14],d=t[3]*s+t[7]*r+t[11]*n+t[15];return!(d>0)||c<0||c>d?null:{x:a.x+(i/d*.5+.5)*a.width,y:a.y+(.5-o/d*.5)*a.height}}var pi=0;var gi=2;var rs=Object.freeze({fullPx:140,boxPx:18,keep:.8});function mi(t){let e=c=>[t[c],t[4+c],t[8+c],t[12+c]],[a,s,r,n]=[e(0),e(1),e(2),e(3)],i=(c,d)=>c.map((u,b)=>u+d[b]),o=(c,d)=>c.map((u,b)=>u-d[b]);return[i(n,a),o(n,a),i(n,s),o(n,s),r,o(n,r)]}var br=`
fn featureHidden(id: u32) -> bool {
  return id < arrayLength(&hiddenMask) && hiddenMask[id] == 0u;
}
`;function ns(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function yi(t,e=0){let a=0;for(let n of ns(t))a=Math.max(a,n);let s=64,r=a+1;for(;s<r;)s*=2;return Math.max(s,Math.floor(e)||0)}function xi(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(1);for(let r of ns(t))r<a&&(s[r]=0);return s}var vi=40,Xe=256,wi=112,Mt="rg32uint",$t=Xe/4,_f=256,Nf={compare:"always",passOp:"zero"},Ff={compare:"always",passOp:"replace"},jf={compare:"not-equal",passOp:"keep"},Bf={compare:"equal",passOp:"keep"},ki=`
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
${br}
${Hs}
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
`,Mi=`
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
${br}
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
  @location(0) @interpolate(flat) objectId: u32,
};
@vertex fn vs(input: Input) -> Output {
  var output: Output;
  output.position = globals.viewProjection * vec4f(input.position + draw.offset.xyz, 1.0);
  output.objectId = input.objectId;
  return output;
}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  if (u32(draw.flags.x) == 2u && featureHidden(input.objectId)) { discard; }
  return vec2u(1u, input.objectId);
}
`,Ii=`
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
${Hs}
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
`,Ri=`
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
  output.visible = 0u;
  if (globals.selectedLayer == 0u || (globals.selectedLayer >= input.ids.z && globals.selectedLayer <= input.ids.w)) {
    output.visible = 1u;
  }
  return output;
}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  if (input.visible == 0u) { discard; }
  return vec2u(1u, input.objectId);
}
`;function pr(t,e){return e.reduce((a,[s,r])=>{if(a.split(s).length!==2)throw new Error(`Shader variant anchor not found once: ${s.slice(0,60)}`);return a.replace(s,()=>r)},t)}var gr=[`  padding0: u32,
  padding1: u32,`,`  selectedOccurrence: u32,
  occurrenceBase: u32,`],Si=[["  padding2: u32,","  emphasisStride: u32,"],["fn netEmphasized(id: u32) -> bool {",`${on}fn netEmphasized(id: u32) -> bool {`]],Ai=pr(ki,[gr,[`  @location(3) world: vec3f,
};`,`  @location(3) world: vec3f,
  @location(4) @interpolate(flat) occurrence: u32,
};`],[`@vertex fn vs(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.world = input.position + draw.offset.xyz;
  output.position = globals.viewProjection * vec4f(output.world, 1.0);
  output.normal = normalize(input.normal);`,`${ha}
@vertex fn vs(input: VertexInput, @builtin(instance_index) instance: u32) -> VertexOutput {
  // Full-detail draws (components; inner copper behind an opaque board) list only
  // occurrences at full detail (draw.material.w = 1); the rest list full or board.
  let index = listedOccurrence(select(LIST_BOARD, LIST_FULL, draw.material.w > 0.5), instance);
  let occurrence = occurrences[index];
  var output: VertexOutput;
  output.world = (occurrence.model * vec4f(input.position + draw.offset.xyz, 1.0)).xyz;
  output.position = globals.viewProjection * vec4f(output.world, 1.0);
  output.normal = normalize((occurrence.normal * vec4f(input.normal, 0.0)).xyz);
  output.occurrence = index + 1u + globals.occurrenceBase;`],[`  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);
  let selectedComponent = component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;`,`  // The inspected selection lights its own copy; host-highlighted nets light every copy.
  let here = input.occurrence == globals.selectedOccurrence;
  let mark = emphasisOf(input.occurrence, input.netId);
  let selected = mark != 0u || (here && globals.activeNet != 0u && input.netId == globals.activeNet);
  let selectedComponent = here && component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;`],...Si,["      base = vec3f(0.08, 1.0, 0.2) * pulse;","      base = emphasisColor(mark, vec3f(0.08, 1.0, 0.2)) * pulse;"]]),_i=pr(Mi,[gr,[`  @location(0) @interpolate(flat) objectId: u32,
};`,`  @location(0) @interpolate(flat) objectId: u32,
  @location(1) @interpolate(flat) occurrence: u32,
};`],[`@vertex fn vs(input: Input) -> Output {
  var output: Output;
  output.position = globals.viewProjection * vec4f(input.position + draw.offset.xyz, 1.0);`,`${ha}
@vertex fn vs(input: Input, @builtin(instance_index) instance: u32) -> Output {
  let index = listedOccurrence(select(LIST_BOARD, LIST_FULL, draw.material.w > 0.5), instance);
  let world = (occurrences[index].model * vec4f(input.position + draw.offset.xyz, 1.0)).xyz;
  var output: Output;
  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.occurrence = index + 1u + globals.occurrenceBase;`],["  return vec2u(1u, input.objectId);",`  let kind = u32(draw.flags.x);
  return vec2u(input.occurrence, select(input.objectId, 0u, kind == 0u));`]]),Cf=`struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
  @location(3) dimensions: vec4f,
  @location(4) span: vec2f,
  @location(5) ids: vec4u,
};`,Of=`struct Barrel {
  dimensions: vec4f,
  span: vec2f,
  ids: vec4u,
};
@group(0) @binding(6) var<storage, read> barrels: array<Barrel>;
${ha}
struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
};`;function Ni(t,e,a=[]){return pr(t,[gr,[Cf,Of],["@vertex fn vs(input: Input) -> Output {",`struct Record {
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
  let input = Record(vertex.unit, vertex.normal, vertex.radiusMix, barrel.dimensions, barrel.span, barrel.ids);`],[e,e.replace("vec4f(world, 1.0)","vec4f((occurrence.model * vec4f(world, 1.0)).xyz, 1.0)")],["  output.objectId = input.ids.y;",`  output.objectId = input.ids.y;
  output.occurrence = index + 1u + globals.occurrenceBase;`],...a])}var Fi=Ni(Ii,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.normal = input.normal;`,[[`  output.normal = input.normal;
  output.netId`,`  output.normal = (occurrence.normal * vec4f(input.normal, 0.0)).xyz;
  output.netId`],[`  @location(3) @interpolate(flat) visible: u32,
};`,`  @location(3) @interpolate(flat) visible: u32,
  @location(4) @interpolate(flat) occurrence: u32,
};`],["  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",`  let mark = emphasisOf(input.occurrence, input.netId);
  let selected = mark != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`],...Si,["      base = vec3f(0.1, 1.0, 0.22) * (","      base = emphasisColor(mark, vec3f(0.1, 1.0, 0.22)) * ("]]),ji=Ni(Ri,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.objectId`,[[`  @location(1) @interpolate(flat) visible: u32,
};`,`  @location(1) @interpolate(flat) visible: u32,
  @location(2) @interpolate(flat) occurrence: u32,
};`],["  return vec2u(1u, input.objectId);","  return vec2u(input.occurrence, input.objectId);"]]),Bi=`
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
${ha}
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
`,Ci=`${Bi}
@fragment fn fs(input: Output) -> @location(0) vec4f {
  let light = normalize(globals.lightDirection.xyz);
  return vec4f(draw.color.rgb * (0.45 + max(dot(normalize(input.normal), light), 0.0) * 0.55), 1.0);
}
`,Oi=`${Bi}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  return vec2u(input.occurrence, 0u);
}
`,Pi=`
struct Occurrence {
  model: mat4x4f,
  normal: mat4x4f,
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
  let fullPx = cull.lod.y;
  let boxPx = cull.lod.z;
  let keep = cull.lod.w;
  var lod = 2u;
  if (pixels >= fullPx) { lod = 0u; } else if (pixels >= boxPx) { lod = 1u; }
  if (previous == 0u && lod > 0u && pixels >= fullPx * keep) { lod = 0u; }
  if (previous <= 1u && lod == 2u && pixels >= boxPx * keep) { lod = 1u; }
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
  if (lod == 0u) { lists[atomicAdd(&counters[0], 1u) * 3u] = i; }
  if (lod <= 1u) { lists[atomicAdd(&counters[1], 1u) * 3u + 1u] = i; }
  if (lod == 2u) { lists[atomicAdd(&counters[2], 1u) * 3u + 2u] = i; }
}

@compute @workgroup_size(64) fn writeArgs(@builtin(global_invocation_id) id: vec3u) {
  let slot = id.x;
  if (slot >= cull.info.w) { return; }
  let full = atomicLoad(&counters[0]);
  let board = atomicLoad(&counters[1]);
  let box = atomicLoad(&counters[2]);
  let kind = classes[slot];
  var count = 0u;
  if (kind == 0u) { count = board; }
  else if (kind == 1u) { count = full; }
  else if (kind == 2u) { count = board * cull.extra.x; }
  else if (kind == 3u) { count = box; }
  args[slot * 5u + 1u] = count;
}
`,Ei=[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}],yy=Object.freeze({main:Ai,pick:_i,barrel:Fi,barrelPick:ji,box:Ci,boxPick:Oi,cull:Pi}),Dt=class t{static async create(e){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)throw new Error("No WebGPU adapter is available");let s=a.features.has("depth32float-stencil8"),r=await a.requestDevice(s?{requiredFeatures:["depth32float-stencil8"]}:void 0);return new t(e,r,{stencil:s})}constructor(e,a,{shareFrom:s=null,stencil:r=!1}={}){if(this.canvas=e,this.device=a,this.shareFrom=s,this.stencil=s?s.stencil:!!r,this.depthFormat=this.stencil?"depth32float-stencil8":"depth32float",this.version=0,this.barrelColor=[.55,.35,.16,.78],this.alwaysInstanced=!!s,this.occurrenceBase=0,s?(this.context=s.context,this.format=s.format):(a.addEventListener("uncapturederror",n=>{console.error(`Uncaptured WebGPU error: ${n.error?.message||n.error}`)}),a.lost.then(n=>{n.reason!=="destroyed"&&console.error(`WebGPU device lost: ${n.reason}`,n.message)}),this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"})),this.entries=[],this.barrels=null,this.drawSlotCapacity=_f,this.drawSlotBuffer=this.createDrawSlotBuffer(this.drawSlotCapacity),this.drawStaging=new Float32Array(this.drawSlotCapacity*$t),this.freeDrawSlots=[],this.nextDrawSlot=0,this.globalBuffer=a.createBuffer({size:wi,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.layerOffsetBuffer=a.createBuffer({size:1024,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.occurrenceMatrices=[[...Yt]],this.occurrenceKeys=["0"],this.identityOnly=!0,this.occurrenceCapacity=1,this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.device.queue.writeBuffer(this.occurrenceBuffer,0,hr(this.occurrenceMatrices)),this.barrelRecordBuffer=a.createBuffer({label:"barrel-records",size:48,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.instancedPipelines=null,this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.slotCapacity=0,this.slotArgs=new Uint32Array(0),this.slotClasses=new Uint32Array(0),this.freeSlots=[],this.nextSlot=2,this.argsBuffer=null,this.classesBuffer=null,this.growSlots(256),this.setSlot(0,0,4),this.setSlot(1,0,4),this.cull=null,this.box=null,this.boardBounds=null,this.selectedOccurrence=-1,this.lodOverride=null,this.lodThresholds={...rs},this.innerCopperAtFull=!0,this.cullCounts={full:0,board:0,box:0,culled:0},this.frameStats={triangles:0,draws:0},this.boxColor=[.24,.36,.28,1],s)for(let n of["bindGroupLayout","pipelineLayout","vertexBuffers","pipeline","pickPipeline","barrelPipeline","barrelPickPipeline","singlePipelines"])this[n]=s[n];else this.createSinglePipelines();this.depth=null,this.pickTexture=null,this.pickSerial=Promise.resolve(),this.bundleCache=new Map,this.globalScratch=new ArrayBuffer(wi),this.globalScratchF32=new Float32Array(this.globalScratch),this.globalScratchView=new DataView(this.globalScratch),this.barrelDrawScratch=new Float32Array(Xe/4),this.nextEntryId=1,this.hiddenFeatureIds=new Set,this.showPlaceholders=!0,this.featureMaskCapacity=64,this.featureMaskBuffer=this.createFeatureMaskBuffer(this.featureMaskCapacity),this.uploadFeatureMask(),this.emphasizedNetIds=new Set,this.occurrenceEmphasis=null,this.emphasisStride=0,this.dimCopper=!1,this.netMaskCapacity=64,this.netMaskBuffer=this.createNetMaskBuffer(this.netMaskCapacity),this.uploadNetMask(),s&&this.setOccurrences([])}createSinglePipelines(){let e=this.device;this.bindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:5,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:6,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:7,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]});let a=e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]});this.pipelineLayout=a;let s=this.vertexBuffers=[{arrayStride:vi,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"uint32"},{shaderLocation:3,offset:28,format:"uint32"},{shaderLocation:4,offset:32,format:"uint32"},{shaderLocation:5,offset:36,format:"uint32"}]}];this.singlePipelines={...this.makeMainPipelines(ki,""),pick:this.makePipeline(a,Mi,Mt,s,"pick"),barrel:this.makeBarrelPipeline(a,Ii,this.format,"barrel"),barrelPick:this.makeBarrelPipeline(a,Ri,Mt,"barrel-pick")},this.pipeline=this.singlePipelines.main,this.pickPipeline=this.singlePipelines.pick,this.barrelPipeline=this.singlePipelines.barrel,this.barrelPickPipeline=this.singlePipelines.barrelPick}makeMainPipelines(e,a){let s=this.pipelineLayout,r=this.vertexBuffers,n=(c,d)=>this.makePipeline(s,e,this.format,r,`${c}${a}`,d),i=n("main",{stencil:Nf}),o=n("main-blend");return{main:i,mark:this.stencil?n("main-mark",{stencil:Ff}):i,blend:o,mask:this.stencil?n("mask",{stencil:jf}):o,maskCovered:this.stencil?n("mask-covered",{stencil:Bf,constants:{COVERED:1}}):null}}createOccurrenceBuffer(e){return this.device.createBuffer({label:"occurrences",size:e*128,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createListBuffer(e){return this.device.createBuffer({label:"visible-occurrences",size:e*3*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}growSlots(e){let a=new Uint32Array(e*5);a.set(this.slotArgs);let s=new Uint32Array(e).fill(4);s.set(this.slotClasses),this.slotArgs=a,this.slotClasses=s,this.slotCapacity=e,this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.(),this.argsBuffer=this.device.createBuffer({label:"indirect-args",size:a.byteLength,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.classesBuffer=this.device.createBuffer({label:"draw-classes",size:s.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.argsBuffer,0,a),this.device.queue.writeBuffer(this.classesBuffer,0,s),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache?.clear()}setSlot(e,a,s){this.slotArgs.fill(0,e*5,e*5+5),this.slotArgs[e*5]=a,this.slotClasses[e]=s,this.device.queue.writeBuffer(this.argsBuffer,e*20,this.slotArgs,e*5,5),this.device.queue.writeBuffer(this.classesBuffer,e*4,this.slotClasses,e,1)}allocSlot(e,a){let s=this.freeSlots.length?this.freeSlots.pop():this.nextSlot++;return s>=this.slotCapacity&&this.growSlots(this.slotCapacity*2),this.setSlot(s,e,a),s}get occurrenceCount(){return this.occurrenceMatrices.length}setOccurrences(e){let{matrices:a,keys:s}=bi(e??[Yt]);this.occurrenceMatrices=a,this.occurrenceKeys=s,this.identityOnly=!this.alwaysInstanced&&a.length===1&&pa(a[0]),this.identityOnly||this.ensureInstancedPipelines(),a.length>this.occurrenceCapacity&&(this.occurrenceBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.occurrenceCapacity=Math.max(a.length,this.occurrenceCapacity*2),this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.cull&&(this.cull.lods.destroy(),this.cull.lods=this.createLodBuffer(this.occurrenceCapacity)),this.rebindAll()),a.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,hr(a)),this.cull&&this.device.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(3)),this.selectedOccurrence>=a.length&&(this.selectedOccurrence=-1),this.bundleCache.clear(),this.invalidate()}setInnerCopperAtFull(e){if(this.innerCopperAtFull!==e){this.innerCopperAtFull=e;for(let a of this.entries)a.innerCopper&&(a.drawClass=e?1:0,this.setSlot(a.slot,a.indexCount,a.drawClass));this.invalidate()}}setBoardBounds(e){this.boardBounds=e?[...e]:null,this.invalidate()}setLodOverride(e){this.lodOverride=e==null?null:Number(e),this.invalidate()}createLodBuffer(e){return this.device.createBuffer({label:"occurrence-lods",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createCull(){let e=this.device,a=this.shareFrom?.cull,s=i=>({visibility:GPUShaderStage.COMPUTE,buffer:{type:i}}),r=a?.layout||e.createBindGroupLayout({label:"cull",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,...s("read-only-storage")},{binding:2,...s("storage")},{binding:3,...s("storage")},{binding:4,...s("storage")},{binding:5,...s("storage")},{binding:6,...s("read-only-storage")}]}),n=a&&{layout:r,classify:a.classify,writeArgs:a.writeArgs};if(!n){let i=this.createShaderModule(Pi,"cull"),o=e.createPipelineLayout({bindGroupLayouts:[r]});n={layout:r,classify:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"classify"}}),writeArgs:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"writeArgs"}})}}this.cull={...n,uniform:e.createBuffer({label:"cull-params",size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),lods:this.createLodBuffer(this.occurrenceCapacity),counters:e.createBuffer({label:"cull-counters",size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),readback:e.createBuffer({label:"cull-readback",size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),scratch:new ArrayBuffer(192),reading:!1,readAt:0,bindGroup:null},e.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(3)),this.cull.bindGroup=this.makeCullBindGroup()}makeCullBindGroup(){return this.device.createBindGroup({layout:this.cull.layout,entries:[{binding:0,resource:{buffer:this.cull.uniform}},{binding:1,resource:{buffer:this.occurrenceBuffer}},{binding:2,resource:{buffer:this.cull.lods}},{binding:3,resource:{buffer:this.listBuffer}},{binding:4,resource:{buffer:this.cull.counters}},{binding:5,resource:{buffer:this.argsBuffer}},{binding:6,resource:{buffer:this.classesBuffer}}]})}createBox(){let e=[[[1,0,0],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[[-1,0,0],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],[[0,1,0],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[[0,0,1],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],[[0,0,-1],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]],a=[],s=[];e.forEach(([d,u],b)=>{for(let v of u)a.push(...v,...d);let w=b*4;s.push(w,w+1,w+2,w,w+2,w+3)});let r=new Float32Array(a),n=new Uint16Array(s),i=this.device.createBuffer({label:"box-vertices",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),o=this.device.createBuffer({label:"box-indices",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(i,0,r),this.device.queue.writeBuffer(o,0,n);let c=this.device.createBuffer({size:Xe,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.box={vertexBuffer:i,indexBuffer:o,indexCount:n.length,drawBuffer:c,bindGroup:this.makeBindGroup(c),scratch:new Float32Array(Xe/4)},this.setSlot(1,n.length,3)}writeBoxDraw(){let e=this.box.scratch,[a,s,r,n,i,o]=this.boardBounds;e.fill(0),e.set(this.boxColor,0),e.set([n-a,i-s,o-r,0],4),e.set([a,s,r,0],8),this.device.queue.writeBuffer(this.box.drawBuffer,0,e)}encodeCull(e,a){let s=this.cull,r=new Float32Array(s.scratch),n=new Uint32Array(s.scratch);r.fill(0),mi(a.matrix).forEach((h,l)=>r.set(h,l*4));let i=a.lod;i&&r.set([...i.eye,i.orthographic?0:1],24);let o=this.boardBounds||[-1e6,-1e6,-1e6,1e6,1e6,1e6];r.set([o[0],o[1],o[2],0,o[3],o[4],o[5],0],28);let{fullPx:c,boxPx:d,keep:u}=this.lodThresholds;r.set([i?.pixelScale||0,c,d,u],36);let b=this.lodOverride!=null?this.lodOverride+1:!i||!this.boardBounds?pi+1:0;n.set([this.occurrenceMatrices.length,this.selectedOccurrence+1,b,this.nextSlot],40),n[44]=this.barrels?.instanceCount||0,this.device.queue.writeBuffer(s.uniform,0,s.scratch),e.clearBuffer(s.counters);let w=e.beginComputePass({label:"cull"});w.setBindGroup(0,s.bindGroup),w.setPipeline(s.classify),w.dispatchWorkgroups(Math.ceil(this.occurrenceMatrices.length/64)),w.setPipeline(s.writeArgs),w.dispatchWorkgroups(Math.ceil(this.nextSlot/64)),w.end();let v=performance.now();return!s.reading&&v-s.readAt>250?(e.copyBufferToBuffer(s.counters,0,s.readback,0,16),s.readAt=v,!0):!1}readCullCounts(){let e=this.cull;e.reading=!0;let a=this.occurrenceMatrices.length;e.readback.mapAsync(GPUMapMode.READ).then(()=>{let[s,r,n]=new Uint32Array(e.readback.getMappedRange().slice(0));e.readback.unmap(),this.cullCounts={full:s,board:r-s,box:n,culled:Math.max(0,a-r-n)}}).catch(()=>{}).finally(()=>{e.reading=!1})}countFor(e){if(this.identityOnly)return e===2?this.barrels?.instanceCount||0:e===3?0:1;let{full:a,board:s,box:r}=this.cullCounts;return e===0?a+s:e===1?a:e===2?(a+s)*(this.barrels?.instanceCount||0):r}gpuMemoryBytes(){let e=0;for(let a of this.entries)e+=(a.vertexBuffer?.size||0)+(a.indexBuffer?.size||0);for(let a of[this.barrels?.vertexBuffer,this.barrels?.indexBuffer,this.barrels?.instanceBuffer,this.barrelRecordBuffer,this.occurrenceBuffer,this.listBuffer,this.argsBuffer,this.classesBuffer,this.featureMaskBuffer,this.netMaskBuffer,this.cull?.lods])e+=a?.size||0;return e+=this.canvas.width*this.canvas.height*12,e}ensureInstancedPipelines(){if(this.instancedPipelines)return;if(this.shareFrom){this.shareFrom.ensureInstancedPipelines(),this.instancedPipelines=this.shareFrom.instancedPipelines,this.createBox(),this.createCull();return}let e=this.pipelineLayout;this.instancedPipelines={...this.makeMainPipelines(Ai,"-instanced"),pick:this.makePipeline(e,_i,Mt,this.vertexBuffers,"pick-instanced"),barrel:this.makeBarrelPipeline(e,Fi,this.format,"barrel-instanced",!1),barrelPick:this.makeBarrelPipeline(e,ji,Mt,"barrel-pick-instanced",!1),box:this.makePipeline(e,Ci,this.format,Ei,"box"),boxPick:this.makePipeline(e,Oi,Mt,Ei,"box-pick")},this.createBox(),this.createCull()}drawSet(){return this.identityOnly?{pipelines:this.singlePipelines,indirect:!1,barrelInstances:this.barrels?.instanceCount||0}:{pipelines:this.instancedPipelines,indirect:!0,barrelInstances:0}}drawEntry(e,a,s){e.setBindGroup(0,a.bindGroup),e.setVertexBuffer(0,a.vertexBuffer),e.setIndexBuffer(a.indexBuffer,"uint32"),s?e.drawIndexedIndirect(this.argsBuffer,a.slot*20):e.drawIndexed(a.indexCount)}drawBarrels(e,a,s,r){e.setPipeline(a),e.setBindGroup(0,this.barrels.bindGroup),e.setVertexBuffer(0,this.barrels.vertexBuffer),e.setVertexBuffer(1,this.barrels.instanceBuffer),e.setIndexBuffer(this.barrels.indexBuffer,"uint16"),s?e.drawIndexedIndirect(this.argsBuffer,0):e.drawIndexed(this.barrels.indexCount,r)}drawBox(e,a){!this.box||!this.boardBounds||(this.writeBoxDraw(),e.setPipeline(a),e.setBindGroup(0,this.box.bindGroup),e.setVertexBuffer(0,this.box.vertexBuffer),e.setIndexBuffer(this.box.indexBuffer,"uint16"),e.drawIndexedIndirect(this.argsBuffer,20))}createNetMaskBuffer(e){return this.device.createBuffer({label:"net-emphasis-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}uploadNetMask(){let e;if(this.occurrenceEmphasis&&!this.identityOnly){let s=ln(this.occurrenceEmphasis);this.emphasisStride=s.stride,e=s.data}else this.emphasisStride=0,e=rn(this.emphasizedNetIds,this.netMaskCapacity);if(e.length>this.netMaskCapacity){this.netMaskBuffer?.destroy?.();let s=this.netMaskCapacity;for(;s<e.length;)s*=2;this.netMaskCapacity=s,this.netMaskBuffer=this.createNetMaskBuffer(s),this.rebindAll()}let a=new Uint32Array(this.netMaskCapacity);a.set(e),this.device.queue.writeBuffer(this.netMaskBuffer,0,a)}setOccurrenceEmphasis(e,{dimCopper:a=!1}={}){let s=Array.isArray(e)&&e.some(r=>r&&r.size);this.occurrenceEmphasis=s?e.map(r=>r&&r.size?new Map(r):null):null,this.dimCopper=!!a,this.uploadNetMask(),this.invalidate()}get netHighlightActive(){return!!(this.emphasizedNetIds.size||this.occurrenceEmphasis||this.dimCopper)}setEmphasizedNetIds(e){this.emphasizedNetIds=Ga(e),this.occurrenceEmphasis=null;let a=sn(this.emphasizedNetIds,this.netMaskCapacity);a!==this.netMaskCapacity&&(this.netMaskBuffer?.destroy?.(),this.netMaskCapacity=a,this.netMaskBuffer=this.createNetMaskBuffer(a),this.rebindAll()),this.uploadNetMask(),this.invalidate()}rebindAll(){for(let e of this.entries)e.bindGroup=this.makeBindGroup(this.drawSlotBuffer,e.drawSlot*Xe);this.barrels&&(this.barrels.bindGroup=this.makeBindGroup(this.barrels.drawBuffer)),this.box&&(this.box.bindGroup=this.makeBindGroup(this.box.drawBuffer)),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache.clear()}createFeatureMaskBuffer(e){return this.device.createBuffer({label:"feature-visibility-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createDrawSlotBuffer(e){return this.device.createBuffer({label:"draw-uniforms",size:e*Xe,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}allocateDrawSlot(){if(this.freeDrawSlots.length)return this.freeDrawSlots.pop();if(this.nextDrawSlot>=this.drawSlotCapacity){let e=this.drawSlotCapacity*2,a=new Float32Array(e*$t);a.set(this.drawStaging),this.drawSlotBuffer.destroy?.(),this.drawSlotCapacity=e,this.drawSlotBuffer=this.createDrawSlotBuffer(e),this.drawStaging=a,this.rebindAll()}return this.nextDrawSlot++}flushDraws(e){if(!e.length)return;let a=1/0,s=-1;for(let r of e)a=Math.min(a,r.drawSlot),s=Math.max(s,r.drawSlot);this.device.queue.writeBuffer(this.drawSlotBuffer,a*Xe,this.drawStaging,a*$t,(s-a+1)*$t)}invalidate(){this.version+=1}setBarrelColor(e){this.barrelColor=[...e],this.invalidate()}makeBindGroup(e,a=0){return this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e,offset:a,size:Xe}},{binding:2,resource:{buffer:this.layerOffsetBuffer}},{binding:3,resource:{buffer:this.featureMaskBuffer}},{binding:4,resource:{buffer:this.netMaskBuffer}},{binding:5,resource:{buffer:this.occurrenceBuffer}},{binding:6,resource:{buffer:this.barrelRecordBuffer}},{binding:7,resource:{buffer:this.listBuffer}}]})}uploadFeatureMask(){let e=xi(this.hiddenFeatureIds,this.featureMaskCapacity);this.device.queue.writeBuffer(this.featureMaskBuffer,0,e)}setHiddenFeatureIds(e){this.hiddenFeatureIds=ns(e);let a=yi(this.hiddenFeatureIds,this.featureMaskCapacity);a!==this.featureMaskCapacity&&(this.featureMaskBuffer?.destroy?.(),this.featureMaskCapacity=a,this.featureMaskBuffer=this.createFeatureMaskBuffer(a),this.rebindAll()),this.uploadFeatureMask(),this.bundleCache.clear(),this.invalidate()}depthStencilState(e=null){let a={format:this.depthFormat,depthWriteEnabled:!0,depthCompare:"greater"};return this.stencil&&e&&(a.stencilFront=e,a.stencilBack=e),a}makePipeline(e,a,s,r,n,i={}){let o=this.createShaderModule(a,n);return this.device.createRenderPipeline({layout:e,vertex:{module:o,entryPoint:"vs",buffers:r},fragment:{module:o,entryPoint:"fs",...i.constants?{constants:i.constants}:{},targets:[{format:s,blend:s===Mt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState(i.stencil),multisample:{count:1}})}makeBarrelPipeline(e,a,s,r,n=!0){let i=this.createShaderModule(a,r);return this.device.createRenderPipeline({layout:e,vertex:{module:i,entryPoint:"vs",buffers:[{arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32"}]},...n?[{arrayStride:40,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"float32x4"},{shaderLocation:4,offset:16,format:"float32x2"},{shaderLocation:5,offset:24,format:"uint32x4"}]}]:[]]},fragment:{module:i,entryPoint:"fs",targets:[{format:s,blend:s===Mt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState()})}createShaderModule(e,a){let s=this.device.createShaderModule({label:`pcb-${a}`,code:e});return typeof s.getCompilationInfo=="function"&&s.getCompilationInfo().then(r=>{let n=[...r.messages||[]];if(n.length){console.groupCollapsed(`WebGPU shader compilation info: pcb-${a}`);for(let i of n)console[i.type==="error"?"error":"warn"](`${i.type} ${i.lineNum}:${i.linePos} ${i.message}`);console.groupEnd()}}),s}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));this.canvas.width===a&&this.canvas.height===s||(this.canvas.width=a,this.canvas.height=s,this.depth?.destroy(),this.pickTexture?.destroy(),this.depth=this.device.createTexture({size:[a,s],format:this.depthFormat,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.pickTexture=this.device.createTexture({size:[a,s],format:Mt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}))}addPrimitive(e,a){let s=e.position.length/3,r=new ArrayBuffer(s*vi),n=new Float32Array(r),i=new Uint32Array(r);for(let h=0;h<s;h+=1){let l=h*10,m=h*3;n[l]=e.position[m],n[l+1]=e.position[m+1],n[l+2]=e.position[m+2],n[l+3]=e.normal[m],n[l+4]=e.normal[m+1],n[l+5]=e.normal[m+2],i[l+6]=e.netId[h]||0,i[l+7]=e.objectFeatureId[h]||0,i[l+8]=a.layerId||0,i[l+9]=a.materialId||0}let o=this.device.createBuffer({size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(o,0,r);let c=e.indices instanceof Uint32Array?e.indices:new Uint32Array(e.indices),d=this.device.createBuffer({size:c.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,c);let u=this.allocateDrawSlot(),b=this.makeBindGroup(this.drawSlotBuffer,u*Xe),w=a.kind==="component"||a.innerCopper&&this.innerCopperAtFull?1:0,v={...a,drawClass:w,slot:this.allocSlot(c.length,w),bounds:e.bounds||a.bounds||null,id:this.nextEntryId++,vertexBuffer:o,indexBuffer:d,indexCount:c.length,drawSlot:u,bindGroup:b};return this.entries.push(v),this.bundleCache.clear(),this.invalidate(),v}removeEntries(e){if(!e?.length)return;let a=new Set(e.map(s=>s.id));for(let s of e)s.vertexBuffer?.destroy?.(),s.indexBuffer?.destroy?.(),this.freeDrawSlots.push(s.drawSlot),s.slot!=null&&(this.setSlot(s.slot,0,4),this.freeSlots.push(s.slot));this.entries=this.entries.filter(s=>!a.has(s.id)),this.bundleCache.clear(),this.invalidate()}dispose(){this.removeEntries(this.entries),this.barrels&&(this.barrels.vertexBuffer?.destroy?.(),this.barrels.indexBuffer?.destroy?.(),this.barrels.instanceBuffer?.destroy?.(),this.barrels.drawBuffer?.destroy?.(),this.barrels=null),this.depth?.destroy(),this.pickTexture?.destroy(),this.featureMaskBuffer?.destroy?.(),this.occurrenceBuffer?.destroy?.(),this.barrelRecordBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.();for(let e of[this.box?.vertexBuffer,this.box?.indexBuffer,this.box?.drawBuffer,this.cull?.uniform,this.cull?.lods,this.cull?.counters,this.cull?.readback])e?.destroy?.();this.box=null,this.cull=null,this.drawSlotBuffer?.destroy?.(),this.depth=null,this.pickTexture=null,this.featureMaskBuffer=null,this.bundleCache.clear()}setBarrels(e){if(!e?.length)return;let a=20,s=[],r=[];for(let h of[0,1]){let l=s.length/7;for(let m=0;m<a;m+=1){let f=Math.PI*2*m/a,p=Math.cos(f),y=Math.sin(f);for(let E of[0,1])s.push(p,y,E,h?-p:p,h?-y:y,0,h)}for(let m=0;m<a;m+=1){let f=(m+1)%a,p=l+m*2,y=l+f*2;r.push(p,y,y+1,p,y+1,p+1)}}let n=new Float32Array(s),i=new Uint16Array(r),o=new ArrayBuffer(e.length*40),c=new DataView(o);e.forEach((h,l)=>{let m=l*40;c.setFloat32(m,h.centerMm[0]/1e3,!0),c.setFloat32(m+4,-h.centerMm[1]/1e3,!0),c.setFloat32(m+8,Math.min(h.drillWidthMm,h.drillHeightMm)/2e3,!0),c.setFloat32(m+12,Math.max(h.outerWidthMm,h.outerHeightMm)/2e3,!0),c.setFloat32(m+16,h.startZMm/1e3,!0),c.setFloat32(m+20,h.endZMm/1e3,!0),c.setUint32(m+24,h.netId||0,!0),c.setUint32(m+28,h.objectFeatureId||0,!0),c.setUint32(m+32,h.startLayerId||0,!0),c.setUint32(m+36,h.endLayerId||0,!0)});let d=this.device.createBuffer({size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),u=this.device.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),b=this.device.createBuffer({size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,n),this.device.queue.writeBuffer(u,0,i),this.device.queue.writeBuffer(b,0,o);let w=ui(e);this.barrelRecordBuffer?.destroy?.(),this.barrelRecordBuffer=this.device.createBuffer({label:"barrel-records",size:w.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.barrelRecordBuffer,0,w);let v=this.device.createBuffer({size:Xe,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.barrels={records:e,vertexBuffer:d,indexBuffer:u,instanceBuffer:b,indexCount:i.length,instanceCount:e.length,drawBuffer:v,bindGroup:null},this.setSlot(0,i.length,2),this.rebindAll(),this.invalidate()}render(e){let{panels:a,layerOffsets:s}=e;this.resize(),this.device.queue.writeBuffer(this.layerOffsetBuffer,0,s);let r=this.context.getCurrentTexture().createView(),n=0,i=0;a.forEach((o,c)=>{let d=this.device.createCommandEncoder(),u=!this.identityOnly&&this.encodeCull(d,o),b=d.beginRenderPass({colorAttachments:[{view:r,clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:c===0?"clear":"load",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),w=Ti(o.viewport,this.canvas.width,this.canvas.height);b.setViewport(w.x,w.y,w.width,w.height,0,1),b.setScissorRect(w.x,w.y,w.width,w.height);let v=this.encodeDraws(b,o,e);n+=v.triangles,i+=v.draws,b.end(),this.device.queue.submit([d.finish()]),u&&this.readCullCounts()}),this.frameStats={triangles:Math.round(n),draws:i}}encodeDraws(e,a,{activeNetId:s,selectedFeatureId:r,time:n,visibleLayers:i,showBoard:o,showComponents:c,showPaste:d=!0,componentOpacity:u,boardOpacity:b,isolateNet:w,compareMode:v=!1,compareOffsets:h=new Map,layerAlphas:l=null,visibleTileIds:m=null}){let f=0,p=0;this.stencil&&e.setStencilReference(1),this.writeGlobals(a.matrix,s,a.layerId,n,r);let{pipelines:y,indirect:E,barrelInstances:T}=this.drawSet(),I=!d||!!(s||this.netHighlightActive),M=this.entries.filter(S=>this.visible(S,a.layerId,i,o,c,u,v,m)&&!(I&&S.boardRole==="paste")),R=M.filter(S=>!is(S)).sort((S,B)=>+!!S.stencilMark-+!!B.stencilMark),A=M.filter(S=>is(S)).sort((S,B)=>is(S)-is(B));for(let S of M)this.writeDraw(S,s,u,b,w,v,h.get(S.layerId),l?.get(S.layerId)??1);this.flushDraws(M),R.length>64?e.executeBundles([this.renderBundle(R,a.layerId)]):this.drawEntries(e,R,y,E);for(let S of M)f+=S.indexCount/3*this.countFor(S.drawClass);return p+=M.length,!v&&this.barrels&&(a.layerId===0||i.has(a.layerId))&&(this.writeBarrelDraw(w),this.drawBarrels(e,y.barrel,E,T),f+=this.barrels.indexCount/3*this.countFor(2),p+=1),E&&!v&&(this.drawBox(e,y.box),f+=12*this.countFor(3),p+=1),this.drawBlended(e,A,y,E),{triangles:f,draws:p}}depthAttachment(){let e={view:this.depth.createView(),depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"store"};return this.stencil&&Object.assign(e,{stencilClearValue:0,stencilLoadOp:"clear",stencilStoreOp:"discard"}),e}drawEntries(e,a,s,r){let n=null;for(let i of a){let o=i.stencilMark?s.mark:s.main;o!==n&&(e.setPipeline(o),n=o),this.drawEntry(e,i,r)}}drawBlended(e,a,s,r){for(let n of a)n.boardRole==="soldermask"&&n.kind==="board"?(e.setPipeline(s.mask),this.drawEntry(e,n,r),s.maskCovered&&(e.setPipeline(s.maskCovered),this.drawEntry(e,n,r))):(e.setPipeline(s.blend),this.drawEntry(e,n,r))}setPlaceholdersVisible(e){this.showPlaceholders=!!e,this.invalidate()}visible(e,a,s,r,n,i,o=!1,c=null){return e.placeholder&&!this.showPlaceholders||e.kind==="board"&&e.boardRole==="pad"||!o&&e.kind==="copper"&&c&&!c.has(e.tileId)?!1:o?e.kind==="copper"&&s.has(e.layerId):e.boardRole==="paste"?a===0&&s.has(e.layerId):e.kind==="board"?a===0&&r:e.kind==="component"?a===0&&n&&i>.001:a?e.layerId===a:s.has(e.layerId)}writeGlobals(e,a,s,r,n=0){let i=this.globalScratch,o=this.globalScratchF32;o.fill(0),o.set(e,0);let c=this.globalScratchView;c.setUint32(64,a||0,!0),c.setUint32(68,s||0,!0),c.setFloat32(72,r,!0),c.setFloat32(76,a||this.netHighlightActive?1:0,!0),c.setUint32(80,n||0,!0),c.setUint32(84,this.selectedOccurrence>=0?this.selectedOccurrence+1+this.occurrenceBase:0,!0),c.setUint32(88,this.occurrenceBase,!0),c.setUint32(92,this.emphasisStride,!0),o.set([.35,-.5,.8,0],24),this.device.queue.writeBuffer(this.globalBuffer,0,i)}writeDraw(e,a,s,r=1,n=!1,i=!1,o=null,c=1){let d=this.drawStaging.subarray(e.drawSlot*$t,(e.drawSlot+1)*$t);d.fill(0);let u=e.color||e.material.baseColor;d.set(u,0),d.set([e.material.metallic||0,e.material.roughness??.72,e.opacityScale!=null?s:0,e.drawClass===1?1:0],4);let b=Df(e);d.set([o?.[0]||0,o?.[1]||0,(i?-(e.baseZ||0):e.layerOffset||0)+b,0],8);let w=Number.isFinite(u?.[3])?u[3]:1,v=e.kind==="component"?s*(e.opacityScale??1):e.kind==="board"&&e.boardRole!=="paste"?r*Pf(e,w):c,h=e.kind==="copper"?1:e.kind==="component"?2:0;d.set([h,v,n?1:0,i?1:0],12)}writeBarrelDraw(e=!1){let a=this.barrelDrawScratch;a.fill(0),a.set(this.barrelColor,0),a.set([.75,.32,0,0],4),a.set([1,1,e?1:0,0],12),this.device.queue.writeBuffer(this.barrels.drawBuffer,0,a)}renderBundle(e,a){let{pipelines:s,indirect:r}=this.drawSet(),n=`${a}:${r?"indirect":"single"}:${e.map(d=>d.id).join(",")}`,i=this.bundleCache.get(n);if(i)return i;let o=this.device.createRenderBundleEncoder({colorFormats:[this.format],depthStencilFormat:this.depthFormat});this.drawEntries(o,e,s,r);let c=o.finish();return this.bundleCache.set(n,c),this.bundleCache.size>32&&this.bundleCache.delete(this.bundleCache.keys().next().value),c}pick(e,a,s,r){let n=this.pickSerial.then(()=>this.performPick(e,a,s,r));return this.pickSerial=n.catch(()=>0),n}async performPick(e,a,s,r){this.resize();let n=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),i=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s)));this.device.queue.writeBuffer(this.layerOffsetBuffer,0,r.layerOffsets);let o=this.device.createCommandEncoder(),c=o.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),d=Ti(e.viewport,this.canvas.width,this.canvas.height);return c.setViewport(d.x,d.y,d.width,d.height,0,1),c.setScissorRect(d.x,d.y,d.width,d.height),this.encodePick(c,e,r),c.end(),this.readPick(o,n,i)}encodePick(e,a,s){this.writeGlobals(a.matrix,s.activeNetId,a.layerId,performance.now()/1e3,s.selectedFeatureId);let{pipelines:r,indirect:n,barrelInstances:i}=this.drawSet();e.setPipeline(r.pick);let o=[];for(let c of this.entries)this.visible(c,a.layerId,s.visibleLayers,s.showBoard,s.showComponents,s.componentOpacity,s.compareMode,s.visibleTileIds)&&(c.kind==="board"&&(this.identityOnly||c.boardRole!=="substrate")||(this.writeDraw(c,s.activeNetId,s.componentOpacity,s.boardOpacity,s.isolateNet,s.compareMode,s.compareOffsets?.get(c.layerId)),o.push(c)));this.flushDraws(o);for(let c of o)this.drawEntry(e,c,n);!s.compareMode&&this.barrels&&(this.writeBarrelDraw(s.isolateNet),this.drawBarrels(e,r.barrelPick,n,i)),n&&!s.compareMode&&this.drawBox(e,r.boxPick)}async readPick(e,a,s){let r=this.device.createBuffer({label:"pick-readback",size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});e.copyTextureToBuffer({texture:this.pickTexture,origin:{x:a,y:s}},{buffer:r,bytesPerRow:256},{width:1,height:1}),this.device.queue.submit([e.finish()]);try{await r.mapAsync(GPUMapMode.READ);let n=new DataView(r.getMappedRange()),i=hi(n.getUint32(0,!0),n.getUint32(4,!0));return r.unmap(),{...i,occurrenceKey:i.occurrenceIndex>=0?this.occurrenceKeys[i.occurrenceIndex]??null:null}}finally{r.mapState==="mapped"&&r.unmap(),r.destroy()}}};function is(t){return t.translucent?3:t.kind!=="board"?0:t.boardRole==="soldermask"?1:t.boardRole==="silkscreen"?2:0}function Pf(t,e){return t.kind!=="board"||t.boardRole==="substrate"?1:t.boardRole==="soldermask"?Math.min(e,.72):t.boardRole==="silkscreen"?Math.min(e,.92):e}function Df(t){if(t.kind!=="board"||t.boardRole!=="soldermask"&&t.boardRole!=="silkscreen")return 0;let e=t.bounds,s=(e?(e[2]+e[5])*.5:0)<0?-1:1,r=t.boardRole==="silkscreen"?35e-6:18e-6;return s*r}function Ti(t,e,a){let s=Math.max(0,Math.min(e-1,Math.floor(t.x))),r=Math.max(0,Math.min(a-1,Math.floor(t.y)));return{x:s,y:r,width:Math.max(1,Math.min(e-s,Math.floor(t.width))),height:Math.max(1,Math.min(a-r,Math.floor(t.height)))}}var Uf=`
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
}`,Lf=`
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
}`,Kf=`
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
}`,Gf=`
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
}`,zf=`
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
}`,Vf=`
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
}`,Hf=`
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
}`,qf=6.2,Xf=4.6,Wf=3.8,cs=4*1024*1024,Jf=Math.floor(cs/6),Di=Jf*6,os=512*1024,Ui=512*1024,Li=96,Yf=96,$f=18,Ki=96*1024*1024,Qf=2,us=class t{static async create(e,a){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let s=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!s)throw new Error("No WebGPU adapter is available");let r=await s.requestDevice(),n=await fetch(a,{cache:"default"});if(!n.ok)throw new Error(`Failed to load schematic manifest: ${n.status}`);let i=await n.json();if(!["prism.schematic_world_a0","prism.schematic_vector_a0"].includes(i.schema))throw new Error(`Unsupported schematic scene schema: ${i.schema}`);let o=i.featureTable||i.features,c=await fetch(new URL(o,a),{cache:"default"});if(!c.ok)throw new Error(`Failed to load schematic features: ${c.status}`);let d=eh(await c.json());return new t(e,r,a,i,d)}constructor(e,a,s,r,n){this.canvas=e,this.device=a,this.manifestUrl=s,this.manifest=r,this.isNativeScene=r.schema==="prism.schematic_vector_a0",this.pages=r.pages||[],this.featuresByPage=n,this.featuresById=new Map;for(let v of Object.values(n))for(let h of v)this.featuresById.set(Number(h.id),h);this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"}),this.flowCanvas=null,this.flowContext=null,this.globalBuffer=a.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.bindGroupLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]});let i=a.createShaderModule({code:Uf});this.pagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:this.format}]},primitive:{topology:"triangle-list"}}),this.edgeLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});let o=a.createShaderModule({code:Lf});this.edgePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:o,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:o,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.edgeBindGroup=a.createBindGroup({layout:this.edgeLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}}]});let c=a.createShaderModule({code:Kf});this.highlightPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:c,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:c,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.highlightBufferSize=4*1024*1024,this.highlightBuffer=a.createBuffer({size:this.highlightBufferSize,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});let d=a.createShaderModule({code:Gf});this.netFlowPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:d,entryPoint:"vs",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x2"}]}]},fragment:{module:d,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.netFlowBuffer=a.createBuffer({size:Ui*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.globalUniformScratch=new Float32Array(12),this.pageUniformScratch=new Float32Array(8),this.imageUniformScratch=new Float32Array(8),this.vectorScratch=new Float32Array(cs),this.highlightScratch=new Float32Array(this.highlightBufferSize/4),this.netFlowScratch=new Float32Array(Ui),this.netTrackingCache=null,this.selectedIntrasheetLinkIndex=-1,this.truncatedHighlightCount=0,this.truncatedVectorCount=0,this.frameSerial=0,this.querySerial=0;let u=a.createShaderModule({code:zf});this.vectorPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:u,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x4"}]}]},fragment:{module:u,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.vectorBuffer=a.createBuffer({size:cs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers=[this.vectorBuffer];let b=a.createShaderModule({code:Vf});this.imagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:b,entryPoint:"vs"},fragment:{module:b,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}});let w=a.createShaderModule({code:Hf});this.pickPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:w,entryPoint:"vs",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"uint32"}]}]},fragment:{module:w,entryPoint:"fs",targets:[{format:"r32uint"}]},primitive:{topology:"triangle-list"}}),this.pickVertexBuffer=a.createBuffer({size:os*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.pickReadBuffer=a.createBuffer({size:256,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pickTexture=null,this.pickTextureSize=[0,0],this.pickPending=!1,this.vectorChunks=new Map,this.failedVectorChunks=new Map,this.nativeDetailState=new Map,this.domDetailPageIds=new Set,this.nativeDetailThresholds=new Map,this.residentVectorBytes=0,this.sampler=a.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.placeholder=this.createSolidTexture([245,247,249,255]),this.pageResources=new Map,this.imageResources=new Map,this.loading=new Map,this.selectedPageId="",this.selectedFeatureId=0,this.activeNetUid="",this.showHierarchy=!0,this.downloadedBytes=0,this.world=r.worldBoundsMm,this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/900,(this.world.maxY-this.world.minY)/650,.1)*1.16,this.edgeBuffer=this.createEdgeBuffer();for(let v of this.pages)this.createPageResource(v)}createSolidTexture(e){let a=this.device.createTexture({size:[1,1],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.queue.writeTexture({texture:a},new Uint8Array(e),{bytesPerRow:4},[1,1]),a}createPageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={page:e,uniform:a,texture:this.placeholder,textureWidth:0,svgBlob:null,bindGroup:null};this.pageResources.set(e.id,s),this.updateBindGroup(s)}createImageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={path:e,uniform:a,texture:this.placeholder,loaded:!1,bindGroup:null};return this.imageResources.set(e,s),this.updateBindGroup(s),s}updateBindGroup(e){e.bindGroup=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e.uniform}},{binding:2,resource:this.sampler},{binding:3,resource:e.texture.createView()}]})}async loadImageTexture(e){let a=this.imageResources.get(e)||this.createImageResource(e);if(a.loaded)return a;let s=`image:${e}`;if(this.loading.has(s))return this.loading.get(s);let r=(async()=>{try{let n=await fetch(new URL(e,this.manifestUrl),{cache:"default"});if(!n.ok)throw new Error(`Failed to load schematic image ${e}: ${n.status}`);let i=await n.blob(),o=await createImageBitmap(i),c=this.device.createTexture({size:[o.width,o.height],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:o},{texture:c},[o.width,o.height]),o.close(),a.texture!==this.placeholder&&a.texture.destroy(),a.texture=c,a.loaded=!0,this.updateBindGroup(a)}finally{this.loading.delete(s)}return a})();return this.loading.set(s,r),r}createEdgeBuffer(){let e=new Map(this.pages.map(n=>[n.id,n])),a=[];for(let n of this.manifest.edges||[]){let i=e.get(n.source),o=e.get(n.target);!i||!o||a.push(i.worldX+i.widthMm/2,i.worldY+i.heightMm,o.worldX+o.widthMm/2,o.worldY)}let s=new Float32Array(a);if(!s.length)return null;let r=this.device.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(r,0,s),{buffer:r,count:s.length/2}}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));(this.canvas.width!==a||this.canvas.height!==s)&&(this.canvas.width=a,this.canvas.height=s),this.flowCanvas&&(this.flowCanvas.width!==a||this.flowCanvas.height!==s)&&(this.flowCanvas.width=a,this.flowCanvas.height=s)}setFlowOverlayCanvas(e){e&&(this.flowCanvas=e,this.flowContext=e.getContext("webgpu"),this.flowContext.configure({device:this.device,format:this.format,alphaMode:"premultiplied"}))}writeGlobals(){let e=this.globalUniformScratch;e[0]=this.center[0],e[1]=this.center[1],e[2]=this.scale,e[3]=performance.now()*.001,e[4]=this.canvas.width,e[5]=this.canvas.height,this.device.queue.writeBuffer(this.globalBuffer,0,e)}pagePixelWidth(e){return e.widthMm/this.scale}pageSourcePixelsPerMm(e){let a=this.pagePixelWidth(e)/Math.max(1,e.sourceWidthMm||e.widthMm),s=e.heightMm/this.scale/Math.max(1,e.sourceHeightMm||e.heightMm);return Math.min(a,s)}pageNativeDetailThresholds(e){let a=this.nativeDetailThresholds.get(e.id);if(a)return a;let s=Math.max(1,e.sourceWidthMm||e.widthMm),r=Math.max(1,e.sourceHeightMm||e.heightMm),n=s*r,i=Math.max(0,e.featureCount||e.featureIds?.length||0)/Math.max(1,n),o=ne(1-i*72,.84,1.08),c=ne(Math.sqrt(Math.max(s,r)/Math.max(1,Math.min(s,r)))/1.18,.92,1.14),d=ne(qf*o*c,5,7.4),u={enter:d,exit:ne(Math.min(d-1.2,Xf*o),3.8,d-.7),prefetch:ne(Math.min(d-2,Wf*o),3,d-1)};return this.nativeDetailThresholds.set(e.id,u),u}pageWantsNativeDetail(e){if(!this.pageHasNativeDetail(e))return!1;let a=this.pageSourcePixelsPerMm(e),s=this.nativeDetailState.get(e.id)===!0,r=this.pageNativeDetailThresholds(e),n=s?r.exit:r.enter,i=a>=n;return i!==s&&this.nativeDetailState.set(e.id,i),i}pageNativeDetailReady(e){if(this.domDetailPageIds.has(e.id)||!this.pageWantsNativeDetail(e))return!1;let a=this.vectorChunks.get(e.id);return!a?.loaded||!a.segments?.length&&!a.fills?.length?!1:this.visibleNativeImagesReady(e,a)}visibleNativeImagesReady(e,a){if(!a?.images?.length)return!0;let s=this.sourceViewportBounds(e,4),r=!0;for(let n of a.images){if(!et(n.bounds,s))continue;(this.imageResources.get(n.path)||this.createImageResource(n.path)).loaded||(r=!1,this.loadImageTexture(n.path).catch(()=>{}))}return r}visiblePages(){let e=this.canvas.width*this.scale/2,a=this.canvas.height*this.scale/2,s=this.center[0]-e,r=this.center[0]+e,n=this.center[1]-a,i=this.center[1]+a;return this.pages.filter(o=>o.worldX+o.widthMm>=s&&o.worldX<=r&&o.worldY+o.heightMm>=n&&o.worldY<=i)}worldViewportBounds(e=0){let a=this.canvas.width*this.scale/2,s=this.canvas.height*this.scale/2;return[this.center[0]-a-e,this.center[1]-s-e,this.center[0]+a+e,this.center[1]+s+e]}sourceViewportBounds(e,a=2.5){let s=this.worldViewportBounds(this.scale*8),r=(s[0]-e.worldX)/e.widthMm*e.sourceWidthMm-a,n=(s[1]-e.worldY)/e.heightMm*e.sourceHeightMm-a,i=(s[2]-e.worldX)/e.widthMm*e.sourceWidthMm+a,o=(s[3]-e.worldY)/e.heightMm*e.sourceHeightMm+a;return[Math.max(-a,Math.min(r,i)),Math.max(-a,Math.min(n,o)),Math.min(e.sourceWidthMm+a,Math.max(r,i)),Math.min(e.sourceHeightMm+a,Math.max(n,o))]}render(){this.frameSerial+=1,this.resize(),this.writeGlobals();let e=this.visiblePages(),a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.045,g:.055,b:.073,a:1},loadOp:"clear",storeOp:"store"}]});this.showHierarchy&&this.edgeBuffer&&(s.setPipeline(this.edgePipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.edgeBuffer.buffer),s.draw(this.edgeBuffer.count)),s.setPipeline(this.pagePipeline);for(let i of e){let o=this.pageResources.get(i.id),c=this.activeNetUid&&i.netUids.includes(this.activeNetUid),d=this.domDetailPageIds.has(i.id),u=!d&&this.pageNativeDetailReady(i),b=this.pageUniformScratch;b[0]=i.worldX,b[1]=i.worldY,b[2]=i.widthMm,b[3]=i.heightMm,b[4]=i.id===this.selectedPageId?1:0,b[5]=c?1:0,b[6]=this.activeNetUid?1:0,b[7]=u||d?1:0,this.device.queue.writeBuffer(o.uniform,0,b),s.setBindGroup(0,o.bindGroup),s.draw(6);let w=ne(Math.ceil(this.pagePixelWidth(i)*1.3/512)*512,512,6144);o.textureWidth<w*.82&&this.loadPageTexture(i,w).catch(()=>{})}this.scheduleVisibleVectorLoads(e),this.drawVisibleImages(s,e),this.drawVisibleVectors(s,e);let r=this.writeNetTrackingOverlay();r&&!this.flowContext&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(r));let n=this.writeNetHighlights(e);return n&&(s.setPipeline(this.highlightPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.highlightBuffer),s.draw(n)),s.end(),this.device.queue.submit([a.finish()]),this.renderFlowOverlay(r),this.evictVectorChunks(e),e}renderFlowOverlay(e){if(!this.flowContext)return;let a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.flowContext.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});e&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(e)),s.end(),this.device.queue.submit([a.finish()])}drawVisibleImages(e,a){if(!this.isNativeScene)return;let s=!1;for(let r of a){if(this.domDetailPageIds.has(r.id)||!this.pageNativeDetailReady(r))continue;let n=this.vectorChunks.get(r.id);if(!n?.images?.length)continue;let i=this.sourceViewportBounds(r,4);for(let o of n.images){if(!et(o.bounds,i))continue;let c=this.imageResources.get(o.path)||this.createImageResource(o.path);c.loaded||this.loadImageTexture(o.path).catch(()=>{});let d=o.worldOrigin||this.sourceToWorld(r,[o.xMm,o.yMm]),u=o.worldSize||this.sourceSizeToWorld(r,o.widthMm,o.heightMm),b=this.imageUniformScratch;b[0]=d[0],b[1]=d[1],b[2]=u[0],b[3]=u[1],b[4]=0,b[5]=0,b[6]=0,b[7]=0,this.device.queue.writeBuffer(c.uniform,0,b),s||(e.setPipeline(this.imagePipeline),s=!0),e.setBindGroup(0,c.bindGroup),e.draw(6)}}}drawVisibleVectors(e,a){if(!this.isNativeScene)return 0;let s=this.vectorScratch,r=0,n=0,i=0,o=0,c=!1,d=()=>{if(!r)return;let b=this.vectorBuffers[o];b||(b=this.device.createBuffer({size:cs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers.push(b)),this.device.queue.writeBuffer(b,0,s,0,r),c||(e.setPipeline(this.vectorPipeline),e.setBindGroup(0,this.edgeBindGroup),c=!0);let w=Math.floor(r/6);e.setVertexBuffer(0,b),e.draw(w),i+=w,o+=1,r=0},u=b=>b>Di||b>s.length?(n+=1,!1):((r+b>Di||r+b>s.length)&&d(),!0);for(let b of a){if(this.domDetailPageIds.has(b.id)||!this.pageHasNativeDetail(b))continue;let w=this.vectorChunks.get(b.id);if(!w?.segments?.length&&!w?.fills?.length||!this.pageNativeDetailReady(b))continue;w.lastUsedFrame=this.frameSerial;let v=this.sourceViewportBounds(b),h=zi(w.spatial,v);for(let l of h.fills){if(!et(l.bounds,v)||!u(18))continue;let m=this.featuresById.get(l.featureId),f=this.activeNetUid&&m?.netUid===this.activeNetUid,y=this.selectedFeatureId===l.featureId?[.24,.58,1,1]:f?[.06,1,.24,1]:this.activeNetUid&&ya(m)?Xi(m,l.kind,l.color):vr(m,l.kind,l.color),E=l.worldPoints||l.points.map(T=>this.sourceToWorld(b,T));r=mh(s,r,E[0],E[1],E[2],y)}for(let l of h.segments){if(!et(l.bounds,v))continue;let m=this.featuresById.get(l.featureId),f=this.activeNetUid&&m?.netUid===this.activeNetUid,p=this.selectedFeatureId===l.featureId,y=p?[.24,.58,1,1]:f?[.06,1,.24,1]:this.activeNetUid&&ya(m)?Xi(m,l.kind,l.color):vr(m,l.kind,l.color),E=this.segmentWorldWidth(b,l,m,f||p);for(let T of this.visibleSegmentParts(b,l,m)){if(!u(36))continue;let I=T.worldA||this.sourceToWorld(b,T.a),M=T.worldB||this.sourceToWorld(b,T.b);r=gh(s,r,I,M,E,y)}}}return d(),this.truncatedVectorCount=n,this.vectorTruncated=n>0,this.lastVectorVertices=i,this.lastVectorChunks=o,i}pageHasNativeDetail(e){return this.isNativeScene?e?.nativeDetail?.enabled!==!1:!1}scheduleVisibleVectorLoads(e){if(!this.isNativeScene)return;let a=[...this.vectorChunks.values()].filter(n=>n?.promise&&!n.loaded).length,s=Math.max(0,Qf-a);if(!s)return;let r=e.filter(n=>!this.domDetailPageIds.has(n.id)).filter(n=>this.pageHasNativeDetail(n)&&this.pageSourcePixelsPerMm(n)>=this.pageNativeDetailThresholds(n).prefetch).filter(n=>!this.vectorChunks.get(n.id)?.loaded&&!this.vectorChunks.get(n.id)?.promise).sort((n,i)=>{let o=Math.hypot(n.worldX+n.widthMm/2-this.center[0],n.worldY+n.heightMm/2-this.center[1]),c=Math.hypot(i.worldX+i.widthMm/2-this.center[0],i.worldY+i.heightMm/2-this.center[1]);return o-c});for(let n of r)if(this.loadPageVectors(n).catch(()=>{}),s-=1,!s)break}featurePrimitiveBounds(e,a){let s=this.vectorChunks.get(e.id);if(!s?.segments?.length&&!s?.fills?.length)return null;let r=[],n=[];for(let i of s.segments||[])i.featureId===a&&(r.push(i.a[0],i.b[0]),n.push(i.a[1],i.b[1]));for(let i of s.fills||[])if(i.featureId===a)for(let o of i.points||[])r.push(o[0]),n.push(o[1]);return r.length?[Math.min(...r),Math.min(...n),Math.max(...r),Math.max(...n)]:null}symbolClipBounds(e){if(this._symbolClipBounds||(this._symbolClipBounds=new Map),this._symbolClipBounds.has(e.id))return this._symbolClipBounds.get(e.id);let a=(this.featuresByPage[e.id]||[]).filter(s=>s?.kind==="symbol_body"&&s.boundsMm&&!String(s.sourceId||"").includes(":overplot")).map(s=>{let r=this.featurePrimitiveBounds(e,s.id)||s.boundsMm;return[r[0]-.02,r[1]-.02,r[2]+.02,r[3]+.02]}).filter(s=>{let r=s[2]-s[0],n=s[3]-s[1];return Math.max(r,n)<=12&&r*n<=80});return this._symbolClipBounds.set(e.id,a),a}visibleSegmentParts(e,a,s){if(a._visibleParts)return a._visibleParts;let r=String(s?.kind||""),n=String(s?.semanticRole||"");if(r!=="wire"&&n!=="wire")return a._visibleParts=[a],a._visibleParts;let i=[a];for(let o of this.symbolClipBounds(e)){let c=[];for(let d of i)c.push(...vh(d,o));if(i=c,!i.length)break}for(let o of i)o.worldA=Zt(e,o.a),o.worldB=Zt(e,o.b);return a._visibleParts=i,a._visibleParts}netTrackingSegments(){if(!this.activeNetUid)return{netUid:"",anchorsByPage:new Map,segments:[],intrasheetSegments:[]};let e=Number(this.selectedFeatureId||0),a=String(this.selectedFeatureKey||""),s=String(this.selectedSourceId||"");if(this.netTrackingCache?.netUid===this.activeNetUid&&this.netTrackingCache?.selectedFeatureId===e&&this.netTrackingCache?.selectedFeatureKey===a&&this.netTrackingCache?.selectedSourceId===s)return this.netTrackingCache;this.selectedIntrasheetLinkIndex=-1;let r=new Map(this.pages.map(h=>[h.id,h])),n=this.manifest.netToPages?.[this.activeNetUid]||[],i=n.length?n.map(h=>r.get(h)).filter(Boolean):this.pages.filter(h=>h.netUids?.includes(this.activeNetUid)),o=new Map;for(let h of i.slice(0,Yf)){let l=this.netTrackingAnchorsForPage(h);l.length&&o.set(h.id,l)}let c=[],d=[];for(let[h,l]of o){let m=Hi(fh(l),"intrasheet",h);c.push(...m),d.push(...m)}let u=[...o.entries()].map(([h,l])=>hh(r.get(h),l,{featureId:e,stableKey:a,sourceId:s})).filter(Boolean);c.push(...Hi(u,"intersheet",""));let b=d.map((h,l)=>({...h,intrasheetIndex:l})),w=0,v=c.map((h,l)=>{if(h.type!=="intrasheet")return{...h,id:l};let m=w;return w+=1,{...h,id:l,intrasheetIndex:m}});return this.netTrackingCache={netUid:this.activeNetUid,selectedFeatureId:e,selectedFeatureKey:a,selectedSourceId:s,anchorsByPage:o,segments:v,intrasheetSegments:b},this.selectedIntrasheetLinkIndex>=this.netTrackingCache.intrasheetSegments.length&&(this.selectedIntrasheetLinkIndex=-1),this.netTrackingCache}netTrackingAnchorsForPage(e){let a=this.featuresByPage[e.id]||[],s=[];for(let r of a){if(r.netUid!==this.activeNetUid||!r.boundsMm||!dh(r))continue;let n=r.boundsMm,i=[(n[0]+n[2])/2,(n[1]+n[3])/2],o=this.sourceToWorld(e,i);s.push({pageId:e.id,featureId:Number(r.id||0),stableKey:String(r.stableKey||""),sourceId:String(r.sourceId||r.sourceUid||r.objectId||""),kind:r.kind||r.semanticRole||"",source:i,world:o,bounds:n,priority:uh(r)})}return s.sort((r,n)=>n.priority-r.priority||r.source[1]-n.source[1]||r.source[0]-n.source[0]),s}writeNetTrackingOverlay(){let e=this.netTrackingSegments();if(this.lastNetFlowSegments=e.segments.length,this.lastNetFlowIntrasheetSegments=e.intrasheetSegments.length,!e.segments.length)return this.lastNetFlowVertices=0,0;let a=this.worldViewportBounds(this.scale*96),s=this.netFlowScratch,r=0,n=0;for(let i of e.segments){if(!et(qi(i),a))continue;let o=i.type==="intrasheet"&&i.intrasheetIndex===this.selectedIntrasheetLinkIndex,c=o?9.5:i.type==="intersheet"?8:4.8,d=o?2:i.type==="intersheet"?1:0,u=yh(s,r,i.a,i.b,c*this.scale,d,n,this.scale);if(u!==r&&(r=u,n+=Math.hypot(i.b[0]-i.a[0],i.b[1]-i.a[1])/Math.max(this.scale,1e-6),r+24>s.length))break}return r?(this.device.queue.writeBuffer(this.netFlowBuffer,0,s,0,r),this.lastNetFlowVertices=r/4,r/4):(this.lastNetFlowVertices=0,0)}cycleNetIntrasheetLink(e=1){let a=this.netTrackingSegments();if(!a.intrasheetSegments.length)return null;let s=a.intrasheetSegments.length;this.selectedIntrasheetLinkIndex=(this.selectedIntrasheetLinkIndex+e+s)%s;let r=a.intrasheetSegments[this.selectedIntrasheetLinkIndex];if(!r)return null;let n=qi(r,14*this.scale);return this.center=[(n[0]+n[2])/2,(n[1]+n[3])/2],this.scale=Math.max((n[2]-n[0])/Math.max(1,this.canvas.width*.36),(n[3]-n[1])/Math.max(1,this.canvas.height*.3),this.scale*.35,.025),{pageId:r.pageId,segment:r}}writeNetHighlights(e){if(!this.activeNetUid)return 0;let a=this.highlightScratch,s=0,r=0;for(let n of e){let i=this.sourceViewportBounds(n,5);for(let o of this.featuresByPage[n.id]||[]){if(o.netUid!==this.activeNetUid||!o.boundsMm||!et(o.boundsMm,i))continue;let c=this.featureWorldBounds(n,o.boundsMm);if(s+16>a.length){r+=1;continue}a[s++]=c[0],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[3],a[s++]=c[2],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[1]}}return this.truncatedHighlightCount=r,s?(this.device.queue.writeBuffer(this.highlightBuffer,0,a,0,s),s/2):0}featureWorldBounds(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm,e.worldX+a[2]/e.sourceWidthMm*e.widthMm,e.worldY+a[3]/e.sourceHeightMm*e.heightMm]}sourceToWorld(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm]}sourceSizeToWorld(e,a,s){return[a/e.sourceWidthMm*e.widthMm,s/e.sourceHeightMm*e.heightMm]}async loadPageVectors(e){if(!this.pageHasNativeDetail(e)||!e.chunks?.lod2)return null;let a=this.vectorChunks.get(e.id);if(a?.loaded)return a;if(a?.promise)return a.promise;let s=(async()=>{try{let r=await fetch(new URL(e.chunks.lod2,this.manifestUrl));if(!r.ok)throw new Error(`Failed to load schematic vector chunk ${e.id}: ${r.status}`);let n=await r.json(),i=th(n.primitives||[]);ah(e,i);let c=JSON.stringify(n).length,d={loaded:!0,segments:i.segments,fills:i.fills,images:i.images,spatial:lh(i),unsupported:n.unsupported||[],bytes:c,lastUsedFrame:this.frameSerial};return this.vectorChunks.set(e.id,d),this.failedVectorChunks.delete(e.id),this.residentVectorBytes+=c,d}catch(r){let n=this.failedVectorChunks.get(e.id)||{count:0,message:""};throw this.failedVectorChunks.set(e.id,{count:n.count+1,message:r?.message||String(r)}),this.vectorChunks.delete(e.id),r}})();return this.vectorChunks.set(e.id,{loaded:!1,promise:s,segments:[]}),s}evictVectorChunks(e){if(this.residentVectorBytes<=Ki)return;let a=new Set(e.map(r=>r.id)),s=[...this.vectorChunks.entries()].filter(([,r])=>r?.loaded).filter(([r])=>!a.has(r)&&r!==this.selectedPageId).sort((r,n)=>(r[1].lastUsedFrame||0)-(n[1].lastUsedFrame||0));for(let[r,n]of s)if(this.vectorChunks.delete(r),this.residentVectorBytes=Math.max(0,this.residentVectorBytes-(n.bytes||0)),this.residentVectorBytes<=Ki*.82)break}stats(){let e=this.visiblePages(),a=e.map(r=>this.pageSourcePixelsPerMm(r)),s=e.map(r=>this.pageNativeDetailThresholds(r).enter);return{residentVectorBytes:this.residentVectorBytes,vectorChunks:[...this.vectorChunks.values()].filter(r=>r?.loaded).length,vectorLoads:[...this.vectorChunks.values()].filter(r=>r?.promise&&!r.loaded).length,failedVectorChunks:this.failedVectorChunks.size,vectorVertices:this.lastVectorVertices||0,vectorDrawChunks:this.lastVectorChunks||0,truncatedVectors:this.truncatedVectorCount||0,nativeDetailPages:[...this.nativeDetailState.values()].filter(Boolean).length,nativePxPerMm:Number((Math.max(0,...a)||0).toFixed(2)),nativeThresholdPxPerMm:Number((s.length?Math.min(...s):0).toFixed(2)),domDetailPages:this.domDetailPageIds.size,netFlowSegments:this.lastNetFlowSegments||0,netFlowIntrasheetSegments:this.lastNetFlowIntrasheetSegments||0,netFlowVertices:this.lastNetFlowVertices||0}}setDomDetailPageIds(e){this.domDetailPageIds=new Set(e||[])}async loadPageTexture(e,a){let s=`${e.id}:${a}`;if(this.loading.has(s))return this.loading.get(s);let r=this.pageResources.get(e.id);if(!r||r.textureWidth>=a)return;let n=(async()=>{if(!r.svgBlob){let c=await fetch(new URL(Zf(e),this.manifestUrl));if(!c.ok)throw new Error(`Failed to load schematic page ${e.name}: ${c.status}`);r.svgBlob=await c.blob(),this.downloadedBytes+=r.svgBlob.size}let i=r.svgBlob,o=URL.createObjectURL(i);try{let c=new Image;if(c.decoding="async",c.src=o,await c.decode(),r.textureWidth>=a)return;let d=Math.max(64,Math.round(a*e.heightMm/e.widthMm)),u=new OffscreenCanvas(a,d),b=u.getContext("2d",{alpha:!1});b.fillStyle="#ffffff",b.fillRect(0,0,a,d),b.drawImage(c,0,0,a,d);let w=await createImageBitmap(u),v=this.device.createTexture({size:[a,d],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:w},{texture:v},[a,d]),w.close(),r.texture!==this.placeholder&&r.texture.destroy(),r.texture=v,r.textureWidth=a,this.updateBindGroup(r)}finally{URL.revokeObjectURL(o),this.loading.delete(s)}})();return this.loading.set(s,n),n}preloadOverview(){let e=[...this.pages],a=async()=>{for(;e.length;){let s=e.shift();await this.loadPageTexture(s,512).catch(()=>{})}};return Promise.all(Array.from({length:Math.min(4,e.length)},a))}screenToWorld(e,a){let s=this.canvas.getBoundingClientRect(),r=(e-s.left)*this.canvas.width/s.width,n=(a-s.top)*this.canvas.height/s.height;return[this.center[0]+(r-this.canvas.width/2)*this.scale,this.center[1]+(n-this.canvas.height/2)*this.scale]}worldToScreen(e,a){let s=this.canvas.clientWidth/this.canvas.width,r=this.canvas.clientHeight/this.canvas.height;return[((e-this.center[0])/this.scale+this.canvas.width/2)*s,((a-this.center[1])/this.scale+this.canvas.height/2)*r]}hitPage(e,a){let[s,r]=this.screenToWorld(e,a);return[...this.pages].reverse().find(n=>s>=n.worldX&&s<=n.worldX+n.widthMm&&r>=n.worldY&&r<=n.worldY+n.heightMm)||null}async pickFeature(e,a){if(!this.isNativeScene)return this.hitFeature(e,a);let s=this.hitPage(e,a);if(!s)return null;if(!this.pageHasNativeDetail(s))return this.hitFeature(e,a);await this.loadPageVectors(s);let r=await this.gpuPickFeature(s,e,a);return r&&!ma(r)?{page:s,feature:r,source:this.clientToSource(s,e,a),native:!0,gpu:!0}:this.hitFeature(e,a)}hitFeature(e,a){let s=this.hitPage(e,a);if(!s)return null;let[r,n]=this.clientToSource(s,e,a),i=Math.max(.45,5*this.scale*this.canvas.width/Math.max(1,this.canvas.clientWidth)*s.sourceWidthMm/s.widthMm),o=this.hitResidentVectorFeature(s,r,n,i);if(o)return{page:s,feature:o,source:[r,n],native:!0};let c=this.hitSymbolInterior(s,r,n);if(c)return{page:s,feature:c,source:[r,n],native:!0,interior:!0};let d=(this.featuresByPage[s.id]||[]).filter(u=>{if(ma(u))return!1;let b=u.boundsMm;return b&&r>=b[0]-i&&r<=b[2]+i&&n>=b[1]-i&&n<=b[3]+i}).map(u=>({feature:u,priority:ga(u),area:Math.max(1e-4,(u.boundsMm[2]-u.boundsMm[0])*(u.boundsMm[3]-u.boundsMm[1]))})).sort((u,b)=>b.priority-u.priority||u.area-b.area);return{page:s,feature:d[0]?.feature||null,source:[r,n]}}hitSymbolInterior(e,a,s){let r=null;for(let n of this.featuresByPage[e.id]||[]){let i=String(n?.kind||"");if(i!=="symbol_body"&&i!=="symbol_instance"||String(n?.sourceId||"").includes(":overplot"))continue;let o=n.boundsMm;if(!o||a<o[0]||a>o[2]||s<o[1]||s>o[3])continue;let c=Math.max(1e-4,(o[2]-o[0])*(o[3]-o[1])),d=(i==="symbol_body"?0:1e6)+c;(!r||d<r.score)&&(r={feature:n,score:d})}return r?.feature||null}clientToSource(e,a,s){let[r,n]=this.screenToWorld(a,s);return[(r-e.worldX)/e.widthMm*e.sourceWidthMm,(n-e.worldY)/e.heightMm*e.sourceHeightMm]}ensurePickTexture(){this.pickTexture&&this.pickTextureSize[0]===this.canvas.width&&this.pickTextureSize[1]===this.canvas.height||(this.pickTexture&&this.pickTexture.destroy(),this.pickTexture=this.device.createTexture({size:[this.canvas.width,this.canvas.height],format:"r32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),this.pickTextureSize=[this.canvas.width,this.canvas.height])}writePickVectors(e){let a=new ArrayBuffer(os*12),s=new DataView(a),r=0,n=[];for(let i of e){let o=this.vectorChunks.get(i.id);if(!o?.segments?.length&&!o?.fills?.length&&!o?.images?.length)continue;let c=this._pickSourcePointByPage?.get(i.id),d=c?[c[0]-2.5,c[1]-2.5,c[0]+2.5,c[1]+2.5]:[0,0,i.sourceWidthMm,i.sourceHeightMm],u=zi(o.spatial,d);for(let b of u.images){if(!et(b.bounds,d))continue;let w=this.featuresById.get(b.featureId);!w||ma(w)||n.push({page:i,image:b,feature:w,priority:ga(w)-5})}for(let b of u.fills){if(!et(b.bounds,d))continue;let w=this.featuresById.get(b.featureId);!w||ma(w)||n.push({page:i,fill:b,feature:w,priority:ga(w)-2})}for(let b of u.segments){if(!et(b.bounds,d))continue;let w=this.featuresById.get(b.featureId);!w||ma(w)||n.push({page:i,segment:b,feature:w,priority:ga(w)})}}n.sort((i,o)=>i.priority-o.priority);for(let{page:i,segment:o,fill:c,image:d,feature:u}of n){if(r+6>os)break;if(d){let b=this.sourceToWorld(i,[d.xMm,d.yMm]),w=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm]),v=this.sourceToWorld(i,[d.xMm,d.yMm+d.heightMm]),h=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm+d.heightMm]);r=xr(s,r,b,w,v,d.featureId),r=xr(s,r,v,w,h,d.featureId)}else if(c){let b=c.worldPoints||c.points.map(w=>this.sourceToWorld(i,w));r=xr(s,r,b[0],b[1],b[2],c.featureId)}else{let b=Math.max(this.segmentWorldWidth(i,o,u,!1),this.scale*7);for(let w of this.visibleSegmentParts(i,o,u)){if(r+6>os)break;let v=w.worldA||this.sourceToWorld(i,w.a),h=w.worldB||this.sourceToWorld(i,w.b);r=wh(s,r,v,h,b,o.featureId)}}}return r?(this.device.queue.writeBuffer(this.pickVertexBuffer,0,a,0,r*12),r):0}async gpuPickFeature(e,a,s){if(this.pickPending)return null;let r=this.clientToSource(e,a,s);this._pickSourcePointByPage=new Map([[e.id,r]]);let n=this.writePickVectors([e]);if(this._pickSourcePointByPage=null,!n)return null;this.resize(),this.writeGlobals(),this.ensurePickTexture();let i=this.canvas.getBoundingClientRect(),o=Math.max(0,Math.min(this.canvas.width-1,Math.floor((a-i.left)*this.canvas.width/i.width))),c=Math.max(0,Math.min(this.canvas.height-1,Math.floor((s-i.top)*this.canvas.height/i.height))),d=this.device.createCommandEncoder(),u=d.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});u.setPipeline(this.pickPipeline),u.setBindGroup(0,this.edgeBindGroup),u.setVertexBuffer(0,this.pickVertexBuffer),u.draw(n),u.end(),d.copyTextureToBuffer({texture:this.pickTexture,origin:{x:o,y:c}},{buffer:this.pickReadBuffer,bytesPerRow:256,rowsPerImage:1},{width:1,height:1,depthOrArrayLayers:1}),this.pickPending=!0,this.device.queue.submit([d.finish()]);try{await this.pickReadBuffer.mapAsync(GPUMapMode.READ);let b=new DataView(this.pickReadBuffer.getMappedRange()).getUint32(0,!0);return this.pickReadBuffer.unmap(),b&&this.featuresById.get(b)||null}finally{this.pickReadBuffer.mapState==="mapped"&&this.pickReadBuffer.unmap(),this.pickPending=!1}}hitResidentVectorFeature(e,a,s,r){if(!this.isNativeScene)return null;let n=this.vectorChunks.get(e.id);if(!n?.loaded)return null;let i=null;for(let o of n.segments){let c=this.featuresById.get(o.featureId),d=Math.max(r,(o.widthMm||0)*.5+r*.45);if(c)for(let u of this.visibleSegmentParts(e,o,c)){let b=xh([a,s],u.a,u.b);if(b>d)continue;let w=b-ga(c)*.025+(ya(c)?0:8);(!i||w<i.score)&&(i={feature:c,score:w})}}return i?.feature||null}segmentWorldWidth(e,a,s,r){let n=(a.widthMm||.15)/Math.max(1,e.sourceWidthMm)*e.widthMm;return Math.max(n,this.scale*ph(s,a.kind,r))}pan(e,a){let s=this.canvas.width/Math.max(1,this.canvas.clientWidth);this.center[0]-=e*this.scale*s,this.center[1]-=a*this.scale*s}zoom(e,a,s){let r=this.screenToWorld(a,s);this.scale=ne(this.scale*Math.exp(e*.0015),.015,16);let n=this.screenToWorld(a,s);this.center[0]+=r[0]-n[0],this.center[1]+=r[1]-n[1]}framePage(e){e&&(this.resize(),this.center=[e.worldX+e.widthMm/2,e.worldY+e.heightMm/2],this.scale=Math.max(e.widthMm/Math.max(1,this.canvas.width*.88),e.heightMm/Math.max(1,this.canvas.height*.84)))}frameWorld(){this.resize(),this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/Math.max(1,this.canvas.width*.9),(this.world.maxY-this.world.minY)/Math.max(1,this.canvas.height*.88),.05)}};function Zf(t){return t.thumbnail?.path||t.svg}function eh(t){if(t.schema==="prism.schematic_vector_a0.features"){let e=new Map((t.features||[]).map(s=>[Number(s.id),s])),a={};for(let[s,r]of Object.entries(t.pages||{}))a[s]=r.map(n=>e.get(Number(n))).filter(Boolean);return a}return t.pages||{}}function th(t){let e=[],a=[],s=[];for(let r of t){let n=Number(r.featureId||0);if(!n)continue;if(r.kind==="plotimage"&&r.image?.path){let p=r.xMm||0,y=r.yMm||0,E=r.widthMm||0,T=r.heightMm||0;s.push({featureId:n,kind:r.kind,xMm:p,yMm:y,widthMm:E,heightMm:T,bounds:[p,y,p+E,y+T],path:r.image.path});continue}let i=String(r.semanticRole||""),o=r.radiusMm||r.diameterMm/2||0,c=String(r.fill||"").toUpperCase()==="FILLED_SHAPE",d=r.widthMm||r.pen_widthMm||(i==="junction"?.08:.15),u=String(r.lineStyle||r.line_style||"DEFAULT").toUpperCase(),b=r.color||r.strokeColor||r.style?.color||"",w=r.fillColor||r.color||r.style?.color||"",v=(p,y)=>oh(e,{featureId:n,kind:r.kind,widthMm:d,lineStyle:u,color:b},p,y),h=r.x1Mm,l=r.y1Mm,m=r.x2Mm,f=r.y2Mm;if(r.trianglesMm?.length){for(let p of r.trianglesMm)Array.isArray(p)&&p.length===3&&a.push({featureId:n,kind:r.kind,color:w,points:p,bounds:Wi(p)});if(r.pointsMm?.length>=2){for(let p=1;p<r.pointsMm.length;p+=1)v(r.pointsMm[p-1],r.pointsMm[p]);Vi(r)&&v(r.pointsMm[r.pointsMm.length-1],r.pointsMm[0])}}else if(r.pointsMm?.length>=2){c&&r.pointsMm.length>=3&&ih(a,n,r.kind,r.pointsMm,w);for(let p=1;p<r.pointsMm.length;p+=1)v(r.pointsMm[p-1],r.pointsMm[p]);Vi(r)&&v(r.pointsMm[r.pointsMm.length-1],r.pointsMm[0])}else if(r.polylinesMm?.length){for(let p of r.polylinesMm)if(!(!Array.isArray(p)||p.length<2))for(let y=1;y<p.length;y+=1)v(p[y-1],p[y])}else if(Number.isFinite(h)&&Number.isFinite(l)&&Number.isFinite(m)&&Number.isFinite(f))r.kind==="rect"?(c&&rh(a,n,r.kind,[h,l,m,f],w),v([h,l],[m,l]),v([m,l],[m,f]),v([m,f],[h,f]),v([h,f],[h,l])):v([h,l],[m,f]);else if(Number.isFinite(r.cxMm)&&Number.isFinite(r.cyMm)){let p=r.radiusMm||r.diameterMm/2||.4;c&&nh(a,n,r.kind,[r.cxMm,r.cyMm],p,w),ch(e,{featureId:n,kind:r.kind,widthMm:d,lineStyle:u,color:b},[r.cxMm,r.cyMm],p)}else if(r.contoursMm?.length){for(let p of r.contoursMm)if(!(!Array.isArray(p)||p.length<2)){for(let y=1;y<p.length;y+=1)v(p[y-1],p[y]);v(p[p.length-1],p[0])}}else if(Number.isFinite(r.start_xMm)&&Number.isFinite(r.start_yMm)&&Number.isFinite(r.end_xMm)&&Number.isFinite(r.end_yMm))Number.isFinite(r.mid_xMm)&&Number.isFinite(r.mid_yMm)?(v([r.start_xMm,r.start_yMm],[r.mid_xMm,r.mid_yMm]),v([r.mid_xMm,r.mid_yMm],[r.end_xMm,r.end_yMm])):v([r.start_xMm,r.start_yMm],[r.end_xMm,r.end_yMm]);else if(Number.isFinite(r.start_xMm)&&Number.isFinite(r.start_yMm)&&Number.isFinite(r.mid_xMm)&&Number.isFinite(r.mid_yMm)&&Number.isFinite(r.end_xMm)&&Number.isFinite(r.end_yMm))v([r.start_xMm,r.start_yMm],[r.mid_xMm,r.mid_yMm]),v([r.mid_xMm,r.mid_yMm],[r.end_xMm,r.end_yMm]);else if(r.boundsMm&&r.kind!=="text"){let[p,y,E,T]=r.boundsMm;v([p,y],[E,y]),v([E,y],[E,T]),v([E,T],[p,T]),v([p,T],[p,y])}}return{segments:e,fills:a,images:s}}function ah(t,e){for(let a of e.segments||[])a.worldA=Zt(t,a.a),a.worldB=Zt(t,a.b);for(let a of e.fills||[])a.worldPoints=a.points.map(s=>Zt(t,s));for(let a of e.images||[])a.worldOrigin=Zt(t,[a.xMm,a.yMm]),a.worldSize=sh(t,a.widthMm,a.heightMm)}function Zt(t,e){return[t.worldX+e[0]/t.sourceWidthMm*t.widthMm,t.worldY+e[1]/t.sourceHeightMm*t.heightMm]}function sh(t,e,a){return[e/t.sourceWidthMm*t.widthMm,a/t.sourceHeightMm*t.heightMm]}function rh(t,e,a,s,r){let[n,i,o,c]=s;t.push({featureId:e,kind:a,color:r,points:[[n,i],[o,i],[n,c]],bounds:[n,i,o,c]},{featureId:e,kind:a,color:r,points:[[n,c],[o,i],[o,c]],bounds:[n,i,o,c]})}function nh(t,e,a,s,r,n){for(let o=0;o<36;o+=1){let c=o/36*Math.PI*2,d=(o+1)/36*Math.PI*2;t.push({featureId:e,kind:a,color:n,points:[s,[s[0]+Math.cos(c)*r,s[1]+Math.sin(c)*r],[s[0]+Math.cos(d)*r,s[1]+Math.sin(d)*r]],bounds:[s[0]-r,s[1]-r,s[0]+r,s[1]+r]})}}function ih(t,e,a,s,r){let n=s[0],i=Wi(s);for(let o=2;o<s.length;o+=1)t.push({featureId:e,kind:a,color:r,points:[n,s[o-1],s[o]],bounds:i})}function oh(t,e,a,s){let r=Gi(a,s,e.widthMm||.15),n=e.lineStyle||"DEFAULT";if(!["DASH","DASHED","DOT","DOTTED","DASHDOT","DASH_DOT"].includes(n)){t.push({...e,a,b:s,bounds:r});return}let i=s[0]-a[0],o=s[1]-a[1],c=Math.hypot(i,o);if(c<1e-6)return;let d=i/c,u=o/c,b=Math.max(e.widthMm*4,.45),w=n.includes("DOT")?[b*.8,b*.75,b*3,b*.75]:[b*3,b*1.5],v=0,h=0;for(;v<c;){let l=Math.min(w[h%w.length],c-v);if(h%2===0){let m=[a[0]+d*v,a[1]+u*v],f=[a[0]+d*(v+l),a[1]+u*(v+l)];t.push({...e,a:m,b:f,bounds:Gi(m,f,e.widthMm||.15)})}v+=l,h+=1}}function ch(t,e,a,s){for(let n=0;n<32;n+=1){let i=n/32*Math.PI*2,o=(n+1)/32*Math.PI*2;t.push({...e,a:[a[0]+Math.cos(i)*s,a[1]+Math.sin(i)*s],b:[a[0]+Math.cos(o)*s,a[1]+Math.sin(o)*s],bounds:[a[0]-s,a[1]-s,a[0]+s,a[1]+s]})}}function Wi(t,e=0){let a=1/0,s=1/0,r=-1/0,n=-1/0;for(let i of t||[])a=Math.min(a,i[0]),s=Math.min(s,i[1]),r=Math.max(r,i[0]),n=Math.max(n,i[1]);return Number.isFinite(a)?[a-e,s-e,r+e,n+e]:[0,0,0,0]}function Gi(t,e,a=0){let s=Math.max(.05,a*.5);return[Math.min(t[0],e[0])-s,Math.min(t[1],e[1])-s,Math.max(t[0],e[0])+s,Math.max(t[1],e[1])+s]}function et(t,e){return!t||!e?!0:t[0]<=e[2]&&t[2]>=e[0]&&t[1]<=e[3]&&t[3]>=e[1]}function lh(t){let e={cellSize:$f,cells:new Map,segments:t.segments||[],fills:t.fills||[],images:t.images||[],queryId:0};for(let a of e.segments)mr(e,"segments",a);for(let a of e.fills)mr(e,"fills",a);for(let a of e.images)mr(e,"images",a);return e}function mr(t,e,a){let s=a.bounds;if(!s)return;let r=Math.floor(s[0]/t.cellSize),n=Math.floor(s[2]/t.cellSize),i=Math.floor(s[1]/t.cellSize),o=Math.floor(s[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=r;d<=n;d+=1){let u=`${d}:${c}`,b=t.cells.get(u);b||(b={segments:[],fills:[],images:[]},t.cells.set(u,b)),b[e].push(a)}}function zi(t,e){if(!t)return{segments:[],fills:[],images:[]};t.queryId=(t.queryId||0)+1;let a=t.queryId,s={segments:[],fills:[],images:[]},r=Math.floor(e[0]/t.cellSize),n=Math.floor(e[2]/t.cellSize),i=Math.floor(e[1]/t.cellSize),o=Math.floor(e[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=r;d<=n;d+=1){let u=t.cells.get(`${d}:${c}`);u&&(yr(u.segments,s.segments,a,"segments"),yr(u.fills,s.fills,a,"fills"),yr(u.images,s.images,a,"images"))}return s}function yr(t,e,a,s){let r=`_${s}QueryId`;for(let n of t)n[r]!==a&&(n[r]=a,e.push(n))}function Vi(t){let e=String(t.kind||"");if(String(t.fill||"").toUpperCase()==="FILLED_SHAPE"||t.closed===!0||["polygon","fill"].includes(e))return!0;let s=t.pointsMm||[];if(s.length>=3){let r=s[0],n=s[s.length-1];return Math.hypot(r[0]-n[0],r[1]-n[1])<1e-6}return!1}function ya(t){return!!t?.netUid}function dh(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="pin"||e==="pin_body"||e==="label"||e==="global_label"||e==="hierarchical_label"||e==="netclass_flag"||e==="power_symbol"||e==="power_port"||a==="label"||a==="global_label"||a==="hierarchical_label"}function uh(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="global_label"||a==="global_label"?130:e==="hierarchical_label"||a==="hierarchical_label"?125:e==="label"||a==="label"?118:e==="pin"||e==="pin_body"?106:e==="power_symbol"||e==="power_port"||e==="netclass_flag"?98:50}function fh(t){if(t.length<=Li)return t;let e=t.slice(0,Li);return e.sort((a,s)=>a.source[1]-s.source[1]||a.source[0]-s.source[0]),e}function hh(t,e,a={}){if(!t||!e?.length)return null;let s=a.featureId||a.stableKey||a.sourceId?e.find(d=>a.featureId&&Number(d.featureId||0)===Number(a.featureId)||a.stableKey&&d.stableKey===a.stableKey||a.sourceId&&d.sourceId===a.sourceId):null;if(s)return{...s,kind:"selected-net-occurrence",priority:200};let r=e.filter(d=>d.priority>=118).slice(0,16),n=r.length?r:e.slice(0,16),i=0,o=0;for(let d of n)i+=d.world[0],o+=d.world[1];let c=[i/n.length,o/n.length];return{pageId:t.id,featureId:n[0]?.featureId||0,kind:"page-net-occurrence",source:[0,0],world:c,bounds:[c[0],c[1],c[0],c[1]],priority:1}}function Hi(t,e,a){if(!t||t.length<2)return[];let s=t.map(i=>({...i})).sort((i,o)=>i.world[1]-o.world[1]||i.world[0]-o.world[0]),r=[],n=s.shift();for(;s.length;){let i=0,o=1/0;for(let d=0;d<s.length;d+=1){let u=s[d],b=Math.hypot(u.world[0]-n.world[0],u.world[1]-n.world[1]);b<o&&(o=b,i=d)}let c=s.splice(i,1)[0];r.push({type:e,pageId:a||n.pageId||c.pageId||"",a:n.world,b:c.world,sourceFeatureIds:[n.featureId,c.featureId].filter(Boolean)}),n=c}return r}function qi(t,e=0){return[Math.min(t.a[0],t.b[0])-e,Math.min(t.a[1],t.b[1])-e,Math.max(t.a[0],t.b[0])+e,Math.max(t.a[1],t.b[1])+e]}function ga(t){let e=String(t?.kind||""),s=String(t?.semanticRole||"")||e;return s==="pin_number"||s==="pin_name"?120:s==="pin_body"||e==="pin"?110:s==="symbol_reference"||s==="symbol_value"?92:e==="junction"||e==="no_connect"?88:e==="wire"||e==="bus"||e==="bus_entry"?78:s==="symbol_body"||e==="symbol_body"?45:e==="symbol_instance"||e==="symbol_overplot"?30:e==="text"||String(s).includes("text")?24:10}function ma(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");if(e==="page"||e==="sheet_header")return!0;if(e==="graphic_rect"&&a==="graphic_rect"&&!t?.netUid&&!t?.componentUid){let s=t.boundsMm||[];return s[2]-s[0]>150&&s[3]-s[1]>120}return!1}function bh(t){if(!t||typeof t!="string")return null;let a=t.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);if(!a)return null;let s=a[1],r=a[2]??"ff";return[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255,parseInt(r,16)/255]}function vr(t,e,a=""){let s=bh(a||t?.color||"");return t?.kind==="dnp_marker"?s||[.86,.04,.05,.85]:t?.dnp&&["symbol_reference","symbol_value","symbol_text"].includes(String(t?.kind||""))?[.5,.52,.54,.56]:s||(t?.dnp?[.5,.52,.54,.56]:ya(t)?[.12,.56,.2,.96]:t?.kind==="pin_name"?[0,.28,.31,.96]:t?.kind==="pin_number"?[.45,.17,.16,.96]:t?.kind==="pin_body"?[.28,.18,.18,.88]:t?.kind==="symbol_body"||t?.kind==="symbol_instance"?[.42,.18,.18,.72]:t?.kind==="symbol_reference"||t?.kind==="symbol_value"?[.05,.13,.16,.94]:t?.kind==="text"||String(e||"").startsWith("text")?[.05,.13,.16,.94]:[.16,.17,.19,.7])}function Xi(t,e,a=""){let s=vr(t,e,a);return[s[0]*.72,s[1]*.72,s[2]*.72,Math.min(s[3],.38)]}function ph(t,e,a){return a?5.5:t?.kind==="dnp_marker"?3:["pin_name","pin_number"].includes(String(t?.kind||""))?1.5:t?.kind==="pin_body"?1.7:String(e||"").startsWith("text")?1.35:e==="bus"||t?.kind==="bus"?4.2:ya(t)?2.6:t?.kind==="symbol_body"||t?.kind==="symbol_instance"||t?.kind==="sheet"?1.5:1.25}function ls(t,e,a,s){return t[e++]=a[0],t[e++]=a[1],t[e++]=s[0],t[e++]=s[1],t[e++]=s[2],t[e++]=s[3],e}function gh(t,e,a,s,r,n){let i=Ji(a,s,r);if(!i)return e;for(let o of i)e=ls(t,e,o,n);return e}function mh(t,e,a,s,r,n){return e=ls(t,e,a,n),e=ls(t,e,s,n),e=ls(t,e,r,n),e}function Qt(t,e,a,s,r){return t[e++]=a[0],t[e++]=a[1],t[e++]=s,t[e++]=r,e}function yh(t,e,a,s,r,n,i,o){let c=s[0]-a[0],d=s[1]-a[1],u=Math.hypot(c,d);if(u<1e-6||e+24>t.length)return e;let b=r*.5,w=c/u,h=-(d/u)*b,l=w*b,m=[a[0]+h,a[1]+l],f=[a[0]-h,a[1]-l],p=[s[0]+h,s[1]+l],y=[s[0]-h,s[1]-l],E=i+u/Math.max(o,1e-6);return e=Qt(t,e,m,i,n),e=Qt(t,e,f,i,n),e=Qt(t,e,p,E,n),e=Qt(t,e,p,E,n),e=Qt(t,e,f,i,n),e=Qt(t,e,y,E,n),e}function Ji(t,e,a){let s=e[0]-t[0],r=e[1]-t[1],n=Math.hypot(s,r);if(n<1e-6)return null;let i=a*.5,o=s/n*i,c=r/n*i,d=-r/n*i,u=s/n*i,b=[t[0]-o,t[1]-c],w=[e[0]+o,e[1]+c],v=[b[0]+d,b[1]+u],h=[b[0]-d,b[1]-u],l=[w[0]+d,w[1]+u],m=[w[0]-d,w[1]-u];return[v,h,l,l,h,m]}function xh(t,e,a){let s=a[0]-e[0],r=a[1]-e[1],n=s*s+r*r||1,i=ne(((t[0]-e[0])*s+(t[1]-e[1])*r)/n,0,1),o=e[0]+s*i,c=e[1]+r*i;return Math.hypot(t[0]-o,t[1]-c)}function vh(t,e){let[a,s,r,n]=e,[i,o]=t.a,[c,d]=t.b,u=1e-6,b=(w,v)=>({...t,a:w,b:v});if(Math.abs(o-d)<=u){let w=o;if(w<s-u||w>n+u)return[t];let v=Math.min(i,c),h=Math.max(i,c),l=Math.max(v,a),m=Math.min(h,r);if(m<=l+u)return[t];let f=[],p=i<=c;if(v<l-u){let y=p?[v,w]:[l,w],E=p?[l,w]:[v,w];f.push(b(y,E))}if(m<h-u){let y=p?[m,w]:[h,w],E=p?[h,w]:[m,w];f.push(b(y,E))}return f}if(Math.abs(i-c)<=u){let w=i;if(w<a-u||w>r+u)return[t];let v=Math.min(o,d),h=Math.max(o,d),l=Math.max(v,s),m=Math.min(h,n);if(m<=l+u)return[t];let f=[],p=o<=d;if(v<l-u){let y=p?[w,v]:[w,l],E=p?[w,l]:[w,v];f.push(b(y,E))}if(m<h-u){let y=p?[w,m]:[w,h],E=p?[w,h]:[w,m];f.push(b(y,E))}return f}return[t]}function ds(t,e,a,s){let r=e*12;t.setFloat32(r,a[0],!0),t.setFloat32(r+4,a[1],!0),t.setUint32(r+8,s,!0)}function wh(t,e,a,s,r,n){let i=Ji(a,s,r);if(!i)return e;for(let o of i)ds(t,e,o,n),e+=1;return e}function xr(t,e,a,s,r,n){return ds(t,e,a,n),ds(t,e+1,s,n),ds(t,e+2,r,n),e+3}function Eh(t,e){let a=Array.isArray(t?.layerIds)?t.layerIds:[];if(a.length<2&&t?.startLayerId!=null&&t?.endLayerId!=null&&(a=[t.startLayerId,t.endLayerId]),a.length<2&&t?.layerMask!=null)try{let s=BigInt(String(t.layerMask));a=e.filter((r,n)=>(s&1n<<BigInt(n))!==0n).map(r=>r.id)}catch{a=[]}return a}function Th(t){let e=t?.objectFeatureId??t?.id;if(e!=null&&Number.isFinite(Number(e))&&Number(e)!==0)return`feature:${Number(e)}`;let a=String(t?.sourceUid||"");return a?`source:${a}`:""}function Yi(t,e){let a=new Map(t.map((o,c)=>[Number(o.id),c])),s=new Map(t.map(o=>[Number(o.id),o])),r=new Map,n=new Set,i={thru:0,blind:0,buried:0};for(let o of e){let c=Th(o);if(c){if(n.has(c))continue;n.add(c)}let d=[...new Set(Eh(o,t).map(Number))].filter(y=>a.has(y)).sort((y,E)=>a.get(y)-a.get(E));if(d.length<2)continue;let u=d[0],b=d[d.length-1],w=a.get(u),v=a.get(b),h=w===0,l=v===t.length-1,m=h&&l?"thru":h||l?"blind":"buried";i[m]+=1;let f=`${u}:${b}:${m}`,p=r.get(f);if(p){p.count+=1;continue}r.set(f,{startId:u,endId:b,startName:s.get(u)?.name||String(u),endName:s.get(b)?.name||String(b),startIndex:w,endIndex:v,type:m,count:1})}return{counts:i,spans:[...r.values()]}}var xa="http://www.w3.org/2000/svg";var kh=new Set(["script","foreignobject","iframe","object","embed"]),Mh=new Set(["href","xlink:href"]),Ih=1,Rh=18,Sh=8,bs=class t{static create(e,a,s,r,n={}){return new t(e,a,s,r,n)}constructor(e,a,s,r,n){this.host=e,this.manifestUrl=a,this.manifest=s,this.featuresByPage=r||{},this.callbacks=n,this.activePage=null,this.activeSvgUrl="",this.container=null,this.svg=null,this.overlay=null,this.mountedPages=new Map,this.loadingPages=new Map,this.svgCache=new Map,this.serial=0,this.maxMountedWorldPages=Ih,this.maxCachedSvgPages=Rh,this.worldHandlersInstalled=!1,this.worldDrag=null,this.view={scale:1,tx:0,ty:0},this.drag=null,this.selected=null,this.highlightedNetUid="",this.index=eo(),this.lastStats={mountedPages:0,domNodes:0,indexedFeatures:0,indexedNets:0,mountMs:0,coldMounts:0,warmMounts:0,highlightMs:0,selectionMs:0,cachedSvgPages:0,cachedSvgBytes:0,heapMb:null,fallbackReason:""}}get active(){return!!(this.container&&this.activePage)}get worldActive(){return this.mountedPages.size>0}stats(){return{...this.lastStats,activePage:this.activePage?.name||[...this.mountedPages.values()][0]?.page?.name||"-",mountedPages:this.active?1:this.mountedPages.size}}dispose(){this.unmountPage(),this.unmountWorldPages()}unmountPage(){this.container?.remove(),this.container=null,this.svg=null,this.overlay=null,this.activePage=null,this.activeSvgUrl="",this.index=eo(),this.host.hidden=!0}unmountWorldPages(){for(let e of this.mountedPages.values())e.container.remove();this.mountedPages.clear(),this.loadingPages.clear(),this.active||(this.host.hidden=!0)}async preloadPages(e){let a=performance.now(),s=await Promise.allSettled((e||[]).slice(0,Sh).map(r=>this.loadSvgTemplate(r)));this.lastStats.preloadedPages=s.filter(r=>r.status==="fulfilled"&&r.value).length,this.lastStats.preloadMs=performance.now()-a,this.updateCacheStats()}syncWorldPages(e,a,s={}){if(!a)return;this.installWorldHandlers(a);let r=(e||[]).slice(0,s.maxMountedPages||this.maxMountedWorldPages),n=new Set(r.map(i=>i.id));for(let[i,o]of this.mountedPages)n.has(i)||(o.container.remove(),this.mountedPages.delete(i));for(let i of r){let o=this.mountedPages.get(i.id);if(o)o.lastUsed=++this.serial,this.positionWorldEntry(o,a);else if(!this.loadingPages.has(i.id)){let c=this.mountWorldPage(i).then(d=>{d&&n.has(i.id)?this.positionWorldEntry(d,a):d?.container.remove()}).finally(()=>this.loadingPages.delete(i.id));this.loadingPages.set(i.id,c)}}this.pruneMountedWorldPages(n),this.host.hidden=r.length===0&&!this.active,this.setSelection(this.selected),this.setHighlightedNet(s.activeNetUid??this.highlightedNetUid),this.lastStats.mountedPages=this.mountedPages.size,this.updateCacheStats()}async mountWorldPage(e){let a=performance.now(),s=this.hasCachedSvg(e),r=await this.loadImportedSvg(e);if(!r)return null;let n=document.createElement("div");n.className="svg-dom-page svg-dom-world-page",n.dataset.pageId=e.id,n.append(r),this.host.append(n);let i=Qi(r),o=Zi(r),c=$i(r,e,this.featuresByPage[e.id]||[]),d={page:e,container:n,svg:r,overlay:i,selectionOverlay:o,index:c,mountMs:performance.now()-a,lastUsed:++this.serial,warm:s};return this.mountedPages.set(e.id,d),this.lastStats={...this.lastStats,mountedPages:this.mountedPages.size,domNodes:[...this.mountedPages.values()].reduce((u,b)=>u+b.svg.querySelectorAll("*").length,0),indexedFeatures:[...this.mountedPages.values()].reduce((u,b)=>u+b.index.featureToElements.size,0),indexedNets:new Set([...this.mountedPages.values()].flatMap(u=>[...u.index.netToElements.keys()])).size,mountMs:d.mountMs,coldMounts:this.lastStats.coldMounts+(d.warm?0:1),warmMounts:this.lastStats.warmMounts+(d.warm?1:0),fallbackReason:""},this.updateCacheStats(),d}async loadImportedSvg(e){let a=await this.loadSvgTemplate(e);return a?a.cloneNode(!0):null}async loadSvgTemplate(e){let a=this.svgUrlForPage(e),s=this.svgCache.get(a);if(s?.template)return s.lastUsed=++this.serial,s.template;if(s?.promise)return s.promise;let r=performance.now(),n=(async()=>{let i=await fetch(a,{cache:"default"});if(!i.ok)return this.lastStats.fallbackReason=`Failed to load SVG page ${e.id}: ${i.status}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;let o=await i.text(),d=new DOMParser().parseFromString(o,"image/svg+xml"),u=d.documentElement;if(!u||u.localName.toLowerCase()!=="svg"||d.querySelector("parsererror"))return this.lastStats.fallbackReason=`Invalid SVG for page ${e.id}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;Ah(d,a,e.id);let b=document.importNode(u,!0);b.classList.add("svg-dom-page-svg"),Ch(b);let w=this.svgCache.get(a)||{};return Object.assign(w,{template:b,promise:null,pageId:e.id,byteLength:o.length*2,loadMs:performance.now()-r,lastUsed:++this.serial}),this.svgCache.set(a,w),this.pruneSvgCache(),this.updateCacheStats(),b})();return this.svgCache.set(a,{promise:n,pageId:e.id,byteLength:0,loadMs:0,lastUsed:++this.serial}),n}svgUrlForPage(e){return new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString()}positionWorldEntry(e,a){let{page:s,container:r}=e,[n,i]=a.worldToScreen(s.worldX,s.worldY),[o,c]=a.worldToScreen(s.worldX+s.widthMm,s.worldY+s.heightMm),d=Math.max(1,o-n),u=Math.max(1,c-i);r.style.transform=`translate3d(${n}px, ${i}px, 0)`,r.style.width=`${d}px`,r.style.height=`${u}px`}installWorldHandlers(e){if(this.worldHandlersInstalled)return;this.worldHandlersInstalled=!0;let a=this.host;a.oncontextmenu=s=>s.preventDefault(),a.onpointerdown=s=>{let r=s.button===0&&!s.shiftKey&&!!s.target.closest?.("text"),i=s.target.closest?.("[data-feature-key]")?null:this.featureAtEvent(s);this.worldDrag={pointerId:s.pointerId,startX:s.clientX,startY:s.clientY,lastX:s.clientX,lastY:s.clientY,button:s.button,moved:!1,pan:!r&&(s.button===0||s.button===1||s.shiftKey),allowTextSelection:r},r||a.setPointerCapture(s.pointerId)},a.onpointermove=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let r=s.clientX-this.worldDrag.lastX,n=s.clientY-this.worldDrag.lastY;this.worldDrag.lastX=s.clientX,this.worldDrag.lastY=s.clientY,Math.hypot(s.clientX-this.worldDrag.startX,s.clientY-this.worldDrag.startY)>3&&(this.worldDrag.moved=!0),this.worldDrag.pan&&e.pan(r,n)},a.onpointerup=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let r=this.worldDrag;if(this.worldDrag=null,r.allowTextSelection||a.releasePointerCapture(s.pointerId),r.button!==0||r.moved)return;let n=s.target.closest?.("[data-feature-key]");if(n)this.selectElement(n,s);else{let i=this.featureAtEvent(s);i?this.selectFeature(i.entry,i.feature,s):this.callbacks.onBlank?.()}},a.ondblclick=s=>{let r=s.target.closest?.("[data-feature-key]"),n=r?null:this.featureAtEvent(s),i=n?.entry||this.entryForPoint(s.clientX,s.clientY),o=r?this.selectionFromElement(r):n?this.selectionFromFeature(n.entry,n.feature):this.selected;to(o)?this.callbacks.onOpenPage?.(o):o?.netUid?this.callbacks.onHighlightNet?.(o.netUid,o):!n&&i?.page&&this.callbacks.onOpenPage?.({kind:"page",pageId:i.page.id,page:i.page})},a.onwheel=s=>{s.preventDefault(),Math.abs(s.deltaX)>Math.abs(s.deltaY)*.65?e.pan(-s.deltaX,-s.deltaY):e.zoom(s.deltaY,s.clientX,s.clientY)}}async focusPage(e,a={}){if(!e)return!1;if(this.activePage?.id===e.id&&this.active)return a.frame!==!1&&this.fitPage(),!0;let s=performance.now(),r=await this.loadImportedSvg(e);if(!r)return!1;let n=document.createElement("div");return n.className="svg-dom-page",n.append(r),this.host.replaceChildren(n),this.host.hidden=!1,this.container=n,this.svg=r,this.activePage=e,this.activeSvgUrl=new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString(),this.overlay=Qi(r),this.selectionOverlay=Zi(r),this.index=$i(r,e,this.featuresByPage[e.id]||[]),this.installPageHandlers(),this.fitPage(),this.setSelection(this.selected),this.setHighlightedNet(this.highlightedNetUid),this.lastStats={...this.lastStats,mountedPages:1,domNodes:r.querySelectorAll("*").length,indexedFeatures:this.index.featureToElements.size,indexedNets:this.index.netToElements.size,mountMs:performance.now()-s,fallbackReason:""},this.updateCacheStats(),!0}installPageHandlers(){let e=this.host;e.oncontextmenu=a=>a.preventDefault(),e.onpointerdown=a=>{if(!this.active)return;let s=a.button===0&&!a.shiftKey&&!!a.target.closest?.("text"),r=a.target.closest?.("[data-feature-key]"),n=r?null:this.featureAtEvent(a);this.drag={pointerId:a.pointerId,startX:a.clientX,startY:a.clientY,lastX:a.clientX,lastY:a.clientY,button:a.button,moved:!1,pan:!s&&(a.button===0||a.button===1||a.shiftKey),featureElement:r,allowTextSelection:s},s||e.setPointerCapture(a.pointerId)},e.onpointermove=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=a.clientX-this.drag.lastX,r=a.clientY-this.drag.lastY;this.drag.lastX=a.clientX,this.drag.lastY=a.clientY,Math.hypot(a.clientX-this.drag.startX,a.clientY-this.drag.startY)>3&&(this.drag.moved=!0),this.drag.pan&&(this.view.tx+=s,this.view.ty+=r,this.applyTransform())},e.onpointerup=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=this.drag;if(this.drag=null,s.allowTextSelection||e.releasePointerCapture(a.pointerId),s.button!==0||s.moved)return;let r=a.target.closest?.("[data-feature-key]");if(r)this.selectElement(r,a);else{let n=this.featureAtEvent(a);n?this.selectFeature(n.entry,n.feature,a):this.callbacks.onBlank?.()}},e.ondblclick=a=>{let s=a.target.closest?.("[data-feature-key]"),r=s?null:this.featureAtEvent(a),n=s?this.selectionFromElement(s):r?this.selectionFromFeature(r.entry,r.feature):this.selected;to(n)?this.callbacks.onOpenPage?.(n):n?.netUid?this.callbacks.onHighlightNet?.(n.netUid,n):!r&&this.activePage&&this.callbacks.onOpenPage?.({kind:"page",pageId:this.activePage.id,page:this.activePage})},e.onwheel=a=>{if(a.preventDefault(),!this.active)return;if(Math.abs(a.deltaX)>Math.abs(a.deltaY)*.65){this.view.tx-=a.deltaX,this.view.ty-=a.deltaY,this.applyTransform();return}let s=this.host.getBoundingClientRect(),r=a.clientX-s.left,n=a.clientY-s.top,i=this.screenToSvg(r,n),o=Math.exp(-a.deltaY*.0016);this.view.scale=fs(this.view.scale*o,.02,80),this.view.tx=r-i[0]*this.view.scale,this.view.ty=n-i[1]*this.view.scale,this.applyTransform()}}selectElement(e,a){let s=performance.now(),r=this.selectionFromElement(e);if(this.setSelection(r),a){let n=this.host.getBoundingClientRect();r.anchor={x:a.clientX-n.left,y:a.clientY-n.top}}this.callbacks.onSelect?.(r),this.lastStats.selectionMs=performance.now()-s}selectFeature(e,a,s){let r=performance.now(),n=this.selectionFromFeature(e,a);if(this.setSelection(n),s){let i=this.host.getBoundingClientRect();n.anchor={x:s.clientX-i.left,y:s.clientY-i.top}}this.callbacks.onSelect?.(n),this.lastStats.selectionMs=performance.now()-r}selectionFromElement(e){let a=e.dataset.featureKey||"",s=this.entryForElement(e),r=s.index.featureByKey.get(a)||{};return this.selectionFromFeature(s,r,e)}selectionFromFeature(e,a,s=null){let r=a?.stableKey||s?.dataset?.featureKey||"",n=e?.page||this.activePage,i=a?.kind||s?.dataset?.role||s?.dataset?.primitive||"feature",o=a?.netUid||s?.dataset?.netUid||"",c=a?.netName||s?.dataset?.netName||"";return i==="sheet"?{kind:"sheet",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",sheetName:a?.sheet_name||a?.sheetName||s?.dataset?.sheetName||a?.objectId||"",sheetFile:a?.sheet_file||a?.sheetFile||s?.dataset?.sheetFile||"",feature:a}:i==="pin"||i==="pin_body"||i==="pin_name"||i==="pin_number"||s?.dataset?.pin?{kind:"pin",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",pinNumber:a?.pinNumber||s?.dataset?.pin||"",pinName:a?.pinName||"",netUid:o,netName:c,feature:a}:i==="symbol_body"||i==="symbol_instance"||i==="component"||s?.dataset?.ref?{kind:"component",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",netUid:o,netName:c,feature:a}:{kind:o?"feature":i,featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",role:i,netUid:o,netName:c,feature:a}}setSelection(e){this.selected=e||null;for(let s of this.host.querySelectorAll(".prism-svg-selected"))s.classList.remove("prism-svg-selected");for(let s of this.host.querySelectorAll("[data-prism-overlay='selection']"))s.replaceChildren();let a=e?.featureKey||"";if(a){for(let s of this.entries()){for(let r of s.index.featureToElements.get(a)||[])r.classList.add("prism-svg-selected");this.drawSelectionOverlay(s,e)}for(let s of this.index.featureToElements.get(a)||[])s.classList.add("prism-svg-selected");this.drawSelectionOverlay({page:this.activePage,index:this.index,selectionOverlay:this.selectionOverlay},e)}}setHighlightedNet(e){this.highlightedNetUid=e||"";let a=performance.now();for(let s of this.entries())this.updateEntryHighlight(s);if(!this.svg||!this.overlay){this.lastStats.highlightMs=performance.now()-a;return}this.updateEntryHighlight({svg:this.svg,overlay:this.overlay,index:this.index,page:this.activePage}),this.lastStats.highlightMs=performance.now()-a}updateEntryHighlight(e){if(!e?.svg||!e?.overlay||(e.overlay.replaceChildren(),!this.highlightedNetUid))return;let a=hs(e.svg,e.page),s=document.createElementNS(xa,"rect");s.setAttribute("x",String(a[0])),s.setAttribute("y",String(a[1])),s.setAttribute("width",String(a[2])),s.setAttribute("height",String(a[3])),s.setAttribute("class","prism-svg-net-dimmer"),e.overlay.append(s);let n=(e.index.netToElements.get(this.highlightedNetUid)||[]).slice(0,2200);for(let i of n){let o=Oh(i);e.overlay.append(o)}}entries(){return[...this.mountedPages.values()]}entryForElement(e){let s=e.closest?.(".svg-dom-page")?.dataset.pageId||"";return this.mountedPages.get(s)||{page:this.activePage,index:this.index,svg:this.svg,overlay:this.overlay,selectionOverlay:this.selectionOverlay}}featureAtEvent(e){let a=this.entryForPoint(e.clientX,e.clientY);if(!a)return null;let s=this.clientToSvg(a,e.clientX,e.clientY);if(!s)return null;let r=Math.max(.18,5*Dh(a)),i=a.index.features.filter(o=>(o?.domBoundsMm||o?.boundsMm)&&ro(o)).filter(o=>s[0]>=(o.domBoundsMm||o.boundsMm)[0]-r&&s[0]<=(o.domBoundsMm||o.boundsMm)[2]+r&&s[1]>=(o.domBoundsMm||o.boundsMm)[1]-r&&s[1]<=(o.domBoundsMm||o.boundsMm)[3]+r).map(o=>({feature:o,priority:Lh(o),area:Math.max(1e-4,((o.domBoundsMm||o.boundsMm)[2]-(o.domBoundsMm||o.boundsMm)[0])*((o.domBoundsMm||o.boundsMm)[3]-(o.domBoundsMm||o.boundsMm)[1]))})).sort((o,c)=>c.priority-o.priority||o.area-c.area)[0]?.feature;return i?{entry:a,feature:i,point:s}:null}entryForPoint(e,a){for(let s of[...this.entries()].reverse()){let r=s.container.getBoundingClientRect();if(e>=r.left&&e<=r.right&&a>=r.top&&a<=r.bottom)return s}if(this.container){let s=this.container.getBoundingClientRect();if(e>=s.left&&e<=s.right&&a>=s.top&&a<=s.bottom)return{page:this.activePage,container:this.container,svg:this.svg,index:this.index,selectionOverlay:this.selectionOverlay}}return null}clientToSvg(e,a,s){if(!e?.container||!e?.svg||!e?.page)return null;let r=e.container.getBoundingClientRect();if(!r.width||!r.height)return null;let n=hs(e.svg,e.page);return[n[0]+(a-r.left)/r.width*n[2],n[1]+(s-r.top)/r.height*n[3]]}drawSelectionOverlay(e,a){if(!e?.selectionOverlay||!a?.featureKey)return;let s=e.index.featureByKey.get(a.featureKey),r=s?.domBoundsMm||s?.boundsMm;if(!r)return;let[n,i,o,c]=r,d=document.createElementNS(xa,"rect");d.setAttribute("x",String(n)),d.setAttribute("y",String(i)),d.setAttribute("width",String(Math.max(.001,o-n))),d.setAttribute("height",String(Math.max(.001,c-i))),d.setAttribute("rx","0.65"),d.setAttribute("ry","0.65"),d.setAttribute("class","prism-svg-selection-box"),e.selectionOverlay.append(d)}fitPage(){if(!this.svg||!this.activePage)return;let e=hs(this.svg,this.activePage),a=e[2]||this.activePage.sourceWidthMm||this.activePage.widthMm||1,s=e[3]||this.activePage.sourceHeightMm||this.activePage.heightMm||1,r=this.host.getBoundingClientRect(),n=Math.min(r.width/a,r.height/s)*.92;this.view.scale=fs(n,.02,80),this.view.tx=(r.width-a*this.view.scale)/2-e[0]*this.view.scale,this.view.ty=(r.height-s*this.view.scale)/2-e[1]*this.view.scale,this.applyTransform()}frameSelection(e=this.selected){if(!e?.featureKey||!this.active){this.fitPage();return}let a=this.index.featureToElements.get(e.featureKey)||[],s=so(a);if(!s)return;let r=this.host.getBoundingClientRect(),n=Math.max(1,s[2]-s[0]),i=Math.max(1,s[3]-s[1]),o=Math.min(r.width/n,r.height/i)*.36;this.view.scale=fs(o,.04,80),this.view.tx=r.width/2-(s[0]+s[2])/2*this.view.scale,this.view.ty=r.height/2-(s[1]+s[3])/2*this.view.scale,this.applyTransform()}pan(e,a){this.active&&(this.view.tx+=e,this.view.ty+=a,this.applyTransform())}zoom(e,a,s){if(!this.active)return;let r=this.host.getBoundingClientRect(),n=(a??r.left+r.width/2)-r.left,i=(s??r.top+r.height/2)-r.top,o=this.screenToSvg(n,i),c=Math.exp(-e*.0016);this.view.scale=fs(this.view.scale*c,.02,80),this.view.tx=n-o[0]*this.view.scale,this.view.ty=i-o[1]*this.view.scale,this.applyTransform()}screenToSvg(e,a){return[(e-this.view.tx)/Math.max(1e-6,this.view.scale),(a-this.view.ty)/Math.max(1e-6,this.view.scale)]}applyTransform(){this.container&&(this.container.style.transform=`translate3d(${this.view.tx}px, ${this.view.ty}px, 0) scale(${this.view.scale})`)}hasCachedSvg(e){return!!this.svgCache.get(this.svgUrlForPage(e))?.template}pruneMountedWorldPages(e=new Set){if(this.mountedPages.size<=this.maxMountedWorldPages)return;let a=[...this.mountedPages.entries()].filter(([s])=>!e.has(s)).sort((s,r)=>(s[1].lastUsed||0)-(r[1].lastUsed||0));for(let[s,r]of a){if(this.mountedPages.size<=this.maxMountedWorldPages)break;r.container.remove(),this.mountedPages.delete(s)}}pruneSvgCache(){let e=[...this.svgCache.entries()].filter(([,r])=>r?.template);if(e.length<=this.maxCachedSvgPages)return;let a=new Set([...this.mountedPages.values()].map(r=>this.svgUrlForPage(r.page)));this.activePage&&a.add(this.svgUrlForPage(this.activePage));let s=e.filter(([r])=>!a.has(r)).sort((r,n)=>(r[1].lastUsed||0)-(n[1].lastUsed||0));for(let[r]of s){if([...this.svgCache.values()].filter(n=>n?.template).length<=this.maxCachedSvgPages)break;this.svgCache.delete(r)}}updateCacheStats(){let e=[...this.svgCache.values()].filter(s=>s?.template);this.lastStats.cachedSvgPages=e.length,this.lastStats.cachedSvgBytes=e.reduce((s,r)=>s+(r.byteLength||0),0);let a=performance?.memory;this.lastStats.heapMb=a?.usedJSHeapSize?a.usedJSHeapSize/1048576:null}};function Ah(t,e,a){for(let n of[...t.querySelectorAll("*")]){if(kh.has(n.localName.toLowerCase())){n.remove();continue}for(let i of[...n.attributes]){let o=i.name,c=o.toLowerCase(),d=i.value||"";if(c.startsWith("on")){n.removeAttribute(o);continue}if((c==="href"||c==="xlink:href"||c==="src")&&no(d)){if((c==="href"||c==="xlink:href")&&n.localName.toLowerCase()==="image"&&Gh(d))continue;n.removeAttribute(o);continue}c==="style"&&n.setAttribute(o,Vh(d))}}let s=`prism-${wr(a)}-`,r=new Map;for(let n of t.querySelectorAll("[id]")){let i=n.getAttribute("id"),o=`${s}${wr(i)}`;r.set(i,o),n.setAttribute("id",o)}for(let n of t.querySelectorAll("*"))for(let i of[...n.attributes]){let o=i.name.toLowerCase(),c=i.value||"";Mh.has(o)&&(c.startsWith("#")&&r.has(c.slice(1))?c=`#${r.get(c.slice(1))}`:zh(c)&&(c=new URL(c,e).toString())),c=Hh(c,r),n.setAttribute(i.name,c)}}function $i(t,e,a){let s=new Map,r=new Map,n=new Map,i=[];for(let u of a){let b=Fh(u,e);i.push(b),r.set(b.stableKey,b),n.set(Number(b.id||0),b);for(let w of jh(b))s.has(w)||s.set(w,[]),s.get(w).push(b)}let o=new Map,c=new Map,d=new Map;for(let u of i)d.set(u.stableKey,u);for(let u of t.querySelectorAll("[data-uuid], [data-element-key], [data-primitive], [data-ref], [data-pin], [data-object-id], [data-designator], [data-component]")){let b=_h(u,s,e);if(b&&!ro(b)||!b&&!Kh(u))continue;let w=Bh(u,e),v=b?.stableKey||w,h=b?.netUid||"",l=b?.netName||"";u.classList.add("prism-feature"),u.dataset.featureKey=v,u.dataset.sourceId=b?.sourceId||u.dataset.uuid||u.dataset.elementKey||"",u.dataset.role=b?.kind||u.dataset.primitive||u.dataset.ref||"feature",b?.id&&(u.dataset.featureId=String(b.id)),h&&(u.dataset.netUid=h),l&&(u.dataset.netName=l),u.id||(u.id=`prism-feature-${wr(v)}`),ao(o,v,u),d.set(v,b||{id:0,stableKey:v,kind:u.dataset.role,sourceId:u.dataset.sourceId,sheetInstancePath:e.sheetInstancePath||""}),h&&ao(c,h,u)}for(let[u,b]of o){let w=d.get(u),v=so(b);w&&v&&(w.domBoundsMm=Ph(w.boundsMm,v))}return{featureToElements:o,netToElements:c,featureByKey:d,byId:n,bySource:s,features:i}}function _h(t,e,a){let r=[t.dataset.uuid,t.dataset.elementKey,t.dataset.sourceId,t.dataset.objectId,t.dataset.componentUid,t.dataset.componentUuid,t.dataset.ref&&`${t.dataset.ref}:${t.dataset.pin||""}`].filter(Boolean).flatMap(i=>e.get(i)||[]);if(!r.length)return null;let n=String(t.dataset.primitive||t.dataset.ref||t.dataset.pin||"").toLowerCase();return r.map(i=>({feature:i,score:Nh(i,n,a)})).sort((i,o)=>o.score-i.score)[0].feature}function Nh(t,e,a){let s=0,r=String(t.kind||"").toLowerCase();return t.sheetInstancePath===a.sheetInstancePath&&(s+=20),t.netUid&&(s+=4),e&&r.includes(e)&&(s+=8),e==="symbol"&&r==="symbol_body"&&(s+=12),(e==="label"||e==="port")&&(r.includes("label")||r.includes("port"))&&(s+=12),e==="sheet"&&r==="sheet"&&(s+=12),r!=="record"&&(s+=2),r.includes("pin")&&(s+=2),s}function Fh(t,e){let a=t.sourceId||t.sourceUid||t.uuid||t.objectId||t.stableKey||"";return{...t,id:Number(t.id||0),sourceId:a,stableKey:t.stableKey||`${e.sheetInstancePath||e.id}|${a}|0|${t.kind||"feature"}|0`,sheetInstancePath:t.sheetInstancePath||e.sheetInstancePath||""}}function jh(t){let e=new Set([t.sourceId,t.sourceUid,t.uuid,t.objectId,t.stableKey].filter(Boolean).map(String));return t.reference&&t.pinNumber&&e.add(`${t.reference}:${t.pinNumber}`),t.componentDesignator&&e.add(t.componentDesignator),t.reference&&e.add(t.reference),[...e]}function Bh(t,e){let a=t.dataset.uuid||t.dataset.elementKey||t.dataset.objectId||t.dataset.ref||t.id||"svg",s=t.dataset.primitive||t.dataset.role||t.localName||"feature";return`${e.sheetInstancePath||e.id}|${a}|0|${s}|0`}function Ch(t){let e=document.createElementNS(xa,"style");e.textContent=`
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
  `,t.prepend(e)}function Qi(t){let e=document.createElementNS(xa,"g");return e.setAttribute("class","prism-svg-net-overlay"),e.setAttribute("data-prism-overlay","net-highlight"),t.append(e),e}function Zi(t){let e=document.createElementNS(xa,"g");return e.setAttribute("class","prism-svg-selection-overlay"),e.setAttribute("data-prism-overlay","selection"),e.style.pointerEvents="none",t.append(e),e}function Oh(t){let e=t.cloneNode(!0);e.removeAttribute("id"),e.removeAttribute("data-feature-key"),e.removeAttribute("data-net-uid"),e.removeAttribute("data-net-name"),e.classList.add("prism-svg-net-overlay-clone");for(let a of[e,...Array.from(e.querySelectorAll?.("*")||[])])a instanceof SVGElement&&(a.removeAttribute("filter"),a.style.pointerEvents="none",a.style.stroke="#18ef52",a.style.fill="none",a.style.opacity="0.98",a.style.vectorEffect="non-scaling-stroke");return e}function so(t){let e=null;for(let a of t)if(a.getBBox)try{let s=a.getBBox(),r=[s.x,s.y,s.x+s.width,s.y+s.height];e=e?[Math.min(e[0],r[0]),Math.min(e[1],r[1]),Math.max(e[2],r[2]),Math.max(e[3],r[3])]:r}catch{}return e}function Ph(t,e){return t?e?[Math.min(t[0],e[0]),Math.min(t[1],e[1]),Math.max(t[2],e[2]),Math.max(t[3],e[3])]:t:e}function hs(t,e){let a=t.getAttribute("viewBox");if(a){let s=a.trim().split(/[\s,]+/).map(Number);if(s.length===4&&s.every(Number.isFinite))return s}return[0,0,e.sourceWidthMm||e.widthMm||1,e.sourceHeightMm||e.heightMm||1]}function eo(){return{featureToElements:new Map,netToElements:new Map,featureByKey:new Map,byId:new Map,bySource:new Map,features:[]}}function Dh(t){let e=t?.container?.getBoundingClientRect?.();if(!t?.svg||!t?.page||!e?.width||!e?.height)return .1;let a=hs(t.svg,t.page);return Math.max(a[2]/e.width,a[3]/e.height)}function Uh(t){let e=String(t?.kind||"").toLowerCase(),a=String(t?.semanticRole||"").toLowerCase(),s=`${t?.sourceId||""} ${t?.objectId||""} ${t?.text||""}`.toLowerCase();return e.includes("page")||a.includes("page")||e.includes("background")||a.includes("background")||s.includes("background")||s.includes("sheet_header")||s.includes("sheet header")||s.includes("drawing-sheet")}function Lh(t){let e=String(t?.kind||t?.semanticRole||"").toLowerCase();return e.includes("pin")?90:e.includes("label")||e.includes("port")?78:e.includes("wire")||e.includes("bus")||e.includes("junction")?70:e.includes("symbol")||e.includes("component")?54:e.includes("image")?30:20}function ro(t){if(!t||Uh(t))return!1;let e=String(t.kind||t.semanticRole||"").toLowerCase();return["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function Kh(t){let e=`${t?.dataset?.primitive||""} ${t?.dataset?.ref||""} ${t?.dataset?.role||""} ${t?.dataset?.objectId||""} ${t?.dataset?.text||""}`.toLowerCase();return!e||e.includes("background")||e.includes("sheet_header")||e.includes("sheet header")||e.includes("drawing-sheet")?!1:["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function to(t){return String(t?.kind||t?.feature?.kind||"").toLowerCase()==="sheet"}function ao(t,e,a){t.has(e)||t.set(e,[]),t.get(e).push(a)}function no(t){let e=String(t||"").trim().toLowerCase();return!e||e.startsWith("#")?!1:e.startsWith("javascript:")||e.startsWith("data:")||e.startsWith("http://")||e.startsWith("https://")}function Gh(t){return/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(String(t||"").trim())}function zh(t){let e=String(t||"").trim();return e&&!e.startsWith("#")&&!/^[a-z][a-z0-9+.-]*:/i.test(e)}function Vh(t){return String(t||"").replace(/url\(([^)]+)\)/gi,(e,a)=>{let s=a.trim().replace(/^['"]|['"]$/g,"");return no(s)?"none":e})}function Hh(t,e){let a=String(t||"");return a=a.replace(/url\(#([^)]+)\)/g,(s,r)=>e.has(r)?`url(#${e.get(r)})`:s),a=a.replace(/^#(.+)$/,(s,r)=>e.has(r)?`#${e.get(r)}`:s),a}function wr(t){return String(t||"").trim().replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,96)||"item"}function fs(t,e,a){return Math.max(e,Math.min(a,t))}var io=512*1024*1024,qh=.65,Xh=120,Wh=12,Jh=48,xo=230,Yh=40,$h=4,Rr=document,It,q,Ee,ws,Es,Ts,wa,Fs,Ye,gs,Ea,Ge,fe,Re,ms,ks,Ta,we,Q,js,Bs,Ie,ea,$=t=>Rr.querySelector(t),Ut=t=>Rr.querySelectorAll(t);function Qh(t=document){Rr=t,It=$("#app"),q=$("#viewport"),Ee=$("#schematic-viewport"),ws=$("#schematic-dom-layer"),Es=$("#schematic-flow-overlay"),Ts=$("#bom-view"),wa=$("#status")||{set textContent(e){}},Fs=$("#viewer-kind")||{set textContent(e){}},Ye=$("#selection")||{set textContent(e){}},gs=$("#diagnostics")||{set innerHTML(e){}},Ea=$("#scene-stats"),Ge=$("#layers"),fe=$("#search-controls"),Re=$("#view-controls"),Ie=$("#stackup-workspace-view"),ms=$("#fallback"),ks=$("#panel-labels"),Ta=$("#schematic-labels"),we=$("#axis-gizmo"),Q=$("#selection-card"),js=$("#primary-heading"),Bs=$("#primary-description"),ea=$("#mode-switch"),It.classList.add("workspace-pcb")}function vo(){return{workspace:"pcb",mode:"3d",activeNetId:0,selectedFeatureId:0,selectedOccurrence:0,selectionAnchor:null,showBoard:!0,showComponents:!0,showPlaceholders:!0,realisticColors:!0,isolateNet:!1,savedShowBoard:!0,savedShowComponents:!0,preIsolationShowBoard:null,separation:0,dragging:!1,dragMode:"orbit",lastX:0,lastY:0,pointerStartX:0,pointerStartY:0,frameCpuMs:0,frameCpuP95Ms:0,frameIntervalMs:0,frameIntervalP95Ms:0,frameSamples:[],fps:0,frames:0,fpsAt:performance.now(),activeTab:"layers",selectedPageId:"",selectedSchematicFeature:null,schematicDragging:!1,schematicLastX:0,schematicLastY:0,schematicStartX:0,schematicStartY:0}}function wo(t={}){return{key:t.key??"board",topology:t.topology||window.__TOPOLOGY__||{},semanticGeometry:t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},viewerReadiness:t.readiness||{stage:"semantic-ready",progress:100},assetCache:t.assetCache||null,deferComponents:!!t.deferComponents,scene:Zh(),renderer:null,compareLayers:new Set,desiredCompareLayers:new Set,visible3dLayers:new Set,preIsolation3dLayers:null,preIsolationCompareLayers:null,highlightedNetIds:new Set,hiddenComponents:new Set,hiddenComponentRequest:null,loadedBytes:0,triangles:0,residentTileBytes:0,residentTileGpuBytes:0,residentTileTriangles:0,tileLoads:0,tileEvictions:0,tileSchedulerMs:0,lastTileScheduleAt:0,visibleTileIds:new Set,gpuBytes:0}}function Zh(){return{manifest:null,manifestUrl:"",layers:[],copperLayers:[],nets:[],features:new Map,tiles:new Map,loaded:new Set,loading:new Map,failed:new Map,residentTiles:new Map,componentFeatures:new Map,componentModelCounts:new Map,componentTier:"idle",componentEntries:[],componentsWantedAt:0,componentEvictions:0,runtimeBounds:null,occurrenceBounds:null,layerZOffsets:new Float32Array(256),layerZOffsetSignature:""}}function Eo(){return{key:"",started:0,from:new Map,current:new Map}}function To(){return{phase:"idle",previous:new Set,target:new Set,previousOffsets:new Map,started:0}}function ko(){return{manifest:null,manifestUrl:"",pages:[],byId:new Map,activeNetUid:"",visiblePages:[],fitted:!1,rendererMode:new URLSearchParams(location.search).get("schematicRenderer")||"svg-dom",domFallbackReason:""}}var x=vo(),g=wo(),be=Eo(),z=To(),O=ko(),Ms=[],oo=1.5*1024*1024*1024,eb=5e3,_,J,ze,V,Se,Lt=new Map,va=performance.now(),Te=0,ys=0,Sr=null,kr=null,Mr=null,Er=!1,ta=!1,Ar=()=>!0,Is=!0;!window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__&&document.getElementById("app")&&Nr().catch(t=>{console.error(t),wa&&(wa.textContent="Renderer failed"),ms&&(ms.hidden=!1,ms.textContent=t.stack||t.message||String(t))});function tb(t){let e=new Map((t.components||[]).map(s=>[s.uid,s])),a={};for(let s of t.terminals||[]){let r=s.net_uid;if(!r)continue;let n=e.get(s.component_uid)||{},i={designator:s.designator||n.designator||"",pin:s.pin||"",value:n.value||"",pcb_pad_id:s.pcb_pad_id||""};a[r]||(a[r]={terminals:[]});let o=a[r].terminals;o.some(c=>c.designator===i.designator&&c.pin===i.pin)||o.push(i)}return a}function ab(t){if(!t||!g.topology||!g.topology.physical_objects)return 0;let e=g.topology.physical_objects.find(s=>s.uid===t);if(!e||!e.source_ids||!e.source_ids.length)return 0;let a=e.source_ids[0];for(let[s,r]of g.scene.features.entries())if(r.sourceUid===a)return s;return 0}function _r(t){return!t||!g.topology||!g.topology.components?null:g.topology.components.find(e=>e.designator===t)}function ps(t,e){for(let a of Object.keys(t))delete t[a];Object.assign(t,e)}function Mo(){ys&&(cancelAnimationFrame(ys),ys=0),window.removeEventListener("keydown",lc),g.renderer?.dispose?.(),g.renderer=null,_=null,J?.dispose?.(),J=null,ze=null,Sr=null,Ar=()=>!0,Is=!0}function sb(){return Te+=1,Mo(),ps(x,vo()),g=wo(),ps(be,Eo()),ps(z,To()),ps(O,ko()),Ms=[],V=null,Se=null,Lt=new Map,va=performance.now(),Te}function rb(t){t===Te&&(Te+=1,Mo())}function Ir(t){t===Te&&(ys=requestAnimationFrame(e=>_b(e,t)))}function me(t){return t===Te}async function Nr(t={}){let e=sb(),a={};if(g.topology=t.topology||window.__TOPOLOGY__||{},g.topology&&!g.topology.net_details&&(g.topology.net_details=tb(g.topology)),g.semanticGeometry=t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},g.viewerReadiness=t.readiness||g.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},Sr=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,Mr=typeof t.onContextMenu=="function"?t.onContextMenu:null,kr=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,Ar=typeof t.isActive=="function"?t.isActive:()=>!0,Is=t.workspaceScope!=="3d",g.assetCache=t.assetCache||null,g.deferComponents=!!t.deferComponents,x.gpuBudgetBytes=oo,Qh(t.root||document),!It||!q)throw new Error("Semantic viewer shell is missing required DOM nodes");return await ob(e,a,t.onPerformanceEvent),{performance:a,setSelection(s){ta=!0;try{if(s?.occurrence!=null&&nb(s.occurrence),!s)Rt();else if(s?.netName||s?.netUid){let r=s.netUid&&g.scene.nets.find(n=>n.uid===s.netUid)||s.netName&&jt(g.scene.nets,s.netName);r&&As(Number(r.id),!0)}else s?.netId?As(Number(s.netId),!0):s?.featureId?na(Number(s.featureId),!0):s?.reference&&Dr(String(s.reference),!0)}finally{ta=!1}},resize(){g.renderer?.resize(),_?.resize(),x.workspace==="pcb"&&x.mode==="layer"&&Cr()},setWorkspace(s){let r=s==="stackup"?"stackup":"pcb";x.workspace!==r&&nc(r)},setHiddenComponents(s){return rc(s)},getComponentReferences(){return[...g.scene.componentFeatures.keys()]},setHighlightedNets(s){return ib(s)},setOccurrences(s){return Eb(s)},setStatsOverlay(s){Do(s)},stats(){return Po()},setLodOverride(s){g.renderer?.setLodOverride(s)},setGpuBudget(s){let r=Number(s);x.gpuBudgetBytes=Number.isFinite(r)&&r>0?r:oo,x.tiersCheckedAt=0},pickAt(s,r){return op(s,r)},projectComponent(s,r){return lp(s,r)},projectPoint(s,r){return cc(s,r)},getViewState:Io,setViewMode:$o,setLayerVisible:Qo,applyLayerPreset:Zo,setShowBoard:ec,setShowComponents:tc,setShowPlaceholders:Xb,setRealisticColors:Wb,setSeparation:ac,showNetLayers:Pr,setNetIsolation:ra,dispose(){rb(e)}}}function ka(){!kr||Er||(Er=!0,queueMicrotask(()=>{Er=!1,kr?.(Io())}))}function Io(){let t=x.mode==="3d"?g.visible3dLayers:g.desiredCompareLayers;return{mode:x.mode,layers:g.scene.copperLayers.map(e=>({id:Number(e.id),name:String(e.name),color:uc(Br(e)),visible:t.has(Number(e.id))})),showBoard:x.showBoard,showComponents:x.showComponents,showPlaceholders:x.showPlaceholders,realisticColors:x.realisticColors,separation:x.separation,isolateNet:x.isolateNet,hasNet:!!x.activeNetId||Je().size>0}}function Cs(t){if(ta)return;let e=g.renderer&&!g.renderer.identityOnly?g.renderer.occurrenceKeys[x.selectedOccurrence]:null;Sr?.(t&&e!=null?{...t,occurrence:e}:t)}function nb(t){let e=g.renderer?.occurrenceKeys.indexOf(String(t))??-1;e>=0&&(x.selectedOccurrence=e)}function Fr(t){if(!t||!g.renderer||g.renderer.identityOnly)return t;let e=g.renderer.occurrenceMatrices[x.selectedOccurrence];return e?Ot(e,t):t}function Ro(t,e=null){return t?{kind:"net",sourceContext:"3D",netName:String(t.name||""),netUid:String(t.uid||"")||void 0,netCode:Number(t.id||0)||void 0,featureId:Number(e?.id||0)||void 0,uuid:String(e?.sourceUid||"")||void 0}:null}function So(t){if(!t)return null;let e=aa(t),a=String(t.padNumber||t.pin||t.pinNumber||""),s=g.scene.nets.find(r=>Number(r.id)===Number(t.netId||0));if(e&&a)return{kind:"terminal",sourceContext:"3D",reference:e,pin:a,netUid:s?.uid,netName:s?.name,netCode:s?Number(s.id):void 0,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0};if(e){let r=_r(e);return{kind:"component",sourceContext:"3D",reference:e,componentUid:r?.uid,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0}}return Ro(s,t)}function Ao(){x.showBoard=!0,x.showComponents=!0,Kt(),typeof Ce=="function"&&Ce()}function Je(){let t=new Set(g.highlightedNetIds);return x.activeNetId&&t.add(Number(x.activeNetId)),t}function ib(t){let e=Array.isArray(t)?t:[],a=nn(g.scene.nets,e),s=Je().size>0;g.highlightedNetIds=a,g.renderer?.setEmphasizedNetIds(a);let r=Je().size>0;return r&&!s?jr():!r&&s&&_o(),x.isolateNet&&r&&Ra(),pe(performance.now(),{force:!0}),{applied:a.size,requested:e.length}}function jr(){(x.showBoard||x.showComponents)&&(x.savedShowBoard=x.showBoard,x.savedShowComponents=x.showComponents),x.showBoard=!1,x.showComponents=!1,Kt(),typeof Ce=="function"&&Ce()}function _o(){x.showBoard=x.savedShowBoard!==!1,x.showComponents=x.savedShowComponents!==!1,Kt(),typeof Ce=="function"&&Ce()}async function ob(t,e={},a=null){let s=performance.now(),r=g.semanticGeometry.assets?.scene_manifest||g.semanticGeometry.semantic_gltf?.path,n=performance.now();if(r){if(g.scene.manifestUrl=new URL(r,location.href).toString(),g.scene.manifest=await db(g.scene.manifestUrl),e.scene_manifest_fetch_parse_ms=performance.now()-n,!me(t))return;if(g.scene.manifest.schema!=="prism.semantic_gltf_a0")throw new Error(`Unsupported scene schema: ${g.scene.manifest.schema}`)}else g.scene.manifest={schema:"prism.semantic_gltf_partial.a0",bbox:null,layers:[],nets:[],objectFeatures:[],components:[],tiles:[],barrels:[]},e.scene_manifest_fetch_parse_ms=0;n=performance.now(),g.scene.layers=g.scene.manifest.layers||[],g.scene.copperLayers=g.scene.layers.filter(d=>d.role==="copper"||String(d.name).endsWith(".Cu")),g.scene.nets=g.scene.manifest.nets||[];for(let d of g.scene.manifest.objectFeatures||[])g.scene.features.set(Number(d.id),{...d,bounds:qt(d.boundsMm)});for(let d of g.scene.manifest.components||[])g.scene.componentFeatures.set(d.designator,d),g.scene.features.set(Number(d.featureId),{...d,kind:"component",sourceUid:d.uid,netId:0,bounds:null});for(let d of g.scene.manifest.tiles||[])g.scene.tiles.set(d.id,d);e.scene_manifest_index_ms=performance.now()-n;let i=Fo();for(let d of i)g.compareLayers.add(d),g.desiredCompareLayers.add(d);for(let d of g.scene.copperLayers)g.visible3dLayers.add(Number(d.id));if(n=performance.now(),g.renderer=await Dt.create(q),e.webgpu_renderer_create_ms=performance.now()-n,!me(t)){g.renderer?.dispose?.(),g.renderer=null;return}g.renderer.setBarrels(g.scene.manifest.barrels||[]),Or(),n=performance.now();let o=await xb(t);if(e.board_fetch_parse_upload_ms=performance.now()-n,!me(t)||(g.scene.runtimeBounds=o||Xt(g.scene.manifest.bbox),V=new Vt(g.scene.runtimeBounds),Is&&(await cb(t),!me(t)||(await lb(t),!me(t)))))return;n=performance.now(),Xo(),ap(),Is&&(np(),rp()),Yb(),up(),e.controls_and_bindings_ms=performance.now()-n;let c={"board-ready":"Board ready \xB7 components and semantic layers are still generating","components-ready":"Board and components ready \xB7 semantic layers are still generating","semantic-ready":"WebGPU semantic glTF active"};if(wa.textContent=c[g.viewerReadiness.stage]||"Loading 3D assets",g.semanticGeometry.assets?.components_glb&&!g.deferComponents){let d=performance.now();Lo(t).then(()=>{me(t)&&(ho(o),a?.({schema:"prism.semantic_viewer_performance.a0",milestone:"components-loaded",readiness_stage:g.viewerReadiness.stage,elapsed_ms:performance.now()-d,bytes_loaded:g.loadedBytes}))})}else ho(o);pe(performance.now(),{force:!0}),Ir(t),n=performance.now(),await new Promise(d=>requestAnimationFrame(d)),e.first_frame_wait_ms=performance.now()-n,e.boot_total_ms=performance.now()-s}async function cb(t=Te){let e=g.semanticGeometry.assets?.schematic_native_manifest||g.semanticGeometry.schematic_vector?.path||g.semanticGeometry.schematic_scene?.path,a=g.semanticGeometry.assets?.schematic_manifest||g.semanticGeometry.schematic_world?.path,s=$("[data-workspace=schematic]");if(!e&&!a){s.disabled=!0,s.title="No schematic world assets are available";return}let r=[e,a].filter(Boolean),n=null;for(let o of r)try{O.manifestUrl=new URL(o,location.href).toString();let c=await us.create(Ee,O.manifestUrl);if(!me(t))return;_=c,_.setFlowOverlayCanvas(Es);break}catch(c){if(n=c,_=null,o===a)throw c}if(!_)throw n||new Error("Failed to load schematic viewer assets");O.manifest=_.manifest,O.pages=_.pages,O.byId=new Map(O.pages.map(o=>[o.id,o])),x.selectedPageId=O.pages[0]?.id||"",_.selectedPageId=x.selectedPageId,!["native","legacy","webgpu"].includes(String(O.rendererMode).toLowerCase())&&(J=bs.create(ws,O.manifestUrl,O.manifest,_.featuresByPage,{onSelect:zb,onBlank:Ia,onHighlightNet:Jo,onOpenPage:Kb,onFallback:o=>{O.domFallbackReason=o,console.warn(o)}}),J.preloadPages(O.pages)),_.preloadOverview()}async function lb(t=Te){let e=g.semanticGeometry.assets?.bom||g.semanticGeometry.bom?.path,a=$("[data-workspace=bom]");if(!e){a&&(a.disabled=!0,a.title="No BoM artifact is available");return}try{let s=await Da.create(Ts,new URL(e,location.href).toString(),{onSelectReference:r=>Dr(r,!0)});if(!me(t))return;ze=s}catch(s){if(!me(t))return;console.warn(s),a&&(a.disabled=!0,a.title=s?.message||"BoM artifact could not be loaded")}}async function db(t){if(g.assetCache)return g.assetCache.fetchJson(String(t));let e=await fetch(t,{cache:"default"});if(!e.ok)throw new Error(`Failed to load ${t}: ${e.status}`);return e.json()}async function ub(t,e=Te){if(!me(e))return;let a=g.scene.residentTiles.get(t.id);if(a){a.lastUsed=performance.now();return}if(g.scene.failed.get(t.id))return;if(g.scene.loading.has(t.id))return g.scene.loading.get(t.id);let r=(async()=>{try{let n=await Ke(new URL(t.path,g.scene.manifestUrl).toString(),{fetchBytes:Rs(),fetchCache:"no-store"});if(!me(e)||!g.renderer)return;g.loadedBytes+=n.byteLength;let i=g.scene.layers.find(b=>Number(b.id)===Number(t.layerId)),o=[],c=0,d=0;for(let b of n.primitives){let w=g.renderer.addPrimitive(b,{kind:"copper",tileId:t.id,layerId:Number(t.layerId),innerCopper:vb(Number(t.layerId)),color:zo(i),stencilMark:Go(i),baseZ:Number(i?.z_mm||0)/1e3,material:{baseColor:[1,1,1,1],metallic:.78,roughness:.32}});o.push(w),c+=b.indices.length/3,d+=fb(b)}let u={tile:t,entries:o,byteLength:n.byteLength,gpuBytes:d,triangles:c,lastUsed:performance.now(),pinned:!1};g.scene.residentTiles.set(t.id,u),g.scene.loaded.add(t.id),g.tileLoads+=1,g.residentTileBytes+=n.byteLength,g.residentTileGpuBytes+=d,g.residentTileTriangles+=c,g.triangles=g.residentTileTriangles,g.scene.failed.delete(t.id)}catch(n){if(!me(e))return;let i=g.scene.failed.get(t.id)||{count:0,message:""};g.scene.failed.set(t.id,{count:i.count+1,message:n?.message||String(n)}),i.count||console.warn(`Failed to load tile ${t.id}; suppressing retries until assets are regenerated`,n)}finally{me(e)&&g.scene.loading.delete(t.id)}})();return g.scene.loading.set(t.id,r),r}function fb(t){return t.position.length/3*Yh+t.indices.length*$h}function hb(t){let e=g.scene.residentTiles.get(t);e&&(g.renderer.removeEntries(e.entries),g.scene.residentTiles.delete(t),g.scene.loaded.delete(t),g.residentTileBytes=Math.max(0,g.residentTileBytes-e.byteLength),g.residentTileGpuBytes=Math.max(0,g.residentTileGpuBytes-e.gpuBytes),g.residentTileTriangles=Math.max(0,g.residentTileTriangles-e.triangles),g.triangles=g.residentTileTriangles,g.tileEvictions+=1)}function pe(t=performance.now(),e={}){if(!g.renderer||!V||x.workspace!=="pcb")return;let a=x.mode==="layer"&&z.phase==="preload";if(!e.force&&!a&&t-g.lastTileScheduleAt<Xh)return;let s=performance.now();g.lastTileScheduleAt=t;let r=bb();g.visibleTileIds=r;let n=g.scene.loading.size,o=Math.max(0,(a?Jh:Wh)-n),c=[...r].map(u=>g.scene.tiles.get(u)).filter(u=>u&&!g.scene.residentTiles.has(u.id)&&!g.scene.loading.has(u.id)&&!g.scene.failed.has(u.id)).sort((u,b)=>lo(u)-lo(b)).slice(0,o),d=Te;for(let u of c)ub(u,d);for(let u of r){let b=g.scene.residentTiles.get(u);b&&(b.lastUsed=t)}Bo(r),g.tileSchedulerMs=performance.now()-s}function bb(){let t=new Set,e=x.mode==="3d"?g.visible3dLayers:pb();if(!e.size||!Se)return t;if(x.mode==="layer"){for(let r of g.scene.tiles.values())e.has(Number(r.layerId))&&t.add(r.id);return t}let a=new Set,s=Je();if(s.size){for(let r of g.scene.tiles.values())if(e.has(Number(r.layerId))){for(let n of s)if(Oo(r,n)){a.add(r.id);break}}}for(let r of g.scene.tiles.values()){if(!e.has(Number(r.layerId)))continue;let n=x.mode==="layer"?Lt.get(Number(r.layerId)):null;mb(r,Se.matrix,n,qh)&&t.add(r.id)}for(let r of a)t.add(r);return t}function pb(){return x.mode!=="layer"||z.phase==="idle"?g.compareLayers:jo(z.previous,z.target)}function No(){return x.mode!=="layer"?g.visible3dLayers:z.phase==="reveal"?jo(z.previous,z.target):g.compareLayers}function Fo(){let t=g.scene.copperLayers.map(e=>Number(e.id)).filter(Number.isFinite);return t.length?t.length===1?new Set([t[0]]):new Set([t[0],t[t.length-1]]):new Set}function gb(){let t=g.desiredCompareLayers.size?g.desiredCompareLayers:g.compareLayers;return t.size?new Set([...t].map(Number)):Fo()}function jo(...t){let e=new Set;for(let a of t)for(let s of a||[])e.add(Number(s));return e}function Bo(t,e=io){if(x.mode==="layer")return;let a=Math.min(io,e);if(g.residentTileGpuBytes<=a)return;let s=[...g.scene.residentTiles.values()].filter(r=>!t.has(r.tile.id)&&!g.scene.loading.has(r.tile.id)).sort((r,n)=>r.lastUsed-n.lastUsed);for(let r of s){if(g.residentTileGpuBytes<=a)break;hb(r.tile.id)}}function mb(t,e,a=null,s=0){let r=Co(t);if(!r)return!0;let n=Math.max(r[3]-r[0],r[4]-r[1])*s,i=[r[0]-n+(a?.[0]||0),r[1]-n+(a?.[1]||0),r[2]-.002,r[3]+n+(a?.[0]||0),r[4]+n+(a?.[1]||0),r[5]+.002],o=g.renderer?.occurrenceMatrices;return!o||o.length===1&&pa(o[0])?co(i,e):o.some(c=>co(i,Pa(e,c)))}function Co(t){let e=t.boundsMm;if(!e||e.length!==4)return null;let a=g.scene.layers.find(r=>Number(r.id)===Number(t.layerId)),s=Number(a?.z_mm||0)/1e3;return[e[0]/1e3,-e[3]/1e3,s-4e-4,e[2]/1e3,-e[1]/1e3,s+4e-4]}function co(t,e){let a=[[t[0],t[1],t[2]],[t[3],t[1],t[2]],[t[0],t[4],t[2]],[t[3],t[4],t[2]],[t[0],t[1],t[5]],[t[3],t[1],t[5]],[t[0],t[4],t[5]],[t[3],t[4],t[5]]].map(r=>yb(e,r));return![r=>r[0]<-r[3],r=>r[0]>r[3],r=>r[1]<-r[3],r=>r[1]>r[3],r=>r[2]<0,r=>r[2]>r[3]].some(r=>a.every(r))}function yb(t,e){let a=e[0],s=e[1],r=e[2];return[t[0]*a+t[4]*s+t[8]*r+t[12],t[1]*a+t[5]*s+t[9]*r+t[13],t[2]*a+t[6]*s+t[10]*r+t[14],t[3]*a+t[7]*s+t[11]*r+t[15]]}function Oo(t,e){return Array.isArray(t.netIds)&&t.netIds.some(a=>Number(a)===Number(e))}function lo(t){let e=Co(t);if(!e||!V)return 0;let a=(e[0]+e[3])*.5-V.focus[0],s=(e[1]+e[4])*.5-V.focus[1];return a*a+s*s}async function xb(t=Te){let e=g.semanticGeometry.assets?.base_board_glb;if(!e)return null;let a=g.semanticGeometry.assets?.soldermask_glb,[s,r]=await Promise.all([Ke(new URL(e,location.href).toString(),{defaultFeatureId:0,fetchBytes:Rs()}),a?Ke(new URL(a,location.href).toString(),{defaultFeatureId:0,fetchBytes:Rs()}).catch(i=>(console.warn("[prism-semantic-viewer] solder mask failed to load",i),null)):null]);if(!me(t)||!g.renderer)return null;g.loadedBytes+=s.byteLength,r&&(g.loadedBytes+=r.byteLength);let n=[...s.primitives.filter(i=>{let o=Ht(i);return o!=="pad"&&!(r&&o==="soldermask")}),...r?.primitives||[]];for(let i of Nt(n,Ht))g.renderer.addPrimitive(i,{kind:"board",boardRole:i.groupKey,layerId:i.groupKey==="paste"?Tb(i):0,material:i.material,color:i.material.baseColor});return Ft(n.map(i=>i.bounds))}function sa(){return g.scene.occurrenceBounds||g.scene.runtimeBounds||Xt(g.scene.manifest?.bbox)}function vb(t){return Ua(t,g.scene.copperLayers)}function wb(t,e){let{back:a}=V.basis();return{eye:Fe(V.focus,ke(a,V.distance)),orthographic:e,pixelScale:e?t/Math.max(1e-9,V.orthoScale):t/2/Math.tan(V.fov/2)}}function Po(){let t=g.renderer?.cullCounts||{full:0,board:0,box:0,culled:0},e=!g.renderer||g.renderer.identityOnly;return{occurrences:g.renderer?.occurrenceMatrices.length||0,lod:e?{full:1,board:0,box:0,culled:0}:{...t},triangles:g.renderer?.frameStats.triangles||0,draws:g.renderer?.frameStats.draws||0,gpuMemoryBytes:g.renderer?.gpuMemoryBytes()||0,gpuBudgetBytes:x.gpuBudgetBytes,componentTier:g.scene.componentTier,componentEvictions:g.scene.componentEvictions,tileEvictions:g.tileEvictions,cache:g.assetCache?g.assetCache.summary():{enabled:!1},frameIntervalMs:x.frameIntervalMs,frameIntervalP95Ms:x.frameIntervalP95Ms,frameCpuMs:x.frameCpuMs,frameCpuP95Ms:x.frameCpuP95Ms,fps:x.fps}}function Do(t){x.showStats=!!t,Ea&&(Ea.hidden=!x.showStats),Uo()}function Uo(){if(!Ea||!x.showStats)return;let t=Po(),{full:e,board:a,box:s,culled:r}=t.lod,n=[["Occurrences",`${t.occurrences} (${e+a+s} visible)`],["Detail",`${e} full \xB7 ${a} board \xB7 ${s} box \xB7 ${r} culled`],["Triangles",t.triangles.toLocaleString()],["Draws",t.draws.toLocaleString()],["GPU memory",`${(t.gpuMemoryBytes/1048576).toFixed(1)} / ${(t.gpuBudgetBytes/1048576).toFixed(0)} MB`],["Components",`${t.componentTier}${t.componentEvictions?` \xB7 ${t.componentEvictions} evicted`:""}`],["Cache",t.cache.enabled?`${t.cache.hits} hits \xB7 ${t.cache.misses} misses \xB7 ${(t.cache.bytes/1048576).toFixed(0)} MB`:"off"],["Frame",`${t.frameIntervalMs.toFixed(1)} ms \xB7 p95 ${t.frameIntervalP95Ms.toFixed(1)}`],["CPU",`${t.frameCpuMs.toFixed(2)} ms \xB7 p95 ${t.frameCpuP95Ms.toFixed(2)}`],["FPS",t.fps.toFixed(0)]];Ea.innerHTML=n.map(([i,o])=>`<dt>${i}</dt><dd>${o}</dd>`).join("")}function Eb(t){if(!e.renderer)return;e.renderer.setOccurrences(t),t==null&&(e.deferComponents=!1),x.selectedOccurrence>=e.renderer.occurrenceMatrices.length&&(x.selectedOccurrence=0);let e=e.scene.runtimeBounds||Xt(e.scene.manifest?.bbox);e.renderer.setBoardBounds(e),e.scene.occurrenceBounds=t==null?null:fi(e.renderer.occurrenceMatrices,e);let a=sa();V&&a&&(V.sceneRadius=_t(a),V.frame(a),!x.occurrencesFramed&&t!=null&&(V.snap(),x.occurrencesFramed=!0)),pe(performance.now(),{force:!0})}function Tb(t){return La(t,g.scene.copperLayers)}async function Lo(t=Te){let e=g.semanticGeometry.assets?.components_glb;if(!e||g.scene.componentTier!=="idle")return;g.scene.componentTier="loading";let a;try{a=await Ke(new URL(e,location.href).toString(),{componentFeatures:g.scene.componentFeatures,fetchBytes:Rs()})}catch(s){throw me(t)&&(g.scene.componentTier="idle"),s}if(!(!me(t)||!g.renderer)){g.scene.componentTier="loaded",g.loadedBytes+=a.byteLength;for(let s of a.primitives){let r=g.scene.componentFeatures.get(s.designator);r&&Rb(r.featureId,s.position)}for(let[s,r]of a.componentNodeCounts||[])g.scene.componentModelCounts.set(s,r);g.hiddenComponentRequest&&rc(g.hiddenComponentRequest),g.scene.componentEntries=Nt(a.primitives).map(s=>g.renderer.addPrimitive(s,{kind:"component",layerId:0,material:s.material,color:s.material.baseColor}))}}function Rs(){return g.assetCache?t=>g.assetCache.fetchBytes(t):void 0}function kb(t){if(!g.renderer||t-(x.tiersCheckedAt||0)<250)return;x.tiersCheckedAt=t;let e=g.renderer.identityOnly&&!g.deferComponents||!g.renderer.identityOnly&&g.renderer.cullCounts.full>0;e&&(g.scene.componentsWantedAt=t),e&&g.scene.componentTier==="idle"&&g.semanticGeometry.assets?.components_glb&&Lo(Te).catch(a=>console.warn("Failed to load components",a)),g.gpuBytes=g.renderer.gpuMemoryBytes(),!(g.gpuBytes<=x.gpuBudgetBytes)&&(g.scene.componentTier==="loaded"&&t-g.scene.componentsWantedAt>eb&&(g.renderer.removeEntries(g.scene.componentEntries),g.scene.componentEntries=[],g.scene.componentTier="idle",g.scene.componentEvictions+=1,g.gpuBytes=g.renderer.gpuMemoryBytes()),g.gpuBytes>x.gpuBudgetBytes&&Bo(g.visibleTileIds||new Set,Math.max(0,g.residentTileGpuBytes-(g.gpuBytes-x.gpuBudgetBytes))))}var uo=4e-4,fo=5e-5,Mb={baseColor:[.62,.7,.8,1],metallic:0,roughness:.8,emissive:[0,0,0]};function ho(t){if(!g.renderer)return;let e=new Map;for(let n of g.topology.physical_objects||[])n.kind==="footprint_body"&&n.designator&&n.bbox_mm?.length===4&&e.set(n.designator,n);let a=(t?.[5]??8e-4)+fo,s=(t?.[2]??-8e-4)-fo,r=[];for(let n of g.scene.componentFeatures.values()){let i=Number(n.featureId),o=g.scene.features.get(i),c=e.get(n.designator);if(!o||o.bounds||!c)continue;let[d,u,b,w]=c.bbox_mm.map(Number),v=String(c.layer||"").startsWith("B."),h=[d/1e3,-w/1e3,v?s-uo:a,b/1e3,-u/1e3,v?s:a+uo];o.bounds=h,o.placeholder=!0,r.push(Ib(h,i))}if(r.length)for(let n of Nt(r))g.renderer.addPrimitive(n,{kind:"component",layerId:0,material:n.material,color:n.material.baseColor,opacityScale:.3,translucent:!0,placeholder:!0})}function Ib([t,e,a,s,r,n],i){let o=[[[0,0,1],[[t,e,n],[s,e,n],[s,r,n],[t,r,n]]],[[0,0,-1],[[t,r,a],[s,r,a],[s,e,a],[t,e,a]]],[[1,0,0],[[s,e,a],[s,r,a],[s,r,n],[s,e,n]]],[[-1,0,0],[[t,r,a],[t,e,a],[t,e,n],[t,r,n]]],[[0,1,0],[[s,r,a],[t,r,a],[t,r,n],[s,r,n]]],[[0,-1,0],[[t,e,a],[s,e,a],[s,e,n],[t,e,n]]]],c=new Float32Array(72),d=new Float32Array(72),u=new Uint32Array(36);return o.forEach(([b,w],v)=>{w.forEach((l,m)=>{c.set(l,(v*4+m)*3),d.set(b,(v*4+m)*3)});let h=v*4;u.set([h,h+1,h+2,h,h+2,h+3],v*6)}),{position:c,normal:d,netId:new Uint32Array(24),objectFeatureId:new Uint32Array(24).fill(i),indices:u,material:Mb,bounds:[t,e,a,s,r,n]}}function Rb(t,e){let a=g.scene.features.get(Number(t));if(!a||!e.length)return;let s=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let r=0;r<e.length;r+=3)s[0]=Math.min(s[0],e[r]),s[1]=Math.min(s[1],e[r+1]),s[2]=Math.min(s[2],e[r+2]),s[3]=Math.max(s[3],e[r]),s[4]=Math.max(s[4],e[r+1]),s[5]=Math.max(s[5],e[r+2]);a.bounds=a.bounds?[Math.min(a.bounds[0],s[0]),Math.min(a.bounds[1],s[1]),Math.min(a.bounds[2],s[2]),Math.max(a.bounds[3],s[3]),Math.max(a.bounds[4],s[4]),Math.max(a.bounds[5],s[5])]:s}function Br(t){return en(t,g.scene.copperLayers)}var Sb=[.55,.35,.16,.78];function Ko(){return ca(g.topology?.board?.stackup?.copper_finish)}function Go(t){return la(t,g.scene.copperLayers)}var Ab=.25;function Ss(){return!x.realisticColors||x.mode==="layer"?0:1-ne(x.separation/Ab,0,1)}function zo(t){let e=Go(t)?Ko():rt.copper;return Vo(Br(t),e,Ss())}function Vo(t,e,a){return t.map((s,r)=>s+(e[r]-s)*a)}function _b(t,e=Te){if(e!==Te||!g.renderer||!V)return;let a=performance.now(),s=Math.max(0,t-va);if(x.workspace==="schematic"&&_){va=t;let d=_.visiblePages(),u=J?Cb(d):[];_.setDomDetailPageIds(u.map(b=>b.id)),O.visiblePages=_.render(),J?.syncWorldPages(u,_,{activeNetUid:O.activeNetUid}),dc(),go(s,performance.now()-a),yo(t),Ir(e);return}let r=Math.min(.05,(t-va)/1e3);va=t,V.update(r),g.renderer.resize();let n=Ho();g.scene.copperRealism!==Ss()&&Or();for(let d of g.renderer.entries)d.layerOffset=n[d.layerId]||0;Ob(t),Lt=qo(t);let i=Db(t);Se={layerId:0,viewport:{x:0,y:0,width:q.width,height:q.height},matrix:V.matrix(q.width,q.height,x.mode==="layer"),lod:wb(q.height,x.mode==="layer")},g.renderer.selectedOccurrence=x.selectedFeatureId||x.activeNetId?x.selectedOccurrence:-1,g.renderer.setInnerCopperAtFull(x.showBoard&&x.separation<=.001&&!Je().size),pe(t);let o=x.mode==="3d"?g.visible3dLayers:No(),c={panels:[Se],activeNetId:x.activeNetId,selectedFeatureId:x.selectedFeatureId,time:t/1e3,layerOffsets:n,visibleLayers:o,showBoard:x.showBoard,showComponents:x.showComponents,showPaste:x.separation===0,componentOpacity:ne(1-x.separation/.1,0,1),boardOpacity:Je().size?.34:1-x.separation*.72,isolateNet:x.isolateNet,compareMode:x.mode==="layer",compareOffsets:Lt,layerAlphas:i,visibleTileIds:x.mode==="3d"?g.visibleTileIds:null};Fb(t,c)&&(g.renderer.render(c),dp(),fp()),kb(t),go(s,performance.now()-a),yo(t),Ir(e)}var Nb=1e3,We={key:"",matrix:new Float32Array(16),tiles:null,at:0};function Fb(t,e){let a=e.panels[0].matrix,s=!1;for(let o=0;o<16;o+=1)if(a[o]!==We.matrix[o]){s=!0;break}if(s)return We.matrix.set(a),We.key="",We.at=t,!0;let r=[q.width,q.height,g.renderer.version,g.renderer.selectedOccurrence,x.workspace,x.mode,e.activeNetId,e.selectedFeatureId,e.showBoard,e.showComponents,e.showPaste,e.componentOpacity,e.boardOpacity,e.isolateNet,g.scene.layerZOffsetSignature,[...e.visibleLayers].join(","),[...e.compareOffsets].map(([o,c])=>`${o}:${c}`).join(";"),e.layerAlphas?[...e.layerAlphas].join(";"):""].join("|");return!!(e.activeNetId||e.selectedFeatureId||g.renderer.emphasizedNetIds.size)||r!==We.key||!jb(e.visibleTileIds,We.tiles)||t-We.at>Nb?(We.key=r,We.tiles=e.visibleTileIds,We.at=t,!0):!1}function jb(t,e){if(!t||!e)return t===e;if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function Bb(t){if(!_||!t)return{widthPx:0,heightPx:0,sourcePxPerMm:0,area:0};let e=_.pagePixelWidth(t),a=t.heightMm/Math.max(1e-6,_.scale),s=_.pageSourcePixelsPerMm(t);return{widthPx:e,heightPx:a,sourcePxPerMm:s,area:e*a}}function Cb(t){if(!J||!_)return[];let e=t||[],a=Math.max(1,Ee.clientWidth*Ee.clientHeight);return e.map(n=>({page:n,...Bb(n)})).filter(n=>n.widthPx>=760&&n.heightPx>=520&&n.area>=a*.36&&n.sourcePxPerMm>=1.25).sort((n,i)=>i.area-n.area).slice(0,1).map(n=>n.page)}function Ho(){let t=sa(),e=Math.hypot((t[3]-t[0])*1e3,(t[4]-t[1])*1e3),a=x.separation*x.separation*ne(e*.12,8,25)/1e3,s=`${x.separation}:${a}:${g.scene.copperLayers.length}`;if(g.scene.layerZOffsetSignature===s)return g.scene.layerZOffsets;let r=g.scene.layerZOffsets;r.fill(0);let n=(g.scene.copperLayers.length-1)/2;return g.scene.copperLayers.forEach((i,o)=>{r[Number(i.id)]=(n-o)*a}),g.scene.layerZOffsetSignature=s,r}function qo(t){if(x.mode!=="layer")return be.key="3d",be.current.clear(),new Map;let e=g.scene.copperLayers.filter(m=>g.compareLayers.has(Number(m.id))),a=Math.max(1,e.length),s=q.width/Math.max(1,q.height),r=1;a===2?r=s>=1?2:1:a===3||a===4?r=2:a>4&&(r=Math.ceil(Math.sqrt(a*s)));let n=Math.ceil(a/r),i=sa(),o=i[3]-i[0],c=i[4]-i[1],d=o*1.18,u=c*1.22,b=e.map((m,f)=>{let p=f%r,y=Math.floor(f/r);return{layer:m,layerId:Number(m.id),column:p,row:y,offset:[(p-(r-1)/2)*d,((n-1)/2-y)*u,0]}}),w=`${r}x${n}:${b.map(m=>m.layerId).join(",")}`;if(w!==be.key){be.key=w,be.started=t,be.from=new Map(be.current);let m=r*o+(r-1)*(d-o),f=n*c+(n-1)*(u-c);V.targetFocus=[(i[0]+i[3])/2,(i[1]+i[4])/2,(i[2]+i[5])/2],V.targetOrthoScale=Math.max(f,m/s)*1.08}let v=ne((t-be.started)/420,0,1),h=1-Math.pow(1-v,3),l=new Map;for(let m of b){let f=be.from.get(m.layerId)||[0,0,0],p=m.offset.map((y,E)=>f[E]+(y-f[E])*h);l.set(m.layerId,p),be.current.set(m.layerId,p)}if(z.phase==="reveal")for(let m of z.previous)l.has(Number(m))||l.set(Number(m),z.previousOffsets.get(Number(m))||[0,0,0]);for(let m of[...be.current.keys()])b.some(f=>f.layerId===m)||be.current.delete(m);return l}function Ma(t){let e=new Set([...t].map(Number));if(!(bo(e,g.desiredCompareLayers)&&z.phase!=="idle")){if(g.desiredCompareLayers=e,bo(e,g.compareLayers)){z.phase="idle",z.previous.clear(),z.target.clear();return}z.phase="preload",z.previous=new Set(g.compareLayers),z.target=new Set(e),z.previousOffsets=new Map(be.current),z.started=performance.now(),pe(z.started,{force:!0})}}function Cr({snap:t=!0}={}){x.mode="layer";let e=gb();g.desiredCompareLayers=new Set(e),!g.compareLayers.size&&e.size&&(g.compareLayers=new Set(e)),z.phase="idle",z.previous.clear(),z.target.clear(),be.key="",V.setAxis("z",!1),g.renderer?.resize(),Lt=qo(performance.now()),t&&V.snap(),pe(performance.now(),{force:!0})}function Ob(t){if(!(x.mode!=="layer"||z.phase==="idle")){if(z.phase==="preload"){if(!Pb(z.target)){pe(t,{force:!0});return}z.phase="reveal",z.started=t,z.previousOffsets=new Map(be.current),g.compareLayers=new Set(z.target),be.key="";return}z.phase==="reveal"&&t-z.started>=xo&&(g.compareLayers=new Set(z.target),z.phase="idle",z.previous.clear(),z.target.clear(),z.previousOffsets.clear(),pe(t,{force:!0}))}}function Pb(t){for(let e of g.scene.tiles.values())if(t.has(Number(e.layerId))&&!g.scene.residentTiles.has(e.id)&&!g.scene.failed.has(e.id))return!1;return!0}function Db(t){if(x.mode!=="layer"||z.phase!=="reveal")return null;let e=ne((t-z.started)/xo,0,1),a=e*e*(3-2*e),s=new Map;for(let r of z.previous)s.set(Number(r),z.target.has(Number(r))?1:1-a);for(let r of z.target)s.set(Number(r),z.previous.has(Number(r))?1:a);return s}function bo(t,e){if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function Xo(){if(x.workspace==="schematic"){Lb();return}if(x.workspace==="bom"){Ub();return}if(x.workspace==="stackup")return;Fs.textContent=g.viewerReadiness.stage==="semantic-ready"?"Semantic GLTF A0":"Prism staged 3D",js.textContent="Layers",Bs.textContent="Visibility and compare",$('[data-panel="search"] .section-heading span').textContent="Nets, components and pins",$('[data-panel="view"] .section-heading span').textContent="Camera and stackup";let t=`
    <div class="mode-toolbar">
      <button data-mode="layer">PCB</button>
      <button data-mode="3d">3D</button>
    </div>`;ea&&(ea.innerHTML=t),Ge.innerHTML=`
    ${ea?"":t}
    <div class="layer-presets">
      <button data-preset="all">All</button><button data-preset="none">None</button>
      <button data-preset="outer">Outer</button><button data-preset="inner">Inner</button>
    </div>
    <div class="layer-list"></div>`,fe.innerHTML=`
    <label class="control-field"><span>Search</span>
      <input id="entity-search" class="layer-select" type="search" placeholder="Net, component or pin">
      <div id="search-results" class="search-results"></div>
    </label>
    <div class="quick-actions">
      <button id="frame-selection">Frame</button>
      <button id="show-net-layers">Net layers</button>
      <button id="isolate-net" aria-keyshortcuts="I" title="Toggle isolated net view (I)">Isolate</button>
      <button id="clear-selection">Clear</button>
    </div>`,Re.innerHTML=`
    <div class="toggle-list">
      <label class="toggle-row"><input id="show-board" type="checkbox"><span>Board substrate</span></label>
      <label class="toggle-row"><input id="show-components" type="checkbox"><span>Components</span></label>
    </div>
    <label class="control-field range-field"><span>Stackup separation</span>
      <input id="separation" type="range" min="0" max="1" step="0.002">
    </label>`,Ce(),Jb()}function Ub(){Fs.textContent="BoM A0",js.textContent="Bill of Materials",Bs.textContent="Grouped procurement view",$('[data-panel="search"] .section-heading span').textContent="Search inside the BoM table",$('[data-panel="view"] .section-heading span').textContent="BoM actions";let t=ze?.payload?.counts||{};Ge.innerHTML=`
    <div class="selection-properties">
      <div class="selection-property"><small>Rows</small><strong>${t.rows||0}</strong></div>
      <div class="selection-property"><small>Components</small><strong>${t.components||0}</strong></div>
      <div class="selection-property"><small>DNP</small><strong>${t.dnpComponents||0}</strong></div>
    </div>
    <div class="selection-section">
      <span class="selection-section-title">Columns</span>
      <div class="selection-empty">Primary procurement and thermal columns are shown first. Additional symbol and footprint metadata is available in the row detail panel.</div>
    </div>`,fe.innerHTML=`
    <div class="selection-empty">Use the BoM search box in the main view. Reference chips update the shared PCB and schematic selection without changing workspaces.</div>
    <div class="quick-actions">
      <button id="clear-selection">Clear</button>
    </div>`,Re.innerHTML=`
    <div class="selection-section">
      <span class="selection-section-title">Cross-probing</span>
      <div class="selection-table">
        <div class="selection-row"><span><strong>PCB/Schematic</strong></span><span>Select component</span><span>Highlights matching BoM row</span></div>
        <div class="selection-row"><span><strong>BoM reference</strong></span><span>Click chip</span><span>Holds component selection for PCB and schematic</span></div>
      </div>
    </div>`,fe.querySelector("#clear-selection")?.addEventListener("click",Rt)}function Lb(){Fs.textContent=J?"Schematic SVG DOM":O.manifest?.schema==="prism.schematic_vector_a0"?"Schematic Vector A0":"Schematic World A0",js.textContent="Pages",Bs.textContent=`${O.pages.length} hierarchy instances`,$('[data-panel="search"] .section-heading span').textContent="Pages, nets and components",$('[data-panel="view"] .section-heading span').textContent="World navigation",Ge.innerHTML=`
    <div class="layer-presets">
      <button data-page-action="world">Fit world</button>
      <button data-page-action="parent">Parent</button>
      <button data-page-action="previous">Previous</button>
      <button data-page-action="next">Next</button>
    </div>
    <div class="page-list">${O.pages.map(t=>`
      <button class="page-row ${t.id===x.selectedPageId?"active":""}" data-page="${t.id}">
        <span>${t.sheetNumber}</span>
        <strong>${U(t.name)}</strong>
        <small>L${t.depth}</small>
      </button>`).join("")}</div>`,fe.innerHTML=`
    <label class="control-field"><span>Search</span>
      <input id="entity-search" class="layer-select" type="search" placeholder="Page, net or component">
      <div id="search-results" class="search-results"></div>
    </label>
    <div class="quick-actions">
      <button id="frame-selection">Frame</button>
      <button id="clear-selection">Clear</button>
    </div>`,Re.innerHTML=`
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
    </div>`,Ge.querySelectorAll("[data-page]").forEach(t=>{t.addEventListener("click",()=>tt(t.dataset.page,!0))}),Ge.querySelectorAll("[data-page-action]").forEach(t=>{t.addEventListener("click",()=>xs(t.dataset.pageAction))}),fe.querySelector("#entity-search").addEventListener("input",t=>{Gb(t.target.value)}),fe.querySelector("#frame-selection").addEventListener("click",Yo),fe.querySelector("#clear-selection").addEventListener("click",Ia),Re.querySelector("#show-hierarchy").checked=_?.showHierarchy??!0,Re.querySelector("#show-hierarchy").addEventListener("change",t=>{_.showHierarchy=t.target.checked})}function tt(t,e){let a=O.byId.get(t);!a||!_||(x.selectedPageId=a.id,x.selectedSchematicFeature=null,_.selectedPageId=a.id,_.selectedFeatureId=0,Ye.textContent=JSON.stringify(a,null,2),e&&_.framePage(a),Ge.querySelectorAll("[data-page]").forEach(s=>{s.classList.toggle("active",s.dataset.page===a.id)}))}function xs(t){if(!_)return;if(t==="world"){_.frameWorld();return}let e=Math.max(0,O.pages.findIndex(s=>s.id===x.selectedPageId)),a=null;t==="previous"?a=O.pages[(e-1+O.pages.length)%O.pages.length]:t==="next"?a=O.pages[(e+1)%O.pages.length]:t==="parent"&&(a=O.byId.get(O.pages[e]?.parentId)),a&&tt(a.id,!0)}function Kb(t){if(!t||!_)return;if(Ia(),t.kind==="page"&&t.pageId){tt(t.pageId,!0);return}if(t.kind!=="sheet")return;let e=O.pages.find(n=>n.sheetInstancePath===t.sheetInstancePath)||O.byId.get(x.selectedPageId),a=String(t.sheetFile||t.feature?.sheet_file||"").replace(/\\/g,"/"),s=String(t.sheetName||t.feature?.sheet_name||t.feature?.objectId||""),r=O.pages.find(n=>{if(e&&n.parentId&&n.parentId!==e.id)return!1;let i=String(n.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&n.name===s})||O.pages.find(n=>{let i=String(n.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&n.name===s});r&&tt(r.id,!0)}function Gb(t){let e=fe.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=O.pages.filter(n=>`${n.name} ${n.sheetPath}`.toLowerCase().includes(a)).slice(0,8),r=g.scene.nets.filter(n=>String(n.name).toLowerCase().includes(a)).slice(0,8);e.innerHTML=[...s.map(n=>`<button data-page="${n.id}"><b>${U(n.name)}</b><span>Page ${n.sheetNumber}</span></button>`),...r.map(n=>`<button data-schematic-net="${n.id}"><b>${U(n.name)}</b><span>${(O.manifest.netToPages?.[n.uid]||[]).length} pages</span></button>`)].join(""),e.querySelectorAll("[data-page]").forEach(n=>{n.addEventListener("click",()=>tt(n.dataset.page,!0))}),e.querySelectorAll("[data-schematic-net]").forEach(n=>{n.addEventListener("click",()=>Wo(Number(n.dataset.schematicNet),!0))})}function Wo(t,e){let a=g.scene.nets.find(r=>Number(r.id)===t);if(!a||!_)return;x.activeNetId=t,x.selectedFeatureId=0,x.selectedSchematicFeature=null,_.selectedFeatureId=0,_.selectedFeatureKey="",_.selectedSourceId="",O.activeNetUid=a.uid,_.activeNetUid=a.uid,J?.setHighlightedNet(a.uid),Ye.textContent=JSON.stringify(a,null,2),Oe();let s=O.manifest.netToPages?.[a.uid]||[];e&&s.length&&tt(s[0],!0)}function Jo(t,e=null){let a=g.scene.nets.find(s=>s.uid===t);a&&(x.activeNetId=Number(a.id),O.activeNetUid=a.uid,_&&(_.activeNetUid=a.uid,_.selectedFeatureId=Number(e?.feature?.id||e?.featureId||0),_.selectedFeatureKey=e?.feature?.stableKey||e?.featureKey||"",_.selectedSourceId=e?.feature?.sourceId||e?.sourceId||""),J?.setHighlightedNet(a.uid),e&&(x.selectedSchematicFeature={...e,pageId:x.selectedPageId}),Ye.textContent=JSON.stringify(e?{...e,net:a}:a,null,2),Oe())}function Ia(){x.activeNetId=0,x.selectedFeatureId=0,x.selectedSchematicFeature=null,O.activeNetUid="",_&&(_.activeNetUid="",_.selectedFeatureId=0,_.selectedFeatureKey="",_.selectedSourceId=""),J?.setSelection(null),J?.setHighlightedNet(""),Ye.textContent="No object selected",Oe()}function Yo(){let t=O.byId.get(x.selectedPageId);t?_.framePage(t):_.frameWorld()}function zb(t){x.selectedPageId=t.sheetInstancePath&&O.pages.find(s=>s.sheetInstancePath===t.sheetInstancePath)?.id||x.selectedPageId,x.selectedFeatureId=0,x.selectedSchematicFeature={...t,pageId:x.selectedPageId},t.anchor&&(x.selectionAnchor=t.anchor),_&&(_.selectedPageId=x.selectedPageId,_.selectedFeatureId=Number(t.feature?.id||0));let e=t.netUid?g.scene.nets.find(s=>s.uid===t.netUid):null,a=t.reference?g.scene.componentFeatures.get(t.reference):null;a&&(x.selectedFeatureId=Number(a.featureId||0),ze?.setSelectionByReference(t.reference,{scroll:x.workspace==="bom"})),Ye.textContent=JSON.stringify({...t,net:e,component:a},null,2),Oe()}function Vb(t){let{page:e,feature:a}=t;if(!a){x.selectedSchematicFeature=null,_.selectedFeatureId=0,tt(e.id,!1),Oe();return}let s=Number(a.id||0);if(x.selectedPageId=e.id,_.selectedPageId=e.id,_.selectedFeatureId=s,x.selectedSchematicFeature={...a,pageId:e.id},x.selectionAnchor=null,a.netUid){let r=g.scene.nets.find(n=>n.uid===a.netUid);if(r){Wo(Number(r.id),!1),x.selectedSchematicFeature={...a,pageId:e.id},_.selectedFeatureId=s;return}}if(a.reference){let r=g.scene.componentFeatures.get(a.reference);if(r){na(Number(r.featureId),!1),x.selectedSchematicFeature={...a,pageId:e.id},_.selectedFeatureId=s;return}}x.activeNetId=0,x.selectedFeatureId=0,_.activeNetUid="",Ye.textContent=JSON.stringify({page:e.name,...a},null,2),Oe()}function Kt(){let t=x.isolateNet,e=fe?.querySelector?.("#isolate-net");e?.classList.toggle("active",t),e?.setAttribute("aria-pressed",String(t));let a=Q?.querySelector?.("[data-action=isolate]");a?.classList.toggle("active",t),a?.setAttribute("aria-pressed",String(t));let s=Re?.querySelector?.("#show-board");s&&(s.checked=x.showBoard);let r=Re?.querySelector?.("#show-components");r&&(r.checked=x.showComponents),ka()}function Hb(){let t=new Set;for(let e of Je())for(let a of qb(e))t.add(a);return t}function qb(t){let e=new Set,a=g.scene.nets.find(r=>Number(r.id)===Number(t)),s=new Set(g.scene.copperLayers.map(r=>Number(r.id)));for(let r of Object.keys(a?.layerBoundsMm||{})){let n=Number(r);s.has(n)&&e.add(n)}if(!e.size){let r=new Map(g.scene.copperLayers.map(n=>[n.name,Number(n.id)]));for(let n of a?.metrics?.layers||[]){let i=r.get(n);i!=null&&e.add(i)}}if(e.size)return e;for(let r of g.scene.tiles.values())Oo(r,t)&&e.add(Number(r.layerId));return e}function Ra(){let t=Hb();t.size&&(g.visible3dLayers=new Set(t),x.mode==="layer"?Ma(t):(g.compareLayers=new Set(t),g.desiredCompareLayers=new Set(t)),pe(performance.now(),{force:!0}))}function ra(t){let e=!!(t&&Je().size),a=x.isolateNet;if(e&&!x.isolateNet&&(g.preIsolation3dLayers=new Set(g.visible3dLayers),g.preIsolationCompareLayers=new Set(g.desiredCompareLayers.size?g.desiredCompareLayers:g.compareLayers)),x.isolateNet=e,x.isolateNet)Ra();else if(g.preIsolation3dLayers||g.preIsolationCompareLayers){if(g.preIsolation3dLayers&&(g.visible3dLayers=new Set(g.preIsolation3dLayers)),g.preIsolationCompareLayers){let s=new Set(g.preIsolationCompareLayers);x.mode==="layer"?Ma(s):(g.compareLayers=s,g.desiredCompareLayers=new Set(s))}g.preIsolation3dLayers=null,g.preIsolationCompareLayers=null,pe(performance.now(),{force:!0})}e&&!a?(x.preIsolationShowBoard=x.showBoard,x.showBoard=!1):!e&&a&&(typeof x.preIsolationShowBoard=="boolean"&&(x.showBoard=x.preIsolationShowBoard),x.preIsolationShowBoard=null),Kt(),Ce()}function Ce(){(ea||Ge).querySelectorAll("[data-mode]").forEach(a=>{let s=a.dataset.mode===x.mode;a.classList.toggle("active",s),a.setAttribute("aria-pressed",String(s))}),Re.querySelector("#show-board").checked=x.showBoard,Re.querySelector("#show-components").checked=x.showComponents,Re.querySelector("#separation").value=x.separation;let t=Ge.querySelector(".layer-list"),e=x.mode==="3d"?g.visible3dLayers:g.desiredCompareLayers;t.innerHTML=g.scene.copperLayers.map((a,s)=>`
    <label class="layer-row">
      <input type="checkbox" data-layer="${a.id}" ${e.has(Number(a.id))?"checked":""}>
      <span class="swatch" style="background:${uc(Br(a))}"></span>
      <span>${U(a.name)}</span><small>${s+1}</small>
    </label>`).join(""),t.querySelectorAll("[data-layer]").forEach(a=>a.addEventListener("change",()=>{Qo(Number(a.dataset.layer),a.checked)})),Kt()}function $o(t){t==="layer"?Cr():(x.mode="3d",V.frame(sa()),V.snap(),g.visibleTileIds=new Set,pe(performance.now(),{force:!0})),Ce()}function Qo(t,e){if(x.mode==="3d")e?g.visible3dLayers.add(t):g.visible3dLayers.delete(t),pe(performance.now(),{force:!0});else{let a=new Set(g.desiredCompareLayers);e?a.add(t):a.delete(t),Ma(a)}Ce()}function Zo(t){let e=x.mode==="3d"?g.visible3dLayers:new Set;e.clear();for(let[a,s]of g.scene.copperLayers.entries())(t==="all"||t==="outer"&&(a===0||a===g.scene.copperLayers.length-1)||t==="inner"&&a>0&&a<g.scene.copperLayers.length-1)&&e.add(Number(s.id));x.mode==="3d"?pe(performance.now(),{force:!0}):Ma(e),Ce()}function ec(t){x.showBoard=!!t,x.savedShowBoard=x.showBoard,x.showBoard&&x.isolateNet?ra(!1):Kt()}function tc(t){x.showComponents=!!t,x.savedShowComponents=x.showComponents,Kt()}function Xb(t){x.showPlaceholders=!!t,g.renderer?.setPlaceholdersVisible(x.showPlaceholders),ka()}function Wb(t){x.realisticColors=!!t,Or(),ka()}function Or(){if(!g.renderer)return;let t=new Map(g.scene.layers.map(e=>[Number(e.id),e]));for(let e of g.renderer.entries)e.kind==="copper"&&(e.color=zo(t.get(Number(e.layerId))));g.renderer.setBarrelColor(Vo(Sb,[...Ko().slice(0,3),.78],Ss())),g.scene.copperRealism=Ss()}function ac(t){x.separation=ne(Number(t)||0,0,1),ka()}function Jb(){(ea||Ge).querySelectorAll("[data-mode]").forEach(e=>e.addEventListener("click",()=>{$o(e.dataset.mode)})),Ge.querySelectorAll("[data-preset]").forEach(e=>e.addEventListener("click",()=>{Zo(e.dataset.preset)})),Re.querySelector("#show-board").addEventListener("change",e=>{ec(e.target.checked)}),Re.querySelector("#show-components").addEventListener("change",e=>{tc(e.target.checked)}),Re.querySelector("#separation").addEventListener("input",e=>{ac(e.target.value)}),fe.querySelector("#clear-selection").addEventListener("click",Rt),fe.querySelector("#isolate-net").addEventListener("click",()=>{ra(!x.isolateNet)}),fe.querySelector("#frame-selection").addEventListener("click",Lr),fe.querySelector("#show-net-layers").addEventListener("click",Pr);let t=fe.querySelector("#entity-search");t.addEventListener("input",()=>sc(t.value))}function Yb(){Ut(".rail-tab").forEach(t=>t.addEventListener("click",()=>{let e=t.dataset.tab,a=x.activeTab===e&&!It.classList.contains("panel-collapsed");x.activeTab=e,It.classList.toggle("panel-collapsed",a),Ut(".rail-tab").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.tab===e)}),Ut(".tab-panel").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.panel===e)})}))}function Pr(){let t=g.scene.nets.find(s=>Number(s.id)===x.activeNetId);if(!t)return;let e=new Set(t.metrics?.layers||[]),a=x.mode==="3d"?g.visible3dLayers:new Set;a.clear();for(let s of g.scene.copperLayers)e.has(s.name)&&a.add(Number(s.id));x.mode==="3d"?pe(performance.now(),{force:!0}):Ma(a),Ce()}function sc(t){let e=fe.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=g.scene.nets.filter(n=>String(n.name).toLowerCase().includes(a)).slice(0,8),r=[...g.scene.componentFeatures.values()].filter(n=>!g.hiddenComponents.has(String(n.designator||""))&&`${n.designator} ${n.value} ${n.footprint}`.toLowerCase().includes(a)).slice(0,6);e.innerHTML=[...s.map(n=>`<button data-net="${n.id}"><b>${U(n.name)}</b><span>${U(n.netClass||"")}</span></button>`),...r.map(n=>`<button data-feature="${n.featureId}"><b>${U(n.designator)}</b><span>${U(n.value)}</span></button>`)].join(""),e.querySelectorAll("[data-net]").forEach(n=>{n.addEventListener("click",()=>As(Number(n.dataset.net),!0))}),e.querySelectorAll("[data-feature]").forEach(n=>{n.addEventListener("click",()=>na(Number(n.dataset.feature),!0))})}function As(t,e){e&&(x.selectionAnchor=null),x.activeNetId=t,x.selectedFeatureId=0;let a=g.scene.nets.find(s=>Number(s.id)===t);x.workspace==="schematic"&&a&&_&&(O.activeNetUid=a.uid,_.activeNetUid=a.uid),jr(),Ye.textContent=JSON.stringify(a||{},null,2),Oe(),x.isolateNet&&Ra(),e&&a?.boundsMm&&V.frame(Fr(qt(a.boundsMm))),pe(performance.now(),{force:!0}),Cs(Ro(a))}function na(t,e=!1){let a=g.scene.features.get(t);if(a?.kind==="component"&&Ka(aa(a),g.hiddenComponents))return;e&&(x.selectionAnchor=null),x.selectedFeatureId=t,x.activeNetId=Number(a?.netId||0);let s=aa(a);s&&ze?.setSelectionByReference(s,{scroll:x.workspace==="bom"});let r=So(a);r?.kind==="net"?jr():Ao(),Ye.textContent=a?JSON.stringify(a,null,2):"No object selected",Oe(),x.isolateNet&&x.activeNetId&&Ra(),e&&a?.bounds&&Ur(a),pe(performance.now(),{force:!0}),Cs(r)}function Dr(t,e=!1){if(Ka(t,g.hiddenComponents))return;let a=g.scene.componentFeatures.get(t);if(ze?.setSelectionByReference(t,{scroll:x.workspace==="bom"}),!a?.featureId)return;Ao(),na(Number(a.featureId),!1);let s=Qb(t);if(s){let{page:r,feature:n}=s;x.selectedPageId=r.id,x.selectedSchematicFeature={...n,pageId:r.id},_&&(_.selectedPageId=r.id,_.selectedFeatureId=Number(n.id||0)),J?.setSelection?.({kind:"component",featureKey:n.stableKey||"",sheetInstancePath:n.sheetInstancePath||r.sheetInstancePath||"",sourceId:n.sourceId||n.uuid||"",reference:t,feature:n,pageId:r.id}),e&&x.workspace==="schematic"&&(tt(r.id,!0),J?.frameSelection?.())}if(e&&x.workspace==="pcb"){let r=g.scene.features.get(Number(a.featureId));r?.bounds&&Ur(r,!0)}Oe()}function aa(t){return t?.designator||t?.reference||t?.componentDesignator||""}function $b(){return tn(g.scene.manifest?.components||[],g.scene.componentModelCounts)}function rc(t){g.hiddenComponentRequest=t;let e=an(t,$b());g.hiddenComponents=e.hiddenReferences,g.renderer?.setHiddenFeatureIds(e.hiddenFeatureIds),e.ambiguous.length&&console.warn(`[prism-semantic-viewer] keeping ambiguous components visible: ${e.ambiguous.join(", ")}`),e.unknown.length&&console.warn(`[prism-semantic-viewer] ignoring unknown components: ${e.unknown.join(", ")}`);let a=aa(g.scene.features.get(x.selectedFeatureId));Ka(a,g.hiddenComponents)&&Rt();let s=fe.querySelector("input");return s?.value&&sc(s.value),e}function Ur(t,e=!1){if(!t?.bounds)return;let a=Fr(t.bounds);if(e||t.kind==="component"||!!aa(t)){let n=(a[2]+a[5])*.5<0,i=V.isBelow();n!==i&&V.setAxis("z",n)}V.frame(a)}function Qb(t){if(!t||!_?.featuresByPage)return null;let e=O.byId.get(x.selectedPageId),a=[...e?[e]:[],...(O.pages||[]).filter(r=>r.id!==e?.id)],s=r=>{let n=String(r.kind||"").toLowerCase();return n==="component"||n==="symbol_body"||n==="symbol_instance"?0:n==="symbol_reference"?1:n.startsWith("pin")?2:3};for(let r of a){let n=(_.featuresByPage[r.id]||[]).filter(i=>String(i.reference||i.designator||i.componentDesignator||"")===t).sort((i,o)=>s(i)-s(o));if(n.length)return{page:r,feature:n[0]}}return null}function Rt(){x.activeNetId=0,x.selectedFeatureId=0,x.selectedSchematicFeature=null,x.selectionAnchor=null;let t=Je().size>0,e=x.isolateNet;e&&!t?ra(!1):t?e&&Ra():x.isolateNet=!1,t||_o(),O.activeNetUid="",_&&(_.activeNetUid=""),J?.setSelection(null),J?.setHighlightedNet(""),Ye.textContent="No object selected",ze?.clearSelection?.(),Oe(),Cs(null)}function vs(t){return`<div class="selection-properties">${t.map(([e,a])=>`
    <div class="selection-property">
      <small>${U(e)}</small>
      <strong title="${U(String(a))}">${U(String(a))}</strong>
    </div>`).join("")}</div>`}function _s(t,e,a){return`
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
      <div class="selection-card-title"><small>${U(t)}</small><strong>${U(e)}</strong></div>
      <button class="selection-card-close" type="button" aria-label="Clear selection">&times;</button>
    </div>`}function Zb(t){let a=(g.topology.net_details?.[t.uid]||{}).terminals||[],s=t.metrics||{},r=Number(s.traceLengthMm||0).toFixed(2),n=s.objectCounts?.via||0,i=a.length,c=/^(VCC|VDD|GND|3V3|5V|12V|VIN|POWER)/i.test(t.name)?"#10b981":"#8b5cf6",d=t.netClass||"Default",u=a.length?a.map(b=>`
      <div class="selection-row pin-row-interactive" data-ref="${U(b.designator)}" data-pin="${U(b.pin)}">
        <span class="refdes-col"><strong>${U(b.designator)}</strong></span>
        <span class="pin-col">Pin ${U(b.pin)}</span>
        <span class="val-col" title="${U(b.value||"")}">${U(b.value||"-")}</span>
      </div>`).join(""):'<div class="selection-empty">No connected pin metadata is available.</div>';return`
    ${_s("Net",t.name,c)}
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
          <strong title="${U(d)}">${U(d)}</strong>
        </div>
      </div>
      
      <div class="selection-section">
        <span class="selection-section-title">Layers</span>
        <div class="net-layers-badges">
          ${(s.layers||[]).length?s.layers.map(b=>`<span class="layer-badge">${U(b)}</span>`).join(""):'<span class="layer-badge unknown">None</span>'}
        </div>
      </div>

      <div class="selection-section">
        <span class="selection-section-title">Connected Pins</span>
        <div class="selection-table compact-scroll" style="max-height: 120px;">
          ${u}
        </div>
      </div>
    </div>`}function ep(t,e=null){let a=_r(t.designator),s=a?a.value:t.value||"Not specified",r=a?a.footprint:t.footprint||"Not specified",n=a?.parameters||{},i=n.Manufacturer||n.Mfr||"",o=n["Manufacturer Part Number"]||n.MPN||n["Part Number"]||"",c=n.kicad_dnp==="true"||n.DNP==="true"||n.kicad_in_bom==="false",d="";(i||o)&&(d=`
      <div class="selection-section">
        <span class="selection-section-title">Component details</span>
        <div class="selection-table">
          <div class="selection-row">
            <span><strong>Manufacturer</strong></span>
            <span title="${U(i)}">${U(i||"-")}</span>
          </div>
          <div class="selection-row">
            <span><strong>Part Number</strong></span>
            <span title="${U(o)}">${U(o||"-")}</span>
          </div>
        </div>
      </div>`);let u="";return e&&(u=`
      <div class="selection-section">
        <span class="selection-section-title">Selected Pin</span>
        <div class="selection-table">
          <div class="selection-row">
            <span><strong>Pin</strong></span>
            <span>Pin ${U(e.pinNumber||e.pin||"")}</span>
            <span title="${U(e.pinName||"")}">${U(e.pinName||"No name")}</span>
          </div>
          <div class="selection-row">
            <span><strong>Net</strong></span>
            <span class="net-ref-interactive" data-net-name="${U(e.netName||"")}">${U(e.netName||"Not connected")}</span>
          </div>
        </div>
      </div>`),`
    ${_s("Component",t.designator||"Unknown","#3b82f6")}
    <div class="selection-component-dashboard">
      ${c?'<div class="dnp-banner" style="background:#b45309;color:#fff;font-size:9px;font-weight:750;text-align:center;padding:3px;margin-bottom:8px;border-radius:2px;text-transform:uppercase;letter-spacing:0.05em;">DNP (Do Not Populate)</div>':""}
      ${vs([["Value",s],["Footprint",r.split(":").pop()||r]])}
      ${d}
      ${u}
    </div>`}function tp(t,e){let a=String(t.kind||"").toLowerCase(),s=a.startsWith("pin");if(a==="component"||a.includes("symbol"))return`
      ${_s("Component",t.reference||t.componentDesignator||"Unknown","#3b82f6")}
      ${vs([["Value",t.value||t.componentValue||"Not specified"],["Footprint",t.componentFootprint||t.footprint||"Not specified"],["Library",t.libraryRef||"Not specified"],["UID",t.componentUid||t.uuid||t.sourceId||"Not resolved"]])}
      <div class="selection-section">
        <span class="selection-section-title">Schematic placement</span>
        ${vs([["Page",e?.name||"Unknown"],["Sheet",t.sheetInstancePath||"/"]])}
      </div>`;let n=s?[["Symbol",t.reference||t.designator||"Unknown"],["Value",t.value||t.componentValue||"Not specified"],["Pin",`${t.pinNumber||"-"}${t.pinName?` ${t.pinName}`:""}`],["Net",t.netName||"Not connected"],["PCB Pad",t.pcbPadId||"Not resolved"],["Component UID",t.componentUid||"Not resolved"]]:[["Page",e?.name||"Unknown"],["Kind",t.kind.replaceAll("_"," ")],["Net",t.netName||"Not connected"]];return`
    ${_s(t.kind.replaceAll("_"," "),t.pinName||t.reference||t.designator||t.text||t.netName||"Schematic object","#3b82f6")}
    ${vs(n)}
    <div class="selection-section">
      <span class="selection-section-title">Source identity</span>
      <div class="selection-table">
        <div class="selection-row">
          <span><strong>${s?"Pin UUID":"UUID"}</strong></span>
          <span title="${U(t.uuid||t.sourceId||"")}">${U(t.uuid||t.sourceId||"-")}</span>
          <span title="${U(t.objectId||"")}">${U(t.objectId||"No object ID")}</span>
        </div>
        <div class="selection-row">
          <span><strong>Sheet</strong></span>
          <span>${U(e?.name||"Unknown")}</span>
          <span title="${U(t.sheetInstancePath||"")}">${U(t.sheetInstancePath||"/")}</span>
        </div>
      </div>
    </div>`}function Oe(){if(ka(),x.workspace==="bom"){Q.hidden=!0,Q.innerHTML="";return}let t=g.scene.features.get(x.selectedFeatureId),e=t?.kind==="component"?t:null,a=x.workspace==="schematic"?x.selectedSchematicFeature:null,s=a?O.byId.get(a.pageId):null,r=x.activeNetId?g.scene.nets.find(b=>Number(b.id)===x.activeNetId):null;if(!r&&a&&(a.netUid?r=g.scene.nets.find(b=>b.uid===a.netUid):a.netName&&(r=jt(g.scene.nets,a.netName))),!e&&a){let b=a.reference||a.componentDesignator||a.designator;b&&(e=g.scene.componentFeatures.get(b)||{designator:b})}if(!e&&!r&&!a){Q.hidden=!0,Q.innerHTML="";return}let n="";if(r)n=Zb(r);else if(e){let b=a?.kind?.startsWith("pin")?a:null;n=ep(e,b)}else a&&(n=tp(a,s));Q.innerHTML=`
    ${n}
    <div class="selection-card-actions">
      ${r?`
        <button type="button" data-action="isolate" aria-keyshortcuts="I" title="Toggle isolated net view (I)" class="${x.isolateNet?"active":""}">Isolate</button>
        <button type="button" data-action="net-layers">Layers</button>
      `:""}
      <button type="button" data-action="frame">Frame selection</button>
    </div>`,Q.hidden=!1;let i=x.workspace==="schematic"?Ee:q,o=x.selectionAnchor,c=Q.offsetWidth||360,d=Q.offsetHeight||330;if(o){let b=Math.max(16,i.clientWidth-c-24),w=Math.max(16,i.clientHeight-d-24);Q.style.left=`${ne(o.x+18,16,b)}px`,Q.style.top=`${ne(o.y+18,16,w)}px`}else Q.style.left="20px",Q.style.top="20px";if(Q.querySelector(".selection-card-close").addEventListener("click",Rt),Q.querySelector("[data-action=frame]").addEventListener("click",Lr),r){let b=Q.querySelector("[data-action=isolate]");b&&b.addEventListener("click",()=>{ra(!x.isolateNet)});let w=Q.querySelector("[data-action=net-layers]");w&&w.addEventListener("click",Pr),Q.querySelectorAll(".pin-row-interactive").forEach(v=>{v.addEventListener("click",()=>{let h=v.dataset.ref,l=v.dataset.pin;if(!h)return;let p=((g.topology.net_details?.[r.uid]||{}).terminals||[]).find(E=>E.designator===h&&E.pin===l),y=p?ab(p.pcb_pad_id):0;y?na(y,!0):Dr(h,!0)})})}let u=Q.querySelector(".net-ref-interactive");u&&u.addEventListener("click",()=>{let b=u.dataset.netName;if(!b)return;let w=jt(g.scene.nets,b);w&&As(Number(w.id),!0)})}function Lr(){if(x.workspace==="schematic"){Yo();return}let t=g.scene.features.get(x.selectedFeatureId);if(t?.bounds)Ur(t);else{let e=g.scene.nets.find(a=>Number(a.id)===x.activeNetId);e?.boundsMm&&V.frame(Fr(qt(e.boundsMm)))}}function ap(){q.addEventListener("contextmenu",t=>t.preventDefault()),q.addEventListener("pointerdown",t=>{x.dragging=!0,x.lastX=t.clientX,x.lastY=t.clientY,x.pointerStartX=t.clientX,x.pointerStartY=t.clientY,x.dragMode=x.mode==="layer"||t.shiftKey||t.button!==0?"pan":"orbit",q.setPointerCapture(t.pointerId)}),q.addEventListener("pointermove",t=>{if(!x.dragging)return;let e=t.clientX-x.lastX,a=t.clientY-x.lastY;x.lastX=t.clientX,x.lastY=t.clientY,x.dragMode==="pan"?V.pan(e,a,q.clientHeight,x.mode==="layer"):V.orbit(e,a)}),q.addEventListener("pointerup",async t=>{x.dragging=!1,q.releasePointerCapture(t.pointerId),!(Math.hypot(t.clientX-x.pointerStartX,t.clientY-x.pointerStartY)>=3)&&(t.button===0?await po(t):t.button===2&&await ip(t))}),q.addEventListener("dblclick",async t=>{await po(t),Lr()}),q.addEventListener("wheel",t=>{t.preventDefault(),Math.abs(t.deltaX)>Math.abs(t.deltaY)*.4?V.pan(-t.deltaX,0,q.clientHeight,x.mode==="layer"):V.dolly(t.deltaY,x.mode==="layer")},{passive:!1}),window.addEventListener("keydown",lc),sp()}function sp(){let t=!1,e,a,s=0,r=0;Q.addEventListener("pointerdown",n=>{if(!n.target.closest(".selection-card-head")||n.target.closest(".selection-card-close"))return;t=!0,Q.classList.add("dragging");let o=Q.getBoundingClientRect();s=o.left,r=o.top,e=n.clientX,a=n.clientY,Q.setPointerCapture(n.pointerId),n.stopPropagation()}),Q.addEventListener("pointermove",n=>{if(!t)return;let i=n.clientX-e,o=n.clientY-a,c=x.workspace==="schematic"?Ee:q,d=Q.offsetWidth||360,u=Q.offsetHeight||330,b=Math.max(16,c.clientWidth-d-24),w=Math.max(16,c.clientHeight-u-24),v=ne(s+i,16,b),h=ne(r+o,16,w);Q.style.left=`${v}px`,Q.style.top=`${h}px`,x.selectionAnchor={x:v-18,y:h-18},n.stopPropagation()}),Q.addEventListener("pointerup",n=>{t&&(t=!1,Q.classList.remove("dragging"),Q.releasePointerCapture(n.pointerId),n.stopPropagation())})}function rp(){Ut("[data-workspace]").forEach(t=>{t.addEventListener("click",()=>nc(t.dataset.workspace))})}function nc(t){if(t==="schematic"&&!_||t==="bom"&&!ze)return;x.workspace=t,It.classList.remove("workspace-pcb","workspace-schematic","workspace-bom","workspace-stackup"),It.classList.add(`workspace-${t}`),(t==="schematic"&&(x.activeTab==="view"||x.activeTab==="inspect"||x.activeTab==="stats")||t==="bom"||t==="stackup")&&Ns("layers");let e=$('.rail-tab[data-tab="layers"]');e&&(t==="schematic"?(e.textContent="Pages",e.title="Schematic pages"):t==="bom"?(e.textContent="Summary",e.title="BoM summary"):(e.textContent="Layers",e.title="Layers and compare"));let a=t==="schematic",s=t==="bom",r=t==="stackup";if(q.hidden=a||s||r,Ee&&(Ee.hidden=!a),ws&&(ws.hidden=!a||!J),Es&&(Es.hidden=!a),Ts&&(Ts.hidden=!s),Ie&&(Ie.hidden=!r),we.hidden=a||s||r,ks.hidden=a||s||r,Ta&&(Ta.hidden=!a),Ut("[data-workspace]").forEach(n=>{n.classList.toggle("active",n.dataset.workspace===t)}),wa.textContent=s?"Semantic BoM active":a?J?"SVG DOM + WebGPU schematic world active":"WebGPU schematic world active":r?"Layer Stackup active":"WebGPU semantic glTF active",a&&!O.fitted&&(_.resize(),_.frameWorld(),O.fitted=!0),!a&&!s&&!r&&(g.renderer?.resize(),x.mode==="layer"?Cr():pe(performance.now(),{force:!0})),r)try{pp()}catch(n){console.error("Failed to render stackup workspace",n),Ie&&(Ie.innerHTML=`
          <div class="selection-empty" style="padding:40px;text-align:center;">
            Stackup view failed to render. ${U(n?.message||String(n))}
          </div>
        `)}Xo(),Oe()}function np(){Ee.addEventListener("pointerdown",t=>{J?.worldActive||J?.active||(x.schematicDragging=!0,x.schematicLastX=t.clientX,x.schematicLastY=t.clientY,x.schematicStartX=t.clientX,x.schematicStartY=t.clientY,Ee.setPointerCapture(t.pointerId))}),Ee.addEventListener("pointermove",t=>{if(J?.worldActive||J?.active||!x.schematicDragging||!_)return;let e=t.clientX-x.schematicLastX,a=t.clientY-x.schematicLastY;x.schematicLastX=t.clientX,x.schematicLastY=t.clientY,_.pan(e,a)}),Ee.addEventListener("pointerup",async t=>{if(!(J?.worldActive||J?.active)&&(x.schematicDragging=!1,Ee.releasePointerCapture(t.pointerId),Math.hypot(t.clientX-x.schematicStartX,t.clientY-x.schematicStartY)<3)){let e=await _.pickFeature(t.clientX,t.clientY);e?Vb(e):Ia()}}),Ee.addEventListener("dblclick",t=>{if(J?.worldActive||J?.active)return;let e=_.hitPage(t.clientX,t.clientY);e&&tt(e.id,!0)}),Ee.addEventListener("wheel",t=>{J?.worldActive||J?.active||(t.preventDefault(),_.zoom(t.deltaY,t.clientX,t.clientY))},{passive:!1})}async function po(t){if(!Se)return;let e=q.getBoundingClientRect();x.selectionAnchor={x:t.clientX-e.left,y:t.clientY-e.top};let a=await ic(t);(a.kind==="feature"||a.kind==="board")&&(x.selectedOccurrence=a.occurrenceIndex),a.featureId?na(a.featureId,!0):a.kind==="board"&&!g.renderer.identityOnly?cp():Rt()}async function ip(t){if(!Se||!Mr)return;let e=g.scene.features.get((await ic(t)).featureId),a=aa(e),s=a?_r(a):null;Mr({clientX:t.clientX,clientY:t.clientY,reference:a||void 0,value:String(s?.value||e?.value||"")||void 0})}function ic(t){let e=q.getBoundingClientRect();return oc((t.clientX-e.left)*q.width/e.width,(t.clientY-e.top)*q.height/e.height)}function oc(t,e){return g.renderer.pick(Se,t,e,{activeNetId:x.activeNetId,selectedFeatureId:x.selectedFeatureId,layerOffsets:Ho(),visibleLayers:x.mode==="3d"?g.visible3dLayers:g.compareLayers,showBoard:x.showBoard,showComponents:x.showComponents,componentOpacity:ne(1-x.separation/.1,0,1),boardOpacity:1-x.separation*.72,isolateNet:x.isolateNet,compareMode:x.mode==="layer",compareOffsets:Lt,visibleTileIds:x.mode==="3d"?g.visibleTileIds:null})}async function op(t,e){if(!Se||!g.renderer)return null;let a=q.getBoundingClientRect(),s=await oc((t-a.left)*q.width/a.width,(e-a.top)*q.height/a.height),r=s.featureId?So(g.scene.features.get(s.featureId)):null;return{...s,selection:r}}function cp(){let t=x.selectedOccurrence,e=ta;ta=!0;try{Rt()}finally{ta=e}x.selectedOccurrence=t,Cs({kind:"board",sourceContext:"3D"})}function lp(t,e){let a=g.scene.componentFeatures.get(String(t)),s=a?g.scene.features.get(Number(a.featureId))?.bounds:null;if(!s)return null;let r=s[2]+s[5]>=0;return cc([(s[0]+s[3])/2,(s[1]+s[4])/2,r?s[5]:s[2]],e)}function cc(t,e){if(!Se||!g.renderer)return null;let a=e==null?0:g.renderer.occurrenceKeys.indexOf(String(e)),s=g.renderer.occurrenceMatrices[a];if(!s)return null;let r=Pt(Se.matrix,ba(s,t),Se.viewport);if(!r)return null;let n=q.getBoundingClientRect();return{x:n.left+r.x*n.width/q.width,y:n.top+r.y*n.height/q.height}}function lc(t){if(!Ar())return;if(t.target instanceof HTMLInputElement){t.key==="Escape"&&t.target.blur();return}let e=t.key.toLowerCase();if(x.workspace==="schematic"){if(e==="/")t.preventDefault(),Ns("search"),fe.querySelector("#entity-search")?.focus();else if(e==="escape")O.activeNetUid?(O.activeNetUid="",x.activeNetId=0,_.activeNetUid="",J?.setHighlightedNet(""),Oe()):Ia();else if(e==="~"||t.key==="~"){t.preventDefault();let a=x.selectedSchematicFeature?.netUid;a&&(O.activeNetUid===a?(O.activeNetUid="",x.activeNetId=0,_.activeNetUid="",J?.setHighlightedNet("")):Jo(a,x.selectedSchematicFeature))}else if(e==="home")_?.frameWorld();else if(e==="[")xs("previous");else if(e==="]")xs("next");else if(e==="n"){t.preventDefault();let a=_?.cycleNetIntrasheetLink(t.shiftKey?-1:1);a?.pageId&&(x.selectedPageId=a.pageId,_.selectedPageId=a.pageId,dc())}else if(t.altKey&&e==="arrowup")xs("parent");else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;_?.pan(a,s)}return}if(e==="/")t.preventDefault(),Ns("search"),fe.querySelector("#entity-search").focus();else if(e==="escape")Rt();else if(e==="i"&&x.workspace==="pcb"&&Je().size)t.preventDefault(),ra(!x.isolateNet);else if(e==="home")V.frame(sa());else if(e==="`")Do(!x.showStats);else if(["x","y","z"].includes(e))V.setAxis(e,t.shiftKey);else if(e==="f")V.flip();else if(e==="r")V.rotateZ(t.shiftKey?-1:1);else if(e===" "){t.preventDefault();let a=g.scene.features.get(x.selectedFeatureId);a?.bounds&&V.setFocus([(a.bounds[0]+a.bounds[3])/2,(a.bounds[1]+a.bounds[4])/2,(a.bounds[2]+a.bounds[5])/2])}else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;V.pan(a,s,q.clientHeight,x.mode==="layer")}}function Ns(t){x.activeTab=t,It.classList.remove("panel-collapsed"),Ut(".rail-tab").forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),Ut(".tab-panel").forEach(e=>{e.classList.toggle("active",e.dataset.panel===t)})}function dp(){let t=we.getContext("2d");t.clearRect(0,0,we.width,we.height);let e=[we.width/2,we.height/2],a=V.basis(),s=[{axis:"x",label:"X",color:"#e23838",vector:[1,0,0]},{axis:"y",label:"Y",color:"#2dbd50",vector:[0,1,0]},{axis:"z",label:"Z",color:"#3157d5",vector:[0,0,1]}],r=[];for(let n of s)for(let i of[-1,1]){let o=n.vector.map(d=>d*i),c=[Tr(o,a.right),-Tr(o,a.up),Tr(o,a.back)];r.push({...n,sign:i,depth:c[2],point:[e[0]+c[0]*34,e[1]+c[1]*34]})}for(let n of s){let i=r.find(o=>o.axis===n.axis&&o.sign===1);t.strokeStyle=n.color,t.lineWidth=2.4,t.beginPath(),t.moveTo(...e),t.lineTo(...i.point),t.stroke()}Ms=[];for(let n of r.sort((i,o)=>o.depth-i.depth)){let i=n.sign===1,o=i?13:9;t.beginPath(),t.arc(n.point[0],n.point[1],o,0,Math.PI*2),t.fillStyle=i?n.color:`${n.color}66`,t.fill(),t.lineWidth=2,t.strokeStyle=bp(n.color,i?.45:.58),t.stroke(),i&&(t.fillStyle="#07101c",t.font="700 13px system-ui",t.textAlign="center",t.textBaseline="middle",t.fillText(n.label,n.point[0],n.point[1]+.5)),Ms.push({...n,radius:o+5})}}function up(){!we||we.dataset.bound==="true"||(we.dataset.bound="true",we.addEventListener("click",t=>{let e=we.width/we.clientWidth,a=we.height/we.clientHeight,s=[t.offsetX*e,t.offsetY*a],r=Ms.map(n=>({item:n,distance:Math.hypot(s[0]-n.point[0],s[1]-n.point[1])})).filter(({item:n,distance:i})=>i<=n.radius).sort((n,i)=>n.distance-i.distance)[0]?.item;r&&V.setAxis(r.axis,r.sign<0)}))}function fp(){if(x.mode!=="layer"||!Se){ks.innerHTML="";return}let t=sa(),e=No();ks.innerHTML=g.scene.copperLayers.filter(a=>e.has(Number(a.id))).map(a=>{let s=Lt.get(Number(a.id))||[0,0,0],r=hp([t[0]+s[0],t[4]+s[1],0],Se.matrix,q.clientWidth,q.clientHeight);return!r||r[0]<-100||r[0]>q.clientWidth+100||r[1]<-100||r[1]>q.clientHeight+100?"":`<span style="left:${r[0]}px;top:${r[1]}px">${U(a.name)}</span>`}).join("")}function dc(){if(x.workspace!=="schematic"||!_){Ta.innerHTML="";return}Ta.innerHTML=O.visiblePages.filter(t=>_.pagePixelWidth(t)>120).map(t=>{let[e,a]=_.worldToScreen(t.worldX+8*_.scale,t.worldY-6*_.scale),s=t.id===x.selectedPageId,n=O.activeNetUid&&t.netUids.includes(O.activeNetUid)?"#18ef52":s?"#3b82f6":"#4b8de8";return`<div class="schematic-page-label" style="left:${e}px;top:${a}px;border-left-color:${n}">
        <strong>${U(t.name)}</strong>
        <small>Page ${t.sheetNumber} &middot; ${t.featureCount.toLocaleString()} features</small>
      </div>`}).join("")}function hp(t,e,a,s){let r=t[0],n=t[1],i=t[2],o=e[0]*r+e[4]*n+e[8]*i+e[12],c=e[1]*r+e[5]*n+e[9]*i+e[13],d=e[3]*r+e[7]*n+e[11]*i+e[15];return Math.abs(d)<1e-8?null:[(o/d*.5+.5)*a,(.5-c/d*.5)*s]}function Tr(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function bp(t,e){let a=t.replace("#","");return`#${[0,2,4].map(s=>Math.round(parseInt(a.slice(s,s+2),16)*e).toString(16).padStart(2,"0")).join("")}`}function go(t,e){x.frameSamples.push({intervalMs:t,cpuMs:e}),x.frameSamples.length>180&&x.frameSamples.shift()}function mo(t,e){if(!t.length)return 0;let a=[...t].sort((s,r)=>s-r);return a[Math.min(a.length-1,Math.floor((a.length-1)*e))]}function yo(t){if(!gs||(x.frames+=1,t-x.fpsAt<=500))return;x.fps=x.frames*1e3/(t-x.fpsAt);let e=x.frameSamples;if(x.frameIntervalMs=e.length?e.reduce((n,i)=>n+i.intervalMs,0)/e.length:0,x.frameCpuMs=e.length?e.reduce((n,i)=>n+i.cpuMs,0)/e.length:0,x.frameIntervalP95Ms=mo(e.map(n=>n.intervalMs),.95),x.frameCpuP95Ms=mo(e.map(n=>n.cpuMs),.95),x.frames=0,x.fpsAt=t,Uo(),x.workspace==="bom"){let n=ze?.payload?.counts||{},i=[["Renderer","BoM DOM table"],["Schema",ze?.payload?.schema||"-"],["Grouped rows",n.rows||0],["Components",n.components||0],["DNP components",n.dnpComponents||0],["Extra columns",ze?.payload?.extraColumns?.length||0],["Frame interval",`${x.frameIntervalMs.toFixed(2)} ms avg / ${x.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${x.frameCpuMs.toFixed(2)} ms avg / ${x.frameCpuP95Ms.toFixed(2)} p95`],["FPS",x.fps.toFixed(1)]];gs.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("");return}let a=x.workspace==="schematic"&&_?_.stats():null,s=x.workspace==="schematic"&&J?J.stats():null,r=x.workspace==="schematic"&&_?J?.active?[["Renderer","SVG DOM schematic detail"],["Pages",O.pages.length],["Mounted pages",s.mountedPages],["Active page",s.activePage],["DOM nodes",s.domNodes.toLocaleString()],["Indexed features",s.indexedFeatures.toLocaleString()],["Indexed nets",s.indexedNets.toLocaleString()],["SVG cache",`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`],["Selection",`${s.selectionMs.toFixed(1)} ms`],["Active net",g.scene.nets.find(n=>n.uid===O.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Tracking verts",a.netFlowVertices.toLocaleString()],["Mount",`${s.mountMs.toFixed(1)} ms`],["Highlight",`${s.highlightMs.toFixed(1)} ms`],["Fallback",s.fallbackReason||"-"],["Frame interval",`${x.frameIntervalMs.toFixed(2)} ms avg / ${x.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${x.frameCpuMs.toFixed(2)} ms avg / ${x.frameCpuP95Ms.toFixed(2)} p95`],["FPS",x.fps.toFixed(1)]]:[["Renderer",J?"SVG DOM + WebGPU world":"WebGPU schematic world"],["Pages",O.pages.length],["Visible pages",O.visiblePages.length],["DOM pages",s?s.mountedPages:0],["DOM nodes",s?s.domNodes.toLocaleString():"0"],["Indexed SVG features",s?s.indexedFeatures.toLocaleString():"0"],["SVG cache",s?`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`:"0 pages"],["JS heap",s?.heapMb?`${s.heapMb.toFixed(1)} MB`:"-"],["Hierarchy links",O.manifest.edges?.length||0],["Selected page",O.byId.get(x.selectedPageId)?.name||"-"],["Active net",g.scene.nets.find(n=>n.uid===O.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Downloaded",`${(_.downloadedBytes/1048576).toFixed(1)} MB`],["Resident vectors",`${(a.residentVectorBytes/1048576).toFixed(1)} MB`],["Vector pages",`${a.vectorChunks} loaded / ${a.vectorLoads} loading`],["Vector draw",`${a.vectorVertices.toLocaleString()} verts / ${a.vectorDrawChunks} chunks`],["Native detail",`${a.nativeDetailPages} pages @ ${a.nativePxPerMm} / ${a.nativeThresholdPxPerMm} px/mm`],["Vector failures",a.failedVectorChunks],["Truncated",a.truncatedVectors],["Frame interval",`${x.frameIntervalMs.toFixed(2)} ms avg / ${x.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${x.frameCpuMs.toFixed(2)} ms avg / ${x.frameCpuP95Ms.toFixed(2)} p95`],["FPS",x.fps.toFixed(1)]]:[["Renderer","WebGPU semantic glTF"],["Mode",x.mode==="3d"?"3D":"Layer Compare"],["Visible layers",x.mode==="3d"?g.visible3dLayers.size:g.compareLayers.size],["Resident tiles",g.scene.loaded.size],["Loading tiles",g.scene.loading.size],["Failed tiles",g.scene.failed.size],["Triangles",Math.round(g.triangles).toLocaleString()],["Downloaded",`${(g.loadedBytes/1048576).toFixed(1)} MB`],["Resident GLB",`${(g.residentTileBytes/1048576).toFixed(1)} MB`],["Resident GPU",`${(g.residentTileGpuBytes/1048576).toFixed(1)} MB`],["Tile loads",g.tileLoads.toLocaleString()],["Tile evictions",g.tileEvictions.toLocaleString()],["Tile scheduler",`${g.tileSchedulerMs.toFixed(2)} ms`],["Active net",g.scene.nets.find(n=>Number(n.id)===x.activeNetId)?.name||"-"],["Frame interval",`${x.frameIntervalMs.toFixed(2)} ms avg / ${x.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${x.frameCpuMs.toFixed(2)} ms avg / ${x.frameCpuP95Ms.toFixed(2)} p95`],["FPS",x.fps.toFixed(1)]];gs.innerHTML=r.map(([n,i])=>`<dt>${n}</dt><dd>${i}</dd>`).join("")}function uc(t){return`rgb(${t.slice(0,3).map(e=>Math.round(e*255)).join(" ")})`}function pp(){if(!Ie)return;let t=g.scene.layers||[];if(!t.length){Ie.innerHTML='<div class="selection-empty" style="padding:40px;text-align:center;">No stackup information available for this board.</div>';return}let e=t.filter(k=>["copper","dielectric","paste","silkscreen","soldermask"].includes(k.role)),a=g.topology.board?.stackup||{},s=k=>{if(k==null||k==="")return"None";let j=String(k);return U(j.includes(".")?j.split(".").pop():j)},r=(k,j=4)=>{let C=Number(k);return Number.isFinite(C)&&C>0?C.toFixed(j):"-"},n=(k,j=3)=>{let C=Number(k);return Number.isFinite(C)?C.toFixed(j):"-"},i=k=>{if(k==null||k==="")return"No";if(typeof k=="boolean")return k?"Yes":"No";let j=String(k).trim().toLowerCase(),C=j.includes(".")?j.split(".").pop():j;return["0","false","no","n","off","none"].includes(C)?"No":(["1","true","yes","y","on"].includes(C),"Yes")},o=k=>({copper:"Copper",dielectric:"Dielectric",paste:"Paste",silkscreen:"Silkscreen",soldermask:"Solder mask"})[k]||String(k||"Layer"),c=k=>k.role!=="dielectric"?"":k.type==="core"?"Core":k.type==="prepreg"||(k.material||"").toLowerCase().includes("prepreg")?"Prepreg":"Core",d=(k,j=4)=>{let C=Number(k.thickness_mm);return Number.isFinite(C)&&C>0?`${C.toFixed(j)} mm`:"Not specified"},u=k=>{let j=o(k.role),C=String(k.material||"").trim(),W=C&&C.toLowerCase()!==String(k.role||"").toLowerCase();if(k.role==="dielectric"){let ie=[W?C:"",r(k.epsilon_r,3)!=="-"?`\u03B5r ${r(k.epsilon_r,3)}`:"",r(k.loss_tangent,4)!=="-"?`tan \u03B4 ${r(k.loss_tangent,4)}`:""].filter(Boolean).join(" \xB7 ");return{primary:`${k.name} \xB7 ${c(k)}`,secondary:ie}}return{primary:[k.name,j,W?C:""].filter(Boolean).join(" \xB7 "),secondary:""}},b=0,w=0,v=0,h=0;e.forEach(k=>{h+=k.thickness_mm||0,k.role==="copper"?k.name.toLowerCase().includes("gnd")||k.name.toLowerCase().includes("pwr")||k.name.toLowerCase().includes("plane")?w++:b++:k.role==="dielectric"&&v++});let l=g.scene.copperLayers||[],m=0,f=0,p=0,y=[...(g.scene.manifest?.barrels||[]).filter(k=>k.kind==="via"),...[...g.scene.features.values()].filter(k=>k.kind==="via")],E=Yi(l,y);m=E.counts.thru,f=E.counts.blind,p=E.counts.buried;let T=E.spans,I=30,M=I,R=[],A=new Map(e.map((k,j)=>[k,j])),S=gp(e),B=(k,j)=>{let C=S.get(k.name);if(C!==void 0)return C;let W=Number(k.stack_index);return Number.isFinite(W)?W:j+1e5},P=[...e].sort((k,j)=>{let C=B(k,A.get(k)||0),W=B(j,A.get(j)||0);return C!==W?C-W:(j.z_mm||0)-(k.z_mm||0)});P.forEach(k=>{let j=12;k.role==="dielectric"?j=Math.max(160,Math.min(360,(k.thickness_mm||.1)*140)):k.role==="copper"?j=22:k.role==="soldermask"&&(j=14),R.push({...k,svgY:M,svgHeight:j}),M+=j});let F=800,L=130,X=240,ee=L+X+16,re=ee+84,_e="";R.forEach(k=>{let j=k.color||"#7f7f7f";k.role==="copper"?j=k.color||"#f97316":k.role==="dielectric"?j="#a98d5c":k.role==="paste"?j="#cbd5e1":k.role==="soldermask"?j="#1b4332":k.role==="silkscreen"&&(j="#e2e8f0");let C=l.findIndex(Oc=>Oc.name===k.name),W=u(k),ie=k.svgY+k.svgHeight/2,ye=!!W.secondary&&k.svgHeight>=38,At=ye?ie-5:ie+3,Us=U(k.id),Fa=U(k.name),He=Number.isFinite(Number(k.thickness_mm))&&Number(k.thickness_mm)>0,Bc=U(He?d(k):"\u2014"),Cc=U([W.primary,W.secondary,`Thickness ${d(k)}`].filter(Boolean).join("; "));_e+=`
      <g class="stackup-svg-layer" data-layer-id="${Us}" data-layer-name="${Fa}">
        <title>${Cc}</title>
        <rect x="${L}" y="${k.svgY}" width="${X}" height="${k.svgHeight}" fill="${j}" opacity="0.85" rx="1"/>
        <text x="${L-8}" y="${k.svgY+k.svgHeight/2+3}" fill="var(--muted)" font-size="9px" text-anchor="end" font-weight="700">
          ${k.role==="copper"?C+1:""}
        </text>
        <path class="stackup-layer-dimension" d="M ${ee+6} ${k.svgY+1} H ${ee} V ${k.svgY+k.svgHeight-1} H ${ee+6}" />
        <text class="stackup-layer-thickness" x="${ee+10}" y="${ie+3}" fill="var(--muted)" font-size="8.5px" font-weight="650">
          ${Bc}
        </text>
        <text class="stackup-layer-name" x="${re}" y="${At}" fill="var(--foreground)" font-size="9px" font-weight="650">
          ${U(W.primary)}
        </text>
        ${ye?`<text class="stackup-layer-metadata" x="${re}" y="${ie+10}" fill="var(--muted)" font-size="8px">${U(W.secondary)}</text>`:""}
      </g>
    `});let ce="",Ne=R.filter(k=>k.role==="copper");T.forEach((k,j)=>{let C=R.find(He=>He.name===k.startName),W=R.find(He=>He.name===k.endName);if(!C||!W)return;let ie=C.svgY,ye=W.svgY+W.svgHeight,At=L+(j+1)*X/(T.length+1),Us=k.type==="thru"?"Thru":k.type==="blind"?"Blind":"Buried",Fa=`var(--stackup-via-${k.type})`;ce+=`
      <g class="stackup-svg-via" data-via-type="${k.type}">
        <title>${Us}: ${k.startName} \u2192 ${k.endName}</title>
        ${Ne.map(He=>He.svgY>=C.svgY&&He.svgY<=W.svgY?`<rect x="${At-5}" y="${He.svgY}" width="10" height="${He.svgHeight}" fill="${Fa}" rx="0.5" />`:"").join("")}
        <rect x="${At-2}" y="${ie}" width="4" height="${ye-ie}" fill="${Fa}" opacity="0.95" />
        <rect x="${At-.75}" y="${ie-1}" width="1.5" height="${ye-ie+2}" fill="var(--panel)" opacity="0.9" />
      </g>
    `});let Pe=`
    <svg class="stackup-visual-svg" viewBox="0 0 ${F} ${M+10}" width="${F}" height="${M+10}">
      <g class="stackup-svg-column-headings" aria-hidden="true">
        <text x="${ee+10}" y="15">Thickness</text>
        <text x="${re}" y="15">Layer / material properties</text>
      </g>
      <g class="stackup-total-dimension" aria-label="Total board thickness ${h.toFixed(4)} millimetres">
        <path d="M 76 ${I} H 68 V ${M} H 76" />
        <text x="68" y="15">Total ${h.toFixed(4)} mm</text>
      </g>
      ${_e}
      ${ce}
    </svg>
    <div class="stackup-via-legend" aria-label="Via span legend">
      <span><i data-via-type="thru"></i>Thru</span>
      <span><i data-via-type="blind"></i>Blind</span>
      <span><i data-via-type="buried"></i>Buried</span>
    </div>
  `,ge="";P.forEach(k=>{let j="silk";k.role==="copper"?j="copper":k.role==="dielectric"?j="dielectric":k.role==="paste"?j="paste":k.role==="soldermask"&&(j="mask");let C=c(k),W=U(k.id),ie=U(k.name),ye=u(k);ge+=`
      <tr data-layer-id="${W}" data-layer-name="${ie}" tabindex="0" aria-label="${U(`${ye.primary}; thickness ${d(k)}`)}">
        <td><strong>${ie}</strong></td>
        <td><span class="stackup-badge ${j}">${k.role}</span></td>
        <td>${C||"-"}</td>
        <td>${U(k.material||"-")}</td>
        <td>${k.role==="dielectric"?r(k.epsilon_r,3):"-"}</td>
        <td>${k.role==="dielectric"?r(k.loss_tangent,4):"-"}</td>
        <td>${k.thickness_mm?k.thickness_mm.toFixed(4)+" mm":"-"}</td>
      </tr>
    `});let Ve="",De=g.topology.board?.net_classes||[],at=k=>{let j=n(k);return j==="-"?j:`${j} mm`};De.length?De.forEach(k=>{Ve+=`
        <tr>
          <td><strong>${k.name}</strong></td>
          <td>${at(k.track_width)}</td>
          <td>${at(k.clearance)}</td>
          <td>${at(k.diff_pair_width)}</td>
          <td>${at(k.diff_pair_gap)}</td>
          <td>${Number.isFinite(Number(k.via_diameter))?`${n(k.via_drill)}/${n(k.via_diameter)} mm`:"-"}</td>
        </tr>
      `}):Ve=`
      <tr>
        <td colspan="6" class="selection-empty" style="text-align: center;">No design rules or impedance classes defined.</td>
      </tr>
    `,Ie.innerHTML=`
    <div class="stackup-header">
      <div class="stackup-header-title">
        <h1>Layer Stackup</h1>
        <p>Board cross-section profile, layer properties & design rules</p>
      </div>
    </div>

    <div class="stackup-workspace-body">
      <div class="stackup-diagram-card">
        <span class="stackup-section-title">Cross-Section Profile</span>
        ${Pe}
      </div>
      <aside class="stackup-side-panel">
      <div class="stackup-summary-grid">
        <div class="stackup-summary-card">
          <label>Total Thickness</label>
          <span>${h.toFixed(4)} mm</span>
        </div>
        <div class="stackup-summary-card">
          <label>Copper Layers</label>
          <span>${l.length} (${b} Sig / ${w} Plane)</span>
        </div>
        <div class="stackup-summary-card">
          <label>Dielectrics</label>
          <span>${v} Layers</span>
        </div>
        <div class="stackup-summary-card">
          <label>Thru Vias</label>
          <span>${m}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Blind Vias</label>
          <span>${f}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Buried Vias</label>
          <span>${p}</span>
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
                ${ge}
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
                ${Ve}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </aside>
    </div>
  `;let Gt=(k,j)=>{Ie.querySelectorAll(".stackup-svg-layer").forEach(C=>{let W=C.dataset.layerId===k;C.classList.toggle("active",W&&j)}),Ie.querySelectorAll(".stackup-table tbody tr[data-layer-id]").forEach(C=>{let W=C.dataset.layerId===k;C.classList.toggle("active",W&&j)})},Ds=k=>{let j=Ie.querySelector(".stackup-diagram-card"),C=Ie.querySelector(`.stackup-svg-layer[data-layer-id="${CSS.escape(k)}"]`);if(!j||!C||j.scrollHeight<=j.clientHeight)return;let W=j.getBoundingClientRect(),ie=C.getBoundingClientRect(),ye=j.scrollTop+ie.top-W.top-(j.clientHeight-ie.height)/2,At=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;j.scrollTo({top:Math.max(0,ye),behavior:At?"auto":"smooth"})},Na=(k,{revealDiagram:j=!1}={})=>{k.forEach(C=>{let W=()=>{let ye=C.dataset.layerId;Gt(ye,!0),j&&Ds(ye)},ie=()=>Gt(null,!1);C.addEventListener("mouseenter",W),C.addEventListener("mouseleave",ie),j&&(C.addEventListener("focus",W),C.addEventListener("blur",ie))})};Na(Ie.querySelectorAll(".stackup-svg-layer")),Na(Ie.querySelectorAll(".stackup-table tbody tr[data-layer-id]"),{revealDiagram:!0})}function gp(t){let e=t.filter(r=>r.role==="dielectric");if(!(e.length===1&&e[0]?.name==="Board"))return new Map;let s=new Map;return["F.SilkS","F.Paste","F.Mask","F.Cu","Board","B.Cu","B.Mask","B.Paste","B.SilkS"].forEach((r,n)=>s.set(r,n)),s}function fc(){let t=null;return{begin(){return t?.abort(),t=new AbortController,t},owns(e){return e!==null&&e===t&&!e.signal.aborted},cancel(){t?.abort(),t=null}}}async function hc(t,e,{owner:a,bundleUrl:s,loadBundle:r,now:n=()=>performance.now()}){let i=n(),o={},{signal:c}=e,d=()=>a.owns(e)&&t.isConnected;try{t.renderLoading();let u=n(),{bundle:b,topology:w,semanticGeometry:v,assetCache:h}=await r(s,o,c);if(o.bundle_group_total_ms=n()-u,!d())return;t.renderShell();let l=n(),m=await t.mountViewer({topology:w,semanticGeometry:v,readiness:b.readiness,assetCache:h,signal:c});if(!d()){m?.dispose?.();return}t.publishController(m),o.mount_and_first_frame_ms=n()-l,Object.assign(o,m?.performance||{}),o.reload_to_visible_ms=n()-i,t.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"board-visible",readiness_stage:b.readiness?.stage||"semantic-ready",readiness_progress:b.readiness?.progress??100,timings:o})}catch(u){if(!d())return;t.renderError(u),t.emitError(u)}}var mp="prism.visualizer_bundle.a0";function yp(){return`
    <style>
      ${qr}
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
  `}function xp(t){return String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}async function bc(t,e=null,a="fetch",s=void 0){let r=performance.now(),n=await fetch(t,{cache:"no-store",signal:s});if(!n.ok)throw new Error(`Failed to load ${t}: ${n.status}`);let i=await n.json();return e&&(e[`${a}_fetch_parse_ms`]=performance.now()-r,e[`${a}_content_length`]=Number(n.headers.get("content-length")||0)),i}async function vp(t,e,a){let s=new URL(t,document.baseURI).toString(),r=new URL(s).searchParams.get("viewer")||"",n=zt.open(),i=await n.peekJson(s).catch(()=>null),o=!!i;i||(i=await bc(s,e,"bundle",a),ia(i)&&n.store(s,new TextEncoder().encode(JSON.stringify(i)))),e&&(e.bundle_from_cache=o);let c=ia(i)&&n.enabled?n:null;if(i.schema!==mp)throw new Error(`Unsupported visualizer bundle schema: ${i.schema||"missing"}`);let d=new URL(i.topology||"topology.json",s),u=new URL(i.semantic_geometry||"semantic_geometry.json",s),b=(h,l)=>c?c.fetchJson(h.toString(),{signal:a}):bc(h,e,l,a),[w,v]=await Promise.all([b(d,"topology"),b(u,"semantic_geometry")]);return{bundle:i,topology:w,semanticGeometry:Ba(v,s,i,r),assetCache:c}}var Kr=class extends HTMLElement{static get observedAttributes(){return["bundle-url","workspace"]}constructor(){super(),this.attachShadow({mode:"open"}),this.controller=null,this.reloadOwner=fc(),this.pendingSelection=null,this.pendingHiddenComponents=null,this.pendingOccurrences=null,this.reloadQueued=!1,this.reloadSource=null}connectedCallback(){this.queueReload()}disconnectedCallback(){this.reloadOwner.cancel(),this.controller?.dispose?.(),this.controller=null,this.reloadSource=null}attributeChangedCallback(e,a,s){if(!(!this.isConnected||a===s)){if(e==="workspace"){this.controller?.setWorkspace?.(this.workspace);return}this.queueReload()}}get workspace(){return this.getAttribute("workspace")==="stackup"?"stackup":"pcb"}queueReload(){let e=this.getAttribute("bundle-url");!e||e===this.reloadSource||(this.reloadSource=e,!this.reloadQueued&&(this.reloadQueued=!0,queueMicrotask(()=>{this.reloadQueued=!1,this.isConnected&&this.reload()})))}async reload(){let e=this.getAttribute("bundle-url"),a=this.reloadOwner.begin();if(this.controller?.dispose?.(),this.controller=null,!e){this.shadowRoot.innerHTML="<style>:host{display:block;height:100%;font:14px system-ui;color:#94a3b8}</style><div>Semantic bundle URL is missing.</div>";return}await hc(this,a,{owner:this.reloadOwner,bundleUrl:e,loadBundle:vp})}renderLoading(){this.shadowRoot.innerHTML='<style>:host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}</style><div style="display:grid;place-items:center;height:100%">Loading semantic visualizer...</div>'}renderShell(){this.shadowRoot.innerHTML=yp()}renderError(e){console.error(e),this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}
        .error{height:100%;display:grid;place-items:center;padding:24px}
        pre{max-width:100%;white-space:pre-wrap;color:#fecaca;background:#111827;border:1px solid #374151;padding:16px}
      </style>
      <div class="error"><pre>${xp(e?.stack||e?.message||String(e))}</pre></div>
    `}mountViewer({topology:e,semanticGeometry:a,readiness:s,assetCache:r=null,signal:n}){return Nr({root:this.shadowRoot,topology:e,semanticGeometry:a,readiness:s,workspaceScope:"3d",assetCache:r,deferComponents:!!this.pendingOccurrences,isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{n.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:selectionchange",{bubbles:!0,composed:!0,detail:{selection:i}}))},onContextMenu:i=>{n.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:contextmenu",{bubbles:!0,composed:!0,detail:i}))},onViewStateChange:i=>{n.aborted||this.emitViewState(i)},onPerformanceEvent:i=>{n.aborted||(console.info("[prism-3d-perf]",i),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:performance",{bubbles:!0,composed:!0,detail:i})))}})}publishController(e){this.controller=e,this.controller?.setWorkspace?.(this.workspace),this.pendingHiddenComponents&&this.controller?.setHiddenComponents?.(this.pendingHiddenComponents),this.pendingOccurrences&&this.controller?.setOccurrences?.(this.pendingOccurrences),this.pendingGpuBudget!=null&&this.controller?.setGpuBudget?.(this.pendingGpuBudget),this.pendingSelection&&this.controller?.setSelection?.(this.pendingSelection),this.pendingHighlightedNets?.length&&this.controller?.setHighlightedNets?.(this.pendingHighlightedNets);let a=this.getViewState();a&&this.emitViewState(a)}emitViewState(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:viewstatechange",{bubbles:!0,composed:!0,detail:e}))}emitReady(e){console.info("[prism-3d-perf]",e),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:ready",{bubbles:!0,composed:!0,detail:e}))}emitError(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:error",{bubbles:!0,detail:{error:e}}))}setSelection(e){this.pendingSelection=e||null,this.controller?.setSelection?.(this.pendingSelection)}setHighlightedNets(e){this.pendingHighlightedNets=Array.isArray(e)?[...e]:[],this.controller?.setHighlightedNets?.(this.pendingHighlightedNets)}setHiddenComponents(e){this.pendingHiddenComponents=Array.isArray(e)?[...e]:[],this.controller?.setHiddenComponents?.(this.pendingHiddenComponents)}setOccurrences(e){this.pendingOccurrences=e==null?null:Array.from(e,a=>a?.matrix?{matrix:[...a.matrix],key:a.key}:[...a]),this.controller?.setOccurrences?.(this.pendingOccurrences)}pickAt(e,a){return Promise.resolve(this.controller?.pickAt?.(e,a)??null)}projectComponent(e,a){return this.controller?.projectComponent?.(e,a)??null}setStatsOverlay(e){this.controller?.setStatsOverlay?.(e)}getStats(){return this.controller?.stats?.()??null}setLodOverride(e){this.controller?.setLodOverride?.(e)}setGpuBudget(e){this.pendingGpuBudget=e,this.controller?.setGpuBudget?.(e)}projectPoint(e,a){return this.controller?.projectPoint?.(e,a)??null}getComponentReferences(){return this.controller?.getComponentReferences?.()??[]}resize(){this.controller?.resize?.()}getViewState(){return this.controller?.getViewState?.()??null}setViewMode(e){this.controller?.setViewMode?.(e)}setLayerVisible(e,a){this.controller?.setLayerVisible?.(e,a)}applyLayerPreset(e){this.controller?.applyLayerPreset?.(e)}setShowBoard(e){this.controller?.setShowBoard?.(e)}setShowComponents(e){this.controller?.setShowComponents?.(e)}setShowPlaceholders(e){this.controller?.setShowPlaceholders?.(e)}setRealisticColors(e){this.controller?.setRealisticColors?.(e)}setSeparation(e){this.controller?.setSeparation?.(e)}showNetLayers(){this.controller?.showNetLayers?.()}setNetIsolation(e){this.controller?.setNetIsolation?.(e)}};function pc(){customElements.get("prism-semantic-viewer")||customElements.define("prism-semantic-viewer",Kr)}var Sa=Object.freeze({mm:1,fineMm:.1,deg:15,fineDeg:1}),Gr=Object.freeze([[1,0,0],[0,1,0],[0,0,1]]);function gc(t){return Math.round(t*1e9)/1e9+0}function St(t){let e=Math.hypot(...t.rotation)||1,a=t.rotation.map(r=>r/e),s=[a[3],a[0],a[1],a[2]].find(r=>Math.abs(r)>1e-12)??1;return{translationMm:t.translationMm.map(gc),rotation:a.map(r=>gc(s<0?-r:r))}}function wp(t){let[e,a,s,r]=t.rotation,[n,i,o]=t.translationMm;return[1-2*(a*a+s*s),2*(e*a+s*r),2*(e*s-a*r),0,2*(e*a-s*r),1-2*(e*e+s*s),2*(a*s+e*r),0,2*(e*s+a*r),2*(a*s-e*r),1-2*(e*e+a*a),0,n,i,o,1]}function mc(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Ep(t){let e=[t[0],t[4],t[8],0,t[1],t[5],t[9],0,t[2],t[6],t[10],0,0,0,0,1];for(let a=0;a<3;a+=1)e[12+a]=-(e[a]*t[12]+e[4+a]*t[13]+e[8+a]*t[14]);return e}function zr(t,e){return e>0?Math.round(t/e)*e:t}function yc(t,e){let a=e[0]**2+e[1]**2;return a<1e-9?0:(t[0]*e[0]+t[1]*e[1])/a}function xc(t,e,a){let s=Math.atan2(e[1]-t[1],e[0]-t[0]),n=Math.atan2(a[1]-t[1],a[0]-t[0])-s;for(;n>Math.PI;)n-=2*Math.PI;for(;n<-Math.PI;)n+=2*Math.PI;return n}function vc(t,e,a){return oa(t,e)>=0?-a:a}function wc(t){return Gr.map(e=>Gs(t.rotation,e))}function Ec(t,e,a){return{translationMm:t.translationMm.map((s,r)=>s+e[r]*a),rotation:[...t.rotation]}}function Tc(t,e,a,s){let r=Xr(e,a),n=t.translationMm.map((o,c)=>o-s[c]);return{translationMm:Gs(r,n).map((o,c)=>o+s[c]),rotation:Ca(r,t.rotation)}}function kc(t,e){if(e==null)return null;let a=`/${String(e).split("/")[1]||""}`;return(t?.occurrences||[]).find(s=>s.path===a&&s.depth===1)??null}function Mc(t,e,a){let s=t.occurrences.find(o=>o.path===e);if(!s||s.depth!==1)return t;let r=wp(a),n=mc(r,Ep(s.worldMatrix)),i=`${e}/`;return{...t,occurrences:t.occurrences.map(o=>o.path===e?{...o,pose:{...St(a),source:"manual"},worldMatrix:r}:o.path.startsWith(i)?{...o,worldMatrix:mc(n,o.worldMatrix)}:o)}}function Ic(t){let e=Math.abs(t[0])<.9?[1,0,0]:[0,1,0];return $e(st(t,e))}var Tp=[0,0,0,1,1,1],Os=class t{static async create(e){return new t(await Dt.create(e))}constructor(e){this.host=e,this.canvas=e.canvas,this.device=e.device,e.alwaysInstanced=!0,e.setOccurrences([]),this.assets=new Map,this.order=[],this.frameStats={triangles:0,draws:0}}asset(e){let a=this.assets.get(e);return a||(a=new Dt(this.canvas,this.device,{shareFrom:this.host}),this.assets.set(e,a)),a}standIn(e,a){let s=this.asset(e);return s.standIn||(s.standIn=!0,s.setBoardBounds(Tp),s.setLodOverride(gi)),s.boxColor=[...a],s}removeAsset(e){let a=this.assets.get(e);a&&(a.dispose(),this.assets.delete(e))}get renderers(){return this.order.map(e=>this.assets.get(e)).filter(Boolean)}setOccurrences(e){this.order=[...e.keys()].filter(s=>this.assets.has(s));for(let[s,r]of this.assets)e.has(s)||r.setOccurrences([]);for(let s of this.order)this.assets.get(s).setOccurrences(e.get(s));let a=0;for(let s of this.renderers)s.occurrenceBase=a,a+=s.occurrenceCount;this.occurrenceCount=a}locate(e){for(let a of this.renderers){let s=e-a.occurrenceBase;if(s>=0&&s<a.occurrenceCount)return{renderer:a,local:s}}return null}keyOf(e){let a=this.locate(e);return a?a.renderer.occurrenceKeys[a.local]??null:null}setSelectedOccurrence(e){let a=e>=0?this.locate(e):null;for(let s of this.renderers)s.selectedOccurrence=!s.standIn&&a?.renderer===s?a.local:-1}resize(){this.host.resize()}render(e,a){let s=this.host;s.resize();let r=this.renderers.filter(u=>u.occurrenceCount>0),n=this.device.createCommandEncoder(),i=r.filter(u=>u.encodeCull(n,e)),o=n.beginRenderPass({colorAttachments:[{view:s.context.getCurrentTexture().createView(),clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:s.depthAttachment()});Rc(o,e.viewport,this.canvas);let c=0,d=0;for(let u of r){let b=u.encodeDraws(o,e,a(u));c+=b.triangles,d+=b.draws}o.end(),this.device.queue.submit([n.finish()]);for(let u of i)u.readCullCounts();this.frameStats={triangles:Math.round(c),draws:d}}pick(e,a,s,r){let n=this.host.pickSerial.then(()=>this.performPick(e,a,s,r));return this.host.pickSerial=n.catch(()=>0),n}async performPick(e,a,s,r){let n=this.host;n.resize();let i=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),o=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s))),c=this.device.createCommandEncoder(),d=c.beginRenderPass({colorAttachments:[{view:n.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:n.depthAttachment()});Rc(d,e.viewport,this.canvas);for(let w of this.renderers)w.occurrenceCount>0&&w.encodePick(d,e,r(w));d.end();let u=await n.readPick(c,i,o),b=u.occurrenceIndex>=0?this.locate(u.occurrenceIndex):null;return{...u,occurrenceKey:b?b.renderer.occurrenceKeys[b.local]??null:null,renderer:b?.renderer||null,standIn:!!b?.renderer?.standIn}}gpuMemoryBytes(){let e=0;for(let a of this.renderers)e+=a.gpuMemoryBytes();return e-Math.max(0,this.renderers.length-1)*this.canvas.width*this.canvas.height*12}cullCounts(){let e={full:0,board:0,box:0,culled:0};for(let a of this.renderers)if(a.occurrenceCount)for(let s of Object.keys(e))e[s]+=a.cullCounts[s]||0;return e}dispose(){for(let e of[...this.assets.keys()])this.removeAsset(e);this.host.dispose(),this.host.context?.unconfigure?.(),this.device.destroy?.()}};function Rc(t,e,a){let s=Math.max(0,Math.min(a.width-1,Math.floor(e.x))),r=Math.max(0,Math.min(a.height-1,Math.floor(e.y))),n=Math.max(1,Math.min(a.width-s,Math.floor(e.width))),i=Math.max(1,Math.min(a.height-r,Math.floor(e.height)));t.setViewport(s,r,n,i,0,1),t.setScissorRect(s,r,n,i)}var kp="prism.system_scene.a0",Aa=.001,Mp=6,Ip=5e3,Sc=1.5*1024*1024*1024,Hr=Object.freeze({restricted:{color:[.55,.57,.6,1],label:"Restricted"},loading:{color:[.7,.76,.82,1],label:"Loading\u2026"},building:{color:[.62,.72,.84,1],label:"Building 3D view\u2026"},missing:{color:[.78,.76,.7,1],label:"No 3D view"},failed:{color:[.86,.6,.56,1],label:"3D view failed"},unknown:{color:[.78,.76,.7,1],label:""}}),Fc=Object.freeze([Aa,0,0,0,0,Aa,0,0,0,0,Aa,0,0,0,0,1]);function _a(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Rp([t,e,a]){return[1,0,0,0,0,1,0,0,0,0,1,0,t,e,a,1]}function Sp([t,e,a]){return[t,0,0,0,0,e,0,0,0,0,a,0,0,0,0,1]}function Ap(t,e){return _a(Fc,_a(t,e))}function _p(t,e){let a=e.minMm,s=e.maxMm.map((r,n)=>Math.max(r-a[n],.2));return _a(Fc,_a(t,_a(Rp(a),Sp(s))))}function Np(t,e,a){return t.restricted?"restricted":!t.assetId||!e?"missing":a==="loaded"?null:a==="failed"?"failed":e.status==="ready"?e.bundleUrl&&e.bundleToBoard?"loading":"building":Hr[e.status]?e.status:"unknown"}function Ac(t){return(t?.occurrences||[]).filter(e=>e.kind==="board"||e.restricted)}var Fp=90,_c=["#e5484d","#30a46c","#3e63dd"],Vr=["X","Y","Z"];function Nc(t,e){if(!t||!e)return!1;let a=St(t),s=St(e),r=[...a.translationMm,...a.rotation],n=[...s.translationMm,...s.rotation];return r.every((i,o)=>Math.abs(i-n[o])<1e-6)}var Ps=class{constructor({canvas:e,labelsEl:a,statsEl:s,gizmoEl:r=null,helpEl:n=null,onSelectionChange:i=()=>{},onStatus:o=()=>{},onMove:c=()=>{},onEmphasis:d=()=>{},onIsolation:u=()=>{}}){this.canvas=e,this.labelsEl=a,this.statsEl=s,this.gizmoEl=r,this.helpEl=n,this.onSelectionChange=i,this.onStatus=o,this.onMove=c,this.onEmphasis=d,this.onIsolation=u,this.emphasisSets=[],this.emphasisReport=[],this.isolateNets=!1,this.move={allowed:!1,enabled:!1,space:"world",target:null,preview:null,drag:null},this.baseDescriptor=null,this.descriptor=null,this.timing={descriptorAt:null,boardsDrawnAt:null},this.assets=new Map,this.placed=[],this.selection=null,this.gpuBudgetBytes=Sc,this.showStats=!1,this.showLabels=!0,this.disposed=!1,this.framed=!1,this.frameSamples=[],this.lastFrame=performance.now(),this.cache=zt.open()}async init(){this.scene=await Os.create(this.canvas),this.camera=new Vt([-.1,-.1,-.01,.1,.1,.01]),this.bindInteractions(),this.loop=e=>{this.disposed||(this.frame(e),this.frameId=requestAnimationFrame(this.loop))},this.frameId=requestAnimationFrame(this.loop)}dispose(){this.disposed=!0,cancelAnimationFrame(this.frameId),this.unbind?.(),this.scene?.dispose(),this.scene=null}setDescriptor(e){if(e?.schema!==kp)throw new Error(`Unsupported system scene schema: ${e?.schema||"missing"}`);this.baseDescriptor=e,this.timing.descriptorAt??=performance.now();let a=this.move.target?e.occurrences.find(r=>r.path===this.move.target):null;a?!this.move.drag&&Nc(this.move.preview,a.pose)&&(this.move.preview=null):this.dropTarget(),e=this.shownDescriptor(),this.descriptor=e;let s=new Set;for(let r of e.assets||[]){s.add(r.assetId);let n=this.assets.get(r.assetId);if(n&&n.bundleUrl===r.bundleUrl&&n.state!=="failed"){n.descriptor=r;continue}n&&this.dropAsset(r.assetId);let i={descriptor:r,bundleUrl:r.bundleUrl,state:"waiting",componentTier:"idle",componentEntries:[],componentsWantedAt:0};this.assets.set(r.assetId,i),r.status==="ready"&&r.bundleUrl&&r.bundleToBoard&&this.loadAsset(r.assetId,i)}for(let r of[...this.assets.keys()])s.has(r)||this.dropAsset(r);this.place(),this.move.enabled&&this.emitMove("sync")}dropAsset(e){this.assets.get(e)?.abort?.abort(),this.assets.delete(e),this.scene?.removeAsset(e)}async loadAsset(e,a){a.state="loading",a.abort=new AbortController;let s=a.abort.signal,r=()=>!this.disposed&&this.assets.get(e)===a&&!s.aborted;try{let n=new URL(a.bundleUrl,document.baseURI).toString(),i=await fetch(n,{cache:"no-store",signal:s});if(!i.ok)throw new Error(`Failed to load ${n}: ${i.status}`);let o=await i.json();if(!r())return;let c=o.readiness?.revision||a.descriptor.sourceRevisionKey||"",d=ia(o)&&this.cache.enabled?this.cache:null;a.cache=d;let u=async y=>{if(d)return d.fetchJson(y,{signal:s});let E=await fetch(y,{cache:"no-store",signal:s});if(!E.ok)throw new Error(`Failed to load ${y}: ${E.status}`);return E.json()},b=new URL(o.topology||"topology.json",n).toString(),w=u(b).then(y=>y?.board?.stackup?.copper_finish??null,()=>null),v=new URL(o.semantic_geometry||"semantic_geometry.json",n).toString(),h=Ba(await u(v),n,o,c),l=h.assets?.scene_manifest||h.semantic_gltf?.path;if(!l)throw new Error("The bundle has no scene manifest");a.manifestUrl=new URL(l,n).toString();let m=await u(a.manifestUrl);if(!r())return;a.geometry=h,a.manifest=m,a.copperLayers=(m.layers||[]).filter(y=>y.role==="copper"||String(y.name).endsWith(".Cu")),a.visibleLayers=new Set(a.copperLayers.map(y=>Number(y.id))),a.componentFeatures=new Map((m.components||[]).map(y=>[y.designator,y])),a.features=new Map;for(let y of m.objectFeatures||[])a.features.set(Number(y.id),y);for(let y of m.components||[])a.features.set(Number(y.featureId),{...y,kind:"component"});a.fetchBytes=d?y=>d.fetchBytes(y,{signal:s}):void 0;let f=this.scene.asset(e);f.setBarrels(m.barrels||[]);let p=null;if(f.setBarrelColor([...rt.copper.slice(0,3),.78]),h.assets?.base_board_glb){let y=h.assets.soldermask_glb,[E,T]=await Promise.all([Ke(h.assets.base_board_glb,{defaultFeatureId:0,fetchBytes:a.fetchBytes}),y?Ke(y,{defaultFeatureId:0,fetchBytes:a.fetchBytes}).catch(M=>(console.warn(`System scene: solder mask of ${e} failed to load`,M),null)):null]);if(!r())return;let I=[...E.primitives.filter(M=>{let R=Ht(M);return R!=="pad"&&!(T&&R==="soldermask")}),...T?.primitives||[]];for(let M of Nt(I,Ht))f.addPrimitive(M,{kind:"board",boardRole:M.groupKey,layerId:M.groupKey==="paste"?La(M,a.copperLayers):0,material:M.material,color:M.material.baseColor});p=Ft(I.map(M=>M.bounds))}if(a.finishColor=ca(await w),!r())return;f.setBarrelColor([...a.finishColor.slice(0,3),.78]),a.boardBounds=p||Xt(m.bbox),f.setBoardBounds(a.boardBounds),a.state="loaded",this.place(),await this.loadTiles(a,f,r),r()&&this.emitStatus()}catch(n){if(!r())return;console.warn(`System scene: asset ${e} failed to load`,n),a.state="failed",a.error=n?.message||String(n),this.scene.removeAsset(e),this.place()}}async loadTiles(e,a,s){let r=[...e.manifest.tiles||[]],n=new Map((e.manifest.layers||[]).map(o=>[Number(o.id),o])),i=async()=>{for(;r.length&&s();){let o=r.shift();try{let c=new URL(o.path,e.manifestUrl).toString(),d=await Ke(c,{fetchBytes:e.fetchBytes,fetchCache:"no-store"}).catch(()=>Ke(c,{fetchBytes:e.fetchBytes,fetchCache:"no-store"}));if(!s())return;let u=Number(o.layerId),b=n.get(u);for(let w of d.primitives)a.addPrimitive(w,{kind:"copper",tileId:o.id,layerId:u,innerCopper:Ua(u,e.copperLayers),color:la(b,e.copperLayers)?e.finishColor||ca(null):rt.copper,stencilMark:la(b,e.copperLayers),baseZ:Number(b?.z_mm||0)/1e3,material:{baseColor:[1,1,1,1],metallic:.78,roughness:.32}})}catch(c){s()&&console.warn(`System scene: tile ${o.id} failed to load`,c)}}};await Promise.all(Array.from({length:Mp},i))}async loadComponents(e,a){let s=a.geometry?.assets?.components_glb;if(!(!s||a.componentTier!=="idle")){a.componentTier="loading";try{let r=await Ke(s,{componentFeatures:a.componentFeatures,fetchBytes:a.fetchBytes});if(this.disposed||this.assets.get(e)!==a||!this.scene?.assets.has(e))return;let n=this.scene.asset(e);a.componentEntries=Nt(r.primitives).map(i=>n.addPrimitive(i,{kind:"component",layerId:0,material:i.material,color:i.material.baseColor})),a.componentTier="loaded"}catch(r){a.componentTier="idle",console.warn(`System scene: components of ${e} failed to load`,r)}}}place({relabel:e=!0}={}){if(!this.scene||!this.descriptor)return;let a=new Map((this.descriptor.assets||[]).map(i=>[i.assetId,i])),s=new Map,r=[];for(let i of Ac(this.descriptor)){let o=i.assetId?a.get(i.assetId):null,c=i.assetId?this.assets.get(i.assetId):null,d=Np(i,o,c?.state),u,b,w;if(!d)u=i.assetId,b=Ap(i.worldMatrix,o.bundleToBoard),w=Ot(b,c.boardBounds);else{if(!i.boundsMm)continue;u=`stand-in:${d}`,this.scene.standIn(u,Hr[d].color),b=_p(i.worldMatrix,i.boundsMm),w=Ot(b,[0,0,0,1,1,1])}s.has(u)||s.set(u,[]),s.get(u).push({matrix:b,key:i.path}),r.push({occurrence:i,rendererId:u,matrix:b,worldBounds:w,standIn:d})}for(let i of this.scene.assets.keys())s.has(i)||s.set(i,[]);this.scene.setOccurrences(s),this.groups=s;let n=this.placedByKey;if(this.placed=r,this.placedByKey=new Map(r.map(i=>[i.occurrence.path,i])),e||!n)this.renderLabels();else for(let i of r)i.label=n.get(i.occurrence.path)?.label;this.sceneBounds=Ft(r.map(i=>i.worldBounds)),this.sceneBounds&&(this.camera.sceneRadius=_t(this.sceneBounds),this.framed||(this.camera.frame(this.sceneBounds),this.camera.snap(),this.framed=!0)),this.applyEmphasis(),this.selection&&!this.placedByKey.has(this.selection.key)?this.select(null):this.selection&&this.select(this.selection.key,this.selection.featureId,{quiet:!0}),this.emitStatus()}setNetEmphasis(e){return this.emphasisSets=(Array.isArray(e)?e:[]).map((a,s)=>{let r=a?.color??qs[s%qs.length],n=cn(r);return{key:String(a?.key??s),mark:n,color:`#${(n&16777215).toString(16).padStart(6,"0")}`,members:(Array.isArray(a?.members)?a.members:[]).filter(i=>i&&typeof i.occurrence=="string"&&typeof i.net=="string")}}),this.applyEmphasis()}frameNetEmphasis(e=null,a=null){let s=[];for(let[n,i]of this.emphasisBounds||[])if(!(e!=null&&n!==String(e)))for(let o of i)(a==null||o.occurrence===a)&&s.push(o.box);let r=Ft(s);return r?(this.camera.frame(r),!0):!1}litFeature(e,a){let s=this.placedByKey?.get(e),r=s&&!s.standIn?this.assets.get(s.rendererId):null,n=Number(r?.features.get(Number(a))?.netId)||0;if(!n)return!1;let i=this.scene.assets.get(s.rendererId),o=i?.occurrenceKeys.indexOf(e)??-1;return!!(o>=0&&i.occurrenceEmphasis?.[o]?.has(n))}setNetIsolation(e){let a=!!e&&this.emphasisSets.length>0;return a!==this.isolateNets&&(this.isolateNets=a,this.onIsolation(a)),this.isolateNets}netIdOf(e,a){if(e.netIds||(e.netIds=new Map),!e.netIds.has(a)){let s=Number(jt(e.manifest?.nets,a)?.id);e.netIds.set(a,Number.isInteger(s)&&s>0?s:0)}return e.netIds.get(a)}applyEmphasis(){if(!this.scene||!this.groups)return[];let e=new Map;for(let[i,o]of this.groups)e.set(i,o.map(()=>null));let a=new Map;for(let i of this.groups.values())i.forEach((o,c)=>a.set(o.key,c));this.emphasisBounds=new Map;let s=this.emphasisSets.map(i=>{let o={key:i.key,color:i.color,lit:0,unresolved:[]},c=[];this.emphasisBounds.set(i.key,c);for(let d of i.members){let u=this.placedByKey?.get(d.occurrence),b=u&&!u.standIn?this.assets.get(u.rendererId):null;if(!b?.manifest){let m=u?u.standIn==="loading"||u.standIn==="building"?"loading":u.standIn==="restricted"?"restricted":"not-drawn":"not-drawn";o.unresolved.push({occurrence:d.occurrence,net:d.net,reason:m});continue}let w=this.netIdOf(b,d.net);if(!w){o.unresolved.push({occurrence:d.occurrence,net:d.net,reason:"unknown-net"});continue}let v=e.get(u.rendererId),h=a.get(d.occurrence);if(!v||h==null)continue;v[h]=v[h]||new Map,v[h].has(w)||v[h].set(w,i.mark),o.lit+=1;let l=qt(jp(b,w)?.boundsMm);l&&c.push({occurrence:d.occurrence,box:Ot(u.matrix,l)})}return o}),r=this.emphasisSets.length>0;r||this.setNetIsolation(!1);for(let[i,o]of this.scene.assets)o.standIn||(o.setOccurrenceEmphasis(r&&e.get(i)||null,{dimCopper:r}),o.setInnerCopperAtFull(!r));let n=JSON.stringify(s)!==JSON.stringify(this.emphasisReport);return this.emphasisReport=s,n&&this.onEmphasis(s),s}status(){let e={boards:0,loaded:0,loading:0,restricted:0,building:0,missing:0,failed:0,unknown:0,unplaced:0};for(let a of Ac(this.descriptor)){e.boards+=1;let s=this.placedByKey?.get(a.path);s?s.standIn?e[s.standIn]!==void 0&&(e[s.standIn]+=1):e.loaded+=1:e.unplaced+=1}return e}emitStatus(){this.onStatus(this.status())}frameAll(){this.sceneBounds&&this.camera.frame(this.sceneBounds)}frameOccurrence(e){let a=this.placedByKey?.get(String(e));a&&this.camera.frame(a.worldBounds)}panel(){return{layerId:0,viewport:{x:0,y:0,width:this.canvas.width,height:this.canvas.height},matrix:this.camera.matrix(this.canvas.width,this.canvas.height,!1),lod:this.cameraLod()}}cameraLod(){let{back:e}=this.camera.basis();return{eye:Fe(this.camera.focus,ke(e,this.camera.distance)),orthographic:!1,pixelScale:this.canvas.height/2/Math.tan(this.camera.fov/2)}}optionsFor(e){return{activeNetId:0,selectedFeatureId:this.selection&&this.selection.renderer===e&&this.selection.featureId||0,time:performance.now()/1e3,visibleLayers:this.assetFor(e)?.visibleLayers||new Set,showBoard:!this.emphasisSets.length,showComponents:!this.emphasisSets.length,componentOpacity:1,boardOpacity:1,isolateNet:this.isolateNets&&this.emphasisSets.length>0}}assetFor(e){for(let[a,s]of this.assets)if(this.scene.assets.get(a)===e)return s;return null}frame(e){let a=performance.now(),s=Math.min(.05,(e-this.lastFrame)/1e3),r=e-this.lastFrame;this.lastFrame=e,this.camera.update(s),this.scene.resize(),this.currentPanel=this.panel(),this.scene.render(this.currentPanel,n=>this.optionsFor(n)),this.manageTiers(e),this.updateLabels(),this.updateGizmo(),this.timing.boardsDrawnAt==null&&this.allReadyBoardsDrawn()&&(this.timing.boardsDrawnAt=performance.now()),this.frameSamples.push([r,performance.now()-a]),this.frameSamples.length>240&&this.frameSamples.shift(),this.showStats&&e-(this.statsAt||0)>250&&(this.statsAt=e,this.renderStats())}allReadyBoardsDrawn(){if(!this.placed.length)return!1;let e=0;for(let a of this.placed)if(!a.standIn)e+=1;else if(a.standIn==="loading")return!1;return e>0}manageTiers(e){if(e-(this.tiersAt||0)<250)return;this.tiersAt=e;for(let[s,r]of this.assets){let n=this.scene.assets.get(s);r.state!=="loaded"||!n||n.cullCounts.full>0&&(r.componentsWantedAt=e,r.componentTier==="idle"&&this.loadComponents(s,r))}let a=this.scene.gpuMemoryBytes();if(!(a<=this.gpuBudgetBytes)){for(let[s,r]of this.assets)if(!(r.componentTier!=="loaded"||e-r.componentsWantedAt<=Ip)&&(this.scene.assets.get(s)?.removeEntries(r.componentEntries),r.componentEntries=[],r.componentTier="idle",r.componentEvictions=(r.componentEvictions||0)+1,a=this.scene.gpuMemoryBytes(),a<=this.gpuBudgetBytes))break}}renderLabels(){this.labelsEl&&this.labelsEl.replaceChildren(...this.placed.map(e=>{let a=document.createElement("div");a.className=`scene-label${e.standIn?` stand-in ${e.standIn}`:""}`;let s=document.createElement("strong");s.textContent=e.occurrence.displayPath||e.occurrence.labels?.join(" / ")||e.occurrence.path,a.append(s);let r=e.standIn?Hr[e.standIn]?.label:"";if(r){let n=document.createElement("span");n.textContent=r,a.append(n)}return a.dataset.key=e.occurrence.path,e.label=a,a}))}updateLabels(){if(!this.labelsEl||!this.currentPanel||(this.labelsEl.hidden=!this.showLabels,!this.showLabels))return;let e=this.canvas.getBoundingClientRect(),a=e.width/Math.max(1,this.canvas.width),s=e.height/Math.max(1,this.canvas.height);for(let r of this.placed){if(!r.label)continue;let[n,i,,o,c,d]=r.worldBounds,u=Pt(this.currentPanel.matrix,[(n+o)/2,(i+c)/2,d],this.currentPanel.viewport),b=u&&u.x>=0&&u.y>=0&&u.x<=this.canvas.width&&u.y<=this.canvas.height;r.label.hidden=!b,b&&(r.label.style.transform=`translate(${(u.x*a).toFixed(1)}px, ${(u.y*s).toFixed(1)}px) translate(-50%, -100%)`),r.label.classList.toggle("selected",this.selection?.key===r.occurrence.path)}}async pickAt(e,a){if(!this.currentPanel||!this.scene)return null;let s=this.canvas.getBoundingClientRect(),r=await this.scene.pick(this.currentPanel,(e-s.left)*this.canvas.width/s.width,(a-s.top)*this.canvas.height/s.height,i=>this.optionsFor(i)),n=r.occurrenceKey!=null?this.placedByKey.get(r.occurrenceKey):null;return{...r,renderer:void 0,occurrence:n?.occurrence||null,selection:n?this.describe(n,r.featureId):null}}describe(e,a){let s=e.occurrence,r={occurrence:s.path,displayPath:s.displayPath,instanceId:s.instanceId,restricted:!!s.restricted,standIn:e.standIn||null},n=e.standIn?null:this.assets.get(s.assetId),i=a&&n?n.features.get(Number(a)):null;if(!i)return{kind:"board",...r};let o=i.designator||i.reference||i.componentRef||null;return{kind:i.kind==="component"?"component":"feature",...r,featureId:Number(a),reference:o}}select(e,a=0,{quiet:s=!1}={}){let r=e!=null?this.placedByKey?.get(String(e)):null;if(!r){let d=!!this.selection;return this.selection=null,this.scene?.setSelectedOccurrence(-1),d&&!s&&this.onSelectionChange(null),this.move.enabled&&!s&&this.retarget(),null}let n=this.scene.assets.get(r.rendererId),i=n.occurrenceKeys.indexOf(r.occurrence.path),o=n.occurrenceBase+i;this.selection={key:r.occurrence.path,featureId:r.standIn?0:a,renderer:n,index:o},this.scene.setSelectedOccurrence(r.standIn?-1:o);let c=this.describe(r,this.selection.featureId);return s||this.onSelectionChange(c),this.move.enabled&&this.retarget(),c}async clickAt(e,a){let s=await this.pickAt(e,a);if(!s?.occurrence)return this.select(null);if(this.isolateNets&&!this.litFeature(s.occurrence.path,s.featureId))return this.select(null);let r=s.selection?.kind==="component"?s.featureId:0;return this.select(s.occurrence.path,r)}projectPoint(e,a){let s=this.placedByKey?.get(String(e));if(!s||!this.currentPanel)return null;let r=Pt(this.currentPanel.matrix,ba(s.matrix??Yt,a),this.currentPanel.viewport);if(!r)return null;let n=this.canvas.getBoundingClientRect();return{x:n.left+r.x*n.width/this.canvas.width,y:n.top+r.y*n.height/this.canvas.height}}projectOccurrence(e){let a=this.placedByKey?.get(String(e));if(!a||!this.currentPanel)return null;let[s,r,,n,i,o]=a.worldBounds,c=Pt(this.currentPanel.matrix,[(s+n)/2,(r+i)/2,o],this.currentPanel.viewport);if(!c)return null;let d=this.canvas.getBoundingClientRect();return{x:d.left+c.x*d.width/this.canvas.width,y:d.top+c.y*d.height/this.canvas.height}}shownDescriptor(){let e=this.baseDescriptor;return!e||!this.move.target||!this.move.preview?e:Mc(e,this.move.target,this.move.preview)}refreshPreview(){this.baseDescriptor&&(this.descriptor=this.shownDescriptor(),this.place({relabel:!1}))}targetOccurrence(){return this.move.target?this.baseDescriptor?.occurrences.find(e=>e.path===this.move.target)??null:null}moveState(){let e=this.targetOccurrence();return{allowed:this.move.allowed,enabled:this.move.enabled,space:this.move.space,dragging:!!this.move.drag,target:e?{occurrence:e.path,instanceId:e.instanceId,displayPath:e.displayPath,kind:e.kind,restricted:!!e.restricted,pose:St(this.move.preview??e.pose),source:this.move.preview?"manual":e.pose?.source??"default",unsaved:!!this.move.preview}:null}}emitMove(e){this.onMove({phase:e,...this.moveState()})}setMoveAllowed(e){this.move.allowed=!!e,!this.move.allowed&&this.move.enabled&&this.setMoveMode(!1)}setMoveMode(e){let a=!!e&&this.move.allowed;a!==this.move.enabled&&(a||this.dropTarget(),this.move.enabled=a,a&&this.retarget({quiet:!0}),this.emitMove("mode"))}setMoveSpace(e){this.move.space=e==="local"?"local":"world",this.emitMove("mode")}retarget({quiet:e=!1}={}){let a=this.move.enabled?kc(this.baseDescriptor,this.selection?.key)?.path??null:null;a!==this.move.target&&(this.dropTarget(),this.move.target=a,e||this.emitMove("target"))}dropTarget(){let e=!!this.move.preview;this.move.drag=null,this.move.preview=null,this.move.target=null,e&&this.refreshPreview()}previewPose(e){this.move.target&&(this.move.preview=e?St(e):null,this.refreshPreview(),this.emitMove("preview"))}cancelMove(){!this.move.preview&&!this.move.drag||(this.move.drag=null,this.move.preview=null,this.refreshPreview(),this.emitMove("cancel"))}targetPivotMm(){let e=`${this.move.target}/`,a=this.placed.filter(r=>r.occurrence.path===this.move.target||r.occurrence.path.startsWith(e)).map(r=>r.worldBounds),s=Ft(a);return s?[0,1,2].map(r=>(s[r]+s[r+3])/2/Aa):null}screenOf(e){let a=Pt(this.currentPanel.matrix,ke(e,Aa),this.currentPanel.viewport);if(!a)return null;let s=this.canvas.getBoundingClientRect();return[a.x*s.width/this.canvas.width,a.y*s.height/this.canvas.height]}updateGizmo(){let e=this.gizmoEl;if(!e)return;let a=this.targetOccurrence(),s=this.move.enabled&&a&&this.currentPanel?this.targetPivotMm():null,r=s?this.screenOf(s):null;if(!r){e.toggleAttribute("hidden",!0),this.gizmo=null;return}e.toggleAttribute("hidden",!1),e.firstChild||this.buildGizmo(e);let{right:n,back:i}=this.camera.basis(),o=this.screenOf(Fe(s,n)),c=o?Math.hypot(o[0]-r[0],o[1]-r[1]):0;if(!(c>1e-6)){e.toggleAttribute("hidden",!0);return}let d=Fp/c,u=this.move.preview??a.pose,b=this.move.space==="local"?wc(u):Gr,w=[];b.forEach((h,l)=>{let m=this.screenOf(Fe(s,ke(h,d))),f=e.querySelector(`[data-part="t${l}"]`),p=m&&Math.hypot(m[0]-r[0],m[1]-r[1])>12;f.style.display=p?"":"none",p&&(f.querySelector("line").setAttribute("x1",r[0]),f.querySelector("line").setAttribute("y1",r[1]),f.querySelector("line").setAttribute("x2",m[0]),f.querySelector("line").setAttribute("y2",m[1]),f.querySelector("circle").setAttribute("cx",m[0]),f.querySelector("circle").setAttribute("cy",m[1]),f.querySelector("text").setAttribute("x",m[0]+9),f.querySelector("text").setAttribute("y",m[1]-7));let y=Ic(h),E=st(h,y),T=[];for(let I=0;I<=64;I+=1){let M=I/64*Math.PI*2,R=this.screenOf(Fe(s,ke(Fe(ke(y,Math.cos(M)),ke(E,Math.sin(M))),d*.7)));R&&T.push(`${R[0].toFixed(1)},${R[1].toFixed(1)}`)}e.querySelector(`[data-part="r${l}"]`).setAttribute("points",T.join(" ")),w.push({axis:h,pxPerMm:m?[(m[0]-r[0])/d,(m[1]-r[1])/d]:[0,0]})});let v=e.querySelector('[data-part="pivot"]');v.setAttribute("cx",r[0]),v.setAttribute("cy",r[1]),this.gizmo={center:r,pivot:s,handles:w,back:i}}buildGizmo(e){let a="http://www.w3.org/2000/svg",s=(r,n)=>{let i=document.createElementNS(a,r);for(let[o,c]of Object.entries(n))i.setAttribute(o,c);return i};_c.forEach((r,n)=>{let i=s("polyline",{"data-part":`r${n}`,class:"ring",stroke:r,fill:"none"});i.append(s("title",{})),i.firstChild.textContent=`Rotate about ${Vr[n]}`,e.append(i)}),_c.forEach((r,n)=>{let i=s("g",{"data-part":`t${n}`,class:"arrow",stroke:r,fill:r}),o=s("title",{});o.textContent=`Move along ${Vr[n]}`;let c=s("text",{stroke:"none"});c.textContent=Vr[n],i.append(o,s("line",{}),s("circle",{r:6}),c),e.append(i)}),e.append(s("circle",{"data-part":"pivot",r:4,class:"pivot"})),e.append(s("text",{"data-part":"readout",class:"readout"})),e.addEventListener("pointerdown",r=>this.startGizmoDrag(r)),e.addEventListener("pointermove",r=>this.moveGizmoDrag(r)),e.addEventListener("pointerup",r=>this.endGizmoDrag(r)),e.addEventListener("pointercancel",()=>this.abortGizmoDrag())}startGizmoDrag(e){let a=e.target.closest?.("[data-part]")?.dataset.part;if(!a||!this.gizmo||!/^[tr][012]$/.test(a))return;e.preventDefault(),e.stopPropagation();let s=this.targetOccurrence(),r=this.gizmoEl.getBoundingClientRect(),n=this.gizmo.handles[Number(a[1])];this.move.drag={kind:a[0]==="t"?"translate":"rotate",handle:n,start:[e.clientX-r.left,e.clientY-r.top],startPose:St(this.move.preview??s.pose),hadPreview:!!this.move.preview,center:this.gizmo.center,pivot:this.gizmo.pivot,back:this.gizmo.back,changed:!1};try{this.gizmoEl.setPointerCapture(e.pointerId)}catch{}this.canvas.focus({preventScroll:!0})}moveGizmoDrag(e){let a=this.move.drag;if(!a)return;let s=this.gizmoEl.getBoundingClientRect(),r=[e.clientX-s.left,e.clientY-s.top],n=e.shiftKey,i,o;if(a.kind==="translate"){let d=yc([r[0]-a.start[0],r[1]-a.start[1]],a.handle.pxPerMm),u=zr(d,n?Sa.fineMm:Sa.mm);i=Ec(a.startPose,a.handle.axis,u),o=`${u>=0?"+":""}${u.toFixed(n?1:0)} mm`}else{let d=vc(a.handle.axis,a.back,xc(a.center,a.start,r))*180/Math.PI,u=zr(d,n?Sa.fineDeg:Sa.deg);i=Tc(a.startPose,a.handle.axis,u*Math.PI/180,a.pivot),o=`${u>=0?"+":""}${u.toFixed(0)}\xB0`}a.changed=a.changed||!Nc(i,a.startPose),this.move.preview=St(i);let c=this.gizmoEl.querySelector('[data-part="readout"]');c.textContent=o,c.setAttribute("x",r[0]+14),c.setAttribute("y",r[1]-10),this.refreshPreview(),this.emitMove("preview")}endGizmoDrag(e){let a=this.move.drag;a&&(this.gizmoEl.hasPointerCapture?.(e.pointerId)&&this.gizmoEl.releasePointerCapture(e.pointerId),this.move.drag=null,this.gizmoEl.querySelector('[data-part="readout"]').textContent="",a.changed?this.emitMove("commit"):a.hadPreview||this.cancelMove())}abortGizmoDrag(){let e=this.move.drag;return e?(this.move.drag=null,this.move.preview=e.hadPreview?e.startPose:null,this.gizmoEl.querySelector('[data-part="readout"]').textContent="",this.refreshPreview(),this.emitMove("cancel"),!0):!1}setHelpVisible(e){this.helpEl&&(this.helpEl.hidden=!e)}bindInteractions(){let e=this.canvas,a={active:!1,x:0,y:0,startX:0,startY:0,mode:"orbit"},s=u=>{a.active=!0,a.x=a.startX=u.clientX,a.y=a.startY=u.clientY,a.mode=u.shiftKey||u.button!==0?"pan":"orbit";try{e.setPointerCapture(u.pointerId)}catch{}},r=u=>{if(!a.active)return;let b=u.clientX-a.x,w=u.clientY-a.y;a.x=u.clientX,a.y=u.clientY,a.mode==="pan"?this.camera.pan(b,w,e.clientHeight,!1):this.camera.orbit(b,w)},n=u=>{a.active=!1,e.hasPointerCapture(u.pointerId)&&e.releasePointerCapture(u.pointerId),Math.hypot(u.clientX-a.startX,u.clientY-a.startY)<3&&this.clickAt(u.clientX,u.clientY)},i=async u=>{let b=await this.clickAt(u.clientX,u.clientY);b&&this.frameOccurrence(b.occurrence)},o=u=>{u.preventDefault(),Math.abs(u.deltaX)>Math.abs(u.deltaY)*.4?this.camera.pan(-u.deltaX,0,e.clientHeight,!1):this.camera.dolly(u.deltaY,!1)},c=u=>{if(u.target===e){if(u.key==="Escape")this.helpEl&&!this.helpEl.hidden?this.setHelpVisible(!1):this.abortGizmoDrag()||(this.move.preview?this.cancelMove():this.move.enabled?this.setMoveMode(!1):this.select(null));else if((u.key==="m"||u.key==="M")&&this.move.allowed)this.setMoveMode(!this.move.enabled);else if((u.key==="l"||u.key==="L")&&this.move.enabled)this.setMoveSpace(this.move.space==="world"?"local":"world");else if(u.key==="Enter"&&this.move.preview&&!this.move.drag)this.emitMove("commit");else if(u.key==="?"||u.key==="/"&&u.shiftKey)this.setHelpVisible(!!this.helpEl?.hidden);else if(u.key==="f"||u.key==="F")this.selection?this.frameOccurrence(this.selection.key):this.frameAll();else if(u.key==="a"||u.key==="A")this.frameAll();else if(u.key==="`")this.setStatsOverlay(!this.showStats);else if((u.key==="i"||u.key==="I")&&this.emphasisSets.length)this.setNetIsolation(!this.isolateNets);else return;u.preventDefault()}},d=u=>u.preventDefault();e.tabIndex=0,e.addEventListener("contextmenu",d),e.addEventListener("pointerdown",s),e.addEventListener("pointermove",r),e.addEventListener("pointerup",n),e.addEventListener("dblclick",i),e.addEventListener("wheel",o,{passive:!1}),e.addEventListener("keydown",c),this.unbind=()=>{e.removeEventListener("contextmenu",d),e.removeEventListener("pointerdown",s),e.removeEventListener("pointermove",r),e.removeEventListener("pointerup",n),e.removeEventListener("dblclick",i),e.removeEventListener("wheel",o),e.removeEventListener("keydown",c)}}setStatsOverlay(e){this.showStats=!!e,this.statsEl&&(this.statsEl.hidden=!this.showStats),this.showStats&&this.renderStats()}setGpuBudget(e){let a=Number(e);this.gpuBudgetBytes=Number.isFinite(a)&&a>0?a:Sc}stats(){let e=this.frameSamples.map(([i])=>i).sort((i,o)=>i-o),a=this.frameSamples.map(([,i])=>i).sort((i,o)=>i-o),s=i=>i.reduce((o,c)=>o+c,0)/Math.max(1,i.length),r=i=>i[Math.min(i.length-1,Math.floor(i.length*.95))]||0,n=[...this.assets.entries()].map(([i,o])=>({assetId:i,state:o.state,componentTier:o.componentTier||"idle",occurrences:this.scene?.assets.get(i)?.occurrenceCount||0,error:o.error||null}));return{occurrences:this.placed.length,lod:this.scene?this.scene.cullCounts():{full:0,board:0,box:0,culled:0},triangles:this.scene?.frameStats.triangles||0,draws:this.scene?.frameStats.draws||0,gpuMemoryBytes:this.scene?.gpuMemoryBytes()||0,gpuBudgetBytes:this.gpuBudgetBytes,assets:n,status:this.status(),cache:this.cache.summary(),frameIntervalMs:s(e),frameIntervalP95Ms:r(e),frameCpuMs:s(a),frameCpuP95Ms:r(a),fps:e.length?1e3/Math.max(1e-6,s(e)):0,lodThresholds:{...rs},firstFrame:this.timing.boardsDrawnAt==null?null:{sinceSceneMs:this.timing.boardsDrawnAt-this.timing.descriptorAt,sinceNavigationMs:this.timing.boardsDrawnAt}}}renderStats(){if(!this.statsEl)return;let e=this.stats(),{full:a,board:s,box:r,culled:n}=e.lod,i=e.assets.filter(c=>c.state==="loaded").length,o=[["Boards",`${e.occurrences} placed \xB7 ${i}/${e.assets.length} designs loaded`],["Detail",`${a} full \xB7 ${s} board \xB7 ${r} box \xB7 ${n} culled`],["Triangles",e.triangles.toLocaleString()],["Draws",e.draws.toLocaleString()],["GPU memory",`${(e.gpuMemoryBytes/1048576).toFixed(1)} / ${(e.gpuBudgetBytes/1048576).toFixed(0)} MB`],["Cache",e.cache.enabled?`${e.cache.hits} hits \xB7 ${e.cache.misses} misses`:"off"],["Frame",`${e.frameIntervalMs.toFixed(1)} ms \xB7 p95 ${e.frameIntervalP95Ms.toFixed(1)}`],["CPU",`${e.frameCpuMs.toFixed(2)} ms \xB7 p95 ${e.frameCpuP95Ms.toFixed(2)}`],["FPS",e.fps.toFixed(0)]];this.statsEl.innerHTML=o.map(([c,d])=>`<dt>${c}</dt><dd>${d}</dd>`).join("")}};function jp(t,e){return t.netById||(t.netById=new Map((t.manifest?.nets||[]).map(a=>[Number(a.id),a]))),t.netById.get(e)||null}var Bp=`
  <style>
    :host { display: block; position: relative; overflow: hidden; background: #e8edf0; contain: strict; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; outline: none; touch-action: none; }
    canvas:focus-visible { box-shadow: inset 0 0 0 2px rgb(59 130 246 / 0.6); }
    #labels { position: absolute; inset: 0; pointer-events: none; }
    #labels[hidden] { display: none; }
    .scene-label {
      position: absolute; left: 0; top: 0; display: flex; flex-direction: column; align-items: center;
      padding: 2px 7px; border-radius: 5px; background: rgb(15 20 28 / 0.72); color: #f1f5f9;
      font: 500 11px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; white-space: nowrap;
      margin-top: -6px;
    }
    .scene-label[hidden] { display: none; }
    .scene-label span { font-weight: 400; color: #cbd5e1; font-size: 10px; }
    .scene-label.stand-in { background: rgb(71 85 105 / 0.78); }
    .scene-label.restricted { background: rgb(55 65 81 / 0.85); }
    .scene-label.failed { background: rgb(153 27 27 / 0.8); }
    .scene-label.selected { background: rgb(37 99 235 / 0.92); }
    #stats {
      position: absolute; top: 12px; right: 12px; margin: 0; padding: 8px 10px;
      display: grid; grid-template-columns: auto auto; gap: 2px 12px;
      background: rgb(15 20 28 / 0.82); color: #dbe4f0; border-radius: 6px;
      font: 11px/1.4 "SFMono-Regular", Consolas, monospace; font-variant-numeric: tabular-nums; pointer-events: none;
    }
    #stats[hidden] { display: none; }
    #stats dt { color: #8a97a8; }
    #stats dd { margin: 0; text-align: right; }
    #gizmo { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    #gizmo[hidden] { display: none; }
    #gizmo .ring { stroke-width: 2.5; opacity: 0.75; pointer-events: stroke; cursor: grab; }
    #gizmo .ring:hover { stroke-width: 5; opacity: 1; }
    #gizmo .arrow { pointer-events: visiblePainted; cursor: grab; }
    #gizmo .arrow line { stroke-width: 4; stroke-linecap: round; }
    #gizmo .arrow:hover line { stroke-width: 6; }
    #gizmo .arrow text { font: 700 11px system-ui, -apple-system, "Segoe UI", sans-serif; paint-order: stroke; }
    #gizmo .pivot { fill: #0f172a; stroke: #fff; stroke-width: 1.5; }
    #gizmo .readout { font: 600 12px system-ui, -apple-system, "Segoe UI", sans-serif; fill: #0f172a;
      paint-order: stroke; stroke: #fff; stroke-width: 3px; }
    #help { position: absolute; left: 12px; bottom: 12px; margin: 0; padding: 10px 12px; max-width: 320px;
      display: grid; grid-template-columns: auto 1fr; gap: 3px 12px;
      background: rgb(15 20 28 / 0.88); color: #e2e8f0; border-radius: 8px;
      font: 12px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
    #help[hidden] { display: none; }
    #help h2 { grid-column: 1 / -1; margin: 0 0 4px; font-size: 12px; font-weight: 600; }
    #help kbd { font: 600 11px "SFMono-Regular", Consolas, monospace; color: #fff; }
    #help dd { margin: 0; color: #cbd5e1; }
    #fallback { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center;
      font: 13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: #475569; }
    #fallback[hidden] { display: none; }
  </style>
  <canvas id="viewport" aria-label="System 3D view"></canvas>
  <div id="labels"></div>
  <svg id="gizmo" hidden aria-hidden="true"></svg>
  <dl id="help" hidden aria-label="Keyboard shortcuts">
    <h2>Keyboard (while the view has focus)</h2>
    <dt><kbd>F</kbd></dt><dd>Frame the selection</dd>
    <dt><kbd>A</kbd></dt><dd>Frame everything</dd>
    <dt><kbd>M</kbd></dt><dd>Move mode on or off (editors)</dd>
    <dt><kbd>L</kbd></dt><dd>Gizmo axes: world or the board's own</dd>
    <dt><kbd>Shift</kbd></dt><dd>While dragging: 0.1 mm and 1\xB0 steps (else 1 mm, 15\xB0)</dd>
    <dt><kbd>Enter</kbd></dt><dd>Save the shown position</dd>
    <dt><kbd>Esc</kbd></dt><dd>Undo the drag, or leave move mode, or clear the selection</dd>
    <dt><kbd>I</kbd></dt><dd>Isolate the highlighted nets' copper, or back</dd>
    <dt><kbd>\`</kbd></dt><dd>Scene stats</dd>
    <dt><kbd>?</kbd></dt><dd>This list</dd>
  </dl>
  <dl id="stats" hidden></dl>
  <div id="fallback" hidden></div>
`;function jc(){if(customElements.get("prism-system-scene"))return;class t extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.controller=null,this.pendingScene=null,this.pendingStats=null,this.pendingBudget=null,this.pendingMoveAllowed=!1,this.pendingEmphasis=null,this.starting=null}connectedCallback(){this.starting||this.controller||(this.shadowRoot.innerHTML=Bp,this.starting=this.start())}disconnectedCallback(){this.controller?.dispose(),this.controller=null,this.starting=null}async start(){let a=this.shadowRoot,s=a.getElementById("fallback");if(!navigator.gpu){s.hidden=!1,s.textContent="The 3D view needs WebGPU, which this browser does not provide.",this.emit("error",{error:"webgpu-unavailable"});return}let r=new Ps({canvas:a.getElementById("viewport"),labelsEl:a.getElementById("labels"),statsEl:a.getElementById("stats"),gizmoEl:a.getElementById("gizmo"),helpEl:a.getElementById("help"),onSelectionChange:n=>this.emit("selectionchange",{selection:n}),onStatus:n=>this.emit("status",{status:n}),onMove:n=>this.emit("move",n),onEmphasis:n=>this.emit("emphasis",{report:n}),onIsolation:n=>this.emit("isolation",{isolated:n})});try{await r.init()}catch(n){r.dispose(),s.hidden=!1,s.textContent=`The 3D view could not start: ${n?.message||n}`,this.emit("error",{error:n?.message||String(n)});return}if(!this.isConnected){r.dispose();return}this.controller=r,this.pendingBudget!=null&&r.setGpuBudget(this.pendingBudget),this.pendingStats!=null&&r.setStatsOverlay(this.pendingStats),r.setMoveAllowed(this.pendingMoveAllowed),this.pendingEmphasis&&r.setNetEmphasis(this.pendingEmphasis),this.pendingScene&&this.applyScene(this.pendingScene),this.emit("ready",{})}emit(a,s){this.dispatchEvent(new CustomEvent(`prism-system-scene:${a}`,{detail:s,bubbles:!0,composed:!0}))}applyScene(a){try{this.controller.setDescriptor(a)}catch(s){this.emit("error",{error:s?.message||String(s)})}}setScene(a){this.pendingScene=a,this.controller&&this.applyScene(a)}select(a,s=0){return this.controller?.select(a,s)??null}frameAll(){this.controller?.frameAll()}frameOccurrence(a){this.controller?.frameOccurrence(a)}pickAt(a,s){return this.controller?this.controller.pickAt(a,s):Promise.resolve(null)}projectOccurrence(a){return this.controller?.projectOccurrence(a)??null}setStatsOverlay(a){this.pendingStats=!!a,this.controller?.setStatsOverlay(a)}setLabelsVisible(a){this.controller&&(this.controller.showLabels=!!a)}setGpuBudget(a){this.pendingBudget=a,this.controller?.setGpuBudget(a)}setNetEmphasis(a){return this.pendingEmphasis=a,this.controller?.setNetEmphasis(a)??null}setNetIsolation(a){return this.controller?.setNetIsolation(a)??!1}frameNetEmphasis(a=null,s=null){return this.controller?.frameNetEmphasis(a,s)??!1}getStats(){return this.controller?.stats()??null}setMoveAllowed(a){this.pendingMoveAllowed=!!a,this.controller?.setMoveAllowed(a)}setMoveMode(a){this.controller?.setMoveMode(a)}setMoveSpace(a){this.controller?.setMoveSpace(a)}previewPose(a){this.controller?.previewPose(a)}cancelMove(){this.controller?.cancelMove()}getMoveState(){return this.controller?.moveState()??null}setHelpVisible(a){this.controller?.setHelpVisible(a)}}customElements.define("prism-system-scene",t)}window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__=!0;pc();jc();
