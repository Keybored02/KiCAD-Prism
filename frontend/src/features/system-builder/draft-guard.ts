import { useEffect, useId } from "react";

/**
 * SB2-102: unsaved drafts (link rows, harness wires) say so here, so the workspace can ask before
 * a selection or tray change unmounts their editor, and the browser before the page closes.
 * Editors only register; the workspace decides when to ask.
 */
const dirty = new Set<string>();

function warnOnUnload(event: BeforeUnloadEvent) {
  event.preventDefault();
  // Older browsers need a return value to show their (fixed-wording) prompt.
  event.returnValue = "";
}

function sync() {
  if (dirty.size) window.addEventListener("beforeunload", warnOnUnload);
  else window.removeEventListener("beforeunload", warnOnUnload);
}

/** Mark this editor's draft as unsaved while `isDirty`; cleared when the editor unmounts. */
export function useDraftGuard(isDirty: boolean) {
  const id = useId();
  useEffect(() => {
    if (!isDirty) return;
    dirty.add(id);
    sync();
    return () => {
      dirty.delete(id);
      sync();
    };
  }, [id, isDirty]);
}

export function hasUnsavedDrafts(): boolean {
  return dirty.size > 0;
}

/** Forget every draft (tests). */
export function resetDraftGuard() {
  dirty.clear();
  sync();
}
