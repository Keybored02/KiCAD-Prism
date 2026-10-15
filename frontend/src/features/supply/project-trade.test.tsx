import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./supply-api", () => ({ getProjectTrade: vi.fn() }));

import { ProjectTrade } from "./project-trade";
import * as api from "./supply-api";

afterEach(cleanup);

describe("the trade classification", () => {
  it("loads when opened and shows what distributors state", async () => {
    vi.mocked(api.getProjectTrade).mockResolvedValue({
      available: true,
      report: {
        parts: [{ key: "k", manufacturer: "Acme", mpn: "U-1", quantity: 1, part_id: "p", eccn: ["3A001"], control: "controlled", hts_us: ["8542.33.0001"], hts_eu: [], gaps: [] }],
        summary: { parts: 1, controlled: 1, unknown: 0, disputed: 0, with_gaps: 0, note: "What distributors state." },
      },
    });
    const { container } = render(<ProjectTrade projectId="prj" variant="" />);
    expect(api.getProjectTrade).not.toHaveBeenCalled();
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(await screen.findByText("Controlled")).toBeTruthy();
    expect(screen.getByText("8542.33.0001")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Download as CSV" }).getAttribute("href")).toBe("/api/supply/projects/prj/trade?format=csv");
  });
});
