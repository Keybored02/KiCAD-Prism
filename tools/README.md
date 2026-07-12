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

## Tray agent

```bash
pip install -r tools/prism_agent/requirements.txt
python -m prism_agent                    # from the tools/ directory
python -m prism_agent --no-tray          # headless
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
POST /open-in-prism {project_id}   opens the web app in the browser
```

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

## KiCad plugin

```bash
python tools/install_plugin.py               # symlink into KiCad's plugin dir
python tools/install_plugin.py --uninstall
python tools/install_plugin.py --dir <path>  # pick the KiCad version yourself
```

It **symlinks** rather than copies, so the repo stays the single source of truth:
edit the plugin here and KiCad picks it up on *Tools → External Plugins → Refresh*.
No copy step to forget, and no risk of editing an installed copy and losing the
work. If the OS refuses symlinks (Windows without Developer Mode/admin) it falls
back to copying and **says so** — a silent copy would quietly turn every later
edit into a no-op.

Autodetect prefers a KiCad version that is actually **installed**: KiCad leaves a
config dir behind for every version you've ever run, so the newest config dir is
often an orphan, and installing into it means the plugin silently never appears.

Then in KiCad: **Tools → External Plugins → Prism** (or the toolbar button).

If the agent isn't running, the dialog offers a **Start agent** button (and shows
the command in a selectable field, so it can be copied). It launches the agent
*detached* — it has to outlive KiCad, which is the whole premise — on a **system**
Python, not KiCad's: the agent needs pystray and Pillow, and KiCad's embedded
Python doesn't have them. That's also why the agent can't simply be bundled into
the plugin: Pillow ships compiled C extensions, so it can't be vendored as source.

Launching it is not an escalation, incidentally — the plugin already runs arbitrary
Python inside KiCad with your full rights. It only ever launches our own module, by
path, on an explicit click. (A *web page* could never do this: browsers can't spawn
local processes. The web UI can only talk to the agent once it's already running.)

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
  prism_agent/          the tray agent (needs pystray + Pillow)
    __main__.py           tray icon, menu, lifecycle
    server.py             the loopback HTTP API
    projects.py           project detection + git status
    prism_client.py       Prism backend client
    discovery.py          how the plugin finds the agent
    worktree_diff.py      uncommitted changes: HEAD vs disk
    diff_grouping.py      port of the web UI's diff-grouping.ts — keep in sync
    assets/               the Prism logo (tray icon)
  kicad_plugin/         the KiCad plugin (stdlib + wx only)
    __init__.py           the pcbnew ActionPlugin
    dialog.py             the themed wx dialog
    widgets.py            owner-drawn Button/Badge/Card
    agent_client.py       talks to the agent
    prism_theme.py        the palette
    assets/, icon.png     the Prism logo (toolbar + dialog header)
  install_plugin.py     symlink/copy the plugin into KiCad
```

`discovery.py` is duplicated in miniature inside `agent_client.py` on purpose: the
plugin is linked into KiCad's plugin dir on its own and cannot import the agent
package. Both are tiny; keep them in sync.
