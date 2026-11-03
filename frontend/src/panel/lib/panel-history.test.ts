import { afterEach, describe, expect, it } from "vitest";

import {
  entryState,
  leavingForPrismPage,
  openedFromPanel,
  readEntry,
  readTop,
  recalledComponent,
  rememberComponent,
  writeTop,
} from "./panel-history";
import type { PanelComponent } from "./panel-api";

afterEach(() => window.sessionStorage.clear());

describe("panel history entries", () => {
  it("reads back what it wrote", () => {
    for (const place of [
      { kind: "finder" },
      { kind: "category", name: "Resistors" },
      { kind: "detail", componentId: "c1" },
    ] as const) {
      expect(readEntry(entryState({ place, idx: 3 }))).toEqual({ place, idx: 3 });
    }
  });

  it("ignores state it did not write, or that was damaged", () => {
    for (const state of [
      null,
      undefined,
      "x",
      {},
      { prismPanel: null },
      { prismPanel: { place: { kind: "nowhere" }, idx: 0 } },
      { prismPanel: { place: { kind: "detail", componentId: "" }, idx: 0 } },
      { prismPanel: { place: { kind: "finder" }, idx: -1 } },
      { prismPanel: { place: { kind: "finder" }, idx: 1.5 } },
      { prismPanel: { place: { kind: "finder" }, idx: "1" } },
    ]) {
      expect(readEntry(state)).toBeNull();
    }
  });
});

describe("the furthest entry", () => {
  it("is kept for the session", () => {
    writeTop(4);
    expect(readTop()).toBe(4);
  });

  it("falls back to memory when storage is refused", () => {
    writeTop(2);
    const refuse = () => {
      throw new Error("blocked");
    };
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage")!;
    Object.defineProperty(window, "sessionStorage", { configurable: true, get: refuse });
    try {
      writeTop(5);
      expect(readTop()).toBe(5);
    } finally {
      Object.defineProperty(window, "sessionStorage", original);
    }
  });
});

describe("leaving for a Prism page", () => {
  it("marks the address as opened from the panel, keeping what it had", () => {
    expect(openedFromPanel("https://prism.test/?section=supply&part=p1")).toBe("https://prism.test/?section=supply&part=p1&back=1");
    expect(openedFromPanel("https://prism.test/?back=0")).toBe("https://prism.test/?back=1");
    expect(openedFromPanel("not a url")).toBe("not a url");
  });

  it("makes the page the entry ahead of this one, so Forward reaches it", () => {
    window.history.replaceState(entryState({ place: { kind: "finder" }, idx: 2 }), "");
    writeTop(2);
    leavingForPrismPage();
    expect(readTop()).toBe(3);
  });

  it("does nothing from a state the panel did not write", () => {
    window.history.replaceState(null, "");
    writeTop(2);
    leavingForPrismPage();
    expect(readTop()).toBe(2);
  });
});

describe("remembered list rows", () => {
  it("serves a row seen earlier and nothing for a stranger", () => {
    const row = { id: "c1", name: "R" } as PanelComponent;
    rememberComponent(row);
    expect(recalledComponent("c1")).toBe(row);
    expect(recalledComponent("other")).toBeNull();
  });
});
