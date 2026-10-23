import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./supply-api", () => ({ getCrossReference: vi.fn(), addComponentSource: vi.fn(), askSubstitutes: vi.fn(), addSupplyWatch: vi.fn() }));

import { CrossReferenceSection } from "./cross-reference-section";
import * as api from "./supply-api";

const result = {
  candidates: [
    { part_id: "p2", manufacturer: "Globex", mpn: "G-10K", grade: "direct" as const, grade_label: "Direct replacement", same: ["resistance", "package"], differs: [], stock: 500, status: "ok" as const, lifecycle: "active" as const },
    { part_id: "p3", manufacturer: "Globex", mpn: "G-10K-0805", grade: "functional" as const, grade_label: "Same function, other package", same: ["resistance"], differs: ["package"], stock: null, status: "unknown" as const, lifecycle: "unknown" as const },
  ],
  suggested_by_distributors: ["R-10K-NEW"], judged_on: ["resistance", "package"],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getCrossReference).mockResolvedValue(result);
});
afterEach(cleanup);

describe("alternatives to a part", () => {
  it("looks only when asked or opened and grades each", async () => {
    render(<CrossReferenceSection partId="p1" canEdit />);
    expect(api.getCrossReference).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Find alternatives" }));
    expect(await screen.findByText("Direct replacement")).toBeTruthy();
    expect(screen.getByText("Same function, other package")).toBeTruthy();
    expect(screen.getByText(/Distributors suggest: R-10K-NEW/)).toBeTruthy();
    expect(screen.getByText(/Differs: package/)).toBeTruthy();
  });

  it("loads what is stored when the section is opened, without a distributor call", async () => {
    vi.mocked(api.getCrossReference).mockResolvedValue({ ...result, suggestions: [] });
    render(<CrossReferenceSection partId="p1" canEdit />);
    expect(api.getCrossReference).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("heading", { name: "Alternatives" }));
    expect(await screen.findByText("Direct replacement")).toBeTruthy();
    expect(api.getCrossReference).toHaveBeenCalledTimes(1);
    expect(api.askSubstitutes).not.toHaveBeenCalled();
  });

  const suggestions = [
    { manufacturer: "Globex", mpn: "G-10K-NEW", sku: "C1", notes: ["Direct", "SOT-23-5L"], sources: [{ provider: "digikey", name: "DigiKey" }, { provider: "lcsc", name: "LCSC" }], asked: true, part_id: null, stock: null, status: null, tracked: false },
    { manufacturer: "", mpn: "", sku: "595-R-10K", notes: ["Mouser number"], sources: [{ provider: "mouser", name: "Mouser" }], asked: false, part_id: null, stock: null, status: null, tracked: false },
    { manufacturer: "Globex", mpn: "G-10K", sku: "", notes: [], sources: [{ provider: "lcsc", name: "LCSC" }], asked: false, part_id: "p2", stock: 500, status: "ok" as const, tracked: true },
  ];

  it("lists what distributors suggest first, with who said it, in their words, and says they are not compared", async () => {
    vi.mocked(api.getCrossReference).mockResolvedValue({ ...result, suggestions });
    render(<CrossReferenceSection partId="p1" canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Find alternatives" }));
    expect(await screen.findByText("Suggested by distributors")).toBeTruthy();
    expect(screen.getByText(/DigiKey, LCSC: Direct, SOT-23-5L, asked at DigiKey/)).toBeTruthy();
    expect(screen.getByText(/a distributor number, not a part number/)).toBeTruthy();
    expect(screen.getByText(/500 in stock, tracked/)).toBeTruthy();
    expect(screen.getByText(/Prism has not compared them with the part/)).toBeTruthy();
  });

  it("tracks a suggested part and proposes it, but offers neither for a distributor number or an already tracked part", async () => {
    vi.mocked(api.getCrossReference).mockResolvedValue({ ...result, suggestions });
    vi.mocked(api.addSupplyWatch).mockResolvedValue({} as never);
    render(<CrossReferenceSection partId="p1" canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Find alternatives" }));
    await screen.findByText("Suggested by distributors");
    expect(screen.getAllByRole("button", { name: "Track" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Track" }));
    await waitFor(() => expect(api.addSupplyWatch).toHaveBeenCalledWith({ manufacturer: "Globex", mpn: "G-10K-NEW" }));
  });

  it("asks DigiKey for substitutes and shows what it names, or why it could not", async () => {
    vi.mocked(api.getCrossReference).mockResolvedValue({ ...result, suggestions });
    vi.mocked(api.askSubstitutes).mockResolvedValue({ asked: 1, found: 3, problems: [] });
    render(<CrossReferenceSection partId="p1" canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Ask DigiKey for substitutes" }));
    await waitFor(() => expect(api.askSubstitutes).toHaveBeenCalledWith("p1"));
    expect(await screen.findByText("Suggested by distributors")).toBeTruthy();
  });

  it("does not offer the DigiKey question to someone who cannot edit", () => {
    render(<CrossReferenceSection partId="p1" canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Ask DigiKey for substitutes" })).toBeNull();
  });
});
