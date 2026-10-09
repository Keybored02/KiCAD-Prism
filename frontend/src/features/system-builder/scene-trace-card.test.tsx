import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SystemNetDetail, SystemNetHop } from "@/types/system";

import { hopEndLabel, hopVia, orderedHops, traceSet } from "./scene-net-model";
import { TraceCard } from "./scene-trace-card";
import type { TracedNet } from "./use-traced-net";

const end = (occurrence: string | null, displayPath: string | null, reference: string, pad: string) =>
  ({ occurrence, displayPath, reference, pad });
// OBC-1 J3 ↔ CMBD J1, then CMBD J2 ↔ PSU J5: listed by the server PSU-side first.
const cmbdPsu: SystemNetHop = { kind: "row", linkName: "CMBD J2 ↔ PSU J5", from: end("/sin_psu", "PSU", "J5", "4"), to: end("/sin_cmbd", "CMBD", "J2", "4") };
const obcCmbd: SystemNetHop = { kind: "row", linkName: "OBC-1 J3 ↔ CMBD J1", signal: "SPI_SCK", from: end("/sin_cmbd", "CMBD", "J1", "12"), to: end("/sin_obc", "OBC-1", "J3", "12") };
const spi: SystemNetDetail = {
  groupId: "g_spi", name: "OBC_SPI_SCK", aliases: ["OBC_SPI_SCK", "SPI_SCK"], pinCount: 4, large: false,
  hops: [cmbdPsu, obcCmbd],
  members: [
    { occurrence: "/sin_obc", displayPath: "OBC-1", net: "/SPI_SCK" },
    { occurrence: "/sin_cmbd", displayPath: "CMBD", net: "OBC_SPI_SCK" },
    { occurrence: "/sin_psu", displayPath: "PSU", net: "SCK" },
  ],
};
const traced = (patch: Partial<TracedNet> = {}): TracedNet => ({
  origin: "/sin_obc", boardNet: "/SPI_SCK", loading: false, net: spi, error: null, waiting: false, ...patch,
});

describe("trace model", () => {
  it("orders hops outward from the clicked board, each running away from it", () => {
    const hops = orderedHops(spi, "/sin_obc");
    expect(hops.map((hop) => [hop.from.displayPath, hop.to.displayPath])).toEqual([["OBC-1", "CMBD"], ["CMBD", "PSU"]]);
    // From the other end the same path reads the other way.
    expect(orderedHops(spi, "/sin_psu").map((hop) => [hop.from.displayPath, hop.to.displayPath])).toEqual([["PSU", "CMBD"], ["CMBD", "OBC-1"]]);
    // Hops the clicked board doesn't reach keep the server's order after the rest.
    expect(orderedHops(spi, "/sin_elsewhere")).toEqual(spi.hops);
  });

  it("labels hop ends and what carries them", () => {
    expect(hopEndLabel(obcCmbd.to)).toBe("OBC-1 J3.12");
    expect(hopEndLabel({ occurrence: null, end: "B", endPin: "3" })).toBe("Harness end B pin 3");
    expect(hopVia(obcCmbd)).toBe("OBC-1 J3 ↔ CMBD J1 · SPI_SCK");
    expect(hopVia({ kind: "wire", harnessName: "W1", wireId: "7", from: obcCmbd.from, to: obcCmbd.to })).toBe("W1 wire 7");
  });

  it("lights a trace in the selection green under its own key", () => {
    expect(traceSet(spi)).toEqual({ key: "trace", color: "#14ff33", members: [
      { occurrence: "/sin_obc", net: "/SPI_SCK" }, { occurrence: "/sin_cmbd", net: "OBC_SPI_SCK" }, { occurrence: "/sin_psu", net: "SCK" },
    ] });
  });
});

function renderCard(net: TracedNet) {
  const handlers = { onLight: vi.fn(), onFrameBoard: vi.fn(), onFrameHop: vi.fn() };
  render(<TraceCard traced={net} {...handlers} />);
  return handlers;
}

describe("TraceCard", () => {
  it("names the net by the clicked end and lists its boards and path", () => {
    const { onFrameBoard, onFrameHop } = renderCard(traced());
    expect(screen.getByText("SPI_SCK")).toBeTruthy();
    expect(screen.getByText(/4 pins on 3 boards · also OBC_SPI_SCK/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "CMBD" }));
    expect(onFrameBoard).toHaveBeenCalledWith("/sin_cmbd");
    const hops = screen.getAllByTitle("Frame this connection");
    expect(hops.map((hop) => hop.textContent)).toEqual([
      "OBC-1 J3.12CMBD J1.12OBC-1 J3 ↔ CMBD J1 · SPI_SCK",
      "CMBD J2.4PSU J5.4CMBD J2 ↔ PSU J5",
    ]);
    fireEvent.click(hops[1]);
    expect(onFrameHop).toHaveBeenCalledWith(expect.objectContaining({ from: expect.objectContaining({ reference: "J2" }) }));
  });

  it("says when a net stays on its board, and while it traces", () => {
    const { rerender } = render(<TraceCard traced={traced({ net: null })} onLight={vi.fn()} onFrameBoard={vi.fn()} onFrameHop={vi.fn()} />);
    expect(screen.getByText("/SPI_SCK stays on this board: no link carries it to another.")).toBeTruthy();
    rerender(<TraceCard traced={traced({ loading: true, net: null })} onLight={vi.fn()} onFrameBoard={vi.fn()} onFrameHop={vi.fn()} />);
    expect(screen.getByText(/Tracing \/SPI_SCK across the system/)).toBeTruthy();
  });

  it("asks before lighting a net over 200 pins on every board", () => {
    const { onLight } = renderCard(traced({ waiting: true, net: { ...spi, pinCount: 600, large: true } }));
    expect(screen.getByText(/SPI_SCK has over 200 pins: it is lit on this board only/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Light on all 3 boards" }));
    expect(onLight).toHaveBeenCalledWith("g_spi");
  });

  it("lists the first 50 hops of a large net until asked for all", () => {
    const hops = Array.from({ length: 120 }, (_, pin) => ({ ...obcCmbd, from: { ...obcCmbd.from, pad: String(pin) } }));
    renderCard(traced({ net: { ...spi, hops } }));
    expect(screen.getAllByTitle("Frame this connection")).toHaveLength(50);
    fireEvent.click(screen.getByRole("button", { name: "Show all 120 hops" }));
    expect(screen.getAllByTitle("Frame this connection")).toHaveLength(120);
  });
});
