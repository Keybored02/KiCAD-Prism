import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Activity, Box, Keyboard, Loader2, Maximize, Move3d, Spline, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { clearPose, getScene, resetPoses, setPose } from "@/lib/systems-api";
import { cn } from "@/lib/utils";
import type {
  PrismSystemSceneElement,
  PrismSystemSceneEmphasisResult,
  PrismSystemSceneMoveState,
  PrismSystemSceneSelection,
} from "@/types/prism-semantic-viewer";
import type { SystemNetDetail, SystemScene } from "@/types/system";

import { names, scenePollDelay, summarizeScene, webgpuAvailable } from "./scene-3d-model";
import { MovePanel } from "./scene-move-panel";
import { emphasisSets } from "./scene-net-model";
import { NetPanel } from "./scene-net-panel";
import { useNetHighlight } from "./use-net-highlight";
import type { SystemTabProps } from "./system-tab-content";
import { useSystemMutation } from "./use-system-mutation";

const DiagramTab = lazy(() => import("./diagram-tab").then((module) => ({ default: module.DiagramTab })));

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

/**
 * CONTRACTS_P2 §20 / SB2-27: every board of the system in one WebGPU view, in the
 * default side-by-side layout from the scene descriptor. Restricted boards are
 * boxes; boards whose 3D bundle is still building are boxes until it is ready.
 * Without WebGPU, the 2D diagram with a notice.
 */
