# KiCad-Prism desktop tools

Two pieces that let you work with Prism from the desktop:

```
┌──────────────────────────────┐
│  Tray agent  (prism_agent)   │   the worker — runs always, with or without KiCad
│  • identifies local projects │
│  • runs git                  │
│  • talks to the Prism backend│
│  • serves a loopback HTTP API├──┐
└──────────────────────────────┘  │  127.0.0.1 (token-guarded)
                                  │
┌──────────────────────────────┐  │
│  KiCad plugin (kicad_plugin) ├──┘  the UI — only when KiCad is open
│  • pcbnew toolbar button     │
│  • themed wx dialog          │
│  • no logic of its own       │
└──────────────────────────────┘
```

**Why split it this way.** KiCad isn't always open, so the useful capabilities
can't live inside it. The agent owns everything real; the plugin is a thin client
that renders the agent's answers. That also keeps the plugin **stdlib-only** —
installing packages into KiCad's embedded Python is painful and fragile, so the
plugin depends on nothing but the standard library and KiCad's bundled wxPython.

## Installing

Download the zip for your platform from the [releases][releases], then in KiCad:
**Plugin and Content Manager → Install from File…**

That's it. **No Python installation is required** — the agent ships as a
self-contained binary inside the zip. The first time you open the plugin
(*Tools → External Plugins → Prism*) it starts the agent and offers two optional,
per-user integrations, each of which you can decline:

| Option | What it actually writes |
|---|---|
| Start the agent at login | Windows: a value under `HKCU\…\CurrentVersion\Run`<br>macOS: a LaunchAgent in `~/Library/LaunchAgents`<br>Linux: a `.desktop` in `~/.config/autostart` |
| Open `prism://` links | The URL scheme, registered for your user only |

Nothing is written unless you tick the box. You can change both later, or re-run
setup, from **Settings** in the plugin.

[releases]: https://github.com/Keybored02/KiCAD-Prism/releases

### macOS may ask you to authorise the agent

The binary is ad-hoc signed but not notarised. In the normal path that's fine —
Gatekeeper only inspects files carrying `com.apple.quarantine`, and KiCad's Plugin
Manager downloads and extracts the zip itself, so the flag is never applied.

