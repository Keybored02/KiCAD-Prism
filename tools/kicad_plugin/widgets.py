"""Themed widgets that actually look like the web app.

Why these exist: on Windows, wx.Button is a native control that *ignores*
SetBackgroundColour. Setting a light foreground on it therefore produces light
text on the unchanged light native background, invisible. The only reliable way
to get the app's filled "primary" button is to own the drawing.

These are owner-drawn on a wx.Panel: we control the fill, the radius, the hover
and press states, and the text colour, so they render identically on every
platform and genuinely match the web UI's button styles.
"""

from __future__ import annotations

import wx

from . import prism_theme as th


def _c(hex_value: str) -> wx.Colour:
    return wx.Colour(*th.hex_to_rgb(hex_value))


def _surface_of(window: wx.Window, pal: dict) -> wx.Colour:
    """The colour a transparent widget must paint before drawing on itself.

    NOT GetParent().GetBackgroundColour(): a TRANSPARENT_WINDOW that never had its
    background set reports wx's default #F0F0F0 regardless of theme. Rows nested in
    a Card were therefore painting a near-white block and then drawing dark-theme
    (near-white) text on it, the unreadable white-on-white list.

    So widgets carry the surface they sit on explicitly. Walk up to the nearest
    ancestor that declares one; fall back to the theme's page background.
    """
    node = window.GetParent()
    while node is not None:
        surface = getattr(node, "surface", None)
        if surface is not None:
            return _c(surface) if isinstance(surface, str) else surface
        node = node.GetParent()
    return _c(pal["background"])


def _mix(a: str, b: str, t: float) -> wx.Colour:
    """Blend two hex colours, used for hover/press states, like the web UI's
    hover:bg-primary/90."""
    ar, ag, ab = th.hex_to_rgb(a)
    br, bg, bb = th.hex_to_rgb(b)
    return wx.Colour(
        int(ar + (br - ar) * t),
        int(ag + (bg - ag) * t),
        int(ab + (bb - ab) * t),
    )


