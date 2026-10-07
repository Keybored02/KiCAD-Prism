var Tn=`:host,
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
`;var Kl=/\/api\/projects\/([^/]+)\/webgpu-3d\/assets\/([^/]+)\/([^/]+)\/(.+)$/,Gl="prism-bundle-cache-a0",or="manifest.json";function cr(t){let e;try{e=new URL(t,"http://cache.invalid/")}catch{return null}let a=Kl.exec(e.pathname);if(!a)return null;let[,s,r,n,i]=a.map(decodeURIComponent);if(i.split("/").some(c=>!c||c==="."||c===".."))return null;let o=e.searchParams.get("viewer")||"";return`${s}/${r}/${n}/${i}${o?`?viewer=${o}`:""}`}function Ka(t){return`a_${encodeURIComponent(t)}`}function zl(t,e,{maxAgeMs:a=2592e6,maxBytes:s=2147483648}={}){let r=new Set,n=[];for(let[o,c]of Object.entries(t))e-Number(c.lastUsed||0)<=a?n.push([o,c]):r.add(o);n.sort((o,c)=>Number(c[1].lastUsed)-Number(o[1].lastUsed));let i=0;for(let[o,c]of n)i+=Number(c.bytes||0),i>s&&r.add(o);return[...r]}var Ga=class t{static open(e={}){return t.shared||(t.shared=new t(e)),t.shared}constructor({maxAgeMs:e=2592e6,maxBytes:a=2147483648}={}){this.maxAgeMs=e,this.maxBytes=a,this.stats={hits:0,misses:0,bypassed:0,cachedBytes:0,networkBytes:0,writeErrors:0},this.ready=this.init(),this.flushTimer=null}async init(){try{let e=globalThis.navigator?.storage;if(!e?.getDirectory)return null;let s=await(await e.getDirectory()).getDirectoryHandle(Gl,{create:!0}),r=await s.getFileHandle(or,{create:!0});if(typeof r.createWritable!="function")return null;let n={};try{let i=await(await r.getFile()).text();n=i?JSON.parse(i).entries||{}:{}}catch{n={}}return this.directory=s,this.entries=n,await this.prune(),globalThis.addEventListener?.("pagehide",()=>void this.flush()),s}catch{return null}}get enabled(){return!!this.directory}async fetchBytes(e,{store:a=!0,signal:s}={}){let r=cr(e);if(await this.ready,r&&this.directory){let c=await this.read(r);if(c)return this.stats.hits+=1,this.stats.cachedBytes+=c.byteLength,c;this.stats.misses+=1}else this.stats.bypassed+=1;let n=await fetch(e,{cache:"no-store",signal:s});if(!n.ok)throw new Error(`Failed to load ${e}: ${n.status}`);let i=await n.arrayBuffer(),o=Number(n.headers.get("content-length")||0);return this.stats.networkBytes+=i.byteLength,a&&r&&this.directory&&(!o||o===i.byteLength)&&this.write(r,i),i}async fetchJson(e,a={}){let s=await this.fetchBytes(e,a);return JSON.parse(new TextDecoder().decode(s))}async peekJson(e){let a=cr(e);if(await this.ready,!a||!this.directory)return null;let s=await this.read(a);return s?(this.stats.hits+=1,this.stats.cachedBytes+=s.byteLength,JSON.parse(new TextDecoder().decode(s))):null}async store(e,a){let s=cr(e);await this.ready,s&&this.directory&&await this.write(s,a)}async read(e){let a=this.entries[e];if(!a)return null;try{let s=await(await this.directory.getFileHandle(Ka(e))).getFile();return s.size!==a.bytes?null:(a.lastUsed=Date.now(),this.scheduleFlush(),await s.arrayBuffer())}catch{return delete this.entries[e],null}}async write(e,a){try{let r=await(await this.directory.getFileHandle(Ka(e),{create:!0})).createWritable();await r.write(a),await r.close(),this.entries[e]={bytes:a.byteLength,lastUsed:Date.now()},this.scheduleFlush()}catch{this.stats.writeErrors+=1}}async prune(e=Date.now()){if(!this.directory)return[];let a=zl(this.entries,e,{maxAgeMs:this.maxAgeMs,maxBytes:this.maxBytes});for(let r of a)delete this.entries[r],await this.directory.removeEntry(Ka(r)).catch(()=>{});let s=new Set(Object.keys(this.entries).map(Ka));for await(let r of this.directory.keys())r!==or&&!s.has(r)&&await this.directory.removeEntry(r).catch(()=>{});return a.length&&await this.flush(),a}async clear(){await this.ready,this.directory&&(this.entries={},await this.prune(),await this.flush())}summary(){let e=Object.values(this.entries||{});return{enabled:this.enabled,files:e.length,bytes:e.reduce((a,s)=>a+Number(s.bytes||0),0),...this.stats}}scheduleFlush(){this.flushTimer||(this.flushTimer=setTimeout(()=>{this.flushTimer=null,this.flush()},1e3))}async flush(){if(this.directory)try{let a=await(await this.directory.getFileHandle(or,{create:!0})).createWritable();await a.write(JSON.stringify({schema:"prism.bundle_cache_manifest.a0",entries:this.entries})),await a.close()}catch{this.stats.writeErrors+=1}}};function Vl(t,e){if(!e)return t;let a=new URL(t);return a.searchParams.set("viewer",e),a.toString()}function Mn(t,e,a,s){let r=new URL(a.asset_base||"./",e),n=structuredClone(t||{}),i=o=>!o||typeof o!="string"?o:Vl(new URL(o,r).toString(),s);for(let o of["assets","semantic_gltf","schematic_world","schematic_vector","schematic_scene","bom"]){let c=n[o];if(!(!c||typeof c!="object"))for(let[d,b]of Object.entries(c))c[d]=i(b)}return n}function lr(t){return(t?.readiness?.stage||"semantic-ready")==="semantic-ready"&&(t?.readiness?.progress??100)>=100}var re=(t,e,a)=>Math.max(e,Math.min(a,t)),Va=(t,e,a)=>t+(e-t)*a;function We(t,e){return[t[0]+e[0],t[1]+e[1],t[2]+e[2]]}function Hl(t,e){return[t[0]-e[0],t[1]-e[1],t[2]-e[2]]}function Ce(t,e){return[t[0]*e,t[1]*e,t[2]*e]}function ql(t){return Math.hypot(t[0],t[1],t[2])}function tt(t){let e=ql(t)||1;return Ce(t,1/e)}function lt(t,e){return[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]]}function ca(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function In(t,e){let a=e/2,s=Math.sin(a),r=tt(t);return[r[0]*s,r[1]*s,r[2]*s,Math.cos(a)]}function za(t,e){return[t[3]*e[0]+t[0]*e[3]+t[1]*e[2]-t[2]*e[1],t[3]*e[1]-t[0]*e[2]+t[1]*e[3]+t[2]*e[0],t[3]*e[2]+t[0]*e[1]-t[1]*e[0]+t[2]*e[3],t[3]*e[3]-t[0]*e[0]-t[1]*e[1]-t[2]*e[2]]}function dr(t,e){let a=[e[0],e[1],e[2],0],s=[-t[0],-t[1],-t[2],t[3]];return za(za(t,a),s).slice(0,3)}function Ha(t,e){let a=new Float32Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Sn(t,e,a){let s=tt(Hl(t,e)),r=tt(lt(a,s)),n=lt(s,r);return new Float32Array([r[0],n[0],s[0],0,r[1],n[1],s[1],0,r[2],n[2],s[2],0,-ca(r,t),-ca(n,t),-ca(s,t),1])}function Rn(t,e,a,s){let r=1/Math.tan(t/2);return new Float32Array([r/e,0,0,0,0,r,0,0,0,0,a/(s-a),-1,0,0,a*s/(s-a),0])}function An(t,e,a,s){return new Float32Array([2/t,0,0,0,0,2/e,0,0,0,0,1/(s-a),0,0,0,1,1])}function ur(t){return[(t[0]+t[3])/2,(t[1]+t[4])/2,(t[2]+t[5])/2]}function Yt(t){return Math.max(.001,Math.hypot(t[3]-t[0],t[4]-t[1],t[5]-t[2])/2)}var la=class{constructor(e){let a=ur(e),s=Yt(e);this.focus=[...a],this.targetFocus=[...a],this.azimuth=-.62,this.targetAzimuth=this.azimuth,this.polar=.72,this.targetPolar=this.polar,this.distance=s*2.8,this.targetDistance=this.distance,this.orthoScale=s*2.15,this.targetOrthoScale=this.orthoScale,this.sceneRadius=s,this.fov=Math.PI/4}update(e){let a=1-Math.exp(-e*14);this.focus=this.focus.map((s,r)=>Va(s,this.targetFocus[r],a)),this.azimuth=Nn(this.azimuth,this.targetAzimuth,a),this.polar=Nn(this.polar,this.targetPolar,a),this.distance=Va(this.distance,this.targetDistance,a),this.orthoScale=Va(this.orthoScale,this.targetOrthoScale,a)}snap(){this.focus=[...this.targetFocus],this.azimuth=this.targetAzimuth,this.polar=this.targetPolar,this.distance=this.targetDistance,this.orthoScale=this.targetOrthoScale}basis(){let e=Math.sin(this.polar),a=Math.cos(this.polar),s=tt([e*Math.sin(this.azimuth),-e*Math.cos(this.azimuth),a]),r=tt([Math.cos(this.azimuth),Math.sin(this.azimuth),0]),n=tt(lt(s,r));return{right:r,up:n,back:s}}matrix(e,a,s=!1,r=1){let n=Math.max(.01,e/Math.max(1,a)),{up:i,back:o}=this.basis(),c=We(this.focus,Ce(o,this.distance)),d=Sn(c,this.focus,i),b=s?An(this.orthoScale*r*n,this.orthoScale*r,-this.sceneRadius*40,this.sceneRadius*40):Rn(this.fov,n,Math.max(this.sceneRadius*5e-4,this.distance-this.sceneRadius*3.5),this.distance+this.sceneRadius*4.5);return Ha(b,d)}orbit(e,a){let s=Math.sin(this.targetPolar)<0?-1:1;this.targetAzimuth-=s*e*.006,this.targetPolar=_n(this.targetPolar-a*.006)}isBelow(){return Math.cos(this.targetPolar)<0}pan(e,a,s,r=!1){let{right:n,up:i}=this.basis(),o=r?this.targetOrthoScale/Math.max(1,s):2*this.targetDistance*Math.tan(this.fov/2)/Math.max(1,s),c=We(Ce(n,-e*o),Ce(i,a*o));this.targetFocus=We(this.targetFocus,c)}dolly(e,a=!1){let s=Math.exp(e*.0032);a?this.targetOrthoScale=re(this.targetOrthoScale*s,this.sceneRadius*.008,this.sceneRadius*24):this.targetDistance=re(this.targetDistance*s,this.sceneRadius*.01,this.sceneRadius*48)}frame(e){if(!e)return;let a=Yt(e);this.targetFocus=ur(e),this.targetDistance=Math.max(a*2.8,this.sceneRadius*.02),this.targetOrthoScale=Math.max(a*2.15,this.sceneRadius*.02)}setFocus(e){this.targetFocus=[...e]}setAxis(e,a=!1){e==="z"?(this.targetAzimuth=0,this.targetPolar=a?Math.PI-.015:.015):e==="x"?(this.targetAzimuth=a?-Math.PI/2:Math.PI/2,this.targetPolar=Math.PI/2):(this.targetAzimuth=a?0:Math.PI,this.targetPolar=Math.PI/2)}rotateZ(e=1){this.targetAzimuth+=e*Math.PI/2}flip(){this.targetPolar=_n(Math.PI-this.targetPolar)}};function _n(t){return Math.atan2(Math.sin(t),Math.cos(t))}function Nn(t,e,a){let s=Math.atan2(Math.sin(e-t),Math.cos(e-t));return t+s*a}var qa=class t{static async create(e,a,s={}){let r=await fetch(a,{cache:"default"});if(!r.ok)throw new Error(`Failed to load BoM ${a}: ${r.status}`);let n=await r.json();if(n.schema!=="prism.bom_a0")throw new Error(`Unsupported BoM schema: ${n.schema||"missing"}`);let i=new t(e,n,s);return i.render(),i}constructor(e,a,s){this.container=e,this.payload=a,this.callbacks=s,this.query="",this.selectedRowId="",this.selectedReference="",this.rowsById=new Map((a.rows||[]).map(r=>[r.id,r])),this.componentIndex=new Map(Object.entries(a.componentIndex||{}))}setSelectionByReference(e,a={}){let s=this.componentIndex.get(e);s&&(this.selectedReference=e,this.selectedRowId=s.rowId,this.renderContent(),a.scroll&&this.container.querySelector(`[data-row-id="${Jl(s.rowId)}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}))}clearSelection(){this.selectedReference="",this.selectedRowId="",this.renderContent()}render(){let e=this.filteredRows();this.container.innerHTML=`
      <section class="bom-workspace">
        <header class="bom-toolbar">
          <div>
            <p class="eyebrow">Prism BoM A0</p>
            <h2>Bill of Materials</h2>
            <span data-bom-count>${e.length} of ${(this.payload.rows||[]).length} grouped rows \xB7 ${(this.payload.components||[]).length} components</span>
          </div>
          <label class="bom-search">
            <span>Search</span>
            <input id="bom-search" type="search" value="${Oe(this.query)}" placeholder="Reference, value, footprint, manufacturer..." />
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
            <tr>${a.map(r=>`<th>${Oe(r)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${e.map(r=>this.rowHtml(r,a)).join("")}
          </tbody>
        </table>
      </div>
      ${s?`<aside class="bom-detail">${this.detailHtml(s)}</aside>`:""}
    `}filteredRows(){let e=this.query.trim().toLowerCase(),a=this.payload.rows||[];return e?a.filter(s=>JSON.stringify(s).toLowerCase().includes(e)):a}rowHtml(e,a){return`
      <tr class="${e.id===this.selectedRowId?"selected":""}" data-row-id="${Oe(e.id)}">
        ${a.map(r=>{let n=e.fields?.[r]||"";return r==="Reference"?`<td class="bom-reference-cell">${(e.references||[]).map(i=>`
              <button class="bom-ref-chip ${i===this.selectedReference?"active":""}" data-reference="${Oe(i)}">${Oe(i)}</button>
            `).join("")}</td>`:!n&&Wl(r)?'<td><span class="bom-missing">Missing</span></td>':`<td title="${Oe(n)}">${Oe(n)}</td>`}).join("")}
      </tr>
    `}detailHtml(e){let a=Xl(e,this.payload.displayColumns||[],this.payload.extraColumns||[]);return`
      <div class="bom-detail-head">
        <p class="eyebrow">Line item</p>
        <h3>${Oe((e.references||[]).join(", "))}</h3>
        <span>${e.qty} component${e.qty===1?"":"s"}${e.dnp?" \xB7 DNP":""}</span>
      </div>
      <div class="bom-ref-list">
        ${(e.references||[]).map(s=>`
          <button class="bom-ref-chip detail ${s===this.selectedReference?"active":""}" data-reference="${Oe(s)}">${Oe(s)}</button>
        `).join("")}
      </div>
      <dl class="bom-field-list">
        ${a.map(([s,r])=>`
          <div>
            <dt>${Oe(s)}</dt>
            <dd>${Oe(r)}</dd>
          </div>
        `).join("")}
      </dl>
    `}bind(){let e=this.container.querySelector("#bom-search");e?.addEventListener("input",()=>{this.query=e.value,this.renderContent()}),this.bindContent(this.container)}bindContent(e){e.querySelectorAll("[data-row-id]").forEach(a=>{a.addEventListener("click",s=>{s.target.closest("[data-reference]")||(this.selectedRowId=a.dataset.rowId,this.selectedReference="",this.renderContent())})}),e.querySelectorAll("[data-reference]").forEach(a=>{a.addEventListener("click",s=>{s.stopPropagation();let r=a.dataset.reference;this.setSelectionByReference(r),this.callbacks.onSelectReference?.(r)})})}};function Xl(t,e,a){let s=[],r=new Set(["Reference","Qty"].map(fr));for(let i of e){if(i==="Reference"||i==="Qty")continue;let o=t.fields?.[i]||"";o&&(s.push([i,o]),r.add(fr(i)))}let n=t.canonicalFields||{};for(let i of a){let o=n[i]||"";if(!o)continue;let c=fr(i);r.has(c)||(r.add(c),s.push([i,o]))}return s}function fr(t){return String(t||"").toLowerCase().replace(/[\s_\-()[\]/]+/g,"")}function Wl(t){return["Manufacturer Part Number","Vendor Part Number","Datasheet","Footprint","Value"].includes(t)}function Oe(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Jl(t){return String(t).replace(/["\\]/g,"\\$&")}function hr(t){let e=`${t.nodeName||""} ${t.meshName||""} ${t.material?.name||""}`.toLowerCase();return e.includes("_pad")||e.includes(".pad")||e.endsWith("pad")?"pad":e.includes("silkscreen")?"silkscreen":e.includes("soldermask")?"soldermask":e.includes("paste")?"paste":"substrate"}function Xa(t,e=()=>""){let a=new Map;for(let s of t){let n=`${e(s)}:${JSON.stringify(s.material)}`;a.has(n)||a.set(n,[]),a.get(n).push(s)}return[...a.values()].map(s=>{let r=s.reduce((h,l)=>h+l.position.length/3,0),n=s.reduce((h,l)=>h+l.indices.length,0),i=new Float32Array(r*3),o=new Float32Array(r*3),c=new Uint32Array(r),d=new Uint32Array(r),b=new Uint32Array(n),f=0,v=0,x=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let h of s){let l=h.position.length/3;i.set(h.position,f*3),o.set(h.normal,f*3),c.set(h.netId,f),d.set(h.objectFeatureId,f);for(let g=0;g<h.indices.length;g+=1)b[v+g]=Number(h.indices[g])+f;h.bounds&&(x[0]=Math.min(x[0],h.bounds[0]),x[1]=Math.min(x[1],h.bounds[1]),x[2]=Math.min(x[2],h.bounds[2]),x[3]=Math.max(x[3],h.bounds[3]),x[4]=Math.max(x[4],h.bounds[4]),x[5]=Math.max(x[5],h.bounds[5])),f+=l,v+=h.indices.length}return{position:i,normal:o,netId:c,objectFeatureId:d,indices:b,material:s[0].material,groupKey:e(s[0]),bounds:Number.isFinite(x[0])?x:null}})}function ua(t){return!t||t.length!==6?null:[t[0]/1e3,-t[4]/1e3,t[2]/1e3,t[3]/1e3,-t[1]/1e3,t[5]/1e3]}function fa(t){let e=t?.min||[0,0,0],a=t?.max||[.08,.0016,.05];return[e[0],-a[2],e[1],a[0],-e[2],a[1]]}function $t(t){let e=t.filter(a=>Array.isArray(a)&&a.length===6);return e.length?e.reduce((a,s)=>[Math.min(a[0],s[0]),Math.min(a[1],s[1]),Math.min(a[2],s[2]),Math.max(a[3],s[3]),Math.max(a[4],s[4]),Math.max(a[5],s[5])],[...e[0]]):null}function Fn(t){let e=t.replace("#","");return[0,2,4].map(a=>parseInt(e.slice(a,a+2),16)/255)}function jn(t,e){if(typeof t?.color=="string"&&/^#[0-9a-fA-F]{6}$/.test(t.color))return[...Fn(t.color),1];let a={"F.Cu":"#a9423c","B.Cu":"#315b9a","In1.Cu":"#477a55","In2.Cu":"#806244","In3.Cu":"#347c86","In4.Cu":"#685889","In5.Cu":"#92793e"},s=["#477a55","#806244","#347c86","#685889","#92793e","#82556e"],r=String(t?.name||""),n=Math.max(0,e.findIndex(i=>i.name===r)-1);return[...Fn(a[r]||s[n%s.length]),1]}function Bn(t,e){let a=e.map(s=>[Number(s.id),Number(s.z_mm||0)]);return a.length<3?!1:(a.sort((s,r)=>s[1]-r[1]),t!==a[0][0]&&t!==a[a.length-1][0])}var da=Object.freeze({gold:[.83,.69,.37,1],silver:[.74,.75,.77,1],copper:[.76,.47,.28,1]});function Cn(t){let e=String(t||"").toLowerCase();return/hasl|hal\b|tin|silver|lead/.test(e)?da.silver:/osp|bare|none/.test(e)?da.copper:da.gold}function On(t,e){let a=String(t?.name||"");return!!a&&(a===e[0]?.name||a===e[e.length-1]?.name)}function Pn(t,e){let a=String(t.material?.name||"").endsWith("_bottom"),s=e.find(r=>r.name===(a?"B.Cu":"F.Cu"))||(a?e[e.length-1]:e[0]);return Number(s?.id||0)}function Dn(t,e=new Map){let a=new Map;for(let r of t||[]){let n=String(r?.designator||"");if(!n)continue;let i=a.get(n)||{reference:n,featureIds:new Set,modelCount:0},o=Number(r?.featureId)||0;o>0&&i.featureIds.add(o),a.set(n,i)}for(let[r,n]of e||[]){let i=a.get(String(r));i&&(i.modelCount=Math.max(i.modelCount,Number(n)||0))}let s=new Map;for(let[r,n]of a)s.set(r,{reference:r,featureIds:[...n.featureIds].sort((i,o)=>i-o),ambiguous:n.featureIds.size>1||n.modelCount>1});return s}function Ln(t,e){let a=[...new Set((Array.isArray(t)?t:[]).map(c=>String(c||"")).filter(Boolean))],s=[],r=[],n=[],i=new Set,o=new Set;for(let c of a){let d=e.get(c);if(!d){n.push(c);continue}if(d.ambiguous){r.push(c);continue}s.push(c),o.add(c);for(let b of d.featureIds)i.add(b)}return{requested:a,applied:s,ambiguous:r,unknown:n,hiddenFeatureIds:i,hiddenReferences:o}}function Wa(t,e){return!!t&&e.has(String(t))}var Yl={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function G(t){return String(t??"").replace(/[&<>"']/g,e=>Yl[e])}var ha=`
fn netEmphasized(id: u32) -> bool {
  return id != 0u && id < arrayLength(&netMask) && netMask[id] != 0u;
}
`;function Ja(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function Un(t,e=0){let a=0;for(let r of Ja(t))a=Math.max(a,r);let s=64;for(;s<a+1;)s*=2;return Math.max(s,Math.floor(e)||0)}function Kn(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(0);for(let r of Ja(t))r<a&&(s[r]=1);return s}function Dt(t,e){return!Array.isArray(t)||!e?null:t.find(a=>a.name===e||Array.isArray(a.aliases)&&a.aliases.includes(e))||null}function Gn(t,e){let a=new Set;if(!Array.isArray(t)||!Array.isArray(e))return a;for(let s of e){if(!s)continue;let r=s.netUid&&t.find(i=>i.uid===s.netUid)||s.netName&&Dt(t,s.netName),n=Number(r?.id);Number.isInteger(n)&&n>0&&a.add(n)}return a}var br=Object.freeze([[.08,1,.2],[1,.72,.1],[.2,.75,1],[1,.3,.75],[.65,.45,1],[1,.45,.2],[.3,1,.85],[.95,.95,.3]]),zn=`
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
`;function Vn(t){let e=null;return Array.isArray(t)&&t.length>=3&&t.slice(0,3).every(a=>Number.isFinite(Number(a)))?e=t.slice(0,3).map(a=>Math.round(Math.min(1,Math.max(0,Number(a)))*255)):typeof t=="string"&&/^#[0-9a-f]{6}$/i.test(t)&&(e=[1,3,5].map(a=>parseInt(t.slice(a,a+2),16))),e?(1<<24|e[0]<<16|e[1]<<8|e[2])>>>0:1}function Hn(t){let e=1;for(let s of t)for(let r of s?.keys()||[])e=Math.max(e,r+1);let a=new Uint32Array(Math.max(64,t.length*e));return t.forEach((s,r)=>{for(let[n,i]of s||[])Number.isInteger(n)&&n>0&&(a[r*e+n]=i>>>0)}),{stride:e,data:a}}var qn=class{_listeners={};addEventListener(t,e){let a=this._listeners;return a[t]===void 0&&(a[t]=[]),a[t].indexOf(e)===-1&&a[t].push(e),this}removeEventListener(t,e){let a=this._listeners[t];if(a!==void 0){let s=a.indexOf(e);s!==-1&&a.splice(s,1)}return this}dispatchEvent(t){let e=this._listeners[t.type];if(e!==void 0){let a=e.slice(0);for(let s=0,r=a.length;s<r;s++)a[s].call(this,t)}return this}dispose(){for(let t in this._listeners)delete this._listeners[t]}},ut=class{_disposed=!1;_name;_parent;_child;_attributes;constructor(t,e,a,s={}){if(this._name=t,this._parent=e,this._child=a,this._attributes=s,!e.isOnGraph(a))throw new Error("Cannot connect disconnected graphs.")}getName(){return this._name}getParent(){return this._parent}getChild(){return this._child}setChild(t){return this._child=t,this}getAttributes(){return this._attributes}dispose(){this._disposed||(this._parent._destroyRef(this),this._disposed=!0)}isDisposed(){return this._disposed}},pr=class extends qn{_emptySet=new Set;_edges=new Set;_parentEdges=new Map;_childEdges=new Map;listEdges(){return Array.from(this._edges)}listParentEdges(t){return Array.from(this._childEdges.get(t)||this._emptySet)}listParents(t){let e=new Set;for(let a of this.listParentEdges(t))e.add(a.getParent());return Array.from(e)}listChildEdges(t){return Array.from(this._parentEdges.get(t)||this._emptySet)}listChildren(t){let e=new Set;for(let a of this.listChildEdges(t))e.add(a.getChild());return Array.from(e)}disconnectParents(t,e){for(let a of this.listParentEdges(t))(!e||e(a.getParent()))&&a.dispose();return this}_createEdge(t,e,a,s){let r=new ut(t,e,a,s);this._edges.add(r);let n=r.getParent();this._parentEdges.has(n)||this._parentEdges.set(n,new Set),this._parentEdges.get(n).add(r);let i=r.getChild();return this._childEdges.has(i)||this._childEdges.set(i,new Set),this._childEdges.get(i).add(r),r}_destroyEdge(t){return this._edges.delete(t),this._parentEdges.get(t.getParent()).delete(t),this._childEdges.get(t.getChild()).delete(t),this}},me=class{list=[];constructor(t){if(t)for(let e of t)this.list.push(e)}add(t){this.list.push(t)}remove(t){let e=this.list.indexOf(t);e>=0&&this.list.splice(e,1)}removeChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);for(let a of e)this.remove(a);return e}listRefsByChild(t){let e=[];for(let a of this.list)a.getChild()===t&&e.push(a);return e}values(){return this.list}},ae=class{set=new Set;map=new Map;constructor(t){if(t)for(let e of t)this.add(e)}add(t){let e=t.getChild();this.removeChild(e),this.set.add(t),this.map.set(e,t)}remove(t){this.set.delete(t),this.map.delete(t.getChild())}removeChild(t){let e=this.map.get(t)||null;return e&&this.remove(e),e}getRefByChild(t){return this.map.get(t)||null}values(){return Array.from(this.set)}},ue=class{map={};constructor(t){t&&Object.assign(this.map,t)}set(t,e){this.map[t]=e}delete(t){delete this.map[t]}get(t){return this.map[t]||null}keys(){return Object.keys(this.map)}values(){return Object.values(this.map)}},Q=Symbol("attributes"),dt=Symbol("immutableKeys"),Xn=class Wn extends qn{_disposed=!1;graph;[Q];[dt];constructor(e){super(),this.graph=e,this[dt]=new Set,this[Q]=this._createAttributes()}getDefaults(){return{}}_createAttributes(){let e=this.getDefaults(),a={};for(let s in e){let r=e[s];if(r instanceof Wn){let n=this.graph._createEdge(s,this,r);this[dt].add(s),a[s]=n}else a[s]=r}return a}isOnGraph(e){return this.graph===e.graph}isDisposed(){return this._disposed}dispose(){this._disposed||(this.graph.listChildEdges(this).forEach(e=>e.dispose()),this.graph.disconnectParents(this),this._disposed=!0,this.dispatchEvent({type:"dispose"}))}detach(){return this.graph.disconnectParents(this),this}swap(e,a){for(let s in this[Q]){let r=this[Q][s];if(r instanceof ut){let n=r;n.getChild()===e&&this.setRef(s,a,n.getAttributes())}else if(r instanceof me)for(let n of r.listRefsByChild(e)){let i=n.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}else if(r instanceof ae){let n=r.getRefByChild(e);if(n){let i=n.getAttributes();this.removeRef(s,e),this.addRef(s,a,i)}}else if(r instanceof ue)for(let n of r.keys()){let i=r.get(n);i.getChild()===e&&this.setRefMap(s,n,a,i.getAttributes())}}return this}get(e){return this[Q][e]}set(e,a){return this[Q][e]=a,this.dispatchEvent({type:"change",attribute:e})}getRef(e){let a=this[Q][e];return a?a.getChild():null}setRef(e,a,s){if(this[dt].has(e))throw new Error(`Cannot overwrite immutable attribute, "${e}".`);let r=this[Q][e];if(r&&r.dispose(),!a)return this;let n=this.graph._createEdge(e,this,a,s);return this[Q][e]=n,this.dispatchEvent({type:"change",attribute:e})}listRefs(e){return this.assertRefList(e).values().map(a=>a.getChild())}addRef(e,a,s){let r=this.graph._createEdge(e,this,a,s);return this.assertRefList(e).add(r),this.dispatchEvent({type:"change",attribute:e})}removeRef(e,a){let s=this.assertRefList(e);if(s instanceof me)for(let r of s.listRefsByChild(a))r.dispose();else{let r=s.getRefByChild(a);r&&r.dispose()}return this}assertRefList(e){let a=this[Q][e];if(a instanceof me||a instanceof ae)return a;throw new Error(`Expected RefList or RefSet for attribute "${e}"`)}listRefMapKeys(e){return this.assertRefMap(e).keys()}listRefMapValues(e){return this.assertRefMap(e).values().map(a=>a.getChild())}getRefMap(e,a){let s=this.assertRefMap(e).get(a);return s?s.getChild():null}setRefMap(e,a,s,r){let n=this.assertRefMap(e),i=n.get(a);if(i&&i.dispose(),!s)return this;r=Object.assign(r||{},{key:a});let o=this.graph._createEdge(e,this,s,{...r,key:a});return n.set(a,o),this.dispatchEvent({type:"change",attribute:e,key:a})}assertRefMap(e){let a=this[Q][e];if(a instanceof ue)return a;throw new Error(`Expected RefMap for attribute "${e}"`)}dispatchEvent(e){return super.dispatchEvent({...e,target:this}),this.graph.dispatchEvent({...e,target:this,type:`node:${e.type}`}),this}_destroyRef(e){let a=e.getName();if(this[Q][a]===e)this[Q][a]=null,this[dt].has(a)&&e.getChild().dispose();else if(this[Q][a]instanceof me)this[Q][a].remove(e);else if(this[Q][a]instanceof ae)this[Q][a].remove(e);else if(this[Q][a]instanceof ue){let s=this[Q][a];for(let r of s.keys())s.get(r)===e&&s.delete(r)}else return;this.graph._destroyEdge(e),this.dispatchEvent({type:"change",attribute:a})}};var ti="v4.4.2",ht="@glb.bin",F=(function(t){return t.ACCESSOR="Accessor",t.ANIMATION="Animation",t.ANIMATION_CHANNEL="AnimationChannel",t.ANIMATION_SAMPLER="AnimationSampler",t.BUFFER="Buffer",t.CAMERA="Camera",t.MATERIAL="Material",t.MESH="Mesh",t.PRIMITIVE="Primitive",t.PRIMITIVE_TARGET="PrimitiveTarget",t.NODE="Node",t.ROOT="Root",t.SCENE="Scene",t.SKIN="Skin",t.TEXTURE="Texture",t.TEXTURE_INFO="TextureInfo",t})({});var $l=(function(t){return t.ARRAY_BUFFER="ARRAY_BUFFER",t.ELEMENT_ARRAY_BUFFER="ELEMENT_ARRAY_BUFFER",t.INVERSE_BIND_MATRICES="INVERSE_BIND_MATRICES",t.OTHER="OTHER",t.SPARSE="SPARSE",t})({}),Ke=(function(t){return t[t.R=4096]="R",t[t.G=256]="G",t[t.B=16]="B",t[t.A=1]="A",t})({});var Ql=class extends Float32Array{constructor(){throw super(),new Error("Unsupported typed array instantiation.")}},ss={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5131:typeof Float16Array<"u"?Float16Array:Ql,5126:Float32Array,5130:Float64Array},H=class{static createBufferFromDataURI(t){if(typeof Buffer>"u"){let e=atob(t.split(",")[1]),a=new Uint8Array(e.length);for(let s=0;s<e.length;s++)a[s]=e.charCodeAt(s);return a}else{let e=t.split(",")[1],a=t.indexOf("base64")>=0;return Buffer.from(e,a?"base64":"utf8")}}static encodeText(t){return new TextEncoder().encode(t)}static decodeText(t){return new TextDecoder().decode(t)}static concat(t){let e=0;for(let r of t)e+=r.byteLength;let a=new Uint8Array(e),s=0;for(let r of t)a.set(r,s),s+=r.byteLength;return a}static pad(t,e=0){let a=this.padNumber(t.byteLength);if(a===t.byteLength)return t;let s=new Uint8Array(a);if(s.set(t),e!==0)for(let r=t.byteLength;r<a;r++)s[r]=e;return s}static padNumber(t){return Math.ceil(t/4)*4}static equals(t,e){if(t===e)return!0;if(t.byteLength!==e.byteLength)return!1;let a=t.byteLength;for(;a--;)if(t[a]!==e[a])return!1;return!0}static toView(t,e=0,a=1/0){return new Uint8Array(t.buffer,t.byteOffset+e,Math.min(t.byteLength,a))}static assertView(t){if(t&&!ArrayBuffer.isView(t))throw new Error(`Method requires Uint8Array parameter; received "${typeof t}".`);return t}};var Zl=class{match(t){return t.length>=3&&t[0]===255&&t[1]===216&&t[2]===255}getSize(t){let e=new DataView(t.buffer,t.byteOffset+4),a,s;for(;e.byteLength;){if(a=e.getUint16(0,!1),td(e,a),s=e.getUint8(a+1),s===192||s===193||s===194)return[e.getUint16(a+7,!1),e.getUint16(a+5,!1)];e=new DataView(t.buffer,e.byteOffset+a+2)}throw new TypeError("Invalid JPG, no size found")}getChannels(t){return 3}},ed=class ai{static PNG_FRIED_CHUNK_NAME="CgBI";match(e){return e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71&&e[4]===13&&e[5]===10&&e[6]===26&&e[7]===10}getSize(e){let a=new DataView(e.buffer,e.byteOffset);return H.decodeText(e.slice(12,16))===ai.PNG_FRIED_CHUNK_NAME?[a.getUint32(32,!1),a.getUint32(36,!1)]:[a.getUint32(16,!1),a.getUint32(20,!1)]}getChannels(e){return 4}},Je=class{static impls={"image/jpeg":new Zl,"image/png":new ed};static registerFormat(t,e){this.impls[t]=e}static getMimeType(t){for(let e in this.impls)if(this.impls[e].match(t))return e;return null}static getSize(t,e){return this.impls[e]?this.impls[e].getSize(t):null}static getChannels(t,e){return this.impls[e]?this.impls[e].getChannels(t):null}static getVRAMByteLength(t,e){if(!this.impls[e])return null;if(this.impls[e].getVRAMByteLength)return this.impls[e].getVRAMByteLength(t);let a=0,s=4,r=this.getSize(t,e);if(!r)return null;for(;r[0]>1||r[1]>1;)a+=r[0]*r[1]*s,r[0]=Math.max(Math.floor(r[0]/2),1),r[1]=Math.max(Math.floor(r[1]/2),1);return a+=1*s,a}static mimeTypeToExtension(t){return t==="image/jpeg"?"jpg":t.split("/").pop()}static extensionToMimeType(t){return t==="jpg"?"image/jpeg":t?`image/${t}`:""}};function td(t,e){if(e>t.byteLength)throw new TypeError("Corrupt JPG, exceeded buffer limits");if(t.getUint8(e)!==255)throw new TypeError("Invalid JPG, marker table corrupted");return t}var Qt=class{static basename(t){let e=t.split(/[\\/]/).pop();return e.substring(0,e.lastIndexOf("."))}static extension(t){if(t.startsWith("data:image/")){let e=t.match(/data:(image\/\w+)/)[1];return Je.mimeTypeToExtension(e)}else{if(t.startsWith("data:model/gltf+json"))return"gltf";if(t.startsWith("data:model/gltf-binary"))return"glb";if(t.startsWith("data:application/"))return"bin"}return t.split(/[\\/]/).pop().split(/[.]/).pop()}},yr=typeof Float32Array<"u"?Float32Array:Array;Math.PI/180;180/Math.PI;function ad(){var t=new yr(3);return yr!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function gr(t){var e=t[0],a=t[1],s=t[2];return Math.sqrt(e*e+a*a+s*s)}function sd(t,e,a){var s=e[0],r=e[1],n=e[2],i=a[3]*s+a[7]*r+a[11]*n+a[15];return i=i||1,t[0]=(a[0]*s+a[4]*r+a[8]*n+a[12])/i,t[1]=(a[1]*s+a[5]*r+a[9]*n+a[13])/i,t[2]=(a[2]*s+a[6]*r+a[10]*n+a[14])/i,t}(function(){var t=ad();return function(e,a,s,r,n,i){var o,c;for(a||(a=3),s||(s=0),r?c=Math.min(r*a+s,e.length):c=e.length,o=s;o<c;o+=a)t[0]=e[o],t[1]=e[o+1],t[2]=e[o+2],n(t,t,i),e[o]=t[0],e[o+1]=t[1],e[o+2]=t[2];return e}})();function si(t){let e=ri(),a=t.propertyType==="Node"?[t]:t.listChildren();for(let s of a)s.traverse(r=>{let n=r.getMesh();if(!n)return;let i=rd(n,r.getWorldMatrix());i.min.every(isFinite)&&i.max.every(isFinite)&&(xr(i.min,e),xr(i.max,e))});return e}function rd(t,e){let a=ri();for(let s of t.listPrimitives()){let r=s.getAttribute("POSITION"),n=s.getIndices();if(!r)continue;let i=[0,0,0],o=[0,0,0];for(let c=0,d=n?n.getCount():r.getCount();c<d;c++){let b=n?n.getScalar(c):c;i=r.getElement(b,i),o=sd(o,i,e),xr(o,a)}}return a}function xr(t,e){for(let a=0;a<3;a++)e.min[a]=Math.min(t[a],e.min[a]),e.max[a]=Math.max(t[a],e.max[a])}function ri(){return{min:[1/0,1/0,1/0],max:[-1/0,-1/0,-1/0]}}var Jn="https://null.example",mr=class{static DEFAULT_INIT={};static PROTOCOL_REGEXP=/^[a-zA-Z]+:\/\//;static dirname(t){let e=t.lastIndexOf("/");return e===-1?"./":t.substring(0,e+1)}static basename(t){return Qt.basename(new URL(t,Jn).pathname)}static extension(t){return Qt.extension(new URL(t,Jn).pathname)}static resolve(t,e){if(!this.isRelativePath(e))return e;let a=t.split("/"),s=e.split("/");a.pop();for(let r=0;r<s.length;r++)s[r]!=="."&&(s[r]===".."?a.pop():a.push(s[r]));return a.join("/")}static isAbsoluteURL(t){return this.PROTOCOL_REGEXP.test(t)}static isRelativePath(t){return!/^(?:[a-zA-Z]+:)?\//.test(t)}};function Yn(t){return Object.prototype.toString.call(t)==="[object Object]"}function Lt(t){if(Yn(t)===!1)return!1;let e=t.constructor;if(e===void 0)return!0;let a=e.prototype;return!(Yn(a)===!1||Object.hasOwn(a,"isPrototypeOf")===!1)}var nd=(function(t){return t[t.SILENT=4]="SILENT",t[t.ERROR=3]="ERROR",t[t.WARN=2]="WARN",t[t.INFO=1]="INFO",t[t.DEBUG=0]="DEBUG",t})({}),rs=class ni{verbosity;static Verbosity=nd;static DEFAULT_INSTANCE=new ni(1);constructor(e){this.verbosity=e}debug(e){this.verbosity<=0&&console.debug(e)}info(e){this.verbosity<=1&&console.info(e)}warn(e){this.verbosity<=2&&console.warn(e)}error(e){this.verbosity<=3&&console.error(e)}};function id(t){var e=t[0],a=t[1],s=t[2],r=t[3],n=t[4],i=t[5],o=t[6],c=t[7],d=t[8],b=t[9],f=t[10],v=t[11],x=t[12],h=t[13],l=t[14],g=t[15],u=e*i-a*n,p=e*o-s*n,y=a*o-s*i,w=d*h-b*x,T=d*l-f*x,I=b*l-f*h,S=e*I-a*T+s*w,R=n*I-i*T+o*w,_=d*y-b*p+f*u,A=x*y-h*p+l*u;return c*S-r*R+g*_-v*A}function od(t,e,a){var s=e[0],r=e[1],n=e[2],i=e[3],o=e[4],c=e[5],d=e[6],b=e[7],f=e[8],v=e[9],x=e[10],h=e[11],l=e[12],g=e[13],u=e[14],p=e[15],y=a[0],w=a[1],T=a[2],I=a[3];return t[0]=y*s+w*o+T*f+I*l,t[1]=y*r+w*c+T*v+I*g,t[2]=y*n+w*d+T*x+I*u,t[3]=y*i+w*b+T*h+I*p,y=a[4],w=a[5],T=a[6],I=a[7],t[4]=y*s+w*o+T*f+I*l,t[5]=y*r+w*c+T*v+I*g,t[6]=y*n+w*d+T*x+I*u,t[7]=y*i+w*b+T*h+I*p,y=a[8],w=a[9],T=a[10],I=a[11],t[8]=y*s+w*o+T*f+I*l,t[9]=y*r+w*c+T*v+I*g,t[10]=y*n+w*d+T*x+I*u,t[11]=y*i+w*b+T*h+I*p,y=a[12],w=a[13],T=a[14],I=a[15],t[12]=y*s+w*o+T*f+I*l,t[13]=y*r+w*c+T*v+I*g,t[14]=y*n+w*d+T*x+I*u,t[15]=y*i+w*b+T*h+I*p,t}function cd(t,e){var a=e[0],s=e[1],r=e[2],n=e[4],i=e[5],o=e[6],c=e[8],d=e[9],b=e[10];return t[0]=Math.sqrt(a*a+s*s+r*r),t[1]=Math.sqrt(n*n+i*i+o*o),t[2]=Math.sqrt(c*c+d*d+b*b),t}function ld(t,e){var a=new yr(3);cd(a,e);var s=1/a[0],r=1/a[1],n=1/a[2],i=e[0]*s,o=e[1]*r,c=e[2]*n,d=e[4]*s,b=e[5]*r,f=e[6]*n,v=e[8]*s,x=e[9]*r,h=e[10]*n,l=i+b+h,g=0;return l>0?(g=Math.sqrt(l+1)*2,t[3]=.25*g,t[0]=(f-x)/g,t[1]=(v-c)/g,t[2]=(o-d)/g):i>b&&i>h?(g=Math.sqrt(1+i-b-h)*2,t[3]=(f-x)/g,t[0]=.25*g,t[1]=(o+d)/g,t[2]=(v+c)/g):b>h?(g=Math.sqrt(1+b-i-h)*2,t[3]=(v-c)/g,t[0]=(o+d)/g,t[1]=.25*g,t[2]=(f+x)/g):(g=Math.sqrt(1+h-i-b)*2,t[3]=(o-d)/g,t[0]=(v+c)/g,t[1]=(f+x)/g,t[2]=.25*g),t}var ne=class ba{static identity(e){return e}static eq(e,a,s=1e-5){if(e.length!==a.length)return!1;for(let r=0;r<e.length;r++)if(Math.abs(e[r]-a[r])>s)return!1;return!0}static clamp(e,a,s){return e<a?a:e>s?s:e}static decodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return e/65535;case 5121:return e/255;case 5122:return Math.max(e/32767,-1);case 5120:return Math.max(e/127,-1);default:throw new Error("Invalid component type.")}}static encodeNormalizedInt(e,a){switch(a){case 5126:return e;case 5123:return Math.round(ba.clamp(e,0,1)*65535);case 5121:return Math.round(ba.clamp(e,0,1)*255);case 5122:return Math.round(ba.clamp(e,-1,1)*32767);case 5120:return Math.round(ba.clamp(e,-1,1)*127);default:throw new Error("Invalid component type.")}}static decompose(e,a,s,r){let n=gr([e[0],e[1],e[2]]),i=gr([e[4],e[5],e[6]]),o=gr([e[8],e[9],e[10]]);id(e)<0&&(n=-n),a[0]=e[12],a[1]=e[13],a[2]=e[14];let c=e.slice(),d=1/n,b=1/i,f=1/o;c[0]*=d,c[1]*=d,c[2]*=d,c[4]*=b,c[5]*=b,c[6]*=b,c[8]*=f,c[9]*=f,c[10]*=f,ld(s,c),r[0]=n,r[1]=i,r[2]=o}static compose(e,a,s,r){let n=r,i=a[0],o=a[1],c=a[2],d=a[3],b=i+i,f=o+o,v=c+c,x=i*b,h=i*f,l=i*v,g=o*f,u=o*v,p=c*v,y=d*b,w=d*f,T=d*v,I=s[0],S=s[1],R=s[2];return n[0]=(1-(g+p))*I,n[1]=(h+T)*I,n[2]=(l-w)*I,n[3]=0,n[4]=(h-T)*S,n[5]=(1-(x+p))*S,n[6]=(u+y)*S,n[7]=0,n[8]=(l+w)*R,n[9]=(u-y)*R,n[10]=(1-(x+g))*R,n[11]=0,n[12]=e[0],n[13]=e[1],n[14]=e[2],n[15]=1,n}};function dd(t,e){if(!!t!=!!e)return!1;let a=t.getChild(),s=e.getChild();return a===s||a.equals(s)}function ud(t,e){if(!!t!=!!e)return!1;let a=t.values(),s=e.values();if(a.length!==s.length)return!1;for(let r=0;r<a.length;r++){let n=a[r],i=s[r];if(n.getChild()!==i.getChild()&&!n.getChild().equals(i.getChild()))return!1}return!0}function fd(t,e){if(!!t!=!!e)return!1;let a=t.keys(),s=e.keys();if(a.length!==s.length)return!1;for(let r of a){let n=t.get(r),i=e.get(r);if(!!n!=!!i)return!1;let o=n.getChild(),c=i.getChild();if(o!==c&&!o.equals(c))return!1}return!0}function ii(t,e){if(t===e)return!0;if(!!t!=!!e||!t||!e||t.length!==e.length)return!1;for(let a=0;a<t.length;a++)if(t[a]!==e[a])return!1;return!0}function oi(t,e){if(t===e)return!0;if(!!t!=!!e)return!1;if(!Lt(t)||!Lt(e))return t===e;let a=t,s=e,r=0,n=0,i;for(i in a)r++;for(i in s)n++;if(r!==n)return!1;for(i in a){let o=a[i],c=s[i];if(ts(o)&&ts(c)){if(!ii(o,c))return!1}else if(Lt(o)&&Lt(c)){if(!oi(o,c))return!1}else if(o!==c)return!1}return!0}function ts(t){return Array.isArray(t)||ArrayBuffer.isView(t)}var hd="23456789abdegjkmnpqrvwxyzABDEGJKMNPQRVWXYZ",bd=999,pd=6,$n=new Set,gd=function(){let t="";for(let e=0;e<pd;e++)t+=hd.charAt(Math.floor(Math.random()*42));return t},md=function(){for(let t=0;t<bd;t++){let e=gd();if(!$n.has(e))return $n.add(e),e}return""},bt=t=>t,yd=new Set,Er=class extends Xn{constructor(t,e=""){super(t),this[Q].name=e,this.init(),this.dispatchEvent({type:"create"})}getGraph(){return this.graph}getDefaults(){return Object.assign(super.getDefaults(),{name:"",extras:{}})}set(t,e){return Array.isArray(e)&&(e=e.slice()),super.set(t,e)}getName(){return this.get("name")}setName(t){return this.set("name",t)}getExtras(){return this.get("extras")}setExtras(t){return this.set("extras",t)}clone(){let t=this.constructor;return new t(this.graph).copy(this,bt)}copy(t,e=bt){for(let a in this[Q]){let s=this[Q][a];if(s instanceof ut)this[dt].has(a)||s.dispose();else if(s instanceof me||s instanceof ae)for(let r of s.values())r.dispose();else if(s instanceof ue)for(let r of s.values())r.dispose()}for(let a in t[Q]){let s=this[Q][a],r=t[Q][a];if(r instanceof ut)this[dt].has(a)?s.getChild().copy(e(r.getChild()),e):this.setRef(a,e(r.getChild()),r.getAttributes());else if(r instanceof ae||r instanceof me)for(let n of r.values())this.addRef(a,e(n.getChild()),n.getAttributes());else if(r instanceof ue)for(let n of r.keys()){let i=r.get(n);this.setRefMap(a,n,e(i.getChild()),i.getAttributes())}else Lt(r)?this[Q][a]=JSON.parse(JSON.stringify(r)):Array.isArray(r)||r instanceof ArrayBuffer||ArrayBuffer.isView(r)?this[Q][a]=r.slice():this[Q][a]=r}return this}equals(t,e=yd){if(this===t)return!0;if(this.propertyType!==t.propertyType)return!1;for(let a in this[Q]){if(e.has(a))continue;let s=this[Q][a],r=t[Q][a];if(s instanceof ut||r instanceof ut){if(!dd(s,r))return!1}else if(s instanceof ae||r instanceof ae||s instanceof me||r instanceof me){if(!ud(s,r))return!1}else if(s instanceof ue||r instanceof ue){if(!fd(s,r))return!1}else if(Lt(s)||Lt(r)){if(!oi(s,r))return!1}else if(ts(s)||ts(r)){if(!ii(s,r))return!1}else if(s!==r)return!1}return!0}detach(){return this.graph.disconnectParents(this,t=>t.propertyType!=="Root"),this}listParents(){return this.graph.listParents(this)}},Ee=class extends Er{getDefaults(){return Object.assign(super.getDefaults(),{extensions:new ue})}getExtension(t){return this.getRefMap("extensions",t)}setExtension(t,e){return e&&e._validateParent(this),this.setRefMap("extensions",t,e)}listExtensions(){return this.listRefMapValues("extensions")}},U=class fe extends Ee{static Type={SCALAR:"SCALAR",VEC2:"VEC2",VEC3:"VEC3",VEC4:"VEC4",MAT2:"MAT2",MAT3:"MAT3",MAT4:"MAT4"};static ComponentType={BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,FLOAT:5126,FLOAT16:5131,FLOAT64:5130};init(){this.propertyType="Accessor"}getDefaults(){return Object.assign(super.getDefaults(),{array:null,type:fe.Type.SCALAR,componentType:fe.ComponentType.FLOAT,normalized:!1,sparse:!1,buffer:null})}static getElementSize(e){switch(e){case fe.Type.SCALAR:return 1;case fe.Type.VEC2:return 2;case fe.Type.VEC3:return 3;case fe.Type.VEC4:return 4;case fe.Type.MAT2:return 4;case fe.Type.MAT3:return 9;case fe.Type.MAT4:return 16;default:throw new Error("Unexpected type: "+e)}}static getComponentSize(e){switch(e){case fe.ComponentType.BYTE:case fe.ComponentType.UNSIGNED_BYTE:return 1;case fe.ComponentType.SHORT:case fe.ComponentType.UNSIGNED_SHORT:return 2;case fe.ComponentType.UNSIGNED_INT:case fe.ComponentType.FLOAT:return 4;case fe.ComponentType.FLOAT16:return 2;case fe.ComponentType.FLOAT64:return 8;default:throw new Error("Unexpected component type: "+e)}}getMinNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),r=this.getComponentType();if(this.getMin(e),a)for(let n=0;n<s;n++)e[n]=ne.decodeNormalizedInt(e[n],r);return e}getMin(e){let a=this.getArray(),s=this.getCount(),r=this.getElementSize();for(let n=0;n<r;n++)e[n]=1/0;for(let n=0;n<s*r;n+=r)for(let i=0;i<r;i++){let o=a[n+i];Number.isFinite(o)&&(e[i]=Math.min(e[i],o))}return e}getMaxNormalized(e){let a=this.getNormalized(),s=this.getElementSize(),r=this.getComponentType();if(this.getMax(e),a)for(let n=0;n<s;n++)e[n]=ne.decodeNormalizedInt(e[n],r);return e}getMax(e){let a=this.get("array"),s=this.getCount(),r=this.getElementSize();for(let n=0;n<r;n++)e[n]=-1/0;for(let n=0;n<s*r;n+=r)for(let i=0;i<r;i++){let o=a[n+i];Number.isFinite(o)&&(e[i]=Math.max(e[i],o))}return e}getCount(){let e=this.get("array");return e?e.length/this.getElementSize():0}getType(){return this.get("type")}setType(e){return this.set("type",e)}getElementSize(){return fe.getElementSize(this.get("type"))}getComponentSize(){return this.get("array").BYTES_PER_ELEMENT}getComponentType(){return this.get("componentType")}getNormalized(){return this.get("normalized")}setNormalized(e){return this.set("normalized",e)}getScalar(e){let a=this.getElementSize(),s=this.getComponentType(),r=this.getArray();return this.getNormalized()?ne.decodeNormalizedInt(r[e*a],s):r[e*a]}setScalar(e,a){let s=this.getElementSize(),r=this.getComponentType(),n=this.getArray();return this.getNormalized()?n[e*s]=ne.encodeNormalizedInt(a,r):n[e*s]=a,this}getElement(e,a){let s=this.getNormalized(),r=this.getElementSize(),n=this.getComponentType(),i=this.getArray();for(let o=0;o<r;o++)s?a[o]=ne.decodeNormalizedInt(i[e*r+o],n):a[o]=i[e*r+o];return a}setElement(e,a){let s=this.getNormalized(),r=this.getElementSize(),n=this.getComponentType(),i=this.getArray();for(let o=0;o<r;o++)s?i[e*r+o]=ne.encodeNormalizedInt(a[o],n):i[e*r+o]=a[o];return this}getSparse(){return this.get("sparse")}setSparse(e){return this.set("sparse",e)}getBuffer(){return this.getRef("buffer")}setBuffer(e){return this.setRef("buffer",e)}getArray(){return this.get("array")}setArray(e){return this.set("componentType",e?xd(e):fe.ComponentType.FLOAT),this.set("array",e),this}getByteLength(){let e=this.get("array");return e?e.byteLength:0}};function xd(t){switch(t.constructor){case Float32Array:return U.ComponentType.FLOAT;case Uint32Array:return U.ComponentType.UNSIGNED_INT;case Uint16Array:return U.ComponentType.UNSIGNED_SHORT;case Uint8Array:return U.ComponentType.UNSIGNED_BYTE;case Int16Array:return U.ComponentType.SHORT;case Int8Array:return U.ComponentType.BYTE;case Float64Array:return U.ComponentType.FLOAT64}if(typeof Float16Array<"u"&&t.constructor===Float16Array)return U.ComponentType.FLOAT16;throw new Error("Unknown accessor componentType.")}var ci=class extends Ee{init(){this.propertyType="Animation"}getDefaults(){return Object.assign(super.getDefaults(),{channels:new ae,samplers:new ae})}addChannel(t){return this.addRef("channels",t)}removeChannel(t){return this.removeRef("channels",t)}listChannels(){return this.listRefs("channels")}addSampler(t){return this.addRef("samplers",t)}removeSampler(t){return this.removeRef("samplers",t)}listSamplers(){return this.listRefs("samplers")}},kr=class extends Ee{static TargetPath={TRANSLATION:"translation",ROTATION:"rotation",SCALE:"scale",WEIGHTS:"weights"};init(){this.propertyType="AnimationChannel"}getDefaults(){return Object.assign(super.getDefaults(),{targetPath:null,targetNode:null,sampler:null})}getTargetPath(){return this.get("targetPath")}setTargetPath(t){return this.set("targetPath",t)}getTargetNode(){return this.getRef("targetNode")}setTargetNode(t){return this.setRef("targetNode",t)}getSampler(){return this.getRef("sampler")}setSampler(t){return this.setRef("sampler",t)}},ns=class li extends Ee{static Interpolation={LINEAR:"LINEAR",STEP:"STEP",CUBICSPLINE:"CUBICSPLINE"};init(){this.propertyType="AnimationSampler"}getDefaultAttributes(){return Object.assign(super.getDefaults(),{interpolation:li.Interpolation.LINEAR,input:null,output:null})}getInterpolation(){return this.get("interpolation")}setInterpolation(e){return this.set("interpolation",e)}getInput(){return this.getRef("input")}setInput(e){return this.setRef("input",e,{usage:"OTHER"})}getOutput(){return this.getRef("output")}setOutput(e){return this.setRef("output",e,{usage:"OTHER"})}},di=class extends Ee{init(){this.propertyType="Buffer"}getDefaults(){return Object.assign(super.getDefaults(),{uri:""})}getURI(){return this.get("uri")}setURI(t){return this.set("uri",t)}},is=class ui extends Ee{static Type={PERSPECTIVE:"perspective",ORTHOGRAPHIC:"orthographic"};init(){this.propertyType="Camera"}getDefaults(){return Object.assign(super.getDefaults(),{type:ui.Type.PERSPECTIVE,znear:.1,zfar:100,aspectRatio:null,yfov:Math.PI*2*50/360,xmag:1,ymag:1})}getType(){return this.get("type")}setType(e){return this.set("type",e)}getZNear(){return this.get("znear")}setZNear(e){return this.set("znear",e)}getZFar(){return this.get("zfar")}setZFar(e){return this.set("zfar",e)}getAspectRatio(){return this.get("aspectRatio")}setAspectRatio(e){return this.set("aspectRatio",e)}getYFov(){return this.get("yfov")}setYFov(e){return this.set("yfov",e)}getXMag(){return this.get("xmag")}setXMag(e){return this.set("xmag",e)}getYMag(){return this.get("ymag")}setYMag(e){return this.set("ymag",e)}},X=class extends Er{static EXTENSION_NAME;_validateParent(t){if(!this.parentTypes.includes(t.propertyType))throw new Error(`Parent "${t.propertyType}" invalid for child "${this.propertyType}".`)}},se=class vr extends Ee{static WrapMode={CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497};static MagFilter={NEAREST:9728,LINEAR:9729};static MinFilter={NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987};init(){this.propertyType="TextureInfo"}getDefaults(){return Object.assign(super.getDefaults(),{texCoord:0,magFilter:null,minFilter:null,wrapS:vr.WrapMode.REPEAT,wrapT:vr.WrapMode.REPEAT})}getTexCoord(){return this.get("texCoord")}setTexCoord(e){return this.set("texCoord",e)}getMagFilter(){return this.get("magFilter")}setMagFilter(e){return this.set("magFilter",e)}getMinFilter(){return this.get("minFilter")}setMinFilter(e){return this.set("minFilter",e)}getWrapS(){return this.get("wrapS")}setWrapS(e){return this.set("wrapS",e)}getWrapT(){return this.get("wrapT")}setWrapT(e){return this.set("wrapT",e)}},{R:Ya,G:$a,B:Qa,A:vd}=Ke,as=class fi extends Ee{static AlphaMode={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};init(){this.propertyType="Material"}getDefaults(){return Object.assign(super.getDefaults(),{alphaMode:fi.AlphaMode.OPAQUE,alphaCutoff:.5,doubleSided:!1,baseColorFactor:[1,1,1,1],baseColorTexture:null,baseColorTextureInfo:new se(this.graph,"baseColorTextureInfo"),emissiveFactor:[0,0,0],emissiveTexture:null,emissiveTextureInfo:new se(this.graph,"emissiveTextureInfo"),normalScale:1,normalTexture:null,normalTextureInfo:new se(this.graph,"normalTextureInfo"),occlusionStrength:1,occlusionTexture:null,occlusionTextureInfo:new se(this.graph,"occlusionTextureInfo"),roughnessFactor:1,metallicFactor:1,metallicRoughnessTexture:null,metallicRoughnessTextureInfo:new se(this.graph,"metallicRoughnessTextureInfo")})}getDoubleSided(){return this.get("doubleSided")}setDoubleSided(e){return this.set("doubleSided",e)}getAlpha(){return this.get("baseColorFactor")[3]}setAlpha(e){let a=this.get("baseColorFactor").slice();return a[3]=e,this.set("baseColorFactor",a)}getAlphaMode(){return this.get("alphaMode")}setAlphaMode(e){return this.set("alphaMode",e)}getAlphaCutoff(){return this.get("alphaCutoff")}setAlphaCutoff(e){return this.set("alphaCutoff",e)}getBaseColorFactor(){return this.get("baseColorFactor")}setBaseColorFactor(e){return this.set("baseColorFactor",e)}getBaseColorTexture(){return this.getRef("baseColorTexture")}getBaseColorTextureInfo(){return this.getRef("baseColorTexture")?this.getRef("baseColorTextureInfo"):null}setBaseColorTexture(e){return this.setRef("baseColorTexture",e,{channels:Ya|$a|Qa|vd,isColor:!0})}getEmissiveFactor(){return this.get("emissiveFactor")}setEmissiveFactor(e){return this.set("emissiveFactor",e)}getEmissiveTexture(){return this.getRef("emissiveTexture")}getEmissiveTextureInfo(){return this.getRef("emissiveTexture")?this.getRef("emissiveTextureInfo"):null}setEmissiveTexture(e){return this.setRef("emissiveTexture",e,{channels:Ya|$a|Qa,isColor:!0})}getNormalScale(){return this.get("normalScale")}setNormalScale(e){return this.set("normalScale",e)}getNormalTexture(){return this.getRef("normalTexture")}getNormalTextureInfo(){return this.getRef("normalTexture")?this.getRef("normalTextureInfo"):null}setNormalTexture(e){return this.setRef("normalTexture",e,{channels:Ya|$a|Qa})}getOcclusionStrength(){return this.get("occlusionStrength")}setOcclusionStrength(e){return this.set("occlusionStrength",e)}getOcclusionTexture(){return this.getRef("occlusionTexture")}getOcclusionTextureInfo(){return this.getRef("occlusionTexture")?this.getRef("occlusionTextureInfo"):null}setOcclusionTexture(e){return this.setRef("occlusionTexture",e,{channels:Ya})}getRoughnessFactor(){return this.get("roughnessFactor")}setRoughnessFactor(e){return this.set("roughnessFactor",e)}getMetallicFactor(){return this.get("metallicFactor")}setMetallicFactor(e){return this.set("metallicFactor",e)}getMetallicRoughnessTexture(){return this.getRef("metallicRoughnessTexture")}getMetallicRoughnessTextureInfo(){return this.getRef("metallicRoughnessTexture")?this.getRef("metallicRoughnessTextureInfo"):null}setMetallicRoughnessTexture(e){return this.setRef("metallicRoughnessTexture",e,{channels:$a|Qa})}},hi=class extends Ee{init(){this.propertyType="Mesh"}getDefaults(){return Object.assign(super.getDefaults(),{weights:[],primitives:new ae})}addPrimitive(t){return this.addRef("primitives",t)}removePrimitive(t){return this.removeRef("primitives",t)}listPrimitives(){return this.listRefs("primitives")}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}},bi=class extends Ee{init(){this.propertyType="Node"}getDefaults(){return Object.assign(super.getDefaults(),{translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1],weights:[],camera:null,mesh:null,skin:null,children:new ae})}copy(t,e=bt){if(e===bt)throw new Error("Node cannot be copied.");return super.copy(t,e)}getTranslation(){return this.get("translation")}getRotation(){return this.get("rotation")}getScale(){return this.get("scale")}setTranslation(t){return this.set("translation",t)}setRotation(t){return this.set("rotation",t)}setScale(t){return this.set("scale",t)}getMatrix(){return ne.compose(this.get("translation"),this.get("rotation"),this.get("scale"),[])}setMatrix(t){let e=this.get("translation").slice(),a=this.get("rotation").slice(),s=this.get("scale").slice();return ne.decompose(t,e,a,s),this.set("translation",e).set("rotation",a).set("scale",s)}getWorldTranslation(){let t=[0,0,0];return ne.decompose(this.getWorldMatrix(),t,[0,0,0,1],[1,1,1]),t}getWorldRotation(){let t=[0,0,0,1];return ne.decompose(this.getWorldMatrix(),[0,0,0],t,[1,1,1]),t}getWorldScale(){let t=[1,1,1];return ne.decompose(this.getWorldMatrix(),[0,0,0],[0,0,0,1],t),t}getWorldMatrix(){let t=[];for(let s=this;s!=null;s=s.getParentNode())t.push(s);let e,a=t.pop().getMatrix();for(;e=t.pop();)od(a,a,e.getMatrix());return a}addChild(t){let e=t.getParentNode();e&&e.removeChild(t);for(let a of t.listParents())a.propertyType==="Scene"&&a.removeChild(t);return this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}getParentNode(){for(let t of this.listParents())if(t.propertyType==="Node")return t;return null}getMesh(){return this.getRef("mesh")}setMesh(t){return this.setRef("mesh",t)}getCamera(){return this.getRef("camera")}setCamera(t){return this.setRef("camera",t)}getSkin(){return this.getRef("skin")}setSkin(t){return this.setRef("skin",t)}getWeights(){return this.get("weights")}setWeights(t){return this.set("weights",t)}traverse(t){t(this);for(let e of this.listChildren())e.traverse(t);return this}},pa=class pi extends Ee{static Mode={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6};init(){this.propertyType="Primitive"}getDefaults(){return Object.assign(super.getDefaults(),{mode:pi.Mode.TRIANGLES,material:null,indices:null,attributes:new ue,targets:new ae})}getIndices(){return this.getRef("indices")}setIndices(e){return this.setRef("indices",e,{usage:"ELEMENT_ARRAY_BUFFER"})}getAttribute(e){return this.getRefMap("attributes",e)}setAttribute(e,a){return this.setRefMap("attributes",e,a,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}getMaterial(){return this.getRef("material")}setMaterial(e){return this.setRef("material",e)}getMode(){return this.get("mode")}setMode(e){return this.set("mode",e)}listTargets(){return this.listRefs("targets")}addTarget(e){return this.addRef("targets",e)}removeTarget(e){return this.removeRef("targets",e)}},wd=class extends Er{init(){this.propertyType="PrimitiveTarget"}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:"ARRAY_BUFFER"})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},gi=class extends Ee{init(){this.propertyType="Scene"}getDefaults(){return Object.assign(super.getDefaults(),{children:new ae})}copy(t,e=bt){if(e===bt)throw new Error("Scene cannot be copied.");return super.copy(t,e)}addChild(t){let e=t.getParentNode();return e&&e.removeChild(t),this.addRef("children",t)}removeChild(t){return this.removeRef("children",t)}listChildren(){return this.listRefs("children")}traverse(t){for(let e of this.listChildren())e.traverse(t);return this}},mi=class extends Ee{init(){this.propertyType="Skin"}getDefaults(){return Object.assign(super.getDefaults(),{skeleton:null,inverseBindMatrices:null,joints:new ae})}getSkeleton(){return this.getRef("skeleton")}setSkeleton(t){return this.setRef("skeleton",t)}getInverseBindMatrices(){return this.getRef("inverseBindMatrices")}setInverseBindMatrices(t){return this.setRef("inverseBindMatrices",t,{usage:"INVERSE_BIND_MATRICES"})}addJoint(t){return this.addRef("joints",t)}removeJoint(t){return this.removeRef("joints",t)}listJoints(){return this.listRefs("joints")}},yi=class extends Ee{init(){this.propertyType="Texture"}getDefaults(){return Object.assign(super.getDefaults(),{image:null,mimeType:"",uri:""})}getMimeType(){return this.get("mimeType")||Je.extensionToMimeType(Qt.extension(this.get("uri")))}setMimeType(t){return this.set("mimeType",t)}getURI(){return this.get("uri")}setURI(t){this.set("uri",t);let e=Je.extensionToMimeType(Qt.extension(t));return e&&this.set("mimeType",e),this}getImage(){return this.get("image")}setImage(t){return this.set("image",H.assertView(t))}getSize(){let t=this.get("image");return t?Je.getSize(t,this.getMimeType()):null}},Tr=class extends Ee{_extensions=new Set;init(){this.propertyType="Root"}getDefaults(){return Object.assign(super.getDefaults(),{asset:{generator:`glTF-Transform ${ti}`,version:"2.0"},defaultScene:null,accessors:new ae,animations:new ae,buffers:new ae,cameras:new ae,materials:new ae,meshes:new ae,nodes:new ae,scenes:new ae,skins:new ae,textures:new ae})}constructor(t){super(t),t.addEventListener("node:create",e=>{this._addChildOfRoot(e.target)})}clone(){throw new Error("Root cannot be cloned.")}copy(t,e=bt){if(e===bt)throw new Error("Root cannot be copied.");this.set("asset",{...t.get("asset")}),this.setName(t.getName()),this.setExtras({...t.getExtras()}),this.setDefaultScene(t.getDefaultScene()?e(t.getDefaultScene()):null);for(let a of t.listRefMapKeys("extensions")){let s=t.getExtension(a);this.setExtension(a,e(s))}return this}_addChildOfRoot(t){return t instanceof gi?this.addRef("scenes",t):t instanceof bi?this.addRef("nodes",t):t instanceof is?this.addRef("cameras",t):t instanceof mi?this.addRef("skins",t):t instanceof hi?this.addRef("meshes",t):t instanceof as?this.addRef("materials",t):t instanceof yi?this.addRef("textures",t):t instanceof ci?this.addRef("animations",t):t instanceof U?this.addRef("accessors",t):t instanceof di&&this.addRef("buffers",t),this}getAsset(){return this.get("asset")}listExtensionsUsed(){return Array.from(this._extensions)}listExtensionsRequired(){return this.listExtensionsUsed().filter(t=>t.isRequired())}_enableExtension(t){return this._extensions.add(t),this}_disableExtension(t){return this._extensions.delete(t),this}listScenes(){return this.listRefs("scenes")}setDefaultScene(t){return this.setRef("defaultScene",t)}getDefaultScene(){return this.getRef("defaultScene")}listNodes(){return this.listRefs("nodes")}listCameras(){return this.listRefs("cameras")}listSkins(){return this.listRefs("skins")}listMeshes(){return this.listRefs("meshes")}listMaterials(){return this.listRefs("materials")}listTextures(){return this.listRefs("textures")}listAnimations(){return this.listRefs("animations")}listAccessors(){return this.listRefs("accessors")}listBuffers(){return this.listRefs("buffers")}},Ed=class wr{_graph=new pr;_root=new Tr(this._graph);_logger=rs.DEFAULT_INSTANCE;static _GRAPH_DOCUMENTS=new WeakMap;static fromGraph(e){return wr._GRAPH_DOCUMENTS.get(e)||null}constructor(){wr._GRAPH_DOCUMENTS.set(this._graph,this)}getRoot(){return this._root}getGraph(){return this._graph}getLogger(){return this._logger}setLogger(e){return this._logger=e,this}clone(){throw new Error("Use 'cloneDocument(source)' from '@gltf-transform/functions'.")}merge(e){throw new Error("Use 'mergeDocuments(target, source)' from '@gltf-transform/functions'.")}async transform(...e){let a=e.map(s=>s.name);for(let s of e)await s(this,{stack:a});return this}hasExtension(e){return this.getRoot().listExtensionsUsed().some(a=>a.extensionName===e)}createExtension(e){let a=e.EXTENSION_NAME;return this.getRoot().listExtensionsUsed().find(s=>s.extensionName===a)||new e(this)}disposeExtension(e){let a=this.getRoot().listExtensionsUsed().find(s=>s.extensionName===e);a&&a.dispose()}createScene(e=""){return new gi(this._graph,e)}createNode(e=""){return new bi(this._graph,e)}createCamera(e=""){return new is(this._graph,e)}createSkin(e=""){return new mi(this._graph,e)}createMesh(e=""){return new hi(this._graph,e)}createPrimitive(){return new pa(this._graph)}createPrimitiveTarget(e=""){return new wd(this._graph,e)}createMaterial(e=""){return new as(this._graph,e)}createTexture(e=""){return new yi(this._graph,e)}createAnimation(e=""){return new ci(this._graph,e)}createAnimationChannel(e=""){return new kr(this._graph,e)}createAnimationSampler(e=""){return new ns(this._graph,e)}createAccessor(e="",a=null){return a||(a=this.getRoot().listBuffers()[0]),new U(this._graph,e).setBuffer(a)}createBuffer(e=""){return new di(this._graph,e)}},ee=class{static EXTENSION_NAME;extensionName="";prereadTypes=[];prewriteTypes=[];readDependencies=[];writeDependencies=[];document;required=!1;properties=new Set;_listener;constructor(t){this.document=t,t.getRoot()._enableExtension(this),this._listener=a=>{let s=a,r=s.target;r instanceof X&&r.extensionName===this.extensionName&&(s.type==="node:create"&&this._addExtensionProperty(r),s.type==="node:dispose"&&this._removeExtensionProperty(r))};let e=t.getGraph();e.addEventListener("node:create",this._listener),e.addEventListener("node:dispose",this._listener)}dispose(){this.document.getRoot()._disableExtension(this);let t=this.document.getGraph();t.removeEventListener("node:create",this._listener),t.removeEventListener("node:dispose",this._listener);for(let e of this.properties)e.dispose()}static register(){}isRequired(){return this.required}setRequired(t){return this.required=t,this}listProperties(){return Array.from(this.properties)}_addExtensionProperty(t){return this.properties.add(t),this}_removeExtensionProperty(t){return this.properties.delete(t),this}install(t,e){return this}preread(t,e){return this}prewrite(t,e){return this}},kd=class{jsonDoc;buffers=[];bufferViews=[];bufferViewBuffers=[];accessors=[];textures=[];textureInfos=new Map;materials=[];meshes=[];cameras=[];nodes=[];skins=[];animations=[];scenes=[];constructor(t){this.jsonDoc=t}setTextureInfo(t,e){this.textureInfos.set(t,e),e.texCoord!==void 0&&t.setTexCoord(e.texCoord),e.extras!==void 0&&t.setExtras(e.extras);let a=this.jsonDoc.json.textures[e.index];if(a.sampler===void 0)return;let s=this.jsonDoc.json.samplers[a.sampler];s.magFilter!==void 0&&t.setMagFilter(s.magFilter),s.minFilter!==void 0&&t.setMinFilter(s.minFilter),s.wrapS!==void 0&&t.setWrapS(s.wrapS),s.wrapT!==void 0&&t.setWrapT(s.wrapT)}},Qn={logger:rs.DEFAULT_INSTANCE,extensions:[],dependencies:{}},Td=new Set(["Buffer","Texture","Material","Mesh","Primitive","Node","Scene"]),Md=class{static read(t,e=Qn){let a={...Qn,...e},{json:s}=t,r=new Ed().setLogger(a.logger);this.validate(t,a);let n=new kd(t),i=s.asset,o=r.getRoot().getAsset();i.copyright&&(o.copyright=i.copyright),i.extras&&(o.extras=i.extras),s.extras!==void 0&&r.getRoot().setExtras({...s.extras});let c=s.extensionsUsed||[],d=s.extensionsRequired||[];a.extensions.sort((u,p)=>u.EXTENSION_NAME>p.EXTENSION_NAME?1:-1);for(let u of a.extensions)if(c.includes(u.EXTENSION_NAME)){let p=r.createExtension(u).setRequired(d.includes(u.EXTENSION_NAME)),y=p.prereadTypes.filter(w=>!Td.has(w));y.length&&a.logger.warn(`Preread hooks for some types (${y.join()}), requested by extension ${p.extensionName}, are unsupported. Please file an issue or a PR.`);for(let w of p.readDependencies)p.install(w,a.dependencies[w])}let b=s.buffers||[];r.getRoot().listExtensionsUsed().filter(u=>u.prereadTypes.includes("Buffer")).forEach(u=>u.preread(n,"Buffer")),n.buffers=b.map(u=>{let p=r.createBuffer(u.name);return u.extras&&p.setExtras(u.extras),u.uri&&u.uri.indexOf("__")!==0&&p.setURI(u.uri),p}),n.bufferViewBuffers=(s.bufferViews||[]).map((u,p)=>{if(!n.bufferViews[p]){let y=t.json.buffers[u.buffer],w=y.uri?t.resources[y.uri]:t.resources[ht],T=u.byteOffset||0;n.bufferViews[p]=H.toView(w,T,u.byteLength)}return n.buffers[u.buffer]});let f=s.accessors||[];n.accessors=f.map(u=>{let p=n.bufferViewBuffers[u.bufferView],y=r.createAccessor(u.name,p).setType(u.type);return u.extras&&y.setExtras(u.extras),u.normalized!==void 0&&y.setNormalized(u.normalized),u.bufferView===void 0||y.setArray(es(u,n)),y});let v=s.images||[],x=s.textures||[];r.getRoot().listExtensionsUsed().filter(u=>u.prereadTypes.includes("Texture")).forEach(u=>u.preread(n,"Texture")),n.textures=v.map(u=>{let p=r.createTexture(u.name);if(u.extras&&p.setExtras(u.extras),u.bufferView!==void 0){let y=s.bufferViews[u.bufferView],w=t.json.buffers[y.buffer],T=w.uri?t.resources[w.uri]:t.resources[ht],I=y.byteOffset||0,S=y.byteLength,R=T.slice(I,I+S);p.setImage(R)}else u.uri!==void 0&&(p.setImage(t.resources[u.uri]),u.uri.indexOf("__")!==0&&p.setURI(u.uri));if(u.mimeType!==void 0)p.setMimeType(u.mimeType);else if(u.uri){let y=Qt.extension(u.uri);p.setMimeType(Je.extensionToMimeType(y))}return p}),r.getRoot().listExtensionsUsed().filter(u=>u.prereadTypes.includes("Material")).forEach(u=>u.preread(n,"Material")),n.materials=(s.materials||[]).map(u=>{let p=r.createMaterial(u.name);u.extras&&p.setExtras(u.extras),u.alphaMode!==void 0&&p.setAlphaMode(u.alphaMode),u.alphaCutoff!==void 0&&p.setAlphaCutoff(u.alphaCutoff),u.doubleSided!==void 0&&p.setDoubleSided(u.doubleSided);let y=u.pbrMetallicRoughness||{};if(y.baseColorFactor!==void 0&&p.setBaseColorFactor(y.baseColorFactor),u.emissiveFactor!==void 0&&p.setEmissiveFactor(u.emissiveFactor),y.metallicFactor!==void 0&&p.setMetallicFactor(y.metallicFactor),y.roughnessFactor!==void 0&&p.setRoughnessFactor(y.roughnessFactor),y.baseColorTexture!==void 0){let w=y.baseColorTexture,T=n.textures[x[w.index].source];p.setBaseColorTexture(T),n.setTextureInfo(p.getBaseColorTextureInfo(),w)}if(u.emissiveTexture!==void 0){let w=u.emissiveTexture,T=n.textures[x[w.index].source];p.setEmissiveTexture(T),n.setTextureInfo(p.getEmissiveTextureInfo(),w)}if(u.normalTexture!==void 0){let w=u.normalTexture,T=n.textures[x[w.index].source];p.setNormalTexture(T),n.setTextureInfo(p.getNormalTextureInfo(),w),u.normalTexture.scale!==void 0&&p.setNormalScale(u.normalTexture.scale)}if(u.occlusionTexture!==void 0){let w=u.occlusionTexture,T=n.textures[x[w.index].source];p.setOcclusionTexture(T),n.setTextureInfo(p.getOcclusionTextureInfo(),w),u.occlusionTexture.strength!==void 0&&p.setOcclusionStrength(u.occlusionTexture.strength)}if(y.metallicRoughnessTexture!==void 0){let w=y.metallicRoughnessTexture,T=n.textures[x[w.index].source];p.setMetallicRoughnessTexture(T),n.setTextureInfo(p.getMetallicRoughnessTextureInfo(),w)}return p}),r.getRoot().listExtensionsUsed().filter(u=>u.prereadTypes.includes("Mesh")).forEach(u=>u.preread(n,"Mesh"));let h=s.meshes||[];r.getRoot().listExtensionsUsed().filter(u=>u.prereadTypes.includes("Primitive")).forEach(u=>u.preread(n,"Primitive")),n.meshes=h.map(u=>{let p=r.createMesh(u.name);return u.extras&&p.setExtras(u.extras),u.weights!==void 0&&p.setWeights(u.weights),(u.primitives||[]).forEach(y=>{let w=r.createPrimitive();y.extras&&w.setExtras(y.extras),y.material!==void 0&&w.setMaterial(n.materials[y.material]),y.mode!==void 0&&w.setMode(y.mode);for(let[I,S]of Object.entries(y.attributes||{}))w.setAttribute(I,n.accessors[S]);y.indices!==void 0&&w.setIndices(n.accessors[y.indices]);let T=u.extras&&u.extras.targetNames||[];(y.targets||[]).forEach((I,S)=>{let R=T[S]||S.toString(),_=r.createPrimitiveTarget(R);for(let[A,C]of Object.entries(I))_.setAttribute(A,n.accessors[C]);w.addTarget(_)}),p.addPrimitive(w)}),p}),n.cameras=(s.cameras||[]).map(u=>{let p=r.createCamera(u.name).setType(u.type);if(u.extras&&p.setExtras(u.extras),u.type===is.Type.PERSPECTIVE){let y=u.perspective;p.setYFov(y.yfov),p.setZNear(y.znear),y.zfar!==void 0&&p.setZFar(y.zfar),y.aspectRatio!==void 0&&p.setAspectRatio(y.aspectRatio)}else{let y=u.orthographic;p.setZNear(y.znear).setZFar(y.zfar).setXMag(y.xmag).setYMag(y.ymag)}return p});let l=s.nodes||[];r.getRoot().listExtensionsUsed().filter(u=>u.prereadTypes.includes("Node")).forEach(u=>u.preread(n,"Node")),n.nodes=l.map(u=>{let p=r.createNode(u.name);if(u.extras&&p.setExtras(u.extras),u.translation!==void 0&&p.setTranslation(u.translation),u.rotation!==void 0&&p.setRotation(u.rotation),u.scale!==void 0&&p.setScale(u.scale),u.matrix!==void 0){let y=[0,0,0],w=[0,0,0,1],T=[1,1,1];ne.decompose(u.matrix,y,w,T),p.setTranslation(y),p.setRotation(w),p.setScale(T)}return u.weights!==void 0&&p.setWeights(u.weights),p}),n.skins=(s.skins||[]).map(u=>{let p=r.createSkin(u.name);u.extras&&p.setExtras(u.extras),u.inverseBindMatrices!==void 0&&p.setInverseBindMatrices(n.accessors[u.inverseBindMatrices]),u.skeleton!==void 0&&p.setSkeleton(n.nodes[u.skeleton]);for(let y of u.joints)p.addJoint(n.nodes[y]);return p}),l.map((u,p)=>{let y=n.nodes[p];(u.children||[]).forEach(w=>y.addChild(n.nodes[w])),u.mesh!==void 0&&y.setMesh(n.meshes[u.mesh]),u.camera!==void 0&&y.setCamera(n.cameras[u.camera]),u.skin!==void 0&&y.setSkin(n.skins[u.skin])}),n.animations=(s.animations||[]).map(u=>{let p=r.createAnimation(u.name);u.extras&&p.setExtras(u.extras);let y=(u.samplers||[]).map(w=>{let T=r.createAnimationSampler().setInput(n.accessors[w.input]).setOutput(n.accessors[w.output]).setInterpolation(w.interpolation||ns.Interpolation.LINEAR);return w.extras&&T.setExtras(w.extras),p.addSampler(T),T});return(u.channels||[]).forEach(w=>{let T=r.createAnimationChannel().setSampler(y[w.sampler]).setTargetPath(w.target.path);w.target.node!==void 0&&T.setTargetNode(n.nodes[w.target.node]),w.extras&&T.setExtras(w.extras),p.addChannel(T)}),p});let g=s.scenes||[];return r.getRoot().listExtensionsUsed().filter(u=>u.prereadTypes.includes("Scene")).forEach(u=>u.preread(n,"Scene")),n.scenes=g.map(u=>{let p=r.createScene(u.name);return u.extras&&p.setExtras(u.extras),(u.nodes||[]).map(y=>n.nodes[y]).forEach(y=>p.addChild(y)),p}),s.scene!==void 0&&r.getRoot().setDefaultScene(n.scenes[s.scene]),r.getRoot().listExtensionsUsed().forEach(u=>u.read(n)),f.forEach((u,p)=>{let y=n.accessors[p],w=!!u.sparse,T=!u.bufferView&&!y.getArray();(w||T)&&y.setSparse(!0).setArray(Sd(u,n))}),r}static validate(t,e){let a=t.json;if(a.asset.version!=="2.0")throw new Error(`Unsupported glTF version, "${a.asset.version}".`);if(a.extensionsRequired){for(let s of a.extensionsRequired)if(!e.extensions.find(r=>r.EXTENSION_NAME===s))throw new Error(`Missing required extension, "${s}".`)}if(a.extensionsUsed)for(let s of a.extensionsUsed)e.extensions.find(r=>r.EXTENSION_NAME===s)||e.logger.warn(`Missing optional extension, "${s}".`)}};function Id(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],r=a.json.bufferViews[t.bufferView],n=ss[t.componentType],i=U.getElementSize(t.type),o=n.BYTES_PER_ELEMENT,c=t.byteOffset||0,d=new n(t.count*i),b=new DataView(s.buffer,s.byteOffset,s.byteLength),f=r.byteStride;for(let v=0;v<t.count;v++)for(let x=0;x<i;x++){let h=c+v*f+x*o,l;switch(t.componentType){case U.ComponentType.FLOAT:l=b.getFloat32(h,!0);break;case U.ComponentType.UNSIGNED_INT:l=b.getUint32(h,!0);break;case U.ComponentType.UNSIGNED_SHORT:l=b.getUint16(h,!0);break;case U.ComponentType.UNSIGNED_BYTE:l=b.getUint8(h);break;case U.ComponentType.SHORT:l=b.getInt16(h,!0);break;case U.ComponentType.BYTE:l=b.getInt8(h);break;case U.ComponentType.FLOAT16:l=b.getFloat16(h,!0);break;case U.ComponentType.FLOAT64:l=b.getFloat64(h,!0);break;default:throw new Error(`Unexpected componentType "${t.componentType}".`)}d[v*i+x]=l}return d}function es(t,e){let a=e.jsonDoc,s=e.bufferViews[t.bufferView],r=a.json.bufferViews[t.bufferView],n=ss[t.componentType],i=U.getElementSize(t.type),o=n.BYTES_PER_ELEMENT,c=i*o;if(r.byteStride!==void 0&&r.byteStride!==c)return Id(t,e);let d=s.byteOffset+(t.byteOffset||0),b=t.count*i*o;return new n(s.buffer.slice(d,d+b))}function Sd(t,e){let a=ss[t.componentType],s=U.getElementSize(t.type),r;t.bufferView!==void 0?r=es(t,e):r=new a(t.count*s);let n=t.sparse;if(!n)return r;let i=n.count,o={...t,...n.indices,count:i,type:"SCALAR"},c={...t,...n.values,count:i},d=es(o,e),b=es(c,e);for(let f=0;f<o.count;f++)for(let v=0;v<s;v++)r[d[f]*s+v]=b[f*s+v];return r}var xi=(function(t){return t[t.ARRAY_BUFFER=34962]="ARRAY_BUFFER",t[t.ELEMENT_ARRAY_BUFFER=34963]="ELEMENT_ARRAY_BUFFER",t})(xi||{}),ft=class{_doc;jsonDoc;options;static BufferViewTarget=xi;static BufferViewUsage=$l;static USAGE_TO_TARGET={ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963};accessorIndexMap=new Map;animationIndexMap=new Map;bufferIndexMap=new Map;cameraIndexMap=new Map;skinIndexMap=new Map;materialIndexMap=new Map;meshIndexMap=new Map;nodeIndexMap=new Map;imageIndexMap=new Map;textureDefIndexMap=new Map;textureInfoDefMap=new Map;samplerDefIndexMap=new Map;sceneIndexMap=new Map;imageBufferViews=[];otherBufferViews=new Map;otherBufferViewsIndexMap=new Map;extensionData={};bufferURIGenerator;imageURIGenerator;logger;_accessorUsageMap=new Map;accessorUsageGroupedByParent=new Set(["ARRAY_BUFFER"]);accessorParents=new Map;constructor(t,e,a){this._doc=t,this.jsonDoc=e,this.options=a;let s=t.getRoot(),r=s.listBuffers().length,n=s.listTextures().length;this.bufferURIGenerator=new Zn(r>1,()=>a.basename||"buffer"),this.imageURIGenerator=new Zn(n>1,i=>Rd(t,i)||a.basename||"texture"),this.logger=t.getLogger()}createTextureInfoDef(t,e){let a={magFilter:e.getMagFilter()||void 0,minFilter:e.getMinFilter()||void 0,wrapS:e.getWrapS(),wrapT:e.getWrapT()},s=JSON.stringify(a);this.samplerDefIndexMap.has(s)||(this.samplerDefIndexMap.set(s,this.jsonDoc.json.samplers.length),this.jsonDoc.json.samplers.push(a));let r={source:this.imageIndexMap.get(t),sampler:this.samplerDefIndexMap.get(s)},n=JSON.stringify(r);this.textureDefIndexMap.has(n)||(this.textureDefIndexMap.set(n,this.jsonDoc.json.textures.length),this.jsonDoc.json.textures.push(r));let i={index:this.textureDefIndexMap.get(n)};return e.getTexCoord()!==0&&(i.texCoord=e.getTexCoord()),Object.keys(e.getExtras()).length>0&&(i.extras=e.getExtras()),this.textureInfoDefMap.set(e,i),i}createPropertyDef(t){let e={};return t.getName()&&(e.name=t.getName()),Object.keys(t.getExtras()).length>0&&(e.extras=t.getExtras()),e}createAccessorDef(t){let e=this.createPropertyDef(t);return e.type=t.getType(),e.componentType=t.getComponentType(),e.count=t.getCount(),this._doc.getGraph().listParentEdges(t).some(a=>a.getName()==="attributes"&&a.getAttributes().key==="POSITION"||a.getName()==="input")&&(e.max=t.getMax([]).map(Math.fround),e.min=t.getMin([]).map(Math.fround)),t.getNormalized()&&(e.normalized=t.getNormalized()),e}createImageData(t,e,a){if(this.options.format==="GLB")this.imageBufferViews.push(e),t.bufferView=this.jsonDoc.json.bufferViews.length,this.jsonDoc.json.bufferViews.push({buffer:0,byteOffset:-1,byteLength:e.byteLength});else{let s=Je.mimeTypeToExtension(a.getMimeType());t.uri=this.imageURIGenerator.createURI(a,s),this.assignResourceURI(t.uri,e,!1)}}assignResourceURI(t,e,a){let s=this.jsonDoc.resources;if(!(t in s)){s[t]=e;return}if(e===s[t]){this.logger.warn(`Duplicate resource URI, "${t}".`);return}let r=`Resource URI "${t}" already assigned to different data.`;if(!a){this.logger.warn(r);return}throw new Error(r)}getAccessorUsage(t){let e=this._accessorUsageMap.get(t);if(e)return e;if(t.getSparse())return"SPARSE";for(let a of this._doc.getGraph().listParentEdges(t)){let{usage:s}=a.getAttributes();if(s)return s;a.getParent().propertyType!=="Root"&&this.logger.warn(`Missing attribute ".usage" on edge, "${a.getName()}".`)}return"OTHER"}addAccessorToUsageGroup(t,e){let a=this._accessorUsageMap.get(t);if(a&&a!==e)throw new Error(`Accessor with usage "${a}" cannot be reused as "${e}".`);return this._accessorUsageMap.set(t,e),this}},Zn=class{multiple;basename;counter={};constructor(t,e){this.multiple=t,this.basename=e}createURI(t,e){if(t.getURI())return t.getURI();if(this.multiple){let a=this.basename(t);return this.counter[a]=this.counter[a]||1,`${a}_${this.counter[a]++}.${e}`}else return`${this.basename(t)}.${e}`}};function Rd(t,e){let a=t.getGraph().listParentEdges(e).find(s=>s.getParent()!==t.getRoot());return a?a.getName().replace(/texture$/i,""):""}var{BufferViewUsage:Za}=ft,{UNSIGNED_INT:Ad,UNSIGNED_SHORT:_d,UNSIGNED_BYTE:Nd}=U.ComponentType,Fd=new Set(["Accessor","Buffer","Material","Mesh"]),jd=class{static write(t,e){let a=t.getGraph(),s=t.getRoot(),r={asset:{generator:`glTF-Transform ${ti}`,...s.getAsset()},extras:{...s.getExtras()}},n={json:r,resources:{}},i=new ft(t,n,e),o=e.logger||rs.DEFAULT_INSTANCE,c=new Set(e.extensions.map(l=>l.EXTENSION_NAME)),d=t.getRoot().listExtensionsUsed().filter(l=>c.has(l.extensionName)).sort((l,g)=>l.extensionName>g.extensionName?1:-1),b=t.getRoot().listExtensionsRequired().filter(l=>c.has(l.extensionName)).sort((l,g)=>l.extensionName>g.extensionName?1:-1);d.length<t.getRoot().listExtensionsUsed().length&&o.warn("Some extensions were not registered for I/O, and will not be written.");for(let l of d){let g=l.prewriteTypes.filter(u=>!Fd.has(u));g.length&&o.warn(`Prewrite hooks for some types (${g.join()}), requested by extension ${l.extensionName}, are unsupported. Please file an issue or a PR.`);for(let u of l.writeDependencies)l.install(u,e.dependencies[u])}function f(l,g,u,p){let y=[],w=0;for(let I of l){let S=i.createAccessorDef(I);S.bufferView=r.bufferViews.length;let R=I.getArray(),_=H.pad(H.toView(R));S.byteOffset=w,w+=_.byteLength,y.push(_),i.accessorIndexMap.set(I,r.accessors.length),r.accessors.push(S)}let T={buffer:g,byteOffset:u,byteLength:H.concat(y).byteLength};return p&&(T.target=p),r.bufferViews.push(T),{buffers:y,byteLength:w}}function v(l,g,u){let p=l[0].getCount(),y=0;for(let R of l){let _=i.createAccessorDef(R);_.bufferView=r.bufferViews.length,_.byteOffset=y;let A=R.getElementSize(),C=R.getComponentSize();y+=H.padNumber(A*C),i.accessorIndexMap.set(R,r.accessors.length),r.accessors.push(_)}let w=p*y,T=new ArrayBuffer(w),I=new DataView(T);for(let R=0;R<p;R++){let _=0;for(let A of l){let C=A.getElementSize(),D=A.getComponentSize(),j=A.getComponentType(),z=A.getArray();for(let W=0;W<C;W++){let te=R*y+_+W*D,oe=z[R*C+W];switch(j){case U.ComponentType.FLOAT:I.setFloat32(te,oe,!0);break;case U.ComponentType.BYTE:I.setInt8(te,oe);break;case U.ComponentType.SHORT:I.setInt16(te,oe,!0);break;case U.ComponentType.UNSIGNED_BYTE:I.setUint8(te,oe);break;case U.ComponentType.UNSIGNED_SHORT:I.setUint16(te,oe,!0);break;case U.ComponentType.UNSIGNED_INT:I.setUint32(te,oe,!0);break;case U.ComponentType.FLOAT16:I.setFloat16(te,oe,!0);break;case U.ComponentType.FLOAT64:I.setFloat64(te,oe,!0);break;default:throw new Error("Unexpected component type: "+j)}}_+=H.padNumber(C*D)}}let S={buffer:g,byteOffset:u,byteLength:w,byteStride:y,target:ft.BufferViewTarget.ARRAY_BUFFER};return r.bufferViews.push(S),{byteLength:w,buffers:[new Uint8Array(T)]}}function x(l,g,u){let p=[],y=0,w=new Map,T=-1/0,I=!1;for(let j of l){let z=i.createAccessorDef(j);r.accessors.push(z),i.accessorIndexMap.set(j,r.accessors.length-1);let W=[],te=[],oe=[],je=new Array(j.getElementSize()).fill(0);for(let ve=0,qe=j.getCount();ve<qe;ve++)if(j.getElement(ve,oe),!ne.eq(oe,je,0)){T=Math.max(ve,T),W.push(ve);for(let Ue=0;Ue<oe.length;Ue++)te.push(oe[Ue])}let de=W.length,Be={accessorDef:z,count:de};if(w.set(j,Be),de===0)continue;de>j.getCount()/2&&(I=!0);let Le=ss[j.getComponentType()];Be.indices=W,Be.values=new Le(te)}if(!Number.isFinite(T))return{buffers:p,byteLength:y};I&&o.warn("Some sparse accessors have >50% non-zero elements, which may increase file size.");let S=T<255?Uint8Array:T<65535?Uint16Array:Uint32Array,R=T<255?Nd:T<65535?_d:Ad,_={buffer:g,byteOffset:u+y,byteLength:0};for(let j of l){let z=w.get(j);if(z.count===0)continue;z.indicesByteOffset=_.byteLength;let W=H.pad(H.toView(new S(z.indices)));p.push(W),y+=W.byteLength,_.byteLength+=W.byteLength}r.bufferViews.push(_);let A=r.bufferViews.length-1,C={buffer:g,byteOffset:u+y,byteLength:0};for(let j of l){let z=w.get(j);if(z.count===0)continue;z.valuesByteOffset=C.byteLength;let W=H.pad(H.toView(z.values));p.push(W),y+=W.byteLength,C.byteLength+=W.byteLength}r.bufferViews.push(C);let D=r.bufferViews.length-1;for(let j of l){let z=w.get(j);z.count!==0&&(z.accessorDef.sparse={count:z.count,indices:{bufferView:A,byteOffset:z.indicesByteOffset,componentType:R},values:{bufferView:D,byteOffset:z.valuesByteOffset}})}return{buffers:p,byteLength:y}}if(r.accessors=[],r.bufferViews=[],r.samplers=[],r.textures=[],r.images=s.listTextures().map((l,g)=>{let u=i.createPropertyDef(l);l.getMimeType()&&(u.mimeType=l.getMimeType());let p=l.getImage();return p&&i.createImageData(u,p,l),i.imageIndexMap.set(l,g),u}),d.filter(l=>l.prewriteTypes.includes("Accessor")).forEach(l=>l.prewrite(i,"Accessor")),s.listAccessors().forEach(l=>{let g=i.accessorUsageGroupedByParent,u=i.accessorParents;if(i.accessorIndexMap.has(l))return;let p=i.getAccessorUsage(l);if(i.addAccessorToUsageGroup(l,p),g.has(p)){let y=a.listParents(l).find(w=>w.propertyType!=="Root");u.set(l,y)}}),d.filter(l=>l.prewriteTypes.includes("Buffer")).forEach(l=>l.prewrite(i,"Buffer")),(s.listAccessors().length>0||i.otherBufferViews.size>0||s.listTextures().length>0&&e.format==="GLB")&&s.listBuffers().length===0)throw new Error("Buffer required for Document resources, but none was found.");r.buffers=[],s.listBuffers().forEach((l,g)=>{let u=i.createPropertyDef(l),p=i.accessorUsageGroupedByParent,y=l.listParents().filter(A=>A instanceof U),w=new Set(y.map(A=>i.accessorParents.get(A))),T=new Map(Array.from(w).map((A,C)=>[A,C])),I={};for(let A of y){if(i.accessorIndexMap.has(A))continue;let C=i.getAccessorUsage(A),D=C;if(p.has(C)){let j=i.accessorParents.get(A);D+=`:${T.get(j)}`}I[D]||={usage:C,accessors:[]},I[D].accessors.push(A)}let S=[],R=r.buffers.length,_=0;for(let{usage:A,accessors:C}of Object.values(I))if(A===Za.ARRAY_BUFFER&&e.vertexLayout==="interleaved"){let D=v(C,R,_);_+=D.byteLength;for(let j of D.buffers)S.push(j)}else if(A===Za.ARRAY_BUFFER)for(let D of C){let j=v([D],R,_);_+=j.byteLength;for(let z of j.buffers)S.push(z)}else if(A===Za.SPARSE){let D=x(C,R,_);_+=D.byteLength;for(let j of D.buffers)S.push(j)}else if(A===Za.ELEMENT_ARRAY_BUFFER){let D=ft.BufferViewTarget.ELEMENT_ARRAY_BUFFER,j=f(C,R,_,D);_+=j.byteLength;for(let z of j.buffers)S.push(z)}else{let D=f(C,R,_);_+=D.byteLength;for(let j of D.buffers)S.push(j)}if(i.imageBufferViews.length&&g===0){for(let A=0;A<i.imageBufferViews.length;A++)if(r.bufferViews[r.images[A].bufferView].byteOffset=_,_+=i.imageBufferViews[A].byteLength,S.push(i.imageBufferViews[A]),_%8){let C=8-_%8;_+=C,S.push(new Uint8Array(C))}}if(i.otherBufferViews.has(l))for(let A of i.otherBufferViews.get(l))r.bufferViews.push({buffer:R,byteOffset:_,byteLength:A.byteLength}),i.otherBufferViewsIndexMap.set(A,r.bufferViews.length-1),_+=A.byteLength,S.push(A);if(_){let A;e.format==="GLB"?A=ht:(A=i.bufferURIGenerator.createURI(l,"bin"),u.uri=A),u.byteLength=_,i.assignResourceURI(A,H.concat(S),!0)}r.buffers.push(u),i.bufferIndexMap.set(l,g)}),s.listAccessors().find(l=>!l.getBuffer())&&o.warn("Skipped writing one or more Accessors: no Buffer assigned."),d.filter(l=>l.prewriteTypes.includes("Material")).forEach(l=>l.prewrite(i,"Material")),r.materials=s.listMaterials().map((l,g)=>{let u=i.createPropertyDef(l);if(l.getAlphaMode()!==as.AlphaMode.OPAQUE&&(u.alphaMode=l.getAlphaMode()),l.getAlphaMode()===as.AlphaMode.MASK&&(u.alphaCutoff=l.getAlphaCutoff()),l.getDoubleSided()&&(u.doubleSided=!0),u.pbrMetallicRoughness={},ne.eq(l.getBaseColorFactor(),[1,1,1,1])||(u.pbrMetallicRoughness.baseColorFactor=l.getBaseColorFactor()),ne.eq(l.getEmissiveFactor(),[0,0,0])||(u.emissiveFactor=l.getEmissiveFactor()),l.getRoughnessFactor()!==1&&(u.pbrMetallicRoughness.roughnessFactor=l.getRoughnessFactor()),l.getMetallicFactor()!==1&&(u.pbrMetallicRoughness.metallicFactor=l.getMetallicFactor()),l.getBaseColorTexture()){let p=l.getBaseColorTexture(),y=l.getBaseColorTextureInfo();u.pbrMetallicRoughness.baseColorTexture=i.createTextureInfoDef(p,y)}if(l.getEmissiveTexture()){let p=l.getEmissiveTexture(),y=l.getEmissiveTextureInfo();u.emissiveTexture=i.createTextureInfoDef(p,y)}if(l.getNormalTexture()){let p=l.getNormalTexture(),y=l.getNormalTextureInfo(),w=i.createTextureInfoDef(p,y);l.getNormalScale()!==1&&(w.scale=l.getNormalScale()),u.normalTexture=w}if(l.getOcclusionTexture()){let p=l.getOcclusionTexture(),y=l.getOcclusionTextureInfo(),w=i.createTextureInfoDef(p,y);l.getOcclusionStrength()!==1&&(w.strength=l.getOcclusionStrength()),u.occlusionTexture=w}if(l.getMetallicRoughnessTexture()){let p=l.getMetallicRoughnessTexture(),y=l.getMetallicRoughnessTextureInfo();u.pbrMetallicRoughness.metallicRoughnessTexture=i.createTextureInfoDef(p,y)}return i.materialIndexMap.set(l,g),u}),d.filter(l=>l.prewriteTypes.includes("Mesh")).forEach(l=>l.prewrite(i,"Mesh")),r.meshes=s.listMeshes().map((l,g)=>{let u=i.createPropertyDef(l),p=null;return u.primitives=l.listPrimitives().map(y=>{let w={attributes:{}};w.mode=y.getMode();let T=y.getMaterial();T&&(w.material=i.materialIndexMap.get(T)),Object.keys(y.getExtras()).length&&(w.extras=y.getExtras());let I=y.getIndices();I&&(w.indices=i.accessorIndexMap.get(I));for(let S of y.listSemantics())w.attributes[S]=i.accessorIndexMap.get(y.getAttribute(S));for(let S of y.listTargets()){let R={};for(let _ of S.listSemantics())R[_]=i.accessorIndexMap.get(S.getAttribute(_));w.targets=w.targets||[],w.targets.push(R)}return y.listTargets().length&&!p&&(p=y.listTargets().map(S=>S.getName())),w}),l.getWeights().length&&(u.weights=l.getWeights()),p&&(u.extras=u.extras||{},u.extras.targetNames=p),i.meshIndexMap.set(l,g),u}),r.cameras=s.listCameras().map((l,g)=>{let u=i.createPropertyDef(l);if(u.type=l.getType(),u.type===is.Type.PERSPECTIVE){u.perspective={znear:l.getZNear(),zfar:l.getZFar(),yfov:l.getYFov()};let p=l.getAspectRatio();p!==null&&(u.perspective.aspectRatio=p)}else u.orthographic={znear:l.getZNear(),zfar:l.getZFar(),xmag:l.getXMag(),ymag:l.getYMag()};return i.cameraIndexMap.set(l,g),u}),r.nodes=s.listNodes().map((l,g)=>{let u=i.createPropertyDef(l);return ne.eq(l.getTranslation(),[0,0,0])||(u.translation=l.getTranslation()),ne.eq(l.getRotation(),[0,0,0,1])||(u.rotation=l.getRotation()),ne.eq(l.getScale(),[1,1,1])||(u.scale=l.getScale()),l.getWeights().length&&(u.weights=l.getWeights()),i.nodeIndexMap.set(l,g),u}),r.skins=s.listSkins().map((l,g)=>{let u=i.createPropertyDef(l),p=l.getInverseBindMatrices();p&&(u.inverseBindMatrices=i.accessorIndexMap.get(p));let y=l.getSkeleton();return y&&(u.skeleton=i.nodeIndexMap.get(y)),u.joints=l.listJoints().map(w=>i.nodeIndexMap.get(w)),i.skinIndexMap.set(l,g),u}),s.listNodes().forEach((l,g)=>{let u=r.nodes[g],p=l.getMesh();p&&(u.mesh=i.meshIndexMap.get(p));let y=l.getCamera();y&&(u.camera=i.cameraIndexMap.get(y));let w=l.getSkin();w&&(u.skin=i.skinIndexMap.get(w)),l.listChildren().length>0&&(u.children=l.listChildren().map(T=>i.nodeIndexMap.get(T)))}),r.animations=s.listAnimations().map((l,g)=>{let u=i.createPropertyDef(l),p=new Map;return u.samplers=l.listSamplers().map((y,w)=>{let T=i.createPropertyDef(y);return T.input=i.accessorIndexMap.get(y.getInput()),T.output=i.accessorIndexMap.get(y.getOutput()),T.interpolation=y.getInterpolation(),p.set(y,w),T}),u.channels=l.listChannels().map(y=>{let w=i.createPropertyDef(y);return w.sampler=p.get(y.getSampler()),w.target={node:i.nodeIndexMap.get(y.getTargetNode()),path:y.getTargetPath()},w}),i.animationIndexMap.set(l,g),u}),r.scenes=s.listScenes().map((l,g)=>{let u=i.createPropertyDef(l);return u.nodes=l.listChildren().map(p=>i.nodeIndexMap.get(p)),i.sceneIndexMap.set(l,g),u});let h=s.getDefaultScene();return h&&(r.scene=s.listScenes().indexOf(h)),r.extensionsUsed=d.map(l=>l.extensionName),r.extensionsRequired=b.map(l=>l.extensionName),d.forEach(l=>l.write(i)),Bd(r),n}};function Bd(t){let e=[];for(let a in t){let s=t[a];(Array.isArray(s)&&s.length===0||s===null||s===""||s&&typeof s=="object"&&Object.keys(s).length===0)&&e.push(a)}for(let a of e)delete t[a]}var Cd=class{_logger=rs.DEFAULT_INSTANCE;_extensions=new Set;_dependencies={};_vertexLayout="interleaved";_strictResources=!0;lastReadBytes=0;lastWriteBytes=0;setLogger(t){return this._logger=t,this}registerExtensions(t){for(let e of t)this._extensions.add(e),e.register();return this}registerDependencies(t){return Object.assign(this._dependencies,t),this}setVertexLayout(t){return this._vertexLayout=t,this}setStrictResources(t){return this._strictResources=t,this}async read(t){return await this.readJSON(await this.readAsJSON(t))}async readAsJSON(t){let e=await this.readURI(t,"view");this.lastReadBytes=e.byteLength;let a=ei(e)?this._binaryToJSON(e):{json:JSON.parse(H.decodeText(e)),resources:{}};return await this._readResourcesExternal(a,this.dirname(t)),this._readResourcesInternal(a),a}async readJSON(t){return t=this._copyJSON(t),this._readResourcesInternal(t),Md.read(t,{extensions:Array.from(this._extensions),dependencies:this._dependencies,logger:this._logger})}async binaryToJSON(t){let e=this._binaryToJSON(H.assertView(t));this._readResourcesInternal(e);let a=e.json;if(a.buffers&&a.buffers.some(s=>Od(e,s)))throw new Error("Cannot resolve external buffers with binaryToJSON().");if(a.images&&a.images.some(s=>Pd(e,s)))throw new Error("Cannot resolve external images with binaryToJSON().");return e}async readBinary(t){return this.readJSON(await this.binaryToJSON(H.assertView(t)))}async writeJSON(t,e={}){if(e.format==="GLB"&&t.getRoot().listBuffers().length>1)throw new Error("GLB must have 0\u20131 buffers.");return jd.write(t,{format:e.format||"GLTF",basename:e.basename||"",logger:this._logger,vertexLayout:this._vertexLayout,dependencies:{...this._dependencies},extensions:Array.from(this._extensions)})}async writeBinary(t){let{json:e,resources:a}=await this.writeJSON(t,{format:"GLB"}),s=new Uint32Array([1179937895,2,12]),r=JSON.stringify(e),n=H.pad(H.encodeText(r),32),i=H.toView(new Uint32Array([n.byteLength,1313821514])),o=H.concat([i,n]);s[s.length-1]+=o.byteLength;let c=Object.values(a)[0];if(!c||!c.byteLength)return H.concat([H.toView(s),o]);let d=H.pad(c,0),b=H.toView(new Uint32Array([d.byteLength,5130562])),f=H.concat([b,d]);return s[s.length-1]+=f.byteLength,H.concat([H.toView(s),o,f])}async _readResourcesExternal(t,e){let a=t.json.images||[],s=t.json.buffers||[],r=[...a,...s].map(async n=>{let i=n.uri;if(!i||i.match(/data:/))return Promise.resolve();try{t.resources[i]=await this.readURI(this.resolve(e,i),"view"),this.lastReadBytes+=t.resources[i].byteLength}catch(o){if(!this._strictResources&&a.includes(n))this._logger.warn(`Failed to load image URI, "${i}". ${o}`),t.resources[i]=null;else throw o}});await Promise.all(r)}_readResourcesInternal(t){function e(a){if(a.uri){if(a.uri in t.resources){H.assertView(t.resources[a.uri]);return}if(a.uri.match(/data:/)){let s=`__${md()}.${Qt.extension(a.uri)}`;t.resources[s]=H.createBufferFromDataURI(a.uri),a.uri=s}}}(t.json.images||[]).forEach(a=>{if(a.bufferView===void 0&&a.uri===void 0)throw new Error("Missing resource URI or buffer view.");e(a)}),(t.json.buffers||[]).forEach(e)}_copyJSON(t){let{images:e,buffers:a}=t.json;return t={json:{...t.json},resources:{...t.resources}},e&&(t.json.images=e.map(s=>({...s}))),a&&(t.json.buffers=a.map(s=>({...s}))),t}_binaryToJSON(t){if(!ei(t))throw new Error("Invalid glTF 2.0 binary.");let e=new Uint32Array(t.buffer,t.byteOffset+12,2);if(e[1]!==1313821514)throw new Error("Missing required GLB JSON chunk.");let a=20,s=e[0],r=H.decodeText(H.toView(t,a,s)),n=JSON.parse(r),i=a+s;if(t.byteLength<=i)return{json:n,resources:{}};let o=new Uint32Array(t.buffer,t.byteOffset+i,2);if(o[1]!==5130562)return{json:n,resources:{}};let c=o[0],d=H.toView(t,i+8,c);return{json:n,resources:{[ht]:d}}}};function Od(t,e){return e.uri!==void 0&&!(e.uri in t.resources)}function Pd(t,e){return e.uri!==void 0&&!(e.uri in t.resources)&&e.bufferView===void 0}function ei(t){if(t.byteLength<3*Uint32Array.BYTES_PER_ELEMENT)return!1;let e=new Uint32Array(t.buffer,t.byteOffset,3);return e[0]===1179937895&&e[1]===2}var vi=class extends Cd{_fetchConfig;constructor(t=mr.DEFAULT_INIT){super(),this._fetchConfig=t}async readURI(t,e){let a=await fetch(t,this._fetchConfig);switch(e){case"view":return new Uint8Array(await a.arrayBuffer());case"text":return a.text()}}resolve(t,e){return mr.resolve(t,e)}dirname(t){return mr.dirname(t)}};function Dd(){return{vkFormat:0,typeSize:1,pixelWidth:0,pixelHeight:0,pixelDepth:0,layerCount:0,faceCount:1,levelCount:0,supercompressionScheme:0,levels:[],dataFormatDescriptor:[{vendorId:0,descriptorType:0,versionNumber:2,colorModel:0,colorPrimaries:1,transferFunction:2,flags:0,texelBlockDimension:[0,0,0,0],bytesPlane:[0,0,0,0,0,0,0,0],samples:[]}],keyValue:{},globalData:null}}var Ut=class{constructor(e,a,s,r){this._dataView=void 0,this._littleEndian=void 0,this._offset=void 0,this._dataView=new DataView(e.buffer,e.byteOffset+a,s),this._littleEndian=r,this._offset=0}_nextUint8(){let e=this._dataView.getUint8(this._offset);return this._offset+=1,e}_nextUint16(){let e=this._dataView.getUint16(this._offset,this._littleEndian);return this._offset+=2,e}_nextUint32(){let e=this._dataView.getUint32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint64(){let e=this._dataView.getUint32(this._offset,this._littleEndian),a=this._dataView.getUint32(this._offset+4,this._littleEndian),s=e+2**32*a;return this._offset+=8,s}_nextInt32(){let e=this._dataView.getInt32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint8Array(e){let a=new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+this._offset,e);return this._offset+=e,a}_skip(e){return this._offset+=e,this}_scan(e,a=0){let s=this._offset,r=0;for(;this._dataView.getUint8(this._offset)!==a&&r<e;)r++,this._offset++;return r<e&&this._offset++,new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+s,r)}};var Dm=new Uint8Array([0]),ke=[171,75,84,88,32,50,48,187,13,10,26,10];function wi(t){return new TextDecoder().decode(t)}function os(t){let e=new Uint8Array(t.buffer,t.byteOffset,ke.length);if(e[0]!==ke[0]||e[1]!==ke[1]||e[2]!==ke[2]||e[3]!==ke[3]||e[4]!==ke[4]||e[5]!==ke[5]||e[6]!==ke[6]||e[7]!==ke[7]||e[8]!==ke[8]||e[9]!==ke[9]||e[10]!==ke[10]||e[11]!==ke[11])throw new Error("Missing KTX 2.0 identifier.");let a=Dd(),s=17*Uint32Array.BYTES_PER_ELEMENT,r=new Ut(t,ke.length,s,!0);a.vkFormat=r._nextUint32(),a.typeSize=r._nextUint32(),a.pixelWidth=r._nextUint32(),a.pixelHeight=r._nextUint32(),a.pixelDepth=r._nextUint32(),a.layerCount=r._nextUint32(),a.faceCount=r._nextUint32(),a.levelCount=r._nextUint32(),a.supercompressionScheme=r._nextUint32();let n=r._nextUint32(),i=r._nextUint32(),o=r._nextUint32(),c=r._nextUint32(),d=r._nextUint64(),b=r._nextUint64(),f=Math.max(a.levelCount,1)*3*8,v=new Ut(t,ke.length+s,f,!0);for(let B=0,O=Math.max(a.levelCount,1);B<O;B++)a.levels.push({levelData:new Uint8Array(t.buffer,t.byteOffset+v._nextUint64(),v._nextUint64()),uncompressedByteLength:v._nextUint64()});let x=new Ut(t,n,i,!0);x._skip(4);let h=x._nextUint16(),l=x._nextUint16(),g=x._nextUint16(),u=x._nextUint16(),p=x._nextUint8(),y=x._nextUint8(),w=x._nextUint8(),T=x._nextUint8(),I=[x._nextUint8(),x._nextUint8(),x._nextUint8(),x._nextUint8()],S=[x._nextUint8(),x._nextUint8(),x._nextUint8(),x._nextUint8(),x._nextUint8(),x._nextUint8(),x._nextUint8(),x._nextUint8()],_={vendorId:h,descriptorType:l,versionNumber:g,colorModel:p,colorPrimaries:y,transferFunction:w,flags:T,texelBlockDimension:I,bytesPlane:S,samples:[]},D=(u/4-6)/4;for(let B=0;B<D;B++){let O={bitOffset:x._nextUint16(),bitLength:x._nextUint8(),channelType:x._nextUint8(),samplePosition:[x._nextUint8(),x._nextUint8(),x._nextUint8(),x._nextUint8()],sampleLower:Number.NEGATIVE_INFINITY,sampleUpper:Number.POSITIVE_INFINITY};O.channelType&64?(O.sampleLower=x._nextInt32(),O.sampleUpper=x._nextInt32()):(O.sampleLower=x._nextUint32(),O.sampleUpper=x._nextUint32()),_.samples[B]=O}a.dataFormatDescriptor.length=0,a.dataFormatDescriptor.push(_);let j=new Ut(t,o,c,!0);for(;j._offset<c;){let B=j._nextUint32(),O=j._scan(B),J=wi(O);if(a.keyValue[J]=j._nextUint8Array(B-O.byteLength-1),J.match(/^ktx/i)){let we=wi(a.keyValue[J]);a.keyValue[J]=we.substring(0,we.lastIndexOf("\0"))}let ce=B%4?4-B%4:0;j._skip(ce)}if(b<=0)return a;let z=new Ut(t,d,b,!0),W=z._nextUint16(),te=z._nextUint16(),oe=z._nextUint32(),je=z._nextUint32(),de=z._nextUint32(),Be=z._nextUint32(),Le=[];for(let B=0,O=Math.max(a.levelCount,1);B<O;B++)Le.push({imageFlags:z._nextUint32(),rgbSliceByteOffset:z._nextUint32(),rgbSliceByteLength:z._nextUint32(),alphaSliceByteOffset:z._nextUint32(),alphaSliceByteLength:z._nextUint32()});let ve=d+z._offset,qe=ve+oe,Ue=qe+je,ct=Ue+de,Jt=new Uint8Array(t.buffer,t.byteOffset+ve,oe),nr=new Uint8Array(t.buffer,t.byteOffset+qe,je),La=new Uint8Array(t.buffer,t.byteOffset+Ue,de),M=new Uint8Array(t.buffer,t.byteOffset+ct,Be);return a.globalData={endpointCount:W,selectorCount:te,imageDescs:Le,endpointsData:Jt,selectorsData:nr,tablesData:La,extendedData:M},a}var pt="EXT_mesh_gpu_instancing",st="EXT_mesh_features",Re="EXT_meshopt_compression",V="EXT_structural_metadata",cs="EXT_texture_webp",ls="EXT_texture_avif",Vd="KHR_accessor_float16",Hd="KHR_accessor_float64",le="KHR_draco_mesh_compression",at="KHR_lights_punctual",gt="KHR_materials_anisotropy",mt="KHR_materials_clearcoat",yt="KHR_materials_diffuse_transmission",xt="KHR_materials_dispersion",vt="KHR_materials_emissive_strength",wt="KHR_materials_ior",Et="KHR_materials_iridescence",kt="KHR_materials_pbrSpecularGlossiness",Tt="KHR_materials_sheen",Mt="KHR_materials_specular",It="KHR_materials_transmission",Zt="KHR_materials_unlit",St="KHR_materials_volume",Fe="KHR_materials_variants",Ei="KHR_mesh_primitive_restart",ki="KHR_mesh_quantization",Rt="KHR_node_visibility",ds="KHR_texture_basisu",At="KHR_texture_transform",Ge="KHR_xmp_json_ld",qd=class extends X{static EXTENSION_NAME=st;init(){this.extensionName=st,this.propertyType="FeatureID",this.parentTypes=["Features"]}getDefaults(){return Object.assign(super.getDefaults(),{nullFeatureId:null,label:"",attribute:null,texture:null,propertyTable:null})}getFeatureCount(){return this.get("featureCount")}setFeatureCount(t){return this.set("featureCount",t)}getNullFeatureID(){return this.get("nullFeatureId")}setNullFeatureID(t){return this.set("nullFeatureId",t)}getLabel(){return this.get("label")}setLabel(t){return this.set("label",t)}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getPropertyTable(){return this.getRef("propertyTable")}setPropertyTable(t){return this.setRef("propertyTable",t)}},Xd=class extends X{static EXTENSION_NAME=st;init(){this.extensionName=st,this.propertyType="FeatureIDTexture",this.parentTypes=["FeatureID"]}getDefaults(){let t=new se(this.graph,"textureInfo");return t.setMinFilter(se.MagFilter.NEAREST),t.setMagFilter(se.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}},Wd=class extends X{static EXTENSION_NAME=st;init(){this.extensionName=st,this.propertyType="Features",this.parentTypes=[F.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{featureIds:new ae([])})}listFeatureIDs(){return this.listRefs("featureIds")}addFeatureID(t){return this.addRef("featureIds",t)}removeFeatureID(t){return this.removeRef("featureIds",t)}},ga=st,_r=class extends ee{extensionName=st;static EXTENSION_NAME=st;createFeatures(){return new Wd(this.document.getGraph())}createFeatureID(){return new qd(this.document.getGraph())}createFeatureIDTexture(){return new Xd(this.document.getGraph())}read(t){return(t.jsonDoc.json.meshes||[]).forEach((e,a)=>{(e.primitives||[]).forEach((s,r)=>{this._readPrimitive(t,a,s,r)})}),this}_readPrimitive(t,e,a,s){if(!a.extensions||!a.extensions[ga])return;let r=this.createFeatures(),n=a.extensions[ga];for(let i of n.featureIds){let o=Jd(this.document,this,t,i);r.addFeatureID(o)}t.meshes[e].listPrimitives()[s].setExtension(ga,r)}write(t){let e=t.jsonDoc.json.meshes;if(!e)return this;for(let a of this.document.getRoot().listMeshes()){let s=e[t.meshIndexMap.get(a)];a.listPrimitives().forEach((r,n)=>{let i=s.primitives[n];this._writePrimitive(t,r,i)})}return this}_writePrimitive(t,e,a){let s=e.getExtension(ga);if(!s)return;let r={featureIds:[]};s.listFeatureIDs().forEach(n=>{r.featureIds.push($d(this.document,t,n))}),a.extensions=a.extensions||{},a.extensions[ga]=r}};function Jd(t,e,a,s){let r=e.createFeatureID().setFeatureCount(s.featureCount);s.nullFeatureId!==void 0&&r.setNullFeatureID(s.nullFeatureId),s.label!==void 0&&r.setLabel(s.label),s.attribute!==void 0&&r.setAttribute(s.attribute);let n=s.texture;if(n!==void 0){let i=Yd(e,a,n);r.setTexture(i)}if(s.propertyTable!==void 0){let i=t.getRoot().getExtension(V).listPropertyTables();r.setPropertyTable(i[s.propertyTable])}return r}function Yd(t,e,a){let s=t.createFeatureIDTexture(),{json:r}=e.jsonDoc;if(a.channels&&s.setChannels(a.channels),a.index!==void 0){let n=r.textures[a.index].source;s.setTexture(e.textures[n]),e.setTextureInfo(s.getTextureInfo(),a)}return s}function $d(t,e,a){let s=t.getRoot(),r={featureCount:a.getFeatureCount()};if(a.getNullFeatureID()!=null&&(r.nullFeatureId=a.getNullFeatureID()),a.getLabel()&&(r.label=a.getLabel()),a.getAttribute()!=null&&(r.attribute=a.getAttribute()),a.getTexture()){let n=a.getTexture(),i=n.getTexture(),o=n.getTextureInfo();r.texture=e.createTextureInfoDef(i,o);let c=n.getChannels();ne.eq(c,[0])||(r.texture.channels=c)}if(a.getPropertyTable()){let n=s.getExtension(V),i=a.getPropertyTable();r.propertyTable=n.listPropertyTables().indexOf(i)}return r}var Sr="INSTANCE_ATTRIBUTE",Qd=class extends X{static EXTENSION_NAME=pt;init(){this.extensionName=pt,this.propertyType="InstancedMesh",this.parentTypes=[F.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{attributes:new ue})}getAttribute(t){return this.getRefMap("attributes",t)}setAttribute(t,e){return this.setRefMap("attributes",t,e,{usage:Sr})}listAttributes(){return this.listRefMapValues("attributes")}listSemantics(){return this.listRefMapKeys("attributes")}},Zd=class extends ee{static EXTENSION_NAME=pt;extensionName=pt;prewriteTypes=[F.ACCESSOR];createInstancedMesh(){return new Qd(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(!e.extensions||!e.extensions.EXT_mesh_gpu_instancing)return;let s=e.extensions[pt],r=this.createInstancedMesh();for(let n in s.attributes)r.setAttribute(n,t.accessors[s.attributes[n]]);t.nodes[a].setExtension(pt,r)}),this}prewrite(t){t.accessorUsageGroupedByParent.add(Sr);for(let e of this.properties)for(let a of e.listAttributes())t.addAccessorToUsageGroup(a,Sr);return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listNodes().forEach(a=>{let s=a.getExtension(pt);if(s){let r=t.nodeIndexMap.get(a),n=e.json.nodes[r],i={attributes:{}};s.listSemantics().forEach(o=>{let c=s.getAttribute(o);i.attributes[o]=t.accessorIndexMap.get(c)}),n.extensions=n.extensions||{},n.extensions[pt]=i}}),this}},eu=(function(t){return t.QUANTIZE="quantize",t.FILTER="filter",t})({});function tu(t){return!t.extensions||!t.extensions.EXT_meshopt_compression?!1:!!t.extensions[Re].fallback}var{BYTE:au,SHORT:Ti,FLOAT:su}=U.ComponentType,{encodeNormalizedInt:Mi,decodeNormalizedInt:Rr}=ne;function ru(t,e,a,s){let{filter:r,bits:n}=s,i={array:t.getArray(),byteStride:t.getElementSize()*t.getComponentSize(),componentType:t.getComponentType(),normalized:t.getNormalized()};if(a!=="ATTRIBUTES")return i;if(r!=="NONE"){let o=t.getNormalized()?nu(t):new Float32Array(i.array);switch(r){case"EXPONENTIAL":i.byteStride=t.getElementSize()*4,i.componentType=su,i.normalized=!1,i.array=e.encodeFilterExp(o,t.getCount(),i.byteStride,n);break;case"OCTAHEDRAL":i.byteStride=n>8?8:4,i.componentType=n>8?Ti:au,i.normalized=!0,o=t.getElementSize()===3?ou(o):o,i.array=e.encodeFilterOct(o,t.getCount(),i.byteStride,n);break;case"QUATERNION":i.byteStride=8,i.componentType=Ti,i.normalized=!0,i.array=e.encodeFilterQuat(o,t.getCount(),i.byteStride,n);break;default:throw new Error("Invalid filter.")}i.min=t.getMin([]),i.max=t.getMax([]),t.getNormalized()&&(i.min=i.min.map(c=>Rr(c,t.getComponentType())),i.max=i.max.map(c=>Rr(c,t.getComponentType()))),i.normalized&&(i.min=i.min.map(c=>Mi(c,i.componentType)),i.max=i.max.map(c=>Mi(c,i.componentType)))}else i.byteStride%4&&(i.array=iu(i.array,t.getElementSize()),i.byteStride=i.array.byteLength/t.getCount());return i}function nu(t){let e=t.getComponentType(),a=t.getArray(),s=new Float32Array(a.length);for(let r=0;r<a.length;r++)s[r]=Rr(a[r],e);return s}function iu(t,e){let a=H.padNumber(t.BYTES_PER_ELEMENT*e)/t.BYTES_PER_ELEMENT,s=t.length/e,r=new t.constructor(s*a);for(let n=0;n*e<t.length;n++)for(let i=0;i<e;i++)r[n*a+i]=t[n*e+i];return r}function ou(t){let e=new Float32Array(t.length*4/3);for(let a=0,s=t.length/3;a<s;a++)e[a*4]=t[a*3],e[a*4+1]=t[a*3+1],e[a*4+2]=t[a*3+2];return e}function cu(t,e){return e===ft.BufferViewUsage.ELEMENT_ARRAY_BUFFER?t.listParents().some(a=>a instanceof pa&&a.getMode()===pa.Mode.TRIANGLES)?"TRIANGLES":"INDICES":"ATTRIBUTES"}function lu(t,e){let a=e.getGraph().listParentEdges(t).filter(s=>!(s.getParent()instanceof Tr));for(let s of a){let r=s.getName(),n=s.getAttributes().key||"",i=s.getParent().propertyType===F.PRIMITIVE_TARGET;if(r==="indices")return{filter:"NONE"};if(r==="attributes"){if(n==="POSITION")return{filter:"NONE"};if(n==="TEXCOORD_0")return{filter:"NONE"};if(n.startsWith("JOINTS_"))return{filter:"NONE"};if(n.startsWith("WEIGHTS_"))return{filter:"NONE"};if(n==="NORMAL"||n==="TANGENT")return i?{filter:"NONE"}:{filter:"OCTAHEDRAL",bits:8}}if(r==="output"){let o=Gi(t);return o==="rotation"?{filter:"QUATERNION",bits:16}:o==="translation"?{filter:"EXPONENTIAL",bits:12}:o==="scale"?{filter:"EXPONENTIAL",bits:12}:{filter:"NONE"}}if(r==="input")return{filter:"NONE"};if(r==="inverseBindMatrices")return{filter:"NONE"}}return{filter:"NONE"}}function Gi(t){for(let e of t.listParents())if(e instanceof ns){for(let a of e.listParents())if(a instanceof kr)return a.getTargetPath()}return null}var Ii={method:"quantize"},Nr=class extends ee{extensionName=Re;prereadTypes=[F.BUFFER,F.PRIMITIVE];prewriteTypes=[F.BUFFER,F.ACCESSOR];readDependencies=["meshopt.decoder"];writeDependencies=["meshopt.encoder"];static EXTENSION_NAME=Re;static EncoderMethod=eu;_decoder=null;_decoderFallbackBufferMap=new Map;_encoder=null;_encoderOptions=Ii;_encoderFallbackBuffer=null;_encoderBufferViews={};_encoderBufferViewData={};_encoderBufferViewAccessors={};install(t,e){return t==="meshopt.decoder"&&(this._decoder=e),t==="meshopt.encoder"&&(this._encoder=e),this}setEncoderOptions(t){return this._encoderOptions={...Ii,...t},this}preread(t,e){if(!this._decoder){if(!this.isRequired())return this;throw new Error(`[${Re}] Please install extension dependency, "meshopt.decoder".`)}if(!this._decoder.supported){if(!this.isRequired())return this;throw new Error(`[${Re}]: Missing WASM support.`)}return e===F.BUFFER?this._prereadBuffers(t):e===F.PRIMITIVE&&this._prereadPrimitives(t),this}_prereadBuffers(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach((a,s)=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let r=a.extensions[Re],n=r.byteOffset||0,i=r.byteLength||0,o=r.count,c=r.byteStride,d=new Uint8Array(o*c),b=e.json.buffers[r.buffer],f=b.uri?e.resources[b.uri]:e.resources[ht],v=H.toView(f,n,i);this._decoder.decodeGltfBuffer(d,o,c,v,r.mode,r.filter),t.bufferViews[s]=d})}_prereadPrimitives(t){let e=t.jsonDoc;(e.json.bufferViews||[]).forEach(a=>{if(!a.extensions||!a.extensions.EXT_meshopt_compression)return;let s=a.extensions[Re],r=t.buffers[s.buffer],n=t.buffers[a.buffer],i=e.json.buffers[a.buffer];tu(i)&&this._decoderFallbackBufferMap.set(n,r)})}read(t){if(!this.isRequired())return this;for(let[e,a]of this._decoderFallbackBufferMap){for(let s of e.listParents())s instanceof U&&s.swap(e,a);e.dispose()}return this}prewrite(t,e){return e===F.ACCESSOR?this._prewriteAccessors(t):e===F.BUFFER&&this._prewriteBuffers(t),this}_prewriteAccessors(t){let e=t.jsonDoc.json,a=this._encoder,s=this._encoderOptions,r=this.document.getGraph(),n=this.document.createBuffer(),i=this.document.getRoot().listBuffers().indexOf(n),o=1,c=new Map,d=b=>{for(let f of r.listParents(b)){if(f.propertyType===F.ROOT)continue;let v=c.get(b);return v===void 0&&c.set(b,v=o++),v}return-1};this._encoderFallbackBuffer=n,this._encoderBufferViews={},this._encoderBufferViewData={},this._encoderBufferViewAccessors={};for(let b of this.document.getRoot().listAccessors()){if(Gi(b)==="weights"||b.getSparse())continue;let f=t.getAccessorUsage(b),v=t.accessorUsageGroupedByParent.has(f)?d(b):null,x=cu(b,f),h=s.method==="filter"?lu(b,this.document):{filter:"NONE"},l=ru(b,a,x,h),{array:g,byteStride:u}=l,p=b.getBuffer();if(!p)throw new Error(`${Re}: Missing buffer for accessor.`);let y=this.document.getRoot().listBuffers().indexOf(p),w=[f,v,x,h.filter,u,y].join(":"),T=this._encoderBufferViews[w],I=this._encoderBufferViewData[w],S=this._encoderBufferViewAccessors[w];(!T||!I)&&(S=this._encoderBufferViewAccessors[w]=[],I=this._encoderBufferViewData[w]=[],T=this._encoderBufferViews[w]={buffer:i,target:ft.USAGE_TO_TARGET[f],byteOffset:0,byteLength:0,byteStride:f===ft.BufferViewUsage.ARRAY_BUFFER?u:void 0,extensions:{[Re]:{buffer:y,byteOffset:0,byteLength:0,mode:x,filter:h.filter!=="NONE"?h.filter:void 0,byteStride:u,count:0}}});let R=t.createAccessorDef(b);R.componentType=l.componentType,R.normalized=l.normalized,R.byteOffset=T.byteLength,R.min&&l.min&&(R.min=l.min),R.max&&l.max&&(R.max=l.max),t.accessorIndexMap.set(b,e.accessors.length),e.accessors.push(R),S.push(R),I.push(new Uint8Array(g.buffer,g.byteOffset,g.byteLength)),T.byteLength+=g.byteLength,T.extensions.EXT_meshopt_compression.count+=b.getCount()}}_prewriteBuffers(t){let e=this._encoder;for(let a in this._encoderBufferViews){let s=this._encoderBufferViews[a],r=this._encoderBufferViewData[a],n=this.document.getRoot().listBuffers()[s.extensions[Re].buffer],i=t.otherBufferViews.get(n)||[],{count:o,byteStride:c,mode:d}=s.extensions[Re],b=H.concat(r),f=e.encodeGltfBuffer(b,o,c,d),v=H.pad(f);s.extensions[Re].byteLength=f.byteLength,r.length=0,r.push(v),i.push(v),t.otherBufferViews.set(n,i)}}write(t){let e=0;for(let n in this._encoderBufferViews){let i=this._encoderBufferViews[n],o=this._encoderBufferViewData[n][0],c=t.otherBufferViewsIndexMap.get(o),d=this._encoderBufferViewAccessors[n];for(let x of d)x.bufferView=c;let b=t.jsonDoc.json.bufferViews[c],f=b.byteOffset||0;Object.assign(b,i),b.byteOffset=e;let v=b.extensions[Re];v.byteOffset=f,e+=H.padNumber(i.byteLength)}let a=this._encoderFallbackBuffer,s=t.bufferIndexMap.get(a),r=t.jsonDoc.json.buffers[s];return r.byteLength=e,r.extensions={[Re]:{fallback:!0}},a.dispose(),this}},du=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="StructuralMetadata",this.parentTypes=[F.ROOT]}getDefaults(){return Object.assign(super.getDefaults(),{schema:null,schemaUri:"",propertyTables:new me,propertyTextures:new me,propertyAttributes:new me})}getSchema(){return this.getRef("schema")}setSchema(t){return this.setRef("schema",t)}getSchemaUri(){return this.get("schemaUri")}setSchemaUri(t){return this.set("schemaUri",t)}listPropertyTables(){return this.listRefs("propertyTables")}addPropertyTable(t){return this.addRef("propertyTables",t)}removePropertyTable(t){return this.removeRef("propertyTables",t)}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},uu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Schema",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",version:"",classes:new ue,enums:new ue})}getId(){return this.get("id")}setId(t){return this.set("id",t)}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getVersion(){return this.get("version")}setVersion(t){return this.set("version",t)}setClass(t,e){return this.setRefMap("classes",t,e)}getClass(t){return this.getRefMap("classes",t)}listClassKeys(){return this.listRefMapKeys("classes")}listClassValues(){return this.listRefMapValues("classes")}setEnum(t,e){return this.setRefMap("enums",t,e)}getEnum(t){return this.getRefMap("enums",t)}listEnumKeys(){return this.listRefMapKeys("enums")}listEnumValues(){return this.listRefMapValues("enums")}},fu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Class",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",properties:new ue})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},hu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="ClassProperty",this.parentTypes=["Class"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",componentType:null,enumType:null,array:null,count:null,normalized:null,offset:null,scale:null,max:null,min:null,required:null,noData:null,default:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getType(){return this.get("type")}setType(t){return this.set("type",t)}getComponentType(){return this.get("componentType")}setComponentType(t){return this.set("componentType",t)}getEnumType(){return this.get("enumType")}setEnumType(t){return this.set("enumType",t)}getArray(){return this.get("array")}setArray(t){return this.set("array",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}getNormalized(){return this.get("normalized")}setNormalized(t){return this.set("normalized",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}getRequired(){return this.get("required")}setRequired(t){return this.set("required",t)}getNoData(){return this.get("noData")}setNoData(t){return this.set("noData",t)}getDefault(){return this.get("default")}setDefault(t){return this.set("default",t)}},bu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="Enum",this.parentTypes=["Schema"]}getDefaults(){return Object.assign(super.getDefaults(),{description:"",valueType:"UINT16",values:new me})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValueType(){return this.get("valueType")}setValueType(t){return this.set("valueType",t)}listValues(){return this.listRefs("values")}addEnumValue(t){return this.addRef("values",t)}removeEnumValue(t){return this.removeRef("values",t)}},pu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="EnumValue",this.parentTypes=["Enum"]}getDefaults(){return Object.assign(super.getDefaults(),{description:null})}getDescription(){return this.get("description")}setDescription(t){return this.set("description",t)}getValue(){return this.get("value")}setValue(t){return this.set("value",t)}},gu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTable",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getCount(){return this.get("count")}setCount(t){return this.set("count",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},mu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTableProperty",this.parentTypes=["PropertyTable"]}getDefaults(){return Object.assign(super.getDefaults(),{arrayOffsets:null,stringOffsets:null,arrayOffsetType:null,stringOffsetType:null,offset:null,scale:null,max:null,min:null})}getValues(){return this.get("values")}setValues(t){return this.set("values",t)}getArrayOffsets(){return this.get("arrayOffsets")}setArrayOffsets(t){return this.set("arrayOffsets",t)}getStringOffsets(){return this.get("stringOffsets")}setStringOffsets(t){return this.set("stringOffsets",t)}getArrayOffsetType(){return this.get("arrayOffsetType")}setArrayOffsetType(t){return this.set("arrayOffsetType",t)}getStringOffsetType(){return this.get("stringOffsetType")}setStringOffsetType(t){return this.set("stringOffsetType",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},yu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTexture",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},xu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyTextureProperty",this.parentTypes=["PropertyTexture"]}getDefaults(){let t=new se(this.graph,"textureInfo");return t.setMinFilter(se.MagFilter.NEAREST),t.setMagFilter(se.MagFilter.NEAREST),Object.assign(super.getDefaults(),{channels:[0],texture:null,textureInfo:t,offset:null,scale:null,max:null,min:null})}getChannels(){return this.get("channels")}setChannels(t){return this.set("channels",t)}getTexture(){return this.getRef("texture")}setTexture(t){return this.setRef("texture",t)}getTextureInfo(){return this.getRef("texture")?this.getRef("textureInfo"):null}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},vu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttribute",this.parentTypes=["StructuralMetadata"]}getDefaults(){return Object.assign(super.getDefaults(),{properties:new ue})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}setProperty(t,e){return this.setRefMap("properties",t,e)}getProperty(t){return this.getRefMap("properties",t)}listPropertyKeys(){return this.listRefMapKeys("properties")}listPropertyValues(){return this.listRefMapValues("properties")}},wu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="PropertyAttributeProperty",this.parentTypes=["PropertyAttribute"]}getDefaults(){return Object.assign(super.getDefaults(),{offset:null,scale:null,max:null,min:null})}getAttribute(){return this.get("attribute")}setAttribute(t){return this.set("attribute",t)}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getMax(){return this.get("max")}setMax(t){return this.set("max",t)}getMin(){return this.get("min")}setMin(t){return this.set("min",t)}},Eu=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="NodeStructuralMetadata",this.parentTypes=[F.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{class:"",properties:{}})}getClass(){return this.get("class")}setClass(t){return this.set("class",t)}getProperties(){return this.get("properties")}setProperties(t){return this.set("properties",t)}},ku=class extends X{static EXTENSION_NAME=V;init(){this.extensionName=V,this.propertyType="MeshPrimitiveStructuralMetadata",this.parentTypes=[F.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{propertyTextures:new me,propertyAttributes:new me})}listPropertyTextures(){return this.listRefs("propertyTextures")}addPropertyTexture(t){return this.addRef("propertyTextures",t)}removePropertyTexture(t){return this.removeRef("propertyTextures",t)}listPropertyAttributes(){return this.listRefs("propertyAttributes")}addPropertyAttribute(t){return this.addRef("propertyAttributes",t)}removePropertyAttribute(t){return this.removeRef("propertyAttributes",t)}},Tu=class extends ee{extensionName=V;static EXTENSION_NAME=V;prewriteTypes=[F.BUFFER];prereadTypes=[F.SCENE];createStructuralMetadata(){return new du(this.document.getGraph())}createSchema(){return new uu(this.document.getGraph())}createClass(){return new fu(this.document.getGraph())}createClassProperty(){return new hu(this.document.getGraph())}createEnum(){return new bu(this.document.getGraph())}createEnumValue(){return new pu(this.document.getGraph())}createPropertyTable(){return new gu(this.document.getGraph())}createPropertyTableProperty(){return new mu(this.document.getGraph())}createPropertyTexture(){return new yu(this.document.getGraph())}createPropertyTextureProperty(){return new xu(this.document.getGraph())}createPropertyAttribute(){return new vu(this.document.getGraph())}createPropertyAttributeProperty(){return new wu(this.document.getGraph())}createNodeStructuralMetadata(){return new Eu(this.document.getGraph())}createMeshPrimitiveStructuralMetadata(){return new ku(this.document.getGraph())}read(t){return this}preread(t){let e=this.document.getRoot(),{json:a}=t.jsonDoc,s=a.extensions[V],r=Mu(this,t,s);return e.setExtension(V,r),(a.meshes||[]).forEach((n,i)=>{let o=t.meshes[i].listPrimitives();(n.primitives||[]).forEach((c,d)=>{let b=o[d];this._readPrimitive(r,b,c)})}),(a.nodes||[]).forEach((n,i)=>{this._readNode(t.nodes[i],n)}),this}_readPrimitive(t,e,a){if(!a.extensions||!a.extensions.EXT_structural_metadata)return;let s=this.createMeshPrimitiveStructuralMetadata(),r=a.extensions[V],n=t.listPropertyTextures(),i=r.propertyTextures||[];for(let d of i){let b=n[d];s.addPropertyTexture(b)}let o=t.listPropertyAttributes(),c=r.propertyAttributes||[];for(let d of c){let b=o[d];s.addPropertyAttribute(b)}e.setExtension(V,s)}_readNode(t,e){if(!e.extensions||!e.extensions.EXT_structural_metadata)return;let a=e.extensions[V],s=this.createNodeStructuralMetadata().setClass(a.class).setProperties(a.properties);t.setExtension(V,s)}write(t){let e=this.document.getRoot(),a=e.getExtension(V);if(!a)return this;let s=t.jsonDoc.json,r=Pu(t,a);s.extensions=s.extensions||{},s.extensions[V]=r;let n=e.listMeshes(),i=s.meshes;if(i)for(let d of n){let b=i[t.meshIndexMap.get(d)];d.listPrimitives().forEach((f,v)=>{let x=b.primitives[v];this._writePrimitive(a,f,x)})}let o=e.listNodes(),c=s.nodes;if(c)for(let d of o){let b=t.nodeIndexMap.get(d);this._writeNode(d,c[b])}return this}_writePrimitive(t,e,a){let s=e.getExtension(V);if(!s)return;let r=t.listPropertyTextures(),n=t.listPropertyAttributes(),i,o,c=s.listPropertyTextures();if(c.length>0){i=[];for(let f of c){let v=r.indexOf(f);if(v>=0)i.push(v);else throw new Error(`${V}: Invalid property texture in mesh primitive`)}}let d=s.listPropertyAttributes();if(d.length>0){o=[];for(let f of d){let v=n.indexOf(f);if(v>=0)o.push(v);else throw new Error(`${V}: Invalid property attribute in mesh primitive`)}}let b={propertyTextures:i,propertyAttributes:o};a.extensions=a.extensions||{},a.extensions[V]=b}_writeNode(t,e){let a=t.getExtension("EXT_structural_metadata");a&&(e.extensions=e.extensions||{},e.extensions[V]={class:a.getClass(),properties:a.getProperties()})}prewrite(t,e){return e===F.BUFFER&&this._prewriteBuffers(t),this}_prewriteBuffers(t){let e=this.document,a=e.getRoot().getExtension(V);t.jsonDoc.json.bufferViews||=[];for(let s of a.listPropertyTables())for(let r of s.listPropertyValues()){let n=Ju(e,t);n.push(r.getValues());let i=r.getArrayOffsets();i&&n.push(i);let o=r.getStringOffsets();o&&n.push(o)}}};function Mu(t,e,a){let s=t.createStructuralMetadata();if(a.schema!==void 0){let o=Iu(t,a.schema);s.setSchema(o)}else if(a.schemaUri){let o=a.schemaUri;s.setSchemaUri(o)}let r=a.propertyTextures||[];for(let o of r){let c=Nu(t,e,o);s.addPropertyTexture(c)}let n=a.propertyTables||[];for(let o of n){let c=ju(t,e,o);s.addPropertyTable(c)}let i=a.propertyAttributes||[];for(let o of i){let c=Cu(t,o);s.addPropertyAttribute(c)}return s}function Iu(t,e){let a=t.createSchema().setId(e.id);e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.version!==void 0&&a.setVersion(e.version);let s=e.classes||{};for(let n of Object.keys(s)){let i=s[n];a.setClass(n,Su(t,i))}let r=e.enums||{};for(let n of Object.keys(r))a.setEnum(n,Au(t,r[n]));return a}function Su(t,e){let a=t.createClass();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description);let s=e.properties||{};for(let r of Object.keys(s)){let n=Ru(t,s[r]);a.setProperty(r,n)}return a}function Ru(t,e){let a=t.createClassProperty().setType(e.type);return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.componentType!==void 0&&a.setComponentType(e.componentType),e.enumType!==void 0&&a.setEnumType(e.enumType),e.array!==void 0&&a.setArray(e.array),e.count!==void 0&&a.setCount(e.count),e.normalized!==void 0&&a.setNormalized(e.normalized),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),e.required!==void 0&&a.setRequired(e.required),e.noData!==void 0&&a.setNoData(e.noData),e.default!==void 0&&a.setDefault(e.default),a}function Au(t,e){let a=t.createEnum();e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.valueType!==void 0&&a.setValueType(e.valueType);let s=e.values||{};for(let r of s)a.addEnumValue(_u(t,r));return a}function _u(t,e){let a=t.createEnumValue();return e.name!==void 0&&a.setName(e.name),e.description!==void 0&&a.setDescription(e.description),e.value!==void 0&&a.setValue(e.value),a}function Nu(t,e,a){let s=t.createPropertyTexture();s.setClass(a.class),a.name!==void 0&&s.setName(a.name);let r=a.properties||{};for(let n of Object.keys(r)){let i=Fu(t,e,r[n]);s.setProperty(n,i)}return s}function Fu(t,e,a){let s=t.createPropertyTextureProperty(),r=e.jsonDoc.json.textures||[];a.channels&&s.setChannels(a.channels);let n=r[a.index].source;if(n!==void 0){let i=e.textures[n];s.setTexture(i);let o=s.getTextureInfo();o&&e.setTextureInfo(o,a)}return a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function ju(t,e,a){let s=t.createPropertyTable().setClass(a.class).setCount(a.count);a.name!==void 0&&s.setName(a.name);let r=a.properties||{};for(let n of Object.keys(r)){let i=Bu(t,e,r[n]);s.setProperty(n,i)}return s}function Bu(t,e,a){let s=t.createPropertyTableProperty(),r=Mr(e,a.values);if(s.setValues(r),a.arrayOffsets!==void 0){let n=Mr(e,a.arrayOffsets);s.setArrayOffsets(n)}if(a.stringOffsets!==void 0){let n=Mr(e,a.stringOffsets);s.setStringOffsets(n)}return a.arrayOffsetType!==void 0&&s.setArrayOffsetType(a.arrayOffsetType),a.stringOffsetType!==void 0&&s.setStringOffsetType(a.stringOffsetType),a.offset!==void 0&&s.setOffset(a.offset),a.scale!==void 0&&s.setScale(a.scale),a.max!==void 0&&s.setMax(a.max),a.min!==void 0&&s.setMin(a.min),s}function Cu(t,e){let a=t.createPropertyAttribute();a.setClass(e.class),e.name!==void 0&&a.setName(e.name);let s=e.properties||{};for(let r of Object.keys(s)){let n=Ou(t,s[r]);a.setProperty(r,n)}return a}function Ou(t,e){let a=t.createPropertyAttributeProperty();return a.setAttribute(e.attribute),e.offset!==void 0&&a.setOffset(e.offset),e.scale!==void 0&&a.setScale(e.scale),e.max!==void 0&&a.setMax(e.max),e.min!==void 0&&a.setMin(e.min),a}function Pu(t,e){let a={},s=e.getSchema();s&&(a.schema=Du(s));let r=e.getSchemaUri();r&&(a.schemaUri=r);let n=e.listPropertyTables();if(n.length>0){let c=[];for(let d of n){let b=zu(t,d);c.push(b)}a.propertyTables=c}let i=e.listPropertyTextures();if(i.length>0){let c=[];for(let d of i){let b=Xu(t,d);c.push(b)}a.propertyTextures=c}let o=e.listPropertyAttributes();if(o.length>0){let c=[];for(let d of o){let b=Hu(d);c.push(b)}a.propertyAttributes=c}return a}function Du(t){let e={id:t.getId()},a=t.listClassKeys();if(a.length>0){e.classes={};for(let r of a){let n=Lu(t.getClass(r));e.classes[r]=n}}let s=t.listEnumKeys();if(s.length>0){e.enums={};for(let r of s){let n=Ku(t.getEnum(r));e.enums[r]=n}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getVersion()&&(e.version=t.getVersion()),e}function Lu(t){let e={},a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let r=t.getProperty(s);e.properties[s]=Uu(r)}}return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),e}function Uu(t){let e={type:t.getType()};return t.getArray()&&(e.array=t.getArray()),t.getNormalized()&&(e.normalized=t.getNormalized()),t.getRequired()&&(e.required=t.getRequired()),t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getComponentType()!=null&&(e.componentType=t.getComponentType()),t.getEnumType()!=null&&(e.enumType=t.getEnumType()),t.getCount()!=null&&(e.count=t.getCount()),t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),t.getNoData()!=null&&(e.noData=t.getNoData()),t.getDefault()!=null&&(e.default=t.getDefault()),e}function Ku(t){let e={values:t.listValues().map(Gu)};return t.getName()&&(e.name=t.getName()),t.getDescription()&&(e.description=t.getDescription()),t.getValueType()!=="UINT16"&&(e.valueType=t.getValueType()),e}function Gu(t){let e={name:t.getName(),value:t.getValue()};return t.getDescription()&&(e.description=t.getDescription()),e}function zu(t,e){let a={class:e.getClass(),count:e.getCount()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let r of s){let n=Vu(t,e.getProperty(r));a.properties[r]=n}}return a}function Vu(t,e){let a=e.getValues(),s={values:t.otherBufferViewsIndexMap.get(a)};if(e.getArrayOffsets()){let r=e.getArrayOffsets();s.arrayOffsets=t.otherBufferViewsIndexMap.get(r)}if(e.getStringOffsets()){let r=e.getStringOffsets();s.stringOffsets=t.otherBufferViewsIndexMap.get(r)}return e.getArrayOffsetType()!=null&&(s.arrayOffsetType=e.getArrayOffsetType()),e.getStringOffsetType()!=null&&(s.stringOffsetType=e.getStringOffsetType()),e.getOffset()!=null&&(s.offset=e.getOffset()),e.getScale()!=null&&(s.scale=e.getScale()),e.getMax()!=null&&(s.max=e.getMax()),e.getMin()!=null&&(s.min=e.getMin()),s}function Hu(t){let e={class:t.getClass()};t.getName()&&(e.name=t.getName());let a=t.listPropertyKeys();if(a.length>0){e.properties={};for(let s of a){let r=qu(t.getProperty(s));e.properties[s]=r}}return e}function qu(t){let e={attribute:t.getAttribute()};return t.getOffset()!=null&&(e.offset=t.getOffset()),t.getScale()!=null&&(e.scale=t.getScale()),t.getMax()!=null&&(e.max=t.getMax()),t.getMin()!=null&&(e.min=t.getMin()),e}function Xu(t,e){let a={class:e.getClass()};e.getName()&&(a.name=e.getName());let s=e.listPropertyKeys();if(s.length>0){a.properties={};for(let r of s){let n=Wu(t,e.getProperty(r));a.properties[r]=n}}return a}function Wu(t,e){let a=e.getTexture(),s=e.getTextureInfo(),r=e.getChannels(),n=t.createTextureInfoDef(a,s);return ne.eq(r,[0])||(n.channels=r),e.getOffset()!=null&&(n.offset=e.getOffset()),e.getScale()!=null&&(n.scale=e.getScale()),e.getMax()!=null&&(n.max=e.getMax()),e.getMin()!=null&&(n.min=e.getMin()),n}function Mr(t,e){let a=t.jsonDoc,s=a.json.buffers||[],r=(a.json.bufferViews||[])[e],n=s[r.buffer],i=n.uri?a.resources[n.uri]:a.resources[ht],o=r.byteOffset||0,c=r.byteLength;return i.slice(o,o+c)}function Ju(t,e){let a=t.getRoot().listBuffers()[0],s=e.otherBufferViews.get(a);return s||(s=[],e.otherBufferViews.set(a,s)),s}var Yu=class{match(t){return t.length>=12&&H.decodeText(t.slice(4,12))==="ftypavif"}getSize(t){if(!this.match(t))return null;let e=new DataView(t.buffer,t.byteOffset,t.byteLength),a=Si(e,0);if(!a)return null;let s=a.end;for(;a=Si(e,s);)if(a.type==="meta")s=a.start+4;else if(a.type==="iprp"||a.type==="ipco")s=a.start;else{if(a.type==="ispe")return[e.getUint32(a.start+4),e.getUint32(a.start+8)];if(a.type==="mdat")break;s=a.end}return null}getChannels(t){return 4}},$u=class extends ee{extensionName=ls;prereadTypes=[F.TEXTURE];static EXTENSION_NAME=ls;static register(){Je.registerFormat("image/avif",new Yu)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_avif&&(e.source=e.extensions[ls].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/avif"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[ls]={source:r.source},delete r.source)})}}),this}};function Si(t,e){if(t.byteLength<4+e)return null;let a=t.getUint32(e);return t.byteLength<a+e||a<8?null:{type:H.decodeText(new Uint8Array(t.buffer,t.byteOffset+e+4,4)),start:e+8,end:e+a}}var Qu=class{match(t){return t.length>=12&&t[8]===87&&t[9]===69&&t[10]===66&&t[11]===80}getSize(t){let e=H.decodeText(t.slice(0,4)),a=H.decodeText(t.slice(8,12));if(e!=="RIFF"||a!=="WEBP")return null;let s=new DataView(t.buffer,t.byteOffset),r=12;for(;r<s.byteLength;){let n=H.decodeText(new Uint8Array([s.getUint8(r),s.getUint8(r+1),s.getUint8(r+2),s.getUint8(r+3)])),i=s.getUint32(r+4,!0);if(n==="VP8 ")return[s.getInt16(r+14,!0)&16383,s.getInt16(r+16,!0)&16383];if(n==="VP8L"){let o=s.getUint8(r+9),c=s.getUint8(r+10),d=s.getUint8(r+11),b=s.getUint8(r+12);return[1+((c&63)<<8|o),1+((b&15)<<10|d<<2|(c&192)>>6)]}r+=8+i+i%2}return null}getChannels(t){return 4}},Zu=class extends ee{extensionName=cs;prereadTypes=[F.TEXTURE];static EXTENSION_NAME=cs;static register(){Je.registerFormat("image/webp",new Qu)}preread(t){return(t.jsonDoc.json.textures||[]).forEach(e=>{e.extensions&&e.extensions.EXT_texture_webp&&(e.source=e.extensions[cs].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/webp"){let s=t.imageIndexMap.get(a);(e.json.textures||[]).forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[cs]={source:r.source},delete r.source)})}}),this}},Ri=Vd,ef=class extends ee{extensionName=Ri;static EXTENSION_NAME=Ri;read(t){return this}write(t){return this}},Ai=Hd,tf=class extends ee{extensionName=Ai;static EXTENSION_NAME=Ai;read(t){return this}write(t){return this}},he,zi,Vi;function af(t,e){let a=new he.DecoderBuffer;try{if(a.Init(e,e.length),t.GetEncodedGeometryType(a)!==he.TRIANGULAR_MESH)throw new Error(`[${le}] Unknown geometry type.`);let s=new he.Mesh;if(!t.DecodeBufferToMesh(a,s).ok()||s.ptr===0)throw new Error(`[${le}] Decoding failure.`);return s}finally{he.destroy(a)}}function sf(t,e){let a=e.num_faces()*3,s,r;if(e.num_points()<=65534){let n=a*Uint16Array.BYTES_PER_ELEMENT;s=he._malloc(n),t.GetTrianglesUInt16Array(e,n,s),r=new Uint16Array(he.HEAPU16.buffer,s,a).slice()}else{let n=a*Uint32Array.BYTES_PER_ELEMENT;s=he._malloc(n),t.GetTrianglesUInt32Array(e,n,s),r=new Uint32Array(he.HEAPU32.buffer,s,a).slice()}return he._free(s),r}function rf(t,e,a,s){let r=Vi[s.componentType],n=zi[s.componentType],i=a.num_components(),o=e.num_points()*i,c=o*n.BYTES_PER_ELEMENT,d=he._malloc(c);t.GetAttributeDataArrayForAllPoints(e,a,r,c,d);let b=new n(he.HEAPF32.buffer,d,o).slice();return he._free(d),b}function nf(t){he=t,zi={[U.ComponentType.FLOAT]:Float32Array,[U.ComponentType.UNSIGNED_INT]:Uint32Array,[U.ComponentType.UNSIGNED_SHORT]:Uint16Array,[U.ComponentType.UNSIGNED_BYTE]:Uint8Array,[U.ComponentType.SHORT]:Int16Array,[U.ComponentType.BYTE]:Int8Array},Vi={[U.ComponentType.FLOAT]:he.DT_FLOAT32,[U.ComponentType.UNSIGNED_INT]:he.DT_UINT32,[U.ComponentType.UNSIGNED_SHORT]:he.DT_UINT16,[U.ComponentType.UNSIGNED_BYTE]:he.DT_UINT8,[U.ComponentType.SHORT]:he.DT_INT16,[U.ComponentType.BYTE]:he.DT_INT8}}var Pe,of=(function(t){return t[t.EDGEBREAKER=1]="EDGEBREAKER",t[t.SEQUENTIAL=0]="SEQUENTIAL",t})({}),Hi={POSITION:14,NORMAL:10,COLOR:8,TEX_COORD:12,GENERIC:12},_i={decodeSpeed:5,encodeSpeed:5,method:1,quantizationBits:Hi,quantizationVolume:"mesh"};function cf(t){Pe=t}function lf(t,e=_i){let a={..._i,...e};a.quantizationBits={...Hi,...e.quantizationBits};let s=new Pe.MeshBuilder,r=new Pe.Mesh,n=new Pe.ExpertEncoder(r),i={},o=new Pe.DracoInt8Array,c=t.listTargets().length>0,d=!1;for(let l of t.listSemantics()){let g=t.getAttribute(l);if(g.getSparse()){d=!0;continue}let u=df(l),p=uf(s,g.getComponentType(),r,Pe[u],g.getCount(),g.getElementSize(),g.getArray());if(p===-1)throw new Error(`Error compressing "${l}" attribute.`);if(i[l]=p,a.quantizationVolume==="mesh"||l!=="POSITION")n.SetAttributeQuantization(p,a.quantizationBits[u]);else if(typeof a.quantizationVolume=="object"){let{quantizationVolume:y}=a,w=Math.max(y.max[0]-y.min[0],y.max[1]-y.min[1],y.max[2]-y.min[2]);n.SetAttributeExplicitQuantization(p,a.quantizationBits[u],g.getElementSize(),y.min,w)}else throw new Error("Invalid quantization volume state.")}let b=t.getIndices();if(!b)throw new Ar("Primitive must have indices.");s.AddFacesToMesh(r,b.getCount()/3,b.getArray()),n.SetSpeedOptions(a.encodeSpeed,a.decodeSpeed),n.SetTrackEncodedProperties(!0),a.method===0||c||d?n.SetEncodingMethod(Pe.MESH_SEQUENTIAL_ENCODING):n.SetEncodingMethod(Pe.MESH_EDGEBREAKER_ENCODING);let f=n.EncodeToDracoBuffer(!(c||d),o);if(f<=0)throw new Ar("Error applying Draco compression.");let v=new Uint8Array(f);for(let l=0;l<f;++l)v[l]=o.GetValue(l);let x=n.GetNumberOfEncodedPoints(),h=n.GetNumberOfEncodedFaces()*3;return Pe.destroy(o),Pe.destroy(r),Pe.destroy(s),Pe.destroy(n),{numVertices:x,numIndices:h,data:v,attributeIDs:i}}function df(t){return t==="POSITION"?"POSITION":t==="NORMAL"?"NORMAL":t.startsWith("COLOR_")?"COLOR":t.startsWith("TEXCOORD_")?"TEX_COORD":"GENERIC"}function uf(t,e,a,s,r,n,i){switch(e){case U.ComponentType.UNSIGNED_BYTE:return t.AddUInt8Attribute(a,s,r,n,i);case U.ComponentType.BYTE:return t.AddInt8Attribute(a,s,r,n,i);case U.ComponentType.UNSIGNED_SHORT:return t.AddUInt16Attribute(a,s,r,n,i);case U.ComponentType.SHORT:return t.AddInt16Attribute(a,s,r,n,i);case U.ComponentType.UNSIGNED_INT:return t.AddUInt32Attribute(a,s,r,n,i);case U.ComponentType.FLOAT:return t.AddFloatAttribute(a,s,r,n,i);default:throw new Error(`Unexpected component type, "${e}".`)}}var Ar=class extends Error{},ff=class extends ee{extensionName=le;prereadTypes=[F.PRIMITIVE];prewriteTypes=[F.ACCESSOR];readDependencies=["draco3d.decoder"];writeDependencies=["draco3d.encoder"];static EXTENSION_NAME=le;static EncoderMethod=of;_decoderModule=null;_encoderModule=null;_encoderOptions={};install(t,e){return t==="draco3d.decoder"&&(this._decoderModule=e,nf(this._decoderModule)),t==="draco3d.encoder"&&(this._encoderModule=e,cf(this._encoderModule)),this}setEncoderOptions(t){return this._encoderOptions=t,this}preread(t){if(!this._decoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.decoder".`);let e=this.document.getLogger(),a=t.jsonDoc,s=new Map;try{let r=a.json.meshes||[];for(let n of r)for(let i of n.primitives){if(!i.extensions||!i.extensions.KHR_draco_mesh_compression)continue;let o=i.extensions[le],[c,d]=s.get(o.bufferView)||[];if(!d||!c){let b=a.json.bufferViews[o.bufferView],f=a.json.buffers[b.buffer],v=f.uri?a.resources[f.uri]:a.resources[ht],x=b.byteOffset||0,h=b.byteLength,l=H.toView(v,x,h);c=new this._decoderModule.Decoder,d=af(c,l),s.set(o.bufferView,[c,d]),e.debug(`[${le}] Decompressed ${l.byteLength} bytes.`)}for(let b in o.attributes){let f=t.jsonDoc.json.accessors[i.attributes[b]],v=c.GetAttributeByUniqueId(d,o.attributes[b]),x=rf(c,d,v,f);t.accessors[i.attributes[b]].setArray(x)}i.indices!==void 0&&t.accessors[i.indices].setArray(sf(c,d))}}finally{for(let[r,n]of Array.from(s.values()))this._decoderModule.destroy(r),this._decoderModule.destroy(n)}return this}read(t){return this}prewrite(t,e){if(!this._encoderModule)throw new Error(`[${le}] Please install extension dependency, "draco3d.encoder".`);let a=this.document.getLogger();a.debug(`[${le}] Compression options: ${JSON.stringify(this._encoderOptions)}`);let s=hf(this.document),r=new Map,n="mesh";this._encoderOptions.quantizationVolume==="scene"&&(this.document.getRoot().listScenes().length!==1?a.warn(`[${le}]: quantizationVolume=scene requires exactly 1 scene.`):n=si(this.document.getRoot().listScenes().pop()));for(let i of Array.from(s.keys())){let o=s.get(i);if(!o)throw new Error("Unexpected primitive.");if(r.has(o)){r.set(o,r.get(o));continue}let c=i.getIndices(),d=t.jsonDoc.json.accessors,b;try{b=lf(i,{...this._encoderOptions,quantizationVolume:n})}catch(x){if(x instanceof Ar){a.warn(`[${le}]: ${x.message} Skipping primitive compression.`);continue}throw x}r.set(o,b);let f=t.createAccessorDef(c);f.count=b.numIndices,t.accessorIndexMap.set(c,d.length),d.push(f),b.numVertices>65534&&U.getComponentSize(f.componentType)<=2?f.componentType=U.ComponentType.UNSIGNED_INT:b.numVertices>254&&U.getComponentSize(f.componentType)<=1&&(f.componentType=U.ComponentType.UNSIGNED_SHORT);for(let x of i.listSemantics()){let h=i.getAttribute(x);if(b.attributeIDs[x]===void 0)continue;let l=t.createAccessorDef(h);l.count=b.numVertices,t.accessorIndexMap.set(h,d.length),d.push(l)}let v=i.getAttribute("POSITION").getBuffer()||this.document.getRoot().listBuffers()[0];t.otherBufferViews.has(v)||t.otherBufferViews.set(v,[]),t.otherBufferViews.get(v).push(b.data)}return a.debug(`[${le}] Compressed ${s.size} primitives.`),t.extensionData[le]={primitiveHashMap:s,primitiveEncodingMap:r},this}write(t){let e=t.extensionData[le];for(let a of this.document.getRoot().listMeshes()){let s=t.jsonDoc.json.meshes[t.meshIndexMap.get(a)];for(let r=0;r<a.listPrimitives().length;r++){let n=a.listPrimitives()[r],i=s.primitives[r],o=e.primitiveHashMap.get(n);if(!o)continue;let c=e.primitiveEncodingMap.get(o);c&&(i.extensions=i.extensions||{},i.extensions[le]={bufferView:t.otherBufferViewsIndexMap.get(c.data),attributes:c.attributeIDs})}}if(!e.primitiveHashMap.size){let a=t.jsonDoc.json;a.extensionsUsed=(a.extensionsUsed||[]).filter(s=>s!==le),a.extensionsRequired=(a.extensionsRequired||[]).filter(s=>s!==le)}return this}};function hf(t){let e=t.getLogger(),a=new Set,s=new Set,r=0,n=0;for(let f of t.getRoot().listMeshes())for(let v of f.listPrimitives())v.getIndices()?v.getMode()!==pa.Mode.TRIANGLES?(s.add(v),n++):a.add(v):(s.add(v),r++);r>0&&e.warn(`[${le}] Skipping Draco compression of ${r} non-indexed primitives.`),n>0&&e.warn(`[${le}] Skipping Draco compression of ${n} non-TRIANGLES primitives.`);let i=t.getRoot().listAccessors(),o=new Map;for(let f=0;f<i.length;f++)o.set(i[f],f);let c=new Map,d=new Set,b=new Map;for(let f of Array.from(a)){let v=Ni(f,o);if(d.has(v)){b.set(f,v);continue}if(c.has(f.getIndices())){let x=f.getIndices(),h=x.clone();o.set(h,t.getRoot().listAccessors().length-1),f.swap(x,h)}for(let x of f.listAttributes())if(c.has(x)){let h=x.clone();o.set(h,t.getRoot().listAccessors().length-1),f.swap(x,h)}v=Ni(f,o),d.add(v),b.set(f,v),c.set(f.getIndices(),v);for(let x of f.listAttributes())c.set(x,v)}for(let f of Array.from(c.keys())){let v=new Set(f.listParents().map(x=>x.propertyType));if(v.size!==2||!v.has(F.PRIMITIVE)||!v.has(F.ROOT))throw new Error(`[${le}] Compressed accessors must only be used as indices or vertex attributes.`)}for(let f of Array.from(a)){let v=b.get(f),x=f.getIndices();if(c.get(x)!==v||f.listAttributes().some(h=>c.get(h)!==v))throw new Error(`[${le}] Draco primitives must share all, or no, accessors.`)}for(let f of Array.from(s)){let v=f.getIndices();if(c.has(v)||f.listAttributes().some(x=>c.has(x)))throw new Error(`[${le}] Accessor cannot be shared by compressed and uncompressed primitives.`)}return b}function Ni(t,e){let a=[],s=t.getIndices();a.push(e.get(s));for(let r of t.listAttributes())a.push(e.get(r));return a.sort().join("|")}var Fi=class qi extends X{static EXTENSION_NAME=at;static Type={POINT:"point",SPOT:"spot",DIRECTIONAL:"directional"};init(){this.extensionName=at,this.propertyType="Light",this.parentTypes=[F.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{color:[1,1,1],intensity:1,type:qi.Type.POINT,range:null,innerConeAngle:0,outerConeAngle:Math.PI/4})}getColor(){return this.get("color")}setColor(e){return this.set("color",e)}getIntensity(){return this.get("intensity")}setIntensity(e){return this.set("intensity",e)}getType(){return this.get("type")}setType(e){return this.set("type",e)}getRange(){return this.get("range")}setRange(e){return this.set("range",e)}getInnerConeAngle(){return this.get("innerConeAngle")}setInnerConeAngle(e){return this.set("innerConeAngle",e)}getOuterConeAngle(){return this.get("outerConeAngle")}setOuterConeAngle(e){return this.set("outerConeAngle",e)}},bf=class extends ee{extensionName=at;static EXTENSION_NAME=at;createLight(t=""){return new Fi(this.document.getGraph(),t)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_lights_punctual)return this;let a=(e.json.extensions.KHR_lights_punctual.lights||[]).map(s=>{let r=this.createLight().setName(s.name||"").setType(s.type);return s.extras&&r.setExtras(s.extras),s.color!==void 0&&r.setColor(s.color),s.intensity!==void 0&&r.setIntensity(s.intensity),s.range!==void 0&&r.setRange(s.range),s.spot?.innerConeAngle!==void 0&&r.setInnerConeAngle(s.spot.innerConeAngle),s.spot?.outerConeAngle!==void 0&&r.setOuterConeAngle(s.spot.outerConeAngle),r});return e.json.nodes.forEach((s,r)=>{if(!s.extensions||!s.extensions.KHR_lights_punctual)return;let n=s.extensions[at];t.nodes[r].setExtension(at,a[n.light])}),this}write(t){let e=t.jsonDoc;if(this.properties.size===0)return this;let a=[],s=new Map;for(let r of this.properties){let n=r,i=t.createPropertyDef(r);i.type=n.getType(),ne.eq(n.getColor(),[1,1,1])||(i.color=n.getColor()),n.getIntensity()!==1&&(i.intensity=n.getIntensity()),n.getRange()!=null&&(i.range=n.getRange()),n.getName()&&(i.name=n.getName()),n.getType()===Fi.Type.SPOT&&(i.spot={innerConeAngle:n.getInnerConeAngle(),outerConeAngle:n.getOuterConeAngle()}),a.push(i),s.set(n,a.length-1)}return this.document.getRoot().listNodes().forEach(r=>{let n=r.getExtension(at);if(n){let i=t.nodeIndexMap.get(r),o=e.json.nodes[i];o.extensions=o.extensions||{},o.extensions[at]={light:s.get(n)}}}),e.json.extensions=e.json.extensions||{},e.json.extensions[at]={lights:a},this}},{R:pf,G:gf,B:mf}=Ke,yf=class extends X{static EXTENSION_NAME=gt;init(){this.extensionName=gt,this.propertyType="Anisotropy",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{anisotropyStrength:0,anisotropyRotation:0,anisotropyTexture:null,anisotropyTextureInfo:new se(this.graph,"anisotropyTextureInfo")})}getAnisotropyStrength(){return this.get("anisotropyStrength")}setAnisotropyStrength(t){return this.set("anisotropyStrength",t)}getAnisotropyRotation(){return this.get("anisotropyRotation")}setAnisotropyRotation(t){return this.set("anisotropyRotation",t)}getAnisotropyTexture(){return this.getRef("anisotropyTexture")}getAnisotropyTextureInfo(){return this.getRef("anisotropyTexture")?this.getRef("anisotropyTextureInfo"):null}setAnisotropyTexture(t){return this.setRef("anisotropyTexture",t,{channels:pf|gf|mf})}},xf=class extends ee{static EXTENSION_NAME=gt;extensionName=gt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createAnisotropy(){return new yf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_anisotropy){let i=this.createAnisotropy();t.materials[n].setExtension(gt,i);let o=r.extensions[gt];if(o.extras&&i.setExtras(o.extras),o.anisotropyStrength!==void 0&&i.setAnisotropyStrength(o.anisotropyStrength),o.anisotropyRotation!==void 0&&i.setAnisotropyRotation(o.anisotropyRotation),o.anisotropyTexture!==void 0){let c=o.anisotropyTexture,d=t.textures[s[c.index].source];i.setAnisotropyTexture(d),t.setTextureInfo(i.getAnisotropyTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(gt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[gt]=i,s.getAnisotropyStrength()>0&&(i.anisotropyStrength=s.getAnisotropyStrength()),s.getAnisotropyRotation()!==0&&(i.anisotropyRotation=s.getAnisotropyRotation()),s.getAnisotropyTexture()){let o=s.getAnisotropyTexture(),c=s.getAnisotropyTextureInfo();i.anisotropyTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:ji,G:Bi,B:vf}=Ke,wf=class extends X{static EXTENSION_NAME=mt;init(){this.extensionName=mt,this.propertyType="Clearcoat",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{clearcoatFactor:0,clearcoatTexture:null,clearcoatTextureInfo:new se(this.graph,"clearcoatTextureInfo"),clearcoatRoughnessFactor:0,clearcoatRoughnessTexture:null,clearcoatRoughnessTextureInfo:new se(this.graph,"clearcoatRoughnessTextureInfo"),clearcoatNormalScale:1,clearcoatNormalTexture:null,clearcoatNormalTextureInfo:new se(this.graph,"clearcoatNormalTextureInfo")})}getClearcoatFactor(){return this.get("clearcoatFactor")}setClearcoatFactor(t){return this.set("clearcoatFactor",t)}getClearcoatTexture(){return this.getRef("clearcoatTexture")}getClearcoatTextureInfo(){return this.getRef("clearcoatTexture")?this.getRef("clearcoatTextureInfo"):null}setClearcoatTexture(t){return this.setRef("clearcoatTexture",t,{channels:ji})}getClearcoatRoughnessFactor(){return this.get("clearcoatRoughnessFactor")}setClearcoatRoughnessFactor(t){return this.set("clearcoatRoughnessFactor",t)}getClearcoatRoughnessTexture(){return this.getRef("clearcoatRoughnessTexture")}getClearcoatRoughnessTextureInfo(){return this.getRef("clearcoatRoughnessTexture")?this.getRef("clearcoatRoughnessTextureInfo"):null}setClearcoatRoughnessTexture(t){return this.setRef("clearcoatRoughnessTexture",t,{channels:Bi})}getClearcoatNormalScale(){return this.get("clearcoatNormalScale")}setClearcoatNormalScale(t){return this.set("clearcoatNormalScale",t)}getClearcoatNormalTexture(){return this.getRef("clearcoatNormalTexture")}getClearcoatNormalTextureInfo(){return this.getRef("clearcoatNormalTexture")?this.getRef("clearcoatNormalTextureInfo"):null}setClearcoatNormalTexture(t){return this.setRef("clearcoatNormalTexture",t,{channels:ji|Bi|vf})}},Ef=class extends ee{static EXTENSION_NAME=mt;extensionName=mt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createClearcoat(){return new wf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_clearcoat){let i=this.createClearcoat();t.materials[n].setExtension(mt,i);let o=r.extensions[mt];if(o.extras&&i.setExtras(o.extras),o.clearcoatFactor!==void 0&&i.setClearcoatFactor(o.clearcoatFactor),o.clearcoatRoughnessFactor!==void 0&&i.setClearcoatRoughnessFactor(o.clearcoatRoughnessFactor),o.clearcoatTexture!==void 0){let c=o.clearcoatTexture,d=t.textures[s[c.index].source];i.setClearcoatTexture(d),t.setTextureInfo(i.getClearcoatTextureInfo(),c)}if(o.clearcoatRoughnessTexture!==void 0){let c=o.clearcoatRoughnessTexture,d=t.textures[s[c.index].source];i.setClearcoatRoughnessTexture(d),t.setTextureInfo(i.getClearcoatRoughnessTextureInfo(),c)}if(o.clearcoatNormalTexture!==void 0){let c=o.clearcoatNormalTexture,d=t.textures[s[c.index].source];i.setClearcoatNormalTexture(d),t.setTextureInfo(i.getClearcoatNormalTextureInfo(),c),c.scale!==void 0&&i.setClearcoatNormalScale(c.scale)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(mt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[mt]=i,i.clearcoatFactor=s.getClearcoatFactor(),i.clearcoatRoughnessFactor=s.getClearcoatRoughnessFactor(),s.getClearcoatTexture()){let o=s.getClearcoatTexture(),c=s.getClearcoatTextureInfo();i.clearcoatTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatRoughnessTexture()){let o=s.getClearcoatRoughnessTexture(),c=s.getClearcoatRoughnessTextureInfo();i.clearcoatRoughnessTexture=t.createTextureInfoDef(o,c)}if(s.getClearcoatNormalTexture()){let o=s.getClearcoatNormalTexture(),c=s.getClearcoatNormalTextureInfo();i.clearcoatNormalTexture=t.createTextureInfoDef(o,c),s.getClearcoatNormalScale()!==1&&(i.clearcoatNormalTexture.scale=s.getClearcoatNormalScale())}}}),this}},{R:kf,G:Tf,B:Mf,A:If}=Ke,Sf=class extends X{static EXTENSION_NAME=yt;init(){this.extensionName=yt,this.propertyType="DiffuseTransmission",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseTransmissionFactor:0,diffuseTransmissionTexture:null,diffuseTransmissionTextureInfo:new se(this.graph,"diffuseTransmissionTextureInfo"),diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorTexture:null,diffuseTransmissionColorTextureInfo:new se(this.graph,"diffuseTransmissionColorTextureInfo")})}getDiffuseTransmissionFactor(){return this.get("diffuseTransmissionFactor")}setDiffuseTransmissionFactor(t){return this.set("diffuseTransmissionFactor",t)}getDiffuseTransmissionTexture(){return this.getRef("diffuseTransmissionTexture")}getDiffuseTransmissionTextureInfo(){return this.getRef("diffuseTransmissionTexture")?this.getRef("diffuseTransmissionTextureInfo"):null}setDiffuseTransmissionTexture(t){return this.setRef("diffuseTransmissionTexture",t,{channels:If})}getDiffuseTransmissionColorFactor(){return this.get("diffuseTransmissionColorFactor")}setDiffuseTransmissionColorFactor(t){return this.set("diffuseTransmissionColorFactor",t)}getDiffuseTransmissionColorTexture(){return this.getRef("diffuseTransmissionColorTexture")}getDiffuseTransmissionColorTextureInfo(){return this.getRef("diffuseTransmissionColorTexture")?this.getRef("diffuseTransmissionColorTextureInfo"):null}setDiffuseTransmissionColorTexture(t){return this.setRef("diffuseTransmissionColorTexture",t,{channels:kf|Tf|Mf})}},Rf=class extends ee{extensionName=yt;static EXTENSION_NAME=yt;createDiffuseTransmission(){return new Sf(this.document.getGraph())}read(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_diffuse_transmission){let i=this.createDiffuseTransmission();t.materials[n].setExtension(yt,i);let o=r.extensions[yt];if(o.extras&&i.setExtras(o.extras),o.diffuseTransmissionFactor!==void 0&&i.setDiffuseTransmissionFactor(o.diffuseTransmissionFactor),o.diffuseTransmissionColorFactor!==void 0&&i.setDiffuseTransmissionColorFactor(o.diffuseTransmissionColorFactor),o.diffuseTransmissionTexture!==void 0){let c=o.diffuseTransmissionTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionTexture(d),t.setTextureInfo(i.getDiffuseTransmissionTextureInfo(),c)}if(o.diffuseTransmissionColorTexture!==void 0){let c=o.diffuseTransmissionColorTexture,d=t.textures[s[c.index].source];i.setDiffuseTransmissionColorTexture(d),t.setTextureInfo(i.getDiffuseTransmissionColorTextureInfo(),c)}}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listMaterials()){let s=a.getExtension(yt);if(!s)continue;let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[yt]=i,i.diffuseTransmissionFactor=s.getDiffuseTransmissionFactor(),i.diffuseTransmissionColorFactor=s.getDiffuseTransmissionColorFactor(),s.getDiffuseTransmissionTexture()){let o=s.getDiffuseTransmissionTexture(),c=s.getDiffuseTransmissionTextureInfo();i.diffuseTransmissionTexture=t.createTextureInfoDef(o,c)}if(s.getDiffuseTransmissionColorTexture()){let o=s.getDiffuseTransmissionColorTexture(),c=s.getDiffuseTransmissionColorTextureInfo();i.diffuseTransmissionColorTexture=t.createTextureInfoDef(o,c)}}return this}},Af=class extends X{static EXTENSION_NAME=xt;init(){this.extensionName=xt,this.propertyType="Dispersion",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{dispersion:0})}getDispersion(){return this.get("dispersion")}setDispersion(t){return this.set("dispersion",t)}},_f=class extends ee{static EXTENSION_NAME=xt;extensionName=xt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createDispersion(){return new Af(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_dispersion){let s=this.createDispersion();t.materials[a].setExtension(xt,s);let r=e.extensions[xt];r.extras&&s.setExtras(r.extras),r.dispersion!==void 0&&s.setDispersion(r.dispersion)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(xt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[xt]=i,i.dispersion=s.getDispersion()}}),this}},Nf=class extends X{static EXTENSION_NAME=vt;init(){this.extensionName=vt,this.propertyType="EmissiveStrength",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{emissiveStrength:1})}getEmissiveStrength(){return this.get("emissiveStrength")}setEmissiveStrength(t){return this.set("emissiveStrength",t)}},Ff=class extends ee{static EXTENSION_NAME=vt;extensionName=vt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createEmissiveStrength(){return new Nf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_emissive_strength){let s=this.createEmissiveStrength();t.materials[a].setExtension(vt,s);let r=e.extensions[vt];r.extras&&s.setExtras(r.extras),r.emissiveStrength!==void 0&&s.setEmissiveStrength(r.emissiveStrength)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(vt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[vt]=i,i.emissiveStrength=s.getEmissiveStrength()}}),this}},jf=class extends X{static EXTENSION_NAME=wt;init(){this.extensionName=wt,this.propertyType="IOR",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{ior:1.5})}getIOR(){return this.get("ior")}setIOR(t){return this.set("ior",t)}},Bf=class extends ee{static EXTENSION_NAME=wt;extensionName=wt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createIOR(){return new jf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_materials_ior){let s=this.createIOR();t.materials[a].setExtension(wt,s);let r=e.extensions[wt];r.extras&&s.setExtras(r.extras),r.ior!==void 0&&s.setIOR(r.ior)}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(wt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);n.extensions=n.extensions||{},n.extensions[wt]=i,i.ior=s.getIOR()}}),this}},{R:Cf,G:Of}=Ke,Pf=class extends X{static EXTENSION_NAME=Et;init(){this.extensionName=Et,this.propertyType="Iridescence",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{iridescenceFactor:0,iridescenceTexture:null,iridescenceTextureInfo:new se(this.graph,"iridescenceTextureInfo"),iridescenceIOR:1.3,iridescenceThicknessMinimum:100,iridescenceThicknessMaximum:400,iridescenceThicknessTexture:null,iridescenceThicknessTextureInfo:new se(this.graph,"iridescenceThicknessTextureInfo")})}getIridescenceFactor(){return this.get("iridescenceFactor")}setIridescenceFactor(t){return this.set("iridescenceFactor",t)}getIridescenceTexture(){return this.getRef("iridescenceTexture")}getIridescenceTextureInfo(){return this.getRef("iridescenceTexture")?this.getRef("iridescenceTextureInfo"):null}setIridescenceTexture(t){return this.setRef("iridescenceTexture",t,{channels:Cf})}getIridescenceIOR(){return this.get("iridescenceIOR")}setIridescenceIOR(t){return this.set("iridescenceIOR",t)}getIridescenceThicknessMinimum(){return this.get("iridescenceThicknessMinimum")}setIridescenceThicknessMinimum(t){return this.set("iridescenceThicknessMinimum",t)}getIridescenceThicknessMaximum(){return this.get("iridescenceThicknessMaximum")}setIridescenceThicknessMaximum(t){return this.set("iridescenceThicknessMaximum",t)}getIridescenceThicknessTexture(){return this.getRef("iridescenceThicknessTexture")}getIridescenceThicknessTextureInfo(){return this.getRef("iridescenceThicknessTexture")?this.getRef("iridescenceThicknessTextureInfo"):null}setIridescenceThicknessTexture(t){return this.setRef("iridescenceThicknessTexture",t,{channels:Of})}},Df=class extends ee{static EXTENSION_NAME=Et;extensionName=Et;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createIridescence(){return new Pf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_iridescence){let i=this.createIridescence();t.materials[n].setExtension(Et,i);let o=r.extensions[Et];if(o.extras&&i.setExtras(o.extras),o.iridescenceFactor!==void 0&&i.setIridescenceFactor(o.iridescenceFactor),o.iridescenceIor!==void 0&&i.setIridescenceIOR(o.iridescenceIor),o.iridescenceThicknessMinimum!==void 0&&i.setIridescenceThicknessMinimum(o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&i.setIridescenceThicknessMaximum(o.iridescenceThicknessMaximum),o.iridescenceTexture!==void 0){let c=o.iridescenceTexture,d=t.textures[s[c.index].source];i.setIridescenceTexture(d),t.setTextureInfo(i.getIridescenceTextureInfo(),c)}if(o.iridescenceThicknessTexture!==void 0){let c=o.iridescenceThicknessTexture,d=t.textures[s[c.index].source];i.setIridescenceThicknessTexture(d),t.setTextureInfo(i.getIridescenceThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Et);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Et]=i,s.getIridescenceFactor()>0&&(i.iridescenceFactor=s.getIridescenceFactor()),s.getIridescenceIOR()!==1.3&&(i.iridescenceIor=s.getIridescenceIOR()),s.getIridescenceThicknessMinimum()!==100&&(i.iridescenceThicknessMinimum=s.getIridescenceThicknessMinimum()),s.getIridescenceThicknessMaximum()!==400&&(i.iridescenceThicknessMaximum=s.getIridescenceThicknessMaximum()),s.getIridescenceTexture()){let o=s.getIridescenceTexture(),c=s.getIridescenceTextureInfo();i.iridescenceTexture=t.createTextureInfoDef(o,c)}if(s.getIridescenceThicknessTexture()){let o=s.getIridescenceThicknessTexture(),c=s.getIridescenceThicknessTextureInfo();i.iridescenceThicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Ci,G:Oi,B:Pi,A:Di}=Ke,Lf=class extends X{static EXTENSION_NAME=kt;init(){this.extensionName=kt,this.propertyType="PBRSpecularGlossiness",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{diffuseFactor:[1,1,1,1],diffuseTexture:null,diffuseTextureInfo:new se(this.graph,"diffuseTextureInfo"),specularFactor:[1,1,1],glossinessFactor:1,specularGlossinessTexture:null,specularGlossinessTextureInfo:new se(this.graph,"specularGlossinessTextureInfo")})}getDiffuseFactor(){return this.get("diffuseFactor")}setDiffuseFactor(t){return this.set("diffuseFactor",t)}getDiffuseTexture(){return this.getRef("diffuseTexture")}getDiffuseTextureInfo(){return this.getRef("diffuseTexture")?this.getRef("diffuseTextureInfo"):null}setDiffuseTexture(t){return this.setRef("diffuseTexture",t,{channels:Ci|Oi|Pi|Di,isColor:!0})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getGlossinessFactor(){return this.get("glossinessFactor")}setGlossinessFactor(t){return this.set("glossinessFactor",t)}getSpecularGlossinessTexture(){return this.getRef("specularGlossinessTexture")}getSpecularGlossinessTextureInfo(){return this.getRef("specularGlossinessTexture")?this.getRef("specularGlossinessTextureInfo"):null}setSpecularGlossinessTexture(t){return this.setRef("specularGlossinessTexture",t,{channels:Ci|Oi|Pi|Di})}},Uf=class extends ee{static EXTENSION_NAME=kt;extensionName=kt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createPBRSpecularGlossiness(){return new Lf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_pbrSpecularGlossiness){let i=this.createPBRSpecularGlossiness();t.materials[n].setExtension(kt,i);let o=r.extensions[kt];if(o.extras&&i.setExtras(o.extras),o.diffuseFactor!==void 0&&i.setDiffuseFactor(o.diffuseFactor),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.glossinessFactor!==void 0&&i.setGlossinessFactor(o.glossinessFactor),o.diffuseTexture!==void 0){let c=o.diffuseTexture,d=t.textures[s[c.index].source];i.setDiffuseTexture(d),t.setTextureInfo(i.getDiffuseTextureInfo(),c)}if(o.specularGlossinessTexture!==void 0){let c=o.specularGlossinessTexture,d=t.textures[s[c.index].source];i.setSpecularGlossinessTexture(d),t.setTextureInfo(i.getSpecularGlossinessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(kt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[kt]=i,i.diffuseFactor=s.getDiffuseFactor(),i.specularFactor=s.getSpecularFactor(),i.glossinessFactor=s.getGlossinessFactor(),s.getDiffuseTexture()){let o=s.getDiffuseTexture(),c=s.getDiffuseTextureInfo();i.diffuseTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularGlossinessTexture()){let o=s.getSpecularGlossinessTexture(),c=s.getSpecularGlossinessTextureInfo();i.specularGlossinessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Kf,G:Gf,B:zf,A:Vf}=Ke,Hf=class extends X{static EXTENSION_NAME=Tt;init(){this.extensionName=Tt,this.propertyType="Sheen",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{sheenColorFactor:[0,0,0],sheenColorTexture:null,sheenColorTextureInfo:new se(this.graph,"sheenColorTextureInfo"),sheenRoughnessFactor:0,sheenRoughnessTexture:null,sheenRoughnessTextureInfo:new se(this.graph,"sheenRoughnessTextureInfo")})}getSheenColorFactor(){return this.get("sheenColorFactor")}setSheenColorFactor(t){return this.set("sheenColorFactor",t)}getSheenColorTexture(){return this.getRef("sheenColorTexture")}getSheenColorTextureInfo(){return this.getRef("sheenColorTexture")?this.getRef("sheenColorTextureInfo"):null}setSheenColorTexture(t){return this.setRef("sheenColorTexture",t,{channels:Kf|Gf|zf,isColor:!0})}getSheenRoughnessFactor(){return this.get("sheenRoughnessFactor")}setSheenRoughnessFactor(t){return this.set("sheenRoughnessFactor",t)}getSheenRoughnessTexture(){return this.getRef("sheenRoughnessTexture")}getSheenRoughnessTextureInfo(){return this.getRef("sheenRoughnessTexture")?this.getRef("sheenRoughnessTextureInfo"):null}setSheenRoughnessTexture(t){return this.setRef("sheenRoughnessTexture",t,{channels:Vf})}},qf=class extends ee{static EXTENSION_NAME=Tt;extensionName=Tt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createSheen(){return new Hf(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_sheen){let i=this.createSheen();t.materials[n].setExtension(Tt,i);let o=r.extensions[Tt];if(o.extras&&i.setExtras(o.extras),o.sheenColorFactor!==void 0&&i.setSheenColorFactor(o.sheenColorFactor),o.sheenRoughnessFactor!==void 0&&i.setSheenRoughnessFactor(o.sheenRoughnessFactor),o.sheenColorTexture!==void 0){let c=o.sheenColorTexture,d=t.textures[s[c.index].source];i.setSheenColorTexture(d),t.setTextureInfo(i.getSheenColorTextureInfo(),c)}if(o.sheenRoughnessTexture!==void 0){let c=o.sheenRoughnessTexture,d=t.textures[s[c.index].source];i.setSheenRoughnessTexture(d),t.setTextureInfo(i.getSheenRoughnessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Tt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Tt]=i,i.sheenColorFactor=s.getSheenColorFactor(),i.sheenRoughnessFactor=s.getSheenRoughnessFactor(),s.getSheenColorTexture()){let o=s.getSheenColorTexture(),c=s.getSheenColorTextureInfo();i.sheenColorTexture=t.createTextureInfoDef(o,c)}if(s.getSheenRoughnessTexture()){let o=s.getSheenRoughnessTexture(),c=s.getSheenRoughnessTextureInfo();i.sheenRoughnessTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Xf,G:Wf,B:Jf,A:Yf}=Ke,$f=class extends X{static EXTENSION_NAME=Mt;init(){this.extensionName=Mt,this.propertyType="Specular",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{specularFactor:1,specularTexture:null,specularTextureInfo:new se(this.graph,"specularTextureInfo"),specularColorFactor:[1,1,1],specularColorTexture:null,specularColorTextureInfo:new se(this.graph,"specularColorTextureInfo")})}getSpecularFactor(){return this.get("specularFactor")}setSpecularFactor(t){return this.set("specularFactor",t)}getSpecularColorFactor(){return this.get("specularColorFactor")}setSpecularColorFactor(t){return this.set("specularColorFactor",t)}getSpecularTexture(){return this.getRef("specularTexture")}getSpecularTextureInfo(){return this.getRef("specularTexture")?this.getRef("specularTextureInfo"):null}setSpecularTexture(t){return this.setRef("specularTexture",t,{channels:Yf})}getSpecularColorTexture(){return this.getRef("specularColorTexture")}getSpecularColorTextureInfo(){return this.getRef("specularColorTexture")?this.getRef("specularColorTextureInfo"):null}setSpecularColorTexture(t){return this.setRef("specularColorTexture",t,{channels:Xf|Wf|Jf,isColor:!0})}},Qf=class extends ee{static EXTENSION_NAME=Mt;extensionName=Mt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createSpecular(){return new $f(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_specular){let i=this.createSpecular();t.materials[n].setExtension(Mt,i);let o=r.extensions[Mt];if(o.extras&&i.setExtras(o.extras),o.specularFactor!==void 0&&i.setSpecularFactor(o.specularFactor),o.specularColorFactor!==void 0&&i.setSpecularColorFactor(o.specularColorFactor),o.specularTexture!==void 0){let c=o.specularTexture,d=t.textures[s[c.index].source];i.setSpecularTexture(d),t.setTextureInfo(i.getSpecularTextureInfo(),c)}if(o.specularColorTexture!==void 0){let c=o.specularColorTexture,d=t.textures[s[c.index].source];i.setSpecularColorTexture(d),t.setTextureInfo(i.getSpecularColorTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(Mt);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[Mt]=i,s.getSpecularFactor()!==1&&(i.specularFactor=s.getSpecularFactor()),ne.eq(s.getSpecularColorFactor(),[1,1,1])||(i.specularColorFactor=s.getSpecularColorFactor()),s.getSpecularTexture()){let o=s.getSpecularTexture(),c=s.getSpecularTextureInfo();i.specularTexture=t.createTextureInfoDef(o,c)}if(s.getSpecularColorTexture()){let o=s.getSpecularColorTexture(),c=s.getSpecularColorTextureInfo();i.specularColorTexture=t.createTextureInfoDef(o,c)}}}),this}},{R:Zf}=Ke,eh=class extends X{static EXTENSION_NAME=It;init(){this.extensionName=It,this.propertyType="Transmission",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{transmissionFactor:0,transmissionTexture:null,transmissionTextureInfo:new se(this.graph,"transmissionTextureInfo")})}getTransmissionFactor(){return this.get("transmissionFactor")}setTransmissionFactor(t){return this.set("transmissionFactor",t)}getTransmissionTexture(){return this.getRef("transmissionTexture")}getTransmissionTextureInfo(){return this.getRef("transmissionTexture")?this.getRef("transmissionTextureInfo"):null}setTransmissionTexture(t){return this.setRef("transmissionTexture",t,{channels:Zf})}},th=class extends ee{static EXTENSION_NAME=It;extensionName=It;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createTransmission(){return new eh(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_transmission){let i=this.createTransmission();t.materials[n].setExtension(It,i);let o=r.extensions[It];if(o.extras&&i.setExtras(o.extras),o.transmissionFactor!==void 0&&i.setTransmissionFactor(o.transmissionFactor),o.transmissionTexture!==void 0){let c=o.transmissionTexture,d=t.textures[s[c.index].source];i.setTransmissionTexture(d),t.setTextureInfo(i.getTransmissionTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(It);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[It]=i,i.transmissionFactor=s.getTransmissionFactor(),s.getTransmissionTexture()){let o=s.getTransmissionTexture(),c=s.getTransmissionTextureInfo();i.transmissionTexture=t.createTextureInfoDef(o,c)}}}),this}},ah=class extends X{static EXTENSION_NAME=Zt;init(){this.extensionName=Zt,this.propertyType="Unlit",this.parentTypes=[F.MATERIAL]}},sh=class extends ee{static EXTENSION_NAME=Zt;extensionName=Zt;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createUnlit(){return new ah(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){return(t.jsonDoc.json.materials||[]).forEach((e,a)=>{e.extensions&&e.extensions.KHR_materials_unlit&&t.materials[a].setExtension(Zt,this.createUnlit())}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{if(a.getExtension("KHR_materials_unlit")){let s=t.materialIndexMap.get(a),r=e.json.materials[s];r.extensions=r.extensions||{},r.extensions[Zt]={}}}),this}},rh=class extends X{static EXTENSION_NAME=Fe;init(){this.extensionName=Fe,this.propertyType="Mapping",this.parentTypes=["MappingList"]}getDefaults(){return Object.assign(super.getDefaults(),{material:null,variants:new ae})}getMaterial(){return this.getRef("material")}setMaterial(t){return this.setRef("material",t)}addVariant(t){return this.addRef("variants",t)}removeVariant(t){return this.removeRef("variants",t)}listVariants(){return this.listRefs("variants")}},nh=class extends X{static EXTENSION_NAME=Fe;init(){this.extensionName=Fe,this.propertyType="MappingList",this.parentTypes=[F.PRIMITIVE]}getDefaults(){return Object.assign(super.getDefaults(),{mappings:new ae})}addMapping(t){return this.addRef("mappings",t)}removeMapping(t){return this.removeRef("mappings",t)}listMappings(){return this.listRefs("mappings")}},Li=class extends X{static EXTENSION_NAME=Fe;init(){this.extensionName=Fe,this.propertyType="Variant",this.parentTypes=["MappingList"]}},ih=class extends ee{extensionName=Fe;static EXTENSION_NAME=Fe;createMappingList(){return new nh(this.document.getGraph())}createVariant(t=""){return new Li(this.document.getGraph(),t)}createMapping(){return new rh(this.document.getGraph())}listVariants(){return Array.from(this.properties).filter(t=>t instanceof Li)}read(t){let e=t.jsonDoc;if(!e.json.extensions||!e.json.extensions.KHR_materials_variants)return this;let a=(e.json.extensions.KHR_materials_variants.variants||[]).map(s=>this.createVariant().setName(s.name||""));return(e.json.meshes||[]).forEach((s,r)=>{let n=t.meshes[r];(s.primitives||[]).forEach((i,o)=>{if(!i.extensions||!i.extensions.KHR_materials_variants)return;let c=this.createMappingList(),d=i.extensions[Fe];for(let b of d.mappings){let f=this.createMapping();b.material!==void 0&&f.setMaterial(t.materials[b.material]);for(let v of b.variants||[])f.addVariant(a[v]);c.addMapping(f)}n.listPrimitives()[o].setExtension(Fe,c)})}),this}write(t){let e=t.jsonDoc,a=this.listVariants();if(!a.length)return this;let s=[],r=new Map;for(let n of a)r.set(n,s.length),s.push(t.createPropertyDef(n));for(let n of this.document.getRoot().listMeshes()){let i=t.meshIndexMap.get(n);n.listPrimitives().forEach((o,c)=>{let d=o.getExtension(Fe);if(!d)return;let b=t.jsonDoc.json.meshes[i].primitives[c],f=d.listMappings().map(v=>{let x=t.createPropertyDef(v),h=v.getMaterial();return h&&(x.material=t.materialIndexMap.get(h)),x.variants=v.listVariants().map(l=>r.get(l)),x});b.extensions=b.extensions||{},b.extensions[Fe]={mappings:f}})}return e.json.extensions=e.json.extensions||{},e.json.extensions[Fe]={variants:s},this}},{G:oh}=Ke,ch=class extends X{static EXTENSION_NAME=St;init(){this.extensionName=St,this.propertyType="Volume",this.parentTypes=[F.MATERIAL]}getDefaults(){return Object.assign(super.getDefaults(),{thicknessFactor:0,thicknessTexture:null,thicknessTextureInfo:new se(this.graph,"thicknessTexture"),attenuationDistance:1/0,attenuationColor:[1,1,1]})}getThicknessFactor(){return this.get("thicknessFactor")}setThicknessFactor(t){return this.set("thicknessFactor",t)}getThicknessTexture(){return this.getRef("thicknessTexture")}getThicknessTextureInfo(){return this.getRef("thicknessTexture")?this.getRef("thicknessTextureInfo"):null}setThicknessTexture(t){return this.setRef("thicknessTexture",t,{channels:oh})}getAttenuationDistance(){return this.get("attenuationDistance")}setAttenuationDistance(t){return this.set("attenuationDistance",t)}getAttenuationColor(){return this.get("attenuationColor")}setAttenuationColor(t){return this.set("attenuationColor",t)}},lh=class extends ee{static EXTENSION_NAME=St;extensionName=St;prereadTypes=[F.MESH];prewriteTypes=[F.MESH];createVolume(){return new ch(this.document.getGraph())}read(t){return this}write(t){return this}preread(t){let e=t.jsonDoc,a=e.json.materials||[],s=e.json.textures||[];return a.forEach((r,n)=>{if(r.extensions&&r.extensions.KHR_materials_volume){let i=this.createVolume();t.materials[n].setExtension(St,i);let o=r.extensions[St];if(o.extras&&i.setExtras(o.extras),o.thicknessFactor!==void 0&&i.setThicknessFactor(o.thicknessFactor),o.attenuationDistance!==void 0&&i.setAttenuationDistance(o.attenuationDistance),o.attenuationColor!==void 0&&i.setAttenuationColor(o.attenuationColor),o.thicknessTexture!==void 0){let c=o.thicknessTexture,d=t.textures[s[c.index].source];i.setThicknessTexture(d),t.setTextureInfo(i.getThicknessTextureInfo(),c)}}}),this}prewrite(t){let e=t.jsonDoc;return this.document.getRoot().listMaterials().forEach(a=>{let s=a.getExtension(St);if(s){let r=t.materialIndexMap.get(a),n=e.json.materials[r],i=t.createPropertyDef(s);if(n.extensions=n.extensions||{},n.extensions[St]=i,s.getThicknessFactor()>0&&(i.thicknessFactor=s.getThicknessFactor()),Number.isFinite(s.getAttenuationDistance())&&(i.attenuationDistance=s.getAttenuationDistance()),ne.eq(s.getAttenuationColor(),[1,1,1])||(i.attenuationColor=s.getAttenuationColor()),s.getThicknessTexture()){let o=s.getThicknessTexture(),c=s.getThicknessTextureInfo();i.thicknessTexture=t.createTextureInfoDef(o,c)}}}),this}},dh=class extends ee{extensionName=Ei;static EXTENSION_NAME=Ei;read(t){return this}write(t){return this}},Fr=class extends ee{extensionName=ki;static EXTENSION_NAME=ki;read(t){return this}write(t){return this}},uh=class extends X{static EXTENSION_NAME=Rt;init(){this.extensionName=Rt,this.propertyType="Visibility",this.parentTypes=[F.NODE]}getDefaults(){return Object.assign(super.getDefaults(),{visible:!0})}getVisible(){return this.get("visible")}setVisible(t){return this.set("visible",t)}},fh=class extends ee{static EXTENSION_NAME=Rt;extensionName=Rt;createVisibility(){return new uh(this.document.getGraph())}read(t){return(t.jsonDoc.json.nodes||[]).forEach((e,a)=>{if(e.extensions&&e.extensions.KHR_node_visibility){let s=this.createVisibility();t.nodes[a].setExtension(Rt,s);let r=e.extensions[Rt];r.visible!==void 0&&s.setVisible(r.visible)}}),this}write(t){let e=t.jsonDoc;for(let a of this.document.getRoot().listNodes()){let s=a.getExtension(Rt);if(!s)continue;let r=t.nodeIndexMap.get(a),n=e.json.nodes[r];n.extensions=n.extensions||{},n.extensions[Rt]={visible:s.getVisible()}}return this}};function hh(t){return t.vkFormat>0&&t.vkFormat<=123}function Ui(t){let e=t.vkFormat===1000066e3&&t.dataFormatDescriptor[0].colorModel===167;return t.vkFormat===0||e}var bh=class{match(t){return t[0]===171&&t[1]===75&&t[2]===84&&t[3]===88&&t[4]===32&&t[5]===50&&t[6]===48&&t[7]===187&&t[8]===13&&t[9]===10&&t[10]===26&&t[11]===10}getSize(t){let e=os(t);return[e.pixelWidth,e.pixelHeight]}getChannels(t){let e=os(t),a=e.dataFormatDescriptor[0];if(hh(e))return a.samples.length;if(Ui(e))switch(a.colorModel){case 163:return a.samples.length===2&&(a.samples[1].channelType&15)===15?4:3;case 166:return(a.samples[0].channelType&15)===3?4:3;default:throw new Error(`Unexpected KTX2 colorModel, "${a.colorModel}".`)}throw new Error(`Unexpected KTX2 vkFormat, "${e.vkFormat}".`)}getVRAMByteLength(t){let e=os(t),a=0;if(Ui(e)){let s=this.getChannels(t)>3;for(let r=0;r<e.levels.length;r++){let n=e.levels[r];if(n.uncompressedByteLength)a+=n.uncompressedByteLength;else{let i=Math.max(1,Math.floor(e.pixelWidth/Math.pow(2,r))),o=Math.max(1,Math.floor(e.pixelHeight/Math.pow(2,r))),c=s?16:8;a+=i/4*(o/4)*c}}}else for(let s of e.levels)e.supercompressionScheme===0?a+=s.levelData.byteLength:a+=s.uncompressedByteLength;return a}},ph=class extends ee{static EXTENSION_NAME=ds;extensionName=ds;prereadTypes=[F.TEXTURE];static register(){Je.registerFormat("image/ktx2",new bh)}preread(t){return t.jsonDoc.json.textures&&t.jsonDoc.json.textures.forEach(e=>{e.extensions&&e.extensions.KHR_texture_basisu&&(e.source=e.extensions[ds].source)}),this}read(t){return this}write(t){let e=t.jsonDoc;return this.document.getRoot().listTextures().forEach(a=>{if(a.getMimeType()==="image/ktx2"){let s=t.imageIndexMap.get(a);e.json.textures.forEach(r=>{r.source===s&&(r.extensions=r.extensions||{},r.extensions[ds]={source:r.source},delete r.source)})}}),this}},gh=class extends X{static EXTENSION_NAME=At;init(){this.extensionName=At,this.propertyType="Transform",this.parentTypes=[F.TEXTURE_INFO]}getDefaults(){return Object.assign(super.getDefaults(),{offset:[0,0],rotation:0,scale:[1,1],texCoord:null})}getOffset(){return this.get("offset")}setOffset(t){return this.set("offset",t)}getRotation(){return this.get("rotation")}setRotation(t){return this.set("rotation",t)}getScale(){return this.get("scale")}setScale(t){return this.set("scale",t)}getTexCoord(){return this.get("texCoord")}setTexCoord(t){return this.set("texCoord",t)}},mh=class extends ee{extensionName=At;static EXTENSION_NAME=At;createTransform(){return new gh(this.document.getGraph())}read(t){for(let[e,a]of Array.from(t.textureInfos.entries())){if(!a.extensions||!a.extensions.KHR_texture_transform)continue;let s=this.createTransform(),r=a.extensions[At];r.offset!==void 0&&s.setOffset(r.offset),r.rotation!==void 0&&s.setRotation(r.rotation),r.scale!==void 0&&s.setScale(r.scale),r.texCoord!==void 0&&s.setTexCoord(r.texCoord),e.setExtension(At,s)}return this}write(t){let e=Array.from(t.textureInfoDefMap.entries());for(let[a,s]of e){let r=a.getExtension(At);if(!r)continue;s.extensions=s.extensions||{};let n={},i=ne.eq;i(r.getOffset(),[0,0])||(n.offset=r.getOffset()),r.getRotation()!==0&&(n.rotation=r.getRotation()),i(r.getScale(),[1,1])||(n.scale=r.getScale()),r.getTexCoord()!=null&&(n.texCoord=r.getTexCoord()),s.extensions[At]=n}return this}},yh=[F.ROOT,F.SCENE,F.NODE,F.MESH,F.MATERIAL,F.TEXTURE,F.ANIMATION],xh=class extends X{static EXTENSION_NAME=Ge;init(){this.extensionName=Ge,this.propertyType="Packet",this.parentTypes=yh}getDefaults(){return Object.assign(super.getDefaults(),{context:{},properties:{}})}getContext(){return this.get("context")}setContext(t){return this.set("context",{...t})}listProperties(){return Object.keys(this.get("properties"))}getProperty(t){let e=this.get("properties");return t in e?e[t]:null}setProperty(t,e){this._assertContext(t);let a={...this.get("properties")};return e?a[t]=e:delete a[t],this.set("properties",a)}toJSONLD(){return{"@context":Ir(this.get("context")),...Ir(this.get("properties"))}}fromJSONLD(t){t=Ir(t);let e=t["@context"];return e&&this.set("context",e),delete t["@context"],this.set("properties",t)}_assertContext(t){if(!(t.split(":")[0]in this.get("context")))throw new Error(`${Ge}: Missing context for term, "${t}".`)}};function Ir(t){return JSON.parse(JSON.stringify(t))}var vh=class extends ee{extensionName=Ge;static EXTENSION_NAME=Ge;createPacket(){return new xh(this.document.getGraph())}listPackets(){return Array.from(this.properties)}read(t){let e=t.jsonDoc.json.extensions?.[Ge];if(!e||!e.packets)return this;let a=t.jsonDoc.json,s=this.document.getRoot(),r=e.packets.map(o=>this.createPacket().fromJSONLD(o)),n=[[a.asset],a.scenes,a.nodes,a.meshes,a.materials,a.images,a.animations],i=[[s],s.listScenes(),s.listNodes(),s.listMeshes(),s.listMaterials(),s.listTextures(),s.listAnimations()];for(let o=0;o<n.length;o++){let c=n[o]||[];for(let d=0;d<c.length;d++){let b=c[d];if(b.extensions&&b.extensions.KHR_xmp_json_ld){let f=b.extensions[Ge];i[o][d].setExtension(Ge,r[f.packet])}}}return this}write(t){let{json:e}=t.jsonDoc,a=[];for(let s of this.properties){a.push(s.toJSONLD());for(let r of s.listParents()){let n;switch(r.propertyType){case F.ROOT:n=e.asset;break;case F.SCENE:n=e.scenes[t.sceneIndexMap.get(r)];break;case F.NODE:n=e.nodes[t.nodeIndexMap.get(r)];break;case F.MESH:n=e.meshes[t.meshIndexMap.get(r)];break;case F.MATERIAL:n=e.materials[t.materialIndexMap.get(r)];break;case F.TEXTURE:n=e.images[t.imageIndexMap.get(r)];break;case F.ANIMATION:n=e.animations[t.animationIndexMap.get(r)];break;default:n=null,this.document.getLogger().warn(`[${Ge}]: Unsupported parent property, "${r.propertyType}"`);break}n&&(n.extensions=n.extensions||{},n.extensions[Ge]={packet:a.length-1})}}return a.length>0&&(e.extensions=e.extensions||{},e.extensions[Ge]={packets:a}),this}},wh=[ef,tf,ff,bf,xf,Ef,Rf,_f,Ff,Bf,Df,Uf,Qf,qf,th,sh,ih,lh,dh,Fr,fh,ph,mh,vh],Gm=[Zd,_r,Nr,Tu,$u,Zu,...wh];var ox=(function(){var t="b9H79Tebbbe9ok9Geueu9Geub9Gbb9Gruuuuuuueu9Gvuuuuueu9Gduueu9Gluuuueu9Gvuuuuub9Gouuuuuub9Gluuuub9Giuuueui8AYdilveoveovrrwrrDDoDrbqqbelve9Weiiviebeoweuec;G:Qdkr:nlAo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9mW4W2be8A9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWVbd8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9c9V919U9KbiE9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949wWV79P9V9UblY9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWVbv8E9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWV9c9V919U9Kbo8A9TW79O9V9Wt9FW9U9J9V9KW69U9KW949wWV79P9V9UbrE9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JWbwa9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JW9c9V919U9KbDL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9p9JtbqK9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9r919HtbkL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWVT949WbxE9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OWbsa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OW9ttV9P9Wbza9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9WbHK9TW79O9V9Wt9F79W9Ht9P9H29t9VVt9sW9T9H9WbOl79IV9RbCDwebcekdKLqN9OYdbk:Bhdhud9:8Jjjjjbc;qw9Rgr8KjjjjbcbhwdnaeTmbabcbyd;C:kjjbaoaocb9iEgDc:GeV86bbarc;adfcbcjdz:wjjjb8AdnaiTmbarc;adfadalz:vjjjb8Akarc;abfalfcbcbcjdal9RalcFe0Ez:wjjjb8Aarc;abfarc;adfalz:vjjjb8AarcUf9cb83ibarc8Wf9cb83ibarcyf9cb83ibarcaf9cb83ibarcKf9cb83ibarczf9cb83ibar9cb83iwar9cb83ibcj;abal9Uc;WFbGcjdalca0Ehqdnaicd6mbavcd9imbaDTmbadcefhkaqci2gxal2hmarc;alfclfhParc;qlfceVhsarc;qofclVhzarc;qofcKfhHarc;qofczfhOcbhAincdhCcbhodnavci6mbaH9cb83ibaO9cb83ibar9cb83i;yoar9cb83i;qoadaAfgoybbhXcbhQincbhwcbhLdninaoalfhKaoybbgYaX7aLVhLawcP0meaKhoaYhXawcefgwaQfai6mbkkcbhXarc;qofhwincwh8AcwhEdnaLaX93gocFeGg3cs0mbclhEa3ci0mba3cb9hcethEkdnaocw4cFeGg3cs0mbclh8Aa3ci0mba3cb9hceth8Aka8AaEfh3awydbh5cwh8AcwhEdnaocz4cFeGg8Ecs0mbclhEa8Eci0mba8Ecb9hcethEka3a5fh3dnaocFFFFb0mbclh8AaocFFF8F0mbaocFFFr0ceth8Akawa3aEfa8AfBdbawclfhwaXcefgXcw9hmbkaKhoaYhXaQczfgQai6mbkcbhocehwazhLinawaoaLydbarc;qofaocdtfydb6EhoaLclfhLawcefgwcw9hmbkcihCkcbh3arc;qlfcbcjdz:wjjjb8Aarc;alfcwfcbBdbar9cb83i;alaoclth8Fadhaaqhhakh5inarc;qlfadcba3cufgoaoa30Eal2falz:vjjjb8Aaiahaiah6Ehgdnaqaia39Ra3aqfai6EgYcsfc9WGgoaY9nmbarc;qofaYfcbaoaY9Rz:wjjjb8Akada3al2fh8Jcbh8Kina8Ka8FVcl4hQarc;alfa8Kcdtfh8LaAh8Mcbh8Nina8NaAfhwdndndndndndna8KPldebidkasa8Mc98GgLfhoa5aLfh8Aarc;qlfawc98GgLfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkaYTmla8Ncith8Ea8JaLfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aQ93a8E486bba8Aalfh8AaEalfhEaLhXaKcefgKaY9hmbxlkkaYTmia8Mc9:Ghoa8NcitcwGhEarc;qlfawceVfRbbcwtarc;qlfawc9:GfRbbVhLarc;qofhwaghXinawa5aofRbbcwtaaaofRbbVg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbaoalfhoawcefhwa8AhLa3aXcufgX9hmbxikkaYTmda8Jawfhoarc;qlfawfRbbhLarc;qofhwaghXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLa3aXcufgX9hmbxdkkaYTmeka8LydbhEcbhKarc;qofhoincdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egwa8Aawa8A6Egwczawcz6EaEfhEaoczfhoaKczfgKaY6mbka8LaEBdbka8Mcefh8Ma8Ncefg8Ncl9hmbka8Kcefg8KaC9hmbkaaamfhaahaxfhha5amfh5a3axfg3ai6mbkcbhocehwaPhLinawaoaLydbarc;alfaocdtfydb6EhoaLclfhLawcefgXhwaCaX9hmbkaraAcd4fa8FcdVaoaocdSE86bbaAclfgAal6mbkkabaefh8Kabcefhoalcd4gecbaDEhkadcefhOarc;abfceVhHcbhmdndninaiam9nmearc;qofcbcjdz:wjjjb8Aa8Kao9Rak6mdadamal2gwfhxcbh8JaOawfhzaocbakz:wjjjbghakfh5aqaiam9Ramaqfai6Egscsfgocl4cifcd4hCaoc9WGg8LThPindndndndndndndndndndnaDTmbara8Jcd4fRbbgLciGPlbedlbkasTmdaxa8Jfhoarc;abfa8JfRbbhLarc;qofhwashXinawaoRbbg8AaL9RgLcetaLcKtcK91cr4786bbawcefhwaoalfhoa8AhLaXcufgXmbxikkasTmia8JcitcwGhEarc;abfa8JceVfRbbcwtarc;abfa8Jc9:GgofRbbVhLaxaofhoarc;qofhwashXinawao8Vbbg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbawcefhwaoalfhoa8AhLaXcufgXmbxdkkaHa8Jc98GgEfhoazaEfh8Aarc;abfaEfRbbhXcwhwinaoRbbawtaXVhXaocefhoawcwfgwca9hmbkasTmbaLcl4hYa8JcitcKGh3axaEfhEcbhKinaERbbhLcwhoa8AhwinawRbbaotaLVhLawcefhwaocwfgoca9hmbkarc;qofaKfaLaX7aY93a3486bba8Aalfh8AaEalfhEaLhXaKcefgKas9hmbkkaDmbcbhoxlka8LTmbcbhodninarc;qofaofgwcwf8Pibaw8Pib:e9qTmeaoczfgoa8L9pmdxbkkdnavmbcehoxikcbhEaChKaChYinarc;qofaEfgocwf8Pibhyao8Pibh8PcdhLcbhwinaLaoawfRbbcb9hfhLawcefgwcz9hmbkclhXcbhwinaXaoawfRbbcd0fhXawcefgwcz9hmbkcwh8Acbhwina8AaoawfRbbcP0fh8Aawcefgwcz9hmbkaLaXaLaX6Egoa8Aaoa8A6Egoczaocz6EaYfhYaocucbaya8P:e9cb9sEgwaoaw6EaKfhKaEczfgEa8L9pmdxbkkaha8Jcd4fgoaoRbbcda8JcetcoGtV86bbxikdnaKas6mbaYas6mbaha8Jcd4fgoaoRbbcia8JcetcoGtV86bba8Ka59Ras6mra5arc;qofasz:vjjjbasfh5xikaKaY9phokaha8Jcd4fgwawRbbaoa8JcetcoGtV86bbka8Ka59RaC6mla5cbaCz:wjjjbgAaCfhYdndna8LmbaPhoxekdna8KaY9RcK9pmbaPhoxekaocdtc:q1jjbfcj1jjbaDEg5ydxggcetc;:FFFeGh8Fcuh3cuagtcu7cFeGhacbh8Marc;qofhLinarc;qofa8MfhQczhEdndndnagPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhExekcbhoa8FhEinaEaaaLaofRbb9nfhEaocefgocz9hmbkkcih8Ecbh8Ainczhwdndndna5a8AcdtfydbgKPDbeeeeeeedekcucbaQcwf8PibaQ8Pib:e9cb9sEhwxekaKcetc;:FFFeGhwcuaKtcu7cFeGhXcbhoinawaXaLaofRbb9nfhwaocefgocz9hmbkkdndnawaE6mbaKa39hmeawaE9hmea5a8EcdtfydbcwSmeka8Ah8EawhEka8Acefg8Aci9hmbkaAa8Mco4fgoaoRbba8Ea8Mci4coGtV86bbdndndna5a8Ecdtfydbg3PDdbbbbbbbebkdncwa39Tg8ETmbcua3tcu7hwdndna3ceSmbcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXa3tVhXaocefhoa8Acufg8AmbkaYaX86bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbxdkkcbh8NaLhQinaQhoa8Eh8AcbhXinaoRbbgEawcFeGgKaEaK6EaXcetVhXaocefhoa8Acufg8AmbkaYaX:T9cFe:d9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:9ca188bbaQa8EfhQaYcefhYa8Na8Efg8Ncz6mbkkcbhoinaYaLaofRbbgX86bbaYaXawcFeG9pfhYaocefgocz9hmbxikkdna3ceSmbinaYcb86bbaYcefhYxbkkinaYcb86bbaYcefhYxbkkaYaQ8Pbb83bbaYcwfaQcwf8Pbb83bbaYczfhYka8Mczfg8Ma8L9pgomeaLczfhLa8KaY9RcK9pmbkkaoTmlaYh5aYTmlka8Jcefg8Jal9hmbkarc;abfaxascufal2falz:vjjjb8Aasamfhma5hoa5mbkcbhwxdkdna8Kao9RakalfgwcKcaaDEgLawaL0EgX9pmbcbhwxdkdnawaL9pmbaocbaXaw9Rgwz:wjjjbawfhokaoarc;adfalz:vjjjbalfhodnaDTmbaoaraez:vjjjbaefhokaoab9Rhwxekcbhwkarc;qwf8Kjjjjbawk5babaeadaialcdcbyd;C:kjjbz:bjjjbk9reduaecd4gdaefgicaaica0Eabcj;abae9Uc;WFbGcjdaeca0Egifcufai9Uae2aiadfaicl4cifcd4f2fcefkmbcbabBd;C:kjjbk:Ese5u8Jjjjjbc;ae9Rgl8Kjjjjbcbhvdnaici9UgocHfae0mbabcbyd;m:kjjbgrc;GeV86bbalc;abfcFecjez:wjjjb8AalcUfgw9cu83ibalc8WfgD9cu83ibalcyfgq9cu83ibalcafgk9cu83ibalcKfgx9cu83ibalczfgm9cu83ibal9cu83iwal9cu83ibabaefc9WfhPabcefgsaofhednaiTmbcmcsarcb9kgzEhHcbhOcbhAcbhCcbhXcbhQindnaeaP9nmbcbhvxikaQcufhvadaCcdtfgLydbhKaLcwfydbhYaLclfydbh8AcbhEdndndninalc;abfavcsGcitfgoydlh3dndndnaoydbgoaK9hmba3a8ASmekdnaoa8A9hmba3aY9hmbaEcefhExekaoaY9hmea3aK9hmeaEcdfhEkaEc870mdaXcufhvaLaEciGcx2goc;i1jjbfydbcdtfydbh3aLaoc;e1jjbfydbcdtfydbh8AaLaoc;a1jjbfydbcdtfydbhKcbhodnindnalavcsGcdtfydba39hmbaohYxdkcuhYavcufhvaocefgocz9hmbkkaOa3aOSgvaYce9iaYaH9oVgoGfhOdndndncbcsavEaYaoEgvcs9hmbarce9imba3a3aAa3cefaASgvEgAcefSmecmcsavEhvkasavaEcdtc;WeGV86bbavcs9hmea3aA9Rgvcetavc8F917hvinaeavcFb0crtavcFbGV86bbaecefheavcje6hoavcr4hvaoTmbka3hAxvkcPhvasaEcdtcPV86bba3hAkavTmiavaH9omicdhocehEaQhYxlkavcufhvaEclfgEc;ab9hmbkkdnaLceaYaOSceta8AaOSEcx2gvc;a1jjbfydbcdtfydbgKTaLavc;e1jjbfydbcdtfydbg8AceSGaLavc;i1jjbfydbcdtfydbg3cdSGaOcb9hGazGg5ce9hmbaw9cu83ibaD9cu83ibaq9cu83ibak9cu83ibax9cu83ibam9cu83ibal9cu83iwal9cu83ibcbhOkcbhEaXcufgvhodnindnalaocsGcdtfydba8A9hmbaEhYxdkcuhYaocufhoaEcefgEcz9hmbkkcbhodnindnalavcsGcdtfydba39hmbaohExdkcuhEavcufhvaocefgocz9hmbkkaOaKaOSg8EfhLdndnaYcm0mbaYcefhYxekcbcsa8AaLSgvEhYaLavfhLkdndnaEcm0mbaEcefhExekcbcsa3aLSgvEhEaLavfhLkc9:cua8EEh8FcbhvaEaYcltVgacFeGhodndndninavc:W1jjbfRbbaoSmeavcefgvcz9hmbxdkka5aKaO9havcm0VVmbasavc;WeV86bbxekasa8F86bbaeaa86bbaecefhekdna8EmbaKaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombkaKhAkdnaYcs9hmba8AaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka8AhAkdnaEcs9hmba3aA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka3hAkalaXcdtfaKBdbaXcefcsGhvdndnaYPzbeeeeeeeeeeeeeebekalavcdtfa8ABdbaXcdfcsGhvkdndnaEPzbeeeeeeeeeeeeeebekalavcdtfa3BdbavcefcsGhvkcihoalc;abfaQcitfgEaKBdlaEa8ABdbaQcefcsGhYcdhEavhXaLhOxekcdhoalaXcdtfa3BdbcehEaXcefcsGhXaQhYkalc;abfaYcitfgva8ABdlava3Bdbalc;abfaQaEfcsGcitfgva3BdlavaKBdbascefhsaQaofcsGhQaCcifgCai6mbkkdnaeaP9nmbcbhvxekcbhvinaeavfavc:W1jjbfRbb86bbavcefgvcz9hmbkaeab9Ravfhvkalc;aef8KjjjjbavkZeeucbhddninadcefgdc8F0meceadtae6mbkkadcrfcFeGcr9Uci2cdfabci9U2cHfkmbcbabBd;m:kjjbk:Adewu8Jjjjjbcz9Rhlcbhvdnaicvfae0mbcbhvabcbRb;m:kjjbc;qeV86bbal9cb83iwabcefhoabaefc98fhrdnaiTmbcbhwcbhDindnaoar6mbcbskadaDcdtfydbgqalcwfawaqav9Rgvavc8F91gv7av9Rc507gwcdtfgkydb9Rgvc8E91c9:Gavcdt7awVhvinaoavcFb0gecrtavcFbGV86bbavcr4hvaocefhoaembkakaqBdbaqhvaDcefgDai9hmbkkdnaoar9nmbcbskaocbBbbaoab9RclfhvkavkBeeucbhddninadcefgdc8F0meceadtae6mbkkadcwfcFeGcr9Uab2cvfk:bvli99dui99ludnaeTmbcuadcetcuftcu7:Zhvdndncuaicuftcu7:ZgoJbbbZMgr:lJbbb9p9DTmbar:Ohwxekcjjjj94hwkcbhicbhDinalclfIdbgrJbbbbJbbjZalIdbgq:lar:lMalcwfIdbgk:lMgr:varJbbbb9BEgrNhxaqarNhrdndnakJbbbb9GTmbaxhqxekJbbjZar:l:tgqaq:maxJbbbb9GEhqJbbjZax:l:tgxax:marJbbbb9GEhrkdndnalcxfIdbgxJbbj:;axJbbj:;9GEgkJbbjZakJbbjZ9FEavNJbbbZJbbb:;axJbbbb9GEMgx:lJbbb9p9DTmbax:Ohmxekcjjjj94hmkdndnaqJbbj:;aqJbbj:;9GEgxJbbjZaxJbbjZ9FEaoNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:OhPxekcjjjj94hPkdndnarJbbj:;arJbbj:;9GEgqJbbjZaqJbbjZ9FEaoNJbbbZJbbb:;arJbbbb9GEMgr:lJbbb9p9DTmbar:Ohsxekcjjjj94hskdndnadcl9hmbabaifgzas86bbazcifam86bbazcdfaw86bbazcefaP86bbxekabaDfgzas87ebazcofam87ebazclfaw87ebazcdfaP87ebkalczfhlaiclfhiaDcwfhDaecufgembkkk;hlld99eud99eudnaeTmbdndncuaicuftcu7:ZgvJbbbZMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikaic;8FiGhrinabcofcicdalclfIdb:lalIdb:l9EgialcwfIdb:lalaicdtfIdb:l9EEgialcxfIdb:lalaicdtfIdb:l9EEgiarV87ebdndnJbbj:;JbbjZalaicdtfIdbJbbbb9DEgoalaicd7cdtfIdbJ;Zl:1ZNNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabcdfaq87ebdndnalaicefciGcdtfIdbJ;Zl:1ZNaoNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabaq87ebdndnaoalaicufciGcdtfIdbJ;Zl:1ZNNgoJbbj:;aoJbbj:;9GEgwJbbjZawJbbjZ9FEavNJbbbZJbbb:;aoJbbbb9GEMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikabclfai87ebabcwfhbalczfhlaecufgembkkk;3viDue99eu8Jjjjjbcjd9Rgo8Kjjjjbadcd4hrdndndndnavcd9hmbadcl6meaohwarhDinawc:CuBdbawclfhwaDcufgDmbkaeTmiadcl6mdarcdthqalhkcbhxinaohwakhDarhminawawydbgPcbaDIdbgs:8cL4cFeGc:cufasJbbbb9BEgzaPaz9kEBdbaDclfhDawclfhwamcufgmmbkakaqfhkaxcefgxaeSmixbkkaeTmdxekaeTmekarcdthkavce9hhqadcl6hdcbhxindndndnaqmbadmdc:CuhDalhwarhminaDcbawIdbgs:8cL4cFeGc:cufasJbbbb9BEgPaDaP9kEhDawclfhwamcufgmmbxdkkc:CuhDdndnavPleddbdkadmdaohwalhmarhPinawcbamIdbgs:8cL4cFeGgzc;:bazc;:b0Ec:cufasJbbbb9BEBdbamclfhmawclfhwaPcufgPmbxdkkadmecbhwarhminaoawfcbalawfIdbgs:8cL4cFeGgPc8AaPc8A0Ec:cufasJbbbb9BEBdbawclfhwamcufgmmbkkadmbcbhwarhPinaDhmdnavceSmbaoawfydbhmkdndnalawfIdbgscjjj;8iamai9RcefgmcLt9R::NJbbbZJbbb:;asJbbbb9GEMgs:lJbbb9p9DTmbas:Ohzxekcjjjj94hzkabawfazcFFFrGamcKtVBdbawclfhwaPcufgPmbkkabakfhbalakfhlaxcefgxae9hmbkkaocjdf8Kjjjjbk;YqdXui998Jjjjjbc:qd9Rgv8Kjjjjbavc:Sefcbc;Kbz:wjjjb8AcbhodnadTmbcbhoaiTmbdndnabaeSmbaehrxekavcuadcdtgwadcFFFFi0Ecbyd;u:kjjbHjjjjbbgrBd:SeavceBd:mdaraeawz:vjjjb8Akavc:GefcwfcbBdbav9cb83i:Geavc:Gefaradaiavc:Sefz:ojjjbavyd:GehDadci9Ugqcbyd;u:kjjbHjjjjbbheavc:Sefavyd:mdgkcdtfaeBdbavakcefgwBd:mdaecbaqz:wjjjbhxavc:SefawcdtfcuaicdtaicFFFFi0Ecbyd;u:kjjbHjjjjbbgmBdbavakcdfgPBd:mdalc;ebfhsaDheamhwinawalIdbasaeydbgzcwazcw6EcdtfIdbMUdbaeclfheawclfhwaicufgimbkavc:SefaPcdtfcuaqcdtadcFFFF970Ecbyd;u:kjjbHjjjjbbgPBdbdnadci6mbarheaPhwaqhiinawamaeydbcdtfIdbamaeclfydbcdtfIdbMamaecwfydbcdtfIdbMUdbaecxfheawclfhwaicufgimbkkakcifhoalc;ebfhHavc;qbfhOavheavyd:KehAavyd:OehCcbhzcbhwcbhXcehQinaehLcihkarawci2gKcdtfgeydbhsaeclfydbhdabaXcx2fgicwfaecwfydbgYBdbaiclfadBdbaiasBdbaxawfce86bbaOaYBdwaOadBdlaOasBdbaPawcdtfcbBdbdnazTmbcihkaLhiinaOakcdtfaiydbgeBdbakaeaY9haeas9haead9hGGfhkaiclfhiazcufgzmbkkaXcefhXcbhzinaCaAarazaKfcdtfydbcdtgifydbcdtfgYheaDaifgdydbgshidnasTmbdninaeydbawSmeaeclfheaicufgiTmdxbkkaeaYascdtfc98fydbBdbadadydbcufBdbkazcefgzci9hmbkdndnakTmbcuhwJbbbbh8Acbhdavyd:KehYavyd:OehKindndnaDaOadcdtfydbcdtgzfydbgembadcefhdxekadcs0hiamazfgsIdbhEasalcbadcefgdaiEcdtfIdbaHaecwaecw6EcdtfIdbMg3Udba3aE:th3aecdthiaKaYazfydbcdtfheinaPaeydbgzcdtfgsa3asIdbMgEUdbaEa8Aa8AaE9DgsEh8AazawasEhwaeclfheaic98fgimbkkadak9hmbkawcu9hmekaQaq9pmdindnaxaQfRbbmbaQhwxdkaqaQcefgQ9hmbxikkakczakcz6EhzaOheaLhOawcu9hmbkkaocdtavc:Seffc98fhedninaoTmeaeydbcbyd;q:kjjbH:bjjjbbaec98fheaocufhoxbkkavc:qdf8Kjjjjbk;IlevucuaicdtgvaicFFFFi0Egocbyd;u:kjjbHjjjjbbhralalyd9GgwcdtfarBdbalawcefBd9GabarBdbaocbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdlcuadcdtadcFFFFi0Ecbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdwabydbcbavz:wjjjb8Aadci9UhDdnadTmbabydbhoaehladhrinaoalydbcdtfgvavydbcefBdbalclfhlarcufgrmbkkdnaiTmbabydbhlabydlhrcbhvaihoinaravBdbarclfhralydbavfhvalclfhlaocufgombkkdnadci6mbabydlhrabydwhvcbhlinaecwfydbhoaeclfydbhdaraeydbcdtfgwawydbgwcefBdbavawcdtfalBdbaradcdtfgdadydbgdcefBdbavadcdtfalBdbaraocdtfgoaoydbgocefBdbavaocdtfalBdbaecxfheaDalcefgl9hmbkkdnaiTmbabydlheabydbhlinaeaeydbalydb9RBdbalclfhlaeclfheaicufgimbkkkQbabaeadaic;K1jjbz:njjjbkQbabaeadaic;m:jjjbz:njjjbk9DeeuabcFeaicdtz:wjjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk:Vvioud9:du8Jjjjjbc;Wa9Rgl8Kjjjjbcbhvalcxfcbc;Kbz:wjjjb8AalcuadcitgoadcFFFFe0Ecbyd;u:kjjbHjjjjbbgrBdxalceBd2araeadaicez:tjjjbalcuaoadcjjjjoGEcbyd;u:kjjbHjjjjbbgwBdzadcdthednadTmbabhiinaiavBdbaiclfhiadavcefgv9hmbkkawaefhDalabBdwalawBdl9cbhqindnadTmbaq9cq9:hkarhvaDhiadheinaiav8Pibak1:NcFrG87ebavcwfhvaicdfhiaecufgembkkalclfaq:NceGcdtfydbhxalclfaq9ce98gq:NceGcdtfydbhmalc;Wbfcbcjaz:wjjjb8AaDhvadhidnadTmbinalc;Wbfav8VebcdtfgeaeydbcefBdbavcdfhvaicufgimbkkcbhvcbhiinalc;WbfavfgeydbhoaeaiBdbaoaifhiavclfgvcja9hmbkadhvdndnadTmbinalc;WbfaDamydbgicetf8VebcdtfgeaeydbgecefBdbaxaecdtfaiBdbamclfhmavcufgvmbkaq9cv9smdcbhvinabawydbcdtfavBdbawclfhwadavcefgv9hmbxdkkaq9cv9smekkclhvdninavc98Smealcxfavfydbcbyd;q:kjjbH:bjjjbbavc98fhvxbkkalc;Waf8Kjjjjbk:Jwliuo99iud9:cbhv8Jjjjjbca9Rgoczfcwfcbyd:8:kjjbBdbaocb8Pd:0:kjjb83izaocwfcbyd;i:kjjbBdbaocb8Pd;a:kjjb83ibaicd4hrdndnadmbJFFuFhwJFFuuhDJFFuuhqJFFuFhkJFFuuhxJFFuFhmxekarcdthPaehsincbhiinaoczfaifgzasaifIdbgwazIdbgDaDaw9EEUdbaoaifgzawazIdbgDaDaw9DEUdbaiclfgicx9hmbkasaPfhsavcefgvad9hmbkaoIdKhDaoIdwhwaoIdChqaoIdlhkaoIdzhxaoIdbhmkdnadTmbJbbbbJbFu9hJbbbbamax:tgmamJbbbb9DEgmakaq:tgkakam9DEgkawaD:tgwawak9DEgw:vawJbbbb9BEhwdnalmbarcdthoindndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:S9cC:ghHdndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikaHai:S:ehHdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaHai:T9cy:g:e83ibaeaofheabcwfhbadcufgdmbxdkkarcdthoindndnaeIdbax:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cv9:9c;j:KM;j:KM;j:Kd:dhOdndnaeclfIdbaq:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cq9:9cM;j:KM;j:KM;jl:daO:ehOdndnaecwfIdbaD:tawNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabaOai:SgH9ca:gaH9cz:g9cjjj;4s:d:eaH9cFe:d:e9cF:bj;4:pj;ar:d9c:bd9:9c:p;G:d;4j:E;ar:d9cH9:9c;d;H:W:y:m:g;d;Hb:d9cC9:9c:KM;j:KM;j:KMD:d:e83ibaeaofheabcwfhbadcufgdmbkkk9teiucbcbyd;y:kjjbgeabcifc98GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;y:kjjbgeabcrfc94GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;y:kjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;y:kjjbfgdBd;y:kjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk;Qddbcjwk;mdbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbbbbbbbbbbbbb4:h9w9N94:P:gW:j9O:ye9Pbbbbbbebbbdbbbebbbdbbbbbbbdbbbbbbbebbbbbbb:l29hZ;69:9kZ;N;76Z;rg97Z;z;o9xZ8J;B85Z;:;u9yZ;b;k9HZ:2;Z9DZ9e:l9mZ59A8KZ:r;T3Z:A:zYZ79OHZ;j4::8::Y:D9V8:bbbb9s:49:Z8R:hBZ9M9M;M8:L;z;o8:;8:PG89q;x:J878R:hQ8::M:B;e87bbbbbbjZbbjZbbjZ:E;V;N8::Y:DsZ9i;H;68:xd;R8:;h0838:;W:NoZbbbb:WV9O8:uf888:9i;H;68:9c9G;L89;n;m9m89;D8Ko8:bbbbf:8tZ9m836ZS:2AZL;zPZZ818EZ9e:lxZ;U98F8:819E;68:FFuuFFuuFFuuFFuFFFuFFFuFbc;mqkzebbbebbbdbbb9G:vbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(x){a=x.instance,a.exports.__wasm_call_ctors(),a.exports.meshopt_encodeVertexVersion(0),a.exports.meshopt_encodeIndexVersion(1)});function r(x){for(var h=new Uint8Array(x.length),l=0;l<x.length;++l){var g=x.charCodeAt(l);h[l]=g>96?g-97:g>64?g-39:g+4}for(var u=0,l=0;l<x.length;++l)h[u++]=h[l]<60?e[h[l]]:(h[l]-60)*64+h[++l];return h.buffer.slice(0,u)}function n(x){if(!x)throw new Error("Assertion failed")}function i(x){return new Uint8Array(x.buffer,x.byteOffset,x.byteLength)}function o(x,h,l,g){var u=a.exports.sbrk,p=u(h.length*4),y=u(l*4),w=new Uint8Array(a.exports.memory.buffer),T=i(h);w.set(T,p),g&&g(p,p,h.length,l);var I=x(y,p,h.length,l);w=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(l);new Uint8Array(S.buffer).set(w.subarray(y,y+l*4)),T.set(w.subarray(p,p+h.length*4)),u(p-u(0));for(var R=0;R<h.length;++R)h[R]=S[h[R]];return[S,I]}function c(x,h,l,g){var u=a.exports.sbrk,p=u(l*4),y=u(l*g),w=new Uint8Array(a.exports.memory.buffer);w.set(i(h),y),x(p,y,l,g),w=new Uint8Array(a.exports.memory.buffer);var T=new Uint32Array(l);return new Uint8Array(T.buffer).set(w.subarray(p,p+l*4)),u(p-u(0)),T}function d(x,h,l,g,u){var p=a.exports.sbrk,y=p(h),w=p(g*u),T=new Uint8Array(a.exports.memory.buffer);T.set(i(l),w);var I=x(y,h,w,g,u),S=new Uint8Array(I);return S.set(T.subarray(y,y+I)),p(y-p(0)),S}function b(x){for(var h=0,l=0;l<x.length;++l){var g=x[l];h=h<g?g:h}return h}function f(x,h){if(n(h==2||h==4),h==4)return new Uint32Array(x.buffer,x.byteOffset,x.byteLength/4);var l=new Uint16Array(x.buffer,x.byteOffset,x.byteLength/2);return new Uint32Array(l)}function v(x,h,l,g,u,p,y){var w=a.exports.sbrk,T=w(l*g),I=w(l*p),S=new Uint8Array(a.exports.memory.buffer);S.set(i(h),I),x(T,l,g,u,I,y);var R=new Uint8Array(l*g);return R.set(S.subarray(T,T+l*g)),w(T-w(0)),R}return{ready:s,supported:!0,reorderMesh:function(x,h,l){var g=h?l?a.exports.meshopt_optimizeVertexCacheStrip:a.exports.meshopt_optimizeVertexCache:void 0;return o(a.exports.meshopt_optimizeVertexFetchRemap,x,b(x)+1,g)},reorderPoints:function(x,h){return n(x instanceof Float32Array),n(x.length%h==0),n(h>=3),c(a.exports.meshopt_spatialSortRemap,x,x.length/h,h*4)},encodeVertexBuffer:function(x,h,l){n(l>0&&l<=256),n(l%4==0);var g=a.exports.meshopt_encodeVertexBufferBound(h,l);return d(a.exports.meshopt_encodeVertexBuffer,g,x,h,l)},encodeIndexBuffer:function(x,h,l){n(l==2||l==4),n(h%3==0);var g=f(x,l),u=a.exports.meshopt_encodeIndexBufferBound(h,b(g)+1);return d(a.exports.meshopt_encodeIndexBuffer,u,g,h,4)},encodeIndexSequence:function(x,h,l){n(l==2||l==4);var g=f(x,l),u=a.exports.meshopt_encodeIndexSequenceBound(h,b(g)+1);return d(a.exports.meshopt_encodeIndexSequence,u,g,h,4)},encodeGltfBuffer:function(x,h,l,g){var u={ATTRIBUTES:this.encodeVertexBuffer,TRIANGLES:this.encodeIndexBuffer,INDICES:this.encodeIndexSequence};return n(u[g]),u[g](x,h,l)},encodeFilterOct:function(x,h,l,g){return n(l==4||l==8),n(g>=1&&g<=16),v(a.exports.meshopt_encodeFilterOct,x,h,l,g,16)},encodeFilterQuat:function(x,h,l,g){return n(l==8),n(g>=4&&g<=16),v(a.exports.meshopt_encodeFilterQuat,x,h,l,g,16)},encodeFilterExp:function(x,h,l,g,u){n(l>0&&l%4==0),n(g>=1&&g<=24);var p={Separate:0,SharedVector:1,SharedComponent:2,Clamped:3};return v(a.exports.meshopt_encodeFilterExp,x,h,l,g,l,u?p[u]:1)}}})();var jr=(function(){var t="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:W:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:S86qdbk;jYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz1jjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbhodnawTmbaxa8Acd4fRbbhokaocFeGh5cbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz1jjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:jjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q1jjbfcj1jjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bbarcwf9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfag9c8F1:NghcKtc8F91aicdfa8J9c8N1:Nfg8KRbbG86bbarcVfcba8KahcjeGcr4fghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fag9c8F1:NgicKtc8F91aha8J9c8N1:NfghRbbG86bbarc96fcbahaicjeGcr4fgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbb83bbarcwfaicwf8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbcbaocl49Rh8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E93aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z1jjjb8AazazcjdfaAcufad2fadz1jjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:XseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbyd:K1jjbgeabcifc98GfgbBd:K1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk81dbcjwk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:Kwkl8WNbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;G9Mqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:183lYud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxavaialfgmar9Rgoad;8qbbcj;abad9Uc;WFbGcjdadca0EhPdndndnadTmbaoadfhscbhzinaeaz9nmdamax9RaD6miabazad2fhHaxaDfhOaPaeaz9RazaPfae6EgAcsfgocl4cifcd4hCavcj;cbfaoc9WGgXcetfhQavcj;cbfaXci2fhLavcj;cbfaXfhKcbhYaoc;ab6h8AincbhodnawTmbaxaYcd4fRbbhokaocFeGhEcbh3avcj;cbfh5indndndndnaEa3cet4ciGgoc9:fPdebdkamaO9RaX6mwavcj;cbfa3aX2faOaX;8qbbaOaAfhOxdkavcj;cbfa3aX2fcbaX;8kbxekamaO9RaC6moaoclVcbawEhraOaCfhocbhidna8Ambamao9Rc;Gb6mbcbhlina5alfhidndndndndndnaOalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiczfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaicafaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaoclffaqc:q:yjjbfRbbfhoxikaic8Wfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaocwffaqc:q:yjjbfRbbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitc:q1jjbfpbibaic:q:yjjbfRbbgipsaoRbegqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqc:q:yjjbfRbbfhokalc;abfhialcjefaX0meaihlamao9Rc;Fb0mbkkdnaiaX9pmbaici4hlinamao9RcK6mwa5aifhqdndndndndndnaOaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaoclffahc:q:yjjbfRbbfhoxikaqaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaocwffahc:q:yjjbfRbbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpkbbaaaocdffahc:q:yjjbfRbbfhokalcdfhlaiczfgiaX6mbkkaohOaoTmoka5aXfh5a3cefg3cl9hmbkdndndndnawTmbasaYcd4fRbbglciGPlbedwbkaXTmdavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep9Ta8Epxeeeeeeeeeeeeeeeeg8Fp9op9Hp9rg8Eagp9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Ug8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9AbbbaladfhlaoczfgoaX6mbxikkaXTmeavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep:nea8Epxebebebebebebebebg8Fp9op:bep9rg8Eagp:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeg8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9AbbbaladfhlaoczfgoaX6mbxdkkaXTmbcbhocbalcl4gl9Rc8FGhiavcjdfaYfhravaYfpbdbh8Finaravcj;cbfaofpblbggaKaofpblbg8JpmbzeHdOiAlCvXoQrLg8KaQaofpblbg8LaLaofpblbg8MpmbzeHdOiAlCvXoQrLg8NpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ea8Fp9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Fa8Ka8NpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwKDYq8AkEx3m5P8Es8Fgga8La8MpmwKDYq8AkEx3m5P8Es8Fg8JpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9AbbbaradfhraoczfgoaX6mbkkaYclfgYad6mbkaHavcjdfaAad2;8qbbavavcjdfaAcufad2fad;8qbbaAazfhzc9:hoaOhxaOmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdaPaeao9RaoaPfae6Eaofgoae6mbkaial9Rhxkcbc99amax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbk:TseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:SPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiczfpxbbbbbbbbbbbbbbbbgopklbaiaopklbaiabalcitfgdaeciGglcitgv;8qbbdnalTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkadaiav;8qbbkk:oDllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiczfpxbbbbbbbbbbbbbbbbgkpklbaiakpklbaiabalcitfgoaeciGgvcitgw;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkaoaiaw;8qbbkk;uddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaic8WfpxbbbbbbbbbbbbbbbbgopklbaicafaopklbaiczfaopklbaiaopklbaiabavcdtfgdalciGgecdtgv;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkadaiav;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb",a=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),s=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var r=WebAssembly.validate(a)?o(e):o(t),n,i=WebAssembly.instantiate(r,{}).then(function(u){n=u.instance,n.exports.__wasm_call_ctors()});function o(u){for(var p=new Uint8Array(u.length),y=0;y<u.length;++y){var w=u.charCodeAt(y);p[y]=w>96?w-97:w>64?w-39:w+4}for(var T=0,y=0;y<u.length;++y)p[T++]=p[y]<60?s[p[y]]:(p[y]-60)*64+p[++y];return p.buffer.slice(0,T)}function c(u,p,y,w,T,I,S){var R=u.exports.sbrk,_=w+3&-4,A=R(_*T),C=R(I.length),D=new Uint8Array(u.exports.memory.buffer);D.set(I,C);var j=p(A,w,T,C,I.length);if(j==0&&S&&S(A,_,T),y.set(D.subarray(A,A+w*T)),R(A-R(0)),j!=0)throw new Error("Malformed buffer data: "+j)}var d={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},b={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},f=[],v=0;function x(u){var p={object:new Worker(u),pending:0,requests:{}};return p.object.onmessage=function(y){var w=y.data;p.pending-=w.count,p.requests[w.id][w.action](w.value),delete p.requests[w.id]},p}function h(u){for(var p="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(r)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+g.name+";"+c.toString()+g.toString(),y=new Blob([p],{type:"text/javascript"}),w=URL.createObjectURL(y),T=f.length;T<u;++T)f[T]=x(w);for(var T=u;T<f.length;++T)f[T].object.postMessage({});f.length=u,URL.revokeObjectURL(w)}function l(u,p,y,w,T){for(var I=f[0],S=1;S<f.length;++S)f[S].pending<I.pending&&(I=f[S]);return new Promise(function(R,_){var A=new Uint8Array(y),C=++v;I.pending+=u,I.requests[C]={resolve:R,reject:_},I.object.postMessage({id:C,count:u,size:p,source:A,mode:w,filter:T},[A.buffer])})}function g(u){var p=u.data;if(!p.id)return self.close();self.ready.then(function(y){try{var w=new Uint8Array(p.count*p.size);c(y,y.exports[p.mode],w,p.count,p.size,p.source,y.exports[p.filter]),self.postMessage({id:p.id,count:p.count,action:"resolve",value:w},[w.buffer])}catch(T){self.postMessage({id:p.id,count:p.count,action:"reject",value:T})}})}return{ready:i,supported:!0,useWorkers:function(u){h(u)},decodeVertexBuffer:function(u,p,y,w,T){c(n,n.exports.meshopt_decodeVertexBuffer,u,p,y,w,n.exports[d[T]])},decodeIndexBuffer:function(u,p,y,w){c(n,n.exports.meshopt_decodeIndexBuffer,u,p,y,w)},decodeIndexSequence:function(u,p,y,w){c(n,n.exports.meshopt_decodeIndexSequence,u,p,y,w)},decodeGltfBuffer:function(u,p,y,w,T,I){c(n,n.exports[b[T]],u,p,y,w,n.exports[d[I]])},decodeGltfBufferAsync:function(u,p,y,w,T){return f.length>0?l(u,p,y,b[w],d[T]):i.then(function(){var I=new Uint8Array(u*p);return c(n,n.exports[b[w]],I,u,p,y,n.exports[d[T]]),I})}}})();var dx=(function(){var t="b9H79Tebbbetm9Geueu9Geub9Gbb9Gsuuuuuuuuuuuu99uueu9Gvuuuuub9Gruuuuuuub9Gvuuuuue999Gvuuuuueu9Gquuuuuuu99uueu9Gwuuuuuu99ueu9Giuuue999Gluuuueu9GiuuueuiOHdilvorlwiDqkbxxbelve9Weiiviebeoweuec:G:Pdkr:Tewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bbz9TW79O9V9Wt9F79P9T9W29P9M95br8E9TW79O9V9Wt9F79P9T9W29P9M959x9Pt9OcttV9P9I91tW7bwQ9TW79O9V9Wt9F79P9T9W29P9M959q9V9P9Ut7bDX9TW79O9V9Wt9F79P9T9W29P9M959t9J9H2Wbqa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9Wbkl79IV9RbxDwebcekdzsq;B:xeHdbkM9Hi8Au8A99Au8Jjjjjbc;W;qb9Rgs8Kjjjjbcbhzascxfcbc;Kbz:ojjjb8AdnabaeSmbabaeadcdtz:njjjb8AkdndnamcdGmbascxfhHcbhOxekasalcrfci4gecbyd:m:jjjbHjjjjbbgABdxasceBd2aAcbaez:ojjjbhCcbhlcbhednadTmbcbhlabheadhAinaCaeydbgXci4fgQaQRbbgQceaXcrGgXtV86bbaQcu7aX4ceGalfhlaeclfheaAcufgAmbkcualcdtalcFFFFi0EhekascCfhHasaecbyd:m:jjjbHjjjjbbgOBdzascdBd2alcd4alfhXcehAinaAgecethAaeaX6mbkcdhzcbhLascuaecdtgAaecFFFFi0Ecbyd:m:jjjbHjjjjbbgXBdCasciBd2aXcFeaAz:ojjjbhKdnadTmbaecufhYcbh8AindndnaKabaLcdtfgEydbgQc:v;t;h;Ev2aYGgXcdtfgCydbgAcuSmbceheinaOaAcdtfydbaQSmdaXaefhAaecefheaKaAaYGgXcdtfgCydbgAcu9hmbkkaOa8AcdtfaQBdbaCa8ABdba8AhAa8Acefh8AkaEaABdbaLcefgLad9hmbkkaKcbyd1:jjjbH:bjjjbbascdBd2kcbh3aHcualcefgecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbg5Bdbasa5BdlasazceVgeBd2ascxfaecdtfcuadcitadcFFFFe0Ecbyd:m:jjjbHjjjjbbg8EBdbasa8EBdwasazcdfgeBd2asclfabadalcbz:cjjjbascxfaecdtfcualcdtgealcFFFFi0Eg8Fcbyd:m:jjjbHjjjjbbgABdbasazcifgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgaBdbasazclVBd2aAaaaialavaOascxfz:djjjbalcbyd:m:jjjbHjjjjbbhCascxfasyd2ghcdtfaCBdbasahcefgXBd2ascxfaXcdtfa8Fcbyd:m:jjjbHjjjjbbgXBdbasahcdfgQBd2ascxfaQcdtfa8Fcbyd:m:jjjbHjjjjbbgQBdbasahcifggBd2aXcFeaez:ojjjbh8JaQcFeaez:ojjjbh8KdnalTmba8Ecwfh8Lindna5a3gQcefg3cdtfydbgKa5aQcdtgefydbgXSmbaKaX9Rhza8EaXcitfhHa8Kaefh8Ma8JaefhEcbhYindndnaHaYcitfydbg8AaQ9hmbaEaQBdba8MaQBdbxekdna5a8Acdtg8NfgeclfydbgXaeydbgeSmba8EaecitgKfydbaQSmeaXae9Rhyaecu7aXfhLa8LaKfhXcbheinaLaeSmeaecefheaXydbhKaXcwfhXaKaQ9hmbkaeay6meka8Ka8NfgeaQa8AaeydbcuSEBdbaEa8AaQaEydbcuSEBdbkaYcefgYaz9hmbkka3al9hmbkaAhXaahQa8KhKa8JhYcbheindndnaeaXydbg8A9hmbdnaeaQydbg8A9hmbaYydbh8AdnaKydbgLcu9hmba8Acu9hmbaCaefcb86bbxikaCaefhEdnaeaLSmbaea8ASmbaEce86bbxikaEcl86bbxdkdnaeaaa8AcdtgLfydb9hmbdnaKydbgEcuSmbaeaESmbaYydbgzcuSmbaeazSmba8KaLfydbgHcuSmbaHa8ASmba8JaLfydbgLcuSmbaLa8ASmbdnaAaEcdtfydbg8AaAaLcdtfydb9hmba8AaAazcdtfydbgLSmbaLaAaHcdtfydb9hmbaCaefcd86bbxlkaCaefcl86bbxikaCaefcl86bbxdkaCaefcl86bbxekaCaefaCa8AfRbb86bbkaXclfhXaQclfhQaKclfhKaYclfhYalaecefge9hmbkdnaqTmbdndnaOTmbaOheaAhXalhQindnaqaeydbfRbbTmbaCaXydbfcl86bbkaeclfheaXclfhXaQcufgQmbxdkkaAhealhXindnaqRbbTmbaCaeydbfcl86bbkaqcefhqaeclfheaXcufgXmbkkaAhealhQaChXindnaCaeydbfRbbcl9hmbaXcl86bbkaeclfheaXcefhXaQcufgQmbkkamceGTmbaChealhXindnaeRbbce9hmbaecl86bbkaecefheaXcufgXmbkkascxfagcdtfcualcx2alc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbg3BdbasahclfgHBd2a3aialavaOz:ejjjbh8PdndnaDmbcbhgcbh8Lxekcbh8LawhecbhXindnaeIdbJbbbb9ETmbasc;Wbfa8LcdtfaXBdba8Lcefh8LkaeclfheaDaXcefgX9hmbkascxfaHcdtfcua8Lal2gecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbggBdbasahcvfgHBd2alTmba8LTmbarcd4hEdnaOTmba8Lcdthzcbh8AaghLinaoaOa8AcdtfydbaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbxdkka8Lcdthzcbh8AaghLinaoa8AaE2cdtfhYasc;WbfheaLhXa8LhQinaXaYaeydbcdtgKfIdbawaKfIdbNUdbaeclfheaXclfhXaQcufgQmbkaLazfhLa8Acefg8Aal9hmbkkascxfaHcdtfcualc8S2gealc;D;O;f8U0EgQcbyd:m:jjjbHjjjjbbgXBdbasaHcefgKBd2aXcbaez:ojjjbhqdndndna8LTmbascxfaKcdtfaQcbyd:m:jjjbHjjjjbbgvBdbasaHcdfgXBd2avcbaez:ojjjb8AascxfaXcdtfcua8Lal2gecltgXaecFFFFb0Ecbyd:m:jjjbHjjjjbbgiBdbasaHcifBd2aicbaXz:ojjjb8AadmexdkcbhvcbhiadTmekcbhYabhXindna3aXclfydbg8Acx2fgeIdba3aXydbgLcx2fgQIdbgI:tg8Ra3aXcwfydbgEcx2fgKIdlaQIdlg8S:tgRNaKIdbaI:tg8UaeIdla8S:tg8VN:tg8Wa8WNa8VaKIdwaQIdwg8X:tg8YNaRaeIdwa8X:tg8VN:tgRaRNa8Va8UNa8Ya8RN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaLcdtfydbc8S2fgeaRa8U:rg8UaRNNg8VaeIdbMUdbaea8Ra8Ua8RNg8ZNg8YaeIdlMUdlaea8Wa8Ua8WNg80Ng81aeIdwMUdwaea8ZaRNg8ZaeIdxMUdxaea80aRNgBaeIdzMUdzaea80a8RNg80aeIdCMUdCaeaRa8Ua8Wa8XNaRaINa8Sa8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAa8Acdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaEcdtfydbc8S2fgea8VaeIdbMUdbaea8YaeIdlMUdlaea81aeIdwMUdwaea8ZaeIdxMUdxaeaBaeIdzMUdzaea80aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdyaXcxfhXaYcifgYad6mbkcbhzabhLinabazcdtfh8AcbhXinaCa8AaXc;a1jjbfydbcdtfydbgQfRbbhedndnaCaLaXfydbgKfRbbgYc99fcFeGcpe0mbaec99fcFeGc;:e6mekdnaYcufcFeGce0mba8JaKcdtfydbaQ9hmekdnaecufcFeGce0mba8KaQcdtfydbaK9hmekdnaYcv2aefc:G1jjbfRbbTmbaAaQcdtfydbaAaKcdtfydb0mekJbbacJbbacJbbjZaecFeGceSEaYceSEh80dna3a8AaXc;e1jjbfydbcdtfydbcx2fgeIdwa3aKcx2fgYIdwg8S:tg8Wa3aQcx2fgEIdwa8S:tgRaRNaEIdbaYIdbg8X:tg8Ra8RNaEIdlaYIdlg8V:tg8Ua8UNMMgINa8WaRNaeIdba8X:tg81a8RNa8UaeIdla8V:tg8ZNMMg8YaRN:tg8Wa8WNa81aINa8Ya8RN:tgRaRNa8ZaINa8Ya8UN:tg8Ra8RNMM:rg8UJbbbb9ETmba8Wa8U:vh8Wa8Ra8U:vh8RaRa8U:vhRkaqaAaKcdtfydbc8S2fgeaRa80aI:rNg8UaRNNg8YaeIdbMUdbaea8Ra8Ua8RNg80Ng81aeIdlMUdlaea8Wa8Ua8WNgINg8ZaeIdwMUdwaea80aRNg80aeIdxMUdxaeaIaRNgBaeIdzMUdzaeaIa8RNg83aeIdCMUdCaeaRa8Ua8Wa8SNaRa8XNa8Va8RNMM:mg8SNgINgRaeIdKMUdKaea8RaINg8RaeId3MUd3aea8WaINg8WaeIdaMUdaaeaIa8SNgIaeId8KMUd8Kaea8UaeIdyMUdyaqaAaQcdtfydbc8S2fgea8YaeIdbMUdbaea81aeIdlMUdlaea8ZaeIdwMUdwaea80aeIdxMUdxaeaBaeIdzMUdzaea83aeIdCMUdCaeaRaeIdKMUdKaea8RaeId3MUd3aea8WaeIdaMUdaaeaIaeId8KMUd8Kaea8UaeIdyMUdykaXclfgXcx9hmbkaLcxfhLazcifgzad6mbka8LTmbcbhLinJbbbbh8Xa3abaLcdtfgeclfydbgEcx2fgXIdwa3aeydbgzcx2fgQIdwg8Z:tg8Ra8RNaXIdbaQIdbgB:tg8Wa8WNaXIdlaQIdlg83:tg8Ua8UNMMg80a3aecwfydbgHcx2fgeIdwa8Z:tgINa8Ra8RaINa8WaeIdbaB:tg8SNa8UaeIdla83:tg8VNMMgRN:tJbbbbJbbjZa80aIaINa8Sa8SNa8Va8VNMMg81NaRaRN:tg8Y:va8YJbbbb9BEg8YNhUa81a8RNaIaRN:ta8YNh85a80a8VNa8UaRN:ta8YNh86a81a8UNa8VaRN:ta8YNh87a80a8SNa8WaRN:ta8YNh88a81a8WNa8SaRN:ta8YNh89a8Wa8VNa8Sa8UN:tgRaRNa8UaINa8Va8RN:tgRaRNa8Ra8SNaIa8WN:tgRaRNMM:rJbbbZNhRagaza8L2gwcdtfhXagaHa8L2g8NcdtfhQagaEa8L2g5cdtfhKa8Z:mh8:a83:mhZaB:mhncbhYa8Lh8AJbbbbh8VJbbbbh8YJbbbbh80Jbbbbh81Jbbbbh8ZJbbbbhBJbbbbh83JbbbbhcJbbbbh9cinasc;WbfaYfgecwfaRa85aKIdbaXIdbgI:tg8UNaUaQIdbaI:tg8SNMg8RNUdbaeclfaRa87a8UNa86a8SNMg8WNUdbaeaRa89a8UNa88a8SNMg8UNUdbaecxfaRa8:a8RNaZa8WNaIana8UNMMMgINUdbaRa8Ra8WNNa81Mh81aRa8Ra8UNNa8ZMh8ZaRa8Wa8UNNaBMhBaRaIaINNa8XMh8XaRa8RaINNa8VMh8VaRa8WaINNa8YMh8YaRa8UaINNa80Mh80aRa8Ra8RNNa83Mh83aRa8Wa8WNNacMhcaRa8Ua8UNNa9cMh9caXclfhXaKclfhKaQclfhQaYczfhYa8Acufg8Ambkavazc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaEc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyavaHc8S2fgea9caeIdbMUdbaeacaeIdlMUdlaea83aeIdwMUdwaeaBaeIdxMUdxaea8ZaeIdzMUdzaea81aeIdCMUdCaea80aeIdKMUdKaea8YaeId3MUd3aea8VaeIdaMUdaaea8XaeId8KMUd8KaeaRaeIdyMUdyaiawcltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia5cltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaia8Ncltfh8AcbhXa8LhKina8AaXfgeasc;WbfaXfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaLcifgLad6mbkkcbhQdndnamcwGgJmbJbbbbh8Vcbh9ecbhocbhhxekcbh9ea8Fcbyd:m:jjjbHjjjjbbhhascxfasyd2gecdtfahBdbasaecefgXBd2ascxfaXcdtfcuahalabadaAz:fjjjbgKcltaKcjjjjiGEcbyd:m:jjjbHjjjjbbgoBdbasaecdfBd2aoaKaha3alz:gjjjbJFFuuh8VaKTmbaoheaKhXinaeIdbgRa8Va8VaR9EEh8VaeclfheaXcufgXmbkaKh9ekasydlhTdnalTmbaTclfheaTydbhKaChXalhYcbhQincbaeydbg8AaK9RaXRbbcpeGEaQfhQaXcefhXaeclfhea8AhKaYcufgYmbkaQce4hQkcuadaQ9RcifgScx2aSc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbhDascxfasyd2g9hcdtfaDBdbasa9hcefgeBd2ascxfaecdtfcuaScdtaScFFFFi0Ecbyd:m:jjjbHjjjjbbgrBdbasa9hcdfgeBd2ascxfaecdtfa8Fcbyd:m:jjjbHjjjjbbgyBdbasa9hcifgeBd2ascxfaecdtfalcbyd:m:jjjbHjjjjbbg9iBdbasa9hclfg6Bd2axaxNa8PJbbjZamclGEgUaUN:vh9cJbbbbhcdnadak9nmbdnaSci6mba8Lclth9kaDcwfh0Jbbbbh83JbbbbhcinasclfabadalaAz:cjjjbabhzcbh8Ecbh8Finaba8FcdtfhHcbheindnaAazaefydbgQcdtgEfydbgYaAaHaec;q1jjbfydbcdtfydbgXcdtgwfydbg8ASmbaCaXfRbbgLcv2aCaQfRbbgKfc;G1jjbfRbbg5aKcv2aLfg8Nc;G1jjbfRbbg8MVcFeGTmbdna8AaY9nmba8Nc:G1jjbfRbbcFeGmekaKcufhYdnaKaL9hmbaYcFeGce0mba8JaEfydbaX9hmekdndnaKclSmbaLcl9hmekdnaYcFeGce0mba8JaEfydbaX9hmdkaLcufcFeGce0mba8KawfydbaQ9hmekaDa8Ecx2fgKaXaQa8McFeGgYEBdlaKaQaXaYEBdbaKaYa5Gcb9hBdwa8Ecefh8Ekaeclfgecx9hmbkdna8Fcifg8Fad9pmbazcxfhza8EcifaS9nmekka8ETmdcbhLinaqaAaDaLcx2fgKydbgYcdtgzfydbc8S2fgeIdwa3aKydlg8Acx2fgXIdwg8WNaeIdzaXIdbg8UNaeIdaMgRaRMMa8WNaeIdlaXIdlgINaeIdCa8WNaeId3MgRaRMMaINaeIdba8UNaeIdxaINaeIdKMgRaRMMa8UNaeId8KMMM:lhRJbbbbJbbjZaeIdyg8R:va8RJbbbb9BEh8RdndnaKydwgEmbJFFuuh8YxekJbbbbJbbjZaqaAa8Acdtfydbc8S2fgeIdyg8S:va8SJbbbb9BEaeIdwa3aYcx2fgXIdwg8SNaeIdzaXIdbg8XNaeIdaMg8Ya8YMMa8SNaeIdlaXIdlg8YNaeIdCa8SNaeId3Mg8Sa8SMMa8YNaeIdba8XNaeIdxa8YNaeIdKMg8Sa8SMMa8XNaeId8KMMM:lNh8Yka8RaRNh80dna8LTmbavaYc8S2fgQIdwa8WNaQIdza8UNaQIdaMgRaRMMa8WNaQIdlaINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRaga8Aa8L2gHcdtfhXaiaYa8L2gwcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekava8Ac8S2fgQIdwa3aYcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8RagawcdtfhXaiaHcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YaCaYfRbbcd9hmbdna8Ka8Ja8Jazfydba8ASEaaazfydbgHcdtfydbgzcu9hmbaaa8AcdtfydbhzkavaHc8S2fgQIdwa3azcx2fgeIdwg8WNaQIdzaeIdbg8UNaQIdaMgRaRMMa8WNaQIdlaeIdlgINaQIdCa8WNaQId3MgRaRMMaINaQIdba8UNaQIdxaINaQIdKMgRaRMMa8UNaQId8KMMMhRagaza8L2gwcdtfhXaiaHa8L2g8NcltfheaQIdyh8Sa8LhQinaXIdbg8Ra8Ra8SNaecxfIdba8WaecwfIdbNa8UaeIdbNaIaeclfIdbNMMMg8Ra8RM:tNaRMhRaXclfhXaeczfheaQcufgQmbkdndnaEmbJbbbbh8Rxekavazc8S2fgQIdwa3aHcx2fgeIdwg8UNaQIdzaeIdbgINaQIdaMg8Ra8RMMa8UNaQIdlaeIdlg8SNaQIdCa8UNaQId3Mg8Ra8RMMa8SNaQIdbaINaQIdxa8SNaQIdKMg8Ra8RMMaINaQId8KMMMh8Raga8NcdtfhXaiawcltfheaQIdyh8Xa8LhQinaXIdbg8Wa8Wa8XNaecxfIdba8UaecwfIdbNaIaeIdbNa8SaeclfIdbNMMMg8Wa8WM:tNa8RMh8RaXclfhXaeczfheaQcufgQmbka8R:lh8Rka80aR:lMh80a8Ya8RMh8YkaKa80a8Ya80a8Y9FgeEUdwaKa8AaYaeaETVgeEBdlaKaYa8AaeEBdbaLcefgLa8E9hmbkasc;Wbfcbcj;qbz:ojjjb8Aa0hea8EhXinasc;WbfaeydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbcefBdbaecxfheaXcufgXmbkcbhecbhXinasc;WbfaefgQydbhKaQaXBdbaKaXfhXaeclfgecj;qb9hmbkcbhea0hXinasc;WbfaXydbcA4cF8FGgQcFAaQcFA6EcdtfgQaQydbgQcefBdbaraQcdtfaeBdbaXcxfhXa8Eaecefge9hmbkadak9RgQci9Uh9mdnalTmbcbheayhXinaXaeBdbaXclfhXalaecefge9hmbkkcbh9na9icbalz:ojjjbh8FaQcO9Uh9oa9mce4h9pasydwh9qcbh8Mcbh5dninaDara5cdtfydbcx2fg8NIdwgRa9c9Emea8Ma9m9pmeJFFuuh8Rdna9pa8E9pmbaDara9pcdtfydbcx2fIdwJbb;aZNh8RkdnaRa8R9ETmbaRac9ETmba8Ma9o0mdkdna8FaAa8NydlgHcdtg9rfydbgKfg9sRbba8FaAa8Nydbgzcdtg9tfydbgefg9uRbbVmbaCazfRbbh9vdnaTaecdtfgXclfydbgQaXydbgXSmbaQaX9RhYa3aKcx2fhLa3aecx2fhEa9qaXcitfhecbhXcehwdnindnayaeydbcdtfydbgQaKSmbayaeclfydbcdtfydbg8AaKSmbaQa8ASmba3a8Acx2fg8AIdba3aQcx2fgQIdbg8W:tgRaEIdlaQIdlg8U:tg8XNaEIdba8W:tg8Ya8AIdla8U:tg8RN:tgIaRaLIdla8U:tg80NaLIdba8W:tg81a8RN:tg8UNa8RaEIdwaQIdwg8S:tg8ZNa8Xa8AIdwa8S:tg8WN:tg8Xa8RaLIdwa8S:tgBNa80a8WN:tg8RNa8Wa8YNa8ZaRN:tg8Sa8Wa81NaBaRN:tgRNMMaIaINa8Xa8XNa8Sa8SNMMa8Ua8UNa8Ra8RNaRaRNMMN:rJbbj8:N9FmdkaecwfheaXcefgXaY6hwaYaX9hmbkkawceGTmba9pcefh9pxekdndndndna9vc9:fPdebdkazheinayaecdtgefaHBdbaaaefydbgeaz9hmbxikkdna8Ka8Ja8Ja9tfydbaHSEaaa9tfydbgzcdtfydbgecu9hmbaaa9rfydbhekaya9tfaHBdbaehHkayazcdtfaHBdbka9uce86bba9sce86bba8NIdwgRacacaR9DEhca9ncefh9ncecda9vceSEa8Mfh8Mka5cefg5a8E9hmbkka9nTmddnalTmbcbh8AcbhEindnayaEcdtgefydbgQaESmbaAaQcdtfydbhzdnaEaAaefydb9hgHmbaqazc8S2fgeaqaEc8S2fgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdyka8LTmbavaQc8S2fgeavaEc8S2gwfgXIdbaeIdbMUdbaeaXIdlaeIdlMUdlaeaXIdwaeIdwMUdwaeaXIdxaeIdxMUdxaeaXIdzaeIdzMUdzaeaXIdCaeIdCMUdCaeaXIdKaeIdKMUdKaeaXId3aeId3MUd3aeaXIdaaeIdaMUdaaeaXId8KaeId8KMUd8KaeaXIdyaeIdyMUdya9kaQ2hLaihXa8LhKinaXaLfgeaXa8AfgQIdbaeIdbMUdbaeclfgYaQclfIdbaYIdbMUdbaecwfgYaQcwfIdbaYIdbMUdbaecxfgeaQcxfIdbaeIdbMUdbaXczfhXaKcufgKmbkaHmbJbbbbJbbjZaqawfgeIdygR:vaRJbbbb9BEaeIdwa3azcx2fgXIdwgRNaeIdzaXIdbg8RNaeIdaMg8Wa8WMMaRNaeIdlaXIdlg8WNaeIdCaRNaeId3MgRaRMMa8WNaeIdba8RNaeIdxa8WNaeIdKMgRaRMMa8RNaeId8KMMM:lNgRa83a83aR9DEh83ka8Aa9kfh8AaEcefgEal9hmbkcbhXa8JheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8JaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkcbhXa8KheindnaeydbgQcuSmbdnaXayaQcdtgKfydbgQ9hmbcuhQa8KaKfydbgKcuSmbayaKcdtfydbhQkaeaQBdbkaeclfhealaXcefgX9hmbkka83aca8LEh83cbhKabhecbhYindnayaeydbcdtfydbgXayaeclfydbcdtfydbgQSmbaXayaecwfydbcdtfydbg8ASmbaQa8ASmbabaKcdtfgLaXBdbaLcwfa8ABdbaLclfaQBdbaKcifhKkaecxfheaYcifgYad6mbkdndnaJTmbaKak9nmba8Va839FTmbcbhdabhecbhXindnaoahaeydbgQcdtfydbcdtfIdba839ETmbabadcdtfgYaQBdbaYclfaeclfydbBdbaYcwfaecwfydbBdbadcifhdkaecxfheaXcifgXaK6mbkJFFuuh8Va9eTmeaohea9ehXJFFuuhRinaeIdbg8RaRaRa8R9EEg8WaRa8Ra839EgQEhRa8Wa8VaQEh8VaeclfheaXcufgXmbxdkkaKhdkadak0mbxdkkasclfabadalaAz:cjjjbkdndnadak0mbadhXxekdnaJmbadhXxekdna8Va9c9FmbadhXxekina8VJbb;aZNgRa9caRa9c9DEh8WJbbbbhRdna9eTmbaohea9ehAinaeIdbg8RaRa8Ra8W9FEaRa8RaR9EEhRaeclfheaAcufgAmbkkcbhXabhecbhAindnaoahaeydbgQcdtfydbcdtfIdba8W9ETmbabaXcdtfgKaQBdbaKclfaeclfydbBdbaKcwfaecwfydbBdbaXcifhXkaecxfheaAcifgAad6mbkJFFuuh8Vdna9eTmbaohea9ehAJFFuuh8RinaeIdbg8Ua8Ra8Ra8U9EEgIa8Ra8Ua8W9EgQEh8RaIa8VaQEh8VaeclfheaAcufgAmbkkdnaXad9hmbadhXxdkaRacacaR9DEhcaXak9nmeaXhda8Va9c9FmbkkdnamcjjjjlGTmbaOmbaXTmbcbh8AabheinaCaeydbgKfRbbc3thLaecwfgEydbhAdndna8JaKcdtgHfydbaeclfgzydbgQSmbcbhYa8KaQcdtfydbaK9hmekcjjjj94hYkaeaLaYVaKVBdbaCaQfRbbc3thLdndna8JaQcdtfydbaASmbcbhYa8KaAcdtfydbaQ9hmekcjjjj94hYkazaLaYVaQVBdbaCaAfRbbc3thYdndna8JaAcdtfydbaKSmbcbhQa8KaHfydbaA9hmekcjjjj94hQkaEaYaQVaAVBdbaecxfhea8Acifg8AaX6mbkkdnaOTmbaXTmbaXheinabaOabydbcdtfydbBdbabclfhbaecufgembkkdnaPTmbaPaUac:rNUdbka9hcdtascxffcxfhednina6Tmeaeydbcbyd1:jjjbH:bjjjbbaec98fhea6cufh6xbkkasc;W;qbf8KjjjjbaXk;Yieouabydlhvabydbclfcbaicdtz:ojjjbhoadci9UhrdnadTmbdnalTmbaehwadhDinaoalawydbcdtfydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbxdkkaehwadhDinaoawydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbkkdnaiTmbcbhDaohwinawydbhqawaDBdbawclfhwaqaDfhDaicufgimbkkdnadci6mbinaecwfydbhwaeclfydbhDaeydbhidnalTmbalawcdtfydbhwalaDcdtfydbhDalaicdtfydbhikavaoaicdtfgqydbcitfaDBdbavaqydbcitfawBdlaqaqydbcefBdbavaoaDcdtfgqydbcitfawBdbavaqydbcitfaiBdlaqaqydbcefBdbavaoawcdtfgwydbcitfaiBdbavawydbcitfaDBdlawawydbcefBdbaecxfhearcufgrmbkkabydbcbBdbk:todDue99aicd4aifhrcehwinawgDcethwaDar6mbkcuaDcdtgraDcFFFFi0Ecbyd:m:jjjbHjjjjbbhwaoaoyd9GgqcefBd9GaoaqcdtfawBdbawcFearz:ojjjbhkdnaiTmbalcd4hlaDcufhxcbhminamhDdnavTmbavamcdtfydbhDkcbadaDal2cdtfgDydlgwawcjjjj94SEgwcH4aw7c:F:b:DD2cbaDydbgwawcjjjj94SEgwcH4aw7c;D;O:B8J27cbaDydwgDaDcjjjj94SEgDcH4aD7c:3F;N8N27axGhwamcdthPdndndnavTmbakawcdtfgrydbgDcuSmeadavaPfydbal2cdtfgsIdbhzcehqinaqhrdnadavaDcdtfydbal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmlkarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbxdkkakawcdtfgrydbgDcuSmbadamal2cdtfgsIdbhzcehqinaqhrdnadaDal2cdtfgqIdbaz9CmbaqIdlasIdl9CmbaqIdwasIdw9BmikarcefhqakawarfaxGgwcdtfgrydbgDcu9hmbkkaramBdbamhDkabaPfaDBdbamcefgmai9hmbkkakcbyd1:jjjbH:bjjjbbaoaoyd9GcufBd9GdnaeTmbaiTmbcbhDaehwinawaDBdbawclfhwaiaDcefgD9hmbkcbhDaehwindnaDabydbgrSmbawaearcdtfgrydbBdbaraDBdbkawclfhwabclfhbaiaDcefgD9hmbkkk;Qodvuv998Jjjjjbca9Rgvczfcwfcbyd11jjbBdbavcb8Pdj1jjb83izavcwfcbydN1jjbBdbavcb8Pd:m1jjb83ibdnadTmbaicd4hodnabmbdnalTmbcbhrinaealarcdtfydbao2cdtfhwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxikkaocdthrcbhwincbhiinavczfaifgDaeaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkaearfheawcefgwad9hmbxdkkdnalTmbcbhrinabarcx2fgiaealarcdtfydbao2cdtfgwIdbUdbaiawIdlUdlaiawIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxdkkaocdthlcbhraehwinabarcx2fgiaearao2cdtfgDIdbUdbaiaDIdlUdlaiaDIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkawalfhwarcefgrad9hmbkkJbbbbavIdbavIdzgk:tgqaqJbbbb9DEgqavIdlavIdCgx:tgmamaq9DEgqavIdwavIdKgm:tgPaPaq9DEhPdnabTmbadTmbJbbbbJbbjZaP:vaPJbbbb9BEhqinabaqabIdbak:tNUdbabclfgvaqavIdbax:tNUdbabcwfgvaqavIdbam:tNUdbabcxfhbadcufgdmbkkaPk:ZlewudnaeTmbcbhvabhoinaoavBdbaoclfhoaeavcefgv9hmbkkdnaiTmbcbhrinadarcdtfhwcbhDinalawaDcdtgvc;a1jjbfydbcdtfydbcdtfydbhodnabalawavfydbcdtfydbgqcdtfgkydbgvaqSmbinakabavgqcdtfgxydbgvBdbaxhkaqav9hmbkkdnabaocdtfgkydbgvaoSmbinakabavgocdtfgxydbgvBdbaxhkaoav9hmbkkdnaqaoSmbabaqaoaqao0Ecdtfaqaoaqao6EBdbkaDcefgDci9hmbkarcifgrai6mbkkdnaembcbskcbhxindnalaxcdtgvfydbax9hmbaxhodnabavfgDydbgvaxSmbaDhqinaqabavgocdtfgkydbgvBdbakhqaoav9hmbkkaDaoBdbkaxcefgxae9hmbkcbhvabhocbhkindndnavalydbgq9hmbdnavaoydbgq9hmbaoakBdbakcefhkxdkaoabaqcdtfydbBdbxekaoabaqcdtfydbBdbkaoclfhoalclfhlaeavcefgv9hmbkakk;Jiilud99duabcbaecltz:ojjjbhvdnalTmbadhoaihralhwinarcwfIdbhDarclfIdbhqavaoydbcltfgkarIdbakIdbMUdbakclfgxaqaxIdbMUdbakcwfgxaDaxIdbMUdbakcxfgkakIdbJbbjZMUdbaoclfhoarcxfhrawcufgwmbkkdnaeTmbavhraehkinarcxfgoIdbhDaocbBdbararIdbJbbbbJbbjZaD:vaDJbbbb9BEgDNUdbarclfgoaDaoIdbNUdbarcwfgoaDaoIdbNUdbarczfhrakcufgkmbkkdnalTmbinavadydbcltfgrcxfgkaicwfIdbarcwfIdb:tgDaDNaiIdbarIdb:tgDaDNaiclfIdbarclfIdb:tgDaDNMMgDakIdbgqaqaD9DEUdbadclfhdaicxfhialcufglmbkkdnaeTmbavcxfhrinabarIdbUdbarczfhrabclfhbaecufgembkkk8MbabaeadaialavcbcbcbcbcbaoarawaDz:bjjjbk8MbabaeadaialavaoarawaDaqakaxamaPz:bjjjbk:DCoDud99rue99iul998Jjjjjbc;Wb9Rgw8KjjjjbdndnarmbcbhDxekawcxfcbc;Kbz:ojjjb8Aawcuadcx2adc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbgqBdxawceBd2aqaeadaicbz:ejjjb8AawcuadcdtadcFFFFi0Egkcbyd:m:jjjbHjjjjbbgxBdzawcdBd2adcd4adfhmceheinaegicetheaiam6mbkcbhPawcuaicdtgsaicFFFFi0Ecbyd:m:jjjbHjjjjbbgzBdCawciBd2dndnar:ZgH:rJbbbZMgO:lJbbb9p9DTmbaO:Ohexekcjjjj94hekaicufhAc:bwhmcbhCadhXcbhQinaChLaeamgKcufaeaK9iEaPgDcefaeaD9kEhYdndnadTmbaYcuf:YhOaqhiaxheadhmindndnaiIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbh5cbhPindna3axaPcdtfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbaeaCSmbcehiina3amaifaAGgmcdtfgEydbgecuSmeaicefhiaeaC9hmbkkaEaCBdba5aecuSfh5aPcefgPad9hmbxdkkazcFeasz:ojjjb8Acbh5kaDaYa5ar0giEhPaLa5aiEhCdna5arSmbaYaKaiEgmaP9Rcd9imbdndnaQcl0mbdnaX:ZgOaL:Zg8A:taY:Yg8EaD:Y:tg8Fa8EaK:Y:tgaa5:ZghaH:tNNNaOaH:taaNa8Aah:tNa8AaH:ta8FNahaO:tNM:va8EMJbbbZMgO:lJbbb9p9DTmbaO:Ohexdkcjjjj94hexekaPamfcd9Theka5aXaiEhXaQcefgQcs9hmekkdndnaCmbcihicbhDxekcbhiawakcbyd:m:jjjbHjjjjbbg5BdKawclBd2aPcuf:Yh8AdndnadTmbaqhiaxheadhmindndnaiIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ojjjbh3cbhDcbhYindndndna3axaYcdtgKfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbcehiinaxaecdtgefydbaCSmdamaifheaicefhia3aeaAGgmcdtfgEydbgecu9hmbkkaEaYBdbaDhiaDcefhDxeka5aefydbhika5aKfaiBdbaYcefgYad9hmbkcuaDc32giaDc;j:KM;jb0EhexekazcFeasz:ojjjb8AcbhDcbhekawaecbyd:m:jjjbHjjjjbbgeBd3awcvBd2aecbaiz:ojjjbhEavcd4hKdnadTmbdnalTmbaKcdth3a5hCaqhealhmadhAinaEaCydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiamIdbaiIdxMUdxaiamclfIdbaiIdzMUdzaiamcwfIdbaiIdCMUdCaiaiIdKJbbjZMUdKaCclfhCaecxfheama3fhmaAcufgAmbxdkka5hmaqheadhCinaEamydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiaiIdxJbbbbMUdxaiaiIdzJbbbbMUdzaiaiIdCJbbbbMUdCaiaiIdKJbbjZMUdKamclfhmaecxfheaCcufgCmbkkdnaDTmbaEhiaDheinaiaiIdbJbbbbJbbjZaicKfIdbgO:vaOJbbbb9BEgONUdbaiclfgmaOamIdbNUdbaicwfgmaOamIdbNUdbaicxfgmaOamIdbNUdbaiczfgmaOamIdbNUdbaicCfgmaOamIdbNUdbaic3fhiaecufgembkkcbhCawcuaDcdtgYaDcFFFFi0Egicbyd:m:jjjbHjjjjbbgeBdaawcoBd2awaicbyd:m:jjjbHjjjjbbg3Bd8KaecFeaYz:ojjjbhxdnadTmbJbbjZJbbjZa8A:vaPceSEaoNgOaONh8AaKcdthPalheina8Aaec;81jjbalEgmIdwaEa5ydbgAc32fgiIdC:tgOaONamIdbaiIdx:tgOaONamIdlaiIdz:tgOaONMMNaqcwfIdbaiIdw:tgOaONaqIdbaiIdb:tgOaONaqclfIdbaiIdl:tgOaONMMMhOdndnaxaAcdtgifgmydbcuSmba3aifIdbaO9ETmekamaCBdba3aifaOUdbka5clfh5aqcxfhqaeaPfheadaCcefgC9hmbkkabaxaYz:njjjb8AcrhikaicdthiinaiTmeaic98fgiawcxffydbcbyd1:jjjbH:bjjjbbxbkkawc;Wbf8KjjjjbaDk:Ydidui99ducbhi8Jjjjjbca9Rglczfcwfcbyd11jjbBdbalcb8Pdj1jjb83izalcwfcbydN1jjbBdbalcb8Pd:m1jjb83ibdndnaembJbbjFhvJbbjFhoJbbjFhrxekadcd4cdthwincbhdinalczfadfgDabadfIdbgvaDIdbgoaoav9EEUdbaladfgDavaDIdbgoaoav9DEUdbadclfgdcx9hmbkabawfhbaicefgiae9hmbkalIdwalIdK:thralIdlalIdC:thoalIdbalIdz:thvkJbbbbavavJbbbb9DEgvaoaoav9DEgvararav9DEk9DeeuabcFeaicdtz:ojjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcifc98GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcrfc94GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd:q:jjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd:q:jjjbfgdBd:q:jjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk:Iedbcjwk1eFFuuFFuuFFuuFFuFFFuFFFuFbbbbbbbbeeebeebebbeeebebbbbbebebbbbbbbbbebbbdbbbbbbbebbbebbbdbbbbbbbbbbbeeeeebebbebbebebbbeebbbbbbbbbbbbbbbbbbbbbc1Dkxebbbdbbb:GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(h){a=h.instance,a.exports.__wasm_call_ctors()});function r(h){for(var l=new Uint8Array(h.length),g=0;g<h.length;++g){var u=h.charCodeAt(g);l[g]=u>96?u-97:u>64?u-39:u+4}for(var p=0,g=0;g<h.length;++g)l[p++]=l[g]<60?e[l[g]]:(l[g]-60)*64+l[++g];return l.buffer.slice(0,p)}function n(h){if(!h)throw new Error("Assertion failed")}function i(h){return new Uint8Array(h.buffer,h.byteOffset,h.byteLength)}function o(h,l,g){var u=a.exports.sbrk,p=u(l.length*4),y=u(g*4),w=new Uint8Array(a.exports.memory.buffer),T=i(l);w.set(T,p);var I=h(y,p,l.length,g);w=new Uint8Array(a.exports.memory.buffer);var S=new Uint32Array(g);new Uint8Array(S.buffer).set(w.subarray(y,y+g*4)),T.set(w.subarray(p,p+l.length*4)),u(p-u(0));for(var R=0;R<l.length;++R)l[R]=S[l[R]];return[S,I]}function c(h){for(var l=0,g=0;g<h.length;++g){var u=h[g];l=l<u?u:l}return l}function d(h,l,g,u,p,y,w,T,I){var S=a.exports.sbrk,R=S(4),_=S(g*4),A=S(p*y),C=S(g*4),D=new Uint8Array(a.exports.memory.buffer);D.set(i(u),A),D.set(i(l),C);var j=h(_,C,g,A,p,y,w,T,I,R);D=new Uint8Array(a.exports.memory.buffer);var z=new Uint32Array(j);i(z).set(D.subarray(_,_+j*4));var W=new Float32Array(1);return i(W).set(D.subarray(R,R+4)),S(R-S(0)),[z,W[0]]}function b(h,l,g,u,p,y,w,T,I,S,R,_,A){var C=a.exports.sbrk,D=C(4),j=C(g*4),z=C(p*y),W=C(p*T),te=C(I.length*4),oe=C(g*4),je=S?C(p):0,de=new Uint8Array(a.exports.memory.buffer);de.set(i(u),z),de.set(i(w),W),de.set(i(I),te),de.set(i(l),oe),S&&de.set(i(S),je);var Be=h(j,oe,g,z,p,y,W,T,te,I.length,je,R,_,A,D);de=new Uint8Array(a.exports.memory.buffer);var Le=new Uint32Array(Be);i(Le).set(de.subarray(j,j+Be*4));var ve=new Float32Array(1);return i(ve).set(de.subarray(D,D+4)),C(D-C(0)),[Le,ve[0]]}function f(h,l,g,u){var p=a.exports.sbrk,y=p(g*u),w=new Uint8Array(a.exports.memory.buffer);w.set(i(l),y);var T=h(y,g,u);return p(y-p(0)),T}function v(h,l,g,u,p,y,w,T){var I=a.exports.sbrk,S=I(T*4),R=I(g*u),_=I(g*y),A=new Uint8Array(a.exports.memory.buffer);A.set(i(l),R),p&&A.set(i(p),_);var C=h(S,R,g,u,_,y,w,T);A=new Uint8Array(a.exports.memory.buffer);var D=new Uint32Array(C);return i(D).set(A.subarray(S,S+C*4)),I(S-I(0)),D}var x={LockBorder:1,Sparse:2,ErrorAbsolute:4,Prune:8,_InternalDebug:1<<30};return{ready:s,supported:!0,compactMesh:function(h){n(h instanceof Uint32Array||h instanceof Int32Array||h instanceof Uint16Array||h instanceof Int16Array),n(h.length%3==0);var l=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h);return o(a.exports.meshopt_optimizeVertexFetchRemap,l,c(h)+1)},simplify:function(h,l,g,u,p,y){n(h instanceof Uint32Array||h instanceof Int32Array||h instanceof Uint16Array||h instanceof Int16Array),n(h.length%3==0),n(l instanceof Float32Array),n(l.length%g==0),n(g>=3),n(u>=0&&u<=h.length),n(u%3==0),n(p>=0);for(var w=0,T=0;T<(y?y.length:0);++T)n(y[T]in x),w|=x[y[T]];var I=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h),S=d(a.exports.meshopt_simplify,I,h.length,l,l.length/g,g*4,u,p,w);return S[0]=h instanceof Uint32Array?S[0]:new h.constructor(S[0]),S},simplifyWithAttributes:function(h,l,g,u,p,y,w,T,I,S){n(h instanceof Uint32Array||h instanceof Int32Array||h instanceof Uint16Array||h instanceof Int16Array),n(h.length%3==0),n(l instanceof Float32Array),n(l.length%g==0),n(g>=3),n(u instanceof Float32Array),n(u.length%p==0),n(p>=0),n(w==null||w instanceof Uint8Array),n(w==null||w.length==l.length/g),n(T>=0&&T<=h.length),n(T%3==0),n(I>=0),n(Array.isArray(y)),n(p>=y.length),n(y.length<=32);for(var R=0;R<y.length;++R)n(y[R]>=0);for(var _=0,R=0;R<(S?S.length:0);++R)n(S[R]in x),_|=x[S[R]];var A=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h),C=b(a.exports.meshopt_simplifyWithAttributes,A,h.length,l,l.length/g,g*4,u,p*4,new Float32Array(y),w?new Uint8Array(w):null,T,I,_);return C[0]=h instanceof Uint32Array?C[0]:new h.constructor(C[0]),C},getScale:function(h,l){return n(h instanceof Float32Array),n(h.length%l==0),n(l>=3),f(a.exports.meshopt_simplifyScale,h,h.length/l,l*4)},simplifyPoints:function(h,l,g,u,p,y){return n(h instanceof Float32Array),n(h.length%l==0),n(l>=3),n(g>=0&&g<=h.length/l),u?(n(u instanceof Float32Array),n(u.length%p==0),n(p>=3),n(h.length/l==u.length/p),v(a.exports.meshopt_simplifyPoints,h,h.length/l,l*4,u,p*4,y,g)):v(a.exports.meshopt_simplifyPoints,h,h.length/l,l*4,void 0,0,0,g)}}})();var fx=(function(){var t="b9H79TebbbeVx9Geueu9Geub9Gbb9Giuuueu9Gmuuuuuuuuuuu9999eu9Gvuuuuueu9Gwuuuuuuuub9Gxuuuuuuuuuuuueu9Gkuuuuuuuuuu99eu9Gouuuuuub9Gruuuuuuub9GluuuubiOHdilvorwDqqkbiibeilve9Weiiviebeoweuec;G:Odkr:Yewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9I919P29K9nW79O2Wt79c9V919U9KbeX9TW79O9V9Wt9F9I919P29K9nW79O2Wt7bo39TW79O9V9Wt9F9J9V9T9W91tWJ2917tWV9c9V919U9K7br39TW79O9V9Wt9F9J9V9T9W91tW9nW79O2Wt9c9V919U9K7bDL9TW79O9V9Wt9F9V9Wt9P9T9P96W9nW79O2Wtbql79IV9RbkDwebcekdsPq;Q9BHdbkIbabaec9:fgefcufae9Ugeabci9Uadfcufad9Ugbaeab0Ek:w8KDPue99eux99dui99euo99iu8Jjjjjbc:WD9Rgm8KjjjjbdndnalmbcbhPxekamc:Cwfcbc;Kbz:njjjb8Adndnalcb9imbaoal9nmbamcuaocdtaocFFFFi0Egscbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamascbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8waihsalhAinazasydbcdtfcbBdbasclfhsaAcufgAmbkaihsalhAinazasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkaihsalhCcbhXindnazasydbcdtgQfgAydbcb9imbaHaQfaXBdbaAaAydbgQcjjjj94VBdbaQaXfhXkasclfhsaCcufgCmbkalci9UhLdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhXaHaAydbcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaXcdtfgXaXydbgXcefBdbaOaXcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaihsalhAindnazasydbcdtgCfgXydbgQcu9kmbaXaQcFFFFrGgQBdbaHaCfgCaCydbaQ9RBdbkasclfhsaAcufgAmbxdkkamcuaocdtgsaocFFFFi0EgAcbyd;y1jjbHjjjjbbgzBd:CwamceBd;8wamaAcbyd;y1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd;y1jjbHjjjjbbgOBd:KwamciBd;8wazcbasz:njjjbhXalci9UhLaihsalhAinaXasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkdnaoTmbcbhsaHhAaXhCaohQinaAasBdbaAclfhAaCydbasfhsaCclfhCaQcufgQmbkkdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhQaHaAydbcdtfgKaKydbgKcefBdbaOaKcdtfasBdbaHaQcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaoTmbcbhsaohAinaHasfgCaCydbaXasfydb9RBdbasclfhsaAcufgAmbkkamaLcbyd;y1jjbHjjjjbbgsBd:OwamclBd;8wascbaLz:njjjbhYamcuaLcK2alcjjjjd0Ecbyd;y1jjbHjjjjbbg8ABd:SwamcvBd;8wJbbbbhEdnalci6g3mbarcd4hKaihAa8AhsaLhrJbbbbh5inavaAclfydbaK2cdtfgCIdlh8EavaAydbaK2cdtfgXIdlhEavaAcwfydbaK2cdtfgQIdlh8FaCIdwhaaXIdwhhaQIdwhgasaCIdbg8JaXIdbg8KMaQIdbg8LMJbbnn:vUdbasclfaXIdlaCIdlMaQIdlMJbbnn:vUdbaQIdwh8MaCIdwh8NaXIdwhyascxfa8EaE:tg8Eagah:tggNa8FaE:tg8Faaah:tgaN:tgEJbbbbJbbjZa8Ja8K:tg8Ja8FNa8La8K:tg8Ka8EN:tghahNaEaENaaa8KNaga8JN:tgEaENMM:rg8K:va8KJbbbb9BEg8ENUdbasczfaEa8ENUdbascCfaha8ENUdbascwfa8Maya8NMMJbbnn:vUdba5a8KMh5aAcxfhAascKfhsarcufgrmbka5aL:Z:vJbbbZNhEkamcuaLcdtalcFFFF970Ecbyd;y1jjbHjjjjbbgCBd:WwamcoBd;8waEaq:ZNhEdna3mbcbhsaChAinaAasBdbaAclfhAaLascefgs9hmbkkaE:rhhcuh8PamcuaLcltalcFFFFd0Ecbyd;y1jjbHjjjjbbgIBd:0wamcrBd;8wcbaIa8AaCaLz:djjjb8AJFFuuhyJFFuuh8RJFFuuh8Sdnalci6gXmbJFFuuh8Sa8AhsaLhAJFFuuh8RJFFuuhyinascwfIdbgEayayaE9EEhyasclfIdbgEa8Ra8RaE9EEh8RasIdbgEa8Sa8SaE9EEh8SascKfhsaAcufgAmbkkahJbbbZNhgamaocetgscuaocu9kEcbyd;y1jjbHjjjjbbgABd:4waAcFeasz:njjjbhCdnaXmbcbhAJFFuuhEa8Ahscuh8PinascwfIdbay:tghahNasIdba8S:tghahNasclfIdba8R:tghahNMM:rghaEa8PcuSahaE9DVgXEhEaAa8PaXEh8PascKfhsaLaAcefgA9hmbkkamczfcbcjwz:njjjb8Aamcwf9cb83ibam9cb83ibagaxNhRJbbjZak:th8Ncbh8UJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80cbh81cbhPinJbbbbhEdna8UTmbJbbjZa8U:Z:vhEkJbbbbhhdna80a80Na8Ya8YNa8Za8ZNMMg8KJbbbb9BmbJbbjZa8K:r:vhhka8XaENh5a8WaENh8Fa8VaENhaa8PhQdndndndndna8UaPVTmbamydwgBTmea80ahNh8Ja8ZahNh8La8YahNh8Maeamydbcdtfh83cbh3JFFuuhEcvhXcuhQindnaza83a3cdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAindndnaCaiaAydbgKcx2fgsclfydbgrcetf8Vebcs4aCasydbgLcetf8Vebcs4faCascwfydbglcetf8Vebcs4fgombcbhsxekcehsazaLcdtfydbgLceSmbcehsazarcdtfydbgrceSmbcehsazalcdtfydbglceSmbdnarcdSaLcdSfalcdSfcd6mbaocefhsxekaocdfhskdnasaX9kmba8AaKcK2fgLIdwa5:thhaLIdla8F:th8KaLIdbaa:th8EdndnakJbbbb9DTmba8E:lg8Ea8K:lg8Ka8Ea8K9EEg8Kah:lgha8Kah9EEag:vJbbjZMhhxekahahNa8Ea8ENa8Ka8KNMM:rag:va8NNJbbjZMJ9VO:d86JbbjZaLIdCa8JNaLIdxa8MNa8LaLIdzNMMakN:tghahJ9VO:d869DENhhkaKaQasaX6ahaE9DVgLEhQasaXaLEhXahaEaLEhEkaAclfhAavcufgvmbkka3cefg3aB9hmbkkaQcu9hmekama5Ud:ODama8FUd:KDamaaUd:GDamcuBd:qDamcFFF;7rBdjDaIcba8AaYamc:GDfakJbbbb9Damc:qDfamcjDfz:ejjjbamyd:qDhQdndnaxJbbbb9ETmba8UaD6mbaQcuSmeceh3amIdjDaR9EmixdkaQcu9hmekdna8UTmbdnamydlgza8Uci2fgsciGTmbadasfcba8Uazcu7fciGcefz:njjjb8AkabaPcltfgzam8Pib83dbazcwfamcwf8Pib83dbaPcefhPkc3hzinazc98Smvamc:Cwfazfydbcbyd;u1jjbH:bjjjbbazc98fhzxbkkcbh3a8Uaq9pmbamydwaCaiaQcx2fgsydbcetf8Vebcs4aCascwfydbcetf8Vebcs4faCasclfydbcetf8Vebcs4ffaw9nmekcbhscbhAdna81TmbcbhAamczfhXinamczfaAcdtfaXydbgLBdbaXclfhXaAaYaLfRbbTfhAa81cufg81mbkkamydwhlamydbhXam9cu83i:GDam9cu83i:ODam9cu83i:qDam9cu83i:yDaAc;8eaAclfc:bd6Eh81inamcjDfasfcFFF;7rBdbasclfgscz9hmbka81cdthBdnalTmbaeaXcdtfhocbhrindnazaoarcdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAcuhLcuhsinazaiaAydbgKcx2fgXclfydbcdtfydbazaXydbcdtfydbfazaXcwfydbcdtfydbfgXasaXas6gXEhsaKaLaXEhLaAclfhAavcufgvmbkaLcuSmba8AaLcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEcbhAindndnasamc:qDfaAfgvydbgX6mbasaX9hmeaEamcjDfaAfIdb9FTmekavasBdbamc:GDfaAfaLBdbamcjDfaAfaEUdbxdkaAclfgAcz9hmbkkarcefgral9hmbkkamczfaBfhLcbhscbhAindnamc:GDfasfydbgXcuSmbaLaAcdtfaXBdbaAcefhAkasclfgscz9hmbkaAa81fg81TmbJFFuuhhcuhKamczfhsa81hvcuhLina8AasydbgXcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEdndnazaiaXcx2fgAclfydbcdtfydbazaAydbcdtfydbfazaAcwfydbcdtfydbfgAaL6mbaAaL9hmeaEah9DTmekaEhhaAhLaXhKkasclfhsavcufgvmbkaKcuSmbaKhQkdnamaiaQcx2fgrydbarclfydbarcwfydbaCabaeadaPawaqa3z:fjjjbTmbaPcefhPJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80kcbhXinaOaHaraXcdtfydbcdtgAfydbcdtfgKhsazaAfgvydbgLhAdnaLTmbdninasydbaQSmeasclfhsaAcufgATmdxbkkasaKaLcdtfc98fydbBdbavavydbcufBdbkaXcefgXci9hmbka8AaQcK2fgsIdbhEasIdlhhasIdwh8KasIdxh8EasIdzh5asIdCh8FaYaQfce86bba80a8FMh80a8Za5Mh8Za8Ya8EMh8Ya8Xa8KMh8Xa8WahMh8Wa8VaEMh8Vamydxh8Uxbkkamc:WDf8KjjjjbaPk;Vvivuv99lu8Jjjjjbca9Rgv8Kjjjjbdndnalcw0mbaiydbhoaeabcitfgralcdtcufBdlaraoBdbdnalcd6mbaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkkalabfhrxekcbhDavczfcwfcbBdbav9cb83izavcwfcbBdbav9cb83ibJbbjZhqJbbjZhkinadaiaDcdtfydbcK2fhwcbhrinavczfarfgoawarfIdbgxaoIdbgm:tgPakNamMgmUdbavarfgoaPaxam:tNaoIdbMUdbarclfgrcx9hmbkJbbjZaqJbbjZMgq:vhkaDcefgDal9hmbkcbhoadcbcecdavIdlgxavIdwgm9GEgravIdbgPam9GEaraPax9GEgscdtgrfhzavczfarfIdbhxaihralhwinaiaocdtfgDydbhHaDarydbgOBdbaraHBdbarclfhraoazaOcK2fIdbax9Dfhoawcufgwmbkaeabcitfhrdndnaocv6mbaoalc98f6mekaraiydbBdbaralcdtcufBdlaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkalabfhrxekaraxUdbararydlc98GasVBdlabcefaeadaiaoz:djjjbhwararydlciGawabcu7fcdtVBdlawaeadaiaocdtfalao9Rz:djjjbhrkavcaf8Kjjjjbark:;idiud99dndnabaecitfgwydlgDciGgqciSmbinabcbaDcd4gDalaqcdtfIdbawIdb:tgkJbbbb9FEgwaecefgefadaialavaoarz:ejjjbak:larIdb9FTmdabawaD7aefgecitfgwydlgDciGgqci9hmbkkabaecitfgeclfhbdnavmbcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdwalIdw:tgkakNaqIdbalIdb:tgkakNaqIdlalIdl:tgkakNMM:rgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbxdkkcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdbalIdb:t:lgkaqIdlalIdl:t:lgxakax9EEgkaqIdwalIdw:t:lgxakax9EEgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbkkk;llevudnabydwgxaladcetfgm8Vebcs4alaecetfgP8Vebgscs4falaicetfgz8Vebcs4ffaD0abydxaq9pVakVgDce9hmbavawcltfgxab8Pdb83dbaxcwfabcwfgx8Pdb83dbdnaxydbgqTmbaoabydbcdtfhxaqhsinalaxydbcetfcFFi87ebaxclfhxascufgsmbkkdnabydxglci2gsabydlgxfgkciGTmbarakfcbalaxcu7fciGcefz:njjjb8Aabydxci2hsabydlhxabydwhqkab9cb83dwababydbaqfBdbabascifc98GaxfBdlaP8Vebhscbhxkdnascztcz91cu9kmbabaxcefBdwaPax87ebaoabydbcdtfaxcdtfaeBdbkdnam8Uebcu9kmbababydwgxcefBdwamax87ebaoabydbcdtfaxcdtfadBdbkdnaz8Uebcu9kmbababydwgxcefBdwazax87ebaoabydbcdtfaxcdtfaiBdbkarabydlfabydxci2faPRbb86bbarabydlfabydxci2fcefamRbb86bbarabydlfabydxci2fcdfazRbb86bbababydxcefBdxaDk8LbabaeadaialavaoarawaDaDaqJbbbbz:cjjjbk;Nkovud99euv99eul998Jjjjjbc:W;ae9Rgo8KjjjjbdndnadTmbavcd4hrcbhwcbhDindnaiaeclfydbar2cdtfgvIdbaiaeydbar2cdtfgqIdbgk:tgxaiaecwfydbar2cdtfgmIdlaqIdlgP:tgsNamIdbak:tgzavIdlaP:tgPN:tgkakNaPamIdwaqIdwgH:tgONasavIdwaH:tgHN:tgPaPNaHazNaOaxN:tgxaxNMM:rgsJbbbb9Bmbaoc:W:qefawcx2fgAakas:vUdwaAaxas:vUdlaAaPas:vUdbaoc8Wfawc8K2fgAaq8Pdb83dbaAav8Pdb83dxaAam8Pdb83dKaAcwfaqcwfydbBdbaAcCfavcwfydbBdbaAcafamcwfydbBdbawcefhwkaecxfheaDcifgDad6mbkab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbawTmeaocbBd8Sao9cb83iKao9cb83izaoczfaoc8Wfawci2cxaoc8Sfcbcrz1jjjbaoIdKhCaoIdChXaoIdzhQao9cb83iwao9cb83ibaoaoc:W:qefawcxaoc8Sfcbciz1jjjbJbbjZhkaoIdwgPJbbbbJbbjZaPaPNaoIdbgPaPNaoIdlgsasNMM:rgx:vaxJbbbb9BEgzNhxasazNhsaPazNhzaoc:W:qefheawhvinaecwfIdbaxNaeIdbazNasaeclfIdbNMMgPakaPak9DEhkaecxfheavcufgvmbkabaCUdwabaXUdlabaQUdbabaoId3UdxdndnakJ;n;m;m899FmbJbbbbhPaoc:W:qefheaoc8WfhvinaCavcwfIdb:taecwfIdbgHNaQavIdb:taeIdbgONaXavclfIdb:taeclfIdbgLNMMaxaHNazaONasaLNMM:vgHaPaHaP9EEhPavc8KfhvaecxfheawcufgwmbkabaxUd8KabasUdaabazUd3abaCaxaPN:tUdKabaXasaPN:tUdCabaQazaPN:tUdzabJbbjZakakN:t:rgkUdydndnaxJbbj:;axJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;axJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohexekcjjjj94hekabae86b8UdndnasJbbj:;asJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;asJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkabav86bRdndnazJbbj:;azJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;azJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohqxekcjjjj94hqkabaq86b8SdndnaecKtcK91:YJbb;:9c:vax:t:lavcKtcK91:YJbb;:9c:vas:t:laqcKtcK91:YJbb;:9c:vaz:t:lakMMMJbb;:9cNJbbjZMgk:lJbbb9p9DTmbak:Ohexekcjjjj94hekaecFbaecFb9iEhexekabcjjj;8iBdycFbhekabae86b8Vxekab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbkaoc:W;aef8Kjjjjbk;Iwwvul99iud99eue99eul998Jjjjjbcje9Rgr8Kjjjjbavcd4hwaicd4hDdndnaoTmbarc;abfcbaocdtgvz:njjjb8Aarc;Gbfcbavz:njjjb8AarhvarcafhiaohqinavcFFF97BdbaicFFF;7rBdbaiclfhiavclfhvaqcufgqmbkdnadTmbcbhkinaeakaD2cdtfgvIdwhxavIdlhmavIdbhPalakaw2cdtfIdbhsarc;abfhzarhiarc;GbfhHarcafhqcj1jjbhvaohOinasavcwfIdbaxNavIdbaPNavclfIdbamNMMgAMhCakhXdnaAas:tgAaqIdbgQ9DgLmbaHydbhXkaHaXBdbakhXdnaCaiIdbgK9EmbazydbhXaKhCkazaXBdbaiaCUdbaqaAaQaLEUdbavcxfhvaqclfhqaHclfhHaiclfhiazclfhzaOcufgOmbkakcefgkad9hmbkkadThkJbbbbhCcbhXarc;abfhvarc;Gbfhicbhqinalavydbgzaw2cdtfIdbalaiydbgHaw2cdtfIdbaeazaD2cdtfgzIdwaeaHaD2cdtfgHIdw:tgsasNazIdbaHIdb:tgsasNazIdlaHIdl:tgsasNMM:rMMgsaCasaC9EgzEhCaqaXazEhXaiclfhiavclfhvaoaqcefgq9hmbkaCJbbbZNhKxekadThkcbhXJbbbbhKkJbbbbhCdnaearc;abfaXcdtgifydbgqaD2cdtfgvIdwaearc;GbfaifydbgzaD2cdtfgiIdwgm:tgsasNavIdbaiIdbgY:tgAaANavIdlaiIdlgP:tgQaQNMM:rgxJbbbb9ETmbaxalaqaw2cdtfIdbMalazaw2cdtfIdb:taxaxM:vhCkasaCNamMhmaQaCNaPMhPaAaCNaYMhYdnakmbaDcdthvawcdthiindnalIdbg8AaecwfIdbam:tgCaCNaeIdbaY:tgsasNaeclfIdbaP:tgAaANMM:rgQMgEaK9ETmbJbbbbhxdnaQJbbbb9ETmbaEaK:taQaQM:vhxkaxaCNamMhmaxaANaPMhPaxasNaYMhYa8AaKaQMMJbbbZNhKkaeavfhealaifhladcufgdmbkkabaKUdxabamUdwabaPUdlabaYUdbarcjef8Kjjjjbkjeeiu8Jjjjjbcj8W9Rgr8Kjjjjbaici2hwdnaiTmbawceawce0EhDarhiinaiaeadRbbcdtfydbBdbadcefhdaiclfhiaDcufgDmbkkabarawaladaoz:hjjjbarcj8Wf8Kjjjjbk:3lequ8JjjjjbcjP9Rgl8Kjjjjbcbhvalcjxfcbaiz:njjjb8AdndnadTmbcjehoaehrincuhwarhDcuhqavhkdninawakaoalcjxfaDcefRbbfRbb9RcFeGci6aoalcjxfaDRbbfRbb9RcFeGci6faoalcjxfaDcdfRbbfRbb9RcFeGci6fgxaq9mgmEhwdnammbaxce0mdkaxaqaxaq9kEhqaDcifhDadakcefgk9hmbkkaeawci2fgDcdfRbbhqaDcefRbbhxaDRbbhkaeavci2fgDcifaDawav9Rci2z:qjjjb8Aakalcjxffaocefgo86bbaxalcjxffao86bbaDcdfaq86bbaDcefax86bbaDak86bbaqalcjxffao86bbarcifhravcefgvad9hmbkalcFeaicetz:njjjbhoadci2gDceaDce0EhqcbhxindnaoaeRbbgkcetfgw8UebgDcu9kmbawax87ebaocjlfaxcdtfabakcdtfydbBdbaxhDaxcefhxkaeaD86bbaecefheaqcufgqmbkaxcdthDxekcbhDkabalcjlfaDz:mjjjb8AalcjPf8Kjjjjbk9teiucbcbyd;C1jjbgeabcifc98GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;C1jjbgeabcrfc94GfgbBd;C1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;C1jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;C1jjbfgdBd;C1jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk:;Deludndndnadch9pmbabaeSmdaeabadfgi9Rcbadcet9R0mekabaead;8qbbxekaeab7ciGhldndndnabae9pmbdnalTmbadhvabhixikdnabciGmbadhvabhixdkadTmiabaeRbb86bbadcufhvdnabcefgiciGmbaecefhexdkavTmiabaeRbe86beadc9:fhvdnabcdfgiciGmbaecdfhexdkavTmiabaeRbd86bdadc99fhvdnabcifgiciGmbaecifhexdkavTmiabaeRbi86biabclfhiaeclfheadc98fhvxekdnalmbdnaiciGTmbadTmlabadcufgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc9:fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc99fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc98fgdfaeadfRbb86bbkadcl6mbdnadc98fgocd4cefciGgiTmbaec98fhlabc98fhvinavadfaladfydbBdbadc98fhdaicufgimbkkaocx6mbaec9Wfhvabc9WfhoinaoadfgicxfavadfglcxfydbBdbaicwfalcwfydbBdbaiclfalclfydbBdbaialydbBdbadc9Wfgdci0mbkkadTmdadhidnadciGglTmbaecufhvabcufhoadhiinaoaifavaifRbb86bbaicufhialcufglmbkkadcl6mdaec98fhlabc98fhvinavaifgecifalaifgdcifRbb86bbaecdfadcdfRbb86bbaecefadcefRbb86bbaeadRbb86bbaic98fgimbxikkavcl6mbdnavc98fglcd4cefcrGgdTmbavadcdt9RhvinaiaeydbBdbaeclfheaiclfhiadcufgdmbkkalc36mbinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaiaeydzBdzaiaeydCBdCaiaeydKBdKaiaeyd3Bd3aecafheaicafhiavc9Gfgvci0mbkkavTmbdndnavcrGgdmbavhlxekavc94GhlinaiaeRbb86bbaicefhiaecefheadcufgdmbkkavcw6mbinaiaeRbb86bbaiaeRbe86beaiaeRbd86bdaiaeRbi86biaiaeRbl86blaiaeRbv86bvaiaeRbo86boaiaeRbr86braicwfhiaecwfhealc94fglmbkkabkk9Tdbcjwk9ubbjZbbbbbbbbbbbbbbjZbbbbbbbbbbbbbbjZ86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;86;nAZ86;nAZ86;nAZ86;nA:;bc;uwkxebbbdbbb9GNbb",e=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var a,s=WebAssembly.instantiate(r(t),{}).then(function(h){a=h.instance,a.exports.__wasm_call_ctors()});function r(h){for(var l=new Uint8Array(h.length),g=0;g<h.length;++g){var u=h.charCodeAt(g);l[g]=u>96?u-97:u>64?u-39:u+4}for(var p=0,g=0;g<h.length;++g)l[p++]=l[g]<60?e[l[g]]:(l[g]-60)*64+l[++g];return l.buffer.slice(0,p)}function n(h){if(!h)throw new Error("Assertion failed")}function i(h){return new Uint8Array(h.buffer,h.byteOffset,h.byteLength)}var o=48,c=16;function d(h,l){var g=h.meshlets[l*4+0],u=h.meshlets[l*4+1],p=h.meshlets[l*4+2],y=h.meshlets[l*4+3];return{vertices:h.vertices.subarray(g,g+p),triangles:h.triangles.subarray(u,u+y*3)}}function b(h,l,g,u,p,y,w){var T=a.exports.sbrk,I=a.exports.meshopt_buildMeshletsBound(h.length,p,y),S=T(I*c),R=T(I*p*4),_=T(I*y*3),A=T(h.byteLength),C=T(l.byteLength),D=new Uint8Array(a.exports.memory.buffer);D.set(i(h),A),D.set(i(l),C);var j=a.exports.meshopt_buildMeshlets(S,R,_,A,h.length,C,g,u,p,y,w);D=new Uint8Array(a.exports.memory.buffer);for(var z=D.subarray(S,S+j*c),W=new Uint32Array(z.buffer,z.byteOffset,z.byteLength/4).slice(),te=0;te<j;++te){var oe=W[te*4+0],je=W[te*4+1],g=W[te*4+2],de=W[te*4+3];a.exports.meshopt_optimizeMeshlet(R+oe*4,_+je,de,g)}var Be=W[(j-1)*4+0],Le=W[(j-1)*4+1],ve=W[(j-1)*4+2],qe=W[(j-1)*4+3],Ue=Be+ve,ct=Le+(qe*3+3&-4),Jt={meshlets:W,vertices:new Uint32Array(D.buffer,R,Ue).slice(),triangles:new Uint8Array(D.buffer,_,ct*3).slice(),meshletCount:j};return T(S-T(0)),Jt}function f(h){var l=new Float32Array(a.exports.memory.buffer,h,o/4);return{centerX:l[0],centerY:l[1],centerZ:l[2],radius:l[3],coneApexX:l[4],coneApexY:l[5],coneApexZ:l[6],coneAxisX:l[7],coneAxisY:l[8],coneAxisZ:l[9],coneCutoff:l[10]}}function v(h,l,g,u){var p=a.exports.sbrk,y=[],w=p(l.byteLength),T=p(h.vertices.byteLength),I=p(h.triangles.byteLength),S=p(o),R=new Uint8Array(a.exports.memory.buffer);R.set(i(l),w),R.set(i(h.vertices),T),R.set(i(h.triangles),I);for(var _=0;_<h.meshletCount;++_){var A=h.meshlets[_*4+0],C=h.meshlets[_*4+0+1],D=h.meshlets[_*4+0+3];a.exports.meshopt_computeMeshletBounds(S,T+A*4,I+C,D,w,g,u),y.push(f(S))}return p(w-p(0)),y}function x(h,l,g,u){var p=a.exports.sbrk,y=p(o),w=p(h.byteLength),T=p(l.byteLength),I=new Uint8Array(a.exports.memory.buffer);I.set(i(h),w),I.set(i(l),T),a.exports.meshopt_computeClusterBounds(y,w,h.length,T,g,u);var S=f(y);return p(y-p(0)),S}return{ready:s,supported:!0,buildMeshlets:function(h,l,g,u,p,y){n(h.length%3==0),n(l instanceof Float32Array),n(l.length%g==0),n(g>=3),n(u<=256||u>0),n(p<=512),n(p%4==0),y=y||0;var w=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h);return b(w,l,l.length/g,g*4,u,p,y)},computeClusterBounds:function(h,l,g){n(h.length%3==0),n(h.length/3<=512),n(l instanceof Float32Array),n(l.length%g==0),n(g>=3);var u=h.BYTES_PER_ELEMENT==4?h:new Uint32Array(h);return x(u,l,l.length/g,g*4)},computeMeshletBounds:function(h,l,g){return n(h.meshletCount!=0),n(l instanceof Float32Array),n(l.length%g==0),n(g>=3),v(h,l,l.length/g,g*4)},extractMeshlet:function(h,l){return n(l>=0&&l<h.meshletCount),d(h,l)}}})();var Eh=new vi().registerExtensions([_r,Nr,Fr]).registerDependencies({"meshopt.decoder":jr});async function ma(t,e={}){await jr.ready;let a;if(e.fetchBytes)a=new Uint8Array(await e.fetchBytes(t));else{let c=await fetch(t,{cache:e.fetchCache||"no-store"});if(!c.ok)throw new Error(`Failed to load ${t}: ${c.status}`);a=new Uint8Array(await c.arrayBuffer())}let s=await Eh.readBinary(a),r=[],n=e.componentFeatures||new Map,i=new Map;function o(c,d=""){let b=n.has(c.getName());b&&i.set(c.getName(),(i.get(c.getName())||0)+1);let f=b?c.getName():d,v=c.getMesh();if(v){let x=c.getWorldMatrix();for(let h of v.listPrimitives()){let l=h.getAttribute("POSITION"),g=h.getAttribute("NORMAL"),u=h.getAttribute("_FEATURE_ID_0"),p=h.getAttribute("_FEATURE_ID_1"),y=h.getIndices()?.getArray();if(!l||!y)continue;let w=l.getCount(),T=new Float32Array(w*3),I=new Float32Array(w*3),S=new Uint32Array(w),R=new Uint32Array(w),_=[1/0,1/0,1/0,-1/0,-1/0,-1/0],A=[],C=n.get(f)?.featureId||e.defaultFeatureId||0;for(let j=0;j<w;j+=1)l.getElement(j,A),kh(T,j*3,A,x),_[0]=Math.min(_[0],T[j*3]),_[1]=Math.min(_[1],T[j*3+1]),_[2]=Math.min(_[2],T[j*3+2]),_[3]=Math.max(_[3],T[j*3]),_[4]=Math.max(_[4],T[j*3+1]),_[5]=Math.max(_[5],T[j*3+2]),g?(g.getElement(j,A),Th(I,j*3,A,x)):I.set([0,0,1],j*3),S[j]=Number(u?.getScalar(j)||0),R[j]=Number(p?p.getScalar(j)||0:C);let D=h.getMaterial();r.push({position:T,normal:I,netId:S,objectFeatureId:R,indices:y,designator:f,nodeName:c.getName(),meshName:v.getName(),bounds:_,material:D?{name:D.getName(),baseColor:D.getBaseColorFactor(),metallic:D.getMetallicFactor(),roughness:D.getRoughnessFactor(),emissive:D.getEmissiveFactor()}:{baseColor:e.baseColor||[.55,.58,.64,1],metallic:.05,roughness:.72,emissive:[0,0,0]}})}}for(let x of c.listChildren())o(x,f)}for(let c of s.getRoot().listScenes())for(let d of c.listChildren())o(d);return{byteLength:a.byteLength,primitives:r,componentNodeCounts:i}}function kh(t,e,a,s){let r=s[0]*a[0]+s[4]*a[1]+s[8]*a[2]+s[12],n=s[1]*a[0]+s[5]*a[1]+s[9]*a[2]+s[13],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2]+s[14];t[e]=r,t[e+1]=-i,t[e+2]=n}function Th(t,e,a,s){let r=s[0]*a[0]+s[4]*a[1]+s[8]*a[2],n=s[1]*a[0]+s[5]*a[1]+s[9]*a[2],i=s[2]*a[0]+s[6]*a[1]+s[10]*a[2],o=Math.hypot(r,n,i)||1;t[e]=r/o,t[e+1]=-i/o,t[e+2]=n/o}var ya=Object.freeze({mm:1,fineMm:.1,deg:15,fineDeg:1}),Br=Object.freeze([[1,0,0],[0,1,0],[0,0,1]]);function Xi(t){return Math.round(t*1e9)/1e9+0}function _t(t){let e=Math.hypot(...t.rotation)||1,a=t.rotation.map(r=>r/e),s=[a[3],a[0],a[1],a[2]].find(r=>Math.abs(r)>1e-12)??1;return{translationMm:t.translationMm.map(Xi),rotation:a.map(r=>Xi(s<0?-r:r))}}function Mh(t){let[e,a,s,r]=t.rotation,[n,i,o]=t.translationMm;return[1-2*(a*a+s*s),2*(e*a+s*r),2*(e*s-a*r),0,2*(e*a-s*r),1-2*(e*e+s*s),2*(a*s+e*r),0,2*(e*s+a*r),2*(a*s-e*r),1-2*(e*e+a*a),0,n,i,o,1]}function Wi(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Ih(t){let e=[t[0],t[4],t[8],0,t[1],t[5],t[9],0,t[2],t[6],t[10],0,0,0,0,1];for(let a=0;a<3;a+=1)e[12+a]=-(e[a]*t[12]+e[4+a]*t[13]+e[8+a]*t[14]);return e}function Cr(t,e){return e>0?Math.round(t/e)*e:t}function Ji(t,e){let a=e[0]**2+e[1]**2;return a<1e-9?0:(t[0]*e[0]+t[1]*e[1])/a}function Yi(t,e,a){let s=Math.atan2(e[1]-t[1],e[0]-t[0]),n=Math.atan2(a[1]-t[1],a[0]-t[0])-s;for(;n>Math.PI;)n-=2*Math.PI;for(;n<-Math.PI;)n+=2*Math.PI;return n}function $i(t,e,a){return ca(t,e)>=0?-a:a}function Qi(t){return Br.map(e=>dr(t.rotation,e))}function Zi(t,e,a){return{translationMm:t.translationMm.map((s,r)=>s+e[r]*a),rotation:[...t.rotation]}}function eo(t,e,a,s){let r=In(e,a),n=t.translationMm.map((o,c)=>o-s[c]);return{translationMm:dr(r,n).map((o,c)=>o+s[c]),rotation:za(r,t.rotation)}}function to(t,e){if(e==null)return null;let a=`/${String(e).split("/")[1]||""}`;return(t?.occurrences||[]).find(s=>s.path===a&&s.depth===1)??null}function ao(t,e,a){let s=t.occurrences.find(o=>o.path===e);if(!s||s.depth!==1)return t;let r=Mh(a),n=Wi(r,Ih(s.worldMatrix)),i=`${e}/`;return{...t,occurrences:t.occurrences.map(o=>o.path===e?{...o,pose:{..._t(a),source:"manual"},worldMatrix:r}:o.path.startsWith(i)?{...o,worldMatrix:Wi(n,o.worldMatrix)}:o)}}function so(t){let e=Math.abs(t[0])<.9?[1,0,0]:[0,1,0];return tt(lt(t,e))}var Sh=Object.freeze([0,1,1,0]),us=48,xa=`
struct Occurrence {
  model: mat4x4f,
  normal: mat4x4f,
  hiddenLayers: vec4u,
  explode: vec4f,
};
@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
@group(0) @binding(5) var<storage, read> occurrences: array<Occurrence>;
// The cull pass (SB2-25) lists the occurrences to draw, interleaved by level of
// detail: slot * 3 + list. Components draw for LIST_FULL; board, copper and
// barrels for LIST_BOARD (full or board); the stand-in box for LIST_BOX.
@group(0) @binding(7) var<storage, read> visibleOccurrences: array<u32>;
const LIST_FULL = 0u;
const LIST_BOARD = 1u;
const LIST_BOX = 2u;
fn listedOccurrence(list: u32, instance: u32) -> u32 { return visibleOccurrences[instance * 3u + list]; }
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
`,fs=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);function Rh(t){let e=t?.matrix??t;if(!e||typeof e.length!="number"||e.length!==16)throw new TypeError("An occurrence matrix must have 16 numbers (column-major)");let a=Array.from(e,Number);if(!a.every(Number.isFinite))throw new TypeError("An occurrence matrix must be finite");if(a[3]!==0||a[7]!==0||a[11]!==0||a[15]!==1)throw new TypeError("An occurrence matrix must be affine (last row 0 0 0 1)");return a}function Ah(t){let[e,a,s,,r,n,i,,o,c,d]=t,b=n*d-c*i,f=c*s-a*d,v=a*i-n*s,x=o*i-r*d,h=e*d-o*s,l=r*s-e*i,g=r*c-o*n,u=o*a-e*c,p=e*n-r*a,y=e*b+r*f+o*v;if(y===0)throw new TypeError("An occurrence matrix must be invertible");let w=y<0?-1:1;return[w*b,w*x,w*g,0,w*f,w*h,w*u,0,w*v,w*l,w*p,0,0,0,0,1]}function _h(t){let e=new Uint32Array(4);for(let a of t||[]){let s=Number(a);!Number.isInteger(s)||s<0||s>=128||(e[s>>>5]|=1<<(s&31)>>>0)}return e}function hs(t,e=[],a=[]){let s=new Float32Array(Math.max(1,t.length)*40),r=new Uint32Array(s.buffer);return t.forEach((n,i)=>{let o=i*40;s.set(n,o),s.set(Ah(n),o+16),e[i]&&r.set(_h(e[i]),o+32),s.set(a[i]||Sh,o+36)}),s}function ro(t){let e=new ArrayBuffer(Math.max(1,t.length)*us),a=new DataView(e);return t.forEach((s,r)=>{let n=r*us;a.setFloat32(n,s.centerMm[0]/1e3,!0),a.setFloat32(n+4,-s.centerMm[1]/1e3,!0),a.setFloat32(n+8,Math.min(s.drillWidthMm,s.drillHeightMm)/2e3,!0),a.setFloat32(n+12,Math.max(s.outerWidthMm,s.outerHeightMm)/2e3,!0),a.setFloat32(n+16,s.startZMm/1e3,!0),a.setFloat32(n+20,s.endZMm/1e3,!0),a.setUint32(n+32,s.netId||0,!0),a.setUint32(n+36,s.objectFeatureId||0,!0),a.setUint32(n+40,s.startLayerId||0,!0),a.setUint32(n+44,s.endLayerId||0,!0)}),e}function bs(t,e){let[a,s,r]=e;return[t[0]*a+t[4]*s+t[8]*r+t[12],t[1]*a+t[5]*s+t[9]*r+t[13],t[2]*a+t[6]*s+t[10]*r+t[14]]}function Kt(t,e){if(!e)return null;let a=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let s=0;s<8;s+=1){let r=bs(t,[e[s&1?3:0],e[s&2?4:1],e[s&4?5:2]]);for(let n=0;n<3;n+=1)a[n]=Math.min(a[n],r[n]),a[n+3]=Math.max(a[n+3],r[n])}return a}function no(t,e){if(!e||!t.length)return e||null;if(t.length===1&&va(t[0]))return e;let a=t.map(s=>Kt(s,e));return[0,1,2,3,4,5].map(s=>s<3?Math.min(...a.map(r=>r[s])):Math.max(...a.map(r=>r[s])))}function va(t){return t.every((e,a)=>e===fs[a])}var Nh=0,Or=4294901760,Fh=Or-1;function io(t,e){let a=t>>>0,s=e>>>0;return a===Nh?{kind:"none",occurrenceIndex:-1,featureId:0}:a>=Or?{kind:"gizmo",occurrenceIndex:-1,featureId:0,gizmoPart:a-Or,gizmoValue:s}:{kind:s?"feature":"board",occurrenceIndex:a-1,featureId:s}}function oo(t){let e=Array.from(t);if(e.length>Fh)throw new RangeError("Too many occurrences for the pick target");let a=e.map(Rh),s=o=>o&&!Array.isArray(o)&&!ArrayBuffer.isView(o),r=e.map((o,c)=>s(o)&&o.key!=null?String(o.key):String(c));if(new Set(r).size!==r.length)throw new TypeError("Occurrence keys must be unique");let n=e.map(o=>s(o)&&o.hiddenLayers?[...o.hiddenLayers].map(Number):[]),i=e.map(o=>s(o)&&o.explode?[...o.explode].map(Number):null);return{matrices:a,keys:r,hiddenLayers:n,explode:i}}function wa(t,e,a){let[s,r,n]=e,i=t[0]*s+t[4]*r+t[8]*n+t[12],o=t[1]*s+t[5]*r+t[9]*n+t[13],c=t[2]*s+t[6]*r+t[10]*n+t[14],d=t[3]*s+t[7]*r+t[11]*n+t[15];return!(d>0)||c<0||c>d?null:{x:a.x+(i/d*.5+.5)*a.width,y:a.y+(.5-o/d*.5)*a.height}}var co=0;var lo=2;var uo=Object.freeze({fullPx:140,boxPx:18,keep:.8});function fo(t){let e=c=>[t[c],t[4+c],t[8+c],t[12+c]],[a,s,r,n]=[e(0),e(1),e(2),e(3)],i=(c,d)=>c.map((b,f)=>b+d[f]),o=(c,d)=>c.map((b,f)=>b-d[f]);return[i(n,a),o(n,a),i(n,s),o(n,s),r,o(n,r)]}var Pr=`
fn featureHidden(id: u32) -> bool {
  return id < arrayLength(&hiddenMask) && hiddenMask[id] == 0u;
}
`;function ps(t){let e=new Set;if(t==null)return e;for(let a of t){let s=Number(a);!Number.isInteger(s)||s<=0||s>4294967295||e.add(s)}return e}function ho(t,e=0){let a=0;for(let n of ps(t))a=Math.max(a,n);let s=64,r=a+1;for(;s<r;)s*=2;return Math.max(s,Math.floor(e)||0)}function bo(t,e){let a=Math.max(64,Math.floor(e)||0),s=new Uint32Array(a);s.fill(1);for(let r of ps(t))r<a&&(s[r]=0);return s}var po=40,Ye=256,go=112,Nt="rg32uint",ea=Ye/4,Oh=256,Ph={compare:"always",passOp:"zero"},Dh={compare:"always",passOp:"replace"},Lh={compare:"not-equal",passOp:"keep"},Uh={compare:"equal",passOp:"keep"},xo=`
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
${Pr}
${ha}
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
`,vo=`
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
${Pr}
${ha}
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
`,wo=`
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
${ha}
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
`,Eo=`
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
${ha}
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
`;function Dr(t,e){return e.reduce((a,[s,r])=>{if(a.split(s).length!==2)throw new Error(`Shader variant anchor not found once: ${s.slice(0,60)}`);return a.replace(s,()=>r)},t)}var Lr=[`  padding0: u32,
  padding1: u32,`,`  selectedOccurrence: u32,
  occurrenceBase: u32,`],ms=[["  padding2: u32,","  emphasisStride: u32,"],["fn netEmphasized(id: u32) -> bool {",`${zn}fn netEmphasized(id: u32) -> bool {`]],ko="  let lit = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",To=`  let lit = emphasisOf(input.occurrence, input.netId) != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`,Mo=Dr(xo,[Lr,[`  @location(3) world: vec3f,
};`,`  @location(3) world: vec3f,
  @location(4) @interpolate(flat) occurrence: u32,
  // Mask and silkscreen opacity of this occurrence's own stackup separation (SB2-31f).
  @location(5) @interpolate(flat) fade: f32,
};`],[`@vertex fn vs(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.world = input.position + draw.offset.xyz;
  output.position = globals.viewProjection * vec4f(output.world, 1.0);
  output.normal = normalize(input.normal);`,`${xa}
@vertex fn vs(input: VertexInput, @builtin(instance_index) instance: u32) -> VertexOutput {
  // Full-detail draws (components; inner copper behind an opaque board) list only
  // occurrences at full detail (draw.material.w = 1); the rest list full or board.
  let index = listedOccurrence(select(LIST_BOARD, LIST_FULL, draw.material.w > 0.5), instance);
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
  let selectedComponent = here && component && globals.selectedFeature != 0u && input.objectId == globals.selectedFeature;`],...ms,["      base = vec3f(0.08, 1.0, 0.2) * pulse;","      base = emphasisColor(mark, vec3f(0.08, 1.0, 0.2)) * pulse;"],["  var alpha = draw.flags.y;","  var alpha = draw.flags.y * input.fade;"]]),Io=Dr(vo,[Lr,[`  @location(0) @interpolate(flat) objectId: u32,
};`,`  @location(0) @interpolate(flat) objectId: u32,
  @location(1) @interpolate(flat) occurrence: u32,
};`],[`@vertex fn vs(input: Input) -> Output {
  var output: Output;
  output.position = globals.viewProjection * vec4f(input.position + draw.offset.xyz, 1.0);`,`${xa}
@vertex fn vs(input: Input, @builtin(instance_index) instance: u32) -> Output {
  let index = listedOccurrence(select(LIST_BOARD, LIST_FULL, draw.material.w > 0.5), instance);
  let occurrence = occurrences[index];
  let lift = vec3f(0.0, 0.0, explodeLift(occurrence, draw.offset.w));
  let world = (occurrence.model * vec4f(input.position + draw.offset.xyz + lift, 1.0)).xyz;
  var output: Output;
  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.occurrence = index + 1u + globals.occurrenceBase;
  if (layerHiddenAt(occurrence, draw.offset.w) || explodeHides(occurrence, draw.flags.x, draw.offset.w)) {
    output.position = vec4f(0.0, 0.0, 2.0, 1.0);
  }`],["  return vec2u(1u, input.objectId);",`  let kind = u32(draw.flags.x);
  return vec2u(input.occurrence, select(input.objectId, 0u, kind == 0u));`],...ms,[ko,To]]),Kh=`struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
  @location(3) dimensions: vec4f,
  @location(4) span: vec2f,
  @location(5) ids: vec4u,
};`,Gh=`struct Barrel {
  dimensions: vec4f,
  span: vec2f,
  ids: vec4u,
};
@group(0) @binding(6) var<storage, read> barrels: array<Barrel>;
${xa}
struct Input {
  @location(0) unit: vec3f,
  @location(1) normal: vec3f,
  @location(2) radiusMix: f32,
};`;function So(t,e,a=[]){return Dr(t,[Lr,[`@group(0) @binding(2) var<storage, read> layerOffsets: array<f32>;
`,""],[Kh,Gh],["@vertex fn vs(input: Input) -> Output {",`struct Record {
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
  output.occurrence = index + 1u + globals.occurrenceBase;`],...a])}var Ro=So(wo,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.normal = input.normal;`,[[`  let z0 = input.span.x + layerOffsets[input.ids.z];
  let z1 = input.span.y + layerOffsets[input.ids.w];`,`  let z0 = input.span.x + layerOffsets[input.ids.z] * spread;
  let z1 = input.span.y + layerOffsets[input.ids.w] * spread;`],[`  output.normal = input.normal;
  output.netId`,`  output.normal = (occurrence.normal * vec4f(input.normal, 0.0)).xyz;
  output.netId`],[`  @location(3) @interpolate(flat) visible: u32,
};`,`  @location(3) @interpolate(flat) visible: u32,
  @location(4) @interpolate(flat) occurrence: u32,
};`],["  let selected = netEmphasized(input.netId) || (globals.activeNet != 0u && input.netId == globals.activeNet);",`  let mark = emphasisOf(input.occurrence, input.netId);
  let selected = mark != 0u
    || (input.occurrence == globals.selectedOccurrence && globals.activeNet != 0u && input.netId == globals.activeNet);`],...ms,["      base = vec3f(0.1, 1.0, 0.22) * (","      base = emphasisColor(mark, vec3f(0.1, 1.0, 0.22)) * ("]]),Ao=So(Eo,`  output.position = globals.viewProjection * vec4f(world, 1.0);
  output.objectId`,[["mix(input.span.x + layerOffsets[input.ids.z], input.span.y + layerOffsets[input.ids.w], input.unit.z)","mix(input.span.x + layerOffsets[input.ids.z] * spread, input.span.y + layerOffsets[input.ids.w] * spread, input.unit.z)"],[`  @location(1) @interpolate(flat) visible: u32,
};`,`  @location(1) @interpolate(flat) visible: u32,
  @location(2) @interpolate(flat) occurrence: u32,
};`],["  return vec2u(1u, input.objectId);","  return vec2u(input.occurrence, input.objectId);"],...ms,[ko,To]]),_o=`
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
${xa}
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
`,No=`${_o}
@fragment fn fs(input: Output) -> @location(0) vec4f {
  let light = normalize(globals.lightDirection.xyz);
  return vec4f(draw.color.rgb * (0.45 + max(dot(normalize(input.normal), light), 0.0) * 0.55), 1.0);
}
`,Fo=`${_o}
@fragment fn fs(input: Output) -> @location(0) vec2u {
  return vec2u(input.occurrence, 0u);
}
`,jo=`
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
`,mo=[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}],_x=Object.freeze({main:Mo,pick:Io,barrel:Ro,barrelPick:Ao,box:No,boxPick:Fo,cull:jo}),Gt=class t{static async create(e){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)throw new Error("No WebGPU adapter is available");let s=a.features.has("depth32float-stencil8"),r=await a.requestDevice(s?{requiredFeatures:["depth32float-stencil8"]}:void 0);return new t(e,r,{stencil:s})}constructor(e,a,{shareFrom:s=null,stencil:r=!1}={}){if(this.canvas=e,this.device=a,this.shareFrom=s,this.stencil=s?s.stencil:!!r,this.depthFormat=this.stencil?"depth32float-stencil8":"depth32float",this.version=0,this.barrelColor=[.55,.35,.16,.78],this.alwaysInstanced=!!s,this.occurrenceBase=0,s?(this.context=s.context,this.format=s.format):(a.addEventListener("uncapturederror",n=>{console.error(`Uncaptured WebGPU error: ${n.error?.message||n.error}`)}),a.lost.then(n=>{n.reason!=="destroyed"&&console.error(`WebGPU device lost: ${n.reason}`,n.message)}),this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"})),this.entries=[],this.barrels=null,this.drawSlotCapacity=Oh,this.drawSlotBuffer=this.createDrawSlotBuffer(this.drawSlotCapacity),this.drawStaging=new Float32Array(this.drawSlotCapacity*ea),this.freeDrawSlots=[],this.nextDrawSlot=0,this.globalBuffer=a.createBuffer({size:go,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.layerOffsetBuffer=a.createBuffer({size:1024,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.occurrenceMatrices=[[...fs]],this.occurrenceKeys=["0"],this.occurrenceHiddenLayers=[[]],this.occurrenceExplode=[null],this.identityOnly=!0,this.occurrenceCapacity=1,this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.device.queue.writeBuffer(this.occurrenceBuffer,0,hs(this.occurrenceMatrices)),this.barrelRecordBuffer=a.createBuffer({label:"barrel-records",size:us,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.instancedPipelines=null,this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.slotCapacity=0,this.slotArgs=new Uint32Array(0),this.slotClasses=new Uint32Array(0),this.freeSlots=[],this.nextSlot=2,this.argsBuffer=null,this.classesBuffer=null,this.growSlots(256),this.setSlot(0,0,4),this.setSlot(1,0,4),this.cull=null,this.box=null,this.boardBounds=null,this.selectedOccurrence=-1,this.lodOverride=null,this.lodThresholds={...uo},this.innerCopperAtFull=!0,this.cullCounts={full:0,board:0,box:0,culled:0},this.frameStats={triangles:0,draws:0},this.boxColor=[.24,.36,.28,1],s)for(let n of["bindGroupLayout","pipelineLayout","vertexBuffers","pipeline","pickPipeline","barrelPipeline","barrelPickPipeline","singlePipelines"])this[n]=s[n];else this.createSinglePipelines();this.depth=null,this.pickTexture=null,this.pickSerial=Promise.resolve(),this.bundleCache=new Map,this.globalScratch=new ArrayBuffer(go),this.globalScratchF32=new Float32Array(this.globalScratch),this.globalScratchView=new DataView(this.globalScratch),this.barrelDrawScratch=new Float32Array(Ye/4),this.nextEntryId=1,this.hiddenFeatureIds=new Set,this.showPlaceholders=!0,this.featureMaskCapacity=64,this.featureMaskBuffer=this.createFeatureMaskBuffer(this.featureMaskCapacity),this.uploadFeatureMask(),this.emphasizedNetIds=new Set,this.occurrenceEmphasis=null,this.emphasisStride=0,this.dimCopper=!1,this.netMaskCapacity=64,this.netMaskBuffer=this.createNetMaskBuffer(this.netMaskCapacity),this.uploadNetMask(),s&&this.setOccurrences([])}createSinglePipelines(){let e=this.device;this.bindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:5,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:6,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:7,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]});let a=e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]});this.pipelineLayout=a;let s=this.vertexBuffers=[{arrayStride:po,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"uint32"},{shaderLocation:3,offset:28,format:"uint32"},{shaderLocation:4,offset:32,format:"uint32"},{shaderLocation:5,offset:36,format:"uint32"}]}];this.singlePipelines={...this.makeMainPipelines(xo,""),pick:this.makePipeline(a,vo,Nt,s,"pick"),barrel:this.makeBarrelPipeline(a,wo,this.format,"barrel"),barrelPick:this.makeBarrelPipeline(a,Eo,Nt,"barrel-pick")},this.pipeline=this.singlePipelines.main,this.pickPipeline=this.singlePipelines.pick,this.barrelPipeline=this.singlePipelines.barrel,this.barrelPickPipeline=this.singlePipelines.barrelPick}makeMainPipelines(e,a){let s=this.pipelineLayout,r=this.vertexBuffers,n=(c,d)=>this.makePipeline(s,e,this.format,r,`${c}${a}`,d),i=n("main",{stencil:Ph}),o=n("main-blend");return{main:i,mark:this.stencil?n("main-mark",{stencil:Dh}):i,blend:o,mask:this.stencil?n("mask",{stencil:Lh}):o,maskCovered:this.stencil?n("mask-covered",{stencil:Uh,constants:{COVERED:1}}):null}}createOccurrenceBuffer(e){return this.device.createBuffer({label:"occurrences",size:e*160,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createListBuffer(e){return this.device.createBuffer({label:"visible-occurrences",size:e*3*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}growSlots(e){let a=new Uint32Array(e*5);a.set(this.slotArgs);let s=new Uint32Array(e).fill(4);s.set(this.slotClasses),this.slotArgs=a,this.slotClasses=s,this.slotCapacity=e,this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.(),this.argsBuffer=this.device.createBuffer({label:"indirect-args",size:a.byteLength,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.classesBuffer=this.device.createBuffer({label:"draw-classes",size:s.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.argsBuffer,0,a),this.device.queue.writeBuffer(this.classesBuffer,0,s),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache?.clear()}setSlot(e,a,s){this.slotArgs.fill(0,e*5,e*5+5),this.slotArgs[e*5]=a,this.slotClasses[e]=s,this.device.queue.writeBuffer(this.argsBuffer,e*20,this.slotArgs,e*5,5),this.device.queue.writeBuffer(this.classesBuffer,e*4,this.slotClasses,e,1)}allocSlot(e,a){let s=this.freeSlots.length?this.freeSlots.pop():this.nextSlot++;return s>=this.slotCapacity&&this.growSlots(this.slotCapacity*2),this.setSlot(s,e,a),s}get occurrenceCount(){return this.occurrenceMatrices.length}setOccurrences(e){let{matrices:a,keys:s,hiddenLayers:r,explode:n}=oo(e??[fs]);this.occurrenceMatrices=a,this.occurrenceKeys=s,this.occurrenceHiddenLayers=r,this.occurrenceExplode=n,this.identityOnly=!this.alwaysInstanced&&a.length===1&&va(a[0]),this.identityOnly||this.ensureInstancedPipelines(),a.length>this.occurrenceCapacity&&(this.occurrenceBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.occurrenceCapacity=Math.max(a.length,this.occurrenceCapacity*2),this.occurrenceBuffer=this.createOccurrenceBuffer(this.occurrenceCapacity),this.listBuffer=this.createListBuffer(this.occurrenceCapacity),this.cull&&(this.cull.lods.destroy(),this.cull.lods=this.createLodBuffer(this.occurrenceCapacity)),this.rebindAll()),a.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,hs(a,r,n)),this.cull&&this.device.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(3)),this.selectedOccurrence>=a.length&&(this.selectedOccurrence=-1),this.bundleCache.clear(),this.invalidate()}setOccurrenceHiddenLayers(e){this.occurrenceHiddenLayers=this.occurrenceMatrices.map((a,s)=>[...e?.[s]||[]].map(Number)),this.writeOccurrenceRecords()}setOccurrenceExplode(e){this.occurrenceExplode=this.occurrenceMatrices.map((a,s)=>e?.[s]?[...e[s]].map(Number):null),this.writeOccurrenceRecords()}writeOccurrenceRecords(){this.occurrenceMatrices.length&&this.device.queue.writeBuffer(this.occurrenceBuffer,0,hs(this.occurrenceMatrices,this.occurrenceHiddenLayers,this.occurrenceExplode)),this.invalidate()}setInnerCopperAtFull(e){if(this.innerCopperAtFull!==e){this.innerCopperAtFull=e;for(let a of this.entries)a.innerCopper&&(a.drawClass=e?1:0,this.setSlot(a.slot,a.indexCount,a.drawClass));this.invalidate()}}setBoardBounds(e){this.boardBounds=e?[...e]:null,this.invalidate()}setLodOverride(e){this.lodOverride=e==null?null:Number(e),this.invalidate()}createLodBuffer(e){return this.device.createBuffer({label:"occurrence-lods",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createCull(){let e=this.device,a=this.shareFrom?.cull,s=i=>({visibility:GPUShaderStage.COMPUTE,buffer:{type:i}}),r=a?.layout||e.createBindGroupLayout({label:"cull",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,...s("read-only-storage")},{binding:2,...s("storage")},{binding:3,...s("storage")},{binding:4,...s("storage")},{binding:5,...s("storage")},{binding:6,...s("read-only-storage")}]}),n=a&&{layout:r,classify:a.classify,writeArgs:a.writeArgs};if(!n){let i=this.createShaderModule(jo,"cull"),o=e.createPipelineLayout({bindGroupLayouts:[r]});n={layout:r,classify:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"classify"}}),writeArgs:e.createComputePipeline({layout:o,compute:{module:i,entryPoint:"writeArgs"}})}}this.cull={...n,uniform:e.createBuffer({label:"cull-params",size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),lods:this.createLodBuffer(this.occurrenceCapacity),counters:e.createBuffer({label:"cull-counters",size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),readback:e.createBuffer({label:"cull-readback",size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),scratch:new ArrayBuffer(192),reading:!1,readAt:0,bindGroup:null},e.queue.writeBuffer(this.cull.lods,0,new Uint32Array(this.occurrenceCapacity).fill(3)),this.cull.bindGroup=this.makeCullBindGroup()}makeCullBindGroup(){return this.device.createBindGroup({layout:this.cull.layout,entries:[{binding:0,resource:{buffer:this.cull.uniform}},{binding:1,resource:{buffer:this.occurrenceBuffer}},{binding:2,resource:{buffer:this.cull.lods}},{binding:3,resource:{buffer:this.listBuffer}},{binding:4,resource:{buffer:this.cull.counters}},{binding:5,resource:{buffer:this.argsBuffer}},{binding:6,resource:{buffer:this.classesBuffer}}]})}createBox(){let e=[[[1,0,0],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[[-1,0,0],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],[[0,1,0],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[[0,0,1],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],[[0,0,-1],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]],a=[],s=[];e.forEach(([d,b],f)=>{for(let x of b)a.push(...x,...d);let v=f*4;s.push(v,v+1,v+2,v,v+2,v+3)});let r=new Float32Array(a),n=new Uint16Array(s),i=this.device.createBuffer({label:"box-vertices",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),o=this.device.createBuffer({label:"box-indices",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(i,0,r),this.device.queue.writeBuffer(o,0,n);let c=this.device.createBuffer({size:Ye,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.box={vertexBuffer:i,indexBuffer:o,indexCount:n.length,drawBuffer:c,bindGroup:this.makeBindGroup(c),scratch:new Float32Array(Ye/4)},this.setSlot(1,n.length,3)}writeBoxDraw(){let e=this.box.scratch,[a,s,r,n,i,o]=this.boardBounds;e.fill(0),e.set(this.boxColor,0),e.set([n-a,i-s,o-r,0],4),e.set([a,s,r,0],8),this.device.queue.writeBuffer(this.box.drawBuffer,0,e)}encodeCull(e,a){let s=this.cull,r=new Float32Array(s.scratch),n=new Uint32Array(s.scratch);r.fill(0),fo(a.matrix).forEach((h,l)=>r.set(h,l*4));let i=a.lod;i&&r.set([...i.eye,i.orthographic?0:1],24);let o=this.boardBounds||[-1e6,-1e6,-1e6,1e6,1e6,1e6];r.set([o[0],o[1],o[2],0,o[3],o[4],o[5],0],28);let{fullPx:c,boxPx:d,keep:b}=this.lodThresholds;r.set([i?.pixelScale||0,c,d,b],36);let f=this.lodOverride!=null?this.lodOverride+1:!i||!this.boardBounds?co+1:0;n.set([this.occurrenceMatrices.length,this.selectedOccurrence+1,f,this.nextSlot],40),n[44]=this.barrels?.instanceCount||0,this.device.queue.writeBuffer(s.uniform,0,s.scratch),e.clearBuffer(s.counters);let v=e.beginComputePass({label:"cull"});v.setBindGroup(0,s.bindGroup),v.setPipeline(s.classify),v.dispatchWorkgroups(Math.ceil(this.occurrenceMatrices.length/64)),v.setPipeline(s.writeArgs),v.dispatchWorkgroups(Math.ceil(this.nextSlot/64)),v.end();let x=performance.now();return!s.reading&&x-s.readAt>250?(e.copyBufferToBuffer(s.counters,0,s.readback,0,16),s.readAt=x,!0):!1}readCullCounts(){let e=this.cull;e.reading=!0;let a=this.occurrenceMatrices.length;e.readback.mapAsync(GPUMapMode.READ).then(()=>{let[s,r,n]=new Uint32Array(e.readback.getMappedRange().slice(0));e.readback.unmap(),this.cullCounts={full:s,board:r-s,box:n,culled:Math.max(0,a-r-n)}}).catch(()=>{}).finally(()=>{e.reading=!1})}countFor(e){if(this.identityOnly)return e===2?this.barrels?.instanceCount||0:e===3?0:1;let{full:a,board:s,box:r}=this.cullCounts;return e===0?a+s:e===1?a:e===2?(a+s)*(this.barrels?.instanceCount||0):r}gpuMemoryBytes(){let e=0;for(let a of this.entries)e+=(a.vertexBuffer?.size||0)+(a.indexBuffer?.size||0);for(let a of[this.barrels?.vertexBuffer,this.barrels?.indexBuffer,this.barrels?.instanceBuffer,this.barrelRecordBuffer,this.occurrenceBuffer,this.listBuffer,this.argsBuffer,this.classesBuffer,this.featureMaskBuffer,this.netMaskBuffer,this.cull?.lods])e+=a?.size||0;return e+=this.canvas.width*this.canvas.height*12,e}ensureInstancedPipelines(){if(this.instancedPipelines)return;if(this.shareFrom){this.shareFrom.ensureInstancedPipelines(),this.instancedPipelines=this.shareFrom.instancedPipelines,this.createBox(),this.createCull();return}let e=this.pipelineLayout;this.instancedPipelines={...this.makeMainPipelines(Mo,"-instanced"),pick:this.makePipeline(e,Io,Nt,this.vertexBuffers,"pick-instanced"),barrel:this.makeBarrelPipeline(e,Ro,this.format,"barrel-instanced",!1),barrelPick:this.makeBarrelPipeline(e,Ao,Nt,"barrel-pick-instanced",!1),box:this.makePipeline(e,No,this.format,mo,"box"),boxPick:this.makePipeline(e,Fo,Nt,mo,"box-pick")},this.createBox(),this.createCull()}drawSet(){return this.identityOnly?{pipelines:this.singlePipelines,indirect:!1,barrelInstances:this.barrels?.instanceCount||0}:{pipelines:this.instancedPipelines,indirect:!0,barrelInstances:0}}drawEntry(e,a,s){e.setBindGroup(0,a.bindGroup),e.setVertexBuffer(0,a.vertexBuffer),e.setIndexBuffer(a.indexBuffer,"uint32"),s?e.drawIndexedIndirect(this.argsBuffer,a.slot*20):e.drawIndexed(a.indexCount)}drawBarrels(e,a,s,r){e.setPipeline(a),e.setBindGroup(0,this.barrels.bindGroup),e.setVertexBuffer(0,this.barrels.vertexBuffer),e.setVertexBuffer(1,this.barrels.instanceBuffer),e.setIndexBuffer(this.barrels.indexBuffer,"uint16"),s?e.drawIndexedIndirect(this.argsBuffer,0):e.drawIndexed(this.barrels.indexCount,r)}drawBox(e,a){!this.box||!this.boardBounds||(this.writeBoxDraw(),e.setPipeline(a),e.setBindGroup(0,this.box.bindGroup),e.setVertexBuffer(0,this.box.vertexBuffer),e.setIndexBuffer(this.box.indexBuffer,"uint16"),e.drawIndexedIndirect(this.argsBuffer,20))}createNetMaskBuffer(e){return this.device.createBuffer({label:"net-emphasis-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}uploadNetMask(){let e;if(this.occurrenceEmphasis&&!this.identityOnly){let s=Hn(this.occurrenceEmphasis);this.emphasisStride=s.stride,e=s.data}else this.emphasisStride=0,e=Kn(this.emphasizedNetIds,this.netMaskCapacity);if(e.length>this.netMaskCapacity){this.netMaskBuffer?.destroy?.();let s=this.netMaskCapacity;for(;s<e.length;)s*=2;this.netMaskCapacity=s,this.netMaskBuffer=this.createNetMaskBuffer(s),this.rebindAll()}let a=new Uint32Array(this.netMaskCapacity);a.set(e),this.device.queue.writeBuffer(this.netMaskBuffer,0,a)}setOccurrenceEmphasis(e,{dimCopper:a=!1}={}){let s=Array.isArray(e)&&e.some(r=>r&&r.size);this.occurrenceEmphasis=s?e.map(r=>r&&r.size?new Map(r):null):null,this.dimCopper=!!a,this.uploadNetMask(),this.invalidate()}get netHighlightActive(){return!!(this.emphasizedNetIds.size||this.occurrenceEmphasis||this.dimCopper)}setEmphasizedNetIds(e){this.emphasizedNetIds=Ja(e),this.occurrenceEmphasis=null;let a=Un(this.emphasizedNetIds,this.netMaskCapacity);a!==this.netMaskCapacity&&(this.netMaskBuffer?.destroy?.(),this.netMaskCapacity=a,this.netMaskBuffer=this.createNetMaskBuffer(a),this.rebindAll()),this.uploadNetMask(),this.invalidate()}rebindAll(){for(let e of this.entries)e.bindGroup=this.makeBindGroup(this.drawSlotBuffer,e.drawSlot*Ye);this.barrels&&(this.barrels.bindGroup=this.makeBindGroup(this.barrels.drawBuffer)),this.box&&(this.box.bindGroup=this.makeBindGroup(this.box.drawBuffer)),this.cull&&(this.cull.bindGroup=this.makeCullBindGroup()),this.bundleCache.clear()}createFeatureMaskBuffer(e){return this.device.createBuffer({label:"feature-visibility-mask",size:e*Uint32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}createDrawSlotBuffer(e){return this.device.createBuffer({label:"draw-uniforms",size:e*Ye,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}allocateDrawSlot(){if(this.freeDrawSlots.length)return this.freeDrawSlots.pop();if(this.nextDrawSlot>=this.drawSlotCapacity){let e=this.drawSlotCapacity*2,a=new Float32Array(e*ea);a.set(this.drawStaging),this.drawSlotBuffer.destroy?.(),this.drawSlotCapacity=e,this.drawSlotBuffer=this.createDrawSlotBuffer(e),this.drawStaging=a,this.rebindAll()}return this.nextDrawSlot++}flushDraws(e){if(!e.length)return;let a=1/0,s=-1;for(let r of e)a=Math.min(a,r.drawSlot),s=Math.max(s,r.drawSlot);this.device.queue.writeBuffer(this.drawSlotBuffer,a*Ye,this.drawStaging,a*ea,(s-a+1)*ea)}invalidate(){this.version+=1}setBarrelColor(e){this.barrelColor=[...e],this.invalidate()}makeBindGroup(e,a=0){return this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e,offset:a,size:Ye}},{binding:2,resource:{buffer:this.layerOffsetBuffer}},{binding:3,resource:{buffer:this.featureMaskBuffer}},{binding:4,resource:{buffer:this.netMaskBuffer}},{binding:5,resource:{buffer:this.occurrenceBuffer}},{binding:6,resource:{buffer:this.barrelRecordBuffer}},{binding:7,resource:{buffer:this.listBuffer}}]})}uploadFeatureMask(){let e=bo(this.hiddenFeatureIds,this.featureMaskCapacity);this.device.queue.writeBuffer(this.featureMaskBuffer,0,e)}setHiddenFeatureIds(e){this.hiddenFeatureIds=ps(e);let a=ho(this.hiddenFeatureIds,this.featureMaskCapacity);a!==this.featureMaskCapacity&&(this.featureMaskBuffer?.destroy?.(),this.featureMaskCapacity=a,this.featureMaskBuffer=this.createFeatureMaskBuffer(a),this.rebindAll()),this.uploadFeatureMask(),this.bundleCache.clear(),this.invalidate()}depthStencilState(e=null){let a={format:this.depthFormat,depthWriteEnabled:!0,depthCompare:"greater"};return this.stencil&&e&&(a.stencilFront=e,a.stencilBack=e),a}makePipeline(e,a,s,r,n,i={}){let o=this.createShaderModule(a,n);return this.device.createRenderPipeline({layout:e,vertex:{module:o,entryPoint:"vs",buffers:r},fragment:{module:o,entryPoint:"fs",...i.constants?{constants:i.constants}:{},targets:[{format:s,blend:s===Nt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState(i.stencil),multisample:{count:1}})}makeBarrelPipeline(e,a,s,r,n=!0){let i=this.createShaderModule(a,r);return this.device.createRenderPipeline({layout:e,vertex:{module:i,entryPoint:"vs",buffers:[{arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32"}]},...n?[{arrayStride:40,stepMode:"instance",attributes:[{shaderLocation:3,offset:0,format:"float32x4"},{shaderLocation:4,offset:16,format:"float32x2"},{shaderLocation:5,offset:24,format:"uint32x4"}]}]:[]]},fragment:{module:i,entryPoint:"fs",targets:[{format:s,blend:s===Nt?void 0:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:this.depthStencilState()})}createShaderModule(e,a){let s=this.device.createShaderModule({label:`pcb-${a}`,code:e});return typeof s.getCompilationInfo=="function"&&s.getCompilationInfo().then(r=>{let n=[...r.messages||[]];if(n.length){console.groupCollapsed(`WebGPU shader compilation info: pcb-${a}`);for(let i of n)console[i.type==="error"?"error":"warn"](`${i.type} ${i.lineNum}:${i.linePos} ${i.message}`);console.groupEnd()}}),s}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));this.canvas.width===a&&this.canvas.height===s||(this.canvas.width=a,this.canvas.height=s,this.depth?.destroy(),this.pickTexture?.destroy(),this.depth=this.device.createTexture({size:[a,s],format:this.depthFormat,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.pickTexture=this.device.createTexture({size:[a,s],format:Nt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}))}addPrimitive(e,a){let s=e.position.length/3,r=new ArrayBuffer(s*po),n=new Float32Array(r),i=new Uint32Array(r);for(let h=0;h<s;h+=1){let l=h*10,g=h*3;n[l]=e.position[g],n[l+1]=e.position[g+1],n[l+2]=e.position[g+2],n[l+3]=e.normal[g],n[l+4]=e.normal[g+1],n[l+5]=e.normal[g+2],i[l+6]=e.netId[h]||0,i[l+7]=e.objectFeatureId[h]||0,i[l+8]=a.layerId||0,i[l+9]=a.materialId||0}let o=this.device.createBuffer({size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(o,0,r);let c=e.indices instanceof Uint32Array?e.indices:new Uint32Array(e.indices),d=this.device.createBuffer({size:c.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,c);let b=this.allocateDrawSlot(),f=this.makeBindGroup(this.drawSlotBuffer,b*Ye),v=a.kind==="component"||a.innerCopper&&this.innerCopperAtFull?1:0,x={...a,drawClass:v,slot:this.allocSlot(c.length,v),bounds:e.bounds||a.bounds||null,id:this.nextEntryId++,vertexBuffer:o,indexBuffer:d,indexCount:c.length,drawSlot:b,bindGroup:f};return this.entries.push(x),this.bundleCache.clear(),this.invalidate(),x}removeEntries(e){if(!e?.length)return;let a=new Set(e.map(s=>s.id));for(let s of e)s.vertexBuffer?.destroy?.(),s.indexBuffer?.destroy?.(),this.freeDrawSlots.push(s.drawSlot),s.slot!=null&&(this.setSlot(s.slot,0,4),this.freeSlots.push(s.slot));this.entries=this.entries.filter(s=>!a.has(s.id)),this.bundleCache.clear(),this.invalidate()}dispose(){this.removeEntries(this.entries),this.barrels&&(this.barrels.vertexBuffer?.destroy?.(),this.barrels.indexBuffer?.destroy?.(),this.barrels.instanceBuffer?.destroy?.(),this.barrels.drawBuffer?.destroy?.(),this.barrels=null),this.depth?.destroy(),this.pickTexture?.destroy(),this.featureMaskBuffer?.destroy?.(),this.occurrenceBuffer?.destroy?.(),this.barrelRecordBuffer?.destroy?.(),this.listBuffer?.destroy?.(),this.argsBuffer?.destroy?.(),this.classesBuffer?.destroy?.();for(let e of[this.box?.vertexBuffer,this.box?.indexBuffer,this.box?.drawBuffer,this.cull?.uniform,this.cull?.lods,this.cull?.counters,this.cull?.readback])e?.destroy?.();this.box=null,this.cull=null,this.drawSlotBuffer?.destroy?.(),this.depth=null,this.pickTexture=null,this.featureMaskBuffer=null,this.bundleCache.clear()}setBarrels(e){if(!e?.length)return;let a=20,s=[],r=[];for(let h of[0,1]){let l=s.length/7;for(let g=0;g<a;g+=1){let u=Math.PI*2*g/a,p=Math.cos(u),y=Math.sin(u);for(let w of[0,1])s.push(p,y,w,h?-p:p,h?-y:y,0,h)}for(let g=0;g<a;g+=1){let u=(g+1)%a,p=l+g*2,y=l+u*2;r.push(p,y,y+1,p,y+1,p+1)}}let n=new Float32Array(s),i=new Uint16Array(r),o=new ArrayBuffer(e.length*40),c=new DataView(o);e.forEach((h,l)=>{let g=l*40;c.setFloat32(g,h.centerMm[0]/1e3,!0),c.setFloat32(g+4,-h.centerMm[1]/1e3,!0),c.setFloat32(g+8,Math.min(h.drillWidthMm,h.drillHeightMm)/2e3,!0),c.setFloat32(g+12,Math.max(h.outerWidthMm,h.outerHeightMm)/2e3,!0),c.setFloat32(g+16,h.startZMm/1e3,!0),c.setFloat32(g+20,h.endZMm/1e3,!0),c.setUint32(g+24,h.netId||0,!0),c.setUint32(g+28,h.objectFeatureId||0,!0),c.setUint32(g+32,h.startLayerId||0,!0),c.setUint32(g+36,h.endLayerId||0,!0)});let d=this.device.createBuffer({size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),b=this.device.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),f=this.device.createBuffer({size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(d,0,n),this.device.queue.writeBuffer(b,0,i),this.device.queue.writeBuffer(f,0,o);let v=ro(e);this.barrelRecordBuffer?.destroy?.(),this.barrelRecordBuffer=this.device.createBuffer({label:"barrel-records",size:v.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.barrelRecordBuffer,0,v);let x=this.device.createBuffer({size:Ye,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.barrels={records:e,vertexBuffer:d,indexBuffer:b,instanceBuffer:f,indexCount:i.length,instanceCount:e.length,drawBuffer:x,bindGroup:null},this.setSlot(0,i.length,2),this.rebindAll(),this.invalidate()}render(e){let{panels:a,layerOffsets:s}=e;this.resize(),this.device.queue.writeBuffer(this.layerOffsetBuffer,0,s);let r=this.context.getCurrentTexture().createView(),n=0,i=0;a.forEach((o,c)=>{let d=this.device.createCommandEncoder(),b=!this.identityOnly&&this.encodeCull(d,o),f=d.beginRenderPass({colorAttachments:[{view:r,clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:c===0?"clear":"load",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),v=yo(o.viewport,this.canvas.width,this.canvas.height);f.setViewport(v.x,v.y,v.width,v.height,0,1),f.setScissorRect(v.x,v.y,v.width,v.height);let x=this.encodeDraws(f,o,e);n+=x.triangles,i+=x.draws,f.end(),this.device.queue.submit([d.finish()]),b&&this.readCullCounts()}),this.frameStats={triangles:Math.round(n),draws:i}}encodeDraws(e,a,{activeNetId:s,selectedFeatureId:r,time:n,visibleLayers:i,showBoard:o,showComponents:c,showPaste:d=!0,componentOpacity:b,boardOpacity:f,isolateNet:v,compareMode:x=!1,compareOffsets:h=new Map,layerAlphas:l=null,visibleTileIds:g=null}){let u=0,p=0;this.stencil&&e.setStencilReference(1),this.writeGlobals(a.matrix,s,a.layerId,n,r);let{pipelines:y,indirect:w,barrelInstances:T}=this.drawSet(),I=!d||!!(s||this.netHighlightActive),S=this.entries.filter(A=>this.visible(A,a.layerId,i,o,c,b,x,g)&&!(I&&A.boardRole==="paste")),R=S.filter(A=>!gs(A)).sort((A,C)=>+!!A.stencilMark-+!!C.stencilMark),_=S.filter(A=>gs(A)).sort((A,C)=>gs(A)-gs(C));for(let A of S)this.writeDraw(A,s,b,f,v,x,h.get(A.layerId),l?.get(A.layerId)??1);this.flushDraws(S),R.length>64?e.executeBundles([this.renderBundle(R,a.layerId)]):this.drawEntries(e,R,y,w);for(let A of S)u+=A.indexCount/3*this.countFor(A.drawClass);return p+=S.length,!x&&this.barrels&&(a.layerId===0||i.has(a.layerId))&&(this.writeBarrelDraw(v),this.drawBarrels(e,y.barrel,w,T),u+=this.barrels.indexCount/3*this.countFor(2),p+=1),w&&!x&&(this.drawBox(e,y.box),u+=12*this.countFor(3),p+=1),this.drawBlended(e,_,y,w),{triangles:u,draws:p}}depthAttachment(){let e={view:this.depth.createView(),depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"store"};return this.stencil&&Object.assign(e,{stencilClearValue:0,stencilLoadOp:"clear",stencilStoreOp:"discard"}),e}drawEntries(e,a,s,r){let n=null;for(let i of a){let o=i.stencilMark?s.mark:s.main;o!==n&&(e.setPipeline(o),n=o),this.drawEntry(e,i,r)}}drawBlended(e,a,s,r){for(let n of a)n.boardRole==="soldermask"&&n.kind==="board"?(e.setPipeline(s.mask),this.drawEntry(e,n,r),s.maskCovered&&(e.setPipeline(s.maskCovered),this.drawEntry(e,n,r))):(e.setPipeline(s.blend),this.drawEntry(e,n,r))}setPlaceholdersVisible(e){this.showPlaceholders=!!e,this.invalidate()}visible(e,a,s,r,n,i,o=!1,c=null){return e.placeholder&&!this.showPlaceholders||e.kind==="board"&&e.boardRole==="pad"||!o&&e.kind==="copper"&&c&&!c.has(e.tileId)?!1:o?e.kind==="copper"&&s.has(e.layerId):e.boardRole==="paste"?a===0&&s.has(e.layerId):e.kind==="board"?a===0&&r:e.kind==="component"?a===0&&n&&i>.001:a?e.layerId===a:s.has(e.layerId)}writeGlobals(e,a,s,r,n=0){let i=this.globalScratch,o=this.globalScratchF32;o.fill(0),o.set(e,0);let c=this.globalScratchView;c.setUint32(64,a||0,!0),c.setUint32(68,s||0,!0),c.setFloat32(72,r,!0),c.setFloat32(76,a||this.netHighlightActive?1:0,!0),c.setUint32(80,n||0,!0),c.setUint32(84,this.selectedOccurrence>=0?this.selectedOccurrence+1+this.occurrenceBase:0,!0),c.setUint32(88,this.occurrenceBase,!0),c.setUint32(92,this.emphasisStride,!0),o.set([.35,-.5,.8,0],24),this.device.queue.writeBuffer(this.globalBuffer,0,i)}writeDraw(e,a,s,r=1,n=!1,i=!1,o=null,c=1){let d=this.drawStaging.subarray(e.drawSlot*ea,(e.drawSlot+1)*ea);d.fill(0);let b=e.color||e.material.baseColor;d.set(b,0),d.set([e.material.metallic||0,e.material.roughness??.72,e.opacityScale!=null?s:0,e.drawClass===1?1:0],4);let f=Vh(e);d.set([o?.[0]||0,o?.[1]||0,(i?-(e.baseZ||0):e.layerOffset||0)+f,e.kind==="copper"||e.boardRole==="paste"?Number(e.layerId||0)+1:0],8);let v=Number.isFinite(b?.[3])?b[3]:1,x=e.kind==="component"?s*(e.opacityScale??1):e.kind==="board"&&e.boardRole!=="paste"?r*zh(e,v):c,h=e.kind==="copper"?1:e.kind==="component"?2:0;d.set([h,x,n?1:0,i?1:0],12)}writeBarrelDraw(e=!1){let a=this.barrelDrawScratch;a.fill(0),a.set(this.barrelColor,0),a.set([.75,.32,0,0],4),a.set([1,1,e?1:0,0],12),this.device.queue.writeBuffer(this.barrels.drawBuffer,0,a)}renderBundle(e,a){let{pipelines:s,indirect:r}=this.drawSet(),n=`${a}:${r?"indirect":"single"}:${e.map(d=>d.id).join(",")}`,i=this.bundleCache.get(n);if(i)return i;let o=this.device.createRenderBundleEncoder({colorFormats:[this.format],depthStencilFormat:this.depthFormat});this.drawEntries(o,e,s,r);let c=o.finish();return this.bundleCache.set(n,c),this.bundleCache.size>32&&this.bundleCache.delete(this.bundleCache.keys().next().value),c}pick(e,a,s,r){let n=this.pickSerial.then(()=>this.performPick(e,a,s,r));return this.pickSerial=n.catch(()=>0),n}async performPick(e,a,s,r){this.resize();let n=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),i=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s)));this.device.queue.writeBuffer(this.layerOffsetBuffer,0,r.layerOffsets);let o=this.device.createCommandEncoder(),c=o.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:this.depthAttachment()}),d=yo(e.viewport,this.canvas.width,this.canvas.height);return c.setViewport(d.x,d.y,d.width,d.height,0,1),c.setScissorRect(d.x,d.y,d.width,d.height),this.encodePick(c,e,r),c.end(),this.readPick(o,n,i)}encodePick(e,a,s){this.writeGlobals(a.matrix,s.activeNetId,a.layerId,performance.now()/1e3,s.selectedFeatureId);let{pipelines:r,indirect:n,barrelInstances:i}=this.drawSet();e.setPipeline(r.pick);let o=[];for(let c of this.entries)this.visible(c,a.layerId,s.visibleLayers,s.showBoard,s.showComponents,s.componentOpacity,s.compareMode,s.visibleTileIds)&&(c.kind==="board"&&(this.identityOnly||c.boardRole!=="substrate")||(this.writeDraw(c,s.activeNetId,s.componentOpacity,s.boardOpacity,s.isolateNet,s.compareMode,s.compareOffsets?.get(c.layerId)),o.push(c)));this.flushDraws(o);for(let c of o)this.drawEntry(e,c,n);!s.compareMode&&this.barrels&&(this.writeBarrelDraw(s.isolateNet),this.drawBarrels(e,r.barrelPick,n,i)),n&&!s.compareMode&&this.drawBox(e,r.boxPick)}async readPick(e,a,s){let r=this.device.createBuffer({label:"pick-readback",size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});e.copyTextureToBuffer({texture:this.pickTexture,origin:{x:a,y:s}},{buffer:r,bytesPerRow:256},{width:1,height:1}),this.device.queue.submit([e.finish()]);try{await r.mapAsync(GPUMapMode.READ);let n=new DataView(r.getMappedRange()),i=io(n.getUint32(0,!0),n.getUint32(4,!0));return r.unmap(),{...i,occurrenceKey:i.occurrenceIndex>=0?this.occurrenceKeys[i.occurrenceIndex]??null:null}}finally{r.mapState==="mapped"&&r.unmap(),r.destroy()}}};function gs(t){return t.translucent?3:t.kind!=="board"?0:t.boardRole==="soldermask"?1:t.boardRole==="silkscreen"?2:0}function zh(t,e){return t.kind!=="board"||t.boardRole==="substrate"?1:t.boardRole==="soldermask"?Math.min(e,.72):t.boardRole==="silkscreen"?Math.min(e,.92):e}function Vh(t){if(t.kind!=="board"||t.boardRole!=="soldermask"&&t.boardRole!=="silkscreen")return 0;let e=t.bounds,s=(e?(e[2]+e[5])*.5:0)<0?-1:1,r=t.boardRole==="silkscreen"?35e-6:18e-6;return s*r}function yo(t,e,a){let s=Math.max(0,Math.min(e-1,Math.floor(t.x))),r=Math.max(0,Math.min(a-1,Math.floor(t.y)));return{x:s,y:r,width:Math.max(1,Math.min(e-s,Math.floor(t.width))),height:Math.max(1,Math.min(a-r,Math.floor(t.height)))}}var Hh=[0,0,0,1,1,1],ys=class t{static async create(e){return new t(await Gt.create(e))}constructor(e){this.host=e,this.canvas=e.canvas,this.device=e.device,e.alwaysInstanced=!0,e.setOccurrences([]),this.assets=new Map,this.order=[],this.frameStats={triangles:0,draws:0}}asset(e){let a=this.assets.get(e);return a||(a=new Gt(this.canvas,this.device,{shareFrom:this.host}),this.assets.set(e,a)),a}standIn(e,a){let s=this.asset(e);return s.standIn||(s.standIn=!0,s.setBoardBounds(Hh),s.setLodOverride(lo)),s.boxColor=[...a],s}removeAsset(e){let a=this.assets.get(e);a&&(a.dispose(),this.assets.delete(e))}get renderers(){return this.order.map(e=>this.assets.get(e)).filter(Boolean)}setOccurrences(e){this.order=[...e.keys()].filter(s=>this.assets.has(s));for(let[s,r]of this.assets)e.has(s)||r.setOccurrences([]);for(let s of this.order)this.assets.get(s).setOccurrences(e.get(s));let a=0;for(let s of this.renderers)s.occurrenceBase=a,a+=s.occurrenceCount;this.occurrenceCount=a}locate(e){for(let a of this.renderers){let s=e-a.occurrenceBase;if(s>=0&&s<a.occurrenceCount)return{renderer:a,local:s}}return null}keyOf(e){let a=this.locate(e);return a?a.renderer.occurrenceKeys[a.local]??null:null}setSelectedOccurrence(e){let a=e>=0?this.locate(e):null;for(let s of this.renderers)s.selectedOccurrence=!s.standIn&&a?.renderer===s?a.local:-1}resize(){this.host.resize()}render(e,a){let s=this.host;s.resize();let r=this.renderers.filter(f=>f.occurrenceCount>0),n=new Map(r.map(f=>[f,a(f)]));for(let[f,v]of n)Bo(f,v);let i=this.device.createCommandEncoder(),o=r.filter(f=>f.encodeCull(i,e)),c=i.beginRenderPass({colorAttachments:[{view:s.context.getCurrentTexture().createView(),clearValue:{r:.91,g:.93,b:.94,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:s.depthAttachment()});Co(c,e.viewport,this.canvas);let d=0,b=0;for(let f of r){let v=f.encodeDraws(c,e,n.get(f));d+=v.triangles,b+=v.draws}c.end(),this.device.queue.submit([i.finish()]);for(let f of o)f.readCullCounts();this.frameStats={triangles:Math.round(d),draws:b}}pick(e,a,s,r){let n=this.host.pickSerial.then(()=>this.performPick(e,a,s,r));return this.host.pickSerial=n.catch(()=>0),n}async performPick(e,a,s,r){let n=this.host;n.resize();let i=Math.max(0,Math.min(this.canvas.width-1,Math.floor(a))),o=Math.max(0,Math.min(this.canvas.height-1,Math.floor(s))),c=this.device.createCommandEncoder(),d=c.beginRenderPass({colorAttachments:[{view:n.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:n.depthAttachment()});Co(d,e.viewport,this.canvas);for(let v of this.renderers){if(v.occurrenceCount===0)continue;let x=r(v);Bo(v,x),v.encodePick(d,e,x)}d.end();let b=await n.readPick(c,i,o),f=b.occurrenceIndex>=0?this.locate(b.occurrenceIndex):null;return{...b,occurrenceKey:f?f.renderer.occurrenceKeys[f.local]??null:null,renderer:f?.renderer||null,standIn:!!f?.renderer?.standIn}}gpuMemoryBytes(){let e=0;for(let a of this.renderers)e+=a.gpuMemoryBytes();return e-Math.max(0,this.renderers.length-1)*this.canvas.width*this.canvas.height*12}cullCounts(){let e={full:0,board:0,box:0,culled:0};for(let a of this.renderers)if(a.occurrenceCount)for(let s of Object.keys(e))e[s]+=a.cullCounts[s]||0;return e}dispose(){for(let e of[...this.assets.keys()])this.removeAsset(e);this.host.dispose(),this.host.context?.unconfigure?.(),this.device.destroy?.()}};function Bo(t,e){e?.layerOffsets&&t.device.queue.writeBuffer(t.layerOffsetBuffer,0,e.layerOffsets)}function Co(t,e,a){let s=Math.max(0,Math.min(a.width-1,Math.floor(e.x))),r=Math.max(0,Math.min(a.height-1,Math.floor(e.y))),n=Math.max(1,Math.min(a.width-s,Math.floor(e.width))),i=Math.max(1,Math.min(a.height-r,Math.floor(e.height)));t.setViewport(s,r,n,i,0,1),t.setScissorRect(s,r,n,i)}var qh=`
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
}`,Xh=`
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
}`,Wh=`
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
}`,Jh=`
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
}`,Yh=`
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
}`,$h=`
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
}`,Qh=`
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
}`,Zh=6.2,eb=4.6,tb=3.8,vs=4*1024*1024,ab=Math.floor(vs/6),Oo=ab*6,xs=512*1024,Po=512*1024,Do=96,sb=96,rb=18,Lo=96*1024*1024,nb=2,ks=class t{static async create(e,a){if(!navigator.gpu)throw new Error("WebGPU is unavailable in this browser");let s=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!s)throw new Error("No WebGPU adapter is available");let r=await s.requestDevice(),n=await fetch(a,{cache:"default"});if(!n.ok)throw new Error(`Failed to load schematic manifest: ${n.status}`);let i=await n.json();if(!["prism.schematic_world_a0","prism.schematic_vector_a0"].includes(i.schema))throw new Error(`Unsupported schematic scene schema: ${i.schema}`);let o=i.featureTable||i.features,c=await fetch(new URL(o,a),{cache:"default"});if(!c.ok)throw new Error(`Failed to load schematic features: ${c.status}`);let d=ob(await c.json());return new t(e,r,a,i,d)}constructor(e,a,s,r,n){this.canvas=e,this.device=a,this.manifestUrl=s,this.manifest=r,this.isNativeScene=r.schema==="prism.schematic_vector_a0",this.pages=r.pages||[],this.featuresByPage=n,this.featuresById=new Map;for(let x of Object.values(n))for(let h of x)this.featuresById.set(Number(h.id),h);this.context=e.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:a,format:this.format,alphaMode:"opaque"}),this.flowCanvas=null,this.flowContext=null,this.globalBuffer=a.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.bindGroupLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]});let i=a.createShaderModule({code:qh});this.pagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:this.format}]},primitive:{topology:"triangle-list"}}),this.edgeLayout=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});let o=a.createShaderModule({code:Xh});this.edgePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:o,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:o,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.edgeBindGroup=a.createBindGroup({layout:this.edgeLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}}]});let c=a.createShaderModule({code:Wh});this.highlightPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:c,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:c,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"line-list"}}),this.highlightBufferSize=4*1024*1024,this.highlightBuffer=a.createBuffer({size:this.highlightBufferSize,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});let d=a.createShaderModule({code:Jh});this.netFlowPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:d,entryPoint:"vs",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x2"}]}]},fragment:{module:d,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.netFlowBuffer=a.createBuffer({size:Po*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.globalUniformScratch=new Float32Array(12),this.pageUniformScratch=new Float32Array(8),this.imageUniformScratch=new Float32Array(8),this.vectorScratch=new Float32Array(vs),this.highlightScratch=new Float32Array(this.highlightBufferSize/4),this.netFlowScratch=new Float32Array(Po),this.netTrackingCache=null,this.selectedIntrasheetLinkIndex=-1,this.truncatedHighlightCount=0,this.truncatedVectorCount=0,this.frameSerial=0,this.querySerial=0;let b=a.createShaderModule({code:Yh});this.vectorPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:b,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x4"}]}]},fragment:{module:b,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),this.vectorBuffer=a.createBuffer({size:vs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers=[this.vectorBuffer];let f=a.createShaderModule({code:$h});this.imagePipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:f,entryPoint:"vs"},fragment:{module:f,entryPoint:"fs",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}});let v=a.createShaderModule({code:Qh});this.pickPipeline=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[this.edgeLayout]}),vertex:{module:v,entryPoint:"vs",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"uint32"}]}]},fragment:{module:v,entryPoint:"fs",targets:[{format:"r32uint"}]},primitive:{topology:"triangle-list"}}),this.pickVertexBuffer=a.createBuffer({size:xs*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.pickReadBuffer=a.createBuffer({size:256,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pickTexture=null,this.pickTextureSize=[0,0],this.pickPending=!1,this.vectorChunks=new Map,this.failedVectorChunks=new Map,this.nativeDetailState=new Map,this.domDetailPageIds=new Set,this.nativeDetailThresholds=new Map,this.residentVectorBytes=0,this.sampler=a.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.placeholder=this.createSolidTexture([245,247,249,255]),this.pageResources=new Map,this.imageResources=new Map,this.loading=new Map,this.selectedPageId="",this.selectedFeatureId=0,this.activeNetUid="",this.showHierarchy=!0,this.downloadedBytes=0,this.world=r.worldBoundsMm,this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/900,(this.world.maxY-this.world.minY)/650,.1)*1.16,this.edgeBuffer=this.createEdgeBuffer();for(let x of this.pages)this.createPageResource(x)}createSolidTexture(e){let a=this.device.createTexture({size:[1,1],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.queue.writeTexture({texture:a},new Uint8Array(e),{bytesPerRow:4},[1,1]),a}createPageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={page:e,uniform:a,texture:this.placeholder,textureWidth:0,svgBlob:null,bindGroup:null};this.pageResources.set(e.id,s),this.updateBindGroup(s)}createImageResource(e){let a=this.device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s={path:e,uniform:a,texture:this.placeholder,loaded:!1,bindGroup:null};return this.imageResources.set(e,s),this.updateBindGroup(s),s}updateBindGroup(e){e.bindGroup=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.globalBuffer}},{binding:1,resource:{buffer:e.uniform}},{binding:2,resource:this.sampler},{binding:3,resource:e.texture.createView()}]})}async loadImageTexture(e){let a=this.imageResources.get(e)||this.createImageResource(e);if(a.loaded)return a;let s=`image:${e}`;if(this.loading.has(s))return this.loading.get(s);let r=(async()=>{try{let n=await fetch(new URL(e,this.manifestUrl),{cache:"default"});if(!n.ok)throw new Error(`Failed to load schematic image ${e}: ${n.status}`);let i=await n.blob(),o=await createImageBitmap(i),c=this.device.createTexture({size:[o.width,o.height],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:o},{texture:c},[o.width,o.height]),o.close(),a.texture!==this.placeholder&&a.texture.destroy(),a.texture=c,a.loaded=!0,this.updateBindGroup(a)}finally{this.loading.delete(s)}return a})();return this.loading.set(s,r),r}createEdgeBuffer(){let e=new Map(this.pages.map(n=>[n.id,n])),a=[];for(let n of this.manifest.edges||[]){let i=e.get(n.source),o=e.get(n.target);!i||!o||a.push(i.worldX+i.widthMm/2,i.worldY+i.heightMm,o.worldX+o.widthMm/2,o.worldY)}let s=new Float32Array(a);if(!s.length)return null;let r=this.device.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(r,0,s),{buffer:r,count:s.length/2}}resize(){let e=Math.min(devicePixelRatio||1,2),a=Math.max(1,Math.floor(this.canvas.clientWidth*e)),s=Math.max(1,Math.floor(this.canvas.clientHeight*e));(this.canvas.width!==a||this.canvas.height!==s)&&(this.canvas.width=a,this.canvas.height=s),this.flowCanvas&&(this.flowCanvas.width!==a||this.flowCanvas.height!==s)&&(this.flowCanvas.width=a,this.flowCanvas.height=s)}setFlowOverlayCanvas(e){e&&(this.flowCanvas=e,this.flowContext=e.getContext("webgpu"),this.flowContext.configure({device:this.device,format:this.format,alphaMode:"premultiplied"}))}writeGlobals(){let e=this.globalUniformScratch;e[0]=this.center[0],e[1]=this.center[1],e[2]=this.scale,e[3]=performance.now()*.001,e[4]=this.canvas.width,e[5]=this.canvas.height,this.device.queue.writeBuffer(this.globalBuffer,0,e)}pagePixelWidth(e){return e.widthMm/this.scale}pageSourcePixelsPerMm(e){let a=this.pagePixelWidth(e)/Math.max(1,e.sourceWidthMm||e.widthMm),s=e.heightMm/this.scale/Math.max(1,e.sourceHeightMm||e.heightMm);return Math.min(a,s)}pageNativeDetailThresholds(e){let a=this.nativeDetailThresholds.get(e.id);if(a)return a;let s=Math.max(1,e.sourceWidthMm||e.widthMm),r=Math.max(1,e.sourceHeightMm||e.heightMm),n=s*r,i=Math.max(0,e.featureCount||e.featureIds?.length||0)/Math.max(1,n),o=re(1-i*72,.84,1.08),c=re(Math.sqrt(Math.max(s,r)/Math.max(1,Math.min(s,r)))/1.18,.92,1.14),d=re(Zh*o*c,5,7.4),b={enter:d,exit:re(Math.min(d-1.2,eb*o),3.8,d-.7),prefetch:re(Math.min(d-2,tb*o),3,d-1)};return this.nativeDetailThresholds.set(e.id,b),b}pageWantsNativeDetail(e){if(!this.pageHasNativeDetail(e))return!1;let a=this.pageSourcePixelsPerMm(e),s=this.nativeDetailState.get(e.id)===!0,r=this.pageNativeDetailThresholds(e),n=s?r.exit:r.enter,i=a>=n;return i!==s&&this.nativeDetailState.set(e.id,i),i}pageNativeDetailReady(e){if(this.domDetailPageIds.has(e.id)||!this.pageWantsNativeDetail(e))return!1;let a=this.vectorChunks.get(e.id);return!a?.loaded||!a.segments?.length&&!a.fills?.length?!1:this.visibleNativeImagesReady(e,a)}visibleNativeImagesReady(e,a){if(!a?.images?.length)return!0;let s=this.sourceViewportBounds(e,4),r=!0;for(let n of a.images){if(!rt(n.bounds,s))continue;(this.imageResources.get(n.path)||this.createImageResource(n.path)).loaded||(r=!1,this.loadImageTexture(n.path).catch(()=>{}))}return r}visiblePages(){let e=this.canvas.width*this.scale/2,a=this.canvas.height*this.scale/2,s=this.center[0]-e,r=this.center[0]+e,n=this.center[1]-a,i=this.center[1]+a;return this.pages.filter(o=>o.worldX+o.widthMm>=s&&o.worldX<=r&&o.worldY+o.heightMm>=n&&o.worldY<=i)}worldViewportBounds(e=0){let a=this.canvas.width*this.scale/2,s=this.canvas.height*this.scale/2;return[this.center[0]-a-e,this.center[1]-s-e,this.center[0]+a+e,this.center[1]+s+e]}sourceViewportBounds(e,a=2.5){let s=this.worldViewportBounds(this.scale*8),r=(s[0]-e.worldX)/e.widthMm*e.sourceWidthMm-a,n=(s[1]-e.worldY)/e.heightMm*e.sourceHeightMm-a,i=(s[2]-e.worldX)/e.widthMm*e.sourceWidthMm+a,o=(s[3]-e.worldY)/e.heightMm*e.sourceHeightMm+a;return[Math.max(-a,Math.min(r,i)),Math.max(-a,Math.min(n,o)),Math.min(e.sourceWidthMm+a,Math.max(r,i)),Math.min(e.sourceHeightMm+a,Math.max(n,o))]}render(){this.frameSerial+=1,this.resize(),this.writeGlobals();let e=this.visiblePages(),a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.045,g:.055,b:.073,a:1},loadOp:"clear",storeOp:"store"}]});this.showHierarchy&&this.edgeBuffer&&(s.setPipeline(this.edgePipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.edgeBuffer.buffer),s.draw(this.edgeBuffer.count)),s.setPipeline(this.pagePipeline);for(let i of e){let o=this.pageResources.get(i.id),c=this.activeNetUid&&i.netUids.includes(this.activeNetUid),d=this.domDetailPageIds.has(i.id),b=!d&&this.pageNativeDetailReady(i),f=this.pageUniformScratch;f[0]=i.worldX,f[1]=i.worldY,f[2]=i.widthMm,f[3]=i.heightMm,f[4]=i.id===this.selectedPageId?1:0,f[5]=c?1:0,f[6]=this.activeNetUid?1:0,f[7]=b||d?1:0,this.device.queue.writeBuffer(o.uniform,0,f),s.setBindGroup(0,o.bindGroup),s.draw(6);let v=re(Math.ceil(this.pagePixelWidth(i)*1.3/512)*512,512,6144);o.textureWidth<v*.82&&this.loadPageTexture(i,v).catch(()=>{})}this.scheduleVisibleVectorLoads(e),this.drawVisibleImages(s,e),this.drawVisibleVectors(s,e);let r=this.writeNetTrackingOverlay();r&&!this.flowContext&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(r));let n=this.writeNetHighlights(e);return n&&(s.setPipeline(this.highlightPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.highlightBuffer),s.draw(n)),s.end(),this.device.queue.submit([a.finish()]),this.renderFlowOverlay(r),this.evictVectorChunks(e),e}renderFlowOverlay(e){if(!this.flowContext)return;let a=this.device.createCommandEncoder(),s=a.beginRenderPass({colorAttachments:[{view:this.flowContext.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});e&&(s.setPipeline(this.netFlowPipeline),s.setBindGroup(0,this.edgeBindGroup),s.setVertexBuffer(0,this.netFlowBuffer),s.draw(e)),s.end(),this.device.queue.submit([a.finish()])}drawVisibleImages(e,a){if(!this.isNativeScene)return;let s=!1;for(let r of a){if(this.domDetailPageIds.has(r.id)||!this.pageNativeDetailReady(r))continue;let n=this.vectorChunks.get(r.id);if(!n?.images?.length)continue;let i=this.sourceViewportBounds(r,4);for(let o of n.images){if(!rt(o.bounds,i))continue;let c=this.imageResources.get(o.path)||this.createImageResource(o.path);c.loaded||this.loadImageTexture(o.path).catch(()=>{});let d=o.worldOrigin||this.sourceToWorld(r,[o.xMm,o.yMm]),b=o.worldSize||this.sourceSizeToWorld(r,o.widthMm,o.heightMm),f=this.imageUniformScratch;f[0]=d[0],f[1]=d[1],f[2]=b[0],f[3]=b[1],f[4]=0,f[5]=0,f[6]=0,f[7]=0,this.device.queue.writeBuffer(c.uniform,0,f),s||(e.setPipeline(this.imagePipeline),s=!0),e.setBindGroup(0,c.bindGroup),e.draw(6)}}}drawVisibleVectors(e,a){if(!this.isNativeScene)return 0;let s=this.vectorScratch,r=0,n=0,i=0,o=0,c=!1,d=()=>{if(!r)return;let f=this.vectorBuffers[o];f||(f=this.device.createBuffer({size:vs*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.vectorBuffers.push(f)),this.device.queue.writeBuffer(f,0,s,0,r),c||(e.setPipeline(this.vectorPipeline),e.setBindGroup(0,this.edgeBindGroup),c=!0);let v=Math.floor(r/6);e.setVertexBuffer(0,f),e.draw(v),i+=v,o+=1,r=0},b=f=>f>Oo||f>s.length?(n+=1,!1):((r+f>Oo||r+f>s.length)&&d(),!0);for(let f of a){if(this.domDetailPageIds.has(f.id)||!this.pageHasNativeDetail(f))continue;let v=this.vectorChunks.get(f.id);if(!v?.segments?.length&&!v?.fills?.length||!this.pageNativeDetailReady(f))continue;v.lastUsedFrame=this.frameSerial;let x=this.sourceViewportBounds(f),h=Ko(v.spatial,x);for(let l of h.fills){if(!rt(l.bounds,x)||!b(18))continue;let g=this.featuresById.get(l.featureId),u=this.activeNetUid&&g?.netUid===this.activeNetUid,y=this.selectedFeatureId===l.featureId?[.24,.58,1,1]:u?[.06,1,.24,1]:this.activeNetUid&&Ta(g)?Ho(g,l.kind,l.color):zr(g,l.kind,l.color),w=l.worldPoints||l.points.map(T=>this.sourceToWorld(f,T));r=Tb(s,r,w[0],w[1],w[2],y)}for(let l of h.segments){if(!rt(l.bounds,x))continue;let g=this.featuresById.get(l.featureId),u=this.activeNetUid&&g?.netUid===this.activeNetUid,p=this.selectedFeatureId===l.featureId,y=p?[.24,.58,1,1]:u?[.06,1,.24,1]:this.activeNetUid&&Ta(g)?Ho(g,l.kind,l.color):zr(g,l.kind,l.color),w=this.segmentWorldWidth(f,l,g,u||p);for(let T of this.visibleSegmentParts(f,l,g)){if(!b(36))continue;let I=T.worldA||this.sourceToWorld(f,T.a),S=T.worldB||this.sourceToWorld(f,T.b);r=kb(s,r,I,S,w,y)}}}return d(),this.truncatedVectorCount=n,this.vectorTruncated=n>0,this.lastVectorVertices=i,this.lastVectorChunks=o,i}pageHasNativeDetail(e){return this.isNativeScene?e?.nativeDetail?.enabled!==!1:!1}scheduleVisibleVectorLoads(e){if(!this.isNativeScene)return;let a=[...this.vectorChunks.values()].filter(n=>n?.promise&&!n.loaded).length,s=Math.max(0,nb-a);if(!s)return;let r=e.filter(n=>!this.domDetailPageIds.has(n.id)).filter(n=>this.pageHasNativeDetail(n)&&this.pageSourcePixelsPerMm(n)>=this.pageNativeDetailThresholds(n).prefetch).filter(n=>!this.vectorChunks.get(n.id)?.loaded&&!this.vectorChunks.get(n.id)?.promise).sort((n,i)=>{let o=Math.hypot(n.worldX+n.widthMm/2-this.center[0],n.worldY+n.heightMm/2-this.center[1]),c=Math.hypot(i.worldX+i.widthMm/2-this.center[0],i.worldY+i.heightMm/2-this.center[1]);return o-c});for(let n of r)if(this.loadPageVectors(n).catch(()=>{}),s-=1,!s)break}featurePrimitiveBounds(e,a){let s=this.vectorChunks.get(e.id);if(!s?.segments?.length&&!s?.fills?.length)return null;let r=[],n=[];for(let i of s.segments||[])i.featureId===a&&(r.push(i.a[0],i.b[0]),n.push(i.a[1],i.b[1]));for(let i of s.fills||[])if(i.featureId===a)for(let o of i.points||[])r.push(o[0]),n.push(o[1]);return r.length?[Math.min(...r),Math.min(...n),Math.max(...r),Math.max(...n)]:null}symbolClipBounds(e){if(this._symbolClipBounds||(this._symbolClipBounds=new Map),this._symbolClipBounds.has(e.id))return this._symbolClipBounds.get(e.id);let a=(this.featuresByPage[e.id]||[]).filter(s=>s?.kind==="symbol_body"&&s.boundsMm&&!String(s.sourceId||"").includes(":overplot")).map(s=>{let r=this.featurePrimitiveBounds(e,s.id)||s.boundsMm;return[r[0]-.02,r[1]-.02,r[2]+.02,r[3]+.02]}).filter(s=>{let r=s[2]-s[0],n=s[3]-s[1];return Math.max(r,n)<=12&&r*n<=80});return this._symbolClipBounds.set(e.id,a),a}visibleSegmentParts(e,a,s){if(a._visibleParts)return a._visibleParts;let r=String(s?.kind||""),n=String(s?.semanticRole||"");if(r!=="wire"&&n!=="wire")return a._visibleParts=[a],a._visibleParts;let i=[a];for(let o of this.symbolClipBounds(e)){let c=[];for(let d of i)c.push(...Sb(d,o));if(i=c,!i.length)break}for(let o of i)o.worldA=aa(e,o.a),o.worldB=aa(e,o.b);return a._visibleParts=i,a._visibleParts}netTrackingSegments(){if(!this.activeNetUid)return{netUid:"",anchorsByPage:new Map,segments:[],intrasheetSegments:[]};let e=Number(this.selectedFeatureId||0),a=String(this.selectedFeatureKey||""),s=String(this.selectedSourceId||"");if(this.netTrackingCache?.netUid===this.activeNetUid&&this.netTrackingCache?.selectedFeatureId===e&&this.netTrackingCache?.selectedFeatureKey===a&&this.netTrackingCache?.selectedSourceId===s)return this.netTrackingCache;this.selectedIntrasheetLinkIndex=-1;let r=new Map(this.pages.map(h=>[h.id,h])),n=this.manifest.netToPages?.[this.activeNetUid]||[],i=n.length?n.map(h=>r.get(h)).filter(Boolean):this.pages.filter(h=>h.netUids?.includes(this.activeNetUid)),o=new Map;for(let h of i.slice(0,sb)){let l=this.netTrackingAnchorsForPage(h);l.length&&o.set(h.id,l)}let c=[],d=[];for(let[h,l]of o){let g=zo(xb(l),"intrasheet",h);c.push(...g),d.push(...g)}let b=[...o.entries()].map(([h,l])=>vb(r.get(h),l,{featureId:e,stableKey:a,sourceId:s})).filter(Boolean);c.push(...zo(b,"intersheet",""));let f=d.map((h,l)=>({...h,intrasheetIndex:l})),v=0,x=c.map((h,l)=>{if(h.type!=="intrasheet")return{...h,id:l};let g=v;return v+=1,{...h,id:l,intrasheetIndex:g}});return this.netTrackingCache={netUid:this.activeNetUid,selectedFeatureId:e,selectedFeatureKey:a,selectedSourceId:s,anchorsByPage:o,segments:x,intrasheetSegments:f},this.selectedIntrasheetLinkIndex>=this.netTrackingCache.intrasheetSegments.length&&(this.selectedIntrasheetLinkIndex=-1),this.netTrackingCache}netTrackingAnchorsForPage(e){let a=this.featuresByPage[e.id]||[],s=[];for(let r of a){if(r.netUid!==this.activeNetUid||!r.boundsMm||!mb(r))continue;let n=r.boundsMm,i=[(n[0]+n[2])/2,(n[1]+n[3])/2],o=this.sourceToWorld(e,i);s.push({pageId:e.id,featureId:Number(r.id||0),stableKey:String(r.stableKey||""),sourceId:String(r.sourceId||r.sourceUid||r.objectId||""),kind:r.kind||r.semanticRole||"",source:i,world:o,bounds:n,priority:yb(r)})}return s.sort((r,n)=>n.priority-r.priority||r.source[1]-n.source[1]||r.source[0]-n.source[0]),s}writeNetTrackingOverlay(){let e=this.netTrackingSegments();if(this.lastNetFlowSegments=e.segments.length,this.lastNetFlowIntrasheetSegments=e.intrasheetSegments.length,!e.segments.length)return this.lastNetFlowVertices=0,0;let a=this.worldViewportBounds(this.scale*96),s=this.netFlowScratch,r=0,n=0;for(let i of e.segments){if(!rt(Vo(i),a))continue;let o=i.type==="intrasheet"&&i.intrasheetIndex===this.selectedIntrasheetLinkIndex,c=o?9.5:i.type==="intersheet"?8:4.8,d=o?2:i.type==="intersheet"?1:0,b=Mb(s,r,i.a,i.b,c*this.scale,d,n,this.scale);if(b!==r&&(r=b,n+=Math.hypot(i.b[0]-i.a[0],i.b[1]-i.a[1])/Math.max(this.scale,1e-6),r+24>s.length))break}return r?(this.device.queue.writeBuffer(this.netFlowBuffer,0,s,0,r),this.lastNetFlowVertices=r/4,r/4):(this.lastNetFlowVertices=0,0)}cycleNetIntrasheetLink(e=1){let a=this.netTrackingSegments();if(!a.intrasheetSegments.length)return null;let s=a.intrasheetSegments.length;this.selectedIntrasheetLinkIndex=(this.selectedIntrasheetLinkIndex+e+s)%s;let r=a.intrasheetSegments[this.selectedIntrasheetLinkIndex];if(!r)return null;let n=Vo(r,14*this.scale);return this.center=[(n[0]+n[2])/2,(n[1]+n[3])/2],this.scale=Math.max((n[2]-n[0])/Math.max(1,this.canvas.width*.36),(n[3]-n[1])/Math.max(1,this.canvas.height*.3),this.scale*.35,.025),{pageId:r.pageId,segment:r}}writeNetHighlights(e){if(!this.activeNetUid)return 0;let a=this.highlightScratch,s=0,r=0;for(let n of e){let i=this.sourceViewportBounds(n,5);for(let o of this.featuresByPage[n.id]||[]){if(o.netUid!==this.activeNetUid||!o.boundsMm||!rt(o.boundsMm,i))continue;let c=this.featureWorldBounds(n,o.boundsMm);if(s+16>a.length){r+=1;continue}a[s++]=c[0],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[1],a[s++]=c[2],a[s++]=c[3],a[s++]=c[2],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[3],a[s++]=c[0],a[s++]=c[1]}}return this.truncatedHighlightCount=r,s?(this.device.queue.writeBuffer(this.highlightBuffer,0,a,0,s),s/2):0}featureWorldBounds(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm,e.worldX+a[2]/e.sourceWidthMm*e.widthMm,e.worldY+a[3]/e.sourceHeightMm*e.heightMm]}sourceToWorld(e,a){return[e.worldX+a[0]/e.sourceWidthMm*e.widthMm,e.worldY+a[1]/e.sourceHeightMm*e.heightMm]}sourceSizeToWorld(e,a,s){return[a/e.sourceWidthMm*e.widthMm,s/e.sourceHeightMm*e.heightMm]}async loadPageVectors(e){if(!this.pageHasNativeDetail(e)||!e.chunks?.lod2)return null;let a=this.vectorChunks.get(e.id);if(a?.loaded)return a;if(a?.promise)return a.promise;let s=(async()=>{try{let r=await fetch(new URL(e.chunks.lod2,this.manifestUrl));if(!r.ok)throw new Error(`Failed to load schematic vector chunk ${e.id}: ${r.status}`);let n=await r.json(),i=cb(n.primitives||[]);lb(e,i);let c=JSON.stringify(n).length,d={loaded:!0,segments:i.segments,fills:i.fills,images:i.images,spatial:gb(i),unsupported:n.unsupported||[],bytes:c,lastUsedFrame:this.frameSerial};return this.vectorChunks.set(e.id,d),this.failedVectorChunks.delete(e.id),this.residentVectorBytes+=c,d}catch(r){let n=this.failedVectorChunks.get(e.id)||{count:0,message:""};throw this.failedVectorChunks.set(e.id,{count:n.count+1,message:r?.message||String(r)}),this.vectorChunks.delete(e.id),r}})();return this.vectorChunks.set(e.id,{loaded:!1,promise:s,segments:[]}),s}evictVectorChunks(e){if(this.residentVectorBytes<=Lo)return;let a=new Set(e.map(r=>r.id)),s=[...this.vectorChunks.entries()].filter(([,r])=>r?.loaded).filter(([r])=>!a.has(r)&&r!==this.selectedPageId).sort((r,n)=>(r[1].lastUsedFrame||0)-(n[1].lastUsedFrame||0));for(let[r,n]of s)if(this.vectorChunks.delete(r),this.residentVectorBytes=Math.max(0,this.residentVectorBytes-(n.bytes||0)),this.residentVectorBytes<=Lo*.82)break}stats(){let e=this.visiblePages(),a=e.map(r=>this.pageSourcePixelsPerMm(r)),s=e.map(r=>this.pageNativeDetailThresholds(r).enter);return{residentVectorBytes:this.residentVectorBytes,vectorChunks:[...this.vectorChunks.values()].filter(r=>r?.loaded).length,vectorLoads:[...this.vectorChunks.values()].filter(r=>r?.promise&&!r.loaded).length,failedVectorChunks:this.failedVectorChunks.size,vectorVertices:this.lastVectorVertices||0,vectorDrawChunks:this.lastVectorChunks||0,truncatedVectors:this.truncatedVectorCount||0,nativeDetailPages:[...this.nativeDetailState.values()].filter(Boolean).length,nativePxPerMm:Number((Math.max(0,...a)||0).toFixed(2)),nativeThresholdPxPerMm:Number((s.length?Math.min(...s):0).toFixed(2)),domDetailPages:this.domDetailPageIds.size,netFlowSegments:this.lastNetFlowSegments||0,netFlowIntrasheetSegments:this.lastNetFlowIntrasheetSegments||0,netFlowVertices:this.lastNetFlowVertices||0}}setDomDetailPageIds(e){this.domDetailPageIds=new Set(e||[])}async loadPageTexture(e,a){let s=`${e.id}:${a}`;if(this.loading.has(s))return this.loading.get(s);let r=this.pageResources.get(e.id);if(!r||r.textureWidth>=a)return;let n=(async()=>{if(!r.svgBlob){let c=await fetch(new URL(ib(e),this.manifestUrl));if(!c.ok)throw new Error(`Failed to load schematic page ${e.name}: ${c.status}`);r.svgBlob=await c.blob(),this.downloadedBytes+=r.svgBlob.size}let i=r.svgBlob,o=URL.createObjectURL(i);try{let c=new Image;if(c.decoding="async",c.src=o,await c.decode(),r.textureWidth>=a)return;let d=Math.max(64,Math.round(a*e.heightMm/e.widthMm)),b=new OffscreenCanvas(a,d),f=b.getContext("2d",{alpha:!1});f.fillStyle="#ffffff",f.fillRect(0,0,a,d),f.drawImage(c,0,0,a,d);let v=await createImageBitmap(b),x=this.device.createTexture({size:[a,d],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:v},{texture:x},[a,d]),v.close(),r.texture!==this.placeholder&&r.texture.destroy(),r.texture=x,r.textureWidth=a,this.updateBindGroup(r)}finally{URL.revokeObjectURL(o),this.loading.delete(s)}})();return this.loading.set(s,n),n}preloadOverview(){let e=[...this.pages],a=async()=>{for(;e.length;){let s=e.shift();await this.loadPageTexture(s,512).catch(()=>{})}};return Promise.all(Array.from({length:Math.min(4,e.length)},a))}screenToWorld(e,a){let s=this.canvas.getBoundingClientRect(),r=(e-s.left)*this.canvas.width/s.width,n=(a-s.top)*this.canvas.height/s.height;return[this.center[0]+(r-this.canvas.width/2)*this.scale,this.center[1]+(n-this.canvas.height/2)*this.scale]}worldToScreen(e,a){let s=this.canvas.clientWidth/this.canvas.width,r=this.canvas.clientHeight/this.canvas.height;return[((e-this.center[0])/this.scale+this.canvas.width/2)*s,((a-this.center[1])/this.scale+this.canvas.height/2)*r]}hitPage(e,a){let[s,r]=this.screenToWorld(e,a);return[...this.pages].reverse().find(n=>s>=n.worldX&&s<=n.worldX+n.widthMm&&r>=n.worldY&&r<=n.worldY+n.heightMm)||null}async pickFeature(e,a){if(!this.isNativeScene)return this.hitFeature(e,a);let s=this.hitPage(e,a);if(!s)return null;if(!this.pageHasNativeDetail(s))return this.hitFeature(e,a);await this.loadPageVectors(s);let r=await this.gpuPickFeature(s,e,a);return r&&!ka(r)?{page:s,feature:r,source:this.clientToSource(s,e,a),native:!0,gpu:!0}:this.hitFeature(e,a)}hitFeature(e,a){let s=this.hitPage(e,a);if(!s)return null;let[r,n]=this.clientToSource(s,e,a),i=Math.max(.45,5*this.scale*this.canvas.width/Math.max(1,this.canvas.clientWidth)*s.sourceWidthMm/s.widthMm),o=this.hitResidentVectorFeature(s,r,n,i);if(o)return{page:s,feature:o,source:[r,n],native:!0};let c=this.hitSymbolInterior(s,r,n);if(c)return{page:s,feature:c,source:[r,n],native:!0,interior:!0};let d=(this.featuresByPage[s.id]||[]).filter(b=>{if(ka(b))return!1;let f=b.boundsMm;return f&&r>=f[0]-i&&r<=f[2]+i&&n>=f[1]-i&&n<=f[3]+i}).map(b=>({feature:b,priority:Ea(b),area:Math.max(1e-4,(b.boundsMm[2]-b.boundsMm[0])*(b.boundsMm[3]-b.boundsMm[1]))})).sort((b,f)=>f.priority-b.priority||b.area-f.area);return{page:s,feature:d[0]?.feature||null,source:[r,n]}}hitSymbolInterior(e,a,s){let r=null;for(let n of this.featuresByPage[e.id]||[]){let i=String(n?.kind||"");if(i!=="symbol_body"&&i!=="symbol_instance"||String(n?.sourceId||"").includes(":overplot"))continue;let o=n.boundsMm;if(!o||a<o[0]||a>o[2]||s<o[1]||s>o[3])continue;let c=Math.max(1e-4,(o[2]-o[0])*(o[3]-o[1])),d=(i==="symbol_body"?0:1e6)+c;(!r||d<r.score)&&(r={feature:n,score:d})}return r?.feature||null}clientToSource(e,a,s){let[r,n]=this.screenToWorld(a,s);return[(r-e.worldX)/e.widthMm*e.sourceWidthMm,(n-e.worldY)/e.heightMm*e.sourceHeightMm]}ensurePickTexture(){this.pickTexture&&this.pickTextureSize[0]===this.canvas.width&&this.pickTextureSize[1]===this.canvas.height||(this.pickTexture&&this.pickTexture.destroy(),this.pickTexture=this.device.createTexture({size:[this.canvas.width,this.canvas.height],format:"r32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),this.pickTextureSize=[this.canvas.width,this.canvas.height])}writePickVectors(e){let a=new ArrayBuffer(xs*12),s=new DataView(a),r=0,n=[];for(let i of e){let o=this.vectorChunks.get(i.id);if(!o?.segments?.length&&!o?.fills?.length&&!o?.images?.length)continue;let c=this._pickSourcePointByPage?.get(i.id),d=c?[c[0]-2.5,c[1]-2.5,c[0]+2.5,c[1]+2.5]:[0,0,i.sourceWidthMm,i.sourceHeightMm],b=Ko(o.spatial,d);for(let f of b.images){if(!rt(f.bounds,d))continue;let v=this.featuresById.get(f.featureId);!v||ka(v)||n.push({page:i,image:f,feature:v,priority:Ea(v)-5})}for(let f of b.fills){if(!rt(f.bounds,d))continue;let v=this.featuresById.get(f.featureId);!v||ka(v)||n.push({page:i,fill:f,feature:v,priority:Ea(v)-2})}for(let f of b.segments){if(!rt(f.bounds,d))continue;let v=this.featuresById.get(f.featureId);!v||ka(v)||n.push({page:i,segment:f,feature:v,priority:Ea(v)})}}n.sort((i,o)=>i.priority-o.priority);for(let{page:i,segment:o,fill:c,image:d,feature:b}of n){if(r+6>xs)break;if(d){let f=this.sourceToWorld(i,[d.xMm,d.yMm]),v=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm]),x=this.sourceToWorld(i,[d.xMm,d.yMm+d.heightMm]),h=this.sourceToWorld(i,[d.xMm+d.widthMm,d.yMm+d.heightMm]);r=Gr(s,r,f,v,x,d.featureId),r=Gr(s,r,x,v,h,d.featureId)}else if(c){let f=c.worldPoints||c.points.map(v=>this.sourceToWorld(i,v));r=Gr(s,r,f[0],f[1],f[2],c.featureId)}else{let f=Math.max(this.segmentWorldWidth(i,o,b,!1),this.scale*7);for(let v of this.visibleSegmentParts(i,o,b)){if(r+6>xs)break;let x=v.worldA||this.sourceToWorld(i,v.a),h=v.worldB||this.sourceToWorld(i,v.b);r=Rb(s,r,x,h,f,o.featureId)}}}return r?(this.device.queue.writeBuffer(this.pickVertexBuffer,0,a,0,r*12),r):0}async gpuPickFeature(e,a,s){if(this.pickPending)return null;let r=this.clientToSource(e,a,s);this._pickSourcePointByPage=new Map([[e.id,r]]);let n=this.writePickVectors([e]);if(this._pickSourcePointByPage=null,!n)return null;this.resize(),this.writeGlobals(),this.ensurePickTexture();let i=this.canvas.getBoundingClientRect(),o=Math.max(0,Math.min(this.canvas.width-1,Math.floor((a-i.left)*this.canvas.width/i.width))),c=Math.max(0,Math.min(this.canvas.height-1,Math.floor((s-i.top)*this.canvas.height/i.height))),d=this.device.createCommandEncoder(),b=d.beginRenderPass({colorAttachments:[{view:this.pickTexture.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});b.setPipeline(this.pickPipeline),b.setBindGroup(0,this.edgeBindGroup),b.setVertexBuffer(0,this.pickVertexBuffer),b.draw(n),b.end(),d.copyTextureToBuffer({texture:this.pickTexture,origin:{x:o,y:c}},{buffer:this.pickReadBuffer,bytesPerRow:256,rowsPerImage:1},{width:1,height:1,depthOrArrayLayers:1}),this.pickPending=!0,this.device.queue.submit([d.finish()]);try{await this.pickReadBuffer.mapAsync(GPUMapMode.READ);let f=new DataView(this.pickReadBuffer.getMappedRange()).getUint32(0,!0);return this.pickReadBuffer.unmap(),f&&this.featuresById.get(f)||null}finally{this.pickReadBuffer.mapState==="mapped"&&this.pickReadBuffer.unmap(),this.pickPending=!1}}hitResidentVectorFeature(e,a,s,r){if(!this.isNativeScene)return null;let n=this.vectorChunks.get(e.id);if(!n?.loaded)return null;let i=null;for(let o of n.segments){let c=this.featuresById.get(o.featureId),d=Math.max(r,(o.widthMm||0)*.5+r*.45);if(c)for(let b of this.visibleSegmentParts(e,o,c)){let f=Ib([a,s],b.a,b.b);if(f>d)continue;let v=f-Ea(c)*.025+(Ta(c)?0:8);(!i||v<i.score)&&(i={feature:c,score:v})}}return i?.feature||null}segmentWorldWidth(e,a,s,r){let n=(a.widthMm||.15)/Math.max(1,e.sourceWidthMm)*e.widthMm;return Math.max(n,this.scale*Eb(s,a.kind,r))}pan(e,a){let s=this.canvas.width/Math.max(1,this.canvas.clientWidth);this.center[0]-=e*this.scale*s,this.center[1]-=a*this.scale*s}zoom(e,a,s){let r=this.screenToWorld(a,s);this.scale=re(this.scale*Math.exp(e*.0015),.015,16);let n=this.screenToWorld(a,s);this.center[0]+=r[0]-n[0],this.center[1]+=r[1]-n[1]}framePage(e){e&&(this.resize(),this.center=[e.worldX+e.widthMm/2,e.worldY+e.heightMm/2],this.scale=Math.max(e.widthMm/Math.max(1,this.canvas.width*.88),e.heightMm/Math.max(1,this.canvas.height*.84)))}frameWorld(){this.resize(),this.center=[(this.world.minX+this.world.maxX)/2,(this.world.minY+this.world.maxY)/2],this.scale=Math.max((this.world.maxX-this.world.minX)/Math.max(1,this.canvas.width*.9),(this.world.maxY-this.world.minY)/Math.max(1,this.canvas.height*.88),.05)}};function ib(t){return t.thumbnail?.path||t.svg}function ob(t){if(t.schema==="prism.schematic_vector_a0.features"){let e=new Map((t.features||[]).map(s=>[Number(s.id),s])),a={};for(let[s,r]of Object.entries(t.pages||{}))a[s]=r.map(n=>e.get(Number(n))).filter(Boolean);return a}return t.pages||{}}function cb(t){let e=[],a=[],s=[];for(let r of t){let n=Number(r.featureId||0);if(!n)continue;if(r.kind==="plotimage"&&r.image?.path){let p=r.xMm||0,y=r.yMm||0,w=r.widthMm||0,T=r.heightMm||0;s.push({featureId:n,kind:r.kind,xMm:p,yMm:y,widthMm:w,heightMm:T,bounds:[p,y,p+w,y+T],path:r.image.path});continue}let i=String(r.semanticRole||""),o=r.radiusMm||r.diameterMm/2||0,c=String(r.fill||"").toUpperCase()==="FILLED_SHAPE",d=r.widthMm||r.pen_widthMm||(i==="junction"?.08:.15),b=String(r.lineStyle||r.line_style||"DEFAULT").toUpperCase(),f=r.color||r.strokeColor||r.style?.color||"",v=r.fillColor||r.color||r.style?.color||"",x=(p,y)=>bb(e,{featureId:n,kind:r.kind,widthMm:d,lineStyle:b,color:f},p,y),h=r.x1Mm,l=r.y1Mm,g=r.x2Mm,u=r.y2Mm;if(r.trianglesMm?.length){for(let p of r.trianglesMm)Array.isArray(p)&&p.length===3&&a.push({featureId:n,kind:r.kind,color:v,points:p,bounds:qo(p)});if(r.pointsMm?.length>=2){for(let p=1;p<r.pointsMm.length;p+=1)x(r.pointsMm[p-1],r.pointsMm[p]);Go(r)&&x(r.pointsMm[r.pointsMm.length-1],r.pointsMm[0])}}else if(r.pointsMm?.length>=2){c&&r.pointsMm.length>=3&&hb(a,n,r.kind,r.pointsMm,v);for(let p=1;p<r.pointsMm.length;p+=1)x(r.pointsMm[p-1],r.pointsMm[p]);Go(r)&&x(r.pointsMm[r.pointsMm.length-1],r.pointsMm[0])}else if(r.polylinesMm?.length){for(let p of r.polylinesMm)if(!(!Array.isArray(p)||p.length<2))for(let y=1;y<p.length;y+=1)x(p[y-1],p[y])}else if(Number.isFinite(h)&&Number.isFinite(l)&&Number.isFinite(g)&&Number.isFinite(u))r.kind==="rect"?(c&&ub(a,n,r.kind,[h,l,g,u],v),x([h,l],[g,l]),x([g,l],[g,u]),x([g,u],[h,u]),x([h,u],[h,l])):x([h,l],[g,u]);else if(Number.isFinite(r.cxMm)&&Number.isFinite(r.cyMm)){let p=r.radiusMm||r.diameterMm/2||.4;c&&fb(a,n,r.kind,[r.cxMm,r.cyMm],p,v),pb(e,{featureId:n,kind:r.kind,widthMm:d,lineStyle:b,color:f},[r.cxMm,r.cyMm],p)}else if(r.contoursMm?.length){for(let p of r.contoursMm)if(!(!Array.isArray(p)||p.length<2)){for(let y=1;y<p.length;y+=1)x(p[y-1],p[y]);x(p[p.length-1],p[0])}}else if(Number.isFinite(r.start_xMm)&&Number.isFinite(r.start_yMm)&&Number.isFinite(r.end_xMm)&&Number.isFinite(r.end_yMm))Number.isFinite(r.mid_xMm)&&Number.isFinite(r.mid_yMm)?(x([r.start_xMm,r.start_yMm],[r.mid_xMm,r.mid_yMm]),x([r.mid_xMm,r.mid_yMm],[r.end_xMm,r.end_yMm])):x([r.start_xMm,r.start_yMm],[r.end_xMm,r.end_yMm]);else if(Number.isFinite(r.start_xMm)&&Number.isFinite(r.start_yMm)&&Number.isFinite(r.mid_xMm)&&Number.isFinite(r.mid_yMm)&&Number.isFinite(r.end_xMm)&&Number.isFinite(r.end_yMm))x([r.start_xMm,r.start_yMm],[r.mid_xMm,r.mid_yMm]),x([r.mid_xMm,r.mid_yMm],[r.end_xMm,r.end_yMm]);else if(r.boundsMm&&r.kind!=="text"){let[p,y,w,T]=r.boundsMm;x([p,y],[w,y]),x([w,y],[w,T]),x([w,T],[p,T]),x([p,T],[p,y])}}return{segments:e,fills:a,images:s}}function lb(t,e){for(let a of e.segments||[])a.worldA=aa(t,a.a),a.worldB=aa(t,a.b);for(let a of e.fills||[])a.worldPoints=a.points.map(s=>aa(t,s));for(let a of e.images||[])a.worldOrigin=aa(t,[a.xMm,a.yMm]),a.worldSize=db(t,a.widthMm,a.heightMm)}function aa(t,e){return[t.worldX+e[0]/t.sourceWidthMm*t.widthMm,t.worldY+e[1]/t.sourceHeightMm*t.heightMm]}function db(t,e,a){return[e/t.sourceWidthMm*t.widthMm,a/t.sourceHeightMm*t.heightMm]}function ub(t,e,a,s,r){let[n,i,o,c]=s;t.push({featureId:e,kind:a,color:r,points:[[n,i],[o,i],[n,c]],bounds:[n,i,o,c]},{featureId:e,kind:a,color:r,points:[[n,c],[o,i],[o,c]],bounds:[n,i,o,c]})}function fb(t,e,a,s,r,n){for(let o=0;o<36;o+=1){let c=o/36*Math.PI*2,d=(o+1)/36*Math.PI*2;t.push({featureId:e,kind:a,color:n,points:[s,[s[0]+Math.cos(c)*r,s[1]+Math.sin(c)*r],[s[0]+Math.cos(d)*r,s[1]+Math.sin(d)*r]],bounds:[s[0]-r,s[1]-r,s[0]+r,s[1]+r]})}}function hb(t,e,a,s,r){let n=s[0],i=qo(s);for(let o=2;o<s.length;o+=1)t.push({featureId:e,kind:a,color:r,points:[n,s[o-1],s[o]],bounds:i})}function bb(t,e,a,s){let r=Uo(a,s,e.widthMm||.15),n=e.lineStyle||"DEFAULT";if(!["DASH","DASHED","DOT","DOTTED","DASHDOT","DASH_DOT"].includes(n)){t.push({...e,a,b:s,bounds:r});return}let i=s[0]-a[0],o=s[1]-a[1],c=Math.hypot(i,o);if(c<1e-6)return;let d=i/c,b=o/c,f=Math.max(e.widthMm*4,.45),v=n.includes("DOT")?[f*.8,f*.75,f*3,f*.75]:[f*3,f*1.5],x=0,h=0;for(;x<c;){let l=Math.min(v[h%v.length],c-x);if(h%2===0){let g=[a[0]+d*x,a[1]+b*x],u=[a[0]+d*(x+l),a[1]+b*(x+l)];t.push({...e,a:g,b:u,bounds:Uo(g,u,e.widthMm||.15)})}x+=l,h+=1}}function pb(t,e,a,s){for(let n=0;n<32;n+=1){let i=n/32*Math.PI*2,o=(n+1)/32*Math.PI*2;t.push({...e,a:[a[0]+Math.cos(i)*s,a[1]+Math.sin(i)*s],b:[a[0]+Math.cos(o)*s,a[1]+Math.sin(o)*s],bounds:[a[0]-s,a[1]-s,a[0]+s,a[1]+s]})}}function qo(t,e=0){let a=1/0,s=1/0,r=-1/0,n=-1/0;for(let i of t||[])a=Math.min(a,i[0]),s=Math.min(s,i[1]),r=Math.max(r,i[0]),n=Math.max(n,i[1]);return Number.isFinite(a)?[a-e,s-e,r+e,n+e]:[0,0,0,0]}function Uo(t,e,a=0){let s=Math.max(.05,a*.5);return[Math.min(t[0],e[0])-s,Math.min(t[1],e[1])-s,Math.max(t[0],e[0])+s,Math.max(t[1],e[1])+s]}function rt(t,e){return!t||!e?!0:t[0]<=e[2]&&t[2]>=e[0]&&t[1]<=e[3]&&t[3]>=e[1]}function gb(t){let e={cellSize:rb,cells:new Map,segments:t.segments||[],fills:t.fills||[],images:t.images||[],queryId:0};for(let a of e.segments)Ur(e,"segments",a);for(let a of e.fills)Ur(e,"fills",a);for(let a of e.images)Ur(e,"images",a);return e}function Ur(t,e,a){let s=a.bounds;if(!s)return;let r=Math.floor(s[0]/t.cellSize),n=Math.floor(s[2]/t.cellSize),i=Math.floor(s[1]/t.cellSize),o=Math.floor(s[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=r;d<=n;d+=1){let b=`${d}:${c}`,f=t.cells.get(b);f||(f={segments:[],fills:[],images:[]},t.cells.set(b,f)),f[e].push(a)}}function Ko(t,e){if(!t)return{segments:[],fills:[],images:[]};t.queryId=(t.queryId||0)+1;let a=t.queryId,s={segments:[],fills:[],images:[]},r=Math.floor(e[0]/t.cellSize),n=Math.floor(e[2]/t.cellSize),i=Math.floor(e[1]/t.cellSize),o=Math.floor(e[3]/t.cellSize);for(let c=i;c<=o;c+=1)for(let d=r;d<=n;d+=1){let b=t.cells.get(`${d}:${c}`);b&&(Kr(b.segments,s.segments,a,"segments"),Kr(b.fills,s.fills,a,"fills"),Kr(b.images,s.images,a,"images"))}return s}function Kr(t,e,a,s){let r=`_${s}QueryId`;for(let n of t)n[r]!==a&&(n[r]=a,e.push(n))}function Go(t){let e=String(t.kind||"");if(String(t.fill||"").toUpperCase()==="FILLED_SHAPE"||t.closed===!0||["polygon","fill"].includes(e))return!0;let s=t.pointsMm||[];if(s.length>=3){let r=s[0],n=s[s.length-1];return Math.hypot(r[0]-n[0],r[1]-n[1])<1e-6}return!1}function Ta(t){return!!t?.netUid}function mb(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="pin"||e==="pin_body"||e==="label"||e==="global_label"||e==="hierarchical_label"||e==="netclass_flag"||e==="power_symbol"||e==="power_port"||a==="label"||a==="global_label"||a==="hierarchical_label"}function yb(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");return e==="global_label"||a==="global_label"?130:e==="hierarchical_label"||a==="hierarchical_label"?125:e==="label"||a==="label"?118:e==="pin"||e==="pin_body"?106:e==="power_symbol"||e==="power_port"||e==="netclass_flag"?98:50}function xb(t){if(t.length<=Do)return t;let e=t.slice(0,Do);return e.sort((a,s)=>a.source[1]-s.source[1]||a.source[0]-s.source[0]),e}function vb(t,e,a={}){if(!t||!e?.length)return null;let s=a.featureId||a.stableKey||a.sourceId?e.find(d=>a.featureId&&Number(d.featureId||0)===Number(a.featureId)||a.stableKey&&d.stableKey===a.stableKey||a.sourceId&&d.sourceId===a.sourceId):null;if(s)return{...s,kind:"selected-net-occurrence",priority:200};let r=e.filter(d=>d.priority>=118).slice(0,16),n=r.length?r:e.slice(0,16),i=0,o=0;for(let d of n)i+=d.world[0],o+=d.world[1];let c=[i/n.length,o/n.length];return{pageId:t.id,featureId:n[0]?.featureId||0,kind:"page-net-occurrence",source:[0,0],world:c,bounds:[c[0],c[1],c[0],c[1]],priority:1}}function zo(t,e,a){if(!t||t.length<2)return[];let s=t.map(i=>({...i})).sort((i,o)=>i.world[1]-o.world[1]||i.world[0]-o.world[0]),r=[],n=s.shift();for(;s.length;){let i=0,o=1/0;for(let d=0;d<s.length;d+=1){let b=s[d],f=Math.hypot(b.world[0]-n.world[0],b.world[1]-n.world[1]);f<o&&(o=f,i=d)}let c=s.splice(i,1)[0];r.push({type:e,pageId:a||n.pageId||c.pageId||"",a:n.world,b:c.world,sourceFeatureIds:[n.featureId,c.featureId].filter(Boolean)}),n=c}return r}function Vo(t,e=0){return[Math.min(t.a[0],t.b[0])-e,Math.min(t.a[1],t.b[1])-e,Math.max(t.a[0],t.b[0])+e,Math.max(t.a[1],t.b[1])+e]}function Ea(t){let e=String(t?.kind||""),s=String(t?.semanticRole||"")||e;return s==="pin_number"||s==="pin_name"?120:s==="pin_body"||e==="pin"?110:s==="symbol_reference"||s==="symbol_value"?92:e==="junction"||e==="no_connect"?88:e==="wire"||e==="bus"||e==="bus_entry"?78:s==="symbol_body"||e==="symbol_body"?45:e==="symbol_instance"||e==="symbol_overplot"?30:e==="text"||String(s).includes("text")?24:10}function ka(t){let e=String(t?.kind||""),a=String(t?.semanticRole||"");if(e==="page"||e==="sheet_header")return!0;if(e==="graphic_rect"&&a==="graphic_rect"&&!t?.netUid&&!t?.componentUid){let s=t.boundsMm||[];return s[2]-s[0]>150&&s[3]-s[1]>120}return!1}function wb(t){if(!t||typeof t!="string")return null;let a=t.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);if(!a)return null;let s=a[1],r=a[2]??"ff";return[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255,parseInt(r,16)/255]}function zr(t,e,a=""){let s=wb(a||t?.color||"");return t?.kind==="dnp_marker"?s||[.86,.04,.05,.85]:t?.dnp&&["symbol_reference","symbol_value","symbol_text"].includes(String(t?.kind||""))?[.5,.52,.54,.56]:s||(t?.dnp?[.5,.52,.54,.56]:Ta(t)?[.12,.56,.2,.96]:t?.kind==="pin_name"?[0,.28,.31,.96]:t?.kind==="pin_number"?[.45,.17,.16,.96]:t?.kind==="pin_body"?[.28,.18,.18,.88]:t?.kind==="symbol_body"||t?.kind==="symbol_instance"?[.42,.18,.18,.72]:t?.kind==="symbol_reference"||t?.kind==="symbol_value"?[.05,.13,.16,.94]:t?.kind==="text"||String(e||"").startsWith("text")?[.05,.13,.16,.94]:[.16,.17,.19,.7])}function Ho(t,e,a=""){let s=zr(t,e,a);return[s[0]*.72,s[1]*.72,s[2]*.72,Math.min(s[3],.38)]}function Eb(t,e,a){return a?5.5:t?.kind==="dnp_marker"?3:["pin_name","pin_number"].includes(String(t?.kind||""))?1.5:t?.kind==="pin_body"?1.7:String(e||"").startsWith("text")?1.35:e==="bus"||t?.kind==="bus"?4.2:Ta(t)?2.6:t?.kind==="symbol_body"||t?.kind==="symbol_instance"||t?.kind==="sheet"?1.5:1.25}function ws(t,e,a,s){return t[e++]=a[0],t[e++]=a[1],t[e++]=s[0],t[e++]=s[1],t[e++]=s[2],t[e++]=s[3],e}function kb(t,e,a,s,r,n){let i=Xo(a,s,r);if(!i)return e;for(let o of i)e=ws(t,e,o,n);return e}function Tb(t,e,a,s,r,n){return e=ws(t,e,a,n),e=ws(t,e,s,n),e=ws(t,e,r,n),e}function ta(t,e,a,s,r){return t[e++]=a[0],t[e++]=a[1],t[e++]=s,t[e++]=r,e}function Mb(t,e,a,s,r,n,i,o){let c=s[0]-a[0],d=s[1]-a[1],b=Math.hypot(c,d);if(b<1e-6||e+24>t.length)return e;let f=r*.5,v=c/b,h=-(d/b)*f,l=v*f,g=[a[0]+h,a[1]+l],u=[a[0]-h,a[1]-l],p=[s[0]+h,s[1]+l],y=[s[0]-h,s[1]-l],w=i+b/Math.max(o,1e-6);return e=ta(t,e,g,i,n),e=ta(t,e,u,i,n),e=ta(t,e,p,w,n),e=ta(t,e,p,w,n),e=ta(t,e,u,i,n),e=ta(t,e,y,w,n),e}function Xo(t,e,a){let s=e[0]-t[0],r=e[1]-t[1],n=Math.hypot(s,r);if(n<1e-6)return null;let i=a*.5,o=s/n*i,c=r/n*i,d=-r/n*i,b=s/n*i,f=[t[0]-o,t[1]-c],v=[e[0]+o,e[1]+c],x=[f[0]+d,f[1]+b],h=[f[0]-d,f[1]-b],l=[v[0]+d,v[1]+b],g=[v[0]-d,v[1]-b];return[x,h,l,l,h,g]}function Ib(t,e,a){let s=a[0]-e[0],r=a[1]-e[1],n=s*s+r*r||1,i=re(((t[0]-e[0])*s+(t[1]-e[1])*r)/n,0,1),o=e[0]+s*i,c=e[1]+r*i;return Math.hypot(t[0]-o,t[1]-c)}function Sb(t,e){let[a,s,r,n]=e,[i,o]=t.a,[c,d]=t.b,b=1e-6,f=(v,x)=>({...t,a:v,b:x});if(Math.abs(o-d)<=b){let v=o;if(v<s-b||v>n+b)return[t];let x=Math.min(i,c),h=Math.max(i,c),l=Math.max(x,a),g=Math.min(h,r);if(g<=l+b)return[t];let u=[],p=i<=c;if(x<l-b){let y=p?[x,v]:[l,v],w=p?[l,v]:[x,v];u.push(f(y,w))}if(g<h-b){let y=p?[g,v]:[h,v],w=p?[h,v]:[g,v];u.push(f(y,w))}return u}if(Math.abs(i-c)<=b){let v=i;if(v<a-b||v>r+b)return[t];let x=Math.min(o,d),h=Math.max(o,d),l=Math.max(x,s),g=Math.min(h,n);if(g<=l+b)return[t];let u=[],p=o<=d;if(x<l-b){let y=p?[v,x]:[v,l],w=p?[v,l]:[v,x];u.push(f(y,w))}if(g<h-b){let y=p?[v,g]:[v,h],w=p?[v,h]:[v,g];u.push(f(y,w))}return u}return[t]}function Es(t,e,a,s){let r=e*12;t.setFloat32(r,a[0],!0),t.setFloat32(r+4,a[1],!0),t.setUint32(r+8,s,!0)}function Rb(t,e,a,s,r,n){let i=Xo(a,s,r);if(!i)return e;for(let o of i)Es(t,e,o,n),e+=1;return e}function Gr(t,e,a,s,r,n){return Es(t,e,a,n),Es(t,e+1,s,n),Es(t,e+2,r,n),e+3}function Ab(t,e){let a=Array.isArray(t?.layerIds)?t.layerIds:[];if(a.length<2&&t?.startLayerId!=null&&t?.endLayerId!=null&&(a=[t.startLayerId,t.endLayerId]),a.length<2&&t?.layerMask!=null)try{let s=BigInt(String(t.layerMask));a=e.filter((r,n)=>(s&1n<<BigInt(n))!==0n).map(r=>r.id)}catch{a=[]}return a}function _b(t){let e=t?.objectFeatureId??t?.id;if(e!=null&&Number.isFinite(Number(e))&&Number(e)!==0)return`feature:${Number(e)}`;let a=String(t?.sourceUid||"");return a?`source:${a}`:""}function Wo(t,e){let a=new Map(t.map((o,c)=>[Number(o.id),c])),s=new Map(t.map(o=>[Number(o.id),o])),r=new Map,n=new Set,i={thru:0,blind:0,buried:0};for(let o of e){let c=_b(o);if(c){if(n.has(c))continue;n.add(c)}let d=[...new Set(Ab(o,t).map(Number))].filter(y=>a.has(y)).sort((y,w)=>a.get(y)-a.get(w));if(d.length<2)continue;let b=d[0],f=d[d.length-1],v=a.get(b),x=a.get(f),h=v===0,l=x===t.length-1,g=h&&l?"thru":h||l?"blind":"buried";i[g]+=1;let u=`${b}:${f}:${g}`,p=r.get(u);if(p){p.count+=1;continue}r.set(u,{startId:b,endId:f,startName:s.get(b)?.name||String(b),endName:s.get(f)?.name||String(f),startIndex:v,endIndex:x,type:g,count:1})}return{counts:i,spans:[...r.values()]}}var Ma="http://www.w3.org/2000/svg";var Nb=new Set(["script","foreignobject","iframe","object","embed"]),Fb=new Set(["href","xlink:href"]),jb=1,Bb=18,Cb=8,Is=class t{static create(e,a,s,r,n={}){return new t(e,a,s,r,n)}constructor(e,a,s,r,n){this.host=e,this.manifestUrl=a,this.manifest=s,this.featuresByPage=r||{},this.callbacks=n,this.activePage=null,this.activeSvgUrl="",this.container=null,this.svg=null,this.overlay=null,this.mountedPages=new Map,this.loadingPages=new Map,this.svgCache=new Map,this.serial=0,this.maxMountedWorldPages=jb,this.maxCachedSvgPages=Bb,this.worldHandlersInstalled=!1,this.worldDrag=null,this.view={scale:1,tx:0,ty:0},this.drag=null,this.selected=null,this.highlightedNetUid="",this.index=Qo(),this.lastStats={mountedPages:0,domNodes:0,indexedFeatures:0,indexedNets:0,mountMs:0,coldMounts:0,warmMounts:0,highlightMs:0,selectionMs:0,cachedSvgPages:0,cachedSvgBytes:0,heapMb:null,fallbackReason:""}}get active(){return!!(this.container&&this.activePage)}get worldActive(){return this.mountedPages.size>0}stats(){return{...this.lastStats,activePage:this.activePage?.name||[...this.mountedPages.values()][0]?.page?.name||"-",mountedPages:this.active?1:this.mountedPages.size}}dispose(){this.unmountPage(),this.unmountWorldPages()}unmountPage(){this.container?.remove(),this.container=null,this.svg=null,this.overlay=null,this.activePage=null,this.activeSvgUrl="",this.index=Qo(),this.host.hidden=!0}unmountWorldPages(){for(let e of this.mountedPages.values())e.container.remove();this.mountedPages.clear(),this.loadingPages.clear(),this.active||(this.host.hidden=!0)}async preloadPages(e){let a=performance.now(),s=await Promise.allSettled((e||[]).slice(0,Cb).map(r=>this.loadSvgTemplate(r)));this.lastStats.preloadedPages=s.filter(r=>r.status==="fulfilled"&&r.value).length,this.lastStats.preloadMs=performance.now()-a,this.updateCacheStats()}syncWorldPages(e,a,s={}){if(!a)return;this.installWorldHandlers(a);let r=(e||[]).slice(0,s.maxMountedPages||this.maxMountedWorldPages),n=new Set(r.map(i=>i.id));for(let[i,o]of this.mountedPages)n.has(i)||(o.container.remove(),this.mountedPages.delete(i));for(let i of r){let o=this.mountedPages.get(i.id);if(o)o.lastUsed=++this.serial,this.positionWorldEntry(o,a);else if(!this.loadingPages.has(i.id)){let c=this.mountWorldPage(i).then(d=>{d&&n.has(i.id)?this.positionWorldEntry(d,a):d?.container.remove()}).finally(()=>this.loadingPages.delete(i.id));this.loadingPages.set(i.id,c)}}this.pruneMountedWorldPages(n),this.host.hidden=r.length===0&&!this.active,this.setSelection(this.selected),this.setHighlightedNet(s.activeNetUid??this.highlightedNetUid),this.lastStats.mountedPages=this.mountedPages.size,this.updateCacheStats()}async mountWorldPage(e){let a=performance.now(),s=this.hasCachedSvg(e),r=await this.loadImportedSvg(e);if(!r)return null;let n=document.createElement("div");n.className="svg-dom-page svg-dom-world-page",n.dataset.pageId=e.id,n.append(r),this.host.append(n);let i=Yo(r),o=$o(r),c=Jo(r,e,this.featuresByPage[e.id]||[]),d={page:e,container:n,svg:r,overlay:i,selectionOverlay:o,index:c,mountMs:performance.now()-a,lastUsed:++this.serial,warm:s};return this.mountedPages.set(e.id,d),this.lastStats={...this.lastStats,mountedPages:this.mountedPages.size,domNodes:[...this.mountedPages.values()].reduce((b,f)=>b+f.svg.querySelectorAll("*").length,0),indexedFeatures:[...this.mountedPages.values()].reduce((b,f)=>b+f.index.featureToElements.size,0),indexedNets:new Set([...this.mountedPages.values()].flatMap(b=>[...b.index.netToElements.keys()])).size,mountMs:d.mountMs,coldMounts:this.lastStats.coldMounts+(d.warm?0:1),warmMounts:this.lastStats.warmMounts+(d.warm?1:0),fallbackReason:""},this.updateCacheStats(),d}async loadImportedSvg(e){let a=await this.loadSvgTemplate(e);return a?a.cloneNode(!0):null}async loadSvgTemplate(e){let a=this.svgUrlForPage(e),s=this.svgCache.get(a);if(s?.template)return s.lastUsed=++this.serial,s.template;if(s?.promise)return s.promise;let r=performance.now(),n=(async()=>{let i=await fetch(a,{cache:"default"});if(!i.ok)return this.lastStats.fallbackReason=`Failed to load SVG page ${e.id}: ${i.status}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;let o=await i.text(),d=new DOMParser().parseFromString(o,"image/svg+xml"),b=d.documentElement;if(!b||b.localName.toLowerCase()!=="svg"||d.querySelector("parsererror"))return this.lastStats.fallbackReason=`Invalid SVG for page ${e.id}`,this.callbacks.onFallback?.(this.lastStats.fallbackReason),null;Ob(d,a,e.id);let f=document.importNode(b,!0);f.classList.add("svg-dom-page-svg"),Gb(f);let v=this.svgCache.get(a)||{};return Object.assign(v,{template:f,promise:null,pageId:e.id,byteLength:o.length*2,loadMs:performance.now()-r,lastUsed:++this.serial}),this.svgCache.set(a,v),this.pruneSvgCache(),this.updateCacheStats(),f})();return this.svgCache.set(a,{promise:n,pageId:e.id,byteLength:0,loadMs:0,lastUsed:++this.serial}),n}svgUrlForPage(e){return new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString()}positionWorldEntry(e,a){let{page:s,container:r}=e,[n,i]=a.worldToScreen(s.worldX,s.worldY),[o,c]=a.worldToScreen(s.worldX+s.widthMm,s.worldY+s.heightMm),d=Math.max(1,o-n),b=Math.max(1,c-i);r.style.transform=`translate3d(${n}px, ${i}px, 0)`,r.style.width=`${d}px`,r.style.height=`${b}px`}installWorldHandlers(e){if(this.worldHandlersInstalled)return;this.worldHandlersInstalled=!0;let a=this.host;a.oncontextmenu=s=>s.preventDefault(),a.onpointerdown=s=>{let r=s.button===0&&!s.shiftKey&&!!s.target.closest?.("text"),i=s.target.closest?.("[data-feature-key]")?null:this.featureAtEvent(s);this.worldDrag={pointerId:s.pointerId,startX:s.clientX,startY:s.clientY,lastX:s.clientX,lastY:s.clientY,button:s.button,moved:!1,pan:!r&&(s.button===0||s.button===1||s.shiftKey),allowTextSelection:r},r||a.setPointerCapture(s.pointerId)},a.onpointermove=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let r=s.clientX-this.worldDrag.lastX,n=s.clientY-this.worldDrag.lastY;this.worldDrag.lastX=s.clientX,this.worldDrag.lastY=s.clientY,Math.hypot(s.clientX-this.worldDrag.startX,s.clientY-this.worldDrag.startY)>3&&(this.worldDrag.moved=!0),this.worldDrag.pan&&e.pan(r,n)},a.onpointerup=s=>{if(!this.worldDrag||this.worldDrag.pointerId!==s.pointerId)return;let r=this.worldDrag;if(this.worldDrag=null,r.allowTextSelection||a.releasePointerCapture(s.pointerId),r.button!==0||r.moved)return;let n=s.target.closest?.("[data-feature-key]");if(n)this.selectElement(n,s);else{let i=this.featureAtEvent(s);i?this.selectFeature(i.entry,i.feature,s):this.callbacks.onBlank?.()}},a.ondblclick=s=>{let r=s.target.closest?.("[data-feature-key]"),n=r?null:this.featureAtEvent(s),i=n?.entry||this.entryForPoint(s.clientX,s.clientY),o=r?this.selectionFromElement(r):n?this.selectionFromFeature(n.entry,n.feature):this.selected;Zo(o)?this.callbacks.onOpenPage?.(o):o?.netUid?this.callbacks.onHighlightNet?.(o.netUid,o):!n&&i?.page&&this.callbacks.onOpenPage?.({kind:"page",pageId:i.page.id,page:i.page})},a.onwheel=s=>{s.preventDefault(),Math.abs(s.deltaX)>Math.abs(s.deltaY)*.65?e.pan(-s.deltaX,-s.deltaY):e.zoom(s.deltaY,s.clientX,s.clientY)}}async focusPage(e,a={}){if(!e)return!1;if(this.activePage?.id===e.id&&this.active)return a.frame!==!1&&this.fitPage(),!0;let s=performance.now(),r=await this.loadImportedSvg(e);if(!r)return!1;let n=document.createElement("div");return n.className="svg-dom-page",n.append(r),this.host.replaceChildren(n),this.host.hidden=!1,this.container=n,this.svg=r,this.activePage=e,this.activeSvgUrl=new URL(e.svg||e.thumbnail?.path,this.manifestUrl).toString(),this.overlay=Yo(r),this.selectionOverlay=$o(r),this.index=Jo(r,e,this.featuresByPage[e.id]||[]),this.installPageHandlers(),this.fitPage(),this.setSelection(this.selected),this.setHighlightedNet(this.highlightedNetUid),this.lastStats={...this.lastStats,mountedPages:1,domNodes:r.querySelectorAll("*").length,indexedFeatures:this.index.featureToElements.size,indexedNets:this.index.netToElements.size,mountMs:performance.now()-s,fallbackReason:""},this.updateCacheStats(),!0}installPageHandlers(){let e=this.host;e.oncontextmenu=a=>a.preventDefault(),e.onpointerdown=a=>{if(!this.active)return;let s=a.button===0&&!a.shiftKey&&!!a.target.closest?.("text"),r=a.target.closest?.("[data-feature-key]"),n=r?null:this.featureAtEvent(a);this.drag={pointerId:a.pointerId,startX:a.clientX,startY:a.clientY,lastX:a.clientX,lastY:a.clientY,button:a.button,moved:!1,pan:!s&&(a.button===0||a.button===1||a.shiftKey),featureElement:r,allowTextSelection:s},s||e.setPointerCapture(a.pointerId)},e.onpointermove=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=a.clientX-this.drag.lastX,r=a.clientY-this.drag.lastY;this.drag.lastX=a.clientX,this.drag.lastY=a.clientY,Math.hypot(a.clientX-this.drag.startX,a.clientY-this.drag.startY)>3&&(this.drag.moved=!0),this.drag.pan&&(this.view.tx+=s,this.view.ty+=r,this.applyTransform())},e.onpointerup=a=>{if(!this.drag||this.drag.pointerId!==a.pointerId)return;let s=this.drag;if(this.drag=null,s.allowTextSelection||e.releasePointerCapture(a.pointerId),s.button!==0||s.moved)return;let r=a.target.closest?.("[data-feature-key]");if(r)this.selectElement(r,a);else{let n=this.featureAtEvent(a);n?this.selectFeature(n.entry,n.feature,a):this.callbacks.onBlank?.()}},e.ondblclick=a=>{let s=a.target.closest?.("[data-feature-key]"),r=s?null:this.featureAtEvent(a),n=s?this.selectionFromElement(s):r?this.selectionFromFeature(r.entry,r.feature):this.selected;Zo(n)?this.callbacks.onOpenPage?.(n):n?.netUid?this.callbacks.onHighlightNet?.(n.netUid,n):!r&&this.activePage&&this.callbacks.onOpenPage?.({kind:"page",pageId:this.activePage.id,page:this.activePage})},e.onwheel=a=>{if(a.preventDefault(),!this.active)return;if(Math.abs(a.deltaX)>Math.abs(a.deltaY)*.65){this.view.tx-=a.deltaX,this.view.ty-=a.deltaY,this.applyTransform();return}let s=this.host.getBoundingClientRect(),r=a.clientX-s.left,n=a.clientY-s.top,i=this.screenToSvg(r,n),o=Math.exp(-a.deltaY*.0016);this.view.scale=Ts(this.view.scale*o,.02,80),this.view.tx=r-i[0]*this.view.scale,this.view.ty=n-i[1]*this.view.scale,this.applyTransform()}}selectElement(e,a){let s=performance.now(),r=this.selectionFromElement(e);if(this.setSelection(r),a){let n=this.host.getBoundingClientRect();r.anchor={x:a.clientX-n.left,y:a.clientY-n.top}}this.callbacks.onSelect?.(r),this.lastStats.selectionMs=performance.now()-s}selectFeature(e,a,s){let r=performance.now(),n=this.selectionFromFeature(e,a);if(this.setSelection(n),s){let i=this.host.getBoundingClientRect();n.anchor={x:s.clientX-i.left,y:s.clientY-i.top}}this.callbacks.onSelect?.(n),this.lastStats.selectionMs=performance.now()-r}selectionFromElement(e){let a=e.dataset.featureKey||"",s=this.entryForElement(e),r=s.index.featureByKey.get(a)||{};return this.selectionFromFeature(s,r,e)}selectionFromFeature(e,a,s=null){let r=a?.stableKey||s?.dataset?.featureKey||"",n=e?.page||this.activePage,i=a?.kind||s?.dataset?.role||s?.dataset?.primitive||"feature",o=a?.netUid||s?.dataset?.netUid||"",c=a?.netName||s?.dataset?.netName||"";return i==="sheet"?{kind:"sheet",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",sheetName:a?.sheet_name||a?.sheetName||s?.dataset?.sheetName||a?.objectId||"",sheetFile:a?.sheet_file||a?.sheetFile||s?.dataset?.sheetFile||"",feature:a}:i==="pin"||i==="pin_body"||i==="pin_name"||i==="pin_number"||s?.dataset?.pin?{kind:"pin",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",pinNumber:a?.pinNumber||s?.dataset?.pin||"",pinName:a?.pinName||"",netUid:o,netName:c,feature:a}:i==="symbol_body"||i==="symbol_instance"||i==="component"||s?.dataset?.ref?{kind:"component",featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",symbolUuid:a?.symbolUuid||s?.dataset?.symbolUuid||"",reference:a?.reference||s?.dataset?.designator||s?.dataset?.component||s?.dataset?.ref||"",netUid:o,netName:c,feature:a}:{kind:o?"feature":i,featureKey:r,sheetInstancePath:a?.sheetInstancePath||n?.sheetInstancePath||"",sourceId:a?.sourceId||s?.dataset?.sourceId||s?.dataset?.objectId||s?.dataset?.uuid||"",role:i,netUid:o,netName:c,feature:a}}setSelection(e){this.selected=e||null;for(let s of this.host.querySelectorAll(".prism-svg-selected"))s.classList.remove("prism-svg-selected");for(let s of this.host.querySelectorAll("[data-prism-overlay='selection']"))s.replaceChildren();let a=e?.featureKey||"";if(a){for(let s of this.entries()){for(let r of s.index.featureToElements.get(a)||[])r.classList.add("prism-svg-selected");this.drawSelectionOverlay(s,e)}for(let s of this.index.featureToElements.get(a)||[])s.classList.add("prism-svg-selected");this.drawSelectionOverlay({page:this.activePage,index:this.index,selectionOverlay:this.selectionOverlay},e)}}setHighlightedNet(e){this.highlightedNetUid=e||"";let a=performance.now();for(let s of this.entries())this.updateEntryHighlight(s);if(!this.svg||!this.overlay){this.lastStats.highlightMs=performance.now()-a;return}this.updateEntryHighlight({svg:this.svg,overlay:this.overlay,index:this.index,page:this.activePage}),this.lastStats.highlightMs=performance.now()-a}updateEntryHighlight(e){if(!e?.svg||!e?.overlay||(e.overlay.replaceChildren(),!this.highlightedNetUid))return;let a=Ms(e.svg,e.page),s=document.createElementNS(Ma,"rect");s.setAttribute("x",String(a[0])),s.setAttribute("y",String(a[1])),s.setAttribute("width",String(a[2])),s.setAttribute("height",String(a[3])),s.setAttribute("class","prism-svg-net-dimmer"),e.overlay.append(s);let n=(e.index.netToElements.get(this.highlightedNetUid)||[]).slice(0,2200);for(let i of n){let o=zb(i);e.overlay.append(o)}}entries(){return[...this.mountedPages.values()]}entryForElement(e){let s=e.closest?.(".svg-dom-page")?.dataset.pageId||"";return this.mountedPages.get(s)||{page:this.activePage,index:this.index,svg:this.svg,overlay:this.overlay,selectionOverlay:this.selectionOverlay}}featureAtEvent(e){let a=this.entryForPoint(e.clientX,e.clientY);if(!a)return null;let s=this.clientToSvg(a,e.clientX,e.clientY);if(!s)return null;let r=Math.max(.18,5*Hb(a)),i=a.index.features.filter(o=>(o?.domBoundsMm||o?.boundsMm)&&ac(o)).filter(o=>s[0]>=(o.domBoundsMm||o.boundsMm)[0]-r&&s[0]<=(o.domBoundsMm||o.boundsMm)[2]+r&&s[1]>=(o.domBoundsMm||o.boundsMm)[1]-r&&s[1]<=(o.domBoundsMm||o.boundsMm)[3]+r).map(o=>({feature:o,priority:Xb(o),area:Math.max(1e-4,((o.domBoundsMm||o.boundsMm)[2]-(o.domBoundsMm||o.boundsMm)[0])*((o.domBoundsMm||o.boundsMm)[3]-(o.domBoundsMm||o.boundsMm)[1]))})).sort((o,c)=>c.priority-o.priority||o.area-c.area)[0]?.feature;return i?{entry:a,feature:i,point:s}:null}entryForPoint(e,a){for(let s of[...this.entries()].reverse()){let r=s.container.getBoundingClientRect();if(e>=r.left&&e<=r.right&&a>=r.top&&a<=r.bottom)return s}if(this.container){let s=this.container.getBoundingClientRect();if(e>=s.left&&e<=s.right&&a>=s.top&&a<=s.bottom)return{page:this.activePage,container:this.container,svg:this.svg,index:this.index,selectionOverlay:this.selectionOverlay}}return null}clientToSvg(e,a,s){if(!e?.container||!e?.svg||!e?.page)return null;let r=e.container.getBoundingClientRect();if(!r.width||!r.height)return null;let n=Ms(e.svg,e.page);return[n[0]+(a-r.left)/r.width*n[2],n[1]+(s-r.top)/r.height*n[3]]}drawSelectionOverlay(e,a){if(!e?.selectionOverlay||!a?.featureKey)return;let s=e.index.featureByKey.get(a.featureKey),r=s?.domBoundsMm||s?.boundsMm;if(!r)return;let[n,i,o,c]=r,d=document.createElementNS(Ma,"rect");d.setAttribute("x",String(n)),d.setAttribute("y",String(i)),d.setAttribute("width",String(Math.max(.001,o-n))),d.setAttribute("height",String(Math.max(.001,c-i))),d.setAttribute("rx","0.65"),d.setAttribute("ry","0.65"),d.setAttribute("class","prism-svg-selection-box"),e.selectionOverlay.append(d)}fitPage(){if(!this.svg||!this.activePage)return;let e=Ms(this.svg,this.activePage),a=e[2]||this.activePage.sourceWidthMm||this.activePage.widthMm||1,s=e[3]||this.activePage.sourceHeightMm||this.activePage.heightMm||1,r=this.host.getBoundingClientRect(),n=Math.min(r.width/a,r.height/s)*.92;this.view.scale=Ts(n,.02,80),this.view.tx=(r.width-a*this.view.scale)/2-e[0]*this.view.scale,this.view.ty=(r.height-s*this.view.scale)/2-e[1]*this.view.scale,this.applyTransform()}frameSelection(e=this.selected){if(!e?.featureKey||!this.active){this.fitPage();return}let a=this.index.featureToElements.get(e.featureKey)||[],s=tc(a);if(!s)return;let r=this.host.getBoundingClientRect(),n=Math.max(1,s[2]-s[0]),i=Math.max(1,s[3]-s[1]),o=Math.min(r.width/n,r.height/i)*.36;this.view.scale=Ts(o,.04,80),this.view.tx=r.width/2-(s[0]+s[2])/2*this.view.scale,this.view.ty=r.height/2-(s[1]+s[3])/2*this.view.scale,this.applyTransform()}pan(e,a){this.active&&(this.view.tx+=e,this.view.ty+=a,this.applyTransform())}zoom(e,a,s){if(!this.active)return;let r=this.host.getBoundingClientRect(),n=(a??r.left+r.width/2)-r.left,i=(s??r.top+r.height/2)-r.top,o=this.screenToSvg(n,i),c=Math.exp(-e*.0016);this.view.scale=Ts(this.view.scale*c,.02,80),this.view.tx=n-o[0]*this.view.scale,this.view.ty=i-o[1]*this.view.scale,this.applyTransform()}screenToSvg(e,a){return[(e-this.view.tx)/Math.max(1e-6,this.view.scale),(a-this.view.ty)/Math.max(1e-6,this.view.scale)]}applyTransform(){this.container&&(this.container.style.transform=`translate3d(${this.view.tx}px, ${this.view.ty}px, 0) scale(${this.view.scale})`)}hasCachedSvg(e){return!!this.svgCache.get(this.svgUrlForPage(e))?.template}pruneMountedWorldPages(e=new Set){if(this.mountedPages.size<=this.maxMountedWorldPages)return;let a=[...this.mountedPages.entries()].filter(([s])=>!e.has(s)).sort((s,r)=>(s[1].lastUsed||0)-(r[1].lastUsed||0));for(let[s,r]of a){if(this.mountedPages.size<=this.maxMountedWorldPages)break;r.container.remove(),this.mountedPages.delete(s)}}pruneSvgCache(){let e=[...this.svgCache.entries()].filter(([,r])=>r?.template);if(e.length<=this.maxCachedSvgPages)return;let a=new Set([...this.mountedPages.values()].map(r=>this.svgUrlForPage(r.page)));this.activePage&&a.add(this.svgUrlForPage(this.activePage));let s=e.filter(([r])=>!a.has(r)).sort((r,n)=>(r[1].lastUsed||0)-(n[1].lastUsed||0));for(let[r]of s){if([...this.svgCache.values()].filter(n=>n?.template).length<=this.maxCachedSvgPages)break;this.svgCache.delete(r)}}updateCacheStats(){let e=[...this.svgCache.values()].filter(s=>s?.template);this.lastStats.cachedSvgPages=e.length,this.lastStats.cachedSvgBytes=e.reduce((s,r)=>s+(r.byteLength||0),0);let a=performance?.memory;this.lastStats.heapMb=a?.usedJSHeapSize?a.usedJSHeapSize/1048576:null}};function Ob(t,e,a){for(let n of[...t.querySelectorAll("*")]){if(Nb.has(n.localName.toLowerCase())){n.remove();continue}for(let i of[...n.attributes]){let o=i.name,c=o.toLowerCase(),d=i.value||"";if(c.startsWith("on")){n.removeAttribute(o);continue}if((c==="href"||c==="xlink:href"||c==="src")&&sc(d)){if((c==="href"||c==="xlink:href")&&n.localName.toLowerCase()==="image"&&Jb(d))continue;n.removeAttribute(o);continue}c==="style"&&n.setAttribute(o,$b(d))}}let s=`prism-${Vr(a)}-`,r=new Map;for(let n of t.querySelectorAll("[id]")){let i=n.getAttribute("id"),o=`${s}${Vr(i)}`;r.set(i,o),n.setAttribute("id",o)}for(let n of t.querySelectorAll("*"))for(let i of[...n.attributes]){let o=i.name.toLowerCase(),c=i.value||"";Fb.has(o)&&(c.startsWith("#")&&r.has(c.slice(1))?c=`#${r.get(c.slice(1))}`:Yb(c)&&(c=new URL(c,e).toString())),c=Qb(c,r),n.setAttribute(i.name,c)}}function Jo(t,e,a){let s=new Map,r=new Map,n=new Map,i=[];for(let b of a){let f=Lb(b,e);i.push(f),r.set(f.stableKey,f),n.set(Number(f.id||0),f);for(let v of Ub(f))s.has(v)||s.set(v,[]),s.get(v).push(f)}let o=new Map,c=new Map,d=new Map;for(let b of i)d.set(b.stableKey,b);for(let b of t.querySelectorAll("[data-uuid], [data-element-key], [data-primitive], [data-ref], [data-pin], [data-object-id], [data-designator], [data-component]")){let f=Pb(b,s,e);if(f&&!ac(f)||!f&&!Wb(b))continue;let v=Kb(b,e),x=f?.stableKey||v,h=f?.netUid||"",l=f?.netName||"";b.classList.add("prism-feature"),b.dataset.featureKey=x,b.dataset.sourceId=f?.sourceId||b.dataset.uuid||b.dataset.elementKey||"",b.dataset.role=f?.kind||b.dataset.primitive||b.dataset.ref||"feature",f?.id&&(b.dataset.featureId=String(f.id)),h&&(b.dataset.netUid=h),l&&(b.dataset.netName=l),b.id||(b.id=`prism-feature-${Vr(x)}`),ec(o,x,b),d.set(x,f||{id:0,stableKey:x,kind:b.dataset.role,sourceId:b.dataset.sourceId,sheetInstancePath:e.sheetInstancePath||""}),h&&ec(c,h,b)}for(let[b,f]of o){let v=d.get(b),x=tc(f);v&&x&&(v.domBoundsMm=Vb(v.boundsMm,x))}return{featureToElements:o,netToElements:c,featureByKey:d,byId:n,bySource:s,features:i}}function Pb(t,e,a){let r=[t.dataset.uuid,t.dataset.elementKey,t.dataset.sourceId,t.dataset.objectId,t.dataset.componentUid,t.dataset.componentUuid,t.dataset.ref&&`${t.dataset.ref}:${t.dataset.pin||""}`].filter(Boolean).flatMap(i=>e.get(i)||[]);if(!r.length)return null;let n=String(t.dataset.primitive||t.dataset.ref||t.dataset.pin||"").toLowerCase();return r.map(i=>({feature:i,score:Db(i,n,a)})).sort((i,o)=>o.score-i.score)[0].feature}function Db(t,e,a){let s=0,r=String(t.kind||"").toLowerCase();return t.sheetInstancePath===a.sheetInstancePath&&(s+=20),t.netUid&&(s+=4),e&&r.includes(e)&&(s+=8),e==="symbol"&&r==="symbol_body"&&(s+=12),(e==="label"||e==="port")&&(r.includes("label")||r.includes("port"))&&(s+=12),e==="sheet"&&r==="sheet"&&(s+=12),r!=="record"&&(s+=2),r.includes("pin")&&(s+=2),s}function Lb(t,e){let a=t.sourceId||t.sourceUid||t.uuid||t.objectId||t.stableKey||"";return{...t,id:Number(t.id||0),sourceId:a,stableKey:t.stableKey||`${e.sheetInstancePath||e.id}|${a}|0|${t.kind||"feature"}|0`,sheetInstancePath:t.sheetInstancePath||e.sheetInstancePath||""}}function Ub(t){let e=new Set([t.sourceId,t.sourceUid,t.uuid,t.objectId,t.stableKey].filter(Boolean).map(String));return t.reference&&t.pinNumber&&e.add(`${t.reference}:${t.pinNumber}`),t.componentDesignator&&e.add(t.componentDesignator),t.reference&&e.add(t.reference),[...e]}function Kb(t,e){let a=t.dataset.uuid||t.dataset.elementKey||t.dataset.objectId||t.dataset.ref||t.id||"svg",s=t.dataset.primitive||t.dataset.role||t.localName||"feature";return`${e.sheetInstancePath||e.id}|${a}|0|${s}|0`}function Gb(t){let e=document.createElementNS(Ma,"style");e.textContent=`
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
  `,t.prepend(e)}function Yo(t){let e=document.createElementNS(Ma,"g");return e.setAttribute("class","prism-svg-net-overlay"),e.setAttribute("data-prism-overlay","net-highlight"),t.append(e),e}function $o(t){let e=document.createElementNS(Ma,"g");return e.setAttribute("class","prism-svg-selection-overlay"),e.setAttribute("data-prism-overlay","selection"),e.style.pointerEvents="none",t.append(e),e}function zb(t){let e=t.cloneNode(!0);e.removeAttribute("id"),e.removeAttribute("data-feature-key"),e.removeAttribute("data-net-uid"),e.removeAttribute("data-net-name"),e.classList.add("prism-svg-net-overlay-clone");for(let a of[e,...Array.from(e.querySelectorAll?.("*")||[])])a instanceof SVGElement&&(a.removeAttribute("filter"),a.style.pointerEvents="none",a.style.stroke="#18ef52",a.style.fill="none",a.style.opacity="0.98",a.style.vectorEffect="non-scaling-stroke");return e}function tc(t){let e=null;for(let a of t)if(a.getBBox)try{let s=a.getBBox(),r=[s.x,s.y,s.x+s.width,s.y+s.height];e=e?[Math.min(e[0],r[0]),Math.min(e[1],r[1]),Math.max(e[2],r[2]),Math.max(e[3],r[3])]:r}catch{}return e}function Vb(t,e){return t?e?[Math.min(t[0],e[0]),Math.min(t[1],e[1]),Math.max(t[2],e[2]),Math.max(t[3],e[3])]:t:e}function Ms(t,e){let a=t.getAttribute("viewBox");if(a){let s=a.trim().split(/[\s,]+/).map(Number);if(s.length===4&&s.every(Number.isFinite))return s}return[0,0,e.sourceWidthMm||e.widthMm||1,e.sourceHeightMm||e.heightMm||1]}function Qo(){return{featureToElements:new Map,netToElements:new Map,featureByKey:new Map,byId:new Map,bySource:new Map,features:[]}}function Hb(t){let e=t?.container?.getBoundingClientRect?.();if(!t?.svg||!t?.page||!e?.width||!e?.height)return .1;let a=Ms(t.svg,t.page);return Math.max(a[2]/e.width,a[3]/e.height)}function qb(t){let e=String(t?.kind||"").toLowerCase(),a=String(t?.semanticRole||"").toLowerCase(),s=`${t?.sourceId||""} ${t?.objectId||""} ${t?.text||""}`.toLowerCase();return e.includes("page")||a.includes("page")||e.includes("background")||a.includes("background")||s.includes("background")||s.includes("sheet_header")||s.includes("sheet header")||s.includes("drawing-sheet")}function Xb(t){let e=String(t?.kind||t?.semanticRole||"").toLowerCase();return e.includes("pin")?90:e.includes("label")||e.includes("port")?78:e.includes("wire")||e.includes("bus")||e.includes("junction")?70:e.includes("symbol")||e.includes("component")?54:e.includes("image")?30:20}function ac(t){if(!t||qb(t))return!1;let e=String(t.kind||t.semanticRole||"").toLowerCase();return["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function Wb(t){let e=`${t?.dataset?.primitive||""} ${t?.dataset?.ref||""} ${t?.dataset?.role||""} ${t?.dataset?.objectId||""} ${t?.dataset?.text||""}`.toLowerCase();return!e||e.includes("background")||e.includes("sheet_header")||e.includes("sheet header")||e.includes("drawing-sheet")?!1:["pin","label","port","wire","bus","junction","no_connect","symbol","component","sheet","image","text"].some(a=>e.includes(a))}function Zo(t){return String(t?.kind||t?.feature?.kind||"").toLowerCase()==="sheet"}function ec(t,e,a){t.has(e)||t.set(e,[]),t.get(e).push(a)}function sc(t){let e=String(t||"").trim().toLowerCase();return!e||e.startsWith("#")?!1:e.startsWith("javascript:")||e.startsWith("data:")||e.startsWith("http://")||e.startsWith("https://")}function Jb(t){return/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(String(t||"").trim())}function Yb(t){let e=String(t||"").trim();return e&&!e.startsWith("#")&&!/^[a-z][a-z0-9+.-]*:/i.test(e)}function $b(t){return String(t||"").replace(/url\(([^)]+)\)/gi,(e,a)=>{let s=a.trim().replace(/^['"]|['"]$/g,"");return sc(s)?"none":e})}function Qb(t,e){let a=String(t||"");return a=a.replace(/url\(#([^)]+)\)/g,(s,r)=>e.has(r)?`url(#${e.get(r)})`:s),a=a.replace(/^#(.+)$/,(s,r)=>e.has(r)?`#${e.get(r)}`:s),a}function Vr(t){return String(t||"").trim().replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,96)||"item"}function Ts(t,e,a){return Math.max(e,Math.min(a,t))}var Ss=Object.freeze({restricted:{color:[.55,.57,.6,1],label:"Restricted"},loading:{color:[.7,.76,.82,1],label:"Loading\u2026"},building:{color:[.62,.72,.84,1],label:"Building 3D view\u2026"},missing:{color:[.78,.76,.7,1],label:"No 3D view"},failed:{color:[.86,.6,.56,1],label:"3D view failed"},unknown:{color:[.78,.76,.7,1],label:""}}),rc=Object.freeze([.001,0,0,0,0,.001,0,0,0,0,.001,0,0,0,0,1]);function Ia(t,e){let a=new Array(16);for(let s=0;s<4;s+=1)for(let r=0;r<4;r+=1)a[s*4+r]=t[r]*e[s*4]+t[4+r]*e[s*4+1]+t[8+r]*e[s*4+2]+t[12+r]*e[s*4+3];return a}function Zb([t,e,a]){return[1,0,0,0,0,1,0,0,0,0,1,0,t,e,a,1]}function ep([t,e,a]){return[t,0,0,0,0,e,0,0,0,0,a,0,0,0,0,1]}function nc(t,e){return Ia(rc,Ia(t,e))}function ic(t,e){let a=e.minMm,s=e.maxMm.map((r,n)=>Math.max(r-a[n],.2));return Ia(rc,Ia(t,Ia(Zb(a),ep(s))))}function oc(t,e,a){return t.restricted?"restricted":!t.assetId||!e?"missing":a==="loaded"?null:a==="failed"?"failed":e.status==="ready"?e.bundleUrl&&e.bundleToBoard?"loading":"building":Ss[e.status]?e.status:"unknown"}function Hr(t){return(t?.occurrences||[]).filter(e=>e.kind==="board"||e.restricted)}function cc(t){if(!t.length)return!1;let e=0;for(let a of t)if(!a.standIn)e+=1;else if(a.standIn==="loading")return!1;return e>0}var lc=512*1024*1024,tp=.65,ap=120,sp=12,rp=48,xc=230,np=40,ip=4,Qr=document,nt,L,Me,Cs,Os,Ps,ra,Ws,Ze,_s,Sa,ze,be,_e,Ns,Ds,Ra,Te,Z,Js,Ys,Ae,sa,Ht,Qe,zt,Y=t=>Qr.querySelector(t),Vt=t=>Qr.querySelectorAll(t);function vc(t=document){Qr=t,nt=Y("#app"),L=Y("#viewport"),Me=Y("#schematic-viewport"),Cs=Y("#schematic-dom-layer"),Os=Y("#schematic-flow-overlay"),Ps=Y("#bom-view"),ra=Y("#status")||{set textContent(e){}},Ws=Y("#viewer-kind")||{set textContent(e){}},Ze=Y("#selection")||{set textContent(e){}},_s=Y("#diagnostics")||{set innerHTML(e){}},Sa=Y("#scene-stats"),ze=Y("#layers"),be=Y("#search-controls"),_e=Y("#view-controls"),Ae=Y("#stackup-workspace-view"),Ns=Y("#fallback"),Ds=Y("#panel-labels"),Ra=Y("#schematic-labels"),Te=Y("#axis-gizmo"),Z=Y("#selection-card"),Js=Y("#primary-heading"),Ys=Y("#primary-description"),sa=Y("#mode-switch"),Ht=Y("#system-labels"),Qe=Y("#move-gizmo"),zt=Y("#system-help"),nt.classList.add("workspace-pcb")}function wc(){return{workspace:"pcb",mode:"3d",activeNetId:0,selectedFeatureId:0,selectedOccurrence:0,selectionAnchor:null,showBoard:!0,showComponents:!0,showPlaceholders:!0,realisticColors:!0,isolateNet:!1,savedShowBoard:!0,savedShowComponents:!0,preIsolationShowBoard:null,separation:0,dragging:!1,dragMode:"orbit",lastX:0,lastY:0,pointerStartX:0,pointerStartY:0,frameCpuMs:0,frameCpuP95Ms:0,frameIntervalMs:0,frameIntervalP95Ms:0,frameSamples:[],fps:0,frames:0,fpsAt:performance.now(),activeTab:"layers",selectedPageId:"",selectedSchematicFeature:null,schematicDragging:!1,schematicLastX:0,schematicLastY:0,schematicStartX:0,schematicStartY:0}}function ja(t={}){return{key:t.key??"board",topology:t.topology||window.__TOPOLOGY__||{},semanticGeometry:t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},viewerReadiness:t.readiness||{stage:"semantic-ready",progress:100},assetCache:t.assetCache||null,deferComponents:!!t.deferComponents,scene:op(),renderer:null,compareLayers:new Set,desiredCompareLayers:new Set,visible3dLayers:new Set,preIsolation3dLayers:null,preIsolationCompareLayers:null,highlightedNetIds:new Set,hiddenComponents:new Set,hiddenComponentRequest:null,loadedBytes:0,triangles:0,residentTileBytes:0,residentTileGpuBytes:0,residentTileTriangles:0,tileLoads:0,tileEvictions:0,tileSchedulerMs:0,lastTileScheduleAt:0,visibleTileIds:new Set,gpuBytes:0}}function op(){return{manifest:null,manifestUrl:"",layers:[],copperLayers:[],nets:[],features:new Map,tiles:new Map,loaded:new Set,loading:new Map,failed:new Map,residentTiles:new Map,componentFeatures:new Map,componentModelCounts:new Map,componentTier:"idle",componentEntries:[],componentsWantedAt:0,componentEvictions:0,runtimeBounds:null,occurrenceBounds:null,layerZOffsets:new Float32Array(256),layerZOffsetSignature:""}}function Ec(){return{key:"",started:0,from:new Map,current:new Map}}function kc(){return{phase:"idle",previous:new Set,target:new Set,previousOffsets:new Map,started:0}}function Tc(){return{manifest:null,manifestUrl:"",pages:[],byId:new Map,activeNetUid:"",visiblePages:[],fitted:!1,rendererMode:new URLSearchParams(location.search).get("schematicRenderer")||"svg-dom",domFallbackReason:""}}var m=wc(),E=ja(),k=null,ye=Ec(),q=kc(),P=Tc(),Ls=[],Us=1.5*1024*1024*1024,cp=5e3,N,$,Ve,K,ie,qt=new Map,Ft=performance.now(),xe=0,Fs=0,Ba=null,Ks=null,Gs=null,qr=!1,Ie=!1,$s=()=>!0,Aa=!0;!window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__&&document.getElementById("app")&&en().catch(t=>{console.error(t),ra&&(ra.textContent="Renderer failed"),Ns&&(Ns.hidden=!1,Ns.textContent=t.stack||t.message||String(t))});function Mc(t){let e=new Map((t.components||[]).map(s=>[s.uid,s])),a={};for(let s of t.terminals||[]){let r=s.net_uid;if(!r)continue;let n=e.get(s.component_uid)||{},i={designator:s.designator||n.designator||"",pin:s.pin||"",value:n.value||"",pcb_pad_id:s.pcb_pad_id||""};a[r]||(a[r]={terminals:[]});let o=a[r].terminals;o.some(c=>c.designator===i.designator&&c.pin===i.pin)||o.push(i)}return a}function lp(t,e=E){if(!t||!e.topology||!e.topology.physical_objects)return 0;let a=e.topology.physical_objects.find(r=>r.uid===t);if(!a||!a.source_ids||!a.source_ids.length)return 0;let s=a.source_ids[0];for(let[r,n]of e.scene.features.entries())if(n.sourceUid===s)return r;return 0}function Zr(t,e=E){return!t||!e.topology||!e.topology.components?null:e.topology.components.find(a=>a.designator===t)}function Rs(t,e){for(let a of Object.keys(t))delete t[a];Object.assign(t,e)}function Ic(){if(Fs&&(cancelAnimationFrame(Fs),Fs=0),window.removeEventListener("keydown",Rl),k){for(let t of k.boards.values())t.abort?.abort();k.scene.dispose(),k=null}else E.renderer?.dispose?.();E.renderer=null,N=null,$?.dispose?.(),$=null,Ve=null,Ba=null,$s=()=>!0,Aa=!0}function Sc(){return xe+=1,Ic(),Rs(m,wc()),E=ja(),Rs(ye,Ec()),Rs(q,kc()),Rs(P,Tc()),Ls=[],K=null,ie=null,qt=new Map,Ft=performance.now(),xe}function Rc(t){t===xe&&(xe+=1,Ic())}function _a(t){t===xe&&(Fs=requestAnimationFrame(e=>dg(e,t)))}function ge(t){return t===xe}async function en(t={}){let e=Sc(),a={};if(E.topology=t.topology||window.__TOPOLOGY__||{},E.topology&&!E.topology.net_details&&(E.topology.net_details=Mc(E.topology)),E.semanticGeometry=t.semanticGeometry||window.__SEMANTIC_GEOMETRY__||{},E.viewerReadiness=t.readiness||E.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},Ba=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,Gs=typeof t.onContextMenu=="function"?t.onContextMenu:null,Ks=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,$s=typeof t.isActive=="function"?t.isActive:()=>!0,Aa=t.workspaceScope!=="3d",E.assetCache=t.assetCache||null,E.deferComponents=!!t.deferComponents,m.gpuBudgetBytes=Us,vc(t.root||document),!nt||!L)throw new Error("Semantic viewer shell is missing required DOM nodes");return await fp(e,a,t.onPerformanceEvent),{performance:a,setSelection(s){Ie=!0;try{if(s?.occurrence!=null&&dp(s.occurrence),!s)Ne();else if(s?.netName||s?.netUid){let r=s.netUid&&E.scene.nets.find(n=>n.uid===s.netUid)||s.netName&&Dt(E.scene.nets,s.netName);r&&ia(Number(r.id),!0)}else s?.netId?ia(Number(s.netId),!0):s?.featureId?Ot(Number(s.featureId),!0):s?.reference&&rr(String(s.reference),!0)}finally{Ie=!1}},resize(){E.renderer?.resize(),N?.resize(),m.workspace==="pcb"&&m.mode==="layer"&&un()},setWorkspace(s){let r=s==="stackup"?"stackup":"pcb";m.workspace!==r&&kl(r)},setHiddenComponents(s){return wl(s)},getComponentReferences(){return[...E.scene.componentFeatures.keys()]},setHighlightedNets(s){return up(s)},setOccurrences(s){return Ip(s)},setStatsOverlay(s){nn(s)},stats(){return rn()},setLodOverride(s){E.renderer?.setLodOverride(s)},setGpuBudget(s){let r=Number(s);m.gpuBudgetBytes=Number.isFinite(r)&&r>0?r:Us;for(let n of k?k.boards.values():[E])n.tiersCheckedAt=0},pickAt(s,r){return Il(s,r)},projectComponent(s,r){return Og(s,r)},projectPoint(s,r){return Sl(s,r)},getViewState:tn,setViewMode:gl,setLayerVisible:bn,applyLayerPreset:pn,setShowBoard:gn,setShowComponents:mn,setShowPlaceholders:ml,setRealisticColors:yl,setSeparation:yn,showNetLayers:sr,setNetIsolation:Ct,dispose(){Rc(e)}}}function Bt(){!Ks||qr||(qr=!0,queueMicrotask(()=>{qr=!1,Ks?.(tn())}))}function tn(){let t=m.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;return{mode:m.mode,layers:E.scene.copperLayers.map(e=>({id:Number(e.id),name:String(e.name),color:En(ar(e)),visible:t.has(Number(e.id))})),showBoard:m.showBoard,showComponents:m.showComponents,showPlaceholders:m.showPlaceholders,realisticColors:m.realisticColors,separation:k?k.separation.get(Na())||0:m.separation,isolateNet:m.isolateNet,hasNet:!!m.activeNetId||it(),...k?{boards:Up(),selectedBoard:Na()}:{}}}function Qs(t){if(k?.move.enabled&&tr(),Ie)return;let e=E.renderer&&!E.renderer.identityOnly?E.renderer.occurrenceKeys[m.selectedOccurrence]:null;Ba?.(t&&e!=null?{...t,occurrence:e}:t)}function dp(t){let e=E.renderer?.occurrenceKeys.indexOf(String(t))??-1;e>=0&&(m.selectedOccurrence=e)}function an(t){if(!t||!E.renderer||E.renderer.identityOnly)return t;let e=E.renderer.occurrenceMatrices[m.selectedOccurrence];return e?Kt(e,t):t}function Ac(t,e=null){return t?{kind:"net",sourceContext:"3D",netName:String(t.name||""),netUid:String(t.uid||"")||void 0,netCode:Number(t.id||0)||void 0,featureId:Number(e?.id||0)||void 0,uuid:String(e?.sourceUid||"")||void 0}:null}function _c(t,e=E){if(!t)return null;let a=oa(t),s=String(t.padNumber||t.pin||t.pinNumber||""),r=e.scene.nets.find(n=>Number(n.id)===Number(t.netId||0));if(a&&s)return{kind:"terminal",sourceContext:"3D",reference:a,pin:s,netUid:r?.uid,netName:r?.name,netCode:r?Number(r.id):void 0,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0};if(a){let n=Zr(a,e);return{kind:"component",sourceContext:"3D",reference:a,componentUid:n?.uid,uuid:String(t.sourceUid||"")||void 0,featureId:Number(t.id||0)||void 0}}return Ac(r,t)}function Nc(){m.showBoard=!0,m.showComponents=!0,Wt(),typeof Se=="function"&&Se()}function it(){return na().size>0||!!k?.emphasisSets.length}function na(){let t=new Set(E.highlightedNetIds);return m.activeNetId&&t.add(Number(m.activeNetId)),t}function up(t){let e=Array.isArray(t)?t:[],a=Gn(E.scene.nets,e),s=it();E.highlightedNetIds=a,E.renderer?.setEmphasizedNetIds(a);let r=it();return r&&!s?Zs():!r&&s&&sn(),m.isolateNet&&r&&Xt(),pe(performance.now(),{force:!0}),{applied:a.size,requested:e.length}}function Zs(){(m.showBoard||m.showComponents)&&(m.savedShowBoard=m.showBoard,m.savedShowComponents=m.showComponents),m.showBoard=!1,m.showComponents=!1,Wt(),typeof Se=="function"&&Se()}function sn(){m.showBoard=m.savedShowBoard!==!1,m.showComponents=m.savedShowComponents!==!1,Wt(),typeof Se=="function"&&Se()}async function Fc(t,e,a={}){let s=t.semanticGeometry.assets?.scene_manifest||t.semanticGeometry.semantic_gltf?.path,r=performance.now();if(s){if(t.scene.manifestUrl=new URL(s,location.href).toString(),t.scene.manifest=await pp(t.scene.manifestUrl,t),a.scene_manifest_fetch_parse_ms=performance.now()-r,!ge(e))return!1;if(t.scene.manifest.schema!=="prism.semantic_gltf_a0")throw new Error(`Unsupported scene schema: ${t.scene.manifest.schema}`)}else t.scene.manifest={schema:"prism.semantic_gltf_partial.a0",bbox:null,layers:[],nets:[],objectFeatures:[],components:[],tiles:[],barrels:[]},a.scene_manifest_fetch_parse_ms=0;r=performance.now(),t.scene.layers=t.scene.manifest.layers||[],t.scene.copperLayers=t.scene.layers.filter(i=>i.role==="copper"||String(i.name).endsWith(".Cu")),t.scene.nets=t.scene.manifest.nets||[];for(let i of t.scene.manifest.objectFeatures||[])t.scene.features.set(Number(i.id),{...i,bounds:ua(i.boundsMm)});for(let i of t.scene.manifest.components||[])t.scene.componentFeatures.set(i.designator,i),t.scene.features.set(Number(i.featureId),{...i,kind:"component",sourceUid:i.uid,netId:0,bounds:null});for(let i of t.scene.manifest.tiles||[])t.scene.tiles.set(i.id,i);a.scene_manifest_index_ms=performance.now()-r;let n=Bc(t);for(let i of n)t.compareLayers.add(i),t.desiredCompareLayers.add(i);for(let i of t.scene.copperLayers)t.visible3dLayers.add(Number(i.id));return!0}async function fp(t,e={},a=null){let s=performance.now();if(!await Fc(E,t,e))return;let r=performance.now();if(E.renderer=await Gt.create(L),e.webgpu_renderer_create_ms=performance.now()-r,!ge(t)){E.renderer?.dispose?.(),E.renderer=null;return}E.renderer.setBarrels(E.scene.manifest.barrels||[]),Da(),r=performance.now();let n=await Lc(t);if(e.board_fetch_parse_upload_ms=performance.now()-r,!ge(t)||(E.scene.runtimeBounds=n||fa(E.scene.manifest.bbox),K=new la(E.scene.runtimeBounds),Aa&&(await hp(t),!ge(t)||(await bp(t),!ge(t)))))return;r=performance.now(),fn(),El(),Aa&&(Bg(),jg()),xl(),_l(),e.controls_and_bindings_ms=performance.now()-r;let i={"board-ready":"Board ready \xB7 components and semantic layers are still generating","components-ready":"Board and components ready \xB7 semantic layers are still generating","semantic-ready":"WebGPU semantic glTF active"};if(ra.textContent=i[E.viewerReadiness.stage]||"Loading 3D assets",E.semanticGeometry.assets?.components_glb&&!E.deferComponents){let o=performance.now();nl(t).then(()=>{ge(t)&&(Jr(n),a?.({schema:"prism.semantic_viewer_performance.a0",milestone:"components-loaded",readiness_stage:E.viewerReadiness.stage,elapsed_ms:performance.now()-o,bytes_loaded:E.loadedBytes}))})}else Jr(n);pe(performance.now(),{force:!0}),_a(t),r=performance.now(),await new Promise(o=>requestAnimationFrame(o)),e.first_frame_wait_ms=performance.now()-r,e.boot_total_ms=performance.now()-s}async function hp(t=xe){let e=E.semanticGeometry.assets?.schematic_native_manifest||E.semanticGeometry.schematic_vector?.path||E.semanticGeometry.schematic_scene?.path,a=E.semanticGeometry.assets?.schematic_manifest||E.semanticGeometry.schematic_world?.path,s=Y("[data-workspace=schematic]");if(!e&&!a){s.disabled=!0,s.title="No schematic world assets are available";return}let r=[e,a].filter(Boolean),n=null;for(let o of r)try{P.manifestUrl=new URL(o,location.href).toString();let c=await ks.create(Me,P.manifestUrl);if(!ge(t))return;N=c,N.setFlowOverlayCanvas(Os);break}catch(c){if(n=c,N=null,o===a)throw c}if(!N)throw n||new Error("Failed to load schematic viewer assets");P.manifest=N.manifest,P.pages=N.pages,P.byId=new Map(P.pages.map(o=>[o.id,o])),m.selectedPageId=P.pages[0]?.id||"",N.selectedPageId=m.selectedPageId,!["native","legacy","webgpu"].includes(String(P.rendererMode).toLowerCase())&&($=Is.create(Cs,P.manifestUrl,P.manifest,N.featuresByPage,{onSelect:kg,onBlank:Pa,onHighlightNet:bl,onOpenPage:wg,onFallback:o=>{P.domFallbackReason=o,console.warn(o)}}),$.preloadPages(P.pages)),N.preloadOverview()}async function bp(t=xe){let e=E.semanticGeometry.assets?.bom||E.semanticGeometry.bom?.path,a=Y("[data-workspace=bom]");if(!e){a&&(a.disabled=!0,a.title="No BoM artifact is available");return}try{let s=await qa.create(Ps,new URL(e,location.href).toString(),{onSelectReference:r=>rr(r,!0)});if(!ge(t))return;Ve=s}catch(s){if(!ge(t))return;console.warn(s),a&&(a.disabled=!0,a.title=s?.message||"BoM artifact could not be loaded")}}async function pp(t,e=E){if(e.assetCache)return e.assetCache.fetchJson(String(t));let a=await fetch(t,{cache:"default"});if(!a.ok)throw new Error(`Failed to load ${t}: ${a.status}`);return a.json()}async function gp(t,e=xe,a=E){if(!ge(e))return;let s=a.scene.residentTiles.get(t.id);if(s){s.lastUsed=performance.now();return}if(a.scene.failed.get(t.id))return;if(a.scene.loading.has(t.id))return a.scene.loading.get(t.id);let n=(async()=>{try{let i=await ma(new URL(t.path,a.scene.manifestUrl).toString(),{fetchBytes:Hs(a),fetchCache:"no-store"});if(!ge(e)||!a.renderer)return;a.loadedBytes+=i.byteLength;let o=a.scene.layers.find(v=>Number(v.id)===Number(t.layerId)),c=[],d=0,b=0;for(let v of i.primitives){let x=a.renderer.addPrimitive(v,{kind:"copper",tileId:t.id,layerId:Number(t.layerId),innerCopper:Tp(Number(t.layerId),a),color:ll(o,a),stencilMark:cl(o,a),baseZ:Number(o?.z_mm||0)/1e3,material:{baseColor:[1,1,1,1],metallic:.78,roughness:.32}});c.push(x),d+=v.indices.length/3,b+=mp(v)}let f={tile:t,entries:c,byteLength:i.byteLength,gpuBytes:b,triangles:d,lastUsed:performance.now(),pinned:!1};a.scene.residentTiles.set(t.id,f),a.scene.loaded.add(t.id),a.tileLoads+=1,a.residentTileBytes+=i.byteLength,a.residentTileGpuBytes+=b,a.residentTileTriangles+=d,a.triangles=a.residentTileTriangles,a.scene.failed.delete(t.id)}catch(i){if(!ge(e))return;let o=a.scene.failed.get(t.id)||{count:0,message:""};a.scene.failed.set(t.id,{count:o.count+1,message:i?.message||String(i)}),o.count||console.warn(`Failed to load tile ${t.id}; suppressing retries until assets are regenerated`,i)}finally{ge(e)&&a.scene.loading.delete(t.id)}})();return a.scene.loading.set(t.id,n),n}function mp(t){return t.position.length/3*np+t.indices.length*ip}function yp(t,e=E){let a=e.scene.residentTiles.get(t);a&&(e.renderer.removeEntries(a.entries),e.scene.residentTiles.delete(t),e.scene.loaded.delete(t),e.residentTileBytes=Math.max(0,e.residentTileBytes-a.byteLength),e.residentTileGpuBytes=Math.max(0,e.residentTileGpuBytes-a.gpuBytes),e.residentTileTriangles=Math.max(0,e.residentTileTriangles-a.triangles),e.triangles=e.residentTileTriangles,e.tileEvictions+=1)}function pe(t=performance.now(),e={},a=E){if(!a.renderer||!K||m.workspace!=="pcb")return;let s=m.mode==="layer"&&q.phase==="preload";if(!e.force&&!s&&t-a.lastTileScheduleAt<ap)return;let r=performance.now();a.lastTileScheduleAt=t;let n=xp(a);a.visibleTileIds=n;let i=a.scene.loading.size,c=Math.max(0,(s?rp:sp)-i),d=[...n].map(f=>a.scene.tiles.get(f)).filter(f=>f&&!a.scene.residentTiles.has(f.id)&&!a.scene.loading.has(f.id)&&!a.scene.failed.has(f.id)).sort((f,v)=>uc(f,a)-uc(v,a)).slice(0,c),b=xe;for(let f of d)gp(f,b,a);for(let f of n){let v=a.scene.residentTiles.get(f);v&&(v.lastUsed=t)}Oc(n,void 0,a),a.tileSchedulerMs=performance.now()-r}function xp(t=E){let e=new Set,a=m.mode==="3d"?t.visible3dLayers:vp();if(!a.size||!ie)return e;if(m.mode==="layer"){for(let n of t.scene.tiles.values())a.has(Number(n.layerId))&&e.add(n.id);return e}let s=new Set,r=Xc(t);if(r.size){for(let n of t.scene.tiles.values())if(a.has(Number(n.layerId))){for(let i of r)if(Dc(n,i)){s.add(n.id);break}}}for(let n of t.scene.tiles.values()){if(!a.has(Number(n.layerId)))continue;let i=m.mode==="layer"?qt.get(Number(n.layerId)):null;Ep(n,ie.matrix,i,tp,t)&&e.add(n.id)}for(let n of s)e.add(n);return e}function vp(){return m.mode!=="layer"||q.phase==="idle"?E.compareLayers:Cc(q.previous,q.target)}function jc(){return m.mode!=="layer"?E.visible3dLayers:q.phase==="reveal"?Cc(q.previous,q.target):E.compareLayers}function Bc(t=E){let e=t.scene.copperLayers.map(a=>Number(a.id)).filter(Number.isFinite);return e.length?e.length===1?new Set([e[0]]):new Set([e[0],e[e.length-1]]):new Set}function wp(){let t=E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers;return t.size?new Set([...t].map(Number)):Bc()}function Cc(...t){let e=new Set;for(let a of t)for(let s of a||[])e.add(Number(s));return e}function Oc(t,e=lc,a=E){if(m.mode==="layer")return;let s=Math.min(lc,e);if(a.residentTileGpuBytes<=s)return;let r=[...a.scene.residentTiles.values()].filter(n=>!t.has(n.tile.id)&&!a.scene.loading.has(n.tile.id)).sort((n,i)=>n.lastUsed-i.lastUsed);for(let n of r){if(a.residentTileGpuBytes<=s)break;yp(n.tile.id,a)}}function Ep(t,e,a=null,s=0,r=E){let n=Pc(t,r);if(!n)return!0;let i=Math.max(n[3]-n[0],n[4]-n[1])*s,o=[n[0]-i+(a?.[0]||0),n[1]-i+(a?.[1]||0),n[2]-.002,n[3]+i+(a?.[0]||0),n[4]+i+(a?.[1]||0),n[5]+.002],c=r.renderer?.occurrenceMatrices;return!c||c.length===1&&va(c[0])?dc(o,e):c.some(d=>dc(o,Ha(e,d)))}function Pc(t,e=E){let a=t.boundsMm;if(!a||a.length!==4)return null;let s=e.scene.layers.find(n=>Number(n.id)===Number(t.layerId)),r=Number(s?.z_mm||0)/1e3;return[a[0]/1e3,-a[3]/1e3,r-4e-4,a[2]/1e3,-a[1]/1e3,r+4e-4]}function dc(t,e){let a=[[t[0],t[1],t[2]],[t[3],t[1],t[2]],[t[0],t[4],t[2]],[t[3],t[4],t[2]],[t[0],t[1],t[5]],[t[3],t[1],t[5]],[t[0],t[4],t[5]],[t[3],t[4],t[5]]].map(r=>kp(e,r));return![r=>r[0]<-r[3],r=>r[0]>r[3],r=>r[1]<-r[3],r=>r[1]>r[3],r=>r[2]<0,r=>r[2]>r[3]].some(r=>a.every(r))}function kp(t,e){let a=e[0],s=e[1],r=e[2];return[t[0]*a+t[4]*s+t[8]*r+t[12],t[1]*a+t[5]*s+t[9]*r+t[13],t[2]*a+t[6]*s+t[10]*r+t[14],t[3]*a+t[7]*s+t[11]*r+t[15]]}function Dc(t,e){return Array.isArray(t.netIds)&&t.netIds.some(a=>Number(a)===Number(e))}function uc(t,e=E){let a=Pc(t,e);if(!a||!K)return 0;let s=(a[0]+a[3])*.5-K.focus[0],r=(a[1]+a[4])*.5-K.focus[1];return s*s+r*r}async function Lc(t=xe,e=E){let a=e.semanticGeometry.assets?.base_board_glb;if(!a)return null;let s=e.semanticGeometry.assets?.soldermask_glb,[r,n]=await Promise.all([ma(new URL(a,location.href).toString(),{defaultFeatureId:0,fetchBytes:Hs(e)}),s?ma(new URL(s,location.href).toString(),{defaultFeatureId:0,fetchBytes:Hs(e)}).catch(o=>(console.warn("[prism-semantic-viewer] solder mask failed to load",o),null)):null]);if(!ge(t)||!e.renderer)return null;e.loadedBytes+=r.byteLength,n&&(e.loadedBytes+=n.byteLength);let i=[...r.primitives.filter(o=>{let c=hr(o);return c!=="pad"&&!(n&&c==="soldermask")}),...n?.primitives||[]];for(let o of Xa(i,hr))e.renderer.addPrimitive(o,{kind:"board",boardRole:o.groupKey,layerId:o.groupKey==="paste"?rg(o,e):0,material:o.material,color:o.material.baseColor});return $t(i.map(o=>o.bounds))}function jt(t=E){return t.scene.occurrenceBounds||t.scene.runtimeBounds||fa(t.scene.manifest?.bbox)}function Tp(t,e=E){return Bn(t,e.scene.copperLayers)}function Uc(t,e){let{back:a}=K.basis();return{eye:We(K.focus,Ce(a,K.distance)),orthographic:e,pixelScale:e?t/Math.max(1e-9,K.orthoScale):t/2/Math.tan(K.fov/2)}}function rn(){if(k)return Mp();let t=E.renderer?.cullCounts||{full:0,board:0,box:0,culled:0},e=!E.renderer||E.renderer.identityOnly;return{occurrences:E.renderer?.occurrenceMatrices.length||0,lod:e?{full:1,board:0,box:0,culled:0}:{...t},triangles:E.renderer?.frameStats.triangles||0,draws:E.renderer?.frameStats.draws||0,gpuMemoryBytes:E.renderer?.gpuMemoryBytes()||0,gpuBudgetBytes:m.gpuBudgetBytes,componentTier:E.scene.componentTier,componentEvictions:E.scene.componentEvictions,tileEvictions:E.tileEvictions,cache:E.assetCache?E.assetCache.summary():{enabled:!1},frameIntervalMs:m.frameIntervalMs,frameIntervalP95Ms:m.frameIntervalP95Ms,frameCpuMs:m.frameCpuMs,frameCpuP95Ms:m.frameCpuP95Ms,fps:m.fps}}function Mp(){let t=He(),e=t.map(a=>a.scene.componentTier);return{occurrences:k.scene.occurrenceCount||0,lod:k.scene.cullCounts(),triangles:k.scene.frameStats.triangles,draws:k.scene.frameStats.draws,gpuMemoryBytes:k.scene.gpuMemoryBytes(),gpuBudgetBytes:m.gpuBudgetBytes,componentTier:`${e.filter(a=>a==="loaded").length}/${t.length} loaded`,componentEvictions:t.reduce((a,s)=>a+s.scene.componentEvictions,0),tileEvictions:t.reduce((a,s)=>a+s.tileEvictions,0),cache:t.find(a=>a.assetCache)?.assetCache.summary()||{enabled:!1},frameIntervalMs:m.frameIntervalMs,frameIntervalP95Ms:m.frameIntervalP95Ms,frameCpuMs:m.frameCpuMs,frameCpuP95Ms:m.frameCpuP95Ms,fps:m.fps,firstFrame:k.timing.boardsDrawnAt==null?null:{sinceSceneMs:k.timing.boardsDrawnAt-k.timing.descriptorAt,sinceNavigationMs:k.timing.boardsDrawnAt}}}function nn(t){m.showStats=!!t,Sa&&(Sa.hidden=!m.showStats),Kc()}function Kc(){if(!Sa||!m.showStats)return;let t=rn(),{full:e,board:a,box:s,culled:r}=t.lod,n=[["Occurrences",`${t.occurrences} (${e+a+s} visible)`],["Detail",`${e} full \xB7 ${a} board \xB7 ${s} box \xB7 ${r} culled`],["Triangles",t.triangles.toLocaleString()],["Draws",t.draws.toLocaleString()],["GPU memory",`${(t.gpuMemoryBytes/1048576).toFixed(1)} / ${(t.gpuBudgetBytes/1048576).toFixed(0)} MB`],["Components",`${t.componentTier}${t.componentEvictions?` \xB7 ${t.componentEvictions} evicted`:""}`],["Cache",t.cache.enabled?`${t.cache.hits} hits \xB7 ${t.cache.misses} misses \xB7 ${(t.cache.bytes/1048576).toFixed(0)} MB`:"off"],["Frame",`${t.frameIntervalMs.toFixed(1)} ms \xB7 p95 ${t.frameIntervalP95Ms.toFixed(1)}`],["CPU",`${t.frameCpuMs.toFixed(2)} ms \xB7 p95 ${t.frameCpuP95Ms.toFixed(2)}`],["FPS",t.fps.toFixed(0)]];Sa.innerHTML=n.map(([i,o])=>`<dt>${i}</dt><dd>${o}</dd>`).join("")}function Ip(t){if(!E.renderer)return;E.renderer.setOccurrences(t),t==null&&(E.deferComponents=!1),m.selectedOccurrence>=E.renderer.occurrenceMatrices.length&&(m.selectedOccurrence=0);let e=E.scene.runtimeBounds||fa(E.scene.manifest?.bbox);E.renderer.setBoardBounds(e),E.scene.occurrenceBounds=t==null?null:no(E.renderer.occurrenceMatrices,e);let a=jt();K&&a&&(K.sceneRadius=Yt(a),K.frame(a),!m.occurrencesFramed&&t!=null&&(K.snap(),m.occurrencesFramed=!0)),pe(performance.now(),{force:!0})}var Sp="prism.system_scene.a0";function He(){return k?[...k.boards.values()].filter(t=>t.renderer&&t.loadState==="loaded"):[]}async function Gc(t={}){let e=Sc();if(Ba=typeof t.onSelectionChange=="function"?t.onSelectionChange:null,Gs=typeof t.onContextMenu=="function"?t.onContextMenu:null,Ks=typeof t.onViewStateChange=="function"?t.onViewStateChange:null,$s=typeof t.isActive=="function"?t.isActive:()=>!0,Aa=!1,m.gpuBudgetBytes=Us,vc(t.root||document),!nt||!L)throw new Error("Semantic viewer shell is missing required DOM nodes");if(typeof t.loadBundle!="function")throw new Error("A system scene needs a bundle loader");let a=await ys.create(L);return ge(e)?(k={scene:a,loadBundle:t.loadBundle,onEmphasis:typeof t.onEmphasis=="function"?t.onEmphasis:null,onStatus:typeof t.onStatus=="function"?t.onStatus:null,onMove:typeof t.onMove=="function"?t.onMove:null,baseDescriptor:null,descriptor:null,move:qp(),gizmo:null,standInKey:null,showLabels:!0,timing:{descriptorAt:null,boardsDrawnAt:null},boards:new Map,groups:new Map,placed:[],placements:new Map,hiddenLayers:new Map,separation:new Map,bounds:null,framed:!1,snapped:!1,boardSelected:!1,inputs:new Map,emphasisSets:[],emphasisBounds:new Map,emphasisReport:null,statusKey:""},E=ja({key:""}),K=new la([-.1,-.1,-.01,.1,.1,.01]),fn(),El(),xl(),_l(),ra.textContent="System scene",_a(e),{setSystemScene:Rp,setNetEmphasis:Kp,frameNetEmphasis:Gp,frameAll(){k?.bounds&&K.frame(k.bounds)},setMoveAllowed:Xp,setMoveMode:Vs,setMoveSpace:el,previewPose:Wp,cancelMove:dn,getMoveState:()=>k?Zc():null,setLabelsVisible(s){k&&(k.showLabels=!!s,Ht&&(Ht.hidden=!k.showLabels))},setHelpVisible:rl,frameBoard(s){let r=k?.placements.get(String(s));return r&&K.frame(r.worldBounds),!!r},frameParts:zp,setSelection(s){Ie=!0;try{s?jp(s):Ne()}finally{Ie=!1}},resize(){k?.scene.resize()},setStatsOverlay:nn,stats:rn,setLodOverride(s){for(let r of He())r.renderer.setLodOverride(s)},setGpuBudget(s){let r=Number(s);m.gpuBudgetBytes=Number.isFinite(r)&&r>0?r:Us;for(let n of k?.boards.values()||[])n.tiersCheckedAt=0},pickAt(s,r){return Il(s,r)},projectPoint(s,r){return Cp(s,r)},getViewState:tn,setLayerVisible:bn,applyLayerPreset:pn,setShowBoard:gn,setShowComponents:mn,setShowPlaceholders:ml,setRealisticColors:yl,setSeparation:yn,setNetIsolation:Ct,showNetLayers:sr,dispose(){Rc(e)}}):(a.dispose(),null)}function Rp(t){if(!k)return;if(t?.schema!==Sp)throw new Error(`Unsupported system scene schema: ${t?.schema||"missing"}`);k.baseDescriptor=t,k.timing.descriptorAt??=performance.now();let e=k.move.target?t.occurrences.find(s=>s.path===k.move.target):null;e?!k.move.drag&&$c(k.move.preview,e.pose)&&(k.move.preview=null):(k.move.drag=null,k.move.preview=null,k.move.target=null),k.descriptor=Qc();let a=new Set;for(let s of t.assets||[]){a.add(s.assetId);let r=k.boards.get(s.assetId);if(r&&r.bundleUrl===s.bundleUrl&&r.loadState!=="failed"){r.asset=s;continue}r&&fc(s.assetId);let n=ja({key:s.assetId,topology:{},semanticGeometry:{},deferComponents:!0});Object.assign(n,{asset:s,bundleUrl:s.bundleUrl,loadState:"waiting",abort:null}),k.boards.set(s.assetId,n),s.status==="ready"&&s.bundleUrl&&s.bundleToBoard&&Ap(n,xe)}for(let s of[...k.boards.keys()])a.has(s)||fc(s);zs(),k.move.enabled&&(tr({quiet:!0}),et("sync"))}function fc(t){let e=k.boards.get(t);e?.abort?.abort(),k.boards.delete(t),k.scene.removeAsset(t),e&&(e.renderer=null),E===e&&on()}async function Ap(t,e){t.loadState="loading",t.abort=new AbortController;let a=()=>ge(e)&&k?.boards.get(t.key)===t&&!t.abort.signal.aborted;try{let s=await k.loadBundle(t.bundleUrl,t.abort.signal);if(!a()||(t.topology=s.topology||{},t.topology.net_details||(t.topology.net_details=Mc(t.topology)),t.semanticGeometry=s.semanticGeometry||{},t.viewerReadiness=s.readiness||t.semanticGeometry.readiness||{stage:"semantic-ready",progress:100},t.assetCache=s.assetCache||null,!await Fc(t,e)||!a()))return;t.renderer=k.scene.asset(t.key),t.renderer.setBarrels(t.scene.manifest.barrels||[]),Da(t);let r=await Lc(e,t);if(!a())return;t.scene.runtimeBounds=r||fa(t.scene.manifest.bbox),t.renderer.setBoardBounds(t.scene.runtimeBounds),t.loadState="loaded",zs()}catch(s){if(!a())return;console.warn(`[prism-semantic-viewer] system board ${t.key} failed to load`,s),t.loadState="failed",t.error=s?.message||String(s),k.scene.removeAsset(t.key),t.renderer=null,E===t&&on(),zs()}}function zs({relabel:t=!0}={}){let e=k?.descriptor;if(!e)return;let a=Na(),s=new Map((e.assets||[]).map(o=>[o.assetId,o])),r=new Map,n=[];for(let o of Hr(e)){let c=o.assetId?s.get(o.assetId):null,d=o.assetId?k.boards.get(o.assetId):null,b=oc(o,c,d?.loadState),f,v,x;if(!b)f=d.key,v=nc(o.worldMatrix,c.bundleToBoard),x=Kt(v,d.scene.runtimeBounds);else{if(!o.boundsMm)continue;f=`stand-in:${b}`,k.scene.standIn(f,Ss[b].color),v=ic(o.worldMatrix,o.boundsMm),x=Kt(v,[0,0,0,1,1,1])}r.has(f)||r.set(f,[]),r.get(f).push({matrix:v,key:o.path,hiddenLayers:b?[]:[...k.hiddenLayers.get(o.path)||[]],explode:b?null:Wc(d,k.separation.get(o.path)||0)}),n.push({occurrence:o,rendererId:f,board:b?null:d,matrix:v,worldBounds:x,standIn:b})}for(let o of k.scene.assets.keys())r.has(o)||r.set(o,[]);k.scene.setOccurrences(r),k.groups=r;let i=k.placements;if(k.placed=n,k.placements=new Map(n.map(o=>[o.occurrence.path,o])),t||!i)ag();else for(let o of n)o.label=i.get(o.occurrence.path)?.label;k.bounds=$t(n.map(o=>o.worldBounds)),k.bounds&&(K.sceneRadius=Yt(k.bounds),k.framed||(K.frame(k.bounds),k.snapped||K.snap(),k.snapped=!0,n.some(o=>o.standIn==="loading")||(k.framed=!0)));for(let o of He())er(o);a!=null&&(k.placements.get(a)?.board===E?m.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(a):on()),Jc(),Vp(),Bt()}function Na(){return!k||!E.renderer||!zc()?null:E.renderer.occurrenceKeys[m.selectedOccurrence]??null}function zc(){return!!(m.selectedFeatureId||m.activeNetId||k?.boardSelected)}function Vc(t){if(E===t)return;let e=Ie;Ie=!0;try{Ne()}finally{Ie=e}E=t,Se()}function on(){Ne(),E=ja({key:""}),Se()}function _p(t,e){let a=performance.now(),s=Math.max(0,t-Ft),r=Math.min(.05,(t-Ft)/1e3);Ft=t,K.update(r),k.scene.resize(),ie={layerId:0,viewport:{x:0,y:0,width:L.width,height:L.height},matrix:K.matrix(L.width,L.height,!1),lod:Uc(L.height,!1)};let n=it(),i=new Map;for(let o of He()){let c=Pp(o);o.scene.copperRealism!==Fa()&&Da(o),o.renderer.setInnerCopperAtFull(m.showBoard&&!Dp(o)&&!n),o.renderer.dimCopper=n,pe(t,{},o);let d=o===E;i.set(o.renderer,{activeNetId:d?m.activeNetId:0,selectedFeatureId:d?m.selectedFeatureId:0,time:t/1e3,layerOffsets:c,visibleLayers:o.visible3dLayers,showBoard:m.showBoard,showComponents:m.showComponents,showPaste:!0,componentOpacity:1,boardOpacity:n?.34:1,isolateNet:m.isolateNet,compareMode:!1,compareOffsets:new Map,layerAlphas:null,visibleTileIds:o.visibleTileIds})}k.inputs=i,k.scene.setSelectedOccurrence(E.renderer&&zc()?E.renderer.occurrenceBase+m.selectedOccurrence:-1),k.scene.render(ie,o=>i.get(o)||Hc(t)),Al(),sg(),Yp(),k.timing.boardsDrawnAt==null&&cc(k.placed)&&(k.timing.boardsDrawnAt=performance.now());for(let o of He())il(t,o);Yr(s,performance.now()-a),$r(t),_a(e)}function Hc(t){return{activeNetId:0,selectedFeatureId:0,time:t/1e3,visibleLayers:new Set,showBoard:!0,showComponents:!1,componentOpacity:1,boardOpacity:1,isolateNet:!1}}function Np(t,e){let a=performance.now();return k.scene.pick(ie,t,e,s=>k.inputs.get(s)||Hc(a))}function Fp(t){let e=t.occurrenceKey!=null?k.placements.get(t.occurrenceKey):null;if(!e)return Ne();if(e.standIn)return qc(e);let a=e.board;if(m.isolateNet&&!Bp(a,e.occurrence.path,t.featureId))return Ne();Vc(a),m.selectedOccurrence=a.renderer.occurrenceKeys.indexOf(e.occurrence.path),t.featureId&&!k.move.enabled?Ot(t.featureId,!0):wn()}function jp(t){let e=t.occurrence!=null?k?.placements.get(String(t.occurrence)):null;if(e){if(e.standIn){qc(e);return}if(Vc(e.board),m.selectedOccurrence=E.renderer.occurrenceKeys.indexOf(e.occurrence.path),t.netName||t.netUid){let a=t.netUid&&E.scene.nets.find(s=>s.uid===t.netUid)||t.netName&&Dt(E.scene.nets,t.netName);a&&ia(Number(a.id),!0)}else t.netId?ia(Number(t.netId),!0):t.featureId?Ot(Number(t.featureId),!0):t.reference?rr(String(t.reference),!0):wn()}}function qc(t){let e=Ie;Ie=!0;try{Ne()}finally{Ie=e}k.standInKey=t.occurrence.path,k.move.enabled&&tr(),Ie||Ba?.({kind:"board",sourceContext:"3D",occurrence:t.occurrence.path,standIn:t.standIn})}function Bp(t,e,a){let s=Number(t.scene.features.get(Number(a))?.netId)||0;if(!s)return!1;let r=t.renderer.occurrenceKeys.indexOf(e);return r<0?!1:t.renderer.occurrenceEmphasis?.[r]?.has(s)?!0:t===E&&r===m.selectedOccurrence&&s===Number(m.activeNetId)}function Cp(t,e){let a=k?.placements.get(String(e));if(!ie||!a)return null;let s=wa(ie.matrix,bs(a.matrix,t),ie.viewport);if(!s)return null;let r=L.getBoundingClientRect();return{x:r.left+s.x*r.width/L.width,y:r.top+s.y*r.height/L.height}}function Xc(t=E){if(!k)return na();let e=new Set(t===E?na():[]);for(let a of t.renderer?.occurrenceEmphasis||[])if(a)for(let s of a.keys())e.add(Number(s));return e}function er(t){let e=k.groups.get(t.key)||[],a=new Set;for(let s of t.scene.copperLayers){let r=Number(s.id);e.some(n=>!k.hiddenLayers.get(n.key)?.has(r))&&a.add(r)}if(m.isolateNet){let s=new Set;for(let r of Xc(t))for(let n of hn(r,t))s.add(n);t.visible3dLayers=new Set([...a].filter(r=>s.has(r)))}else t.visible3dLayers=a;pe(performance.now(),{force:!0},t)}function cn(t,e){let a=t??(k.groups.get(E.key)||[]).map(s=>s.key);for(let s of a){let r=new Set(k.hiddenLayers.get(String(s))||[]);e(r,k.placements.get(String(s))?.board),k.hiddenLayers.set(String(s),r)}for(let s of He()){let r=k.groups.get(s.key)||[];for(let n of r)n.hiddenLayers=[...k.hiddenLayers.get(n.key)||[]];s.renderer.setOccurrenceHiddenLayers(r.map(n=>n.hiddenLayers)),er(s)}Se(),Bt()}function Op(){let t=Na();if(t==null||!m.activeNetId)return;let e=hn(m.activeNetId,E);e.size&&cn([t],a=>{a.clear();for(let s of E.scene.copperLayers)e.has(Number(s.id))||a.add(Number(s.id))})}function Pp(t){if(t.scene.layerSteps)return t.scene.layerSteps;let e=new Float32Array(256),a=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((s,r)=>{e[Number(s.id)]=a-r}),t.scene.layerSteps=e,e}function Wc(t,e){let a=t?.scene.runtimeBounds,s=a?Math.hypot((a[3]-a[0])*1e3,(a[4]-a[1])*1e3):0;return[e*e*re(s*.12,8,25)/1e3,e<.0999?1:0,1-e*.72,1]}function Dp(t){return(k.groups.get(t.key)||[]).some(e=>(k.separation.get(e.key)||0)>.001)}function Lp(t,e){let a=e!=null?[String(e)]:(k.groups.get(E.key)||[]).map(s=>s.key);for(let s of a)k.separation.set(s,t);for(let s of He()){let r=k.groups.get(s.key)||[];s.renderer.setOccurrenceExplode(r.map(n=>Wc(s,k.separation.get(n.key)||0)))}Bt()}function Up(){return k.placed.map(t=>{let e=k.hiddenLayers.get(t.occurrence.path)||new Set,a=t.board;return{key:t.occurrence.path,name:t.occurrence.displayPath||t.occurrence.path,standIn:t.standIn||null,separation:k.separation.get(t.occurrence.path)||0,layers:a?a.scene.copperLayers.map(s=>({id:Number(s.id),name:String(s.name),color:En(ar(s,a)),visible:!e.has(Number(s.id))})):[]}})}function Kp(t){if(!k)return[];let e=it();k.emphasisSets=(Array.isArray(t)?t:[]).map((r,n)=>{let i=Vn(r?.color??br[n%br.length]);return{key:String(r?.key??n),mark:i,color:`#${(i&16777215).toString(16).padStart(6,"0")}`,members:(Array.isArray(r?.members)?r.members:[]).filter(o=>o&&typeof o.occurrence=="string"&&typeof o.net=="string")}});let a=Jc(),s=it();return s&&!e?Zs():!s&&e&&(m.isolateNet&&Ct(!1),sn()),m.isolateNet&&s&&Xt(),a}function Jc(){if(!k)return[];let t=new Map;for(let[n,i]of k.groups)t.set(n,i.map(()=>null));let e=new Map;for(let n of k.groups.values())n.forEach((i,o)=>e.set(i.key,o));k.emphasisBounds=new Map;let a=k.emphasisSets.map(n=>{let i={key:n.key,color:n.color,lit:0,unresolved:[]},o=[];k.emphasisBounds.set(n.key,o);for(let c of n.members){let d=k.placements.get(c.occurrence),b=d?.board;if(!b){let g=d?d.standIn==="loading"||d.standIn==="building"?"loading":d.standIn==="restricted"?"restricted":"not-drawn":"not-drawn";i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:g});continue}let f=Dt(b.scene.nets,c.net),v=Number(f?.id)||0;if(!v){i.unresolved.push({occurrence:c.occurrence,net:c.net,reason:"unknown-net"});continue}let x=t.get(b.key),h=e.get(c.occurrence);if(!x||h==null)continue;x[h]=x[h]||new Map,x[h].has(v)||x[h].set(v,n.mark),i.lit+=1;let l=ua(f.boundsMm);l&&o.push({occurrence:c.occurrence,box:Kt(d.matrix,l)})}return i}),s=k.emphasisSets.length>0;for(let n of He())n.renderer.setOccurrenceEmphasis(s&&t.get(n.key)||null,{dimCopper:s});if(m.isolateNet)for(let n of He())er(n);let r=JSON.stringify(a)!==JSON.stringify(k.emphasisReport);return k.emphasisReport=a,r&&k.onEmphasis?.(a),a}function Gp(t=null,e=null){let a=[];for(let[r,n]of k?.emphasisBounds||[])if(!(t!=null&&r!==String(t)))for(let i of n)(e==null||i.occurrence===e)&&a.push(i.box);let s=$t(a);return s?(K.frame(s),!0):!1}function zp(t){let e=[];for(let s of Array.isArray(t)?t:[]){let r=k?.placements.get(String(s?.occurrence)),n=r?.board?.scene.componentFeatures.get(String(s?.reference)),i=n?r.board.scene.features.get(Number(n.featureId))?.bounds:null;i&&e.push(Kt(r.matrix,i))}let a=$t(e);return a?(K.frame(a),!0):!1}function Vp(){let t={boards:0,loaded:0,loading:0,restricted:0,building:0,missing:0,failed:0,unknown:0,unplaced:0};for(let a of Hr(k.descriptor)){t.boards+=1;let s=k.placements.get(a.path);s?s.standIn?t[s.standIn]!==void 0&&(t[s.standIn]+=1):t.loaded+=1:t.unplaced+=1}let e=JSON.stringify(t);e!==k.statusKey&&(k.statusKey=e,k.onStatus?.(t))}var Yc=.001,Hp=90,hc=["#e5484d","#30a46c","#3e63dd"],Xr=["X","Y","Z"];function $c(t,e){if(!t||!e)return!1;let a=_t(t),s=_t(e),r=[...a.translationMm,...a.rotation],n=[...s.translationMm,...s.rotation];return r.every((i,o)=>Math.abs(i-n[o])<1e-6)}function qp(){return{allowed:!1,enabled:!1,space:"world",target:null,preview:null,drag:null}}function Qc(){let t=k.baseDescriptor;return!t||!k.move.target||!k.move.preview?t:ao(t,k.move.target,k.move.preview)}function Ca(){k.baseDescriptor&&(k.descriptor=Qc(),zs({relabel:!1}))}function ln(){let t=k.move.target;return t?k.baseDescriptor?.occurrences.find(e=>e.path===t)??null:null}function Zc(){let t=k.move,e=ln();return{allowed:t.allowed,enabled:t.enabled,space:t.space,dragging:!!t.drag,target:e?{occurrence:e.path,instanceId:e.instanceId,displayPath:e.displayPath,kind:e.kind,restricted:!!e.restricted,pose:_t(t.preview??e.pose),source:t.preview?"manual":e.pose?.source??"default",unsaved:!!t.preview}:null}}function et(t){k.onMove?.({phase:t,...Zc()})}function Xp(t){k.move.allowed=!!t,!k.move.allowed&&k.move.enabled&&Vs(!1)}function Vs(t){let e=!!t&&k.move.allowed;e!==k.move.enabled&&(e||al(),k.move.enabled=e,e&&tr({quiet:!0}),et("mode"))}function el(t){k.move.space=t==="local"?"local":"world",et("mode")}function tl(){return k.standInKey??Na()}function tr({quiet:t=!1}={}){if(!k)return;let e=tl(),a=k.move.enabled&&e!=null?to(k.baseDescriptor,e)?.path??null:null;a!==k.move.target&&(al(),k.move.target=a,t||et("target"))}function al(){let t=!!k.move.preview;k.move.drag=null,k.move.preview=null,k.move.target=null,t&&Ca()}function Wp(t){k?.move.target&&(k.move.preview=t?_t(t):null,Ca(),et("preview"))}function dn(){!k||!k.move.preview&&!k.move.drag||(k.move.drag=null,k.move.preview=null,Ca(),et("cancel"))}function Jp(){let t=`${k.move.target}/`,e=$t(k.placed.filter(a=>a.occurrence.path===k.move.target||a.occurrence.path.startsWith(t)).map(a=>a.worldBounds));return e?[0,1,2].map(a=>(e[a]+e[a+3])/2/Yc):null}function As(t){let e=wa(ie.matrix,Ce(t,Yc),ie.viewport);if(!e)return null;let a=L.getBoundingClientRect();return[e.x*a.width/L.width,e.y*a.height/L.height]}function Yp(){let t=Qe;if(!t)return;let e=ln(),a=k.move.enabled&&e&&ie?Jp():null,s=a?As(a):null;if(!s){t.toggleAttribute("hidden",!0),k.gizmo=null;return}t.toggleAttribute("hidden",!1),t.firstChild||$p(t);let{right:r,back:n}=K.basis(),i=As(We(a,r)),o=i?Math.hypot(i[0]-s[0],i[1]-s[1]):0;if(!(o>1e-6)){t.toggleAttribute("hidden",!0);return}let c=Hp/o,d=k.move.preview??e.pose,b=k.move.space==="local"?Qi(d):Br,f=[];b.forEach((x,h)=>{let l=As(We(a,Ce(x,c))),g=t.querySelector(`[data-part="t${h}"]`),u=l&&Math.hypot(l[0]-s[0],l[1]-s[1])>12;if(g.style.display=u?"":"none",u){let T=g.querySelector("line");T.setAttribute("x1",s[0]),T.setAttribute("y1",s[1]),T.setAttribute("x2",l[0]),T.setAttribute("y2",l[1]),g.querySelector("circle").setAttribute("cx",l[0]),g.querySelector("circle").setAttribute("cy",l[1]),g.querySelector("text").setAttribute("x",l[0]+9),g.querySelector("text").setAttribute("y",l[1]-7)}let p=so(x),y=lt(x,p),w=[];for(let T=0;T<=64;T+=1){let I=T/64*Math.PI*2,S=As(We(a,Ce(We(Ce(p,Math.cos(I)),Ce(y,Math.sin(I))),c*.7)));S&&w.push(`${S[0].toFixed(1)},${S[1].toFixed(1)}`)}t.querySelector(`[data-part="r${h}"]`).setAttribute("points",w.join(" ")),f.push({axis:x,pxPerMm:l?[(l[0]-s[0])/c,(l[1]-s[1])/c]:[0,0]})});let v=t.querySelector('[data-part="pivot"]');v.setAttribute("cx",s[0]),v.setAttribute("cy",s[1]),k.gizmo={center:s,pivot:a,handles:f,back:n}}function $p(t){let e="http://www.w3.org/2000/svg",a=(s,r)=>{let n=document.createElementNS(e,s);for(let[i,o]of Object.entries(r))n.setAttribute(i,o);return n};hc.forEach((s,r)=>{let n=a("polyline",{"data-part":`r${r}`,class:"ring",stroke:s,fill:"none"}),i=a("title",{});i.textContent=`Rotate about ${Xr[r]}`,n.append(i),t.append(n)}),hc.forEach((s,r)=>{let n=a("g",{"data-part":`t${r}`,class:"arrow",stroke:s,fill:s}),i=a("title",{});i.textContent=`Move along ${Xr[r]}`;let o=a("text",{stroke:"none"});o.textContent=Xr[r],n.append(i,a("line",{}),a("circle",{r:6}),o),t.append(n)}),t.append(a("circle",{"data-part":"pivot",r:4,class:"pivot"})),t.append(a("text",{"data-part":"readout",class:"readout"})),t.addEventListener("pointerdown",Qp),t.addEventListener("pointermove",Zp),t.addEventListener("pointerup",eg),t.addEventListener("pointercancel",()=>sl())}function Qp(t){let e=t.target.closest?.("[data-part]")?.dataset.part;if(!k||!e||!k.gizmo||!/^[tr][012]$/.test(e))return;t.preventDefault(),t.stopPropagation();let a=ln(),s=Qe.getBoundingClientRect();k.move.drag={kind:e[0]==="t"?"translate":"rotate",handle:k.gizmo.handles[Number(e[1])],start:[t.clientX-s.left,t.clientY-s.top],startPose:_t(k.move.preview??a.pose),hadPreview:!!k.move.preview,center:k.gizmo.center,pivot:k.gizmo.pivot,back:k.gizmo.back,changed:!1};try{Qe.setPointerCapture(t.pointerId)}catch{}}function Zp(t){let e=k?.move.drag;if(!e)return;let a=Qe.getBoundingClientRect(),s=[t.clientX-a.left,t.clientY-a.top],r=t.shiftKey,n,i;if(e.kind==="translate"){let c=Cr(Ji([s[0]-e.start[0],s[1]-e.start[1]],e.handle.pxPerMm),r?ya.fineMm:ya.mm);n=Zi(e.startPose,e.handle.axis,c),i=`${c>=0?"+":""}${c.toFixed(r?1:0)} mm`}else{let c=$i(e.handle.axis,e.back,Yi(e.center,e.start,s))*180/Math.PI,d=Cr(c,r?ya.fineDeg:ya.deg);n=eo(e.startPose,e.handle.axis,d*Math.PI/180,e.pivot),i=`${d>=0?"+":""}${d.toFixed(0)}\xB0`}e.changed=e.changed||!$c(n,e.startPose),k.move.preview=_t(n);let o=Qe.querySelector('[data-part="readout"]');o.textContent=i,o.setAttribute("x",s[0]+14),o.setAttribute("y",s[1]-10),Ca(),et("preview")}function eg(t){let e=k?.move.drag;e&&(Qe.hasPointerCapture?.(t.pointerId)&&Qe.releasePointerCapture(t.pointerId),k.move.drag=null,Qe.querySelector('[data-part="readout"]').textContent="",e.changed?et("commit"):e.hadPreview||dn())}function sl(){let t=k?.move.drag;return t?(k.move.drag=null,k.move.preview=t.hadPreview?t.startPose:null,Qe.querySelector('[data-part="readout"]').textContent="",Ca(),et("cancel"),!0):!1}function tg(t,e){let a=k.move;if(e==="escape"){if(zt&&!zt.hidden)zt.hidden=!0;else if(!sl())if(a.preview)dn();else if(a.enabled)Vs(!1);else return!1;return!0}if(e==="m"&&a.allowed)Vs(!a.enabled);else if(e==="l"&&a.enabled)el(a.space==="world"?"local":"world");else if(e==="enter"&&a.preview&&!a.drag)et("commit");else if(t.key==="?")rl(!!zt?.hidden);else if(e==="a")K.frame(k.bounds||jt());else return!1;return!0}function rl(t){zt&&(zt.hidden=!t)}function ag(){Ht&&Ht.replaceChildren(...k.placed.map(t=>{let e=document.createElement("div");e.className=`scene-label${t.standIn?` stand-in ${t.standIn}`:""}`;let a=document.createElement("strong");a.textContent=t.occurrence.displayPath||t.occurrence.labels?.join(" / ")||t.occurrence.path,e.append(a);let s=t.standIn?Ss[t.standIn]?.label:"";if(s){let r=document.createElement("span");r.textContent=s,e.append(r)}return t.label=e,e}))}function sg(){if(!Ht||!ie||(Ht.hidden=!k.showLabels,!k.showLabels))return;let t=L.getBoundingClientRect(),e=t.width/Math.max(1,L.width),a=t.height/Math.max(1,L.height),s=tl();for(let r of k.placed){if(!r.label)continue;let[n,i,,o,c,d]=r.worldBounds,b=wa(ie.matrix,[(n+o)/2,(i+c)/2,d],ie.viewport),f=b&&b.x>=0&&b.y>=0&&b.x<=L.width&&b.y<=L.height;r.label.hidden=!f,f&&(r.label.style.transform=`translate(${(b.x*e).toFixed(1)}px, ${(b.y*a).toFixed(1)}px) translate(-50%, -100%)`),r.label.classList.toggle("selected",s===r.occurrence.path)}}function rg(t,e=E){return Pn(t,e.scene.copperLayers)}async function nl(t=xe,e=E){let a=e.semanticGeometry.assets?.components_glb;if(!a||e.scene.componentTier!=="idle")return;e.scene.componentTier="loading";let s;try{s=await ma(new URL(a,location.href).toString(),{componentFeatures:e.scene.componentFeatures,fetchBytes:Hs(e)})}catch(r){throw ge(t)&&(e.scene.componentTier="idle"),r}if(!(!ge(t)||!e.renderer)){e.scene.componentTier="loaded",e.loadedBytes+=s.byteLength;for(let r of s.primitives){let n=e.scene.componentFeatures.get(r.designator);n&&og(n.featureId,r.position,e)}for(let[r,n]of s.componentNodeCounts||[])e.scene.componentModelCounts.set(r,n);e.hiddenComponentRequest&&wl(e.hiddenComponentRequest),e.scene.componentEntries=Xa(s.primitives).map(r=>e.renderer.addPrimitive(r,{kind:"component",layerId:0,material:r.material,color:r.material.baseColor}))}}function Hs(t=E){return t.assetCache?e=>t.assetCache.fetchBytes(e):void 0}function il(t,e=E){if(!e.renderer||t-(e.tiersCheckedAt||0)<250)return;e.tiersCheckedAt=t;let a=e.renderer.identityOnly&&!e.deferComponents||!e.renderer.identityOnly&&e.renderer.cullCounts.full>0;a&&(e.scene.componentsWantedAt=t),a&&e.scene.componentTier==="idle"&&e.semanticGeometry.assets?.components_glb&&nl(xe,e).then(()=>{k&&e.renderer&&e.scene.componentTier==="loaded"&&Jr(e.scene.runtimeBounds,e)}).catch(r=>console.warn("Failed to load components",r));let s=()=>k?k.scene.gpuMemoryBytes():e.renderer.gpuMemoryBytes();e.gpuBytes=s(),!(e.gpuBytes<=m.gpuBudgetBytes)&&(e.scene.componentTier==="loaded"&&t-e.scene.componentsWantedAt>cp&&(e.renderer.removeEntries(e.scene.componentEntries),e.scene.componentEntries=[],e.scene.componentTier="idle",e.scene.componentEvictions+=1,e.gpuBytes=s()),e.gpuBytes>m.gpuBudgetBytes&&Oc(e.visibleTileIds||new Set,Math.max(0,e.residentTileGpuBytes-(e.gpuBytes-m.gpuBudgetBytes)),e))}var bc=4e-4,pc=5e-5,ng={baseColor:[.62,.7,.8,1],metallic:0,roughness:.8,emissive:[0,0,0]};function Jr(t,e=E){if(!e.renderer)return;let a=new Map;for(let i of e.topology.physical_objects||[])i.kind==="footprint_body"&&i.designator&&i.bbox_mm?.length===4&&a.set(i.designator,i);let s=(t?.[5]??8e-4)+pc,r=(t?.[2]??-8e-4)-pc,n=[];for(let i of e.scene.componentFeatures.values()){let o=Number(i.featureId),c=e.scene.features.get(o),d=a.get(i.designator);if(!c||c.bounds||!d)continue;let[b,f,v,x]=d.bbox_mm.map(Number),h=String(d.layer||"").startsWith("B."),l=[b/1e3,-x/1e3,h?r-bc:s,v/1e3,-f/1e3,h?r:s+bc];c.bounds=l,c.placeholder=!0,n.push(ig(l,o))}if(n.length)for(let i of Xa(n))e.renderer.addPrimitive(i,{kind:"component",layerId:0,material:i.material,color:i.material.baseColor,opacityScale:.3,translucent:!0,placeholder:!0})}function ig([t,e,a,s,r,n],i){let o=[[[0,0,1],[[t,e,n],[s,e,n],[s,r,n],[t,r,n]]],[[0,0,-1],[[t,r,a],[s,r,a],[s,e,a],[t,e,a]]],[[1,0,0],[[s,e,a],[s,r,a],[s,r,n],[s,e,n]]],[[-1,0,0],[[t,r,a],[t,e,a],[t,e,n],[t,r,n]]],[[0,1,0],[[s,r,a],[t,r,a],[t,r,n],[s,r,n]]],[[0,-1,0],[[t,e,a],[s,e,a],[s,e,n],[t,e,n]]]],c=new Float32Array(72),d=new Float32Array(72),b=new Uint32Array(36);return o.forEach(([f,v],x)=>{v.forEach((l,g)=>{c.set(l,(x*4+g)*3),d.set(f,(x*4+g)*3)});let h=x*4;b.set([h,h+1,h+2,h,h+2,h+3],x*6)}),{position:c,normal:d,netId:new Uint32Array(24),objectFeatureId:new Uint32Array(24).fill(i),indices:b,material:ng,bounds:[t,e,a,s,r,n]}}function og(t,e,a=E){let s=a.scene.features.get(Number(t));if(!s||!e.length)return;let r=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let n=0;n<e.length;n+=3)r[0]=Math.min(r[0],e[n]),r[1]=Math.min(r[1],e[n+1]),r[2]=Math.min(r[2],e[n+2]),r[3]=Math.max(r[3],e[n]),r[4]=Math.max(r[4],e[n+1]),r[5]=Math.max(r[5],e[n+2]);s.bounds=s.bounds?[Math.min(s.bounds[0],r[0]),Math.min(s.bounds[1],r[1]),Math.min(s.bounds[2],r[2]),Math.max(s.bounds[3],r[3]),Math.max(s.bounds[4],r[4]),Math.max(s.bounds[5],r[5])]:r}function ar(t,e=E){return jn(t,e.scene.copperLayers)}var cg=[.55,.35,.16,.78];function ol(t=E){return Cn(t.topology?.board?.stackup?.copper_finish)}function cl(t,e=E){return On(t,e.scene.copperLayers)}var lg=.25;function Fa(){return!m.realisticColors||m.mode==="layer"?0:1-re(m.separation/lg,0,1)}function ll(t,e=E){let a=cl(t,e)?ol(e):da.copper;return dl(ar(t,e),a,Fa())}function dl(t,e,a){return t.map((s,r)=>s+(e[r]-s)*a)}function dg(t,e=xe){if(e===xe&&k&&K){_p(t,e);return}if(e!==xe||!E.renderer||!K)return;let a=performance.now(),s=Math.max(0,t-Ft);if(m.workspace==="schematic"&&N){Ft=t;let d=N.visiblePages(),b=$?pg(d):[];N.setDomDetailPageIds(b.map(f=>f.id)),P.visiblePages=N.render(),$?.syncWorldPages(b,N,{activeNetUid:P.activeNetUid}),Nl(),Yr(s,performance.now()-a),$r(t),_a(e);return}let r=Math.min(.05,(t-Ft)/1e3);Ft=t,K.update(r),E.renderer.resize();let n=ul();E.scene.copperRealism!==Fa()&&Da();for(let d of E.renderer.entries)d.layerOffset=n[d.layerId]||0;gg(t),qt=fl(t);let i=yg(t);ie={layerId:0,viewport:{x:0,y:0,width:L.width,height:L.height},matrix:K.matrix(L.width,L.height,m.mode==="layer"),lod:Uc(L.height,m.mode==="layer")},E.renderer.selectedOccurrence=m.selectedFeatureId||m.activeNetId?m.selectedOccurrence:-1,E.renderer.setInnerCopperAtFull(m.showBoard&&m.separation<=.001&&!na().size),pe(t);let o=m.mode==="3d"?E.visible3dLayers:jc(),c={panels:[ie],activeNetId:m.activeNetId,selectedFeatureId:m.selectedFeatureId,time:t/1e3,layerOffsets:n,visibleLayers:o,showBoard:m.showBoard,showComponents:m.showComponents,showPaste:m.separation===0,componentOpacity:re(1-m.separation/.1,0,1),boardOpacity:na().size?.34:1-m.separation*.72,isolateNet:m.isolateNet,compareMode:m.mode==="layer",compareOffsets:qt,layerAlphas:i,visibleTileIds:m.mode==="3d"?E.visibleTileIds:null};fg(t,c)&&(E.renderer.render(c),Al(),Pg()),il(t),Yr(s,performance.now()-a),$r(t),_a(e)}var ug=1e3,$e={key:"",matrix:new Float32Array(16),tiles:null,at:0};function fg(t,e){let a=e.panels[0].matrix,s=!1;for(let o=0;o<16;o+=1)if(a[o]!==$e.matrix[o]){s=!0;break}if(s)return $e.matrix.set(a),$e.key="",$e.at=t,!0;let r=[L.width,L.height,E.renderer.version,E.renderer.selectedOccurrence,m.workspace,m.mode,e.activeNetId,e.selectedFeatureId,e.showBoard,e.showComponents,e.showPaste,e.componentOpacity,e.boardOpacity,e.isolateNet,E.scene.layerZOffsetSignature,[...e.visibleLayers].join(","),[...e.compareOffsets].map(([o,c])=>`${o}:${c}`).join(";"),e.layerAlphas?[...e.layerAlphas].join(";"):""].join("|");return!!(e.activeNetId||e.selectedFeatureId||E.renderer.emphasizedNetIds.size)||r!==$e.key||!hg(e.visibleTileIds,$e.tiles)||t-$e.at>ug?($e.key=r,$e.tiles=e.visibleTileIds,$e.at=t,!0):!1}function hg(t,e){if(!t||!e)return t===e;if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function bg(t){if(!N||!t)return{widthPx:0,heightPx:0,sourcePxPerMm:0,area:0};let e=N.pagePixelWidth(t),a=t.heightMm/Math.max(1e-6,N.scale),s=N.pageSourcePixelsPerMm(t);return{widthPx:e,heightPx:a,sourcePxPerMm:s,area:e*a}}function pg(t){if(!$||!N)return[];let e=t||[],a=Math.max(1,Me.clientWidth*Me.clientHeight);return e.map(n=>({page:n,...bg(n)})).filter(n=>n.widthPx>=760&&n.heightPx>=520&&n.area>=a*.36&&n.sourcePxPerMm>=1.25).sort((n,i)=>i.area-n.area).slice(0,1).map(n=>n.page)}function ul(t=E){let e=jt(t),a=Math.hypot((e[3]-e[0])*1e3,(e[4]-e[1])*1e3),s=m.separation*m.separation*re(a*.12,8,25)/1e3,r=`${m.separation}:${s}:${t.scene.copperLayers.length}`;if(t.scene.layerZOffsetSignature===r)return t.scene.layerZOffsets;let n=t.scene.layerZOffsets;n.fill(0);let i=(t.scene.copperLayers.length-1)/2;return t.scene.copperLayers.forEach((o,c)=>{n[Number(o.id)]=(i-c)*s}),t.scene.layerZOffsetSignature=r,n}function fl(t){if(m.mode!=="layer")return ye.key="3d",ye.current.clear(),new Map;let e=E.scene.copperLayers.filter(g=>E.compareLayers.has(Number(g.id))),a=Math.max(1,e.length),s=L.width/Math.max(1,L.height),r=1;a===2?r=s>=1?2:1:a===3||a===4?r=2:a>4&&(r=Math.ceil(Math.sqrt(a*s)));let n=Math.ceil(a/r),i=jt(),o=i[3]-i[0],c=i[4]-i[1],d=o*1.18,b=c*1.22,f=e.map((g,u)=>{let p=u%r,y=Math.floor(u/r);return{layer:g,layerId:Number(g.id),column:p,row:y,offset:[(p-(r-1)/2)*d,((n-1)/2-y)*b,0]}}),v=`${r}x${n}:${f.map(g=>g.layerId).join(",")}`;if(v!==ye.key){ye.key=v,ye.started=t,ye.from=new Map(ye.current);let g=r*o+(r-1)*(d-o),u=n*c+(n-1)*(b-c);K.targetFocus=[(i[0]+i[3])/2,(i[1]+i[4])/2,(i[2]+i[5])/2],K.targetOrthoScale=Math.max(u,g/s)*1.08}let x=re((t-ye.started)/420,0,1),h=1-Math.pow(1-x,3),l=new Map;for(let g of f){let u=ye.from.get(g.layerId)||[0,0,0],p=g.offset.map((y,w)=>u[w]+(y-u[w])*h);l.set(g.layerId,p),ye.current.set(g.layerId,p)}if(q.phase==="reveal")for(let g of q.previous)l.has(Number(g))||l.set(Number(g),q.previousOffsets.get(Number(g))||[0,0,0]);for(let g of[...ye.current.keys()])f.some(u=>u.layerId===g)||ye.current.delete(g);return l}function Oa(t){let e=new Set([...t].map(Number));if(!(gc(e,E.desiredCompareLayers)&&q.phase!=="idle")){if(E.desiredCompareLayers=e,gc(e,E.compareLayers)){q.phase="idle",q.previous.clear(),q.target.clear();return}q.phase="preload",q.previous=new Set(E.compareLayers),q.target=new Set(e),q.previousOffsets=new Map(ye.current),q.started=performance.now(),pe(q.started,{force:!0})}}function un({snap:t=!0}={}){m.mode="layer";let e=wp();E.desiredCompareLayers=new Set(e),!E.compareLayers.size&&e.size&&(E.compareLayers=new Set(e)),q.phase="idle",q.previous.clear(),q.target.clear(),ye.key="",K.setAxis("z",!1),E.renderer?.resize(),qt=fl(performance.now()),t&&K.snap(),pe(performance.now(),{force:!0})}function gg(t){if(!(m.mode!=="layer"||q.phase==="idle")){if(q.phase==="preload"){if(!mg(q.target)){pe(t,{force:!0});return}q.phase="reveal",q.started=t,q.previousOffsets=new Map(ye.current),E.compareLayers=new Set(q.target),ye.key="";return}q.phase==="reveal"&&t-q.started>=xc&&(E.compareLayers=new Set(q.target),q.phase="idle",q.previous.clear(),q.target.clear(),q.previousOffsets.clear(),pe(t,{force:!0}))}}function mg(t,e=E){for(let a of e.scene.tiles.values())if(t.has(Number(a.layerId))&&!e.scene.residentTiles.has(a.id)&&!e.scene.failed.has(a.id))return!1;return!0}function yg(t){if(m.mode!=="layer"||q.phase!=="reveal")return null;let e=re((t-q.started)/xc,0,1),a=e*e*(3-2*e),s=new Map;for(let r of q.previous)s.set(Number(r),q.target.has(Number(r))?1:1-a);for(let r of q.target)s.set(Number(r),q.previous.has(Number(r))?1:a);return s}function gc(t,e){if(t.size!==e.size)return!1;for(let a of t)if(!e.has(a))return!1;return!0}function fn(){if(m.workspace==="schematic"){vg();return}if(m.workspace==="bom"){xg();return}if(m.workspace==="stackup")return;Ws.textContent=E.viewerReadiness.stage==="semantic-ready"?"Semantic GLTF A0":"Prism staged 3D",Js.textContent="Layers",Ys.textContent="Visibility and compare",Y('[data-panel="search"] .section-heading span').textContent="Nets, components and pins",Y('[data-panel="view"] .section-heading span').textContent="Camera and stackup";let t=`
    <div class="mode-toolbar">
      <button data-mode="layer">PCB</button>
      <button data-mode="3d">3D</button>
    </div>`;sa&&(sa.innerHTML=t),ze.innerHTML=`
    ${sa?"":t}
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
    </div>`,_e.innerHTML=`
    <div class="toggle-list">
      <label class="toggle-row"><input id="show-board" type="checkbox"><span>Board substrate</span></label>
      <label class="toggle-row"><input id="show-components" type="checkbox"><span>Components</span></label>
    </div>
    <label class="control-field range-field"><span>Stackup separation</span>
      <input id="separation" type="range" min="0" max="1" step="0.002">
    </label>`,Se(),Ig()}function xg(){Ws.textContent="BoM A0",Js.textContent="Bill of Materials",Ys.textContent="Grouped procurement view",Y('[data-panel="search"] .section-heading span').textContent="Search inside the BoM table",Y('[data-panel="view"] .section-heading span').textContent="BoM actions";let t=Ve?.payload?.counts||{};ze.innerHTML=`
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
    </div>`,_e.innerHTML=`
    <div class="selection-section">
      <span class="selection-section-title">Cross-probing</span>
      <div class="selection-table">
        <div class="selection-row"><span><strong>PCB/Schematic</strong></span><span>Select component</span><span>Highlights matching BoM row</span></div>
        <div class="selection-row"><span><strong>BoM reference</strong></span><span>Click chip</span><span>Holds component selection for PCB and schematic</span></div>
      </div>
    </div>`,be.querySelector("#clear-selection")?.addEventListener("click",Ne)}function vg(){Ws.textContent=$?"Schematic SVG DOM":P.manifest?.schema==="prism.schematic_vector_a0"?"Schematic Vector A0":"Schematic World A0",Js.textContent="Pages",Ys.textContent=`${P.pages.length} hierarchy instances`,Y('[data-panel="search"] .section-heading span').textContent="Pages, nets and components",Y('[data-panel="view"] .section-heading span').textContent="World navigation",ze.innerHTML=`
    <div class="layer-presets">
      <button data-page-action="world">Fit world</button>
      <button data-page-action="parent">Parent</button>
      <button data-page-action="previous">Previous</button>
      <button data-page-action="next">Next</button>
    </div>
    <div class="page-list">${P.pages.map(t=>`
      <button class="page-row ${t.id===m.selectedPageId?"active":""}" data-page="${t.id}">
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
    </div>`,_e.innerHTML=`
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
    </div>`,ze.querySelectorAll("[data-page]").forEach(t=>{t.addEventListener("click",()=>ot(t.dataset.page,!0))}),ze.querySelectorAll("[data-page-action]").forEach(t=>{t.addEventListener("click",()=>js(t.dataset.pageAction))}),be.querySelector("#entity-search").addEventListener("input",t=>{Eg(t.target.value)}),be.querySelector("#frame-selection").addEventListener("click",pl),be.querySelector("#clear-selection").addEventListener("click",Pa),_e.querySelector("#show-hierarchy").checked=N?.showHierarchy??!0,_e.querySelector("#show-hierarchy").addEventListener("change",t=>{N.showHierarchy=t.target.checked})}function ot(t,e){let a=P.byId.get(t);!a||!N||(m.selectedPageId=a.id,m.selectedSchematicFeature=null,N.selectedPageId=a.id,N.selectedFeatureId=0,Ze.textContent=JSON.stringify(a,null,2),e&&N.framePage(a),ze.querySelectorAll("[data-page]").forEach(s=>{s.classList.toggle("active",s.dataset.page===a.id)}))}function js(t){if(!N)return;if(t==="world"){N.frameWorld();return}let e=Math.max(0,P.pages.findIndex(s=>s.id===m.selectedPageId)),a=null;t==="previous"?a=P.pages[(e-1+P.pages.length)%P.pages.length]:t==="next"?a=P.pages[(e+1)%P.pages.length]:t==="parent"&&(a=P.byId.get(P.pages[e]?.parentId)),a&&ot(a.id,!0)}function wg(t){if(!t||!N)return;if(Pa(),t.kind==="page"&&t.pageId){ot(t.pageId,!0);return}if(t.kind!=="sheet")return;let e=P.pages.find(n=>n.sheetInstancePath===t.sheetInstancePath)||P.byId.get(m.selectedPageId),a=String(t.sheetFile||t.feature?.sheet_file||"").replace(/\\/g,"/"),s=String(t.sheetName||t.feature?.sheet_name||t.feature?.objectId||""),r=P.pages.find(n=>{if(e&&n.parentId&&n.parentId!==e.id)return!1;let i=String(n.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&n.name===s})||P.pages.find(n=>{let i=String(n.sourcePath||"").replace(/\\/g,"/");return a&&i.endsWith(a)||s&&n.name===s});r&&ot(r.id,!0)}function Eg(t){let e=be.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=P.pages.filter(n=>`${n.name} ${n.sheetPath}`.toLowerCase().includes(a)).slice(0,8),r=E.scene.nets.filter(n=>String(n.name).toLowerCase().includes(a)).slice(0,8);e.innerHTML=[...s.map(n=>`<button data-page="${n.id}"><b>${G(n.name)}</b><span>Page ${n.sheetNumber}</span></button>`),...r.map(n=>`<button data-schematic-net="${n.id}"><b>${G(n.name)}</b><span>${(P.manifest.netToPages?.[n.uid]||[]).length} pages</span></button>`)].join(""),e.querySelectorAll("[data-page]").forEach(n=>{n.addEventListener("click",()=>ot(n.dataset.page,!0))}),e.querySelectorAll("[data-schematic-net]").forEach(n=>{n.addEventListener("click",()=>hl(Number(n.dataset.schematicNet),!0))})}function hl(t,e){let a=E.scene.nets.find(r=>Number(r.id)===t);if(!a||!N)return;m.activeNetId=t,m.selectedFeatureId=0,m.selectedSchematicFeature=null,N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId="",P.activeNetUid=a.uid,N.activeNetUid=a.uid,$?.setHighlightedNet(a.uid),Ze.textContent=JSON.stringify(a,null,2),De();let s=P.manifest.netToPages?.[a.uid]||[];e&&s.length&&ot(s[0],!0)}function bl(t,e=null){let a=E.scene.nets.find(s=>s.uid===t);a&&(m.activeNetId=Number(a.id),P.activeNetUid=a.uid,N&&(N.activeNetUid=a.uid,N.selectedFeatureId=Number(e?.feature?.id||e?.featureId||0),N.selectedFeatureKey=e?.feature?.stableKey||e?.featureKey||"",N.selectedSourceId=e?.feature?.sourceId||e?.sourceId||""),$?.setHighlightedNet(a.uid),e&&(m.selectedSchematicFeature={...e,pageId:m.selectedPageId}),Ze.textContent=JSON.stringify(e?{...e,net:a}:a,null,2),De())}function Pa(){m.activeNetId=0,m.selectedFeatureId=0,m.selectedSchematicFeature=null,P.activeNetUid="",N&&(N.activeNetUid="",N.selectedFeatureId=0,N.selectedFeatureKey="",N.selectedSourceId=""),$?.setSelection(null),$?.setHighlightedNet(""),Ze.textContent="No object selected",De()}function pl(){let t=P.byId.get(m.selectedPageId);t?N.framePage(t):N.frameWorld()}function kg(t){m.selectedPageId=t.sheetInstancePath&&P.pages.find(s=>s.sheetInstancePath===t.sheetInstancePath)?.id||m.selectedPageId,m.selectedFeatureId=0,m.selectedSchematicFeature={...t,pageId:m.selectedPageId},t.anchor&&(m.selectionAnchor=t.anchor),N&&(N.selectedPageId=m.selectedPageId,N.selectedFeatureId=Number(t.feature?.id||0));let e=t.netUid?E.scene.nets.find(s=>s.uid===t.netUid):null,a=t.reference?E.scene.componentFeatures.get(t.reference):null;a&&(m.selectedFeatureId=Number(a.featureId||0),Ve?.setSelectionByReference(t.reference,{scroll:m.workspace==="bom"})),Ze.textContent=JSON.stringify({...t,net:e,component:a},null,2),De()}function Tg(t){let{page:e,feature:a}=t;if(!a){m.selectedSchematicFeature=null,N.selectedFeatureId=0,ot(e.id,!1),De();return}let s=Number(a.id||0);if(m.selectedPageId=e.id,N.selectedPageId=e.id,N.selectedFeatureId=s,m.selectedSchematicFeature={...a,pageId:e.id},m.selectionAnchor=null,a.netUid){let r=E.scene.nets.find(n=>n.uid===a.netUid);if(r){hl(Number(r.id),!1),m.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}if(a.reference){let r=E.scene.componentFeatures.get(a.reference);if(r){Ot(Number(r.featureId),!1),m.selectedSchematicFeature={...a,pageId:e.id},N.selectedFeatureId=s;return}}m.activeNetId=0,m.selectedFeatureId=0,N.activeNetUid="",Ze.textContent=JSON.stringify({page:e.name,...a},null,2),De()}function Wt(){let t=m.isolateNet,e=be?.querySelector?.("#isolate-net");e?.classList.toggle("active",t),e?.setAttribute("aria-pressed",String(t));let a=Z?.querySelector?.("[data-action=isolate]");a?.classList.toggle("active",t),a?.setAttribute("aria-pressed",String(t));let s=_e?.querySelector?.("#show-board");s&&(s.checked=m.showBoard);let r=_e?.querySelector?.("#show-components");r&&(r.checked=m.showComponents),Bt()}function Mg(){let t=new Set;for(let e of na())for(let a of hn(e))t.add(a);return t}function hn(t,e=E){let a=new Set,s=e.scene.nets.find(n=>Number(n.id)===Number(t)),r=new Set(e.scene.copperLayers.map(n=>Number(n.id)));for(let n of Object.keys(s?.layerBoundsMm||{})){let i=Number(n);r.has(i)&&a.add(i)}if(!a.size){let n=new Map(e.scene.copperLayers.map(i=>[i.name,Number(i.id)]));for(let i of s?.metrics?.layers||[]){let o=n.get(i);o!=null&&a.add(o)}}if(a.size)return a;for(let n of e.scene.tiles.values())Dc(n,t)&&a.add(Number(n.layerId));return a}function Xt(){if(k){for(let e of He())er(e);return}let t=Mg();t.size&&(E.visible3dLayers=new Set(t),m.mode==="layer"?Oa(t):(E.compareLayers=new Set(t),E.desiredCompareLayers=new Set(t)),pe(performance.now(),{force:!0}))}function Ct(t){let e=!!(t&&it()),a=m.isolateNet;if(e&&!m.isolateNet&&!k&&(E.preIsolation3dLayers=new Set(E.visible3dLayers),E.preIsolationCompareLayers=new Set(E.desiredCompareLayers.size?E.desiredCompareLayers:E.compareLayers)),m.isolateNet=e,k)Xt();else if(m.isolateNet)Xt();else if(E.preIsolation3dLayers||E.preIsolationCompareLayers){if(E.preIsolation3dLayers&&(E.visible3dLayers=new Set(E.preIsolation3dLayers)),E.preIsolationCompareLayers){let s=new Set(E.preIsolationCompareLayers);m.mode==="layer"?Oa(s):(E.compareLayers=s,E.desiredCompareLayers=new Set(s))}E.preIsolation3dLayers=null,E.preIsolationCompareLayers=null,pe(performance.now(),{force:!0})}e&&!a?(m.preIsolationShowBoard=m.showBoard,m.showBoard=!1):!e&&a&&(typeof m.preIsolationShowBoard=="boolean"&&(m.showBoard=m.preIsolationShowBoard),m.preIsolationShowBoard=null),Wt(),Se()}function Se(){(sa||ze).querySelectorAll("[data-mode]").forEach(a=>{let s=a.dataset.mode===m.mode;a.classList.toggle("active",s),a.setAttribute("aria-pressed",String(s))}),_e.querySelector("#show-board").checked=m.showBoard,_e.querySelector("#show-components").checked=m.showComponents,_e.querySelector("#separation").value=m.separation;let t=ze.querySelector(".layer-list"),e=m.mode==="3d"?E.visible3dLayers:E.desiredCompareLayers;t.innerHTML=E.scene.copperLayers.map((a,s)=>`
    <label class="layer-row">
      <input type="checkbox" data-layer="${a.id}" ${e.has(Number(a.id))?"checked":""}>
      <span class="swatch" style="background:${En(ar(a))}"></span>
      <span>${G(a.name)}</span><small>${s+1}</small>
    </label>`).join(""),t.querySelectorAll("[data-layer]").forEach(a=>a.addEventListener("change",()=>{bn(Number(a.dataset.layer),a.checked)})),Wt()}function gl(t){t==="layer"?un():(m.mode="3d",K.frame(jt()),K.snap(),E.visibleTileIds=new Set,pe(performance.now(),{force:!0})),Se()}function bn(t,e,a=null){if(k){let s=Number(t);cn(a==null?null:[a],r=>e?r.delete(s):r.add(s));return}if(m.mode==="3d")e?E.visible3dLayers.add(t):E.visible3dLayers.delete(t),pe(performance.now(),{force:!0});else{let s=new Set(E.desiredCompareLayers);e?s.add(t):s.delete(t),Oa(s)}Se()}function pn(t,e=null){if(k){cn(e==null?null:[e],(s,r)=>{let n=r?.scene.copperLayers||[];s.clear(),n.forEach((i,o)=>{t==="all"||t==="outer"&&(o===0||o===n.length-1)||t==="inner"&&o>0&&o<n.length-1||s.add(Number(i.id))})});return}let a=m.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let[s,r]of E.scene.copperLayers.entries())(t==="all"||t==="outer"&&(s===0||s===E.scene.copperLayers.length-1)||t==="inner"&&s>0&&s<E.scene.copperLayers.length-1)&&a.add(Number(r.id));m.mode==="3d"?pe(performance.now(),{force:!0}):Oa(a),Se()}function gn(t){m.showBoard=!!t,m.savedShowBoard=m.showBoard,m.showBoard&&m.isolateNet?Ct(!1):Wt()}function mn(t){m.showComponents=!!t,m.savedShowComponents=m.showComponents,Wt()}function ml(t){m.showPlaceholders=!!t;for(let e of k?He():[E])e.renderer?.setPlaceholdersVisible(m.showPlaceholders);Bt()}function yl(t){m.realisticColors=!!t,Da(),Bt()}function Da(t=E){if(!t.renderer)return;let e=new Map(t.scene.layers.map(a=>[Number(a.id),a]));for(let a of t.renderer.entries)a.kind==="copper"&&(a.color=ll(e.get(Number(a.layerId)),t));t.renderer.setBarrelColor(dl(cg,[...ol(t).slice(0,3),.78],Fa())),t.scene.copperRealism=Fa()}function yn(t,e=null){if(k){Lp(re(Number(t)||0,0,1),e);return}m.separation=re(Number(t)||0,0,1),Bt()}function Ig(){(sa||ze).querySelectorAll("[data-mode]").forEach(e=>e.addEventListener("click",()=>{gl(e.dataset.mode)})),ze.querySelectorAll("[data-preset]").forEach(e=>e.addEventListener("click",()=>{pn(e.dataset.preset)})),_e.querySelector("#show-board").addEventListener("change",e=>{gn(e.target.checked)}),_e.querySelector("#show-components").addEventListener("change",e=>{mn(e.target.checked)}),_e.querySelector("#separation").addEventListener("input",e=>{yn(e.target.value)}),be.querySelector("#clear-selection").addEventListener("click",Ne),be.querySelector("#isolate-net").addEventListener("click",()=>{Ct(!m.isolateNet)}),be.querySelector("#frame-selection").addEventListener("click",vn),be.querySelector("#show-net-layers").addEventListener("click",sr);let t=be.querySelector("#entity-search");t.addEventListener("input",()=>vl(t.value))}function xl(){Vt(".rail-tab").forEach(t=>t.addEventListener("click",()=>{let e=t.dataset.tab,a=m.activeTab===e&&!nt.classList.contains("panel-collapsed");m.activeTab=e,nt.classList.toggle("panel-collapsed",a),Vt(".rail-tab").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.tab===e)}),Vt(".tab-panel").forEach(s=>{s.classList.toggle("active",!a&&s.dataset.panel===e)})}))}function sr(){if(k){Op();return}let t=E.scene.nets.find(s=>Number(s.id)===m.activeNetId);if(!t)return;let e=new Set(t.metrics?.layers||[]),a=m.mode==="3d"?E.visible3dLayers:new Set;a.clear();for(let s of E.scene.copperLayers)e.has(s.name)&&a.add(Number(s.id));m.mode==="3d"?pe(performance.now(),{force:!0}):Oa(a),Se()}function vl(t){let e=be.querySelector("#search-results"),a=t.trim().toLowerCase();if(!a){e.innerHTML="";return}let s=E.scene.nets.filter(n=>String(n.name).toLowerCase().includes(a)).slice(0,8),r=[...E.scene.componentFeatures.values()].filter(n=>!E.hiddenComponents.has(String(n.designator||""))&&`${n.designator} ${n.value} ${n.footprint}`.toLowerCase().includes(a)).slice(0,6);e.innerHTML=[...s.map(n=>`<button data-net="${n.id}"><b>${G(n.name)}</b><span>${G(n.netClass||"")}</span></button>`),...r.map(n=>`<button data-feature="${n.featureId}"><b>${G(n.designator)}</b><span>${G(n.value)}</span></button>`)].join(""),e.querySelectorAll("[data-net]").forEach(n=>{n.addEventListener("click",()=>ia(Number(n.dataset.net),!0))}),e.querySelectorAll("[data-feature]").forEach(n=>{n.addEventListener("click",()=>Ot(Number(n.dataset.feature),!0))})}function ia(t,e){e&&(m.selectionAnchor=null),m.activeNetId=t,m.selectedFeatureId=0;let a=E.scene.nets.find(s=>Number(s.id)===t);m.workspace==="schematic"&&a&&N&&(P.activeNetUid=a.uid,N.activeNetUid=a.uid),Zs(),Ze.textContent=JSON.stringify(a||{},null,2),De(),m.isolateNet&&Xt(),e&&a?.boundsMm&&K.frame(an(ua(a.boundsMm))),pe(performance.now(),{force:!0}),Qs(Ac(a))}function Ot(t,e=!1){let a=E.scene.features.get(t);if(a?.kind==="component"&&Wa(oa(a),E.hiddenComponents))return;e&&(m.selectionAnchor=null),m.selectedFeatureId=t,m.activeNetId=Number(a?.netId||0);let s=oa(a);s&&Ve?.setSelectionByReference(s,{scroll:m.workspace==="bom"});let r=_c(a);r?.kind==="net"?Zs():Nc(),Ze.textContent=a?JSON.stringify(a,null,2):"No object selected",De(),m.isolateNet&&m.activeNetId&&Xt(),e&&a?.bounds&&xn(a),pe(performance.now(),{force:!0}),Qs(r)}function rr(t,e=!1){if(Wa(t,E.hiddenComponents))return;let a=E.scene.componentFeatures.get(t);if(Ve?.setSelectionByReference(t,{scroll:m.workspace==="bom"}),!a?.featureId)return;Nc(),Ot(Number(a.featureId),!1);let s=Rg(t);if(s){let{page:r,feature:n}=s;m.selectedPageId=r.id,m.selectedSchematicFeature={...n,pageId:r.id},N&&(N.selectedPageId=r.id,N.selectedFeatureId=Number(n.id||0)),$?.setSelection?.({kind:"component",featureKey:n.stableKey||"",sheetInstancePath:n.sheetInstancePath||r.sheetInstancePath||"",sourceId:n.sourceId||n.uuid||"",reference:t,feature:n,pageId:r.id}),e&&m.workspace==="schematic"&&(ot(r.id,!0),$?.frameSelection?.())}if(e&&m.workspace==="pcb"){let r=E.scene.features.get(Number(a.featureId));r?.bounds&&xn(r,!0)}De()}function oa(t){return t?.designator||t?.reference||t?.componentDesignator||""}function Sg(t=E){return Dn(t.scene.manifest?.components||[],t.scene.componentModelCounts)}function wl(t){E.hiddenComponentRequest=t;let e=Ln(t,Sg());E.hiddenComponents=e.hiddenReferences,E.renderer?.setHiddenFeatureIds(e.hiddenFeatureIds),e.ambiguous.length&&console.warn(`[prism-semantic-viewer] keeping ambiguous components visible: ${e.ambiguous.join(", ")}`),e.unknown.length&&console.warn(`[prism-semantic-viewer] ignoring unknown components: ${e.unknown.join(", ")}`);let a=oa(E.scene.features.get(m.selectedFeatureId));Wa(a,E.hiddenComponents)&&Ne();let s=be.querySelector("input");return s?.value&&vl(s.value),e}function xn(t,e=!1){if(!t?.bounds)return;let a=an(t.bounds);if(e||t.kind==="component"||!!oa(t)){let n=(a[2]+a[5])*.5<0,i=K.isBelow();n!==i&&K.setAxis("z",n)}K.frame(a)}function Rg(t){if(!t||!N?.featuresByPage)return null;let e=P.byId.get(m.selectedPageId),a=[...e?[e]:[],...(P.pages||[]).filter(r=>r.id!==e?.id)],s=r=>{let n=String(r.kind||"").toLowerCase();return n==="component"||n==="symbol_body"||n==="symbol_instance"?0:n==="symbol_reference"?1:n.startsWith("pin")?2:3};for(let r of a){let n=(N.featuresByPage[r.id]||[]).filter(i=>String(i.reference||i.designator||i.componentDesignator||"")===t).sort((i,o)=>s(i)-s(o));if(n.length)return{page:r,feature:n[0]}}return null}function Ne(){m.activeNetId=0,m.selectedFeatureId=0,k&&(k.boardSelected=!1,k.standInKey=null),m.selectedSchematicFeature=null,m.selectionAnchor=null;let t=it(),e=m.isolateNet;e&&!t?Ct(!1):t?e&&Xt():m.isolateNet=!1,t||sn(),P.activeNetUid="",N&&(N.activeNetUid=""),$?.setSelection(null),$?.setHighlightedNet(""),Ze.textContent="No object selected",Ve?.clearSelection?.(),De(),Qs(null)}function Bs(t){return`<div class="selection-properties">${t.map(([e,a])=>`
    <div class="selection-property">
      <small>${G(e)}</small>
      <strong title="${G(String(a))}">${G(String(a))}</strong>
    </div>`).join("")}</div>`}function qs(t,e,a){return`
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
    </div>`}function Ag(t){let a=(E.topology.net_details?.[t.uid]||{}).terminals||[],s=t.metrics||{},r=Number(s.traceLengthMm||0).toFixed(2),n=s.objectCounts?.via||0,i=a.length,c=/^(VCC|VDD|GND|3V3|5V|12V|VIN|POWER)/i.test(t.name)?"#10b981":"#8b5cf6",d=t.netClass||"Default",b=a.length?a.map(f=>`
      <div class="selection-row pin-row-interactive" data-ref="${G(f.designator)}" data-pin="${G(f.pin)}">
        <span class="refdes-col"><strong>${G(f.designator)}</strong></span>
        <span class="pin-col">Pin ${G(f.pin)}</span>
        <span class="val-col" title="${G(f.value||"")}">${G(f.value||"-")}</span>
      </div>`).join(""):'<div class="selection-empty">No connected pin metadata is available.</div>';return`
    ${qs("Net",t.name,c)}
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
          ${(s.layers||[]).length?s.layers.map(f=>`<span class="layer-badge">${G(f)}</span>`).join(""):'<span class="layer-badge unknown">None</span>'}
        </div>
      </div>

      <div class="selection-section">
        <span class="selection-section-title">Connected Pins</span>
        <div class="selection-table compact-scroll" style="max-height: 120px;">
          ${b}
        </div>
      </div>
    </div>`}function _g(t,e=null){let a=Zr(t.designator),s=a?a.value:t.value||"Not specified",r=a?a.footprint:t.footprint||"Not specified",n=a?.parameters||{},i=n.Manufacturer||n.Mfr||"",o=n["Manufacturer Part Number"]||n.MPN||n["Part Number"]||"",c=n.kicad_dnp==="true"||n.DNP==="true"||n.kicad_in_bom==="false",d="";(i||o)&&(d=`
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
    ${qs("Component",t.designator||"Unknown","#3b82f6")}
    <div class="selection-component-dashboard">
      ${c?'<div class="dnp-banner" style="background:#b45309;color:#fff;font-size:9px;font-weight:750;text-align:center;padding:3px;margin-bottom:8px;border-radius:2px;text-transform:uppercase;letter-spacing:0.05em;">DNP (Do Not Populate)</div>':""}
      ${Bs([["Value",s],["Footprint",r.split(":").pop()||r]])}
      ${d}
      ${b}
    </div>`}function Ng(t,e){let a=String(t.kind||"").toLowerCase(),s=a.startsWith("pin");if(a==="component"||a.includes("symbol"))return`
      ${qs("Component",t.reference||t.componentDesignator||"Unknown","#3b82f6")}
      ${Bs([["Value",t.value||t.componentValue||"Not specified"],["Footprint",t.componentFootprint||t.footprint||"Not specified"],["Library",t.libraryRef||"Not specified"],["UID",t.componentUid||t.uuid||t.sourceId||"Not resolved"]])}
      <div class="selection-section">
        <span class="selection-section-title">Schematic placement</span>
        ${Bs([["Page",e?.name||"Unknown"],["Sheet",t.sheetInstancePath||"/"]])}
      </div>`;let n=s?[["Symbol",t.reference||t.designator||"Unknown"],["Value",t.value||t.componentValue||"Not specified"],["Pin",`${t.pinNumber||"-"}${t.pinName?` ${t.pinName}`:""}`],["Net",t.netName||"Not connected"],["PCB Pad",t.pcbPadId||"Not resolved"],["Component UID",t.componentUid||"Not resolved"]]:[["Page",e?.name||"Unknown"],["Kind",t.kind.replaceAll("_"," ")],["Net",t.netName||"Not connected"]];return`
    ${qs(t.kind.replaceAll("_"," "),t.pinName||t.reference||t.designator||t.text||t.netName||"Schematic object","#3b82f6")}
    ${Bs(n)}
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
    </div>`}function De(){if(Bt(),m.workspace==="bom"){Z.hidden=!0,Z.innerHTML="";return}let t=E.scene.features.get(m.selectedFeatureId),e=t?.kind==="component"?t:null,a=m.workspace==="schematic"?m.selectedSchematicFeature:null,s=a?P.byId.get(a.pageId):null,r=m.activeNetId?E.scene.nets.find(f=>Number(f.id)===m.activeNetId):null;if(!r&&a&&(a.netUid?r=E.scene.nets.find(f=>f.uid===a.netUid):a.netName&&(r=Dt(E.scene.nets,a.netName))),!e&&a){let f=a.reference||a.componentDesignator||a.designator;f&&(e=E.scene.componentFeatures.get(f)||{designator:f})}if(!e&&!r&&!a){Z.hidden=!0,Z.innerHTML="";return}let n="";if(r)n=Ag(r);else if(e){let f=a?.kind?.startsWith("pin")?a:null;n=_g(e,f)}else a&&(n=Ng(a,s));Z.innerHTML=`
    ${n}
    <div class="selection-card-actions">
      ${r?`
        <button type="button" data-action="isolate" aria-keyshortcuts="I" title="Toggle isolated net view (I)" class="${m.isolateNet?"active":""}">Isolate</button>
        <button type="button" data-action="net-layers">Layers</button>
      `:""}
      <button type="button" data-action="frame">Frame selection</button>
    </div>`,Z.hidden=!1;let i=m.workspace==="schematic"?Me:L,o=m.selectionAnchor,c=Z.offsetWidth||360,d=Z.offsetHeight||330;if(o){let f=Math.max(16,i.clientWidth-c-24),v=Math.max(16,i.clientHeight-d-24);Z.style.left=`${re(o.x+18,16,f)}px`,Z.style.top=`${re(o.y+18,16,v)}px`}else Z.style.left="20px",Z.style.top="20px";if(Z.querySelector(".selection-card-close").addEventListener("click",Ne),Z.querySelector("[data-action=frame]").addEventListener("click",vn),r){let f=Z.querySelector("[data-action=isolate]");f&&f.addEventListener("click",()=>{Ct(!m.isolateNet)});let v=Z.querySelector("[data-action=net-layers]");v&&v.addEventListener("click",sr),Z.querySelectorAll(".pin-row-interactive").forEach(x=>{x.addEventListener("click",()=>{let h=x.dataset.ref,l=x.dataset.pin;if(!h)return;let p=((E.topology.net_details?.[r.uid]||{}).terminals||[]).find(w=>w.designator===h&&w.pin===l),y=p?lp(p.pcb_pad_id):0;y?Ot(y,!0):rr(h,!0)})})}let b=Z.querySelector(".net-ref-interactive");b&&b.addEventListener("click",()=>{let f=b.dataset.netName;if(!f)return;let v=Dt(E.scene.nets,f);v&&ia(Number(v.id),!0)})}function vn(){if(m.workspace==="schematic"){pl();return}let t=E.scene.features.get(m.selectedFeatureId);if(t?.bounds)xn(t);else{let e=E.scene.nets.find(a=>Number(a.id)===m.activeNetId);e?.boundsMm&&K.frame(an(ua(e.boundsMm)))}}function El(){L.addEventListener("contextmenu",t=>t.preventDefault()),L.addEventListener("pointerdown",t=>{k&&(k.framed=!0),m.dragging=!0,m.lastX=t.clientX,m.lastY=t.clientY,m.pointerStartX=t.clientX,m.pointerStartY=t.clientY,m.dragMode=m.mode==="layer"||t.shiftKey||t.button!==0?"pan":"orbit",L.setPointerCapture(t.pointerId)}),L.addEventListener("pointermove",t=>{if(!m.dragging)return;let e=t.clientX-m.lastX,a=t.clientY-m.lastY;m.lastX=t.clientX,m.lastY=t.clientY,m.dragMode==="pan"?K.pan(e,a,L.clientHeight,m.mode==="layer"):K.orbit(e,a)}),L.addEventListener("pointerup",async t=>{m.dragging=!1,L.releasePointerCapture(t.pointerId),!(Math.hypot(t.clientX-m.pointerStartX,t.clientY-m.pointerStartY)>=3)&&(t.button===0?await mc(t):t.button===2&&await Cg(t))}),L.addEventListener("dblclick",async t=>{await mc(t),vn()}),L.addEventListener("wheel",t=>{k&&(k.framed=!0),t.preventDefault(),Math.abs(t.deltaX)>Math.abs(t.deltaY)*.4?K.pan(-t.deltaX,0,L.clientHeight,m.mode==="layer"):K.dolly(t.deltaY,m.mode==="layer")},{passive:!1}),window.addEventListener("keydown",Rl),Fg()}function Fg(){let t=!1,e,a,s=0,r=0;Z.addEventListener("pointerdown",n=>{if(!n.target.closest(".selection-card-head")||n.target.closest(".selection-card-close"))return;t=!0,Z.classList.add("dragging");let o=Z.getBoundingClientRect();s=o.left,r=o.top,e=n.clientX,a=n.clientY,Z.setPointerCapture(n.pointerId),n.stopPropagation()}),Z.addEventListener("pointermove",n=>{if(!t)return;let i=n.clientX-e,o=n.clientY-a,c=m.workspace==="schematic"?Me:L,d=Z.offsetWidth||360,b=Z.offsetHeight||330,f=Math.max(16,c.clientWidth-d-24),v=Math.max(16,c.clientHeight-b-24),x=re(s+i,16,f),h=re(r+o,16,v);Z.style.left=`${x}px`,Z.style.top=`${h}px`,m.selectionAnchor={x:x-18,y:h-18},n.stopPropagation()}),Z.addEventListener("pointerup",n=>{t&&(t=!1,Z.classList.remove("dragging"),Z.releasePointerCapture(n.pointerId),n.stopPropagation())})}function jg(){Vt("[data-workspace]").forEach(t=>{t.addEventListener("click",()=>kl(t.dataset.workspace))})}function kl(t){if(t==="schematic"&&!N||t==="bom"&&!Ve)return;m.workspace=t,nt.classList.remove("workspace-pcb","workspace-schematic","workspace-bom","workspace-stackup"),nt.classList.add(`workspace-${t}`),(t==="schematic"&&(m.activeTab==="view"||m.activeTab==="inspect"||m.activeTab==="stats")||t==="bom"||t==="stackup")&&Xs("layers");let e=Y('.rail-tab[data-tab="layers"]');e&&(t==="schematic"?(e.textContent="Pages",e.title="Schematic pages"):t==="bom"?(e.textContent="Summary",e.title="BoM summary"):(e.textContent="Layers",e.title="Layers and compare"));let a=t==="schematic",s=t==="bom",r=t==="stackup";if(L.hidden=a||s||r,Me&&(Me.hidden=!a),Cs&&(Cs.hidden=!a||!$),Os&&(Os.hidden=!a),Ps&&(Ps.hidden=!s),Ae&&(Ae.hidden=!r),Te.hidden=a||s||r,Ds.hidden=a||s||r,Ra&&(Ra.hidden=!a),Vt("[data-workspace]").forEach(n=>{n.classList.toggle("active",n.dataset.workspace===t)}),ra.textContent=s?"Semantic BoM active":a?$?"SVG DOM + WebGPU schematic world active":"WebGPU schematic world active":r?"Layer Stackup active":"WebGPU semantic glTF active",a&&!P.fitted&&(N.resize(),N.frameWorld(),P.fitted=!0),!a&&!s&&!r&&(E.renderer?.resize(),m.mode==="layer"?un():pe(performance.now(),{force:!0})),r)try{Ug()}catch(n){console.error("Failed to render stackup workspace",n),Ae&&(Ae.innerHTML=`
          <div class="selection-empty" style="padding:40px;text-align:center;">
            Stackup view failed to render. ${G(n?.message||String(n))}
          </div>
        `)}fn(),De()}function Bg(){Me.addEventListener("pointerdown",t=>{$?.worldActive||$?.active||(m.schematicDragging=!0,m.schematicLastX=t.clientX,m.schematicLastY=t.clientY,m.schematicStartX=t.clientX,m.schematicStartY=t.clientY,Me.setPointerCapture(t.pointerId))}),Me.addEventListener("pointermove",t=>{if($?.worldActive||$?.active||!m.schematicDragging||!N)return;let e=t.clientX-m.schematicLastX,a=t.clientY-m.schematicLastY;m.schematicLastX=t.clientX,m.schematicLastY=t.clientY,N.pan(e,a)}),Me.addEventListener("pointerup",async t=>{if(!($?.worldActive||$?.active)&&(m.schematicDragging=!1,Me.releasePointerCapture(t.pointerId),Math.hypot(t.clientX-m.schematicStartX,t.clientY-m.schematicStartY)<3)){let e=await N.pickFeature(t.clientX,t.clientY);e?Tg(e):Pa()}}),Me.addEventListener("dblclick",t=>{if($?.worldActive||$?.active)return;let e=N.hitPage(t.clientX,t.clientY);e&&ot(e.id,!0)}),Me.addEventListener("wheel",t=>{$?.worldActive||$?.active||(t.preventDefault(),N.zoom(t.deltaY,t.clientX,t.clientY))},{passive:!1})}async function mc(t){if(!ie)return;let e=L.getBoundingClientRect();m.selectionAnchor={x:t.clientX-e.left,y:t.clientY-e.top};let a=await Tl(t);if(k){Fp(a);return}(a.kind==="feature"||a.kind==="board")&&(m.selectedOccurrence=a.occurrenceIndex),a.featureId?Ot(a.featureId,!0):a.kind==="board"&&!E.renderer.identityOnly?wn():Ne()}async function Cg(t){if(!ie||!Gs)return;let e=await Tl(t),a=k?k.placements.get(e.occurrenceKey)?.board:E;if(!a)return;let s=a.scene.features.get(e.featureId),r=oa(s),n=r?Zr(r,a):null;Gs({clientX:t.clientX,clientY:t.clientY,reference:r||void 0,value:String(n?.value||s?.value||"")||void 0})}function Tl(t){let e=L.getBoundingClientRect();return Ml((t.clientX-e.left)*L.width/e.width,(t.clientY-e.top)*L.height/e.height)}function Ml(t,e){return k?Np(t,e):E.renderer.pick(ie,t,e,{activeNetId:m.activeNetId,selectedFeatureId:m.selectedFeatureId,layerOffsets:ul(),visibleLayers:m.mode==="3d"?E.visible3dLayers:E.compareLayers,showBoard:m.showBoard,showComponents:m.showComponents,componentOpacity:re(1-m.separation/.1,0,1),boardOpacity:1-m.separation*.72,isolateNet:m.isolateNet,compareMode:m.mode==="layer",compareOffsets:qt,visibleTileIds:m.mode==="3d"?E.visibleTileIds:null})}async function Il(t,e){if(!ie||!(k||E.renderer))return null;let a=L.getBoundingClientRect(),s=await Ml((t-a.left)*L.width/a.width,(e-a.top)*L.height/a.height),r=k?k.placements.get(s.occurrenceKey)?.board:E,n=s.featureId&&r?_c(r.scene.features.get(s.featureId),r):null;return{...s,renderer:void 0,selection:n}}function wn(){let t=m.selectedOccurrence,e=Ie;Ie=!0;try{Ne()}finally{Ie=e}m.selectedOccurrence=t,k&&(k.boardSelected=!0),Qs({kind:"board",sourceContext:"3D"})}function Og(t,e){let a=E.scene.componentFeatures.get(String(t)),s=a?E.scene.features.get(Number(a.featureId))?.bounds:null;if(!s)return null;let r=s[2]+s[5]>=0;return Sl([(s[0]+s[3])/2,(s[1]+s[4])/2,r?s[5]:s[2]],e)}function Sl(t,e){if(!ie||!E.renderer)return null;let a=e==null?0:E.renderer.occurrenceKeys.indexOf(String(e)),s=E.renderer.occurrenceMatrices[a];if(!s)return null;let r=wa(ie.matrix,bs(s,t),ie.viewport);if(!r)return null;let n=L.getBoundingClientRect();return{x:n.left+r.x*n.width/L.width,y:n.top+r.y*n.height/L.height}}function Rl(t){if(!$s())return;if(t.target instanceof HTMLInputElement){t.key==="Escape"&&t.target.blur();return}let e=t.key.toLowerCase();if(m.workspace==="schematic"){if(e==="/")t.preventDefault(),Xs("search"),be.querySelector("#entity-search")?.focus();else if(e==="escape")P.activeNetUid?(P.activeNetUid="",m.activeNetId=0,N.activeNetUid="",$?.setHighlightedNet(""),De()):Pa();else if(e==="~"||t.key==="~"){t.preventDefault();let a=m.selectedSchematicFeature?.netUid;a&&(P.activeNetUid===a?(P.activeNetUid="",m.activeNetId=0,N.activeNetUid="",$?.setHighlightedNet("")):bl(a,m.selectedSchematicFeature))}else if(e==="home")N?.frameWorld();else if(e==="[")js("previous");else if(e==="]")js("next");else if(e==="n"){t.preventDefault();let a=N?.cycleNetIntrasheetLink(t.shiftKey?-1:1);a?.pageId&&(m.selectedPageId=a.pageId,N.selectedPageId=a.pageId,Nl())}else if(t.altKey&&e==="arrowup")js("parent");else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;N?.pan(a,s)}return}if(k&&tg(t,e)){t.preventDefault();return}if(e==="/")t.preventDefault(),Xs("search"),be.querySelector("#entity-search").focus();else if(e==="escape")Ne();else if(e==="i"&&m.workspace==="pcb"&&it())t.preventDefault(),Ct(!m.isolateNet);else if(e==="home")K.frame(k&&k.bounds||jt());else if(e==="`")nn(!m.showStats);else if(["x","y","z"].includes(e))K.setAxis(e,t.shiftKey);else if(e==="f")K.flip();else if(e==="r")K.rotateZ(t.shiftKey?-1:1);else if(e===" "){t.preventDefault();let a=E.scene.features.get(m.selectedFeatureId);a?.bounds&&K.setFocus([(a.bounds[0]+a.bounds[3])/2,(a.bounds[1]+a.bounds[4])/2,(a.bounds[2]+a.bounds[5])/2])}else if(t.key.startsWith("Arrow")){t.preventDefault();let a=t.key==="ArrowRight"?32:t.key==="ArrowLeft"?-32:0,s=t.key==="ArrowDown"?32:t.key==="ArrowUp"?-32:0;K.pan(a,s,L.clientHeight,m.mode==="layer")}}function Xs(t){m.activeTab=t,nt.classList.remove("panel-collapsed"),Vt(".rail-tab").forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),Vt(".tab-panel").forEach(e=>{e.classList.toggle("active",e.dataset.panel===t)})}function Al(){let t=Te.getContext("2d");t.clearRect(0,0,Te.width,Te.height);let e=[Te.width/2,Te.height/2],a=K.basis(),s=[{axis:"x",label:"X",color:"#e23838",vector:[1,0,0]},{axis:"y",label:"Y",color:"#2dbd50",vector:[0,1,0]},{axis:"z",label:"Z",color:"#3157d5",vector:[0,0,1]}],r=[];for(let n of s)for(let i of[-1,1]){let o=n.vector.map(d=>d*i),c=[Wr(o,a.right),-Wr(o,a.up),Wr(o,a.back)];r.push({...n,sign:i,depth:c[2],point:[e[0]+c[0]*34,e[1]+c[1]*34]})}for(let n of s){let i=r.find(o=>o.axis===n.axis&&o.sign===1);t.strokeStyle=n.color,t.lineWidth=2.4,t.beginPath(),t.moveTo(...e),t.lineTo(...i.point),t.stroke()}Ls=[];for(let n of r.sort((i,o)=>o.depth-i.depth)){let i=n.sign===1,o=i?13:9;t.beginPath(),t.arc(n.point[0],n.point[1],o,0,Math.PI*2),t.fillStyle=i?n.color:`${n.color}66`,t.fill(),t.lineWidth=2,t.strokeStyle=Lg(n.color,i?.45:.58),t.stroke(),i&&(t.fillStyle="#07101c",t.font="700 13px system-ui",t.textAlign="center",t.textBaseline="middle",t.fillText(n.label,n.point[0],n.point[1]+.5)),Ls.push({...n,radius:o+5})}}function _l(){!Te||Te.dataset.bound==="true"||(Te.dataset.bound="true",Te.addEventListener("click",t=>{let e=Te.width/Te.clientWidth,a=Te.height/Te.clientHeight,s=[t.offsetX*e,t.offsetY*a],r=Ls.map(n=>({item:n,distance:Math.hypot(s[0]-n.point[0],s[1]-n.point[1])})).filter(({item:n,distance:i})=>i<=n.radius).sort((n,i)=>n.distance-i.distance)[0]?.item;r&&K.setAxis(r.axis,r.sign<0)}))}function Pg(){if(m.mode!=="layer"||!ie){Ds.innerHTML="";return}let t=jt(),e=jc();Ds.innerHTML=E.scene.copperLayers.filter(a=>e.has(Number(a.id))).map(a=>{let s=qt.get(Number(a.id))||[0,0,0],r=Dg([t[0]+s[0],t[4]+s[1],0],ie.matrix,L.clientWidth,L.clientHeight);return!r||r[0]<-100||r[0]>L.clientWidth+100||r[1]<-100||r[1]>L.clientHeight+100?"":`<span style="left:${r[0]}px;top:${r[1]}px">${G(a.name)}</span>`}).join("")}function Nl(){if(m.workspace!=="schematic"||!N){Ra.innerHTML="";return}Ra.innerHTML=P.visiblePages.filter(t=>N.pagePixelWidth(t)>120).map(t=>{let[e,a]=N.worldToScreen(t.worldX+8*N.scale,t.worldY-6*N.scale),s=t.id===m.selectedPageId,n=P.activeNetUid&&t.netUids.includes(P.activeNetUid)?"#18ef52":s?"#3b82f6":"#4b8de8";return`<div class="schematic-page-label" style="left:${e}px;top:${a}px;border-left-color:${n}">
        <strong>${G(t.name)}</strong>
        <small>Page ${t.sheetNumber} &middot; ${t.featureCount.toLocaleString()} features</small>
      </div>`}).join("")}function Dg(t,e,a,s){let r=t[0],n=t[1],i=t[2],o=e[0]*r+e[4]*n+e[8]*i+e[12],c=e[1]*r+e[5]*n+e[9]*i+e[13],d=e[3]*r+e[7]*n+e[11]*i+e[15];return Math.abs(d)<1e-8?null:[(o/d*.5+.5)*a,(.5-c/d*.5)*s]}function Wr(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function Lg(t,e){let a=t.replace("#","");return`#${[0,2,4].map(s=>Math.round(parseInt(a.slice(s,s+2),16)*e).toString(16).padStart(2,"0")).join("")}`}function Yr(t,e){m.frameSamples.push({intervalMs:t,cpuMs:e}),m.frameSamples.length>180&&m.frameSamples.shift()}function yc(t,e){if(!t.length)return 0;let a=[...t].sort((s,r)=>s-r);return a[Math.min(a.length-1,Math.floor((a.length-1)*e))]}function $r(t){if(!_s||(m.frames+=1,t-m.fpsAt<=500))return;m.fps=m.frames*1e3/(t-m.fpsAt);let e=m.frameSamples;if(m.frameIntervalMs=e.length?e.reduce((n,i)=>n+i.intervalMs,0)/e.length:0,m.frameCpuMs=e.length?e.reduce((n,i)=>n+i.cpuMs,0)/e.length:0,m.frameIntervalP95Ms=yc(e.map(n=>n.intervalMs),.95),m.frameCpuP95Ms=yc(e.map(n=>n.cpuMs),.95),m.frames=0,m.fpsAt=t,Kc(),m.workspace==="bom"){let n=Ve?.payload?.counts||{},i=[["Renderer","BoM DOM table"],["Schema",Ve?.payload?.schema||"-"],["Grouped rows",n.rows||0],["Components",n.components||0],["DNP components",n.dnpComponents||0],["Extra columns",Ve?.payload?.extraColumns?.length||0],["Frame interval",`${m.frameIntervalMs.toFixed(2)} ms avg / ${m.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${m.frameCpuMs.toFixed(2)} ms avg / ${m.frameCpuP95Ms.toFixed(2)} p95`],["FPS",m.fps.toFixed(1)]];_s.innerHTML=i.map(([o,c])=>`<dt>${o}</dt><dd>${c}</dd>`).join("");return}let a=m.workspace==="schematic"&&N?N.stats():null,s=m.workspace==="schematic"&&$?$.stats():null,r=m.workspace==="schematic"&&N?$?.active?[["Renderer","SVG DOM schematic detail"],["Pages",P.pages.length],["Mounted pages",s.mountedPages],["Active page",s.activePage],["DOM nodes",s.domNodes.toLocaleString()],["Indexed features",s.indexedFeatures.toLocaleString()],["Indexed nets",s.indexedNets.toLocaleString()],["SVG cache",`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`],["Selection",`${s.selectionMs.toFixed(1)} ms`],["Active net",E.scene.nets.find(n=>n.uid===P.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Tracking verts",a.netFlowVertices.toLocaleString()],["Mount",`${s.mountMs.toFixed(1)} ms`],["Highlight",`${s.highlightMs.toFixed(1)} ms`],["Fallback",s.fallbackReason||"-"],["Frame interval",`${m.frameIntervalMs.toFixed(2)} ms avg / ${m.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${m.frameCpuMs.toFixed(2)} ms avg / ${m.frameCpuP95Ms.toFixed(2)} p95`],["FPS",m.fps.toFixed(1)]]:[["Renderer",$?"SVG DOM + WebGPU world":"WebGPU schematic world"],["Pages",P.pages.length],["Visible pages",P.visiblePages.length],["DOM pages",s?s.mountedPages:0],["DOM nodes",s?s.domNodes.toLocaleString():"0"],["Indexed SVG features",s?s.indexedFeatures.toLocaleString():"0"],["SVG cache",s?`${s.cachedSvgPages} pages / ${(s.cachedSvgBytes/1048576).toFixed(1)} MB`:"0 pages"],["JS heap",s?.heapMb?`${s.heapMb.toFixed(1)} MB`:"-"],["Hierarchy links",P.manifest.edges?.length||0],["Selected page",P.byId.get(m.selectedPageId)?.name||"-"],["Active net",E.scene.nets.find(n=>n.uid===P.activeNetUid)?.name||"-"],["Tracking links",`${a.netFlowSegments} total / ${a.netFlowIntrasheetSegments} local`],["Downloaded",`${(N.downloadedBytes/1048576).toFixed(1)} MB`],["Resident vectors",`${(a.residentVectorBytes/1048576).toFixed(1)} MB`],["Vector pages",`${a.vectorChunks} loaded / ${a.vectorLoads} loading`],["Vector draw",`${a.vectorVertices.toLocaleString()} verts / ${a.vectorDrawChunks} chunks`],["Native detail",`${a.nativeDetailPages} pages @ ${a.nativePxPerMm} / ${a.nativeThresholdPxPerMm} px/mm`],["Vector failures",a.failedVectorChunks],["Truncated",a.truncatedVectors],["Frame interval",`${m.frameIntervalMs.toFixed(2)} ms avg / ${m.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${m.frameCpuMs.toFixed(2)} ms avg / ${m.frameCpuP95Ms.toFixed(2)} p95`],["FPS",m.fps.toFixed(1)]]:[["Renderer","WebGPU semantic glTF"],["Mode",m.mode==="3d"?"3D":"Layer Compare"],["Visible layers",m.mode==="3d"?E.visible3dLayers.size:E.compareLayers.size],["Resident tiles",E.scene.loaded.size],["Loading tiles",E.scene.loading.size],["Failed tiles",E.scene.failed.size],["Triangles",Math.round(E.triangles).toLocaleString()],["Downloaded",`${(E.loadedBytes/1048576).toFixed(1)} MB`],["Resident GLB",`${(E.residentTileBytes/1048576).toFixed(1)} MB`],["Resident GPU",`${(E.residentTileGpuBytes/1048576).toFixed(1)} MB`],["Tile loads",E.tileLoads.toLocaleString()],["Tile evictions",E.tileEvictions.toLocaleString()],["Tile scheduler",`${E.tileSchedulerMs.toFixed(2)} ms`],["Active net",E.scene.nets.find(n=>Number(n.id)===m.activeNetId)?.name||"-"],["Frame interval",`${m.frameIntervalMs.toFixed(2)} ms avg / ${m.frameIntervalP95Ms.toFixed(2)} p95`],["CPU frame",`${m.frameCpuMs.toFixed(2)} ms avg / ${m.frameCpuP95Ms.toFixed(2)} p95`],["FPS",m.fps.toFixed(1)]];_s.innerHTML=r.map(([n,i])=>`<dt>${n}</dt><dd>${i}</dd>`).join("")}function En(t){return`rgb(${t.slice(0,3).map(e=>Math.round(e*255)).join(" ")})`}function Ug(){if(!Ae)return;let t=E.scene.layers||[];if(!t.length){Ae.innerHTML='<div class="selection-empty" style="padding:40px;text-align:center;">No stackup information available for this board.</div>';return}let e=t.filter(M=>["copper","dielectric","paste","silkscreen","soldermask"].includes(M.role)),a=E.topology.board?.stackup||{},s=M=>{if(M==null||M==="")return"None";let B=String(M);return G(B.includes(".")?B.split(".").pop():B)},r=(M,B=4)=>{let O=Number(M);return Number.isFinite(O)&&O>0?O.toFixed(B):"-"},n=(M,B=3)=>{let O=Number(M);return Number.isFinite(O)?O.toFixed(B):"-"},i=M=>{if(M==null||M==="")return"No";if(typeof M=="boolean")return M?"Yes":"No";let B=String(M).trim().toLowerCase(),O=B.includes(".")?B.split(".").pop():B;return["0","false","no","n","off","none"].includes(O)?"No":(["1","true","yes","y","on"].includes(O),"Yes")},o=M=>({copper:"Copper",dielectric:"Dielectric",paste:"Paste",silkscreen:"Silkscreen",soldermask:"Solder mask"})[M]||String(M||"Layer"),c=M=>M.role!=="dielectric"?"":M.type==="core"?"Core":M.type==="prepreg"||(M.material||"").toLowerCase().includes("prepreg")?"Prepreg":"Core",d=(M,B=4)=>{let O=Number(M.thickness_mm);return Number.isFinite(O)&&O>0?`${O.toFixed(B)} mm`:"Not specified"},b=M=>{let B=o(M.role),O=String(M.material||"").trim(),J=O&&O.toLowerCase()!==String(M.role||"").toLowerCase();if(M.role==="dielectric"){let ce=[J?O:"",r(M.epsilon_r,3)!=="-"?`\u03B5r ${r(M.epsilon_r,3)}`:"",r(M.loss_tangent,4)!=="-"?`tan \u03B4 ${r(M.loss_tangent,4)}`:""].filter(Boolean).join(" \xB7 ");return{primary:`${M.name} \xB7 ${c(M)}`,secondary:ce}}return{primary:[M.name,B,J?O:""].filter(Boolean).join(" \xB7 "),secondary:""}},f=0,v=0,x=0,h=0;e.forEach(M=>{h+=M.thickness_mm||0,M.role==="copper"?M.name.toLowerCase().includes("gnd")||M.name.toLowerCase().includes("pwr")||M.name.toLowerCase().includes("plane")?v++:f++:M.role==="dielectric"&&x++});let l=E.scene.copperLayers||[],g=0,u=0,p=0,y=[...(E.scene.manifest?.barrels||[]).filter(M=>M.kind==="via"),...[...E.scene.features.values()].filter(M=>M.kind==="via")],w=Wo(l,y);g=w.counts.thru,u=w.counts.blind,p=w.counts.buried;let T=w.spans,I=30,S=I,R=[],_=new Map(e.map((M,B)=>[M,B])),A=Kg(e),C=(M,B)=>{let O=A.get(M.name);if(O!==void 0)return O;let J=Number(M.stack_index);return Number.isFinite(J)?J:B+1e5},D=[...e].sort((M,B)=>{let O=C(M,_.get(M)||0),J=C(B,_.get(B)||0);return O!==J?O-J:(B.z_mm||0)-(M.z_mm||0)});D.forEach(M=>{let B=12;M.role==="dielectric"?B=Math.max(160,Math.min(360,(M.thickness_mm||.1)*140)):M.role==="copper"?B=22:M.role==="soldermask"&&(B=14),R.push({...M,svgY:S,svgHeight:B}),S+=B});let j=800,z=130,W=240,te=z+W+16,oe=te+84,je="";R.forEach(M=>{let B=M.color||"#7f7f7f";M.role==="copper"?B=M.color||"#f97316":M.role==="dielectric"?B="#a98d5c":M.role==="paste"?B="#cbd5e1":M.role==="soldermask"?B="#1b4332":M.role==="silkscreen"&&(B="#e2e8f0");let O=l.findIndex(Ll=>Ll.name===M.name),J=b(M),ce=M.svgY+M.svgHeight/2,we=!!J.secondary&&M.svgHeight>=38,Pt=we?ce-5:ce+3,ir=G(M.id),Ua=G(M.name),Xe=Number.isFinite(Number(M.thickness_mm))&&Number(M.thickness_mm)>0,Pl=G(Xe?d(M):"\u2014"),Dl=G([J.primary,J.secondary,`Thickness ${d(M)}`].filter(Boolean).join("; "));je+=`
      <g class="stackup-svg-layer" data-layer-id="${ir}" data-layer-name="${Ua}">
        <title>${Dl}</title>
        <rect x="${z}" y="${M.svgY}" width="${W}" height="${M.svgHeight}" fill="${B}" opacity="0.85" rx="1"/>
        <text x="${z-8}" y="${M.svgY+M.svgHeight/2+3}" fill="var(--muted)" font-size="9px" text-anchor="end" font-weight="700">
          ${M.role==="copper"?O+1:""}
        </text>
        <path class="stackup-layer-dimension" d="M ${te+6} ${M.svgY+1} H ${te} V ${M.svgY+M.svgHeight-1} H ${te+6}" />
        <text class="stackup-layer-thickness" x="${te+10}" y="${ce+3}" fill="var(--muted)" font-size="8.5px" font-weight="650">
          ${Pl}
        </text>
        <text class="stackup-layer-name" x="${oe}" y="${Pt}" fill="var(--foreground)" font-size="9px" font-weight="650">
          ${G(J.primary)}
        </text>
        ${we?`<text class="stackup-layer-metadata" x="${oe}" y="${ce+10}" fill="var(--muted)" font-size="8px">${G(J.secondary)}</text>`:""}
      </g>
    `});let de="",Be=R.filter(M=>M.role==="copper");T.forEach((M,B)=>{let O=R.find(Xe=>Xe.name===M.startName),J=R.find(Xe=>Xe.name===M.endName);if(!O||!J)return;let ce=O.svgY,we=J.svgY+J.svgHeight,Pt=z+(B+1)*W/(T.length+1),ir=M.type==="thru"?"Thru":M.type==="blind"?"Blind":"Buried",Ua=`var(--stackup-via-${M.type})`;de+=`
      <g class="stackup-svg-via" data-via-type="${M.type}">
        <title>${ir}: ${M.startName} \u2192 ${M.endName}</title>
        ${Be.map(Xe=>Xe.svgY>=O.svgY&&Xe.svgY<=J.svgY?`<rect x="${Pt-5}" y="${Xe.svgY}" width="10" height="${Xe.svgHeight}" fill="${Ua}" rx="0.5" />`:"").join("")}
        <rect x="${Pt-2}" y="${ce}" width="4" height="${we-ce}" fill="${Ua}" opacity="0.95" />
        <rect x="${Pt-.75}" y="${ce-1}" width="1.5" height="${we-ce+2}" fill="var(--panel)" opacity="0.9" />
      </g>
    `});let Le=`
    <svg class="stackup-visual-svg" viewBox="0 0 ${j} ${S+10}" width="${j}" height="${S+10}">
      <g class="stackup-svg-column-headings" aria-hidden="true">
        <text x="${te+10}" y="15">Thickness</text>
        <text x="${oe}" y="15">Layer / material properties</text>
      </g>
      <g class="stackup-total-dimension" aria-label="Total board thickness ${h.toFixed(4)} millimetres">
        <path d="M 76 ${I} H 68 V ${S} H 76" />
        <text x="68" y="15">Total ${h.toFixed(4)} mm</text>
      </g>
      ${je}
      ${de}
    </svg>
    <div class="stackup-via-legend" aria-label="Via span legend">
      <span><i data-via-type="thru"></i>Thru</span>
      <span><i data-via-type="blind"></i>Blind</span>
      <span><i data-via-type="buried"></i>Buried</span>
    </div>
  `,ve="";D.forEach(M=>{let B="silk";M.role==="copper"?B="copper":M.role==="dielectric"?B="dielectric":M.role==="paste"?B="paste":M.role==="soldermask"&&(B="mask");let O=c(M),J=G(M.id),ce=G(M.name),we=b(M);ve+=`
      <tr data-layer-id="${J}" data-layer-name="${ce}" tabindex="0" aria-label="${G(`${we.primary}; thickness ${d(M)}`)}">
        <td><strong>${ce}</strong></td>
        <td><span class="stackup-badge ${B}">${M.role}</span></td>
        <td>${O||"-"}</td>
        <td>${G(M.material||"-")}</td>
        <td>${M.role==="dielectric"?r(M.epsilon_r,3):"-"}</td>
        <td>${M.role==="dielectric"?r(M.loss_tangent,4):"-"}</td>
        <td>${M.thickness_mm?M.thickness_mm.toFixed(4)+" mm":"-"}</td>
      </tr>
    `});let qe="",Ue=E.topology.board?.net_classes||[],ct=M=>{let B=n(M);return B==="-"?B:`${B} mm`};Ue.length?Ue.forEach(M=>{qe+=`
        <tr>
          <td><strong>${M.name}</strong></td>
          <td>${ct(M.track_width)}</td>
          <td>${ct(M.clearance)}</td>
          <td>${ct(M.diff_pair_width)}</td>
          <td>${ct(M.diff_pair_gap)}</td>
          <td>${Number.isFinite(Number(M.via_diameter))?`${n(M.via_drill)}/${n(M.via_diameter)} mm`:"-"}</td>
        </tr>
      `}):qe=`
      <tr>
        <td colspan="6" class="selection-empty" style="text-align: center;">No design rules or impedance classes defined.</td>
      </tr>
    `,Ae.innerHTML=`
    <div class="stackup-header">
      <div class="stackup-header-title">
        <h1>Layer Stackup</h1>
        <p>Board cross-section profile, layer properties & design rules</p>
      </div>
    </div>

    <div class="stackup-workspace-body">
      <div class="stackup-diagram-card">
        <span class="stackup-section-title">Cross-Section Profile</span>
        ${Le}
      </div>
      <aside class="stackup-side-panel">
      <div class="stackup-summary-grid">
        <div class="stackup-summary-card">
          <label>Total Thickness</label>
          <span>${h.toFixed(4)} mm</span>
        </div>
        <div class="stackup-summary-card">
          <label>Copper Layers</label>
          <span>${l.length} (${f} Sig / ${v} Plane)</span>
        </div>
        <div class="stackup-summary-card">
          <label>Dielectrics</label>
          <span>${x} Layers</span>
        </div>
        <div class="stackup-summary-card">
          <label>Thru Vias</label>
          <span>${g}</span>
        </div>
        <div class="stackup-summary-card">
          <label>Blind Vias</label>
          <span>${u}</span>
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
                ${qe}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </aside>
    </div>
  `;let Jt=(M,B)=>{Ae.querySelectorAll(".stackup-svg-layer").forEach(O=>{let J=O.dataset.layerId===M;O.classList.toggle("active",J&&B)}),Ae.querySelectorAll(".stackup-table tbody tr[data-layer-id]").forEach(O=>{let J=O.dataset.layerId===M;O.classList.toggle("active",J&&B)})},nr=M=>{let B=Ae.querySelector(".stackup-diagram-card"),O=Ae.querySelector(`.stackup-svg-layer[data-layer-id="${CSS.escape(M)}"]`);if(!B||!O||B.scrollHeight<=B.clientHeight)return;let J=B.getBoundingClientRect(),ce=O.getBoundingClientRect(),we=B.scrollTop+ce.top-J.top-(B.clientHeight-ce.height)/2,Pt=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;B.scrollTo({top:Math.max(0,we),behavior:Pt?"auto":"smooth"})},La=(M,{revealDiagram:B=!1}={})=>{M.forEach(O=>{let J=()=>{let we=O.dataset.layerId;Jt(we,!0),B&&nr(we)},ce=()=>Jt(null,!1);O.addEventListener("mouseenter",J),O.addEventListener("mouseleave",ce),B&&(O.addEventListener("focus",J),O.addEventListener("blur",ce))})};La(Ae.querySelectorAll(".stackup-svg-layer")),La(Ae.querySelectorAll(".stackup-table tbody tr[data-layer-id]"),{revealDiagram:!0})}function Kg(t){let e=t.filter(r=>r.role==="dielectric");if(!(e.length===1&&e[0]?.name==="Board"))return new Map;let s=new Map;return["F.SilkS","F.Paste","F.Mask","F.Cu","Board","B.Cu","B.Mask","B.Paste","B.SilkS"].forEach((r,n)=>s.set(r,n)),s}function Fl(){let t=null;return{begin(){return t?.abort(),t=new AbortController,t},owns(e){return e!==null&&e===t&&!e.signal.aborted},cancel(){t?.abort(),t=null}}}async function jl(t,e,{owner:a,bundleUrl:s,loadBundle:r,now:n=()=>performance.now()}){let i=n(),o={},{signal:c}=e,d=()=>a.owns(e)&&t.isConnected;try{t.renderLoading();let b=n(),{bundle:f,topology:v,semanticGeometry:x,assetCache:h}=await r(s,o,c);if(o.bundle_group_total_ms=n()-b,!d())return;t.renderShell();let l=n(),g=await t.mountViewer({topology:v,semanticGeometry:x,readiness:f.readiness,assetCache:h,signal:c});if(!d()){g?.dispose?.();return}t.publishController(g),o.mount_and_first_frame_ms=n()-l,Object.assign(o,g?.performance||{}),o.reload_to_visible_ms=n()-i,t.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"board-visible",readiness_stage:f.readiness?.stage||"semantic-ready",readiness_progress:f.readiness?.progress??100,timings:o})}catch(b){if(!d())return;t.renderError(b),t.emitError(b)}}var Gg="prism.visualizer_bundle.a0";function zg(){return`
    <style>
      ${Tn}
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
      /* System mode (SB2-31f): board labels, the move gizmo and the key list. */
      #system-labels { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
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
  `}function Vg(t){return String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}async function Bl(t,e=null,a="fetch",s=void 0){let r=performance.now(),n=await fetch(t,{cache:"no-store",signal:s});if(!n.ok)throw new Error(`Failed to load ${t}: ${n.status}`);let i=await n.json();return e&&(e[`${a}_fetch_parse_ms`]=performance.now()-r,e[`${a}_content_length`]=Number(n.headers.get("content-length")||0)),i}async function Cl(t,e,a){let s=new URL(t,document.baseURI).toString(),r=new URL(s).searchParams.get("viewer")||"",n=Ga.open(),i=await n.peekJson(s).catch(()=>null),o=!!i;i||(i=await Bl(s,e,"bundle",a),lr(i)&&n.store(s,new TextEncoder().encode(JSON.stringify(i)))),e&&(e.bundle_from_cache=o);let c=lr(i)&&n.enabled?n:null;if(i.schema!==Gg)throw new Error(`Unsupported visualizer bundle schema: ${i.schema||"missing"}`);let d=new URL(i.topology||"topology.json",s),b=new URL(i.semantic_geometry||"semantic_geometry.json",s),f=(h,l)=>c?c.fetchJson(h.toString(),{signal:a}):Bl(h,e,l,a),[v,x]=await Promise.all([f(d,"topology"),f(b,"semantic_geometry")]);return{bundle:i,topology:v,semanticGeometry:Mn(x,s,i,r),assetCache:c}}var kn=class extends HTMLElement{static get observedAttributes(){return["bundle-url","workspace","mode","move-allowed"]}constructor(){super(),this.attachShadow({mode:"open"}),this.controller=null,this.reloadOwner=Fl(),this.pendingSelection=null,this.pendingHiddenComponents=null,this.pendingOccurrences=null,this.reloadQueued=!1,this.reloadSource=null}connectedCallback(){this.queueReload()}disconnectedCallback(){this.reloadOwner.cancel(),this.controller?.dispose?.(),this.controller=null,this.reloadSource=null}attributeChangedCallback(e,a,s){if(!(!this.isConnected||a===s)){if(e==="workspace"){this.controller?.setWorkspace?.(this.workspace);return}if(e==="move-allowed"){this.setMoveAllowed(s==="true");return}this.queueReload()}}get workspace(){return this.getAttribute("workspace")==="stackup"?"stackup":"pcb"}get systemMode(){return this.getAttribute("mode")==="system"}queueReload(){let e=this.systemMode?"system":this.getAttribute("bundle-url");!e||e===this.reloadSource||(this.reloadSource=e,!this.reloadQueued&&(this.reloadQueued=!0,queueMicrotask(()=>{this.reloadQueued=!1,this.isConnected&&this.reload()})))}async reload(){let e=this.getAttribute("bundle-url"),a=this.reloadOwner.begin();if(this.controller?.dispose?.(),this.controller=null,this.systemMode){await this.reloadSystem(a);return}if(!e){this.shadowRoot.innerHTML="<style>:host{display:block;height:100%;font:14px system-ui;color:#94a3b8}</style><div>Semantic bundle URL is missing.</div>";return}await jl(this,a,{owner:this.reloadOwner,bundleUrl:e,loadBundle:Cl})}async reloadSystem(e){let{signal:a}=e,s=()=>this.reloadOwner.owns(e)&&this.isConnected;try{this.renderShell();let r=await Gc({root:this.shadowRoot,loadBundle:(i,o)=>Cl(i,null,o),isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{a.aborted||this.emit("selectionchange",{selection:i})},onContextMenu:i=>{a.aborted||this.emit("contextmenu",i)},onViewStateChange:i=>{a.aborted||this.emitViewState(i)},onEmphasis:i=>{a.aborted||this.emit("emphasis",{results:i})},onStatus:i=>{a.aborted||this.emit("systemstatus",i)},onMove:i=>{a.aborted||this.emit("move",i)}});if(!s()){r?.dispose?.();return}this.controller=r,this.pendingGpuBudget!=null&&r.setGpuBudget(this.pendingGpuBudget),this.pendingSystemScene&&r.setSystemScene(this.pendingSystemScene),this.pendingNetEmphasis&&r.setNetEmphasis(this.pendingNetEmphasis),r.setMoveAllowed(!!(this.pendingMoveAllowed??this.getAttribute("move-allowed")==="true")),this.pendingLabels!=null&&r.setLabelsVisible(this.pendingLabels);let n=this.getViewState();n&&this.emitViewState(n),this.emitReady({schema:"prism.semantic_viewer_performance.a0",milestone:"system-mounted"})}catch(r){if(!s())return;this.renderError(r),this.emitError(r)}}emit(e,a){this.dispatchEvent(new CustomEvent(`prism-semantic-viewer:${e}`,{bubbles:!0,composed:!0,detail:a}))}setSystemScene(e){this.pendingSystemScene=e||null,e&&this.controller?.setSystemScene?.(e)}setNetEmphasis(e){return this.pendingNetEmphasis=Array.isArray(e)?e:[],this.controller?.setNetEmphasis?.(this.pendingNetEmphasis)??[]}frameNetEmphasis(e=null,a=null){return this.controller?.frameNetEmphasis?.(e,a)??!1}setMoveAllowed(e){this.pendingMoveAllowed=!!e,this.controller?.setMoveAllowed?.(this.pendingMoveAllowed)}setMoveMode(e){this.controller?.setMoveMode?.(e)}setMoveSpace(e){this.controller?.setMoveSpace?.(e)}previewPose(e){this.controller?.previewPose?.(e)}cancelMove(){this.controller?.cancelMove?.()}getMoveState(){return this.controller?.getMoveState?.()??null}setLabelsVisible(e){this.pendingLabels=!!e,this.controller?.setLabelsVisible?.(this.pendingLabels)}setHelpVisible(e){this.controller?.setHelpVisible?.(e)}frameAll(){this.controller?.frameAll?.()}frameBoard(e){return this.controller?.frameBoard?.(e)??!1}frameParts(e){return this.controller?.frameParts?.(e)??!1}renderLoading(){this.shadowRoot.innerHTML='<style>:host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}</style><div style="display:grid;place-items:center;height:100%">Loading semantic visualizer...</div>'}renderShell(){this.shadowRoot.innerHTML=zg()}renderError(e){console.error(e),this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}
        .error{height:100%;display:grid;place-items:center;padding:24px}
        pre{max-width:100%;white-space:pre-wrap;color:#fecaca;background:#111827;border:1px solid #374151;padding:16px}
      </style>
      <div class="error"><pre>${Vg(e?.stack||e?.message||String(e))}</pre></div>
    `}mountViewer({topology:e,semanticGeometry:a,readiness:s,assetCache:r=null,signal:n}){return en({root:this.shadowRoot,topology:e,semanticGeometry:a,readiness:s,workspaceScope:"3d",assetCache:r,deferComponents:!!this.pendingOccurrences,isActive:()=>this.getAttribute("active")==="true",onSelectionChange:i=>{n.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:selectionchange",{bubbles:!0,composed:!0,detail:{selection:i}}))},onContextMenu:i=>{n.aborted||this.dispatchEvent(new CustomEvent("prism-semantic-viewer:contextmenu",{bubbles:!0,composed:!0,detail:i}))},onViewStateChange:i=>{n.aborted||this.emitViewState(i)},onPerformanceEvent:i=>{n.aborted||(console.info("[prism-3d-perf]",i),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:performance",{bubbles:!0,composed:!0,detail:i})))}})}publishController(e){this.controller=e,this.controller?.setWorkspace?.(this.workspace),this.pendingHiddenComponents&&this.controller?.setHiddenComponents?.(this.pendingHiddenComponents),this.pendingOccurrences&&this.controller?.setOccurrences?.(this.pendingOccurrences),this.pendingGpuBudget!=null&&this.controller?.setGpuBudget?.(this.pendingGpuBudget),this.pendingSelection&&this.controller?.setSelection?.(this.pendingSelection),this.pendingHighlightedNets?.length&&this.controller?.setHighlightedNets?.(this.pendingHighlightedNets);let a=this.getViewState();a&&this.emitViewState(a)}emitViewState(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:viewstatechange",{bubbles:!0,composed:!0,detail:e}))}emitReady(e){console.info("[prism-3d-perf]",e),this.dispatchEvent(new CustomEvent("prism-semantic-viewer:ready",{bubbles:!0,composed:!0,detail:e}))}emitError(e){this.dispatchEvent(new CustomEvent("prism-semantic-viewer:error",{bubbles:!0,detail:{error:e}}))}setSelection(e){this.pendingSelection=e||null,this.controller?.setSelection?.(this.pendingSelection)}setHighlightedNets(e){this.pendingHighlightedNets=Array.isArray(e)?[...e]:[],this.controller?.setHighlightedNets?.(this.pendingHighlightedNets)}setHiddenComponents(e){this.pendingHiddenComponents=Array.isArray(e)?[...e]:[],this.controller?.setHiddenComponents?.(this.pendingHiddenComponents)}setOccurrences(e){this.pendingOccurrences=e==null?null:Array.from(e,a=>a?.matrix?{matrix:[...a.matrix],key:a.key}:[...a]),this.controller?.setOccurrences?.(this.pendingOccurrences)}pickAt(e,a){return Promise.resolve(this.controller?.pickAt?.(e,a)??null)}projectComponent(e,a){return this.controller?.projectComponent?.(e,a)??null}setStatsOverlay(e){this.controller?.setStatsOverlay?.(e)}getStats(){return this.controller?.stats?.()??null}setLodOverride(e){this.controller?.setLodOverride?.(e)}setGpuBudget(e){this.pendingGpuBudget=e,this.controller?.setGpuBudget?.(e)}projectPoint(e,a){return this.controller?.projectPoint?.(e,a)??null}getComponentReferences(){return this.controller?.getComponentReferences?.()??[]}resize(){this.controller?.resize?.()}getViewState(){return this.controller?.getViewState?.()??null}setViewMode(e){this.controller?.setViewMode?.(e)}setLayerVisible(e,a,s=null){this.controller?.setLayerVisible?.(e,a,s)}applyLayerPreset(e,a=null){this.controller?.applyLayerPreset?.(e,a)}setShowBoard(e){this.controller?.setShowBoard?.(e)}setShowComponents(e){this.controller?.setShowComponents?.(e)}setShowPlaceholders(e){this.controller?.setShowPlaceholders?.(e)}setRealisticColors(e){this.controller?.setRealisticColors?.(e)}setSeparation(e,a=null){this.controller?.setSeparation?.(e,a)}showNetLayers(){this.controller?.showNetLayers?.()}setNetIsolation(e){this.controller?.setNetIsolation?.(e)}};function Ol(){customElements.get("prism-semantic-viewer")||customElements.define("prism-semantic-viewer",kn)}window.__PRISM_SEMANTIC_VIEWER_MANUAL_BOOT__=!0;Ol();
