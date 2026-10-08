import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogComponent } from "@/types/catalog";

import { ModuleConnectorsPanel } from "./library-module-interface";

const module = (patch: Partial<CatalogComponent>) => ({
  id: "cmp", kind: "module", assets: [], interface: {}, ...patch,
}) as unknown as CatalogComponent;

describe("module connectors", () => {
  it("lists each unit's pins with their signals", () => {
    render(<ModuleConnectorsPanel component={module({
      assets: [{ asset_type: "3dmodel", name: "imu.step" }] as CatalogComponent["assets"],
      interface: { units: [{ key: "A", unit: 1, name: "POWER", pins: [
        { pad: "1", name: "VIN", signal: "VIN", powerNet: true }, { pad: "2", name: "", signal: "", powerNet: false }] }] },
    })} />);
    expect(screen.getByText("POWER")).toBeTruthy();
    expect(screen.getByText("unit A")).toBeTruthy();
    expect(screen.getByText("VIN")).toBeTruthy();
    expect(screen.getByText("unnamed")).toBeTruthy();
    expect(screen.queryByText(/No STEP model/)).toBeNull();
  });

  it("says what is missing", () => {
    render(<ModuleConnectorsPanel component={module({ interface: { units: [], error: "the module has no symbol" } })} />);
    expect(screen.getByText(/the module has no symbol: attach a multi-unit symbol/)).toBeTruthy();
    expect(screen.getByText(/No STEP model yet/)).toBeTruthy();
  });
});
