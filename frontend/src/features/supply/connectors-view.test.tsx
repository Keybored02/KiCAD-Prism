import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiHttpError } from "@/lib/api";
import type { User } from "@/types/auth";
import { connectorFixture, providerFixture } from "./supply-test-fixtures";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("./supply-api", async (importOriginal) => ({
  // Keep the real error classes and constants; replace only what talks to the network.
  ...(await importOriginal<typeof import("./supply-api")>()),
  listSupplyProviders: vi.fn(),
  listSupplyConnectors: vi.fn(),
  createSupplyConnector: vi.fn(),
  updateSupplyConnector: vi.fn(),
  setSupplyConnectorCredentials: vi.fn(),
  pauseSupplyConnector: vi.fn(),
  resumeSupplyConnector: vi.fn(),
  confirmSupplyTermsReview: vi.fn(),
  deleteSupplyConnector: vi.fn(),
  uploadSupplyCsv: vi.fn(),
  clearSupplyCsv: vi.fn(),
}));

import * as api from "./supply-api";
import { SupplyConnectorsView } from "./connectors-view";

const mocked = vi.mocked(api);
const admin: User = { name: "Ana", email: "ana@example.com", role: "admin" };
const designer: User = { name: "Dee", email: "dee@example.com", role: "designer" };

function load(connectors = [connectorFixture()], providers = [providerFixture()]) {
  mocked.listSupplyProviders.mockResolvedValue(providers);
  mocked.listSupplyConnectors.mockResolvedValue(connectors);
}

