import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./tracking-api", () => ({ readProjectBom: vi.fn() }));

import { ProjectReadNow } from "./project-read-now";
import * as tracking from "./tracking-api";

const read = vi.mocked(tracking.readProjectBom);

beforeEach(() => {
  vi.useFakeTimers();
  read.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("reading a project's BOM now", () => {
  it("reloads the tab when the BOM is read at once", async () => {
    read.mockResolvedValue({ status: "updated" });
    const onRead = vi.fn();
    render(<ProjectReadNow projectId="prj" onRead={onRead} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Read now" })); });
    expect(read).toHaveBeenCalledWith("prj");
    expect(onRead).toHaveBeenCalledTimes(1);
  });

  it("shows the wait while the index builds, and reloads when it lands", async () => {
    read.mockResolvedValueOnce({ status: "reading" }).mockResolvedValueOnce({ status: "reading" }).mockResolvedValue({ status: "unchanged" });
    const onRead = vi.fn();
    render(<ProjectReadNow projectId="prj" onRead={onRead} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Read now" })); });
    expect(screen.getByRole("status").textContent).toBe("Reading · 0:00");
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole("status").textContent).toBe("Reading · 0:05");
    expect(onRead).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(onRead).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Read now" })).toBeTruthy();
  });

  it("offers Read now again when the read fails", async () => {
    read.mockRejectedValue(new Error("Could not read the project's BOM"));
    render(<ProjectReadNow projectId="prj" onRead={vi.fn()} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Read now" })); });
    expect(screen.getByRole("button", { name: "Read now" })).toBeTruthy();
  });
});
