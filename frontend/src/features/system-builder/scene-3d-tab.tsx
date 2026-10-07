import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Activity, Box, Cpu, Keyboard, Loader2, Maximize, Move3d, Spline, Tag } from "lucide-react";

import { DesignSearchField } from "@/components/design-search-field";
import { Semantic3dControls } from "@/components/semantic-3d-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ViewerOverlayRail } from "@/components/viewer-overlay-rail";
import { selectionFromDesignSearchHit, type DesignSearchHit } from "@/lib/design-search";
import { getScene } from "@/lib/systems-api";
import { cn } from "@/lib/utils";
import type {
  PrismSemanticViewerElement,
  PrismSemanticViewState,
  PrismSystemSceneEmphasisResult,
  PrismSystemViewerSelection,
} from "@/types/prism-semantic-viewer";
import type { SystemScene } from "@/types/system";

import { drawnBoards, names, scenePollDelay, summarizeScene, webgpuAvailable } from "./scene-3d-model";
import { SceneInspector } from "./scene-inspector";
import { MovePanel } from "./scene-move-panel";
import { emphasisSets, netBoards } from "./scene-net-model";
import { NetPanel } from "./scene-net-panel";
import { hitOccurrence, searchBoards, type SearchableBoard } from "./scene-search";
import { useBoardIndexes } from "./use-board-indexes";
import { useMoveMode } from "./use-move-mode";
import { useNetHighlight } from "./use-net-highlight";
import type { SystemTabProps } from "./system-tab-content";

const DiagramTab = lazy(() => import("./diagram-tab").then((module) => ({ default: module.DiagramTab })));

type RailTab = "selection" | "nets";

function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs",
        tone === "info" && "border-border bg-muted/40 text-muted-foreground",
        tone === "warning" && "border-amber-300/60 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
        tone === "error" && "border-destructive/40 bg-destructive/5 text-destructive",
      )}
    >
      {children}
    </p>
  );
}

/** Read the scene on open, on every system change, and again while bundles build or boxes are unknown. */
function useSystemScene(systemId: string, etag: string, enabled: boolean) {
  const [scene, setScene] = useState<SystemScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reads, setReads] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getScene(systemId).then(
      (next) => {
        if (cancelled) return;
        setScene(next);
        setError(null);
      },
      (cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load the 3D scene");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, systemId, etag, reads]);
  useEffect(() => {
    const delay = scene ? scenePollDelay(scene) : null;
    if (!delay) return;
    const timer = setTimeout(() => setReads((count) => count + 1), delay);
    return () => clearTimeout(timer);
  }, [scene]);
  return { scene, error };
}

/** What the viewer reports: the selection, the view state (isolation) and its start-up error. */
function useViewerEvents(viewer: PrismSemanticViewerElement | null, report: (results: readonly PrismSystemSceneEmphasisResult[]) => void) {
  const [selection, setSelection] = useState<PrismSystemViewerSelection | null>(null);
  const [viewState, setViewState] = useState<PrismSemanticViewState | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);
  useEffect(() => {
    if (!viewer) return;
    const onSelection = (event: Event) => setSelection((event as CustomEvent<{ selection: PrismSystemViewerSelection | null }>).detail.selection);
    const onViewState = (event: Event) => setViewState((event as CustomEvent<PrismSemanticViewState>).detail);
    const onEmphasis = (event: Event) => reportRef.current((event as CustomEvent<{ results: PrismSystemSceneEmphasisResult[] }>).detail.results);
    const onError = (event: Event) => {
      const detail = (event as CustomEvent<{ error?: { message?: string } | string }>).detail;
      setViewerError(typeof detail?.error === "string" ? detail.error : detail?.error?.message || "The 3D view could not start");
    };
    viewer.addEventListener("prism-semantic-viewer:selectionchange", onSelection);
    viewer.addEventListener("prism-semantic-viewer:viewstatechange", onViewState);
    viewer.addEventListener("prism-semantic-viewer:emphasis", onEmphasis);
    viewer.addEventListener("prism-semantic-viewer:error", onError);
    return () => {
      viewer.removeEventListener("prism-semantic-viewer:selectionchange", onSelection);
      viewer.removeEventListener("prism-semantic-viewer:viewstatechange", onViewState);
      viewer.removeEventListener("prism-semantic-viewer:emphasis", onEmphasis);
      viewer.removeEventListener("prism-semantic-viewer:error", onError);
    };
  }, [viewer]);
  return { selection, setSelection, viewState, viewerError };
}