class Button(wx.Panel):
    """An owner-drawn button matching the web app's variants.

    variant: "primary"   filled blue, light text   (the app's default action)
             "secondary" muted fill, normal text
             "ghost"     transparent until hovered
    """

    RADIUS = 6
    PAD_X = 14
    PAD_Y = 7

    def __init__(self, parent, label, pal, variant="secondary", on_click=None):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.label = label
        self.pal = pal
        self.variant = variant
        self.on_click = on_click
        self._hover = False
        self._pressed = False
        self._enabled = True

        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)  # we paint every pixel
        self.SetCursor(wx.Cursor(wx.CURSOR_HAND))
        self.SetMinSize(self._measure())

        self.Bind(wx.EVT_PAINT, self._on_paint)
        self.Bind(wx.EVT_ENTER_WINDOW, self._on_enter)
        self.Bind(wx.EVT_LEAVE_WINDOW, self._on_leave)
        self.Bind(wx.EVT_LEFT_DOWN, self._on_down)
        self.Bind(wx.EVT_LEFT_UP, self._on_up)

    # -- sizing ------------------------------------------------------------

    def _font(self) -> wx.Font:
        f = self.GetFont()
        f.SetPointSize(th.FONT_BODY)
        f.SetWeight(wx.FONTWEIGHT_SEMIBOLD)
        return f

    def _measure(self) -> wx.Size:
        dc = wx.ClientDC(self)
        dc.SetFont(self._font())
        w, h = dc.GetTextExtent(self.label)
        return wx.Size(w + self.PAD_X * 2, h + self.PAD_Y * 2)

    # -- state -------------------------------------------------------------

    def Enable(self, enable=True):  # noqa: N802 - wx naming
        self._enabled = enable
        self.SetCursor(wx.Cursor(wx.CURSOR_HAND if enable else wx.CURSOR_ARROW))
        self.Refresh()
        return super().Enable(enable)

    def _on_enter(self, _e):
        self._hover = True
        self.Refresh()

    def _on_leave(self, _e):
        self._hover = self._pressed = False
        self.Refresh()

    def _on_down(self, _e):
        if self._enabled:
            self._pressed = True
            self.Refresh()

    def _on_up(self, _e):
        was_pressed = self._pressed
        self._pressed = False
        self.Refresh()
        if was_pressed and self._enabled and self.on_click:
            self.on_click()

    # -- painting ----------------------------------------------------------

    def _colours(self) -> tuple[wx.Colour, wx.Colour, wx.Colour | None]:
        """(fill, text, border)"""
        p = self.pal
        if not self._enabled:
            return _c(p["muted"]), _c(p["muted_fg"]), None

        if self.variant == "primary":
            fill = p["primary"]
            # Darken on hover/press, mirroring hover:bg-primary/90 in the web UI.
            if self._pressed:
                return _mix(fill, p["foreground"], 0.25), _c(p["primary_fg"]), None
            if self._hover:
                return _mix(fill, p["foreground"], 0.12), _c(p["primary_fg"]), None
            return _c(fill), _c(p["primary_fg"]), None

        if self.variant == "ghost":
            if self._pressed or self._hover:
                return _c(p["accent"]), _c(p["foreground"]), None
            return None, _c(p["muted_fg"]), None

        # secondary
        if self._pressed:
            return (
                _mix(p["muted"], p["foreground"], 0.12),
                _c(p["foreground"]),
                _c(p["border"]),
            )
        if self._hover:
            return _c(p["accent"]), _c(p["foreground"]), _c(p["border"])
        return _c(p["muted"]), _c(p["foreground"]), _c(p["border"])

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return

        w, h = self.GetSize()
        # Paint the parent's colour first so our rounded corners aren't boxed in.
        dc.SetBackground(wx.Brush(_surface_of(self, self.pal)))
        dc.Clear()

        fill, text_colour, border = self._colours()

        if fill is not None:
            gc.SetBrush(wx.Brush(fill))
            gc.SetPen(wx.Pen(border) if border else wx.TRANSPARENT_PEN)
            gc.DrawRoundedRectangle(0.5, 0.5, w - 1, h - 1, self.RADIUS)

        gc.SetFont(self._font(), text_colour)
        tw, tht = gc.GetTextExtent(self.label)[:2]
        gc.DrawText(self.label, (w - tw) / 2, (h - tht) / 2)


class StatusIcon(wx.Panel):
    """An icon whose colour carries its state, with a tooltip that says it in words.

    Colour alone is not a status: it means nothing to someone who can't see it, and
    nothing to someone who doesn't know the convention. So the tooltip is not optional,
    it is the actual message, and the colour is the shortcut.
    """

    SIZE = 18

    def __init__(self, parent, kind, pal, tone="muted_fg", tooltip=""):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.kind = kind  # server | project
        self.pal = pal
        self.tone = tone
        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)
        self.SetMinSize(wx.Size(self.SIZE + 8, self.SIZE + 8))
        self.SetToolTip(tooltip)
        self.Bind(wx.EVT_PAINT, self._on_paint)

    def set(self, tone: str, tooltip: str) -> None:
        self.tone = tone
        self.SetToolTip(tooltip)
        self.Refresh()

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(_surface_of(self, self.pal)))
        dc.Clear()

        w, h = self.GetSize()
        colour = _c(self.pal.get(self.tone, self.pal["muted_fg"]))
        draw_kind_icon(
            gc,
            self.kind,
            (w - self.SIZE) / 2,
            (h - self.SIZE) / 2,
            colour,
            size=self.SIZE,
        )


