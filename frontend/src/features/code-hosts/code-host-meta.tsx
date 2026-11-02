import type { ComponentType } from "react";
import { Github, Gitlab, Server } from "lucide-react";
import { cn } from "@/lib/utils";

/** The code hosts Prism can talk to, in the order an admin is offered them. */
export type CodeHostProvider = "github" | "gitlab" | "gitea";

export const CODE_HOST_PROVIDERS: CodeHostProvider[] = ["github", "gitlab", "gitea"];

export function providerName(provider: string): string {
    if (provider === "github") return "GitHub";
    if (provider === "gitlab") return "GitLab";
    if (provider === "gitea") return "Gitea / Forgejo";
    return provider;
}

export function instanceLabel(provider: string, instanceKind: string): string {
    if (provider === "github") return instanceKind === "ghes" ? "GitHub Enterprise Server" : "GitHub.com";
    if (provider === "gitlab") return instanceKind === "gitlab.com" ? "GitLab.com" : "Self-managed GitLab";
    if (provider === "gitea") return "Gitea or Forgejo server";
    return instanceKind;
}

/**
 * Gitea and Forgejo: lucide has no mark for them, so this is drawn to match its
 * stroke style (24px grid, 2px round stroke): a teacup holding a git branch.
 */
function GiteaGlyph({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M2 4h15v9a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7z" />
            <path d="M17 7.5h2a3 3 0 0 1 0 6h-2" />
            <path d="M7 9.7v3.6" />
            <circle cx="7" cy="8.5" r="1.2" />
            <circle cx="7" cy="14.5" r="1.2" />
            <circle cx="12" cy="11.5" r="1.2" />
            <path d="M7 13.5c0-1.6 2-2 3.8-1.9" />
        </svg>
    );
}

function glyphFor(provider: string | null | undefined): ComponentType<{ className?: string }> {
    if (provider === "github") return Github;
    if (provider === "gitlab") return Gitlab;
    if (provider === "gitea") return GiteaGlyph;
    return Server;
}

/** The bare glyph for a code host; an unknown host gets a neutral server mark. */
export function CodeHostIcon({ provider, className }: { provider: string | null | undefined; className?: string }) {
    const Icon = glyphFor(provider);
    return <Icon className={className} aria-hidden="true" />;
}

/** The code host's mark in a bordered tile. */
export function CodeHostMark({ provider, className }: { provider: string; className?: string }) {
    const Icon = glyphFor(provider);
    return (
        <span
            className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-foreground",
                className,
            )}
            aria-hidden="true"
        >
            <Icon className="size-4" />
        </span>
    );
}

function origin(host: string): string | null {
    const trimmed = host.trim();
    return trimmed ? `https://${trimmed}` : null;
}

/** Public profile of a linked account. */
export function profileUrl(host: string, login: string): string | null {
    const base = origin(host);
    return base && login ? `${base}/${encodeURIComponent(login)}` : null;
}

/** Where a person removes Prism from their own account on the host. */
export function authorizedAppsUrl(provider: string, host: string): string | null {
    const base = origin(host);
    if (!base) return null;
    if (provider === "github") return `${base}/settings/applications`;
    if (provider === "gitlab") return `${base}/-/user_settings/applications`;
    if (provider === "gitea") return `${base}/user/settings/applications`;
    return null;
}

/** Where an admin registers Prism as an OAuth application on the host. */
export function registerApplicationUrl(provider: string, host: string): string | null {
    const base = origin(host);
    if (!base) return null;
    if (provider === "gitlab") return `${base}/-/user_settings/applications`;
    if (provider === "gitea") return `${base}/user/settings/applications`;
    return null;
}

/** Hostname from a URL an admin typed, or ``null`` while it is not a valid https URL. */
export function hostFromUrl(value: string): string | null {
    try {
        const url = new URL(value.trim());
        return (url.protocol === "https:" || url.protocol === "http:") && url.hostname ? url.host : null; // TEMP-HTTP: testing only, do not commit
    } catch {
        return null;
    }
}