/**
 * CONTRACTS_P2 §20.6 / SB2-31e.2: the board 3D tab with every board of the
 * system (D-P2-25). The 3D tab's own viewer, left rail (a Layers section per
 * board) and inspector (on the selected board's design index), a search over
 * every board, and the system nets. Restricted boards and boards still
 * building are boxes. Without WebGPU, the 2D diagram with a notice.
 */
export function Scene3dTab(props: SystemTabProps) {
  const { systemId, document, etag, canEdit, reload, onNavigate } = props;
  const supported = webgpuAvailable();
  const { scene, error } = useSystemScene(systemId, etag, supported);
  const [viewer, setViewer] = useState<PrismSemanticViewerElement | null>(null);
  const attach = useCallback((node: PrismSemanticViewerElement | null) => setViewer(node), []);
  const [leftInset, setLeftInset] = useState(0);
  const [rail, setRail] = useState<RailTab | null>("selection");
  const [stats, setStats] = useState(false);
  const [labels, setLabels] = useState(true);
  const moving = useMoveMode(viewer, { systemId, etag, reload });
  const { move } = moving;
  const nets = useNetHighlight(systemId, etag);
  const { highlighted } = nets;
  const { selection, setSelection, viewState, viewerError } = useViewerEvents(viewer, nets.report);
  const indexes = useBoardIndexes(scene);

  useEffect(() => {
    if (!viewer || !scene) return;
    void customElements.whenDefined("prism-semantic-viewer").then(() => viewer.setSystemScene?.(scene));
  }, [viewer, scene]);

  // The net added last is framed once, so a few-millimetre trace is not lost in the whole system.
  const framedNet = useRef<string | null>(null);
  useEffect(() => {
    if (!viewer) return;
    void customElements.whenDefined("prism-semantic-viewer").then(() => {
      const report = viewer.setNetEmphasis?.(emphasisSets(highlighted));
      if (report) nets.report(report);
      // As the board 3D tab frames a selected net: close, on the first board it reaches.
      const newest = highlighted.at(-1) ?? null;
      if (newest && newest.groupId !== framedNet.current) {
        viewer.frameNetEmphasis?.(newest.groupId, netBoards(newest).boards[0]?.occurrence ?? null);
      }
      framedNet.current = newest?.groupId ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-apply only when the nets or the viewer change
  }, [highlighted, viewer]);

  const boards = useMemo(() => (scene ? drawnBoards(scene) : []), [scene]);
  const searchable = useMemo<SearchableBoard[]>(() => boards.flatMap((board) => {
    const index = board.assetId ? indexes.get(board.assetId)?.index : null;
    return index ? [{ occurrence: board.path, name: board.displayPath, index }] : [];
  }), [boards, indexes]);
  const search = useCallback((query: string) => searchBoards(searchable, query), [searchable]);
  const pick = (hit: DesignSearchHit) => {
    const occurrence = hitOccurrence(hit);
    const picked = selectionFromDesignSearchHit(hit, "3D", null);
    if (!picked) return;
    viewer?.setSelection(picked.kind === "net" ? { occurrence, netName: picked.netName } : { occurrence, reference: picked.reference });
    // A host selection is not echoed back by the viewer.
    setSelection({ ...picked, occurrence });
    setRail("selection");
  };

  if (!supported) {
    return (
      <div className="flex h-full flex-col gap-3 p-4 md:p-6">
        <Notice tone="warning">
          The 3D view needs WebGPU, which this browser does not provide. Showing the diagram instead; a recent Chrome, Edge or Safari shows the 3D view.
        </Notice>
        <div className="min-h-0 flex-1">
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading diagram…</div>}>
            <DiagramTab {...props} />
          </Suspense>
        </div>
      </div>
    );
  }

  const summary = scene ? summarizeScene(scene) : null;
  const selected = selection?.occurrence ? scene?.occurrences.find((item) => item.path === selection.occurrence) ?? null : null;
  const instance = selected ? document.instances.find((item) => item.id === selected.instanceId) : undefined;

  return (
    <div className="flex h-full min-h-[480px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 md:px-6">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Box className="size-4 text-muted-foreground" aria-hidden />
          {summary ? `${summary.boards} board${summary.boards === 1 ? "" : "s"}` : "3D view"}
        </span>
        {summary && summary.restricted.length > 0 && <Badge variant="outline">{summary.restricted.length} restricted</Badge>}
        {summary && summary.building.length > 0 && (
          <Badge variant="info" className="gap-1"><Loader2 className="size-3 animate-spin" aria-hidden />{summary.building.length} building</Badge>
        )}
        {summary && summary.failed.length > 0 && <Badge variant="destructive">{summary.failed.length} failed</Badge>}
        <div className="mx-2 min-w-48 max-w-sm flex-1">
          <DesignSearchField semanticIndex={null} search={search} loading={boards.length > 0 && !searchable.length} onPick={pick} inline />
        </div>
        <span className="ml-auto flex items-center gap-1">
          {canEdit && (
            <Button
              variant={move?.enabled ? "secondary" : "ghost"} size="sm" aria-pressed={Boolean(move?.enabled)}
              title="Move boards (M)" onClick={() => viewer?.setMoveMode?.(!move?.enabled)}
            >
              <Move3d className="size-4" aria-hidden /> Move
            </Button>
          )}
          <Button
            variant={rail === "nets" || highlighted.length ? "secondary" : "ghost"} size="sm" aria-pressed={rail === "nets"}
            title="Highlight system nets" onClick={() => setRail(rail === "nets" ? null : "nets")}
          >
            <Spline className="size-4" aria-hidden /> Nets{highlighted.length ? ` (${highlighted.length})` : ""}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => viewer?.frameAll?.()} title="Fit every board (Home)">
            <Maximize className="size-4" aria-hidden /> Fit all
          </Button>
          <Button
            variant={labels ? "secondary" : "ghost"} size="sm" aria-pressed={labels} title="Board names"
            onClick={() => { setLabels(!labels); viewer?.setLabelsVisible?.(!labels); }}
          >
            <Tag className="size-4" aria-hidden /> Labels
          </Button>
          <Button
            variant={stats ? "secondary" : "ghost"} size="sm" aria-pressed={stats} title="Scene statistics (`)"
            onClick={() => { setStats(!stats); viewer?.setStatsOverlay?.(!stats); }}
          >
            <Activity className="size-4" aria-hidden /> Stats
          </Button>
          <Button variant="ghost" size="icon-sm" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts"
            onClick={() => viewer?.setHelpVisible?.(true)}>
            <Keyboard className="size-4" aria-hidden />
          </Button>
        </span>
      </div>

      <SceneNotices error={error} viewerError={viewerError} summary={summary} />

      <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20" style={themeBridge(leftInset)}>
        {/* React 18 does not map className onto custom elements: size it with a style. */}
        <prism-semantic-viewer
          ref={attach} mode="system" hide-panel="true" active="true" move-allowed={canEdit ? "true" : "false"}
          style={{ position: "absolute", inset: 0, display: "block" }}
        />
        <Semantic3dControls viewer={viewer} onVisibleWidthChange={setLeftInset} />
        {move?.enabled && (
          <div className="absolute top-3 z-10" style={{ left: leftInset + 12 }}>
            <MovePanel
              key={moving.epoch}
              state={move}
              busy={moving.busy}
              onPreview={(pose) => viewer?.previewPose?.(pose)}
              onSave={(target) => void moving.savePose(target)}
              onRevert={() => viewer?.cancelMove?.()}
              onDefault={(target) => void moving.backToDefault(target)}
              onResetAll={() => moving.setConfirmReset(true)}
              onSpace={(space) => viewer?.setMoveSpace?.(space)}
            />
          </div>
        )}
        {!scene && !error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading the system scene…</span>
          </div>
        )}
        <ViewerOverlayRail
          activeTab={rail}
          tabs={[
            { id: "selection", label: "Selection", icon: <Cpu className="mr-1.5 size-3.5" /> },
            { id: "nets", label: "Nets", icon: <Spline className="mr-1.5 size-3.5" />,
              badge: highlighted.length ? <span className="rounded-full bg-muted px-1.5 text-[10px]">{highlighted.length}</span> : null },
          ]}
          onTabChange={setRail}
          onClose={() => setRail(null)}
          ariaLabel="System 3D details"
        >
          {rail === "nets" ? (
            <NetPanel
              embedded
              systemId={systemId}
              highlighted={highlighted}
              results={nets.results}
              adding={nets.adding}
              onAdd={(net) => void nets.add(net)}
              onRemove={nets.remove}
              onFrame={(groupId, occurrence) => viewer?.frameNetEmphasis?.(groupId, occurrence ?? null)}
              isolated={Boolean(viewState?.isolateNet)}
              onIsolate={(next) => viewer?.setNetIsolation?.(next)}
              onClear={nets.clear}
              onClose={() => setRail(null)}
            />
          ) : (
            <SceneInspector
              selection={selection}
              boardName={selected?.displayPath ?? null}
              indexState={selected?.assetId ? indexes.get(selected.assetId) ?? null : null}
              onFrameBoard={() => { if (selected) viewer?.frameBoard?.(selected.path); }}
              onOpenBoard={instance ? () => onNavigate("boards", { board: instance.id }) : undefined}
              onClear={() => { viewer?.setSelection(null); setSelection(null); }}
            />
          )}
        </ViewerOverlayRail>
      </div>
      <ConfirmDialog
        open={nets.confirmLarge !== null}
        onOpenChange={(open) => { if (!open) nets.cancelLarge(); }}
        title={`Highlight ${nets.confirmLarge?.name ?? "this net"}?`}
        description={`It has ${nets.confirmLarge?.pinCount ?? 0} pins, so it lights a lot of copper on every board it reaches (usually a ground or supply).`}
        confirmLabel="Highlight"
        destructive={false}
        busy={nets.adding !== null}
        onConfirm={() => { if (nets.confirmLarge) void nets.add(nets.confirmLarge, true); }}
      />
      <ConfirmDialog
        open={moving.confirmReset}
        onOpenChange={moving.setConfirmReset}
        title="Reset every board's position?"
        description="Every board you or others moved goes back to the default side-by-side row. Earlier snapshots keep the positions they froze."
        confirmLabel="Reset positions"
        busy={moving.busy}
        onConfirm={() => void moving.resetAll()}
      />
    </div>
  );
}