class Badge(wx.Panel):
    """A status pill, like the chips in the web app."""

    RADIUS = 8

    def __init__(self, parent, label, pal, tone="muted", size=None):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.label = label
        self.pal = pal
        self.tone = tone  # muted | success | warning | destructive | primary
        # Point size for the text. Defaults to the small type these pills normally use;
        # the branch tag wants a touch more presence.
        self.size = size or th.FONT_SMALL
        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)

        self._resize()
        # Bound ONCE, here. It used to live in _resize(), which set_label() calls, so
        # every relabel stacked another paint handler on the widget.
        self.Bind(wx.EVT_PAINT, self._on_paint)

    def set_label(self, label: str, tone: str | None = None) -> None:
        """Relabel and resize. A badge built empty and filled in later (a branch name we
        don't know until the agent answers) would otherwise keep its zero width."""
        self.label = label
        if tone is not None:
            self.tone = tone
        self._resize()
        self.Refresh()

    def _resize(self) -> None:
        # Set the font on the window, then measure with it, so the size we reserve and
        # the size we paint agree. Falls back to a single character for an empty label
        # (the branch tag before the agent has answered) so the pill keeps a sane height.
        f = self.GetFont()
        f.SetPointSize(self.size)
        f.SetWeight(wx.FONTWEIGHT_BOLD)
        self.SetFont(f)
        w, h = self.GetTextExtent(self.label or "x")
        self.SetMinSize(wx.Size(w + 16, h + 6))

    def _colours(self) -> tuple[str, str, float]:
        """(fill, text, how strongly to tint the fill).

        `muted` is a BACKGROUND colour (#F1F5F9 on light). Drawing text in it puts
        near-white on a white card, which is why the branch and SHA tags vanished. So a
        neutral badge fills with `muted` and takes its text from `muted_fg`, and fills
        fully, since that colour was chosen to sit behind text.

        The coloured tones are the opposite: the accent IS the text, and the fill is a
        faint wash of it (the web's `bg-x/10 text-x`). Tinting those as strongly as the
        neutral one drags the contrast under 2:1 and makes them unreadable.
        """
        if self.tone == "muted":
            return self.pal["muted"], self.pal["muted_fg"], 1.0
        accent = self.pal.get(self.tone, self.pal["muted_fg"])
        return accent, accent, 0.18

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(_surface_of(self, self.pal)))
        dc.Clear()

        w, h = self.GetSize()
        fill, text, strength = self._colours()

        # Tint against the surface we're actually on (a card), not the page: on a dark
        # card, blending toward the page colour would wash the pill out.
        surface = _surface_of(self, self.pal)
        gc.SetBrush(
            wx.Brush(_mix(surface.GetAsString(wx.C2S_HTML_SYNTAX), fill, strength))
        )
        gc.SetPen(wx.TRANSPARENT_PEN)
        gc.DrawRoundedRectangle(0, 0, w, h, self.RADIUS)

        f = self.GetFont()
        f.SetPointSize(self.size)
        f.SetWeight(wx.FONTWEIGHT_BOLD)
        gc.SetFont(f, _c(text))
        tw, tht = gc.GetTextExtent(self.label)[:2]
        gc.DrawText(self.label, (w - tw) / 2, (h - tht) / 2)


def _ellipsise(gc, text: str, max_width: float) -> str:
    """Trim text to fit, with an ellipsis.

    Measured rather than cut at a character count: the labels are proportional, so
    a fixed length would clip "GND, 12 wires" and "J102 (Η1)" inconsistently.
    """
    if max_width <= 0 or not text:
        return ""
    if gc.GetTextExtent(text)[0] <= max_width:
        return text
    lo, hi = 0, len(text)
    while lo < hi:
        mid = (lo + hi) // 2
        if gc.GetTextExtent(text[:mid] + "...")[0] <= max_width:
            lo = mid + 1
        else:
            hi = mid
    return text[: max(0, lo - 1)] + "..."


