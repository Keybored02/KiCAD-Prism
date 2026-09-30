"""Surgical edits to an s-expression file, preserving every byte we did not touch.

This is the write half of semantic merge, and it exists because the obvious approach
does not work: `kicad_monkey.roundtrip_sexp_text()` parses a board correctly but
re-serialises it lossily. It normalises floats (`12.000000` becomes `12`) and reflows
lines, turning a 3464-line board into 4526 lines. Rebuilding a file through any parser
therefore produces a diff touching thousands of lines nobody edited, which is useless
for review and risks changing values KiCad wrote deliberately.

So we never serialise. We take the ORIGINAL text and replace byte ranges in it. A region
nobody staged comes out byte-identical to a file KiCad already opened and accepted, which
means corruption can only ever originate inside a range we spliced. That is a small,
testable surface, and it is what makes "never write a broken file" achievable rather than
aspirational.

The ranges come from `kicad_monkey.parse_sexp_with_spans`, which reports an offset and
end_offset for every node. Verified on real boards: every span slices to a balanced
expression, and splicing all of them back yields the input unchanged.
"""

from __future__ import annotations

from dataclasses import dataclass


class SpliceError(Exception):
    """A splice was refused because it would have produced nonsense.

    Every case is OUR bug, never the user's: overlapping edits, a reversed range, an
    offset past the end of the file. The merge aborts rather than writing, because a
    board that will not open is worse than a merge that did not happen.
    """


@dataclass(frozen=True)
class Edit:
    """Replace `text[offset:end_offset]` with `replacement`.

    A deletion is an empty replacement. An insertion is a zero-width range
    (`offset == end_offset`), which is how a new footprint gets added without
    disturbing the bytes on either side of it.
    """

    offset: int
    end_offset: int
    replacement: str

    @property
    def is_insertion(self) -> bool:
        return self.offset == self.end_offset

    def __post_init__(self) -> None:
        if self.offset < 0 or self.end_offset < 0:
            raise SpliceError(f"negative offset in {self!r}")
        if self.end_offset < self.offset:
            raise SpliceError(f"reversed range in {self!r}")


def apply_edits(text: str, edits: list[Edit]) -> str:
    """Apply every edit to `text` and return the result.

    Edits are given in any order and applied back to front, so each one's offsets stay
    valid regardless of how much earlier edits grew or shrank the file.

    Raises SpliceError if two edits overlap. Overlap means we tried to replace a node and
    something inside it in the same pass, which would splice one into the middle of the
    other and produce unparseable output. The caller's job is to resolve that first (by
    dropping the descendant, since staging a parent carries its children); reaching here
    with an overlap is a bug worth failing loudly on.

    Identity law: `apply_edits(text, []) == text`.
    """
    if not edits:
        return text

    ordered = sorted(edits, key=lambda e: (e.offset, e.end_offset))
    _reject_overlaps(ordered)

    if ordered[-1].end_offset > len(text):
        raise SpliceError(
            f"edit ends at {ordered[-1].end_offset}, past the end of a "
            f"{len(text)} character file"
        )

    # Back to front: an edit's offsets refer to the ORIGINAL text, so applying the last
    # one first leaves every earlier offset still correct.
    out = text
    for edit in reversed(ordered):
        out = out[: edit.offset] + edit.replacement + out[edit.end_offset :]
    return out


def _reject_overlaps(ordered: list[Edit]) -> None:
    """Refuse two edits that touch the same bytes.

    Insertions are exempt from the touching-at-a-point case: several may share one
    offset (two footprints appended at the same place), and an insertion may sit exactly
    where a replacement begins or ends. Only genuinely overlapping RANGES are an error.
    """
    for previous, current in zip(ordered, ordered[1:], strict=False):
        if current.offset < previous.end_offset:
            raise SpliceError(
                f"edits overlap: [{previous.offset},{previous.end_offset}) and "
                f"[{current.offset},{current.end_offset}). Staging a node and "
                "something inside it in the same pass would splice one into the "
                "middle of the other."
            )


def replace(offset: int, end_offset: int, replacement: str) -> Edit:
    """Swap one node for another."""
    return Edit(offset=offset, end_offset=end_offset, replacement=replacement)


def delete(offset: int, end_offset: int, text: str | None = None) -> Edit:
    """Remove a node.

    Pass `text` to also swallow the whitespace the node was sitting on. Without it a
    deletion leaves a blank line where the node used to be: harmless to KiCad, but it
    shows up in the diff as a change nobody made, and the point of splicing is that
    untouched regions look untouched.
    """
    if text is None:
        return Edit(offset=offset, end_offset=end_offset, replacement="")

    start = offset
    while start > 0 and text[start - 1] in " \t":
        start -= 1
    if start > 0 and text[start - 1] == "\n":
        start -= 1
    return Edit(offset=start, end_offset=end_offset, replacement="")


def insert_into(text: str, parent_end_offset: int, node_text: str, indent: str) -> Edit:
    """Insert `node_text` as the last child of a node ending at `parent_end_offset`.

    The parent's own closing paren sits at `parent_end_offset - 1`, so the child goes
    immediately before it. `indent` is the child's leading whitespace, taken from a
    sibling's column so the result matches the surrounding style rather than KiCad's
    default, which may not be what this file uses.
    """
    if parent_end_offset <= 0 or parent_end_offset > len(text):
        raise SpliceError(f"parent ends at {parent_end_offset}, outside the file")

    close = parent_end_offset - 1
    if text[close] != ")":
        raise SpliceError(f"expected a closing paren at {close}, found {text[close]!r}")

    # Land before the whitespace preceding the closing paren, so we do not split the
    # parent's own indentation and leave its ")" hanging mid-line.
    at = close
    while at > 0 and text[at - 1] in " \t":
        at -= 1

    body = "\n".join(indent + line if line else line for line in node_text.splitlines())
    return Edit(offset=at, end_offset=at, replacement=body + "\n")


def indent_of(text: str, offset: int) -> str:
    """The whitespace at the start of the line `offset` falls on.

    Used to indent a spliced node like its new siblings. KiCad indents with tabs; a file
    that was hand-edited or produced by another tool may not, so this reads what is
    actually there rather than assuming.
    """
    line_start = text.rfind("\n", 0, offset) + 1
    run = 0
    while line_start + run < len(text) and text[line_start + run] in " \t":
        run += 1
    return text[line_start : line_start + run]
