import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TrackingRoom, TrackingRoomAccount } from "@/types/supply";

vi.mock("./tracking-api", () => ({ getTrackingRoom: vi.fn() }));

import * as api from "./tracking-api";
import { TrackingRoomLine, TrackingRoomSection, roomSentence, roughly } from "./tracking-room";

const mocked = vi.mocked(api);

function account(overrides: Partial<TrackingRoomAccount> = {}): TrackingRoomAccount {
  return {
    connector_ids: ["c1"], name: "DigiKey", assembly_only: false, capacity: 900, free: 893, waiting: 0, searched: 22,
    carried_percent: 95, estimated_per_day: 6.2, measured_per_day: null, factor: 1, room: { daily: 794, weekly: 3146 }, ...overrides,
  };
}

function room(accounts: TrackingRoomAccount[], headline: TrackingRoom["headline"]): TrackingRoom {
  return { accounts, headline };
}

afterEach(cleanup);

describe("room to track", () => {
  it("rounds to two significant figures", () => {
    expect([roughly(42), roughly(794), roughly(3146), roughly(32176)]).toEqual(["42", "790", "3,100", "32,000"]);
  });

  it("names the distributor that fills first, and says when parts already wait", () => {
    const one = { room: 794, limited_by: "DigiKey" };
    expect(roomSentence(room([], { daily: one, weekly: { room: 3146, limited_by: "DigiKey" } })))
      .toBe("Room for about 790 more daily parts, or 3,100 weekly. DigiKey fills first.");
    expect(roomSentence(room([], { daily: { room: 0, limited_by: "LCSC" }, weekly: { room: 0, limited_by: "LCSC" } })))
      .toBe("No room for more parts at LCSC: parts already wait there.");
    expect(roomSentence(room([], { daily: null, weekly: null }))).toBe("");
  });

  it("shows the headline on the Parts page", async () => {
    mocked.getTrackingRoom.mockResolvedValue(room([account()], { daily: { room: 794, limited_by: "DigiKey" }, weekly: { room: 3146, limited_by: "DigiKey" } }));
    render(<TrackingRoomLine />);
    expect(await screen.findByText(/Room for about 790 more daily parts/)).toBeTruthy();
  });

  it("lists each distributor with what its figure rests on, and withholds one with too little to go on", async () => {
    mocked.getTrackingRoom.mockResolvedValue(room(
      [
        account(),
        account({ connector_ids: ["c2"], name: "TME", measured_per_day: 1.5, estimated_per_day: 1.2, room: { daily: 32176, weekly: 218292 } }),
        account({ connector_ids: ["c3"], name: "JLCPCB", assembly_only: true, searched: 0, room: { daily: null, weekly: null } }),
      ],
      { daily: { room: 794, limited_by: "DigiKey" }, weekly: { room: 3146, limited_by: "DigiKey" } },
    ));
    render(<TrackingRoomSection />);
    const section = await screen.findByRole("region", { name: "Room to track" });
    const tme = within(section).getByRole("row", { name: /TME/ });
    expect(within(tme).getByText("32,000")).toBeTruthy();
    expect(within(tme).getByText(/spent 1.5 calls a day last week, against 1.2 estimated/)).toBeTruthy();
    expect(within(within(section).getByRole("row", { name: /JLCPCB/ })).getByText("Too few parts searched there to tell")).toBeTruthy();
  });
});
