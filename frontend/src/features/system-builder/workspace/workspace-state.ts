/**
 * The System Builder workspace's URL state (PLAN M8, D-P2-47): the centre view,
 * the open tray tab and the selection. The URL owns all three so a link opens
 * the same workspace; links to the old tabs (`?tab=`) are translated once.
 */

export const WORKSPACE_VIEWS = [
  { id: "3d", label: "3D" },
  { id: "diagram", label: "Diagram" },
  { id: "icd", label: "ICD" },
] as const;

export type WorkspaceView = (typeof WORKSPACE_VIEWS)[number]["id"];

export const TRAY_TABS = [
  { id: "nets", label: "Nets" },
  { id: "connections", label: "Connections" },
  { id: "findings", label: "Findings" },
  { id: "changes", label: "Changes" },
  { id: "history", label: "History" },
] as const;

export type TrayTab = (typeof TRAY_TABS)[number]["id"];

export type SelectionKind = "instance" | "link" | "harness";

export interface WorkspaceSelection {
  kind: SelectionKind;
  id: string;
}

export interface WorkspaceState {
  view: WorkspaceView;
  /** The open tray tab; null when the tray is collapsed. */
  tray: TrayTab | null;
  /** Null: nothing selected, so the inspector shows the system. */
  selection: WorkspaceSelection | null;
}

const KINDS: readonly SelectionKind[] = ["instance", "link", "harness"];

function parseSelection(value: string | null): WorkspaceSelection | null {
  if (!value) return null;
  const at = value.indexOf(":");
  const kind = value.slice(0, at) as SelectionKind;
  const id = value.slice(at + 1);
  return at > 0 && id && KINDS.includes(kind) ? { kind, id } : null;
}

/** `?view=&tray=&sel=kind:id`; unknown values fall back to the 3D view, a closed tray and no selection. */
export function workspaceStateFromParams(params: URLSearchParams): WorkspaceState {
  const view = params.get("view");
  const tray = params.get("tray");
  return {
    view: WORKSPACE_VIEWS.some((item) => item.id === view) ? (view as WorkspaceView) : "3d",
    tray: TRAY_TABS.some((item) => item.id === tray) ? (tray as TrayTab) : null,
    selection: parseSelection(params.get("sel")),
  };
}

/**
 * The workspace state a link to an old tab meant, or null when `params` has no `tab`.
 * `board`, `link` and `harness` selections carry over; `tab=import` opens the import sheet.
 */
export function migrateLegacyTab(params: URLSearchParams): { state: WorkspaceState; importing: boolean } | null {
  const tab = params.get("tab");
  if (tab === null) return null;
  const board = params.get("board");
  const link = params.get("link");
  const harness = params.get("harness");
  const selection: WorkspaceSelection | null = harness ? { kind: "harness", id: harness }
    : link ? { kind: "link", id: link } : board ? { kind: "instance", id: board } : null;
  const base: WorkspaceState = { view: "3d", tray: null, selection: null };
  switch (tab) {
    case "diagram":
      return { state: { ...base, view: "diagram" }, importing: false };
    case "boards":
      return { state: { ...base, selection: board ? selection : null }, importing: false };
    case "connectivity":
    case "import":
      return { state: { ...base, tray: "connections", selection: link || harness ? selection : null }, importing: tab === "import" };
    case "changes":
      return { state: { ...base, tray: "changes" }, importing: false };
    case "history":
      return { state: { ...base, tray: "history" }, importing: false };
    default:
      return { state: base, importing: false };
  }
}

/** The query string for `state`, keeping unrelated parameters (e.g. `import`). */
export function workspaceParams(state: WorkspaceState, current: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(current);
  for (const key of ["tab", "board", "link", "harness", "view", "tray", "sel"]) params.delete(key);
  if (state.view !== "3d") params.set("view", state.view);
  if (state.tray) params.set("tray", state.tray);
  if (state.selection) params.set("sel", `${state.selection.kind}:${state.selection.id}`);
  return params;
}
