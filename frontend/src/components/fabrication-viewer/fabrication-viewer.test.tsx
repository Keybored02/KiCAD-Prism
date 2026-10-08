import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FabricationViewer } from "./fabrication-viewer";
import { buildSource, isLayerName, outputsSource } from "./sources";
import type { FabricationLayer, FabricationView } from "./types";

const apiMock = vi.hoisted(() => ({
    fetchJson: vi.fn(),
    fetchApi: vi.fn(),
    readApiError: vi.fn(async () => "layer failed"),
    ApiHttpError: class ApiHttpError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    },
}));
vi.mock("@/lib/api", () => apiMock);

function layer(partial: Partial<FabricationLayer> & Pick<FabricationLayer, "id" | "role" | "side">): FabricationLayer {
    return {
        name: partial.id.toUpperCase(),
        function: "",
        colour: "#e0a030",
        file: `${partial.id}.gbr`,
        kind: partial.role === "drill" ? "excellon" : "gerber",
        warnings: [],
        ...partial,
    };
}

const VIEW: FabricationView = {
    present: true,
    bounds: [0, -10, 20, 0],
    board: [0, -10, 20, 0],
    size: { width: 20, height: 10 },
    copperLayers: 2,
    layers: [
        layer({ id: "f.silk", role: "silk", side: "top" }),
        layer({ id: "f.mask", role: "mask", side: "top" }),
        layer({ id: "f.cu", role: "copper", side: "top" }),
        layer({ id: "b.cu", role: "copper", side: "bottom" }),
        layer({ id: "edge", role: "outline", side: "both" }),
        layer({ id: "drill", role: "drill", side: "both", file: "board.drl" }),
    ],
    drill: {
        tools: [
            { diameter: 0.3, plated: true, function: "Plated,PTH,ViaDrill", hits: 2, slots: 0, file: "board.drl" },
            { diameter: 3.2, plated: false, function: "NonPlated,NPTH,ComponentDrill", hits: 1, slots: 0, file: "board.drl" },
        ],
        holes: 3,
        slots: 0,
        smallest: 0.3,
    },
};

const SOURCE = buildSource("p1", "b1");

/** Layer ids the viewer has asked the API for, in order. */
function requestedLayers(): string[] {
    return apiMock.fetchApi.mock.calls.map(([url]) =>
        String(url).split("/layers/")[1].replace(".svg", ""),
    );
}

class ImmediateResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe() {
        this.callback(
            [{ contentRect: { width: 800, height: 600 } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
        );
    }
    unobserve() {}
    disconnect() {}
}

beforeEach(() => {
    // Most packages have no position file; the placement tests below say otherwise.
    apiMock.fetchJson.mockImplementation(async (url: string) => {
        if (String(url).includes("/placement")) {
            throw new apiMock.ApiHttpError(404, "This build has no position file");
        }
        return VIEW;
    });
    apiMock.fetchApi.mockImplementation(async () => ({
        ok: true,
        blob: async () => new Blob(["<svg/>"], { type: "image/svg+xml" }),
    }));
    vi.stubGlobal("ResizeObserver", ImmediateResizeObserver);
    let counter = 0;
    URL.createObjectURL = vi.fn(() => `blob:layer-${counter++}`);
    URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

async function openViewer(focusFile?: string) {
    const view = render(<FabricationViewer source={SOURCE} focusFile={focusFile} />);
    await screen.findByText(/20\.0 x 10\.0 mm/);
    return view;
}

describe("FabricationViewer", () => {
    it("summarises the package", async () => {
        await openViewer();
        expect(screen.getByText(/2 copper layers/)).toBeInTheDocument();
        expect(screen.getByText(/3 holes/)).toBeInTheDocument();
    });

    it("draws the default layers and leaves mask off", async () => {
        await openViewer();
        await waitFor(() => expect(requestedLayers().sort()).toEqual(["drill", "edge", "f.cu", "f.silk"]));
        expect(screen.getByLabelText("F.MASK")).not.toBeChecked();
        expect(screen.getByLabelText("F.CU")).toBeChecked();
        await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(4));
    });

    it("fetches a layer the first time it is shown, and only then", async () => {
        await openViewer();
        await waitFor(() => expect(requestedLayers()).toHaveLength(4));

        fireEvent.click(screen.getByLabelText("F.MASK"));
        await waitFor(() => expect(requestedLayers()).toHaveLength(5));
        expect(requestedLayers()).toContain("f.mask");

        fireEvent.click(screen.getByLabelText("F.MASK"));
        fireEvent.click(screen.getByLabelText("F.MASK"));
        await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(5));
        expect(requestedLayers()).toHaveLength(5);
    });

    it("hides a layer without dropping the others", async () => {
        await openViewer();
        await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(4));
        fireEvent.click(screen.getByLabelText("F.SILK"));
        await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(3));
        expect(screen.queryByAltText("F.SILK")).not.toBeInTheDocument();
    });

