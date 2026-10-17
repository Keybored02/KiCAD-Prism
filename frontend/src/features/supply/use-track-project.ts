import { useEffect, useMemo, useState } from "react";

import type { ProjectTrackingState, SupplyConnector, TrackingPreview } from "@/types/supply";
import type { ProjectPackaging } from "./track-choose-step";
import { getAssessmentSettings, listSupplyConnectors } from "./supply-api";
import { getProjectTracking, previewTrackProject, readProjectBom } from "./tracking-api";

const READ_POLL_MS = 5000;
const READ_POLLS = 60;

/** What the track dialog works from: the project's state, the distributors, the choices, and the cost of the choices. */
export function useTrackProject(projectId: string) {
  const [state, setState] = useState<ProjectTrackingState | null>(null);
  const [connectors, setConnectors] = useState<SupplyConnector[]>([]);
  const [variants, setVariants] = useState<string[]>([""]);
  const [allVariants, setAllVariants] = useState(false);
  const [packaging, setPackaging] = useState<ProjectPackaging>("cut_tape");
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<TrackingPreview | null>(null);
  const [error, setError] = useState("");
  const [again, setAgain] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getProjectTracking(projectId, controller.signal), listSupplyConnectors(controller.signal)])
      .then(([tracking, list]) => {
        setState(tracking);
        setConnectors(list.filter((item) => item.enabled && item.metered));
        if (tracking.tracked) {
          setVariants(tracking.tracked.variants);
          setAllVariants(tracking.tracked.all_variants);
          setChosen(tracking.tracked.connector_ids);
          setPackaging(tracking.tracked.packaging ?? "cut_tape");
        }
      })
      .catch((caught: Error) => { if (!controller.signal.aborted) setError(caught.message); });
    return () => controller.abort();
  }, [projectId]);

  // The workspace's preferred order of distributors puts them first in the choice.
  useEffect(() => {
    const controller = new AbortController();
    getAssessmentSettings(controller.signal)
      .then((view) => setOrder(view.settings.prefer_distributors ? (view.settings.distributor_order ?? []) : []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  // After a budget is raised the distributors are read again; the choices stay as they are.
  useEffect(() => {
    if (reloads === 0) return;
    const controller = new AbortController();
    listSupplyConnectors(controller.signal)
      .then((list) => setConnectors(list.filter((item) => item.enabled && item.metered)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [reloads]);

  // A project whose BOM Prism has not read: read it, or queue its index and look again until it lands.
  const needsRead = state !== null && !state.has_usage;
  useEffect(() => {
    if (!needsRead) return;
    const controller = new AbortController();
    let polls = 0;
    const look = () => {
      polls += 1;
      if (polls > READ_POLLS) { clearInterval(timer); return; }
      readProjectBom(projectId)
        .then(() => getProjectTracking(projectId, controller.signal))
        .then((next) => { if (next.has_usage) { clearInterval(timer); setState(next); } })
        .catch((caught: Error) => { if (!controller.signal.aborted) setError(caught.message); });
    };
    const timer = setInterval(look, READ_POLL_MS);
    look();
    return () => { controller.abort(); clearInterval(timer); };
  }, [needsRead, projectId]);

  // Distributors for the choice: the ones every project uses by default, plus any assembly-only one a person adds.
  const defaults = useMemo(() => connectors.flatMap((item) => (item.assembly_only ? [] : [item.id])), [connectors]);
  const assembly = useMemo(() => connectors.filter((item) => item.assembly_only), [connectors]);
  const regular = useMemo(() => {
    const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
    return connectors.filter((item) => !item.assembly_only).sort((a, b) => rank(a.id) - rank(b.id));
  }, [connectors, order]);
  const ids = chosen ?? defaults;
  const choice = useMemo(
    () => ({ variants, all_variants: allVariants, packaging, connector_ids: chosen }),
    [variants, allVariants, packaging, chosen],
  );

  useEffect(() => {
    if (!state?.has_usage) return;
    const controller = new AbortController();
    previewTrackProject(projectId, choice, controller.signal)
      .then((next) => { setPreview(next); setError(""); })
      .catch((caught: Error) => { if (!controller.signal.aborted) { setPreview(null); setError(caught.message); } });
    return () => controller.abort();
  }, [projectId, choice, state?.has_usage, again]);

  return {
    state, connectors, setError, error, needsRead, preview, choice, assembly, regular, ids,
    variants, allVariants, packaging, setAllVariants, setPackaging,
    recheck: () => setAgain((count) => count + 1),
    reload: () => { setReloads((count) => count + 1); setAgain((count) => count + 1); },
    toggleVariant: (name: string, on: boolean) => setVariants((current) => (on ? [...current, name] : current.filter((item) => item !== name))),
    toggleConnector: (id: string, on: boolean) => setChosen(on ? [...ids, id] : ids.filter((item) => item !== id)),
  };
}
