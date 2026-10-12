import { describe, expect, it, vi } from "vitest";

import { supplyCommands } from "./command-palette-supply";

describe("the Supply entries of the command palette", () => {
  it("go to each Supply view for roles that may open it", () => {
    const goTo = vi.fn((params: string) => () => params);
    const commands = supplyCommands("designer", goTo);
    expect(commands.map((command) => command.label)).toEqual(["Supply: Overview", "Supply: Parts", "Supply: Inbox", "Supply: Review", "Supply: Market", "Supply: Planning"]);
    expect(goTo).toHaveBeenCalledWith("?section=supply&supplyView=parts");
  });

  it("are absent for a viewer or a signed-out user", () => {
    expect(supplyCommands("viewer", vi.fn())).toEqual([]);
    expect(supplyCommands(undefined, vi.fn())).toEqual([]);
  });
});
