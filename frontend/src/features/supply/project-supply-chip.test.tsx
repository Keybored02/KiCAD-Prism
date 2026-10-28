import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { buildAnswerText, ProjectSupplyChip } from "./project-supply-chip";

const answer = { boards: 247, build_quantity: 10, short: 0, unchecked: 0, test_data: false };
afterEach(cleanup);

describe("a project card's build answer", () => {
  it("says buildable, short or unconfirmed in fixed words", () => {
    expect(buildAnswerText(answer)).toEqual({ text: "Buildable 247", tone: "good" });
    expect(buildAnswerText({ ...answer, short: 2 })).toEqual({ text: "Short · 2 parts", tone: "bad" });
    expect(buildAnswerText({ ...answer, short: 1 }).text).toBe("Short · 1 part");
    expect(buildAnswerText({ ...answer, short: 2, unchecked: 1 }).text).toBe("Unconfirmed");
    expect(buildAnswerText({ ...answer, boards: null }).text).toBe("Unconfirmed");
  });

  it("marks test data and draws nothing for an untracked project", () => {
    const { container, rerender } = render(<ProjectSupplyChip answer={{ ...answer, test_data: true }} />);
    expect(container.textContent).toBe("Buildable 247 · Test data");
    rerender(<ProjectSupplyChip answer={undefined} />);
    expect(container.textContent).toBe("");
  });
});