If you instead download the zip **in a browser** and extract it with Finder, macOS
will flag the binary and refuse to run it ("cannot be opened because the developer
cannot be verified"). The plugin strips the flag from its own binary before
launching, which handles most cases; if macOS still objects, allow it in
**System Settings → Privacy & Security**, or run:

```bash
xattr -d com.apple.quarantine <plugin dir>/prism-agent
```

### Linux: the tray icon needs a system package

The agent works regardless — the tray is a convenience, not the architecture (see
below) — but to actually *see* an icon you need an AppIndicator backend:

```bash
sudo apt install gir1.2-ayatanaappindicator3-0.1 python3-gi
```

## Running the agent by hand

Normally the plugin starts it. To run it yourself — from a release:

```bash
./prism-agent            # or prism-agent.exe
./prism-agent --no-tray  # headless
```

…or from a source checkout:

```bash
pip install -r tools/prism_agent/requirements.txt
python -m prism_agent    # from the tools/ directory
```

**The tray icon is a convenience, not the architecture.** The agent's real control
surface is its HTTP API, which behaves identically on every OS. That matters,
because the tray is the one part that *doesn't*: on Linux pystray needs an
AppIndicator backend (`sudo apt install gir1.2-ayatanaappindicator3-0.1
python3-gi`), and under Wayland — the default on current GNOME — the X11 fallback
doesn't work. On a headless box or over SSH there's no tray at all.

So when no tray can be drawn the agent **says so and keeps serving** rather than
exiting (which would take the plugin down with it) or running invisibly with no way
to stop it. `POST /quit` stops it from anywhere, which is what makes a missing icon
survivable instead of an orphaned process. pystray raises `ImportError` when no
backend works, so this is detected rather than guessed — no per-distro knowledge
required.

It sits in the system tray and binds an ephemeral port on `127.0.0.1`, publishing
`{port, token, pid}` to a discovery file so the plugin can find it:

| OS | File |
|---|---|
| Windows | `%APPDATA%\kicad-prism\agent.json` |
| macOS | `~/Library/Application Support/kicad-prism/agent.json` |
| Linux | `$XDG_CONFIG_HOME/kicad-prism/agent.json` |

Every route except `/health` requires the token. That isn't paranoia: **any local
process — including JavaScript on a web page — can reach a loopback port**, and
the agent can run git and read the filesystem. The token is a shared secret only
the owning user can read.

Configuration (env vars):

| Var | Default | |
|---|---|---|
| `PRISM_URL` | `http://127.0.0.1:8000` | Prism backend |
| `PRISM_TOKEN` | *(none)* | bearer token, if the backend requires auth |

The agent is useful **without** a backend: project detection and git status are
purely local. Backend calls degrade to "not registered" rather than failing.

### API

```
GET  /health                       {ok, version, backend_reachable}     no auth
GET  /project?path=<path>          {project, git, prism}
GET  /changes?path=<path>          {changes, project, prism}
GET  /settings                     {settings, identity, protocol}
PUT  /settings {..}                updates, and re-points the backend client
POST /open-in-prism {project_id}   opens the web app in the browser
POST /restart                      stops, then relaunches the agent
POST /quit                         stops the agent
```

## Settings, accounts, and prism:// links

Settings live in `settings.json` next to the discovery file, and are edited from
**Settings** in the plugin dialog. They're deliberately not in the tray: a pystray
menu is labels and checkmarks, it can't host a text field, and a half-usable tray
form would be worse than none. The tray does carry *Restart agent* and *Quit*.

Env vars (`PRISM_URL`, `PRISM_TOKEN`) still win over the saved file, so pointing at
a staging backend for one run neither loses nor silently overwrites what you saved.
The API token is **write-only**: the agent stores it but never sends it back, so
the UI only ever learns *whether* one is set.

**Accounts.** Prism authenticates with OIDC authorization-code — you sign in at an
identity provider in a *browser*, which redirects back with a code. There is no
username/password endpoint, so a desktop client cannot collect credentials itself;
it has to hand off to the browser, and the redirect is what `prism://auth/callback`
is for. Right now the server has `auth_enabled: false`, so every request is a guest
and no token is needed; the settings dialog says so instead of showing a dead
Sign-in button. The seam (token → bearer header → `identity`) is in place for when
an issuer is configured.

**prism:// links.** The URL *dispatch* is portable; the *registration* is not:

| OS | How the scheme is claimed | Works? |
|---|---|---|
| Windows | per-user registry key under `HKCU\Software\Classes\prism` | yes, no admin needed |
| Linux | a `.desktop` file with `MimeType=x-scheme-handler/prism` | yes |
| macOS | `CFBundleURLTypes` in an app bundle's `Info.plist` | **not yet** — only an `.app` bundle can claim a scheme, and we currently ship a bare binary. A PyInstaller `BUNDLE` step would fix it; no Apple account needed. |

Nothing is registered unless you tick the box: silently claiming a URL scheme is the
sort of thing people rightly resent. From a source checkout the registered command
bootstraps `sys.path` explicitly rather than relying on the working directory,
because the browser launches it from *its* cwd, not ours; the shipped binary needs
no such trick.

### Uncommitted changes

`/changes` is the interesting one. The web app can only ever show *committed*
history — that's all the backend can see. But while you're working in KiCad, the
changes you care about are the ones still on disk, which exist nowhere but your
machine. The agent diffs them locally: **old side = the blob at HEAD, new side =
the file as it currently is**.

The result is grouped exactly the way the web UI groups a commit — Components /
Nets / Zones / Graphics for boards, Symbols / Nets / Sheets / Text for schematics,
with mixed add+remove on one net reconciled into a single "changed" row. That
parity is deliberate: `prism_agent/diff_grouping.py` is a direct port of
`frontend/src/lib/diff-grouping.ts`. **If you change grouping or labels in one,
change them in the other** — the whole point is that a board reads the same in
KiCad as it does in the browser.

The parse/diff itself is not reimplemented: the agent loads the backend's real
`pcb_diff_service` / `sch_diff_service`. Their `diff_pcb(old, new)` /
`diff_schematics(old, new)` entry points take plain strings, so only their
module-level imports (GitPython, the workspace DB, `kicad_monkey`) need stubbing
out — see `worktree_diff.py`. Vendoring a copy of ~2000 lines of diff logic would
have guaranteed drift, and then the plugin and the web app would disagree about
the same board.

`kicad_monkey` is stubbed rather than required: the backend uses it to render text
glyphs for *exact* bounding boxes, which drive the web viewer's highlight
rectangles. The agent draws nothing — it only needs to know *which* items changed,
and identity doesn't depend on glyph outlines. Verified: the diff output is
identical with the real library and with the stub. Without this, the agent would
silently report zero PCB changes on any Python that isn't the backend's venv.

Diffing a big board takes a second or two, so the agent caches the result keyed on
the mtimes of the files git reports as dirty — any edit invalidates it by itself,
so you never see a stale answer, and reopening the dialog is instant.

Debuggable with curl:

```bash
TOKEN=$(python -c "import json,os;print(json.load(open(os.path.expandvars(r'%APPDATA%\kicad-prism\agent.json')))['token'])")
PORT=$(python -c  "import json,os;print(json.load(open(os.path.expandvars(r'%APPDATA%\kicad-prism\agent.json')))['port'])")
curl -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:$PORT/project?path=/path/to/project"
```

## Developing

For a working copy, symlink the plugin into KiCad rather than reinstalling a zip
each time:

```bash
python tools/install_plugin.py               # symlink into KiCad's plugin dir
python tools/install_plugin.py --uninstall
python tools/install_plugin.py --dir <path>  # pick the KiCad version yourself
```

### The dev copy and a real install coexist

You need both: a symlink to iterate on, and a real PCM install to verify what users
actually get. Left alone these collide — two identically named plugins in the menu,
and, far worse, **one agent between them**: they share a discovery file and a
settings file, so the single-instance guard means only one agent starts and it
silently serves both. You edit agent code, restart, and see nothing change, because
you're still talking to the installed binary.

So the plugin detects how it was installed and namespaces itself. **Nothing to
configure:**

| | Menu entry | Agent state lives in |
|---|---|---|
| Symlinked working copy | **Prism (dev)** | `…/kicad-prism-dev/` |
| Installed package | **Prism** | `…/kicad-prism/` |

Separate agents, separate settings, separate single-instance guards. Install both
and they stay out of each other's way.

To run an isolated agent by hand:

```bash
python -m prism_agent --profile dev     # or set PRISM_PROFILE=dev
```

The profile is passed to autostart as an *argument* rather than left in the
environment, because a login process gets a fresh one — otherwise a dev agent set to
start at login would come back as the *default* agent and collide with the installed
one it was carefully kept apart from.

It symlinks rather than copies, so the repo stays the single source of truth: edit
the plugin here and KiCad picks it up on *Tools → External Plugins → Refresh*. If
the OS refuses symlinks (Windows without Developer Mode) it falls back to copying
and **says so** — a silent copy would quietly turn every later edit into a no-op.

Autodetect prefers a KiCad version that is actually **installed**: KiCad leaves a
config dir behind for every version you've ever run, so the newest config dir is
often an orphan, and installing into it means the plugin silently never appears.

With no binary built, the plugin falls back to running the agent from source (it
will tell you which interpreters it tried, and why each was rejected). To get the
real thing:

```bash
pip install pyinstaller
python tools/build_agent.py --windowed # -> tools/dist/prism-agent[.exe]
python tools/build_agent.py --console  # debug only: keep a console so crashes stay visible
```

`find_binary()` looks in `tools/dist/` too, so a local build is picked up
automatically.

### Building the release packages

```bash
python tools/package_plugin.py --version 0.4.0 --binaries <dir> --out dist
```

PyInstaller **cannot cross-compile** — a macOS binary must be built on macOS, a
Linux one on Linux — so the real packages come from CI:
`.github/workflows/build-plugin.yml`, a matrix of `windows-latest` /
`macos-latest` / `ubuntu-latest`. It's **manual dispatch only** (Actions → Build
KiCad Plugin → Run workflow); building three binaries on every commit would be
waste, and it's a release step, not a check.

