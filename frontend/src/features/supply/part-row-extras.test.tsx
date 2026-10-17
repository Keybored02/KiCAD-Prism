import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DistributorSquares, PriceMove, ProjectNames, RateAndLead, RowFlags } from "./part-row-extras";
import { partRowFixture } from "./supply-test-fixtures";

afterEach(cleanup);

describe("what a part row shows at a glance", () => {
  it("names the first two projects and counts the rest", () => {
    render(<ProjectNames part={partRowFixture({ used_in: 5, project_names: ["Power board", "Sensor"] })} />);
    expect(screen.getByText("Power board, Sensor +3")).toBeTruthy();
  });

  it("draws a square per distributor, filled with stock and hollow without, rings the preferred one and opens a card on hover", async () => {
    render(<DistributorSquares part={partRowFixture({
      preferred_connector_id: "c2",
      distributors: [
        { connector_id: "c1", provider: "digikey", name: "DigiKey", stock: 120 },
        { connector_id: "c2", provider: "mouser", name: "Mouser", stock: 0, price: "0.31", currency: "EUR" },
      ],
    })} />);
    expect(screen.getByRole("button", { name: "DigiKey: 120 in stock" }).getAttribute("style")).toContain("background-color");
    const mouser = screen.getByRole("button", { name: "Mouser: none in stock, preferred" });
    expect(mouser.className).toContain("ring-2");
    expect(mouser.getAttribute("style")).toContain("transparent");
    fireEvent.mouseEnter(mouser);
    expect(await screen.findByText("None in stock")).toBeTruthy();
  });

  it("shows the price move, the rate with the lead time, and the flags", () => {
    render(<>
      <PriceMove percent={4} />
      <PriceMove percent={null} />
      <RateAndLead part={partRowFixture({ tracking: { tier: 1, rate: "daily" }, lead_days: 84 })} />
      <RowFlags flags={["waiting", "rohs"]} />
    </>);
    expect(screen.getByText("4%")).toBeTruthy();
    expect(screen.getByText("Daily")).toBeTruthy();
    expect(screen.getByText("12 w")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Waiting for room to be read" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "A distributor says it is not RoHS compliant" })).toBeTruthy();
  });
});
