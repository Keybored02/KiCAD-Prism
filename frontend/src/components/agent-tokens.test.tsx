import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
    toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const fetchApi = vi.fn();
vi.mock("@/lib/api", () => ({
    fetchApi: (...args: unknown[]) => fetchApi(...args),
    readApiError: vi.fn(async () => "boom"),
}));

import { AgentTokensSettings } from "./agent-tokens";

const TOKENS = [
    {
        jti: "tok-1",
        email: "owner@example.com",
        label: "my-laptop",
        scopes: ["api:read", "api:write"],
        created_at: "2026-01-01T00:00:00+00:00",
        expires_at: 4102444800, // 2100-01-01, so the row reads a real date
        last_used_at: "2026-02-01T12:00:00+00:00",
    },
    {
        jti: "tok-2",
        email: "other@example.com",
        label: "workshop-pc",
        scopes: ["api:read"],
        created_at: "2026-01-02T00:00:00+00:00",
        expires_at: 4102444800,
        last_used_at: null,
    },
];

function jsonResponse(body: unknown, ok = true) {
    return { ok, json: async () => body } as unknown as Response;
}

beforeEach(() => {
    fetchApi.mockReset();
});

afterEach(() => {
    cleanup();
});

describe("AgentTokensSettings", () => {
    it("lists the current user's tokens and never asks for all users", async () => {
        fetchApi.mockResolvedValue(jsonResponse(TOKENS));
        render(<AgentTokensSettings isAdmin={false} />);

        await screen.findByText("my-laptop");
        // A plain user's request carries no all_users flag.
        expect(fetchApi).toHaveBeenCalledWith("/api/agent/tokens");
        // The all-users control is admin-only.
        expect(
            screen.queryByLabelText("Show tokens for all users"),
        ).not.toBeInTheDocument();
        // No user column for a self view.
        expect(screen.queryByText("owner@example.com")).not.toBeInTheDocument();
    });

    it("shows an empty state when there are no tokens", async () => {
        fetchApi.mockResolvedValue(jsonResponse([]));
        render(<AgentTokensSettings isAdmin={false} />);
        await screen.findByText(/No agent tokens/i);
    });

    it("lets an admin switch to all users and re-fetches with the flag", async () => {
        fetchApi.mockResolvedValue(jsonResponse(TOKENS));
        render(<AgentTokensSettings isAdmin />);

        await screen.findByText("my-laptop");
        // First load is still the admin's own until they opt in.
        expect(fetchApi).toHaveBeenNthCalledWith(1, "/api/agent/tokens");

        fireEvent.click(screen.getByLabelText("Show tokens for all users"));

        await waitFor(() =>
            expect(fetchApi).toHaveBeenCalledWith("/api/agent/tokens?all_users=true"),
        );
        // Now the user column is present.
        await screen.findByText("owner@example.com");
        expect(screen.getByText("other@example.com")).toBeInTheDocument();
    });

    it("opens a confirm dialog naming the token before revoking", async () => {
        fetchApi.mockResolvedValue(jsonResponse(TOKENS));
        render(<AgentTokensSettings isAdmin={false} />);

        await screen.findByText("my-laptop");
        fireEvent.click(screen.getByRole("button", { name: "Revoke token my-laptop" }));

        // The dialog names the device and warns the machine stops immediately.
        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText(/my-laptop stops working on Prism/i)).toBeInTheDocument();
        // No DELETE has fired yet: the destructive call waits behind the hold.
        expect(fetchApi).not.toHaveBeenCalledWith(
            "/api/agent/tokens/tok-1",
            expect.objectContaining({ method: "DELETE" }),
        );
    });

    it("surfaces a load failure without crashing", async () => {
        const { toast } = await import("sonner");
        fetchApi.mockResolvedValue(jsonResponse({}, false));
        render(<AgentTokensSettings isAdmin={false} />);
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    });
});
