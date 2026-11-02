import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KicadLibrary, NewKicadLibrary } from "@/types/kicad-libraries";

import { LibraryRefSelect } from "./library-ref-select";
import { parseVariables } from "./library-status";
import { useRemoteRefs } from "./use-remote-refs";

type Source = "git" | "path";

interface FormValues {
    name: string;
    variables: string;
    source: Source;
    git: string;
    ref: string;
    subdir: string;
    path: string;
}

interface LibraryFormProps {
    /** The library being edited; absent when adding. */
    library?: KicadLibrary;
    pathLibrariesEnabled: boolean;
    busy: boolean;
    error: string | null;
    onSubmit: (values: NewKicadLibrary) => void;
    onCancel: () => void;
}

function initialValues(library?: KicadLibrary): FormValues {
    return {
        name: library?.name ?? "",
        variables: library?.variables.join(", ") ?? "",
        source: library?.path ? "path" : "git",
        git: library?.git ?? "",
        ref: library?.ref ?? "",
        subdir: library?.subdir ?? "",
        path: library?.path ?? "",
    };
}

function toLibrary(values: FormValues, ref: string): NewKicadLibrary {
    const base = { name: values.name.trim(), variables: parseVariables(values.variables) };
    if (values.source === "path") return { ...base, path: values.path.trim() };
    return { ...base, git: values.git.trim(), ref, subdir: values.subdir.trim() };
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

export function LibraryForm({ library, pathLibrariesEnabled, busy, error, onSubmit, onCancel }: LibraryFormProps) {
    const editing = library !== undefined;
    const [values, setValues] = useState<FormValues>(() => initialValues(library));
    const set = (changes: Partial<FormValues>) => setValues((previous) => ({ ...previous, ...changes }));
    const isGit = values.source === "git";
    const refs = useRemoteRefs(isGit ? values.git : "");
    // Until a choice is made, the repository's default branch is the ref.
    const ref = values.ref || refs.defaultBranch || "";
    const complete =
        values.name.trim() !== "" &&
        parseVariables(values.variables).length > 0 &&
        (isGit ? refs.status === "ready" && ref !== "" : values.path.trim() !== "");

    return (
        <form
            className="flex flex-col gap-4 max-w-xl"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(toLibrary(values, ref));
            }}
        >
            <Field id="library-name" label="Name" hint="Letters, digits, dots, dashes and underscores.">
                <Input id="library-name" value={values.name} disabled={editing} onChange={(event) => set({ name: event.target.value })} />
            </Field>
            <Field id="library-variables" label="Path variables" hint="The variables boards use to reach this library, such as LSF_KICAD_LIB. Separate several with commas.">
                <Input id="library-variables" value={values.variables} onChange={(event) => set({ variables: event.target.value })} />
            </Field>

            {!editing && pathLibrariesEnabled && (
                <div className="flex gap-2" role="radiogroup" aria-label="Source">
                    <Button type="button" size="sm" variant={isGit ? "secondary" : "ghost"} aria-checked={isGit} role="radio" onClick={() => set({ source: "git" })}>
                        Git repository
                    </Button>
                    <Button type="button" size="sm" variant={isGit ? "ghost" : "secondary"} aria-checked={!isGit} role="radio" onClick={() => set({ source: "path" })}>
                        Folder on the server
                    </Button>
                </div>
            )}

            {isGit ? (
                <>
                    <Field id="library-git" label="Repository" hint={editing ? "Remove the library to point it at another repository." : "An https:// address. It is checked as you type."}>
                        <Input id="library-git" value={values.git} disabled={editing} placeholder="https://gitlab.com/org/library.git" onChange={(event) => set({ git: event.target.value, ref: "" })} />
                    </Field>
                    <Field id="library-ref" label="Tag or branch">
                        <LibraryRefSelect id="library-ref" value={ref} refs={refs} onChange={(picked) => set({ ref: picked })} />
                    </Field>
                    <Field id="library-subdir" label="Folder inside the repository" hint="Optional. The variables point here instead of the repository root.">
                        <Input id="library-subdir" value={values.subdir} onChange={(event) => set({ subdir: event.target.value })} />
                    </Field>
                </>
            ) : (
                <Field id="library-path" label="Folder" hint="Relative to the library mount root on the server.">
                    <Input id="library-path" value={values.path} disabled={editing} onChange={(event) => set({ path: event.target.value })} />
                </Field>
            )}

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="flex gap-2">
                <Button type="submit" disabled={busy || !complete}>{editing ? "Save" : "Add library"}</Button>
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    );
}
