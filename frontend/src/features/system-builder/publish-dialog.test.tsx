import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SnapshotMeta } from "@/types/system";

import { PublishDialog } from "./publish-dialog";

const snapshot = (patch: Partial<SnapshotMeta> = {}): SnapshotMeta => ({
  id: "snp_1", name: "PDR", note: "", createdBy: "a", createdAt: "2026-10-09T00:00:00Z", digest: "d", openReviewCount: 0,
  rendererVersion: "6", findingCounts: { error: 6, warning: 13 }, exportCount: 1, ...patch,
});

describe("PublishDialog (SB2-116)", () => {
  it("states what the snapshot froze", () => {
    render(<PublishDialog snapshot={snapshot()} systemName="Stack" firstPublish busy={false} onClose={vi.fn()} onPublish={vi.fn()} />);
    expect(screen.getByLabelText("State").textContent).toBe("6 errors13 warnings0 unreviewed changes1 export");
    expect(screen.queryByText(/No exports/)).toBeNull();
  });

  it("warns when the snapshot has no exports for a parent to connect to", () => {
    render(<PublishDialog snapshot={snapshot({ exportCount: 0 })} systemName="Stack" firstPublish busy={false} onClose={vi.fn()}
      onPublish={vi.fn()} />);
    expect(screen.getByText(/No exports: a parent system will have nothing to connect to/)).toBeTruthy();
  });
});