def draw_kind_icon(
    gc, kind: str, x: float, y: float, colour: wx.Colour, size: float = 13
):
    """The web UI's file-kind icons, redrawn for wx.

    These are lucide's `CircuitBoard` (schematics) and `Cpu` (PCBs), the very
    icons frontend/src/components/history-viewer.tsx uses for the same job, so a
    file reads the same in KiCad as it does in the browser. The geometry is
    transcribed from lucide's 24x24 grid and scaled, not approximated by eye, and
    drawn rather than bitmapped so it stays crisp at any DPI and picks up the theme
    colour for free.
    """
    s = size / 24.0  # lucide authors on a 24x24 grid

    def px(a, b):
        return x + a * s, y + b * s

    # wx.Pen's width is an INT, passing a float raises TypeError, and inside a
    # paint handler that aborts the rest of the render (which is exactly why the
    # filename and count pill were missing). CreatePen takes a float.
    gc.SetPen(gc.CreatePen(wx.GraphicsPenInfo(colour).Width(1.5)))
    gc.SetBrush(wx.TRANSPARENT_BRUSH)

    if kind == "agent":
        # lucide "activity": a heartbeat trace. Reads as "this thing is alive", which is
        # exactly and only what the agent icon claims.
        pulse = gc.CreatePath()
        pulse.MoveToPoint(*px(22, 12))
        pulse.AddLineToPoint(*px(18, 12))
        pulse.AddLineToPoint(*px(15, 21))
        pulse.AddLineToPoint(*px(9, 3))
        pulse.AddLineToPoint(*px(6, 12))
        pulse.AddLineToPoint(*px(2, 12))
        gc.StrokePath(pulse)
        return

    if kind == "sch":
        # lucide "circuit-board": board outline, two traces, two pads.
        board = gc.CreatePath()
        board.AddRoundedRectangle(*px(3, 3), 18 * s, 18 * s, 2 * s)
        gc.StrokePath(board)

        traces = gc.CreatePath()
        traces.MoveToPoint(*px(11, 9))  # M11 9h4a2 2 0 0 0 2-2V3
        traces.AddLineToPoint(*px(15, 9))
        traces.AddLineToPoint(*px(17, 7))
        traces.AddLineToPoint(*px(17, 3))
        traces.MoveToPoint(*px(7, 21))  # M7 21v-4a2 2 0 0 1 2-2h4
        traces.AddLineToPoint(*px(7, 17))
        traces.AddLineToPoint(*px(9, 15))
        traces.AddLineToPoint(*px(13, 15))
        gc.StrokePath(traces)

        for cx, cy in ((9, 9), (15, 15)):  # the two pads
            pad = gc.CreatePath()
            pad.AddCircle(*px(cx, cy), 2 * s)
            gc.StrokePath(pad)
        return

    if kind == "pcb":
        # lucide "cpu": chip body, inner die, twelve pins.
        body = gc.CreatePath()
        body.AddRoundedRectangle(*px(4, 4), 16 * s, 16 * s, 2 * s)
        gc.StrokePath(body)

        die = gc.CreatePath()
        die.AddRoundedRectangle(*px(8, 8), 8 * s, 8 * s, 1 * s)
        gc.StrokePath(die)

        pins = gc.CreatePath()
        for a in (7, 12, 17):
            pins.MoveToPoint(*px(a, 2))  # top
            pins.AddLineToPoint(*px(a, 4))
            pins.MoveToPoint(*px(a, 20))  # bottom
            pins.AddLineToPoint(*px(a, 22))
            pins.MoveToPoint(*px(2, a))  # left
            pins.AddLineToPoint(*px(4, a))
            pins.MoveToPoint(*px(20, a))  # right
            pins.AddLineToPoint(*px(22, a))
        gc.StrokePath(pins)
        return

    if kind == "server":
        # lucide "server": two stacked racks, each with an LED.
        for top in (2, 14):
            rack = gc.CreatePath()
            rack.AddRoundedRectangle(*px(2, top), 20 * s, 8 * s, 2 * s)
            gc.StrokePath(rack)

            led = gc.CreatePath()
            led.MoveToPoint(*px(6, top + 4))
            led.AddLineToPoint(*px(6.01, top + 4))
            gc.StrokePath(led)
        return

    if kind == "git":
        # lucide "git-branch": a trunk, a branch, and the three nodes.
        lines = gc.CreatePath()
        lines.MoveToPoint(*px(6, 9))  # trunk, below the top node
        lines.AddLineToPoint(*px(6, 15))
        lines.MoveToPoint(*px(18, 9))  # branch curving down into the trunk
        lines.AddLineToPoint(*px(18, 11))
        lines.AddCurveToPoint(*px(18, 13), *px(16, 15), *px(12, 15))
        lines.AddLineToPoint(*px(9, 15))
        gc.StrokePath(lines)

        for cx, cy in ((6, 6), (18, 6), (6, 18)):
            node = gc.CreatePath()
            node.AddCircle(*px(cx, cy), 3 * s)
            gc.StrokePath(node)
        return

    if kind == "library":
        # lucide "library": three books on a shelf, the middle one tilted.
        books = gc.CreatePath()
        books.MoveToPoint(*px(4, 4))  # upright
        books.AddLineToPoint(*px(4, 20))
        books.MoveToPoint(*px(8, 4))
        books.AddLineToPoint(*px(8, 20))
        books.MoveToPoint(*px(12, 4))  # tilted
        books.AddLineToPoint(*px(16, 20))
        books.MoveToPoint(*px(16, 3))
        books.AddLineToPoint(*px(20, 19))
        gc.StrokePath(books)

        shelf = gc.CreatePath()
        shelf.MoveToPoint(*px(2, 21))
        shelf.AddLineToPoint(*px(22, 21))
        gc.StrokePath(shelf)
        return

    # anything else, a plain document outline
    doc = gc.CreatePath()
    doc.AddRectangle(*px(5, 2), 14 * s, 20 * s)
    gc.StrokePath(doc)


