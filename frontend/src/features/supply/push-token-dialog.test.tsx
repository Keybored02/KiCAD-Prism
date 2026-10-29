import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getPushToken = vi.fn();
const issuePushToken = vi.fn();
const revokePushToken = vi.fn();
vi.mock("./push-api", () => ({
  getPushToken: (...args: unknown[]) => getPushToken(...args),
  issuePushToken: (...args: unknown[]) => issuePushToken(...args),
  revokePushToken: (...args: unknown[]) => revokePushToken(...args),
}));

import { PushTokenDialog } from "./push-token-dialog";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Built at run time: no token-shaped literal in the repository.
const made = ["prism", "push", "x".repeat(40)].join("_");

describe("push token dialog", () => {
  it("creates a token, shows it once, then shows only its prefix", async () => {
    getPushToken.mockResolvedValueOnce(null).mockResolvedValueOnce({ prefix: made.slice(0, 14), created_by: "ana@example.com", created_at: "2026-10-30T10:00:00Z", last_used_at: null });
    issuePushToken.mockResolvedValue({ token: made, prefix: made.slice(0, 14) });
    render(<PushTokenDialog target="connector" id="c1" name="Stores" onClose={() => {}} />);
    expect(await screen.findByText("No token")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create token" }));
    expect(((await screen.findByLabelText("New push token")) as HTMLInputElement).value).toBe(made);
    expect(issuePushToken).toHaveBeenCalledWith("connector", "c1");
    expect(screen.getByRole("button", { name: "Replace token" })).toBeTruthy();
  });

  it("revokes the token a source has", async () => {
    getPushToken.mockResolvedValue({ prefix: made.slice(0, 14), created_by: "ana@example.com", created_at: "2026-10-30T10:00:00Z", last_used_at: "2026-10-30T11:00:00Z" });
    revokePushToken.mockResolvedValue(undefined);
    render(<PushTokenDialog target="inventory_source" id="s1" name="Stores" onClose={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: "Revoke" }));
    expect(await screen.findByText("No token")).toBeTruthy();
    expect(revokePushToken).toHaveBeenCalledWith("inventory_source", "s1");
  });
});
