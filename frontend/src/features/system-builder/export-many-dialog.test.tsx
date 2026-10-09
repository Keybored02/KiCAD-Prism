import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SystemDocument } from "@/types/system";

import { ExportManyDialog, exportCandidates } from "./export-many-dialog";
import { instance, link, systemDocument } from "./test-fixtures";

afterEach(() => vi.unstubAllGlobals());

const obc = instance("OBC");
const cmbd = instance("CMBD");
const port = (reference: string) => ({ portKey: `key-${reference}`, memberKeys: [], reference, libId: null, footprint: null,
  value: "M80", dnp: false, candidate: true, candidateReason: null, override: null, exposed: true, pinCount: 10 });
// OBC J2 is linked; CMBD J3 is exported already as "J3".
const base = systemDocument([obc, cmbd], [link("L1", obc.id, "J2", cmbd.id, "J2", 0)]);
const document: SystemDocument = {
  ...base,
  instances: base.instances.map((item) => ({ ...item, ports: [port("J1"), port("J2"), port("J3")] })),
  exports: [{ id: "sxp_1", name: "J3", description: "", instanceId: cmbd.id, portKey: "key-J3" } as never],
};

describe("ExportManyDialog (SB2-121)", () => {
  it("offers free connectors with names that do not clash", () => {
    expect(exportCandidates(document).map((option) => `${option.label}=${option.name}`))
      .toEqual(["CMBD J1=CMBD J1", "OBC J1=OBC J1", "OBC J3=OBC J3"]);
  });

  it("exports the ticked connectors in one call", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ exports: [] }), {
      status: 201, headers: { "Content-Type": "application/json", ETag: '"sys:s:2"' } }));
    vi.stubGlobal("fetch", fetchMock);
    const run = vi.fn(async (_label: string, action: () => Promise<unknown>) => action());
    const onClose = vi.fn();
    render(<ExportManyDialog systemId="s" document={document} etag='"sys:s:1"' busy={false} run={run as never} onClose={onClose} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Export OBC J1" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Export OBC J3" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name for OBC J3" }), { target: { value: "J3" } });
    expect(screen.getByText("Names must be unique")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Name for OBC J3" }), { target: { value: "DEBUG" } });
    fireEvent.click(screen.getByRole("button", { name: "Export 2" }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/exports\/batch$/);
    expect(JSON.parse(String(init.body)).exports.map((item: { name: string }) => item.name)).toEqual(["OBC J1", "DEBUG"]);
  });
});