class Disclosure(wx.Panel):
    """A clickable ▸/▾ header that expands a section, like the web UI's commit rows.

    `kind` draws a board/schematic glyph so you can tell at a glance what a file is.
    `count` renders a trailing pill with the number of changes.
    """

    def __init__(
        self,
        parent,
        pal,
        label,
        on_toggle,
        expanded=False,
        accent=None,
        kind=None,
        count=None,
        strong=False,
    ):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.pal = pal
        self.label = label
        self.accent = accent  # optional tint for the icon (e.g. the file kind)
        self.expanded = expanded
        self.on_toggle = on_toggle
        self.kind = kind
        self.count = count
        self.strong = strong  # a section header rather than a file row
        self._hover = False

        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)
        self.SetCursor(wx.Cursor(wx.CURSOR_HAND))

        dc = wx.ClientDC(self)
        dc.SetFont(self._font())
        self.SetMinSize(wx.Size(-1, dc.GetTextExtent(label or "X")[1] + 10))

        self.Bind(wx.EVT_PAINT, self._on_paint)
        self.Bind(wx.EVT_LEFT_UP, self._on_click)
        self.Bind(wx.EVT_ENTER_WINDOW, self._enter)
        self.Bind(wx.EVT_LEAVE_WINDOW, self._leave)

    def _font(self):
        f = self.GetFont()
        f.SetPointSize(th.FONT_BODY)
        f.SetWeight(wx.FONTWEIGHT_BOLD if self.strong else wx.FONTWEIGHT_SEMIBOLD)
        return f

    def _enter(self, _e):
        self._hover = True
        self.Refresh()

    def _leave(self, _e):
        self._hover = False
        self.Refresh()

    def _on_click(self, _e):
        self.expanded = not self.expanded
        self.Refresh()
        self.on_toggle(self.expanded)

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(_surface_of(self, self.pal)))
        dc.Clear()

        w, h = self.GetSize()
        if self._hover:
            gc.SetBrush(wx.Brush(_c(self.pal["accent"])))
            gc.SetPen(wx.TRANSPARENT_PEN)
            gc.DrawRoundedRectangle(0, 0, w, h, 4)

        font = self._font()
        text_colour = _c(self.pal["foreground"])

        # chevron
        gc.SetFont(font, _c(self.pal["muted_fg"]))
        gc.DrawText("▾" if self.expanded else "▸", 5, (h - 14) / 2)

        x = 19.0
        if self.kind:
            icon = 13.0
            draw_kind_icon(
                gc,
                self.kind,
                x,
                (h - icon) / 2,
                _c(self.accent or self.pal["muted_fg"]),
                size=icon,
            )
            x += icon + 7

        # trailing count pill, drawn first so the label knows its budget
        pill_w = 0.0
        if self.count is not None:
            small = wx.Font(font)
            small.SetPointSize(th.FONT_SMALL)
            small.SetWeight(wx.FONTWEIGHT_BOLD)
            gc.SetFont(small, _c(self.pal["muted_fg"]))
            txt = str(self.count)
            tw = gc.GetTextExtent(txt)[0]
            pill_w = tw + 14
            surface = _surface_of(self, self.pal).GetAsString(wx.C2S_HTML_SYNTAX)
            gc.SetBrush(wx.Brush(_mix(surface, self.pal["muted_fg"], 0.16)))
            gc.SetPen(wx.TRANSPARENT_PEN)
            gc.DrawRoundedRectangle(w - pill_w - 4, (h - 15) / 2, pill_w, 15, 7)
            gc.SetFont(small, _c(self.pal["muted_fg"]))
            gc.DrawText(txt, w - pill_w - 4 + 7, (h - gc.GetTextExtent(txt)[1]) / 2)

        gc.SetFont(font, text_colour)
        text = _ellipsise(gc, self.label, w - x - pill_w - 10)
        gc.DrawText(text, x, (h - gc.GetTextExtent(text or "X")[1]) / 2)


