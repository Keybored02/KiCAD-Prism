# Open questions: lifecycle, distribution

Raised after the first real PCM install. These are design decisions, not bugs,
recorded here so they're decided deliberately rather than by whatever we happen to
build first.

## Settled

* **Symbol library.** Prism registers as KiCad's **remote symbol provider**, not as an
  HTTP library. The registration is one entry in `eeschema.json` under
  `remote_symbols.providers`, written by the agent (Settings -> Symbol library ->
  Link). KiCad reads providers at startup, so it needs a restart to pick up a change,
  but the write survives whether or not KiCad is running. The provider ships its own
  assets: the part manifest carries signed `download_url`s and KiCad fetches the
  `.kicad_sym` / `.kicad_mod` at placement time. No `.kicad_httplib`, no
  `sym-lib-table` edit, no token in a distributable artifact.
* **Agent/plugin version compatibility.** `/health` returns the agent version, the
  plugin declares `AGENT_MIN`, and a mismatch shows one clear message with a Restart
  agent button instead of failing like a bug in new code.
* **prism:// links.** Registered per-user and verified end to end (`prism://ping` from
  the web UI opens a dialog from the agent).

## 1. What happens to the agent on plugin uninstall / update?

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

## 2. Where is the plugin published and updated from?

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

That also makes the lifecycle question above *more* important, not less: automatic updates mean the
old-agent-still-running case will happen routinely rather than rarely.

Recommendation: **GitHub Releases now** (it works, and we need release artifacts for
the PCM index anyway), **PCM repository next**, once the version handshake exists to
survive the updates it will start generating.
