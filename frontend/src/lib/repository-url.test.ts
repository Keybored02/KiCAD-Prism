import { describe, expect, it } from "vitest";

import { repositoryFileUrl, repositoryWebUrl } from "./repository-url";

describe("repositoryWebUrl", () => {
  it("derives an https URL from scp-style GitHub remotes", () => {
    expect(repositoryWebUrl("git@github.com:org/repo.git")).toBe("https://github.com/org/repo");
    expect(repositoryWebUrl("git@github.com:org/repo")).toBe("https://github.com/org/repo");
    expect(repositoryWebUrl("git@gitlab.com:org/repo.git")).toBe("https://gitlab.com/org/repo");
  });

  it("derives an https URL from ssh:// remotes and drops the ssh port", () => {
    expect(repositoryWebUrl("ssh://git@github.com/org/repo.git")).toBe("https://github.com/org/repo");
    expect(repositoryWebUrl("ssh://git@github.com:2222/org/repo.git")).toBe("https://github.com/org/repo");
  });

  it("keeps http(s) remotes and strips the trailing .git", () => {
    expect(repositoryWebUrl("https://github.com/org/repo.git")).toBe("https://github.com/org/repo");
    expect(repositoryWebUrl("https://github.com/org/repo/")).toBe("https://github.com/org/repo");
    expect(repositoryWebUrl("http://git.internal.example/org/repo.git")).toBe("http://git.internal.example/org/repo");
  });

  it("preserves a non-default https port and drops the normalized default", () => {
    expect(repositoryWebUrl("https://git.internal.example:8443/org/repo.git")).toBe("https://git.internal.example:8443/org/repo");
    expect(repositoryWebUrl("https://github.com:443/org/repo.git")).toBe("https://github.com/org/repo");
  });

  it("drops credentials from an https remote", () => {
    expect(repositoryWebUrl("https://user:token@github.com/org/repo.git")).toBe("https://github.com/org/repo");
  });

  it("handles IPv6 ssh hosts", () => {
    expect(repositoryWebUrl("ssh://git@[::1]/org/repo.git")).toBe("https://[::1]/org/repo");
  });

  it("returns null for empty and null input", () => {
    expect(repositoryWebUrl(null)).toBeNull();
    expect(repositoryWebUrl(undefined)).toBeNull();
    expect(repositoryWebUrl("")).toBeNull();
    expect(repositoryWebUrl("   ")).toBeNull();
  });

  it("returns null when no safe derivation exists", () => {
    expect(repositoryWebUrl("github.com/org/repo")).toBeNull();
    expect(repositoryWebUrl("git@github.com")).toBeNull();
    expect(repositoryWebUrl("https://github.com/")).toBeNull();
    expect(repositoryWebUrl("file:///org/repo")).toBeNull();
    expect(repositoryWebUrl("not a url")).toBeNull();
  });
});
describe("repositoryFileUrl", () => {
  const sha = "0123abcd";
  const github = { repoUrl: "git@github.com:org/repo.git", provider: "github", commit: sha };

  it("opens a file next to the README at the commit on screen", () => {
    expect(repositoryFileUrl("CONTRIBUTING.md", github)).toBe(`https://github.com/org/repo/blob/${sha}/CONTRIBUTING.md`);
    expect(repositoryFileUrl("./docs/setup.md#wiring", github)).toBe(`https://github.com/org/repo/blob/${sha}/docs/setup.md#wiring`);
    expect(repositoryFileUrl("docs/", github)).toBe(`https://github.com/org/repo/tree/${sha}/docs`);
  });

  it("uses each host's file route", () => {
    const gitlab = { repoUrl: "https://gitlab.acme.io/hw/boards/main.git", provider: "gitlab", commit: sha };
    const gitea = { repoUrl: "https://git.acme.test/hw/board.git", provider: "gitea", commit: sha };
    expect(repositoryFileUrl("LICENSE", gitlab)).toBe(`https://gitlab.acme.io/hw/boards/main/-/blob/${sha}/LICENSE`);
    expect(repositoryFileUrl("docs/", gitlab)).toBe(`https://gitlab.acme.io/hw/boards/main/-/tree/${sha}/docs`);
    expect(repositoryFileUrl("LICENSE", gitea)).toBe(`https://git.acme.test/hw/board/src/commit/${sha}/LICENSE`);
  });

  it("resolves against the project's folder in a monorepo", () => {
    const project = { ...github, subPath: "boards/power" };
    expect(repositoryFileUrl("CONTRIBUTING.md", project)).toBe(`https://github.com/org/repo/blob/${sha}/boards/power/CONTRIBUTING.md`);
    expect(repositoryFileUrl("../../LICENSE", project)).toBe(`https://github.com/org/repo/blob/${sha}/LICENSE`);
    expect(repositoryFileUrl("/docs/style.md", project)).toBe(`https://github.com/org/repo/blob/${sha}/docs/style.md`);
  });

  it("encodes names once, whether or not the README already did", () => {
    expect(repositoryFileUrl("docs/Bring%20up.md", github)).toBe(`https://github.com/org/repo/blob/${sha}/docs/Bring%20up.md`);
    expect(repositoryFileUrl("docs/Bring up.md", github)).toBe(`https://github.com/org/repo/blob/${sha}/docs/Bring%20up.md`);
  });

  it("leaves links that are not repository paths alone", () => {
    expect(repositoryFileUrl("https://kicad.org", github)).toBeNull();
    expect(repositoryFileUrl("mailto:hw@acme.test", github)).toBeNull();
    expect(repositoryFileUrl("//cdn.acme.test/x.png", github)).toBeNull();
    expect(repositoryFileUrl("#install", github)).toBeNull();
    expect(repositoryFileUrl("", github)).toBeNull();
  });

  it("opens the repository when the file cannot be placed", () => {
    expect(repositoryFileUrl("CONTRIBUTING.md", { ...github, provider: null })).toBe("https://github.com/org/repo");
    expect(repositoryFileUrl("CONTRIBUTING.md", { ...github, commit: null })).toBe("https://github.com/org/repo");
    expect(repositoryFileUrl("../outside.md", github)).toBe("https://github.com/org/repo");
  });
});
