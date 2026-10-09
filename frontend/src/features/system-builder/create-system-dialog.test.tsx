import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { chooseOption } from "@/test/select";

import { CreateSystemDialog, submitSystem, validateDraft } from "./create-system-dialog";
import type { BoardDraft } from "./board-fields";
import type { Project } from "@/types/project";

const board = (patch: Partial<BoardDraft>): BoardDraft => ({
  key: 1, projectId: "prj_obc", label: "OBC-A", source: "branch", ref: "main", pinned: false, ...patch,
});

const projects = [
  { id: "prj_obc", name: "mini_obc", description: "", path: "", last_modified: "" },
  { id: "prj_pay", name: "mini_payload", display_name: "Payload", description: "", path: "", last_modified: "" },
] as Project[];

function reply(status: number, body: unknown, etag?: string): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...(etag ? { ETag: etag } : {}) } });
}

afterEach(() => vi.unstubAllGlobals());

describe("validateDraft", () => {
  it("accepts a named system with valid boards", () => {
    expect(validateDraft("Stack", [board({}), board({ key: 2, label: "PAY", source: "commit", ref: "abc1234" })])).toEqual([]);
  });

  it("reports missing fields, bad commits and duplicate labels", () => {
    expect(validateDraft(" ", [
      board({ projectId: "" }),
      board({ key: 2, label: "obc-a", source: "commit", ref: "xyz" }),
      board({ key: 3, label: "", ref: "" }),
    ])).toEqual([
      "Name the system.",
      "Board 1: choose a project.",
      "Board 2: a commit is 7 to 40 hex characters.",
      "Board 3: give it a label.",
      "Board 3: name the branch to track.",
      'Labels must be unique: "obc-a" is used 2 times.',
    ]);
  });
});

describe("submitSystem", () => {
  it("creates the system, then adds boards carrying the ETag forward", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply(201, { id: "sys_1", etag: '"sys:sys_1:1"' }, '"sys:sys_1:1"'))
      .mockResolvedValueOnce(reply(201, { id: "sin_1" }, '"sys:sys_1:2"'))
      .mockResolvedValueOnce(reply(422, { detail: "commit does not exist" }))
      .mockResolvedValueOnce(reply(201, { id: "sin_3" }, '"sys:sys_1:3"'));
    vi.stubGlobal("fetch", fetchMock);
    const result = await submitSystem({ name: " Stack ", description: "", folderId: "fld_1" }, [
      board({ pinned: true }),
      board({ key: 2, label: "BAD", source: "commit", ref: "deadbeef" }),
      board({ key: 3, projectId: "prj_pay", label: "PAY" }),
    ]);
    expect(result).toEqual({ systemId: "sys_1", failures: [{ label: "BAD", error: "commit does not exist" }] });
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(JSON.parse(String(calls[0][1].body))).toEqual({ name: "Stack", description: "", folderId: "fld_1" });
    expect(JSON.parse(String(calls[1][1].body))).toEqual({
      projectId: "prj_obc", label: "OBC-A", baselineCommit: null, trackedRef: "main", pinned: true,
    });
    expect(JSON.parse(String(calls[2][1].body))).toMatchObject({ baselineCommit: "deadbeef", trackedRef: null, pinned: false });
    expect(calls.slice(1).map(([, init]) => new Headers(init.headers).get("If-Match")))
      .toEqual(['"sys:sys_1:1"', '"sys:sys_1:2"', '"sys:sys_1:2"']);
  });
});

describe("submitSystem when no board can be added (SB2-118)", () => {
  it("deletes the empty system and reports every board's error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply(201, { id: "sys_1", etag: '"sys:sys_1:1"' }, '"sys:sys_1:1"'))
      .mockResolvedValueOnce(reply(422, { detail: "project source is not available" }))
      .mockResolvedValueOnce(reply(200, { deleted: true, archived: false }, '"sys:sys_1:2"'));
    vi.stubGlobal("fetch", fetchMock);
    await expect(submitSystem({ name: "Stack", description: "", folderId: null }, [board({})]))
      .rejects.toThrow("No board could be added. OBC-A: project source is not available");
    const [url, init] = fetchMock.mock.calls[2] as unknown as [string, RequestInit];
    expect([url, init.method]).toEqual(["/api/systems/sys_1", "DELETE"]);
  });
});

describe("CreateSystemDialog", () => {
  it("suggests a label from the project and blocks submission until valid", async () => {
    const onCreated = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => reply(201, { id: "sys_9", etag: "e" }, "e")));
    render(
      <CreateSystemDialog open projects={projects} folderId={null} folderName={null} onOpenChange={vi.fn()} onCreated={onCreated} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create system" }));
    expect(await screen.findByText("Name the system.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Flight stack" } });
    fireEvent.click(screen.getByRole("button", { name: /Add board/ }));
    await chooseOption("Board 1 project", "Payload");
    expect((screen.getByLabelText("Board 1 label") as HTMLInputElement).value).toBe("Payload");
    fireEvent.click(screen.getByRole("button", { name: "Create system" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ systemId: "sys_9", failures: [] }));
  });
});
