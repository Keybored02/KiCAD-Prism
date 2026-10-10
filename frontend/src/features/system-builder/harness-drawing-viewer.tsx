import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fetchApi } from "@/lib/api";
import { harnessOutputUrl } from "@/lib/systems-api";
import type { SystemHarness } from "@/types/system";

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

/** The drawing as an SVG element, or null. Drops anything that could run (it is our own output, but it lands in the DOM). */
export function parseDrawing(text: string): SVGSVGElement | null {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName !== "svg" || doc.getElementsByTagName("parsererror").length) return null;
  svg.querySelectorAll("script, foreignObject").forEach((node) => node.remove());
  for (const node of [svg, ...svg.querySelectorAll("*")]) {
    for (const attr of [...node.attributes]) {
      if (attr.name.startsWith("on") || /^\s*javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
    }
  }
  return svg as unknown as SVGSVGElement;
}

/** Wire numbers an element in the drawing belongs to (``data-w="W1 W2"``). */
function numbersOf(element: Element | null): string[] {
  return element?.getAttribute("data-w")?.split(" ").filter(Boolean) ?? [];
}

/** The wires under the pointer. */
function target(event: { target: EventTarget | null }): string[] {
  return numbersOf(event.target instanceof Element ? event.target.closest("[data-w]") : null);
}

/** SB2-111 (§26.3): the harness drawing in Prism. Hover traces a wire through the bundle; click pins it. */
export function HarnessDrawingViewer({ systemId, harness, onClose }: {
  systemId: string; harness: SystemHarness; onClose: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null); // the SVG lives here, outside React's children
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState<number | null>(null); // null: fit to width
  const [hovered, setHovered] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const url = harnessOutputUrl(systemId, harness.id, "drawing.svg");

  useEffect(() => {
    let alive = true;
    setSvg(null);
    setFailed(false);
    fetchApi(url).then(async (response) => {
      if (!response.ok) throw new Error(String(response.status));
      const parsed = parseDrawing(await response.text());
      if (!parsed) throw new Error("not an SVG");
      if (alive) setSvg(parsed);
    }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [url, harness.updatedAt]);

  const size = useMemo(() => svg ? { w: Number(svg.getAttribute("width")) || 1000, h: Number(svg.getAttribute("height")) || 800 } : null, [svg]);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const node = host.current;
    if (!node || !size) return undefined;
    const measure = () => setFit(Math.min(1, Math.max(MIN_SCALE, (node.clientWidth - 2) / size.w)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [size]);
  const shown = scale ?? fit;

  useEffect(() => {
    const node = sheet.current;
    if (!node || !svg || !size) return;
    svg.setAttribute("width", String(size.w * shown));
    svg.setAttribute("height", String(size.h * shown));
    if (svg.parentNode !== node) node.replaceChildren(svg);
  }, [svg, size, shown]);

  const traced = pinned.length ? pinned : hovered;
  useEffect(() => {
    const node = host.current;
    if (!node || !svg) return;
    const wanted = new Set(traced);
    node.classList.toggle("tracing", wanted.size > 0);
    node.querySelectorAll("[data-w]").forEach((element) => {
      element.toggleAttribute("data-on", numbersOf(element).some((n) => wanted.has(n)));
    });
  }, [svg, traced]);

  const wireIds = useMemo(() => {
    const ids = new Map<string, string>();
    svg?.querySelectorAll("[data-wire]").forEach((g) => ids.set(g.getAttribute("data-w") ?? "", g.getAttribute("data-wire") ?? ""));
    return ids;
  }, [svg]);
  const ends = useMemo(() => new Map(harness.ends.map((end, i) => [end.id, end.mates?.port?.reference ?? `End ${i + 1}`])), [harness.ends]);
  const status = useMemo(() => {
    if (traced.length !== 1) return traced.length ? `${traced.length} wires` : null;
    const wire = harness.wires.find((w) => w.id === wireIds.get(traced[0]));
    if (!wire) return traced[0];
    return [traced[0], `${ends.get(wire.from.end)} : ${wire.from.pin} → ${ends.get(wire.to.end)} : ${wire.to.pin}`,
      wire.signal, wire.gaugeAwg ? `${wire.gaugeAwg} AWG` : null, wire.colour].filter(Boolean).join(" · ");
  }, [traced, harness.wires, wireIds, ends]);

  const zoom = useCallback((factor: number) =>
    setScale((current) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, (current ?? fit) * factor))), [fit]);

  useEffect(() => {
    const node = host.current;
    if (!node) return undefined;
    const onWheel = (event: WheelEvent) => { // ctrl/⌘ + wheel zooms the drawing, not the page
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [zoom, svg]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col gap-2 p-3 sm:max-w-[96vw]"
        onEscapeKeyDown={(event) => { if (pinned.length) { event.preventDefault(); setPinned([]); } }}>
        <div className="flex min-w-0 items-center gap-1 pr-8">
          <DialogTitle className="mr-2 truncate text-sm font-semibold">{harness.name}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Zoom out" aria-label="Zoom out" onClick={() => zoom(1 / 1.25)}>
            <Minus className="h-4 w-4" aria-hidden />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums">{Math.round(shown * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Zoom in" aria-label="Zoom in" onClick={() => zoom(1.25)}>
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" aria-pressed={scale === null} onClick={() => setScale(null)}>Fit</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" title="Actual size" aria-pressed={scale === 1} onClick={() => setScale(1)}>1:1</Button>
          <span className="ml-2 min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground" aria-live="polite">{status}</span>
          <a href={url} download title="Download SVG" aria-label="Download SVG"
            className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-accent"><Download className="h-4 w-4" aria-hidden /></a>
        </div>
        <div ref={host} role="img" aria-label={`${harness.name} drawing`} data-testid="harness-drawing"
          className="min-h-0 flex-1 overflow-auto rounded border bg-white [&.tracing_[data-w]:not([data-on])]:opacity-15 [&_[data-w]]:transition-opacity"
          onPointerOver={(event) => {
            const next = target(event);
            setHovered((current) => (current.join() === next.join() ? current : next));
          }}
          onPointerLeave={() => setHovered([])}
          onKeyDown={(event) => { if (event.key === "Escape") setPinned([]); }}
          onClick={(event) => {
            const next = target(event);
            setPinned((current) => (next.length && current.join() !== next.join() ? next : []));
          }}
          >
          {!svg && <p className="p-4 text-sm text-muted-foreground">{failed ? "Could not load the drawing" : "Loading…"}</p>}
          <div ref={sheet} className="w-max" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