export function Scene3dTab(props: SystemTabProps) {
  const { systemId, document, etag, canEdit, reload, onNavigate } = props;
  const [scene, setScene] = useState<SystemScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<PrismSystemSceneSelection | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [labels, setLabels] = useState(true);
  const [stats, setStats] = useState(false);
  const [reads, setReads] = useState(0);
  const [move, setMove] = useState<PrismSystemSceneMoveState | null>(null);
  // Bumped whenever the view saves, cancels or changes target: the move panel starts over.
  const [moveEpoch, setMoveEpoch] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  // SB2-31: highlighted system nets, lit in the view in their own colours.
  const [netsOpen, setNetsOpen] = useState(false);
  const nets = useNetHighlight(systemId, etag);
  const { highlighted } = nets;
  const { busy, run } = useSystemMutation(reload);
  const elementRef = useRef<PrismSystemSceneElement | null>(null);
  const supported = webgpuAvailable();

  // Read the scene on open and on every system change ...
  useEffect(() => {
    if (!supported) return;
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
  }, [supported, systemId, etag, reads]);

  // ... and again while bundles build or boxes are unknown.
  useEffect(() => {
    const delay = scene ? scenePollDelay(scene) : null;
    if (!delay) return;
    const timer = setTimeout(() => setReads((count) => count + 1), delay);
    return () => clearTimeout(timer);
  }, [scene]);

  useEffect(() => {
    if (scene) elementRef.current?.setScene?.(scene);
  }, [scene]);

  const showEmphasis = (node: PrismSystemSceneElement | null, list: readonly SystemNetDetail[]) => {
    const report = node?.setNetEmphasis?.(emphasisSets(list));
    if (report) nets.report(report);
  };
  useEffect(() => {
    showEmphasis(elementRef.current, highlighted);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-apply only when the nets change
  }, [highlighted]);

  // The element's events (it is defined by the viewer bundle; it may upgrade after mount).
  const attach = (node: PrismSystemSceneElement | null) => {
    elementRef.current = node;
    if (!node) return;
    void customElements.whenDefined("prism-system-scene").then(() => {
      if (elementRef.current !== node) return;
      if (scene) node.setScene(scene);
      node.setLabelsVisible(labels);
      node.setStatsOverlay(stats);
      node.setMoveAllowed(canEdit);
      // No state here: this ref runs on every render. The element reports what it lit by event.
      node.setNetEmphasis?.(emphasisSets(highlighted));
    });
  };
  useEffect(() => {
    elementRef.current?.setMoveAllowed?.(canEdit);
  }, [canEdit]);

  /** Store the target's position (a released drag, Enter, or Save); on failure the view goes back. */
  const savePose = async (target: NonNullable<PrismSystemSceneMoveState["target"]>) => {
    const saved = await run("pose", () => setPose(systemId, etag, target.instanceId, target.pose));
    if (!saved) elementRef.current?.cancelMove?.();
  };
  const backToDefault = async (target: NonNullable<PrismSystemSceneMoveState["target"]>) => {
    await run("pose", () => clearPose(systemId, etag, target.instanceId), `${target.displayPath} is back in its default place`);
  };
  const resetAll = async () => {
    const done = await run("pose", () => resetPoses(systemId, etag));
    setConfirmReset(false);
    if (done) {
      const count = done.body.reset.length;
      toastReset(count);
    }
  };

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;
    const onSelection = (event: Event) => setSelection((event as CustomEvent<{ selection: PrismSystemSceneSelection | null }>).detail.selection);
    const onError = (event: Event) => setViewerError(String((event as CustomEvent<{ error: string }>).detail.error));
    const onMove = (event: Event) => {
      const state = (event as CustomEvent<PrismSystemSceneMoveState>).detail;
      setMove(state);
      if (state.phase === "commit" && state.target) void savePose(state.target);
      // Start the panel over when the view's state changed under it; a re-read during
      // typing ("sync" with an unsaved preview) keeps what is typed.
      if (state.phase !== "preview" && !(state.phase === "sync" && state.target?.unsaved)) setMoveEpoch((count) => count + 1);
    };
    node.addEventListener("prism-system-scene:selectionchange", onSelection);
    node.addEventListener("prism-system-scene:error", onError);
    node.addEventListener("prism-system-scene:move", onMove);
    const onEmphasis = (event: Event) => {
      nets.report((event as CustomEvent<{ report: PrismSystemSceneEmphasisResult[] }>).detail.report);
    };
    node.addEventListener("prism-system-scene:emphasis", onEmphasis);
    return () => {
      node.removeEventListener("prism-system-scene:emphasis", onEmphasis);
      node.removeEventListener("prism-system-scene:selectionchange", onSelection);
      node.removeEventListener("prism-system-scene:error", onError);
      node.removeEventListener("prism-system-scene:move", onMove);
    };
  });

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
  const instance = selection ? document.instances.find((item) => item.id === selection.instanceId) : undefined;

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
        <span className="ml-auto flex items-center gap-1">
          {canEdit && (
            <Button
              variant={move?.enabled ? "secondary" : "ghost"} size="sm" aria-pressed={Boolean(move?.enabled)}
              title="Move boards (M)" onClick={() => elementRef.current?.setMoveMode(!move?.enabled)}
            >
              <Move3d className="size-4" aria-hidden /> Move
            </Button>
          )}
          <Button
            variant={netsOpen || highlighted.length ? "secondary" : "ghost"} size="sm" aria-pressed={netsOpen}
            title="Highlight system nets" onClick={() => setNetsOpen(!netsOpen)}
          >
            <Spline className="size-4" aria-hidden /> Nets{highlighted.length ? ` (${highlighted.length})` : ""}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => elementRef.current?.frameAll()} title="Fit every board (A)">
            <Maximize className="size-4" aria-hidden /> Fit all
          </Button>
          <Button
            variant={labels ? "secondary" : "ghost"} size="sm" aria-pressed={labels}
            onClick={() => { setLabels(!labels); elementRef.current?.setLabelsVisible(!labels); }}
          >
            <Tag className="size-4" aria-hidden /> Labels
          </Button>
          <Button
            variant={stats ? "secondary" : "ghost"} size="sm" aria-pressed={stats} title="Scene statistics (`)"
            onClick={() => { setStats(!stats); elementRef.current?.setStatsOverlay(!stats); }}
          >
            <Activity className="size-4" aria-hidden /> Stats
          </Button>
          <Button variant="ghost" size="icon-sm" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts"
            onClick={() => elementRef.current?.setHelpVisible(true)}>
            <Keyboard className="size-4" aria-hidden />
          </Button>
        </span>
      </div>

      <SceneNotices error={error} viewerError={viewerError} summary={summary} />

      <div className="relative min-h-0 flex-1">
        {/* React 18 does not map className onto custom elements: size it with a style. */}
        <prism-system-scene ref={attach} style={{ position: "absolute", inset: 0, display: "block" }} />
        {!scene && !error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading the system scene…</span>
          </div>
        )}
        {move?.enabled && (
          <div className="absolute left-3 top-3">
            <MovePanel
              key={moveEpoch}
              state={move}
              busy={busy !== null}
              onPreview={(pose) => elementRef.current?.previewPose(pose)}
              onSave={(target) => void savePose(target)}
              onRevert={() => elementRef.current?.cancelMove()}
              onDefault={(target) => void backToDefault(target)}
              onResetAll={() => setConfirmReset(true)}
              onSpace={(space) => elementRef.current?.setMoveSpace(space)}
            />
          </div>
        )}
        {netsOpen && (
          <div className="absolute bottom-12 right-3 top-3 flex flex-col justify-start">
            <NetPanel
              systemId={systemId}
              highlighted={highlighted}
              results={nets.results}
              adding={nets.adding}
              onAdd={(net) => void nets.add(net)}
              onRemove={nets.remove}
              onClear={nets.clear}
              onClose={() => setNetsOpen(false)}
            />
          </div>
        )}
        {selection && (
          <div className="absolute bottom-3 left-3 w-72 rounded-lg border bg-card/95 p-3 text-sm shadow-md backdrop-blur" aria-live="polite">
            <p className="font-medium">{selection.displayPath}</p>
            <p className="text-xs text-muted-foreground">
              {selection.restricted ? "Restricted board" : selection.reference ? `Component ${selection.reference}` : "Board"}
              {instance?.label && instance.label !== selection.displayPath ? ` · ${instance.label}` : ""}
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => elementRef.current?.frameOccurrence(selection.occurrence)}>Frame</Button>
              {instance && (
                <Button size="sm" variant="ghost" onClick={() => onNavigate("boards", { board: instance.id })}>Open in Boards</Button>
              )}
            </div>
          </div>
        )}
        <p className="pointer-events-none absolute bottom-3 right-3 rounded bg-background/80 px-2 py-1 text-[11px] text-muted-foreground">
          {move?.enabled
            ? "Drag an arrow to slide · a ring to turn · Shift for fine steps · Esc undoes · ? keys"
            : "Drag to orbit · Shift-drag to pan · Scroll to zoom · Double-click to frame · F frame · A fit all · ? keys"}
        </p>
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
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset every board's position?"
        description="Every board you or others moved goes back to the default side-by-side row. Earlier snapshots keep the positions they froze."
        confirmLabel="Reset positions"
        busy={busy !== null}
        onConfirm={() => void resetAll()}
      />
    </div>
  );
}

function toastReset(count: number) {
  toast.success(count === 0 ? "Every board was already in its default place"
    : `${count} ${count === 1 ? "board is" : "boards are"} back in the default layout`);
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