class ChangeRow(wx.Panel):
    """One grouped change: kind glyph, label, and its category.

    Mirrors the web UI's change rows, same +/−/~ glyph, same colour per kind,
    same trailing uppercase category, so a board reads the same in KiCad as in
    the browser.
    """

    def __init__(self, parent, pal, group, on_click=None):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.pal = pal
        self.group = group
        self.on_click = on_click
        self._hover = False

        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)
        if on_click:
            self.SetCursor(wx.Cursor(wx.CURSOR_HAND))
        self.SetMinSize(wx.Size(-1, 18))

        self.Bind(wx.EVT_PAINT, self._on_paint)
        self.Bind(wx.EVT_ENTER_WINDOW, self._enter)
        self.Bind(wx.EVT_LEAVE_WINDOW, self._leave)
        self.Bind(wx.EVT_LEFT_UP, self._click)

    def _enter(self, _e):
        self._hover = True
        self.Refresh()

    def _leave(self, _e):
        self._hover = False
        self.Refresh()

    def _click(self, _e):
        if self.on_click:
            self.on_click(self.group)

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(_surface_of(self, self.pal)))
        dc.Clear()

        w, h = self.GetSize()
        if self._hover and self.on_click:
            gc.SetBrush(wx.Brush(_c(self.pal["accent"])))
            gc.SetPen(wx.TRANSPARENT_PEN)
            gc.DrawRoundedRectangle(0, 0, w, h, 4)

        kind = self.group.get("kind", "changed")
        tone = self.pal[th.KIND_TONE.get(kind, "muted_fg")]

        body = self.GetFont()
        body.SetPointSize(th.FONT_SMALL)

        bold = wx.Font(body)
        bold.SetWeight(wx.FONTWEIGHT_BOLD)
        gc.SetFont(bold, _c(tone))
        gc.DrawText(th.KIND_SYMBOL.get(kind, "~"), 6, 2)

        # Category sits right-aligned; draw it first so we know what's left for
        # the label.
        cat = (self.group.get("category_label") or "").upper()
        gc.SetFont(body, _c(self.pal["muted_fg"]))
        cat_w = gc.GetTextExtent(cat)[0] if cat else 0
        if cat:
            gc.DrawText(cat, max(0, w - cat_w - 4), 2)

        gc.SetFont(body, _c(self.pal["foreground"]))
        gc.DrawText(_ellipsise(gc, self.group.get("label", ""), w - 32 - cat_w), 20, 2)


