import { useCallback } from "react";
import { Link } from "react-router-dom";

import type { SupplyConnector, SupplySignin, SupplySvhcList } from "@/types/supply";
import { getSupplySignin, getSvhcList, listSupplyConnectors } from "./supply-api";
import { useLoaded } from "./use-loaded";

const DAY_MS = 24 * 3600 * 1000;
/** ECHA updates the Candidate List twice a year. */
const LIST_OLD_DAYS = 180;
const SIGNIN_WARN_DAYS = 14;

export interface AdminNotice {
  key: string;
  text: string;
  to: string;
  action: string;
}

/** What only an administrator can fix, from the connectors, the sign-ins and the Candidate List. Pure, so it can be tested. */
export function adminNotices(
  connectors: readonly SupplyConnector[],
  signins: ReadonlyMap<string, SupplySignin>,
  list: SupplySvhcList | null,
  waiting: number,
  now: number,
): AdminNotice[] {
  const notices: AdminNotice[] = [];
  for (const connector of connectors) {
    if (connector.paused_reason) {
      notices.push({ key: `paused:${connector.id}`, text: `${connector.display_name} is paused: ${connector.paused_reason}`, to: "connectors", action: "Open" });
    }
    const signin = signins.get(connector.id);
    if (signin && (signin.state === "expired" || signin.state === "refused")) {
      notices.push({ key: `signin:${connector.id}`, text: `${connector.display_name} needs a new sign-in for change notices`, to: "connectors", action: "Sign in" });
    } else if (signin?.expires_at) {
      const days = Math.floor((new Date(signin.expires_at).getTime() - now) / DAY_MS);
      if (days <= SIGNIN_WARN_DAYS) {
        notices.push({ key: `signin:${connector.id}`, text: `${connector.display_name} sign-in ends in ${Math.max(days, 0)} days`, to: "connectors", action: "Sign in" });
      }
    }
  }
  if (list?.loaded && list.loaded_at) {
    const age = Math.floor((now - new Date(list.loaded_at).getTime()) / DAY_MS);
    if (age >= LIST_OLD_DAYS) {
      notices.push({ key: "echa", text: `The Candidate List was loaded ${age} days ago`, to: "settings", action: "Update" });
    }
  }
  if (waiting > 0) {
    notices.push({ key: "waiting", text: `${waiting.toLocaleString()} ${waiting === 1 ? "part waits" : "parts wait"} for room in a call budget`, to: "connectors", action: "Raise a budget" });
  }
  return notices;
}

/** The Dashboard strip for administrators: the few things only they can fix, each with where to fix it. Empty when all is well. */
export function AdminStrip({ waiting }: { waiting: number }) {
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const connectors = await listSupplyConnectors(signal);
    const signins = new Map<string, SupplySignin>();
    await Promise.all(connectors.map(async (item) => {
      if (item.provider !== "digikey") return;
      try { signins.set(item.id, await getSupplySignin(item.id, signal)); } catch { /* no sign-in to report */ }
    }));
    let list: SupplySvhcList | null = null;
    try { list = await getSvhcList(signal); } catch { /* the list is optional */ }
    return { connectors, signins, list };
  }, []);
  const { data } = useLoaded("admin-strip", fetcher, "Could not load the administrator notes", "supply");
  const notices = data ? adminNotices(data.connectors, data.signins, data.list, waiting, Date.now()) : [];
  if (notices.length === 0) return null;
  return (
    <div className="space-y-2" aria-label="For administrators">
      {notices.length > 0 ? (
        <ul className="divide-y border">
          {notices.map((notice) => (
            <li key={notice.key} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <span>{notice.text}</span>
              <Link to={`/?section=supply&supplyView=${notice.to === "settings" ? "connectors" : notice.to}`} className="text-xs text-primary hover:underline">{notice.action}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
