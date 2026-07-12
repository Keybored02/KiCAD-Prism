# Open questions: lifecycle, versioning, distribution

Raised after the first real PCM install. These are design decisions, not bugs —
recorded here so they're decided deliberately rather than by whatever we happen to
build first.

## 1. The remote library isn't added (and never was)

**Not a regression — a missing feature.** The plugin has no remote-library code at
all. KiCad's remote/HTTP library is a *different mechanism* from an ActionPlugin:
KiCad reads a `.kicad_httplib` file that points at the backend, and that file has to
be registered in KiCad's **symbol library table** (`sym-lib-table`), which lives per
project or globally in KiCad's config.

So adding it means:

* writing a `.kicad_httplib` (backend URL + token) somewhere stable,
* adding an entry to the global `sym-lib-table`,
* not corrupting that table if the user already has entries (it's *their* config),
* and deciding what happens on uninstall (see §2).

The existing backend side is `backend/app/api/remote_provider.py` and
`docs/REMOTE_SYMBOL_PROVIDER.md`. The known bug there is that the URL isn't passed
correctly to the remote-library function.

**Security note that must be settled first:** a `.kicad_httplib` containing a token
is a bearer credential in a file. If it's also shipped inside a downloadable zip
(the "download lib plugin" idea), that credential is forwardable, non-revocable, and
will end up in Slack and Downloads folders. Prefer writing the URL at install time
and having the plugin authenticate on first run — never bake a token into a
distributable artifact.

## 2. What happens to the agent on plugin uninstall / update?

**Today: it is orphaned, and that's a real problem.**

The agent is a *detached process that outlives KiCad* — deliberately. But PCM
uninstall just deletes `plugins/`. So after an uninstall:

* the agent is **still running**, serving on a loopback port,
* its **autostart entry is still registered**, so it comes back at every login,
* its **binary has been deleted from under it** (it's running from memory), and
* nothing will ever start it again, nor tell the user it's there.

An update is the same story: PCM replaces the directory, but the *old* agent keeps
running and the single-instance guard means the *new* binary refuses to start. You'd
silently keep running the old agent forever.

**PCM has no uninstall hook**, so the plugin cannot clean up on its way out. Options:

* **The agent watches its own binary.** If the file it was launched from disappears,
  shut down and deregister autostart. Self-healing, needs no hook, but the agent
  polls its own path — slightly odd, and racy during an update (the file vanishes
  and reappears).
* **Version handshake forces a restart** (see §3). The new plugin sees an old agent,
  tells it to quit, and starts the new one. Solves *update* cleanly; does nothing for
  *uninstall*.
* **Both.** Probably right: the handshake handles updates (the common case), and the
  binary watch is the backstop that stops an uninstalled agent haunting the machine.

Either way, `disable()` in `autostart.py` must be called, or a deleted plugin leaves
a login item pointing at a binary that no longer exists.

## 3. Agent ↔ plugin version compatibility

`/health` already returns the agent's version. Nothing checks it.

The dangerous case is specific: **autostart means an OLD agent is already running
when a NEW plugin is installed.** The plugin talks to it, gets subtly wrong answers
(a missing field, a route that 404s), and fails in a way that looks like a bug in the
new code.

Wanted:

* the plugin declares the agent version range it needs,
* on startup it checks `/health`, and on mismatch **says so plainly** and offers to
  restart the agent (we already have `/restart`) rather than limping on,
* the agent likewise rejects a plugin that's too old to understand it.

Cheap to build, and it turns a class of mystery bugs into one clear message.

## 4. Where is the plugin published and updated from?

Three options, and they're not equivalent:

| | How the user updates | Effort |
|---|---|---|
| **GitHub Releases + "Install from File"** | Manually: notice, download, reinstall | none — works today |
| **A PCM repository** (repository.json + packages.json on GitHub Pages) | KiCad's Plugin Manager shows an update badge and does it | a JSON index + a release step |
| **Served from the web UI** | Manual, plus the backend now hosts binaries | pointless — no update UX, and couples the plugin to a running server |

**The PCM repository is the only one that gives real update UX**, and it's what
KiCad is built for: the user adds our repository URL once, and thereafter sees
updates in the Plugin Manager like any other addon. It's a static `repository.json`
+ `packages.json` (with sha256 + download_url per version) hosted anywhere — GitHub
Pages is free and already adjacent to the releases.

That also makes §2 and §3 *more* important, not less: automatic updates mean the
old-agent-still-running case will happen routinely rather than rarely.

Recommendation: **GitHub Releases now** (it works, and we need release artifacts for
the PCM index anyway), **PCM repository next**, once the version handshake exists to
survive the updates it will start generating.