    it("turns the board over: bottom layers, mirrored", async () => {
        await openViewer();
        const pane = screen.getByTestId("board-pane");
        expect(pane.firstElementChild).not.toHaveStyle({ transform: "scaleX(-1)" });

        fireEvent.click(screen.getByRole("button", { name: "Bottom" }));
        await waitFor(() => expect(requestedLayers()).toContain("b.cu"));
        expect(screen.getByLabelText("B.CU")).toBeChecked();
        expect(screen.getByLabelText("F.CU")).not.toBeChecked();
        expect(pane.firstElementChild).toHaveStyle({ transform: "scaleX(-1)" });
        expect(screen.getByRole("button", { name: "Bottom" })).toHaveAttribute("aria-pressed", "true");
    });

    it("None clears the board and Default restores it", async () => {
        await openViewer();
        fireEvent.click(screen.getByRole("button", { name: "None" }));
        expect(await screen.findByText("No layers shown")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Default" }));
        expect(screen.getByLabelText("F.CU")).toBeChecked();
    });

    it("opens on one file when asked to", async () => {
        await openViewer("f.mask.gbr");
        await waitFor(() => expect(requestedLayers().sort()).toEqual(["edge", "f.mask"]));
        expect(screen.getByLabelText("F.MASK")).toBeChecked();
        expect(screen.getByLabelText("F.CU")).not.toBeChecked();
    });

    it("lists the drill tools", async () => {
        await openViewer();
        fireEvent.mouseDown(screen.getByRole("tab", { name: /Drill/ }), { button: 0 });
        const table = await screen.findByRole("table");
        expect(within(table).getByText("0.3 mm")).toBeInTheDocument();
        expect(within(table).getByText("Plated")).toBeInTheDocument();
        expect(within(table).getByText("Non-plated")).toBeInTheDocument();
        expect(within(table).getByText("Via")).toBeInTheDocument();
        expect(screen.getByText(/smallest 0\.3 mm/)).toBeInTheDocument();
    });

    it("says so when a layer cannot be loaded", async () => {
        apiMock.fetchApi.mockImplementation(async (url: string) =>
            String(url).includes("/f.cu.svg") ? { ok: false, status: 500 } : { ok: true, blob: async () => new Blob(["<svg/>"]) },
        );
        await openViewer();
        expect(await screen.findByRole("alert")).toHaveTextContent("Could not load F.CU");
    });

    it("shows the failure when the package cannot be loaded", async () => {
        apiMock.fetchJson.mockRejectedValue(new Error("This build has no fabrication files"));
        render(<FabricationViewer source={SOURCE} />);
        expect(await screen.findByRole("alert")).toHaveTextContent("This build has no fabrication files");
    });

    it("revokes the layer URLs when it goes away", async () => {
        const { unmount } = await openViewer();
        await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(4));
        unmount();
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(4);
    });
});

describe("buildSource", () => {
    it("addresses a build's package and its layers", () => {
        expect(SOURCE.viewUrl).toBe("/api/projects/p1/release-studio/builds/b1/fabrication-view");
        expect(SOURCE.layerUrl("f.cu")).toBe(
            "/api/projects/p1/release-studio/builds/b1/fabrication-view/layers/f.cu.svg",
        );
    });
});

describe("outputsSource", () => {
    it("addresses a committed folder and its layers with the same query", () => {
        const source = outputsSource("p 1", "manufacturing", "gerbers/rev b", "a".repeat(40));
        const query = `type=manufacturing&folder=gerbers%2Frev+b&commit=${"a".repeat(40)}`;
        expect(source.viewUrl).toBe(`/api/projects/p%201/fabrication-view?${query}`);
        expect(source.layerUrl("f.cu")).toBe(`/api/projects/p%201/fabrication-view/layers/f.cu.svg?${query}`);
    });

    it("leaves the commit out for the working tree, and keys each target apart", () => {
        const working = outputsSource("p1", "design", "");
        expect(working.viewUrl).toBe("/api/projects/p1/fabrication-view?type=design&folder=");
        expect(working.key).not.toBe(outputsSource("p1", "design", "x").key);
        expect(working.key).not.toBe(outputsSource("p1", "design", "", "b".repeat(40)).key);
    });
});

describe("isLayerName", () => {
    it("knows KiCad's Gerber and drill extensions", () => {
        for (const name of ["a-F_Cu.gtl", "a-B_Cu.gbl", "a-Edge_Cuts.gm1", "a-In1_Cu.g1", "a.gbr", "a.drl", "A.GTO", "a.xln"]) {
            expect(isLayerName(name), name).toBe(true);
        }
    });

    it("leaves other files alone, including the job file and look-alikes", () => {
        for (const name of ["a-job.gbrjob", "logo.gif", "repo.git", "notes.pdf", "bom.csv", "gerber"]) {
            expect(isLayerName(name), name).toBe(false);
        }
    });
});
