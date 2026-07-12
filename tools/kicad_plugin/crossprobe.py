"""Cross-probe a changed item into KiCad itself — select it and zoom to it.

Clicking a change row should take you to that item *in the editor you're already
in*, not to a web page. Two different mechanisms are needed, because KiCad exposes
two very different APIs:

PCB (all versions)
    pcbnew.FocusOnItem(item) selects the item and centres the canvas on it. We
    resolve our diff item back to a real BOARD_ITEM by uuid (KIID), falling back
    to a footprint reference when the item has no usable uuid — segments, for
    instance, are keyed by geometry in the diff, not by uuid.

Schematic (not possible on any current KiCad)
    KiCad 8 has no schematic Python API at all — the plugin system is pcbnew-only.
    KiCad 9 added the IPC API (`kipy`), but its schematic module can only *read*
    the selection (`get_selection_as_string`); `add_to_selection` exists for board
    documents only. So nothing can drive eeschema's selection from outside today.

    Rather than ship a button that throws on first click, schematic rows are simply
    not clickable, and probe_schematic explains why. When the API gains the
    capability, schematic_probe_available() is the single place to flip.
"""

from __future__ import annotations

import pcbnew


class ProbeError(Exception):
    """Cross-probe couldn't be done, with a reason worth showing the user."""


def kicad_version() -> tuple[int, ...]:
    """(major, minor) of the running KiCad."""
    raw = pcbnew.GetBuildVersion()  # e.g. "8.0.7" or "9.0.1-rc1"
    parts = []
    for chunk in raw.lstrip("v").split(".")[:2]:
        digits = ""
        for ch in chunk:
            if ch.isdigit():
                digits += ch
            else:
                break
        parts.append(int(digits) if digits else 0)
    return tuple(parts)


# -- PCB ------------------------------------------------------------------


def _find_board_item(board, item_id: str, reference: str = ""):
    """Resolve a diff item back to the live BOARD_ITEM.

    Diff items key on uuid where KiCad has one. Segments/vias don't get a stable
    uuid in our extractor (they're keyed by geometry), so for those we fall back
    to the footprint reference when one is available.
    """
    if item_id:
        try:
            kiid = pcbnew.KIID(item_id)
        except Exception:
            kiid = None
        if kiid is not None:
            try:
                found = board.GetItem(kiid)
            except AttributeError:
                found = None  # older SWIG bindings lack BOARD.GetItem
            if found is not None and found.GetTypeDesc():
                return found

            # No BOARD.GetItem (KiCad 8): scan. A board has thousands of items,
            # not millions, and this only runs on an explicit click.
            for fp in board.GetFootprints():
                if str(fp.m_Uuid.AsString()) == item_id:
                    return fp
            for trk in board.GetTracks():
                if str(trk.m_Uuid.AsString()) == item_id:
                    return trk
            for dwg in board.GetDrawings():
                if str(dwg.m_Uuid.AsString()) == item_id:
                    return dwg

    if reference:
        for fp in board.GetFootprints():
            if fp.GetReference() == reference:
                return fp
    return None


def probe_pcb(item_id: str, reference: str = "") -> None:
    """Select the item in pcbnew and zoom to it."""
    board = pcbnew.GetBoard()
    if board is None:
        raise ProbeError("No board is open in pcbnew.")

    item = _find_board_item(board, item_id, reference)
    if item is None:
        raise ProbeError(
            "Couldn't find that item on the current board.\n\n"
            "It may have been changed or removed since the diff was computed — "
            "hit Refresh."
        )

    # FocusOnItem selects it and centres the view. Clear first so we don't
    # accumulate a growing selection across clicks.
    try:
        pcbnew.FocusOnItem(None)
    except Exception:
        pass
    pcbnew.FocusOnItem(item)
    pcbnew.Refresh()


# -- Schematic ------------------------------------------------------------


def schematic_probe_available() -> bool:
    """Can we select a symbol in eeschema?

    No — not on any KiCad released so far, and this returns False everywhere. It's
    a function rather than a constant so the dialog asks the question instead of
    hard-coding the answer, and so there's exactly one place to flip when the API
    grows the capability.

    The detail, since it's easy to assume otherwise: KiCad 8 has no schematic
    Python API at all (the plugin system is pcbnew-only). KiCad 9 added the IPC API
    (`kipy`, from the `kicad-python` package), but as of 0.7.1 its schematic module
    exposes only `get_selection_as_string` — it can *read* the selection, not set
    it. Board documents get `add_to_selection` / `clear_selection`; schematics
    don't. So there is currently no supported way to drive eeschema's selection
    from outside, and pretending otherwise would just throw AttributeError on the
    user's first click.
    """
    return False


def probe_schematic(item_id: str, reference: str = "") -> None:
    """Would select a symbol in eeschema — if any KiCad API allowed it."""
    version = ".".join(str(n) for n in kicad_version())
    if kicad_version() < (9,):
        raise ProbeError(
            "KiCad %s has no Python API for the schematic editor, so the plugin "
            "can't jump to a symbol here.\n\n"
            "Board items still cross-probe normally." % version
        )
    raise ProbeError(
        "KiCad %s's IPC API can read the schematic selection but not set it "
        "(kicad-python exposes add_to_selection for boards only), so the plugin "
        "can't jump to a symbol yet.\n\n"
        "Board items still cross-probe normally." % version
    )


def probe(kind: str, item_id: str, reference: str = "") -> None:
    """Cross-probe a change row into the right KiCad editor."""
    if kind == "pcb":
        probe_pcb(item_id, reference)
    elif kind == "sch":
        probe_schematic(item_id, reference)
    else:
        raise ProbeError("That change isn't something KiCad can jump to.")
