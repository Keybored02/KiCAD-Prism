import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supply-api", () => ({ confirmNoticeReading: vi.fn(), dismissNoticeReading: vi.fn() }));

import { NoticeReadingBox } from "./notice-reading";
import * as api from "./supply-api";

const reading = {
  kind: "last_time_buy" as const, last_time_buy: "2026-12-15", last_time_ship: "2027-03-31",
  known_parts: [{ part_id: "p1", mpn: "ABC-1" }, { part_id: "p2", mpn: "ABC-2" }], other_numbers: ["XYZ-9"],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.confirmNoticeReading).mockResolvedValue(undefined);
  vi.mocked(api.dismissNoticeReading).mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("what was read from a notice file", () => {
  it("offers the dates and parts ticked, the kind unticked, and accepts only what is ticked", async () => {
    const done = vi.fn();
    render(<NoticeReadingBox noticeId="n1" reading={reading} onDone={done} />);
    fireEvent.click(screen.getByLabelText("Names ABC-2"));
    fireEvent.click(screen.getByRole("button", { name: "Accept the ticked" }));
    await waitFor(() => expect(api.confirmNoticeReading).toHaveBeenCalledWith("n1", { dates: true, kind: false, part_ids: ["p1"] }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(screen.getByText(/Other numbers in the file, not known to Prism: XYZ-9/)).toBeTruthy();
  });

  it("can be dismissed", async () => {
    render(<NoticeReadingBox noticeId="n1" reading={reading} onDone={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(api.dismissNoticeReading).toHaveBeenCalledWith("n1"));
  });
});
