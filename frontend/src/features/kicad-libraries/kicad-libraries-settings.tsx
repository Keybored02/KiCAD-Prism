import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, useConfirmTarget } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    createLibrary,
    deleteLibrary,
    fetchLibraryAgain,
    updateLibrary,
} from "@/lib/kicad-libraries-client";
import type { KicadLibrary, NewKicadLibrary } from "@/types/kicad-libraries";

import { LibraryForm } from "./library-form";
import { LibraryRow } from "./library-row";
import { useKicadLibraries } from "./use-kicad-libraries";

type View = { kind: "list" } | { kind: "add" } | { kind: "edit"; library: KicadLibrary };

function messageOf(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export function KicadLibrariesSettings() {
    const { list, error, reload } = useKicadLibraries();
    const [view, setView] = useState<View>({ kind: "list" });
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const removal = useConfirmTarget<KicadLibrary>();

    const run = async (action: () => Promise<unknown>, failure: string): Promise<boolean> => {
        setBusy(true);
        try {
            await action();
            await reload();
            return true;
        } catch (caught) {
            toast.error(messageOf(caught, failure));
            return false;
        } finally {
            setBusy(false);
        }
    };

    const save = async (values: NewKicadLibrary) => {
        setFormError(null);
        setBusy(true);
        try {
            if (view.kind === "edit") {
                await updateLibrary(view.library.name, { variables: values.variables, ref: values.ref, subdir: values.subdir });
            } else {
                await createLibrary(values);
            }
            await reload();
            setView({ kind: "list" });
        } catch (caught) {
            setFormError(messageOf(caught, "Failed to save the library"));
        } finally {
            setBusy(false);
        }
    };

    const back = () => {
        setFormError(null);
        setView({ kind: "list" });
    };

    if (view.kind !== "list") {
        return (
            <section className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" className="self-start" onClick={back}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> KiCad libraries
                </Button>
                <h3 className="text-lg font-semibold">{view.kind === "edit" ? `Edit ${view.library.name}` : "Add a library"}</h3>
                <LibraryForm
                    library={view.kind === "edit" ? view.library : undefined}
                    pathLibrariesEnabled={list?.pathLibrariesEnabled ?? false}
                    busy={busy}
                    error={formError}
                    onSubmit={(values) => void save(values)}
                    onCancel={back}
                />
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold">KiCad libraries</h3>
                    <p className="text-sm text-muted-foreground max-w-xl">
                        Boards reach files outside their repository through path variables, such as {"${LSF_KICAD_LIB}"}.
                        Add the library behind each one and Prism fetches it and hands the folder to KiCad when it renders.
                    </p>
                </div>
                <Button size="sm" onClick={() => setView({ kind: "add" })}>
                    <Plus className="mr-1 h-4 w-4" /> Add library
                </Button>
            </div>

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {!list && !error && <Skeleton className="h-24 w-full" />}
            {list && list.libraries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No libraries yet. Boards that use a library Prism does not have render without those models.
                </p>
            )}
            {list && list.libraries.length > 0 && (
                <ul className="flex flex-col gap-3">
                    {list.libraries.map((library) => (
                        <LibraryRow
                            key={library.name}
                            library={library}
                            busy={busy}
                            onEdit={(target) => setView({ kind: "edit", library: target })}
                            onFetchAgain={(target) => void run(() => fetchLibraryAgain(target.name), "Failed to start the fetch")}
                            onRemove={removal.request}
                        />
                    ))}
                </ul>
            )}

            <ConfirmDialog
                open={removal.open}
                onOpenChange={(next) => { if (!next) removal.clear(); }}
                title="Remove library"
                description={`${removal.target?.name ?? ""} is forgotten and its fetched copy is deleted. Boards that use ${removal.target?.variables.join(", ") ?? ""} render without those models until it is added again.`}
                confirmLabel="Remove library"
                busy={busy}
                onConfirm={() => {
                    const target = removal.target;
                    if (!target) return;
                    void run(() => deleteLibrary(target.name), "Failed to remove the library").then(removal.clear);
                }}
            />
        </section>
    );
}