class ScrollThumb(wx.Panel):
    """A slim, themed scrollbar drawn over a ScrolledWindow.

    wx gives no way to recolour a native scrollbar: there's no SetScrollbarColour,
    and SetBackgroundColour on a native wx.ScrollBar is ignored, the same trap as
    wx.Button. So the native bar is hidden and this draws the overlay instead,
    which is also how the web app's thin scrollbars look.

    Draggable, and it tracks the window it scrolls.
    """

    WIDTH = 8

    def __init__(self, parent, target: wx.ScrolledWindow, pal):
        super().__init__(parent, size=wx.Size(self.WIDTH, -1))
        self.pal = pal
        self.target = target
        self._hover = False
        self._drag_from = None
        self._drag_origin = 0

        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)
        self.Bind(wx.EVT_PAINT, self._on_paint)
        self.Bind(wx.EVT_ENTER_WINDOW, self._enter)
        self.Bind(wx.EVT_LEAVE_WINDOW, self._leave)
        self.Bind(wx.EVT_LEFT_DOWN, self._down)
        self.Bind(wx.EVT_LEFT_UP, self._up)
        self.Bind(wx.EVT_MOTION, self._motion)

        # Follow whatever moves the view: wheel, keys, layout changes.
        target.Bind(wx.EVT_SCROLLWIN, self._on_target_scroll)

    # -- geometry ----------------------------------------------------------

    def _metrics(self):
        """(view_start, page_size, total) in scroll units."""
        total = self.target.GetScrollRange(wx.VERTICAL)
        page = self.target.GetScrollThumb(wx.VERTICAL)
        start = self.target.GetScrollPos(wx.VERTICAL)
        return start, page, total

    def _thumb_rect(self):
        start, page, total = self._metrics()
        h = self.GetSize().height
        if total <= 0 or page <= 0 or page >= total:
            return None  # nothing to scroll
        thumb_h = max(24, int(h * page / total))
        travel = h - thumb_h
        span = max(1, total - page)
        y = int(travel * start / span)
        return y, thumb_h

    # -- interaction -------------------------------------------------------

    def _enter(self, _e):
        self._hover = True
        self.Refresh()

    def _leave(self, _e):
        self._hover = False
        self.Refresh()

    def _on_target_scroll(self, e):
        self.Refresh()
        e.Skip()  # never swallow the real scroll

    def _down(self, e):
        rect = self._thumb_rect()
        if not rect:
            return
        y, thumb_h = rect
        if y <= e.GetY() <= y + thumb_h:
            self._drag_from = e.GetY()
            self._drag_origin = self.target.GetScrollPos(wx.VERTICAL)
            self.CaptureMouse()
        else:
            # Click the track: page toward the click, like a real scrollbar.
            _, page, _ = self._metrics()
            delta = page if e.GetY() > y else -page
            self._scroll_to(self.target.GetScrollPos(wx.VERTICAL) + delta)

    def _up(self, _e):
        if self.HasCapture():
            self.ReleaseMouse()
        self._drag_from = None

    def _motion(self, e):
        if self._drag_from is None or not e.Dragging():
            return
        rect = self._thumb_rect()
        if not rect:
            return
        _, thumb_h = rect
        _, page, total = self._metrics()
        travel = max(1, self.GetSize().height - thumb_h)
        moved = e.GetY() - self._drag_from
        self._scroll_to(self._drag_origin + int(moved * max(1, total - page) / travel))

    def _scroll_to(self, pos):
        _, page, total = self._metrics()
        pos = max(0, min(pos, max(0, total - page)))
        self.target.Scroll(-1, pos)
        self.Refresh()

    # -- painting ----------------------------------------------------------

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(_surface_of(self, self.pal)))
        dc.Clear()

        rect = self._thumb_rect()
        if not rect:
            return  # content fits; show nothing rather than an inert bar
        y, thumb_h = rect

        surface = _surface_of(self, self.pal).GetAsString(wx.C2S_HTML_SYNTAX)
        strength = 0.55 if self._hover or self._drag_from is not None else 0.32
        gc.SetBrush(wx.Brush(_mix(surface, self.pal["muted_fg"], strength)))
        gc.SetPen(wx.TRANSPARENT_PEN)
        w = self.GetSize().width
        gc.DrawRoundedRectangle(1, y, w - 2, thumb_h, (w - 2) / 2)


