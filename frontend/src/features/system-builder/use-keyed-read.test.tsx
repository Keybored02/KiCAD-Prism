import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { invalidateReads, resetReads, useKeyedRead } from "./use-keyed-read";

afterEach(() => resetReads());

function Reader({ name, readKey, fetcher }: { name: string; readKey: string | null; fetcher: () => Promise<string> }) {
  const { data } = useKeyedRead(readKey, fetcher);
  return <span data-testid={name}>{data ?? "…"}</span>;
}

describe("useKeyedRead (SB2-98)", () => {
  it("shares one request between components asking for the same key", async () => {
    const fetcher = vi.fn(async () => "v1");
    render(<><Reader name="a" readKey="repository:s" fetcher={fetcher} /><Reader name="b" readKey="repository:s" fetcher={fetcher} /></>);
    await waitFor(() => expect(screen.getByTestId("b").textContent).toBe("v1"));
    expect(screen.getByTestId("a").textContent).toBe("v1");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("re-reads after invalidation and keeps the old value shown meanwhile", async () => {
    let release: (value: string) => void = () => undefined;
    const fetcher = vi.fn()
      .mockResolvedValueOnce("v1")
      .mockImplementationOnce(() => new Promise<string>((resolve) => { release = resolve; }));
    render(<Reader name="a" readKey="repository:s" fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByTestId("a").textContent).toBe("v1"));
    act(() => invalidateReads("repository:"));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId("a").textContent).toBe("v1");
    await act(async () => release("v2"));
    expect(screen.getByTestId("a").textContent).toBe("v2");
  });

  it("leaves other prefixes alone and reads nothing for a null key", async () => {
    const other = vi.fn(async () => "x");
    const none = vi.fn(async () => "never");
    render(<><Reader name="a" readKey="scene:s" fetcher={other} /><Reader name="b" readKey={null} fetcher={none} /></>);
    await waitFor(() => expect(screen.getByTestId("a").textContent).toBe("x"));
    act(() => invalidateReads("repository:"));
    await act(async () => undefined);
    expect(other).toHaveBeenCalledTimes(1);
    expect(none).not.toHaveBeenCalled();
  });

  it("forgets a key nothing reads any more, so it is read afresh next time", async () => {
    const fetcher = vi.fn(async () => "v");
    const view = render(<Reader name="a" readKey="repository:s" fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByTestId("a").textContent).toBe("v"));
    view.unmount();
    render(<Reader name="a" readKey="repository:s" fetcher={fetcher} />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
