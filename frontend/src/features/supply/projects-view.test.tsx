import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/types/auth";
import { partRowFixture } from "./supply-test-fixtures";

vi.mock("./part-sheet", () => ({ PartSheet: () => null }));
vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listSupplyPartGroups: vi.fn(),
  listSupplyParts: vi.fn(),
}));

import * as api from "./supply-api";
import { ProjectsView } from "./projects-view";

const mocked = vi.mocked(api);
const designer: User = { name: "Dee", email: "dee@example.com", role: "designer" };

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});
afterEach(cleanup);

describe("the projects tab", () => {
  it("lists the projects closed, tracked first, and loads a project's parts when it is opened", async () => {
    mocked.listSupplyPartGroups.mockResolvedValue({
      groups: [
        { project_id: "prj_1", project_name: "Power board", tracked: true, count: 3, statuses: { error: 1, ok: 2 } },
        { project_id: "none", project_name: "Not in a project", tracked: false, count: 1, statuses: { ok: 1 } },
      ],
      total: 4,
    });
    mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture({ mpn: "LM324" })], total: 3, limit: 50 });
    render(<MemoryRouter><ProjectsView user={designer} /></MemoryRouter>);
    const power = await screen.findByRole("button", { name: /Power board/ });
    expect(within(power).getByText("Tracked")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Not in a project/ }), "parts in no project belong to the Parts tab").toBeNull();
    expect(mocked.listSupplyParts).not.toHaveBeenCalled();
    fireEvent.click(power);
    expect(await screen.findByRole("button", { name: "LM324" })).toBeTruthy();
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("in_use", "", expect.anything(), "", 0, 50, "prj_1");
  });

  it("says so when no project uses a part", async () => {
    mocked.listSupplyPartGroups.mockResolvedValue({ groups: [], total: 0 });
    render(<MemoryRouter><ProjectsView user={designer} /></MemoryRouter>);
    expect(await screen.findByText("No project uses a part Prism knows yet")).toBeTruthy();
  });
});