One zip per platform, each carrying its own agent binary. The layout is fixed by
KiCad: `metadata.json` at the root, the plugin **directly** inside `plugins/` (a
further level of nesting is explicitly forbidden), `resources/icon.png`, and the
agent binary beside the plugin — which is exactly where `find_binary()` looks
first.

### Why a binary at all

The plugin runs inside KiCad's embedded Python, which has no pystray/Pillow — and
we cannot assume the user has *any* other Python, since they installed a zip from
the Plugin Manager and may never have run pip. Hunting the machine for a suitable
interpreter is what this used to do, and it failed for exactly that person.
Pillow also ships compiled C extensions, so it can't be vendored as source.

Launching the agent isn't a privilege escalation, incidentally — the plugin already
runs arbitrary Python inside KiCad with your full rights. It only ever launches our
own binary, resolved relative to the plugin, and only when you ask. (A *web page*
could never do this: browsers can't spawn local processes. The web UI can only talk
to the agent once it's already running.)

### KiCad's backups and generated files

KiCad's auto-backup is **on by default** and keeps up to 25 zips / 100 MB per
project in a `<project>-backups/` folder, plus `-bak` files, autosaves and caches.
None of it says anything about your design, and there can be dozens of entries per
real edit — which is exactly how the board you actually changed gets buried.

Both the plugin's change list and the web history fold them behind a count.
**Folded, not filtered**: the files really are in the commit / the working tree, and
a list that silently omitted them would be lying about the state of your repo.
Unfolding them is also how you notice they're being committed at all — the real fix
is a `.gitignore` entry, and both surfaces say so.

`backend/app/services/kicad_noise_service.py` is the single classifier. The backend
imports it; the agent loads it by path (and bundles it into the binary), the same way
it loads the diff engines. Two copies of these patterns would drift the first time
KiCad changed a suffix, and then a file hidden in one surface but shown in the other
is just confusing.

A noise file is never diffed, incidentally: a backup archive contains a *copy of the
board*, so diffing it would produce hundreds of phantom "changes" that are really
just the old design.

### Cross-probe

Clicking a change row jumps to that item **inside KiCad** — selected and zoomed —
not to a web page. You're already in the editor; that's where the item should
appear.

Board rows work on every KiCad version, via `pcbnew.FocusOnItem()`, resolving the
diff item back to a live `BOARD_ITEM` by uuid (with a footprint-reference fallback,
since traces and vias are keyed by geometry rather than uuid).

**Schematic rows are not clickable, on any current KiCad.** KiCad 8 has no
schematic Python API at all. KiCad 9's IPC API (`kipy`, from the `kicad-python`
package) can *read* the schematic selection but not set it — `add_to_selection`
exists for board documents only. Rather than ship a row that throws on first click,
schematic rows render identically but stay inert. `crossprobe.schematic_probe_available()`
is the single place to flip when the API gains the capability.

