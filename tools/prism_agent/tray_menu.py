"""A click-to-open menu for the tray icon, where pystray's backend has none.

pystray's X11 backend, the only one a self-contained Linux agent can use (its
AppIndicator and GTK backends need PyGObject), does not do menus at all: it declares
HAS_MENU = False, and a click only fires the menu's *default* item. On Linux the icon
therefore did nothing when clicked, left or right.

So on that backend a hidden default item opens this instead: the same pystray menu
(same items, labels, visibility and checkmarks, read live at click time), drawn by
tkinter in a short-lived helper process, `--tray-menu SPEC`. The helper prints the id
of what was picked and exits; the agent then runs that item's own action. Nothing is
duplicated: the pystray menu stays the single definition of what the tray offers.

A separate process for the same reason as `--notify`: tkinter must not run on a
background thread while pystray owns the tray's event loop.

Limits, worth knowing: only a left click reaches us (the X11 backend ignores the
others), and it only helps where the legacy (XEmbed) icon can be shown at all, see
the Linux section of tools/README.md.
"""

from __future__ import annotations

import json
import logging

log = logging.getLogger(__name__)

# Give up on a menu nobody closes, so a stray helper can never linger.
_OPEN_FOR_SECONDS = 120


def describe(menu, separator, prefix: str = "") -> tuple[list[dict], dict]:
    """The visible items of a pystray `menu`, as plain data, plus id -> item.

    Iterating a pystray Menu yields only visible items, separators already tidied, and
    each item's text/enabled/checked are evaluated now, so this is the menu as it is
    at the moment of the click (signed in or out, which KiCad is ticked).

    `separator` is pystray.Menu.SEPARATOR, passed in so this module needs no pystray.
    """
    spec: list[dict] = []
    items: dict = {}
    for index, item in enumerate(menu):
        item_id = f"{prefix}{index}"
        if item is separator:
            spec.append({"separator": True})
            continue
        entry = {
            "id": item_id,
            "text": str(item.text),
            "enabled": bool(item.enabled),
            "checked": item.checked,
            "radio": bool(item.radio),
        }
        if item.submenu is not None:
            entry["items"], sub = describe(item.submenu, separator, prefix=f"{item_id}/")
            items.update(sub)
        else:
            items[item_id] = item
        spec.append(entry)
    return spec, items


def show(spec: list[dict]) -> str:
    """Pop the menu up at the pointer and return the chosen id, or "" if dismissed.

    Runs in the `--tray-menu` helper process, never in the agent itself.
    """
    import tkinter as tk

    from . import dialogs

    theme = dialogs._theme()
    # Dark: it drops down from a panel, and GNOME's top bar is black. Linux has no
    # dark-mode setting we could read (see dialogs._prefers_dark).
    pal = theme.palette(dark=True) if theme is not None else dialogs._FALLBACK

    root = tk.Tk()
    root.withdraw()
    chosen = {"id": ""}

    def pick(item_id):
        chosen["id"] = item_id
        root.quit()

    def build(parent, entries):
        menu = tk.Menu(
            parent,
            tearoff=0,
            bg=pal["background"],
            fg=pal["foreground"],
            activebackground=pal["primary"],
            activeforeground=pal.get("primary_fg", pal["foreground"]),
            disabledforeground=pal["muted_fg"],
            relief="flat",
            borderwidth=1,
        )
        for entry in entries:
            if entry.get("separator"):
                menu.add_separator()
                continue
            state = "normal" if entry.get("enabled", True) else "disabled"
            if "items" in entry:
                menu.add_cascade(
                    label=entry["text"], menu=build(menu, entry["items"]), state=state
                )
            elif entry.get("checked") is not None:
                # A tick shown as text: tk's own check indicator ignores the palette
                # and is near invisible on a dark menu.
                if not entry["checked"]:
                    mark = "    "
                elif entry.get("radio"):
                    mark = "● "
                else:
                    mark = "✓ "
                menu.add_command(
                    label=mark + entry["text"],
                    state=state,
                    command=lambda i=entry["id"]: pick(i),
                )
            else:
                menu.add_command(
                    label=entry["text"],
                    state=state,
                    command=lambda i=entry["id"]: pick(i),
                )
        return menu

    menu = build(root, spec)
    x, y = root.winfo_pointerxy()

    def closed_without_a_choice():
        # tk_popup returns at once; a menu dismissed by clicking elsewhere just unmaps.
        if not menu.winfo_ismapped():
            root.quit()
        else:
            root.after(200, closed_without_a_choice)

    try:
        menu.tk_popup(x, y)
    finally:
        menu.grab_release()
    root.after(500, closed_without_a_choice)
    root.after(_OPEN_FOR_SECONDS * 1000, root.quit)
    root.mainloop()
    root.destroy()
    return chosen["id"]


def run_helper(spec_json: str) -> int:
    """The `--tray-menu` entry point: show, print the chosen id, exit."""
    try:
        choice = show(json.loads(spec_json))
    except Exception:  # noqa: BLE001 - a menu that can't open must not look like a crash
        log.warning("couldn't show the tray menu", exc_info=True)
        choice = ""
    print(choice, flush=True)
    return 0