async function openMenu(name: string) {
  const trigger = await screen.findByRole("button", { name: `Actions for ${name}` });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.keyDown(trigger, { key: "Enter" });
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("connectors list", () => {
  it("shows each connector with its state, budget and which credentials are set", async () => {
    load([connectorFixture({ credentials: { api_key: true, secret: false } })]);
    render(<SupplyConnectorsView user={admin} />);
    const card = await screen.findByRole("article", { name: "Demo EU" });
    expect(within(card).getByText("Needs credentials")).toBeTruthy();
    expect(within(card).getByText("Demo distributor · EUR")).toBeTruthy();
    expect(within(card).getByText("120 / 1,000")).toBeTruthy();
    expect(within(card).getByText("api_key")).toBeTruthy();
    expect(within(card).getByText("secret")).toBeTruthy();
    expect(within(card).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("12");
    expect(within(card).getByText("Not reviewed")).toBeTruthy();
  });

  it("lets readers look but not change", async () => {
    load();
    render(<SupplyConnectorsView user={designer} />);
    await screen.findByRole("article", { name: "Demo EU" });
    expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
    expect((screen.getByRole("button", { name: /Add connector/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("explains an empty list, with and without providers", async () => {
    load([], []);
    const { unmount } = render(<SupplyConnectorsView user={admin} />);
    expect(await screen.findByText(/No distributor providers are installed/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Add connector/ }) as HTMLButtonElement).disabled).toBe(true);
    unmount();

    load([], [providerFixture()]);
    render(<SupplyConnectorsView user={admin} />);
    expect(await screen.findByText(/Add a distributor to start/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Add connector/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("reports a load failure and retries", async () => {
    mocked.listSupplyProviders
      .mockRejectedValueOnce(new Error("Could not load providers"))
      .mockResolvedValue([providerFixture()]);
    mocked.listSupplyConnectors.mockResolvedValue([connectorFixture()]);
    render(<SupplyConnectorsView user={admin} />);
    expect(await screen.findByText("Could not load providers")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("article", { name: "Demo EU" })).toBeTruthy();
  });
});

describe("adding a connector", () => {
  it("sends the form and shows the new connector", async () => {
    load([], [providerFixture()]);
    mocked.createSupplyConnector.mockResolvedValue(connectorFixture({ id: "c2", display_name: "Demo distributor" }));
    render(<SupplyConnectorsView user={admin} />);
    fireEvent.click(await screen.findByRole("button", { name: /Add connector/ }));
    const submit = await screen.findByRole("button", { name: "Add connector", hidden: false });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "KEY-1" } });
    expect((screen.getByLabelText("API key") as HTMLInputElement).type).toBe("password");
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "eur" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add connector" }).at(-1)!);

    await waitFor(() => expect(mocked.createSupplyConnector).toHaveBeenCalledTimes(1));
    expect(mocked.createSupplyConnector).toHaveBeenCalledWith({
      provider: "demo",
      storefront: "",
      display_name: "",
      currency: "EUR",
      credentials: { api_key: "KEY-1" },
      daily_budget: 1000,
      interactive_reserve_pct: 10,
    });
    expect(await screen.findByRole("article", { name: "Demo distributor" })).toBeTruthy();
    expect(screen.queryByLabelText("API key")).toBeNull();
  });

  it("keeps the dialog open and shows the server's reason", async () => {
    load([], [providerFixture()]);
    mocked.createSupplyConnector.mockRejectedValue(new ApiHttpError(409, "A connector for this provider and storefront already exists.", "duplicate"));
    render(<SupplyConnectorsView user={admin} />);
    fireEvent.click(await screen.findByRole("button", { name: /Add connector/ }));
    fireEvent.change(await screen.findByLabelText("API key"), { target: { value: "KEY-1" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add connector" }).at(-1)!);
    expect(await screen.findByText(/already exists/)).toBeTruthy();
    expect(screen.getByLabelText("API key")).toBeTruthy();
  });
});

describe("changing a connector", () => {
  it("pauses with a reason", async () => {
    load();
    mocked.pauseSupplyConnector.mockResolvedValue(connectorFixture({ paused_reason: "over budget" }));
    render(<SupplyConnectorsView user={admin} />);
    await openMenu("Demo EU");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Pause" }));
    const pause = await screen.findByRole("button", { name: "Pause" });
    expect((pause as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "over budget" } });
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await waitFor(() => expect(mocked.pauseSupplyConnector).toHaveBeenCalledWith("c1", "over budget"));
    const card = await screen.findByRole("article", { name: "Demo EU" });
    expect(await within(card).findByText("over budget")).toBeTruthy();
    expect(within(card).getAllByText("Paused")).toHaveLength(2);
  });

  it("offers resume for a paused connector and applies the result", async () => {
    load([connectorFixture({ paused_reason: "over budget" })]);
    mocked.resumeSupplyConnector.mockResolvedValue(connectorFixture());
    render(<SupplyConnectorsView user={admin} />);
    await openMenu("Demo EU");
    expect(screen.queryByRole("menuitem", { name: "Pause" })).toBeNull();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Resume" }));
    await waitFor(() => expect(mocked.resumeSupplyConnector).toHaveBeenCalledWith("c1"));
    expect(await screen.findByText("Active")).toBeTruthy();
  });

  it("saves only the fields that changed", async () => {
    load();
    mocked.updateSupplyConnector.mockResolvedValue(connectorFixture({ daily_budget: 500 }));
    render(<SupplyConnectorsView user={admin} />);
    await openMenu("Demo EU");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit settings" }));
    const save = await screen.findByRole("button", { name: "Save" });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Daily call budget"), { target: { value: "500" } });
    fireEvent.click(save);
    await waitFor(() => expect(mocked.updateSupplyConnector).toHaveBeenCalledWith("c1", { daily_budget: 500 }));
  });

  it("never prefills credentials when replacing them", async () => {
    load();
    mocked.setSupplyConnectorCredentials.mockResolvedValue(connectorFixture());
    render(<SupplyConnectorsView user={admin} />);
    await openMenu("Demo EU");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Replace credentials" }));
    const input = (await screen.findByLabelText("API key")) as HTMLInputElement;
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "NEW" } });
    fireEvent.click(screen.getByRole("button", { name: "Replace" }));
    await waitFor(() => expect(mocked.setSupplyConnectorCredentials).toHaveBeenCalledWith("c1", { api_key: "NEW" }));
  });

  it("deletes after confirmation", async () => {
    load();
    mocked.deleteSupplyConnector.mockResolvedValue(undefined);
    render(<SupplyConnectorsView user={admin} />);
    await openMenu("Demo EU");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(mocked.deleteSupplyConnector).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocked.deleteSupplyConnector).toHaveBeenCalledWith("c1"));
    await waitFor(() => expect(screen.queryByRole("article", { name: "Demo EU" })).toBeNull());
  });

  it("records a terms review without a form", async () => {
    load();
    mocked.confirmSupplyTermsReview.mockResolvedValue(
      connectorFixture({ terms_reviewed_by: "ana@example.com", terms_reviewed_at: "2026-03-02T09:00:00Z" }),
    );
    render(<SupplyConnectorsView user={admin} />);
    await openMenu("Demo EU");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Mark terms as reviewed" }));
    await waitFor(() => expect(mocked.confirmSupplyTermsReview).toHaveBeenCalledWith("c1"));
    expect(await screen.findByText(/Reviewed by ana@example.com/)).toBeTruthy();
  });
});
