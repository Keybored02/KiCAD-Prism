import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreateModuleDialog, draftsInterface, parsePins, pinsText } from "./library-module-interface";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("module pins", () => {
  it("reads pad, name, signal and power from pasted rows", () => {
    const { pins, errors } = parsePins("1, VIN, VIN, power\n2\tGND\tGND\tyes\n\n# spare\n3, NC\n4, TX, UART_TX");
    expect(errors).toEqual([]);
    expect(pins).toEqual([
      { pad: "1", name: "VIN", signal: "VIN", powerNet: true },
      { pad: "2", name: "GND", signal: "GND", powerNet: true },
      { pad: "3", name: "NC", signal: "", powerNet: false },
      { pad: "4", name: "TX", signal: "UART_TX", powerNet: false },
    ]);
    expect(parsePins(pinsText(pins)).pins).toEqual(pins);
  });

  it("names the line with a missing or repeated pad", () => {
    expect(parsePins(", VIN").errors).toEqual(["Line 1: a pad is required"]);
    expect(parsePins("1, A\n1, B").errors).toEqual(["Line 2: pad 1 appears twice"]);
  });

  it("builds the interface or says what is missing", () => {
    expect(draftsInterface([])).toEqual({ error: "Add at least one connector." });
    expect(draftsInterface([{ key: "J 1", name: "", description: "", pinsText: "1" }])).toHaveProperty("error");
    expect(draftsInterface([{ key: "J1", name: "", description: "", pinsText: "" }])).toEqual({ error: "J1: list its pins." });
    const twice = { key: "J1", name: "", description: "", pinsText: "1" };
    expect(draftsInterface([twice, twice])).toEqual({ error: "Connector key J1 appears twice." });
    expect(draftsInterface([{ key: "J1", name: "", description: "d", pinsText: "1, A, SIG" }])).toEqual({
      units: [{ key: "J1", name: "J1", description: "d", pins: [{ pad: "1", name: "A", signal: "SIG", powerNet: false }] }],
    });
  });
});

describe("new module dialog", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts the identity and connectors, then opens the module", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ componentId: "cmp_1", revisionId: "rev_1" }), { status: 201, headers: { "Content-Type": "application/json" } }));
    const onCreated = vi.fn();
    render(<CreateModuleDialog open onOpenChange={() => {}} onCreated={onCreated} />);
    const create = screen.getByRole("button", { name: /Create module/ });
    expect((create as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("IPN"), { target: { value: "MOD-1" } });
    fireEvent.change(screen.getByLabelText("Manufacturer"), { target: { value: "Example" } });
    fireEvent.change(screen.getByLabelText("Datasheet or ICD URL"), { target: { value: "https://example.com/m.pdf" } });
    fireEvent.change(screen.getByLabelText(/Pins: pad, name, signal, power/), { target: { value: "1, VIN, VIN, power\n2, GND, GND, power" } });
    expect((create as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(create);
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("cmp_1"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/catalog/modules");
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.ipn).toBe("MOD-1");
    expect(body.interface.units[0].pins).toHaveLength(2);
  });
});
