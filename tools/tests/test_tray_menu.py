"""The Linux tray's click menu reproduces the real pystray menu, live.

pystray's X11 backend has no menus (HAS_MENU = False) and a click only fires the
default item, so on Linux the icon did nothing when clicked. A hidden default item now
opens tray_menu's own popup, built from the same pystray menu. These pin that the
translation is faithful: only visible items, live text and checkmarks, submenus, and
that a picked id runs that item's own action.
"""

import sys
from pathlib import Path

import pystray

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import tray_menu  # noqa: E402


def _menu(ran, signed_in):
    return pystray.Menu(
        pystray.MenuItem("Menu", lambda: ran.append("popup"), default=True, visible=False),
        pystray.MenuItem(lambda _i: "Agent running on 127.0.0.1:1234", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Open Prism", lambda: ran.append("open")),
        pystray.MenuItem("Sign in", lambda: ran.append("in"), visible=lambda _i: not signed_in),
        pystray.MenuItem("Sign out", lambda: ran.append("out"), visible=lambda _i: signed_in),
        pystray.MenuItem(
            "Open files with",
            pystray.Menu(
                pystray.MenuItem("System default", lambda: ran.append("default"),
                                 checked=lambda _i: False, radio=True),
                pystray.MenuItem("KiCad 10.0", lambda: ran.append("kicad10"),
                                 checked=lambda _i: True, radio=True),
            ),
        ),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", lambda: ran.append("quit")),
    )


def test_only_visible_items_are_described_and_the_hidden_trigger_is_not():
    spec, _ = tray_menu.describe(_menu([], signed_in=False), pystray.Menu.SEPARATOR)

    texts = [e.get("text") for e in spec if not e.get("separator")]
    assert texts == [
        "Agent running on 127.0.0.1:1234",  # a callable label, evaluated now
        "Open Prism",
        "Sign in",  # signed out: Sign in shows, Sign out does not
        "Open files with",
        "Quit",
    ]
    assert "Menu" not in texts


def test_the_description_follows_the_state_at_click_time():
    spec, _ = tray_menu.describe(_menu([], signed_in=True), pystray.Menu.SEPARATOR)
    texts = [e.get("text") for e in spec if not e.get("separator")]

    assert "Sign out" in texts and "Sign in" not in texts


def test_separators_status_rows_and_checkmarks_come_through():
    spec, _ = tray_menu.describe(_menu([], signed_in=False), pystray.Menu.SEPARATOR)

    assert sum(1 for e in spec if e.get("separator")) == 2
    assert spec[0]["enabled"] is False  # the status row is informational
    kicad = next(e for e in spec if e.get("text") == "Open files with")
    assert [(i["text"], i["checked"], i["radio"]) for i in kicad["items"]] == [
        ("System default", False, True),
        ("KiCad 10.0", True, True),
    ]


def test_a_picked_id_runs_that_items_own_action():
    ran = []
    menu = _menu(ran, signed_in=False)
    spec, items = tray_menu.describe(menu, pystray.Menu.SEPARATOR)
    kicad = next(e for e in spec if e.get("text") == "Open files with")
    quit_id = next(e["id"] for e in spec if e.get("text") == "Quit")

    items[kicad["items"][1]["id"]](None)
    items[quit_id](None)

    assert ran == ["kicad10", "quit"]


def test_a_menu_that_cannot_open_prints_no_choice(monkeypatch, capsys):
    def boom(_spec):
        raise RuntimeError("no display")

    monkeypatch.setattr(tray_menu, "show", boom)

    assert tray_menu.run_helper("[]") == 0
    assert capsys.readouterr().out.strip() == ""
