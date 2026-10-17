import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ForecastSection } from "./forecast-section";
import { chanceText, chipText, dateText, isGrey, rangeText } from "./forecast-text";
import { forecastWord } from "./forecast-words";
import { learning, partForecastFixture, shown } from "./forecast-test-fixtures";

afterEach(cleanup);

describe("how a forecast is said", () => {
  it("uses days within two weeks and dates beyond", () => {
    expect(dateText("2026-11-20", "2026-11-20")).toBe("today");
    expect(dateText("2026-11-21", "2026-11-20")).toBe("tomorrow");
    expect(dateText("2026-11-25", "2026-11-20")).toBe("in about 5 days");
    expect(dateText("2026-12-14", "2026-11-20")).toBe("14 Dec");
    expect(dateText("2027-01-09", "2026-11-20")).toContain("2027");
  });

  it("gives a range around the most likely day", () => {
    expect(rangeText("2026-12-02", "2026-12-14", "2027-01-09", "2026-11-20")).toBe("around 14 Dec (between 2 Dec and 9 Jan 2027)");
    expect(rangeText("2026-11-23", "2026-11-25", "2026-11-29", "2026-11-20")).toBe("in about 5 days (3 to 9 days)");
  });

  it("has one scale of words, the same as the server", () => {
    expect([0.95, 0.78, 0.5, 0.2, 0.04].map((p) => forecastWord(p).word)).toEqual(["Almost certain", "Likely", "Uncertain", "Unlikely", "Very unlikely"]);
    expect(chanceText(forecastWord(0.784))).toBe("Likely (78%)");
  });

  it("greys a forecast unless its model is shown, and says why", () => {
    expect(isGrey(shown)).toBe(false);
    expect(isGrey(learning)).toBe(true);
    expect(isGrey(undefined)).toBe(true);
    expect(chipText(learning)).toEqual({ label: "Learning", title: "Learning: 23 of 60 checks" });
    expect(chipText({ ...learning, state: "paused", reason: "Its 80% ranges held 60% of the time" }).label).toBe("Paused");
  });
});

describe("the part sheet's Forecast section", () => {
  it("says what to expect, in dates and words, with the quantity it is for", () => {
    render(<ForecastSection forecast={partForecastFixture({}, shown)} currency="EUR" onQuantity={vi.fn()} />);
    expect(screen.getByText(/Can be bought on 18 Dec/)).toBeTruthy();
    expect(screen.getByText("Likely (78%)")).toBeTruthy();
    expect(screen.getByText("around 14 Dec (between 2 Dec and 9 Jan 2027)")).toBeTruthy();
    expect(screen.getByText(/DigiKey back/)).toBeTruthy();
    expect(screen.getByText("(quoted 6 weeks)")).toBeTruthy();
    expect(screen.getByText(/Out everywhere within 8 weeks: Likely \(82%\)/)).toBeTruthy();
    expect(screen.getByText(/In 90 days, at its price quantity/)).toBeTruthy();
    expect((screen.getByLabelText("Quantity to forecast for") as HTMLInputElement).value).toBe("100");
    expect(screen.getAllByRole("listitem", { name: /^Week/ })).toHaveLength(12);
  });

  it("shows no Learning chip for a shown model and one for each learning line", () => {
    const { rerender } = render(<ForecastSection forecast={partForecastFixture({}, shown)} currency="EUR" onQuantity={vi.fn()} />);
    expect(screen.queryAllByText("Learning")).toHaveLength(1);
    rerender(<ForecastSection forecast={partForecastFixture({}, learning)} currency="EUR" onQuantity={vi.fn()} />);
    expect(screen.getAllByText("Learning").length).toBeGreaterThanOrEqual(4);
  });

  it("explains each line when asked why", () => {
    render(<ForecastSection forecast={partForecastFixture({}, shown)} currency="EUR" onQuantity={vi.fn()} />);
    expect(screen.getAllByText("Why").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/real waits have run 1.4 times the quote/)).toBeTruthy();
  });

  it("asks again at another quantity and refuses nonsense", () => {
    const onQuantity = vi.fn();
    render(<ForecastSection forecast={partForecastFixture({}, shown)} currency="EUR" onQuantity={onQuantity} />);
    const box = screen.getByLabelText("Quantity to forecast for") as HTMLInputElement;
    fireEvent.change(box, { target: { value: "5,000" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onQuantity).toHaveBeenCalledWith(5000);
    fireEvent.change(box, { target: { value: "0" } });
    fireEvent.blur(box);
    expect(onQuantity).toHaveBeenCalledTimes(1);
    expect(box.value).toBe("100");
  });

  it("says a part with too few readings has none yet", () => {
    render(<ForecastSection forecast={{ available: false, reason: "too_few_readings", today: "2026-11-20", models: {} }} currency="EUR" onQuantity={vi.fn()} />);
    expect(screen.getByText("Forecasts start after a week of readings.")).toBeTruthy();
    cleanup();
    render(<ForecastSection forecast={{ available: false, reason: "no_readings", today: "2026-11-20", models: {} }} currency="EUR" onQuantity={vi.fn()} />);
    expect(screen.getByText("Nothing has been read for this part yet.")).toBeTruthy();
  });

  it("says out of stock now instead of a runout", () => {
    render(<ForecastSection forecast={partForecastFixture({ out_now: true, runout: null }, shown)} currency="EUR" onQuantity={vi.fn()} />);
    expect(screen.getByText("Out of stock at every distributor now.")).toBeTruthy();
    expect(screen.queryByText(/Runs out/)).toBeNull();
  });
});
