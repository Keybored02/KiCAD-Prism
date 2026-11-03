import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { PanelApp } from "./PanelApp";
import { uninstallBridge } from "./lib/kicad-bridge";
import type { PanelComponent } from "./lib/panel-api";

vi.mock("./lib/panel-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("./lib/panel-api")>(),
  getCategories: vi.fn(async () => []),
}));
vi.mock("./screens/SymbolFinderScreen", () => ({
  SymbolFinderScreen: ({ onSelectComponent, onSelectCategory }: {
    onSelectComponent: (component: PanelComponent) => void;
    onSelectCategory: (name: string) => void;
  }) => (
    <div>
      Finder
      <button type="button" onClick={() => onSelectComponent({ id: "c1" } as PanelComponent)}>open part</button>
      <button type="button" onClick={() => onSelectCategory("Resistors")}>open category</button>
    </div>
  ),
}));
vi.mock("./screens/CategoryListScreen", () => ({
  CategoryListScreen: ({ category }: { category: string }) => <div>Category {category}</div>,
}));
vi.mock("./screens/PartDetailScreen", () => ({
  PartDetailScreen: ({ componentId }: { componentId: string }) => <div>Detail {componentId}</div>,
}));

const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/remote-provider/panel");
});

afterEach(() => {
  cleanup();
  uninstallBridge();
});

it("starts at the finder with nothing to go back or forward to", async () => {
  render(<PanelApp />);
  await screen.findByText("Finder");
  expect(button("Back").disabled).toBe(true);
  expect(button("Forward").disabled).toBe(true);
  expect(button("Home").disabled).toBe(true);
});

it("goes back and forward through the screens the user visited", async () => {
  render(<PanelApp />);
  await screen.findByText("Finder");

  fireEvent.click(button("open category"));
  await screen.findByText("Category Resistors");
  fireEvent.click(button("Home"));
  await screen.findByText("Finder");
  fireEvent.click(button("open part"));
  await screen.findByText("Detail c1");
  expect(button("Back").disabled).toBe(false);
  expect(button("Forward").disabled).toBe(true);

  fireEvent.click(button("Back"));
  await screen.findByText("Finder");
  expect(button("Forward").disabled).toBe(false);
  fireEvent.click(button("Back"));
  await screen.findByText("Category Resistors");
  fireEvent.click(button("Back"));
  await screen.findByText("Finder");
  expect(button("Back").disabled).toBe(true);

  fireEvent.click(button("Forward"));
  await screen.findByText("Category Resistors");
});

it("drops what was ahead when the user goes somewhere new", async () => {
  render(<PanelApp />);
  await screen.findByText("Finder");
  fireEvent.click(button("open part"));
  await screen.findByText("Detail c1");
  fireEvent.click(button("Back"));
  await screen.findByText("Finder");
  fireEvent.click(button("open category"));
  await screen.findByText("Category Resistors");
  expect(button("Forward").disabled).toBe(true);
});

it("comes back to where it was after a reload", async () => {
  const first = render(<PanelApp />);
  await screen.findByText("Finder");
  fireEvent.click(button("open part"));
  await screen.findByText("Detail c1");
  first.unmount();

  render(<PanelApp />);
  expect(await screen.findByText("Detail c1")).toBeTruthy();
  await waitFor(() => expect(button("Back").disabled).toBe(false));
});

it("puts the finder behind a part named in the address", async () => {
  window.history.replaceState(null, "", "/remote-provider/panel?component=cmp-7");
  render(<PanelApp />);
  await screen.findByText("Detail cmp-7");
  fireEvent.click(button("Back"));
  await screen.findByText("Finder");
});
