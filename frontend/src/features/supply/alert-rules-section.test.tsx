import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./tracking-api", () => ({ getAlertRules: vi.fn(), saveAlertRules: vi.fn() }));

import { AlertRulesSection } from "./alert-rules-section";
import { alertTitle } from "./alert-text";
import { alertFixture } from "./supply-test-fixtures";
import * as api from "./tracking-api";

const mocked = vi.mocked(api);
const MUTABLE = ["out_of_stock", "price_up", "target_price_missed", "assessment_worse"];

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getAlertRules.mockResolvedValue({ muted: [], price_rise_percent: null, target_price: null, target_currency: "", mutable: MUTABLE });
  mocked.saveAlertRules.mockImplementation(async (_id, rules) => rules);
});
afterEach(cleanup);

describe("the alert rules of a part", () => {
  it("mutes an alert, sets a target price and saves", async () => {
    render(<AlertRulesSection partId="p1" canEdit />);
    fireEvent.click(await screen.findByLabelText("Price rises"));
    fireEvent.change(screen.getByLabelText("A price rise of at least (%)"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Target price"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "eur" } });
    fireEvent.click(screen.getByRole("button", { name: "Save alert rules" }));
    await waitFor(() => expect(mocked.saveAlertRules).toHaveBeenCalledWith("p1", {
      muted: ["price_up"], price_rise_percent: 40, target_price: "0.5", target_currency: "EUR",
    }));
  });

  it("shows nothing to someone who cannot edit", () => {
    const { container } = render(<AlertRulesSection partId="p1" canEdit={false} />);
    expect(container.textContent).toBe("");
  });
});

describe("the new alert kinds in words", () => {
  it("say what was crossed", () => {
    expect(alertTitle(alertFixture({ kind: "target_price_missed", detail: { price: "0.8", target: "0.5", currency: "EUR" } }))).toBe("Price 0.8 EUR is over your target of 0.5");
    expect(alertTitle(alertFixture({ kind: "assessment_worse", detail: { was: "ok", now: "warning" } }))).toBe("Assessment went from ok to warning");
  });
});
