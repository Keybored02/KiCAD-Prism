import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./supply-api", () => ({ getBomSuggestions: vi.fn() }));

import * as api from "./supply-api";
import { ProjectSuggestions } from "./project-suggestions";

afterEach(cleanup);

const item = (kind: "manufacturer" | "datasheet", suggested: string) => ({
  kind, label: kind === "datasheet" ? "Datasheet" : "Manufacturer", line_key: `${kind}-1`, references: "R1 R2", manufacturer: "", mpn: "RC0402",
  current: "", suggested, reason: "A distributor gives this",
});

describe("suggestions for the BOM", () => {
  it("lists what Prism would add, line by line", async () => {
    vi.mocked(api.getBomSuggestions).mockResolvedValue({
      available: true, counts: { manufacturer: 1, lcsc_part: 0, datasheet: 1, prism_id: 0 },
      items: [item("manufacturer", "Yageo"), item("datasheet", "https://example.com/rc.pdf")],
    });
    render(<ProjectSuggestions projectId="p1" variant="" />);
    expect(await screen.findByText("Suggestions for the BOM (2)")).toBeTruthy();
    expect(screen.getByText("Yageo")).toBeTruthy();
    expect(screen.getByText("https://example.com/rc.pdf")).toBeTruthy();
  });

  it("shows nothing when there is nothing to suggest", async () => {
    vi.mocked(api.getBomSuggestions).mockResolvedValue({ available: true, counts: { manufacturer: 0, lcsc_part: 0, datasheet: 0, prism_id: 0 }, items: [] });
    const { container } = render(<ProjectSuggestions projectId="p2" variant="" />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container.textContent).toBe("");
  });
});
