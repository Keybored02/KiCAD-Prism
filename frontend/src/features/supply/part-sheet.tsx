import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { SupplyPartDetail } from "@/types/supply";
import { PartDetailSections } from "./part-detail-sections";
import { StatusDot } from "./status-dot";
import { STATUS_LABEL } from "./supply-format";
import { useSupplyPart } from "./use-supply-parts";

interface PartSheetProps {
  partId: string | null;
  user: User | null;
  onClose: () => void;
  /** Called after a watch changes, so the list behind the sheet can reload. */
  onWatchChanged: () => void;
}

/** One part: its stock and history, its watch, and every listing behind the numbers. */
export function PartSheet({ partId, user, onClose, onWatchChanged }: PartSheetProps) {
  return (
    <Sheet open={partId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {partId ? <PartBody key={partId} partId={partId} user={user} onWatchChanged={onWatchChanged} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function PartBody({ partId, user, onWatchChanged }: { partId: string; user: User | null; onWatchChanged: () => void }) {
  const { status, data, error, retry, refresh } = useSupplyPart(partId);
  const changed = async () => {
    await refresh();
    onWatchChanged();
  };

  if (status === "loading") {
    return (
      <>
        <SheetHeader><SheetTitle>Loading part</SheetTitle><SheetDescription>One moment.</SheetDescription></SheetHeader>
        <Skeleton className="mt-4 h-40 w-full" aria-label="Loading the part" />
      </>
    );
  }
  if (status === "error" || !data) {
    return (
      <>
        <SheetHeader><SheetTitle>Part</SheetTitle><SheetDescription>It could not be loaded.</SheetDescription></SheetHeader>
        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="flex items-center justify-between gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
          </AlertDescription>
        </Alert>
      </>
    );
  }
  return <PartDetail detail={data} canEdit={canEditSupply(user?.role)} role={user?.role} onChanged={changed} />;
}

function PartDetail({ detail, canEdit, role, onChanged }: { detail: SupplyPartDetail; canEdit: boolean; role: User["role"] | undefined; onChanged: () => Promise<void> }) {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <StatusDot status={detail.status} />
          {detail.part.mpn}
        </SheetTitle>
        <SheetDescription>
          {detail.part.manufacturer}. {STATUS_LABEL[detail.status]}.
        </SheetDescription>
      </SheetHeader>

      <PartDetailSections detail={detail} canEdit={canEdit} role={role} onChanged={onChanged} />
    </div>
  );
}
