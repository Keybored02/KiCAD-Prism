import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MatesWithPanel } from "./library-component-mates";

afterEach(() => vi.unstubAllGlobals());

const socket = { componentId: "cmp_socket", name: "Socket", mpn: "ADF6-30", manufacturer: "Samtec" };

function stubApi(initial = [socket]) {
  let mates = [...initial];
  const calls: [string, RequestInit][] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push([url, init]);
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    if (url.startsWith("/api/catalog/components?")) {
      return json({ total: 2, page: 1, page_size: 8, pages: 1, items: [
        { id: "cmp_plug", mpn: "ADM6-30", manufacturer: "Samtec", value: "Plug", description: "" },
        { id: "cmp_housing", mpn: "PHR-4", manufacturer: "JST", value: "Housing", description: "" },
      ] });
    }
    if (init.method === "POST") mates = [...mates, { componentId: "cmp_housing", name: "Housing", mpn: "PHR-4", manufacturer: "JST" }];
    if (init.method === "DELETE") mates = mates.filter((m) => !url.endsWith(m.componentId));
    return json({ items: mates });
  }));
  return calls;
}

describe("MatesWithPanel", () => {
  it("lists partners and lets a writer add and remove them", async () => {
    const calls = stubApi();
    render(<MatesWithPanel componentId="cmp_plug" canMutate />);
    expect(await screen.findByText("ADF6-30")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Find a mating part"), { target: { value: "PH" } });
    fireEvent.click(await screen.findByRole("button", { name: "Add PHR-4" }));
    await waitFor(() => expect(screen.getByText("PHR-4")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Add ADM6-30" })).toBeNull(); // the part itself is never offered
    const post = calls.find(([, init]) => init.method === "POST")!;
    expect([post[0], JSON.parse(String(post[1].body))]).toEqual(["/api/catalog/components/cmp_plug/mates-with", { componentId: "cmp_housing" }]);
    fireEvent.click(screen.getByRole("button", { name: "Remove ADF6-30" }));
    await waitFor(() => expect(screen.queryByText("ADF6-30")).toBeNull());
    expect(calls.some(([url, init]) => init.method === "DELETE" && url === "/api/catalog/components/cmp_plug/mates-with/cmp_socket")).toBe(true);
  });

  it("is read-only for viewers", async () => {
    stubApi();
    render(<MatesWithPanel componentId="cmp_plug" canMutate={false} />);
    expect(await screen.findByText("ADF6-30")).toBeTruthy();
    expect(screen.queryByLabelText("Find a mating part")).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
  });
});
