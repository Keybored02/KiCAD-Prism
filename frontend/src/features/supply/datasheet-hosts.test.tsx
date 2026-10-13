import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listDeniedDatasheetHosts: vi.fn(),
  denyDatasheetHost: vi.fn(),
  allowDatasheetHost: vi.fn(),
}));

import { DatasheetHosts } from "./datasheet-hosts";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listDeniedDatasheetHosts.mockResolvedValue([{ host: "slow.example", reason: "slow", added_by: "a@example.com", created_at: "2026-10-13T00:00:00+00:00" }]);
  mocked.denyDatasheetHost.mockResolvedValue();
  mocked.allowDatasheetHost.mockResolvedValue();
});
afterEach(cleanup);

describe("the datasheet hosts to avoid", () => {
  it("lists them, adds one and allows one", async () => {
    render(<DatasheetHosts />);
    expect(await screen.findByText("slow.example")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Host to avoid"), { target: { value: " bad.example " } });
    fireEvent.click(screen.getByRole("button", { name: "Avoid" }));
    await waitFor(() => expect(mocked.denyDatasheetHost).toHaveBeenCalledWith("bad.example"));
    fireEvent.click(screen.getByRole("button", { name: "Allow slow.example" }));
    await waitFor(() => expect(mocked.allowDatasheetHost).toHaveBeenCalledWith("slow.example"));
  });
});
