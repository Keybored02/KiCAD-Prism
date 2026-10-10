import { afterEach, describe, expect, it, vi } from "vitest";

import { addBoards } from "./add-board-dialog";

afterEach(() => vi.unstubAllGlobals());

const board = (key: number, label: string) => ({ key, projectId: `prj_${key}`, label, source: "branch" as const, ref: "main", pinned: false });

describe("addBoards (SB2-124)", () => {
  it("adds boards in order with each new ETag and keeps going past a refusal", async () => {
    let version = 1;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      if (body.label === "BAD") {
        return new Response(JSON.stringify({ detail: "trackedRef does not exist" }), { status: 422, headers: { "Content-Type": "application/json" } });
      }
      version += 1;
      return new Response(JSON.stringify({ id: `ins_${body.label}` }), {
        status: 201, headers: { "Content-Type": "application/json", ETag: `"sys:s:${version}"` } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await addBoards("s", '"sys:s:1"', [board(1, "OBC"), board(2, "BAD"), board(3, "PAY")]);
    expect(result.added).toEqual(["ins_OBC", "ins_PAY"]);
    expect(result.failures.map((failure) => [failure.board.label, failure.error])).toEqual([["BAD", expect.stringMatching(/trackedRef/)]]);
    const ifMatch = fetchMock.mock.calls.map(([, init]) => new Headers(init.headers).get("If-Match"));
    expect(ifMatch).toEqual(['"sys:s:1"', '"sys:s:2"', '"sys:s:2"']);
  });
});