class Card(wx.Panel):
    """A bordered, rounded surface, the app's dominant layout primitive."""

    RADIUS = 8

    def __init__(self, parent, title, pal):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.pal = pal
        # What our children sit on. Declared so nested widgets can find it, see
        # _surface_of. Also set as the real background colour so native children
        # (StaticText, TextCtrl) inherit it instead of wx's default grey, which is
        # what made dark-theme labels unreadable.
        self.surface = pal["card"]
        self.SetBackgroundColour(_c(pal["card"]))
        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)
        self.Bind(wx.EVT_PAINT, self._on_paint)

        outer = wx.BoxSizer(wx.VERTICAL)
        inner = wx.BoxSizer(wx.VERTICAL)

        if title:
            heading = self.label(title.upper(), tone="muted_fg", bold=True, small=True)
            inner.Add(heading, 0, wx.BOTTOM, th.SP_SM)

        self.body = wx.BoxSizer(wx.VERTICAL)
        inner.Add(self.body, 1, wx.EXPAND)

        outer.Add(inner, 1, wx.EXPAND | wx.ALL, th.SP_MD)
        self.SetSizer(outer)

    def label(self, text, tone="foreground", bold=False, small=False, mono=False):
        """A StaticText that actually respects the theme.

        wx paints a StaticText's own background; left alone it uses the system
        default, so on a dark card you get theme-coloured text on a light block.
        Every label in a card must go through here.
        """
        st = wx.StaticText(self, label=str(text))
        st.SetBackgroundColour(_c(self.pal["card"]))
        st.SetForegroundColour(_c(self.pal.get(tone, tone)))
        f = st.GetFont()
        f.SetPointSize(th.FONT_SMALL if small else th.FONT_BODY)
        if bold:
            f.SetWeight(wx.FONTWEIGHT_BOLD)
        if mono:
            f.SetFaceName(th.FONT_MONO_FAMILY)
        st.SetFont(f)
        return st

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(_surface_of(self, self.pal)))
        dc.Clear()
        w, h = self.GetSize()
        gc.SetBrush(wx.Brush(_c(self.pal["card"])))
        gc.SetPen(wx.Pen(_c(self.pal["border"])))
        gc.DrawRoundedRectangle(0.5, 0.5, w - 1, h - 1, self.RADIUS)

    def row(self, label, value, mono=False, tone=None, badge=False):
        """A label/value line. `badge=True` renders the value as a status pill."""
        line = wx.BoxSizer(wx.HORIZONTAL)
        line.Add(self.label(label, tone="muted_fg"), 0, wx.ALIGN_CENTER_VERTICAL)
        line.AddStretchSpacer()

        if badge:
            line.Add(
                Badge(self, str(value), self.pal, tone or "muted"),
                0,
                wx.ALIGN_CENTER_VERTICAL,
            )
        else:
            line.Add(
                self.label(value, tone=tone or "foreground", mono=mono),
                0,
                wx.ALIGN_CENTER_VERTICAL,
            )

        self.body.Add(line, 0, wx.EXPAND | wx.BOTTOM, th.SP_XS + 2)
