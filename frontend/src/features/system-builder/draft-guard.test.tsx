import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { hasUnsavedDrafts, resetDraftGuard, useDraftGuard } from "./draft-guard";

afterEach(() => resetDraftGuard());

function Editor({ dirty }: { dirty: boolean }) {
  useDraftGuard(dirty);
  return null;
}

describe("draft guard (SB2-102)", () => {
  it("is set while an editor holds an unsaved draft and cleared when it saves or unmounts", () => {
    const view = render(<Editor dirty={false} />);
    expect(hasUnsavedDrafts()).toBe(false);
    view.rerender(<Editor dirty />);
    expect(hasUnsavedDrafts()).toBe(true);
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    view.rerender(<Editor dirty={false} />);
    expect(hasUnsavedDrafts()).toBe(false);
    view.rerender(<Editor dirty />);
    view.unmount();
    expect(hasUnsavedDrafts()).toBe(false);
    const after = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});