## Theming

`kicad_plugin/prism_theme.py` mirrors the web app's palette (the shadcn HSL tokens
in `frontend/src/index.css`, converted to hex). The dialog follows the OS/KiCad
light-or-dark appearance rather than forcing one — a light dialog inside a dark
KiCad looks broken.

If the web theme changes, regenerate those values rather than eyeballing new ones.

The buttons, badges and cards in `widgets.py` are **owner-drawn** on a `wx.Panel`
rather than being native controls. That looks like overkill until you try the
obvious thing: on Windows `wx.Button` is a native control that *ignores*
`SetBackgroundColour`, so giving it the app's light-on-blue primary style yields
light text on an unchanged light background — invisible. Drawing them ourselves is
the only reliable way to match the web UI's filled buttons, and it makes the
hover/press states behave the same on every platform.

## Layout

```
tools/
  agent_main.py         PyInstaller entry point (see below)
  build_agent.py        builds the agent into one executable
  package_plugin.py     assembles the KiCad PCM zip
  install_plugin.py     symlink the plugin into KiCad (development)

  prism_agent/          the agent — ships as a binary (source needs pystray+Pillow)
    __main__.py           tray icon, menu, lifecycle
    server.py             the loopback HTTP API
    projects.py           project detection + git status
    prism_client.py       Prism backend client
    discovery.py          how the plugin finds the agent
    settings.py           persisted settings
    autostart.py          run at login (per-OS)
    protocol.py           prism:// links (per-OS)
    worktree_diff.py      uncommitted changes: HEAD vs disk
    diff_grouping.py      port of the web UI's diff-grouping.ts — keep in sync
    assets/               the Prism logo (tray icon)

  kicad_plugin/         the plugin (stdlib + KiCad's wx only)
    __init__.py           the pcbnew ActionPlugin
    first_run.py          setup on first launch
    dialog.py             the main dialog
    settings_dialog.py    settings
    widgets.py            owner-drawn Button/Badge/Card/ScrollThumb
    crossprobe.py         jump to a changed item inside KiCad
    agent_launcher.py     finds and starts the agent binary
    agent_client.py       talks to the agent
    prism_theme.py        the palette
    assets/, icon.png     the Prism logo
```

Three things in here look redundant and aren't:

**`agent_main.py`** exists because PyInstaller runs its entry script with no package
context, so pointing it at `prism_agent/__main__.py` dies on the first relative
import.

**`discovery.py` is duplicated in miniature inside `agent_client.py`.** The plugin
is installed on its own and cannot import the agent package. Both are tiny; keep
them in sync.

**`diff_grouping.py` is a port of the frontend's `diff-grouping.ts`.** TypeScript
can't be imported, and both surfaces must group a board's changes identically. The
diff *engines* and the noise classifier are genuinely shared — the agent loads the
backend's own modules by path (and bundles them into the binary) rather than keeping
a second copy that would drift.
