import type { SupplyPartDetail } from "@/types/supply";
import { AlertPopover } from "./alert-popover";
import { DatasheetLink } from "./datasheet-link";
import { WatchPopover } from "./watch-popover";

/** The icons at the top of a part: its alert rules (a watched part), how often it is read, and its datasheet. */
export function PartActions({ detail, canEdit, onChanged }: { detail: SupplyPartDetail; canEdit: boolean; onChanged: () => Promise<void> }) {
  return (
    <>
      {detail.watch && canEdit ? <AlertPopover partId={detail.part.id} canEdit={canEdit} /> : null}
      <WatchPopover detail={detail} canEdit={canEdit} onChanged={onChanged} />
      <DatasheetLink partId={detail.part.id} />
    </>
  );
}
