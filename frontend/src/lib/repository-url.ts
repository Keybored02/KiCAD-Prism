/**
 * Turn a stored Git remote into the web URL a browser can open.
 *
 * The import field accepts scp-style (`git@host:org/repo.git`) and `ssh://`
 * remotes, and the workspace stores that transport spelling verbatim. Used
 * verbatim as an anchor href, a scp-style remote has no scheme, so the browser
 * resolves it as a *relative* URL against the Prism origin, and `ssh://` has
 * no web handler at all. Forge hosts serve their web UI over HTTPS on the same
 * host the remote names, so the browsable spelling is `https://host/path` with
 * the transport user dropped and the trailing `.git` removed.
 *
 * Returns null when no safe http(s) derivation exists so callers can render
 * the raw remote as plain text instead of a dead link.
 */

const SCP_LIKE_RE = /^[^/@]+@(\[[^\]]+\]|[^/:]+):(.+)$/;

export function repositoryWebUrl(raw: string | null | undefined): string | null {
  const remote = raw?.trim();
  if (!remote) {
    return null;
  }

  const scp = SCP_LIKE_RE.exec(remote);
  if (scp && !remote.includes("://")) {
    return buildWebUrl("https:", scp[1], "", scp[2]);
  }

  let parsed: URL;
  try {
    parsed = new URL(remote);
  } catch {
    return null;
  }

  if (parsed.protocol === "ssh:") {
    return buildWebUrl("https:", parsed.hostname, "", parsed.pathname);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }
  return buildWebUrl(parsed.protocol, parsed.hostname, parsed.port, parsed.pathname);
}

function buildWebUrl(
  protocol: string,
  host: string,
  port: string,
  pathname: string
): string | null {
  if (!host) {
    return null;
  }
  const path = pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
  if (!path) {
    return null;
  }
  const origin = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`;
  return `${origin}/${path}`;
}
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

export interface RepositoryLinkContext {
  repoUrl: string | null | undefined;
  /** `github`, `gitlab` or `gitea`, as the server resolved it for this remote. */
  provider: string | null | undefined;
  /** The commit on screen; links open the file as it was there. */
  commit: string | null | undefined;
  /** Where the project sits inside its repository, for monorepo projects. */
  subPath?: string | null;
}

/**
 * Where a relative link in a README opens on the code host.
 *
 * README links are written for the forge's own renderer: `CONTRIBUTING.md`
 * means a file next to the README, `/docs/x.md` means the repository root.
 * Inside Prism the same href resolves against the SPA route instead, so it is
 * rewritten to the host's file view at the commit being shown.
 *
 * Returns null for hrefs that are not repository paths (absolute URLs,
 * `mailto:`, in-page `#anchors`), which keep their own meaning. A repository
 * path that cannot be placed (unknown provider, no commit yet, a `..` past the
 * repository root) opens the repository itself rather than a dead Prism route.
 */
export function repositoryFileUrl(href: string | null | undefined, context: RepositoryLinkContext): string | null {
  const link = href?.trim();
  if (!link || link.startsWith("#") || link.startsWith("//") || SCHEME_RE.test(link)) {
    return null;
  }
  const webUrl = repositoryWebUrl(context.repoUrl);
  if (!webUrl) {
    return null;
  }

  const suffixAt = link.search(/[?#]/);
  const pathPart = suffixAt === -1 ? link : link.slice(0, suffixAt);
  const suffix = suffixAt === -1 ? "" : link.slice(suffixAt);

  const segments = pathPart.startsWith("/") ? [] : splitPath(context.subPath ?? "");
  for (const segment of splitPath(pathPart)) {
    if (segment === "..") {
      if (!segments.length) {
        return webUrl;
      }
      segments.pop();
    } else {
      segments.push(segment);
    }
  }

  const view = fileView(context.provider, pathPart.endsWith("/"));
  if (!view || !context.commit || !segments.length) {
    return webUrl;
  }
  const path = segments.map((segment) => encodeURIComponent(decodeSegment(segment))).join("/");
  return `${webUrl}/${view}/${encodeURIComponent(context.commit)}/${path}${suffix}`;
}

function splitPath(path: string): string[] {
  return path.split("/").filter((segment) => segment && segment !== ".");
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** The host's route for browsing a file (or a folder, for a trailing slash) at a commit. */
function fileView(provider: string | null | undefined, folder: boolean): string | null {
  if (provider === "github") return folder ? "tree" : "blob";
  if (provider === "gitlab") return folder ? "-/tree" : "-/blob";
  if (provider === "gitea") return "src/commit";
  return null;
}
