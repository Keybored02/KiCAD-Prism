import { describe, expect, it } from "vitest";

import type { FabricationLayer, LayerRole, LayerSide } from "./types";
import { focusedOn, initialState, presetFor, sideOf, viewerReducer } from "./viewer-state";

function layer(id: string, role: LayerRole, side: LayerSide, file = `${id}.gbr`): FabricationLayer {
    return {
        id, name: id, function: "", role, side, colour: "#fff", file,
        kind: role === "drill" ? "excellon" : "gerber", warnings: [],
    };
}

const LAYERS = [
    layer("f.silk", "silk", "top"),
    layer("f.mask", "mask", "top"),
    layer("f.cu", "copper", "top"),
    layer("in1.cu", "copper", "inner"),
    layer("b.cu", "copper", "bottom"),
    layer("b.silk", "silk", "bottom"),
    layer("edge", "outline", "both"),
    layer("drill", "drill", "both", "board.drl"),
    layer("f.fab", "other", "top"),
];

describe("presetFor", () => {
    it("shows a side's copper and legend, the profile and the holes", () => {
        expect([...presetFor(LAYERS, "top")].sort()).toEqual(["drill", "edge", "f.cu", "f.silk"]);
        expect([...presetFor(LAYERS, "bottom")].sort()).toEqual(["b.cu", "b.silk", "drill", "edge"]);
    });

    it("leaves mask, paste, inner copper and other layers off", () => {
        const top = presetFor(LAYERS, "top");
        for (const id of ["f.mask", "in1.cu", "f.fab"]) expect(top.has(id)).toBe(false);
    });
});

describe("focusedOn", () => {
    it("is the one file plus the profile", () => {
        expect([...focusedOn(LAYERS, "f.mask.gbr")].sort()).toEqual(["edge", "f.mask"]);
    });

    it("is empty for a file the package does not hold", () => {
        expect(focusedOn(LAYERS, "missing.gbr").size).toBe(0);
    });
});

describe("sideOf", () => {
    it("defaults to top", () => {
        expect(sideOf(LAYERS)).toBe("top");
    });

    it("opens on the side of a focused bottom file", () => {
        expect(sideOf(LAYERS, "b.silk.gbr")).toBe("bottom");
    });

    it("opens a bottom-only package on the bottom", () => {
        expect(sideOf([layer("b.cu", "copper", "bottom")])).toBe("bottom");
    });
});

describe("initialState", () => {
    it("uses the preset when nothing is focused", () => {
        expect([...initialState(LAYERS).visible].sort()).toEqual(["drill", "edge", "f.cu", "f.silk"]);
    });

    it("falls back to the preset when the focused file is unknown", () => {
        expect(initialState(LAYERS, "missing.gbr").visible.has("f.cu")).toBe(true);
    });

    it("shows only the focused layer and the profile", () => {
        const state = initialState(LAYERS, "b.silk.gbr");
        expect(state.side).toBe("bottom");
        expect([...state.visible].sort()).toEqual(["b.silk", "edge"]);
    });
});

describe("viewerReducer", () => {
    const start = initialState(LAYERS);

    it("flipping the side restarts from that side's preset", () => {
        const next = viewerReducer(start, { type: "side", side: "bottom", layers: LAYERS });
        expect(next.side).toBe("bottom");
        expect(next.visible.has("b.cu")).toBe(true);
        expect(next.visible.has("f.cu")).toBe(false);
    });

    it("keeps manual choices when the side does not change", () => {
        const toggled = viewerReducer(start, { type: "toggle", id: "f.mask" });
        const same = viewerReducer(toggled, { type: "side", side: "top", layers: LAYERS });
        expect(same).toBe(toggled);
        expect(same.visible.has("f.mask")).toBe(true);
    });

    it("toggles a layer on and off without mutating the old state", () => {
        const on = viewerReducer(start, { type: "toggle", id: "f.mask" });
        const off = viewerReducer(on, { type: "toggle", id: "f.mask" });
        expect(on.visible.has("f.mask")).toBe(true);
        expect(off.visible.has("f.mask")).toBe(false);
        expect(start.visible.has("f.mask")).toBe(false);
    });

    it("all, none and preset replace the selection", () => {
        const all = viewerReducer(start, { type: "all", layers: LAYERS });
        expect(all.visible.size).toBe(LAYERS.length);
        const none = viewerReducer(all, { type: "none" });
        expect(none.visible.size).toBe(0);
        const back = viewerReducer(none, { type: "preset", layers: LAYERS });
        expect([...back.visible].sort()).toEqual([...start.visible].sort());
    });
});
