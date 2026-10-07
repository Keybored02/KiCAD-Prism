import viewerCss from "../styles.css";
import { AssetCache } from "./asset-cache.js";
import { absolutizeAssetPaths, bundleIsFinal } from "./bundle-urls.js";
import { mountStandaloneViewer, mountSystemViewer } from "./main.js";
import { createReloadOwner, runSemanticViewerReload } from "./semantic-viewer-reload.js";

const SUPPORTED_SCHEMA = "prism.visualizer_bundle.a0";

function shellHtml() {
  return `
    <style>
      ${viewerCss}
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
  `;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
}

async function fetchJson(url, timings = null, label = "fetch", signal = undefined) {
  const started = performance.now();
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  const value = await response.json();
  if (timings) {
    timings[`${label}_fetch_parse_ms`] = performance.now() - started;
    timings[`${label}_content_length`] = Number(response.headers.get("content-length") || 0);
  }
  return value;
}

async function loadBundle(bundleUrl, timings, signal) {
  const absoluteBundleUrl = new URL(bundleUrl, document.baseURI).toString();
  const cacheKey = new URL(absoluteBundleUrl).searchParams.get("viewer") || "";
  // SB2-26: a final bundle is read from the browser cache; earlier stages
  // rewrite bundle.json in place, so only a final one is ever stored.
  const cache = AssetCache.open();
  let bundle = await cache.peekJson(absoluteBundleUrl).catch(() => null);
  const cachedBundle = Boolean(bundle);
  if (!bundle) {
    bundle = await fetchJson(absoluteBundleUrl, timings, "bundle", signal);
    if (bundleIsFinal(bundle)) void cache.store(absoluteBundleUrl, new TextEncoder().encode(JSON.stringify(bundle)));
  }
  if (timings) timings.bundle_from_cache = cachedBundle;
  const assetCache = bundleIsFinal(bundle) && cache.enabled ? cache : null;
  if (bundle.schema !== SUPPORTED_SCHEMA) {
    throw new Error(`Unsupported visualizer bundle schema: ${bundle.schema || "missing"}`);
  }
  const topologyUrl = new URL(bundle.topology || "topology.json", absoluteBundleUrl);
  const semanticGeometryUrl = new URL(bundle.semantic_geometry || "semantic_geometry.json", absoluteBundleUrl);
  const load = (url, label) => (assetCache ? assetCache.fetchJson(url.toString(), { signal }) : fetchJson(url, timings, label, signal));
  const [topology, semanticGeometry] = await Promise.all([
    load(topologyUrl, "topology"),
    load(semanticGeometryUrl, "semantic_geometry"),
  ]);
  return {
    bundle,
    topology,
    semanticGeometry: absolutizeAssetPaths(semanticGeometry, absoluteBundleUrl, bundle, cacheKey),
    assetCache,
  };
}

export class PrismSemanticViewerElement extends HTMLElement {
  static get observedAttributes() {
    return ["bundle-url", "workspace", "mode"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.controller = null;
    this.reloadOwner = createReloadOwner();
    this.pendingSelection = null;
    this.pendingHiddenComponents = null;
    this.pendingOccurrences = null;
    this.reloadQueued = false;
    this.reloadSource = null;
  }

  connectedCallback() {
    this.queueReload();
  }

  disconnectedCallback() {
    this.reloadOwner.cancel();
    this.controller?.dispose?.();
    this.controller = null;
    this.reloadSource = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isConnected || oldValue === newValue) return;
    if (name === "workspace") {
      this.controller?.setWorkspace?.(this.workspace);
      return;
    }
    this.queueReload();
  }

  get workspace() {
    return this.getAttribute("workspace") === "stackup" ? "stackup" : "pcb";
  }

  /** `mode="system"`: several boards from a system scene descriptor (SB2-31e) instead of one bundle. */
  get systemMode() {
    return this.getAttribute("mode") === "system";
  }

  queueReload() {
    const source = this.systemMode ? "system" : this.getAttribute("bundle-url");
    if (!source || source === this.reloadSource) return;
    this.reloadSource = source;
    if (this.reloadQueued) return;
    this.reloadQueued = true;
    queueMicrotask(() => {
      this.reloadQueued = false;
      if (this.isConnected) void this.reload();
    });
  }

