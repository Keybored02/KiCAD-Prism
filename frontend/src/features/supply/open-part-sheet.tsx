import { useSearchParams } from "react-router-dom";

import type { User } from "@/types/auth";
import { PartSheet } from "./part-sheet";

/**
 * The part sheet of the part in the address (`part`), for a tab that opens parts in place: Insights and the Dashboard. Only the tab
 * being shown draws it, so a part opened on one tab is not opened under another; closing it leaves the tab where it was.
 */
export function OpenPartSheet({ user, active, onChanged }: { user: User | null; active: boolean; onChanged?: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const partId = active ? searchParams.get("part") : null;
  const close = () => setSearchParams((current) => {
    const updated = new URLSearchParams(current);
    updated.delete("part");
    return updated;
  });
  return <PartSheet partId={partId} user={user} onClose={close} onWatchChanged={() => onChanged?.()} />;
}
