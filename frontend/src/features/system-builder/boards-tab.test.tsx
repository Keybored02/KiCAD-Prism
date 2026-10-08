import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { chooseMenuItem, chooseOption } from "@/test/select";

import { BoardsTab, linkedPortKeys, portState } from "./boards-tab";
import { OverviewTab } from "./overview-tab";
import { exportOf, instance, link, port, systemDocument } from "./test-fixtures";

vi.mock("@/hooks/use-workspace-data", () => ({
  useWorkspaceData: () => ({ projects: [] }),
  workspaceSessionKey: () => "",
}));

afterEach(() => vi.unstubAllGlobals());

const obc = instance("OBC", { ports: [port("J7"), port("J5", { override: "hidden", exposed: false })] });
const pay = instance("PAY");
const doc = systemDocument([obc, pay, instance("SECRET", { restricted: true, projectId: null, ports: null })],
  [link("L1", obc.id, "J7", pay.id, "J1", 3)]);

function renderTab(props: Partial<Parameters<typeof BoardsTab>[0]> = {}, url = "/systems/sys_1?tab=boards") {
  const reload = vi.fn(async () => undefined);
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/systems/:systemId" element={
          <BoardsTab systemId="sys_1" document={doc} etag='"sys:sys_1:1"' canEdit user={null} reload={reload}
            onNavigate={vi.fn()} {...props} />
        } />
      </Routes>
    </MemoryRouter>,
  );
  return reload;
}

describe("port helpers", () => {
  it("collects linked port and member keys per board", () => {
    expect([...linkedPortKeys(doc, obc.id)]).toEqual(["key-J7"]);
    expect([...linkedPortKeys(doc, pay.id)]).toEqual(["key-J1"]);
  });

  it("names override and exposure states", () => {
    expect(portState({ override: "promoted", exposed: true })).toBe("promoted");
    expect(portState({ override: "hidden", exposed: false })).toBe("hidden");
    expect(portState({ override: null, exposed: false })).toBe("not exposed");
  });
});

