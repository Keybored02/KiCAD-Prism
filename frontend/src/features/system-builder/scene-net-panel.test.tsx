import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SystemNetDetail } from "@/types/system";

import { MAX_HIGHLIGHTED_NETS, emphasisSets, netBoards, unlitSummary } from "./scene-net-model";
import { NetPanel } from "./scene-net-panel";

const spi: SystemNetDetail = {
  groupId: "g_spi", name: "SPI_SCK", aliases: ["SPI_SCK", "OBC_SPI_SCK"], pinCount: 2, large: false, hops: [],
  members: [
    { occurrence: "/sin_obc", displayPath: "OBC-1", net: "/SPI_SCK" },
    { occurrence: "/sin_cmbd", displayPath: "CMBD", net: "OBC_SPI_SCK" },
    { occurrence: "/sin_cmbd", displayPath: "CMBD", net: "OBC_SPI_SCK_R" },
    { occurrence: null, redacted: true },
  ],
};

describe("net emphasis model", () => {
  it("lights every visible member and skips restricted ones", () => {
    expect(emphasisSets([spi])).toEqual([{ key: "g_spi", members: [
      { occurrence: "/sin_obc", net: "/SPI_SCK" },
      { occurrence: "/sin_cmbd", net: "OBC_SPI_SCK" },
      { occurrence: "/sin_cmbd", net: "OBC_SPI_SCK_R" },
    ] }]);
    expect(netBoards(spi)).toEqual({ boards: ["OBC-1", "CMBD"], restricted: 1 });
  });

  it("names the boards that did not light, by reason", () => {
    expect(unlitSummary(spi, undefined)).toBe("");
    expect(unlitSummary(spi, { key: "g_spi", color: "#fff", lit: 1, unresolved: [
      { occurrence: "/sin_obc", net: "/SPI_SCK", reason: "loading" },
      { occurrence: "/sin_cmbd", net: "OBC_SPI_SCK", reason: "unknown-net" },
      { occurrence: "/sin_cmbd", net: "OBC_SPI_SCK_R", reason: "unknown-net" },
    ] })).toBe("OBC-1 still loading; CMBD net not in its 3D model");
  });
});

describe("NetPanel", () => {
  const handlers = () => ({ onAdd: vi.fn(), onRemove: vi.fn(), onFrame: vi.fn(), isolated: false, onIsolate: vi.fn(), onClear: vi.fn(), onClose: vi.fn() });

  it("shows each highlighted net in its colour, with what did not light", () => {
    const h = handlers();
    render(
      <NetPanel systemId="sys_1" highlighted={[spi]} adding={null} {...h}
        results={new Map([["g_spi", { key: "g_spi", color: "#ffb81a", lit: 2, unresolved: [
          { occurrence: "/sin_obc", net: "/SPI_SCK", reason: "loading" as const },
        ] }]])}
      />,
    );
    const list = screen.getByRole("list", { name: "Highlighted nets" });
    expect(list.textContent).toContain("SPI_SCK");
    expect(list.textContent).toContain("OBC-1, CMBD · 1 on restricted boards");
    expect(screen.getByText("Not lit: OBC-1 still loading")).toBeTruthy();
    expect((list.querySelector("[aria-hidden]") as HTMLElement).style.background).toBe("rgb(255, 184, 26)");
    fireEvent.click(screen.getByRole("button", { name: "Frame SPI_SCK" }));
    expect(h.onFrame).toHaveBeenCalledWith("g_spi");
    fireEvent.click(screen.getByRole("button", { name: "Isolate" }));
    expect(h.onIsolate).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(h.onClear).toHaveBeenCalled();
  });

  it("explains itself when nothing is highlighted", () => {
    render(<NetPanel systemId="sys_1" highlighted={[]} results={new Map()} adding={null} {...handlers()} />);
    expect(screen.getByText(/Search for a net to light it on every board it reaches/)).toBeTruthy();
    expect(MAX_HIGHLIGHTED_NETS).toBe(8);
  });
});
