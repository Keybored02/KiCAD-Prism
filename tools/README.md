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
```

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
POST /open-in-prism {project_id}   opens the web app in the browser
```

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
