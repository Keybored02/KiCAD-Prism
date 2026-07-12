"""Themed widgets that actually look like the web app.

Why these exist: on Windows, wx.Button is a native control that *ignores*
SetBackgroundColour. Setting a light foreground on it therefore produces light
text on the unchanged light native background — invisible. The only reliable way
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


def _mix(a: str, b: str, t: float) -> wx.Colour:
    """Blend two hex colours — used for hover/press states, like the web UI's
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
        dc.SetBackground(wx.Brush(self.GetParent().GetBackgroundColour()))
        dc.Clear()

        fill, text_colour, border = self._colours()

        if fill is not None:
            gc.SetBrush(wx.Brush(fill))
            gc.SetPen(wx.Pen(border) if border else wx.TRANSPARENT_PEN)
            gc.DrawRoundedRectangle(0.5, 0.5, w - 1, h - 1, self.RADIUS)

        gc.SetFont(self._font(), text_colour)
        tw, tht = gc.GetTextExtent(self.label)[:2]
        gc.DrawText(self.label, (w - tw) / 2, (h - tht) / 2)


class Badge(wx.Panel):
    """A status pill, like the chips in the web app."""

    RADIUS = 8

    def __init__(self, parent, label, pal, tone="muted"):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.label = label
        self.pal = pal
        self.tone = tone  # muted | success | warning | destructive | primary
        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)

        dc = wx.ClientDC(self)
        f = self.GetFont()
        f.SetPointSize(th.FONT_SMALL)
        f.SetWeight(wx.FONTWEIGHT_BOLD)
        dc.SetFont(f)
        w, h = dc.GetTextExtent(label)
        self.SetMinSize(wx.Size(w + 16, h + 6))

        self.Bind(wx.EVT_PAINT, self._on_paint)

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(self.GetParent().GetBackgroundColour()))
        dc.Clear()

        w, h = self.GetSize()
        accent = self.pal.get(self.tone, self.pal["muted_fg"])
        # Tinted background + solid text, like the web's bg-x/10 text-x badges.
        gc.SetBrush(wx.Brush(_mix(self.pal["background"], accent, 0.16)))
        gc.SetPen(wx.TRANSPARENT_PEN)
        gc.DrawRoundedRectangle(0, 0, w, h, self.RADIUS)

        f = self.GetFont()
        f.SetPointSize(th.FONT_SMALL)
        f.SetWeight(wx.FONTWEIGHT_BOLD)
        gc.SetFont(f, _c(accent))
        tw, tht = gc.GetTextExtent(self.label)[:2]
        gc.DrawText(self.label, (w - tw) / 2, (h - tht) / 2)


class Card(wx.Panel):
    """A bordered, rounded surface — the app's dominant layout primitive."""

    RADIUS = 8

    def __init__(self, parent, title, pal):
        super().__init__(parent, style=wx.TRANSPARENT_WINDOW)
        self.pal = pal
        self.SetBackgroundStyle(wx.BG_STYLE_PAINT)
        self.Bind(wx.EVT_PAINT, self._on_paint)

        outer = wx.BoxSizer(wx.VERTICAL)
        inner = wx.BoxSizer(wx.VERTICAL)

        heading = wx.StaticText(self, label=title.upper())
        heading.SetForegroundColour(_c(pal["muted_fg"]))
        hf = heading.GetFont()
        hf.SetPointSize(th.FONT_SMALL)
        hf.SetWeight(wx.FONTWEIGHT_BOLD)
        heading.SetFont(hf)
        inner.Add(heading, 0, wx.BOTTOM, th.SP_SM)

        self.body = wx.BoxSizer(wx.VERTICAL)
        inner.Add(self.body, 1, wx.EXPAND)

        outer.Add(inner, 1, wx.EXPAND | wx.ALL, th.SP_MD)
        self.SetSizer(outer)

    def _on_paint(self, _e):
        dc = wx.AutoBufferedPaintDC(self)
        gc = wx.GraphicsContext.Create(dc)
        if not gc:
            return
        dc.SetBackground(wx.Brush(self.GetParent().GetBackgroundColour()))
        dc.Clear()
        w, h = self.GetSize()
        gc.SetBrush(wx.Brush(_c(self.pal["card"])))
        gc.SetPen(wx.Pen(_c(self.pal["border"])))
        gc.DrawRoundedRectangle(0.5, 0.5, w - 1, h - 1, self.RADIUS)

    def row(self, label, value, mono=False, tone=None, badge=False):
        """A label/value line. `badge=True` renders the value as a status pill."""
        line = wx.BoxSizer(wx.HORIZONTAL)

        lbl = wx.StaticText(self, label=label)
        lbl.SetForegroundColour(_c(self.pal["muted_fg"]))
        lf = lbl.GetFont()
        lf.SetPointSize(th.FONT_BODY)
        lbl.SetFont(lf)
        line.Add(lbl, 0, wx.ALIGN_CENTER_VERTICAL)
        line.AddStretchSpacer()

        if badge:
            line.Add(
                Badge(self, str(value), self.pal, tone or "muted"),
                0,
                wx.ALIGN_CENTER_VERTICAL,
            )
        else:
            val = wx.StaticText(self, label=str(value))
            val.SetForegroundColour(
                _c(self.pal[tone] if tone else self.pal["foreground"])
            )
            vf = val.GetFont()
            vf.SetPointSize(th.FONT_BODY)
            if mono:
                vf.SetFaceName(th.FONT_MONO_FAMILY)
            val.SetFont(vf)
            line.Add(val, 0, wx.ALIGN_CENTER_VERTICAL)

        self.body.Add(line, 0, wx.EXPAND | wx.BOTTOM, th.SP_XS + 2)
