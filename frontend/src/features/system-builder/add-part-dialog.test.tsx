import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddPartDialog } from "./add-part-dialog";
import { buildDiagram } from "./diagram-model";
import { instance, systemDocument } from "./test-fixtures";
import { WorkspaceOutline } from "./workspace/workspace-outline";

afterEach(() => vi.unstubAllGlobals());

const enclosure = instance("Enclosure", { kind: "part", ports: [], projectId: null, baselineCommit: null,
  catalog: { componentId: "cmp_e", revisionId: "rev_e", follow: "pinned", version: 1, releaseStatus: "released",
    identity: "ENC-1", latestReleasedRevisionId: "rev_e", systemId: null, snapshotName: null } });
const doc = systemDocument([instance("OBC"), enclosure]);

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("mechanical parts (SB2-108)", () => {
  it("lists parts apart in the outline and offers Add → Part", async () => {
    const onAdd = vi.fn();
    render(<WorkspaceOutline document={doc} findings={[]} selection={null} canEdit onSelect={vi.fn()} onAdd={onAdd} />);
    expect(screen.getByRole("region", { name: "Parts" }).textContent).toContain("Enclosure");
  });

  it("leaves parts off the diagram: they have no ports", () => {
    expect(buildDiagram(doc, {}).nodes.map((node) => node.data.instance.label)).toEqual(["OBC"]);
  });

  it("adds a catalog part only when it has a converted model", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/models")) return json({ items: url.includes("cmp_a") ? [{ glb: { key: "k" } }] : [{ glb: null }] });
      return json({ items: [{ id: "cmp_a", name: "Enclosure", value: "ENC-1", current_revision_id: "rev_a" },
        { id: "cmp_b", name: "Bracket", value: "BR-1", current_revision_id: "rev_b" }] });
    }));
    const onSubmit = vi.fn();
    render(<AddPartDialog existingLabels={["OBC"]} busy={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(await screen.findByRole("button", { name: /Bracket/ }));
    expect(await screen.findByText("No converted 3D model")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Add part" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Enclosure/ }));
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Housing" } });
    await waitFor(() => expect((screen.getByRole("button", { name: "Add part" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Add part" }));
    expect(onSubmit).toHaveBeenCalledWith({ label: "Housing", componentId: "cmp_a", revisionId: "rev_a", follow: "pinned" });
  });
});