  async reload() {
    const bundleUrl = this.getAttribute("bundle-url");
    const attempt = this.reloadOwner.begin();
    this.controller?.dispose?.();
    this.controller = null;
    if (this.systemMode) {
      await this.reloadSystem(attempt);
      return;
    }
    if (!bundleUrl) {
      this.shadowRoot.innerHTML = `<style>:host{display:block;height:100%;font:14px system-ui;color:#94a3b8}</style><div>Semantic bundle URL is missing.</div>`;
      return;
    }
    await runSemanticViewerReload(this, attempt, { owner: this.reloadOwner, bundleUrl, loadBundle });
  }

  async reloadSystem(attempt) {
    const { signal } = attempt;
    const isCurrent = () => this.reloadOwner.owns(attempt) && this.isConnected;
    try {
      this.renderShell();
      const controller = await mountSystemViewer({
        root: this.shadowRoot,
        loadBundle: (bundleUrl, boardSignal) => loadBundle(bundleUrl, null, boardSignal),
        isActive: () => this.getAttribute("active") === "true",
        onSelectionChange: (selection) => {
          if (!signal.aborted) this.emit("selectionchange", { selection });
        },
        onContextMenu: (detail) => {
          if (!signal.aborted) this.emit("contextmenu", detail);
        },
        onViewStateChange: (detail) => {
          if (!signal.aborted) this.emitViewState(detail);
        },
        onEmphasis: (results) => {
          if (!signal.aborted) this.emit("emphasis", { results });
        },
        onStatus: (status) => {
          if (!signal.aborted) this.emit("systemstatus", status);
        },
      });
      if (!isCurrent()) {
        controller?.dispose?.();
        return;
      }
      this.controller = controller;
      if (this.pendingGpuBudget != null) controller.setGpuBudget(this.pendingGpuBudget);
      if (this.pendingSystemScene) controller.setSystemScene(this.pendingSystemScene);
      if (this.pendingNetEmphasis) controller.setNetEmphasis(this.pendingNetEmphasis);
      const viewState = this.getViewState();
      if (viewState) this.emitViewState(viewState);
      this.emitReady({ schema: "prism.semantic_viewer_performance.a0", milestone: "system-mounted" });
    } catch (error) {
      if (!isCurrent()) return;
      this.renderError(error);
      this.emitError(error);
    }
  }

  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(`prism-semantic-viewer:${name}`, { bubbles: true, composed: true, detail }));
  }

  /**
   * The system to show (mode="system"): a `prism.system_scene.a0` descriptor.
   * Boards already loaded are kept. Safe before the viewer is ready; the last
   * call is replayed on the next controller.
   */
  setSystemScene(descriptor) {
    this.pendingSystemScene = descriptor || null;
    if (descriptor) this.controller?.setSystemScene?.(descriptor);
  }

  /**
   * Light system nets on every board they reach (mode="system"):
   * `[{ key, color?, members: [{ occurrence, net }] }]`. Returns the report
   * (also sent as `prism-semantic-viewer:emphasis` when boards load), or [] before ready.
   */
  setNetEmphasis(sets) {
    this.pendingNetEmphasis = Array.isArray(sets) ? sets : [];
    return this.controller?.setNetEmphasis?.(this.pendingNetEmphasis) ?? [];
  }

  /** Frame the copper of a lit set (or of all), on one placement or all; false when nothing is lit there. */
  frameNetEmphasis(key = null, occurrence = null) {
    return this.controller?.frameNetEmphasis?.(key, occurrence) ?? false;
  }

  /** Frame one placed board (mode="system"). */
  frameBoard(key) {
    return this.controller?.frameBoard?.(key) ?? false;
  }

  renderLoading() {
    this.shadowRoot.innerHTML = `<style>:host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}</style><div style="display:grid;place-items:center;height:100%">Loading semantic visualizer...</div>`;
  }

  renderShell() {
    this.shadowRoot.innerHTML = shellHtml();
  }

  renderError(error) {
    console.error(error);
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;height:100%;background:#020817;color:#e5e7eb;font:14px system-ui}
        .error{height:100%;display:grid;place-items:center;padding:24px}
        pre{max-width:100%;white-space:pre-wrap;color:#fecaca;background:#111827;border:1px solid #374151;padding:16px}
      </style>
      <div class="error"><pre>${escapeHtml(error?.stack || error?.message || String(error))}</pre></div>
    `;
  }

  mountViewer({ topology, semanticGeometry, readiness, assetCache = null, signal }) {
    // Callbacks are bound to this attempt: a superseded mount that is still
    // booting must not report selection or performance for the newer load.
    return mountStandaloneViewer({
      root: this.shadowRoot,
      topology,
      semanticGeometry,
      readiness,
      workspaceScope: "3d",
      assetCache,
      // A system scene (occurrences set before the load) fetches components on approach.
      deferComponents: Boolean(this.pendingOccurrences),
      isActive: () => this.getAttribute("active") === "true",
      onSelectionChange: (selection) => {
        if (signal.aborted) return;
        this.dispatchEvent(new CustomEvent("prism-semantic-viewer:selectionchange", {
          bubbles: true,
          composed: true,
          detail: { selection },
        }));
      },
      onContextMenu: (detail) => {
        if (signal.aborted) return;
        this.dispatchEvent(new CustomEvent("prism-semantic-viewer:contextmenu", {
          bubbles: true,
          composed: true,
          detail,
        }));
      },
      onViewStateChange: (detail) => {
        if (signal.aborted) return;
        this.emitViewState(detail);
      },
      onPerformanceEvent: (detail) => {
        if (signal.aborted) return;
        console.info("[prism-3d-perf]", detail);
        this.dispatchEvent(new CustomEvent("prism-semantic-viewer:performance", {
          bubbles: true,
          composed: true,
          detail,
        }));
      },
    });
  }

  publishController(controller) {
    this.controller = controller;
    this.controller?.setWorkspace?.(this.workspace);
    // The hidden set is view state that must outlive a reload: a controller
    // that was created after the last setHiddenComponents call replays it.
    if (this.pendingHiddenComponents) {
      this.controller?.setHiddenComponents?.(this.pendingHiddenComponents);
    }
    if (this.pendingOccurrences) this.controller?.setOccurrences?.(this.pendingOccurrences);
    if (this.pendingGpuBudget != null) this.controller?.setGpuBudget?.(this.pendingGpuBudget);
    // A fresh viewer is already unselected. Avoid a redundant clearSelection()
    // while the staged shell is completing its first-frame setup.
    if (this.pendingSelection) this.controller?.setSelection?.(this.pendingSelection);
    if (this.pendingHighlightedNets?.length) {
      this.controller?.setHighlightedNets?.(this.pendingHighlightedNets);
    }
    const viewState = this.getViewState();
    if (viewState) this.emitViewState(viewState);
  }

  emitViewState(detail) {
    this.dispatchEvent(new CustomEvent("prism-semantic-viewer:viewstatechange", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  emitReady(detail) {
    console.info("[prism-3d-perf]", detail);
    this.dispatchEvent(new CustomEvent("prism-semantic-viewer:ready", {
      bubbles: true,
      composed: true,
      detail,
    }));
  }

  emitError(error) {
    this.dispatchEvent(new CustomEvent("prism-semantic-viewer:error", { bubbles: true, detail: { error } }));
  }

  setSelection(selection) {
    this.pendingSelection = selection || null;
    this.controller?.setSelection?.(this.pendingSelection);
  }

  /**
   * Replace the highlighted nets (Prism #305): every listed net renders
   * emphasised alongside the inspected selection. Idempotent and safe before
   * the viewer is ready or after a reload; the last call is replayed on the
   * next controller. Unresolved references are dropped.
   */
  setHighlightedNets(nets) {
    this.pendingHighlightedNets = Array.isArray(nets) ? [...nets] : [];
    this.controller?.setHighlightedNets?.(this.pendingHighlightedNets);
  }

  /**
   * Replace the hidden component references (VAR-18). Idempotent and safe
   * before the viewer is ready or after a reload: the last call is replayed on
   * the next controller.
   */
  setHiddenComponents(references) {
    this.pendingHiddenComponents = Array.isArray(references)
      ? [...references]
      : [];
    this.controller?.setHiddenComponents?.(this.pendingHiddenComponents);
  }

  /**
   * Draw the loaded board once per occurrence (System Builder SB2-23): an
   * array of column-major 4×4 model matrices in the bundle's runtime units
   * (metres), or `{ matrix, key }` where the key (the system's occurrence
   * path) comes back on picks and selection events. The geometry is uploaded
   * once and shared. `null` restores the
   * single identity occurrence of the one-board view. Safe before ready and
   * after reloads: the last call is replayed on the next controller.
   */
  setOccurrences(occurrences) {
    this.pendingOccurrences = occurrences == null
      ? null
      : Array.from(occurrences, (item) => (item?.matrix
        ? { matrix: [...item.matrix], key: item.key }
        : [...item]));
    this.controller?.setOccurrences?.(this.pendingOccurrences);
  }

  /**
   * What is under a client point (SB2-24), without selecting it:
   * `{ kind: "none" | "feature" | "board" | "gizmo", occurrenceKey, occurrenceIndex, featureId }`.
   * Resolves null before the viewer is ready.
   */
  pickAt(clientX, clientY) {
    return Promise.resolve(this.controller?.pickAt?.(clientX, clientY) ?? null);
  }

  /** Client coordinates of a component's centre on one occurrence, or null when off screen. */
  projectComponent(reference, occurrenceKey) {
    return this.controller?.projectComponent?.(reference, occurrenceKey) ?? null;
  }

  /** Show the scene stats overlay (occurrences by detail, triangles, GPU memory, frame times); the backquote key toggles it. */
  setStatsOverlay(visible) {
    this.controller?.setStatsOverlay?.(visible);
  }

  /** The numbers behind the stats overlay, or null before ready. */
  getStats() {
    return this.controller?.stats?.() ?? null;
  }

  /** Force a level of detail on every occurrence (0 full, 1 board, 2 box), or null for automatic. */
  setLodOverride(lod) {
    this.controller?.setLodOverride?.(lod);
  }

  /** The GPU memory budget in bytes (default 1.5 GB); over it, unused tiers are evicted. */
  setGpuBudget(bytes) {
    this.pendingGpuBudget = bytes;
    this.controller?.setGpuBudget?.(bytes);
  }

  /** Client coordinates of a board-local point (runtime metres) on one occurrence, or null. */
  projectPoint(point, occurrenceKey) {
    return this.controller?.projectPoint?.(point, occurrenceKey) ?? null;
  }

  /** Every component reference on the board; empty until the viewer is ready. */
  getComponentReferences() {
    return this.controller?.getComponentReferences?.() ?? [];
  }

  resize() {
    this.controller?.resize?.();
  }

  /** PCB 3D controls for a host that sets `hide-panel`. Null until ready. */
  getViewState() {
    return this.controller?.getViewState?.() ?? null;
  }

  setViewMode(mode) {
    this.controller?.setViewMode?.(mode);
  }

  /** In a system scene, `placement` names the board placement (all placements of the selected board when omitted). */
  setLayerVisible(layerId, visible, placement = null) {
    this.controller?.setLayerVisible?.(layerId, visible, placement);
  }

  applyLayerPreset(preset, placement = null) {
    this.controller?.applyLayerPreset?.(preset, placement);
  }

  setShowBoard(visible) {
    this.controller?.setShowBoard?.(visible);
  }

  setShowComponents(visible) {
    this.controller?.setShowComponents?.(visible);
  }

  setShowPlaceholders(visible) {
    this.controller?.setShowPlaceholders?.(visible);
  }

  setRealisticColors(enabled) {
    this.controller?.setRealisticColors?.(enabled);
  }

  setSeparation(value) {
    this.controller?.setSeparation?.(value);
  }

  showNetLayers() {
    this.controller?.showNetLayers?.();
  }

  setNetIsolation(enabled) {
    this.controller?.setNetIsolation?.(enabled);
  }
}

export function definePrismSemanticViewer() {
  if (!customElements.get("prism-semantic-viewer")) {
    customElements.define("prism-semantic-viewer", PrismSemanticViewerElement);
  }
}