/** The app's tokens for the viewer's shadow tree, as the board 3D tab passes them (see webgpu-3d-tab.tsx). */
function themeBridge(leftInset: number): CSSProperties {
  return {
    "--prism-shell": "hsl(var(--background))",
    "--prism-panel": "hsl(var(--card))",
    "--prism-panel-raised": "hsl(var(--muted))",
    "--prism-control": "hsl(var(--secondary))",
    "--prism-control-hover": "hsl(var(--accent))",
    "--prism-foreground": "hsl(var(--foreground))",
    "--prism-muted": "hsl(var(--muted-foreground))",
    "--prism-border": "hsl(var(--border))",
    "--prism-primary": "hsl(var(--primary))",
    "--prism-primary-foreground": "hsl(var(--primary-foreground))",
    "--prism-viewport-inset-left": `${leftInset}px`,
  } as CSSProperties;
}

/** Why some boards are boxes, missing or failed; nothing when every board is drawn. */
function SceneNotices({ error, viewerError, summary }: {
  error: string | null;
  viewerError: string | null;
  summary: ReturnType<typeof summarizeScene> | null;
}) {
  return (error || viewerError || (summary && (summary.restricted.length || summary.building.length || summary.missing.length
        || summary.failed.length || summary.unplaced.length))) ? (
        <div className="flex flex-col gap-1.5 border-b px-4 py-2 md:px-6">
          {error && <Notice tone="error">{error}</Notice>}
          {viewerError && <Notice tone="error">The 3D view could not start: {viewerError}</Notice>}
          {summary && summary.restricted.length > 0 && (
            <Notice>
              {summary.restricted.length === 1
                ? `${names(summary.restricted)} is restricted: drawn as a grey box showing only its size.`
                : `${names(summary.restricted)} are restricted: drawn as grey boxes showing only their size.`}
            </Notice>
          )}
          {summary && summary.building.length > 0 && (
            <Notice>
              Generating the 3D view of {names(summary.building)};{" "}
              {summary.building.length === 1 ? "it is drawn as a box" : "they are drawn as boxes"} until ready.
            </Notice>
          )}
          {summary && summary.missing.length > 0 && (
            <Notice>{names(summary.missing)} {summary.missing.length === 1 ? "has" : "have"} no 3D view yet. A designer opening this tab generates it.</Notice>
          )}
          {summary && summary.failed.map(({ occurrence, error: reason }) => (
            <Notice key={occurrence.path} tone="error">
              The 3D view of {occurrence.displayPath} failed{reason ? `: ${reason}` : ""}. Regenerate it from the board&apos;s 3D tab.
            </Notice>
          ))}
          {summary && summary.unplaced.length > 0 && (
            <Notice>{names(summary.unplaced)} {summary.unplaced.length === 1 ? "is" : "are"} not shown yet: the board outline is still being read.</Notice>
          )}
        </div>
      ) : null;
}
