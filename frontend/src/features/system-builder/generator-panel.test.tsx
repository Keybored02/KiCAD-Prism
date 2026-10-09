import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GeneratorPanel } from "./generator-panel";

afterEach(() => vi.unstubAllGlobals());

const row = (pin: string, netB: string[], flags: { rule: string; name: string; severity: "error" | "warning" }[] = []) => ({
  pinA: pin, pinB: pin, signal: `S${pin}`, source: "generator", netA: [`/S${pin}`], netB, pinNamesA: null, pinNamesB: null, flags,
});

describe("GeneratorPanel", () => {
  it("flags suspect pairs and leaves them out on request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      linkId: "L1", generator: "identity", skipped: [],
      rows: [row("1", ["/S1"]), row("2", [], [{ rule: "SYS-V23", name: "net_meets_no_net", severity: "warning" }])],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const onApprove = vi.fn();
    render(<GeneratorPanel systemId="sys_1" linkId="L1" sideA="OBC J1" sideB="PAY J1" onApprove={onApprove} />);
    fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
    expect(await screen.findByText(/1 suspect/)).toBeTruthy();
    expect(screen.getByRole("img", { name: /SYS-V23 Named net meets a pin on no net/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Leave out suspect" }));
    expect(screen.queryByRole("button", { name: "Leave out suspect" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add 1 to the draft" }));
    expect(onApprove.mock.calls[0][0].map((r: { pinA: string }) => r.pinA)).toEqual(["1"]);
  });
});