describe("BoardsTab", () => {
  it("selects the first board, and refuses to hide a linked port", () => {
    renderTab();
    expect(screen.getByRole("heading", { name: "OBC" })).toBeTruthy();
    const hide = screen.getByRole("button", { name: /Hide/ }) as HTMLButtonElement;
    expect(hide.disabled).toBe(true);
    expect(hide.title).toBe("A linked port cannot be hidden");
    expect(screen.getByRole("button", { name: /Reset/ })).toBeTruthy();
  });

  it("sends overrides with If-Match and reloads", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(port("J5")), {
      status: 200, headers: { "Content-Type": "application/json", ETag: '"sys:sys_1:2"' },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const reload = renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/systems/sys_1/instances/sin_OBC/ports/key-J5/override");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ state: null });
    expect(new Headers(init.headers).get("If-Match")).toBe('"sys:sys_1:1"');
  });

  it("warns that removing a linked board deletes its links", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204, headers: { ETag: '"sys:sys_1:2"' } }));
    vi.stubGlobal("fetch", fetchMock);
    renderTab();
    await chooseMenuItem("Board actions", /Remove board/);
    expect(await screen.findByText(/an end of 1 link/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove board" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe("/api/systems/sys_1/instances/sin_OBC?cascade=links");
  });

  it("shows a restricted board without its details or actions", () => {
    renderTab({}, "/systems/sys_1?tab=boards&board=sin_SECRET");
    expect(screen.getByText(/in a folder you cannot see/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Board actions" })).toBeNull();
  });

  it("offers to remove a board whose project was deleted", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204, headers: { ETag: '"sys:sys_1:2"' } }));
    vi.stubGlobal("fetch", fetchMock);
    const gone = instance("GONE", { restricted: true, projectId: null, ports: null, projectDeleted: true });
    renderTab({ document: systemDocument([obc, gone], []) }, `/systems/sys_1?tab=boards&board=${gone.id}`);
    expect(screen.getByText(/project has been deleted/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Remove board/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove board" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe(`/api/systems/sys_1/instances/${gone.id}`);
  });

  it("waits for the branch check to finish before reloading", async () => {
    const statuses = ["queued", "running", "completed"];
    const fetchMock = vi.fn(async (url: string) => {
      const body = url.startsWith("/api/jobs/")
        ? { job_id: "chk-1", kind: "system_source_check", status: statuses.shift(), stage: "", message: "", percent: 0 }
        : { job_id: "chk-1", status: "queued" };
      return new Response(JSON.stringify(body), { status: url.endsWith("/check") ? 202 : 200,
        headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const tracked = instance("OBC", { trackedRef: "main", ports: [port("J7")] });
    const reload = renderTab({ document: systemDocument([tracked], []) });
    fireEvent.click(screen.getByRole("button", { name: /Check now/ }));
    await waitFor(() => expect(reload).toHaveBeenCalled(), { timeout: 4000 });
    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls[0]).toBe(`/api/systems/sys_1/instances/${tracked.id}/check`);
    expect(urls.filter((url) => url === "/api/jobs/chk-1")).toHaveLength(3);
  });

  it("edits the label and branch in one dialog", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200, headers: { ETag: '"sys:sys_1:2"', "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    renderTab();
    await chooseMenuItem("Board actions", /Edit board/);
    fireEvent.change(await screen.findByLabelText("Board label"), { target: { value: "OBC-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect([url, init.method, JSON.parse(String(init.body))]).toEqual(["/api/systems/sys_1/instances/sin_OBC", "PATCH", { label: "OBC-1" }]);
  });

  it("offers no edits to viewers", () => {
    renderTab({ canEdit: false });
    expect(screen.queryByRole("button", { name: /Hide/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Board actions" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Check now/ })).toBeNull();
  });
});

describe("OverviewTab", () => {
  it("summarises and navigates", () => {
    const onNavigate = vi.fn();
    render(<OverviewTab systemId="sys_1" document={doc} etag="e" canEdit user={null} reload={vi.fn()} onNavigate={onNavigate} />);
    expect(screen.getByText("OBC/J7 ↔ PAY/J1")).toBeTruthy();
    fireEvent.click(screen.getByText("PAY"));
    expect(onNavigate).toHaveBeenLastCalledWith("boards", { board: "sin_PAY" });
    fireEvent.click(screen.getByRole("button", { name: /L1/ }));
    expect(onNavigate).toHaveBeenLastCalledWith("connectivity", { link: "L1" });
  });
  it("opts the system into the net-name check", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200, headers: { ETag: '"sys:sys_1:2"', "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const reload = vi.fn(async () => undefined);
    render(<OverviewTab systemId="sys_1" document={doc} etag='"sys:sys_1:1"' canEdit user={null} reload={reload} onNavigate={vi.fn()} />);
    const check = screen.getByRole("checkbox", { name: /Check net names across links/ });
    expect(check.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(check);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect([url, init.method, JSON.parse(String(init.body))]).toEqual(["/api/systems/sys_1", "PATCH", { optionalRules: ["SYS-V09"] }]);
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });
  it("shows the check read-only without edit rights", () => {
    const enabled = { ...doc, system: { ...doc.system, optionalRules: ["SYS-V09" as const] } };
    render(<OverviewTab systemId="sys_1" document={enabled} etag="e" canEdit={false} user={null} reload={vi.fn()} onNavigate={vi.fn()} />);
    const check = screen.getByRole("checkbox", { name: /Check net names across links/ }) as HTMLButtonElement;
    expect([check.getAttribute("aria-checked"), check.disabled]).toEqual(["true", true]);
  });
  it("exports a free port and marks it so it cannot be hidden", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 201, headers: { ETag: '"sys:sys_1:2"', "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const board = instance("OBC", { ports: [port("J7"), port("J6")] });
    renderTab({ document: systemDocument([board, pay], [link("L1", board.id, "J7", pay.id, "J1", 3)]) });
    expect(screen.getAllByRole("button", { name: /Export/ })).toHaveLength(1); // J7 is linked
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    fireEvent.change(await screen.findByLabelText("Export name"), { target: { value: "DEBUG" } });
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect([url, init.method, JSON.parse(String(init.body))]).toEqual(["/api/systems/sys_1/exports", "POST",
      { name: "DEBUG", description: "", instanceId: board.id, portKey: "key-J6" }]);
  });

  it("badges an exported port and disables Hide on it", () => {
    const board = instance("OBC", { ports: [port("J6")] });
    renderTab({ document: systemDocument([board], [], [exportOf("DEBUG", board.id, "J6")]) });
    expect(screen.getByText(/exported as DEBUG/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Hide/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /^Export$/ })).toBeNull();
  });
  it("lists exports with their state and renames through the menu", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200, headers: { ETag: '"sys:sys_1:2"', "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const withExports = systemDocument([obc, pay], [link("L1", obc.id, "J7", pay.id, "J1", 3)],
      [exportOf("DEBUG", obc.id, "J5"), exportOf("PWR_IN", pay.id, "J2", { resolved: false })]);
    const reload = vi.fn(async () => undefined);
    render(<OverviewTab systemId="sys_1" document={withExports} etag='"sys:sys_1:1"' canEdit user={null} reload={reload} onNavigate={vi.fn()} />);
    expect(screen.getByText("DEBUG")).toBeTruthy();
    expect(screen.getByText("unresolved")).toBeTruthy();
    await chooseMenuItem("Actions for DEBUG", /Rename/);
    fireEvent.change(await screen.findByLabelText("Export name"), { target: { value: "SWD" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect([url, init.method, JSON.parse(String(init.body))]).toEqual(["/api/systems/sys_1/exports/sxp_DEBUG", "PATCH", { name: "SWD", description: "" }]);
  });
  it("shows a subsystem with its revision, exports and contents", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ systemId: "sys_1", boardCount: 2, occurrences: [
      { path: "/sin_CNDH", displayPath: "CNDH-A", labels: ["CNDH-A"], instanceId: "sin_CNDH", kind: "assembly", depth: 1, restricted: false },
      { path: "/sin_CNDH/sin_x", displayPath: "CNDH-A ▸ OBC-1", labels: ["CNDH-A", "OBC-1"], instanceId: "sin_x", kind: "board", depth: 2, restricted: false },
      { path: "/sin_CNDH/sin_y", displayPath: "CNDH-A ▸ PAY", labels: ["CNDH-A", "PAY"], instanceId: "sin_y", kind: "board", depth: 2, restricted: true },
    ] }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const cndh = instance("CNDH", {
      kind: "assembly", label: "CNDH-A", projectId: null, projectName: "CNDH Stack", baselineCommit: null, trackedRef: null,
      ports: [port("PWR_IN", { portKey: "sxp_1", value: "J1", pinCount: 60 })],
      catalog: { componentId: "cmp_1", revisionId: "rev_2", follow: "latest_released", version: 2, releaseStatus: "released",
        identity: "IPN-1", latestReleasedRevisionId: "rev_2", systemId: "sys_child", snapshotName: "CDR-rc2" },
    });
    renderTab({ document: systemDocument([cndh]) });
    expect(screen.getByText("Subsystem")).toBeTruthy();
    expect(screen.getAllByText("v2 released")).toHaveLength(2); // the list and the header
    expect(screen.getByText("CDR-rc2")).toBeTruthy();
    expect(screen.getByText("PWR_IN")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open system/ }).getAttribute("href")).toBe("/systems/sys_child");
    const contents = await screen.findByRole("list", { name: "Subsystem contents" });
    expect(contents.textContent).toContain("OBC-1");
    expect(contents.querySelector("[aria-label=restricted]")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Check now/ })).toBeNull();
  });

  it("adds a subsystem from the catalog, pinning an unreleased one", async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(url.startsWith("/api/catalog")
      ? { items: [{ id: "cmp_1", name: "CNDH Stack", value: "IPN-1", current_revision_id: "rev_1", released_revision_id: "" }] }
      : { id: "sin_new" }), { status: url.startsWith("/api/catalog") ? 200 : 201, headers: { "Content-Type": "application/json", ETag: '"sys:sys_1:2"' } }));
    vi.stubGlobal("fetch", fetchMock);
    renderTab();
    await chooseMenuItem("Add", /Subsystem/);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await chooseOption("Assembly", /CNDH Stack/);
    expect(await screen.findByText(/Not released yet/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Label in this system"), { target: { value: "CNDH-A" } });
    fireEvent.click(screen.getByRole("button", { name: "Add subsystem" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url === "/api/systems/sys_1/instances")).toBe(true));
    const [, init] = fetchMock.mock.calls.find(([url]) => url === "/api/systems/sys_1/instances") as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ kind: "assembly", label: "CNDH-A", componentId: "cmp_1", revisionId: "rev_1", follow: "pinned" });
  });

  it("adds a catalog module (SB2-49): the module list, then a module instance", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.startsWith("/api/catalog/components")) {
        return new Response(JSON.stringify({ items: [{ id: "cmp_imu", name: "IMU", value: "IMU-1", released_revision_id: "rev_1",
          current_revision_id: "rev_1" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ id: "sin_imu", ...JSON.parse(String(init?.body ?? "{}")) }),
        { status: 201, headers: { ETag: '"sys:sys_1:2"', "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderTab();
    await chooseMenuItem(/Add/, /Module/);
    expect(await screen.findByRole("heading", { name: "Add a module" })).toBeTruthy();
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe("/api/catalog/components?kind=module&page_size=200");
    await chooseOption("Module", /IMU · IMU-1/);
    fireEvent.click(screen.getByRole("button", { name: "Add module" }));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe("/api/systems/sys_1/instances");
    expect(JSON.parse(String(init.body))).toEqual({ kind: "module", label: "IMU", componentId: "cmp_imu", follow: "latest_released" });
  });
});
