import { fetchChecked, fetchJson } from "@/lib/api";
import type {
    KicadLibrary,
    KicadLibraryChanges,
    KicadLibraryList,
    NewKicadLibrary,
    RemoteCheckResult,
} from "@/types/kicad-libraries";

const ROOT = "/api/settings/kicad-libraries";
const JSON_HEADERS = { "Content-Type": "application/json" };

function send(method: string, body: unknown): RequestInit {
    return { method, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export function listLibraries(signal?: AbortSignal): Promise<KicadLibraryList> {
    return fetchJson<KicadLibraryList>(ROOT, { signal }, "Failed to load the KiCad libraries");
}

export function createLibrary(library: NewKicadLibrary): Promise<KicadLibrary> {
    return fetchJson<KicadLibrary>(ROOT, send("POST", library), "Failed to add the library");
}

export function updateLibrary(name: string, changes: KicadLibraryChanges): Promise<KicadLibrary> {
    return fetchJson<KicadLibrary>(`${ROOT}/${encodeURIComponent(name)}`, send("PATCH", changes), "Failed to save the library");
}

export function fetchLibraryAgain(name: string): Promise<KicadLibrary> {
    return fetchJson<KicadLibrary>(`${ROOT}/${encodeURIComponent(name)}/fetch`, { method: "POST" }, "Failed to start the fetch");
}

export async function deleteLibrary(name: string): Promise<void> {
    await fetchChecked(`${ROOT}/${encodeURIComponent(name)}`, { method: "DELETE" }, "Failed to remove the library");
}

export function checkRemote(git: string, ref: string): Promise<RemoteCheckResult> {
    return fetchJson<RemoteCheckResult>(`${ROOT}/check`, send("POST", { git, ref }), "Failed to check the repository");
}
