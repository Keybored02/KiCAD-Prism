import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { RunView } from "./run-view";

interface RunDrawerProps {
    /** The run to show; null keeps the drawer closed. */
    runId: string | null;
    canEdit: boolean;
    canLogDefects: boolean;
    canChangeStatus: boolean;
    onClose: () => void;
    /** Switch to the full-page view of the same run. */
    onOpenFull?: () => void;
    onDeleted: () => void;
    /** Called after any change, so the list behind the drawer can refresh. */
    onChanged?: () => void;
}

/**
 * A run opened over its list: wide enough to read a spec and a defect side by
 * side, with the list (and its filters and scroll position) kept behind it.
 */
export function RunDrawer({
    runId,
    canEdit,
    canLogDefects,
    canChangeStatus,
    onClose,
    onOpenFull,
    onDeleted,
    onChanged,
}: RunDrawerProps) {
    return (
        <Sheet open={runId !== null} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 p-0 sm:w-[min(960px,75vw)] sm:max-w-none"
            >
                <SheetTitle className="sr-only">Production</SheetTitle>
                <SheetDescription className="sr-only">
                    Status, quantities, defects and spec of the selected production.
                </SheetDescription>
                {runId && (
                    <RunView
                        runId={runId}
                        variant="drawer"
                        canEdit={canEdit}
                        canLogDefects={canLogDefects}
                        canChangeStatus={canChangeStatus}
                        onOpenFull={onOpenFull}
                        onDeleted={onDeleted}
                        onChanged={onChanged}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}
